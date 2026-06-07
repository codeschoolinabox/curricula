/**
 * @file Domain model for the `writeme` lens — a write-the-code-from-scratch
 * recall exercise. The snippet IS the solution; the learner reconstructs it by
 * typing it back (paste-blocked) into a CodeMirror editor. An optional
 * comment-skeleton leaves comments + blank lines in place as scaffolding; a
 * per-line diff highlights non-matching lines; a Check reports honestly how many
 * code lines have been reproduced.
 *
 * Two layers (per the lenses peer's two-layer module convention):
 * - The pure-TS core (`./core.ts` + `./lib/comment-skeleton.ts` +
 *   `./lib/diff-lines.ts` + `./lib/generate-hints.ts` +
 *   `./lib/no-paste-extension.ts`) produces the starting template, the per-line
 *   diff verdict, the generated hints, and the CodeMirror paste-block extension.
 * - The React wrapper (`./index.tsx`) composes the cores, owns the per-mount UI
 *   state (view mode, editor mode, keep-comments, hints mode, learner code,
 *   check summary, revealed-hint ids), and dispatches user-interaction events.
 *
 * @remarks The lens does NOT mutate `embodiment` (deep-frozen per the `embody/`
 * contract) or `config`. Learner code, the check summary, and revealed-hint ids
 * exist only in per-mount React state — no `localStorage`, no module-level cache,
 * no refs across mounts. There is no cross-mount persistence (no URL config — a
 * deliberate divergence from `blanks`). See `../README.md` § Disposable practice.
 *
 * @remarks `LensConfig` (from `../types.ts`) is the wrapper's prop type for
 * `config`; the lens reads four known fields (`viewMode`, `editorMode`,
 * `keepComments`, `hintsMode`) and ignores the rest. Per-lens narrowing is
 * captured in `WritemeLensConfig` below — it documents the known fields but does
 * NOT exclude unknown ones (config is open-shape at the contract boundary). All
 * four documented fields are `SerializableValue`-compliant (string / boolean
 * primitives) — nested objects are forbidden by `LensConfig`'s contract per
 * `../types.ts` JSDoc on `SerializablePrimitive`.
 *
 * @remarks Naming note: vocabulary matches the legacy `WritemeLens.jsx` directly
 * (`write` / `read` mode, `keep comments`, the comment skeleton, hints). The
 * `editor mode` (`diff` / `raw`) vocabulary is adopted from the `blanks` lens's
 * editor-mode ladder (`blanks` adds a third `helpful` mode that writeme has no
 * analog for — writeme has no per-token correctness).
 */

// ─── View + editor mode ─────────────────────────────────────

/**
 * Which surface the lens renders.
 *
 * @remarks
 * - `'write'` — the editable reconstruction surface: a paste-blocked CodeMirror
 *   editor the learner types the solution back into, with the toolbar and the
 *   hints panel.
 * - `'read'` — the read-only self-check surface: the solution rendered beside the
 *   learner's attempt (side-by-side `<pre>` panels; no editor).
 *
 * The view toggle **preserves learner code** (parity with legacy) — `'read'` is a
 * self-check affordance, not a reset. Mirrors the shared `viewMode` config key
 * across lenses (`blanks`: `blankenated|complete`; `parsons`: `work|complete`);
 * the values are writeme-specific.
 */
type ViewMode = 'write' | 'read';

/**
 * The write editor's feedback intensity. Only meaningful in `'write'` view.
 *
 * @remarks
 * - `'diff'` — per-line diff highlighting against the solution (a CodeMirror
 *   `Decoration.line` on each `'diff'`-status line). The always-on honest
 *   feedback. **Default** (per `./README.md` § Public API + `./DOCS.md` § Why
 *   default the editor to diff — shipping feedback-off recreates the
 *   weak-shell failure this redo exists to prevent).
 * - `'raw'` — no feedback overlay; pure recall. Check and Read remain available
 *   on demand.
 *
 * Adapted from the `blanks` `EditorMode` ladder, minus `'helpful'` (writeme has
 * no per-token correctness to color). Switching `diff` ↔ `raw` **preserves**
 * learner code (both modes share one free-form document) — a deliberate
 * divergence from `blanks`, whose mode switch resets learner code because its
 * modes carry incompatible placeholder invariants.
 */
type EditorMode = 'diff' | 'raw';

/**
 * Whether the on-demand hints panel renders in the write view.
 *
 * @remarks Default `'on'`. Toggling `'on'` ↔ `'off'` gates rendering only;
 * each hint's revealed/hidden state is preserved across toggles (parity with the
 * legacy's render-only `showHints`). Only Reset re-hides all hints. The revealed
 * state is wrapper-internal (a set of revealed hint ids), NOT part of `Hint`.
 */
type HintsMode = 'on' | 'off';

// ─── Hints ──────────────────────────────────────────────────

