/**
 * @file React wrapper for the `writeme` lens — default-exports the frozen
 * `LensModule` the orchestrator's lens registry consumes (post Inc 7).
 *
 * Scope: the write-view CodeMirror editor (editable, paste-blocked, seeded
 * synchronously from the comment skeleton) under a `data-lens="writeme"` root; a
 * Write/Read view toggle (read = solution-only study surface); and the four Assist
 * toggles — colorize + suggestions + diff (live compartment reconfigure) and
 * comments (pristine-gated doc re-seed). The diff is a pair: it highlights
 * typed-but-wrong lines on the WRITE editor, and marks the solution lines the
 * learner has not yet reproduced on the READ editor. This is the complete feature
 * set — hints, a numeric Check, and an instructions accordion were considered and
 * cut (the live diff pair is the feedback).
 *
 * The CodeMirror `EditorView` is imperatively mounted ONCE in a `useEffect`
 * (deps `[]`); per the lenses-peer anti-regression invariant the learner's edits
 * are mirrored into a `useRef` read at mount time. The scaffold toggles
 * (colorize / suggestions / diff) live-reconfigure CodeMirror `Compartment`s and
 * the keep-comments re-seed dispatches a doc change — neither remounts, so no
 * value can re-fire the mount effect and destroy the view mid-typing (the blanks
 * remount regression is structurally impossible here).
 */

import { completionKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { syntaxHighlighting } from '@codemirror/language';
import { Compartment, EditorState } from '@codemirror/state';
import {
	oneDarkHighlightStyle,
	oneDarkTheme,
} from '@codemirror/theme-one-dark';
import {
	EditorView,
	drawSelection,
	keymap,
	lineNumbers,
} from '@codemirror/view';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';

import { freezeInPlace } from '@utils/freeze.js';

import snippetFreeAutocomplete from '../lib/snippet-free-autocomplete.js';
import type { LensModule, LensProps as LensProperties } from '../types.js';

import writemeCore from './core.js';
import commentSkeleton from './lib/comment-skeleton.js';
import buildWriteDiffField, {
	buildReadMarkerField,
} from './lib/diff-decorations.js';
import noPasteExtension from './lib/no-paste-extension.js';
import type { ViewMode } from './types.js';

import './writeme.css';

const WritemeComponent: ComponentType<LensProperties> =
	function WritemeComponent({ embodiment, config }) {
		// Resolve config once per stable `config` prop (the orchestrator keeps it
		// stable); defensively narrow the open-shape fields to the documented
		// defaults.
		const resolved = useMemo(() => writemeCore.config(config), [config]);
		// Every surface control is per-mount STATE seeded once from config:
		// viewMode drives the Write/Read toggle; the four scaffold toggles drive
		// their Assist checkboxes (colorize / suggestions / diff via live
		// compartment reconfigure, comments via a pristine-gated doc re-seed) —
		// none remounts the editor.
		const initialViewMode: ViewMode =
			resolved.viewMode === 'read' ? 'read' : 'write';
		const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
		const [colorize, setColorize] = useState<boolean>(
			resolved.colorize !== false,
		);
		const [suggestions, setSuggestions] = useState<boolean>(
			resolved.suggestions === true,
		);
		const [keepComments, setKeepComments] = useState<boolean>(
			resolved.keepComments !== false,
		);
		// The keepComments value the editor's current seed reflects. When it differs
		// from `keepComments` (a toggle landed on a diverged editor and was NOT
		// applied), the toolbar shows a quiet "Reset to apply" hint.
		const [appliedKeepComments, setAppliedKeepComments] = useState<boolean>(
			resolved.keepComments !== false,
		);
		const [diff, setDiff] = useState<boolean>(resolved.diff !== false);
		// Mirror colorize/suggestions/diff into refs so the mount effect seeds the
		// compartments at mount without listing them as deps (which would remount).
		const colorizeReference = useRef(colorize);
		colorizeReference.current = colorize;
		const suggestionsReference = useRef(suggestions);
		suggestionsReference.current = suggestions;
		const diffReference = useRef(diff);
		diffReference.current = diff;
		// The solution to diff against, mirrored into a ref so the mount effect and
		// the diff reconfigure can read it without a remount-forcing dep.
		const solutionReference = useRef(embodiment.source.code);
		solutionReference.current = embodiment.source.code;

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
		// The read view's read-only solution editor (mounted only while reading).
		const readEditorContainer = useRef<HTMLDivElement | null>(null);
		const readEditorView = useRef<EditorView | null>(null);
		// One CodeMirror Compartment per live-reconfigurable scaffold. Lazy-inited
		// once so they are stable across renders; the mount effect seeds them and
		// the reconfigure effects swap their extension live (no remount).
		const compartments = useRef<{
			colorize: Compartment;
			suggestions: Compartment;
			diff: Compartment;
		} | null>(null);
		compartments.current ??= {
			colorize: new Compartment(),
			suggestions: new Compartment(),
			diff: new Compartment(),
		};

		useEffect(
			function mountEditorView() {
				const host = editorContainer.current;
				const compartment = compartments.current;
				if (host && compartment) {
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
							// CONSTANT base — never reconfigured; the scaffold toggles live
							// in the compartments below. The JavaScript language stays
							// always-on (its syntax tree powers `suggestions`' local
							// completion); `oneDarkTheme` is the chrome only — token COLORING
							// is the colorize compartment. `completionKeymap` is harmless
							// when the suggestions compartment is empty (no popup to act on).
							lineNumbers(),
							history(),
							drawSelection(),
							keymap.of([
								...defaultKeymap,
								...historyKeymap,
								...completionKeymap,
							]),
							javascript(),
							oneDarkTheme,
							EditorView.editable.of(true),
							updateListener,
							// Paste blocked in EVERY editable state (no anchors to protect
							// the answer — pasting would defeat the reproduction exercise).
							noPasteExtension(),
							// Live-reconfigurable scaffolds, seeded from the config-derived
							// toggle state read at mount (refs, so this stays deps-free).
							compartment.colorize.of(
								colorizeReference.current
									? syntaxHighlighting(oneDarkHighlightStyle)
									: [],
							),
							compartment.suggestions.of(
								suggestionsReference.current ? snippetFreeAutocomplete() : [],
							),
							// The diff overlay: a self-recomputing StateField (highlights
							// typed-but-wrong lines, recomputed from the live doc). Empty
							// when diff is off; the reconfigure effect swaps it live.
							compartment.diff.of(
								diffReference.current
									? buildWriteDiffField(solutionReference.current)
									: [],
							),
						],
					});
					editorView.current = new EditorView({ state, parent: host });
				}

				return function cleanup() {
					editorView.current?.destroy();
					editorView.current = null;
				};
			},
			// Mount ONCE — deps []. Scaffold toggles live-reconfigure their
			// CodeMirror compartment (below) instead of remounting, so no value here
			// can re-fire the effect and destroy the learner's typed code.
			[],
		);

		// Live-reconfigure each scaffold compartment when its toggle flips — a
		// dispatch, NOT a remount, so the doc / cursor / history are preserved.
		useEffect(
			function reconfigureColorize() {
				const view = editorView.current;
				const compartment = compartments.current;
				if (view && compartment) {
					view.dispatch({
						effects: compartment.colorize.reconfigure(
							colorize ? syntaxHighlighting(oneDarkHighlightStyle) : [],
						),
					});
				}
			},
			[colorize],
		);
		useEffect(
			function reconfigureSuggestions() {
				const view = editorView.current;
				const compartment = compartments.current;
				if (view && compartment) {
					view.dispatch({
						effects: compartment.suggestions.reconfigure(
							suggestions ? snippetFreeAutocomplete() : [],
						),
					});
				}
			},
			[suggestions],
		);
		useEffect(
			function reconfigureDiff() {
				const view = editorView.current;
				const compartment = compartments.current;
				if (view && compartment) {
					view.dispatch({
						effects: compartment.diff.reconfigure(
							diff ? buildWriteDiffField(solutionReference.current) : [],
						),
					});
				}
			},
			[diff],
		);

		// The read view shows the SOLUTION in a read-only editor configured to
		// match the write editor (mirrors colorize; and, when diff is on, the diff
		// PAIR — markers on the solution lines the learner has not yet reproduced).
		// Mounted only while reading; remounts on a colorize or diff change
		// (read-only, so a remount loses nothing).
		useEffect(
			function mountReadEditor() {
				const host = readEditorContainer.current;
				if (viewMode === 'read' && host) {
					const state = EditorState.create({
						doc: embodiment.source.code,
						extensions: [
							lineNumbers(),
							drawSelection(),
							keymap.of([...defaultKeymap]),
							javascript(),
							oneDarkTheme,
							EditorView.editable.of(false),
							EditorState.readOnly.of(true),
							colorize ? syntaxHighlighting(oneDarkHighlightStyle) : [],
							// The diff PAIR: mark the solution lines the learner has NOT
							// yet reproduced (their progress captured at read-view entry —
							// `learnerCode` or, if untouched, the starting template). Static
							// markers; a diff toggle remounts this read-only editor. The
							// learner's code is never shown — only solution-side markers.
							diff
								? buildReadMarkerField(
										learnerCodeReference.current ??
											startingTemplateReference.current,
										embodiment.source.code,
									)
								: [],
						],
					});
					readEditorView.current = new EditorView({ state, parent: host });
				}

				return function cleanup() {
					readEditorView.current?.destroy();
					readEditorView.current = null;
				};
			},
			[viewMode, colorize, diff, embodiment.source.code],
		);

		// Re-seed the LIVE write editor (a doc dispatch, NOT a remount). Used by the
		// comments toggle (pristine only) and Reset.
		function reseedWriteEditor(withComments: boolean) {
			const view = editorView.current;
			if (view) {
				const template = withComments
					? commentSkeleton(embodiment.source.code)
					: '';
				view.dispatch({
					changes: { from: 0, to: view.state.doc.length, insert: template },
				});
			}
		}

		function toggleComments() {
			const next = !keepComments;
			const view = editorView.current;
			// Pristine = the editor still shows the current starting template, OR is
			// empty (nothing to clobber). Only then re-seed; typed work is never
			// clobbered, and a diverged toggle waits for Reset. (DOCS § Why
			// keep-comments re-seeds only while pristine.)
			const currentDoc = view?.state.doc.toString() ?? startingTemplate;
			const pristine = currentDoc === '' || currentDoc === startingTemplate;
			if (pristine) {
				reseedWriteEditor(next);
				setAppliedKeepComments(next);
			}
			setKeepComments(next);
		}

		function resetWriteEditor() {
			reseedWriteEditor(keepComments);
			setAppliedKeepComments(keepComments);
		}

		return (
			<div
				data-lens="writeme"
				data-view-mode={viewMode}
				data-colorize={colorize}
				data-suggestions={suggestions}
				data-comments={keepComments}
				data-diff={diff}
			>
				<div data-writeme-toolbar role="toolbar" aria-label="Editor controls">
					<div data-writeme-views role="group" aria-label="View">
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
					<div data-writeme-assist role="group" aria-label="Assist">
						<label>
							<input
								type="checkbox"
								data-assist-toggle="colorize"
								checked={colorize}
								onChange={function toggleColorize() {
									setColorize(!colorize);
								}}
							/>{' '}
							Colorize
						</label>
						<label>
							<input
								type="checkbox"
								data-assist-toggle="suggestions"
								checked={suggestions}
								onChange={function toggleSuggestions() {
									setSuggestions(!suggestions);
								}}
							/>{' '}
							Suggestions
						</label>
						<label>
							<input
								type="checkbox"
								data-assist-toggle="comments"
								checked={keepComments}
								onChange={toggleComments}
							/>{' '}
							Comments
						</label>
						<label>
							<input
								type="checkbox"
								data-assist-toggle="diff"
								checked={diff}
								onChange={function toggleDiff() {
									setDiff(!diff);
								}}
							/>{' '}
							Diff
						</label>
					</div>
					{/* Actions zone is a layout-only wrapper (no role="group", unlike the
					    views/assist zones): a lone Reset button + its status span is not a
					    semantic group, and grouping a single control would announce a
					    meaningless boundary to assistive tech. */}
					<div data-writeme-actions>
						<button type="button" data-reset onClick={resetWriteEditor}>
							Reset
						</button>
						{keepComments !== appliedKeepComments && (
							<span data-writeme-reseed-pending>Reset to apply</span>
						)}
					</div>
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
						<div ref={readEditorContainer} data-writeme-solution />
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
