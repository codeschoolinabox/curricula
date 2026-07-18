// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import createEditor from '../create-editor.js';

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
});
