// @vitest-environment jsdom

import { forEachDiagnostic, forceLinting } from '@codemirror/lint';
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

import type { Snippet } from '../../embody/types.js';
import * as embodyModule from '../../embody/index.js';
import * as eventBusModule from '../event-bus.js';
import StudyLenses from '../index.js';
import type { StudyLensesHandle } from '../index.js';
import type { EventBus } from '../types.js';

/**
 * Resolves to the CodeMirror EditorView mounted inside the orchestrator's
 * editor home-base (the host `<div data-orchestrator-host>` contains a
 * `.cm-content` element after async mount completes).
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
 * Simulate a user edit by replacing the entire document via a single CM
 * dispatch, wrapped in React's `act` so the resulting setState round-trip
 * commits before the next assertion. Not equivalent to `userEvent.type`
 * (which would emit one transaction per keystroke) — the F2.4 / F2.5
 * cross-boundary tests assert embody-call count (cache hit vs re-embody),
 * NOT per-keystroke transaction count, so single-dispatch suffices.
 */
function typeInto(view: EditorView, content: string): void {
	act(() => {
		view.dispatch({
			changes: { from: 0, to: view.state.doc.length, insert: content },
		});
	});
}

/**
 * Total diagnostics currently in the editor's lint state (read via
 * `forEachDiagnostic`, not gutter DOM — jsdom does not lay out CM's gutter).
 */
function countDiagnostics(view: EditorView): number {
	let count = 0;
	forEachDiagnostic(view.state, () => {
		count += 1;
	});
	return count;
}

/**
 * Diagnostics in lint state carrying the given `source` tag — discriminates
 * the orchestrator-derived `'interpreted'` feed from lintJej's `'JEJ'` feed
 * in the F6 cross-boundary tests.
 */
function countDiagnosticsBySource(view: EditorView, source: string): number {
	let count = 0;
	forEachDiagnostic(view.state, (diagnostic) => {
		if (diagnostic.source === source) {
			count += 1;
		}
	});
	return count;
}

// Unmount mounted trees between tests. The unit project runs with
// `globals: false` and no setup file, so @testing-library/react's automatic
// afterEach(cleanup) is not registered; without this, the debounced re-embody's
// pending setTimeout (scheduled by an editor edit) would survive its test and
// could fire during a later one. cleanup() unmounts, running the debounce
// effect's `.cancel()` teardown.
afterEach(cleanup);

describe('<StudyLenses> — F1 smoke', () => {
	describe('Zero — root mount', () => {
		it('renders [data-orchestrator-root]', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			const root = container.querySelector('[data-orchestrator-root]');
			expect(root).not.toBeNull();
		});
	});

	describe('One — editor home-base mount', () => {
		it('renders an element matching [data-orchestrator-host]', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			const host = container.querySelector('[data-orchestrator-host]');
			expect(host).not.toBeNull();
		});

		it('the host element is a <div> (CodeMirror EditorView container)', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			const host = container.querySelector('[data-orchestrator-host]');
			expect(host?.tagName).toBe('DIV');
		});

		it('the live document content reflects the snippet prop on initial mount', async () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			const view = await findMountedEditorView(container);
			expect(view.state.doc.toString()).toBe('OK');
		});

		it('ignores subsequent changes to the snippet prop (initial-value-only seed)', async () => {
			// F2 contract: snippet prop seeds useState on first render only.
			// Callers who want to swap the snippet after mount must remount
			// via React key={…}. A re-render with a new snippet prop does NOT
			// override the orchestrator's internal snippet state.
			const { container, rerender } = render(<StudyLenses snippet="OK" />);
			const view = await findMountedEditorView(container);
			rerender(<StudyLenses snippet="CHANGED" />);
			// Even after the rerender, the editor's content is the
			// orchestrator-owned snippet state seeded at first render — not
			// the new prop value.
			expect(view.state.doc.toString()).toBe('OK');
		});

		it('typing into the editor updates the live document on next render (Interfaces — cross-file)', async () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			const view = await findMountedEditorView(container);
			typeInto(view, 'hello world');
			expect(view.state.doc.toString()).toBe('hello world');
		});
	});

	describe('F2.4 — embody seeds at mount (both modes) and re-embodies debounced on edit', () => {
		it('embody IS called once at editor-mode mount (the seed), with the snippet', () => {
			// Live-embodiment contract: the orchestrator seeds embody(snippet) at
			// mount in BOTH modes (the editor branch is now retain-or-seed; the
			// seed runs synchronously in the lazy useState initializer). Inverts
			// the prior lazy-on-transition contract, under which an editor-mode
			// mount embodied nothing. A non-scenario snippet is used so the arg
			// check fails a hardcoded-'OK' seed.
			const embodySpy = vi.spyOn(embodyModule, 'default');
			try {
				render(<StudyLenses snippet="const seeded = 1;" />);
				expect(embodySpy).toHaveBeenCalledOnce();
				expect(embodySpy).toHaveBeenCalledWith('const seeded = 1;');
			} finally {
				embodySpy.mockRestore();
			}
		});

		it('embody IS called exactly once on initial mount with a registered lens prop', () => {
			// Lens-mode mount: the lens branch of deriveInitialState IS the seed —
			// one embody, not two (the editor seed branch is not taken).
			const embodySpy = vi.spyOn(embodyModule, 'default');
			try {
				render(<StudyLenses snippet="OK" lens="debug-props" />);
				expect(embodySpy).toHaveBeenCalledOnce();
				expect(embodySpy).toHaveBeenCalledWith('OK');
			} finally {
				embodySpy.mockRestore();
			}
		});

		it('embody fires ONCE total across an editor→lens→editor→lens round-trip with a stable snippet (seed → retain → reuse)', () => {
			// Decisive against a useMemo([snippet, lens]) fake-it: that would
			// re-fire embody on the second lens-open (the lens dep changed
			// undefined → "debug-props"). The live slot keeps count=1 across the
			// round-trip — the lens-mount seeds, lens→editor retains the non-null
			// slot (the editor branch seeds only when the slot is null), and
			// editor→lens is a snippet-identity reuse. The snippet never changes,
			// so the debounced re-embody never schedules.
			const embodySpy = vi.spyOn(embodyModule, 'default');
			try {
				const { rerender } = render(
					<StudyLenses snippet="OK" lens="debug-props" />,
				);
				expect(embodySpy).toHaveBeenCalledOnce();
				rerender(<StudyLenses snippet="OK" />);
				expect(embodySpy).toHaveBeenCalledOnce();
				rerender(<StudyLenses snippet="OK" lens="debug-props" />);
				expect(embodySpy).toHaveBeenCalledOnce();
			} finally {
				embodySpy.mockRestore();
			}
		});

		it('typing does NOT re-embody synchronously — the re-embody is debounced', async () => {
			// Real timers: after the keystroke the 200ms idle window has not
			// elapsed, so only the mount seed has fired. A synchronous-re-embody
			// fake-it would push the count to 2 here. The pending real timer is
			// cancelled by the file-level afterEach(cleanup) when the component
			// unmounts.
			const embodySpy = vi.spyOn(embodyModule, 'default');
			try {
				const { container } = render(<StudyLenses snippet="OK" />);
				const view = await findMountedEditorView(container);
				typeInto(view, 'arbitrary text');
				expect(embodySpy).toHaveBeenCalledOnce();
			} finally {
				embodySpy.mockRestore();
			}
		});

		it('the debounced re-embody fires after the idle window elapses, with the edited snippet', async () => {
			// Fake timers are SCOPED to this test (not file-global): F2.5 + L1.10
			// run on real timers and assert embody counts, so a global fake clock
			// would freeze their CodeMirror async mounts. The editor mount +
			// findMountedEditorView run on REAL timers; only the type→settle
			// window uses fake timers.
			const embodySpy = vi.spyOn(embodyModule, 'default');
			try {
				const { container } = render(<StudyLenses snippet="OK" />);
				const view = await findMountedEditorView(container);
				vi.useFakeTimers();
				try {
					typeInto(view, 'arbitrary text');
					act(() => {
						vi.advanceTimersByTime(200);
					});
					expect(embodySpy).toHaveBeenCalledTimes(2);
					expect(embodySpy).toHaveBeenLastCalledWith('arbitrary text');
				} finally {
					vi.useRealTimers();
				}
			} finally {
				embodySpy.mockRestore();
			}
		});

		it('multiple edits within the window collapse to one re-embody, with the most recent snippet', async () => {
			// Triangulates against a hardcoded-argument or fire-once-per-edit
			// fake-it: two distinct edits inside one window must produce exactly
			// one debounce embody (count = seed + 1, NOT seed + 2) carrying the
			// SECOND string (the debounce's latest-args-win contract).
			const embodySpy = vi.spyOn(embodyModule, 'default');
			try {
				const { container } = render(<StudyLenses snippet="OK" />);
				const view = await findMountedEditorView(container);
				vi.useFakeTimers();
				try {
					typeInto(view, 'first edit');
					typeInto(view, 'second edit');
					act(() => {
						vi.advanceTimersByTime(200);
					});
					expect(embodySpy).toHaveBeenCalledTimes(2);
					expect(embodySpy).toHaveBeenLastCalledWith('second edit');
				} finally {
					vi.useRealTimers();
				}
			} finally {
				embodySpy.mockRestore();
			}
		});

		it('an edit that reverts to the seeded snippet does NOT re-embody (snippet-identity guard)', async () => {
			// The debounce-settle path is snippet-identity guarded: editing away
			// then back to the slot's snippet leaves nothing to refresh, so no
			// re-embody fires. F2.5 covers the revert as a cache-hit at the
			// editor→lens transition; this covers the guard on the debounce path
			// itself (a distinct data-flow edge).
			const embodySpy = vi.spyOn(embodyModule, 'default');
			try {
				const { container } = render(<StudyLenses snippet="OK" />);
				const view = await findMountedEditorView(container);
				vi.useFakeTimers();
				try {
					typeInto(view, 'something different');
					typeInto(view, 'OK');
					act(() => {
						vi.advanceTimersByTime(200);
					});
					expect(embodySpy).toHaveBeenCalledOnce();
				} finally {
					vi.useRealTimers();
				}
			} finally {
				embodySpy.mockRestore();
			}
		});
	});

	// ─── F2.5: the live embodiment is retained across edits ───────────────

	describe('F2.5 — the live embodiment is retained across edits (no clear-on-edit)', () => {
		it('edit-then-revert → toggle to lens reuses the embodiment (the slot is retained, so reverting to the original snippet is a cache hit)', async () => {
			// New live-embodiment contract (replaces the prior clear-on-edit
			// model): an edit does NOT clear the slot. The slot keeps the last
			// embodied { snippet, embodiment }, content-keyed by snippet. Editing
			// to FAIL_AT_PARSE then reverting to "OK" leaves the slot still
			// holding the "OK" embodiment, so the editor → lens transition sees
			// liveEmbodiment.snippet === currentSnippet → cache hit → no re-embody.
			//
			// Triangulation: this test alone would also pass a broken impl that
			// never re-embodies (count stays 1). The sibling test below kills that
			// impl — it asserts count=2 + the new arg on a snippet-mismatch
			// transition. Together they triangulate "reuse on match, re-embody on
			// mismatch".
			const embodySpy = vi.spyOn(embodyModule, 'default');
			try {
				const { container, rerender } = render(
					<StudyLenses snippet="OK" lens="debug-props" />,
				);
				expect(embodySpy).toHaveBeenCalledOnce();

				rerender(<StudyLenses snippet="OK" />);
				const view = await findMountedEditorView(container);
				typeInto(view, 'FAIL_AT_PARSE');
				typeInto(view, 'OK');

				rerender(<StudyLenses snippet="OK" lens="debug-props" />);
				expect(embodySpy).toHaveBeenCalledOnce();
			} finally {
				embodySpy.mockRestore();
			}
		});

		it('edit to a different snippet → toggle re-embodies (the slot is content-keyed; a snippet mismatch at transition is a cache miss)', async () => {
			const embodySpy = vi.spyOn(embodyModule, 'default');
			try {
				const { container, rerender } = render(
					<StudyLenses snippet="OK" lens="debug-props" />,
				);
				expect(embodySpy).toHaveBeenCalledOnce();

				rerender(<StudyLenses snippet="OK" />);
				const view = await findMountedEditorView(container);
				typeInto(view, 'FAIL_AT_PARSE');

				rerender(<StudyLenses snippet="OK" lens="debug-props" />);
				expect(embodySpy).toHaveBeenCalledTimes(2);
				expect(embodySpy).toHaveBeenLastCalledWith('FAIL_AT_PARSE');
			} finally {
				embodySpy.mockRestore();
			}
		});

		it('a pending debounce is cancelled on the editor → lens flip (no late re-embody)', async () => {
			// The flip flushes the slot inline (cache-miss embody = count 2); a
			// debounce armed by the edit must NOT also fire afterwards. Without the
			// cancel the timer survives the flip — snippet is unchanged by the flip,
			// so the [snippet] effect does not re-run and its cleanup never cancels
			// it — and a 200ms advance would re-embody (count 3) under the mounted
			// lens. Fake timers are scoped to this test (mount + view on real
			// timers; only the edit → flip → advance window is faked). The
			// prop-driven flip (rerender) exercises the cancel, which lives
			// unconditionally in applyTransition — the picker path routes through
			// the same handler, so this one test gates both.
			const embodySpy = vi.spyOn(embodyModule, 'default');
			try {
				const { container, rerender } = render(<StudyLenses snippet="OK" />);
				const view = await findMountedEditorView(container);
				vi.useFakeTimers();
				try {
					typeInto(view, 'FAIL_AT_PARSE');
					rerender(<StudyLenses snippet="OK" lens="debug-props" />);
					// The flip ran applyTransition synchronously: seed (1) + the
					// inline flush embody('FAIL_AT_PARSE') (2). Asserting 2 BEFORE
					// the advance pins that the flush is synchronous (a non-flushed
					// effect would read 1) — so the second call is the flush, not
					// the surviving debounce.
					expect(embodySpy).toHaveBeenCalledTimes(2);
					act(() => {
						vi.advanceTimersByTime(200);
					});
					// Still 2: the flip cancelled the armed debounce, so the 200ms
					// advance fires nothing. Without the cancel this is 3.
					expect(embodySpy).toHaveBeenCalledTimes(2);
				} finally {
					vi.useRealTimers();
				}
			} finally {
				embodySpy.mockRestore();
			}
		});
	});

	describe('Many — non-success embody scenario', () => {
		it('mounts without throwing for "FAIL_AT_PARSE" with debug-props lens', () => {
			// F2.4: embody fires only on lens-mount, so we must mount with a lens
			// to exercise the non-success path through the orchestrator.
			const { container } = render(
				<StudyLenses snippet="FAIL_AT_PARSE" lens="debug-props" />,
			);
			const root = container.querySelector('[data-orchestrator-root]');
			expect(root).not.toBeNull();
		});
	});

	// ─── B.7: minimal lens-mount path via static registry ───────────────

	describe('B.7 — lens prop dispatches to a registered lens module', () => {
		it('lens="debug-props" mounts the debug-props lens (root carries data-lens="debug-props")', () => {
			const { container } = render(
				<StudyLenses snippet="OK" lens="debug-props" />,
			);
			const lensRoot = container.querySelector('[data-lens="debug-props"]');
			expect(lensRoot).not.toBeNull();
		});

		it('lens="writeme" mounts the writeme lens (root carries data-lens="writeme")', () => {
			// Proves the registry VALUE at key 'writeme' routes to writemeLens, not
			// just that the key is enumerated — a copy-paste `writeme: parsonsLens`
			// would render data-lens="parsons" and fail here.
			const { container } = render(
				<StudyLenses snippet="const x = 1;" lens="writeme" />,
			);
			const lensRoot = container.querySelector('[data-lens="writeme"]');
			expect(lensRoot).not.toBeNull();
		});

		it('lens="debug-props" does NOT mount the editor home-base', () => {
			const { container } = render(
				<StudyLenses snippet="OK" lens="debug-props" />,
			);
			const editorHost = container.querySelector('[data-orchestrator-host]');
			expect(editorHost).toBeNull();
		});

		it('lens="trace-table" (NOT registered) → editor home-base mounts (F1+B silent-drop fallback)', () => {
			const { container } = render(
				<StudyLenses snippet="OK" lens="trace-table" />,
			);
			const editorHost = container.querySelector('[data-orchestrator-host]');
			expect(editorHost).not.toBeNull();
			const lensRoot = container.querySelector('[data-lens]');
			expect(lensRoot).toBeNull();
		});

		it('debug-props lens receives the embodied Snippet and renders snippet.source.code', () => {
			const { container } = render(
				<StudyLenses snippet="OK" lens="debug-props" />,
			);
			const snippetPanel = container.querySelector(
				'[data-debug-panel="snippet"] pre',
			);
			expect(snippetPanel?.textContent).toBe('OK');
		});

		it('C: configs.lenses[lens] applies — two-tier chain reads from configs.lenses[lens]', () => {
			const { container } = render(
				<StudyLenses
					snippet="OK"
					lens="debug-props"
					configs={{ lenses: { 'debug-props': { tier: 'one' } } }}
				/>,
			);
			const configPanel = container.querySelector(
				'[data-debug-panel="config"] pre',
			);
			expect(JSON.parse(configPanel!.textContent ?? 'null')).toEqual({
				tier: 'one',
			});
		});

		it('C: lens-not-in-registry → editor fallback (silent-drop)', () => {
			const { container } = render(
				<StudyLenses
					snippet="OK"
					lens="trace-table"
					configs={{ lenses: { 'trace-table': { x: 'y' } } }}
				/>,
			);
			const editorHost = container.querySelector('[data-orchestrator-host]');
			expect(editorHost).not.toBeNull();
			const lensRoot = container.querySelector('[data-lens]');
			expect(lensRoot).toBeNull();
		});

		// ─── C: opaque-boundary test (AR-3 Concern 4 pattern) ────────────────

		it('C: opaque boundary — configs.defaults is NOT consulted as a fallback for per-lens config resolution', () => {
			// The two-tier chain `module.config() ⊕ configs.lenses?.[lens]`
			// MUST NOT reach into `configs.defaults` or other top-level
			// cascade keys for the resolved per-lens config. This test
			// FALSIFIES the buggy-impl scenario where `configs.lenses[lens]`
			// is absent and the impl falls through to
			// `configs.defaults[lens]` or similar. We deliberately seed a
			// contradicting value under `configs.defaults["debug-props"]` —
			// if any future regression makes the orchestrator consult that
			// key, the assertion would catch the wrong source winning.
			// The public `StudyLensesProps.configs` is maximally opaque
			// (`Readonly<Record<string, unknown>>`), so this literal
			// satisfies the type directly — no cast needed.
			const contradicting = {
				lenses: { 'debug-props': { onlySource: 'lenses-entry' } },
				defaults: { 'debug-props': { onlySource: 'WRONG-from-defaults' } },
			};
			const { container } = render(
				<StudyLenses snippet="OK" lens="debug-props" configs={contradicting} />,
			);
			const configPanel = container.querySelector(
				'[data-debug-panel="config"] pre',
			);
			expect(JSON.parse(configPanel!.textContent ?? 'null')).toEqual({
				onlySource: 'lenses-entry',
			});
		});

		// NOTE on merge-collision triangulation: a deep-merge test where
		// `module.config()` provides a tier-0 baseline that conflicts with
		// `configs.lenses[lens]`'s tier-1 entry would close the AR-3
		// Concern 2 gap. Today `debug-props.module.config()` returns `{}`
		// (no baseline keys), so the only registered lens at F1+B cannot
		// support this test. Re-evaluate when F4 lands a lens with a
		// non-empty default factory.
	});

	// ─── F2.2: mode-discriminator state machine ──────────────────────────

	describe('F2.2 — mode-discriminator (OrchestratorState)', () => {
		describe('Zero/One — initial mode from props', () => {
			it('mounts in editor mode when no lens prop (editor home-base present, no lens root)', () => {
				const { container } = render(<StudyLenses snippet="OK" />);
				expect(
					container.querySelector('[data-orchestrator-host]'),
				).not.toBeNull();
				expect(container.querySelector('[data-lens]')).toBeNull();
			});

			it('mounts directly in lens mode when lens="debug-props" (registered)', () => {
				const { container } = render(
					<StudyLenses snippet="OK" lens="debug-props" />,
				);
				expect(
					container.querySelector('[data-lens="debug-props"]'),
				).not.toBeNull();
				expect(container.querySelector('[data-orchestrator-host]')).toBeNull();
			});

			it('mounts in editor mode when lens="not-registered" (silent-drop fallback)', () => {
				const { container } = render(
					<StudyLenses snippet="OK" lens="not-registered" />,
				);
				expect(
					container.querySelector('[data-orchestrator-host]'),
				).not.toBeNull();
				expect(container.querySelector('[data-lens]')).toBeNull();
			});
		});

		describe('Many — mode transitions on prop change', () => {
			it('transitions editor → lens when lens prop changes from unset to "debug-props"', () => {
				const { container, rerender } = render(<StudyLenses snippet="OK" />);
				expect(
					container.querySelector('[data-orchestrator-host]'),
				).not.toBeNull();
				expect(container.querySelector('[data-lens]')).toBeNull();

				rerender(<StudyLenses snippet="OK" lens="debug-props" />);

				expect(
					container.querySelector('[data-lens="debug-props"]'),
				).not.toBeNull();
				expect(container.querySelector('[data-orchestrator-host]')).toBeNull();
			});

			it('transitions lens → editor when lens prop changes from "debug-props" to unset', () => {
				const { container, rerender } = render(
					<StudyLenses snippet="OK" lens="debug-props" />,
				);
				expect(
					container.querySelector('[data-lens="debug-props"]'),
				).not.toBeNull();

				rerender(<StudyLenses snippet="OK" />);

				expect(
					container.querySelector('[data-orchestrator-host]'),
				).not.toBeNull();
				expect(container.querySelector('[data-lens]')).toBeNull();
			});

			it('transitions lens → editor when lens prop changes to an unregistered key', () => {
				const { container, rerender } = render(
					<StudyLenses snippet="OK" lens="debug-props" />,
				);
				expect(
					container.querySelector('[data-lens="debug-props"]'),
				).not.toBeNull();

				rerender(<StudyLenses snippet="OK" lens="not-registered" />);

				expect(
					container.querySelector('[data-orchestrator-host]'),
				).not.toBeNull();
				expect(container.querySelector('[data-lens]')).toBeNull();
			});
		});
	});
});

