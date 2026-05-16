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
 * severity is mapped to CM's `'error'` internally, allowing JeJ
 * validators to serve as linter callbacks without adaptation.
 */
type LintDiagnostic = {
	readonly line: number;
	readonly column: number;
	readonly endLine?: number;
	readonly endColumn?: number;
	readonly severity: 'error' | 'warning' | 'rejection';
	readonly message: string;
	readonly source?: string;
};

/**
 * Documentation entry for a hovered keyword.
 *
 * @remarks The editor builds a styled tooltip DOM from this data.
 * Only `description` is required — all other fields are rendered
 * conditionally when present.
 */
type DocEntry = {
	readonly description: string;
	readonly example?: string;
	readonly category?: string;
	readonly commonMistakes?: readonly string[];
	readonly whenToUse?: string;
};

/**
 * A single item in the autocompletion dropdown.
 */
type CompletionItem = {
	readonly label: string;
	readonly type?: string;
	readonly detail?: string;
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
type DocLookupCallback = (word: string) => DocEntry | null;

/**
 * Returns completion items matching a typed prefix.
 */
type CompletionCallback = (prefix: string) => readonly CompletionItem[];

/**
 * Receives the result of a format operation.
 */
type FormatResultCallback = (result: FormatResult) => void;

// ─── Editor configuration ───────────────────────────────────

/**
 * Options for {@link createEditor}.
 *
 * @remarks All fields are optional. The editor provides sensible
 * defaults (plaintext language, tab indentation, no callbacks).
 * Callbacks are pure functions — they receive plain data and return
 * plain data. The editor wraps them into CM extensions internally.
 * Content comes from the required `embodiment: Snippet` first argument
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
	readonly docLookup?: DocLookupCallback;
	readonly completions?: CompletionCallback;
	readonly onFormat?: FormatResultCallback;
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
	content: string;
	readonly el: HTMLElement;
	/** Restores editor content to `embodiment.source.code` (captured at factory time). */
	readonly reset: () => void;
	readonly format: () => void;
	readonly check: () => readonly LintDiagnostic[];
	readonly destroy: () => void;
};

// ─── Exports ────────────────────────────────────────────────

export type {
	CompletionCallback,
	CompletionItem,
	DetectedLanguage,
	DocEntry,
	DocLookupCallback,
	EditorInstance,
	EditorOptions,
	FormatCallback,
	FormatResult,
	FormatResultCallback,
	LintDiagnostic,
	LinterCallback,
};
