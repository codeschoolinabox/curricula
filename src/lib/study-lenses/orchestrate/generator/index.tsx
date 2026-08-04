// cspell:ignore affordance

/**
 * The generator view — the pane's THIRD occupant, where a learner remixes their
 * own program with a prompt. It mounts over the program exactly as it stood at
 * the open: the seed read-only, the prompt empty, and the warning already said.
 * One ask leaves at a time; the stages are reported as the socket announces
 * them; what came back renders for the learner's judgment.
 *
 * @remarks
 * Selector contract (data attributes; label text is never an anchor):
 * `data-generator` on the view root; `data-generator-seed` on the read-only
 * seed; `data-generator-prompt` on the prompt field; `data-generator-generate`
 * on the ask affordance ("Generate"), which is not live while an empty prompt
 * sits over an empty seed — that pair asks nothing — and not live while an ask
 * is already in flight, since one ask is in flight per mount.
 * `data-generator-output` holds the stage report, then either
 * `data-generator-preview` (the candidate, with `data-generator-meta` beside it
 * naming the producer and its attempt count) or `data-generator-refusal`. The
 * stage report carries no attribute of its own: it is prose, not an affordance.
 *
 * `data-generator-cancel` is the reset control — ONE control with TWO labels:
 * "Stop" while an ask is in flight, "Start over" once a candidate or a refusal
 * is on screen. `data-generator-accept` ("Accept") renders over a candidate
 * alone — there is no candidate to accept over a refusal — and
 * `data-generator-discard` ("Discard") renders over either. All three sit
 * OUTSIDE the output slot: that slot's whole text is the stage report or the
 * answer, and a control inside it would join the prose.
 *
 * Retiring is one act reached from two places. Cancel retires the ask and
 * returns the job to idle without leaving the view: no callback fires, and the
 * seed and the prompt both survive for an immediate re-ask. The unmount retires
 * AND aborts the live ask's signal. Either way a retired ask is unobservable —
 * its later stages and its answer are dropped before anything is unwrapped, so
 * an abandoned ask can never resurrect a preview over the next one.
 *
 * Emptiness is literal here, as it is at the socket: a whitespace-only prompt
 * is learner text that survives into the candidate, so it is something to ask
 * about. The warning carries no attribute of its own either. The view renders
 * inline text only and no heading elements, so the instrument's sole headings
 * stay the guide's topic titles.
 *
 * The view reports the stages the socket ANNOUNCES and never one it guessed at
 * — bring-up and drafting take unpredictable time on a learner's own device,
 * and a view that timed its own transitions would lie under load.
 *
 * An answer the result shape cannot serve is an invariant violation, loud in
 * development and production alike: the view never invents a producer or a
 * cause it was not given, because every one it could name would be a lie.
 *
 * View docs: ./README.md (the view contract) · ./DOCS.md (the architectural
 * sketch, whose five phases this file answers).
 */

import React from 'react';

import freezeInPlace from '@utils/freeze-in-place.js';

import type {
	GeneratorJob,
	GeneratorMeta,
	GeneratorNextStepCopy,
	GeneratorPhase,
	GeneratorRefusalCopy,
	GeneratorResult,
	GeneratorViewProperties,
} from './types.js';

