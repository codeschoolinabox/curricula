const word = 'hello';
const upper = word.toUpperCase();
const len = word.length;

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
	const char = word[i];
	console.log(`${i}: ${char}`);
	i += 1;
}

const result = count > 0 ? 'has l' : 'no l';
console.log(result);

const rounded = Math.round(len / 2);
console.log(`midpoint: ${rounded}`);
