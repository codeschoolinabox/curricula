# Decisions Log — What's Settled

> Settled commitments after 5 rounds of thinking-together. Each entry
> reflects an explicit user decision; "settled" doesn't mean "untouchable"
> but means "don't relitigate without strong new pressure."

## Foundational

| Decision | Round | Notes |
|---|---|---|
| **V (🎨 Vibetoader) and F (🔬 Frogrammer) are the only two characters** | R1 | Option B locked; Cartographer / 4-character cast rejected |
| **V's twin is the user**; bridging activity is **design thinking** | dad83c2 + R2 | Non-delegable |
| **F's twin is the NM**; bridging activity is **computational thinking** | dad83c2 + R2 | Non-delegable; aligns with Wing 2006 "computational thinking" lineage |
| **V and F are substrate-agnostic** — extend beyond JS-in-browser | R2 | Wearables, embedded, embodied — Media Lab range |
| **Two foundational principles** are canonical | dad83c2 + R5 | (1) AI cannot UNDERSTAND for you; (2) Concepts are connections / connections are concepts |
| **Geometry: 3 domains + 2 bridging activities** | R2 | Replaces 5-spaces ontology |
| **Central artifact tentatively named "the computational artifact"** | R3 | Alternatives include "the artifact"; encounter as relational frame |
| **Hardware lives inside the computational artifact** | R2 | Perpendicularity as separate axis is **deferred** |

## Pedagogical structure

| Decision | Round | Notes |
|---|---|---|
| **5 engagement-depth layers (L0–L4)** run through every chapter | R5 | NOT a chapter sequence |
| **Spiral curriculum is the chapter-structure guide** | R5 | `narrative/assets/spiral-curriculum.png` |
| **Each layer has explicit objectives**: primary, purpose, meta, learning means, data thread | R5 | Per user pondering |
| **Platform-agnostic constraint**: pure markdown + Study Lenses | R5 | No special platform features required |
| **Layer architecture in MD**: L0/L1 in body; L2 in sidebars/dialogues; L3 in end-of-chapter prompts; L4 in footnotes/easter eggs | R5 | L2 dialogues necessary for L2 reading; skippable for L1 |
| **Reading note** added to syllabus telling learners how to use the layers | R5 | Drafting deferred to next session |
| **Reign in wannabe-GEB**: GEB is respected influence, not structural guide | R5 | Music as instructive metaphor, not structural guide |

## Vocabulary / framework

| Decision | Round | Notes |
|---|---|---|
| **5-tier ATT survives** with bridging activities having their own *speaks* | R2 | Domain / Design / Artifact / Computational / CS speak |
| **PBIS letters are flexible vocabulary, not a sequence** | R4 | No canonical order; no canonical trading zone |
| **Chapter restructure (BIS → Ch2 / PB → Ch3) as foregrounding choice** | R4 | Survives even without linearity claim |
| **5 threads (twinning, decisions, perspective stacking, whole rhetorical situation, affordances)** | R5 | Threads are *kinds of connection* |
| **Affordance is the 5th thread + cross-cuts all four prior threads** | R5 | Relational property (Gibson) |
| **The data thread is a red thread ramifying through 5 layers** | R5 | Same word, growing semantics |
| **The Bakhtiarian loop is V/F bidirectional coordination** | R3 | 4-beat exercise choreography for L2: V proposes / F responds / F discovers / V interprets |

## Friston / cognitive science

| Decision | Round | Notes |
|---|---|---|
| **Twinning IS active inference** (Friston / predictive processing) | R4 | Cognitive-science grounding for the curriculum's central skill |
| **Friston's "A Duet for One" cited in Ch4** as theoretical root for V/F-LLM convergence | R4 | Footnote citation; full philosophy in deeper section |
| **"AI generates; doesn't twin. Twin the LLM AND what it twins; correct divergences; relish productive divergences"** | R4 | Pedagogical claim grounding LLM collaboration |
| **Same skill at two layers**: L2 = defensive (detect/correct misalignment); L3 = offensive (use misalignment for creative discovery) | R5 | Paired-skill design |
| **Language constraints**: "free energy" ❌, "alignment of generative models" ✓, "predictive processing" ✓, "active inference" ✓ (with explanation) | R5 | See `05-language-constraints.md` |