export default function GeneratorView({
	seed,
	socket,
	onAccept,
	onDiscard,
}: GeneratorViewProperties): React.JSX.Element {
	const [prompt, setPrompt] = React.useState('');
	const [job, setJob] = React.useState<GeneratorJob>({ status: 'idle' });
	// The ask this view is still listening to, and the handle that aborts it.
	// Held in a ref rather than in state: nothing renders from it, and a live
	// ask must be reachable from an unmount cleanup that runs after the last
	// render. Absent from types.ts deliberately — it is an implementation
	// device, not domain vocabulary.
	const liveAskReference = React.useRef<AbortController | null>(null);
	const hasSomethingToAskAbout = seed !== '' || prompt !== '';
	// One ask in flight per mount: the affordance is spent while a stage the
	// socket announced is on screen, and live again once an answer is.
	const isAskInFlight = job.status === 'loading' || job.status === 'generating';
	// An answer is on screen — the two stages a learner can leave the excursion
	// from. Accepting needs a candidate, so it is narrower still.
	const hasAnswer = job.status === 'preview' || job.status === 'refused';
	// The union of the two, and the whole of what the job has to show: a stage
	// report, or the answer that replaced it. The output slot opens for exactly
	// this, and the reset control is offered for exactly this — one predicate,
	// because they are one fact.
	const hasStageOrAnswer = isAskInFlight || hasAnswer;

	// Phase 5, Retire — the unmount half, and the only one that also aborts.
	// The cleanup fires once at mount as well, because StrictMode double-invokes
	// effects; that is harmless, since no ask can be live before the first click.
	React.useEffect(function retireOnUnmount() {
		return function abandonTheLiveAsk() {
			liveAskReference.current?.abort();
			retire();
		};
	}, []);

	// Phase 5, Retire — the whole of it. Releasing the handle is what makes an
	// ask's later stages and its answer unobservable, because every callback it
	// handed over checks the handle before it touches state.
	function retire(): void {
		liveAskReference.current = null;
	}

	function ask(): void {
		// Installed BEFORE the call, never after: `loading` is announced
		// synchronously inside `generate`, ahead of its first wait, so a handle
		// installed afterwards would miss its own first stage.
		const liveAsk = new AbortController();
		liveAskReference.current = liveAsk;

		void socket
			.generate(
				seed,
				{ prompt, model: PICK_FOR_ME },
				{ onPhase: reportStage, signal: liveAsk.signal },
			)
			.then(present, reportRejection);

		// These three belong to THIS ask, not to the view: each checks that its
		// own ask is still the live one before touching state. A retired ask —
		// cancelled, unmounted, or superseded by a later ask — falls through
		// every guard, so its answer is never even unwrapped.
		function reportStage(phase: GeneratorPhase): void {
			if (liveAskReference.current !== liveAsk) return;
			setJob({ status: phase });
		}

		function present(answer: GeneratorResult): void {
			if (liveAskReference.current !== liveAsk) return;
			setJob(() => readAnswer(answer));
		}

		// Rejection is handled as `then`'s second argument rather than a
		// trailing `.catch`, so it answers for the SOCKET's promise alone and
		// never swallows the invariant violations `present` raises.
		function reportRejection(reason: unknown): void {
			if (liveAskReference.current !== liveAsk) return;
			setJob(() => readRejection(reason));
		}
	}

	// Phase 4, Resolve — the reset arm. It retires and re-arms, staying inside
	// the view: no intent is raised, and the seed and the prompt both survive
	// beside the job for an immediate re-ask.
	function cancelAsk(): void {
		retire();
		setJob({ status: 'idle' });
	}

	return (
		<div data-generator>
			<p>{TAKES_TIME_WARNING}</p>
			<pre data-generator-seed>{seed}</pre>
			<label>
				{PROMPT_LABEL}
				<textarea
					data-generator-prompt
					onChange={(event) => setPrompt(event.target.value)}
					value={prompt}
				/>
			</label>
			<button
				data-generator-generate
				disabled={!hasSomethingToAskAbout || isAskInFlight}
				onClick={ask}
				type="button"
			>
				Generate
			</button>
			{hasStageOrAnswer && (
				<div data-generator-output>
					{(job.status === 'loading' || job.status === 'generating') && (
						<p>{STAGE_REPORTS[job.status]}</p>
					)}
					{job.status === 'preview' && (
						<>
							<pre data-generator-preview>{job.program}</pre>
							{/* One branch, not two: the meta line is not optional
							    decoration beside a candidate — it is how a learner
							    reading a placeholder program is told no model ran, in
							    the same place they would be told a model's name. */}
							<p data-generator-meta>{describeProducer(job.meta)}</p>
						</>
					)}
					{job.status === 'refused' && (
						<div data-generator-refusal>
							<p>{REFUSAL_SENTENCES[job.refusal.cause]}</p>
							{job.refusal.nextStep !== undefined && (
								<p>{NEXT_STEP_LINES[job.refusal.nextStep]}</p>
							)}
						</div>
					)}
				</div>
			)}
			{hasStageOrAnswer && (
				<button data-generator-cancel onClick={cancelAsk} type="button">
					{isAskInFlight ? 'Stop' : 'Start over'}
				</button>
			)}
			{/* The status test stays inline here rather than moving to a named
			    value beside the others: it is what narrows `job` to its preview
			    arm, and a boolean alias would leave `job.program` unreachable. */}
			{job.status === 'preview' && (
				<button
					data-generator-accept
					onClick={() => onAccept(job.program)}
					type="button"
				>
					Accept
				</button>
			)}
			{hasAnswer && (
				<button data-generator-discard onClick={onDiscard} type="button">
					Discard
				</button>
			)}
		</div>
	);
}

