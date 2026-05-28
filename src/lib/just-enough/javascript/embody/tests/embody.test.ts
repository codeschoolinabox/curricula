import { describe, it, expect } from 'vitest';

import embody, { EMBODY_SCENARIOS } from '../index.js';

describe('embody', () => {
	describe('EMBODY_SCENARIOS export', () => {
		it('is a frozen array', () => {
			expect(Object.isFrozen(EMBODY_SCENARIOS)).toBe(true);
		});

		it('lists exactly 11 scenarios', () => {
			expect(EMBODY_SCENARIOS.length).toBe(11);
		});

		it('includes OK', () => {
			expect(EMBODY_SCENARIOS).toContain('OK');
		});

		it('includes the three FAIL_AT_* stages', () => {
			expect(EMBODY_SCENARIOS).toEqual(
				expect.arrayContaining([
					'FAIL_AT_TOKENIZE',
					'FAIL_AT_PARSE',
					'FAIL_AT_CREATE',
				]),
			);
		});

		it('includes the four EVAL_* outcomes', () => {
			expect(EMBODY_SCENARIOS).toEqual(
				expect.arrayContaining([
					'EVAL_ERROR',
					'EVAL_TIMEOUT',
					'EVAL_LIMIT',
					'EVAL_CANCELLED',
				]),
			);
		});

		it('includes VALIDATION_FAIL, NON_DETERMINISTIC, and PAUSES', () => {
			expect(EMBODY_SCENARIOS).toEqual(
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
			expect(s.status).toEqual({ tokenized: true, parsed: true, validated: true, created: true });
		});

		it('returns errors: null', () => {
			expect(embody('OK').errors).toBe(null);
		});

		it('returns raw.ast as a Program node', () => {
			expect(embody('OK').raw.ast?.type).toBe('Program');
		});

		it('returns raw.comments: []', () => {
			expect(embody('OK').raw.comments).toEqual([]);
		});

		it('analysis is defined with shape-valid sub-objects', () => {
			expect(embody('OK').analysis).toMatchObject({
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
			expect(embody('OK').validation!.isJeJ).toBe(true);
		});

		it('returns validation.isDeterministic: true (no nonDeterminism)', () => {
			expect(embody('OK').validation!.isDeterministic).toBe(true);
		});

		it('returns validation.doesPause: false (no IO)', () => {
			expect(embody('OK').validation!.doesPause).toBe(false);
		});

		it('returns validation.violations: []', () => {
			expect(embody('OK').validation!.violations).toEqual([]);
		});

		it('exposes events.evaluation', () => {
			expect(embody('OK').events.evaluation).toBeDefined();
		});

		it('events.evaluation.run() resolves to RunInstance with outcome completed', async () => {
			const ri = await embody('OK').events.evaluation.run();
			expect(ri.endReport.outcome).toBe('completed');
		});

		it('events.evaluation.run() resolves to RunInstance with ok: true', async () => {
			const ri = await embody('OK').events.evaluation.run();
			expect(ri.endReport.ok).toBe(true);
		});

		it('events.evaluation.run() resolved RunInstance has events: []', async () => {
			const ri = await embody('OK').events.evaluation.run();
			expect(ri.events).toEqual([]);
		});

		it('back-ref RunInstance.snippet === embodiment (identity)', async () => {
			const s = embody('OK');
			const ri = await s.events.evaluation.run();
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
				validated: false,
				created: false,
			});
		});

		it('returns errors.phase: parse:tokenize', () => {
			expect(embody('FAIL_AT_TOKENIZE').errors!.phase).toBe('parse:tokenize');
		});

		it('returns errors.message identifying the canned scenario', () => {
			expect(embody('FAIL_AT_TOKENIZE').errors!.message).toMatch(/canned scenario/i);
		});

		it('returns raw.tokens: null (tokenize did not complete)', () => {
			expect(embody('FAIL_AT_TOKENIZE').raw.tokens).toBeNull();
		});

		it('returns raw.ast: null (tokenize did not complete)', () => {
			expect(embody('FAIL_AT_TOKENIZE').raw.ast).toBeNull();
		});

		it('returns analysis: null (not parsed)', () => {
			expect(embody('FAIL_AT_TOKENIZE').analysis).toBeNull();
		});

		it('evaluation is always present; outcome is not-runnable', async () => {
			const ri = await embody('FAIL_AT_TOKENIZE').events.evaluation.run();
			expect(ri.endReport.outcome).toBe('not-runnable');
		});

		it('exposes events.realm and events.tokenize as callable generators', () => {
			const s = embody('FAIL_AT_TOKENIZE');
			expect(typeof s.events.realm).toBe('function');
			expect(typeof s.events.tokenize).toBe('function');
		});

		it('tokenize is null (staircase: tokenize gate failed)', () => {
			expect(embody('FAIL_AT_TOKENIZE').tokenize).toBeNull();
		});

		it('parseAST is null (staircase: tokenize gate failed)', () => {
			expect(embody('FAIL_AT_TOKENIZE').parseAST).toBeNull();
		});

		it('raw.comments is null (pre-parse)', () => {
			expect(embody('FAIL_AT_TOKENIZE').raw.comments).toBeNull();
		});

		it('creation is null (validate gate did not run)', () => {
			expect(embody('FAIL_AT_TOKENIZE').creation).toBeNull();
		});

		it('validation is null (validate gate did not run)', () => {
			expect(embody('FAIL_AT_TOKENIZE').validation).toBeNull();
		});

		it('returns a frozen Snippet', () => {
			expect(Object.isFrozen(embody('FAIL_AT_TOKENIZE'))).toBe(true);
		});
	});

	describe('FAIL_AT_PARSE', () => {
		it('returns tokenized: true; rest false', () => {
			expect(embody('FAIL_AT_PARSE').status).toEqual({
				tokenized: true,
				parsed: false,
				validated: false,
				created: false,
			});
		});

		it('returns errors.phase: parse:ast', () => {
			expect(embody('FAIL_AT_PARSE').errors!.phase).toBe('parse:ast');
		});

		it('returns raw.tokens populated (length > 0)', () => {
			expect(embody('FAIL_AT_PARSE').raw.tokens!.length).toBeGreaterThan(0);
		});

		it('returns raw.ast: null (parse failed)', () => {
			expect(embody('FAIL_AT_PARSE').raw.ast).toBeNull();
		});

		it('returns analysis: null (parse failed)', () => {
			expect(embody('FAIL_AT_PARSE').analysis).toBeNull();
		});

		it('evaluation is always present; outcome is not-runnable', async () => {
			const ri = await embody('FAIL_AT_PARSE').events.evaluation.run();
			expect(ri.endReport.outcome).toBe('not-runnable');
		});

		it('tokenize is non-null (staircase: tokenize gate passed)', () => {
			expect(embody('FAIL_AT_PARSE').tokenize).toBeDefined();
		});

		it('parseAST is null (staircase: parse gate failed)', () => {
			expect(embody('FAIL_AT_PARSE').parseAST).toBeNull();
		});

		it('raw.comments is null (pre-parse)', () => {
			expect(embody('FAIL_AT_PARSE').raw.comments).toBeNull();
		});

		it('creation is null (validate gate did not run)', () => {
			expect(embody('FAIL_AT_PARSE').creation).toBeNull();
		});

		it('validation is null (validate gate did not run)', () => {
			expect(embody('FAIL_AT_PARSE').validation).toBeNull();
		});

		it('returns a frozen Snippet', () => {
			expect(Object.isFrozen(embody('FAIL_AT_PARSE'))).toBe(true);
		});
	});

	describe('FAIL_AT_CREATE', () => {
		it('returns tokenized: true, parsed: true, validated: true, created: false', () => {
			expect(embody('FAIL_AT_CREATE').status).toEqual({
				tokenized: true,
				parsed: true,
				validated: true,
				created: false,
			});
		});

		it('returns errors.phase: creation', () => {
			expect(embody('FAIL_AT_CREATE').errors!.phase).toBe('creation');
		});

		it('returns raw.ast populated (Program node)', () => {
			expect(embody('FAIL_AT_CREATE').raw.ast?.type).toBe('Program');
		});

		it('analysis is present (validate gate ran before creation failed)', () => {
			expect(embody('FAIL_AT_CREATE').analysis).toBeDefined();
		});

		it('tokenize and parseAST are non-null (staircase: both gates passed)', () => {
			expect(embody('FAIL_AT_CREATE').tokenize).toBeDefined();
			expect(embody('FAIL_AT_CREATE').parseAST).toBeDefined();
		});

		it('creation is null (creation gate failed)', () => {
			expect(embody('FAIL_AT_CREATE').creation).toBeNull();
		});

		it('evaluation is always present; outcome is not-runnable (create-fail leaf)', async () => {
			const ri = await embody('FAIL_AT_CREATE').events.evaluation.run();
			expect(ri.endReport.outcome).toBe('not-runnable');
		});

		it('exposes clean validation (isJeJ=true; validate gate passed before create failed)', () => {
			expect(embody('FAIL_AT_CREATE').validation!.isJeJ).toBe(true);
		});

		it('returns a frozen Snippet', () => {
			expect(Object.isFrozen(embody('FAIL_AT_CREATE'))).toBe(true);
		});
	});

	describe('VALIDATION_FAIL', () => {
		it('returns validate-fail status (parsed=true, validated=false, created=false)', () => {
			expect(embody('VALIDATION_FAIL').status).toEqual({
				tokenized: true,
				parsed: true,
				validated: false,
				created: false,
			});
		});

		it('returns validation.isJeJ: false', () => {
			expect(embody('VALIDATION_FAIL').validation!.isJeJ).toBe(false);
		});

		it('returns at least one violation', () => {
			expect(
				embody('VALIDATION_FAIL').validation!.violations.length,
			).toBeGreaterThan(0);
		});

		it('first violation has shape-valid Violation fields', () => {
			expect(embody('VALIDATION_FAIL').validation!.violations[0]).toStrictEqual({
				nodeType: 'FunctionDeclaration',
				message: 'canned scenario: JEJ does not allow function declarations',
				severity: 'rejection',
				nodePath: '$.body[0]',
				location: {
					start: { line: 1, column: 0 },
					end: { line: 1, column: 1 },
				},
			});
		});

		it('retains raw.ast (Program node) — validate gate ran on top of parsed AST', () => {
			expect(embody('VALIDATION_FAIL').raw.ast?.type).toBe('Program');
		});

		it('retains raw.comments: [] — parse output preserved on validate-fail leaf', () => {
			expect(embody('VALIDATION_FAIL').raw.comments).toEqual([]);
		});

		it('analysis is present (validate gate ran on top of parsed code)', () => {
			expect(embody('VALIDATION_FAIL').analysis).toBeDefined();
		});

		it('validation.isDeterministic and validation.doesPause are boolean-typed', () => {
			const v = embody('VALIDATION_FAIL').validation!;
			expect(typeof v.isDeterministic).toBe('boolean');
			expect(typeof v.doesPause).toBe('boolean');
		});

		it('validation.formatted is true (canned scenario default)', () => {
			expect(embody('VALIDATION_FAIL').validation!.formatted).toBe(true);
		});

		it('errors has shape-valid EmbodyError with phase=validation', () => {
			expect(embody('VALIDATION_FAIL').errors).toMatchObject({
				phase: 'validation',
				kind: expect.any(String),
				message: expect.any(String),
			});
		});

		it('evaluation is always present; outcome is not-runnable (validate-fail leaf)', async () => {
			const ri = await embody('VALIDATION_FAIL').events.evaluation.run();
			expect(ri.endReport.outcome).toBe('not-runnable');
		});

		it('tokenize and parseAST are non-null (staircase: both gates passed before validate failed)', () => {
			expect(embody('VALIDATION_FAIL').tokenize).toBeDefined();
			expect(embody('VALIDATION_FAIL').parseAST).toBeDefined();
		});

		it('creation is null (validate-fail leaf)', () => {
			expect(embody('VALIDATION_FAIL').creation).toBeNull();
		});

		it('returns a frozen Snippet', () => {
			expect(Object.isFrozen(embody('VALIDATION_FAIL'))).toBe(true);
		});
	});

	describe('NON_DETERMINISTIC', () => {
		it('returns apex status', () => {
			expect(embody('NON_DETERMINISTIC').status.created).toBe(true);
		});

		it('returns analysis.nonDeterminism.random: true', () => {
			expect(embody('NON_DETERMINISTIC').analysis!.nonDeterminism.random).toBe(
				true,
			);
		});

		it('derives validation.isDeterministic: false', () => {
			expect(embody('NON_DETERMINISTIC').validation!.isDeterministic).toBe(false);
		});

		it('keeps validation.isJeJ: true', () => {
			expect(embody('NON_DETERMINISTIC').validation!.isJeJ).toBe(true);
		});

		it('returns a frozen Snippet', () => {
			expect(Object.isFrozen(embody('NON_DETERMINISTIC'))).toBe(true);
		});
	});

	describe('PAUSES', () => {
		it('returns apex status', () => {
			expect(embody('PAUSES').status.created).toBe(true);
		});

		it('returns analysis.hasIo.user.total: 1', () => {
			expect(embody('PAUSES').analysis!.hasIo.user.total).toBe(1);
		});

		it('derives validation.doesPause: true', () => {
			expect(embody('PAUSES').validation!.doesPause).toBe(true);
		});

		it('keeps validation.isJeJ: true', () => {
			expect(embody('PAUSES').validation!.isJeJ).toBe(true);
		});

		it('returns a frozen Snippet', () => {
			expect(Object.isFrozen(embody('PAUSES'))).toBe(true);
		});
	});

	describe('EVAL_ERROR', () => {
		it('returns apex status', () => {
			expect(embody('EVAL_ERROR').status.created).toBe(true);
		});

		it('events.evaluation.run() resolves with endReport.ok: false', async () => {
			const ri = await embody('EVAL_ERROR').events.evaluation.run();
			expect(ri.endReport.ok).toBe(false);
		});

		it('events.evaluation.run() resolves with outcome: errored', async () => {
			const ri = await embody('EVAL_ERROR').events.evaluation.run();
			expect(ri.endReport.outcome).toBe('errored');
		});

		it('events.evaluation.run() resolves with endReport.error.phase: evaluation', async () => {
			const ri = await embody('EVAL_ERROR').events.evaluation.run();
			expect(ri.endReport.error?.phase).toBe('evaluation');
		});

		it('Snippet-level errors stays null (errors gate is pre-evaluation)', () => {
			expect(embody('EVAL_ERROR').errors).toBe(null);
		});
	});

	describe('EVAL_TIMEOUT', () => {
		it('events.evaluation.run() resolves with outcome: timed-out', async () => {
			const ri = await embody('EVAL_TIMEOUT').events.evaluation.run();
			expect(ri.endReport.outcome).toBe('timed-out');
		});

		it('events.evaluation.run() resolves with endReport.ok: false', async () => {
			const ri = await embody('EVAL_TIMEOUT').events.evaluation.run();
			expect(ri.endReport.ok).toBe(false);
		});
	});

	describe('EVAL_LIMIT', () => {
		it('events.evaluation.run() resolves with outcome: limit-exceeded', async () => {
			const ri = await embody('EVAL_LIMIT').events.evaluation.run();
			expect(ri.endReport.outcome).toBe('limit-exceeded');
		});

		it('events.evaluation.run() resolves with endReport.ok: false', async () => {
			const ri = await embody('EVAL_LIMIT').events.evaluation.run();
			expect(ri.endReport.ok).toBe(false);
		});
	});

	describe('EVAL_CANCELLED', () => {
		it('events.evaluation.run() resolves with outcome: cancelled', async () => {
			const ri = await embody('EVAL_CANCELLED').events.evaluation.run();
			expect(ri.endReport.outcome).toBe('cancelled');
		});

		it('events.evaluation.run() resolves with endReport.ok: false', async () => {
			const ri = await embody('EVAL_CANCELLED').events.evaluation.run();
			expect(ri.endReport.ok).toBe(false);
		});
	});

	describe('events.evaluation.intercept and trace.* (apex modes)', () => {
		it('intercept returns an EvaluateHandle with .result and .cancel', () => {
			const handle = embody('OK').events.evaluation.intercept();
			expect(handle.result).toBeInstanceOf(Promise);
			expect(typeof handle.cancel).toBe('function');
		});

		it('intercept async-iterates zero events', async () => {
			const handle = embody('OK').events.evaluation.intercept();
			const collected: unknown[] = [];
			for await (const event of handle) {
				collected.push(event);
			}
			expect(collected).toEqual([]);
		});

		it('cancel() returns undefined (no-op)', () => {
			const handle = embody('OK').events.evaluation.intercept();
			expect(handle.cancel()).toBeUndefined();
		});

		it('intercept .result resolves to the same canned RunInstance run() returns', async () => {
			const s = embody('OK');
			const handleResult = await s.events.evaluation.intercept().result;
			const runResult = await s.events.evaluation.run();
			expect(handleResult).toBe(runResult);
		});

		it('trace.syntax returns a shape-conformant EvaluateHandle', () => {
			expect(embody('OK').events.evaluation.trace.syntax()).toMatchObject({
				result: expect.any(Promise),
				cancel: expect.any(Function),
			});
		});

		it('trace.semantics returns a shape-conformant EvaluateHandle', () => {
			expect(embody('OK').events.evaluation.trace.semantics()).toMatchObject({
				result: expect.any(Promise),
				cancel: expect.any(Function),
			});
		});

		it('events.evaluation === evaluation.events (reference-identical across both axes)', () => {
			const s = embody('OK');
			expect(s.events.evaluation).toBe(s.evaluation.events);
		});

		it('events.realm === realm.events (reference-identical across both axes)', () => {
			const s = embody('OK');
			expect(s.events.realm).toBe(s.realm.events);
		});

		it('events.tokenize === tokenize.events (reference-identical across both axes)', () => {
			const s = embody('OK');
			expect(s.events.tokenize).toBe(s.tokenize!.events);
		});

		it('events.parseAST === parseAST.events (reference-identical across both axes)', () => {
			const s = embody('OK');
			expect(s.events.parseAST).toBe(s.parseAST!.events);
		});

		it('events.creation === creation.events (reference-identical across both axes)', () => {
			const s = embody('OK');
			expect(s.events.creation).toBe(s.creation!.events);
		});

		it('events.tokenize === tokenize.events for real-composition apex (reference-identical)', () => {
			const s = embody('let x = 1');
			expect(s.events.tokenize).toBe(s.tokenize!.events);
		});

		it('events.parseAST === parseAST.events for real-composition apex (reference-identical)', () => {
			const s = embody('let x = 1');
			expect(s.events.parseAST).toBe(s.parseAST!.events);
		});
	});

	describe('normalization (trim + uppercase before scenario match)', () => {
		it('lowercased scenario keyword (ok) → matches OK scenario', () => {
			expect(embody('ok').status.tokenized).toBe(true);
		});

		it('mixed-case scenario keyword (Ok) → matches OK scenario', () => {
			expect(embody('Ok').status.tokenized).toBe(true);
		});

		it('lowercased non-OK scenario (fail_at_parse) → matches FAIL_AT_PARSE leaf', () => {
			expect(embody('fail_at_parse').status).toEqual({
				tokenized: true,
				parsed: false,
				validated: false,
				created: false,
			});
		});

		it('leading whitespace tolerated', () => {
			expect(embody('  OK').status.tokenized).toBe(true);
		});

		it('trailing newline tolerated', () => {
			expect(embody('OK\n').status.tokenized).toBe(true);
		});

		it('surrounding whitespace tolerated', () => {
			expect(embody('  OK  \n').status.tokenized).toBe(true);
		});

		it('source.code holds normalized form on scenario branch (lowercase + whitespace)', () => {
			expect(embody('  ok\n').source.code).toBe('OK');
		});

		it('source.code holds normalized form even for already-uppercase with whitespace (trim-only path)', () => {
			expect(embody('  OK\n').source.code).toBe('OK');
		});

		it('null input throws TypeError at boundary (trim() fails fast)', () => {
			expect(() => embody(null as unknown as string)).toThrow(TypeError);
		});

		it('undefined input throws TypeError at boundary (trim() fails fast)', () => {
			expect(() => embody(undefined as unknown as string)).toThrow(TypeError);
		});

		it('ast stub and source are length-consistent post-normalization', () => {
			const s = embody('  OK\n');
			expect(s.raw.ast?.end).toBe(s.source.code.length);
		});

		// Prototype-chain guard: Object.hasOwn prevents __proto__ / toString /
		// constructor from matching a scenario key, so they route to real composition.
		it("'__proto__' routes to real composition — Object.hasOwn guard prevents prototype-chain match", () => {
			expect(embody('__proto__').source.code).toBe('__proto__');
		});

		it("'toString' routes to real composition (not a scenario key)", () => {
			expect(embody('toString').source.code).toBe('toString');
		});

		it("'constructor' routes to real composition (not a scenario key)", () => {
			expect(embody('constructor').source.code).toBe('constructor');
		});

		// Typo guard: scenario-keyword-shaped strings that are not recognized
		// keys route to real composition rather than throwing. The input is
		// unambiguous JS (a valid identifier reference) and routes to apex.
		it("'FAIL_TO_TOKENIZE' (typo) routes to real composition without throwing", () => {
			expect(() => embody('FAIL_TO_TOKENIZE')).not.toThrow();
			expect(embody('FAIL_TO_TOKENIZE').source.code).toBe('FAIL_TO_TOKENIZE');
		});
	});

	describe('real composition — source', () => {
		// Non-scenario input goes to real composition; source.code holds the raw
		// (un-normalized) string. source.offsets[0] is always 0; subsequent
		// entries are the character index of each newline's successor.

		it('source.code holds the raw input string (not normalized)', () => {
			// 'hello world' normalizes to 'HELLO WORLD' — neither is a scenario key.
			expect(embody('hello world').source.code).toBe('hello world');
		});

		// Zero-A: empty string → single entry [0].
		it('offsets is [0] for the empty string (zero-A)', () => {
			expect(embody('').source.offsets).toEqual([0]);
		});

		// Zero-B: non-empty, no newlines → also [0]; rules out empty-string special-case.
		it('offsets is [0] for a non-empty single-line string (zero-B)', () => {
			expect(embody('hello').source.offsets).toEqual([0]);
		});

		// One: the length test rules out the [0] stub; the value pin rules out [0, anything-but-1].
		// The value pin is the real triangulation constraint — both tests are needed.
		it('offsets has length 2 for a string with exactly one newline (one)', () => {
			expect(embody('\n').source.offsets).toHaveLength(2);
		});

		it('offsets[1] is 1 when the first character is a newline — value pin (one)', () => {
			expect(embody('\n').source.offsets[1]).toBe(1);
		});

		// Many: multiple newlines produce one entry per line start.
		it('offsets reflects all line-start positions for multi-line input (many)', () => {
			// 'a\nb\nc': \n at index 1 → offset 2; \n at index 3 → offset 4
			expect(embody('a\nb\nc').source.offsets).toEqual([0, 2, 4]);
		});

		it('offsets handles consecutive newlines correctly (many-consecutive)', () => {
			// '\n\n': \n at 0 → offset 1; \n at 1 → offset 2
			expect(embody('\n\n').source.offsets).toEqual([0, 1, 2]);
		});

		// Boundaries: trailing newline creates an entry for the empty last "line".
		it('offsets includes entry for the character after a trailing newline', () => {
			// 'a\n': \n at index 1 → next-line starts at index 2
			expect(embody('a\n').source.offsets).toEqual([0, 2]);
		});

		// When implemented: embody('a\r\nb').source.offsets should be [0, 3] not [0, 2, 3].
		it.todo(String.raw`CRLF line endings (\r\n) — deferred; offsets contract is LF-only for now`);

		// Non-BMP: emoji (😀, U+1F600) is 2 code units; offset must track code-unit position.
		it('offsets tracks code-unit position for non-BMP characters before a newline', () => {
			// '😀\n': emoji at code-units 0–1; \n at code-unit 2 → next line at 3.
			expect(embody('😀\n').source.offsets).toEqual([0, 3]);
		});
	});

	describe('real composition — raw, status, errors', () => {
		// The three acorn-run outcome branches:
		//   apex (ok)          — valid JS: raw.tokens + ast + comments non-null; status.tokenized + parsed true; errors null
		//   parse:tokenize     — tokenizer throws: raw all null; status all false; errors.phase 'parse:tokenize'
		//   parse:ast          — tokenizer ok, parser throws: raw.tokens non-null; ast + comments null; status.parsed false
		//
		// Inputs chosen to be unambiguous:
		//   valid   → '' (empty program, always parseable)
		//   tok-fail → "'unterminated" (unterminated string literal; tokenizer throws)
		//   prs-fail → 'const' (incomplete declaration; tokenizer succeeds, parser throws)

		// Zero: empty string → valid JS → apex path.
		it('sets raw.tokens to a non-null array for valid JS (zero: empty program)', () => {
			expect(embody('').raw.tokens).not.toBeNull();
		});

		// One: non-trivial program produces multiple tokens — forces real accumulation.
		// (acorn's EOF token is the done:true sentinel and is not collected by spread)
		it('sets raw.tokens to multiple tokens for a multi-token program (let x = 1)', () => {
			expect(embody('let x = 1').raw.tokens!.length).toBeGreaterThan(1);
		});

		it('sets raw.ast to a non-null object for valid JS', () => {
			expect(embody('').raw.ast).not.toBeNull();
		});

		it("sets raw.ast.type to 'Program' for valid JS (real-composition apex)", () => {
			expect(embody('let x = 1').raw.ast?.type).toBe('Program');
		});

		it('sets raw.comments to a non-null array for valid JS', () => {
			expect(embody('').raw.comments).not.toBeNull();
		});

		it('sets status.tokenized to true for valid JS', () => {
			expect(embody('').status.tokenized).toBe(true);
		});

		it('sets status.parsed to true for valid JS', () => {
			expect(embody('').status.parsed).toBe(true);
		});

		it('sets errors to null for valid JS', () => {
			expect(embody('').errors).toBeNull();
		});

		// Tokenize-fail: unterminated string literal; tokenizer throws before any token.
		it("sets errors.phase to 'parse:tokenize' for tokenize failure", () => {
			expect(embody("'unterminated").errors?.phase).toBe('parse:tokenize');
		});

		it('sets errors.message to a non-empty string for tokenize failure', () => {
			expect(embody("'unterminated").errors!.message.length).toBeGreaterThan(0);
		});

		it('sets errors.loc to a non-null location for tokenize failure', () => {
			expect(embody("'unterminated").errors?.loc).not.toBeNull();
		});

		it('sets errors.cause to the original error object for tokenize failure', () => {
			expect(embody("'unterminated").errors?.cause).toBeDefined();
		});

		it("sets errors.kind to 'SyntaxError' for tokenize failure", () => {
			expect(embody("'unterminated").errors!.kind).toBe('SyntaxError');
		});

		it('errors.loc has identical start and end for tokenize failure (point location — acorn has no end)', () => {
			const loc = embody("'unterminated").errors!.loc!;
			expect(loc.start).toEqual(loc.end);
		});

		it('sets status all false for tokenize failure', () => {
			expect(embody("'unterminated").status).toEqual({
				tokenized: false,
				parsed: false,
				validated: false,
				created: false,
			});
		});

		it('sets raw.tokens to null for tokenize failure', () => {
			expect(embody("'unterminated").raw.tokens).toBeNull();
		});

		// Parse-fail: 'const' keyword alone; tokenizer succeeds, parser throws.
		// This is the critical discriminator: same failure mode, different gate.
		it("sets errors.phase to 'parse:ast' for parse failure", () => {
			expect(embody('const').errors?.phase).toBe('parse:ast');
		});

		it('sets errors.message to a non-empty string for parse failure', () => {
			expect(embody('const').errors!.message.length).toBeGreaterThan(0);
		});

		it('sets errors.loc to a non-null location for parse failure', () => {
			expect(embody('const').errors?.loc).not.toBeNull();
		});

		it('sets errors.cause to the original error object for parse failure', () => {
			expect(embody('const').errors?.cause).toBeDefined();
		});

		it("sets errors.kind to 'SyntaxError' for parse failure", () => {
			expect(embody('const').errors!.kind).toBe('SyntaxError');
		});

		it('errors.loc has identical start and end for parse failure (point location — acorn has no end)', () => {
			const loc = embody('const').errors!.loc!;
			expect(loc.start).toEqual(loc.end);
		});

		it('sets status all false except tokenized for parse failure', () => {
			expect(embody('const').status).toEqual({
				tokenized: true,
				parsed: false,
				validated: false,
				created: false,
			});
		});

		it('sets raw.tokens to a non-null array for parse failure (tokenize succeeded)', () => {
			expect(embody('const').raw.tokens).not.toBeNull();
		});

		it('sets raw.ast to null for parse failure', () => {
			expect(embody('const').raw.ast).toBeNull();
		});

		it('sets raw.comments to null for parse failure', () => {
			expect(embody('const').raw.comments).toBeNull();
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

		for (const scenario of EMBODY_SCENARIOS) {
			it(`${scenario}: Snippet is recursively frozen`, () => {
				assertDeepFrozen(embody(scenario), scenario, new Set());
			});
		}

		it('real composition stub is recursively frozen', () => {
			assertDeepFrozen(embody('hello world'), 'real-comp', new Set());
		});

		it('mutating snippet.status throws in strict mode', () => {
			const s = embody('OK');
			expect(() => {
				(s as { status: unknown }).status = {
					tokenized: false,
					parsed: false,
					validated: false,
					created: false,
				};
			}).toThrow();
		});

		it('mutating snippet.raw.tokens throws in strict mode', () => {
			const s = embody('OK');
			expect(() => {
				(s.raw as { tokens: unknown }).tokens = [];
			}).toThrow();
		});

		it('apex modes: runInstance is frozen (7 apex scenarios; VALIDATION_FAIL is validate-fail leaf)', async () => {
			const apexModes = [
				'OK',
				'NON_DETERMINISTIC',
				'PAUSES',
				'EVAL_ERROR',
				'EVAL_TIMEOUT',
				'EVAL_LIMIT',
				'EVAL_CANCELLED',
			] as const;
			for (const mode of apexModes) {
				const ri = await embody(mode).events.evaluation.run();
				expect(Object.isFrozen(ri)).toBe(true);
			}
		});

		it('cycle freeze does not stack-overflow (back-ref reaches itself)', async () => {
			const s = embody('OK');
			const ri = await s.events.evaluation.run();
			// Reaching this assertion means the cycle was traversed safely
			// during construction-time freeze.
			expect(ri.snippet.events.evaluation).toBeDefined();
		});
	});
});
