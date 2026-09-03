# Epicycles — learning to program and programming to learn, at spiral-turn grain

> Author-facing design memo. Part of the `computational-thinking/` set; start at
> [README.md](./README.md).

## Two definitions this document is named for

**Epicycle.** A small cycle riding a larger one. Here: within each turn of the
curriculum's spiral, a second, smaller turn — the language increment, and then
the computational thinking that increment affords. The spiral advances the
language; the epicycle advances the thinking, on the same turn.

**Half-beat.** The second half of a paired beat. The curriculum's cycles already
have a language half — introduce a feature, master it, cash it out into
user-facing behaviour. The half-beat is the missing other half of the same beat:
_what can you now say about a system that you could not say before?_ It is not
an appendix to the cycle; it is the part of the cycle that was never written.

## The reconciliation

Two positions sit in the source material and read as a contradiction.

> "Learning a programming language is a separate process from learning
> computational thinking. Courses often try teaching both at once. I prefer to
> teach programming language and composition skills first then build higher
> level thinking on this foundation." [read:
> `from-a-job-application/ltp-ptl.md:3`]
>
> "So this course will gradually interweave more complex forms of computational
> thinking as it introduces the JEJ language features to express and manipulate
> these thoughts." [read: `plann.txt:51`]

Sequence, or interweave. Both, at different grains: **sequential within an
epicycle, interwoven across the course.** Each turn does language first and then
the thinking it affords — the sequencing the first quote asks for — and because
there are many turns, the course as a whole interweaves them, which is what the
second quote describes. There is no contradiction, only two grains being
described in the same words.

## "Orthogonal" does double duty, and both readings are true

The claim that language mastery and computational thinking are _orthogonal_
rests on a real observation:

> "Some studies have even found almost no correlation between how well learners
> understand their theoretical solution to a coding challenge and learners whose
> code passes the tests!" [read: > `from-a-job-application/study-lenses.md:5`]

- **Orthogonal as competencies.** You can have either without the other. The
  dissociation above is exactly the evidence for this, and dissociation is the
  canonical evidence for _two_ capacities rather than one.
- **Entwined as a learning process.** You cannot learn one well without the
  other developing, because the thoughts are partly constituted by the notation
  (see [computational-languages.md](./computational-languages.md)).

Both hold. The distinction between them is the pedagogical crux of this course,
and it is the reason the earlier phrasing "one skill, two target-distances" was
wrong: **one _practice_, two target-distances.** What is shared across F&V and
Welcome to Algorithms is predict–observe–notice-divergence–update, not a
competency.

> **Owed, and load-bearing.** The no-correlation finding is uncited — no source,
> no measures, no population. It also runs against mainstream
> computing-education results: Lopez, Whalley, Robbins & Lister (ICER 2008)
> found tracing and explaining account for a substantial share of variance in
> code-writing, and Venables, Tao & Lister (ICER 2009) replicated the
> relationship. A null between two noisy proxies is weak evidence. **The entire
> learning-to-program → programming-to-learn architecture rests on this
> sentence**, so it needs its source before it is published anywhere
> learner-facing. (Those two citations are also unfetched.)

## The adverse literature, which must be met rather than skipped

The half-beats are gate-bearing, and the gate is _demonstrated transfer_.
Transfer is the outcome this field is least able to deliver:

- Pea & Kurland (1984) — the original negative result on programming and general
  cognitive skill.
- Salomon & Perkins (1987) — high-road transfer requires **mediated
  abstraction**. It does not follow from moving the target; it has to be taught
  for.
- Denning, "Remaining Trouble Spots with Computational Thinking" (CACM 2017).
- Scherer, Siddiq & Sánchez Viveros (2019), meta-analysis — moderate near
  transfer, weak far transfer.

> None fetched. Do not cite without reading.

Two consequences. **Near transfer is the honest target** — a second target
system in the same discipline, not a claim about thinking better in general. And
Salomon & Perkins is the reason the half-beat must be _taught_, explicitly and
with its own artifact, rather than hoped for as a side-effect of the language
work.

