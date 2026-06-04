const x = 'outer';
console.log(x);

{
	const x = 'inner';
	console.log(x);

	{
		const x = 'deep';
		console.log(x);
	}

	console.log(x);
}

console.log(x);
