let $ = {};
$.keys = Object.keys;
$.values = Object.values;
$.entries = Object.entries;
$.pipe = fs => x => fs.reduce((p,c) => c(p),x);

$.dict = _ =>{};
$.dict.from_entries = x => Object.fromEntries(x);
$.dict.entries = $.entries;
$.dict.entries.process = f => g => $.pipe([$.entries, f(g), $.dict.from_entries]);

$.tap = f => x => { f(x); return x; };
$.print = $.tap(x => console.log(x));
$.print.json = x => $.tap($.print(JSON.stringify(x, null, 2)));
$.rest = xs => xs.slice(1);
$.first = xs => xs[0];
$.left = xs => xs[0];
$.right = xs => xs[1];
$.flip = f => a => b => f(b)(a);
$.apply = f => x => f(x);
$.pair = l => r => [l, r];
$.pair.with = ([l, r]) => f => f(l)(r);
$.pair.apply = $.flip($.pair.with);
$.pair.swap = ([l, r]) => [r, l];
$.is_array = x => Object.prototype.toString.call(x) === '[object Array]';
$.clone = x => $.is_array(x) ? Object.assign([], x) : Object.assign({}, x);
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

$.map.dict = {};
$.dict.entries.map = $.dict.entries.process($.map);
$.dict.entries.filter = $.dict.entries.process($.filter);
$.map.arr = {};
$.map.arr.entries = f => $.pipe([$.entries, map(f)]);
$.is_included_at = xs => x => xs.includes(x);
Error.stackTraceLimit = Infinity;
export default $;