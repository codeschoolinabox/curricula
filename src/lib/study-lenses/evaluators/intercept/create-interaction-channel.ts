/**
 * @file The interaction channel (DOCS.md phase 6): turn one ask into the
 * kind's distinguished event — the pending interaction whose answer channel
 * releases the suspended run exactly once.
 *
 * Authored THREAD-side and never a wire message: `respond` is a live
 * main-thread function; `request` is the clone-safe ask that did cross. The
 * event is deep-frozen where it is authored (the freeze-where-authored
 * constraint) — freezing does not disable `respond`, since a frozen
 * object's function property still calls.
 *
 * `respond` keeps the kind's `unknown` parameter (the contravariant-
 * parameter ruling: narrowing it per request kind would break
 * assignability to the kind's `PendingInteraction`), so the per-kind
 * discipline is a RUNTIME
 * boundary check (D9): a `prompt` takes a string or null, a `confirm` a
 * boolean, an `alert` anything — and alert's answer is IGNORED, so what is
 * delivered for it is the modelled `undefined`, never the caller's value
 * (D3/H-3: any answer releases it; its value never crosses the wire). A
 * wrong-kind answer throws a synchronous `TypeError` at the caller — the
 * run stays suspended and the ask is retryable. Answering twice is inert.
 *
 * Teardown is consulted FIRST, before validation, so a lens unmounting
 * mid-interaction never throws out of a dead stream: a post-teardown answer
 * is inert whatever it carries, and one that would have failed validation
 * is `console.warn`ed — the dev defect is diagnosed rather than silently
 * timing-dependent (the AR-LOG's "Teardown wins over validation, plus a
 * diagnostic" entry).
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type {
	InterceptAnswer,
	InterceptAskMessage,
	InterceptInteractionRequest,
	InterceptPendingInteraction,
} from './types.js';

/**
 * Author the pending interaction for one ask.
 *
 * @param channel - The ask's envelope and the stream's hooks: `ask` carries
 *   the request plus the step and loc the event wears; `deliver` releases
 *   the blocked program with the validated answer; `isTornDown` is the
 *   stream's teardown probe, consulted before anything else on every
 *   answer.
 * @returns The deep-frozen pending interaction, its answer channel live.
 */
export default function createInteractionChannel(channel: {
	readonly ask: InterceptAskMessage;
	readonly deliver: (answer: InterceptAnswer) => void;
	readonly isTornDown: () => boolean;
}): InterceptPendingInteraction {
	const { ask, deliver, isTornDown } = channel;
	const { kind } = ask.request;
	// The per-interaction answered latch — closure state under the DEV.md § 8
	// low-level license (iteration-guard's counters are the precedent):
	// per-ask disposable, written only below.
	let answered = false;

	function respond(answer: unknown): void {
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
		kind: 'pending-interaction' as const,
		step: ask.step,
		loc: ask.loc,
		request: ask.request,
		respond,
	});
}

type RequestKind = InterceptInteractionRequest['kind'];

/** D9's per-kind boundary: prompt takes a string or null, confirm a
 * boolean, alert anything (its value is ignored). */
function isValidAnswer(kind: RequestKind, answer: unknown): boolean {
	if (kind === 'prompt') {
		return answer === null || typeof answer === 'string';
	}
	if (kind === 'confirm') {
		return typeof answer === 'boolean';
	}
	return true;
}

/** What actually crosses back: alert's answer is IGNORED (D3/H-3), so the
 * modelled undefined is delivered and nothing the channel cannot carry
 * ever reaches the wire; the validated confirm/prompt answers ride. */
function modelDeliveredAnswer(
	kind: RequestKind,
	answer: unknown,
): InterceptAnswer {
	// Declared-uninitialized IS alert's modelled undefined.
	let delivered: InterceptAnswer;
	if (kind !== 'alert') {
		// WHY the cast: the answer just passed isValidAnswer for this kind, so
		// it is a string-or-null (prompt) or boolean (confirm) at runtime; a
		// type predicate cannot say so soundly because alert's arm validates
		// anything while never delivering it.
		delivered = answer as InterceptAnswer;
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
