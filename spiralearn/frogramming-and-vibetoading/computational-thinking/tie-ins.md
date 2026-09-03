# Tie-ins — findings about F&V

> Author-facing design memo. Part of the `computational-thinking/` set; start at
> [README.md](./README.md).

**These are findings, not a work order.** Nothing in the F&V curriculum is
edited by this campaign. The citations run one direction: documents in this
directory cite F&V; F&V does not yet cite back. A later campaign will decide
what to change and whether that is an amendment or a fork; this table is its
input, not its instructions.

All line references verified 2026-09-03 against the working tree. **Re-verify by
running each citation before consuming this table** — line numbers drift, and a
stale row would mislead the campaign that reads it.

## Where the thesis is already latent

The strongest rows. In each of these the curriculum already does the thing; the
thesis supplies the name.

| Site                                      | What it already does                                                                                                                                                                                                | What a redraft would owe                                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `study-lenses.md:176`, `:180-181`, `:186` | Describes JEJ as programs "that interact with users through text and numbers", designed around "meaningful computational exploration within a manageable notional machine", with every program shaped "read input…" | Nothing to correct. Cite it as evidence that the domain and the phrase predate the thesis                                                                        |
| `ontology.md:936-946`                     | Ch2's data-flow loop already models the user as a data-transforming system — data in through the eyes, transformed, back through a resolve event                                                                    | Name it as meaningful computation with a human target; it is the counterexample to any ruling that V's practice is not CT                                        |
| `ontology.md:307-308`, `:697`             | "Computational thinking — F's practice. Traverses artifact ↔ NM ↔ CS/theory"                                                                                                                                        | Correct as written. Owes only the **definition** of computational thinking, which the ontology never gives                                                       |
| `ontology.md:320-325`                     | Fixes F&V's window at user ↔ artifact ↔ NM, with CS/theory named as outside it                                                                                                                                      | Correct as written. Gains a sibling window for Welcome to Algorithms — artifact ↔ NM ↔ CS/theory — rather than a correction                                      |
| `ontology.md:1428`                        | The Ch2 simulated user as "Role-1-flavored practice apparatus, with its fallibility ceiling"                                                                                                                        | Reclassify as an **observability prosthesis for lens 6**; the fallibility ceiling becomes a measurable property of the instrument                                |
| `chapters.md:1366`                        | "Design thinking across the whole situation is built here — with the same rigor Ch1 gave computational thinking"                                                                                                    | **The curriculum already claims Ch1 teaches CT.** The gap is not absence — it is a promise made and not cashed. This is the strongest argument for the half-beat |

## Where the thesis contradicts what is written

