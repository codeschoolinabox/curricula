// @vitest-environment jsdom
// cspell:ignore distractor distractors colour

/**
 * Component tests for the `parsons` lens component.
 *
 * **jsdom caveat (load-bearing):** jsdom does NOT implement real HTML5
 * drag-and-drop. These tests prove WIRING only — that the component mounts,
 * renders the DOM contract, and that the DnD handlers are attached and
 * dispatch the pure arrangement transitions. Real drag behavior is a
 * browser-observation concern; the transitions themselves are exhaustively
 * unit-tested in `./arrange.test.ts` (no jsdom). The DataTransfer mock
 * persists one string across a dragStart → drop pair so the
 * `${zone}:${id}` round-trip is exercised; `getData` honors only the
 * `text/plain` format the contract mandates.
 */

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import parsonsCore from '../core.js';
import parsonsLens from '../index.jsx';

afterEach(cleanup);

const THREE_LINE_SOURCE = 'const a = 1;\nconst b = 2;\nconst c = 3;';
const INDENTED_SOURCE = 'if (x) {\n\ty();\n}';

function renderLens(
	source: string,
	overrides?: Parameters<typeof parsonsCore.config>[0],
): HTMLElement {
	const { container } = render(
		<parsonsLens.main
			embodiment={embody(source)}
			config={parsonsCore.config(overrides)}
		/>,
	);
	return container;
}

function makeDataTransfer(): {
	getData: (format: string) => string;
	setData: (format: string, data: string) => void;
	effectAllowed: string;
	dropEffect: string;
} {
	let store = '';
	return {
		getData: (format) => (format === 'text/plain' ? store : ''),
		setData: (_format, data) => {
			store = data;
		},
		effectAllowed: 'all',
		dropEffect: 'move',
	};
}

function elements<E extends Element>(list: ArrayLike<E>): E[] {
	// `Array.from`, not spread: spreading a NodeList needs lib DOM.Iterable,
	// which this tsconfig omits.
	return Array.from(list);
}

function poolLines(container: HTMLElement): HTMLLIElement[] {
	return elements(
		container.querySelectorAll<HTMLLIElement>('[data-parsons-pool] > li'),
	);
}

function poolTexts(container: HTMLElement): string[] {
	return poolLines(container).map((line) => line.textContent ?? '');
}

function queryPoolItem(container: HTMLElement, id: string): HTMLElement | null {
	return container.querySelector<HTMLElement>(
		`[data-parsons-pool] [data-line-id="${id}"]`,
	);
}

function poolItem(container: HTMLElement, id: string): HTMLElement {
	const item = queryPoolItem(container, id);
	if (!item) throw new Error(`missing the pool line ${id}`);
	return item;
}

function querySolutionItem(
	container: HTMLElement,
	id: string,
): HTMLElement | null {
	return container.querySelector<HTMLElement>(
		`[data-parsons-solution] [data-line-id="${id}"]`,
	);
}

function solutionItem(container: HTMLElement, id: string): HTMLElement {
	const item = querySolutionItem(container, id);
	if (!item) throw new Error(`missing the solution line ${id}`);
	return item;
}

function solutionZone(container: HTMLElement): HTMLElement {
	const zone = container.querySelector<HTMLElement>('[data-parsons-solution]');
	if (!zone) throw new Error('missing the solution column');
	return zone;
}

function poolZone(container: HTMLElement): HTMLElement {
	const zone = container.querySelector<HTMLElement>('[data-parsons-pool]');
	if (!zone) throw new Error('missing the pool');
	return zone;
}

function solutionOrder(container: HTMLElement): Array<string | undefined> {
	return elements(
		container.querySelectorAll<HTMLElement>('[data-parsons-solution] > li'),
	).map((line) => line.dataset.lineId);
}

function placeOnZone(container: HTMLElement, id: string): void {
	const transfer = makeDataTransfer();
	fireEvent.dragStart(poolItem(container, id), { dataTransfer: transfer });
	fireEvent.drop(solutionZone(container), { dataTransfer: transfer });
}

function dragSolutionTo(
	container: HTMLElement,
	dragId: string,
	target: HTMLElement,
): void {
	const transfer = makeDataTransfer();
	fireEvent.dragStart(solutionItem(container, dragId), {
		dataTransfer: transfer,
	});
	fireEvent.drop(target, { dataTransfer: transfer });
}

function rootOf(container: HTMLElement): HTMLElement {
	const root = container.querySelector<HTMLElement>('[data-lens="parsons"]');
	if (!root) throw new Error('missing the parsons root');
	return root;
}

function clickOn(container: HTMLElement, selector: string): void {
	const control = container.querySelector<HTMLElement>(selector);
	if (!control) throw new Error(`missing the ${selector} control`);
	fireEvent.click(control);
}

function check(container: HTMLElement): void {
	clickOn(container, '[data-parsons-check]');
}

function reset(container: HTMLElement): void {
	clickOn(container, '[data-parsons-reset]');
}

function toggleView(container: HTMLElement): void {
	clickOn(container, '[data-parsons-view-toggle]');
}

function queryScore(container: HTMLElement): HTMLElement | null {
	return container.querySelector<HTMLElement>('[data-parsons-score]');
}

function scoreValue(container: HTMLElement): string | undefined {
	return queryScore(container)?.dataset.parsonsScore;
}

function correctnessOf(container: HTMLElement, id: string): string | null {
	return querySolutionItem(container, id)?.dataset.correctness ?? null;
}

function indentLevelOf(container: HTMLElement, id: string): string | null {
	return querySolutionItem(container, id)?.dataset.indent ?? null;
}

function queryIndentButton(
	container: HTMLElement,
	id: string,
): HTMLButtonElement | null {
	return (
		querySolutionItem(container, id)?.querySelector<HTMLButtonElement>(
			'[data-parsons-indent]',
		) ?? null
	);
}

function clickIndent(container: HTMLElement, id: string): void {
	const button = queryIndentButton(container, id);
	if (!button) throw new Error(`missing the indent button on ${id}`);
	fireEvent.click(button);
}

