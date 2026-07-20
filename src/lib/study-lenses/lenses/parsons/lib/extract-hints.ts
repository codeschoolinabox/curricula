// cspell:ignore distractor parsonizer

import type { HintBlock } from '../types.js';

/**
 * Extract educator hint blocks (C-style block comments) from the source —
 * faithful port of the legacy JSParsons parsonizer block-comment
 * extraction. Each block (with its surrounding HORIZONTAL whitespace) is
 * removed from the returned `code` so it is never parsed as a solution /
 * distractor line; a block containing a `parsons-collapse: <summary>`
 * marker yields a `summary` label, else `summary: null`. Pure; runs BEFORE
 * `parseLines`.
 *
 * @returns the source with block comments stripped, plus the hints in
 *   source order.
 */
export default function extractHints(source: string): {
	code: string;
	hints: HintBlock[];
} {
	const hints: HintBlock[] = [];
	// `String.replaceAll` with a global regex invokes the callback
	// left-to-right (JS spec), so `hints` accumulates in source order.
	const code = source.replaceAll(
		BLOCK_COMMENT,
		function collectHint(_full, inner: string) {
			hints.push(toHintBlock(inner));
			return '';
		},
	);
	return { code, hints };
}

// Legacy block-comment regex (faithful): a block comment PLUS its
// surrounding HORIZONTAL whitespace (newlines excluded, so an own-line block
// collapses to an empty line that `parseLines` then drops — no phantom
// indent). Group 1 = inner content.
// eslint-disable-next-line sonarjs/slow-regex -- vendored legacy JSParsons regex, preserved verbatim; the input is the learner's own program in their own browser, not an untrusted service boundary
const BLOCK_COMMENT = /[^\S\n\r]*\/\*([\S\s]*?)\*\/[^\S\n\r]*/gm;
// A `parsons-collapse: …` marker LINE (with its trailing newline). Removed
// whole from the body so no blank line is left where the marker was.
// eslint-disable-next-line sonarjs/slow-regex -- vendored legacy JSParsons regex, preserved verbatim; same trust boundary as BLOCK_COMMENT above
const COLLAPSE_LINE = /^[^\S\n\r]*parsons-collapse:[^\n\r]*\r?\n?/im;

/**
 * Turn one block's inner content into a HintBlock (summary split + trims).
 *
 * The `summary` field only selects the component's collapsible label —
 * EVERY block renders as a collapsible `<details>`:
 * - `null` — NO `parsons-collapse:` marker → default `Hint` label.
 * - `''` (empty string) — marker present but no text after it → also the
 *   default label.
 * - non-empty string — the `<details>` summary label.
 *
 * Only the FIRST `parsons-collapse:` line is treated as the marker; any
 * later one stays verbatim in the body (`COLLAPSE_LINE` is non-global).
 */
function toHintBlock(inner: string): HintBlock {
	const markerLine = COLLAPSE_LINE.exec(inner);
	if (markerLine !== null) {
		// summary = the text after the marker on that line, trimmed (may be '').
		const summary = markerLine[0]
			.replace(/^[^\S\n\r]*parsons-collapse:/i, '')
			.trim();
		// body = the block minus the whole marker line, outer-trimmed.
		return { summary, body: inner.replace(COLLAPSE_LINE, '').trim() };
	}
	return { summary: null, body: inner.trim() };
}
