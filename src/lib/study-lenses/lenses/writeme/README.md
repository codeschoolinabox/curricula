<!-- cspell:ignore reseed unhighlighted -->

# lenses/writeme

The `writeme` lens — a **write-the-code-from-scratch recall exercise** over the
frozen embodiment. The program IS the solution; the learner reconstructs it by
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

## Why this lens exists

`writeme` is the learner's **reproduction workbench**. Where `parsons` asks the
learner to order given lines and `blanks` asks them to fill given holes,
`writeme` asks them to **produce the whole program from memory** — the furthest
point on the recognition → recall spectrum among the source-phase exercises.
Retyping working code from scratch builds the motor and recall fluency that
recognition exercises do not exercise; blocking paste is what makes it a
reproduction task rather than a copy task.

The comment skeleton is the scaffolding dial: with comments kept, the learner
reconstructs code against a running commentary of intent (a guided
reconstruction); with comments off, the learner reproduces the whole thing from
a blank page (unaided recall). The diff pair makes the exercise self-pacing —
the learner sees which lines still diverge, rather than guessing until a
submit-then-grade round-trip.

## The lens contract

The module's default export is a frozen `Lens` per [`../types.ts`](../types.ts):

- `name: 'writeme'` — the lens's identity within the kind.
- `phase: 'source'` — the lifecycle phase this lens teaches.
- `main: ComponentType<LensProperties>` — the React wrapper around the lens's
  pure core. Renders the writeme surface (`<div data-lens="writeme">`) with the
  toolbar, the CodeMirror write editor, and the read-view read-only solution
  editor. Reads the solution from `embodiment.facts.source.value` — the given
  source stage, which carries no failure arm.
- `config(overrides?): LensConfig` — the pure config factory. Returns a frozen
  `LensConfig`; unknown keys in `overrides` are spread through unchanged
  (open-shape contract). Fields the lens reads:
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
    corresponding solution line is highlighted; `false` removes the overlay —
    pure recall, no signal until the learner switches to Read. Default `true` so
    the lens shows its honest feedback mechanism working on first open (see
    [`./DOCS.md`](./DOCS.md) § Why default the editor to diff).
- `applicability(facts): boolean` — returns `true` unconditionally. Writing code
  back from memory needs neither a syntax tree nor a successful parse — the lens
  renders `facts.source.value` as the solution and grades the learner's text
  line-by-line, and `source` is a given stage that cannot fail. Suitability (a
  snippet long enough to be worth retyping) is the recommender's concern, not a
  hard applicability gate.