describe('<StudyLenses> — F5b.1 bus instance', () => {
	describe('Zero — forwarded ref exposes the bus', () => {
		it('the ref handle carries a bus with a callable dispatch method', () => {
			const ref = React.createRef<StudyLensesHandle>();
			render(<StudyLenses snippet="OK" ref={ref} />);
			expect(typeof ref.current?.bus.dispatch).toBe('function');
		});
	});

	describe('One — bus identity is stable across re-renders', () => {
		it('a re-render with the same props keeps the bus reference identical', () => {
			const ref = React.createRef<StudyLensesHandle>();
			const { rerender } = render(<StudyLenses snippet="OK" ref={ref} />);
			const initialBus = ref.current!.bus;
			rerender(<StudyLenses snippet="OK" ref={ref} />);
			expect(ref.current!.bus).toBe(initialBus);
		});
	});

	describe('Boundary — two mounted instances have distinct buses', () => {
		it('the ref from mount A and the ref from mount B carry different bus objects', () => {
			const refA = React.createRef<StudyLensesHandle>();
			const refB = React.createRef<StudyLensesHandle>();
			render(<StudyLenses snippet="OK" ref={refA} />);
			render(<StudyLenses snippet="OK" ref={refB} />);
			expect(refA.current!.bus).not.toBe(refB.current!.bus);
		});
	});
});

function createSpyBus(): {
	bus: EventBus;
	dispatchSpy: ReturnType<typeof vi.fn>;
} {
	const dispatchSpy = vi.fn();
	const bus: EventBus = Object.freeze({
		dispatch: dispatchSpy,
		subscribe: () => () => {},
		unsubscribe: () => {},
		clear: () => {},
	});
	return { bus, dispatchSpy };
}

