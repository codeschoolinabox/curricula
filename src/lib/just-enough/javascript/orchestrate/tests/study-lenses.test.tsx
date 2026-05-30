// @vitest-environment jsdom

import { EditorView } from '@codemirror/view';
import { act, render, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

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

/**
 * Simulate a user edit by replacing the entire document via a single CM
 * dispatch, wrapped in React's `act` so the resulting setState round-trip
 * commits before the next assertion. Not equivalent to `userEvent.type`
 * (which would emit one transaction per keystroke) — the F2.4 / F2.5
 * cross-boundary tests assert cache-invalidation + embody-call count,
 * NOT per-keystroke transaction count, so single-dispatch suffices.
 */
function typeInto(view: EditorView, content: string): void {
	act(() => {
		view.dispatch({
			changes: { from: 0, to: view.state.doc.length, insert: content },
		});
	});
}

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

	describe('F2.4 — embody fires only on mode → lens transitions', () => {
		it('embody is NOT called when mounting without a lens prop', () => {
			const embodySpy = vi.spyOn(embodyModule, 'default');
			try {
				render(<StudyLenses snippet="OK" />);
				expect(embodySpy).not.toHaveBeenCalled();
			} finally {
				embodySpy.mockRestore();
			}
		});

		it('embody IS called exactly once on initial mount with a registered lens prop', () => {
			const embodySpy = vi.spyOn(embodyModule, 'default');
			try {
				render(<StudyLenses snippet="OK" lens="debug-props" />);
				expect(embodySpy).toHaveBeenCalledOnce();
				expect(embodySpy).toHaveBeenCalledWith('OK');
			} finally {
				embodySpy.mockRestore();
			}
		});

		it('embody fires ONCE total across an editor→lens→editor→lens round-trip with stable snippet (cache hit)', () => {
			// Decisive test — kills any useMemo([snippet, lens]) fake-it impl:
			// such an impl would re-fire embody on the second lens-open because
			// lens went undefined → "debug-props" (dep value change). The cache
			// slot with snippet-equality check is the only way to keep count=1
			// across the round-trip when snippet hasn't changed.
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

		it('embody is NOT re-called when typing into the editor (no mode transition)', async () => {
			const embodySpy = vi.spyOn(embodyModule, 'default');
			try {
				const { container } = render(<StudyLenses snippet="OK" />);
				const view = await findMountedEditorView(container);
				typeInto(view, 'arbitrary code, not a sentinel');
				typeInto(view, 'more arbitrary text');
				expect(embodySpy).not.toHaveBeenCalled();
			} finally {
				embodySpy.mockRestore();
			}
		});
	});

	// ─── F2.5: edit-eager cache invalidation ──────────────────────────────

	describe('F2.5 — edit invalidates the cache eagerly', () => {
		it('type-then-undo → toggle to lens re-fires embody (cache cleared eagerly on edit, not restored by undo)', async () => {
			// Decisive test for F2.5 vs F2.4-cache-hit-only (per cache contract in
			// DOCS.md § Effect topology — "Embodiment-on-edit invalidation" row):
			// Under F2.4 alone, the cache-hit check would see snippet="OK" matches
			// cache.snippet="OK" → cache hit → count stays 1.
			// Under F2.5, the first edit eagerly clears the cache; subsequent
			// "undo" edits leave cache null; toggle to lens → cache miss → embody.
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
				expect(embodySpy).toHaveBeenCalledTimes(2);
			} finally {
				embodySpy.mockRestore();
			}
		});

		it('edit + toggle re-fires embody with the new snippet (covers cache-miss path)', async () => {
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

		it('lens="debug-props" does NOT mount the editor home-base', () => {
			const { container } = render(
				<StudyLenses snippet="OK" lens="debug-props" />,
			);
			const editorHost = container.querySelector('[data-orchestrator-host]');
			expect(editorHost).toBeNull();
		});

		it('lens="parsons" (NOT registered) → editor home-base mounts (F1+B silent-drop fallback)', () => {
			const { container } = render(<StudyLenses snippet="OK" lens="parsons" />);
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
					lens="parsons"
					configs={{ lenses: { parsons: { x: 'y' } } }}
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
				expect(container.querySelector('[data-orchestrator-host]')).not.toBeNull();
				expect(container.querySelector('[data-lens]')).toBeNull();
			});

			it('mounts directly in lens mode when lens="debug-props" (registered)', () => {
				const { container } = render(
					<StudyLenses snippet="OK" lens="debug-props" />,
				);
				expect(container.querySelector('[data-lens="debug-props"]')).not.toBeNull();
				expect(container.querySelector('[data-orchestrator-host]')).toBeNull();
			});

			it('mounts in editor mode when lens="not-registered" (silent-drop fallback)', () => {
				const { container } = render(
					<StudyLenses snippet="OK" lens="not-registered" />,
				);
				expect(container.querySelector('[data-orchestrator-host]')).not.toBeNull();
				expect(container.querySelector('[data-lens]')).toBeNull();
			});
		});

		describe('Many — mode transitions on prop change', () => {
			it('transitions editor → lens when lens prop changes from unset to "debug-props"', () => {
				const { container, rerender } = render(<StudyLenses snippet="OK" />);
				expect(container.querySelector('[data-orchestrator-host]')).not.toBeNull();
				expect(container.querySelector('[data-lens]')).toBeNull();

				rerender(<StudyLenses snippet="OK" lens="debug-props" />);

				expect(container.querySelector('[data-lens="debug-props"]')).not.toBeNull();
				expect(container.querySelector('[data-orchestrator-host]')).toBeNull();
			});

			it('transitions lens → editor when lens prop changes from "debug-props" to unset', () => {
				const { container, rerender } = render(
					<StudyLenses snippet="OK" lens="debug-props" />,
				);
				expect(container.querySelector('[data-lens="debug-props"]')).not.toBeNull();

				rerender(<StudyLenses snippet="OK" />);

				expect(container.querySelector('[data-orchestrator-host]')).not.toBeNull();
				expect(container.querySelector('[data-lens]')).toBeNull();
			});

			it('transitions lens → editor when lens prop changes to an unregistered key', () => {
				const { container, rerender } = render(
					<StudyLenses snippet="OK" lens="debug-props" />,
				);
				expect(container.querySelector('[data-lens="debug-props"]')).not.toBeNull();

				rerender(<StudyLenses snippet="OK" lens="not-registered" />);

				expect(container.querySelector('[data-orchestrator-host]')).not.toBeNull();
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

function createSpyBus(): { bus: EventBus; dispatchSpy: ReturnType<typeof vi.fn> } {
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
});
