// Targets: break, continue
const nums = [1, 2, 3, 4, 5];
for (const n of nums) {
	if (n === 2) continue;
	if (n === 4) break;
	const kept = n;
}
