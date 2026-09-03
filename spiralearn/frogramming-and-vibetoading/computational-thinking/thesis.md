# The thesis

> Author-facing design memo. Part of the `computational-thinking/` set; start at
> [README.md](./README.md). Supersedes `plann.txt`, which is kept as provenance.

## The claim

> **Modelling, legibility, and notation are three separate additions to bare
> computation. Computational thinking requires all three — which is why it
> cannot be taught abstracted from a medium.**

Everything below is the chain that establishes it, and the reason the claim is
not merely true but _useful_: each of the three additions names a piece of
infrastructure a curriculum has to actually supply. A course that skips one is
not teaching computational thinking, whatever it calls itself.

Meaningful computation is not one of the three additions. It is what the whole
thing is _for_, and it sits at the far end of the chain — an artifact that
participates in a situation and is taken some way by someone.

## The chain, as a layered DAG

It is not a chain. Two nodes have more than one parent, so what follows is a DAG
presented in layers, where **each layer adds exactly one new ingredient**.

| Layer | Adds                                        | Nodes                                                                        |
| ----- | ------------------------------------------- | ---------------------------------------------------------------------------- |
| L0    | states that change                          | computational artifact · computation                                         |
| L1    | a second system → _semantics_               | modelling computation                                                        |
| L2    | an observer with instruments → _epistemics_ | legible computation                                                          |
| L3    | symbols → _representation_                  | computational language · programming language · algorithm · notional machine |
| L4    | a practitioner → _practice_                 | computational thinking · the NM-twin                                         |
| L5    | the world as target                         | applied computation                                                          |
| L6    | a situation and an audience                 | meaningful computation                                                       |

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

### L1 — modelling computation

Computation is **modelling** when there is a second system — the **target** —
such that:

**(a) Correspondence.** The artifact's internal states can be mapped from _and_
to the target's states. Both directions; a one-way map is a coincidence.

**(b) Inference.** Information about the target can be inferred from the
artifact's _intermediary_ states — not only its final output. This is what makes
a running program informative rather than merely correct.

**(c) Predictive usefulness.** The artifact predicts the target's states
accurately enough to be useful, in some context. Not accurately full stop, and
not in every context — usefully, here, for this.

Condition (c) is deliberately pragmatic and deliberately graded. Models are
simplifications; they foreground some features of a phenomenon and approximate
or ignore the rest. What we are asking of one is not truth but usefulness, in
the sense Box gave the phrase: **all models are wrong, some are useful.** A
model earns its keep by what it lets you predict and explain, and it earns it in
a context rather than in general.

> "By definition, models are simplifications of reality that foreground certain
> features of a phenomenon while approximating or ignoring others. As such, 'all
> models are wrong, but some are useful' (Box and Draper 1987, p. 424). The
> _usefulness_ of a model comes from its explanatory and/or predictive power." —
> Weintrop et al., journal p.137.

That is also what answers the triviality objection, and the answer is worth
following because a weaker version of (c) fails in an instructive way.

Putnam argued — and Searle made the same point with a joke about a wall running
WordStar — that you can find _some_ mapping between any physical system with
enough going on in it and any program you like. Take a rock over ten seconds.
Slice its history into as many states as the program has steps, pair them up in
order, and the rock "implements" the program. If that is all it takes, then
everything models everything and the word has no work left to do.

The tempting repair is to require the mapping to be **observable** — you have to
be able to see it. That fails. Requiring observability removes none of Putnam's
mappings; it only filters which ones we happen to notice, which makes modelling
depend on who is looking, and that is Searle's conclusion rather than an answer
to it.

Requiring **predictive usefulness** does remove them. Putnam's mappings are
fitted to one run that actually happened. Ask what the rock would do on an input
it never received and there is no answer — nothing was ever predicted, only
recorded and read backwards. A thermostat has an answer. That is the difference,
and it is a difference in what the model is good for rather than in who is
watching it.

Observability is real and matters enormously here. It is a different question,
and it lives at L2.

> Owed: Putnam, _Representation and Reality_ (1988), the appendix; Searle, _The
> Rediscovery of the Mind_ (1992). Neither fetched. Do not cite without reading.
> Box and Draper (1987) is reached here through Weintrop, which is in this
> directory; the primary is not.

