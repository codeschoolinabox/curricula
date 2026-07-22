import { describe, expect, it } from 'vitest';

import type { Facts } from '../../../embody/types.js';
import type { EvaluationSpec } from '../../types.js';
import danger from '../index.js';
import type { DangerSettlement, DangerStream } from '../types.js';

function specFor(
	code: string,
	execution: 'function' | 'module' = 'function',
	iterations?: number,
): EvaluationSpec {
	// danger's main reads only facts.source.value; a minimal fixture suffices.
	const facts = { source: { ok: true, value: code } } as unknown as Facts;
	return iterations === undefined
		? { facts, execution }
		: { facts, execution, iterations };
}

function streamFor(spec: EvaluationSpec): DangerStream {
	const streamOrRefusal = danger.main(spec);
	if ('refused' in streamOrRefusal) {
		throw new Error(`unexpected refusal: ${streamOrRefusal.reason}`);
	}
	return streamOrRefusal;
}

async function settleOf(spec: EvaluationSpec): Promise<DangerSettlement> {
	const stream = streamFor(spec);
	// danger yields no events, so a single pull starts + awaits + completes the run.
	await stream[Symbol.asyncIterator]().next();
	return stream.settled;
}

describe('danger evaluator (browser)', () => {
	it('is named danger and applies to any spec', () => {
		expect(danger.name).toBe('danger');
		expect(danger.applicability(specFor('1 + 1;'))).toBe(true);
	});

	it('a script spec settles clean through the stream', async () => {
		expect(await settleOf(specFor('1 + 1;'))).toStrictEqual({ ended: 'clean' });
	});

	it('a module spec settles clean through the stream', async () => {
		expect(await settleOf(specFor('1 + 1;', 'module'))).toStrictEqual({
			ended: 'clean',
		});
	});

	it('the default (function) axis is script mode — a bare top-level await settles error', async () => {
		// Proves execution:'function' maps to script, not module: a top-level await is a
		// SyntaxError outside a module, so it settles error (a module would run it clean).
		const settlement = await settleOf(specFor('await 1;'));
		expect(settlement.ended).toBe('error');
	});

	it('a script throw settles error, carrying the reason', async () => {
		expect(await settleOf(specFor("throw new Error('boom');"))).toStrictEqual({
			ended: 'error',
			error: { name: 'Error', message: 'boom', reason: 'threw' },
		});
	});

	it('a module rejected top-level await settles error (reason threw)', async () => {
		expect(
			await settleOf(
				specFor("await Promise.reject(new Error('rej'));", 'module'),
			),
		).toStrictEqual({
			ended: 'error',
			error: { name: 'Error', message: 'rej', reason: 'threw' },
		});
	});

	it('a loop over its cap settles error with reason loop-cap', async () => {
		expect(
			await settleOf(
				specFor('for (let i = 0; i < 5; i = i + 1) { let x = i; }', 'function', 3),
			),
		).toStrictEqual({
			ended: 'error',
			error: {
				name: 'RangeError',
				message: 'Loop 1 exceeded 3 iterations.',
				reason: 'loop-cap',
			},
		});
	});

	it('nothing runs until the first pull (lazy)', async () => {
		const before = document.querySelectorAll('iframe').length;
		const stream = streamFor(specFor('1 + 1;'));
		// main() built the stream but must not have started the run: no iframe yet.
		expect(document.querySelectorAll('iframe').length).toBe(before);
		await stream[Symbol.asyncIterator]().next();
		expect(await stream.settled).toStrictEqual({ ended: 'clean' });
		expect(document.querySelectorAll('iframe').length).toBe(before);
	});

	it('canceling before any pull settles canceled without starting the backend', async () => {
		// The never-pulled .return() branch (Zero-cancel): a consumer builds the stream
		// then tears down before its first pull. The run never starts — no iframe.
		const before = document.querySelectorAll('iframe').length;
		const stream = streamFor(specFor('1 + 1;'));
		await stream[Symbol.asyncIterator]().return?.();
		expect(await stream.settled).toStrictEqual({ ended: 'canceled' });
		expect(document.querySelectorAll('iframe').length).toBe(before);
	});

	it('a pull after cancel does not start a fresh run (torndown latch)', async () => {
		const before = document.querySelectorAll('iframe').length;
		const stream = streamFor(specFor('1 + 1;'));
		const iterator = stream[Symbol.asyncIterator]();
		await iterator.return?.(); // cancel before any pull
		const late = iterator.next(); // a misbehaving late pull
		// Synchronously after the late pull: no fresh run started (no iframe created).
		expect(document.querySelectorAll('iframe').length).toBe(before);
		expect(await stream.settled).toStrictEqual({ ended: 'canceled' });
		await late;
	});

	it('canceling a LIVE run via manual iteration settles canceled promptly', async () => {
		// The load-bearing hand-rolled-iterator behavior: .next() (unawaited) starts the
		// run; .return() while it is in flight cancels OUT OF BAND (an async generator's
		// .return() would queue behind the pull). A never-settling module await keeps the
		// run live so the cancel — not a natural end or a timeout — is what settles it.
		const stream = streamFor(specFor('await new Promise(() => {});', 'module'));
		const iterator = stream[Symbol.asyncIterator]();
		const startedAt = performance.now();
		const pull = iterator.next(); // UNAWAITED — starts the run
		void iterator.return?.(); // cancel while the pull is in flight
		expect(await stream.settled).toStrictEqual({ ended: 'canceled' });
		// Promptly: well under the backend's 5s wall-clock default — proving the cancel
		// (not the timeout) settled it, and that .return() did not queue behind the pull.
		expect(performance.now() - startedAt).toBeLessThan(2000);
		await pull; // the in-flight pull also completes
	});

	it('emits no events — the first pull completes immediately (done)', async () => {
		const stream = streamFor(specFor('1 + 1;'));
		const first = await stream[Symbol.asyncIterator]().next();
		expect(first.done).toBe(true);
		expect(await stream.settled).toStrictEqual({ ended: 'clean' });
	});
});