function queryOutdentButton(
	container: HTMLElement,
	id: string,
): HTMLButtonElement | null {
	return (
		querySolutionItem(container, id)?.querySelector<HTMLButtonElement>(
			'[data-parsons-outdent]',
		) ?? null
	);
}

function clickOutdent(container: HTMLElement, id: string): void {
	const button = queryOutdentButton(container, id);
	if (!button) throw new Error(`missing the outdent button on ${id}`);
	fireEvent.click(button);
}

function indentSteps(container: HTMLElement, id: string): number {
	return (
		querySolutionItem(container, id)?.querySelectorAll(
			'[data-parsons-indent-step]',
		).length ?? 0
	);
}

describe('parsons lens — Lens object shape', () => {
	it('is named parsons', () => {
		expect(parsonsLens.name).toBe('parsons');
	});

	it('declares the source phase as its pedagogical target', () => {
		expect(parsonsLens.phase).toBe('source');
	});

	it('is frozen at construction', () => {
		expect(Object.isFrozen(parsonsLens)).toBe(true);
	});
});

describe('parsons component — mount + shuffled pool', () => {
	describe('Zero — degenerate program does not crash', () => {
		it('renders without throwing on an empty program', () => {
			expect(() => renderLens('')).not.toThrow();
		});

		it('renders an empty pool (no lines) for an empty program', () => {
			expect(poolLines(renderLens('')).length).toBe(0);
		});
	});

	describe('One — single-line program', () => {
		it('renders exactly one pool line', () => {
			expect(poolLines(renderLens('const x = 1;')).length).toBe(1);
		});

		it('renders the line source text inside the pool line', () => {
			expect(poolTexts(renderLens('const x = 1;'))[0]).toContain(
				'const x = 1;',
			);
		});
	});

	describe('Many — multi-line program', () => {
		it('renders one pool line per non-blank source line', () => {
			expect(poolLines(renderLens(THREE_LINE_SOURCE)).length).toBe(3);
		});

		it('renders every line, regardless of shuffled order', () => {
			const rendered = poolTexts(renderLens(THREE_LINE_SOURCE));
			expect(
				['const a = 1;', 'const b = 2;', 'const c = 3;'].every((code) =>
					rendered.some((text) => text.includes(code)),
				),
			).toBe(true);
		});

		it('renders ALL pool lines as draggable (not just the first)', () => {
			expect(
				poolLines(renderLens(THREE_LINE_SOURCE)).map((line) => line.draggable),
			).toEqual([true, true, true]);
		});

		it('drops blank lines from the pool', () => {
			expect(
				poolLines(renderLens('const a = 1;\n\n\nconst b = 2;')).length,
			).toBe(2);
		});
	});

	describe('Boundary — distractor cap + text-only applicability', () => {
		it('suppresses a // distractor line when maxDistractors is 0 (parse path is parseParsons, not a naive split)', () => {
			expect(
				poolLines(
					renderLens('const good = 1;\nconst bad = 2; // distractor', {
						maxDistractors: 0,
					}),
				).length,
			).toBe(1);
		});

		it('never renders the word distractor when the distractor is suppressed', () => {
			expect(
				poolTexts(
					renderLens('const good = 1;\nconst bad = 2; // distractor', {
						maxDistractors: 0,
					}),
				).join('\n'),
			).not.toContain('distractor');
		});

		it('strips the // distractor marker from a distractor shown in the pool', () => {
			expect(
				poolTexts(
					renderLens('const good = 1;\nconst bad = 2; // distractor'),
				).join('\n'),
			).not.toContain('// distractor');
		});

		it('renders the pool even when the program does not parse (text-only, no parse gate)', () => {
			expect(poolLines(renderLens('1 +')).length).toBe(1);
		});
	});

	describe('Interface — DOM contract invariants', () => {
		it('renders a root with data-lens="parsons"', () => {
			expect(
				renderLens('const x = 1;').querySelector('[data-lens="parsons"]'),
			).not.toBeNull();
		});

		it('renders the pool as a <ul> (the solution column owns <ol>)', () => {
			expect(poolZone(renderLens('const x = 1;')).tagName).toBe('UL');
		});

		it('defaults data-view-mode="work"', () => {
			expect(rootOf(renderLens('const x = 1;')).dataset.viewMode).toBe('work');
		});

		it('seeds data-view-mode="complete" from config', () => {
			expect(
				rootOf(renderLens('const x = 1;', { viewMode: 'complete' })).dataset
					.viewMode,
			).toBe('complete');
		});

		it('defaults data-can-indent="true"', () => {
			expect(rootOf(renderLens('const x = 1;')).dataset.canIndent).toBe('true');
		});

		it('reflects data-can-indent="false" when canIndent is disabled', () => {
			expect(
				rootOf(renderLens('const x = 1;', { canIndent: false })).dataset
					.canIndent,
			).toBe('false');
		});
	});
});