| Site                                                     | The conflict                                                                                                                                                    | What a redraft would owe                                                                                                                                                             |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ontology.md:1478`, `chapters.md:266`, `chapters.md:283` | Literal "domain-agnostic". `:266` reads "**largely** domain-agnostic… **the same NM skills transfer to any domain**" — a hedge _and_ an explicit transfer claim | Split the two senses: subject-matter-agnostic, discipline-situated. The transfer claim narrows to transfer of _practice_                                                             |
| `README.md:486`                                          | _Paraphrase_, not the token: "We focus on the machine, not on any specific domain the machine might be used"                                                    | Same split. Note this site carries no literal "domain-agnostic" string                                                                                                               |
| `chapters.md:238`, `:240`, `README.md:19-20`             | Learning-to-program → programming-to-learn as a **single pivot**, with Ch4 as "the first pivot" and F&V a "prerequisite for" curricula requiring CT             | Three sites, not one. Becomes repeated micro-transitions; the prerequisite relation becomes the overlap of two chain windows                                                         |
| `ontology.md:873-877`                                    | Affordance defined in build terms only — "Lisp affords macros; Haskell affords laziness"                                                                        | Needs the second relatum: a language affords **thoughts** as well as moves. Second homes at `README.md:329-337`, `chapters.md:200-201`, `guide.authors.md:206`, all build-terms only |
| `ontology.md:1011-1012` → see `chapters.md:1011-1012`    | The control panel is "hold, transform, branch, repeat"                                                                                                          | Missing its I/O bookends: **receive → hold → transform → branch → repeat → emit**. I/O is where the target system touches the artifact                                               |
| `ontology.md:995`                                        | Lens 7, systemic impacts, marked "Practiced"                                                                                                                    | Under condition 3b it is reach, not practice — rhetorical and ethical reasoning that CT informs. Symmetric with lenses 1–3, no special pleading                                      |
| `plann.txt:29` vs `ontology.md` §3/§4/§10                | The notional machine is a _representation_ (thesis), a _chain-point_ (§3), a _twin_ (§4), and a _site_ (§10)                                                    | Pick one primary sense and mark the others as readings. Sorva separates the NM-as-taught from the learner's mental model; `ontology.md` §4 merges them by making the NM F's twin     |
| `pedagogy.md:116-134`                                    | The AI Integration Threshold is argued from SOLO — Relational understanding is what makes AI output evaluable                                                   | CT work now starts in Ch1, pre-threshold. Compatible only if the threshold is read as a **delegation** threshold. Needs a real re-derivation, not a clarifying sentence              |

## Where something is missing

| Site                                                                                                                                                               | Finding                                                                                                               | What a redraft would owe                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ontology.md:1615`, `guide.authors.md:385`, `guide.community.md:40`                                                                                                | **Three** citations of Wing, no Wing-shaped definition behind any of them                                             | Not "use or drop" — Wing's medium-independence is the thesis's strongest opponent. Keep the citations and argue against the position                    |
| `ontology.md` §9 scope column                                                                                                                                      | Lens deferral currently reads as editorial scope-discipline                                                           | Gains condition 3b as its reason, which makes lens 3 contingently rather than permanently deferred                                                      |
| `ontology.md:332`                                                                                                                                                  | "affordance-discovery cycles — plural deliberately; different grains of cycle"                                        | Enumerate the **spiral-turn grain**, which the plural already licenses                                                                                  |
| `ontology.md:390`                                                                                                                                                  | "F failure — computational process without computational thinking"                                                    | The failure taxonomy needs the pedagogy/ontology split, so it does not imply V is not CT                                                                |
| `ontology.md:733`                                                                                                                                                  | The L2 row promises "comfort with design + computational thinking"                                                    | A layer-level promise about CT, interacting with the gate question                                                                                      |
| `chapters.md:157`, `:207`                                                                                                                                          | Ch0 §0.1 Rhetorics, §0.2 Positioning                                                                                  | The thesis section lands **between** them, so §0.2 positions F&V inside the definition rather than in a generic programming landscape                   |
| `chapters.md:1127-1128`, `:1132`                                                                                                                                   | The gate, and the Electives — "never blocking", "each elective applies the machine you already own"                   | The Electives are the model for how gate-adjacent material gets skipped. Half-beats must not inherit that shape                                         |
| `chapters.md:61`, `:147`, `guide.learners.md:131`                                                                                                                  | "what the course teaches is the affordance-discovery cycle"; "the phases of mastering the affordance-discovery cycle" | These are the sentences the title's _through_ reframes — the cycle becomes the mechanism, not the purpose                                               |
| `pedagogy.md:236-237`, `guide.learners.md:210`                                                                                                                     | L2 "skippable for L1 reading"; L1 promised as "a complete exit"                                                       | Resolved by layering the half-beat itself: the gate takes the L1 depth, L2–L4 are descent                                                               |
| `pedagogy.md:441-442`                                                                                                                                              | Spiderweb: skills at the centre, technologies as concentric rings                                                     | Where computational thinking sits in that topology is undecided                                                                                         |
| `guide.learners.md:107-137`, `:353-364`                                                                                                                            | The per-layer promise, and the Ch1-steepness reassurance: "every cycle cashes out into new user-facing behavior"      | A half-beat that added a unit would falsify that reassurance in its own words. Pushing it into the cash-out keeps it true                               |
| `chapters.md:1434-1551`                                                                                                                                            | Ch2's V1–V5 ladder                                                                                                    | Already a spiral of V half-beats whose increments are ways of seeing. Name it as such rather than retrofitting                                          |
| Title string — **12 curriculum files, 16 occurrences** [measured: `grep -ro 'Affordance-Discovery Cycle' --include='*.md' --exclude-dir=computational-thinking .`] | Every curriculum document's H1                                                                                        | The title change is 12 files, not 4. `from-a-job-application/ltp-ptl.md` also carries it and must **not** be retitled — it is a frozen provenance draft |

## Not a defect — do not "fix"

`guide.community.md:204` says "domain-agnostic" about the **infrastructure's**
reusability by any curriculum. Different claim, still true.

## Clean

`narrative.md`, `metaphor.md` and `translational-framing.md` carry no
consequential sites beyond their H1 title and a duplicate of `ontology.md:605`
at `translational-framing.md:256`. `js.md` is a curriculum `.md` with no
relevant hits.

## Two hazards for whoever consumes this

**Path collision.** Two files share the basename `study-lenses.md` — the
curriculum's own, and `from-a-job-application/study-lenses.md`. Rows above
always prefix the latter. Do not resolve a bare `study-lenses.md` to the wrong
one.

**Scope command.** Every count in this table is of the **curriculum proper** and
requires excluding this directory, because these documents quote the strings
they count. "computational thinking" appears **9** times with the exclusion and
**16** without it [measured: both]:
`grep -rniE 'computational thinking' --include='*.md' --exclude-dir=computational-thinking .`

The title-string row is the live example of the hazard: documenting its own grep
put the literal string into a fourteenth file and moved the number it reports.
Any count published here changes the thing it measures. Re-run with the
exclusion, and `grep` on this machine is ugrep — run the string you publish.