**The target is an input, not something the chain produces.** It comes from
outside. This matters more than it looks: the same node with the target
instantiated differently is what L5 turns out to be.

### L2 — legible computation

Modelling computation is **legible** when the correspondence is observable and
manipulable _with the instruments at hand_.

This is a claim about **access**, not about existence. A computation does not
start modelling something when someone builds a tool for it. It becomes
_teachable_.

Legibility is three-place — artifact, target, observer — where modelling is
two-place. That is why it cannot be a fourth bullet on L1's list; it is a
different node with a different arity.

Two things follow, developed in [observability.md](./observability.md): it is
the criterion that decides what a course can actually work at, and it
deliberately leaves room for cases where observation is itself the difficulty.

### L3 — computational language, programming language, algorithm, notional machine

A **computational language** is a symbolic representation of modelling
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
designing modelling computation **by way of a notional machine**.

The earlier wording was "by way of a computational language." The notional
machine is one — L3 defines it as the computational language whose target is the
artifact — so this narrows rather than replaces. The narrowing is what makes the
node do work.

Generalised, it is _by way of a model of the target_. The notional machine is
that model when the target is the artifact; in Welcome to Algorithms the model
is the algorithm; run the lens on a person and the model is a model of the user.
Without the general form, computational thinking would collapse onto F, since
the notional machine is F's twin. It does not collapse: what is fixed is that
you think through a model, not which model. This is what `ontology.md` §5's
abstraction-transition taxonomy already encodes by giving each chain-point its
own _-speak_.

All four verbs are observer-verbs. So computational thinking depends on
**legibility**, not merely on modelling — which is the precise location of the
course's infrastructure bet. Study Lenses does not make a computation model
anything. It makes the modelling legible, and legibility is what the practice
requires.

**A programming language is one way to operate the notional machine, not the
only one.** This is where the LLM question stops being awkward. You can hold a
computational thought, express it in the machine's terms, and hand the writing
of the instructions to someone — or something — else. What you cannot hand over
is the machine itself.

The curriculum already says this in several places, and the thesis was the thing
out of step. `ontology.md:1233-1235`: "Source code is the **control panel**
through which a programmer operates the NM. Authoring code is one way to operate
that panel. Describing intent to an LLM is another. Either way, the NM is the
thing the panel controls." And `:177-181`: "Twinning the NM can happen without
touching code… When an LLM authors the code, F's cognitive work remains:
predicting and reading the machine's behavior."

Read that way, `ontology.md:1257` — "Frogramming with delegation is only
sustainable if you keep the direct NM view alive" — stops being advice and
becomes a consequence of what computational thinking is.

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

### L6 — meaningful computation

**Meaningful computation** is computation that participates in a situation and
is taken some way by someone. The artifact stops standing outside the system it
models and becomes part of it: a person uses the app, the app changes what the
person does, and the thing the program was modelling now includes the program.

This is a different relation from everything below it. Correspondence, inference
and predictive usefulness all have the artifact standing apart from its target
and tracking it. Participation folds the artifact in. That is why `ontology.md`
§2 puts the software _inside_ the rhetorical circle rather than outside looking
at it, and it is the strange-loop shape §14's MU tribute is built around.

Naur describes the mechanism, in 1985, without naming it:

> "It is invariably the case that a program, once in operation, will be felt to
> be only part of the answer to the problems at hand. Also the very use of the
> program itself will inspire ideas for further useful services that the program
> ought to provide. Hence the need for ways to handle modifications." —
> [programming-as-theory-building.md](./programming-as-theory-building.md)

Two claims there, and each lands on a node this chain already has. _Only part of
the answer to the problems at hand_ is a model found wanting once it meets its
target — condition (c) experienced from the inside rather than argued about. And
_the very use of the program will inspire ideas for further useful services_ is
participation: the artifact enters a situation and changes what is wanted there.

Note what Naur does with it. He uses it to establish that modification is
inevitable, which is why holding the theory matters, which is why the theory
cannot be recovered from the program text. Participation is not a decorative
observation at the top of the chain — it is the reason the rest of the chain has
to be held by a person.

