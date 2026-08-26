/**
 * @file The thread-side io seam suite, fresh-authored against
 * README.md § io (no quarry counterpart transports here): a supplied
 * mock answers, value and Promise forms alike; no mock, a throwing or
 * rejecting mock, an invalid answer per the per-verb table, and an
 * over-ceiling prompt answer all resolve to the io flag; the flag is
 * the complete io error record the settlement mapper's precedence
 * step 1 reads. The ceiling rows measure ENCODED bytes against the
 * machinery's imported ceiling, never a retyped number; the vocabulary
 * probe locks the resolution's answer member to the channel's
 * `CallResponse`, both directions.
 */

import { describe, expect, it } from 'vitest';

import type { CallResponse } from '../../../lib/engine/types.js';
import PROTOCOL from '../../../lib/engine/worker/protocol.js';
import resolveIo from '../resolve-io.js';
import type { RunIoResolution } from '../types.js';

type AnsweredArm = Extract<RunIoResolution, { answered: true }>;
type FlaggedArm = Extract<RunIoResolution, { answered: false }>;

async function answered(
	resolution: Promise<RunIoResolution>,
): Promise<AnsweredArm> {
	const settled = await resolution;
	if (!settled.answered) {
		throw new Error(`expected an answer, got the flag: ${settled.flag.name}`);
	}
	return settled;
}

async function flagged(
	resolution: Promise<RunIoResolution>,
): Promise<FlaggedArm> {
	const settled = await resolution;
	if (settled.answered) {
		throw new Error(
			`expected the flag, got an answer: ${String(settled.answer)}`,
		);
	}
	return settled;
}

describe('resolveIo — no mock takes the io posture', () => {
	it('an absent io record flags the asked verb', async () => {
		const { flag } = await flagged(
			resolveIo({ verb: 'prompt', message: 'your name?' }),
		);
		expect(flag.verb).toBe('prompt');
	});

	it('the flag is the io kind', async () => {
		const { flag } = await flagged(
			resolveIo({ verb: 'prompt', message: 'your name?' }, {}),
		);
		expect(flag.kind).toBe('io');
	});

	it('the unmocked flag names the missing mock', async () => {
		const { flag } = await flagged(
			resolveIo({ verb: 'prompt', message: 'your name?' }, {}),
		);
		expect(flag.name).toBe('MissingMockError');
	});

	it('the unmocked message names the verb', async () => {
		const { flag } = await flagged(
			resolveIo({ verb: 'confirm', message: 'sure?' }, {}),
		);
		expect(flag.message).toContain('confirm');
	});

	it('a mock for another verb does not answer this one', async () => {
		const { flag } = await flagged(
			resolveIo({ verb: 'alert', message: 'done' }, { prompt: () => null }),
		);
		expect(flag.verb).toBe('alert');
	});
});

