/**
 * @file I6's ask-service cluster: `serveAsk` driven directly over a fake
 * seam — the io half of DOCS.md phase 4 on its own terms, the engine and
 * the stream nowhere in sight (pin intercept:250 binds the fixtures: the
 * engine's fake transport rejects an asynchronous round-trip, so the io
 * rows route around the double entirely and the handle suite's scripted
 * engine carries the end-to-end halves).
 *
 * Sources: the mock-answering and validation rows are run's
 * `resolve-io.test.ts` discipline re-asserted at intercept's seam under
 * intercept's flag shape (`source`, not `verb` — types.ts Seam 5); the
 * pending-interaction rows are fresh (README § io's three guarantees ride
 * the landed channel suite; what this file owns is the SERVICE layer:
 * mock-before-mint, the mint's envelope, the release registration, the
 * responder's ceiling); the drain-cancel rows are HR-7's structural half
 * (no quarry counterpart — the deprecated port always minted). The
 * deprecated port's create-interaction-channel suite is the second
 * reference for the responder rows (README § The suite).
 *
 * Triangulation, stated honestly: the happy-path mock rows alone would
 * pass a service that returns the mock's answer unvalidated — the
 * validation rows kill it; the validation rows alone would pass a
 * service that flags every unmocked ask — the mint and drain-cancel
 * rows force the mode-keyed posture; and the mint rows force a real
 * suspension, which a resolve-undefined fake cannot fake past the
 * respond row.
 */

import { describe, expect, it } from 'vitest';

import PROTOCOL from '../../../lib/engine/worker/protocol.js';
import serveAsk from '../serve-ask.js';
import type {
	InterceptAskMessage,
	InterceptInteractionRequest,
	InterceptIoFlag,
	InterceptPendingInteraction,
	IoMocks,
} from '../types.js';

function askOf(
	request: InterceptInteractionRequest,
	step = 1,
): InterceptAskMessage {
	return {
		step,
		loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 12 } },
		start: 0,
		end: 12,
		request,
	};
}

type SeamCalls = {
	readonly delivered: InterceptPendingInteraction[];
	readonly flags: InterceptIoFlag[];
	readonly releases: (() => void)[];
	cancelled: number;
	cleared: number;
};

function batchSeamOf(io?: IoMocks): ReturnType<typeof seamOf> {
	return seamOf(io, 'batch');
}

function tornSeamOf(io?: IoMocks): ReturnType<typeof seamOf> {
	return seamOf(io, 'iterate', () => true);
}

function seamOf(
	io?: IoMocks,
	mode: 'iterate' | 'batch' = 'iterate',
	isTornDown: () => boolean = () => false,
): { seam: Parameters<typeof serveAsk>[1]; calls: SeamCalls } {
	const calls: SeamCalls = {
		delivered: [],
		flags: [],
		releases: [],
		cancelled: 0,
		cleared: 0,
	};
	const seam = {
		...(io === undefined ? {} : { io }),
		mode,
		isTornDown,
		deliverInteraction(interaction: InterceptPendingInteraction) {
			calls.delivered.push(interaction);
		},
		registerRelease(release: () => void) {
			calls.releases.push(release);
		},
		clearRelease() {
			calls.cleared += 1;
		},
		flagIo(flag: InterceptIoFlag) {
			calls.flags.push(flag);
		},
		cancelRun() {
			calls.cancelled += 1;
		},
	};
	return { seam, calls };
}

// The pending sentinel rides TWO microtask hops so a same-tick resolution
// (one hop for the then-chain) always outraces it: 'pending' means the
// promise was still unsettled after the window every sync-or-one-hop
// implementation resolves in — a deliberate slack, not a race.
function settledStateOf(promise: Promise<unknown>): Promise<string> {
	return Promise.race([
		promise.then(
			() => 'resolved',
			() => 'rejected',
		),
		Promise.resolve().then(() => Promise.resolve().then(() => 'pending')),
	]);
}

