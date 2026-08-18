<!-- cspell:ignore spellme colorizing colorizer -->

# Brief — should `scanning` and `classifying` become embodiment facts?

**This file is `.planning-handoffs/embody-derivation-facts/BRIEF.md`.** Cite it
by that path.

**Status: not started. This is a design brief, not a plan.** It exists so a
future session starts from measured ground instead of rediscovering it. Two
things _are_ settled — the sequencing, and the 2026-08-17 ruling below; the
design questions remain open.

## Before reading further

- **Read your governance file.** The repo-root `CLAUDE.md` is a router: check
  your model id against its qualifying list and read whichever of `AGENTS.md` /
  `AGENTS.principal.md` matches, then `DEV.md` § Phase 0, § Ruling provenance
  and § Shared-worktree git mechanics. This is a **new-module-shaped** change to
  an established contract, so it is Phase-0 work and the artifact order binds.
- **Re-measure before acting:** `node scripts/repo-facts.mjs`, and paste its
  output rather than trusting any number below. This tree is under concurrent
  edit; HEAD has moved three times inside a single twenty-minute read.
- **This campaign's trigger has a check:**
  `npx vitest run --project unit src/lib/study-lenses/lib/scanning` reports
  fully green, with nothing skipped. Until then, do not start — the sequencing
  ruling below is the reason. (This environment's node sits below the engines
  minimum and vitest runs anyway; an engines-shaped failure is an environment
  problem, not the trigger being unmet.)
- **`ceremony` is the human's** and is not carried forward from the campaign
  that wrote this brief. Ask.
- **Commit by explicit pathspec, in one shell invocation, with `--no-verify`.**
  Peer sessions hold files staged in this shared index continuously; an unscoped
  commit takes their work.

**Settled (human, 2026-08-14):** this work happens **after** `lib/scanning` is
built and green. The derivation code is identical whether a lens calls it or the
embodiment factory does — only the call site moves — so a built leaf answers the
question better than either argument can beforehand.

**Settled (human, 2026-08-17):** the scanning integration **will happen**, and
**non-destructively**: it is built into embody **without deleting or modifying
the existing `lib/scanning/`** — the leaf stays byte-untouched and embody
becomes a caller. This rules § What a Phase 0 here must settle, item 6, for
scanning (the both-answer: leaf stays, embody publishes by calling it). Two
consequences the executing session inherits: any closing of the input-coherence
hole is recorded on the **embody side** (the leaf's own DOCS § Out of scope
stays as written unless a separate human-approved edit reopens it), and the tier
README rewrite (item 4) is untouched by this constraint — `lib/README.md` is not
under `scanning/`. The trigger was still unmet at transcription time [measured
2026-08-17: `npx vitest run --project unit src/lib/study-lenses/lib/scanning` →
50 passed | 21 skipped (71)] — this ruling does not lift the sequencing ruling
above. Classifying is NOT covered by this ruling; its question stays open as
written. **Provenance of this ruling:** "without deleting or modifying the
existing `scanning/`" covers all of `scanning/`, including the README paragraph
that carries the residence question as deliberately unresolved — so this ruling
RIDES THIS BRIEF (the campaign's durable artifact, per DEV.md § Ruling
provenance) and the write-back into `scanning/README.md` § Why this module
exists happens at campaign close, as a separate human-approved edit the closing
commit body enumerates. Do not edit the leaf's README to record it before then.

**Settled (human, 2026-08-18, in-session):** four rulings, taken at the
executing session's start and transcribed here the same day per DEV.md § Ruling
provenance:

1. **Phase 0 started under a design-only lift** of the 2026-08-14 sequencing
   ruling: the human authorized the design phase while the trigger measured
   unmet [measured at authorization, 2026-08-18: `npx vitest run --project unit
   src/lib/study-lenses/lib/scanning` → 53 passed | 18 skipped (71)]. By
   execution start the trigger measured **MET on committed work** [measured
   2026-08-18: same command → 71 passed (71), nothing skipped; scanning
   porcelain empty; leaf tip `10cec890`], so the lift is moot for Phase 0.
   Phase 1 still re-measures the trigger fresh at its own start.
