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
 * - Inc C — adds the dot-receiver context branch (regex-detected
 *   from `precedingText`) + a curated ~28-entry member-name union
 *   emitted as source='member'.
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
/**
 * Whether `precedingText` ends with `<identifier>.` (allowing
 * trailing whitespace after the dot). Chained access (`x.y().`)
 * returns false because `)` is not an identifier character — chains
 * fall through to identifier context per the locked planning
 * decision.
 *
 * Implemented via string-walking rather than regex to keep the
 * ReDoS-sensitive linter happy on what would otherwise be a simple
 * `[A-Za-z_$][\w$]*$` pattern (the engine runs that in O(n) but the
 * sonarjs heuristic over-triggers on `[char][char*]$` patterns).
 */
function isDotReceiverContext(precedingText: string): boolean {
	const trimmed = precedingText.trimEnd();
	if (!trimmed.endsWith('.')) return false;
	const beforeDot = trimmed.slice(0, -1);
	let cursor = beforeDot.length;
	while (cursor > 0 && isIdentifierContinue(beforeDot.charAt(cursor - 1))) {
		cursor -= 1;
	}
	if (cursor === beforeDot.length) return false;
	return isIdentifierStart(beforeDot.charAt(cursor));
}

const IDENTIFIER_START_RE = /[A-Za-z_$]/;
const IDENTIFIER_CONTINUE_RE = /[A-Za-z0-9_$]/;

function isIdentifierStart(char: string): boolean {
	return IDENTIFIER_START_RE.test(char);
}

function isIdentifierContinue(char: string): boolean {
	return IDENTIFIER_CONTINUE_RE.test(char);
}

function completeJej(request: CompletionRequest): readonly CompletionItem[] {
	const validation = validate(request.fullText);
	const inDotContext = isDotReceiverContext(request.precedingText);
	const suggestions = collectJejSurface(request, validation.ast, inDotContext);
	const items = markBlocked(suggestions, inDotContext);
	const prefixLower = request.prefix.toLowerCase();
	const filtered = items.filter(function matchesPrefix(item) {
		return item.label.toLowerCase().startsWith(prefixLower);
	});
	return deepFreezeInPlace(filtered);
}

export default completeJej;
