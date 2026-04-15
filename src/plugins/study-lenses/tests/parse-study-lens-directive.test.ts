/**
 * @file Unit tests for the `@study-lens` directive parser.
 *
 * Inputs are literal file-content strings; no fixture files needed.
 * The parser is a pure function that extracts the directive from a
 * leading comment block. `absPath` is only surfaced in error messages
 * when the directive's JSON body is malformed.
 */

import { describe, expect, it } from 'vitest';

import parseStudyLensDirective from '../parse-study-lens-directive.js';

const P = '/virtual/fixture.js';

describe('parseStudyLensDirective', () => {
	it('empty file → null', () => {
		expect(parseStudyLensDirective('', P)).toBeNull();
	});

	it('file with no directive → null', () => {
		const src = "'use strict';\nconst x = 1;\n";
		expect(parseStudyLensDirective(src, P)).toBeNull();
	});

	it('line comment directive, lens only → lens captured', () => {
		const src = '// @study-lens parsons\nconst x = 1;\n';
		expect(parseStudyLensDirective(src, P)).toEqual({ lens: 'parsons' });
	});

	it('JSDoc single-line directive, lens only → lens captured', () => {
		const src = '/** @study-lens parsons */\nconst x = 1;\n';
		expect(parseStudyLensDirective(src, P)).toEqual({ lens: 'parsons' });
	});

	it('line comment directive with JSON body → lens + lensConfig captured', () => {
		const src = '// @study-lens parsons {"distractors": 4}\n';
		expect(parseStudyLensDirective(src, P)).toEqual({
			lens: 'parsons',
			lensConfig: { distractors: 4 },
		});
	});

	it('JSDoc multi-line block with JSON body on separate line → parsed', () => {
		const src = [
			'/**',
			' * @study-lens parsons',
			' * {"distractors": 4}',
			' */',
			'const x = 1;',
		].join('\n');
		expect(parseStudyLensDirective(src, P)).toEqual({
			lens: 'parsons',
			lensConfig: { distractors: 4 },
		});
	});

	it('`use strict` on line 1 ends the leading block → directive not found', () => {
		const src = "'use strict';\n// @study-lens parsons\n";
		expect(parseStudyLensDirective(src, P)).toBeNull();
	});

	it('blank lines between comments do NOT end the block', () => {
		const src = '// banner\n\n// @study-lens parsons\nconst x = 1;\n';
		expect(parseStudyLensDirective(src, P)).toEqual({ lens: 'parsons' });
	});

	it('malformed JSON body → throws with file path in message', () => {
		const src = '/** @study-lens parsons {bad: json} */\n';
		expect(() => parseStudyLensDirective(src, P)).toThrow(
			/Malformed @study-lens config JSON in .*fixture\.js/,
		);
	});
});
