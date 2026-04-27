let word = 'hello';
let upper = word.toUpperCase();
let len = word.length;

console.log(`${word} has ${len} characters`);

let count = 0;

for (const c of word) {
	if (c === 'l') {
		count += 1;
	}
}

console.log(`found ${count} letter l`);

let i = 0;

while (i < len) {
	let char = word[i];
	console.log(`${i}: ${char}`);
	i += 1;
}

let result = count > 0 ? 'has l' : 'no l';
console.log(result);

let rounded = Math.round(len / 2);
console.log(`midpoint: ${rounded}`);
