// Targets: check (for-in), loop variable declare/init
const obj = { a: 1, b: 2 };
for (const key in obj) {
	const val = obj[key];
}