/**
 * A generated hint's category (drives the leading icon and the wording register).
 *
 * @remarks
 * - `'concept'` — a code-element reminder derived from a regex match (e.g.
 *   "define a function named `classify`", "declare a variable called `total`").
 * - `'structure'` — a whole-program reminder (e.g. "this program has 7 lines",
 *   "think about the logical flow").
 */
type HintType = 'concept' | 'structure';

/**
 * One generated hint. Produced by `lib/generate-hints.ts` from the solution.
 *
 * @remarks `Hint` is immutable hint DATA only — it carries no `revealed` flag.
 * Reveal state is wrapper-internal (a `ReadonlySet<string>` of revealed ids,
 * keyed by `id`), so the pure generator stays free of UI state (cf. `blanks`
 * `revealCounts`). `id` follows the legacy scheme — `hint_<n>` for concept hints
 * (0-based, registration order) and `structural_<n>` for structural hints
 * (0-based) — stable within one generation so the wrapper can key reveal state by
 * it. The combined concept-then-structure list is capped at 8 (concept hints take
 * precedence — structural hints are dropped first when the cap bites; legacy
 * parity).
 */
type Hint = Readonly<{
	id: string;
	text: string;
	type: HintType;
}>;

// ─── Per-line diff ──────────────────────────────────────────

/**
 * The per-line verdict comparing the learner's code to the solution, line index
 * `i` vs line index `i`, compared TRIMMED (content, not whitespace).
 *
 * @remarks
 * - `'comment'` — the solution line bears no executable code (blank /
 *   whitespace-only / comment-only). Ungraded freebie: excluded from the Check
 *   total, never highlighted. (The comment skeleton seeds these verbatim.)
 * - `'match'` — a code line whose trimmed learner text equals the solution's.
 * - `'diff'` — a code line whose trimmed learner text differs and is non-empty
 *   (typed-but-wrong). The only status the `diff`-mode visual highlights.
 * - `'empty'` — a code line the learner has left blank (unattempted). Counts
 *   toward the Check total but is left NEUTRAL in the diff visual ("not done",
 *   not "wrong" — parity with how `blanks` leaves an unfilled blank neutral).
 *
 * A "code line" is a solution line whose text, with comments stripped, is
 * non-empty — the legacy's own classifier (`WritemeLens.jsx` line ~218). Only
 * code lines are graded; comment lines are freebies.
 */
type LineStatus = 'match' | 'diff' | 'empty' | 'comment';

/**
 * The diff evaluator's return shape: per-line verdicts plus code-line tallies.
 * Produced by `lib/diff-lines.ts`; powers both the `diff`-mode line decorations
 * and the honest Check.
 *
 * @remarks `perLine[i]` is the verdict for solution line `i` (so
 * `perLine.length === solution line count`). `total` is the number of CODE lines
 * (`match` + `diff` + `empty`) — comment lines are excluded so the Check reflects
 * work the learner actually did (counting skeleton-seeded comment lines would
 * inflate it before any typing — the dishonesty this lens's feedback redesign
 * avoids). `matched` is the number of `'match'` lines. The Check reports
 * `matched / total`; `total === 0` (no code lines) is vacuously complete (no
 * `NaN`).
 *
 * @remarks `matched` / `total` are precomputed by the single pure diff pass
 * rather than re-derived at the Check call-site — this keeps the comment-exclusion
 * and `total === 0`-vacuous rules in one place (the diff already walks every line
 * for the visual, so the tallies are free).
 */
type DiffResult = Readonly<{
	perLine: ReadonlyArray<LineStatus>;
	matched: number;
	total: number;
}>;

// ─── Per-lens config narrowing ──────────────────────────────

/**
 * The fields this lens reads from `LensConfig`. The type does NOT exclude
 * additional fields — `LensConfig` is open-shape at the contract boundary — but
 * it documents what the lens looks for and what defaults apply when a field is
 * absent.
 *
 * @remarks All four fields are `SerializableValue`-compliant per `../types.ts`:
 * string primitives (`viewMode`, `editorMode`, `hintsMode`) or a boolean
 * (`keepComments`). No arrays, no nested objects.
 *
 * @remarks Defaults (per `./README.md` § Public API):
 * - `viewMode` → `'write'`
 * - `editorMode` → `'diff'`
 * - `keepComments` → `true`
 * - `hintsMode` → `'on'`
 */
type WritemeLensConfig = {
	readonly viewMode?: ViewMode;
	readonly editorMode?: EditorMode;
	readonly keepComments?: boolean;
	readonly hintsMode?: HintsMode;
};

// ─── Exports ────────────────────────────────────────────────

export type {
	DiffResult,
	EditorMode,
	Hint,
	HintType,
	HintsMode,
	LineStatus,
	ViewMode,
	WritemeLensConfig,
};
