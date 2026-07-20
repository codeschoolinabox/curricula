// cspell:ignore Prec keymap
/**
 * @file CodeMirror 6 extension array that blocks paste operations from both
 * keyboard shortcuts (Mod-V, i.e. Ctrl-V on Windows/Linux and Cmd-V on macOS)
 * and DOM paste events (context menu, drag-drop).
 *
 * Used by the writeme wrapper so the learner TYPES the code back rather than
 * pasting it — the anti-cheat heart of the reproduction exercise. Paste is
 * blocked in EVERY editable state (regardless of the `diff` toggle): writeme
 * has no anchors, so a paste would smuggle in the whole solution.
 *
 * Return value shallow-frozen via `Object.freeze` — the closest safe
 * approximation of the deep-freeze convention for a CM extension array.
 * `freezeInPlace` / `cloneAndFreeze` are NOT applicable: the elements are
 * third-party CM extension objects (`Prec.high(...)`,
 * `EditorView.domEventHandlers(...)`) whose internal identity must not be
 * deep-frozen or cloned.
 */

import { Prec } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';

/**
 * @returns array of CodeMirror extensions that block paste operations.
 */
export default function noPasteExtension(): Extension {
	return Object.freeze([
		// Block keyboard shortcuts (Ctrl+V, Cmd+V)
		Prec.high(
			keymap.of([
				{
					key: 'Mod-v', // Ctrl+V or Cmd+V
					preventDefault: true,
					// Silently block the paste operation; `true` prevents the
					// default paste behavior.
					run: () => true,
				},
			]),
		),

		// Block paste from context menu and other sources
		EditorView.domEventHandlers({
			paste(event) {
				// Block all paste events regardless of source
				event.preventDefault();
				return true; // Prevents CodeMirror default paste handling
			},
		}),
	]);
}
