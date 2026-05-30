/**
 * @file Curated stumbling-list — JEJ-blocked-or-advisory labels with
 * learner-facing tooltip prose. The list mixes two kinds of entries:
 *
 * - **Blocked stumbles** — labels JEJ rejects (`var`, `class`,
 *   `function`, etc.). When the learner types toward one, the
 *   blocked-marker overlay synthesizes a popup item showing
 *   `(not in JEJ)` plus the curated prose; pressing Enter dismisses
 *   the popup without inserting (via the `apply: 'noop'` sentinel).
 *
 * - **Advisory stumbles** — labels JEJ allows but with a teaching
 *   caveat (currently `new` — "only allowed with Date" — and `null`
 *   — "prefer 'undefined' as the conventional 'no value' marker").
 *   These appear as normal suggestions (source-derived `type`) with
 *   the curated prose attached to `info`; no blocked marker, no
 *   `apply: 'noop'`.
 *
 * The voice mirrors the validator's violation messages in
 * `embody/lib/validating/just-enough-js.ts` — terse, specific, "at
 * this language level" framing, no apologies.
 *
 * The blocked/advisory partition is encoded by `ADVISORY_STUMBLES`
 * below — anything in `STUMBLING_LIST` whose label is not in
 * `ADVISORY_STUMBLES` is treated as blocked. The derived
 * `BLOCKED_STUMBLES` export consumes this rule for downstream
 * drift-guard tests in `lib/documenting/tests/`.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { StumblingEntry } from './types.js';

const STUMBLING_LIST: readonly StumblingEntry[] = deepFreezeInPlace([
	{
		label: 'var',
		info: "'var' declarations are not allowed at this language level — use 'let' (for values that change) or 'const' (for values that don't).",
	},
	{
		label: 'function',
		info: "Function declarations are not allowed at this language level — JEJ runs as a flat script. Reach for inline expressions; if you find yourself repeating, that's a sign the exercise scope is wrong.",
	},
	{
		label: 'class',
		info: "'class' is not allowed at this language level — JEJ programs use only primitive values and the small set of built-in objects ('Math', 'String', etc.).",
	},
	{
		label: 'new',
		info: "'new' is only allowed with 'Date' at this language level (e.g. 'new Date()'). No other constructors are available.",
	},
	{
		label: '=>',
		info: 'Arrow functions are not allowed at this language level — JEJ programs do not define functions.',
	},
	{
		label: 'this',
		info: "'this' is not allowed at this language level — JEJ has no functions or classes for it to refer to.",
	},
	{
		label: 'null',
		info: "Available, but 'undefined' is the conventional 'no value' marker in JEJ. Use 'null' only when you deliberately need to distinguish \"set to nothing\" from \"never set\".",
	},
	{
		label: 'throw',
		info: "'throw' is not allowed at this language level — JEJ programs do not handle exceptions. If a check fails, return early or 'console.error' the cause.",
	},
	{
		label: 'try',
		info: "'try/catch' is not allowed at this language level — JEJ programs do not handle exceptions.",
	},
	{
		label: 'import',
		info: 'Module syntax is not allowed at this language level — JEJ programs are single-file scripts.',
	},
	{
		label: 'async',
		info: "'async' is not allowed at this language level — JEJ has no functions to be async.",
	},
	{
		label: 'await',
		info: "'await' is not allowed at this language level — JEJ programs are synchronous.",
	},
	{
		label: 'split',
		info: "Property '.split' is not available at this language level — it returns an array, and arrays are out of scope. To inspect characters use '.charAt(i)' inside a 'for' loop over '.length'.",
	},
	{
		label: 'match',
		info: "Property '.match' is not available at this language level — it returns an array. For pattern checks at JEJ scope, reach for '.includes', '.startsWith', or '.endsWith'.",
	},
] as readonly StumblingEntry[]);

export default STUMBLING_LIST;

/**
 * Labels in `STUMBLING_LIST` that JEJ **allows** but flags with a teaching
 * caveat (the "advisory" partition described in this file's @file doc).
 * The completer does not branch on this — both kinds of stumble flow
 * through the same `info`-attached suggestion path. The export exists so
 * downstream modules (e.g. `lib/documenting/`) can derive the
 * complementary `BLOCKED_STUMBLES` set without re-hardcoding the
 * partition.
 */
const ADVISORY_STUMBLES: ReadonlySet<string> = new Set(['null', 'new']);

/**
 * Labels in `STUMBLING_LIST` that JEJ **rejects** (the "blocked stumble"
 * partition). Derived from `STUMBLING_LIST` minus `ADVISORY_STUMBLES`,
 * so adding a new blocked entry to `STUMBLING_LIST` automatically grows
 * this set; adding a new advisory entry requires a one-line update to
 * `ADVISORY_STUMBLES` above. Consumed by `lib/documenting/` to assert
 * keyset equivalence between its `not-in-jej.ts` partition and the
 * stumbling-list partition.
 */
export const BLOCKED_STUMBLES: ReadonlySet<string> = new Set(
	STUMBLING_LIST.map(function pickLabel(entry) {
		return entry.label;
	}).filter(function notAdvisory(label) {
		return !ADVISORY_STUMBLES.has(label);
	}),
);
