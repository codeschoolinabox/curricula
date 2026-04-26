/**
 * @file Unit tests for `createDefaultRegistry`.
 *
 * ZOMBIES order:
 *   Zero — the editor lens is registered under name `'editor'`
 *          (identity-checked against the imported module) so the
 *          orchestrator's `registry.getLens('editor')` finds the
 *          real handle.
 *   One  — the highlight lens is registered under name `'highlight'`
 *          (same identity check). Both lenses coexist; the registry
 *          carries one entry per name.
 */

import { describe, expect, it } from 'vitest';

import editor from '../../lenses/editor/editor.js';
import highlight from '../../lenses/highlight/highlight.js';
import createDefaultRegistry from '../default-registry.js';

describe('createDefaultRegistry', () => {
	describe('Zero — editor lens registered', () => {
		it('getLens("editor") returns a frozen module whose function members reference the original editor exports', () => {
			const registry = createDefaultRegistry();
			const stored = registry.getLens('editor');
			expect(stored).toBeDefined();
			expect(stored?.name).toBe('editor');
			// `register()` shallow-spreads + freezes, so the stored reference is
			// a fresh wrapper, but function members must be reference-shared.
			expect(stored?.lens).toBe(editor.lens);
			expect(stored?.config).toBe(editor.config);
			expect(stored?.recommend).toBe(editor.recommend);
		});
	});

	describe('One — highlight lens registered alongside editor', () => {
		it('getLens("highlight") returns a frozen module whose function members reference the original highlight exports', () => {
			const registry = createDefaultRegistry();
			const stored = registry.getLens('highlight');
			expect(stored).toBeDefined();
			expect(stored?.name).toBe('highlight');
			expect(stored?.lens).toBe(highlight.lens);
			expect(stored?.config).toBe(highlight.config);
			expect(stored?.recommend).toBe(highlight.recommend);
		});
	});
});
