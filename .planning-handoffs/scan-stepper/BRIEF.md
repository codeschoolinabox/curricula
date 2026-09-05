<!-- cspell:ignore spellme wireframes -->

# A stepping lens over the input-element sequence — Phase 0 launch prompt

You are opening a **new lens** in
`/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula`.
This is **Phase 0 only**: README, the twin ask, `AR-1`, then `types.ts` + the
DOCS.md sketch + the tests written for real and committed skipped, then **`AR-2`
only if the declared level includes it** — the default does NOT; see § Phase 0 —
then the human's gate. **Write no implementation.**

## Where the paths in this brief point

**Every module path here is relative to `src/lib/study-lenses/`.** So
`lenses/spellme/README.md` means
`src/lib/study-lenses/lenses/spellme/README.md`.

⚠ **`src/lib/study-lenses--deprecated-architecture/` also contains
`lenses/parsons/`, `lenses/writeme/`, `lenses/debug-props/` and `lib/`.** It is
a different architecture and nothing in it is your precedent. Every unqualified
`lenses/…` reference below resolves in the LIVE tree only.

## First act — governance

Read the repo-root `CLAUDE.md`. It is a **router**: check your model id against
its qualifying list and read whichever of `AGENTS.md` / `AGENTS.principal.md` it
selects, **end to end**. Then `DEV.md` §§ Incremental Development Workflow
(Phase 0 especially), Adversarial Review Protocol, Codebase Conventions, Testing
Strategy, Sourced claims, Ruling provenance, Shared-worktree git mechanics.

## What the human asked for, verbatim

> "a simpler version of your lens that just steps through the tokenization
> process without prediction? just stepping forwards and backwards with code
> highlighted in place depending on what becomes of it"

Said of `spellme`, at the close of a wave-3 **session** (2026-09-04). ⚠ Not at
the close of the wave — that wave is still in progress; see § Measured state.

**That sentence is the whole seed and it is small on purpose.** Do not grow it
into a second `spellme`. The distinguishing property is the one the human named:
**no prediction.** There is no claim, no verdict, no attempt count, no way past,
and nothing the learner can get wrong. A cursor moves; the source re-colours.
That is the lens.

⚠ **`gate` is a HOMONYM here and this brief uses both senses.** `spellme`'s
glossary separates them and 0.1's must too: **the gate** is its learner-facing
rule that the stream advances only on a correct claim — **you have none of
that** — while _the gate_ elsewhere, including in § PARTIAL TOKENIZATIONS, means
`applicability`, whether the lens is offered at all. **You do have one of
those.** Resolve the collision in your glossary rather than carrying it forward.

## Why this is its own lens rather than a mode of `spellme`

