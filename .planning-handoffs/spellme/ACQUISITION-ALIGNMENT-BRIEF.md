<!-- cspell:ignore spellme undercounts -->

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

**ANSWERED — see § Rulings of record below.** The rest of this section is the
question as it was posed; the answer and its four companions are recorded there.

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

## CLOSED — 2026-08-19

**This campaign is complete.** Four commits, as a SHA LIST because foreign
commits interleave them:

| SHA        | What                                                    |
| ---------- | ------------------------------------------------------- |
| `614ab524` | the rulings get a home before any prose moves           |
| `191f7da9` | the leaf's caller-boundary passages, both halves        |
| `120880d7` | spellme reads a published member; the acquisition sweep |
| `349d3f0a` | the presence-gate ruling, alone, and this close         |

⚠ **The last row read `(this one)` until a follow-up commit filled it**, which
is the trap `./PHASE-1.md` records three times against its own table: a SHA list
is written last, so the author's own final commit is the one that goes missing.
A SHA cannot be known before its commit exists, so the honest form is to fill it
immediately afterwards — not to leave a placeholder and hope.

**The campaign's success condition, which is an ABSENCE closing:**
`inputElements` appeared **zero** times across all **nine** tracked spellme
files at baseline [measured 2026-08-19: `git ls-tree -r --name-only 26a922e3 --
src/lib/study-lenses/lenses/spellme/` → nine, the seven non-test files plus
`tests/core.test.ts` and `tests/component.test.tsx`; `git grep -c inputElements
26a922e3 -- <that dir>` → no matches] and now appears in README, DOCS and
core.ts. This line said "seven" until 2026-08-19 — the non-test count, written
without the qualifier in the one sentence labelled the success condition. The
two test files remain at zero, which is the standing gap § Recorded, not fixed
item 4 hands to Phase 1. Every other instrument this campaign owns is a presence
detector and would have passed a tree in which nothing was fixed.

**Ruling migrations, verified rather than assumed** — the obligation § Rulings
of record set with its `→ migrates to` tags:

- **Ruling 1 → `lenses/spellme/README.md` § The lens object and `core.ts`'s
  `applicability` JSDoc.** Both landed with the `(human ruling 2026-08-19)`
  parenthetical.
- **Ruling 3 → `lib/scanning/DOCS.md` § Out of scope.** Landed inline in
  `191f7da9`.

Each was checked with the wrap-safe form **after** `prettier --write`, and with
`git grep -n 'human ruling'`, because prettier broke the leaf's citation twice —
the second time inside the round that was fixing the first.

**Ceremony:** `ceremony: medium` (ruling 2) — AR-1 on each of the four
commit-groups, AR-5 once over the SHA list. All five reviews ran; **every one of
the four AR-1s and the AR-5 returned PAUSE**, and in every case the blocker was
an error introduced **by a fix round** rather than one surviving it. That is
this campaign's most transferable finding, and it is why each resolution was
re-verified by the reviewer that raised it instead of being self-certified.

⚠ **This paragraph reported its own gates in the past tense before they had
run.** Until 2026-08-19 it read "Ceremony discharged… AR-1 returned PAUSE on
three of four groups" — written while the fourth AR-1 was still in flight and
before AR-5 existed, with a SHA table whose last row read `(this one)`. A
closing record that reports outstanding gates as discharged is the highest-cost
doc defect this repo has: the next reader gets no signal that anything is owed.
Caught by that fourth AR-1.

## Rulings of record

Four rulings, taken 2026-08-19 across this campaign's session — not all at its
start; ruling 2 was revised mid-session and ruling 1 was re-put twice, and each
bullet says so. Recorded here because a ruling that cannot be found by
`git grep` does not exist (DEV.md § Ruling provenance).

**Two of the four are in transit, and this block is not their home.** Only
ruling 2 has no module document to live in — a ceremony decision governs none.
Rulings 1 and 3 govern documents that exist today, so each is tagged
`→ migrates to` and the campaign's closing commit enumerates the transfer. A
`.planning-handoffs/` file is transitional scaffolding and gets pruned; a ruling
left only here evaporates with it.

