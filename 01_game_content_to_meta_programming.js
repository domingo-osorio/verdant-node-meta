import {} from './libs/libs.js';
import {constant, item_holder_type} from './libs/01_gc_to_types/initial_setup.js';


const run = async game_content => {
    save(JSON.stringify(game_content, null, 2))("./build/game_content_1.json");

    const constant_types = dict.entries.filter(([type, entities]) => !entities.find(x =>
        (difference(keys(x),['id', 'value'])).length != 0
    ))(game_content);


    let constant_types_2 = dict.entries.map(([type, data]) => [type, constant.new([type, data])])(constant_types);

    constant_types_2 = dict.entries.map(([type, data]) => [type, constant.render(data)])(constant_types_2);
    dict.entries.map(tap(([type, code]) => save(code)(`./output/code/pcg_${type}.gd`)))(constant_types_2);
    save(JSON.stringify(constant_types_2, null, 2))("./build/game_content_2.json");
    
    // dict.entries.filter(([name, data]) => pipe([is_included_at(keys(constant_types)), NOT])(name))(game_content);
    let item_holder_types = pipe([
        dict.entries.filter(([name, data]) => pipe([is_included_at(keys(constant_types)), NOT])(name)),
        dict.entries.map(([type, data]) => [type, item_holder_type.new([type, data])]),
        dict.entries.map(([type, data]) => [type, item_holder_type.render(data)]),
        dict.entries.map(tap(([type, code]) => save(code)(`./output/code/pcg_${type}.gd`))),
    ])(game_content)
    //print (item_holder_types);
    return game_content;
};
export {run};
