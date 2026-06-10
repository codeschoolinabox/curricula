/**
 * @file React wrapper for the `blanks` lens. Default-exports the frozen
 * `LensModule` the orchestrator's `LENS_REGISTRY` consumes.
 *
 * Composes the pure-TS core (`./core.ts`) and the three `lib/` subsystems
 * (`blankenate`, `no-paste-extension`, `evaluate-correctness`)
 * into the lens surface: a `<div data-lens="blanks" data-view-mode="…"
 * data-suggestions="…">` root containing the toolbar,
 * editor header, editor-mode toggle, CodeMirror editor, score, and
 * cursor-scoped hints panel.
 *
 * Behavior owned here:
 * - Mounts CodeMirror with length-matched `_` placeholders for blanked
 *   tokens; the placeholder span behaves as a fixed-width fillable form
 *   field (overwrite-mode UX, directional compaction on `_` deletes,
 *   per-blank correctness-aware decoration class) via `StateField` +
 *   `EditorState.transactionFilter`.
 * - View-mode toggle (`blankenated` / `complete`); editor-mode sub-toggle
 *   (`skeleton` / `diff` / `raw`) for the blankenated view.
 * - Difficulty slider (0–100) and 5 content-type checkboxes (keywords,
 *   identifiers, operators, literals, delimiters); both re-derive the
 *   blank set on change.
 * - Editor header (mode label + difficulty% + total / remaining counts).
 * - Cursor-scoped hints panel with positional letter reveals per
 *   blank, rendered only when `suggestions` is on AND
 *   `viewMode === 'blankenated'` AND `editorMode === 'skeleton'`.
 *
 * Not owned here: the Socratic study companion (Ask Me / socratizing)
 * lives at the SL orchestrator one layer up — it operates on the
 * original embodiment rather than the blankenated source, so it is a
 * cross-lens concern.
 */

import { completionKeymap } from '@codemirror/autocomplete';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorState, StateField } from '@codemirror/state';
import type { ChangeSpec, Text } from '@codemirror/state';
import {
	Decoration,
	EditorView,
	drawSelection,
	keymap,
} from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';
import type { Range } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { basicSetup } from 'codemirror';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';

import { freezeInPlace } from '@utils/freeze.js';

import snippetFreeAutocomplete from '../lib/snippet-free-autocomplete.js';
import type { LensModule, LensProps as LensProperties } from '../types.js';

import blanksCore from './core.js';
import blankenate from './lib/blankenate.js';
import evaluateCorrectness from './lib/evaluate-correctness.js';
import noPasteExtension from './lib/no-paste-extension.js';
import type {
	BlankenateResult,
	ContentType,
	EditorMode,
	ViewMode,
} from './types.js';

import './blanks.css';

const ALL_CONTENT_TYPES: ReadonlyArray<ContentType> = [
	'keywords',
	'identifiers',
	'operators',
	'literals',
	'delimiters',
];

/**
 * Per-blank random-permutation of position indices for the
 * incremental position-reveal hint. Each click on a blank's
 * "Reveal next letter" button advances the reveal count for that
 * blank; this function gives the order in which positions are
 * revealed.
 *
 * Deterministic per `(seed, length)`: same blank in same mount
 * always gets the same permutation, so a learner who reveals 3 out
 * of 5 then closes-and-reopens the panel sees the same 3 positions.
 * The seed is a 32-bit hash of `blank.id`; the permutation is a
 * Fisher-Yates shuffle driven by a mulberry32 PRNG.
 *
 * No `Math.random()` here — the StateField-style determinism makes
 * tests deterministic and avoids the per-render reshuffle that would
 * make every keystroke a different reveal order.
 */
