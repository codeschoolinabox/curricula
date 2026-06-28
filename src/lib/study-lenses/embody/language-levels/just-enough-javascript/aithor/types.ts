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
 * {@link LoadedModel} call and a stateful load-once {@link ModelLoader}, injected as
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

import type { LoadedModel } from '../../../../lib/local-llm/types.js';
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

// ─── Repair context (the prompt-construction seed for a repair turn) ──

/**
 * The seed a repair turn folds into the next prompt — the located reasons a
 * candidate was refused, paired with the candidate itself.
 *
 * @remarks
 * The data-flow sketch's repair edge returns to the same pure prompt phase "now
 * seeded with the specific out-of-subset construct or out-of-bounds metric"; this
 * is that seed, made a value.
 * - `candidate` — the refused program (the curated path's extracted `code`),
 *   shown to the model so a repair corrects its own work rather than starting
 *   over.
 * - `violations` — the located {@link ConformanceViolation}s `conform` emitted,
 *   each already carrying its own `message`; the prompt restates those failures
 *   in the model's terms without re-deriving them. **Non-empty by construction**:
 *   a repair is only built for a *refused* candidate, which always carries at
 *   least one located reason, so the type is a non-empty tuple (no degenerate
 *   "fix these problems" with nothing to fix). Typed to the narrow conformance
 *   union (not the level's admission `Violation`), keeping this seed model-free;
 *   a later curated-loop unit may widen the element type if admission failures
 *   are ever folded in (the non-empty cardinality holds regardless).
 *
 * Absent on the initial turn (the base ask); present on every repair turn. The
 * base ask — persona, learner prompt, seed program, stringified constraints — is
 * re-stated regardless: repair augments the prompt, it does not replace it.
 */
type RepairContext = {
	readonly candidate: string;
	readonly violations: readonly [
		ConformanceViolation,
		...ConformanceViolation[],
	];
};

// ─── Model seams (injected; runtime excluded) ─────────────────────────

/**
 * A successfully brought-up model paired with the id of the model that was
 * actually resolved — aithor's re-mapping of local-llm's `LoadSuccess` (minus the
 * `ok` discriminant and the device-tier `resolvedRuntime`). The line is drawn so
 * `resolvedId` stays and `resolvedRuntime` goes because the **backend** is HOW —
 * invisible to a study program's reader — whereas the **model identity** names the
 * artifact's provenance, learner-meaningful truth (which is why it is surfaced even
 * when the runtime picked). The {@link LoadedModel} handle is owned by the injected
 * local-llm runtime (`lib/local-llm/`), NOT defined here; a result's {@link Meta}
 * (on EITHER path) reports `resolvedId` so the model is named truthfully even for
 * an empty "pick for me" request (see {@link AithorConfig}). The pick is never a
 * black box.
 */
type ResolvedModel = {
	readonly model: LoadedModel;
	readonly resolvedId: string;
};

/**
 * Brings a model into memory, load-once — the stateful seam. Resolves to a
 * {@link ResolvedModel} (the {@link LoadedModel} handle plus the resolved id) owned
 * by the injected local-llm runtime (`lib/local-llm/`), NOT defined here: aithor
 * names WHICH model (or lets the runtime pick) and drives WHEN; the runtime owns
 * the fetch/cache/load. The handle's `generate` resolves to a decomposed
 * `GenerationResult` — aithor conforms its `code` on the curated path and returns
 * its byte-exact `raw` on the uncurated one (the non-deterministic seam: the same
 * prompt may yield different results).
 *
 * This loader is aithor's value-not-throw BOUNDARY: it resolves to a
 * {@link ResolvedModel} or a {@link Refusal} — NEVER a throw, NEVER a leaked
 * rejection — even though local-llm itself is NOT uniformly value-not-throw. It
 * absorbs local-llm's three non-success shapes, matching aithor's `ok`-boolean
 * convention:
 * - a `LoadFailure` (any of local-llm's five terminal causes) →
 *   `Refusal('no-model-available')`; local-llm's `detail` is dropped at the seam
 *   (a {@link Refusal} carries only a cause).
 * - a NON-EMPTY model name absent from the injected catalog → `Refusal('unknown-model')`,
 *   detected by a catalog-membership pre-check (against the same catalog aithor
 *   injects) BEFORE `load` is called, so local-llm's unknown-name throw is never
 *   reached. The pre-check is gated on a non-empty name, mirroring local-llm's own
 *   `isNamed`: an EMPTY name is NOT pre-checked — it is mapped to a **model-less**
 *   `Selection` (the runtime's default-pick request, NOT a `Selection` carrying an
 *   empty `model`), so the runtime picks its cost-aware default (aithor's one "pick
 *   for me" affordance) and the chosen id comes back as `resolvedId`.
 * - a rejected device-capability probe, or any other infrastructure throw raised
 *   during bring-up — which local-llm PROPAGATES rather than returning a
 *   `LoadFailure` — caught and folded into `Refusal('no-model-available')` by a
 *   catch-all around the whole `load` call.
 * There is no remote fallback. Tests inject a counted loader returning a fake whose
 * `generate` returns canned results (to assert load-once with no real fetch), plus
 * fakes whose underlying runtime throws / fails / rejects, to assert each shape
 * surfaces as the right `Refusal` value rather than a throw.
 */