describe('<StudyLenses> — F5b.2 initial-mount dispatch (lens mode)', () => {
	describe('Zero — initial mount in editor mode dispatches nothing', () => {
		it('rendering without a lens prop produces no bus dispatch', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				render(<StudyLenses snippet="OK" />);
				expect(dispatchSpy).not.toHaveBeenCalled();
			} finally {
				factorySpy.mockRestore();
			}
		});
	});

	describe('One — initial mount in lens mode dispatches both bus events', () => {
		it('mode-changed fires with {from: editor, to: lens}', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				render(<StudyLenses snippet="OK" lens="debug-props" />);
				expect(dispatchSpy).toHaveBeenCalledWith('mode-changed', {
					from: 'editor',
					to: 'lens',
				});
			} finally {
				factorySpy.mockRestore();
			}
		});

		it('lens-switched fires with {previous: null, next: debug-props, source: initial}', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				render(<StudyLenses snippet="OK" lens="debug-props" />);
				expect(dispatchSpy).toHaveBeenCalledWith('lens-switched', {
					previous: null,
					next: 'debug-props',
					source: 'initial',
				});
			} finally {
				factorySpy.mockRestore();
			}
		});

		it('mode-changed dispatches before lens-switched (deterministic ordering)', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				render(<StudyLenses snippet="OK" lens="debug-props" />);
				const eventNames = dispatchSpy.mock.calls.map((args) => args[0]);
				expect(eventNames).toEqual(['mode-changed', 'lens-switched']);
			} finally {
				factorySpy.mockRestore();
			}
		});

		it('dispatches exactly twice under React StrictMode (fire-once guard)', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				render(
					<React.StrictMode>
						<StudyLenses snippet="OK" lens="debug-props" />
					</React.StrictMode>,
				);
				expect(dispatchSpy).toHaveBeenCalledTimes(2);
			} finally {
				factorySpy.mockRestore();
			}
		});
	});

	describe('Boundary — initial mount with an unregistered lens prop dispatches nothing', () => {
		it('rendering with lens="not-registered" silently falls back to editor mode and dispatches no bus event', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				render(<StudyLenses snippet="OK" lens="not-registered" />);
				expect(dispatchSpy).not.toHaveBeenCalled();
			} finally {
				factorySpy.mockRestore();
			}
		});
	});
});

describe('<StudyLenses> — F5b.4 prop-driven editor → lens transition', () => {
	describe('Many — both bus events dispatch on prop-driven editor→lens transition', () => {
		it('mode-changed fires with {from: editor, to: lens}', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { rerender } = render(<StudyLenses snippet="OK" />);
				expect(dispatchSpy).not.toHaveBeenCalled();
				rerender(<StudyLenses snippet="OK" lens="debug-props" />);
				expect(dispatchSpy).toHaveBeenCalledWith('mode-changed', {
					from: 'editor',
					to: 'lens',
				});
			} finally {
				factorySpy.mockRestore();
			}
		});

		it('lens-switched fires with {previous: null, next: debug-props, source: prop}', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { rerender } = render(<StudyLenses snippet="OK" />);
				expect(dispatchSpy).not.toHaveBeenCalled();
				rerender(<StudyLenses snippet="OK" lens="debug-props" />);
				expect(dispatchSpy).toHaveBeenCalledWith('lens-switched', {
					previous: null,
					next: 'debug-props',
					source: 'prop',
				});
			} finally {
				factorySpy.mockRestore();
			}
		});

		it('mode-changed dispatches before lens-switched on the prop-driven transition', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { rerender } = render(<StudyLenses snippet="OK" />);
				expect(dispatchSpy).not.toHaveBeenCalled();
				rerender(<StudyLenses snippet="OK" lens="debug-props" />);
				const eventNames = dispatchSpy.mock.calls.map((args) => args[0]);
				expect(eventNames).toEqual(['mode-changed', 'lens-switched']);
			} finally {
				factorySpy.mockRestore();
			}
		});

		it('the prop-driven transition dispatches exactly twice under React StrictMode', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { rerender } = render(
					<React.StrictMode>
						<StudyLenses snippet="OK" />
					</React.StrictMode>,
				);
				expect(dispatchSpy).not.toHaveBeenCalled();
				rerender(
					<React.StrictMode>
						<StudyLenses snippet="OK" lens="debug-props" />
					</React.StrictMode>,
				);
				expect(dispatchSpy).toHaveBeenCalledTimes(2);
			} finally {
				factorySpy.mockRestore();
			}
		});
	});
});

describe('<StudyLenses> — F5b.5 prop-driven lens → editor transition', () => {
	describe('Boundary — only mode-changed dispatches on lens → editor', () => {
		it('mode-changed fires with {from: lens, to: editor}', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { rerender } = render(
					<StudyLenses snippet="OK" lens="debug-props" />,
				);
				expect(dispatchSpy).toHaveBeenCalledTimes(2);
				dispatchSpy.mockClear();
				rerender(<StudyLenses snippet="OK" />);
				expect(dispatchSpy).toHaveBeenCalledWith('mode-changed', {
					from: 'lens',
					to: 'editor',
				});
			} finally {
				factorySpy.mockRestore();
			}
		});

		it('lens-switched does NOT dispatch on the lens → editor transition', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { rerender } = render(
					<StudyLenses snippet="OK" lens="debug-props" />,
				);
				expect(dispatchSpy).toHaveBeenCalledTimes(2);
				dispatchSpy.mockClear();
				rerender(<StudyLenses snippet="OK" />);
				expect(dispatchSpy).not.toHaveBeenCalledWith(
					'lens-switched',
					expect.anything(),
				);
			} finally {
				factorySpy.mockRestore();
			}
		});

		it('the prop-driven lens → editor transition dispatches exactly once under React StrictMode', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { rerender } = render(
					<React.StrictMode>
						<StudyLenses snippet="OK" lens="debug-props" />
					</React.StrictMode>,
				);
				expect(dispatchSpy).toHaveBeenCalledTimes(2);
				dispatchSpy.mockClear();
				rerender(
					<React.StrictMode>
						<StudyLenses snippet="OK" />
					</React.StrictMode>,
				);
				expect(dispatchSpy).toHaveBeenCalledTimes(1);
			} finally {
				factorySpy.mockRestore();
			}
		});
	});
});

describe('<StudyLenses> — C2 the phases panel mounts above the active surface', () => {
	describe('Zero — the panel is present in editor mode', () => {
		it('rendering without a lens prop shows the [data-orchestrator-phases-panel] element', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			expect(
				container.querySelector('[data-orchestrator-phases-panel]'),
			).not.toBeNull();
		});
	});

	describe('One — the panel is also present in lens mode', () => {
		it('rendering with lens="debug-props" still shows the [data-orchestrator-phases-panel] element', () => {
			const { container } = render(
				<StudyLenses snippet="OK" lens="debug-props" />,
			);
			expect(
				container.querySelector('[data-orchestrator-phases-panel]'),
			).not.toBeNull();
		});
	});
});

describe('<StudyLenses> — Redesign: chrome above the active surface (content row)', () => {
	describe('editor mode', () => {
		it('wraps the editor host in [data-orchestrator-content-row]', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			expect(
				container.querySelector(
					'[data-orchestrator-content-row] [data-orchestrator-host]',
				),
			).not.toBeNull();
		});

		it('places the phases panel directly above the omnipresent region (panel first in column)', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			const panel = container.querySelector('[data-orchestrator-phases-panel]');
			const region = container.querySelector(
				'[data-orchestrator-omnipresent-region]',
			);
			expect(region).not.toBeNull();
			expect(panel?.nextElementSibling).toBe(region);
		});

		it('places the omnipresent region directly above the content row (chrome above content)', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			const region = container.querySelector(
				'[data-orchestrator-omnipresent-region]',
			);
			const contentRow = container.querySelector(
				'[data-orchestrator-content-row]',
			);
			expect(contentRow).not.toBeNull();
			expect(region?.nextElementSibling).toBe(contentRow);
		});

		it('never renders an orchestrator control under the active surface (region not inside content row)', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			const contentRow = container.querySelector(
				'[data-orchestrator-content-row]',
			);
			expect(contentRow).not.toBeNull();
			expect(
				contentRow?.querySelector('[data-orchestrator-omnipresent-region]'),
			).toBeNull();
		});
	});

	describe('lens mode', () => {
		it('wraps the active lens in [data-orchestrator-content-row]', () => {
			const { container } = render(
				<StudyLenses snippet="OK" lens="debug-props" />,
			);
			expect(
				container.querySelector(
					'[data-orchestrator-content-row] [data-lens="debug-props"]',
				),
			).not.toBeNull();
		});

		it('places the omnipresent region directly above the content row in lens mode', () => {
			const { container } = render(
				<StudyLenses snippet="OK" lens="debug-props" />,
			);
			const region = container.querySelector(
				'[data-orchestrator-omnipresent-region]',
			);
			const contentRow = container.querySelector(
				'[data-orchestrator-content-row]',
			);
			expect(contentRow).not.toBeNull();
			expect(region?.nextElementSibling).toBe(contentRow);
		});

		it('places the phases panel directly above the omnipresent region in lens mode', () => {
			const { container } = render(
				<StudyLenses snippet="OK" lens="debug-props" />,
			);
			const panel = container.querySelector('[data-orchestrator-phases-panel]');
			const region = container.querySelector(
				'[data-orchestrator-omnipresent-region]',
			);
			expect(region).not.toBeNull();
			expect(panel?.nextElementSibling).toBe(region);
		});

		it('never renders an orchestrator control under the active lens (region not inside content row)', () => {
			const { container } = render(
				<StudyLenses snippet="OK" lens="debug-props" />,
			);
			const contentRow = container.querySelector(
				'[data-orchestrator-content-row]',
			);
			expect(contentRow).not.toBeNull();
			expect(
				contentRow?.querySelector('[data-orchestrator-omnipresent-region]'),
			).toBeNull();
		});
	});
});

describe('<StudyLenses> — Redesign: output panels in the content row (channels left the dock)', () => {
	// Appear-on-run (inc 5): the panels mount only once a run starts, so these
	// drive a Run first; idle-absence is pinned in the inc-5 describe.
	it('renders the output-panels surface inside the content row once a run starts (editor mode)', async () => {
		const { container } = render(<StudyLenses snippet="OK" />);
		fireEvent.click(container.querySelector('[data-orchestrator-dock-run]')!);
		expect(
			container.querySelector(
				'[data-orchestrator-content-row] [data-orchestrator-output-panels]',
			),
		).not.toBeNull();
		await act(async () => {});
	});

	it('renders both channels under the content row via the -output-channel selector once a run starts', async () => {
		const { container } = render(<StudyLenses snippet="OK" />);
		fireEvent.click(container.querySelector('[data-orchestrator-dock-run]')!);
		expect(
			container.querySelector(
				'[data-orchestrator-content-row] [data-orchestrator-output-channel="user-interface"]',
			),
		).not.toBeNull();
		expect(
			container.querySelector(
				'[data-orchestrator-content-row] [data-orchestrator-output-channel="developer-console"]',
			),
		).not.toBeNull();
		await act(async () => {});
	});

	it('no longer renders the retired -dock-channel selector anywhere', () => {
		const { container } = render(<StudyLenses snippet="OK" />);
		expect(
			container.querySelector('[data-orchestrator-dock-channel]'),
		).toBeNull();
	});

	it('keeps output out of the dock — the dock is controls-only now', () => {
		const { container } = render(<StudyLenses snippet="OK" />);
		expect(
			container.querySelector(
				'[data-orchestrator-dock] [data-orchestrator-output-channel]',
			),
		).toBeNull();
	});

	it('mounts the output panels inside the content row in LENS mode too once a run starts', async () => {
		const { container } = render(
			<StudyLenses snippet="OK" lens="debug-props" />,
		);
		fireEvent.click(container.querySelector('[data-orchestrator-dock-run]')!);
		expect(
			container.querySelector(
				'[data-orchestrator-content-row] [data-orchestrator-output-panels]',
			),
		).not.toBeNull();
		await act(async () => {});
	});
});

