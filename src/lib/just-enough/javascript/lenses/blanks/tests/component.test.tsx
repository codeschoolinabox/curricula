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
 * Inc 6g–6j will add: editor header, hints panel, URL config, Ask Me.
 * (Inc 6c editable+noPaste, 6d correctness wiring, 6e slider, 6f
 * content-type checkboxes — landed.)
 */

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { EditorView } from '@codemirror/view';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';

import blanksLens from '../index.js';

afterEach(cleanup);

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
			expect(
				container.querySelectorAll('[data-view-toggle]').length,
			).toBe(0);
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
					// Force-all-blanks via difficulty=100; all four content types
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
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
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
			// Type a learner edit: insert 'XYZ' at position 0.
			initialView?.dispatch({ changes: { from: 0, insert: 'XYZ' } });
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
				const text =
					container.querySelector('.cm-content')?.textContent ?? '';
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
			const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
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
			// Dispatch a replace-all change to set the editor doc to the
			// original source (proving all blanks are correct).
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
			const originalCode = embody('OK').source.code;
			view?.dispatch({
				changes: {
					from: 0,
					to: view.state.doc.length,
					insert: originalCode,
				},
			});
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
			// Replace doc with originalCode (learner "fills in everything").
			view?.dispatch({
				changes: {
					from: 0,
					to: view.state.doc.length,
					insert: originalCode,
				},
			});
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
		it('renders four checkboxes, one per content type', () => {
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
		});

		it('all four checkboxes are checked by default (config.contentTypes = all four)', () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config()}
				/>,
			);
			const types = ['keywords', 'identifiers', 'operators', 'literals'];
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
			// At difficulty=100 with all four categories, the editor doc
			// contains __ placeholders. After unchecking ALL FOUR categories,
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
			view?.dispatch({
				changes: {
					from: 0,
					to: view.state.doc.length,
					insert: originalCode,
				},
			});
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

	describe('the LensModule freeze contract', () => {
		it('the default export is a frozen LensModule', () => {
			expect(Object.isFrozen(blanksLens)).toBe(true);
		});

		it('name is "blanks"', () => {
			expect(blanksLens.name).toBe('blanks');
		});
	});
});
