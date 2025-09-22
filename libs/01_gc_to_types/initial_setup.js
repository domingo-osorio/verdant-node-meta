import { to_pascal_case, to_upper_snake } from '../case.js';
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
        constant_decl: [],

    });
    c.add_constant = pair_name_value => _class => { _class.constant_decl.push(pair_name_value); return _class; };
    c.set_abstract = bool_           => _class => { _class.is_abstract = bool_;                 return _class; };
    c.set_parent   = class_          => _class => { _class.is_extended_by = class_.name;        return _class; };
    c.render = ({name, is_abstract, is_extended_by, constant_decl}) => {
        // Checks
        
        // render
        return join()([
            _class.new([name]).is_abstract(is_abstract).is_extended_by(is_extended_by).class_name(),
            EMPTY_LINE,
            ...expose_type(name),
            ...map(godot.constant_declaration)(constant_decl),
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
            join('\n')(map((x) => `const ${to_upper_snake(`${type_name}_${x.id}`)} = ${to_upper_snake(x.value)}`)(type_entries)),
            EMPTY_LINE,
        ]);
        return type;
    };
    return type;
})();



const item_holder_type = (_ => {
    let type = {
        render: pipe([prop(RENDER), call]),
    };

    type.new = x => {
        let [type_name, type_entries] = x;
        let type = {};

        const type_ref_value = type_name;
                
        const inner_type_mapper_or_default = (item) => item == "type" ? `${type_name}_type`: item;
        
        const value_is_ref = value => (
            is_array(value) && 
            !value.find(pipe([is_array, NOT])) && 
            value.find(pipe([find(is_array), NOT])) && 
            !value.find(pipe([first, is_string, NOT])) && 
            !value.find(pipe([right, is_number, NOT]))
        )

        const obj_to_godot = x => pipe([
            entries,
            map(([key, value]) => `${to_upper_snake(inner_type_mapper_or_default(key))}: ${
                value_is_ref((value))
                ? `[\n\t\t${join(",\n\t\t")(value.map((value => `ProcGen${(to_pascal_case((value)[0]))}.${to_upper_snake(value[0])}_${value[1]}`)))}\n\t]` 
                : ((JSON.stringify(value) =="") ? "[]": JSON.stringify(value))
            }`),
            join(",\n\t"),
            x => `{\n\t${x}\n}`
        ])(x);//JSON.stringify;

        let properties = type_entries.reduce((p,c) => set([...p, ...keys(c)]),[]).map(inner_type_mapper_or_default);
        
        type[RENDER] = _ => join()([
            _class.new([type_ref_value]).is_abstract(true).is_extended_by("object").class_name(),
            ...expose_type(type_ref_value),
            join('\n')(map(x => `const ${to_upper_snake(x)} = "${x}"`)(properties)),
            EMPTY_LINE,
            EMPTY_LINE,
            join('\n')(map(pipe([x => [x.id, x], ([id, item]) => `const ${to_upper_snake(type_ref_value+"_"+id)} = ${obj_to_godot(item)}`]))(type_entries)),
            EMPTY_LINE,
            EMPTY_LINE,
            `const ${to_upper_snake(`${type_ref_value}s`)} = [\n\t${
                join(',\n\t')(map(pipe([x => [x.id, x], ([id, item]) => to_upper_snake(type_ref_value+"_"+id)]))(type_entries))
            }\n]`,
            EMPTY_LINE,
        ]);
        return type;
    };
    return type;
})();


export { constant, item_holder_type};
