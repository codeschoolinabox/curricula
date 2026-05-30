# Handoff: WS3 L1 — Toolbar lens-picker

> **Scope**: a WS3 layer ticket (full Phase 0 + Phase 1, multi-file). The
> canonical design lives in [`03-orchestrator-and-contracts.md` § L1 — Toolbar
> lens-picker](./03-orchestrator-and-contracts.md) (lines ~568–596). This
> handoff is the entry point that briefs the next agent on what's new since
> that section was written, what the user has just clarified, and the
> dependency landscape — not a re-statement of the L1 design.

## Read these first (mandatory)

Before any work:

1. [`AGENTS.md`](../../../../../AGENTS.md) at the repo root — non-negotiable
   invariants, Phase 0 ceremony, AR cycle expectations. **L1 is a full
   Phase 0 + Phase 1 ticket** (UI surface, observable behavior, learner-facing
   contract). Full TDD ceremony applies.
2. [`DEV.md`](../../../../../DEV.md) at the repo root — Adversarial Review
   Protocol. **AR-1 (design challenge) fires after the README spec, before
   `types.ts`.** AR-2 fires after the `DOCS.md` architectural sketch. AR-3
   per increment. AR-4 per increment. AR-5 pre-merge.
3. [`03-orchestrator-and-contracts.md` § L1](./03-orchestrator-and-contracts.md)
   — the **canonical L1 design**. Read the L1 section in full (the
   `<select data-orchestrator-lens-picker>` mechanism, picker-visible-in-both-
   modes invariant, `lens-switched` EventBus dispatch, prop-driven default,
   sandbox expectations). This handoff does NOT restate that design.
4. This handoff for what's new since `03-orchestrator-and-contracts.md` was
   written.

If anything in (1), (2), (3) contradicts your instinct, follow them. They are
the ground truth.

## Context (what's new since the L1 design was written)

The L1 design at `03-orchestrator-and-contracts.md` was written when the
roster was hypothetical. Three things have landed since:

1. **`LENS_REGISTRY` now has a real 2-entry roster.** Commit `0d91553`
   registered the migrated `annotate` lens next to `debug-props`. Before
   `0d91553`, the registry was 1-entry and the picker was visually trivial
   (one option, no real choice). With 2 entries, the picker is now
   non-trivial and the L1 design needs to reach implementation.
   See [`orchestrate/index.tsx`](../orchestrate/index.tsx) at the
   `LENS_REGISTRY` declaration.

2. **Default-when-no-`lens`-prop is settled: editor.** The L1 design says
   "if `lens` is absent, the default is the first lens in the roster (or a
   orchestrate-level baseline default — to settle in L1's Phase 0)."
   **It is settled.** The user (curriculum lead) ruled on 2026-05-30:
   default is **the editor home base** — not a lens — when no fence,
   `lenses.json` cascade, inline comment, or MDX frontmatter indicates
   otherwise. The picker dropdown when no lens is selected should show
   `editor` as the selected option, with the registered lenses as
   additional options. Selecting `editor` from the picker transitions to
   editor mode; selecting a lens transitions to lens mode for that lens.
   **This rule replaces the "first lens in the roster" placeholder in the
   L1 design.** Update the L1 section of `03-orchestrator-and-contracts.md`
   to reflect this during your Phase 0 spec pass — it's now end-state, no
   longer an open question.

3. **Live-render harness exists.** A registered-path sandbox surface lives
   at [`spiralearn/sandbox/annotate-routing/index.md`](../../../../spiralearn/sandbox/annotate-routing/index.md)
   (a `js:annotate` fence) and the lens-self preview lives at
   [`src/pages/annotate-preview.tsx`](../../../../../src/pages/annotate-preview.tsx).
   Useful as smoke tests once the picker is wired.

## Dependency landscape

L1's `lens-switched` event dispatch (per the L1 design) is on the
**INTERNAL EventBus**, which is F5's deliverable. Check the WS3 status
in [`00-master-plan.md`](./00-master-plan.md) and the F-tier section of
`03-orchestrator-and-contracts.md` to confirm whether F5 has shipped before
starting L1.

If F5 is NOT yet shipped: the choices are
(a) sequence F5 before L1,
(b) stub the EventBus locally in L1 and replace the stub when F5 lands, or
(c) defer the event-dispatch sub-increment to a follow-up.
The right call is a Phase 0 decision — bring it to the user.

WS2 (recommender) is not a blocker for L1 — L1 covers Q-I (unguided
default + manual picker), which is independent of the recommender. WS2 only
becomes a blocker at L5 / L6.

## What L1 must deliver (per the canonical design, summarized)

