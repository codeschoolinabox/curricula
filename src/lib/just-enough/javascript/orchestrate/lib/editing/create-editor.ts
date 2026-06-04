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

import { setDiagnostics } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';

import buildExtensions from './build-extensions.js';
import { toCMDiagnostic, runLinterCallbacks } from './to-cm-diagnostic.js';
import type { EditorOptions, EditorInstance, LintDiagnostic } from './types.js';

/**
 * Create a CodeMirror editor instance for editing code.
 *
 * @remarks Accepts pure function callbacks for linting, hover docs,
 * completions, formatting, and change notification. The editor wraps
 * these into CodeMirror extensions internally — callbacks never touch
 * CM types. After `destroy()`, the returned instance remains callable
 * but becomes a dead sentinel (content='', methods no-op).
 *
 * The returned promise **rejects** if CodeMirror construction fails
 * (e.g., malformed extensions, EditorView constructor throws). Callers
 * should `.catch()` or handle the rejection — see `sandbox.html` startup
 * for an example pattern. Language-loading errors are swallowed inside
 * `buildExtensions` (warned + editor continues without highlighting).
 *
 * Takes only the `initialCode` as a plain string; the factory does not
 * consult any AST, parse status, or validation. The editor's role is
 * display-and-edit; whether the source parses is irrelevant to opening
 * it for editing. CodeMirror runs its own tokenizer independently. Any
 * arbitrary string (including malformed code) produces a working editor.
 *
 * @param initialCode - Initial document content as a plain string.
 * @param options - Editor configuration and callbacks
 * @returns A promise resolving to a fully-initialized editor instance.
 */
async function createEditor(
	initialCode: string,
	{
		language,
		indentChar = '\t',
		tabSize = 4,
		parent,
		format,
		linters: linterCallbacks,
		docLookup,
		completions,
		onFormat,
		onChange,
	}: EditorOptions = {},
): Promise<EditorInstance> {
	const element: HTMLElement = parent ?? document.createElement('div');
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

	// 2. If onChange is supplied, wire an updateListener that fires it on
	// every docChanged transaction. Consumer throws are caught + warned so
	// a misbehaving onChange cannot destabilize CM's update cycle (matches
	// the format / linter error contract — see DOCS.md § Error Handling).
	// The `onChange?.` inside notifyOnChange is structurally redundant
	// (the listener is registered only when onChange is truthy) but TS
	// doesn't narrow the destructured optional binding into the nested
	// function declaration, so the optional chain is required for type
	// soundness.
	function notifyOnChange(update: import('@codemirror/view').ViewUpdate): void {
		if (!update.docChanged) return;
		try {
			onChange?.(update.state.doc.toString());
		} catch (error: unknown) {
			console.warn('onChange callback threw:', error);
		}
	}
	const onChangeExtensions = onChange
		? [EditorView.updateListener.of(notifyOnChange)]
		: [];

	// 3. Construct the CM EditorView — the returned instance is post-init.
	const editor = new EditorView({
		doc: initialCode,
		parent: element,
		extensions: [...extensions, ...onChangeExtensions],
	});

	// 4. Destroyed sentinel — short-circuits methods after destroy().
	let destroyed = false;

	// runFormat / runCheck are `function` declarations so they can be passed
	// into buildExtensions above (hoisted). Their bodies close over `editor`
	// and `destroyed`; CM's keymap stores the binding and only invokes `run`
	// on keypress, long after both are initialized — no TDZ at runtime.
	// `format` may be sync or async (the Prettier-based formatter is async).
	// `applyFormat` catches both sync throws and async rejections, and
	// re-checks `destroyed` since the editor may be torn down between the
	// caller invoking `runFormat()` and the dispatch landing.
	async function applyFormat(original: string): Promise<void> {
		if (!format) return;
		try {
			const formatted = await format(original);
			if (destroyed) return;
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
		} catch (error: unknown) {
			console.warn('Format callback threw:', error);
		}
	}

	function runFormat(): void {
		if (destroyed || !format) return;
		void applyFormat(editor.state.doc.toString());
	}

	function runCheck(): readonly LintDiagnostic[] {
		if (destroyed || !linterCallbacks || linterCallbacks.length === 0) {
			return [];
		}

		const currentCode = editor.state.doc.toString();
		const allDiagnostics = runLinterCallbacks(linterCallbacks, currentCode);

		const cmDiagnostics = allDiagnostics.map((d) =>
			toCMDiagnostic(editor.state.doc, d),
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

		el: element,

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