## Two flavours, deliberately asymmetric

- **F half-beat** — new language feature → new thinkable thoughts → a richer
  computational reading of the world.
- **V half-beat** — new computational thinking → new program possibilities → new
  human experience.

They are not mirror images, and the asymmetry is the ruling, in the author's
words:

> "V can also be a type of CT _if_ approached through that lens — twinning
> allows for this. But the methods of design thinking, user empathy, and user
> experience are more suited to the **ends** of a toader than approaching a user
> as a computational system."

That is a **pedagogy** ruling, not a claim about what computational thinking is.
It belongs here and not in [thesis.md](./thesis.md). By the thesis's own three
conditions V's Ch2 practice _is_ meaningful computation — `ontology.md:936-946`
describes a real second system, mapped both ways, with inference from
intermediary states and a manipulable correspondence. Ruling that V is "not CT"
would contradict the thesis. Ruling that CT is the wrong instrument for V's ends
does not.

## Where the ethics lands, and why it stops being an open question

Once CT-on-the-user is admitted as available, the question _when is this lens a
weapon?_ becomes due. Modelling a person as a system to be driven toward a
predicted response is also the shape of engagement optimisation, dark patterns,
and A/B-tested coercion.

This is why the lens stays **optional** rather than becoming the default stance
for V — which is the same conclusion the ruling above reaches from the other
direction.

It lands in **Ch2**, not Ch1. Ch2 has the apparatus that makes it demonstrable:
a simulated user who complies with a coercive dialog is the lesson, in a way no
amount of Ch1 prose could be. Ch1 has the affordances — a `confirm` inside a
loop is a retry-until-yes dialog, buildable in JEJ at C4 — but none of the
observation machinery that would let a learner _see_ the harm rather than be
told about it.

## Ch1 is F-flavoured only

The V flavour does not run through Ch1. The chapter design already says why:

> "The proposals stayed modest (greet, gate, retry, validate) so the discoveries
> could go deep. Ch2 swings the other hand: the proposals get the depth." [read:
> `chapters.md:1117-1119`]

Running V half-beats through Ch1 would dissolve the F-hand / V-hand split the
whole course is built on. And it is unnecessary: **Ch2's V1–V5 ladder is already
a spiral of V half-beats** — self as instrument, persona and scenario, peer as
user, user story from spec, plaintext at experience scale [read:
`chapters.md:1434-1551`] — whose increments are ways of seeing rather than
language features.

## The increment is not always a language feature

Generalise the form once, so Ch2–Ch4 are not retrofitted:

| Chapter | The increment                | The half-beat asks                       |
| ------- | ---------------------------- | ---------------------------------------- |
| Ch1     | a language feature           | what can you now _say_ about a system?   |
| Ch2     | an observation method        | what can you now _learn_ about a person? |
| Ch3     | a collaboration move         | what can you now _delegate_, and verify? |
| Ch4     | more of the language surface | what can you now _express_?              |

The pattern is `increment → the affordance it opens`. Ch1's version is the
instance, not the pattern.

## Seed at cycle, harvest at beat

The load argument cuts both ways and the resolution is not either/or.

Against a full half-beat at first encounter: 4C/ID places variability of
practice _within a task class_, after the constituent skill is performable, and
recurrent skills get spaced part-task practice rather than concurrent
enrichment. A target-system modelling exercise at the moment of first meeting
`let` competes directly with the intrinsic load of the increment — in the
chapter the course itself flags as the steepest. Arithmetic: C0–C6 plus four
beats is 11 units; a full half-beat per cycle could nearly double that.

For doing it anyway: the Transfer Paradox (`pedagogy.md:520`) is the argument
against deferring all of it to the end, and Salomon & Perkins says transfer that
is not taught for does not arrive.

