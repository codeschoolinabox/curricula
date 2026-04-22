/**
 * @file Integration test — `createTracingGenerator` prep-failure wiring.
 *
 * Verifies that `createTracingGenerator` correctly calls `prepareForTrace`
 * as its first step and catches every prep-failure mode into a well-formed
 * failure `TraceResult` — **without** throwing synchronously and **without**
 * reaching `instrument()` or spawning a Worker.
 *
 * Node-level test. The prep-failure path short-circuits before the Worker
 * spawn, so there's no browser or baseline-red dependency. This test only
 * exercises the try/catch I added at the top of `createTracingGenerator`
 * around the `prepareForTrace` call.
 *
 * ZOMBIES ordered: Zero → One → Many → Boundaries → Interfaces → Exceptions → Simple.
 *
 * The critical assertion pattern is:
 *   const gen = createTracingGenerator(badInput, badConfig, null);
 *   const firstStep = await gen.next();
 *   expect(firstStep.done).toBe(true);
 *   expect(firstStep.value.ok).toBe(false);
 *   expect(firstStep.value.error.phase).toBe('creation');
 *
 * Meaning: "the generator returned a failure result on its first step,
 * without yielding any events, without throwing."
 */

import { describe, expect, it } from 'vitest';

import createTracingGenerator from '../index.js';

// ─── Zero: degenerate inputs ──────────────────────────────────

describe('createTracingGenerator prep failure — Zero', () => {
	it('returns failure when both code and config are undefined', async () => {
		const gen = createTracingGenerator(
			undefined as unknown as string,
			undefined,
			null,
		);
		const firstStep = await gen.next();
		expect(firstStep.done).toBe(true);
		expect(firstStep.value).toBeDefined();
		expect((firstStep.value as { ok: boolean }).ok).toBe(false);
	});

	it('returns failure when code is null', async () => {
		const gen = createTracingGenerator(
			null as unknown as string,
			undefined,
			null,
		);
		const firstStep = await gen.next();
		expect(firstStep.done).toBe(true);
		expect((firstStep.value as { ok: boolean }).ok).toBe(false);
	});
});

// ─── One: single wrong-type argument ───────────────────────────

describe('createTracingGenerator prep failure — One', () => {
	it('returns failure with "expected code to be a string" when code is a number', async () => {
		const gen = createTracingGenerator(42 as unknown as string, undefined, null);
		const firstStep = await gen.next();
		const result = firstStep.value as {
			ok: boolean;
			error: { message: string };
		};
		expect(result.ok).toBe(false);
		expect(result.error.message).toContain('expected code to be a string');
		expect(result.error.message).toContain('number');
	});

	it('returns failure with "got object" when code is an object', async () => {
		const gen = createTracingGenerator({} as unknown as string, undefined, null);
		const firstStep = await gen.next();
		const result = firstStep.value as {
			ok: boolean;
			error: { message: string };
		};
		expect(result.ok).toBe(false);
		expect(result.error.message).toContain('expected code to be a string');
		expect(result.error.message).toContain('object');
	});

	it('returns failure with "got boolean" when code is a boolean', async () => {
		const gen = createTracingGenerator(
			true as unknown as string,
			undefined,
			null,
		);
		const firstStep = await gen.next();
		const result = firstStep.value as {
			ok: boolean;
			error: { message: string };
		};
		expect(result.ok).toBe(false);
		expect(result.error.message).toContain('expected code to be a string');
		expect(result.error.message).toContain('boolean');
	});
});

// ─── Many: multiple wrong-type arguments ───────────────────────

describe('createTracingGenerator prep failure — Many', () => {
	it('returns failure when config is a string (not an object)', async () => {
		const gen = createTracingGenerator(
			'let x = 5;',
			'bogus' as unknown as undefined,
			null,
		);
		const firstStep = await gen.next();
		const result = firstStep.value as {
			ok: boolean;
			error: { message: string };
		};
		expect(result.ok).toBe(false);
		expect(result.error.message).toContain('expected config to be an object');
		expect(result.error.message).toContain('string');
	});

	it('returns failure when config is a number', async () => {
		const gen = createTracingGenerator(
			'let x = 5;',
			42 as unknown as undefined,
			null,
		);
		const firstStep = await gen.next();
		const result = firstStep.value as {
			ok: boolean;
			error: { message: string };
		};
		expect(result.ok).toBe(false);
		expect(result.error.message).toContain('expected config to be an object');
		expect(result.error.message).toContain('number');
	});
});

// ─── Boundaries: cross-field semantic validation ───────────────