It is the pattern the family already follows, by ruling [read:
`lenses/spellme/README.md` § Future direction — "**Each further game is its own
lens** (human ruling 2026-08-13), over the same sequence: this one, the
scanner's stopping point, one-character sabotage, and the generative
direction."]. This is a further game over the same sequence.

## What it reads, and what it must not derive

The input-element sequence arrives **already on the facts**, at
`facts.tokens.value.inputElements`. This lens **reads that member and derives no
element**, exactly as `spellme` does. `lib/scanning` owns the vocabulary, the
template folding, the `}` disambiguation and the trivia; the embodiment's
factory calls that leaf and publishes the result.

Read `lenses/spellme/README.md`'s orientation and `lib/scanning/README.md`
before designing anything — the vocabulary is theirs and you inherit it
unchanged.

The member is **optional**, absent exactly when the derivation itself defected.

## ⛔ PARTIAL TOKENIZATIONS — read this before you write the gate

**A failed tokens stage now PUBLISHES ITS ELEMENTS, and handling that is
squarely this lens's job** (human ruling 2026-09-05). An earlier revision of
this brief told you to copy `spellme`'s gate and to decline a program that does
not lex. **Both are now wrong**, and following them builds the lens that misses
its best material.

`StageFailure` gained a value arm [read: `embody/types.ts` — `StageFailure<Value
= never> = { readonly ok: false; readonly cause: StageCause; readonly value?:
Value }`], and the tokens stage fills it [read: `embody/derive-tokens.ts` —
`return { ok: false, cause, value: { tokens, comments, inputElements } };`].

**`facts.tokens` now has FOUR states, not two**, and your gate must say which it
serves:

| `ok`        | `value.inputElements` | what it is                                                                                                                                                                      |
| ----------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `true`      | present               | a clean tokenization — the whole source                                                                                                                                         |
| `true`      | **absent**            | embody machinery defect; the enrichment threw. Loud in dev, never a property of the program                                                                                     |
| **`false`** | **present**           | ⭐ **a partial reading — the prefix that lexed.** The case the human asked about                                                                                                |
| `false`     | **absent**            | the account DEGRADED — the element derivation threw over the prefix. ⚠ `value` is STILL present, carrying `tokens` and `comments`; only `inputElements` is missing. Loud in dev |

⚠ **`spellme`'s gate accepts only row 1 and is therefore NOT your precedent**
[read: `lenses/spellme/core.ts` — `facts.tokens.ok &&
facts.tokens.value.inputElements !== undefined`]. Copying it declines exactly
the case you exist to show. Whether you serve rows 1 and 3, or row 3 as well but
differently, is a design decision — **put it in the batched ask.**

**What the prefix contains**, and it is more careful than "the tokens so far"
[read: `embody/README.md` § Failure grammar, and `embody/types.ts`'s
`inputElements` doc]:

- the tokens produced and comments set aside **when the failing turn was
  reached** — "the same shape a successful tokenization publishes, marked
  untrustworthy by the arm it rides";
- **a BOUNDED input-element sequence** over "exactly what the completed turns
  reach — the source cut at the account's own extent (the end of the last token
  or set-aside comment, whichever is later)", handed to the same scanning leaf
  **under its unchanged tiling contract**. It still tiles; it tiles a prefix.
- ⚠ **the extent is the account's own, not the machine's**: "Where the cause
  reports an `offset`, the extent sits at or before it — the offset is the
  machine's report; the extent is the account's own, defined even when the
  machine reports none." Do not draw `cause.offset` as the stopping point; the
  sequence's own end is.

⚠ **`ok` is "a discriminant, not a wall — an accepted cost, weighed"** (human
ruling 2026-09-01): under one shared `value` name, "a read that skips the
narrowing can reach an account where it once reached nothing." Nothing
structural stops you drawing an untrustworthy prefix as though it were
trustworthy. **If your surface does not distinguish them, nothing else will.**

⭐ **EMBODY PUBLISHES THIS FOR A LENS OF YOUR FAMILY, BY NAME.** § Failure
grammar's consumer list (human ruling 2026-09-01): "the
**scanner's-stopping-point lens of the spellme family reads the prefix**." That
is very close to what you are, and it is why the boundary in question 5 needs
the human before you write a README.

## Measured state

**Re-measure every row; nothing here is pinned.** Each carries the command.

