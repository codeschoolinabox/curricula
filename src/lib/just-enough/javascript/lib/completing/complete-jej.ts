/**
 * @file JEJ-aware completion source. Orchestrates the four-phase
 * pipeline (Receive → Validate → Collect → Mark+Freeze) into a
 * single `CompletionCallback` driving CodeMirror's autocompletion
 * extension. See DOCS.md for the full sketch.
 *
 * Inc A: identifier branch only — keywords + JEJ-allowed globals,
 *   plus blocked-marker synthesis for stumbling-list labels not in
 *   the JEJ surface. No AST inspection, no scope locals, no
 *   dot-receiver branch.
 * Inc B: adds the validate-and-parse phase + scope-aware locals.
 * Inc C: adds the dot-receiver context branch + curated member union.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type {
	CompletionItem,
	CompletionRequest,
} from '../../orchestrate/lib/editing/types.js';

import collectJejSurface from './collect-jej-surface.js';
import markBlocked from './mark-blocked.js';


/**
 * Produce the JEJ-curated completion list for a single completion
 * request.
 *
 * @param req - Structured request from the editing factory:
 *   `{prefix, precedingText, fullText}`.
 * @returns Deep-frozen array of completion items, prefix-filtered
 *   case-insensitively. Blocked tokens appear in the list with
 *   `type: 'blocked'`, `detail`, `info`, and `apply: 'noop'` per
 *   the language-level pedagogy; allowed tokens appear with `type`
 *   from their source. Advisory tokens (currently `new` and `null`)
 *   appear with source-derived `type` AND `info`.
 */
function completeJej(request: CompletionRequest): readonly CompletionItem[] {
	const suggestions = collectJejSurface(request);
	const items = markBlocked(suggestions);
	const prefixLower = request.prefix.toLowerCase();
	const filtered = items.filter((item) =>
		item.label.toLowerCase().startsWith(prefixLower),
	);
	return deepFreezeInPlace(filtered);
}

export default completeJej;
