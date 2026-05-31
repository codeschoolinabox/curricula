/**
 * @file Domain model for the `blanks` lens — a fill-in-the-blank exercise
 * over the snippet's AST + raw token stream.
 *
 * Two layers (per the lenses peer's two-layer module convention):
 * - The pure-TS core (`./core.ts` + `./derive-blanks.ts` +
 *   `./validate-answer.ts`) produces the display fragments, the per-blank
 *   metadata, and the per-blank correctness primitive the wrapper renders.
 * - The React wrapper (`./index.tsx`) composes the core, owns the
 *   per-mount UI state (learner answers, the resolved seed, the active
 *   `tokenCategories` selection, the difficulty knob), and renders the
 *   `<input>`-bearing surface.
 *
 * @remarks The lens does NOT mutate `embodiment` (deep-frozen per the
 * `embody/` contract) or `config`. Learner answers exist only in per-mount
 * React state — no `localStorage`, no module-level cache, no refs across
 * mounts. See `../README.md` § Disposable practice.
 *
 * @remarks `BlanksLensConfig` is a documentation device naming the fields
 * the lens *reads* — it does NOT narrow what callers may *pass*. Unknown
 * educator-supplied fields pass through `config()` untouched, per the
 * open-shape contract on `LensConfig` (`Readonly<Record<string,
 * SerializableValue>>` per `../types.ts`).
 */

// ─── Categorization primitives ──────────────────────────────

/**
 * One of the four token-category names the learner can enable / disable
 * for blanking. At the `LensConfig` boundary this is a `string`; the
 * narrowing here documents the closed set the lens recognizes.
 *
 * @remarks Unknown category strings in `config.tokenCategories` are
 * silently dropped during derivation (no error). The four valid values
 * are: `'keywords'`, `'identifiers'`, `'operators'`, `'literals'`.
 */
type TokenCategory =
	| 'keywords'
	| 'identifiers'
	| 'operators'
	| 'literals';

// ─── Per-blank metadata ─────────────────────────────────────

/**
 * One eligible token — a candidate for blanking that has been classified
 * (AST walk) and positioned (token-stream walk) but not yet selected.
 * The carrier shape between the Position and Select sub-steps of
 * Phase 3 (see `./DOCS.md` § Execution phases).
 *
 * @remarks Same shape as `Blank` minus the `index` field — `index` is
 * assigned during the Select sub-step when the seeded sampler keeps
 * the token, contiguous 0-based across the selected subset.
 */
type EligibleToken = {
	readonly category: TokenCategory;
	readonly text: string;
	readonly start: number;
	readonly end: number;
};

/**
 * One blank — an eligible token the lens has selected for removal. The
 * `index` is 0-based across all blanks in the derivation; `answer` is
 * the verbatim source range of the original token (used as the
 * correctness comparison target by `validate-answer.ts`).
 *
 * @remarks `start` / `end` are character offsets into
 * `embodiment.source.code` (Acorn's token convention: half-open
 * `[start, end)`). The wrapper does not need these for rendering — the
 * fragment sequence already places the blank — but tests and future
 * affordances (e.g. hover-to-reveal-original-position) may consume them.
 */
type Blank = {
	readonly index: number;
	readonly answer: string;
	readonly category: TokenCategory;
	readonly start: number;
	readonly end: number;
};

// ─── Display-fragment shape ─────────────────────────────────

/**
 * One verbatim source substring — the parts of the source that render
 * as plain text (everything between blanks, including whitespace,
 * comments, and non-blanked tokens).
 */
type TextFragment = {
	readonly kind: 'text';
	readonly text: string;
};

/**
 * One blank position — renders as an `<input data-blank-index={index}>`
 * in the wrapper. `answer` is duplicated from the matching `Blank`
 * entry so the fragment is self-contained for the wrapper's render
 * loop (no second lookup against the blank list).
 */
type BlankFragment = {
	readonly kind: 'blank';
	readonly index: number;
	readonly answer: string;
};

/**
 * One element of the flat fragment sequence the wrapper renders in
 * order. Concatenating every `text` fragment plus the `answer` of
 * every `blank` fragment reconstructs the original source byte-for-byte.
 */
type DisplayFragment = TextFragment | BlankFragment;

// ─── Derivation result ──────────────────────────────────────

/**
 * The output of `derive-blanks.ts` — the wrapper consumes both fields:
 * `fragments` drives rendering; `blanks` drives the score readout and
 * per-blank correctness lookup.
 *
 * @remarks Invariant: `blanks.length` equals the number of `kind:
 * 'blank'` entries in `fragments`, and `blanks[i].index === i` for
 * every `i`. The derivation guarantees the indices are contiguous and
 * 0-based.
 */
type BlanksDerivation = {
	readonly fragments: ReadonlyArray<DisplayFragment>;
	readonly blanks: ReadonlyArray<Blank>;
};

// ─── Validation result ──────────────────────────────────────

/**
 * Per-blank correctness state.
 *
 * - `'unfilled'` — the learner answer is empty or whitespace-only.
 * - `'correct'` — the trimmed learner answer equals the answer.
 * - `'incorrect'` — the trimmed learner answer is non-empty and does
 *   not equal the answer.
 *
 * @remarks Strict equality, case-sensitive, no operator-equivalence
 * relaxation. See `../README.md` § Validation contract for the
 * pedagogical rationale and the deferred future-direction relaxation.
 */
type Correctness = 'unfilled' | 'correct' | 'incorrect';

// ─── Per-lens config narrowing ──────────────────────────────

/**
 * The fields this lens reads from `LensConfig`. The type does NOT
 * exclude additional fields — `LensConfig` is open-shape at the
 * contract boundary — but it documents what the lens looks for and
 * what defaults apply when a field is absent.
 *
 * @remarks Defaults:
 * - `difficulty` → `50` (probability `0.5` per eligible token)
 * - `tokenCategories` → all four categories enabled
 * - `seed` → per-mount random seed computed by the wrapper at first
 *   render. The core takes a numeric seed as input; the wrapper owns
 *   the non-determinism source. Tests pin `seed` explicitly.
 */
type BlanksLensConfig = {
	readonly difficulty?: number;
	readonly tokenCategories?: ReadonlyArray<TokenCategory>;
	readonly seed?: number;
};

// ─── Exports ────────────────────────────────────────────────

export type {
	TokenCategory,
	EligibleToken,
	Blank,
	TextFragment,
	BlankFragment,
	DisplayFragment,
	BlanksDerivation,
	Correctness,
	BlanksLensConfig,
};