describe('resolveIo — a supplied mock answers', () => {
	it('a prompt mock answers its string', async () => {
		const { answer } = await answered(
			resolveIo(
				{ verb: 'prompt', message: 'your name?' },
				{ prompt: () => 'Ada' },
			),
		);
		expect(answer).toBe('Ada');
	});

	it('a prompt mock answers null — the platform cancel', async () => {
		const { answer } = await answered(
			resolveIo(
				{ verb: 'prompt', message: 'your name?' },
				{ prompt: () => null },
			),
		);
		expect(answer).toBeNull();
	});

	it('the prompt mock receives the ask message', async () => {
		const { answer } = await answered(
			resolveIo(
				{ verb: 'prompt', message: 'your name?' },
				{ prompt: (message) => message },
			),
		);
		expect(answer).toBe('your name?');
	});

	it('the prompt mock receives the default when the ask carries one', async () => {
		const { answer } = await answered(
			resolveIo(
				{ verb: 'prompt', message: 'your name?', defaultValue: 'Ada' },
				{ prompt: (_message, defaultValue) => defaultValue ?? null },
			),
		);
		expect(answer).toBe('Ada');
	});

	it('an absent default reaches the prompt mock as no argument', async () => {
		const { answer } = await answered(
			resolveIo(
				{ verb: 'prompt', message: 'your name?' },
				{
					prompt: function countingMock() {
						return String(arguments.length);
					},
				},
			),
		);
		expect(answer).toBe('1');
	});

	it('a confirm mock answers true', async () => {
		const { answer } = await answered(
			resolveIo({ verb: 'confirm', message: 'sure?' }, { confirm: () => true }),
		);
		expect(answer).toBe(true);
	});

	it('a confirm mock answers false', async () => {
		const { answer } = await answered(
			resolveIo(
				{ verb: 'confirm', message: 'sure?' },
				{ confirm: () => false },
			),
		);
		expect(answer).toBe(false);
	});

	it('the confirm mock receives the ask message', async () => {
		const seen: string[] = [];
		await resolveIo(
			{ verb: 'confirm', message: 'sure?' },
			{
				confirm: (message) => {
					seen.push(message);
					return true;
				},
			},
		);
		expect(seen).toEqual(['sure?']);
	});

	it('the asked verb selects its own mock among all three', async () => {
		const { answer } = await answered(
			resolveIo(
				{ verb: 'confirm', message: 'sure?' },
				{
					prompt: () => 'Ada',
					confirm: () => true,
					alert: () => {},
				},
			),
		);
		expect(answer).toBe(true);
	});

	it('the unasked mocks are never invoked', async () => {
		const invoked: string[] = [];
		await resolveIo(
			{ verb: 'confirm', message: 'sure?' },
			{
				prompt: () => {
					invoked.push('prompt');
					return null;
				},
				confirm: () => {
					invoked.push('confirm');
					return true;
				},
				alert: () => {
					invoked.push('alert');
				},
			},
		);
		expect(invoked).toEqual(['confirm']);
	});

	it('an alert mock answers undefined — the void contract', async () => {
		const { answer } = await answered(
			resolveIo({ verb: 'alert', message: 'done' }, { alert: () => {} }),
		);
		expect(answer).toBeUndefined();
	});

	it('the alert mock receives the ask message', async () => {
		const seen: string[] = [];
		await resolveIo(
			{ verb: 'alert', message: 'done' },
			{
				alert: (message) => {
					seen.push(message);
				},
			},
		);
		expect(seen).toEqual(['done']);
	});
});

describe('resolveIo — the Promise form is awaited', () => {
	it('a prompt mock may answer through a Promise', async () => {
		const { answer } = await answered(
			resolveIo(
				{ verb: 'prompt', message: 'your name?' },
				{ prompt: () => Promise.resolve('Ada') },
			),
		);
		expect(answer).toBe('Ada');
	});

	it('a confirm mock may answer through a Promise', async () => {
		const { answer } = await answered(
			resolveIo(
				{ verb: 'confirm', message: 'sure?' },
				{ confirm: () => Promise.resolve(true) },
			),
		);
		expect(answer).toBe(true);
	});

	it('an alert mock may settle through a Promise', async () => {
		const { answer } = await answered(
			resolveIo(
				{ verb: 'alert', message: 'done' },
				{ alert: () => Promise.resolve() },
			),
		);
		expect(answer).toBeUndefined();
	});
});

