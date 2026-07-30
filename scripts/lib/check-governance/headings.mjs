/**
 * The headings check: a term presence diff aimed at HEAD as the source and
 * the working corpus as the destination set, filtered to heading-kind terms,
 * reporting advisories (scripts/DOCS.md § Data flow). Note the argument
 * order relative to the core: checkHeadings(working, baseline) delegates to
 * presenceDiff(baselineTerms, workingTerms) — baseline is the SOURCE whose
 * losses are hunted.
 *
 * @typedef {import('./types.mjs').ParsedDocument} ParsedDocument
 * @typedef {import('./types.mjs').Finding} Finding
 */

import presenceDiff from './presence-diff.mjs';

/**
 * @param {ParsedDocument[]} workingDocs
 * @param {ParsedDocument[]} baselineDocs
 * @returns {Finding[]}
 */
export default function checkHeadings(workingDocs, baselineDocs) {
	const baselineHeadings = baselineDocs
		.flatMap((doc) => doc.terms)
		.filter((term) => term.kind === 'heading');
	const workingTerms = workingDocs.flatMap((doc) => doc.terms);
	return presenceDiff(baselineHeadings, workingTerms).map((loss) => ({
		path: loss.sourcePath,
		line: loss.line,
		check: 'headings',
		severity: 'advisory',
		message: `heading "${loss.term}" existed at HEAD and is missing from the entire working corpus`,
	}));
}
