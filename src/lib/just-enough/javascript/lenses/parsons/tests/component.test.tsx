/**
 * @vitest-environment jsdom
 *
 * Component tests for the `parsons` React wrapper.
 *
 * **jsdom caveat (load-bearing):** jsdom does NOT implement real HTML5
 * drag-and-drop. These tests prove WIRING only — that the component mounts,
 * renders the DOM contract (`data-lens` / `data-view-mode` / `data-can-indent`
 * + the pool), and (from Inc 7b) that the DnD handlers are attached and dispatch
 * the pure `arrange.ts` reducer. Real drag behavior is verified by manual browser
 * observation at `/spiralearn/parsons-preview` before each commit (the sandbox
 * checkpoint is a gate, not a formality). The reducer transitions themselves are
 * exhaustively unit-tested in `tests/arrange.test.ts` (no jsdom).
 *
 * Current coverage:
 * - Inc 7a: mount + parse + render the shuffled pool lines as `draggable` <li>
 *   in a read-only state; root `data-lens="parsons"` + `data-view-mode="work"` +
 *   `data-can-indent`.
 * - Inc 7b: two-column board (pool <ul> + solution <ol>) + native HTML5 DnD
 *   wiring for pool<->solution movement (place / return); the onDragOver
 *   preventDefault footgun; the `${zone}:${id}` encoding; insert-index derivation.
 * - Inc 7c: reorder within the solution column (solution->solution), incl. the
 *   removal-shift on downward moves and the same-position no-op short-circuit.
 */

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';

import parsonsLens from '../index.js';

afterEach(cleanup);

/** The rendered pool lines (the draggable <li> directly inside the pool <ul>). */
function poolLines(container: HTMLElement): NodeListOf<HTMLLIElement> {
	return container.querySelectorAll<HTMLLIElement>('[data-parsons-pool] > li');
}

/** The text content of each rendered pool line, in render (shuffled) order. */
function poolTexts(container: HTMLElement): string[] {
	return Array.from(poolLines(container)).map((li) => li.textContent ?? '');
}

// --- Shared DnD test helpers (used by the Inc 7b + 7c blocks) ---

const THREE_LINE_SRC = 'const a = 1;\nconst b = 2;\nconst c = 3;';

function renderThreeLine(): ReturnType<typeof render> {
	return render(
		<parsonsLens.Component
			embodiment={embody(THREE_LINE_SRC)}
			config={parsonsLens.config()}
		/>,
	);
}

// jsdom has no real DataTransfer; this mock persists a single string across a
// dragStart -> drop pair so the round-trip (setData in onDragStart, getData in
// onDrop) is exercised. Real drag is browser-verified (see the suite header).
// `getData` honors the `text/plain` format the README contract mandates: a
// wrong-format read returns '' (so a mis-formatted impl fails, not passes).
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

function poolItem(container: HTMLElement, id: string): Element | null {
	return container.querySelector(`[data-parsons-pool] [data-line-id="${id}"]`);
}
function solutionItem(container: HTMLElement, id: string): Element | null {
	return container.querySelector(
		`[data-parsons-solution] [data-line-id="${id}"]`,
	);
}
function solutionOrder(container: HTMLElement): Array<string | null> {
	return Array.from(
		container.querySelectorAll('[data-parsons-solution] > li'),
	).map((li) => li.getAttribute('data-line-id'));
}

// Place a pool line into the solution by dropping it on the zone's empty area
// (the <ol> itself, not onto a child line) -> appends at the end.
function placeOnZone(container: HTMLElement, id: string): void {
	const dt = makeDataTransfer();
	fireEvent.dragStart(poolItem(container, id)!, { dataTransfer: dt });
	fireEvent.drop(container.querySelector('[data-parsons-solution]')!, {
		dataTransfer: dt,
	});
}

