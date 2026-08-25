// cspell:ignore aithor unparseable ungated unrepresentable UNIONED
/**
 * @file PROPOSED aithor contract (design dossier, pre-ratification) — the
 * domain model in TypeScript after all seven contract proposals land.
 *
 * DOSSIER ARTIFACT: this file is NOT compiled (tsc includes `src/**` only) and
 * the committed `aithor/types.ts` is untouched until the maintainer ratifies.
 * Import paths below are the intended END-STATE paths (the Wave-3 seat,
 * `src/lib/study-lenses/lib/aithor/`); the shared leaf landed as `screening`
 * and its path is settled. Every reshaped or deleted type carries a
 * `@remarks DELTA` note naming its wave and blast radius (evals / consumer
 * socket), per the dossier's obligations.
 *
 * VALUE-NOT-THROW is scoped to BRING-UP outcomes (AR-2 #3, human-ruled): the
 * loader seam absorbs every bring-up non-success into a {@link Refusal}
 * value, but a mid-generation rejection of the model call (seam 2) and a
 * throwing injected gate (seam 3) are infrastructure faults and PROPAGATE —
 * folding either into a refusal cause would misdescribe the device. This
 * matches the committed loop's live behavior.
 *
 * DELETED from the committed contract (Wave 2), with their blast radius:
 * - `FeatureName` — the closed learner-vocabulary union. Evals: the
 *   `featureDrift` Histogram is keyed by it (evals/types.ts, compute-metric-set)
 *   → re-keyed by node type at the Wave-2 evals re-author. Consumer: none (not
 *   transcribed).
 * - `FeatureSubset`, `FeatureViolation`, `ConformanceViolation`,
 *   `ConformResult` — the include/exclude resolution contract and `conform`'s
 *   result vocabulary dissolve into the leaf's walk (Findings) + the retained
 *   `SizeViolation`. Evals: CaseSpecs author `include`/`exclude` → re-authored.
 *   Consumer: none.
 * - `ResolvedAithorConfig`'s `include`/`exclude`/`validate` arms — see
 *   {@link ResolvedAithorConfig}.
 */

import type { SyntaxAllowlist } from '../screening/types.js'; // the shared screening leaf; sibling leaf from the Wave-3 seat
import type { SourceRange } from '../screening/types.js'; // offset-based { start, end }; moves with `Violation` (AR-1 #14, option a)
import type { LoadedModel } from '../local-llm/types.js';

// ─── Findings (the gate's refusal vocabulary; repair fuel) ────────────

/**
 * One located reason a gate refused a candidate — the unit of repair fuel.
 *
 * @remarks
 * A TRUE structural supertype of the levels region's `Violation`
 * (`{ nodeType, message, location, nodePath }`): `message` required,
 * `location` the region's offset-based {@link SourceRange} nested exactly as
 * `Violation` carries it, `nodePath` optional — so a consumer's gate returns
 * its level's violations unchanged AND losslessly (AR-1 blocker #1: a flat
 * `start`/`end` shape would have compiled while silently dropping every
 * location). Excess fields (`nodeType`) pass through untouched.
 */
type Finding = {
	readonly message: string;
	readonly location?: SourceRange;
	readonly nodePath?: string;
};

/**
 * What an injected gate answers for one candidate.
 *
 * @remarks
 * - `readonly Finding[]` — empty = pass; non-empty = refused, findings are
 *   repair fuel.
 * - `'undetermined'` — the gate CANNOT judge this candidate (the ratified
 *   carve-out: a level never gates what it can't parse; a level's validator
 *   is never consulted about an unparseable program — the undetermined
 *   verdict is the caller's, and this arm is where the caller says it).
 *   aithor's ruling: the attempt is REFUSED, never a result; repair fuel is
 *   aithor's own parse diagnosis (a located syntax finding when the candidate
 *   does not parse, a generic could-not-judge finding otherwise); the bound
 *   spends normally. (AR-1 blocker #3: without this arm the carve-out is
 *   unrepresentable and empty-findings collapses "cannot judge" into "pass".)
 */
