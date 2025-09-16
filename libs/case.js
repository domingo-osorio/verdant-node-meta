// Found at https://stackoverflow.com/questions/52963900/convert-different-strings-to-snake-case-in-javascript#69878219
const splitCaps = string => (string
  .replace(/([a-z])([A-Z]+)/g, (m, s1, s2) => s1 + ' ' + s2)
  .replace(/([A-Z])([A-Z]+)([^a-zA-Z0-9]*)$/, (m, s1, s2, s3) => s1 + s2.toLowerCase() + s3)
  .replace(/([A-Z]+)([A-Z][a-z])/g, (m, s1, s2) => s1.toLowerCase() + ' ' + s2));
const snakeCase = string => splitCaps(string).replace(/\W+/g, " ").split(/ |\B(?=[A-Z])/).map(word => word.toLowerCase()).join('_');

const capitalize = x => x[0].toUpperCase()+x.substring(1);
const to_camel_case = pipe([split("_"), ([a, ...rest]) => [a, rest.map(capitalize)], join()]);
const to_pascal_case = pipe([to_camel_case, capitalize]);
const to_upper_snake = x => x.toUpperCase();

export {snakeCase, capitalize, to_camel_case, to_pascal_case, to_upper_snake};
