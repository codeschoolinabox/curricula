const text = 'hello';
const len = text?.length;
console.log(len);

const empty = null;
const safe = empty?.length;
console.log(safe);

const undef = undefined;
const alsoSafe = undef?.length;
console.log(alsoSafe);