**The resolution.** At each cycle, the half-beat is one or two sentences at
near-zero load: _what can you now say that you could not before?_ The assessed
work lands at **Consolidation Beats A–D**, which already exist, are already
gate-bearing — "C0 through C6 plus the four beats" [read: `chapters.md:1127`] —
and are already structured as cross-cycle re-traces. The gate's wording does not
change. The expensive work sits where the constituent skills are already
performable. And the assessment has four homes instead of six to twelve.

## The Whole-Game test

The single sharpest design constraint available:

> If the half-beat is a **separate exercise beside** the cash-out, it is
> elementitis. If it **changes what the cash-out program is**, it is whole game.

Push it into the cash-out. _"Write a normalizer that is wrong about at least one
real name, and a comment saying which"_ adds no unit, costs almost no additional
load, is assessable, and is genuine transfer. Applied across C1–C6 this
dissolves most of the load problem rather than managing it.

## The admissibility criterion

**A half-beat is admissible if and only if it names a specific correspondence
between a specific program state and a specific target-system state, and the
learner can break it.**

If the only available response is agreement, it is filler.

This is condition 3b ([observability.md](./observability.md)) turned into an
editorial rule. Publish it _with a rejected counterexample beside it_ — see
[half-beat.md](./half-beat.md) — because drafters who see only the rule will
write the bad version and believe they have complied.

**A hard constraint, not a preference: the artifact must be falsifiable by
running something.** Ch1 is pre-threshold, where AI is study-buddy only, and the
mastery contract says a skill is mastered when its exercises can be completed
without AI. "Here is how this feature lets you read the world differently" is
the output shape an LLM produces best and a learner can least evaluate —
`pedagogy.md:132`: _"AI cannot help when learners don't yet know what to
verify."_ A prediction-shaped artifact with an exhibited divergence closes that
hole: a model can write the prose, but it cannot have found the divergence in
the learner's own program.

## Layers: the half-beat is where the others enter the main thread

The half-beat is L2-shaped content. `pedagogy.md:236-237` marks L2 skippable for
an L1 reading, and `guide.learners.md:210` promises L1 is a complete exit.
Making half-beats gate-bearing looks like it breaks that promise.

It does not, because the half-beat is **itself layered**. `ontology.md:719-722`
already establishes that every chapter runs all five layers as engagement depths
a reader may stay at or descend through. The gate requires the **L1 depth** —
the stated correspondence and the exhibited divergence. L2, L3 and L4 readings
of the same half-beat are descent, not requirement.

So the half-beat is not L2 content bolted onto an L1 spine. It is **the seam
through which the other layers reach the main thread** — which is a better
answer than either "gate it" or "make it optional," and it is why the layers
stop being parallel exit ramps and start being depths of one thing.

## AI across the epicycles

AI is a **study partner** throughout, and delegation arrives at Ch3. That
sequencing is deliberate and unchanged.

One clarification is owed to `pedagogy.md:116-134`, which currently argues the
AI Integration Threshold from SOLO — Relational understanding is what makes AI
output evaluable. Under this document, computational thinking work begins in
**Ch1**, pre-threshold and unaided. Those are compatible only if the threshold
is read as a **delegation** threshold rather than a **computational-thinking**
threshold. That is the ruling; it needs a real re-derivation in `pedagogy.md`,
not a clarifying sentence, because the existing argument for the threshold's
placement is SOLO-based and would otherwise be quietly contradicted.

## Open

- **Are target systems localizable?** Half-beats would be the most context-bound
  content in the course, which cuts against Forkability and the Reusability
  Paradox. A Belgian café is not a universal target system. If partner
  communities are expected to localise them, say so and design for it.
- **Welcome to Algorithms** is characterised here only from
  `from-a-job-application/ltp-ptl.md:27-35`. The live plan at
  `spiralearn/welcome-to-algorithms/chapters-plan.md` has not been read into
  this document.

## Related

- [half-beat.md](./half-beat.md) — one drafted, one rejected, and the gate item
- [thesis.md](./thesis.md) — L4 and L5, of which this is the curriculum form
- [domain.md](./domain.md) — what the target systems are made of
