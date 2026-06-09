/**
 * @file VENDORED — mechanical JS→TS conversion of the legacy
 * `src/utils/noPasteExtension.js` from the pre-V2 study-lenses app. Returns a
 * CodeMirror 6 extension array that blocks paste operations from both keyboard
 * shortcuts (Mod-V, i.e. Ctrl-V on Windows/Linux and Cmd-V on macOS) and DOM
 * paste events (context menu, drag-drop).
 *
 * Used by the writeme wrapper so the learner TYPES the code back rather than
 * pasting it — the anti-cheat heart of the reproduction exercise. Paste is
 * blocked in EVERY editable state (regardless of the `diff` toggle), a
 * deliberate divergence from `blanks` (which permits paste in its diff mode
 * because its placeholders are position-locked); writeme has no anchors, so a
 * paste would smuggle in the whole solution.
 *
 * Vendoring posture: mechanical conversion only; preserve semantics. This
 * directory (`lenses/writeme/lib/**`) is eslint-ignored per `eslint.config.mjs`
 * § Global ignores.
 *
 * Deviations from pure mechanical conversion (intentional, minimal):
 * 1. Named export → default export (the lens has exactly one consumer;
 *    default-export matches V2 convention).
 * 2. Return value shallow-frozen via `Object.freeze` — the closest safe
 *    approximation of DEV.md § 13 for a CM extension array. `freezeInPlace` /
 *    `cloneAndFreeze` are NOT applicable: the elements are third-party CM
 *    extension objects (`Prec.high(...)`, `EditorView.domEventHandlers(...)`)
 *    whose internal identity must not be deep-frozen or cloned.
 * 3. Unused `view` parameter prefixed with `_` to signal intent.
 */

import { Prec } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';

/**
 * @returns array of CodeMirror extensions that block paste operations.
 */
function noPasteExtension(): Extension {
	return Object.freeze([
		// Block keyboard shortcuts (Ctrl+V, Cmd+V)
		Prec.high(
			keymap.of([
				{
					key: 'Mod-v', // Ctrl+V or Cmd+V
					preventDefault: true,
					run: () => {
						// Silently block paste operation
						return true; // Prevents default paste behavior
					},
				},
			]),
		),

		// Block paste from context menu and other sources
		EditorView.domEventHandlers({
			paste(event, _view) {
				// Block all paste events regardless of source
				event.preventDefault();
				return true; // Prevents CodeMirror default paste handling
			},
		}),
	]);
}

export default noPasteExtension;
