/**
 * The async editor factory: wraps CodeMirror 6 entirely behind the callback
 * boundary and resolves to an {@link EditorInstance}. It opens a source buffer
 * for editing and nothing more — the settle debounce, diagnostics, and level
 * adapters all live elsewhere (see ../README.md and ../DOCS.md).
 *
 * @remarks
 * The factory is async because it loads the JavaScript grammar on demand
 * before constructing the view — the seam a level adapter later extends. No
 * CodeMirror type ever crosses out through the resolved instance or its
 * callbacks. After {@link EditorInstance.destroy} the instance is a dead
 * sentinel: reads return the empty string and writes are no-ops (the type's
 * own contract).
 *
 * This module is a stateful-pattern exception to the codebase's
 * no-mutable-closures rule — the instance's methods close over the live
 * CodeMirror view and the `destroyed` sentinel (the library-interfacing
 * exception in DEV.md § 8). `freezeInPlace` freezes the instance's own method
 * properties; the view and sentinel are closure variables, not properties, so
 * teardown stays reachable.
 *
 * @module create-editor
 */

import { bracketMatching } from '@codemirror/language';
import { EditorView, lineNumbers } from '@codemirror/view';
import { minimalSetup } from 'codemirror';

import freezeInPlace from '@utils/freeze-in-place.js';

import type { EditorInstance, EditorOptions } from '../types.js';

/**
 * Build a CodeMirror editor over the given source.
 *
 * @param initialCode - The seed source, as a plain string; any string opens
 *   (malformed code included — whether it parses is irrelevant to editing it).
 * @param options - The mount element and the learner-edit callback.
 * @returns A promise resolving to the wrapped editor instance.
 */
export default async function createEditor(
	initialCode: string,
	{ parent }: EditorOptions,
): Promise<EditorInstance> {
	// 1. Mount — resolve the host element (detached unless supplied) and load
	//    the JavaScript grammar; the dynamic import is the async seam that
	//    keeps the grammar out of the host page's initial bundle.
	const element = parent ?? document.createElement('div');
	const { javascript } = await import('@codemirror/lang-javascript');

	// v1-trimmed surface: minimalSetup + line numbers + bracket matching + JS
	// syntax highlighting, and nothing more. NOT basicSetup — it bundles
	// autocompletion, whose popup would reach the learner outside the
	// adapter-only completion rule (completion arrives exclusively through the
	// level adapter; see ../README.md § The level-adapter seam). CodeMirror's
	// tokenizer highlights; it never judges — diagnostics arrive
	// orchestrator-supplied (DOCS.md § Structural constraints).
	const view = new EditorView({
		doc: initialCode,
		parent: element,
		extensions: [minimalSetup, lineNumbers(), bracketMatching(), javascript()],
	});

	// 4. Teardown's backing state — the dead-sentinel flag every method
	//    consults so a destroyed instance stays callable but inert.
	let destroyed = false;

	return freezeInPlace({
		getContent(): string {
			if (destroyed) return '';
			return view.state.doc.toString();
		},

		// 3. External write — replaces the whole document programmatically.
		setContent(source: string): void {
			if (destroyed) return;
			view.dispatch({
				changes: { from: 0, to: view.state.doc.length, insert: source },
			});
		},

		destroy(): void {
			if (destroyed) return;
			view.destroy();
			destroyed = true;
		},
	});
}
