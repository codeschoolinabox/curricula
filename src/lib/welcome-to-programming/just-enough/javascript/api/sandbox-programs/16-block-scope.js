let x = 'outer';
console.log(x);

{
	let x = 'inner';
	console.log(x);

	{
		let x = 'deep';
		console.log(x);
	}

	console.log(x);
}

console.log(x);
