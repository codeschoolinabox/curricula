// cspell:ignore affordances

/**
 * The generator view's contract: the result vocabulary the aithor seam
 * speaks, the socket the view calls, the per-mount generation job, and the
 * view's own properties.
 *
 * View docs: ./README.md (the view contract + the refusal copy) · ./DOCS.md
 * (architecture). The region glossary (../README.md) owns the shared
 * vocabulary.
 */

// ─────────────────────────────────────────────────────────────────────────────
// The mirrored contract
// ─────────────────────────────────────────────────────────────────────────────

// Transcribed from the committed aithor contract, never imported: that core
// lives in another tree, so a transcription keeps this region's compile
// independent of it and costs one file. Every field carries `readonly` as
// transcription fidelity — a convention, not a guarantee: two-way assignability
// cannot see a `readonly` modifier at all, so only a strict-identity comparison
// against the contract would catch a mutable transcription.
//
// `GeneratorRequest` is not a transcription of anything. It is this consumer's
// own shape — narrower than `AithorConfig` by construction, and this view's to
// define; comparing it to the whole config would prove nothing, since the two
// are structurally assignable in both directions.

/**
 * What one ask carries besides the seed program — the two required fields of
 * the aithor config and nothing else.
 *
 * @remarks
 * `model` is a name from an open, growing set, so a `string` rather than an
 * enum. The EMPTY string is the pick-for-me request: the runtime chooses, and
 * the chosen id comes back in {@link GeneratorMeta}. A non-empty name the
 * runtime does not know refuses as `unknown-model`. The generator view sends
 * the empty string — model selection is not a control it offers — so that cause
 * reaches it only from the socket's own side.
 */
export type GeneratorRequest = {
	readonly prompt: string;
	readonly model: string;
};

/**
 * Why no program was reached.
 *
 * @remarks
 * - `attempt-bound-exhausted` — the curated loop ran out of attempts; some
 *   asks are unsatisfiable.
 * - `no-model-available` — the device cannot bring up a model it otherwise
 *   knows.
 * - `unknown-model` — a non-empty model name absent from the runtime's
 *   catalog. Kept distinct so a misnamed model never masquerades as
 *   device-unavailability.
 */
export type GeneratorRefusalCause =
	| 'attempt-bound-exhausted'
	| 'no-model-available'
	| 'unknown-model';

/**
 * The product-neutral, actionable category a device-limit refusal carries —
 * what KIND of next step is honest, never a product, a vendor, or a URL.
 *
 * @remarks
 * `use-native-app` means THIS DEVICE cannot bring up any model in the browser
 * — not that some other browser would do. The view's copy table says so in
 * learner words.
 */
export type GeneratorNextStep =
	| 'retry'
	| 'free-space'
	| 'reconnect'
	| 'use-native-app';

/**
 * A named cause, never an out-of-spec program. The next step rides only where
 * an honest device-limit category exists; its absence is the signal that there
 * is nothing actionable beyond the cause.
 */
export type GeneratorRefusal = {
	readonly cause: GeneratorRefusalCause;
	readonly nextStep?: GeneratorNextStep;
};

/**
 * Which model produced a program and how many model calls it took. Present on
 * every success, absent on every refusal.
 *
 * @remarks
 * `model` is the RESOLVED id of the model that actually ran, never the
 * requested name — for a pick-for-me ask the two differ, and the pick is never
 * a black box. It renders beside the candidate for exactly that reason: a
 * learner judging a generated program is told which model produced it and how
 * many attempts it took.
 */
export type GeneratorMeta = {
	readonly model: string;
	readonly attempts: number;
};

/**
 * What one ask resolves to. Boolean-`ok`, mirroring the contract: consumers
 * check `ok`, not a discriminated tag — `ok: true` sets `program` and `meta`,
 * `ok: false` sets `refusal`.
 */
export type GeneratorResult = {
	readonly ok: boolean;
	readonly program?: string;
	readonly meta?: GeneratorMeta;
	readonly refusal?: GeneratorRefusal;
};

