/**
 * @file I3's transported cluster: the interaction channel driven DIRECTLY
 * — a Node-tier LEAF, never reached through the engine (the deprecated
 * suite's committed testing posture, carried).
 *
 * All 25 of the deprecated port's it-blocks transport content-level from
 * `evaluators-deprecated/intercept/tests/create-interaction-channel.test.ts`
 * under HR-8/HR-11/HR-14: the port's `kind: 'pending-interaction'`
 * discriminant rewrites to the reference spelling `event`, the ask
 * envelope gains the offset legs (the wire attribution's both-or-neither
 * rule, structural in the wrap's one six-field stamp), and the kind
 * contract binds the region's GENERIC `PendingInteraction` to intercept's
 * real shapes (`InterceptInteractionRequest`, `InterceptDialogAnswer`) —
 * the port's `unknown`-parameter respond retires with its region.
 *
 * Ruling carry block (prose, not PINNED — the pinned-guard hook is
 * unregistered and a guard-down period accepts no new pins, human ruling
 * 2026-08-06; authority stays with the deprecated suite's markers):
 * - D9 (ratified): respond validates per request kind at the boundary —
 *   a bad answer is a synchronous TypeError at the lens, retryable; the
 *   run stays suspended.
 * - D3/H-3 (ruled 2026-08-04): any answer releases an alert and its
 *   VALUE is ignored — the delivered answer is the modelled `undefined`,
 *   never the caller's object.
 * - human ruling 2026-08-04: teardown wins over validation, plus a
 *   diagnostic — validation-first would make the same dev defect throw
 *   or not depending on unmount timing.
 * - kind contract: answering twice is inert; answering after teardown is
 *   a no-op with NO per-kind exception — alert's validation-free path
 *   still rides the latch and teardown gates.
 *
 * Triangulation, stated honestly: the first delivery row alone is
 * passable by a respond that always delivers; the wrong-kind throw rows
 * and the twice-inert row force real validation and a real latch, and
 * the teardown rows force the consultation ORDER (a validation-first
 * implementation throws where the contract demands inertness).
 *
 * Ask-attribution soundness is DELIBERATELY not validated here: the
 * channel is mint-only and trusts its one caller — `serveAsk`, the
 * thread-side seam that receives the clone-crossed ask from the engine's
 * call channel and narrows it (I6's increment). The worker-setup suite
 * pins what the worker actually mints; this suite pins what the channel
 * does with an ask it is handed.
 */

import { describe, expect, it, vi } from 'vitest';

import createInteractionChannel from '../create-interaction-channel.js';
import type {
	InterceptAskMessage,
	InterceptDialogAnswer,
	InterceptInteractionRequest,
	InterceptPendingInteraction,
} from '../types.js';

function askOf(request: InterceptInteractionRequest): InterceptAskMessage {
	return { step: 1, loc: null, start: null, end: null, request };
}

function swallowThrow(callback: () => void): void {
	try {
		callback();
	} catch {
		return;
	}
}

function channelOf(
	request: InterceptInteractionRequest,
	tornDown = false,
): {
	pending: InterceptPendingInteraction;
	delivered: InterceptDialogAnswer[];
	teardown: { down: boolean };
} {
	const delivered: InterceptDialogAnswer[] = [];
	const teardown = { down: tornDown };
	const pending = createInteractionChannel({
		ask: askOf(request),
		deliver(answer) {
			delivered.push(answer);
		},
		isTornDown: () => teardown.down,
	});
	return { pending, delivered, teardown };
}

