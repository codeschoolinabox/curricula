let x = 10;
x += 5;
console.log(x);
x -= 3;
console.log(x);
x *= 2;
console.log(x);
x /= 4;
console.log(x);
x %= 5;
console.log(x);
x **= 3;
console.log(x);

let y = null;
y ??= 'filled';
console.log(y);

let z = '';
z ||= 'fallback';
console.log(z);

let w = 'keep';
w &&= 'replaced';
console.log(w);
