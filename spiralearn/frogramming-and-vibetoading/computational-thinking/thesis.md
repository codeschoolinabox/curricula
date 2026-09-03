# The thesis

> Author-facing design memo. Part of the `computational-thinking/` set; start at
> [README.md](./README.md). Supersedes `plann.txt`, which is kept as provenance.

## The claim

> **Meaning, legibility, and notation are three separate additions to bare
> computation. Computational thinking requires all three — which is why it
> cannot be taught abstracted from a medium.**

Everything below is the chain that establishes it, and the reason the claim is
not merely true but _useful_: each of the three additions names a piece of
infrastructure a curriculum has to actually supply. A course that skips one is
not teaching computational thinking, whatever it calls itself.

## The chain, as a layered DAG

It is not a chain. Two nodes have more than one parent, so what follows is a DAG
presented in layers, where **each layer adds exactly one new ingredient**.

| Layer | Adds                                        | Nodes                                                                        |
| ----- | ------------------------------------------- | ---------------------------------------------------------------------------- |
| L0    | states that change                          | computational artifact · computation                                         |
| L1    | a second system → _semantics_               | meaningful computation                                                       |
| L2    | an observer with instruments → _epistemics_ | legible computation                                                          |
| L3    | symbols → _representation_                  | computational language · programming language · algorithm · notional machine |
| L4    | a practitioner → _practice_                 | computational thinking · the NM-twin                                         |
| L5    | the world as target                         | applied computation                                                          |
| L6    | values                                      | intentional computation                                                      |

The layers order **ingredients**. The DAG orders **dependencies**. They do not
perfectly coincide, and the one place they come apart is recorded below rather
than smoothed over.

### L0 — computational artifact, computation

A **computational artifact** is a physical or conceptual system whose states
change over time.

**Computation** is rule-governed transformation of _medium-independent_ state.
Medium-independent means the rule is indifferent to what the states are made of
— voltages, ink, beads, neurons — and cares only about their structure.

Computation at L0 is a **physical process taking place in the world**.
Everything the later layers add — a target, an observer, a notation — is added
_about_ that process, not instead of it. Keeping this in view is what stops the
chain drifting into an account of representations that represent nothing.

This definition is deliberately **non-semantic**. Nothing here represents
anything. That is the point: an earlier draft put "represents/models data"
inside the definition of computation, which is circular. If representation
requires an interpreter, computation is _already_ meaningful and L1 names
nothing new; if it does not, "represents" is the wrong word and computation
collapses back into L0's "a system whose states change." Medium-independence
cuts between the horns — mechanical at L0, semantic at L1.

> Owed: this is Piccinini's mechanistic account (_Physical Computation_, 2015).
> Not yet fetched. Do not cite without reading.

### L1 — meaningful computation

Computation is **meaningful** when there is a second system — the **target** —
such that:

**(a) Correspondence.** The artifact's internal states can be mapped from _and_
to the target's states. Both directions; a one-way map is a coincidence.

**(b) Inference.** Information about the target can be inferred from the
artifact's _intermediary_ states — not only its final output. This is what makes
a running program informative rather than merely correct.

**(c) Intervention.** The correspondence supports intervention: perturb the
artifact and the correspondence covaries systematically; perturb the target and
it covaries back. Counterfactual-robust, not fitted to a single trajectory.

**Condition (c) is what defeats the triviality objection**, and it is worth
being precise about why, because an earlier draft got this wrong in an
instructive way. Putnam's construction and Searle's wall/WordStar establish that
_some_ mapping exists between any open physical system and any finite automaton.
Requiring the mapping to be **observable** does not remove a single one of those
mappings — it only filters which ones we notice, which concedes
observer-relativity rather than answering it. Requiring the mapping to **support
intervention** does remove them: Putnam's mappings are fitted to one actual
trajectory and support no counterfactuals.

The observability half of the original condition is real and important. It is a
different condition, and it lives at L2.

> Owed: Putnam, _Representation and Reality_ (1988), the appendix; Searle, _The
> Rediscovery of the Mind_ (1992); Chalmers, "Does a Rock Implement Every
> Finite-State Automaton?" (1996); Woodward, _Making Things Happen_ (2003). None
> fetched. Do not cite without reading.

**The target is an input, not something the chain produces.** It comes from
outside. This matters more than it looks: the same node with the target
instantiated differently is what L5 turns out to be.

### L2 — legible computation

Meaningful computation is **legible** when the correspondence is observable and
manipulable _with the instruments at hand_.

This is a claim about **access**, not about existence. A computation does not
become meaningful when someone builds a tool for it. It becomes _teachable_.

Legibility is three-place — artifact, target, observer — where meaning is
two-place. That is why it cannot be a third bullet on L1's list; it is a
different node with a different arity.

Two things follow, developed in [observability.md](./observability.md): it is
the criterion that decides what a course can actually work at, and it
deliberately leaves room for cases where observation is itself the difficulty.

### L3 — computational language, programming language, algorithm, notional machine

A **computational language** is a symbolic representation of meaningful
computation.

A **programming language** is a computational language that has _causal
influence_ over a computational artifact.

An **algorithm** is a computational language that does not. It is an abstract
symbolic representation of how a machine transforms data, and it is the cleanest
example of the genus that is not the species — which the reader needs, or
"computational language" collapses into a synonym for "programming language."

A **notional machine** is a computational language whose target system is the
artifact itself, pitched at an **intentional, calibrated level of abstraction
and detail**. The calibration is part of the definition, not a quality of good
ones: there is no such thing as _the_ notional machine of a language, only
notional machines chosen for a purpose and an audience. This is why one language
can carry several, and why choosing the level is a pedagogical act.