type GateVerdict = readonly Finding[] | 'undetermined';

/**
 * The consumer-curried final correctness gate — the third impure seam.
 *
 * @remarks
 * COMPLETE AND FINAL when injected: aithor's walk tier does not pre-run (a
 * lifecycle profile asking for intentionally broken code would otherwise be
 * "repaired" into correctness). This one seam carries everything the consumer
 * composes: a level's `validate` curried over the consumer's own parse and
 * scope analysis, a posture union (strict = level gate; warn = the
 * orchestrator-computed `level ∪ featuresOf(seed)` union), a lifecycle
 * profile with embodiment as the judge. aithor relays findings and never
 * interprets them. A THROWING gate is a consumer defect and PROPAGATES —
 * never folded into a refusal. The gate does not receive the signal: the
 * consumer composed it and holds the same signal to close over.
 *
 * DELTA (Wave 2): replaces the hardwired `isJej` admission call — the one
 * JEJ seam in the committed orchestration core — and carries proposals 1
 * (level validate as final gate), 3 (posture unions, computed consumer-side),
 * and 4 (lifecycle profiles; reshaped out of the config — see SEQUENCING).
 */
type CandidateGate = (candidate: string) => Promise<GateVerdict>;

/**
 * Which correctness tier gated a curated result — the tier-honesty value.
 * `'injected'` — the consumer's gate; `'walk'` — the leaf's default-deny walk
 * over `allowlist.nodes`; `'parse'` — the trivial level (parses, nothing
 * more).
 */
type GateTier = 'injected' | 'walk' | 'parse';

// ─── Size bounds (kept) ───────────────────────────────────────────────

/**
 * The requested size limits — aithor's own level-free vocabulary, KEPT from
 * the committed contract. Gated on every curated attempt independent of the
 * gate hierarchy's tier; steered-only under `raw`.
 */
type SizeBounds = {
	readonly lines?: number;
	readonly complexity?: number;
};

/**
 * A whole-program metric over its requested bound — KEPT structured (AR-1 #7:
 * collapsing `limit`/`actual` into a Finding's prose would force the repair
 * builder to re-parse its own message).
 */
type SizeViolation = {
	readonly kind: 'size';
	readonly dimension: 'lines' | 'complexity';
	readonly limit: number;
	readonly actual: number;
	readonly message: string;
};

// ─── Repair (the seed a repair turn folds into the next prompt) ───────

/**
 * The seed a repair turn folds into the next prompt: the refused candidate
 * plus its repair fuel.
 *
 * @remarks
 * DELTA (Wave 2): the fuel element widens from the deleted
 * `ConformanceViolation` union to `Finding | SizeViolation` — gate findings
 * (or aithor's parse diagnosis on `'undetermined'`) beside structured size
 * violations. Non-empty by construction, as committed: a repair is only built
 * for a refused candidate.
 */
type RepairContext = {
	readonly candidate: string;
	readonly fuel: readonly [
		Finding | SizeViolation,
		...(Finding | SizeViolation)[],
	];
};

// ─── Model seams (loader widened for progress; otherwise carried) ─────

/**
 * A successfully brought-up model paired with the id of the model that was
 * actually resolved — aithor's re-mapping of local-llm's `LoadSuccess` (minus
 * the `ok` discriminant and the device-tier `resolvedRuntime`: the backend is
 * HOW, invisible; the model identity is learner-meaningful provenance).
 * CARRIED from the committed contract unchanged.
 */
type ResolvedModel = {
	readonly model: LoadedModel;
	readonly resolvedId: string;
};

