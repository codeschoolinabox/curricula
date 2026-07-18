// @vitest-environment jsdom
import { EditorView } from '@codemirror/view';
import { afterEach, describe, expect, it, vi } from 'vitest';

import createEditor from '../create-editor.js';

function findView(parent: HTMLElement): EditorView {
	const view = EditorView.findFromDOM(parent);
	if (!view) throw new Error('no live EditorView under the given parent');
	return view;
}

function typeSource(parent: HTMLElement, source: string): void {
	const view = findView(parent);
	view.dispatch({
		changes: { from: 0, to: view.state.doc.length, insert: source },
	});
}

describe('createEditor', () => {
	describe('opening a buffer (Zero)', () => {
		it('resolves getContent to the empty string for empty source', async () => {
			const editor = await createEditor('', { onEdit: vi.fn() });
			expect(editor.getContent()).toBe('');
		});

		it('raises no edit event across construction and destroy', async () => {
			const onEdit = vi.fn();
			const editor = await createEditor('', { onEdit });
			editor.destroy();
			expect(onEdit).not.toHaveBeenCalled();
		});
	});

	describe('content reflects the real buffer (One)', () => {
		it('resolves getContent to a non-empty initial source', async () => {
			const editor = await createEditor('const x = 1;', { onEdit: vi.fn() });
			expect(editor.getContent()).toBe('const x = 1;');
		});

		it('reflects a setContent write through getContent', async () => {
			const editor = await createEditor('const x = 1;', { onEdit: vi.fn() });
			editor.setContent('const y = 2;');
			expect(editor.getContent()).toBe('const y = 2;');
		});
	});

	describe('a real surface behind the boundary (Interfaces)', () => {
		it('mounts a CodeMirror surface into the given parent', async () => {
			const parent = document.createElement('section');
			await createEditor('const x = 1;', { onEdit: vi.fn(), parent });
			expect(parent.querySelector('.cm-editor')).not.toBeNull();
		});
	});

	describe('sequential writes (Many)', () => {
		it('reflects the last of three setContent writes', async () => {
			const editor = await createEditor('const x = 1;', { onEdit: vi.fn() });
			editor.setContent('const a = 1;');
			editor.setContent('const b = 2;');
			editor.setContent('const c = 3;');
			expect(editor.getContent()).toBe('const c = 3;');
		});
	});

	describe('teardown sentinel (Boundaries)', () => {
		it('resolves getContent to the empty string after destroy', async () => {
			const editor = await createEditor('const x = 1;', { onEdit: vi.fn() });
			editor.destroy();
			expect(editor.getContent()).toBe('');
		});

		it('treats a second destroy as a no-op', async () => {
			const editor = await createEditor('const x = 1;', { onEdit: vi.fn() });
			editor.destroy();
			expect(() => editor.destroy()).not.toThrow();
		});

		it('drops a setContent write after destroy', async () => {
			const editor = await createEditor('const x = 1;', { onEdit: vi.fn() });
			editor.destroy();
			editor.setContent('const y = 2;');
			expect(editor.getContent()).toBe('');
		});
	});

	describe('edit relay', () => {
		describe('one learner edit (One)', () => {
			it('relays a learner edit as exactly one edit event', async () => {
				const parent = document.createElement('section');
				const onEdit = vi.fn();
				await createEditor('const x = 1;', { onEdit, parent });
				typeSource(parent, 'const x = 12;');
				expect(onEdit).toHaveBeenCalledTimes(1);
			});

			it('carries the full new source on the edit event', async () => {
				const parent = document.createElement('section');
				const onEdit = vi.fn();
				await createEditor('const x = 1;', { onEdit, parent });
				typeSource(parent, 'const x = 12;');
				expect(onEdit).toHaveBeenCalledWith('const x = 12;');
			});
		});

		describe('successive learner edits (Many)', () => {
			it('relays three learner edits as three events in order', async () => {
				const parent = document.createElement('section');
				const onEdit = vi.fn();
				await createEditor('const x = 1;', { onEdit, parent });
				typeSource(parent, 'const a = 1;');
				typeSource(parent, 'const b = 2;');
				typeSource(parent, 'const c = 3;');
				expect(onEdit.mock.calls.map((call) => call[0])).toEqual([
					'const a = 1;',
					'const b = 2;',
					'const c = 3;',
				]);
			});
		});

		describe('own-write echo suppression (Boundaries)', () => {
			it('does not echo a setContent write as an edit event', async () => {
				const parent = document.createElement('section');
				const onEdit = vi.fn();
				const editor = await createEditor('const x = 1;', { onEdit, parent });
				editor.setContent('const y = 2;');
				expect(onEdit).not.toHaveBeenCalled();
			});

			it('still relays a learner edit after an own-write', async () => {
				const parent = document.createElement('section');
				const onEdit = vi.fn();
				const editor = await createEditor('const x = 1;', { onEdit, parent });
				editor.setContent('const y = 2;');
				typeSource(parent, 'const z = 3;');
				expect(onEdit.mock.calls.map((call) => call[0])).toEqual([
					'const z = 3;',
				]);
			});
		});

		describe('an emptied buffer (Boundaries)', () => {
			it('relays clearing the buffer as an edit event with the empty string', async () => {
				const parent = document.createElement('section');
				const onEdit = vi.fn();
				await createEditor('const x = 1;', { onEdit, parent });
				typeSource(parent, '');
				expect(onEdit).toHaveBeenCalledWith('');
			});
		});

		describe('a throwing edit consumer (Exceptions)', () => {
			afterEach(() => {
				vi.restoreAllMocks();
			});

			it('is caught and warned, never thrown', async () => {
				const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
				const parent = document.createElement('section');
				await createEditor('const x = 1;', {
					onEdit: () => {
						throw new Error('consumer failed');
					},
					parent,
				});
				typeSource(parent, 'const x = 2;');
				expect(warnSpy).toHaveBeenCalled();
			});

			it('does not warn when the consumer succeeds', async () => {
				const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
				const parent = document.createElement('section');
				await createEditor('const x = 1;', { onEdit: vi.fn(), parent });
				typeSource(parent, 'const x = 2;');
				expect(warnSpy).not.toHaveBeenCalled();
			});

			it('leaves the buffer editable after the consumer throws', async () => {
				vi.spyOn(console, 'warn').mockImplementation(() => {});
				const parent = document.createElement('section');
				const editor = await createEditor('const x = 1;', {
					onEdit: () => {
						throw new Error('consumer failed');
					},
					parent,
				});
				typeSource(parent, 'const x = 2;');
				typeSource(parent, 'const x = 3;');
				expect(editor.getContent()).toBe('const x = 3;');
			});
		});
	});

	describe('the rendered document (Interfaces)', () => {
		it('renders a setContent write into the visible document text', async () => {
			const parent = document.createElement('section');
			const editor = await createEditor('const x = 1;', {
				onEdit: vi.fn(),
				parent,
			});
			editor.setContent('const y = 42;');
			expect(parent.querySelector('.cm-content')?.textContent).toContain(
				'const y = 42;',
			);
		});
	});
});