describe('<StudyLenses> — C2 the per-station dropdowns (the panel as picker surface)', () => {
	describe('C2.3 — the source station enumerates the panel-included registry', () => {
		it('the source dropdown has the sentinel followed by the five source lenses in registration order', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			const options = container.querySelectorAll<HTMLOptionElement>(
				'[data-orchestrator-station="source"] option',
			);
			// eslint-disable-next-line unicorn/prefer-spread -- NodeList spread fails tsc without dom.iterable
			const values = Array.from(options).map((option) => option.value);
			expect(values).toEqual([
				'',
				'annotate',
				'blanks',
				'parsons',
				'quiz',
				'writeme',
			]);
		});

		it('debug-props appears in no station dropdown (panel-excluded)', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			expect(
				container.querySelectorAll(
					'[data-orchestrator-station] option[value="debug-props"]',
				),
			).toHaveLength(0);
		});
	});

	describe('C2.4 — source-station dropdown value in editor mode', () => {
		it('the source dropdown value is the empty string when there is no lens prop', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			const picker = container.querySelector<HTMLSelectElement>(
				'[data-orchestrator-station="source"] select',
			);
			expect(picker?.value).toBe('');
		});

		it('the source dropdown value re-syncs to "" after a lens → editor transition', () => {
			const { container, rerender } = render(
				<StudyLenses snippet="OK" lens="annotate" />,
			);
			rerender(<StudyLenses snippet="OK" />);
			const picker = container.querySelector<HTMLSelectElement>(
				'[data-orchestrator-station="source"] select',
			);
			expect(picker?.value).toBe('');
		});
	});

	describe('C2.6 — selecting a lens from a station dropdown (editor → lens)', () => {
		it('selecting "annotate" from editor mode dispatches mode-changed({from: editor, to: lens})', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { container } = render(<StudyLenses snippet="OK" />);
				expect(dispatchSpy).not.toHaveBeenCalled();
				const picker = container.querySelector(
					'[data-orchestrator-station="source"] select',
				) as HTMLSelectElement;
				fireEvent.change(picker, { target: { value: 'annotate' } });
				expect(dispatchSpy).toHaveBeenCalledWith('mode-changed', {
					from: 'editor',
					to: 'lens',
				});
			} finally {
				factorySpy.mockRestore();
			}
		});

		it('selecting "annotate" from editor mode dispatches lens-switched(null → annotate, panel)', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { container } = render(<StudyLenses snippet="OK" />);
				expect(dispatchSpy).not.toHaveBeenCalled();
				const picker = container.querySelector(
					'[data-orchestrator-station="source"] select',
				) as HTMLSelectElement;
				fireEvent.change(picker, { target: { value: 'annotate' } });
				expect(dispatchSpy).toHaveBeenCalledWith('lens-switched', {
					previous: null,
					next: 'annotate',
					source: 'panel',
				});
			} finally {
				factorySpy.mockRestore();
			}
		});

		it('mode-changed dispatches before lens-switched on the panel-driven transition', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { container } = render(<StudyLenses snippet="OK" />);
				const picker = container.querySelector(
					'[data-orchestrator-station="source"] select',
				) as HTMLSelectElement;
				fireEvent.change(picker, { target: { value: 'annotate' } });
				const eventNames = dispatchSpy.mock.calls.map((args) => args[0]);
				expect(eventNames).toEqual(['mode-changed', 'lens-switched']);
			} finally {
				factorySpy.mockRestore();
			}
		});

		it('selecting "annotate" from editor mode mounts the annotate lens', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			const picker = container.querySelector(
				'[data-orchestrator-station="source"] select',
			) as HTMLSelectElement;
			fireEvent.change(picker, { target: { value: 'annotate' } });
			expect(container.querySelector('[data-lens="annotate"]')).not.toBeNull();
		});

		it('selecting "writeme" from editor mode mounts the writeme lens', () => {
			const { container } = render(<StudyLenses snippet="const x = 1;" />);
			const picker = container.querySelector(
				'[data-orchestrator-station="source"] select',
			) as HTMLSelectElement;
			fireEvent.change(picker, { target: { value: 'writeme' } });
			expect(container.querySelector('[data-lens="writeme"]')).not.toBeNull();
		});
	});

	describe('C2.7 — selecting a different lens from a station dropdown (in-mode lens switch)', () => {
		it('selecting "blanks" while lens="annotate" dispatches lens-switched({previous: "annotate", next: "blanks", source: "panel"})', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { container } = render(
					<StudyLenses snippet="OK" lens="annotate" />,
				);
				expect(dispatchSpy).toHaveBeenCalledTimes(2);
				dispatchSpy.mockClear();
				const picker = container.querySelector(
					'[data-orchestrator-station="source"] select',
				) as HTMLSelectElement;
				fireEvent.change(picker, { target: { value: 'blanks' } });
				expect(dispatchSpy).toHaveBeenCalledWith('lens-switched', {
					previous: 'annotate',
					next: 'blanks',
					source: 'panel',
				});
			} finally {
				factorySpy.mockRestore();
			}
		});

		it('the in-mode panel switch does NOT dispatch mode-changed (mode stays "lens")', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { container } = render(
					<StudyLenses snippet="OK" lens="annotate" />,
				);
				expect(dispatchSpy).toHaveBeenCalledTimes(2);
				dispatchSpy.mockClear();
				const picker = container.querySelector(
					'[data-orchestrator-station="source"] select',
				) as HTMLSelectElement;
				fireEvent.change(picker, { target: { value: 'blanks' } });
				expect(dispatchSpy).not.toHaveBeenCalledWith(
					'mode-changed',
					expect.anything(),
				);
			} finally {
				factorySpy.mockRestore();
			}
		});
	});

	describe('C2.5 — source-station dropdown value in lens mode', () => {
		it('the source dropdown value equals the active lens name when lens="annotate"', () => {
			const { container } = render(
				<StudyLenses snippet="OK" lens="annotate" />,
			);
			const picker = container.querySelector<HTMLSelectElement>(
				'[data-orchestrator-station="source"] select',
			);
			expect(picker?.value).toBe('annotate');
		});

		it('the source dropdown value re-syncs to the new active lens after an in-mode lens switch', () => {
			const { container, rerender } = render(
				<StudyLenses snippet="OK" lens="annotate" />,
			);
			rerender(<StudyLenses snippet="OK" lens="blanks" />);
			const picker = container.querySelector<HTMLSelectElement>(
				'[data-orchestrator-station="source"] select',
			);
			expect(picker?.value).toBe('blanks');
		});

		it('a prop-mounted panel-excluded lens leaves every station dropdown on the sentinel', () => {
			const { container } = render(
				<StudyLenses snippet="OK" lens="debug-props" />,
			);
			// eslint-disable-next-line unicorn/prefer-spread -- NodeList spread fails tsc without dom.iterable
			const values = Array.from(
				container.querySelectorAll<HTMLSelectElement>(
					'[data-orchestrator-station] select',
				),
			).map((select) => select.value);
			expect(values).toEqual(['', '', '', '', '']);
		});
	});
});

describe('<StudyLenses> — C2.11 external lens prop change re-syncs the panel', () => {
	describe('Many+Interface — most-recent write wins after a panel-driven selection', () => {
		it('after the panel selects "annotate", an external lens="writeme" prop change moves the source dropdown to "writeme"', () => {
			const { container, rerender } = render(<StudyLenses snippet="OK" />);
			const picker = container.querySelector(
				'[data-orchestrator-station="source"] select',
			) as HTMLSelectElement;
			fireEvent.change(picker, { target: { value: 'annotate' } });
			expect(picker.value).toBe('annotate');
			rerender(<StudyLenses snippet="OK" lens="writeme" />);
			expect(picker.value).toBe('writeme');
		});

		it('after the panel selects "blanks", an external lens=undefined prop change resets the source dropdown to the sentinel', () => {
			const { container, rerender } = render(
				<StudyLenses snippet="OK" lens="annotate" />,
			);
			const picker = container.querySelector(
				'[data-orchestrator-station="source"] select',
			) as HTMLSelectElement;
			fireEvent.change(picker, { target: { value: 'blanks' } });
			expect(picker.value).toBe('blanks');
			rerender(<StudyLenses snippet="OK" />);
			expect(picker.value).toBe('');
		});
	});
});

describe('<StudyLenses> — L1.8 + L1.9 + L1.10 edit-return button', () => {
	describe('L1.8 — Zero: editor mode hides the edit button', () => {
		it('rendering without a lens prop shows no [data-orchestrator-edit-button] element', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			expect(
				container.querySelector('[data-orchestrator-edit-button]'),
			).toBeNull();
		});
	});

	describe('L1.9 — One: lens mode shows the edit button', () => {
		it('rendering with lens="debug-props" shows the [data-orchestrator-edit-button] element', () => {
			const { container } = render(
				<StudyLenses snippet="OK" lens="debug-props" />,
			);
			expect(
				container.querySelector('[data-orchestrator-edit-button]'),
			).not.toBeNull();
		});

		it('the edit element is a <button>', () => {
			const { container } = render(
				<StudyLenses snippet="OK" lens="debug-props" />,
			);
			const editButton = container.querySelector(
				'[data-orchestrator-edit-button]',
			);
			expect(editButton?.tagName).toBe('BUTTON');
		});
	});

	describe('L1.10 — Interface: clicking the edit button returns to editor mode', () => {
		it('the click dispatches mode-changed({from: lens, to: editor})', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { container } = render(
					<StudyLenses snippet="OK" lens="debug-props" />,
				);
				expect(dispatchSpy).toHaveBeenCalledTimes(2);
				dispatchSpy.mockClear();
				const editButton = container.querySelector(
					'[data-orchestrator-edit-button]',
				) as HTMLButtonElement;
				fireEvent.click(editButton);
				expect(dispatchSpy).toHaveBeenCalledWith('mode-changed', {
					from: 'lens',
					to: 'editor',
				});
			} finally {
				factorySpy.mockRestore();
			}
		});

		it('the click does NOT dispatch lens-switched (no lens is being selected)', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { container } = render(
					<StudyLenses snippet="OK" lens="debug-props" />,
				);
				expect(dispatchSpy).toHaveBeenCalledTimes(2);
				dispatchSpy.mockClear();
				const editButton = container.querySelector(
					'[data-orchestrator-edit-button]',
				) as HTMLButtonElement;
				fireEvent.click(editButton);
				expect(dispatchSpy).not.toHaveBeenCalledWith(
					'lens-switched',
					expect.anything(),
				);
			} finally {
				factorySpy.mockRestore();
			}
		});

		it('after the click, the editor home base is mounted ([data-orchestrator-host] present)', () => {
			const { container } = render(
				<StudyLenses snippet="OK" lens="debug-props" />,
			);
			const editButton = container.querySelector(
				'[data-orchestrator-edit-button]',
			) as HTMLButtonElement;
			fireEvent.click(editButton);
			expect(
				container.querySelector('[data-orchestrator-host]'),
			).not.toBeNull();
		});

		it('after the click, the edit button is no longer rendered (state is back in editor mode)', () => {
			const { container } = render(
				<StudyLenses snippet="OK" lens="debug-props" />,
			);
			const editButton = container.querySelector(
				'[data-orchestrator-edit-button]',
			) as HTMLButtonElement;
			fireEvent.click(editButton);
			expect(
				container.querySelector('[data-orchestrator-edit-button]'),
			).toBeNull();
		});

		it('after clicking edit, opening a lens via a station dropdown re-mounts a lens (state machine is re-entrant)', () => {
			const { container } = render(
				<StudyLenses snippet="OK" lens="debug-props" />,
			);
			const editButton = container.querySelector(
				'[data-orchestrator-edit-button]',
			) as HTMLButtonElement;
			fireEvent.click(editButton);
			const picker = container.querySelector(
				'[data-orchestrator-station="source"] select',
			) as HTMLSelectElement;
			fireEvent.change(picker, { target: { value: 'annotate' } });
			expect(container.querySelector('[data-lens="annotate"]')).not.toBeNull();
		});

		it('the edit-return → panel-reopen round trip with stable snippet is a cache-hit (embody fires once total)', () => {
			const embodySpy = vi.spyOn(embodyModule, 'default');
			try {
				const { container } = render(
					<StudyLenses snippet="OK" lens="debug-props" />,
				);
				expect(embodySpy).toHaveBeenCalledTimes(1);
				const editButton = container.querySelector(
					'[data-orchestrator-edit-button]',
				) as HTMLButtonElement;
				fireEvent.click(editButton);
				const picker = container.querySelector(
					'[data-orchestrator-station="source"] select',
				) as HTMLSelectElement;
				fireEvent.change(picker, { target: { value: 'annotate' } });
				expect(embodySpy).toHaveBeenCalledTimes(1);
			} finally {
				embodySpy.mockRestore();
			}
		});
	});
});

