import {} from './libs/libs.js';
import {constant} from './libs/01_gc_to_types/initial_setup.js';


const run = async game_content => {
    save(JSON.stringify(game_content, null, 2))("./build/game_content_1.json");

    const constant_types = dict.entries.filter(([type, entities]) => !entities.find(x =>
        (difference(keys(x),['id', 'value'])).length != 0
    ))(game_content);


    let constant_types_2 = dict.entries.map(([type, data]) => [type, constant.new([type, data])])(constant_types);

    constant_types_2 = dict.entries.map(([type, data]) => [type, constant.render(data)])(constant_types_2);
    dict.entries.map(tap(([type, code]) => save(code)(`./output/code/pcg_${type}.gd`)))(constant_types_2);
    save(JSON.stringify(constant_types_2, null, 2))("./build/game_content_2.json");
    return game_content;
};
export {run};
