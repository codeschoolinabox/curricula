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

import justEnoughJs from '../../embody/lib/validating/just-enough-js.js';
import type { CompletionItem } from '../../orchestrate/lib/editing/types.js';

import STUMBLING_LIST from './stumbling-list.js';
import type { StumblingEntry, Suggestion } from './types.js';

/**
 * Stumbling-list labels that describe DOT-MEMBER access (`.split`,
 * `.match`). Their pass-through-and-synthesize behavior in dot
 * context is handled by the dot-context synthesizer's iteration over
 * `justEnoughJs.blockedMemberNames` (which includes them); in
 * identifier context, the identifier-context synthesizer skips them
 * via this set so they don't surface as blocked completions when a
 * learner types `sp` or `ma` for a keyword or global.
 */
const MEMBER_ONLY_LABELS: ReadonlySet<string> = new Set(['split', 'match']);

/** `detail` text attached to every synthesized blocked completion. */
const BLOCKED_DETAIL = '(not in JEJ)';

/**
 * Convert each `Suggestion` to a `CompletionItem`, attaching blocked
 * markers + curated info where applicable, and synthesize blocked
 * items for stumbling-list labels not present in the input.
 *
 * @param suggestions - Raw JEJ-surface suggestions.
 * @returns Read-only array of completion items, NOT yet
 *   prefix-filtered or frozen.
 */
function markBlocked(
	suggestions: readonly Suggestion[],
	inDotContext = false,
): readonly CompletionItem[] {
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

	// Step 2: synthesize blocked items. The two contexts emit from
	// different sources: identifier context iterates the curated
	// stumbling-list (so `var`, `class`, `function`, etc. surface as
	// blocked when learners type toward them); dot-receiver context
	// iterates the validator's blockedMemberNames set (so blocked
	// dot names like `.constructor`, `.__proto__`, `.call`, plus
	// `.split` and `.match` surface as blocked), attaching curated
	// info from the stumbling-list when present.
	const synthesized: readonly CompletionItem[] = inDotContext
		? synthesizeDotBlocked(inputLabels, stumblingByLabel)
		: synthesizeIdentifierBlocked(inputLabels);

	return [...passthrough, ...synthesized];
}

function synthesizeDotBlocked(
	inputLabels: ReadonlySet<string>,
	stumblingByLabel: ReadonlyMap<string, StumblingEntry>,
): readonly CompletionItem[] {
	const blockedMembers = justEnoughJs.blockedMemberNames ?? new Set<string>();
	// `Array.from(<Set>)` instead of `[...<Set>]` — the Docusaurus/Babel
	// transpile pipeline mangles iterable spread to a one-element array
	// wrapping the iterable (see collect-jej-surface.ts for context).
	// eslint-disable-next-line unicorn/prefer-spread -- Docusaurus/Babel mistranspiles `[...<Set>]` to `[<Set>]`; Array.from survives.
	return Array.from(blockedMembers)
		.filter(function notInInput(name) {
			return !inputLabels.has(name);
		})
		.map(function asBlockedMember(name): CompletionItem {
			const stumble = stumblingByLabel.get(name);
			if (stumble) {
				return {
					label: name,
					type: 'blocked',
					detail: BLOCKED_DETAIL,
					info: stumble.info,
					apply: 'noop',
				};
			}
			return {
				label: name,
				type: 'blocked',
				detail: BLOCKED_DETAIL,
				apply: 'noop',
			};
		});
}

function synthesizeIdentifierBlocked(
	inputLabels: ReadonlySet<string>,
): readonly CompletionItem[] {
	return STUMBLING_LIST
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
				detail: BLOCKED_DETAIL,
				info: stumble.info,
				apply: 'noop',
			};
		});
}

export default markBlocked;
