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

describe('parsons lens — LensModule shape', () => {
	it('declares the source station as its pedagogical target', () => {
		expect(parsonsLens.phase).toBe('source');
	});
});

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
			expect(all.every((li) => li.getAttribute('draggable') === 'true')).toBe(
				true,
			);
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
			expect(container.querySelector('[data-parsons-pool]')?.tagName).toBe(
				'UL',
			);
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
			expect(container.querySelector('[data-parsons-solution]')?.tagName).toBe(
				'OL',
			);
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
			expect(solutionItem(container, 'line-0')!.getAttribute('draggable')).toBe(
				'true',
			);
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
			expect(solutionOrder(container)).toEqual(['line-0', 'line-2', 'line-1']);
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
		fireEvent.dragStart(solutionItem(container, 'line-0')!, {
			dataTransfer: dt,
		});
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
		fireEvent.dragStart(solutionItem(container, 'line-0')!, {
			dataTransfer: dt,
		});
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
		fireEvent.dragStart(solutionItem(container, 'line-0')!, {
			dataTransfer: dt,
		});
		fireEvent.drop(container.querySelector('[data-parsons-pool]')!, {
			dataTransfer: dt,
		});
		// re-place -> indent must restart at 0 (the pool carries no indent)
		placeOnZone(container, 'line-0');
		expect(indentLevel(container, 'line-0')).toBe('0');
	});
});

