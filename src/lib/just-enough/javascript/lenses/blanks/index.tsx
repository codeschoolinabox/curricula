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
 * **Current scope (Inc 6a + 6b + 6c + 6d):** wrapper mounts a
 * CodeMirror EditorView (6a), with a two-button view-mode toggle
 * (6b), editable in blankenated mode with noPasteExtension wired
 * (6c), and an aggregate score panel that updates per keystroke as
 * the learner fills blanks (6d). The root currently emits
 * `data-lens="blanks" data-view-mode={viewMode}`; `data-hints-level`
 * is deferred to Inc 6h when the hints panel + tier resolution land.
 * 6e–6j add the slider, content-type checkboxes, editor header, full
 * hints panel with per-blank visual feedback, URL config, and Ask Me.
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
import evaluateCorrectness from './lib/evaluate-correctness.js';
import noPasteExtension from './lib/no-paste-extension.js';
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
	// 'blankenated' via blanksCore.config). The toggle preserves the
	// learner's in-progress edits across mode swaps (AR-1 lock —
	// disposable-practice governs unmount, not within-mount toggle).
	const initialViewMode: ViewMode =
		resolved.viewMode === 'complete' ? 'complete' : 'blankenated';
	const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);

	// Learner edits state (Inc 6c). null = no edits yet → editor uses
	// blankedCode on first mount. Once the learner types, the
	// updateListener captures the current doc into learnerCode; later
	// toggles back to blankenated re-mount with learnerCode (not the
	// original blankedCode) so in-progress work is preserved.
	const [learnerCode, setLearnerCode] = useState<string | null>(null);
	// Ref mirror of learnerCode — read by the EditorView-mount effect at
	// mount-time. The effect MUST NOT have learnerCode in its dep array
	// (would feedback-loop: keystroke → setLearnerCode → re-render →
	// effect re-fires → view.destroy → lost focus → "feels read-only").
	const learnerCodeRef = useRef<string | null>(learnerCode);
	learnerCodeRef.current = learnerCode;

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
		// they can change independently of resolved (they cannot — yet).
		//
		// TODO Inc 6e/6f: when the difficulty slider + content-type
		// checkboxes introduce LOCAL state for these values (no longer
		// prop-derived), this useMemo's deps must expand to include
		// those local values. blankResult identity will then change on
		// every slider/checkbox interaction → the mountEditorView
		// effect remounts the view → learnerCodeRef.current still holds
		// the old typed text but against the old blank positions.
		// Per DOCS § Phase 2: "Re-derivation on settings change resets
		// the correctness map" — Inc 6e/6f handlers must also clear
		// learnerCode (setLearnerCode(null)) when settings change.
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

	const editorContainer = useRef<HTMLDivElement | null>(null);
	const editorView = useRef<EditorView | null>(null);

	// Inc 6d: per-blank correctness wiring + aggregate score display.
	// evaluateCorrectness is pure; recomputes on learnerCode change
	// (typing dispatches setLearnerCode) and on blankResult change
	// (snippet / future-difficulty / future-content-types).
	const evaluation = useMemo(() => {
		if (blankResult === null) {
			return { score: 100, total: 0, correct: 0, incorrect: 0, unfilled: 0 };
		}
		// The doc the learner is editing — learnerCode if they typed,
		// blankedCode otherwise. evaluateCorrectness compares against
		// blank.original at each anchor position.
		const currentDoc = learnerCode ?? blankResult.blankedCode;
		const result = evaluateCorrectness(
			currentDoc,
			blankResult.blanks,
			blankResult.originalCode,
		);
		return {
			score: result.score,
			total: result.total,
			correct: result.correct,
			incorrect: result.incorrect,
			unfilled: result.unfilled,
		};
	}, [learnerCode, blankResult]);

	// Mount the CodeMirror EditorView. Destroy + recreate on STRUCTURAL
	// changes only: viewMode flips, or blankResult re-derives (source /
	// difficulty / contentTypes change). Per-keystroke `learnerCode`
	// updates flow through the updateListener into React state but MUST
	// NOT re-fire this effect — that would feedback-loop and destroy
	// the EditorView mid-typing.
	//
	// Inc 6c:
	//   - blankenated mode → editable, noPasteExtension wired,
	//     updateListener captures learner edits into learnerCode state.
	//   - complete mode → read-only, no paste extension, no listener
	//     reaction to docChanged.
	useEffect(
		function mountEditorView() {
			const host = editorContainer.current;
			if (!host) return;

			const isBlankenated = viewMode === 'blankenated';

			// Derive the initial document INSIDE the effect closure so
			// learnerCode is read from the ref (not state-as-dep). Toggle
			// back to blankenated picks up the latest in-progress edits;
			// fresh mount with no edits uses blankedCode.
			const initialDoc =
				blankResult === null
					? embodiment.source.code
					: isBlankenated
						? (learnerCodeRef.current ?? blankResult.blankedCode)
						: blankResult.originalCode;

			const updateListener = EditorView.updateListener.of(function onUpdate(
				update,
			) {
				if (!update.docChanged) return;
				if (!isBlankenated) return;
				// Mirror the learner's edit into local state. The wrapper's
				// updateListener NEVER calls the orchestrator's snippet setter
				// per the single-writer invariant (DOCS § Structural constraints
				// "CodeMirror writes to local state, never to setSnippet").
				setLearnerCode(update.state.doc.toString());
			});

			const state = EditorState.create({
				doc: initialDoc,
				extensions: [
					basicSetup,
					javascript(),
					oneDark,
					EditorView.editable.of(isBlankenated),
					EditorState.readOnly.of(!isBlankenated),
					updateListener,
					...(isBlankenated ? [noPasteExtension()] : []),
				],
			});
			const view = new EditorView({ state, parent: host });
			editorView.current = view;

			return function cleanup() {
				view.destroy();
				editorView.current = null;
			};
		},
		// Intentionally minimal deps: structural remounts only.
		// learnerCode is read via ref above; including it here would
		// recreate the regression bug fixed in Inc 6c.
		// embodiment.source.code is captured via blankResult (memoized on
		// embodiment.source.code + resolved); including it here directly
		// would just duplicate the blankResult-driven remount path.
		[viewMode, blankResult],
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
					<div
						data-blanks-score={String(evaluation.score)}
						data-blanks-total={String(evaluation.total)}
						data-blanks-correct={String(evaluation.correct)}
						aria-live="polite"
						style={{
							padding: '0.5rem 0',
							fontFamily: 'system-ui, sans-serif',
							fontSize: '0.9rem',
						}}
					>
						Score: {evaluation.score}%
						{evaluation.total > 0 && (
							<>
								{' '}
								({evaluation.correct} / {evaluation.total} blanks)
							</>
						)}
					</div>
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
