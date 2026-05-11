# Handoff — Welcome to Frogramming curriculum redraft

> Read this first. It's the entry point for the next session picking up
> the WtF curriculum redraft. The plan file at
> `/Users/master/.claude/plans/hi-i-have-a-dazzling-kahan.md` has the
> full multi-round history (R1-R11); you don't need to wade through it
> to do the queued work.

## State as of last session close

The redraft is committed across 13 commits on `main`. The canonical
primary docs:

```
syllabus.md                          slim — TL;DR, framing, chapter summaries
syllabus.ontology.md                 the reference framework
syllabus.chapters.md                 full chapter bodies + per-layer LOs
syllabus.translational-framing.md    TCER meta-artifact
syllabus.manifesto.learners.md       why, for learners
syllabus.manifesto.authors.md        why, for authors/forkers
syllabus.manifesto.community.md      why, for partner communities
syllabus.bakhtiar-meeting-prep.md    prep notes (refreshed for R6-R10 locks)
```

Plus `narrative/README.md` (1956 lines) is pending supersession — see
Task 1 below.

## Two tasks queued

### Task 1 — Narrative supersession

**Goal**: replace `narrative/README.md` with a slimmer
`syllabus.narrative.md` that holds only what didn't fold cleanly into
canonical docs.

**What's already decided** (Q-D1/D2/D3 locked end of R11):

- **Name**: `syllabus.narrative.md`
- **Drop**: the metaphor system itself (lives in ontology §24 now);
  sections §2, §4, §5, §6, §7 (outdated four threads), §8, §12, §13,
  §14, §15 (PBSI outdated), §20, §24 (now chapters.md Ch5), §26, §28
- **Keep**: §1 (how-to-use), §3 (close-read per-sub-section), §10
  (composer's critical ear → in metaphor-extensions section of new
  file), §11, §16 (8 AI-collab skills), §17, §18, §19 (historical
  cameos for chapter authors), §21, §22, §23 (PL-future), §25 (voice
  spec), §27 (smaller connections for authors)
- **Asset dir**: move `narrative/assets/` → `assets/` (no `syllabus.`
  prefix per user direction; sanity-check this with user at session
  start)
- **§3 sub-sections**: close-read each individually against ontology
  before keep/drop
- **§10**: lands in a metaphor-extensions section of the new file,
  alongside §11

**Execution scope** (steps from plan file Round 11 Phase D):

1. Read `narrative/README.md` fully (1956 lines)
2. Close-read each "partial overlap with ontology" sub-section
3. Excerpt the keep-sections into `syllabus.narrative.md` with light
   editing for current vocabulary (threads→strands; PBSI→PBIS;
   four threads→five strands; etc.)
4. `git mv narrative/assets/ assets/`
5. Grep canonical docs for `narrative/assets/` references; update all
   to `assets/`
6. Single commit: create `syllabus.narrative.md` + asset dir move +
   reference updates
7. Second commit: `git rm narrative/README.md`
8. Surface to user any tensions surfaced during close-reading

**Where to discuss before execution**: anything ambiguous in §3
sub-section close-reads, §10's substance beyond ontology §23, §16's 8
AI-collab skills (not all may be in ontology), §22's agile-visible
discipline framing (partly in ontology §18).

### Task 2 — Bakhtiar prep substantive curation

**Goal**: read `syllabus.bakhtiar-meeting-prep.md` cold, identify which
questions actually matter given Bakhtiar's perspective + the curriculum's
current state, propose a tighter list.

**Context**: the file is currently lock-refreshed (R6-R10 vocabulary
incorporated, R7 thinking-vs-process section added) but **the
substantive question curation is its own focused-thinking task** — not
a refactor. Expect a thinking-together phase before drafting.

**Bakhtiar's lineage worth holding in mind**:

- DGMD E-1 (Harvard Extension) — practical design course; Framer +
  Notion + React