describe('parsons component — two-column board + native DnD (place / return)', () => {
	describe('Structure — two-column board', () => {
		it('renders a board element', () => {
			expect(
				renderLens(THREE_LINE_SOURCE).querySelector('[data-parsons-board]'),
			).not.toBeNull();
		});

		it('the board contains the pool', () => {
			expect(
				renderLens(THREE_LINE_SOURCE).querySelector(
					'[data-parsons-board] [data-parsons-pool]',
				),
			).not.toBeNull();
		});

		it('the board contains the solution column', () => {
			expect(
				renderLens(THREE_LINE_SOURCE).querySelector(
					'[data-parsons-board] [data-parsons-solution]',
				),
			).not.toBeNull();
		});

		it('renders the solution column as an <ol> (ordered)', () => {
			expect(solutionZone(renderLens(THREE_LINE_SOURCE)).tagName).toBe('OL');
		});

		it('starts with an empty solution column', () => {
			expect(solutionOrder(renderLens(THREE_LINE_SOURCE)).length).toBe(0);
		});

		it('starts with all lines in the pool', () => {
			expect(poolLines(renderLens(THREE_LINE_SOURCE)).length).toBe(3);
		});
	});

	describe('onDragOver — the load-bearing preventDefault (without it onDrop never fires)', () => {
		it('cancels dragover over the solution zone', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			expect(
				fireEvent.dragOver(solutionZone(container), {
					dataTransfer: makeDataTransfer(),
				}),
			).toBe(false);
		});

		it('cancels dragover over the pool zone', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			expect(
				fireEvent.dragOver(poolZone(container), {
					dataTransfer: makeDataTransfer(),
				}),
			).toBe(false);
		});
	});

	describe('onDragStart — encodes zone:id into dataTransfer (the mechanism, not just the outcome)', () => {
		it('writes "pool:<id>" when dragging a pool line', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			const transfer = makeDataTransfer();
			fireEvent.dragStart(poolItem(container, 'line-0'), {
				dataTransfer: transfer,
			});
			expect(transfer.getData('text/plain')).toBe('pool:line-0');
		});

		it('writes "solution:<id>" when dragging a placed line', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-0');
			const transfer = makeDataTransfer();
			fireEvent.dragStart(solutionItem(container, 'line-0'), {
				dataTransfer: transfer,
			});
			expect(transfer.getData('text/plain')).toBe('solution:line-0');
		});

		it('renders placed solution lines as draggable (so they can be returned / reordered)', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-0');
			expect(solutionItem(container, 'line-0').getAttribute('draggable')).toBe(
				'true',
			);
		});
	});

	describe('place — drag a pool line into the solution', () => {
		it('the dropped line appears in the solution', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-0');
			expect(querySolutionItem(container, 'line-0')).not.toBeNull();
		});

		it('the dropped line leaves the pool', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-0');
			expect(queryPoolItem(container, 'line-0')).toBeNull();
		});

		it('APPENDS successive lines dropped on the empty zone area (not prepend)', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-0');
			placeOnZone(container, 'line-1');
			expect(solutionOrder(container)).toEqual(['line-0', 'line-1']);
		});

		it('inserts before a NON-FIRST drop-target line (real index derivation, not hardcoded 0)', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-0');
			placeOnZone(container, 'line-1');
			const transfer = makeDataTransfer();
			fireEvent.dragStart(poolItem(container, 'line-2'), {
				dataTransfer: transfer,
			});
			fireEvent.drop(solutionItem(container, 'line-1'), {
				dataTransfer: transfer,
			});
			expect(solutionOrder(container)).toEqual(['line-0', 'line-2', 'line-1']);
		});
	});

	describe('return — drag a placed line back to the pool', () => {
		it('the returned line re-appears in the pool', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-0');
			dragSolutionTo(container, 'line-0', poolZone(container));
			expect(queryPoolItem(container, 'line-0')).not.toBeNull();
		});

		it('the returned line leaves the solution', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-0');
			dragSolutionTo(container, 'line-0', poolZone(container));
			expect(querySolutionItem(container, 'line-0')).toBeNull();
		});
	});

	describe('routing safety — out-of-scope drops are safe no-ops', () => {
		it('a pool → pool drop keeps the pool intact', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			const transfer = makeDataTransfer();
			fireEvent.dragStart(poolItem(container, 'line-0'), {
				dataTransfer: transfer,
			});
			fireEvent.drop(poolZone(container), { dataTransfer: transfer });
			expect(poolLines(container).length).toBe(3);
		});

		it('a pool → pool drop places nothing in the solution', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			const transfer = makeDataTransfer();
			fireEvent.dragStart(poolItem(container, 'line-0'), {
				dataTransfer: transfer,
			});
			fireEvent.drop(poolZone(container), { dataTransfer: transfer });
			expect(solutionOrder(container).length).toBe(0);
		});
	});
});

describe('parsons component — reorder within the solution column', () => {
	function renderThreePlaced(): HTMLElement {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		placeOnZone(container, 'line-2');
		return container;
	}

	function reorderOnto(
		container: HTMLElement,
		dragId: string,
		targetId: string,
	): void {
		dragSolutionTo(container, dragId, solutionItem(container, targetId));
	}

	it('precondition: the three lines are placed in order', () => {
		expect(solutionOrder(renderThreePlaced())).toEqual([
			'line-0',
			'line-1',
			'line-2',
		]);
	});

	it('moves a line UP: drop the last line onto the first inserts it before the first', () => {
		const container = renderThreePlaced();
		reorderOnto(container, 'line-2', 'line-0');
		expect(solutionOrder(container)).toEqual(['line-2', 'line-0', 'line-1']);
	});

	it('moves a line UP to a NON-FIRST position (conditional shift, not always-subtract-1)', () => {
		const container = renderThreePlaced();
		reorderOnto(container, 'line-2', 'line-1');
		expect(solutionOrder(container)).toEqual(['line-0', 'line-2', 'line-1']);
	});

	it('moves a line DOWN: drop the first onto the last inserts it BEFORE the last (removal-shift)', () => {
		const container = renderThreePlaced();
		reorderOnto(container, 'line-0', 'line-2');
		expect(solutionOrder(container)).toEqual(['line-1', 'line-0', 'line-2']);
	});

	it('reorders to the END when dropped on the column empty area', () => {
		const container = renderThreePlaced();
		dragSolutionTo(container, 'line-0', solutionZone(container));
		expect(solutionOrder(container)).toEqual(['line-1', 'line-2', 'line-0']);
	});

	it('dropping a line onto itself is a no-op (order unchanged)', () => {
		const container = renderThreePlaced();
		reorderOnto(container, 'line-1', 'line-1');
		expect(solutionOrder(container)).toEqual(['line-0', 'line-1', 'line-2']);
	});

	it('dropping a line onto its immediate successor is a no-op (it is already before it)', () => {
		const container = renderThreePlaced();
		reorderOnto(container, 'line-0', 'line-1');
		expect(solutionOrder(container)).toEqual(['line-0', 'line-1', 'line-2']);
	});

	it('reorder does not leak a line into the pool', () => {
		const container = renderThreePlaced();
		reorderOnto(container, 'line-2', 'line-0');
		expect(poolLines(container).length).toBe(0);
	});

	it('reorder keeps all three lines in the solution', () => {
		const container = renderThreePlaced();
		reorderOnto(container, 'line-2', 'line-0');
		expect(solutionOrder(container).length).toBe(3);
	});
});

