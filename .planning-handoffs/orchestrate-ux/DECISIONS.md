<!-- cspell:ignore affordance affordances authorised behaviour behavioural codemod codepoint failable finditer misalign organised restor spellme unbuilt undercount undercounts undrawn unfiled unretired wireframes -->

# the arrangement's decisions — and who asserts them

**What this file is.** One row per decision the Rail arrangement has taken, with
its **home of record** and **every site that asserts something about it**. It is
a campaign instrument, not end-state documentation (human ruling 2026-08-16):
`DEV.md` § Directory Documentation Convention keeps status, phase and
cross-reference bookkeeping out of `README.md` / `DOCS.md` / `types.ts`, and a
"which documents assert this" index is exactly that bookkeeping. It lives here,
beside [`RESUME.md`](./RESUME.md), and prunes with the campaign.

**Why it exists.** AR-1 round 5's reviewer named the instrument this campaign
had been missing, after five rounds in which every pass generated some of the
next round's findings:

> write the list of the arrangement's **decisions**, and check, per decision,
> which sections assert something about it.

Blocker counts have run **3 → 4 → 5 → 3 → 4**. Five rounds of phrase-greps have
each missed exactly one orphan, and **both** of round 5's misses (B4, I2) are in
prose that never uses the term being retired — no grep of any form reaches them.
A sixth sweep is the wrong instrument. This is the right one.

**How to use it.** Before rewriting any sentence, find the decision it asserts
and re-read every site in its row. After rewriting, re-read them again. The
mechanical half of that is
`git diff --word-diff=porcelain -- <paths> | grep '^-'` for the phrases you
removed; the half that has never been optional is **reading the pass table and
every fenced ASCII drawing by eye** — round 4's fourth blocker-2 citation was a
table cell that never used the phrase being retired, and no grep of any form
would have surfaced it.

**How to maintain it.** A new decision gets a row when it is taken, not when it
is reviewed. A row whose site list you had to correct is a row that was catching
something — say so in the commit body.

**THE INTAKE CHECKLIST — two questions every commit answers before it lands**
(human ruling 2026-08-17, after AR-1 round 8).

1. **Did this commit take a decision? Open a row, in the same commit.**
2. **Did it discover a site? File it into every row it asserts** — plural, and
   the plural is the point. Then see receipt-rule amendment 4 for what that does
   to a closed row.

Neither is a new rule. The paragraph directly above already says a decision gets
a row when it is taken; **the delta is that it is now a question asked of the
commit rather than a property described of the file.** A rule stated as a
description of the artifact has no moment at which it fires, and this one did
not fire: the `recommendation` settlement reached `README.md` glossary and no
row was opened for it, so the round-6 failure reproduced on a decision the index
could not see (AR-1 round 8, IMPORTANT 6). Line 2's plural has the same
provenance — `editor/README.md` asserts A1, two A2 roster members with their
grounds, **and** D6, and the census filed it in A1 alone (IMPORTANT 4).

**Why this is a checklist and not a fifth instrument.** Round 8's reviewer is
explicit that the campaign has built four (phrase greps → this list → the
receipt rule → the region census), that each caught its predecessor's blind
spot, and that **"a fifth instrument will find a fifth blind spot"** — because
the measured evidence is that _the instruments work and the intake does not_.
Every recurring finding in that round traces to a skipped filing step, not a
missed detection.

And the honest limit, so nobody mistakes this for a fix: **nothing enforces a
checklist.** Its value is narrower than "it closes the intake" — it turns an
unstated expectation into a line a review can cite, so the next round can name a
broken rule rather than a broken norm. That is worth two lines. It is not worth
believing it fires on its own; the thing that actually fires is the commit-body
template in [`RESUME.md`](./RESUME.md) § Commit form, which now points here.

**THE RECEIPT RULE — the closing discipline, and it is not optional** (human
ruling 2026-08-17). A commit that closes row _X_ must **quote the post-fix
sentence at every site in _X_'s `also asserts` column**, in its own body. Not a
count — a quotation, per site.

Counting a retired phrase to zero proves the old words are **gone**. It says
nothing about whether the new claim **arrived**. Those are different facts, and
only the second is what a fix is for.

This rule exists because AR-1 round 6 caught the campaign shipping the
difference. `b9a534c7` swept eleven retired phrases to zero and left `README.md`
glossary · the rail arguing the rail's class from the retired two-route
enumeration — in the home of record for the routes. **Row A3's `also asserts`
column named that exact site.** The row was right, the fix skipped it, and the
maintenance pass then marked the row `SETTLED`. Under the receipt rule that
commit is impossible to write: the quotation for that site comes up empty, and
an empty receipt is a missed site.

A row you cannot produce receipts for is not closed, whatever the sweep says.

**Mechanical amendments, because the rule's FIRST USE already failed them**
(human ruling 2026-08-17, after AR-1 round 7). `90166bc7` printed fifteen
accurate quotations where the closed rows named **nineteen** sites, and
`4d9a5e1b` then transcribed the completeness claim into this file. Nothing false
shipped — all five missed sites were checked afterwards and none carried a stale
claim — but the argument for closing 0.2 rests on this rule working, and its
first use did not.

1. **No indirection in `also asserts`.** Row A2 read `all four A1 sites`, and
   that is where `ux/wireframes.md` § The parts was lost. Every such reference
   is expanded into the sites themselves. The column is short; duplication costs
   nothing and an indirection has now cost a blocker.
2. **One receipt line per site, INCLUDING the misses.** The block prints every
   site in the column. A site with nothing to quote gets an explicit
   `— NO RECEIPT: <reason>` line rather than being absent. Today a missed site
   and a deliberately-skipped site look identical in a commit body; under this
   form the receipt count and the column count are **the same number by
   construction**. It also gives the rule a vocabulary it lacked: a legitimate
   non-receipt — `display-labels.ts` is unchanged because its widening is
   deferred — is now _stated_ rather than silently missing.
3. **A receipt block is keyed to the ROW, and reproduces its column verbatim**
   (human ruling 2026-08-17, after AR-1 round 8). No scoping phrase may narrow
   the printed set. A fix that genuinely touches less than the whole row still
   prints the whole column, with
   `— NO RECEIPT: unchanged, this fix does not touch it` against the rest.

   Amendment 1 banned the column pointing elsewhere. This bans the receipt
   **redefining what the column is** — the same indirection on the other axis.
   `49b90dba`'s block is keyed to a claim rather than a row: **"A1 the class-3
   statement — all THREE sites"**, against a column that named **five**
   [measured: `git show 49b90dba:<this file>`, A1's `also asserts` — four
   semicolon groups, one of which names two sections of `ux/wireframes.md`]. The
   completeness claim is true of the narrowed scope and false of the row, and a
   reader auditing that commit against this file today sees `all THREE` beside a
   **seven**-entry column. Nothing false shipped — A1 was already `settled` —
   which is exactly why it is written down: the structure was available and
   nothing prohibited it.

   AR-1 round 8 reported this as "six … (seven after the census)". The six is
   wrong and the seven is right [measured, both, at the two SHAs]. An AR verdict
   is itself a claim; the amendment stands on the measured numbers.

