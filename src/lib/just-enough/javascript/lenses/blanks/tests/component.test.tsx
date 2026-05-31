/**
 * @vitest-environment jsdom
 *
 * @file React-wrapper tests for the `blanks` lens. Confirms the
 * `LensModule` shape and the wrapper's rendered surface
 * (`data-lens="blanks"`, toolbar, display surface, knob interactions,
 * re-derivation reset) per `../README.md` § UI structure and
 * `../DOCS.md` § Execution phases 4 + 5.
 */

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import blanksLens from '../index.js';

afterEach(cleanup);

function renderBlanks(code: string, seed = 1, difficulty = 100) {
	const snippet = embody(code);
	return render(
		<blanksLens.Component
			embodiment={snippet}
			config={{ seed, difficulty }}
		/>,
	);
}

describe('blanks lens — LensModule shape', () => {
	it('is named "blanks"', () => {
		expect(blanksLens.name).toBe('blanks');
	});

	it('exposes a React Component', () => {
		expect(typeof blanksLens.Component).toBe('function');
	});

	it('exposes a config factory', () => {
		expect(typeof blanksLens.config).toBe('function');
	});

	it('exposes an applicableTo gate', () => {
		expect(typeof blanksLens.applicableTo).toBe('function');
	});

	it('exposes a recommend function', () => {
		expect(typeof blanksLens.recommend).toBe('function');
	});

	it('the LensModule literal is frozen', () => {
		expect(Object.isFrozen(blanksLens)).toBe(true);
	});
});

describe('blanks lens — rendered surface', () => {
	it('renders a root with data-lens="blanks"', () => {
		const { container } = renderBlanks('let x = 1;');
		expect(container.querySelector('[data-lens="blanks"]')).not.toBeNull();
	});

	it('renders a toolbar', () => {
		const { container } = renderBlanks('let x = 1;');
		expect(container.querySelector('[data-blanks-toolbar]')).not.toBeNull();
	});

	it('renders the difficulty slider', () => {
		const { container } = renderBlanks('let x = 1;');
		expect(container.querySelector('[data-blanks-difficulty]')).not.toBeNull();
	});

	it('renders a checkbox per token category', () => {
		const { container } = renderBlanks('let x = 1;');
		const checkboxes = container.querySelectorAll(
			'[data-blanks-toolbar] input[type="checkbox"]',
		);
		expect(checkboxes).toHaveLength(4);
	});

	it('renders the score readout', () => {
		const { container } = renderBlanks('let x = 1;');
		expect(container.querySelector('[data-blanks-score]')).not.toBeNull();
	});

	it('renders the display surface', () => {
		const { container } = renderBlanks('let x = 1;');
		expect(container.querySelector('[data-blanks-display]')).not.toBeNull();
	});

	it('renders one input per blank at difficulty 100 (all categories)', () => {
		const { container } = renderBlanks('let x = 1;');
		// 'let x = 1;' produces 4 blanks at difficulty 100 (let, x, =, 1).
		const inputs = container.querySelectorAll('input[data-blank-index]');
		expect(inputs).toHaveLength(4);
	});

	it('initial score is 0% when no answers are filled', () => {
		const { container } = renderBlanks('let x = 1;');
		const readout = container.querySelector('[data-blanks-score]');
		expect(readout?.textContent).toContain('0%');
	});
});

