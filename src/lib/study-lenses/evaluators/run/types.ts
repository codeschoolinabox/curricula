/**
 * run's contract: the spec widening, the result-only handle, the
 * discriminated result, the error taxonomy, and the three worker seam
 * records. README.md carries the domain model and the design rulings
 * (2026-08-18/19); DOCS.md carries the architectural sketch this file
 * locks. Reference type names return wholesale (HR-8): `RunHandle`,
 * `RunResult`, `RunOptions`' resolved form, `IoMocks`, and the
 * `…ResultError` family; the additions (`IoResultError`,
 * `MachineryDefectError`) ride in reference style.
 *
 * Deliberately NOT declared here, so the boundary is visible: the handle
 * base and the shared vocabulary (`ExecutionBase`, `EvaluationOutcome`,
 * `ErrorPhase`, `MachineryDefectKind` — the region root's `../types.ts`);
 * the source seam run's main builds on (the execution-handle library's);
 * the trip record (iteration-guard's, re-exported through this boundary);
 * the engine's shapes (the seam modules import them directly; the one
 * engine vocabulary this contract speaks — the machinery half of
 * {@link RunDefectCause} — is mirrored structurally, locked inbound by a
 * compile-time probe in the tests).
 */

import type { Program } from 'acorn';

import type { HaltCore } from '../lib/guarded-worker-base/types.js';
import type { LimitTrip } from '../lib/iteration-guard/types.js';
import type {
	ErrorPhase,
	EvaluationOutcome,
	EvaluationSpec,
	ExecutionBase,
	MachineryDefectKind,
} from '../types.js';

export type { LimitTrip } from '../lib/iteration-guard/types.js';

// ─── The spec widening ───────────────────────────────────────────────────────

/**
 * Consumer-provided dialog answers, in the reference's shape: each verb
 * independently suppliable, each returning its value directly or via
 * Promise. Absent slots take run's io posture — a classified io error,
 * never a native dialog (the reference's rescission-engaged fallback is
 * superseded; DOCS.md § Decisions carries the engagement).
 */
export type IoMocks = {
	readonly prompt?: (
		message: string,
		defaultValue?: string,
	) => string | null | Promise<string | null>;
	readonly alert?: (message: string) => void | Promise<void>;
	readonly confirm?: (message: string) => boolean | Promise<boolean>;
};

/**
 * run's spec: the shared spec plus its one optional widening, per the
 * kind's optional-members-only rule.
 */
export type RunSpec = EvaluationSpec & {
	readonly io?: IoMocks;
};

/**
 * The options record echoed on the handle: `seconds` ALWAYS populated —
 * the engine owns the default and run imports it (the export is its own
 * named additive engine increment), never a second copy of the number;
 * `iterations` and `io` as given.
 */
export type ResolvedRunOptions = {
	readonly seconds: number;
	readonly iterations?: number;
	readonly io?: IoMocks;
};

// ─── The handle ──────────────────────────────────────────────────────────────

/**
 * run's handle: the settle base plus its eager echoes — result-only, NOT
 * AsyncIterable (run streams nothing; a result-only evaluator is a legal
 * evaluator, forward-compatibility requirement 13). `code` is
 * `facts.source.value`, the learner's own text — the guard-spliced text
 * run poses is never surfaced. `ast` is the facts' parsed root by
 * reference; the reference's `undefined`-iff-parse-failed arm is
 * unreachable under the kind's gate guarantee and is retired here, with
 * this sentence as its record.
 */
export type RunHandle = ExecutionBase<RunResult> & {
	readonly code: string;
	readonly ast: Program;
	readonly options: ResolvedRunOptions;
};

// ─── The error taxonomy ──────────────────────────────────────────────────────

/** The three dialog verbs a program can call. */
export type IoVerb = 'prompt' | 'alert' | 'confirm';

/**
 * The `'defect'` arm's discriminant: the machinery's structured causes
 * minus its timeout value (carrying that one would restate the timeout
 * arm — a second copy of one fact), plus run's own
 * `'unreachable-outcome'` for a condition it refuses to guess about — a
 * settlement combination the mapper cannot answer (including the
 * machinery's `'failed'` outcome, which run's surface cannot produce),
 * or an assemble-time dev condition where no machine ran and no
 * machinery cause would be honest (pin run:289). The mirror is locked by
 * a compile-time probe in the tests, inbound: a new machinery cause
 * fails the build loudly.
 */
