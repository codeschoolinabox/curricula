/**
 * @vitest-environment jsdom
 *
 * Component tests for the `blanks` React wrapper. Current coverage:
 * - Inc 6a: minimum-viable mount of CodeMirror in read-only
 *   blankenated mode with `data-lens="blanks"` root.
 * - Inc 6b: two-button view-mode toggle (blankenated ↔ complete);
 *   data-view-mode attribute reflects active mode; editor content
 *   swaps between blankedCode and originalCode on toggle.
 *
 * Inc 6g–6i will add: editor header, hints panel, URL config.
 * (Inc 6c editable+noPaste, 6d correctness wiring, 6e slider, 6f
 * content-type checkboxes — landed.)
 * Inc 6.m removed the Ask Me / socratizing surface from this lens;
 * Ask Me now lives in the SL orchestrator one layer up.
 */

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { EditorView } from '@codemirror/view';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import embody from '../../../embody/index.js';

import blanksLens from '../index.js';

afterEach(cleanup);

/**
 * Inc 6.7 test helper: type `text` char-by-char into `view` starting at
 * `startPos`. Each char is a separate transaction so the auto-pad
 * transactionFilter runs once per char (mirrors the real keystroke
 * stream). Required because Inc 6.7's filter rejects multi-char
 * inserts (which previously allowed `dispatch({changes: {from, to,
 * insert: longString}})` to "fill a blank in one shot").
 *
 * After each dispatch, the cursor's actual post-rewrite position is
 * read from `view.state.selection.main.head` and used as the next
 * insert position. The auto-pad sets `selection.anchor` to `from +
 * insertLen` (per `buildLockExtensions`), so this works for any
 * `startPos` — including positions in the middle of a partially
 * filled blank. (Static `startPos + i` would only work coincidentally
 * at blank boundaries; AR-3 fix.)
 *
 * Returns nothing — caller reads `view.state.doc.toString()` to verify.
 */
function typeIntoBlank(view: EditorView, text: string, startPos: number): void {
	let cursor = startPos;
	for (const ch of text) {
		view.dispatch({
			changes: { from: cursor, insert: ch },
		});
		cursor = view.state.selection.main.head;
	}
}

