import type { ParsonsLine } from '../types.js';
import normalizeIndents from './normalize-indents.js';

/** Trailing `// distractor` marker (JS-idiom; legacy used Python `#distractor`). */
const DISTRACTOR_MARKER = /\/\/\s*distractor\s*$/;

/** Count of leading whitespace characters on a raw source line. */
function leadingWhitespace(rawLine: string): number {
	return rawLine.length - rawLine.replace(/^\s+/, '').length;
}

/**
 * Split a snippet into solution lines and ALL distractor lines (deterministic;
 * no random selection, no shuffle). Blank/whitespace-only lines and marker-only
 * lines (empty after stripping the marker) are dropped.
 */
export default function parseLines(source: string): {
	solution: ParsonsLine[];
	distractors: ParsonsLine[];
} {
	// `rawIndent` is only meaningful for solution lines (distractors get -1
	// regardless); it is consumed by normalizeIndents over the solution subset.
	type Raw = { id: string; code: string; distractor: boolean; rawIndent: number };
	const kept: Raw[] = [];
	let idCounter = 0;
	for (const rawLine of source.split('\n')) {
		const distractor = DISTRACTOR_MARKER.test(rawLine);
		// Strip the marker (if any) and trim; trimming also removes a trailing
		// CR on CRLF source and any surrounding whitespace (legacy trimRegexp).
		const code = rawLine.replace(DISTRACTOR_MARKER, '').trim();
		if (code.length === 0) {
			// blank line or marker-only line — dropped, consumes no id.
			continue;
		}
		kept.push({
			id: `line-${idCounter++}`,
			code,
			distractor,
			rawIndent: leadingWhitespace(rawLine),
		});
	}

	const solutionRaw = kept.filter((k) => !k.distractor);
	const levels = normalizeIndents(solutionRaw.map((k) => k.rawIndent));
	const solution: ParsonsLine[] = solutionRaw.map((k, i) => ({
		id: k.id,
		code: k.code,
		indent: levels[i],
		distractor: false,
	}));
	const distractors: ParsonsLine[] = kept
		.filter((k) => k.distractor)
		.map((k) => ({ id: k.id, code: k.code, indent: -1, distractor: true }));

	return { solution, distractors };
}
