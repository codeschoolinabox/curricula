/**
 * @vitest-environment jsdom
 *
 * Component tests for the `quiz` React wrapper — Slice A inc 1. End-state
 * behaviors locked here:
 * - an unparseable snippet renders the `data-quiz-fallback` notice and mounts
 *   NO editor (defense-in-depth — `applicableTo` gates it out in production);
 * - a parseable snippet mounts a CodeMirror editor under a `data-lens="quiz"`
 *   root, the editor is **read-only** (`EditorState.readOnly` facet) and
 *   **not user-editable** (`EditorView.editable.of(false)` →
 *   `contenteditable="false"`), and its document is the snippet source.
 *
 * The **un-colorized** property (no syntax highlighting) is NOT asserted here:
 * jsdom never runs CM's highlight paint pass, so absence-of-highlight-classes
 * is a false-confidence assertion that would pass even if `javascript()` were
 * wrongly added. It is verified at the 🔍 sandbox checkpoint (black-on-white).
 * Clickable anchors / panel / verdict are later increments.
 */

import { EditorView } from '@codemirror/view';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import embody from '../../../embody/index.js';
import type { McqQuizItem } from '../../../lib/quizzing/types.js';
import quizLens from '../index.js';
import buildQuiz from '../lib/build-quiz.js';

afterEach(cleanup);

