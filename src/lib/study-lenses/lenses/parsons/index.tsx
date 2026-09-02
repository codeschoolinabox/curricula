// cspell:ignore distractor distractors colour colours desync footgun

/**
 * The `parsons` lens — default-exports the frozen `Lens` object the
 * composition root imports by reference.
 *
 * The component composes the pure core (`./core.ts`) + the `lib/` modules
 * (`./lib/parse-parsons.ts`, the arrangement transitions, the evaluators)
 * into the parsons surface: a `<div data-lens="parsons" data-view-mode="…"
 * data-can-indent="…">` root with an available-lines pool, a solution
 * column, per-line indent controls, a Check button, per-line feedback, a
 * score, and a view-mode toggle. See `./README.md` § UI structure for the
 * DOM contract and § Interaction contract for the native HTML5
 * drag-and-drop wiring.
 *
 * **What the component does:** mounts, parses the program's source (parse
 * held as state, reseeded on Reset), holds the arrangement in `useReducer`
 * over the pure transitions, and renders the two-column board — the
 * shuffled pool (`<ul>`) + the solution column (`<ol>`). Native HTML5 DnD:
 * `onDragStart` writes `${zone}:${id}` to `dataTransfer`; `onDragOver`
 * calls `preventDefault` (load-bearing — without it `onDrop` never fires);
 * `onDrop` dispatches `placeFromPool` / `returnToPool` /
 * `reorderWithinSolution` (removal-shift-adjusted insert index +
 * same-position short-circuit). Each placed line carries
 * `data-indent={level}` + compact guide steps and (when `canIndent`)
 * right-side outdent/indent buttons. A `Check` button grades via
 * `buildEvaluation` and renders `data-correctness` per placed line + a
 * `data-parsons-score` aria-live region (pool lines get NO per-line
 * feedback — that would reveal the distractors by elimination; missing
 * lines lower the score instead; a placed distractor reads as
 * `wrong-order`); any arrangement edit clears the stale result
 * (`applyArrange`); `Reset` re-shuffles + clears (but NOT the attempt
 * history). A work/complete view toggle (`data-parsons-view-toggle`) seeds
 * from `config.viewMode` and renders the model solution read-only at
 * literal `level * indentSize` in `<pre data-parsons-complete>` (no
 * distractors); toggling preserves the arrangement + feedback. An **info
 * panel** above the board (both views) holds a 3-state feedback legend, the
 * distractor-count hint, and the collapsible educator hint blocks. A
 * toolbar **history** button opens a React-state modal
 * (`data-parsons-history-modal`, Escape-to-close) listing each Check as a
 * frozen, never-re-graded snapshot. A pool→pool drop is a no-op.
 */

import React from 'react';

import freezeInPlace from '@utils/freeze-in-place.js';

import type { Lens, LensProperties } from '../types.js';

import parsonsCore from './core.js';
import buildEvaluation from './lib/evaluate.js';
import indentLine from './lib/indent-line.js';
import initialArrangement from './lib/initial-arrangement.js';
import outdentLine from './lib/outdent-line.js';
import parseParsons from './lib/parse-parsons.js';
import placeFromPool from './lib/place-from-pool.js';
import reorderWithinSolution from './lib/reorder-within-solution.js';
import returnToPool from './lib/return-to-pool.js';
import type {
	Arrangement,
	Attempt,
	EvaluationResult,
	LineCorrectness,
	ParsedParsons,
	ParsonsLine,
} from './types.js';

import './parsons.css';

/** The two drag zones, encoded into `dataTransfer` as the `${zone}:${id}` prefix. */
type Zone = 'pool' | 'solution';

/**
 * The feedback legend rows: the learner-facing per-line feedback states
 * with their meanings. Rendered in a collapsed
 * `<details data-parsons-legend>` so a learner can decode a Check result
 * without guessing. Each row carries `data-legend-state` (an internal
 * completeness hook + the CSS key for its colour swatch — mirrors the
 * per-line `data-correctness` palette in parsons.css).
 *
 * Two states are deliberately OMITTED so the feedback never reveals which
 * pool lines are distractors (that is the puzzle): `distractor` (a placed
 * distractor reads as `wrong-order` — "wrong place"), and `unplaced`
 * (flagging a missing solution line in the pool would, by elimination,
 * identify the distractors). Missing lines lower the SCORE instead. Colours
 * use Wong's colorblind-safe palette (blue / vermilion) with outline-style
 * (solid / dashed / dotted) carrying the signal so it does not rely on hue
 * alone.
 */