describe('parsons wrapper — Inc 7f (Check / Reset / per-line feedback + score)', () => {
	function check(container: HTMLElement): void {
		fireEvent.click(container.querySelector('[data-parsons-check]')!);
	}
	function reset(container: HTMLElement): void {
		fireEvent.click(container.querySelector('[data-parsons-reset]')!);
	}
	function scoreEl(container: HTMLElement): Element | null {
		return container.querySelector('[data-parsons-score]');
	}
	function correctnessOf(container: HTMLElement, id: string): string | null {
		return (
			solutionItem(container, id)?.getAttribute('data-correctness') ?? null
		);
	}
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

	// These tests verify WIRING — that Check feeds the live arrangement to
	// buildEvaluation and renders the result, that edits clear stale feedback, and
	// that Reset reseeds. The grading OUTCOMES (every state, score formula) are
	// exhaustively unit-tested in evaluate.test.ts; here we include a couple of
	// outcome checks only to prove the real arrangement (not garbage) flows in.

	it('renders a Check and a Reset control', () => {
		const { container } = renderThreeLine();
		expect(container.querySelector('[data-parsons-check]')).not.toBeNull();
		expect(container.querySelector('[data-parsons-reset]')).not.toBeNull();
	});

	it('shows no per-line correctness or score before the first Check', () => {
		const { container } = renderThreeLine();
		placeOnZone(container, 'line-0');
		expect(correctnessOf(container, 'line-0')).toBeNull();
		expect(scoreEl(container)).toBeNull();
	});

	it('on Check, a fully correct arrangement marks every line correct and scores 100', () => {
		const { container } = renderThreeLine();
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		placeOnZone(container, 'line-2');
		check(container);
		expect(correctnessOf(container, 'line-0')).toBe('correct');
		expect(correctnessOf(container, 'line-1')).toBe('correct');
		expect(correctnessOf(container, 'line-2')).toBe('correct');
		expect(scoreEl(container)?.getAttribute('data-parsons-score')).toBe('100');
		// the score is an aria-live region (announced when it changes).
		expect(scoreEl(container)?.getAttribute('aria-live')).toBe('polite');
	});

	it('on Check with NOTHING placed, the score is 0 and NO pool line is flagged (a missing line must not be identifiable)', () => {
		const { container } = renderThreeLine();
		check(container);
		expect(scoreEl(container)?.getAttribute('data-parsons-score')).toBe('0');
		// Missing solution lines lower the SCORE, but the pool itself carries no
		// per-line hint — marking "this one is missing" would, by elimination, reveal
		// which pool lines are distractors (the leak the user flagged).
		for (const id of ['line-0', 'line-1', 'line-2']) {
			expect(
				poolItem(container, id)?.hasAttribute('data-parsons-unplaced'),
			).toBe(false);
		}
	});

	it('on Check, a placed line at the wrong indent is flagged wrong-indent; re-Check after fixing it recovers (proves the live arrangement flows in + Check is re-runnable)', () => {
		// Indented model: if (x) { @0 / y(); @1 / } @0. Placed flat (all indent 0),
		// so line-1 is at indent 0 != model 1 -> wrong-indent. This non-correct state
		// is what falsifies a "mark every placed line correct" fake impl.
		const { container } = render(
			<parsonsLens.Component
				embodiment={embody('if (x) {\n\ty();\n}')}
				config={parsonsLens.config()}
			/>,
		);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		placeOnZone(container, 'line-2');
		check(container);
		expect(correctnessOf(container, 'line-1')).toBe('wrong-indent');
		expect(correctnessOf(container, 'line-0')).toBe('correct');
		expect(scoreEl(container)?.getAttribute('data-parsons-score')).toBe('67');
		// Fix the indent (this clears the stale feedback), then re-Check: fresh 100.
		fireEvent.click(indentBtn(container, 'line-1')!);
		expect(scoreEl(container)).toBeNull();
		check(container);
		expect(correctnessOf(container, 'line-1')).toBe('correct');
		expect(scoreEl(container)?.getAttribute('data-parsons-score')).toBe('100');
	});

	it('on Check, a solution line left in the pool lowers the score WITHOUT flagging the pool line', () => {
		const { container } = renderThreeLine();
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1'); // line-2 left in the pool
		check(container);
		// The missing line lowers the score to 67% (2/3 correct)...
		expect(scoreEl(container)?.getAttribute('data-parsons-score')).toBe('67');
		expect(correctnessOf(container, 'line-0')).toBe('correct');
		// ...but the pool line carries NO marking (neither the removed unplaced hint
		// nor a data-correctness) — otherwise the unmarked pool lines would be the
		// distractors by elimination.
		expect(
			poolItem(container, 'line-2')?.hasAttribute('data-parsons-unplaced'),
		).toBe(false);
		expect(
			poolItem(container, 'line-2')?.getAttribute('data-correctness'),
		).toBeNull();
	});

	it('editing after Check clears the stale feedback (correctness + score)', () => {
		const { container } = renderThreeLine();
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		placeOnZone(container, 'line-2');
		check(container);
		expect(scoreEl(container)).not.toBeNull();
		// any arrangement mutation invalidates the last Check — indent line-0.
		fireEvent.click(indentBtn(container, 'line-0')!);
		expect(correctnessOf(container, 'line-0')).toBeNull();
		expect(scoreEl(container)).toBeNull();
	});

	it('a DRAG (place) after Check also clears the stale feedback (not just indent)', () => {
		const { container } = renderThreeLine();
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1'); // line-2 left in pool
		check(container);
		expect(scoreEl(container)).not.toBeNull();
		// placing the remaining line is an arrange mutation -> feedback clears.
		placeOnZone(container, 'line-2');
		expect(scoreEl(container)).toBeNull();
		expect(correctnessOf(container, 'line-0')).toBeNull();
	});

	it('returning a placed line to the pool after Check also clears the feedback', () => {
		const { container } = renderThreeLine();
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		check(container);
		expect(scoreEl(container)).not.toBeNull();
		// drag a placed line back to the pool -> handleDropOnPool -> applyArrange.
		const dt = makeDataTransfer();
		fireEvent.dragStart(solutionItem(container, 'line-0')!, {
			dataTransfer: dt,
		});
		fireEvent.drop(container.querySelector('[data-parsons-pool]')!, {
			dataTransfer: dt,
		});
		expect(scoreEl(container)).toBeNull();
		expect(correctnessOf(container, 'line-1')).toBeNull();
	});

	it('on Check, NO pool line is flagged — a solution line and a distractor are indistinguishable in the pool (anti-leak regression guard)', () => {
		const { container } = render(
			<parsonsLens.Component
				embodiment={embody('const good = 1;\nconst bad = 2; // distractor')}
				config={parsonsLens.config()}
			/>,
		);
		// Place nothing, Check. line-0 is a needed solution line; line-1 is a
		// distractor. If the pool flagged the solution line as "missing", the learner
		// would know line-1 (unflagged) is the distractor by elimination. Neither may
		// carry a marking — the score (here 0%) is the only signal.
		check(container);
		for (const id of ['line-0', 'line-1']) {
			expect(
				poolItem(container, id)?.hasAttribute('data-parsons-unplaced'),
			).toBe(false);
		}
	});

	it('Reset works before any Check (start over without peeking)', () => {
		const { container } = renderThreeLine();
		placeOnZone(container, 'line-0');
		expect(solutionOrder(container).length).toBe(1);
		reset(container);
		expect(solutionOrder(container).length).toBe(0);
		expect(poolLines(container).length).toBe(3);
	});

	it('Reset empties the solution, re-fills the pool, and clears feedback', () => {
		const { container } = renderThreeLine();
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		check(container);
		expect(scoreEl(container)).not.toBeNull();
		reset(container);
		expect(solutionOrder(container).length).toBe(0);
		expect(poolLines(container).length).toBe(3);
		expect(scoreEl(container)).toBeNull();
	});

	it('passes canIndent=false to the grader: a flat placement of an indented model still scores 100', () => {
		// Model: if (x) { @0 / y(); @1 / } @0. With canIndent false there are no
		// indent controls, so lines stay flat; indent must be excluded from grading.
		const { container } = render(
			<parsonsLens.Component
				embodiment={embody('if (x) {\n\ty();\n}')}
				config={parsonsLens.config({ canIndent: false })}
			/>,
		);
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		placeOnZone(container, 'line-2');
		check(container);
		expect(correctnessOf(container, 'line-1')).toBe('correct'); // not wrong-indent
		expect(scoreEl(container)?.getAttribute('data-parsons-score')).toBe('100');
	});
});