| Fact                               | Value                                                                           | Command                                                                                                                                                                                                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spellme` suite                    | `Tests 91 passed \| 27 skipped (118)`                                           | `npx vitest run --project unit src/lib/study-lenses/lenses/spellme`                                                                                                                                                                                                                                        |
| lenses declaring `phase: 'tokens'` | **exactly one** — `spellme`                                                     | `grep -rn "phase: 'tokens'" src/lib/study-lenses/lenses/ --include=*.ts --include=*.tsx`                                                                                                                                                                                                                   |
| `Lens` requires                    | `name`, `label`, `applicability`, `main`; `phase`/`config`/`recommend` optional | read `lenses/types.ts` + `embody/types.ts` § Gateable                                                                                                                                                                                                                                                      |
| `FATE_BY_KIND` exported?           | **no**, nor `ADVANCES_ON_ITS_OWN`                                               | `grep -nE 'FATE_BY_KIND\|ADVANCES_ON_ITS_OWN' src/lib/study-lenses/lenses/spellme/core.ts` — then check no hit sits on an `export` line                                                                                                                                                                    |
| cross-lens imports                 | **zero**                                                                        | `grep -rhoE "from '\\.\\.?/[^']*'" src/lib/study-lenses/lenses/ --include=*.ts --include=*.tsx \| sort -u` — READ the list; a cross-lens import reads `../spellme/core.js`, and today the only cross-directory hits are `../../embody/`, `../../lib/scanning/`, `../../types.js`, `../core.js`, `../lib/…` |
| `npx tsc --noEmit`                 | **RED repo-wide**, zero under `lenses/`                                         | `npx tsc --noEmit \| grep "study-lenses/lenses/"` — ⚠ the shorter `grep lenses/` matches `study-**lenses**/` and returns the package's every error                                                                                                                                                         |
| whole-repo vitest                  | **9 or 10** failing files — the tenth is the intermittent named below           | `npx vitest run --project unit`                                                                                                                                                                                                                                                                            |

⚠ **Eight of those ten are the documented baseline** in
`spellme/PHASE1-WAVE-2-BRIEF.md` § Measured baselines (full heading: "Measured
baselines — the debt that is NOT yours"). **The other two are named here so you
do not report them as regressions:**

- `lib/local-llm/tests/feasibility.test.ts` — the peer's in-flight
  `GenerationOutcome` refactor, with files dirty in `git status`.
- `orchestrate/tests/index.test.tsx` — **a documented KNOWN FLAKE**, and the
  reason the row above gives two numbers. Do exactly what its own baselines
  section says: "If you see it fail, it is not yours and it is not new —
  **re-run it alone before reporting anything**." Fails-in-suite plus
  passes-alone is the flake; fails-alone is real.

  ⚠ **Do NOT try to discriminate it by the `getClientRects` TypeError.** That
  string comes from a jsdom gap independent of the result: measured 2026-09-04
  it printed **8 times in one green run and 0 times in another**, both
  `128 passed`. It corroborates nothing and decides nothing. An earlier revision
  of this brief said to check the symptom INSTEAD of the isolated re-run, which
  is backwards — the re-run discriminates and the symptom cannot.

⚠ **`spellme` IS NOT FINISHED, and every route in question 2 depends on it.**
Its wave 3 is **IN PROGRESS** [read: `.planning-handoffs/spellme/PHASE-1.md` —
the heading "Phase 1, wave 3 (IN PROGRESS)"]: `judgeClaim`, `settle` and
`handOver` all still `throw`, 27 tests are skipped, and a session is actively
working that directory. **Read its `PHASE-1.md` for live state before depending
on any of it, and expect its files to move under you.**

⚠ **`label` is REQUIRED on `Lens`** (human ruling 2026-09-01, cross-region,
landed at **`253e6684`**). ⚠ **That ruling is NOT findable by
`git grep 'human ruling'`** — `lenses/types.ts` states the requirement and
carries no parenthetical, so the SHA is given here because DEV.md § Ruling
provenance says a ruling you cannot locate in one command is one you would be
inventing. It is real; open the commit. And it is learner-facing copy: "a
learner reads _rebuild the order_, never `parsons`". Yours is authored, not
derived — and note that `spellme`'s and `debug-props`'s were derived from their
READMEs and are **flagged as owed a copy pass**, so do not copy that shortcut.

⚠ **There is no spell-check gate.** `cspell` was uninstalled at `9baca1e7`. Live
gates: `npx eslint <file>` (`.ts`/`.tsx`, run **bare** — after a pipe `$?` is
the tail's), `npx markdownlint-cli2 --no-globs "<file>"`, `npx tsc --noEmit`,
`npx prettier --check`. **`eslint` is vacuous on `.css` and `.mdx`** — it exits
0 while reporting the file ignored.

## The six questions Phase 0 has to answer, and none is yours to settle alone

### How to ask — the mechanism, because four of these are blocking

**Batch every open question into ONE `AskUserQuestion` call before writing a
line of the README**, plus the `twin-doc` ask, the `ceremony` level, **which of
the four `facts.tokens` states your gate serves** (§ PARTIAL TOKENIZATIONS), and
**the `label` string** — required on `Lens`, learner-facing, and this brief
forbids you the shortcut everyone else used, so it is the name question wearing
different clothes. Do not dribble them out; do not answer them yourself. If the
session is non-interactive, **stop and surface them in your final message rather
than guessing** — question 1 blocks the directory name, and a directory renamed
later rewrites every path in every artifact.

**Fallbacks, where one exists:** `twin-doc` silence records `none` (DEV.md's
rule). `ceremony` silence **runs** at `medium` — AR-1 and AR-5 only — but ⚠ **it
is RECORDED as `ceremony: unset`, never as `medium`.** Those are two different
questions: "an honest, greppable gap beats an invented value", and "a level
written into a commit body is a ruling, and a ruling nobody made does not
exist." **The name has NO fallback**, and neither does `label`; if either does
not come, stop rather than inventing one.

**1. The name, and therefore the directory.** `scan-stepper/` here is a
placeholder for this brief's own path and nothing else. The name is the human's;
it keys `data-lens`, the CSS scope and every selector, so **0.1 cannot write its
DOM contract until it is answered** — which is why it is asked first and has no
fallback.

**2. Where the fate derivation lives — the sharpest question in the unit.**
`spellme` derives a **fate** per element (`token-tape` / `set-aside` /
`consumed`) plus a **mark** (the syntactic grammar reads a line break here). You
need the same partition: highlighting "depending on what becomes of it" IS the
fate. But `spellme`'s `types.ts` calls `Fate` **"this lens's word"**, derived
from the element kind. ⚠ The line "reports the kind and says nothing about
destinations" is **`spellme`'s prose about `lib/scanning`** [read:
`lenses/spellme/types.ts`, the `Fate` doc] — that leaf never disclaims
destinations in its own voice. ⛔ **THAT WAS FALSE, and an earlier revision drew
the opposite conclusion from it.** The leaf disclaims destinations explicitly,
in its own list of what it does not do [read: `lib/scanning/DOCS.md` —
"**Destinations.** Where an element goes, what it means to a learner, whether it
is claimable — all consumer vocabulary. This module reports what the scanner
produced and says nothing about what becomes of it."]. So the SECOND route —
extract to `lib/` — has a **stronger** counter-argument than that revision
credited: the leaf has already ruled destinations to be the CONSUMER's
vocabulary, not its own. Read that passage before answering. Three routes, and
the human picks:

- **duplicate the tables** — two 14-row records plus the
  `ClaimableKind`/`AdvancingKind` unions. ⚠ Larger than it sounds, and it
  inherits an open contract question: `spellme/core.ts` records that closing the
  partition properly means
  `AdvancingKind = Exclude<InputElementKind, ClaimableKind>` in `types.ts` — "a
  Phase-0 contract change, so a FLAG and the human's, not a refactor (raised by
  AR-5, 2026-08-25, and never compiled)". A **second** lens on the same
  partition is exactly the occasion that question was waiting for.
- **extract to `lib/`** — the 2+ call-sites rule lives in `AGENTS.principal.md`
  § Critical Conventions (**not** DEV.md; that pointer was wrong in an earlier
  revision of this brief), and you would now have exactly two. But it promotes a
  word `spellme` claims as its own.
- **read `spellme`'s core directly** — ⚠ **not available as "read the tables".**
  `FATE_BY_KIND` and `ADVANCES_ON_ITS_OWN` are **not exported** [measured
  2026-09-04: `grep -n export lenses/spellme/core.ts` matches neither]. The only
  route is calling `readStream(facts)`, which means inheriting `spellme`'s whole
  `StreamElement` shape including its `marked` field — a bigger commitment than
  it looks, and it makes a lens depend on a peer lens's internals, which no lens
  here does today [measured 2026-09-04: zero cross-lens imports].

**Do not decide this in code.** It is an `AR-1` question and a human ruling.

⚠ **BEFORE QUESTIONS 3 AND 4: a whitespace run is ONE element, not many.** The
scanning leaf collapses "whitespace and line-terminator runs … to maximal runs —
the leaf's one deliberate departure from the specification, **reversible by
splitting a run's text per character**" [read: `embody/types.ts`, the
`inputElements` doc]. A five-space indent is a **single** element; a blank line
is one `LineTerminator` spanning both endings. **This decides both questions
below** — what a step steps over, and what a per-element highlight can colour.
If you want per-character whitespace the leaf names the reversal, and taking it
is a design decision, not a detail.

**3. The cursor model, which is genuinely NEW and is not `spellme`'s.**
`spellme`'s `positionCursor` **only advances**, skips trivia, and is documented
as the module's only writer of the cursor. Yours must step **backward**, and —
this is the design point — it should almost certainly stop **on trivia too**,
because watching whitespace evaporate and a comment lift out is the whole
content here. `spellme` advances past exactly what this lens exists to show.
That likely makes your cursor a plain index over the whole sequence with no
positioning rule at all, which is _simpler_ than `spellme`'s, not a variant of
it. Say so in the sketch rather than inheriting a function you do not need.

**4. Highlight-in-place needs a DOM shape `spellme` does not have, and this is
the lens that earns it.** `spellme` joins every consumed element's text into one
`data-spellme-consumed` span, which is why `README.md` § UI structure's promise
that "an evaporating one [is] hatched" **has no carrier there** — a finding an
`ar-4` raised and the human independently reached from the running surface
("whitespace … simply rendered as characters with a whitespace color in the
source code"). Your surface is per-element from the start. That is a real
advantage to state in the sketch, and it makes this lens a candidate home for
the arrangement `spellme` could not draw.

**4b. How this lens reaches a learner — 0.1 needs it and cannot derive it.**
`orchestrate/lib/composing/built-in-lenses.ts` holds
**`[parsonsLens, writemeLens]`** and nothing else [measured 2026-09-04], while
`lenses/README.md` § The roster describes `spellme` as serving the `tokens`
phase. The prose roster and the code roster disagree today: `spellme` is
reachable only through a **sandbox injection** at
`spiralearn/sandbox/orchestrate/index.mdx`, with registration deliberately
deferred to its Phase 2. **Ask which you are** — built-in, injection-only like
`debug-props`, or inheriting spellme's unstated status. ⚠ If you are ever
injected AND registered, `joinLensRoster` **throws** on the duplicate name;
spellme carries a standing obligation to remove its injection in the same commit
that registers it.

**5. Where this lens stops, so it does not grow into two others.** Two
boundaries are already ruled and you inherit both:

- **EXPLAINING WHY a tokenization failed is `spellme`'s** (human ruling
  2026-09-01), not yours. ⚠ **An earlier revision of this brief said "if the
  source does not lex, decline" — and that is now wrong**: you do not decline,
  because the elements are published. What stays spellme's is the
  **explanation**. Showing a prefix and where it ends is not explaining why it
  ended. ⚠ Spellme does not do its half yet — deferred pending exactly the
  embody change that has now landed, so **expect that lens to move under you.**
- **"The scanner's stopping point" is a third lens** (human ruling 2026-08-13).
  Stepping to the end of a sequence is not the same exercise as asking where the
  scanner stopped and why.

⛔ **DO NOT ASSERT A CLEAN SPLIT BETWEEN THOSE TWO — THIS IS NOW THE UNIT'S
SHARPEST QUESTION.** The 2026-09-01 ruling says in terms that it "narrows a
2026-08-13 ruling without overturning it … **The boundary between them is not
yet drawn and is the first thing the deferred unit has to settle.**" Nobody has
drawn it, and embody has since published the prefix naming "the
scanner's-stopping-point lens of the spellme family" as its reader.

**Three candidate lenses now overlap on one published account**: the stepper you
were asked for, the scanner's-stopping-point lens embody's consumer list names,
and spellme's own deferred failure-explanation work. **You may well BE the
second**, or the second may be a third exercise over the same prefix. ⚠ **Put it
to the human first and do not resolve it yourself** — a README that quietly
claims the stopping-point territory forecloses a lens the roster already names.

⚠ **One thing you do NOT change by existing — and an earlier revision of this
brief got it exactly backwards.** `spellme/README.md` § Edge cases —
specifically its sub-paragraph "The accepted cost, stated rather than absorbed",
one part of a section running some fifty lines — reads: "spellme is the only
lens declaring the `tokens` phase, and **every further lens of this family reads
the same published member** — so on this defect the phase empties however many
of them exist. **It is not a transient roster accident that a second lens would
fix.**" That document **already anticipated you** and denies in terms that a
second lens fixes the empty-phase problem, because you read the same optional
member and go unoffered for the same reason when it is absent altogether. The
earlier revision truncated that sentence at its first comma and told you to flag
the opposite. **Do not raise it.** The only true staleness is the sub-clause "is
the only lens" — a copy nit in `spellme`'s README, and not yours to edit
unasked.

## What to read, and in what order

1. `lenses/spellme/README.md` — the vocabulary, the three fates, the mark, the
   published member. **You inherit the VOCABULARY.** ⚠ **You do NOT inherit its
   gate** — see § PARTIAL TOKENIZATIONS: that gate accepts only a clean
   tokenization and declines exactly the case you exist to show.
1. `lib/scanning/DOCS.md` § what this module does not do — **required reading**,
   and the passage that decides question 2. It is the leaf's own voice on
   destinations.
1. `lib/scanning/README.md` — the derivation's own rules.
1. `lenses/spellme/DOCS.md` — the sketch's shape, and § Structural constraints
   for the two-layer split (pure core, one component file that knows React).
1. `lenses/spellme/ux/user-journeys.md` and `ux/wireframes.md` — what a `user`
   twin looks like when it is doing its job. **Both are canon there; checking
   one and generalizing is that module's twice-committed failure.**
1. `lenses/parsons/` and `lenses/writeme/` — the house component shape, the
   config-narrowing idiom, the scoped stylesheet.
1. `.planning-handoffs/spellme/PHASE-1.md` § Traps — every trap there applies to
   you, because you are in the same tree with the same tools.

## Phase 0, in order — three artifact-named steps, not seven numbered ones

- **0.1 README.md** — the domain model in prose, its bounded context, and the
  ubiquitous-language glossary **inside it**. What the learner does, what each
  region holds, the DOM contract, the edge cases.

  ⚠ **If the human defers question 2 to `AR-1`**, write the glossary with
  `spellme`'s three fate words marked **provisional** and say so in 0.1 — do not
  stall, and do not quietly adopt them as settled.

  ⚠ **The edge cases are an OPEN QUESTION, not a section to copy.** `spellme`'s
  § Edge cases runs ~50 lines and most of it concerns declining, claiming and
  the way past — **none of which you have.** What remains for a lens with no
  gate, no verdict and nothing to get wrong is undecided: an empty program, one
  that is only trivia, one that does not lex, and a single-element program are
  the candidates. Answering that IS part of 0.1.

- **0.2 the twin ask** — put `twin-doc` to the human. ⚠ **Ask; do not assume.**
  `spellme` is `twin-doc: user` and this lens is its close sibling, so `user` is
  plausible — but the answer is the human's and the default is `none` if no
  answer comes.
- **AR-1** — challenges the README and any twin owed.
- **0.3 `types.ts` + the DOCS.md architectural sketch (with a Mermaid
  `## Data flow`) + the tests, written for real and committed skipped.**
