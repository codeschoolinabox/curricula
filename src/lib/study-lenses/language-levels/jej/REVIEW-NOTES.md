<!-- cspell:ignore oneline noiw empts Entwinement -->

# jej — review notes from the embody stream

> **To the agent building this level.** Transitional scaffolding, not a
> contract: delete this file when the items below are resolved. Written
> 2026-07-15 by the parallel **embody** session — the author of your brief
> (`.planning-handoffs/study-lenses-jej-level.md`). A cold-validation of that
> brief, run after you had already started, surfaced four things you need. **Two
> of them are errors in MY brief, not in your work.** Every claim below was
> verified against the tree at `6ef5458`; the commands are included so you can
> re-check rather than trust me.
>
> **I have not touched your files.** Your untracked `README.md` is your work and
> I have left it exactly as it is.

## 1. My brief's "`jej/` does not exist" is FALSE — and it is dangerous

The brief says `jej/` does not exist (twice: § "This is a NEW module", and again
in § Git policy's "a directory that does not exist yet"), and step **0.2** says
**"Write `jej/README.md`"**.

`jej/README.md` **exists**, is **141 lines**, and is **untracked — in no commit
and no stash**:

```bash
git log --all --oneline -- src/lib/study-lenses/language-levels/jej/README.md   # → empty
git stash list                                                                   # → empty
git status --porcelain -- src/lib/study-lenses/language-levels/jej/README.md     # → ?? …
```

**A literal `Write` to that path destroys work git cannot restore.** Ignore
those two lines of the brief. Step 0.2 for you is **"review and revise the
existing `README.md`"**, not "write" it.

**And my § Git policy makes it worse, so read that section with this
correction:** it tells you to distinguish foreign churn **"by path"** — but
`jej/` **is** your path, so that heuristic would classify anything here as
yours. It is only safe against _other_ directories. Inside `jej/`, check
`git log`/`git status` per file before writing, not the path prefix.

## 2. The notional-machine content is committed — against the brief's own rulings

`6ef5458` copied `notional-machine.md` and `notional-machine.svg` into `jej/`,
byte-identical to the quarry:

```bash
diff -q src/lib/study-lenses/language-levels/jej/notional-machine.md \
        src/lib/embody/language-levels/just-enough-javascript/notional-machine.md   # → identical
```

Two ratified rulings (maintainer, 2026-07-15) say this should not have landed
as-is:

- **`docs.notionalMachine` is DEFERRED** — ship `docs.reference` only. The NM
  rewrite is its own later deliverable.
- **Migrated content counts as new writing** — it must pass the banned-term grep
  **regardless of where it came from. There is no migration exemption.**

**Committed greenfield HEAD now carries banned vocabulary — 14 hits:**

```bash
grep -noiwE "isJeJ|creation" src/lib/study-lenses/language-levels/jej/notional-machine.md
# creation ×13 (incl. :175 "during creation phase" — the banned creation-as-phase)
# isJeJ    ×1  (:572 "`validation.isJeJ` is `false`" — a dead API)
```

It also contradicts the ratified lifecycle: `:57` **"## Lifecycle: four
phases"** — the lifecycle is **five** flat phases
(`source → tokens → ast → environment → evaluation`), and the doc's four are not
those four.

> ⚠️ **CORRECTION (2026-07-15) — I was wrong about one of these, and you caught
> it.** I originally listed `:59` **"Realm is static data, not a runtime
> phase"** as a defect, on the grounds that the ratified model made `realm` a
> phase. **The maintainer has since removed the realm phase — so `:59` was RIGHT
> all along, and the ratification was wrong.** Your reading (_"the old prose was
> right… keep that claim; it is no longer a defect"_) is correct and mine was
> not. The NM doc is **vindicated** on realm. `creation` ×9 and `isJeJ` remain
> real defects.

**This is yours to resolve with the maintainer, not to silently keep.** The
options are: back it out of `jej/` until the NM deliverable runs · conform its
vocabulary now (that is ~800 lines of learner-facing pedagogy rewriting — the
reason it was deferred) · or get an explicit exception recorded. Whichever you
choose, say so in your plan. Note the `.svg` rides along with it, which also
pre-empts my brief's **OQ-3** (the svg has no slot in
`LevelDocs {reference, notionalMachine}`).

## 3. My "`reference.md` is verified clean" was overstated — and it bites OQ-1

My brief says `reference.md` is _"verified clean (0 banned terms)"_ and then
names it the authorized source for your README's "on what notional machine"
sentence. **"Clean" was true for the banned-term grep ONLY.** I audited
`notional-machine.md` against the ratified model in detail and never gave
`reference.md` the same pass. It fails a different check — and you have already
found the right answer:

```text
jej/reference.md:216  (COMMITTED)  "Your programs run as strict mode scripts. The
                                    learning environment automatically adds
                                    `"use strict"` at the top of your code…"

jej/README.md:35      (yours)      "JEJ programs are **modules**, so they are
                                    strict-mode JavaScript natively — no prologue
                                    is injected and no line shifts."
```

A flat contradiction inside this one directory, at HEAD. **This IS my brief's
OQ-1** (`snippetTypes`: module vs script), which I told you was _"genuinely
unknown — do not assume `['module']`"_.

Your README's module posture looks right to me: it matches the committed
`SnippetType` default (`'module'`) and it dissolves the `with`-easter-egg
scriptMode fallback cleanly. But **`reference.md` is learner-facing and now says
the opposite at HEAD**, and the injected-`"use strict"`-prologue it describes
has no stage in the ratified model (acorn is the run ceiling; enforcement is
orchestrator-side). Take both to `ar-1` and the maintainer together — OQ-1
cannot be settled from `reference.md`, because `reference.md` is one of the
things in conflict.

## 4. My test-shard arithmetic contradicts my own DO-NOT-MIGRATE table

The brief's shard reads `validate` (**19 + 23**) and totals **"286 total, 280
excluding `is-jej`"**. The `23` is `validate.test.ts`, whose only import is
`validate.js` — the module my own quarry table marks **"DO NOT MIGRATE —
dead"**. Porting tests for a module you are not migrating violates the rule
stated in that same paragraph.

```bash
npx vitest run --project unit src/lib/embody/lib/validating/
# validate-program.test.ts 19 · validate.test.ts 23 · … 286 total
```

**Corrected:** the shard is `validate-program` (**19**). The migrating budget is
**257** (286 − 6 `is-jej` − 23 `validate.ts`), not 280. If any of
`validate.test.ts`'s 23 cases assert behavior worth keeping, name them and say
which increment adopts them; otherwise they die with `validate.ts`.

_(The 286 itself is good — it came from a run. An earlier draft said 245 from a
static `it(` grep, which misses tests generated inside `for` loops. Count by
running.)_

## What is NOT changed

Everything else in the brief stands: the parse-facts inversion, the
`severity`-is-ratified ruling and its provenance, the `editorSupport` deferral,
the quarry map, the Phase-0 ceremony and its human gate, and the remaining open
questions. The `src/lib/embody/` -vs- `src/lib/study-lenses/embody/` -vs- "the
embody stream" naming hazard is real — I am the third of those.

## 5. 🔴 The `realm` PHASE is being removed — your realm TABLE is NOT

**Maintainer ruling, 2026-07-15, after your work started.** The lifecycle loses
`realm`. The reasoning is about _lensing_, not about the concept: every other
phase's content is a function of the learner's source, and **the realm is the
same world for every program forever** — so a realm lens would render
identically every settle. That is a reference, not a lens. (The committed
contracts had been whispering it: `realm` is the only phase with **no fact
stage** and the only one that can never be barred, and the spine's own doc says
_"a realm model needs no program at all."_)

**Read this before you touch anything:** your realm table **survives, unchanged
in purpose.** Your `types.ts` says it best — _"the level's one authored account
of its world… `admittedGlobals` is derived, never authored"_ — and **that is
exactly why it lives**: its consumer is **`validate`** (via `admittedGlobals`)
and **`docs.reference`**, never a lifecycle lens. The phase is dying; the table
is not. The maintainer's words for where realm content belongs — _"learners can
just have a reference of what's available"_ — describe your table.

**What this actually costs you:** likely nothing structural. Re-read any prose
that frames the realm as a _lifecycle phase_ or promises a realm _lens_ (your
`DOCS.md` and `README.md` carry the heaviest realm language — check them against
the new model), and keep everything that frames it as the level's authored
world. **If you find the table load-bearing in a way this ruling breaks, STOP
and say so** — you know that design better than I do, and I would rather be
corrected than have you quietly delete the source your allowlist derives from.

## 6. 🔴 STOP — two corrections, and one may delete work you are about to do

**Both are MY errors, not yours. Read before porting anything.**

### 6a. The `link` phase is DEAD — I told you it was coming, and it is not

An earlier version of this file said a **`link` phase** was coming. **The
maintainer considered and REJECTED it (2026-07-15).** True when written, false
now — and you propagated it in good faith into
`.planning-handoffs/study-lenses-jej-notional-machine.md:52` (_"A `link` phase
IS coming — and it is NOT yours"_). **I have corrected that file.** No action
from you beyond not re-adding it.

_Why rejected, so nobody revives it:_ link's data is a **filter of
environment**, not a new fact — `defs[0].type === 'ImportBinding'` sorts imports
from locals in the same analysis, and the specifier rides the same def. The
genuinely link-shaped content (_did it resolve? what's the graph? cycles?_) is
exactly what embody **cannot see** from one `code: string`. And the record
already maps **`environment` = `Link()` for modules**, so splitting them
subdivides one spec operation into two peers.

**Final lifecycle — FIVE flat phases, identical for scripts and modules:**
`source → tokens → ast → environment → evaluation`.

### 6b. "Levels stop deriving" — PAUSE before porting the validator

**Maintainer direction, 2026-07-15 — a strong lean, not yet final, which is
exactly why you should not spend the effort yet.** The rule taking shape:

> **embody states what is TRUE about the program; levels decide what is
> ALLOWED.** Facts save consumers complex traversals for **common, generic
> program analytics**; anything niche, a consumer does itself. Entwinement is
> free because facts are objects/arrays **indexing into** pre-existing entwined
> objects.

Embody is gaining a **full-ECMAScript entwined environment fact** (via
`eslint-scope` — verified: it consumes acorn's AST directly and shares **node
identity** with it). If that lands, **most of the validator you are about to
port evaporates.** Verified against the quarry:

| Quarry file                               | Lines    | Fate under "levels stop deriving"                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scope/build-scope.ts` + `scope/types.ts` | 401 + 87 | **DIES.** Embody's environment fact covers it and strictly more: 11 scope kinds vs your 3; `var`/functions/classes/catch; and **references with positions**, where yours collapses to `readCount`/`writeCount` and discards them. Verified: eslint models even your "the initializer is not a write" rule natively, as `Reference.init`. |
| `check-undeclared-globals.ts`             | 475      | **Mostly dies.** `globalScope.through` states "resolves to nothing" as a level-blind fact; your part becomes a **set-membership test** against the level's world. Verified end-to-end.                                                                                                                                                   |
| `collect-violations.ts`                   | 128      | The **walk** likely dies (a generic node index is exactly "common, generic analytics"); the policy application stays, and is small.                                                                                                                                                                                                      |
| `validate-program.ts`                     | 123      | **Dies** — no parse, no walk.                                                                                                                                                                                                                                                                                                            |
| `just-enough-js.ts`                       | 599      | **SURVIVES — this IS the level.** The allowlist, operator sets, blocked members, the world. Policy, which no fact can supply.                                                                                                                                                                                                            |

**Roughly half of the ~2,230 lines you were sizing evaporate, and what remains
is mostly allowlist DATA.** That is not a smaller port — it is a **different
deliverable**.

**What to do: do NOT port `build-scope.ts`, `check-undeclared-globals.ts`,
`validate-program.ts`, or `collect-violations.ts` until the maintainer rules.**
Your Phase-0 (glossary, README, DOCS, types) is still good work — the level's
_policy_ is unchanged and `just-enough-js.ts` is still the heart. **If your
current Phase-0 commits you to a derivation architecture, say so at your 0.7
gate rather than building it.**

**One genuinely undecided thing that lands on YOUR file:** if levels stop
deriving, `validate(facts: ParseFacts)` needs scope — and
`ParseFacts = {tokens, comments, ast}` has no slot. **Does `ParseFacts` gain
entwined facts?** That is a **level-spine amendment**, in the file you own, and
it is the **first real intersection between our streams** (my earlier "we do not
intersect" was true then and is now wrong). **Take it to the maintainer; do not
settle it alone.** Honest caveat: `ParseFacts` buys "no type edge into embody"
by _mirroring_ — cheap for three fields, expensive for a whole entwined graph.
At some point the mirror **is** the thing. That question is now live.

## The embody stream does not intersect you — you are autonomous

**Ignore the embody stream. Do not wait on me, and do not route anything through
me.** The maintainer's call, and the tree agrees: there is **no type edge** in
either direction — `embody/types.ts` and `language-levels/types.ts` both import
only acorn, and `SnippetType` is deliberately _mirrored, not imported_ ("no type
edge runs from levels into embody"). Embody is level-blind by construction, and
it will not touch `jej/`.

The brief told you to route two open questions through the maintainer because
they collided with my stream. **That is now out of date:**

- **OQ-6 — RESOLVED, by you.** Your `SourceRange` change (acorn `Position` →
  character offsets) dissolves it: offsets are carried unconditionally, so
  nobody needs `locations: true`, and my `StageCause` never did — it reads
  acorn's error `.pos`/`.loc`. **There is no collision left.** One caveat that
  is governance, not coordination: `language-levels/types.ts` is a **committed
  contract**, so that change needs the maintainer's approval at your 0.7 gate —
  flag it there. (It looks right to me, for whatever an adjacent stream's
  opinion is worth.)
- **OQ-2b — not a blocker; decide it yourself.** Embody needs a _bespoke_ walk
  regardless (it builds the `EntwinedNode` wrapper graph and `byOffset`, which
  `getChildNodes` alone cannot give), so it uses `build-node-path-map` /
  `get-child-nodes` as **reference, not as a dependency**. Worst case we each
  carry our own traversal until `lib/parse` (P3a) absorbs both — duplication,
  not incoherence. Vendor what you need.

Everything else here still stands. This file is transitional scaffolding:
**delete it once items 1–4 are resolved.**
