/**
 * @file Module-internal types for the JEJ completion adapter.
 *
 * `Suggestion` is the intermediate shape threaded between
 * `collect-jej-surface` (which assembles the JEJ-allowed token union)
 * and `mark-blocked` (which overlays the blocked-label set from
 * `../documenting/not-in-jej.ts` to produce `CompletionItem`s, each
 * carrying a `DocEntry` reference for blocked items).
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