2. **`classifying` will NEVER become an embodiment fact.** Permanent. This
   settles § What a Phase 0 here must settle item 6 for classifying (the leaf
   stays; no fact), discharges item 5 as not-owed (no port occurs, so no loss
   ledger), and closes § The question's classifying half. The discriminating
   admission line is the vocabulary-authority line (the second candidate
   below): classifying's five categories are a chosen teaching vocabulary,
   which the accuracy-not-pedagogy contract keeps outside the Facts.
3. **`ceremony: full`** for this campaign — AR-1 and AR-2 fire inside Phase 0;
   AR-3/AR-4 per Phase-1 increment; AR-5 at campaign close.
4. **`twin-doc: machine`** — Phase 0 step 0.2 produces a notional-machine
   document beside embody's README, and AR-1 challenges it alongside the
   README.

**The residence the approved plan executes (2026-08-18; ratification is the
Phase-0 human gate):** the input-element sequence enters as an **optional
enrichment member on the tokens stage's value** — no new fact stage, no
accessibility change, no data-flow change — derived by calling the untouched
leaf, per embody DOCS.md § Structural constraints' ratified derived-fact test
and its residence corollary. This is the reconciliation § Pointers asks for:
the standing constraint is applied, not amended and not parallel-invented.
Items 1 (admission line), 2 (eager; the timing number lands here in a dated
addendum at the Phase-0 commit), 3 (seam untouched) and 6-for-scanning settle
at that gate; item 4 (the tier README rewrite) executes when the peer session
holding `lib/README.md` lands its work.

**Settled (human, 2026-08-18, later the same session — the AR-1 PAUSE
round):** AR-1 (design challenge) returned PAUSE with four blockers; all were
resolved the same day and the fix set applied before types locked. Three
rulings came out of the round:

1. **The member is OPTIONAL** on the tokens stage's value — absent exactly
   when the enrichment derivation itself defects; the defect degrades the
   enrichment alone, loudly (embody README § Failure grammar carries the
   arm).
2. **E7 latitude:** E7's failures-are-data rule targets errors in the
   processed program; an embody-internal error may be caught into a data
   payload or may acceptably crash — the author's choice. This campaign
   chooses catch → loud report → absent member, for consistency with the
   region's guarded-defect pattern.
3. **The machine twin is embody's, not the scanner's alone** (AR-1
   counter-proposal A, adopted): `embody/notional-machine.md` models the
   factory briefly and the scanner in full, and a future stage reshape
   extends the file rather than inheriting it.

