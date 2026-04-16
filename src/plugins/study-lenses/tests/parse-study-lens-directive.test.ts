/**
 * @file Unit tests for the `@study-lens` directive parser.
 *
 * Inputs are literal file-content strings; no fixture files needed.
 * The parser is a pure function that extracts the directive from a
 * leading OR trailing comment block and returns the file content
 * with the directive-carrying comment stripped. `absPath` is only
 * surfaced in error messages (malformed JSON body, both-block
 * ambiguous placement).
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
		expect(parseStudyLensDirective(src, P)?.directive).toEqual({
			lens: 'parsons',
		});
	});

	it('JSDoc single-line directive, lens only → lens captured', () => {
		const src = '/** @study-lens parsons */\nconst x = 1;\n';
		expect(parseStudyLensDirective(src, P)?.directive).toEqual({
			lens: 'parsons',
		});
	});

	it('line comment directive with JSON body → lens + lensConfig captured', () => {
		const src = '// @study-lens parsons {"distractors": 4}\n';
		expect(parseStudyLensDirective(src, P)?.directive).toEqual({
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
		expect(parseStudyLensDirective(src, P)?.directive).toEqual({
			lens: 'parsons',
			lensConfig: { distractors: 4 },
		});
	});

	it('`use strict` on line 1 ends the leading block → directive not found', () => {
		const src = "'use strict';\n// @study-lens parsons\n";
		// Note: under the new parser, the `// @study-lens parsons` line is
		// now in the TRAILING block (after the last code line), so it IS
		// detected. This is a behavior change from the old leading-only
		// parser. The test is updated to reflect the new semantics.
		expect(parseStudyLensDirective(src, P)?.directive).toEqual({
			lens: 'parsons',
		});
	});

	it('blank lines between comments do NOT end the block', () => {
		const src = '// banner\n\n// @study-lens parsons\nconst x = 1;\n';
		expect(parseStudyLensDirective(src, P)?.directive).toEqual({
			lens: 'parsons',
		});
	});

	it('malformed JSON body → throws with file path in message', () => {
		const src = '/** @study-lens parsons {bad: json} */\n';
		expect(() => parseStudyLensDirective(src, P)).toThrow(
			/Malformed @study-lens config JSON in .*fixture\.js/,
		);
	});

	// ─── New tests: strip behavior ──────────────────────────────────────────

	it('single-line `//` directive → strippedCode is code body only', () => {
		const src = '// @study-lens parsons\nconst x = 1;\n';
		expect(parseStudyLensDirective(src, P)?.strippedCode).toBe(
			'const x = 1;\n',
		);
	});

	it('multi-line JSDoc block directive → entire block removed, trailing newline preserved', () => {
		const src = [
			'/**',
			' * @study-lens parsons',
			' * {"distractors": 4}',
			' */',
			"const puzzle = 'x';",
			'',
		].join('\n');
		expect(parseStudyLensDirective(src, P)?.strippedCode).toBe(
			"const puzzle = 'x';\n",
		);
	});

	it('preserves non-directive leading `//` comment separated by blank line', () => {
		const src = '// Author: Eve\n\n// @study-lens parsons\nconst x = 1;\n';
		// The blank between the comments makes them separate line-runs;
		// only the directive-bearing run is stripped.
		expect(parseStudyLensDirective(src, P)?.strippedCode).toBe(
			'// Author: Eve\n\nconst x = 1;\n',
		);
	});

	it('contiguous `//` run is atomic: intro AND directive stripped together', () => {
		const src = '// Author: Eve\n// @study-lens parsons\nconst x = 1;\n';
		// No blank between the two `//` lines → they form ONE line-run
		// comment form, and the whole run is stripped when it contains
		// the tag.
		expect(parseStudyLensDirective(src, P)?.strippedCode).toBe(
			'const x = 1;\n',
		);
	});

	it('shebang preserved when directive appears after it', () => {
		const src = '#!/usr/bin/env node\n/** @study-lens parsons */\nconst x = 1;\n';
		expect(parseStudyLensDirective(src, P)?.strippedCode).toBe(
			'#!/usr/bin/env node\nconst x = 1;\n',
		);
	});

	it('trailing line-comment directive → directive parsed, code body preserved with trailing newline', () => {
		const src = 'const x = 1;\n// @study-lens parsons\n';
		const result = parseStudyLensDirective(src, P);
		expect(result?.directive).toEqual({ lens: 'parsons' });
		expect(result?.strippedCode).toBe('const x = 1;\n');
	});

	it('trailing JSDoc block directive → stripped, trailing newline preserved', () => {
		const src = [
			"const puzzle = 'x';",
			'',
			'/**',
			' * @study-lens parsons',
			' * {"distractors": 4}',
			' */',
			'',
		].join('\n');
		const result = parseStudyLensDirective(src, P);
		expect(result?.directive).toEqual({
			lens: 'parsons',
			lensConfig: { distractors: 4 },
		});
		expect(result?.strippedCode).toBe("const puzzle = 'x';\n");
	});

	it('both leading AND trailing directive → throws ambiguous-placement', () => {
		const src = [
			'// @study-lens parsons',
			'const x = 1;',
			'// @study-lens highlight',
			'',
		].join('\n');
		expect(() => parseStudyLensDirective(src, P)).toThrow(
			/Ambiguous @study-lens placement in .*fixture\.js/,
		);
	});

	it('ambiguous-placement check fires BEFORE JSON-body parse', () => {
		// Leading directive has malformed JSON; trailing directive has
		// valid tag. Both-present check should throw ambiguous-placement
		// (not malformed-JSON) because presence detection precedes parse.
		const src = [
			'/** @study-lens parsons {bad: json} */',
			'const x = 1;',
			'// @study-lens highlight',
			'',
		].join('\n');
		expect(() => parseStudyLensDirective(src, P)).toThrow(
			/Ambiguous @study-lens placement/,
		);
	});

	it('blank-line collapse around leading strip preserves BOF padding, drops interior blank', () => {
		const src = '\n/** @study-lens parsons */\n\nconst x = 1;\n';
		// The blank before the directive sits at the file edge (BOF side)
		// → preserved. The blank between directive and code body is
		// interior → collapsed with the stripped form.
		expect(parseStudyLensDirective(src, P)?.strippedCode).toBe(
			'\nconst x = 1;\n',
		);
	});

	it('blank-line collapse around trailing strip preserves EOF padding, drops interior blank', () => {
		const src = 'const x = 1;\n\n/** @study-lens parsons */\n';
		// The blank between code body and directive is interior →
		// collapsed. The trailing newline after the directive sits at
		// the EOF edge → preserved.
		expect(parseStudyLensDirective(src, P)?.strippedCode).toBe(
			'const x = 1;\n',
		);
	});

	it('directive inside a mid-file comment is NOT detected', () => {
		// The mid-file `// @study-lens parsons` is surrounded by code on
		// both sides, so it belongs to neither leading nor trailing
		// comment block. Parser returns null; the directive is inert.
		const src = [
			"const a = 1;",
			'// @study-lens parsons',
			"const b = 2;",
			'',
		].join('\n');
		expect(parseStudyLensDirective(src, P)).toBeNull();
	});
});
