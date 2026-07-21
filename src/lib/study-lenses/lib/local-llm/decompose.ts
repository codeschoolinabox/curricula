/**
 * @file Decompose a raw model reply into a {@link GenerationResult} by its
 * model-format — the pure tail of the generation seam (DOCS.md § Execution
 * phases, phase 4). Separation only: never validates, gates, or cleans.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { GenerationResult } from './types.js';

/**
 * Separates a raw model reply into its parts by model-format.
 *
 * A best-effort, lossy parse the consumer judges — never a validation. `raw` is
 * returned BYTE-EXACT (nothing here mutates it); `code` is the first fenced code
 * block's inner content, or the trimmed `raw` on a fence-miss; `thinkTrace` is a
 * `<think>` reasoning block, present only when the reply emits one.
 *
 * @param raw - The unmodified model output.
 * @returns A frozen {@link GenerationResult} — `{ raw, code, thinkTrace? }`.
 *
 * @remarks
 * Decomposition is pure and never reaches the model. `.code` may be wrong (prose
 * mistaken for code); gating it is the consumer's job, never this module's.
 */
export default function decompose(raw: string): GenerationResult {
	const code = extractFencedCode(raw);

	// `thinkTrace` exists ONLY when a complete <think> block is present; the key
	// is omitted otherwise (never an empty-string placeholder) — the optional
	// contract under exactOptionalPropertyTypes.
	const open = raw.indexOf(THINK_OPEN);
	if (open === -1) return freezeInPlace({ raw, code });

	const contentStart = open + THINK_OPEN.length;
	const close = raw.indexOf(THINK_CLOSE, contentStart);
	if (close === -1) return freezeInPlace({ raw, code });

	const thinkTrace = raw.slice(contentStart, close);
	return freezeInPlace({ raw, code, thinkTrace });
}

const FENCE = '```';
const FENCE_LINE = '\n```';
const THINK_OPEN = '<think>';
const THINK_CLOSE = '</think>';

/**
 * The first fenced block's inner content, byte-exact (separation, never
 * cleaning); the trimmed `raw` on a fence-miss or unterminated fence.
 */
function extractFencedCode(raw: string): string {
	// Skip the opening fence line (``` + optional language tag) so the tag never
	// enters `code`. The closing fence must BEGIN its own line (\n```), so a ```
	// inside the code (a backtick string literal) does not truncate the block. A
	// fence-miss, an unterminated fence, or a fence with no content line falls
	// back to the trimmed raw — separation only. indexOf is linear (no backtracking).
	const open = raw.indexOf(FENCE);
	if (open === -1) return raw.trim();

	const lineEnd = raw.indexOf('\n', open + FENCE.length);
	if (lineEnd === -1) return raw.trim();

	// Search from lineEnd (the opening line's own \n) so an empty block (```\n```)
	// resolves to '' rather than a fence-miss; slice keeps the content's final \n.
	const close = raw.indexOf(FENCE_LINE, lineEnd);
	if (close === -1) return raw.trim();

	return raw.slice(lineEnd + 1, close + 1);
}