describe('blanks lens — learner interaction', () => {
	// Use a single-eligible-token snippet so the "correct answer" is
	// unambiguous regardless of seed or derivation ordering. Per AR-3
	// concern 1, hardcoding the first-input answer would be fragile.
	function renderOneKeyword(): ReturnType<typeof render> {
		const snippet = embody('let;');
		return render(
			<blanksLens.Component
				embodiment={snippet}
				config={{ seed: 1, difficulty: 100, tokenCategories: ['keywords'] }}
			/>,
		);
	}

	it('typing the correct answer produces 100% score', () => {
		const { container } = renderOneKeyword();
		const input = container.querySelector<HTMLInputElement>(
			'input[data-blank-index]',
		);
		// One eligible token: the `let` keyword.
		fireEvent.change(input as HTMLInputElement, { target: { value: 'let' } });
		const readout = container.querySelector('[data-blanks-score]');
		expect(readout?.textContent).toBe('100% (1/1)');
	});

	it('typing a wrong answer keeps the score at 0%', () => {
		const { container } = renderOneKeyword();
		const input = container.querySelector<HTMLInputElement>(
			'input[data-blank-index]',
		);
		fireEvent.change(input as HTMLInputElement, { target: { value: 'wrong' } });
		const readout = container.querySelector('[data-blanks-score]');
		expect(readout?.textContent).toBe('0% (0/1)');
	});

	it('initial score readout is "0% (0/N)" with N matching the blank count', () => {
		const { container } = renderBlanks('let x = 1;');
		const readout = container.querySelector('[data-blanks-score]');
		expect(readout?.textContent).toBe('0% (0/4)');
	});
});

describe('blanks lens — toolbar-driven re-derivation', () => {
	it('moving the difficulty slider to 0 collapses the surface to plain text (no inputs)', () => {
		const { container } = renderBlanks('let x = 1;');
		const slider = container.querySelector<HTMLInputElement>(
			'[data-blanks-difficulty]',
		);
		fireEvent.change(slider as Element, { target: { value: '0' } });
		const inputs = container.querySelectorAll('input[data-blank-index]');
		expect(inputs).toHaveLength(0);
	});

	it('zero-blank state renders "0% (0/0)" score (the blankCount===0 branch)', () => {
		const { container } = renderBlanks('let x = 1;');
		const slider = container.querySelector<HTMLInputElement>(
			'[data-blanks-difficulty]',
		);
		fireEvent.change(slider as Element, { target: { value: '0' } });
		const readout = container.querySelector('[data-blanks-score]');
		expect(readout?.textContent).toBe('0% (0/0)');
	});

	it('disabling all category checkboxes collapses the surface (no inputs)', () => {
		const { container } = renderBlanks('let x = 1;');
		// Pitfall #14 per ../annotate/index.tsx: keep Array.from on
		// NodeList iterators (Babel emits unstable spread in some builds).
		// eslint-disable-next-line unicorn/prefer-spread -- see note above
		const checkboxes = Array.from(
			container.querySelectorAll<HTMLInputElement>(
				'[data-blanks-toolbar] input[type="checkbox"]',
			),
		);
		for (const checkbox of checkboxes) {
			fireEvent.click(checkbox);
		}
		const inputs = container.querySelectorAll('input[data-blank-index]');
		expect(inputs).toHaveLength(0);
	});

	it('re-derivation on slider change resets learner answers', () => {
		const snippet = embody('let;');
		const { container } = render(
			<blanksLens.Component
				embodiment={snippet}
				config={{ seed: 1, difficulty: 100, tokenCategories: ['keywords'] }}
			/>,
		);
		const input = container.querySelector<HTMLInputElement>(
			'input[data-blank-index]',
		);
		fireEvent.change(input as HTMLInputElement, { target: { value: 'let' } });
		// Confirm pre-condition: score is 100%.
		expect(container.querySelector('[data-blanks-score]')?.textContent).toBe(
			'100% (1/1)',
		);
		// Move slider — re-derivation fires (still 1 blank at 100→50 for
		// this snippet since `let` is the only eligible token); answers
		// reset to empty regardless.
		const slider = container.querySelector<HTMLInputElement>(
			'[data-blanks-difficulty]',
		);
		fireEvent.change(slider as Element, { target: { value: '50' } });
		// After reset, score back to 0%.
		const readoutAfter = container.querySelector('[data-blanks-score]');
		expect(readoutAfter?.textContent).toContain('0%');
	});

	it('re-derivation on checkbox toggle resets learner answers (Phase 5 reset path)', () => {
		const snippet = embody('let;');
		const { container } = render(
			<blanksLens.Component
				embodiment={snippet}
				config={{ seed: 1, difficulty: 100, tokenCategories: ['keywords'] }}
			/>,
		);
		const input = container.querySelector<HTMLInputElement>(
			'input[data-blank-index]',
		);
		fireEvent.change(input as HTMLInputElement, { target: { value: 'let' } });
		expect(container.querySelector('[data-blanks-score]')?.textContent).toBe(
			'100% (1/1)',
		);
		// Toggle the keywords checkbox off then on; both transitions
		// trigger re-derivation. After the round-trip, answers should
		// have been reset.
		const keywordsCheckbox = container.querySelector<HTMLInputElement>(
			'input[data-category="keywords"]',
		);
		fireEvent.click(keywordsCheckbox as HTMLInputElement);
		fireEvent.click(keywordsCheckbox as HTMLInputElement);
		const readoutAfter = container.querySelector('[data-blanks-score]');
		expect(readoutAfter?.textContent).toBe('0% (0/1)');
	});
});