- **AR-2 — only if the level includes it. See below.**
- review, resolve, commit → **the human's Phase-0 gate.** Stop there.

⚠ **WHICH REVIEWS FIRE IS THE LEVEL'S ANSWER, NOT THIS BRIEF'S, and an earlier
revision of this brief got that wrong** — it mandated AR-1 and AR-2 outright
while also forbidding you to state `ceremony`, which is unresolvable as written.
`DEV.md` § ceremony: `full` → AR-1·2·3·4·5; **`medium`, the default** → **AR-1
and AR-5 only**; `light` → AR-5 only. **Silence runs at `medium`**, so AR-2 does
NOT fire unless the human raises the level — and "there is no 'add AR-2 this
increment' — a review is put back by raising the level, and an increment-scoped
raise applies to that increment alone, after which the campaign level resumes."
⚠ **That trailing clause is the mechanism by which the human CAN put AR-2 back
for this unit**, so ask for the level with your other asks. **Do not run AR-2 on
this brief's say-so.**

⚠ **AR-5 has no escape hatch.** "No value removes AR-5", and its trigger
includes "the last commit before a handoff, whichever comes first" — which a
Phase-0 gate plausibly is. `DEV.md`'s own Phase-0 chain does not draw it, so the
ambiguity is inherited rather than invented here. **Put it to the human with the
level**: does AR-5 fire at the Phase-0 gate?

