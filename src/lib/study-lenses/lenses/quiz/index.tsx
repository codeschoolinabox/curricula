/**
 * @file React wrapper for the `quiz` lens — Slice A. Renders a read-only,
 * un-colorized CodeMirror editor over the snippet (the lens's own decorations,
 * NOT syntax highlighting, carry meaning); clicking a syntax element highlights
 * that anchor (inc 2). A fallback notice renders when the snippet did not parse.
 * The question panel (inc 3) and graded verdicts (inc 4) build on this. Owns
 * all per-mount learner state; never writes to the orchestrator's snippet
 * (single-writer invariant). Freezes + default-exports the `LensModule`.
 */

import { EditorState, StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';

import freezeInPlace from '@utils/freeze-in-place.js';

import type { ClassifiedToken } from '../../lib/classifying/types.js';
import type { LensModule, LensProps as LensProperties } from '../types.js';

import quizCore from './core.js';
import anchors from './lib/anchors.js';
import buildQuiz from './lib/build-quiz.js';

import './quiz.css';

// The picked-anchor highlight: a single `Decoration.mark` over the picked token
// range, driven by a `StateEffect` dispatched from React when the pick changes
// — so the highlight updates without remounting the read-only view.
const setAnchorHit = StateEffect.define<readonly [number, number] | null>();
const anchorMark = Decoration.mark({ class: 'cm-quiz-anchor-hit' });
const anchorHitField = StateField.define<DecorationSet>({
	create() {
		return Decoration.none;
	},
	update(decorations, transaction) {
		const hit = transaction.effects.find(
			(effect): effect is StateEffect<readonly [number, number] | null> =>
				effect.is(setAnchorHit),
		);
		// Read-only view → the doc never changes, so positions are stable and no
		// `DecorationSet.map(changes)` is needed; return the set unchanged.
		if (hit === undefined) return decorations;
		return hit.value === null
			? Decoration.none
			: Decoration.set([anchorMark.range(hit.value[0], hit.value[1])]);
	},
	provide: (field) => EditorView.decorations.from(field),
});

// Slice A reads no config knob (the V1 form is parameterless), so the wrapper
// takes only `embodiment`; the `core.config(props.config)` resolution lands
// with the first knob (inc 8).
const QuizComponent: ComponentType<LensProperties> = function QuizComponent({
	embodiment,
}) {
	const editorContainer = useRef<HTMLDivElement | null>(null);
	const editorView = useRef<EditorView | null>(null);

	// The classified anchor stream, rebuilt only when the source changes. Held
	// in a ref so the (mount-time) mousedown handler always resolves clicks
	// against the current stream without re-creating the view.
	const model = useMemo(() => buildQuiz(embodiment), [embodiment.source.code]);
	const classified: readonly ClassifiedToken[] = model?.classified ?? [];
	const classifiedReference = useRef<readonly ClassifiedToken[]>(classified);
	classifiedReference.current = classified;

	// The picked anchor's range (per-mount UI state); null when nothing — or
	// whitespace — is selected. Drives the highlight decoration.
	const [pickedRange, setPickedRange] = useState<
		readonly [number, number] | null
	>(null);

	useEffect(
		function mountEditor() {
			const host = editorContainer.current;
			// Always return the (idle-safe) cleanup — never an early bare/undefined
			// return. On the fallback path the host is absent, so no view is created
			// and `view?.destroy()` no-ops.
			let view: EditorView | undefined;
			if (host) {
				view = new EditorView({
					state: EditorState.create({
						doc: embodiment.source.code,
						extensions: [
							// Read-only + un-colorized: editable off, readOnly on, and NO
							// `javascript()` / `oneDark` / `syntaxHighlighting` — plain
							// black-on-white; the anchor decoration carries the only color.
							EditorView.editable.of(false),
							EditorState.readOnly.of(true),
							anchorHitField,
							EditorView.domEventHandlers({
								mousedown(event, clickedView) {
									const offset = clickedView.posAtCoords({
										x: event.clientX,
										y: event.clientY,
									});
									const token =
										offset === null
											? null
											: anchors.anchorAt(offset, classifiedReference.current);
									setPickedRange(
										token === null ? null : [token.start, token.end],
									);
									// Do not preventDefault on a read-only view.
									return false;
								},
							}),
						],
					}),
					parent: host,
				});
			}
			editorView.current = view ?? null;
			return function cleanup() {
				view?.destroy();
				editorView.current = null;
			};
		},
		// Keyed on the source string only. `classified` is read via
		// `classifiedReference` (updated every render) inside the handler — NEVER add
		// `classified` / `items` to this dep array, or the view destroys +
		// recreates on every re-derive (DOCS § Structural constraints / Memo
		// outputs read through refs).
		[embodiment.source.code],
	);

	// Sync the highlight: dispatch the picked range into the mounted view's
	// decoration field whenever the pick changes — no remount.
	useEffect(
		function syncAnchorHighlight() {
			editorView.current?.dispatch({ effects: setAnchorHit.of(pickedRange) });
		},
		[pickedRange],
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
