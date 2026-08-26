/**
 * @file The interaction channel (DOCS.md phase 4's minting half): turn one
 * ask into the kind's distinguished event — the pending interaction whose
 * answer channel releases the suspended run exactly once.
 *
 * Authored THREAD-side and never a wire message: `respond` is a live
 * main-thread function; `request` is the clone-safe ask that did cross.
 * The channel is mint-only — a supplied dialog mock answers at `serveAsk`
 * BEFORE this module is ever reached (mock-before-mint, README § io), so
 * a channel exists exactly for the unmocked ask of a stepping consumer.
 * The event is deep-frozen where it is authored (the freeze-where-
 * authored constraint) — freezing does not disable `respond`, since a
 * frozen object's function property still calls.
 *
 * The per-verb discipline is a RUNTIME boundary check at the responder
 * (README § io — a wrong answer shape is a loud, retryable dev error,
 * never a learner outcome): a `prompt` takes a string or null, a
 * `confirm` a boolean, an `alert` anything — and alert's answer is
 * IGNORED, so what is delivered for it is the modelled `undefined`, never
 * the caller's value (the deprecated channel's D3/H-3 rulings, carried).
 * A wrong-kind answer throws a synchronous `TypeError` at the caller —
 * the run stays suspended and the ask is retryable. Answering twice is
 * inert.
 *
 * Teardown is consulted FIRST, before validation, so a lens unmounting
 * mid-interaction never throws out of a dead stream: a post-teardown
 * answer is inert whatever it carries, and one that would have failed
 * validation is `console.warn`ed — the dev defect is diagnosed rather
 * than silently timing-dependent (the deprecated channel's human ruling
 * 2026-08-04, carried).
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type {
	InterceptAskMessage,
	InterceptDialogAnswer,
	InterceptInteractionRequest,
	InterceptPendingInteraction,
} from './types.js';

/**
 * Author the pending interaction for one ask.
 *
 * @param channel - The ask's envelope and the stream's hooks: `ask`
 *   carries the request plus the step and attribution legs the event
 *   wears; `deliver` releases the blocked program with the validated
 *   answer; `isTornDown` is the stream's teardown probe, consulted before
 *   anything else on every answer.
 * @returns The deep-frozen pending interaction, its answer channel live.
 */
export default function createInteractionChannel(channel: {
	readonly ask: InterceptAskMessage;
	readonly deliver: (answer: InterceptDialogAnswer) => void;
	readonly isTornDown: () => boolean;
}): InterceptPendingInteraction {
	const { ask, deliver, isTornDown } = channel;
	const { kind } = ask.request;
	// The per-interaction answered latch — closure state under the DEV.md § 8
	// low-level license (iteration-guard's counters are the precedent):
	// per-ask disposable, written only below.
	let answered = false;

	function respond(answer: InterceptDialogAnswer): void {
		if (isTornDown()) {
			if (!isValidAnswer(kind, answer)) {
				console.warn(
					`intercept: a ${kind} interaction was answered after teardown with a value its kind rejects (${describeExpected(kind)}) — a dev defect, inert either way`,
				);
			}
			return;
		}
		if (answered) {
			return;
		}
		if (!isValidAnswer(kind, answer)) {
			throw new TypeError(
				`intercept: a ${kind} interaction ${describeExpected(kind)} — the run stays suspended and the ask can be answered again`,
			);
		}
		answered = true;
		deliver(modelDeliveredAnswer(kind, answer));
	}

	return freezeInPlace({
		event: 'pending-interaction' as const,
		step: ask.step,
		loc: ask.loc,
		start: ask.start,
		end: ask.end,
		request: ask.request,
		respond,
	});
}

type RequestKind = InterceptInteractionRequest['kind'];

/** The per-verb boundary (the deprecated channel's D9, carried): prompt
 * takes a string or null, confirm a boolean, alert anything (its value
 * is ignored). */
function isValidAnswer(kind: RequestKind, answer: unknown): boolean {
	if (kind === 'prompt') {
		return answer === null || typeof answer === 'string';
	}
	if (kind === 'confirm') {
		return typeof answer === 'boolean';
	}
	return true;
}

/** What actually crosses back: alert's answer is IGNORED (D3/H-3,
 * carried), so the modelled undefined is delivered and nothing the
 * channel cannot carry ever reaches the wire; the validated
 * confirm/prompt answers ride. */
function modelDeliveredAnswer(
	kind: RequestKind,
	answer: InterceptDialogAnswer,
): InterceptDialogAnswer {
	// Declared-uninitialized IS alert's modelled undefined.
	let delivered: InterceptDialogAnswer;
	if (kind !== 'alert') {
		delivered = answer;
	}
	return delivered;
}

function describeExpected(kind: RequestKind): string {
	if (kind === 'prompt') {
		return 'takes a string or null';
	}
	if (kind === 'confirm') {
		return 'takes a boolean';
	}
	// Unreachable given isValidAnswer's alert arm; kept for the three-kind
	// symmetry the per-kind helpers share.
	return 'takes any answer, which it ignores';
}
