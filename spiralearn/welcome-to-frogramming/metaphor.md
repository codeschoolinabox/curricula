# Welcome to Frogramming — The Composer/Virtuoso/Mechanism Metaphor

> The teaching apparatus — composer, virtuoso, mechanism, audience —
> through which the curriculum illuminates moments. **First-class
> teaching apparatus, explicitly NOT structural guide.** The metaphor
> illustrates the V/F lens-pair and the strata of a software system; it
> is not a separate ontological commitment.
>
> Companions (siblings, by co-location):
>
> - `README.md` — the high-level orientation and reading map
> - `ontology.md` — the _what_ (concepts the metaphor
>   illustrates, especially §3 V/F, §8 strata, §6 strands)
> - `pedagogy.md` — the _how it's taught_ (design principles
>   for using the metaphor in instruction)
> - `narrative.md` — extensions and illustrations of the
>   metaphor that didn't fit the un-prose-y reference register
> - `study-lenses.md` — the technical-reader companion
>   (lenses are the "kit of magnifying glasses" 🔬 the Frogrammer carries)

---

## Why this file exists

The composer/virtuoso/mechanism metaphor is rich enough to deserve its
own home. Three principles govern its use:

- **First-class teaching apparatus.** It illuminates moments.
- **NOT structural guide.** The spiral curriculum (pedagogy §6) is the
  structural guide.
- **Composer ≈ V's lens on the artifact**; **virtuoso ≈ F's lens on the
  artifact's notation-execution**. The cast is an illustration of the
  V/F lens-pair (ontology §3) and §8's strata, not a separate
  ontological commitment.

> _"When the metaphor serves the vision, use it. When it strains, drop
> it. The vision stands on its own. The metaphor is illustration, not
> argument."_ — `narrative/README.md`

---

## The metaphor in one sentence

Throughout this course we illustrate the ideas in `README.md` and
`ontology.md` using a consistent metaphor: **a mechanical
instrument, a composer, a virtuoso, a score, and an audience.** The
instrument varies across chapters; the roles stay the same. If the
metaphor doesn't click for you, the underlying ideas stand on their
own.

| Idea                    | Illustration                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| The notional machine    | A **mechanical instrument** — plays the score blindly, deterministically                      |
| Source code             | **The score** — notation the mechanism reads                                                  |
| The designer            | **The composer** — holds computational intent, understands the instrument, knows the audience |
| The implementer         | **The virtuoso** — masters notation and the controls; produces the score from direction       |
| Users                   | **The audience** — concert-goers who react to the performance                                 |
| Other developers        | **Co-composers** — fellow score-readers                                                       |
| The computer evaluating | **The mechanism playing the score blindly at performance time**                               |

Chapter 2 studies the instrument's mechanism. Chapter 3 brings in the
audience and design thinking. Chapter 4 teaches collaboration with the
alien virtuoso (the LLM). Chapter 5 turns to the composer's daily
practice — snippetry — and hints at alien composers emerging on the
horizon.

---

## Two-scale instrument extension

The metaphor extends naturally to a two-scale reading: the **first
instrument** is the mechanical instrument playing the score (the NM
evaluating code); the **second instrument** is the user's experience of
the played piece (intangible, emergent, arising from interaction). The
**concert** — the experience-as-purpose — is what V and F orient
toward. This is illustration of the whole rhetorical situation strand
(ontology §6); the strand carries the learning objective, the metaphor
carries the picture.

## The cast (six roles)

| Actor                 | Variants        | Role                                                                                |
| --------------------- | --------------- | ----------------------------------------------------------------------------------- |
| **The Composer**      | human or alien  | designs the computation; knows the instrument's capabilities; aware of the audience |
| **The Virtuoso**      | human or alien  | notation mastery; feel for the controls; produces the score from direction          |
| **The Mechanism**     | (always itself) | the mechanical instrument — plays the score blindly, deterministically              |
| **The Audience**      | (human)         | concert-goers — react audibly (cheer, boo, throw tomatoes or flowers)               |
| **Co-composers**      | (human)         | fellow score-readers — read each other's work for intent and style                  |
| **Historical cameos** | (human)         | Mozart, Bach, Ligeti, Lovelace, Babbage — as sidebars                               |

## The mapping

| Element         | Mechanical-instrument world                                       | Programming world                                           |
| --------------- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| The instrument  | A mechanical instrument (organ, music box, beat machine, gamelan) | The JS notional machine                                     |
| The medium      | The score — notation the mechanism reads                          | Source code                                                 |
| Actor 1         | The Composer (human or alien)                                     | Student (designer) — computational intent, NM understanding |
| Actor 2         | The Virtuoso (human or alien)                                     | Implementer (often an LLM) — syntax, idioms, libraries      |
| Listeners       | Concert audience + co-composers + the mechanism                   | Users + other developers + the computer                     |
| Black-boxed     | Stops, combination actions — known by output                      | Built-in APIs — known by interface                          |
| The whole event | The recital                                                       | The rhetorical situation                                    |

