/**
 * @file The aithor contract in TypeScript — the domain model for the
 * generative arm of the Just Enough JavaScript study-lenses quad.
 *
 * @remarks
 * `aithor(program, config)` shapes a JEJ program to a config, seeded by an
 * input program: an empty `program` composes from scratch, a non-empty one
 * varies it (generation is the base case of variation). The `validate` flag
 * (default `true`) places the call in a quadrant — `true` runs the
 * admit-and-conform loop and returns a validated-to-spec program or a
 * structured refusal; `false` returns the model's raw candidate, drift and all.
 *
 * Two impure seams are isolated behind a pure core (prompt construction,
 * `conform`, the `validate`-gated loop, result-shaping): a non-deterministic
 * {@link Model} call and a stateful load-once {@link ModelLoader}, injected as
 * an optional `runtime` third argument so the WHAT/HOW split holds — `config`
 * is what to make, `runtime` is the excluded how (the local-model fetch/cache
 * sit below the loader seam).
 *
 * Reused unchanged from the level: `isJej` / `validate` (the admission gate,
 * `lib/validating/`), `BaseResult` / `Violation` / `SourceRange`
 * (`lib/validating/types.ts`), and `Metrics` (esp. `maxNestingDepth`,
 * `embody/types.ts`). Conformance (`conform`) is the aithor's own pure check;
 * it only ever narrows below admitted JEJ and never touches the allowlist.
 *
 * Result types follow the `BaseResult` convention — consumers check the boolean
 * `ok`, never a discriminated tag — but do not inherit `BaseResult`'s
 * parse/format error slots: aithor's only failure surface is a structured
 * {@link Refusal}, and conformance carries its own located violations.
 */

import type { Program } from 'acorn';

import type { SourceRange } from '../../../lib/validating/types.js';

// ─── Feature subset (permitted constructs + operators) ────────────────

/**
 * A single permitted JEJ feature, named in the level's learner-facing
 * vocabulary (the `reference.md` surface, with operator and expression families
 * like `ternary` grounded in the analytic `Features` detectors rather than a
 * dedicated heading) — NOT `keyof Features` itself, NOT the `SyntaxAllowlist`
 * node keys.
 *
 * @remarks
 * Closed by necessity: `conform` maps each name to a check it can run, so the
 * set it can ENFORCE is bounded by what it can detect; an unknown name would be
 * an unenforceable silent gap, which a closed union rejects at compile time.
 * Each member is a control-flow construct or an operator/expression family that
 * an analytic `Features` flag or an allowlist node-validator already detects,
 * re-expressed in kebab-case for learners. `coercion-plus`
 * (`Features.usesCoercionPlus`) is intentionally excluded — a `+` cannot be
 * forbidden without forbidding all addition, so it is a detector, not a
 * feature a subset can gate.
 */
type FeatureName =
	// control flow
	| 'if'
	| 'while'
	| 'do-while'
	| 'for'
	| 'for-of'
	| 'break'
	| 'continue'
	| 'ternary'
	// operator families
	| 'short-circuit'
	| 'optional-chaining'
	| 'typeof'
	| 'in'
	| 'increment'
	| 'bitwise'
	| 'compound-assignment'
	// expression forms
	| 'template-literal'
	| 'regex'
	| 'bigint'
	| 'new-date';

/**
 * The feature subset a request permits — a restriction of full JEJ, the
 * `subset` argument `conform` receives.
 *
 * @remarks
 * Resolution contract `conform` enforces (not type-expressible): an empty
 * `include` means "all of JEJ except `exclude`"; a non-empty `include` means
 * "only these, minus any also in `exclude`"; on overlap `exclude` wins.
 */
type FeatureSubset = {
	readonly include: readonly FeatureName[];
	readonly exclude: readonly FeatureName[];
};

// ─── Size bounds (length + depth limits) ──────────────────────────────

/**
 * The requested size limits — two orthogonal dimensions, kept separate as the
 * level's `Metrics` keeps them. The `size` argument `conform` receives.
 *
 * @remarks
 * - `lines` — maximum length (`Metrics.source.lines`). Absent = unbounded.
 * - `complexity` — maximum control-flow nesting depth
 *   (`Metrics.maxNestingDepth`, the most trace-load-relevant ordinal).
 *   Decision-point count (loops + branches) is secondary and internal to
 *   `conform`, not a second field. Absent = unbounded.
 */
type SizeBounds = {
	readonly lines?: number;
	readonly complexity?: number;
};

// ─── Conformance violations (the vocabulary `repair` consumes) ────────

/**
 * A feature/operator used outside the permitted subset, located at the
 * offending node — reusing the level's `SourceRange` + `nodePath` conventions
 * so `repair` and lens tooling locate it exactly as an admission `Violation`.
 */
type FeatureViolation = {
	readonly kind: 'feature';
	readonly feature: FeatureName;
	readonly message: string;
	readonly location: SourceRange;
	readonly nodePath: string;
};

/**
 * A whole-program metric over its requested bound — no offending node, so no
 * `location`/`nodePath`. This is why conformance violations are a fresh union
 * rather than the level's `Violation` (which requires `nodeType`/`nodePath`).
 */
type SizeViolation = {
	readonly kind: 'size';
	readonly dimension: 'lines' | 'complexity';
	readonly limit: number;
	readonly actual: number;
	readonly message: string;
};

/** A single conformance failure — the unit `repair` consumes. */
type ConformanceViolation = FeatureViolation | SizeViolation;