export type RunDefectCause =
	| 'worker-error'
	| 'call-error'
	| 'hook-error'
	| 'unreachable-outcome';

/**
 * The program's own failure: a runtime throw, or a construction failure.
 * The ONLY arm carrying the two-value phase — every other learner-facing
 * arm is mid-run by construction, and a discriminant with one reachable
 * value would be noise (human ruling 2026-08-18). Carries the halt's
 * real iteration count (guards always splice). No `line`: run-side
 * call-site instrumentation is a named future increment, never a stack
 * parse.
 */
export type JavaScriptResultError = {
	readonly kind: 'javascript';
	readonly name: string;
	readonly message: string;
	readonly phase: ErrorPhase;
	readonly iterationCount: number;
};

/**
 * The io layer's failure — an ADDITION carrying a named supersede of the
 * reference's `'javascript'` classification (the ⑤a ledger bullet
 * carries the strength argument): an unmocked verb was called, a mock
 * threw or rejected, or a mock's answer failed per-verb validation.
 */
export type IoResultError = {
	readonly kind: 'io';
	readonly verb: IoVerb;
	readonly name: string;
	readonly message: string;
};

/**
 * The budget elapsed. `limit` echoes the resolved budget; `durationMs`
 * surfaces the consumed budget the machinery already computes (a ruled
 * free addition). No halt exists on this route, so no iteration count
 * rides it.
 */
export type TimeoutResultError = {
	readonly kind: 'timeout';
	readonly name: string;
	readonly message: string;
	readonly limit: number;
	readonly durationMs: number;
};

/**
 * The guard's marked trip: the whole trip record — loop index and
 * decoded span, spans decoding against the ORIGINAL text — never a bare
 * loc. The reference's `limit` echo is dropped (signed 2026-08-06): the
 * caller holds its own copy, and the trip is strictly richer.
 */
export type IterationLimitResultError = {
	readonly kind: 'iteration-limit';
	readonly name: string;
	readonly message: string;
	readonly iterationCount: number;
	readonly trip: LimitTrip;
};

/**
 * The machinery broke — never the learner's error, and never a phase of
 * the learner's program (no `phase` member, deliberately). The
 * discriminant literal is the kind's pin; the record is run's own.
 */
export type MachineryDefectError = {
	readonly kind: MachineryDefectKind;
	readonly name: string;
	readonly message: string;
	readonly cause: RunDefectCause;
};

/**
 * Every error kind run can surface, discriminated on `kind` — the family
 * roster, kept whole per HR-8. Deliberately, no result field types this
 * union: timeout and iteration-limit ride their own outcome arms, so the
 * `'error'` arm types only its three members. Neither side is a defect.
 */
export type RunResultError =
	| JavaScriptResultError
	| IoResultError
	| TimeoutResultError
	| IterationLimitResultError
	| MachineryDefectError;

// ─── The result ──────────────────────────────────────────────────────────────

/** run's five-value outcome subset: the kind's vocabulary minus `fail`. */
export type RunOutcome = Exclude<EvaluationOutcome, 'fail'>;

/**
 * run's result, discriminated on `outcome` so each arm carries exactly
 * the fields that exist for it — an HR-4 exception with its strength
 * argument (human ruling 2026-08-18): runtime values are identical to
 * the reference's flat shape, but a consumer narrowing on `outcome`
 * never reads an absent field. The pairing is structural: each error
 * kind types only on its arm, and `iterationCount` exists exactly where
 * a worker halt carried it — on the complete arm, and inside the
 * `'javascript'` and `'iteration-limit'` records. The cancel arm carries
 * none: the machinery's first-write-wins stop discards any halt (its
 * cancel route also outranks the io flag — precedence step 0, human
 * ruling 2026-08-19). `ast` rides every outcome; the result always
 * fulfills, deep-frozen, memoized.
 */
export type RunResult =
	| {
			readonly outcome: 'complete';
			readonly ok: true;
			readonly ast: Program;
			readonly iterationCount: number;
	  }
	| {
			readonly outcome: 'cancel';
			readonly ok: false;
			readonly ast: Program;
	  }
	| {
			readonly outcome: 'timeout';
			readonly ok: false;
			readonly ast: Program;
			readonly error: TimeoutResultError;
	  }
	| {
			readonly outcome: 'iteration-limit';
			readonly ok: false;
			readonly ast: Program;
			readonly error: IterationLimitResultError;
	  }
	| {
			readonly outcome: 'error';
			readonly ok: false;
			readonly ast: Program;
			readonly error:
				| JavaScriptResultError
				| IoResultError
				| MachineryDefectError;
	  };

