<!-- cspell:ignore affordance affordances authorised behaviour codemod finditer organised restor spellme unbuilt undercount undrawn unfiled unretired wireframes -->

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

## Reading the columns

- **home of record** — the one document that OWNS the decision. Editing the
  decision means editing this first.
- **also asserts** — every other site that states, cites, or depends on it.
  These are what a fix orphans.
- **status** — `settled` · `open (<finding>)` · `0.3` (deferred) · `unfiled`.

Paths are relative to `src/lib/study-lenses/orchestrate/`. Section names are
`§ heading`; glossary entries are `glossary · term`.

---

## A · The surface classes

The most-cited decision in the region, and the one R-D amends. Citation sites,
measured: `README.md` 23 · `ux/wireframes.md` 22 · `lib/masking/README.md` 7 ·
`lib/masking/types.ts` 5 · `DOCS.md` 3 · `ux/user-journeys.md` 2 ·
`ux/personas.md` 0 · `lib/masking/DOCS.md` 0 [measured 2026-08-16:
squeezed-unwrap `re.finditer` over `class 2|class-2|meta-level|restor\w+
conformance|survive every posture|never (masked|covered)|carr\w+ the .*voice`].

| #   | decision                                                                                                         | home of record                                      | also asserts                                                                                                                                                                                                             | status                                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| A1  | Three classes, and the split is **exhaustive**                                                                   | `README.md` § Enforcement                           | `README.md` glossary · surface classes; `lib/masking/README.md` § The three surface classes; `lib/masking/types.ts` `SurfaceClass`; `ux/wireframes.md` § The parts, § Strict, covering — editor mode                     | settled                                                                                                                 |
| A2  | The class-2 **roster**, and the routes by which a node earns the class                                           | `README.md` § Enforcement                           | all four A1 sites, plus `DOCS.md` § Structural constraints · Class-2 nodes never mask; `ux/wireframes.md` § What the arrangement never changes; **`guide/README.md`**; **`level-ui/README.md`**                          | **SETTLED** `90166bc7` — the routes have ONE home (§ Enforcement); the other 7 sites cite it                            |
| A3  | The **rail is class 3**, argued from **exhaustion** (not lineage, not containment)                               | `ux/wireframes.md` § Strict, covering — editor mode | `README.md` glossary · the rail                                                                                                                                                                                          | **SETTLED** `90166bc7` — receipts quoted for all 10 sites; `README.md` glossary · the rail now CITES rather than argues |
| A4  | The **nameplate is class 2**, by a fourth route — _naming the pane's occupant_                                   | `README.md` § Enforcement + glossary · nameplate    | `README.md` glossary · nameplate + § What lives here; `lib/masking/README.md`; `lib/masking/types.ts`; `DOCS.md`; `ux/wireframes.md` § The parts + the lens-open drawing. Was **zero of ten mentions** before `b9a534c7` | **SETTLED** `b9a534c7` — R-D's wording narrowed by ruling; see below                                                    |
| A5  | The **announcer is class 2**, one of **two** members that are not controls                                       | `README.md` glossary · announcer                    | `README.md` § Enforcement; `lib/masking/README.md`; `lib/masking/types.ts`; `DOCS.md` § Structural constraints; `ux/wireframes.md` § The parts, § Appendix (the override, Journey 6 bullet)                              | settled                                                                                                                 |
| A6  | Class is a **static fact of what the surface IS**; containment decides nothing                                   | `lib/masking/README.md` § The three surface classes | `lib/masking/types.ts` `SurfaceClass`; `lib/masking/DOCS.md` § Out of scope; `README.md` § Enforcement (the Generate code paragraph); `DOCS.md` § The render projection; `README.md` glossary · control row              | settled                                                                                                                 |
| A7  | **Generate code** carries class 3 at its own element, in the live control row                                    | `README.md` § Enforcement                           | `README.md` glossary · control row, surface classes; `DOCS.md` § The render projection; `ux/wireframes.md` § Strict, covering — editor mode (drawn), § What the arrangement never changes                                | settled                                                                                                                 |
| A8  | The mask makes covered surfaces **inert** and lays a **NON-inert overlay** over them                             | `README.md` § Enforcement                           | `README.md` glossary · blocked state; `lib/masking/README.md`; `index.tsx` comment at the overlay                                                                                                                        | settled (`0173b1c2`)                                                                                                    |
| A9  | The **reason line beneath the rail is class 3** and dims with it — an unpaid cost                                | `ux/wireframes.md` § Fresh mount                    | `ux/wireframes.md` § Strict, covering — editor mode (drawn annotation)                                                                                                                                                   | **SETTLED** `b9a534c7` — re-grounded on exhaustion                                                                      |
| A10 | `SurfaceClass`'s class-2 literal is `'meta-node'`                                                                | `lib/masking/types.ts` `SurfaceClass` JSDoc         | nothing — **one consumer, its own declaration** [measured: `git grep -n "SurfaceClass" -- src/` → 1 hit]                                                                                                                 | **SETTLED** `b767f691` — renamed while it still had one consumer                                                        |
| A11 | **Where the nameplate renders relative to the maskable containers**                                              | none — no document states it                        | the announcer HAS this rule (A5, E3); the nameplate's ruling paragraph gives it a **different** warrant entirely — "the pane occupant is the top component's own state"                                                  | **SETTLED** `b9a534c7` — outside both maskable containers, as the announcer                                             |
| A12 | How many class-2 members are not controls (**two**: announcer, nameplate)                                        | `README.md` glossary · announcer                    | `ux/wireframes.md` § The parts — "the one member of that class that is not a control"; `lib/masking/types.ts` — "admits **one node** that is not a control"                                                              | **SETTLED** `b9a534c7` — "one of the two members", all three sites                                                      |
| A13 | **The blocked overlay's class** — or an explicit statement that it is apparatus rather than a classified surface | none — no document assigns it one                   | `README.md` § Enforcement + glossary · blocked state; `lib/masking/README.md`; `lib/masking/DOCS.md` § Out of scope                                                                                                      | **SETTLED** `90166bc7` — apparatus, not a classified surface; `SurfaceClass` needs no fourth member                     |

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