describe('<StudyLenses> — F5b.6 prop-driven in-mode lens-switch (lens → lens)', () => {
	describe('Interface — only lens-switched dispatches on in-mode lens switch', () => {
		it('lens-switched fires with non-null previous and source: prop', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { rerender } = render(
					<StudyLenses snippet="OK" lens="annotate" />,
				);
				expect(dispatchSpy).toHaveBeenCalledTimes(2);
				dispatchSpy.mockClear();
				rerender(<StudyLenses snippet="OK" lens="debug-props" />);
				expect(dispatchSpy).toHaveBeenCalledWith('lens-switched', {
					previous: 'annotate',
					next: 'debug-props',
					source: 'prop',
				});
			} finally {
				factorySpy.mockRestore();
			}
		});

		it('mode-changed does NOT dispatch on in-mode lens switch (mode stays lens)', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { rerender } = render(
					<StudyLenses snippet="OK" lens="annotate" />,
				);
				expect(dispatchSpy).toHaveBeenCalledTimes(2);
				dispatchSpy.mockClear();
				rerender(<StudyLenses snippet="OK" lens="debug-props" />);
				expect(dispatchSpy).not.toHaveBeenCalledWith(
					'mode-changed',
					expect.anything(),
				);
			} finally {
				factorySpy.mockRestore();
			}
		});

		it('the prop-driven in-mode lens switch dispatches exactly once under React StrictMode', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { rerender } = render(
					<React.StrictMode>
						<StudyLenses snippet="OK" lens="annotate" />
					</React.StrictMode>,
				);
				expect(dispatchSpy).toHaveBeenCalledTimes(2);
				dispatchSpy.mockClear();
				rerender(
					<React.StrictMode>
						<StudyLenses snippet="OK" lens="debug-props" />
					</React.StrictMode>,
				);
				expect(dispatchSpy).toHaveBeenCalledTimes(1);
			} finally {
				factorySpy.mockRestore();
			}
		});

		it('a second consecutive in-mode switch carries the first switch target as previous', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { rerender } = render(
					<StudyLenses snippet="OK" lens="annotate" />,
				);
				rerender(<StudyLenses snippet="OK" lens="debug-props" />);
				dispatchSpy.mockClear();
				rerender(<StudyLenses snippet="OK" lens="annotate" />);
				expect(dispatchSpy).toHaveBeenCalledWith('lens-switched', {
					previous: 'debug-props',
					next: 'annotate',
					source: 'prop',
				});
			} finally {
				factorySpy.mockRestore();
			}
		});
	});
});

describe('F6 — interpreted gutter diagnostics (editor mode, cross-boundary)', () => {
	// The orchestrator derives interpretedDiagnostics from the live
	// embodiment's errors (via deriveInterpretedDiagnostics, adapter committed
	// in Inc 4) and passes them to <EditorComponent>; the editing layer's
	// positional supersede merge (Inc 5a) renders them in place of lintJej's
	// terse marker for the SAME acorn error. These tests pin the orchestrator
	// side: the derivation, the null/stale guard, and the end-to-end
	// supersede through real acorn + real lintJej (no mocks).

	it('a clean snippet produces no interpreted diagnostics (Zero)', async () => {
		// ZOMBIES anchor: kills an unconditional always-paint fake at the
		// derivation site. 'let x = 1;' is clean JEJ — no embodiment errors,
		// no lintJej markers, nothing interpreted.
		const { container } = render(<StudyLenses snippet="let x = 1;" />);
		const view = await findMountedEditorView(container);
		act(() => {
			forceLinting(view);
		});
		await waitFor(() => {
			expect(countDiagnostics(view)).toBe(0);
		});
		expect(countDiagnosticsBySource(view, 'interpreted')).toBe(0);
	});

	it('a snippet that ships broken paints exactly ONE interpreted diagnostic (supersedes the terse parse marker)', async () => {
		// 'let x = ;' is NOT a scenario keyword → the real acorn path. The
		// seed embodiment (lazy useState init) carries the parse error; the
		// derived diagnostic and lintJej's parse marker locate the SAME acorn
		// error at the SAME (line, column), so the supersede collapses them:
		// total 1, source 'interpreted', zero 'JEJ'. Kills: derivation
		// unwired (no 'interpreted' source ever appears), a hardcoded
		// position (acorn locates at the ';', not (1,0) — no collapse ⇒
		// total 2), and a broken merge (total 2).
		const { container } = render(<StudyLenses snippet="let x = ;" />);
		const view = await findMountedEditorView(container);
		act(() => {
			forceLinting(view);
		});
		await waitFor(() => {
			expect(countDiagnosticsBySource(view, 'interpreted')).toBe(1);
		});
		expect(countDiagnostics(view)).toBe(1);
		expect(countDiagnosticsBySource(view, 'JEJ')).toBe(0);
	});

	it('mid-debounce staleness: typing clean code clears the interpreted marker BEFORE the slot refreshes (the guard)', async () => {
		// In editor mode the slot may be STALE mid-debounce (it still holds
		// the previous buffer's embodiment; editor mode has no loud coherence
		// guard). The derivation guard maps a stale slot to [] rather than
		// painting the OLD embodiment's error onto the NEW buffer. Fake
		// timers freeze the 200ms debounce so the assertion provably runs
		// mid-window — on real timers the settle (which also yields no
		// errors on clean code) could mask a missing guard.
		const { container } = render(<StudyLenses snippet="let x = ;" />);
		const view = await findMountedEditorView(container);
		act(() => {
			forceLinting(view);
		});
		await waitFor(() => {
			expect(countDiagnosticsBySource(view, 'interpreted')).toBe(1);
		});

		vi.useFakeTimers();
		try {
			typeInto(view, 'let x = 1;');
			// Flush the push chain WITHOUT advancing the clock. Load-bearing
			// mechanics (AR-3): the editor's setInterpretedDiagnostics
			// (create-editor.ts) calls forceLinting INSIDE the push, and the
			// effect-dispatch arms the lint plugin via needsRefresh — so the
			// forced lint pass runs synchronously and its setDiagnostics
			// commit lands on the MICROTASK queue (batchResults), which
			// `await act(async () => {})` flushes. It does NOT ride the
			// frozen setTimeout. If a refactor ever drops forceLinting from
			// the push path, this mid-window assertion becomes unreliable —
			// fix the push path, not this test. Meanwhile the 200ms debounce
			// has NOT fired; the slot still holds the broken 'let x = ;'
			// embodiment (stale).
			await act(async () => {});
			expect(countDiagnosticsBySource(view, 'interpreted')).toBe(0);

			// Settle the debounce: the slot refreshes to the clean buffer's
			// embodiment (errors null) — still no interpreted marker.
			act(() => {
				vi.advanceTimersByTime(200);
			});
			await act(async () => {});
			expect(countDiagnosticsBySource(view, 'interpreted')).toBe(0);
		} finally {
			vi.useRealTimers();
		}
	});
});

describe('<StudyLenses> — C2 station availability + status through real embody', () => {
	describe('Boundaries — a validation refusal hides the LL stations (never bars)', () => {
		it('VALIDATION_FAIL shows only the CORE stations, realm removed from between source and parse', () => {
			const { container } = render(<StudyLenses snippet="VALIDATION_FAIL" />);
			// eslint-disable-next-line unicorn/prefer-spread -- NodeList spread fails tsc without dom.iterable
			const columns = Array.from(
				container.querySelectorAll<HTMLElement>('[data-orchestrator-station]'),
			).map((column) => column.dataset.orchestratorStation);
			expect(columns).toEqual(['source', 'parse']);
		});
	});

	describe('Boundaries — an in-machine failure keeps the LL stations shown and bars downstream', () => {
		it('FAIL_AT_PARSE keeps all five stations shown', () => {
			const { container } = render(<StudyLenses snippet="FAIL_AT_PARSE" />);
			// eslint-disable-next-line unicorn/prefer-spread -- NodeList spread fails tsc without dom.iterable
			const columns = Array.from(
				container.querySelectorAll<HTMLElement>('[data-orchestrator-station]'),
			).map((column) => column.dataset.orchestratorStation);
			expect(columns).toEqual([
				'source',
				'realm',
				'parse',
				'creation',
				'evaluation',
			]);
		});

		it('FAIL_AT_PARSE bars the creation station', () => {
			const { container } = render(<StudyLenses snippet="FAIL_AT_PARSE" />);
			expect(
				container.querySelector<HTMLElement>(
					'[data-orchestrator-station="creation"]',
				)?.dataset.orchestratorStationStatus,
			).toBe('barred');
		});

		it('FAIL_AT_PARSE bars the evaluation station', () => {
			const { container } = render(<StudyLenses snippet="FAIL_AT_PARSE" />);
			expect(
				container.querySelector<HTMLElement>(
					'[data-orchestrator-station="evaluation"]',
				)?.dataset.orchestratorStationStatus,
			).toBe('barred');
		});
	});

	describe('Interfaces — the panel tracks the debounce settle (pins the per-edit cadence)', () => {
		it('flips the parse station to errored after an edit breaks the buffer and the debounce settles', async () => {
			const { container } = render(<StudyLenses snippet="let x = 1;" />);
			const view = await findMountedEditorView(container);
			vi.useFakeTimers();
			try {
				typeInto(view, 'let x = ;');
				act(() => {
					vi.advanceTimersByTime(200);
				});
				expect(
					container.querySelector<HTMLElement>(
						'[data-orchestrator-station="parse"]',
					)?.dataset.orchestratorStationStatus,
				).toBe('errored');
			} finally {
				vi.useRealTimers();
			}
		});
	});

	describe('Boundaries — honest under stubs: clean real code stays pending (STUB-COUPLED: flips to ok when the creation slice lands; edit this test then)', () => {
		it('a clean real snippet shows all five stations', () => {
			const { container } = render(<StudyLenses snippet="let x = 1;" />);
			// eslint-disable-next-line unicorn/prefer-spread -- NodeList spread fails tsc without dom.iterable
			const columns = Array.from(
				container.querySelectorAll<HTMLElement>('[data-orchestrator-station]'),
			).map((column) => column.dataset.orchestratorStation);
			expect(columns).toEqual([
				'source',
				'realm',
				'parse',
				'creation',
				'evaluation',
			]);
		});

		it('a clean real snippet reports the creation station as pending, never ok', () => {
			const { container } = render(<StudyLenses snippet="let x = 1;" />);
			expect(
				container.querySelector<HTMLElement>(
					'[data-orchestrator-station="creation"]',
				)?.dataset.orchestratorStationStatus,
			).toBe('pending');
		});
	});
});

describe('<StudyLenses> — Cycle 3 B0 the omnipresent region landmark + dock', () => {
	describe('Zero/One — the region landmark mounts', () => {
		it('mounts a section landmark in editor mode', () => {
			const { container } = render(<StudyLenses snippet="let x = 1;" />);
			expect(
				container.querySelector('[data-orchestrator-omnipresent-region]')
					?.tagName,
			).toBe('SECTION');
		});

		it('mounts the region landmark in lens mode too', () => {
			const { container } = render(
				<StudyLenses snippet="let x = 1;" lens="debug-props" />,
			);
			expect(
				container.querySelector('[data-orchestrator-omnipresent-region]'),
			).not.toBeNull();
		});

		it('the region landmark carries a non-empty aria-label', () => {
			const { container } = render(<StudyLenses snippet="let x = 1;" />);
			expect(
				container
					.querySelector('[data-orchestrator-omnipresent-region]')
					?.getAttribute('aria-label'),
			).toBeTruthy();
		});
	});

	describe('Interface — the dock mounts inside the region', () => {
		it('renders the dock inside the region landmark', () => {
			const { container } = render(<StudyLenses snippet="let x = 1;" />);
			expect(
				container.querySelector(
					'[data-orchestrator-omnipresent-region] [data-orchestrator-dock]',
				),
			).not.toBeNull();
		});

		it('clicking the collapse affordance flips the dock collapsed state', () => {
			const { container } = render(<StudyLenses snippet="let x = 1;" />);
			fireEvent.click(
				container.querySelector('[aria-label="toggle dock controls"]')!,
			);
			expect(
				container.querySelector<HTMLElement>('[data-orchestrator-dock]')
					?.dataset.orchestratorDockCollapsed,
			).toBe('true');
		});
	});
});

