import { describe, expect, it } from 'vitest';

import createFakeTransport from '../../../../../../study-lenses/lib/engine/testing/fake-transport.js';
import type {
	CreateTransport,
	TransportInit,
} from '../../../../../../study-lenses/lib/engine/worker/types.js';
import traceVariables from '../trace-variables.js';
import type { InstrumentBoundaryError, VariablesTraceEvent } from '../types.js';
import variablesThreadLogic from '../variables-thread-logic.js';
import variablesWorkerSetup from '../variables-worker-setup.js';

/**
 * The engine seam: a same-thread fake transport wired to THIS tier's real worker
 * setup + thread logic, so the facade runs the full validate → project →
 * instrument → engine pipeline without spawning a Worker (the browser smoke test
 * covers the real Worker). The fake structured-clones payloads, so a clone-safety
 * regression surfaces here too.
 */
function fakeTransport(): CreateTransport {
	return createFakeTransport(variablesWorkerSetup, variablesThreadLogic);
}

/** A fake transport that records the `TransportInit` the facade assembled. */
function capturingTransport(inits: TransportInit[]): CreateTransport {
	const inner = fakeTransport();
	return () => {
		const transport = inner();
		return {
			...transport,
			start(init: TransportInit): Promise<void> {
				inits.push(init);
				return transport.start(init);
			},
		};
	};
}

const eventTypes = (
	events: readonly VariablesTraceEvent[],
): readonly string[] => events.map((event) => event.event);

describe('traceVariables', () => {
	describe('admission throws synchronously at the call (never builds a handle)', () => {
		it('throws on unparseable input (the parse gate)', () => {
			expect(() => traceVariables('@@@')).toThrow(/not valid JavaScript/u);
		});

		it('throws on a non-JEJ construct (the violation gate)', () => {
			expect(() => traceVariables('var x = 1;')).toThrow(
				/not Just-Enough-JavaScript/u,
			);
		});

		it('throws a typed boundary error on a construct the instrumenter rejects', () => {
			let caught: unknown;
			try {
				traceVariables('foo: for (let i = 0; i < 1; i = i + 1) { break foo; }');
			} catch (error) {
				caught = error;
			}
			expect(
				(caught as InstrumentBoundaryError | undefined)?.instrumentBoundary,
			).toBe(true);
			expect((caught as InstrumentBoundaryError | undefined)?.reason).toBe(
				'labeled-statement',
			);
		});
	});

	describe('a runnable program streams events and settles', () => {
		it('streams a variable lifecycle and completes', async () => {
			const handle = traceVariables('let x = 1; x;', {}, fakeTransport());

			const { events, settlement } = await handle.result;

			expect(settlement.outcome).toBe('completed');
			expect(eventTypes(events)).toContain('scope-push');
			expect(eventTypes(events)).toContain('initialize');
			expect(eventTypes(events)).toContain('read');
			expect(settlement.halt).toStrictEqual({
				natural: true,
				errorName: '',
				message: '',
				nodePath: null,
			});
		});

		it('frames an empty program with just a script push and pop', async () => {
			const { events, settlement } = await traceVariables(
				'',
				{},
				fakeTransport(),
			).result;

			expect(settlement.outcome).toBe('completed');
			expect(eventTypes(events)).toStrictEqual(['scope-push', 'scope-pop']);
		});

		it('settles errored with an attributed halt on a const reassignment', async () => {
			const { settlement } = await traceVariables(
				'const c = 1; c = 2;',
				{},
				fakeTransport(),
			).result;

			expect(settlement.outcome).toBe('errored');
			expect(settlement.halt).toMatchObject({
				natural: false,
				errorName: 'TypeError',
			});
			expect(typeof settlement.halt?.nodePath).toBe('string');
			expect(settlement.engineError).toBeUndefined();
		});

		it('degrades a `with` program to an errored SyntaxError halt (a named boundary)', async () => {
			const handle = traceVariables(
				'with ({}) { let x = 1; }',
				{},
				fakeTransport(),
			);

			const { settlement } = await handle.result;

			expect(settlement.outcome).toBe('errored');
			expect(settlement.halt).toMatchObject({
				natural: false,
				errorName: 'SyntaxError',
				nodePath: null,
			});
			expect(settlement.engineError).toBeUndefined();
		});
	});

	describe('consumer-driven stops', () => {
		it('cancels on a break, keeping the events seen so far (no halt)', async () => {
			const handle = traceVariables(
				'let a = 1; let b = 2; let c = 3;',
				{},
				fakeTransport(),
			);

			const seen: string[] = [];
			for await (const event of handle) {
				seen.push(event.event);
				break;
			}
			const { events, settlement } = await handle.result;

			expect(seen).toHaveLength(1);
			expect(settlement.outcome).toBe('cancelled');
			expect(events).toHaveLength(1);
			expect(settlement.halt).toBeNull();
		});

		it('cancels before any pull', async () => {
			const handle = traceVariables('let a = 1;', {}, fakeTransport());
			handle.cancel();

			const { settlement } = await handle.result;

			expect(settlement.outcome).toBe('cancelled');
			expect(settlement.halt).toBeNull();
		});

		it('fails with the reason passed through by reference', async () => {
			const handle = traceVariables('let a = 1;', {}, fakeTransport());
			const reason = { quizId: 7 };
			handle.fail(reason);

			const { settlement } = await handle.result;

			expect(settlement.outcome).toBe('failed');
			expect(settlement.failReason).toBe(reason);
			expect(settlement.halt).toBeNull();
		});
	});

	describe('engine spec assembly', () => {
		it('hands the engine the instrumented code, the scope table, and strict mode', async () => {
			const inits: TransportInit[] = [];

			await traceVariables('let x = 1;', {}, capturingTransport(inits)).result;

			expect(inits).toHaveLength(1);
			const init = inits[0];
			expect(init?.code).toContain('__$vr.open');
			expect(init?.workerConfig).toHaveProperty('$');
			expect(init?.strict).toBe(true);
		});
	});
});
