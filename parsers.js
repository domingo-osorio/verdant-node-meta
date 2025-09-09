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

export {board_preset_parser,  mana_cost_parser};