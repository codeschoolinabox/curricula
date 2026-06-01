/**
 * @vitest-environment jsdom
 *
 * @file React-wrapper tests for the `parsons` lens. Confirms the
 * `LensModule` shape and the wrapper's rendered surface
 * (`data-lens="parsons"`, score readout, draggable row stack) per
 * `../README.md` § UI structure and `../DOCS.md` § Execution phases
 * 4-5.
 */

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import parsonsLens from '../index.js';

afterEach(cleanup);

function renderParsons(code: string, seed = 1) {
	const snippet = embody(code);
	return render(
		<parsonsLens.Component embodiment={snippet} config={{ seed }} />,
	);
}

describe('parsons lens — LensModule shape', () => {
	it('is named "parsons"', () => {
		expect(parsonsLens.name).toBe('parsons');
	});

	it('exposes a React Component', () => {
		expect(typeof parsonsLens.Component).toBe('function');
	});

	it('exposes a config factory', () => {
		expect(typeof parsonsLens.config).toBe('function');
	});

	it('exposes an applicableTo gate', () => {
		expect(typeof parsonsLens.applicableTo).toBe('function');
	});

	it('exposes a recommend function', () => {
		expect(typeof parsonsLens.recommend).toBe('function');
	});

	it('the LensModule literal is frozen', () => {
		expect(Object.isFrozen(parsonsLens)).toBe(true);
	});
});

describe('parsons lens — rendered surface', () => {
	it('renders a root with data-lens="parsons"', () => {
		const { container } = renderParsons('a;\nb;\nc;');
		expect(container.querySelector('[data-lens="parsons"]')).not.toBeNull();
	});

	it('renders the score readout', () => {
		const { container } = renderParsons('a;\nb;\nc;');
		expect(container.querySelector('[data-parsons-score]')).not.toBeNull();
	});

	it('renders the row stack as an <ol>', () => {
		const { container } = renderParsons('a;\nb;\nc;');
		const stack = container.querySelector('[data-parsons-stack]');
		expect(stack?.tagName).toBe('OL');
	});

	it('renders one row per source line (4-line snippet)', () => {
		const { container } = renderParsons('a;\nb;\nc;\nd;');
		const rows = container.querySelectorAll('[data-parsons-row]');
		expect(rows).toHaveLength(4);
	});

	it('renders one row per source line (2-line snippet) — triangulates row count', () => {
		const { container } = renderParsons('x;\ny;');
		const rows = container.querySelectorAll('[data-parsons-row]');
		expect(rows).toHaveLength(2);
	});

	it('every row carries data-row-original-index', () => {
		const { container } = renderParsons('a;\nb;\nc;');
		const rows = container.querySelectorAll<HTMLLIElement>(
			'[data-parsons-row]',
		);
		for (const row of rows) {
			expect(row.dataset.rowOriginalIndex).toBeDefined();
		}
	});

	it('every row is draggable', () => {
		const { container } = renderParsons('a;\nb;\nc;');
		const rows = container.querySelectorAll<HTMLLIElement>(
			'[data-parsons-row]',
		);
		for (const row of rows) {
			expect(row.draggable).toBe(true);
		}
	});
});

describe('parsons lens — score readout', () => {
	it('3-line source renders "N% (k/3)" format', () => {
		const { container } = renderParsons('a;\nb;\nc;');
		const readout = container.querySelector('[data-parsons-score]');
		expect(readout?.textContent).toMatch(/^\d+% \(\d+\/3\)$/);
	});

	it('5-line source renders "N% (k/5)" format — triangulates denominator', () => {
		const { container } = renderParsons('a;\nb;\nc;\nd;\ne;');
		const readout = container.querySelector('[data-parsons-score]');
		expect(readout?.textContent).toMatch(/^\d+% \(\d+\/5\)$/);
	});

	it('empty source renders suppressed score "–"', () => {
		const { container } = renderParsons('');
		const readout = container.querySelector('[data-parsons-score]');
		expect(readout?.textContent).toBe('–');
	});

	it('single-line source renders suppressed score "–"', () => {
		const { container } = renderParsons('only one;');
		const readout = container.querySelector('[data-parsons-score]');
		expect(readout?.textContent).toBe('–');
	});
});

