/**
 * @file React wrapper for the `parsons` lens. Default-exports the frozen
 * `LensModule` the orchestrator's lens registry consumes (post Inc 8).
 *
 * The wrapper composes the pure-TS core (`./core.ts`) + the vendored / new lib
 * modules (`./lib/parse-parsons.ts`, `./lib/arrange.ts`, the evaluators) into the
 * parsons surface: a `<div data-lens="parsons" data-view-mode="…"
 * data-can-indent="…">` root with an available-lines pool, a solution column,
 * per-line indent controls, a Check button, per-line feedback, a score, and a
 * view-mode toggle. See `./README.md` § UI structure for the DOM contract and
 * § Interaction contract for the native HTML5 drag-and-drop wiring.
 *
 * **Why no `useRef` remount mirror (a deliberate divergence from
 * `blanks/index.tsx`):** blanks holds a `learnerCodeRef` mirror because it mounts
 * an imperative CodeMirror `EditorView` inside a `useEffect` whose deps it also
 * updates — a keystroke → `setState` → effect re-fire → `view.destroy()` loop
 * that "feels read-only". Parsons has **no imperative view**: it renders the pool
 * and solution declaratively from `useReducer` state and React reconciles in
 * place. There is no destroy/recreate loop to guard, so the mirror would be cargo
 * cult.
 *
 * **Current scope (Inc 7a + 7b):** the wrapper mounts, resolves config, parses
 * the snippet (`useMemo(parseParsons)`), holds the arrangement in `useReducer`
 * over `arrange.ts`, and renders the two-column board — the shuffled pool
 * (`<ul>`) + the solution column (`<ol>`). Native HTML5 DnD wires pool↔solution
 * movement: `onDragStart` writes `${zone}:${id}` to `dataTransfer`; `onDragOver`
 * calls `preventDefault` (load-bearing — without it `onDrop` never fires);
 * `onDrop` dispatches `placeFromPool` (pool→solution, at the derived insert
 * index) or `returnToPool` (solution→pool). Reorder-within-solution (7c), indent
 * controls (7d), Check/score (7e), and the view-mode toggle (7f) are not wired
 * yet — solution→solution and pool→pool drops are deliberate no-ops here.
 */

import React, { useMemo, useReducer } from 'react';
import type { ComponentType } from 'react';

import { freezeInPlace } from '@utils/freeze.js';

import type { LensModule, LensProps as LensProperties } from '../types.js';

import parsonsCore from './core.js';
import { initialArrangement, placeFromPool, returnToPool } from './lib/arrange.js';
import { parseParsons } from './lib/parse-parsons.js';
import type { Arrangement, ParsonsLine } from './types.js';

import './parsons.css';

/** The two drag zones, encoded into `dataTransfer` as the `${zone}:${id}` prefix. */
type Zone = 'pool' | 'solution';

/** Reducer actions wired in Inc 7b (place / return). Reorder + indent land in 7c/7d. */
type ArrangeAction =
	| { type: 'place'; id: string; index: number }
	| { type: 'return'; id: string };

function arrangementReducer(
	state: Arrangement,
	action: ArrangeAction,
): Arrangement {
	switch (action.type) {
		case 'place':
			return placeFromPool(state, action.id, action.index);
		case 'return':
			return returnToPool(state, action.id);
		default:
			return state;
	}
}

/**
 * Decode the `${zone}:${id}` drag payload. Splits on the FIRST colon (robust to a
 * future id that contains one) and validates the zone. Returns `null` for a
 * malformed / wrong-format payload so the drop handler safely no-ops.
 */
function parseDragPayload(payload: string): { zone: Zone; id: string } | null {
	const sep = payload.indexOf(':');
	if (sep === -1) return null;
	const zone = payload.slice(0, sep);
	const id = payload.slice(sep + 1);
	if ((zone !== 'pool' && zone !== 'solution') || id === '') return null;
	return { zone, id };
}

