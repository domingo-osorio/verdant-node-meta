import $ from './fp.js';

Object.entries($).map(([key, value]) => global[key] = value );
const isLoaded = true;

export {isLoaded};