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
// the createEditor `.then` callbacks) is partially exercised by the
// rejection-path test in the "Exceptions — factory rejection" describe
// block, which routes through the cancelledRef.current check on the way
// to setMountError (cancelledRef is false in that test, so only the
// falsy branch evaluates — the cancelled=true branch remains untested;
// an explicit StrictMode-or-quick-unmount test is the only way to
// exercise it). Adding such a test is possible but not load-bearing
// at the current scope.

import { forEachDiagnostic, forceLinting } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { EditorInstance } from '../../lib/editing/types.js';
import EditorComponent from '../index.js';

/**
 * Resolves to the EditorView mounted inside the React component's host
 * element. Waits for CodeMirror's async mount to complete (the `.cm-content`
 * element appears in the DOM only after `createEditor`'s promise resolves).
 */
async function findMountedEditorView(
	container: HTMLElement,
): Promise<EditorView> {
	const cmContent = await waitFor(() => {
		const element = container.querySelector('.cm-content');
		if (!element) throw new Error('CodeMirror content element not yet mounted');
		return element as HTMLElement;
	});
	const view = EditorView.findFromDOM(cmContent);
	if (!view) throw new Error('EditorView.findFromDOM returned null');
	return view;
}

/**
 * Counts the lint diagnostics currently held in the editor's lint state
 * field. Reads CM's diagnostic state directly (via `forEachDiagnostic`)
 * rather than scraping gutter-marker DOM, so the assertion does not depend
 * on jsdom rendering CodeMirror's layout-measured gutter.
 */
function countDiagnostics(view: EditorView): number {
	let count = 0;
	forEachDiagnostic(view.state, () => {
		count += 1;
	});
	return count;
}

/**
 * Newline-joined messages of all current lint-state diagnostics —
 * order-insensitive membership checks via `toContain`, again reading
 * lint state rather than gutter DOM.
 */
function diagnosticMessages(view: EditorView): string {
	let messages = '';
	forEachDiagnostic(view.state, (diagnostic) => {
		messages += `${diagnostic.message}\n`;
	});
	return messages;
}

/**
 * The (line, column, message) of the first diagnostic in lint state, or
 * null when none. Lets the supersede test target the structural
 * diagnostic's exact coordinates without hardcoding lintJej's output
 * (lines are 1-based, columns 0-based — the LintDiagnostic convention).
 */
function firstDiagnostic(
	view: EditorView,
): { line: number; column: number; message: string } | null {
	let first: { line: number; column: number; message: string } | null = null;
	forEachDiagnostic(view.state, (diagnostic, from) => {
		if (first !== null) return;
		const lineInfo = view.state.doc.lineAt(from);
		first = {
			line: lineInfo.number,
			column: from - lineInfo.from,
			message: diagnostic.message,
		};
	});
	return first;
}

/**
 * How many lint-state diagnostics sit at exactly (line, column) — makes
 * the supersede count-assertion robust if lintJej ever reports multiple
 * diagnostics at one position.
 */
function countDiagnosticsAt(
	view: EditorView,
	line: number,
	column: number,
): number {
	let count = 0;
	forEachDiagnostic(view.state, (_diagnostic, from) => {
		const lineInfo = view.state.doc.lineAt(from);
		if (lineInfo.number === line && from - lineInfo.from === column) {
			count += 1;
		}
	});
	return count;
}

/**
 * Newline-joined messages of the diagnostics at exactly (line, column) —
 * position-scoped variant of diagnosticMessages, needed because lintJej
 * emits IDENTICAL message text for repeated violations (two `var`s), so
 * a whole-buffer message check cannot tell the superseded marker from
 * its surviving same-message twin at another position.
 */