describe('parsons component — indent / outdent controls', () => {
	it('placed lines render the indent control when canIndent (default)', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		expect(queryIndentButton(container, 'line-0')).not.toBeNull();
	});

	it('a freshly placed line starts at data-indent="0"', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		expect(indentLevelOf(container, 'line-0')).toBe('0');
	});

	it('clicking indent once raises the level to 1', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		clickIndent(container, 'line-0');
		expect(indentLevelOf(container, 'line-0')).toBe('1');
	});

	it('clicking indent twice raises the level to 2', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		clickIndent(container, 'line-0');
		clickIndent(container, 'line-0');
		expect(indentLevelOf(container, 'line-0')).toBe('2');
	});

	it('clicking outdent after two indents lowers the level to 1', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		clickIndent(container, 'line-0');
		clickIndent(container, 'line-0');
		clickOutdent(container, 'line-0');
		expect(indentLevelOf(container, 'line-0')).toBe('1');
	});

	it('outdent returns the level to 0', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		clickIndent(container, 'line-0');
		clickOutdent(container, 'line-0');
		expect(indentLevelOf(container, 'line-0')).toBe('0');
	});

	it('shows NO outdent button at level 0 (the floor is enforced by its absence)', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		expect(queryOutdentButton(container, 'line-0')).toBeNull();
	});

	it('the outdent button appears once the line is indented', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		clickIndent(container, 'line-0');
		expect(queryOutdentButton(container, 'line-0')).not.toBeNull();
	});

	it('the outdent button disappears again back at level 0', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		clickIndent(container, 'line-0');
		clickOutdent(container, 'line-0');
		expect(queryOutdentButton(container, 'line-0')).toBeNull();
	});

	it('renders one indent-guide step per indent level (depth indicator)', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		clickIndent(container, 'line-0');
		clickIndent(container, 'line-0');
		expect(indentSteps(container, 'line-0')).toBe(2);
	});

	it('a flush (level 0) line renders no indent-guide steps', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		expect(indentSteps(container, 'line-0')).toBe(0);
	});

	it('indenting one placed line raises only that line', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		clickIndent(container, 'line-0');
		clickIndent(container, 'line-0');
		expect(indentLevelOf(container, 'line-0')).toBe('2');
	});

	it('indenting one placed line leaves the other untouched (per-id dispatch)', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		clickIndent(container, 'line-0');
		expect(indentLevelOf(container, 'line-1')).toBe('0');
	});

	it('hides the indent control when canIndent is false', () => {
		const container = renderLens(THREE_LINE_SOURCE, { canIndent: false });
		placeOnZone(container, 'line-0');
		expect(queryIndentButton(container, 'line-0')).toBeNull();
	});

	it('hides the outdent control when canIndent is false', () => {
		const container = renderLens(THREE_LINE_SOURCE, { canIndent: false });
		placeOnZone(container, 'line-0');
		expect(queryOutdentButton(container, 'line-0')).toBeNull();
	});

	it('renders no guide steps when canIndent is false (lines render flush)', () => {
		const container = renderLens(THREE_LINE_SOURCE, { canIndent: false });
		placeOnZone(container, 'line-0');
		expect(indentSteps(container, 'line-0')).toBe(0);
	});

	it('pool lines never carry indent controls', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		expect(
			poolItem(container, 'line-0').querySelector(
				'[data-parsons-indent], [data-parsons-outdent]',
			),
		).toBeNull();
	});

	it('indent level PERSISTS across a reorder within the solution', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		clickIndent(container, 'line-0');
		clickIndent(container, 'line-0');
		dragSolutionTo(container, 'line-0', solutionZone(container));
		expect(indentLevelOf(container, 'line-0')).toBe('2');
	});

	it('indent level RESETS to 0 on a pool round-trip (the pool carries no indent)', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		clickIndent(container, 'line-0');
		dragSolutionTo(container, 'line-0', poolZone(container));
		placeOnZone(container, 'line-0');
		expect(indentLevelOf(container, 'line-0')).toBe('0');
	});
});

