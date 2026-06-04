/**
 * @file Types for the editor module.
 *
 * Defines the callback contracts, data shapes, and public API types
 * for the CodeMirror editor factory. Callbacks are pure functions that
 * never see or return CodeMirror types — the editor translates between
 * these shapes and CM internals.
 */

// ─── Language identifiers ───────────────────────────────────

/**
 * All language identifiers the editor can detect and highlight.
 *
 * @remarks `'plaintext'` is the fallback for unrecognized extensions.
 * `'yaml'` is detected but has no CodeMirror language package —
 * the editor falls back to no syntax highlighting.
 */
type DetectedLanguage =
	| 'javascript'
	| 'typescript'
	| 'python'
	| 'html'
	| 'css'
	| 'markdown'
	| 'json'
	| 'xml'
	| 'yaml'
	| 'openqasm2'
	| 'plaintext';

// ─── Callback data shapes ───────────────────────────────────

/**
 * A diagnostic produced by a linter callback.
 *
 * @remarks Lines are 1-based, columns are 0-based — matching
 * acorn's output and the JeJ `Violation` type. The `'rejection'`
 * severity is mapped to CM's `'warning'` internally, signaling a
 * teaching-boundary rather than a syntax error.
 *
 * `entry` is an optional rich-content payload for the hover tooltip
 * over the diagnostic's gutter marker. When present, the editing
 * layer replaces the plain-message render with a structured DOM
 * lifted from the DocEntry (same renderer the hover surface uses).
 * JEJ-aware linters set it; non-JEJ linters can leave it unset.
 */
type LintDiagnostic = {
	readonly line: number;
	readonly column: number;
	readonly endLine?: number;
	readonly endColumn?: number;
	readonly severity: 'error' | 'warning' | 'rejection';
	readonly message: string;
	readonly source?: string;
	readonly entry?: DocumentEntry;
};

/**
 * Documentation entry for a hovered keyword.
 *
 * @remarks The editor builds a styled tooltip DOM from this data.
 * `description` and `isJEJ` are required; optional fields are rendered
 * conditionally when present.
 *
 * `isJEJ` is the structural in/out boundary for the JEJ language
 * level. The UI derives the "not in JEJ" badge from `isJEJ: false`;
 * DocEntry does not store display text. Set `whyNotInJej` only on
 * `isJEJ: false` entries — see `lib/documenting/README.md` § Glossary
 * for the field's pedagogical scope.
 */
type DocumentEntry = {
	readonly description: string;
	readonly isJEJ: boolean;
	readonly example?: string;
	readonly commonMistakes?: readonly string[];
	readonly whenToUse?: string;
	readonly whyNotInJej?: string;
};

/**
 * What the editor hands to a completion callback.
 *
 * @remarks `prefix` is the bare word-fragment under the cursor
 * (the editor extracts it by matching word characters before the
 * cursor). `precedingText` is the text on the current line from
 * line-start to the prefix-start — callers use it for dot-receiver
 * context detection without seeing CodeMirror types. `fullText` is
 * the entire snippet, available for callbacks that need to parse or
 * do scope analysis.
 *
 * Named "request" rather than "context" so the JEJ-side adapters
 * stay CM-blind; the editor translates CM's internal
 * `CompletionContext` into this shape.
 */
type CompletionRequest = {
	readonly prefix: string;
	readonly precedingText: string;
	readonly fullText: string;
};

/**
 * A single item in the autocompletion dropdown.
 *
 * @remarks `apply === 'noop'` is a sentinel that asks the editor to
 * dismiss the popup on Enter instead of inserting the label — used so
 * a learner can see the blocked vocabulary without the keystroke
 * landing.
 *
 * `info` is markdown-flavored single-paragraph prose for adapters
 * that produce plain-text tooltips (e.g. non-JEJ adapters). `entry`
 * is a structured `DocEntry` carrying the same shape the hover
 * surface returns; the editor's autocompletion lift prefers `entry`
 * when present (rich rendering with `description` / `example` /
 * `whenToUse` / `commonMistakes` / `whyNotInJej` sections + an
 * isJEJ-derived badge) and falls back to `info` otherwise. The JEJ
 * adapter sets `entry` for blocked items and leaves `info` unset.
 */
type CompletionItem = {
	readonly label: string;
	readonly type?: string;
	readonly detail?: string;
	readonly info?: string;
	readonly entry?: DocumentEntry;
	readonly apply?: 'noop';
};

/**
 * Result passed to the `onFormat` callback after formatting.
 */
type FormatResult = {
	readonly original: string;
	readonly formatted: string;
	readonly changed: boolean;
};

