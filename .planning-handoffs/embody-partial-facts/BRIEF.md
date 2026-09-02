# embody partial facts — Phase 0 launch prompt

You are running **Phase 0 (DDD only)** for a possible reshape of `embody`'s
failed-stage contract, in
`/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula`.

**This unit designs. It does not implement.** Phase 0 closes at the human gate;
Phase 1 is a separate session.

> Written 2026-08-27 by the wave-3 `spellme` orchestrator at a clean committed
> boundary, then **context-free validated**, which returned five must-fixes
> against the first draft — including a twin this brief had declared absent, a
> stage count that was wrong, and a framing that quietly foreclosed the most
> likely answer. All five are applied. `AGENTS.principal.md` § Handoff agency
> requires a fresh session for this: _"A Phase-0/DDD unit surfacing
> mid-execution goes to a fresh session unconditionally: the author of the
> current shape is structurally anchored to it."_

## First act — governance

Read the repo-root `CLAUDE.md`. It is a **router**: check your own model id
against its qualifying list and read whichever of `AGENTS.md` /
`AGENTS.principal.md` it selects, **END TO END**. `fable` is on that list.

Then `DEV.md` §§ **Phase 0: Documentation Specification**, **Adversarial Review
Protocol** (AR-1 and AR-2's Trigger and _Provide to agent_ lines), **twin-doc**,
**Directory Documentation Convention**, **Work routing and ceremony**, **Sourced
claims**, **Ruling provenance**, and **Shared-worktree git mechanics**.

⚠ **Directory Documentation Convention is on that list for a reason and was
missing from it until 2026-09-01.** It holds the twin naming table, the `ux/`
menu, the size threshold that can make a `data` twin not owed, and the
machine/data tie-break this unit is the ruled case for. Reading the twin
instructions below without it is how the twin step lands wrong.

⚠ **Both `AGENTS` files are stale on one point, and `DEV.md` governs.** They say
the agent records `none` if no answer comes and that 0.2 "produces no file" at
`twin-doc: none`. True in general, **false for this module**: a twin already
exists here, so silence leaves `machine` standing and `none` must not be
recorded. `DEV.md` § Phase 0 is the governing statement on conflict, and it says
so itself.

⚠ **This is a RESHAPE, not a new module.** `DEV.md` § Phase 0 bites "where a
module, a contract, or a region is being established **or reshaped**". All three
steps fire — but 0.1 and 0.3 **amend existing artifacts**. Do not write a second
set.

## What `embody` is, in one paragraph

`embody(source, options)` is the fact-derivation factory: it derives six tagged
fact stages from a snippet, maps each of the five lifecycle phases'
accessibility, gates a lens roster over the facts, and returns one frozen
`Embodiment` of `{ facts, study }` [read: `embody/index.ts`]. Stages are tagged
unions — `FactStage<Value>` is `StageSuccess<Value> | StageFailure` — so a
failure is **data, never a throw**. Consumers narrow on `.ok`.

## The question, framed as it actually stands

**When a stage fails, it publishes only why it stopped. Should it also publish
what it managed to derive?**

```ts
/** A stage that failed — as data, never a throw. */
export type StageFailure = {
	readonly ok: false;
	readonly cause: StageCause;
};
```

[read: `embody/types.ts`]

⛔ **Before designing anything, answer this — the first draft of this brief got
it wrong and would have sent you straight past it.** A failed stage is **not
silent today**. `StageCause` already carries `stage`, `message`, `offset` and
`position`, and its own doc says it _"keeps the parser's voice — learner-worded
explanation is lens work"_ [read: `embody/types.ts`]. So:

**Does anything actually need new facts, or is the existing cause already enough
for the lens that owns this?**

That is a real fork, not a formality, because the lens that owns this is **named
and unbuilt**. `spellme`'s own § Edge cases routes a non-lexing program away
from itself, in full:

> **A program that does not lex** — the lens is not offered. Explaining the
> reader's own error is the **error-interpreting lens**, which the package
> roster already names across both parse phases; it belongs to the package, not
> to this lens's family.

[read: `lenses/spellme/README.md` § Edge cases]. `lenses/README.md` says that
lens "speaks the parser's voice across both parse phases" and rosters it for
both — and **no directory for it exists under `lenses/`** [verify this
yourself]. An error-interpreting lens rendering `StageCause` needs **no change
to embody at all**. If that lens is what the human wants, this unit's answer may
be "nothing to build here", and that is a legitimate Phase-0 outcome.

**What motivated the question** [relayed: the human, 2026-08-27, during
`spellme` wave 3 — there is no in-repo record of it beyond this brief and
`../spellme/PHASE-1.md` § Deferred]: that a tokens lens ought to help a learner
understand what broke _at_ the tokens stage. The repo already half-agrees — the
tokens phase is **always accessible**, precisely so a stage's own error renders
inside it [read: `embody/derive-accessibility.ts` — _"`source` and `tokens` are
always accessible … A phase's own-stage error never bars it — it renders inside
the phase"_].

**A second candidate consumer, and it is a different lens again:** `spellme`'s §
Future direction names "**the scanner's stopping point**" among further games,
each its own lens by standing ruling (human ruling 2026-08-13). That one
plausibly _would_ want a token prefix. **Establishing which consumer this serves
is upstream of every other decision here**, because it decides whether a prefix
is needed at all.

## ⚠ The twins — this module HAS one, may be owed three, and one of them is the document most at risk

> **Changed 2026-09-01, after this brief was written.** `twin-doc` gained a
> third software value, `data`, and the quantifier `both` was retired in favour
> of `+` lists in the canonical order `machine + user + data` (`DEV.md` §
> twin-doc, § Directory Documentation Convention; commits `805089f3`,
> `7d246612`, `4c17dcf7`). Three consequences for this unit, all below: 0.2's
> ask is no longer a yes/no about one document; AR-1 must be handed every twin
> the recorded value names; and **`embody` is the designated first instance of
> the `data` twin** — that designation is written into `DEV.md`, and the human's
> stated intent when making it was to use this campaign to write **all** twins
> for one module. That is intent, not a recorded answer: `DEV.md` § Phase 0 says
> the answer is re-asked, not remembered, across a session boundary. **Put the
> ask.**

**The machine twin exists.** `embody/notional-machine.md` and `embody/README.md`
calls it **"the machine twin"** twice [read: `README.md` lines 327 and 477,
re-measured 2026-09-01; the 287/415 recorded earlier were the wrong lines],
matching `DEV.md`'s definition of the `machine` value — "a notional-machine
document, `.md` beside the README".

Consequences, all binding:

- **AR-1 challenges the README _and every twin the recorded value names_,
  together.** Handing it the README alone, or a subset of the twins, gives it a
  fraction of its inputs [read: `DEV.md` § AR-1 _Provide to agent_].
- 0.2's ask is **confirmed, not defaulted, and it now resolves per value** —
  `DEV.md` § Phase 0: silence leaves standing exactly the values whose documents
  are present. `machine` is present, so silence leaves `machine` standing and
  you do **not** record `none`. Silence does **not** add `data` or `user`; only
  an answer does.
- **A recorded value naming a document that is not in the tree is a defect AR-1
  reports**, not a silence case. So if the answer comes back
  `machine + user + data`, all three documents exist before `ar-1` spawns, or
  the review is reviewing a value the tree does not honour.
- **`embody` has no `ux/` directory** [measured 2026-09-01: `git ls-files
  src/lib/study-lenses/embody/ | grep '/ux/'` → no matches. The unfiltered glob
  returns **32** files, so do not eyeball it — an earlier draft of this bullet
  recorded a hand-picked four as that command's output, which is fabricated
  evidence and was caught by a context-free validator].
- **The `user` twin is a DIRECTORY with a menu, not a document.** `DEV.md` §
  Directory Documentation Convention: `ux/` beside the README, holding "a
  **menu, not a fixture**… **nothing on it is required**" — personas, user
  journeys, wireframes, user stories, story sequencing, each owed by a different
  risk. One file named `ux.md` is the wrong artifact and AR-1 will say so. Copy
  the shape from the tree: `git ls-files | grep '/ux/'` finds `spellme/ux/`
  (journeys + wireframes) and `orchestrate/ux/` (personas + journeys +
  wireframes).
- **The `data` twin has a threshold, and it may say no file is owed.** Same
  section: "**Below that size the README section is right and this row is not
  owed.** The threshold is a judgement and no number is pinned; the machine
  twins' floor of 116 lines is the usable marker, against a section case of 33."
  Scale on this module [measured 2026-09-01: `wc -l`]: `notional-machine.md`
  202, `README.md` 482. **Evaluate the threshold before writing a file** — a
  `## Data model` section in the README is a legitimate outcome of a `data`
  answer, and this brief's earlier draft asserted otherwise.
- **The document, where one is owed, is named `data-model.md`**, beside the
  README. No instance exists anywhere to copy [measured 2026-09-01: `git
  ls-files | grep -c data-model` → 0].
- **A late answer re-opens 0.2 rather than being absorbed.** `DEV.md` § Phase 0:
  an answer arriving after `ar-1` spawns means produce the twin and **re-run
  AR-1 before 0.3 closes**.
- **The machine/data split is ruled, and this module is the case it was ruled
  on.** `DEV.md` § Directory Documentation Convention: where the module _is_ the
  machine, "whose data is it" does not decide, and the tie-break is what a
  reader needs the shape for — to predict what the machine will do (machine
  twin) or to hold the value correctly once received (data twin), **even though
  this module produced it**. The worked example in that ruling is this module's
  own published sequence. Read it before splitting a paragraph between the two.
- ⛔ **That twin models the scanner in full**, in sections titled
  `## The scanner — the lexical phase, modeled in full` and
  `### The scanner's turn — asked, then read`. **A partial-tokenization contract
  changes what the scanner is modeled as doing when it stops.** It is the single
  document this unit is most likely to invalidate, and the first draft of this
  brief did not know it existed.

## Measured state — re-measure everything

`node scripts/repo-facts.mjs`, 2026-08-27, **abridged** (the `(via …)`
provenance lines are dropped; re-run it yourself):

```text
MEASURED AT 2026-08-27T21:33:00.542Z, not asserted — supersedes any memory or handoff claim about these numbers.
node version vs engines: v20.11.0 vs engines ">=22.11.0" — BELOW the engines minimum
tsc errors: <RE-MEASURE — the recorded 0 is stale; 13 on 2026-09-02, all foreign, in aithor/* and study-lenses/lib/local-llm/*>
markdownlint errors (repo-wide): 8113
HEAD: 08dd99f922e862b6b6a13b6cc0b995ab6326eb0d
```

⚠ The markdownlint field **caches for 24 hours** and was stamped ~1h before the
rest. Re-run `npm run lint:md` if it matters. ⚠ Node is **below** the engines
minimum; `tsc` and `vitest` run anyway. Proceed; upgrade nothing.

| Fact         | Value                                                                              |
| ------------ | ---------------------------------------------------------------------------------- |
| embody suite | `Test Files 12 passed (12)` · `Tests 496 passed (496)`                             |
| acorn        | **8.16.0**; **`acorn-loose` NOT installed**                                        |
| eslint-scope | `^8.4.0`                                                                           |
| blast radius | **17** non-test non-deprecated files read a stage's `.ok` — a **floor**, see below |

**HEAD moves within minutes**; peers commit constantly and the tree carries
foreign dirty files. Commit by explicit pathspec; never unstage a peer's files.

## The scoping — derived and independently confirmed

Two of the three claims below were **empirically re-verified by the context-free
validator with a live acorn probe**, not merely read. Verify anything you intend
to lean on; the enumeration itself was wrong once already.

### There are FOUR failable stages, not three

```ts
export type FailableStageName = 'tokens' | 'ast' | 'entwined' | 'environment';
```

[read: `embody/types.ts`]. `entwined` sits between `ast` and `environment` and
is failable in its own right. Treat it with `environment` below.

### 1. `tokens` — genuinely incremental, and the cheap one

`tokenizer()` yields one token at a time, so **the prefix exists when it
throws**; `Array.from` is what discards it [read: `embody/derive-tokens.ts`].
Confirmed empirically: a hand-rolled `for…of` drain keeps a **13-token prefix**
before the throw, while `Array.from` throws with the binding never assigned
[relayed: the context-free validator's live acorn 8.16.0 probe, 2026-08-27]. The
stopping point is already captured — `StageCause`'s `offset`, documented
"directly sliceable".

⚠⚠ **That line carries a compile footgun no test in this repo can see** — its
own comment is the warning [read: `embody/derive-tokens.ts`]: the spread form
compiles under Docusaurus/Babel loose mode to `[].concat(x)`, which **wraps**
the iterator instead of draining it, so the stage reports `ok` for source that
does not lex. _"No test in this repo's harness can see it … only the bundled
site does."_ ⚠ **This is asserted by that comment and has not been re-measured**
— whatever replaces `Array.from` must be checked against a real Docusaurus
build.

### 2. `ast` — not incremental, and a bigger surface than it looks

`parse()` produces **no partial tree**: its `SyntaxError` carries only `pos`,
`loc`, `raisedAt` — no `Program` is reachable on it [relayed: the validator's
live probe]. `acorn-loose` is the purpose-built answer; the human **approved
adding it** (human ruling 2026-08-27, recorded at
[`../spellme/PHASE-1.md`](../spellme/PHASE-1.md) § Deferred).

⚠ **This stage is NOT `FactStage<Program>`.** It returns:

```ts
export type AstDerivation = {
	readonly ast: FactStage<Program>;
	readonly parenSpansByNode: ParenSpansByNode;
};
```

[read: `embody/types.ts`]. It parses with **`preserveParens: true`** and then
folds the grouping parens out in place, publishing where they sat as the
derivation's second half [read: `embody/derive-ast.ts`]. There is a whole
paren-truth campaign behind that surface. **An `acorn-loose` design must also
rule what `parenSpansByNode` publishes over an invented tree.**

⛔ **The dependency is approved. The pedagogy is NOT.** Loose parsing **invents
nodes** — dummy identifiers where the source has nothing. This package's claim
is that it shows the machine's own account. Publishing a tree the language never
produced is a **curriculum contract decision**. Frame it; do not settle it.

### 3. `entwined` and `environment` — downstream of `ast`, but NOT failure-free

Corrected 2026-09-01; the earlier text was wrong and its citation covered only
the half that was true. Both short-circuit upstream, and `eslint-scope`'s
`analyze()` needs a complete `Program` [read: `embody/derive-environment.ts`].
But **each originates its own cause**, and `types.ts` says so: "`entwined` and
`environment` fail only as guarded embody defects, reported loudly. **Each may
originate a `StageCause`**" [read: `embody/types.ts`]. `derive-entwined.ts` has
**no `try` block at all** [measured 2026-09-01: `grep -c '\btry\b'` → 0 in
`derive-entwined.ts`, 1 in `derive-environment.ts`]; what it has is a
span-invariant guard originating `stage: 'entwined'` directly [measured
2026-09-01: `git grep -n "stage: 'entwined'" -- src/lib/study-lenses/embody/` →
one non-test hit].

Their partialness is still **downstream of `ast`'s**, so deciding `ast` decides
the shape. It does not follow that they cost nothing to design — a stage that
originates its own cause has a failure mode of its own, and "at no extra design
cost" was the sentence that would have had you skip it.

### 4. Short-circuit sites — there are several, and §3 is not all of them

`deriveAst` gates on `!tokens.ok`; `deriveEntwined` on `!tokens.ok` **and**
`!ast.ok`; `deriveEnvironment` on `!ast.ok` and `!entwined.ok`; and
`deriveAccessibility` bars `ast` on `!facts.tokens.ok` and both trailing phases
on `!facts.entwined.ok`. **A partially-successful stage makes `ok: false` an
inadequate discriminator at every one of them** — those rules need
**re-examining**, not extending. Find them all with
`git grep -n "\.ok" -- src/lib/study-lenses/embody/`.

### The blast radius is a floor

**17** non-test, non-deprecated files read a stage's `.ok` [measured 2026-08-27
with `git grep -ln '\.ok' -- 'src/**/*.ts' 'src/**/*.tsx' | grep -v '/tests/' |
grep -v '^src/lib/embody/'` — "non-deprecated" means excluding
`src/lib/embody/`, the legacy JEJ tree, whose path differs from the target
module only by prefix; without that exclusion it is 25; **re-run it**, it
moves]. Heaviest: `orchestrate/lib/validating/assemble-parse-facts.ts` (4),
`lib/questioning/quizzing/quizzing-questioner.ts` (4), then
`derive-accessibility.ts` and `lenses/spellme/core.ts` (3 each). ⚠ **A `.ok`
grep cannot see destructured narrowing** (`const { ok } = stage`), so the true
count is at least this.

**Prefer a shape where `ok: false` keeps meaning "no value to rely on"** over
one that silently changes what 17 compiling call sites mean. Whether that is
achievable is a design question — but "everything still compiles while its
meaning shifted" is the failure mode to design against.

## What the human must rule on — put these, do not answer them

1. **Which consumer does this serve?** The error-interpreting lens — named on
   the package roster, unbuilt — which may need **nothing** new; or the
   scanner's stopping point, which wants a prefix. This is upstream of
   everything else.
2. **Is an invented AST admissible in this curriculum?** The `acorn-loose`
   question. The `ast`/`entwined`/`environment` half hangs on it.
3. **Does a partial stage stay `ok: false`, or become a third state?**
4. **What does a partial `tokens` publish — the token prefix only, or input
   elements too?** `deriveInputElements` runs over a complete tokenization and
   its precondition is closed "by construction" by that. Tiling a prefix is a
   `lib/scanning` contract question, possibly its own unit.
5. **`twin-doc`** — put the ask; `machine` is confirmed by the tree, and `data`
   and `user` are open. The human's designation of this module as the first
   `data` instance is recorded in `DEV.md`, but the answer is re-asked, not
   remembered (see above).
6. **`ceremony`** — the human's alone. Never state it; ask if unset.

## Out of scope

- **Implementation.** Phase 0 closes at the human gate.
- **Building any lens.** This unit publishes facts.
- **`spellme`.** Its wave 3 is in flight in another session [relayed: this
  brief's author]. Do not touch `src/lib/study-lenses/lenses/spellme/`.
- **The evaluators.** ⚠ It was suggested they already publish partial data by
  default. A case-insensitive search over all 46 tracked `.ts` files under
  `evaluators/` finds only `Partial<T>` TS-utility uses [relayed: the validator,
  who also noted the original glob under-covered by one file]. **Treat the
  premise as unconfirmed**; if they do it well, copy their shape.

## Ceremony

```text
work: software · twin-doc: <the ask's answer — `machine` alone, or any `+` list in the canonical order `machine + user + data`> · ceremony: <the human's — never state it> · prospective
```

- **AR-1** after 0.1 and 0.2's ask, before `types.ts` locks — **over the README
  AND every twin the value names**. **AR-2** after the `DOCS.md` sketch, inside
  0.3. Invoke `ar-1` / `ar-2` **by name**; **never pass a `model` parameter**.
- `ar-2` and `ar-5` **inherit the session model**, so a Fable session gets them
  at Fable's tier — the reason this unit runs on the strongest tier.

### Paste this into EVERY `ar-N` prompt, verbatim

> ⛔ You are strictly read-only. **Forbidden by name:** `git stash` (and stash
> pop/push/apply/drop), `git checkout`, `git restore`, `git reset`, `git clean`,
> `git add`, `git commit`, `git push`, `git rebase`, `git merge`,
> `git cherry-pick`, `rm`, `mv`, `sed -i`, `perl -i`, `npx prettier --write`,
> `npx eslint --fix`. Named explicitly because a general "read-only" instruction
> demonstrably does not reach `git stash`: an `ar-4` carrying exactly that
> instruction once ran `git stash`/`stash pop` and **destroyed a peer session's
> staged index** [relayed: `../spellme/PHASE-1.md`]. Peers hold files staged in
> this shared worktree right now. **Allow-list:** `Read`;
> `git log/show/diff/status/grep/rev-parse/ls-files/ls-tree`; `grep`, `sed -n`,
> `awk`, `perl -0777 -ne` (print only), `wc`, `ls`, `cat`, `head`, `tail`, `od`,
> `diff`; `npx vitest run`, `npx tsc --noEmit`, `npx eslint <file>` (no
> `--fix`), `npx prettier --check`, `npx markdownlint-cli2 --no-globs`.

## Commit form — one shell invocation, explicit pathspec

```text
git add <explicit paths>
git diff --staged --name-only
git commit --no-verify -m "..." -- <the same paths>
```

**The pathspec is the protection, not a clean index.** A pathspec-less commit is
denied by `.claude/hooks/governance-guard.py`. Never push, branch, amend,
`git checkout -- <file>`, `git restore`, or `git stash`. On `index.lock`
contention, wait and retry. **Announce every commit: full SHA + message.**

**Per-file checkpoints:** `.ts`/`.tsx` → `npx eslint <file>`; `.md` →
`npx markdownlint-cli2 --no-globs "<file>"`; plus
`npx prettier --write -- <your own paths>` **before** grepping your own
citations — scope it, the worktree is shared and a bare `--write` reflows a
peer's drifted docs — and `npx tsc --noEmit` at its measured baseline. ⚠
**eslint is vacuous on `.css` and `.mdx`** — it exits 0 while reporting the file
ignored. Never `eslint --fix`; never eslint a `.md`. ⛔ **cspell is RETIRED** —
uninstalled and unwired at `9baca1e7` (2026-08-29), two days after this brief
was first written [measured 2026-09-01: `grep -c cspell package.json` → 0]. Its
absence is **not** breakage; four agents have now read it as such. `npx cspell`
still resolves, to a stray out-of-repo v5 with no repo config, so it exits clean
and tells you nothing. Do not run it and do not restore it.

## Traps carried in from the campaign that found this

- **`(human ruling …)` wraps under prettier and returns ZERO to a single-line
  grep.** Citation at the very start of its line, verified **after**
  `prettier --write`, with three instruments: `grep -c`, the collapsed
  `tr '\n' ' ' | tr -s ' ' | grep -o … | wc -l`, and `git grep -c`. ⚠ They do
  **not** always agree — a parenthetical wrapped mid-phrase is invisible to both
  line-counting forms, and that disagreement is informative.
- **A count stated beside the measurement that contradicts it** — reproduced
  **three times in one session** by this brief's author, each time inside the
  commit whose own gate block printed the right number. Re-measure in the turn
  you write the body. Re-reading your own body never caught it; the reviewer
  that raised the finding always did.
- **An absence claim that QUOTES the token it counts falsifies itself.** Pair
  with a positive control; state when a grep used `-E`.
- **A glob can under-cover silently** — `evaluators/**/*.ts` reached 45 files
  where the plain path reached 46, missing `evaluators/types.ts`.
- **`curl` cannot check a Docusaurus dev page.** Every path, valid or not,
  returns the same client-rendered shell with **HTTP 200** [measured 2026-08-27
  by this brief's author against a running server; the validator could not
  reproduce it, having started none].
- **Sweep over `git ls-files`**, never a remembered list or directory.
- Plus every trap in [`../spellme/PHASE-1.md`](../spellme/PHASE-1.md) § Traps.

## Deliverables, and what DONE looks like

1. **0.1** — `embody/README.md` amended: what a failed stage publishes, in the
   domain's own words, with the ubiquitous language for it (is a partial
   tokenization a "prefix"? a "reading"? the vocabulary is part of the design).
2. **0.2** — the twin ask, put and recorded; `machine` confirmed by the tree,
   `data` and `user` open. **If the design changes what the scanner is modeled
   as doing, `notional-machine.md` is amended in the same step** — it is canon,
   not commentary. **Every value the answer names owes its document before AR-1
   spawns**, so an answer of `machine + user + data` makes this step three
   documents, two of them new.
3. **AR-1**, by name, over the README **and** every twin the value names.
4. **0.3** — `embody/types.ts` amended, the `DOCS.md` sketch updated **including
   its Mermaid data flow**, and the tests written for real and **committed
   skipped**.
5. **AR-2**, by name, over the sketch against the types.
6. **The rulings written in-repo where they bind**, at the commit that first
   acts on each — `DEV.md` § Ruling provenance: a ruling that lives only in a
   plan file **under `~/.claude/plans/`** does not exist. This brief is in-repo
   and greppable; a plan file is not.
7. **A campaign record** in this directory, separate from this launch prompt.

**DONE is observable, not felt.** Phase 0 is complete when: `embody/README.md`,
`notional-machine.md` (if touched), `types.ts` and `DOCS.md` are committed and
consistent; the new tests exist and are **committed in a skipped state**; `ar-1`
and `ar-2` have both returned and every concern has a documented response;
`npx tsc --noEmit` sits at its measured baseline; the embody suite is green with
the new tests skipped; and the work is **presented to the human, who has not yet
approved Phase 1**. Implementation begins only after that approval.

⚠ **There is a second DONE, for the outcome this brief explicitly blesses.** If
the human rules that the error-interpreting lens carries this and nothing new is
built in embody, there is no `types.ts` amendment and no new test — so the
definition above is unreachable, and **AR-2 has no input, because it challenges
the sketch against the types**. DONE is then: the README amended to say what a
failed stage does **not** publish and why; the ruling recorded in-repo where it
binds; AR-1 over that README; **AR-2 declared `n/a` on the settings line with
its reason**; and a closing commit body stating the unit's answer was "nothing
to build here". Do not stretch the first definition over this — declare which
one you are under.

⚠ **Validate any handoff you write with a context-free agent before treating it
as final** (`AGENTS.principal.md`, invariant 12). This one was, and it mattered.