4. **Widening a closed row's `also asserts` column RE-OPENS the row** (human
   ruling 2026-08-17, after AR-1 round 8). Its status goes to `open (census)`
   until the new sites are receipted like any other.

   Amendments 1–3 all govern the moment a row **closes**. Nothing governed what
   happens **after**, and a region-wide census exists specifically to produce
   that event: `8f820355` added two sites to A1's closed column and wrote
   "RECEIPTS: none owed". That was true under the rule as written and it is the
   hole — a row whose site set grows after closure is a row whose new sites were
   never checked against the closed claim.

   **This amendment is scoped, deliberately.** It applies from here forward, and
   retroactively to **the columns the census itself widened, and nothing else**
   — the instances round 8 names, and the only ones enumerable in one command.
   Applied without a scope it would re-open every row whose column ever grew
   after closure, a set nobody has counted; an amendment whose reach is left to
   the reader is the next finding waiting to be written.

   **The retroactive set is one row.** [measured: `git show 8f820355` against
   `8f820355^`, `also asserts` cells compared per row — **A1** alone gained
   sites while `settled`, namely `editor/README.md` and `index.tsx`. **A2** also
   changed, but from `all four A1 sites` to the enumeration itself: that is
   amendment 1's de-indirection, not a widening, and it added no site A1 did not
   already carry.] A1's status is set to `open (census)` in this commit.

**Rows whose `home of record` is `none` are the other trap.** For A13 and C11
the column IS the whole set, and the reflex was to receipt the new home and
stop. When a row has no home, receipt every site in the column and the new home.

## Reading the columns

- **home of record** — the one document that OWNS the decision. Editing the
  decision means editing this first.
- **also asserts** — every other site that states, cites, or depends on it.
  These are what a fix orphans.
- **status** — `settled` · `open (<finding>)` · `0.3` (deferred) · `unfiled`.
  `open (census)` is the value amendment 4 writes when a closed row's column is
  widened.

Paths are relative to `src/lib/study-lenses/orchestrate/`. Section names are
`§ heading`; glossary entries are `glossary · term`.

---

## A · The surface classes

The most-cited decision in the region. **The census below is the first one run
over the REGION rather than over a chosen file list** — every previous count
sampled a list someone had written down, which is why the site set grew in four
consecutive rounds (four homes → six → eight → and now these).

[measured 2026-08-17: `class 1|class 2|class 3|class-[123]`, squeezed-unwrap,
over every `.md`/`.ts`/`.tsx` under `orchestrate/`] — `README.md` 26 ·
`ux/wireframes.md` 22 · `index.tsx` 8 · `DOCS.md` 7 · `lib/masking/README.md` 5
· **`editor/README.md` 4** · `PHASE-1-CHECKPOINT-LEDGER.md` 2 ·
**`editor/DOCS.md`** · **`guide/DOCS.md`** · `guide/README.md` ·
**`level-ui/DOCS.md`** · `level-ui/README.md` · `lib/masking/types.ts` ·
`tests/index.test.tsx` · `ux/user-journeys.md` — 1 each. **Fifteen files, where
the previous census listed eight.**

**`editor/README.md` is the sharpest miss**: one paragraph there asserts A1, two
A2 roster members with their grounds, AND D6 — the strip's none entry as a live
dispose raiser, the thing the Rail abolishes — while carrying the retired
`strip` vocabulary twice. It has never appeared in any row's column.

| #   | decision                                                                                                         | home of record                                      | also asserts                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | status                                                                                                                                                                                                                                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Three classes, exhaustive over the surfaces the mask ACTS ON; the overlay is apparatus and takes no class        | `README.md` § Enforcement                           | `README.md` glossary · surface classes; `lib/masking/README.md` § The three surface classes; `lib/masking/types.ts` `SurfaceClass`; `ux/wireframes.md` § The parts, § Strict, covering — editor mode; **`editor/README.md`**; `index.tsx`                                                                                                                                                                                                                                                 | **`open (census)` + round 8 M9** — `editor/README.md` and `index.tsx` entered this column after it closed (`8f820355`), so amendment 4 re-opens it until both are receipted; and `lib/masking/README.md` still opens class 3 as "everything else", the wording BLOCKER 1 retired at three sites surviving at the fourth |
| A2  | The class-2 **roster**, and the routes by which a node earns the class                                           | `README.md` § Enforcement                           | `README.md` glossary · surface classes; `lib/masking/README.md` § The three surface classes; `lib/masking/types.ts` `SurfaceClass`; `ux/wireframes.md` § The parts; `ux/wireframes.md` § Strict, covering — editor mode; `DOCS.md` § Structural constraints · Class-2 nodes never mask; `ux/wireframes.md` § What the arrangement never changes; `guide/README.md`; `level-ui/README.md` — **enumerated rather than referring to "the A1 sites", per the receipt rule's first amendment** | **SETTLED** `90166bc7` — the routes have ONE home (§ Enforcement); the other 7 sites cite it. **Round 8 M10 re-opens the roster SIZE**: `ux/wireframes.md` § What the arrangement never changes still says "Two of the **seven**", a roster-size numeral at a non-home site, in a file the same commit edited           |
| A3  | The **rail is class 3**, argued from **exhaustion** (not lineage, not containment)                               | `ux/wireframes.md` § Strict, covering — editor mode | `README.md` glossary · the rail                                                                                                                                                                                                                                                                                                                                                                                                                                                           | **SETTLED** `90166bc7` — both of this row's sites receipted; `README.md` glossary · the rail now CITES rather than argues. (An earlier revision said "all 10 sites" — that count is A2's, not A3's)                                                                                                                     |
| A4  | The **nameplate is class 2**, by a fourth route — _naming the pane's occupant_                                   | `README.md` § Enforcement + glossary · nameplate    | `README.md` glossary · nameplate + § What lives here; `lib/masking/README.md`; `lib/masking/types.ts`; `DOCS.md`; `ux/wireframes.md` § The parts + the lens-open drawing. Was **zero of ten mentions** before `b9a534c7`                                                                                                                                                                                                                                                                  | **SETTLED** `b9a534c7` — R-D's wording narrowed by ruling; see below                                                                                                                                                                                                                                                    |
| A5  | The **announcer is class 2**, one of **two** members that are not controls                                       | `README.md` glossary · announcer                    | `README.md` § Enforcement; `lib/masking/README.md`; `lib/masking/types.ts`; `DOCS.md` § Structural constraints; `ux/wireframes.md` § The parts, § Appendix (the override, Journey 6 bullet)                                                                                                                                                                                                                                                                                               | settled                                                                                                                                                                                                                                                                                                                 |
| A6  | Class is a **static fact of what the surface IS**; containment decides nothing                                   | `lib/masking/README.md` § The three surface classes | `lib/masking/types.ts` `SurfaceClass`; `lib/masking/DOCS.md` § Out of scope; `README.md` § Enforcement (the Generate code paragraph); `DOCS.md` § The render projection; `README.md` glossary · control row                                                                                                                                                                                                                                                                               | settled                                                                                                                                                                                                                                                                                                                 |
| A7  | **Generate code** carries class 3 at its own element, in the live control row                                    | `README.md` § Enforcement                           | `README.md` glossary · control row, surface classes; `DOCS.md` § The render projection; `ux/wireframes.md` § Strict, covering — editor mode (drawn), § What the arrangement never changes                                                                                                                                                                                                                                                                                                 | settled                                                                                                                                                                                                                                                                                                                 |
| A8  | The mask makes covered surfaces **inert** and lays a **NON-inert overlay** over them                             | `README.md` § Enforcement                           | `README.md` glossary · blocked state; `lib/masking/README.md`; `index.tsx` comment at the overlay                                                                                                                                                                                                                                                                                                                                                                                         | settled (`0173b1c2`)                                                                                                                                                                                                                                                                                                    |
| A9  | The **reason line beneath the rail is class 3** and dims with it — an unpaid cost                                | `ux/wireframes.md` § Fresh mount                    | `ux/wireframes.md` § Strict, covering — editor mode (drawn annotation)                                                                                                                                                                                                                                                                                                                                                                                                                    | **SETTLED** `b9a534c7` — re-grounded on exhaustion                                                                                                                                                                                                                                                                      |
| A10 | `SurfaceClass`'s class-2 literal is `'meta-node'`                                                                | `lib/masking/types.ts` `SurfaceClass` JSDoc         | nothing — **one consumer, its own declaration** [measured: `git grep -n "SurfaceClass" -- src/` → 1 hit]                                                                                                                                                                                                                                                                                                                                                                                  | **SETTLED** `b767f691` — renamed while it still had one consumer                                                                                                                                                                                                                                                        |
| A11 | **Where the nameplate renders relative to the maskable containers**                                              | none — no document states it                        | the announcer HAS this rule (A5, E3); the nameplate's ruling paragraph gives it a **different** warrant entirely — "the pane occupant is the top component's own state"                                                                                                                                                                                                                                                                                                                   | **SETTLED** `b9a534c7` — outside both maskable containers, as the announcer                                                                                                                                                                                                                                             |
| A12 | How many class-2 members are not controls (**two**: announcer, nameplate)                                        | `README.md` glossary · announcer                    | `ux/wireframes.md` § The parts — "the one member of that class that is not a control"; `lib/masking/types.ts` — "admits **one node** that is not a control"                                                                                                                                                                                                                                                                                                                               | **SETTLED** `b9a534c7` — "one of the two members", all three sites. See A2 for round 8 M10, which is the same numeral at a fourth site                                                                                                                                                                                  |
| A13 | **The blocked overlay's class** — or an explicit statement that it is apparatus rather than a classified surface | none — no document assigns it one                   | `README.md` § Enforcement + glossary · blocked state; `lib/masking/README.md`; `lib/masking/DOCS.md` § Out of scope                                                                                                                                                                                                                                                                                                                                                                       | **SETTLED** `90166bc7` — apparatus, not a classified surface; `SurfaceClass` needs no fourth member                                                                                                                                                                                                                     |

