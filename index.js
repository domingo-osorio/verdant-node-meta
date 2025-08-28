import {} from './env.js';
import {} from './lang_ext.js';
import order_by_array from './order.js';

/* Knowledge */
const MILESTONE = 'milestone';
const CURRENT_MILESTONE = process.env.CURRENT_MILESTONE;
const DROPDOWNS = 'dropdowns';
// <SOURCE_DATA> will be used as reference for the original state
const SOURCE_DATA = (await import(process.env.IMPORTED_DATA, { with: { type: "json" } })).default;

/* Action resources */
// Remove meta-data (dropdowns)
const exclude_sheets = sheets_to_remove => pipe([first, is_included_at(sheets_to_remove), NOT]);

// Filter data by milestone
const filter_by_milestone = predicate => ([sheet_name, content]) => {
    const milestone_prop = pipe([first, titles => titles.indexOf(MILESTONE), prop]);
    return [sheet_name, [first(content), ...filter(pipe([milestone_prop(content), predicate]))(rest(content))]];
};

// Remove milestone column
const remove_columns = sheets_to_remove => ([sheet_name, content]) => {
    const content_without_milestones = pipe([transpose, filter(pipe([first, is_included_at(sheets_to_remove), NOT])), transpose]);
    return [sheet_name, content_without_milestones(content)];
};

/* Application */
// Register knowledge about milestones (constants and order-based accumulation)
const ordered_milestones = pipe([transpose, find(fork(first)(id)(EQ(MILESTONE))), rest, order_by_array])(SOURCE_DATA.dropdowns);

let data = JSON.parse(JSON.stringify(SOURCE_DATA)); // Clone <SOURCE_DATA> to remove the parts we don't need
data = dict.entries.filter(exclude_sheets([DROPDOWNS]))(data); // Exclude dropdowns data
data = dict.entries.map(pipe([
    filter_by_milestone(ordered_milestones.ops.LTE(CURRENT_MILESTONE)), // filter content in active milestone
    remove_columns([MILESTONE]), // remove the milestone column, as it's not needed anymore
]))(data);

print(data);