describe('parsons lens — deterministic shuffle (pinned seed)', () => {
	it('pinned seed produces same row order across remounts', () => {
		const code = 'a;\nb;\nc;\nd;\ne;';
		const first = renderParsons(code, 42).container.querySelectorAll<HTMLLIElement>(
			'[data-parsons-row]',
		);
		// eslint-disable-next-line unicorn/prefer-spread -- NodeList iteration; Babel emits unstable code per annotate Pitfall #14
		const firstOrder = Array.from(first).map(
			(row) => row.dataset.rowOriginalIndex,
		);
		cleanup();
		const second = renderParsons(code, 42).container.querySelectorAll<HTMLLIElement>(
			'[data-parsons-row]',
		);
		// eslint-disable-next-line unicorn/prefer-spread -- see above
		const secondOrder = Array.from(second).map(
			(row) => row.dataset.rowOriginalIndex,
		);
		expect(firstOrder).toEqual(secondOrder);
	});
});

describe('parsons lens — correctness tagging', () => {
	it('rows in their original position carry data-row-correct="true"', () => {
		// With the shuffle, some rows may still happen to land in the
		// right place. Assert the contract structurally: every row's
		// data-row-correct is true iff its originalIndex matches its
		// DOM position.
		const { container } = renderParsons('a;\nb;\nc;\nd;');
		// eslint-disable-next-line unicorn/prefer-spread -- NodeList iteration; Babel emits unstable code per annotate Pitfall #14
		const rows = Array.from(
			container.querySelectorAll<HTMLLIElement>('[data-parsons-row]'),
		);
		for (const [domIndex, row] of rows.entries()) {
			const originalIndex = Number.parseInt(
				row.dataset.rowOriginalIndex ?? '-1',
				10,
			);
			const tagged = row.dataset.rowCorrect === 'true';
			expect(tagged).toBe(originalIndex === domIndex);
		}
	});
});

describe('parsons lens — drag-and-drop reorder', () => {
	function makeDataTransfer() {
		const store = new Map<string, string>();
		return {
			setData: (format: string, value: string) => store.set(format, value),
			getData: (format: string) => store.get(format) ?? '',
			effectAllowed: '',
			dropEffect: '',
		};
	}

	function dragRow(
		container: HTMLElement,
		fromDomIndex: number,
		toDomIndex: number,
	): void {
		const rows = container.querySelectorAll<HTMLLIElement>(
			'[data-parsons-row]',
		);
		const fromRow = rows[fromDomIndex];
		const toRow = rows[toDomIndex];
		const dataTransfer = makeDataTransfer();
		fireEvent.dragStart(fromRow, { dataTransfer });
		fireEvent.dragOver(toRow, { dataTransfer });
		fireEvent.drop(toRow, { dataTransfer });
		fireEvent.dragEnd(fromRow, { dataTransfer });
	}

	function rowOrder(container: HTMLElement): Array<string | undefined> {
		// eslint-disable-next-line unicorn/prefer-spread -- NodeList iteration; Babel emits unstable code per annotate Pitfall #14
		return Array.from(
			container.querySelectorAll<HTMLLIElement>('[data-parsons-row]'),
		).map((row) => row.dataset.rowOriginalIndex);
	}

	it('dragging a row to a different position reorders the stack', () => {
		const { container } = renderParsons('a;\nb;\nc;');
		const beforeOrder = rowOrder(container);
		dragRow(container, 0, 2);
		const afterOrder = rowOrder(container);
		expect(afterOrder).not.toEqual(beforeOrder);
	});

	it('drop onto self is a no-op (order unchanged)', () => {
		const { container } = renderParsons('a;\nb;\nc;');
		const beforeOrder = rowOrder(container);
		dragRow(container, 1, 1);
		const afterOrder = rowOrder(container);
		expect(afterOrder).toEqual(beforeOrder);
	});
});

describe('parsons lens — unpinned seed (per-mount random)', () => {
	it('rendering without config.seed produces a row stack (per-mount random path)', () => {
		const snippet = embody('a;\nb;\nc;');
		const { container } = render(
			<parsonsLens.Component embodiment={snippet} config={{}} />,
		);
		const rows = container.querySelectorAll('[data-parsons-row]');
		expect(rows).toHaveLength(3);
	});

	it('NaN config.seed falls back to the per-mount random seed (no crash)', () => {
		const snippet = embody('a;\nb;\nc;');
		const { container } = render(
			<parsonsLens.Component
				embodiment={snippet}
				config={{ seed: Number.NaN }}
			/>,
		);
		const rows = container.querySelectorAll('[data-parsons-row]');
		expect(rows).toHaveLength(3);
	});
});

describe('parsons lens — a11y', () => {
	it('score readout carries aria-live="polite"', () => {
		const { container } = renderParsons('a;\nb;');
		expect(
			container
				.querySelector('[data-parsons-score]')
				?.getAttribute('aria-live'),
		).toBe('polite');
	});
});
