/**
 * The claims check: backticked references in governance prose must name
 * things that exist. Implements the recognition contract in
 * scripts/README.md § Scope of each check verbatim — command classes first,
 * then per-word path classification with the named skip classes. Findings in
 * `.claude/skills/**` documents are downgraded to advisory (peer campaigns
 * own their skills).
 *
 * @typedef {import('./types.mjs').ParsedDocument} ParsedDocument
 * @typedef {import('./types.mjs').RepoSnapshot} RepoSnapshot
 * @typedef {import('./types.mjs').Finding} Finding
 * @typedef {import('./types.mjs').Severity} Severity
 */

import resolveFrom from './resolve-from.mjs';
import resolveUtilsAlias from './utils-alias.mjs';

const INFRA_DIRS = ['.claude', 'scripts', '.github', 'eslint-rules'];
const CONVENTION_NOUNS = new Set([
	'README.md',
	'DOCS.md',
	'types.ts',
	'types.mjs',
	'index.ts',
	'tests/',
]);
const AGENTS_FILE = /^AGENTS[^/]*\.md$/;
const PLACEHOLDER = /<[^>]*>|\[[^\]]*\]/;
const PATH_CHARSET = /^[\w@./-]+$/;
const FILENAME_WITH_EXTENSION =
	/^[\w@-][\w@.-]*\.(md|mdx|ts|tsx|js|jsx|mjs|cjs|py|json|jsonc|yml|yaml|txt|css|html|svg|sh)$/;

/**
 * @param {ParsedDocument[]} parsedDocs
 * @param {RepoSnapshot} snapshot
 * @returns {Finding[]}
 */
export default function checkClaims(parsedDocs, snapshot) {
	/** @type {Finding[]} */
	const findings = [];
	for (const doc of parsedDocs) {
		const gitLists = AGENTS_FILE.test(doc.path) ? readGitVerbLists(doc) : null;
		const inSkillsDoc = doc.path.startsWith('.claude/skills/');
		for (const token of doc.tokens) {
			for (const raw of judgeToken(doc, token, gitLists, snapshot)) {
				findings.push(inSkillsDoc ? { ...raw, severity: 'advisory' } : raw);
			}
		}
	}
	return findings;
}

/**
 * @param {ParsedDocument} doc
 * @param {{ text: string, line: number }} token
 * @param {{ verbs: Set<string>, listLines: Set<number> } | null} gitLists
 * @param {RepoSnapshot} snapshot
 * @returns {Finding[]}
 */
function judgeToken(doc, { text, line }, gitLists, snapshot) {
	/** @type {Finding[]} */
	const findings = [];
	/** @type {Set<string>} */
	const consumedWords = new Set();

	for (const match of text.matchAll(/(?:^|\s)npm run\s+(\S+)/g)) {
		const script = match[1];
		consumedWords.add(script);
		if (PLACEHOLDER.test(script)) continue;
		if (!snapshot.npmScripts.includes(script)) {
			findings.push(
				finding(
					doc.path,
					line,
					`npm run ${script} names no package.json script`,
				),
			);
		}
	}
	for (const match of text.matchAll(/(?:^|\s)npx\s+(\S+)/g)) {
		const tool = match[1];
		consumedWords.add(tool);
		if (PLACEHOLDER.test(tool)) continue;
		if (!snapshot.binTools.includes(tool)) {
			findings.push(
				finding(doc.path, line, `npx ${tool} names no node_modules/.bin tool`),
			);
		}
	}
	if (gitLists && !gitLists.listLines.has(line)) {
		for (const match of text.matchAll(/(?:^|\s)git\s+([a-z][a-z-]*)/g)) {
			if (!gitLists.verbs.has(match[1])) {
				findings.push(
					finding(
						doc.path,
						line,
						`git ${match[1]} appears in neither this file's Allowed nor Forbidden list`,
					),
				);
			}
		}
	}

	for (const word of text.split(/\s+/)) {
		if (consumedWords.has(word)) continue;
		const pathFinding = judgePathWord(doc, word, line, snapshot);
		if (pathFinding) findings.push(pathFinding);
	}
	return findings;
}

/**
 * A token that is exactly a bare prefix is syntax under discussion, not a
 * claim: `./`, `../`, git's `:/` pathspec magic, or a lone
 * `<infrastructure-dir>/`.
 *
 * @param {string} word
 * @returns {boolean}
 */
