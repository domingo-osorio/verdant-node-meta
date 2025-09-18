import { to_pascal_case, to_upper_snake } from '../case.js';

let godot = {}
godot.class_name = name => `class_name ProcGen${to_pascal_case(name)}\n`;
godot.class_name.with_parent = parent => name => `${godot.class_name(name).slice(0,-1)} extends ${to_pascal_case(parent)}\n`;

const f_sign = ([name, parameters]) => `func ${name}(${join(", ")(parameters)})`;
godot.function_signature = ([name, parameters]) => `${f_sign([name, parameters])}):\n`;

godot.constant_declaration = ([_name, value]) => `const ${to_upper_snake(_name)} = ${typeof value == "string" ? `"${value}"`: value}\n`;

godot.abstract = x => `@abstract ${x}`;
godot.abstract.class_name = name => godot.abstract(class_name(name));
godot.abstract.class_name.with_parent = parent => name => godot.abstract(godot.class_name.with_parent(parent)(name));
godot.abstract.function_signature = ([name, parameters]) => godot.abstract(`${ f_sign([name, parameters]) }\n`);

export default godot;