**The collision A2 must settle before it is written.** `ux/wireframes.md`
grounds A3 like this [read, verbatim]: "a node earns that place **one of two
ways**: by restoring conformance, or by carrying the region's voice. The rail
does neither. **It narrates where the machine is**, and narration is not
restoration". R-D's route is _naming where the learner is_ — one word away. An
exhaustion argument is only as strong as its enumeration, so A3 cannot survive
A2 being wrong.

**And the two-way enumeration is already false at HEAD, before R-D touches it.**
The region's own class-2 roster gives grounds that list does not contain:

| class-2 member      | the ground the documents actually give it                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| snippet-type toggle | restores conformance [read: `README.md` § What renders — "its change can itself restore conformance"]                                                         |
| level selector      | restores conformance                                                                                                                                          |
| strict toggle       | a way **out of** the blocked state, not a way to conform — the blocked sentence itself offers "turn strict off" [read: `ux/wireframes.md` § Strict, covering] |
| the guide           | **help is never withheld** [read: `lib/masking/README.md` — "(and help is never withheld)"]; **orientation** [read: `DOCS.md` — "orientation for the guide"]  |
| Edit code button    | **the way home** [read: `DOCS.md` — "the way home for the Edit code button"; `lib/masking/README.md` — "restore conformance **or the path to it**"]           |
| the announcer       | carries the region's voice                                                                                                                                    |
| the nameplate       | R-D — names where the learner is. Not yet written into any home.                                                                                              |

