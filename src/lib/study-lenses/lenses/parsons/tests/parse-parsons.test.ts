// cspell:ignore distractor distractors npostamble postamble

import { describe, expect, it } from 'vitest';

import extractHints from '../lib/extract-hints.js';
import normalizeIndents from '../lib/normalize-indents.js';
import parseLines from '../lib/parse-lines.js';
import parseParsons from '../lib/parse-parsons.js';

describe('normalizeIndents — raw leading-whitespace counts to relative levels', () => {
	describe('Zero / One', () => {
		it('returns [] for no lines', () => {
			expect(normalizeIndents([])).toEqual([]);
		});

		it('maps a single flush-left line to level 0', () => {
			expect(normalizeIndents([0])).toEqual([0]);
		});

		it('flags a single indented first line as -1 (IndentationError)', () => {
			expect(normalizeIndents([4])).toEqual([-1]);
		});
	});

	describe('Many — nesting in and out', () => {
		it('indent-in then back to a seen level: [0,2,2,0] → [0,1,1,0]', () => {
			expect(normalizeIndents([0, 2, 2, 0])).toEqual([0, 1, 1, 0]);
		});

		it('two levels deep then dedent one: [0,2,4,2] → [0,1,2,1]', () => {
			expect(normalizeIndents([0, 2, 4, 2])).toEqual([0, 1, 2, 1]);
		});

		it('dedent back to flush-left: [0,2,0] → [0,1,0]', () => {
			expect(normalizeIndents([0, 2, 0])).toEqual([0, 1, 0]);
		});

		it('treats any same raw indent as the same level regardless of size', () => {
			expect(normalizeIndents([0, 8, 8, 0])).toEqual([0, 1, 1, 0]);
		});
	});

	describe('Boundaries — unresolvable dedent is an IndentationError (-1)', () => {
		it('dedent to a level never seen yields -1', () => {
			expect(normalizeIndents([2, 0])).toEqual([-1, -1]);
		});

		it('mid-sequence dedent to an unseen raw level is -1, then recovers via the earlier raw-0 line', () => {
			expect(normalizeIndents([0, 4, 2, 0])).toEqual([0, 1, -1, 0]);
		});
	});
});

describe('parseLines — split into solution + distractors (pure)', () => {
	describe('Zero — empty / blank-only', () => {
		it('returns empty arrays for empty source', () => {
			expect(parseLines('')).toEqual({ solution: [], distractors: [] });
		});

		it('drops blank / whitespace-only lines', () => {
			expect(parseLines('\n   \n\t\n')).toEqual({
				solution: [],
				distractors: [],
			});
		});
	});

	describe('One', () => {
		it('parses a single solution line at level 0', () => {
			expect(parseLines('let x = 1;')).toEqual({
				solution: [
					{ id: 'line-0', code: 'let x = 1;', indent: 0, distractor: false },
				],
				distractors: [],
			});
		});

		it('parses a single distractor (marker stripped, indent -1)', () => {
			expect(parseLines('foo(); // distractor')).toEqual({
				solution: [],
				distractors: [
					{ id: 'line-0', code: 'foo();', indent: -1, distractor: true },
				],
			});
		});
	});

	describe('Many — interleaved, indented, mixed', () => {
		it('splits solution and distractor lines, preserving source-order ids', () => {
			expect(parseLines('a();\nb(); // distractor\nc();')).toEqual({
				solution: [
					{ id: 'line-0', code: 'a();', indent: 0, distractor: false },
					{ id: 'line-2', code: 'c();', indent: 0, distractor: false },
				],
				distractors: [
					{ id: 'line-1', code: 'b();', indent: -1, distractor: true },
				],
			});
		});

		it('normalizes nested-block indentation to relative levels with trimmed code', () => {
			expect(
				parseLines('function f() {\n\treturn 1;\n}').solution.map((line) => ({
					code: line.code,
					indent: line.indent,
				})),
			).toEqual([
				{ code: 'function f() {', indent: 0 },
				{ code: 'return 1;', indent: 1 },
				{ code: '}', indent: 0 },
			]);
		});
	});

	describe('Boundaries — marker + trim variants', () => {
		it('accepts the no-space marker //distractor', () => {
			expect(parseLines('bar(); //distractor').distractors).toEqual([
				{ id: 'line-0', code: 'bar();', indent: -1, distractor: true },
			]);
		});

		it('strips the marker and trims surrounding whitespace', () => {
			expect(
				parseLines('   gum();   // distractor   ').distractors[0]?.code,
			).toBe('gum();');
		});

		it('does not treat a mid-line "distractor" word as the marker', () => {
			expect(parseLines('const distractor = 1;')).toEqual({
				solution: [
					{
						id: 'line-0',
						code: 'const distractor = 1;',
						indent: 0,
						distractor: false,
					},
				],
				distractors: [],
			});
		});

		it('drops a line that is only the marker (empty code after strip)', () => {
			expect(parseLines('// distractor')).toEqual({
				solution: [],
				distractors: [],
			});
		});

		it('ids skip blank lines (a blank between lines consumes no id)', () => {
			expect(
				parseLines('a();\n\nc();').solution.map((line) => line.id),
			).toEqual(['line-0', 'line-1']);
		});

		it('strips trailing CR on CRLF source so code has no carriage return', () => {
			expect(
				parseLines('a();\r\nb(); // distractor\r\nc();').solution.map(
					(line) => line.code,
				),
			).toEqual(['a();', 'c();']);
		});

		it('strips the marker on a CRLF distractor line too', () => {
			expect(
				parseLines('a();\r\nb(); // distractor\r\n').distractors[0]?.code,
			).toBe('b();');
		});

		it('an indented first solution line gets indent -1 (IndentationError sentinel)', () => {
			expect(parseLines('  return x;')).toEqual({
				solution: [
					{ id: 'line-0', code: 'return x;', indent: -1, distractor: false },
				],
				distractors: [],
			});
		});
	});
});

