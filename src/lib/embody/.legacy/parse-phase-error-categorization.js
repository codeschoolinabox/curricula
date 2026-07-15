try {
	const iter = acorn.tokenizer(src, opts);
	while (iter.getToken().type !== acorn.tokTypes.eof) {}
} catch (e) {
	throw { ...e, subphase: 'tokenization' };
}

try {
	acorn.parse(src, opts);
} catch (e) {
	throw { ...e, subphase: 'ast-building' };
}
