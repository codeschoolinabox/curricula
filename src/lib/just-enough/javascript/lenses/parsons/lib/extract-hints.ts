import type { HintBlock } from '../types.js';

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
 * The `summary` field only selects the renderer's (Inc 10) collapsible label — EVERY
 * block renders as a collapsible `<details>` (the old "no marker → plain `<pre>`" mode
 * was dropped at the browser gate):
 * - `null` — NO `parsons-collapse:` marker → default `Hint` label.
 * - `''` (empty string) — marker present but no text after it → also the default label.
 * - non-empty string — the `<details>` summary label.
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
export default function extractHints(source: string): {
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
