/**
 * CodeMirror 6 editor factory with callback-driven extensions.
 *
 * Stateful wrapper — mutable closures over EditorView are intentional.
 * All callbacks passed via options must be pure functions that never
 * see or return CodeMirror types.
 *
 * @module create-editor
 */

import { EditorView, keymap, hoverTooltip } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { autocompletion, closeBrackets } from '@codemirror/autocomplete';
import { linter, lintGutter, setDiagnostics } from '@codemirror/lint';
import { search, highlightSelectionMatches } from '@codemirror/search';
import { bracketMatching, foldGutter, indentUnit } from '@codemirror/language';
import { indentWithTab } from '@codemirror/commands';

// --- CodeMirror language loading (private to this module) ---

// Maps language identifiers to dynamic import thunks for CM packages
const CM_LOADERS = Object.freeze({
	javascript: () => import('@codemirror/lang-javascript'),
	// TypeScript uses the JavaScript package
	typescript: () => import('@codemirror/lang-javascript'),
	python: () => import('@codemirror/lang-python'),
	html: () => import('@codemirror/lang-html'),
	css: () => import('@codemirror/lang-css'),
	markdown: () => import('@codemirror/lang-markdown'),
	json: () => import('@codemirror/lang-json'),
	xml: () => import('@codemirror/lang-xml'),
	// OpenQASM uses JavaScript highlighting as a reasonable fallback
	openqasm2: () => import('@codemirror/lang-javascript'),
});

// Maps language identifiers to the function name on the CM package
const CM_FUNCTION_NAMES = Object.freeze({
	javascript: 'javascript',
	typescript: 'javascript',
	python: 'python',
	html: 'html',
	css: 'css',
	markdown: 'markdown',
	json: 'json',
	xml: 'xml',
	openqasm2: 'javascript',
});

/**
 * Create a CodeMirror editor instance for editing code.
 *
 * Accepts pure function callbacks for linting, hover docs, completions,
 * and formatting. The editor wraps these into CodeMirror extensions
 * internally — callbacks never touch CM types.
 *
 * @param {string} [code=''] - Initial editor content
 * @param {object} [options={}] - Editor configuration and callbacks
 * @param {string}   [options.language] - Language identifier
 * @param {string}   [options.indentChar='\t'] - Indent character
 * @param {number}   [options.tabSize=4] - Visual tab width
 * @param {HTMLElement} [options.parent] - DOM parent (created if not provided)
 * @param {Function}   [options.format] - (code: string) => string
 * @param {Function[]} [options.linters] - [(code: string) => LintDiagnostic[]]
 * @param {Function}   [options.docLookup] - (word: string) => DocEntry | null
 * @param {Function}   [options.completions] - (prefix: string) => CompletionItem[]
 * @param {Function}   [options.onFormat] - (result: FormatResult) => void
 * @returns {{ content: string, el: HTMLElement, reset: Function, format: Function, check: Function, destroy: Function }}
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
} = {}) {
	const initialCode = code;
	let editor = null;
	let el = parent || null;
	let initPromise = null;

	const resolvedLanguage = language || 'plaintext';

	// --- internal helpers (closed over mutable state) ---

	function runFormat() {
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
		} catch (err) {
			console.warn('Format callback threw:', err);
		}
	}

	function runCheck() {
		if (!editor || !linterCallbacks || linterCallbacks.length === 0) {
			return [];
		}

		const currentCode = editor.state.doc.toString();
		const allDiagnostics = runLinterCallbacks(linterCallbacks, currentCode);

		const cmDiagnostics = allDiagnostics.map(
			(d) => toCMDiagnostic(editor.state.doc, d),
		);

		editor.dispatch(
			setDiagnostics(editor.state, cmDiagnostics),
		);

		return allDiagnostics;
	}

	// Promise-based guard prevents double initialization from rapid el access
	function initEditor() {
		if (initPromise) return initPromise;
		initPromise = doInit();
		return initPromise;
	}

	async function doInit() {
		const extensions = await buildExtensions(resolvedLanguage, {
			indentChar,
			tabSize,
			linterCallbacks,
			docLookup,
			completions,
			formatFn: format,
			onFormat,
			runFormat,
		});

		editor = new EditorView({
			doc: initialCode,
			parent: el,
			extensions,
		});
	}

	// perf: skip freeze — stateful editor API requires mutable methods and closures
	return {
		get content() {
			if (editor) return editor.state.doc.toString();
			return initialCode;
		},

		set content(newCode) {
			if (!editor) return;
			editor.dispatch({
				changes: {
					from: 0,
					to: editor.state.doc.length,
					insert: newCode || '',
				},
			});
		},

		get el() {
			if (el) return el;

			el = document.createElement('div');
			// Async init — editor is ready after the returned promise resolves
			initEditor();
			return el;
		},

		reset() {
			if (!editor) return;
			editor.dispatch({
				changes: {
					from: 0,
					to: editor.state.doc.length,
					insert: initialCode,
				},
			});
		},

		format() {
			runFormat();
		},

		check() {
			return runCheck();
		},

		destroy() {
			if (editor) {
				editor.destroy();
				editor = null;
			}
			el = null;
		},
	};
}

// --- private helpers (defined below call site for readability) ---

/**
 * Run all linter callbacks safely, catching errors and filtering bad returns.
 *
 * @param {Function[]} callbacks - Linter functions
 * @param {string} code - Current editor content
 * @returns {Array} Combined diagnostics from all linters
 */
