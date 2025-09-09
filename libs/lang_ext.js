import $ from './fp.js';
import _node from './node_fp.js';

[$, _node].map(x => Object.entries(x).map(([key, value]) => global[key] = value ));

export {};