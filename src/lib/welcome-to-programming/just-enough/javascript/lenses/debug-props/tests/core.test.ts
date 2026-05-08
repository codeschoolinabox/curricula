/**
 * @file Pure-TS tests for the `debug-props` display-derivation core.
 * No React, no jsdom. ZOMBIES coverage of the LensProps → DisplayTree
 * mapping.
 */

import { describe, expect, it } from 'vitest';

import deriveDisplayTree from '../core.js';

import type { Snippet } from '../../../embody/types.js';

import type { LensConfig } from '../../types.js';

function makeSnippet(overrides: Partial<Snippet> = {}): Snippet {
	return {
		source: { code: 'let x = 1;', offsets: [0] },
		status: { tokenized: true, parsed: true, created: true },
		parse: {},
		validation: {
			isJeJ: true,
			isDeterministic: true,
			doesPause: false,
			formatted: true,
			violations: [],
		},
		errors: null,
		streams: { realm: undefined as never },
		...overrides,
	} as Snippet;
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
		expect(panel?.content).toBe('let x = 1;');
	});

	it('status panel content reflects status flags + error kind (errors=null → null)', () => {
		const tree = deriveDisplayTree(makeSnippet());
		const panel = tree.panels.find((p) => p.key === 'status');
		expect(JSON.parse(panel!.content)).toEqual({
			tokenized: true,
			parsed: true,
			created: true,
			errors: null,
		});
	});

	it('status panel surfaces error kind when embodiment has an error', () => {
		const snippet = makeSnippet({
			status: { tokenized: true, parsed: false, created: false },
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
			created: false,
			errors: 'SyntaxError',
		});
	});

	it('status panel reads `errors.kind` dynamically (e.g. ReferenceError from create-phase)', () => {
		// Triangulation: a second error-kind variant prevents a hardcoded
		// 'SyntaxError' implementation from passing the suite.
		const snippet = makeSnippet({
			status: { tokenized: true, parsed: true, created: false },
			errors: {
				phase: 'create',
				kind: 'ReferenceError',
				message: 'x is not defined',
				loc: null,
			},
		});
		const tree = deriveDisplayTree(snippet);
		const panel = tree.panels.find((p) => p.key === 'status');
		expect(JSON.parse(panel!.content).errors).toBe('ReferenceError');
	});

	it('validation panel reflects all four boolean flags + violation count', () => {
		const snippet = makeSnippet({
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
		});
		const tree = deriveDisplayTree(snippet);
		const panel = tree.panels.find((p) => p.key === 'validation');
		expect(JSON.parse(panel!.content)).toEqual({
			formatted: false,
			isJeJ: false,
			isDeterministic: false,
			doesPause: true,
			violationCount: 2,
		});
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
