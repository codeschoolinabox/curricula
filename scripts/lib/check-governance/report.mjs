/**
 * The Report phase (scripts/DOCS.md § Phases, step 5): findings grouped by
 * document in corpus order, line order within a document with
 * whole-document (null-line) findings first; any error-severity finding
 * sets exit 1, advisories never do.
 *
 * @typedef {import('./types.mjs').Finding} Finding
 */

/**
 * @param {Finding[]} findings
 * @param {string[]} corpusOrder
 * @returns {{ text: string, exitCode: number }}
 */
export default function formatReport(findings, corpusOrder) {
	if (findings.length === 0) {
		return { text: 'governance corpus clean', exitCode: 0 };
	}

	const docIndex = new Map(corpusOrder.map((path, i) => [path, i]));
	const sorted = [...findings].sort((a, b) => {
		const byDoc = indexOf(docIndex, a.path) - indexOf(docIndex, b.path);
		if (byDoc !== 0) return byDoc;
		return (a.line ?? -1) - (b.line ?? -1);
	});

	/** @type {string[]} */
	const lines = [];
	let currentPath = null;
	for (const found of sorted) {
		if (found.path !== currentPath) {
			currentPath = found.path;
			lines.push(`${found.path}:`);
		}
		const where = found.line === null ? 'whole document' : `line ${found.line}`;
		lines.push(
			`  ${found.severity} [${found.check}] ${where}: ${found.message}`,
		);
	}

	const errors = findings.filter((f) => f.severity === 'error').length;
	const advisories = findings.length - errors;
	lines.push('');
	lines.push(
		`${errors} ${errors === 1 ? 'error' : 'errors'}, ${advisories} ${advisories === 1 ? 'advisory' : 'advisories'}`,
	);

	return { text: lines.join('\n'), exitCode: errors > 0 ? 1 : 0 };
}

/**
 * @param {Map<string, number>} docIndex
 * @param {string} path
 * @returns {number}
 */
function indexOf(docIndex, path) {
	return docIndex.get(path) ?? Number.MAX_SAFE_INTEGER;
}
