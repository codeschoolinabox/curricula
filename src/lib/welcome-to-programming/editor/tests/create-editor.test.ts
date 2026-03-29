import { describe, it, expect } from 'vitest';

import createEditor from '../create-editor.js';

describe('createEditor', () => {
	describe('returns an object with the expected API surface', () => {
		it('has a content property', () => {
			const editor = createEditor();
			expect(editor).toHaveProperty('content');
		});

		it('has a reset method', () => {
			const editor = createEditor();
			expect(typeof editor.reset).toBe('function');
		});

		it('has a format method', () => {
			const editor = createEditor();
			expect(typeof editor.format).toBe('function');
		});

		it('has a check method', () => {
			const editor = createEditor();
			expect(typeof editor.check).toBe('function');
		});

		it('has a destroy method', () => {
			const editor = createEditor();
			expect(typeof editor.destroy).toBe('function');
		});

		it('does not expose _initializeEditor', () => {
			const editor = createEditor();
			expect(editor).not.toHaveProperty('_initializeEditor');
		});
	});

	describe('content before initialization', () => {
		it('returns the initial code string', () => {
			const editor = createEditor('let x = 5;');
			expect(editor.content).toBe('let x = 5;');
		});

		it('defaults to empty string when no code provided', () => {
			const editor = createEditor();
			expect(editor.content).toBe('');
		});
	});

	describe('safe to call methods before initialization', () => {
		it('reset does not throw', () => {
			const editor = createEditor('let x = 5;');
			expect(() => editor.reset()).not.toThrow();
		});

		it('format does not throw', () => {
			const editor = createEditor('let x = 5;');
			expect(() => editor.format()).not.toThrow();
		});

		it('check returns empty array', () => {
			const editor = createEditor('let x = 5;');
			expect(editor.check()).toStrictEqual([]);
		});

		it('destroy does not throw', () => {
			const editor = createEditor('let x = 5;');
			expect(() => editor.destroy()).not.toThrow();
		});
	});

	describe('format error handling', () => {
		it('does not throw when format callback throws', () => {
			const editor = createEditor('let x = 5;', {
				format() {
					throw new Error('format failed');
				},
			});
			expect(() => editor.format()).not.toThrow();
		});
	});

	describe('check error handling', () => {
		it('does not throw when linter callback throws', () => {
			const editor = createEditor('let x = 5;', {
				linters: [
					function () {
						throw new Error('linter failed');
					},
				],
			});
			expect(() => editor.check()).not.toThrow();
		});

		it('returns empty array when linter callback throws', () => {
			const editor = createEditor('let x = 5;', {
				linters: [
					function () {
						throw new Error('linter failed');
					},
				],
			});
			expect(editor.check()).toStrictEqual([]);
		});

		it('returns empty array when no linters provided', () => {
			const editor = createEditor('let x = 5;');
			expect(editor.check()).toStrictEqual([]);
		});
	});

	describe('options defaults', () => {
		it('accepts empty options object', () => {
			expect(() => createEditor('', {})).not.toThrow();
		});

		it('accepts no arguments at all', () => {
			expect(() => createEditor()).not.toThrow();
		});
	});
});
