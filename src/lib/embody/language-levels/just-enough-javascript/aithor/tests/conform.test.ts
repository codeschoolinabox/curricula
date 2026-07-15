import { describe, it, expect } from 'vitest';

import conform from '../conform.js';
import type { FeatureName, SizeViolation } from '../types.js';

// Increment 1 — conform: feature-subset conformance.
// Size bounds (`lines`/`complexity`) arrive in increment 2; every case here
// passes an empty `size` ({}), so only the feature-subset path is exercised.
//
// nodePath convention: a violation is located at the node that IS the feature.
// A statement feature (if/while/for-of) sits directly in the program body, so
// its path is `$.body.N`. An expression feature (compound-assignment,
// short-circuit, optional-chaining) is the `.expression` of an
// ExpressionStatement, so its path is `$.body.N.expression`.

describe('conform — feature subset', () => {
	describe('zero — trivial admitted program, empty subset and size', () => {
		it('returns ok true with no violations and echoes the ast', () => {
			const result = conform('let x = 5;\n', { include: [], exclude: [] }, {});

			expect(result.ok).toBe(true);
			expect(result.violations).toEqual([]);
			expect(result.ast).toBeDefined();
		});
	});

	describe('one — a permitted feature passes', () => {
		it('an included feature the program uses does not violate', () => {
			const result = conform(
				'let a = 1;\nif (a) {\n\ta = 2;\n}\n',
				{ include: ['if'], exclude: [] },
				{},
			);

			expect(result.ok).toBe(true);
			expect(result.violations).toEqual([]);
		});

		it('include is a ceiling, not a floor — an unused included feature is fine', () => {
			const result = conform(
				'let a = 1;\nif (a) {\n\ta = 2;\n}\n',
				{ include: ['if', 'while'], exclude: [] },
				{},
			);

			expect(result.ok).toBe(true);
			expect(result.violations).toEqual([]);
		});
	});

	describe('one — an excluded feature violates, located', () => {
		it('flags an excluded statement feature with kind, feature, nodePath and location', () => {
			const result = conform(
				'const xs = [1];\nfor (const x of xs) {\n\tx;\n}\n',
				{ include: [], exclude: ['for-of'] },
				{},
			);

			expect(result.ok).toBe(false);
			expect(result.violations).toHaveLength(1);

			const [violation] = result.violations;
			expect(violation.kind).toBe('feature');
			if (violation.kind !== 'feature')
				throw new Error('expected a feature violation');
			expect(violation.feature).toBe('for-of');
			expect(violation.nodePath).toBe('$.body.1');
			expect(violation.location.start.line).toBe(2);
			expect(violation.message).toBeTruthy();
		});

		it('flags an excluded operator-family feature, distinguishing compound from plain assignment', () => {
			// `a = 2` is a plain assignment (not a feature); only `a += 3` is
			// compound-assignment — a wrong impl flagging every AssignmentExpression
			// would report two violations here.
			const result = conform(
				'let a = 1;\na = 2;\na += 3;\n',
				{ include: [], exclude: ['compound-assignment'] },
				{},
			);

			expect(result.ok).toBe(false);
			expect(result.violations).toHaveLength(1);

			const [violation] = result.violations;
			if (violation.kind !== 'feature')
				throw new Error('expected a feature violation');
			expect(violation.feature).toBe('compound-assignment');
			expect(violation.nodePath).toBe('$.body.2.expression');
			expect(violation.location.start.line).toBe(3);
		});

		it('classifies a bitwise compound form as compound-assignment, not bitwise', () => {
			// `a &= 3` is the `compound-assignment` feature, not `bitwise` —
			// reference.md teaches the compound form as its own construct.
			const asBitwise = conform(
				'let a = 1;\na &= 3;\n',
				{ include: [], exclude: ['bitwise'] },
				{},
			);
			expect(asBitwise.ok).toBe(true);
			expect(asBitwise.violations).toEqual([]);

			const asCompound = conform(
				'let a = 1;\na &= 3;\n',
				{ include: [], exclude: ['compound-assignment'] },
				{},
			);
			expect(asCompound.ok).toBe(false);
			expect(asCompound.violations).toHaveLength(1);
			const [violation] = asCompound.violations;
			if (violation.kind !== 'feature')
				throw new Error('expected a feature violation');
			expect(violation.feature).toBe('compound-assignment');
		});

		it('flags excluded optional-chaining exactly once per chain (no double count)', () => {
			const result = conform(
				'let a = { b: 1 };\na?.b;\n',
				{ include: [], exclude: ['optional-chaining'] },
				{},
			);

			expect(result.ok).toBe(false);
			expect(result.violations).toHaveLength(1);

			const [violation] = result.violations;
			if (violation.kind !== 'feature')
				throw new Error('expected a feature violation');
			expect(violation.feature).toBe('optional-chaining');
			expect(violation.nodePath).toBe('$.body.1.expression');
		});
	});

	describe('one — a non-empty include denies everything else', () => {
		it('a used statement feature absent from include violates', () => {
			const result = conform(
				'let a = 1;\nwhile (a) {\n\ta = 0;\n}\n',
				{ include: ['if'], exclude: [] },
				{},
			);

			expect(result.ok).toBe(false);
			expect(result.violations).toHaveLength(1);

			const [violation] = result.violations;
			if (violation.kind !== 'feature')
				throw new Error('expected a feature violation');
			expect(violation.feature).toBe('while');
			expect(violation.nodePath).toBe('$.body.1');
		});

		it('a used operator-family feature absent from include violates', () => {
			const result = conform(
				'let a = 1;\na || a;\n',
				{ include: ['if'], exclude: [] },
				{},
			);

			expect(result.ok).toBe(false);
			expect(result.violations).toHaveLength(1);

			const [violation] = result.violations;
			if (violation.kind !== 'feature')
				throw new Error('expected a feature violation');
			expect(violation.feature).toBe('short-circuit');
			expect(violation.nodePath).toBe('$.body.1.expression');
		});
	});

	describe('many — one violation per offending node, order, and overlap', () => {
		it('emits one located violation per occurrence (no per-feature dedup)', () => {
			const result = conform(
				'const xs = [1];\nfor (const x of xs) {\n\tx;\n}\nfor (const y of xs) {\n\ty;\n}\n',
				{ include: [], exclude: ['for-of'] },
				{},
			);

			expect(result.ok).toBe(false);
			expect(result.violations).toHaveLength(2);
			expect(result.violations.map((v) => v.kind)).toEqual([
				'feature',
				'feature',
			]);
			expect(
				result.violations.map((v) =>
					v.kind === 'feature' ? v.nodePath : null,
				),
			).toEqual(['$.body.1', '$.body.2']);
		});

		it('orders violations by document position across mixed features', () => {
			const result = conform(
				'const xs = [1];\nfor (const x of xs) {\n\tx;\n}\nwhile (false) {\n\tbreak;\n}\n',
				{ include: [], exclude: ['for-of', 'while'] },
				{},
			);

			expect(result.ok).toBe(false);
			expect(result.violations).toHaveLength(2);
			expect(
				result.violations.map((v) => (v.kind === 'feature' ? v.feature : null)),
			).toEqual(['for-of', 'while']);
		});

		it('exclude wins when a feature is in both include and exclude', () => {
			const result = conform(
				'let a = 1;\nif (a) {\n\ta = 2;\n}\n',
				{ include: ['if'], exclude: ['if'] },
				{},
			);

			expect(result.ok).toBe(false);
			expect(result.violations).toHaveLength(1);
			const [violation] = result.violations;
			if (violation.kind !== 'feature')
				throw new Error('expected a feature violation');
			expect(violation.feature).toBe('if');
		});
	});

	describe('detection — every feature is detected when excluded', () => {
		const cases: ReadonlyArray<readonly [string, FeatureName, string]> = [
			['if', 'if', 'if (true) {\n\t1;\n}\n'],
			['while', 'while', 'while (false) {\n\t1;\n}\n'],
			['do-while', 'do-while', 'do {\n\t1;\n} while (false);\n'],
			['for', 'for', 'for (let i = 0; i < 1; ) {\n\t1;\n}\n'],
			['for-of', 'for-of', 'for (const x of [1]) {\n\tx;\n}\n'],
			['break', 'break', 'while (false) {\n\tbreak;\n}\n'],
			['continue', 'continue', 'while (false) {\n\tcontinue;\n}\n'],
			['ternary', 'ternary', 'let a = true ? 1 : 2;\n'],
			['short-circuit', 'short-circuit', 'let a = true || false;\n'],
			[
				'optional-chaining',
				'optional-chaining',
				'let a = { b: 1 };\nlet c = a?.b;\n',
			],
			['typeof', 'typeof', 'let a = typeof 1;\n'],
			['in', 'in', "let a = 'x' in { x: 1 };\n"],
			['increment', 'increment', 'let i = 0;\ni++;\n'],
			['bitwise (binary)', 'bitwise', 'let a = 1 & 2;\n'],
			['bitwise (unary ~)', 'bitwise', 'let a = ~1;\n'],
			['compound-assignment', 'compound-assignment', 'let a = 1;\na += 2;\n'],
			['template-literal', 'template-literal', 'let a = `x`;\n'],
			['regex', 'regex', 'let a = /x/;\n'],
			['bigint', 'bigint', 'let a = 1n;\n'],
			['new-date', 'new-date', 'let a = new Date();\n'],
		];

		it.each(cases)(
			'detects %s used outside the subset',
			(_label, feature, code) => {
				const result = conform(code, { include: [], exclude: [feature] }, {});

				expect(result.ok).toBe(false);
				expect(result.violations).toHaveLength(1);
				const [violation] = result.violations;
				if (violation.kind !== 'feature')
					throw new Error('expected a feature violation');
				expect(violation.feature).toBe(feature);
			},
		);
	});

	describe('size — line bounds', () => {
		it('flags a program longer than the lines bound', () => {
			const result = conform(
				'let a = 1;\nlet b = 2;\nlet c = 3;',
				{ include: [], exclude: [] },
				{ lines: 2 },
			);

			expect(result.ok).toBe(false);
			expect(result.violations).toHaveLength(1);
			const [violation] = result.violations;
			if (violation.kind !== 'size')
				throw new Error('expected a size violation');
			expect(violation.dimension).toBe('lines');
			expect(violation.limit).toBe(2);
			expect(violation.actual).toBe(3);
			expect(violation.message).toBeTruthy();
		});

		it('a program exactly at the lines bound passes (inclusive)', () => {
			const result = conform(
				'let a = 1;\nlet b = 2;',
				{ include: [], exclude: [] },
				{ lines: 2 },
			);

			expect(result.ok).toBe(true);
			expect(result.violations).toEqual([]);
		});

		it('an absent lines bound is unbounded', () => {
			const result = conform(
				'let a = 1;\nlet b = 2;\nlet c = 3;\nlet d = 4;',
				{ include: [], exclude: [] },
				{},
			);

			expect(result.ok).toBe(true);
		});

		it('counts a trailing newline as a line (split semantics, matching the level)', () => {
			// 'let a = 1;\nlet b = 2;\n'.split('\n') is ['let a = 1;', 'let b = 2;', '']
			// — three lines, matching Metrics.source.lines.
			const result = conform(
				'let a = 1;\nlet b = 2;\n',
				{ include: [], exclude: [] },
				{ lines: 2 },
			);

			expect(result.ok).toBe(false);
			expect(result.violations).toHaveLength(1);
			const [violation] = result.violations;
			if (violation.kind !== 'size')
				throw new Error('expected a size violation');
			expect(violation.dimension).toBe('lines');
			expect(violation.actual).toBe(3);
		});
	});

	describe('size — complexity (control-flow nesting depth)', () => {
		it('flags a program deeper than the complexity bound', () => {
			const result = conform(
				'if (true) {\n\tif (false) {\n\t\t1;\n\t}\n}',
				{ include: [], exclude: [] },
				{ complexity: 1 },
			);

			expect(result.ok).toBe(false);
			expect(result.violations).toHaveLength(1);
			const [violation] = result.violations;
			if (violation.kind !== 'size')
				throw new Error('expected a size violation');
			expect(violation.dimension).toBe('complexity');
			expect(violation.limit).toBe(1);
			expect(violation.actual).toBe(2);
		});

		it('flat code has depth 0', () => {
			const result = conform(
				'let a = 1;\nlet b = 2;',
				{ include: [], exclude: [] },
				{ complexity: 0 },
			);

			expect(result.ok).toBe(true);
		});

		it('a single control-flow construct has depth 1', () => {
			const result = conform(
				'if (true) {\n\t1;\n}',
				{ include: [], exclude: [] },
				{ complexity: 0 },
			);

			expect(result.ok).toBe(false);
			const [violation] = result.violations;
			if (violation.kind !== 'size')
				throw new Error('expected a size violation');
			expect(violation.actual).toBe(1);
		});

		it('an else-if ladder stays flat (depth 1, not one level per arm)', () => {
			const result = conform(
				'if (true) {\n} else if (false) {\n} else if (true) {\n} else {\n}',
				{ include: [], exclude: [] },
				{ complexity: 0 },
			);

			expect(result.ok).toBe(false);
			const [violation] = result.violations;
			if (violation.kind !== 'size')
				throw new Error('expected a size violation');
			expect(violation.actual).toBe(1);
		});

		it('nested ternaries do not add depth (depth 0)', () => {
			const result = conform(
				'let a = true ? (false ? 1 : 2) : 3;',
				{ include: [], exclude: [] },
				{ complexity: 0 },
			);

			expect(result.ok).toBe(true);
		});

		it('a program exactly at the complexity bound passes (inclusive)', () => {
			const result = conform(
				'if (true) {\n\t1;\n}',
				{ include: [], exclude: [] },
				{ complexity: 1 },
			);

			expect(result.ok).toBe(true);
		});

		it('counts nesting beyond two (no depth cap)', () => {
			const result = conform(
				'while (true) {\n\tif (false) {\n\t\twhile (true) {\n\t\t\t1;\n\t\t}\n\t}\n}',
				{ include: [], exclude: [] },
				{ complexity: 2 },
			);

			expect(result.ok).toBe(false);
			const [violation] = result.violations;
			if (violation.kind !== 'size')
				throw new Error('expected a size violation');
			expect(violation.actual).toBe(3);
		});

		it.each([
			['do-while', 'do {\n\t1;\n} while (false);'],
			['for', 'for (let i = 0; i < 1; ) {\n\t1;\n}'],
			['for-of', 'for (const x of [1]) {\n\t1;\n}'],
		])('a %s body adds a depth level', (_label, code) => {
			const result = conform(
				code,
				{ include: [], exclude: [] },
				{ complexity: 0 },
			);

			expect(result.ok).toBe(false);
			expect(result.violations).toHaveLength(1);
			const [violation] = result.violations;
			if (violation.kind !== 'size')
				throw new Error('expected a size violation');
			expect(violation.dimension).toBe('complexity');
			expect(violation.actual).toBe(1);
		});

		it('an if inside a real else block adds a level (unlike a flat else-if)', () => {
			const result = conform(
				'if (true) {\n} else {\n\tif (false) {\n\t\t1;\n\t}\n}',
				{ include: [], exclude: [] },
				{ complexity: 1 },
			);

			expect(result.ok).toBe(false);
			const [violation] = result.violations;
			if (violation.kind !== 'size')
				throw new Error('expected a size violation');
			expect(violation.actual).toBe(2);
		});
	});

	describe('size — combined with feature violations', () => {
		it('orders feature violations first, then size (lines, then complexity)', () => {
			const result = conform(
				'while (true) {\n\tif (false) {\n\t\t1;\n\t}\n}',
				{ include: [], exclude: ['while'] },
				{ lines: 1, complexity: 1 },
			);

			expect(result.ok).toBe(false);
			expect(result.violations.map((v) => v.kind)).toEqual([
				'feature',
				'size',
				'size',
			]);

			const sizeViolations = result.violations.filter(
				(v): v is SizeViolation => v.kind === 'size',
			);
			expect(sizeViolations.map((v) => v.dimension)).toEqual([
				'lines',
				'complexity',
			]);
			const [linesViolation, complexityViolation] = sizeViolations;
			expect(linesViolation).toMatchObject({ limit: 1, actual: 5 });
			expect(complexityViolation).toMatchObject({ limit: 1, actual: 2 });
			expect(Object.isFrozen(linesViolation)).toBe(true);
			expect(Object.isFrozen(complexityViolation)).toBe(true);
		});
	});

	describe('interface — result shape and immutability', () => {
		it('ok is true exactly when violations is empty', () => {
			const clean = conform('let x = 1;\n', { include: [], exclude: [] }, {});
			expect(clean.ok).toBe(clean.violations.length === 0);

			const dirty = conform(
				'const xs = [1];\nfor (const x of xs) {\n\tx;\n}\n',
				{ include: [], exclude: ['for-of'] },
				{},
			);
			expect(dirty.ok).toBe(dirty.violations.length === 0);
		});

		it('deep-freezes the result, its violations, and their locations', () => {
			const result = conform(
				'const xs = [1];\nfor (const x of xs) {\n\tx;\n}\n',
				{ include: [], exclude: ['for-of'] },
				{},
			);

			expect(Object.isFrozen(result)).toBe(true);
			expect(Object.isFrozen(result.violations)).toBe(true);
			expect(Object.isFrozen(result.violations[0])).toBe(true);
			const [violation] = result.violations;
			if (violation.kind !== 'feature')
				throw new Error('expected a feature violation');
			expect(Object.isFrozen(violation.location)).toBe(true);
			expect(Object.isFrozen(violation.location.start)).toBe(true);
		});
	});

	describe('exceptions — unparseable and out-of-vocabulary', () => {
		it('unparseable code is ok false with no violations and no ast, never throwing', () => {
			expect(() =>
				conform('let = ;', { include: [], exclude: [] }, {}),
			).not.toThrow();

			const result = conform('let = ;', { include: [], exclude: [] }, {});

			expect(result.ok).toBe(false);
			expect(result.violations).toEqual([]);
			expect(result.ast).toBeUndefined();
			expect(Object.isFrozen(result)).toBe(true);
			expect(Object.isFrozen(result.violations)).toBe(true);
		});

		it('a parseable non-JEJ construct is silent (admission, not conform, rejects it)', () => {
			const result = conform('class C {}\n', { include: [], exclude: [] }, {});

			expect(result.ok).toBe(true);
			expect(result.violations).toEqual([]);
			expect(result.ast).toBeDefined();
		});
	});
});
