import godot from './godot.js';

const EMPTY_LINE = '\n';
const RENDER = 'render';

const expose_type = type => [
    godot.constant_declaration(["TYPE", type]),
    godot.constant_declaration(["XS", type+"s"]),
];

const constant = (_ => {
    let type = {
        render: pipe([prop(RENDER), call]),
    };

    type.new = x => {
        const structure = { LENGTH: 2 };
        if (x.length != structure.LENGTH) {
            print(`ERROR: constant types should have length of ${structure.LENGTH}: obtained ${x.length}`);
            print(`Content of parameters: ${x}`);
            print(`Content of string-ified: ${JSON.stringify(x,null,2)}`);
        };
        let [type_name, type_entries] = x;
        let type = {};

        const type_ref_value = type_name;

        type[RENDER] = _ => join()([
            godot.class_name(type_name),
            EMPTY_LINE,
            ...expose_type(type_ref_value),
            ...map((x) => godot.constant_declaration([x.value, x.id]))(type_entries),
        ]);
        return type;
    };
    return type;
})();

export { constant };
