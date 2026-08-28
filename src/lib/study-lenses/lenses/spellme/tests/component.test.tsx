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
		it.skip('renders the lens root', () => {
			expect(root(renderLens('const x = 1'))).not.toBeNull();
		});

		it.skip('carries the cursor position on the root', () => {
			expect(root(renderLens('const x = 1')).dataset.cursor).toBe('0');
		});

		it.skip('renders the input tape', () => {
			expect(
				renderLens('const x = 1').querySelector('[data-spellme-input]'),
			).not.toBeNull();
		});

		it.skip('renders the token tape', () => {
			expect(
				renderLens('const x = 1').querySelector('[data-spellme-tokens]'),
			).not.toBeNull();
		});

		it.skip('renders the jar', () => {
			expect(
				renderLens('const x = 1').querySelector('[data-spellme-jar]'),
			).not.toBeNull();
		});

		it.skip('offers ten element-kind buttons', () => {
			expect(
				renderLens('const x = 1').querySelectorAll('[data-element-kind]'),
			).toHaveLength(10);
		});

		it.skip('renders the extent stepper', () => {
			expect(
				renderLens('const x = 1').querySelector('[data-spellme-extent]'),
			).not.toBeNull();
		});

		it.skip('announces verdicts in a live region', () => {
			expect(
				verdicts(renderLens('const x = 1')).getAttribute('aria-live'),
			).toBe('polite');
		});

		it.skip('leaves the element-kind verdict absent before the first claim', () => {
			expect(
				verdicts(renderLens('const x = 1')).dataset.elementKindVerdict,
			).toBeUndefined();
		});

		it.skip('leaves the extent verdict absent before the first claim', () => {
			expect(
				verdicts(renderLens('const x = 1')).dataset.extentVerdict,
			).toBeUndefined();
		});

		it.skip('leaves the one-more verdict absent before the first claim', () => {
			expect(
				verdicts(renderLens('const x = 1')).dataset.oneMoreVerdict,
			).toBeUndefined();
		});

		it.skip('opens the legend on first mount', () => {
			expect(
				renderLens('const x = 1').querySelector('[data-spellme-legend]'),
			).not.toBeNull();
		});

		it.skip('collapses the fates panel on first mount', () => {
			expect(
				renderLens('const x = 1').querySelector<HTMLDetailsElement>(
					'[data-spellme-fates]',
				)?.open,
			).toBe(false);
		});

		it.skip('renders no snippet-type control of its own', () => {
			expect(
				renderLens('const x = 1').querySelector('[data-spellme-snippet-type]'),
			).toBeNull();
		});

		it.skip('hides the one-more field before the threshold is reached', () => {
			expect(
				renderLens('const x = 1').querySelector('[data-spellme-one-more]'),
			).toBeNull();
		});

		it.skip('hides the way past before the threshold is reached', () => {
			expect(
				renderLens('const x = 1').querySelector('[data-spellme-skip]'),
			).toBeNull();
		});

		it.skip('shows the one-more field immediately at a zero threshold', () => {
			expect(
				renderLens('const x = 1', { oneMoreAfter: 0 }).querySelector(
					'[data-spellme-one-more]',
				),
			).not.toBeNull();
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
		it.skip('gives every element-kind button a reachable control', () => {
			for (const button of Array.from(
				renderLens('const x = 1').querySelectorAll('[data-element-kind]'),
			)) {
				expect(button.tagName).toBe('BUTTON');
			}
		});

		it.skip('gives the extent a native stepper rather than a drag-only control', () => {
			expect(
				renderLens('const x = 1')
					.querySelector('[data-spellme-extent] input')
					?.getAttribute('type'),
			).toBe('number');
		});
	});
});
