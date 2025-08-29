import {order_by_array} from './libs/libs.js';

/* Knowledge */
const MILESTONE = 'milestone';
const CURRENT_MILESTONE = process.env.CURRENT_MILESTONE;
const DROPDOWNS = 'dropdowns';
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
    const content_without_milestones = pipe([
        transpose,
        filter(pipe([
            first,
            columns_to_remove_selector, //is_included_at(columns_to_remove_selector),
            NOT
        ])),
        transpose,
    ]);
    return [sheet_name, content_without_milestones(content)];
};

/* Application */
// Register knowledge about milestones (constants and order-based accumulation)
const ordered_milestones = pipe([
    transpose,
    find(fork(first)(id)(EQ(MILESTONE))),
    rest,
    order_by_array,
])(SOURCE_DATA.dropdowns);

// Clone <SOURCE_DATA> to remove the parts we don't need
let data = JSON.parse(JSON.stringify(SOURCE_DATA));

// Exclude dropdowns data
data = dict.entries.filter(exclude_sheets([DROPDOWNS]))(data);

data = dict.entries.map(pipe([
    // filter content in active milestone
    filter_by_milestone(ordered_milestones.ops.LTE(CURRENT_MILESTONE)),
    // remove marked_to_remove columns and the milestone column, as it's not needed anymore
    remove_columns(pipe([
        split([
            is_included_at([
                MILESTONE,
            ]),
            is_unused_data,
        ]), 
        OR,
    ])),
]))(data);

print(data);