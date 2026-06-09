# lenses/writeme

The `writeme` lens — a **write-the-code-from-scratch recall exercise** over a
frozen snippet. The snippet IS the solution; the learner reconstructs it by
**typing it back from memory** into a paste-blocked CodeMirror editor. An
optional **comment skeleton** leaves the comments (and blank lines) in place as
scaffolding while stripping the executable code; turning it off gives a blank
slate. As the learner types, a **diff** view highlights the lines that do not
yet match the solution; and a separate **Read** view shows the solution in a
read-only editor paired with the write editor, to study before reproducing from
memory.

The exercise is about **recall and motor reproduction**, not recognition: paste
is blocked in every editable mode so the learner produces the code rather than
copying it.

One of the lens-module implementations the orchestrator's picker enumerates and
the recommender ranks.

> Migrated from the pre-refactor `WritemeLens.jsx` (registry id `writeme`). The
> V2 redo preserves the legacy's pedagogical surface (paste-blocked write
> editor, comment-skeleton scaffolding, solution reference, reset) while
> replacing structural pieces (Preact `useApp`/`useColorize` contexts →
> `embodiment` prop; imperative `setTimeout` editor wiring → a `useEffect`
> mount; the gameable concept-count "progress" score → the honest per-line diff
> pair) and reshaping the scaffolds into four orthogonal toggles (colorize,
> suggestions, comments, diff). See [`./DOCS.md`](./DOCS.md) for the migration
> audit trail and decision log.

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
  the toolbar, the CodeMirror write editor, and the read-view read-only solution
  editor.
- `config(overrides?): LensConfig` — resolves the per-lens config. Returns a
  frozen `LensConfig` (flat `Record<string, SerializableValue>` per
  [`../types.ts`](../types.ts) `LensConfig`); unknown keys in `overrides` are
  spread through unchanged (open-shape contract). Fields the lens reads:
  - `viewMode?: 'write' | 'read'` (default `'write'`) — initial view. `'write'`
    is the editable reconstruction surface; `'read'` shows the solution in a
    read-only editor paired with the write editor (mutually exclusive while
    typing — read, remember, then type).
  - `colorize?: boolean` (default `true`) — syntax highlighting of the learner's
    typed code (a readability scaffold; leaks no solution content). When
    `false`, the dark editor chrome and the JavaScript language stay, but token
    coloring is dropped (dark-monochrome, not a white box).
  - `suggestions?: boolean` (default `false`) — typing autocomplete: JavaScript
    keywords plus identifiers the learner has **already** typed (in-buffer
    locals), and **no snippet templates** (no `for`/`if`/`function` skeletons —
    those would hand structure). Defaults **off** so the default stays a genuine
    recall task; it is the opt-in for blank-page paralysis. It cannot suggest
    the solution's unrevealed identifiers (they are not in the buffer), so it
    leaks no answer.
  - `keepComments?: boolean` (default `true`) — whether the write editor is
    seeded with the **comment skeleton** (comments + blank lines preserved,
    executable code stripped) as scaffolding. When `false`, the editor starts
    empty (blank slate — the harder recall task).
  - `diff?: boolean` (default `true`) — the per-line feedback overlay. When
    `true`, each line of the learner's code that does not yet match the
    corresponding solution line is highlighted (the honest, always-on feedback);
    `false` removes the overlay — pure recall, no signal until the learner
    switches to Read. Default `true` so the lens shows its honest feedback
    mechanism working on first open rather than presenting a feedback-free box
    (see [`./DOCS.md`](./DOCS.md) § Why default the editor to diff). Replaces
    the former `editorMode: 'diff' | 'raw'`.
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
a blank page (unaided recall). The diff pair makes the exercise self-pacing —
the learner sees which lines still diverge, rather than guessing until a
submit-then-grade round-trip.

`blanks` is, in effect, a more heavily scaffolded `writeme`: the same "reproduce
the source" goal, but with most of the source already on screen and only
selected tokens blanked. `writeme` shares `blanks`'s diff feedback (as a single
`diff` toggle, whole-line) but drops the blank-filling scaffolding entirely.

## Glossary

Vocabulary used throughout this lens. Legacy terms surface from the pre-refactor
`WritemeLens.jsx`.

