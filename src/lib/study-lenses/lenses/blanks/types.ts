/**
 * @file Domain model for the `blanks` lens — a fill-in-the-blank
 * programming exercise. `blankenate` parses the snippet, delegates token
 * classification to `lib/classifying`, and replaces selected tokens (any
 * of the five categories) with the `__` placeholder; the wrapper hosts a
 * CodeMirror editor over the result, evaluates the learner's typed
 * answers per blank position, and renders a hints panel of per-blank
 * correctness state.
 *
 * Two layers (per the lenses peer's two-layer module convention):
 * - The pure-TS core (`./core.ts` + `./lib/blankenate.ts` +
 *   `./lib/no-paste-extension.ts` + `./lib/evaluate-correctness.ts`)
 *   produces the blanked source, the per-blank correctness map, and the
 *   CodeMirror extension that blocks paste.
 * - The React wrapper (`./index.tsx`) composes the cores, owns the
 *   per-mount UI state (current view mode, learner code, blanks,
 *   correctness map), and dispatches user-interaction events.
 *
 * @remarks The lens does NOT mutate `embodiment` (deep-frozen per the
 * `embody/` contract) or `config`. Learner answers, blanks, and the
 * correctness map exist only in per-mount React state — no
 * `localStorage`, no module-level cache, no refs across mounts, no URL
 * persistence — config comes only from the `config` prop, and learner
 * state is discarded on unmount. See `../README.md` § Disposable
 * practice.
 *
 * @remarks `LensConfig` (from `../types.ts`) is the wrapper's prop
 * type for `config`; the lens reads the known fields (`difficulty`,
 * `contentTypes`, `viewMode`, `editorMode`, `suggestions`) and ignores
 * the rest.
 * Per-lens narrowing is captured in `BlanksLensConfig` below — it
 * documents the known fields but does NOT exclude unknown ones
 * (config is open-shape at the contract boundary). All four documented
 * fields are `SerializableValue`-compliant (primitives or
 * `ReadonlyArray<primitive>`) — nested objects are forbidden by
 * `LensConfig`'s contract per `../types.ts` JSDoc on
 * `SerializablePrimitive`.
 *
 * @remarks Naming note: vocabulary matches the legacy
 * `BlanksLens.jsx` directly (`blank`, `blankenated`, `content type`,
 * `view mode`, `hints level`, `correctness`). The Socratic study
 * companion (`socratizing/`) is NOT a blanks concern — it lives at
 * the SL orchestrator (it operates on the original embodiment, not
 * on the blankenated source).
 */

// ─── Token category + blank identity ────────────────────────

/**
 * The five token categories a blank can carry — the shared house taxonomy.
 *
 * @remarks Category assignment is delegated to
 * [`lib/classifying`](../../lib/classifying/classify-tokens.js); see its
 * `README.md` § The taxonomy for the authoritative rules. The categories are
 * SEMANTIC — by what the element does in the notional machine, not by Acorn's
 * lexer flag:
 * - `identifier` — variable / parameter / property names and private class
 *   fields (`#x`).
 * - `literal` — strings, numbers, booleans, regex, and template-literal text
 *   chunks. The reserved words `null` / `true` / `false` are literals (values),
 *   NOT keywords.
 * - `keyword` — statement / declaration / control words (`function`, `if`,
 *   `return`, `class`, `import`, …) plus the contextual keywords (`let`, `of`,
 *   `as`, `from`, `get`, `set`, …) wherever they appear.
 * - `operator` — value-producing operators, including the reserved-word
 *   operators `typeof` / `in` / `instanceof` / `void` / `delete` (operators by
 *   what they do, despite Acorn's `.keyword` flag) and the `*` of `yield*` /
 *   `import *`.
 * - `delimiter` — syntactic punctuation: parens, braces, brackets, `;`, `,`,
 *   `.`, `=>`, `?`, `:`, `?.`, `...`, the template backtick and `${`, and the
 *   generator `*`.
 *
 * `BlankType` is structurally identical to classifying's `Category` (the same
 * five names); widening or re-binning either is a cross-consumer contract event.
 */
type BlankType =
	| 'identifier'
	| 'literal'
	| 'keyword'
	| 'operator'
	| 'delimiter';

