// cspell:ignore keymap
import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';

import noPasteExtension from '../lib/no-paste-extension.js';

describe('noPasteExtension', () => {
	describe('Zero — structural shape', () => {
		it('returns an array', () => {
			expect(Array.isArray(noPasteExtension())).toBe(true);
		});

		it('returns an array with at least two members (keymap + DOM handler)', () => {
			expect(
				(noPasteExtension() as readonly unknown[]).length,
			).toBeGreaterThanOrEqual(2);
		});

		it('returns a frozen array', () => {
			expect(Object.isFrozen(noPasteExtension())).toBe(true);
		});
	});

	describe('One — composes with EditorState', () => {
		it('is accepted by EditorState.create without throwing', () => {
			expect(() =>
				EditorState.create({
					doc: '',
					extensions: [noPasteExtension()],
				}),
			).not.toThrow();
		});

		it('produces a state whose document reflects the supplied doc string', () => {
			const state = EditorState.create({
				doc: 'hello',
				extensions: [noPasteExtension()],
			});
			expect(state.doc.toString()).toBe('hello');
		});
	});

	describe('Many — successive calls compose without conflict', () => {
		it('two simultaneous registrations of the extension do not throw', () => {
			expect(() =>
				EditorState.create({
					doc: '',
					extensions: [noPasteExtension(), noPasteExtension()],
				}),
			).not.toThrow();
		});
	});

	describe.skip('Behavioral — paste-blocking is verified at the browser gate, not jsdom', () => {
		it.todo('Mod-V keymap dispatch prevents insertion');

		it.todo('DOM paste event is prevented (context menu, drag-drop)');
	});
});
