/**
 * @file intercept's worker logic: the setup the engine's bootstrap invokes
 * once at sandbox start, and the halt author it registers (DOCS.md phases
 * 4, 5 and 9).
 *
 * The injected globals ARE the observation: a worker has no dialogs at all
 * — injection creates them — and its own console would escape observation,
 * so injection shadows it (the engine's own scoping of the two cases). The
 * surface is: the iteration-guard helpers (the inject half of the pairing
 * rule — the assemble side splices the matching calls), the `__$lc` loc
 * wrap helper (types.ts Seam 5), the trapped `console` covering exactly the
 * methods the worker's own console has, and the three dialog traps.
 *
 * A console call is EMIT-ONLY: one complete record, no round-trip, and the
 * program holds at the engine's emit-pause until the consumer takes it. A
 * dialog ASKS FIRST — `api.call` blocks the worker for the whole round-trip,
 * which is what suspends the run and guarantees at most one boundary moment
 * in flight — and only the answer's arrival emits the record carrying what
 * the program received, then returns that value to the program: alert's
 * `undefined` (modelled, not inferred — ruling H-3), confirm's boolean,
 * prompt's string-or-null.
 *
 * `step` is the event ordinal, 1-based, assigned worker-side in emission
 * order — a dialog's two events differ by one, and their ADJACENCY is the
 * pairing. The current-loc stack is the module's README-declared
 * mutable-state exception (§ Ubiquitous language, current loc); the step
 * counter rides the same DEV.md § 8 low-level-state license
 * iteration-guard's own counters use — closed over, per-run disposable,
 * written only by the event authors. Spans ride the stack ENCODED and are
 * decoded only where a record, an ask, or a halt needs one (Seam 5); a
 * propagating object-valued throw is stamped with the ENCODED innermost
 * span under this module's own first-write key — a primitive throw cannot
 * carry a stamp and rides unstamped, `loc: null`.
 *
 * The halt author classifies the guard's throw structurally through
 * `readLimitTrip` — never a name, never a message — reads the run total on
 * EVERY halt, and renders non-Error throws honestly. The halt payload is
 * NOT frozen: clone-safe SHAPE is what DEV.md § 13 requires across
 * `postMessage`, its only consumer is the bootstrap (which clones and
 * drops it), and freezing would reach into the trip record iteration-guard
 * hands back by reference (run's inherited `ar-4` ruling — the clone-safe
 * leg, the only leg that transfers).
 */

import deepFreezeExcept from '@utils/deep-freeze-except.js';

import type {
	CallResponse,
	HaltKind,
	SerializeHalt,
	WorkerApi,
	WorkerSetupResult,
} from '../../lib/engine/types.js';
import createIterationGuard from '../lib/iteration-guard/create-iteration-guard.js';
import readLimitTrip from '../lib/iteration-guard/read-limit-trip.js';
import type { IterationGuard } from '../lib/iteration-guard/types.js';

import type {
	InterceptHalt,
	InterceptInteractionRequest,
	InterceptLoc,
	InterceptWorkerConfig,
} from './types.js';

/**
 * Build one run's worker-side environment: guard helpers, the loc-wrap
 * helper, the trapped console, the three dialog traps, and the halt author.
 *
 * @param api - The engine's worker api: `emit` carries records, `call`
 *   carries asks — the synchronous round-trip that suspends the run.
 * @param workerConfig - The clone-transported {@link InterceptWorkerConfig},
 *   narrowed at this one read site. `iterationLimit` becomes the guard's
 *   cap UNCHANGED — no clamping, no defaulting, no finiteness gate; a
 *   non-number reads as no cap (the guard counts and never throws).
 * @returns The globals to inject and the halt author to register.
 */
export default function interceptWorkerSetup(
	api: WorkerApi,
	workerConfig: unknown,
): WorkerSetupResult {
	const guard = createIterationGuard(readCap(workerConfig));
	const run = createRunState();

	// WHY the exemption: the console trap must stay a plain mutable object —
	// a learner reassigning console.log disables its own observation and the
	// program continues (README § Edge cases); a deep freeze would turn that
	// reassignment into a TypeError under the engine's strict default, which
	// is not the platform's behavior.
	const consoleTrap = buildConsoleTrap(api, run);
	return deepFreezeExcept(
		{
			globals: {
				...guard.globals,
				__$lc: buildLocWrap(run),
				console: consoleTrap,
				alert: buildDialogTrap(api, run, 'alert'),
				confirm: buildDialogTrap(api, run, 'confirm'),
				prompt: buildDialogTrap(api, run, 'prompt'),
			},
			serializeHalt: buildHaltAuthor(guard),
		},
		new Set([consoleTrap]),
	);
}

/**
 * The stamp a propagating throw carries: the ENCODED span of the innermost
 * wrapped call it escaped. In-file at both the stamp site and the halt
 * author's read site — never retyped (the marker-key precedent).
 */
const LOC_STAMP_KEY = '__$callLoc';