- **Solution** — the snippet's `embodiment.source.code`: the correct, complete
  program the learner reconstructs. The lens renders it (in the read view and as
  the diff reference) but never mutates it.
- **Learner code** — the text the learner has typed into the write editor. Lives
  in per-mount React state (mirrored into the CodeMirror document); never
  written back to the orchestrator's snippet.
- **Write view** — the editable reconstruction surface: a CodeMirror editor the
  learner types into, paste-blocked, with the toolbar.
- **Read view** — the read-only study surface: the solution in a **read-only
  CodeMirror editor paired with the write editor** (same `colorize`; the diff
  from the solution side when `diff` is on). No learner code is shown. Write and
  Read are mutually exclusive while typing — the learner studies and memorizes
  here, then reproduces it from memory in the write view.
- **Diff (toggle)** — the `diff` boolean scaffold. When on, the **write** editor
  highlights the learner's non-matching lines and the **read** (solution) editor
  shows the matching diff from the solution side (the diff **pair**); when off,
  no feedback overlay renders. One of the four orthogonal Assist toggles
  (replaces the former `'diff' | 'raw'` editor mode).
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
  reproduce — the only lines the diff grades (and the only ones the
  computed-but-unsurfaced tally counts).
- **Comment line** — a solution line that is blank, whitespace-only, or
  comment-only. The comment skeleton seeds these verbatim; they are **freebies**
  — not flagged by the diff, not counted by the tally.
