// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import GeneratorView from '../index.jsx';

import { unaskedSocket } from './fakes.js';

afterEach(cleanup);

function mountOver(seed: string): HTMLElement {
	const { container } = render(
		<React.StrictMode>
			<GeneratorView
				onAccept={vi.fn()}
				onDiscard={vi.fn()}
				seed={seed}
				socket={unaskedSocket()}
			/>
		</React.StrictMode>,
	);
	return container;
}

function querySeed(container: HTMLElement): HTMLElement | null {
	return container.querySelector<HTMLElement>(
		'[data-generator] [data-generator-seed]',
	);
}

function queryPrompt(container: HTMLElement): HTMLTextAreaElement | null {
	return container.querySelector<HTMLTextAreaElement>(
		'[data-generator] [data-generator-prompt]',
	);
}

function queryAsk(container: HTMLElement): HTMLButtonElement | null {
	return container.querySelector<HTMLButtonElement>(
		'[data-generator] [data-generator-generate]',
	);
}

function writePrompt(container: HTMLElement, text: string): void {
	const field = queryPrompt(container);
	if (!field) throw new Error('missing the prompt field');
	fireEvent.change(field, { target: { value: text } });
}

describe('GeneratorView', () => {
	describe('the empty mount (Zero)', () => {
		it('renders the view root', () => {
			const container = mountOver('');
			expect(container.querySelector('[data-generator]')).not.toBeNull();
		});

		it('seats an empty seed as an empty slot', () => {
			expect(querySeed(mountOver(''))?.textContent).toBe('');
		});

		it('offers no live ask over an empty prompt and an empty seed', () => {
			expect(queryAsk(mountOver(''))?.disabled).toBe(true);
		});

		it('warns that generating takes a while', () => {
			expect(mountOver('').textContent).toMatch(/takes? a while|slow/i);
		});

		it('warns that leaving the view ends the generation', () => {
			expect(mountOver('').textContent).toMatch(/leaving this view ends/i);
		});
	});

	describe('one seed, one prompt (One)', () => {
		it('seats a one-line seed verbatim', () => {
			expect(querySeed(mountOver('let x = 1;'))?.textContent).toBe(
				'let x = 1;',
			);
		});

		it('a seed alone is enough to ask', () => {
			expect(queryAsk(mountOver('let x = 1;'))?.disabled).toBe(false);
		});

		it('a prompt alone is enough to ask', () => {
			const container = mountOver('');
			writePrompt(container, 'write me a loop');
			expect(queryAsk(container)?.disabled).toBe(false);
		});
	});

	describe('more to work from (Many)', () => {
		it('seats a multi-line seed verbatim', () => {
			expect(querySeed(mountOver('let a = 1;\nlet b = 2;'))?.textContent).toBe(
				'let a = 1;\nlet b = 2;',
			);
		});

		it('a seed and a prompt together are enough to ask', () => {
			const container = mountOver('let x = 1;');
			writePrompt(container, 'add a second');
			expect(queryAsk(container)?.disabled).toBe(false);
		});
	});

	describe('the edges of having something to ask (Boundaries)', () => {
		// PINNED(AR-3 2026-07-30: whitespace-only seed/prompt is non-empty,
		// matching the socket's already-ruled asymmetry)
		it('a whitespace-only prompt is something to ask about', () => {
			const container = mountOver('');
			writePrompt(container, '   ');
			expect(queryAsk(container)?.disabled).toBe(false);
		});

		// PINNED(AR-3 2026-07-30: whitespace-only seed/prompt is non-empty,
		// matching the socket's already-ruled asymmetry)
		it('a whitespace-only seed is something to ask about', () => {
			expect(queryAsk(mountOver('   '))?.disabled).toBe(false);
		});

		it('clearing the prompt over an empty seed retires the ask again', () => {
			const container = mountOver('');
			writePrompt(container, 'write me a loop');
			writePrompt(container, '');
			expect(queryAsk(container)?.disabled).toBe(true);
		});
	});

	describe('the mount surface (Interfaces)', () => {
		it('seats the seed in a pre, so its whitespace survives without CSS', () => {
			expect(querySeed(mountOver('  indented'))?.tagName).toBe('PRE');
		});

		it('takes the prompt in a textarea, so a prompt can hold a newline', () => {
			expect(queryPrompt(mountOver(''))?.tagName).toBe('TEXTAREA');
		});

		it('starts the prompt empty even over a seed', () => {
			expect(queryPrompt(mountOver('let x = 1;'))?.value).toBe('');
		});

		it('keeps the warning up over a seed, not only at an empty mount', () => {
			expect(mountOver('let x = 1;').textContent).toMatch(
				/takes? a while|slow/i,
			);
		});

		it('offers the prompt as the only thing the learner can write in', () => {
			const container = mountOver('let x = 1;');
			const writable = Array.from(
				container.querySelectorAll<HTMLElement>(
					'[data-generator] textarea, [data-generator] input',
				),
				(control) => control.dataset.generatorPrompt !== undefined,
			);
			expect(writable).toEqual([true]);
		});

		it('names the prompt field for assistive tech', () => {
			const named = queryPrompt(mountOver(''))?.closest('label')?.textContent;
			expect((named ?? '').trim().length).toBeGreaterThan(0);
		});

		it('labels the ask affordance Generate', () => {
			expect(queryAsk(mountOver(''))?.textContent).toBe('Generate');
		});

		it('adds no heading to the instrument, at any level', () => {
			const container = mountOver('let x = 1;');
			expect(
				container.querySelector(
					'[data-generator] h1, [data-generator] h2, [data-generator] h3, [data-generator] h4, [data-generator] h5, [data-generator] h6',
				),
			).toBeNull();
		});

		it('shows no output slot while the job is idle', () => {
			const container = mountOver('let x = 1;');
			expect(
				container.querySelector('[data-generator] [data-generator-output]'),
			).toBeNull();
		});

		it('offers no reset control while the job is idle', () => {
			const container = mountOver('let x = 1;');
			expect(
				container.querySelector('[data-generator] [data-generator-cancel]'),
			).toBeNull();
		});
	});

	describe('writing a prompt (Simple)', () => {
		it('keeps what the learner writes in the prompt field', () => {
			const container = mountOver('');
			writePrompt(container, 'vary this program');
			expect(queryPrompt(container)?.value).toBe('vary this program');
		});
	});
});