> Type/token, unresolved: "a symbolic representation" is ambiguous between the
> _system_ (French) and the _utterance_ (a French sentence). A programming
> language is a type; an algorithm is closer to a token. The course teaches a
> language through programs, so it lives on both sides. Decide before Ch0.
>
> The NM definition here deliberately drops "event-based" from the earlier
> draft. Event-based is a JEJ and `embody` design commitment, not a property of
> notional machines; most documented NMs are state-based. Owed: du Boulay
> (1986); Sorva, "Notional Machines and Introductory Programming Education"
> (TOCE 2013). Not fetched. Sorva additionally distinguishes the NM-as-taught
> from the learner's mental model — a distinction `ontology.md` currently
> merges. See [tie-ins.md](./tie-ins.md).

**The one place layers and dependencies come apart.** The notional machine is
symbolic, so it belongs at L3; but its _job_ is to make the artifact legible,
which is L2. The edge runs backward relative to the ingredient ordering. This is
structural, not a drafting error, and it is very likely why the notional machine
is perennially hard to define.

### L4 — computational thinking

**Computational thinking** is understanding, predicting, discussing and
designing meaningful computation by way of a computational language.

All four verbs are observer-verbs. So computational thinking depends on
**legibility**, not merely on meaning — which is the precise location of the
course's infrastructure bet. Study Lenses does not make computation meaningful.
It makes it legible, and legibility is what the practice requires.

The **NM-twin** — the learner's own generative model of the machine — is a
product of this practice, not an input to it.

At CT-scope, and specifically about how computational thinking is learned and
communicated:

> _A computation is the idea embodied by a notional machine and expressed
> through the language's syntax and semantics._

"Idea" here means the computational or algorithmic thoughts these languages are
designed to express — the thoughts many learners must build _alongside_ the
language that represents them. That is the two-part entwined endeavor, and it is
why the endeavor has two parts.

Its counterpart at computation-scope:

> _A computation is a physical process taking place in the world. The algorithm,
> the notional machine, and the programming language are three representations
> of it — and the programming language is the only one of the three that also
> causes it._

**Both hold. They are the same triangle read at two levels** — the notional
machine is the shared corner, the programming language the shared third, and
what differs is the first: _idea_ (cognitive) or _algorithm_ (formal). Drawn in
[the-triangle.svg](./the-triangle.svg).

Three things the drawing fixes that prose lets slide. **The centre is a physical
process**, not an abstract invariant floating above its representations — the
corners represent something that is actually happening. **The notation corner is
the programming language, not "source code"** — text, blocks, and flowcharts are
all notations with causal influence, and privileging text would smuggle in a
claim the thesis does not make. And **the notional machine corner carries its
calibration**: it is not _the_ abstraction of the artifact but a chosen one.

### L5 — applied computation

**Applied computation** is using a programming language to understand, predict,
discuss and design _the world around you_.

Compare L4 word for word: same four verbs, different object. **Applied
computation is not a sibling of computational thinking — it is computational
thinking with the target system instantiated as the world.** The two
target-distances the curriculum is built on are one edge in this DAG, not an
analogy laid over it.

### L6 — intentional computation

**Intentional computation** is applying computation to modify the world toward
more desirable states.

It is the only node in the chain with values in it, and it should be marked as
such rather than presented as one more definition of the same kind.

## Why this cannot be taught abstractly

The claim, restated with the layers under it: meaning needs a **second system**,
legibility needs an **observer with instruments**, and the practice needs a
**notation**. Strip any one and computational thinking does not arise.

Which is also a curriculum specification, and the reason to believe the thesis
rather than merely accept it — each addition is already a commitment this course
has made:

| Addition                  | What supplies it                                    |
| ------------------------- | --------------------------------------------------- |
| a second system (meaning) | the domain: user-facing, text-manipulating programs |
| an observer (legibility)  | Study Lenses · `embody`                             |
| a notation                | Just Enough JavaScript                              |

The thesis is not a preamble to the curriculum. It is an account of why the
curriculum has the shape it already has.

## Why learn a programming language when AI can write code

Two answers that survive the chain, and one that does not.

**The one that does not**: "because you need some way to represent computational
thoughts." Under L3, a natural-language prompt to an agent has causal influence
over a computational artifact, so it _is_ a programming language by this
definition. `ontology.md` §11 already says as much in other words — describing
intent to an LLM is another way of operating the same control panel. You already
have one. The question answers itself in the wrong direction, and the honest
move is to bite that bullet rather than hide it.

**What a conventional programming language gives that a prompt does not**: a
determinate mapping, a stable notional machine, and consequences that are
checkable. The prompt's relation to the artifact runs through a substrate that
is non-deterministic and unobservable at L2. So the choice is not
notation-versus-no-notation; it is _legible notation versus illegible notation_,
which is an L2 question, not a nostalgia question.

**And the theory-building answer.** The product of programming is not the text;
it is the practitioner's theory of the system.

> Owed: Naur, "Programming as Theory Building" (1985). Present in-repo only as a
> third-party blog paraphrase at `to-integrate-and-cite.txt:9-32`. Naur's actual
> claim is stronger and less convenient than the paraphrase: the theory is not
> in the program text at all and does not survive the programmers. Applied
> honestly that cuts against delegation in Ch3 as much as it cuts for the
> course's premise. Fetch before using.
>
> Owed: the METR study on AI-assisted developer productivity. Also present only
> as blog paraphrase. It measures completion _time_ for experienced developers
> in familiar repositories — population and outcome both mismatched to a claim
> about novice learning. Flag or drop; do not lean on it.

## Related

- [meaning.md](./meaning.md) — the two senses of "meaningful"
- [observability.md](./observability.md) — L2 developed
- [computational-languages.md](./computational-languages.md) — L3 developed
- [epicycles.md](./epicycles.md) — L4 and L5 as a curriculum