describe('parsons wrapper — Inc 7a (mount + shuffled pool)', () => {
	describe('Zero — degenerate snippet does not crash', () => {
		it('renders data-lens="parsons" without throwing on an empty snippet', () => {
			expect(() =>
				render(
					<parsonsLens.Component
						embodiment={embody('')}
						config={parsonsLens.config()}
					/>,
				),
			).not.toThrow();
		});

		it('renders an empty pool (no lines) for an empty snippet', () => {
			const { container } = render(
				<parsonsLens.Component
					embodiment={embody('')}
					config={parsonsLens.config()}
				/>,
			);
			expect(poolLines(container).length).toBe(0);
		});
	});

	describe('One — single-line snippet', () => {
		it('renders exactly one pool line', () => {
			const { container } = render(
				<parsonsLens.Component
					embodiment={embody('const x = 1;')}
					config={parsonsLens.config()}
				/>,
			);
			expect(poolLines(container).length).toBe(1);
		});

		it('renders the line source text in the pool line (not merely somewhere in the tree)', () => {
			const { container } = render(
				<parsonsLens.Component
					embodiment={embody('const x = 1;')}
					config={parsonsLens.config()}
				/>,
			);
			// Pool-scoped: asserts the code is IN the pool <li>, not in a heading
			// / label / aria-text elsewhere in the component.
			expect(poolTexts(container)[0]).toContain('const x = 1;');
		});
	});

	describe('Many — multi-line snippet', () => {
		const SRC = 'const a = 1;\nconst b = 2;\nconst c = 3;';

		it('renders one pool line per non-blank source line', () => {
			const { container } = render(
				<parsonsLens.Component
					embodiment={embody(SRC)}
					config={parsonsLens.config()}
				/>,
			);
			expect(poolLines(container).length).toBe(3);
		});

		it('renders every line, regardless of shuffled order', () => {
			// The shuffle uses bare Math.random(), so assert on the SET of rendered
			// codes, not their order.
			const { container } = render(
				<parsonsLens.Component
					embodiment={embody(SRC)}
					config={parsonsLens.config()}
				/>,
			);
			const rendered = poolTexts(container);
			for (const code of ['const a = 1;', 'const b = 2;', 'const c = 3;']) {
				expect(rendered.some((text) => text.includes(code))).toBe(true);
			}
		});

		it('renders ALL pool lines as draggable (not just the first)', () => {
			const { container } = render(
				<parsonsLens.Component
					embodiment={embody(SRC)}
					config={parsonsLens.config()}
				/>,
			);
			const all = Array.from(poolLines(container));
			expect(all.length).toBe(3);
			expect(
				all.every((li) => li.getAttribute('draggable') === 'true'),
			).toBe(true);
		});

		it('drops blank lines from the pool', () => {
			const { container } = render(
				<parsonsLens.Component
					embodiment={embody('const a = 1;\n\n\nconst b = 2;')}
					config={parsonsLens.config()}
				/>,
			);
			expect(poolLines(container).length).toBe(2);
		});
	});

	describe('Boundary — distractor cap + Tier 1 (parse path is parseParsons, not naive split)', () => {
		// Triangulation: a naive `source.code.split('\n').filter(Boolean)`
		// implementation would render the `// distractor` line. parseParsons
		// classifies it as a distractor and `maxDistractors: 0` suppresses it,
		// so the pool MUST be 1 (the lone solution line). This is the test that
		// forces the wrapper to call parseParsons rather than a string split.
		it('suppresses a // distractor line when maxDistractors is 0', () => {
			const { container } = render(
				<parsonsLens.Component
					embodiment={embody('const good = 1;\nconst bad = 2; // distractor')}
					config={parsonsLens.config({ maxDistractors: 0 })}
				/>,
			);
			expect(poolLines(container).length).toBe(1);
			expect(poolTexts(container).join('\n')).not.toContain('distractor');
		});

		it('strips the // distractor marker from a distractor shown in the pool', () => {
			// With the default cap (10), the distractor IS selected into the pool,
			// but parseParsons strips the marker — a naive split would leave it.
			const { container } = render(
				<parsonsLens.Component
					embodiment={embody('const good = 1;\nconst bad = 2; // distractor')}
					config={parsonsLens.config()}
				/>,
			);
			expect(poolLines(container).length).toBe(2);
			expect(poolTexts(container).join('\n')).not.toContain('// distractor');
		});

		it('renders the pool even when status.parsed is false (Tier 1: text-only, no parse gate)', () => {
			// parsons reorders text lines; it needs no AST and does not gate on
			// status.parsed (a deliberate divergence from blanks). The canned
			// embody scenario sets source.code === 'FAIL_AT_PARSE' (a single
			// 13-char line, no newline, no marker) → exactly one orderable line.
			const { container } = render(
				<parsonsLens.Component
					embodiment={embody('FAIL_AT_PARSE')}
					config={parsonsLens.config()}
				/>,
			);
			expect(container.querySelector('[data-lens="parsons"]')).not.toBeNull();
			expect(poolLines(container).length).toBe(1);
		});
	});

	describe('Interface — DOM contract invariants', () => {
		it('renders a root with data-lens="parsons"', () => {
			const { container } = render(
				<parsonsLens.Component
					embodiment={embody('const x = 1;')}
					config={parsonsLens.config()}
				/>,
			);
			expect(container.querySelector('[data-lens="parsons"]')).not.toBeNull();
		});

		it('renders the pool as a <ul> (the README reserves <ol> for the solution column)', () => {
			const { container } = render(
				<parsonsLens.Component
					embodiment={embody('const x = 1;')}
					config={parsonsLens.config()}
				/>,
			);
			expect(
				container.querySelector('[data-parsons-pool]')?.tagName,
			).toBe('UL');
		});

		it('defaults data-view-mode="work"', () => {
			const { container } = render(
				<parsonsLens.Component
					embodiment={embody('const x = 1;')}
					config={parsonsLens.config()}
				/>,
			);
			const root = container.querySelector('[data-lens="parsons"]');
			expect(root?.getAttribute('data-view-mode')).toBe('work');
		});

		it('seeds data-view-mode="complete" from config', () => {
			const { container } = render(
				<parsonsLens.Component
					embodiment={embody('const x = 1;')}
					config={parsonsLens.config({ viewMode: 'complete' })}
				/>,
			);
			const root = container.querySelector('[data-lens="parsons"]');
			expect(root?.getAttribute('data-view-mode')).toBe('complete');
		});

		// Note: this assertion is already satisfied by the Inc 7a stub (root
		// attribute rendering was in scope for the stub); it pins the contract.
		it('defaults data-can-indent="true"', () => {
			const { container } = render(
				<parsonsLens.Component
					embodiment={embody('const x = 1;')}
					config={parsonsLens.config()}
				/>,
			);
			const root = container.querySelector('[data-lens="parsons"]');
			expect(root?.getAttribute('data-can-indent')).toBe('true');
		});

		it('reflects data-can-indent="false" when canIndent is disabled', () => {
			const { container } = render(
				<parsonsLens.Component
					embodiment={embody('const x = 1;')}
					config={parsonsLens.config({ canIndent: false })}
				/>,
			);
			const root = container.querySelector('[data-lens="parsons"]');
			expect(root?.getAttribute('data-can-indent')).toBe('false');
		});

		it('renders pool lines as draggable', () => {
			const { container } = render(
				<parsonsLens.Component
					embodiment={embody('const x = 1;')}
					config={parsonsLens.config()}
				/>,
			);
			const line = poolLines(container)[0];
			expect(line?.getAttribute('draggable')).toBe('true');
		});
	});
});

