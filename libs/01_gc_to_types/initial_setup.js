import godot from './godot.js';

const EMPTY_LINE = '\n';
const RENDER = 'render';

const expose_type = type => [
    godot.constant_declaration(["TYPE", type]),
    godot.constant_declaration(["XS", type + "s"]),
];

const CLASS = (_ => {
    let c = {};
    c.new = name => ({
        name,
        is_abstract: false,
        is_extended_by: "",
    });
    c.render = ({name, is_abstract, is_extended_by}) => {
        // Checks
        
        // render
        return join()([
            _class.new([name]).is_abstract(is_abstract).is_extended_by(is_extended_by).class_name(),
            EMPTY_LINE,
            ...expose_type(name),
            ...map((x) => godot.constant_declaration([x.value, x.id]))(type_entries),
        ]);
    };
    return c;
})();

const _class = (_ => {
    let type = {
        render: pipe([prop(RENDER), call]),
    };
    type.new = ([name]) => {
        let type = {
        };
        let is_abstract = true;
        let is_extended_by = "";
        
        type.is_abstract = b => { is_abstract = b; return type; }
        type.is_extended_by = x => { is_extended_by = x; return type; }

        type.class_name = _ => (
            pipe([
                is_abstract ? prop("abstract") : id,
                prop("class_name"),
                is_extended_by != "" ? pipe([prop("with_parent"), with_(is_extended_by)]) : id,
            ])(godot)
        )(name);

        return type;
    }
    return type;
})();

const constant = (_ => {
    let type = {
        render: pipe([prop(RENDER), call]),
    };

    type.new = x => {
        const structure = { LENGTH: 2 };
        if (x.length != structure.LENGTH) {
            print(`ERROR: constant types should have length of ${structure.LENGTH}: obtained ${x.length}`);
            print(`Content of parameters: ${x}`);
            print(`Content of string-ified: ${JSON.stringify(x, null, 2)}`);
        };
        let [type_name, type_entries] = x;
        let type = {};

        const type_ref_value = type_name;

        type[RENDER] = _ => join()([
            _class.new([type_ref_value]).is_abstract(true).is_extended_by("object").class_name(),
            EMPTY_LINE,
            ...expose_type(type_ref_value),
            ...map((x) => godot.constant_declaration([x.value, x.id]))(type_entries),
        ]);
        return type;
    };
    return type;
})();


export { constant };
