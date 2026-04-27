/**
 * @file Toolbar contract for `<StudyLenses>` (Increment 9 TDD-1, TDD-2).
 *
 * ZOMBIES order — TDD-1 (toolbar render):
 *   Zero  — toolbar's lens-picker `<select>` is present in the DOM.
 *   One   — exactly one `<option>` per registered lens, in registration order.
 *   Many  — `value` attribute matches state.activeLens after first mount.
 *   Bound — lang≠js path renders no toolbar (existing fallback unchanged).
 *   Iface — outer wrapper `[data-orchestrator-root]` exists and contains
 *           both the toolbar `<nav>` and the lens host as children.
 *   Iface — existing `[data-orchestrator="study-lenses"]` selector still
 *           resolves to the lens host (no Inc-8 test regression).
 *
 * ZOMBIES order — TDD-2 (selection wires state + dispatch):
 *   Iface — initial mount does not dispatch lens-switched (suppression
 *           via previous-lens ref).
 *   Zero  — selecting the currently-active lens is a no-op (no dispatch,
 *           no DOM swap).
 *   One   — selecting a different lens dispatches lens-switched with
 *           { previous, next }.
 *   Many  — DOM swap: after change, host.firstElementChild is the new
 *           lens stub.
 *   Bound — round-trip editor → highlight → editor produces TWO dispatches
 *           with correctly-chained previous values.
 *
 * @vitest-environment jsdom
 */

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(function tearDown() {
	cleanup();
});

import StudyLenses from '../study-lenses.js';

// Spy on EventBus.dispatch by wrapping the real factory. Mirrors the
// hoisted-mock pattern in study-lenses.async-cancel.test.tsx (Pitfall #12).
const dispatchSpy = vi.hoisted(function makeDispatchSpy() {
	return vi.fn();
});

vi.mock('../../create-event-bus.js', async function mockEventBus() {
	const original = await vi.importActual<
		typeof import('../../create-event-bus.js')
	>('../../create-event-bus.js');
	return {
		default: function createSpyBus() {
			const realBus = original.default();
			return {
				...realBus,
				dispatch: dispatchSpy,
			};
		},
	};
});