describe('parsons wrapper — Inc 7b (two-column board + native DnD: place / return)', () => {
	const renderMany = renderThreeLine;

	describe('Structure — two-column board', () => {
		it('renders a board containing both the pool and the solution column', () => {
			const { container } = renderMany();
			const board = container.querySelector('[data-parsons-board]');
			expect(board).not.toBeNull();
			expect(board?.querySelector('[data-parsons-pool]')).not.toBeNull();
			expect(board?.querySelector('[data-parsons-solution]')).not.toBeNull();
		});

		it('renders the solution column as an <ol> (ordered)', () => {
			const { container } = renderMany();
			expect(
				container.querySelector('[data-parsons-solution]')?.tagName,
			).toBe('OL');
		});

		it('starts with an empty solution column (all lines in the pool)', () => {
			const { container } = renderMany();
			expect(solutionOrder(container).length).toBe(0);
			expect(poolLines(container).length).toBe(3);
		});
	});

	describe('onDragOver — the load-bearing preventDefault (without it onDrop never fires)', () => {
		it('cancels dragover over the solution zone', () => {
			const { container } = renderMany();
			const zone = container.querySelector('[data-parsons-solution]')!;
			// fireEvent returns false when a cancelable event was preventDefault-ed.
			expect(
				fireEvent.dragOver(zone, { dataTransfer: makeDataTransfer() }),
			).toBe(false);
		});

		it('cancels dragover over the pool zone', () => {
			const { container } = renderMany();
			const zone = container.querySelector('[data-parsons-pool]')!;
			expect(
				fireEvent.dragOver(zone, { dataTransfer: makeDataTransfer() }),
			).toBe(false);
		});
	});

	describe('onDragStart — encodes zone:id into dataTransfer (the mechanism, not just the outcome)', () => {
		it('writes "pool:<id>" when dragging a pool line', () => {
			const { container } = renderMany();
			const dt = makeDataTransfer();
			fireEvent.dragStart(poolItem(container, 'line-0')!, { dataTransfer: dt });
			// Verifies the ENCODING (README contract `${zone}:${id}`), so an impl
			// that routes purely by drop-target DOM zone (ignoring the payload)
			// cannot pass — the zone prefix is load-bearing for 7c reorder.
			expect(dt.getData('text/plain')).toBe('pool:line-0');
		});

		it('writes "solution:<id>" when dragging a placed line', () => {
			const { container } = renderMany();
			placeOnZone(container, 'line-0');
			const dt = makeDataTransfer();
			fireEvent.dragStart(solutionItem(container, 'line-0')!, {
				dataTransfer: dt,
			});
			expect(dt.getData('text/plain')).toBe('solution:line-0');
		});

		it('renders placed solution lines as draggable (so they can be returned/reordered)', () => {
			const { container } = renderMany();
			placeOnZone(container, 'line-0');
			expect(
				solutionItem(container, 'line-0')!.getAttribute('draggable'),
			).toBe('true');
		});
	});

	describe('place — drag a pool line into the solution', () => {
		it('moves the dragged line from the pool into the solution on drop', () => {
			const { container } = renderMany();
			placeOnZone(container, 'line-0');
			expect(solutionItem(container, 'line-0')).not.toBeNull();
			expect(poolItem(container, 'line-0')).toBeNull();
		});

		it('APPENDS successive lines dropped on the empty zone area (not prepend)', () => {
			// Triangulation: a hardcoded `index = 0` impl would PREPEND here, giving
			// [line-1, line-0]. Append requires index = solution.length.
			const { container } = renderMany();
			placeOnZone(container, 'line-0');
			placeOnZone(container, 'line-1');
			expect(solutionOrder(container)).toEqual(['line-0', 'line-1']);
		});

		it('inserts before a NON-FIRST drop-target line (real index derivation, not hardcoded 0)', () => {
			// Triangulation: with [line-0, line-1] placed, dropping line-2 ONTO
			// line-1 (index 1) must yield [line-0, line-2, line-1]. A hardcoded
			// `index = 0` impl would yield [line-2, line-0, line-1] and FAIL.
			const { container } = renderMany();
			placeOnZone(container, 'line-0');
			placeOnZone(container, 'line-1');
			const dt = makeDataTransfer();
			fireEvent.dragStart(poolItem(container, 'line-2')!, { dataTransfer: dt });
			fireEvent.drop(solutionItem(container, 'line-1')!, { dataTransfer: dt });
			expect(solutionOrder(container)).toEqual([
				'line-0',
				'line-2',
				'line-1',
			]);
		});
	});

	describe('return — drag a placed line back to the pool', () => {
		it('moves a placed line from the solution back into the pool', () => {
			const { container } = renderMany();
			placeOnZone(container, 'line-0');
			expect(solutionItem(container, 'line-0')).not.toBeNull();
			// drag it back out to the pool zone
			const dt = makeDataTransfer();
			fireEvent.dragStart(solutionItem(container, 'line-0')!, {
				dataTransfer: dt,
			});
			fireEvent.drop(container.querySelector('[data-parsons-pool]')!, {
				dataTransfer: dt,
			});
			expect(poolItem(container, 'line-0')).not.toBeNull();
			expect(solutionItem(container, 'line-0')).toBeNull();
		});
	});

	describe('routing safety — out-of-scope drops are safe no-ops in 7b', () => {
		it('dragging a pool line and dropping back on the pool changes nothing', () => {
			const { container } = renderMany();
			const before = poolLines(container).length;
			const dt = makeDataTransfer();
			fireEvent.dragStart(poolItem(container, 'line-0')!, { dataTransfer: dt });
			fireEvent.drop(container.querySelector('[data-parsons-pool]')!, {
				dataTransfer: dt,
			});
			expect(poolLines(container).length).toBe(before);
			expect(solutionOrder(container).length).toBe(0);
		});
	});
});

