import { describe, it, expect } from 'vitest';

import parseProgram from '../parse-program.js';

describe('parseProgram', () => {
	describe('successful parsing', () => {
		it('returns a Program node for valid JS', () => {
			const result = parseProgram('let x = 5;');
			expect(result.type).toBe('Program');
		});

		it('includes location data on the Program node', () => {
			const result = parseProgram('let x = 5;');
			expect(result.loc).toBeDefined();
			expect(result.loc!.start.line).toBe(1);
		});

		it('defaults to script sourceType', () => {
			const result = parseProgram('let x = 5;');
			expect(result.sourceType).toBe('script');
		});

		it('respects module sourceType', () => {
			const result = parseProgram('let x = 5;', 'module');
			expect(result.sourceType).toBe('module');
		});

		it('parses an empty string as a valid empty program', () => {
			const result = parseProgram('');
			expect(result.type).toBe('Program');
			expect(result.body).toHaveLength(0);
		});
	});

	describe('parse errors', () => {
		it('returns a ParseError for syntax errors', () => {
			const result = parseProgram('let = ;');
			expect(result).toHaveProperty('message');
			expect(result).toHaveProperty('location');
		});

		it('includes line and column in the ParseError', () => {
			const result = parseProgram('let x = 5;\nlet = ;');
			if ('message' in result) {
				expect(result.location.line).toBe(2);
			} else {
				expect.fail('expected a ParseError');
			}
		});
	});
});
