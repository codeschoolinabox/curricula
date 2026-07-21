<!-- cspell:ignore renderable affordances -->

# orchestrate — Architecture & Decisions

Region-level architecture for the orchestrator described in
[README.md](./README.md). The package sketch ([../DOCS.md](../DOCS.md)) owns the
package-level shape — this region is its keeper: the four package phases happen
here or are driven from here. This document constrains the region at its root
abstraction; each rendered surface and derivation library zooms in below.

## Architectural sketch

> Written Phase 0, before implementation. The Refactor step is held against this
> document — not what the code does, but what shape it takes.

## Execution phases

1. **Compose** — two cadences. At mount, sync and loud: the default lens roster
   joins the host's injected lenses, the built-in levels join the injected ones
   — append-only, collisions fail loudly. Continuously: the configuration
   cascade re-resolves per lens name over the layers this region sees — the
   configs prop, then a recommendation's opening overrides when the open lens
   arrived that way, then the learner's tweaks, always final. Input: the host
   props + session choices. Output: the composed study configuration.

2. **Derive** (sync, pure, per settle) — the settled snippet is embodied with
   the joined roster; the parse facts a level consumes are assembled once from
   the embodiment's stage values; one memoized validate runs per registered
   level; the fit marks derive from those verdicts, the levels' admitted snippet
   types, and the current type (the verdict itself encodes the parse status);
   the fitting lenses' proposals are collected and ranked. All of it in pure
   functions — level logic never lives inside a React component. Input: the
   settled snippet + the composed study configuration. Output: the study
   derivation — the frozen embodiment, the level verdicts, the assessments, and
   the ranked recommendations.

3. **Render** (mechanical) — the five-phase panel renders the embodiment; the
   level UI renders the verdicts and marks; the mask derives here, from the
   selected level's assessment — its mark with its cause — crossed with the
   strict posture, classifying surfaces into the three classes; an initial-focus
   request mounts here, through its honor path; the study derivation's ranked
   recommendations render here, through the mask. Input: the study derivation +
   composed study configuration. Output: the rendered study environment.

4. **Interact** (async at the edges) — each control re-enters its own phase:
   source edits re-enter Derive at the next settle (editor mode only — the
   editor is absent during a lens excursion); opening a lens flushes any pending
   settle and replaces the editor with the lens over the frozen embodiment and
   its resolved config; closing — the strip's none entry, the Edit code button,
   or the orphan defense — remounts the editor seeded from the live source; the
   snippet-type toggle, level selection, and the posture toggle each dispose the
   open lens first, then re-enter their own phase (the type toggle re-enters
   Derive immediately; level, posture, and configuration tweaks re-enter through
   the composed study configuration with no re-parse). Input: the rendered
   environment + learner intent. Output: a new settle or a re-render.

## Data flow

```mermaid
flowchart TD
    PROPS["host props<br/>(defaults, never locks)"]
    CFG["composed study configuration<br/>(joined rosters · cascade, learner layer final)"]
    SNP["snippet<br/>(source + type, as last settled)"]
    EMB["frozen embodiment"]
    VER["level verdicts<br/>(one memoized validate per settle + level)"]
    MARKS["assessments by level<br/>(mark + cause, per settle)"]
    RECS["ranked recommendations<br/>(fitting lenses' proposals, per settle)"]
    SUR["rendered study environment<br/>(surface pane: editor XOR open lens · panel · level UI · mask)"]
    PROPS -->|"join rosters at mount, loud collisions"| CFG
    PROPS -->|"initial snippet + type, seeds the editor"| SNP
    PROPS -->|"initial-focus request, honored at mount"| SUR
    SNP -->|"embody per settle, pure"| EMB
    CFG -->|"supplies the joined roster"| EMB
    EMB -->|"assemble parse facts once, validate per level, memoized"| VER
    CFG -->|"supplies the registered levels, names the selected one"| VER
    VER -->|"classify: × admitted types × current type"| MARKS
    SNP -->|"the current type"| MARKS
    EMB -->|"render, mechanical"| SUR
    VER -->|"annotate the editor's gutter, selected level only"| SUR
    MARKS -->|"selector marks · mask = selected assessment × strict posture"| SUR
    EMB -->|"the fitting lenses' proposals, collected + ranked"| RECS
    RECS -->|"rendered through the mask; opening carries the proposal's overrides into the cascade"| SUR
    CFG -->|"posture + resolved configs"| SUR
    SUR -->|"edits debounced to the settle · type toggle and lens-open settle immediately"| SNP
    SUR -->|"level · posture · config tweaks, session-scoped (the open-lens choice lives in the pane occupant)"| CFG
```

