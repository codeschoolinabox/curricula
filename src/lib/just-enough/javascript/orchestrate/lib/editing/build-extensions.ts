/**
 * Builds the CodeMirror extensions array from editor options and callbacks.
 *
 * @remarks This is the only file that imports CodeMirror extension builders.
 * It translates pure callback data into CM extensions, keeping the CM
 * dependency boundary contained.
 *
 * @module build-extensions
 */

import { autocompletion, closeCompletion } from '@codemirror/autocomplete';
import { indentWithTab } from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import { linter, lintGutter } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, keymap, hoverTooltip } from '@codemirror/view';
import { basicSetup } from 'codemirror';

import buildInfoDom from './build-info-dom.js';
import buildTooltipDom from './build-tooltip-dom.js';
import { toCMDiagnostic, runLinterCallbacks } from './to-cm-diagnostic.js';
import type {
	LinterCallback,
	DocLookupCallback as DocumentLookupCallback,
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

// ─── Helpers ────────────────────────────────────────────────

/**
 * Apply-callback for completion items carrying the `apply: 'noop'`
 * sentinel — dismisses the popup on Enter without inserting the
 * label. JEJ-aware adapters use this to surface blocked vocabulary
 * pedagogically without the keystroke landing.
 */
function dismissPopup(view: EditorView): void {
	closeCompletion(view);
}

// ─── Options type (private to this module) ──────────────────

type BuildExtensionsOptions = {
	readonly indentChar: string;
	readonly tabSize: number;
	readonly linterCallbacks?: readonly LinterCallback[];
	readonly docLookup?: DocumentLookupCallback;
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
): Promise<readonly Extension[]> {
	// 1. Core setup — basicSetup includes bracket matching, search,
	//    fold gutter, highlight selection, and close brackets
	const extensions: readonly Extension[] = [
		basicSetup,
		oneDark,
		indentUnit.of(indentChar),
		EditorState.tabSize.of(tabSize),
	];

	// 2. Dynamic language support
	await loadLanguageExtension(language, extensions);

	// 3. Linter callbacks → linter() + lintGutter()
	if (linterCallbacks && linterCallbacks.length > 0) {
		extensions.push(
			linter(function combinedLinter(view: EditorView) {
				const code = view.state.doc.toString();
				if (!code.trim()) return [];

				return runLinterCallbacks(linterCallbacks, code).map((d) =>
					toCMDiagnostic(view.state.doc, d),
				);
			}),
			lintGutter(),
		);
	}

	// 4. Doc lookup callback → hoverTooltip()
	if (docLookup) {
		extensions.push(
			hoverTooltip(function documentHover(view: EditorView, pos: number) {
				const word = view.state.wordAt(pos);
				if (!word) return null;

				const text = view.state.sliceDoc(word.from, word.to);
				const document = docLookup(text);
				if (!document) return null;

				return {
					pos: word.from,
					end: word.to,
					above: true,
					create() {
						// perf: skip freeze — DOM element, inherently mutable
						return { dom: buildTooltipDom(text, document) };
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
						const lineStart = context.state.doc.lineAt(word.from).from;
						const precedingText = context.state.sliceDoc(lineStart, word.from);
						const fullText = context.state.doc.toString();
						const items = completions({ prefix, precedingText, fullText });

						return {
							from: word.from,
							options: items.map(function toCompletion(index) {
								// exactOptionalPropertyTypes: only set fields when defined
								const completion: {
									readonly label: string;
									readonly type?: string;
									readonly detail?: string;
									readonly info?: () => HTMLElement;
									readonly apply?: (view: EditorView) => void;
								} = { label: index.label };
								if (index.type != null) completion.type = index.type;
								if (index.detail != null) completion.detail = index.detail;
								// Prefer the rich-DocEntry path when the adapter
								// supplies an `entry`; otherwise fall back to the
								// plain-paragraph `info` string. The two surfaces
								// (autocomplete popup, hover tooltip) render the
								// same DocEntry through buildTooltipDom.
								if (index.entry != null) {
									const documentEntry = index.entry;
									const {label} = index;
									completion.info = () => buildTooltipDom(label, documentEntry);
								} else if (index.info != null) {
									const infoText = index.info;
									completion.info = () => buildInfoDom(infoText);
								}
								if (index.apply === 'noop') {
									completion.apply = dismissPopup;
								}
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

async function loadLanguageExtension(
	language: string,
	extensions: readonly Extension[],
): Promise<void> {
	const loader = CM_LOADERS[language as keyof typeof CM_LOADERS];
	if (!loader) return;

	try {
		const package_ = await loader();
		const functionName = CM_FUNCTION_NAMES[language];
		if (!functionName) return;

		const langFunction = (package_ as Record<string, unknown>)[functionName];
		// cast: CM lang packages export a function returning Extension; we verify with typeof guard
		if (typeof langFunction === 'function') {
			extensions.push((langFunction as () => Extension)());
		}
	} catch (error: unknown) {
		// Language loading is non-critical — editor works without highlighting
		console.warn(`Failed to load language support for ${language}:`, error);
	}
}

export default buildExtensions;