- A `<select data-orchestrator-lens-picker>` over the registered roster
  **plus an `editor` option** (per the user's default-is-editor ruling).
- Visible in BOTH editor mode and lens mode (always-available is the Q-I
  autonomy guarantee).
- Default-selected option derived from `<StudyLenses>` props in this
  precedence:
  1. `lens` prop (if set AND in registry) → that lens
  2. `lens` prop unset OR not in registry → `editor`
- Selecting a lens dispatches `lens-switched` on the INTERNAL EventBus
  (event payload reused from Inc-9 — see `orchestrate/types.ts`) and
  transitions to lens mode for the chosen lens.
- Selecting `editor` from the dropdown transitions to editor mode.
- The picker is part of a toolbar shell (per the L1 design's "Toolbar"
  framing); decide in Phase 0 whether the toolbar itself is in L1 scope
  or a separate increment.

## Phase 0 deliverables (do not skip — see AGENTS.md § Non-Negotiable Invariants)

In order:

1. **Ubiquitous language** — pin terms: *picker*, *roster*, *active lens*,
   *editor option*, *lens-switched event*. Resolve any terminology
   drift between the L1 design section and the current codebase
   (e.g., does the code already say "active lens"?).
2. **README spec update** — extend `orchestrate/README.md` (or the picker's
   own README if a sub-module is appropriate) with the picker's
   public-visible contract: roster source, default-selection rule
   (cite the user's 2026-05-30 ruling), transition semantics.
3. **AR-1 (Design Challenge)** — Opus, drift / cross-cutting focus.
   Hand the AR agent: the README updates, the L1 section of
   `03-orchestrator-and-contracts.md`, `orchestrate/types.ts`,
   `lenses/types.ts`, and this handoff.
4. **`types.ts` update** — pin the `lens-switched` event payload,
   the picker's internal state shape, and any new `OrchestratorState`
   variants.
5. **`DOCS.md` architectural sketch** — phase the picker's data flow
   (prop → derived default → picker state → user selection → event
   dispatch → orchestrator mode transition). Include a
   **Mermaid data-flow diagram** (per AGENTS.md invariant 6).
6. **AR-2 (Architectural Sketch)** — Opus, drift / cross-cutting focus.
7. **Commit** Phase 0 artifacts: `docs: establish L1 picker domain model
   and architectural sketch`.

Then Phase 1 increments per the ZOMBIES ordering, each with AR-3 before
implementation and AR-4 after self-review. Sandbox checkpoints fire for any
user-observable increment (the picker IS user-observable, so most
increments will have a sandbox checkpoint).

## Open questions to bring to the user during Phase 0

- **Toolbar scope.** Is the toolbar shell part of L1, or a sibling
  increment? The L1 design names "Toolbar" but doesn't separate the
  shell from the picker mechanism. A Phase 0 decision.
- **Picker placement when an editor-only snippet renders alone.** Does the
  picker appear on a `<StudyLenses snippet="..." />` (no lens prop, no
  fence config) page? The default-is-editor rule says yes (the picker
  shows `editor` as selected). Confirm during AR-1.
- **`editor` as a picker option vs. an implicit baseline.** The user's
  ruling is "default is editor when nothing else indicates otherwise."
  Implementation question: is `editor` a literal `<option>` in the
  dropdown, or is it the dropdown's "unselected / empty" state? AR-1
  question — bring both interpretations.
- **Behavior when the picker is changed mid-edit.** F2.5 (eager edit
  invalidation) governs the cache; the picker triggers a transition.
  Is there a confirm-discard prompt, or is the transition silent? Phase 0
  UX question.

## Out of scope — DO NOT touch

- **The `annotate` lens itself** — locked at AR-5 PROCEED.
  No changes to `lenses/annotate/*` from L1.
- **The `debug-props` lens itself** — meta-lens; treat as fixed.
- **The recommender (L5/L6)** — separate WS2 + L5 ticket.
- **L2's `lens` + `configs` resolution** — that's the prop-side cascade
  feeding the picker's default. L2 is its own increment; L1 only
  CONSUMES the resolved `lens` prop.
- **Other lens directories** (`parsons`, `writeme`, `blanks`,
  `dropdowns`, `variables`) — not migrated yet. L1's behavior with a
  larger roster is forward-thinking but the only currently-routable
  lenses are `annotate` and `debug-props`.

## Pointers for deeper context (read only if a question comes up)

- [`03-orchestrator-and-contracts.md` § F2–F5](./03-orchestrator-and-contracts.md)
  — the foundation tier the picker rides on (mode machine, lazy embody,
  internal bus).
- [`03-orchestrator-and-contracts-kickoff.md`](./03-orchestrator-and-contracts-kickoff.md)
  — earlier WS3 kickoff context.
- [`orchestrate/index.tsx`](../orchestrate/index.tsx) — current
  `<StudyLenses>` surface, `LENS_REGISTRY`, `deriveInitialState`.
- [`orchestrate/types.ts`](../orchestrate/types.ts) — current
  orchestrator types including `OrchestratorState`.
- [`lenses/types.ts`](../lenses/types.ts) — `LensModule` contract.
- [`spiralearn/welcome-to-frogramming/study-lenses.md`](../../../../spiralearn/welcome-to-frogramming/study-lenses.md)
  — learner-facing lens roster doc; reflects the post-rename state of
  `annotate`.
- [`development-guide.md`](./development-guide.md) — process playbook.

## What is deferred (so you don't try to "finish" it)

- L5 (recommendations panel UI), L6 ("Open in Suggested Lens" shortcut),
  L7 (per-fence ranking override) — all post-L1.
- L2's prop/cascade resolution work IF the prop-side already lands the
  resolved `lens` prop. L2 is mostly plugin-side; L1 only consumes the
  result.
- Multi-roster filtering (only-show-applicable-lenses behavior) — that
  rides on `applicableTo()` which is the lens's responsibility, not the
  picker's. Phase 0 decides if L1 filters the picker by applicability
  or shows the full roster.

## Suggested initial branch / commit cadence

Per AGENTS.md: commit directly to main, no branches unless the user says
otherwise. Phase 0 ends with one commit
(`docs: establish L1 picker domain model and architectural sketch`).
Each Phase 1 increment is its own atomic commit with `add:` /
`refactor:` / `fix:` prefix.

Use `--no-verify` per
[`project_markdownlint_gate_curricula`](../../../../../.claude/projects/-Users-master-Documents-0-teach-code-0-spiralearn-0--home/memory/project_markdownlint_gate_curricula.md)
(the repo's pre-existing markdownlint debt blocks the pre-commit hook;
the gate still flags new MD004 violations so don't introduce them).

---

Generated 2026-05-30 after the annotate-registration ticket landed
(commits `0d91553`, `3c3a923`, `de1d166`). The user's default-is-editor
ruling came in the same session as the registration commit — capture it
in the L1 spec so it doesn't re-surface as an open question.