type ModelLoader = (name: string) => Promise<ResolvedModel | Refusal>;

/**
 * The injectable runtime — the excluded HOW behind the WHAT of `config`. Optional
 * third argument to `aithor`; the seam through which the model loader is supplied
 * (a real runtime in production, a fake in tests).
 *
 * aithor stays BACKEND-AGNOSTIC. Its default-runtime factory (Phase-1 wiring) is a
 * thin construction over the real local-llm runtime: local-llm requires the host
 * to register the backends it ships (there is no default `AdapterMap`, and aithor
 * bundles no backend of its own), so the factory takes a HOST-SUPPLIED `AdapterMap`,
 * constructs the runtime with that map AND the catalog aithor holds for its
 * membership pre-check, and re-maps `load(selection)` → `loadModel(name)`
 * (collapsing `LoadFailure` → `no-model-available`, pre-checking unknown names →
 * `unknown-model`). For a browser host wanting the canonical zero-wiring path,
 * aithor ALSO ships a SEPARATE, opt-in webllm convenience export — the sole place
 * that depends on `@mlc-ai/web-llm`. So `aithor(program, config)` is effectively
 * two-arg AFTER one host backend wiring; the third arg is the injected seam, not a
 * per-call argument. The local-only invariant stays anchored in code: the default
 * factory always constructs local-llm, which has no remote path.
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
 *   A `string`, not an enum: a closed type would foreclose the open set. A
 *   NON-EMPTY name absent from the runtime's catalog refuses as `unknown-model`;
 *   the EMPTY string is the "pick for me" request — it lets the runtime choose its
 *   cost-aware default, and the chosen model comes back in {@link Meta} as the
 *   resolved id.
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
 * Why no result was reached.
 *
 * @remarks
 * `validate`-aware in one direction only: `attempt-bound-exhausted` is
 * curated-only; the two bring-up causes arise under either `validate` value
 * (model bring-up precedes the curated/uncurated fork).
 * - `'attempt-bound-exhausted'` — curated only: the loop ran out of attempts
 *   (some subset × size × intent requests are unsatisfiable).
 * - `'no-model-available'` — either path: the device cannot bring up a model it
 *   otherwise knows. The re-mapping of local-llm's `LoadFailure` — all five of its
 *   terminal causes (`no-feasible-model`, `all-candidates-exhausted`, `fetch-failed`,
 *   `storage-quota`, `cache-evicted`) collapse here — and also the catch-all for a
 *   propagated capability-probe or infrastructure fault during bring-up.
 * - `'unknown-model'` — either path: a NON-EMPTY `model` name absent from the
 *   runtime's (injected) catalog — a typo, or a name from a newer catalog. Kept
 *   distinct from `no-model-available` so a misnamed model never masquerades as
 *   device-unavailability; pre-checked before bring-up (the name local-llm would
 *   otherwise throw on). The empty string is NOT this cause — it is the
 *   default-pick request (see {@link AithorConfig} `model`).
 */
type RefusalCause =
	| 'attempt-bound-exhausted'
	| 'no-model-available'
	| 'unknown-model';

/** A structured refusal — a named cause, never an out-of-spec program. */
type Refusal = {
	readonly cause: RefusalCause;
};

/**
 * The meta a caller needs about a result — which model produced it and how many
 * model calls it took. Present on EVERY successful result (both paths); absent
 * only on a refusal. `attempts` is the model-call count: `1` on the uncurated
 * single call, `initial + repairs` on the curated loop.
 *
 * @remarks
 * `model` is the RESOLVED id (the {@link ResolvedModel} `resolvedId` of the model
 * that actually ran), not the requested name — they coincide for an explicit pick,
 * but for an empty "pick for me" request `model` reports the runtime's chosen
 * default, never the empty string. The pick is never a black box, on EITHER path —
 * the uncurated (raw) result names its model too, even though its program is
 * returned unmodified. Phase-1 invariant: populate `model` from
 * `ResolvedModel.resolvedId`, NEVER from the (possibly-empty) requested `model`.
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
 * - `ok: true`  — `program` and `meta` are set, `refusal` absent. On the curated
 *   path `program` is admitted AND conformant; on the uncurated path it is the
 *   model's candidate unmodified. EITHER way `meta` names which model ran — the
 *   uncurated program is unmodified, but the result still reports its model.
 * - `ok: false` — `refusal` is set, `program` and `meta` absent.
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
	RepairContext,
	ResolvedModel,
	ModelLoader,
	AithorRuntime,
	AithorConfig,
	ResolvedAithorConfig,
	RefusalCause,
	Refusal,
	Meta,
	AithorResult,
};
