const a = null ?? 'default';
const b = undefined ?? 'fallback';
const c = 0 ?? 'not this';
const d = '' ?? 'not this either';
console.log(a);
console.log(b);
console.log(c);
console.log(d);

let x = null;
x ??= 'filled';
console.log(x);
