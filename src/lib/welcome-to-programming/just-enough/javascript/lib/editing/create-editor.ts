/**
 * CodeMirror 6 editor factory with callback-driven extensions.
 *
 * @remarks Stateful wrapper — mutable closures over EditorView are
 * intentional. All callbacks passed via options must be pure functions
 * that never see or return CodeMirror types.
 *
 * @module create-editor
 */

import { EditorView } from '@codemirror/view';
import { setDiagnostics } from '@codemirror/lint';

import buildExtensions from './build-extensions.js';
import { toCMDiagnostic, runLinterCallbacks } from './to-cm-diagnostic.js';

import type { EditorOptions, EditorInstance, LintDiagnostic } from './types.js';

/**
 * Create a CodeMirror editor instance for editing code.
 *
 * @remarks Accepts pure function callbacks for linting, hover docs,
 * completions, and formatting. The editor wraps these into CodeMirror
 * extensions internally — callbacks never touch CM types.
 *
 * @param code - Initial editor content
 * @param options - Editor configuration and callbacks
 * @returns Editor instance with content, el, reset, format, check, destroy
 */
function createEditor(code = '', {
	language,
	indentChar = '\t',
	tabSize = 4,
	parent,
	format,
	linters: linterCallbacks,
	docLookup,
	completions,
	onFormat,
}: EditorOptions = {}): EditorInstance {
	const initialCode = code;
	// Mutable closure vars — stateful by design (CM manages mutable DOM state)
	let editor: EditorView | null = null;
	let el: HTMLElement | null = parent ?? null;
	let initPromise: Promise<void> | null = null;

	const resolvedLanguage = language ?? 'plaintext';

	// --- internal helpers (closed over mutable state) ---

	function runFormat(): void {
		if (!editor || !format) return;

		try {
			const original = editor.state.doc.toString();
			const formatted = format(original);
			const changed = original !== formatted;

			if (changed) {
				editor.dispatch({
					changes: {
						from: 0,
						to: editor.state.doc.length,
						insert: formatted,
					},
				});
			}

			if (onFormat) {
				onFormat({ original, formatted, changed });
			}
		} catch (err: unknown) {
			console.warn('Format callback threw:', err);
		}
	}

	function runCheck(): readonly LintDiagnostic[] {
		if (!editor || !linterCallbacks || linterCallbacks.length === 0) {
			return [];
		}

		const currentCode = editor.state.doc.toString();
		const allDiagnostics = runLinterCallbacks(linterCallbacks, currentCode);

		const cmDiagnostics = allDiagnostics.map(
			(d) => toCMDiagnostic(editor!.state.doc, d),
		);

		editor.dispatch(
			setDiagnostics(editor.state, cmDiagnostics),
		);

		return allDiagnostics;
	}

	// Promise-based guard prevents double initialization from rapid el access
	function initEditor(): Promise<void> {
		if (initPromise) return initPromise;
		initPromise = doInit();
		return initPromise;
	}

	async function doInit(): Promise<void> {
		// exactOptionalPropertyTypes: only include defined callbacks
		const extensions = await buildExtensions(resolvedLanguage, {
			indentChar,
			tabSize,
			runFormat,
			...(linterCallbacks ? { linterCallbacks } : {}),
			...(docLookup ? { docLookup } : {}),
			...(completions ? { completions } : {}),
		});

		editor = new EditorView({
			doc: initialCode,
			parent: el!,
			extensions,
		});
	}

	// If parent was provided, el is already set — trigger init eagerly
	// (the el getter only triggers init when el is null)
	if (parent) initEditor();

	// perf: skip freeze — stateful editor API requires mutable methods and closures
	return {
		get content(): string {
			if (editor) return editor.state.doc.toString();
			return initialCode;
		},

		set content(newCode: string) {
			if (!editor) return;
			editor.dispatch({
				changes: {
					from: 0,
					to: editor.state.doc.length,
					insert: newCode || '',
				},
			});
		},

		get el(): HTMLElement {
			if (el) return el;

			el = document.createElement('div');
			// Async init — editor is ready after the returned promise resolves
			initEditor();
			return el;
		},

		reset(): void {
			if (!editor) return;
			editor.dispatch({
				changes: {
					from: 0,
					to: editor.state.doc.length,
					insert: initialCode,
				},
			});
		},

		format(): void {
			runFormat();
		},

		check(): readonly LintDiagnostic[] {
			return runCheck();
		},

		destroy(): void {
			if (editor) {
				editor.destroy();
				editor = null;
			}
			el = null;
		},
	};
}

export default createEditor;
