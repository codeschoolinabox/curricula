/**
 * @file Unit tests for the stub `editor` lens module.
 *
 * ZOMBIES order: Zero (degenerate empty snippet still produces a
 * stub-tagged mount) → One (snippet text is rendered verbatim into
 * the mount element).
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest';

import type { LensMount } from '../../../types.js';
import editor from '../editor.js';

describe('editor lens module (stub)', () => {
	describe('Zero — empty-string snippet', () => {
		it('mounts a `<textarea data-lens="editor-stub">` with empty value, plus a callable dispose', () => {
			const mount = editor.lens('') as LensMount;
			const textarea = mount.el as HTMLTextAreaElement;
			expect(textarea.tagName).toBe('TEXTAREA');
			expect(textarea.dataset.lens).toBe('editor-stub');
			expect(textarea.value).toBe('');
			expect(typeof mount.dispose).toBe('function');
			expect(() => mount.dispose()).not.toThrow();
		});
	});

	describe('Zero — full LensModule contract is satisfied', () => {
		it('exposes name === "editor" and non-throwing config()/recommend()', () => {
			expect(editor.name).toBe('editor');
			expect(() => editor.config()).not.toThrow();
			expect(editor.config()).toEqual({});
			expect(Object.isFrozen(editor.config())).toBe(true);
			expect(() => editor.recommend({})).not.toThrow();
			expect(editor.recommend({})).toEqual([]);
		});
	});

	describe('One — non-empty snippet is rendered verbatim', () => {
		it('writes the code argument into the textarea value (defeats hardcoding)', () => {
			const mount = editor.lens('let x = 42;') as LensMount;
			const textarea = mount.el as HTMLTextAreaElement;
			expect(textarea.value).toBe('let x = 42;');
		});
	});
});