// ─────────────────────────────────────────────────────────────────────────────
// The socket
// ─────────────────────────────────────────────────────────────────────────────

/**
 * What the socket announces as it works — the two stages the view can report
 * honestly before an answer exists. Named for the job stages they drive.
 */
export type GeneratorPhase = 'loading' | 'generating';

/**
 * The consumer-side seam the view calls: one ask, the committed aithor
 * signature behind it.
 *
 * @remarks
 * `onPhase` and `signal` are CONSUMER-side affordances the socket provides —
 * the real socket constructs the runtime, so it can observe bring-up and abort
 * best-effort; the aithor contract itself carries neither.
 *
 * Refusal-as-data is TOTAL across this seam, and a well-formed answer is the
 * socket's to guarantee: `generate` RESOLVES, always, which is why
 * {@link GeneratorJob} has no error arm. A rejected promise is an invariant violation — and so is a
 * resolution the result shape cannot serve (`ok` true with no `program`, `ok`
 * false with no `refusal`), since {@link GeneratorJob}'s arms require what
 * those omit and the view may not invent a cause. A socket wrapping a core that
 * throws on a malformed request owns catching it and returning a refusal.
 */
export type GeneratorSocket = {
	readonly generate: (
		program: string,
		request: GeneratorRequest,
		options?: {
			readonly onPhase?: (phase: GeneratorPhase) => void;
			readonly signal?: AbortSignal;
		},
	) => Promise<GeneratorResult>;
};

// ─────────────────────────────────────────────────────────────────────────────
// The generation job and the view
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The view-local machine, per mount and ephemeral: idle → loading →
 * generating → preview | refused.
 *
 * @remarks
 * One uniform `status` discriminant on every arm — including the payload-free
 * ones — so returning to `{ status: 'idle' }` is one value the type proves
 * carries nothing forward. That totality is over STATE only: abandoning the
 * in-flight ask is a separate act (./DOCS.md § Structural constraints,
 * "Retirement is total"), and cancel must do both or a late answer resurrects
 * a preview the learner already dismissed.
 *
 * The seed and the prompt are deliberately NOT job fields. They live beside the
 * job, which is what lets a cancel return it to idle while the learner's own
 * text survives for an immediate re-ask. The retirement token is likewise
 * absent: it is an implementation device, not domain vocabulary.
 */
export type GeneratorJob =
	| { readonly status: 'idle' }
	| { readonly status: 'loading' }
	| { readonly status: 'generating' }
	| {
			readonly status: 'preview';
			readonly program: string;
			readonly meta: GeneratorMeta;
	  }
	| { readonly status: 'refused'; readonly refusal: GeneratorRefusal };

/**
 * One learner-worded sentence per refusal cause, total over the causes.
 *
 * @remarks
 * Totality is the point: a cause with no sentence fails `tsc` rather than
 * rendering an empty slot. The guard only fires where a value is annotated
 * with this type — the region's `display-labels.ts` is the same pattern.
 */
export type GeneratorRefusalCopy = Readonly<
	Record<GeneratorRefusalCause, string>
>;

/** One learner-worded line per next step, total over the categories. */
export type GeneratorNextStepCopy = Readonly<Record<GeneratorNextStep, string>>;

/**
 * What the view receives: the frozen open-time program to remix, the socket to
 * ask, and the two intents it raises upward. It commits nothing itself — the
 * top component owns every commit.
 *
 * @remarks
 * The view treats the socket as FIXED FOR THE MOUNT: the composition root
 * creates it once, so no re-render can change the seam a live ask is bound to.
 * It is held in mount-frozen session state beside the bus and the memoized
 * validate.
 */
export type GeneratorViewProperties = {
	readonly seed: string;
	readonly socket: GeneratorSocket;
	readonly onAccept: (program: string) => void;
	readonly onDiscard: () => void;
};