## Why mechanical specifically

A mechanical instrument plays the score blindly at runtime — no human
in the execution loop. Two phases cleanly separated:

- **Composition phase**: composer + virtuoso collaborate iteratively
  on the score. LLMs live here.
- **Execution phase**: the mechanism plays the score exactly as
  written. No LLM, no interpreter with judgment.

Matches JS's deterministic execution. The precision in the score
matters because there's no performer to rescue badly-notated passages.

## Why varying instruments

Different instruments serve different moments. Improves cultural
accessibility by not anchoring to European classical tradition:

- Pipe and mechanical organs (introductory — visible mechanics)
- Orchestrions, player pianos (scaling up)
- Music boxes / one-note instruments (constraint-as-generative;
  Ligeti's _Musica Ricercata_)
- Drum machines and beat machines (contemporary, accessible)
- MIDI sequencers (fully programmatic)
- Gamelan with karakuri puppet mechanisms (non-European automated
  tradition)

The rule: preserve composer/virtuoso/mechanism with automated
execution. Within that, range widely.

## Why "virtuoso" specifically

Technical mastery without ownership of compositional vision. Different
automated skillset — notation fluency, idiom, instrument-specific
knowledge. Direct analog to comprehension-before-production: students
learn to read, trace, evaluate deeply; they write small programs to
verify understanding; they don't need to automate fluent production
because the virtuoso handles that.

## Human virtuoso vs alien virtuoso

- **Human virtuoso (Ch1–3)** — senior engineer with fluent hands; deep
  idiom; patience for collaborative work
- **Alien virtuoso (Ch4)** — LLM. Dazzling, fast, pattern-rich, but
  weird. Sometimes plays what you said rather than what you meant.
  Trained on millions of human virtuosos but cognitively distinct.
- **Alien composers (teased, deferred)** — agentic AI systems that do
  design work, not just notation. Ch4.5 and Ch5 closing flag this;
  full treatment deferred to WtA.

## Composer pedagogy mappings

Musical composition training offers parallels to this curriculum's
skills (from `narrative/README.md` §5):

| Composer training                       | Curriculum parallel                                       |
| --------------------------------------- | --------------------------------------------------------- |
| Studying scores (hearing internally)    | **Read** — marking syntax, reading aloud                  |
| Analyzing master composers' works       | **Describe** — PBIS, code review                          |
| Transcribing performances               | **Trace tables**                                          |
| Sight-reading exercises                 | Predictive stepping                                       |
| Writing variations on a theme           | **Modify** — tracked changes to working programs          |
| Counterpoint & harmony exercises        | Constrained exercises (fill-in-blanks, Parsons)           |
| Arranging existing pieces               | **Refactoring, migration, porting**                       |
| Reverse-engineering a performance       | **Reverse engineering** (Ch 3)                            |
| Listening with score in hand            | Debugger with source visible; the composer's critical ear |
| Workshopping with performers            | LLM collaboration (Ch 4)                                  |
| Studying the instrument's mechanics     | NM deep dive (Ch 2)                                       |
| Small-scale practice (sketches, drills) | **Snippetry** (Ch 5)                                      |

## The 8 AI-collaboration skills

From `narrative/README.md` §16. Each has a specific composer-virtuoso
activity:

| Skill                | Composer-virtuoso activity                                                         |
| -------------------- | ---------------------------------------------------------------------------------- |
| **Perspective-Take** | Understanding the virtuoso's habits, blind spots, tendencies                       |
| **Calibrate**        | Having the virtuoso play a known passage before trusting them with a difficult one |
| **Articulate**       | Score annotations and verbal direction                                             |
| **Iterate**          | Rehearsal with revision cycles                                                     |
| **Delegate**         | Choosing what to notate precisely vs describe in prose                             |
| **Read**             | Reviewing the virtuoso's transcription against your intent                         |
| **Trace**            | Mentally playing through what the virtuoso wrote                                   |
| **Describe**         | Naming the gap between what you heard and what you wanted                          |

## Reign in wannabe-GEB

Music is an instructive metaphor for some moments, NOT a structural
guide. _"Reign in the intellectual grandness."_ The course is grounded
experience-based instructional design with explicit objectives. GEB is
a respected influence; the structural guide is the spiderweb + spiral
(pedagogy §6).

The metaphor is **load-bearing but not load-exclusive**. Use where it
illuminates; set it aside where it strains.

Ontology §13 carries the one direct GEB acknowledgment in the curriculum,
as a bounded L4 section. Elsewhere, the reign-in holds.
