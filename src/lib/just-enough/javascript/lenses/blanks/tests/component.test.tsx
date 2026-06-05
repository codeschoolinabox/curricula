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
 * Inc 6c–6j will add: editable blankenated + noPasteExtension,
 * per-blank correctness, difficulty slider, content-type checkboxes,
 * editor header, hints panel, URL config, Ask Me.
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

		it('changing the slider resets learnerCode (score returns to 0)', async () => {
			const { container } = render(
				<blanksLens.Component
					embodiment={embody('OK')}
					config={blanksLens.config({ difficulty: 100 })}
				/>,
			);
			// Wait for editor mount, then dispatch a fake learner edit.
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			// Replace doc with originalCode → score becomes 100.
			view?.dispatch({
				changes: {
					from: 0,
					to: view.state.doc.length,
					insert: embody('OK').source.code,
				},
			});
			await waitFor(() => {
				const scoreEl = container.querySelector('[data-blanks-score]');
				expect(scoreEl?.getAttribute('data-blanks-score')).toBe('100');
			});
			// Drag the slider → learnerCode resets; new blanks unfilled; score = 0.
			const slider = container.querySelector(
				'[data-difficulty-slider]',
			) as HTMLInputElement;
			fireEvent.change(slider, { target: { value: '50' } });
			await waitFor(() => {
				const scoreEl = container.querySelector('[data-blanks-score]');
				expect(scoreEl?.getAttribute('data-blanks-score')).toBe('0');
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
