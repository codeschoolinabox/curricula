# Handoff: Register the `annotate` lens into `LENS_REGISTRY`

> **Scope**: a tactical ticket (~2 edits to one file, one commit). NOT a planning
> stream. The WS4 lens-migration stream that produced the `annotate` lens lives
> in [`04-lens-migration.md`](./04-lens-migration.md); this handoff is the final
> wiring step that publishes the lens to the orchestrator's dispatch surface.

## Context (5 lines)

The WS4 batch migrated the `annotate` lens (renamed from `highlight` at Phase 0
because the lens does annotation-on-top-of-display, not token highlighting) to
the new lenses-peer `LensModule` contract. The lens is **shippable** — AR-5
(Opus, pre-merge) returned PROCEED on 2026-05-29; 136 annotate tests pass; tsc
+ eslint clean for the annotate slice. But the lens is **not yet routable**:
`orchestrate/index.tsx`'s `LENS_REGISTRY` only contains `debug-props`, so a
`lens="annotate"` fence currently dispatches to the "unrecognized lens"
fallback. This handoff wires it in.

After registration, the orchestrator's L1 picker has its first non-trivial
two-member roster, and F4's "first trial pedagogical lens against the new
`LensModule` contract" milestone is satisfied.

## The work (two edits, one file)

**File**: [`src/lib/just-enough/javascript/orchestrate/index.tsx`](../orchestrate/index.tsx)

### Edit 1 — add the import

Insert at line 46, alphabetized next to the existing `debugPropsLens` import:

```tsx
import annotateLens from '../lenses/annotate/index.js';
import debugPropsLens from '../lenses/debug-props/index.js';
```

### Edit 2 — add the registry entry

At lines 65-67, insert the entry inside `LENS_REGISTRY` (keep the keys
alphabetized so the order is `'annotate'` before `'debug-props'`):

```tsx
const LENS_REGISTRY: Readonly<Record<string, LensModule>> = Object.freeze({
	'annotate': annotateLens,
	'debug-props': debugPropsLens,
});
```

That's it. No type changes, no contract changes, no test-surface changes in
`orchestrate/`. `annotateLens` already satisfies `LensModule` (verified by the
existing `tsc --noEmit` pass on the annotate slice).

## Verification (in order)

1. **Type-check** the orchestrator slice:

   ```bash
   npx tsc --noEmit 2>&1 | grep -i orchestrate
   ```

   Expected: empty (no new errors). The pre-existing red areas
   (`embody/lib/evaluating/`, `snippetry/debug/`) are out of scope — full-tree
   `tsc` is expected to surface those independently.

2. **Lint** the modified file:

   ```bash
   npx eslint src/lib/just-enough/javascript/orchestrate/index.tsx
   ```

   Expected: clean.

3. **Run the orchestrator test suite** (if any tests reference the registry):

   ```bash
   npx vitest run orchestrate
   ```

   Expected: pass. There may be a `study-lenses.test.tsx` or similar that
   enumerates the registry — confirm it still passes after the entry is added.
   (If a test asserts `Object.keys(LENS_REGISTRY).length === 1` or similar, it
   will need a one-character update to `=== 2`.)

4. **Live render check** (the eyeball, only you can do this):

   ```bash
   npm run start
   ```

   Then open `http://localhost:3000/annotate-preview` — this is the dev harness
   the lens-migration batch already shipped. It mounts `annotateLens.Component`
   directly (bypassing the registry) so it confirms the lens itself renders.
   For the **registered-path** check, find any `lens="annotate"` fence in the
   docs (or add one to a scratch `.md` page in `src/pages/`) and confirm the
   orchestrator dispatches to the new lens instead of the fallback.

## Commit

Suggested message (adjust if your conventions differ — the repo uses
`add:` / `docs:` / `refactor:` prefixes per recent git log):

