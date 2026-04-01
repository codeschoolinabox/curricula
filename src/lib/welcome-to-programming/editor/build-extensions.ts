/**
 * Builds the CodeMirror extensions array from editor options and callbacks.
 *
 * @remarks This is the only file that imports CodeMirror extension builders.
 * It translates pure callback data into CM extensions, keeping the CM
 * dependency boundary contained.
 *
 * @module build-extensions
 */

import { EditorView, keymap, hoverTooltip } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { autocompletion } from '@codemirror/autocomplete';
import { linter, lintGutter } from '@codemirror/lint';
import { indentUnit } from '@codemirror/language';
import { indentWithTab } from '@codemirror/commands';

import type { Extension } from '@codemirror/state';

import { toCMDiagnostic, runLinterCallbacks } from './to-cm-diagnostic.js';
import buildTooltipDom from './build-tooltip-dom.js';

import type {
	LinterCallback,
	DocLookupCallback,
	CompletionCallback,
} from './types.js';

// ─── Language loading ───────────────────────────────────────

// CM language packages have varying shapes — we only call pkg[fnName]()
// and runtime-guard with typeof === 'function'
const CM_LOADERS = Object.freeze({
	javascript: () => import('@codemirror/lang-javascript'),
	typescript: () => import('@codemirror/lang-javascript'),
	python: () => import('@codemirror/lang-python'),
	html: () => import('@codemirror/lang-html'),
	css: () => import('@codemirror/lang-css'),
	markdown: () => import('@codemirror/lang-markdown'),
	json: () => import('@codemirror/lang-json'),
	xml: () => import('@codemirror/lang-xml'),
	// OpenQASM uses JavaScript highlighting as a reasonable fallback
	openqasm2: () => import('@codemirror/lang-javascript'),
}) satisfies Readonly<Record<string, () => Promise<Record<string, unknown>>>>;

const CM_FUNCTION_NAMES: Readonly<Record<string, string>> = Object.freeze({
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

// ─── Options type (private to this module) ──────────────────

type BuildExtensionsOptions = {
	readonly indentChar: string;
	readonly tabSize: number;
	readonly linterCallbacks?: readonly LinterCallback[];
	readonly docLookup?: DocLookupCallback;
	readonly completions?: CompletionCallback;
	readonly runFormat?: () => void;
};

// ─── Main function ──────────────────────────────────────────

/**
 * Build the CodeMirror extensions array from options and callbacks.
 *
 * @param language - Resolved language identifier
 * @param options - Configuration and callback references
 * @returns Array of CodeMirror extensions
 */
async function buildExtensions(
	language: string,
	{
		indentChar,
		tabSize,
		linterCallbacks,
		docLookup,
		completions,
		runFormat,
	}: BuildExtensionsOptions = {} as BuildExtensionsOptions,
): Promise<Extension[]> {
	const extensions: Extension[] = [];

	// 1. Core setup — basicSetup includes bracket matching, search,
	//    fold gutter, highlight selection, and close brackets
	extensions.push(basicSetup);
	extensions.push(oneDark);
	extensions.push(indentUnit.of(indentChar));
	extensions.push(EditorState.tabSize.of(tabSize));

	// 2. Dynamic language support
	await loadLanguageExtension(language, extensions);

	// 3. Linter callbacks → linter() + lintGutter()
	if (linterCallbacks && linterCallbacks.length > 0) {
		extensions.push(
			linter(function combinedLinter(view: EditorView) {
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
			hoverTooltip(function docHover(view: EditorView, pos: number) {
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
							options: items.map(function toCompletion(i) {
								// exactOptionalPropertyTypes: only set type/detail when defined
								const completion: { label: string; type?: string; detail?: string } = { label: i.label };
								if (i.type != null) completion.type = i.type;
								if (i.detail != null) completion.detail = i.detail;
								return completion;
							}),
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

// ─── Helpers ────────────────────────────────────────────────

async function loadLanguageExtension(language: string, extensions: Extension[]): Promise<void> {
	const loader = CM_LOADERS[language as keyof typeof CM_LOADERS];
	if (!loader) return;

	try {
		const pkg = await loader();
		const fnName = CM_FUNCTION_NAMES[language];
		if (!fnName) return;

		const langFn = (pkg as Record<string, unknown>)[fnName];
		// cast: CM lang packages export a function returning Extension; we verify with typeof guard
		if (typeof langFn === 'function') {
			extensions.push((langFn as () => Extension)());
		}
	} catch (err: unknown) {
		// Language loading is non-critical — editor works without highlighting
		console.warn(`Failed to load language support for ${language}:`, err);
	}
}

export default buildExtensions;
