# orchestrate

The package's React-aware peer. Wires [`embody/`](../embody/) (the operational
NM data layer), [`lenses/`](../lenses/) (the read-only views), and the home-base
[`editor/`](./editor/) into one consumer-mountable surface, and ships the
package's public API: `<StudyLenses>`.

## What lives here

```text
orchestrate/
  README.md                  (this — orientation + navigation)
  DOCS.md                    architectural sketch + Mermaid (peer + StudyLenses)
  types.ts                   <StudyLenses> prop contract + state shape + INTERNAL EventBus events

  index.tsx                  the <StudyLenses> component (owns the JEJ/non-JEJ branch)
  event-bus.ts               createEventBus() — per-instance internal pub/sub
  toolbar.tsx                lens-picker dropdown + edit-return button (the phase-station panel will replace this — see § The phase-station panel)
  tests/                     vitest jsdom tests

  editor/                    default home base — only writer of snippet state
    index.tsx, README.md, DOCS.md, tests/

  lib/                       analysis helpers — all (embodiment) → result
    README.md                (index — links to per-lib READMEs/DOCS)
    recommender/             snippet-fit lens ranking (deferred backlog; sibling of the future Quiz engine)
    socratizing/             Socratic micro-decision analysis (the Quiz button calls this)
    editing/                 editor integration helpers (CodeMirror wrapper)
    error-interpreting/      learner-friendly error messages (feeds interpreted diagnostics)
```

The peer follows a **primary-export-at-top-level** convention: `<StudyLenses>`
and its co-bundled UI files (the toolbar today; the phase-station panel module
that will replace it) sit at the peer's top level alongside the subdirs
`editor/` and `lib/`. This mirrors [`../embody/`](../embody/)'s convention — the
peer's primary export sits at the peer's top level (`embody()` at
`embody/index.ts`; `<StudyLenses>` at `orchestrate/index.tsx`). Subdirs are
separable concerns the peer also owns; the orchestrator's primary export sits
above them at the peer root.

The two subdirs map to separable concerns:

- **`editor/`** — the always-present home base where learners type snippets. Per
  the locked single-writer state model, this is the ONLY surface that mutates
  snippet state. It is also the Cycle-1 surface for **interpreted diagnostics**
  (friendly error explanations in the gutter — see § Interpreted diagnostics).
- **`lib/`** — pure-TS analysis utilities every consumer can call with an
  `embodiment` as input. The recommender lives here (deferred backlog); the
  editor and the orchestrator consume the others (`editing`,
  `error-interpreting`, `socratizing`). The JEJ-aware editor adapters
  (`completing`, `documenting`, `formatting-editor`, `linting`) live at the
  JEJ-package [`lib/`](../lib/) peer, not here.

Everything else (the `<StudyLenses>` component, mode state, lens dispatch, the
affordance container — toolbar today, phase-station panel in Cycle 2 — and the
internal EventBus) lives at the peer's top level: these are inseparable from the
orchestrator because they ARE the orchestrator.

## Public API: `<StudyLenses>`

```tsx
<StudyLenses snippet="let x = 5; console.log(x + 1);" />
<StudyLenses snippet={X} lens="annotate" />
<StudyLenses
  snippet={X}
  lens="annotate"
  configs={{ lenses: { annotate: { defaultView: 'code' } } }}
/>
```

(The `configs` shape shown is what today's plugin emits and what hand-written
JSX usually looks like — see the prop table for the type-level contract, which
is intentionally **maximally opaque**. The orchestrator's `lenses[lens]` lookup
is an internal structural assumption, not a public type constraint.)

