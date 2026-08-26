/**
 * @file run's thread-side io seam: answer a worker's dialog ask from the
 * spec's mocks, validating per verb and classifying every io failure
 * before the machinery can mislabel it as a machinery defect (HR-9; the
 * reference classified a mock's failure as the learner-shaped
 * `'javascript'` — the ledger's named supersede).
 *
 * The worker's dialog trap did no validation and no classification —
 * both live HERE, at run's own seam. A supplied mock answers (value or
 * Promise, awaited); no mock for the verb, a throwing or rejecting
 * mock, an answer failing the per-verb validity table, or a prompt
 * answer the transport channel cannot carry all resolve to the flag —
 * the complete io error record the settlement mapper's precedence
 * step 1 reads. The transport ceiling is the machinery's own, imported
 * from its protocol module and measured in ENCODED bytes, never a
 * second copy of the number; only prompt's string answer can exceed it,
 * and the check runs here, before the wrapper returns, because only
 * here can the flag still be set.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import PROTOCOL from '../../lib/engine/worker/protocol.js';

import type {
	IoMocks,
	IoVerb,
	RunIoFlag,
	RunIoRequest,
	RunIoResolution,
} from './types.js';

/**
 * Answer one dialog ask from the spec's mocks.
 *
 * @param request - The worker trap's decoded ask.
 * @param io - The spec's per-verb dialog mocks; absent slots take run's
 *   io posture — a classified io error, never a native dialog.
 * @returns The resolution: the validated answer, or the io flag. Never
 *   rejects — every io failure is data on the flag.
 */
export default async function resolveIo(
	request: RunIoRequest,
	io: IoMocks = {},
): Promise<RunIoResolution> {
	try {
		if (request.verb === 'prompt') {
			return await resolvePrompt(request, io.prompt);
		}
		if (request.verb === 'alert') {
			return await resolveAlert(request, io.alert);
		}
		return await resolveConfirm(request, io.confirm);
	} catch (error) {
		return flagThrown(request.verb, error);
	}
}

// WHY at module load: synchronous, zero-config, stateless singleton codec —
// the house pattern for codecs, like regex literals.
const ENCODER = new TextEncoder();

/**
 * prompt answers `string | null`, no coercion; a string answer is
 * bounds-checked against the machinery's ceiling before it rides back.
 * An absent `defaultValue` reaches the mock as no argument at all — the
 * Seam 3 absent-never-rendered rule, extended to the invocation.
 */
async function resolvePrompt(
	request: RunIoRequest,
	mock: IoMocks['prompt'],
): Promise<RunIoResolution> {
	if (mock === undefined) {
		return flagMissing('prompt');
	}
	const answer: unknown =
		'defaultValue' in request
			? await mock(request.message, request.defaultValue)
			: await mock(request.message);
	if (typeof answer !== 'string' && answer !== null) {
		return flagInvalid('prompt', answer, 'a string or null');
	}
	if (typeof answer === 'string') {
		const encodedBytes = ENCODER.encode(answer).byteLength;
		if (encodedBytes > PROTOCOL.PAYLOAD_CEILING) {
			return flagOverCeiling(encodedBytes);
		}
	}
	return answeredWith(answer);
}

/**
 * alert's expected answer is the void contract's `undefined` — stated,
 * not policed: the mock is awaited (so a rejection still classifies),
 * and whatever it returned is discarded; `undefined` rides back, the
 * value the platform's own alert hands the program.
 */
async function resolveAlert(
	request: RunIoRequest,
	mock: IoMocks['alert'],
): Promise<RunIoResolution> {
	if (mock === undefined) {
		return flagMissing('alert');
	}
	await mock(request.message);
	return answeredWith();
}

/**
 * confirm answers `boolean` only — the reference wire's silent
 * `undefined` → `false` coercion does not return.
 */
async function resolveConfirm(
	request: RunIoRequest,
	mock: IoMocks['confirm'],
): Promise<RunIoResolution> {
	if (mock === undefined) {
		return flagMissing('confirm');
	}
	const answer: unknown = await mock(request.message);
	if (typeof answer !== 'boolean') {
		return flagInvalid('confirm', answer, 'a boolean');
	}
	return answeredWith(answer);
}

function answeredWith(answer?: string | boolean | null): RunIoResolution {
	return freezeInPlace({ answered: true, answer });
}

function flagWith(
	verb: IoVerb,
	name: string,
	message: string,
): RunIoResolution {
	const flag: RunIoFlag = { kind: 'io', verb, name, message };
	return freezeInPlace({ answered: false, flag });
}

function flagMissing(verb: IoVerb): RunIoResolution {
	return flagWith(
		verb,
		'MissingMockError',
		`the program called ${verb}, but the spec supplies no ${verb} mock`,
	);
}

function flagInvalid(
	verb: IoVerb,
	answer: unknown,
	accepted: string,
): RunIoResolution {
	return flagWith(
		verb,
		'TypeError',
		`the ${verb} mock answered ${describeAnswer(answer)}; a ${verb} answer is ${accepted}`,
	);
}

function flagOverCeiling(encodedBytes: number): RunIoResolution {
	return flagWith(
		'prompt',
		'RangeError',
		`the prompt mock's answer is ${encodedBytes} bytes encoded; the channel's ceiling is ${PROTOCOL.PAYLOAD_CEILING} bytes`,
	);
}

function flagThrown(verb: IoVerb, thrown: unknown): RunIoResolution {
	return thrown instanceof Error
		? flagWith(verb, thrown.name, thrown.message)
		: flagWith(verb, 'Error', String(thrown));
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