describe('parsons component — Check / Reset / per-line feedback + score', () => {
	it('renders a Check control', () => {
		expect(
			renderLens(THREE_LINE_SOURCE).querySelector('[data-parsons-check]'),
		).not.toBeNull();
	});

	it('renders a Reset control', () => {
		expect(
			renderLens(THREE_LINE_SOURCE).querySelector('[data-parsons-reset]'),
		).not.toBeNull();
	});

	it('shows no per-line correctness before the first Check', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		expect(correctnessOf(container, 'line-0')).toBeNull();
	});

	it('shows no score before the first Check', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		expect(queryScore(container)).toBeNull();
	});

	it('on Check, a fully correct arrangement marks every line correct', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		placeOnZone(container, 'line-2');
		check(container);
		expect(
			['line-0', 'line-1', 'line-2'].map((id) => correctnessOf(container, id)),
		).toEqual(['correct', 'correct', 'correct']);
	});

	it('a fully correct Check scores 100', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		placeOnZone(container, 'line-2');
		check(container);
		expect(scoreValue(container)).toBe('100');
	});

	it('the score is an aria-live region (announced when it changes)', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		check(container);
		expect(queryScore(container)?.getAttribute('aria-live')).toBe('polite');
	});

	it('on Check with NOTHING placed, the score is 0', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		check(container);
		expect(scoreValue(container)).toBe('0');
	});

	it('on Check with NOTHING placed, no pool line is flagged (a missing line must not be identifiable)', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		check(container);
		expect(
			['line-0', 'line-1', 'line-2'].every(
				(id) => !('parsonsUnplaced' in poolItem(container, id).dataset),
			),
		).toBe(true);
	});

	it('on Check, a flat placement of an indented model flags the nested line wrong-indent', () => {
		const container = renderLens(INDENTED_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		placeOnZone(container, 'line-2');
		check(container);
		expect(correctnessOf(container, 'line-1')).toBe('wrong-indent');
	});

	it('the order-correct flush line stays correct alongside a wrong-indent sibling', () => {
		const container = renderLens(INDENTED_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		placeOnZone(container, 'line-2');
		check(container);
		expect(correctnessOf(container, 'line-0')).toBe('correct');
	});

	it('one wrong-indent line of three scores 67', () => {
		const container = renderLens(INDENTED_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		placeOnZone(container, 'line-2');
		check(container);
		expect(scoreValue(container)).toBe('67');
	});

	it('fixing the indent after Check clears the stale score', () => {
		const container = renderLens(INDENTED_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		placeOnZone(container, 'line-2');
		check(container);
		clickIndent(container, 'line-1');
		expect(queryScore(container)).toBeNull();
	});

	it('re-Check after fixing the indent marks the line correct (Check is re-runnable, the live arrangement flows in)', () => {
		const container = renderLens(INDENTED_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		placeOnZone(container, 'line-2');
		check(container);
		clickIndent(container, 'line-1');
		check(container);
		expect(correctnessOf(container, 'line-1')).toBe('correct');
	});

	it('re-Check after fixing the indent scores a fresh 100', () => {
		const container = renderLens(INDENTED_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		placeOnZone(container, 'line-2');
		check(container);
		clickIndent(container, 'line-1');
		check(container);
		expect(scoreValue(container)).toBe('100');
	});

	it('a solution line left in the pool lowers the score to 67', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		check(container);
		expect(scoreValue(container)).toBe('67');
	});

	it('the missing line does not stop placed lines from grading correct', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		check(container);
		expect(correctnessOf(container, 'line-0')).toBe('correct');
	});

	it('the missing line carries no unplaced marker in the pool', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		check(container);
		expect('parsonsUnplaced' in poolItem(container, 'line-2').dataset).toBe(
			false,
		);
	});

	it('the missing line carries no data-correctness in the pool', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		check(container);
		expect(poolItem(container, 'line-2').dataset.correctness).toBeUndefined();
	});

	it('an indent edit after Check clears the per-line correctness', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		placeOnZone(container, 'line-2');
		check(container);
		clickIndent(container, 'line-0');
		expect(correctnessOf(container, 'line-0')).toBeNull();
	});

	it('an indent edit after Check clears the score', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		placeOnZone(container, 'line-2');
		check(container);
		clickIndent(container, 'line-0');
		expect(queryScore(container)).toBeNull();
	});

	it('a DRAG (place) after Check also clears the score (not just indent edits)', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		check(container);
		placeOnZone(container, 'line-2');
		expect(queryScore(container)).toBeNull();
	});

	it('a DRAG (place) after Check clears the per-line correctness', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		check(container);
		placeOnZone(container, 'line-2');
		expect(correctnessOf(container, 'line-0')).toBeNull();
	});

	it('returning a placed line to the pool after Check clears the score', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		check(container);
		dragSolutionTo(container, 'line-0', poolZone(container));
		expect(queryScore(container)).toBeNull();
	});

	it('returning a placed line to the pool after Check clears the per-line correctness', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		check(container);
		dragSolutionTo(container, 'line-0', poolZone(container));
		expect(correctnessOf(container, 'line-1')).toBeNull();
	});

	it('on Check, a solution line and a distractor are indistinguishable in the pool (anti-leak regression guard)', () => {
		const container = renderLens(
			'const good = 1;\nconst bad = 2; // distractor',
		);
		check(container);
		expect(
			['line-0', 'line-1'].every(
				(id) => !('parsonsUnplaced' in poolItem(container, id).dataset),
			),
		).toBe(true);
	});

	it('Reset works before any Check: the solution empties', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		reset(container);
		expect(solutionOrder(container).length).toBe(0);
	});

	it('Reset works before any Check: the pool re-fills', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		reset(container);
		expect(poolLines(container).length).toBe(3);
	});

	it('Reset after Check empties the solution', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		check(container);
		reset(container);
		expect(solutionOrder(container).length).toBe(0);
	});

	it('Reset after Check clears the score', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		check(container);
		reset(container);
		expect(queryScore(container)).toBeNull();
	});

	it('passes canIndent=false to the grader: a flat placement of an indented model marks the nested line correct', () => {
		const container = renderLens(INDENTED_SOURCE, { canIndent: false });
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		placeOnZone(container, 'line-2');
		check(container);
		expect(correctnessOf(container, 'line-1')).toBe('correct');
	});

	it('passes canIndent=false to the grader: the flat placement scores 100', () => {
		const container = renderLens(INDENTED_SOURCE, { canIndent: false });
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		placeOnZone(container, 'line-2');
		check(container);
		expect(scoreValue(container)).toBe('100');
	});
});