- Constructionism (Papert/Mikhak), Media Lab range
- Inspired the embody/lenses architectural pattern
- Two ideas from Bakhtiar ground V/F: _infrastructure IS research
  contribution_ + _engineering × physics co-evolution_
- The curriculum names the V/F coordination dynamic the **Bakhtiarian
  loop** in tribute

## Locks the next session needs to know (don't re-litigate)

From R1-R11. Anything below is settled; don't reopen without strong
new pressure.

- Two foundational principles (AI can't UNDERSTAND for you; concepts
  are connections). Intellectual agency is the META LO unifying all 5
  layers; NOT a third foundational principle (manifesto territory).
- V/F substrate-agnostic; defined by twinning (no twin = no V/F)
- 5 strands at equal status (twinning, decisions, perspective
  stacking, whole rhetorical situation, affordances); "thread" reserved
  for the data thread
- PBIS (NOT PBSI); flexible vocabulary, NOT a sequence; no canonical
  trading zone
- Spiderweb (topology) + spiral (trajectory) paired; user's spiral
  richer than Bruner's
- JEJ chain: `JEJ → NM → embody → lenses → orchestrate`
- Companion pedagogy = stance & values cluster integrative name
- N4 locked orthogonal: V/F are practice-stances tied to LOs;
  Composer/Virtuoso cast is teaching apparatus, NOT canonical home for
  any LO
- Bakhtiarian loop = open-ended dynamic (NOT a 4-beat; that was an
  earlier agent over-articulation)
- Twinning is what makes the bridging activity _thinking_ rather than
  mere _process_ (R7)
- Twin-failure categories: ignored / wrong / not-yet-known. Vibing is
  a legitimate stance, not a failure mode. Ceremony-without-twin and
  design-process-without-user-twin are SYMPTOMS, not failure modes.
- Twin/process 2×2: pure process / V (Ch3) / F (Ch2) / both-twins state
  (Ch4 + Ch5)
- SOLO applies WITHIN each layer, not across
- TCER vocabulary stays out of `manifesto.learners.md`, `chapters.md`,
  `syllabus.md` (learner-facing prose stays free of meta-framework
  vocab); lives in ontology Part B.4, `translational-framing.md`,
  `manifesto.authors.md`, `manifesto.community.md`
- AI-adoption model: Evan Cole with collaborators Janet Tilstra and
  Josenne Peña; root inspiration for Ch4
- Bildung: term lives in ontology §15 only; chapters/syllabus describe
  the Ch1↔Ch5 self-twinning arc without naming it

## Working-style memory (read before starting)

In `/Users/master/.claude/projects/-Users-master-Documents-0-teach-code-0-spiralearn-0--home/memory/MEMORY.md`:

- Always plan-mode before edits (user requires ExitPlanMode approval)
- Documentation commits get the full AR cycle (R8-R10 had user-
  iteration-as-AR-equivalent; future commits run mandatory AR)
- AR model dispatch: AR-1/2/5 on Opus, AR-3/4 on Sonnet
- Never create git branches without explicit instruction
- Avoid AskUserQuestion forms during live prose iteration
- Don't soften metaphor cuts when reviewing density
- Don't over-articulate dynamics into N-step forms (the 4-beat lesson)
- "Surface" means discuss conversationally, not list-up

## What NOT to do

- Don't re-litigate the locks above
- Don't reintroduce TCER vocab to learner-facing prose
- Don't promote the composer/virtuoso metaphor back to structural guide
- Don't impose clean N-step structure on the Bakhtiarian loop dynamic
- Don't create new handoff dirs or persistence dirs (the redraft
  pattern moved away from them)
- Don't use "free energy" or "UX" in body prose (per language
  constraints in ontology)
- Don't skip plan mode before substantive edits

## Voilà quoi

The curriculum has its bones. The narrative supersession + bakhtiar
curation are sculpting work, neither on the critical path. Match the
user's thinking-cadence; surface depth when invited; ask before
locking ambiguous decisions. Bon courage.
