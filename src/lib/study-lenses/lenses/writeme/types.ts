/**
 * @file Domain model for the `writeme` lens — a write-the-code-from-scratch
 * recall exercise. The snippet IS the solution; the learner reconstructs it by
 * typing it back (paste-blocked) into a CodeMirror editor. An optional
 * comment-skeleton leaves comments + blank lines in place as scaffolding; and a
 * per-line diff PAIR is the feedback — the write editor flags typed-but-wrong
 * lines, and the read-only solution editor marks the lines not yet reproduced.
 *
 * Two layers (per the lenses region's two-layer module convention):
 * - The pure core (`./core.ts` + `./lib/comment-skeleton.ts` +
 *   `./lib/code-lines.ts` + `./lib/diff-lines.ts` + `./lib/no-paste-extension.ts`)
 *   produces the starting template, the shared code-line classifier, the per-line
 *   diff verdict, and the CodeMirror paste-block extension.
 * - The React wrapper (`./index.tsx`) composes the cores, owns the per-mount UI
 *   state (view mode, the four scaffold toggles — colorize / suggestions /
 *   comments / diff — and learner code), and dispatches user-interaction events.
 *
 * @remarks The lens does NOT mutate `embodiment` (deep-frozen per the `embody/`
 * contract) or `config`. Learner code exists only in per-mount React state — no
 * `localStorage`, no module-level cache, no refs across mounts. There is no
 * cross-mount persistence (disposable practice, per `../README.md`).
 *
 * @remarks `LensConfig` (from `../types.ts`) is the wrapper's prop type for
 * `config`; the lens reads five known fields (`viewMode` and the four scaffold
 * toggles `colorize` / `suggestions` / `keepComments` / `diff`)
 * and ignores the rest. Per-lens narrowing is captured in `WritemeLensConfig`
 * below — it documents the known fields but does NOT exclude unknown ones (config
 * is open-shape at the contract boundary). All documented fields are
 * `SerializableValue`-compliant (string / boolean primitives) — nested objects
 * are forbidden by `LensConfig`'s contract per `../types.ts` JSDoc on
 * `SerializablePrimitive`.
 */

// ─── View + scaffold toggles ───────────────────────────────

/**
 * Which surface the lens renders.
 *
 * @remarks
 * - `'write'` — the editable reconstruction surface: a paste-blocked CodeMirror
 *   editor the learner types the solution back into, with the toolbar and (when
 *   `diff` is on) the per-line diff overlay.
 * - `'read'` — the read-only study surface: the solution in a read-only
 *   CodeMirror editor PAIRED with the write editor (mirrors `colorize`; shows the
 *   diff from the solution side when `diff` is on). The learner's code is never
 *   shown — Write and Read are mutually exclusive while typing, so the learner
 *   recalls from memory rather than transcribing.
 *
 * The view toggle **preserves learner code** — `'read'` is a study affordance,
 * not a reset.
 */
type ViewMode = 'write' | 'read';

/**
 * The four **scaffold toggles** — independent (orthogonal) on/off axes, each a
 * different KIND of support, NOT an ordered difficulty ladder. A learner mixes
 * them freely; the all-off corner is genuine cold recall. All are `boolean`
 * fields on {@link WritemeLensConfig}.
 *
 * @remarks
 * - **`colorize`** (default `true`) — syntax *highlighting* of what the learner
 *   has typed. Readability scaffold; leaks no solution content. `false` keeps the
 *   dark editor chrome + the JavaScript language but drops token coloring (a
 *   dark-monochrome editor, not a white box).
 * - **`suggestions`** (default `false`) — typing autocomplete: JavaScript
 *   keywords + identifiers the learner has ALREADY typed (in-buffer locals), and
 *   **no snippet templates** (no `for`/`if`/`function` skeletons — those would
 *   hand structure). Syntax-production scaffold. Default OFF so the default stays
 *   a genuine recall task; it is the opt-in for blank-page paralysis. It cannot
 *   suggest the solution's unrevealed identifiers (they are not in the buffer),
 *   so it leaks no answer.
 * - **`keepComments`** (default `true`) — seed the editor with the comment
 *   skeleton (comments + blank lines kept; executable code stripped) vs a blank
 *   slate. Intent/structure scaffold. Comment lines are ungraded freebies.
 * - **`diff`** (default `true`) — per-line diff highlighting against the solution
 *   (a CodeMirror `Decoration.line` on each `'diff'`-status line). Feedback
 *   scaffold; flags WHICH lines diverge, never the correct text. Default `true`
 *   (per `./DOCS.md` § Why default the editor to diff).
 *
 * Toggling any scaffold **preserves the learner's typed code** (and cursor /
 * history / scroll): the editor mounts once and each toggle live-reconfigures a
 * CodeMirror `Compartment` rather than remounting — see `./DOCS.md` § Why
 * scaffold toggles use compartments.
 */