// Both facts, before the first click: a learner who is not told loses an ask to
// a control one click away in the same band, and hears why only afterwards.
const TAKES_TIME_WARNING =
	'Generating can take a while. Leaving this view ends it — and so does changing the level, the posture, or the snippet type.';

const PROMPT_LABEL = 'Your prompt';

// The pick-for-me ask: the runtime chooses and reports back what it chose. This
// view offers no model picker, so the request never carries a name.
const PICK_FOR_ME = '';

// One line per stage the socket can announce, so a stage with no words fails
// `tsc` rather than reporting an empty slot. Neither line names a model: the
// placeholder announces both stages and no model runs behind it, so anything
// that promised one would be a lie at the default socket.
const STAGE_REPORTS: Readonly<Record<GeneratorPhase, string>> = freezeInPlace({
	loading: 'Getting the generator ready…',
	generating: 'Writing a program…',
});

// Transcribed from README.md § Refusal copy — the learner-worded table is the
// contract, and this is its only implementation. The ANNOTATIONS are what make
// both maps total: a cause or a category with no words fails `tsc` rather than
// rendering an empty slot, and an `as const` with a fallback at the render site
// would type-check and quietly ship the blank one.
const REFUSAL_SENTENCES: GeneratorRefusalCopy = freezeInPlace({
	'attempt-bound-exhausted':
		"The generator tried a few times but couldn't make a program that fits — adjust the prompt and ask again.",
	'no-model-available': 'No model can run here right now.',
	'unknown-model': "The generator doesn't know the model that was asked for.",
});

const NEXT_STEP_LINES: GeneratorNextStepCopy = freezeInPlace({
	retry: 'Try again.',
	'free-space':
		'Your device is low on storage — free some space and try again.',
	reconnect:
		"The model couldn't download — check your connection and try again.",
	'use-native-app':
		"This device can't run a model inside a web browser — a desktop app can.",
});

// The unwrap site. `generate` RESOLVES, always, so the job carries no error
// arm — but a resolution the result shape cannot serve is an invariant
// violation, and this is where it is caught. Presence, never truthiness: an
// empty-string program is a candidate the learner is entitled to see, while a
// MISSING one is a socket that broke its contract. The `meta` arm is the one
// the docs' parenthetical omits and `tsc` finds: defaulting it would invent a
// producer, which is the exact lie the meta slot exists to prevent.
function readAnswer(answer: GeneratorResult): GeneratorJob {
	if (!answer.ok) {
		if (answer.refusal === undefined) {
			throw new Error(
				'generator invariant violated: a refusal carried no cause',
			);
		}
		return { status: 'refused', refusal: answer.refusal };
	}

	if (answer.program === undefined) {
		throw new Error(
			'generator invariant violated: a candidate carried no program',
		);
	}

	if (answer.meta === undefined) {
		throw new Error(
			'generator invariant violated: a candidate named no producer',
		);
	}

	return { status: 'preview', program: answer.program, meta: answer.meta };
}

// The seam's other invariant violation, and the louder-looking one: refusal-as-
// data is TOTAL across it, so `generate` resolves, always. A rejection is a
// socket that broke its contract — a socket wrapping a core that throws owns
// catching it and answering with a refusal. Raised from inside the state
// updater like `readAnswer`'s three arms, so it lands in RENDER instead of
// escaping as an unhandled rejection nobody sees, and it carries the underlying
// reason as the error's cause rather than flattening it into the message.
function readRejection(reason: unknown): GeneratorJob {
	throw new Error(
		'generator invariant violated: the ask rejected instead of answering',
		{ cause: reason },
	);
}

// The producer is never a black box: a socket backed by a real model reports
// the model that ran, and the placeholder reports ITSELF, so the same line is
// honest either way and renders beside every candidate.
function describeProducer({ model, attempts }: GeneratorMeta): string {
	const passes = attempts === 1 ? '1 attempt' : `${attempts} attempts`;
	return `Produced by ${model} in ${passes}.`;
}