/**
 * Brings a model into memory, load-once — the stateful seam (seam 1) and
 * aithor's value-not-throw boundary: it resolves to a {@link ResolvedModel}
 * or a {@link Refusal} — never a throw, never a leaked rejection — absorbing
 * local-llm's three non-success shapes (the unknown-name throw via the
 * catalog-membership pre-check, gated on a non-empty name; a `LoadFailure`
 * into `no-model-available` + the mapped {@link NextStep}; a propagated
 * probe/infrastructure fault into bare `no-model-available`). An empty name
 * passes through as the runtime's cost-aware default pick.
 *
 * DELTA (Wave 4, AR-2 blocker #1): gains the optional `onProgress` relay —
 * aithor-internal (this seam is aithor's own type, and local-llm's `load`
 * already accepts a progress callback), threading the per-call options'
 * observer down to the runtime's one-time-fetch reporting so the `bring-up`
 * progress event can carry its ratio. Blast radius: the runtime factory and
 * every loader fake; no cross-module obligation.
 */
type ModelLoader = (
	name: string,
	onProgress?: (progress: { readonly ratio?: number }) => void,
) => Promise<ResolvedModel | Refusal>;

/**
 * The injectable runtime — the excluded HOW behind the WHAT of `config`; the
 * seam through which the model loader is supplied (a real runtime in
 * production, a fake in tests). CARRIED from the committed contract; the
 * default-runtime factory remains a thin construction over local-llm (no
 * remote path), keeping the local-only invariant anchored in code.
 */
type AithorRuntime = {
	readonly loadModel: ModelLoader;
};

// ─── Vary (aspects; the hard tier re-expressed) ───────────────────────

/**
 * The pedagogy-facing control over the next Variation — per aspect, held
 * (`false`) pins to the seed, freed (`true` / absent) may drift.
 *
 * @remarks
 * DELTA (Wave 2): `languageLevel` is RENAMED `syntax` — under node-type
 * semantics a held aspect pins the seed's grammar, and the old name collided
 * with the level spine's `LanguageLevel` type in a module that is now
 * level-agnostic (AR-1 #10). Held `syntax` compiles to the seed's node-type
 * inventory (read through the leaf's published parse settings) UNIONED with the leaf's
 * structural floor (AR-1 #5 — without the floor, `let n = 3;` would forbid
 * the node types any variation must use); globals are not inventoried, and
 * the derived empty `admittedGlobals` renders no prompt clause (AR-1 #6).
 * Held `size` compiles to the seed's measures as `≤` maxima. Soft aspects
 * unchanged. Mutual-exclusivity and hard-hold-needs-a-seed throws unchanged
 * (now against `allowlist`/`lines`/`complexity`).
 *
 * Blast radius: evals' two vary-hold CaseSpecs re-authored (Wave 2);
 * consumer: none (vary is not in the socket request).
 */
type VaryConfig = {
	readonly syntax?: boolean;
	readonly size?: boolean;
	readonly behavior?: boolean;
	readonly strategy?: boolean;
	readonly implementation?: boolean;
};

/** One of the three soft (prompt-only) vary aspects. UNCHANGED. */
type SoftAspect = 'behavior' | 'strategy' | 'implementation';

/**
 * What a {@link VaryConfig} resolves to against a seed.
 *
 * @remarks
 * DELTA (Wave 2): the hard tier resolves to an optional {@link SyntaxAllowlist}
 * (absent when `syntax` is freed) + {@link SizeBounds}, replacing the deleted
 * `FeatureSubset` and its exclude-all idiom (a node-type inventory is never
 * empty for a parseable seed, so the idiom's edge case dissolves).
 */
type ResolvedVary = {
	readonly allowlist?: SyntaxAllowlist;
	readonly size: SizeBounds;
	readonly softHolds: readonly SoftAspect[];
};

// ─── Config (the request, minus the seed) ─────────────────────────────

