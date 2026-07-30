import { describe, expect, it } from 'vitest';
import presenceDiff from '../presence-diff.mjs';

function heading(term: string, line = 1, sourcePath = 'S.md') {
	return { kind: 'heading' as const, term, line, sourcePath };
}

function bold(term: string, line = 1, sourcePath = 'S.md') {
	return { kind: 'bold' as const, term, line, sourcePath };
}

describe('presenceDiff', () => {
	it('returns nothing for an empty source', () => {
		expect(presenceDiff([], [heading('Anything')])).toEqual([]);
	});

	it('returns nothing when every source term survives', () => {
		expect(presenceDiff([heading('Kept')], [heading('Kept')])).toEqual([]);
	});

	it('lists a source term absent from every destination', () => {
		expect(presenceDiff([heading('Gone', 3)], [heading('Other')])).toEqual([
			{ kind: 'heading', term: 'Gone', line: 3, sourcePath: 'S.md' },
		]);
	});

	it('lists each distinct lost term with its first source location', () => {
		const source = [heading('Gone A', 2), bold('Gone B', 5)];
		expect(presenceDiff(source, [])).toEqual([
			{ kind: 'heading', term: 'Gone A', line: 2, sourcePath: 'S.md' },
			{ kind: 'bold', term: 'Gone B', line: 5, sourcePath: 'S.md' },
		]);
	});

	it('reports a fully-lost repeated term once, at its first source location', () => {
		const source = [heading('Removed', 2), heading('Removed', 9)];
		expect(presenceDiff(source, [])).toEqual([
			{ kind: 'heading', term: 'Removed', line: 2, sourcePath: 'S.md' },
		]);
	});

	it('treats differently-cased text as a distinct term', () => {
		expect(
			presenceDiff([heading('Data Flow')], [heading('data flow')]),
		).toEqual([
			{ kind: 'heading', term: 'Data Flow', line: 1, sourcePath: 'S.md' },
		]);
	});

	it('matches on text across kinds', () => {
		expect(
			presenceDiff([heading('Loss ledger')], [bold('Loss ledger')]),
		).toEqual([]);
	});

	it('treats a term present once as covering all its source occurrences', () => {
		const source = [heading('Twice', 1), heading('Twice', 9)];
		expect(presenceDiff(source, [bold('Twice')])).toEqual([]);
	});
});