describe('<StudyLenses> — Cycle 3 A1 config-seeded source type', () => {
	describe('One — initialType seeds the live slot type', () => {
		it('initialType "script" hides the language-level stations in editor mode', () => {
			const { container } = render(
				<StudyLenses
					snippet="let x = 1;"
					configs={{ orchestrator: { initialType: 'script' } }}
				/>,
			);
			const stations = Array.from(
				// eslint-disable-next-line unicorn/prefer-spread -- NodeList spread fails tsc without dom.iterable
				container.querySelectorAll<HTMLElement>('[data-orchestrator-station]'),
			).map((column) => column.dataset.orchestratorStation);
			expect(stations).toEqual(['source', 'parse']);
		});

		it('initialType "script" hides the language-level stations in lens-mode initial mount', () => {
			const { container } = render(
				<StudyLenses
					snippet="let x = 1;"
					lens="debug-props"
					configs={{ orchestrator: { initialType: 'script' } }}
				/>,
			);
			expect(
				container.querySelectorAll('[data-orchestrator-station]'),
			).toHaveLength(2);
		});

		it('initialType "script" survives a debounced re-embody after an edit', async () => {
			const { container } = render(
				<StudyLenses
					snippet="let x = 1;"
					configs={{ orchestrator: { initialType: 'script' } }}
				/>,
			);
			const view = await findMountedEditorView(container);
			vi.useFakeTimers();
			try {
				typeInto(view, 'let y = 2;');
				act(() => {
					vi.advanceTimersByTime(250);
				});
				expect(
					container.querySelectorAll('[data-orchestrator-station]'),
				).toHaveLength(2);
			} finally {
				vi.useRealTimers();
			}
		});
	});

	describe('Boundaries — config robustness (mirrors readCascadeLensEntry)', () => {
		it('an orchestrator entry without initialType defaults to module', () => {
			const { container } = render(
				<StudyLenses snippet="let x = 1;" configs={{ orchestrator: {} }} />,
			);
			expect(
				container.querySelectorAll('[data-orchestrator-station]'),
			).toHaveLength(5);
		});

		it('a configs object with no orchestrator key defaults to module', () => {
			const { container } = render(
				<StudyLenses snippet="let x = 1;" configs={{}} />,
			);
			expect(
				container.querySelectorAll('[data-orchestrator-station]'),
			).toHaveLength(5);
		});

		it('a non-object orchestrator entry falls back to module, never throws', () => {
			const { container } = render(
				<StudyLenses snippet="let x = 1;" configs={{ orchestrator: 'nope' }} />,
			);
			expect(
				container.querySelectorAll('[data-orchestrator-station]'),
			).toHaveLength(5);
		});
	});
});

describe('<StudyLenses> — Cycle 3 A2-3 the dock type toggle (re-embody + dispatch)', () => {
	describe('One — toggling re-keys the live slot', () => {
		it('toggling module→script hides the language-level stations', () => {
			const { container } = render(<StudyLenses snippet="let x = 1;" />);
			fireEvent.click(
				container.querySelector('[data-orchestrator-dock-type-toggle]')!,
			);
			expect(
				container.querySelectorAll('[data-orchestrator-station]'),
			).toHaveLength(2);
		});

		it('a toggle cancels a pending debounced re-embody (no late stale write)', async () => {
			const embodySpy = vi.spyOn(embodyModule, 'default');
			try {
				const { container } = render(<StudyLenses snippet="let x = 1;" />);
				const view = await findMountedEditorView(container);
				vi.useFakeTimers();
				try {
					typeInto(view, 'let y = 2;');
					fireEvent.click(
						container.querySelector('[data-orchestrator-dock-type-toggle]')!,
					);
					act(() => {
						vi.advanceTimersByTime(200);
					});
					expect(embodySpy).toHaveBeenCalledTimes(2);
				} finally {
					vi.useRealTimers();
				}
			} finally {
				embodySpy.mockRestore();
			}
		});
	});

	describe('Interface — the type-toggled event', () => {
		it('toggling module→script dispatches type-toggled {from: module, to: script}', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { container } = render(<StudyLenses snippet="let x = 1;" />);
				fireEvent.click(
					container.querySelector('[data-orchestrator-dock-type-toggle]')!,
				);
				expect(dispatchSpy).toHaveBeenCalledWith('type-toggled', {
					from: 'module',
					to: 'script',
				});
			} finally {
				factorySpy.mockRestore();
			}
		});

		it('toggling script→module dispatches type-toggled {from: script, to: module}', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { container } = render(
					<StudyLenses
						snippet="let x = 1;"
						configs={{ orchestrator: { initialType: 'script' } }}
					/>,
				);
				fireEvent.click(
					container.querySelector('[data-orchestrator-dock-type-toggle]')!,
				);
				expect(dispatchSpy).toHaveBeenCalledWith('type-toggled', {
					from: 'script',
					to: 'module',
				});
			} finally {
				factorySpy.mockRestore();
			}
		});
	});

	describe('Boundary — toggling from lens mode returns to editor first', () => {
		it('toggling while a lens is mounted lands back in editor mode', () => {
			const { container } = render(
				<StudyLenses snippet="let x = 1;" lens="debug-props" />,
			);
			fireEvent.click(
				container.querySelector('[data-orchestrator-dock-type-toggle]')!,
			);
			expect(
				container.querySelector('[data-orchestrator-host]'),
			).not.toBeNull();
		});

		it('toggling from lens mode dispatches mode-changed {from: lens, to: editor}', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { container } = render(
					<StudyLenses snippet="let x = 1;" lens="debug-props" />,
				);
				fireEvent.click(
					container.querySelector('[data-orchestrator-dock-type-toggle]')!,
				);
				expect(dispatchSpy).toHaveBeenCalledWith('mode-changed', {
					from: 'lens',
					to: 'editor',
				});
			} finally {
				factorySpy.mockRestore();
			}
		});

		it('dispatches mode-changed before type-toggled when toggling from lens mode', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { container } = render(
					<StudyLenses snippet="let x = 1;" lens="debug-props" />,
				);
				dispatchSpy.mockClear();
				fireEvent.click(
					container.querySelector('[data-orchestrator-dock-type-toggle]')!,
				);
				const eventNames = dispatchSpy.mock.calls.map((args) => args[0]);
				expect(eventNames).toEqual(['mode-changed', 'type-toggled']);
			} finally {
				factorySpy.mockRestore();
			}
		});
	});

	describe('Boundary — the script-mode hint', () => {
		it('toggling module-admissible code into script mode reveals the hint', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			fireEvent.click(
				container.querySelector('[data-orchestrator-dock-type-toggle]')!,
			);
			expect(
				container.querySelector('[data-orchestrator-dock-type-hint]'),
			).not.toBeNull();
		});
	});
});

describe('<StudyLenses> — Cycle 3 B1-2 the dock sandbox toggle (wire + dispatch)', () => {
	describe('One — toggling worker→danger reveals the debugger', () => {
		it('toggling the sandbox to danger reveals the debugger option', () => {
			const { container } = render(
				<StudyLenses
					snippet="let x = 1;"
					configs={{ orchestrator: { dangerAvailable: true } }}
				/>,
			);
			fireEvent.click(
				container.querySelector('[data-orchestrator-dock-sandbox-toggle]')!,
			);
			expect(
				container.querySelector('[data-orchestrator-dock-debugger]'),
			).not.toBeNull();
		});
	});

	describe('Interface — the sandbox-toggled event', () => {
		it('toggling worker→danger dispatches sandbox-toggled {from: worker, to: danger}', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { container } = render(
					<StudyLenses
						snippet="let x = 1;"
						configs={{ orchestrator: { dangerAvailable: true } }}
					/>,
				);
				fireEvent.click(
					container.querySelector('[data-orchestrator-dock-sandbox-toggle]')!,
				);
				expect(dispatchSpy).toHaveBeenCalledWith('sandbox-toggled', {
					from: 'worker',
					to: 'danger',
				});
			} finally {
				factorySpy.mockRestore();
			}
		});

		it('toggling danger→worker dispatches sandbox-toggled {from: danger, to: worker}', () => {
			const { bus, dispatchSpy } = createSpyBus();
			const factorySpy = vi
				.spyOn(eventBusModule, 'default')
				.mockReturnValue(bus);
			try {
				const { container } = render(
					<StudyLenses
						snippet="let x = 1;"
						configs={{ orchestrator: { dangerAvailable: true } }}
					/>,
				);
				// worker → danger (first flip), then clear so we assert only the second.
				fireEvent.click(
					container.querySelector('[data-orchestrator-dock-sandbox-toggle]')!,
				);
				dispatchSpy.mockClear();
				// danger → worker (second flip).
				fireEvent.click(
					container.querySelector('[data-orchestrator-dock-sandbox-toggle]')!,
				);
				expect(dispatchSpy).toHaveBeenCalledWith('sandbox-toggled', {
					from: 'danger',
					to: 'worker',
				});
			} finally {
				factorySpy.mockRestore();
			}
		});
	});

	describe('Boundary — danger unavailable hides the toggle', () => {
		it('omits the sandbox toggle when no orchestrator config is given', () => {
			const { container } = render(<StudyLenses snippet="let x = 1;" />);
			expect(
				container.querySelector('[data-orchestrator-dock-sandbox-toggle]'),
			).toBeNull();
		});
	});

	describe('Interface — the debugger toggle', () => {
		it('clicking the debugger flips its checked state and back', () => {
			const { container } = render(
				<StudyLenses
					snippet="let x = 1;"
					configs={{ orchestrator: { dangerAvailable: true } }}
				/>,
			);
			// Reveal the debugger by entering danger mode.
			fireEvent.click(
				container.querySelector('[data-orchestrator-dock-sandbox-toggle]')!,
			);
			expect(
				container.querySelector<HTMLInputElement>(
					'[data-orchestrator-dock-debugger]',
				)?.checked,
			).toBe(false);
			fireEvent.click(
				container.querySelector('[data-orchestrator-dock-debugger]')!,
			);
			expect(
				container.querySelector<HTMLInputElement>(
					'[data-orchestrator-dock-debugger]',
				)?.checked,
			).toBe(true);
			fireEvent.click(
				container.querySelector('[data-orchestrator-dock-debugger]')!,
			);
			expect(
				container.querySelector<HTMLInputElement>(
					'[data-orchestrator-dock-debugger]',
				)?.checked,
			).toBe(false);
		});
	});
});

describe('<StudyLenses> — Cycle 3 C1-C2 the dock run-limits slot (seed + update)', () => {
	describe('Zero — built-in defaults when configs absent', () => {
		it('seeds both limits from the built-in defaults', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			expect(
				container.querySelector<HTMLInputElement>(
					'[data-orchestrator-dock-limit="seconds"]',
				)?.value,
			).toBe('5');
			expect(
				container.querySelector<HTMLInputElement>(
					'[data-orchestrator-dock-limit="iterations"]',
				)?.value,
			).toBe('1000');
		});
	});

	describe('One — seeding from configs.orchestrator.runLimits', () => {
		it('seeds the seconds limit from config, iterations from the default', () => {
			const { container } = render(
				<StudyLenses
					snippet="OK"
					configs={{ orchestrator: { runLimits: { seconds: 10 } } }}
				/>,
			);
			expect(
				container.querySelector<HTMLInputElement>(
					'[data-orchestrator-dock-limit="seconds"]',
				)?.value,
			).toBe('10');
			expect(
				container.querySelector<HTMLInputElement>(
					'[data-orchestrator-dock-limit="iterations"]',
				)?.value,
			).toBe('1000');
		});
	});

	describe('Boundary — partial config fills the unset field from defaults', () => {
		it('seeds iterations from config and seconds from the default', () => {
			const { container } = render(
				<StudyLenses
					snippet="OK"
					configs={{ orchestrator: { runLimits: { iterations: 50 } } }}
				/>,
			);
			expect(
				container.querySelector<HTMLInputElement>(
					'[data-orchestrator-dock-limit="iterations"]',
				)?.value,
			).toBe('50');
			expect(
				container.querySelector<HTMLInputElement>(
					'[data-orchestrator-dock-limit="seconds"]',
				)?.value,
			).toBe('5');
		});
	});

	describe('Interface — editing updates the slot (controlled round-trip)', () => {
		it('editing the seconds limit updates it in-session and leaves iterations untouched', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			fireEvent.change(
				container.querySelector('[data-orchestrator-dock-limit="seconds"]')!,
				{ target: { value: '7' } },
			);
			expect(
				container.querySelector<HTMLInputElement>(
					'[data-orchestrator-dock-limit="seconds"]',
				)?.value,
			).toBe('7');
			expect(
				container.querySelector<HTMLInputElement>(
					'[data-orchestrator-dock-limit="iterations"]',
				)?.value,
			).toBe('1000');
		});
	});
});

