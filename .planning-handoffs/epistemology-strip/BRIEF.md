<!-- cspell:ignore goldfishbrained socratizing Epistem checkability anaphor -->

# Brief — strip the `## Epistemology` block convention

> **Status:** decided by the maintainer 2026-08-06, **not** executed, and one
> design question is open that must be answered before any file is edited. This
> brief states the reason, the scope and the traps. Written by the session that
> found the defect, because the reason is the part that would be lost.
>
> **Validated context-free 2026-08-06** by a fresh agent holding only this file;
> its seven must-fix findings are applied below.

## Who does what — read this first

This brief hands off to **two** agents, not one:

1. **The design agent** reads this, takes the open question in § The design
   question to the maintainer, and **stops**. It edits nothing. Per
   [AGENTS.principal.md § Context Discipline](../../AGENTS.principal.md#context-discipline),
   a design unit surfacing mid-execution goes to a fresh session
   unconditionally.
2. **The executing agent** receives the maintainer's answer plus this brief and
   does the edits. § Ripple inventory, § Coordination and § Gates are addressed
   to it.

If you are reading this and the design question is still unanswered, you are
agent 1.

## The decision

The maintainer's words, verbatim, because the nuance is load-bearing:

> "I have read this section in DEV.md, it is solid if understood correctly but
> clearly it's misleading for goldfishbrained agents. we should remove it and
> all the ripple-fixes that implies."

This is **not** a judgement that the idea is wrong. It is a judgement that a
convention only a careful reader applies correctly is the wrong shape for a
repository whose primary authors are agents with no memory between sessions.

## What the convention is

At `twin-doc: none` — the default — a module README carries a `## Epistemology`
block with three fields [read: `DEV.md` § The Epistemology block — _"It has
three fields, and the second is the one that does the work"_]:

1. **which twin is not built**;
2. **to whom or what it is delegated** — a named holder;
3. **what would falsify that delegation** — the condition under which the module
   starts owing its own twin.

## The evidence that it does not survive contact

**It has exactly one instance in the repository, and that instance is
self-falsifying** [measured 2026-08-06: `git grep -l "^## Epistemology"` → two
files, `DEV.md` (the rule itself) and
`src/lib/study-lenses/lib/screening/README.md`].

The convention landed at `e91bcaf9`, **2026-08-05 11:03:24**; the screening
block was written at `24f0df7a`, **15:39:46 the same day** — four and a half
hours later [measured: `git log -1 --format=%ci` on each]. By a careful agent,
into a module whose domain-blindness had just been argued across four commits
and a sandbox checkpoint. Its field 3 reads:

> **Falsified if:** this leaf ever acquires a severity, an ordering by
> importance, a default table, or **a message a consumer is expected to show a
> reader unedited**

The leaf already had one when that sentence was written. It authors
`'${node.type}' isn't in the admitted syntax` [read:
`src/lib/study-lenses/lib/screening/collect-violations.ts` — the `applyRule`
helper's default-deny return], and the UI renders it into a live DOM node
uninterpreted [read: `src/lib/study-lenses/orchestrate/index.tsx` — ``
`${masked.levelLabel}: ${masked.cause.violation.message}` `` inside
`formatBlockedSentence`, whose result is the body of a `<p
data-enforcement-cause role="status">`]. That property is not incidental — it is
why the message was reworded mid-wave and why that increment needed a human at a
running dev server (human ruling 2026-08-05: the leaf's default-deny message is
reworded domain-blind — a behavior change, live at
`screening/collect-violations.ts`).

**Read the failure precisely.** Field 3 asks an author to name a future state
that would invalidate a present decision. Both errors are invisible at write
time and symmetric: too broad and it fires on arrival (what happened); too
narrow and it never fires and is decoration. Nothing at write time distinguishes
a good trigger from either.

## Two things to carry, not discard

1. **Field 2 is the good one, and `DEV.md` says so itself** — [read: `DEV.md` §
   The Epistemology block — _"Field 2 is not bookkeeping"_]. It separates "we
   considered the mental model and handed it to the JEJ validator" from "we
   never thought about it", a real distinction with a named failure behind it in
   `spiralearn/frogramming-and-vibetoading/ontology.md` § 4 (_twin ignored_).
   **If any part survives, it is this one.** Whether it survives is the
   maintainer's call — ask, do not assume.
2. **A standing design ruling taken in the same conversation** — absence is a
   safer baseline than recommendation, and recommendation is a later layer on
   top of the bare absence information (human ruling 2026-08-06, now a
   convention in
   [`lib/screening/README.md`](../../src/lib/study-lenses/lib/screening/README.md)).
   It is what field 3 got wrong, and it outlives this strip.

## The design question — answer it before editing

`DEV.md`'s Phase 0 sequence currently reads [read: `DEV.md` § Incremental
Development Workflow, the Phase 0 artifact-order block]:

```text
0.1  README          — incl. the ubiquitous-language glossary
0.2  the twin        — or the ## Epistemology block that discharges it
     → AR-1            challenges the README AND the twin, together
```

`twin-doc: none` is the **default**, so for the near-universal case the block
_is_ step 0.2. Four exits, and the maintainer picks:

- **(a)** Step 0.2 survives as "the twin"; at `twin-doc: none` it is simply
  **not owed**. Phase 0 becomes two steps for most modules and AR-1 challenges
  the README alone.
- **(b)** Step 0.2 is removed entirely and Phase 0 is renumbered. **Widest
  ripple** — see the step-0.2 sites below.
- **(c)** Step 0.2 survives with a lighter discharge. Its concrete member, named
  because "a family of options" invites an agent to invent one: **keep fields 1
  and 2, drop field 3** — the minimal repair implied by the diagnosis above,
  since field 3 is the broken field.
- **(d)** Change the `twin-doc` default away from `none` — e.g. to `machine`, so
  `DOCS.md` _is_ the twin and step 0.2 always produces a real document, needing
  no discharge mechanism anywhere. Precedent exists: one module already declared
  `twin-doc: machine` on the ground that its own `DOCS.md` IS the machine twin,
  so no `## Epistemology` block was owed — the obligation keys to the declared
  value, not to a module's age (human ruling 2026-07-30). This removes the
  failing convention without renumbering.

**One fact material to the choice, which `DEV.md` gets wrong.** The block's
stated justification is that its fixed heading is _"the one rule in § Work
routing and ceremony that a check can find"_ [read: `DEV.md`, the `##
Epistemology` block format paragraph]. **Nothing checks it today** [measured
2026-08-06: `grep -rIn "Epistem" scripts/ .claude/hooks/` → no matches;
`scripts/check-governance.mjs` contains no reference to it]. `DEV.md`'s own
checklist item is a human/agent checklist, not a script. So option (b) forfeits
**zero** mechanical checkability, contrary to the reasoning recorded when the
convention was adopted.

## Ripple inventory — two surfaces, and the string grep is only the first

### Surface 1 — the literal string

[measured 2026-08-06: `git grep -c "Epistemology" -- .`] 36 mentions across 10
files. `git grep` searches tracked files only; an untracked sweep returns the
same set [measured: `grep -rIl "Epistemology" . --exclude-dir=node_modules
--exclude-dir=.git --exclude-dir=build --exclude-dir=.docusaurus`], so the
inventory is complete.

| File                     | Mentions |
| ------------------------ | -------- |
| `DEV.md`                 | 10       |
| `HUMANS.md`              | 4        |
| `.claude/agents/ar-5.md` | 4        |
| `AGENTS.md`              | 2        |
| `AGENTS.principal.md`    | 2        |
| `.claude/agents/ar-1.md` | 2        |

### Surface 2 — "step 0.2" and "the twin", which never say _Epistemology_

**Under option (b) every one of these becomes a dangling reference**, and the
string grep does not reach them [measured 2026-08-06: `git grep -n "0\.2" --
'*.md'`, filtered to governance files and to lines with no `Epistemology`]:

`.claude/agents/ar-1.md` (its **YAML frontmatter `description`**, plus body) ·
`.claude/agents/ar-5.md` · `AGENTS.md` (×2) · `AGENTS.principal.md` (×3,
including the `ar-1` trigger line) · `DEV.md` (the blocked-`retrospective`
rationale, the artifact-order line, the renumbering note, the step-0.2 heading
itself, the AR-1 trigger, the AR-5 provide-line) · `HUMANS.md` (×2).

Related axis: `twin-doc` appears 16× in `DEV.md` and `twin` 42× [measured: `git
grep -c` on each]. The `twin-doc: none` row is what _creates_ the obligation the
block discharges — removing the discharge without touching the axis leaves
`none` meaning "step 0.2 produces nothing", which is option (a) but must be
**written**, not left implied.

### The one live instance — and it is not a clean subtraction

`src/lib/study-lenses/lib/screening/README.md` carries the block **and, directly
below it, a rationale paragraph that depends on it**:

> The delegation is why the module is domain-blind rather than merely generic:
> it is not that a language model was too costly to build here, but that two
> consumers hold different ones — a language level's curriculum position, and a
> generator's screening of a candidate — and a single leaf holding either would
> be wrong for the other.

[read: that file, immediately after the `## Epistemology` block.] It opens on
the bare anaphor **"The delegation"**, whose antecedent is the block. Delete the
block alone and it dangles; delete the whole section and the module loses its
best statement of why it exists.

**The instruction here is contingent on the design answer** and must not be
guessed: under (a) or (b) the block goes and this paragraph needs a new home and
a rewritten opening; under (c) the block is _edited_, not deleted; under (d) it
may stay untouched. Do not treat "removing the block also removes the
self-falsifying sentence" as the whole edit — it is true of the sentence and
false of the file.

### OUT of scope — do not sweep

Dated records of what was true when they were written — a commit body, a
measurement in a log, a decision recorded at its moment — are **not** sweep
targets, even where a later decision made them wrong. One such record already
contains a measurement that is false today, correctly so. Editing a dated record
to match a later decision is record falsification. The sweep touches end-state
documents, never the history behind them.

## Obligations the executing agent owes

1. **A loss ledger is mandatory, and this changeset is nothing but removal.**
   [read: `DEV.md` § Documentation migration discipline — _"an edit that removes
   content from a `README.md`, `DOCS.md`, or `types.ts` follows the same
   enumeration"_, and _"a staleness deletion is enumerated in the loss ledger
   like any other removal"_]. Every removed clause is enumerated in the commit
   body with its justification. AR-5's Loss lens fires on its absence.
2. **`HUMANS.md` has a procedure written for exactly this change — use it.**
   [read: `HUMANS.md` § Update triggers — _"a workflow step changing shape —
   renamed, renumbered, merged, reordered, or gaining or losing a gate"_ is a
   listed trigger, and it warns _"this file recites that workflow in four places
   and they are not next to each other… you fix the section you happened to be
   editing, and three others keep teaching the old shape"_, then names the
   four]. That converts a search into a checklist.
3. **Where the maintainer's answer lands.**
   [DEV.md § Ruling provenance](../../DEV.md#ruling-provenance) gives two homes:
   a `PINNED(...)` beside the assertion a ruling settles, and a dated
   `(human ruling YYYY-MM-DD)` line in the document the ruling governs — plus
   the commit body of the turn it is given. The design question here is about
   `DEV.md`'s own convention, so its answer belongs in `DEV.md` at the section
   it changes, dated. This brief carries the question, never the ruling.

## Coordination and traps

- **A parallel session owns these files.** It landed governance commits into
  `DEV.md`, `AGENTS.md`, `AGENTS.principal.md`, `ar-1.md` and `ar-5.md`
  throughout 2026-08-05 and 2026-08-06, and **overwrote another agent's
  in-flight edits twice in one day**. As of 2026-08-06 it had moved to an
  unrelated campaign and all six files were clean [measured: `git status
  --short` on them → empty]. **Re-measure before starting**, and prefer one
  commit so the window is small.
- **⚠️ `.claude/settings.json` carries an uncommitted removal of the
  `pinned-guard.py` `Edit|Write` hook** — someone else's in-flight change to
  governance surface, still live [measured 2026-08-06: `git status --short --
  .claude/settings.json` reports it modified; `git diff` shows the block
  removed]. A `git commit -a` would silently land a disabled safety hook.
  **Always commit with an explicit pathspec.** Never edit or revert that file.
- **Edit the two `ar-*.md` files LAST.** Their `Epistemology` mentions sit in
  the YAML frontmatter `description:` fields, which are the live agent-roster
  text. Editing them mid-session does not refresh the roster — an AR spawned
  afterwards in the same session still carries the old description. If AR-1/AR-5
  will run on this changeset, edit those files after the reviews, or accept the
  mismatch knowingly.
- **No anchor breakage to worry about** [measured: `git grep -n
  "epistemology-block\|#the-epistemology"` → no matches]. Removing `DEV.md`'s
  `### The Epistemology block` heading breaks no cross-file link.
- **Expect advisory hook output on nearly every edit** — six of the seven
  in-scope files are in the governance-advisory corpus. Non-blocking.

## Gates, and what "done" means

**Done is not "the grep is empty".** Done is: the chosen option's _new_ Phase 0
shape is stated coherently in every place that recites it, and no document still
teaches the old one. The grep is a necessary check, not a sufficient one.

- `npx prettier --check`, `npx markdownlint-cli2 --no-globs "<file>"`,
  `npx cspell <file>` on every changed file — all three honor file arguments
  (markdownlint-cli2 v0.21.0 does with `--no-globs`; verify if in doubt)
- `node --version` must be ≥ the engines floor or `cspell` will not run at all:
  `export PATH="$HOME/.nvm/versions/node/v22.11.0/bin:$PATH"` per Bash call
- `node scripts/check-governance.mjs` — **re-measure the baseline in the same
  turn**; it read `0 errors, 61 advisories` on 2026-08-05 and
  `0 errors, 62 advisories` on 2026-08-06, and the delta was foreign
- `git grep -c "Epistemology" -- .` afterwards: the remaining hits should be
  dated records and history only — no end-state document should still teach the
  stripped convention
- Re-read every step-0.2 site from Surface 2 and confirm none dangles
- Ceremony is the maintainer's to set and is **not yet set** for this work. Ask.
- Commit with an explicit pathspec; this worktree is shared. **Never push.**