## AI-adoption model

| Decision | Round | Notes |
|---|---|---|
| **The user's pre-existing AI-adoption model maps precisely onto V/F** | R4 | Levels 3 (Behavioral) ↔ V; Level 2 (Cognitive) ↔ F |
| **Ch4 organizing line**: "you twin Level 2 in order to operate at Level 3" | R5 | Fristonian + pedagogically meaningful |
| **Levels 0–1 exclusion is scope-discipline** | R4 | Not blindness; same move WtF makes for V/F practice |

## Self-twinning Bildung arc

| Decision | Round | Notes |
|---|---|---|
| **Ch1↔Ch5 self-twinning symmetry named explicitly** | R4 | "The audience YOU are becoming" |
| **Each chapter adds a perspective future-you must hold** | R4 | Ch1: dev-reader; Ch2: NM tracer; Ch3: user considerer; Ch4: LLM duet partner; Ch5: poly-perspective self |
| **Worth surfacing in §What to Expect** | R4 | Drafting deferred |

## Curriculum-as-Quine

| Decision | Round | Notes |
|---|---|---|
| **Quine ethos mentioned light-touch** in syllabus body | R3+ | A learner who finishes can teach and extend the course |
| **Remix instructions in course appendix** | R3+ | Drafting deferred |
| **Forks-as-mechanism deferred** | R3 | First get one version out; reassess later |
| **Platform-agnostic (markdown + lenses)** preserves Quine-property at the text level | R5 | Anyone can fork from plain markdown |

## Tee-off courses

| Decision | Round | Notes |
|---|---|---|
| **Welcome to Algorithms** = F's deeper waters → CS/theory | R1 | Algorithm strategy, complexity, formal correctness |
| **Welcome to Design** = V's deeper waters → domain | R5 | Renamed from "Welcome to Digital Design" (rejected — collides with HDL) |
| **Third course (TBD name)** = exotic computation territory | R5 | "Fractal border of philosophy and science"; slime molds; Levin's Platonic Space; consciousness; cosmology-as-computation; Media Lab dreamland |
| **Drop the Anuran / Cartographer character thread for WtF** | R3 | Possibly the third course; not WtF |

## What's dropped (do not reintroduce without strong reason)

- ❌ Linear PBIS sequence (PBSI vs PBIS rename) — flexible vocabulary instead
- ❌ B as canonical trading zone — any letter can be a meeting point
- ❌ "P↔S outer / B↔I inner" upgrade — superseded by flexibility
- ❌ Wannabe-GEB structural framing — Bruner's spiral instead
- ❌ Bach-fugue parallel as structural guide — kept only as L4 easter-egg sentence at most
- ❌ Whole/parts/higher-whole dialectical claim — it's a spiral, not a dialectic
- ❌ Custom platform requirements — pure markdown + lenses
- ❌ Strange-loops as foreground — kept as L4 easter eggs only
- ❌ Mu code snippet for course body — was thinking aid; mu *image* (V/F tribute) survives in deeper section
- ❌ Anuran / Cartographer / third-twin in WtF — third-course territory only
- ❌ The "UX" name for the central pillar — "user experience" carries product connotations; use "the encounter" or vary terms by facet
- ❌ Diagrams 04, 05, 02-v1, 06-v1, 07-v1, 08-v1, 10 in `syllabus.pbis-refinement.mmds/` — superseded; deleted
- ❌ Treating notional-machine.md's "11 NM event categories" as fact — they're tentative LLM-generated drafts; only fact is "there will be NM event categories"