function hashStringTo32Bit(s: string): number {
	let h = 0x811c9dc5; // FNV-1a offset basis
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		// FNV-1a prime multiplication (32-bit). `Math.imul` keeps it 32-bit.
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

function mulberry32(seed: number): () => number {
	let s = seed;
	return function rand() {
		s |= 0;
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function shufflePositions(seed: string, length: number): ReadonlyArray<number> {
	const positions = Array.from({ length }, (_, i) => i);
	const rand = mulberry32(hashStringTo32Bit(seed));
	// Fisher-Yates in-place.
	for (let i = positions.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		const tmp = positions[i]!;
		positions[i] = positions[j]!;
		positions[j] = tmp;
	}
	return positions;
}

/**
 * Render a partial hint for `original` as a POSITIONAL reveal: each
 * already-revealed letter is shown at its ACTUAL position, and every
 * not-yet-revealed position is a bullet (`•`). `shufflePositions` decides
 * the ORDER positions are revealed (a per-blank-stable random order), so
 * clicking "Reveal next letter" exposes one more position — but the display
 * stays positional, so the learner sees WHERE each revealed letter belongs
 * rather than an out-of-order letter inventory.
 *
 * Examples for `hello` (5 chars, with reveal order [3, 0, 4, 1, 2]):
 *  - count 0 → '•••••'   (nothing revealed)
 *  - count 1 → '•••l•'   (position 3)
 *  - count 2 → 'h••l•'   (positions 3, 0)
 *  - count 3 → 'h••lo'   (positions 3, 0, 4)
 *  - count 4 → 'he•lo'   (positions 3, 0, 4, 1)
 *  - count 5 → 'hello'   (all positions)
 *
 * Deterministic per `(seed, length)` — re-visiting a partially-revealed
 * blank shows the same partial state.
 */
function renderPartialHint(
	original: string,
	revealCount: number,
	seed: string,
): string {
	const perm = shufflePositions(seed, original.length);
	const clamped = Math.min(revealCount, perm.length);
	const revealed = new Set(perm.slice(0, clamped));
	return Array.from(original, (character, index) =>
		revealed.has(index) ? character : '•',
	).join('');
}

/**
 * Derives the boolean-map representation of contentTypes the
 * vendored `blankenate` expects, from the array-form `LensConfig`
 * field. Wrapper-internal — no exported type per DOCS § Structural
 * constraints.
 */
function deriveContentTypeFlags(contentTypes: ReadonlyArray<ContentType>): {
	keywords: boolean;
	identifiers: boolean;
	operators: boolean;
	literals: boolean;
	delimiters: boolean;
} {
	const set = new Set(contentTypes);
	return {
		keywords: set.has('keywords'),
		identifiers: set.has('identifiers'),
		operators: set.has('operators'),
		literals: set.has('literals'),
		delimiters: set.has('delimiters'),
	};
}

/**
 * Lock non-placeholder regions via `StateField` + `EditorState
 * .transactionFilter`, and apply per-blank correctness-aware
 * decorations. The fixed-width fillable-field UX:
 *
 * 1. **Length-matched positions** (sub-change A in `lib/blankenate.ts`).
 *    Each blank's `[start, end)` in the source now matches its
 *    `[from, to)` in the editor doc (no shift). Positions captured at
 *    mount; never change because auto-pad preserves width.
 *
 * 2. **Overwrite-mode transactionFilter** (sub-change B). Each
 *    insert/delete inside a blank is rewritten as a single-change
 *    overwrite — width preservation is structural (N→N chars per
 *    rewrite), no trailing-underscore counting needed:
 *    - Insert of N chars at P inside `[A, B)`: rewrite as
 *      `{from: P, to: P + N, insert: insertText}` (OVERWRITES the
 *      next N chars). Containment guard: `fromA >= p.from && fromA
 *      + N <= p.to` — typing past the blank end is rejected.
 *      Cursor → `P + N`.
 *    - Delete of N chars in `[fromA, toA)`: rewrite as
 *      `{from: fromA, to: toA, insert: '_'.repeat(N)}` (replaces
 *      with `_`s, preserving width). Cursor → `fromA`. Note this
 *      means backspace on a `_` is a no-op (replaces `_` with `_`).
 *    - Replace (selection + type, both insertLen and deleteLen > 0):
 *      explicit reject for v1.
 *    - Out-of-blank changes: reject (anchor chars are immutable).
 *
 * 3. **Correctness-aware decoration class** (sub-change C). The
 *    StateField rebuilds the DecorationSet per docChanged, deriving
 *    each blank's class from its current content vs `blank.original`:
 *    - `cm-blank-correct`: content === original
 *    - `cm-blank-incorrect`: no `_` AND content !== original
 *    - `cm-blank-unfilled`: any `_` remaining
 *
 * The wrapper's `evaluateCorrectness` useMemo still computes the
 * aggregate score for the side panel (unchanged). The StateField
 * derives per-blank visual class independently — CM6-native, no
 * React→CM6 effect plumbing for decoration updates.
 */
/**
 * diff-only decoration extension for the `diff` editor
 * mode. Plain CodeMirror (no lockFilter, no autopad) — the learner
 * edits freely. The StateField highlights each character whose
 * doc value differs from `originalCode` at the same byte position.
 * If the doc length diverges from originalCode (learner inserted or
 * deleted chars), positions past the shorter end are highlighted as
 * extras / not marked (graceful degradation; the learner sees the
 * pattern shift as a signal that they've drifted).
 */
function buildDiffDecorations(originalCode: string) {
	const mismatchMark = Decoration.mark({ class: 'cm-diff-mismatch' });
	function decorate(doc: Text): DecorationSet {
		const docStr = doc.toString();
		const marks: Range<Decoration>[] = [];
		const limit = Math.min(docStr.length, originalCode.length);
		for (let i = 0; i < limit; i++) {
			// Treat `_` as "unfilled" — no diff signal (it's not wrong,
			// just empty). Any other mismatch is highlighted red.
			if (docStr[i] !== originalCode[i] && docStr[i] !== '_') {
				marks.push(mismatchMark.range(i, i + 1));
			}
		}
		// Doc longer than originalCode → highlight the extra chars as
		// "extras" (mismatch since they have no counterpart).
		for (let i = limit; i < docStr.length; i++) {
			if (docStr[i] !== '_') {
				marks.push(mismatchMark.range(i, i + 1));
			}
		}
		return Decoration.set(marks, true);
	}
	const diffField = StateField.define<DecorationSet>({
		create(state) {
			return decorate(state.doc);
		},
		update(value, tr) {
			if (!tr.docChanged) return value;
			return decorate(tr.newDoc);
		},
		provide: (f) => EditorView.decorations.from(f),
	});
	return [diffField];
}

function buildLockExtensions(blankResult: BlankenateResult) {
	// length-matched: doc positions === source positions
	// because the placeholder is `_`.repeat(blank.original.length).
	// Captured once at mount; auto-pad preserves blank widths so these
	// positions never shift. Used only by the 'skeleton' editor mode;
	// diff and raw modes get a plain CodeMirror with no lock/autopad.
	const sortedBlanks = [...blankResult.blanks].sort(
		(a, b) => a.start - b.start,
	);
	const positions = sortedBlanks.map((blank) => ({
		from: blank.start,
		to: blank.end,
		original: blank.original,
	}));

	function deriveClass(content: string, original: string): string {
		if (content === original) return 'cm-blank-correct';
		if (content.includes('_')) return 'cm-blank-unfilled';
		return 'cm-blank-incorrect';
	}

	function buildCorrectnessDecorations(doc: Text): DecorationSet {
		// Zero-width blanks (`original === ''`) are not pedagogically
		// meaningful — they have no characters to fill. Skip them at
		// decoration-set construction so the StateField never has to
		// reason about empty ranges (which the autoPad rejection at
		// "trailing underscores < insertLen" would silently confuse for
		// a "blank is full" state). AR-4 guard.
		//
		// alternating parity classes so adjacent blanks
		// render in different chunk colors (CVD-safe palette per
		// blanks.css). Parity is by visible-blank index (post-filter),
		// not by the original blank ordering, so chunks alternate
		// cleanly even when some blanks are zero-width and skipped.
		const visible = positions.filter(({ from, to }) => to > from);
		return Decoration.set(
			visible.map(({ from, to, original }, i) => {
				const content = doc.sliceString(from, to);
				const cls = deriveClass(content, original);
				const parity =
					i % 2 === 0 ? 'cm-blank-parity-even' : 'cm-blank-parity-odd';
				return Decoration.mark({ class: `${cls} ${parity}` }).range(from, to);
			}),
			true,
		);
	}

	const blanksField = StateField.define<DecorationSet>({
		create(state) {
			return buildCorrectnessDecorations(state.doc);
		},
		// Performance note (AR-4): rebuilds the entire
		// DecorationSet from scratch on every docChanged transaction —
		// O(N) per keystroke where N = blanks count. Fine at typical
		// snippet sizes (5–20 blanks). At 100+ blanks per snippet the
		// per-keystroke cost becomes measurable. Optimization path
		// (when needed): consult `tr.changes.touchesRange(p.from, p.to)`
		// per blank, reclassify only the touched blank(s), and call
		// `value.map(tr.changes)` for the rest. Positions are stable
		// (auto-pad preserves width), so position-mapping is identity.
		update(value, tr) {
			if (!tr.docChanged) return value;
			return buildCorrectnessDecorations(tr.newDoc);
		},
		provide: (f) => EditorView.decorations.from(f),
	});

	// Multi-cursor caveat (AR-4): `iterChanges` may fire multiple
	// times for one transaction (multi-cursor + simultaneous edit, or
	// programmatic multi-change dispatch). `primarySelection` is
	// overwritten by each iteration — only one cursor is returned even
	// if two blanks were filled. In practice CM6 multi-cursor is
	// uncommon for this use case (learners type single-char inserts via
	// keyboard, and noPasteExtension blocks bulk paste), so the
	// limitation is low risk. Worth surfacing if multi-cursor support
	// is ever explicitly added.
	//
	// overwrite mode (user-directed UX refinement): each blank
	// behaves as a fixed-width "form field". Typing at any position
	// inside a blank OVERWRITES the char there (whether it's `_` or a
	// previously-typed char). Backspace replaces the char-before-cursor
	// with `_`. Delete-forward replaces the char-at-cursor with `_`.
	// Width is preserved by construction (each rewrite is N→N chars,
	// never net-zero-length-shift required). Replaces typing-as-consume-
	// trailing-underscore from the earlier design.
	const lockFilter = EditorState.transactionFilter.of((tr) => {
		if (!tr.docChanged) return tr;

		const newChanges: ChangeSpec[] = [];
		let allowed = true;
		let primarySelection: number | undefined;

		tr.changes.iterChanges(
			(
				fromA: number,
				toA: number,
				_fromB: number,
				_toB: number,
				inserted: Text,
			) => {
				const insertText = inserted.toString();
				const insertLen = insertText.length;
				const deleteLen = toA - fromA;

				// Defensive (AR-4 MINOR 4): a zero-width no-op
				// change (insertLen === 0 && deleteLen === 0) would
				// produce a spurious cursor-set transaction. CM6
				// usually prunes these before calling the filter, but
				// IME and programmatic dispatches may not. Skip them.
				if (insertLen === 0 && deleteLen === 0) return;

				if (insertLen > 0 && deleteLen === 0) {
					// Pure insert → overwrite the next `insertLen` chars
					// starting at `fromA`. The OVERWRITE range
					// `[fromA, fromA + insertLen)` must fit entirely
					// inside a blank — typing past the blank end is
					// rejected (would corrupt anchor text).
					const overwriteEnd = fromA + insertLen;
					const blank = positions.find(
						(p) => fromA >= p.from && overwriteEnd <= p.to,
					);
					if (!blank) {
						allowed = false;
						return;
					}
					newChanges.push({
						from: fromA,
						to: overwriteEnd,
						insert: insertText,
					});
					primarySelection = overwriteEnd;
				} else if (insertLen === 0 && deleteLen > 0) {
					// Pure delete → preserve blank width. The DELETE range
					// `[fromA, toA)` must fit entirely inside a blank.
					const blank = positions.find((p) => fromA >= p.from && toA <= p.to);
					if (!blank) {
						allowed = false;
						return;
					}

					// directional compaction for deleting `_`s:
					// when the deleted range is a single `_`, the
					// deletion compacts typed chars in the direction
					// opposite to the freed space. The direction is
					// derived from the cursor position BEFORE the delete:
					//
					//   - cursor === toA → backspace (cursor was AFTER
					//     the deleted char). Chars right of the `_`
					//     shift left; new `_` pads at blank.to (end).
					//     Cursor → fromA (standard backspace move).
					//
					//   - cursor === fromA → Del (cursor was AT the
					//     deleted char). Chars left of the `_` shift
					//     right; new `_` pads at blank.from (front).
					//     Cursor → fromA + 1 (matches the rightward
					//     shift of left-side text).
					//
					// Single-char-only: multi-char range deletes (e.g.
					// programmatic) fall back to the in-place `_`
					// replacement (no compaction) for simplicity.
					const deletedContent = tr.startState.doc.sliceString(fromA, toA);
					if (deleteLen === 1 && deletedContent === '_') {
						const cursorBefore = tr.startState.selection.main.head;
						if (cursorBefore === toA) {
							// Backspace on `_`: shift right-text left, pad at end.
							newChanges.push({ from: fromA, to: toA });
							newChanges.push({ from: blank.to, insert: '_' });
							primarySelection = fromA;
						} else if (cursorBefore === fromA) {
							// Del on `_`: shift left-text right, pad at front.
							newChanges.push({ from: fromA, to: toA });
							newChanges.push({ from: blank.from, insert: '_' });
							primarySelection = fromA + 1;
						} else {
							// Cursor neither at fromA nor toA (programmatic
							// or unusual): fall through to in-place replace.
							newChanges.push({
								from: fromA,
								to: toA,
								insert: '_',
							});
							primarySelection = fromA;
						}
					} else {
						// Multi-char delete OR deleted content includes
						// typed chars: in-place replace with `_`s.
						newChanges.push({
							from: fromA,
							to: toA,
							insert: '_'.repeat(deleteLen),
						});
						primarySelection = fromA;
					}
				} else {
					// Replace (selection + type) — explicit reject for v1.
					// Could be supported by combining the overwrite logic
					// above with a length-mismatch guard, but defer.
					allowed = false;
				}
			},
		);

		if (!allowed) return [];

		return {
			changes: newChanges,
			selection:
				primarySelection === undefined
					? undefined
					: { anchor: primarySelection },
		};
	});

	return [blanksField, lockFilter];
}

const BlanksComponent: ComponentType<LensProperties> =
	function BlanksComponent({ embodiment, config }) {
		// Memoize resolved config on the `config` prop (stable reference from
		// the orchestrator). Without this, `blanksCore.config()` produces a
		// fresh frozen clone on every render — including a fresh
		// `contentTypes` array — which would cascade into spurious
		// `blankenate` re-rolls whenever a parent re-renders (load-bearing
		// once adds local state to the wrapper).
		const resolved = useMemo(() => blanksCore.config(config), [config]);
		const initialDifficulty =
			typeof resolved.difficulty === 'number' ? resolved.difficulty : 50;
		// difficulty is now LOCAL state, seeded from the prop config.
		// The slider mutates this directly; the blankenate useMemo deps now
		// include `difficulty` so the blank set re-derives per drag.
		const [difficulty, setDifficulty] = useState<number>(initialDifficulty);

		// contentTypes is now LOCAL state, seeded from the prop
		// config (default = all five). The checkboxes mutate this directly;
		// the blankenate useMemo deps include `contentTypes` so the blank
		// set re-derives per toggle.
		//
		// Defensive: filter the prop-supplied array against ALL_CONTENT_TYPES
		// rather than casting blindly. An educator config with a typo (e.g.
		// `contentTypes: ['keywrds']`) degrades to the all-five default
		// element-by-element rather than silently breaking blankenate.
		const initialContentTypes: ReadonlyArray<ContentType> = Array.isArray(
			resolved.contentTypes,
		)
			? (resolved.contentTypes as ReadonlyArray<unknown>).filter(
					(t): t is ContentType =>
						(ALL_CONTENT_TYPES as ReadonlyArray<string>).includes(t as string),
				)
			: ALL_CONTENT_TYPES;
		const [contentTypes, setContentTypes] =
			useState<ReadonlyArray<ContentType>>(initialContentTypes);

		// View-mode state. Seeded from config.viewMode (default
		// 'blankenated' via blanksCore.config). The toggle preserves the
		// learner's in-progress edits across mode swaps (AR-1 lock —
		// disposable-practice governs unmount, not within-mount toggle).
		const initialViewMode: ViewMode =
			resolved.viewMode === 'complete' ? 'complete' : 'blankenated';
		const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);

		// editor-mode sub-toggle (only meaningful when
		// viewMode === 'blankenated'). Three variants from easiest to
		// hardest: 'skeleton' (full correctness colors + hints panel) →
		// 'diff' (char-level diff against hidden original; no hints) →
		// 'raw' (no feedback of any kind). Seeded from config.editorMode
		// (default 'skeleton').
		const initialEditorMode: EditorMode =
			resolved.editorMode === 'diff'
				? 'diff'
				: resolved.editorMode === 'raw'
					? 'raw'
					: 'skeleton';
		const [editorMode, setEditorMode] = useState<EditorMode>(initialEditorMode);

		// switching the scaffolding level (editorMode)
		// resets the exercise. The free editors (diff/raw) allow arbitrary
		// edits that may violate the skeleton editor's length-match +
		// anchor-lock invariants — carrying that arbitrary state into the
		// skeleton editor would put it in a corrupted starting position.
		// Reset clears learnerCode (so the next mount picks up blankedCode
		// from blankenate) and revealCounts (fresh hint state per exercise).
		function changeEditorMode(next: EditorMode) {
			setEditorMode(next);
			setLearnerCode(null);
			setRevealCounts(new Map());
			// AR-4 MINOR also reset cursorPos so the hints
			// panel doesn't briefly resolve a stale cursor against the new
			// (just-rebuilt) editor and flash an out-of-date reveal state.
			// The new editor's updateListener overwrites cursorPos on first
			// focus event regardless; this reset just makes the transient
			// state empty rather than misleading.
			setCursorPos(null);
		}

		// Learner edits state. null = no edits yet → editor uses
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
			// difficulty + contentTypes are LOCAL state, so each
			// is an independent signal for re-derivation. blankResult identity
			// changes on slider drag (6e) or checkbox toggle (6f) → the
			// mountEditorView effect remounts the editor with the new
			// blankedCode. The change handlers (handleDifficultyChange /
			// handleContentTypeToggle) also reset learnerCode per DOCS § Phase 2:
			// "Re-derivation on settings change resets the correctness map."
			[embodiment.source.code, difficulty, contentTypes],
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

		// difficulty change handler. Updates local difficulty AND
		// resets learnerCode so the new (different) blank positions start
		// from a clean slate. Per DOCS § Phase 2: "Re-derivation on settings
		// change resets the correctness map" — the wrapper does NOT preserve
		// correctness across re-rolls because the old learner answers no
		// longer correspond to new blank positions.
		function handleDifficultyChange(
			event: React.ChangeEvent<HTMLInputElement>,
		): void {
			const next = Number(event.target.value);
			setDifficulty(next);
			setLearnerCode(null);
		}

		// toggle a content-type category in/out of the eligible set.
		// Same reset-learnerCode logic as the slider — the new blank set has
		// different positions, so the old typed text no longer aligns.
		function handleContentTypeToggle(type: ContentType): void {
			setContentTypes((current) =>
				current.includes(type)
					? current.filter((t) => t !== type)
					: [...current, type],
			);
			setLearnerCode(null);
		}

		// per-blank correctness wiring + aggregate score display.
		// evaluateCorrectness is pure; recomputes on learnerCode change
		// (typing dispatches setLearnerCode) and on blankResult change
		// (snippet / future-difficulty / future-content-types).
		const evaluation = useMemo(() => {
			if (blankResult === null) {
				return freezeInPlace({
					score: 100,
					total: 0,
					correct: 0,
					unfilled: 0,
				});
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
			// View-model: only the fields the score panel renders. The evaluator
			// also returns `incorrect` and the per-blank `correctnessMap`; those
			// are intentionally NOT surfaced here — the editor paints its own
			// per-blank decorations (see `deriveClass`) and the map is a
			// test/inspection surface (see EvaluationResult's JSDoc).
			return freezeInPlace({
				score: result.score,
				total: result.total,
				correct: result.correct,
				unfilled: result.unfilled,
			});
		}, [learnerCode, blankResult]);

		// snippet-free autocomplete toggle (opt-in). Seeded from
		// config.suggestions (default false). The mount effect adds
		// `snippetFreeAutocomplete()` to the editor when on; the checkbox
		// mutates this and the editor remounts (suggestions is in the mount
		// deps) WITHOUT resetting learnerCode — so toggling preserves work.
		const initialSuggestions: boolean = resolved.suggestions === true;
		const [suggestions, setSuggestions] = useState<boolean>(initialSuggestions);

		// cursor position state. Updated by the CodeMirror
		// updateListener on selectionSet. Render-only state — does NOT
		// appear in the editor mount effect's deps (would re-mount per
		// keystroke; see remount bug).
		const [cursorPos, setCursorPos] = useState<number | null>(null);

		// per-blank reveal-count. Each click of "Reveal next
		// letter" advances the count by 1 for that blank, exposing one
		// more position of the correct answer (in the
		// `shufflePositions(blank.id, length)` order). Count of 0 means
		// no letters revealed yet; count of `blank.original.length` means
		// fully revealed. Persistent across cursor moves — coming back to
		// a partially-revealed blank shows the same partial state.
		const [revealCounts, setRevealCounts] = useState<
			ReadonlyMap<string, number>
		>(() => new Map());

		// derive the blank under cursor. Positions align 1:1
		// with the doc per length-matched placeholders. A cursor
		// at a blank boundary (`from` or `to`) counts as "in" the blank;
		// cursors in anchor segments return null.
		const activeBlank = useMemo(() => {
			if (cursorPos === null || blankResult === null) return null;
			return (
				blankResult.blanks.find(
					(b) => cursorPos >= b.start && cursorPos <= b.end,
				) ?? null
			);
		}, [cursorPos, blankResult]);

		// Mount the CodeMirror EditorView. Destroy + recreate on STRUCTURAL
		// changes only: viewMode flips, or blankResult re-derives (source /
		// difficulty / contentTypes change). Per-keystroke `learnerCode`
		// updates flow through the updateListener into React state but MUST
		// NOT re-fire this effect — that would feedback-loop and destroy
		// the EditorView mid-typing.

		// Editability + paste wiring per view-mode:
		//   - blankenated mode → editable, noPasteExtension wired,
		//     updateListener captures learner edits into learnerCode state.
		//   - complete mode → read-only, no paste extension, no listener
		//     reaction to docChanged.
		useEffect(
			function mountEditorView() {
				const host = editorContainer.current;
				if (!host) return;

				// only `complete` viewMode is read-only.
				// `blankenated` is editable; the editor-mode sub-toggle
				// (skeleton/diff/raw) controls which decorations attach.
				const isBlankenated = viewMode === 'blankenated';
				const isEditable = isBlankenated;

				// Derive the initial document INSIDE the effect closure so
				// learnerCode is read from the ref (not state-as-dep).
				// Editable modes (blankenated, diff, raw) all show the
				// blankedCode (or the learner's in-progress edits via the
				// ref). Complete mode shows the originalCode read-only.
				const initialDoc =
					blankResult === null
						? embodiment.source.code
						: isEditable
							? (learnerCodeRef.current ?? blankResult.blankedCode)
							: blankResult.originalCode;

				const updateListener = EditorView.updateListener.of(
					function onUpdate(update) {
						if (!isEditable) return;
						// Mirror the learner's edit into local state. The wrapper's
						// updateListener NEVER calls the orchestrator's snippet setter
						// per the single-writer invariant (DOCS § Structural constraints
						// "CodeMirror writes to local state, never to setSnippet").
						if (update.docChanged) {
							setLearnerCode(update.state.doc.toString());
						}
						// capture cursor position so the cursor-scoped
						// hints panel knows which blank to surface (only relevant
						// in `blankenated` mode but harmless to track in others).
						if (update.selectionSet || update.docChanged) {
							setCursorPos(update.state.selection.main.head);
						}
					},
				);

				// Editor-mode extensions:
				//   skeleton → basicSetup (autocomplete, bracket matching, lint,
				//             etc.) + lockFilter + autopad + noPasteExtension
				//             + correctness decorations (full scaffolding)
				//   diff    → minimalSetup (no autocomplete, no bracket
				//             matching, no lint diagnostics, no tooltips) +
				//             char-level diff highlights; no lock, no
				//             autopad, paste allowed — the diff IS the hint
				//   raw     → minimalSetup only; nothing else
				// `minimalSetup` retains just the essentials: history (so
				// undo/redo works), drawSelection (visible cursor), and the
				// default + history keymaps. JavaScript syntax highlighting
				// stays in all modes (readability isn't a "hint"; it's just
				// the editor not being broken).
				const skeletonBaseline = basicSetup;
				const minimalBaseline = [
					history(),
					drawSelection(),
					keymap.of([...defaultKeymap, ...historyKeymap]),
				];
				const isSkeleton = editorMode === 'skeleton';
				const baseline = isSkeleton ? skeletonBaseline : minimalBaseline;

				const editorExtensions =
					!isEditable || blankResult === null
						? []
						: isSkeleton
							? [noPasteExtension(), ...buildLockExtensions(blankResult)]
							: editorMode === 'diff'
								? buildDiffDecorations(blankResult.originalCode)
								: [];

				// Snippet-free AUTOCOMPLETE is offered only in diff/raw. skeleton's
				// fixed-width overwrite blanks conflict with it: the lock filter
				// strips the `input.type` userEvent (so the popup never activates)
				// AND rejects the variable-length completion insert. The Suggestions
				// checkbox still SHOWS in skeleton — there it drives the hints panel
				// instead. minimalBaseline has no completion engine or
				// completionKeymap, so both are added here.
				const suggestionsExtensions =
					isEditable && suggestions && !isSkeleton
						? [snippetFreeAutocomplete(), keymap.of(completionKeymap)]
						: [];

				const state = EditorState.create({
					doc: initialDoc,
					extensions: [
						baseline,
						javascript(),
						oneDark,
						EditorView.editable.of(isEditable),
						EditorState.readOnly.of(!isEditable),
						updateListener,
						...editorExtensions,
						...suggestionsExtensions,
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
			// recreate the regression bug fixed in
			// embodiment.source.code is captured via blankResult (memoized on
			// embodiment.source.code + resolved); including it here directly
			// would just duplicate the blankResult-driven remount path.
			// `suggestions` is a structural-remount trigger (it adds/removes
			// the snippet-free autocomplete extension); the remount re-reads
			// learnerCodeRef so the document survives (no learnerCode reset —
			// modelled on the viewMode path, NOT changeEditorMode).
			[viewMode, editorMode, blankResult, suggestions],
		);

		// Render: on null blankResult (defense-in-depth) render ONLY the
		// fallback panel, not toolbar + editor. README § Edge cases says
		// the wrapper renders the fallback "rather than the editor."
		return (
			<div
				data-lens="blanks"
				data-view-mode={viewMode}
				data-suggestions={String(suggestions)}
			>
				{showFallback ? (
					<div
						data-blanks-fallback="parse-fail"
						role="alert"
						style={{ padding: '0.5rem', color: '#c33' }}
					>
						Snippet did not parse — the blanks lens requires a parseable source
						(defense-in-depth; applicableTo should have prevented mount).
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
							{viewMode === 'blankenated' && (
								<div
									data-blanks-editor-mode
									role="group"
									aria-label="Editor mode"
								>
									<span>Editor:</span>
									<button
										type="button"
										data-editor-mode-toggle="skeleton"
										aria-pressed={editorMode === 'skeleton' ? 'true' : 'false'}
										onClick={() => changeEditorMode('skeleton')}
									>
										🦴 Skeleton
									</button>
									<button
										type="button"
										data-editor-mode-toggle="diff"
										aria-pressed={editorMode === 'diff' ? 'true' : 'false'}
										onClick={() => changeEditorMode('diff')}
									>
										📋 Diff
									</button>
									<button
										type="button"
										data-editor-mode-toggle="raw"
										aria-pressed={editorMode === 'raw' ? 'true' : 'false'}
										onClick={() => changeEditorMode('raw')}
									>
										🪨 Raw
									</button>
								</div>
							)}
							<label data-difficulty-control>
								Difficulty: {difficulty}%
								<input
									type="range"
									min="0"
									max="100"
									value={difficulty}
									onChange={handleDifficultyChange}
									data-difficulty-slider
									aria-label="Blanks difficulty (0 to 100)"
								/>
							</label>
							<fieldset data-content-types>
								<legend>Eligible token categories</legend>
								{ALL_CONTENT_TYPES.map((type) => (
									<label key={type}>
										<input
											type="checkbox"
											checked={contentTypes.includes(type)}
											onChange={() => handleContentTypeToggle(type)}
											data-content-type={type}
										/>
										{type}
									</label>
								))}
							</fieldset>
							{viewMode === 'blankenated' && (
								<label data-blanks-suggestions>
									<input
										type="checkbox"
										data-assist-toggle="suggestions"
										checked={suggestions}
										onChange={() => setSuggestions(!suggestions)}
									/>{' '}
									Suggestions
								</label>
							)}
						</div>
						<div
							data-blanks-editor-header
							data-header-mode={viewMode}
							data-header-difficulty={String(difficulty)}
							data-header-blanks-total={String(evaluation.total)}
							data-header-blanks-remaining={String(evaluation.unfilled)}
							aria-live="polite"
						>
							Mode: <strong>{viewMode}</strong> · Difficulty: {difficulty}%
							{' · '}Blanks: {evaluation.total} · Remaining:{' '}
							{evaluation.unfilled}
						</div>
						<div ref={editorContainer} data-blanks-editor-host />
						<div
							data-blanks-score={String(evaluation.score)}
							data-blanks-total={String(evaluation.total)}
							data-blanks-correct={String(evaluation.correct)}
							aria-live="polite"
						>
							Score: {evaluation.score}%
							{evaluation.total > 0 && (
								<>
									{' '}
									({evaluation.correct} / {evaluation.total} blanks)
								</>
							)}
						</div>
						{suggestions &&
							viewMode === 'blankenated' &&
							editorMode === 'skeleton' && (
								<aside data-blanks-hints aria-label="Hints panel">
									<h4>Hint</h4>
									{activeBlank === null ? (
										<p data-hint-empty>
											Place the cursor in a blank to request a hint.
										</p>
									) : (
										(() => {
											const count = revealCounts.get(activeBlank.id) ?? 0;
											const total = activeBlank.original.length;
											const fullyRevealed = count >= total;
											return (
												<>
													<p
														data-hint-revealed
														data-hint-blank-id={activeBlank.id}
														data-hint-type={activeBlank.type}
														data-hint-reveal-count={String(count)}
														data-hint-reveal-total={String(total)}
													>
														{activeBlank.type}:{' '}
														<code data-hint-partial>
															{renderPartialHint(
																activeBlank.original,
																count,
																activeBlank.id,
															)}
														</code>{' '}
														({count} / {total} revealed)
													</p>
													{!fullyRevealed && (
														<button
															type="button"
															data-hint-reveal-button
															data-hint-blank-id={activeBlank.id}
															onClick={() => {
																const id = activeBlank.id;
																setRevealCounts((prev) => {
																	const next = new Map(prev);
																	const cur = next.get(id) ?? 0;
																	next.set(id, cur + 1);
																	return next;
																});
															}}
														>
															Reveal next letter
														</button>
													)}
												</>
											);
										})()
									)}
								</aside>
							)}
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
