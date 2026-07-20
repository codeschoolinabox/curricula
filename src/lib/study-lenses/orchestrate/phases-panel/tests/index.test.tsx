// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import PhasesPanel from '../index.jsx';
import type { PhaseEntry } from '../types.js';

afterEach(cleanup);

function fivePhases(): ReadonlyArray<PhaseEntry> {
	return [
		{
			accessible: true,
			label: 'Source',
			lenses: ['annotate', 'blanks'],
			name: 'source',
		},
		{
			accessible: true,
			label: 'Tokens · spelling',
			lenses: [],
			name: 'tokens',
		},
		{ accessible: true, label: 'AST · grammar', lenses: ['quiz'], name: 'ast' },
		{
			accessible: true,
			label: 'Environment · names',
			lenses: [],
			name: 'environment',
		},
		{
			accessible: true,
			label: 'Evaluation · run',
			lenses: ['run'],
			name: 'evaluation',
		},
	];
}

function barredTail(): ReadonlyArray<PhaseEntry> {
	return [
		{ accessible: true, label: 'Source', lenses: ['annotate'], name: 'source' },
		{
			accessible: true,
			label: 'Tokens · spelling',
			lenses: [],
			name: 'tokens',
		},
		{
			accessible: false,
			cause: 'Unexpected token (1:4)',
			label: 'AST · grammar',
			name: 'ast',
		},
		{
			accessible: false,
			cause: 'Unexpected token (1:4)',
			label: 'Environment · names',
			name: 'environment',
		},
		{
			accessible: false,
			cause: 'Unexpected token (1:4)',
			label: 'Evaluation · run',
			name: 'evaluation',
		},
	];
}

function mountPanel(
	phases: ReadonlyArray<PhaseEntry>,
	overrides: Partial<React.ComponentProps<typeof PhasesPanel>> = {},
): HTMLElement {
	const { container } = render(
		<React.StrictMode>
			<PhasesPanel
				onCloseLens={vi.fn()}
				onOpenLens={vi.fn()}
				openLensName={null}
				phases={phases}
				{...overrides}
			/>
		</React.StrictMode>,
	);
	return container;
}

