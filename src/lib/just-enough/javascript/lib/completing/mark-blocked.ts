/**
 * @file Overlay JEJ-blocked labels onto the raw JEJ-surface
 * suggestions per DOCS.md § Execution phases / Mark blocked.
 *
 * Synthesizes blocked CompletionItem entries from the
 * `documenting/not-in-jej.ts` table — the single source of truth for
 * non-JEJ pedagogical content. Identifier context emits the 10
 * identifier-shaped labels (`var`, `function`, `class`, `=>`,
 * `this`, `throw`, `try`, `import`, `async`, `await`); dot-receiver
 * context emits the 15 dot-member-shaped labels (`.split`,
 * `.constructor`, `.__proto__`, etc.) — the validator's
 * `BLOCKED_MEMBER_NAMES` set.
 *
 * Each synthesized blocked item carries the rich `DocEntry` from the
 * documenting module by reference (no clone, no spread); the
 * editing-layer renderer (`build-tooltip-dom.ts`) lifts it to a
 * structured tooltip identical to the hover surface. The UI derives
 * the "not in JEJ" badge from `entry.isJEJ === false`.
 *
 * Prefix-filtering and freezing happen at the orchestrator boundary
 * in `complete-jej.ts`; this function is overlay-only.
 */

import justEnoughJs from '../../embody/lib/validating/just-enough-js.js';
import type { CompletionItem } from '../../orchestrate/lib/editing/types.js';
import NOT_IN_JEJ_ENTRIES, {
	NOT_IN_JEJ_LABELS,
} from '../documenting/not-in-jej.js';

import type { Suggestion } from './types.js';

/** `detail` text attached to every synthesized blocked completion. */
const BLOCKED_DETAIL = '(not in JEJ)';

/**
 * Convert each `Suggestion` to a `CompletionItem` (pass-through) and
 * synthesize blocked items for JEJ-blocked labels not present in the
 * input.
 *
 * @param suggestions - Raw JEJ-surface suggestions.
 * @param inDotContext - True when the completion request is in
 *   dot-receiver context; selects the dot-member partition for
 *   synthesis.
 * @returns Read-only array of completion items, NOT yet
 *   prefix-filtered or frozen.
 */
function markBlocked(
	suggestions: readonly Suggestion[],
	inDotContext = false,
): readonly CompletionItem[] {
	const inputLabels = new Set(
		suggestions.map(function pickLabel(suggestion) {
			return suggestion.label;
		}),
	);

	// Step 1: pass-through with source-derived type. Advisory caveats
	// for `null` and `new` (JEJ-valid keywords with teaching caveats)
	// live in `documenting/keywords.ts`; this phase does not attach
	// info to JEJ-valid items.
	const passthrough: readonly CompletionItem[] = suggestions.map(
		function withType(suggestion): CompletionItem {
			return { label: suggestion.label, type: suggestion.source };
		},
	);

	// Step 2: synthesize blocked items. Each carries the rich
	// DocEntry from documenting/not-in-jej.ts by reference.
	const synthesized: readonly CompletionItem[] = inDotContext
		? synthesizeDotBlocked(inputLabels)
		: synthesizeIdentifierBlocked(inputLabels);

	return [...passthrough, ...synthesized];
}

function synthesizeDotBlocked(
	inputLabels: ReadonlySet<string>,
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
			return {
				label: name,
				type: 'blocked',
				detail: BLOCKED_DETAIL,
				entry: NOT_IN_JEJ_ENTRIES[name],
				apply: 'noop',
			};
		});
}

function synthesizeIdentifierBlocked(
	inputLabels: ReadonlySet<string>,
): readonly CompletionItem[] {
	const blockedMembers = justEnoughJs.blockedMemberNames ?? new Set<string>();
	// eslint-disable-next-line unicorn/prefer-spread -- Docusaurus/Babel mistranspiles `[...<Set>]` to `[<Set>]`; Array.from survives.
	return Array.from(NOT_IN_JEJ_LABELS)
		.filter(function isIdentifierContext(label) {
			return !blockedMembers.has(label);
		})
		.filter(function notInInput(label) {
			return !inputLabels.has(label);
		})
		.map(function asBlocked(label): CompletionItem {
			return {
				label,
				type: 'blocked',
				detail: BLOCKED_DETAIL,
				entry: NOT_IN_JEJ_ENTRIES[label],
				apply: 'noop',
			};
		});
}

export default markBlocked;
