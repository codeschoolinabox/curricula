# lenses/writeme

The `writeme` lens — a **write-the-code-from-scratch recall exercise** over a
frozen snippet. The snippet IS the solution; the learner reconstructs it by
**typing it back from memory** into a paste-blocked CodeMirror editor. An
optional **comment skeleton** leaves the comments (and blank lines) in place as
scaffolding while stripping the executable code; turning it off gives a blank
slate. As the learner types, a **diff** view highlights the lines that do not
yet match the solution; a **Check** reports honestly how many code lines have
been reproduced; a **Read** view shows the solution beside the learner's attempt
for self-comparison.

The exercise is about **recall and motor reproduction**, not recognition: paste
is blocked in every editable mode so the learner produces the code rather than
copying it.

One of the lens-module implementations the orchestrator's picker enumerates and
the recommender ranks.

> Migrated from the pre-refactor `WritemeLens.jsx` (registry id `writeme`). The
> V2 redo preserves the legacy's pedagogical surface (paste-blocked write
> editor, comment-skeleton scaffolding, solution reference, hints, reset) while
> replacing structural pieces (Preact `useApp`/`useColorize` contexts →
> `embodiment` prop; imperative `setTimeout` editor wiring → a `useEffect`
> mount; the gameable concept-count "progress" score → an honest per-line diff +
> line count) and adopting the `blanks` editor-mode ladder (`diff` / `raw`). See
> [`./DOCS.md`](./DOCS.md) for the migration audit trail and decision log.

## Public API

The module's default export is a frozen `LensModule` per
[`../types.ts`](../types.ts) § LensModule:

```ts
import writeme from './index.js';

// orchestrator mounts in lens mode:
<writeme.Component embodiment={frozenSnippet} config={resolved} />;
```

Fields:

- `name: 'writeme'` — registry identity.
- `Component: ComponentType<LensProps>` — React wrapper around the lens's
  pure-TS core. Renders the writeme surface (`<div data-lens="writeme">`) with
  the toolbar, the CodeMirror write editor, the read-view comparison, the hints
  panel, and the instructions accordion.
- `config(overrides?): LensConfig` — resolves the per-lens config. Returns a
  frozen `LensConfig` (flat `Record<string, SerializableValue>` per
  [`../types.ts`](../types.ts) `LensConfig`); unknown keys in `overrides` are
  spread through unchanged (open-shape contract). Fields the lens reads:
  - `viewMode?: 'write' | 'read'` (default `'write'`) — initial view. `'write'`
    is the editable reconstruction surface; `'read'` reveals the solution beside
    the learner's attempt.
  - `editorMode?: 'diff' | 'raw'` (default `'diff'`) — the feedback intensity of
    the write editor. `'diff'` highlights each line of the learner's code that
    does not yet match the corresponding solution line (the honest, always-on
    feedback). `'raw'` removes all feedback overlay — a pure-recall mode for
    learners who want no signal until they ask (via Check or Read). The default
    is `'diff'` so the lens shows its honest feedback mechanism working on first
    open rather than presenting a feedback-free box (see
    [`./DOCS.md`](./DOCS.md) § Why default the editor to diff).
  - `keepComments?: boolean` (default `true`) — whether the write editor is
    seeded with the **comment skeleton** (comments + blank lines preserved,
    executable code stripped) as scaffolding. When `false`, the editor starts
    empty (blank slate — the harder recall task).
  - `hintsMode?: 'on' | 'off'` (default `'on'`) — whether the on-demand hints
    panel renders in the write view. When `'on'`, the learner can reveal
    generated hints one at a time; when `'off'`, the panel does not render.
- `applicableTo(embodiment): boolean` — returns `true` (Tier 1 per
  [`../README.md`](../README.md) § Three-tier classification). Writing code back
  from memory needs neither an AST nor a successful parse — the lens renders the
  snippet's `source.code` as the solution and grades the learner's text
  line-by-line. **A deliberate divergence from `blanks`** (Tier 2,
  `status.parsed`): writeme does not parse. Suitability (a snippet long enough
  to be worth retyping) is the recommender's concern, not a hard applicability
  gate.