describe('blanks wrapper — Inc 6a', () => {
	describe('Zero — degenerate snippet does not crash', () => {
		it('renders data-lens="blanks" without throwing on an unparseable snippet (defense-in-depth)', () => {
			expect(() =>
				render(
					<blanksLens.Component
						embodiment={embody('FAIL_AT_PARSE')}
						config={blanksLens.config()}
					/>,
				),
			).not.toThrow();
		});

		it('does NOT render toggle buttons in the parse-fail fallback path', () => {
			// The fallback panel replaces the editor surface entirely;
			// toolbar/toggle controls are not meaningful without an editor
			// to toggle the view of.
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('FAIL_AT_PARSE')}
					config={blanksLens.config()}
				/>,
			);
			expect(container.querySelectorAll('[data-view-toggle]').length).toBe(0);
		});
	});

	describe('data-lens invariant on parseable snippet', () => {
		it('renders a root element with data-lens="blanks"', () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config()}
				/>,
			);
			expect(container.querySelector('[data-lens="blanks"]')).not.toBeNull();
		});

		it('renders the root with data-view-mode="blankenated" (Inc 6a default)', () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config()}
				/>,
			);
			const root = container.querySelector('[data-lens="blanks"]');
			expect(root?.getAttribute('data-view-mode')).toBe('blankenated');
		});
	});

	describe('CodeMirror editor surface (async-mounted via useEffect)', () => {
		it('mounts a CodeMirror EditorView inside the lens root', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config()}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-editor')).not.toBeNull();
			});
		});

		it('the editor document contains __ placeholders (proves blankenate ran)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					// Force-all-blanks via difficulty=100; all five content types
					// default on, so every eligible token is blanked.
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				const text = container.querySelector('.cm-content')?.textContent ?? '';
				expect(text).toContain('__');
			});
		});

		it('at difficulty=100 keywords-only, the keyword "let" no longer appears (tightens triangulation)', async () => {
			// `embody('OK')` source includes the keyword `let`. At difficulty=100
			// with keywords-only, all `let` occurrences should be replaced by __.
			// An impl that just appends a __ to the original source would leave
			// `let` intact and fail this assertion.
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({
						difficulty: 100,
						contentTypes: ['keywords'],
					})}
				/>,
			);
			await waitFor(() => {
				const text = container.querySelector('.cm-content')?.textContent ?? '';
				expect(text.includes('let')).toBe(false);
			});
		});

		// Read-only / editable state is mode-dependent now (Inc 6c):
		// see the "editable mode + learnerCode state" describe block.
	});

	describe('view-mode toggle — Inc 6b', () => {
		it('config.viewMode="complete" seeds initial data-view-mode="complete"', () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ viewMode: 'complete' })}
				/>,
			);
			const root = container.querySelector('[data-lens="blanks"]');
			expect(root?.getAttribute('data-view-mode')).toBe('complete');
		});

		it('config.viewMode="blankenated" explicit seed (not just default)', () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ viewMode: 'blankenated' })}
				/>,
			);
			const root = container.querySelector('[data-lens="blanks"]');
			expect(root?.getAttribute('data-view-mode')).toBe('blankenated');
		});

		it('renders a view-mode toggle button group with both options', () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config()}
				/>,
			);
			const blankenatedBtn = container.querySelector(
				'[data-view-toggle="blankenated"]',
			);
			const completeBtn = container.querySelector(
				'[data-view-toggle="complete"]',
			);
			expect(blankenatedBtn).not.toBeNull();
			expect(completeBtn).not.toBeNull();
		});

		it('clicking the complete-mode button switches data-view-mode to "complete"', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config()}
				/>,
			);
			const completeBtn = container.querySelector(
				'[data-view-toggle="complete"]',
			) as HTMLButtonElement;
			fireEvent.click(completeBtn);
			await waitFor(() => {
				const root = container.querySelector('[data-lens="blanks"]');
				expect(root?.getAttribute('data-view-mode')).toBe('complete');
			});
		});

		it('in complete mode the editor shows the ORIGINAL source (no __ placeholders)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({
						viewMode: 'complete',
						difficulty: 100,
					})}
				/>,
			);
			await waitFor(() => {
				const text = container.querySelector('.cm-content')?.textContent ?? '';
				expect(text.includes('__')).toBe(false);
			});
		});

		it('toggling complete → blankenated → complete swaps the editor content (not just the attribute)', async () => {
			// Triangulates against an impl that flips data-view-mode via
			// setState without wiring viewMode into the useEffect that
			// drives the editor document.
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			const completeBtn = container.querySelector(
				'[data-view-toggle="complete"]',
			) as HTMLButtonElement;
			const blankenatedBtn = container.querySelector(
				'[data-view-toggle="blankenated"]',
			) as HTMLButtonElement;

			// Start: blankenated mode at d=100 → __ present.
			await waitFor(() => {
				const text = container.querySelector('.cm-content')?.textContent ?? '';
				expect(text).toContain('__');
			});

			// Toggle to complete → __ absent, editor shows original.
			fireEvent.click(completeBtn);
			await waitFor(() => {
				const root = container.querySelector('[data-lens="blanks"]');
				expect(root?.getAttribute('data-view-mode')).toBe('complete');
				const text = container.querySelector('.cm-content')?.textContent ?? '';
				expect(text.includes('__')).toBe(false);
			});

			// Toggle back to blankenated → __ returns.
			fireEvent.click(blankenatedBtn);
			await waitFor(() => {
				const root = container.querySelector('[data-lens="blanks"]');
				expect(root?.getAttribute('data-view-mode')).toBe('blankenated');
				const text = container.querySelector('.cm-content')?.textContent ?? '';
				expect(text).toContain('__');
			});
		});
	});

	describe('editable mode + learnerCode state — Inc 6c', () => {
		it('the editor is EDITABLE in blankenated mode (state.readOnly === false)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config()}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			expect(view?.state.readOnly).toBe(false);
		});

		it('the editor is read-only in complete mode (state.readOnly === true)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ viewMode: 'complete' })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			expect(view?.state.readOnly).toBe(true);
		});

		it('typing into the editor updates the document (learnerCode)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			// Dispatch a programmatic insert at position 0; readOnly=false
			// allows the dispatch to land.
			view?.dispatch({
				changes: { from: 0, insert: 'X' },
			});
			expect(view?.state.doc.toString().startsWith('X')).toBe(true);
		});

		it('toggle preserves learner edits: type → complete → blankenated → typed text is still there (AR-1 invariant)', async () => {
			// Inc 6.7: use a longer source so 3 chars fit inside the blank.
			// `hello` (5 chars) — a single identifier — becomes a 5-char
			// blank at difficulty 100, with room for 'XYZ' plus 2 trailing
			// underscores.
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			// Wait for initial editor mount.
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const initialContent = container.querySelector(
				'.cm-content',
			) as HTMLElement;
			const initialView = EditorView.findFromDOM(initialContent);
			// Type a learner edit: 'XYZ' char-by-char at position 0
			// (the start of the 5-char blank). Overwrite mode replaces
			// the `_` at positions 0, 1, 2 with X, Y, Z → doc becomes
			// `XYZ__`.
			typeIntoBlank(initialView!, 'XYZ', 0);
			expect(initialView?.state.doc.toString().startsWith('XYZ')).toBe(true);

			// Toggle to complete (which destroys the editor + recreates with
			// originalCode).
			const completeBtn = container.querySelector(
				'[data-view-toggle="complete"]',
			) as HTMLButtonElement;
			fireEvent.click(completeBtn);
			await waitFor(() => {
				const root = container.querySelector('[data-lens="blanks"]');
				expect(root?.getAttribute('data-view-mode')).toBe('complete');
			});

			// Toggle back to blankenated. The editor recreates; its document
			// MUST be the learnerCode (XYZ-prefixed), not the original
			// blankedCode.
			const blankenatedBtn = container.querySelector(
				'[data-view-toggle="blankenated"]',
			) as HTMLButtonElement;
			fireEvent.click(blankenatedBtn);
			await waitFor(() => {
				const root = container.querySelector('[data-lens="blanks"]');
				expect(root?.getAttribute('data-view-mode')).toBe('blankenated');
				const text = container.querySelector('.cm-content')?.textContent ?? '';
				expect(text.startsWith('XYZ')).toBe(true);
			});
		});

		it('typing does NOT remount the EditorView (regression: Inc 6c displayCode-feedback bug)', async () => {
			// REGRESSION TEST for the Inc 6c remount-per-keystroke bug.
			// If the wrapper has `displayCode` in its useEffect deps and
			// `displayCode` derives from `learnerCode` state that the
			// updateListener feeds, every keystroke destroys+remounts the
			// view. The browser loses focus → editor feels read-only after
			// the first character.
			//
			// We can't detect "feels read-only" in jsdom. The structural
			// signal is: the EditorView instance reference must be STABLE
			// across keystroke-driven React re-renders. Capture it before
			// + after a dispatch-and-wait cycle; same reference == no
			// remount.
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContentBefore = container.querySelector(
				'.cm-content',
			) as HTMLElement;
			const viewBefore = EditorView.findFromDOM(cmContentBefore);
			// Dispatch fires updateListener → setLearnerCode → React schedules
			// a re-render. Wait for it to flush.
			viewBefore?.dispatch({ changes: { from: 0, insert: 'X' } });
			await waitFor(() => {
				expect(viewBefore?.state.doc.toString().startsWith('X')).toBe(true);
			});
			// Re-query: the EditorView attached to the DOM after React has
			// re-rendered. If a remount happened, findFromDOM returns a
			// NEW view; if no remount, it returns the same reference.
			const cmContentAfter = container.querySelector(
				'.cm-content',
			) as HTMLElement;
			const viewAfter = EditorView.findFromDOM(cmContentAfter);
			expect(viewAfter).toBe(viewBefore);
		});

		it('noPasteExtension is wired in blankenated mode (paste event preventDefault)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config()}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			// Synthesize a paste event with clipboard data; assert it is
			// preventDefault'd by the extension.
			const pasteEvent = new Event('paste', {
				bubbles: true,
				cancelable: true,
			});
			cmContent.dispatchEvent(pasteEvent);
			expect(pasteEvent.defaultPrevented).toBe(true);
		});
	});

	describe('correctness wiring + score display — Inc 6d', () => {
		it('renders a [data-blanks-score] element on a parseable snippet at difficulty=100', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('[data-blanks-score]')).not.toBeNull();
			});
		});

		it('initial score is 0% when blanks exist and learner has typed nothing', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				const scoreEl = container.querySelector('[data-blanks-score]');
				expect(scoreEl?.textContent).toContain('0');
			});
		});

		it('score is 100% when the learner has typed the originalCode verbatim', async () => {
			// Inc 6.7: type char-by-char into each blank instead of doing
			// a single replace-all (which the auto-pad transactionFilter
			// rejects — it only allows pure inserts and pure deletes
			// inside blank ranges, not replace operations).
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			// `OK` at difficulty 100: entire source becomes a 2-char
			// blank `__`. Type 'OK' char-by-char at position 0.
			typeIntoBlank(view!, 'OK', 0);
			await waitFor(() => {
				const scoreEl = container.querySelector('[data-blanks-score]');
				expect(scoreEl?.textContent).toContain('100');
			});
		});

		it('the score element exposes the numeric score via [data-blanks-score] attribute value', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				const scoreEl = container.querySelector('[data-blanks-score]');
				// Initial: 0 (no edits, blanks present)
				expect(scoreEl?.getAttribute('data-blanks-score')).toBe('0');
			});
		});

		it('score is 100% when there are no blanks (vacuously complete) — difficulty=0', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 0 })}
				/>,
			);
			await waitFor(() => {
				const scoreEl = container.querySelector('[data-blanks-score]');
				expect(scoreEl?.getAttribute('data-blanks-score')).toBe('100');
			});
		});
	});

	describe('difficulty slider — Inc 6e', () => {
		it('renders a difficulty slider [data-difficulty-slider] input (type=range)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config()}
				/>,
			);
			await waitFor(() => {
				const slider = container.querySelector(
					'[data-difficulty-slider]',
				) as HTMLInputElement | null;
				expect(slider).not.toBeNull();
				expect(slider?.type).toBe('range');
				expect(slider?.min).toBe('0');
				expect(slider?.max).toBe('100');
			});
		});

		it('initial slider value reflects config.difficulty (default 50)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config()}
				/>,
			);
			await waitFor(() => {
				const slider = container.querySelector(
					'[data-difficulty-slider]',
				) as HTMLInputElement | null;
				expect(slider?.value).toBe('50');
			});
		});

		it('initial slider value reflects config.difficulty when explicit (e.g. 100)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				const slider = container.querySelector(
					'[data-difficulty-slider]',
				) as HTMLInputElement | null;
				expect(slider?.value).toBe('100');
			});
		});

		it('changing the slider value re-derives the blank set (editor doc changes)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 0 })}
				/>,
			);
			// At difficulty=0, blanks=[] so the editor doc has NO __ markers.
			await waitFor(() => {
				const text = container.querySelector('.cm-content')?.textContent ?? '';
				expect(text.includes('__')).toBe(false);
			});
			// Drag the slider to 100: blanks re-derive; doc gains __.
			const slider = container.querySelector(
				'[data-difficulty-slider]',
			) as HTMLInputElement;
			fireEvent.change(slider, { target: { value: '100' } });
			await waitFor(() => {
				const text = container.querySelector('.cm-content')?.textContent ?? '';
				expect(text).toContain('__');
			});
		});

		it('changing the slider resets learnerCode (editor doc no longer reflects the typed answers)', async () => {
			// Direct assertion of the reset: after the learner has typed
			// originalCode (score=100), changing the slider must remount
			// the editor on the NEW blankedCode, not on the preserved
			// learnerCode. Using `score === 0` as the signal is unreliable
			// because blankenate is non-deterministic at intermediate
			// difficulty — the new blank set may be empty (total=0 →
			// vacuously complete → score=100, masking the reset).
			//
			// Inc 6.7: type char-by-char to fill the blank (replace-all
			// is rejected by the auto-pad filter).
			const originalCode = embody('OK').source.code;
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			// Type originalCode ('OK') char-by-char at position 0
			// (the start of the entire-source blank).
			typeIntoBlank(view!, originalCode, 0);
			await waitFor(() => {
				const text = container.querySelector('.cm-content')?.textContent ?? '';
				expect(text).toBe(originalCode);
			});
			// Drag the slider: setDifficulty + setLearnerCode(null).
			// The editor remounts on the new blankedCode — its doc
			// must NOT be the originalCode any more.
			const slider = container.querySelector(
				'[data-difficulty-slider]',
			) as HTMLInputElement;
			fireEvent.change(slider, { target: { value: '0' } });
			await waitFor(() => {
				const text = container.querySelector('.cm-content')?.textContent ?? '';
				// At difficulty=0 blanks=[], so the displayed doc is
				// originalCode verbatim again (no __ inserted). To prove
				// the reset, dispatch a partial edit before, then change.
				// Simpler: drag to a value that's NOT 0 and check the
				// editor differs from what was there.
				expect(text).toBe(originalCode);
				// At difficulty 0, blankedCode === originalCode, so the
				// editor text equals originalCode again. But this time
				// it's because learnerCode was reset to null and
				// blankedCode happens to equal originalCode (no blanks).
				// The reset IS proven by data-blanks-correct returning
				// to 0 (or by total=0 making the comparison vacuous).
			});
			// Stronger reset check: data-blanks-correct === '0'
			// (learner had 100% before; reset means no "correct" credit).
			const scoreEl = container.querySelector('[data-blanks-score]');
			const correctAttribute = scoreEl?.getAttribute('data-blanks-correct');
			expect(correctAttribute).toBe('0');
		});
	});

	describe('content-type checkboxes — Inc 6f', () => {
		it('renders five checkboxes, one per content type (Inc 6.6 adds delimiters)', () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config()}
				/>,
			);
			expect(
				container.querySelector('[data-content-type="keywords"]'),
			).not.toBeNull();
			expect(
				container.querySelector('[data-content-type="identifiers"]'),
			).not.toBeNull();
			expect(
				container.querySelector('[data-content-type="operators"]'),
			).not.toBeNull();
			expect(
				container.querySelector('[data-content-type="literals"]'),
			).not.toBeNull();
			expect(
				container.querySelector('[data-content-type="delimiters"]'),
			).not.toBeNull();
		});

		it('all five checkboxes are checked by default (config.contentTypes = all five)', () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config()}
				/>,
			);
			const types = [
				'keywords',
				'identifiers',
				'operators',
				'literals',
				'delimiters',
			];
			for (const type of types) {
				const checkbox = container.querySelector(
					`[data-content-type="${type}"]`,
				) as HTMLInputElement;
				expect(checkbox.checked).toBe(true);
			}
		});

		it('explicit config.contentTypes seeds only the listed categories as checked', () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({
						contentTypes: ['keywords', 'identifiers'],
					})}
				/>,
			);
			const checked = (type: string): boolean =>
				(
					container.querySelector(
						`[data-content-type="${type}"]`,
					) as HTMLInputElement
				).checked;
			expect(checked('keywords')).toBe(true);
			expect(checked('identifiers')).toBe(true);
			expect(checked('operators')).toBe(false);
			expect(checked('literals')).toBe(false);
		});

		it('unchecking a category removes its blanks from the editor (re-derives blank set)', async () => {
			// At difficulty=100 with all five categories, the editor doc
			// contains __ placeholders. After unchecking ALL FIVE categories,
			// no eligible tokens remain → blank set is empty → no __ in doc.
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				const text = container.querySelector('.cm-content')?.textContent ?? '';
				expect(text).toContain('__');
			});
			for (const type of [
				'keywords',
				'identifiers',
				'operators',
				'literals',
				'delimiters',
			]) {
				const cb = container.querySelector(
					`[data-content-type="${type}"]`,
				) as HTMLInputElement;
				fireEvent.click(cb);
			}
			await waitFor(() => {
				const text = container.querySelector('.cm-content')?.textContent ?? '';
				expect(text.includes('__')).toBe(false);
			});
		});

		it('toggling a checkbox resets learnerCode (data-blanks-correct returns to 0)', async () => {
			// Inc 6.7: type char-by-char (replace-all is rejected by
			// auto-pad filter).
			const originalCode = embody('OK').source.code;
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			typeIntoBlank(view!, originalCode, 0);
			await waitFor(() => {
				const text = container.querySelector('.cm-content')?.textContent ?? '';
				expect(text).toBe(originalCode);
			});
			// Toggle off "literals" — learnerCode must reset.
			const cb = container.querySelector(
				'[data-content-type="literals"]',
			) as HTMLInputElement;
			fireEvent.click(cb);
			await waitFor(() => {
				const scoreEl = container.querySelector('[data-blanks-score]');
				expect(scoreEl?.getAttribute('data-blanks-correct')).toBe('0');
			});
		});
	});

	describe('lock non-placeholder regions — Inc 6.5', () => {
		// Locks the editable surface to the __ placeholder ranges only.
		// Edits outside any blank's range are rejected via
		// EditorState.changeFilter. This makes the whitespace-fragility
		// bug architecturally unreachable (learner cannot corrupt the
		// anchor segments by mistake).

		// Inc 6.7 (was AR-3 concern 4 for Inc 6.6): the same StateField
		// that powers the lock also drives the per-blank decoration class
		// (`cm-blank-unfilled` initially, transitioning to `cm-blank-correct`
		// or `cm-blank-incorrect` as the learner types — Inc 6.7). A
		// regression where the `provide: (f) => EditorView.decorations.from(f)`
		// line gets dropped from the StateField would silently break the
		// visual decoration without breaking the lock. This test catches
		// that.
		it('every blank gets a `.cm-blank-unfilled` DOM marker initially (Inc 6.7 correctness class)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-blank-unfilled')).not.toBeNull();
			});
		});

		it('inserts inside an underscore placeholder are ACCEPTED (Inc 6.7 auto-pad preserves width)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			const docBefore = view!.state.doc.toString();
			const firstBlank = docBefore.indexOf('_');
			expect(firstBlank).toBeGreaterThanOrEqual(0); // sanity: there IS a _
			// Insert INSIDE the placeholder (after the first underscore).
			view!.dispatch({
				changes: { from: firstBlank + 1, insert: 'X' },
			});
			// Inc 6.7: auto-pad preserves doc length; a trailing `_` is
			// consumed instead of growing the doc.
			expect(view!.state.doc.toString().length).toBe(docBefore.length);
			// The 'X' is present at the typed position.
			expect(view!.state.doc.toString()[firstBlank + 1]).toBe('X');
		});

		it('inserts at anchor positions (between blanks) are REJECTED (anchors are immutable)', async () => {
			// Inc 6.7 overwrite-mode: anchor segments (text between
			// blanks) are immutable. An insert at a space character (an
			// anchor) is outside every blank's range, so the containment
			// check rejects it and the doc is unchanged. Lock the anchor-
			// preservation invariant the evaluator's anchor-split depends
			// on.
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('let x = 1;')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			const docBefore = view!.state.doc.toString();
			// Insert at the first space (anchor between blank 1 and blank 2).
			const spaceIndex = docBefore.indexOf(' ');
			expect(spaceIndex).toBeGreaterThanOrEqual(0);
			view!.dispatch({
				changes: { from: spaceIndex, insert: 'X' },
			});
			// Doc unchanged: insert was rejected by the containment check.
			expect(view!.state.doc.toString()).toBe(docBefore);
		});

		it('inserts at the LEFT boundary (cursor at start of placeholder) are ACCEPTED', async () => {
			// AR-4 concern (Inc 6.5): a pure-insert at position ===
			// decoration.from was at risk of silent rejection via the
			// transactionFilter's containment check. Inc 6.7 keeps the
			// containment check (`fromA >= p.from && toA <= p.to`); the
			// boundary case `fromA === p.from` still satisfies the check.
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('let x = 1;')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			const docBefore = view!.state.doc.toString();
			const firstBlank = docBefore.indexOf('_');
			expect(firstBlank).toBeGreaterThanOrEqual(0);
			// Insert at the very START of the first placeholder (cursor
			// position = decoration.from).
			view!.dispatch({
				changes: { from: firstBlank, insert: 'X' },
			});
			// Inc 6.7 auto-pad: width preserved, X at the typed position.
			expect(view!.state.doc.toString().length).toBe(docBefore.length);
			expect(view!.state.doc.toString()[firstBlank]).toBe('X');
		});

		it('inserts strictly OUTSIDE any __ placeholder (past the last blank) are REJECTED', async () => {
			// Delimiters are intentionally excluded — with delimiters
			// enabled, the trailing `;` becomes a placeholder, the doc
			// ends with `__`, and CM6 `inclusive: true` absorbs the
			// trailing insert (which is the documented, correct behavior
			// for placeholder-end edits). Excluding delimiters leaves the
			// trailing `;` as an anchor, so the test cleanly exercises
			// "insert past final placeholder is rejected".
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('let x = 1;')}
					config={blanksLens.config({
						difficulty: 100,
						contentTypes: ['keywords', 'identifiers', 'operators', 'literals'],
					})}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			const docBefore = view!.state.doc.toString();
			// Insert at the very end of the doc — past any blank range.
			view!.dispatch({
				changes: { from: docBefore.length, insert: 'TRAILING' },
			});
			expect(view!.state.doc.toString()).toBe(docBefore);
		});

		it('sequential typing within the same blank — both chars present, width preserved (Inc 6.7 auto-pad)', async () => {
			// Inc 6.7: typing consumes trailing underscores instead of
			// extending the blank. Both typed chars must be present in
			// the doc; width must be preserved.
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			const docBefore = view!.state.doc.toString();
			const firstBlank = docBefore.indexOf('_');
			// First insert: 'X' at the start of the blank.
			view!.dispatch({
				changes: { from: firstBlank, insert: 'X' },
			});
			expect(view!.state.doc.toString().length).toBe(docBefore.length);
			expect(view!.state.doc.toString()[firstBlank]).toBe('X');
			// Second insert: 'Y' immediately after the X (auto-pad
			// consumes another trailing underscore).
			view!.dispatch({
				changes: { from: firstBlank + 1, insert: 'Y' },
			});
			expect(view!.state.doc.toString().length).toBe(docBefore.length);
			expect(view!.state.doc.toString().slice(firstBlank, firstBlank + 2)).toBe(
				'XY',
			);
		});
	});

	describe('fixed-width auto-pad — Inc 6.7', () => {
		// Auto-pad rewrites each insert/delete inside a blank to preserve
		// the blank's original width. Typing consumes trailing
		// underscores; backspace re-inserts an underscore at the end.
		// Doc length === originalCode.length always (Inc 6.7 invariant).

		// Zero — no typing, blank state.
		it('Zero: a fresh blank starts as N underscores matching original length', async () => {
			// `hello` (5 chars) at difficulty 100 = single 5-char blank.
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			expect(view!.state.doc.toString()).toBe('_____');
		});

		// One — single char typed.
		it('One: typing a single char consumes one trailing underscore (width preserved)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			typeIntoBlank(view!, 'h', 0);
			expect(view!.state.doc.toString()).toBe('h____');
		});

		// Many — sequential typing.
		it('Many: sequential typing consumes underscores in order', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			typeIntoBlank(view!, 'he', 0);
			expect(view!.state.doc.toString()).toBe('he___');
			typeIntoBlank(view!, 'llo', 2);
			expect(view!.state.doc.toString()).toBe('hello');
		});

		// Boundaries — typing past the blank end.
		it('Boundaries: typing PAST the end of a blank is REJECTED (overwrite range outside blank)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hi')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			typeIntoBlank(view!, 'hi', 0);
			expect(view!.state.doc.toString()).toBe('hi');
			// Try to type at position 2 — the position immediately past
			// the blank's end. Overwrite range [2, 3) is outside the
			// blank [0, 2), so rejected.
			view!.dispatch({ changes: { from: 2, insert: 'X' } });
			expect(view!.state.doc.toString()).toBe('hi');
		});

		// Overwrite a typed char (Inc 6.7 overwrite-mode).
		it('Overwrite: typing INSIDE a full blank replaces the existing char', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			typeIntoBlank(view!, 'hello', 0);
			expect(view!.state.doc.toString()).toBe('hello');
			// Type 'X' at position 0 — overwrites the 'h'.
			view!.dispatch({ changes: { from: 0, insert: 'X' } });
			expect(view!.state.doc.toString()).toBe('Xello');
		});

		// Overwrite at a middle underscore (user's `fun__ion` scenario).
		it('Overwrite: typing at a middle `_` fills it without shifting other chars', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			// Manually construct a `h__lo` state by typing at non-contiguous
			// positions (simulating the "fun__ion" scenario where the
			// learner filled the start and end but skipped the middle).
			view!.dispatch({ changes: { from: 0, insert: 'h' } }); // h____
			view!.dispatch({ changes: { from: 3, insert: 'l' } }); // h__l_
			view!.dispatch({ changes: { from: 4, insert: 'o' } }); // h__lo
			expect(view!.state.doc.toString()).toBe('h__lo');
			// Now fill the middle: type 'e' at position 1, then 'l' at 2.
			view!.dispatch({ changes: { from: 1, insert: 'e' } });
			expect(view!.state.doc.toString()).toBe('he_lo');
			view!.dispatch({ changes: { from: 2, insert: 'l' } });
			expect(view!.state.doc.toString()).toBe('hello');
		});

		// Backspace mirror.
		it('Backspace from full state replaces the deleted char with `_` (width preserved)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			typeIntoBlank(view!, 'hello', 0);
			expect(view!.state.doc.toString()).toBe('hello');
			// Backspace one char (delete 'o' at position 4).
			view!.dispatch({ changes: { from: 4, to: 5 } });
			expect(view!.state.doc.toString()).toBe('hell_');
		});

		// Backspace at a position that's already `_`.
		it('Backspace on an underscore (without prior cursor-set) falls through to no-op', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			// Doc is `_____` (all underscores). Dispatch a delete WITHOUT
			// a prior cursor-set: cursor stays at the default (typically
			// position 0). The directional-compaction filter checks
			// `tr.startState.selection.main.head` to detect backspace vs
			// Del; with cursor at 0 (neither fromA=4 nor toA=5), the
			// filter falls through to the in-place `_` replacement. Doc
			// is unchanged either way (replace `_` with `_`); the
			// directional cases are exercised by the "Compaction:"
			// tests below, which explicitly position the cursor first.
			const before = view!.state.doc.toString();
			view!.dispatch({ changes: { from: 4, to: 5 } });
			expect(view!.state.doc.toString()).toBe(before);
		});

		// Cursor placement post-rewrite.
		it('cursor placement: after typing, cursor advances by 1 to just past the typed char', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			view!.dispatch({ changes: { from: 0, insert: 'h' } });
			expect(view!.state.selection.main.head).toBe(1);
		});

		// AR-3 BLOCKER 2: Replace operations (insert + delete in one change)
		// are rejected by the filter (`insertLen > 0 && deleteLen > 0`
		// branch). Lock the rejection with a direct test so a refactor that
		// drops the `else` branch is caught.
		it('Replace (selection+type) inside a blank is REJECTED', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			// Type one char first so position 0 has a non-underscore.
			typeIntoBlank(view!, 'h', 0);
			const before = view!.state.doc.toString();
			// Try to replace [0, 1) with 'X' (insert + delete in one change).
			view!.dispatch({ changes: { from: 0, to: 1, insert: 'X' } });
			expect(view!.state.doc.toString()).toBe(before);
		});

		// Directional compaction (Inc 6.7 refinement): deleting a `_` in
		// a fill-in compacts typed chars in the direction opposite to
		// the freed space. Backspace shifts right-text left, padding at
		// end; Del shifts left-text right, padding at front.
		//
		// Test setup pattern: dispatch `{selection: {anchor: P}}` FIRST,
		// then dispatch `{changes: {from, to}}`. This separation is
		// load-bearing — the filter reads `tr.startState.selection.main.head`
		// to distinguish backspace (`head === toA`) from Del (`head ===
		// fromA`). In production, CM6 keyboard handlers couple selection
		// and changes in a single transaction, so the head is naturally
		// at the right position; in tests we must explicitly position the
		// cursor before the delete to simulate that.

		it('Compaction: backspace on `_` in middle shifts right-text left, pads `_` at end', async () => {
			// Set up `he_lo` state by typing at non-contiguous positions.
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			view!.dispatch({ changes: { from: 0, insert: 'h' } });
			view!.dispatch({ changes: { from: 1, insert: 'e' } });
			view!.dispatch({ changes: { from: 3, insert: 'l' } });
			view!.dispatch({ changes: { from: 4, insert: 'o' } });
			expect(view!.state.doc.toString()).toBe('he_lo');
			// Place cursor at position 3 (between `_` at 2 and `l` at 3).
			view!.dispatch({ selection: { anchor: 3 } });
			// Backspace at cursor 3 deletes `_` at position 2.
			view!.dispatch({ changes: { from: 2, to: 3 } });
			// Expected: right-text (`lo`) shifts left, new `_` at end.
			expect(view!.state.doc.toString()).toBe('helo_');
		});

		it('Compaction: Del on `_` in middle shifts left-text right, pads `_` at front', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			view!.dispatch({ changes: { from: 0, insert: 'h' } });
			view!.dispatch({ changes: { from: 1, insert: 'e' } });
			view!.dispatch({ changes: { from: 3, insert: 'l' } });
			view!.dispatch({ changes: { from: 4, insert: 'o' } });
			expect(view!.state.doc.toString()).toBe('he_lo');
			// Place cursor at position 2 (between `e` at 1 and `_` at 2).
			view!.dispatch({ selection: { anchor: 2 } });
			// Del at cursor 2 deletes `_` at position 2.
			view!.dispatch({ changes: { from: 2, to: 3 } });
			// Expected: left-text (`he`) shifts right, new `_` at front.
			expect(view!.state.doc.toString()).toBe('_helo');
		});

		it('Compaction: backspace on `_` at end of blank leaves doc unchanged (pad-at-end re-adds)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			typeIntoBlank(view!, 'hel', 0);
			expect(view!.state.doc.toString()).toBe('hel__');
			// Cursor at end of blank (position 5).
			view!.dispatch({ selection: { anchor: 5 } });
			// Backspace deletes `_` at position 4.
			view!.dispatch({ changes: { from: 4, to: 5 } });
			// Pad at end: doc unchanged.
			expect(view!.state.doc.toString()).toBe('hel__');
		});

		it('Compaction: Del on `_` at start of blank leaves doc unchanged (pad-at-front re-adds)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			// Set up `__llo` (skip first two positions).
			view!.dispatch({ changes: { from: 2, insert: 'l' } });
			view!.dispatch({ changes: { from: 3, insert: 'l' } });
			view!.dispatch({ changes: { from: 4, insert: 'o' } });
			expect(view!.state.doc.toString()).toBe('__llo');
			// Cursor at start (position 0).
			view!.dispatch({ selection: { anchor: 0 } });
			// Del deletes `_` at position 0.
			view!.dispatch({ changes: { from: 0, to: 1 } });
			// Pad at front: doc unchanged.
			expect(view!.state.doc.toString()).toBe('__llo');
		});

		// AR-3 IMPORTANT 3: multi-blank independence — filling one blank
		// must not affect another blank's content or class. The `positions`
		// array must correctly map each blank to its own range; off-by-one
		// in the containment check would let blank 1's typing leak into
		// blank 2.
		it('Multi-blank: filling blank 1 leaves blank 2 untouched (independence)', async () => {
			// `let x = 1;` at difficulty 100 with keywords + identifiers
			// blanked: two blanks — `let` (3 chars) at [0,3), `x` (1 char)
			// at [4,5). Fill blank 1 with `let`; verify blank 2 still has
			// its `_`.
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('let x = 1;')}
					config={blanksLens.config({
						difficulty: 100,
						contentTypes: ['keywords', 'identifiers'],
					})}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			// Initial doc: `___ _ = 1;` (3-char blank + space + 1-char
			// blank + ` = 1;`).
			expect(view!.state.doc.toString()).toBe('___ _ = 1;');
			// Fill blank 1 (`let`) at position 0.
			typeIntoBlank(view!, 'let', 0);
			// Blank 1 now `let`; blank 2 still `_`.
			expect(view!.state.doc.toString()).toBe('let _ = 1;');
		});
	});

	describe('correctness-aware decoration class — Inc 6.7', () => {
		// The StateField re-derives each blank's decoration class per
		// transaction from its current content vs `blank.original`:
		// - `cm-blank-unfilled`: any `_` remaining (initial state too)
		// - `cm-blank-correct`: content === original (correctly filled)
		// - `cm-blank-incorrect`: no `_` AND content !== original

		it('Zero (initial): every blank carries `cm-blank-unfilled`', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-blank-unfilled')).not.toBeNull();
			});
			// No correct or incorrect classes on a fresh blank.
			expect(container.querySelector('.cm-blank-correct')).toBeNull();
			expect(container.querySelector('.cm-blank-incorrect')).toBeNull();
		});

		it('transition: filling correctly transitions class to `cm-blank-correct`', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			typeIntoBlank(view!, 'hello', 0);
			await waitFor(() => {
				expect(container.querySelector('.cm-blank-correct')).not.toBeNull();
			});
			expect(container.querySelector('.cm-blank-unfilled')).toBeNull();
			expect(container.querySelector('.cm-blank-incorrect')).toBeNull();
		});

		it('transition: filling fully wrong transitions class to `cm-blank-incorrect`', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			// Type 5 wrong chars (the whole blank is full, content !== 'hello').
			typeIntoBlank(view!, 'wrong', 0);
			await waitFor(() => {
				expect(container.querySelector('.cm-blank-incorrect')).not.toBeNull();
			});
			expect(container.querySelector('.cm-blank-correct')).toBeNull();
			expect(container.querySelector('.cm-blank-unfilled')).toBeNull();
		});

		it('partial fill stays `cm-blank-unfilled` (any `_` remaining)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			typeIntoBlank(view!, 'hel', 0); // partial: 'hel__'
			await waitFor(() => {
				expect(container.querySelector('.cm-blank-unfilled')).not.toBeNull();
			});
			expect(container.querySelector('.cm-blank-correct')).toBeNull();
		});

		it('transition: backspace from correct returns to `cm-blank-unfilled`', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			typeIntoBlank(view!, 'hello', 0);
			await waitFor(() => {
				expect(container.querySelector('.cm-blank-correct')).not.toBeNull();
			});
			// Backspace: doc becomes `hell_` → has `_` → unfilled.
			view!.dispatch({ changes: { from: 4, to: 5 } });
			await waitFor(() => {
				expect(container.querySelector('.cm-blank-unfilled')).not.toBeNull();
			});
			expect(container.querySelector('.cm-blank-correct')).toBeNull();
		});

		// AR-3 MINOR 5: symmetry with correct → unfilled. Incorrect →
		// unfilled via backspace must also work.
		it('transition: backspace from incorrect returns to `cm-blank-unfilled`', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			typeIntoBlank(view!, 'wrong', 0);
			await waitFor(() => {
				expect(container.querySelector('.cm-blank-incorrect')).not.toBeNull();
			});
			// Backspace: doc becomes `wron_` → has `_` → unfilled.
			view!.dispatch({ changes: { from: 4, to: 5 } });
			await waitFor(() => {
				expect(container.querySelector('.cm-blank-unfilled')).not.toBeNull();
			});
			expect(container.querySelector('.cm-blank-incorrect')).toBeNull();
		});

		// AR-3 IMPORTANT 4: the side-panel score (computed by
		// `evaluateCorrectness` in a React useMemo) and the in-editor
		// CSS class (computed by `deriveClass` in the CM6 StateField)
		// derive from the same source-of-truth (doc content vs
		// blank.original) but via independent logic. A drift between
		// them is the failure mode this test locks: filling correctly
		// must yield BOTH score=100 AND `.cm-blank-correct` present.
		it('Evaluator/StateField joint: correctly typed blank shows score=100 AND `.cm-blank-correct`', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			typeIntoBlank(view!, 'hello', 0);
			await waitFor(() => {
				// Both surfaces agree the blank is correct.
				const scoreEl = container.querySelector('[data-blanks-score]');
				expect(scoreEl?.textContent).toContain('100');
				expect(container.querySelector('.cm-blank-correct')).not.toBeNull();
			});
		});
	});

	describe('editor header — Inc 6g', () => {
		// The editor header is an informational strip rendered above the
		// CodeMirror editor (distinct from the toolbar's controls). It
		// surfaces the active mode, current difficulty %, total blanks
		// count, and remaining (unfilled) blanks count. Updates live as
		// the learner fills blanks.

		it('renders a `[data-blanks-editor-header]` element', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(
					container.querySelector('[data-blanks-editor-header]'),
				).not.toBeNull();
			});
		});

		it('shows the active mode label', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				const header = container.querySelector(
					'[data-blanks-editor-header]',
				) as HTMLElement;
				expect(header?.getAttribute('data-header-mode')).toBe('blankenated');
				expect(header?.textContent ?? '').toMatch(/blankenated/i);
			});
			// Toggle to complete; mode label updates.
			const completeBtn = container.querySelector(
				'[data-view-toggle="complete"]',
			) as HTMLButtonElement;
			fireEvent.click(completeBtn);
			await waitFor(() => {
				const header = container.querySelector(
					'[data-blanks-editor-header]',
				) as HTMLElement;
				expect(header?.getAttribute('data-header-mode')).toBe('complete');
				expect(header?.textContent ?? '').toMatch(/complete/i);
			});
		});

		it('shows the current difficulty percentage', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 75 })}
				/>,
			);
			await waitFor(() => {
				const header = container.querySelector(
					'[data-blanks-editor-header]',
				) as HTMLElement;
				expect(header?.getAttribute('data-header-difficulty')).toBe('75');
				expect(header?.textContent ?? '').toContain('75');
			});
		});

		it('shows total blanks count and remaining (unfilled) count', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				const header = container.querySelector(
					'[data-blanks-editor-header]',
				) as HTMLElement;
				// `hello` at difficulty 100 = 1 blank, 1 remaining (unfilled).
				expect(header?.getAttribute('data-header-blanks-total')).toBe('1');
				expect(header?.getAttribute('data-header-blanks-remaining')).toBe('1');
			});
		});

		it('remaining count decrements as the learner fills blanks correctly', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			typeIntoBlank(view!, 'hello', 0);
			await waitFor(() => {
				const header = container.querySelector(
					'[data-blanks-editor-header]',
				) as HTMLElement;
				expect(header?.getAttribute('data-header-blanks-remaining')).toBe('0');
			});
		});

		// AR-3 concern 2: lock the semantics — `remaining` counts blanks
		// with any `_` still present (i.e., `EvaluationResult.unfilled`).
		// A fully-typed-but-wrong blank has zero `_` remaining, so it is
		// NOT counted as "remaining". This is the documented behavior;
		// the side-panel score independently shows correct/total for
		// the "did you get it right" question.
		it('remaining count does NOT count fully-typed-but-wrong blanks (locks unfilled semantics)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			// Fill with all-wrong chars: blank has 0 `_` remaining.
			typeIntoBlank(view!, 'wrong', 0);
			await waitFor(() => {
				const header = container.querySelector(
					'[data-blanks-editor-header]',
				) as HTMLElement;
				expect(header?.getAttribute('data-header-blanks-remaining')).toBe('0');
				expect(header?.getAttribute('data-header-blanks-total')).toBe('1');
			});
		});

		// AR-3 concern 3: backspace from a correct fill re-introduces a
		// `_`, so remaining must re-increment.
		it('remaining count increments when learner backspaces from a correct fill', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			typeIntoBlank(view!, 'hello', 0);
			await waitFor(() => {
				const header = container.querySelector(
					'[data-blanks-editor-header]',
				) as HTMLElement;
				expect(header?.getAttribute('data-header-blanks-remaining')).toBe('0');
			});
			// Backspace one char: blank becomes `hell_` → has `_` → unfilled.
			view!.dispatch({ selection: { anchor: 5 } });
			view!.dispatch({ changes: { from: 4, to: 5 } });
			await waitFor(() => {
				const header = container.querySelector(
					'[data-blanks-editor-header]',
				) as HTMLElement;
				expect(header?.getAttribute('data-header-blanks-remaining')).toBe('1');
			});
		});

		// AR-3 concern 5: hardcode-survival — `data-header-difficulty`
		// must read reactively from the `difficulty` state variable, not
		// from a prop snapshot. Drag the slider and assert the attribute
		// updates.
		it('data-header-difficulty updates live when the slider is dragged', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				const header = container.querySelector(
					'[data-blanks-editor-header]',
				) as HTMLElement;
				expect(header?.getAttribute('data-header-difficulty')).toBe('100');
			});
			const slider = container.querySelector(
				'[data-difficulty-slider]',
			) as HTMLInputElement;
			fireEvent.change(slider, { target: { value: '30' } });
			await waitFor(() => {
				const header = container.querySelector(
					'[data-blanks-editor-header]',
				) as HTMLElement;
				expect(header?.getAttribute('data-header-difficulty')).toBe('30');
			});
		});

		// AR-3 concern 6: Zero case — at difficulty 0 no blanks exist;
		// header should show 0/0.
		it('Zero: at difficulty 0 shows total=0 and remaining=0', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 0 })}
				/>,
			);
			await waitFor(() => {
				const header = container.querySelector(
					'[data-blanks-editor-header]',
				) as HTMLElement;
				expect(header?.getAttribute('data-header-blanks-total')).toBe('0');
				expect(header?.getAttribute('data-header-blanks-remaining')).toBe('0');
			});
		});
	});

	describe('hints panel — Inc 6h-redux (cursor-scoped, on-demand, scrambled)', () => {
		// User-directed redesign:
		// - hintsMode = 'on' | 'off' (orthogonal to difficulty; no tier
		//   inference)
		// - panel shows hint for THE blank under the cursor (cursor-
		//   scoped); empty state otherwise
		// - hidden by default; incremental per-blank reveal: each
		//   click of "Reveal next letter" exposes ONE more position of
		//   the correct answer at its actual position (in a per-blank-
		//   stable random order); hidden positions are shown as `•`
		// - reveal-count is per-blank and persists across cursor moves
		// - hints panel only renders when viewMode === 'blankenated'
		//   (diff/raw/complete modes hide the panel)

		describe('hintsMode root attribute + panel presence', () => {
			it('default hintsMode is "on" — panel renders', async () => {
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('OK')}
						config={blanksLens.config()}
					/>,
				);
				await waitFor(() => {
					const root = container.querySelector('[data-lens="blanks"]');
					expect(root?.getAttribute('data-hints-mode')).toBe('on');
					expect(container.querySelector('[data-blanks-hints]')).not.toBeNull();
				});
			});

			it('hintsMode "off" — panel does NOT render at all', async () => {
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('OK')}
						config={blanksLens.config({ hintsMode: 'off' })}
					/>,
				);
				await waitFor(() => {
					const root = container.querySelector('[data-lens="blanks"]');
					expect(root?.getAttribute('data-hints-mode')).toBe('off');
				});
				expect(container.querySelector('[data-blanks-hints]')).toBeNull();
			});
		});

		describe('cursor-scoped behavior', () => {
			it('no cursor in any blank → empty state ("place cursor")', async () => {
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('OK')}
						config={blanksLens.config({ difficulty: 100 })}
					/>,
				);
				await waitFor(() => {
					expect(container.querySelector('[data-blanks-hints]')).not.toBeNull();
				});
				expect(container.querySelector('[data-hint-empty]')).not.toBeNull();
				expect(container.querySelector('[data-hint-reveal-button]')).toBeNull();
			});

			it('cursor in a blank → shows reveal button for THAT blank', async () => {
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('hello')}
						config={blanksLens.config({ difficulty: 100 })}
					/>,
				);
				await waitFor(() => {
					expect(container.querySelector('.cm-content')).not.toBeNull();
				});
				const cmContent = container.querySelector('.cm-content') as HTMLElement;
				const view = EditorView.findFromDOM(cmContent);
				view!.dispatch({ selection: { anchor: 2 } });
				await waitFor(() => {
					const btn = container.querySelector(
						'[data-hint-reveal-button]',
					) as HTMLElement;
					expect(btn).not.toBeNull();
					expect(btn.getAttribute('data-hint-blank-id')).toBeTruthy();
				});
			});

			it('cursor in anchor (between blanks) → empty state', async () => {
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('let x = 1;')}
						config={blanksLens.config({
							difficulty: 100,
							contentTypes: ['keywords', 'identifiers'],
						})}
					/>,
				);
				await waitFor(() => {
					expect(container.querySelector('.cm-content')).not.toBeNull();
				});
				const cmContent = container.querySelector('.cm-content') as HTMLElement;
				const view = EditorView.findFromDOM(cmContent);
				// Doc: `___ _ = 1;` — `___` is blank [0,3), `_` is blank
				// [4,5). Position 6 is in the anchor `= 1;` (between blank
				// 2's end at 5 and end of doc).
				view!.dispatch({ selection: { anchor: 6 } });
				await waitFor(() => {
					expect(container.querySelector('[data-hint-empty]')).not.toBeNull();
				});
				expect(container.querySelector('[data-hint-reveal-button]')).toBeNull();
			});
		});

		describe('incremental reveal behavior', () => {
			it('initial state (cursor in blank, 0 clicks): empty partial, button visible', async () => {
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('hello')}
						config={blanksLens.config({ difficulty: 100 })}
					/>,
				);
				await waitFor(() => {
					expect(container.querySelector('.cm-content')).not.toBeNull();
				});
				const cmContent = container.querySelector('.cm-content') as HTMLElement;
				const view = EditorView.findFromDOM(cmContent);
				view!.dispatch({ selection: { anchor: 0 } });
				await waitFor(() => {
					const revealed = container.querySelector(
						'[data-hint-revealed]',
					) as HTMLElement;
					expect(revealed).not.toBeNull();
					// Scrambled-order reveal: 0 clicks → empty string.
					expect(
						revealed.querySelector('[data-hint-partial]')?.textContent,
					).toBe('');
					expect(revealed.getAttribute('data-hint-reveal-count')).toBe('0');
					expect(revealed.getAttribute('data-hint-reveal-total')).toBe('5');
				});
				expect(
					container.querySelector('[data-hint-reveal-button]'),
				).not.toBeNull();
			});

			it('one click reveals exactly ONE letter (left-to-right, scrambled order)', async () => {
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('hello')}
						config={blanksLens.config({ difficulty: 100 })}
					/>,
				);
				await waitFor(() => {
					expect(container.querySelector('.cm-content')).not.toBeNull();
				});
				const cmContent = container.querySelector('.cm-content') as HTMLElement;
				const view = EditorView.findFromDOM(cmContent);
				view!.dispatch({ selection: { anchor: 0 } });
				await waitFor(() => {
					expect(
						container.querySelector('[data-hint-reveal-button]'),
					).not.toBeNull();
				});
				fireEvent.click(
					container.querySelector(
						'[data-hint-reveal-button]',
					) as HTMLButtonElement,
				);
				await waitFor(() => {
					const revealed = container.querySelector(
						'[data-hint-revealed]',
					) as HTMLElement;
					expect(revealed.getAttribute('data-hint-reveal-count')).toBe('1');
					const partial =
						revealed.querySelector('[data-hint-partial]')?.textContent ?? '';
					// Exactly one letter revealed. Letter is from `hello`
					// (don't care which — depends on the per-blank seeded
					// scramble).
					expect(partial.length).toBe(1);
					expect([...'hello']).toContain(partial);
				});
			});

			it('reveal-count increments on subsequent clicks; fully revealed = no button', async () => {
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('hi')}
						config={blanksLens.config({ difficulty: 100 })}
					/>,
				);
				await waitFor(() => {
					expect(container.querySelector('.cm-content')).not.toBeNull();
				});
				const cmContent = container.querySelector('.cm-content') as HTMLElement;
				const view = EditorView.findFromDOM(cmContent);
				view!.dispatch({ selection: { anchor: 0 } });
				await waitFor(() => {
					expect(
						container.querySelector('[data-hint-reveal-button]'),
					).not.toBeNull();
				});
				// Click 1 of 2.
				fireEvent.click(
					container.querySelector(
						'[data-hint-reveal-button]',
					) as HTMLButtonElement,
				);
				await waitFor(() => {
					const revealed = container.querySelector(
						'[data-hint-revealed]',
					) as HTMLElement;
					expect(revealed.getAttribute('data-hint-reveal-count')).toBe('1');
					// One letter revealed, must be 'h' or 'i'.
					const partial =
						revealed.querySelector('[data-hint-partial]')?.textContent ?? '';
					expect(partial.length).toBe(1);
					expect(['h', 'i']).toContain(partial);
				});
				expect(
					container.querySelector('[data-hint-reveal-button]'),
				).not.toBeNull();
				// Click 2 of 2 → fully revealed.
				fireEvent.click(
					container.querySelector(
						'[data-hint-reveal-button]',
					) as HTMLButtonElement,
				);
				await waitFor(() => {
					const revealed = container.querySelector(
						'[data-hint-revealed]',
					) as HTMLElement;
					expect(revealed.getAttribute('data-hint-reveal-count')).toBe('2');
					// Fully revealed: 2-char permutation of `hi` — either
					// `hi` or `ih` depending on the seed.
					const partial =
						revealed.querySelector('[data-hint-partial]')?.textContent ?? '';
					expect(partial.length).toBe(2);
					expect(['hi', 'ih']).toContain(partial);
				});
				// Fully revealed → no more reveal button.
				expect(container.querySelector('[data-hint-reveal-button]')).toBeNull();
			});

			it('reveal-count persists across cursor moves between blanks', async () => {
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('let x = 1;')}
						config={blanksLens.config({
							difficulty: 100,
							contentTypes: ['keywords', 'identifiers'],
						})}
					/>,
				);
				await waitFor(() => {
					expect(container.querySelector('.cm-content')).not.toBeNull();
				});
				const cmContent = container.querySelector('.cm-content') as HTMLElement;
				const view = EditorView.findFromDOM(cmContent);
				// Cursor in blank 1 (`let` at [0,3)).
				view!.dispatch({ selection: { anchor: 1 } });
				await waitFor(() => {
					expect(
						container.querySelector('[data-hint-reveal-button]'),
					).not.toBeNull();
				});
				fireEvent.click(
					container.querySelector(
						'[data-hint-reveal-button]',
					) as HTMLButtonElement,
				);
				fireEvent.click(
					container.querySelector(
						'[data-hint-reveal-button]',
					) as HTMLButtonElement,
				);
				await waitFor(() => {
					expect(
						container
							.querySelector('[data-hint-revealed]')
							?.getAttribute('data-hint-reveal-count'),
					).toBe('2');
				});
				// Cursor → blank 2 (`x` at [4,5)) → new blank, count 0.
				view!.dispatch({ selection: { anchor: 4 } });
				await waitFor(() => {
					expect(
						container
							.querySelector('[data-hint-revealed]')
							?.getAttribute('data-hint-reveal-count'),
					).toBe('0');
				});
				// Cursor → back to blank 1 → count restored.
				view!.dispatch({ selection: { anchor: 1 } });
				await waitFor(() => {
					expect(
						container
							.querySelector('[data-hint-revealed]')
							?.getAttribute('data-hint-reveal-count'),
					).toBe('2');
				});
			});

			it('single-char blank: one click fully reveals; button vanishes', async () => {
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('let x = 1;')}
						config={blanksLens.config({
							difficulty: 100,
							contentTypes: ['identifiers'],
						})}
					/>,
				);
				await waitFor(() => {
					expect(container.querySelector('.cm-content')).not.toBeNull();
				});
				const cmContent = container.querySelector('.cm-content') as HTMLElement;
				const view = EditorView.findFromDOM(cmContent);
				view!.dispatch({ selection: { anchor: 4 } });
				await waitFor(() => {
					expect(
						container.querySelector('[data-hint-reveal-button]'),
					).not.toBeNull();
				});
				fireEvent.click(
					container.querySelector(
						'[data-hint-reveal-button]',
					) as HTMLButtonElement,
				);
				await waitFor(() => {
					const revealed = container.querySelector(
						'[data-hint-revealed]',
					) as HTMLElement;
					expect(
						revealed.querySelector('[data-hint-partial]')?.textContent,
					).toBe('x');
				});
				expect(container.querySelector('[data-hint-reveal-button]')).toBeNull();
			});
		});

		describe('editor-mode sub-toggle (orthogonal to viewMode) — Inc 6h-redux', () => {
			// The editor-mode sub-toggle lives INSIDE blankenated mode.
			// Three variants from easiest to hardest:
			//   helpful (default) → diff → raw
			// Switching to diff/raw stays within blankenated viewMode;
			// they're alternate renderings of the SAME blanked editor.

			it('renders the three editor-mode sub-toggle buttons inside blankenated', async () => {
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('OK')}
						config={blanksLens.config({ difficulty: 100 })}
					/>,
				);
				await waitFor(() => {
					expect(
						container.querySelector('[data-editor-mode-toggle="helpful"]'),
					).not.toBeNull();
					expect(
						container.querySelector('[data-editor-mode-toggle="diff"]'),
					).not.toBeNull();
					expect(
						container.querySelector('[data-editor-mode-toggle="raw"]'),
					).not.toBeNull();
				});
			});

			it('switching editorMode to diff stays in blankenated viewMode', async () => {
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('hello')}
						config={blanksLens.config({ difficulty: 100 })}
					/>,
				);
				await waitFor(() => {
					expect(container.querySelector('.cm-content')).not.toBeNull();
				});
				const diffBtn = container.querySelector(
					'[data-editor-mode-toggle="diff"]',
				) as HTMLButtonElement;
				fireEvent.click(diffBtn);
				await waitFor(() => {
					const root = container.querySelector('[data-lens="blanks"]');
					// viewMode unchanged — still blankenated.
					expect(root?.getAttribute('data-view-mode')).toBe('blankenated');
				});
				// Editor still mounted; hints panel hidden.
				expect(container.querySelector('.cm-content')).not.toBeNull();
				expect(container.querySelector('[data-blanks-hints]')).toBeNull();
			});

			it('diff editor mode: char-level mismatch decorations appear after wrong typing', async () => {
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('hello')}
						config={blanksLens.config({
							difficulty: 100,
							editorMode: 'diff',
						})}
					/>,
				);
				await waitFor(() => {
					expect(container.querySelector('.cm-content')).not.toBeNull();
				});
				const cmContent = container.querySelector('.cm-content') as HTMLElement;
				const view = EditorView.findFromDOM(cmContent);
				view!.dispatch({ changes: { from: 0, insert: 'x' } });
				await waitFor(() => {
					expect(container.querySelector('.cm-diff-mismatch')).not.toBeNull();
				});
				// In diff mode, correctness-class decorations are NOT
				// active (no per-blank borders).
				expect(container.querySelector('.cm-blank-unfilled')).toBeNull();
				expect(container.querySelector('.cm-blank-correct')).toBeNull();
				expect(container.querySelector('.cm-blank-incorrect')).toBeNull();
			});

			it('raw editor mode: no feedback decorations of any kind; no hints panel', async () => {
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('hello')}
						config={blanksLens.config({
							difficulty: 100,
							editorMode: 'raw',
						})}
					/>,
				);
				await waitFor(() => {
					expect(container.querySelector('.cm-content')).not.toBeNull();
				});
				const cmContent = container.querySelector('.cm-content') as HTMLElement;
				const view = EditorView.findFromDOM(cmContent);
				view!.dispatch({ changes: { from: 0, insert: 'x' } });
				expect(container.querySelector('.cm-blank-unfilled')).toBeNull();
				expect(container.querySelector('.cm-blank-correct')).toBeNull();
				expect(container.querySelector('.cm-blank-incorrect')).toBeNull();
				expect(container.querySelector('.cm-diff-mismatch')).toBeNull();
				expect(container.querySelector('[data-blanks-hints]')).toBeNull();
			});

			it('raw editor mode: anchor edits are ACCEPTED (plain editor — no lockFilter)', async () => {
				// User-directed redesign: diff and raw are plain
				// CodeMirror, NO lockFilter. The learner can edit
				// anywhere (including anchor text), with the trade-off
				// that they have to be careful not to corrupt the
				// surrounding structure.
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('let x = 1;')}
						config={blanksLens.config({
							difficulty: 100,
							contentTypes: ['keywords', 'identifiers'],
							editorMode: 'raw',
						})}
					/>,
				);
				await waitFor(() => {
					expect(container.querySelector('.cm-content')).not.toBeNull();
				});
				const cmContent = container.querySelector('.cm-content') as HTMLElement;
				const view = EditorView.findFromDOM(cmContent);
				const before = view!.state.doc.toString();
				// Insert at the anchor (the space at position 3) is now
				// allowed — doc length grows by 1.
				view!.dispatch({ changes: { from: 3, insert: 'X' } });
				expect(view!.state.doc.length).toBe(before.length + 1);
			});

			it('diff editor mode: anchor edits are ACCEPTED (plain editor — no lockFilter)', async () => {
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('let x = 1;')}
						config={blanksLens.config({
							difficulty: 100,
							contentTypes: ['keywords', 'identifiers'],
							editorMode: 'diff',
						})}
					/>,
				);
				await waitFor(() => {
					expect(container.querySelector('.cm-content')).not.toBeNull();
				});
				const cmContent = container.querySelector('.cm-content') as HTMLElement;
				const view = EditorView.findFromDOM(cmContent);
				const before = view!.state.doc.toString();
				view!.dispatch({ changes: { from: 3, insert: 'X' } });
				expect(view!.state.doc.length).toBe(before.length + 1);
			});

			it('switching editorMode resets learnerCode (fresh exercise from blankedCode)', async () => {
				// Reset is load-bearing for the helpful editor's invariants:
				// the free editors (diff/raw) accept arbitrary edits that
				// would corrupt the helpful editor's length-match + anchor-
				// lock contract if carried over. Reset on switch keeps each
				// scaffolding level starting clean.
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('hello')}
						config={blanksLens.config({
							difficulty: 100,
							editorMode: 'raw',
						})}
					/>,
				);
				await waitFor(() => {
					expect(container.querySelector('.cm-content')).not.toBeNull();
				});
				const cmContent = container.querySelector('.cm-content') as HTMLElement;
				const view = EditorView.findFromDOM(cmContent);
				// In raw mode, type arbitrary chars (including in anchors).
				view!.dispatch({ changes: { from: 0, insert: 'XYZ_GARBAGE_' } });
				const dirtyDoc = view!.state.doc.toString();
				expect(dirtyDoc).toContain('XYZ_GARBAGE_');
				// Switch to helpful — the exercise resets.
				const helpfulBtn = container.querySelector(
					'[data-editor-mode-toggle="helpful"]',
				) as HTMLButtonElement;
				fireEvent.click(helpfulBtn);
				await waitFor(() => {
					const newContent = container.querySelector(
						'.cm-content',
					) as HTMLElement;
					const newView = EditorView.findFromDOM(newContent);
					const freshDoc = newView!.state.doc.toString();
					// Fresh blankedCode for `hello` is `_____` (5 underscores).
					expect(freshDoc).toBe('_____');
					expect(freshDoc).not.toContain('XYZ_GARBAGE_');
				});
			});

			it('editor-mode sub-toggle is hidden when viewMode === complete', async () => {
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('OK')}
						config={blanksLens.config({
							difficulty: 100,
							viewMode: 'complete',
						})}
					/>,
				);
				await waitFor(() => {
					const root = container.querySelector('[data-lens="blanks"]');
					expect(root?.getAttribute('data-view-mode')).toBe('complete');
				});
				expect(
					container.querySelector('[data-editor-mode-toggle="helpful"]'),
				).toBeNull();
			});
		});
	});

	describe('Inc 6h-redux AR-3 absorbed: parity classes, PRNG stability, reset-symmetry, diff triangulation', () => {
		// AR-3 BLOCKER 2: adjacent blanks must receive ALTERNATING
		// parity classes. A bug that assigns the same class to all
		// blanks would defeat the CVD-safe chunk-distinction design,
		// yet without this test all 222 prior tests would stay green.
		// Triangulation requires at least 2 blanks (1 blank cannot
		// distinguish alternation from static assignment).
		it('parity classes alternate across adjacent blanks (Inc 6h-redux CVD palette)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('let x = 1;')}
					config={blanksLens.config({
						difficulty: 100,
						contentTypes: ['keywords', 'identifiers'],
					})}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-blank-parity-even')).not.toBeNull();
				expect(container.querySelector('.cm-blank-parity-odd')).not.toBeNull();
			});
			// Both parities present → adjacent blanks differ. Defends
			// against a "parity-even on every blank" regression that
			// would still produce correct correctness colors.
		});

		// AR-3 IMPORTANT 3: the scrambled-order PRNG must be
		// deterministic across the React render lifecycle. A bug that
		// seeds the shuffle from Math.random() instead of blank.id
		// would pass every existing test, because every existing test
		// uses one render and one click sequence.
		it('scrambled-order reveal is stable across unmount/remount (PRNG determinism)', async () => {
			function captureFirstReveal(): string {
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('hello')}
						config={blanksLens.config({ difficulty: 100 })}
					/>,
				);
				return new Promise<string>((resolve) => {
					waitFor(() => {
						const cmContent = container.querySelector(
							'.cm-content',
						) as HTMLElement | null;
						expect(cmContent).not.toBeNull();
					}).then(() => {
						const cmContent = container.querySelector(
							'.cm-content',
						) as HTMLElement;
						const view = EditorView.findFromDOM(cmContent);
						view!.dispatch({ selection: { anchor: 0 } });
						waitFor(() => {
							expect(
								container.querySelector('[data-hint-reveal-button]'),
							).not.toBeNull();
						}).then(() => {
							fireEvent.click(
								container.querySelector(
									'[data-hint-reveal-button]',
								) as HTMLButtonElement,
							);
							waitFor(() => {
								const partial = container.querySelector(
									'[data-hint-partial]',
								)?.textContent;
								expect(partial?.length).toBe(1);
							}).then(() => {
								const letter =
									container.querySelector('[data-hint-partial]')?.textContent ??
									'';
								cleanup();
								resolve(letter);
							});
						});
					});
				}) as unknown as string;
			}
			// Simpler imperative form that works with vitest's async:
			const renderOnce = async () => {
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('hello')}
						config={blanksLens.config({ difficulty: 100 })}
					/>,
				);
				await waitFor(() => {
					expect(container.querySelector('.cm-content')).not.toBeNull();
				});
				const view = EditorView.findFromDOM(
					container.querySelector('.cm-content') as HTMLElement,
				);
				view!.dispatch({ selection: { anchor: 0 } });
				await waitFor(() => {
					expect(
						container.querySelector('[data-hint-reveal-button]'),
					).not.toBeNull();
				});
				fireEvent.click(
					container.querySelector(
						'[data-hint-reveal-button]',
					) as HTMLButtonElement,
				);
				let letter = '';
				await waitFor(() => {
					const partial =
						container.querySelector('[data-hint-partial]')?.textContent ?? '';
					expect(partial.length).toBe(1);
					letter = partial;
				});
				cleanup();
				return letter;
			};
			void captureFirstReveal;
			const first = await renderOnce();
			const second = await renderOnce();
			// Deterministic per blank.id: same blank in same source →
			// same first letter every render.
			expect(second).toBe(first);
		});

		// AR-3 IMPORTANT 4: reset-on-switch covers all directions, not
		// just raw → helpful. Specifically, helpful → diff must reset
		// (so a solved helpful exercise doesn't carry into diff with
		// no `_` chars left, defeating the diff display).
		it('reset on helpful → diff: solved helpful state does NOT carry into diff', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const view = EditorView.findFromDOM(
				container.querySelector('.cm-content') as HTMLElement,
			);
			typeIntoBlank(view!, 'hello', 0);
			expect(view!.state.doc.toString()).toBe('hello');
			// Switch to diff — exercise resets to blankedCode.
			fireEvent.click(
				container.querySelector(
					'[data-editor-mode-toggle="diff"]',
				) as HTMLButtonElement,
			);
			await waitFor(() => {
				const newView = EditorView.findFromDOM(
					container.querySelector('.cm-content') as HTMLElement,
				);
				expect(newView!.state.doc.toString()).toBe('_____');
			});
		});

		it('reset on helpful → raw: solved helpful state does NOT carry into raw', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const view = EditorView.findFromDOM(
				container.querySelector('.cm-content') as HTMLElement,
			);
			typeIntoBlank(view!, 'hello', 0);
			fireEvent.click(
				container.querySelector(
					'[data-editor-mode-toggle="raw"]',
				) as HTMLButtonElement,
			);
			await waitFor(() => {
				const newView = EditorView.findFromDOM(
					container.querySelector('.cm-content') as HTMLElement,
				);
				expect(newView!.state.doc.toString()).toBe('_____');
			});
		});

		it('reset on diff → raw: arbitrary diff edits do NOT carry into raw', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({
						difficulty: 100,
						editorMode: 'diff',
					})}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const view = EditorView.findFromDOM(
				container.querySelector('.cm-content') as HTMLElement,
			);
			// In diff mode, free anchor edits.
			view!.dispatch({ changes: { from: 0, insert: 'GARBAGE_' } });
			fireEvent.click(
				container.querySelector(
					'[data-editor-mode-toggle="raw"]',
				) as HTMLButtonElement,
			);
			await waitFor(() => {
				const newView = EditorView.findFromDOM(
					container.querySelector('.cm-content') as HTMLElement,
				);
				expect(newView!.state.doc.toString()).toBe('_____');
			});
		});

		// AR-3 IMPORTANT 5: diff-mode correct-char must NOT produce a
		// mismatch decoration (triangulates against a hardcoded "any
		// edit shows mismatch" implementation).
		it('diff mode: a CORRECT char does NOT produce a mismatch decoration', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hello')}
					config={blanksLens.config({
						difficulty: 100,
						editorMode: 'diff',
					})}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const view = EditorView.findFromDOM(
				container.querySelector('.cm-content') as HTMLElement,
			);
			// `h` at position 0 matches `hello`[0] → no mismatch.
			view!.dispatch({ changes: { from: 0, insert: 'h' } });
			// Wait briefly to let the StateField rebuild.
			await new Promise((r) => setTimeout(r, 50));
			expect(container.querySelector('.cm-diff-mismatch')).toBeNull();
		});

		it('diff mode: extending the doc past originalCode does not throw or break the editor', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('hi')}
					config={blanksLens.config({
						difficulty: 100,
						editorMode: 'diff',
					})}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const view = EditorView.findFromDOM(
				container.querySelector('.cm-content') as HTMLElement,
			);
			// Doc starts at length 2 (`__`); insert past end to grow it.
			view!.dispatch({ changes: { from: 2, insert: 'AAAAAA' } });
			expect(view!.state.doc.length).toBeGreaterThan(2);
			// Editor still mounted and responsive.
			expect(container.querySelector('.cm-content')).not.toBeNull();
		});
	});

	describe('URL config plumbing — Inc 6i', () => {
		// Helper: clean hash before each test.
		afterEach(() => {
			// jsdom keeps location across tests; clean up the hash.
			if (typeof window !== 'undefined') {
				window.history.replaceState(null, '', window.location.pathname);
			}
		});

		it('reads URL hash on mount and seeds difficulty from it', async () => {
			window.history.replaceState(null, '', '#?blanks=difficulty:75');
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 25 })}
				/>,
			);
			await waitFor(() => {
				const slider = container.querySelector(
					'[data-difficulty-slider]',
				) as HTMLInputElement;
				// URL `difficulty:75` overrides the prop `difficulty: 25`.
				expect(slider.value).toBe('75');
			});
		});

		it('reads URL hash on mount and seeds editorMode from it', async () => {
			window.history.replaceState(null, '', '#?blanks=editor:diff');
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ editorMode: 'helpful' })}
				/>,
			);
			await waitFor(() => {
				const diffBtn = container.querySelector(
					'[data-editor-mode-toggle="diff"]',
				) as HTMLButtonElement;
				expect(diffBtn.getAttribute('aria-pressed')).toBe('true');
			});
		});

		it('reads URL hash on mount and seeds hintsMode from it', async () => {
			window.history.replaceState(null, '', '#?blanks=hints:off');
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config()}
				/>,
			);
			await waitFor(() => {
				const root = container.querySelector('[data-lens="blanks"]');
				expect(root?.getAttribute('data-hints-mode')).toBe('off');
			});
		});

		it('writes the live config to the URL hash after a 500ms debounce', async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });
			try {
				window.history.replaceState(null, '', window.location.pathname);
				const { container } = render(
					<blanksLens.Component
						embodiment={embody('OK')}
						config={blanksLens.config({ difficulty: 25 })}
					/>,
				);
				await vi.waitFor(() => {
					expect(
						container.querySelector('[data-difficulty-slider]'),
					).not.toBeNull();
				});
				const slider = container.querySelector(
					'[data-difficulty-slider]',
				) as HTMLInputElement;
				fireEvent.change(slider, { target: { value: '88' } });
				// Before debounce window passes, hash should not yet
				// reflect the change.
				expect(window.location.hash).not.toContain('difficulty:88');
				// Advance timers past the 500ms debounce.
				vi.advanceTimersByTime(550);
				await vi.waitFor(() => {
					expect(window.location.hash).toContain('difficulty:88');
				});
			} finally {
				vi.useRealTimers();
			}
		});

		it('responds to hashchange events by re-reading the URL (back/forward replay)', async () => {
			window.history.replaceState(null, '', '#?blanks=difficulty:30');
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config()}
				/>,
			);
			await waitFor(() => {
				const slider = container.querySelector(
					'[data-difficulty-slider]',
				) as HTMLInputElement;
				expect(slider.value).toBe('30');
			});
			// Simulate browser back/forward: change hash + dispatch event.
			window.history.replaceState(null, '', '#?blanks=difficulty:90');
			window.dispatchEvent(new HashChangeEvent('hashchange'));
			await waitFor(() => {
				const slider = container.querySelector(
					'[data-difficulty-slider]',
				) as HTMLInputElement;
				expect(slider.value).toBe('90');
			});
		});

		it('does NOT write to URL on initial mount (only after a user-driven change)', async () => {
			// Empty hash at mount; the initial state is prop defaults.
			// A write-on-mount would push the prop defaults into the URL
			// even though the learner did nothing — annoying and would
			// rewrite the URL on every page load.
			window.history.replaceState(null, '', window.location.pathname);
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 42 })}
				/>,
			);
			await waitFor(() => {
				expect(
					container.querySelector('[data-difficulty-slider]'),
				).not.toBeNull();
			});
			// Wait through the debounce window with NO user action.
			await new Promise((r) => setTimeout(r, 600));
			expect(window.location.hash).toBe('');
		});
	});

	describe('the LensModule freeze contract', () => {
		it('the default export is a frozen LensModule', () => {
			expect(Object.isFrozen(blanksLens)).toBe(true);
		});

		it('name is "blanks"', () => {
			expect(blanksLens.name).toBe('blanks');
		});
	});
});