The campaign-close write-back list now has four entries: `scanning/README.md`
§ Why this module exists; `scanning/README.md` § Public API's
consumer-boundary paragraph; `lib/README.md`'s admission rule (if still
peer-held at commit time); the package README glossary's notional-machine
entry ("NM content lives with its level" — widened by embody's twin).

---

## The question

`lib/scanning` turns the tokens fact into ECMA-262 input elements.
`lib/classifying` turns tokens plus the syntax tree into a five-category
notional-machine taxonomy. Both are pure derivations over already-published
facts. Should the embodiment publish them as facts, derived once, instead of
each consumer projecting and calling?

## Two competing lines, and why the obvious one does not survive

**The line that does not work: "it is canonical vocabulary."** Input elements
are ECMA-262's own names, which feels like it settles it. It does not
discriminate — classifying could claim the same for the notional machine, and so
could every future projection. Under this line embody accretes every derived
view anyone wants.

**A line that does discriminate: who can guarantee the invariant.** Tiling is
not a claim about tokens. It is a claim about the _relationship_ between the
source text and the token stream — that together they account for every
character exactly once. Only something holding both can guarantee it. Today the
leaf is handed both by a caller and must trust they match; that precondition is
written into `lib/scanning/DOCS.md` § Out of scope as **input coherence**, and
it is the one hole in the module's headline promise. Embody owns both by
construction.

**⚠ That line justifies `scanning` and argues _against_ `classifying`.** Its
supporting distinction was: `source` is total, `tokens` is not, and scanning is
the derivation that _restores_ totality over the source; classifying never
claims totality over characters (it publishes no element for a comment and drops
zero-width chunks). A brief that moves both therefore **needs a different
line**, and finding it is this campaign's first design task. Do not skip past it
— it is the whole slippery-slope guard.

**A candidate replacement, offered without confidence:** a derivation belongs on
the embodiment when it is (a) pure over already-published facts, (b) needed by
more than one consumer, and (c) either invariant-bearing or expensive enough
that deriving it per-consumer is waste. That admits both, and it is checkable —
but it also admits `scoping` and `screening`, so whoever adopts it should say
out loud whether that is intended.

**A second candidate, from the session that authored embody's current DOCS
register (2026-08-17, offered as one session's position, not a ruling): the
vocabulary-authority line.** The opener of
`src/lib/study-lenses/embody/README.md` states it — "Embody decides nothing
about pedagogy. The contract is _accuracy_: the region publishes the machine's
own reading of the program." Ask in whose vocabulary the derivation is
expressed. Scanning's fourteen kinds are ECMA-262's own productions — the
specification's reading of the same source, a third authoritative
machine-reading beside the tokenizer's and the parser's — so it qualifies, and
the coherence invariant seals the residence argument. Classifying's five
categories are, by its own README, "the house taxonomy … semantic, by what the
element does in the NM" with authored judgment calls — a chosen teaching
vocabulary, which is exactly what the accuracy-not-pedagogy contract leaves
outside the Facts, independent of its current zero-live-consumers state. This
line admits scanning alone, answers scoping (already a fact: environment) and
screening (judge by whose vocabulary), and predicts the search for a line
admitting both fails on principle. Weigh it against the candidate above; the
anchoring caveat is real — its author also wrote the contract wording it appeals
to.

---

## Measured ground

All measured 2026-08-14. Re-measure before acting; this tree is under concurrent
edit.

- **embody imports no leaf at runtime.** The single hit across `embody/` is a
  test importing screening's parse settings [measured: `grep -rn "from
  '.*lib/\(scanning\|classifying\|scoping\|screening\)"
  src/lib/study-lenses/embody/`].
- **The tier's own README says so, and this campaign makes it false.**
  `src/lib/study-lenses/lib/README.md` justifies letting a leaf type-import
  embody's fact-types on the grounds that "a type-only import creates no runtime
  dependency and no import cycle **(embody imports nothing here)**". Embody
  importing two leaves at runtime inverts the direction that parenthetical
  describes. **There is no cycle** — the leaves import no package region at
  runtime — but the sentence stops being true and the tier's admission rule
  needs rewriting. Treat that as a required artifact, not a footnote.
- **`classifying` has ZERO live consumers.** Every runtime importer sits in
  `src/lib/study-lenses--deprecated-architecture/` — the quizzing engine, the
  question orchestrator, the blanks and quiz lenses, all deprecated [measured:
  `grep -rn "classifying" --include=*.ts --include=*.tsx src/ | grep -v
  '^src/lib/study-lenses/lib/classifying/' | grep import` → every hit under the
  deprecated tree]. In the live architecture it is an orphan. That cuts both
  ways and the brief will not pretend otherwise: it is an argument for giving it
  a guaranteed consumer, and an argument that nothing is currently asking for
  it.
- **The two facts sit at different depths.** `scanning` needs source + tokens +
  comments. `classifying` additionally needs the syntax tree [read:
  `lib/classifying/types.ts` § `ClassifyInput` — `readonly ast: acorn.Node`]. So
  a classifying fact must derive after the `ast` stage and must have a failure
  arm for a program that lexes but does not parse — **which is precisely the
  case `spellme` exists to serve**. A scanning fact has no such arm.
- **`scanning` publishes token _indices_, not token references** (human ruling
  2026-08-14), chosen partly to keep this door open: a fact on the embodiment
  must survive embody's own deep freeze, and an acorn token's `type` is a
  process-global singleton embody already excepts by name in `freezeExceptions`.
  `classifying` publishes flat primitives and has the same property.

---

## What a Phase 0 here must settle

1. **The admission line** (above). Without it this campaign has no principle and
   the next projection has no answer.
2. **Eager or lazy.** `derive-facts.ts` builds stages eagerly, so every
   embodiment would pay for both derivations whether or not anything reads them.
   Either that is cheap enough to ignore — measure it (a workable instrument:
   wall-clock both derivations over the existing test corpora, per settle; a
   suggested bar, not a ruling: low single-digit milliseconds) — or embody needs
   a lazy stage, which is a **new pattern in embody** and a substantially bigger
   change than it sounds.
3. **The fact/phase seam.** `Facts` already carries six stages against five
   `LifecyclePhaseName`s, and the two sets are not the same — `entwined` and
   `type` are facts but not phases, `evaluation` is a phase but not a fact. Two
   more facts that are not phases widen a seam somebody eventually has to close.
   Decide whether to widen it or close it here.
4. **The tier README rewrite**, per the measured finding above.
5. **A loss ledger for `classifying`.** It is built, tested and 694 lines. This
   repo's rule is that a port is verified against **what it replaces**, not
   against its own new contract, and that every omission or reword is enumerated
   with its justification. Whether "moving the call site" counts as a port is
   itself a question — but if any of classifying's contract changes shape in the
   process, the ledger is owed.
6. **Whether the leaves stay — RULED for scanning (human, 2026-08-17, above):
   the leaf stays untouched; embody integrates non-destructively by calling
   it.** For classifying the question stays open. The original recommendation,
   which the ruling confirms for scanning, was **both**: embody publishes the
   fact _by calling the leaf_, so the derivation stays a pure,
   independently-testable function with its own suite and embody becomes its one
   production caller and thereby the guarantor of coherence. That is not "leaf
   or fact" and nothing built so far is wasted.

## What this campaign is not

- Not a rewrite of either derivation. Both are pure functions with their own
  test suites; if the code changes, that is a different campaign.
- Not a decision about `scoping` or `screening`. Whatever line is adopted will
  imply an answer for them; state it, do not act on it here.
- Not blocked on `spellme` Phase 1 finishing — only on `lib/scanning` being
  built and green.

## Pointers

- **`src/lib/study-lenses/embody/DOCS.md` § Structural constraints — the
  RATIFIED fact-admission constraint** ("A fact is common, generic, and needed
  across consumers", with its (a)/(b)/(c) test for facts the region derives
  itself) **and § Embodiment decisions (E1–E8), the grounds register.** Design
  task 1's admission line does not start from a blank page: the candidate
  replacement above closely parallels this standing constraint without citing
  it. Reconcile with it — or amend it, with the maintainer's approval — never
  parallel-invent. (Pointer added 2026-08-17 by the session that authored the
  constraint's current wording; note that scanning and classifying are
  _derivations over facts_, not analyzer projections, so the constraint's
  derived-fact tier with its (a)/(b)/(c) conditions is the one that binds.)
- `src/lib/study-lenses/lib/scanning/` — README (the coherence precondition and
  the join-key argument), DOCS.md § Out of scope, types.ts.
- `src/lib/study-lenses/lib/scanning/README.md` § Why this module exists —
  carries this question as a dated open question, which is its canonical home.
- `src/lib/study-lenses/lib/classifying/` — README, DOCS.md, types.ts.
- `src/lib/study-lenses/embody/README.md` — the opener carrying the
  accuracy-not-pedagogy contract the second candidate line appeals to.
- `src/lib/study-lenses/embody/` — `derive-facts.ts` (stage construction),
  `index.ts` § `freezeExceptions` (the process-global guard), `types.ts`
  (`Facts`, `FactStage`, `LifecyclePhaseName`).
- `src/lib/study-lenses/lib/README.md` — the tier admission rule this campaign
  falsifies.