| #   | decision                                                                 | home of record                | also asserts                                                                                                                                                                                                         | status               |
| --- | ------------------------------------------------------------------------ | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| F1  | `rail/` owns the line, the stations, their trays and the barring edge    | `README.md` § What lives here | `README.md` glossary · the rail, station, tray                                                                                                                                                                       | settled (`d33aef0a`) |
| F2  | The **nameplate** and the **announcer** live with the top component      | `README.md` § What lives here | `README.md` glossary · nameplate, announcer                                                                                                                                                                          | settled (`d33aef0a`) |
| F3  | `phases-panel/` is gone from the manifest — **and still exists on disk** | —                             | **four sibling READMEs navigate to it as a live peer** — `guide/`, `level-ui/`, `editor/`, `event-bus/` — plus `index.tsx`. Zero manifest references, while the manifest lists `rail/`, which does not exist on disk | **unfiled** → 0.3    |

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

| #   | decision                                                                                                                                                                | home of record                          | also asserts                                                                                                                                            | status                                                                   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| H1  | `break` → **the barring edge**, **part-of-speech-scoped** (the noun only)                                                                                               | `README.md` glossary · the barring edge | `ux/wireframes.md` § The parts                                                                                                                          | settled (`8cc4bc15`, `bdf5077c`)                                         |
| H2  | `station` is **kept**; the phase-synonym sense **formally retired**; the banned-term list **lifted** for this region; `PEDAGOGY.md`'s sense neither claimed nor retired | `README.md` glossary · station          | `ux/wireframes.md` § The parts                                                                                                                          | settled                                                                  |
| H3  | `kit` is **scoped by what precedes it** — unqualified means the whole roster                                                                                            | `README.md` glossary · kit              | `ux/wireframes.md` § A station's kit at 0 1 and many (heading qualified `e9b8c379`); `ux/personas.md` § The Frogrammer, § The reader who does not point | **SETTLED** `e9b8c379` — four sites qualified, the appendix left per R-B |
| H4  | `band` and `control row` have glossary entries                                                                                                                          | `README.md` glossary                    | see G1, G2                                                                                                                                              | settled (`a80b39e2`)                                                     |
| H5  | **house token** · **house token defaulting** · **tone**                                                                                                                 | `README.md` glossary                    | lens adoption is voluntary; `lib/colorizing` (planned) owns the code surface                                                                            | settled                                                                  |

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

| item                                                      | rows   | why it waits                                                                                                                                                                                                                                     |
| --------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The `strip` **vocabulary** migration                      | D6, D8 | `strip` counts at HEAD [measured 2026-08-16, squeezed unwrap]: `README.md` 12 · `DOCS.md` 9 · `ux/wireframes.md` 4 · `event-bus/README.md` 1, plus `phases-panel/**`. **B4's behaviour half comes forward now; the vocabulary half stays here.** |
| The **dispose enumeration** (I6)                          | D6     | cannot be rewritten without naming what replaces the strip's none entry, and that is `Station`'s shape — 0.3's first type (human ruling 2026-08-16)                                                                                              |
| The **announcer's channel** and two missing events (I8)   | E6     | new bus events + a remembered previous value in § State residency, beside a pinned registration order (human ruling 2026-08-16)                                                                                                                  |
| `Station` — one shape or two                              | B10    | the first type 0.3 writes                                                                                                                                                                                                                        |
| `phases-panel/` on disk, absent from the manifest         | F3     | whether the directory survives at all is 0.3's question                                                                                                                                                                                          |
| `display-labels.ts`'s value shape (two strings per phase) | C11    | settled as contract in `90166bc7`; the module has a LIVE consumer (`index.tsx:654`), unlike the `SurfaceClass` rename which had none                                                                                                             |
| The **editor-mode scrim geometry**                        | —      | the drawing puts a full-width blocked sentence where the live DOM has a zero-height wrapper; jsdom cannot catch it                                                                                                                               |
| The **narrow-viewport** degradation                       | B11    | undrawn and unowned; drawing it in ASCII would imply it is settled                                                                                                                                                                               |

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
- **It says nothing about the code.** Every row above is a documentation
  decision. What `index.tsx` actually renders today is the strip, and the gap
  between the two is what Phase 1 closes.