- `recommend(embodiment): ReadonlyArray<Recommendation>` — returns the shared
  frozen empty array. See [Future direction](#future-direction).

## Glossary

- **Solution** — `embodiment.facts.source.value`: the correct, complete program
  the learner reconstructs. The lens renders it (in the read view and as the
  diff reference) but never mutates it.
- **Learner code** — the text the learner has typed into the write editor. Lives
  in per-mount React state (mirrored from the CodeMirror document); never
  written anywhere else.
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
  no feedback overlay renders. One of the four orthogonal Assist toggles.
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

All `data-writeme-*` (including the three toolbar-zone wrappers
`data-writeme-views` / `data-writeme-assist` / `data-writeme-actions`) /
`data-view-toggle` / `data-assist-toggle` / `data-reset` /
`data-writeme-reseed-pending` hooks are harness selectors and CSS hooks;
renaming any is a contract change. The four scaffold booleans (`data-colorize`,
`data-suggestions`, `data-comments`, `data-diff`) and `data-view-mode` reflect
committed config/view state. The view-toggle buttons carry `aria-pressed`; the
Assist checkboxes carry `checked`.

## Toolbar contract

- **View toggle** — two `<button>`s ("Write" / "Read"). The active view is
  reflected by `data-view-mode` on the root. Toggling **preserves the learner's
  code** — Read is a study affordance (read and memorize the solution, then
  reproduce it from memory in Write; the two views are mutually exclusive, so
  the learner never types with the solution in view), not a reset. Learner code
  lives in lens-local React state for the lifetime of the mount.
- **Assist toggles** — four independent on/off scaffold **checkboxes**
  (`data-assist-toggle="colorize|suggestions|comments|diff"`, each carrying
  `checked`), grouped under `data-writeme-assist`, shown in **both** views. They
  are **orthogonal axes** — each a different KIND of support (readability /
  syntax / intent / feedback), NOT an ordered difficulty ladder; the all-off
  corner is genuine cold recall. Toggling any of them **preserves the learner's
  typed code, cursor, and history**: the editor mounts once and the colorize /
  suggestions / diff toggles each live-reconfigure a CodeMirror `Compartment`,
  while **comments** (and Reset) dispatch a doc change — neither remounts (see
  [`./DOCS.md`](./DOCS.md) § Why scaffold toggles use compartments).
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
    learner's text is **never silently discarded**.
  - **Diff** (`data-diff`) — per-line feedback overlay on / off. The **diff
    pair**: the write editor highlights the learner's diverging lines; the read
    solution editor highlights the same diff from the solution side (progress
    markers). With `colorize` off and `diff` on, the line-highlights stay
    legible (they are line-level decorations, independent of token coloring).
- **Reset** — a `<button>` ("Reset") that restores the write editor to its
  starting template (per the current Keep-comments setting) and clears any
  feedback decorations.

## Write-view contract

- The write view renders a CodeMirror editor (`javascript()` language, `oneDark`
  theme, the `noPasteExtension`) seeded with the starting template: the comment
  skeleton (when `keepComments`) or an empty document. The editor mounts
  **once** (mount-effect deps `[]`); the `oneDark` theme and the JavaScript
  language are part of the constant base, while colorize / suggestions / diff
  each live in a CodeMirror `Compartment` so a scaffold toggle live-reconfigures
  just that one extension instead of remounting. The editor is editable; an
  `updateListener` mirrors learner edits into local `learnerCode` state. Learner
  code lives in lens-local state per the disposable-practice contract; the
  embodiment is read-only.
- **Paste is blocked whether or not `diff` is on.** `writeme` has no anchors —
  pasting the solution would defeat the entire reproduction exercise — so paste
  stays blocked in every editable state.
- The starting-template string is computed **synchronously** so the editor's
  first paint already shows the skeleton (no empty-then-filled flicker).
- Scaffold-toggle changes never recreate the CodeMirror `EditorView`: colorize /
  suggestions / diff dispatch a compartment reconfigure, and the comments toggle
  and Reset dispatch a document change. The mount reads the current learner code
  from a ref so the initial seed reflects in-progress edits.

## Diff contract

- When `diff` is on the write editor highlights each **code line the learner has
  typed that does not match** the corresponding solution line (a `diff` status —
  compared by line index, see [Diff semantics](#diff-semantics)). Matching
  lines, comment lines, and **not-yet-attempted (empty) code lines are left
  neutral** — an empty code line is "not done," not "wrong." The write-editor
  highlight is a CodeMirror line decoration (`Decoration.line`) supplied by a
  **self-recomputing `StateField`** that captures the solution at construction
  and recomputes the per-line statuses from the write editor's own document on
  each transaction (the field lives in the `diff` compartment). The read-editor
  diff pair uses `lib/build-read-marker-field.ts` (computed from the learner's
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
  solution's line structure.

## Diff semantics

`lib/diff-lines.ts` compares the learner's code to the solution **line by line,
by index** (learner line _i_ vs solution line _i_), each compared **trimmed**
(line content is graded, not indentation or trailing whitespace). The comment
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
typed anything. `matched` / `total` are **computed but not currently surfaced**
— the diff pair is the feedback; the tally is a cheap byproduct of the same pass
and a clean extension point.

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
**read → remember → type**. The read editor is read-only
(`EditorState.readOnly` + `EditorView.editable.of(false)`); it carries no
update-listener and never writes `learnerCode`. See [`./DOCS.md`](./DOCS.md) §
Why Read is the paired solution editor.

## Edge cases

- **Empty source** (`facts.source.value === ''`). The comment skeleton of `''`
  is `''`; the write editor starts empty; the diff has zero code lines; the
  tally is `0 / 0` — vacuously complete, no `NaN`.
- **Comment-only / blank-only source.** Every line is a comment line; the
  comment skeleton equals the source; there are zero code lines; the tally is
  vacuously complete. The exercise is degenerate (nothing to reproduce) but
  renders safely.
- **A program that does not parse.** Irrelevant — writeme grades text lines, not
  a syntax tree. The exercise works on syntactically-broken programs, and there
  is no fallback panel: `facts.source` is a given stage with no failure arm, so
  there is no failure mode to gate on.
- **Learner inserts or deletes whole lines.** Index alignment shifts; downstream
  lines flag as `diff`. This is surfaced as a drift signal, not a crash; the
  learner sees the pattern shift and can realign (or Reset).
- **Learner edits with `diff` off, then turns it on.** The diff recomputes
  against the current learner code; no special handling — the edits carry over.
- **Keep-comments toggled mid-exercise.** If the editor is still pristine
  (empty, or unchanged from the current template), it re-seeds to the
  newly-chosen template. If the learner has already typed divergent code, the
  toggle updates the template **Reset** will produce but leaves the editor
  untouched ("Reset to apply"); in-progress work is never silently discarded.
  Only **Reset** clears the editor.

## Two-layer module

Per [`../README.md`](../README.md) § Anatomy of a lens, the lens lives across
the two layers (pure core + thin component). The core is split into a `lib/`
subdirectory with one file per internal subsystem so each is independently
testable:

- `index.tsx` (wrapper) — the React `main` and the frozen `Lens` default export.
  Owns the per-mount UI state (view mode, the four scaffold toggles, and learner
  code), the write + read CodeMirror editors and their compartments, and the
  diff-line decoration fields. The only file that imports React.
- `core.ts` (core) — the lens-contract defaults: `config`, `applicability`,
  `recommend`.
- `lib/no-paste-extension.ts` (core) — CodeMirror 6 extension blocking keyboard
  (`Mod-v`) and context-menu paste. Pure.
- `lib/comment-skeleton.ts` (core) — produces the comment skeleton; preserves
  line count. Pure.
- `lib/code-lines.ts` (core) — the single source of truth for classifying which
  solution lines are gradable **code lines** vs **freebie** lines (blank /
  whitespace-only / comment-only / inside an open block comment). Shared by
  `comment-skeleton.ts` (which seeds freebies verbatim) and `diff-lines.ts`
  (which grades only code lines) so the two **must agree** — the honesty
  invariant. Pure.
- `lib/diff-lines.ts` (core) — per-line `LineStatus` verdicts + code-line
  tallies (`matched` / `total`). Powers the diff decorations; the tally is
  computed but not currently surfaced. Pure.
- `lib/diff-decorations.ts` (core) — the write half of the diff pair: a
  self-recomputing CodeMirror `StateField` flagging the **write** editor's
  typed-but-wrong lines.
- `lib/build-read-marker-field.ts` (core) — the read half of the diff pair: a
  static `StateField` marking the **read** (solution) editor's
  not-yet-reproduced lines.
- `../lib/snippet-free-autocomplete.ts` (shared leaf) — the `suggestions`
  scaffold: a CodeMirror autocomplete extension offering JS keywords plus
  in-buffer locals and **no snippet templates**, so it leaks no answer.
- `types.ts` — lens-local types: `ViewMode`, `LineStatus`, `DiffResult`,
  `WritemeLensConfig`.
- `writeme.css` — per-lens styles, scoped to `[data-lens='writeme']`.

Tests: `tests/no-paste-extension.test.ts`, `tests/comment-skeleton.test.ts`,
`tests/code-lines.test.ts`, `tests/diff-lines.test.ts`,
`tests/diff-decorations.test.ts`, `tests/core.test.ts` (vitest; the
CodeMirror-importing ones run under jsdom but assert off `EditorState`, not
layout); `tests/component.test.tsx` (vitest + jsdom + `@testing-library/react`).
The shared autocomplete is tested beside its source in `../lib/`.

## Future direction

- **`recommend()` heuristics.** The lens ships with `recommend` returning the
  frozen empty array; a future analysis surface can propose writeme for snippets
  worth retyping (and down-rank ones too short).
- **Order-insensitive line alignment.** The diff is by line index; whole-line
  insertions/deletions shift alignment. An LCS-based alignment would diff the
  learner's lines against the solution regardless of inserted/removed lines.
- **No hints affordance.** A hints panel was **considered and cut** — `writeme`
  is the recall lens, and the Read view is the escape hatch (expertise
  reversal): a learner who is stuck reads the solution, then reproduces it. A
  hint layer would blunt that boundary, so it is not deferred — it is dropped.
- **Character-level intra-line diff.** Whole non-matching lines are highlighted
  today; a follow-up could highlight the specific characters within a line that
  differ, once line alignment is order-insensitive.
- **Surface the `matched / total` tally.** The diff pass already computes the
  honest reproduced-line count; a numeric summary could render it (a clean
  extension point), though the diff pair is the feedback today.

## Navigation

- **Region**: [`../README.md`](../README.md) — the lens kind's mechanics.
- **Architecture & decisions**: [`./DOCS.md`](./DOCS.md).
- **Type contract**: [`./types.ts`](./types.ts).
- **Lens-kind contract**: [`../types.ts`](../types.ts) — `Lens` +
  `LensProperties` + `LensConfig` + `Recommendation`.
- **Embodiment contract**: [`../../embody/types.ts`](../../embody/types.ts) —
  `Embodiment` and `Facts`.