describe('<quiz Component> — Slice A inc 1: read-only un-colorized editor', () => {
	// Zero — degenerate input: an unparseable snippet.
	describe('unparseable snippet (fallback)', () => {
		it('renders the data-lens="quiz" root (invariant holds in the fallback)', () => {
			const { container } = render(
				<quizLens.Component
					embodiment={embody('FAIL_AT_PARSE')}
					config={quizLens.config()}
				/>,
			);
			expect(container.querySelector('[data-lens="quiz"]')).not.toBeNull();
		});

		it('renders the data-quiz-fallback notice', () => {
			const { container } = render(
				<quizLens.Component
					embodiment={embody('FAIL_AT_PARSE')}
					config={quizLens.config()}
				/>,
			);
			expect(container.querySelector('[data-quiz-fallback]')).not.toBeNull();
		});

		it('the fallback notice carries role="alert" (a11y live region)', () => {
			const { container } = render(
				<quizLens.Component
					embodiment={embody('FAIL_AT_PARSE')}
					config={quizLens.config()}
				/>,
			);
			const fallback = container.querySelector('[data-quiz-fallback]');
			expect(fallback?.getAttribute('role')).toBe('alert');
		});

		it('mounts NO CodeMirror editor', () => {
			const { container } = render(
				<quizLens.Component
					embodiment={embody('FAIL_AT_PARSE')}
					config={quizLens.config()}
				/>,
			);
			expect(container.querySelector('.cm-editor')).toBeNull();
		});
	});

	// One — happy path: a parseable snippet.
	describe('parseable snippet', () => {
		it('renders the data-lens="quiz" root (sync)', () => {
			const { container } = render(
				<quizLens.Component
					embodiment={embody('OK')}
					config={quizLens.config()}
				/>,
			);
			expect(container.querySelector('[data-lens="quiz"]')).not.toBeNull();
		});

		it('mounts a CodeMirror editor (async, via useEffect)', async () => {
			const { container } = render(
				<quizLens.Component
					embodiment={embody('OK')}
					config={quizLens.config()}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-editor')).not.toBeNull();
			});
		});

		it('mounts the editor inside the data-quiz-editor host (contract selector)', async () => {
			const { container } = render(
				<quizLens.Component
					embodiment={embody('OK')}
					config={quizLens.config()}
				/>,
			);
			await waitFor(() => {
				expect(
					container.querySelector('[data-quiz-editor] .cm-editor'),
				).not.toBeNull();
			});
		});

		it('the editor is read-only (EditorState.readOnly facet === true)', async () => {
			const { container } = render(
				<quizLens.Component
					embodiment={embody('OK')}
					config={quizLens.config()}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			expect(view?.state.readOnly).toBe(true);
		});

		it('the editor is not user-editable (contenteditable="false")', async () => {
			const { container } = render(
				<quizLens.Component
					embodiment={embody('OK')}
					config={quizLens.config()}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			expect(cmContent.getAttribute('contenteditable')).toBe('false');
		});

		it('the editor document is the snippet source (triangulates an empty editor)', async () => {
			const snippet = embody('OK');
			const { container } = render(
				<quizLens.Component embodiment={snippet} config={quizLens.config()} />,
			);
			// CM splits the doc across `.cm-line` elements, so textContent drops the
			// newlines — compare with whitespace stripped from both sides.
			const expected = snippet.source.code.replaceAll(/\s+/g, '');
			// Guard against a vacuous pass if the fixture were ever empty.
			expect(expected.length).toBeGreaterThan(0);
			await waitFor(() => {
				const actual = (
					container.querySelector('.cm-content')?.textContent ?? ''
				).replaceAll(/\s+/g, '');
				expect(actual).toContain(expected);
			});
		});
	});

	// Inc 3: the question panel. The click→panel render is sandbox-verified
	// (jsdom can't lay out CM for posAtCoords); the Zero state — no panel before
	// any pick — IS jsdom-assertable and locked here.
	describe('question panel (Zero state)', () => {
		it('renders no data-quiz-panel before any anchor is picked', () => {
			const { container } = render(
				<quizLens.Component
					embodiment={embody('OK')}
					config={quizLens.config()}
				/>,
			);
			expect(container.querySelector('[data-quiz-panel]')).toBeNull();
		});

		// Inc 4: the verdict region. The answer→verdict path is sandbox-verified
		// (it needs a token click to open the panel, then an option click); the
		// Zero state — no verdict before any answer — IS jsdom-assertable.
		it('renders no data-quiz-verdict before any answer', () => {
			const { container } = render(
				<quizLens.Component
					embodiment={embody('OK')}
					config={quizLens.config()}
				/>,
			);
			expect(container.querySelector('[data-quiz-verdict]')).toBeNull();
		});

		it('renders no data-quiz-tablist before any anchor is picked', () => {
			const { container } = render(
				<quizLens.Component
					embodiment={embody('OK')}
					config={quizLens.config()}
				/>,
			);
			expect(container.querySelector('[data-quiz-tablist]')).toBeNull();
		});
	});

	// Inc 6a-i: co-anchored answer-neutral tabs + per-item verdict. jsdom has no
	// CM layout, so a pick is driven by stubbing the editor's `posAtCoords` and
	// dispatching a real mousedown; the panel + tab interactions are then plain
	// React DOM. The REAL click→pick path (posAtCoords over a laid-out editor) is
	// verified at the 🔍 sandbox; here we lock the panel state machine the pick
	// drives.
	describe('co-anchored tabs + per-item verdict', () => {
		// `let x = 1; x;`: `=`=[6,7) is lone-V1; ref `x`=[11,12) → V1+V7 (two mcq).
		const REFERENCE_X = 11;
		const OPERATOR = 6;

		// Mount on the real-composition fixture, wait for the editor, then drive a
		// pick at `offset` via a posAtCoords stub. Returns the container + the spy
		// (re-point it with `spy.mockReturnValue(n)` + another dispatch to re-pick).
		async function mountAndPick(offset: number, code = 'let x = 1; x;') {
			const { container } = render(
				<quizLens.Component
					embodiment={embody(code)}
					config={quizLens.config()}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')).not.toBeNull();
			});
			const cmContent = container.querySelector('.cm-content') as HTMLElement;
			const view = EditorView.findFromDOM(cmContent);
			if (view === null) throw new Error('no editor view');
			const spy = vi.spyOn(view, 'posAtCoords').mockReturnValue(offset);
			cmContent.dispatchEvent(
				new MouseEvent('mousedown', { bubbles: true, clientX: 1, clientY: 1 }),
			);
			await waitFor(() => {
				expect(container.querySelector('[data-quiz-panel]')).not.toBeNull();
			});
			return { container, cmContent, spy };
		}

		it('a co-anchored token shows one tab per item — the reference x → 2 tabs', async () => {
			const { container } = await mountAndPick(REFERENCE_X);
			expect(container.querySelectorAll('[data-quiz-tab]').length).toBe(2);
		});

		it('a deeper co-anchored token shows a tab per item — the declaration x → 3 tabs', async () => {
			// decl `x`=[4,5) co-anchors V1 + V6 + V7 (all mcq) — the tab loop is
			// generic over N, not a hardcoded 2.
			const { container } = await mountAndPick(4);
			expect(container.querySelectorAll('[data-quiz-tab]').length).toBe(3);
		});

		it('tab labels are neutral bare indices, never the prompt or a gesture verb', async () => {
			const { container } = await mountAndPick(REFERENCE_X);
			const labels = [...container.querySelectorAll('[data-quiz-tab]')].map(
				(tab) => tab.textContent,
			);
			expect(labels).toEqual(['1', '2']);
		});

		it('the default active tab is the first mcq — tab 0 aria-selected (never auto-arm)', async () => {
			const { container } = await mountAndPick(REFERENCE_X);
			const tabs = container.querySelectorAll('[data-quiz-tab]');
			expect(tabs[0].getAttribute('aria-selected')).toBe('true');
			expect(tabs[1].getAttribute('aria-selected')).toBe('false');
		});

		it('a lone-anchor token renders the panel with NO tablist (the `=` token)', async () => {
			const { container } = await mountAndPick(OPERATOR);
			expect(container.querySelector('[data-quiz-panel]')).not.toBeNull();
			expect(container.querySelector('[data-quiz-tablist]')).toBeNull();
		});

		it('selecting a tab moves the active selection (aria-selected follows the click)', async () => {
			const { container } = await mountAndPick(REFERENCE_X);
			fireEvent.click(container.querySelectorAll('[data-quiz-tab]')[1]);
			await waitFor(() => {
				expect(
					container
						.querySelectorAll('[data-quiz-tab]')[1]
						.getAttribute('aria-selected'),
				).toBe('true');
			});
			expect(
				container
					.querySelectorAll('[data-quiz-tab]')[0]
					.getAttribute('aria-selected'),
			).toBe('false');
		});

		it('verdict is per-item: answering tab 0 leaves tab 1 with no verdict', async () => {
			const { container } = await mountAndPick(REFERENCE_X);
			fireEvent.click(
				container.querySelector('[data-quiz-option]') as HTMLElement,
			);
			await waitFor(() => {
				expect(container.querySelector('[data-quiz-verdict]')).not.toBeNull();
			});
			// The verdict carries a real graded status (not a stub attribute) — guards
			// against a verdict region keyed to the wrong item.
			expect(
				container.querySelector<HTMLElement>('[data-quiz-verdict]')?.dataset
					.quizVerdict,
			).toMatch(/^(correct|incorrect)$/);
			fireEvent.click(container.querySelectorAll('[data-quiz-tab]')[1]);
			await waitFor(() => {
				expect(
					container
						.querySelectorAll('[data-quiz-tab]')[1]
						.getAttribute('aria-selected'),
				).toBe('true');
			});
			expect(container.querySelector('[data-quiz-verdict]')).toBeNull();
		});

		it('verdict persists per-item: returning to tab 0 still shows its verdict', async () => {
			const { container } = await mountAndPick(REFERENCE_X);
			fireEvent.click(
				container.querySelector('[data-quiz-option]') as HTMLElement,
			);
			await waitFor(() => {
				expect(container.querySelector('[data-quiz-verdict]')).not.toBeNull();
			});
			fireEvent.click(container.querySelectorAll('[data-quiz-tab]')[1]);
			await waitFor(() => {
				expect(container.querySelector('[data-quiz-verdict]')).toBeNull();
			});
			fireEvent.click(container.querySelectorAll('[data-quiz-tab]')[0]);
			await waitFor(() => {
				expect(container.querySelector('[data-quiz-verdict]')).not.toBeNull();
			});
		});

		it('re-picking a different anchor clears the prior pick’s verdicts', async () => {
			const { container, cmContent, spy } = await mountAndPick(REFERENCE_X);
			fireEvent.click(
				container.querySelector('[data-quiz-option]') as HTMLElement,
			);
			await waitFor(() => {
				expect(container.querySelector('[data-quiz-verdict]')).not.toBeNull();
			});
			spy.mockReturnValue(OPERATOR);
			cmContent.dispatchEvent(
				new MouseEvent('mousedown', { bubbles: true, clientX: 1, clientY: 1 }),
			);
			await waitFor(() => {
				expect(container.querySelector('[data-quiz-tablist]')).toBeNull();
			});
			expect(container.querySelector('[data-quiz-verdict]')).toBeNull();
		});

		// Inc 6a-ii: the mcq-mode filter admits V2 (keyword-vocab, anchored on the
		// `let`/`const` KEYWORD), V6 (kind-semantics, on the declaration identifier),
		// and V6b (const-update) — not just V1/V7. These lock that each renders as a
		// tab and grades through the SAME renderMcqTab + answer path (no per-form
		// code). The tab is found by its item id (data-quiz-tab === item.id), robust
		// to registry order; the option id is read from the live item, robust to copy
		// changes. V6b needs a `const` fixture (it never fires on `let`).
		describe('mcq form coverage — V2 keyword-vocab / V6 kind-semantics / V6b const-update', () => {
			// Pick the token at `offset`, switch to the tab for the `form` item, then
			// click its correct (or, when `wrong`, an incorrect) option. Returns the
			// mounted container so the caller asserts the verdict.
			async function answerForm(
				code: string,
				offset: number,
				form: string,
				wrong = false,
			) {
				const item = (buildQuiz(embody(code))?.items ?? []).find(
					(candidate) => candidate.form === form,
				) as McqQuizItem | undefined;
				if (item === undefined) throw new Error(`no ${form} fixture item`);
				const correctId = item.answerOptionIds[0];
				const wrongOption = item.options.find(
					(option) => !item.answerOptionIds.includes(option.id),
				);
				if (wrong && wrongOption === undefined) {
					throw new Error(`${form}: no wrong option to select`);
				}
				const optionId = wrong && wrongOption ? wrongOption.id : correctId;
				const { container } = await mountAndPick(offset, code);
				const tab = container.querySelector(`[data-quiz-tab="${item.id}"]`);
				expect(tab).not.toBeNull();
				fireEvent.click(tab as HTMLElement);
				await waitFor(() => {
					expect(tab?.getAttribute('aria-selected')).toBe('true');
				});
				fireEvent.click(
					container.querySelector(
						`[data-quiz-option="${optionId}"]`,
					) as HTMLElement,
				);
				return container;
			}

			it('V2 (on the `let` keyword, not the identifier) renders as a tab and grades correct', async () => {
				const container = await answerForm('let x = 1; x;', 0, 'V2');
				await waitFor(() => {
					expect(
						container.querySelector<HTMLElement>('[data-quiz-verdict]')?.dataset
							.quizVerdict,
					).toBe('correct');
				});
			});

			it('V6 (kind-semantics, on the declaration identifier) renders as a tab and grades correct', async () => {
				const container = await answerForm('let x = 1; x;', 4, 'V6');
				await waitFor(() => {
					expect(
						container.querySelector<HTMLElement>('[data-quiz-verdict]')?.dataset
							.quizVerdict,
					).toBe('correct');
				});
			});

			it('V6 grades a wrong option as incorrect — the verdict tracks the answer, not a stub', async () => {
				const container = await answerForm('let x = 1; x;', 4, 'V6', true);
				await waitFor(() => {
					expect(
						container.querySelector<HTMLElement>('[data-quiz-verdict]')?.dataset
							.quizVerdict,
					).toBe('incorrect');
				});
			});

			it('V6b (const-update) grades correct — needs a `const` fixture, isolated last', async () => {
				const container = await answerForm('const x = 1; x;', 6, 'V6b');
				await waitFor(() => {
					expect(
						container.querySelector<HTMLElement>('[data-quiz-verdict]')?.dataset
							.quizVerdict,
					).toBe('correct');
				});
			});

			it('V6b grades a wrong option as incorrect — the const-only form is graded, not stubbed', async () => {
				const container = await answerForm('const x = 1; x;', 6, 'V6b', true);
				await waitFor(() => {
					expect(
						container.querySelector<HTMLElement>('[data-quiz-verdict]')?.dataset
							.quizVerdict,
					).toBe('incorrect');
				});
			});
		});
	});
});
