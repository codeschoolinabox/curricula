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
 * sketch, whose phases 1 "Seat the seed", 2 "Ask" and 3 "Present" this file
 * answers).
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
}: GeneratorViewProperties): React.JSX.Element {
	const [prompt, setPrompt] = React.useState('');
	const [job, setJob] = React.useState<GeneratorJob>({ status: 'idle' });
	const hasSomethingToAskAbout = seed !== '' || prompt !== '';
	// One ask in flight per mount: the affordance is spent while a stage the
	// socket announced is on screen, and live again once an answer is.
	const isAskInFlight = job.status === 'loading' || job.status === 'generating';

	function reportStage(phase: GeneratorPhase): void {
		setJob({ status: phase });
	}

	function present(answer: GeneratorResult): void {
		setJob(() => readAnswer(answer));
	}

	function ask(): void {
		void socket
			.generate(seed, { prompt, model: PICK_FOR_ME }, { onPhase: reportStage })
			.then(present);
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
			{job.status !== 'idle' && (
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

// The producer is never a black box: a socket backed by a real model reports
// the model that ran, and the placeholder reports ITSELF, so the same line is
// honest either way and renders beside every candidate.
function describeProducer({ model, attempts }: GeneratorMeta): string {
	const passes = attempts === 1 ? '1 attempt' : `${attempts} attempts`;
	return `Produced by ${model} in ${passes}.`;
}
