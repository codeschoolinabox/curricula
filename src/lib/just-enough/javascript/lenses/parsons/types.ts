/**
 * @file Domain model for the `parsons` lens — a drag-and-drop
 * line-ordering exercise over the snippet's source text.
 *
 * Two layers (per the lenses peer's two-layer module convention):
 * - The pure-TS core (`./core.ts` + `./shuffle.ts`) produces the
 *   shuffled row sequence the wrapper renders.
 * - The React wrapper (`./index.tsx`) composes the core, owns the
 *   per-mount UI state (the current row order, the resolved seed),
 *   and renders the draggable row stack.
 *
 * @remarks The lens does NOT mutate `embodiment` (deep-frozen per the
 * `embody/` contract) or `config`. Row ordering exists only in
 * per-mount React state — no `localStorage`, no module-level cache,
 * no refs across mounts. See `../README.md` § Disposable practice.
 *
 * @remarks `ParsonsLensConfig` is a documentation device naming the
 * fields the lens *reads* — it does NOT narrow what callers may
 * *pass*. Unknown educator-supplied fields pass through `config()`
 * untouched, per the open-shape contract on `LensConfig`.
 */

// ─── Per-row metadata ───────────────────────────────────────

/**
 * One row of the shuffled stack — corresponds to one line of source.
 * `text` is the line content (without the trailing `\n`).
 * `originalIndex` is the row's 0-based index in the unshuffled
 * source; the wrapper uses it as both the React key and the
 * correctness comparison target.
 */
type Row = {
	readonly text: string;
	readonly originalIndex: number;
};

// ─── Per-lens config narrowing ──────────────────────────────

/**
 * The fields this lens reads from `LensConfig`. The type does NOT
 * exclude additional fields — `LensConfig` is open-shape at the
 * contract boundary — but it documents what the lens looks for.
 *
 * @remarks Defaults:
 * - `seed` → per-mount random seed computed by the wrapper at first
 *   render. The core's shuffle function takes a numeric seed as
 *   input; the wrapper owns the non-determinism source. Tests pin
 *   `seed` explicitly for reproducible row sequences.
 *
 * v1 intentionally ships with no other knobs (per `../README.md` §
 * Public API). The single-purpose surface is line-ordering; any
 * additional knobs (distractor injection, syntax highlighting,
 * variant selection) land in follow-up increments.
 */
type ParsonsLensConfig = {
	readonly seed?: number;
};

// ─── Exports ────────────────────────────────────────────────

export type { Row, ParsonsLensConfig };
