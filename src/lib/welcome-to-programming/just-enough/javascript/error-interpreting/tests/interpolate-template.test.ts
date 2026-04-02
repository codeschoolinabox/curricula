import { describe, it, expect } from 'vitest';

import interpolateTemplate from '../interpolate-template.js';

describe('interpolateTemplate', () => {
	describe('single placeholder', () => {
		it('replaces a single placeholder with its value', () => {
			expect(interpolateTemplate('Hello {{name}}!', { name: 'world' })).toBe(
				'Hello world!',
			);
		});
	});

	describe('multiple different placeholders', () => {
		it('replaces each placeholder with its corresponding value', () => {
			expect(
				interpolateTemplate('{{errorName}} on line {{line}}', {
					errorName: 'TypeError',
					line: '5',
				}),
			).toBe('TypeError on line 5');
		});
	});

	describe('repeated placeholder', () => {
		it('replaces all occurrences of the same placeholder', () => {
			expect(
				interpolateTemplate('{{name}} and {{name}} again', { name: 'x' }),
			).toBe('x and x again');
		});
	});

	describe('unmatched placeholders', () => {
		it('leaves unmatched placeholders unchanged', () => {
			expect(
				interpolateTemplate('{{name}} is {{actualType}}', { name: 'x' }),
			).toBe('x is {{actualType}}');
		});
	});

	describe('empty context', () => {
		it('returns the template unchanged when context is empty', () => {
			expect(interpolateTemplate('no placeholders here', {})).toBe(
				'no placeholders here',
			);
		});
	});

	describe('empty template', () => {
		it('returns an empty string for an empty template', () => {
			expect(interpolateTemplate('', { name: 'x' })).toBe('');
		});
	});

	describe('placeholder at boundaries', () => {
		it('replaces a placeholder at the start of the string', () => {
			expect(interpolateTemplate('{{name}} is here', { name: 'x' })).toBe(
				'x is here',
			);
		});

		it('replaces a placeholder at the end of the string', () => {
			expect(interpolateTemplate('value is {{name}}', { name: 'x' })).toBe(
				'value is x',
			);
		});
	});
});
