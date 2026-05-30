/**
 * @file Overlay the curated stumbling-list onto the raw JEJ-surface
 * suggestions. Two-step process per DOCS.md § Execution phases /
 * Mark blocked:
 *
 * 1. **Pass-through with optional info attachment** — for each input
 *    suggestion, keep its `source`-derived `type`; if its label
 *    appears in the stumbling-list, attach the curated `info` (the
 *    advisory case, used for JEJ-valid labels like `new` and `null`
 *    that carry a teaching caveat).
 *
 * 2. **Blocked synthesis** — for each stumbling-list label NOT in
 *    the input suggestions, emit a synthesized blocked item with
 *    `type: 'blocked'`, `detail: '(not in JEJ)'`, `info` from the
 *    stumbling-list, and `apply: 'noop'`. This is what surfaces
 *    `var`/`class`/`function`/etc. in the popup when a learner
 *    types toward them — they are not in JEJ, so the JEJ surface
 *    never includes them; synthesis adds them so the pedagogical
 *    signal can fire.
 *
 * Prefix-filtering and freezing happen at the orchestrator boundary
 * in `complete-jej.ts`; this function is overlay-only.
 */

import type { CompletionItem } from '../../orchestrate/lib/editing/types.js';

import STUMBLING_LIST from './stumbling-list.js';
import type { Suggestion } from './types.js';

/**
 * Stumbling-list labels that describe DOT-MEMBER access (`.split`,
 * `.match`). They live in the same curated table as the
 * identifier-context blocked tokens, but they MUST NOT synthesize in
 * identifier context — a learner typing `sp` or `ma` for a keyword
 * or global has not expressed any intent toward `.split`, and
 * surfacing those labels as blocked here would be a false pedagogical
 * positive. Inc C's dot-receiver branch is where these synthesize.
 */
const MEMBER_ONLY_LABELS: ReadonlySet<string> = new Set(['split', 'match']);

/**
 * Convert each `Suggestion` to a `CompletionItem`, attaching blocked
 * markers + curated info where applicable, and synthesize blocked
 * items for stumbling-list labels not present in the input.
 *
 * @param suggestions - Raw JEJ-surface suggestions.
 * @returns Read-only array of completion items, NOT yet
 *   prefix-filtered or frozen.
 */
function markBlocked(suggestions: readonly Suggestion[]): readonly CompletionItem[] {
	const stumblingByLabel = new Map(
		STUMBLING_LIST.map(function indexByLabel(entry) {
			return [entry.label, entry] as const;
		}),
	);
	const inputLabels = new Set(
		suggestions.map(function pickLabel(suggestion) {
			return suggestion.label;
		}),
	);

	// Step 1: pass-through with optional info attachment.
	const passthrough: readonly CompletionItem[] = suggestions.map(
		function withOptionalInfo(suggestion): CompletionItem {
			const stumble = stumblingByLabel.get(suggestion.label);
			if (stumble) {
				return {
					label: suggestion.label,
					type: suggestion.source,
					info: stumble.info,
				};
			}
			return { label: suggestion.label, type: suggestion.source };
		},
	);

	// Step 2: synthesize blocked items for stumbles not in input.
	// Skip MEMBER_ONLY_LABELS (`.split`, `.match`) — they synthesize
	// in Inc C's dot-receiver branch, not here.
	const synthesized: readonly CompletionItem[] = STUMBLING_LIST
		.filter(function notInInput(stumble) {
			return !inputLabels.has(stumble.label);
		})
		.filter(function notMemberOnly(stumble) {
			return !MEMBER_ONLY_LABELS.has(stumble.label);
		})
		.map(function asBlocked(stumble): CompletionItem {
			return {
				label: stumble.label,
				type: 'blocked',
				detail: '(not in JEJ)',
				info: stumble.info,
				apply: 'noop',
			};
		});

	return [...passthrough, ...synthesized];
}

export default markBlocked;