describe('createInteractionChannel', () => {
	describe('the authored event', () => {
		it('is the distinguished kind wearing the ask envelope', () => {
			const { pending } = channelOf({ kind: 'prompt', message: 'who?' });

			expect([pending.event, pending.step, pending.loc]).toEqual([
				'pending-interaction',
				1,
				null,
			]);
		});

		it('carries the ask envelope’s offset legs', () => {
			const { pending } = channelOf({ kind: 'prompt', message: 'who?' });

			expect([pending.start, pending.end]).toEqual([null, null]);
		});

		it('wears a full attribution when the ask carried one', () => {
			const pending = createInteractionChannel({
				ask: {
					step: 3,
					loc: { start: { line: 4, column: 8 }, end: { line: 4, column: 22 } },
					start: 41,
					end: 55,
					request: { kind: 'prompt', message: 'who?' },
				},
				deliver() {},
				isTornDown: () => false,
			});

			expect([pending.loc?.start.line, pending.start, pending.end]).toEqual([
				4, 41, 55,
			]);
		});

		it('carries the clone-safe request that crossed', () => {
			const { pending } = channelOf({
				kind: 'prompt',
				message: 'who?',
				defaultValue: 'a toad',
			});

			expect(pending.request).toStrictEqual({
				kind: 'prompt',
				message: 'who?',
				defaultValue: 'a toad',
			});
		});

		it('is frozen at its top level', () => {
			const { pending } = channelOf({ kind: 'confirm', message: 'sure?' });

			expect(Object.isFrozen(pending)).toBe(true);
		});

		it('is deep-frozen where it is authored', () => {
			const { pending } = channelOf({ kind: 'confirm', message: 'sure?' });

			expect(Object.isFrozen(pending.request)).toBe(true);
		});

		it('freezing does not disable the answer channel', () => {
			const { pending, delivered } = channelOf({
				kind: 'prompt',
				message: 'who?',
			});
			pending.respond('Ada');

			expect(delivered).toEqual(['Ada']);
		});
	});

	describe('a valid answer', () => {
		it("prompt's string delivers", () => {
			const { pending, delivered } = channelOf({
				kind: 'prompt',
				message: 'who?',
			});
			pending.respond('Ada');

			expect(delivered).toEqual(['Ada']);
		});

		it("prompt's null — the platform cancel — delivers", () => {
			const { pending, delivered } = channelOf({
				kind: 'prompt',
				message: 'who?',
			});
			pending.respond(null);

			expect(delivered).toEqual([null]);
		});

		it("confirm's false — the falsy branch — delivers", () => {
			const { pending, delivered } = channelOf({
				kind: 'confirm',
				message: 'sure?',
			});
			pending.respond(false);

			expect(delivered).toEqual([false]);
		});

		it("confirm's true also delivers — any boolean, never one special case", () => {
			const { pending, delivered } = channelOf({
				kind: 'confirm',
				message: 'sure?',
			});
			pending.respond(true);

			expect(delivered).toEqual([true]);
		});

		it("alert's answer is ignored — the modelled undefined is what delivers", () => {
			const { pending, delivered } = channelOf({
				kind: 'alert',
				message: 'done',
			});
			pending.respond({ huge: 'object' } as unknown as InterceptDialogAnswer);

			expect(delivered).toEqual([undefined]);
		});
	});

	describe('a wrong-kind answer — a loud, retryable dev error', () => {
		it('a boolean for a prompt throws a TypeError at the caller', () => {
			const { pending } = channelOf({ kind: 'prompt', message: 'who?' });

			expect(() => pending.respond(true)).toThrow(TypeError);
		});

		it('the run stays suspended — nothing was delivered', () => {
			const { pending, delivered } = channelOf({
				kind: 'prompt',
				message: 'who?',
			});
			swallowThrow(() =>
				pending.respond(42 as unknown as InterceptDialogAnswer),
			);

			expect(delivered).toHaveLength(0);
		});

		it('the ask is retryable — a valid answer after the throw delivers', () => {
			const { pending, delivered } = channelOf({
				kind: 'prompt',
				message: 'who?',
			});
			swallowThrow(() =>
				pending.respond(42 as unknown as InterceptDialogAnswer),
			);
			pending.respond('Ada');

			expect(delivered).toEqual(['Ada']);
		});

		it('a string for a confirm throws', () => {
			const { pending } = channelOf({ kind: 'confirm', message: 'sure?' });

			expect(() => pending.respond('yes')).toThrow(TypeError);
		});

		it('undefined for a prompt throws', () => {
			const { pending } = channelOf({ kind: 'prompt', message: 'who?' });

			// eslint-disable-next-line unicorn/no-useless-undefined -- the explicit undefined answer IS the invalid case under test
			expect(() => pending.respond(undefined)).toThrow(TypeError);
		});
	});

	describe('answering twice', () => {
		it('the second answer is inert — delivered exactly once', () => {
			const { pending, delivered } = channelOf({
				kind: 'prompt',
				message: 'who?',
			});
			pending.respond('Ada');
			pending.respond('Grace');

			expect(delivered).toEqual(['Ada']);
		});

		it('a second answer never throws, whatever it carries', () => {
			const { pending } = channelOf({ kind: 'prompt', message: 'who?' });
			pending.respond('Ada');

			expect(() =>
				pending.respond(42 as unknown as InterceptDialogAnswer),
			).not.toThrow();
		});
	});

	describe('an answer after teardown — inert, whatever it carries', () => {
		it('a valid answer after teardown delivers nothing', () => {
			const { pending, delivered, teardown } = channelOf({
				kind: 'prompt',
				message: 'who?',
			});
			teardown.down = true;
			pending.respond('Ada');

			expect(delivered).toHaveLength(0);
		});

		it('a valid answer after teardown does not warn', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const { pending, teardown } = channelOf({
				kind: 'prompt',
				message: 'who?',
			});
			teardown.down = true;
			pending.respond('Ada');
			const warned = warn.mock.calls.length;
			warn.mockRestore();

			expect(warned).toBe(0);
		});

		it('an invalid answer after teardown does not throw', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const { pending, teardown } = channelOf({
				kind: 'prompt',
				message: 'who?',
			});
			teardown.down = true;
			expect(() =>
				pending.respond(42 as unknown as InterceptDialogAnswer),
			).not.toThrow();
			warn.mockRestore();
		});

		it('an invalid answer after teardown warns once — the defect is not silent', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const { pending, teardown } = channelOf({
				kind: 'prompt',
				message: 'who?',
			});
			teardown.down = true;
			pending.respond(42 as unknown as InterceptDialogAnswer);
			const warned = warn.mock.calls.length;
			warn.mockRestore();

			expect(warned).toBe(1);
		});

		it('an alert answered after teardown delivers nothing — no kind bypasses the pipeline', () => {
			const { pending, delivered, teardown } = channelOf({
				kind: 'alert',
				message: 'done',
			});
			teardown.down = true;
			pending.respond(true);

			expect(delivered).toHaveLength(0);
		});

		it("an alert's second answer is inert too", () => {
			const { pending, delivered } = channelOf({
				kind: 'alert',
				message: 'done',
			});
			pending.respond(true);
			pending.respond('again');

			expect(delivered).toEqual([undefined]);
		});
	});

	describe('two asks, two channels', () => {
		it('answering one pending interaction leaves another answerable', () => {
			const first = channelOf({ kind: 'prompt', message: 'first?' });
			const second = channelOf({ kind: 'prompt', message: 'second?' });
			first.pending.respond('one');
			second.pending.respond('two');

			expect(second.delivered).toEqual(['two']);
		});
	});

	describe('the kind contract', () => {
		it('the authored event binds the region’s generic to intercept’s real shapes', () => {
			const { pending } = channelOf({ kind: 'alert', message: 'done' });
			const probe: import('../../types.js').PendingInteraction<
				InterceptInteractionRequest,
				InterceptDialogAnswer
			> = pending;

			expect(probe.request.kind).toBe('alert');
		});
	});
});
