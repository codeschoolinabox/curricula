<!-- cspell:ignore actioned acyclicity affordances authorised behaviour behavioural brok checkability checkpointed codemod codepoint cutover failable finditer generalises homehood misdescribes neighbouring organise organised parentheticals pathspec respecified scriptable spellme synchronisation ugrep discharged elif unattacked endswith findall fullmatch importants keyspace misalign renderable rindex startswith unargued unfiled unfound unglossed unactioned unbannered unbuilt undercount undercounted undercounts undrawn unmigrated unretired unrun wireframes -->

# orchestrate ux — resumption point

**STATE: Phase 0 step 0.2. `ar-1` ROUND 12 IS THE NEXT GATE and has NOT run.
AR-5 has still never run and fires at 0.2 close.**

**Round 11 was declared FULLY RESOLVED and was not.** A context-free validation
run before round 12 found **three of its six "wrong things" still wrong at
HEAD**, plus a half-landed human ruling in the twin itself. Those are fixed —
`1e95814e`, `ffc59db3` — and the lesson is the one this file keeps re-learning:
**a resolution claim is a repo-state claim, and it decays like any other.** Do
not read "resolved" in this file as measured unless it carries a tag.

**How to read a number in this file.** Every measured claim below is tagged with
what makes it decay, because the last three sessions each shipped one that had
gone stale in a different way:

- **SHA-pinned** — measured at a named commit; never decays.
- **campaign-scoped** — decays when THIS campaign commits.
- **foreign-scoped** — decays with **zero** campaign commits, because the tree
  is shared. These are the ones that bite.

**Why a built module is in "Phase 0".** `orchestrate/` ships, has tests and a
browser checkpoint ledger — and its **interface was never designed**. Phase 0
here specifies the arrangement (the Rail) that replaces the lifecycle strip;
what exists in `index.tsx` today is scaffolding, not contract. Full statement: §
What this campaign is, in the archive.

**The declared position, and it is the archive's ruling, not a fresh one:**

```text
work: software · twin-doc: user · ceremony: full · prospective
```

`twin-doc: user` is why AR-1 reviews a **twin** as well as a README, and the
twin is **three documents**, all at `src/lib/study-lenses/orchestrate/ux/`:
`personas.md`, `user-journeys.md`, `wireframes.md`. (Give AR-1 absolute paths —
`lenses/spellme/ux/wireframes.md` also exists and a bare relative path is
ambiguous.)

**Read [`DECISIONS.md`](./DECISIONS.md) first** — the decision index, its § 0.3
entry conditions (the deferrals' only home), § Deferred to an eyeball check (two
round-11 findings ruled into the checkpoints, NOT open), and § The campaign's
RADIUS, which now has **four rings**. Every row id and `CP-N` cited below is
defined there; `T*` checkpoints are in § Sandbox checkpoints, in the archive.

## What round 11 changed, and the FOUR commits that answered it

Round 11 returned **PAUSE — 4 blockers, 9 important, 7 minor** — and called that
session's work "the strongest of the eleven rounds" while finding **six things
it had written that were wrong**. Its verdict is archived verbatim below.

| SHA        | what                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| `e61c7201` | **BLOCKER 3** — the drawn word and the union member DECOUPLED; the drawn word `waiting` → **`not reached`**  |
| `9e11074f` | **BLOCKERs 1, 2, 4** + three of the six wrong things + the **fourth ring**                                   |
| `cb2e3448` | the resumption point opened on round 12 — and shipped the false "ALL SIX FIXED" heading                      |
| `ffc59db3` | **the other three wrong things**, found by the pre-round-12 context-free validation and fixed a session late |

**Two human rulings drove it** (2026-08-19): the machine value and the learner's
word are decoupled, so UX vocabulary can be refined later without touching
`types.ts`; and `waiting` was simply wrong copy — the README glosses it as
_"barred, downstream of the barring edge"_, reaching for the opposite word.

**The pattern round 11 exposed is worth more than any single finding.** Three of
its six corrections were **corrections that had themselves gone stale or
half-landed**, inside the very sections written to fix staleness — including one
in the same list as the bullet `0d9bd6d2` repaired, under a subject line
claiming the instruments "were each wrong and are repaired". Assume the same of
this commit.

## THE NEXT GATE — `ar-1` ROUND 12

Registered agent, **no `model` parameter**. Its brief is **§ THE ROUND-12
BRIEF**, below — written for round 12, not inherited from round 11. Round 11's
verdict is archived verbatim in this file under § ROUND 11'S VERDICT; do not
re-derive it, and do not hand its findings on as a settled fixed-versus-not
list.

**Tell round 12 what it must attack, because round 11 named it and nobody built
it: CP-α, the clause × drawing coverage table.** Round 11's diagnosis is that
every instrument this campaign owns is a **presence detector** — greps, the
reading list, the frame scan, the census — and the live defect class is
**absence in the drawn surface**. Four of the caption's contract clauses had no
drawing; one of them (the tray ordering) was actively contradicted by omission
and is fixed. **The instrument is unbuilt and unruled**, deliberately, because
building one is a decision. That is the single most likely source of round 12's
findings.

**Also unattacked:** the standing rows are now visibly tight — `not reached` is
11 characters against `waiting`'s 7, and the spelling-break rail draws three of
them in 62 columns. That is a real layout constraint the drawings surfaced, and
it is a checkpoint question, not a document one.

## Baselines — measure these again at session start, do not trust them

| what                   | value                                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| prior session baseline | **`061af657`** — SHA-pinned                                                                                            |
| **AR-5's baseline**    | **`80306ad9`** — the campaign's, not any session's. SHA-pinned                                                         |
| AR-5's SHA list size   | **77 commits** [measured at `ffc59db3`] — **campaign-scoped**, and it is a budget question before AR-5 launches        |
| green                  | **622 passing in 22 files** · `npx tsc --noEmit` exit **0** [measured at `ffc59db3`] — campaign-scoped                 |
| upstream               | **none configured** on `main` [measured: `git rev-parse --abbrev-ref main@{upstream}` → fatal]; `origin/main` is ahead |
| **foreign commits**    | **15** since `061af657` [measured at `ffc59db3`] — **foreign-scoped, so this number is wrong by the time you read it** |

⚠ **The tree carries other campaigns' work, including a modified
`AGENTS.principal.md` (governance surface) and untracked directories.** The
pathspec below is a **staging discipline**, not just a log filter: commit with
`git commit --no-verify -F <msg> -- <paths>` and never `-a`. Full standing
rules: § Mechanics that will bite you, in the archive — that section is LIVE.

```text
src/lib/study-lenses/orchestrate .planning-handoffs/orchestrate-ux src/lib/study-lenses/WORKFLOWS.md
```

## What the ROUND-11 session did — thirteen commits, from `0d9bd6d2`

`0d9bd6d2` · `9ab9e419` · `b3c2f0dc` · `99e04692` · `ffb4b0d8` · `fa57a777` ·
`1f370db6` · `1106c268`

| SHA        | what                                                                                    |
| ---------- | --------------------------------------------------------------------------------------- |
| `0d9bd6d2` | the three instruments this pass leans on were each wrong · **RULE** (intake question 3) |
| `9ab9e419` | **IMPORTANT 3** — the caption holds one THING; its arms differ in shape · C14           |
| `b3c2f0dc` | **BLOCKER 2** — the caption reaches all three twin documents                            |
| `99e04692` | **IMPORTANT 4** — the third framing drawn; the dropped `cause.stage` key recorded       |
| `ffb4b0d8` | **IMPORTANT 5** — G7's home inverted; A14 opened; the sibling ring censused             |
| `fa57a777` | **IMPORTANT 7** — the inverted asymmetry booked · C15 · checkpoint T10                  |
| `1f370db6` | **MINOR 8–11** + the manifest + H6's own count discrepancy · C16                        |
| `1106c268` | the resumption point opens on round 11                                                  |

⚠ **NEVER ASSEMBLE THE AR-5 LIST FROM THIS TABLE. Run the command.** Every
round's table has been short by at least its own closing commit, and an earlier
revision of THIS table claimed to have solved that and was itself short by one
(`1106c268`, which is inside the pathspec because it edits this file). **The
table cannot be complete: the commit that updates it is always later than it.**

```bash
git log --oneline 80306ad9..HEAD -- \
  src/lib/study-lenses/orchestrate .planning-handoffs/orchestrate-ux \
  src/lib/study-lenses/WORKFLOWS.md
```

## The one thing this session changed most

**CP-2's reading list works, and it is the only instrument that reached the last
blocker.** Round 10 proposed it and nothing had used it. `ux/personas.md` and
`ux/user-journeys.md` are **0 for all four caption phrases** — those four being
`the caption`, `the slot beneath the rail`, `the reason line`, and
`the empty-count line` — which is measured, true, and the exact basis on which
this session's own plan concluded they needed nothing. Read end to end instead,
they assert the decision anyway, and three defects fell out:

1. a live contradiction — Journey 6 licensing the per-phase cause repetition
   `personas.md` rejects one file over;
2. a gap — **the caption's total order is asserted nowhere in the twin**, so the
   twin could not falsify a precedence regression;
3. a near-collision with the retired arm name `the reason line`.

**A grep would have returned zero and a receipt would have declared both files
clean.** Every future vocabulary row closes by reading the `home of record`
column's documents, not by counting.

## What round 11 said was WRONG — three fixed at `9e11074f`, three NOT, all six fixed now

⚠ **This heading read "ALL SIX FIXED at `9e11074f`" and that was false.** A
context-free validation before round 12 re-measured all six: items 2 and 6 had
landed, and **items 1, 3, 4 and 5 had not** — the strike that was never applied,
H6's replacement numeral, `the guide → 1 / 1`, and every line citation. They are
fixed at `ffc59db3`; the false heading shipped inside the commit that claimed to
repair round 11's own staleness, which is the fourth consecutive round in which
a correction went stale inside the section written to fix staleness.

**Kept because the pattern is the lesson, not the items.**

| claim                                                                      | measured at HEAD                                                                                                                                                                     |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DECISIONS.md`: "**two of four** full drawings are missing their top rule" | **FALSE — 4 `┌` and 4 `└`, perfectly paired.** False since `8c35c977`, BEFORE this session's baseline. `0d9bd6d2` repaired the ADJACENT bullet in the same section and left this one |
| the new § The machinery breaks drawing's message `entwining failed.`       | **FABRICATED — 0 occurrences in the tree.** The real one is `the syntax tree does not span its source` [read: `embody/derive-entwined.ts:73`]                                        |
| H6's status "27 prose violations across **9** files"                       | the column enumerates **8** paths and **34** occurrences — the headline was left standing beside a note saying it was wrong                                                          |
| third-ring census cell `the guide → 1 / 1`                                 | **2 files** at the census commit. Conclusion (polysemy) unchanged                                                                                                                    |
| every `ux/wireframes.md` line citation in `DECISIONS.md`                   | stale — this session added ~35 lines at `99e04692` and did not re-anchor                                                                                                             |
| pre-existing, live in the reviewed artifact                                | `derive-study.ts` called "the region's other value file" (it is a FUNCTION file); `types.ts:194` carries a mangled JSDoc line from `da4328d1`'s sweep                                |

**The pattern is worth more than the items.** Three are corrections that
themselves went stale or half-landed, in the very sections written to fix
staleness. `0d9bd6d2`'s subject line — "the three instruments this pass leans on
were each wrong, and they are repaired before any decision rides them" — was
true of three bullets and there was a fourth in the same list.

## ROUND 11'S GATE — CLOSED. The human ruled 2026-08-19; do not work from this

**Discharged. Not a task list.** Both design questions were ruled — decouple the
drawn word from the union member (`e61c7201`), and defer the unreached count's
justification plus the undrawn-clause coverage to the checkpoints. All four
blockers are fixed. Kept because the reasoning is auditable.

**Round 11's own verdict on cost:** three of its four blockers are cheap —
delete a three-sentence status clause from `DOCS.md`, rename `the mark row` at
four sites, add one caption row to the open-tray drawing. **The fourth needs a
human ruling, not an edit**: the standing's drawn word has two contradictory
homes, and `types.ts` cannot be written deterministically from the prose as it
stands.

**And one IMPORTANT is load-bearing enough to reorder the work**: C14 — this
round's headline decision — exists only because the waiting count exists, and
nobody has argued that the waiting count should exist. If it goes, C14
collapses, the shape union evaporates, and `PhaseEntry`'s existing
`readonly cause: string` stops being a defect. Round 11's CP-γ says settle that
FIRST and re-derive C14 from the answer.

### THE ROUND-12 BRIEF — write it from here, not from round 11's

⚠ **An earlier revision told round 12 to reuse round 11's brief verbatim.** That
brief says "round 10" three times, points at § ROUND 10'S VERDICT, and lists the
subjects of the session BEFORE last. A reviewer briefed from it attacks the
wrong pass. This section replaces it.

Registered agent `ar-1`, **no `model` parameter** (the frontmatter pins `opus`;
passing one silently overrides the roster).

**Inputs to hand it** — `DEV.md § AR-1`'s _Provide to agent_ line, made
concrete. **Give every path in full; `DECISIONS.md` declares its paths relative
to `orchestrate/`, and one of these is a SIBLING of that directory, not a
child:**

```text
src/lib/study-lenses/orchestrate/README.md
src/lib/study-lenses/orchestrate/DOCS.md
src/lib/study-lenses/orchestrate/ux/personas.md
src/lib/study-lenses/orchestrate/ux/user-journeys.md
src/lib/study-lenses/orchestrate/ux/wireframes.md
src/lib/study-lenses/orchestrate/types.ts          ← context, NOT a review target
src/lib/study-lenses/orchestrate/display-labels.ts
src/lib/study-lenses/orchestrate/index.tsx
src/lib/study-lenses/orchestrate/phases-panel/types.ts
src/lib/study-lenses/embody/derive-accessibility.ts   ← SIBLING of orchestrate/
.planning-handoffs/orchestrate-ux/DECISIONS.md     ← in full; reviewable, round
                                                     10's IMPORTANT 6 was a
                                                     defect inside it
```

`types.ts` is context because **0.3 locks it and it is deliberately thin** —
`DEV.md` puts the read-together test at the END of 0.3, and AR-1's own trigger
is "before `types.ts` locks the contract". Do not let a reviewer treat its
thinness as a 0.2 defect; round 11 got this right and said so.

**Brief it on the WHOLE twin, never a narrowed scope.** Round 8's lesson is that
telling a reviewer what not to review is how a real regression walks through.

**Do NOT hand it a fixed-versus-not summary as fact.** Give it round 11's
verdict — archived verbatim in this file under § ROUND 11'S VERDICT — plus the
SHA list, and tell it to **determine for itself** what landed. This campaign's
scoping claims are measurably unreliable: the heading above this one said "ALL
SIX FIXED" and three were not. State the campaign's belief separately and tag it
`[relayed: the round-12 pre-pass — falsify it]`.

**Tell it the subjects the PRE-ROUND-12 pass touched**, so it attacks rather
than rediscovers — and tell it these are **new work under review**, not settled
ground:

- **C17's half-landed migration** (`1e95814e`) — the drawn word reached the
  drawings and the README and not § Fresh mount's prose. Restructured, not
  token-swapped.
- **C18, opened and deliberately UNRULED** — what a barred station SPEAKS. The
  twin now contradicts itself about it on purpose (§ Fresh mount draws
  `not reached` and speaks `waiting`), and checkpoint T10 is deliberately NOT
  migrated because it is C15's acceptance test.
- **The citation class** (`ffc59db3`) — every line-number citation into the twin
  retired in favour of section anchors; C14 widened to its third drawing; H6's
  aggregate deleted rather than renumbered; `the guide` corrected to 3 / 2.

**And what is deliberately NOT fixed**: everything in § 0.3 entry conditions,
and every package-, sibling- and deprecated-ring divergence in H8 — declared,
not fixed, by standing ruling (CP-3). Also ruled into the checkpoints rather
than open: the unreached count's justification and the three remaining undrawn
caption clauses (`DECISIONS.md` § Deferred to an eyeball check).

### The five questions — ask these, they are the round's comparable output

⚠ **Rounds 9, 10 and 11 all answered "the five questions" and NOBODY EVER WROTE
THEM DOWN.** Only the answers survive, inside the archived verdicts, which is
why every round has had to reconstruct them. They are recorded here now.

1. **Is 0.2 closeable now?** If not, what blocks it, and which blockers need a
   human ruling rather than an edit?
2. **Is there an un-swept ring, term, or FORM?** The radius claims four rings.
   The live defect class is **absence in the drawn surface**, and **CP-α — the
   clause × drawing coverage table — is still unbuilt**.
3. **Do the decisions this pass touched hold?** C17's decoupling, C18's
   deliberate non-ruling, C14's widened evidence, H6's deleted aggregate, and
   the fourth-ring declaration.
4. **Can `types.ts` be written deterministically from the prose today?** That is
   0.2's test. The read-together test is 0.3's and is not to be applied here.
5. **Is anything this pre-pass wrote actually WRONG?** Round 11 found six such
   things and was right about all six. Assume the same rate.

**And a sixth instruction, which is not a question:** round 11's structural
diagnosis is that every instrument this campaign owns is a **presence detector**
while the live defect class is **absence**. Hand it that diagnosis and **ask it
to falsify the diagnosis**, not merely to apply it.

### When round 12 returns

- **On PAUSE: put it to the human before opening a fix round.** That instruction
  has stood since round 9 and is not discharged.
- **On PROCEED: 0.2 closes**, which fires, in order — **AR-5** against baseline
  `80306ad9` with a **SHA list from the command below, never a range and never a
  table** (77 commits at `ffc59db3`, so put its scoping to the human BEFORE
  launching; `ar-5` carries **no frontmatter model pin** and inherits whatever
  tier this session runs on) → the settings-line discharge → the **Phase-0 →
  Phase-1 human gate** → the **push gate**. No upstream is configured on `main`.
- **Archive the verdict verbatim in this file**, under the same banner the four
  previous rounds use:
  `# ROUND 12'S VERDICT, AS RETURNED — ARCHIVE, NOT A TASK LIST`. Splice it
  **programmatically** and **unescape it** — the transcript stores it
  HTML-escaped. A verdict that looks lost is recoverable from
  `~/.claude/projects/<project-slug>/<session-id>/subagents/*.jsonl`, which no
  repo grep and no top-level `*.jsonl` glob reaches. See § Mechanics that will
  bite you, the subagent-transcript bullet.
- **An archived verdict is IMMUTABLE and its citations are allowed to rot.**
  Every archive below carries "`[relayed: ar-1 round N]` until re-measured", and
  that is the guard. Do not re-anchor a reviewer's line numbers — you would be
  editing a record of what they said.

## What was still open at round 11 — SUPERSEDED by § THE NEXT GATE

**Actionable:**

1. **`ar-1` round 11**, above.
2. **AR-5 has NEVER run**, and no ceremony level removes it. Ruled 2026-08-18:
   it fires at **0.2 CLOSE**, not before. Baseline `80306ad9`; hand it a **SHA
   list from the command above, never a range and never this file's table**.

**Standing conditions, not work items:**

- The **push gate** — human only, and there is no upstream to measure against.
- **Everything in `DECISIONS.md` § 0.3 entry conditions**, which went **24 → 27
  rows** this session [measured 2026-08-19: row-title diff against `061af657`] —
  four added, one replaced. The four: the render projection's dropped framing
  key; the barred station's per-station cause (conditional on T10);
  `generator/README.md`'s homeless `strip` vocabulary; and the
  three-package-reconciliations row rewritten to seven with per-item owners.

## Rulings taken 2026-08-19 — binding, do not re-litigate

**Also recorded in [`DECISIONS.md`](./DECISIONS.md) § Rulings this list
produced**, which is the durable home; this table is the convenience copy.

| #    | ruling                                                                                                                                                                                                                             |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-X  | **The caption is ONE slot holding one THING, and its arms differ in SHAPE.** Cause arm = a block (framed message + the waiting count); count arm = one line. The union in `types.ts` is over arm shapes, never `string \| string`. |
| R-Y  | **The third framing is DRAWN.** Refined in execution: a _band_ excerpt cannot carry it (G1 makes the band the control row and the rail; the caption renders beneath), so it is a **rail-and-caption excerpt**.                     |
| R-Z  | **G7's columns invert** — home → `README.md` § What renders; `editor/README.md` → asserting. The class claim gets its own row, **A14**.                                                                                            |
| R-AA | **`ar-1` round 11 runs as the acceptance test**, then AR-5 at 0.2 close.                                                                                                                                                           |
| R-AB | **The intake checklist has a THIRD question** — a commit that edits a row re-reads that row as rendered.                                                                                                                           |
| R-AC | **The sibling-region ring is the radius's third ring**, censused with a declared **polysemy exclusion**. Declared, not fixed.                                                                                                      |
| R-AD | **The census reads TRACKED files only**, with one untracked observation recorded anyway.                                                                                                                                           |

## Operating instructions for the next session

- **Model**: design work tracks the strongest available tier. Round 12 is a
  design review; run the orchestrator on an opus-tier model and pass **no**
  `model` parameter to `ar-1` (its frontmatter pins `opus`). A downgrade must be
  named together with its cost, because `ar-2` and `ar-5` inherit it — **`ar-5`
  has no `model:` line in its frontmatter at all** [read:
  `.claude/agents/ar-5.md`], so it runs on whatever tier spawns it.
- **Opens in**: Phase 0 step 0.2, at the **round-12** gate. Round 11's gate is
  CLOSED and ruled — see § ROUND 11'S GATE.
- **Gates the human holds**: the round-12 PAUSE decision (standing since round
  9), the Phase-0 → Phase-1 review gate, and the push.
- **The twin ask is re-asked every session, not remembered** [read: `DEV.md` §
  Phase 0 — "If a session ends in between, **ask again** — do not carry the
  answer in a plan file"]. Re-asked and re-confirmed 2026-08-19:
  `twin-doc: user`.
- **Watch for**: a receipt that counts instead of reads (see § The one thing the
  round-11 session changed most); any number carried forward without
  re-measuring; and **a "resolved" claim taken on trust** — three of round 11's
  six were not, and the file said they were.

## The two instruments — RUNNABLE, because an instrument with no command is a rumour

There is an untracked `scripts/lib/check-tables/` in the tree with a test
importing a module that does not exist. **It is not these instruments and it is
not this campaign's** — ignore it.

````bash
# 1 · rendered-row check — every table row's unescaped-pipe count vs its header
python3 - <<'EOF'
import re
lines=open('.planning-handoffs/orchestrate-ux/DECISIONS.md').read().split('\n')
inf=False; hdr=None; bad=[]
pipes=lambda s: len(re.findall(r'(?<!\\)\|', s))
for i,l in enumerate(lines,1):
    if l.strip().startswith('```'): inf=not inf; continue
    if inf: continue
    s=l.strip()
    if s.startswith('|') and s.endswith('|'):
        if re.fullmatch(r'\|[\s:\-|]+\|', s): continue
        nxt=lines[i].strip() if i<len(lines) else ''
        if re.fullmatch(r'\|[\s:\-|]+\|', nxt): hdr=pipes(s); continue
        if hdr is not None and pipes(s)!=hdr: bad.append((i,pipes(s),hdr))
    elif s=='': hdr=None
print('malformed rows:', bad or 'none')
EOF

# 2 · frame alignment — closing-vertical codepoint index, ONE-LINE FENCES EXCLUDED
python3 - <<'EOF'
import collections
lines=open('src/lib/study-lenses/orchestrate/ux/wireframes.md').read().split('\n')
inf=False; block=[]; blocks=[]
for i,l in enumerate(lines,1):
    if l.strip().startswith('```'):
        if inf: blocks.append(block); block=[]
        inf=not inf; continue
    if inf and l.startswith('│') and '│' in l[1:]: block.append((i,l.rindex('│')))
h=collections.Counter(); out=[]
for b in blocks:
    if len(b)<=1: continue          # single-line excerpts cannot misalign — declared exclusion
    for i,idx in b:
        h[idx]+=1
        if idx!=63: out.append((i,idx))
print('histogram:', dict(h), 'outliers:', out or 'none')
EOF
````

**Expected: `malformed rows: none` and `{63: 80}`, no outliers** [measured at
`ffc59db3`].

⚠ **The histogram figure is CAMPAIGN-SCOPED and has already gone 72 → 77 → 80.**
An earlier revision of this paragraph documented `{63: 77}`, which was true two
commits before it was written, so the first thing a fresh agent did — re-measure
at session start — returned a mismatch with no way to tell whether the tree had
drifted, the instrument had broken, or the handoff was wrong. **If your run
prints a different number and reports no outliers, the instrument is fine and
this line is stale. Update it.**

**The one-line-fence exclusion is not optional** — run without it and the scan
reports two false outliers, and a next agent chases them. **They are named here
by CONTENT, because this paragraph previously named them by line number and both
numbers pointed at prose:** the index-73 line is the control-row excerpt
`[Generate code]  [module]  [Just Enough JavaScript · fits ▾] ( ) strict` in § A
level selected, and the code fits; the index-68 line is
`[Generate code]  [script]  [Scaffold · modules only ▾]  ( ) strict` in § The
level does not admit this snippet type. Each is the only framed line of its own
one-line fenced block, so neither has a sibling to misalign against.

## Mechanics that bit THIS session

The **standing** list is § Mechanics that will bite you, in the archive, and it
is LIVE. These four are additions from this session:

- **Prettier reflows the wide `DECISIONS.md` tables on every write**, so a row
  you edited by hand will not match a literal string on the next pass. Edit rows
  programmatically (split on unescaped `|`, replace the cell, rejoin) or re-read
  the row first.
- **`--write` is safe only where the file was clean BEFORE your edit.** For the
  two twin files this was verified specifically, not assumed:
  `git show HEAD:<path> | npx prettier --check --stdin-filepath <path>`, exit 0.
- **A new drawing's padding is COMPUTED, never eyeballed.** The five framed
  lines added at `99e04692` were padded to index 63 by script, then verified.
- **A heredoc with backticks and parentheses is a trap.** Two `python3 - <<'PY'`
  splices failed on unclosed parens mid-string; writing the script to a file and
  running it is the reliable form.

> **ARCHIVE BELOW THIS LINE — WITH SIX EXEMPTIONS THAT ARE STILL LIVE.**
> Everything from § Round 9 down is a record of rounds already resolved, and
> **no task list below this point is live.** But six sections below are not
> records, and they still bind:
>
> 1. **§ Commit form** — which `DECISIONS.md` calls "the thing that actually
>    fires".
> 2. **§ Mechanics that will bite you** — the standing trap list.
> 3. **§ Sandbox checkpoints owed at Phase 1** — the only definition of T1–T10.
>    **T10 deliberately carries a retired word; see C18 before you "fix" it.**
> 4. **§ Human rulings** — the standing `twin-doc: user` / `ceremony: full`
>    declaration and the twin's three paths.
> 5. **§ What this campaign is** — cited by the live block at the top of this
>    file, and exempted by neither of this banner's previous revisions.
> 6. **§ The process failure to not repeat** — "after any fix pass, verify the
>    diff: every sentence the fix touched, plus every sentence that CITES it".
>    Named by the OTHER list and dropped by this one until now, which is the
>    whole reason there is a single list.
>
> **THIS IS THE ONLY EXEMPTION LIST.** A second one used to live further down,
> at the head of the rounds-3-to-5 archive, and the two named DIFFERENT fours —
> each omitting one section the other kept. That second list is now a pointer
> back here. An earlier revision of THIS banner said only "no task list below is
> live", and a context-free reader obeyed it and lost every exemption.

## Round 9 — PAUSE, resolved 2026-08-18

Round 9 found what nine rounds of instruments could not, and its diagnosis is
the one worth carrying: **every instrument this campaign built is region-scoped
and, in practice, column-scoped.** All three of its serious findings sat outside
that radius.

| SHA        | what                                                                          |
| ---------- | ----------------------------------------------------------------------------- |
| `20301899` | receipt amendment 5 — the block TIERS by column size · RULE                   |
| `f5824926` | **BLOCKER 1** — six behavioural `strip` sentences, four of them in the sketch |
| `da4328d1` | **BLOCKER 2** — the `recommendation` census re-run at REGION scope            |
| `964ec315` | IMPORTANT 4 + **the caption is named**                                        |
| `61aeeb1f` | a checkpoint claim in the commit above was false; corrected                   |
| `e6525c53` | IMPORTANT 5 + 6 — the gutter's home and class, the copy contract's scope      |
| `7f8f1372` | MINOR 7, 8, 9, 11 — package collisions declared, the four overhangs fixed     |

**Thirteen commits sit between `01be0e58` and HEAD and only these seven are the
campaign's** [measured 2026-08-18]. Suite unchanged at **622 passing in 22
files**; `npx tsc --noEmit` exit 0.

### The three lessons round 9 bought

1. **Scope the census to the DECISION, not to the campaign.** H6 closed after
   sweeping four files; the term was live in sixteen, including `types.ts` and
   the sketch of the library whose whole job is ranking recommendations. The
   instrument was right and its scope parameter was the failure. **Before any
   vocabulary row closes, run the term over every `.md`/`.ts`/`.tsx` under
   `orchestrate/` and file the result into the column FIRST.**
2. **The failure has moved from FILING to COLUMN CONSTRUCTION.** Two of round
   9's findings are at sites no row's column names — so the receipt rule was
   structurally unable to catch them, however well run. A column built by
   reading is scoped to what the column already says.
3. **A declaration must ENUMERATE.** The `strip` residue table declared a
   category and never listed its members, and six behavioural sentences walked
   through it. A declaration that omits a site is an empty receipt.

### And a process failure worth more than any of them

`964ec315`'s body claims markdownlint returned 0 errors. **It did not.** I ran
the checkpoints and the commit in one `&&` chain; the checks print, they do not
gate; the error was on screen while I wrote the opposite. Corrected in
`61aeeb1f`, and the false line stays in the immutable body.

**Run checkpoints as their own step and write the number the run printed.** Not
chained. `DEV.md § Sourced claims` exists because this repo's shipped falsehoods
were confident, not uncertain.

## What round 8's resolution did, and its SHA list

**Take the SHAs, never a range.** Eighteen commits sit between the baseline
`10cec890` and HEAD and only these thirteen are the campaign's [measured
2026-08-18: `git log --oneline 10cec890..HEAD` → 18; the same with the campaign
pathspecs → 13].

