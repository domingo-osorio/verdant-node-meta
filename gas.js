const reference_spreadsheet = "1gcgSFnc6q7LPawJQg-HlMz7QvrvrlbHmYxp1_X_2Qpw";

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('[C]USTOM')
      .addItem('UPDATE', 'update')
      .addToUi();
} 

const transpose = xss => xss[0].map((xs,i) => xss.map(x => x[i]));
const last = xs => xs[xs.length-1];
const front = xs => xs.slice(0,xs.length-1);
const rest = xs => xs.slice(1);
const prop = x => xs => xs[x];
const split = fs => x => fs.map(f => f(x));
const CUSTOM_TAG = "CUSTOM_COLLAPSABLE_";
const UNDERSCORE = "_";
const DOUBLE_UNDERSCORE = "__";
const quoted = x => `"${x}"`;
const as_quoted_array = xs => "["+xs.map(quoted).join(", ")+"]";

const set = xs => [...new Set(xs)];
const union = (xs, ys) => [...set([...xs, ...ys])];
const difference = (xs, ys)=> set(xs).filter(x => !set(ys).includes(x));
const intersection = (xs, ys) => difference(difference(union(xs, ys), difference(xs, ys)), difference(ys, xs));
const sym_difference = (xs, ys) => difference(union(xs, ys), intersection(xs, ys));

const test_set = _ => {
  const a = [0,1,2];
  const b = [0,2,3];
  Logger.log(`A:{${a}}, B:{${b}}`);
  Logger.log(`UNION(A,B): ${union(a, b)}`);
  Logger.log(`DIFFERENCE(A,B): ${difference(a, b)}`);
  Logger.log(`DIFFERENCE(B,A): ${difference(b, a)}`);
  Logger.log(`INTERSECTION(A,B)): ${intersection(a, b)}`);
  Logger.log(`INTERSECTION(B,A): ${intersection(b, a)}`);
  Logger.log(`SYMETRIC_DIFFERENCE(A,B): ${sym_difference(a, b)}`);
  Logger.log(`SYMETRIC_DIFFERENCE(B,A): ${sym_difference(b, a)}`);
};

function update() {
  const rss = SpreadsheetApp.openById(reference_spreadsheet);
  const sheet = rss.getSheets();
  const sheet_without_excluded_sheets = sheet.filter(x => !x.getName().startsWith(UNDERSCORE));
  const sheet_as_entries = sheet_without_excluded_sheets.map(x => [x.getName(), x.getSheetValues(1,1,x.getLastRow(),x.getLastColumn())]);
  const sheets_without_excluded_titles = sheet_as_entries.map(([name, values]) => [name, transpose(transpose(values).filter(x => !x[0].startsWith(UNDERSCORE)))]);
  const sheets_to_update = sheets_without_excluded_titles.map(([name, values]) => {
    const to_collapse = [...new Set(values[0].filter(x => x.includes(UNDERSCORE)).map(x => x.split(UNDERSCORE)).filter(xs => Number(last(xs)) > 0).map(xs => front(xs).join(UNDERSCORE)))];
    const to_pair_name_prop = to_collapse.map(x => [x, values[0].map((name, i) => [name.startsWith(x)?x:"", i]).filter(pair => pair[0] == x).map(xs => xs[1])]);
    const is_custom = x => x.startsWith(CUSTOM_TAG);
    const to_collapse_pairs = to_pair_name_prop.map(([name, columns]) => [CUSTOM_TAG+name, split(columns.map(prop))]);
    const added_collapsed_entries = [
      [...values[0], ...to_collapse_pairs.map(([new_column_name, mapper]) => new_column_name)],
      ...rest(values).map(entry => [...entry, ...to_collapse_pairs.map(([new_column_name, mapper]) => as_quoted_array(mapper(entry)))])
    ];
    const uncollapsed_entries_removed = transpose(transpose(added_collapsed_entries).filter(x => !to_pair_name_prop.map(x => x[0]).find(name => x[0].startsWith(name))));
    const custom_tag_removed = [uncollapsed_entries_removed[0].map(x => is_custom(x)?x.split(UNDERSCORE).slice(2).join(UNDERSCORE): x), ...rest(uncollapsed_entries_removed)];
    return [name, custom_tag_removed];
  });
  const css = SpreadsheetApp.getActiveSpreadsheet();
  const css_sheets = css.getSheets();
  css_sheets.filter(x => !x.getName().startsWith(DOUBLE_UNDERSCORE)).map(x => css.deleteSheet(x));
  let source_properties = [];
  const types_sheet = css.getSheetByName("__TYPES");
  const types_name_alias = types_sheet.getRange(2, 1, types_sheet.getLastRow()-1, types_sheet.getLastColumn()).getValues();

  sheets_to_update.map(([name, values]) => {
    const alias = types_name_alias.find(([_name, _alias]) => _name == name);
    return [alias ? alias[1] : name, values];
  }).map(([name, values]) => {
    const sheet = css.insertSheet(name, css.getNumSheets());
  
    sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
    sheet.hideSheet();
    source_properties = [...source_properties, ...values[0].map(x => name+"."+x)];
  });
  const properties_sheet = css.getSheetByName("__PROPERTIES");
  const registered_properties_data = properties_sheet.getRange(2, 1, properties_sheet.getLastRow()-1, properties_sheet.getLastColumn()).getValues();
  const registered_properties = transpose(registered_properties_data)[0];
  const new_properties = difference(source_properties, registered_properties);
  const removed_properties = difference(registered_properties, source_properties);
  const properties_to_keep = difference(registered_properties, removed_properties);

  const new_property_row = (property) => [
    property, 
    /*_import*/ false,
    /*type_map*/ property.split(".")[1] == "id"?"key":"string", 
    /*key*/ property.split(".")[1] == "id"?property.split(".")[0]:"", 
    /*alias*/property.split(".")[1],	
    /*_new*/true,	
    /*removed*/ false
  ];
  const removed_property_row = ([property, _import, type_map, key, alias, _new, removed]) => [property, _import,	type_map, key,	alias,	_new,	true];
  const updated_rows = ([
      ...properties_to_keep.map(property => registered_properties_data.find(x => x[0]==property)),
      ...new_properties.map(new_property_row),
      ...removed_properties.map(property => removed_property_row(registered_properties_data.find(x => x[0]==property))),
    ].sort((a,b) => a[0].split(".")[0].localeCompare(b[0].split(".")[0]))
    .filter(x => x[0]!="") // Maybe this can be fixed otherway, it shouldn't be needed, it just works for now
  );
  Logger.log(updated_rows);
  properties_sheet.getRange(2, 1, updated_rows.length, updated_rows[0].length).setValues(updated_rows);
  css.getRange('__PROPERTIES!B2:B').insertCheckboxes();
  css.getRange('__PROPERTIES!F2:F').insertCheckboxes();
  css.getRange('__PROPERTIES!G2:G').insertCheckboxes();
}
