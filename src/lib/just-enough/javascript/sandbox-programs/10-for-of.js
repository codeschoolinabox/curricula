for (const character of 'hello') {
	console.log(character);
}

let word = 'world';
let reversed = '';

for (const c of word) {
	reversed = c + reversed;
}

console.log(reversed);
