/**
 * @file Domain model for the `blanks` lens — a fill-in-the-blank
 * programming exercise. The vendored `blankenate` algorithm walks an
 * Acorn AST and replaces selected tokens (`identifier`, `literal`,
 * `keyword`, `operator`) with the `__` placeholder; the wrapper hosts
 * a CodeMirror editor over the result, evaluates the learner's typed
 * answers per blank position, and renders a hints panel of per-blank
 * correctness state.
 *
 * Two layers (per the lenses peer's two-layer module convention):
 * - The pure-TS core (`./core.ts` + `./lib/blankenate.ts` +
 *   `./lib/no-paste-extension.ts` + `./lib/evaluate-correctness.ts` +
 *   `./lib/url-config.ts`) produces the blanked source, the per-blank
 *   correctness map, the CodeMirror extension that blocks paste, and
 *   the URL config read/write surface.
 * - The React wrapper (`./index.tsx`) composes the cores, owns the
 *   per-mount UI state (current view mode, learner code, blanks,
 *   correctness map), and dispatches user-interaction events.
 *
 * @remarks The lens does NOT mutate `embodiment` (deep-frozen per the
 * `embody/` contract) or `config`. Learner answers, blanks, and the
 * correctness map exist only in per-mount React state — no
 * `localStorage`, no module-level cache, no refs across mounts. URL
 * config is the one cross-mount persistence surface; it's
 * orchestrator-domain (URL = caller environment, not lens-internal).
 * See `../README.md` § Disposable practice.
 *
 * @remarks `LensConfig` (from `../types.ts`) is the wrapper's prop
 * type for `config`; the lens reads four known fields (`difficulty`,
 * `contentTypes`, `viewMode`, `hintsMode`) and ignores the rest.
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
 * `view mode`, `hints level`, `correctness`). Inc 6.m: removed
 * `code question`/`micro-decision` terms — `socratizing/` is no
 * longer a blanks concern (moved to the SL orchestrator since it
 * operates on the original embodiment, not the blankenated source).
 */

// ─── Token category + blank identity ────────────────────────

/**
 * The five token categories `blankenate` recognizes.
 *
 * @remarks Sourced from the vendored algorithm's AST + token-stream
 * classification (per `./lib/blankenate.ts`):
 * - `identifier` — `Node.type === 'Identifier' | 'PrivateIdentifier'`
 *   (variable names, parameter names, private class fields like `#x`).
 * - `literal` — `Node.type === 'Literal' | 'RegExpLiteral'` (strings,
 *   numbers, booleans, regex).
 * - `keyword` — Inc 6.k: token-stream walk over Acorn's tokens, matching
 *   `tok.type.keyword` (reserved keywords like `function`/`if`/`return`/
 *   `class`/`import`/`extends`/`super`/`try`/`catch`/`null`/`true`/etc.)
 *   plus a fixed contextual-keyword set (`let`, `static`, `async`,
 *   `await`, `yield`, `of`, `as`, `from`, `get`, `set` — which Acorn
 *   emits as `name` tokens with `.keyword === undefined`). Replaces the
 *   pre-Inc-6.k partial AST-walk approach which omitted ~25 keywords.
 * - `operator` — AST-walk over `BinaryExpression.operator`,
 *   `AssignmentExpression.operator`, `UpdateExpression.operator`,
 *   `UnaryExpression.operator`, `VariableDeclarator` init `=`,
 *   `AssignmentPattern` default-parameter `=` (Inc 6.k; covers
 *   `function f(x = 0)` and `({ a = 1 } = {})`),
 *   `LogicalExpression.operator` (Inc 6.l; `&&`, `||`, `??` — Acorn
 *   splits these into LogicalExpression nodes, NOT BinaryExpression),
 *   and `PropertyDefinition` class-field initializer `=` (Inc 6.l;
 *   covers `class A { x = 1 }`, `class A { #count = 0 }`, and
 *   `class A { static MAX = 100 }`).
 * - `delimiter` (Inc 6.6 extension; beyond legacy) —
 *   syntactic delimiter tokens from Acorn's token stream:
 *   `(`, `)`, `{`, `}`, `[`, `]`, `${`, `;`, `,`, `.`, plus
 *   (Inc 6.k) the syntactic-marker delimiters `=>`, `?`, `:`,
 *   `?.`, `...`. The template-expression opener `${` is treated as
 *   a single 2-char token (`tokTypes.dollarBraceL`); block-close
 *   and template-close `}` are not distinguished for v1 (both blank
 *   as `}`). Ternary `?` / `:` are classified as delimiters, NOT
 *   operators — the operators category covers AST-walk-driven
 *   operator strings (BinaryExpression.operator etc.); ternary
 *   tokens come through the token-stream filter. See
 *   `./lib/blankenate.ts` DELIMITER_LABELS for the comprehensive
 *   set + the documented exclusions (backtick, regex slash).
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
 * `id` is the blank's stable identifier within one mount; the
 * vendored `blankenate` produces `blank_0, blank_1, …` strings in
 * registration order. Mounts are disposable per the lenses-peer
 * contract, so ids are not stable across mounts (a freshly mounted
 * lens re-derives blanks from scratch).
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
 * The vendored `blankenate`'s success-shape return value.
 *
 * @remarks `null` is the alternative return value (parse failure);
 * the algorithm catches Acorn's error internally. In production the
 * lens's `applicableTo` gate (`embodiment.status.parsed`) prevents
 * mounting on un-parseable embodiments, so the wrapper sees `null`
 * only in the defense-in-depth path (see `./README.md` § Edge cases).
 *
 * `blankedCode` is the source with each blank's `[start, end)` range
 * substituted by length-matched `_` (Inc 6.7: `_`.repeat(original.length)
 * — one underscore per original character, preserving width).
 * `blankedCode.length === originalCode.length` always; positions in
 * `blanks[i].{start, end}` map 1:1 to positions in `blankedCode`.
 * `blanks` is the registration-order array
 * (not position-order; position-aware operations should sort by
 * `start` as needed). `originalCode` is the input source verbatim —
 * preserved here so consumers don't have to plumb the embodiment.
 */
