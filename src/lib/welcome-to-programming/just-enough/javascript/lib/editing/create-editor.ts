/**
 * CodeMirror 6 editor factory with callback-driven extensions.
 *
 * @remarks Async factory — resolves after dynamic language loading and
 * EditorView construction. The resolved instance is post-init: all
 * methods are unconditionally safe to call. Stateful wrapper — mutable
 * closure over the CM EditorView is intentional (DOCS.md §Statefulness
 * Exception). All callbacks passed via options must be pure functions
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
 * extensions internally — callbacks never touch CM types. After
 * `destroy()`, the returned instance remains callable but becomes a
 * dead sentinel (content='', methods no-op).
 *
 * The returned promise **rejects** if CodeMirror construction fails
 * (e.g., malformed extensions, EditorView constructor throws). Callers
 * should `.catch()` or handle the rejection — see `sandbox.html` startup
 * for an example pattern. Language-loading errors are swallowed inside
 * `buildExtensions` (warned + editor continues without highlighting).
 *
 * @param code - Initial editor content
 * @param options - Editor configuration and callbacks
 * @returns A promise resolving to a fully-initialized editor instance.
 */
async function createEditor(code = '', {
	language,
	indentChar = '\t',
	tabSize = 4,
	parent,
	format,
	linters: linterCallbacks,
	docLookup,
	completions,
	onFormat,
}: EditorOptions = {}): Promise<EditorInstance> {
	const initialCode = code;
	const el: HTMLElement = parent ?? document.createElement('div');
	const resolvedLanguage = language ?? 'plaintext';

	// 1. Resolve language + build extensions (async — dynamic imports).
	const extensions = await buildExtensions(resolvedLanguage, {
		indentChar,
		tabSize,
		runFormat,
		...(linterCallbacks ? { linterCallbacks } : {}),
		...(docLookup ? { docLookup } : {}),
		...(completions ? { completions } : {}),
	});

	// 2. Construct the CM EditorView — the returned instance is post-init.
	const editor = new EditorView({
		doc: initialCode,
		parent: el,
		extensions,
	});

	// 3. Destroyed sentinel — short-circuits methods after destroy().
	let destroyed = false;

	// runFormat / runCheck are `function` declarations so they can be passed
	// into buildExtensions above (hoisted). Their bodies close over `editor`
	// and `destroyed`; CM's keymap stores the binding and only invokes `run`
	// on keypress, long after both are initialized — no TDZ at runtime.
	function runFormat(): void {
		if (destroyed || !format) return;

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
		if (destroyed || !linterCallbacks || linterCallbacks.length === 0) {
			return [];
		}

		const currentCode = editor.state.doc.toString();
		const allDiagnostics = runLinterCallbacks(linterCallbacks, currentCode);

		const cmDiagnostics = allDiagnostics.map(
			(d) => toCMDiagnostic(editor.state.doc, d),
		);

		editor.dispatch(setDiagnostics(editor.state, cmDiagnostics));

		return allDiagnostics;
	}

	// perf: skip freeze — stateful editor API requires mutable methods and closures
	return {
		get content(): string {
			if (destroyed) return '';
			return editor.state.doc.toString();
		},

		set content(newCode: string) {
			if (destroyed) return;
			editor.dispatch({
				changes: {
					from: 0,
					to: editor.state.doc.length,
					insert: newCode || '',
				},
			});
		},

		el,

		reset(): void {
			if (destroyed) return;
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
			if (destroyed) return;
			editor.destroy();
			destroyed = true;
		},
	};
}

export default createEditor;
