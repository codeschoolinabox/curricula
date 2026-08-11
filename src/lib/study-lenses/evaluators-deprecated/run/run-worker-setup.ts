/**
 * @file run's worker logic: the setup the engine's bootstrap invokes once at
 * sandbox start, and the halt author it registers.
 *
 * Both halves of iteration-guard's pairing rule are run's, and this is the
 * inject half — the assemble side splices the matching calls (DOCS.md
 * § Structural constraints). The guard helpers are the ONLY globals run
 * injects: dialogs are honestly absent, so a `prompt()` call is the
 * program's own reference error, not a mock's.
 *
 * The halt author runs in the throw's own realm, which is the whole reason
 * it lives here: classification reads the guard's marker structurally
 * through iteration-guard's verb — never a name, never a message — and the
 * run total is read at halt time, so every halt carries a real count.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type {
	HaltKind,
	SerializeHalt,
	WorkerApi,
	WorkerSetupResult,
} from '../../lib/engine/types.js';
import createIterationGuard from '../lib/iteration-guard/create-iteration-guard.js';
import readLimitTrip from '../lib/iteration-guard/read-limit-trip.js';
import type { IterationGuard } from '../lib/iteration-guard/types.js';

import type { RunHalt, RunWorkerConfig } from './types.js';

/**
 * Build one run's worker-side environment: the iteration-guard helpers as the
 * only injected globals, plus run's halt author.
 *
 * @param _api - The engine's worker api. Unused by design: run is eventless
 *   and injects no dialogs, so it never emits and never calls.
 * @param workerConfig - The clone-transported {@link RunWorkerConfig},
 *   narrowed at this one read site. Its `iterationLimit` becomes the guard's
 *   cap UNCHANGED — no clamping, no defaulting, no finiteness gate (cap
 *   policy is iteration-guard's documented edge set, and the absence of any
 *   default cap is a ratified ruling). Anything that is not a number is read
 *   as no cap: the guard counts and never throws.
 * @returns The globals to inject and the halt author to register — the author
 *   fires on EVERY worker-side stop, natural end and throw alike.
 */
export default function runWorkerSetup(
	_api: WorkerApi,
	workerConfig: unknown,
): WorkerSetupResult {
	const guard = createIterationGuard(readCap(workerConfig));

	return freezeInPlace({
		globals: guard.globals,
		serializeHalt: buildHaltAuthor(guard),
	});
}

/**
 * The cap as given, or nothing. Reading `unknown` is the narrowing; it is not
 * a policy gate — `0`, negatives, `Infinity`, and `NaN` are all numbers and
 * all ride through to iteration-guard's documented edges.
 */
function readCap(workerConfig: unknown): number | undefined {
	// WHY the cast: workerConfig is clone-transported and contractually unknown
	// at the engine boundary; the shape is run's own, re-checked below rather
	// than trusted.
	const { iterationLimit } = (workerConfig ?? {}) as RunWorkerConfig;
	return typeof iterationLimit === 'number' ? iterationLimit : undefined;
}

/**
 * run's halt author, closed over this run's guard state. The bootstrap
 * invokes it on EVERY worker-side stop, so the run total rides every halt —
 * natural ends included.
 */
function buildHaltAuthor(guard: IterationGuard): SerializeHalt {
	return function serializeRunHalt(kind: HaltKind, rawError: unknown): RunHalt {
		const iterationCount = guard.readIterationCount();

		if (kind === 'natural-end') {
			return {
				natural: true,
				errorName: '',
				message: '',
				trip: null,
				iterationCount,
			};
		}

		// WHY unfrozen: DEV.md § 13's requirement on a value that crosses a
		// postMessage boundary is clone-safe SHAPE, which this payload has;
		// the freeze half of that rule protects in-process consumers, and this
		// payload's only one is the bootstrap, which clones it and drops it.
		// Freezing it in place would additionally reach into `trip`, which
		// iteration-guard hands back BY REFERENCE and run does not own — on a
		// well-formed forgery that record belongs to the learner's program.
		// The deep freeze that does bind is thread-side, on the settlement.
		return {
			natural: false,
			errorName: rawError instanceof Error ? rawError.name : 'Error',
			message: rawError instanceof Error ? rawError.message : String(rawError),
			trip: readLimitTrip(rawError),
			iterationCount,
		};
	};
}