- **Ruling 1 — `applicability` PRESENCE-GATES** (human ruling 2026-08-19,
  answering the question posed above). **→ migrates to
  `src/lib/study-lenses/lenses/spellme/README.md` § The lens object, and
  `core.ts`'s `applicability` JSDoc** — both must carry the
  `(human ruling 2026-08-19)` parenthetical, not merely the behavior.

  The lens declines when embody's enrichment defected, and the learner-facing
  cost is recorded explicitly rather than absorbed quietly.

  **This ruling was put to the human three times, and the record of that is the
  point.** First approved on a framing that omitted a consequence. Re-put with
  the consequence measured, and **reaffirmed**: spellme is the **only**
  `phase: 'tokens'` lens [measured 2026-08-19: `grep -rn "phase: '"
  src/lib/study-lenses/lenses/*/index.tsx` — parsons and writeme are both
  `source`], so a decline empties the phase, and an accessible-but-empty phase
  renders `Tokens, spelling: nothing studies this phase yet` [read:
  `src/lib/study-lenses/orchestrate/README.md`, in the display-labelling bullet
  under `## Glossary — region terms`; grep `nothing studies this phase yet` — "a
  phase whose only lens fails its applicability on this program is empty too"].
  That is a claim about **curriculum coverage** made when the truth is
  **machinery**, and it inverts embody's own rule that absence is "a reported
  embody defect, never a property of the program" [read:
  `src/lib/study-lenses/embody/README.md` § Reading the embodiment]. Accepted as
  a known cost; the caption itself is orchestrate's and is recorded below as a
  follow-on.

  **Third put — the decline is SILENT, and an earlier draft of this bullet was
  wrong.** That draft recorded a third part: a `console.error` from spellme's
  own gate, approved on the agent's framing that the alternative left the
  decline "inferred from an embody message three modules away." **That framing
  was false in three measured ways**, and AR-1 caught it before the prose
  landed: `applicability` "must be pure and synchronous, over the Facts alone"
  [read: `src/lib/study-lenses/embody/types.ts` § `Gateable` remark], so a side
  effect there falsifies the contract on the function it sits in; embody's
  wrapper **already names the declining lens** [read:
  `src/lib/study-lenses/embody/gate-lenses.ts` — `` `gateLenses: the
  ${lens.name} gate threw …` ``]; and `derive-tokens.ts` **already reports the
  defect at the defect site** [read:
  `src/lib/study-lenses/embody/derive-tokens.ts`, the `catch` around the leaf
  call]. There is also no precedent for it [measured 2026-08-19: `grep -rn
  "console\." src/lib/study-lenses/lenses/ --include=*.ts --include=*.tsx | grep
  -v tests` → no output]. **Re-put with those three measurements attached, the
  human ruled: silent `return false`.** No `console.error`, no embody edit, no
  new pattern in the lens region.

  **The ruling is also consistent with the lens kind's own contract**, which is
  weaker than the earlier draft's claim that the contract _required_ it. The
  Totality remark on `Lens` says that for this kind, refusal-as-data "is
  realized at the gate — a lens that cannot serve is never offered, so `main`
  carries no refusal arm" [read: `src/lib/study-lenses/lenses/types.ts` §
  `Lens`]. That bars a refusal arm in `main`; it does **not** discriminate
  between presence-gating and the rejected alternative, which put a precondition
  throw in `readStream` and would also have left `main` refusal-arm-free. A
  human ruling needs no derivation, and manufacturing one invites a future
  session to believe the question is foreclosed when it is not.

  **The spelling.** Use
  `facts.tokens.ok && facts.tokens.value.inputElements !== undefined`.

  ⚠ **An earlier draft of this bullet carried a ⚠ DO-NOT-USE directive against
  the `in` spelling. That directive was FALSE and is struck.** It claimed `in`
  cannot narrow an optional property on a non-union object type, citing
  `filterType`'s union-only branch. That was a **partial** source read shipped
  under a `[read:]` tag: `filterType` narrows the _object_ reference, while the
  _property_ reference is narrowed one frame earlier, in
  `narrowTypeByBinaryExpression`'s `InKeyword` case, which is gated on
  `containsMissingType` — an intrinsic that only enters a property's type under
  `exactOptionalPropertyTypes`. Measured directly rather than reasoned [measured
  2026-08-19: a three-function probe over the real `Facts` type, compiled with
  the repo's own config. Under `exactOptionalPropertyTypes: true` the no-check
  control errors TS2322 and **both** the `in` form and the `!== undefined` form
  compile clean; under `--exactOptionalPropertyTypes false` the control **and**
  the `in` form both error, and only `!== undefined` survives]. So the flag the
  struck directive cited as its own evidence is precisely the flag that **makes
  `in` work** — the claim was inverted, not merely wrong.

  **`!== undefined` is still the spelling to use**, for the one reason that
  survives: it depends on the member being `undefined`, not on the **key** being
  absent — and key-absence is pinned only by a recorded-only backlog item [read:
  `../embody-derivation-facts/BRIEF.md`, the backlog under the bold "Settled
  (human, 2026-08-19, at the write-back gate)" paragraph; grep `defect-T2` —
  "defect-T2 'in'-check strengthen"]. It is also the spelling that keeps
  compiling if `exactOptionalPropertyTypes` is ever relaxed. That is a
  robustness argument, not a correctness one, and it is recorded as such.