describe('parsons component — view-mode toggle / complete view', () => {
	function queryToggle(container: HTMLElement): HTMLButtonElement | null {
		return container.querySelector<HTMLButtonElement>(
			'[data-parsons-view-toggle]',
		);
	}
	function queryComplete(container: HTMLElement): HTMLElement | null {
		return container.querySelector<HTMLElement>('[data-parsons-complete]');
	}

	it('renders a single view-toggle control, labelled for the action', () => {
		expect(queryToggle(renderLens(THREE_LINE_SOURCE))?.textContent).toContain(
			'Show solution',
		);
	});

	it('aria-pressed starts false (solution not showing)', () => {
		expect(
			queryToggle(renderLens(THREE_LINE_SOURCE))?.getAttribute('aria-pressed'),
		).toBe('false');
	});

	it('aria-pressed reads true after toggling to the solution', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		toggleView(container);
		expect(queryToggle(container)?.getAttribute('aria-pressed')).toBe('true');
	});

	it('the label flips to "Back to exercise" in the complete view', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		toggleView(container);
		expect(queryToggle(container)?.textContent).toContain('Back to exercise');
	});

	it('a second toggle returns aria-pressed to false', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		toggleView(container);
		toggleView(container);
		expect(queryToggle(container)?.getAttribute('aria-pressed')).toBe('false');
	});

	it('defaults to the work view on the root', () => {
		expect(rootOf(renderLens(THREE_LINE_SOURCE)).dataset.viewMode).toBe('work');
	});

	it('the work view shows the board', () => {
		expect(
			renderLens(THREE_LINE_SOURCE).querySelector('[data-parsons-board]'),
		).not.toBeNull();
	});

	it('the work view shows no complete pane', () => {
		expect(queryComplete(renderLens(THREE_LINE_SOURCE))).toBeNull();
	});

	it('toggling to complete flips the root view mode', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		toggleView(container);
		expect(rootOf(container).dataset.viewMode).toBe('complete');
	});

	it('toggling to complete shows the read-only solution pane', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		toggleView(container);
		expect(queryComplete(container)).not.toBeNull();
	});

	it('toggling to complete hides the board', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		toggleView(container);
		expect(container.querySelector('[data-parsons-board]')).toBeNull();
	});

	it('the complete view renders the model solution at level*indentSize (default 4)', () => {
		const container = renderLens(INDENTED_SOURCE);
		toggleView(container);
		expect(queryComplete(container)?.textContent).toBe('if (x) {\n    y();\n}');
	});

	it('the complete view is a <pre> (whitespace preserved without extra CSS)', () => {
		const container = renderLens(INDENTED_SOURCE);
		toggleView(container);
		expect(queryComplete(container)?.tagName).toBe('PRE');
	});

	it('the complete view honors a custom indentSize (reads indentSize, not hardcoded)', () => {
		const container = renderLens(INDENTED_SOURCE, { indentSize: 2 });
		toggleView(container);
		expect(queryComplete(container)?.textContent).toBe('if (x) {\n  y();\n}');
	});

	it('the complete view multiplies level*indentSize (a level-2 line gets 2x spaces)', () => {
		const container = renderLens('if (x) {\n\tif (y) {\n\t\tz();\n\t}\n}', {
			indentSize: 4,
		});
		toggleView(container);
		expect(queryComplete(container)?.textContent).toBe(
			'if (x) {\n    if (y) {\n        z();\n    }\n}',
		);
	});

	it('the complete view shows only solution lines — distractors are excluded', () => {
		const container = renderLens(
			'const good = 1;\nconst bad = 2; // distractor',
		);
		toggleView(container);
		expect(queryComplete(container)?.textContent).toBe('const good = 1;');
	});

	it('the complete view renders an empty pane for an empty program (no crash)', () => {
		const container = renderLens('');
		toggleView(container);
		expect(queryComplete(container)?.textContent).toBe('');
	});

	it('toggling back to work restores the board', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		toggleView(container);
		toggleView(container);
		expect(container.querySelector('[data-parsons-board]')).not.toBeNull();
	});

	it('toggling PRESERVES the learner arrangement (a self-check, not a reset)', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		toggleView(container);
		toggleView(container);
		expect(solutionOrder(container)).toEqual(['line-0', 'line-1']);
	});

	it('toggling leaves the un-placed line in the pool', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		toggleView(container);
		toggleView(container);
		expect(poolLines(container).length).toBe(1);
	});

	it('toggling does NOT clear the score (a toggle is not an arrangement edit)', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		check(container);
		toggleView(container);
		toggleView(container);
		expect(queryScore(container)).not.toBeNull();
	});

	it('toggling does NOT clear the per-line correctness', () => {
		const container = renderLens(THREE_LINE_SOURCE);
		placeOnZone(container, 'line-0');
		check(container);
		toggleView(container);
		toggleView(container);
		expect(correctnessOf(container, 'line-0')).not.toBeNull();
	});

	it('seeds the complete view from config.viewMode', () => {
		expect(
			queryComplete(renderLens(INDENTED_SOURCE, { viewMode: 'complete' })),
		).not.toBeNull();
	});
});