describe('<StudyLenses> — Cycle 3 C4 the dock Run wiring (intercept + run-state + outcome)', () => {
	describe('Zero — idle before any run', () => {
		it('reports the idle run-state and no outcome before any run', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			expect(
				container.querySelector<HTMLElement>(
					'[data-orchestrator-dock-run-state]',
				)?.dataset.orchestratorDockRunState,
			).toBe('idle');
			expect(
				container.querySelector('[data-orchestrator-dock-outcome]'),
			).toBeNull();
		});
	});

	describe('Interface — the run-state passes through running', () => {
		it('enters the running run-state synchronously on a Run click, before the result settles', async () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			fireEvent.click(container.querySelector('[data-orchestrator-dock-run]')!);
			// The kick commits 'running' synchronously; the resolved `.result`
			// has NOT flushed yet (it sits on a microtask), so the dock shows
			// 'running' at this point — this pins setRunState('running') before
			// the await.
			expect(
				container.querySelector<HTMLElement>(
					'[data-orchestrator-dock-run-state]',
				)?.dataset.orchestratorDockRunState,
			).toBe('running');
			// Flush the settle so the run resolves on a mounted tree (no dangling
			// update / unhandled rejection).
			await act(async () => {});
		});
	});

	describe('One — a run settles with the real terminal outcome', () => {
		it('a run of EVAL_ERROR settles with the errored outcome', async () => {
			const { container } = render(<StudyLenses snippet="EVAL_ERROR" />);
			fireEvent.click(container.querySelector('[data-orchestrator-dock-run]')!);
			await act(async () => {});
			expect(
				container.querySelector<HTMLElement>(
					'[data-orchestrator-dock-run-state]',
				)?.dataset.orchestratorDockRunState,
			).toBe('settled');
			expect(
				container.querySelector<HTMLElement>('[data-orchestrator-dock-outcome]')
					?.dataset.orchestratorDockOutcome,
			).toBe('errored');
		});
	});

	describe('Many — each scenario settles with its own outcome (rendered verbatim)', () => {
		// These exercise the dock rendering the verbatim terminal outcome across
		// the union — NOT the cancel wire (that is C5; here EVAL_CANCELLED is just
		// a canned terminal outcome, reached without ever calling handle.cancel()).
		// Six of the seven EndReportOutcome members are covered (these four +
		// EVAL_ERROR above + FAIL_AT_PARSE below). 'failed' has NO canned scenario
		// — it rides EvaluateHandle.fail(), which no stub wires — so it is
		// structurally unreachable through any current integration path; the dock
		// renders it verbatim through the same null-or-value branch regardless.
		it.each([
			['EVAL_TIMEOUT', 'timed-out'],
			['EVAL_LIMIT', 'limit-exceeded'],
			['EVAL_CANCELLED', 'cancelled'],
			['OK', 'completed'],
		])('a run of %s settles with outcome %s', async (snippet, expected) => {
			const { container } = render(<StudyLenses snippet={snippet} />);
			fireEvent.click(container.querySelector('[data-orchestrator-dock-run]')!);
			await act(async () => {});
			expect(
				container.querySelector<HTMLElement>(
					'[data-orchestrator-dock-run-state]',
				)?.dataset.orchestratorDockRunState,
			).toBe('settled');
			expect(
				container.querySelector<HTMLElement>('[data-orchestrator-dock-outcome]')
					?.dataset.orchestratorDockOutcome,
			).toBe(expected);
		});
	});

	describe('Boundary — a below-parse scenario settles not-runnable verbatim', () => {
		it('a run of FAIL_AT_PARSE settles with the not-runnable outcome', async () => {
			const { container } = render(<StudyLenses snippet="FAIL_AT_PARSE" />);
			fireEvent.click(container.querySelector('[data-orchestrator-dock-run]')!);
			await act(async () => {});
			expect(
				container.querySelector<HTMLElement>('[data-orchestrator-dock-outcome]')
					?.dataset.orchestratorDockOutcome,
			).toBe('not-runnable');
		});
	});

	describe('Exception — a re-click while running is ignored (single run)', () => {
		it('ignores a Run re-click while a run is in flight (intercept fires once)', async () => {
			// The double-click guard (`if (runState === 'running') return`) leans on
			// the click handler re-binding each render: the first click commits
			// 'running', so the second click's handler sees it and bails. Prove it by
			// counting intercept() calls — a wrapped embody exposes each call. (One
			// call after two clicks confirms the render-closure guard suffices; no
			// ref shadow is needed, matching handleSandboxToggle.)
			const realEmbody = embodyModule.default;
			const interceptSpy = vi.fn();
			const embodySpy = vi
				.spyOn(embodyModule, 'default')
				.mockImplementation((code) => {
					const snippet = realEmbody(code);
					return {
						...snippet,
						evaluation: {
							...snippet.evaluation,
							events: {
								...snippet.evaluation.events,
								intercept: (options) => {
									interceptSpy();
									return snippet.evaluation.events.intercept(options);
								},
							},
						},
					};
				});
			try {
				const { container } = render(<StudyLenses snippet="OK" />);
				const run = container.querySelector('[data-orchestrator-dock-run]')!;
				fireEvent.click(run);
				fireEvent.click(run);
				await act(async () => {});
				expect(interceptSpy).toHaveBeenCalledTimes(1);
			} finally {
				embodySpy.mockRestore();
			}
		});
	});
});

describe('<StudyLenses> — Cycle 3 C5 cancel + reset-on-rerun', () => {
	describe('Interface — a second run resets the prior run channel output', () => {
		it('clears the prior run lines at the start of the next run', async () => {
			// The canned stub never drives io, so wrap intercept to push one
			// user-interface line per run via the supplied mock (synchronously — the
			// stub engine never awaits io either, so the append lands in the same
			// batch as the reset). Two runs must leave ONE line — proving handleRun
			// resets channels at run-start (not append).
			const realEmbody = embodyModule.default;
			let runCounter = 0;
			const embodySpy = vi
				.spyOn(embodyModule, 'default')
				.mockImplementation((code) => {
					const snippet = realEmbody(code);
					return {
						...snippet,
						evaluation: {
							...snippet.evaluation,
							events: {
								...snippet.evaluation.events,
								intercept: (options) => {
									runCounter += 1;
									// `void` — alert is typed void | Promise<void>; our mock is
									// sync, so discard the (non-)promise to satisfy no-floating-promises.
									void options?.io?.alert?.(`dialog ${runCounter}`);
									return snippet.evaluation.events.intercept(options);
								},
							},
						},
					};
				});
			try {
				const { container } = render(<StudyLenses snippet="OK" />);
				const run = container.querySelector('[data-orchestrator-dock-run]')!;
				fireEvent.click(run);
				await act(async () => {});
				fireEvent.click(run);
				await act(async () => {});
				const channel = container.querySelector(
					'[data-orchestrator-content-row] [data-orchestrator-output-channel="user-interface"]',
				);
				expect(channel?.childElementCount).toBe(1);
				// Pin that the SURVIVING line is run 2's (not run 1's) — kills a
				// clear-after-append fake that would leave 'dialog 1'.
				expect(channel?.children[0]?.textContent).toBe('dialog 2');
			} finally {
				embodySpy.mockRestore();
			}
		});
	});

	describe('State — a rerun re-cycles run-state and clears the prior outcome', () => {
		it('clears the prior outcome and re-enters running at the start of the next run', async () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			const run = container.querySelector('[data-orchestrator-dock-run]')!;
			fireEvent.click(run);
			await act(async () => {});
			// Run 1 settled with an outcome present.
			expect(
				container.querySelector('[data-orchestrator-dock-outcome]'),
			).not.toBeNull();
			fireEvent.click(run);
			// Run 2 in flight (synchronous, pre-flush): the prior outcome is cleared
			// and run-state is back to running — pins setOutcome(null) on the rerun.
			expect(
				container.querySelector('[data-orchestrator-dock-outcome]'),
			).toBeNull();
			expect(
				container.querySelector<HTMLElement>(
					'[data-orchestrator-dock-run-state]',
				)?.dataset.orchestratorDockRunState,
			).toBe('running');
			await act(async () => {});
			expect(
				container.querySelector<HTMLElement>(
					'[data-orchestrator-dock-run-state]',
				)?.dataset.orchestratorDockRunState,
			).toBe('settled');
		});
	});

	describe('One — Cancel reaches the held run handle', () => {
		it('clicking Cancel invokes the held handle cancel once', async () => {
			// Wrap intercept so the returned handle's cancel is a spy (the canned
			// handle's cancel is noOpCancel and the Snippet is frozen). Asserts the
			// CALL reaches the held handle — NOT that cancel caused 'cancelled' (the
			// canned outcome is 'cancelled' regardless of whether cancel runs).
			const realEmbody = embodyModule.default;
			const cancelSpy = vi.fn();
			const embodySpy = vi
				.spyOn(embodyModule, 'default')
				.mockImplementation((code) => {
					const snippet = realEmbody(code);
					return {
						...snippet,
						evaluation: {
							...snippet.evaluation,
							events: {
								...snippet.evaluation.events,
								intercept: (options) => {
									const handle = snippet.evaluation.events.intercept(options);
									return { ...handle, cancel: cancelSpy };
								},
							},
						},
					};
				});
			try {
				const { container } = render(<StudyLenses snippet="EVAL_CANCELLED" />);
				fireEvent.click(
					container.querySelector('[data-orchestrator-dock-run]')!,
				);
				// Click Cancel synchronously while the run is in flight: both clicks
				// are in the same JS task, so the `.result` microtask
				// (Promise.resolve().then) has not run — the handle is still held.
				fireEvent.click(
					container.querySelector('[aria-label="cancel the run"]')!,
				);
				expect(cancelSpy).toHaveBeenCalledTimes(1);
				await act(async () => {});
			} finally {
				embodySpy.mockRestore();
			}
		});
	});

	describe('Zero — Cancel before any run is a safe no-op', () => {
		it('clicking Cancel with no run in flight does not throw and leaves the dock idle', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			expect(() =>
				fireEvent.click(
					container.querySelector('[aria-label="cancel the run"]')!,
				),
			).not.toThrow();
			expect(
				container.querySelector<HTMLElement>(
					'[data-orchestrator-dock-run-state]',
				)?.dataset.orchestratorDockRunState,
			).toBe('idle');
		});
	});

	describe('Boundary — Cancel after a run settles is a no-op', () => {
		it('clicking Cancel after the run settles does not throw and leaves it settled', async () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			fireEvent.click(container.querySelector('[data-orchestrator-dock-run]')!);
			await act(async () => {});
			expect(() =>
				fireEvent.click(
					container.querySelector('[aria-label="cancel the run"]')!,
				),
			).not.toThrow();
			expect(
				container.querySelector<HTMLElement>(
					'[data-orchestrator-dock-run-state]',
				)?.dataset.orchestratorDockRunState,
			).toBe('settled');
		});
	});
});

describe('<StudyLenses> — Cycle 3 E2 wire the embedded guide disclosure state', () => {
	describe('Zero — the guide mounts collapsed by default', () => {
		it('mounts the guide inside the region, collapsed', () => {
			const { container } = render(<StudyLenses snippet="let x = 1;" />);
			expect(
				container.querySelector(
					'[data-orchestrator-omnipresent-region] [data-orchestrator-guide]',
				),
			).not.toBeNull();
			expect(
				container.querySelector('[data-orchestrator-guide-content]'),
			).toBeNull();
		});

		it('mounts the guide inside the region in lens mode too, collapsed', () => {
			const { container } = render(
				<StudyLenses snippet="let x = 1;" lens="debug-props" />,
			);
			expect(
				container.querySelector(
					'[data-orchestrator-omnipresent-region] [data-orchestrator-guide]',
				),
			).not.toBeNull();
			expect(
				container.querySelector('[data-orchestrator-guide-content]'),
			).toBeNull();
		});

		it('keeps exactly one region landmark after adding the guide', () => {
			const { container } = render(<StudyLenses snippet="let x = 1;" />);
			expect(
				container.querySelectorAll('[data-orchestrator-omnipresent-region]'),
			).toHaveLength(1);
		});

		it('keeps exactly one region landmark in lens mode', () => {
			const { container } = render(
				<StudyLenses snippet="let x = 1;" lens="debug-props" />,
			);
			expect(
				container.querySelectorAll('[data-orchestrator-omnipresent-region]'),
			).toHaveLength(1);
		});
	});

	describe('One — clicking the reveal affordance expands the guide', () => {
		it('clicking the reveal affordance expands the guide', () => {
			const { container } = render(<StudyLenses snippet="let x = 1;" />);
			fireEvent.click(
				container.querySelector(
					'[data-orchestrator-guide] button[aria-label]',
				)!,
			);
			expect(
				container.querySelector('[data-orchestrator-guide-content]'),
			).not.toBeNull();
		});

		it('clicking the reveal affordance expands the guide in lens mode too', () => {
			const { container } = render(
				<StudyLenses snippet="let x = 1;" lens="debug-props" />,
			);
			fireEvent.click(
				container.querySelector(
					'[data-orchestrator-guide] button[aria-label]',
				)!,
			);
			expect(
				container.querySelector('[data-orchestrator-guide-content]'),
			).not.toBeNull();
		});
	});

	describe('Many — a reveal then collapse round-trip', () => {
		// The toggle's aria-label is static across renders, so the node reference
		// survives the re-render; re-querying before each click is just defensive.
		// Editor mode only by design: `guideRevealed` + handleGuideToggle are a
		// single component-level slot + handler shared by both render branches (the
		// One block's lens-mode test already proves that branch's onToggle is
		// wired), so the bidirectional round-trip has no mode-specific path left to
		// cover.
		it('clicking the reveal affordance twice collapses the guide again', () => {
			const { container } = render(<StudyLenses snippet="let x = 1;" />);
			fireEvent.click(
				container.querySelector(
					'[data-orchestrator-guide] button[aria-label]',
				)!,
			);
			fireEvent.click(
				container.querySelector(
					'[data-orchestrator-guide] button[aria-label]',
				)!,
			);
			expect(
				container.querySelector('[data-orchestrator-guide-content]'),
			).toBeNull();
		});
	});
});