- **Ruling 2 — `ceremony: medium`** (human ruling 2026-08-19). AR-1 and AR-5
  fire; AR-2, AR-3 and AR-4 do not. **The timing, stated plainly because
  "revised down" is a shape DEV.md § ceremony scrutinizes:** the human first
  answered `full` at session start, then revised to `medium` mid-session, before
  any commit landed. No commit exists under `full`. Not an agent-side
  lightening: the agent never states this value and never lowers it.

  **The gate set named, per DEV.md § ceremony's own instruction to name it
  rather than assume it.** DEV.md records a docs-only precedent under which AR-2
  fires "where a sketch or structural artifact is among the changed files" and
  AR-3/AR-4 are `n/a`. This changeset would meet that trigger — edit site 4 is
  `spellme/DOCS.md`, the architectural sketch — and it also touches source
  (`core.ts`, `types.ts`), which routes an increment to the **ordinary** set.
  Ruling 2 settles both: the level is `medium`, so the set is **AR-1 + AR-5 on
  every commit-group**, and the collision is named here rather than left for a
  future reader to find.

  This is the only ruling in this block with no module document to migrate to.

- **Ruling 3 — the leaf edit covers BOTH halves** (human ruling 2026-08-19). **→
  migrates to `src/lib/study-lenses/lib/scanning/DOCS.md` § Out of scope**,
  inline, where DEV.md § Ruling provenance puts it.

  Site 6 below already routes `lib/scanning/README.md` — routed by the embody
  close AR-5, before this campaign opened. What this ruling **adds is the
  `DOCS.md` half**: § Out of scope says, verbatim, "**The caller's gate and
  projection.** Gating on a successful tokens stage, and projecting the three
  values off an embodiment's facts, are the caller's one-line boundary and are
  named in the README rather than done here" [read:
  `src/lib/study-lenses/lib/scanning/DOCS.md`; grep `are the caller's one-line
  boundary`]. The two were approved together under the batch-fix rule. Together
  they close the whole of the finding recorded at `./PHASE-1.md` — under
  `## Deferred, and recorded elsewhere`, the third numbered sub-item of the
  "Four findings from the Phase-1 close" bullet; grep `DOCS and README disagree`
  — whose named owner, the embody-derivation-facts campaign, has since closed
  [read: `60349d76`].

- **Ruling 4** (human ruling 2026-08-19) — **the embody review-findings backlog
  stays RECORDED-ONLY.** It re-confirms the ruling at
  `../embody-derivation-facts/BRIEF.md`, in the bold paragraph "Settled (human,
  2026-08-19, at the write-back gate)" — a bold paragraph, not a heading; grep
  `at the write-back gate` — item 4. Offered to this session under § Also
  available below, and declined. Out of scope. Nothing to migrate: it is a scope
  decision about another campaign's backlog.

### Standing values — transcribed, not decided

Not rulings, and deliberately not numbered as such: `work` and `prospective` are
the agent's to state, `ceremony` is ruling 2's, and `twin-doc` is each module's
already-established value, which outside Phase 0 is never re-asked.