// ─── Per-line diff ──────────────────────────────────────────

/**
 * The per-line verdict comparing the learner's code to the solution, line index
 * `i` vs line index `i`, compared TRIMMED (content, not whitespace).
 *
 * @remarks
 * - `'comment'` — the solution line bears no executable code (blank /
 *   whitespace-only / comment-only). Ungraded freebie: excluded from the code-line
 *   tally, never highlighted. (The comment skeleton seeds these verbatim.)
 * - `'match'` — a code line whose trimmed learner text equals the solution's.
 * - `'diff'` — a code line whose trimmed learner text differs and is non-empty
 *   (typed-but-wrong). The only status the `diff`-mode visual highlights.
 * - `'empty'` — a code line the learner has left blank (unattempted). Counts
 *   toward the code-line tally but is left NEUTRAL in the diff visual ("not done",
 *   not "wrong").
 *
 * A "code line" is a solution line whose text, with comments stripped, is
 * non-empty. Only code lines are graded; comment lines are freebies.
 */
type LineStatus = 'match' | 'diff' | 'empty' | 'comment';

/**
 * The diff evaluator's return shape: per-line verdicts plus code-line tallies.
 * Produced by `lib/diff-lines.ts`; `perLine` powers the `diff`-pair line
 * decorations (the live feedback).
 *
 * @remarks `perLine[i]` is the verdict for solution line `i` (so
 * `perLine.length === solution line count`). `total` is the number of CODE lines
 * (`match` + `diff` + `empty`) — comment lines are excluded so an honest reproduced
 * count reflects work the learner actually did (counting skeleton-seeded comment
 * lines would inflate it before any typing). `matched` is the number of `'match'`
 * lines.
 *
 * @remarks `matched` / `total` are an HONEST reproduced-line tally — a numeric
 * "X / N code lines" summary was considered and CUT (the live diff PAIR is the
 * feedback; a separate score would have been redundant). They remain a cheap, free
 * byproduct of the single diff pass (it already walks every line for the visual)
 * and a clean extension point should a numeric summary ever be wanted; `total === 0`
 * (no code lines) is vacuously complete (no `NaN`). Not currently surfaced in the UI.
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
 * @remarks All fields are `SerializableValue`-compliant per `../types.ts`: a
 * string primitive (`viewMode`) or booleans (the four scaffold toggles — see
 * above). No arrays, no nested objects.
 *
 * @remarks Defaults (per `./README.md` § The lens contract). Note the asymmetry —
 * `suggestions` is the one toggle that defaults OFF:
 * - `viewMode` → `'write'`
 * - `colorize` → `true`
 * - `suggestions` → `false`
 * - `keepComments` → `true`
 * - `diff` → `true`
 */
type WritemeLensConfig = {
	readonly viewMode?: ViewMode;
	readonly colorize?: boolean;
	readonly suggestions?: boolean;
	readonly keepComments?: boolean;
	readonly diff?: boolean;
};

// ─── Exports ────────────────────────────────────────────────

export type { DiffResult, LineStatus, ViewMode, WritemeLensConfig };
