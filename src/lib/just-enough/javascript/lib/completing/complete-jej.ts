/**
 * @file JEJ-aware completion source. Orchestrates the four-phase
 * pipeline (Receive → Validate → Collect → Mark+Freeze) into a
 * single `CompletionCallback` driving CodeMirror's autocompletion
 * extension. See DOCS.md for the full sketch.
 *
 * Increment history:
 * - Inc A — identifier branch with keywords + JEJ-allowed globals,
 *   plus blocked-marker synthesis for stumbling-list labels not in
 *   the JEJ surface.
 * - Inc B — adds the Validate phase via `validate(fullText)` and
 *   scope-aware locals via `buildScope(ast).allDeclarations`
 *   (over-permissive: union of every declaration in every scope,
 *   no cursor-position awareness).
 * - Inc C (future) — adds the dot-receiver context branch + curated
 *   member union.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import validate from '../../embody/lib/validating/validate.js';
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
	const validation = validate(request.fullText);
	const suggestions = collectJejSurface(request, validation.ast);
	const items = markBlocked(suggestions);
	const prefixLower = request.prefix.toLowerCase();
	const filtered = items.filter(function matchesPrefix(item) {
		return item.label.toLowerCase().startsWith(prefixLower);
	});
	return deepFreezeInPlace(filtered);
}

export default completeJej;
