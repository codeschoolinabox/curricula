<!-- cspell:ignore oneline noiw empts -->

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

It also contradicts the ratified lifecycle outright: `:57` **"## Lifecycle: four
phases"** and `:59` **"Realm is static data, not a runtime phase"** — the
ratified model is **six** flat phases
(`source → realm → tokens → ast → environment → evaluation`) and `realm` **is**
one.

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
