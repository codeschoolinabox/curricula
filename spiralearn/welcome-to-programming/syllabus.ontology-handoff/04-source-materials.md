# Source Materials

> Pointers to source materials with paths and relevance notes. The
> ontology document references many of these; this file collects them.

## Primary curriculum artifacts

### `syllabus.md`
**Path**: `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/spiralearn/welcome-to-programming/syllabus.md`

The current syllabus (committed; commit `dad83c2` and `81a09a2`). The
redraft will *not* edit this directly until the ontology has been used
to generate revised prose. Read for current voice and structural
conventions.

### `narrative/README.md`
**Path**: `…/welcome-to-programming/narrative/README.md`

The composer/virtuoso/instrument metaphor + four-threads + PBIS history
+ pedagogical references (Cunningham et al., Block Model, Cognitive Load
Theory, Just Enough JavaScript, Errors-as-information, Snippetry, etc.).
Load-bearing for understanding the current curriculum's vocabulary.

### `narrative/assets/spiral-curriculum.png`
**Path**: `…/welcome-to-programming/narrative/assets/spiral-curriculum.png`

The Bruner-style spiral curriculum diagram. Shows skills at multiple
radii along four cardinal axes (Functional / Navigational / Maintainer /
Developer). **The structural guide for chapter sequencing in WtF.** Each
spiral pass densifies the connection-graph.

### Notional Machine documentation

**Path**: `…/welcome-to-programming/just-enough/javascript/notional-machine.md`

The conceptual evaluation model for JEJ. ECMA-262 spec-aligned. Defines:
- 4 lifecycle phases (realm setup → parse → creation → evaluation)
- Two viewing levels (visual-syntax / behind-the-scenes)
- "Resolve" as the bridge between viewing levels
- "Emit" events for I/O channel boundary
- Embody as "operational embodiment (data + event streams) of this NM"

**Caution**: the doc's "11 NM event categories" are tentative LLM-generated
drafts; only the meta-claim ("there will be NM event categories") is
fact. Don't cite specific categories as authoritative.

### Just Enough JavaScript infrastructure
**Path**: `…/welcome-to-programming/just-enough/javascript/`

Contains:
- `README.md` — V/F framing + conceptual chain (JEJ → NM → embody → lenses)
- `DOCS.md` — architecture + DDD-scope-discipline rules
- `embody/` — operational data substrate (frozen data + event streams)
- `lenses/` — pedagogical instruments for **learning F-territory**
  (parsons, blanks, trace-table, highlight, etc.) — F-pedagogy
  infrastructure, not V-territory
- `orchestrate/` — single-writer editor + recommender + analysis helpers

## User's prior writing (precursors)

### `First Principles.md` + `Wear Hats, not Titles.md`
**Path**: `/Users/master/Documents/0-teach-code/0---the-big-idea/00--evancole-be/0--notes/pages/`

V/F precursor. Roles are situational, plural, context-dependent — not
identity. Direct lineage for V/F as bridging personae.

### `Module___Welcome to JS___1. What Is Programming.md`
**Path**: `…/0--notes/pages/Module___Welcome to JS___1. What Is Programming.md`

"Computer Empathy" as a learning stance — predictive modeling of what
the machine does. Direct precursor to F's NM-twin via prediction.

### Cunningham et al. ATT page
**Path**: `…/0--notes/pages/The Abstraction Transition Taxonomy: …Cunningham…Situated Cognition.md`

Cunningham et al. 2012 paper — the 3-level ATT (English / CS Speak /
Code). The 5-tier ATT in the ontology expands this with bridging
activities having their own *speaks*.

### `studying-with-llms/index.md`
**Path**: `…/welcome-to-programming/-1-getting-started/studying-with-llms/index.md`

Canonical principle source: "AI can write code for you, but it can't
understand a program for you." Underpins V/F symmetry.

### `effective-learning/` archive
**Path**: `/Users/master/Documents/0-teach-code/janke-learning-org/curriculum-jl/0---janke-chunks/good-learning/effective-learning/`

10 files on threshold concepts, liminality, "how you work, not what you
produce." Supports the layered-engagement / scope-discipline pattern.

### `t-fosdem-presentation/fosdem-2019/`
**Path**: `/Users/master/Documents/0-teach-code/janke-learning-org/curriculum-jl/t-fosdem-presentation/fosdem-2019/`

5 files including:
- "Explicitly teach the implicit" — code tracing as meta-skill
- "Process over product" — well-defined sub-tasks
- "Context is content" — environment shapes learning