Three props (per the locked decision in
[`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles)
and the **3-prop reshape** that absorbs `config` into `configs.lenses[lens]`):

| Prop      | Type                                                          | Required | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------- | ------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `snippet` | `string`                                                      | yes      | The code string, consumed as the **initial value** only. The orchestrator seeds an internal `useState(snippet)` on the first render and is the sole writer of snippet state thereafter; subsequent changes to the `snippet` prop are ignored. Callers who need to swap the snippet remotely should remount via React `key={…}`. The orchestrator builds the embodiment internally — caller does NOT pre-build.                                                                                                                                                                                    |
| `lens`    | `string`                                                      | no       | Default-mounted lens name. The learner can switch via the picker. Populated upstream by the plugin per the **default-lens precedence chain**: per-fence info-string `:suffix` > frontmatter `defaultLens` > cascade `defaults[fenceLang]` (the cascade default lens, when non-null) > none (editor mode). Sibling-emitted `<StudyLenses>` nodes use `@study-lens` directive > cascade `defaults[lang]`. The orchestrator is indifferent to the source — any string the plugin emits drives initial mount; subsequent prop changes drive mode transitions (per § Editor-vs-lens state machine).    |
| `configs` | maximally opaque object (`Readonly<Record<string, unknown>>`) | no       | Opaque cascade passthrough — the public type makes no statement about internals. Today the plugin emits the whole resolved cascade from the `lenses.json` directory walk; per-fence URL-style queries and sibling `@study-lens` directive JSON overrides are deep-merged INTO `configs.lenses[lens]` at plugin emission time. The orchestrator's INTERNAL `resolvePerLensConfig` reads `configs.lenses?.[lens]` as a structural assumption at the cast boundary — that assumption is NOT a constraint on the public type, so future cascade-shape evolution doesn't require widening the surface. |

The `lens` and `configs` props flow from per-fence info-string (`js:annotate`),
per-directory `lenses.json` cascade, and the optional per-fence `@study-lens`
directive — the Docusaurus plugin at `src/plugins/study-lenses/` parses all
three input surfaces and emits the resolved values onto the JSX node. There is
no separate `config` prop; the per-fence/sibling override is folded into
`configs.lenses[lens]` before emission, so the cascade IS the merged truth.

> **Dispatch path**: when `lens` matches a registered key, the orchestrator
> initializes (or transitions to) **lens mode** with the live `embodiment`
> (flushed from the internal snippet state — see § Live embodiment) plus the
> per-lens resolved config (per § Per-lens config resolution chain). When `lens`
> is unset OR not in the registry, the orchestrator initializes (or transitions
> to) **editor mode**. The mode discriminator and its transitions are described
> in § Editor-vs-lens state machine; the flush-or-reuse decision for the
> embodiment is described in § Live embodiment. The cascade-supplied
> default-lens seam is sourced from `configs.defaults[fenceLang]` (per the
> plugin's default-lens precedence chain (a glossary entry in
> [`src/plugins/study-lenses/README.md` § Glossary](../../../../plugins/study-lenses/README.md#glossary));
> the orchestrator itself reads only the resolved `lens` prop and is indifferent
> to which precedence tier supplied it.
>
> **Silent-drop case.** When `lens` is supplied but not in the registry (e.g. an
> authoring typo or a lens that has not yet been registered), the orchestrator
> falls back to editor mode and any `configs.lenses[lens]` entry supplied
> alongside is silently unused. Authors who hit this should consult React
> DevTools or the sandbox `debug-props` lens to confirm the prop shape.

### Per-lens config resolution chain

For any lens the learner mounts (default or picker-switched), the final config
is computed as:

```text
resolved(lensName) = module.config()                  // tier 0: lens defaults
                   ⊕ configs.lenses?.[lensName]       // tier 1: cascade (post-merge with per-fence/sibling override)
```

`⊕` is **deep-merge-right-wins**. Tier 0 is the lens's own default factory; tier
1 is the directory `lenses.json` cascade's `lenses[lensName]` entry, with any
per-fence URL-style query OR sibling `@study-lens` directive JSON override
already folded in at plugin emission time. There is no separate
per-fence-override tier on the orchestrator side — the plugin pre-merges and
ships the result inside `configs`. The orchestrator threads this two-tier chain;
lens authors don't compute it themselves.

> The `configs.lenses?.[lensName]` read is an **orchestrator-internal structural
> assumption**, not a constraint on the public `configs` type. The public type
> is maximally opaque; `resolvePerLensConfig` casts at the boundary to look up
> `lenses[lensName]`. If a caller hands the orchestrator a `configs` value that
> doesn't expose a `lenses` map, the read returns `undefined` and tier-1
> contributes nothing — the chain falls back to `module.config()` alone.

The full type declarations live in [`./types.ts`](./types.ts).

### Anti-patterns (durable rules)

- **No consumer-side branching on `snippet.source.code`.** `embody(code)`
  recognizes 11 named scenario keywords (`"OK"`, `"FAIL_AT_PARSE"`, …) and
  dispatches a canned `Snippet` shape for each; these scenarios are a permanent
  integration-testing fixture set. Orchestrator code MUST NOT use
  `snippet.source.code` as a branching key — branch on the resulting `Snippet`'s
  `status.{tokenized,parsed,validated,created}`, `errors`, `validation`, and
  `endReport.outcome` shape instead. Rendering `source.code` verbatim (e.g. a
  source-display lens) is fine; using it as a discriminator is not. See
  [`../embody/README.md` § Named scenarios](../embody/README.md) and
  [`../embody/index.ts`](../embody/index.ts) JSDoc.
- **Single-writer state.** Only `orchestrate/editor/` mutates snippet source.
  Lenses are read-only views; they never mutate `embodiment` or call back into
  the editor.

## INTERNAL EventBus

Each `<StudyLenses>` mount owns an isolated `EventBus` instance (see
[`./types.ts`](./types.ts) § `EventBus`). The bus coordinates
**intra-component** events — picker selections notifying the orchestrator of
mode changes, sandbox test subscribers verifying transitions, future analytics
hooks — and is internal-only: no DOM registry, no global, no `subscribe` /
`onEvent` prop on the public `<StudyLenses>` surface. The two event names are
`lens-switched` and `mode-changed`.

### Why internal-only

A LMS-facing `subscribe` prop on `<StudyLenses>` (or an `onEvent` callback)
would lock the internal event taxonomy as a public contract. The bus is internal
because the event taxonomy is not yet a public surface; externalizing it
requires a separate, narrower protocol designed against a concrete host's needs
— not the raw internal bus.

See [`./DOCS.md`](./DOCS.md) § Internal event taxonomy for the full event list,
dispatch sites, contract (per-instance / synchronous / caught throws /
depth-first re-entrancy / typed), and the dispatch-ordering rule (mode-changed
before lens-switched within the same React commit).

## Editor-vs-lens state machine

The UI is in exactly one of two modes at a time; mode is selected by an internal
**mode discriminator** stored in `useState<OrchestratorState>` and mutated only
via well-defined **mode transitions**. See [`./types.ts`](./types.ts) for the
discriminated-union state shape; see
[`./DOCS.md` § Mode-gated state machine](./DOCS.md) for the architectural
sketch.

> **Picker-vs-prop ownership.** Mode transitions are driven by three sources:
> (a) the `lens` prop changing (consumer-driven; the
> `useEffect([lens, configs])` path), (b) the picker selection (learner-driven),
> and (c) the edit-return affordance (learner-driven). All three route through
> the same internal transition handler — there is no second source of truth for
> `state.activeLens`. On conflict, the most-recent write wins: a subsequent
> `lens` prop change from the consumer overrides a prior picker selection.
> Consumers SHOULD memoize `configs` to avoid clobbering learner picker
> selections on unrelated parent re-renders: the same `lens` value paired with a
> NEW `configs` object identity counts as a consumer write and re-runs the
> transition.

### Glossary (ubiquitous language)

- **Phase (three senses — a deliberate homonym).** The word "phase" carries
  three distinct meanings in this peer; keep them apart:
  - **(a) Lifecycle phase** — a stage of the embody notional machine, the
    `NMEventPhase` value-space: `realm` / `parse:tokenize` / `parse:ast` /
    `creation` / `evaluation`. This is what `errors.phase` and the embody
    staircase report.
  - **(b) Station** — a column of the phase-station panel (see § The
    phase-station panel). The station set is **not** `NMEventPhase`: it folds
    `parse:tokenize` + `parse:ast` into a single **parse** station and adds the
    non-lifecycle **source** station (code-as-text, before the machine). Station
    set: `source` · `realm` · `parse` · `creation` · `evaluation`.
  - **(c) `LensModule.phase`** — a pedagogical-target binding on a lens (which
    lifecycle phase the lens teaches understanding OF). Its value-space **IS the
    station-name set** (sense b), deliberately distinct from `NMEventPhase`
    (sense a) — a lens declares the station it slots into, not the embody phase
    it reads from.
- **Editor mode** — the home base ([`./editor/`](./editor/)) is mounted. The
  learner types into the snippet; the CodeMirror buffer is the source of truth
  for `snippet`. No active lens. The live embodiment of the buffer is kept fresh
  in the background (debounced) and feeds interpreted gutter diagnostics.
- **Lens mode** — a lens is active with the live `embodiment` + resolved
  per-lens config as React props. The snippet is read-only (the editor is
  unmounted; the embodiment was flushed to the exact current buffer at the
  transition).
- **Mode discriminator** — the `mode: 'editor' | 'lens'` field on
  `OrchestratorState` that names which subtree the orchestrator renders. Initial
  value is derived **synchronously** by
  `deriveInitialState({ snippet, lens, configs })` — a top-level helper that
  returns `{ state: OrchestratorState; liveEmbodiment: LiveEmbodiment | null }`
  in a single pure pass. Both `useState` lazy initializers (one for `state`, one
  for `liveEmbodiment`) project their respective field from the same call, so
  `embody(snippet)` runs once per **logical mount** in **both** modes (seeding
  the live slot for gutter errors on the first frame), and the lens-mode subtree
  paints on the first frame when the caller supplies a registered `lens`. (React
  StrictMode may double-invoke the lazy initializer in dev; `embody()` is
  idempotent on a given string, so the slot is identical either way — safe.)
- **Mode transition** — a state-update that flips the discriminator. Three
  transitions exist: **editor → lens** (a registered lens is selected via the
  `lens` prop or the picker — flushes or reuses the live embodiment; mounts the
  lens), **lens → editor** (the `lens` prop unsets, moves to an unregistered
  key, or the edit-return affordance fires — disposes the lens; the live
  embodiment is retained), and **lens → lens** (the picker selects a different
  registered lens or the `lens` prop changes to a different registered key while
  in lens mode — same embodiment is fed to the new lens; no mode change). The
  transition logic is centralized in a single internal handler shared by the
  prop-change effect, the picker handler, and the edit-return handler.
- **Live embodiment** — the orchestrator's single live `Snippet` of the editing
  buffer, held in the top-level `liveEmbodiment` slot. Refreshed by a debounced
  static `embody()` in editor mode and flushed to the exact current buffer on an
  editor → lens transition. Static-only (no execution); the source of `status` /
  `errors` / `validation` for gutter errors (Cycle 1) and the phase-station
  panel (Cycle 2).
- **Debounce settle** — the trailing-edge moment, after ~200 ms of edit
  inactivity, when the orchestrator re-runs static `embody()` on the current
  buffer and refreshes the live slot. Per-keystroke `onSnippetChange` still
  fires 1:1; only the embody reaction is debounced.
- **Flush-on-transition** — on an editor → lens transition, the orchestrator
  guarantees the live slot reflects the exact current buffer: if a debounce was
  pending (`liveEmbodiment.snippet !== currentSnippet`), it embodies
  synchronously inline and cancels the pending timer before mounting the lens.
- **Interpreted diagnostic** — a located `LintDiagnostic` carrying a
  human-friendly explanation of a `snippet.errors` entry, produced by
  `interpretError(embodiment, …)` (`lib/error-interpreting/`). The orchestrator
  computes these from the live embodiment and passes them to the editor as a
  `readonly LintDiagnostic[]` (the `interpretedDiagnostics` prop) — never the
  embodiment itself. Cycle 1 passes `interpretError`'s `whatWentWrong` as plain
  text in `message`; the editor renders messages as text (no markdown rendering
  wired yet), and rich multi-section markdown hover is deferred. Each is
  source-tagged (syntax / JEJ-compliance / interpreted render distinctly) so it
  renders distinctly from `lintJej`'s structural markers and supersedes the raw
  terse message for the same error. Line targeting prefers `errors.loc`, else
  derives `(line, column)` from `source.offsets` + the error's char offset, else
  a file-level notice.
- **Toolbar** — the always-visible affordance container at the top of the active
  surface in the current (pre-Cycle-2) implementation. Owns the lens-picker
  dropdown and (in lens mode only) the edit-return button. Mounted in both
  editor and lens mode; its contents are mode-aware. Cycle 2 replaces it with
  the phase-station panel (see § The phase-station panel); the picker and
  edit-return semantics survive the replacement.
- **Lens-picker** (or just **picker**) — the affordance that selects a lens. In
  the current toolbar it is a `<select>` over the registered lenses
  (`LENS_REGISTRY` entries): one `<option>` per registered lens name plus a
  non-selectable sentinel first option; editor is not a picker option. Selecting
  a non-sentinel option transitions the orchestrator to lens mode for that lens.
  In Cycle 2 the single picker becomes N phase-station dropdowns (see § The
  phase-station panel), but the underlying "select a registered lens → enter
  lens mode" contract is unchanged.
- **Registry / registered lens** — the orchestrator's lens-dispatch lookup
  exposed as `LENS_REGISTRY`, keyed by `LensModule.name`. It registers **five**
  lenses today: `annotate`, `blanks`, `debug-props`, `parsons`, `writeme`. The
  picker enumerates registry entries; the active lens (in lens mode) is always
  a registry entry.
- **Active lens** — when `state.mode === 'lens'`, the lens name currently
  mounted. Stored as `state.activeLens`. The picker `value` derives from this;
  the edit-return affordance's visibility derives from `state.mode === 'lens'`.
- **Edit return** — the orchestrator-state transition from lens mode back to
  editor mode. The affordance (the toolbar's edit button today) dispatches
  `mode-changed({ from: 'lens', to: 'editor' })` on the internal bus; it does
  NOT dispatch `lens-switched` (no lens is being selected — the active lens is
  being unmounted). The live embodiment is retained across the return. The
  affordance is conditionally rendered (lens mode only); the editor-mode tree
  exposes no edit-return affordance because no transition is needed.
- **Neutral picker state** — what the current toolbar picker renders in editor
  mode: a non-selectable sentinel first `<option>`
  (`<option value="" disabled hidden>— select a lens —</option>`) that reads as
  the picker's `value`, with the remaining `<option>`s enumerating the
  registered lenses. Selecting any non-sentinel option transitions to lens mode
  for that lens; the sentinel itself cannot be re-selected by the learner.
- **Dispatch** — calling `bus.dispatch(eventName, payload)` to notify all
  listeners registered for that event. Synchronous; listeners execute in
  registration order.
- **Subscribe** — registering a listener for an event via
  `bus.subscribe(eventName, listener)`. Returns a teardown function that removes
  the listener when called.
- **Listener** — a function passed to `bus.subscribe` that receives the
  dispatched payload for its event. Listeners that throw are caught and warned
  (`console.warn`); subsequent listeners still fire.
- **Payload** — the typed value passed to `bus.dispatch` and received by
  listeners. Each `EventName` has exactly one payload shape via the
  `EventPayloadMap` type-level mapping.
- **Event name** — a member of the `EventName` union (`'lens-switched'` |
  `'mode-changed'`). Each name has a fixed payload shape; new names land
  alongside their payloads in `types.ts`.
- **Re-entrant dispatch** — a listener dispatches another event (or the same
  event) inside its own handler. Depth-first: the nested dispatch runs to
  completion before the outer dispatch's next listener fires.

### Live embodiment

The orchestrator holds a single authoritative top-level state slot
`liveEmbodiment: { snippet: string; embodiment: Snippet } | null` alongside the
mode-discriminator state. It is the orchestrator's **live static embodiment of
the editing buffer**: there is one storage location for the embodiment;
`LensModeState` carries only `activeLens` and `resolvedConfig`, and both
lens-mode rendering and the (Cycle-2) phase-station panel read
`liveEmbodiment.embodiment` — and its `status` / `errors` / `validation` —
directly.

In **editor mode** the slot is kept fresh by a **debounced** static
`embody(buffer)` (~200 ms idle settle). The editor still fires `onSnippetChange`
exactly once per keystroke (the orchestrator's `setSnippet` is per-keystroke),
but the orchestrator **debounces its embody reaction** so the machine isn't
re-run on every character. Embodiment is **static-only** (realm → tokenize →
parse → validate → creation; no worker) — program **execution stays lazy**,
firing only on the future Run affordance. The seed snippet is embodied **once
per logical mount in both modes** so a snippet that _ships_ with a syntax error
shows its interpreted gutter marker on the first frame, before the learner
types. (React StrictMode may double-invoke the lazy initializer in dev; because
`embody()` is idempotent on a given string the resulting slot is identical, so
the double-invoke is safe.) (The same live slot later feeds the Cycle-2
phase-station panel, but that is not the Cycle-1 justification.)

The slot is **never cleared on edit**: an edit only schedules a debounced
refresh, and the slot holds the prior value until the trailing edge replaces it.

**Coherence invariant** — whenever `state.mode === 'lens'`, the slot is non-null
AND `liveEmbodiment.snippet === currentSnippet`. A stale slot (snippet mismatch)
at lens-mount is a **loud** failure, not just a null one. The transition logic
enforces this; types cannot.

**Trigger semantics:**

| Event                                                      | liveEmbodiment effect                                                            | Mode effect                                    |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------- |
| Initial mount (either mode)                                | populate atomically with fresh `embody(snippet)`                                 | per `deriveInitialState`                       |
| Snippet edit in editor mode                                | schedule a debounced refresh; slot holds the prior value until the trailing edge | (no transition; stays in editor mode)          |
| Debounce settle in editor mode                             | `embody(currentSnippet)` once; refresh slot                                      | (no transition)                                |
| Editor → lens, `liveEmbodiment.snippet === currentSnippet` | reuse `embodiment` (flush no-op); cancel pending debounce                        | `{ mode: 'lens', activeLens, resolvedConfig }` |
| Editor → lens, slot stale or null                          | flush: `embody(currentSnippet)` synchronously inline; cancel pending debounce    | `{ mode: 'lens', activeLens, resolvedConfig }` |
| Lens → editor transition                                   | retain slot                                                                      | `{ mode: 'editor' }`                           |

A lens → editor → lens round-trip with no intervening edit reuses the slot (the
flush is a no-op — zero `embody` at the transition); an edit refreshes the slot
on the debounce settle, and the next lens-open flushes to the exact current
buffer.

**Error policy:** `embody()` is sync. For any `string` input it returns a
fully-shaped `Snippet` — it does not throw on parse-phase failure. Non-scenario
input routes to real composition — acorn tokenizes and parses the code,
producing an apex `Snippet` (valid JS) or a non-apex leaf (`tokenize-fail` or
`parse-fail`) carrying `snippet.errors` with the failure detail (still a no-op
evaluation phase: `snippet.evaluation.events.run()` resolves to a `RunInstance`
with `endReport.outcome: 'not-runnable'`). Those `errors` are exactly what the
editor gutter's **interpreted diagnostics** read (see
[`./editor/README.md`](./editor/README.md)). The debounced editor-mode refresh
wraps `embody()` defensively so a stray throw never tears down the editor — the
prior slot value survives. The **flush-on-transition** path, by contrast,
embodies inline without a try/catch: it relies on embody's total-on-`string`
contract (acorn errors are caught internally and returned as error-leaves, never
thrown) — a flagged dependency should embody ever reintroduce throwing. The
live-embodiment trigger governs only **when** embody fires; it is independent of
how `embody()` reports errors.

**Known cost (Cycle 1):** the editor's `lintJej` runs `validate(code)` (acorn)
_and_ the orchestrator's debounced `embody()` runs acorn — two parses per settle
(plus CodeMirror's own tokenizer). Accepted for now. **Convergence target:**
once embody's real-composition `validation` is wired (reaching parity with
`lintJej`'s JEJ-compliance markers), the embodiment becomes the single parse
source and the editor renders only orchestrator-supplied diagnostics —
collapsing to one parse. Deferred until then.

Lens-internal UI state never carries across mode switches — the disposability
principle (per
[`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles)).

