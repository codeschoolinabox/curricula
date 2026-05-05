import { describe, it, expect } from 'vitest';

import parseSource from '../parse-source.js';

// ─── Tests ──────────────────────────────────────────────────

describe('parseSource', () => {
	describe('successful module parse', () => {
		it('parses a simple module program', () => {
			const result = parseSource('let x = 5;');
			expect(result.ok).toBe(true);
		});

		it('returns an AST when ok is true', () => {
			const result = parseSource('let x = 5;');
			if (!result.ok) {
				throw new Error('Expected ok: true');
			}
			expect(result.ast).toBeDefined();
			expect(result.ast.type).toBe('Program');
		});
	});

	describe('unparseable input', () => {
		it('returns ok: false for invalid syntax', () => {
			const result = parseSource('}}}invalid{{{');
			expect(result.ok).toBe(false);
		});

		it('error has a message string', () => {
			const result = parseSource('}}}invalid{{{');
			if (result.ok) {
				throw new Error('Expected ok: false');
			}
			expect(typeof result.error.message).toBe('string');
			expect(result.error.message.length).toBeGreaterThan(0);
		});

		it('error may have a location', () => {
			const result = parseSource('}}}invalid{{{');
			if (result.ok) {
				throw new Error('Expected ok: false');
			}
			// Location is optional but if present must have line and column
			if (result.error.location !== undefined) {
				expect(typeof result.error.location.line).toBe('number');
				expect(typeof result.error.location.column).toBe('number');
			}
		});
	});

	describe('script mode with `with` statement', () => {
		it('parses a with statement (easter egg path)', () => {
			const result = parseSource('with (obj) { x; }');
			expect(result.ok).toBe(true);
		});
	});

	describe('edge cases', () => {
		it('handles empty string as a valid empty program', () => {
			const result = parseSource('');
			expect(result.ok).toBe(true);
		});
	});
});
