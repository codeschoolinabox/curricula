let a = null ?? 'default';
let b = undefined ?? 'fallback';
let c = 0 ?? 'not this';
let d = '' ?? 'not this either';
console.log(a);
console.log(b);
console.log(c);
console.log(d);

let x = null;
x ??= 'filled';
console.log(x);