## Two non-negotiables this brief must not let you skip

- **Enter plan mode** before any editing. `AGENTS.principal.md` invariant 3.
- **Run a Plan-agent design pass inside plan mode**, before exiting to request
  approval. Invariant 10, waivable only by the human. Your plan must list every
  workflow step explicitly and carry at least one **Mermaid** data-flow diagram
  (invariant 6) — "follow the governance file" is not a plan step.

## Ceremony and mechanics

State the kind of work and prospective/retrospective. **Never state `ceremony`**
— it is the human's. **Ask** for `twin-doc` and record `none` if no answer
comes. Record the answers in the **commit body**:

```text
work: software · twin-doc: <ask> · ceremony: <the human's> · prospective
```

Commit form — one shell invocation, pathspec-protected, because peers are live
in this worktree:

```sh
git add <explicit paths>
git diff --staged --name-only
git commit --no-verify -m "..." -- <the same paths>
```

The pathspec is the protection, not a clean index. Never push, branch, amend,
`git checkout -- <file>`, `git restore`, or `git stash`. **Announce every
commit: full SHA + message.** **Never pass a `model` parameter** to an `ar-N`.

## Traps that have already cost this family something

- **Capture gate output into shell variables and interpolate it into the commit
  body.** A count stated beside its own measurement has been wrong repeatedly
  here, including inside the commit correcting a different instance of it.