describe('PhasesPanel', () => {
	describe('the strip (Zero)', () => {
		it('renders the strip root with its data attribute', () => {
			const container = mountPanel(fivePhases());
			expect(container.querySelector('[data-phases-panel]')).not.toBeNull();
		});

		it('renders one entry per phase in the given order', () => {
			const container = mountPanel(fivePhases());
			const names = Array.from(
				container.querySelectorAll<HTMLElement>('[data-phase]'),
				(entry) => entry.dataset['phase'],
			);
			expect(names).toEqual([
				'source',
				'tokens',
				'ast',
				'environment',
				'evaluation',
			]);
		});

		it('shows each display label as inline text', () => {
			const container = mountPanel(fivePhases());
			const texts = Array.from(
				container.querySelectorAll<HTMLElement>('[data-phase]'),
				(entry) => entry.textContent ?? '',
			);
			expect(
				[
					'Source',
					'Tokens · spelling',
					'AST · grammar',
					'Environment · names',
					'Evaluation · run',
				].map((label, index) => texts[index]?.includes(label)),
			).toEqual([true, true, true, true, true]);
		});

		it('renders no heading elements', () => {
			const container = mountPanel(fivePhases());
			expect(
				container.querySelector(
					'[data-phases-panel] h1, [data-phases-panel] h2, [data-phases-panel] h3, [data-phases-panel] h4, [data-phases-panel] h5, [data-phases-panel] h6',
				),
			).toBeNull();
		});
	});

	describe('an accessible phase (One / Many)', () => {
		it('renders a select of the lens names headed by the none entry', () => {
			const container = mountPanel(fivePhases());
			const options = Array.from(
				container.querySelectorAll<HTMLOptionElement>(
					'[data-phase="source"] option',
				),
				(option) => option.value,
			);
			expect(options).toEqual(['', 'annotate', 'blanks']);
		});

		it('anchors each lens option by its data attribute', () => {
			const container = mountPanel(fivePhases());
			expect(
				container.querySelector(
					'[data-phase="source"] option[data-phase-lens="blanks"]',
				),
			).not.toBeNull();
		});

		it('disables a zero-lens select, present-but-empty', () => {
			const container = mountPanel(fivePhases());
			const select = container.querySelector<HTMLSelectElement>(
				'[data-phase="tokens"] select',
			);
			expect([select?.disabled, select?.options.length]).toEqual([true, 1]);
		});
	});

	describe('a barred phase (Boundaries)', () => {
		it('marks the entry barred', () => {
			const container = mountPanel(barredTail());
			const barred = Array.from(
				container.querySelectorAll<HTMLElement>('[data-phase-barred]'),
				(entry) => entry.dataset['phase'],
			);
			expect(barred).toEqual(['ast', 'environment', 'evaluation']);
		});

		it('disables the barred select and shows the cause as its only entry', () => {
			const container = mountPanel(barredTail());
			const select = container.querySelector<HTMLSelectElement>(
				'[data-phase="ast"] [data-phase-cause]',
			);
			expect([
				select?.disabled,
				select?.options.length,
				select?.textContent?.includes('Unexpected token (1:4)'),
			]).toEqual([true, 1, true]);
		});

		it('carries the cause as the native tooltip', () => {
			const container = mountPanel(barredTail());
			expect(
				container
					.querySelector('[data-phase="ast"] [data-phase-cause]')
					?.getAttribute('title'),
			).toBe('Unexpected token (1:4)');
		});

		it('exposes the barred cause to assistive tech via an aria-label', () => {
			const container = mountPanel(barredTail());
			const ariaLabel = container
				.querySelector('[data-phase="ast"] [data-phase-cause]')
				?.getAttribute('aria-label');
			expect([
				ariaLabel?.includes('AST · grammar'),
				ariaLabel?.includes('Unexpected token (1:4)'),
			]).toEqual([true, true]);
		});

		it('offers no lens options on a barred phase', () => {
			const container = mountPanel(barredTail());
			expect(
				container.querySelector('[data-phase-barred] option[data-phase-lens]'),
			).toBeNull();
		});
	});

	describe('the open lens signal (Interfaces)', () => {
		it('tracks the given open lens as the select value', () => {
			const container = mountPanel(fivePhases(), { openLensName: 'blanks' });
			expect(
				container.querySelector<HTMLSelectElement>(
					'[data-phase="source"] select',
				)?.value,
			).toBe('blanks');
		});

		it('rests at the none entry when nothing is open', () => {
			const container = mountPanel(fivePhases());
			expect(
				container.querySelector<HTMLSelectElement>(
					'[data-phase="source"] select',
				)?.value,
			).toBe('');
		});

		it('rests when the open lens belongs to another phase', () => {
			const container = mountPanel(fivePhases(), { openLensName: 'quiz' });
			expect(
				container.querySelector<HTMLSelectElement>(
					'[data-phase="source"] select',
				)?.value,
			).toBe('');
		});
	});

	describe('the intents (Interfaces)', () => {
		it('raises the open intent with the phase and lens names', () => {
			const onOpenLens = vi.fn();
			const container = mountPanel(fivePhases(), { onOpenLens });
			const select = container.querySelector<HTMLSelectElement>(
				'[data-phase="ast"] select',
			);
			if (!select) throw new Error('missing the ast select');
			fireEvent.change(select, { target: { value: 'quiz' } });
			expect(onOpenLens.mock.calls).toEqual([[{ lens: 'quiz', phase: 'ast' }]]);
		});

		it('raises the close intent when the none entry is chosen over the open lens', () => {
			const onCloseLens = vi.fn();
			const container = mountPanel(fivePhases(), {
				onCloseLens,
				openLensName: 'quiz',
			});
			const select = container.querySelector<HTMLSelectElement>(
				'[data-phase="ast"] select',
			);
			if (!select) throw new Error('missing the ast select');
			fireEvent.change(select, { target: { value: '' } });
			expect(onCloseLens).toHaveBeenCalledTimes(1);
		});

		it('raises no open intent on the close selection', () => {
			const onOpenLens = vi.fn();
			const container = mountPanel(fivePhases(), {
				onOpenLens,
				openLensName: 'quiz',
			});
			const select = container.querySelector<HTMLSelectElement>(
				'[data-phase="ast"] select',
			);
			if (!select) throw new Error('missing the ast select');
			fireEvent.change(select, { target: { value: '' } });
			expect(onOpenLens).not.toHaveBeenCalled();
		});
	});
});