**`ux/wireframes.md` is the outlier against THREE homes, not one.** `DOCS.md`'s
`Class-2 nodes never mask` enumerates **four** grounds — "conformance for the
selector and both toggles, **orientation for the guide**, **the way home for the
Edit code button**" — then adds the announcer separately.
`lib/masking/README.md` carries **three** [read: "never masked, because each
control can itself restore conformance **or the path to it** (and help is never
withheld), and because `inert` would remove the announcer from the accessibility
tree"] — and that "or the path to it" clause is the Edit-code route already
written into a definitional home. `README.md § What renders` carries the split
too. So R-E is a **reconciliation of the twin DOWN to the sketch** plus R-D's
new ground, not the invention of a taxonomy.

**Two homes nobody had listed, both found on this list's first use.** Round 3
established "four homes"; round 5 corrected R-D to "six". Both undercount:

- **`guide/README.md`** [read, verbatim]: "the class-2 criterion the guide
  exists under — a control whose availability restores what the learner needs,
  **here orientation**, is never masked".
- **`level-ui/README.md`** [read, verbatim]: "Both controls are surface class 2:
  never masked, because **each can itself restore conformance**" — which is the
  strict-toggle falsehood a second time, in a file no ruling has authorised. The
  strict toggle does not restore conformance; it **lifts the guardrail**, and
  the twin's own ordering rule (C8) insists the two are opposites.

**Two sites round 5 did not name.** `ux/wireframes.md` § What the arrangement
never changes heads its never-covered list "**The controls that restore
conformance** are never covered" and then lists "the level selector, the strict
toggle, the snippet-type toggle, **the guide**, and the Edit code button" — a
heading its own list falsifies twice, before M2's missing announcer and R-D's
missing nameplate are counted. And A12's uniqueness claim ("the only member of
that class that is not a control") sits in three places, **two of them outside
round 5's six-home list**.

### The route roster R-E should land — and the wording that does NOT work

Genuine **collapses**: Edit code folds into "restoring conformance **or the path
to it**", already written that way in `lib/masking/README.md`; the selector and
the type toggle are one route.

Genuine **NON**-collapses, and each is load-bearing:

- **The strict toggle does not collapse into restoration.** Merging them makes
  C8's ordering rule ("fix the code first, lift the guardrail last") incoherent
  — it exists precisely to distinguish the two.
- **"Orientation for the guide" must not be left as bare _orientation_.** The
  rail is an orientation surface too, so that word taken at face value sweeps
  the rail INTO class 2, and the only thing holding it out would be the word
  _control_ — a criterion `ux/wireframes.md` has already retired ["the first
  rested on the stations being controls, and four of five carry none"]. The
  guide's honest ground is narrower: its topics include what warn and strict
  mean, so **a posture may not withdraw its own explanation.**

Proposed four routes: **acting on the boundary** (selector · strict toggle ·
type toggle · Edit code) · **explaining the boundary** (the guide) · **carrying
the region's voice** (the announcer) · **naming the pane's occupant** (the
nameplate).

**⛔ Do NOT write "naming where the LEARNER is" versus "narrating where the
MACHINE is".** That distinction — the one round 5 proposed and this session was
about to adopt — **is falsified by the twin's own words** [read:
`ux/wireframes.md` § An excursion open — "The open lens's station keeps its mark
while the tray is closed, so **the rail answers 'where am I'** without the tray
being open — which is the whole reason the rail can afford to hide the kit"]. As
worded, R-D's route is satisfied by the rail's `●`.

**The discriminator that survives, and the tree already supplies it.** The
nameplate "**always** names what the pane is holding" [read: same file § The
parts], while the rail names a **phase** and marks **no occupant at all** in two
of the three occupant states — "**No station is marked**, because the generator
belongs to no phase" [read: same file § The generator in the pane], and nothing
is marked in editor mode. So the rail's where-am-I answer is partial and
derivative, and it is a mark on a station strict has just made unreachable. That
is why the route is **naming the pane's occupant**, not naming where the learner
is — and it does **not** reopen `0c78c63c`, because the narrower route still
excludes the rail.

## B · The rail's geometry

| #   | decision                                                                                | home of record                                           | also asserts                                                                                                              | status                           |
| --- | --------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| B1  | One **station** per phase, in the machine's fixed order                                 | `README.md` glossary · the rail, station                 | `ux/wireframes.md` § The parts, and every full-frame drawing                                                              | settled                          |
| B2  | The **barring edge** is drawn **between** stations, never on one                        | `README.md` glossary · the barring edge                  | `ux/wireframes.md` § The parts, § The parse breaks; `ux/personas.md` § The Frogrammer                                     | settled                          |
| B3  | **One barring edge, one cause, drawn once**                                             | `ux/wireframes.md` § What the region must render         | `ux/wireframes.md` § The parse breaks, § Fresh mount; `ux/personas.md` § The Frogrammer — "Reading the barring edge once" | settled                          |
| B4  | The rail dims **whole** under strict, never in parts                                    | `ux/wireframes.md` § Strict, covering — editor mode      | `README.md` glossary · the rail                                                                                           | settled                          |
| B5  | A station with nothing to open has **no tray and no disclosure control** — not disabled | `README.md` glossary · tray                              | `ux/wireframes.md` § A station's tray open, § A station's kit at 0 1 and many, § The parts                                | settled                          |
| B6  | The tray **pushes the pane down** rather than covering it                               | `README.md` glossary · tray                              | `ux/wireframes.md` § A station's tray open, § The parts                                                                   | settled                          |
| B7  | The kit's size **never perturbs** the lifecycle geometry                                | `ux/wireframes.md` § A station's kit at 0 1 and many     | `ux/wireframes.md` § Fresh mount, § Appendix (the Rail); sandbox checkpoint T4                                            | settled                          |
| B8  | A station carries **four** things — phase · label + short label · standing · tray       | `README.md` glossary · station                           | `ux/wireframes.md` § The parts                                                                                            | settled (`bbcfc9e5`)             |
| B9  | **`standing` is deliberately not called a mark** — no level is involved in it           | `README.md` glossary · station                           | `README.md` glossary · level verdict (the four near-homonyms); `ux/wireframes.md` § The parts                             | settled (`bbcfc9e5`)             |
| B10 | Whether **openable and bare** stations are one shape or two                             | deferred — `README.md` glossary · station leaves it open | `ux/wireframes.md` § The parts — "the drawings below are deliberately readable under either answer"                       | **0.3** (first type)             |
| B11 | The **narrow-viewport** form is a vertical list — same contract, second geometry        | `ux/wireframes.md` § What has no wireframe (the doubt)   | `ux/wireframes.md` § What this document is asking, item 1                                                                 | **undrawn** — largest open doubt |

## C · Copy, and who owns it

| #   | decision                                                                                     | home of record                                      | also asserts                                                                                                                                                                                                     | status                                                                                                                 |
| --- | -------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| C1  | The five phase labels, keyed by phase name, zipped against embody's order constant           | `README.md` glossary · display labels               | `DOCS.md` § The render projection; `display-labels.ts`; `ux/wireframes.md` § Fresh mount                                                                                                                         | settled                                                                                                                |
| C2  | The four **fit marks' copy** is display labelling, same discipline                           | `README.md` glossary · display labels               | `ux/wireframes.md` § A level selected, § The parse breaks, § The level does not admit                                                                                                                            | settled                                                                                                                |
| C3  | The empty station's reason is **visually-hidden text**, deliberately not an accessible name  | `ux/wireframes.md` § Fresh mount                    | `README.md` glossary · display labels; `ux/personas.md` § The reader who does not see the screen                                                                                                                 | settled                                                                                                                |
| C4  | The empty count is **derived per settle** — accessible AND empty; barred excluded            | `README.md` glossary · display labels               | `ux/wireframes.md` § The parse breaks (the worked example, `tokens` and `ast` — two)                                                                                                                             | settled (`c2e1651e`)                                                                                                   |
| C5  | Three rules for the count line — singular at one · absent at zero · yields to the cause line | `README.md` glossary · display labels               | `ux/wireframes.md` § The parse breaks, § Fresh mount (the mark-row/reason-line invariant)                                                                                                                        | settled (`1e7b1540`)                                                                                                   |
| C6  | Display copy carries **no machine token**, and **never needs the glossary**                  | `README.md` glossary · display labels               | `README.md` glossary · the barring edge (two registers)                                                                                                                                                          | **SETTLED** `173be52c` — operational test replaces the minted/coined one                                               |
| C7  | **One label vocabulary** — short label on the rail, full label in the tray                   | `ux/wireframes.md` § Fresh mount                    | `README.md` glossary · station, display labels                                                                                                                                                                   | settled                                                                                                                |
| C8  | The blocked sentence's ordering — **fix the code first, lift the guardrail last**            | `ux/wireframes.md` § Strict, covering — editor mode | **nowhere else.** `README.md` claims copy ownership and states no ordering                                                                                                                                       | **SETTLED** `1727338d` — the ordering is contract in `display labels`                                                  |
| C9  | The **nameplate's two forms** (`your code` / `the pane holds: …`)                            | none — drawn only                                   | `ux/wireframes.md` § Fresh mount, § Strict covering with a lens open, § An excursion open, § The generator                                                                                                       | **SETTLED** `1727338d` — the form follows the pane occupant's ARM                                                      |
| C10 | The README's copy inventory vs the copy the twin draws                                       | `README.md` glossary · display labels               | `ux/wireframes.md`'s "the region README owns every learner-facing string" **overreaches** — that phrase is the twin's, not the README's                                                                          | **SETTLED** `1727338d` — inventory enumerated, twin's claim narrowed                                                   |
| C11 | **The five short labels** — authored, or derived from the label?                             | none — `display labels` does not carry them         | `README.md` glossary · station says "two strings, not one truncated"; `ux/wireframes.md` § Fresh mount says "the label's first word" — **opposite mechanisms**; `display-labels.ts` carries one string per phase | **SETTLED** `90166bc7` — AUTHORED, five strings enumerated. `display-labels.ts` widens at 0.3 (it has a live consumer) |

| C12 | **The slot beneath the rail** — its total precedence rule (cause line ›
count line › nothing), and whether the object has a name at all | `README.md`
glossary · display labels | **`DOCS.md` carries none of it** [measured
2026-08-18: `nothing to open\|count line\|reason line` over `DOCS.md` → **0**];
`ux/wireframes.md` § Fresh mount, § The parse breaks (drawn); `README.md` and
the twin both refer to it by the phrase, never by a name | **open (round 8 I7 +
M12)** — the sketch AR-2 is held against does not contain the contract |

**C12 is two findings in one row, and they are the same object.** I7 is that the
four slot rules live only in a glossary entry while `DEV.md` makes the
**sketch** the document the Refactor is held against [read: `DEV.md` — "The
sketch is the **single most consequential document in the workflow** — it is
what the entire Refactor step is held against"]. M12's third unnamed concept is
that same slot: a contract object with a _total_ precedence rule, referenced by
the phrase "the slot beneath the rail" in both documents and named in neither.
Round 5's reviewer already argued naming it settles B4's residue and I3's home
question at the same time. The entry itself argues the rules are indivisible —
"an implementer reading only two of the three would ship the third defect" — and
the sketch reader currently gets **zero of four**.

**C10's uncovered strings, built by reading.** Drawn with no README home:
`ways to study the Source`, `next, you could:`, `can't tell yet`,
`modules only`, and C9's two nameplate forms.

**Do not build this row by pattern-matching — I tried and it failed in both
directions in one command.** It reported "four phases have nothing to open yet"
as having no README home (**false** — the README carries it with `**` bold
_inside_ the phrase, which a literal pattern cannot cross), and reported
`the pane holds` and `waiting` as having homes (**false** — those hits are the
README's own prose and the `standing` contract value, not the drawn display
strings). Whether a string is display copy is a semantic question, and no
pattern answers it.

## D · The pane and its occupants

| #   | decision                                                                                           | home of record                         | also asserts                                                                                                                               | status                                                                                              |
| --- | -------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| D1  | The pane holds **exactly one** thing — editor · one lens · the generator                           | `README.md` § What renders             | `README.md` glossary · pane occupant; `DOCS.md` § State residency, § Decisions; `ux/wireframes.md` § What the arrangement never changes    | settled                                                                                             |
| D2  | **One visual pane, two DOM slots** — the class-1/class-3 split survives the swap                   | `README.md` § What renders             | `DOCS.md` § The render projection; `ux/wireframes.md` § What the arrangement never changes                                                 | settled                                                                                             |
| D3  | The editor is **structurally absent** during an excursion, not covered                             | `README.md` § What renders             | `README.md` glossary · home base, lens excursion; `ux/wireframes.md` § Strict covering with a lens open; `ux/user-journeys.md` Journey 3   | settled                                                                                             |
| D4  | **Edit code** in the control row, **leading**, whenever an excursion is open                       | `README.md` glossary · edit-return     | `DOCS.md` § The render projection; `ux/wireframes.md` § What the arrangement never changes, § Strict covering with a lens open             | settled                                                                                             |
| D5  | **Proposals render below the pane in every mode** — a second door, admitted                        | `ux/wireframes.md` § An excursion open | `README.md` § What renders; `DOCS.md` § The render projection; `ux/wireframes.md` § What this document is asking, item 5                   | settled                                                                                             |
| D6  | The **tray entry for the open lens is its own close affordance**, replacing the strip's none entry | `ux/wireframes.md` § An excursion open | `README.md` glossary · dispose; `DOCS.md` § Execution phases 4, § The render projection; `event-bus/README.md` (the `lens-opened` row)     | **0.3** (I6)                                                                                        |
| D7  | The **tray-entry / re-open collision** — same lens, two affordances, opposite meanings             | `ux/wireframes.md` § An excursion open | `README.md` § What renders (the deliberate re-open edge)                                                                                   | **0.3**                                                                                             |
| D8  | § What renders specifies the **Rail's** behaviour — one cause once, kit behind trays               | `README.md` § What renders             | **`DOCS.md` § The render projection asserts the same behaviour** — an earlier revision said "nothing cites it", which round 6 B3 falsified | **SETTLED** `90166bc7` — `DOCS.md` describes the rail; both documents carry the strip-deferral note |

## E · The announcer

| #   | decision                                                                                         | home of record                                       | also asserts                                                                                                      | status                                                                |
| --- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| E1  | **Three utterances, exhaustively** — occupant · blocked state · barring edge; **never a settle** | `README.md` glossary · announcer                     | `ux/wireframes.md` § The parts (Utterances)                                                                       | settled                                                               |
| E2  | **One voice for one sentence** — the enforcement-cause node becomes plain text                   | `ux/wireframes.md` § The parts                       | `README.md` glossary · announcer, blocked state                                                                   | settled                                                               |
| E3  | It renders **outside both maskable containers**                                                  | `README.md` glossary · announcer                     | `lib/masking/README.md`; `ux/wireframes.md` § The parts (Placement), § Strict covering — editor mode              | settled                                                               |
| E4  | **Rendered by the top component, not the rail** (R-A)                                            | `README.md` § What lives here + glossary · announcer | `index.tsx` renders both `data-maskable` containers, so only the root can guarantee it                            | settled (`d33aef0a`)                                                  |
| E5  | Where the announcer mounts — and what is still owed about it                                     | settled by R-A                                       | `ux/wireframes.md` § What this document is asking, **item 3 still asks the review to settle it**                  | **SETTLED** `9441adc2` — the ask now names the channel, which IS open |
| E6  | The announcer's **channel**, and events for two of its three utterances                          | none                                                 | the bus taxonomy is **six** events and none is the blocked state or the barring edge [read: `event-bus/types.ts`] | **0.3** (I8)                                                          |

**E6's shape, recorded so 0.3 does not rediscover it.** The blocked state
derives at render and the barring edge changes inside a settle — which the
announcer is forbidden to speak (E1). Both are edge-triggered and need a
remembered previous value that appears in no `DOCS.md` § State residency row,
and any new effect lands beside a **pinned** registration order [read: `DOCS.md`
§ Decisions — "The effect registration order — the settled announce BEFORE the
orphan defense — is a pinned invariant"].

## F · Module homes (R-A)

| #   | decision                                                                 | home of record                | also asserts                                                                                                                                                                                                                                                                                                                                                                                                                                 | status                                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------ | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | `rail/` owns the line, the stations, their trays and the barring edge    | `README.md` § What lives here | `README.md` glossary · the rail, station, tray                                                                                                                                                                                                                                                                                                                                                                                               | settled (`d33aef0a`)                                                                                                                                                                                                          |
| F2  | The **nameplate** and the **announcer** live with the top component      | `README.md` § What lives here | `README.md` glossary · nameplate, announcer                                                                                                                                                                                                                                                                                                                                                                                                  | settled (`d33aef0a`)                                                                                                                                                                                                          |
| F3  | `phases-panel/` is gone from the manifest — **and still exists on disk** | —                             | **four sibling READMEs navigate to it as a live peer** — `guide/`, `level-ui/`, `editor/`, `event-bus/` — plus `index.tsx`, **plus `DEV.md` § Directory Documentation Convention**, which names it as one of only two worked examples of the presentation-component exception (the other, `dock/`, already resolves only into the deprecated tree). Zero manifest references, while the manifest lists `rail/`, which does not exist on disk | **unfiled** → 0.3 · **round 8 M13: the count in this row and in § 0.3 entry conditions says six and the measured number is EIGHT** — the two unlisted referrers are `PHASE-1-CHECKPOINT-LEDGER.md` and `tests/index.test.tsx` |

| F4 | **Module homes for the copy** — the display-labels entry enumerates
**seven** keyed-or-derived families; the manifest names **one** file |
`README.md` § What lives here | `README.md` glossary · display labels (the seven
families); `display-labels.ts`, which holds one string per phase and has a live
consumer [read: `display-labels.ts`; measured: `index.tsx:654`]; rows C1, C2,
C5, C9, C11, C12 each name one of the families | **open (round 8 I8 / CP-E)** |

**F4 is R-A's question asked of the thing that grew fastest.** R-A gave the five
new nouns module homes (F1, F2) and nobody asked the same of the copy, which
across rounds 6 and 7 became the largest single entry in the README. A 0.3
implementer inherits a copy contract with seven families and a manifest slot for
one. Deciding it in prose now is cheaper than deciding it after `types.ts`
scatters seven records across five directories — and **C8's keyed cause line
adds an eighth family**, which is why the copy's home is settled before the
cause line is keyed.

**F3 is a gap in the other direction from the usual one.** Listed-but-unbuilt
`rail/` is correct under `prospective`; **unlisted-but-existing** is a gap
against `DEV.md` § Directory Documentation Convention. Round 5 did not catch it.

## G · The band

| #   | decision                                                                                         | home of record                                          | also asserts                                                                                                                                                                           | status                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | The **band** holds the control row and the rail — and **not** everything else the region renders | `README.md` glossary · band                             | `ux/personas.md` § The claim this document exists to make                                                                                                                              | **SETTLED** `a46a3ce4` — the band names its exclusions; `ux/personas.md` orphan caught too                                                                       |
| G2  | The **control row is a mask-boundary object**, and membership decides nothing about class        | `README.md` glossary · control row                      | `README.md` § Enforcement; `DOCS.md` § The render projection                                                                                                                           | settled (`a80b39e2`) — but its "the **one** container that deliberately mixes" collides with `band`'s "its two parts carry different classes" (I7, smaller half) |
| G3  | Controls above the pane · proposals below · the guide last                                       | `ux/wireframes.md` § What the arrangement never changes | `README.md` § What renders; `DOCS.md` § The render projection                                                                                                                          | settled                                                                                                                                                          |
| G4  | **No new headings** — the guide's `h4`s are the only ones                                        | `README.md` § The host surface                          | `DOCS.md` § The render projection; `ux/wireframes.md` § What the arrangement never changes; `ux/user-journeys.md` Journey 6; `ux/personas.md` § The reader who does not see the screen | settled                                                                                                                                                          |
| G5  | The control row sits at the **top of the band**, the rail beneath it                             | `README.md` glossary · control row                      | `DOCS.md` § The render projection vs `README.md` glossary · control row, band                                                                                                          | **SETTLED** `a46a3ce4` — both documents put the control row atop the band                                                                                        |

## H · Vocabulary

| #   | decision                                                                                                                                                                | home of record                          | also asserts                                                                                                                                                                                                                                                                                 | status                                                                                                                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| H1  | `break` → **the barring edge**, **part-of-speech-scoped** (the noun only)                                                                                               | `README.md` glossary · the barring edge | `ux/wireframes.md` § The parts                                                                                                                                                                                                                                                               | settled (`8cc4bc15`, `bdf5077c`)                                                                                      |
| H2  | `station` is **kept**; the phase-synonym sense **formally retired**; the banned-term list **lifted** for this region; `PEDAGOGY.md`'s sense neither claimed nor retired | `README.md` glossary · station          | `ux/wireframes.md` § The parts                                                                                                                                                                                                                                                               | settled                                                                                                               |
| H3  | `kit` is **scoped by what precedes it** — unqualified means the whole roster                                                                                            | `README.md` glossary · kit              | `ux/wireframes.md` § A station's kit at 0 1 and many (heading qualified `e9b8c379`); `ux/personas.md` § The Frogrammer, § The reader who does not point                                                                                                                                      | **SETTLED** `e9b8c379` — four sites qualified, the appendix left per R-B                                              |
| H4  | `band` and `control row` have glossary entries                                                                                                                          | `README.md` glossary                    | see G1, G2                                                                                                                                                                                                                                                                                   | settled (`a80b39e2`)                                                                                                  |
| H5  | **house token** · **house token defaulting** · **tone**                                                                                                                 | `README.md` glossary                    | lens adoption is voluntary; `lib/colorizing` (planned) owns the code surface                                                                                                                                                                                                                 | settled                                                                                                               |
| H6  | **`recommendation` is the contract term**; `proposal` survives ONLY in the proposals surface's name and the `candidate` entry's contrast                                | `README.md` glossary · recommendation   | `README.md` § The composition root, § What this region does not own — **both violate it**; `DOCS.md`; `ux/wireframes.md`; `ux/personas.md`                                                                                                                                                   | **open (round 8 I6)** — the settlement reached the glossary and nothing else, and no row was opened when it was taken |
| H7  | **`apparatus` and `the instrument`** — two concepts the module works with that the glossary never names                                                                 | none — neither has an entry             | `apparatus`: `README.md` § Enforcement (defined inline), glossary · blocked state, glossary · surface classes, `lib/masking/types.ts` · `the instrument`: `ux/personas.md`, `ux/user-journeys.md`, `README.md` glossary · house token (which names the collision and declines to resolve it) | **open (round 8 M12)**                                                                                                |

## I · The selection, and what it cost

| #   | decision                                                                                   | home of record                                    | also asserts                                                         | status                                                      |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| I1  | **The arrangement is the Rail** (human ruling 2026-08-14), overriding the pass's synthesis | `ux/wireframes.md` § The override                 | `ux/wireframes.md` § Appendix, the pass table                        | settled                                                     |
| I2  | A **recorded argument is annotated; live reasoning is rewritten** (R-B)                    | `ux/wireframes.md` § Appendix, the `†` correction | the three `†`-marked sentences                                       | settled (`ca7e2ccf`)                                        |
| I3  | **Journey 6's cost was never a cost** — a correction to the pass, not a concession         | `ux/wireframes.md` § The override                 | § Appendix `†`; the pass table's Journey-6 and Journey-1 Bench cells | settled                                                     |
| I4  | **Journey 5's cost is a real regression** and is **not paid**                              | `ux/wireframes.md` § The override                 | the pass table's Journey-5 row                                       | settled                                                     |
| I5  | The posture argument is **downstream**, not independent                                    | `ux/wireframes.md` § The parts                    | `0c78c63c`'s commit body asserted the one-way dependency             | **SETTLED** `9441adc2` — recast as a downstream consequence |

**I5's chain, so the fix does not overshoot.** _rail goes inert_ ⇐ _rail is
class 3_ (A3) ⇐ _the voice is the announcer's_ ⇐ the announcer's own necessity.
The chain **terminates on solid ground** — two of the three utterances are not
on the rail at all, which is posture-free and rail-independent — so the argument
survives on its first ground. Only the word `independently` is false, and the
sentence wants recasting as a downstream consequence so a later editor cannot
close the loop.

---

## Deferred to 0.3 — this list is the deferral's index

`RESUME.md` § DEFERRED TO 0.3 carries the reasoning; this is the roll-call.

| item                                                      | rows   | why it waits                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The `strip` **vocabulary** migration                      | D6, D8 | `strip` counts at HEAD [measured 2026-08-16, squeezed unwrap]: `README.md` · `DOCS.md` · `ux/wireframes.md` · `event-bus/README.md` · **`editor/README.md`** · **`generator/README.md`**, plus `phases-panel/**` — **six files, not the four an earlier revision listed**; counts omitted deliberately, having gone stale twice. **B4's behaviour half comes forward now; the vocabulary half stays here.** |
| The **dispose enumeration** (I6)                          | D6     | cannot be rewritten without naming what replaces the strip's none entry, and that is `Station`'s shape — 0.3's first type (human ruling 2026-08-16)                                                                                                                                                                                                                                                         |
| The **announcer's channel** and two missing events (I8)   | E6     | new bus events + a remembered previous value in § State residency, beside a pinned registration order (human ruling 2026-08-16)                                                                                                                                                                                                                                                                             |
| `Station` — one shape or two                              | B10    | the first type 0.3 writes                                                                                                                                                                                                                                                                                                                                                                                   |
| `phases-panel/` on disk, absent from the manifest         | F3     | whether the directory survives at all is 0.3's question                                                                                                                                                                                                                                                                                                                                                     |
| `display-labels.ts`'s value shape (two strings per phase) | C11    | settled as contract in `90166bc7`; the module has a LIVE consumer (`index.tsx:654`), unlike the `SurfaceClass` rename which had none                                                                                                                                                                                                                                                                        |
| The **editor-mode scrim geometry**                        | —      | the drawing puts a full-width blocked sentence where the live DOM has a zero-height wrapper; jsdom cannot catch it                                                                                                                                                                                                                                                                                          |
| The **narrow-viewport** degradation                       | B11    | undrawn and unowned; drawing it in ASCII would imply it is settled                                                                                                                                                                                                                                                                                                                                          |

## Round 8's fourteen findings — where each one lives

**The roll-call, so round 9 can ask "did these land?" rather than re-deriving
them.** The verdict itself is archived verbatim in [`RESUME.md`](./RESUME.md) §
ROUND 8'S VERDICT, AS RETURNED; this table is the index into the rows.

**Every finding below is `[relayed: ar-1 round 8]` until re-measured.** Four
were re-measured when this table was written and hold; two were re-measured and
found **understated**; the rest are re-measured by the commit that acts on them.
An AR verdict is itself a claim — round 3 shipped three of seven wrong as
stated.

| finding     | subject                                                   | row(s)                                     | re-measured?                                                          |
| ----------- | --------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| BLOCKER 1   | the deferral record has storage without retrieval         | § Deferred to 0.3 · § 0.3 entry conditions | yes — the second is a strict subset of the first                      |
| BLOCKER 2   | the docs assert a live `strip`; the design abolishes it   | D6, D8                                     | yes — 15 behavioural sites, one of them reachable by no `strip` grep  |
| BLOCKER 3   | the barred cause line is one string for three origins     | C12 (the slot), C1/C2                      | yes — `FailableStageName` has four members, `entwined` is not a phase |
| IMPORTANT 4 | the census found the sites; the rows absorbed two         | A1, A2, A6, A7, D2, D6                     | **yes** — reproduces                                                  |
| IMPORTANT 5 | a third receipt structure, and a fourth untriggered event | receipt amendments 3 and 4                 | yes — landed as `c9a06eac`, `b8c8e72e`                                |
| IMPORTANT 6 | the `recommendation` settlement reached one site          | **H6**                                     | **yes** — counts reproduce exactly                                    |
| IMPORTANT 7 | the slot contract is absent from the sketch               | **C12**                                    | **yes** — `DOCS.md` → 0 hits                                          |
| IMPORTANT 8 | copy has a contract and no module home                    | **F4**                                     | yes — seven families, one manifest slot                               |
| MINOR 9     | one class-3 definition still reads "everything else"      | A1                                         | **yes** — 1 hit in `lib/masking/README.md`                            |
| MINOR 10    | the roster numeral survives at one non-home site          | A2, A12                                    | **yes** — `seven` → 2 hits in `ux/wireframes.md`                      |
| MINOR 11    | the overhanging fenced lines are real and measurable      | § What this list does not cover            | **yes, and the instrument needed fixing** — see below                 |
| MINOR 12    | three concepts the glossary never names                   | **H7**, **C12**                            | yes — `apparatus`, `the instrument`, and the slot                     |
| MINOR 13    | F3's site count undercounts by two                        | F3                                         | **yes** — eight, not six                                              |
| MINOR 14    | two drawing observations                                  | § What this list does not cover            | **yes, and UNDERSTATED** — see below                                  |

**Two of round 8's own findings were wrong as stated, both found by re-measuring
rather than relaying.**

- **MINOR 14 undercounts.** The verdict names **one** drawing closing with `└`
  and no `┌`. There are **two** [measured 2026-08-18: frame-corner scan of
  `ux/wireframes.md` → `┌` at `:160`, `:356`; `└` at `:174`, `:376`, `:464`,
  `:488` — two tops, four bottoms]. The unreported one is **§ An excursion open
  — the nameplate and the proposals** (fence `:474`, `└` at `:488`), which opens
  straight into `│ [Edit code] …` with no top border.
- **MINOR 11's instrument reports two false positives** unless single-line band
  excerpts are excluded. See § What this list does not cover, which now carries
  the exclusion.

## Rulings this list produced — 2026-08-16 / 2026-08-17

Three things surfaced when this list was first used against the tree; none was
the agent's to settle, all three were put to the human, and all three came back.
Recorded here because the campaign's own rule is that a ruling lives where it
binds, and these bind the whole class-2 subject rather than any one document.

| #   | asked                                                                                                       | ruled                                                                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| R-E | The two-route enumeration is already false at HEAD. Land R-D minimally, or make the enumeration honest?     | **Make it honest.** The routes are rewritten to the roster the region actually has; the rail earns none.                                    |
| R-F | Where does this decisions list live — end-state twin, or campaign artifact?                                 | **Campaign artifact**, `.planning-handoffs/orchestrate-ux/DECISIONS.md`. It is bookkeeping, not end-state doc.                              |
| R-G | I6 and I8 are contract-shaped. Fix now or defer?                                                            | **Both defer to 0.3**, recorded rather than omitted. **B4's behaviour half still comes forward now.**                                       |
| R-H | R-D's route wording is satisfied by the rail. Narrow it, or retire the rail's competing claim?              | **Narrow it** to _naming the pane's occupant_. Does not reopen `0c78c63c`.                                                                  |
| R-I | The nameplate has no placement rule (A11), and R-D falsifies the uniqueness claim (A12). Ride, or separate? | **Ride the amendment.** Same rule as the announcer: outside both maskable containers. Shipping it without would ship class 2 unenforceable. |

**R-H is the one worth re-reading before touching this subject again.** Round 5
proposed distinguishing the nameplate (_naming where the LEARNER is_) from the
rail (_narrating where the MACHINE is_) and flagged that the two are one word
apart. They are closer than that — the twin already gives the rail the
where-am-I job [read: `ux/wireframes.md` § An excursion open — "so the rail
answers 'where am I' without the tray being open"] — so the proposed distinction
would have pulled the rail INTO class 2 and destroyed the argument R-D depends
on. The surviving discriminator is that the nameplate **always** names the
occupant while the rail names a **phase** and marks no occupant at all in two of
three occupant states.

## 0.3 entry conditions — the deferrals' only home, by ruling

R-M (human ruling 2026-08-17) took the deferral notes back OUT of
`README.md`/`DOCS.md`/`types.ts`, because `DEV.md` forbids migration-phase and
status narration there. This section is where they live instead, and **whoever
opens 0.3 reads this list first.**

| #       | what a 0.3 reader will meet, and what is actually true                                                                                                                                                                                                                                                                                                       |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **I6**  | `README.md` glossary · dispose, `DOCS.md` (×3), `event-bus/README.md` and `editor/README.md` all enumerate **the strip's none entry** as a live dispose raiser. The Rail abolishes it and the open lens's **tray entry** takes its place. The enumeration is closed-looking and **stale**, and cannot be rewritten until `Station`'s shape is settled.       |
| **I8**  | The announcer has **no channel**. The taxonomy is six events; two of its three utterances have none — the blocked state derives at render, the barring edge changes inside a settle which the announcer may not speak. Both are edge-triggered and need a remembered previous value in **no** § State residency row, beside a **pinned** registration order. |
| **C11** | `display-labels.ts` carries **one** string per phase; the contract says two. It has a live consumer (`index.tsx:654`) — the contrast with the `SurfaceClass` rename, which shipped at once because it had none.                                                                                                                                              |
| **B10** | Whether openable and bare stations are one shape or two — the first question `types.ts` answers.                                                                                                                                                                                                                                                             |
| **F3**  | `phases-panel/` exists on disk, is absent from the manifest, and is navigated to as a live peer by six documents including `DEV.md`.                                                                                                                                                                                                                         |

## What this list does not cover

Honest limits, so a reader does not mistake it for a totality:

- **It indexes decisions, not sentences.** A sentence asserting no decision on
  this list is invisible to it. When you find one, the decision is missing — add
  the row.
- **The `also asserts` column is built by reading and is therefore fallible.**
  Every previous instrument in this campaign was defeated by a table cell or a
  fenced drawing; this one is defeated by a reader's attention. Re-read the row
  rather than trusting it.
- **It carries no drawn-copy inventory.** C10 is the row that would need one,
  and the note under § C explains why no pattern produces it.
- **One finding it recorded as unmeasurable was simply mis-measured.** An
  earlier revision said AR-1 round 7's overhanging-fenced-line finding could not
  be reproduced. **That was wrong, and the instrument was the fault**: measuring
  LINE LENGTH is confounded by the trailing `←` annotations. Measuring the
  **codepoint index of the frame's closing vertical** settles it in one pass —
  every framed line closes at index 63 except exactly four, which close at 64
  [measured 2026-08-17]: `ux/wireframes.md` lines **161, 342, 358, 452**, all
  ending `strict│`, exactly as round 7 reported. Three sit in blocks whose
  siblings all close at 63, so the misalignment renders. Left open as a MINOR,
  now with a working instrument attached.

  **And the instrument needs one exclusion, or it reports two false positives**
  (AR-1 round 8, MINOR 11, corrected here). Run bare, the histogram is **six**
  outliers, not four [measured 2026-08-18: closing-vertical index over every
  framed line → `{63: 85, 64: 4, 73: 1, 68: 1}`]. The two extra are
  `ux/wireframes.md:267` (index 73) and `:332` (index 68) — **single-line band
  excerpts**, each its own one-line fenced block [read: fences at `:266`/`:268`
  and `:331`/`:333`]. A one-line frame has no siblings to misalign against, so
  it cannot be a defect. **Exclude fenced blocks of one framed line.** Round 8's
  four is right as scoped; the instrument as written is not.

- **One drawing observation this list carried is UNDERSTATED, and the correction
  is the same lesson twice.** AR-1 round 8's MINOR 14 names one drawing that
  closes with `└` and has no `┌`. There are **two** [measured 2026-08-18:
  frame-corner scan of `ux/wireframes.md` → `┌` at `:160`, `:356`; `└` at
  `:174`, `:376`, `:464`, `:488`]. The one round 8 named is § Strict, covering —
  with a lens already open (fence `:450`, `└` at `:464`); the one it did not is
  **§ An excursion open — the nameplate and the proposals** (fence `:474`, `└`
  at `:488`), which opens straight into
  `│ [Edit code]  [module]  [plain JavaScript ▾]` with no top border, while §
  Strict, covering — editor mode opens correctly with `┌` at `:356` [read, all
  three]. Two of four full drawings are missing their top rule.

- **It says nothing about the code.** Every row above is a documentation
  decision. What `index.tsx` actually renders today is the strip, and the gap
  between the two is what Phase 1 closes.
