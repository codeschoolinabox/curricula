// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import LevelSelector from '../index.jsx';
import type { LevelOption } from '../types.js';

afterEach(cleanup);

function threeOptions(): ReadonlyArray<LevelOption> {
	return [
		{
			docs: 'scaffold reference docs',
			key: 'scaffold',
			label: 'Scaffold',
			mark: 'fits',
		},
		{
			docs: 'advanced reference docs',
			key: 'advanced',
			label: 'Advanced',
			mark: 'does-not-fit',
		},
		{
			docs: 'basics reference docs',
			key: 'basics',
			label: 'Basics',
			mark: 'undetermined',
		},
	];
}

function openList(container: HTMLElement): void {
	const face = container.querySelector<HTMLElement>('[data-level-face]');
	if (!face) throw new Error('missing the closed face');
	fireEvent.click(face);
}

describe('LevelSelector', () => {
	describe('levels registered, none selected (Zero)', () => {
		it('shows the none-state face', () => {
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey=""
						strict={false}
					/>
				</React.StrictMode>,
			);
			expect(
				container.querySelector('[data-level-face]')?.textContent,
			).toContain('plain JavaScript');
		});

		it('carries no mark on the none-state face', () => {
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey=""
						strict={false}
					/>
				</React.StrictMode>,
			);
			expect(
				container.querySelector('[data-level-face][data-level-mark]'),
			).toBeNull();
		});

		it('renders the selector root with its data attribute', () => {
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey=""
						strict={false}
					/>
				</React.StrictMode>,
			);
			expect(container.querySelector('[data-level-selector]')).not.toBeNull();
		});
	});

	describe('the closed face tracks selection (One)', () => {
		it('shows the selected non-first option label', () => {
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey="advanced"
						strict={false}
					/>
				</React.StrictMode>,
			);
			expect(
				container.querySelector('[data-level-face]')?.textContent,
			).toContain('Advanced');
		});

		it('carries the selected option mark', () => {
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey="advanced"
						strict={false}
					/>
				</React.StrictMode>,
			);
			expect(
				container.querySelector<HTMLElement>('[data-level-face]')?.dataset
					.levelMark,
			).toBe('does-not-fit');
		});
	});

	describe('opening the list (Boundaries)', () => {
		it('renders no entries before the face is clicked', () => {
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey=""
						strict={false}
					/>
				</React.StrictMode>,
			);
			expect(container.querySelector('[data-level-option]')).toBeNull();
		});

		it('reveals the entries on a face click', () => {
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey=""
						strict={false}
					/>
				</React.StrictMode>,
			);
			openList(container);
			expect(container.querySelectorAll('[data-level-option]')).toHaveLength(4);
		});

		it('hides the entries on a second face click', () => {
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey=""
						strict={false}
					/>
				</React.StrictMode>,
			);
			openList(container);
			openList(container);
			expect(container.querySelector('[data-level-option]')).toBeNull();
		});

		it('reflects the open state on the face', () => {
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey=""
						strict={false}
					/>
				</React.StrictMode>,
			);
			const face = container.querySelector<HTMLElement>('[data-level-face]');
			expect(face?.getAttribute('aria-expanded')).toBe('false');
			openList(container);
			expect(face?.getAttribute('aria-expanded')).toBe('true');
		});

		it('closes the list on selecting a level entry', () => {
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey=""
						strict={false}
					/>
				</React.StrictMode>,
			);
			openList(container);
			const scaffold = container.querySelector<HTMLElement>(
				'[data-level-option="scaffold"]',
			);
			if (!scaffold) throw new Error('missing the scaffold entry');
			fireEvent.click(scaffold);
			expect(container.querySelector('[data-level-option]')).toBeNull();
		});

		it('closes the list on selecting the none-state entry', () => {
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey="scaffold"
						strict={false}
					/>
				</React.StrictMode>,
			);
			openList(container);
			const none = container.querySelector<HTMLElement>(
				'[data-level-option=""]',
			);
			if (!none) throw new Error('missing the none-state entry');
			fireEvent.click(none);
			expect(container.querySelector('[data-level-option]')).toBeNull();
		});

		it('fires no intent on opening', () => {
			const onSelectLevel = vi.fn();
			const onToggleStrict = vi.fn();
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={onSelectLevel}
						onToggleStrict={onToggleStrict}
						options={threeOptions()}
						selectedKey=""
						strict={false}
					/>
				</React.StrictMode>,
			);
			openList(container);
			expect(
				onSelectLevel.mock.calls.length + onToggleStrict.mock.calls.length,
			).toBe(0);
		});
	});

	describe('the open list (Many)', () => {
		it('renders the none-state entry then the options in the given order', () => {
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="just JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey=""
						strict={false}
					/>
				</React.StrictMode>,
			);
			openList(container);
			const keys = Array.from(
				container.querySelectorAll<HTMLElement>('[data-level-option]'),
				(entry) => entry.dataset.levelOption,
			);
			expect(keys).toEqual(['', 'scaffold', 'advanced', 'basics']);
		});

		it('carries each option mark on its entry', () => {
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="just JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey=""
						strict={false}
					/>
				</React.StrictMode>,
			);
			openList(container);
			const marks = Array.from(
				container.querySelectorAll<HTMLElement>(
					'[data-level-option][data-level-mark]',
				),
				(entry) => [entry.dataset.levelOption, entry.dataset.levelMark],
			);
			expect(marks).toEqual([
				['scaffold', 'fits'],
				['advanced', 'does-not-fit'],
				['basics', 'undetermined'],
			]);
		});

		it('heads each entry with its label', () => {
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="just JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey=""
						strict={false}
					/>
				</React.StrictMode>,
			);
			openList(container);
			const labels = Array.from(
				container.querySelectorAll<HTMLElement>(
					'[data-level-option]:not([data-level-option=""])',
				),
				(entry) => entry.textContent,
			);
			expect(labels).toEqual(['Scaffold', 'Advanced', 'Basics']);
		});

		it('shows the none-state entry under the given none label', () => {
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="just JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey=""
						strict={false}
					/>
				</React.StrictMode>,
			);
			openList(container);
			expect(
				container.querySelector('[data-level-option=""]')?.textContent,
			).toBe('just JavaScript');
		});
	});

	describe('docs on hover (Interfaces)', () => {
		it('carries each option docs as its entry title', () => {
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey=""
						strict={false}
					/>
				</React.StrictMode>,
			);
			openList(container);
			const titles = Array.from(
				container.querySelectorAll<HTMLElement>(
					'[data-level-option]:not([data-level-option=""])',
				),
				(entry) => [entry.dataset.levelOption, entry.getAttribute('title')],
			);
			expect(titles).toEqual([
				['scaffold', 'scaffold reference docs'],
				['advanced', 'advanced reference docs'],
				['basics', 'basics reference docs'],
			]);
		});

		it('carries no docs title on the none-state entry', () => {
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey=""
						strict={false}
					/>
				</React.StrictMode>,
			);
			openList(container);
			expect(
				container
					.querySelector('[data-level-option=""]')
					?.hasAttribute('title'),
			).toBe(false);
		});
	});

	describe('the intents (Interfaces)', () => {
		it('reports the clicked non-first option key', () => {
			const onSelectLevel = vi.fn();
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={onSelectLevel}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey=""
						strict={false}
					/>
				</React.StrictMode>,
			);
			openList(container);
			const advanced = container.querySelector<HTMLElement>(
				'[data-level-option="advanced"]',
			);
			if (!advanced) throw new Error('missing the advanced entry');
			fireEvent.click(advanced);
			expect(onSelectLevel.mock.calls).toEqual([['advanced']]);
		});

		it('reports the none-state as the empty key', () => {
			const onSelectLevel = vi.fn();
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={onSelectLevel}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey="scaffold"
						strict={false}
					/>
				</React.StrictMode>,
			);
			openList(container);
			const none = container.querySelector<HTMLElement>(
				'[data-level-option=""]',
			);
			if (!none) throw new Error('missing the none-state entry');
			fireEvent.click(none);
			expect(onSelectLevel.mock.calls).toEqual([['']]);
		});

		it('requests strict when warn is given', () => {
			const onToggleStrict = vi.fn();
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={onToggleStrict}
						options={threeOptions()}
						selectedKey=""
						strict={false}
					/>
				</React.StrictMode>,
			);
			const toggle = container.querySelector<HTMLElement>(
				'[data-strict-toggle]',
			);
			if (!toggle) throw new Error('missing the strict toggle');
			fireEvent.click(toggle);
			expect(onToggleStrict.mock.calls).toEqual([[true]]);
		});

		it('requests warn when strict is given', () => {
			const onToggleStrict = vi.fn();
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={onToggleStrict}
						options={threeOptions()}
						selectedKey=""
						strict={true}
					/>
				</React.StrictMode>,
			);
			const toggle = container.querySelector<HTMLElement>(
				'[data-strict-toggle]',
			);
			if (!toggle) throw new Error('missing the strict toggle');
			fireEvent.click(toggle);
			expect(onToggleStrict.mock.calls).toEqual([[false]]);
		});
	});

	describe('the toggle face reflects the posture (Simple)', () => {
		it('presses the toggle under strict', () => {
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey=""
						strict={true}
					/>
				</React.StrictMode>,
			);
			expect(
				container
					.querySelector('[data-strict-toggle]')
					?.getAttribute('aria-pressed'),
			).toBe('true');
		});

		it('releases the toggle under warn', () => {
			const { container } = render(
				<React.StrictMode>
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={vi.fn()}
						onToggleStrict={vi.fn()}
						options={threeOptions()}
						selectedKey=""
						strict={false}
					/>
				</React.StrictMode>,
			);
			expect(
				container
					.querySelector('[data-strict-toggle]')
					?.getAttribute('aria-pressed'),
			).toBe('false');
		});
	});
});