describe('createTracingGenerator prep failure — Boundaries', () => {
	it('returns failure when range.start > range.end', async () => {
		const gen = createTracingGenerator(
			'let x = 5;',
			{ range: { start: 10, end: 5 } },
			null,
		);
		const firstStep = await gen.next();
		const result = firstStep.value as {
			ok: boolean;
			error: { message: string };
		};
		expect(result.ok).toBe(false);
		expect(result.error.message).toContain('range.start (10)');
		expect(result.error.message).toContain('range.end (5)');
	});

	it('returns failure when iterations is 0', async () => {
		const gen = createTracingGenerator(
			'let x = 5;',
			{ iterations: 0 },
			null,
		);
		const firstStep = await gen.next();
		const result = firstStep.value as {
			ok: boolean;
			error: { message: string };
		};
		expect(result.ok).toBe(false);
		expect(result.error.message).toContain('iterations (0)');
		expect(result.error.message).toContain('positive number');
	});

	it('returns failure when iterations is negative', async () => {
		const gen = createTracingGenerator(
			'let x = 5;',
			{ iterations: -1 },
			null,
		);
		const firstStep = await gen.next();
		const result = firstStep.value as {
			ok: boolean;
			error: { message: string };
		};
		expect(result.ok).toBe(false);
		expect(result.error.message).toContain('iterations (-1)');
	});

	it('returns failure when seconds is 0', async () => {
		const gen = createTracingGenerator('let x = 5;', { seconds: 0 }, null);
		const firstStep = await gen.next();
		const result = firstStep.value as {
			ok: boolean;
			error: { message: string };
		};
		expect(result.ok).toBe(false);
		expect(result.error.message).toContain('seconds (0)');
		expect(result.error.message).toContain('positive number');
	});

	it('returns failure when seconds is negative', async () => {
		const gen = createTracingGenerator('let x = 5;', { seconds: -1 }, null);
		const firstStep = await gen.next();
		const result = firstStep.value as {
			ok: boolean;
			error: { message: string };
		};
		expect(result.ok).toBe(false);
		expect(result.error.message).toContain('seconds (-1)');
	});
});

// ─── Interfaces: failure-result shape contract ─────────────────

describe('createTracingGenerator prep failure — Interfaces', () => {
	it('failure result has ok: false', async () => {
		const gen = createTracingGenerator(
			undefined as unknown as string,
			undefined,
			null,
		);
		const firstStep = await gen.next();
		const result = firstStep.value as { ok: boolean };
		expect(result.ok).toBe(false);
	});

	it('failure result has error.kind: "javascript"', async () => {
		const gen = createTracingGenerator(
			42 as unknown as string,
			undefined,
			null,
		);
		const firstStep = await gen.next();
		const result = firstStep.value as {
			error: { kind: string };
		};
		expect(result.error.kind).toBe('javascript');
	});

	it('failure result has error.phase: "creation"', async () => {
		const gen = createTracingGenerator(
			42 as unknown as string,
			undefined,
			null,
		);
		const firstStep = await gen.next();
		const result = firstStep.value as {
			error: { phase: string };
		};
		expect(result.error.phase).toBe('creation');
	});

	it('failure result has a non-empty error.name', async () => {
		const gen = createTracingGenerator(
			42 as unknown as string,
			undefined,
			null,
		);
		const firstStep = await gen.next();
		const result = firstStep.value as {
			error: { name: string };
		};
		expect(typeof result.error.name).toBe('string');
		expect(result.error.name.length).toBeGreaterThan(0);
	});

	it('failure result has a non-empty error.message', async () => {
		const gen = createTracingGenerator(
			42 as unknown as string,
			undefined,
			null,
		);
		const firstStep = await gen.next();
		const result = firstStep.value as {
			error: { message: string };
		};
		expect(typeof result.error.message).toBe('string');
		expect(result.error.message.length).toBeGreaterThan(0);
	});

	it('failure result has events as an empty array', async () => {
		const gen = createTracingGenerator(
			42 as unknown as string,
			undefined,
			null,
		);
		const firstStep = await gen.next();
		const result = firstStep.value as {
			events: unknown[];
		};
		expect(Array.isArray(result.events)).toBe(true);
		expect(result.events).toHaveLength(0);
	});

	it('failure result is returned via done:true, not yielded', async () => {
		const gen = createTracingGenerator(
			42 as unknown as string,
			undefined,
			null,
		);
		const firstStep = await gen.next();
		expect(firstStep.done).toBe(true);
	});
});

// ─── Exceptions: generator does not throw synchronously ───────

describe('createTracingGenerator prep failure — Exceptions', () => {
	it('does not throw synchronously when code is wrong type', () => {
		expect(() => {
			createTracingGenerator(42 as unknown as string, undefined, null);
		}).not.toThrow();
	});

	it('does not throw synchronously when config is wrong type', () => {
		expect(() => {
			createTracingGenerator(
				'let x = 5;',
				'bogus' as unknown as undefined,
				null,
			);
		}).not.toThrow();
	});

	it('.next() resolves (does not reject) on prep failure', async () => {
		const gen = createTracingGenerator(
			42 as unknown as string,
			undefined,
			null,
		);
		await expect(gen.next()).resolves.toBeDefined();
	});

	it('.next() resolves with ok:false on semantic violation', async () => {
		const gen = createTracingGenerator(
			'let x = 5;',
			{ iterations: -1 },
			null,
		);
		const step = await gen.next();
		expect((step.value as { ok: boolean }).ok).toBe(false);
	});
});

// ─── Simple: realistic JEJ-shaped failures ────────────────────

describe('createTracingGenerator prep failure — Simple', () => {
	it('returns failure for schema violation (resolve as unsupported string)', async () => {
		const gen = createTracingGenerator(
			'let x = 5;',
			{ options: { resolve: 'bogus' as unknown as boolean } },
			null,
		);
		const firstStep = await gen.next();
		const result = firstStep.value as {
			ok: boolean;
			error: { message: string };
		};
		expect(result.ok).toBe(false);
		expect(result.error.message).toContain('Options validation failed');
	});
});