/**
 * One blanked position in the source.
 *
 * @remarks Positions (`start`, `end`) are zero-indexed character
 * offsets into the **original** source (`embodiment.source.code`),
 * not the blankenated source. The wrapper's evaluator maps each
 * `{start, end}` onto the learner's typed text to compare per-blank.
 *
 * `id` is the blank's identifier within one mount; `blankenate` produces
 * `blank_0`, `blank_1`, … in source-ascending order. The numeric suffix is
 * opaque — callers must not depend on it. Mounts are disposable per the
 * lenses-peer contract, so ids are not stable across mounts (a freshly
 * mounted lens re-derives blanks from scratch).
 *
 * `original` is the token text being hidden (e.g. `'function'`,
 * `'x'`, `'+'`, `'42'`); the evaluator compares the learner's typed
 * text at `[start, end)` against this string.
 */
type Blank = {
	readonly id: string;
	readonly original: string;
	readonly type: BlankType;
	readonly start: number;
	readonly end: number;
};

/**
 * `blankenate`'s success-shape return value.
 *
 * @remarks `null` is the alternative return value (parse failure);
 * `blankenate` catches Acorn's error internally. In production the
 * lens's `applicableTo` gate (`embodiment.status.parsed`) prevents
 * mounting on un-parseable embodiments, so the wrapper sees `null`
 * only in the defense-in-depth path (see `./README.md` § Edge cases).
 *
 * `blankedCode` is the source with each blank's `[start, end)` range
 * substituted by length-matched `_` (`_`.repeat(original.length)
 * — one underscore per original character, preserving width).
 * `blankedCode.length === originalCode.length` always; positions in
 * `blanks[i].{start, end}` map 1:1 to positions in `blankedCode`.
 * `blanks` is in source-ascending order (by `start`). `originalCode`
 * is the input source verbatim — preserved here so consumers don't
 * have to plumb the embodiment.
 */
type BlankenateResult = {
	readonly blankedCode: string;
	readonly blanks: ReadonlyArray<Blank>;
	readonly originalCode: string;
};

// ─── Content type ───────────────────────────────────────────

/**
 * One element of the `contentTypes` config array. Each value names a
 * token category that is **eligible** to be blanked when present in
 * the array; categories absent from the array are suppressed.
 *
 * @remarks Stored as `ReadonlyArray<ContentType>` in `LensConfig`
 * (compliant with `SerializableValue`'s primitive-array constraint).
 * The wrapper derives a boolean map (`{ keywords: bool, identifiers:
 * bool, … }`) for per-render rendering; the array is the
 * config-level representation.
 *
 * The relationship to `BlankType`:
 * - `'keywords' | 'identifiers' | 'operators' | 'literals' | 'delimiters'`
 *   (this type) is plural; one config-level flag turns the whole
 *   category on/off.
 * - `'identifier' | 'literal' | 'keyword' | 'operator' | 'delimiter'`
 *   (`BlankType` above) is singular; each `Blank` carries its singular
 *   type. These are the same five names as classifying's `Category`.
 */
type ContentType =
	| 'keywords'
	| 'identifiers'
	| 'operators'
	| 'literals'
	| 'delimiters';

// ─── View mode ──────────────────────────────────────────────

/**
 * Which representation of the snippet the CodeMirror editor renders.
 *
 * @remarks
 * - `'blankenated'` — the blanked source (`__` placeholders), editable.
 *   The wrapper attaches `noPasteExtension` so the learner types the
 *   answer rather than pasting.
 * - `'complete'` — the original source, read-only. CSS adds
 *   `user-select: none` to discourage copy-paste-back workarounds.
 *
 * View-mode toggles **preserve learner answers** (parity with legacy;
 * confirmed at AR-1). Answers live in per-mount React state for the
 * lifetime of the mount; only unmount discards them per the
 * disposable-practice contract.
 */
type ViewMode = 'blankenated' | 'complete';

/**
 * The `editorMode` config value: which editor variant renders inside
 * blankenated mode. Three sub-modes, ordered easiest to hardest:
 *
 * - `'skeleton'` — fixed-width fillable-field UX with correctness-aware
 *   per-blank colors, plus the cursor-scoped hints panel
 *  . Full scaffolding.
 * - `'diff'` — same editor, but per-character diff highlighting against
 *   the (hidden) original instead of per-blank correctness colors. No
 *   hints panel. The diff is the hint.
 * - `'raw'` — same editor, but no visual feedback at all (no
 *   correctness colors, no diff highlighting, no hints panel). The
 *   learner gets nothing but the blanked source.
 *
 * Orthogonal to `viewMode` — only meaningful when
 * `viewMode === 'blankenated'`. In `'complete'` mode this field is
 * ignored (the editor shows the read-only original regardless).
 */
