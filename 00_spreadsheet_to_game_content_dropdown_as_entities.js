import * as fs from 'node:fs';
import {order_by_array} from './libs/libs.js';
import { dropdown_as_entities } from './libs/00_ss_to_gc/dropdown_to_entities.js';
import table from './libs/table.js';

/* Knowledge */
const MILESTONE = 'milestone';
const CURRENT_MILESTONE = process.env.CURRENT_MILESTONE;
const DROPDOWN = 'dropdown';
const is_config_data = starts_with("__");
const is_unused_data = starts_with("_"); // data only used by game designer
const run = async _ => {
    // <SOURCE_DATA> will be used as reference for the original state
    const SOURCE_DATA = (await import(
        process.env.IMPORTED_DATA,
        { with: { type: "json" } })
    ).default;
    const new_dropdowns = dropdown_as_entities(SOURCE_DATA[DROPDOWN]);
    
    // Remove milestone column
    const remove_columns = columns_to_remove_selector => ([sheet_name, _table]) => [
        sheet_name,
        table.drop_column.by_name.with_selector(columns_to_remove_selector)(_table)
    ];

    const group_by = selector => xs => { 
        let groups = {};
        xs.map(x => { groups[selector(x)] = selector(x) in groups ? [...groups[selector(x)], x]:[x]; });
        return groups;
    };

    const prop_data = remove_columns(is_included_at(['new', 'removed']))([ "properties", SOURCE_DATA["__PROPERTIES"]])[1].filter(x => x[0] != "");
    print(prop_data);
    const board_preset_parser = x => {
        if (!x) return [];
        return trimmed_split("\n")(x).flatMap(line => {
            const [index, positions] = trimmed_split(":")(line);
            return pipe([
                trimmed_split('('),
                rest,
                map(pipe([
                    trimmed_split(')'),
                    first,
                    trimmed_split(","),
                    map(Number),
                ])),
                map((position) => [Number(index), {x: position[0], y: position[1]}]),
            ])(positions);
        });
    };

    const mana_cost_parser = x => (x == "0+") ? -1 : Number(x);
    const dyn_eval_parser = x => {
        if (x.startsWith("[")) { return JSON.parse(x) }
        if (x == "ERROR") { print("WARNING"); return -1; }
        return Number(x);
    }
    const maps = {
        "int": Number,
        "string": id,
        "strings": JSON.parse,
        "key": Number,
        "foreign_key": id,
        "foreign_keys": id,
        "mana_cost": mana_cost_parser,
        "board_preset": board_preset_parser,
        "dyn_description": x => x.startsWith("~")? ["description", Number(x.substring(1))]:x,
        "dyn_eval_name": pipe([JSON.parse, filter(id)]),
        "dyn_eval_value": x => { 
            const data = JSON.parse(x)
            return data.map(dyn_eval_parser).filter(id);
        }
    }

    const append_to = a => b => a + b;
    const to_reference = a => b => [a, Number(b)];
    const to_mapper = ([prop_path, _import, mapper, key, alias]) => { 
        if (mapper == "foreign_key" && !key.includes(".")) return x => [to_reference(key)(x)];
        if (mapper == "foreign_keys") {
            if (!key.includes(".")) return pipe([JSON.parse, filter(id), map(to_reference(key))]);
            return pipe([JSON.parse, filter(id)]);
        }
        
        return mapper in maps? maps[mapper] : id;
    };

    const prop_data_to_dicts = rest(prop_data)
        .map(([prop_path, _import, mapper, key, alias]) => ({
            type: prop_path.split(".")[0],
            property: prop_path.split(".")[1],
            alias: alias,
            _import: "TRUE" == _import,
            mapper: to_mapper([prop_path, _import, mapper, key, alias]),
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

    const parsed_data = dict.from_entries(data_props.map(([type, [selectors, property_names, parsers]]) => 
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

    const dropdowns_by_type_map = pipe([
        filter(pipe([first, starts_with(DROPDOWN)])), // get only the properties entry that belongs to dropdown
        group_by( // group by type_map
            pipe([rest, rest, first]) // [property, import, type_map, ...] => [import, type_map, ...] => [type_map, ...] => type_map
        ),
        dict.entries.map(([key, value]) => [
            key,
            value.map(pipe([
                first, // property field "dropdown.property"
                split("."), right, // "dropdown.property" => "property"
            ]))
        ]),
    ])(prop_data);

    const orderers = pipe([
        transpose, // columns as rows (table entries)
        map(filter(id)), // remove empty values given different lengths
        map(fork_(first)(rest)(pair)), // [title, [...values]]
        filter(pipe([first, is_included_at(dropdowns_by_type_map.ordered_string)])), // filter by those ordered_string type_mapped
        map(([key, value]) => [key, order_by_array(value)]), // create the order_by_array object
        dict.from_entries,
    ])(SOURCE_DATA[DROPDOWN]);

    const types_with_milestone = entries(parsed_data).filter(([type, values]) => 
        MILESTONE in values[0]  // with milestone column
        // commented out as the only one should be dropdown and it's already filtered out
        // && "id" in values[0]    // when id is not pressent, is a meta table 
    ).map(first);
    const filtered_by_active_milestone = dict.entries.map(([type, values]) =>  {
        if (!is_included_at(types_with_milestone)(type)) return [type, values];
        return [
            type,
            values.filter(x => orderers[MILESTONE].ops.LTE(CURRENT_MILESTONE)(x[MILESTONE])),
        ];
    })(parsed_data);
    const is_dependency_relationship = ([property, _import, type_map, key, ...etc]) => ["foreign_key", "foreign_keys"].includes(type_map) && !key.includes(".");


    const grouped_back_references_1 = group_by(x => x[3])(prop_data.filter(is_dependency_relationship))
    const grouped_back_references = dict.entries.map(([key, entry]) => [key, entry.map(first).map(split('.'))])(grouped_back_references_1);
    const grouped_back_referenced_entries = dict.entries.map(([key, entries]) => [
        key,
        entries.flatMap(([type, property]) => filtered_by_active_milestone[type].flatMap(prop(property))),
    ])(grouped_back_references)
    const entry_filters = dict.entries.map(([key, values]) => [key, set(values.map(x => x[1]).map(Number))])(grouped_back_referenced_entries);

    const entry_filters_for_types_without_milestone =  dict.entries.filter(pipe([first, is_included_at(types_with_milestone), NOT]))(entry_filters);
    const filtered_by_active_milestone_and_referenced_entries = dict.entries.map( ([type, rows]) => {
        if (!(type in entry_filters_for_types_without_milestone)) return [type, rows];
        return [
            type, 
            rows.filter(pipe([prop("id"), is_included_at(entry_filters_for_types_without_milestone[type])]))
        ]
    })(filtered_by_active_milestone);

    // Clean-up process: Remove the data that is used for project management and won't end at the code.
    const milestones_removed = dict.entries.map(([type, rows]) => {
        if (!is_included_at(types_with_milestone)(type)) return [type, rows];
        return [type, rows.map(x => {
            delete x.milestone;
            return x;
        })];
    })(filtered_by_active_milestone_and_referenced_entries);

    return milestones_removed;
};
export {run};