## Interpreted diagnostics

The orchestrator derives `interpretedDiagnostics: readonly LintDiagnostic[]`
from the live embodiment's `errors` (NOT from the embodiment object itself) and
passes them to the editor as a new optional prop. The editor renders them
through its existing `linter()` / `lintGutter()` / `hoverTooltip()` machinery —
one more diagnostic source alongside `lintJej`. **The editor never receives the
embodiment**; only the located, interpreted strings cross the boundary, so the
single-writer / read-only-view invariant holds in spirit.

- **Source-tagged, not blanket-deduped.** Each diagnostic is tagged with its
  source — syntax, JEJ-compliance, or interpreted — so the three coexist and
  render distinctly (distinct severity + gutter affordance). The editor
  suppresses only the case where the _same_ error is shown both terse (raw
  `lintJej`) and interpreted: the interpreted message supersedes the raw one for
  that error.
- **What lights up in Cycle 1.** Interpreted explanations are demonstrable now
  for **tokenize/parse (syntax) errors** (the real acorn path) plus the 11
  scenario fixtures. JEJ-violation and creation-phase interpretation on
  arbitrary real code lights up only when embody's validating/creation slices
  land. Real non-JEJ code (e.g. `var x = 1`) still shows `lintJej`'s structural
  marker (live) but no embodiment-derived interpretation in Cycle 1 — this is by
  design, not a bug.
