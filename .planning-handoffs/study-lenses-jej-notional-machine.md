<!-- cspell:ignore oneline noiw rniw relitigate unadmitted frontmatter -->
<!-- cspell:ignore Explorotron acosh cbrt fround hypot imul lprim rprim trunc -->

# Handoff — rewrite the JEJ level's notional-machine prose

> Written 2026-07-15 by the session that built the JEJ level's Phase 0. Baseline
> at writing: `1dabddb`. **Record your OWN baseline SHA at plan approval.**
> Nothing here outranks governance.
>
> **This brief was validated by a context-free agent, which BLOCKED the first
> draft.** Its must-fixes are folded in — most importantly a **decision
> procedure** for the rulings, which the first draft named and then orphaned.

## Why this runs BEFORE the level's Phase 1

**The prose you are rewriting is upstream of the level's policy.** The committed
`jej/DOCS.md` decides: _"The realm table is the level's one account of its
world. **The admitted globals are its names, derived.**"_ So:

```text
notional-machine.md § Realm  →  the realm table  →  admittedGlobals  →  validate
```

Author the realm section wrong and Phase 1's allowlist — its 68-test policy core
— is wrong. **That is why this comes first.** (Verified: `jej/DOCS.md:91-92`,
`jej/types.ts` `SyntaxAllowlist.admittedGlobals`.)

## ⚠️ TWO RATIFIED CHANGES LANDED AFTER the prose you are rewriting

**1. `realm` is NO LONGER a lifecycle phase** (maintainer, 2026-07-15). The
ratified lifecycle loses it:

```text
source → tokens → ast → environment → evaluation        (realm removed)
```

_The reasoning, so you don't relitigate it:_ **a phase must be a function of the
program.** Every other phase is — `source` **is** the program; `tokens`, `ast`,
`environment`, `evaluation` derive from it. The realm does not: it is identical
for every program, forever. The ratified accessibility map convicted it —
`realm` was the **only phase with no fact stage**, never barred, never varying —
and the lifecycle's own contract is _"each phase offers the lenses that fit the
current code."_ A realm lens never fits; it just always shows. **The realm is a
reference learners consult, not a step their code passes through.**

**This vindicates your source document.** `notional-machine.md:59` already says
**"Realm is static data, not a runtime phase"** and calls the realm stream
_"documentary… not an ordered sequence of installation events."_ The old prose
was right and the ratification was wrong. **Keep that claim; it is no longer a
defect.**

**2. A `link` phase is NOT being added.** It was considered (module lifecycle is
Parse → Link → Evaluate as spec peers) and ruled out for JEJ: embody may
implement it, but **JEJ admits no imports, so it changes nothing here.** Do not
model it.

⚠️ **Removing `realm` from the package's phase list is NOT your deliverable.**
It lives in `src/lib/study-lenses/README.md` (the only non-`jej/` file defining
the six phases) and is someone else's commit. **You own only how
`notional-machine.md` describes the machine.** If your prose needs the package
README to have landed first, say so at your gate rather than editing it.

## Mission

Rewrite `src/lib/study-lenses/language-levels/jej/notional-machine.md` (797
lines, committed at `6ef5458`) to conform to the ratified model and to the
level's committed contracts, and to **document every global the validator
admits**.

## Read first, in this order (before ANY planning)

1. `CLAUDE.md` (the governance router), then your governance file per that
   router — `AGENTS.md`, or `AGENTS.fable.md` **only** if your model id contains
   "fable". ⚠️ **Verify the model id; do not trust the environment block.** A
   `/model` command makes it stale. A subagent's reported model is ground truth
   (the Phase-0 session's env said `claude-fable-5` while it was actually
   `claude-opus-4-8`, and nearly followed the wrong governance file). Then
   `DEV.md` — **END-TO-END**. **Governance outranks this brief.**