describe('<StudyLenses> — inc 4 the interactive User Interface panel (gating io)', () => {
	// The canned stub ignores io and settles `.result` immediately, so wrap intercept
	// with an ASYNC GATING fake: it calls + awaits the orchestrator's io mock for the
	// given kind BEFORE resolving `.result`, so settlement is gated until the learner
	// answers via the panel (onAnswer). This is the only way to exercise the
	// pending-interaction flow in jsdom — the real worker is not wired (embody stub),
	// so this proves the React pending/resolver/onAnswer WIRING, not the worker.
	// (Distinct from the C5 wrapper, which is SYNC + non-gating.)
	// realEmbody MUST be captured by the caller BEFORE `vi.spyOn` installs the spy
	// — otherwise this closes over the spy itself and recurses infinitely (the C5
	// precedent captures it on the line before spyOn for the same reason).
	function gatingImpl(
		realEmbody: (code: string) => Snippet,
		kind: 'alert' | 'confirm' | 'prompt',
		message: string,
		defaultValue?: string,
	): (code: string) => Snippet {
		return (code: string) => {
			const snippet = realEmbody(code);
			return {
				...snippet,
				evaluation: {
					...snippet.evaluation,
					events: {
						...snippet.evaluation.events,
						intercept: (options) => {
							const base = snippet.evaluation.events.intercept(options);
							const gated = (async () => {
								if (kind === 'confirm') await options?.io?.confirm?.(message);
								else if (kind === 'prompt')
									await options?.io?.prompt?.(message, defaultValue);
								else await options?.io?.alert?.(message);
								return base.result;
							})();
							return { ...base, result: gated };
						},
					},
				},
			};
		};
	}

	function dockRunState(container: HTMLElement): string | undefined {
		return container.querySelector<HTMLElement>(
			'[data-orchestrator-dock-run-state]',
		)?.dataset.orchestratorDockRunState;
	}

	it('confirm: the run gates on the dialog (still running), then settles when OK answers it', async () => {
		const realEmbody = embodyModule.default;
		const spy = vi
			.spyOn(embodyModule, 'default')
			.mockImplementation(gatingImpl(realEmbody, 'confirm', 'proceed?'));
		try {
			const { container } = render(<StudyLenses snippet="OK" />);
			fireEvent.click(container.querySelector('[data-orchestrator-dock-run]')!);
			await act(async () => {});
			// Gated: the confirm dialog is up and the run has NOT settled.
			expect(
				container.querySelector('[data-orchestrator-pending-dialog]'),
			).not.toBeNull();
			expect(
				container.querySelector('[data-orchestrator-pending-confirm]'),
			).not.toBeNull();
			expect(dockRunState(container)).toBe('running');
			expect(
				container.querySelector('[data-orchestrator-dock-outcome]'),
			).toBeNull();
			// Decision A: the dialog message is ALSO appended to the user-interface
			// channel log (the transcript) — not only shown in the dialog.
			expect(
				container.querySelector(
					'[data-orchestrator-output-channel="user-interface"]',
				)?.textContent,
			).toContain('proceed?');
			// Answer OK → the awaited mock resolves → the run resumes and settles.
			fireEvent.click(
				container.querySelector('[data-orchestrator-pending-confirm]')!,
			);
			await act(async () => {});
			expect(
				container.querySelector('[data-orchestrator-pending-dialog]'),
			).toBeNull();
			expect(dockRunState(container)).toBe('settled');
			expect(
				container.querySelector('[data-orchestrator-dock-outcome]'),
			).not.toBeNull();
		} finally {
			spy.mockRestore();
		}
	});

	it('alert: the run gates on the dialog, then settles when OK dismisses it', async () => {
		const realEmbody = embodyModule.default;
		const spy = vi
			.spyOn(embodyModule, 'default')
			.mockImplementation(gatingImpl(realEmbody, 'alert', 'heads up'));
		try {
			const { container } = render(<StudyLenses snippet="OK" />);
			fireEvent.click(container.querySelector('[data-orchestrator-dock-run]')!);
			await act(async () => {});
			expect(
				container.querySelector('[data-orchestrator-pending-dialog]'),
			).not.toBeNull();
			expect(dockRunState(container)).toBe('running');
			fireEvent.click(
				container.querySelector('[data-orchestrator-pending-confirm]')!,
			);
			await act(async () => {});
			expect(
				container.querySelector('[data-orchestrator-pending-dialog]'),
			).toBeNull();
			expect(dockRunState(container)).toBe('settled');
		} finally {
			spy.mockRestore();
		}
	});

	it('prompt: the dialog seeds the input; OK feeds the typed value back and settles the run', async () => {
		const realEmbody = embodyModule.default;
		const spy = vi
			.spyOn(embodyModule, 'default')
			.mockImplementation(gatingImpl(realEmbody, 'prompt', 'name?', 'seed'));
		try {
			const { container } = render(<StudyLenses snippet="OK" />);
			fireEvent.click(container.querySelector('[data-orchestrator-dock-run]')!);
			await act(async () => {});
			const input = container.querySelector<HTMLInputElement>(
				'[data-orchestrator-pending-input]',
			);
			expect(input).not.toBeNull();
			expect(input?.value).toBe('seed');
			fireEvent.change(input!, { target: { value: 'Ada' } });
			fireEvent.click(
				container.querySelector('[data-orchestrator-pending-confirm]')!,
			);
			await act(async () => {});
			expect(
				container.querySelector('[data-orchestrator-pending-dialog]'),
			).toBeNull();
			expect(dockRunState(container)).toBe('settled');
		} finally {
			spy.mockRestore();
		}
	});

	it('Cancel while a dialog is pending resolves the pending IO first, then settles (no deadlock)', async () => {
		const realEmbody = embodyModule.default;
		const spy = vi
			.spyOn(embodyModule, 'default')
			.mockImplementation(gatingImpl(realEmbody, 'confirm', 'proceed?'));
		try {
			const { container } = render(<StudyLenses snippet="OK" />);
			fireEvent.click(container.querySelector('[data-orchestrator-dock-run]')!);
			await act(async () => {});
			expect(
				container.querySelector('[data-orchestrator-pending-dialog]'),
			).not.toBeNull();
			// The dock Cancel resolves any pending IO then cancels. Under the canned
			// stub this proves NO DEADLOCK (the run settles + the dialog clears) but
			// NOT the resolve-BEFORE-cancel ORDER — the stub's cancel is a no-op that
			// settles regardless. The order (resolve must precede cancel, else a real
			// paused worker deadlocks) is proven by the browser harness, where a
			// cancel that fails to resolve the pending IO hangs `.result` forever.
			fireEvent.click(
				container.querySelector('[aria-label="cancel the run"]')!,
			);
			await act(async () => {});
			expect(
				container.querySelector('[data-orchestrator-pending-dialog]'),
			).toBeNull();
			expect(dockRunState(container)).toBe('settled');
		} finally {
			spy.mockRestore();
		}
	});

	it("confirm: the dialog's own Cancel answers false and settles the run", async () => {
		const realEmbody = embodyModule.default;
		const spy = vi
			.spyOn(embodyModule, 'default')
			.mockImplementation(gatingImpl(realEmbody, 'confirm', 'proceed?'));
		try {
			const { container } = render(<StudyLenses snippet="OK" />);
			fireEvent.click(container.querySelector('[data-orchestrator-dock-run]')!);
			await act(async () => {});
			expect(
				container.querySelector('[data-orchestrator-pending-dialog]'),
			).not.toBeNull();
			// The dialog's OWN Cancel (not the dock Cancel) → onAnswer(false) → the
			// gated confirm resolves false and the run settles, dialog cleared.
			fireEvent.click(
				container.querySelector('[data-orchestrator-pending-cancel]')!,
			);
			await act(async () => {});
			expect(
				container.querySelector('[data-orchestrator-pending-dialog]'),
			).toBeNull();
			expect(dockRunState(container)).toBe('settled');
		} finally {
			spy.mockRestore();
		}
	});

	// Exercises handleCancel's resolve-pending null-guard (the same guard onAnswer
	// relies on when idle): with nothing pending, Cancel must not throw or open a dialog.
	it('Cancel with no run in flight is a safe no-op (no throw, no dialog)', () => {
		const { container } = render(<StudyLenses snippet="OK" />);
		expect(() =>
			fireEvent.click(
				container.querySelector('[aria-label="cancel the run"]')!,
			),
		).not.toThrow();
		expect(
			container.querySelector('[data-orchestrator-pending-dialog]'),
		).toBeNull();
	});
});

describe('<StudyLenses> — inc 5 appear-on-run + per-panel dismissal', () => {
	function runOnce(container: HTMLElement): void {
		fireEvent.click(container.querySelector('[data-orchestrator-dock-run]')!);
	}

	describe('Appear on run', () => {
		it('renders NO output panels at idle (before any run)', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			expect(
				container.querySelector('[data-orchestrator-output-panels]'),
			).toBeNull();
		});

		it('renders the output panels once a run has started (and they persist after settle)', async () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			runOnce(container);
			expect(
				container.querySelector('[data-orchestrator-output-panels]'),
			).not.toBeNull();
			await act(async () => {});
			// still present after the run settles (appear-on-run, not appear-while-running)
			expect(
				container.querySelector('[data-orchestrator-output-panels]'),
			).not.toBeNull();
		});

		it('mounts the output panels in LENS mode once a run has started', async () => {
			const { container } = render(
				<StudyLenses snippet="OK" lens="debug-props" />,
			);
			expect(
				container.querySelector('[data-orchestrator-output-panels]'),
			).toBeNull();
			runOnce(container);
			expect(
				container.querySelector(
					'[data-orchestrator-content-row] [data-orchestrator-output-panels]',
				),
			).not.toBeNull();
			await act(async () => {});
			// persist after settle in the LENS branch too (the orchestrator has two
			// separate <OutputPanels> mounts — this pins the lens-mode one).
			expect(
				container.querySelector(
					'[data-orchestrator-content-row] [data-orchestrator-output-panels]',
				),
			).not.toBeNull();
		});
	});

	describe('Dismissal', () => {
		it('dismissing a channel hides that panel; the other stays', async () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			runOnce(container);
			await act(async () => {});
			const dismiss = container.querySelector(
				'[data-orchestrator-output-panel-dismiss="developer-console"]',
			);
			expect(dismiss).not.toBeNull();
			fireEvent.click(dismiss!);
			expect(
				container.querySelector(
					'[data-orchestrator-output-channel="developer-console"]',
				),
			).toBeNull();
			expect(
				container.querySelector(
					'[data-orchestrator-output-channel="user-interface"]',
				),
			).not.toBeNull();
		});

		it('dismissing the user-interface channel hides it; the developer-console stays', async () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			runOnce(container);
			await act(async () => {});
			// no dialog is pending, so the user-interface ✕ is available (not modal)
			const dismiss = container.querySelector(
				'[data-orchestrator-output-panel-dismiss="user-interface"]',
			);
			expect(dismiss).not.toBeNull();
			fireEvent.click(dismiss!);
			expect(
				container.querySelector(
					'[data-orchestrator-output-channel="user-interface"]',
				),
			).toBeNull();
			expect(
				container.querySelector(
					'[data-orchestrator-output-channel="developer-console"]',
				),
			).not.toBeNull();
		});

		it('a new Run resets dismissal and reappears the panel', async () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			runOnce(container);
			await act(async () => {});
			const dismiss = container.querySelector(
				'[data-orchestrator-output-panel-dismiss="developer-console"]',
			);
			expect(dismiss).not.toBeNull();
			fireEvent.click(dismiss!);
			expect(
				container.querySelector(
					'[data-orchestrator-output-channel="developer-console"]',
				),
			).toBeNull();
			// rerun → dismissal reset → the panel is back
			runOnce(container);
			await act(async () => {});
			expect(
				container.querySelector(
					'[data-orchestrator-output-channel="developer-console"]',
				),
			).not.toBeNull();
		});
	});
});