function runLinterCallbacks(callbacks, code) {
	const results = [];

	for (const fn of callbacks) {
		try {
			const linterResult = fn(code);
			if (Array.isArray(linterResult)) {
				results.push(...linterResult);
			}
		} catch (err) {
			console.warn('Linter callback threw:', err);
		}
	}

	return results;
}

/**
 * Build the CodeMirror extensions array from options and callbacks.
 *
 * @param {string} language - Resolved language identifier
 * @param {object} opts - Internal options bundle
 * @returns {Promise<Array>} CodeMirror extensions
 */
async function buildExtensions(language, {
	indentChar,
	tabSize,
	linterCallbacks,
	docLookup,
	completions,
	runFormat,
} = {}) {
	const extensions = [];

	// 1. Core setup — basicSetup includes bracket matching, search,
	//    fold gutter, highlight selection, and close brackets
	extensions.push(basicSetup);
	extensions.push(oneDark);
	extensions.push(indentUnit.of(indentChar));
	extensions.push(EditorState.tabSize.of(tabSize));

	// 2. Dynamic language support
	const loader = CM_LOADERS[language];
	if (loader) {
		try {
			const pkg = await loader();
			const fnName = CM_FUNCTION_NAMES[language];
			const langExtension =
				fnName && typeof pkg[fnName] === 'function' ? pkg[fnName]() : null;
			if (langExtension) {
				extensions.push(langExtension);
			}
		} catch (err) {
			// Language loading is non-critical — editor works without highlighting
			console.warn(`Failed to load language support for ${language}:`, err);
		}
	}

	// 3. Linter callbacks → linter() + lintGutter()
	if (linterCallbacks && linterCallbacks.length > 0) {
		extensions.push(
			linter(function combinedLinter(view) {
				const code = view.state.doc.toString();
				if (!code.trim()) return [];

				return runLinterCallbacks(linterCallbacks, code).map(
					(d) => toCMDiagnostic(view.state.doc, d),
				);
			}),
		);
		extensions.push(lintGutter());
	}

	// 4. Doc lookup callback → hoverTooltip()
	if (docLookup) {
		extensions.push(
			hoverTooltip(function docHover(view, pos) {
				const word = view.state.wordAt(pos);
				if (!word) return null;

				const text = view.state.sliceDoc(word.from, word.to);
				const doc = docLookup(text);
				if (!doc) return null;

				return {
					pos: word.from,
					end: word.to,
					above: true,
					create() {
						// perf: skip freeze — DOM element, inherently mutable
						return { dom: buildTooltipDom(text, doc) };
					},
				};
			}),
		);
	}

	// 5. Completions callback → autocompletion()
	if (completions) {
		extensions.push(
			autocompletion({
				override: [
					function completionSource(context) {
						const word = context.matchBefore(/\w*/);
						if (!word || (word.from === word.to && !context.explicit)) {
							return null;
						}

						const prefix = context.state.sliceDoc(word.from, word.to);
						const items = completions(prefix);

						return {
							from: word.from,
							options: items.map((i) => ({
								label: i.label,
								type: i.type,
								detail: i.detail,
							})),
						};
					},
				],
			}),
		);
	}

	// 6. Keymaps
	const keymapEntries = [indentWithTab];

	if (runFormat) {
		keymapEntries.push({
			key: 'Ctrl-Shift-f',
			mac: 'Cmd-Shift-f',
			run() {
				runFormat();
				return true;
			},
		});
	}

	extensions.push(keymap.of(keymapEntries));

	return extensions;
}

/**
 * Convert a LintDiagnostic (pure data) to a CodeMirror Diagnostic.
 *
 * Clamps line/column to valid document ranges to prevent crashes from
 * out-of-range values in callback results.
 *
 * @param {object} doc - CodeMirror document (Text instance)
 * @param {object} diagnostic - LintDiagnostic from a callback
 * @returns {{ from: number, to: number, severity: string, message: string, source: string }}
 */
