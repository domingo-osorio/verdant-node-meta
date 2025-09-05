import {} from './lang_ext.js';

const order_by_array = (xs) => {
    const iof = x => xs.indexOf(x);
    let $ = xs;
    $.ops = entries({ EQ, NEQ, GT, GTE, LTE, LT })
            .reduce((p, [key, value]) => ({...p, [key]: merge(iof)(value) }), {});
    $.ops.iof = iof;
    return $;
};

const test = _ => {
    const [a, b] = ["a", "b"];
    const ordered_array = [a, b];
    const order = order_by_array(ordered_array).ops;
    const [a_b, b_b, b_a] = [[a, b], [b, b], [b, a]].map(pair.with);
    entries(order)
        .filter(([key, value]) => key != "values")
        .map(([key, value]) => entries({a_b, b_b, b_a}).map(([_k, _v]) => `${key}(${_k}):${_v(value)}`))
        .map(print);
};
// test();
export default order_by_array;