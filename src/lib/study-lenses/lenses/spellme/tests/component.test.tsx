// @vitest-environment jsdom
// cspell:ignore spellme

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import spellmeCore from '../core.js';
import spellmeLens from '../index.jsx';

afterEach(cleanup);

function renderLens(
	source: string,
	overrides?: Parameters<typeof spellmeCore.config>[0],
): HTMLElement {
	const { container } = render(
		<spellmeLens.main
			embodiment={embody(source)}
			config={spellmeCore.config(overrides)}
		/>,
	);
	return container;
}

function root(container: HTMLElement): HTMLElement {
	const element = container.querySelector<HTMLElement>('[data-lens="spellme"]');
	if (!element) throw new Error('missing the spellme root');
	return element;
}

function verdicts(container: HTMLElement): HTMLElement {
	const element = container.querySelector<HTMLElement>(
		'[data-spellme-verdicts]',
	);
	if (!element) throw new Error('missing the verdicts region');
	return element;
}

function pick(container: HTMLElement, selector: string): HTMLElement {
	const element = container.querySelector<HTMLElement>(selector);
	if (!element) throw new Error(`missing ${selector}`);
	return element;
}

describe('spellme lens — Lens object shape', () => {
	it('is named spellme', () => {
		expect(spellmeLens.name).toBe('spellme');
	});

	it('declares the tokens phase as its pedagogical target', () => {
		expect(spellmeLens.phase).toBe('tokens');
	});

	it('is frozen at construction', () => {
		expect(Object.isFrozen(spellmeLens)).toBe(true);
	});
});