- **Line status** — the per-line diff verdict: `match` (learner's trimmed line
  equals the solution's), `diff` (a code line the learner typed differently),
  `empty` (a code line the learner has left blank), or `comment` (a comment line
  — ungraded).
- **Diff** — the per-line comparison of learner code against the solution (line
  index _i_ vs line index _i_, compared trimmed). Powers the `diff`-mode line
  highlighting (and yields the computed-but-unsurfaced reproduced-line tally).
  Produced by `lib/diff-lines.ts`.
- **Paste-blocked** — the write editor rejects keyboard (`Mod-V`) and
  context-menu paste, in every editable mode, so the learner types the code
  rather than pasting the solution. Provided by `lib/no-paste-extension.ts`.

## UI structure

```text
<div data-lens="writeme"
     data-view-mode="write|read"
     data-colorize="true|false"
     data-suggestions="true|false"
     data-comments="true|false"
     data-diff="true|false">
  <div data-writeme-toolbar role="toolbar"> — three zones: views | assist | actions
    <div data-writeme-views role="group"> — the Write/Read view switch (segmented pair)
      <button data-view-toggle="write">  —   editable reconstruction surface
      <button data-view-toggle="read">   —   the read-only solution editor (paired)
    <div data-writeme-assist role="group"> — four scaffold checkboxes (BOTH views; fenced):
      <input type=checkbox data-assist-toggle="colorize">    — syntax highlighting on / off
      <input type=checkbox data-assist-toggle="suggestions"> — autocomplete (keyword and local) on / off
      <input type=checkbox data-assist-toggle="comments">    — seed comment skeleton vs blank slate
      <input type=checkbox data-assist-toggle="diff">        — per-line feedback overlay on / off
    <div data-writeme-actions>             — trailing zone (pushed to the right edge):
      <button data-reset>                —   restore the starting template, clear feedback
      <span data-writeme-reseed-pending> —   "Reset to apply" — present ONLY when a
                                              comments toggle landed on a diverged
                                              editor (the re-seed is deferred to Reset)
  — write view (data-view-mode="write") —
  <div data-writeme-editor-host>       —   CodeMirror editor (editable, paste-blocked;
                                            diff adds per-line highlight)
  — read view (data-view-mode="read"): the PAIRED read-only solution editor —
  <figure data-writeme-solution-view> —   solution editor, matched to write
    <div data-writeme-solution>        —     read-only CodeMirror; mirrors colorize;
                                            shows the diff pair when diff is on
</div>
```

The `data-lens` attribute is the lenses-peer invariant (see
[`../DOCS.md` § Structural constraints](../DOCS.md)). All `data-writeme-*`
(including the three toolbar-zone wrappers `data-writeme-views` /
`data-writeme-assist` / `data-writeme-actions`) / `data-view-toggle` /
`data-assist-toggle` / `data-reset` / `data-writeme-reseed-pending` hooks are
sandbox-harness selectors and CSS hooks; renaming any is a contract change. The
four scaffold booleans (`data-colorize`, `data-suggestions`, `data-comments`,
`data-diff`) and `data-view-mode` reflect committed config/view state. The
view-toggle buttons carry `aria-pressed`; the Assist checkboxes carry `checked`.

## Toolbar contract

- **View toggle** — two `<button>`s ("Write" / "Read"). The active view is
  reflected by `data-view-mode` on the root. Toggling **preserves the learner's
  code** (parity with legacy) — Read is a study affordance (read and memorize
  the solution, then reproduce it from memory in Write; the two views are
  mutually exclusive, so the learner never types with the solution in view), not
  a reset. Learner code lives in lens-local React state for the lifetime of the
  mount.
- **Assist toggles** — four independent on/off scaffold **checkboxes**
  (`data-assist-toggle="colorize|suggestions|comments|diff"`, each carrying
  `checked`), grouped under `data-writeme-assist`, shown in **both** views. They
  are **orthogonal axes** — each a different KIND of support (readability /
  syntax / intent / feedback), NOT an ordered difficulty ladder; the all-off
  corner is genuine cold recall. Toggling any of them **preserves the learner's
  typed code, cursor, and history**: the editor mounts once and the colorize /
  suggestions / diff toggles each live-reconfigure a CodeMirror `Compartment`,
  while **comments** (and Reset) dispatch a doc change — neither remounts (see
  [`../DOCS.md`](../DOCS.md) § Why scaffold toggles use compartments).
  - **Colorize** (`data-colorize`) — syntax highlighting on / off. Applies to
    **both** the write editor and the read-view solution editor (the pair).
  - **Suggestions** (`data-suggestions`) — snippet-free autocomplete (JS
    keywords and in-buffer locals; no `for`/`if`/`function` skeletons) on / off.
    Write editor only (the read editor is read-only).
  - **Comments** (`data-comments`) — comment skeleton vs blank slate. Re-seeds
    the write editor **only while it is pristine** (empty, or still equal to the
    current starting template). Once the learner has typed divergent code,
    toggling instead updates the template a subsequent **Reset** will produce,
    leaving the editor untouched, with a quiet "Reset to apply" affordance — the
    learner's text is **never silently discarded**. (The legacy guarded its seed
    with `studentEditorInitialized`, so its checkbox felt dead once typing
    began; the pristine-gated re-seed makes the control work on the common
    before-typing case without nuking in-progress work — see
    [What this lens does NOT do](#what-this-lens-does-not-do-lens-specific-drops-only).)
  - **Diff** (`data-diff`) — per-line feedback overlay on / off. The **diff
    pair**: the write editor highlights the learner's diverging lines; the read
    solution editor highlights the same diff from the solution side (progress
    markers). With `colorize` off and `diff` on, the line-highlights stay
    legible (they are line-level decorations, independent of token coloring).
- **Reset** — a `<button>` ("🔄 Reset") that restores the write editor to its
  starting template (per the current Keep-comments setting) and clears any
  feedback decorations.

## Write-view contract

- The write view renders a CodeMirror editor (`javascript()` language, `oneDark`
  theme, the vendored `noPasteExtension`) seeded with the starting template: the
  comment skeleton (when `keepComments`) or an empty document. The editor mounts
  **once** (mount-effect deps `[]`); the `oneDark` theme and the JavaScript
  language are part of the constant base, while colorize / suggestions / diff
  each live in a CodeMirror `Compartment` so a scaffold toggle live-reconfigures
  just that one extension instead of remounting (colorize swaps the highlight
  style, distinct from the constant theme chrome). The editor is editable; an
  `updateListener` mirrors learner edits into local `learnerCode` state. The
  lens NEVER calls the orchestrator's snippet setter — learner code lives in
  lens-local state per the disposable-practice contract; the orchestrator's
  snippet (`embodiment.source.code`) is unchanged.
- **Paste is blocked whether or not `diff` is on.** This is a deliberate
  divergence from `blanks` (whose `diff` mode permits paste because its
  length-matched placeholders are position-locked, so a paste cannot smuggle in
  the answer). `writeme` has no anchors — pasting the solution would defeat the
  entire reproduction exercise — so paste stays blocked in every editable state.
- The starting-template string is computed **synchronously** so the editor's
  first paint already shows the skeleton (no empty-then-filled flicker).
- Scaffold-toggle changes never recreate the CodeMirror `EditorView` (it is
  imperatively mounted once in a `useEffect` with empty deps): colorize /
  suggestions / diff dispatch a compartment reconfigure, and the comments toggle
  and Reset dispatch a document change. The mount reads the current learner code
  from a ref so the initial seed reflects in-progress edits; the comments
  re-seed and Reset replace the document in place (see [`./DOCS.md`](./DOCS.md)
  § Why scaffold toggles use compartments).

## Diff contract

- When `diff` is on the write editor highlights each **code line the learner has
  typed that does not match** the corresponding solution line (a `diff` status —
  compared by line index, see [Diff semantics](#diff-semantics)). Matching
  lines, comment lines, and **not-yet-attempted (empty) code lines are left
  neutral** — an empty code line is "not done," not "wrong" (parity with how
  `blanks` leaves an unfilled blank neutral rather than red). The write-editor
  highlight is a CodeMirror line decoration (`Decoration.line`) supplied by a
  **self-recomputing `StateField`** that captures the solution at construction
  and recomputes the per-line statuses from the write editor's own document on
  each transaction (the field lives in the `diff` compartment). The read-editor
  diff pair and the computed-but-unsurfaced reproduced-line tally both use the
  React-side `DiffResult` from `lib/diff-lines.ts` (computed from the learner's
  code); all derive from the same pure per-line core.
- **The diff pair.** When `diff` is on the **read** (solution) editor marks the
  solution lines the learner has **not yet matched** — progress markers that
  focus what is still missing, never the learner's typed code. Write shows the
  learner's divergences; Read shows the solution's still-unmatched lines.
- When `diff` is off no decoration attaches (in either editor) — the learner
  reconstructs with no feedback overlay (Read remains available on demand).
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
  comment-only). Ungraded; never highlighted; excluded from the tally total.
- `match` — a code line whose trimmed learner text equals the solution's.
- `diff` — a code line whose trimmed learner text differs (and is non-empty).
- `empty` — a code line the learner has left blank.

The `DiffResult` **total** is the number of code lines (`match` + `diff` +
`empty`); **matched** is the number of `match` lines. Comment lines are excluded
so the tally reflects work the learner actually did — the comment skeleton seeds
the comment lines, so counting them would inflate the count before the learner
typed anything (the dishonesty this lens's feedback redesign exists to avoid).
`matched` / `total` are **computed but not currently surfaced** — the diff pair
is the feedback; the tally is a cheap byproduct of the same pass and a clean
extension point (a numeric summary was considered and cut as redundant).

The `diff`-mode highlight uses only the `diff` status (typed-but-wrong);
`match`, `comment`, and `empty` lines are left unhighlighted. The diff pair and
the tally share one `diffLines` computation but read different fields of it.

## Read-view contract

The read view renders the solution in a **read-only CodeMirror editor**
(carrying `data-writeme-solution`, inside a `data-writeme-solution-view` figure)
configured to **match the write editor** — the two are a **pair**. It mirrors
`colorize`; and when `diff` is on it shows the **diff pair**: the solution with
markers for which lines the learner has already matched (progress markers,
**not** the learner's typed code). It is **not** a side-by-side comparison — the
learner's code is never shown here. Write and Read are **mutually exclusive
while typing**: the learner never types with the solution in view. The loop is
**read → remember → type** — study the solution here (the progress markers focus
what is still missing), return to the write view, and reproduce it from memory.
The read editor is read-only (`EditorState.readOnly` +
`EditorView.editable.of(false)`); it carries no update-listener and never writes
`learnerCode`. See [`./DOCS.md`](./DOCS.md) § Why Read is the paired solution
editor.

## Edge cases

- **Empty source** (`embodiment.source.code === ''`). The comment skeleton of
  `''` is `''`; the write editor starts empty; the diff has zero code lines; the
  tally is `0 / 0`. No crash, no `NaN` — this also fixes a latent legacy defect
  (the legacy's length-ratio score divided by zero solution lines, yielding
  `NaN%`; V2's `total === 0` tally is vacuously complete instead).
- **Comment-only / blank-only source.** Every line is a comment line; the
  comment skeleton equals the source; there are zero code lines; the tally is
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
- **Learner edits with `diff` off, then turns it on.** The diff recomputes
  against the current learner code; no special handling — the edits carry over.
- **Keep-comments toggled mid-exercise.** If the editor is still pristine
  (empty, or unchanged from the current template), it re-seeds to the
  newly-chosen template. If the learner has already typed divergent code, the
  toggle updates the template **Reset** will produce but leaves the editor
  untouched ("Reset to apply"); in-progress work is never silently discarded.
  Only **Reset** clears the editor.

## What this lens does NOT do (lens-specific drops only)

Inherited from the lenses peer (single-writer state, disposable practice, no
`embody/`-top imports, no consumer branching on `source.code`): see
[`../README.md` § Conventions](../README.md#conventions). Lens-specific drops
vs. the prior-art `WritemeLens.jsx`:

- **No gameable "progress" score.** The legacy averaged a regex-concept-presence
  count with a length ratio and declared ≥ 85% "complete." Replaced by the
  honest per-line diff pair (plus a computed-but-unsurfaced honest
  reproduced-line tally). (The legacy metric is the kind of weak feedback this
  redo exists to prevent.)
- **No reading editor state during render.** The legacy called
  `getStudentValue()` (reading the imperative CodeMirror document) directly in
  JSX, so its line/char counts and comparison panel were **stale** until an
  unrelated re-render. V2 mirrors learner edits into React state via the
  `updateListener` so all derived UI is live.
- **No `setTimeout` editor-setup timing hacks or retry loops.** The legacy used
  `setTimeout(…, 50/100)` with a retry to populate its two editors. V2 mounts
  the editor in a `useEffect` and seeds the document synchronously.
- **No duplicate solution render; no comparison surface.** The legacy rendered
  the solution TWICE (a read-only editor AND a `<pre>` comparison grid). V2
  keeps a SINGLE read-only solution editor — the read-view **pair** to the write
  editor (mirroring `colorize`, and showing the diff from the solution side when
  `diff` is on) — and drops the comparison grid that put the learner's code
  beside the solution. Write and Read are mutually exclusive while typing (the
  learner's code is never shown in read view), so the learner recalls rather
  than transcribes. See [`./DOCS.md`](./DOCS.md) § Why Read is the paired
  solution editor.
- **No standalone line/character-count footer.** The legacy showed a live (but
  stale) "Lines: N / Characters: M" readout. Dropped — the diff pair is the
  load-bearing progress signal; a raw character count is noise.
- **No URL config sync.** The legacy persisted `?writeme=nocomments:true` to the
  URL. V2 ships no URL surface; config comes from the fence directive / props.
  URL-state persistence is a [Future direction](#future-direction) item (and
  would lift to the orchestrator, per the `blanks` precedent). **A deliberate
  divergence from `blanks`**, which ships a `lib/url-config.ts`.
- **No language / extension applicability gate.** The legacy gated `applicable`
  on `file.lang === 'javascript' && file.ext !== '.mjs'`. V2's `applicableTo` is
  unconditional `true`: the `lenses/javascript/` tree is JS-by-construction (the
  embodiment is already a JS snippet by the time any lens sees it) and V2 has no
  per-file extension concept (config comes from props, not a filename), so the
  gate is redundant.
- **Keep-comments never silently discards work** (behavior change from the
  legacy). The legacy guarded its student-editor seed with
  `studentEditorInitialized`, so toggling Keep Comments after typing began did
  NOT re-seed the editor — it only changed what Reset produced, leaving the
  checkbox feeling dead. V2 re-seeds **only while the editor is pristine**; once
  the learner has diverged, the toggle updates the Reset template and surfaces
  "Reset to apply," never nuking in-progress text. Chosen so the control works
  on the common before-typing case without the destructive surprise of a blind
  re-seed.
- **No `useColorize` / `useApp` Preact contexts.** Replaced by the `embodiment`
  prop and lens-local React state. (`useColorize` was vestigial in the legacy —
  imported but unused.)
- **Paste is blocked even with `diff` on** (not only when feedback is off) — see
  [Write-view contract](#write-view-contract). A deliberate divergence from
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
  the per-mount UI state (view mode, the four scaffold toggles — colorize /
  suggestions / comments / diff — and learner code), the write + read CodeMirror
  editors and their compartments, and the diff-line decoration field. The only
  file that imports React.
- `core.ts` (core) — `LensModule` defaults: `config`, `applicableTo` (Tier 1),
  `recommend`.
- `lib/no-paste-extension.ts` (core) — **vendored** from the legacy
  `src/utils/noPasteExtension.js`. CodeMirror 6 extension blocking keyboard
  (`Mod-v`) and context-menu paste. Pure. Eslint-ignored.
- `lib/comment-skeleton.ts` (core) — **ported & de-duplicated** from the
  legacy's two byte-identical inline template generators. Produces the comment
  skeleton; preserves line count. Pure. Eslint-ignored.
- `lib/code-lines.ts` (core) — **ported**. The single source of truth for
  classifying which solution lines are gradable **code lines** vs **freebie**
  lines (blank / whitespace-only / comment-only / inside an open block comment).
  Shared by `comment-skeleton.ts` (which seeds freebies verbatim) and
  `diff-lines.ts` (which grades only code lines) so the two **must agree** — the
  B1 honesty invariant: extracting the classifier to one source keeps the diff
  and the tally honest (counting skeleton-seeded freebies would inflate the
  count). Pure. Eslint-ignored.
- `lib/diff-lines.ts` (core) — **new**. Per-line `LineStatus` verdicts +
  code-line tallies (`matched` / `total`). Powers the diff decorations; the
  tally is computed but not currently surfaced. Pure. Eslint-ignored.
- `lib/diff-decorations.ts` (core) — **new**. The CodeMirror `StateField` glue
  that maps `diff-lines.ts`'s per-line verdict onto the diff-pair decorations —
  both halves live here: a self-recomputing field flagging the **write**
  editor's typed-but-wrong lines, and a static field marking the **read**
  (solution) editor's not-yet-reproduced lines. Eslint-ignored.
- `lib/snippet-free-autocomplete.ts` (core) — the `suggestions` scaffold: a
  CodeMirror autocomplete extension offering JS keywords plus in-buffer locals
  (from the Lezer tree) and **no snippet templates** — it overrides the
  language-data completion sources so `lang-javascript`'s `for`/`if`/`function`
  skeletons are never consulted, leaking no answer. Eslint-ignored.
- `types.ts` (shared) — lens-local types: `ViewMode`, `LineStatus`,
  `DiffResult`, `WritemeLensConfig`.

Tests split: `tests/no-paste-extension.test.ts`,
`tests/comment-skeleton.test.ts`, `tests/code-lines.test.ts`,
`tests/diff-lines.test.ts`, `tests/diff-decorations.test.ts`,
`tests/snippet-free-autocomplete.test.ts`, `tests/core.test.ts` (vitest; the
CodeMirror-importing ones run under jsdom but assert off `EditorState`, not
layout); `tests/component.test.tsx` (vitest + jsdom + `@testing-library/react`).

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
- **No hints affordance.** A hints panel was **considered and cut** — `writeme`
  is the recall lens, and the Read view is the escape hatch (expertise
  reversal): a learner who is stuck reads the solution, then reproduces it. A
  hint layer would blunt that boundary, so it is not deferred — it is dropped.
- **Seeded / reproducible exercises.** Not applicable in v1 (no randomness), but
  an educator-pinned snippet ordering could land with the WS2 recommender.
- **URL state lifted to the orchestrator.** v1 ships none. A follow-up could
  persist `viewMode` / `colorize` / `suggestions` / `keepComments` / `diff` to
  the URL, lifting to the orchestrator's URL surface when it lands (per the
  `blanks` precedent).
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
- **Disposable practice** — no cross-mount state for learner code; React owns
  the lifecycle. (No URL config in v1 — see drops.)
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
