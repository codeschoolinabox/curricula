/**
 * @file Unit tests for the stub `highlight` lens module.
 *
 * ZOMBIES order: Zero (degenerate empty snippet still produces a
 * stub-tagged mount) → One (snippet text is rendered verbatim into
 * the inner code element).
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest';

import type { LensMount } from '../../../types.js';
import highlight from '../highlight.js';

describe('highlight lens module (stub)', () => {
	describe('Zero — empty-string snippet', () => {
		it('mounts a `<pre data-lens="highlight-stub"><code></code></pre>` with empty content, plus a callable dispose', () => {
			const mount = highlight.lens('') as LensMount;
			expect(mount.el.tagName).toBe('PRE');
			expect(mount.el.dataset.lens).toBe('highlight-stub');
			const codeChild = mount.el.firstElementChild as HTMLElement | null;
			expect(codeChild?.tagName).toBe('CODE');
			expect(codeChild?.textContent).toBe('');
			expect(typeof mount.dispose).toBe('function');
			expect(() => mount.dispose()).not.toThrow();
		});
	});

	describe('Zero — full LensModule contract is satisfied', () => {
		it('exposes name === "highlight" and non-throwing config()/recommend()', () => {
			expect(highlight.name).toBe('highlight');
			expect(() => highlight.config()).not.toThrow();
			expect(highlight.config()).toEqual({});
			expect(Object.isFrozen(highlight.config())).toBe(true);
			expect(() => highlight.recommend({})).not.toThrow();
			expect(highlight.recommend({})).toEqual([]);
		});
	});

	describe('One — non-empty snippet is rendered verbatim', () => {
		it('writes the code argument into the inner code child (defeats hardcoding)', () => {
			const mount = highlight.lens('let x = 42;') as LensMount;
			const codeChild = mount.el.firstElementChild as HTMLElement | null;
			expect(codeChild?.textContent).toBe('let x = 42;');
		});
	});

	describe('Many — produces a fresh mount per call', () => {
		it('returns a different `el` reference on each invocation (no shared singleton)', () => {
			const a = highlight.lens('a;') as LensMount;
			const b = highlight.lens('a;') as LensMount;
			expect(a.el).not.toBe(b.el);
		});
	});
});
