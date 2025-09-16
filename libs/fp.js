let $ = {};
$.keys = Object.keys;
$.values = Object.values;
$.entries = Object.entries;
$.pipe = fs => x => fs.reduce((p, c) => c(p), x);

$.dict = _ => {};
$.dict.from_entries = x => Object.fromEntries(x);
$.dict.entries = $.entries;
$.dict.entries.process = (
    f => g => x => $.dict.from_entries(f(g)($.entries(x)))
);
$.set = xs => [...new Set(xs)];
$.union = (xs, ys) => [...$.set([...xs, ...ys])];
$.difference = (xs, ys)=> $.set(xs).filter(x => !$.set(ys).includes(x));
$.intersection = (xs, ys) => $.difference($.difference($.union(xs, ys), $.difference(xs, ys)), $.difference(ys, xs));
$.sym_difference = (xs, ys) => $.difference($.union(xs, ys), $.intersection(xs, ys));
$.k = x => _ => x;
$.tap = f => x => { f(x); return x; };
$.print = $.tap(x => console.log(x));
$.print.json = x => $.tap($.print(JSON.stringify(x, null, 2)));
$.rest = xs => xs.slice(1);
$.first = xs => xs[0];
$.left = xs => xs[0];
$.right = xs => xs[1];
$.flip = f => a => b => f(b)(a);
$.apply = f => x => f(x);
$.call = f => f();
$.with_ = $.flip($.apply);
$.multifork = fs => x => fs.map($.with_(x));
$.split = (x = "") => xs => xs.split(x);
$.join = (x = "") => xs => xs.join(x);
$.trimmed_split = x => xs => xs.split(x).map($.trim);
$.pair = l => r => [l, r];
$.pair.with = ([l, r]) => f => f(l)(r);
$.pair.apply = $.flip($.pair.with);
$.pair.swap = ([l, r]) => [r, l];
$.is_array = x => (
    Object.prototype.toString.call(x) === '[object Array]'
);
$.clone = x => (
    $.is_array(x)
    ? Object.assign([], x)
    : Object.assign({}, x)
);
$.map = f => xs => xs.map(f);
$.reduce = f => x => xs => xs.reduce(f, x);
$.table = {};
$.table.headers = $.first;
$.table.data = $.rest;
$.table.expand = t => ({
    headers: $.table.headers(t),
    data: $.table.data(t),
});
$.prop = x => ys => ys[x];
$.transpose = xss => xss[0].map((xs,i) => xss.map(x => x[i]))
$.id = x => x;
$.fork = f => g => h => x => h(f(x),g(x));
$.fork_ = f => g => h => x => h(f(x))(g(x));
$.merge = f => g => a => b => g(f(a))(f(b));
$.pipe.pair = fs => x => y => $.pipe(fs)($.pair(x)(y));
$.find = p => xs => xs.find(p);
$.filter = p => xs => xs.filter(p);
$.NOT = x => !x;
$.EQ = x => y => x == y;
$.NEQ = x => y => x != y;
$.GT = x => y => y > x;
$.GTE = x => y => y >= x;
$.LT = x => y => y < x;
$.LTE = x => y => y <= x;

$.OR = xs => xs.reduce((p, c) => p || c, false);
$.AND= xs => xs.reduce((p, c) => p && c, true );
$.trim = x => x.trim();
$.map.dict = {};
$.dict.entries.map = $.dict.entries.process($.map);
$.dict.entries.filter = $.dict.entries.process($.filter);
$.map.arr = {};
$.map.arr.entries = f => $.pipe([$.entries, map(f)]);
$.is_included_at = xs => x => xs.includes(x);
$.starts_with = x => y => y.startsWith(x);
$.using_index = predicate => (v,i) => predicate(i);
$.is_odd = x => x%2 == 1;
$.is_even = x => x%2 == 0;

$.add = b => a => a+b;
$.add.pairs = ([bx, by]) => ([ax, ay]) => [ax+bx, ay+by];
$.scan = f => xs => {
    let ys = [xs[0]];
    xs.reduce((p, c) => {
        const v = f(p)(c);
        ys.push(v);
        return v;
    })
    return ys;
}

Error.stackTraceLimit = Infinity;
export default $;