### AI Adoption Model (HTML, location TBD)
The 4-level model the user shared in conversation:
- Level 3: Behavioral (✓ included) — How AI acts in collaboration
- Level 2: "Cognitive" (✓ included) — What AI knows / how it "thinks"
- Level 1: Conceptual (✗ not needed) — Math & programming
- Level 0: Physical (✗ not needed) — Hardware & infrastructure

Maps precisely onto V/F at Levels 2–3.

## External references

### Karl Friston — "A Duet for One"
**URL**: https://www.fil.ion.ucl.ac.uk/~karl/A%20Duet%20for%20one.pdf

Free-energy / active-inference framework applied to dyadic communication.
Two aligned generative models behave as a single coupled inference
system. "Understanding just IS the alignment of generative models into a
single coherent predictive process." Theoretical root for Ch4's V/F-LLM
convergence claim.

**Course-language constraint**: don't use "free energy" in body; use
"alignment of generative models." Cite Friston in deeper section /
footnote.

### Predictive processing (cognitive science)
- **Andy Clark**, *Surfing Uncertainty*
- **Jakob Hohwy**, *The Predictive Mind*
- The broader cognitive-science framework Friston is one figure within

User pointer: "look into predictive processing and related models from
cognitive science, this is how we work!" Deeper-section content TBD.

### Bakhtiar Mikhak — DGMD E-1 (Harvard Extension)
External course; user has direct lineage. Course description (provided
by user, mid-conversation):

> "Practical design course on perspectives, tools, and methods for going
> from an idea for a product or service powered by a mobile and/or web
> application to an interactive design prototype ready for handoff to a
> development team. We begin with creating detailed personas and
> stories... develop a component-based design system for creating
> interactive prototypes with live data... Technologies used in this
> course include Framer, Notion, and React."

**Inspires**: the embody/lenses architectural pattern (data
structured-for-interaction + flexible-experience-consumption).

**Note**: lenses are F-pedagogy infrastructure in WtF — Mikhak's pattern
is V/F-neutral; the curriculum's *application* of the pattern is
F-specific. Don't conflate the architectural pattern with the V/F mapping.

### Michael Levin — Platonic Space (deferred to third course)
Bioelectric morphogenesis; tissues as computational substrates that
discover pre-existing computational forms. **Third-course territory**;
WtF stays at L0–L3 grounded data-flow examples.

### Hofstadter — Gödel, Escher, Bach
GEB is a respected influence; WtF is **not** a wannabe-GEB. Music as
instructive metaphor for some moments; not structural guide. The
foundational principle "concepts are connections; connections are
concepts" rhymes with Hofstadter's strange loops but doesn't depend on
the GEB framework.

### mu image (deeper section / appendix)
**URL**: https://blog.p-petrov.com/assets/images/imgs_geb/mu.png

Original GEB image showing wholism/reductionism mu structure. WtF will
make a Vibetoading/Frogramming version as a deeper-section / appendix
tribute.

## Internal artifacts that capture the conversation

### Plan file
**Path**: `/Users/master/.claude/plans/we-re-starting-an-enriching-snappy-bird.md`

The full ~1100-line meta-record of the 5-round thinking session. Consult
only when the ontology document doesn't answer a specific question.

### User response files (`syllabus.clauding-{1,2,3,4}.txt`)
**Path**: `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/spiralearn/welcome-to-programming/`

User's mid-conversation responses to my questions. Round-by-round:
- `syllabus.clauding-1.txt` (no longer exists; archived)
- `syllabus.clauding-2.txt` — round 2 responses
- `syllabus.clauding-3.txt` — round 3 responses (concepts/connections principle surfaced)
- `syllabus.clauding-4.txt` — round 4-5 responses including the transformational pondering and the 5-layer architecture

Read these for the user's exact phrasing and reasoning when in doubt.

### Earlier diagrams (`syllabus.pbis-refinement.mmds/`)
**Path**: `…/welcome-to-programming/syllabus.pbis-refinement.mmds/`

Surviving mermaid files (post-cleanup):
- `01-geometry-three-domains-two-bridges.mmd` — current geometry diagram
- `03-code-speak-decomposition.mmd`
- `09-metaphor-extension-instrument-split.mmd`
- `11-order-of-operations.mmd` (may be obsolete after round 5 reset)
- `12-data-as-shared-language.mmd`
- `13-resolve-and-emit-data-bridges.mmd`
- `14-mikhak-data-interaction-pattern.mmd`

Most prior diagrams (01-v1, 02, 04, 05, 06-v1, 07-v1, 08-v1, 10) were
deleted as superseded.