describe('parsons wrapper — Inc 7c (reorder within the solution column)', () => {
	// Build a known solution order [line-0, line-1, line-2] by placing in order
	// (placeOnZone appends), so reorder assertions are deterministic despite the
	// shuffled pool.
	function renderThreePlaced(): ReturnType<typeof render> {
		const rendered = renderThreeLine();
		placeOnZone(rendered.container, 'line-0');
		placeOnZone(rendered.container, 'line-1');
		placeOnZone(rendered.container, 'line-2');
		return rendered;
	}

	// Reorder by dragging a placed line onto another placed line.
	function reorderOnto(
		container: HTMLElement,
		dragId: string,
		targetId: string,
	): void {
		const dt = makeDataTransfer();
		fireEvent.dragStart(solutionItem(container, dragId)!, { dataTransfer: dt });
		fireEvent.drop(solutionItem(container, targetId)!, { dataTransfer: dt });
	}

	it('precondition: the three lines are placed in order', () => {
		const { container } = renderThreePlaced();
		expect(solutionOrder(container)).toEqual(['line-0', 'line-1', 'line-2']);
	});

	it('moves a line UP: drop the last line onto the first inserts it before the first', () => {
		const { container } = renderThreePlaced();
		reorderOnto(container, 'line-2', 'line-0');
		expect(solutionOrder(container)).toEqual(['line-2', 'line-0', 'line-1']);
	});

	it('moves a line UP to a NON-FIRST position (conditional shift, not always-subtract-1)', () => {
		// drag line-2 (idx 2) onto line-1 (idx 1): dragIndex > targetIndex, so NO
		// removal-shift -> insertIndex = 1 -> [line-0, line-2, line-1]. An impl that
		// ALWAYS subtracts 1 would give insertIndex 0 -> [line-2, line-0, line-1]
		// (clamp hides the bug for drop-on-first, so this non-first case is needed).
		const { container } = renderThreePlaced();
		reorderOnto(container, 'line-2', 'line-1');
		expect(solutionOrder(container)).toEqual(['line-0', 'line-2', 'line-1']);
	});

	it('moves a line DOWN: drop the first onto the last inserts it BEFORE the last (removal-shift)', () => {
		// The removal-shift trap: dragging line-0 (index 0) onto line-2 (index 2),
		// after line-0 is removed line-2 sits at index 1 — so "before line-2" is
		// index 1, NOT 2. A naive impl that passes the raw target index would put
		// line-0 at the very end ([line-1, line-2, line-0]); the correct result is
		// [line-1, line-0, line-2].
		const { container } = renderThreePlaced();
		reorderOnto(container, 'line-0', 'line-2');
		expect(solutionOrder(container)).toEqual(['line-1', 'line-0', 'line-2']);
	});

	it('reorders to the END when dropped on the column empty area', () => {
		const { container } = renderThreePlaced();
		// drop line-0 on the <ol> zone itself (empty area below the lines)
		const dt = makeDataTransfer();
		fireEvent.dragStart(solutionItem(container, 'line-0')!, { dataTransfer: dt });
		fireEvent.drop(container.querySelector('[data-parsons-solution]')!, {
			dataTransfer: dt,
		});
		expect(solutionOrder(container)).toEqual(['line-1', 'line-2', 'line-0']);
	});

	// NOTE: these two no-op cases assert the DOM OUTCOME (order unchanged) only.
	// They cannot prove the dispatch-skip short-circuit actually fired — without it,
	// `reorderWithinSolution` still returns a same-order (but NEW) arrangement, so
	// the DOM reads identically. The reducer's same-index no-op semantics are pinned
	// in arrange.test.ts; the short-circuit itself is a re-render-avoidance property.
	it('dropping a line onto itself is a no-op (order unchanged)', () => {
		const { container } = renderThreePlaced();
		reorderOnto(container, 'line-1', 'line-1');
		expect(solutionOrder(container)).toEqual(['line-0', 'line-1', 'line-2']);
	});

	it('dropping a line onto its immediate successor is a no-op (it is already before it)', () => {
		const { container } = renderThreePlaced();
		reorderOnto(container, 'line-0', 'line-1');
		expect(solutionOrder(container)).toEqual(['line-0', 'line-1', 'line-2']);
	});

	it('reorder does not leak a line into the pool (stays in the solution)', () => {
		const { container } = renderThreePlaced();
		reorderOnto(container, 'line-2', 'line-0');
		expect(poolLines(container).length).toBe(0);
		expect(solutionOrder(container).length).toBe(3);
	});
});

