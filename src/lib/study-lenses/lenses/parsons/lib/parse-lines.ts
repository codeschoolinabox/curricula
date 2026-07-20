// cspell:ignore distractor distractors

import type { ParsonsLine } from '../types.js';

import normalizeIndents from './normalize-indents.js';

/**
 * Split a source into solution lines and ALL distractor lines
 * (deterministic; no random selection, no shuffle). Blank/whitespace-only
 * lines and marker-only lines (empty after stripping the marker) are
 * dropped. Faithful port of the legacy JSParsons `parseCode` line walk onto
 * the id-keyed model.
 */
export default function parseLines(source: string): {
	solution: ParsonsLine[];
	distractors: ParsonsLine[];
} {
	// `rawIndent` is only meaningful for solution lines (distractors get -1
	// regardless); it is consumed by normalizeIndents over the solution
	// subset.
	type RawLine = {
		id: string;
		code: string;
		distractor: boolean;
		rawIndent: number;
	};
	const kept: RawLine[] = [];
	let idCounter = 0;
	for (const rawLine of source.split('\n')) {
		const distractor = DISTRACTOR_MARKER.test(rawLine);
		// Strip the marker (if any) and trim; trimming also removes a
		// trailing CR on CRLF source and any surrounding whitespace (legacy
		// trimRegexp).
		const code = rawLine.replace(DISTRACTOR_MARKER, '').trim();
		if (code.length === 0) {
			// blank line or marker-only line — dropped, consumes no id.
			continue;
		}
		kept.push({
			id: `line-${idCounter}`,
			code,
			distractor,
			rawIndent: leadingWhitespace(rawLine),
		});
		idCounter++;
	}

	const solutionRaw = kept.filter((line) => !line.distractor);
	const levels = normalizeIndents(solutionRaw.map((line) => line.rawIndent));
	const solution: ParsonsLine[] = solutionRaw.map((line, index) => ({
		id: line.id,
		code: line.code,
		indent: levels[index],
		distractor: false,
	}));
	const distractors: ParsonsLine[] = kept
		.filter((line) => line.distractor)
		.map((line) => ({
			id: line.id,
			code: line.code,
			indent: -1,
			distractor: true,
		}));

	return { solution, distractors };
}

/** Trailing `// distractor` marker (JS-idiom; the legacy used Python `#distractor`). */
const DISTRACTOR_MARKER = /\/\/\s*distractor\s*$/;

/** Count of leading whitespace characters on a raw source line. */
function leadingWhitespace(rawLine: string): number {
	return rawLine.length - rawLine.replace(/^\s+/, '').length;
}