describe('parsons wrapper — Inc 7g (view-mode toggle / complete view)', () => {
	const INDENTED_SRC = 'if (x) {\n\ty();\n}'; // levels [0,1,0]

	function toggleBtn(container: HTMLElement): HTMLButtonElement | null {
		return container.querySelector<HTMLButtonElement>(
			'[data-parsons-view-toggle]',
		);
	}
	function toggleView(container: HTMLElement): void {
		fireEvent.click(toggleBtn(container)!);
	}
	function completeView(container: HTMLElement): Element | null {
		return container.querySelector('[data-parsons-complete]');
	}
	function board(container: HTMLElement): Element | null {
		return container.querySelector('[data-parsons-board]');
	}
	function rootViewMode(container: HTMLElement): string | null {
		return (
			container
				.querySelector('[data-lens="parsons"]')
				?.getAttribute('data-view-mode') ?? null
		);
	}
	function renderIndented(
		config?: Parameters<typeof parsonsLens.config>[0],
	): ReturnType<typeof render> {
		return render(
			<parsonsLens.Component
				embodiment={embody(INDENTED_SRC)}
				config={parsonsLens.config(config)}
			/>,
		);
	}

	it('renders a single view-toggle control, labelled for the action', () => {
		const { container } = renderThreeLine();
		expect(toggleBtn(container)).not.toBeNull();
		expect(toggleBtn(container)?.textContent).toContain('Show solution');
	});

	it('the single toggle: label + aria-pressed track the view (pressed = solution shown)', () => {
		const { container } = renderThreeLine();
		expect(toggleBtn(container)?.getAttribute('aria-pressed')).toBe('false');
		toggleView(container);
		expect(toggleBtn(container)?.getAttribute('aria-pressed')).toBe('true');
		expect(toggleBtn(container)?.textContent).toContain('Back to exercise');
		toggleView(container);
		expect(toggleBtn(container)?.getAttribute('aria-pressed')).toBe('false');
		expect(toggleBtn(container)?.textContent).toContain('Show solution');
	});

	it('defaults to the work view (board shown, no complete pane)', () => {
		const { container } = renderThreeLine();
		expect(rootViewMode(container)).toBe('work');
		expect(board(container)).not.toBeNull();
		expect(completeView(container)).toBeNull();
	});

	it('toggling to complete shows the read-only solution pane and hides the board', () => {
		const { container } = renderThreeLine();
		toggleView(container);
		expect(rootViewMode(container)).toBe('complete');
		expect(completeView(container)).not.toBeNull();
		expect(board(container)).toBeNull();
	});

	it('the complete view renders the model solution in order at level*indentSize (default 4), in a <pre>', () => {
		const { container } = renderIndented();
		toggleView(container);
		expect(completeView(container)?.textContent).toBe('if (x) {\n    y();\n}');
		// <pre> so the browser preserves the whitespace without extra CSS.
		expect(completeView(container)?.tagName).toBe('PRE');
	});

	it('the complete view honors a custom indentSize (reads indentSize, not hardcoded)', () => {
		const { container } = renderIndented({ indentSize: 2 });
		toggleView(container);
		expect(completeView(container)?.textContent).toBe('if (x) {\n  y();\n}');
	});

	it('the complete view multiplies level*indentSize (a level-2 line gets 2x spaces, not just indentSize)', () => {
		// levels [0,1,2,1,0]; at indentSize 4 the level-2 line needs 8 spaces — an
		// `indent > 0 ? indentSize : 0` impl would give it only 4 and FAIL here.
		const { container } = render(
			<parsonsLens.Component
				embodiment={embody('if (x) {\n\tif (y) {\n\t\tz();\n\t}\n}')}
				config={parsonsLens.config({ indentSize: 4 })}
			/>,
		);
		toggleView(container);
		expect(completeView(container)?.textContent).toBe(
			'if (x) {\n    if (y) {\n        z();\n    }\n}',
		);
	});

	it('the complete view shows only solution lines — distractors are excluded', () => {
		const { container } = render(
			<parsonsLens.Component
				embodiment={embody('const good = 1;\nconst bad = 2; // distractor')}
				config={parsonsLens.config()}
			/>,
		);
		toggleView(container);
		expect(completeView(container)?.textContent).toContain('const good = 1;');
		expect(completeView(container)?.textContent).not.toContain('const bad');
	});

	it('the complete view renders an empty pane for an empty snippet (no crash)', () => {
		const { container } = render(
			<parsonsLens.Component
				embodiment={embody('')}
				config={parsonsLens.config()}
			/>,
		);
		toggleView(container);
		expect(completeView(container)).not.toBeNull();
		expect(completeView(container)?.textContent).toBe('');
	});

	it('toggling back to work restores the board', () => {
		const { container } = renderThreeLine();
		toggleView(container);
		toggleView(container);
		expect(rootViewMode(container)).toBe('work');
		expect(board(container)).not.toBeNull();
		expect(completeView(container)).toBeNull();
	});

	it('toggling PRESERVES the learner arrangement (it is a self-check, not a reset)', () => {
		const { container } = renderThreeLine();
		placeOnZone(container, 'line-0');
		placeOnZone(container, 'line-1');
		toggleView(container);
		toggleView(container);
		expect(solutionOrder(container)).toEqual(['line-0', 'line-1']);
		expect(poolLines(container).length).toBe(1); // line-2 still in pool
	});

	it('toggling does NOT clear Check feedback (a toggle is not an arrangement edit)', () => {
		const { container } = renderThreeLine();
		placeOnZone(container, 'line-0');
		fireEvent.click(container.querySelector('[data-parsons-check]')!);
		expect(container.querySelector('[data-parsons-score]')).not.toBeNull();
		toggleView(container);
		toggleView(container);
		expect(container.querySelector('[data-parsons-score]')).not.toBeNull();
		expect(
			solutionItem(container, 'line-0')?.getAttribute('data-correctness'),
		).not.toBeNull();
	});

	it('seeds the complete view from config.viewMode', () => {
		const { container } = renderIndented({ viewMode: 'complete' });
		expect(rootViewMode(container)).toBe('complete');
		expect(completeView(container)).not.toBeNull();
	});
});

