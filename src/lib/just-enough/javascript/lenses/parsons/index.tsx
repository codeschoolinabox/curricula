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
 * **Current scope (Inc 7a–7g):** the wrapper mounts, resolves config, parses the
 * snippet (parse held as state, reseeded on Reset), holds the arrangement in
 * `useReducer` over `arrange.ts`, and renders the two-column board — the shuffled
 * pool (`<ul>`) + the solution column (`<ol>`). Native HTML5 DnD: `onDragStart`
 * writes `${zone}:${id}` to `dataTransfer`; `onDragOver` calls `preventDefault`
 * (load-bearing — without it `onDrop` never fires); `onDrop` dispatches
 * `placeFromPool` / `returnToPool` / `reorderWithinSolution` (removal-shift-adjusted
 * insert index + same-position short-circuit). Each placed line carries
 * `data-indent={level}` + compact guide steps (editor-style alignment cues) and
 * (when `canIndent`) right-side outdent/indent buttons. A `Check` button grades via
 * `buildEvaluation` and renders `data-correctness` per placed line + a
 * `data-parsons-unplaced` hint on pool lines + a `data-parsons-score` aria-live
 * region; any arrangement edit clears the stale result (`applyArrange`); `Reset`
 * re-shuffles + clears. A work/complete view toggle (`data-view-toggle`) seeds
 * from `config.viewMode` and renders the model solution read-only at literal
 * `level * indentSize` in `<pre data-parsons-complete>` (no distractors); toggling
 * preserves the arrangement + feedback (it is not an `applyArrange` edit). A
 * pool→pool drop is a no-op.
 */

import React, { useMemo, useReducer, useState } from 'react';
import type { ComponentType } from 'react';

import { freezeInPlace } from '@utils/freeze.js';

import type { LensModule, LensProps as LensProperties } from '../types.js';

import parsonsCore from './core.js';
import {
	indentLine,
	initialArrangement,
	outdentLine,
	placeFromPool,
	reorderWithinSolution,
	returnToPool,
} from './lib/arrange.js';
import { buildEvaluation } from './lib/evaluate.js';
import { parseParsons } from './lib/parse-parsons.js';
import type {
	Arrangement,
	EvaluationResult,
	ParsedParsons,
	ParsonsLine,
} from './types.js';

import './parsons.css';

/** The two drag zones, encoded into `dataTransfer` as the `${zone}:${id}` prefix. */
type Zone = 'pool' | 'solution';

/**
 * Reducer actions: place/return (7b), reorder (7c), indent/outdent (7d), and
 * `reseed` (7f Reset) — re-init the arrangement from a freshly shuffled pool.
 */
type ArrangeAction =
	| { type: 'place'; id: string; index: number }
	| { type: 'reorder'; id: string; index: number }
	| { type: 'return'; id: string }
	| { type: 'indent'; id: string }
	| { type: 'outdent'; id: string }
	| { type: 'reseed'; pool: ReadonlyArray<string> };