- **Coherence (staleness bound).** Interpreted diagnostics are at most **one
  debounce-window** stale while typing; the live slot always reflects the buffer
  at the last settle, and a new settle re-derives them. How the editing layer
  absorbs that transient overshoot between settles (e.g. CodeMirror
  line-clamping of marker positions) is an **editing-layer assumption owned by
  [`./editor/README.md`](./editor/README.md)** — this doc states only the
  staleness bound, not the rendering-layer mechanism, so the claim isn't
  asserted at two strengths in two docs.

See [`./editor/README.md`](./editor/README.md) for how the editor consumes the
prop and merges it into its diagnostic pipeline.

## Snippet-content-blind orchestrator

The orchestrator's transition handler and live-embodiment layer never inspect
`Snippet.source.code` content semantically. (Sibling `orchestrate/lib/*` modules
may operate on derived strings — error messages, identifier autocomplete,
AST-derived voices — but never on raw snippet content for dispatch.) The handler
may compare snippet strings as **slot keys** via **full-string identity only**
(`liveEmbodiment.snippet === snippet`, answering "is this the same snippet I
already embodied?") — that's slot-validity, not semantic dispatch. Substring /
prefix / regex / pattern tests against snippet content are forbidden **even when
used to gate slot behavior** (e.g. `if (snippet.startsWith("//"))` as a
re-embody-bypass optimization is also a violation).

Branches that need to know what the code does consume only the resulting
`Snippet`'s `status` / `errors` / `validation` fields. Cycle 1 begins consuming
these to compute the interpreted gutter diagnostics; Cycle 2 consumes
`status.{tokenized,parsed,created}` + `errors.phase` for the phase-station
panel's gating, and `validation.isJeJ` for the JEJ/non-JEJ branch (see § The
phase-station panel) — all the allowed path; the orchestrator still never
inspects `source.code` semantically. This invariant aligns with embody's
anti-pattern (no consumer-side branching on `snippet.source.code`) and persists
as the non-scenario real-composition path grows per
[`../EMBODY-IMPL-HANDOFF.md`](../EMBODY-IMPL-HANDOFF.md).