describe('serveAsk', () => {
	describe('a supplied mock answers before any interaction is minted (HR-9)', () => {
		it('a prompt mock’s string answer rides back', async () => {
			const { seam } = seamOf({ prompt: () => 'sky' });

			await expect(
				serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam),
			).resolves.toBe('sky');
		});

		it('a prompt mock’s null answer rides back', async () => {
			const { seam } = seamOf({ prompt: () => null });

			await expect(
				serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam),
			).resolves.toBeNull();
		});

		it('a confirm mock’s false answer rides back', async () => {
			const { seam } = seamOf({ confirm: () => false });

			await expect(
				serveAsk(askOf({ kind: 'confirm', message: 'go?' }), seam),
			).resolves.toBe(false);
		});

		it('an alert mock answers the void contract’s undefined', async () => {
			const { seam } = seamOf({ alert: () => {} });

			await expect(
				serveAsk(askOf({ kind: 'alert', message: 'ping' }), seam),
			).resolves.toBeUndefined();
		});

		it('an alert mock’s returned value is discarded', async () => {
			const { seam } = seamOf({
				alert: () => 'noise' as unknown as undefined,
			});

			await expect(
				serveAsk(askOf({ kind: 'alert', message: 'ping' }), seam),
			).resolves.toBeUndefined();
		});

		it('an asynchronous mock is awaited', async () => {
			const { seam } = seamOf({ prompt: () => Promise.resolve('later') });

			await expect(
				serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam),
			).resolves.toBe('later');
		});

		it('the mock receives the asked message', async () => {
			const received: string[] = [];
			const { seam } = seamOf({
				confirm(message: string) {
					received.push(message);
					return true;
				},
			});
			await serveAsk(askOf({ kind: 'confirm', message: 'go?' }), seam);

			expect(received).toEqual(['go?']);
		});

		it('a prompt mock receives the defaultValue the ask carries', async () => {
			const received: (string | undefined)[] = [];
			const { seam } = seamOf({
				prompt(_message: string, defaultValue?: string) {
					received.push(defaultValue);
					return null;
				},
			});
			await serveAsk(
				askOf({ kind: 'prompt', message: 'q?', defaultValue: 'blue' }),
				seam,
			);

			expect(received).toEqual(['blue']);
		});

		it('an absent defaultValue reaches the mock as no argument at all', async () => {
			const argumentCounts: number[] = [];
			const { seam } = seamOf({
				prompt(...received: [string, string?]) {
					argumentCounts.push(received.length);
					return null;
				},
			});
			await serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam);

			expect(argumentCounts).toEqual([1]);
		});

		it('no interaction is minted for a mocked ask', async () => {
			const { seam, calls } = seamOf({ prompt: () => 'sky' });
			await serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam);

			expect(calls.delivered).toHaveLength(0);
		});

		it('a mocked ask under a batch drain answers the same — the mock outranks the posture', async () => {
			const { seam, calls } = batchSeamOf({ prompt: () => 'sky' });
			await serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam);

			expect(calls.cancelled).toBe(0);
		});

		it('a mocked ask under a batch drain still mints nothing', async () => {
			const { seam, calls } = batchSeamOf({ prompt: () => 'sky' });
			await serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam);

			expect(calls.delivered).toHaveLength(0);
		});
	});

	describe('answer validation — the per-verb table', () => {
		it('a prompt mock answering undefined rejects — undefined does not coerce', async () => {
			const { seam } = seamOf({
				prompt: () => undefined as unknown as string,
			});

			await expect(
				serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam),
			).rejects.toThrow();
		});

		it('the invalid-prompt flag names the failing surface', async () => {
			const { seam, calls } = seamOf({
				prompt: () => undefined as unknown as string,
			});
			await serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam).catch(
				() => {},
			);

			expect(calls.flags[0]?.source).toBe('prompt');
		});

		it('the invalid-answer flag is a TypeError', async () => {
			const { seam, calls } = seamOf({
				prompt: () => undefined as unknown as string,
			});
			await serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam).catch(
				() => {},
			);

			expect(calls.flags[0]?.name).toBe('TypeError');
		});

		it('a prompt mock answering a number rejects', async () => {
			const { seam } = seamOf({ prompt: () => 7 as unknown as string });

			await expect(
				serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam),
			).rejects.toThrow();
		});

		it('a confirm mock answering undefined rejects', async () => {
			const { seam } = seamOf({
				confirm: () => undefined as unknown as boolean,
			});

			await expect(
				serveAsk(askOf({ kind: 'confirm', message: 'go?' }), seam),
			).rejects.toThrow();
		});

		it('a confirm mock answering a string rejects', async () => {
			const { seam } = seamOf({ confirm: () => 'yes' as unknown as boolean });

			await expect(
				serveAsk(askOf({ kind: 'confirm', message: 'go?' }), seam),
			).rejects.toThrow();
		});

		it('a throwing mock rejects', async () => {
			const { seam } = seamOf({
				prompt() {
					throw new Error('the mock broke');
				},
			});

			await expect(
				serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam),
			).rejects.toThrow();
		});

		it('a throwing mock’s flag carries the thrown name and message', async () => {
			const { seam, calls } = seamOf({
				confirm() {
					throw new RangeError('the mock broke');
				},
			});
			await serveAsk(askOf({ kind: 'confirm', message: 'go?' }), seam).catch(
				() => {},
			);

			expect(calls.flags[0]).toStrictEqual({
				kind: 'io',
				source: 'confirm',
				name: 'RangeError',
				message: 'the mock broke',
			});
		});

		it('a rejecting mock classifies the same', async () => {
			const { seam, calls } = seamOf({
				alert: () => Promise.reject(new Error('rejected late')),
			});
			await serveAsk(askOf({ kind: 'alert', message: 'ping' }), seam).catch(
				() => {},
			);

			expect(calls.flags[0]?.message).toBe('rejected late');
		});

		it('the flag is recorded before the rejection lands', async () => {
			const { seam, calls } = seamOf({
				prompt: () => 7 as unknown as string,
			});
			await serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam).catch(
				() => {},
			);

			expect(calls.flags).toHaveLength(1);
		});

		it('the rejection’s message is the flag’s', async () => {
			const { seam, calls } = seamOf({
				prompt: () => 7 as unknown as string,
			});
			const rejection = await serveAsk(
				askOf({ kind: 'prompt', message: 'q?' }),
				seam,
			).then(
				() => 'resolved',
				(error: Error) => error.message,
			);

			expect(rejection).toBe(calls.flags[0]?.message);
		});

		it('an over-ceiling prompt answer rejects', async () => {
			const { seam } = seamOf({
				prompt: () => 'a'.repeat(PROTOCOL.PAYLOAD_CEILING + 1),
			});

			await expect(
				serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam),
			).rejects.toThrow();
		});

		it('the over-ceiling flag is a RangeError', async () => {
			const { seam, calls } = seamOf({
				prompt: () => 'a'.repeat(PROTOCOL.PAYLOAD_CEILING + 1),
			});
			await serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam).catch(
				() => {},
			);

			expect(calls.flags[0]?.name).toBe('RangeError');
		});

		it('the over-ceiling flag names the failing surface', async () => {
			const { seam, calls } = seamOf({
				prompt: () => 'a'.repeat(PROTOCOL.PAYLOAD_CEILING + 1),
			});
			await serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam).catch(
				() => {},
			);

			expect(calls.flags[0]?.source).toBe('prompt');
		});

		it('the recorded io flag rides frozen where it is authored', async () => {
			const { seam, calls } = seamOf({
				prompt: () => 7 as unknown as string,
			});
			await serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam).catch(
				() => {},
			);

			expect([calls.flags.length, Object.isFrozen(calls.flags[0])]).toEqual([
				1,
				true,
			]);
		});

		it('the ceiling is measured in encoded bytes, not characters', async () => {
			const { seam } = seamOf({ prompt: () => '€'.repeat(2800) });

			await expect(
				serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam),
			).rejects.toThrow();
		});

		it('an answer at the ceiling exactly rides back', async () => {
			const { seam } = seamOf({
				prompt: () => 'a'.repeat(PROTOCOL.PAYLOAD_CEILING),
			});

			await expect(
				serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam),
			).resolves.toHaveLength(PROTOCOL.PAYLOAD_CEILING);
		});
	});

	describe('no mock while stepping — the pending interaction', () => {
		it('the interaction is minted exactly once', async () => {
			const { seam, calls } = seamOf();
			void serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam);
			await Promise.resolve();

			expect(calls.delivered).toHaveLength(1);
		});

		it('the minted interaction is the pending-interaction event', async () => {
			const { seam, calls } = seamOf();
			void serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam);
			await Promise.resolve();

			expect(calls.delivered[0]?.event).toBe('pending-interaction');
		});

		it('the interaction wears the ask’s step', async () => {
			const { seam, calls } = seamOf();
			void serveAsk(askOf({ kind: 'prompt', message: 'q?' }, 4), seam);
			await Promise.resolve();

			expect(calls.delivered[0]?.step).toBe(4);
		});

		it('the interaction wears the ask’s attribution span', async () => {
			const { seam, calls } = seamOf();
			void serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam);
			await Promise.resolve();

			expect(calls.delivered[0]?.loc).toStrictEqual({
				start: { line: 1, column: 0 },
				end: { line: 1, column: 12 },
			});
		});

		it('the interaction wears the ask’s offset legs', async () => {
			const { seam, calls } = seamOf();
			void serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam);
			await Promise.resolve();

			expect([calls.delivered[0]?.start, calls.delivered[0]?.end]).toEqual([
				0, 12,
			]);
		});

		it('the minted interaction rides frozen where it is authored', async () => {
			const { seam, calls } = seamOf();
			void serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam);
			await Promise.resolve();

			expect([
				calls.delivered.length,
				Object.isFrozen(calls.delivered[0]),
			]).toEqual([1, true]);
		});

		it('the interaction’s request is the ask’s, by reference', async () => {
			const ask = askOf({ kind: 'confirm', message: 'go?' });
			const { seam, calls } = seamOf();
			void serveAsk(ask, seam);
			await Promise.resolve();

			expect(calls.delivered[0]?.request).toBe(ask.request);
		});

		it('the round-trip stays suspended until somebody responds', async () => {
			const { seam } = seamOf();
			const roundTrip = serveAsk(
				askOf({ kind: 'prompt', message: 'q?' }),
				seam,
			);

			await expect(settledStateOf(roundTrip)).resolves.toBe('pending');
		});

		it('respond resumes the round-trip with the validated answer', async () => {
			const { seam, calls } = seamOf();
			const roundTrip = serveAsk(
				askOf({ kind: 'prompt', message: 'q?' }),
				seam,
			);
			await Promise.resolve();
			calls.delivered[0]?.respond('typed');

			await expect(roundTrip).resolves.toBe('typed');
		});

		it('an alert responder’s answer is discarded — the modelled undefined rides', async () => {
			const { seam, calls } = seamOf();
			const roundTrip = serveAsk(askOf({ kind: 'alert', message: 'hm' }), seam);
			await Promise.resolve();
			calls.delivered[0]?.respond('ignored');

			await expect(roundTrip).resolves.toBeUndefined();
		});

		it('answering twice is inert — the first answer stands', async () => {
			const { seam, calls } = seamOf();
			const roundTrip = serveAsk(
				askOf({ kind: 'prompt', message: 'q?' }),
				seam,
			);
			await Promise.resolve();
			calls.delivered[0]?.respond('first');
			calls.delivered[0]?.respond('second');

			await expect(roundTrip).resolves.toBe('first');
		});

		it('a release is registered for the out-of-band teardown', async () => {
			const { seam, calls } = seamOf();
			void serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam);
			await Promise.resolve();

			expect(calls.releases).toHaveLength(1);
		});

		it('the registered release resumes the round-trip with the discarded undefined', async () => {
			const { seam, calls } = seamOf();
			const roundTrip = serveAsk(
				askOf({ kind: 'prompt', message: 'q?' }),
				seam,
			);
			await Promise.resolve();
			calls.releases[0]?.();

			await expect(roundTrip).resolves.toBeUndefined();
		});

		it('respond clears the registered release', async () => {
			const { seam, calls } = seamOf();
			void serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam);
			await Promise.resolve();
			calls.delivered[0]?.respond('typed');

			expect(calls.cleared).toBe(1);
		});

		it('an over-ceiling responder answer rejects the round-trip — the io failure, never a machinery defect', async () => {
			const { seam, calls } = seamOf();
			const roundTrip = serveAsk(
				askOf({ kind: 'prompt', message: 'q?' }),
				seam,
			);
			await Promise.resolve();
			calls.delivered[0]?.respond('a'.repeat(PROTOCOL.PAYLOAD_CEILING + 1));

			await expect(roundTrip).rejects.toThrow();
		});

		it('a respond on a torn-down stream is inert — the round-trip stays suspended', async () => {
			const { seam, calls } = tornSeamOf();
			const roundTrip = serveAsk(
				askOf({ kind: 'prompt', message: 'q?' }),
				seam,
			);
			await Promise.resolve();
			calls.delivered[0]?.respond('stale');

			await expect(
				settledStateOf(roundTrip).then((state) => [
					calls.delivered.length,
					state,
				]),
			).resolves.toEqual([1, 'pending']);
		});

		it('the responder’s over-ceiling failure records the flag naming its surface', async () => {
			const { seam, calls } = seamOf();
			const roundTrip = serveAsk(
				askOf({ kind: 'prompt', message: 'q?' }),
				seam,
			);
			await Promise.resolve();
			calls.delivered[0]?.respond('a'.repeat(PROTOCOL.PAYLOAD_CEILING + 1));
			await roundTrip.catch(() => {});

			expect([calls.flags[0]?.name, calls.flags[0]?.source]).toEqual([
				'RangeError',
				'prompt',
			]);
		});
	});

	describe('no mock under a batch drain — the structural cancel (HR-7)', () => {
		it('the run cancels at the ask', async () => {
			const { seam, calls } = batchSeamOf();
			await serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam);

			expect(calls.cancelled).toBe(1);
		});

		it('the discarded round-trip resolves undefined', async () => {
			const { seam } = batchSeamOf();

			await expect(
				serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam),
			).resolves.toBeUndefined();
		});

		it('no interaction is minted — nobody is stepping', async () => {
			const { seam, calls } = batchSeamOf();
			await serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam);

			expect(calls.delivered).toHaveLength(0);
		});

		it('structural, never temporal: a mock for another verb still cancels', async () => {
			const { seam, calls } = batchSeamOf({ alert: () => {} });
			await serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam);

			expect(calls.cancelled).toBe(1);
		});

		it('a drain-cancel records no flag — a cancel is not an io failure', async () => {
			const { seam, calls } = batchSeamOf();
			await serveAsk(askOf({ kind: 'prompt', message: 'q?' }), seam);

			expect(calls.flags).toHaveLength(0);
		});
	});
});