const ParsonsComponent: ComponentType<LensProperties> = function ParsonsComponent({
	embodiment,
	config,
}) {
	// Memoize resolved config on the `config` prop (stable reference from the
	// orchestrator). Defensive narrowing reads the known fields off the open-shape
	// `LensConfig` (mirror `blanks/index.tsx`).
	const resolved = useMemo(() => parsonsCore.config(config), [config]);
	// `canIndent` defaults true: only an explicit `false` override disables the
	// graded indent dimension (anything else, incl. `undefined`, is `true`).
	const canIndent = resolved.canIndent !== false;
	const viewMode: 'work' | 'complete' =
		resolved.viewMode === 'complete' ? 'complete' : 'work';
	const maxDistractors =
		typeof resolved.maxDistractors === 'number' ? resolved.maxDistractors : 10;

	// Parse the snippet into the model solution + selected distractors + the
	// initial shuffled pool of ids. Memoized on source + maxDistractors: re-parse
	// (re-roll the shuffle) ONLY when those change. `Math.random()` makes this
	// impure across re-renders, so the deps are deliberately narrow — and the
	// orchestrator/preview remount (key / unmount) on snippet change reseeds it.
	const parsed = useMemo(
		() => parseParsons(embodiment.source.code, maxDistractors),
		[embodiment.source.code, maxDistractors],
	);

	// id -> ParsonsLine over solution ∪ distractors, for O(1) code lookup when
	// rendering pool / solution ids (the parser keeps the line objects; the pool
	// and arrangement carry ids).
	const lineById = useMemo(() => {
		const map = new Map<string, ParsonsLine>();
		for (const line of parsed.solution) map.set(line.id, line);
		for (const line of parsed.distractors) map.set(line.id, line);
		return map;
	}, [parsed]);

	// The learner's arrangement: all ids start in the pool, the solution empty.
	// Lazy-initialized from the parsed pool. `useReducer` does NOT re-run the
	// initializer when `parsed` later changes — so the arrangement is reseeded by
	// a fresh MOUNT, never an in-place prop update. That holds in v1: both inputs
	// to `parsed` (embodiment.source.code, config.maxDistractors) are mount-stable.
	// The preview remounts via `key={code}`. The orchestrator mounts
	// `<lensModule.Component>` with no key, but never edits the snippet or config
	// while a lens is mounted — entering lens mode (editor->lens toggle) and
	// switching lens both render a fresh component (verified against
	// orchestrate/index.tsx: no in-mount path mutates source or resolvedConfig).
	// IF a future increment adds an in-mount control that changes maxDistractors
	// (cf. the blanks difficulty slider, which is LOCAL state for exactly this
	// reason), the arrangement must be explicitly reset then — otherwise `parsed`
	// re-derives while the reducer keeps stale ids, desyncing lineById from it.
	const [arrangement, dispatch] = useReducer(
		arrangementReducer,
		parsed.pool,
		initialArrangement,
	);

	// --- Native HTML5 DnD adapters (thin; all transition logic is in arrange.ts) ---

	function handleDragStart(
		event: React.DragEvent<HTMLLIElement>,
		zone: Zone,
		id: string,
	): void {
		event.dataTransfer.setData('text/plain', `${zone}:${id}`);
		event.dataTransfer.effectAllowed = 'move';
	}

	function handleDragOver(event: React.DragEvent<HTMLElement>): void {
		// LOAD-BEARING: without preventDefault the browser fires no `drop` event.
		// This is the #1 native-HTML5-DnD footgun — the line the prior shell missed.
		// Attached to the zone only; dragover/drop on a child <li> bubble up here.
		event.preventDefault();
	}

	// Drop target index within the solution: dropping onto line _i_ inserts before
	// _i_; dropping on the column's empty area (no line ancestor) appends.
	// `closest` walks up from the actual drop target (which in a real browser may
	// be the inner `<code>`, not the `<li>`) to the `data-line-id` host element.
	function solutionDropIndex(event: React.DragEvent<HTMLElement>): number {
		const target = (event.target as HTMLElement).closest('[data-line-id]');
		if (target === null) return arrangement.solution.length;
		const targetId = target.getAttribute('data-line-id');
		const index = arrangement.solution.findIndex((line) => line.id === targetId);
		return index === -1 ? arrangement.solution.length : index;
	}

	function handleDropOnSolution(event: React.DragEvent<HTMLElement>): void {
		event.preventDefault();
		const payload = parseDragPayload(event.dataTransfer.getData('text/plain'));
		if (payload === null) return;
		if (payload.zone === 'pool') {
			dispatch({ type: 'place', id: payload.id, index: solutionDropIndex(event) });
		}
		// solution -> solution reorder is Inc 7c (deliberate no-op here).
	}

	function handleDropOnPool(event: React.DragEvent<HTMLElement>): void {
		event.preventDefault();
		const payload = parseDragPayload(event.dataTransfer.getData('text/plain'));
		if (payload === null) return;
		if (payload.zone === 'solution') {
			dispatch({ type: 'return', id: payload.id });
		}
		// pool -> pool is a no-op.
	}

	return (
		<div
			data-lens="parsons"
			data-view-mode={viewMode}
			data-can-indent={String(canIndent)}
		>
			<main data-parsons-board>
				<ul
					data-parsons-pool
					aria-label="Available lines"
					onDragOver={handleDragOver}
					onDrop={handleDropOnPool}
				>
					{arrangement.pool.map((id) => {
						const line = lineById.get(id);
						if (line === undefined) return null;
						return (
							<li
								key={id}
								data-line-id={id}
								draggable
								onDragStart={(event) => handleDragStart(event, 'pool', id)}
							>
								<code>{line.code}</code>
							</li>
						);
					})}
				</ul>
				<ol
					data-parsons-solution
					aria-label="Solution"
					onDragOver={handleDragOver}
					onDrop={handleDropOnSolution}
				>
					{arrangement.solution.map((placed) => {
						const line = lineById.get(placed.id);
						if (line === undefined) return null;
						return (
							<li
								key={placed.id}
								data-line-id={placed.id}
								draggable
								onDragStart={(event) =>
									handleDragStart(event, 'solution', placed.id)
								}
							>
								<code>{line.code}</code>
							</li>
						);
					})}
				</ol>
			</main>
		</div>
	);
};

const parsonsLens: LensModule = freezeInPlace<LensModule>({
	name: 'parsons',
	Component: ParsonsComponent,
	config: parsonsCore.config,
	applicableTo: parsonsCore.applicableTo,
	recommend: parsonsCore.recommend,
});

export default parsonsLens;
