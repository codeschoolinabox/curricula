/**
 * @file Pure-TS tests for the `debug-props` display-derivation core.
 * No React, no jsdom. ZOMBIES coverage of the LensProps → DisplayTree
 * mapping.
 */

import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Snippet } from '../../../../embody/types.js';
import type { LensConfig } from '../../types.js';
import deriveDisplayTree from '../core.js';

/**
 * Placeholder string emitted by the validation panel when
 * `embodiment.validation` is absent (tokenize-fail and parse-fail leaves).
 * MUST match the literal in `core.ts` exactly; drift is caught by both
 * tokenize-fail and parse-fail placeholder tests below.
 */
const VALIDATION_ABSENT_PLACEHOLDER =
	'(validation absent — gated on parse success)';

function makeSnippet(overrides: Partial<Snippet> = {}): Snippet {
	// Base: the canonical apex Snippet via the 'OK' scenario sentinel. Real
	// composition (non-scenario input) currently produces `validated: false,
	// created: false` because validation + creation gates aren't yet wired
	// post-Phase-B, so a real-comp base can't serve as the "apex leaf" the
	// tests below assert against. Overrides shallow-spread on top to
	// construct alternate leaves (parse-fail, tokenize-fail, validate-fail).
	return { ...embody('OK'), ...overrides };
}