type RunState = {
	/** The wrap's stack of ENCODED spans; top = the executing call site. */
	readonly currentLocs: string[];
	/** The next EVENT ordinal — one shared sequence across every kind. */
	readonly nextStep: () => number;
};

type DialogKind = 'alert' | 'confirm' | 'prompt';

/**
 * One run's mutable worker state — the declared per-run exception (README
 * § Ubiquitous language, current loc): closure-confined, disposable, written
 * only by the wrap's enter/exit and the event authors.
 */
function createRunState(): RunState {
	const currentLocs: string[] = [];
	let step = 0;
	return {
		currentLocs,
		nextStep() {
			step += 1;
			return step;
		},
	};
}

/** The cap as given, or nothing — reading `unknown` is the narrowing, not a
 * policy gate (run's precedent; the C1 no-default ruling). */
function readCap(workerConfig: unknown): number | undefined {
	// WHY the cast: workerConfig is clone-transported and contractually
	// unknown at the engine boundary; the shape is intercept's own,
	// re-checked here rather than trusted.
	const { iterationLimit } = (workerConfig ?? {}) as InterceptWorkerConfig;
	return typeof iterationLimit === 'number' ? iterationLimit : undefined;
}

/**
 * Seam 5's helper: push the ENCODED span, invoke, stamp a propagating
 * object-valued throw with that span (first write wins — the innermost call
 * it escaped), restore the stack on the way out. No decode rides this
 * per-call path.
 */
function buildLocWrap(run: RunState) {
	return function __$lc<T>(encodedLoc: string, call: () => T): T {
		// eslint-disable-next-line functional/immutable-data -- the per-run current-loc stack, the README-declared exception; written only here
		run.currentLocs.push(encodedLoc);
		try {
			return call();
		} catch (error) {
			stampThrow(error, encodedLoc);
			throw error;
		} finally {
			// eslint-disable-next-line functional/immutable-data -- the exit half of the same declared exception: restore on the way out
			run.currentLocs.pop();
		}
	};
}

/** First-write, non-enumerable, own-key stamp; a primitive throw — or an
 * exotic object refusing the define — rides unstamped. */
function stampThrow(thrown: unknown, encodedLoc: string): void {
	if (typeof thrown !== 'object' || thrown === null) {
		return;
	}
	try {
		if (Object.hasOwn(thrown, LOC_STAMP_KEY)) {
			return;
		}
		// eslint-disable-next-line functional/immutable-data -- the stamp IS the attribution's delivery channel (the guard marker's own precedent)
		Object.defineProperty(thrown, LOC_STAMP_KEY, {
			value: encodedLoc,
			writable: false,
			enumerable: false,
			configurable: false,
		});
	} catch {
		// An exotic thrown object that refuses the stamp rides unstamped.
	}
}

/**
 * The trapped console: one emit-only trap per method the worker's own
 * console has, so an unlisted name fails exactly as it would on the
 * platform. Deliberately NOT frozen — reassigning a trap is the learner
 * disabling their own observation, not an error.
 */
function buildConsoleTrap(
	api: WorkerApi,
	run: RunState,
): Record<string, unknown> {
	const trap: Record<string, (...callArguments: unknown[]) => void> = {};
	for (const method of Object.keys(console)) {
		if (!isFunctionValued(console, method)) {
			continue;
		}
		// eslint-disable-next-line functional/immutable-data -- building the trap surface in place, one entry per platform method
		trap[method] = function trapped(...callArguments: unknown[]): void {
			api.emit({
				kind: 'console',
				method,
				args: cloneSafeArguments(callArguments),
				step: run.nextStep(),
				loc: currentLoc(run),
			});
		};
	}
	return trap;
}

function isFunctionValued(owner: object, key: string): boolean {
	return typeof (owner as Record<string, unknown>)[key] === 'function';
}

/**
 * One dialog trap: decode the ask (B-5's platform rules), block on the
 * round-trip — the suspension itself — then emit the record carrying what
 * the program received, and hand that value back: ask first, record after,
 * never collapsed.
 */
function buildDialogTrap(api: WorkerApi, run: RunState, kind: DialogKind) {
	return function dialogTrap(...callArguments: unknown[]): unknown {
		const loc = currentLoc(run);
		const answer = api.call({
			step: run.nextStep(),
			loc,
			request: decodeRequest(kind, callArguments),
		});
		const returnValue = modelReturnValue(kind, answer);
		api.emit({
			kind,
			args: cloneSafeArguments(callArguments),
			step: run.nextStep(),
			loc,
			returnValue,
		});
		return returnValue;
	};
}

/**
 * B-5: the request as the platform would render it. `alert` rides two
 * overloads — no argument is `''`, one argument converts (so an explicit
 * `undefined` renders `'undefined'`); `confirm`/`prompt` declare their
 * message optional-with-default, so an explicit `undefined` counts as
 * omitted, and the same rule makes `prompt`'s undefined default ABSENT.
 */