describe('parsons wrapper — Inc 7d (indent / outdent controls)', () => {
	function indentBtn(
		container: HTMLElement,
		id: string,
	): HTMLButtonElement | null {
		return (
			solutionItem(container, id)?.querySelector<HTMLButtonElement>(
				'[data-parsons-indent]',
			) ?? null
		);
	}
	function outdentBtn(
		container: HTMLElement,
		id: string,
	): HTMLButtonElement | null {
		return (
			solutionItem(container, id)?.querySelector<HTMLButtonElement>(
				'[data-parsons-outdent]',
			) ?? null
		);
	}
	function indentLevel(container: HTMLElement, id: string): string | null {
		return solutionItem(container, id)?.getAttribute('data-indent') ?? null;
	}

	function renderWith(
		config: Parameters<typeof parsonsLens.config>[0],
	): ReturnType<typeof render> {
		return render(
			<parsonsLens.Component
				embodiment={embody(THREE_LINE_SRC)}
				config={parsonsLens.config(config)}
			/>,
		);
	}

	it('placed lines render the indent control when canIndent (default)', () => {
		const { container } = renderThreeLine();
		placeOnZone(container, 'line-0');
		expect(indentBtn(container, 'line-0')).not.toBeNull();
		// outdent presence is level-dependent (absent at 0) — see the dedicated
		// level-0 test below.
	});

	it('a freshly placed line starts at data-indent="0"', () => {
		const { container } = renderThreeLine();
		placeOnZone(container, 'line-0');
		expect(indentLevel(container, 'line-0')).toBe('0');
	});

	it('clicking indent increments the level; clicking outdent decrements', () => {
		const { container } = renderThreeLine();
		placeOnZone(container, 'line-0');
		fireEvent.click(indentBtn(container, 'line-0')!);
		expect(indentLevel(container, 'line-0')).toBe('1');
		fireEvent.click(indentBtn(container, 'line-0')!);
		expect(indentLevel(container, 'line-0')).toBe('2');
		fireEvent.click(outdentBtn(container, 'line-0')!);
		expect(indentLevel(container, 'line-0')).toBe('1');
		fireEvent.click(outdentBtn(container, 'line-0')!);
		expect(indentLevel(container, 'line-0')).toBe('0');
	});

	it('shows NO outdent button at level 0; it appears once indented and the floor is enforced by its absence', () => {
		const { container } = renderThreeLine();
		placeOnZone(container, 'line-0');
		// At level 0 there is nothing to outdent: the button does not exist.
		expect(outdentBtn(container, 'line-0')).toBeNull();
		expect(indentBtn(container, 'line-0')).not.toBeNull();
		fireEvent.click(indentBtn(container, 'line-0')!);
		expect(indentLevel(container, 'line-0')).toBe('1');
		expect(outdentBtn(container, 'line-0')).not.toBeNull(); // appears at >= 1
		fireEvent.click(outdentBtn(container, 'line-0')!);
		expect(indentLevel(container, 'line-0')).toBe('0');
		expect(outdentBtn(container, 'line-0')).toBeNull(); // gone again at 0
	});

	it('renders one indent-guide step per indent level (depth indicator)', () => {
		const { container } = renderThreeLine();
		placeOnZone(container, 'line-0');
		fireEvent.click(indentBtn(container, 'line-0')!);
		fireEvent.click(indentBtn(container, 'line-0')!); // level = 2
		const steps = solutionItem(container, 'line-0')!.querySelectorAll(
			'[data-parsons-indent-step]',
		);
		// level 2 -> 2 steps. The step WIDTH is a fixed compact CSS cue (no longer
		// `indentSize`-driven in the work view), so it is browser-verified, not
		// asserted here (jsdom applies no stylesheet).
		expect(steps.length).toBe(2);
	});

	it('a flush (level 0) line renders no indent-guide steps', () => {
		const { container } = renderThreeLine();
		placeOnZone(container, 'line-0');
		expect(
			solutionItem(container, 'line-0')!.querySelectorAll(
				'[data-parsons-indent-step]',
			).length,
		).toBe(0);
	});

	it('indenting one placed line does NOT change another line level (per-id dispatch)', () => {
		const { container } = renderThreeLine();
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		fireEvent.click(indentBtn(container, 'line-0')!);
		fireEvent.click(indentBtn(container, 'line-0')!);
		expect(indentLevel(container, 'line-0')).toBe('2');
		expect(indentLevel(container, 'line-1')).toBe('0'); // untouched
	});

	it('hides the indent controls AND guide steps when canIndent is false', () => {
		const { container } = renderWith({ canIndent: false });
		placeOnZone(container, 'line-0');
		expect(indentBtn(container, 'line-0')).toBeNull();
		expect(outdentBtn(container, 'line-0')).toBeNull();
		// No indentability implied: no depth guides either (lines render flush).
		expect(
			solutionItem(container, 'line-0')!.querySelectorAll(
				'[data-parsons-indent-step]',
			).length,
		).toBe(0);
	});

	it('pool lines never carry indent controls', () => {
		const { container } = renderThreeLine();
		const poolLine = poolItem(container, 'line-0')!;
		expect(poolLine.querySelector('[data-parsons-indent]')).toBeNull();
		expect(poolLine.querySelector('[data-parsons-outdent]')).toBeNull();
	});

	it('indent level PERSISTS across a reorder within the solution', () => {
		const { container } = renderThreeLine();
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		fireEvent.click(indentBtn(container, 'line-0')!);
		fireEvent.click(indentBtn(container, 'line-0')!);
		expect(indentLevel(container, 'line-0')).toBe('2');
		// move line-0 to the end (drop on the empty zone area)
		const dt = makeDataTransfer();
		fireEvent.dragStart(solutionItem(container, 'line-0')!, { dataTransfer: dt });
		fireEvent.drop(container.querySelector('[data-parsons-solution]')!, {
			dataTransfer: dt,
		});
		expect(solutionOrder(container)).toEqual(['line-1', 'line-0']);
		expect(indentLevel(container, 'line-0')).toBe('2'); // preserved across reorder
	});

	it('indent level RESETS to 0 on a pool round-trip', () => {
		const { container } = renderThreeLine();
		placeOnZone(container, 'line-0');
		fireEvent.click(indentBtn(container, 'line-0')!);
		expect(indentLevel(container, 'line-0')).toBe('1');
		// drag back to the pool
		const dt = makeDataTransfer();
		fireEvent.dragStart(solutionItem(container, 'line-0')!, { dataTransfer: dt });
		fireEvent.drop(container.querySelector('[data-parsons-pool]')!, {
			dataTransfer: dt,
		});
		// re-place -> indent must restart at 0 (the pool carries no indent)
		placeOnZone(container, 'line-0');
		expect(indentLevel(container, 'line-0')).toBe('0');
	});
});