- `work: software` — path-derived, mechanically: `src/` and unnamed paths are
  software work.
- `prospective` — the artifacts constrain a Phase 1 that has not run.
- **spellme = `twin-doc: user`** [measured 2026-08-19: `git log --format='%B'
  --all -S 'twin-doc' -- src/lib/study-lenses/lenses/spellme | grep 'twin-doc' |
  head -1`].
- **`lib/scanning` = `twin-doc: none`** [measured 2026-08-19:
  `git log --format='%B' -- src/lib/study-lenses/lib/scanning | grep -o 'twin-doc: [a-z]*' | sort | uniq -c`
  → 28 `none`, 1 `machine`; the `machine` one's subject module was embody, not
  the leaf].
- **This file = `twin-doc: none`**, matching its own last commit `adf83dc5`.

### Recorded, not fixed

Three findings this campaign surfaces and deliberately does not act on, and two
obligations it hands forward to spellme Phase 1.

1. **The orchestrate caption tells a learner the wrong thing on an embody
   defect.** Grounds and measurement are under ruling 1. Fixing it is an
   orchestrate change — a different module, a different campaign — and it is out
   of this campaign's scope. Recorded here so the finding outlives the session
   that found it.
2. **The coherence guarantee is restated across four files, and its declared
   normative home is in another module.** `embody/types.ts` says of itself that
   it carries "the normative statement of the coherence guarantee"; the leaf
   restates the mechanism at README § Public API and § Where this module and the
   specification part ways, and `DOCS.md` § Out of scope phrases it again.

   ⚠ **The count and the command this bullet first carried were both wrong**,
   caught by AR-5. It said "five homes" behind a plain
   `grep -rn "by construction"`, which returns **three lines across three
   files** — the phrase wraps under prettier at six further sites, which is this
   campaign's own recorded trap. Wrap-safe it is **ten occurrences across four
   files** [measured 2026-08-19: `perl -0777 -ne 'my $c=()=/by\s+construction/g;
   print $c' <file>` per file → `scanning/README.md` 3, `scanning/DOCS.md` 2,
   `embody/README.md` 4, `embody/types.ts` 1]. And one home the bullet named —
   `scanning/types.ts`'s `ScanInput` doc-comment — measures **zero**: it
   restates the **acquisition** story, not the coherence mechanism, so it was
   never a home for the thing being counted. Raised by AR-1 on C1 as the primary
   bounded-context lens: the leaf's code is genuinely domain-blind, but its
   **prose** narrates embody's control flow, so the fold `lib/scanning/DOCS.md`
   already defers will have five sites to keep in step. C1 took the cheap half —
   its new passages now point at `embody/types.ts` for the normative statement
   instead of re-deriving it — and left the rest. **The durable fix belongs to
   the deferred two-leaves-into-embody fold, not to a passage correction**, and
   is recorded here so that campaign inherits the site count rather than
   discovering it.

3. **`"the gate"` is a homonym, and `DOCS.md` carries BOTH senses by itself.**
   The collision is not across the two documents, which is how an earlier draft
   of this item framed it — it is inside one. `DOCS.md` says "**The gate**
   answers applicability" in its § Architectural sketch (machinery), and "**The
   gate is the entire refusal channel.** A wrong claim advances nothing" in its
   § Structural constraints (learner) — the second near-verbatim from
   `README.md` § Glossary, which defines _the gate_ as "the rule that the stream
   advances only on a correct claim". So renaming one document's usage would
   **not** resolve it. Pre-existing; not caused by this campaign, which walks
   into it. **Mitigation taken instead of a rename, and scoped:** in the
   **committed module prose** this campaign writes about the defect state, the
   bare word "gate" never appears — the sentences say "applicability declines"
   or "the lens is not offered". The mitigation binds the module documents, not
   this handoff, which uses "gate" freely and would otherwise be its own
   violation. A rename of the committed prose is the human's to elect.
