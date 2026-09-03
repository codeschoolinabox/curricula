/**
 * @file The thread-side ask service (DOCS.md phase 4's io half): answer a
 * worker's dialog ask from the spec's mocks — a supplied mock answers
 * BEFORE a pending interaction is ever minted (HR-9, mock-before-mint) —
 * validating per verb and classifying every io failure at intercept's own
 * seam, so the machinery never mislabels one as a machinery defect.
 *
 * The per-verb validity table is run's shared discipline
 * (`../run/resolve-io.ts`, README § io): `prompt` accepts `string | null`
 * — `undefined` does not coerce — with the machinery's transport ceiling
 * checked in ENCODED bytes before the answer rides back; `confirm`
 * accepts `boolean` only; `alert`'s expected answer is the void
 * contract's `undefined`, stated and not policed — the mock is awaited
 * (a rejection still classifies) and its return is discarded. Every
 * mock-path failure — a throwing or rejecting mock, an invalid answer,
 * an over-ceiling `prompt` answer — records the io flag through the
 * seam and then THROWS, ending the run through the machinery's call
 * channel (the call-error route the settlement mapper's precedence
 * step 1 outranks with the recorded flag). intercept's flag names the
 * failing surface as `source` where run's names a `verb` (types.ts,
 * `InterceptIoFlag`).
 *
 * No mock for the asked verb takes intercept's posture, keyed on the
 * engaged consumption mode the source learned at `start(mode)`:
 *
 * - `'iterate'` — mint the pending interaction (the named carve-out —
 *   never a native dialog) through the interaction channel and suspend
 *   the round-trip until `respond` delivers; the channel owns the three
 *   guarantees and the per-verb boundary at the responder. An
 *   over-ceiling responder `prompt` answer is the same io failure as the
 *   mock path's, checked before the channel's value ever rides — the
 *   suspended round-trip then rejects, ending the run.
 * - `'batch'` — the structural drain-cancel (HR-7): nobody is stepping,
 *   so nobody can ever respond — "unanswered" means NO MOCK for that
 *   verb, never a timing accident — and the run cancels at the ask with
 *   the events delivered so far. The discarded round-trip resolves
 *   `undefined`; the machinery's stopped call dispatch drops it.
 *
 * The seam record is the handle's closure surface (built per ask inside
 * `create-intercept-handle.ts`): deliver-into-the-stream, the teardown
 * probe, release registration for the out-of-band teardown, the flag
 * recorder, and the cancel door. It is deliberately unexported plumbing —
 * the committed contract's seam types (`types.ts` Seam 4/5) carry the
 * shapes that cross module boundaries.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { CallResponse } from '../../lib/engine/types.js';
import PROTOCOL from '../../lib/engine/worker/protocol.js';
import type { ExecutionMode } from '../lib/execution-handle/types.js';

import createInteractionChannel from './create-interaction-channel.js';
import type {
	InterceptAskMessage,
	InterceptDialogAnswer,
	InterceptInteractionRequest,
	InterceptIoFlag,
	InterceptPendingInteraction,
	IoMocks,
} from './types.js';

/**
 * What the ask service reaches through, per ask: the spec's mocks, the
 * engaged consumption mode, and the handle's stream/teardown surface.
 */
type AskSeam = {
	readonly io?: IoMocks;
	readonly mode: ExecutionMode;
	readonly isTornDown: () => boolean;
	readonly deliverInteraction: (
		interaction: InterceptPendingInteraction,
	) => void;
	readonly registerRelease: (release: () => void) => void;
	readonly clearRelease: () => void;
	readonly flagIo: (flag: InterceptIoFlag) => void;
	readonly cancelRun: () => void;
};

/**
 * Serve one dialog ask: mock first, posture second.
 *
 * @param ask - The worker trap's clone-crossed ask (types.ts Seam 4).
 * @param seam - The per-ask seam the handle built.
 * @returns The answer the worker resumes with. Rejects exactly on an io
 *   failure — the call-error route; the recorded flag is the settlement's
 *   error, never the thrown wrapper.
 */
export default async function serveAsk(
	ask: InterceptAskMessage,
	seam: AskSeam,
): Promise<CallResponse> {
	const resolution = await resolveMock(ask.request, seam.io);
	if (resolution !== null) {
		if (resolution.answered) {
			return resolution.answer;
		}
		seam.flagIo(resolution.flag);
		throw new Error(resolution.flag.message);
	}

	if (seam.mode === 'batch') {
		seam.cancelRun();
		// CallResponse's own no-answer value; the machinery's stopped call
		// dispatch discards it (HR-7).
		return undefined;
	}

	return suspendOnInteraction(ask, seam);
}

// WHY at module load: synchronous, zero-config, stateless singleton codec —
// the house pattern for codecs (run's resolve-io precedent).
const ENCODER = new TextEncoder();

/**
 * The mock resolution, or `null` when no mock exists for the asked verb
 * — the one signal that hands the ask to the mode-keyed posture. A
 * throwing or rejecting mock classifies here, exactly like an invalid
 * answer (run's discipline).
 */
async function resolveMock(
	request: InterceptInteractionRequest,
	io: IoMocks = {},
): Promise<MockResolution | null> {
	try {
		if (request.kind === 'prompt') {
			return io.prompt === undefined
				? null
				: await resolvePromptMock(request, io.prompt);
		}
		if (request.kind === 'alert') {
			return io.alert === undefined
				? null
				: await resolveAlertMock(request, io.alert);
		}
		return io.confirm === undefined
			? null
			: await resolveConfirmMock(request, io.confirm);
	} catch (error) {
		return flagThrown(request.kind, error);
	}
}

