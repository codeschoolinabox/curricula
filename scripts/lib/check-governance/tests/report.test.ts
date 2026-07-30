import { describe, expect, it } from 'vitest';
import formatReport from '../report.mjs';

function finding(overrides = {}) {
	return {
		path: 'A.md',
		line: 1,
		check: 'links' as const,
		severity: 'error' as const,
		message: 'dead link',
		...overrides,
	};
}

describe('formatReport', () => {
	it('reports a clean corpus with exit 0', () => {
		expect(formatReport([], ['A.md'])).toEqual({
			text: expect.stringContaining('clean'),
			exitCode: 0,
		});
	});

	it('sets exit 1 for an error finding', () => {
		const { exitCode } = formatReport([finding()], ['A.md']);
		expect(exitCode).toBe(1);
	});

	it('keeps exit 0 for advisory-only findings', () => {
		const { exitCode } = formatReport(
			[finding({ severity: 'advisory' })],
			['A.md'],
		);
		expect(exitCode).toBe(0);
	});

	it('groups findings under their document in corpus order', () => {
		const findings = [
			finding({ path: 'B.md', message: 'second doc' }),
			finding({ path: 'A.md', message: 'first doc' }),
		];
		const { text } = formatReport(findings, ['A.md', 'B.md']);
		expect(text.indexOf('first doc')).toBeLessThan(text.indexOf('second doc'));
	});

	it('orders findings within a document by line, null first', () => {
		const findings = [
			finding({ line: 9, message: 'later line' }),
			finding({ line: null, message: 'whole document' }),
			finding({ line: 2, message: 'early line' }),
		];
		const { text } = formatReport(findings, ['A.md']);
		expect(text.indexOf('whole document')).toBeLessThan(
			text.indexOf('early line'),
		);
		expect(text.indexOf('early line')).toBeLessThan(text.indexOf('later line'));
	});

	describe('labels each finding with its severity and check', () => {
		const { text } = formatReport(
			[finding({ severity: 'advisory', check: 'headings' })],
			['A.md'],
		);

		it('names the severity', () => {
			expect(text).toContain('advisory');
		});

		it('names the reporting check', () => {
			expect(text).toContain('headings');
		});
	});

	describe('counts errors and advisories in a summary line', () => {
		const findings = [finding(), finding({ severity: 'advisory', line: 3 })];
		const { text } = formatReport(findings, ['A.md']);

		it('counts the errors', () => {
			expect(text).toMatch(/1 error/);
		});

		it('counts the advisories', () => {
			expect(text).toMatch(/1 advisor/);
		});
	});
});
