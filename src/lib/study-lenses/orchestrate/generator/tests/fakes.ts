/**
 * Shared test doubles for the generator view's suite. DEV.md § Test Data bans
 * shared *data* — every seed, prompt, and result stays inline per test — not a
 * factory for a collaborator the suite is obliged to inject: the view's props
 * REQUIRE a socket, so every render must hand one over.
 *
 * Grows per increment. The mount (inc 2) never asks, so it needs only a socket
 * that proves it never asked; the job flow (inc 3) adds a scripted socket that
 * announces stages and resolves, and cancel (inc 4) adds an abortable one.
 */

import type {
	GeneratorPhase,
	GeneratorResult,
	GeneratorSocket,
} from '../types.js';

// The mount seats its seed and stops — no ask leaves it. So this double answers
// nothing and throws instead: a stray effect or an eager ask at mount detonates
// with a named error rather than passing quietly on a resolution nobody reads.
// (The same move as local-llm's `registeredAdapter`, for the same reason.)
export function unaskedSocket(): GeneratorSocket {
	return {
		generate() {
			throw new Error('unaskedSocket: the view asked, and this mount must not');
		},
	};
}

// One ask, scripted: the phases it announces and the answer it gives, both the
// test's to choose. Announcing is SYNCHRONOUS, matching the committed socket,
// whose `loading` lands inside the call before its first wait.
//
// WHY an omitted `answers` never settles rather than resolving something empty:
// the contract permits a socket that never settles, and a never-settling ask is
// the only way to hold the view at a mid-flight stage long enough to assert it
// — with no timers, no controllable handle, and no mutable closure. The shipped
// socket does the same thing for an aborted ask (`holdOpenForever`).
//
// WHY a test that wants both stages must script them on SEPARATE doubles: React
// batches synchronous updates, so announcing ['loading', 'generating'] in one
// call paints only the second. The intermediate stage is observable only from a
// double scripted to stop at it.
export function scriptedSocket({
	announces = [],
	answers,
}: ScriptedAsk = {}): GeneratorSocket {
	return {
		generate(_program, _request, { onPhase } = {}) {
			for (const phase of announces) {
				onPhase?.(phase);
			}
			if (answers === undefined) {
				return new Promise<GeneratorResult>(function holdOpen(): void {
					// Deliberately no settle path — see the comment above.
				});
			}
			return Promise.resolve(answers);
		},
	};
}

// One ask whose work SPANS TICKS, which is what makes retirement observable.
// The first phase is announced inside the call — as the shipped socket
// announces `loading` before its first wait — and every later phase on a
// microtask, as the shipped socket announces `generating` after one. A test can
// therefore stop the ask in between, and assert that what the socket says
// afterwards changes nothing.
//
// A microtask rather than a timer: nothing in this suite uses fake timers, and
// a real clock here would be its first source of wall-clock flakiness.
//
// The abort guard mirrors the shipped socket's, so this double models a
// CONFORMANT socket rather than one that keeps talking after being aborted. No
// test in the view's suite can reach it — cancel deliberately does not abort,
// and an unmounted view has nothing left to observe — so it is conformance
// modelling, not covered behavior.
export function abortableSocket({
	announces = [],
}: DeferredAsk = {}): GeneratorSocket {
	return {
		generate(_program, _request, { onPhase, signal } = {}) {
			const [firstPhase, ...laterPhases] = announces;
			if (firstPhase !== undefined) {
				onPhase?.(firstPhase);
			}
			for (const phase of laterPhases) {
				void Promise.resolve().then(function announceOnALaterTick(): void {
					if (signal?.aborted) return;
					onPhase?.(phase);
				});
			}
			return new Promise<GeneratorResult>(function holdOpen(): void {
				// Deliberately no settle path — see `scriptedSocket` above.
			});
		},
	};
}

// `answers` is OMITTED, never passed as undefined: `exactOptionalPropertyTypes`
// is on, and omission is what the never-settling arm reads.
type ScriptedAsk = {
	readonly announces?: readonly GeneratorPhase[];
	readonly answers?: GeneratorResult;
};

type DeferredAsk = {
	readonly announces?: readonly GeneratorPhase[];
};
