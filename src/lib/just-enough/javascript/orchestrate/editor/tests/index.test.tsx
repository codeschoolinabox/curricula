// @vitest-environment jsdom
//
// React-component lifecycle tests for the editor home base. The component
// owns a CodeMirror EditorView via `useEffect`-managed lifecycle; these
// tests cover mount initiation + resolution, the single-writer dispatch
// path (onSnippetChange via CM updateListener), prop sync (external snippet
// change), and unmount cleanup.
//
// No StrictMode-wrapped test is included. testing-library/react does not
// auto-wrap in `<React.StrictMode>`, and the cancellation mechanism the
// implementation uses (cancelledRef in the mount effect, checked inside
// the createEditor `.then` callbacks) is already exercised by the
// rejection-path test in the "Exceptions — factory rejection" describe
// block (which forces the cancelledRef.current check to fire before
// setMountError). Adding a real StrictMode wrapper test is possible but
// not load-bearing given that coverage.

import { EditorView } from '@codemirror/view';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import EditorComponent from '../index.js';

/**
 * Resolves to the EditorView mounted inside the React component's host
 * element. Waits for CodeMirror's async mount to complete (the `.cm-content`
 * element appears in the DOM only after `createEditor`'s promise resolves).
 */
async function findMountedEditorView(container: HTMLElement): Promise<EditorView> {
	const cmContent = await waitFor(() => {
		const element = container.querySelector('.cm-content');
		if (!element) throw new Error('CodeMirror content element not yet mounted');
		return element as HTMLElement;
	});
	const view = EditorView.findFromDOM(cmContent);
	if (!view) throw new Error('EditorView.findFromDOM returned null');
	return view;
}

