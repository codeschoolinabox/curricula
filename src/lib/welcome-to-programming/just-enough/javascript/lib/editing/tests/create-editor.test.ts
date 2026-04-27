// @vitest-environment jsdom
// CodeMirror 6 EditorView construction in the async createEditor factory
// requires a DOM. detect-language.test.ts stays on the workspace-default
// `node` env — it's a pure language-identifier lookup with no DOM involvement.
// Rule of thumb: if a test instantiates new EditorView(...) or touches
// document/window, add the directive; otherwise leave it off.
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';

import createEditor from '../create-editor.js';

describe('createEditor', () => {
	describe('factory shape (Zero)', () => {
		it('returns an object with the expected API surface', async () => {
			const editor = await createEditor();
			expect(editor).toMatchObject({
				content: expect.any(String),
				el: expect.any(HTMLElement),
				reset: expect.any(Function),
				format: expect.any(Function),
				check: expect.any(Function),
				destroy: expect.any(Function),
			});
		});
	});

	describe('content reflects real CM state', () => {
		// Test 2 and Test 3 form a triangulation pair: Test 2 alone could be
		// satisfied by an initialCode fallback returning the constructor arg;
		// Test 3's setter-then-read pins the CM document as the true source.
		it('initial content mirrors the code argument', async () => {
			const editor = await createEditor('abc');
			expect(editor.content).toBe('abc');
		});

		it('setter mutates the CM document (triangulates the real-read path)', async () => {
			const editor = await createEditor('abc');
			editor.content = 'xyz';
			expect(editor.content).toBe('xyz');
		});
	});

	describe('reset restores construction code (Many)', () => {
		it('after edit, reset returns content to original', async () => {
			const editor = await createEditor('abc');
			editor.content = 'edited';
			editor.reset();
			expect(editor.content).toBe('abc');
		});
	});

	describe('format callback', () => {
		it('invokes callback with current content', async () => {
			const formatSpy = vi.fn((code: string) => code.toUpperCase());
			const editor = await createEditor('abc', { format: formatSpy });
			editor.format();
			expect(formatSpy).toHaveBeenCalledWith('abc');
		});

		it('dispatches return value into editor buffer', async () => {
			const editor = await createEditor('abc', {
				format: (code: string) => code.toUpperCase(),
			});
			editor.format();
			// Format runs in a microtask (async IIFE) — flush before
			// asserting on dispatched content.
			await Promise.resolve();
			expect(editor.content).toBe('ABC');
		});

		it('dispatches resolved value when format is async', async () => {
			const editor = await createEditor('abc', {
				format: async (code: string) => code.toUpperCase(),
			});
			editor.format();
			// Async format → wait for the IIFE's await + microtask drain.
			await new Promise((r) => setTimeout(r, 0));
			expect(editor.content).toBe('ABC');
		});
	});

	describe('check callback', () => {
		it('invokes linter with current content', async () => {
			const linterSpy = vi.fn((_code: string) => []);
			const editor = await createEditor('abc', { linters: [linterSpy] });
			editor.check();
			expect(linterSpy).toHaveBeenCalledWith('abc');
		});

		it('returns diagnostics from the linter', async () => {
			const linterSpy = vi.fn((_code: string) => [
				{
					line: 1,
					column: 0,
					severity: 'error' as const,
					message: 'stub diagnostic',
				},
			]);
			const editor = await createEditor('abc', { linters: [linterSpy] });
			const result = editor.check();
			expect(result).toHaveLength(1);
			expect(result[0]?.message).toBe('stub diagnostic');
		});
	});

	describe('destroy (Boundary)', () => {
		it('tears down — post-destroy content returns empty string', async () => {
			const editor = await createEditor('abc');
			editor.destroy();
			expect(editor.content).toBe('');
		});

		it('post-destroy returns empty even after edits', async () => {
			const editor = await createEditor('abc');
			editor.content = 'xyz';
			editor.destroy();
			expect(editor.content).toBe('');
		});

		it('is idempotent — double destroy does not throw', async () => {
			const editor = await createEditor('abc');
			editor.destroy();
			expect(() => editor.destroy()).not.toThrow();
		});

		it('post-destroy: setter drops, reset/format/check are safe no-ops', async () => {
			const editor = await createEditor('abc');
			editor.destroy();
			editor.content = 'xyz';
			expect(editor.content).toBe('');
			expect(() => editor.reset()).not.toThrow();
			expect(() => editor.format()).not.toThrow();
			expect(editor.check()).toStrictEqual([]);
		});
	});

	describe('mount location (Interfaces)', () => {
		// CONTRACT: when the parent option is provided, editor.el IS the
		// parent element — not a child wrapper. CM6 attaches its .cm-editor
		// as a child of parent; our factory preserves the parent reference.
		it('parent option: editor.el is the provided element', async () => {
			const parent = document.createElement('section');
			const editor = await createEditor('x', { parent });
			expect(editor.el).toBe(parent);
		});

		it('parent option: CM mounts its .cm-editor as a child of parent', async () => {
			const parent = document.createElement('section');
			await createEditor('x', { parent });
			expect(parent.querySelector('.cm-editor')).not.toBeNull();
		});

		it('no parent option: el is a fresh div not attached to any document', async () => {
			const editor = await createEditor('x');
			expect(editor.el.tagName).toBe('DIV');
			expect(editor.el.parentNode).toBeNull();
		});
	});

	describe('callback errors (Exceptions)', () => {
		let warnSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		});

		afterEach(() => {
			warnSpy.mockRestore();
		});

		it('format callback throwing does not crash', async () => {
			const editor = await createEditor('abc', {
				format(_code: string): string {
					throw new Error('format failed');
				},
			});
			expect(() => editor.format()).not.toThrow();
		});

		it('linter callback throwing does not crash; other linters still run', async () => {
			const goodLinter = vi.fn((_code: string) => []);
			const editor = await createEditor('abc', {
				linters: [
					function throwingLinter(_code: string): readonly [] {
						throw new Error('linter failed');
					},
					goodLinter,
				],
			});
			expect(() => editor.check()).not.toThrow();
			expect(goodLinter).toHaveBeenCalled();
		});
	});

	describe('options defaults (Simple)', () => {
		it('accepts empty options object', async () => {
			await expect(createEditor('', {})).resolves.toBeDefined();
		});

		it('accepts no arguments at all', async () => {
			await expect(createEditor()).resolves.toBeDefined();
		});
	});
});
