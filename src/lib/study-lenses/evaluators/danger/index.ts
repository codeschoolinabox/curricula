/**
 * @file danger's `Evaluator` object — the kind's identity for the real-window
 * evaluator. `main` translates the evaluation spec into backend options, starts the
 * real-window run **lazily** (on the async iterator's first pull), and wraps the
 * backend's `{ result, cancel }` into the kind's stream: a hand-rolled async
 * iterator that yields no events (danger emits none) but carries the companion
 * `settled` promise and cancels the backend on `.return()`. With zero events there
 * is a single, run-length `.next()`; an async generator's `.return()` would queue
 * behind that in-flight pull, so this iterator calls the backend's `cancel()` out of
 * band instead. When no `document` exists (server-side), `main` refuses as data,
 * never throwing. See DOCS.md § Execution phases / Laziness.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { EvaluationSpec, Evaluator, EvaluatorRefusal } from '../types.js';

import run from './backend/run.js';
import type { DangerRunHandle } from './backend/types.js';
import toSettlement from './to-settlement.js';
import type { DangerSettlement, DangerStream } from './types.js';

const danger = {
	name: 'danger',
	applicability,
	main,
} satisfies Evaluator;

export default danger;

/**
 * Permissive and pure over the spec: danger runs whatever it is handed.
 * Applicability reads only the spec, never the ambient environment — whether a
 * `document` exists is answered at `main` (as a refusal), so the options list a
 * consuming lens builds is not environment-dependent.
 */
function applicability(_spec: EvaluationSpec): boolean {
	return true;
}

/**
 * Serve the spec. Server-side (no `document`) → a structured refusal, never a throw.
 * Otherwise a **lazy** stream: nothing runs until the consumer first pulls; the
 * first `.next()` starts the backend run, awaits it, resolves `settled`, and
 * completes the (event-free) iterator. Breaking out of the pull (`.return()`)
 * cancels the backend out of band, which settles it as canceled.
 */
function main(spec: EvaluationSpec): DangerStream | EvaluatorRefusal {
	if (typeof document === 'undefined') {
		return freezeInPlace<EvaluatorRefusal>({
			refused: true,
			reason:
				'danger needs a document (a real, same-origin window); none exists (server-side)',
		});
	}

	const options = {
		type: spec.execution === 'module' ? ('module' as const) : ('script' as const),
		...(spec.iterations === undefined ? {} : { iterations: spec.iterations }),
	};

	let resolveSettled!: (settlement: DangerSettlement) => void;
	const settled = new Promise<DangerSettlement>(
		(resolve) => (resolveSettled = resolve),
	);

	// Lazy: the backend run does not start in `main`; the first pull starts it.
	let handle: DangerRunHandle | undefined;
	let torndown = false;
	function start(): void {
		if (handle !== undefined) {
			return;
		}
		handle = run(spec.facts.source.value, options);
		void handle.result.then((result) => resolveSettled(toSettlement(result)));
	}

	const done = { done: true as const, value: undefined };
	const iterator: AsyncIterator<never, undefined> = {
		next() {
			// A pull after teardown (a misbehaving consumer — `.next()` after
			// `.return()`) must not start a fresh run; the stream has already settled.
			if (!torndown) {
				start();
			}
			return settled.then(() => done);
		},
		return() {
			// Cancel: tear the backend down out of band. If it was never pulled, the run
			// never started — settle canceled directly. A later pull is inert (above).
			torndown = true;
			if (handle === undefined) {
				resolveSettled(freezeInPlace<DangerSettlement>({ ended: 'canceled' }));
			} else {
				handle.cancel();
			}
			return settled.then(() => done);
		},
	};

	return {
		settled,
		[Symbol.asyncIterator]() {
			return iterator;
		},
	};
}
