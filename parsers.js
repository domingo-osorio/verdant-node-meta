import {} from './libs/libs.js';

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

const get_positions_in_2d_where = predicate => xss => { /* it switches from [y, x] to [x, y] */
    let positions = [];
    xss.map((v, row) => v.map((v, col) => { if (predicate(v)) {positions.push([col,row])}}));
    return positions
}

const board_relic_slots_parser = x => {
    const data = JSON.parse(x.replaceAll("\n","\\n")).map(trimmed_split("\n")).map(filter(id)).filter(x => x.length)
    if (!data.length) return [];
    let rune;
    const valid_rune_tiles = [
        "┌","┬","┐",
        "├","┼","┤",
        "└","┴","┘", (rune = "◊"),
    ];
    let influenced;
    const valid_area_tiles = [(influenced = '█'),'░'];
    
    const filter_data = (line_predicate, valid_values) =>pipe([
        map(filter(using_index(line_predicate))),
        map(pipe([
            map(split()),
            map(filter(is_included_at(valid_values))),
        ])),
    ])(data);
    const relic_data = filter_data(is_even, valid_rune_tiles);
    const area_data =  filter_data(is_odd , valid_area_tiles);
    const relic_positions = map(get_positions_in_2d_where(EQ(rune)))(relic_data);
    const area_positions =  map(get_positions_in_2d_where(EQ(influenced)))(area_data);
    return transpose([relic_positions, area_positions]);
};

const waterlines_parser = x => {
    let waterlines = JSON.parse(x).filter(id);
    waterlines = waterlines.map(x => x.split(":"))
    const [p0 , p1 , p2 , p3, p4] = [[0, 0],[1, 0],[2, 0],[3, 0],[4, 0]];
    const [p15,               p5] = [[0, 1],                     [4, 1]];
    const [p14,               p6] = [[0, 2],                     [4, 2]];
    const [p13,               p7] = [[0, 3],                     [4, 3]];
    const [p12, p11, p10, p9, p8] = [[0, 4],[1, 4],[2, 4],[3, 4],[4, 4]];
    const pmap = [p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15];
    const movement = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
    waterlines = waterlines.map(([trigger_num, initial_position, path]) => [Number(trigger_num),pmap[Number(initial_position)],path.split("").map(x => movement[x])]);
    waterlines = waterlines.map(([trigger_num, initial_position, path]) => [trigger_num, scan(add.pairs)([initial_position, ...path])]);
    return waterlines;
};

export {board_preset_parser,  mana_cost_parser, board_relic_slots_parser, waterlines_parser};