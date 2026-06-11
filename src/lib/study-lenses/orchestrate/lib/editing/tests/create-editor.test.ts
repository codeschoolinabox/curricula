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
			const editor = await createEditor('OK');
			expect(editor).toMatchObject({
				content: expect.any(String),
				el: expect.any(HTMLElement),
				reset: expect.any(Function),
				format: expect.any(Function),
				check: expect.any(Function),
				setInterpretedDiagnostics: expect.any(Function),
				destroy: expect.any(Function),
			});
		});
	});

	describe('content reflects real CM state', () => {
		// Test 2 and Test 3 form a triangulation pair: Test 2 alone could be
		// satisfied by an initialCode fallback returning the constructor arg;
		// Test 3's setter-then-read pins the CM document as the true source.
		it('initial content mirrors the initialCode argument', async () => {
			const editor = await createEditor('OK');
			expect(editor.content).toBe('OK');
		});

		it('setter mutates the CM document (triangulates the real-read path)', async () => {
			const editor = await createEditor('OK');
			editor.content = 'xyz';
			expect(editor.content).toBe('xyz');
		});
	});

	describe('reset restores construction code (Many)', () => {
		it('after edit, reset returns content to original', async () => {
			const editor = await createEditor('OK');
			editor.content = 'edited';
			editor.reset();
			expect(editor.content).toBe('OK');
		});
	});

	describe('format callback', () => {
		it('invokes callback with current content', async () => {
			const formatSpy = vi.fn((code: string) => `${code  }!`);
			const editor = await createEditor('OK', { format: formatSpy });
			editor.format();
			expect(formatSpy).toHaveBeenCalledWith('OK');
		});

		it('dispatches return value into editor buffer', async () => {
			const editor = await createEditor('OK', {
				format: (code: string) => `${code  }!`,
			});
			editor.format();
			// Format runs in a microtask (async IIFE) — flush before
			// asserting on dispatched content.
			await Promise.resolve();
			expect(editor.content).toBe('OK!');
		});

		it('dispatches resolved value when format is async', async () => {
			const editor = await createEditor('OK', {
				format: async (code: string) => `${code  }!`,
			});
			editor.format();
			// Async format → wait for the IIFE's await + microtask drain.
			await new Promise((r) => setTimeout(r, 0));
			expect(editor.content).toBe('OK!');
		});
	});

	describe('setInterpretedDiagnostics guard (Boundaries)', () => {
		it('no-ops without throwing on a linter-less editor', async () => {
			// Documented contract (types.ts): the interpreted feed rides the
			// linter pipeline, which is only installed when `linters` exist —
			// a linter-less editor treats pushes as silent no-ops.
			const editor = await createEditor('OK');
			expect(() => {
				editor.setInterpretedDiagnostics([
					{ line: 1, column: 0, severity: 'error', message: 'pushed' },
				]);
			}).not.toThrow();
		});
	});

	describe('check callback', () => {
		it('invokes linter with current content', async () => {
			const linterSpy = vi.fn((_code: string) => []);
			const editor = await createEditor('OK', { linters: [linterSpy] });
			editor.check();
			expect(linterSpy).toHaveBeenCalledWith('OK');
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
			const editor = await createEditor('OK', { linters: [linterSpy] });
			const result = editor.check();
			expect(result).toHaveLength(1);
			expect(result[0]?.message).toBe('stub diagnostic');
		});

		it('returns the MERGED set after an interpreted push (what renders is what is reported)', async () => {
			// AR-4: pins check()'s merged-return contract — a regression to
			// "linter results only" would desync check() from the gutter
			// (and its setDiagnostics push would wipe interpreted markers).
			const linterSpy = vi.fn((_code: string) => [
				{
					line: 1,
					column: 0,
					severity: 'error' as const,
					message: 'structural diagnostic',
				},
			]);
			const editor = await createEditor('OK', { linters: [linterSpy] });
			editor.setInterpretedDiagnostics([
				{
					line: 2,
					column: 0,
					severity: 'error',
					message: 'interpreted diagnostic',
				},
			]);
			const result = editor.check();
			expect(result).toHaveLength(2);
			expect(result.map((diagnostic) => diagnostic.message)).toEqual(
				expect.arrayContaining([
					'structural diagnostic',
					'interpreted diagnostic',
				]),
			);
		});
	});

	describe('onChange callback', () => {
		// Single change-notification surface for document mutations. Contract
		// (per editing/DOCS.md § Async Factory + § No Analysis at Construction):
		// fires synchronously inside the updateListener on each docChanged
		// transaction with the new document content as a plain string.
		// 1:1 transaction-to-callback, no batching.

		it('Zero — does not fire during initial construction', async () => {
			const onChange = vi.fn();
			await createEditor('OK', { onChange });
			expect(onChange).not.toHaveBeenCalled();
		});

		it('One — fires once when content is set via the setter', async () => {
			const onChange = vi.fn();
			const editor = await createEditor('OK', { onChange });
			editor.content = 'xyz';
			expect(onChange).toHaveBeenCalledOnce();
			expect(onChange).toHaveBeenCalledWith('xyz');
		});

		it('Many — fires once per setter dispatch in order', async () => {
			const onChange = vi.fn();
			const editor = await createEditor('OK', { onChange });
			editor.content = 'aa';
			editor.content = 'bb';
			editor.content = 'cc';
			expect(onChange).toHaveBeenCalledTimes(3);
			expect(onChange.mock.calls.map((c) => c[0])).toEqual(['aa', 'bb', 'cc']);
		});

		it('Triangulation — fires on reset() dispatch (not just setter writes)', async () => {
			// Defeats the setter-facade Fake-It: reset() bypasses the content
			// setter and calls editor.dispatch({ changes }) directly. A correct
			// updateListener wiring fires onChange on every docChanged
			// transaction — including this one. A setter-facade implementation
			// (which calls onChange from inside the content setter) would NOT
			// fire here.
			const onChange = vi.fn();
			const editor = await createEditor('OK', { onChange });
			editor.content = 'edited';
			onChange.mockClear();
			editor.reset();
			expect(onChange).toHaveBeenCalledOnce();
			expect(onChange).toHaveBeenCalledWith('OK');
		});

		it('Triangulation — fires on format() dispatch as well', async () => {
			// Reinforces the "all docChanged transactions" contract: format()
			// also dispatches changes, and onChange fires for that dispatch.
			const onChange = vi.fn();
			const editor = await createEditor('OK', {
				format: (code: string) => `${code  }!`,
				onChange,
			});
			editor.format();
			await Promise.resolve();
			expect(onChange).toHaveBeenCalledWith('OK!');
		});

		it('Boundaries — post-destroy: onChange does not fire on dropped setter writes', async () => {
			const onChange = vi.fn();
			const editor = await createEditor('OK', { onChange });
			editor.destroy();
			editor.content = 'xyz';
			expect(onChange).not.toHaveBeenCalled();
		});

		it('Interfaces — omitted onChange does not crash the factory', async () => {
			const editor = await createEditor('OK');
			expect(() => {
				editor.content = 'xyz';
			}).not.toThrow();
		});

		it('Exceptions — onChange throwing does not crash the editor (caught + warned)', async () => {
			// Matches the format / linter callback error contract: consumer
			// throws are caught at the editor boundary and surfaced via
			// console.warn so a misbehaving onChange consumer does not
			// destabilize CodeMirror's update cycle.
			const warnSpy = vi
				.spyOn(console, 'warn')
				.mockImplementation(() => {});
			try {
				const editor = await createEditor('OK', {
					onChange: () => {
						throw new Error('onChange failed');
					},
				});
				expect(() => {
					editor.content = 'xyz';
				}).not.toThrow();
				expect(warnSpy).toHaveBeenCalled();
			} finally {
				warnSpy.mockRestore();
			}
		});
	});

	describe('destroy (Boundary)', () => {
		it('tears down — post-destroy content returns empty string', async () => {
			const editor = await createEditor('OK');
			editor.destroy();
			expect(editor.content).toBe('');
		});

		it('post-destroy returns empty even after edits', async () => {
			const editor = await createEditor('OK');
			editor.content = 'xyz';
			editor.destroy();
			expect(editor.content).toBe('');
		});

		it('is idempotent — double destroy does not throw', async () => {
			const editor = await createEditor('OK');
			editor.destroy();
			expect(() => editor.destroy()).not.toThrow();
		});

		it('post-destroy: setter drops, reset/format/check are safe no-ops', async () => {
			const editor = await createEditor('OK');
			editor.destroy();
			editor.content = 'xyz';
			expect(editor.content).toBe('');
			expect(() => editor.reset()).not.toThrow();
			expect(() => editor.format()).not.toThrow();
			expect(editor.check()).toStrictEqual([]);
			expect(() => {
				editor.setInterpretedDiagnostics([
					{ line: 1, column: 0, severity: 'error', message: 'late push' },
				]);
			}).not.toThrow();
		});
	});

	describe('mount location (Interfaces)', () => {
		// CONTRACT: when the parent option is provided, editor.el IS the
		// parent element — not a child wrapper. CM6 attaches its .cm-editor
		// as a child of parent; our factory preserves the parent reference.
		it('parent option: editor.el is the provided element', async () => {
			const parent = document.createElement('section');
			const editor = await createEditor('OK', { parent });
			expect(editor.el).toBe(parent);
		});

		it('parent option: CM mounts its .cm-editor as a child of parent', async () => {
			const parent = document.createElement('section');
			await createEditor('OK', { parent });
			expect(parent.querySelector('.cm-editor')).not.toBeNull();
		});

		it('no parent option: el is a fresh div not attached to any document', async () => {
			const editor = await createEditor('OK');
			expect(editor.el.tagName).toBe('DIV');
			expect(editor.el.parentNode).toBeNull();
		});
	});

	describe('callback errors (Exceptions)', () => {
		let warnSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		});

		afterEach(() => {
			warnSpy.mockRestore();
		});

		it('format callback throwing does not crash', async () => {
			const editor = await createEditor('OK', {
				format(_code: string): string {
					throw new Error('format failed');
				},
			});
			expect(() => editor.format()).not.toThrow();
		});

		it('linter callback throwing does not crash; other linters still run', async () => {
			const goodLinter = vi.fn((_code: string) => []);
			const editor = await createEditor('OK', {
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
			await expect(createEditor('OK', {})).resolves.toBeDefined();
		});
	});
});
