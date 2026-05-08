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

	describe('Exceptions — config supplied with no resolvable default', () => {
		it('throws at mount when config is set, lens is unset, and configs has no default key', () => {
			expect(() => render(<StudyLenses snippet="OK" config={{}} />)).toThrow(
				/`config` requires a resolved default lens/,
			);
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

		it('config + configs deep-merge per the resolution chain (configs[lens] then config wins)', () => {
			const { container } = render(
				<StudyLenses
					snippet="OK"
					lens="debug-props"
					config={{ a: '1' }}
					configs={{ 'debug-props': { b: '2' } }}
				/>,
			);
			const configPanel = container.querySelector(
				'[data-debug-panel="config"] pre',
			);
			expect(JSON.parse(configPanel!.textContent ?? 'null')).toEqual({
				a: '1',
				b: '2',
			});
		});

		it('per-fence config overrides cascade configs[lens] for the same key', () => {
			const { container } = render(
				<StudyLenses
					snippet="OK"
					lens="debug-props"
					config={{ shared: 'fence-wins' }}
					configs={{ 'debug-props': { shared: 'cascade-base' } }}
				/>,
			);
			const configPanel = container.querySelector(
				'[data-debug-panel="config"] pre',
			);
			expect(JSON.parse(configPanel!.textContent ?? 'null')).toEqual({
				shared: 'fence-wins',
			});
		});

		it('configs[lens] applies when config is absent (tier-1 cascade without tier-2 override)', () => {
			const { container } = render(
				<StudyLenses
					snippet="OK"
					lens="debug-props"
					configs={{ 'debug-props': { tier: 'one' } }}
				/>,
			);
			const configPanel = container.querySelector(
				'[data-debug-panel="config"] pre',
			);
			expect(JSON.parse(configPanel!.textContent ?? 'null')).toEqual({
				tier: 'one',
			});
		});

		it('unregistered lens with config does not throw and mounts editor (silent-drop documented in README)', () => {
			expect(() =>
				render(
					<StudyLenses snippet="OK" lens="parsons" config={{ x: 'y' }} />,
				),
			).not.toThrow();
		});
	});
});
