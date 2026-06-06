/**
 * @file Parse a snippet into a Parsons exercise — vendored & slimmed from the
 * legacy `parsons.js` `parseCode` (L935) + `normalizeIndents` (L1167) +
 * `ParsonsCodeline` ctor (L794). Splits the source into solution lines and
 * distractor lines (marked `// distractor`), normalizes leading whitespace into
 * relative indent levels, selects the distractor subset, and produces the
 * initial shuffled pool.
 *
 * Three exports:
 * - `normalizeIndents` — PURE helper (raw leading-whitespace counts → relative
 *   nesting levels). The faithful port of legacy `normalizeIndents`.
 * - `parseLines` — PURE: source → `{ solution, distractors }` (ALL distractors,
 *   deterministic — no random). The testable heart of the parse.
 * - `parseParsons` — `parseLines` + the random distractor-subset selection +
 *   pool shuffle. Takes an injectable `random` (defaults to bare `Math.random`
 *   per the mechanical-conversion mandate; injection is the test seam and the
 *   documented seeded-RNG path — see `../DOCS.md` § Future direction).
 *
 * **Declined defect:** the legacy `parseCode` looped to `max_distractors` over a
 * permutation sized to the actual distractor count, pushing `undefined` past the
 * end. This port selects `min(maxDistractors, declared)` (see `../README.md`
 * § Edge cases). Eslint-ignored (vendored) per `eslint.config.mjs`.
 */

import type { HintBlock, ParsedParsons, ParsonsLine } from '../types.js';

/** Trailing `// distractor` marker (JS-idiom; legacy used Python `#distractor`). */
const DISTRACTOR_MARKER = /\/\/\s*distractor\s*$/;

/** Count of leading whitespace characters on a raw source line. */
function leadingWhitespace(rawLine: string): number {
	return rawLine.length - rawLine.replace(/^\s+/, '').length;
}

/**
 * Fisher–Yates shuffle (in place on a copy): for i from n-1 down to 1, swap
 * element i with a random index in [0, i].
 */
function shuffle<T>(items: ReadonlyArray<T>, random: () => number): T[] {
	const arr = [...items];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		const tmp = arr[i];
		arr[i] = arr[j];
		arr[j] = tmp;
	}
	return arr;
}

/**
 * Convert per-line raw leading-whitespace counts into relative nesting levels
 * (0, 1, 2, …). Faithful port of legacy `normalizeIndents`.
 *
 * @remarks
 * - line 0 → level 0 (or `-1` if it has any leading whitespace — an
 *   IndentationError sentinel).
 * - same raw indent as the previous line → same level.
 * - more raw indent than the previous line → previous level + 1.
 * - less → the level of the nearest earlier line with the same raw indent, or
 *   `-1` if none (IndentationError).
 */
export function normalizeIndents(rawIndents: ReadonlyArray<number>): number[] {
	const normalized: number[] = [];
	const matchIndent = (index: number): number => {
		for (let i = index - 1; i >= 0; i--) {
			if (rawIndents[i] === rawIndents[index]) {
				return normalized[i];
			}
		}
		return -1;
	};
	for (let i = 0; i < rawIndents.length; i++) {
		let level: number;
		if (i === 0) {
			level = rawIndents[i] !== 0 ? -1 : 0;
		} else if (rawIndents[i] === rawIndents[i - 1]) {
			level = normalized[i - 1];
		} else if (rawIndents[i] > rawIndents[i - 1]) {
			level = normalized[i - 1] + 1;
		} else {
			level = matchIndent(i);
		}
		normalized[i] = level;
	}
	return normalized;
}

/**
 * Split a snippet into solution lines and ALL distractor lines (deterministic;
 * no random selection, no shuffle). Blank/whitespace-only lines and marker-only
 * lines (empty after stripping the marker) are dropped.
 */
export function parseLines(source: string): {
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

/**
 * Extract educator hint blocks (C-style block comments) from the snippet —
 * faithful port of the legacy parsonizer (`component.js`). Each block (with its
 * surrounding HORIZONTAL whitespace) is removed from the returned `code` so it is
 * never parsed as a solution / distractor line; a block containing a
 * `parsons-collapse: <summary>` marker yields a `summary` (collapsible), else
 * `summary: null` (plain). Pure; runs BEFORE `parseLines`.
 *
 * @returns the source with block comments stripped, plus the hints in source order.
 */
// Legacy block-comment regex (faithful): a `/* … */` block PLUS its surrounding
// HORIZONTAL whitespace (newlines excluded, so an own-line block collapses to an
// empty line that `parseLines` then drops — no phantom indent). Group 1 = inner.
const BLOCK_COMMENT = /[^\S\r\n]*\/\*([\S\s]*?)\*\/[^\S\r\n]*/gm;
// A `parsons-collapse: …` marker LINE (with its trailing newline). Removed whole
// from the body so no blank line is left where the marker was.
const COLLAPSE_LINE = /^[^\S\r\n]*parsons-collapse:[^\r\n]*\r?\n?/im;

/**
 * Turn one block's inner content into a HintBlock (summary split + V2 trims).
 *
 * The `summary` field encodes how the renderer (Inc 10) shows the block:
 * - `null` — NO `parsons-collapse:` marker → render as a plain always-visible `<pre>`.
 * - `''` (empty string) — marker present but no text after it → render as a
 *   collapsible `<details>` with an empty summary label.
 * - non-empty string — collapsible `<details>` with that summary label.
 *
 * Only the FIRST `parsons-collapse:` line is treated as the marker; any later one
 * stays verbatim in the body (`COLLAPSE_LINE` is non-global).
 */
function toHintBlock(inner: string): HintBlock {
	const markerLine = inner.match(COLLAPSE_LINE);
	if (markerLine !== null) {
		// summary = the text after the marker on that line, trimmed (may be '').
		const summary = markerLine[0]
			.replace(/^[^\S\r\n]*parsons-collapse:/i, '')
			.trim();
		// body = the block minus the whole marker line, outer-trimmed.
		return { summary, body: inner.replace(COLLAPSE_LINE, '').trim() };
	}
	return { summary: null, body: inner.trim() };
}

export function extractHints(source: string): {
	code: string;
	hints: HintBlock[];
} {
	const hints: HintBlock[] = [];
	// `String.replace` with a global regex invokes the callback left-to-right (JS
	// spec), so `hints` accumulates in source order.
	const code = source.replace(BLOCK_COMMENT, (_full, inner: string) => {
		hints.push(toHintBlock(inner));
		return '';
	});
	return { code, hints };
}

/**
 * Full parse: extract hint blocks, then `parseLines` the stripped code + select
 * `min(maxDistractors, declared)` distractors (random subset) + build and shuffle
 * the initial pool of line ids.
 *
 * @param random injectable RNG in `[0,1)`; defaults to `Math.random`. Pass a
 *   deterministic stub in tests.
 */
export function parseParsons(
	source: string,
	maxDistractors: number,
	random: () => number = Math.random,
): ParsedParsons {
	const { code, hints } = extractHints(source);
	const { solution, distractors } = parseLines(code);
	const count = Math.max(0, Math.min(maxDistractors, distractors.length));
	const selected = shuffle(distractors, random).slice(0, count);
	const pool = shuffle(
		[...solution.map((l) => l.id), ...selected.map((l) => l.id)],
		random,
	);
	return { solution, distractors: selected, pool, hints };
}
