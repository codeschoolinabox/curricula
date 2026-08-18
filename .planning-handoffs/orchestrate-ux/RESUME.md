<!-- cspell:ignore actioned acyclicity affordances authorised behaviour behavioural brok checkpointed codemod codepoint cutover failable finditer homehood misdescribes organise organised parentheticals respecified spellme ugrep unactioned unbuilt undercount undercounted undercounts undrawn unretired unrun wireframes -->

# orchestrate ux — resumption point

**STATE: Phase 0 step 0.2. AR-1 ROUND 8 HAS RUN AND RETURNED PAUSE — 3 blockers,
5 IMPORTANT, 6 MINOR. Rounds 5, 6 and 7 are ALL RESOLVED, in fifteen commits.
Round 8's three blockers are your open work.**

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

## ROUND 8 — PAUSE, 2026-08-17. THIS IS THE OPEN WORK

All three blockers were verified against the tree this session, not relayed.

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

## Recommended opening move

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
are ALL RESOLVED — none of it is a task list.** § Mechanics that will bite you,
§ Commit form, § Sandbox checkpoints and § The process failure to not repeat are
still live and still bind.

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

**This section is NO LONGER the deferral's home** (human ruling 2026-08-17,
R-M): `DECISIONS.md § 0.3 entry conditions` is. Round 8's BLOCKER 1 is that the
two disagree on membership — **collapse them into one table before relying on
either.** Kept here until that merge lands, because this list is currently the
longer of the two.

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
[`DECISIONS.md` § How to maintain it](./DECISIONS.md)'s two intake questions** —
did this commit take a decision, and did it discover a site. They are cited here
rather than restated, because one rule with two homes is the defect this
campaign has spent six rounds removing from the region. This template is the
thing that actually fires; the checklist is what it fires.

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

| #   | Named action                                                | Expected observation                                                                                       |
| --- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| T1  | Load; read the control row, rail, pane, proposals           | tokens applied; console clean                                                                              |
| T2  | Click the navbar moon                                       | **house tokens AND lens tints both flip** — the observation jsdom structurally cannot make                 |
| T3  | Read the four empty stations parsing, then with `1 +`       | the reason renders; the barring edge names its cause **once**; empty vs waiting legible without reading    |
| T4  | Inject several lenses into one phase; read at 1 and many    | the rail's geometry does not move. **Requires editing `spiralearn/sandbox/orchestrate/index.mdx`**         |
| T5  | Scaffold level + strict + `debugger;`                       | overlay names level and violation; rail dim+inert; Generate code dim+inert at its own element; class 2 lit |
| T6  | Open a lens, then Edit code; press Tab                      | focus lands somewhere meaningful, not `body`. **R-11's third sighting** — two stand; a third promotes it   |
| T7  | Arrow through the lens picker without committing            | **no lens opens**                                                                                          |
| T8  | Screen reader: open a lens; then trip the mask              | both announced; the blocked sentence spoken **once**, not twice                                            |
| T9  | Full keyboard pass; repeat reduced-motion and forced-colors | every control reachable; focus ring visible in both tones; nothing conveyed by opacity alone               |

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