## Structural constraints

- **Zero fit or accessibility derivation.** Both are embody's; this region
  renders what the embodiment carries and recovers its own renderable lenses by
  filtering its own roster against the attached refs — no casts.
- **Pure derivation libraries, thin components.** The fit marks, the mask
  classification, the config resolution, and the parse-facts assembly live in
  pure functions; components render their outputs.
- **One memoized validate per settle and per level** — the selector, the gutter,
  and the mask share it; nothing validates twice.
- **The single writer.** Only the editor mutates the source; every derived state
  re-derives per settle.
- **Append-only composition, loud collisions.** Built-ins are never replaced or
  shadowed; failure happens at mount, at the author's desk.
- **Class-2 controls never mask.** Any control whose availability restores what
  the learner needs stays alive under every posture: conformance for the
  selector and both toggles, orientation for the guide, the way home for the
  Edit code button.
- **The undetermined carve-out wins.** While the code does not parse, the mask
  names no violation and the parse phases' supports stay uncovered — regardless
  of type admission.
- **Proposals are vetted at collection.** A recommendation whose target lens
  does not resolve on the mount roster is dropped at collection, before ranking
  — gracefully, with a loud report at the author's desk. Every open path is
  therefore vetted before the pane: the strip offers only attached lenses, the
  honor path runs applicability at mount, and a surviving proposal names a
  roster lens the reachability judgment can classify.
- **One reachability judgment, two projections.** The pane's render gate and the
  orphan defense project a single classification of the open lens over the
  CURRENT derivation — phase-declared: attached to an accessible phase;
  panel-excluded: its applicability holds over the current facts. A divergence
  would mean a blank-pane deadlock or a one-frame totality violation; one
  judgment makes both impossible.
- **Display labels live here.** The five phases' learner-facing labels and the
  none-state's display string are this region's presentation concern; the data
  names are the other regions'.

## The top component — state and the settle loop