```
add: register annotate lens in LENS_REGISTRY

Wires the migrated annotate lens (WS4) into the orchestrator's L1 picker
dispatch surface. The lens itself shipped over four commits ending d726a05;
this is the final routing step that publishes it.

Two edits to orchestrate/index.tsx: import annotateLens next to debugPropsLens,
add 'annotate': annotateLens to LENS_REGISTRY (alphabetized).

No behavior change in orchestrate; the annotate lens's existing 136-test
contract is unaffected. Picker roster grows from 1 to 2 lenses; F4's "first
trial pedagogical lens" milestone is satisfied.
```

The repo uses `--no-verify` for git commits per
[[project_markdownlint_gate_curricula]] (pre-existing markdownlint debt blocks
the pre-commit hook). If your session has been configured otherwise, follow
that configuration.

## Out of scope — DO NOT touch in this commit

- **The annotate lens source/tests/docs.** It's reviewed (AR-5 PROCEED) and
  shipped. Any change there is a separate ticket.
- **Other lens directories** (`parsons`, `writeme`, `blanks`, `dropdowns`,
  `variables`). They're not migrated yet; not your concern.
- **`embody/lib/evaluating/`** and **`snippetry/debug/`**. Pre-existing
  typecheck-red areas; out of scope per the WS3/WS4 handoff.
- **`src/lib/just-enough/javascript/clauding.{1,2,3,4}.{txt,js}`** — untracked
  scratch files owned by the user.
- **Parallel-session work-in-progress** that may appear in `git status` —
  e.g. `embody/lib/validating/*` modifications, untracked `orchestrate/editor/
  sandbox.html`, `lib/formatting-editor/*`. **Stage ONLY the orchestrate/
  index.tsx change.** If you see other modified files you didn't make, flag
  them to the user and leave them alone.

## Pointers for deeper context (read only if a question comes up)

- [`src/lib/just-enough/javascript/lenses/annotate/README.md`](../lenses/annotate/README.md)
  — the lens spec (Public API, Glossary, Tool contract, View contract, Future
  direction).
- [`src/lib/just-enough/javascript/lenses/annotate/DOCS.md`](../lenses/annotate/DOCS.md)
  — the architectural sketch (Phases 1–5, Mermaid data flow, Structural
  constraints).
- [`src/lib/just-enough/javascript/lenses/annotate/index.tsx`](../lenses/annotate/index.tsx)
  — the React wrapper that default-exports the frozen `LensModule` you're
  importing.
- [`src/lib/just-enough/javascript/lenses/types.ts`](../lenses/types.ts)
  — the `LensModule` contract the lens implements.
- [`04-lens-migration.md`](./04-lens-migration.md) — the WS4 stream plan
  this ticket completes.

## What is deferred (so you don't try to "finish" it)

The annotate lens documents one deferred follow-up in
[`lenses/annotate/README.md` § Future direction](../lenses/annotate/README.md):
**Flowchart-node → source-line correlation**. A `select` tool + node-click
selection was built during the WS4 batch and reverted (commit `a225004`)
because the visual-only highlight was too thin without a real source-position
mapping. The real correlation needs a flowchart-node → AST-position walk
(`js2flowchart` doesn't expose source positions; the mapping has to come from
embody's entwined-AST positions). The wrapper still ships the
`data-flowchart-node` post-inject tagger as forward-ready infrastructure
(documented as "no v1 consumer") plus a memoized
`dangerouslySetInnerHTML` prop object (a real React-reconciler bug fix
discovered during the reverted increment). **Do not try to wire this up as
part of registration.** It's a future increment with its own AR cycle.

## Open questions you should NOT answer unilaterally

- **Picker UX**: with the registry growing to 2 entries, the L1 picker is now
  non-trivial. If there's a UI affordance to surface ("two lenses available
  for this snippet"), that's a WS3 product decision, not a registration step.
- **Default lens**: currently `debug-props` was the only registry member, so
  there's no precedent for which lens picks if a fence omits `lens=`. This may
  surface during testing. If it does, ask the user — don't pick a default.

---

Generated at the end of the WS4 batch on 2026-05-29 by an earlier WS4 agent.
Commits in this batch: `02ca594`, `3e4a627`, `a225004`, `d726a05` (annotate
docs + view-toggle + revert + AR-5 cleanup).