type EditorMode = 'skeleton' | 'diff' | 'raw';

// ─── Correctness ────────────────────────────────────────────

/**
 * Per-blank state in the blanks-exercise sense.
 *
 * @remarks `BlankCorrectness` is a blanks-internal term for the
 * cloze-deletion exercise. It is the only correctness signal the
 * lens exposes — the lens does NOT layer Socratic questioning on
 * top. The Ask Me / `socratizing/` surface lives in the SL
 * orchestrator one layer up, since it operates on the original
 * embodiment rather than the blankenated source.
 */
type BlankCorrectness = 'correct' | 'incorrect' | 'unfilled';

/**
 * Per-blank correctness, keyed by `Blank.id`. `Map` semantics rather
 * than `Record` to keep insertion order stable and to allow O(1)
 * lookups during the per-render hints-panel iteration.
 */
type CorrectnessMap = ReadonlyMap<string, BlankCorrectness>;

/**
 * The evaluator's return shape: per-blank correctness plus aggregate
 * counts and score.
 *
 * @remarks Score formula:
 * `total === 0 ? 100 : Math.round(correct / total * 100)`.
 * The `total === 0` branch (no eligible tokens — empty source,
 * difficulty 0, or no content types selected) declares the exercise
 * vacuously complete; it would otherwise render `NaN%`.
 */
type EvaluationResult = {
	/**
	 * Per-blank `id → status` detail. This is the evaluator's primary
	 * output; `total`/`correct`/`incorrect`/`unfilled`/`score` are its
	 * aggregate.
	 *
	 * Not consumed by production render: the score panel surfaces only the
	 * aggregate counts, and the in-editor coloring is computed independently
	 * by the CodeMirror `StateField` (`deriveClass` in `index.tsx`), which
	 * recomputes per transaction to stay decoupled from React render timing.
	 * The map is kept as the position-discrimination assertion surface for
	 * the unit tests (a `{correct:1, incorrect:1}` count cannot tell whether
	 * two blanks were classified correctly or swapped) and as the natural
	 * hook for any future per-blank UI.
	 */
	readonly correctnessMap: CorrectnessMap;
	readonly total: number;
	readonly correct: number;
	readonly incorrect: number;
	readonly unfilled: number;
	readonly score: number;
};

// ─── Per-lens config narrowing ──────────────────────────────

/**
 * The fields this lens reads from `LensConfig`. The type does NOT
 * exclude additional fields — `LensConfig` is open-shape at the
 * contract boundary — but it documents what the lens looks for and
 * what defaults apply when a field is absent.
 *
 * @remarks All fields are `SerializableValue`-compliant per
 * `../types.ts`: primitives (`difficulty: number`,
 * `viewMode: string`, `suggestions: boolean`) or arrays of primitives
 * (`contentTypes: readonly string[]`). Nested objects would violate
 * `LensConfig`'s flat-record contract; the boolean-map
 * representation of content types is **wrapper-internal state**
 * derived from the array on render, not a config-level shape.
 *
 * @remarks Defaults (per `./README.md` § Public API):
 * - `difficulty` → `50`
 * - `contentTypes` → `['keywords', 'identifiers', 'operators', 'literals', 'delimiters']`
 * - `viewMode` → `'blankenated'`
 * - `editorMode` → `'skeleton'`
 * - `suggestions` → `false`
 */
type BlanksLensConfig = {
	readonly difficulty?: number;
	readonly contentTypes?: ReadonlyArray<ContentType>;
	readonly viewMode?: ViewMode;
	readonly editorMode?: EditorMode;
	/**
	 * The unified "help" toggle (opt-in, default `false`). In `skeleton`
	 * mode it shows / hides the cursor-scoped hints panel; in `diff` /
	 * `raw` it enables snippet-free autocomplete (JS keywords + in-buffer
	 * locals, no `for`/`if`/`function` templates, no completion of
	 * un-typed identifiers). See `./README.md` § Toolbar contract.
	 */
	readonly suggestions?: boolean;
};

// ─── Exports ────────────────────────────────────────────────

export type {
	Blank,
	BlankCorrectness,
	BlankType,
	BlankenateResult,
	BlanksLensConfig,
	ContentType,
	CorrectnessMap,
	EditorMode,
	EvaluationResult,
	ViewMode,
};