The region-root zoom-in. The four execution phases above are the abstraction;
this section pins where their state lives and how a settle happens. (The region
README's tree names the files these shapes live in.)

### State residency

The top component is the single owner of everything session-scoped; every other
holder is ephemeral or derived.

| State                                                                                                                                                                     | Holder                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session choices (level key, posture, type, config tweaks — the open-lens choice lives in the pane occupant)                                                               | the top component                                                                                                                                                                                           |
| The pane occupant (`PaneOccupant`: the editor arm with its remount seed, or the lens arm with the open lens's name, its open-time settled pair, and the opened overrides) | the top component — one discriminated slot; the union makes "a lens without its snapshot" and "overrides outliving the open choice" unrepresentable                                                         |
| The live source (the buffer as last edited — survives editor unmounts)                                                                                                    | the settle hook's ref, owned by the top component's hook instance; the hook exposes a live-source read and an immediate flush (the contract widening lands with its implementation — see the types.ts note) |
| The settled snippet (`SettledSnippet`)                                                                                                                                    | the top component, written only by the settle loop                                                                                                                                                          |
| The study derivation (`StudyDerivation`)                                                                                                                                  | the top component, recomputed per settle                                                                                                                                                                    |
| The validate memo                                                                                                                                                         | inside the per-instance memoized validate the top component holds                                                                                                                                           |
| Joined rosters, the bus instance                                                                                                                                          | the top component, created once at mount                                                                                                                                                                    |
| Open/closed flags (level list, guide reveal)                                                                                                                              | each surface, ephemeral                                                                                                                                                                                     |

### The settle loop

One settle hook owns the edit-to-settle mechanics: edit events arrive per
keystroke; the region's shared trailing-edge debounce holds them; its trailing
edge writes the settled snippet. The type toggle absorbs any pending settle and
re-derives immediately — a toggle is a settle of its own, never debounced, and
its settle carries the editor's **live** source: pending keystrokes are settled
early, never discarded. The debounce's cancellation runs in the always-returned
effect cleanup (idle-safe — the cleanup is returned whether or not a settle is
pending). Staleness is keyed by the settled snippet identity: derived state
belongs to exactly one settled source-and-type pair, and a re-derive replaces it
wholesale.

While a lens is open the loop is FROZEN: the editor is unmounted, so no edit
event can fire. Opening a lens is itself an absorb-settle — the hook's immediate
flush cancels any pending debounce, then RETAINS the settled identity when the
live buffer field-equals the settled pair (which also absorbs an
edit-undone-to-identical window: no re-derivation, no re-announce — the
round-trip guarantee), else settles the live source immediately. The
retained-identity discriminant is content equality, not pending-ness — the
debounce exposes no pending-query. A type toggle during an excursion disposes
the lens first; its immediate settle then runs in editor mode.

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Pending: edit event (keystroke)
    Pending --> Pending: further edits (debounce restarts)
    Pending --> Settling: trailing edge fires
    Idle --> Settling: type toggle (immediate, no debounce)
    Pending --> Settling: type toggle (absorbs the pending settle, live source)
    Settling --> Idle: settled snippet written · derive runs · bus announces settled
    Idle --> Excursion: lens opened (buffer equals the settled pair —<br/>identity retained, nothing derives)
    Pending --> Excursion: lens opened (the flush absorbs the live source —<br/>settles · derives · announces)
    Excursion --> Excursion: lens→lens switch (same settled pair —<br/>one lens-opened, no null between)
    Excursion --> Idle: dispose — none entry · Edit code ·<br/>type/level/posture commit · orphan defense
    note right of Excursion: the loop is frozen —<br/>the editor is absent,<br/>no edit event can fire
```

### Per settle

One pure derive composition runs per settle: the embodiment factory over the
settled source and type with the joined lens roster, then the validating
library's assembly and memoized validates, then the marking library's
assessments, then the recommendation walk — the fitting lenses' proposals
collected by the composition and ranked by the recommending library — into one
frozen `StudyDerivation`. The top component calls the composition with the
settled snippet, the joined levels, the joined lens roster, and the per-instance
memoized validate it holds; nothing else derives. The memo's remaining work —
`StudyDerivation` already holds each settle's verdicts — is idempotence:
StrictMode's double invoke and any same-identity re-entry return the held
verdicts without consulting a level twice.

### The render projection

- The five phases' display labels live in one record keyed by phase name, zipped
  against embody's runtime order constant at the point of use; never a
  positional list.
- The panel receives its ordered phase list built from that constant plus the
  labels, and renders it as the horizontal lifecycle strip ABOVE the surface
  pane, beside the control row (the Edit code button — leading, while a lens is
  open — then the type toggle and the level surfaces; sibling order within the
  row is presentation, not contract) — controls and lifecycle in one band, the
  surface pane beneath: the editor when no lens is open, the open lens in its
  place. Recommendations render below the pane in both modes. The strip renders
  no headings; the guide's `h4` topic titles are the instrument's only headings,
  and the guide renders last in DOM order.
- ONE VISUAL PANE, TWO DOM SLOTS — the mask-membership rule: the editor renders
  OUTSIDE both maskable regions (class 1, never masked while mounted); the
  mounted lens renders INSIDE the maskable content region (class 3). The pane is
  the learner-facing abstraction over both; building it as one shared slot would
  break one of the two class assignments.
- The strip's selects track the committed open lens; the none entry over the
  open lens is a close affordance — the close commits at the top component and
  announces `lens-opened: null` (the bus arm shipped reserved, now real). The
  class-2 Edit code button is the GUARANTEED way home: the strip is class 3 and
  inert under a mask.
- Coherence invariants at the lens-arm render, loud in dev AND prod: the settled
  pair must field-equal the occupant's `openedAt` (source and type), and the
  open lens must resolve on the mount roster. The embodiment-matches-snapshot
  guarantee follows transitively — the derivation memo is keyed on settled
  identity, and the derive composition is pure in (settled, mount-frozen
  session).
- The orphan render-gate: the invariants check settle-coherence, NOT
  applicability. When the reachability judgment rejects the open lens over the
  CURRENT derivation — a flush-at-open can do this, since the offer was made
  against pre-flush facts — the pane renders nothing that frame; the orphan
  defense (the same judgment's other projection) then disposes and announces.
  With collection-vetted proposals, a lens's `main` never mounts against an
  embodiment its applicability rejected — unreachable by construction, which is
  what lets the invariants throw loud in prod.
- The mask projects the masking library's state — the selected level's
  assessment crossed with the posture; the blocked overlay is part of the top
  component's render (in-file until a second call site exists). Every mask input
  is frozen during an excursion (the dispose rule), so mask state is fixed per
  mount; a mount can begin masked two ways — the honored focus, or a
  flush-at-open that settles out-of-level code the strip offered against the
  pre-flush facts.
- The honor resolution runs once at mount, mapping fallback → the editor arm and
  honored → the lens arm (`openedAt` = the initial settled pair); the lazy
  initializer stays side-effect-free — no dispatch ever fires from it. The study
  derivation's ranked recommendations render through the mask, in both modes.

## Decisions

- **Why the pane swaps (editor XOR lens).** Inherited from the retired reference
  architecture's two-mode machine, on the maintainer's ruling: in editor mode
  the learner is AUTHORING; in lens mode they are EXERCISING a disposable
  practice surface over a fixed program. Disposability is structural, not
  policed — the editor is absent, and every derivation-context commit (type,
  level, posture) disposes the lens first — so a mounted lens's embodiment
  cannot change, by construction. The cost is deliberate: the learner cannot
  type WHILE a lens reacts; switching is an explicit pedagogical commitment.
- **The event mapping (taxonomy kept).** `lens-opened{name}` covers the
  reference's mode-changed(editor→lens) + lens-switched; `lens-opened{null}`
  covers mode-changed(lens→editor); a lens→lens switch is one
  `lens-opened{next}` with no null between. On dispose paths the close dispatch
  precedes the change event (`lens-opened{null}` before `type-toggled` / the
  level or posture announce); a flush-at-open's `settled` announce follows
  `lens-opened{name}` post-commit. The orphan sequence `lens-opened{name}` →
  `settled` → `lens-opened{null}` is LEGAL — subscribers must tolerate an open
  immediately followed by its close, with the explaining settle between. A
  derivation-context commit with no lens open has nothing to dispose and
  announces no `lens-opened{null}` — dispose with nothing open is silent.
- **Bus and effect contract rules.** Listeners must never call `flushSync` — the
  one-commit batching argument for the pane flip depends on it. The effect
  registration order — the settled announce BEFORE the orphan defense — is a
  pinned invariant: the orphan bus sequence depends entirely on hook call order.
  The settle hook's live-source read and immediate flush are fresh function
  identities per render and must never key an effect or memo.
- **Why the composition root is here.** One place joins, so one place can be
  loud: collisions surface at mount, at the author's desk, never as silent
  shadowing discovered by a learner.
- **Why memoization is here.** Three consumers — selector, gutter, mask —
  project one verdict; owning the memoization beside the consumers keeps one
  validate per settle and per level, and one place that assembles the parse
  facts.
- **Why the mask derives at render.** Mask state follows the settled fit mark,
  so it never flaps mid-keystroke; deriving it any earlier would couple
  enforcement to typing. The mask re-derives nothing: the marking library
  classified once, and the mask projects the selected level's classification.
- **Why components stay thin.** Every level-aware derivation is a pure function
  that tests without a DOM; the React layer renders results and routes intent,
  nothing more.

## Out of scope

- **Fit and accessibility** — embody's derivation, rendered here untouched.
- **Lens and evaluator internals** — a mounted lens owns its view; evaluators
  are its own imports; this region never touches an evaluator.
- **Level content** — validators, docs, support data, and models belong to their
  levels; this region consults and projects.
- **Level-UI rendering and bus wiring** — how the selector and toggles render
  their intent affordances and how bus subscriptions are wired belongs to the
  level-ui and event-bus internals, documented there. Session choices themselves
  have one owner, the top component — no surface holds one.
- **The embedding site's composition** — whatever layers produce the configs
  value upstream are the host's build, invisible here.
- **Learner identity, progress, grading** — the embedding LMS's.