## The phase-station panel

> **Design status.** This section describes the **intended end-state** of the
> orchestrator's affordance container. It is the locked Cycle-2 design; the
> current implementation still ships the thin `toolbar.tsx` (lens-picker
> dropdown + edit-return button). The phase-station panel replaces the toolbar;
> the picker and edit-return semantics described above carry over.

The panel is a **notional-machine lifecycle instrument**. Instead of one lens
picker, it lays the NM lifecycle out as **N "stations" left → right** — **source
· realm · parse · creation · evaluation** — each its own lens dropdown for the
lenses that target that phase. The N dropdowns are deliberate: the layout itself
teaches the lifecycle, so a learner reads the machine's stages before picking
any lens.

The panel **doubles as a lifecycle-status display.** Off the live embodiment's
**embody staircase** (`status.{tokenized,parsed,created}` + `errors.phase`) it
shows how far the machine got and where it tripped — teaching the lifecycle even
before a lens is picked. (This dual role — teach the lifecycle AND show the
machine's progress through it — is the panel's reason for being.)

### Phase stations and column gating

Each station maps to a stage of the embody staircase, and the panel **greys out
phases after the one that errored**:

| Station        | embody mapping (what it shows status from)                                 | Greying                                                                                    |
| -------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **source**     | `snippet.source` (code-as-text, before the machine; not a lifecycle phase) | never greyed                                                                               |
| **realm**      | the documentary realm (light; constant — never changes with the code)      | never greyed                                                                               |
| **parse**      | tokenize + AST, folded into one station                                    | the **first** phase that can error; nothing bars it. A self-error here greys later phases. |
| **creation**   | script-scope decls, hoisting, TDZ                                          | greyed when `status.created` is unreached or a prior phase errored                         |
| **evaluation** | the machine's runtime internals (trace-tier prediction)                    | greyed until creation succeeds; runtime errors surface only at Run                         |