function arrangementReducer(
	state: Arrangement,
	action: ArrangeAction,
): Arrangement {
	switch (action.type) {
		case 'place':
			return placeFromPool(state, action.id, action.index);
		case 'reorder':
			return reorderWithinSolution(state, action.id, action.index);
		case 'return':
			return returnToPool(state, action.id);
		case 'indent':
			return indentLine(state, action.id);
		case 'outdent':
			return outdentLine(state, action.id);
		case 'reseed':
			return initialArrangement(action.pool);
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

const ParsonsComponent: ComponentType<LensProperties> =
	function ParsonsComponent({ embodiment, config }) {
		// Memoize resolved config on the `config` prop (stable reference from the
		// orchestrator). Defensive narrowing reads the known fields off the open-shape
		// `LensConfig` (mirror `blanks/index.tsx`).
		const resolved = useMemo(() => parsonsCore.config(config), [config]);
		// `canIndent` defaults true: only an explicit `false` override disables the
		// graded indent dimension (anything else, incl. `undefined`, is `true`).
		const canIndent = resolved.canIndent !== false;
		const maxDistractors =
			typeof resolved.maxDistractors === 'number'
				? resolved.maxDistractors
				: 10;
		// `indentSize` is presentation-only and used ONLY by the complete view's literal
		// rendering (below). The WORK view shows indent as compact fixed-width guide
		// steps (a relative nesting cue — see parsons.css `[data-parsons-indent-step]`),
		// so a deep nest does not eat horizontal space there.
		const indentSize =
			typeof resolved.indentSize === 'number' ? resolved.indentSize : 4;
		// View mode is LOCAL state (seeded from config) so the toggle can flip it. The
		// toggle is a self-check affordance: it changes ONLY this, never the arrangement
		// or the Check feedback (it is NOT routed through `applyArrange`).
		const initialViewMode: 'work' | 'complete' =
			resolved.viewMode === 'complete' ? 'complete' : 'work';
		const [viewMode, setViewMode] = useState<'work' | 'complete'>(
			initialViewMode,
		);

		// Parse the snippet into the model solution + selected distractors + the
		// initial shuffled pool of ids. Held as STATE (lazy-seeded once at mount), NOT
		// a useMemo: `Math.random()` makes parsing impure, and Reset must reseed the
		// parse + the arrangement TOGETHER (a fresh parse re-selects distractors, so the
		// arrangement's ids and lineById would desync if parse re-derived independently).
		// Mount-stable otherwise: snippet/config changes remount (preview `key={code}`,
		// orchestrator editor<->lens toggle + lens switch); only Reset replaces it.
		const [parsed, setParsed] = useState<ParsedParsons>(() =>
			parseParsons(embodiment.source.code, maxDistractors),
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
		// Lazy-initialized from the parsed pool. Reseeded together with `parsed` on
		// Reset (the `reseed` action); otherwise mount-stable like `parsed`.
		const [arrangement, dispatch] = useReducer(
			arrangementReducer,
			parsed.pool,
			initialArrangement,
		);

		// The last Check result (null until the first Check, and CLEARED on any
		// arrangement edit so stale per-line feedback never outlives the move it graded).
		const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

		// Every arrangement mutation flows through here so the last Check is invalidated.
		// (No-op transitions short-circuit BEFORE calling this, so they don't clear.)
		function applyArrange(action: ArrangeAction): void {
			dispatch(action);
			setEvaluation(null);
		}

		function handleCheck(): void {
			setEvaluation(buildEvaluation(arrangement, parsed, canIndent));
		}

		function handleReset(): void {
			// Fresh shuffle: re-parse, then reseed the arrangement from it so `parsed`
			// (hence lineById) and the arrangement stay consistent. applyArrange clears
			// the evaluation.
			const fresh = parseParsons(embodiment.source.code, maxDistractors);
			setParsed(fresh);
			applyArrange({ type: 'reseed', pool: fresh.pool });
		}

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
			const index = arrangement.solution.findIndex(
				(line) => line.id === targetId,
			);
			return index === -1 ? arrangement.solution.length : index;
		}

		function handleDropOnSolution(event: React.DragEvent<HTMLElement>): void {
			event.preventDefault();
			const payload = parseDragPayload(
				event.dataTransfer.getData('text/plain'),
			);
			if (payload === null) return;
			const targetIndex = solutionDropIndex(event);
			if (payload.zone === 'pool') {
				applyArrange({ type: 'place', id: payload.id, index: targetIndex });
				return;
			}
			// solution -> solution: reorder within the column.
			const dragIndex = arrangement.solution.findIndex(
				(s) => s.id === payload.id,
			);
			if (dragIndex === -1) return;
			// "Drop onto line i inserts BEFORE line i." `reorderWithinSolution`
			// interprets its index against the array AFTER the dragged line is removed,
			// so a line moving DOWN (dragIndex < targetIndex) sees the target shift up by
			// one — adjust for it. A drop on the empty area gives targetIndex ===
			// solution.length, which clamps to the end inside the reducer.
			const insertIndex =
				dragIndex < targetIndex ? targetIndex - 1 : targetIndex;
			// Skip a same-position move: `reorderWithinSolution` returns a NEW
			// arrangement even for a no-op index, which would re-render for nothing.
			if (insertIndex === dragIndex) return;
			applyArrange({ type: 'reorder', id: payload.id, index: insertIndex });
		}

		function handleDropOnPool(event: React.DragEvent<HTMLElement>): void {
			event.preventDefault();
			const payload = parseDragPayload(
				event.dataTransfer.getData('text/plain'),
			);
			if (payload === null) return;
			if (payload.zone === 'solution') {
				applyArrange({ type: 'return', id: payload.id });
			}
			// pool -> pool is a no-op.
		}

		const correctness = evaluation?.correctnessMap;
		// Complete view: the model solution in order, each line at its LITERAL
		// `level * indentSize` indentation; no distractors. Read-only self-check.
		const completeText = parsed.solution
			.map((line) => ' '.repeat(line.indent * indentSize) + line.code)
			.join('\n');

		return (
			<div
				data-lens="parsons"
				data-view-mode={viewMode}
				data-can-indent={String(canIndent)}
			>
				<header data-parsons-toolbar>
					<button type="button" data-parsons-check onClick={handleCheck}>
						Check
					</button>
					<button type="button" data-parsons-reset onClick={handleReset}>
						Reset
					</button>
					{/* Single toggle: peeking at the solution is a binary action, so one
					    button whose label + aria-pressed track the state reads clearer
					    than two co-equal buttons. `aria-pressed` = solution is showing. */}
					<button
						type="button"
						data-parsons-view-toggle
						aria-pressed={viewMode === 'complete' ? 'true' : 'false'}
						onClick={() =>
							setViewMode(viewMode === 'complete' ? 'work' : 'complete')
						}
					>
						{viewMode === 'complete' ? 'Back to exercise' : 'Show solution'}
					</button>
				</header>
				{viewMode === 'complete' ? (
					<pre data-parsons-complete>{completeText}</pre>
				) : (
					<>
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
											data-parsons-unplaced={
												correctness?.get(id) === 'unplaced' || undefined
											}
											draggable
											onDragStart={(event) =>
												handleDragStart(event, 'pool', id)
											}
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
											data-parsons-line
											data-line-id={placed.id}
											data-indent={placed.indent}
											data-correctness={correctness?.get(placed.id)}
											draggable
											onDragStart={(event) =>
												handleDragStart(event, 'solution', placed.id)
											}
										>
											{/* One compact guide step per indent level — a faint vertical
								    rule so equal-depth lines align visually without a deep nest
								    eating horizontal space (width is a fixed cue in
								    parsons.css, NOT literal `indentSize` spaces). Decorative
								    (aria-hidden); the depth is conveyed semantically by
								    `data-indent`. */}
											{Array.from({ length: placed.indent }, (_, depth) => (
												<span
													key={depth}
													data-parsons-indent-step
													aria-hidden="true"
												/>
											))}
											<code>{line.code}</code>
											{/* Controls live on the RIGHT so the line's left origin stays
								    fixed — that is what makes equal indent depths line up. */}
											{canIndent && (
												<span data-parsons-indent-controls>
													{/* No outdent at level 0 — nothing to outdent. The
										    reducer floors at 0 too (defense); here the button
										    simply does not exist until the line is indented. */}
													{placed.indent > 0 && (
														<button
															type="button"
															data-parsons-outdent
															aria-label="Outdent line"
															onClick={() =>
																applyArrange({ type: 'outdent', id: placed.id })
															}
														>
															←
														</button>
													)}
													<button
														type="button"
														data-parsons-indent
														aria-label="Indent line"
														onClick={() =>
															applyArrange({ type: 'indent', id: placed.id })
														}
													>
														→
													</button>
												</span>
											)}
										</li>
									);
								})}
							</ol>
						</main>
						{evaluation !== null && (
							<div data-parsons-score={evaluation.score} aria-live="polite">
								Score: {evaluation.score}% ({evaluation.correct} /{' '}
								{evaluation.total}){evaluation.success ? ' — solved!' : ''}
							</div>
						)}
					</>
				)}
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