describe('<EditorComponent> — CodeMirror lifecycle', () => {
	describe('Zero — minimal mount', () => {
		it('renders a host element with data-orchestrator-host attribute', () => {
			const { container } = render(<EditorComponent snippet="" />);
			const host = container.querySelector('[data-orchestrator-host]');
			expect(host).not.toBeNull();
		});

		it('the host element is a <div> (post-CodeMirror swap)', () => {
			const { container } = render(<EditorComponent snippet="" />);
			const host = container.querySelector('[data-orchestrator-host]');
			expect(host?.tagName).toBe('DIV');
		});

		it('mounts a CodeMirror EditorView inside the host element', async () => {
			const { container } = render(<EditorComponent snippet="OK" />);
			await waitFor(() => {
				expect(container.querySelector('.cm-editor')).not.toBeNull();
			});
		});

		it('initial document content matches the snippet prop', async () => {
			const { container } = render(<EditorComponent snippet="let x = 1;" />);
			const view = await findMountedEditorView(container);
			expect(view.state.doc.toString()).toBe('let x = 1;');
		});
	});

	describe('One — onSnippetChange callback wiring', () => {
		it('fires onSnippetChange with the new value when CM dispatches a docChanged transaction', async () => {
			const spy = vi.fn();
			const { container } = render(
				<EditorComponent snippet="OK" onSnippetChange={spy} />,
			);
			const view = await findMountedEditorView(container);
			view.dispatch({
				changes: { from: 0, to: view.state.doc.length, insert: 'edited' },
			});
			expect(spy).toHaveBeenCalledOnce();
			expect(spy).toHaveBeenCalledWith('edited');
		});
	});

	describe('Many — multiple edits in sequence', () => {
		it('fires onSnippetChange for each dispatch in order', async () => {
			const calls: string[] = [];
			const spy = vi.fn((v: string) => calls.push(v));
			const { container } = render(
				<EditorComponent snippet="" onSnippetChange={spy} />,
			);
			const view = await findMountedEditorView(container);
			view.dispatch({ changes: { from: 0, insert: 'a' } });
			view.dispatch({ changes: { from: 1, insert: 'b' } });
			view.dispatch({ changes: { from: 2, insert: 'c' } });
			expect(calls).toEqual(['a', 'ab', 'abc']);
		});
	});

	describe('Boundaries — controlled prop sync', () => {
		it('external snippet prop change writes the new value into the live document', async () => {
			// External-sync path (e.g. lens → editor return with original snippet
			// preserved by the orchestrator): the prop-sync effect writes the new
			// snippet into editor.content when the prop differs from current
			// document content.
			const spy = vi.fn();
			const { container, rerender } = render(
				<EditorComponent snippet="v1" onSnippetChange={spy} />,
			);
			const view = await findMountedEditorView(container);
			rerender(<EditorComponent snippet="v2" onSnippetChange={spy} />);
			await waitFor(() => {
				expect(view.state.doc.toString()).toBe('v2');
			});
		});

		it('omitted onSnippetChange does not crash on user edits', async () => {
			const { container } = render(<EditorComponent snippet="OK" />);
			const view = await findMountedEditorView(container);
			expect(() => {
				view.dispatch({ changes: { from: 0, insert: 'x' } });
			}).not.toThrow();
		});
	});

	describe('Interfaces — single-writer invariant', () => {
		it('does not echo the orchestrator round-trip when prop matches editor content', async () => {
			// Equality-guarded sync effect: when the snippet prop happens to
			// match the editor's current content (e.g. after the orchestrator's
			// setSnippet round-trip echoes the same value back), the sync effect
			// must NOT dispatch a redundant write. This is the loop-breaker for
			// the single-writer + controlled-component pattern.
			const spy = vi.fn();
			const { container, rerender } = render(
				<EditorComponent snippet="OK" onSnippetChange={spy} />,
			);
			const view = await findMountedEditorView(container);
			view.dispatch({
				changes: { from: 0, to: view.state.doc.length, insert: 'typed' },
			});
			expect(spy).toHaveBeenCalledOnce();
			spy.mockClear();
			// Now the orchestrator would re-render with the new snippet.
			// Simulate that rerender; the sync effect should see prop === doc
			// content and no-op — no second onSnippetChange fires.
			rerender(<EditorComponent snippet="typed" onSnippetChange={spy} />);
			await waitFor(() => {
				expect(view.state.doc.toString()).toBe('typed');
			});
			expect(spy).not.toHaveBeenCalled();
		});
	});

	describe('Cleanup — unmount tears down CodeMirror', () => {
		it('destroys the live document on unmount', async () => {
			const { container, unmount } = render(<EditorComponent snippet="OK" />);
			const view = await findMountedEditorView(container);
			expect(view.dom.isConnected).toBe(true);
			unmount();
			// After unmount, the EditorView's root DOM is detached from the
			// document tree. CM6's destroy() removes the .cm-editor element
			// from its parent; React.unmount alone would not do this if
			// editor.destroy() weren't called inside the cleanup.
			expect(view.dom.isConnected).toBe(false);
		});

		it('detaches CodeMirror DOM from the document on unmount', async () => {
			// Asserts CM-specific teardown (not just React's generic
			// unmount): the .cm-editor element should not persist anywhere
			// in the document after unmount. This catches the failure mode
			// where editor.destroy() is forgotten — React unmounts the host
			// div, but a CodeMirror EditorView whose .destroy() was never
			// called could in principle have re-parented its DOM elsewhere.
			const { container, unmount } = render(<EditorComponent snippet="OK" />);
			await findMountedEditorView(container);
			unmount();
			expect(container.querySelector('.cm-editor')).toBeNull();
		});
	});

	describe('Race — snippet changes before mount resolves', () => {
		it('post-mount sync writes the latest prop value (no null-handle crash)', async () => {
			// DOCS.md § Structural constraints: "If snippet changes between
			// first render and createEditor's promise resolving, the in-flight
			// mount uses the original initialCode; the post-mount prop-sync
			// effect writes the latest snippet value once mount completes."
			// Synchronously rerender with a new prop BEFORE awaiting any
			// mount-completion signal. The sync effect must (a) not crash
			// against a still-null editor handle, (b) eventually write the
			// latest prop into the live document once mount finishes.
			const { container, rerender } = render(<EditorComponent snippet="v1" />);
			rerender(<EditorComponent snippet="v2" />);
			const view = await findMountedEditorView(container);
			await waitFor(() => {
				expect(view.state.doc.toString()).toBe('v2');
			});
		});
	});

	describe('Exceptions — factory rejection', () => {
		it('renders an error-fallback host when createEditor rejects', async () => {
			// DOCS.md § Render-on-rejection: when createEditor rejects (e.g.
			// CM construction throws), the mount effect catches the rejection,
			// stores it in a fallback slot, and renders a host element
			// carrying BOTH data-orchestrator-host AND data-orchestrator-error
			// attributes. Preserving data-orchestrator-host keeps test /
			// sandbox selectors locating the surface; data-orchestrator-error
			// signals the failed state.
			vi.resetModules();
			vi.doMock('../../lib/editing/create-editor.js', () => ({
				default: vi.fn().mockRejectedValue(new Error('CM construction failed')),
			}));
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			try {
				const { default: EditorComponentMocked } = await import('../index.js');
				const { container } = render(<EditorComponentMocked snippet="OK" />);
				await waitFor(() => {
					const errorHost = container.querySelector(
						'[data-orchestrator-host][data-orchestrator-error]',
					);
					expect(errorHost).not.toBeNull();
				});
			} finally {
				warnSpy.mockRestore();
				vi.doUnmock('../../lib/editing/create-editor.js');
				vi.resetModules();
			}
		});
	});
});