describe('parseParsons — selection + shuffle (injectable random)', () => {
	const SOURCE =
		'a();\nb();\nc();\nx(); // distractor\ny(); // distractor\nz(); // distractor';

	it('keeps all three solution lines', () => {
		expect(parseParsons(SOURCE, 2, () => 0).solution).toHaveLength(3);
	});

	it('selects min(maxDistractors, declared) distractors', () => {
		expect(parseParsons(SOURCE, 2, () => 0).distractors).toHaveLength(2);
	});

	it('caps at the declared count when maxDistractors exceeds it', () => {
		expect(parseParsons(SOURCE, 10, () => 0).distractors).toHaveLength(3);
	});

	it('handles zero declared distractors (no crash, pool is the solution)', () => {
		expect(parseParsons('a();\nb();\nc();', 10, () => 0).pool).toHaveLength(3);
	});

	it('clamps a negative maxDistractors to zero', () => {
		expect(parseParsons(SOURCE, -1, () => 0).distractors).toHaveLength(0);
	});

	it('actually shuffles the pool (deterministic Fisher–Yates under random() = 0)', () => {
		expect(parseParsons('a();\nb();\nc();', 0, () => 0).pool).toEqual([
			'line-1',
			'line-2',
			'line-0',
		]);
	});

	it('suppresses distractors entirely when maxDistractors is 0', () => {
		expect(
			parseParsons(SOURCE, 0, () => 0).pool.toSorted((left, right) =>
				left.localeCompare(right),
			),
		).toEqual(['line-0', 'line-1', 'line-2']);
	});

	it('pool is a permutation of the solution + selected-distractor ids', () => {
		const result = parseParsons(SOURCE, 2, () => 0);
		expect(
			result.pool.toSorted((left, right) => left.localeCompare(right)),
		).toEqual(
			[
				...result.solution.map((line) => line.id),
				...result.distractors.map((line) => line.id),
			].toSorted((left, right) => left.localeCompare(right)),
		);
	});

	it('selected distractors are a subset of the declared distractors', () => {
		const declaredIds = new Set(
			parseLines(SOURCE).distractors.map((line) => line.id),
		);
		expect(
			parseParsons(SOURCE, 2, () => 0).distractors.every((line) =>
				declaredIds.has(line.id),
			),
		).toBe(true);
	});

	it('leaves the solution lines (order + content) untouched by random', () => {
		expect(parseParsons(SOURCE, 3, () => 0).solution).toEqual(
			parseParsons(SOURCE, 3, () => 0.999).solution,
		);
	});
});

