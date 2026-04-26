/**
 * @file Unit tests for the stub `editor` lens module.
 *
 * ZOMBIES order: Zero (degenerate empty snippet still produces a
 * stub-tagged mount) → One (snippet text is rendered verbatim into the
 * mount element).
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest';

import type { LensMount } from '../../../types.js';
import editor from '../editor.js';

describe('editor lens module (Increment-8 stub)', () => {
	describe('Zero — empty-string snippet', () => {
		it('mounts a `<pre data-lens="editor-stub">` with no text, plus a callable dispose', () => {
			const mount = editor.lens('') as LensMount;
			expect(mount.el.tagName).toBe('PRE');
			expect(mount.el.dataset.lens).toBe('editor-stub');
			expect(mount.el.textContent).toBe('');
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
		it('writes the code argument into el.textContent (defeats hardcoding)', () => {
			const mount = editor.lens('let x = 42;') as LensMount;
			expect(mount.el.textContent).toBe('let x = 42;');
		});
	});
});