- `recommend(embodiment): ReadonlyArray<Recommendation>` — returns `[]` for this
  batch. Block-Model placement contributions land once the WS2 analysis pipeline
  ships. See [Future direction](#future-direction).

## Why this lens exists

`writeme` is the learner's **reproduction workbench**. Where `parsons` asks the
learner to order given lines and `blanks` asks them to fill given holes,
`writeme` asks them to **produce the whole program from memory** — the furthest
point on the recognition → recall spectrum among the three. Retyping working
code from scratch builds the motor and recall fluency that recognition exercises
do not exercise; blocking paste is what makes it a reproduction task rather than
a copy task.

The comment skeleton is the scaffolding dial: with comments kept, the learner
reconstructs code against a running commentary of intent (a guided
reconstruction); with comments off, the learner reproduces the whole thing from
a blank page (unaided recall). The diff view and the Check make the exercise
self-pacing — the learner sees which lines still diverge and how many they have
reproduced, rather than guessing until a submit-then-grade round-trip.

`blanks` is, in effect, a more heavily scaffolded `writeme`: the same "reproduce
the source" goal, but with most of the source already on screen and only
selected tokens blanked. `writeme` shares `blanks`'s `diff` / `raw` editor modes
(adapted to whole-line granularity) but drops the blank-filling scaffolding
entirely.

## Glossary

Vocabulary used throughout this lens. Legacy terms surface from the pre-refactor
`WritemeLens.jsx`.

- **Solution** — the snippet's `embodiment.source.code`: the correct, complete
  program the learner reconstructs. The lens renders it (in the read view and as
  the diff/Check reference) but never mutates it.
- **Learner code** — the text the learner has typed into the write editor. Lives
  in per-mount React state (mirrored into the CodeMirror document); never
  written back to the orchestrator's snippet.
- **Write view** — the editable reconstruction surface: a CodeMirror editor the
  learner types into, paste-blocked, with the hints panel and the toolbar.
- **Read view** — the read-only self-check surface: the solution shown beside
  the learner's attempt (side-by-side), rendered as plain `<pre>` text (no
  editor).
- **Editor mode** — `'diff' | 'raw'`. The write editor's feedback intensity.
  `diff` highlights non-matching lines; `raw` shows no feedback overlay.
- **Comment skeleton** — the write editor's optional starting template: the
  solution with executable code stripped but **comments, blank lines, and line
  count preserved**. A code-bearing line becomes its leading whitespace plus any
  comments it carried (or an empty line if it carried none); a comment-only,
  blank, or inside-block-comment line is kept verbatim. Produced by
  `lib/comment-skeleton.ts`.
- **Keep comments** — the toggle that selects the starting template: the comment
  skeleton (`true`) or a blank slate (`false`).
- **Code line** — a solution line that bears executable code (its text, with
  comments stripped, is non-empty). These are the lines the learner must
  reproduce — the only lines the Check counts and the diff grades.
- **Comment line** — a solution line that is blank, whitespace-only, or
  comment-only. The comment skeleton seeds these verbatim; they are **freebies**
  — not counted by the Check, not flagged by the diff.