describe('parsons component — info panel (legend + distractor-count + hints)', () => {
	function queryLegend(container: HTMLElement): HTMLElement | null {
		return container.querySelector<HTMLElement>('[data-parsons-legend]');
	}
	function queryDistractorCount(container: HTMLElement): HTMLElement | null {
		return container.querySelector<HTMLElement>(
			'[data-parsons-distractor-count]',
		);
	}
	function queryHints(container: HTMLElement): HTMLElement | null {
		return container.querySelector<HTMLElement>('[data-parsons-hints]');
	}
	function hintEntries(container: HTMLElement): Element[] {
		return elements(queryHints(container)?.children ?? []);
	}
	function hintProjection(entry: Element): {
		tag: string;
		open: boolean;
		summary: string | null | undefined;
		body: string | null | undefined;
	} {
		return {
			tag: entry.tagName,
			open: entry.hasAttribute('open'),
			summary: entry.querySelector('summary')?.textContent,
			body: entry.querySelector('pre')?.textContent,
		};
	}

	describe('Interface — feedback legend', () => {
		it('renders a data-parsons-legend element', () => {
			expect(queryLegend(renderLens('const a = 1;'))).not.toBeNull();
		});

		it('is a <details> element', () => {
			expect(queryLegend(renderLens('const a = 1;'))?.tagName).toBe('DETAILS');
		});

		it('is collapsed by default (compact surface)', () => {
			expect(
				queryLegend(renderLens('const a = 1;'))?.hasAttribute('open'),
			).toBe(false);
		});

		it('lists exactly the three placed feedback states — never distractor or unplaced (both would leak the distractors)', () => {
			const rows = elements(
				queryLegend(renderLens('const a = 1;'))?.querySelectorAll<HTMLElement>(
					'[data-legend-state]',
				) ?? [],
			);
			expect(new Set(rows.map((row) => row.dataset.legendState))).toEqual(
				new Set(['correct', 'wrong-order', 'wrong-indent']),
			);
		});

		it('every legend row carries visible learner-facing copy (not just colour hooks)', () => {
			const rows = elements(
				queryLegend(renderLens('const a = 1;'))?.querySelectorAll(
					'[data-legend-state]',
				) ?? [],
			);
			expect(
				rows.every((row) => (row.textContent ?? '').trim().length > 0),
			).toBe(true);
		});

		it('shows the legend in the complete view too (it sits above the view branch)', () => {
			expect(
				queryLegend(renderLens(INDENTED_SOURCE, { viewMode: 'complete' })),
			).not.toBeNull();
		});
	});

	describe('Interface — distractor-count hint', () => {
		function countSummary(container: HTMLElement): string {
			return (
				queryDistractorCount(container)?.querySelector('summary')
					?.textContent ?? ''
			);
		}

		it('does NOT leak the count in the collapsed summary (the number is a spoiler)', () => {
			expect(
				countSummary(
					renderLens('const good = 1;\nconst bad = 2; // distractor'),
				),
			).not.toMatch(/\d/);
		});

		it('reveals "extra lines: N" in the expandable body', () => {
			expect(
				queryDistractorCount(
					renderLens('const good = 1;\nconst bad = 2; // distractor'),
				)?.textContent,
			).toContain('extra lines: 1');
		});

		it('is a <details> element', () => {
			expect(
				queryDistractorCount(
					renderLens('const good = 1;\nconst bad = 2; // distractor'),
				)?.tagName,
			).toBe('DETAILS');
		});

		it('is collapsed by default', () => {
			expect(
				queryDistractorCount(
					renderLens('const good = 1;\nconst bad = 2; // distractor'),
				)?.hasAttribute('open'),
			).toBe(false);
		});

		it('counts every selected distractor in the body', () => {
			expect(
				queryDistractorCount(
					renderLens(
						'const good = 1;\nconst x = 2; // distractor\nconst y = 3; // distractor',
					),
				)?.textContent,
			).toContain('extra lines: 2');
		});

		it('Boundary — counts the SELECTED count, not the declared count, when maxDistractors caps below declared', () => {
			expect(
				queryDistractorCount(
					renderLens(
						'const a = 1;\nconst x = 2; // distractor\nconst y = 3; // distractor\nconst z = 4; // distractor',
						{ maxDistractors: 2 },
					),
				)?.textContent,
			).toContain('extra lines: 2');
		});

		it('Zero — is absent when the program declares no distractors', () => {
			expect(
				queryDistractorCount(renderLens('const a = 1;\nconst b = 2;')),
			).toBeNull();
		});

		it('Boundary — is absent when maxDistractors is 0 (distractors suppressed)', () => {
			expect(
				queryDistractorCount(
					renderLens('const good = 1;\nconst bad = 2; // distractor', {
						maxDistractors: 0,
					}),
				),
			).toBeNull();
		});

		it('shows the distractor count in the complete view too (above the view branch)', () => {
			expect(
				queryDistractorCount(
					renderLens('const good = 1;\nconst bad = 2; // distractor', {
						viewMode: 'complete',
					}),
				),
			).not.toBeNull();
		});
	});

	describe('Interface — hint blocks', () => {
		it('Zero — renders no data-parsons-hints container when the program has no block comments', () => {
			expect(queryHints(renderLens('const a = 1;\nconst b = 2;'))).toBeNull();
		});

		it('a plain block comment becomes a collapsed <details> with the default "Hint" label', () => {
			const entries = hintEntries(
				renderLens('const a = 1;\n/* think about the base case */'),
			);
			expect(hintProjection(entries[0])).toEqual({
				tag: 'DETAILS',
				open: false,
				summary: 'Hint',
				body: 'think about the base case',
			});
		});

		it('a parsons-collapse: marker CUSTOMIZES the summary label (overrides the default)', () => {
			const entries = hintEntries(
				renderLens(
					'const a = 1;\n/* parsons-collapse: Big picture\nguard the base case first */',
				),
			);
			expect(hintProjection(entries[0])).toEqual({
				tag: 'DETAILS',
				open: false,
				summary: 'Big picture',
				body: 'guard the base case first',
			});
		});

		it('an empty parsons-collapse: marker falls back to the default "Hint" label', () => {
			const entries = hintEntries(
				renderLens('const a = 1;\n/* parsons-collapse: */'),
			);
			expect(entries[0]?.querySelector('summary')?.textContent).toBe('Hint');
		});

		it('Many — renders multiple hint blocks in source order (each its own toggle)', () => {
			const entries = hintEntries(
				renderLens(
					'/* first note */\nconst a = 1;\n/* parsons-collapse: Two\nsecond note */',
				),
			);
			expect(entries.map((entry) => hintProjection(entry))).toEqual([
				{ tag: 'DETAILS', open: false, summary: 'Hint', body: 'first note' },
				{ tag: 'DETAILS', open: false, summary: 'Two', body: 'second note' },
			]);
		});

		it('renders the summary + body as TEXT, never as HTML (no injection on either field)', () => {
			const entries = hintEntries(
				renderLens(
					'const a = 1;\n/* parsons-collapse: <img src=x onerror=alert(1)>\n<b>body</b> */',
				),
			);
			expect({
				injected: entries[0]?.querySelector('img, b'),
				summary: entries[0]?.querySelector('summary')?.textContent,
				body: entries[0]?.querySelector('pre')?.textContent,
			}).toEqual({
				injected: null,
				summary: '<img src=x onerror=alert(1)>',
				body: '<b>body</b>',
			});
		});

		it('Zero — a hint-only source renders the hint without crashing', () => {
			expect(hintEntries(renderLens('/* only a hint, no code */')).length).toBe(
				1,
			);
		});

		it('a hint-only source renders no pool lines', () => {
			expect(poolLines(renderLens('/* only a hint, no code */')).length).toBe(
				0,
			);
		});

		it('shows hints in the complete view too (above the view branch)', () => {
			expect(
				queryHints(
					renderLens('const a = 1;\n/* a note */', {
						viewMode: 'complete',
					}),
				),
			).not.toBeNull();
		});
	});
});