function isBarePrefix(word) {
	if (word === './' || word === '../' || word === ':/') return true;
	return INFRA_DIRS.some((dir) => word === `${dir}/`);
}

/**
 * @param {ParsedDocument} doc
 * @param {string} word
 * @param {number} line
 * @param {RepoSnapshot} snapshot
 * @returns {Finding | null}
 */
function judgePathWord(doc, word, line, snapshot) {
	if (word === '' || PLACEHOLDER.test(word)) return null;
	if (word.startsWith('~/') || word.startsWith('/')) return null;
	if (CONVENTION_NOUNS.has(word)) return null;
	if (isBarePrefix(word)) return null;
	if (/[*?]/.test(word)) {
		if (snapshot.matchingGlobs.has(word)) return null;
		if (!word.includes('/')) return null;
	}

	const aliasTarget = resolveUtilsAlias(word);
	if (aliasTarget !== null) {
		if (exists(snapshot, aliasTarget)) return null;
		return finding(doc.path, line, `${word} — ${aliasTarget} does not exist`);
	}
	if (!PATH_CHARSET.test(word.replaceAll('*', 'x').replaceAll('?', 'x'))) {
		return null;
	}

	const shellInvocation = word.startsWith('./node_modules/');
	const dotRelative =
		!shellInvocation && (word.startsWith('./') || word.startsWith('../'));
	const infraPrefixed =
		dotRelative || INFRA_DIRS.some((dir) => word.startsWith(`${dir}/`));
	const segments = word.split('/');
	const pathLike =
		(word.includes('/') &&
			(infraPrefixed ||
				shellInvocation ||
				word.endsWith('/') ||
				FILENAME_WITH_EXTENSION.test(segments[segments.length - 1]))) ||
		(!word.includes('/') && FILENAME_WITH_EXTENSION.test(word));
	if (!pathLike) return null;

	if (shellInvocation) {
		if (exists(snapshot, word.slice(2))) return null;
		return finding(doc.path, line, `${word} — ${word.slice(2)} does not exist`);
	}
	const docRelative = resolveFrom(doc.path, word);
	if (dotRelative) {
		if (exists(snapshot, docRelative)) return null;
		return finding(doc.path, line, `${word} — ${docRelative} does not exist`);
	}
	if (infraPrefixed) {
		if (exists(snapshot, word)) return null;
		return finding(doc.path, line, `${word} does not exist`);
	}
	if (exists(snapshot, docRelative) || exists(snapshot, word)) return null;
	const landsInInfra = INFRA_DIRS.some((dir) =>
		docRelative.startsWith(`${dir}/`),
	);
	return {
		path: doc.path,
		line,
		check: 'claims',
		severity: landsInInfra ? 'error' : 'advisory',
		message: `${word} — neither ${docRelative} nor a root ${word} exists`,
	};
}

/**
 * The Allowed/Forbidden verb sets of an AGENTS file: each region runs from
 * its bold marker to the next bold-opening or heading line; the backticked
 * `git <verb>` entries inside define the sets and are never flagged.
 *
 * @param {ParsedDocument} doc
 * @returns {{ verbs: Set<string>, listLines: Set<number> }}
 */
function readGitVerbLists(doc) {
	/** @type {Set<string>} */
	const verbs = new Set();
	/** @type {Set<number>} */
	const listLines = new Set();
	const starts = doc.lines
		.map((line, i) => ({ line, i }))
		.filter(
			({ line }) =>
				line.startsWith('**Allowed**') || line.startsWith('**Forbidden**'),
		);
	for (const { i } of starts) {
		for (let j = i + 1; j < doc.lines.length; j += 1) {
			const line = doc.lines[j];
			if (/^\*\*/.test(line) || /^#/.test(line)) break;
			listLines.add(j + 1);
		}
		listLines.add(i + 1);
	}
	for (const token of doc.tokens) {
		if (!listLines.has(token.line)) continue;
		const match = /^git\s+([a-z][a-z-]*)/.exec(token.text);
		if (match) verbs.add(match[1]);
	}
	return { verbs, listLines };
}

/**
 * @param {RepoSnapshot} snapshot
 * @param {string} path
 * @returns {boolean}
 */
function exists(snapshot, path) {
	return snapshot.existingPaths.has(path.replace(/\/$/, ''));
}

/**
 * @param {string} path
 * @param {number} line
 * @param {string} message
 * @returns {Finding}
 */
function finding(path, line, message) {
	return { path, line, check: 'claims', severity: 'error', message };
}
