import { describe, expect, it } from 'vitest';
import findTableDefects from '../find-table-defects.mjs';

describe('findTableDefects', () => {
	it('finds nothing in a document with no tables', () => {
		expect(findTableDefects('# Title\n\nProse only.\n')).toEqual([]);
	});

	it('accepts a well-formed table', () => {
		expect(findTableDefects('| a | b |\n| --- | --- |\n| 1 | 2 |\n')).toEqual(
			[],
		);
	});

	it('reports a delimiter row wider than its header', () => {
		expect(
			findTableDefects('| a | b |\n| --- | --- | --- |\n').map(
				(defect) => defect.line,
			),
		).toEqual([2]);
	});

	it('reports a delimiter row narrower than its header', () => {
		expect(
			findTableDefects('| a | b | c |\n| --- | --- |\n').map(
				(defect) => defect.line,
			),
		).toEqual([2]);
	});

	it('names both cell counts in the defect', () => {
		expect(findTableDefects('| a | b |\n| --- | --- | --- |\n')[0]).toEqual({
			line: 2,
			headerCells: 2,
			delimiterCells: 3,
		});
	});

	it('counts an escaped pipe as content, not a cell boundary', () => {
		expect(findTableDefects('| a \\| b | c |\n| --- | --- |\n')).toEqual([]);
	});

	it('reports each defective table in a multi-table document', () => {
		expect(
			findTableDefects(
				'| a |\n| --- | --- |\n\ntext\n\n| b | c |\n| --- |\n',
			).map((defect) => defect.line),
		).toEqual([2, 7]);
	});

	it('ignores a delimiter-shaped line that opens no table', () => {
		expect(findTableDefects('text\n\n| --- | --- |\n')).toEqual([]);
	});

	it('ignores pipe tables inside a fenced code block', () => {
		expect(
			findTableDefects('```\n| a | b |\n| --- | --- | --- |\n```\n'),
		).toEqual([]);
	});

	it('accepts alignment colons in the delimiter row', () => {
		expect(findTableDefects('| a | b |\n| :-- | --: |\n')).toEqual([]);
	});
});
