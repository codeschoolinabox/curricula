/**
 * The checker's one shared parse: reduce a corpus document to checkable
 * regions (scripts/DOCS.md § Phases, step 2). Fenced lines are blanked IN
 * PLACE so every extracted line number matches the file on disk; mermaid
 * fences are additionally mined for node-label terms before blanking.
 *
 * @typedef {import('./types.mjs').CorpusDocument} CorpusDocument
 * @typedef {import('./types.mjs').ParsedDocument} ParsedDocument
 * @typedef {import('./types.mjs').ExtractedTerm} ExtractedTerm
 */

/**
 * @param {CorpusDocument} document
 * @returns {ParsedDocument}
 */
export default function parseDocument({ path, content }) {
	const rawLines = content.split('\n');
	const fences = mapFences(rawLines);

	const lines = rawLines.map((line, i) => (fences[i].fenced ? '' : line));
	const headings = extractHeadings(lines);
	const tokens = extractTokens(lines);

	const spanBlanked = lines.map(blankCodeSpans);
	const links = extractLinks(spanBlanked);
	const boldTerms = extractBold(spanBlanked, path);
	const mermaidTerms = extractMermaidNodes(rawLines, fences, path);

	const terms = [
		...headings.map(({ text, line }) => term('heading', text, line, path)),
		...boldTerms,
		...tokens.map(({ text, line }) => term('token', text, line, path)),
		...mermaidTerms,
	];

	return { path, lines, headings, links, tokens, terms };
}

/**
 * @param {string[]} rawLines
 * @returns {{ fenced: boolean, info: string | null }[]} Per-line fence state;
 *   fence marker lines count as fenced.
 */
function mapFences(rawLines) {
	/** @type {{ fenced: boolean, info: string | null }[]} */
	const states = [];
	/** @type {string | null} */
	let openInfo = null;
	let openLength = 0;
	for (const line of rawLines) {
		const marker = /^\s*(`{3,})(.*)$/.exec(line);
		const inside = openLength > 0;
		if (marker && !inside) {
			openLength = marker[1].length;
			openInfo = marker[2].trim() || null;
			states.push({ fenced: true, info: openInfo });
		} else if (marker && inside && marker[1].length >= openLength) {
			states.push({ fenced: true, info: openInfo });
			openLength = 0;
			openInfo = null;
		} else {
			states.push({ fenced: inside, info: inside ? openInfo : null });
		}
	}
	return states;
}

/**
 * @param {string[]} lines
 * @returns {{ text: string, line: number }[]}
 */
function extractHeadings(lines) {
	/** @type {{ text: string, line: number }[]} */
	const headings = [];
	lines.forEach((line, i) => {
		const match = /^#{1,6}\s+(.*)$/.exec(line);
		if (match) headings.push({ text: match[1].trim(), line: i + 1 });
	});
	return headings;
}

/**
 * Double-backtick spans first (they may contain single backticks), then
 * single spans; both single-line by construction.
 *
 * @param {string[]} lines
 * @returns {{ text: string, line: number }[]}
 */
function extractTokens(lines) {
	/** @type {{ text: string, line: number }[]} */
	const tokens = [];
	lines.forEach((line, i) => {
		let rest = line;
		for (const match of line.matchAll(/``(.+?)``/g)) {
			tokens.push({ text: match[1].trim(), line: i + 1 });
			rest = rest.replace(match[0], ' '.repeat(match[0].length));
		}
		for (const match of rest.matchAll(/`([^`]+)`/g)) {
			tokens.push({ text: match[1], line: i + 1 });
		}
	});
	return tokens;
}

/**
 * @param {string} line
 * @returns {string} The line with code spans blanked, length preserved.
 */
function blankCodeSpans(line) {
	return line
		.replace(/``.+?``/g, (span) => ' '.repeat(span.length))
		.replace(/`[^`]*`/g, (span) => ' '.repeat(span.length));
}

/**
 * @param {string[]} spanBlankedLines
 * @returns {{ text: string, target: string, line: number }[]}
 */
function extractLinks(spanBlankedLines) {
	/** @type {{ text: string, target: string, line: number }[]} */
	const links = [];
	spanBlankedLines.forEach((line, i) => {
		for (const match of line.matchAll(/\[([^\]]*)\]\(([^)]*)\)/g)) {
			links.push({ text: match[1], target: match[2], line: i + 1 });
		}
	});
	return links;
}

/**
 * @param {string[]} spanBlankedLines
 * @param {string} path
 * @returns {ExtractedTerm[]}
 */
function extractBold(spanBlankedLines, path) {
	/** @type {ExtractedTerm[]} */
	const terms = [];
	spanBlankedLines.forEach((line, i) => {
		for (const match of line.matchAll(/\*\*([^*]+)\*\*/g)) {
			terms.push(term('bold', match[1].trim(), i + 1, path));
		}
	});
	return terms;
}

/**
 * @param {string[]} rawLines
 * @param {{ fenced: boolean, info: string | null }[]} fences
 * @param {string} path
 * @returns {ExtractedTerm[]}
 */
function extractMermaidNodes(rawLines, fences, path) {
	/** @type {ExtractedTerm[]} */
	const terms = [];
	rawLines.forEach((line, i) => {
		if (!fences[i].fenced || fences[i].info !== 'mermaid') return;
		if (/^\s*```/.test(line)) return;
		for (const match of line.matchAll(/\w+\[([^\]]+)\]/g)) {
			terms.push(term('mermaid-node', match[1], i + 1, path));
		}
	});
	return terms;
}

/**
 * @param {ExtractedTerm['kind']} kind
 * @param {string} text
 * @param {number} line
 * @param {string} sourcePath
 * @returns {ExtractedTerm}
 */
function term(kind, text, line, sourcePath) {
	return { kind, term: text, line, sourcePath };
}