type MockResolution =
	| { readonly answered: true; readonly answer: CallResponse }
	| { readonly answered: false; readonly flag: InterceptIoFlag };

/**
 * prompt answers `string | null`, no coercion; a string answer is
 * bounds-checked against the machinery's ceiling before it rides back.
 * An absent `defaultValue` reaches the mock as no argument at all — the
 * Seam 3 absent-never-rendered rule, extended to the invocation (run's
 * rule, mirrored).
 */
async function resolvePromptMock(
	request: Extract<InterceptInteractionRequest, { kind: 'prompt' }>,
	mock: NonNullable<IoMocks['prompt']>,
): Promise<MockResolution> {
	const answer: unknown =
		'defaultValue' in request
			? await mock(request.message, request.defaultValue)
			: await mock(request.message);
	if (typeof answer !== 'string' && answer !== null) {
		return flagInvalid('prompt', answer, 'a string or null');
	}
	const objection = answer === null ? null : ceilingObjection(answer);
	if (objection !== null) {
		return freezeInPlace({ answered: false, flag: objection });
	}
	return answeredWith(answer);
}

/**
 * alert's expected answer is the void contract's `undefined` — stated,
 * not policed: the mock is awaited (so a rejection still classifies),
 * and whatever it returned is discarded; `undefined` rides back, the
 * value the platform's own alert hands the program.
 */
async function resolveAlertMock(
	request: Extract<InterceptInteractionRequest, { kind: 'alert' }>,
	mock: NonNullable<IoMocks['alert']>,
): Promise<MockResolution> {
	await mock(request.message);
	return answeredWith();
}

/** confirm answers `boolean` only — nothing coerces. */
async function resolveConfirmMock(
	request: Extract<InterceptInteractionRequest, { kind: 'confirm' }>,
	mock: NonNullable<IoMocks['confirm']>,
): Promise<MockResolution> {
	const answer: unknown = await mock(request.message);
	if (typeof answer !== 'boolean') {
		return flagInvalid('confirm', answer, 'a boolean');
	}
	return answeredWith(answer);
}

/**
 * No mock, stepping consumer: mint the pending interaction and suspend
 * the round-trip on its answer channel. The channel owns the responder's
 * per-verb boundary and the three guarantees; what this wrapper adds is
 * the release registration (the out-of-band teardown resolves the
 * discarded `undefined`) and the transport-ceiling check on the
 * validated answer — before the value ever rides the channel, so an
 * over-ceiling responder answer is the io failure, never a machinery
 * defect.
 */
function suspendOnInteraction(
	ask: InterceptAskMessage,
	seam: AskSeam,
): Promise<CallResponse> {
	return new Promise<CallResponse>(function suspend(resolve, reject) {
		seam.registerRelease(function releaseDiscarded() {
			// eslint-disable-next-line unicorn/no-useless-undefined -- CallResponse's own no-answer value; the engine discards it after a stop
			resolve(undefined);
		});
		seam.deliverInteraction(
			createInteractionChannel({
				ask,
				deliver(answer: InterceptDialogAnswer) {
					seam.clearRelease();
					const objection =
						typeof answer === 'string' ? ceilingObjection(answer) : null;
					if (objection !== null) {
						seam.flagIo(objection);
						reject(new Error(objection.message));
						return;
					}
					resolve(answer);
				},
				isTornDown: seam.isTornDown,
			}),
		);
	});
}

/**
 * The machinery's transport ceiling, measured in ENCODED bytes — the
 * number is imported, never re-declared. Only prompt's string answer can
 * exceed it (alert delivers the modelled `undefined`, confirm a
 * boolean), so the flag's `source` is honestly `'prompt'`.
 */
function ceilingObjection(answer: string): InterceptIoFlag | null {
	const encodedBytes = ENCODER.encode(answer).byteLength;
	if (encodedBytes <= PROTOCOL.PAYLOAD_CEILING) {
		return null;
	}
	return freezeInPlace<InterceptIoFlag>({
		kind: 'io',
		source: 'prompt',
		name: 'RangeError',
		message: `the prompt answer is ${encodedBytes} bytes encoded; the channel's ceiling is ${PROTOCOL.PAYLOAD_CEILING} bytes`,
	});
}

function answeredWith(answer?: string | boolean | null): MockResolution {
	return freezeInPlace({ answered: true, answer });
}

function flagWith(
	source: string,
	name: string,
	message: string,
): MockResolution {
	return freezeInPlace({
		answered: false,
		flag: freezeInPlace<InterceptIoFlag>({ kind: 'io', source, name, message }),
	});
}

function flagInvalid(
	source: string,
	answer: unknown,
	accepted: string,
): MockResolution {
	return flagWith(
		source,
		'TypeError',
		`the ${source} mock answered ${describeAnswer(answer)}; a ${source} answer is ${accepted}`,
	);
}

function flagThrown(source: string, thrown: unknown): MockResolution {
	return thrown instanceof Error
		? flagWith(source, thrown.name, thrown.message)
		: flagWith(source, 'Error', String(thrown));
}

function describeAnswer(answer: unknown): string {
	if (answer === undefined) {
		return 'undefined';
	}
	if (answer === null) {
		return 'null';
	}
	return `a value of type ${typeof answer}`;
}
