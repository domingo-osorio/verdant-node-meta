import {order_by_array} from './libs/libs.js';

/* Knowledge */
const MILESTONE = 'milestone';
const CURRENT_MILESTONE = process.env.CURRENT_MILESTONE;
const DROPDOWNS = 'dropdowns';
const is_config_data = starts_with("__");
const is_unused_data = starts_with("_"); // data only used by game designer

// <SOURCE_DATA> will be used as reference for the original state
const SOURCE_DATA = (await import(
    process.env.IMPORTED_DATA,
    { with: { type: "json" } })
).default;

/* Action resources */
// Remove meta-data (dropdowns)
const exclude_sheets = sheets_to_remove => pipe([
    first,
    is_included_at(sheets_to_remove),
    NOT,
]);

// Filter data by milestone
const filter_by_milestone = predicate => ([sheet_name, content]) => {
    const milestone_prop = pipe([
        first,
        titles => titles.indexOf(MILESTONE),
        prop,
    ]);
    return [
        sheet_name,
        [first(content), ...filter(pipe([
            milestone_prop(content),
            predicate,
        ]))(rest(content))]
    ];
};

// Remove milestone column
const remove_columns = columns_to_remove_selector => ([sheet_name, content]) => {
    const content_without_columns = pipe([
        transpose,
        filter(pipe([
            first,
            columns_to_remove_selector, //is_included_at(columns_to_remove_selector),
            NOT
        ])),
        transpose,
    ]);
    return [sheet_name, content_without_columns(content)];
};

/* Application */
// Register knowledge about milestones (constants and order-based accumulation)
const create_ordered = column_title => sheet => pipe([
    transpose,
    find(fork(first)(id)(EQ(column_title))),
    rest,
    order_by_array,
])(sheet);

const ordered_milestones = x => create_ordered(MILESTONE)(SOURCE_DATA.dropdowns);

const group_by = selector => xs => { 
    let groups = {};
    xs.map(x => { groups[selector(x)] = selector(x) in groups ? [...groups[selector(x)], x]:[x]; });
    return groups;
};
const group_selector = x => x.type;

const prop_data = remove_columns(is_included_at(['new', 'removed']))([ "properties", SOURCE_DATA["__PROPERTIES"]])[1].filter(x =>x[0] != "");

const board_preset_parser = key => x => {
    if (!x) return [];
    const lines = x.split("\n").map(x => x.trim());
    return lines.flatMap(l => {
        const [index, positions] = l.split(":").map(trim);
        return rest(positions.split('(').map(trim)).map(x => first(x.split(')').map(trim)).split(",").map(trim).map(Number)).map((position) => [key+"_"+index, {x:position[0], y:position[1]}]);
    });
};

const mana_cost_parser = x => x == "0+"?-1:Number(x);
const maps= {
    "int": Number,
    "string": id,
    "strings": JSON.parse,
    "key": Number,
    "foreign_key": id,
    "foreign_keys": id,
    "mana_cost": mana_cost_parser,
    // "board_preset": board_preset_parser,
}

const append_to = a => b => a + b;

const to_mapper = ([prop_path, _import, mapper, key, alias]) => { 
    if (mapper == "foreign_key" && !key.includes(".")) return append_to(key+"_");
    if (mapper == "foreign_keys") {
        if (!key.includes(".")) return pipe([JSON.parse, filter(id), map(append_to(key+"_"))]);
        return pipe([JSON.parse, filter(id)]);
    }
    if (mapper == "board_preset") return board_preset_parser(key);
    
    return mapper in maps? maps[mapper]:id;
};

const prop_data_to_dicts = rest(prop_data).map(([prop_path, _import, mapper, key, alias]) => ({
        type: prop_path.split(".")[0],
        property: prop_path.split(".")[1],
        alias: alias,
        _import: "TRUE" == _import,
        mapper: to_mapper([prop_path, _import, mapper, key, alias]),
        ...(["foreign_key", "foreign_keys", "board_preset"].includes(mapper)?{key}:{}),
    })
);

const properties = group_by(group_selector)(prop_data_to_dicts);
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
        ]).map(([property, mapper], i) => [prop(i), property, mapper])
    ),
]);
const parsed_data = data_props.map(([type, [selectors, property_names, parsers]]) => 
    rest(SOURCE_DATA[type]).map(x => 
        dict.from_entries(
            transpose([split(selectors)(x), property_names, parsers])
            .map(([value, _name, parser]) => ([_name, parser(value)]))
        )
    )
);

import * as fs from 'node:fs';
print(fs.writeFileSync("./data2.json", JSON.stringify(parsed_data, null, 2)));
