/**
 * @file React wrapper for the `parsons` lens. Default-exports the
 * frozen `LensModule` the orchestrator's lens registry consumes. The
 * wrapper composes the pure-TS core (`./core.js`, `./shuffle.js`)
 * into the drag-and-drop line-ordering surface: a `<div data-lens="
 * parsons">` root with a score readout and an `<ol>`-based draggable
 * row stack.
 *
 * Per `./DOCS.md` § Execution phases, this wrapper owns Phases 4–5:
 * render the row stack + score readout (with inline per-row
 * correctness derivation), and reorder on drag-drop. The per-row
 * correctness comparison and score aggregation are single-expression
 * derivations in the render body, not standalone phases.
 */

import React, { useMemo, useState } from 'react';
import type { ComponentType, DragEvent } from 'react';

import { freezeInPlace } from '@utils/freeze.js';

import type { LensModule, LensProps as LensProperties } from '../types.js';

import parsonsCore from './core.js';
import shuffle from './shuffle.js';
import type { Row } from './types.js';

/**
 * Narrow `resolved.seed` (an unknown-shape `LensConfig` field) to a
 * number. Falls back to `null` when the field is absent, not a
 * number, or non-finite — the wrapper then computes a per-mount
 * random seed via `useMemo([])`.
 */
function normalizeSeed(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Produce a new frozen row sequence by removing the row at
 * `fromIndex` and inserting it at `toIndex`. Reference identity for
 * non-moved rows is preserved (the original `Row` objects are
 * frozen; only the array positions change). A no-op when
 * `fromIndex === toIndex`.
 */
function reorder(
	rows: ReadonlyArray<Row>,
	fromIndex: number,
	toIndex: number,
): ReadonlyArray<Row> {
	if (fromIndex === toIndex) return rows;
	if (fromIndex < 0 || fromIndex >= rows.length) return rows;
	if (toIndex < 0 || toIndex >= rows.length) return rows;
	const moved = rows[fromIndex];
	const next = [...rows];
	next.splice(fromIndex, 1);
	next.splice(toIndex, 0, moved);
	return freezeInPlace(next);
}

/**
 * Required to allow drop — default behavior rejects the drop.
 * Module-scope because it does not capture component state.
 */
function handleDragOver(event: DragEvent<HTMLLIElement>): void {
	event.preventDefault();
	event.dataTransfer.dropEffect = 'move';
}

const ParsonsComponent: ComponentType<LensProperties> =
	function ParsonsComponent({ embodiment, config }) {
		const resolved = parsonsCore.config(config);

		// Per-mount seed: pinned `config.seed` if present, else a random
		// uint32 computed once at first render. The core's shuffle
		// function is pure (takes seed as input); the wrapper owns the
		// non-determinism source.
		const seed = useMemo(
			function computeSeed() {
				const pinned = normalizeSeed(resolved.seed);
				if (pinned !== null) return pinned;
				// eslint-disable-next-line sonarjs/pseudo-random -- per-mount shuffle, not cryptographic
				return Math.floor(Math.random() * 0x1_00_00_00_00);
			},
			[],
		);

		const initial = useMemo(
			function initialShuffle() {
				return shuffle(embodiment.source.code, seed);
			},
			[embodiment.source.code, seed],
		);

		const [rowOrder, setRowOrder] = useState<ReadonlyArray<Row>>(initial);

		// Drag state — tracks which row is being dragged. React state
		// (not a ref) so React reconciles the drop targets correctly.
		const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

		const rowCount = rowOrder.length;
		let correctCount = 0;
		for (const [currentIndex, row] of rowOrder.entries()) {
			if (row.originalIndex === currentIndex) correctCount += 1;
		}
		const scoreText =
			rowCount < 2
				? '–'
				: `${Math.round((correctCount / rowCount) * 100)}% (${correctCount}/${rowCount})`;

		function handleDragStart(
			event: DragEvent<HTMLLIElement>,
			fromIndex: number,
		): void {
			// HTML5 DnD requires setData on dragstart for the drag to
			// initiate in some browsers (notably Firefox).
			event.dataTransfer.setData('text/plain', String(fromIndex));
			event.dataTransfer.effectAllowed = 'move';
			setDraggingIndex(fromIndex);
		}

		function handleDrop(
			event: DragEvent<HTMLLIElement>,
			toIndex: number,
		): void {
			event.preventDefault();
			const fromIndex =
				draggingIndex ??
				Number.parseInt(event.dataTransfer.getData('text/plain'), 10);
			// Per DOCS § Structural constraints: no-op drag-drop is a
			// true no-op (no `setState`, no re-render). Guard the
			// dispatch at the call site rather than relying on React's
			// reference-equality bail-out.
			if (Number.isFinite(fromIndex) && fromIndex !== toIndex) {
				setRowOrder(function applyReorder(previous) {
					return reorder(previous, fromIndex, toIndex);
				});
			}
			if (draggingIndex !== null) setDraggingIndex(null);
		}

		function handleDragEnd(): void {
			setDraggingIndex(null);
		}

		return (
			<div data-lens="parsons">
				<output data-parsons-score="true" aria-live="polite">
					{scoreText}
				</output>
				<ol data-parsons-stack="true">
					{rowOrder.map(function renderRow(row, currentIndex) {
						const isCorrect = row.originalIndex === currentIndex;
						return (
							<li
								key={row.originalIndex}
								data-parsons-row="true"
								data-row-original-index={row.originalIndex}
								data-row-correct={isCorrect ? 'true' : 'false'}
								draggable
								onDragStart={function startDragOnThisRow(event) {
									handleDragStart(event, currentIndex);
								}}
								onDragOver={handleDragOver}
								onDrop={function dropOnThisRow(event) {
									handleDrop(event, currentIndex);
								}}
								onDragEnd={handleDragEnd}
							>
								<span>{row.text}</span>
							</li>
						);
					})}
				</ol>
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