2. **The conformance target**, committed at `1dabddb` — your prose must match
   its vocabulary and its decisions:
   - `jej/README.md` — what JEJ curates, its glossary, its boundary
   - `jej/DOCS.md` — owns the realm-table→`admittedGlobals` derivation
   - `jej/types.ts` — `RealmBinding`, `BindingForm`, `BindingPopulation`. **Your
     realm section must be expressible as this data.**
3. **The source of truth for what JEJ admits** —
   `src/lib/embody/lib/validating/just-enough-js.ts`. **Maintainer ruling: the
   validator is up to date where the docs are not.** Where prose and validator
   disagree, **the validator wins** and the prose is the thing to fix.
4. The package's ratified model: `src/lib/study-lenses/README.md` (glossary +
   the lifecycle) · `src/lib/study-lenses/language-levels/{README,DOCS,types}`.
5. The banned-term list:
   `.planning-handoffs/study-lenses-phase0-2-keystone-contracts.md:144`.
6. `jej/REVIEW-NOTES.md` — the embody stream's cross-check. **Do NOT delete it**
   (see § Do not destroy evidence).
7. This file.

## The realm delta — MEASURED, and the whole of it

The validator admits **17** globals (`just-enough-js.ts:524-544`). The NM's
realm section documents **14**. **Three are missing, and all three are ruled:**