describe('parsons component — attempt-history modal', () => {
	function openHistory(container: HTMLElement): void {
		clickOn(container, '[data-parsons-history-open]');
	}
	function queryModal(container: HTMLElement): HTMLElement | null {
		return container.querySelector<HTMLElement>('[data-parsons-history-modal]');
	}
	function attemptRows(container: HTMLElement): HTMLElement[] {
		return elements(
			queryModal(container)?.querySelectorAll<HTMLElement>(
				'[data-parsons-attempt]',
			) ?? [],
		);
	}
	function snapshotLines(row: HTMLElement): HTMLElement[] {
		return elements(row.querySelectorAll<HTMLElement>('[data-snapshot-line]'));
	}

	describe('Interface — open / close', () => {
		it('renders a data-parsons-history-open control from mount', () => {
			expect(
				renderLens(THREE_LINE_SOURCE).querySelector(
					'[data-parsons-history-open]',
				),
			).not.toBeNull();
		});

		it('the modal is absent until opened (React-state, not always in the DOM)', () => {
			expect(queryModal(renderLens(THREE_LINE_SOURCE))).toBeNull();
		});

		it('the modal appears when opened', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			openHistory(container);
			expect(queryModal(container)).not.toBeNull();
		});

		it('the modal is a role="dialog"', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			openHistory(container);
			expect(queryModal(container)?.getAttribute('role')).toBe('dialog');
		});

		it('closes on the close button', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			openHistory(container);
			clickOn(container, '[data-parsons-history-close]');
			expect(queryModal(container)).toBeNull();
		});

		it('closes on Escape', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			openHistory(container);
			fireEvent.keyDown(queryModal(container) ?? container, {
				key: 'Escape',
			});
			expect(queryModal(container)).toBeNull();
		});

		it('re-opening after close still shows the logged history (modal close is not history clear)', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-0');
			check(container);
			openHistory(container);
			clickOn(container, '[data-parsons-history-close]');
			openHistory(container);
			expect(attemptRows(container).length).toBe(1);
		});
	});

	describe('Logging — each Check appends one attempt', () => {
		it('Zero — before any Check the modal lists no attempts', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			openHistory(container);
			expect(attemptRows(container).length).toBe(0);
		});

		it('One — a single Check logs exactly one attempt', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-0');
			check(container);
			openHistory(container);
			expect(attemptRows(container).length).toBe(1);
		});

		it('one Check still renders the live score (logging does not swallow it)', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-0');
			check(container);
			expect(queryScore(container)).not.toBeNull();
		});

		it('a zero-program Check logs a vacuous solved attempt (total 0 is still an attempt)', () => {
			const container = renderLens('');
			check(container);
			openHistory(container);
			expect(attemptRows(container)[0]?.dataset.attemptSuccess).toBe('true');
		});

		it('a zero-program Check logs a 100% score', () => {
			const container = renderLens('');
			check(container);
			openHistory(container);
			expect(attemptRows(container)[0]?.textContent).toContain('100');
		});

		it('Many — N Checks accumulate N attempts (history is not cleared by re-Check)', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-0');
			check(container);
			placeOnZone(container, 'line-1');
			check(container);
			openHistory(container);
			expect(attemptRows(container).length).toBe(2);
		});

		it('a solved attempt reads as a pass', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-0');
			placeOnZone(container, 'line-1');
			placeOnZone(container, 'line-2');
			check(container);
			openHistory(container);
			expect(attemptRows(container)[0]?.dataset.attemptSuccess).toBe('true');
		});

		it('a solved attempt shows its 100% score', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-0');
			placeOnZone(container, 'line-1');
			placeOnZone(container, 'line-2');
			check(container);
			openHistory(container);
			expect(attemptRows(container)[0]?.textContent).toContain('100');
		});

		it('a partial attempt reads as a fail', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-0');
			check(container);
			openHistory(container);
			expect(attemptRows(container)[0]?.dataset.attemptSuccess).toBe('false');
		});

		it('a partial attempt shows its sub-100 score', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-0');
			check(container);
			openHistory(container);
			expect(attemptRows(container)[0]?.textContent).toContain('33');
		});
	});

	describe('Snapshot — frozen at Check, never re-graded', () => {
		it('an attempt shows the placed lines in placed order (not model order)', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-2');
			placeOnZone(container, 'line-0');
			check(container);
			openHistory(container);
			expect(
				snapshotLines(attemptRows(container)[0]).map(
					(line) => line.textContent,
				),
			).toEqual(['const c = 3;', 'const a = 1;']);
		});

		it('each snapshot line carries the correctness it was graded with', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-2');
			placeOnZone(container, 'line-0');
			check(container);
			openHistory(container);
			expect(
				snapshotLines(attemptRows(container)[0]).every(
					(line) => line.dataset.correctness !== undefined,
				),
			).toBe(true);
		});

		it('records each placed line indent level (not always 0)', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-0');
			clickIndent(container, 'line-0');
			clickIndent(container, 'line-0');
			check(container);
			openHistory(container);
			expect(snapshotLines(attemptRows(container)[0])[0]?.dataset.indent).toBe(
				'2',
			);
		});

		it('the snapshot stores the raw graded distractor value (CSS folds it to the wrong-place look)', () => {
			const container = renderLens(
				'const good = 1;\nconst bad = 2; // distractor',
			);
			placeOnZone(container, 'line-1');
			check(container);
			openHistory(container);
			expect(
				snapshotLines(attemptRows(container)[0])[0]?.dataset.correctness,
			).toBe('distractor');
		});

		it('disrupting the live arrangement after Check does not re-grade the logged verdict', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-0');
			placeOnZone(container, 'line-1');
			placeOnZone(container, 'line-2');
			check(container);
			dragSolutionTo(container, 'line-0', poolZone(container));
			openHistory(container);
			expect(attemptRows(container)[0]?.dataset.attemptSuccess).toBe('true');
		});

		it('disrupting the live arrangement after Check does not shrink the logged snapshot', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-0');
			placeOnZone(container, 'line-1');
			placeOnZone(container, 'line-2');
			check(container);
			dragSolutionTo(container, 'line-0', poolZone(container));
			openHistory(container);
			expect(snapshotLines(attemptRows(container)[0]).length).toBe(3);
		});

		it('history PERSISTS across Reset (Reset only re-shuffles)', () => {
			const container = renderLens(THREE_LINE_SOURCE);
			placeOnZone(container, 'line-0');
			check(container);
			reset(container);
			openHistory(container);
			expect(attemptRows(container).length).toBe(1);
		});
	});
});
