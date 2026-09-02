/**
 * Real-transport-only evidence: the `execution: 'script'` path end to end
 * through evaluate() — a genuine Script Record delivered by
 * `importScripts`, globals delivered on globalThis, and the setup-time
 * capability probe. The fake runs `new Function` whatever the spec says
 * and cannot reproduce Script semantics, so a green fake says nothing
 * about these rows.
 *
 * SEVENTEEN ROWS ARE COMMITTED SKIPPED, and they split two ways. The
 * thirteen that RUN a script wait on the classic-worker test tier: only a
 * classic worker can call `importScripts`, and this project's workers are
 * module workers. The four probe rows wait on nothing but Phase 1 — they
 * need a host that REFUSES scripts, which is exactly the tier that exists
 * today, so un-skipping them proves the execution path reaches setup at
 * all. That makes them the cheapest first increment and the self-catching
 * check on `SetupMessage.execution`, a field no compiler enforces at its
 * construction site.
 *
 * The one live row measures the platform fact the probe rests on, and it
 * runs on today's tier precisely because today's tier is the mismatching
 * one.
 *
 * When the classic tier lands, `scriptRun` below is the only thing that
 * changes: every script-running row goes through it, and none of them
 * names a worker entry, a bundling strategy, or a tier-specific path.
 */

import { describe, expect, it } from 'vitest';

import evaluate from '../../../evaluate.js';
import REFERENCE_THREAD_LOGIC from '../../../testing/reference-thread-logic.js';
import type { EvaluateSpec, HaltPhase } from '../../../types.js';

function scriptRun(code: string, overrides: Partial<EvaluateSpec> = {}) {
	const spec: EvaluateSpec = {
		code,
		// Inline `new Worker(new URL(...))` — keep the adjacency webpack needs.
		// The classic-worker tier replaces THIS EXPRESSION and nothing else.
		workerFactory: () =>
			new Worker(
				new URL('../../../testing/test-worker-entry.ts', import.meta.url),
				{ type: 'module' },
			),
		threadLogic: REFERENCE_THREAD_LOGIC,
		execution: 'script',
		...overrides,
	};
	return evaluate(spec);
}

function moduleRun(code: string) {
	const spec: EvaluateSpec = {
		code,
		workerFactory: () =>
			new Worker(
				new URL('../../../testing/test-worker-entry.ts', import.meta.url),
				{ type: 'module' },
			),
		threadLogic: REFERENCE_THREAD_LOGIC,
		execution: 'module',
	};
	return evaluate(spec);
}

describe('script execution (real transport)', () => {
	it('a module worker exposes importScripts and throws when it is called', async () => {
		const handle = moduleRun(
			"emit(typeof importScripts);try{importScripts('data:text/javascript,');emit('called')}catch(error){emit(error.constructor.name)}",
		);
		const { items } = await handle.result;

		expect(items).toEqual(['function', 'TypeError']);
	});

	it.skip('posts a natural-end halt for an empty script', async () => {
		const handle = scriptRun('');
		const { settlement } = await handle.result;

		expect(settlement.outcome).toBe('completed');
	});

	it.skip('lets a top-level var reach globalThis', async () => {
		const handle = scriptRun('var reached = 1;emit(globalThis.reached);');
		const { items } = await handle.result;

		expect(items).toEqual([1]);
	});

	it.skip('gives top-level this as globalThis', async () => {
		const handle = scriptRun('emit(this === globalThis);');
		const { items } = await handle.result;

		expect(items).toEqual([true]);
	});

	it.skip('gives a script no arguments binding', async () => {
		const handle = scriptRun(
			"try{arguments;emit('bound')}catch(error){emit(error.constructor.name)}",
		);
		const { items } = await handle.result;

		expect(items).toEqual(['ReferenceError']);
	});

	it.skip('runs a program whose first line is a hashbang', async () => {
		const handle = scriptRun('#!/usr/bin/env node\nemit(1);');
		const { items } = await handle.result;

		expect(items).toEqual([1]);
	});

	it.skip('delivers the injected globals on globalThis', async () => {
		const handle = scriptRun('emit(typeof globalThis.emit);');
		const { items } = await handle.result;

		expect(items).toEqual(['function']);
	});

	it.skip('runs sloppy despite the strict default', async () => {
		const handle = scriptRun('undeclared = 1;emit(globalThis.undeclared);', {
			strict: true,
		});
		const { items } = await handle.result;

		expect(items).toEqual([1]);
	});

	it.skip('carries a runtime throw to the halt author as an evaluation phase', async () => {
		const handle = scriptRun("throw new TypeError('boom');");
		const { settlement } = await handle.result;

		expect((settlement.halt as { phase?: HaltPhase }).phase).toBe('evaluation');
	});

	it.skip('stamps the worker as the author of a runtime throw', async () => {
		const handle = scriptRun("throw new TypeError('boom');");
		const { settlement } = await handle.result;

		expect(settlement.haltOrigin).toBe('worker');
	});

	it.skip('settles errored when the script throws', async () => {
		const handle = scriptRun("throw new TypeError('boom');");
		const { settlement } = await handle.result;

		expect([
			settlement.outcome,
			(settlement.halt as { name: string }).name,
		]).toEqual(['errored', 'TypeError']);
	});

	it.skip('settles errored when a script throws after emitting', async () => {
		const handle = scriptRun("emit(1);throw new Error('boom');");
		const { items, settlement } = await handle.result;

		expect([items, settlement.outcome]).toEqual([[1], 'errored']);
	});

	it.skip('names the offending global when one cannot install on globalThis', async () => {
		const handle = scriptRun('', {
			workerConfig: { invalidGlobalKey: 'undefined' },
		});
		const { settlement } = await handle.result;

		expect(settlement.error?.message).toContain('undefined');
	});

	it.skip('lets a top-level var overwrite an injected global', async () => {
		const handle = scriptRun('var emit = 1;');
		const { settlement } = await handle.result;

		expect(settlement.outcome).toBe('completed');
	});
});

describe('the script capability probe (real transport)', () => {
	it.skip('settles worker-error when the host cannot run scripts', async () => {
		const handle = scriptRun('emit(1);');
		const { settlement } = await handle.result;

		expect([settlement.outcome, settlement.error?.cause]).toEqual([
			'errored',
			'worker-error',
		]);
	});

	it.skip('yields no items when the probe refuses the host', async () => {
		const handle = scriptRun('emit(1);');
		const { items } = await handle.result;

		expect(items).toEqual([]);
	});

	it.skip('does not fire the probe on the module path', async () => {
		const handle = moduleRun('emit(1);');
		const { settlement } = await handle.result;

		expect(settlement.outcome).toBe('completed');
	});

	it.skip('does not fire the probe on the function path', async () => {
		const handle = scriptRun('emit(1);', { execution: 'function' });
		const { settlement } = await handle.result;

		expect(settlement.outcome).toBe('completed');
	});
});
