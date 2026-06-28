/**
 * @file React wrapper for the `quiz` lens — Slice A. Renders a read-only,
 * un-colorized CodeMirror editor over the snippet (the lens's own
 * decorations, NOT syntax highlighting, carry meaning) and a fallback notice
 * when the snippet did not parse. Clickable anchors (inc 2), the question
 * panel (inc 3), and graded verdicts (inc 4) build on this skeleton. Owns all
 * per-mount learner state; never writes to the orchestrator's snippet
 * (single-writer invariant). Freezes + default-exports the `LensModule`.
 */

import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import React, { useEffect, useRef } from 'react';
import type { ComponentType } from 'react';

import freezeInPlace from '@utils/freeze-in-place.js';

import type { LensModule, LensProps as LensProperties } from '../types.js';

import quizCore from './core.js';

import './quiz.css';

// Slice A reads no config knob (the V1 form is parameterless), so the wrapper
// takes only `embodiment`; the `core.config(props.config)` resolution lands
// with the first knob (inc 8).
const QuizComponent: ComponentType<LensProperties> = function QuizComponent({
	embodiment,
}) {
	const editorContainer = useRef<HTMLDivElement | null>(null);

	// Mount a read-only, un-colorized CodeMirror view over the source. The
	// extension set is deliberately minimal — `editable.of(false)` +
	// `readOnly.of(true)` and NOTHING else: no `basicSetup`, no `javascript()`,
	// no theme / `syntaxHighlighting`, so the source renders plain black-on-white
	// and the lens's own decorations (inc 2+) are the only visual signal. The
	// effect runs before the parse-fail early return (Rules of Hooks); on the
	// fallback path the host is absent, so it no-ops via the `host` guard.
	useEffect(
		function mountEditor() {
			const host = editorContainer.current;
			// Always return the (idle-safe) cleanup — never an early bare/undefined
			// return — to satisfy the effect-cleanup lint catch-22 (inconsistent
			// returns vs. useless-undefined). On the fallback path the host is
			// absent, so no view is created and `view?.destroy()` no-ops.
			let view: EditorView | undefined;
			if (host) {
				view = new EditorView({
					state: EditorState.create({
						doc: embodiment.source.code,
						extensions: [
							EditorView.editable.of(false),
							EditorState.readOnly.of(true),
						],
					}),
					parent: host,
				});
			}
			return function cleanup() {
				view?.destroy();
			};
		},
		// Keyed on the source string only. When the quiz model (build-quiz →
		// `classified` / `items`, inc 2+) lands, read it inside this effect via a
		// `useRef` — NEVER add `classified` / `items` to this dep array, or the
		// view destroys + recreates on every re-derive (DOCS § Structural
		// constraints / Memo outputs read through refs).
		[embodiment.source.code],
	);

	if (!embodiment.status.parsed) {
		return (
			<div data-lens="quiz">
				<div data-quiz-fallback role="alert">
					The quiz lens needs parseable code.
				</div>
			</div>
		);
	}

	return (
		<div data-lens="quiz">
			<main data-quiz-editor ref={editorContainer} />
		</div>
	);
};

const quizLens: LensModule = freezeInPlace<LensModule>({
	name: 'quiz',
	Component: QuizComponent,
	config: quizCore.config,
	applicableTo: quizCore.applicableTo,
	recommend: quizCore.recommend,
	phase: 'source',
});

export default quizLens;
