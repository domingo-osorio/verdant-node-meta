import {} from '../libs.js';

const dropdown_as_entities = table => {
   return transpose(table).map(filter(id)).map(([entity, ...rest]) => [entity, [["id", "value"], ...rest.map((x, i) => [i+1, x])]]);
};

export {dropdown_as_entities};