/**
 * Everything a call carries besides the seed and the per-call options.
 *
 * @remarks
 * `prompt` and `model` are the ONLY required fields — the 5c stability
 * guarantee, standing on every wave: the consumer's socket request type
 * (`GeneratorRequest = { prompt, model }`) is a strict subset by
 * construction, and widening the required set breaks the zero-mapping swap
 * silently. Every field this dossier adds is optional.
 *
 * DELTA (Wave 2):
 * - GAINS `allowlist` (proposal 1 — steered always; gated by the walk tier
 *   when no gate is injected; `admittedGlobals` steered-never-gated),
 *   `steering` (the consumer-supplied prose summary; the P7 descriptor's
 *   hook), `gate` (proposals 1/3/4 — the injected final gate), `raw`
 *   (proposal 2 reshaped — the explicit uncurated opt-in replacing
 *   `validate: false`).
 * - LOSES `include`/`exclude` (→ `allowlist`) and `validate` (the curated/
 *   uncurated axis is now `raw`, default curated).
 * - Config-shape throws: `raw` beside `gate` (a gate cannot be steered, so
 *   there is no honest downgrade); `vary` declaring an aspect beside a
 *   hand-set `allowlist`/`lines`/`complexity`; a hard hold with an empty or
 *   unparseable seed. An EMPTY `allowlist.nodes` table is NOT a throw — it is
 *   a legitimate, honestly-unsatisfiable request (attempt-bound refusal).
 *
 * Blast radius: evals — every CaseSpec authors this shape (all 10
 * re-authored, `Quadrant` re-derived from `raw`); consumer — the socket
 * README pins "the two REQUIRED AithorConfig fields", which survives
 * verbatim; the maintainer flag still fires because the surrounding optional
 * shape the mock may mirror changed.
 */
type AithorConfig = {
	readonly prompt: string;
	readonly model: string;
	readonly allowlist?: SyntaxAllowlist;
	readonly steering?: string;
	readonly gate?: CandidateGate;
	readonly raw?: boolean;
	readonly lines?: number;
	readonly complexity?: number;
	readonly vary?: VaryConfig;
};

/**
 * The resolved request — the config after defaults, vary compilation, and
 * tier derivation; the one boundary state every downstream phase consumes.
 *
 * @remarks
 * DELTA (Wave 2, amended per AR-2 #5/#6): `raw` always populated (default
 * `false` = curated); `allowlist`/`steering`/`gate` pass through as given;
 * sizes pass through as-given (a vary hard hold supplies them); `softHolds`
 * carries the held soft aspects (empty when none — the sketch's resolved
 * request maps to THIS type, both directions); `tier` is the correctness
 * tier DERIVED ONCE at resolution from the filled slots (injected ≻ walk ≻
 * parse) — the single source `Meta.tier` reports and the by-construction
 * guarantee of one-tier-per-attempt. Meaningless under `raw` (no gating) but
 * still derived and carried for uniformity. The committed
 * `include`/`exclude`/`validate` arms are deleted with their fields.
 */
type ResolvedAithorConfig = {
	readonly prompt: string;
	readonly model: string;
	readonly raw: boolean;
	readonly tier: GateTier;
	readonly softHolds: readonly SoftAspect[];
	readonly allowlist?: SyntaxAllowlist;
	readonly steering?: string;
	readonly gate?: CandidateGate;
	readonly lines?: number;
	readonly complexity?: number;
};

// ─── Per-call options (proposal 5a/5b — additive, Wave 4) ─────────────

/**
 * One emission of the progress callback — observation only; no event carries
 * a value the result doesn't.
 *
 * @remarks
 * Named "event", not "phase": the package's lifecycle phases and the
 * consumer's `GeneratorPhase` are different vocabularies this module
 * deliberately does not speak (AR-1 #10). `bring-up` relays the runtime's
 * one-time-fetch ratio when the runtime reports one. `gating` is a real
 * span: an injected gate may embody and even execute the candidate.
 */
type AithorProgressEvent =
	| { readonly event: 'resolve' }
	| { readonly event: 'bring-up'; readonly ratio?: number }
	| { readonly event: 'attempt'; readonly attempt: number }
	| { readonly event: 'gating'; readonly attempt: number }
	| { readonly event: 'repair'; readonly attempt: number };

