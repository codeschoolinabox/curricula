import { describe, it, expect } from 'vitest';

import parseBestEffort from '../parse-best-effort.js';

describe('parseBestEffort', () => {
	describe('valid module code', () => {
		it('returns a Program node', () => {
			const result = parseBestEffort('let x = 5;');
			expect(result).not.toBeNull();
			expect(result!.type).toBe('Program');
		});
	});

	describe('location data', () => {
		it('includes location info on parsed nodes', () => {
			const result = parseBestEffort('let x = 5;');
			expect(result!.loc).toBeDefined();
		});
	});

	describe('script-mode fallback', () => {
		it('parses code that only works in script mode', () => {
			const result = parseBestEffort('with ({}) {}');
			expect(result).not.toBeNull();
		});
	});

	describe('unparseable input', () => {
		it('returns null for garbage input', () => {
			expect(parseBestEffort('}{}{}{!@#$%')).toBeNull();
		});
	});

	describe('never throws', () => {
		it('returns null instead of throwing for broken code', () => {
			expect(() => parseBestEffort('let let let =')).not.toThrow();
		});
	});

	describe('empty string', () => {
		it('parses an empty program', () => {
			const result = parseBestEffort('');
			expect(result).not.toBeNull();
			expect(result!.type).toBe('Program');
		});
	});
});
