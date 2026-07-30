import { describe, expect, it } from 'vitest';
import checkHeadings from '../headings.mjs';
import parseDocument from '../parse.mjs';

function doc(path: string, content: string) {
	return parseDocument({ path, content });
}

describe('checkHeadings', () => {
	it('reports nothing with no baseline documents', () => {
		expect(checkHeadings([doc('A.md', '# Title\n')], [])).toEqual([]);
	});

	it('reports nothing when a baseline heading survives in place', () => {
		const working = [doc('A.md', '# Kept\n')];
		const baseline = [doc('A.md', '# Kept\n')];
		expect(checkHeadings(working, baseline)).toEqual([]);
	});

	it('reports a baseline heading missing from the whole working corpus', () => {
		const working = [doc('A.md', '# Other\n')];
		const baseline = [doc('A.md', '# Vanished section\n')];
		expect(checkHeadings(working, baseline)).toEqual([
			{
				path: 'A.md',
				line: 1,
				check: 'headings',
				severity: 'advisory',
				message: expect.stringContaining('Vanished section'),
			},
		]);
	});

	it('reports each of several distinct lost headings', () => {
		const working = [doc('A.md', 'plain\n')];
		const baseline = [doc('A.md', '# First gone\n# Second gone\n')];
		expect(checkHeadings(working, baseline)).toEqual([
			{
				path: 'A.md',
				line: 1,
				check: 'headings',
				severity: 'advisory',
				message: expect.stringContaining('First gone'),
			},
			{
				path: 'A.md',
				line: 2,
				check: 'headings',
				severity: 'advisory',
				message: expect.stringContaining('Second gone'),
			},
		]);
	});

	it('attributes a lost heading to the right baseline document among several', () => {
		const working = [doc('A.md', 'plain\n'), doc('B.md', 'plain\n')];
		const baseline = [doc('A.md', '# Gone A\n'), doc('B.md', '# Gone B\n')];
		expect(checkHeadings(working, baseline)).toEqual([
			{
				path: 'A.md',
				line: 1,
				check: 'headings',
				severity: 'advisory',
				message: expect.stringContaining('Gone A'),
			},
			{
				path: 'B.md',
				line: 1,
				check: 'headings',
				severity: 'advisory',
				message: expect.stringContaining('Gone B'),
			},
		]);
	});

	it('reports headings from a baseline document deleted from the working corpus', () => {
		const working = [doc('A.md', '# Title\n')];
		const baseline = [doc('OLD.md', '# Orphaned\n')];
		expect(checkHeadings(working, baseline)).toEqual([
			expect.objectContaining({
				path: 'OLD.md',
				severity: 'advisory',
				message: expect.stringContaining('Orphaned'),
			}),
		]);
	});

	it('accepts a heading that moved to another working document', () => {
		const working = [doc('A.md', '# Other\n'), doc('B.md', '# Moved here\n')];
		const baseline = [doc('A.md', '# Moved here\n')];
		expect(checkHeadings(working, baseline)).toEqual([]);
	});

	it('ignores lost non-heading terms', () => {
		const working = [doc('A.md', 'plain\n')];
		const baseline = [doc('A.md', 'a **bold term** here\n')];
		expect(checkHeadings(working, baseline)).toEqual([]);
	});

	it('accepts a baseline heading surviving as prose text', () => {
		const working = [doc('A.md', 'the **Vanished section** note\n')];
		const baseline = [doc('A.md', '# Vanished section\n')];
		expect(checkHeadings(working, baseline)).toEqual([]);
	});
});
