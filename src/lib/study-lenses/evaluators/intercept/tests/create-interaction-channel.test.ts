/**
 * @file I5's ZOMBIES cluster: the interaction channel driven DIRECTLY —
 * never through the fake transport, which rejects an asynchronous
 * round-trip outright (the committed Testing posture: the channel is a
 * Node-tier LEAF).
 *
 * `channelOf` wires one ask to a recording deliver and a settable teardown
 * probe; each row still names its own data.
 *
 * Triangulation, stated honestly: the first delivery row alone is passable
 * by a respond that always delivers; the wrong-kind throw rows and the
 * twice-inert row force real validation and a real latch, and the
 * teardown rows force the consultation ORDER (a validation-first
 * implementation throws where the contract demands inertness).
 */

import { describe, expect, it, vi } from 'vitest';

import createInteractionChannel from '../create-interaction-channel.js';
import type {
	InterceptAnswer,
	InterceptAskMessage,
	InterceptInteractionRequest,
	InterceptPendingInteraction,
} from '../types.js';

function askOf(request: InterceptInteractionRequest): InterceptAskMessage {
	return { step: 1, loc: null, request };
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
	delivered: InterceptAnswer[];
	teardown: { down: boolean };
} {
	const delivered: InterceptAnswer[] = [];
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

			expect([pending.kind, pending.step, pending.loc]).toEqual([
				'pending-interaction',
				1,
				null,
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
			// PINNED(committed DOCS § Structural constraints: a pending interaction is frozen where it is paired with its answer channel)
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
			// PINNED(D3 ratified + H-3: any answer releases an alert and its VALUE is ignored — the delivered answer is the modelled undefined, never the caller's object, so nothing the channel cannot carry ever reaches the wire)
			const { pending, delivered } = channelOf({
				kind: 'alert',
				message: 'done',
			});
			pending.respond({ huge: 'object' });

			expect(delivered).toEqual([undefined]);
		});
	});

	describe('a wrong-kind answer — a loud, retryable dev error', () => {
		it('a boolean for a prompt throws a TypeError at the caller', () => {
			// PINNED(D9 ratified: respond validates per request kind at the boundary — a bad answer is a synchronous TypeError at the lens, a dev defect, never a learner condition)
			const { pending } = channelOf({ kind: 'prompt', message: 'who?' });

			expect(() => pending.respond(true)).toThrow(TypeError);
		});

		it('the run stays suspended — nothing was delivered', () => {
			const { pending, delivered } = channelOf({
				kind: 'prompt',
				message: 'who?',
			});
			swallowThrow(() => pending.respond(42));

			expect(delivered).toHaveLength(0);
		});

		it('the ask is retryable — a valid answer after the throw delivers', () => {
			// PINNED(D9 ratified: the run stays suspended and the interaction can be answered again)
			const { pending, delivered } = channelOf({
				kind: 'prompt',
				message: 'who?',
			});
			swallowThrow(() => pending.respond(42));
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
			// PINNED(kind contract: answering twice is inert — the run is already released)
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

			expect(() => pending.respond(42)).not.toThrow();
		});
	});

	describe('an answer after teardown — inert, whatever it carries', () => {
		it('a valid answer after teardown delivers nothing', () => {
			// PINNED(kind contract: answering after teardown is a no-op, never a throw — teardown is consulted FIRST)
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
			// PINNED(human ruling 2026-08-04: teardown wins over validation, plus a diagnostic — validation-first would make the same dev defect throw or not depending on unmount timing)
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const { pending, teardown } = channelOf({
				kind: 'prompt',
				message: 'who?',
			});
			teardown.down = true;
			expect(() => pending.respond(42)).not.toThrow();
			warn.mockRestore();
		});

		it('an invalid answer after teardown warns once — the defect is not silent', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const { pending, teardown } = channelOf({
				kind: 'prompt',
				message: 'who?',
			});
			teardown.down = true;
			pending.respond(42);
			const warned = warn.mock.calls.length;
			warn.mockRestore();

			expect(warned).toBe(1);
		});

		it('an alert answered after teardown delivers nothing — no kind bypasses the pipeline', () => {
			// PINNED(kind contract @remarks: answering after teardown is a no-op with NO per-kind exception — a validation-free alert fast path must still ride the latch and teardown gates)
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
		it('the authored event is assignable to the kind pending interaction', () => {
			// PINNED(committed types.ts: respond keeps the kind's unknown parameter — narrowing it per kind would break assignability under strictFunctionTypes)
			const { pending } = channelOf({ kind: 'alert', message: 'done' });
			const probe: import('../../types.js').PendingInteraction = pending;

			expect(probe.kind).toBe('pending-interaction');
		});
	});
});