| Global       | Validator                                                                                                          | NM today                                                                                                        | What the rewrite does                                                                                                                                                                                                                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`BigInt`** | admitted (`:536`)                                                                                                  | **absent entirely**; taught at `reference.md:3110`                                                              | **Add it.** A `function` intrinsic (`BigInt(5)`).                                                                                                                                                                                                                                                                                                                          |
| **`eval`**   | admitted (`:542`), commented _"easter egg — not in reference.md"_                                                  | **absent from BOTH docs** (the NM's only "eval" is `:666` "no RHS eval" — that is _evaluation_, not the global) | **Add it** as a `function` intrinsic, marked an easter egg. `jej/README.md` defines **easter egg** — the concept exists; the binding still belongs in the table.                                                                                                                                                                                                           |
| **`RegExp`** | the **name** is admitted (`:534`); `new RegExp(...)` is refused separately by `validateNewExpression` (`:430-442`) | `:83` and `:386-387` say _"`RegExp` constructor itself is not in JEJ scope"_                                    | **Add `RegExp` as an `object-register` intrinsic.** The docs conflated two mechanisms: the **global list** admits the name (it must, for a regex literal's `.test()` to resolve via `RegExp.prototype`), and a **node rule** refuses `new`. Both docs are right that `new RegExp()` is refused — and wrong to conclude the name is unadmitted. Say both things separately. |

**Definition of done for this section:** every one of the 17 names appears in
the realm table with a `form` and a `population`, and **nothing appears that the
validator does not admit**. That is mechanically checkable — see § Done.

## The decision procedure (the first draft's blocker)

The context-free validator BLOCKED the first draft for naming the rulings and
then saying _"do not decide them alone"_ to an agent with no maintainer. **They
are now ruled above.** The procedure for anything else you find:

1. **The validator wins over prose.** That is the standing ruling. Apply it and
   record it; do not escalate.
2. **Escalate only if applying it would change what JEJ admits** — i.e. the fix
   lands in `just-enough-js.ts`, not in prose. Then STOP: the code is out of
   your scope, and the ruling must be recorded where **Phase 1 cannot miss it**
   — in your plan's RESUMPTION POINT **and** announced at your gate.
3. **If prose and validator agree but the ratified model disagrees** — the model
   wins, except where the maintainer has ruled otherwise (as with `realm`).

## The other defects — measured, verified 2026-07-15 (re-verify; the tree churns)

| Where                                                 | Defect                                                                                                                       |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `:57`                                                 | **"## Lifecycle: four phases"** — the ratified lifecycle is now **five**: `source → tokens → ast → environment → evaluation` |
| `creation` ×13 (incl. `:175` "during creation phase") | **A banned term.** `environment` is its ratified successor; `creation-as-phase` is on the banned list                        |
| `:572`                                                | **`isJeJ`** — a banned term **and** a dead API (`validation.isJeJ`, retired with the status chain)                           |
| `:61`                                                 | **`streams.realm`** — an embody field that no longer exists                                                                  |
| `:59`                                                 | **NOT a defect any more** — "realm is static data, not a runtime phase" is now **correct**. Keep it.                         |

⚠️ **`creation` → `environment` is a re-modelling, not a rename.** The doc's
`creation` maps to `GlobalDeclarationInstantiation` (script-scope only); the
ratified `environment` phase is broader. The 4-node mermaid (`:68-79`), the
phase table (`:81-87`), and the spec-correspondence appendix (`:735`,
`:764-765`) are all _structured around four phases with abstract-op mappings_.
Renaming means re-deciding which op each phase maps to. **Budget for that; it is
the bulk of the work.**

## Done

- **The exit grep returns ZERO**, over the **full ratified ban list**, run
  case-insensitively with word boundaries (the list says `isJeJ`; the identifier
  is `isJej`; a naive `dial` matches _dialog_):

  ```bash
  grep -rniwE 'kernels?|stations?|applicableTo|isJeJ|admission gate|plugins?|pickers?|dials?|run button|creation-as-phase' \
    src/lib/study-lenses/language-levels/jej/notional-machine.md
  ```

  **Review each match — sanctioned negations are legitimate** ("never a
  plugin"). Zero is the expectation here only because there is nothing to negate
  in this document; do not auto-delete a match without reading it.

- **All 17 admitted globals appear in the realm section**, each with a form and
  a population; nothing extra.
- **No phase list contradicts the ratified five**, and no abstract-op mapping is
  left pointing at a retired phase name.
- README/DOCS/types are **unchanged** — if you needed to change them, that is an
  inter-file contract change and it should have STOPPED you (see below).

## Scope

**IN:** `jej/notional-machine.md` — its vocabulary, its lifecycle, its realm
section, its spec-correspondence appendix.

**OUT:**

- **`jej/reference.md`** — a **separate live defect** with its own follow-up.
  Its § "Program Type: **Strict Mode Script**" (heading `:214`, prose `:216`)
  says the environment injects `"use strict"`, contradicting the ratified
  `snippetTypes = ['module']` and `jej/README.md:35`. **Maintainer ruled: leave
  verbatim, log the fix.** It is banned-term **clean (0 hits)** — do not
  conflate "clean" with "correct". Note: `eval` is absent from it too, which is
  _correct_ — eggs are untaught by definition.
- **`notional-machine.svg`** (326 lines) — **OQ-3 is still open**: `LevelDocs`
  has no slot for it. A file in `jej/` needs no slot; a _channel_ does. Raise
  it.
- **The `docs` channel** — `docs.notionalMachine` is deferred with `index.ts`.
  **Nothing reads this prose yet.** That is what makes it safe to do now.
- **The level's Phase 1** — the validator, models, allowlist.
- **`just-enough-js.ts`** and all code. The validator is your **source**, never
  your target.
- **The package's phase list** (`src/lib/study-lenses/README.md`) — not yours.
- **The quarry** — `src/lib/embody/language-levels/just-enough-javascript/`
  holds the byte-identical original. **Read-only.**

## Do not destroy evidence

The first draft told you to delete `jej/REVIEW-NOTES.md` claiming its items were
resolved. **That was false and the validator caught it.** Its **item 3** is the
live, unfixed `reference.md:216` contradiction, and its **item 4** is a Phase-1
correction (**the migrating test budget is 257**, not 280: 286 − 6 `is-jej` − 23
`validate.test.ts`, whose only import is a DO-NOT-MIGRATE module). It is one of
only two records of both. **Leave it.** Propose its deletion at your gate only
once those two items are logged somewhere durable.

## Governance

- **The quarry is READ-ONLY. Copy, never move, never modify** (standing
  maintainer rule). ~15 quarry files link to these docs and **no gate catches a
  dangling link** — markdownlint does not check link targets, and
  `allowJs: false` means `.js` referrers are never typechecked.
- **Docs commits get the full AR cycle** — run `ar-1` and `ar-2` **by registered
  name**, and **never pass a `model` parameter** (pins live in frontmatter: ar-1
  `opus`, ar-2 inherit; a `model` argument silently overrides the roster).
- **`jej/` exists and its Phase 0 is committed** — you owe no new
  README/DOCS/types, you owe conformance. Wanting to change them is an
  **inter-file contract change: STOP and flag the maintainer.**
- **End-state docs** — present tense, no status, no migration narration.

## Gates — repo-wide gates are RED for foreign reasons

At `1dabddb`: `npm run typecheck` → **77** (76 deprecated + 1
`src/lib/embody/index.ts`; **0 greenfield**). `npm run lint` → red. `npm test` →
**41 tests / 7 files** fail. **Re-measure; do not copy.**

**Disclosed baseline-delta gate:** freeze at approval; re-run and **paste real
output**; assert **zero new / zero newly-failing / zero of any kind in your
paths**. **Disclose every time** that the literal
`npm test && npm run lint && npm run typecheck` did not go green. **Never write
"quality checks pass."**

Traps, each measured:

- **`npm run lint` SHORT-CIRCUITS** at `lint:js` (exit 1) — **`lint:md` (80
  errors) and `lint:spelling` (3607) never run.** Yours is a markdown
  deliverable: **invoke each linter separately.**
- **`markdownlint-cli2` IGNORES file arguments** — `.markdownlint-cli2.jsonc`
  sets `globs: ["**/*.md"]`, which concatenates with CLI args. **Grep to your
  path.**
- **vitest:** grep `Test Files` **and** `Tests` **and** `Failed Suites`.
- **cspell:** this file carries ~18 unique unknown words (`Explorotron`,
  `acosh`, `cbrt`, `fround`, `hypot`, `imul`, `lprim`, `rprim`, `trunc`, …).
  Inline `<!-- cspell:ignore … -->` **in your own file**; **never edit
  `cspell.json` in a ceremony commit.**
- **Node:** default 20.11, repo needs 22.11. Prepend
  `export PATH="$HOME/.nvm/versions/node/v22.11.0/bin:$PATH"` **per Bash call**
  and **`cd` into the repo inside EVERY compound command**. `timeout` does not
  exist on this box.
- **Prettier** currently passes on this file. `--write` before review and
  **re-read rewrapped lines**.

## Git policy

Commits **directly to `main`**, **path-scoped**. **Never push, amend, rebase,
reset, `git add <dir>`, or a bare `git commit`.** Recipe:
`git commit -m "…" -- <exact paths>`, verify with `git show --stat HEAD` that
**only** your paths landed, announce **full SHA + message**. `--no-verify` is
permitted for pre-existing hook debt.

⚠️ **`jej/` is NOT a safe path prefix for "is this mine?"** The tree moved three
times during the Phase-0 session, a parallel **embody** stream commits here, and
`jej/` now holds both level files and foreign ones (`REVIEW-NOTES.md`). **Check
`git log`/`git status` per file before writing.** An untracked file is in no
commit and no stash — a literal `Write` to one destroys work git cannot restore.

## The exception you are closing

Committed greenfield HEAD carries **14 banned-term hits** today, knowingly:
`6ef5458` copied this file in under the maintainer's _"move now, rewrite later
in place"_ ruling, re-affirmed after being shown it breaches the ratified rule
_"migrated content counts as new writing — there is no migration exemption."_
**The window is one gate wide and you are that gate.** Until you land, any
repo-wide banned-term grep shows them; say so rather than being surprised.

## Before you hand off

Invariant 11: spawn a **context-free** agent, give it ONLY your RESUMPTION POINT
and launch prompt, have it report where it would stumble, and apply its must-fix
findings. **It is routinely skipped — writing the handoff feels like
finishing.** It BLOCKED this brief's first draft and was right. Only the human
waives it.