describe('parsons wrapper — Inc 10 (info panel: legend + distractor-count + hints)', () => {
	function render1(
		source: string,
		config?: Parameters<typeof parsonsLens.config>[0],
	): ReturnType<typeof render> {
		return render(
			<parsonsLens.Component
				embodiment={embody(source)}
				config={parsonsLens.config(config)}
			/>,
		);
	}
	function legend(container: HTMLElement): HTMLDetailsElement | null {
		return container.querySelector<HTMLDetailsElement>('[data-parsons-legend]');
	}
	function distractorCount(container: HTMLElement): Element | null {
		return container.querySelector('[data-parsons-distractor-count]');
	}
	function hints(container: HTMLElement): Element | null {
		return container.querySelector('[data-parsons-hints]');
	}
	function hintEntries(container: HTMLElement): Element[] {
		// Direct children of the hints container: each is a <details> or a <pre>.
		// The "direct child" shape is itself a contract assertion (no wrapper
		// element around each entry) — if the impl wraps entries, tagName checks
		// below break, which is the intended structural guard (AR-3 concern 6).
		return Array.from(hints(container)?.children ?? []);
	}
	function rootViewMode(container: HTMLElement): string | null {
		return (
			container
				.querySelector('[data-lens="parsons"]')
				?.getAttribute('data-view-mode') ?? null
		);
	}

	// --- Feedback legend (a V2 addition — keys the per-line feedback states) ---

	describe('Interface — feedback legend', () => {
		it('renders a data-parsons-legend element', () => {
			const { container } = render1('const a = 1;');
			expect(legend(container)).not.toBeNull();
		});

		it('is a collapsed <details> by default (compact surface)', () => {
			const { container } = render1('const a = 1;');
			const el = legend(container)!;
			expect(el.tagName).toBe('DETAILS');
			expect(el.hasAttribute('open')).toBe(false);
		});

		it('lists only the three placed feedback states — NOT distractor, NOT unplaced (both would leak which pool lines are distractors)', () => {
			const { container } = render1('const a = 1;');
			// `data-legend-state` is an internal completeness hook (analogous to the
			// committed `data-line-id`), not a sandbox-harness selector; the visible
			// copy is asserted below so a hooks-only invisible legend cannot pass.
			// `distractor` is omitted (a placed distractor reads as `wrong-order`), and
			// `unplaced` is omitted (flagging a missing pool line reveals the distractors
			// by elimination) — both leaks the feedback must not make.
			const rows = Array.from(
				legend(container)!.querySelectorAll('[data-legend-state]'),
			);
			const states = rows.map((row) => row.getAttribute('data-legend-state'));
			expect(new Set(states)).toEqual(
				new Set(['correct', 'wrong-order', 'wrong-indent']),
			);
			expect(states).not.toContain('distractor');
			expect(states).not.toContain('unplaced');
			// Each row carries visible learner-facing copy (not just colour hooks).
			for (const row of rows) {
				expect((row.textContent ?? '').trim().length).toBeGreaterThan(0);
			}
		});

		it('shows the legend regardless of the view mode (it sits above the view branch)', () => {
			const { container } = render1('if (x) {\n\ty();\n}', {
				viewMode: 'complete',
			});
			expect(rootViewMode(container)).toBe('complete');
			expect(legend(container)).not.toBeNull();
		});
	});

	// --- Distractor-count hint ("extra lines: N", collapsed, only when N > 0) ---

	describe('Interface — distractor-count hint', () => {
		// The exact count is a SPOILER (it tells the learner how many lines to discard),
		// so the collapsed summary must NOT leak the number — only that extras exist.
		// The count is revealed in the expandable body (a deliberate reversal of the
		// earlier "count in summary" design, per the user's discoverability call).
		function countSummary(container: HTMLElement): string {
			return (
				distractorCount(container)?.querySelector('summary')?.textContent ?? ''
			);
		}

		it('does NOT leak the count in the collapsed summary (the number is a spoiler)', () => {
			const { container } = render1(
				'const good = 1;\nconst bad = 2; // distractor',
			);
			expect(distractorCount(container)).not.toBeNull();
			// No digit in the collapsed label — the learner sees only that extras exist.
			expect(countSummary(container)).not.toMatch(/\d/);
		});

		it('reveals "extra lines: N" in the expandable body (N = selected count)', () => {
			const { container } = render1(
				'const good = 1;\nconst bad = 2; // distractor',
			);
			expect(distractorCount(container)?.textContent).toContain(
				'extra lines: 1',
			);
		});

		it('is a collapsed <details> by default (a deliberate divergence from the always-open legacy)', () => {
			const { container } = render1(
				'const good = 1;\nconst bad = 2; // distractor',
			);
			const el = distractorCount(container)!;
			expect(el.tagName).toBe('DETAILS');
			expect(el.hasAttribute('open')).toBe(false);
		});

		it('counts every selected distractor in the body (N matches the rendered distractor lines)', () => {
			const { container } = render1(
				'const good = 1;\nconst x = 2; // distractor\nconst y = 3; // distractor',
			);
			expect(distractorCount(container)?.textContent).toContain(
				'extra lines: 2',
			);
			expect(countSummary(container)).not.toMatch(/\d/);
		});

		it('Boundary — counts the SELECTED count, not the declared count, when maxDistractors caps below declared', () => {
			// 3 declared, cap 2 -> parsed.distractors.length === 2 -> "extra lines: 2".
			// An impl that counts declared distractors would wrongly say 3 here.
			const { container } = render1(
				'const a = 1;\nconst x = 2; // distractor\nconst y = 3; // distractor\nconst z = 4; // distractor',
				{ maxDistractors: 2 },
			);
			expect(distractorCount(container)?.textContent).toContain(
				'extra lines: 2',
			);
		});

		it('Zero — is absent when the snippet declares no distractors', () => {
			const { container } = render1('const a = 1;\nconst b = 2;');
			expect(distractorCount(container)).toBeNull();
		});

		it('Boundary — is absent when maxDistractors is 0 (distractors suppressed)', () => {
			const { container } = render1(
				'const good = 1;\nconst bad = 2; // distractor',
				{ maxDistractors: 0 },
			);
			expect(distractorCount(container)).toBeNull();
		});

		it('shows the distractor count regardless of the view mode (above the view branch)', () => {
			const { container } = render1(
				'const good = 1;\nconst bad = 2; // distractor',
				{ viewMode: 'complete' },
			);
			expect(rootViewMode(container)).toBe('complete');
			expect(distractorCount(container)).not.toBeNull();
		});
	});

	// --- Educator hint blocks (from Inc 9's parsed.hints) ---

	describe('Interface — hint blocks', () => {
		it('Zero — renders no data-parsons-hints container when the snippet has no block comments', () => {
			const { container } = render1('const a = 1;\nconst b = 2;');
			expect(hints(container)).toBeNull();
		});

		it('every hint is a collapsible <details>; a plain /* */ block gets the default "Hint" label (no summary needed)', () => {
			// The educator should NOT have to author a label: a bare block comment
			// becomes a collapsible "Hint" toggle so the guidance is hidden until wanted.
			const { container } = render1(
				'const a = 1;\n/* think about the base case */',
			);
			const entries = hintEntries(container);
			expect(entries.length).toBe(1);
			const details = entries[0];
			expect(details.tagName).toBe('DETAILS');
			expect(details.hasAttribute('open')).toBe(false); // collapsed by default
			expect(details.querySelector('summary')?.textContent).toBe('Hint');
			expect(details.querySelector('pre')?.textContent).toBe(
				'think about the base case',
			);
		});

		it('a parsons-collapse: marker CUSTOMIZES the summary label (overrides the default)', () => {
			const { container } = render1(
				'const a = 1;\n/* parsons-collapse: Big picture\nguard the base case first */',
			);
			const details = hintEntries(container)[0];
			expect(details.tagName).toBe('DETAILS');
			expect(details.querySelector('summary')?.textContent).toBe('Big picture');
			expect(details.querySelector('pre')?.textContent).toBe(
				'guard the base case first',
			);
		});

		it('an empty parsons-collapse: marker falls back to the default "Hint" label', () => {
			const { container } = render1('const a = 1;\n/* parsons-collapse: */');
			const details = hintEntries(container)[0];
			expect(details.tagName).toBe('DETAILS');
			expect(details.querySelector('summary')?.textContent).toBe('Hint');
		});

		it('Many — renders multiple hint blocks in source order (each its own toggle)', () => {
			const { container } = render1(
				'/* first note */\nconst a = 1;\n/* parsons-collapse: Two\nsecond note */',
			);
			const entries = hintEntries(container);
			expect(entries.length).toBe(2);
			expect(entries.every((e) => e.tagName === 'DETAILS')).toBe(true);
			expect(entries[0].querySelector('summary')?.textContent).toBe('Hint');
			expect(entries[0].querySelector('pre')?.textContent).toBe('first note');
			expect(entries[1].querySelector('summary')?.textContent).toBe('Two');
		});

		it('renders the summary + body as TEXT, never as HTML (no injection on either field)', () => {
			const { container } = render1(
				'const a = 1;\n/* parsons-collapse: <img src=x onerror=alert(1)>\n<b>body</b> */',
			);
			const details = hintEntries(container)[0];
			expect(details.querySelector('img')).toBeNull();
			expect(details.querySelector('b')).toBeNull();
			expect(details.querySelector('summary')?.textContent).toBe(
				'<img src=x onerror=alert(1)>',
			);
			expect(details.querySelector('pre')?.textContent).toBe('<b>body</b>');
		});

		it('Zero — a hint-only source (no code lines) renders the hint without crashing', () => {
			const { container } = render1('/* only a hint, no code */');
			expect(hints(container)).not.toBeNull();
			expect(hintEntries(container).length).toBe(1);
			expect(poolLines(container).length).toBe(0); // no solution lines
		});

		it('shows hints regardless of the view mode (above the view branch)', () => {
			const { container } = render1('const a = 1;\n/* a note */', {
				viewMode: 'complete',
			});
			expect(rootViewMode(container)).toBe('complete');
			expect(hints(container)).not.toBeNull();
		});
	});
});

