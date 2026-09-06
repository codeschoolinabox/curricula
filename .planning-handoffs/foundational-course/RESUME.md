# A foundational course — discussion record and starting points

> Written 2026-09-06 at the end of a long session. **Nothing has been built.**
> This is a discussion converted into starting points, so the thinking survives
> the session that produced it rather than being reconstructed from documents —
> which is the argument `computational-thinking/this-codebase.md` makes about
> why that reconstruction does not work.
>
> Sibling handoff: `.planning-handoffs/computational-thinking/RESUME.md` covers
> the document set this grew out of. Read it for the chain figure, the
> corrective column, and its own twelve open items.

## The idea

A short course taken **before** either Frogramming & Vibetoading or Welcome to
Algorithms, whose subject is **computational thoughts themselves** rather than a
language or a body of algorithms.

Its scope has a principled home already in the work: **it owns the position that
neither existing course does.** The chain in `computational-thinking/thesis.md`
runs artifact → notional machines → code | the computational thoughts |
pseudocode → formal notation → CS/theory. F&V lives left of the pivot; WtA lives
right of it. **The computational thoughts belong to neither, and their
check-cell reads "nothing directly."** The position with the least apparatus and
the most need has no course.

Two arguments for the split, and they should be kept apart so one does not
smuggle in the other:

