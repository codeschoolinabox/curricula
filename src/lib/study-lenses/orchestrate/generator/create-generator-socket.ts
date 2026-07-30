// cspell:ignore affordances

/**
 * @file `createGeneratorSocket()` — the generator view's DEFAULT socket: a
 * deterministic placeholder that never runs a model.
 *
 * Every value it returns is specified in [`./README.md`](./README.md)
 * § The placeholder socket, because every one of them is learner-visible.
 * That section is the contract; this file implements it.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type {
	GeneratorRefusal,
	GeneratorRefusalCause,
	GeneratorRequest,
	GeneratorResult,
	GeneratorSocket,
} from './types.js';

/**
 * Creates the deterministic placeholder socket the generator view calls when no
 * generative core is seated behind the seam.
 *
 * @param options - The one knob: how long each announced stage is held
 * @returns A frozen {@link GeneratorSocket} that resolves, always
 *
 * @remarks
 * The placeholder never simulates a model and nothing it returns pretends one
 * ran: it marks its own output as machine-free and names ITSELF as the producer
 * in the meta slot, so the meta line beside a candidate never lies.
 *
 * Both stages are announced on BOTH paths, the scripted refusal included — this
 * socket's refusal is scripted rather than a real bring-up failure, so it never
 * takes the refuse-out-of-loading edge a runtime-backed socket can. Each stage
 * is then held for `stageDelay`: the view's honest loading states exist to be
 * seen, and a stage that ended in the tick it began would never paint.
 *
 * `loading` is announced SYNCHRONOUSLY, inside the call, before the first wait —
 * so a caller wanting to abort must hold its signal before it asks, and a caller
 * reading its own state straight after the call already sees the first stage.
 */
export default function createGeneratorSocket({
	stageDelay = DEFAULT_STAGE_DELAY,
}: GeneratorSocketOptions = {}): GeneratorSocket {
	return freezeInPlace({
		async generate(
			program: string,
			request: GeneratorRequest,
			{ onPhase, signal }: AskOptions = {},
		): Promise<GeneratorResult> {
			// 1. Bring-up — announced, then held open long enough to read.
			if (signal?.aborted) {
				return holdOpenForever();
			}
			onPhase?.('loading');
			await holdStage(stageDelay);

			// 2. Drafting — the same, so the second stage paints too.
			if (signal?.aborted) {
				return holdOpenForever();
			}
			onPhase?.('generating');
			await holdStage(stageDelay);

			// 3. The answer — a scripted refusal, or the remix.
			if (signal?.aborted) {
				return holdOpenForever();
			}
			return freezeInPlace(answerFor(program, request.prompt));
		},
	});
}

/**
 * Milliseconds each announced stage is held — long enough to read, short enough
 * not to punish.
 */
const DEFAULT_STAGE_DELAY = 400;

/** The producer this socket reports as its own resolved id. */
const PLACEHOLDER_PRODUCER = 'placeholder';

/** The marker's first line — always present, whatever the ask carried. */
const MARKER_FIRST_LINE =
	"// No model ran — this came from the study environment's placeholder generator.";

/** The one reserved prompt opening: case-sensitive, at index 0, no leading space. */
const REFUSAL_PREFIX = 'refuse:';

/** The causes a learner can name after the prefix to see that refusal rendered. */
const REFUSAL_CAUSES: readonly GeneratorRefusalCause[] = [
	'attempt-bound-exhausted',
	'no-model-available',
	'unknown-model',
];

// One ask, one answer. `request.model` is deliberately absent: this socket holds
// no catalog, so it could never honestly report a name as unknown, and it
// ignores the field entirely.
function answerFor(seed: string, prompt: string): GeneratorResult {
	const refusal = readRefusal(prompt);
	if (refusal !== null) {
		return { ok: false, refusal };
	}
	return {
		ok: true,
		program: composeCandidate(seed, prompt),
		meta: { model: PLACEHOLDER_PRODUCER, attempts: 1 },
	};
}

// The refusal demonstration, so refusal copy is reachable end-to-end. Two shapes
// are produced because a refusal with a next step and one without render
// differently; the two literals are built separately rather than spreading a
// maybe-undefined field, which `exactOptionalPropertyTypes` rejects.
function readRefusal(prompt: string): GeneratorRefusal | null {
	if (!prompt.startsWith(REFUSAL_PREFIX)) {
		return null;
	}
	const named = prompt.slice(REFUSAL_PREFIX.length).trim();
	if (isRefusalCause(named)) {
		return { cause: named };
	}
	return { cause: 'no-model-available', nextStep: 'use-native-app' };
}

function isRefusalCause(candidate: string): candidate is GeneratorRefusalCause {
	return (REFUSAL_CAUSES as readonly string[]).includes(candidate);
}

// The remix: the seed, one blank line, then the marker comment. An empty seed
// answers with the marker alone — there is always a program, never an empty one.
// The seed is joined verbatim: this socket proposes, it never edits.
function composeCandidate(seed: string, prompt: string): string {
	const marker = composeMarker(prompt);
	return seed === '' ? marker : `${seed}\n\n${marker}`;
}

// WHY `//` line comments and a normalized prompt, both load-bearing: the
// candidate lands in the learner's buffer on Accept and is parsed there. A block
// comment would break on a prompt containing `*/`, and any whitespace run left
// intact could end the line comment early — `\s` covers U+2028/U+2029, which
// terminate a line comment just as a newline does. Nothing else is altered.
// WHY the emptiness test differs from `readRefusal`'s: there, surrounding
// whitespace is explicitly ignored when reading a cause name; here the prompt is
// learner text that is normalized but never trimmed, so a whitespace-only prompt
// is non-empty and keeps its line. The asymmetry is the contract's, not an
// oversight — README.md § The placeholder socket fixes both halves.
function composeMarker(prompt: string): string {
	if (prompt === '') {
		return MARKER_FIRST_LINE;
	}
	return `${MARKER_FIRST_LINE}\n// Your prompt: ${prompt.replaceAll(/\s+/gu, ' ')}`;
}

// Holds one stage for the configured delay. A bare timer promise: the stage
// sequence is driven by awaiting it, never by a mutable clock the caller holds.
function holdStage(ms: number): Promise<void> {
	return new Promise(function schedule(resolve) {
		setTimeout(resolve, ms);
	});
}

// An aborted ask has no honest answer left to give: a success needs a program
// nobody will read, and a refusal needs a cause this socket was never given.
// The contract permits a socket that simply never settles after an abort, and
// the view has already retired the ask — so the promise is left pending and the
// machine stops working for nothing.
function holdOpenForever(): Promise<GeneratorResult> {
	return new Promise(function holdOpen(): void {
		// Deliberately no settle path — see the comment above.
	});
}

// What the factory accepts: the stage delay, in milliseconds. Local rather than
// in `./types.js` deliberately — that file owns the socket, job, and view
// CONTRACTS, and this is one construction knob no consumer of the seam ever
// names. Written out rather than derived, because it has no contract to derive
// from; `AskOptions` below does, so it derives.
type GeneratorSocketOptions = {
	readonly stageDelay?: number;
};

// Derived from the seam rather than restated, so the consumer-side affordances
// cannot drift from the contract they implement.
type AskOptions = NonNullable<Parameters<GeneratorSocket['generate']>[2]>;
