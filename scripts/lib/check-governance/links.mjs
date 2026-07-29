/**
 * The links check: every inline link in the corpus must point at a file that
 * exists and a fragment that slugs to a real heading (scripts/README.md
 * § Scope of each check). Pure: all ground truth arrives via the snapshot.
 *
 * @typedef {import('./types.mjs').ParsedDocument} ParsedDocument
 * @typedef {import('./types.mjs').RepoSnapshot} RepoSnapshot
 * @typedef {import('./types.mjs').Finding} Finding
 */

import slugify from './slugger.mjs';

/**
 * @param {ParsedDocument[]} parsedDocs
 * @param {RepoSnapshot} snapshot
 * @returns {Finding[]}
 */
export default function checkLinks(parsedDocs, snapshot) {
	const findings = [];
	for (const doc of parsedDocs) {
		const ownSlugs = new Set(slugify(doc.headings.map((h) => h.text)));
		for (const link of doc.links) {
			const finding = judgeLink(doc.path, link, ownSlugs, snapshot);
			if (finding) findings.push(finding);
		}
	}
	return findings;
}

/**
 * @param {string} docPath
 * @param {{ text: string, target: string, line: number }} link
 * @param {Set<string>} ownSlugs
 * @param {RepoSnapshot} snapshot
 * @returns {Finding | null}
 */
function judgeLink(docPath, { target, line }, ownSlugs, snapshot) {
	if (/^https?:\/\//.test(target)) return null;
	if (target.startsWith('/')) return null;
	if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return null;
	if (target.includes(' ')) return null;

	if (target.startsWith('#')) {
		if (ownSlugs.has(target.slice(1))) return null;
		return finding(
			docPath,
			line,
			`dead fragment "${target}" — no heading in this document slugs to it`,
		);
	}

	const hashAt = target.indexOf('#');
	const relative = hashAt === -1 ? target : target.slice(0, hashAt);
	const fragment = hashAt === -1 ? null : target.slice(hashAt + 1);
	const resolved = resolveFrom(docPath, relative);

	if (!snapshot.existingPaths.has(resolved)) {
		return finding(
			docPath,
			line,
			`dead link "${target}" — ${resolved} does not exist`,
		);
	}
	if (fragment === null) return null;

	const targetHeadings = snapshot.headingsByPath[resolved];
	const targetSlugs = new Set(slugify(targetHeadings ?? []));
	if (targetSlugs.has(fragment)) return null;
	return finding(
		docPath,
		line,
		`dead fragment "${target}" — no heading in ${resolved} slugs to it`,
	);
}

/**
 * Resolve a relative link target against its document's directory, in
 * repo-relative posix form.
 *
 * @param {string} docPath
 * @param {string} relative
 * @returns {string}
 */
function resolveFrom(docPath, relative) {
	const lastSlash = docPath.lastIndexOf('/');
	const docDir = lastSlash === -1 ? [] : docPath.slice(0, lastSlash).split('/');
	const segments = [...docDir];
	for (const piece of relative.split('/')) {
		if (piece === '' || piece === '.') continue;
		if (piece === '..') {
			segments.pop();
			continue;
		}
		segments.push(piece);
	}
	return segments.join('/');
}

/**
 * @param {string} path
 * @param {number} line
 * @param {string} message
 * @returns {Finding}
 */
function finding(path, line, message) {
	return { path, line, check: 'links', severity: 'error', message };
}
