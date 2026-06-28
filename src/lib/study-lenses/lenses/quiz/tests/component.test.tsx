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
import { cleanup, render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import quizLens from '../index.js';

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
	});
});
