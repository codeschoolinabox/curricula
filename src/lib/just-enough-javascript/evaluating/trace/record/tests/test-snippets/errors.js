// Targets: catch, throw
try {
	throw new Error('test');
} catch (err) {
	const msg = err.message;
}