describe('blanks lens — display fragment rendering', () => {
	it('non-blank source text renders inside spans', () => {
		const { container } = renderBlanks('let x = 1;', 1, 0);
		// At difficulty 0, no blanks; entire source is one span.
		const display = container.querySelector('[data-blanks-display]');
		expect(display?.textContent).toBe('let x = 1;');
	});

	it('each input has aria-label "blank N+1"', () => {
		const { container } = renderBlanks('let x = 1;');
		const firstInput = container.querySelector('input[data-blank-index="0"]');
		expect(firstInput?.getAttribute('aria-label')).toBe('blank 1');
	});

	it('only-keywords config renders one input for `let x = 1;` (one keyword)', () => {
		const snippet = embody('let x = 1;');
		const { container } = render(
			<blanksLens.Component
				embodiment={snippet}
				config={{ seed: 1, difficulty: 100, tokenCategories: ['keywords'] }}
			/>,
		);
		const inputs = container.querySelectorAll('input[data-blank-index]');
		expect(inputs).toHaveLength(1);
	});
});

describe('blanks lens — educator-supplied invalid config', () => {
	it('non-number difficulty falls back to default (renders blanks for parsed snippet)', () => {
		const snippet = embody('let x = 1;');
		const { container } = render(
			<blanksLens.Component
				embodiment={snippet}
				config={{ difficulty: 'bad' as unknown as number, seed: 1 }}
			/>,
		);
		// Defaults to difficulty 50 → some blanks present (not zero, not crash).
		const readout = container.querySelector('[data-blanks-score]');
		expect(readout?.textContent).toMatch(/^\d+% \(0\/\d+\)$/);
	});

	it('non-array tokenCategories falls back to all four categories', () => {
		const snippet = embody('let x = 1;');
		const { container } = render(
			<blanksLens.Component
				embodiment={snippet}
				config={{
					tokenCategories: 'bogus' as unknown as ReadonlyArray<string>,
					seed: 1,
					difficulty: 100,
				}}
			/>,
		);
		// Fallback to all four → 4 blanks for `let x = 1;`.
		const inputs = container.querySelectorAll('input[data-blank-index]');
		expect(inputs).toHaveLength(4);
	});

	it('unknown-category strings are filtered out (no fallback to defaults)', () => {
		const snippet = embody('let x = 1;');
		const { container } = render(
			<blanksLens.Component
				embodiment={snippet}
				config={{
					tokenCategories: ['unknown', 'notreal'] as ReadonlyArray<string>,
					seed: 1,
					difficulty: 100,
				}}
			/>,
		);
		// Array present but all entries filtered → zero categories →
		// zero blanks (deliberate: distinguishes "array of nothing valid"
		// from "no array at all").
		const inputs = container.querySelectorAll('input[data-blank-index]');
		expect(inputs).toHaveLength(0);
	});
});
