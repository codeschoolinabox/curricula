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
import {
	act,
	cleanup,
	fireEvent,
	render,
	waitFor,
} from '@testing-library/react';
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
		// `let x = 1; x;`: `=`=[6,7) is lone-V1; ref `x`=[11,12) co-anchors mcq +
		// click-token (V8) + select-in-code (V10b/c). Tab counts are DERIVED from the
		// bundle (the live M2 registry keeps adding forms), never hardcoded.
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

		// One tab per co-anchored item — the count is DERIVED from the bundle
		// (itemsAt at that range), not hardcoded, so the assertion tracks the live
		// M2 registry rather than breaking each time a form is added.
		const bundleSizeAt = (start: number, end: number) =>
			(buildQuiz(embody('let x = 1; x;'))?.items ?? []).filter(
				(item) => item.anchorRange[0] === start && item.anchorRange[1] === end,
			).length;

		it('shows one tab per co-anchored item — the reference x', async () => {
			const referenceCount = bundleSizeAt(11, 12);
			expect(referenceCount).toBeGreaterThan(1); // guard: the reference IS co-anchored
			const { container } = await mountAndPick(REFERENCE_X);
			expect(container.querySelectorAll('[data-quiz-tab]').length).toBe(
				referenceCount,
			);
		});

		it('shows a tab per co-anchored item at the deeper declaration bundle too (range-driven)', async () => {
			const declCount = bundleSizeAt(4, 5);
			expect(declCount).toBeGreaterThan(1);
			const { container } = await mountAndPick(4);
			expect(container.querySelectorAll('[data-quiz-tab]').length).toBe(
				declCount,
			);
		});

		it('tab labels are neutral bare indices (1..N), never the prompt or a gesture verb', async () => {
			const referenceCount = bundleSizeAt(11, 12);
			const { container } = await mountAndPick(REFERENCE_X);
			// Array.from (not `[...spread]`): NodeList iteration needs `dom.iterable`,
			// which is off in this repo's tsconfig (TS2488 on the spread).
			// eslint-disable-next-line unicorn/prefer-spread
			const labels = Array.from(
				container.querySelectorAll('[data-quiz-tab]'),
			).map((tab) => tab.textContent);
			expect(labels).toEqual(
				Array.from({ length: referenceCount }, (_, index) => String(index + 1)),
			);
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

		// Inc 6b: the answer phase (click-token / V8). Once the filter admits
		// click-token, the reference `x` [11,12) bundle is [V1, V7, V8]; selecting
		// the V8 tab ARMS the editor (data-quiz-phase → answer), an in-token click
		// STAGES a range, and Confirm grades it. V8 targets the DECLARATION `x`
		// [4,5), so the answer is a staged click at offset 4. The Confirm count
		// (`Confirm (N selected)`) makes staging observable in jsdom; the
		// `.cm-quiz-pending` PAINT + the real click are sandbox-only.
		describe('answer phase — click-token (V8) + select-in-code (V10a)', () => {
			const phaseOf = (root: Element) =>
				root.querySelector<HTMLElement>('[data-quiz-editor]')?.dataset
					.quizPhase;

			// Pick the reference `x`, then select its click-token (V8) tab — arming the
			// editor. Returns the mount handles; re-point `spy` to stage an answer click.
			async function armClickToken() {
				const v8 = (buildQuiz(embody('let x = 1; x;'))?.items ?? []).find(
					(item) => item.mode === 'click-token',
				);
				if (v8 === undefined) throw new Error('no click-token item admitted');
				const handles = await mountAndPick(11); // the reference `x` [11,12)
				fireEvent.click(
					handles.container.querySelector(
						`[data-quiz-tab="${v8.id}"]`,
					) as HTMLElement,
				);
				await waitFor(() => {
					expect(phaseOf(handles.container)).toBe('answer');
				});
				return handles;
			}

			// Stage the token at `offset` (an answer-phase editor click) and wait for
			// the Confirm count to reflect it, then click Confirm.
			async function stageAndConfirm(
				handles: Awaited<ReturnType<typeof mountAndPick>>,
				offset: number,
			) {
				handles.spy.mockReturnValue(offset);
				handles.cmContent.dispatchEvent(
					new MouseEvent('mousedown', {
						bubbles: true,
						clientX: 1,
						clientY: 1,
					}),
				);
				await waitFor(() => {
					expect(
						handles.container.querySelector('[data-quiz-confirm]')?.textContent,
					).toContain('1 selected');
				});
				fireEvent.click(
					handles.container.querySelector('[data-quiz-confirm]') as HTMLElement,
				);
			}

			// Stage the token at `offset` without confirming (an answer-phase click).
			function stage(
				handles: Awaited<ReturnType<typeof mountAndPick>>,
				offset: number,
			) {
				handles.spy.mockReturnValue(offset);
				handles.cmContent.dispatchEvent(
					new MouseEvent('mousedown', {
						bubbles: true,
						clientX: 1,
						clientY: 1,
					}),
				);
			}

			it('the editor opens in anchor phase (data-quiz-phase = anchor)', async () => {
				const { container } = await mountAndPick(11);
				expect(phaseOf(container)).toBe('anchor');
			});

			it('selecting the click-token tab arms the editor (anchor → answer)', async () => {
				const { container } = await armClickToken();
				expect(phaseOf(container)).toBe('answer');
			});

			it('an armed click-token tab shows Confirm and Cancel controls', async () => {
				const { container } = await armClickToken();
				expect(container.querySelector('[data-quiz-confirm]')).not.toBeNull();
				expect(container.querySelector('[data-quiz-cancel]')).not.toBeNull();
			});

			it('staging the declaration target then Confirm grades correct', async () => {
				const handles = await armClickToken();
				await stageAndConfirm(handles, 4); // the declaration `x` [4,5) — V8's target
				await waitFor(() => {
					expect(
						handles.container.querySelector<HTMLElement>('[data-quiz-verdict]')
							?.dataset.quizVerdict,
					).toBe('correct');
				});
			});

			it('staging a non-target token then Confirm grades incorrect', async () => {
				const handles = await armClickToken();
				await stageAndConfirm(handles, 11); // the reference itself — NOT the target
				await waitFor(() => {
					expect(
						handles.container.querySelector<HTMLElement>('[data-quiz-verdict]')
							?.dataset.quizVerdict,
					).toBe('incorrect');
				});
			});

			it('click-token staging is single-slot — a second click REPLACES, not appends', async () => {
				const handles = await armClickToken();
				stage(handles, 11); // stage the reference first...
				await waitFor(() => {
					expect(
						handles.container.querySelector('[data-quiz-confirm]')?.textContent,
					).toContain('1 selected');
				});
				stage(handles, 4); // ...then the declaration — replaces (still ONE staged)
				await waitFor(() => {
					expect(
						handles.container.querySelector('[data-quiz-confirm]')?.textContent,
					).toContain('1 selected');
				});
				// The staged range is [4,5) (the replacement), so Confirm grades correct;
				// had it appended ([11,12)+[4,5)) the set would not equal the target.
				fireEvent.click(
					handles.container.querySelector('[data-quiz-confirm]') as HTMLElement,
				);
				await waitFor(() => {
					expect(
						handles.container.querySelector<HTMLElement>('[data-quiz-verdict]')
							?.dataset.quizVerdict,
					).toBe('correct');
				});
			});

			it('grading a code-surface answer returns to anchor phase (the verdict disarms)', async () => {
				const handles = await armClickToken();
				await stageAndConfirm(handles, 4);
				await waitFor(() => {
					expect(
						handles.container.querySelector('[data-quiz-verdict]'),
					).not.toBeNull();
				});
				expect(phaseOf(handles.container)).toBe('anchor');
			});

			it('after a graded code-surface verdict, an editor click RE-PICKS (the handler is disarmed, not staging)', async () => {
				const handles = await armClickToken();
				await stageAndConfirm(handles, 4); // grade correct → verdict → disarm
				await waitFor(() => {
					expect(
						handles.container.querySelector('[data-quiz-verdict]'),
					).not.toBeNull();
				});
				// A post-grade click on the `=` operator must RE-PICK (anchor phase) →
				// the lone `=` bundle (no tablist). A mode-only `armed` (missing the
				// !activeVerdict disarm) would instead STAGE the click and leave the
				// 3-tab V8 bundle intact, so the tablist would persist.
				handles.spy.mockReturnValue(6);
				handles.cmContent.dispatchEvent(
					new MouseEvent('mousedown', {
						bubbles: true,
						clientX: 1,
						clientY: 1,
					}),
				);
				await waitFor(() => {
					expect(
						handles.container.querySelector('[data-quiz-tablist]'),
					).toBeNull();
				});
			});

			it('switching away from the click-token tab clears the staged pending selection', async () => {
				const handles = await armClickToken();
				stage(handles, 4); // stage the declaration (do not confirm)
				await waitFor(() => {
					expect(
						handles.container.querySelector('[data-quiz-confirm]')?.textContent,
					).toContain('1 selected');
				});
				// Switch to the first mcq tab, then back to V8 — the tab-switch must have
				// cleared pending (the single-owner [activeTab] reset).
				fireEvent.click(
					handles.container.querySelectorAll('[data-quiz-tab]')[0],
				);
				const v8 = (buildQuiz(embody('let x = 1; x;'))?.items ?? []).find(
					(item) => item.mode === 'click-token',
				);
				if (v8 === undefined) throw new Error('no click-token item admitted');
				fireEvent.click(
					handles.container.querySelector(
						`[data-quiz-tab="${v8.id}"]`,
					) as HTMLElement,
				);
				await waitFor(() => {
					expect(phaseOf(handles.container)).toBe('answer');
				});
				expect(
					handles.container.querySelector('[data-quiz-confirm]')?.textContent,
				).toContain('0 selected');
			});

			it('re-picking the anchor clears the staged pending selection', async () => {
				const handles = await armClickToken();
				await stageAndConfirm(handles, 4); // stage + grade → verdict, disarm
				await waitFor(() => {
					expect(
						handles.container.querySelector('[data-quiz-verdict]'),
					).not.toBeNull();
				});
				// The verdict disarmed the editor, so this click RE-PICKS the reference
				// (a fresh pick). Re-arming its V8 tab must show 0 staged — the re-pick
				// (via the activeTab reset) cleared the pending from the graded attempt.
				handles.spy.mockReturnValue(11);
				handles.cmContent.dispatchEvent(
					new MouseEvent('mousedown', {
						bubbles: true,
						clientX: 1,
						clientY: 1,
					}),
				);
				const v8 = (buildQuiz(embody('let x = 1; x;'))?.items ?? []).find(
					(item) => item.mode === 'click-token',
				);
				if (v8 === undefined) throw new Error('no click-token item admitted');
				await waitFor(() => {
					expect(
						handles.container.querySelector(`[data-quiz-tab="${v8.id}"]`),
					).not.toBeNull();
				});
				fireEvent.click(
					handles.container.querySelector(
						`[data-quiz-tab="${v8.id}"]`,
					) as HTMLElement,
				);
				await waitFor(() => {
					expect(phaseOf(handles.container)).toBe('answer');
				});
				expect(
					handles.container.querySelector('[data-quiz-confirm]')?.textContent,
				).toContain('0 selected');
			});

			it('cancel returns to anchor phase without grading', async () => {
				const { container } = await armClickToken();
				fireEvent.click(
					container.querySelector('[data-quiz-cancel]') as HTMLElement,
				);
				await waitFor(() => {
					expect(phaseOf(container)).toBe('anchor');
				});
				expect(container.querySelector('[data-quiz-verdict]')).toBeNull();
			});

			it('cancel clears the staged pending selection (via the tab-switch reset)', async () => {
				const handles = await armClickToken();
				stage(handles, 4); // stage the declaration
				await waitFor(() => {
					expect(
						handles.container.querySelector('[data-quiz-confirm]')?.textContent,
					).toContain('1 selected');
				});
				fireEvent.click(
					handles.container.querySelector('[data-quiz-cancel]') as HTMLElement,
				);
				await waitFor(() => {
					expect(phaseOf(handles.container)).toBe('anchor');
				});
				// Re-arm the V8 tab: the count must be 0 — cancel resets activeTab to the
				// default mcq, and the [activeTab] effect cleared pending on that switch.
				const v8 = (buildQuiz(embody('let x = 1; x;'))?.items ?? []).find(
					(item) => item.mode === 'click-token',
				);
				if (v8 === undefined) throw new Error('no click-token item admitted');
				fireEvent.click(
					handles.container.querySelector(
						`[data-quiz-tab="${v8.id}"]`,
					) as HTMLElement,
				);
				await waitFor(() => {
					expect(phaseOf(handles.container)).toBe('answer');
				});
				expect(
					handles.container.querySelector('[data-quiz-confirm]')?.textContent,
				).toContain('0 selected');
			});

			it('a whitespace click in answer phase is a no-op (stays armed, no verdict)', async () => {
				const { container, cmContent, spy } = await armClickToken();
				spy.mockReturnValue(null); // whitespace / no token
				// Wrap in act so any (buggy) state update from the handler FLUSHES before
				// the assertions — a synchronous check would miss a re-render that
				// wrongly cleared the pick. (Sync act suffices — the staging setter is
				// synchronous.)
				act(() => {
					cmContent.dispatchEvent(
						new MouseEvent('mousedown', {
							bubbles: true,
							clientX: 1,
							clientY: 1,
						}),
					);
				});
				expect(phaseOf(container)).toBe('answer');
				expect(container.querySelector('[data-quiz-verdict]')).toBeNull();
			});

			// Pick the DECLARATION `x`, then select its select-in-code (V10a) tab —
			// V10a targets BOTH occurrences (the representative [4,5) is itself a target).
			async function armSelectInCode() {
				const v10a = (buildQuiz(embody('let x = 1; x;'))?.items ?? []).find(
					(item) => item.mode === 'select-in-code' && item.form === 'V10a',
				);
				if (v10a === undefined) {
					throw new Error('no select-in-code item admitted');
				}
				const handles = await mountAndPick(4); // the declaration `x` [4,5)
				fireEvent.click(
					handles.container.querySelector(
						`[data-quiz-tab="${v10a.id}"]`,
					) as HTMLElement,
				);
				await waitFor(() => {
					expect(phaseOf(handles.container)).toBe('answer');
				});
				return handles;
			}

			it('selecting the select-in-code tab arms the editor (anchor → answer)', async () => {
				const handles = await armSelectInCode();
				expect(phaseOf(handles.container)).toBe('answer');
			});

			it('staging the anchor offset registers it as a target — the anchor is not special-cased', async () => {
				const handles = await armSelectInCode();
				stage(handles, 4); // offset 4 = the declaration [4,5), the anchor AND a target
				await waitFor(() => {
					expect(
						handles.container.querySelector('[data-quiz-confirm]')?.textContent,
					).toContain('1 selected');
				});
			});

			it('a click TOGGLES membership — stage two occurrences, toggle one off', async () => {
				const handles = await armSelectInCode();
				stage(handles, 4); // toggle ON the declaration (the anchor IS a target)
				await waitFor(() => {
					expect(
						handles.container.querySelector('[data-quiz-confirm]')?.textContent,
					).toContain('1 selected');
				});
				stage(handles, 11); // toggle ON the reference
				await waitFor(() => {
					expect(
						handles.container.querySelector('[data-quiz-confirm]')?.textContent,
					).toContain('2 selected');
				});
				stage(handles, 4); // toggle OFF the declaration (exact-equality membership)
				await waitFor(() => {
					expect(
						handles.container.querySelector('[data-quiz-confirm]')?.textContent,
					).toContain('1 selected');
				});
			});

			it('selecting EVERY occurrence (incl. the anchor) then Confirm grades correct', async () => {
				const handles = await armSelectInCode();
				stage(handles, 4); // the declaration — the anchor, itself a target
				stage(handles, 11); // the reference
				await waitFor(() => {
					expect(
						handles.container.querySelector('[data-quiz-confirm]')?.textContent,
					).toContain('2 selected');
				});
				fireEvent.click(
					handles.container.querySelector('[data-quiz-confirm]') as HTMLElement,
				);
				await waitFor(() => {
					expect(
						handles.container.querySelector<HTMLElement>('[data-quiz-verdict]')
							?.dataset.quizVerdict,
					).toBe('correct');
				});
			});

			it('a partial selection (missing an occurrence) then Confirm grades incorrect', async () => {
				const handles = await armSelectInCode();
				stage(handles, 4); // only the declaration — the reference is missing
				await waitFor(() => {
					expect(
						handles.container.querySelector('[data-quiz-confirm]')?.textContent,
					).toContain('1 selected');
				});
				fireEvent.click(
					handles.container.querySelector('[data-quiz-confirm]') as HTMLElement,
				);
				await waitFor(() => {
					expect(
						handles.container.querySelector<HTMLElement>('[data-quiz-verdict]')
							?.dataset.quizVerdict,
					).toBe('incorrect');
				});
			});
		});
	});
});