describe('resolveIo — a throwing mock classifies', () => {
	it('a throwing prompt mock flags its verb', async () => {
		const { flag } = await flagged(
			resolveIo(
				{ verb: 'prompt', message: 'your name?' },
				{
					prompt: () => {
						throw new TypeError('mock broke');
					},
				},
			),
		);
		expect(flag.verb).toBe('prompt');
	});

	it('the thrown error keeps its own name', async () => {
		const { flag } = await flagged(
			resolveIo(
				{ verb: 'prompt', message: 'your name?' },
				{
					prompt: () => {
						throw new TypeError('mock broke');
					},
				},
			),
		);
		expect(flag.name).toBe('TypeError');
	});

	it('the thrown error keeps its own message', async () => {
		const { flag } = await flagged(
			resolveIo(
				{ verb: 'prompt', message: 'your name?' },
				{
					prompt: () => {
						throw new TypeError('mock broke');
					},
				},
			),
		);
		expect(flag.message).toBe('mock broke');
	});

	it('a thrown non-Error is stringified under the Error name', async () => {
		const { flag } = await flagged(
			resolveIo(
				{ verb: 'confirm', message: 'sure?' },
				{
					confirm: () => {
						// eslint-disable-next-line @typescript-eslint/only-throw-error -- the row IS the non-Error throw: a consumer mock can throw anything
						throw 'plain refusal';
					},
				},
			),
		);
		expect([flag.name, flag.message]).toEqual(['Error', 'plain refusal']);
	});

	it('a throwing alert mock still classifies', async () => {
		const { flag } = await flagged(
			resolveIo(
				{ verb: 'alert', message: 'done' },
				{
					alert: () => {
						throw new Error('alert broke');
					},
				},
			),
		);
		expect(flag.verb).toBe('alert');
	});
});

describe('resolveIo — a rejecting mock classifies', () => {
	it('a rejecting prompt mock flags its verb', async () => {
		const { flag } = await flagged(
			resolveIo(
				{ verb: 'prompt', message: 'your name?' },
				{ prompt: () => Promise.reject(new RangeError('async break')) },
			),
		);
		expect(flag.verb).toBe('prompt');
	});

	it('the rejection keeps its own name and message', async () => {
		const { flag } = await flagged(
			resolveIo(
				{ verb: 'confirm', message: 'sure?' },
				{ confirm: () => Promise.reject(new RangeError('async break')) },
			),
		);
		expect([flag.name, flag.message]).toEqual(['RangeError', 'async break']);
	});

	it('a rejecting alert mock still classifies', async () => {
		const { flag } = await flagged(
			resolveIo(
				{ verb: 'alert', message: 'done' },
				{ alert: () => Promise.reject(new Error('alert broke')) },
			),
		);
		expect(flag.verb).toBe('alert');
	});

	it('a non-Error rejection is stringified under the Error name', async () => {
		const { flag } = await flagged(
			resolveIo(
				{ verb: 'confirm', message: 'sure?' },
				// eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- the row IS the non-Error rejection: a consumer mock can reject with anything
				{ confirm: () => Promise.reject('plain refusal') },
			),
		);
		expect([flag.name, flag.message]).toEqual(['Error', 'plain refusal']);
	});
});

describe('resolveIo — the per-verb validity table', () => {
	it('a prompt answer of a number flags — no coercion to string', async () => {
		const { flag } = await flagged(
			resolveIo(
				{ verb: 'prompt', message: 'your age?' },
				{ prompt: () => 42 as unknown as string },
			),
		);
		expect(flag.name).toBe('TypeError');
	});

	it('a prompt answer of undefined flags', async () => {
		const { flag } = await flagged(
			resolveIo(
				{ verb: 'prompt', message: 'your name?' },
				{ prompt: () => undefined as unknown as string },
			),
		);
		expect(flag.verb).toBe('prompt');
	});

	it('the invalid-answer message names the verb', async () => {
		const { flag } = await flagged(
			resolveIo(
				{ verb: 'prompt', message: 'your age?' },
				{ prompt: () => 42 as unknown as string },
			),
		);
		expect(flag.message).toContain('prompt');
	});

	it('a confirm answer of undefined flags — the silent coercion does not return', async () => {
		const { flag } = await flagged(
			resolveIo(
				{ verb: 'confirm', message: 'sure?' },
				{ confirm: () => undefined as unknown as boolean },
			),
		);
		expect(flag.kind).toBe('io');
	});

	it('a confirm answer of a string flags', async () => {
		const { flag } = await flagged(
			resolveIo(
				{ verb: 'confirm', message: 'sure?' },
				{ confirm: () => 'yes' as unknown as boolean },
			),
		);
		expect(flag.verb).toBe('confirm');
	});

	it('a confirm answer of a number flags — no truthiness coercion', async () => {
		const { flag } = await flagged(
			resolveIo(
				{ verb: 'confirm', message: 'sure?' },
				{ confirm: () => 1 as unknown as boolean },
			),
		);
		expect(flag.name).toBe('TypeError');
	});

	it('an invalid answer through a Promise still flags', async () => {
		const { flag } = await flagged(
			resolveIo(
				{ verb: 'prompt', message: 'your age?' },
				{ prompt: () => Promise.resolve(42 as unknown as string) },
			),
		);
		expect(flag.name).toBe('TypeError');
	});

	it('an alert mock answering a value still answers — stated, not policed', async () => {
		const { answer } = await answered(
			resolveIo(
				{ verb: 'alert', message: 'done' },
				{ alert: () => 'ignored' as unknown as undefined },
			),
		);
		expect(answer).toBeUndefined();
	});
});

