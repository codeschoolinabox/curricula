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
 * **Current scope (Inc 6a + 6b):** wrapper mounts a CodeMirror
 * EditorView in read-only blankenated mode (6a) with a two-button
 * view-mode toggle (6b) that swaps between the blankenated and
 * complete (original-source) views. Both modes are read-only — Inc
 * 6c adds editable blankenated + noPasteExtension; Inc 6d adds
 * per-blank correctness wiring; 6e–6j add the slider, content-type
 * checkboxes, editor header, hints panel, URL config, and Ask Me.
 */

import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';

import { freezeInPlace } from '@utils/freeze.js';

import type { LensModule, LensProps as LensProperties } from '../types.js';

import blanksCore from './core.js';
import blankenate from './lib/blankenate.js';
import type { ContentType, ViewMode } from './types.js';

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

	// View-mode state (Inc 6b). Seeded from config.viewMode (default
	// 'blankenated' via blanksCore.config). The toggle preserves any
	// learner state across mounts (Inc 6c onward) — disposable-practice
	// governs unmount, not within-mount toggle (AR-1 lock).
	const initialViewMode: ViewMode =
		resolved.viewMode === 'complete' ? 'complete' : 'blankenated';
	const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);

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
		// True minimal deps: `difficulty` and `contentTypes` are derived
		// from `resolved` above; listing them separately would imply
		// they can change independently of resolved (they cannot).
		[embodiment.source.code, resolved],
	);

	// Defense-in-depth: in production `applicableTo` gates on
	// `status.parsed`, so unparseable embodiments never reach the wrapper.
	// If one does (e.g. the picker bypasses the recommender), render the
	// fallback panel. We gate on `embodiment.status.parsed` directly
	// (canonical signal) rather than on `blankResult === null` because
	// some embody failure modes (e.g. validate-stage failures) carry
	// parseable source strings, where Acorn-inside-blankenate succeeds
	// but the embodiment is still marked unparsed.
	const showFallback = !embodiment.status.parsed || blankResult === null;

	// View-mode drives which document the editor mounts on:
	//   complete    → originalCode (no __, the verbatim source)
	//   blankenated → blankedCode (with __ placeholders)
	const displayCode =
		blankResult === null
			? embodiment.source.code
			: viewMode === 'complete'
				? blankResult.originalCode
				: blankResult.blankedCode;

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
	// fallback panel, not toolbar + editor. README § Edge cases says
	// the wrapper renders the fallback "rather than the editor."
	return (
		<div data-lens="blanks" data-view-mode={viewMode}>
			{showFallback ? (
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
				<>
					<div data-blanks-toolbar role="toolbar">
						<button
							type="button"
							data-view-toggle="blankenated"
							aria-pressed={viewMode === 'blankenated' ? 'true' : 'false'}
							onClick={() => setViewMode('blankenated')}
						>
							📝 Blankenated Code
						</button>
						<button
							type="button"
							data-view-toggle="complete"
							aria-pressed={viewMode === 'complete' ? 'true' : 'false'}
							onClick={() => setViewMode('complete')}
						>
							📖 Complete Code
						</button>
					</div>
					<div ref={editorContainer} data-blanks-editor-host />
				</>
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