| SHA        | what                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| `c9a06eac` | receipt amendment 3 — a receipt prints the row's whole column · RULE      |
| `b8c8e72e` | receipt amendment 4 — widening a closed row re-opens it · RULE            |
| `dcc06ac4` | the intake checklist — two questions a commit answers · RULE              |
| `4c1a6213` | **round 8's verdict recovered, archived verbatim, all 14 findings filed** |
| `be818f9d` | a context-free audit of the above found 6 MUST-FIX; corrected             |
| `bf6866bb` | the census's sites enter every row they assert (I4, I5)                   |
| `d8caab89` | **BLOCKER 1** — the two deferral sections collapse to one home            |
| `e66c09d0` | **IMPORTANT 8** — one file owns the copy                                  |
| `664f4bde` | **BLOCKER 3** — the cause line keyed by the failing stage · RULE          |
| `aceac00b` | **BLOCKER 2** — the dispose enumeration discharged in present tense       |
| `3b12dfbb` | **IMPORTANT 6** — `recommendation` reaches the prose · RULE               |
| `b086afe6` | **IMPORTANT 7** — the sketch gains the slot contract                      |
| `8c35c977` | the six MINOR; two drawings get the top rule they never had               |

**Green baseline holds exactly: 622 passing in 22 files** [measured 2026-08-18:
`npx vitest run --project unit src/lib/study-lenses/orchestrate`]. This was a
documentation pass and should have moved no test; it did not.

## What is still open — ROUND 8'S LIST, SUPERSEDED

**Discharged. Do not work from this section.** Its item 1 was "`ar-1` round 9 —
the acceptance test"; rounds 9 AND 10 have both run. Its AR-5 item said the
timing was "the human's call"; **it was ruled 2026-08-18 — AR-5 fires at 0.2
close, not before** (see the live § What is still open beyond round 10, above).
Its item on naming the caption is done (`964ec315`). Kept because the reasoning
is auditable.

1. **`ar-1` round 9** — the acceptance test for closing 0.2. Registered agent,
   **no `model` parameter**. Tell it round 8's class-2 subject was verified at
   fifteen files, **as evidence rather than as a no-go zone**: telling a
   reviewer what not to review is how a real regression walks through.
