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
			const { container } = render(
				<StudyLenses snippet="FAIL_AT_PARSE" />,
			);
			const root = container.querySelector('[data-orchestrator-root]');
			expect(root).not.toBeNull();
		});
	});

	describe('Exceptions — config supplied with no resolvable default', () => {
		it('throws at mount when config is set, lens is unset, and configs has no default key', () => {
			expect(() =>
				render(<StudyLenses snippet="OK" config={{}} />),
			).toThrow(/`config` requires a resolved default lens/);
		});
	});

	describe('Exceptions — embody throws on unknown sentinel', () => {
		it('propagates the embody throw — secondary confirmation that orchestrator calls embody(snippet)', () => {
			expect(() =>
				render(<StudyLenses snippet="not_a_real_sentinel" />),
			).toThrow(/Unknown embody mock scenario/);
		});
	});
});