function toCMDiagnostic(doc, { line, column, endLine, endColumn, severity, message, source } = {}) {
	// Clamp line to valid range (1-based, doc.lines is max)
	const clampedLine = Math.max(1, Math.min(line || 1, doc.lines));
	const lineInfo = doc.line(clampedLine);
	const from = Math.min(lineInfo.from + (column || 0), lineInfo.to);

	let to;
	if (endLine != null) {
		const clampedEndLine = Math.max(1, Math.min(endLine, doc.lines));
		const endLineInfo = doc.line(clampedEndLine);
		to = Math.min(endLineInfo.from + (endColumn != null ? endColumn : column || 0), endLineInfo.to);
	} else {
		// Highlight at least one character
		to = Math.min(from + 1, lineInfo.to);
	}

	// perf: skip freeze — CM may mutate diagnostic objects internally
	return {
		from,
		to,
		// JeJ uses 'rejection' for errors — map to CM's 'error' severity
		severity: severity === 'rejection' ? 'error' : severity,
		message: message || '',
		source: source || '',
	};
}

/**
 * Build a styled DOM tooltip from a DocEntry.
 *
 * Uses One Dark color scheme to match the editor theme.
 *
 * @param {string} word - The hovered word
 * @param {object} doc - DocEntry from docLookup callback
 * @returns {HTMLElement}
 */
function buildTooltipDom(word, doc) {
	const container = document.createElement('div');
	container.style.cssText =
		'background: #2d2d30; color: #d4d4d4; padding: 12px; border-radius: 6px; ' +
		'border: 1px solid #464647; font-size: 12px; max-width: 350px; ' +
		'line-height: 1.4; font-family: -apple-system, BlinkMacSystemFont, ' +
		'"Segoe UI", Roboto, sans-serif;';

	if (!doc || typeof doc !== 'object' || !doc.description) {
		container.textContent = `${word}: ${typeof doc === 'string' ? doc : ''}`;
		return container;
	}

	const content = document.createElement('div');

	// Header with term and category
	const header = document.createElement('div');
	header.style.cssText =
		'border-bottom: 1px solid #464647; padding-bottom: 6px; margin-bottom: 8px;';

	const title = document.createElement('div');
	title.style.cssText =
		'font-weight: bold; color: #9cdcfe; font-size: 13px;';
	title.textContent = word;

	if (doc.category) {
		const badge = document.createElement('span');
		badge.style.cssText =
			'background: #3c3c3c; color: #d4d4d4; padding: 2px 6px; ' +
			'border-radius: 3px; font-size: 10px; margin-left: 8px;';
		badge.textContent = doc.category;
		title.appendChild(badge);
	}

	header.appendChild(title);
	content.appendChild(header);

	// Description
	const desc = document.createElement('div');
	desc.style.cssText = 'margin-bottom: 8px; color: #d4d4d4;';
	desc.textContent = doc.description;
	content.appendChild(desc);

	// Example code
	if (doc.example) {
		const exLabel = document.createElement('div');
		exLabel.style.cssText =
			'font-weight: bold; color: #9cdcfe; font-size: 11px; margin-bottom: 4px;';
		exLabel.textContent = 'Example:';
		content.appendChild(exLabel);

		const exCode = document.createElement('pre');
		exCode.style.cssText =
			'background: #1e1e1e; padding: 6px; border-radius: 3px; ' +
			'margin: 0 0 8px 0; font-size: 11px; color: #ce9178; ' +
			'overflow-x: auto; font-family: "Fira Code", "Consolas", monospace;';
		exCode.textContent = doc.example;
		content.appendChild(exCode);
	}

	// Common mistakes
	if (doc.commonMistakes && doc.commonMistakes.length > 0) {
		const mistakesLabel = document.createElement('div');
		mistakesLabel.style.cssText =
			'font-weight: bold; color: #f48771; font-size: 11px; margin-bottom: 4px;';
		mistakesLabel.textContent = 'Common Mistakes:';
		content.appendChild(mistakesLabel);

		doc.commonMistakes.forEach(function addMistake(mistake) {
			const item = document.createElement('div');
			item.style.cssText =
				'color: #f48771; font-size: 11px; margin-bottom: 2px; padding-left: 8px;';
			item.textContent = '\u2022 ' + mistake;
			content.appendChild(item);
		});
	}

	// When to use
	if (doc.whenToUse) {
		const whenLabel = document.createElement('div');
		whenLabel.style.cssText =
			'font-weight: bold; color: #4ec9b0; font-size: 11px; margin: 6px 0 2px 0;';
		whenLabel.textContent = 'When to use:';
		content.appendChild(whenLabel);

		const when = document.createElement('div');
		when.style.cssText = 'color: #4ec9b0; font-size: 11px;';
		when.textContent = doc.whenToUse;
		content.appendChild(when);
	}

	container.appendChild(content);
	return container;
}

export default createEditor;