1. **Pedagogical** — position 4 has no home.
2. **Scope pressure** — F&V "has ballooned into madness" (the human's words). If
   only this one holds, trimming F&V is cheaper than a third course with a third
   toolchain.

## The thesis, as it stood at the end of discussion

> **Code describes processes; mathematics describes relationships.**

Sharper: code commits you to an order of events and mutable state — it has a
**when**. Mathematics states what holds, timelessly.

**Refinement:** mathematics _does_ describe processes — differential equations,
dynamical systems, the lambda calculus — but represents them **as
relationships**. So the distinction is about what the notation _is_, not what it
is _about_. **This refinement has a name: denotational semantics, the
Scott–Strachey programme.** Use the name.

**Anchor:** `x = x + 1`. A contradiction as mathematics, routine as code. One
line, already the confusion every teacher has watched.

### The third thread

**Data**, alongside process and relationship. Three kinds of description: what
happens, what holds, **what things are** — the third having its own notations in
types, schemas, grammars, algebraic data types. A JSON schema is neither a
process nor a relationship; it is a shape.

"Thread" rather than "peer" is deliberate and matches `ontology.md` §8, where
data already runs _through_ the curriculum as its red thread rather than sitting
alongside things.

> **The human nearly wrote `data: relationships and processes` and did not, "for
> now."** Recorded verbatim because it is unresolved and the phrasing matters:
> it reads either as a definition (data _is_ the two) or as a label with two
> subordinates. Either way it is the peer-versus-medium question left open.

**The open risk on this thread:** data may be the _medium_ rather than a third
kind — processes operate on data, relationships hold between data. If so,
putting it on the same axis repeats a structural error this campaign has now
made twice (the artifact placed on an axis of representations _of_ the artifact;
idea and algorithm fused into one corner). The test: can you describe data in a
way that presupposes neither a process over it nor a relationship among it?
Probably yes — a schema does — but run the test before committing.

## Language: two live options

### Option B — the front-runner: expression-oriented and statement-oriented JS levels

Raised last, and it supersedes the functional/procedural framing below on three
counts.

**It is statically gateable.** "Functional" is a discipline a learner can cheat;
**expression-versus-statement is grammatical**, so a parser can enforce it. That
buys Racket's `#lang`-level enforcement without leaving JS, using AST tooling
the repo already has — and it removes the main advantage Lisp had.

**It is Backus's own vocabulary.** Not functional versus procedural: "The first
world comprises the right sides of assignment statements. This is an orderly
world of **expressions**… The second world of conventional programming languages
is the world of **statements**." The strongest objection's own terms.

**The grammar mirrors the thesis.** An expression _denotes a value_; a statement
_does something_. Denoting versus doing is relationship versus process at the
grammatical level. Functional/procedural only loosely tracks that while
importing purity, higher-order functions, laziness and monads — all irrelevant
here. It also sidesteps the paradigm argument, which `ontology.md` §13 already
defers to Ch4.

**The levels are additive, not parallel.** Every statement contains expressions,
so statement-oriented is a _superset_: begin with expressions only, then admit
statements and examine what is gained and lost. That is SICP's sequencing, it is
one language level extending another rather than two dialects forking, and
**"what did admitting statements cost me?" is a better question than "which do
you prefer?"**

**Shared foundation, then a fork on composition, then a merge.** The human's
structure, and it is better than a grammatical split:

- **Shared:** data types, operators, **bindings**. Both branches need all three.
- **Fork on composition** — how you build a bigger computation from those
  pieces. Functions, recursion and the ternary on one side; control flow,
  sequencing and mutation on the other.
- **Merge**, where the interesting ambiguities live: functions with side effects
  and no return, inline IIFEs. Constructable around, and worth constructing
  toward rather than avoiding.

**Answer to "can you do purely statement-based JS?" — no, and the asymmetry is
load-bearing.** Every statement contains expressions: `if (x > 1)` has one,
`x = x + 1;` has one on its right. Backus knew this; his orderly world _is_ "the
right sides of assignment statements." So **expression-only is possible and
statement-only is not.** Two consequences: the branches are not symmetric
siblings, and a clean grammatical fork cannot be drawn — which is exactly why
the fork belongs at composition. Note also that the shared foundation already
contains statements, since `const x = 5;` is one.

**The NM already emits the seam, and this is the strongest grounding
available.** `embody`'s notional machine distinguishes four binding events —
`category: 'binding'` events, declare → initialize → access → update [read:
`src/lib/embody/language-levels/just-enough-javascript/notional-machine.md:637`;
there is a dedicated section on postfix update event ordering at `:502`].

**The `update` event is where the process/relationship seam sits,
mechanically.** Declare, initialize and access are all compatible with a
timeless reading — the name denotes a value. Update is not: afterwards the same
name denotes something different, so _when_ you ask begins to matter. That is
SICP §3.1.3's referential-transparency claim expressed in the event vocabulary
this curriculum's own machine already emits, rather than imported from Scheme.

So the thesis is **readable in the event stream**, which means Study Lenses can
show it rather than assert it: trace a program with no update events against one
with them, and the difference in what can be reasoned about is visible. That is
the demonstration the course needs if it is to avoid the failure
`on-pseudocode.md` diagnoses — being about notation with nothing to check
against.

It also makes `const` versus `let` structural rather than stylistic: `const`
makes update events impossible, `let` admits them. JS supplies the marker for
free.

**The feasibility question to test first.** An expression-only JS has no way to
bind a name — `const` is a statement — so binding happens by application:
`((x) => f(x))(5)` rather than `const x = 5; f(x)`. That is either the best
available first lesson (binding _is_ function application; the substitution
model made visible, which is what Study Lenses could show) or unbearable arrow
noise for a beginner. **Test it on a real snippet before the design commits to
it.**

### Option B′, superseded but recorded: functional and procedural subsets

**JEJ-F (functional) and JEJ-P (procedural)** — one language, two constrained
subsets, taught as a contrast.

**Its decisive advantage is that it isolates the variable.** Same notional
machine, same physical process, two notations — so any difference in what a
learner can _think_ is attributable to the notation alone. That experiment
cannot be run across two languages, because too much varies at once.
`ontology.md` §13 already asserts that JS is multi-paradigm syntactically while
running one NM, and that "paradigm choices are partly about which event
vocabulary you want to think in." Two subsets **demonstrate** that instead of
asserting it.

**It answers Backus with his own structure.** His objection is that the
orderly/disorderly split lives inside a language on either side of the
assignment operator. JEJ-F is his "orderly world of expressions"; JEJ-P admits
statements and assignment. The strongest objection becomes the spine rather than
something to argue against.

**It resolves Bootstrap without dismissing it.** Bootstrap restricts to a
functional subset so `=` means what it means in algebra — JEJ-F _is_ that move.
JEJ-P then shows what changes when assignment arrives. Bootstrap's bridge and
the discontinuity, sequenced, which is more than either does alone.

**And the sequencing is SICP's, relocated to where the research says it is
missing.** JEJ-F teaches with the substitution model; JEJ-P forces the
environment model. That is §3.1.3's own pedagogical structure — but SICP does it
in chapter 3 of 5, after two chapters of Scheme, which is exactly the
positioning gap. Doing it first is the opportunity.

**Cost: one instrumentation stack**, not three. The Lisp/Python resourcing
objection disappears.

**Two risks.** A functional JS subset is a _discipline, not a language_ — you
can always cheat, where Racket's `#lang htdp/bsl` genuinely will not let you
mutate. The demonstration depends on the constraint holding, so **check whether
JEJ's existing subset is enforced by tooling or only documented**; JEJ-F
inherits that answer. And it makes the foundational course **JS-committed**,
which sits oddly with "precedes both" when WtA is Python — defensible, since the
contrast is between subsets rather than languages, but it should be a decision
rather than a side effect.

### Option A: Lisp, and what it would cost

The argument is stronger than "simpler syntax." **Lisp is the language where all
three threads are the same object seen three ways.** `(+ 1 2)` is a list (data),
a call (process), and a term denoting 3 (relationship). Homoiconicity is not a
convenience here; it is the subject matter made visible.

**`quote` is the second anchor.** `'(+ 1 2)` is data; `(+ 1 2)` is process. One
character toggles between two threads — the data/process equivalent of
`x = x + 1` for the process/relationship seam. Two one-line anchors, each on a
different edge of the triad, both runnable.

Racket specifically: the teaching languages (`#lang` levels) are already what
JEJ is trying to be, and DrRacket's stepper already exists — so less to build
than a new instrumentation stack from scratch.

**Proposed split:** Lisp/Racket for the foundational course, JavaScript for F&V
(users and devs), Python for WtA (convention, and the algorithms literature).

**The real cost is three instrumentation stacks.** Years of JS tooling exist;
Racket and Python lens work does not. Racket's is cheapest given the stepper.
Python's Counting lens is genuinely new. This is a resourcing decision, not a
pedagogical one, and it should be made as such.

One supporting note found in the research: the closest existing statement of the
thesis (SICP §3.1.3) was **already written in Lisp**, and the thing it explains
is the seam this course is about.

## What the research found

Two searches were run. Both reports are in this session's transcript; their
findings are condensed here. **Every source below is secondhand unless marked
otherwise** — this campaign has already been caught citing a source it had only
fetched a summary of.

### Does the course exist? — no

Most courses named for "computational thinking" are intro programming retitled
(UPenn/Coursera, AP CSP, BJC, MIT 18.S191 and 6.0002). Nothing found is
course-shaped, pre-CS1, and about the _notational_ difference.

Closest three, and why each falls short:

- **SICP §3.1.3, "The Costs of Introducing Assignment"** — closest on content.
  Abelson & Sussman: assignment "forces us to admit **time** into our
  computational models"; before it "all programs were timeless." That is the
  thesis in their words. Falls short on **position**: chapter 3 of 5, the payoff
  of two chapters of Scheme, aimed at motivating the environment model.
- **Denning & Tedre, _Computational Thinking_ (MIT Press 2019)** — closest on
  stance, the only well-known work that means thinking rather than coding. A
  book with no curriculum, and silent on notation. _(Agent could not access
  it.)_
- **Bootstrap:Algebra** — closest on audience, and **the live pedagogical
  rival.** It restricts to a functional subset _precisely so_ a variable means
  the same thing in code as in algebra, engineering the discontinuity out of
  view. This course would make that discontinuity the lesson. Same territory,
  opposite bet, and Bootstrap has transfer evidence (Schanzer, Fisler,
  Krishnamurthi & Felleisen, SIGCSE 2015). **This must be answered, not
  ignored.**

Also: **Sorva's notional-machines programme wants this content inside CS1, not
before it** — a direct challenge to the prerequisite-to-both positioning.

### Is the thesis original? — established in its parts

**The finding that inverts the premise, and the most important thing either
search returned:**

> **Kieran (1981), "Concepts associated with the equality symbol"**, with Behr,
> Erlwanger & Nichols (1980): students overwhelmingly hold an **operational**
> reading of `=` — "do something, write the answer" — **in mathematics**, with
> no programming involved. The relational reading is a hard-won instructional
> achievement.

The thesis assumed learners arrive with a relational `=` that programming
violates. The evidence says both domains fight the same operational default and
only mathematics eventually wins.

**This does not kill the anchor; it improves it.** The lesson is not _code
violates your maths intuition_ but **code matches your default, and mathematics
is the one demanding something harder.** That is truer to the evidence and makes
the mathematics side the strange one — a better opening for a course about
notation.

**The strongest objection: Backus (1978)**, "Can Programming Be Liberated from
the von Neumann Style?" _(the only source read verbatim by either agent.)_ His
"two worlds" passage draws the distinction more vividly than the thesis does —
the orderly algebraic world of expressions versus the disorderly world of
statements — and then locates it **inside one language, on either side of the
assignment operator**, as a _remediable defect of von Neumann languages_. He
shows programs can have an algebra in which one solves "equations whose unknowns
are programs." **The objection: the thesis would elevate an accident of language
design into a claim about the nature of notation.** Answer this first.

**Dijkstra, EWD1036** contradicts the pedagogy directly: "we should reason about
programs without even mentioning their possible 'behaviours'." The _when_ is a
novice's crutch the discipline should eliminate.

**Two corrections to claims made confidently during discussion:**

- **Program equivalence being observer-relative is definitional, not a
  finding.** Observational equivalence is _defined_ relative to a stipulated set
  of observables (Morris 1968; Plotkin 1977; Milner 1977), and full abstraction
  is the statement that this is a problem. The refactoring literature already
  migrated from "behaviour" to "_observable_ behaviour" for this reason (Mens &
  Tourwé 2004). Presenting it as an insight would be a visible error.
- **Mathematical equality is also theory-relative** — isomorphism versus
  equality; in homotopy type theory equality is structure. The asymmetry
  survives as _programs equivalent relative to an observer, mathematical objects
  relative to a theory_, but "not observer-relative" is too strong.

**Do not cite Knuth yet.** Both the 1974 and 1980 papers were inaccessible to
the agent. The widely-repeated claim that he contrasts algorithmic thinking's
"notion of state" with mathematical thinking is plausible and unverified.

### Must-read before any write-up

1. **Backus (1978), §§4–5 and §9** — supplies the best illustration and the best
   refutation. Freely available.
2. **SICP §3.1.3** (with §1.1.7 for the declarative/imperative framing).
3. **Kieran (1981)** — because it undercuts the psychological premise.

### Worth quarrying

**Iverson, "Notation as a Tool of Thought"** (Turing lecture) — the canonical,
explicitly Sapir-Whorf-inspired statement for programming notation; the
foundation for the linguistic mix-in. **diSessa, _Changing Minds_** —
computational literacy, the material/cognitive/social pillars. **Sorva
(TOCE 2013)** — machine-model vocabulary. **Sussman & Wisdom (MIT
AIM-2002-018)** — the thesis at _inverse polarity_: mathematical notation is "an
absolute mess" and programming is what forces precision. **Wirth, _Algorithms +
Data Structures = Programs_** — prior art for two of the three threads.

## Threads the discussion opened and did not close

- **The linguistic mix-in.** Fluidly discussing kinds of thought and the
  languages that express them — a higher-level objective, not a fully-developed
  one. Already committed to by the genus in
  `computational-thinking/computational-languages.md`. **The discipline that
  keeps it from becoming hand-wavy: only claim relativity you can demonstrate**
  — the same computation in two notations affording different questions. Shown,
  not asserted.
- **Refactoring as formal manipulation.** Programs can be transformed by rule,
  but equivalence is relative to a chosen notional machine, where mathematical
  equality is not observer-relative in the same way. BSI already has the
  vocabulary — behaviour preserved, implementation changed, and the chosen level
  fixes which is which. **Now known to be standard (see corrections above), so
  it is teachable material rather than a contribution.**
- **Whether the course precedes both or belongs inside CS1** — Sorva's position
  against the positioning.
- **Whether "F&V has ballooned" is solved by splitting or by trimming.**

## State of the sibling work

`spiralearn/frogramming-and-vibetoading/computational-thinking/` — 15 commits,
`8882352d` through `d9a5c4ce`, none pushed. Eleven authored Markdown files, two
figures. The chain figure was rebuilt three times in the final hour; its left
side now reads static → dynamic → physical with notional machines plural and a
language ladder beneath them. Its right side is marked **NOT YET LAYERED**, and
`welcome-to-algorithms/` is named as where that layering should come from —
which is a natural first unit for whoever picks this up.

**This is a shared worktree.** Roughly fifty commits from a concurrent session
(the klve instrumentation port) sit above this campaign's. Commit by pathspec;
never `commit -a`.

**Uncommitted and not mine:** `computational-thinking/this-codebase.md` carries
a two-line addition by the human about agentic developers one-shotting during
prototyping. Pending their disposition.

## How this session failed, since it bears on reading the above

Five scope-widenings, each caught by the human: a pedagogy ruling hardened into
an ontological one; "algorithm" substituted where "idea" was said; a reviewer's
interventionism written into a condition in the author's voice; V placed on an
axis the documents declare is F's only; and a note scoped to _prototyping_ read
as a claim about _maintaining a codebase_. The wording rule does not cover the
last two — **the wording was kept and the range it applied to was inflated.**

Read every attribution in this file with that in mind. Where it says the human
said something, check the transcript.
