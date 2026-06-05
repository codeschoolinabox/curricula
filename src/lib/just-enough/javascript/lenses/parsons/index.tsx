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
 * and solution declaratively from React state and React reconciles in place.
 * There is no destroy/recreate loop to guard, so the mirror would be cargo cult.
 *
 * **Current scope (Inc 7a):** the wrapper mounts, resolves config, parses the
 * snippet (`useMemo(parseParsons)`), and renders the shuffled pool lines as
 * `draggable` `<li>` in a **read-only** state (no drop handlers — native HTML5
 * DnD lands in Inc 7b). The root emits `data-lens="parsons"`, `data-view-mode`,
 * and `data-can-indent`. The arrangement reducer + solution column, indent
 * controls, Check/score, and the view-mode toggle land in Inc 7b–7f.
 */

import React, { useMemo } from 'react';
import type { ComponentType } from 'react';

import { freezeInPlace } from '@utils/freeze.js';

import type { LensModule, LensProps as LensProperties } from '../types.js';

import parsonsCore from './core.js';
import { parseParsons } from './lib/parse-parsons.js';
import type { ParsonsLine } from './types.js';

const ParsonsComponent: ComponentType<LensProperties> = function ParsonsComponent({
	embodiment,
	config,
}) {
	// Memoize resolved config on the `config` prop (stable reference from the
	// orchestrator). Without this, `parsonsCore.config()` produces a fresh frozen
	// clone every render; defensive narrowing reads the known fields off the
	// open-shape `LensConfig` (mirror `blanks/index.tsx`).
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
	// rendering pool ids (the parser keeps the line objects; the pool is ids).
	const lineById = useMemo(() => {
		const map = new Map<string, ParsonsLine>();
		for (const line of parsed.solution) map.set(line.id, line);
		for (const line of parsed.distractors) map.set(line.id, line);
		return map;
	}, [parsed]);

	// Inc 7a: read-only pool. The arrangement state (`useReducer` over
	// `arrange.ts`) and the solution column land in 7b/7c; here every line sits
	// in the shuffled pool and nothing is interactive yet (no drop handlers). The
	// pool is a `<ul>` (no inherent order); the README reserves `<ol>` for the
	// solution column. `data-line-id` is a CSS / debug hook (and lets 7b's
	// `onDrop` map a drop-TARGET element to its line index); the *dragged* id is
	// read from `dataTransfer` per README § Interaction contract, not from here.
	return (
		<div
			data-lens="parsons"
			data-view-mode={viewMode}
			data-can-indent={String(canIndent)}
		>
			<ul data-parsons-pool>
				{parsed.pool.map((id) => {
					const line = lineById.get(id);
					if (line === undefined) return null;
					return (
						<li key={id} data-line-id={id} draggable>
							<code>{line.code}</code>
						</li>
					);
				})}
			</ul>
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
