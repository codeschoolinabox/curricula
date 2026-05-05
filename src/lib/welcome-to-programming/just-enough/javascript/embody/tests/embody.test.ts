import { describe, it, expect } from 'vitest';

import embodyMock from '../embody-mock.js';
import embody from '../index.js';

describe('embody', () => {
	describe('empty-mode (code === "")', () => {
		it('returns a Snippet with status.tokenized: false', () => {
			expect(embody('').status.tokenized).toBe(false);
		});

		it('returns a Snippet with status.parsed: false', () => {
			expect(embody('').status.parsed).toBe(false);
		});

		it('returns a Snippet with status.created: false', () => {
			expect(embody('').status.created).toBe(false);
		});

		it('returns a Snippet with errors non-null', () => {
			expect(embody('').errors).not.toBeNull();
		});

		it('returns a Snippet with errors.phase: parse:tokenize', () => {
			expect(embody('').errors!.phase).toBe('parse:tokenize');
		});

		it('returns a Snippet with errors.kind: SyntaxError', () => {
			expect(embody('').errors!.kind).toBe('SyntaxError');
		});

		it('returns a Snippet with errors.message describing empty source', () => {
			expect(embody('').errors!.message).toMatch(/empty source/i);
		});

		it('returns a Snippet with errors.loc: null', () => {
			expect(embody('').errors!.loc).toBe(null);
		});

		it('returns a Snippet with source.code: ""', () => {
			expect(embody('').source.code).toBe('');
		});

		it('returns a Snippet with source.offsets: [0]', () => {
			expect(embody('').source.offsets).toEqual([0]);
		});

		it('returns a Snippet with parse.tokens: []', () => {
			expect(embody('').parse.tokens).toEqual([]);
		});

		it('returns a Snippet with no parse.ast', () => {
			expect(embody('').parse.ast).toBeUndefined();
		});

		it('returns a Snippet with no parse.comments', () => {
			expect(embody('').parse.comments).toBeUndefined();
		});

		it('returns a Snippet with no static', () => {
			expect(embody('').static).toBeUndefined();
		});

		it('returns a Snippet with validation.isJeJ: true', () => {
			expect(embody('').validation.isJeJ).toBe(true);
		});

		it('returns a Snippet with validation.isDeterministic: true', () => {
			expect(embody('').validation.isDeterministic).toBe(true);
		});

		it('returns a Snippet with validation.doesPause: false', () => {
			expect(embody('').validation.doesPause).toBe(false);
		});

		it('returns a Snippet with validation.formatted: true', () => {
			expect(embody('').validation.formatted).toBe(true);
		});

		it('returns a Snippet with validation.violations: []', () => {
			expect(embody('').validation.violations).toEqual([]);
		});

		it('exposes streams.realm as a callable function', () => {
			expect(typeof embody('').streams.realm).toBe('function');
		});

		it('streams.realm yields no events', () => {
			expect([...embody('').streams.realm()]).toEqual([]);
		});

		it('exposes streams.parse.tokenize as defined', () => {
			expect(embody('').streams.parse?.tokenize).toBeDefined();
		});

		it('streams.parse.tokenize yields no events', () => {
			const snippet = embody('');
			const gen = snippet.streams.parse!.tokenize();
			expect([...gen]).toEqual([]);
		});

		it('exposes streams.parse.parse as defined (structural; semantically guarded by status.parsed)', () => {
			expect(embody('').streams.parse?.parse).toBeDefined();
		});

		it('streams.parse.parse yields no events', () => {
			const snippet = embody('');
			const gen = snippet.streams.parse!.parse();
			expect([...gen]).toEqual([]);
		});

		it('returns a frozen Snippet (top-level)', () => {
			expect(Object.isFrozen(embody(''))).toBe(true);
		});
	});

	describe('parse-fail-sentinel mode', () => {
		const SENTINEL = '/' + '* MOCK_PARSE_FAIL *' + '/';

		it('returns a Snippet with status.tokenized: true', () => {
			expect(embody(SENTINEL).status.tokenized).toBe(true);
		});

		it('returns a Snippet with status.parsed: false', () => {
			expect(embody(SENTINEL).status.parsed).toBe(false);
		});

		it('returns a Snippet with status.created: false', () => {
			expect(embody(SENTINEL).status.created).toBe(false);
		});

		it('returns a Snippet with errors.phase: parse:ast', () => {
			expect(embody(SENTINEL).errors!.phase).toBe('parse:ast');
		});

		it('returns a Snippet with errors.kind: SyntaxError', () => {
			expect(embody(SENTINEL).errors!.kind).toBe('SyntaxError');
		});

		it('returns a Snippet with errors.message identifying the mock', () => {
			expect(embody(SENTINEL).errors!.message).toMatch(/mock/i);
		});

		it('returns a Snippet with errors.loc: null', () => {
			expect(embody(SENTINEL).errors!.loc).toBe(null);
		});

		it('returns a Snippet with source.code matching the sentinel', () => {
			expect(embody(SENTINEL).source.code).toBe(SENTINEL);
		});

		it('returns a Snippet with source.offsets: [0]', () => {
			expect(embody(SENTINEL).source.offsets).toEqual([0]);
		});

		it('returns a Snippet with parse.tokens populated (length > 0)', () => {
			expect(embody(SENTINEL).parse.tokens!.length).toBeGreaterThan(0);
		});

		it('parse.tokens[0] has the AugmentedToken shape', () => {
			const tok = embody(SENTINEL).parse.tokens![0];
			expect(tok).toMatchObject({
				type: expect.objectContaining({ label: expect.any(String) }),
				value: undefined,
				start: expect.any(Number),
				end: expect.any(Number),
				text: expect.any(String),
				index: 0,
				innermostNode: null,
				innermostPath: null,
				prevToken: null,
				nextToken: null,
				leadingGap: null,
			});
		});

		it('returns a Snippet with no parse.ast (parse failed)', () => {
			expect(embody(SENTINEL).parse.ast).toBeUndefined();
		});

		it('returns a Snippet with no static (parse failed)', () => {
			expect(embody(SENTINEL).static).toBeUndefined();
		});

		it('returns a Snippet with validation matching the non-happy shape', () => {
			expect(embody(SENTINEL).validation).toEqual({
				isJeJ: true,
				isDeterministic: true,
				doesPause: false,
				formatted: true,
				violations: [],
			});
		});

		it('streams.parse.parse yields no events (parse failed)', () => {
			expect([...embody(SENTINEL).streams.parse!.parse()]).toEqual([]);
		});

		it('returns a frozen Snippet (top-level)', () => {
			expect(Object.isFrozen(embody(SENTINEL))).toBe(true);
		});
	});

	describe('happy-mode (any non-empty, non-sentinel input)', () => {
		const CODE = 'let x = 1;';

		it('returns a Snippet with status.tokenized: true', () => {
			expect(embody(CODE).status.tokenized).toBe(true);
		});

		it('returns a Snippet with status.parsed: true', () => {
			expect(embody(CODE).status.parsed).toBe(true);
		});

		it('returns a Snippet with status.created: true', () => {
			expect(embody(CODE).status.created).toBe(true);
		});

		it('returns a Snippet with errors: null', () => {
			expect(embody(CODE).errors).toBe(null);
		});

		it('returns a Snippet with source.code matching the input', () => {
			expect(embody(CODE).source.code).toBe(CODE);
		});

		it('returns a Snippet with parse.tokens populated', () => {
			expect(embody(CODE).parse.tokens!.length).toBeGreaterThan(0);
		});

		it('returns a Snippet with parse.ast defined as a Program node', () => {
			expect(embody(CODE).parse.ast?.type).toBe('Program');
		});

		it('returns a Snippet with parse.ast.acornNode.body as an array', () => {
			const { ast } = embody(CODE).parse;
			expect(Array.isArray((ast?.acornNode as { body?: unknown }).body)).toBe(
				true,
			);
		});

		it('returns a Snippet with parse.comments: []', () => {
			expect(embody(CODE).parse.comments).toEqual([]);
		});

		it('returns a Snippet with static defined and shape-valid', () => {
			expect(embody(CODE).static).toMatchObject({
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

		it('exposes streams.create as a callable function', () => {
			expect(typeof embody(CODE).streams.create).toBe('function');
		});

		it('exposes streams.evaluate as defined', () => {
			expect(embody(CODE).streams.evaluate).toBeDefined();
		});

		it('exposes streams.evaluate.run as a callable function', () => {
			expect(typeof embody(CODE).streams.evaluate!.run).toBe('function');
		});

		it('exposes streams.evaluate.intercept as a callable function', () => {
			expect(typeof embody(CODE).streams.evaluate!.intercept).toBe('function');
		});

		it('exposes streams.evaluate.trace.syntax as a callable function', () => {
			expect(typeof embody(CODE).streams.evaluate!.trace.syntax).toBe(
				'function',
			);
		});

		it('exposes streams.evaluate.trace.semantics as a callable function', () => {
			expect(typeof embody(CODE).streams.evaluate!.trace.semantics).toBe(
				'function',
			);
		});

		it('returns a frozen Snippet (top-level)', () => {
			expect(Object.isFrozen(embody(CODE))).toBe(true);
		});
	});

	describe('happy-mode static.* enrichment (M2/M3/M4)', () => {
		const CODE = 'let x = 1;';

		describe('realm + host bindings (M2)', () => {
			it('static.realm.intrinsics includes Math', () => {
				expect(embody(CODE).static!.realm.intrinsics.Math).toMatchObject({
					name: 'Math',
					category: 'object-register',
					origin: 'ecma',
				});
			});

			it('static.realm.intrinsics includes parseInt as a function', () => {
				expect(embody(CODE).static!.realm.intrinsics.parseInt).toMatchObject({
					name: 'parseInt',
					category: 'function',
					origin: 'ecma',
				});
			});

			it('static.realm.intrinsics includes Infinity as a constant', () => {
				expect(embody(CODE).static!.realm.intrinsics.Infinity).toMatchObject({
					name: 'Infinity',
					category: 'constant',
					origin: 'ecma',
				});
			});

			it('static.realm.host includes console as object-register host', () => {
				expect(embody(CODE).static!.realm.host.console).toMatchObject({
					name: 'console',
					category: 'object-register',
					origin: 'host',
				});
			});

			it('static.realm.host includes alert as a host function', () => {
				expect(embody(CODE).static!.realm.host.alert).toMatchObject({
					name: 'alert',
					category: 'function',
					origin: 'host',
				});
			});

			it('static.initialScope.kind is "script"', () => {
				expect(embody(CODE).static!.initialScope.kind).toBe('script');
			});

			it('static.initialScope.outer is null', () => {
				expect(embody(CODE).static!.initialScope.outer).toBe(null);
			});

			it('static.initialScope.nodePath is "$"', () => {
				expect(embody(CODE).static!.initialScope.nodePath).toBe('$');
			});
		});

		describe('metrics derivation (M3)', () => {
			it('static.metrics.source.chars equals code.length', () => {
				expect(embody(CODE).static!.metrics.source.chars).toBe(CODE.length);
			});

			it('static.metrics.source.lines is 1 for single-line code', () => {
				expect(embody(CODE).static!.metrics.source.lines).toBe(1);
			});

			it('static.metrics.tokens equals parse.tokens.length', () => {
				const snippet = embody(CODE);
				expect(snippet.static!.metrics.tokens).toBe(snippet.parse.tokens!.length);
			});

			it('static.features.usesShortCircuit is false for non-feature code', () => {
				expect(embody(CODE).static!.features.usesShortCircuit).toBe(false);
			});

			it('static.dependencies is an empty array', () => {
				expect(embody(CODE).static!.dependencies).toEqual([]);
			});
		});

		describe('validation derivation + remaining static.* shape (M4)', () => {
			it('validation.isDeterministic = !any(static.nonDeterminism)', () => {
				const snippet = embody(CODE);
				const nd = snippet.static!.nonDeterminism;
				const expected = !(nd.random || nd.clock || nd.userInput || nd.locale);
				expect(snippet.validation.isDeterministic).toBe(expected);
			});

			it('validation.doesPause = (static.hasIo.user.total > 0)', () => {
				const snippet = embody(CODE);
				const expected = snippet.static!.hasIo.user.total > 0;
				expect(snippet.validation.doesPause).toBe(expected);
			});

			it('static.controlFlow.branches is an empty array', () => {
				expect(embody(CODE).static!.controlFlow.branches).toEqual([]);
			});

			it('static.controlFlow.breaks is an empty array', () => {
				expect(embody(CODE).static!.controlFlow.breaks).toEqual([]);
			});

			it('static.controlFlow.continues is an empty array', () => {
				expect(embody(CODE).static!.controlFlow.continues).toEqual([]);
			});

			it('static.nonDeterminism.random is false', () => {
				expect(embody(CODE).static!.nonDeterminism.random).toBe(false);
			});

			it('static.hasIo.total is 0 (no IO in stub)', () => {
				expect(embody(CODE).static!.hasIo.total).toBe(0);
			});

			it('static.bindings is an empty array', () => {
				expect(embody(CODE).static!.bindings).toEqual([]);
			});
		});
	});

	describe('happy-mode streams.evaluate.* (M5)', () => {
		const CODE = 'let x = 1;';

		describe('streams.evaluate.run', () => {
			it('returns a Promise (not a RunInstance directly)', () => {
				const result = embody(CODE).streams.evaluate!.run();
				expect(result).toBeInstanceOf(Promise);
			});

			it('resolves to a RunInstance with events: []', async () => {
				const ri = await embody(CODE).streams.evaluate!.run();
				expect(ri.events).toEqual([]);
			});

			it('resolves to a RunInstance with endReport.ok: true', async () => {
				const ri = await embody(CODE).streams.evaluate!.run();
				expect(ri.endReport.ok).toBe(true);
			});

			it('resolves to a RunInstance with endReport.error: null', async () => {
				const ri = await embody(CODE).streams.evaluate!.run();
				expect(ri.endReport.error).toBe(null);
			});

			it('resolves to a RunInstance with endReport.outcome: completed', async () => {
				const ri = await embody(CODE).streams.evaluate!.run();
				expect(ri.endReport.outcome).toBe('completed');
			});

			it('resolves to a RunInstance with finalEnvironment defined', async () => {
				const ri = await embody(CODE).streams.evaluate!.run();
				expect(ri.finalEnvironment).toBeDefined();
			});

			it('resolves to a RunInstance with runMetrics shape', async () => {
				const ri = await embody(CODE).streams.evaluate!.run();
				expect(ri.runMetrics).toEqual({
					steps: 0,
					durationMs: 0,
					iterationCount: 0,
				});
			});

			it('back-ref RunInstance.snippet === the embodiment (identity)', async () => {
				const snippet = embody(CODE);
				const ri = await snippet.streams.evaluate!.run();
				expect(ri.snippet).toBe(snippet);
			});

			it('resolved RunInstance is frozen', async () => {
				const ri = await embody(CODE).streams.evaluate!.run();
				expect(Object.isFrozen(ri)).toBe(true);
			});
		});

		describe('streams.evaluate.intercept', () => {
			it('returns an EvaluateHandle (synchronously, not a Promise)', () => {
				const handle = embody(CODE).streams.evaluate!.intercept();
				expect(handle).not.toBeInstanceOf(Promise);
			});

			it('exposes .result as a Promise<RunInstance>', () => {
				const handle = embody(CODE).streams.evaluate!.intercept();
				expect(handle.result).toBeInstanceOf(Promise);
			});

			it('exposes .cancel as a callable function', () => {
				const handle = embody(CODE).streams.evaluate!.intercept();
				expect(typeof handle.cancel).toBe('function');
			});

			it('async-iterates zero events and completes immediately', async () => {
				const handle = embody(CODE).streams.evaluate!.intercept();
				const collected: unknown[] = [];
				for await (const event of handle) {
					collected.push(event);
				}
				expect(collected).toEqual([]);
			});

			it('.cancel() is a no-op (returns undefined)', () => {
				const handle = embody(CODE).streams.evaluate!.intercept();
				expect(handle.cancel()).toBeUndefined();
			});

			it('.result resolves to the same canned RunInstance run() returns', async () => {
				const snippet = embody(CODE);
				const handleResult = await snippet.streams.evaluate!.intercept().result;
				const runResult = await snippet.streams.evaluate!.run();
				expect(handleResult).toBe(runResult);
			});
		});

		describe('streams.evaluate.trace.{syntax, semantics}', () => {
			it('trace.syntax returns an EvaluateHandle', () => {
				const handle = embody(CODE).streams.evaluate!.trace.syntax();
				expect(handle).toMatchObject({
					result: expect.any(Promise),
					cancel: expect.any(Function),
				});
			});

			it('trace.semantics returns an EvaluateHandle', () => {
				const handle = embody(CODE).streams.evaluate!.trace.semantics();
				expect(handle).toMatchObject({
					result: expect.any(Promise),
					cancel: expect.any(Function),
				});
			});

			it('trace.syntax async-iterates zero events', async () => {
				const handle = embody(CODE).streams.evaluate!.trace.syntax();
				const collected: unknown[] = [];
				for await (const event of handle) {
					collected.push(event);
				}
				expect(collected).toEqual([]);
			});

			it('trace.semantics async-iterates zero events', async () => {
				const handle = embody(CODE).streams.evaluate!.trace.semantics();
				const collected: unknown[] = [];
				for await (const event of handle) {
					collected.push(event);
				}
				expect(collected).toEqual([]);
			});
		});
	});

	describe('create-fail-sentinel mode', () => {
		const SENTINEL = '/' + '* MOCK_CREATE_FAIL *' + '/';

		it('returns a Snippet with status.tokenized: true', () => {
			expect(embody(SENTINEL).status.tokenized).toBe(true);
		});

		it('returns a Snippet with status.parsed: true', () => {
			expect(embody(SENTINEL).status.parsed).toBe(true);
		});

		it('returns a Snippet with status.created: false', () => {
			expect(embody(SENTINEL).status.created).toBe(false);
		});

		it('returns a Snippet with errors.phase: create', () => {
			expect(embody(SENTINEL).errors!.phase).toBe('create');
		});

		it('returns a Snippet with errors.message identifying the mock', () => {
			expect(embody(SENTINEL).errors!.message).toMatch(/mock/i);
		});

		it('returns a Snippet with parse.ast defined (parse succeeded)', () => {
			expect(embody(SENTINEL).parse.ast?.type).toBe('Program');
		});

		it('returns a Snippet with parse.comments: []', () => {
			expect(embody(SENTINEL).parse.comments).toEqual([]);
		});

		it('returns a Snippet with no static (creation failed)', () => {
			expect(embody(SENTINEL).static).toBeUndefined();
		});

		it('exposes streams.create as callable (creation-stream stub)', () => {
			expect(typeof embody(SENTINEL).streams.create).toBe('function');
		});

		it('streams.create yields no events', () => {
			expect([...embody(SENTINEL).streams.create!()]).toEqual([]);
		});

		it('omits streams.evaluate (creation gate not passed)', () => {
			expect(embody(SENTINEL).streams.evaluate).toBeUndefined();
		});

		it('returns a frozen Snippet (top-level)', () => {
			expect(Object.isFrozen(embody(SENTINEL))).toBe(true);
		});
	});

	describe('discriminator-boundary edges (B)', () => {
		it('whitespace-only input is happy-mode (not empty-mode)', () => {
			expect(embody('   ').status.tokenized).toBe(true);
		});

		it('newline-only input is happy-mode', () => {
			expect(embody('\n').status.tokenized).toBe(true);
		});

		it('parse-fail sentinel with trailing newline is happy-mode (not parse-fail)', () => {
			const code = '/' + '* MOCK_PARSE_FAIL *' + '/' + '\n';
			expect(embody(code).status.parsed).toBe(true);
		});

		it('parse-fail sentinel as substring is happy-mode', () => {
			const code = '// ' + '/' + '* MOCK_PARSE_FAIL *' + '/' + ' in a string';
			expect(embody(code).status.parsed).toBe(true);
		});

		it('create-fail sentinel with trailing space is happy-mode (not create-fail)', () => {
			const code = '/' + '* MOCK_CREATE_FAIL *' + '/' + ' ';
			expect(embody(code).status.created).toBe(true);
		});

		it('exact-match parse-fail sentinel triggers parse-fail', () => {
			const code = '/' + '* MOCK_PARSE_FAIL *' + '/';
			expect(embody(code).status.parsed).toBe(false);
		});

		it('exact-match create-fail sentinel triggers create-fail', () => {
			const code = '/' + '* MOCK_CREATE_FAIL *' + '/';
			expect(embody(code).status.created).toBe(false);
		});
	});

	describe('deep-freeze invariants (I)', () => {
		const HAPPY = 'let x = 1;';
		const PARSE_FAIL = '/' + '* MOCK_PARSE_FAIL *' + '/';
		const CREATE_FAIL = '/' + '* MOCK_CREATE_FAIL *' + '/';

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

		it('empty-mode Snippet is recursively frozen', () => {
			assertDeepFrozen(embody(''), 'snippet', new Set());
		});

		it('parse-fail-mode Snippet is recursively frozen', () => {
			assertDeepFrozen(embody(PARSE_FAIL), 'snippet', new Set());
		});

		it('create-fail-mode Snippet is recursively frozen', () => {
			assertDeepFrozen(embody(CREATE_FAIL), 'snippet', new Set());
		});

		it('happy-mode Snippet is recursively frozen', () => {
			assertDeepFrozen(embody(HAPPY), 'snippet', new Set());
		});

		it('mutating snippet.status throws in strict mode', () => {
			const snippet = embody(HAPPY);
			expect(() => {
				(snippet as { status: unknown }).status = {
					tokenized: false,
					parsed: false,
					created: false,
				};
			}).toThrow();
		});

		it('mutating snippet.status.tokenized throws in strict mode', () => {
			const snippet = embody(HAPPY);
			expect(() => {
				(snippet.status as { tokenized: boolean }).tokenized = false;
			}).toThrow();
		});

		it('mutating snippet.parse.tokens throws in strict mode', () => {
			const snippet = embody(HAPPY);
			expect(() => {
				(snippet.parse as { tokens: unknown[] }).tokens = [];
			}).toThrow();
		});

		it('happy-mode runInstance.snippet === embodiment (back-ref by identity)', async () => {
			const snippet = embody(HAPPY);
			const ri = await snippet.streams.evaluate!.run();
			expect(ri.snippet).toBe(snippet);
		});

		it('happy-mode runInstance is frozen', async () => {
			const ri = await embody(HAPPY).streams.evaluate!.run();
			expect(Object.isFrozen(ri)).toBe(true);
		});

		it('happy-mode runInstance.snippet (the back-ref) is frozen', async () => {
			const ri = await embody(HAPPY).streams.evaluate!.run();
			expect(Object.isFrozen(ri.snippet)).toBe(true);
		});

		it('cycle freeze does not stack-overflow (back-ref reaches itself)', async () => {
			const snippet = embody(HAPPY);
			const ri = await snippet.streams.evaluate!.run();
			// If the cycle weren't handled, accessing ri.snippet.streams... would have
			// triggered an infinite freeze recursion at construction time and thrown.
			// Reaching this assertion means the cycle was traversed safely.
			expect(ri.snippet.streams.evaluate).toBeDefined();
		});
	});

	describe('embodyMock(code).with({...}) override builder (S)', () => {
		const HAPPY = 'let x = 1;';

		it('without overrides, embodyMock(code).with({}) returns a happy-mode Snippet', () => {
			expect(embodyMock(HAPPY).with({}).status.tokenized).toBe(true);
		});

		it('overrides status.created to false without tripping sentinel logic', () => {
			const snippet = embodyMock(HAPPY).with({ status: { created: false } });
			expect(snippet.status.created).toBe(false);
		});

		it('overriding status.created leaves status.tokenized untouched', () => {
			const snippet = embodyMock(HAPPY).with({ status: { created: false } });
			expect(snippet.status.tokenized).toBe(true);
		});

		it('overrides errors with a custom shape', () => {
			const snippet = embodyMock(HAPPY).with({
				errors: {
					phase: 'create',
					kind: 'TypeError',
					message: 'fixture-specific message',
					loc: null,
				},
			});
			expect(snippet.errors!.message).toBe('fixture-specific message');
		});

		it('arrays in overrides replace base arrays (do not concat)', () => {
			const snippet = embodyMock(HAPPY).with({
				validation: {
					violations: [
						{
							kind: 'FunctionDeclaration',
							message: 'fixture violation',
							nodePath: '$.body[0]',
							loc: {
								start: { line: 1, column: 0 },
								end: { line: 1, column: 1 },
							},
						},
					],
				},
			});
			expect(snippet.validation.violations.length).toBe(1);
		});

		it('does not mutate the underlying base Snippet', () => {
			const baseBefore = embody(HAPPY);
			embodyMock(HAPPY).with({ status: { created: false } });
			const baseAfter = embody(HAPPY);
			expect(baseBefore.status.created).toBe(true);
			expect(baseAfter.status.created).toBe(true);
		});

		it('returns a fresh Snippet identity (not the underlying base reference)', () => {
			const base = embody(HAPPY);
			const overridden = embodyMock(HAPPY).with({});
			expect(overridden).not.toBe(base);
		});

		it('returns a deep-frozen Snippet', () => {
			const snippet = embodyMock(HAPPY).with({ status: { created: false } });
			expect(Object.isFrozen(snippet)).toBe(true);
			expect(Object.isFrozen(snippet.status)).toBe(true);
		});

		it('preserves the four-mode discriminator on the BASE before override', () => {
			const snippet = embodyMock('').with({});
			expect(snippet.status.tokenized).toBe(false);
		});

		it('allows overriding fields on a non-happy base mode', () => {
			const snippet = embodyMock('').with({
				validation: { isJeJ: false },
			});
			expect(snippet.validation.isJeJ).toBe(false);
			expect(snippet.status.tokenized).toBe(false);
		});
	});
});