4. **Phase 1 owes a defect-state test, and it needs its own FILE.** The new
   presence condition ships with no test constructing the defect state [measured
   2026-08-19: `grep -c inputElements
   src/lib/study-lenses/lenses/spellme/tests/*.ts*` → 0 in both files]. This
   campaign adds no tests by its own charter (§ Verification below), so the
   obligation passes to spellme Phase 1 — **but not as a fixture added to
   `core.test.ts`**, which an earlier draft of this item said and which would
   not work. The defect state is constructed with a **file-scoped, hoisted**
   `vi.mock` of the leaf, and the precedent file says in its own header why it
   is separate: the healthy suite lives elsewhere, "untouched by the mock"
   [read: `src/lib/study-lenses/embody/tests/derive-tokens-defect.test.ts`, its
   header comment and the `vi.mock` above the imports]. Dropped into
   `core.test.ts` the mock would poison all 54 healthy core tests. So: **a new
   test file mirroring that one's shape**, with the mock surviving through
   `embody()` rather than a direct stage call. Not a defect of this campaign —
   spellme's core is entirely unimplemented stubs, and its suite stands at 3
   passing and 82 skipped of 85 [measured 2026-08-19: `npx vitest run --project
   unit src/lib/study-lenses/lenses/spellme`] — but a gap that would otherwise
   be discovered at Phase 1's test strategy, after a plan had already been built
   on the wrong shape.
5. **`readStream` gets a precondition throw, not an "absent-member arm".** Under
   ruling 1 the member is guaranteed present by the time `readStream` runs —
   `Lens`'s Totality remark makes mounting without the gate "a consumer bug", so
   `readStream` may assume presence, and an arm that _handles_ absence as a
   state would be a dead branch no test can reach. But the compiler still forces
   a check: `readStream` receives a fresh `Facts`, applicability's truth does
   not cross the function boundary, and `!` is barred [read: `eslint.config.mjs`
   — `@typescript-eslint/no-non-null-assertion` set to `error` over
   `src/lib/study-lenses/**/*.ts`]. The resolution is the sentence `core.ts`
   already carries: an unusable embodiment is "a caller bug rather than a state
   to absorb" [read: `src/lib/study-lenses/lenses/spellme/core.ts`, the
   `readStream` JSDoc — the quote wraps across source lines, so grep `bug rather
   than a state to absorb`]. It re-checks and **throws** — unreachable by
   contract, required by the compiler — exactly as the leaf does for its own
   inputs. Recorded because the distinction is invisible until someone writes
   the branch.

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
   embody), plus the precondition throw per § Recorded, not fixed item 5 —
   **not** an absent-member arm. **And `core.ts`'s `applicability` JSDoc must
   carry the `(human ruling 2026-08-19)` parenthetical**, not merely the new
   behavior: it is one of ruling 1's two migration targets, and a behavior
   recorded without its provenance is one the next session cannot locate.
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

**Offered and DECLINED — see § Rulings of record, ruling 4.** The backlog stays
recorded-only; nothing below was activated. Kept here because the offer stands
for whichever session comes next.

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
**Ceremony per ruling 2 (`medium`) — NOT the session-start answer**, which was
`full` and was superseded mid-session; this line said "per the human's
session-start answer" and aimed at the dead value until 2026-08-19. Commit
bodies carry the settings line + sourced claims; the design ruling transcribed
here same-day.

**And the closing commit ENUMERATES the ruling migrations.** Rulings 1 and 3 are
tagged `→ migrates to` in § Rulings of record because their homes exist; the
close is where that transfer is checked rather than assumed. Verify each landed
**with its `(human ruling 2026-08-19)` parenthetical**, using the wrap-safe form
— prettier breaks a parenthetical mid-line and a single-line `git grep` then
undercounts:

```sh
# undercounts — prettier breaks the parenthetical and this misses the wrapped ones
git grep -h 'human ruling 2026-08-19' -- src/lib/study-lenses | wc -l

# the form that works — note the redirect: `cat <file>` reads a file NAMED "file"
f=src/lib/study-lenses/lenses/spellme/README.md
tr '\n' ' ' <"$f" | tr -s ' ' | grep -o 'human ruling 2026-08-19' | wc -l
```

Run the second form on each migration target **after** `prettier --write`, never
before. A ruling left only in this file evaporates when the handoff is pruned.