describe('spellme surface', () => {
	describe('Interfaces — the DOM contract', () => {
		it('renders the lens root', () => {
			expect(root(renderLens('const x = 1'))).not.toBeNull();
		});

		it('carries the cursor position on the root', () => {
			expect(root(renderLens('const x = 1')).dataset.cursor).toBe('0');
		});

		it('renders the input tape', () => {
			expect(
				renderLens('const x = 1').querySelector('[data-spellme-input]'),
			).not.toBeNull();
		});

		it('renders the token tape', () => {
			expect(
				renderLens('const x = 1').querySelector('[data-spellme-tokens]'),
			).not.toBeNull();
		});

		it('renders the jar', () => {
			expect(
				renderLens('const x = 1').querySelector('[data-spellme-jar]'),
			).not.toBeNull();
		});

		it('offers ten element-kind buttons', () => {
			expect(
				renderLens('const x = 1').querySelectorAll('[data-element-kind]'),
			).toHaveLength(10);
		});

		it('renders the extent stepper', () => {
			expect(
				renderLens('const x = 1').querySelector('[data-spellme-extent]'),
			).not.toBeNull();
		});

		it('announces verdicts in a live region', () => {
			expect(
				verdicts(renderLens('const x = 1')).getAttribute('aria-live'),
			).toBe('polite');
		});

		it('leaves the element-kind verdict absent before the first claim', () => {
			expect(
				verdicts(renderLens('const x = 1')).dataset.elementKindVerdict,
			).toBeUndefined();
		});

		it('leaves the extent verdict absent before the first claim', () => {
			expect(
				verdicts(renderLens('const x = 1')).dataset.extentVerdict,
			).toBeUndefined();
		});

		it('leaves the one-more verdict absent before the first claim', () => {
			expect(
				verdicts(renderLens('const x = 1')).dataset.oneMoreVerdict,
			).toBeUndefined();
		});

		it('opens the legend on first mount', () => {
			expect(
				renderLens('const x = 1').querySelector('[data-spellme-legend]'),
			).not.toBeNull();
		});

		it('collapses the fates panel on first mount', () => {
			expect(
				renderLens('const x = 1').querySelector<HTMLDetailsElement>(
					'[data-spellme-fates]',
				)?.open,
			).toBe(false);
		});

		it('renders no snippet-type control of its own', () => {
			expect(
				renderLens('const x = 1').querySelector('[data-spellme-snippet-type]'),
			).toBeNull();
		});

		it('hides the one-more field before the threshold is reached', () => {
			expect(
				renderLens('const x = 1').querySelector('[data-spellme-one-more]'),
			).toBeNull();
		});

		it('hides the way past before the threshold is reached', () => {
			expect(
				renderLens('const x = 1').querySelector('[data-spellme-skip]'),
			).toBeNull();
		});

		it('shows the one-more field immediately at a zero threshold', () => {
			expect(
				renderLens('const x = 1', { oneMoreAfter: 0 }).querySelector(
					'[data-spellme-one-more]',
				),
			).not.toBeNull();
		});

		it('shows the way past immediately at a zero threshold', () => {
			expect(
				renderLens('const x = 1', { skipAfter: 0 }).querySelector(
					'[data-spellme-skip]',
				),
			).not.toBeNull();
		});

		it('renders the claim form while something is claimable', () => {
			expect(
				renderLens('const x = 1').querySelector('[data-spellme-claim-form]'),
			).not.toBeNull();
		});

		it('shows the spent characters in the consumed span', () => {
			expect(
				renderLens('// hi\nconst x = 1').querySelector(
					'[data-spellme-consumed]',
				)?.textContent,
			).toBe('// hi\n');
		});

		it('shows the proposed run at the extent on the stepper', () => {
			expect(
				renderLens('// hi\nconst x = 1').querySelector(
					'[data-spellme-proposed]',
				)?.textContent,
			).toBe('c');
		});

		it('shows what the scanner has not reached in the rest span', () => {
			expect(
				renderLens('// hi\nconst x = 1').querySelector('[data-spellme-rest]')
					?.textContent,
			).toBe('onst x = 1');
		});

		it('opens the proposed extent at one', () => {
			expect(
				renderLens('const x = 1').querySelector<HTMLElement>(
					'[data-spellme-proposed]',
				)?.dataset.extent,
			).toBe('1');
		});

		it('tracks the stepper on the proposed extent', () => {
			const container = renderLens('const x = 1');
			fireEvent.change(pick(container, '[data-spellme-extent] input'), {
				target: { value: '3' },
			});
			expect(pick(container, '[data-spellme-proposed]').dataset.extent).toBe(
				'3',
			);
		});

		it('tracks the stepper on the proposed run', () => {
			const container = renderLens('const x = 1');
			fireEvent.change(pick(container, '[data-spellme-extent] input'), {
				target: { value: '3' },
			});
			expect(pick(container, '[data-spellme-proposed]').textContent).toBe(
				'con',
			);
		});

		it('carries the attempt count on the claim form', () => {
			expect(
				renderLens('const x = 1').querySelector<HTMLElement>(
					'[data-spellme-claim-form]',
				)?.dataset.attempts,
			).toBe('0');
		});

		it('groups every element-kind button in the picker wrapper', () => {
			expect(
				renderLens('const x = 1').querySelectorAll(
					'[data-spellme-element-kinds] [data-element-kind]',
				),
			).toHaveLength(10);
		});

		it('offers ten distinct element kinds', () => {
			expect(
				new Set(
					Array.from(
						renderLens('const x = 1').querySelectorAll<HTMLElement>(
							'[data-element-kind]',
						),
					).map((button) => button.dataset.elementKind),
				).size,
			).toBe(10);
		});

		it('leaves every element-kind button unpressed before a pick', () => {
			expect(
				renderLens('const x = 1').querySelectorAll(
					'[data-element-kind][aria-pressed="true"]',
				),
			).toHaveLength(0);
		});

		it.each(['IdentifierName', 'RegularExpressionLiteral'])(
			'presses %s when the learner picks it',
			(elementKind) => {
				const container = renderLens('const x = 1');
				fireEvent.click(
					pick(container, `[data-element-kind="${elementKind}"]`),
				);
				expect(
					pick(container, `[data-element-kind="${elementKind}"]`).getAttribute(
						'aria-pressed',
					),
				).toBe('true');
			},
		);

		it('draws the one-more question against the extent on the stepper', () => {
			const container = renderLens('const x = 1', { oneMoreAfter: 0 });
			fireEvent.change(pick(container, '[data-spellme-extent] input'), {
				target: { value: '3' },
			});
			expect(
				container.querySelectorAll('[data-spellme-one-more] dd')[0]
					?.textContent,
			).toBe('con');
		});

		it('draws the one-more run one character past the stepper', () => {
			const container = renderLens('const x = 1', { oneMoreAfter: 0 });
			fireEvent.change(pick(container, '[data-spellme-extent] input'), {
				target: { value: '3' },
			});
			expect(
				container.querySelectorAll('[data-spellme-one-more] dd')[1]
					?.textContent,
			).toBe('cons');
		});
	});

	describe('Many — the stream advances', () => {
		it.skip('moves the cursor after a correct claim', () => {
			const container = renderLens('const x = 1');
			fireEvent.click(pick(container, '[data-element-kind="IdentifierName"]'));
			fireEvent.click(pick(container, '[data-spellme-submit]'));
			expect(root(container).dataset.cursor).not.toBe('0');
		});

		it.skip('leaves the cursor where it is after a wrong claim', () => {
			const container = renderLens('const x = 1');
			fireEvent.click(pick(container, '[data-element-kind="StringLiteral"]'));
			fireEvent.click(pick(container, '[data-spellme-submit]'));
			expect(root(container).dataset.cursor).toBe('0');
		});

		it('keeps a set-aside element in the jar', () => {
			expect(
				renderLens('// hi').querySelectorAll('[data-spellme-set-aside]'),
			).toHaveLength(1);
		});

		it('marks a comment carrying a line terminator', () => {
			expect(
				renderLens('/* a\nb */').querySelector<HTMLElement>(
					'[data-spellme-set-aside]',
				)?.dataset.marked,
			).toBe('true');
		});

		it('leaves a comment with no line terminator unmarked', () => {
			expect(
				renderLens('// hi').querySelector<HTMLElement>(
					'[data-spellme-set-aside]',
				)?.dataset.marked,
			).toBe('false');
		});

		it('shows a set-aside element its own source text', () => {
			expect(
				renderLens('// hi').querySelector('[data-spellme-set-aside]')
					?.textContent,
			).toBe('// hi');
		});

		it('marks a consumed line terminator on the token tape', () => {
			expect(
				renderLens('// hi\nconst x = 1').querySelectorAll(
					'[data-spellme-break]',
				),
			).toHaveLength(1);
		});

		it('leaves no break mark where only whitespace was consumed', () => {
			expect(
				renderLens('   const x = 1').querySelectorAll('[data-spellme-break]'),
			).toHaveLength(0);
		});
	});

	describe('Zero — nothing claimable', () => {
		it('renders the root for an empty program', () => {
			expect(root(renderLens(''))).not.toBeNull();
		});

		it('renders no claim form for a program with nothing claimable', () => {
			expect(
				renderLens('   ').querySelector('[data-spellme-claim-form]'),
			).toBeNull();
		});

		it('keeps the legend on a program with nothing claimable', () => {
			expect(
				renderLens('   ').querySelector('[data-spellme-legend]'),
			).not.toBeNull();
		});
	});

	describe('Boundaries — the exhausted stream', () => {
		it.skip('removes the claim form once the last element has fallen', () => {
			const container = renderLens('x');
			fireEvent.click(pick(container, '[data-element-kind="IdentifierName"]'));
			fireEvent.click(pick(container, '[data-spellme-submit]'));
			expect(container.querySelector('[data-spellme-claim-form]')).toBeNull();
		});

		it.skip('keeps the token tape after the last element has fallen', () => {
			const container = renderLens('x');
			fireEvent.click(pick(container, '[data-element-kind="IdentifierName"]'));
			fireEvent.click(pick(container, '[data-spellme-submit]'));
			expect(container.querySelectorAll('[data-spellme-element]')).toHaveLength(
				1,
			);
		});

		it.skip('shows no summary once the last element has fallen', () => {
			const container = renderLens('x');
			fireEvent.click(pick(container, '[data-element-kind="IdentifierName"]'));
			fireEvent.click(pick(container, '[data-spellme-submit]'));
			expect(container.querySelector('[data-spellme-summary]')).toBeNull();
		});
	});

	describe('Interfaces — the keyboard journey', () => {
		it('gives every element-kind button a reachable control', () => {
			for (const button of Array.from(
				renderLens('const x = 1').querySelectorAll('[data-element-kind]'),
			)) {
				expect(button.tagName).toBe('BUTTON');
			}
		});

		it('gives the extent a native stepper rather than a drag-only control', () => {
			expect(
				renderLens('const x = 1')
					.querySelector('[data-spellme-extent] input')
					?.getAttribute('type'),
			).toBe('number');
		});
	});
});