/**
 * The result of the aithor's own conformance check.
 *
 * @remarks
 * `conform(code, subset, size)` is pure and sync (parse + walk are sync;
 * `isJej`'s async is only the format check, on the separate admission gate).
 * `ok` is `true` iff `violations` is empty. `ast` is echoed when the candidate
 * parsed (the loop reuses it for metrics/repair); absent when it did not.
 */
type ConformResult = {
	readonly ok: boolean;
	readonly violations: readonly ConformanceViolation[];
	readonly ast?: Program;
};

// ─── Model seams (injected; runtime excluded) ─────────────────────────

/**
 * A loaded LOCAL model handle — the non-deterministic seam. `generate` takes
 * the fully built prompt and resolves to one candidate program; the same
 * prompt may yield different candidates (generation is not reproducible). Tests
 * inject a fake whose `generate` returns canned candidates.
 */
type Model = {
	readonly generate: (prompt: string) => Promise<string>;
};

/**
 * Brings a named local model into memory, load-once — the stateful seam. The
 * load-once-reuse lifecycle and the one-time fetch/cache below it are the
 * runtime's, not the aithor's. Rejects (surfacing as a `no-model-available`
 * refusal) when the device cannot bring the model up; there is no remote
 * fallback. Tests inject a counted loader to assert load-once with no real
 * fetch.
 */
type ModelLoader = (name: string) => Promise<Model>;

/**
 * The injectable runtime — the excluded HOW behind the WHAT of `config`.
 * Optional third argument to `aithor`; omitted, it defaults to the real
 * local-model runtime, so the public contract stays effectively two-arg.
 */
type AithorRuntime = {
	readonly loadModel: ModelLoader;
};

// ─── Config (the request, minus the input program) ────────────────────

/**
 * Everything a call carries besides the input `program`. Flat, exactly these
 * fields. `prompt` and `model` are required; the rest have resolution defaults
 * (see {@link ResolvedAithorConfig}).
 *
 * @remarks
 * - `prompt` — the natural-language ask, sent regardless of `validate`. Carries
 *   the theme (there is no theme field — theme is soft, nothing to gate). An
 *   empty string is valid: the seed program + stringified constraints carry the
 *   ask.
 * - `model` — the local model's NAME from an open, growing size/capability set.
 *   A `string`, not an enum: a closed type would foreclose the open set.
 * - `include` / `exclude` — the feature subset. Enforced under `validate: true`,
 *   prompt-shaping under `validate: false`.
 * - `lines` / `complexity` — the size bounds. Same enforcement split.
 * - `validate` — curated (`true`, default) vs uncurated (`false`).
 */
type AithorConfig = {
	readonly prompt: string;
	readonly model: string;
	readonly include?: readonly FeatureName[];
	readonly exclude?: readonly FeatureName[];
	readonly lines?: number;
	readonly complexity?: number;
	readonly validate?: boolean;
};

/**
 * The config after defaults are applied — mirrors the sibling
 * `RunOptions` → `ResolvedRunOptions` pattern.
 *
 * @remarks
 * `validate` always populated (default `true`); `include`/`exclude` always
 * populated (default empty = full JEJ, nothing excluded); `prompt`/`model`
 * required pass-through; `lines`/`complexity` passed through as-given (absent =
 * unbounded).
 */
type ResolvedAithorConfig = {
	readonly prompt: string;
	readonly model: string;
	readonly include: readonly FeatureName[];
	readonly exclude: readonly FeatureName[];
	readonly lines?: number;
	readonly complexity?: number;
	readonly validate: boolean;
};

// ─── Result / refusal (the boundary out) ──────────────────────────────

/**
 * Why no result was reached — `validate`-aware.
 *
 * @remarks
 * - `'attempt-bound-exhausted'` — curated only: the loop ran out of attempts
 *   (some subset × size × intent requests are unsatisfiable).
 * - `'no-model-available'` — either path: the device cannot bring a local model
 *   up. The only uncurated refusal cause.
 */
type RefusalCause = 'attempt-bound-exhausted' | 'no-model-available';

/** A structured refusal — a named cause, never an out-of-spec program. */
type Refusal = {
	readonly cause: RefusalCause;
};

/**
 * The meta a caller needs about a curated result — which model produced it and
 * how many model calls (initial + repairs) the loop spent. Present on curated
 * results; absent on raw uncurated ones.
 */
type Meta = {
	readonly model: string;
	readonly attempts: number;
};

/**
 * What `aithor(program, config)` resolves to.
 *
 * @remarks
 * Follows the `BaseResult` boolean convention — consumers check `ok`, not a
 * discriminated tag — without inheriting `BaseResult`'s parse/format error
 * slots (aithor's only failure surface is `refusal`):
 *
 * - `ok: true`  — `program` is set, `refusal` absent. On the curated path it is
 *   admitted AND conformant, with `meta`; on the uncurated path it is the
 *   model's candidate unmodified, no `meta`.
 * - `ok: false` — `refusal` is set, `program` absent.
 *
 * Conformance violations never surface here: they are `conform`-internal repair
 * fuel; the aithor never returns a non-conforming program.
 */
type AithorResult = {
	readonly ok: boolean;
	readonly program?: string;
	readonly meta?: Meta;
	readonly refusal?: Refusal;
};

// ─── Exports ──────────────────────────────────────────────────────────

export type {
	FeatureName,
	FeatureSubset,
	SizeBounds,
	FeatureViolation,
	SizeViolation,
	ConformanceViolation,
	ConformResult,
	Model,
	ModelLoader,
	AithorRuntime,
	AithorConfig,
	ResolvedAithorConfig,
	RefusalCause,
	Refusal,
	Meta,
	AithorResult,
};