const LEGEND_STATES: ReadonlyArray<{ state: LineCorrectness; label: string }> =
	[
		{ state: 'correct', label: 'Correct — right place and indentation' },
		{
			state: 'wrong-order',
			label: 'Wrong place — this line is out of order or does not belong',
		},
		{
			state: 'wrong-indent',
			label: 'Wrong indentation — right line, wrong nesting',
		},
	];

/** Default summary label for a hint block when the educator authored none. */
const DEFAULT_HINT_LABEL = 'Hint';

/**
 * Reducer actions: place / reorder / return / indent / outdent over the
 * pure arrangement transitions, plus `reseed` (Reset) — re-init the
 * arrangement from a freshly shuffled pool.
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
	if (action.type === 'place') {
		return placeFromPool(state, action.id, action.index);
	}
	if (action.type === 'reorder') {
		return reorderWithinSolution(state, action.id, action.index);
	}
	if (action.type === 'return') {
		return returnToPool(state, action.id);
	}
	if (action.type === 'indent') {
		return indentLine(state, action.id);
	}
	if (action.type === 'outdent') {
		return outdentLine(state, action.id);
	}
	// Only 'reseed' remains — the union is closed and file-local, so TS
	// narrows `action` here; a new variant would fail to typecheck, never
	// fall through silently.
	return initialArrangement(action.pool);
}

/**
 * Decode the `${zone}:${id}` drag payload. Splits on the FIRST colon
 * (robust to a future id that contains one) and validates the zone. Returns
 * `null` for a malformed / wrong-format payload so the drop handler safely
 * no-ops.
 */
function parseDragPayload(payload: string): { zone: Zone; id: string } | null {
	const separator = payload.indexOf(':');
	if (separator === -1) return null;
	const zone = payload.slice(0, separator);
	const id = payload.slice(separator + 1);
	if ((zone !== 'pool' && zone !== 'solution') || id === '') return null;
	return { zone, id };
}

/** The depths `[0, level)` — one guide step per indent level. */
function guideDepths(level: number): number[] {
	const depths: number[] = [];
	for (let depth = 0; depth < level; depth++) {
		depths.push(depth);
	}
	return depths;
}

