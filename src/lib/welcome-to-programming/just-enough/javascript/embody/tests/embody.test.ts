import { describe, it, expect } from 'vitest';

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
			const ast = embody(CODE).parse.ast;
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
});