describe('parsons wrapper — Inc 11 (attempt-history modal)', () => {
	// Uses the shared `renderThreeLine` (line-0/1/2, no indent) + `placeOnZone` helpers.
	function check(container: HTMLElement): void {
		fireEvent.click(container.querySelector('[data-parsons-check]')!);
	}
	function reset(container: HTMLElement): void {
		fireEvent.click(container.querySelector('[data-parsons-reset]')!);
	}
	function historyButton(container: HTMLElement): HTMLButtonElement | null {
		return container.querySelector<HTMLButtonElement>(
			'[data-parsons-history-open]',
		);
	}
	function openHistory(container: HTMLElement): void {
		fireEvent.click(historyButton(container)!);
	}
	function modal(container: HTMLElement): HTMLElement | null {
		return container.querySelector<HTMLElement>('[data-parsons-history-modal]');
	}
	// `data-parsons-attempt`, `data-attempt-success`, and `data-snapshot-line` are
	// INTERNAL structural hooks (like the committed `data-line-id`), used only by
	// these tests; they are not sandbox-harness selectors. (Doc pass: disclaim or
	// promote them in README alongside `data-parsons-history-open/-modal`.)
	/** The per-attempt rows (the modal lists one entry per logged Check). */
	function attemptRows(container: HTMLElement): Element[] {
		return Array.from(
			modal(container)?.querySelectorAll('[data-parsons-attempt]') ?? [],
		);
	}
	/** The per-line snapshot rows inside one attempt (in placed order). */
	function snapshotLines(row: Element): Element[] {
		return Array.from(row.querySelectorAll('[data-snapshot-line]'));
	}
	function scoreEl(container: HTMLElement): Element | null {
		return container.querySelector('[data-parsons-score]');
	}
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

	// --- The history-open control + modal open/close ---

	describe('Interface — open / close', () => {
		it('renders a data-parsons-history-open control from mount', () => {
			const { container } = renderThreeLine();
			expect(historyButton(container)).not.toBeNull();
		});

		it('the modal is absent until opened (React-state, not always in the DOM)', () => {
			const { container } = renderThreeLine();
			expect(modal(container)).toBeNull();
			openHistory(container);
			expect(modal(container)).not.toBeNull();
		});

		it('the modal is a role="dialog"', () => {
			const { container } = renderThreeLine();
			openHistory(container);
			expect(modal(container)?.getAttribute('role')).toBe('dialog');
		});

		it('closes on the close button', () => {
			const { container } = renderThreeLine();
			openHistory(container);
			fireEvent.click(container.querySelector('[data-parsons-history-close]')!);
			expect(modal(container)).toBeNull();
		});

		it('closes on Escape', () => {
			const { container } = renderThreeLine();
			openHistory(container);
			expect(modal(container)).not.toBeNull();
			// Fire on the modal element (impl-agnostic: bubbles to a document/window
			// listener, or is caught by an onKeyDown on the modal itself).
			fireEvent.keyDown(modal(container)!, { key: 'Escape' });
			expect(modal(container)).toBeNull();
		});

		it('re-opening after close still shows the logged history (modal close != history clear)', () => {
			const { container } = renderThreeLine();
			placeOnZone(container, 'line-0');
			check(container);
			openHistory(container);
			fireEvent.click(container.querySelector('[data-parsons-history-close]')!);
			expect(modal(container)).toBeNull();
			openHistory(container);
			expect(attemptRows(container).length).toBe(1);
		});
	});

	// --- Logging attempts on Check (ZOMBIES) ---

	describe('Logging — each Check appends one attempt', () => {
		it('Zero — before any Check the modal lists no attempts', () => {
			const { container } = renderThreeLine();
			openHistory(container);
			expect(attemptRows(container).length).toBe(0);
		});

		it('One — a single Check logs exactly one attempt', () => {
			const { container } = renderThreeLine();
			placeOnZone(container, 'line-0');
			check(container);
			openHistory(container);
			expect(attemptRows(container).length).toBe(1);
		});

		it('one Check both renders the live score AND logs the attempt (not one or the other)', () => {
			// Guards a bifurcated handler that scores but forgets to log (or vice versa).
			const { container } = renderThreeLine();
			placeOnZone(container, 'line-0');
			check(container);
			expect(scoreEl(container)).not.toBeNull(); // Inc 7f live score still shows
			openHistory(container);
			expect(attemptRows(container).length).toBe(1); // and the attempt was logged
		});

		it('Zero-snippet Check logs a vacuous 100% attempt (total === 0 is still an attempt)', () => {
			const { container } = render(
				<parsonsLens.Component
					embodiment={embody('')}
					config={parsonsLens.config()}
				/>,
			);
			check(container);
			openHistory(container);
			const row = attemptRows(container)[0];
			expect(attemptRows(container).length).toBe(1);
			expect(row.getAttribute('data-attempt-success')).toBe('true');
			expect(row.textContent).toContain('100');
		});

		it('Many — N Checks accumulate N attempts (history is not cleared by re-Check)', () => {
			const { container } = renderThreeLine();
			placeOnZone(container, 'line-0');
			check(container);
			placeOnZone(container, 'line-1');
			check(container);
			openHistory(container);
			expect(attemptRows(container).length).toBe(2);
		});

		it('an attempt shows its score and pass/fail verdict', () => {
			const { container } = renderThreeLine();
			// Place all three in model order -> fully correct -> success, 100%.
			placeOnZone(container, 'line-0');
			placeOnZone(container, 'line-1');
			placeOnZone(container, 'line-2');
			check(container);
			openHistory(container);
			const row = attemptRows(container)[0];
			expect(row.textContent).toContain('100');
			// A solved attempt reads as a pass (exact copy is impl-defined; pin the
			// positive signal, not the wording).
			expect(row.getAttribute('data-attempt-success')).toBe('true');
		});

		it('a partial attempt reads as a fail with a sub-100 score', () => {
			const { container } = renderThreeLine();
			placeOnZone(container, 'line-0'); // 1 of 3 placed -> 33%, not solved
			check(container);
			openHistory(container);
			const row = attemptRows(container)[0];
			expect(row.getAttribute('data-attempt-success')).toBe('false');
			expect(row.textContent).toContain('33');
		});
	});

	// --- The snapshot is frozen at Check time (never re-graded) ---

	describe('Snapshot — frozen at Check, never re-graded', () => {
		it('an attempt shows the placed lines as they were checked (code + correctness, in placed order)', () => {
			const { container } = renderThreeLine();
			placeOnZone(container, 'line-2'); // placed first -> appears first
			placeOnZone(container, 'line-0');
			check(container);
			openHistory(container);
			const lines = snapshotLines(attemptRows(container)[0]);
			expect(lines.length).toBe(2);
			expect(lines[0].textContent).toContain('const c = 3;'); // placed order, not model
			expect(lines[1].textContent).toContain('const a = 1;');
			// Each snapshot line carries the resolved correctness it was graded with.
			expect(lines.every((l) => l.hasAttribute('data-correctness'))).toBe(true);
		});

		it('records each placed line indent level (not always 0 — a Fake-It guard)', () => {
			const { container } = renderThreeLine(); // canIndent default true
			placeOnZone(container, 'line-0');
			fireEvent.click(indentBtn(container, 'line-0')!);
			fireEvent.click(indentBtn(container, 'line-0')!); // indent level 2
			check(container);
			openHistory(container);
			const line = snapshotLines(attemptRows(container)[0])[0];
			expect(line.getAttribute('data-indent')).toBe('2');
		});

		it('does NOT leak distractor-ness in the snapshot beyond the raw graded value (CSS folds it to wrong-place)', () => {
			const { container } = render(
				<parsonsLens.Component
					embodiment={embody('const good = 1;\nconst bad = 2; // distractor')}
					config={parsonsLens.config()}
				/>,
			);
			// Place the distractor (line-1) into the solution, then Check.
			placeOnZone(container, 'line-1');
			check(container);
			openHistory(container);
			const line = snapshotLines(attemptRows(container)[0])[0];
			// The raw graded value is frozen (CSS renders it identically to wrong-order;
			// the modal never invents a different verdict than the learner saw).
			expect(line.getAttribute('data-correctness')).toBe('distractor');
		});

		it('the snapshot is FROZEN — disrupting the live arrangement after Check does not re-grade the logged attempt', () => {
			const { container } = renderThreeLine();
			placeOnZone(container, 'line-0');
			placeOnZone(container, 'line-1');
			placeOnZone(container, 'line-2'); // [0,1,2] in order -> solved, 100%
			check(container);
			// Now break the live arrangement: drag line-0 back to the pool. A re-grading
			// impl would recompute 2/3 = 67%, not solved, 2 snapshot lines. The frozen
			// attempt must still read 100% / solved / 3 lines.
			const dt = makeDataTransfer();
			fireEvent.dragStart(solutionItem(container, 'line-0')!, {
				dataTransfer: dt,
			});
			fireEvent.drop(container.querySelector('[data-parsons-pool]')!, {
				dataTransfer: dt,
			});
			openHistory(container);
			const row = attemptRows(container)[0];
			expect(row.getAttribute('data-attempt-success')).toBe('true');
			expect(row.textContent).toContain('100');
			expect(snapshotLines(row).length).toBe(3);
		});

		it('history PERSISTS across Reset (faithful to the legacy; Reset only re-shuffles)', () => {
			const { container } = renderThreeLine();
			placeOnZone(container, 'line-0');
			check(container);
			reset(container);
			openHistory(container);
			expect(attemptRows(container).length).toBe(1);
		});
	});
});
