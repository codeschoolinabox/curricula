# The computational-thinking course — resume point

> Written 2026-09-06. **One campaign, two halves**: a theory directory that is
> largely built, and a course design that is entirely undesigned. They were
> handled as separate threads during the session and are merged here on the
> human's instruction, because the theory _is_ the course's theory.
>
> This is deliberately **not a state dump**. The documents are readable; start
> at their `README.md` and the reading order orients you in under an hour.
> Re-narrating them here would be waste. What follows is the part you cannot
> reconstruct — where the previous session suspects it was wrong, plus the state
> that is genuinely state.

## The course

A short course whose subject is **computational thoughts themselves** rather
than a language or a body of algorithms, taken **before** both Frogramming &
Vibetoading and Welcome to Algorithms.

Its scope has a principled home already in the built work: **it owns the
position neither existing course does.** The chain in
`computational-thinking/thesis.md` runs artifact → notional machines → code |
the computational thoughts | pseudocode → formal notation → CS/theory. F&V lives
left of the pivot; WtA lives right of it. **The computational thoughts belong to
neither, and their check-cell reads "nothing directly."** The position with the
least apparatus and the most need has no course.

Two arguments for the split, kept apart so one does not smuggle in the other:

1. **Pedagogical** — position 4 has no home.
2. **Scope pressure** — F&V "has ballooned into madness" (the human's words). If
   only this one holds, trimming F&V is cheaper than a third course with a third
   toolchain.

> **A location question this merge exposes.** The theory directory currently
> sits at `spiralearn/frogramming-and-vibetoading/computational-thinking/` —
> _inside_ F&V. If it is becoming its own course, that path is wrong. Nothing
> has been moved; flagging it before anything else accretes there.

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

---

# The built half — the theory directory

## Operating frame

- **Goal.** Two halves. The **theory directory** stands on its own as an
  argument about what computational thinking is, and does that now. The
  **course** built on it is entirely undesigned — discussion only, nothing
  written. **The campaign is at a human gate, not mid-flight**; nothing is
  half-done in either half. Redrafting the F&V course around it is a separate,
  later campaign that has not been authorised.
- **Ceremony.** Documentation commits take the full AR cycle in this repo. The
  five doc commits below predate that being applied to this directory; if you
  extend the set, run it.
- **Commit settings line.**
  `work: curriculum authoring · twin-doc: none · prospective` (or
  `retrospective` when correcting committed work). Governance edits use
  `work: governance`.
- **Network fetch is available** — `WebFetch` works, and Naur was fetched with
  it. Note the standing rule below about what a fetch is not.
- **Scope boundary.** No F&V curriculum file has been touched, and the course
  half has produced no files at all. The campaign's commits reach **three**
  places: everything under `computational-thinking/`, `DEV.md` once for the
  governance change `6c34c970`, and this handoff [measured 2026-09-03: `git log
  --name-only 8882352d~1..HEAD --pretty=format: | sort -u`]. **Use `HEAD`, not a
  pinned SHA** — an earlier revision published a range ending at `8f20eb34`,
  which predates this file's creation, so the command structurally could not
  surface the third place and "confirmed" a false claim. `tie-ins.md` is a table
  of **findings** about F&V, not a work order — do not act on its rows.

## Decision rights

The validator found four of nine items below blocked on this, so it is stated
explicitly.

**You may settle in-session:** items 2, 5, 6, 7, 8, and drafting the C4
half-beat. These extend or verify the argument without altering a ruling.

**These produce a proposal for the human, not a decision:** items 1, 3, 4 and 9.
Each touches something already ruled, or a curriculum-identity choice.
`DOCS.md`-class artifacts and the ruling list are the human's.

**Governance surface** — `DEV.md`, `AGENTS*.md`, `CLAUDE.md`, `.claude/**` — is
never edited without explicit human instruction in the conversation.

## State

Twelve commits on `main`, none pushed (`main` has no upstream, so "unpushed" is
consistent with the tree rather than directly verifiable).

| SHA        | What                                                           | Rulings it records                                                                          |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `8882352d` | the document set established                                   | condition-3 split; F's far target; V-as-CT is pedagogy not ontology                         |
| `99bfcce1` | L1/L6 rename, condition (c), CT by way of a notional machine   | modelling/meaningful; predictive usefulness; Ch1 half-beats F-only; **essay-vs-experiment** |
| `3504af6a` | Naur read in full                                              | the attribution hazard — lines 601+ of the transcription are not Naur                       |
| `9b161cda` | Naur's decay mechanism                                         | decay is not a context-size problem                                                         |
| `596554bc` | `this-codebase.md`                                             | Naur's remedies invert for an LLM collaborator                                              |
| `6c34c970` | **governance** — twin-doc conformance check in AR-4            | conformance not judgement; FLAG don't decide; states its own limit                          |
| `8f20eb34` | two decayed greps and one stale governance claim fixed         | never publish a count whose subject includes the document stating it                        |
| `712edf2a` | this handoff, after a context-free audit                       | decision rights; the operating frame                                                        |
| `31e830b6` | `on-pseudocode.md`, `the-stack.svg`, the causal-edge fix       | the stack's floor is where medium-independence fails                                        |
| `970100ce` | **the chain replaces the triangle**                            | the chain is the axis; correctives split at the pivot; F's axis only                        |
| `4e3857e1` | the triangle deleted; this file's inventory corrected          | —                                                                                           |
| `e1cf6177` | the handoff updated for the chain; tie-ins' work-order grammar | do not widen a scope the human scoped                                                       |

Eleven authored Markdown files plus two figures — `the-chain.svg` and
`the-stack.svg` — and the Naur transcription. `markdownlint` returns 0 across
the authored set; all six remaining errors in the directory are in
`programming-as-theory-building.md`, a verbatim source transcription left
unreformatted on purpose [measured 2026-09-03]. All relative links resolve.

**Not mine:** `this-codebase.md` carries an **uncommitted two-line addition by
the human** — a note that some agentic developers suggest one-shotting rather
than debugging when prototyping. It is pending their disposition; do not commit
it and do not sweep it into a `commit -a`. The tracked provenance — `plann.txt`,
`from-a-job-application/`, the Weintrop PDF — is in scope but historical;
`README.md` § Provenance says how each is treated.

**A previous revision of this file told a successor to leave `on-pseudocode.md`
alone as an untracked 0-byte file. That was false and dangerous**: it is
tracked, ~13 KB, created in `31e830b6`, rewritten in `970100ce`, and is one of
the three homes of the corrective column that item 10 targets. The line was
written while the file really was empty and never updated. Treat any "leave
alone" claim in a handoff as decayed until re-checked.

## The largest change since this file was first written

`970100ce` **replaced the triangle figure with a chain**, and it is not a
re-draw. The triangle's apex fused two positions — "the idea (cognitive)" and
"the algorithm (formal)" — because it had no room for pseudocode, which sits
between them. Retired, then deleted in `4e3857e1`.

F's axis is now seven positions ordered by **causal contact with matter**: the
artifact, the notional machine, code, the computational thoughts, pseudocode,
formal notation, CS / theory. **Position 4 is the pivot** — machine-facing to
its left, not to its right. The **corrective column** is the payload: machines
disagree with you on the left, proofs on the right, so pseudocode is the one
position with no external corrective while wearing the costume of one.

Two constraints on it, both human rulings. It is **F's axis** — computing's
empirical and design work lives on V's side and in the F&V integration, and V
enters perpendicular at the pivot. And it is **linear on purpose**: it wraps,
since code can be studied formally and theory applied to physical computation,
and those are purpose-inversions handled in `ontology.md` §9's already-ratified
register — a coupling, not a precedence, absent from learner-facing copy.

The corrective column now appears in three places — `thesis.md`,
`on-pseudocode.md` and `the-chain.svg`. **It is the argument, so a drifted cell
is a wrong document in three places.** Verify all three together or not at all.

## Where I suspect I am wrong

1. **The L6 node may be two nodes.** `meaningful computation` bundles
   _participation_ (the artifact becomes part of the system it models) with
   _audience uptake_. Grice's meaning-nn covers only the second. Defined in
   `thesis.md` § L6, restated in `meaning.md` and `README.md` § The claim —
   check all three. **Proposal only**: L6's name is a ruling.
2. **"By way of a model of the target" may only assert what it claims.**
   `thesis.md` § L4 says this generalisation stops computational thinking
   collapsing onto F. Test it against V: what is the model when the target is a
   person, and does the rest of the chain still apply? `tie-ins.md`'s
   `ontology.md:936-946` row is the material to test with. **Settle
   in-session.**
3. **"Modelling computation" is untested against a learner.** It replaced
   "meaningful" partly because that read as praise; "modelling" may read as
   jargon, which is a different failure, not a fixed one. **No LLM session can
   run this** — it needs a human who is learning. Flag it to the human rather
   than attempting a proxy.
4. **`domain.md` owes an answer to _which community_.** Weintrop's disciplines
   are communities whose real problems supply the assignments. "User-facing,
   text-manipulating, rhetorically-situated programs" names a stack and an
   audience posture. **Proposal only** — this is curriculum identity, and
   inventing a community would violate the wording rule below.
5. **The CER experiments are uncited and load-bearing.** That experts perform
   like novices in an unfamiliar domain is _experimental_; Naur wrote an essay
   offering a mechanism. The whole learning-to-program → programming-to-learn
   architecture leans on the finding. No candidate papers are named anywhere —
   finding them is the task. **Settle in-session**, fetch first.
6. **Type versus token is unresolved.** `thesis.md` § L3's blockquote. A
   programming language is a type; an algorithm is closer to a token. **Settle
   in-session** and record it as a ruling.
7. **Every `Owed:` marker is a live fabrication risk.** Putnam, Searle,
   Piccinini, Grice, Ryle, diSessa, Wing, Papert, du Boulay, Sorva, Stefik &
   Siebert, METR — plus **Wilensky**, **Sweller** and **van Merriënboer**, which
   an earlier revision of this list omitted. None fetched. The list is not the
   roster: `grep -n 'Owed:' *.md` is. Naur and Weintrop are the only sources
   read. **Rule, not a unit:** do not cite an `Owed:` source without fetching
   it.
8. **The seam-drift prediction has no instrument.** `this-codebase.md` stakes
   that this repo's leaves are in better shape than its cross-module contracts.
   As written that is a wish, not an audit item — it does not say what counts as
   a seam versus a leaf, what is measured (bug-fix commit density? revert count?
   AR blocker origin?), or what would falsify it. **Building the instrument is
   the unit**; running it is downstream.
9. **Whether the DAG should branch.** One path out of modelling computation adds
   an observer and a notation and reaches computational thinking; the other adds
   an audience and reaches meaningful computation. The second may need neither
   legibility nor notation, in which case the two hats fall out of the DAG
   structurally. Raised, never worked. **Proposal only.**

10. **The corrective column's cells are asserted, not derived.** "Physics"
    corrects the artifact; "proof" corrects formal notation; the interpreter
    corrects code. Each is plausible and none was argued. The column is the
    whole argument of `on-pseudocode.md`, so a wrong cell is a wrong document in
    three files. **Settle in-session** — but check every cell, not the
    interesting ones.
11. **Position 7's type-shift may want more than a note.** Positions 1–6 are
    things and representations; CS / theory is a discipline whose objects are
    the other positions. The figure marks it by drawing it apart. Whether that
    is enough, or whether it belongs on a different axis entirely, is unworked.
    **Proposal only.**
12. **The wrap-arounds are footnoted, not worked.** Code studied formally,
    theory applied to physical computation. They are labelled purpose-inversions
    and deferred to half-beats and L4. If the ring turns out to be load-bearing
    rather than decorative, the linear presentation is a simplification the
    documents do not admit to. **Proposal only.**

**Item 9 is partly answered.** "Whether the DAG should branch onto V and F" now
has a partial answer in the chain: V enters perpendicular at position 4 rather
than branching from modelling computation. Whether that settles it or just
relocates it is open.

**Three further gaps named in `README.md` § Known gaps that are not above** —
the spiderweb-topology placement of computational thinking, whether target
systems are localisable by partner communities under the Reusability Paradox,
and the undrafted C4 half-beat. This list is not a superset of that one; read
both.

---

## Standing rules this session kept breaking

- **Keep the human's wording where they have stated something from context and
  experience.** Violated three times — a pedagogy ruling hardened into an
  ontological one, "algorithm" substituted for "idea", a reviewer's
  interventionism written into condition (c) in the author's voice. The pattern
  was named in writing after the second, and then happened again. Assume you
  will do it too.
- **Do not widen the scope of something the human scoped.** Distinct from the
  wording rule above and not covered by it: the wording was kept and the _range
  it applied to_ was inflated. Caught when a note about one-shotting during
  **prototyping** was read as a tension with a ruling about **maintaining a
  codebase that already has a theory**. Fourth instance of the same family in
  one session. When a statement arrives with a context attached, the context is
  part of the claim.
- **Run the string you publish.** Two published greps had decayed by the time
  the directory was finished; both were in committed prose and neither was
  caught by the author. `grep` here is ugrep. **A count whose subject includes
  the document stating it will decay — do not publish one.**
- **A summarised fetch is not a read.** Naur was cited across a commit on the
  strength of a targeted `WebFetch`. Reading the essay surfaced his opening
  definition — the closest line in the paper to the claim being made — and an
  attribution hazard.
- **`programming-as-theory-building.md` lines 601+ are not Naur.** Line 599 is
  still the tail of Naur's own Ryle bibliography entry with the next section's
  title run onto it; 601 onward is another, unattributed author. Nothing there
  may be quoted under his name.

## Suggested next unit

**Draft the C4 half-beat — but read the method note first, because the obvious
way to do it destroys the thing it is for.**

It is named as owed in `half-beat.md` § "Still owed" and in `README.md` § "How
to check this directory", where it is the directory's declared falsification
instrument: hand `epicycles.md` and `half-beat.md` **to a reader who has never
seen F&V** and ask them to draft it — "if they cannot, the set does not hold,
however well the thesis reads."

**The trap.** This file tells you to read the directory first. Do that and you
are no longer a naive reader, so a C4 draft you produce is _authoring_, not
falsification, and a green result proves nothing. Running the unit the obvious
way **consumes the only self-check the directory has**, and it cannot be re-run.

**So: spawn a context-free subagent given only `epicycles.md` and
`half-beat.md`** — nothing else, no repo tour — and have it attempt the C4
draft. That is the check. Your own draft, afterwards, is the content.

(An earlier revision suggested the fan-out/twin-doc question. That is
governance-adjacent, so its only possible output is a proposal, and `6c34c970`
already landed the review-side half of it.)

### Sequence

1. **Migrate** `computational-thinking/` into
   `spiralearn/data-shapes-processes-relationships/` under a loss ledger, and
   clear it out of F&V. Verbatim transport; re-check links and F&V citations.
2. Then the two units below.
3. Then design.

### And on the course half, before any design

Two units, both cheap, both blocking:

1. **Read the three must-reads.** Backus §§4–5 and 9, SICP §3.1.3, Kieran 1981.
   Only Backus was read verbatim; the rest came through a summariser. Writing
   before reading them repeats this session's Naur mistake, which is recorded in
   § Standing rules for exactly that reason.
2. **Test expression-only binding on a real snippet.** Whether
   `((x) => f(x))(5)` reads as the substitution model made visible or as
   unbearable arrow noise decides the front-runner language design, and one
   snippet settles it.

Neither needs the theory. Both are the kind of bounded work this handoff exists
to hand over.
