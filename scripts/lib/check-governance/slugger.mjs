/**
 * GitHub-exact slugs for a document's headings, in order, with duplicate
 * counting. The slug contract lives in scripts/DOCS.md § Constraints; the
 * anchor fixtures there are pinned by tests/slugger.test.ts.
 *
 * @param {string[]} headingTexts
 * @returns {string[]} One slug per heading; the nth repeat gains `-{n-1}`.
 */
export default function slugify(headingTexts) {
	const seen = new Map();
	return headingTexts.map((text) => {
		const base = slugifyOne(text);
		const priorCount = seen.get(base) ?? 0;
		seen.set(base, priorCount + 1);
		return priorCount === 0 ? base : `${base}-${priorCount}`;
	});
}

/**
 * @param {string} text
 * @returns {string}
 */
function slugifyOne(text) {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9 -]/g, '')
		.replace(/ /g, '-');
}
