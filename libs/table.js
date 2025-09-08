import {} from './libs.js';


const table = {};
table.column_mode = f => pipe([transpose, f, transpose]);
table.properties = first;
table.properties.map = f => ([properties, data]) => [properties.map(f), data];
table.properties.filter = f => table.column_mode(column => column.filter((x, i, xs) => f(first(x), i, xs.map(first))));
table.properties.get_row_selector_for = property_name => pipe([table.properties, map((v, i) => [v, i]), find(([v, i]) => v == property_name), right, prop]);
table.properties.get_row_selectors_for = property_names => pipe([table.properties, map((v, i) => [v, i]), filter(([v, i]) => is_included_at(property_names)(v)), map(right), map(prop)]);
table.entries = rest;
table.entries.map = f => ([properties, data]) => [properties, data.map(f)];
table.entries.filter = f => ([properties, data]) => [properties, data.filter(f)];
table.to_array_of_dicts = ([properties, ...data]) => data.map(x => dict.from_entries(x.map((value, index) => [properties[index], value])));
table.extract_selectors = ([properties, ...data]) => dict.from_entries(properties.map((value, index) => [value, prop(index)]));
table.get_column_position_by_property = property => ([properties, ...data]) => properties.indexOf(property);
table.drop_column = {};
table.drop_column.by_name = column_to_drop => table.properties.filter(x => column_to_drop != x);
table.drop_column.by_name.with_selector = selector => table.properties.filter(pipe([selector, NOT]));
table.drop_column.by_position = n => table.properties.filter((x, i, xs) => i != n);


const test = async () =>{
     const SOURCE_DATA = (await import(
        "."+process.env.IMPORTED_DATA,
        { with: { type: "json" } })
    ).default;
    const _table = SOURCE_DATA["plant_unit"];
    // print(table.to_array_of_dicts(SOURCE_DATA["plant_unit"]));
    // print(map(([property, selector]) => `${property}: ${selector(_table[2])}`)(entries(table.extract_selectors(_table))));
    // print(table.drop_column.by_position(1)(_table));
    // print(table.drop_column.by_name.with_selector( x => x == "title")(_table));
    const selector = table.properties.get_row_selector_for("title")(_table);
    // print(selector(_table[2]));
    // print(table.drop_column.by_name.with_selector(x => x == "title")(_table));
    const selectors = table.properties.get_row_selectors_for(["title", "quality"])(_table);
    // print(selectors);
    // table.entries(_table).map(multifork(selectors)).map(print);
}
await test();

export default table;