- **Line status** — the per-line diff verdict: `match` (learner's trimmed line
  equals the solution's), `diff` (a code line the learner typed differently),
  `empty` (a code line the learner has left blank), or `comment` (a comment line
  — ungraded).
- **Diff** — the per-line comparison of learner code against the solution (line
  index _i_ vs line index _i_, compared trimmed). Powers both the `diff`-mode
  line highlighting and the Check. Produced by `lib/diff-lines.ts`.
- **Check** — the learner action that reports, honestly, how many code lines
  have been reproduced (`X / N code lines`). Re-runnable; non-destructive. It
  makes no "complete" / "done" claim — reproducing N of N lines is the literal
  measurement, not a mastery verdict.
- **Hint** — a generated reminder about the program's structure (e.g. "define a
  function named `classify`", "this program has 7 lines"), revealed on demand
  one at a time. Produced by `lib/generate-hints.ts`.
- **Paste-blocked** — the write editor rejects keyboard (`Mod-V`) and
  context-menu paste, in every editable mode, so the learner types the code
  rather than pasting the solution. Provided by `lib/no-paste-extension.ts`.

## UI structure

```text
<div data-lens="writeme"
     data-view-mode="write|read"
     data-editor-mode="diff|raw"
     data-hints-mode="on|off">
  <header data-writeme-toolbar>        — controls
    <button data-view-toggle="write">  —   editable reconstruction surface
    <button data-view-toggle="read">   —   solution + comparison (self-check)
    <button data-editor-mode-toggle="diff"> — feedback on (highlight non-matching lines)
    <button data-editor-mode-toggle="raw">  — feedback off (pure recall)
    <label data-keep-comments>         —   checkbox: seed comment skeleton vs blank slate
    <button data-hints-toggle>         —   show / hide the hints panel
    <button data-check>                —   report "X / N code lines reproduced"
    <button data-reset>                —   restore the starting template, clear feedback
  — write view (data-view-mode="write") —
  <div data-writeme-editor-host>       —   CodeMirror editor (editable, paste-blocked;
                                            diff-mode adds per-line highlight)
  <… data-writeme-check-summary>       —   after Check: "X / N code lines (P%)", aria-live
  <aside data-writeme-hints>           —   on-demand hint reveal (when data-hints-mode="on")
  — read view (data-view-mode="read") —
  <div data-writeme-comparison>        —   side-by-side <pre> panels:
    <pre data-writeme-solution>        —     the solution (read-only)
    <pre>                              —     the learner's attempt (read-only)
  — always —
  <details data-writeme-instructions>  —   collapsible "How to use" help
</div>
```

The `data-lens` attribute is the lenses-peer invariant (see
[`../DOCS.md` § Structural constraints](../DOCS.md)). All `data-writeme-*` /
`data-view-toggle` / `data-editor-mode-toggle` / `data-keep-comments` /
`data-hints-toggle` / `data-reset` / `data-check` hooks are sandbox-harness
selectors and CSS hooks; renaming any is a contract change. `data-*` values
reflect committed config/view state. Toggle buttons carry `aria-pressed`; the
Check summary carries `aria-live="polite"`.

## Toolbar contract

- **View toggle** — two `<button>`s ("✏️ Write" / "👁️ Read"). The active view is
  reflected by `data-view-mode` on the root. Toggling **preserves the learner's
  code** (parity with legacy) — Read is a self-check affordance ("let me compare
  what I typed against the solution"), not a reset. Learner code lives in
  lens-local React state for the lifetime of the mount.
- **Editor-mode toggle** — two `<button>`s ("Diff" / "Raw"), shown only in the
  write view. Switches the write editor's feedback overlay; reflected by
  `data-editor-mode`. Switching mode preserves the learner's code (it re-mounts
  the editor on the same document — see
  [Write-view contract](#write-view-contract)).
- **Keep comments** — a `<label><input type="checkbox">` that selects the
  starting template: the comment skeleton (checked) or a blank slate
  (unchecked). Toggling re-seeds the write editor **only while it is pristine**
  (still empty, or still equal to the current starting template — i.e. the
  learner has not yet diverged). Once the learner has typed divergent code,
  toggling instead updates the hint set and the template a subsequent **Reset**
  will produce, leaving the editor untouched, and the toolbar surfaces a quiet
  "Reset to apply" affordance — the learner's text is **never silently
  discarded**. (The legacy guarded its seed with `studentEditorInitialized`, so
  its checkbox felt dead once typing began; the pristine-gated re-seed makes the
  control work on the common before-typing case without the destructive surprise
  of nuking in-progress work — see
  [What this lens does NOT do](#what-this-lens-does-not-do-lens-specific-drops-only).)
- **Hints toggle** — a `<button>` ("💡 Show / Hide Hints") that flips
  `hintsMode`; reflected by `data-hints-mode`. When off, the hints panel does
  not render.
- **Check** — a `<button>` ("🔍 Check") that computes and renders the honest
  line-reproduction summary (see [Check contract](#check-contract)).
- **Reset** — a `<button>` ("🔄 Reset") that restores the write editor to its
  starting template (per the current Keep-comments setting) and clears the Check
  summary and any revealed hints.

## Write-view contract

- The write view renders a CodeMirror editor (`javascript()` language, `oneDark`
  theme, the vendored `noPasteExtension`) seeded with the starting template: the
  comment skeleton (when `keepComments`) or an empty document. The editor is
  editable; an `updateListener` mirrors learner edits into local `learnerCode`
  state. The lens NEVER calls the orchestrator's snippet setter — learner code
  lives in lens-local state per the disposable-practice contract; the
  orchestrator's snippet (`embodiment.source.code`) is unchanged.
- **Paste is blocked in both `diff` and `raw` modes.** This is a deliberate
  divergence from `blanks` (whose `diff` mode permits paste because its
  length-matched placeholders are position-locked, so a paste cannot smuggle in
  the answer). `writeme` has no anchors — pasting the solution would defeat the
  entire reproduction exercise — so paste stays blocked in every editable mode.
- The starting-template string is computed **synchronously** so the editor's
  first paint already shows the skeleton (no empty-then-filled flicker).
- Editor-mode and keep-comments changes recreate the CodeMirror `EditorView`
  (the editor is imperatively mounted in a `useEffect`); the mount reads the
  current learner code from a ref so a re-mount preserves in-progress edits
  where appropriate (mode switch) and re-seeds where appropriate (keep-comments
  / reset).

## Diff-mode contract

- In `diff` mode the write editor highlights each **code line the learner has
  typed that does not match** the corresponding solution line (a `diff` status —
  compared by line index, see [Diff semantics](#diff-semantics)). Matching
  lines, comment lines, and **not-yet-attempted (empty) code lines are left
  neutral** — an empty code line is "not done," not "wrong" (parity with how
  `blanks` leaves an unfilled blank neutral rather than red). The highlight is a
  CodeMirror line decoration (`Decoration.line`), recomputed per edit from
  `lib/diff-lines.ts`.
- In `raw` mode no decoration attaches — the learner reconstructs with no
  feedback overlay (Check and Read remain available on demand).
- The diff is a **drift signal, not a grade**: if the learner inserts or deletes
  whole lines, the index alignment shifts and downstream lines will flag as
  differing — the visible shift tells the learner they have drifted from the
  solution's line structure. (Order-insensitive alignment is a future
  direction.)

## Diff semantics

`lib/diff-lines.ts` compares the learner's code to the solution **line by line,
by index** (learner line _i_ vs solution line _i_), each compared **trimmed**
(we grade line content, not indentation or trailing whitespace). The comment
skeleton preserves the solution's line count, so index alignment holds while the
learner fills lines in place. Each solution line resolves to one `LineStatus`:

- `comment` — the solution line bears no executable code (blank / whitespace /
  comment-only). Ungraded; never highlighted; excluded from the Check total.
- `match` — a code line whose trimmed learner text equals the solution's.
- `diff` — a code line whose trimmed learner text differs (and is non-empty).
- `empty` — a code line the learner has left blank.

The Check **total** is the number of code lines (`match` + `diff` + `empty`);
the Check **matched** is the number of `match` lines. Comment lines are excluded
so the count reflects work the learner actually did — the comment skeleton seeds
the comment lines, so counting them would inflate the score before the learner
typed anything (the dishonesty this lens's feedback redesign exists to avoid).

The `diff`-mode highlight uses only the `diff` status (typed-but-wrong);
`match`, `comment`, and `empty` lines are left unhighlighted. The Check counts
`match` against the full code-line total (so `empty` lines lower the fraction
without being painted red). The two surfaces share one `diffLines` computation
but read different fields of it.

## Check contract

Clicking **Check** renders, into `data-writeme-check-summary` (aria-live), an
honest summary: **`X / N code lines reproduced (P%)`**, where `N` is the number
of code lines in the solution, `X` is the number the learner has reproduced
exactly (trimmed), and `P = Math.round(X / N * 100)`. When `N === 0` (no code
lines — empty or comment-only solution) the summary reads "no code lines to
reproduce" (vacuously complete; no `NaN%`).

The summary makes **no "complete" / "you're done" claim** — `X / N` is a literal
measurement of line reproduction, not a mastery verdict. This is the deliberate
replacement for the legacy's gameable "progress" score (which averaged a
regex-concept-presence count with a length ratio and declared ≥ 85% "complete" —
reachable by typing the right keywords at the right length without writing
working code). See [`./DOCS.md`](./DOCS.md) § Why the honest line-count replaces
the legacy score.

## Hints panel contract

When `hintsMode === 'on'` and the view is `write`, an
`<aside data-writeme-hints>` renders the generated hints (from
`lib/generate-hints.ts`) with on-demand reveal: each hint starts hidden behind a
"Reveal hint" button; clicking reveals that hint's text. **Toggling `hintsMode`
off then on preserves each hint's revealed/hidden state** — the toggle gates
rendering only (parity with the legacy's render-only `showHints`); only
**Reset** re-hides all hints.

Hints are generated from the solution by regex analysis — concept hints ("define
a function named `classify`", "declare a variable called `total`") followed by
structural hints ("this program has 7 lines", "think about the logical flow") —
and the combined list is **capped at 8**. Concept hints take precedence: on a
concept-rich snippet the cap drops the structural hints first (legacy parity),
so the structural hints are not guaranteed to appear. The hint set depends on
`keepComments` (with comments kept, hints emphasize implementation; with
comments off, they emphasize structure), matching the legacy's two pattern sets.

The hints are faithful ports of the legacy generator and are intentionally
generic; richer, cursor-scoped hints (as `blanks` ships) are a future direction.

## Read-view contract

The read view renders the solution beside the learner's attempt as two read-only
`<pre>` panels inside `data-writeme-comparison` (left: `data-writeme-solution`,
the solution; right: the learner's code). It contains **no CodeMirror editor** —
a deliberate consolidation of the legacy, which rendered the solution twice
(once in a read-only editor and again in a comparison grid). The read view is
purely for self-comparison; the learner returns to the write view to keep
typing.

## Edge cases

- **Empty source** (`embodiment.source.code === ''`). The comment skeleton of
  `''` is `''`; the write editor starts empty; the diff has zero code lines; the
  Check reads "no code lines to reproduce." No crash, no `NaN` — this also fixes
  a latent legacy defect (the legacy's length-ratio score divided by zero
  solution lines, yielding `NaN%`; V2's code-line Check is vacuously complete
  instead).
- **Comment-only / blank-only source.** Every line is a comment line; the
  comment skeleton equals the source; there are zero code lines; the Check is
  vacuously complete. The exercise is degenerate (nothing to reproduce) but
  renders safely.
- **Snippet that does not parse.** Irrelevant — writeme grades text lines, not
  an AST. The exercise works on syntactically-broken snippets (unlike `blanks`,
  which gates on `status.parsed`). **There is no defense-in-depth fallback
  panel** — `source.code` is always a string, so there is no failure mode to
  gate on (a deliberate divergence from `blanks`'s parse-fail fallback).
- **Learner inserts or deletes whole lines.** Index alignment shifts; downstream
  lines flag as `diff`. This is surfaced as a drift signal, not a crash; the
  learner sees the pattern shift and can realign (or Reset). Order-insensitive
  line alignment (e.g. LCS-based) is a future direction.
- **Learner edits in `raw` then switches to `diff`.** The diff recomputes
  against the current learner code; no special handling — the edits carry over.
- **Keep-comments toggled mid-exercise.** If the editor is still pristine
  (empty, or unchanged from the current template), it re-seeds to the
  newly-chosen template. If the learner has already typed divergent code, the
  toggle updates the hint set and the template **Reset** will produce but leaves
  the editor untouched ("Reset to apply"); in-progress work is never silently
  discarded. Only **Reset** clears the editor.

## What this lens does NOT do (lens-specific drops only)

Inherited from the lenses peer (single-writer state, disposable practice, no
`embody/`-top imports, no consumer branching on `source.code`): see
[`../README.md` § Conventions](../README.md#conventions). Lens-specific drops
vs. the prior-art `WritemeLens.jsx`:

- **No gameable "progress" score.** The legacy averaged a regex-concept-presence
  count with a length ratio and declared ≥ 85% "complete." Replaced by the
  honest per-line diff + `X / N code lines` Check. (The legacy metric is the
  kind of weak feedback this redo exists to prevent.)
- **No reading editor state during render.** The legacy called
  `getStudentValue()` (reading the imperative CodeMirror document) directly in
  JSX, so its line/char counts and comparison panel were **stale** until an
  unrelated re-render. V2 mirrors learner edits into React state via the
  `updateListener` so all derived UI is live.
- **No `setTimeout` editor-setup timing hacks or retry loops.** The legacy used
  `setTimeout(…, 50/100)` with a retry to populate its two editors. V2 mounts
  the editor in a `useEffect` and seeds the document synchronously.
- **No second (solution) CodeMirror editor.** The legacy rendered the solution
  in a read-only editor AND again in a `<pre>` comparison grid. V2's read view
  is a single `<pre>` side-by-side; the read view has zero CodeMirror.
- **No standalone line/character-count footer.** The legacy showed a live (but
  stale) "Lines: N / Characters: M" readout. Dropped — the diff and the Check
  are the load-bearing progress signals; a raw character count is noise.
- **No URL config sync.** The legacy persisted
  `?writeme=nocomments:true,hints:true` to the URL. V2 ships no URL surface;
  config comes from the fence directive / props. URL-state persistence is a
  [Future direction](#future-direction) item (and would lift to the
  orchestrator, per the `blanks` precedent). **A deliberate divergence from
  `blanks`**, which ships a `lib/url-config.ts`.
- **No language / extension applicability gate.** The legacy gated `applicable`
  on `file.lang === 'javascript' && file.ext !== '.mjs'`. V2's `applicableTo` is
  unconditional `true`: the `lenses/javascript/` tree is JS-by-construction (the
  embodiment is already a JS snippet by the time any lens sees it) and V2 has no
  per-file extension concept (config comes from props, not a filename), so the
  gate is redundant.
- **Keep-comments never silently discards work** (behavior change from the
  legacy). The legacy guarded its student-editor seed with
  `studentEditorInitialized`, so toggling Keep Comments after typing began did
  NOT re-seed the editor — it only changed hint generation and what Reset
  produced, leaving the checkbox feeling dead. V2 re-seeds **only while the
  editor is pristine**; once the learner has diverged, the toggle updates the
  hint set + the Reset template and surfaces "Reset to apply," never nuking
  in-progress text. Chosen so the control works on the common before-typing case
  without the destructive surprise of a blind re-seed.
- **No `useColorize` / `useApp` Preact contexts.** Replaced by the `embodiment`
  prop and lens-local React state. (`useColorize` was vestigial in the legacy —
  imported but unused.)
- **Paste is blocked in diff mode too** (not only in a single "write" mode) —
  see [Write-view contract](#write-view-contract). A deliberate divergence from
  `blanks`'s paste-permitting diff mode.
- **CodeMirror writes to local state, never to `setSnippet`.** The wrapper's
  `updateListener` mirrors learner edits into local `learnerCode` state only;
  the lens is a read-only view per the lenses-peer single-writer invariant.

## Two-layer module

Per [`../README.md` § How to add a lens](../README.md#how-to-add-a-lens), the
lens lives across the two required layers (pure-TS core + React wrapper). The
core is split into a `lib/` subdirectory with one file per internal subsystem so
each is independently testable:

- `index.tsx` (wrapper) — React `Component`, the `LensModule.Component`. Owns
  the per-mount UI state (view mode, editor mode, keep-comments, hints mode,
  learner code, check summary, revealed hints), the CodeMirror mount, and the
  diff-line decoration field. The only file that imports React.
- `core.ts` (core) — `LensModule` defaults: `config`, `applicableTo` (Tier 1),
  `recommend`.
- `lib/no-paste-extension.ts` (core) — **vendored** from the legacy
  `src/utils/noPasteExtension.js`. CodeMirror 6 extension blocking keyboard
  (`Mod-v`) and context-menu paste. Pure. Eslint-ignored.
- `lib/comment-skeleton.ts` (core) — **ported & de-duplicated** from the
  legacy's two byte-identical inline template generators. Produces the comment
  skeleton; preserves line count. Pure. Eslint-ignored.
- `lib/diff-lines.ts` (core) — **new**. Per-line `LineStatus` verdicts +
  code-line tallies (`matched` / `total`). Powers both the diff decoration and
  the Check. Pure. Eslint-ignored.
- `lib/generate-hints.ts` (core) — **ported** from the legacy's inline
  `generateHints` + `stripComments` component helpers. Regex hint generation
  (concept ids `hint_<n>`, structural ids `structural_<n>` — legacy scheme,
  preserved so the wrapper's revealed-id keying is faithful), capped at 8. Pure.
  Eslint-ignored.
- `types.ts` (shared) — lens-local types: `ViewMode`, `EditorMode`, `HintsMode`,
  `Hint`, `LineStatus`, `DiffResult`, `WritemeLensConfig`.

Tests split: `tests/no-paste-extension.test.ts`,
`tests/comment-skeleton.test.ts`, `tests/diff-lines.test.ts`,
`tests/generate-hints.test.ts`, `tests/core.test.ts` (vitest, no jsdom);
`tests/component.test.tsx` (vitest + jsdom + `@testing-library/react`).

## Dependencies (no install needed)

- **`@codemirror/view`, `@codemirror/state`, `@codemirror/lang-javascript`,
  `@codemirror/theme-one-dark`, `codemirror`** — already in `package.json` (used
  by the editor and the `blanks` / `annotate` lenses). No AST parser (writeme
  does not parse).

## Future direction

- **WS2 `recommend()`.** Lens ships with `recommend: () => []`. Once WS2's
  analysis surface lands, `recommend(embodiment)` populates Block-Model
  placements (and down-ranks snippets too short to be worth retyping).
- **Order-insensitive line alignment.** v1 diffs by line index; whole-line
  insertions/deletions shift alignment. An LCS-based alignment would diff the
  learner's lines against the solution regardless of inserted/removed lines.
- **Cursor-scoped hints.** v1 ships the legacy's generic generated hints. A
  follow-up could adopt the `blanks` cursor-scoped, incremental-reveal model
  (hint for the line under the cursor).
- **Seeded / reproducible exercises.** Not applicable in v1 (no randomness), but
  an educator-pinned snippet ordering or hint selection could land with the WS2
  recommender.
- **URL state lifted to the orchestrator.** v1 ships none. A follow-up could
  persist `viewMode` / `editorMode` / `keepComments` / `hintsMode` to the URL,
  lifting to the orchestrator's URL surface when it lands (per the `blanks`
  precedent).
- **Character-level intra-line diff.** v1 highlights whole non-matching lines. A
  follow-up could highlight the specific characters within a line that differ
  (the `blanks` `diff`-mode char model), once line alignment is
  order-insensitive.

## Conventions inherited

Follows all conventions in [`../README.md`](../README.md) and
[`../DOCS.md`](../DOCS.md). Notable lens-specific application:

- **Two-layer module shape** — core (pure TS) + wrapper (React).
- **`data-lens="writeme"` on the wrapper's root element** — load-bearing for
  sandbox harnesses + per-lens CSS.
- **`embodiment` parameter name** in core signatures.
- **Disposable practice** — no cross-mount state for learner code, check, or
  hints; React owns the lifecycle. (No URL config in v1 — see drops.)
- **Read-only views** — the lens never mutates `embodiment` or `config`; the
  write editor writes to local `learnerCode` state, never to `setSnippet`.
- **Tier 1 classification** — `applicableTo` returns `true` (text-only exercise,
  no AST). A deliberate divergence from `blanks` (Tier 2); the recommender, not
  `applicableTo`, judges suitability.

## Navigation

- **Parent**: [`../README.md`](../README.md) — lenses peer.
- **Architectural sketch**: [`./DOCS.md`](./DOCS.md).
- **Type contract**: [`./types.ts`](./types.ts).
- **Lens contract**: [`../types.ts`](../types.ts) — `LensModule` + `LensProps` +
  `LensConfig`.
- **Embodiment contract**: [`../../embody/types.ts`](../../embody/types.ts) —
  the `Snippet` type the lens consumes.
- **Orchestrator that mounts this lens**:
  [`../../orchestrate/`](../../orchestrate/).
- **V2 structural templates (reference)**:
  [`../blanks/README.md`](../blanks/README.md) (editor-mode ladder, CodeMirror
  mount) and [`../parsons/README.md`](../parsons/README.md) (Tier 1, per-line
  evaluation).