2. **Naming the slot beneath the rail** (row C12's M12 half). Deliberately NOT
   done here: naming it shapes one of 0.3's types, and round 5's reviewer argues
   it settles B4's residue and I3's home question at the same time. That makes
   it a design decision, not a MINOR. **Put it to the human.**
3. **AR-5 is owed and has never run.** `ab9e92f8`'s own subject line says so.
   AR-5 fires at the last commit before a handoff and **no ceremony level
   removes it** [read: `DEV.md` § AR-5]. Whether the debt is discharged at 0.2
   close is the human's call — it is named here so it stops being invisible.
4. **Everything in `DECISIONS.md` § 0.3 entry conditions**, which is now the
   deferrals' only home.

## Rulings taken 2026-08-18 — binding, do not re-litigate

| #   | ruling                                                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-P | **Search for a "lost" verdict before writing it off.** It was fully recoverable. See § Mechanics that will bite you, the subagent-transcript bullet.       |
| R-Q | **`DECISIONS.md` § 0.3 entry conditions is the deferrals' home**; § Deferred to 0.3 deleted outright, no pointer stub.                                     |
| R-R | The barred cause line is **keyed by the failable stage**, not by the lifecycle phase — `entwined` is not a phase.                                          |
| R-S | The durable-home question for `DECISIONS.md` is **ruled at 0.2 close**. `DEV.md § Ruling provenance` already supplies the mechanism; no new ruling needed. |
| R-T | R-R narrowed: **two authored framings** (`tokens`, `ast`) plus one shared instrument-fault branch. `environment` can never originate a rendered cause.     |
| R-U | B2's split: `README.md` § The host surface's `strip` mention is **vocabulary**, deferred with a declared non-receipt.                                      |
| R-V | The copy's home is **`display-labels.ts` widened**, not a new `copy/` directory.                                                                           |
| R-W | **`DOCS.md` may take the slot contract** — the two-tier-autonomy trigger, approved.                                                                        |

**Read [`DECISIONS.md`](./DECISIONS.md) before this file's task list.** It is
the campaign's decision index — one row per arrangement decision, its home of
record, and every site that asserts it — plus **§ 0.3 entry conditions**, which
is the deferrals' home by ruling. Round 8's BLOCKER 1 was that _nothing in the
tree pointed at it_ [measured 2026-08-17: `grep -rn "DECISIONS"` over `src/`,
`.planning-handoffs/`, `AGENTS.principal.md`, `DEV.md` → **0** inbound hits].
This paragraph is that pointer. Do not remove it.

## The one thing round 8 changed most

**The class-2 / four-routes / overlay subject is CLOSED. Do not re-review it.**
AR-1 round 8 attacked it independently across fifteen files and could not
falsify it [relayed: `ar-1` round 8 — the carve-out reaches every enumeration,
the four routes and the seven-node roster agree at every site, and the rail's
exhaustion argument no longer runs on the retired two-route list]. That subject
drove rounds 3 through 8. It is done.

**And the recurrence is a FILING failure, not a detection failure.** Every
recurring round-8 finding traces to a skipped filing step — a decision taken
without opening a row, sites discovered by the census without being filed into
every row they assert, a closed row whose column was widened without re-opening
it. The reviewer's explicit warning: **do not build a fifth instrument.** Four
exist (phrase greps → the decisions list → the receipt rule → the region census)
and each caught its predecessor's blind spot. What is missing is a two-line
intake checklist, not a new tool.

## ROUND 8 — PAUSE, 2026-08-17. FULLY RESOLVED — ARCHIVE

**Discharged. Do not work from this section.** Its heading read "THIS IS THE
OPEN WORK" until 2026-08-19, three rounds after round 8 closed — the same
unbannered-task-list trap that `f98ae550` caught twice elsewhere in this file.
B1 landed at `d8caab89`, B2 at `aceac00b`, B3 at `664f4bde`, and the fourteen
findings are rows in [`DECISIONS.md`](./DECISIONS.md). Kept because the
reasoning is auditable.

All three blockers were verified against the tree in that session, not relayed.

### B1 · The deferral record has storage without retrieval — PART ONE FIXED HERE

**The pointer at the top of this file fixes part one** [measured 2026-08-17:
before it, `grep -rn "DECISIONS"` over `src/`, `.planning-handoffs/`,
`AGENTS.principal.md` and `DEV.md` → **0** inbound hits].

**The remaining work is INSIDE `DECISIONS.md`, not between the two files.** A
context-free validation caught an earlier revision of this section pairing the
wrong tables — read this carefully, because the arithmetic is easy to misfile:

- `DECISIONS.md` has **two** deferral sections: § Deferred to 0.3 (**8 rows**)
  and § 0.3 entry conditions (**5 rows** — I6, I8, C11, B10, F3). Missing from
  the second: the `strip` vocabulary migration, the editor-mode scrim geometry,
  the narrow-viewport degradation.
- **`RESUME.md` § DEFERRED TO 0.3 is NOT one of the two tables.** It holds a
  `strip` file-count table and six prose carry-forward bullets, and it already
  disclaims being the home. Do not go looking there for a deferral table.

**Three things must be ruled before the merge — it is not mechanical:**

1. **Which `DECISIONS.md` section survives?** R-M ruled the deferrals live in
   that file; it did not rule which of its two sections. Three home-claims
   currently form a loop (§ Deferred to 0.3 calls itself the index and points at
   `RESUME.md` for reasoning; § 0.3 entry conditions calls itself the only
   home).
2. **Five items need per-item rulings.** Four live only in `RESUME.md` §
   DEFERRED TO 0.3's bullets — the tray-entry/re-open collision, the undrawn
   editor-mode proposals and masked generator, the embody JEJ README
   `station`/`parse` staleness, and the deliberately-unactioned `l1-picker.tsx`
   comment. And **D7 is marked `0.3` in its row and appears in neither list.**
3. **The accessibility obligation is NOT a cheap add.** [read:
   `ux/wireframes.md` § What the arrangement never changes — "the structure a
   screen reader traverses comes from named regions and groups … **it is owed at
   0.3**"]. It has no decision id, `DECISIONS.md` has zero hits for it, and its
   home sentence is the **same bullet** that is G4's home of record — and **G4
   is `settled`**. So adding it means opening a new row AND re-opening a settled
   one, which is exactly the "widening a closed row does not re-open it" hole
   named below.

### B2 · The docs assert a live `strip` — RULING TAKEN, EXECUTE IT

`README.md` says, present tense: "the strip's none entry closes an open lens too
**whenever the strip itself is not masked**" and "where the **masked strip**
bars opening lenses" — while the same file retires that vocabulary and the twin
says "**This arrangement has no strip**" [all three read verbatim, 2026-08-17].

**R-N (human ruling 2026-08-17): discharge it NOW, in present tense.** The
deferral's recorded reason — that the enumeration cannot be rewritten without
`Station`'s shape — **does not hold**: the twin already names the replacement
[read: `ux/wireframes.md` — "the tray entry for the open lens is its own close
affordance"], the tray is settled (B5, B6, glossary · tray), and a station with
a tray is openable by construction, so the tray entry exists under either answer
to B10.

**THE SITE LIST — five files, and `DECISIONS.md` I6 is the authority, not this
paragraph.** An earlier revision here listed four and omitted
`editor/README.md`, which does carry it [read, verbatim: "The strip's none entry
closes an open lens too, but the strip is class 3 and inert while masked — which
is exactly why the class-2 button exists."]. Under the receipt rule an omitted
site is an empty receipt, so **walk I6's column, not this list**: `README.md`
glossary · dispose · `DOCS.md` (resolve the count by reading — it has 7 `strip`
occurrences and at least four dispose-relevant sentences; "×3" was an unverified
shorthand) · `event-bus/README.md` · `editor/README.md`.

**`DECISIONS.md` CONTRADICTS R-N AND MUST BE UPDATED IN THE SAME COMMIT.** It
still records the deferral with the disproven reason in two places (§ Deferred
to 0.3 and § 0.3 entry conditions · I6), and D6's status is still `0.3`. A
reader who follows the instruction to read `DECISIONS.md` first will defer B2.

**Why this is not tidying** [read: `DEV.md` § Phase 0 — "Can you read
`types.ts`, `README.md` and `DOCS.md` together and **fully predict** what the
implementation will do…? If not … resolve it now"]. Today those three do not
answer whether the region has a strip.

### B3 · The barred cause line is one constant, and the data has THREE origins

The contract states one string [read: `README.md` glossary · display labels —
"`the grammar broke here — <the parser's message>`"].

**Round 8 said two barring shapes. The code says more, and this is design rather
than copy** [measured 2026-08-17]:

- `src/lib/study-lenses/embody/types.ts` —
  `FailableStageName = 'tokens' | 'ast' | 'entwined' | 'environment'`.
- `src/lib/study-lenses/embody/derive-accessibility.ts` — "`ast` is barred
  **only by a tokens failure**; `environment` and `evaluation` are barred by a
  **tokens, ast, or entwining** failure."

So a cause at a barring edge can originate at `tokens`, `ast`, or `entwined`.
**"the grammar broke here" is false whenever the origin is `tokens`** — nothing
reached the grammar.

**And the obvious fix does not work.** Keying `the <barring phase> broke here`
against the five-phase order constant has **no key for `entwined`**, which is
not a lifecycle phase name at all (the five are
`source · tokens · ast · environment · evaluation`). Deriving from the label is
also out — it yields "the Tokens · spelling broke here", the reason the short
labels are authored.

**So B3 is a design question, not a rewrite**, and it is worth putting to the
human: key by **failable stage** rather than by phase, and decide what an
`entwined`-origin cause says to a learner. Mitigating but not rescuing:
`entwined`/`environment` "fail only as guarded embody defects, reported loudly".
**Also draw the spelling-broken shape in the twin** — it is asserted and never
drawn, which is how this survived eight rounds.

### The five IMPORTANT and six MINOR — RECOVERED AND TRANSCRIBED

**THIS SECTION'S ALARM IS DISCHARGED — the alarm was right and its conclusion
was wrong.** An earlier revision said "Read `ar-1` round 8's verdict for the
full text; **it is not transcribed anywhere**", and treated the eight findings
not summarized below as the round-4 "three MINOR stayed lost" failure repeating.
That was true of the **repo** and false of the machine [measured 2026-08-18:
`grep -ril "round 8" .` → this file only; `find . -iname "*AR-LOG*"` → nothing].
**The complete verdict was recovered and is archived verbatim in this file** —
see § ROUND 8'S VERDICT, AS RETURNED — and all fourteen findings are now rows in
[`DECISIONS.md`](./DECISIONS.md).

**The reason every search missed it is worth more than the findings.** A
subagent's report is neither in the repo nor in the session's own `.jsonl`; it
is in `<session-id>/subagents/*.jsonl`, which a top-level `*.jsonl` glob does
not descend into. That is now recorded as a fourth trap in § Mechanics that will
bite you. **Do not conclude a verdict is lost until you have looked there.**

The three summarized here are kept because they were the three the outgoing
session judged load-bearing, and that judgment is itself a datum:

- **The census discovered sites and nothing filed them.** `editor/README.md`
  asserts A1, two A2 roster members with their grounds, AND D6 — filed in A1
  only. `index.tsx` asserts A6 ×2, A7, A8 and D2 — filed in A1 only. Five
  newly-found files are in no row at all.
- **Two more receipt-rule holes**: a receipt block may narrow its own scope
  ("all THREE sites" against a seven-entry column), and **widening a closed
  row's column does not re-open the row** — which a census guarantees will
  happen.
- **The `recommendation` settlement (round 7's IMPORTANT 10) reached the
  glossary and nothing else, and no row was opened for it.** `README.md`
  glossary · recommendation makes `recommendation` the contract term and retires
  `proposal` except in the proposals surface's name and the `candidate`
  contrast. Two uses in `README.md` itself violate that rule (§ The composition
  root's "that proposal's opening overrides", and § What this region does not
  own's "ranks the proposals"); the twin measures 12 `proposal` to 1
  `recommendation`.

## Recommended opening move — ROUND 8'S, SUPERSEDED

**Every step below has landed. Do not work from this section.** Step 1 (the
filing checklist) is `dcc06ac4`; step 2 (transcribe round 8's findings) is
`4c1a6213`; steps 3–5 are `d8caab89`, `aceac00b`, `664f4bde`; step 6 ("re-run
`ar-1`") has run twice, as rounds 9 and 10. Its closing line — "on the next
PAUSE, do not open round 10 alone" — is discharged; round 10 was put to the
human and ran by ruling. **The live opening move is § ROUND 10, at the top.**

**A context-free agent validated this handoff and returned ten must-fix
findings; they are applied above.** Two of its findings are the reason this
order is what it is: the filing checklist must land BEFORE any decision is
taken, and steps 1–3 each need rulings the previous revision assumed away.

1. **Land the filing checklist first** — two lines appended to
   `DECISIONS.md § How to maintain it`: _did this commit take a decision? open a
   row. did it discover a site? file it into every row it asserts, and re-open
   those rows._ It is two lines and everything after it takes decisions. **Not a
   fifth instrument** — round 8's reviewer is explicit that a fifth would find a
   fifth blind spot.
2. **Transcribe round 8's five IMPORTANT and six MINOR into `DECISIONS.md`.**
   They exist only in the AR-1 verdict today, and an AR verdict is not durable.
   Do this before the fixes so the rows exist to receipt against.
3. **B1**, which needs three rulings before any merge — see § B1. Put them to
   the human together rather than one at a time.
4. **B2**, per R-N. Walk I6's column for the site list, and update
   `DECISIONS.md`'s two contradicting records in the same commit.
5. **B3**, which is design and worth putting to the human: keying by failable
   stage rather than by phase, and what an `entwined`-origin cause says.
6. Then the rest, and re-run `ar-1` — registered agent, **no `model`
   parameter**.

**One structural risk the validation named and nobody has ruled on:** the only
inbound pointer to `DECISIONS.md` in the whole tree is this file [measured
2026-08-17]. `.planning-handoffs/` is documented as transitional scaffolding
that prunes — so when this file is pruned at 0.2 close, the decision record goes
unreachable again, while § 0.3 entry conditions asserts "whoever opens 0.3 reads
this list first". **That needs a durable home or a durable pointer before 0.2
closes.**

**Round 8's reviewer says 0.2 IS closeable, and that the residue stops
regenerating once the one-home discipline reaches the two subjects that have not
had it: the copy and the `recommendation` vocabulary.**

**On the next PAUSE, do not open round 10 alone — put it to the human.**

## Rulings taken 2026-08-16 / 2026-08-17 — binding, do not re-litigate

`DECISIONS.md § Rulings this list produced` carries R-E … R-I in full. Added
since:

| #   | ruling                                                                                                                                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| R-J | The class-2 story gets ONE home (`README.md` § Enforcement); every other site **cites** rather than restates. Six restatements were cut. |
| R-K | **The receipt rule** — closing decision row _X_ requires quoting the post-fix sentence at **every** site in _X_'s `also asserts` column. |
| R-L | Keep fixing rather than closing 0.2 with a declared residue.                                                                             |
| R-M | **`DEV.md` wins over round 6's counter-proposal C** — status/migration/revision narration comes OUT of `README`/`DOCS`/`types.ts`.       |
| R-N | **Discharge the dispose enumeration NOW**, in present tense; its recorded dependency on `Station`'s shape does not hold.                 |
| R-O | Hand off at this boundary; a fresh session opens on round 8's blockers.                                                                  |

---

---

# ROUND 11'S VERDICT, AS RETURNED — ARCHIVE, NOT A TASK LIST

**Provenance, and it is not repo state.** Recovered 2026-08-19 from this
session's subagent transcript at `<session-id>/tasks/afb8f2effa9afeb9b.output`
and spliced programmatically, so it is verbatim by construction — then
HTML-unescaped, because the transcript stores `<the parser's message>` as
`&lt;…&gt;` and byte-identity to a transcript is not fidelity to what the
reviewer wrote. **Every claim below is `[relayed: ar-1 round 11]` until
re-measured.**

<!-- prettier-ignore-start -->
<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

Reviewed as: claude-opus-5[1m] | UNDETERMINED

*(The environment context states the exact model ID is `claude-opus-5[1m]`. `DEV.md § Sub-model dispatch` pins AR-1 to `opus` — an opus-tier model ran, so the pin took.)*

---

# AR-1 Round 11 — Design Challenge, `orchestrate ux` (the Rail), Phase 0 step 0.2

**Verdict: PAUSE.** Four blockers, nine importants, seven minors. This session's eight commits are the strongest of the eleven rounds — C15's inversion finding, C16's dead-code proof and the third framing's drawing are all correct against the code, and I verified them rather than relaying them. The PAUSE is not a re-litigation of round 10; every blocker below is either **new this session**, **created by this session's own edits**, or **a defect at a boundary no instrument in the campaign points at**.

I read all six documents end to end, plus `DECISIONS.md` in full, plus the four code files, plus `derive-facts.ts`, `derive-entwined.ts`, `derive-environment.ts`, `to-stage-cause.ts` and `embody/types.ts` for the framing claims.

---

## BLOCKERS

### BLOCKER 1 — `DOCS.md` now carries a 0.3 deferral note and a pointer into `.planning-handoffs/`, which R-M/R-Q closed and `DEV.md` forbids outright

`/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/study-lenses/orchestrate/DOCS.md:288-291`:

> **And the projection must therefore carry it.** Today it does not: the panel receives `cause` flattened to its message alone, and the boundary states that discard as an invariant. Widening it is a 0.3 obligation, recorded rather than discovered — see the campaign's 0.3 entry conditions.

Landed at `99e04692` [read: the commit body's §6, "a new § 0.3 entry-conditions row books the widening"].

`DEV.md § What goes in docs vs. plans vs. handoffs` names this exact shape in its forbidden list [read: `DEV.md:894-897` — "Forbidden: status snapshots, migration-phase notes … `implementation begins in phase X`"], and its quick test is "does this describe what the thing IS, or where the work currently STANDS?" — "Today it does not" is unambiguously the latter.

Worse, it re-creates the second home the campaign spent a ruling closing. `DECISIONS.md § 0.3 entry conditions` opens: "R-M (human ruling 2026-08-17) took the deferral notes back OUT of `README.md`/`DOCS.md`/`types.ts` … **R-Q (human ruling 2026-08-18) settled which of this file's two sections is the home: this one.** § Deferred to 0.3 is deleted outright rather than left as a pointer — **a stub is a second home in waiting**" [read: `DECISIONS.md:633-641`]. The clause above is a stub in `DOCS.md`, pointing at a document `R-S` already records as unreachable after 0.2 close ("`.planning-handoffs/` is documented as transitional scaffolding that prunes" [read: `DECISIONS.md:700-702`]). So `DOCS.md` will carry a dangling pointer into a pruned artifact.

**Fix:** delete the three-sentence status clause. Keep the structural claim — "the render path needs `cause.stage`; a projection carrying only the message cannot produce the right sentence", which is already stated at `:284-286` and IS end-state. The obligation stays where R-Q put it.

**Same class, milder:** `README.md:582` — "**The consequence, recorded because 0.3's types lock it**" puts a workflow-phase token in an end-state doc. Reword to "the consequence, because the union member and the drawn string are the same string".

---

### BLOCKER 2 — `the mark row` is a live contract term with no glossary entry, naming the row of **standings** with the one word the glossary spends four near-homonyms keeping off that concept

Four sites, **two of them added this session** [measured: `grep -rn "mark row\|mark-row"` over `orchestrate/` and `.planning-handoffs/orchestrate-ux/`]:

- `ux/wireframes.md:257` — "**The mark row and the caption travel together.**"
- `ux/wireframes.md:269-270` — "because the mark row and the caption travel together, an excerpt carrying the caption must carry the mark row" *(added `b3c2f0dc`)*
- `ux/wireframes.md:422` — "the rail with its mark row and the caption" *(added `99e04692`)*
- `DECISIONS.md:390` — C5's column, "the mark-row/caption invariant"

What that row draws is `▾ 2 · · · waiting waiting` — the **standing** of each station. And the README says, twice:

> **`standing` is deliberately not called a mark.** A **fit mark** is a level's four-valued classification … a standing is a projection of reachability and kit, and **no level is involved in it at all**. They would have been the fourth and fifth near-homonyms in a glossary that already keeps three apart. [read: `README.md:755-759`]

So the twin names the standings row "the mark row", and the same session's own README also writes "**bare** draws as a **bare mark** with no word at all" [read: `README.md:580`]. The word the glossary excludes from the concept is now the twin's name for the row that draws it — and it is load-bearing: the pairing rule is what legitimizes the new § The machinery breaks excerpt's shape.

This is AR-1's first two focus areas landing together: a naming collision *and* a concept the glossary never names. It is also unfiled — no `DECISIONS.md` row owns "what the row of standings is called", so the index cannot see it.

**Fix:** rename to **the standing row** at all four sites, or give `the mark row` a glossary entry that explicitly disclaims the `mark` family. Rename is cheaper and matches the glossary's own discipline. Open the row.

---

### BLOCKER 3 — the standing's drawn word has two contradictory homes, and a `types.ts` cannot be written from the README as it stands

`README.md § What lives here` and `DOCS.md § Structural constraints` both put it in one place:

> `display-labels.ts` … the tray and proposals headings, the empty-station reason with its count line, the barred phase's cause line, **the standing's drawn word**, and the blocked sentence [read: `README.md:29-33`]
> Display copy lives here. … **the standing's drawn word** … `display-labels.ts` is their one home. [read: `DOCS.md:138-144`]

`README.md § glossary · display labels` puts it somewhere else, in the same file:

> **The consequence, recorded because 0.3's types lock it**: **that string IS the union member**, so renaming the `standing` union rewrites learner copy … **The two are the same string today deliberately** [read: `README.md:578-586`]

"That string IS the union member" and "the two are the same string" are two different contracts — identity versus coincidence — asserted one clause apart, and neither is compatible with `display-labels.ts` being "their one home". An implementer at 0.3 must choose between: (a) `standing: 'openable' | 'bare' | 'waiting'` and the render site spells `waiting` — which the README's own rule forbids ("A surface that renders a string imports it; it does not spell it", `README.md:59`); (b) a `STANDING_LABELS` record in `display-labels.ts` keyed by standing — which contradicts "that string IS the union member" and "why the standing is not keyed like a fit mark"; (c) the union member re-exported from `display-labels.ts` — which nothing describes.

This is F4's whole ruling contradicted inside the file F4 settled. It is 0.2's, not 0.3's: 0.2's deliverable is prose unambiguous enough that types can be written from it.

**Fix:** rule it. The cheapest coherent answer is (b) with the coincidence broken — the union member is a machine token, the drawn word is a keyed string in `display-labels.ts`, and they happen to be spelled the same; that is exactly the discipline the region applies to `fit mark` (`'does-not-fit'` → `steps outside`) and it makes the "renaming the union rewrites learner copy" hazard structurally impossible instead of merely documented.

---

### BLOCKER 4 — the un-swept assertion FORM is **absence in the drawn surface**, and the tray/caption clause is its live instance

*(This is my answer to question 2, and it is the reason I do not think adding a fourth ring closes 0.2.)*

Every instrument this campaign has built is a **presence detector**: greps find tokens that are there; the reading list finds prose that is there; the frame instrument measures lines that are there; the census finds files that contain something. The campaign's own strongest rule is about **absence**:

> a shape asserted and never drawn is how the single-constant defect survived eight AR-1 rounds [read: `ux/wireframes.md:406-407`, and re-invoked at `:442-445` to justify this session's new drawing]

Nothing measures it. The third framing was drawn this session **by hand, one instance**, and no instrument was built — so the same class reproduces immediately, on a clause the same session restated:

**The caption's tray rule is drawn nowhere.** README and DOCS both assert it:

> A tray never takes it: a tray opens BETWEEN the rail and the caption, pushing it down along with the pane [read: `README.md:491-493`]
> And **an open tray never takes the caption**: a tray opens BETWEEN the rail and the caption, pushing it down along with the pane [read: `DOCS.md:273-275`]

§ A station's tray, open (`ux/wireframes.md:306-312`) is the only drawing of an open tray. It draws the rail, the standing row, and the tray box — and **no caption** [read, the fenced block end to end]. It is drawn in the Fresh-mount state (two lenses on `source`, four empty), which is exactly the state where the count line renders — so the one drawing that could exercise the ordering claim silently contradicts it by omission.

Running the same check across the whole twin [measured: fence-by-fence scan of `ux/wireframes.md`, classifying each block for rail line / standing row / caption]:

| clause | drawn? |
|---|---|
| rule 4 — cause line takes the caption where an edge is drawn | ✅ ×3 |
| the tray opens *between* rail and caption | ❌ **contradicted by omission at `:306-312`** |
| rule 2 — singular at one | ❌ never drawn |
| rule 3 — absent at zero | ❌ never drawn |
| "else nothing" (the caption's empty state) | ❌ never drawn |
| the caption under a masked rail | ✅ `:484-506` |

Four of the caption's own contract clauses have no drawing, in the round that ruled the caption's shape.

And the **pairing invariant is falsified by three live drawings** that show the standing row and crop the caption: § A station's tray, open (`:306-312`), § The code steps outside, under warn (`:470-475`), § The generator in the pane (`:657-667`). The stated exception covers "band excerpts" — but § The generator crosses the pane and § A station's tray shows a tray, so neither is a band excerpt. The third case added this session (`:264-271`) extends the taxonomy without re-checking the drawings it now classifies.

**Fix:** (a) add the caption row to § A station's tray, open — one line, and it is the clause's only evidence; (b) state the pairing rule as a four-way taxonomy that actually covers the drawings, or drop it to "no excerpt's cropping is a claim that the caption is gone"; (c) build the missing instrument as a table, not a grep: **clause × drawing coverage**, one row per contract clause in `glossary · the caption` and `glossary · display labels`, with the drawing that exercises it or an explicit `undrawn — <reason>`. That is the `also asserts` column's idea rotated onto the axis the drawings live on, and it costs one table.

---

## IMPORTANT

### IMPORTANT 5 — the region README declines a `copy/` directory on a premise that is factually false, and F4's one-file ruling collides with two `DEV.md` conventions

> The alternative — a `copy/` directory beside `rail/` and `guide/` — was considered and declined: these are values, not a surface, and **the region's other value file (`derive-study.ts`) is likewise flat**. [read: `README.md:61-63`]

`derive-study.ts` is a **function** file [measured: `grep -n "export" src/lib/study-lenses/orchestrate/derive-study.ts` → one hit, `:43 export default function deriveStudy(`]. `display-labels.ts` is the region's **only** value file [measured: `git ls-files 'src/lib/study-lenses/**/*labels*'` → 1 file, region-wide]. The sole stated warrant for F4's shape is a false analogy.

And the ruling itself runs against the house conventions. `DEV.md § Conventions Summary` requires **one concept per file, `kebab-case` filename matching the export**, and for value files `const NAME = …; export default NAME` [read: `AGENTS.principal.md:191-206`, restating `DEV.md § 1`]. `display-labels.ts` is now asked to hold nine families — phase labels, short labels, fit marks, nameplate forms, tray heading, proposals heading, empty-station reason, waiting count, three cause framings, the standing word, the blocked sentence — of which the filename names one, and one of which keys against a **second** vocabulary (`FailableStageName`) the file's name does not suggest. That is a new pattern introduced against a stated one, on a false premise.

**Fix:** either re-argue F4 on a true premise (the honest one is "eight tiny value files is worse than one, and no barrel file may hide them"), or accept `copy/` with one file per family and a filename-per-concept — which is what the conventions actually prescribe and what makes the two-keyspace problem legible instead of buried.

### IMPORTANT 6 — the new § The machinery breaks drawing uses a message the machine never emits

`ux/wireframes.md:429` draws `the machinery broke here, not your code — entwining failed.` Its two siblings use real parser output — `Unexpected token (2:8).` (`:340`) and `Invalid or unexpected token.` (`:398`).

There is exactly one producer of a `stage: 'entwined'` cause in the tree [measured: `grep -rn "stage: '" src/lib/study-lenses/embody/*.ts` → one hit outside `types.ts`], and its message is:

```
message: 'the syntax tree does not span its source'
```
[read: `src/lib/study-lenses/embody/derive-entwined.ts:70-75`]

So the drawn sentence a learner would actually meet is *"the machinery broke here, not your code — the syntax tree does not span its source."* — and that is a much harder case for the framing's own promise than the invented sample suggests. The document's stated standard is its own indictment: "An earlier revision drew a lens here that does not exist, which made the drawing read better and concealed exactly the finding the twin exists to surface" (`:373-374`).

**Fix:** draw the real message. The discomfort is the finding.

### IMPORTANT 7 — "here" has no referent, and the third framing's "here" can never have one

All three framings are deictic — *the spelling broke **here***, *the grammar broke **here***, *the machinery broke **here**, not your code*. The caption, by this session's own C15 reasoning, **names no station**:

> Its cause lives in the caption, which describes the rail as a whole and **names no station** [read: `ux/wireframes.md:216-218`]

For `tokens` and `ast` the word points at a station the geometry deliberately leaves **open and upstream of the edge** — B2's whole point ("a phase's own failure never bars it"). For `entwined` it points at a stage that is **not a lifecycle phase and is drawn nowhere on the rail**, which the README states in the same entry ("`entwined` … is not a lifecycle phase at all and therefore has no phase name to key against", `README.md:645-647`).

Against the copy contract's own operational test — "would a learner who never read this glossary understand it?" (`README.md:710-711`) — "here" fails: it promises a location the caption is contractually forbidden to give. C15 booked the *screen-reader* half of this cost this session and did not book the *sighted* half, which is in the drawn copy.

**Fix:** either the framings stop being deictic (*"the spelling broke — <message>"*), or the caption gains a locator and B3 is re-opened deliberately. Record it as a cost if neither.

### IMPORTANT 8 — C14's block shape rests entirely on the waiting count, and nothing justifies the waiting count existing

C14 is the session's most consequential ruling: the cause arm is a **block**, therefore `types.ts` needs a union over shapes, therefore `string | string` is banned. The block's second row is the waiting count — *"the last two phases wait for it."*

C16 **named** that string; nobody **justified** it. And it is the one derived string on the rail that restates something the rail already draws in words: each barred station draws the standing word `waiting` [read: `ux/wireframes.md:338`, `:396`, `:427`]. Contrast the count line, which explains a `·` that carries no word at all. The design's central discipline is the opposite of restatement:

> an arrangement that repeats the cause per barred phase is telling them a single truth four times [read: `ux/personas.md:74-77`]
> **one barring edge, one cause, drawn once** [read: `ux/wireframes.md:49`]

**If the waiting count goes, C14 collapses.** Both arms become one line, the shape union evaporates, and `PhaseEntry`'s existing `readonly cause: string` stops being wrong. That is a large amount of 0.3 contract riding on an unargued row — and the campaign's own intake question 1 ("did this commit take a decision?") was answered "the string had no name", not "the string should exist".

**Counter-proposal:** put the waiting count to the same test C15 put the barred station to. Either argue it (the honest argument is that `waiting` says *that* a station waits and the count says *how far* the machine got, which the geometry shows but a screen-reader traversal does not aggregate), or drop it and re-derive C14. Do not let it survive by having been named.

### IMPORTANT 9 — a third derived count is drawn on every rail, unnamed, unruled, and with an unstated predicate

`▾ 2` is drawn in eight of the fourteen fenced blocks. The README mentions it in a subordinate clause — "**openable** (the phase is reachable and something fits it, **drawn with its count**)" [read: `README.md:751`] — and gives it no name, no glossary entry, no derivation rule, and no home in `display-labels.ts`'s inventory. It is absent from C10's uncovered-strings list [read: `DECISIONS.md:428-430`].

Its predicate is genuinely ambiguous. The README says "something fits it"; `index.tsx` renders `recoverRenderableLenses(roster, phase.lenses).map(l => l.name)` [read: `src/lib/study-lenses/orchestrate/index.tsx:659-663`], i.e. lenses recovered against the joined roster — and the empty count's own definition insists "a phase whose only lens fails its applicability on this program is empty too" (`README.md:686-688`). So the kit count and the empty count must be complementary over the same predicate, and nothing says so.

This is C16's exact argument applied to the sibling C16 missed: three derived numbers on one rail, one just named because it had no name, one named long ago, one still nameless.

### IMPORTANT 10 — A14 opens a taxonomy question the class split has no rule for

A14 makes the gutter class 1 "with the editor". The class-1 criterion is "editor-based" [read: `README.md:456-457`], so the assignment is at least not incoherent — but nothing in the taxonomy says **when a part of a surface gets its own class**. The editor also consumes "completion, hover, format" through its adapter [read: `README.md:146-148`]; a hover popup fed by the selected level's data is a rendered surface by every test the gutter passes. If the gutter needs a class row, so do those, and `SurfaceClass`'s exhaustiveness argument (A13: three members, no fourth, because the split is total over "the surfaces the mask acts on") starts depending on an uncounted set.

The contrast is sharp against A3, which was forced off lineage and containment onto a four-route exhaustion argument and made to walk the routes in the twin. A14 was opened this session with no argument at all beyond placement [read: `README.md:177-181` — no class reasoning; `DECISIONS.md:266` — the row's warrant is that the census could not see it].

**Fix:** state the rule — *a surface takes a class when the mask can act on it independently of its parent*; then the gutter takes class 1 as a **part of** the class-1 editor (not a member alongside it), and the hover popup needs no row. One sentence in § Enforcement.

### IMPORTANT 11 — a fourth ring exists, and `station` — the region's most contested reclaimed word — is asserted in it in the sense H2 formally retired

The radius now names three rings: region, package's own four documents, and the **eight siblings of `orchestrate/` under `src/lib/study-lenses/`** [read: `DECISIONS.md:756-766`]. I re-ran the ring and it reproduces (`restore conformance` 0, `--sl-` 0, `none entry` 0; `gutter` 8/5 all `language-levels/`; `overlay` 14/6 all `lenses/writeme/`) [measured: `git grep -ci` per term over the eight directories].

But `src/lib/study-lenses--deprecated-architecture/` and `src/lib/embody/` are **siblings of `study-lenses/`, not of `orchestrate/`** — in no ring, and both already touched by the campaign's own 0.3 table (the `l1-picker.tsx` note; the JEJ README staleness row). In them:

- **`station` used as a synonym for `phase` — as a live TYPE — across 39 files** [measured: `git grep -cw "station\|stations" -- 'src/lib/study-lenses--deprecated-architecture'` → 39 files; e.g. `DOCS.md:135` `phase?: Station | readonly Station[];`, `lenses/README.md:94` "phases-panel station(s)"].
- The same sense in a **live, non-deprecated** file: `src/lib/embody/language-levels/just-enough-javascript/README.md:42-43` — "the phases panel's CORE **stations** (`source`, `parse`) … CORE/LL is a classification, not a **station**".

H2's ruling is exactly about this: "that sense is **formally retired** (human ruling 2026-08-15) rather than left to collide silently, because the two are one-to-one and **a reader carrying the old meaning would be right by accident forever**" [read: `README.md:766-770`].

The exhaustion argument the radius rests on generalizes from three terms that measure zero (`class [123]`, `--sl-`, `restore conformance`) to the whole vocabulary. It does not hold for `station` — and `station` is the one term whose retirement is a human ruling.

**Fix:** this does not require fixing 39 files (CP-3 stands). It requires one honest row: a fourth ring, censused for the terms the region *reclaims* rather than *narrows*, with `station` DECLARED. Closing 0.2 on "a stated radius" is only closure if the statement is true, and today it is silent about a ring that contains a retired sense as a type name.

### IMPORTANT 12 — H6's status still asserts a file count its own enumeration does not produce, in the row edited this session to make it enumerable

`DECISIONS.md:526`: "**SETTLED at REGION scope** — 27 prose violations across **9** files", followed by "**The status's own file count was wrong**: it said 27 violations across **9** files while the column enumerated **8** paths … **Corrected by ENUMERATION rather than by adjusting the numeral**".

The column's prose-violation paths at HEAD: `README.md`, `DOCS.md`, `ux/wireframes.md`, `types.ts`, `lib/recommending/DOCS.md`, `lib/recommending/README.md`, `lib/recommending/types.ts`, `lib/composing/README.md` = **8**. The two added this session are declared **not** violations ("a retrospective record"; "filed as an EXCEPTION site rather than a violation"), so they cannot be the ninth. The enumerated occurrence counts sum to **34**, not 27 (3+8+5+2+7+6+1+2) [read: the column, per-path `×N`].

So the row now carries the wrong headline *and* the note saying the headline is wrong *and* the claim that it was corrected — three mutually incompatible statuses in one cell, which is the C12 defect the third intake question exists to catch, landed by the commit that landed the third intake question.

**Fix:** replace the headline with the enumeration's own numbers, or with "counts re-measured per commit; see the column".

### IMPORTANT 13 — the frame-corner finding has been false since **before** this session's baseline, in the section this session repaired for exactly that

`DECISIONS.md:857-867` and the roll-call row MINOR 14 (`:590`) both assert, with a `[measured 2026-08-18]` tag: "There are **two** [drawings closing with `└` and no `┌`] … **Two of four full drawings are missing their top rule.**"

At HEAD: **four `┌`, four `└`, perfectly paired** — `:173/:187`, `:485/:505`, `:580/:594`, `:605/:619` [measured: corner scan of `ux/wireframes.md`]. It has been true since `8c35c977` ("docs: the six MINOR, and **two drawings get the top rule they never had**", 2026-08-18) — round 8's own resolution, and **before** this session's baseline `061af657` [measured: `git show <sha>:…/wireframes.md | grep -c '^┌'` at `061af657`, `0d9bd6d2`, HEAD → 4 at every point].

This is the *adjacent bullet* to the one `0d9bd6d2` repaired, in the same § What this list does not cover, under a commit titled "the three instruments this pass leans on were each wrong, and they are repaired before any decision rides them". A fourth instrument in the same list reports a discharged defect as live, with a measurement tag dated the day it was already false.

### IMPORTANT 14 — `types.ts:194` carries a mangled JSDoc line, in one of the three documents `DEV.md`'s read-together test names

```
 * render invariants compare against), and the opened layer's overrides (a * recommendation-opened mount's recommendation). The generator arm carries only the
```
[read: `src/lib/study-lenses/orchestrate/types.ts:194`]

A stray comment-leader mid-sentence, a joined line ~160 chars wide, and a tautology ("a recommendation-opened mount's recommendation") where the original read "a recommendation-opened mount's proposal". Introduced by `da4328d1`'s term sweep [measured: `git show da4328d1^:…/types.ts` → the two lines were `… overrides (a` / `* recommendation-opened mount's proposal).`]. Prettier does not catch it — it does not reflow JSDoc prose [measured: `npx prettier --check` over all six documents → clean].

This is the sweep-collateral class the campaign has been hunting for eleven rounds, sitting in the region's contract file, unfound by every instrument because every instrument counts *occurrences of the retired word*.

---

## MINOR

15. **Every `ux/wireframes.md` line citation in `DECISIONS.md` is stale at HEAD.** `:267`/`:361` (the single-line-excerpt exclusion, `:846-848`) are now prose; `:281-282`/`:337-338` (C14's column) are now prose and a rail row; `:160`/`:356`/`:174`/`:376`/`:464`/`:488` and the fences `:331`/`:339`, `:360`/`:362` all point elsewhere [measured: line-by-line read at HEAD]. The session added ~35 lines to the file at `99e04692` and did not re-anchor. `DEV.md § Path citations` exists for this.

16. **Third-ring census cell `the guide → 1 / 1` is 2 files at the census commit** — `lenses/parsons/DOCS.md` and `lib/questioning/LOSS-LEDGER.md` [measured: `git grep -cil "the guide" ffb4b0d8 -- <the eight sibling dirs>` → 2]. Conclusion unchanged (both polysemy), but one of seven cells in the instrument the radius closure rests on is wrong on a two-minute re-measure. (`verdict`'s 184/50 is method-sensitive; I do not assert it.)

17. **"the four count-line rules" vs "Four rules for one caption"** — `README.md:486-487` and `:700`. Three of the four are count-line rules; only rule 4 is about the caption. Under C14 the caption now has its own rules (occupancy, arm shapes, precedence) that are not among the four.

18. **`cause line` names a block; `cause arm` is an unglossed synonym.** README uses `cause line` for the whole two-row arm (`:487`, `:494`, `:502`) and `cause arm` for the same object (`:510`); DOCS uses `cause arm` (`:270`); wireframes uses "the cause arm's own second row" (`:455`). Three names, one object, and the surviving name calls a block a line — which is the naming defect `glossary · the caption` was created to end ("What is rejected is naming the SLOT after an arm").

19. **The drawn cause arm has three rows, not two.** Both parse-break drawings render a blank spacer above the message (`:339`, `:397`); the count-line drawing has none (`:178`). No contract mentions the spacer, and C14's "two rows" is the thing 0.3 will type.

20. **`· a way to study Source`** — drawn twice (`:586`, `:612`), discussed in the README as "conditional, not part of the form" (`:574-577`), given no keying rule and no home, and absent from C10's uncovered-strings list (`DECISIONS.md:428-430`). It is a distinct string from the tray heading `ways to study the <label>`.

21. **The nameplate's totality claim and its two-forms rule use different referents.** § Enforcement: "It names what the pane holds **in every occupant state, which nothing else does**" (`:234-235`). Display labels: "on the editor arm it names **the program** (`your code`); on the lens and generator arms it names **the occupant**" (`:571-573`). The route that disqualifies the rail (marks no occupant in 2 of 3 states) is stated against a noun the nameplate itself only uses in 2 of 3 states.

22. **"the band, the strip, the level UI … all stay rendered"** (`README.md:137-138`) is declared vocabulary residue whose justification — "A render list naming the surface" (`DECISIONS.md:686`) — answers the *category* question, not the *truth* question. Under the Rail the band **contains** the rail (G1), so the sentence cannot survive the rename intact: it becomes "the band, the rail, …". That is round 9's BLOCKER-1 shape ("six sentences failed the second question while passing the first"), reproduced in a row that says it now avoids it.

23. **"Three geometries, three framings … many-to-one"** (`ux/wireframes.md:52-55`) — one geometry ("everything open") has zero framings, so the relation is a partial function from 3 framings onto 2 geometries. Correct as stated, but the 3-and-3 pairing invites the very 1:1 reading the bullet exists to kill.

24. **New sketch content was written during 0.2 and is already recorded as SETTLED.** `DOCS.md § The render projection` gained the caption block, rule 4's clause, the stage-keying, and the two-keyspace claim this session; C13/C14's rows read `SETTLED`. AR-2's job is to challenge the sketch, and it will arrive at clauses the index reports as closed. No gate is removed; the rubber-stamp risk is real.

---

## Counter-proposals

**CP-α — build the clause×drawing coverage table, not a fifth ring.** Round 10's exhaustion argument is about containers; BLOCKER 4 shows the live defects are on a different axis. One table, one row per contract clause in `glossary · the caption` + `glossary · display labels` + `glossary · station`, columns `asserted at` / `drawn at` / `undrawn — reason`. It subsumes "asserted and never drawn", it makes the tray/caption gap and the singular-at-one gap visible in one pass, and it is the only instrument in this campaign that detects absence.

**CP-β — kill the coincidence, not the coupling.** For BLOCKER 3: `standing` stays a machine union; `display-labels.ts` keys `waiting → "waiting"`; the two are documented as *the same spelling by choice, not by identity*. This is exactly how `FitMark` already works (`'does-not-fit'` → `steps outside`), so it introduces nothing, and it makes "renaming the union rewrites learner copy" false instead of merely warned-about.

**CP-γ — re-derive C14 from the waiting count's justification, not from the drawings.** The drawings are evidence that the cause arm *is* two rows; they are not evidence it *should* be. Settle IMPORTANT 8 first. If the waiting count survives, C14 is right and the shape union is right. If it does not, `types.ts` gets a much simpler contract and `PhaseEntry`'s existing shape stops being a defect — a materially cheaper 0.3.

**CP-δ — one sentence for A14.** "A surface takes a class when the mask can act on it independently of its parent." The gutter then travels with the editor as part of a class-1 surface, the hover popup needs no row, and A13's exhaustiveness stops depending on an uncounted set.

**CP-ε — for the deprecated ring, declare rather than census.** One row: `station`-as-`phase` survives as a live TYPE in `src/lib/study-lenses--deprecated-architecture/` (39 files) and in `src/lib/embody/language-levels/just-enough-javascript/README.md`; DECLARED, owner = whoever retires the deprecated tree. Cost: ten minutes. Benefit: the radius statement becomes true.

---

## The five questions, answered directly

**1 · Is 0.2 closeable now?** No. Four things block it, and three of them are cheap: the `DOCS.md` deferral clause (delete three sentences), `the mark row` rename (four sites), the tray drawing's missing caption row (one line). The fourth — the standing string's two homes — needs a human ruling, not an edit. None is a redesign; total work is well under a session. What is *not* cheap and should not be rushed is IMPORTANT 8: C14 is this round's headline decision and its warrant has not been argued.

**2 · Is there an un-swept ring, term, or form?** All three. **Form:** absence in the drawn surface — the campaign has a rule against it, one hand-fixed instance, and no instrument (BLOCKER 4; four caption clauses undrawn). **Ring:** the siblings of `study-lenses/` rather than of `orchestrate/` — `study-lenses--deprecated-architecture/` and `src/lib/embody/` (IMPORTANT 11). **Term:** `station`, whose retired phase-synonym sense is a live TYPE in 39 files of that ring, against a 2026-08-15 human ruling. Round 10's "exhaustible" prediction is right about *containers* and generalizes wrongly from three terms that measure zero: the zeros reproduce (`class [123]`, `--sl-`, `restore conformance`, `none entry`), and `station`, `gutter` and `overlay` do not.

**3 · Do C14/C15/C16/A14 hold?**
- **C14** — the *ruling* holds (three documents did disagree, and `string | string` genuinely admits the concatenation defect). Its *warrant* does not: it exists only because the waiting count exists, and nothing argues that (IMPORTANT 8). Its *naming* is broken: an arm called `line` that is a block, plus an unglossed synonym `arm` (MINOR 18). And the block it types is two rows while the drawings are three (MINOR 19).
- **Geometry/framing separation** — holds, and I verified it against the code rather than the docs. `deriveAccessibility` bars `environment` and `evaluation` off `facts.entwined.ok` alone [read: `derive-accessibility.ts:38-43`], the carry chain preserves the origin stage [read: `derive-entwined.ts:56-62` — `if (!tokens.ok) return { ok: false, cause: tokens.cause }`], and `environment` derives *after* `entwined` [read: `derive-facts.ts:21-27`], so no `environment`-tagged cause can ever reach a barred phase. The many-to-one claim and the `environment`-is-unreachable strike are **both correct**. The wording (3-and-3) is loose (MINOR 23), and the drawn sample message is fabricated (IMPORTANT 6).
- **C15** — the strongest thing in the eight commits. The inversion is real, both cited passages say what the row says they say, and recording rather than fixing it is the right call.
- **C16** — the dead-code proof is **correct**: `tokens` bars 3, `ast`/`entwined` bar 2, `environment` bars 0, so a singular branch is unreachable. Verified independently.
- **A14** — the weakest. Opened with no argument, and it opens a decomposition question the class taxonomy has no rule for (IMPORTANT 10).

**4 · Can README + DOCS + types.ts predict the implementation?** `types.ts` being thin is **correctly 0.3's** — `DEV.md:2107-2112` places the read-together test at the *end* of 0.3, after types are written, and AR-1's trigger is explicitly "before `types.ts` locks the contract". That is not a defect and should not be treated as one. But the test that *is* 0.2's — can `types.ts` be written deterministically from the prose? — fails on two specific points today: the standing string's home (BLOCKER 3) and the caption arm's vocabulary/shape (BLOCKER 2 + MINOR 18/19). Both are prose ambiguities, both are 0.2's, and both will be resolved by whoever holds the keyboard at 0.3 if they are not ruled now.

**5 · Is anything this session wrote actually WRONG?** Yes, six things, and two of them are numbers presented as measured:
- `the guide → 1 / 1` in the third-ring census: **2 files** at the census commit (MINOR 16).
- H6's "27 prose violations across 9 files": the column enumerates **8** paths and **34** occurrences (IMPORTANT 12).
- "Two of four full drawings are missing their top rule": **zero** are, and have been since before the baseline (IMPORTANT 13).
- The `entwined` sample message `entwining failed.` does not exist in the tree (IMPORTANT 6).
- Every `ux/wireframes.md` line citation in `DECISIONS.md` (MINOR 15).
- Pre-existing but live in the reviewed artifact: `derive-study.ts` called "the region's other value file" (IMPORTANT 5) and the mangled `types.ts:194` (IMPORTANT 14).

Everything else I spot-checked reproduces exactly: the malformed-row check (0), the class census (15 files), the `strip` residue counts, README's `proposal` → 7, the manifest's three omissions and one phantom, `index.tsx:414`/`:654`, the untracked `evaluators/run/`, the three empty sibling-ring terms, and the frame histogram at `{63: …}` with the two single-line excerpts as its only outliers.

---

**Certainty.** High (≥90%) on BLOCKERs 1–3 and IMPORTANTs 5, 6, 11, 12, 13, 14 and every MINOR — each is a direct file read or a command I ran this session. Moderate (~70%) on BLOCKER 4's *severity* — the tray/caption omission is certain, but whether an undrawn clause blocks 0.2 or is a recorded cost is the human's call. Moderate (~65%) on IMPORTANT 8 — the waiting count may well be right; what I am confident of is that nobody has argued it and C14 depends on it. Lower (~55%) on IMPORTANT 10 — A14 is defensible under "editor-based"; the gap I am confident of is that no rule says when a part gets a class.

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

# ROUND 10'S VERDICT, AS RETURNED — ARCHIVE, NOT A TASK LIST

**Provenance, and it is not repo state.** Recovered 2026-08-18 from this
session's subagent transcript at
`<session-id>/subagents/agent-a83f8f1b68ff3d56a.jsonl` and spliced
programmatically, so it is verbatim by construction. Round 10 answers the
structural question with a MECHANISM — instruments are scoped by container,
decisions by concept, concepts cross containers — and measures the recurrence as
EXHAUSTIBLE. Every claim below is `[relayed: ar-1 round 10]` until re-measured.

<!-- prettier-ignore-start -->
<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

Reviewed as: claude-opus-5[1m]

The pin took: this ran on the `opus` tier the roster names for AR-1.

---

## AR-1 Round 10 — Design Challenge, `orchestrate ux`, Phase 0 step 0.2

Inputs read end to end: `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/study-lenses/orchestrate/README.md`, `ux/personas.md`, `ux/user-journeys.md`, `ux/wireframes.md`, `DOCS.md`, plus `.planning-handoffs/orchestrate-ux/DECISIONS.md` in full, `lib/masking/{README,DOCS,types}`, `editor/{README,DOCS}.md`, `level-ui/*`, `lib/validating/README.md`, `PHASE-1-CHECKPOINT-LEDGER.md`, `tests/index.test.tsx`, and — because that is where the answer turned out to live — `src/lib/study-lenses/{README,DOCS,WORKFLOWS,PEDAGOGY}.md` and `src/lib/study-lenses/embody/derive-accessibility.ts`.

### What verified clean (stated first, because most of it did)

Every one of these is a re-measurement, not a relay.

1. **Framed-line alignment — CONFIRMED, and your number is right.** 100 framed lines in `ux/wireframes.md`; histogram of the closing-vertical codepoint index is `{63: 98, 73: 1, 68: 1}` [measured: python frame-corner scan over fenced blocks]. The two outliers are `:267` and `:361`, both single-line band excerpts in their own one-line fenced blocks — exactly the exclusion `DECISIONS.md § What this list does not cover` declares. Round 7's four real outliers are gone.
2. **`environment` cannot originate a rendered cause — CONFIRMED against code, not against a document.** `src/lib/study-lenses/embody/derive-accessibility.ts:38-43`: `environment` and `evaluation` are both barred off `facts.entwined`, and an `environment` stage failure bars nothing ("the scope structure is terminal"). The README's claim is true and non-obvious; good work.
3. **`house token` / `--sl-` package-uniqueness — CONFIRMED wider than you measured.** `grep -rn -- "--sl-" src/` returns 2 hits, both `orchestrate/README.md:814,842`; `house token` returns one file. This holds including `.css` files (`parsons.css`, `writeme.css`), which your `.md/.ts/.tsx` census would not have read.
4. **The package-sketch verdict-compression claim — CONFIRMED.** `src/lib/study-lenses/DOCS.md` emits `level verdicts (violations · type admission · undetermined while unparsed)` as one node.
5. **M9's wording — FIXED.** `lib/masking/README.md` now reads "Class 3, every surface the mask ACTS ON that is not class 1 or class 2"; `everything else` → **0** hits [measured]. (But see IMPORTANT 6 — the row still says otherwise.)
6. **`editor/README.md`'s `strip` vocabulary — GONE**; it now says "the rail is class 3 and inert while masked" [read].
7. **`recommendation` at region scope — CLEAN in prose**, with two exceptions below. All 7 `ux/wireframes.md` hits, all 6 `README.md` hits, the `DOCS.md` hit and the `ux/personas.md` hit are the proposals surface's name or the `candidate` contrast [measured, squeezed unwrap, all `.md/.ts/.tsx` under `orchestrate/`].

---

### Concerns

#### BLOCKER 1 — Three settled decisions are contradicted one directory up, in the package's own statement of what this region is; H8 exists for exactly this and carries none of them

**Where:** `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/study-lenses/README.md:139`, `:294`, `:307`; `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/study-lenses/WORKFLOWS.md:90`.

Four measured sites, none of them in any row's `also asserts` column, none in `§ 0.3 entry conditions`, none in H8:

| site | what it says | what it contradicts |
| --- | --- | --- |
| package `README.md:294` | "and so does every control whose change can itself **restore conformance** (the selector, the strict toggle, the snippet-type toggle, the guide, the Edit code button)" | **A2 / A12.** The retired single ground, the retired heading R-E killed twice inside the region, a roster of **five** where the region's is **seven**, and both non-control members absent |
| package `README.md:139` | "every control whose change can itself restore conformance" | same, second instance |
| package `README.md:307` | "**above the pane**, the five-phase study panel, the permanent level selector, **the selected-level gutter**, the strict toggle, the snippet-type toggle, and **an embedded guide**" | **G7** (the gutter is the editor's surface, class 1, *not* in the band — opened this pass) and **G3** (the guide renders below the pane, last) |
| package `WORKFLOWS.md:90` | "returning to edit — the Edit code button, **or the strip's none entry** — disposes the lens" | **D6**, in present tense, naming the raiser this design abolishes |

**Why it matters, and why this is not the closed class-2 subject re-opened.** Round 8 closed that subject at fifteen files, all under `orchestrate/`. Every site above is *outside* that set, and two of them are invisible to every instrument this campaign owns for two independent reasons: they are out of the census root, **and** they carry no class token at all — `git grep` for `class 2` across `src/lib/study-lenses/` returns **17 files, 97 hits, all inside `orchestrate/`** [measured]. This is the failure mode `DECISIONS.md` itself names — "both of round 5's misses (B4, I2) are in prose that never uses the term being retired — no grep of any form reaches them" — reproduced at the scope ring the region census stopped at.

`WORKFLOWS.md:90` is the sharpest: it is a behavioural sentence about the dispose enumeration, in present tense, of exactly the class round 9's BLOCKER 1 blocked on, at a tenth site for a row whose status reads "SETTLED — the raiser at all **nine** enumeration sites."

**Suggested fix.** Not to edit the package documents — H8's ruling that the upward move is another campaign's is right. **Widen H8 from three reconciliations to seven, and give each an owner**, then say in `§ 0.3 entry conditions` that the region's class-2 roster, the gutter's home, the guide's position and the dispose enumeration are stated in contradiction at package scope. A declared contradiction is closeable; an undiscovered one is what 0.2 exists to prevent.

---

#### BLOCKER 2 — `the caption` was named to end a two-document synchronisation problem, and after the naming both documents still use the phrase

**Where:** the term is defined at `orchestrate/README.md:486` and carried in the sketch at `orchestrate/DOCS.md:250`. It reaches **zero** sites in the twin.

Measured, squeezed unwrap, all `.md/.ts/.tsx` under `orchestrate/`:

- `README.md:641` — the home-of-record paragraph stating the total precedence: "So **the slot beneath the rail** holds exactly one line at a time and the precedence is total…"
- `README.md:645` — "…or that competes with the cause for **the slot beneath the rail** is wrong in the same way…"
- `README.md:637` — "it yields **the slot** entirely wherever a barring edge is drawn"
- `ux/wireframes.md:293` — "the cause line owns **the slot beneath the rail** — **the empty-count line** yields"
- `ux/wireframes.md:212, 214, 390` — "**the reason line**" ×3, the third inside a drawing annotation

The caption entry's own justification is that the object had "only a seven-word phrase — 'the slot beneath the rail' — in two documents that had to stay in sync." Both documents still carry it, and the README paragraph that carries it is the one C12 names as the **home of record** for the four rules. Meanwhile the entry says the arms are `the cause line` and `the count line` and *explicitly rejects* "the reason line" — and the twin uses "the reason line" for the count arm three times, "the empty-count line" once, and `DECISIONS.md` row A9 is titled with the rejected name.

**Why it matters.** This is the round-6 pattern (`b9a534c7` swept phrases to zero and left the home of record arguing the retired position) reproduced by the round-9 fix, on the pass's own headline decision, four rounds after the instrument built to stop it. `the caption` is also a 0.3 type name — an implementer reading `ux/wireframes.md` will not find it.

**Suggested fix.** Migrate the count arm to one name (`the count line`, per the README) at `ux/wireframes.md:212, 214, 293, 390`; rewrite `README.md:637-645` and `ux/wireframes.md:293` in the caption's terms; retitle A9. Then note in C12's column that the twin is now an asserting site — it currently is not listed for the naming half at all.

---

#### IMPORTANT 3 — The caption is specified as one line and drawn as two, at the state that motivates it

**Where:** `orchestrate/README.md:486` and `orchestrate/DOCS.md:250` both say "**the one line beneath the rail**… holds **exactly one line at a time**". `orchestrate/README.md:569` says the cause arm is "the parser's own message, framed by this region, **and beneath it the count of what waits**". Both drawings render two rows:

```
│  the grammar broke here — Unexpected token (2:8).            │
│  the last two phases wait for it.                            │
```

(`ux/wireframes.md:281-282`, and the same shape at `:337-338`.)

So the slot is a one-line slot whose cause arm is a two-line block. The sketch says the structural fact 0.3 must encode is "ONE slot fed by TWO producers… That is the shape `types.ts` gives a **union** rather than two optional fields" — but a union of `string` and `string` is wrong if one arm is a pair. This is precisely the class of thing 0.2 exists to settle before types.

**Suggested fix.** Decide in prose: either the caption is a slot holding one *block* (cause arm = message + waiting count; count arm = one line), or the waiting count is a second slot beneath the caption. Say which, in the sketch, since that is where the precedence already lives.

---

#### IMPORTANT 4 — The third framing is asserted, never drawn, and the twin's projection contract still binds shape to framing one-to-one

**Where:** `orchestrate/README.md:582` authors `the machinery broke here, not your code`. Measured across all of `src/lib/study-lenses/`: **`machinery broke` appears in exactly one file, `orchestrate/README.md`, twice** — both inside that one glossary entry. The twin's only trace is the oblique parenthetical at `ux/wireframes.md:33`, "(whose stage names the framing)".

Meanwhile `ux/wireframes.md:43` still reads: "**Exactly three shapes**: everything open; grammar broken (source, tokens and ast stay open, the last two wait); spelling broken (source and tokens stay open, the last three wait)."

Against `derive-accessibility.ts`, an `entwined` failure bars `environment` and `evaluation` — the **same geometry** as the grammar case, with a **different framing**. So the shape↔framing relation is many-to-one and the contract asserts one-to-one, naming both survivors after parse errors.

**This pass wrote the rule it broke.** `ux/wireframes.md:346`: "Drawn here because **a shape asserted and never drawn is how the single-constant defect survived eight AR-1 rounds**." The third framing is now the asserted-and-undrawn one, authored in the same commit range.

**Two secondary halves of the same finding.** (a) The sketch does not carry the keying. I7's argument for putting the caption's precedence in `DOCS.md` — "what is structural… belongs here rather than only in the glossary" — applies identically to "the framing is keyed by the failing **stage**, not the barred **phase**", which is a data-read constraint, not copy. `DOCS.md:141` names "the barred phase's cause line" and says nothing about the key. (b) The copy file now keys against **two** embody vocabularies — the phase-order constant *and* `FailableStageName`, whose members include `entwined`, which is not a lifecycle phase. Nothing states that dependency; F4 settled `display-labels.ts` as the home without it.

**Suggested fix.** Correct `ux/wireframes.md:43` to separate shapes from framings; either draw the machinery case or state in `§ What has no wireframe` why it is deliberately undrawn (a guarded defect is a defensible reason — say it); add the stage-keying to the sketch beside the caption block.

---

#### IMPORTANT 5 — G7's home of record does not contain G7's decision (opened this pass)

**Where:** `DECISIONS.md` G7 names `editor/README.md` as home of record. Measured: `editor/README.md` mentions the gutter **once** — "Every diagnostic it renders — the selected-level gutter's markers included — arrives orchestrator-supplied". It never says the gutter is class 1, never says it travels with the editor, never says it does not render in the band.

The decision is actually stated at `orchestrate/README.md:177-181` — which G7 lists as an *asserting* site. The column definition is unambiguous: "home of record — the one document that OWNS the decision. Editing the decision means editing this first." An implementer editing `editor/README.md` first finds nothing to edit.

**Suggested fix.** Either write the class-1 assignment and the not-in-the-band exclusion into `editor/README.md`, or set G7's home to `orchestrate/README.md § What renders` and list `editor/README.md` as asserting. Also file the class claim into an A-row — G7's own status admits "the CLASS is stated here for the first time and **no A-row carried it**", and a class assignment living only in a G row is how the next census misses it.

---

#### IMPORTANT 6 — The index that carries the closure argument has one false status and one structurally broken row

**A1's status is falsified.** It reads `open (round 8 M9)` and asserts "`lib/masking/README.md` **still** opens class 3 as 'everything else'". Measured: `everything else` → **0** hits in that file; the fix landed at `8c35c977`, in round 8's own resolution, two rounds ago [`git log -S`]. Round 9 did not catch it; this pass did not either. A row carried as open on a discharged ground makes the "which rows are still open" count — the whole basis for judging 0.2 closeable — wrong.

**C12 is a malformed table row carrying two contradictory statuses.** `DECISIONS.md:380` has **8 pipes / 7 cells** against a header of 6 pipes / 5 cells; the delimiter row at `:368` was padded to match, so nothing lints it. The row simultaneously reads `**SETTLED IN FULL**` and, two cells later, `**open (round 8 I7 + M12)**`, with a residual fragment of the previous revision's column (`reason line`over`DOCS.md`→ **0**]…`). Introduced at `b086afe6` [`git log -S`], survived round 9, and this pass edited C12 without seeing it.

**Suggested fix.** Correct A1's status; repair C12 to five cells. Then add one line to the intake checklist: *a commit that edits a row re-reads that row as rendered* — the pipe-count defect is invisible in a diff and visible in a render.

---

#### IMPORTANT 7 — The design has silently inverted Journey 6's own complaint, and no document records it

**Where:** `ux/wireframes.md:191-199` gives every **empty** station "the same reason as visually-hidden text of its own", and gives the reason explicitly: the collective line "**names no station**, so a reader moving through them linearly hears one sentence about four phases and cannot attach it to the one they just passed."

Nothing gives a **waiting** station anything equivalent. Per `README.md:720-725`, only `waiting` has a drawn string, and the cause lives in the caption — which names no station, by the identical argument.

`ux/user-journeys.md:269-272` states the current defect as: "the _barred_ phase, by contrast, carries its cause. **The common case is served worse than the exceptional one**, which is the wrong way round." The Rail fixes the common case and, by moving the cause into a collective caption, makes the exceptional case the unattached one. That is not obviously wrong — one cause drawn once is a real decision (B3) — but it is a **new cost, unrecorded**, and the twin's job is recording costs. Under strict it compounds: `ux/wireframes.md:201-210` already books the per-station reason going dark with the rail; the barred cause goes dark in the same subtree.

**Suggested fix.** State it in `§ Fresh mount` or beside the parse-break drawing: the barred station's spoken form is the standing word alone, the cause is collective and attached to the rail, and whether that is acceptable is a checkpoint question. If it is not acceptable, the cheap answer is the same one the empty station got — per-station visually-hidden text carrying the cause — and that is a 0.3 obligation, not a layout change.

---

#### MINOR 8 — `PHASE-1-CHECKPOINT-LEDGER.md` is in the strip residue table and in no `recommendation` row

Measured: the ledger carries `proposal` **×2** in prose (`:22` — "clicking it opens the proposed lens carrying the **proposal's** config… clears the **proposal's** overrides") and `strip` **×6**. H6's `also asserts` column names nine prose files and three code files; the ledger is in neither list, while the `strip` residue table gives it an explicit row ("a retrospective record of Phase-1 observations of the LIVE DOM"). Same file, same argument, two different treatments — and one of them silently. The census that was widened to region scope reads 16 of 17.

**Fix:** one row in H6's column with the same retrospective-record declaration, or a stated rule that the ledger is out of scope for prose censuses generally.

#### MINOR 9 — "the count of what waits" is a second unnamed count, and its rules are absent

`README.md:569` says the cause arm carries "**the count of what waits**"; the drawings render "the last two phases wait for it" / "the last three phases wait for it". This is a derived, learner-facing string with no name, no home entry, and none of the four rules its sibling gets — in a glossary whose stated pride is keeping four near-homonyms of *mark* apart. It sits one line below "the count line" and is a different number over a different predicate.

Worth recording that it needs **no** singular rule and why: by `derive-accessibility.ts` the waiting suffix is always 2 or 3, so the plural is total. That is exactly the kind of fact an implementer would otherwise re-derive as a defensive branch.

#### MINOR 10 — The projection contract labels the datum with the retired term

`ux/wireframes.md:38`: `proposals    0 … N ranked recommendations of a next lens`. Every other row in that block labels data (`levels`, `the posture`, `the pane`). H6 permits `proposal` only in the *surface's* name; here it names the collection, whose contract term is `ranked recommendations`.

#### MINOR 11 — The strip residue table and its own measurement disagree

The measured line reads "`README.md` **6** · `DOCS.md` **1** · `ux/wireframes.md` 4 · `generator/README.md` 1", and the table then explains that `generator/README.md` is "NOT in this table any more". The file still carries the retired word once; it now has a home for its *ownership claim* (C1/F4) and no home for its *vocabulary*. Add the row back with the vocabulary reason, or drop it from the measured line. Same file, both halves.

*(Also noted in passing: `tests/` exists on disk and is absent from the README manifest — a second instance of F3's shape. `embody/README.md` lists its `tests/`; `lenses/spellme/README.md` does not, so there is no settled convention. One sentence in F3 disposes of it.)*

---

### Counter-proposals

#### CP-1 — Scope the census by the row's `home of record`, not by the campaign's directory. No fifth instrument.

This is the direct answer to your question 2. The fourth instrument is not blind — it is **rooted in the wrong directory**, and the root is a parameter, not a design.

Every finding in BLOCKER 1 was found by changing one argument: `os.walk('./orchestrate')` → `os.walk('.')`. The rows already tell you which root to use: a term whose home of record is `orchestrate/README.md` censuses at region scope; a term whose home is the **package** glossary — `overlay`, `verdict`, the enforcement mask, "restore conformance", the orchestrator's own contents list — censuses at package scope. H8 has already discovered three such terms; it stopped at three because it was assembled from round 9's findings rather than from the question "which of my rows have a home I do not own?"

Concretely: walk the row list once, and for each row whose home of record is outside `orchestrate/`, or whose decision *narrows* a package term, run that row's census at the owning scope. That is a bounded, one-time pass — and it is the census you already run, with a different string.

#### CP-2 — For assertions that carry no term token, read the owning document, do not grep the tree.

The second half of your column-construction problem is real and greps cannot touch it: `src/lib/study-lenses/README.md:294` asserts the class-2 roster with **no class token anywhere in the sentence**. But the answer is not a fifth instrument either — it is that the `home of record` column already names a small set of documents (by my count, under a dozen across all rows), and reading those end to end once per campaign is cheaper than any tool. Round 4's table cell, round 5's B4 and I2, and today's package README all live in documents some row already names. **The instrument for term-free assertions is a reading list, and the list is a column you already maintain.**

#### CP-3 — Close 0.2 with a stated scope boundary rather than with "no orphans remain".

The second claim is not provable by this campaign and three rounds of evidence say so. The first is: *this campaign's decisions are asserted at region scope and at package scope; it holds authority over the first and declares the second.* Under that framing BLOCKER 1 becomes four H8 rows and 0.2 closes; under the current framing it is an open defect and 0.2 cannot.

---

### Answers to the five questions

**1. Is 0.2 closeable now?** No. Two blockers. BLOCKER 2 is cheap — a term migration into the twin plus one paragraph in the README's own home of record. BLOCKER 1 is cheaper still if you take CP-3: it is four declarations, not four fixes, because the campaign has no authority over the package README and says so. What is *not* closeable is the current claim that the residue is declared — four measured sites and one behavioural sentence sit outside every declaration you have.

**2. Column construction without a fifth instrument?** Yes — CP-1 and CP-2. Not the honest-limit answer. The row already carries its own scope in the `home of record` column, and every finding I brought came from reading that column literally and following it out of the directory. Two of round 9's findings were "at sites no row's column names" — but the sites I found *are* named, one level up, by rows that already exist. Your instrument was not structurally unable to catch them; it was pointed at the wrong root.

**3. Did this pass create new defects?** Yes, three. IMPORTANT 5 (G7's home of record inverted — created by `e6525c53`). IMPORTANT 4's undrawn third framing and the shape/framing contradiction (created by `964ec315`, against a rule the same commit range wrote). And IMPORTANT 6's C12 corruption, which predates the pass but which `964ec315` edited past. BLOCKER 2 is the pass's own headline decision left unmigrated — also new.

**4. The class-2 / four-routes / overlay subject.** I accept the region-scoped closure and did not re-probe it: `class[ -][123]|surface class` gives **17 files, 97 hits, all under `orchestrate/`** [measured], and the four routes are consistent at every one I read. But the subject's *statement to the rest of the package* is not closed and was never in scope, and I disagree that "closed" can mean closed there — see BLOCKER 1, with the measurement.

**5. Is the recurrence structural?** **Yes, and it is now nameable rather than mysterious.** Round 8 said no; rounds 9 and 10 are the data that settles it.

> The instruments are scoped by **container** (a file list, then a directory). The decisions are scoped by **concept**. Concepts cross containers. Each round therefore finds its defects at the boundary the previous round's instrument stopped at: round 8 fixed a hand-written file list and round 9 found the region; round 9 fixed the region and round 10 found the package.

That is a mechanism, not bad luck, and it predicts the next round rather than being surprised by it. It also says the recurrence is **exhaustible**, which "structural" usually is not: there are only so many rings — leaf, region, package, repo — and above the package this campaign's terms stop being asserted at all (`class N` → 0 hits outside `orchestrate/`; `--sl-` → 0 files outside it, `.css` included).

What that changes about closing 0.2: closure cannot mean "the sweep found nothing", because the sweep's radius is the finding. It can mean "**the radius is named, and everything outside it is declared with an owner**" — which is what H8 already does for three terms and what CP-3 generalises to the rest.

---

### Verdict: **PAUSE**

Two blockers, both at the same root cause and both cheap once that root cause is named. The design itself is in good shape — the caption's precedence, the stage-keyed framing, the four class-2 routes and the gutter's relocation are all *correct* decisions, several of them verified against code rather than against documents. What is not in shape is where those decisions are asserted: the region says one thing and the package, one directory up, says another about the same four subjects, in the document a reader meets first.

Do not build a fifth instrument. Point the fourth one at the scope each row's own `home of record` column already names, read the handful of documents that column lists, and close 0.2 on a stated radius rather than on an absence.

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

---

# ROUND 9'S VERDICT, AS RETURNED — ARCHIVE, NOT A TASK LIST

**Provenance, and it is not repo state.** Recovered 2026-08-18 from this
session's subagent transcript at
`<session-id>/subagents/agent-a6feb71ac1e42c534.jsonl` and spliced
programmatically, so it is verbatim by construction. Round 9 is the round that
moved the diagnosis from FILING to COLUMN CONSTRUCTION. Every claim below is
`[relayed: ar-1 round 9]` until re-measured.

<!-- prettier-ignore-start -->
<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

Reviewed as: claude-opus-5[1m] | UNDETERMINED

(The `opus` pin took — `claude-opus-5[1m]` is opus-family. Round 9, AR-1 Design Challenge, `work: software · twin-doc: user · ceremony: full · prospective`. README + all three twin documents read end to end, plus `DOCS.md`, the changed sub-module docs, `types.ts`, `display-labels.ts`, `index.tsx`, both campaign artifacts, and the package README/DOCS above the region.)

---

### What I verified before judging

| claim | result |
| --- | --- |
| Round 8's fourteen findings landed | **13 of 14 landed as recorded.** BLOCKER 1 (one deferral home), BLOCKER 3 (cause line keyed), I7 (sketch slot contract), I8 (copy home), M9, M10, M12, M13, M14 all reproduce as fixed. BLOCKER 2 and I6 landed **in part** — see BLOCKER 1 and BLOCKER 2 below |
| Your correction 1 — **two** drawings lacked `┌`, not one | **Correct** [measured: `git show 10cec890:…/ux/wireframes.md` → `┌` at line-starts 160, 356; `└` at 174, 376, 464, 488. At HEAD: `┌` at 160, 385, 480, 505; `└` at 174, 405, 494, 519 — paired] |
| Your correction 2 — M11's instrument reports two false positives | **Correct** [measured: closing-vertical codepoint index per framed line over `ux/wireframes.md` → `{63: 76, 64: 4, 73: 1, 68: 1}`; the 73 and 68 are lines 267 and 361, each the only framed line in its own fence] |
| Your correction 3 — A1's column named **five** sites at `49b90dba`, not six | **Correct** [measured: `git show 49b90dba:…/DECISIONS.md` row A1 → four semicolon groups, one naming two `ux/wireframes.md` sections = five sites; seven after the census] |
| Your correction 4 — `editor/README.md` asserts **one** A2 roster member | **Correct** [read: `editor/README.md:54-57` — the Edit code button, named once as "class 2" and once as "the class-2 button"; no second roster member appears] |
| Your correction 5 — `index.tsx` asserts A6 once, D2 twice | **Correct** [measured: `never about which container` → 1; `ONE VISUAL PANE, TWO DOM` → 2] |
| The class-2 / four-routes / overlay subject | **I probed it and could not falsify it either.** [measured: every `(four\|two\|three…) (ways\|routes)` occurrence region-wide → every class-2 site carries the four-route form; the seven-node roster agrees at `README.md` § Enforcement, glossary · surface classes, `ux/wireframes.md` § What the arrangement never changes, `lib/masking/types.ts`, `guide/README.md`, `level-ui/README.md`] I spent the round elsewhere. |

**Where I did spend it: the region's two boundaries.** Every instrument this campaign built — phrase greps, the decisions list, the receipt rule, the region census — was aimed *inside* `orchestrate/` and, in practice, at the four documents someone had written down. Both blockers below are at a boundary the instruments never crossed.

---

### Concerns

#### BLOCKER 1 — The `strip` declaration covers vocabulary; six surviving sentences assert *behaviour*, and four of them are in the sketch

**Where:** `README.md:260`, `README.md:262`; `DOCS.md:129`, `:294`, `:299`, `:322`.

`aceac00b` discharged the dispose enumeration in present tense — verified, that part is clean [read: `README.md` glossary · dispose, `DOCS.md:54-56`, `DOCS.md:216` Mermaid edge, `event-bus/README.md:40`, and `editor/README.md` now says "the rail is class 3 and inert while masked"; measured: `strip` in `editor/README.md` → **0**]. The residue is then declared in a seven-row table [read: `DECISIONS.md` § 0.3 entry conditions — "The `strip` residue after I6's discharge is DECLARED … a stated non-receipt rather than a silent survivor, so round 9 meets a recorded decision"].

**The table is not the surviving set.** [measured 2026-08-18: squeezed-unwrap `strip` per file → `README.md` **8** · `DOCS.md` **5** · `ux/wireframes.md` **4** · `generator/README.md` 1]. Of README's 8, three are declared and three are the glossary · the rail lineage the table's own category covers. **Two are neither**, and both are the sentences round 8's BLOCKER 2 quoted:

- `README.md:260` — "enforcement arises in editor mode, **where the masked strip bars opening lenses**"
- `README.md:262` — "a flush-at-open whose absorbed keystrokes settle out-of-level code (**the strip was live when clicked**)"

Of DOCS.md's 5, **one** is declared ("like the strip's selects", `:291`). The other four are present-tense assertions about a live surface:

- `:129` — "Every open path is therefore vetted before the pane: **the strip offers only attached lenses**" — the sketch's enumeration of the region's open paths names the abolished surface and omits the tray.
- `:299` — "The class-2 Edit code button is the GUARANTEED way home: **the strip is class 3 and inert under a mask**" — and this is the *second sentence of the bullet whose first sentence `aceac00b` rewrote to the rail* [read: `DOCS.md:296-300`]. Half a bullet moved.
- `:294` — "as a button rather than a select, **so the strip's every-select assertions keep their meaning**".
- `:322` — "a flush-at-open that settles out-of-level code **the strip** or the Generate code button offered against the pre-flush facts".

**Why it matters.** Every justification in the declaration column answers one question — *is this the dispose enumeration?* — and none answers *is this sentence true of the design?* `:299` is a **surface-class assignment to a surface that will not exist**, in the sketch, at a site no A-row column names. `:129` is the sketch's open-path contract. Round 8's blocking argument was Phase 0's own closing test [read: `DEV.md:2108-2110` — "Can you read `types.ts`, `README.md` and `DOCS.md` together and **fully predict** what the implementation will do…? If not … resolve it now"]. Read together today, `README.md` § Enforcement and `DOCS.md` § The render projection still say a masked strip bars lens-opening and carries class 3. That is the same test failing on the same question.

**This is not re-litigating R-U.** R-U ruled on `README.md` § The host surface. None of the six sentences above was ruled on, and none of them was declared.

**Fix:** the same argument R-N accepted applies unchanged — the tray is settled (B5, B6, glossary · tray), so "the masked **rail** bars opening lenses" and "the trays offer only attached lenses" are pure present-tense end-state prose requiring nothing from `Station`'s shape. Six sentences. Then the declared table shrinks to what it honestly is: lineage plus the ledger.

---

#### BLOCKER 2 — H6 is `SETTLED` on a four-file sweep; the retired contract term is the live noun in five more documents, one of them the region's own `types.ts`

**Where:** `types.ts:167`, `:195`; `lib/recommending/DOCS.md` (whole file); `lib/recommending/README.md`; `lib/recommending/types.ts:11`; `lib/composing/README.md`.

The rule [read: `README.md` glossary · recommendation — "**the contract term**: the exported type is `Recommendation`, so the prose follows the type rather than the other way round … _Proposal_ survives only in that surface's name and in the `candidate` entry's contrast … **everywhere else in this region's prose the contract term is the one to use**"]. The row's status [read: `DECISIONS.md` H6 — "**SETTLED** — 16 violations corrected across `README.md` (3), `DOCS.md` (8) and `ux/wireframes.md` (5). **Survivors are the rule's two sanctioned exceptions only**"].

That last clause is false of the region. [measured 2026-08-18, squeezed-unwrap `proposal` / `recommendation` per file under `orchestrate/`]:

| file | proposal | recommendation |
| --- | --- | --- |
| `lib/recommending/DOCS.md` | **7** | **0** |
| `lib/recommending/README.md` | **5** | 2 |
| `lib/composing/README.md` | **2** | 4 |
| `types.ts` | **2** | 4 |
| `lib/recommending/types.ts` | **1** | 3 |
| `derive-study.ts` | 15 | 14 |
| `index.tsx` | 10 | 8 |

The sketch of the library whose entire job is ranking recommendations uses the retired word seven times, the contract term zero, **including inside its Mermaid node labels** [read: `lib/recommending/DOCS.md` — `PROPS["collected proposals<br/>…"]`, `RANKED["ranked proposals<br/>…"]`], while its own `types.ts` imports `Recommendation` and documents it as "Collected proposals". The region's host-surface `types.ts` says "the fitting lenses' **proposals**, ranked" and "a recommendation-opened mount's **proposal**". In code the concept is named `collectProposals`, `vetProposals`, `proposals`, `proposal` [read: `derive-study.ts:74, 96, 114-119`; `lib/recommending/rank-recommendations.ts:17-35`; `index.tsx:297-299, 460-467`].

**Why this is a blocker and not a nit.** It is AR-1's first focus area, measured: the ubiquitous language in the README does not align with the rest of the codebase, and the misalignment is a synonym for an *exported type*. `types.ts` is one of the three documents `DEV.md:2108` names. And the failure mode is the campaign's own, exactly: [read: `DECISIONS.md` § A — "The census below is the first one run over the **REGION** rather than over a chosen file list — every previous count sampled a list someone had written down, which is why the site set grew in four consecutive rounds"]. `3b12dfbb`'s own measurement block lists four files. Sixteen files under `orchestrate/` carry the term. The census lesson was learned for the class decision and not transferred to the next vocabulary decision taken in the same pass.

**Fix:** run the census instrument at its stated scope for this term before closing H6 — the instrument is right, its scope parameter is what failed. Then decide the code half deliberately (a rename of `collectProposals`/`vetProposals`/the `proposals` parameters is 0.3's, and should be an entry condition rather than a discovery).

---

#### IMPORTANT 3 — The receipt rule ran in one of six row-closing commits, and receipt amendment 3 was violated by the second commit after it landed

**Where:** commit bodies of `bf6866bb`, `e66c09d0`, `664f4bde`, `3b12dfbb`, `b086afe6`, `8c35c977`.

[measured 2026-08-18: `git log -1 --format='%B' <sha> | grep -c RECEIPT` across the thirteen campaign SHAs → `aceac00b` **3**, `bf6866bb` 1, `b8c8e72e` 1, **all others 0**]. Row-closing commits and their receipt blocks:

| commit | closes | receipt block |
| --- | --- | --- |
| `aceac00b` | D6 | **yes** — column walked, misses declared |
| `bf6866bb` | A2, A6, A7, D2 (re-close under amendment 4) | no — "**the receipts are the status cells**" |
| `e66c09d0` | F4 | no |
| `664f4bde` | C13 | no |
| `3b12dfbb` | H6 | no |
| `b086afe6` | C12's I7 half | no |
| `8c35c977` | H7 | no |

`bf6866bb` is the sharp one. A2's `also asserts` column carries **16 entries** [read: `DECISIONS.md` A2]; its status cell receipts the **seven** that entered this round ("Seven sites entered the column; each was read and each agrees with § Enforcement"). That is amendment 3's banned move, stated in its own words — "**No scoping phrase may narrow the printed set.** A fix that genuinely touches less than the whole row still prints the whole column, with `— NO RECEIPT: unchanged, this fix does not touch it` against the rest" — committed five commits after the amendment landed (`c9a06eac`), by the commit that lands amendment 4's first use.

**This is round 8's own falsification criterion firing.** You asked whether the three amendments plus a checklist were the right answer or a fifth instrument in a costume. Neither: no new instrument was built (correct), but the amendments hardened a rule that then ran in one of six opportunities and was violated in its first post-amendment use. `DECISIONS.md` predicted this in its own text — "**nothing enforces a checklist** … It is not worth believing it fires on its own" — and the same is now measurably true of the receipt block. A four-amendment rule that prints one line per site for a sixteen-site column is expensive enough that five of six commits substituted narrative for it.

**Honest limit on severity:** neither blocker above would have been caught by a correctly-run receipt block, because in both cases the column does not name the site. So the receipt rule's non-application cost nothing measurable *this* round. It is IMPORTANT, not BLOCKER — but it means the argument "0.2 is closeable because the closing discipline works" has no evidence behind it, since the discipline was not exercised.

---

#### IMPORTANT 4 — BLOCKER 3's fix orphaned the twin's projection contract, and the third framing has no string and no entry condition

**Where:** `ux/wireframes.md:32`, `:43-45`; `README.md:553-562`.

The README now keys the cause line by the failing stage and records a third branch [read: `README.md` — "`entwined` and `environment` fail only as guarded defects of the embodiment, reported loudly, so they take **one shared framing** that names a fault in the instrument rather than in the learner's program"]. That branch is reachable and draws a barring edge [read: `embody/derive-accessibility.ts` — `environment` and `evaluation` are `facts.entwined.ok ? accessible : {accessible: false, cause: facts.entwined.cause}`].

The twin's projection contract — the section that says "The region is handed exactly this, per settle, and **may draw nothing that is not here**" — still says every barred phase's cause is the parser's [read: `ux/wireframes.md:32` — "`accessible` → false, plus one cause **(the parser's message)**"]. Under an `entwined` origin it is not the parser's message; it is an instrument fault. **C13's `also asserts` column does not name that section** [read: `DECISIONS.md` C13 — the column names § The parse breaks, § The spelling breaks, and glossary · the barring edge], so no receipt could have caught it. This is the campaign's signature failure reproduced by the commit that fixed a blocker — which is a direct answer to your question 3: **yes, this pass generated a finding of its own, and it did so at a site the row's column does not carry.**

Secondary, and it is the same defect one level down: the instrument-fault framing is **described and not authored**. Two framings are in the table; the third has no string, no key, and no row in § 0.3 entry conditions. C13's row calls it "not learner copy" — but it renders in the slot beneath the rail, where the learner reads it. The entry's own discipline names this failure mode: "a rule that happens to work on five labels would silently return the whole string for the sixth".

---

#### IMPORTANT 5 — F4's fix reached `README.md` § What lives here and not the sketch, and the manifest omits two of the families the entry itself enumerates

**Where:** `DOCS.md:138-140`; `README.md:26-31` against `README.md:513-577`.

`DOCS.md` § Structural constraints still scopes the region's copy concern to six strings [read: `DOCS.md:138` — "**Display labels live here.** The five phases' learner-facing labels and the none-state's display string are this region's presentation concern"], after `e66c09d0` widened the contract to seven-plus families with one home. `DOCS.md` § Structural constraints appears in **neither** F4's nor C1's column, so nothing pointed at it. Same shape as IMPORTANT 4, same round, different row.

And the manifest enumeration is short of the entry it claims to mirror. § What lives here names "the phase labels and short labels, the fit marks, the nameplate's two forms, the tray and proposals headings, the empty-station reason with its count line, and the barred phase's cause line" — while glossary · display labels also enumerates, under "**What else this entry owns, enumerated so the inventory is checkable**": **the standing's drawn word (`waiting`)** and **the blocked sentence with its ordered three ways out**. Neither is in the manifest. An inventory whose stated purpose is checkability is missing two of nine items.

Third: § 0.3 entry conditions carries the widening only as C11 — "`display-labels.ts` carries **one** string per phase; the contract says two." A 0.3 reader is told to add a second string per phase. What is actually owed is a file that becomes the home of nine copy families, including a two-row keyed framing table and a sentence whose word order is contract. And the none-state string the docs already assign it is a literal at the render site today [measured: `index.tsx:414` — `noneLabel="plain JavaScript"`], which is the first counter-example to the new rule "A surface that renders a string imports it; it does not spell it."

---

#### IMPORTANT 6 — `gutter`: six assertions, no glossary entry, no surface class, no decision row, and § What renders puts it in the wrong place

**Where:** `README.md:175` against `DOCS.md:88`, `editor/README.md:41-43`, `level-ui/README.md:52`, `level-ui/DOCS.md:64`, `lib/validating/README.md:25`.

[measured: `gutter` under `study-lenses/` excluding the deprecated tree → 6 sites inside `orchestrate/` plus 8 above it in the package and level docs; **0** hits in `DECISIONS.md` and `RESUME.md`.]

Every other site makes it the **editor's** surface, and `level-ui` explicitly disowns it [read: `level-ui/README.md:52` — "What this surface does not own … **the editor gutter (the editor's**, fed by the shared validate)"]. The region README's § What renders puts it in the level-UI bullet: [read: `README.md:173-175` — "**The level UI** — the selector … Beside it: **the selected-level-only gutter** and the strict toggle"]. A reader takes "beside it" as beside the selector, in the band.

**That is not cosmetic, and the twin is why.** Journey 4's whole argument is that the mark is "up in the band, away from the text it is a verdict about", and the gutter is what fixes it — [read: `ux/user-journeys.md:167` — "**The arrangement is being chosen in the absence of the surface that would most change what the band is for**"]. If the gutter is in the editor it is class 1 and survives strict beside the code; if it is beside the selector, it sits in the control row, whose members "deliberately differ" in class and where nothing assigns it one. It appears in **no** surface-class enumeration and in **no** decision row — while the twin records it as the largest unbuilt dependency of the arrangement itself. Under the file's own rule ("A sentence asserting no decision on this list is invisible to it. When you find one, the decision is missing — add the row"), this is a missing row that nine rounds of region-scoped greps could not see, because the word never collided with anything they searched for.

---

#### MINOR 7 — Two collisions with the *package* glossary, which no census covered

- **`overlay`.** The package glossary defines the mask *as* the overlay [read: `../README.md` — "**enforcement mask** — the strict-posture **overlay** across the maskable surfaces"]. The region narrows it to the apparatus laid over covered surfaces, and the A13/`apparatus` argument depends on that narrowing being total [read: `README.md` glossary · apparatus]. One word, two scopes, in the two documents that own the ubiquitous language.
- **`verdict`.** The package says the mask's trigger is "the selected level's **verdict**"; the region says the mask crosses the selected level's **assessment**, and keeps four near-homonyms apart on exactly that distinction. The region declares the divergence against the *package sketch* ("The package sketch's verdicts node compresses verdict and type admission into one label; this region splits them") and not against the package **glossary**, which is the home of record for the term.

Both are cheap: one sentence each, either in the region's glossary or upward.

#### MINOR 8 — The region mints a package-scoped presentation vocabulary with no package home

[measured: `house token`, `--sl-`, `tone` across `study-lenses/` → **`orchestrate/README.md` only** (5 / 2 / 2), plus one `tone` in `ux/wireframes.md`.] `house token` is defined as "a CSS custom property, prefix `--sl-`, naming one of **this package's** own presentation concepts", lenses in sibling regions are invited to adopt it, and the entry admits the region cannot rule for them ("Making the cascade package-wide is a migration with named files, **owed to whichever campaign claims it**, not a rule this region can declare on another's behalf"). This is the AR-1 bounded-context bullet: the module is doing slightly too much — minting a package-prefixed namespace from a region document. H5 is `settled` and appears in no 0.3 entry condition, so the boundary question dies when the campaign prunes. Either move `house token` / `house token defaulting` up to the package glossary and keep `tone` here, or open a row so the migration has an owner.

#### MINOR 9 — The four overhanging framed lines persist

[measured: closing-vertical index over `ux/wireframes.md` with single-line fences excluded → lines **161, 371, 387, 482**, all closing `strict│` at index 64 where their siblings close at 63]. Recorded and declared; one space each. Line 371 is the worst case — a three-line block where it is the only outlier.

#### MINOR 10 — One of the two judgment calls in the strip table is misfiled (your question 4)

`README.md` § The host surface: **the call is defensible**, with one correction owed at 0.3 — the no-headings claim is stated of "the lifecycle strip", and the Rail introduces a *tray label* the strip never had. The twin already covers it [read: `ux/wireframes.md` § What the arrangement never changes — "Every station name **and tray label** is inline text"]. So the sentence is not a rename at 0.3; it is a rename plus a widening.

`generator/README.md`: **the call is wrong.** [read: `generator/README.md:271-273` — "`Evaluation · run` is **the lifecycle strip's own display label**"]. That is an ownership claim about a display label, and C1 + F4 settled this pass that the labels are keyed in `display-labels.ts` and owned by the region, drawn by the rail — no surface owns them. It belongs in C1's and F4's columns, not in a strip-vocabulary table; `generator/README.md` appears in neither [read: `DECISIONS.md` C1, F4 columns].

#### MINOR 11 — `waiting` is drawn as its own contract token

The standing's drawn string *is* the enum member, deliberately un-keyed [read: `README.md` — "Only one of the three has a string, which is why the standing is not keyed like a fit mark"]. The argument is made and it is a good one. The consequence is not recorded: a rename of the `standing` union silently rewrites learner copy, in a region whose display-copy discipline exists precisely so that cannot happen. One sentence in the entry — *the two are the same string today and a rename is a copy change* — costs nothing and is the kind of thing 0.3's types lock.

---

### Counter-proposals

**CP-1 — Census per decided term, not per campaign.** The census is the right instrument; its scope was set once and never re-used. Before any vocabulary row closes, run the term over every `.md`/`.ts`/`.tsx` under `orchestrate/` and file the result into the row's column *first*, then fix. H6's sweep touched 4 of the 16 files carrying the term; BLOCKER 2 is the whole of that gap. This is not a fifth instrument — it is the fourth one, used again.

**CP-2 — Finish the strip, do not re-declare it.** Six behavioural sentences (BLOCKER 1). R-N's argument covers all six unchanged: the tray is settled, so naming the rail and its trays needs nothing from `Station`'s shape. Then the declared table reduces to genuine lineage plus the checkpoint ledger, and it can be *checked* — today it cannot, because it does not enumerate the survivors it claims to declare.

**CP-3 — Name the slot now.** (Your question 5.) The rationale for holding — "naming it shapes one of 0.3's types" — is true of `station`, `standing`, `the barring edge`, `pane occupant` and `assessment`, all of which were named at 0.2 for the same reason: **shaping 0.3's types is what 0.2 is for.** The cost of holding is already visible: two documents now carry the contract, both refer to the object by the same seven-word phrase [read: `README.md` glossary · display labels and `DOCS.md:246`], and `DOCS.md` describes it structurally ("ONE slot is fed by TWO producers with a total order between them") without a noun to hang the union on. The same pass just closed two of M12's three unnamed concepts by adding glossary entries; the third is deferred on a reason the other two would have failed. Name it, in the same commit that fixes IMPORTANT 4, so the cause-line branch and the slot are settled together.

**CP-4 — Make the receipt block cheap or make it generated.** Five of six closures substituted narrative for it, which is the observable form of "the rule is now too expensive to run". Two honest options: (a) generate the block from the row with a script — the column is a semicolon-delimited cell and the receipt is a quotation per entry, which is scriptable; or (b) keep the block for rows above some column size and require a one-line `column walked: N sites, M receipts, K declared` for the rest. To be explicit about the governance line: this is a campaign-artifact format, not a gate — `DEV.md § ceremony` is untouched either way, and I am not proposing that any review be lightened.

**CP-5 — Open two rows before 0.2 closes:** the gutter's home and class (IMPORTANT 6), and the instrument-fault framing's string (IMPORTANT 4). Both are contract-shaped, both are invisible to every existing instrument, and both will be discovered by whoever writes `types.ts` if they are not written down.

---

### Answers to your five questions

1. **Is 0.2 closeable now?** **No.** Three things block it, in order: BLOCKER 1 (six behavioural `strip` sentences, four in the sketch, undeclared — `DEV.md:2108`'s read-together test still fails on the same question round 8 named), BLOCKER 2 (`recommendation` is the contract term at four documents and the retired synonym at five more, including `types.ts`), and IMPORTANT 4 (the twin's projection contract still says every cause is the parser's message). None needs a ruling; all three are prose against a measurement. R-S is a fourth, and it is yours by construction — the durable home for `DECISIONS.md` is ruled *at* 0.2 close [measured: inbound `DECISIONS` references across `src/`, `.planning-handoffs/`, both AGENTS files, `DEV.md`, `HUMANS.md` → **`RESUME.md` only**].

2. **Was the answer to round 8 right, or a fifth instrument in a costume?** The diagnosis was right and no fifth instrument was built — that part held. But the answer did not work, and round 8's own predicted symptom fired: the receipt rule ran in **1 of 6** closures and was violated in its first post-amendment use (IMPORTANT 3). More consequentially, "the instruments work and the intake does not" is now half falsified. Two of this round's findings (IMPORTANT 4, IMPORTANT 5) are at sites **no column names**, and BLOCKER 2 is at files **no census reached** — that is a detection gap at a scope, not a filing gap. The checklist could not have caught any of the three. What the campaign needs is not a fifth tool and not a sixth rule, but the fourth tool aimed at each decision it closes.

3. **Did any fix in this pass create a new defect?** **Yes, twice, and both are the campaign's signature.** BLOCKER 3's fix (`664f4bde`) left `ux/wireframes.md:32` asserting a cause shape the fix retired. IMPORTANT 8's fix (`e66c09d0`) left `DOCS.md:138` scoping the copy concern to six strings. In both cases the orphaned site is absent from the row's `also asserts` column, so the closing discipline was structurally unable to catch them. The instruments' failure mode has moved from *filing* to *column construction* — the column is built by reading, and the reading is scoped to what the column already says.

4. **Is the behaviour/vocabulary line drawn correctly?** Not quite. `README.md` § The host surface is a defensible vocabulary call that owes a widening at 0.3, not just a rename (MINOR 10). `generator/README.md` is misfiled — it is a display-label **ownership** claim contradicted by C1/F4, not strip vocabulary, and it belongs in those rows. And the line itself is drawn in the wrong place: the six sentences in BLOCKER 1 were never classified at all, and four of them are in the sketch.

5. **Is holding the slot's name right?** **No — name it.** The deferral's reason ("naming it shapes one of 0.3's types") is the reason to name it, and it is the reason `station`, `standing`, `pane occupant` and `assessment` were all named at 0.2. The object now has a total precedence rule, two producers, and two documents that carry it — and no noun, which is the exact condition A11 (the nameplate's placement) was in when it had no home. Cost of naming: one glossary entry, today. Cost of holding: every sentence about it repeats a phrase in two homes that must stay in sync, and the union it implies gets invented by whoever writes `types.ts` first.

---

### Verdict: **PAUSE**

Two blockers, and neither is the subject that drove rounds 3 through 8 — I probed that subject and agree it is closed. What this round found is that the campaign's instruments are all region-scoped and, in practice, column-scoped: **`orchestrate/` has sixteen files carrying `proposal` and the sweep read four; the sketch has five `strip` sentences and the declaration named one; two blocker fixes orphaned sites their own rows do not list.** All three are the same failure at a different radius, and all three are mechanically closable — the census reaches every one of them if it is pointed at the decision instead of at the campaign.

The recurrence is still not structural, and I want to be as precise as round 8 was about that: nothing here licenses closing 0.2 with a shrug. BLOCKER 1 is six sentences. BLOCKER 2 is one census plus a rewrite. IMPORTANT 4 is one line in the twin plus one row. What would make round 10 inevitable is closing 0.2 while the receipt block remains a rule nobody runs — because then the next round's findings will again be sites no column names, and there will be no discipline left that could have named them.

**Files:** `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/study-lenses/orchestrate/README.md`, `.../DOCS.md`, `.../types.ts`, `.../display-labels.ts`, `.../index.tsx`, `.../ux/personas.md`, `.../ux/user-journeys.md`, `.../ux/wireframes.md`, `.../editor/README.md`, `.../level-ui/README.md`, `.../generator/README.md`, `.../lib/recommending/README.md`, `.../lib/recommending/DOCS.md`, `.../lib/recommending/types.ts`, `.../lib/composing/README.md`, `.../derive-study.ts`, `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/study-lenses/README.md`, `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/study-lenses/embody/derive-accessibility.ts`, `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/.planning-handoffs/orchestrate-ux/DECISIONS.md`, `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/.planning-handoffs/orchestrate-ux/RESUME.md`.

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

---

# ROUND 8'S VERDICT, AS RETURNED — ARCHIVE, NOT A TASK LIST

**The task list is § ROUND 8 above. This is the source it was written from**,
kept verbatim because the reasoning is auditable and because this campaign has
twice discovered that an AR verdict's own summary loses findings — round 4's
three MINOR, and round 8's eight.

**Provenance, and it is not repo state.** Recovered 2026-08-18 from the outgoing
session's subagent transcript at
`~/.claude/projects/-Users-master-…-0-curricula/b064dad5-5193-40a6-91bb-a41621faf5ff/subagents/agent-a1e392afa05d8202e.jsonl`,
spliced into this file programmatically rather than retyped, so it is verbatim
by construction. Two independent agents located the same report and its
signature is tight: exactly three `BLOCKER n`, five `IMPORTANT n`, six
`MINOR n`, self-identifying as "Round 8, AR-1 Design Challenge". **A transcript
is never `[read:]` evidence for repo state** [read: `DEV.md` § Sourced claims] —
every claim below is `[relayed: ar-1 round 8]` until re-measured, and the rows
in `DECISIONS.md` carry that tag.

**Five of its claims were re-measured at HEAD 2026-08-18 and all five
reproduce** — I6's four count pairs exactly, I7's zero hits, M9's one, M10's
two, M13's eight. **Two of its claims were re-measured and found UNDERSTATED**,
both recorded in the rows rather than here: M14 names one drawing missing its
`┌` and there are two, and M11's instrument reports two false positives unless
single-line band excerpts are excluded.

<!-- prettier-ignore-start -->
<!-- markdownlint-capture -->
<!-- markdownlint-disable -->

Reviewed as: claude-opus-5[1m] | UNDETERMINED

(The `opus` pin took — `claude-opus-5[1m]` is opus-family. Round 8, AR-1 Design Challenge, `work: software · twin-doc: user · ceremony: full · prospective`. Twin present and reviewed with the README, per `DEV.md § AR-1`.)

---

### What I verified independently before judging

| claim | result |
| --- | --- |
| Region-wide class census, 15 files | **Reproduces exactly**, case-insensitively [measured: per-file `tr '\n' ' ' \| tr -s ' ' \| grep -oiE 'class 1\|class 2\|class 3\|class-[123]'` over every `.md`/`.ts`/`.tsx` under `orchestrate/` → `README.md` 26 · `ux/wireframes.md` 22 · `index.tsx` 8 · `DOCS.md` 7 · `lib/masking/README.md` 5 · `editor/README.md` 4 · `PHASE-1-CHECKPOINT-LEDGER.md` 2 · nine files at 1]. Case-sensitively it is 15 files with lower counts — the census's numbers are the case-insensitive ones. |
| BLOCKER 1's carve-out reaches every three-way enumeration | **Confirmed.** Four full enumerations exist (`README.md` ×2, `lib/masking/README.md`, `lib/masking/types.ts`); all four name the carve-out [measured: `grep -oiE '.{60}every other surface.{110}'` and `'.{90}everything else.{90}'` region-wide]. No site omits the exception. |
| Four routes / seven nodes agree across sites | **Confirmed.** `ux/wireframes.md` § The parts, § Strict covering, § What the arrangement never changes, § Fresh mount, `guide/README.md`, `level-ui/README.md`, `lib/masking/*` all carry the four-route form; the strict-toggle falsehood is gone from `level-ui/README.md` [read: `level-ui/README.md` — "never masked, because both **act on the boundary** … Only the first of those restores conformance"]. |
| M15 (`DEV.md` is an F3 site) | **Confirmed** [read: `DEV.md:776-777` — "`orchestrate/phases-panel/`, `orchestrate/dock/`"; measured: `find src -type d -name dock` → only `study-lenses--deprecated-architecture/orchestrate/dock`]. |
| M14 (four overhanging fenced lines) | **Confirmed and now measurable** — see MINOR 11. Your call not to fix was defensible; the finding itself was right. |

The subject rounds 3–8 have all been about — class 2, the routes, the overlay — is **clean**. I could not falsify it at any of the 15 sites. What follows is elsewhere.

---

### Concerns

#### BLOCKER 1 — R-M's relocation put the deferral record where nothing points, and § 0.3 entry conditions is a strict subset of the deferrals it claims to own

**Where:** `.planning-handoffs/orchestrate-ux/DECISIONS.md:400-413` (§ 0.3 entry conditions), `.planning-handoffs/orchestrate-ux/RESUME.md:3-34, 768`.

**What.** Three measured facts, each independently sufficient:

1. **Nothing anywhere references `DECISIONS.md`** [measured: `grep -rn "DECISIONS" --include='*.md' --include='*.ts' --include='*.tsx' src/ .planning-handoffs/ AGENTS.principal.md DEV.md` excluding the file itself → **0 hits**]. Not `RESUME.md`, not the region, not governance. The section says "**whoever opens 0.3 reads this list first**" and no artifact in the tree tells them it exists.
2. **`RESUME.md` — the campaign's canonical resumption record, and the one a handoff points at — is stale at round 5 and claims the homehood R-M gave away.** [read: `RESUME.md:5-12` — "AR-1 **ROUND 5** HAS RUN AND RETURNED PAUSE … **Your first task is § ROUND 5 below.** It is the open work and it is the only task list in this file"; `RESUME.md:768` — "## DEFERRED TO 0.3 — **this record is the deferral's only durable home**"]. Compare `DECISIONS.md:400` — "**the deferrals' only home, by ruling**". Two files, same claim, different memberships, and the reachable one is three rounds out of date [measured: `git log --oneline -3 -- .planning-handoffs/orchestrate-ux/RESUME.md` → `9601606f` "round 5's PAUSE lands"].
3. **§ 0.3 entry conditions carries five rows where § Deferred to 0.3 carries eight**, and at least one 0.3 obligation is in neither. Missing from the entry conditions: the strip vocabulary migration (as its own item), the editor-mode scrim geometry, the narrow-viewport degradation. Missing from **both**: the accessibility-structure obligation [read: `ux/wireframes.md` § What the arrangement never changes — "the structure a screen reader traverses comes from named regions and groups rather than from a heading outline — which is the only route left once the outline is spent, and **it is owed at 0.3**"]. That is a deliverable owed to the reader Journeys 5 and 6 exist for, with no row and no entry condition.

**Why it matters.** This is the direct answer to your question 1, and it is no: the new section is not sufficient for someone opening 0.3 cold, because a cold reader cannot find it, and if they find it they get five of at least nine obligations. R-M's premise — "NOTHING IS LOST — all of it is carried by DECISIONS.md, RESUME.md and the commit bodies" [read: `49b90dba` body] — holds for *storage* and fails for *retrieval*. The removed DOCS.md block quote named this exact reader: "this note is what makes the split legible to **a reader who never opens the campaign's own records**" [read: `git show 49b90dba` diff, `DOCS.md` removed lines]. R-M deleted the note and moved its content into a campaign record.

**Certainty:** high on all three measurements; high that this blocks a cold 0.3 open.

**Fix:** see CP-B.

---

#### BLOCKER 2 — The end-state docs assert a live `strip`, the design abolishes it, and the only in-tree marker was removed

**Where:** `README.md` § What renders (l.119), § Enforcement (l.247), glossary · dispose (l.359), glossary · edit-return, glossary · the rail (l.581); `DOCS.md` § Execution phases 4 (l.54), § The render projection (l.274-278); against `README.md` § What lives here (l.18-42) and `ux/wireframes.md:509` .

**What.** `strip` counts at HEAD [measured: squeezed-unwrap `grep -oE 'strip'` per file]: `README.md` **13** · `DOCS.md` **7** · `PHASE-1-CHECKPOINT-LEDGER.md` 6 · `editor/README.md` 2 · `event-bus/README.md` 1 · `generator/README.md` 1 · `phases-panel/**` 17 · `tests/index.test.tsx` 13.

The contradiction is inside one document:

- `README.md` § What lives here lists `rail/` and no strip.
- `README.md` glossary · the rail: "**Supersedes the lifecycle strip** … the strip's own vocabulary is **retired** with it".
- `README.md` § What renders, three hundred lines earlier: "the strip's none entry closes an open lens too **whenever the strip itself is not masked**" — present tense, normative, describing a surface the same document retires.
- `README.md` § Enforcement: "enforcement arises in editor mode, **where the masked strip bars opening lenses**".
- `ux/wireframes.md` § An excursion open: "**This arrangement has no strip**".

`49b90dba` removed the two block quotes that reconciled these, on the grounds that `DEV.md` forbids migration-phase notes in end-state docs. **The reading is textually right and applies the rule to the wrong sentence.** `DEV.md § What goes in docs vs. plans vs. handoffs` forbids "migration-phase notes" — but under `prospective`, *the strip prose itself* is the status narration: it describes where the work currently stands, not what the region IS. The correct application removes the **strip**, not the **label on the strip**. R-M removed the mitigation and left the larger violation.

The governance hook that makes this a blocker rather than a taste question is Phase 0's own closing test [read: `DEV.md:2108-2110` — "Can you read `types.ts`, `README.md` and `DOCS.md` together and **fully predict** what the implementation will do and what shape it will take? If not, the ambiguity will surface as a bug or a structural mess — **resolve it now**"]. Today those three documents do not answer whether the region has a strip.

**On judging R-M's reversal on its merits, as asked:** the *ruling* stands — I am not re-litigating R-G's deferral or R-M's scope. What I am reporting is that the deferral's **stated reason has been falsified by the twin**, so the deferral is cheaper to discharge than the record says. See CP-A.

**Certainty:** high that the contradiction is live and unmarked; high that DEV.md's read-together test fails on it; medium on my claim that the deferral is dischargeable now (CP-A gives the argument).

---

#### BLOCKER 3 — The barred-phase cause line is one authored string for two barring shapes, and one of them is false

**Where:** `README.md:504` (glossary · display labels), `README.md:550` (the machine-token rule's worked example), `ux/wireframes.md:281` (drawn), against `ux/wireframes.md:43-45`.

**What.** The copy contract [read: `README.md:503-505` — "**The barred phase's cause line** — the parser's own message, framed by this region: `the grammar broke here — <the parser's message>`"]. One string, stated as invariant framing.

The data shape says otherwise [read: `ux/wireframes.md:43-45` — "**Exactly three shapes**: everything open; **grammar broken** (source, tokens and ast stay open, the last two wait); **spelling broken** (source and tokens stay open, the last three wait)"].

Under *spelling broken* the barring edge sits between `tokens` and `ast`, the cause is the tokenizer's, and **"the grammar broke here" is false** — the grammar did not break; nothing has reached it. The twin's own journeys record the spelling-failure path as live [read: `ux/user-journeys.md` § One thing every journey above assumes — "when the spelling stage fails, the contract and a passing unit test both say the grammar phase is barred too"].

**Why it is a blocker and not a copy nit.** This is a **shape** decision, and 0.3 locks it. Every other piece of copy in this entry is settled as *keyed or derived* against a vocabulary — the phase labels, the fit marks, the empty-station reason, the tray heading. The cause line is the one specified as a **constant**, and it is constant only if there is one barring shape. There are two. The entry's own discipline names the failure mode exactly: "a rule that happens to work on five labels would silently return the whole string for the sixth that carries no separator" [read: `README.md:471-473`]. Same defect, one entry down.

It also contaminates the machine-token rule, whose worked example is this string [read: `README.md:548-550` — "the reason the sentence a learner reads when the machine stops says _the grammar broke here_ rather than naming **the barring edge**"].

Secondary: the twin draws **1 of 3** barring shapes [measured: `grep -rn "grammar broke"` → 4 hits; `grep -rni "spelling brok"` → 1 hit, and it is the enumeration, not a drawing]. Drawing the spelling shape is what would have surfaced this.

**Certainty:** high that the two shapes exist and the string is wrong in one; high that it is a keyed-vs-constant decision.

**Fix:** CP-C.

---

#### IMPORTANT 4 — The census found the sites; the rows absorbed two of seven, each into one row

**Where:** `DECISIONS.md:119` (A1), `:120` (A2), `:284` (D6), `:124` (A6), `:125` (A7).

**What.** The census's own headline finding is `editor/README.md`, and `8f820355`'s body states precisely what it asserts: "one paragraph there asserts **A1**, **two A2 roster members with their grounds**, AND **D6**". It was then filed in **A1 only** [read: `DECISIONS.md:119` — A1's column carries `**editor/README.md**`; `:120` — A2's column ends at `guide/README.md`; `level-ui/README.md`; `:284` — D6's column is `README.md` glossary · dispose; `DOCS.md` ×2; `event-bus/README.md`].

The paragraph asserts all three [read: `editor/README.md:49-57` — "The editor is surface class 1 … the guaranteed way home is the Edit code button: **class 2**, alive under every posture. **The strip's none entry closes an open lens too**, but the strip is class 3 and inert while masked"].

Same for `index.tsx`: filed in A1, while its comments assert **A6** twice, **A7**, **A8**, and **D2** [read: `index.tsx:552-558` — "A surface's class is a fact about what the surface IS, never about which container it happens to render in"; `:336-340` — "ONE VISUAL PANE, TWO DOM SLOTS"]. Only A8's column names it.

Five newly-found asserting files are in **no** row at all: `PHASE-1-CHECKPOINT-LEDGER.md` (2 class assertions, 20 mask assertions, 6 `strip`), `editor/DOCS.md`, `guide/DOCS.md`, `level-ui/DOCS.md`, `tests/index.test.tsx`. `ux/user-journeys.md` asserts A2's roster semantics and is in no A-row either — I checked its claim and it is **not** stale [read: Journey 4 — "every class-2 node — which is not the same set as 'every control that could restore conformance'"].

**Why it matters.** When 0.3 closes D6 under the amended receipt rule, the block walks D6's column, prints four receipts, and misses `editor/README.md` — the exact miss the census was run to end, reproduced in the commit that ran the census. The census is a **discovery** instrument; nothing in the process converts a discovery into a row-membership, and this round shows the conversion is where the loss now happens.

**Classification (your Q5):** recurrence, same drift, **new location** — and mechanically fixable, not inherent.

**Certainty:** high.

---

#### IMPORTANT 5 — A third structure defeats the receipt rule, and a fourth event has no trigger at all

**Where:** `49b90dba` body (RECEIPTS block), `8f820355` body ("RECEIPTS: none owed"), `DECISIONS.md:58-81`.

**Would the amended form have caught rounds 6 and 7?** Yes to both, and I checked the mechanism rather than accepting it. Round 6 (`b9a534c7` left `README.md` glossary · the rail on the retired enumeration while A3's column named it): the original rule already catches it — the quotation comes up empty. Round 7 (fifteen quotations, nineteen sites): amendment 2 catches it by construction. Amendment 1 (no indirection) closes the `all four A1 sites` hole. The rule is sound as far as it goes.

**The third structure — sub-claim scoping.** `49b90dba`'s block is keyed to *claims*, not *rows*: "**A1 the class-3 statement — all THREE sites**". A1's column names **six** also-assert entries (seven after the census) plus a home. The completeness claim is true of the narrowed scope and false of the row, and a reader auditing the commit against `DECISIONS.md` sees "all THREE" beside a seven-entry column. This is amendment 1's banned indirection re-entering on the other axis: instead of the column pointing elsewhere, **the receipt block redefines what the column is**. (Strictly, A1 was already `settled`, so no rule was broken — which is precisely why it is worth flagging: the structure is available and nothing prohibits it.)

**The fourth event — column widening.** The receipt rule fires on *closing* a row. `8f820355` **added two sites to A1's closed column** and wrote "RECEIPTS: none owed". A row whose site set grows after closure is a row whose new sites were never checked against the closed claim — and a region-wide census exists specifically to produce that event. The rule has no trigger for it.

Concretely, one of the two added sites carries a ground the campaign retired elsewhere: `editor/README.md` grounds class 1 as "never masked while mounted, **because editing is how conformance is restored**" — the conformance-restoration framing R-E declared insufficient and which was rewritten out of `level-ui/README.md` in the same session.

**Classification:** recurrence of the same subject (receipts vs. coverage), **new mechanism**. Fixable — CP-D.

**Certainty:** high on the two structures; medium on whether `editor/README.md`'s class-1 ground is stale enough to be called false (it is not false, it is off-vocabulary).

---

#### IMPORTANT 6 — I10's `recommendation` settlement reached the glossary and nothing else, and no row was opened for it

**Where:** `README.md:448-457` (glossary · recommendation), against the rest of the region.

**What** [measured: squeezed-unwrap counts]: `README.md` proposal **9** / recommendation 13 · `DOCS.md` proposal **8** / recommendation 8 · `ux/wireframes.md` proposal **12** / recommendation **1** · `ux/personas.md` 1/1.

The rule the new entry states: "_Proposal_ survives **only** in that surface's name and in the `candidate` entry's contrast … **everywhere else in this region's prose the contract term is the one to use**".

Two violations are in the home document itself, above the entry that forbids them:
- § The composition root: "for a lens opened by a recommendation — **that proposal's** opening overrides".
- § What this region does not own: "this region only **ranks the proposals** and renders them".

Neither is the surface name nor the candidate contrast. The twin is almost entirely on the retired synonym (12 : 1).

**And no `DECISIONS.md` row was opened for the decision**, against the file's own maintenance rule [read: `DECISIONS.md:34` — "A new decision gets a row **when it is taken**, not when it is reviewed"] and its own stated limit [read: `:419-421` — "It indexes decisions, not sentences. A sentence asserting no decision on this list is invisible to it. **When you find one, the decision is missing — add the row**"].

**Why it matters.** This is *exactly* the round-6 failure the receipt rule was built for — old words everywhere, new claim at one site — reproduced on a decision that never entered the instrument. The instrument is sound; the intake is not.

**Classification:** recurrence of the round-6 pattern on a **new** decision, caused by a skipped intake step.

**Certainty:** high on the counts; high that the two README uses violate the stated rule.

---

#### IMPORTANT 7 — The slot-beneath-the-rail contract lives only in a glossary entry; the sketch AR-2 will challenge does not contain it

**Where:** `README.md:530-547` vs `DOCS.md` § The render projection.

**What** [measured: `tr '\n' ' ' < DOCS.md | grep -oiE '.{80}(nothing to open|count line|reason line|empty).{80}'` → **0 hits**]. The four rules — derived per settle, singular at one, absent at zero, yields the slot to the cause line, and an open tray never takes the slot — appear in `README.md` glossary · display labels and nowhere in the architectural sketch.

The entry itself argues these are one indivisible contract: "an implementer reading only two of the three would ship the third defect". The sketch reader gets **zero of four**. `49b90dba`'s I11 correctly added the short label and a station's four parts to `DOCS.md`; the slot precedence was not carried with them, and it is the more implementation-shaped of the two.

`DEV.md` makes the sketch, not the glossary, the document the Refactor is held against [read: `DEV.md:2101-2106` — "The sketch is the **single most consequential document in the workflow** — it is what the entire Refactor step is held against"].

**Certainty:** high (measured absence).

---

#### IMPORTANT 8 — Copy now has a contract and no module home

**Where:** `README.md` § What lives here (l.17-42) vs glossary · display labels (l.460-559).

**What.** The entry enumerates **seven** derived-or-keyed copy families: the five phase labels, the five short labels, the four fit-mark strings, the nameplate's two forms, the tray heading, the proposals heading, the barred cause line, the empty-station reason + its count line. The manifest names **one** file: `display-labels.ts`, "the phases' display labels, keyed by phase name" — and it holds one string per phase today [read: `display-labels.ts`; measured: live consumer at `index.tsx:654`].

So a 0.3 implementer inherits a copy contract with seven families and a manifest slot for one, and no ruling names homes for the other six. This is the same gap R-A closed for the five new nouns (rows F1–F3) — and it was never asked for the copy, which grew across rounds 6 and 7 into the largest single entry in the README (~100 lines for one glossary term).

**Certainty:** high on the enumeration and the manifest; medium on severity — it is arguably 0.3's question, but R-A establishes that module homes are 0.2's in this campaign.

---

#### MINOR 9 — One class-3 definition still reads "everything else"

`lib/masking/README.md` § The three surface classes: "**Class 3, everything else** — the study panel and its lenses…". The carve-out **is** stated two sentences later, so nothing is omitted and your Q2 answer is genuinely clean. But the wording BLOCKER 1 retired at three sites survives at the fourth, in the library that owns the derivation [measured: `'.{90}everything else.{90}'` region-wide → this is the only class-3 instance; the other six hits are unrelated prose]. Certainty: high.

#### MINOR 10 — I7's roster numeral survives at one non-home site

`49b90dba` claims "the numeral is dropped at **both** non-home sites". Measured across the SHAs [`git show <sha>:<file> | grep -oic seven`]: `lib/masking/README.md` 3→**0**, `DOCS.md` 2→**0**, `ux/wireframes.md` **2→2**. One of the two is "Seven journeys" (unrelated); the other is `ux/wireframes.md` § What the arrangement never changes — "**Two of the seven are not controls at all**", a roster-size statement at a non-home site, in the file the same commit edited. The size has gone 5→6→7 in three days by the commit's own account. Recurrence, same drift, 2 of 3. Certainty: high.

#### MINOR 11 — M14 is real, is measurable, and your instrument was the problem (you asked me to say if the call was wrong)

The call to not fix against a bad measure was **right**. The finding is **also right**, and there is a clean instrument: measure the codepoint index of the frame's **closing vertical**, not the line length — line length is what the trailing `←` annotations confound.

[measured: python, per fenced block, index of each `│┌┐└┘├┤`] Every framed line closes at index **63** except exactly **four**, which close at **64**:

| line | content |
| --- | --- |
| `ux/wireframes.md:161` | `│ [Generate code]  [module]  [plain JavaScript ▾]     ( ) strict│` |
| `ux/wireframes.md:342` | `│         [Just Enough JavaScript · steps outside ▾]  ( ) strict│` |
| `ux/wireframes.md:358` | `│         [Just Enough JavaScript · steps outside ▾]  (•) strict│` |
| `ux/wireframes.md:452` | `│         [Just Enough JavaScript · steps outside ▾]  (•) strict│` |

Four lines, all closing `strict│` — round 7's count and description, exactly. Three of the four sit in blocks where every sibling closes at 63, so the misalignment renders. `DECISIONS.md:428-433`'s "**one unmeasured finding**" is now false, and should say so. Certainty: high (ambiguous-width characters run the *other* way — these lines carry more of them, so a wide rendering makes the overhang larger, not smaller).

#### MINOR 12 — Three concepts the module works with that the glossary never names

AR-1's second focus bullet. All three are load-bearing:
- **apparatus** — the category that exists solely to sit outside an exhaustive taxonomy, and the justification for `SurfaceClass` having three members. Defined inline in § Enforcement, referenced from glossary · blocked state, glossary · surface classes and `lib/masking/types.ts`. A glossary that keeps four near-homonyms of *mark* apart across three paragraphs does not name the one category deliberately outside its own split.
- **the instrument** — the twin's primary subject noun [measured: `ux/personas.md` 13 · `ux/user-journeys.md` 14 · `README.md` 6]. The README *names its own collision* and declines to resolve it [read: glossary · house token — "this region calls itself _the instrument_ in its own prose, but a language level's notional-machine document already calls the NM _the mechanical instrument_"]. A homonym identified in prose and left unresolved is the case § 0.1 says to settle in the glossary, not in code review.
- **the slot beneath the rail** — a contract object with a *total* precedence rule (cause line › count line › nothing), referenced by that phrase in both README and twin, with no name.

Certainty: high on the measurements; medium on whether `apparatus` and `the slot` warrant entries versus inline definition.

#### MINOR 13 — F3's site count undercounts by two

`DECISIONS.md:313` and `:413` say "four sibling READMEs … plus `index.tsx`, plus `DEV.md`" = six. [measured: `grep -rln "phases-panel"` excluding the directory itself → **eight**: adds `PHASE-1-CHECKPOINT-LEDGER.md` and `tests/index.test.tsx`.] Same undercount pattern, in the row the census's own commit edited. Certainty: high.

#### MINOR 14 — Two drawing observations

`ux/wireframes.md:451-464` (§ Strict, covering — with a lens already open) closes with `└` and has no `┌`; every other full drawing has both. And the "mark row and reason line travel together" invariant [read: `:213-218`] **holds** across all drawings under its stated scope — I checked each block by eye and by frame index; the generator and warn crops are exempt as excerpts. Noting it because it is the one invariant this document offers as "two greps", and it survives. Certainty: high.

**Empty tier:** none. All three tiers carry findings.

---

### Counter-proposals

**CP-A — Discharge I6 now with a present-tense rewrite; the stated dependency does not hold.**
`DECISIONS.md:366` says the dispose enumeration "cannot be rewritten without naming what replaces the strip's none entry, and that is `Station`'s shape — 0.3's first type". The twin already names the replacement [read: `ux/wireframes.md:509-511` — "the tray entry for the open lens is its own close affordance — pressed while open, released to close"], and the **tray** is settled (B5, B6, glossary · tray), not deferred. B10 asks whether *openable and bare* stations are one shape or two — a station with a tray is openable by construction, so the tray entry exists under either answer. Writing `README.md` glossary · dispose as "*Raised by the open lens's tray entry, the Edit code button, …*" is pure present-tense end-state prose, adds no migration narration, and clears BLOCKER 2's core at the sites that matter most. If the human prefers the deferral to stand, the *reason* recorded for it should be corrected, because it is currently a dependency that is not there.

**CP-B — Give the record a reachable pointer, and merge the two deferral tables.**
`DEV.md` explicitly permits this: handoff files are where "process info, ordered steps, phase splits, status snapshots … all live" [read: `DEV.md:921-926`]. So (i) refresh `RESUME.md`'s banner to round 8 and point it at `DECISIONS.md` in the first ten lines; (ii) delete `RESUME.md` § DEFERRED TO 0.3's "only durable home" claim or make it a pointer; (iii) collapse `DECISIONS.md` § Deferred to 0.3 and § 0.3 entry conditions into **one** table — two sections in one file both claiming to be the deferrals' home is the same defect the campaign has spent five rounds removing from the region; (iv) add the accessibility-structure obligation as a row.

**CP-C — Key the cause line, exactly like the empty-station reason.**
`the <phase-that-barred> broke here — <the parser's message>`, keyed by the barring phase name and zipped against the same order constant. Two authored framings (`the spelling broke here` / `the grammar broke here`), by the same argument that made the short labels authored rather than derived: a derivation from the phase label would produce "the Tokens · spelling broke here". Draw the spelling-broken shape in the twin so the third shape stops being asserted-only. And restate `README.md:550`'s worked example against the keyed form.

**CP-D — Two more receipt-rule amendments, both mechanical.**
3. **Receipts are keyed to row IDs and reproduce the row's column verbatim.** No scoping phrase ("the class-3 statement", "the sites that lacked one") may narrow the printed set; a genuinely narrower fix prints the full column with `— NO RECEIPT: unchanged, this fix does not touch it` on the rest. This closes the sub-claim hole with the vocabulary amendment 2 already introduced.
4. **Widening a closed row's `also asserts` column re-opens it.** Status goes to `open (census)` until the new sites are receipted. Without this, every future census silently adds unchecked sites to settled rows — and the census is the instrument this campaign just committed to.

**CP-E — Name a copy home before 0.3.**
Either widen `display-labels.ts` into a `display-copy.ts` owning all seven keyed/derived families, or add a `copy/` entry to § What lives here. This is the F-row question (module homes) applied to the thing that grew fastest across rounds 6–7, and it is cheaper to answer in prose than after `types.ts` scatters seven records across five directories.

**CP-F — Stop building instruments.** The campaign has built four (phrase greps → decisions list → receipt rule → region census) and each caught its predecessor's blind spot. The measured evidence this round is that **the instruments work and the intake does not**: A2's one-home fix is clean at 9 citer sites (verified), the census reproduces exactly, the receipt rule would have caught rounds 6 and 7. Every finding above that is a *recurrence* traces to a skipped filing step — a decision taken without a row (I10), sites discovered without being filed (census → A1 only), a closed row widened without re-opening. A fifth instrument will find a fifth blind spot. A two-line checklist appended to `DECISIONS.md § How to maintain it` — *did this commit take a decision? open a row. did it discover a site? file it in every row it asserts, then re-open those rows* — is the whole remaining gap.

---

### Verdict: **PAUSE**

**Is 0.2 closeable? Yes — but not at HEAD, and the reason is not the subject you have been fighting.**

Say plainly, per your question 5: the class-2 / route / overlay subject that has driven rounds 3 through 8 is **closed**. I attacked it independently at fifteen files and could not falsify it. The carve-out reaches every enumeration; the four routes agree at every site; the roster agrees at every site; A3's exhaustion argument is sound and no longer runs on the retired list. That subject should not be re-reviewed.

The three blockers above are **not that subject**:

- **BLOCKER 1 is new**, and it was created this round by R-M's relocation. Storage without retrieval.
- **BLOCKER 2 is new as a defect** though old as a deferral — round 6 told you to make it legible, round 7 told you `DEV.md` forbids the form you chose, and the resolution removed the marker instead of the thing marked. Both reviews were right; the synthesis was not attempted.
- **BLOCKER 3 is new subject matter entirely** — the copy inventory has never been checked against the data shape it renders, and the first check finds a string that is false in one of two cases.

**Is the recurrence structural?** No — and I want to be precise, because "structural" would license closing 0.2 with a shrug. Every recurring finding this round (IMPORTANT 4, 5, 6, MINOR 10, 13) is a **filing** failure, not a detection failure, and all five are closed by CP-D and CP-F, which are checklist items rather than a fifth instrument. What *is* structural is the ratio: fifteen files assert the class decision and one document owns it. You have been reducing that ratio deliberately since `90166bc7` and it is working. Keep applying it to the two subjects where it has not been applied — the copy (CP-E) and the `recommendation` vocabulary (IMPORTANT 6) — and the residue stops regenerating.

**What I would gate on.** BLOCKER 1 and BLOCKER 3 must be resolved before 0.3; both are small and neither needs a ruling. BLOCKER 2 needs either CP-A or an explicit human ruling that the strip contradiction rides into 0.3 unmarked, recorded with `DEV.md:2108`'s read-together test named as the thing being waived — because that test is Phase 0's own closing condition and waiving it silently is the one move that would make round 9 inevitable.

**Files:** `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/study-lenses/orchestrate/README.md`, `.../DOCS.md`, `.../ux/personas.md`, `.../ux/user-journeys.md`, `.../ux/wireframes.md`, `.../lib/masking/README.md`, `.../lib/masking/types.ts`, `.../editor/README.md`, `.../index.tsx`, `.../display-labels.ts`, `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/.planning-handoffs/orchestrate-ux/DECISIONS.md`, `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/.planning-handoffs/orchestrate-ux/RESUME.md`.

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

---

# ARCHIVE — rounds 3, 4 and 5, and the campaign's standing mechanics

**Everything below is kept because the reasoning is auditable. Rounds 3, 4 and 5
are ALL RESOLVED — none of it is a task list.**

**For what is still live below the archive line, see the ARCHIVE banner at the
top of the archive — it is the ONLY exemption list.** This paragraph used to
carry a second one, and the two disagreed: this one named § The process failure
to not repeat and omitted § Human rulings; the other did the reverse. Two
exemption lists that each drop one section is how a live section gets lost, so
this one now points rather than enumerates.

## What this campaign is

A UI revamp of `src/lib/study-lenses/orchestrate/`, the one component the host
mounts. Its internals are built, covered and browser-checkpointed; its interface
was never designed — the region carries **zero stylesheets** and its whole shell
is six inline style objects over unstyled native controls. The maintainer has
ruled the existing DOM, tests and UX are "quick hacks so I could eyeball the
plumbing" — **scaffolding, not contract.**

`work: software · twin-doc: user · ceremony: full · prospective`

That line belongs in the **commit body**, not in a plan file — see § Commit
form.

## Commits — this campaign only

The tree is shared with concurrent sessions; scope every claim to these SHAs.

| SHA        | What                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------ |
| `bf36ab49` | 0.1 — README registers `ux/`, adds the first glossary terms                                |
| `dafcffd4` | 0.2 — the three-document twin + the selection pass                                         |
| `a1f4d132` | AR-1 round 1 resolution — CP1 restructure, `house token` rename, the Rail override         |
| `8cc4bc15` | AR-1 round 2 resolution — empty-station copy restored, `barring edge`, station retirement  |
| `5300c39d` | this resumption point lands (it had been untracked)                                        |
| `929d9086` | AR-1 round 3, **finding 2 alone** — class 2 widens to nodes; a rule amendment, ships alone |
| `bdf5077c` | AR-1 round 3, findings 1 · 3 · 4 · 5 · 6 · 7, and this file's corrections                  |

**The round-4 resolution — nine commits, 2026-08-15.** Organised BY PASSAGE, not
by finding, which is why the finding numbers scatter across them. Each commit
body carries its own sweep results and loss ledger; this table points rather
than restates.

| SHA        | What                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------ |
| `d33aef0a` | **blocker 3** — the five nouns get module homes; the rail's class enters a definitional home     |
| `c2e1651e` | **blocker 1** — the derived count's worked example, plus the inclusion predicate it never taught |
| `ca7e2ccf` | **blocker 2** — the rail's silence re-grounded on necessity; **four** citations swept, not three |
| `0c78c63c` | IMPORTANT 1 — the rail's class 3 re-grounded on exhaustion. **Blocked on `ca7e2ccf`**            |
| `e3961368` | IMPORTANT 2 — `containment decides` retired. **RULE AMENDMENT, ships alone**                     |
| `d7e2e2bf` | IMPORTANT 6 — the display-copy vocabulary ban narrowed. **RULE AMENDMENT, ships alone**          |
| `1e7b1540` | IMPORTANT 3 — the empty count's three rules share one home                                       |
| `a80b39e2` | IMPORTANT 4 + 5 — `kit`, `band` and `control row` enter the glossary                             |
| `0173b1c2` | the recorded MINOR — the mask is what goes inert, not the overlay                                |
| `ab9e92f8` | this resumption point catches up with the nine above                                             |
| `bbcfc9e5` | **round 5's B1 + B2** — a station carries four named things, none of them a fit mark             |

**Why the order was load-bearing, and the trap for anyone re-doing this.** The
announcer's necessity was argued FROM the rail going inert under strict — that
is, from the rail being class 3. Grounding the rail's class 3 on "the announcer
carries the voice" therefore closes a CIRCLE unless the announcer is re-grounded
first. `ca7e2ccf` removed posture and class from the announcer's premise;
`0c78c63c` was blocked on it. Landed in the other order this pass would have
shipped a circular argument and called it a fix.

**Three findings were larger than round 4 stated**, each verified before being
acted on:

- **Blocker 2's citation set is FOUR, not three.** The fourth is the pass
  table's Journey-1 Bench cell, "same, **and the readout can speak it**" — and
  **no phrase-grep for `live region` can find it**, because the sentence never
  says those words. It was found by reading the table. A grep is necessary and
  not sufficient; read tables and fenced drawings by eye.
- **`kit` carries two live senses inside `wireframes.md` alone**, not merely
  twin versus package. The author had already hand-patched one site ("a kit of
  two lenses **on one phase**"), which is what made the case for a glossary
  entry rather than a rename.
- **IMPORTANT 2 had a fifth site**, in `lib/masking/DOCS.md` — "a static fact of
  the render tree", the same false rule in different words, in a file no ruling
  had authorised. Corrected as the same subject rather than deferred; the call
  is declared in `e3961368`'s body, and that hunk is the one to drop if the
  human disagrees.

**One orphan this pass created and caught in its own sweep**: rewriting § The
override's Journey-6 bullet falsified the bullet above it ("The pass preferred
the Bench on its secondary criteria, Journeys 5 and 6"). Amended inside the same
commit. That is the discipline working once, on the exact failure mode that
produced rounds 3 and 4.

**Carry-forwards this pass created**, none of them blocking round 4:

- `lib/masking/types.ts` still says the classification is "a static fact of the
  render tree (**containment decides**…)" while `lib/masking/README.md` says a
  class "does not follow from which container the surface renders in". A direct
  contradiction, pre-existing, left in place because the human's scope ruling
  was the four homes rather than the drifts — and named in `929d9086` because it
  is the same issue as the rail's class-3 re-grounding, which deliberately does
  **not** ground on containment.
- `SurfaceClass`'s member `'meta-control'` now under-names its class. Zero
  consumers [measured], so the rename is free, but it reshapes another module's
  contract — 0.3.
- `station` has a **third, live, unretired sense** in the same package:
  `PEDAGOGY.md` uses "the stations" for the curriculum's five chain-points. The
  glossary now says the region neither claims nor retires it. `PEDAGOGY.md` is
  foreign-dirty — do not edit it.

Baseline for AR-5: **`80306ad9`**.

**Your green baseline is the orchestrate tree, and only it: 622 passing in 22
files** [measured: `npx vitest run --project unit
src/lib/study-lenses/orchestrate`].

**The repo-wide run is red and most of it is not yours.** [measured 2026-08-15:
`npx vitest run --project unit` → **8 files failed, 41 tests failed**, 414 files
passed; 414 in an earlier revision, harmless drift]. The failing files:
`scripts/lib/check-tables/` (a test importing a `find-table-defects.mjs` that
does not exist), `src/plugins/study-lenses/`,
`src/lib/embody/lib/evaluating/shared/guard-loops/`, and five under
`src/lib/study-lenses--deprecated-architecture/`. **`lenses/spellme/` does NOT
fail** — an earlier draft of this file said it did, and that was wrong. None of
the eight is this campaign's; do not try to fix them and do not measure yourself
against the repo-wide number.

## Human rulings — binding, do not re-litigate

All 2026-08-14 unless noted. **The two naming rulings at the foot of this table
are 2026-08-15, not 08-14** — `8cc4bc15` recorded them undated and landed
2026-08-15 09:55 [measured: `git show -s --format=%ci 8cc4bc15`], and the two
parentheticals in the tree that said 08-14 were corrected in `bdf5077c`. The
Rail selection is genuinely 08-14 [measured: same command on `a1f4d132`].

| Ruling                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `twin-doc: user`; the twin is three documents — personas, user-journeys, wireframes                                                                                     |
| The twin sits at `orchestrate/ux/`, not package level — "the orchestrator is what gives it a UX"                                                                        |
| `ceremony: full`                                                                                                                                                        |
| "Visible, explicit and **KISS**"; open mind for entirely new UX                                                                                                         |
| **"The UI renders what the embodiment suggests"** — faithful projection, 0→N lenses per phase, no redesign                                                              |
| Empty phases are acceptable; **lens-building is out of scope**                                                                                                          |
| `lib/colorizing` (planned, not built) owns the code surface; this campaign owns the house token vocabulary; lens adoption is voluntary                                  |
| Absorb the three accessibility defects into this campaign                                                                                                               |
| The deprecated tree's 737 lines of orchestrator CSS are **wholly superseded** — nothing ported                                                                          |
| **The arrangement is the Rail** (candidate A), overriding the selection pass's synthesis                                                                                |
| `break` → **the barring edge**                                                                                                                                          |
| `station` is **kept**, and its retired sense (a synonym for `phase`) is formally retired                                                                                |
| Fix the blockers, then hand off                                                                                                                                         |
| **2026-08-15** · `station` takes **neutral wording** — "the rail's per-phase element" — and whether the openable and bare cases are one shape or two is deferred to 0.3 |
| **2026-08-15** · surface class 2 **widens** from meta-level _controls_ to meta-level **nodes**, so the announcer has a class; `SurfaceClass` keeps three members        |
| **2026-08-15** · all four class-2 definitional homes are edited now, `lib/masking/` included — not two now and two carried                                              |
| **2026-08-15** · the two naming rulings are dated **2026-08-15**, and the two existing 08-14 parentheticals are corrected rather than propagated                        |

**Three further rulings, 2026-08-15, taken during the round-4 resolution.** Each
is recorded with a dated `(human ruling 2026-08-15)` parenthetical in the
document it governs, per `DEV.md § Ruling provenance` — not only in a commit
body.

| #   | Ruling                                                                                                                                                                                                                              | Home                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| R-A | **Module homes take AR-1's split.** `rail/` owns the line, the stations, the trays and the barring edge; the **nameplate** and the **announcer** live with the top component. `rail/` replaces `phases-panel/` in § What lives here | `orchestrate/README.md`, § What lives here + five glossary entries                    |
| R-B | **A recorded argument is ANNOTATED; live reasoning is REWRITTEN**                                                                                                                                                                   | `ux/wireframes.md` § Appendix, the `†` correction                                     |
| R-C | **`lib/masking/README.md` may be edited for the inert-overlay correction**, notwithstanding that the class-2 ruling authorised only the class-2 homes                                                                               | `lib/masking/README.md`                                                               |
| R-D | **The nameplate takes class 2**, by widening that class a SECOND time: a third way to earn it — _naming where the learner is_ — beside restoring conformance and carrying the voice. **Rule amendment, ships alone.** 2026-08-16    | the four class-2 definitional homes — NOT YET WRITTEN, this table is its interim home |

R-A's warrant is structural and measured, not stylistic: **both**
`data-maskable` containers are rendered by the top component's own return [read:
`orchestrate/index.tsx` — `<div data-maskable inert={mask.masked || undefined}>`
at `:429` and `:447`], so only the composition root can guarantee the announcer
sits outside both. Mounted from `rail/`, the placement rule would be a claim
about containers that directory does not own.

**Two of the earlier rulings had no dated home in the documents they bind** —
that was round 3's finding 7, since resolved. `DEV.md § Ruling provenance`: "A
ruling recorded only in a commit body is findable but not readable where it
binds."

## ROUND 5 — ALL RESOLVED 2026-08-16/17 (ARCHIVE — NOT A TASK LIST)

**All sixteen of round 5's findings are closed or deferred by ruling; rounds 6
and 7 are closed too. The report is kept because the reasoning is auditable.**

`ar-1`, run at the `opus` pin, reported reading every input in full. B1 and B2
were resolved in `bbcfc9e5` (a station carries `phase`, `label`, `short label`,
`standing`, `tray`; `standing` deliberately not called a mark, because `FitMark`
is exported and means something else). **The other fourteen are open.**

The outgoing session verified B1, B3, B4, I1, I2, I5, I7 and M1 independently
rather than relaying them; all held. The rest are relayed [relayed: `ar-1` round
5] and are **not** independently verified — re-measure before acting.

### Blockers

- **B3 · The nameplate has no surface class, anywhere** [measured: 5 mentions in
  `README.md`, 5 in `ux/wireframes.md`, 0 assign a class]. The split is declared
  exhaustive, and that exhaustiveness is the load-bearing premise of the two
  arguments round 4 re-grounded. Run it on the nameplate and it falls to class 3
  — so the pane's name goes `inert` under strict, leaving the accessibility tree
  in the state the twin calls where "the way home is never covered" carries most
  weight, and killing Journey 3's whole ask. **This is the pre-`929d9086`
  announcer defect, one element over.** The twin's drawing already contradicts
  it: the _Strict, covering — with a lens already open_ frame annotates the rail
  "dim + inert" and the lens "covered", and draws the nameplate between them
  unmarked.

  **RULING R-D IS ALREADY TAKEN — see the rulings table. Class 2, by widening it
  a SECOND time**: a third way to earn the class, _naming where the learner is_,
  beside restoring conformance and carrying the voice. **This is a rule
  amendment and ships alone** [read: `DEV.md` § Atomic Commits].

  **R-D HAS SIX HOMES, NOT FOUR, AND ONE OF THEM IS A COLLISION.** An earlier
  revision of this file said "the four class-2 definitional sites, the same set
  `929d9086` edited" — wrong on both counts, and a context-free validation
  caught it. `929d9086` touched **five files** [measured: `git show --stat
  929d9086` → `DOCS.md`, `README.md`, `lib/masking/README.md`,
  `lib/masking/types.ts`, `ux/wireframes.md`], while round 3's "four homes" are
  four sites across three files. The two sets were never the same. The full set
  for R-D:

  | home                                                                                                     | what R-D does                   |
  | -------------------------------------------------------------------------------------------------------- | ------------------------------- |
  | `README.md` § Enforcement                                                                                | add the third earning route     |
  | `README.md` glossary, `surface classes`                                                                  | same                            |
  | `lib/masking/README.md` § The three surface classes                                                      | same                            |
  | `lib/masking/types.ts`, the `SurfaceClass` JSDoc                                                         | same                            |
  | `DOCS.md` — **Class-2 nodes never mask** (definitional; `929d9086` already had to correct this one once) | same                            |
  | `ux/wireframes.md` — the rail's class-3 exhaustion argument                                              | **not a copy edit — see below** |

  **THE COLLISION, AND IT IS DESIGN RATHER THAN WORDING.** `ux/wireframes.md`
  grounds the rail's class 3 on exhaustion like this [read, verbatim]: "a node
  earns that place **one of two ways**: by restoring conformance, or by carrying
  the region's voice. The rail does neither. **It narrates where the machine
  is**, and narration is not restoration". R-D's third route is _naming where
  the learner is_. Those two predicates are one word apart. Landing R-D as a
  copy edit leaves that argument saying "two ways" when there are three, **and**
  resting on a distinction R-D has narrowed to almost nothing.

  **Settle it before writing the amendment, and write the answer INTO the
  argument.** The candidate distinction: the rail narrates the MACHINE's
  position; the nameplate names WHICH SURFACE THE LEARNER IS ON. If that holds,
  say so explicitly in the exhaustion argument — it is now load-bearing and it
  is currently implicit. If it does not hold, R-D's route needs different
  wording and the rail's class-3 ground needs re-examining, which reopens
  `0c78c63c`. **This is the exact shape that produced rounds 3, 4 and 5's
  blockers. It is written down here so round 6 does not have to discover it.**

- **B4 · ORPHAN — `README.md` § What renders still specifies the STRIP's
  behaviour.** "a barred phase renders barred with its cause; an accessible
  phase lists its fitting lenses" [read, verbatim]. Both clauses are false of
  the Rail: the Rail draws **one cause, once** (repeating it per barred phase is
  named a failure in `personas.md`), and it **hides** the kit behind trays.
  **The outgoing session declared this out of scope and was wrong** — the
  deferral to 0.3 covers the `strip` VOCABULARY migration, and this is
  BEHAVIOUR, in the section 0.3 reads to know what to render. No grep for
  `strip` or `rail` reaches it, because it says neither.

### The eight IMPORTANT

**I1, I2, I5 and I7 were created by round 4's own fixes** [measured against
`bdf5077c`]:

- **I1 · The acyclicity claim is false in the artifact.** `ux/wireframes.md`
  says the posture argument holds "a second time and **independently**". It does
  not: _rail goes inert_ ⇐ _rail is class 3_ ⇐ _the voice is the announcer's_ ⇐
  the announcer's own necessity. `0c78c63c`'s body asserted one-way dependency
  that the shipped text does not have. The argument still stands on its first
  ground alone; the word must go, and the sentence should be recast as a
  downstream consequence so a later editor cannot leave a closed loop.
- **I2 · ORPHAN — the twin still asks the review to settle where the announcer
  mounts.** R-A settled it 2026-08-15 and the README records it. Left standing,
  it invites 0.3 to re-open a ruling.
- **I5 · The narrowed display-copy ban's own test contradicts the glossary.** It
  forbids "a term this package **coined**" and cites `station` — while the
  `station` entry says "The word is **reclaimed rather than minted**". Round 4
  narrowed a rule falsified by the region's copy into one falsified by its
  glossary. Reviewer's proposal: drop the minted/coined predicate for the
  operational test — _would a learner who never read the glossary understand
  it?_
- **I7 · The `band` entry is falsified by three of the region's own elements.**
  It claims to hold "everything the region renders that is not the program: the
  control row and the rail" — but the guide, the proposals and the nameplate are
  all rendered, all not the program, and all outside those two. Second, smaller:
  `control row` calls itself "the one container that deliberately mixes" classes
  while the `band` entry says the band mixes too.

Not round 4's, and all four are contract-shaped:

- **I3 · The blocked sentence's ORDERING rule lives only in the twin** — "fix
  the code first, lift the guardrail last", which the twin calls the one place
  the arrangement can push back on its own geometry. The README claims copy
  ownership and states no ordering. Same split-homes defect `1e7b1540` closed
  for the empty count.
- **I4 · The README's copy inventory does not match the copy the twin draws**,
  so the twin's claim that the README owns the copy overreaches (**the phrase
  "owns every learner-facing string" is NOT in the README — do not grep for
  it**; the actual `display labels` entry claims only "the five phases'
  learner-facing labels and the none-state's display string"). Drawn with no
  README home: the nameplate in two forms (`your code` / `the pane holds: …`)
  with no rule for which applies, `waiting`, `ways to study the Source`,
  `next, you could:`, and two of the four fit-mark strings.
- **I6 · The `dispose` enumeration is knowingly stale in three definitional
  homes** — `README.md`, `DOCS.md`, and `event-bus/README.md` all still
  enumerate the strip's none entry as a live raiser; only the twin records that
  the arrangement replaces it.
- **I8 · The announcer has no channel, and two of its three utterances have no
  event.** The bus taxonomy is six events; the blocked state has none (the mask
  derives at render) and the barring edge has none (it changes inside a settle,
  which the announcer is forbidden to speak). Both are edge-triggered and need a
  remembered previous value that appears in no state-residency row — and any new
  effect lands beside a **pinned** registration order. This is the announcer's
  whole implementation and it is unspecified.

### The four MINOR

- **M1 · `SurfaceClass`'s class-2 literal is `'meta-control'`**, which its own
  JSDoc concedes under-names the class. Independently re-measured: **1 consumer,
  the declaration itself**. One line today, a codemod after 0.3.
- **M2** the twin's never-covered list omits the announcer · **M3** unqualified
  `kit` breaks the new entry's own default at `## The kit at 0, 1 and many` and
  in `personas.md` · **M4** `DOCS.md` places the strip "beside the control row"
  while the README puts the control row at the top of the band (AR-2's ground).

### What round 5 says about this campaign's method — READ THIS BEFORE FIXING

**Do not open round 6 as another sweep.** Five rounds of phrase-greps have now
missed one orphan each, and BOTH misses this round (B4, I2) are in prose that
never uses the retired term — no grep of any form reaches them. The reviewer's
counter-proposal, and it is the most valuable thing in the verdict:

> write the list of the arrangement's **decisions**, and check, per decision,
> which sections assert something about it.

That list is cheap to write once and is the instrument this campaign has been
missing. Write it before the next fix pass, not after.

Two further counter-proposals worth taking: fix nothing else before B3's
amendment lands, since it is the only finding on the accessibility-tree critical
path; and **give the slot beneath the rail a name** — three unnamed nouns
compete for it ("the mark row", "the reason line"/"the count line", "the cause
line") and the contract governing them is a _precedence_ rule, which is the tell
that they are one element with two arms. Naming it settles B4's residue, I3's
home question, and one of 0.3's types at once.

---

## ROUND 4 — ALL RESOLVED 2026-08-15 IN NINE COMMITS; READ THIS BANNER FIRST

**Everything below this banner is the round-4 report as written, kept because
the reasoning is auditable. It is NO LONGER A TASK LIST.** All three blockers,
all six IMPORTANT and the one recorded MINOR are closed; the resolution table
and the three corrections to this verdict are in § Commits above, and the nine
commit bodies are the record.

**Its line numbers are stale** — they were measured at `bdf5077c` and the
resolution has moved them. Find passages by their quoted phrases.

**Two cautions that outlive the round.** First, this verdict's own blocker-2
citation set was **incomplete**: it named three sites and there were four, the
missed one being a table cell no phrase-grep could reach. Second, three of its
findings were **understated** — see § Commits. An AR verdict is itself a claim.

**The three MINOR that were lost stayed lost.** Re-running `ar-1` produces a new
review against the current tree, not round 4's prose. Round 5's verdict is the
complete list from here.

---

### The round-4 report, as written

**Two of the three blockers were created by round 3's own fixes.**

### Blocker 1 — the derived count's worked example contradicts its own rule

`ux/wireframes.md:266` says "so what is empty in this drawing is `ast` — alone."
**It is `tokens` AND `ast` — two.** The drawing above it gives Tokens and AST
both a bare `·`, both are accessible, and `spellme` (`phase: 'tokens'`) is not
on the built-in roster [measured, this session]. `bdf5077c`'s own body says "the
honest number is TWO, not four" — so the artifact contradicts the record that
authored it. This is the one passage added to prove the count is derived, and it
teaches the wrong evaluation: it silently drops accessible-and-empty phases that
sit **upstream** of the barring edge.

**Fix:** "…is `tokens` and `ast` — two, where the unbarred drawings show four."
That demonstrates derivation better than one does. VERIFIED, not relayed.

### Blocker 2 — the collapsed live-region argument leaked, and lost a property

`bdf5077c` re-grounded "the rail cannot be a live region" from _stations are
controls_ onto _it goes inert under strict_. Two problems.

**(a) The new argument is posture-conditional; the old one was categorical.** It
bites only under strict, so read literally it licenses a rail live region that
merely goes quiet under strict — which collides with the announcer's third
utterance, "the barring edge moving", giving two live regions for one event
under warn. **(b) It is no longer rail-specific**, so it voids the Bench's
recorded advantage — and **three appendix sites still assert the retired
premise** [verified this session, all three]:

- § Appendix, The Bench — "a readout that is also a set of buttons cannot be a
  live region" (**this one is prettier-wrapped — a line-based grep will not find
  it**; that is how the outgoing session missed it first pass)
- the pass table, Journey 6 / Bench cell — "uniquely able to be a live region"
- § The override — "The Bench's unique advantage was that its readout could
  itself be a live region"

**Sites, with line numbers measured at `bdf5077c` — re-measure, prettier moves
them.** The argument: `ux/wireframes.md:100-104`. The three citations: `:559` (§
Appendix, The Bench), `:580` (pass table, Journey 6 / Bench cell), `:617` (§ The
override). **Two open scope questions the outgoing session did not resolve for
you:** (a) `:559` and `:617` are HISTORICAL prose about a rejected candidate
("Its argument: …", "was that its readout could…") — decide whether a recorded
argument gets rewritten or annotated, and say which in the commit body; (b)
`README.md`'s `announcer` glossary entry carries the same claim structure and is
NOT obviously in blocker 2's scope. The 2026-08-15 ruling authorised editing
`lib/masking/` for the **class-2 homes only** — blocker 2 is a different
subject, so ask before reaching into that module again.

**Fix:** restore a categorical claim that does not use the retired premise — _a
live region whose content changes under the learner's hands, and whose subtree
can go inert, cannot be the region's voice_ — then sweep all three appendix
sites. The Bench's real advantage was **navigation**, not live-region
capability: its readout is control-free, but it is still class 3 and still goes
inert.

### Blocker 3 — the five nouns still have no module home. DESIGN. FRESH SESSION

**No `rail/` or `station/` directory exists, and nothing states where any of the
five nouns mount.** (An earlier revision said they "appear nowhere outside the
README glossary and the twin" — that is FALSE and `929d9086` is what falsified
it: `announcer` is now in `DOCS.md`, `lib/masking/README.md` and
`lib/masking/types.ts`, and `rail`/`station`/`announcer` all appear in
non-glossary README prose. The module-home gap is the real claim; the
absent-everywhere one is not.) `README.md § What lives here` still lists
`phases-panel/ the five-phase study panel — the study layer, rendered`, which
the glossary's `the rail` entry retires. **`Station` is the first type 0.3
writes**, so 0.3 cannot start until this is decided.

**AR-1's fourth-round point, and it is the sharp one:** the rail's class is
argued only in the twin and is absent from all four definitional homes — which
is the announcer's pre-`929d9086` position exactly. Here the class-3 residual
happens to give the right answer, so no bug ships; but the campaign spent a
standalone rule-amendment commit establishing that this arrangement is a defect,
then reproduced it one surface over.

**AR-1's counter-proposal:** `rail/` owns the line, stations, trays and the
barring edge; the **nameplate** and the **announcer** live with the top
component, because only the composition root can guarantee the announcer renders
outside both maskable containers. That also answers wireframes' review-ask 3.

### The six IMPORTANT — batch these into the same commit

1. **The class-3 warrant misdescribes itself.** Rejecting AR-1 round 3's
   containment ground was RIGHT [confirmed by round 4]. But the substitute —
   supersession of the strip — is a fact about **lineage**, not about what the
   surface IS, while the sentence's own gloss claims the latter. It also cites a
   surface 0.3 may abolish. **Better ground: exhaustion** — not editor-based,
   not a node that must survive every posture (it restores nothing and silences
   nothing, since the announcer carries the voice), so class 3 is what is left.
   Kit-independent, lineage-independent, container-independent.
2. **`containment decides` is now ACTIVELY harmful**, not merely carried. Before
   the widening it had one loud counterexample (the Generate code button). After
   it, the announcer is class 2 **and** outside both containers — so the false
   rule just gained a confirming instance, in the file 0.3 opens next. Delete
   the four-word parenthetical; zero consumers.
3. **The barred-precedence rule lives only in the twin** while the zero- and
   singular-rules live in the README's `display labels`. Same contract, split
   homes. One clause fixes it.
4. **`kit` silently redefines a package term** — the package README uses it for
   the learner's whole roster, the twin for one phase's lenses. And "survives a
   kit of zero" is the acceptance test BOTH re-grounded arguments are declared
   to pass, so the two readings are not the same test.
5. **`band` (34 uses) and `control row` (8) have no glossary entry**, and
   `control row` is a mask-boundary object. This is the missing-concepts lens
   four rounds have not covered.
6. **"R2" is this file's label, not the artifact's — the sentence carries no
   such name.** It is in `README.md`'s `display labels` glossary entry (around
   `:387`, prettier-wrapped and invisible to a line-grep): "**And display copy
   never carries contract vocabulary**". It is stated too broadly and the
   region's own copy falsifies it. "Display copy never carries contract
   vocabulary" — but the copy says "four **phases** have nothing to open yet",
   and `phase` is package glossary vocabulary. Narrow it to machine tokens and
   coined contract terms.

**Four MINOR were returned and only ONE is recorded here — the other three are
LOST.** Re-running `ar-1` will NOT recover them: that produces a new review
against the current tree, not round 4's prose. Either accept the loss or treat
round 5's verdict as the complete list. The one recorded, and it is worth taking
on sight: **"The mask is an inert overlay" is backwards in the live DOM** — four
sites, `README.md:173`, `README.md:342`, `lib/masking/README.md:47`, and the
comment at `index.tsx:333` — `inert` sits on the two `data-maskable` containers
and the overlay carrying the blocked sentence is a non-inert sibling. An
implementer taking it literally removes the most important sentence in the
instrument from the accessibility tree.

---

## ROUND 3's SEVEN FINDINGS — ALL RESOLVED 2026-08-15; READ THIS BANNER FIRST

**Everything in this section below the banner is the round-3 report as written,
kept because the reasoning is auditable. It is no longer a task list.** The
resolution is in two commits, and their bodies are the record — this file points
rather than restates:

- `929d9086` — finding 2 alone. Class 2 widened from meta-level _controls_ to
  meta-level **nodes**, so the announcer has a class. A **rule amendment**, and
  [DEV.md § Atomic Commits](../../DEV.md) requires one to ship alone.
- the commit that follows it — findings 1, 3, 4, 5, 6, 7.

**Three of the seven were wrong as the reviewer stated them, and one of this
file's own tools was the reason.** Re-verify anything here before relying on it:

| finding | as stated                        | as measured 2026-08-15                                                                                                                                                      |
| ------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | counts via `\bbreaks?\b`         | correct, but that pattern is **blind to `broke`/`broken`/`breakage`** — 13 further hits, one of them live in-drawing copy, a third undecidable case the finding never named |
| 2       | four definitional homes          | four, **plus `DOCS.md`**, which carries two `class-2` references and whose line 115 was definitional and became false                                                       |
| 3       | the list lives in three handoffs | **four**                                                                                                                                                                    |
| 4b      | "one full frame of three"        | **one of four** — the omitted frame is `## Strict, covering — with a lens already open`, which has no station-mark row at all                                               |
| 4c      | "when spellme lands, say three"  | too small — the count is **derived per settle** from accessible-and-empty phases, so it is two in the barred state the document already draws                               |
| 5       | four dependent sites             | **five** — the fifth was invisible to this file's own unwrap command (see § Mechanics)                                                                                      |

**The human ruled three things on 2026-08-15**: `station` takes neutral wording
and its shape defers to 0.3; class 2 widens rather than the announcer escaping
it; and all four class-2 homes are edited now, `lib/masking/` included. The two
naming rulings are dated **2026-08-15**, not 08-14 — `8cc4bc15` recorded them
undated and landed 08-15 09:55, and the two parentheticals already in the tree
saying 08-14 were corrected. The **Rail selection** is genuinely 2026-08-14
[measured: `git show -s --format=%ci a1f4d132`].

### The round-3 report, as written

**Findings 1–5 are AR-1 round 3's, independently verified, all holding. Findings
6 and 7 are AR-1's lower-severity items promoted by the outgoing session; they
carry no independent verification.** Re-verify everything — this repo's standing
lesson is that an AR verdict is itself a claim.

**Findings 2 and 5 are NOT mechanical.** They are design decisions wearing edit
clothing. Budget for judgment, and consider putting 5 to the human.

### 1 · `break` is still the live vocabulary; `barring edge` is glossary-only

The rename landed in the glossaries and not in the prose. Unwrapped counts
[measured: `tr '\n' ' ' < f | grep -oiE "\bbreaks?\b" | wc -l`]:

| file                  | `barring edge` | `break` occurrences |
| --------------------- | -------------- | ------------------- |
| `README.md`           | 3              | 3                   |
| `ux/wireframes.md`    | 5              | **12**              |
| `ux/personas.md`      | 0              | **4**               |
| `ux/user-journeys.md` | 0              | **4**               |
| `DOCS.md`             | 0              | 1                   |

**THE RENAME RULE, because the counts are not work items.** Only the **noun
meaning "the point at which the machine stopped"** becomes `barring edge`. These
stay:

- the ordinary verb — "a single shared slot would **break** that split", "a
  drawn line is the first thing to **break** under a host's font stack";
- the learner's action — "0:20 — they **break** it";
- the sanctioned negation in the glossary — "Deliberately not 'the **break**'…",
  which must keep the retired word to be legible at all. The README's 3 and
  `DOCS.md`'s 1 are all in these categories and need no edit.

Undecidable cases you must rule on and then apply consistently: the section
heading `## The parse breaks — the machine stopped`, and "When the parse
**breaks**". **Whatever you decide becomes contract — say which in the commit
body.**

`ux/wireframes.md:134` — "the same one that draws one break and one cause" —
**was added by `8cc4bc15` itself**, forty lines below the entry retiring the
word. `personas.md`'s Frogrammer requirement is still named "Reading the break
once", i.e. the standard the wireframes are judged against, in a retired term.

**Done when:** no noun-sense `break` survives in the four files, and the
undecidable cases are ruled and recorded.

### 2 · The announcer has NO surface class — and fixing this REVERSES the previous commit

`ux/wireframes.md:84-86` replaced the announcer's class-2 claim with three
rules. But `:552` still says "a permanently-mounted, visually-hidden **class-2**
live region", and `:571` still says "It is **class 2 by argument**, not by
ruling."

**Read this before deciding it is a deletion.** The placement rule does not
confer a class:

> "The class of a surface is a static fact of what the surface IS — nothing
> derives it at runtime, **and it does not follow from which container the
> surface renders in**" [read: `orchestrate/lib/masking/README.md`]

Class 3 is "everything else", and
`SurfaceClass = 'editor-based' | 'meta-control' | 'maskable'` [read:
`orchestrate/lib/masking/types.ts`]. **So by the region's own exhaustive
taxonomy the announcer is class 3 and goes `inert` under strict** — precisely
what its placement rule exists to prevent ("a silenced announcer is worse than
none"). Deleting `:552` and `:571` leaves the announcer class-less and shipping
that bug.

**So the fix is to REVERSE a deliberate decision from `8cc4bc15`**, whose body
says "THE ANNOUNCER IS RESPECIFIED AS RULES, NOT AS A BORROWED CLASS." That
reversal is sanctioned by AR-1 round 3 and is the recommended path — but state
it as a reversal in your commit body rather than presenting it as tidying.

AR-1's counter-proposal: widen class 2 rather than escape it — "meta-level
**nodes** that must survive every posture: the meta-level controls, and the
announcer, which is not a control but must never go inert." `SurfaceClass` stays
at three members.

**"One sentence" is wrong by a factor of four.** The class-2 definition has four
homes [measured]:

- `orchestrate/README.md` § Enforcement (prose)
- `orchestrate/README.md` glossary, `surface classes` entry
- `orchestrate/lib/masking/README.md`
- `orchestrate/lib/masking/types.ts` (JSDoc on `SurfaceClass`)

plus citation sites in `ux/wireframes.md` and `DOCS.md`. **Two of the four live
in `lib/masking/`, a different module with its own Phase-0 contract — whether
editing it is in scope at 0.2 is unresolved and is worth asking the human.**

**Done when:** the announcer has a stated class, every one of the four
definitional homes agrees, and no text contradicts the decision.

### 3 · `station` is on a banned-term list — instructed by handoffs, NOT machine-enforced

[read: `.planning-handoffs/study-lenses-phase0-2-keystone-contracts.md:140` —
"Banned-term grep before any commit (full output, never truncated): `kernel ·
station · applicableTo · isJeJ · admission gate · plugin · picker · dial · run
button · creation-as-phase`"]. Two more live handoffs instruct agents to run
that grep by hand, and one records "**Migrated content counts as new writing
(maintainer ruling, 2026-07-15). There is no migration exemption.**"

**There is no mechanized gate** [measured: `.husky/pre-commit` is `npx
lint-staged`; lint-staged runs `prettier --write` only; no script greps banned
terms]. An earlier draft of this file called it a pre-commit gate — that was
wrong, and it would have sent you hunting for a hook that does not exist. The
finding still holds: the next agent who runs that grep by hand over
`orchestrate/**` gets hits and has no evidence the ban was lifted.

**Done when:** the README's `station` glossary entry names the ban and its
2026-08-14 override.

### 4 · The restored empty-station copy did not reach the artifact that constrains 0.3

- **4a** — `README.md` names neither "four phases have nothing to open yet" nor
  the spoken per-station reason [measured: unwrapped grep → 0]. The README's
  copy-ownership contract is its `display labels` entry, which `8cc4bc15`
  extended to absorb the fit-mark copy and did not extend to absorb this.
  `user-journeys.md` says "Not a specification — the region README is that."
- **4b** — the line renders in **one full frame of three**. "Full frame" means a
  drawing showing the whole instrument top to bottom; there are three
  (`## Fresh mount`, `## Strict, covering — editor mode`,
  `## An excursion open`). The latter two draw four bare `·` with no reason.
  Excerpt drawings omitting it are fine.
- **4c** — "**four** phases have nothing to open yet" is a **derived count**
  with no stated derivation. `spellme` declares `phase: 'tokens'` and is not yet
  on the built-in roster [measured: `lib/composing/built-in-lenses.ts` →
  parsons, writeme, debug-props]; when it lands the sentence must read "three".
  Every other learner-facing string here is keyed and zipped against a constant.

**Done when:** the copy and its derivation rule live in the README's display-
labels entry, and all three full frames draw it.

### 5 · `station` is defined as a control, and four of five are not — DESIGN DECISION

Both `README.md` and `ux/wireframes.md` define **station** as "the rail's
per-phase **control**". `wireframes.md` also says a station with nothing to open
has "**no tray and no disclosure control at all**", and four of five phases are
in that state today.

Two load-bearing arguments rest on the false half: the rail's class-3 argument
("**Because its stations are controls**, the rail is unambiguously class 3 —
there is no control-free part of it"), and the announcer's reason for existing
("The rail's stations are controls, so the rail cannot itself be a live
region").

`Station` is the first type 0.3 writes. Is it a control, or a discriminated
union —
`{ phase, label, mark } & ({ kind: 'openable', tray } | { kind: 'bare' })`?
AR-1's counter-proposal is the union, plus rewriting the class-3 argument on a
ground that survives a kit of zero: _the rail dims whole because it is one
element in the maskable container, and partial dimming of a lifecycle line would
read as a machine state rather than a posture._

**Done when:** the definition and both dependent arguments agree. **Consider
putting this to the human — it shapes the first type.**

### 6 · "accessible name" is the wrong mechanism _(promoted, unverified)_

`wireframes.md` says each empty station carries its reason "in its **accessible
name**". An accessible name is computed for elements with a role; an empty
station explicitly has no control, and `aria-label` on a role-less generic
element is a no-op. Say **visually-hidden text inside the station**.
`personas.md` already licenses it. Note it reaches Journey 6's linear reader
(`## Journey 6 — through a screen reader`) and **not** Journey 5's
(`## Journey 5 — by keyboard only`), who traverses by control — while the
justification sentence claims "a reader traversing station by station", the mode
it does not serve.

### 7 · Two rulings have no dated home _(promoted, unverified)_

[measured: `grep -rn "human ruling"` over `README.md DOCS.md ux/` → 3 hits]. The
**barring-edge rename** carries no `(human ruling 2026-08-14)` parenthetical in
either glossary entry, and **the Rail selection** — the campaign's most
consequential ruling — is undated and not in the greppable form.

## DEFERRED TO 0.3 — SUPERSEDED; see [`DECISIONS.md`](./DECISIONS.md) § 0.3 entry conditions

**THE MERGE HAS LANDED. This section holds no membership and no deferral** —
[`DECISIONS.md` § 0.3 entry conditions](./DECISIONS.md) is the only home (R-M
2026-08-17, and R-Q 2026-08-18 settling which of that file's two sections
survives). `DECISIONS.md § Deferred to 0.3` was **deleted outright**; a pointer
stub is a second home in waiting.

Round 8's BLOCKER 1 was that the two lists disagreed on membership while both
claimed to be the home. The five-item list was a strict subset of the eight-item
one, so three items had no home at all, `D7` was in neither, and four further
carry-forwards lived only in this section's prose bullets. **All of them are now
rows or lines in the merged table**, along with two decisions that had never had
a row: the editor-mode scrim geometry (**B12**) and the screen-reader structure
obligation (**G6**).

**What survives below is REASONING, not a task list, and its counts are stale by
construction** — the `strip` table was measured at `8cc4bc15` and this document
has already gone stale on that number once. Read it for why the split was drawn,
then act from `DECISIONS.md`.

`8cc4bc15` split AR-1's B3 against the reviewer's counter-proposal: the
**glossary** gained the new vocabulary immediately; the **prose migration** was
deferred here.

**Fix the stated rationale when you do it.** The commit argued the prose
describes "what the region IS and the Rail does not exist yet" — backwards under
`prospective`, where the 0.1–0.3 artifacts are _supposed_ to describe the
unbuilt thing. The real constraint is `DEV.md`'s ban on lifecycle/status
narration in end-state docs, which rules out the obvious patch. The split's
outcome survives; its argument does not.

**Scope** — `strip` counts [measured at `8cc4bc15`: `grep -oci strip`]:

| file                                 | uses                                        |
| ------------------------------------ | ------------------------------------------- |
| `orchestrate/README.md`              | **12** (11 outside the retirement sentence) |
| `orchestrate/DOCS.md`                | 9 — **untouched by this campaign so far**   |
| `orchestrate/phases-panel/README.md` | 6                                           |
| `orchestrate/phases-panel/DOCS.md`   | 8                                           |
| `orchestrate/phases-panel/index.tsx` | 3                                           |
| `orchestrate/phases-panel/types.ts`  | 1                                           |

An earlier draft said 10 for the README; that was `a1f4d132`-era and `8cc4bc15`
added two. **Re-measure at your own HEAD before quoting it — this number has
already gone stale once inside this very document.**

**`phases-panel/` is the deepest and was missing from the commit body's stated
scope.** It is the directory that _defines_ the strip's contract, which the Rail
abolishes. Whether that directory survives at all is 0.3's question.

### Other 0.3 carry-forwards

- ~~**Module homes for the five new nouns**~~ — **RESOLVED by `d33aef0a` (ruling
  R-A). Every clause that stood here is now FALSE at HEAD**: § What lives here
  lists `rail/`, `phases-panel/` is gone from the manifest, and `index.tsx` is
  documented as the nameplate's and announcer's home. Kept struck rather than
  deleted, because a reader who remembers this as open needs to see it closed.
  **One residue nobody has filed:** `phases-panel/` still EXISTS on disk while
  no longer appearing in the manifest. Listed-but-unbuilt `rail/` is correct
  under `prospective`; unlisted-but-existing is a gap against `DEV.md` §
  Directory Documentation Convention. Round 5 did not catch it.
- **The editor-mode scrim geometry.** `wireframes.md` draws a full-width blocked
  sentence below the code in editor mode. In the live DOM the overlay is
  `position:absolute; inset:0` inside a wrapper whose only children are the
  excursion slot (`null` in editor mode) and the recommendations (rendered only
  when non-empty) — so with no proposals the wrapper is zero-height and the
  sentence has nowhere to go. Either the drawing specifies a restructure or it
  is wrong. jsdom cannot catch this; the tests assert node presence only.
- **The tray-entry/re-open collision.** The tray entry for the open lens closes
  it; the region deliberately allows a proposal to RE-open the open lens,
  re-resolving its config in place. Same lens, two affordances, opposite
  meanings.
- **Editor-mode proposals and the masked generator are asserted in prose and
  never drawn.**
- **`src/lib/embody/language-levels/just-enough-javascript/README.md`'s
  `station` staleness is deeper than the word** — it names `parse` as a phase,
  which has not been a live phase name since the cutover. AR-1 asked for a
  `station`→`phase` edit; declined, because it would make the sentence look
  correct while still naming a nonexistent phase. Left for that level's owner.
  (Note the path: `embody` is a **sibling** of `study-lenses`, not a child.)
- **`src/pages/l1-picker.tsx`'s stale `station` comment** — deliberately not
  actioned; it correctly describes the deprecated tree it renders.

## Commit form — this is convention, not preference

Look at `git show --format=%B -s 8cc4bc15` for the worked example. A commit body
here carries: the **settings line** first; `[measured:]` / `[read:]` /
`[relayed:]` on **every** repo-state claim; a **loss ledger** enumerating every
omission, merge or reword with its justification (silent loss is treated as
severity-equal to a failing test — say "LOSS LEDGER: NO REMOVALS" when true);
the per-file checkpoint results; and a justification if you used `--no-verify`.

**And before it lands, answer
[`DECISIONS.md` § How to maintain it](./DECISIONS.md)'s THREE intake questions**
— did this commit take a decision, did it discover a site, and **did it edit a
row** (in which case re-read that row AS RENDERED, not as a diff; R-AB,
2026-08-19). They are cited here rather than restated, because one rule with two
homes is the defect this campaign has spent six rounds removing from the region.
This template is the thing that actually fires; the checklist is what it fires.

## Mechanics that will bite you

- **COMMIT THIS FILE IF `git status --short` SHOWS IT AT ALL** — untracked OR
  modified. An earlier revision guarded only _untracked_, which does not fire
  once the file is tracked; it has since sat dirty with two hundred uncommitted
  lines that were the only record of a whole AR round. It was untracked when
  written — the deferral's "only durable home" was one `git clean -fd` from
  gone. If you find it untracked again, commit it before anything else.
- **Shared worktree, and it moves during your session.** Three files staged by a
  concurrent session sit in the index and are not yours. There are also
  **unstaged foreign modifications including a DELETION** (`MVP-ROADMAP.md`
  deleted, `PEDAGOGY.md` and `lib/questioning/LOSS-LEDGER.md` modified). A
  `git commit -a`, or a pathspec broader than your own files, sweeps another
  session's deletion into your docs commit.
- **Pathspec-commit always**: `git commit -F <msg> -- <paths>`. A pathspec
  commit takes WORKING-TREE content of those paths. Verify with
  `git status --short -- <paths>` first.
- **`--no-verify` is licensed here AND it obliges you.** The reason is the
  peer's staged files: lint-staged runs over the whole staged set rather than
  your pathspec, so the hook would reformat another session's work into your
  commit. An earlier revision of this file gave a different reason — "eight
  lines of pre-existing tab-to-space fence drift" in `orchestrate/README.md` —
  and that reason was **false**: those eight were the markdownlint-from-the-
  wrong-directory artifact described above, and prettier _wants_ those tabs.
  (There was one genuine pre-existing prettier drift, a nine-line prose rewrap
  in the `house token` glossary entry; `929d9086` normalized it and declared
  it.) Because you are bypassing the hook, run the per-file checkpoints by hand
  — every one, on every changed file, **from the repo root**.
- **Per-file checkpoints** (the compound script does not forward file args):
  `npx markdownlint-cli2 --no-globs "<file>"` · `npx cspell "<file>"` ·
  `npx prettier --check "<file>"`. New files: `--write` is safe. Pre-existing
  files: `--check` first, because `--write` reflows drift that is not yours.
- **cspell registration is per-file**, via an inline `<!-- cspell:ignore … -->`
  header. British spellings and coinages need it; check what each target file
  already registers before assuming a word is new.
- **THREE SEPARATE GREP TRAPS, and the third one bit this campaign hardest.**
  1. **`git grep` and single-line greps LIE on prettier-wrapped markdown.** A
     phrase spanning a wrap is never on one line. Unwrap first.
  2. **`tr '\n' ' '` is NOT a sufficient unwrap**, which is the form an earlier
     revision of this file prescribed. It replaces the newline but leaves the
     wrap's leading indent, so the phrase becomes
     `stations are<3 spaces>controls` and a literal grep still misses it.
     Squeeze whitespace instead: `tr -s '[:space:]' ' '`. [measured **at
     `8cc4bc15`**, via `git show 8cc4bc15:<path> | tr …`: `stations? are
     controls` → **2** hits under the old form, **3** under the squeezed one,
     and the missed one was finding 5's fifth dependent site. **It reproduces
     only at that SHA** — `bdf5077c` removed the phrase, so at HEAD you get 0/0
     and would wrongly conclude the defect is imaginary.]
  3. **NEVER COUNT WITH A CONTEXT WINDOW.** An earlier revision prescribed
     `grep -oE ".{0,60}<pat>.{0,60}"` for everything. `grep -o` **consumes
     overlapping matches**, so two hits closer together than the window collapse
     into one and the count comes back SILENTLY LOW [measured 2026-08-15:
     `barring edge` in `ux/personas.md` → the context form reports **1**; the
     truth is **2**]. Separately, `grep` here is **ugrep**, which rejects wide
     windows over multi-byte text with "exceeds complexity limits" — piped to
     `wc -l` that also prints a clean-looking `0`. Both failures look like
     success.

  **So use two different commands and do not mix them up:**

  ```bash
  # COUNT — bare pattern, no context window, no overlap loss
  tr -s '[:space:]' ' ' < file | grep -oiE '<pattern>' | wc -l

  # READ the hits — python consumes no overlaps and has no complexity limit
  python3 -c "
  import re,sys
  t = re.sub(r'\s+', ' ', open(sys.argv[1]).read())
  for m in re.finditer(sys.argv[2], t, re.I):
      print(f'…{t[max(0, m.start()-70):m.end()+70]}…')" <file> '<pattern>'
  ```

  Single-token patterns (`\bbreaks?\b`) are immune to trap 2 but **not** to
  trap 3.

- **A SUBAGENT'S REPORT IS NOT WHERE YOU WILL LOOK FOR IT, AND THIS COST TWO
  AGENTS A FALSE CONCLUSION.** An AR verdict returned by a spawned reviewer is
  **not in the repo** and **not in the session's own `.jsonl`**. It is in
  `~/.claude/projects/<project-slug>/<session-id>/subagents/*.jsonl` — a
  directory a top-level `*.jsonl` glob does not descend into. Round 8's verdict
  was declared lost on exactly that basis [measured 2026-08-18: `grep -ril
  "round 8" .` → this file only; `find . -iname "*AR-LOG*"` → nothing], and both
  searches were correct about the repo and wrong about the machine. **Do not
  conclude a verdict is unrecoverable until you have looked there.** Recover it
  with `json.loads` over the session `.jsonl`, pulling the `<result>` block out
  of the `task-notification`; splice it programmatically rather than retyping,
  so it is verbatim by construction.

  **And unescape it.** The transcript stores the reviewer's text HTML-escaped,
  so `<the parser's message>` arrives as `&lt;…&gt;` and renders literally
  inside code spans. Byte-identity to a transcript is not fidelity to what the
  reviewer wrote — that mistake shipped once here and was corrected in
  `be818f9d`.

- **The markdownlint `enable` directive RE-ENABLES RULES THE PROJECT CONFIG
  TURNED OFF**, not merely the ones you disabled. Using it to close a disabled
  region took this file from 0 to **86** errors, all in pre-existing content.
  Use the `capture` / `disable` / `restore` trio instead, which restores the
  configured state rather than the default one.

  **And do not write those directives out in full in prose — they FIRE.** They
  are HTML comments, and markdownlint parses them wherever they appear,
  including inside backticks. Writing this very bullet with the comment
  delimiters intact enabled `MD013` from that point on and produced a
  line-length error a thousand lines later, in a table nobody had touched. Name
  the directives by their bare words, as above.

- **prettier is NON-IDEMPOTENT on some block quotes.** One written here gained a
  nesting level per `--write` and had stray `>` injected into its prose. If
  `--check` still fails right after a `--write`, that is the tell: stop fighting
  it and use plain paragraphs. Verify by running `--write` twice and diffing.

- **`markdownlint-cli2` resolves its config from the CURRENT WORKING
  DIRECTORY**, not from the linted file's tree. Run it from the **repo root** or
  it silently falls back to default rules and invents failures: from
  `orchestrate/` it reports **8** errors on `README.md`; from the repo root it
  reports **0** [measured 2026-08-15, both]. Those 8 are MD010 hard-tab hits on
  the `StudyLensesProperties` fence, and `.prettierrc.json` sets
  `"useTabs": true` — so they are not debt, they are an artifact of running the
  linter from the wrong directory. This nearly put false checkpoint numbers into
  an immutable commit body.

## Sandbox checkpoints owed at Phase 1

Route: `npm start` → `http://localhost:3000/spiralearn/sandbox/orchestrate/`.
**The `/spiralearn/` prefix is load-bearing, and a missing route still returns
200 from the dev shell — verify in a real browser, never by status code.** Rows
route into `orchestrate/PHASE-1-CHECKPOINT-LEDGER.md`.

| #   | Named action                                                | Expected observation                                                                                                                  |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| T1  | Load; read the control row, rail, pane, proposals           | tokens applied; console clean                                                                                                         |
| T2  | Click the navbar moon                                       | **house tokens AND lens tints both flip** — the observation jsdom structurally cannot make                                            |
| T3  | Read the four empty stations parsing, then with `1 +`       | the reason renders; the barring edge names its cause **once**; empty vs waiting legible without reading                               |
| T4  | Inject several lenses into one phase; read at 1 and many    | the rail's geometry does not move. **Requires editing `spiralearn/sandbox/orchestrate/index.mdx`**                                    |
| T5  | Scaffold level + strict + `debugger;`                       | overlay names level and violation; rail dim+inert; Generate code dim+inert at its own element; class 2 lit                            |
| T6  | Open a lens, then Edit code; press Tab                      | focus lands somewhere meaningful, not `body`. **R-11's third sighting** — two stand; a third promotes it                              |
| T7  | Arrow through the lens picker without committing            | **no lens opens**                                                                                                                     |
| T8  | Screen reader: open a lens; then trip the mask              | both announced; the blocked sentence spoken **once**, not twice                                                                       |
| T9  | Full keyboard pass; repeat reduced-motion and forced-colors | every control reachable; focus ring visible in both tones; nothing conveyed by opacity alone                                          |
| T10 | Screen reader: traverse the rail with a barring edge drawn  | the barred stations speak `waiting` and nothing else; the cause is heard ONCE, unattached to any station. **Is that acceptable?** C15 |

## The process failure to not repeat

Round 1 produced 3 blockers, round 2 produced 4, round 3 produced 5 — **and
three of round 3's were created by round 2's fixes.** The remedy AR-1 named, and
which this campaign did not apply:

> **After any fix pass, verify the diff — every sentence the fix touched, plus
> every sentence that CITES it.**

Both of round 3's worst findings would have died in a five-minute grep for the
term being replaced. The same failure produced the stale `strip` count inside
this document. Run the grep; it is mechanical and does not depend on judgment.

## Recommended opening move — ROUND 5's, SUPERSEDED BY § ROUND 8 ABOVE

**Round 5 returned PAUSE. Fourteen findings are open; B1 and B2 are done.** In
this order:

1. **Write the decision list FIRST, before any fix.** See § What round 5 says
   about this campaign's method. Five rounds of greps have missed one orphan
   each; both of round 5's misses are in prose that never uses the retired term.
   The list of the arrangement's decisions, checked per decision against which
   sections assert something about it, is the instrument that catches those. It
   is cheap once. Doing another grep sweep instead is the predictable wrong move
   and it has failed five times.
2. **Land R-D — the nameplate's class 2 widening.** It is the only open finding
   on the accessibility-tree critical path, the ruling is already taken, and it
   is a **rule amendment, so it ships alone**. Its four homes are the class-2
   definitional sites `929d9086` edited. Until it lands, R-D lives only in this
   file's rulings table, which `DEV.md § Ruling provenance` calls findable but
   not readable where it binds.
3. **Then B4**, which is a scope correction as much as an edit: the behavioural
   half of the strip migration comes forward; the vocabulary half stays
   deferred. Say which in the commit body, because the last session got exactly
   this line wrong.
4. **Then the eight IMPORTANT.** Four are round 4's own damage (I1, I2, I5, I7)
   and are small. I8 is not small — the announcer has no channel and two of its
   three utterances have no event, which is a `types.ts` question, not a prose
   one, and it may belong to 0.3 rather than here. **Decide that explicitly
   rather than by omission.**
5. **The four MINOR.** M1 is one line and free today.
6. **Re-run `ar-1`.** Registered agent, **no `model` parameter**, read-only.
   Inputs: `orchestrate/README.md` plus all three `ux/*.md`, naming
   `lib/masking/{README,DOCS,types}`, `DOCS.md`, `event-bus/` and `index.tsx` as
   changed-in-cycle context. Give it a `## Changes since round 5` orientation
   with the SHAs.

**On the next PAUSE, do not open round 7 alone — put it to the human.** Rounds
have now gone 3 → 4 → 5 → 3 → 4 blockers with every pass generating some of the
next round's findings. Round 5's own reviewer says a sixth sweep is the wrong
instrument.

**A note on the harness, because it cost the last session hours.** Four subagent
dispatches failed before one succeeded — two Plan agents and two `ar-1` runs, on
`API Error: Connection closed mid-response` and one 600s stall. The one that
worked was **resumed from its own dead transcript** via a follow-up message
rather than relaunched cold, which preserved ~150k tokens of reading. If a
reviewer dies mid-run, try resuming it before you spend the budget again.

**Organise the work BY PASSAGE, not by finding.** The round-4 resolution was run
this way end to end and it is the reason the nine commits scatter the finding
numbers. For every sentence you rewrite, grep the distinctive noun phrase you
REMOVED across all seven files before you move on. Derive that phrase list
mechanically rather than from memory —
`git diff --word-diff=porcelain -- <paths> | grep '^-'` gives you the removed
words and your loss-ledger entries in one command.

**And then read what the grep cannot reach.** The round-4 resolution caught one
orphan it had itself created (§ Commits), which is the discipline working — but
the fourth blocker-2 citation was in a **table cell that never used the phrase
being retired**, and no grep of any form would have surfaced it. After the
mechanical sweep, read the pass table and every fenced drawing by eye. The
mechanical half is necessary; it has never been sufficient in this campaign.

**Two mechanical aids this campaign built and you should use:**

- `node scripts/check-governance.mjs --migration "<file>@HEAD" "<file>"` — the
  repo's own loss-lister. It catches vanished headings, bold terms and
  backticked tokens. Blind to plain sentences, table cells and fence bodies.
- The drawing invariant: every full frame carrying a mark row must carry the
  reason line; one that abbreviates the rail carries neither; band excerpts are
  exempt. Two greps, not a re-reading.

When AR-1 clears, 0.2 closes and 0.3 opens: `types.ts`, the `DOCS.md` sketch
amendment, the `strip` vocabulary migration recorded above, and the tests
written for real and committed skipped — then `ar-2`, then the human gate.

**Design work runs on the strongest available model tier.**
