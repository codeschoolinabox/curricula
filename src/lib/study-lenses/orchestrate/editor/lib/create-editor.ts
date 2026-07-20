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
import { Annotation } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';
import type { ViewUpdate } from '@codemirror/view';
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
	{ onEdit, parent }: EditorOptions,
): Promise<EditorInstance> {
	// 1. Mount — resolve the host element (detached unless supplied) and load
	//    the JavaScript grammar; the dynamic import is the async seam that
	//    keeps the grammar out of the host page's initial bundle.
	const element = parent ?? document.createElement('div');
	const { javascript } = await import('@codemirror/lang-javascript');

	// 2. Edit relay — one edit event per learner document change, carrying
	//    the full source as a plain string. Updates whose transactions carry
	//    the own-write tag never echo. A throwing consumer is caught and
	//    warned here, at the factory's own boundary — CodeMirror's internal
	//    exception handling is not the contract (README.md § The single
	//    writer; DOCS.md phase 2).
	function relayEdit(update: ViewUpdate): void {
		if (!update.docChanged) return;
		// Assumes one transaction per update — true for every dispatch in
		// this file and for CM6's own input handling; a future extension that
		// batches multiple transactions into one dispatch would need to check
		// per-transaction, not per-update.
		const isOwnWrite = update.transactions.some(
			(transaction) => transaction.annotation(ownWrite) === true,
		);
		if (isOwnWrite) return;
		try {
			onEdit(update.state.doc.toString());
		} catch (error: unknown) {
			console.warn('onEdit callback threw:', error);
		}
	}

	// v1-trimmed surface: minimalSetup + line numbers + bracket matching + JS
	// syntax highlighting + the editing affordance, and nothing more. NOT
	// basicSetup — it bundles autocompletion, whose popup would reach the
	// learner outside the adapter-only completion rule (completion arrives
	// exclusively through the level adapter; see ../README.md § The
	// level-adapter seam). CodeMirror's tokenizer highlights; it never judges
	// — diagnostics arrive orchestrator-supplied (DOCS.md § Structural
	// constraints).
	const view = new EditorView({
		doc: initialCode,
		parent: element,
		extensions: [
			minimalSetup,
			lineNumbers(),
			bracketMatching(),
			javascript(),
			editingAffordance,
			EditorView.updateListener.of(relayEdit),
		],
	});

	// 4. Teardown's backing state — the dead-sentinel flag every method
	//    consults so a destroyed instance stays callable but inert.
	let destroyed = false;

	return freezeInPlace({
		getContent(): string {
			if (destroyed) return '';
			return view.state.doc.toString();
		},

		// 3. External write — replaces the whole document programmatically,
		//    tagged as an own-write so the edit relay never echoes it.
		setContent(source: string): void {
			if (destroyed) return;
			view.dispatch({
				changes: { from: 0, to: view.state.doc.length, insert: source },
				annotations: ownWrite.of(true),
			});
		},

		destroy(): void {
			if (destroyed) return;
			view.destroy();
			destroyed = true;
		},
	});
}

// The own-write tag: setContent's programmatic dispatch carries it so the
// edit relay can tell a learner edit from the component writing back.
// Transaction-scoped by design — no suppression state outlives the dispatch
// it tags, so a learner edit right after an own-write always relays.
const ownWrite = Annotation.define<boolean>();

// The editing affordance — a visible frame, a minimum height, and a focus
// ring, so the buffer never reads as a static code block (a frameless
// editor is indistinguishable from rendered documentation, and nothing
// invites the click). Styling only — no behavior channel joins the
// v1-trimmed surface. The custom properties resolve in the host page
// (Docusaurus's --ifm-* set here); the fallbacks carry any other host.
const editingAffordance = EditorView.theme({
	'&': {
		backgroundColor: 'var(--ifm-background-surface-color, #fff)',
		border: '1px solid var(--ifm-color-emphasis-300, #ccc)',
		borderRadius: 'var(--ifm-global-radius, 0.4rem)',
	},
	'&.cm-focused': {
		outline: '2px solid var(--ifm-color-primary, #3578e5)',
	},
	'.cm-content': {
		minHeight: '6rem',
	},
});