function diagnosticMessagesAt(
	view: EditorView,
	line: number,
	column: number,
): string {
	let messages = '';
	forEachDiagnostic(view.state, (diagnostic, from) => {
		const lineInfo = view.state.doc.lineAt(from);
		if (lineInfo.number === line && from - lineInfo.from === column) {
			messages += `${diagnostic.message}\n`;
		}
	});
	return messages;
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

	describe('Linting — JEJ diagnostics surface and clear on edit', () => {
		it('a JEJ-violating edit surfaces a diagnostic; a clean edit clears it', async () => {
			// Proves the editor wires the real `lintJej` callback end-to-end:
			// `var` (banned in JEJ) yields at least one diagnostic; editing to
			// `let` (valid JEJ) clears it. The pair is decisive — a no-linter
			// wiring never produces the first diagnostic; an always-on stub
			// never clears it; a lint-once-at-mount wiring never re-evaluates
			// the second edit. `forceLinting` bypasses CM's debounce, and
			// diagnostics are read from lint state, not gutter DOM (which jsdom
			// does not lay out).
			const { container } = render(<EditorComponent snippet="OK" />);
			const view = await findMountedEditorView(container);

			view.dispatch({
				changes: { from: 0, to: view.state.doc.length, insert: 'var x = 5;' },
			});
			forceLinting(view);
			await waitFor(() => {
				expect(countDiagnostics(view)).toBeGreaterThan(0);
			});

			view.dispatch({
				changes: { from: 0, to: view.state.doc.length, insert: 'let x = 5;' },
			});
			forceLinting(view);
			await waitFor(() => {
				expect(countDiagnostics(view)).toBe(0);
			});
		});
	});

	describe('Interpreted diagnostics — push-based gutter feed', () => {
		// The interpretedDiagnostics prop is PUSH-based, embodiment-keyed
		// data: it arrives on a React prop change with NO accompanying doc
		// change (the orchestrator computes it from its live embodiment on
		// the debounce settle). These tests pin the push cadence and the
		// supersede merge end-to-end through the real CM pipeline. See
		// lib/editing/interpreted-diagnostics.ts for the load-bearing
		// needsRefresh mechanics; lib/editing/tests/ covers the pure merge.

		it('renders an interpreted diagnostic supplied at mount', async () => {
			const { container } = render(
				<EditorComponent
					interpretedDiagnostics={[
						{
							line: 1,
							column: 4,
							severity: 'error',
							message: 'SEEDED AT MOUNT',
							source: 'interpreted',
						},
					]}
					snippet="let x = 1;"
				/>,
			);
			const view = await findMountedEditorView(container);
			await waitFor(() => {
				expect(diagnosticMessages(view)).toContain('SEEDED AT MOUNT');
			});
			// Clean JEJ code — the interpreted diagnostic is the only one.
			expect(countDiagnostics(view)).toBe(1);
		});

		it('repaints when the prop updates with NO accompanying doc change (the push cadence)', async () => {
			// THE CRUX. A prop push arrives between doc changes (the
			// orchestrator's debounce settle), so the lint plugin sees no
			// docChanged transaction. A ref-held array + forceLinting
			// silently no-ops there (the plugin's `set` flag is false) —
			// this test is the permanent regression sentinel for the
			// StateEffect/StateField + needsRefresh seam. No doc dispatch
			// and no test-side forceLinting after the rerender: the push
			// alone must repaint.
			const { container, rerender } = render(
				<EditorComponent snippet="let x = 1;" />,
			);
			const view = await findMountedEditorView(container);
			forceLinting(view);
			await waitFor(() => {
				expect(countDiagnostics(view)).toBe(0);
			});

			rerender(
				<EditorComponent
					interpretedDiagnostics={[
						{
							line: 1,
							column: 0,
							severity: 'error',
							message: 'PUSHED AFTER MOUNT',
							source: 'interpreted',
						},
					]}
					snippet="let x = 1;"
				/>,
			);
			await waitFor(() => {
				expect(countDiagnostics(view)).toBe(1);
			});
			expect(diagnosticMessages(view)).toContain('PUSHED AFTER MOUNT');
		});

		it('a second push replaces the first — pushes are not cumulative', async () => {
			// Pins the REPLACE (not accumulate) contract from the
			// setInterpretedDiagnostics JSDoc: the field holds only the
			// latest pushed array.
			const { container, rerender } = render(
				<EditorComponent
					interpretedDiagnostics={[
						{
							line: 1,
							column: 0,
							severity: 'error',
							message: 'FIRST PUSH',
							source: 'interpreted',
						},
					]}
					snippet="let x = 1;"
				/>,
			);
			const view = await findMountedEditorView(container);
			await waitFor(() => {
				expect(diagnosticMessages(view)).toContain('FIRST PUSH');
			});

			rerender(
				<EditorComponent
					interpretedDiagnostics={[
						{
							line: 1,
							column: 4,
							severity: 'error',
							message: 'SECOND PUSH',
							source: 'interpreted',
						},
					]}
					snippet="let x = 1;"
				/>,
			);
			await waitFor(() => {
				expect(diagnosticMessages(view)).toContain('SECOND PUSH');
			});
			expect(diagnosticMessages(view)).not.toContain('FIRST PUSH');
			expect(countDiagnostics(view)).toBe(1);
		});

		it('a push racing the mount seeds the LATEST prop value once mount resolves', async () => {
			// AR-3: analog of the snippet race test below — the prop changes
			// BEFORE createEditor's promise resolves. Contract: the mount
			// callback seeds from the latest prop ref (pre-mount pushes are
			// never silently dropped; intermediate values are skipped).
			const { container, rerender } = render(
				<EditorComponent
					interpretedDiagnostics={[
						{
							line: 1,
							column: 0,
							severity: 'error',
							message: 'STALE PRE-MOUNT PUSH',
							source: 'interpreted',
						},
					]}
					snippet="let x = 1;"
				/>,
			);
			rerender(
				<EditorComponent
					interpretedDiagnostics={[
						{
							line: 1,
							column: 0,
							severity: 'error',
							message: 'LATEST PRE-MOUNT PUSH',
							source: 'interpreted',
						},
					]}
					snippet="let x = 1;"
				/>,
			);
			const view = await findMountedEditorView(container);
			await waitFor(() => {
				expect(diagnosticMessages(view)).toContain('LATEST PRE-MOUNT PUSH');
			});
			expect(diagnosticMessages(view)).not.toContain('STALE PRE-MOUNT PUSH');
		});

		it('clears interpreted diagnostics when the prop updates to an empty array', async () => {
			// Also a needsRefresh sentinel on the CLEAR path (AR-3): the
			// empty-array push must re-arm the lint pass exactly like a
			// non-empty one — same seam, opposite direction.
			const { container, rerender } = render(
				<EditorComponent
					interpretedDiagnostics={[
						{
							line: 1,
							column: 0,
							severity: 'error',
							message: 'TO BE CLEARED',
							source: 'interpreted',
						},
					]}
					snippet="let x = 1;"
				/>,
			);
			const view = await findMountedEditorView(container);
			await waitFor(() => {
				expect(countDiagnostics(view)).toBe(1);
			});

			rerender(
				<EditorComponent interpretedDiagnostics={[]} snippet="let x = 1;" />,
			);
			await waitFor(() => {
				expect(countDiagnostics(view)).toBe(0);
			});
		});

		it('an interpreted diagnostic supersedes the structural one at the same position', async () => {
			// End-to-end supersede through the real lintJej feed: `var` is
			// JEJ-banned, so the structural feed reports it; pushing an
			// interpreted diagnostic at the SAME (line, column) must replace
			// that marker (no double-render of the range) while leaving the
			// total count otherwise unchanged. Coordinates are derived from
			// live lint state, not hardcoded against lintJej internals.
			// TWO `var` violations on purpose (AR-3): with a single
			// structural diagnostic, the expected count (1 − 1 + 1 = 1)
			// cannot distinguish supersede from a blanket replacement that
			// drops the whole structural feed; the second violation makes
			// blanket replacement fail the count assertion (1 ≠ 2).
			const { container, rerender } = render(<EditorComponent snippet="OK" />);
			const view = await findMountedEditorView(container);
			view.dispatch({
				changes: {
					from: 0,
					to: view.state.doc.length,
					insert: 'var x = 5;\nvar y = 3;',
				},
			});
			forceLinting(view);
			await waitFor(() => {
				expect(countDiagnostics(view)).toBeGreaterThan(0);
			});

			const structural = firstDiagnostic(view);
			if (structural === null) throw new Error('no structural diagnostic');
			const structuralCount = countDiagnostics(view);
			const collidingCount = countDiagnosticsAt(
				view,
				structural.line,
				structural.column,
			);

			rerender(
				<EditorComponent
					interpretedDiagnostics={[
						{
							line: structural.line,
							column: structural.column,
							severity: 'error',
							message: 'FRIENDLY EXPLANATION',
							source: 'interpreted',
						},
					]}
					snippet="OK"
				/>,
			);
			await waitFor(() => {
				expect(diagnosticMessages(view)).toContain('FRIENDLY EXPLANATION');
			});
			// Superseded, not added: colliding structural marker(s) replaced
			// by the one interpreted diagnostic.
			expect(countDiagnostics(view)).toBe(
				structuralCount - collidingCount + 1,
			);
			// Position-scoped (both `var` markers carry identical message
			// text): the superseded position now holds ONLY the interpreted
			// message…
			const atPosition = diagnosticMessagesAt(
				view,
				structural.line,
				structural.column,
			);
			expect(atPosition).toContain('FRIENDLY EXPLANATION');
			expect(atPosition).not.toContain(structural.message);
			// …while the same-message twin at the OTHER position survives
			// (message-level proof that supersede is per-position, not a
			// blanket structural-feed replacement).
			expect(diagnosticMessages(view)).toContain(structural.message);
		});

		it('non-colliding interpreted and structural diagnostics coexist', async () => {
			const { container, rerender } = render(<EditorComponent snippet="OK" />);
			const view = await findMountedEditorView(container);
			view.dispatch({
				changes: {
					from: 0,
					to: view.state.doc.length,
					insert: 'var x = 5;\nlet y = 2;',
				},
			});
			forceLinting(view);
			await waitFor(() => {
				expect(countDiagnostics(view)).toBeGreaterThan(0);
			});
			const structuralCount = countDiagnostics(view);

			rerender(
				<EditorComponent
					interpretedDiagnostics={[
						{
							line: 2,
							column: 0,
							severity: 'error',
							message: 'COEXISTING NOTE',
							source: 'interpreted',
						},
					]}
					snippet="OK"
				/>,
			);
			await waitFor(() => {
				expect(countDiagnostics(view)).toBe(structuralCount + 1);
			});
			expect(diagnosticMessages(view)).toContain('COEXISTING NOTE');
		});
	});

	describe('Formatting — format callback wired to formatJej', () => {
		it('passes formatJej as the format option to createEditor', async () => {
			// Proves the editor home base wires the JEJ-canonical formatter as
			// the CodeMirror format callback. The editing factory's own test
			// suite (orchestrate/lib/editing/tests/create-editor.test.ts)
			// verifies the format → dispatch → onChange chain end-to-end with
			// a synchronous format callback; the keymap-→-async-Prettier path
			// is unstable under jsdom's async-microtask interaction with
			// Prettier standalone. Testing the wiring contract directly (does
			// EditorComponent pass `format: formatJej`?) is the right level of
			// fidelity for the home-base test: it pins the integration seam
			// the home base owns, while the editing factory owns the runtime
			// behavior.
			vi.resetModules();
			const createEditorMock = vi.fn(() =>
				Promise.resolve({
					destroy: () => {},
					content: '',
					// The onMounted seed calls this unconditionally on the real
					// instance; the mock must carry it or the seed becomes an
					// unhandled rejection inside the mount .then().
					setInterpretedDiagnostics: () => {},
				} as unknown as EditorInstance),
			);
			vi.doMock('../../lib/editing/create-editor.js', () => ({
				default: createEditorMock,
			}));
			try {
				const { default: EditorComponentMocked } = await import('../index.js');
				const { default: expectedFormatJej } =
					await import('../../../lib/formatting-editor/format-jej.js');
				render(<EditorComponentMocked snippet="let x=5;" />);

				await waitFor(() => {
					expect(createEditorMock).toHaveBeenCalledWith(
						expect.any(String),
						expect.objectContaining({ format: expectedFormatJej }),
					);
				});
			} finally {
				vi.doUnmock('../../lib/editing/create-editor.js');
				vi.resetModules();
			}
		});
	});

	describe('Completing — completions callback wired to completeJej', () => {
		it('passes completeJej as the completions option to createEditor', async () => {
			// Same contract-test pattern as the Formatting block above —
			// pins the integration seam (does EditorComponent pass
			// completions: completeJej?) without exercising the keymap or
			// the completion popup. The editing factory's own test suite
			// covers the CompletionRequest → CompletionItem chain end-to-end;
			// the adapter's unit tests cover the JEJ-aware behavior.
			vi.resetModules();
			const createEditorMock = vi.fn(() =>
				Promise.resolve({
					destroy: () => {},
					content: '',
					// The onMounted seed calls this unconditionally on the real
					// instance; the mock must carry it or the seed becomes an
					// unhandled rejection inside the mount .then().
					setInterpretedDiagnostics: () => {},
				} as unknown as EditorInstance),
			);
			vi.doMock('../../lib/editing/create-editor.js', () => ({
				default: createEditorMock,
			}));
			try {
				const { default: EditorComponentMocked } = await import('../index.js');
				const { default: expectedCompleteJej } =
					await import('../../../lib/completing/complete-jej.js');
				render(<EditorComponentMocked snippet="let x=5;" />);

				await waitFor(() => {
					expect(createEditorMock).toHaveBeenCalledWith(
						expect.any(String),
						expect.objectContaining({ completions: expectedCompleteJej }),
					);
				});
			} finally {
				vi.doUnmock('../../lib/editing/create-editor.js');
				vi.resetModules();
			}
		});
	});

	describe('Documenting — docLookup callback wired to documentJej', () => {
		it('passes documentJej as the docLookup option to createEditor', async () => {
			// Same contract-test pattern as the Formatting and Completing
			// blocks above — pins the integration seam (does EditorComponent
			// pass docLookup: documentJej?) without exercising hover delay
			// or the tooltip DOM. The editing factory's own test suite
			// covers the hoverTooltip → DocEntry → DOM chain; the adapter's
			// unit tests cover the JEJ-aware table lookup behavior.
			vi.resetModules();
			const createEditorMock = vi.fn(() =>
				Promise.resolve({
					destroy: () => {},
					content: '',
					// The onMounted seed calls this unconditionally on the real
					// instance; the mock must carry it or the seed becomes an
					// unhandled rejection inside the mount .then().
					setInterpretedDiagnostics: () => {},
				} as unknown as EditorInstance),
			);
			vi.doMock('../../lib/editing/create-editor.js', () => ({
				default: createEditorMock,
			}));
			try {
				const { default: EditorComponentMocked } = await import('../index.js');
				const { default: expectedDocumentJej } =
					await import('../../../lib/documenting/document-jej.js');
				render(<EditorComponentMocked snippet="let x=5;" />);

				await waitFor(() => {
					expect(createEditorMock).toHaveBeenCalledWith(
						expect.any(String),
						expect.objectContaining({ docLookup: expectedDocumentJej }),
					);
				});
			} finally {
				vi.doUnmock('../../lib/editing/create-editor.js');
				vi.resetModules();
			}
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
