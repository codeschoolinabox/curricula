let count = 0;

while (count < 5) {
	console.log(count);
	count += 1;
}

let i = 0;

while (i < 10) {
	i += 1;

	if (i === 3) {
		continue;
	}

	if (i === 7) {
		break;
	}

	console.log(i);
}
