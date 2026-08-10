/* cspell:disable */
/* ANNOTATED QUARRY COPY (ruling R-5). The body after the marker line and
one blank line is byte-identical to git blob 5f39c974df5d1d04809e6702ae4ed1608fba4973
(src/lib/study-lenses--deprecated-architecture/lenses/socratize/types.ts
at HEAD 1f0fb2d9, copied 2026-08-10). Designated source for the future
Stage-4 socratize lens session; NEVER edit the body. See the sibling README.md
copy header for the applicable rulings. Verify: strip everything through
the marker line plus one blank line, then diff against: git show 5f39c974df5d1d04809e6702ae4ed1608fba4973 */
/* ⇩ byte-identical quarry body below this line ⇩ */

/**
 * @file Domain model for the `socratize` lens — the OPEN / Socratic register of
 * study questions, sourced read-only through the question-orchestrator's
 * `composeQuestions`. The lens re-implements nothing: it filters the OUTER
 * `register: 'open'` arm and renders each item's native `CodeQuestion`
 * (`context` + `questions[]`) as-is, disclosed through the Feedback Ladder.
 * Non-gradable by charter — no verdict, no mastery, no answer key (the `quiz`
 * sibling owns the closed register).
 *
 * Register homonym (load-bearing): the OUTER `OrchestratedItem.register`
 * (`open | closed` — the which-lens axis this lens FILTERS) is NOT the INNER
 * `Question.register` (`open | pointed | comparative` — the rhetorical rung this
 * lens RENDERS and escalates). See ./README.md § Glossary.
 */

import type { OpenOrchestratedItem } from '../../lib/question-orchestrator/types.js';

/**
 * Per-lens narrowing of `LensConfig` (`../types.ts`) — documents the one knob
 * the lens reads. Flat + `SerializableValue`-compliant (a string primitive,
 * never a nested object); unknown keys pass through unchanged (open-shape
 * contract). This is a documentation shape, not `config()`'s return type —
 * `config()` returns the wide `LensConfig` and the component reads
 * `config.disclosure` off it.
 *
 * @remarks `disclosure` governs the Feedback Ladder:
 * - `'ladder'` (default, v1) — reveal the `open` rung first; escalate to
 *   `pointed` then `comparative` on demand.
 * - `'all'` — reveal every present rung at once (an educator escape hatch; its
 *   v1 build is a gate question — see ./README.md § Glossary → Feedback Ladder).
 * An unrecognized value falls back to `'ladder'` (the component narrows the wide
 * `SerializableValue` and defaults anything else).
 */
type SocratizeLensConfig = Readonly<{
	disclosure?: 'ladder' | 'all';
}>;

/**
 * What `core.selectOpen` returns: the OUTER-open arm of the composed stream,
 * each whole `OpenOrchestratedItem` (retaining `anchorOffsets` for picking +
 * highlighting, the namespaced `id`, and `cells`). The native `CodeQuestion`
 * lives at `item.question`; the lens renders it as-is and never forks or widens
 * it.
 */
type SocraticModel = readonly OpenOrchestratedItem[];

/**
 * The open items split by anchor scope on `question.nodeType === 'Program'`:
 * `elementScoped` items are reachable by clicking their span in the editor
 * (`itemsAt` containment); `programLevel` items span the whole source (the
 * socratizing engine's `nodeType: 'Program'` convention) and render in the
 * always-visible overview shelf. Disjoint by construction — the discriminant is
 * a crisp generation-time flag, not a span heuristic.
 */
type SocraticPartition = Readonly<{
	elementScoped: readonly OpenOrchestratedItem[];
	programLevel: readonly OpenOrchestratedItem[];
}>;

/**
 * Per-mount reveal state for the Feedback Ladder — keyed by each open item's
 * **stable per-mount index** in the memoized `SocraticModel`, the count of rungs
 * currently revealed (`1` = the `open` rung only; increments on each
 * reveal-click, capped at the number of distinct present rungs the item's
 * `CodeQuestion` carries). An item absent from the map is at its default (one
 * rung shown). Persists across re-picks for the life of the mount; disposable —
 * never persisted across mounts.
 *
 * @remarks The key is the array index, **not** `CodeQuestion.id`: socratizing
 * ids are constant per analyzer (two `let` declarations both yield
 * `id: 'let-vs-const'`), so the orchestrator contract warns "do not dedup on
 * `id`" — only the memoized index is a collision-free per-card identity. A
 * "rung" is a present `Question.register` in `open → pointed → comparative`
 * order; the count indexes distinct present registers (a register carrying more
 * than one question reveals them together).
 */
type RevealLadder = Readonly<Record<number, number>>;

export type {
	RevealLadder,
	SocraticModel,
	SocraticPartition,
	SocratizeLensConfig,
};
