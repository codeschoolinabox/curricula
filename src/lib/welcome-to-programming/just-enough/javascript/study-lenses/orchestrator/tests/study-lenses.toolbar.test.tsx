/**
 * @file Toolbar contract for `<StudyLenses>` (Increment 9 TDD-1).
 *
 * ZOMBIES order:
 *   Zero  — toolbar's lens-picker `<select>` is present in the DOM.
 *   One   — exactly one `<option>` per registered lens, in registration order.
 *   Many  — `value` attribute matches state.activeLens after first mount.
 *   Bound — lang≠js path renders no toolbar (existing fallback unchanged).
 *   Iface — outer wrapper `[data-orchestrator-root]` exists and contains
 *           both the toolbar `<nav>` and the lens host as children.
 *   Iface — existing `[data-orchestrator="study-lenses"]` selector still
 *           resolves to the lens host (no Inc-8 test regression).
 *
 * @vitest-environment jsdom
 */

import { act, render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import StudyLenses from '../study-lenses.js';

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
});
