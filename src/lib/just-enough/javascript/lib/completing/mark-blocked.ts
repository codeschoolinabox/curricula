/**
 * @file Overlay JEJ-blocked labels onto the raw JEJ-surface
 * suggestions per DOCS.md § Execution phases / Mark blocked.
 *
 * Synthesizes blocked CompletionItem entries with an inline
 * `(not in JEJ)` detail flag — CodeMirror renders it next to the
 * label in the dropdown row. Rich pedagogical content (the full
 * DocEntry) lives in the linter's gutter-warning hover and in the
 * editor's word-hover (`documentJej`), not in the autocomplete
 * popup; this keeps the typing flow uncluttered with depth on
 * demand. Identifier context emits the 10 identifier-shaped labels
 * (`var`, `function`, `class`, `=>`, `this`, `throw`, `try`,
 * `import`, `async`, `await`); dot-receiver context emits the 15
 * dot-member-shaped labels (`.split`, `.constructor`,
 * `.__proto__`, etc.) — the validator's `BLOCKED_MEMBER_NAMES` set.
 *
 * Prefix-filtering and freezing happen at the orchestrator boundary
 * in `complete-jej.ts`; this function is overlay-only.
 */

import justEnoughJs from '../../embody/lib/validating/just-enough-js.js';
import type { CompletionItem } from '../../orchestrate/lib/editing/types.js';
import NOT_IN_JEJ_LABELS from '../documenting/not-in-jej-labels.js';

import type { Suggestion } from './types.js';

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
export default function markBlocked(
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

	// Step 2: synthesize blocked items with the inline detail flag.
	// The rich DocEntry is surfaced through the linter's gutter-hover
	// (see lib/linting/lint-jej.ts) and the word-hover docLookup
	// callback — NOT through the autocomplete-popup info-callback.
	const synthesized: readonly CompletionItem[] = inDotContext
		? synthesizeDotBlocked(inputLabels)
		: synthesizeIdentifierBlocked(inputLabels);

	return [...passthrough, ...synthesized];
}

function synthesizeDotBlocked(
	inputLabels: ReadonlySet<string>,
): readonly CompletionItem[] {
	const blockedMembers = justEnoughJs.blockedMemberNames ?? new Set<string>();
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
				apply: 'noop',
			};
		});
}

/** `detail` text shown inline next to the label in the dropdown row. */
const BLOCKED_DETAIL = '(not in JEJ)';