type BlankenateResult = {
	readonly blankedCode: string;
	readonly blanks: ReadonlyArray<Blank>;
	readonly originalCode: string;
};

// ─── Content type (config + URL format) ─────────────────────

/**
 * One element of the `contentTypes` config array. Each value names a
 * token category that is **eligible** to be blanked when present in
 * the array; categories absent from the array are suppressed.
 *
 * @remarks Stored as `ReadonlyArray<ContentType>` in `LensConfig`
 * (compliant with `SerializableValue`'s primitive-array constraint).
 * The wrapper derives a boolean map (`{ keywords: bool, identifiers:
 * bool, … }`) for per-render rendering; the array is the
 * config-level representation. The URL config format
 * `types:keywords+identifiers` is the same array, joined with `+`.
 *
 * The relationship to `BlankType`:
 * - `'keywords' | 'identifiers' | 'operators' | 'literals' | 'delimiters'`
 *   (this type) is plural; one config-level flag turns the whole
 *   category on/off.
 * - `'identifier' | 'literal' | 'keyword' | 'operator' | 'delimiter'`
 *   (`BlankType` above) is singular; each `Blank` carries its singular
 *   type.
 *
 * The plural / singular split mirrors the legacy's vocabulary
 * (legacy lines 30–36).
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
 * - `'helpful'` — fixed-width fillable-field UX with correctness-aware
 *   per-blank colors (Inc 6.7), plus the cursor-scoped hints panel
 *   (Inc 6h-redux). Full scaffolding.
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
type EditorMode = 'helpful' | 'diff' | 'raw';

// ─── Hints mode ─────────────────────────────────────────────

/**
 * The `hintsMode` config value: enable or disable the cursor-scoped
 * hints panel.
 *
 * @remarks Inc 6h-redux ships a **cursor-scoped, on-demand, scrambled**
 * hints panel. When `hintsMode === 'on'`, the panel renders below the
 * editor and shows a reveal-button for the blank under the cursor
 * (only). Clicking the button reveals the scrambled-letters hint
 * (alphabetical sort of `blank.original` — same character set, no
 * order info). The learner controls the scaffolding gradient by
 * choosing how many blanks to reveal, not by a config tier.
 *
 * When `hintsMode === 'off'`, the panel does not render at all.
 *
 * Decoupled from `difficulty` per user-directed redesign — hints are
 * orthogonal to the difficulty slider.
 */
type HintsMode = 'on' | 'off';

// ─── Correctness ────────────────────────────────────────────

/**
 * Per-blank state in the blanks-exercise sense.
 *
 * @remarks `BlankCorrectness` is a blanks-internal term for the
 * cloze-deletion exercise. It is the only correctness signal the
 * lens exposes — the lens does NOT layer Socratic questioning on top.
 * (Inc 6.m: the Ask Me / socratizing surface was moved out of this
 * lens and into the SL orchestrator, since it operates on the
 * original embodiment rather than the blankenated source.)
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
 * @remarks All four fields are `SerializableValue`-compliant per
 * `../types.ts`: primitives (`difficulty: number`,
 * `viewMode: string`, `hintsMode: string`) or arrays of primitives
 * (`contentTypes: readonly string[]`). Nested objects would violate
 * `LensConfig`'s flat-record contract; the boolean-map
 * representation of content types is **wrapper-internal state**
 * derived from the array on render, not a config-level shape.
 *
 * @remarks Defaults (per `./README.md` § Public API):
 * - `difficulty` → `50`
 * - `contentTypes` → `['keywords', 'identifiers', 'operators', 'literals', 'delimiters']`
 * - `viewMode` → `'blankenated'`
 * - `hintsMode` → `'on'`
 */
type BlanksLensConfig = {
	readonly difficulty?: number;
	readonly contentTypes?: ReadonlyArray<ContentType>;
	readonly viewMode?: ViewMode;
	readonly editorMode?: EditorMode;
	readonly hintsMode?: HintsMode;
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
	HintsMode,
	ViewMode,
};
