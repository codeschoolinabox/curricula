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
 *   `data-can-indent`. No drop handlers yet (7b).
 */

import { cleanup, render } from '@testing-library/react';
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
