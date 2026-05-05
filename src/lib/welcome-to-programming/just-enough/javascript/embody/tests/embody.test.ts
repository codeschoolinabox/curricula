import { describe, it, expect } from 'vitest';

import embody, { EMBODY_MOCK_SCENARIOS } from '../index.js';

describe('embody', () => {
	describe('EMBODY_MOCK_SCENARIOS export', () => {
		it('is a frozen array', () => {
			expect(Object.isFrozen(EMBODY_MOCK_SCENARIOS)).toBe(true);
		});

		it('lists exactly 11 scenarios', () => {
			expect(EMBODY_MOCK_SCENARIOS.length).toBe(11);
		});

		it('includes OK', () => {
			expect(EMBODY_MOCK_SCENARIOS).toContain('OK');
		});

		it('includes the three FAIL_AT_* stages', () => {
			expect(EMBODY_MOCK_SCENARIOS).toEqual(
				expect.arrayContaining([
					'FAIL_AT_TOKENIZE',
					'FAIL_AT_PARSE',
					'FAIL_AT_CREATE',
				]),
			);
		});

		it('includes the four EVAL_* outcomes', () => {
			expect(EMBODY_MOCK_SCENARIOS).toEqual(
				expect.arrayContaining([
					'EVAL_ERROR',
					'EVAL_TIMEOUT',
					'EVAL_LIMIT',
					'EVAL_CANCELLED',
				]),
			);
		});

		it('includes the apex overlays (VALIDATION_FAIL, NON_DETERMINISTIC, PAUSES)', () => {
			expect(EMBODY_MOCK_SCENARIOS).toEqual(
				expect.arrayContaining([
					'VALIDATION_FAIL',
					'NON_DETERMINISTIC',
					'PAUSES',
				]),
			);
		});
	});

	describe('OK', () => {
		it('returns status all true', () => {
			const s = embody('OK');
			expect(s.status).toEqual({ tokenized: true, parsed: true, created: true });
		});

		it('returns errors: null', () => {
			expect(embody('OK').errors).toBe(null);
		});

		it('returns parse.ast as a Program node', () => {
			expect(embody('OK').parse.ast?.type).toBe('Program');
		});

		it('returns parse.comments: []', () => {
			expect(embody('OK').parse.comments).toEqual([]);
		});

		it('returns static defined with shape-valid sub-objects', () => {
			expect(embody('OK').static).toMatchObject({
				realm: expect.objectContaining({
					intrinsics: expect.any(Object),
					host: expect.any(Object),
				}),
				initialScope: expect.objectContaining({ kind: 'script' }),
				bindings: expect.any(Array),
				dependencies: expect.any(Array),
				features: expect.objectContaining({ usesShortCircuit: false }),
				metrics: expect.objectContaining({ tokens: expect.any(Number) }),
				controlFlow: expect.objectContaining({ branches: expect.any(Array) }),
				nonDeterminism: expect.objectContaining({ random: false }),
				hasIo: expect.objectContaining({ total: 0 }),
			});
		});

		it('returns validation.isJeJ: true', () => {
			expect(embody('OK').validation.isJeJ).toBe(true);
		});

		it('returns validation.isDeterministic: true (no nonDeterminism)', () => {
			expect(embody('OK').validation.isDeterministic).toBe(true);
		});

		it('returns validation.doesPause: false (no IO)', () => {
			expect(embody('OK').validation.doesPause).toBe(false);
		});

		it('returns validation.violations: []', () => {
			expect(embody('OK').validation.violations).toEqual([]);
		});

		it('exposes streams.evaluate', () => {
			expect(embody('OK').streams.evaluate).toBeDefined();
		});

		it('streams.evaluate.run() resolves to RunInstance with outcome completed', async () => {
			const ri = await embody('OK').streams.evaluate!.run();
			expect(ri.endReport.outcome).toBe('completed');
		});

		it('streams.evaluate.run() resolves to RunInstance with ok: true', async () => {
			const ri = await embody('OK').streams.evaluate!.run();
			expect(ri.endReport.ok).toBe(true);
		});

		it('streams.evaluate.run() resolved RunInstance has events: []', async () => {
			const ri = await embody('OK').streams.evaluate!.run();
			expect(ri.events).toEqual([]);
		});

		it('back-ref RunInstance.snippet === embodiment (identity)', async () => {
			const s = embody('OK');
			const ri = await s.streams.evaluate!.run();
			expect(ri.snippet).toBe(s);
		});

		it('returns a frozen Snippet (top-level)', () => {
			expect(Object.isFrozen(embody('OK'))).toBe(true);
		});
	});

	describe('FAIL_AT_TOKENIZE', () => {
		it('returns status all false', () => {
			expect(embody('FAIL_AT_TOKENIZE').status).toEqual({
				tokenized: false,
				parsed: false,
				created: false,
			});
		});

		it('returns errors.phase: parse:tokenize', () => {
			expect(embody('FAIL_AT_TOKENIZE').errors!.phase).toBe('parse:tokenize');
		});

		it('returns errors.message identifying the mock', () => {
			expect(embody('FAIL_AT_TOKENIZE').errors!.message).toMatch(/mock/i);
		});

		it('returns parse.tokens: []', () => {
			expect(embody('FAIL_AT_TOKENIZE').parse.tokens).toEqual([]);
		});

		it('returns no parse.ast', () => {
			expect(embody('FAIL_AT_TOKENIZE').parse.ast).toBeUndefined();
		});

		it('returns no static (not parsed)', () => {
			expect(embody('FAIL_AT_TOKENIZE').static).toBeUndefined();
		});

		it('omits streams.evaluate (gate not passed)', () => {
			expect(embody('FAIL_AT_TOKENIZE').streams.evaluate).toBeUndefined();
		});

		it('exposes streams.realm and streams.parse.tokenize', () => {
			const s = embody('FAIL_AT_TOKENIZE');
			expect(typeof s.streams.realm).toBe('function');
			expect(typeof s.streams.parse?.tokenize).toBe('function');
		});

		it('returns a frozen Snippet', () => {
			expect(Object.isFrozen(embody('FAIL_AT_TOKENIZE'))).toBe(true);
		});
	});

	describe('FAIL_AT_PARSE', () => {
		it('returns tokenized: true, parsed: false, created: false', () => {
			expect(embody('FAIL_AT_PARSE').status).toEqual({
				tokenized: true,
				parsed: false,
				created: false,
			});
		});

		it('returns errors.phase: parse:ast', () => {
			expect(embody('FAIL_AT_PARSE').errors!.phase).toBe('parse:ast');
		});

		it('returns parse.tokens populated (length > 0)', () => {
			expect(embody('FAIL_AT_PARSE').parse.tokens!.length).toBeGreaterThan(0);
		});

		it('returns no parse.ast (parse failed)', () => {
			expect(embody('FAIL_AT_PARSE').parse.ast).toBeUndefined();
		});

		it('returns no static (parse failed)', () => {
			expect(embody('FAIL_AT_PARSE').static).toBeUndefined();
		});

		it('omits streams.evaluate', () => {
			expect(embody('FAIL_AT_PARSE').streams.evaluate).toBeUndefined();
		});

		it('returns a frozen Snippet', () => {
			expect(Object.isFrozen(embody('FAIL_AT_PARSE'))).toBe(true);
		});
	});

	describe('FAIL_AT_CREATE', () => {
		it('returns tokenized: true, parsed: true, created: false', () => {
			expect(embody('FAIL_AT_CREATE').status).toEqual({
				tokenized: true,
				parsed: true,
				created: false,
			});
		});

		it('returns errors.phase: create', () => {
			expect(embody('FAIL_AT_CREATE').errors!.phase).toBe('create');
		});

		it('returns parse.ast populated (Program node)', () => {
			expect(embody('FAIL_AT_CREATE').parse.ast?.type).toBe('Program');
		});

		it('returns no static (creation failed)', () => {
			expect(embody('FAIL_AT_CREATE').static).toBeUndefined();
		});

		it('exposes streams.create', () => {
			expect(typeof embody('FAIL_AT_CREATE').streams.create).toBe('function');
		});

		it('omits streams.evaluate (creation gate not passed)', () => {
			expect(embody('FAIL_AT_CREATE').streams.evaluate).toBeUndefined();
		});

		it('returns a frozen Snippet', () => {
			expect(Object.isFrozen(embody('FAIL_AT_CREATE'))).toBe(true);
		});
	});

	describe('VALIDATION_FAIL', () => {
		it('returns apex status (all true)', () => {
			expect(embody('VALIDATION_FAIL').status).toEqual({
				tokenized: true,
				parsed: true,
				created: true,
			});
		});

		it('returns validation.isJeJ: false', () => {
			expect(embody('VALIDATION_FAIL').validation.isJeJ).toBe(false);
		});

		it('returns at least one violation', () => {
			expect(
				embody('VALIDATION_FAIL').validation.violations.length,
			).toBeGreaterThan(0);
		});

		it('first violation has shape-valid Violation fields', () => {
			expect(embody('VALIDATION_FAIL').validation.violations[0]).toMatchObject({
				kind: expect.any(String),
				message: expect.any(String),
				nodePath: expect.any(String),
				loc: expect.objectContaining({
					start: expect.any(Object),
					end: expect.any(Object),
				}),
			});
		});

		it('returns errors: null (validation is metadata, not an error gate)', () => {
			expect(embody('VALIDATION_FAIL').errors).toBe(null);
		});

		it('streams.evaluate is exposed (apex status)', () => {
			expect(embody('VALIDATION_FAIL').streams.evaluate).toBeDefined();
		});

		it('returns a frozen Snippet', () => {
			expect(Object.isFrozen(embody('VALIDATION_FAIL'))).toBe(true);
		});
	});

	describe('NON_DETERMINISTIC', () => {
		it('returns apex status', () => {
			expect(embody('NON_DETERMINISTIC').status.created).toBe(true);
		});

		it('returns static.nonDeterminism.random: true', () => {
			expect(embody('NON_DETERMINISTIC').static!.nonDeterminism.random).toBe(
				true,
			);
		});

		it('derives validation.isDeterministic: false', () => {
			expect(embody('NON_DETERMINISTIC').validation.isDeterministic).toBe(false);
		});

		it('keeps validation.isJeJ: true', () => {
			expect(embody('NON_DETERMINISTIC').validation.isJeJ).toBe(true);
		});

		it('returns a frozen Snippet', () => {
			expect(Object.isFrozen(embody('NON_DETERMINISTIC'))).toBe(true);
		});
	});

	describe('PAUSES', () => {
		it('returns apex status', () => {
			expect(embody('PAUSES').status.created).toBe(true);
		});

		it('returns static.hasIo.user.total: 1', () => {
			expect(embody('PAUSES').static!.hasIo.user.total).toBe(1);
		});

		it('derives validation.doesPause: true', () => {
			expect(embody('PAUSES').validation.doesPause).toBe(true);
		});

		it('keeps validation.isJeJ: true', () => {
			expect(embody('PAUSES').validation.isJeJ).toBe(true);
		});

		it('returns a frozen Snippet', () => {
			expect(Object.isFrozen(embody('PAUSES'))).toBe(true);
		});
	});

	describe('EVAL_ERROR', () => {
		it('returns apex status', () => {
			expect(embody('EVAL_ERROR').status.created).toBe(true);
		});

		it('streams.evaluate.run() resolves with endReport.ok: false', async () => {
			const ri = await embody('EVAL_ERROR').streams.evaluate!.run();
			expect(ri.endReport.ok).toBe(false);
		});

		it('streams.evaluate.run() resolves with outcome: errored', async () => {
			const ri = await embody('EVAL_ERROR').streams.evaluate!.run();
			expect(ri.endReport.outcome).toBe('errored');
		});

		it('streams.evaluate.run() resolves with endReport.error.phase: evaluate', async () => {
			const ri = await embody('EVAL_ERROR').streams.evaluate!.run();
			expect(ri.endReport.error?.phase).toBe('evaluate');
		});

		it('Snippet-level errors stays null (errors gate is pre-evaluation)', () => {
			expect(embody('EVAL_ERROR').errors).toBe(null);
		});
	});

	describe('EVAL_TIMEOUT', () => {
		it('streams.evaluate.run() resolves with outcome: timed-out', async () => {
			const ri = await embody('EVAL_TIMEOUT').streams.evaluate!.run();
			expect(ri.endReport.outcome).toBe('timed-out');
		});

		it('streams.evaluate.run() resolves with endReport.ok: false', async () => {
			const ri = await embody('EVAL_TIMEOUT').streams.evaluate!.run();
			expect(ri.endReport.ok).toBe(false);
		});
	});

	describe('EVAL_LIMIT', () => {
		it('streams.evaluate.run() resolves with outcome: limit-exceeded', async () => {
			const ri = await embody('EVAL_LIMIT').streams.evaluate!.run();
			expect(ri.endReport.outcome).toBe('limit-exceeded');
		});

		it('streams.evaluate.run() resolves with endReport.ok: false', async () => {
			const ri = await embody('EVAL_LIMIT').streams.evaluate!.run();
			expect(ri.endReport.ok).toBe(false);
		});
	});

	describe('EVAL_CANCELLED', () => {
		it('streams.evaluate.run() resolves with outcome: cancelled', async () => {
			const ri = await embody('EVAL_CANCELLED').streams.evaluate!.run();
			expect(ri.endReport.outcome).toBe('cancelled');
		});

		it('streams.evaluate.run() resolves with endReport.ok: false', async () => {
			const ri = await embody('EVAL_CANCELLED').streams.evaluate!.run();
			expect(ri.endReport.ok).toBe(false);
		});
	});

	describe('streams.evaluate.intercept and trace.* (apex modes)', () => {
		it('intercept returns an EvaluateHandle with .result and .cancel', () => {
			const handle = embody('OK').streams.evaluate!.intercept();
			expect(handle.result).toBeInstanceOf(Promise);
			expect(typeof handle.cancel).toBe('function');
		});

		it('intercept async-iterates zero events', async () => {
			const handle = embody('OK').streams.evaluate!.intercept();
			const collected: unknown[] = [];
			for await (const event of handle) {
				collected.push(event);
			}
			expect(collected).toEqual([]);
		});

		it('cancel() returns undefined (no-op)', () => {
			const handle = embody('OK').streams.evaluate!.intercept();
			expect(handle.cancel()).toBeUndefined();
		});

		it('intercept .result resolves to the same canned RunInstance run() returns', async () => {
			const s = embody('OK');
			const handleResult = await s.streams.evaluate!.intercept().result;
			const runResult = await s.streams.evaluate!.run();
			expect(handleResult).toBe(runResult);
		});

		it('trace.syntax returns a shape-conformant EvaluateHandle', () => {
			expect(embody('OK').streams.evaluate!.trace.syntax()).toMatchObject({
				result: expect.any(Promise),
				cancel: expect.any(Function),
			});
		});

		it('trace.semantics returns a shape-conformant EvaluateHandle', () => {
			expect(embody('OK').streams.evaluate!.trace.semantics()).toMatchObject({
				result: expect.any(Promise),
				cancel: expect.any(Function),
			});
		});
	});

	describe('unknown sentinel handling', () => {
		it('throws on unknown string input', () => {
			expect(() => embody('FOO')).toThrow();
		});

		it('throws on empty string', () => {
			expect(() => embody('')).toThrow();
		});

		it('throws on whitespace-only input', () => {
			expect(() => embody('   ')).toThrow();
		});

		it('throws on a known sentinel with trailing newline', () => {
			expect(() => embody('OK\n')).toThrow();
		});

		it('throws on a sentinel as substring', () => {
			expect(() => embody('// OK in a comment')).toThrow();
		});

		it('throws on a real-looking JS source string', () => {
			expect(() => embody('let x = 1;')).toThrow();
		});

		it('throws on prototype-chain names (toString, __proto__, constructor)', () => {
			expect(() => embody('toString')).toThrow();
			expect(() => embody('__proto__')).toThrow();
			expect(() => embody('constructor')).toThrow();
		});

		it('error message names the unknown input', () => {
			expect(() => embody('FOO')).toThrow(/FOO/);
		});

		it('error message lists the expected scenarios', () => {
			expect(() => embody('FOO')).toThrow(/Expected one of/);
		});
	});

	describe('deep-freeze invariants (cross-mode)', () => {
		// Walk every reachable plain-object property and assert each is frozen.
		// Skips functions (the @utils/deep-freeze-in-place utility does not
		// freeze functions; their internals are opaque to Object.freeze
		// anyway and the public surface contract is "data is frozen,
		// generators are pure").
		function assertDeepFrozen(value: unknown, path: string, visited: Set<object>): void {
			if (value === null || typeof value !== 'object') {
				return;
			}
			if (visited.has(value)) {
				return;
			}
			visited.add(value);
			expect(Object.isFrozen(value)).toBe(true);
			for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
				assertDeepFrozen(child, `${path}.${key}`, visited);
			}
		}

		for (const scenario of EMBODY_MOCK_SCENARIOS) {
			it(`${scenario}: Snippet is recursively frozen`, () => {
				assertDeepFrozen(embody(scenario), scenario, new Set());
			});
		}

		it('mutating snippet.status throws in strict mode', () => {
			const s = embody('OK');
			expect(() => {
				(s as { status: unknown }).status = {
					tokenized: false,
					parsed: false,
					created: false,
				};
			}).toThrow();
		});

		it('mutating snippet.parse.tokens throws in strict mode', () => {
			const s = embody('OK');
			expect(() => {
				(s.parse as { tokens: unknown[] }).tokens = [];
			}).toThrow();
		});

		it('apex modes: runInstance is frozen', async () => {
			const apexModes = [
				'OK',
				'VALIDATION_FAIL',
				'NON_DETERMINISTIC',
				'PAUSES',
				'EVAL_ERROR',
				'EVAL_TIMEOUT',
				'EVAL_LIMIT',
				'EVAL_CANCELLED',
			] as const;
			for (const mode of apexModes) {
				const ri = await embody(mode).streams.evaluate!.run();
				expect(Object.isFrozen(ri)).toBe(true);
			}
		});

		it('cycle freeze does not stack-overflow (back-ref reaches itself)', async () => {
			const s = embody('OK');
			const ri = await s.streams.evaluate!.run();
			// Reaching this assertion means the cycle was traversed safely
			// during construction-time freeze.
			expect(ri.snippet.streams.evaluate).toBeDefined();
		});
	});
});