describe('extractHints — block-comment hints', () => {
	it('returns no hints when there are no block comments', () => {
		expect(extractHints('const a = 1;\nconst b = 2;').hints).toEqual([]);
	});

	it('returns the source unchanged when there are no block comments', () => {
		expect(extractHints('const a = 1;\nconst b = 2;').code).toBe(
			'const a = 1;\nconst b = 2;',
		);
	});

	it('extracts a plain block comment as a hint (summary null)', () => {
		expect(
			extractHints('const a = 1;\n/* think about order */\nconst b = 2;').hints,
		).toEqual([{ summary: null, body: 'think about order' }]);
	});

	it('strips the extracted block from the orderable code', () => {
		expect(
			parseLines(
				extractHints('const a = 1;\n/* think about order */\nconst b = 2;')
					.code,
			).solution.map((line) => line.code),
		).toEqual(['const a = 1;', 'const b = 2;']);
	});

	it('parses a parsons-collapse: marker into summary + body', () => {
		expect(
			extractHints(
				'/*\nparsons-collapse: Hint\nthink about the loop\n*/\nconst a = 1;',
			).hints,
		).toEqual([{ summary: 'Hint', body: 'think about the loop' }]);
	});

	it('extracts multiple blocks in source order', () => {
		expect(
			extractHints(
				'/* first */\nconst a = 1;\n/* second */\nconst b = 2;',
			).hints.map((hint) => hint.body),
		).toEqual(['first', 'second']);
	});

	it('handles an empty block comment (empty body, summary null)', () => {
		expect(extractHints('/**/\nconst a = 1;').hints).toEqual([
			{ summary: null, body: '' },
		]);
	});

	it('strips an own-line indented block without leaving a phantom indent', () => {
		expect(
			parseLines(
				extractHints('const a = 1;\n  /* note */\nconst b = 2;').code,
			).solution.map((line) => line.indent),
		).toEqual([0, 0]);
	});

	it('does not disturb // distractor parsing', () => {
		expect(
			parseLines(
				extractHints('/* hint */\nconst a = 1;\nconst x = 9; // distractor')
					.code,
			).distractors.map((line) => line.code),
		).toEqual(['const x = 9;']);
	});

	it('trims the summary text after the marker', () => {
		expect(
			extractHints('/* parsons-collapse:  Padded\ncontent */').hints[0],
		).toEqual({ summary: 'Padded', body: 'content' });
	});

	it('keeps body content BOTH before and after the marker line (line excised, not split)', () => {
		expect(
			extractHints('/*\npreamble\nparsons-collapse: Cap\npostamble\n*/')
				.hints[0],
		).toEqual({ summary: 'Cap', body: 'preamble\npostamble' });
	});

	it('preserves INTERIOR whitespace of a multi-line body (outer-trim only)', () => {
		expect(
			extractHints('/*\nfirst line\n  indented line\nlast line\n*/').hints[0]
				?.body,
		).toBe('first line\n  indented line\nlast line');
	});

	it('a parsons-collapse: with no text yields summary "" (empty string), not null', () => {
		expect(
			extractHints('/*\nparsons-collapse:\nsome body\n*/').hints[0],
		).toEqual({ summary: '', body: 'some body' });
	});

	it('detects the marker per-block (mixed: first labelled, second plain)', () => {
		expect(
			extractHints(
				'/* parsons-collapse: Head\nbody here\n*/\nconst a = 1;\n/* plain */',
			).hints,
		).toEqual([
			{ summary: 'Head', body: 'body here' },
			{ summary: null, body: 'plain' },
		]);
	});

	it('extracts an INLINE mid-line block too (faithful to the legacy regex; the code line joins)', () => {
		expect(extractHints('const a = 1; /* x */ + 2;')).toEqual({
			code: 'const a = 1;+ 2;',
			hints: [{ summary: null, body: 'x' }],
		});
	});

	it('treats only the FIRST parsons-collapse: line as the marker; a second stays in body', () => {
		expect(
			extractHints(
				'/*\nparsons-collapse: First\nbody\nparsons-collapse: Second\nmore\n*/',
			).hints[0],
		).toEqual({
			summary: 'First',
			body: 'body\nparsons-collapse: Second\nmore',
		});
	});
});

describe('parseParsons — hints threading', () => {
	it('returns extracted hints on ParsedParsons.hints', () => {
		expect(
			parseParsons(
				'/* parsons-collapse: Tip\nread the spec\n*/\nconst a = 1;\nconst b = 2;',
				10,
				() => 0,
			).hints,
		).toEqual([{ summary: 'Tip', body: 'read the spec' }]);
	});

	it('excludes hint blocks from the solution and pool', () => {
		expect(
			parseParsons(
				'/* parsons-collapse: Tip\nread the spec\n*/\nconst a = 1;\nconst b = 2;',
				10,
				() => 0,
			).solution.map((line) => line.code),
		).toEqual(['const a = 1;', 'const b = 2;']);
	});

	it('a hint-only source yields an empty exercise (no crash)', () => {
		expect(parseParsons('/* just a hint */', 10, () => 0)).toEqual({
			solution: [],
			distractors: [],
			pool: [],
			hints: [{ summary: null, body: 'just a hint' }],
		});
	});

	it('no block comments → empty hints', () => {
		expect(parseParsons('const a = 1;', 10, () => 0).hints).toEqual([]);
	});
});