describe('<StudyLenses> Toolbar (Increment 9 TDD-1)', () => {
	describe('Zero — lens-picker select is present', () => {
		it('renders a `<select data-orchestrator-lens-picker>` in the DOM', async () => {
			const { container } = render(
				<StudyLenses code="x;" lens="editor" lang="js" />,
			);
			await act(async function flush() {});
			const picker = container.querySelector(
				'[data-orchestrator-lens-picker]',
			);
			expect(picker).not.toBeNull();
			expect(picker?.tagName).toBe('SELECT');
		});
	});

	describe('One — lens options enumerate the registry', () => {
		it('contains one option per registered lens, in registration order', async () => {
			const { container } = render(
				<StudyLenses code="x;" lens="editor" lang="js" />,
			);
			await act(async function flush() {});
			const options = [
				...container.querySelectorAll<HTMLOptionElement>(
					'[data-orchestrator-lens-picker] > option',
				),
			];
			const names = options.map(function getValue(option) {
				return option.value;
			});
			expect(names).toEqual(['editor', 'highlight']);
		});
	});

	describe('Many — current value reflects state.activeLens', () => {
		it('select.value matches the resolved active lens after first mount', async () => {
			const { container } = render(
				<StudyLenses code="x;" lens="editor" lang="js" />,
			);
			await act(async function flush() {});
			const picker = container.querySelector<HTMLSelectElement>(
				'[data-orchestrator-lens-picker]',
			);
			expect(picker?.value).toBe('editor');
		});
	});

	describe('Boundary — lang≠js renders no toolbar', () => {
		it('non-js fence falls back to banner + raw <pre>, no lens-picker', async () => {
			const { container } = render(
				<StudyLenses code="print('hi')" lens="editor" lang="py" />,
			);
			await act(async function flush() {});
			const picker = container.querySelector(
				'[data-orchestrator-lens-picker]',
			);
			expect(picker).toBeNull();
			const root = container.querySelector('[data-orchestrator-root]');
			expect(root).toBeNull();
		});
	});

	describe('Interface — outer wrapper structure', () => {
		it('[data-orchestrator-root] contains both the toolbar and the lens host', async () => {
			const { container } = render(
				<StudyLenses code="x;" lens="editor" lang="js" />,
			);
			await act(async function flush() {});
			const root = container.querySelector('[data-orchestrator-root]');
			expect(root).not.toBeNull();
			const toolbar = root?.querySelector('[data-orchestrator-toolbar]');
			expect(toolbar).not.toBeNull();
			const host = root?.querySelector('[data-orchestrator="study-lenses"]');
			expect(host).not.toBeNull();
		});
	});

	describe('Interface — Inc-8 lens-host selector preserved', () => {
		it('[data-orchestrator="study-lenses"] still resolves to the lens host (containing the editor stub)', async () => {
			const { container } = render(
				<StudyLenses code="let x = 42;" lens="editor" lang="js" />,
			);
			await act(async function flush() {});
			const host = container.querySelector(
				'[data-orchestrator="study-lenses"]',
			);
			expect(host).not.toBeNull();
			const stub = host?.querySelector<HTMLTextAreaElement>(
				'[data-lens="editor-stub"]',
			);
			expect(stub).not.toBeNull();
			expect(stub?.value).toBe('let x = 42;');
		});
	});

	describe('Interface — initial mount does not dispatch lens-switched', () => {
		it('renders without firing any lens-switched event on first commit', async () => {
			dispatchSpy.mockClear();
			render(<StudyLenses code="x;" lens="editor" lang="js" />);
			await act(async function flush() {});
			const switchedCalls = dispatchSpy.mock.calls.filter(
				function isLensSwitched(call) {
					return call[0] === 'lens-switched';
				},
			);
			expect(switchedCalls).toEqual([]);
		});
	});

	describe('Zero — selecting the active lens is a no-op', () => {
		it('does not dispatch lens-switched when value does not change', async () => {
			dispatchSpy.mockClear();
			render(<StudyLenses code="x;" lens="editor" lang="js" />);
			await act(async function flush() {});
			const picker = screen.getByRole('combobox', { name: 'Lens' });
			act(function selectSame() {
				fireEvent.change(picker, { target: { value: 'editor' } });
			});
			await act(async function flush() {});
			const switchedCalls = dispatchSpy.mock.calls.filter(
				function isLensSwitched(call) {
					return call[0] === 'lens-switched';
				},
			);
			expect(switchedCalls).toEqual([]);
		});
	});

	describe('One — selecting a different lens dispatches lens-switched', () => {
		it('fires lens-switched with the correct { previous, next } payload', async () => {
			dispatchSpy.mockClear();
			render(<StudyLenses code="x;" lens="editor" lang="js" />);
			await act(async function flush() {});
			const picker = screen.getByRole('combobox', { name: 'Lens' });
			act(function selectHighlight() {
				fireEvent.change(picker, { target: { value: 'highlight' } });
			});
			await act(async function flush() {});
			const switchedCalls = dispatchSpy.mock.calls.filter(
				function isLensSwitched(call) {
					return call[0] === 'lens-switched';
				},
			);
			expect(switchedCalls).toHaveLength(1);
			expect(switchedCalls[0]?.[1]).toEqual({
				previous: 'editor',
				next: 'highlight',
			});
		});
	});

	describe('Many — DOM swap on selection', () => {
		it('replaces editor textarea with highlight stub when selection changes', async () => {
			const { container } = render(
				<StudyLenses code="x;" lens="editor" lang="js" />,
			);
			await act(async function flush() {});
			const picker = screen.getByRole('combobox', { name: 'Lens' });
			act(function selectHighlight() {
				fireEvent.change(picker, { target: { value: 'highlight' } });
			});
			await act(async function flush() {});
			const host = container.querySelector(
				'[data-orchestrator="study-lenses"]',
			);
			const first = host?.firstElementChild as HTMLElement | null;
			expect(first?.tagName).toBe('PRE');
			expect(first?.dataset.lens).toBe('highlight-stub');
		});
	});

	describe('Boundary — round-trip switch produces chained dispatches', () => {
		it('editor → highlight → editor fires two lens-switched events with correct previous chain', async () => {
			dispatchSpy.mockClear();
			render(<StudyLenses code="x;" lens="editor" lang="js" />);
			await act(async function flush() {});
			const picker = screen.getByRole('combobox', { name: 'Lens' });
			act(function toHighlight() {
				fireEvent.change(picker, { target: { value: 'highlight' } });
			});
			await act(async function flush() {});
			act(function backToEditor() {
				fireEvent.change(picker, { target: { value: 'editor' } });
			});
			await act(async function flush() {});
			const switchedCalls = dispatchSpy.mock.calls.filter(
				function isLensSwitched(call) {
					return call[0] === 'lens-switched';
				},
			);
			expect(switchedCalls).toHaveLength(2);
			expect(switchedCalls[0]?.[1]).toEqual({
				previous: 'editor',
				next: 'highlight',
			});
			expect(switchedCalls[1]?.[1]).toEqual({
				previous: 'highlight',
				next: 'editor',
			});
		});
	});
});