// ─── Seam 1: the halt payload (worker → thread) ──────────────────────────────

/**
 * run's worker-authored, clone-safe stop record — authored on EVERY
 * worker-side stop (natural end and throw alike; the stop record is
 * authored where the raw throw lives, pin run:272), and narrowed exactly
 * ONCE thread-side (a payload failing the narrowing is the defensive
 * `'defect'` arm). Package-internal seam, not consumer surface.
 *
 * The shape stays declared here under run's name (the 2026-08-19
 * per-evaluator ruling, carried through the 2026-08-25 shared-author
 * resolution), and it IS the guarded worker base's core: run's setup
 * registers `createGuardedWorkerBase`'s author with NO finisher, so the
 * authored record is the core itself and the alias is that identity's
 * zero-drift record. What the alias buys, spelled out: a discriminated
 * union on `natural` — the natural arm pins its empty members (`phase:
 * null` included), the throw arm carries the engine's structural
 * `phase` non-null (the E2 increment), so the settlement mapper narrows
 * on `natural` and reads an {@link ErrorPhase}, never a fabricated
 * default. Intercept's halt differs through its finisher, never by
 * forking this skeleton.
 */
export type RunHalt = HaltCore;

// ─── Seam 2: the worker config (thread → worker) ─────────────────────────────

/**
 * The clone-safe data run delivers to its worker logic at setup.
 * `iterationLimit` is the spec's `iterations`, passed through UNCHANGED
 * — no clamp, no default, no finiteness gate (pin run:235; run owns the
 * cap policy and its policy is pass-through). Absent → the guard counts
 * but never throws.
 */
export type RunWorkerConfig = {
	readonly iterationLimit?: number;
};

// ─── Seam 3: the ask (worker → thread) ───────────────────────────────────────

/**
 * The clone-safe ask a dialog trap sends through the machinery's call
 * channel — minted at the worker-setup increment, consumed by the
 * thread-side io wrapper (which alone owns answer validation and io
 * classification; the trap does neither). The request is rendered as the
 * platform would render the dialog, the deprecated intercept setup's
 * own rules carried: `alert` rides two overloads — no argument is `''`,
 * one argument converts through `String` (an explicit `undefined`
 * renders `'undefined'`); `confirm`/`prompt` declare their message
 * optional-with-default, so an explicit `undefined` counts as omitted
 * (`''`); `prompt`'s `defaultValue` is ABSENT when undefined, never a
 * rendered `'undefined'`.
 */
export type RunIoRequest = {
	readonly verb: IoVerb;
	readonly message: string;
	readonly defaultValue?: string;
};

// ─── Seam 4: the io flag (resolver → mapper) ─────────────────────────────────

/**
 * run's closure-side io classification record — the settlement mapper's
 * precedence step 1 reads it (a flagged run settles the `'error'`
 * outcome's `'io'` arm, outranked only by the consumer's cancel, human
 * ruling 2026-08-19). The record IS the io arm's error, complete:
 * classification happens at the io seam, where the interrupted exchange
 * is known — an io failure reaches the machinery as its generic
 * call-error cause, so the mapper rides this record onto the arm
 * unchanged and re-derives nothing. The alias is that identity's
 * zero-drift record, the {@link RunHalt} pattern.
 */
export type RunIoFlag = IoResultError;

/**
 * The thread-side io resolver's answer, discriminated on `answered`:
 * the validated value ready to ride the machinery's response channel
 * back to the blocked trap, or the minted flag. The answer vocabulary
 * is the union of the three verbs' validated answers — prompt's
 * `string | null`, confirm's `boolean`, alert's `undefined` — which is
 * by the channel's own design exactly the value vocabulary it carries
 * (the engine's `CallResponse`, mirrored structurally per this file's
 * boundary and locked both directions by a compile-time probe in the
 * tests, the {@link RunDefectCause} pattern).
 */
export type RunIoResolution =
	| {
			readonly answered: true;
			readonly answer: string | boolean | null | undefined;
	  }
	| {
			readonly answered: false;
			readonly flag: RunIoFlag;
	  };
