<!-- cspell:ignore spellme -->

# Brief — align spellme's docs to the published input-element member

**This file is `.planning-handoffs/spellme/ACQUISITION-ALIGNMENT-BRIEF.md`.**
Cite it by that path. Written 2026-08-19 at the close of the
embody-derivation-facts campaign (durable record:
`.planning-handoffs/embody-derivation-facts/BRIEF.md`), on the human's ruling
that this alignment runs as a docs-mini-campaign of its own, BEFORE spellme's
Phase 1.

## Before reading further

- **Read your governance file.** The repo-root `CLAUDE.md` is a router: check
  your model id against its qualifying list and read whichever of `AGENTS.md` /
  `AGENTS.principal.md` matches, then `DEV.md` § Documentation migration
  discipline, § Sourced claims, § Ruling provenance and § Shared-worktree git
  mechanics.
- **START-GATE — verify the ground exists before anything else:** this brief
  must be COMMITTED (not untracked) and the embody close commit must exist
  (subject "docs: close the embody-derivation-facts campaign…" — find it with
  `git log --oneline -30 | grep 'close the embody'`). Then porcelain on every
  file this brief names: if ANY edit-site file is dirty under a peer —
  especially `lib/scanning/README.md` (site 6) — STOP and ask; a pathspec commit
  protects other FILES, never a peer's hunks inside YOUR file.
- **Re-measure before acting:** `node scripts/repo-facts.mjs` (node reports
  below the engines minimum in this environment — known; vitest runs anyway);
  `npx vitest run --project unit src/lib/study-lenses/lenses/spellme` (was
  `3 passed | 82 skipped (85)` at writing) and `src/lib/study-lenses/embody`
  (was `487 passed (487)`, zero skipped). This tree is under live concurrent
  edit.
- **Ask the human for `ceremony` at session start** — it is never carried
  forward. State the kind of work yourself: software work, docs-only amendment
  of ratified Phase-0 artifacts (no new module, so no twin ask fires; spellme's
  standing twin value is whatever its Phase 0 recorded — check its commit,
  `git log --format='%B' --all -S 'twin-doc' -- src/lib/study-lenses/lenses/spellme | grep 'twin-doc' | head -1`).
- **Commit by explicit pathspec, one shell invocation, `--no-verify`.** Peer
  sessions hold staged files continuously; an unscoped commit takes their work.

## What changed under spellme's feet (the fact this brief transports)

Since spellme's Phase 0 was written, the embody-derivation-facts campaign landed
(human rulings 2026-08-17/18/19; embody DOCS.md § Embodiment decisions E9):
**embody now calls the scanning leaf once per settle and publishes the sequence
at `facts.tokens.value.inputElements`** — an optional member, present on every
successful tokenization, absent exactly when the enrichment derivation itself
defects (a loud embody-machinery report, never a program state). A consumer
holding an `Embodiment` no longer calls the leaf. The leaf stays where it is
(`lib/scanning/` — the move under embody/ was considered and DECLINED, human
2026-08-19) and still owns the vocabulary: spellme's
`import type { InputElement }` from the leaf is CORRECT and stays.

Spellme's committed Phase-0 design already fits this shape —
`readStream(_facts: Facts)` takes the embodiment's facts, and its tests build
fixtures via `embody()`, so the member already flows into them. What is stale is
the PROSE acquisition story, not the contract shapes.

## FIRST: one design question for the human (pose it before any edit)

The member is optional. Spellme's committed `applicability` doc says only "the
tokens stage must have produced a value" [read at writing:
`src/lib/study-lenses/lenses/spellme/core.ts` § applicability JSDoc — the quote
wraps across source lines; grep a short fragment]. Ask:

> Does spellme's `applicability` also gate on the member's PRESENCE
> (`facts.tokens.ok && 'inputElements' in facts.tokens.value` — the lens
> declines quietly when embody's enrichment defected), or does it stay
> tokens-ok-only, treating an absent member inside `readStream` as a caller bug
> to surface (the leaf's own precondition philosophy)?

Record the answer as a dated ruling in this file AND reflect it in the edited
prose. The ruling's landing sites (disambiguation: spellme's README uses "the
gate" for the LEARNER-progression gate — a different concept; do not annotate
that prose): the `applicability` bullet under README `## The lens object` (~line
213 at writing — it states the tokens-ok condition and "served in full"), README
`## Edge cases` ~line 364 if presence-gating wins, and core.ts's
applicability/readStream JSDoc — sanctioned here because the functions are
unimplemented stubs; their contracts ARE the Phase-1 spec. NEITHER answer
requires test edits: the three skipped applicability fixtures behave identically
under both (only an enrichment-defect state distinguishes them, and no skipped
test constructs one).

## The edit sites (measured 2026-08-19; re-verify line positions — they drift)

In `src/lib/study-lenses/lenses/spellme/`:

1. **README.md ~line 32** — "lib/scanning turns the tokens fact into the
   specification's input elements … This lens reads that sequence": keep the
   vocabulary attribution, change the ACQUISITION — the sequence arrives
   published at `facts.tokens.value.inputElements` (derived by the leaf, called
   by embody); this lens reads the member, calls nothing.
2. **README.md** — sweep for any other passage implying spellme (or "a second
   lens of this family") calls or projects into the leaf; vocabulary-ownership
   references (lines ~50, 67, 75, 314, 329, 403 at writing) STAY — the leaf
   still owns the kind table.
3. **core.ts ~line 55** — the readStream JSDoc "the sequence itself comes from
   the scanning leaf": widen to name the published member as the source (via
   embody), plus the absent-member arm per the design ruling above.
4. **DOCS.md ~line 208** — the Navigation entry "The derivation:
   ../../lib/scanning/README.md": still true for the vocabulary; add the
   member's residence (embody publishes; consumers read) so the derivation
   pointer does not read as a call instruction. Sweep DOCS.md prose for the same
   acquisition story.
5. **types.ts ~line 19** — the header comment pointing at the leaf README:
   verify it reads as vocabulary ownership (fine) rather than acquisition (edit
   if the latter).
6. **`src/lib/study-lenses/lib/scanning/README.md` lines ~345-351** — the
   "Coherent is the caller's obligation" passage still presents
   projecting-off-facts as "the whole of the caller's boundary"; true for direct
   callers, silent on the factory-by-construction primary path. Routed to THIS
   campaign by the close AR-5 (its finding 9 — recorded in the embody close
   commit's body, the one the START-GATE locates). A leaf edit — confirm with
   the human before touching it (the leaf's byte-untouched default holds outside
   explicit approval).

## Also available to this session (human may activate any)

The embody campaign's review-findings backlog — recorded-only at close, per
increment with commit pointers — lives at
`.planning-handoffs/embody-derivation-facts/BRIEF.md`, in the bold block
"Settled (human, 2026-08-19, at the write-back gate)", item 4 — a bold
paragraph, not a `#` heading; grep for "at the write-back gate". If the human
wants any executed, they are test-suite edits in embody/tests/ and carry full
ceremony.

## What this campaign is NOT

- Not spellme Phase 1 (no un-skips, no implementations — the 82 skipped tests
  stay skipped; that campaign launches separately after this one).
- Not an embody edit: embody's README/DOCS/types/twin are settled and post-close
  current. If an edit there seems needed, stop and ask.
- Not a scanning re-litigation: residence, tier placement, and vocabulary
  ownership are ruled (2026-08-13/17/18/19 — the BRIEF and the leaf README carry
  them).

## Verification (end-to-end)

Per-file checkpoints on every changed file (markdownlint/cspell from REPO ROOT
only; eslint+prettier on any .ts); spellme suite unchanged
(`3 passed | 82 skipped (85)` shape — this campaign adds no tests unless the
human activates backlog items); embody + scanning suites untouched; tsc at 0.
Ceremony per the human's session-start answer; commit bodies carry the settings
line + sourced claims; the design ruling transcribed here same-day.
