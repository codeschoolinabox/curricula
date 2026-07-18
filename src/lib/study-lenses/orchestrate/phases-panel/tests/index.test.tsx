// @vitest-environment jsdom
// cspell:ignore affordances

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import PhasesPanel from '../index.jsx';

afterEach(cleanup);

function phaseNames(container: HTMLElement): (string | undefined)[] {
	return Array.from(
		container.querySelectorAll<HTMLElement>('[data-phase]'),
		(section) => section.dataset.phase,
	);
}

describe('PhasesPanel', () => {
	describe('five accessible phases with no lenses (Zero)', () => {
		it('renders one section per entry, in the given order', () => {
			const { container } = render(
				<React.StrictMode>
					<PhasesPanel
						onOpenLens={vi.fn()}
						phases={[
							{
								accessible: true,
								label: 'Evaluation · run',
								lenses: [],
								name: 'evaluation',
							},
							{ accessible: true, label: 'Source', lenses: [], name: 'source' },
							{
								accessible: true,
								label: 'Environment · names',
								lenses: [],
								name: 'environment',
							},
							{
								accessible: true,
								label: 'AST · grammar',
								lenses: [],
								name: 'ast',
							},
							{
								accessible: true,
								label: 'Tokens · spelling',
								lenses: [],
								name: 'tokens',
							},
						]}
					/>
				</React.StrictMode>,
			);
			expect(phaseNames(container)).toEqual([
				'evaluation',
				'source',
				'environment',
				'ast',
				'tokens',
			]);
		});

		it('renders the panel root with its data attribute', () => {
			const { container } = render(
				<React.StrictMode>
					<PhasesPanel
						onOpenLens={vi.fn()}
						phases={[
							{ accessible: true, label: 'Source', lenses: [], name: 'source' },
						]}
					/>
				</React.StrictMode>,
			);
			expect(container.querySelector('[data-phases-panel]')).not.toBeNull();
		});
	});

	describe('one lens on an accessible phase (One)', () => {
		it('renders the lens affordance under its phase', () => {
			const { container } = render(
				<React.StrictMode>
					<PhasesPanel
						onOpenLens={vi.fn()}
						phases={[
							{
								accessible: true,
								label: 'Source',
								lenses: ['annotate'],
								name: 'source',
							},
						]}
					/>
				</React.StrictMode>,
			);
			expect(
				container.querySelector(
					'[data-phase="source"] [data-phase-lens="annotate"]',
				),
			).not.toBeNull();
		});
	});

	describe('three lenses on one phase (Many)', () => {
		it('renders the affordances in the given order', () => {
			const { container } = render(
				<React.StrictMode>
					<PhasesPanel
						onOpenLens={vi.fn()}
						phases={[
							{
								accessible: true,
								label: 'Source',
								lenses: ['annotate', 'blanks', 'quiz'],
								name: 'source',
							},
						]}
					/>
				</React.StrictMode>,
			);
			const lenses = Array.from(
				container.querySelectorAll<HTMLElement>('[data-phase-lens]'),
				(affordance) => affordance.dataset.phaseLens,
			);
			expect(lenses).toEqual(['annotate', 'blanks', 'quiz']);
		});
	});

	describe('a mixed accessible-and-barred list (Many)', () => {
		it('preserves the given order across both arms', () => {
			const { container } = render(
				<React.StrictMode>
					<PhasesPanel
						onOpenLens={vi.fn()}
						phases={[
							{
								accessible: false,
								cause: 'unexpected token',
								label: 'AST · grammar',
								name: 'ast',
							},
							{ accessible: true, label: 'Source', lenses: [], name: 'source' },
							{
								accessible: false,
								cause: 'unexpected token',
								label: 'Evaluation · run',
								name: 'evaluation',
							},
						]}
					/>
				</React.StrictMode>,
			);
			expect(phaseNames(container)).toEqual(['ast', 'source', 'evaluation']);
		});
	});

	describe('a barred phase (Boundaries)', () => {
		it('marks the section barred', () => {
			const { container } = render(
				<React.StrictMode>
					<PhasesPanel
						onOpenLens={vi.fn()}
						phases={[
							{
								accessible: false,
								cause: 'unexpected token at line 1',
								label: 'AST · grammar',
								name: 'ast',
							},
						]}
					/>
				</React.StrictMode>,
			);
			expect(
				container.querySelector('[data-phase="ast"][data-phase-barred]'),
			).not.toBeNull();
		});

		it('shows the cause as display copy', () => {
			const { container } = render(
				<React.StrictMode>
					<PhasesPanel
						onOpenLens={vi.fn()}
						phases={[
							{
								accessible: false,
								cause: 'unexpected token at line 1',
								label: 'AST · grammar',
								name: 'ast',
							},
						]}
					/>
				</React.StrictMode>,
			);
			expect(container.querySelector('[data-phase-cause]')?.textContent).toBe(
				'unexpected token at line 1',
			);
		});

		it('renders no lens affordances', () => {
			const { container } = render(
				<React.StrictMode>
					<PhasesPanel
						onOpenLens={vi.fn()}
						phases={[
							{
								accessible: false,
								cause: 'unexpected token at line 1',
								label: 'AST · grammar',
								name: 'ast',
							},
						]}
					/>
				</React.StrictMode>,
			);
			expect(container.querySelector('[data-phase-lens]')).toBeNull();
		});
	});

	describe('a zero-lens accessible phase (Boundaries)', () => {
		it('renders present-but-empty, never barred', () => {
			const { container } = render(
				<React.StrictMode>
					<PhasesPanel
						onOpenLens={vi.fn()}
						phases={[
							{
								accessible: true,
								label: 'Environment · names',
								lenses: [],
								name: 'environment',
							},
						]}
					/>
				</React.StrictMode>,
			);
			expect(
				container.querySelector(
					'[data-phase="environment"]:not([data-phase-barred])',
				),
			).not.toBeNull();
		});
	});

	describe('the open-lens intent (Interfaces)', () => {
		it('reports the clicked non-first affordance', () => {
			const onOpenLens = vi.fn();
			const { container } = render(
				<React.StrictMode>
					<PhasesPanel
						onOpenLens={onOpenLens}
						phases={[
							{
								accessible: true,
								label: 'Source',
								lenses: ['annotate', 'blanks', 'quiz'],
								name: 'source',
							},
						]}
					/>
				</React.StrictMode>,
			);
			const blanks = container.querySelector<HTMLElement>(
				'[data-phase="source"] [data-phase-lens="blanks"]',
			);
			if (!blanks) throw new Error('missing the blanks affordance');
			fireEvent.click(blanks);
			expect(onOpenLens.mock.calls).toEqual([
				[{ lens: 'blanks', phase: 'source' }],
			]);
		});

		it('reports the clicked phase for a lens name shared across phases', () => {
			const onOpenLens = vi.fn();
			const { container } = render(
				<React.StrictMode>
					<PhasesPanel
						onOpenLens={onOpenLens}
						phases={[
							{
								accessible: true,
								label: 'Source',
								lenses: ['annotate'],
								name: 'source',
							},
							{
								accessible: true,
								label: 'AST · grammar',
								lenses: ['annotate'],
								name: 'ast',
							},
						]}
					/>
				</React.StrictMode>,
			);
			const second = container.querySelector<HTMLElement>(
				'[data-phase="ast"] [data-phase-lens="annotate"]',
			);
			if (!second) throw new Error('missing the ast-phase affordance');
			fireEvent.click(second);
			expect(onOpenLens.mock.calls).toEqual([
				[{ lens: 'annotate', phase: 'ast' }],
			]);
		});
	});

	describe('display labels (Simple)', () => {
		it('heads the section with the given label', () => {
			const { container } = render(
				<React.StrictMode>
					<PhasesPanel
						onOpenLens={vi.fn()}
						phases={[
							{
								accessible: true,
								label: 'Tokens · spelling',
								lenses: [],
								name: 'tokens',
							},
						]}
					/>
				</React.StrictMode>,
			);
			expect(
				container.querySelector('[data-phase="tokens"]')?.textContent,
			).toContain('Tokens · spelling');
		});
	});
});
