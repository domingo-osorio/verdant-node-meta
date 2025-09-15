import { dropdown_as_entities } from './libs/00_ss_to_gc/dropdown_to_entities.js';
import table from './libs/table.js';
import {
    board_preset_parser,
    mana_cost_parser,
    board_relic_slots_parser,
    waterlines_parser,
} from './parsers.js';
import { bool_parser } from './libs/google_sheets.js';

/* Knowledge */
const MILESTONE = 'milestone';
const CURRENT_MILESTONE = process.env.CURRENT_MILESTONE;
const DROPDOWN = 'dropdown';

const run = async _ => {
    // <SOURCE_DATA> will be used as reference for the original state
    let SOURCE_DATA = (await import(
        process.env.IMPORTED_DATA,
        { with: { type: "json" } })
    ).default;
    
    // Remove description table
    SOURCE_DATA = dict.entries.filter(([name, table]) => name != "description")(SOURCE_DATA);
    // Remove description table properties from list
    SOURCE_DATA["__PROPERTIES"] = SOURCE_DATA["__PROPERTIES"].filter(([id, values]) => !id.startsWith("description."));
    // Clean-up properties due to booleans by default on empty lines
    SOURCE_DATA["__PROPERTIES"] = SOURCE_DATA["__PROPERTIES"].filter(x => x[0] != "");
    // clean-up management variables at the list
    SOURCE_DATA["__PROPERTIES"] = table.drop_column.by_name.with_selector(is_included_at(['import', 'alias', 'new', 'removed']))(SOURCE_DATA["__PROPERTIES"]);

    // Generate table from the dropdowns
    const tables_from_dropdown = dropdown_as_entities(SOURCE_DATA[DROPDOWN]);
    //Add dropdowns as tables
    tables_from_dropdown.map(([table_name, table]) => SOURCE_DATA[table_name] = table);
    // Add the properties needed to handle the dropdown tables
    SOURCE_DATA["__PROPERTIES"] = [... SOURCE_DATA["__PROPERTIES"], ...(tables_from_dropdown.flatMap(([table_name, _])=> [
        [(`${table_name}.id`), "key", ""],
        [`${table_name}.value`, "string", ""],
    ]))];
    
    // Remove milestone column
    const group_by = selector => xs => { 
        let groups = {};
        xs.map(x => { groups[selector(x)] = selector(x) in groups ? [...groups[selector(x)], x]:[x]; });
        return groups;
    };

    const prop_data = SOURCE_DATA["__PROPERTIES"];
    const maps = {
        "int": Number,
        "string": id,
        "strings": JSON.parse,
        "key": Number,
        "bool": bool_parser,
        "foreign_key": id,
        "foreign_keys": id,
        "mana_cost": mana_cost_parser,
        "board_preset": board_preset_parser,
        "board_relic_slots": board_relic_slots_parser,
        "waterlines": waterlines_parser,
    }

    const to_reference = a => b => [a, Number(b)];
    const to_mapper = ([prop_path,  mapper, key]) => { 
        if (mapper == "foreign_key" && !key.includes(".")) return x => [to_reference(key)(x)];
        if (mapper == "foreign_keys") {
            if (!key.includes(".")) return pipe([JSON.parse, filter(id), map(to_reference(key))]);
            return pipe([JSON.parse, filter(id)]);
        }
        
        return mapper in maps? maps[mapper] : id;
    };

    const prop_data_to_dicts = rest(prop_data)
        .map(([prop_path, mapper, key]) => ({
            type: prop_path.split(".")[0],
            property: prop_path.split(".")[1],
            mapper: to_mapper([prop_path, mapper, key]),
            ...(["foreign_key", "foreign_keys", "board_preset"].includes(mapper)?{key}:{}),
        })
    );

    const properties = group_by(x => x.type)(prop_data_to_dicts);
    const type_mappers = dict.from_entries(
        entries(properties)
        .map(([type, props]) => [
            type,
            dict.from_entries(props.map(x => [x.property, x.mapper])),
        ])
    );

    const data_props = keys(properties).map(type => [
        type,
        transpose(
            SOURCE_DATA[type][0] // from the type first row (property names with the same order than the entries)
            .map(property => [
                property,
                type_mappers[type][property],
            ])
            .map(([property, mapper], i) => [prop(i), property, mapper])
        ),
    ]);

    let parsed_data = dict.from_entries(data_props.map(([type, [selectors, property_names, parsers]]) => 
        [
            type,
            rest(SOURCE_DATA[type]).map(x => 
                dict.from_entries(
                    transpose([multifork(selectors)(x), property_names, parsers])
                    .map(([value, _name, parser]) => ([_name, parser(value)]))
                )
            ),
        ])
        .filter(([type, data]) => type != DROPDOWN) // remove dropdown metadata from parsed data
    );

     // remove the plant units that have no id (some formulas created content and then they have been imported)
    parsed_data["plant_unit"] = parsed_data["plant_unit"].filter(x => x.id);

    // Check what types have milestone and whatnot
    const types_with_milestone    = entries(parsed_data).filter(([type, values]) =>   MILESTONE in values[0] ).map(first);
    const types_without_milestone = entries(parsed_data).filter(([type, values]) => !(MILESTONE in values[0])).map(first);

    // Collect which [type, property] are references
    const is_dependency_relationship = ([property,  type_map, key]) => ["foreign_key", "foreign_keys"].includes(type_map);
    const grouped_back_references = dict.entries.map(([key, entry]) => [
        key,
        entry.map(first).map(split('.'))
    ])(group_by(x => x[1])(prop_data.filter(is_dependency_relationship)));
    
    // filter by milestone in entities with milestone
    const current_milestone_id = parsed_data[MILESTONE].find(x => x.value == CURRENT_MILESTONE).id;
    const milestone_filtered = dict.entries.map(([type, data])=>
        is_included_at(types_with_milestone)(type)
        ? [type, data.filter(x =>x.milestone[0][1] <= current_milestone_id)]
        : [type, data]
    )(parsed_data);

    // Collect the references after filtering with milestone
    const grouped_back_referenced_entries = dict.entries.map(([key, entries]) => [
        key,
        entries.flatMap(([type, property]) => milestone_filtered[type].flatMap(prop(property))),
    ])(grouped_back_references)
    
    // remove duplicated references (we only need one to know what to keep) 
    const entry_filters = set(dict.entries(grouped_back_referenced_entries).flatMap(([key, values]) => values).map(JSON.stringify)).filter(id).map(JSON.parse);
    // map references: [type, id] => id
    const filters_grouped_by_type = dict.entries.map(([type, data]) => [type, data.map(right)])(group_by(first)(entry_filters));

    // Filter the types that are not marked by milestones by their ids being refered
    const filtered_by_ids = dict.entries.map(([type, data])=>
        is_included_at(types_without_milestone)(type)
        ? [type, data.filter(x => is_included_at(filters_grouped_by_type[type])(x.id))]
        : [type, data]
    )(milestone_filtered);

    // Infer the referenced plant unit at the board property from the plant units that the same character profile has.
    filtered_by_ids.character_profile.map(x => x.board = x.board ? x.board.map(([plant_ref, position])=> [x.plant[plant_ref-1], position]) : []);
    
    save(JSON.stringify(filtered_by_ids, null, 2))("./build/data.json");

    return filtered_by_ids;
};
export {run};