/**
 * The per-call options — the observation-and-abandonment window through the
 * pure-seeming surface. ADDITIVE (Wave 4): a fourth optional argument,
 * mirroring the consumer socket's `options?: { onPhase?, signal? }`.
 *
 * @remarks
 * - `signal` — checked at every seam boundary (before bring-up, before each
 *   model call, around the gate); an aborted request REJECTS with the
 *   signal's reason (the platform's abort convention; the socket's
 *   refusal-as-data seam swallows the rejection into never-settling, which
 *   its own contract declares conformant). TRUE in-flight interruption of a
 *   running fetch/load/generation is local-llm's, whose contract does not
 *   yet accept a signal — a named cross-module obligation (SEQUENCING), not
 *   silently assumed here.
 * - `onProgress` — wrapped and swallowed if it throws: observation must
 *   never change the outcome.
 */
type AithorOptions = {
	readonly signal?: AbortSignal;
	readonly onProgress?: (progress: AithorProgressEvent) => void;
};

// ─── Result / refusal (the boundary out — near-verbatim) ──────────────

/**
 * Why no result was reached. UNCHANGED (Wave 2 preserves all three members
 * and their semantics; the cancel exit deliberately adds NO `'cancelled'`
 * cause — an abort rejects, per the human's AR-1 ruling — so the evals'
 * bring-up vs attempt-bound bucketing and the consumer's transcription are
 * undisturbed).
 */
type RefusalCause =
	| 'attempt-bound-exhausted'
	| 'no-model-available'
	| 'unknown-model';

/** UNCHANGED — the product-neutral next-step category. */
type NextStep = 'retry' | 'free-space' | 'reconnect' | 'use-native-app';

/** UNCHANGED — a named cause, never an out-of-spec program. */
type Refusal = {
	readonly cause: RefusalCause;
	readonly nextStep?: NextStep;
};

/**
 * The meta a caller needs about a result — which model produced it and how
 * many model calls it took. Present on every success, absent on a refusal.
 *
 * @remarks
 * `model` is the RESOLVED id, never the requested name; `attempts` is the
 * model-call count (`1` on raw; `initial + repairs`, at most 3, on curated).
 *
 * DELTA (PROPOSED, gate item): the optional `tier` reports which correctness
 * tier gated a curated result ({@link GateTier}; absent on `raw`) — the
 * tier-honesty field, so a surface can never mislabel "validated to a level"
 * as merely "it parsed" during the transition where a bare
 * `{ prompt, model }` call gates on parse alone. ADDITIVE-OPTIONAL: the
 * evals read only `model`/`attempts` (unbroken); the consumer's
 * `GeneratorMeta` transcription may adopt it or ignore it — flagged either
 * way.
 */
type Meta = {
	readonly model: string;
	readonly attempts: number;
	readonly tier?: GateTier;
};

/**
 * What `aithor(program, config, runtime?, options?)` resolves to. UNCHANGED
 * shape: `ok: true` → `program` + `meta` (curated: the extracted code that
 * passed the derived gate and sizes; raw: the byte-exact reply — `program`
 * carries either, the envelope never forks); `ok: false` → `refusal`.
 * Findings never surface here — they are repair fuel, internal to the loop.
 */
type AithorResult = {
	readonly ok: boolean;
	readonly program?: string;
	readonly meta?: Meta;
	readonly refusal?: Refusal;
};

// ─── Exports ──────────────────────────────────────────────────────────

export type {
	Finding,
	GateVerdict,
	CandidateGate,
	GateTier,
	SizeBounds,
	SizeViolation,
	RepairContext,
	ResolvedModel,
	ModelLoader,
	AithorRuntime,
	VaryConfig,
	SoftAspect,
	ResolvedVary,
	AithorConfig,
	ResolvedAithorConfig,
	AithorProgressEvent,
	AithorOptions,
	RefusalCause,
	NextStep,
	Refusal,
	Meta,
	AithorResult,
};