The node was called _intentional computation_ in earlier drafts, and the rename
is not a loss. Grice's non-natural meaning is defined by intention — an
intention that the audience recognise the intention as such — and
`ontology.md`'s conceit "bears the connotation of intention on behalf of the
rhetor." Intention and rhetorical meaning were always one node seen from two
sides: the rhetor's, and the audience's. One name is more honest than two.

What the rename does drop is the normative direction the old wording carried —
"toward more _desirable_ states." That is deliberate. Meaning-nn requires
intention, not good intention, and a definitional chain is a poor place to
smuggle in an ought. The values work belongs with the accountability material
that already exists for it: `ontology.md` §2.1's three senses of access and its
two kinds of harm, and lens 7's systemic impacts. Naming it there rather than
here also keeps it where a learner can be shown it rather than told it.

> Owed: Grice, "Meaning" (1957). Not fetched.

## Why this cannot be taught abstractly

The claim, restated with the layers under it: modelling needs a **second
system**, legibility needs an **observer with instruments**, and the practice
needs a **notional machine** to think through. Strip any one and computational
thinking does not arise.

Which is also a curriculum specification, and the reason to believe the thesis
rather than merely accept it — each addition is already a commitment this course
has made:

| Addition                    | What supplies it                                    |
| --------------------------- | --------------------------------------------------- |
| a second system (modelling) | the domain: user-facing, text-manipulating programs |
| an observer (legibility)    | Study Lenses · `embody`                             |
| a machine to think through  | JEJ's notional machine, operated through JEJ        |

The thesis is not a preamble to the curriculum. It is an account of why the
curriculum has the shape it already has.

## Why learn a programming language when AI can write code

The question dissolves once L4 is stated properly, because it was always aimed
at the wrong node.

Asked as "why learn the notation when a machine can write it," the honest answer
is that you may well not need to write much of it. A prompt to an agent has
causal influence over a computational artifact, so by L3's definition it is a
programming language too. Arguing that you must type the other kind would be
defending a habit, not a claim.

What the question misses is that notation was never the thing computational
thinking is done by way of. **The notional machine is.** You can hold a
computational thought, express it in the machine's terms, and delegate the
writing. You cannot delegate having the thought, and you cannot delegate holding
the machine — and if you try, you lose the ability to tell whether what came
back does what you asked.

So the real difference between a programming language and a prompt is not
authorship but **legibility**, which is an L2 question. A conventional language
gives a determinate mapping to a stable notional machine, and consequences you
can check. A prompt's relation to the artifact runs through a substrate that is
non-deterministic and, at L2, unobservable. The choice is between legible and
illegible notation, not between notation and none.

**And the theory-building answer**, which is the strongest of the three and the
least convenient.

Naur argues that what programming produces is not the text but a _theory_ in
Ryle's sense — someone with the theory "knows how to do certain things and in
addition can support the actual doing with explanations, justifications."

His subject is L1. He says so in his opening definition: programming is "the
activity of matching some significant part and aspect of an activity in the real
world to the formal symbol manipulation that can be done by a program running on
a computer." And the first capability he lists is condition (a), in both
directions: the programmer must explain "for each part of the program text …
what aspect or activity of the world is matched by it. Conversely, for any
aspect or activity of the world the programmer is able to state its manner of
mapping into the program text."

He also states the human half of condition (c). Every model leaves things out,
and Naur is explicit about who decides what: "the decision that a part of the
world is relevant can only be made by someone who understands the whole world.
This understanding must be contributed by the programmer." Box tells us all
models are wrong; Naur tells us that choosing what a model is wrong _about_ is a
judgement someone has to make.

Naur's theory is the modelling relation, held in a person's head.

His sharp claims are about documentation, not about AI. "The full program text
and additional documentation is insufficient in conveying to even the highly
motivated group B the deeper insight into the design"; "program revival, that is
reestablishing the theory of a program merely from the documentation, is
strictly impossible"; and theory passes to a new programmer only where they
"work in close contact with the programmers who already possess the theory."