function ParsonsMain({
	embodiment,
	config,
}: LensProperties): React.JSX.Element {
	// Memoize the resolved config on the `config` prop (stable reference
	// from the orchestrator). Defensive narrowing reads the known fields off
	// the open-shape `LensConfig`.
	const resolved = React.useMemo(
		function resolveConfig() {
			return parsonsCore.config(config);
		},
		[config],
	);
	// `canIndent` defaults true: only an explicit `false` override disables
	// the graded indent dimension (anything else is `true`).
	const canIndent = resolved.canIndent !== false;
	const maxDistractors =
		typeof resolved.maxDistractors === 'number' ? resolved.maxDistractors : 10;
	// `indentSize` is presentation-only and used ONLY by the complete view's
	// literal rendering (below). The WORK view shows indent as compact
	// fixed-width guide steps (a relative nesting cue — see parsons.css
	// `[data-parsons-indent-step]`), so a deep nest does not eat horizontal
	// space there.
	const indentSize =
		typeof resolved.indentSize === 'number' ? resolved.indentSize : 4;
	// View mode is LOCAL state (seeded from config) so the toggle can flip
	// it. The toggle is a self-check affordance: it changes ONLY this, never
	// the arrangement or the Check feedback (it is NOT routed through
	// `applyArrange`).
	const initialViewMode: 'work' | 'complete' =
		resolved.viewMode === 'complete' ? 'complete' : 'work';
	const [viewMode, setViewMode] = React.useState<'work' | 'complete'>(
		initialViewMode,
	);

	// Parse the source into the model solution + selected distractors + the
	// initial shuffled pool of ids. Held as STATE (lazy-seeded once at
	// mount), NOT a useMemo: `Math.random()` makes parsing impure, and Reset
	// must reseed the parse + the arrangement TOGETHER (a fresh parse
	// re-selects distractors, so the arrangement's ids and lineById would
	// desync if parse re-derived independently). Mount-stable otherwise: a
	// source or config change remounts the lens; only Reset replaces it.
	const [parsed, setParsed] = React.useState<ParsedParsons>(() =>
		parseParsons(embodiment.facts.source.value, maxDistractors),
	);

	// id -> ParsonsLine over solution ∪ distractors, for O(1) code lookup
	// when rendering pool / solution ids (the parser keeps the line objects;
	// the pool and arrangement carry ids).
	const lineById = React.useMemo(
		function buildLineById() {
			const byId = new Map<string, ParsonsLine>();
			for (const line of parsed.solution) byId.set(line.id, line);
			for (const line of parsed.distractors) byId.set(line.id, line);
			return byId;
		},
		[parsed],
	);

	// The learner's arrangement: all ids start in the pool, the solution
	// empty. Lazy-initialized from the parsed pool. Reseeded together with
	// `parsed` on Reset (the `reseed` action); otherwise mount-stable like
	// `parsed`.
	const [arrangement, dispatch] = React.useReducer(
		arrangementReducer,
		parsed.pool,
		initialArrangement,
	);

	// The last Check result (null until the first Check, and CLEARED on any
	// arrangement edit so stale per-line feedback never outlives the move it
	// graded).
	const [evaluation, setEvaluation] = React.useState<EvaluationResult | null>(
		null,
	);

	// Attempt history: every Check appends a FROZEN snapshot. Unlike
	// `evaluation`, history is NOT cleared by an edit or Reset — it is the
	// learner's record of what they tried. In-mount only: it dies on
	// unmount, per the disposable-practice contract.
	const [attempts, setAttempts] = React.useState<ReadonlyArray<Attempt>>([]);
	// The history modal is React-state-driven.
	const [historyOpen, setHistoryOpen] = React.useState(false);

	// Every arrangement mutation flows through here so the last Check is
	// invalidated. (No-op transitions short-circuit BEFORE calling this, so
	// they don't clear.) Note: this clears only the live `evaluation`, NEVER
	// `attempts`.
	function applyArrange(action: ArrangeAction): void {
		dispatch(action);
		setEvaluation(null);
	}

	function handleCheck(): void {
		// Grade ONCE and use the same result for the live feedback AND the
		// frozen history snapshot, so the modal can never show a different
		// verdict than the learner saw (the modal renders the snapshot
		// verbatim and never re-grades).
		const result = buildEvaluation(arrangement, parsed, canIndent);
		setEvaluation(result);
		const snapshot = arrangement.solution.map((placed) => ({
			code: lineById.get(placed.id)?.code ?? '',
			indent: placed.indent,
			// A placed line always has a resolved placed state in the map
			// (never `unplaced`); the fallback is unreachable but keeps the
			// type total.
			correctness: result.correctnessMap.get(placed.id) ?? 'correct',
		}));
		setAttempts((previous) => [
			...previous,
			{
				index: previous.length + 1,
				score: result.score,
				success: result.success,
				snapshot,
			},
		]);
	}

	function handleReset(): void {
		// Fresh shuffle: re-parse, then reseed the arrangement from it so
		// `parsed` (hence lineById) and the arrangement stay consistent.
		// applyArrange clears the evaluation.
		const fresh = parseParsons(embodiment.facts.source.value, maxDistractors);
		setParsed(fresh);
		applyArrange({ type: 'reseed', pool: fresh.pool });
	}

	// Escape closes the history modal. A document-level listener (attached
	// only while open) catches Escape regardless of focus — robust for a
	// keyboard user. The cleanup is idle-safe: removing a never-attached
	// listener is a no-op, so the effect returns it unconditionally.
	React.useEffect(
		function escapeClosesModal() {
			function onKeyDown(event: KeyboardEvent): void {
				if (event.key === 'Escape') setHistoryOpen(false);
			}
			if (historyOpen) document.addEventListener('keydown', onKeyDown);
			return function removeEscapeListener() {
				document.removeEventListener('keydown', onKeyDown);
			};
		},
		[historyOpen],
	);

	// --- Native HTML5 DnD adapters (thin; the transition logic is pure) ---

	function handleDragStart(
		event: React.DragEvent<HTMLLIElement>,
		zone: Zone,
		id: string,
	): void {
		event.dataTransfer.setData('text/plain', `${zone}:${id}`);
		event.dataTransfer.effectAllowed = 'move';
	}

	function handleDragOver(event: React.DragEvent<HTMLElement>): void {
		// LOAD-BEARING: without preventDefault the browser fires no `drop`
		// event. This is the #1 native-HTML5-DnD footgun. Attached to the
		// zone only; dragover/drop on a child <li> bubble up here.
		event.preventDefault();
	}

	// Drop target index within the solution: dropping onto line _i_ inserts
	// before _i_; dropping on the column's empty area (no line ancestor)
	// appends. `closest` walks up from the actual drop target (which in a
	// real browser may be the inner `<code>`, not the `<li>`) to the
	// `data-line-id` host element.
	function solutionDropIndex(event: React.DragEvent<HTMLElement>): number {
		const { target } = event;
		if (!(target instanceof Element)) return arrangement.solution.length;
		const host = target.closest('[data-line-id]');
		if (!(host instanceof HTMLElement)) return arrangement.solution.length;
		const targetId = host.dataset.lineId;
		const index = arrangement.solution.findIndex(
			(line) => line.id === targetId,
		);
		return index === -1 ? arrangement.solution.length : index;
	}

	function handleDropOnSolution(event: React.DragEvent<HTMLElement>): void {
		event.preventDefault();
		const payload = parseDragPayload(event.dataTransfer.getData('text/plain'));
		if (payload === null) return;
		const targetIndex = solutionDropIndex(event);
		if (payload.zone === 'pool') {
			applyArrange({ type: 'place', id: payload.id, index: targetIndex });
			return;
		}
		// solution -> solution: reorder within the column.
		const dragIndex = arrangement.solution.findIndex(
			(placed) => placed.id === payload.id,
		);
		if (dragIndex === -1) return;
		// "Drop onto line i inserts BEFORE line i." `reorderWithinSolution`
		// interprets its index against the array AFTER the dragged line is
		// removed, so a line moving DOWN (dragIndex < targetIndex) sees the
		// target shift up by one — adjust for it. A drop on the empty area
		// gives targetIndex === solution.length, which clamps to the end
		// inside the transition.
		const insertIndex = dragIndex < targetIndex ? targetIndex - 1 : targetIndex;
		// Skip a same-position move: `reorderWithinSolution` returns a NEW
		// arrangement even for a no-op index, which would re-render for
		// nothing.
		if (insertIndex === dragIndex) return;
		applyArrange({ type: 'reorder', id: payload.id, index: insertIndex });
	}

	function handleDropOnPool(event: React.DragEvent<HTMLElement>): void {
		event.preventDefault();
		const payload = parseDragPayload(event.dataTransfer.getData('text/plain'));
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
				{/* Single toggle: peeking at the solution is a binary action, so
				    one button whose label + aria-pressed track the state reads
				    clearer than two co-equal buttons. `aria-pressed` = solution
				    is showing. */}
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
				{/* History opener. Lives in the toolbar so it is always
				    reachable (both views); the modal itself renders at the end
				    of the root. */}
				<button
					type="button"
					data-parsons-history-open
					onClick={() => setHistoryOpen(true)}
				>
					Review attempts ({attempts.length})
				</button>
			</header>
			{/* Info panel: sits ABOVE the work/complete branch so it shows in
			    both views — a colour legend, the distractor-count hint, and the
			    educator hint blocks. All read-only; collapsed by default for
			    compactness. */}
			<details data-parsons-legend>
				<summary>Feedback legend</summary>
				<ul>
					{LEGEND_STATES.map(({ state, label }) => (
						<li key={state} data-legend-state={state}>
							<span data-legend-swatch aria-hidden="true" />
							{label}
						</li>
					))}
				</ul>
			</details>
			{parsed.distractors.length > 0 && (
				<details data-parsons-distractor-count>
					{/* The exact count is a SPOILER (it tells the learner how
					    many lines to discard), so the collapsed summary only
					    signals that extras exist; the number is revealed in the
					    body on expand. */}
					<summary>Heads up — some pool lines do not belong</summary>
					<p>extra lines: {parsed.distractors.length}</p>
				</details>
			)}
			{parsed.hints.length > 0 && (
				<div data-parsons-hints>
					{/* Every block comment is a collapsible "Hint" toggle — the
					    educator need not author a label. A `parsons-collapse:
					    <text>` marker (parsed into `summary`) CUSTOMIZES the
					    label; null/empty falls back to the default. Body +
					    summary render as TEXT (JSX auto-escapes) — never
					    dangerouslySetInnerHTML, so an educator block cannot
					    inject markup. */}
					{parsed.hints.map((hint, index) => (
						<details key={index}>
							<summary>
								{hint.summary !== null && hint.summary.length > 0
									? hint.summary
									: DEFAULT_HINT_LABEL}
							</summary>
							<pre>{hint.body}</pre>
						</details>
					))}
				</div>
			)}
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
							{arrangement.pool.map(function renderPoolLine(id) {
								const line = lineById.get(id);
								if (line === undefined) return null;
								return (
									// No per-line feedback on pool lines: marking a
									// missing solution line would reveal the
									// distractors by elimination. Missing lines
									// lower the SCORE instead (see handleCheck).
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
							{arrangement.solution.map(function renderPlacedLine(placed) {
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
										{/* One compact guide step per indent level — a
										    faint vertical rule so equal-depth lines
										    align visually without a deep nest eating
										    horizontal space (width is a fixed cue in
										    parsons.css, NOT literal `indentSize`
										    spaces). Decorative (aria-hidden); the
										    depth is conveyed semantically by
										    `data-indent`. */}
										{guideDepths(placed.indent).map((depth) => (
											<span
												key={depth}
												data-parsons-indent-step
												aria-hidden="true"
											/>
										))}
										<code>{line.code}</code>
										{/* Controls live on the RIGHT so the line's
										    left origin stays fixed — that is what
										    makes equal indent depths line up. */}
										{canIndent && (
											<span data-parsons-indent-controls>
												{/* No outdent at level 0 — nothing to
												    outdent. The floor is enforced by
												    the button's absence; the
												    transition floors at 0 too
												    (defense). */}
												{placed.indent > 0 && (
													<button
														type="button"
														data-parsons-outdent
														aria-label="Outdent line"
														onClick={() =>
															applyArrange({
																type: 'outdent',
																id: placed.id,
															})
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
														applyArrange({
															type: 'indent',
															id: placed.id,
														})
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
			{/* Attempt-history modal: renders at the end of the root so it is
			    reachable from BOTH views. React-state-driven. Each attempt's
			    snapshot is FROZEN at Check time and rendered verbatim — the
			    modal never re-grades. */}
			{historyOpen && (
				<div
					data-parsons-history-modal
					role="dialog"
					aria-modal="true"
					aria-label="Attempt history"
				>
					<header data-parsons-history-header>
						<strong>Attempt history</strong>
						<button
							type="button"
							data-parsons-history-close
							onClick={() => setHistoryOpen(false)}
						>
							Close
						</button>
					</header>
					{attempts.length === 0 ? (
						<p>No attempts yet — press Check to log one.</p>
					) : (
						<ol data-parsons-attempt-list>
							{attempts.map((attempt) => (
								<li
									key={attempt.index}
									data-parsons-attempt
									data-attempt-success={String(attempt.success)}
								>
									<div data-parsons-attempt-summary>
										Attempt {attempt.index} —{' '}
										{attempt.success ? 'solved' : 'not solved'} —{' '}
										{attempt.score}%
									</div>
									{/* The frozen snapshot: each placed line at its
									    checked indent, carrying the correctness it
									    was graded with. CSS folds `distractor` into
									    the wrong-place look (as on the board), so
									    the review never reveals which lines were
									    distractors. */}
									<ol data-parsons-attempt-snapshot>
										{attempt.snapshot.map((line, lineIndex) => (
											<li
												key={lineIndex}
												data-snapshot-line
												data-indent={line.indent}
												data-correctness={line.correctness}
											>
												{' '.repeat(line.indent * indentSize)}
												{line.code}
											</li>
										))}
									</ol>
								</li>
							))}
						</ol>
					)}
				</div>
			)}
		</div>
	);
}

/**
 * The lens object — the module's identity. Frozen at construction (the
 * consumer-facing freeze boundary); the composition root imports it by
 * reference and keys it by `name`.
 */
const parsonsLens: Lens = freezeInPlace<Lens>({
	name: 'parsons',
	label: 'rebuild the order',
	main: ParsonsMain,
	applicability: parsonsCore.applicability,
	config: parsonsCore.config,
	recommend: parsonsCore.recommend,
	phase: 'source',
});

export default parsonsLens;
