let text = 'hello';
let len = text?.length;
console.log(len);

let empty = null;
let safe = empty?.length;
console.log(safe);

let undef = undefined;
let alsoSafe = undef?.length;
console.log(alsoSafe);