// ─── Callback signatures ────────────────────────────────────

/**
 * Formats code and returns the formatted string.
 *
 * May be sync or async. The editor accepts both via `Promise.resolve()`.
 */
type FormatCallback = (code: string) => string | Promise<string>;

/**
 * Analyzes code and returns lint diagnostics.
 */
type LinterCallback = (code: string) => readonly LintDiagnostic[];

/**
 * Looks up documentation for a hovered word.
 */
type DocumentLookupCallback = (word: string) => DocumentEntry | null;

/**
 * Returns completion items matching the request's prefix.
 *
 * @remarks The callback is JEJ-blind from the editor's perspective —
 * it receives a structured `CompletionRequest` (built from
 * CodeMirror's internal context) and returns plain shape data. The
 * editor lifts `apply: 'noop'` and `info` strings into CM-side
 * behavior internally.
 */
type CompletionCallback = (request: CompletionRequest) => readonly CompletionItem[];

/**
 * Receives the result of a format operation.
 */
type FormatResultCallback = (result: FormatResult) => void;

/**
 * Receives the editor's new content on every `docChanged` transaction.
 *
 * @remarks Fires synchronously inside CodeMirror's update listener with
 * the full document as a plain string. Each docChanged transaction
 * produces exactly one invocation — no batching, no debouncing.
 * Consumers depending on a 1:1 transaction-to-callback mapping (e.g.
 * the orchestrator's F2.5 cache invalidation) can rely on this
 * contract.
 *
 * **Re-entrancy constraint.** Do NOT dispatch synchronously back into
 * the editor from inside this callback (e.g. `editor.content = ...`
 * or any path that invokes `view.dispatch(...)`). CodeMirror prohibits
 * nested dispatches and will throw `"Calls to EditorView.dispatch are
 * not allowed while the view is updating"`. The editor catches that
 * throw at the boundary and warns, so the editor stays alive, but the
 * re-dispatched change does not land. Defer any in-callback editor
 * writes via `queueMicrotask` or `setTimeout(..., 0)` if you need to
 * react to an edit by writing back.
 */
type OnChangeCallback = (next: string) => void;

// ─── Editor configuration ───────────────────────────────────

/**
 * Options for {@link createEditor}.
 *
 * @remarks All fields are optional. The editor provides sensible
 * defaults (plaintext language, tab indentation, no callbacks).
 * Callbacks are pure functions — they receive plain data and return
 * plain data. The editor wraps them into CM extensions internally.
 * Content comes from the required `initialCode: string` first argument
 * to `createEditor` — not from this type.
 */
type EditorOptions = {
	readonly language?: string;
	readonly indentChar?: string;
	readonly tabSize?: number;
	/**
	 * If provided, the editor uses this element as its container —
	 * `editor.el === parent`. CM mounts its `.cm-editor` as a child of
	 * `parent`. If omitted, the factory creates a fresh `<div>` and
	 * exposes it via `editor.el`.
	 */
	readonly parent?: HTMLElement;
	readonly format?: FormatCallback;
	readonly linters?: readonly LinterCallback[];
	readonly docLookup?: DocumentLookupCallback;
	readonly completions?: CompletionCallback;
	readonly onFormat?: FormatResultCallback;
	readonly onChange?: OnChangeCallback;
};

// ─── Editor instance ────────────────────────────────────────

/**
 * The public API returned by {@link createEditor}.
 *
 * @remarks The factory is async — the instance is fully initialized by
 * the time the returned promise resolves. All methods are unconditionally
 * safe to call on the resolved instance. After `destroy()`, the instance
 * remains callable but behaves as a dead sentinel: `content` returns `''`,
 * the setter drops, `reset`/`format` no-op, `check` returns `[]`. Double
 * destroy is idempotent. The `el` reference is preserved post-destroy but
 * its contents are torn down — do not re-append it to a new parent.
 */
type EditorInstance = {
	readonly content: string;
	readonly el: HTMLElement;
	/** Restores editor content to the `initialCode` captured at factory time. */
	readonly reset: () => void;
	readonly format: () => void;
	readonly check: () => readonly LintDiagnostic[];
	readonly destroy: () => void;
};

// ─── Exports ────────────────────────────────────────────────

export type {
	CompletionCallback,
	CompletionItem,
	CompletionRequest,
	DetectedLanguage,
	DocumentEntry as DocEntry,
	DocumentLookupCallback as DocLookupCallback,
	EditorInstance,
	EditorOptions,
	FormatCallback,
	FormatResult,
	FormatResultCallback,
	LintDiagnostic,
	LinterCallback,
	OnChangeCallback,
};
