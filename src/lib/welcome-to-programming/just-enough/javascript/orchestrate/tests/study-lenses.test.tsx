// @vitest-environment jsdom

import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import * as embodyModule from '../../embody/index.js';
import StudyLenses from '../index.js';

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

		it('the host element is a <textarea>', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			const host = container.querySelector('[data-orchestrator-host]');
			expect(host?.tagName).toBe('TEXTAREA');
		});

		it('the textarea value reflects the snippet prop on initial mount', () => {
			const { container } = render(<StudyLenses snippet="OK" />);
			const host = container.querySelector<HTMLTextAreaElement>(
				'[data-orchestrator-host]',
			);
			expect(host?.value).toBe('OK');
		});

		it('re-renders the textarea value when the snippet prop changes (defeats hardcoding)', () => {
			const { container, rerender } = render(<StudyLenses snippet="OK" />);
			rerender(<StudyLenses snippet="FAIL_AT_TOKENIZE" />);
			const host = container.querySelector<HTMLTextAreaElement>(
				'[data-orchestrator-host]',
			);
			expect(host?.value).toBe('FAIL_AT_TOKENIZE');
		});
	});

	describe('One — snippet flows into embody', () => {
		it('calls embody with the exact snippet prop and re-fires on prop change (F1.B chain wiring)', () => {
			const embodySpy = vi.spyOn(embodyModule, 'default');
			try {
				const { rerender } = render(<StudyLenses snippet="OK" />);
				expect(embodySpy).toHaveBeenLastCalledWith('OK');
				rerender(<StudyLenses snippet="FAIL_AT_TOKENIZE" />);
				expect(embodySpy).toHaveBeenLastCalledWith('FAIL_AT_TOKENIZE');
				expect(embodySpy.mock.calls.length).toBeGreaterThanOrEqual(2);
			} finally {
				embodySpy.mockRestore();
			}
		});
	});

	describe('Many — non-success embody scenario', () => {
		it('mounts without throwing for "FAIL_AT_PARSE" — F1 has no error UI', () => {
			const { container } = render(<StudyLenses snippet="FAIL_AT_PARSE" />);
			const root = container.querySelector('[data-orchestrator-root]');
			expect(root).not.toBeNull();
		});
	});

	describe('Exceptions — embody throws on unknown sentinel', () => {
		it('propagates the embody throw — secondary confirmation that orchestrator calls embody(snippet)', () => {
			expect(() =>
				render(<StudyLenses snippet="not_a_real_sentinel" />),
			).toThrow(/Unknown embody mock scenario/);
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
			// orchestrate StudyLensesProps.configs structurally requires
			// just `lenses?` — TypeScript's exactOptionalPropertyTypes
			// makes the declared shape strict; we cast to inject the
			// L2-future seam key for the falsification test.
			const contradicting = {
				lenses: { 'debug-props': { onlySource: 'lenses-entry' } },
				defaults: { 'debug-props': { onlySource: 'WRONG-from-defaults' } },
			} as unknown as NonNullable<
				React.ComponentProps<typeof StudyLenses>['configs']
			>;
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
});