The sharpest part of his argument is about **rules**, and it is more useful here
than the documentation claim. Ryle's theory is defined against rule-following,
by a regress: "if the exercise of intelligence depended on following rules there
would have to be rules about how to follow rules, and about how to follow the
rules about following rules, etc. in an infinite regress, which is absurd." What
the theory actually rests on is a judgement of similarity between situations in
the world — and that judgement, Naur says, "could not, in principle, be
expressed in terms of rules … no more than the similarities of many other kinds
of objects, such as human faces, tunes, or tastes of wine."

**Be careful how far this is pushed.** Naur nowhere says that delegating
code-writing prevents theory-building — he was writing in 1985 about handovers
between teams, and the word "computer" appears in his text as the thing a
program runs on, never as a collaborator. Extending him to AI is an extension
and should be labelled as one. What transfers is the shape: if the theory cannot
be recovered from the artifact, then having the artifact produced for you does
not give you the theory, and an LLM is not someone you can work "in close
contact with" in the sense his education passage requires. That is a claim worth
making. It is not a claim Naur made.

**And one part of Naur is awkward for this curriculum, which is a reason to
quote it rather than skip it.** He concludes that "for the primary activity of
the programming there can be no right method," and dismisses programming methods
as systems of rules. A course is a method-shaped object. What survives is his
own answer to the same problem: the education "would have to turn in the
direction of furthering the understanding and talent for theory formation," and
"the most hopeful approach would be to have the student work on concrete
problems under guidance, in an active and constructive environment." He then
adds, honestly, that "to what extent this can be taught at all must remain an
open question." A curriculum that cites him should carry that sentence too.

### Why programming is domain-tied

That expert programmers behave like novices in an unfamiliar domain is an
**experimental finding**, established by computing-education researchers who ran
studies. Naur wrote an essay. He does not establish the finding and must not be
cited as though he had; what he offers is a **mechanism** that would explain it,
and the mechanism falls out of this chain rather than being bolted on.

Keeping those apart matters more than it might seem. An essay that proposes a
mechanism and a study that measures an effect are different kinds of claim, and
a curriculum that blurs them is teaching the wrong thing about evidence while
saying the right thing about programming. What you can build is bounded by the
computational thoughts you can have; which thoughts you can have is bounded by
the systems you can twin accurately enough to describe in a language that
embodies the thought causally, in a physical medium. Move a programmer to a new
domain and the notation is unchanged — what they have lost is the twin, and with
it the thoughts. Naur's first capability is exactly this one: the programmer
with the theory "can explain how the solution relates to the affairs of the
world that it helps to handle." A theory that is _about_ a world does not travel
to a different world.

So domain-specificity is not a separate empirical curiosity sitting beside the
thesis. It is what the thesis predicts. And it is the sharpest available
argument that fluency in a language is not the thing being taught:

> I may know English as well as a comedian, but I'm not funny.
>
> — the author

Naur, "Programming as Theory Building" (1985), is in this directory at
[programming-as-theory-building.md](./programming-as-theory-building.md), read
in full; every quotation above is from Naur's own text, lines 14–598 of that
file. It is a Markdown transcription and has not been checked against the
primary publication.

**Attribution hazard in that file.** Everything after line 599 — the section
"Applying 'Theory Building'", on Kent Beck and the XP metaphor — is **not
Naur**. It is unattributed in the transcription. It is interesting and relevant
to `metaphor.md`, but nothing from it may be quoted under Naur's name.

> Owed: Ryle, _The Concept of Mind_ (1949), which Naur relies on. Not fetched.
>
> **Owed, and load-bearing: the CER experiments on the expert-in-a-new-domain
> transfer gap.** These are the studies that actually establish the finding;
> Naur only explains it. Named nowhere in this set yet. Until they are cited,
> the domain-tiedness claim rests on an essay and an analogy, which is not
> enough for a curriculum that asks learners to tell mechanism from evidence.
>
> Owed: the METR study on AI-assisted developer productivity. Present only as
> blog paraphrase at `to-integrate-and-cite.txt`. It measures completion _time_
> for experienced developers in familiar repositories — population and outcome
> both mismatched to a claim about novice learning. Flag or drop; do not lean on
> it.

## Related

- [meaning.md](./meaning.md) — the two senses of "meaningful"
- [observability.md](./observability.md) — L2 developed
- [computational-languages.md](./computational-languages.md) — L3 developed
- [epicycles.md](./epicycles.md) — L4 and L5 as a curriculum
