/**
 * @file run's worker logic: the setup the engine's bootstrap invokes once at
 * sandbox start — the guarded worker base's shared opening plus run's own
 * three dialog traps.
 *
 * The base answers the guard's injectable helpers and the registered halt
 * author in one call (`createGuardedWorkerBase`, human rulings 2026-08-25/26);
 * run passes NO finisher, so the authored record IS the base's halt core —
 * `RunHalt` aliases it, and this file re-implements none of that wiring.
 *
 * The dialog traps are run's own (HR-9): a worker has no dialogs at all —
 * injection creates them — and each trap ASKS the thread through the
 * machinery's call channel, blocking until answered, then hands the answer
 * back to the program. Nothing else is trapped and nothing is emitted: run
 * streams no events and traps no console (`console.log` writes to the
 * worker's native console; captured logs are intercept's business). The trap
 * does NO answer validation and NO io classification — both are the
 * thread-side io wrapper's, at run's own seam.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type {
	CallResponse,
	WorkerApi,
	WorkerSetupResult,
} from '../../lib/engine/types.js';
import createGuardedWorkerBase from '../lib/guarded-worker-base/create-guarded-worker-base.js';

import type { IoVerb, RunIoRequest } from './types.js';

/**
 * Build one run's worker-side environment: the guard helpers and the three
 * dialog traps as the injected globals, plus the base's halt author.
 *
 * @param api - The engine's worker api. run uses only `call` — the
 *   synchronous round-trip a dialog trap blocks on; run never emits.
 * @param workerConfig - The clone-transported {@link RunWorkerConfig}. Its
 *   `iterationLimit` rides to the base UNCHANGED — the base's cap reading
 *   owns the narrowing, and pass-through is the ruled cap policy (pin
 *   run:235): no clamp, no default, no finiteness gate.
 * @returns The globals to inject and the halt author to register — the
 *   author fires on EVERY worker-side stop, natural end and throw alike.
 */
export default function runWorkerSetup(
	api: WorkerApi,
	workerConfig: unknown,
): WorkerSetupResult {
	const base = createGuardedWorkerBase(workerConfig);

	return freezeInPlace({
		globals: {
			...base.guardGlobals,
			alert: buildDialogTrap(api, 'alert'),
			confirm: buildDialogTrap(api, 'confirm'),
			prompt: buildDialogTrap(api, 'prompt'),
		},
		serializeHalt: base.serializeHalt,
	});
}

/**
 * One dialog trap: ask the thread through the machinery's call channel —
 * the synchronous round-trip that suspends the run — and hand the answer
 * back to the program. No record is emitted, and the trap neither
 * validates nor classifies the answer (both are the thread-side io
 * wrapper's): prompt's and confirm's answers ride back as given; alert's
 * is ignored — `undefined` is the value the browser's own alert hands
 * back (modelled, not inferred — the deprecated intercept setup's own
 * recorded ruling, H-3, carried).
 */
function buildDialogTrap(api: WorkerApi, verb: IoVerb) {
	return function dialogTrap(...callArguments: unknown[]): CallResponse {
		const answer = api.call(buildIoRequest(verb, callArguments));
		return verb === 'alert' ? undefined : answer;
	};
}

/**
 * The ask as the platform would render the dialog (the deprecated
 * intercept setup's decode rules, transported): `alert` rides two
 * overloads — no argument is `''`, one argument converts (so an explicit
 * `undefined` renders `'undefined'`); `confirm`/`prompt` declare their
 * message optional-with-default, so an explicit `undefined` counts as
 * omitted, and the same rule makes `prompt`'s undefined default ABSENT.
 */
function buildIoRequest(
	verb: IoVerb,
	callArguments: readonly unknown[],
): RunIoRequest {
	if (verb === 'alert') {
		const message = callArguments.length === 0 ? '' : String(callArguments[0]);
		return { verb, message };
	}
	const [rawMessage, rawDefault] = callArguments;
	const message =
		rawMessage === undefined
			? ''
			: // eslint-disable-next-line @typescript-eslint/no-base-to-string -- default stringification IS the browser dialog's own rendering of an object message
				String(rawMessage);
	if (verb === 'confirm') {
		return { verb, message };
	}
	return rawDefault === undefined
		? { verb, message }
		: {
				verb,
				message,
				// eslint-disable-next-line @typescript-eslint/no-base-to-string -- default stringification IS the browser dialog's own rendering of an object default
				defaultValue: String(rawDefault),
			};
}
