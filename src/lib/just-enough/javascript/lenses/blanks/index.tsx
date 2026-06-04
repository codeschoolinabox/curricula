/**
 * @file React wrapper for the `blanks` lens. Default-exports the frozen
 * `LensModule` the orchestrator's lens registry consumes (post Inc 7).
 *
 * The wrapper composes the pure-TS core (`./core.ts`) + the vendored
 * lib modules (`./lib/blankenate.ts` etc.) into the blanks surface: a
 * `<div data-lens="blanks" data-view-mode="…" data-hints-level="…">`
 * root with toolbar, editor, editor header, hints panel, and Ask Me
 * button.
 *
 * **Inc 6a scope (current):** wrapper mounts a CodeMirror EditorView
 * in read-only blankenated mode. No toolbar, no view-mode toggle, no
 * correctness wiring, no hints panel — those land in 6b–6j.
 */

import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import React, { useEffect, useMemo, useRef } from 'react';
import type { ComponentType } from 'react';

import { freezeInPlace } from '@utils/freeze.js';

import type { LensModule, LensProps as LensProperties } from '../types.js';

import blanksCore from './core.js';
import blankenate from './lib/blankenate.js';
import type { ContentType } from './types.js';

const ALL_CONTENT_TYPES: ReadonlyArray<ContentType> = [
	'keywords',
	'identifiers',
	'operators',
	'literals',
];

/**
 * Derives the boolean-map representation of contentTypes the
 * vendored `blankenate` expects, from the array-form `LensConfig`
 * field. Wrapper-internal — no exported type per DOCS § Structural
 * constraints.
 */
function deriveContentTypeFlags(
	contentTypes: ReadonlyArray<ContentType>,
): {
	keywords: boolean;
	identifiers: boolean;
	operators: boolean;
	literals: boolean;
} {
	const set = new Set(contentTypes);
	return {
		keywords: set.has('keywords'),
		identifiers: set.has('identifiers'),
		operators: set.has('operators'),
		literals: set.has('literals'),
	};
}

const BlanksComponent: ComponentType<LensProperties> = function BlanksComponent({
	embodiment,
	config,
}) {
	// Memoize resolved config on the `config` prop (stable reference from
	// the orchestrator). Without this, `blanksCore.config()` produces a
	// fresh frozen clone on every render — including a fresh
	// `contentTypes` array — which would cascade into spurious
	// `blankenate` re-rolls whenever a parent re-renders (load-bearing
	// once Inc 6b adds local state to the wrapper).
	const resolved = useMemo(() => blanksCore.config(config), [config]);
	const difficulty =
		typeof resolved.difficulty === 'number' ? resolved.difficulty : 50;
	const contentTypes = Array.isArray(resolved.contentTypes)
		? (resolved.contentTypes as ReadonlyArray<ContentType>)
		: ALL_CONTENT_TYPES;

	// Memoize the blankenate call on (source, resolved). `resolved` is
	// itself memoized on `config`, so the dep chain is stable when the
	// orchestrator keeps the prop stable. Per DOCS § Phase 2: synchronous
	// during first render — no flicker between an empty editor and a
	// __-filled re-render.
	const blankResult = useMemo(
		() =>
			blankenate(
				embodiment.source.code,
				difficulty / 100,
				deriveContentTypeFlags(contentTypes),
			),
		[embodiment.source.code, resolved, difficulty, contentTypes],
	);

	// Defense-in-depth: in production `applicableTo` gates on
	// status.parsed, so blankenate's null return should be unreachable.
	// If it fires anyway, render a fallback panel rather than the editor.
	const displayCode =
		blankResult === null ? embodiment.source.code : blankResult.blankedCode;

	const editorContainer = useRef<HTMLDivElement | null>(null);
	const editorView = useRef<EditorView | null>(null);

	// Mount the CodeMirror EditorView once per (displayCode) change.
	// Inc 6a: read-only blankenated mode. Inc 6b will add view-mode
	// switching that destroys + recreates the view on toggle.
	useEffect(
		function mountEditorView() {
			const host = editorContainer.current;
			if (!host) return;

			const state = EditorState.create({
				doc: displayCode,
				extensions: [
					basicSetup,
					javascript(),
					oneDark,
					EditorView.editable.of(false),
					EditorState.readOnly.of(true),
				],
			});
			const view = new EditorView({ state, parent: host });
			editorView.current = view;

			return function cleanup() {
				view.destroy();
				editorView.current = null;
			};
		},
		[displayCode],
	);

	// Render: on null blankResult (defense-in-depth) render ONLY the
	// fallback panel, not both panel + editor. README § Edge cases
	// says the wrapper renders the fallback "rather than the editor."
	return (
		<div data-lens="blanks" data-view-mode="blankenated">
			{blankResult === null ? (
				<div
					data-blanks-fallback="parse-fail"
					role="alert"
					style={{ padding: '0.5rem', color: '#c33' }}
				>
					Snippet did not parse — the blanks lens requires a parseable
					source (defense-in-depth; applicableTo should have prevented
					mount).
				</div>
			) : (
				<div ref={editorContainer} data-blanks-editor-host />
			)}
		</div>
	);
};

const blanksLens: LensModule = freezeInPlace<LensModule>({
	name: 'blanks',
	Component: BlanksComponent,
	config: blanksCore.config,
	applicableTo: blanksCore.applicableTo,
	recommend: blanksCore.recommend,
});

export default blanksLens;
