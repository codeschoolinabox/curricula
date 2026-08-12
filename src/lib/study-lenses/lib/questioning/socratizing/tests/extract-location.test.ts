import * as acorn from 'acorn';
import type { Node } from 'acorn';
import { describe, expect, it } from 'vitest';

import extractLocation from '../extract-location.js';

/**
 * `extractLocation` is offset-native: it reads acorn's `start`/`end` character
 * offsets directly and returns a frozen half-open `[start, end)` range. It has
 * NO line/column projection and NO fallback — offsets are present on every
 * acorn node regardless of the `locations` parse option, so these fixtures
 * parse WITHOUT `locations` (matching production `facts.ast`, which is parsed
 * with `locations` off).
 */

const parse = (source: string): acorn.Program =>
	acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module' });

describe('extractLocation', () => {
	describe('zero', () => {
		it('reads a zero-width range from an empty program (no loc present)', () => {
			// `acorn.parse('')` without `locations` yields Program{start:0,end:0}
			// and carries no `.loc` — proving the read needs no location info.
			expect(extractLocation(parse(''))).toEqual({ start: 0, end: 0 });
		});
	});

	describe('one', () => {
		it('extracts the offset range of a single declaration', () => {
			// `let x = 5;` — the VariableDeclaration spans the whole 10-char source.
			const decl = parse('let x = 5;').body[0];
			expect(extractLocation(decl)).toEqual({ start: 0, end: 10 });
		});
	});

	describe('boundaries', () => {
		it('offsets continue across lines (a node on a later line)', () => {
			// `let x = 1;\n` is 11 chars; the second declaration starts at offset 11.
			const secondDecl = parse('let x = 1;\nlet y = 2;').body[1];
			expect(extractLocation(secondDecl)).toEqual({ start: 11, end: 21 });
		});

		it('reads start/end from a minimal node — no loc dependency, no fallback', () => {
			// A node carrying only offsets: the offset flip removed the legacy
			// line-1/column-0 fallback, so the offsets pass straight through.
			const minimal = {
				type: 'Identifier',
				name: 'x',
				start: 0,
				end: 1,
			} as unknown as Node;
			expect(extractLocation(minimal)).toEqual({ start: 0, end: 1 });
		});

		it('returns a frozen range', () => {
			const range = extractLocation(parse('let x = 5;').body[0]);
			expect(Object.isFrozen(range)).toBe(true);
		});

		it('produces a half-open range whose width is the node span', () => {
			// end - start equals the number of source characters the node covers.
			const range = extractLocation(parse('let x = 5;').body[0]);
			expect(range.end - range.start).toBe('let x = 5;'.length);
		});
	});
});
