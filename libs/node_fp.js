import * as fs from 'node:fs';

let _node = {};
_node.save = data => file_path => fs.writeFileSync(file_path, data);

export default _node;