function decodeRequest(
	kind: DialogKind,
	callArguments: readonly unknown[],
): InterceptInteractionRequest {
	if (kind === 'alert') {
		const message = callArguments.length === 0 ? '' : String(callArguments[0]);
		return { kind, message };
	}
	const [rawMessage, rawDefault] = callArguments;
	const message =
		rawMessage === undefined
			? ''
			: // eslint-disable-next-line @typescript-eslint/no-base-to-string -- default stringification IS the browser dialog's own rendering of an object message
				String(rawMessage);
	if (kind === 'confirm') {
		return { kind, message };
	}
	return rawDefault === undefined
		? { kind, message }
		: {
				kind,
				message,
				// eslint-disable-next-line @typescript-eslint/no-base-to-string -- default stringification IS the browser dialog's own rendering of an object default
				defaultValue: String(rawDefault),
			};
}

/**
 * What the program receives back. The answer was validated per kind at the
 * thread-side boundary (D9), so this models rather than re-validates:
 * alert's answer is ignored — `undefined` is the value the browser's own
 * alert hands back (H-3) — confirm's boolean and prompt's string-or-null
 * ride through.
 */
function modelReturnValue(
	kind: DialogKind,
	answer: CallResponse,
): CallResponse {
	// Declared-uninitialized IS alert's modelled undefined — its answer is
	// ignored, and the browser's own alert hands back nothing (H-3).
	let returnValue: CallResponse;
	if (kind !== 'alert') {
		returnValue = answer;
	}
	return returnValue;
}

/**
 * The RAW fact, made able to cross the boundary: an argument that survives
 * a structured clone rides as itself, and one that cannot — a function, a
 * symbol, anything holding one — rides as its string form, so a boundary
 * moment never crashes a run (README § Ubiquitous language, clone-safe
 * arguments).
 */
function cloneSafeArguments(
	callArguments: readonly unknown[],
): readonly unknown[] {
	return callArguments.map((argument) => cloneSafeArgument(argument));
}

function cloneSafeArgument(argument: unknown): unknown {
	try {
		structuredClone(argument);
		return argument;
	} catch {
		return String(argument);
	}
}

/** The top of the wrap's stack, decoded only because this record needs it
 * (Seam 5); `null` outside any wrap. */
function currentLoc(run: RunState): InterceptLoc | null {
	const top = run.currentLocs.at(-1);
	return top === undefined ? null : decodeSpan(top);
}

/** `'L:C:L:C'` → a span, or null unless four finite numbers (B-1's decode
 * discipline — never a guess). */
function decodeSpan(encoded: string): InterceptLoc | null {
	const parts = encoded.split(':').map(Number);
	if (parts.length !== 4 || !parts.every((part) => Number.isFinite(part))) {
		return null;
	}
	const [startLine, startColumn, endLine, endColumn] = parts as [
		number,
		number,
		number,
		number,
	];
	return {
		start: { line: startLine, column: startColumn },
		end: { line: endLine, column: endColumn },
	};
}

/**
 * intercept's halt author, closed over this run's guard state. Fires on
 * EVERY worker-side stop; classification is structural through the guard's
 * verb, the loc decodes from the throw's own stamp, and the run total is
 * real on every halt.
 */
function buildHaltAuthor(guard: IterationGuard): SerializeHalt {
	return function serializeInterceptHalt(
		kind: HaltKind,
		rawError: unknown,
	): InterceptHalt {
		const iterationCount = guard.readIterationCount();

		if (kind === 'natural-end') {
			return {
				natural: true,
				errorName: '',
				message: '',
				trip: null,
				loc: null,
				iterationCount,
			};
		}

		// WHY unfrozen: DEV.md § 13's requirement on a value crossing a
		// postMessage boundary is clone-safe SHAPE, which this payload has;
		// its only consumer is the bootstrap, which clones it and drops it,
		// and freezing in place would reach into `trip`, which
		// iteration-guard hands back BY REFERENCE and intercept does not own
		// (run's inherited ruling — the clone-safe leg, the only leg that
		// transfers; the stamped `loc` here IS intercept's own allocation).
		return {
			natural: false,
			errorName: rawError instanceof Error ? rawError.name : 'Error',
			message: rawError instanceof Error ? rawError.message : String(rawError),
			trip: readLimitTrip(rawError),
			loc: readStampedLoc(rawError),
			iterationCount,
		};
	};
}

/** The stamp's one read site: guarded like the guard's own classifier — a
 * trapping proxy is `null`, never a worker crash. */
function readStampedLoc(thrown: unknown): InterceptLoc | null {
	try {
		if (typeof thrown !== 'object' || thrown === null) {
			return null;
		}
		if (!Object.hasOwn(thrown, LOC_STAMP_KEY)) {
			return null;
		}
		const encoded = (thrown as Record<string, unknown>)[LOC_STAMP_KEY];
		return typeof encoded === 'string' ? decodeSpan(encoded) : null;
	} catch {
		return null;
	}
}