describe('deriveDisplayTree', () => {
	it('returns four panels with stable keys [snippet, status, validation, config]', () => {
		const tree = deriveDisplayTree(makeSnippet());
		const keys = tree.panels.map((p) => p.key);
		expect(keys).toEqual(['snippet', 'status', 'validation', 'config']);
	});

	it('snippet panel content is the embodiment source code verbatim', () => {
		const tree = deriveDisplayTree(makeSnippet());
		const panel = tree.panels.find((p) => p.key === 'snippet');
		expect(panel?.content).toBe('OK');
	});

	it('status panel content reflects all four status flags + error kind (apex leaf; errors=null → null)', () => {
		const tree = deriveDisplayTree(makeSnippet());
		const panel = tree.panels.find((p) => p.key === 'status');
		expect(JSON.parse(panel!.content)).toEqual({
			tokenized: true,
			parsed: true,
			validated: true,
			created: true,
			errors: null,
		});
	});

	it('status panel surfaces error kind when embodiment has an error (parse-fail leaf)', () => {
		const snippet = makeSnippet({
			status: {
				tokenized: true,
				parsed: false,
				validated: false,
				created: false,
			},
			errors: {
				phase: 'parse:ast',
				kind: 'SyntaxError',
				message: 'unexpected token',
				loc: null,
			},
		});
		const tree = deriveDisplayTree(snippet);
		const panel = tree.panels.find((p) => p.key === 'status');
		expect(JSON.parse(panel!.content)).toEqual({
			tokenized: true,
			parsed: false,
			validated: false,
			created: false,
			errors: 'SyntaxError',
		});
	});

	it('status panel reads `errors.kind` dynamically (e.g. ReferenceError from create-fail leaf)', () => {
		// Triangulation: a second error-kind variant prevents a hardcoded
		// 'SyntaxError' implementation from passing the suite. Single-parse
		// equality check on the whole status object pins all five fields.
		const snippet = makeSnippet({
			status: {
				tokenized: true,
				parsed: true,
				validated: true,
				created: false,
			},
			errors: {
				phase: 'creation',
				kind: 'ReferenceError',
				message: 'x is not defined',
				loc: null,
			},
		});
		const tree = deriveDisplayTree(snippet);
		const panel = tree.panels.find((p) => p.key === 'status');
		expect(JSON.parse(panel!.content)).toEqual({
			tokenized: true,
			parsed: true,
			validated: true,
			created: false,
			errors: 'ReferenceError',
		});
	});

	it('validate-fail leaf: validation panel renders fields + status panel surfaces validate-phase error', () => {
		// Staircase-coherent validate-fail leaf: parsed succeeded, validate
		// gate failed (isJeJ=false), no streams.create / streams.evaluate.
		// Exercises both the status panel (errors=ValidationError) and the
		// validation panel (fields present with isJeJ=false) for this leaf.
		const snippet = makeSnippet({
			status: {
				tokenized: true,
				parsed: true,
				validated: false,
				created: false,
			},
			validation: {
				isJeJ: false,
				isDeterministic: false,
				doesPause: true,
				formatted: false,
				violations: [
					{
						kind: 'non-jej-construct',
						loc: null,
						message: 'class declarations are not in JeJ',
					} as never,
					{ kind: 'non-jej-construct', loc: null, message: 'foo' } as never,
				],
			},
			errors: {
				phase: 'validation',
				kind: 'ValidationError',
				message: 'snippet contains non-JeJ constructs',
				loc: null,
			},
		});
		const tree = deriveDisplayTree(snippet);

		const statusPanel = tree.panels.find((p) => p.key === 'status');
		expect(JSON.parse(statusPanel!.content)).toEqual({
			tokenized: true,
			parsed: true,
			validated: false,
			created: false,
			errors: 'ValidationError',
		});

		const validationPanel = tree.panels.find((p) => p.key === 'validation');
		expect(JSON.parse(validationPanel!.content)).toEqual({
			formatted: false,
			isJeJ: false,
			isDeterministic: false,
			doesPause: true,
			violationCount: 2,
		});
	});

	// Many — shape leaves with validation absent. The Snippet contract makes
	// validation nullable at tokenize-fail and parse-fail (validation is only
	// computed once parse succeeds — see embody/types.ts § Snippet). The
	// validation panel must render a gate-phrased placeholder rather than
	// crash on null dereference.
	it('validation panel renders placeholder for tokenize-fail leaf (validation absent)', () => {
		const snippet = makeSnippet({
			status: {
				tokenized: false,
				parsed: false,
				validated: false,
				created: false,
			},
			validation: null,
			errors: {
				phase: 'parse:tokenize',
				kind: 'SyntaxError',
				message: 'invalid character',
				loc: null,
			},
		});
		const tree = deriveDisplayTree(snippet);
		const panel = tree.panels.find((p) => p.key === 'validation');
		expect(panel?.content).toBe(VALIDATION_ABSENT_PLACEHOLDER);
	});

	it('validation panel renders placeholder for parse-fail leaf (validation absent)', () => {
		const snippet = makeSnippet({
			status: {
				tokenized: true,
				parsed: false,
				validated: false,
				created: false,
			},
			validation: null,
			errors: {
				phase: 'parse:ast',
				kind: 'SyntaxError',
				message: 'unexpected token',
				loc: null,
			},
		});
		const tree = deriveDisplayTree(snippet);
		const panel = tree.panels.find((p) => p.key === 'validation');
		expect(panel?.content).toBe(VALIDATION_ABSENT_PLACEHOLDER);
	});

	it('config panel says "(empty)" when no config is supplied', () => {
		const tree = deriveDisplayTree(makeSnippet());
		const panel = tree.panels.find((p) => p.key === 'config');
		expect(panel?.content).toBe('(empty)');
	});

	it('config panel says "(empty)" when config is supplied as `{}`', () => {
		const tree = deriveDisplayTree(makeSnippet(), {} as LensConfig);
		const panel = tree.panels.find((p) => p.key === 'config');
		expect(panel?.content).toBe('(empty)');
	});

	it('config panel JSON-stringifies a non-empty config bundle', () => {
		const tree = deriveDisplayTree(makeSnippet(), {
			stepDelay: 500,
			cols: ['value', 'steps'],
		});
		const panel = tree.panels.find((p) => p.key === 'config');
		expect(JSON.parse(panel!.content)).toEqual({
			stepDelay: 500,
			cols: ['value', 'steps'],
		});
	});

	it('does not mutate `embodiment` (read-only views invariant)', () => {
		const snippet = makeSnippet();
		const before = JSON.stringify(snippet);
		deriveDisplayTree(snippet, { stepDelay: 500 });
		expect(JSON.stringify(snippet)).toBe(before);
	});
});
