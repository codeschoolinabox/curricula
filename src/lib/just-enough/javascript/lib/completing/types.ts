/**
 * @file Module-internal types for the JEJ completion adapter.
 *
 * `Suggestion` is the intermediate shape threaded between
 * `collect-jej-surface` (which assembles the JEJ-allowed token union)
 * and `mark-blocked` (which overlays the blocklist + curated
 * stumbling-list to produce `CompletionItem`s).
 *
 * `StumblingEntry` is the shape of one row in the curated stumbling
 * list (`stumbling-list.ts`) — a JEJ-blocked-or-advisory label plus
 * the learner-facing tooltip prose explaining why.
 *
 * `CompletionRequest` (the editor → adapter input) lives in
 * `../../orchestrate/lib/editing/types.ts` and is consumed by name
 * here; it is the JEJ-blind shape the editing factory builds from
 * CodeMirror's `CompletionContext`.
 */

/**
 * Where a `Suggestion` came from. Used by `mark-blocked` to know
 * which `type` field to emit on the resulting `CompletionItem`
 * (passes through verbatim for non-blocked items; blocked items get
 * `type: 'blocked'` instead).
 */
export type SuggestionSource = 'keyword' | 'global' | 'local' | 'member';

/**
 * A single JEJ-surface suggestion before the blocked-marker overlay
 * runs. The `mark-blocked` pass converts each `Suggestion` into a
 * `CompletionItem`.
 */
export type Suggestion = {
	readonly label: string;
	readonly source: SuggestionSource;
};

/**
 * One row in the curated stumbling-list (`stumbling-list.ts`). Most
 * entries are JEJ-blocked labels with rich tooltip prose explaining
 * why the construct is not in JEJ; the `null` entry is
 * allowed-but-advisory (info-attached but not marked blocked, since
 * `null` is JEJ-valid).
 *
 * The prose matches the violation-message voice from
 * `embody/lib/validating/just-enough-js.ts` — terse, specific, "at
 * this language level" framing, no apologies.
 */
export type StumblingEntry = {
	readonly label: string;
	readonly info: string;
};