The greying is computed **purely from the embody staircase** (column/phase-based
gating only — lens-level `applicableTo` gating is a backlog seam, not this
design). `source` and `realm` never grey. The station-state model — exactly what
each station renders when its embody phase is `null` or stubbed (reached-ok /
errored-here / unreachable / unknown), and the fallback when `validation` is
`null` (embody's real-composition validation/creation are stubbed today) — is
**intentionally unspecified here; it is locked in Cycle 2 Phase 0**.

### Lens → station binding

A new `LensModule.phase` field declares the station a lens belongs to. Its
semantics are the **pedagogical target** — which lifecycle phase the lens
teaches understanding OF — **not** which embody phase the lens reads from. So
`blanks`/`annotate` declare `phase: 'source'` even though they consume the AST:
they teach understanding of the source, the AST is just their instrument.

> **Homonym alert.** `LensModule.phase` (sense c in the glossary) is **not**
> `NMEventPhase` (sense a). Its value-space is the **station-name set** (sense b
> — `source` · `realm` · `parse` · `creation` · `evaluation`), deliberately
> distinct from the lifecycle `NMEventPhase` values. A lens declares the station
> it teaches, not the embody phase it reads from.

The lenses slot as (all five registered today):

| Lens          | Station | Notes                                                                             |
| ------------- | ------- | --------------------------------------------------------------------------------- |
| `parsons`     | source  | registered today                                                                  |
| `blanks`      | source  | registered today; consumes the AST; teaches the source                            |
| `annotate`    | source  | registered today; consumes the AST; teaches the source                            |
| `writeme`     | source  | registered today                                                                  |
| `debug-props` | (none)  | registered today, but **panel-excluded** — carries no `phase` binding (see below) |

The non-source stations (`realm`, `parse`, `creation`, `evaluation`) stay mostly
empty until prediction lenses are built (token / AST / creation / trace
prediction — backlog). The exact `LensModule.phase` type (`string` vs
`string[]`, allowing a lens to target multiple stations) is **intentionally
unspecified here; it is locked in Cycle 2 Phase 0**, alongside the migration of
the existing lenses onto the field.

> **The panel's name is intentionally unspecified.** "Control panel" is reserved
> — [`notional-machine.md`](../notional-machine.md) gives it to the
> syntax-as-the-programmer's-control-panel metaphor — so the panel module's name
> is **locked in Cycle 2 Phase 0**, not here.

### Where the panel lives

The panel replaces `toolbar.tsx` (likely as a new module folder). The
orchestrator (`index.tsx`) owns a JEJ/non-JEJ branch keyed on the live
embodiment's `validation.isJeJ`: **JEJ → the phase-station panel**; **non-JEJ →
run/debug**. The panel module is presentation; `index.tsx` reads `isJeJ` and
mounts the right surface. The non-JEJ run/debug surface (mode/template
selection, sandbox/danger-zone) is **a separate, later DDD — intentionally
unspecified here**.

The **quadrant principles** (Q-I curated/uncurated × guided/unguided, etc.) are
**not** the panel's structural axis — that role belongs to the NM lifecycle
phases. The quadrants survive as **implicit design principles** the JEJ and
non-JEJ states each embody (per
[`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles)),
not as a panel layout.

## The omnipresent region

> **Design status.** Locked Cycle-3 design; **not yet built**. Documented here
> as the intended end-state so the panel design reads whole.

Alongside the phase stations, the orchestrator carries a region of **cross-phase
study tools** — tools that span the whole lifecycle (source → evaluation) rather
than targeting one station. The durable ontology cuts along **two axes**:

1. **per-phase lenses** (target one station) vs. **cross-phase tools** (span the
   lifecycle);
2. within cross-phase tools, **generative** tools (produce things _about the
   program_) get an omnipresent affordance, while **reactive explainers**
   (explain one specific thing) attach where the subject appears rather than
   living as a button.

Those axes place the four known tools:

- **Run** — a cross-phase generative affordance (not a lens), mapping to
  `evaluation.events.{run, intercept}` on the embodiment.
- **Quiz** — an omnipresent generative **button** that calls `socratize` now
  (generator #1; a future dropdown dispatches to more generators).
- **`format`** is an **editor-only subtoolbar**, not omnipresent — formatting
  mutates source, so it belongs to the home base.
- **`error-interpret` is not a button** — it is the **reactive explainer**
  behind the interpreted diagnostics (editor gutter for static errors today,
  Run-dock console for runtime errors later), a shared utility consumed by
  surfaces, not an affordance the learner clicks.

The Run dock's internal layout (its two I/O-channel panels) and the non-JEJ
run/debug surface that reuses it are **locked in Cycle 3 — see the ledger**
(`read-0-curricula-dev-md-and-0-curricula-mossy-hickey.md`); the exact
omnipresent-region layout is not specified here.

## Deferred backlog

Named here so they are not mistaken for current surfaces:

- **The recommender** (`lib/recommender/`) — snippet-fit lens ranking. The
  ranking library exists; there is no recommendations-panel UI, and none is
  planned for these three cycles. "Works within the NM phases later."
- **The Quiz engine** — the heavy block-model quiz generator (sibling of the
  recommender). The Cycle-3 Quiz button calls `socratize` directly; the engine
  is a separate later DDD.
- **The block model** — the 3D Block-model × NM analysis feeding both the
  recommender and the future Quiz engine. Backlog.

## Data attributes the DOM exposes

The set below is the orchestrator's stable selector surface for tests and
sandbox harnesses.

| Attribute                       | Where                                                                                                                                    | Used by                                                 |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `data-orchestrator-root`        | The wrapper `<div>` (affordance container + active surface)                                                                              | Tests + sandbox locate the orchestrator instance.       |
| `data-orchestrator-host`        | The host `<div>` where the active surface mounts — for the editor home base, a `<div>` into which the CodeMirror `EditorView` is mounted | Tests + sandbox locate where the active surface mounts. |
| `data-orchestrator-toolbar`     | The toolbar `<nav>` (current implementation; superseded by the Cycle-2 phase-station panel — see selector-fate note below)               | Tests + sandbox locate the affordance container.        |
| `data-orchestrator-lens-picker` | The toolbar `<select>` (current implementation)                                                                                          | Tests + sandbox locate the picker.                      |
| `data-orchestrator-edit-button` | The toolbar `<button>` that returns to editor mode (rendered only when `state.mode === 'lens'`)                                          | Tests + sandbox locate the edit-return affordance.      |
| `data-orchestrator-error`       | The editor host `<div>` when CodeMirror mount rejects (fallback render)                                                                  | Tests + sandbox detect a failed editor mount.           |

The phase-station panel (Cycle 2) and omnipresent region (Cycle 3) will add
their own `data-orchestrator-*` attributes when built; they are intentionally
not enumerated here yet.

**Fate of `-toolbar` / `-lens-picker` under the Cycle-2 replacement.** Once the
phase-station panel replaces `toolbar.tsx`, the names
`data-orchestrator-toolbar` and `data-orchestrator-lens-picker` describe a DOM
that no longer exists (there is no single toolbar `<nav>` or single `<select>` —
the picker becomes N station dropdowns). The choice among **retained-as-alias**
(keep the names on the new panel root / first dropdown so existing test
selectors survive), **renamed** (e.g. `data-orchestrator-panel` /
`data-orchestrator-station-picker`, updating the test suite), or **retired**
(drop them, asserting on new station-scoped attributes) is a **conscious naming
decision locked in Cycle 2 Phase 0**, not settled here — flagged so the would-be
homonym (`-toolbar` naming a non-toolbar) isn't introduced by accident.

**Directory → type/attribute asymmetry.** The directory is named `orchestrate/`
(verb) to mirror `embody/`'s convention of verb-named peers exporting their
primary surface at the peer's top level. The internal type names
(`OrchestratorState`) and DOM attributes (`data-orchestrator-*`) use the noun
form because that's how prose talks about it ("the orchestrator", "the
orchestrator state"). `embody/` doesn't expose a corresponding noun-form because
its primary surface is itself a verb (`embody()`); `orchestrate/`'s primary
surface is a noun-form component (`<StudyLenses>`), so the noun form creeps in
for internals. The asymmetry is honest, not a mistake.

## Conventions

Inherits all conventions from [`../README.md`](../README.md) and the top-level
`AGENTS.md`. Peer-specific rules:

- **Single-writer state**. Only [`./editor/`](./editor/) mutates snippet source.
  The orchestrator routes the edit-callback through; lenses are read-only views.
- **Internal-only EventBus** (see § INTERNAL EventBus above for the full
  contract). The orchestrator's bus coordinates intra-component events; each
  `<StudyLenses>` mount owns a per-instance bus. No outbound `subscribe` prop on
  `<StudyLenses>` until a concrete LMS integration target appears.
- **Live embodiment** (debounced, static-only). The orchestrator keeps a live
  `Snippet` of the editing buffer, refreshed by a **debounced** static
  `embody()` in editor mode (never on every keystroke) and flushed to the exact
  current buffer on an editor → lens transition (see § Live embodiment). The
  static phases (realm → tokenize → parse → validate → creation) are eager;
  program **execution stays lazy**. **For lenses, evaluation phases** (run /
  predict / step) are lens-internal — the lens invokes
  `snippet.evaluation.events.{run, intercept, trace.variables, trace.syntax, trace.semantics}`
  directly on the embodiment it already holds (see
  [`../embody/types.ts § EvaluationEvents`](../embody/types.ts)); no
  orchestrator round-trip. The one non-lens consumer is the **Cycle-3 Run
  affordance** (§ The omnipresent region), which is also handed the **same live
  embodiment** and invokes `evaluation.events.{run, intercept}` on it directly —
  so it too needs no re-embody, and the no-round-trip property holds for both
  consumers. See [`./DOCS.md` § Live embodiment](./DOCS.md).
- **Snippet-content-blind orchestrator** (durable invariant). See §
  Snippet-content-blind orchestrator above for the full rule: the transition
  handler + live-embodiment layer never inspect `Snippet.source.code`
  semantically; they may compare snippet strings as slot keys via full-string
  identity only.
- **Disposable practice**. Lens-internal state is per-mount; nothing carries
  across the edit return or a lens switch.
- **Dependency rules** (per [`../DOCS.md` § Dependency rules](../DOCS.md)):
  - `orchestrate/` may import from `orchestrate/lib/*`, `embody/`, `lenses/`,
    `@-utils`.
  - `orchestrate/lib/*` may import from sibling `orchestrate/lib/*`, `embody/`,
    `@-utils`. Never from `lenses/`.
  - Lenses receive `embodiment` via props from the orchestrator; they never
    import from `orchestrate/` (top) or `embody/` (top).
- **React conventions** (component code):
  - React hooks live inside normal function components. No class components, no
    `this`. Multi-statement `useEffect` callbacks use named function
    expressions.
  - React component tests use `.test.tsx` and the `jsdom` environment
    (configured at the file level via `@vitest-environment jsdom`).
  - `vi.mock` factories that reference outer-scope variables wrap them in
    `vi.hoisted(() => ({ ... }))`.

## Navigation

- **Parent**: [`../README.md`](../README.md) — package overview + Pedagogical
  first principles.
- **Architectural sketch**: [`./DOCS.md`](./DOCS.md).
- **Type contract**: [`./types.ts`](./types.ts).
- **Subdirs**:
  - [`./editor/README.md`](./editor/README.md) — the home base (+ interpreted
    diagnostics rendering).
  - [`./lib/README.md`](./lib/README.md) — analysis libs index.
- **Embodiment contract**: [`../embody/types.ts`](../embody/types.ts).
- **Lens contract**: [`../lenses/types.ts`](../lenses/types.ts).
- **Notional machine**: [`../notional-machine.md`](../notional-machine.md) — the
  lifecycle the phase-station panel instruments.