describe('resolveIo — the transport ceiling, in encoded bytes', () => {
	it('a prompt answer at the ceiling answers', async () => {
		const { answer } = await answered(
			resolveIo(
				{ verb: 'prompt', message: 'essay?' },
				{ prompt: () => 'a'.repeat(PROTOCOL.PAYLOAD_CEILING) },
			),
		);
		expect(answer).toHaveLength(PROTOCOL.PAYLOAD_CEILING);
	});

	it('a prompt answer over the ceiling flags', async () => {
		const { flag } = await flagged(
			resolveIo(
				{ verb: 'prompt', message: 'essay?' },
				{ prompt: () => 'a'.repeat(PROTOCOL.PAYLOAD_CEILING + 1) },
			),
		);
		expect(flag.name).toBe('RangeError');
	});

	it('the ceiling is measured in encoded bytes, not characters', async () => {
		const { flag } = await flagged(
			resolveIo(
				{ verb: 'prompt', message: 'essay?' },
				{ prompt: () => 'é'.repeat(PROTOCOL.PAYLOAD_CEILING / 2 + 1) },
			),
		);
		expect([flag.verb, flag.name]).toEqual(['prompt', 'RangeError']);
	});

	it('the over-ceiling message carries the imported ceiling', async () => {
		const { flag } = await flagged(
			resolveIo(
				{ verb: 'prompt', message: 'essay?' },
				{ prompt: () => 'a'.repeat(PROTOCOL.PAYLOAD_CEILING + 1) },
			),
		);
		expect(flag.message).toContain(String(PROTOCOL.PAYLOAD_CEILING));
	});
});

describe('resolveIo — the flag record is the seam contract', () => {
	it('the flag carries exactly the io error members', async () => {
		const { flag } = await flagged(
			resolveIo({ verb: 'prompt', message: 'your name?' }, {}),
		);
		expect(
			Object.keys(flag).toSorted((left, right) => left.localeCompare(right)),
		).toEqual(['kind', 'message', 'name', 'verb']);
	});

	it('a flagged resolution is deeply frozen', async () => {
		const settled = await flagged(
			resolveIo({ verb: 'prompt', message: 'your name?' }, {}),
		);
		expect([Object.isFrozen(settled), Object.isFrozen(settled.flag)]).toEqual([
			true,
			true,
		]);
	});

	it('an answered resolution is frozen', async () => {
		const settled = await answered(
			resolveIo(
				{ verb: 'prompt', message: 'your name?' },
				{ prompt: () => 'Ada' },
			),
		);
		expect(Object.isFrozen(settled)).toBe(true);
	});

	it('the answer vocabulary is the channel vocabulary, both directions', () => {
		const inbound: (response: CallResponse) => AnsweredArm['answer'] = (
			response,
		) => response;
		const outbound: (answer: AnsweredArm['answer']) => CallResponse = (
			answer,
		) => answer;
		expect([typeof inbound, typeof outbound]).toEqual(['function', 'function']);
	});
});
