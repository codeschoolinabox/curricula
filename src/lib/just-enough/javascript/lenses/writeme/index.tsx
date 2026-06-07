/**
 * @file React wrapper for the `writeme` lens — default-exports the frozen
 * `LensModule` the orchestrator's lens registry consumes (post Inc 7).
 *
 * Inc 6a scope: mounts the write-view CodeMirror editor (editable, paste-blocked,
 * seeded synchronously from the comment skeleton) under a `data-lens="writeme"`
 * root that carries the committed view / editor / hints modes. The view toggle +
 * read view (6b), keep-comments + reset (6c), diff-mode line decorations (6d),
 * hints panel (6e), and the honest Check + instructions (6f) land in later
 * increments.
 *
 * The CodeMirror `EditorView` is imperatively mounted in a `useEffect`; per the
 * lenses-peer anti-regression invariant the learner's edits are mirrored into a
 * `useRef` read at mount time and MUST NOT appear in the mount-effect deps — a
 * per-keystroke remount would destroy the view mid-typing (the blanks remount
 * regression). Mount-effect deps are the structural remount triggers only
 * (`[editorMode]` for now; the keep-comments re-seed in 6c is an imperative
 * dispatch, not a remount).
 */

import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import {
	EditorView,
	drawSelection,
	keymap,
	lineNumbers,
} from '@codemirror/view';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';

import { freezeInPlace } from '@utils/freeze.js';

import type { LensModule, LensProps as LensProperties } from '../types.js';

import writemeCore from './core.js';
import commentSkeleton from './lib/comment-skeleton.js';
import noPasteExtension from './lib/no-paste-extension.js';
import type { EditorMode, HintsMode, ViewMode } from './types.js';

import './writeme.css';

const WritemeComponent: ComponentType<LensProperties> =
	function WritemeComponent({ embodiment, config }) {
		// Resolve config once per stable `config` prop (the orchestrator keeps it
		// stable); defensively narrow the open-shape fields to the documented
		// defaults.
		const resolved = useMemo(() => writemeCore.config(config), [config]);
		// viewMode is STATE (seeded once from config) so the Write/Read toggle can
		// drive it; editorMode/hintsMode stay render-derived until their own
		// increments (6d / 6e) add toggles.
		const initialViewMode: ViewMode =
			resolved.viewMode === 'read' ? 'read' : 'write';
		const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
		const editorMode: EditorMode =
			resolved.editorMode === 'raw' ? 'raw' : 'diff';
		const hintsMode: HintsMode = resolved.hintsMode === 'off' ? 'off' : 'on';
		const keepComments = resolved.keepComments !== false;

		// The starting template — comment skeleton (scaffolding) or blank slate —
		// computed SYNCHRONOUSLY so the editor's first paint already shows it (no
		// empty-then-filled flicker). Mirrored into a ref so the mount effect can
		// read it without listing it as a dep (which would remount per change).
		const startingTemplate = useMemo(
			() => (keepComments ? commentSkeleton(embodiment.source.code) : ''),
			[keepComments, embodiment.source.code],
		);
		const startingTemplateReference = useRef(startingTemplate);
		startingTemplateReference.current = startingTemplate;

		// Learner edits. `null` = untouched → the editor seeds from the template;
		// once the learner types, the updateListener captures the doc here, and a
		// later mode re-mount re-seeds from this (preserved) text via the ref.
		const [learnerCode, setLearnerCode] = useState<string | null>(null);
		const learnerCodeReference = useRef<string | null>(learnerCode);
		learnerCodeReference.current = learnerCode;

		const editorContainer = useRef<HTMLDivElement | null>(null);
		const editorView = useRef<EditorView | null>(null);

		useEffect(
			function mountEditorView() {
				const host = editorContainer.current;
				if (host) {
					// Read the seed from refs (never deps) so typing doesn't remount.
					const initialDoc =
						learnerCodeReference.current ?? startingTemplateReference.current;

					const updateListener = EditorView.updateListener.of(
						function onUpdate(update) {
							// Mirror learner edits into local state only — NEVER the
							// orchestrator's snippet (single-writer invariant).
							if (update.docChanged) {
								setLearnerCode(update.state.doc.toString());
							}
						},
					);

					const state = EditorState.create({
						doc: initialDoc,
						extensions: [
							// Deliberately minimal baseline — NO autocomplete, lint, or
							// bracket-auto-close. A recall exercise must never have the
							// editor SUGGEST the very code the learner is reproducing from
							// memory (rawdog typing; a divergence from the legacy's
							// `basicSetup`). Line numbers + history + selection +
							// JavaScript syntax highlighting stay (readability isn't a hint).
							lineNumbers(),
							history(),
							drawSelection(),
							keymap.of([...defaultKeymap, ...historyKeymap]),
							javascript(),
							oneDark,
							EditorView.editable.of(true),
							updateListener,
							// Paste blocked in EVERY editable mode (no anchors to protect
							// the answer — pasting would defeat the reproduction exercise).
							noPasteExtension(),
						],
					});
					editorView.current = new EditorView({ state, parent: host });
				}

				return function cleanup() {
					editorView.current?.destroy();
					editorView.current = null;
				};
			},
			// Structural remount triggers only; learner code rides the ref above.
			[editorMode],
		);

		return (
			<div
				data-lens="writeme"
				data-view-mode={viewMode}
				data-editor-mode={editorMode}
				data-hints-mode={hintsMode}
			>
				<div data-writeme-toolbar role="toolbar" aria-label="View">
					<button
						type="button"
						data-view-toggle="write"
						aria-pressed={viewMode === 'write'}
						onClick={function selectWriteView() {
							setViewMode('write');
						}}
					>
						Write
					</button>
					<button
						type="button"
						data-view-toggle="read"
						aria-pressed={viewMode === 'read'}
						onClick={function selectReadView() {
							setViewMode('read');
						}}
					>
						Read
					</button>
				</div>
				{/* The editor host stays mounted in BOTH views (hidden in read) so
				    viewMode never enters the mount-effect deps and the learner's typed
				    code survives the toggle [I1]. */}
				<div
					ref={editorContainer}
					data-writeme-editor-host
					hidden={viewMode === 'read'}
				/>
				{viewMode === 'read' && (
					<figure data-writeme-solution-view>
						<figcaption>
							Read the solution, then return to Write and reproduce it from
							memory. Write and Read are separate on purpose — you never type
							with the solution in view.
						</figcaption>
						<pre data-writeme-solution>{embodiment.source.code}</pre>
					</figure>
				)}
			</div>
		);
	};

const writemeLens: LensModule = freezeInPlace<LensModule>({
	name: 'writeme',
	Component: WritemeComponent,
	config: writemeCore.config,
	applicableTo: writemeCore.applicableTo,
	recommend: writemeCore.recommend,
});

export default writemeLens;