- **An absence claim that quotes the token it counts falsifies itself.** Pair
  every absence grep with a positive control, and say when you used `-E`.
- **Comments and prose WRAP, so single-line greps undercount.** The form that
  works over source: strip the comment markers, then `tr '\n' ' ' | tr -s ' '`.
  This trap fired four times in `spellme`'s wave 3.
- **Status prose in source goes false** (human ruling 2026-09-03, `spellme`).
  Comments state contracts and reasons; anything naming a wave, a phase or a
  not-yet lives in the campaign record. Measured there: every rotted comment was
  a status sentence, and no non-status comment rotted.
- **A `[measured:]` tag names a command run this session.** "the pattern" is not
  a command and is how a wrong number survives.
- **Record a ruling in the turn it is given.** Six rulings in `spellme`'s
  campaign had to be back-filled after a review went looking; four of those were
  caught by a reader rather than the author.
- **An `ar-N` verdict is itself a claim.** Several in `spellme`'s campaign were
  substantially wrong, two of them confidently. Re-measure before acting.
- **Node is v20.11.0 against engines `>=22.11.0`.** Both tools run. Proceed.

## What this lens is NOT

No claim, no gate, no verdicts, no score, no attempts, no way past, no
one-more-character question, no snippet-type control of its own, and **no
prediction of any kind**. If a design decision starts to need one of those, it
belongs to `spellme` or to a third lens — stop and put it to the human.
