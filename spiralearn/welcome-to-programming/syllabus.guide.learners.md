# Welcome to Frogramming — A Manifesto for Learners

> Addressed to **you** — the person doing the learning. The _why_ of this
> course, from the inside.
>
> Companions (siblings, by co-location):
>
> - `syllabus.ontology.md` — the _what_ (reference framework)
> - `syllabus.chapters.md` — the _how_ at chapter grain
> - `syllabus.guide.authors.md` — the _why_ for the people who teach with it
>   or adapt it
> - `syllabus.guide.community.md` — the _why_ for partner communities,
>   mentors, cohort hosts
>
> **Status**: end-state document. Content is open to iteration — the anchors
> emerge through drafting and learner feedback.
>
> **Note**: the H1 heading still reads "A Manifesto for..." by design.
> Filename renamed (`manifesto.{role}.md` → `guide.{role}.md`) in Wave 2
> of the syllabus corpus restructure; title and prose register migrate
> to "guide" form in Wave 3, when vision-flavored content moves into
> `syllabus.manifesto.md` and this file gains its practical-guidance
> register.

---

## You arrived here with a why

Maybe a friend showed you something they were building and you wanted to make
something too. Maybe your work is changing and you want to stay in the room.
Maybe you're already a designer or a maker or a teacher and you want a deeper
relationship with the machines you use. Maybe you just love how computers feel
when they finally do what you meant.

Whichever it is, you brought it in with you. **That why is the most important
thing in this room.** This course is built to honor it — to give it the tools,
the depth, and the confidence to carry you wherever you mean to go.

This is the operating principle of every page that follows. **You are not the
recipient of this material. You are the practitioner of it.**

---

## What this course is for

There is a question that programming learners have been asking, with increasing
weight, since 2022: _Why learn to code when AI can write code?_

The honest answer is short:

> Designing computation is not the same work as writing the notation for it.
> Both matter. The design work — _understanding what you want the machine to do,
> and being able to evaluate whether it did it_ — cannot be delegated. The
> notation work can be. This course teaches the part that doesn't delegate.

That work is yours. It has always been yours. It will always be yours. That is
what makes it worth doing.

A longer answer follows in the chapters.

---

## Two principles run beneath everything you're about to do

> **AI can do many things FOR you. It cannot UNDERSTAND for you.**

Understanding lives in your head. It is built through the experience of
prediction-failure-correction-prediction — _the cycle of being a little bit
wrong and finding out exactly where._ AI can write code, explain a concept,
simulate a teacher. What AI cannot do is have **your** generative model align
with the system you're trying to understand. The alignment is the understanding,
and the alignment happens in you.

This sets up the mastery contract you'll meet again in these pages:

> **You have only mastered a skill when you can complete its exercises without
> AI.**

That isn't a prohibition. AI is welcome at the work. It's a definition. Mastery
is the kind of thing that can only be measured by what you can do _yourself_,
because mastery is the _having of the experience that built the model_. The
model is non-transferable.

---

> **Concepts are connections; connections are concepts. Learning is
> connection-making.**

There is no atomic concept underneath. A concept IS its connection-set. A
connection between two concepts is itself a new concept. Learning is the work of
weaving — building a dense, useful, accurate graph of connections between
everything you already know and everything you're learning.

This means two things for the way you approach this course:

1. **The exercises that ask you to predict, trace, compare, and refactor are not
   busywork.** They are the connection-making moves themselves. The
   connection-graph in your head is built by doing them. There is no shortcut.
2. **Whatever you already know is an asset.** The patterns you noticed teaching,
   designing, raising children, working a trade, playing music, debugging your
   kitchen, reading novels — those are connection-graphs you already carry. The
   course's job is to wire programming into the graph you have, not to replace
   it with a new one.

---

## What you'll develop, layer by layer

The course runs **five layers** at every chapter. The layers are _engagement
depths_. A learner who stays at the first two graduates well. A learner who
comes back at the third finds more. A learner who encounters the fourth finds
more again. Each layer is a complete exit point.

There is one through-line connecting all five:

> **Each layer develops your intellectual agency at a different scale.**

You're not learning programming-as-content. You're learning to be the kind of
person who takes intellectual ownership of computational problems — at
progressively larger scales.

| Layer                | What you develop                                                                                                                           | Intellectual agency over…   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| **L0 — Mastery**     | Predictive mastery of how JavaScript's machine evaluates your code                                                                         | the notional machine        |
| **L1 — Rhetoric**    | The ability to write code for four audiences at once (developers, the computer, users, agents)                                             | communicative production    |
| **L2 — Methodology** | The ability to switch between two grounded stances — designing for users (Vibetoading) and designing for the machine (Frogramming)         | methodology choice          |
| **L3 — Snippetry**   | The ability to use programming as a tool for thought — small programs, written for their own sake, that teach you something new every time | the medium itself           |
| **L4 — Philosophy**  | The recognition that computation is one of the great human inventions for thinking about thinking                                          | the philosophical questions |

You will not be asked to descend through these in order or in unison. The
chapters take you through all four audiences (developers / the computer / users
/ agents / you), and the layers run underneath. Stay where you want. Come back
when you want to find more.

---

## What this course assumes is already in the room

Three things that AI does not have:

1. **An intellect.** A mind that can hold multiple perspectives at once, predict
   against a model, notice when prediction fails, and update.
2. **A life.** Experiences, observations, patterns from work and play and care
   and craft — whatever you've spent time with, you carry into the room.
3. **A community.** People you teach, people who teach you, people who hold you
   accountable to the next plateau. The fellow learners reading this same
   curriculum. The friends who let you think out loud. The strangers whose code
   you'll read and remix.

Each is irreplaceable. Each is yours. This course was designed assuming all
three are present in the room with you when you sit down to study.

The work is not to acquire them. The work is to _put them to use_ on
computational problems, and to discover what they let you do.

---

## How this course teaches

Five commitments shape every page.

### Comprehension before production

You will read, trace, and evaluate code before you write much of it. Programming
is reading and arrangement of existing material as much as it is greenfield
writing — and the comprehension skills generalize in ways the writing skills do
not. _Programs must be written for people to read, and only incidentally for
machines to execute_ (Abelson & Sussman). Mastering this stance early changes
how you write later.

### Predict-and-check, not watch-and-explain

You will be asked, repeatedly, to predict what the machine will do before you
run the program — then run it and compare. Predict-and-check is _proactive and
mechanistic_: it commits you to a model of the machine before you find out if
it's right. Watch-and-explain is _retroactive and justifying_: you describe what
you've already seen, and the model you build is shaped by hindsight.

The difference matters. Many wrong models of the notional machine produce the
right outputs, _for a while_. The internal events the machine produces — its
scope walks, coercion cascades, binding lifecycle, prototype lookups — are much
harder for a wrong model to falsely confirm. Predicting at that level is what
closes the gap.

### Errors are information

When the machine refuses your specification, it isn't breaking. It's telling
you, precisely, where your specification cannot be interpreted. Errors are the
machine's most useful honest output. _Seek them out._ Build the habit of
treating an error as a signal that updates your model, not as a personal
failure.

> _"You will be wrong every day you write code."_ (effective-learning, 04)

This is true regardless of how good you get. Wrong-ness is the substance of
learning, not its obstacle.

### Process over product

The course will ask you, often, to follow processes that don't feel immediately
productive — to read before writing, to trace before running, to write a
top-level comment before any code. _Trust this for long enough to feel its
payoff._ Programmers who do not develop these habits early have to back-fill
them later, expensively. The process is the skill, and the products will follow.

### Layers as exit points, not levels to climb

You do not need to reach L4 to graduate. L1 is a complete exit. You can return
to this material for years, finding more each time. _The course is shaped so
that what's deepest is also what's most rewarding to revisit_ — a learner who
finishes this course and comes back at age fifty will still find something to do
here.

---

## You wear two hats

Throughout this course, every developer (every person doing the work) wears one
of two hats at any given moment. Both are real practices, both have their time,
and most developers wear both — sometimes within the same hour on the same
project.

> 🎨 **The Vibetoader** works grounded in the user. They build a deep model of
> what users need, do, and experience — through research, prototyping, and
> testing with real people. The notional machine underneath is intentionally
> delegated.

> 🔬 **The Frogrammer** works grounded in the notional machine. They build a
> deep model of what the machine will do — through prediction, tracing, and
> verification. The user, the audience, the design they may collaborate on or
> delegate.

You will learn to wear both hats deliberately, and especially to recognize which
the moment is asking for. Vibetoading shines for user-facing prototyping, for
ideation grounded in real people's needs, for low-stakes work where the NM can
safely be delegated. Frogramming holds up under stakes that the NM-twin makes
visible: production code, security-sensitive systems, anything multi-person or
long-lived.

**Both shoulder a non-delegable twin.** A Vibetoader's twin is the user. A
Frogrammer's twin is the notional machine. AI cannot have either twin for you.

---

## The community you're joining

You are not the only one doing this. You're not even the only one doing this
_with these exact pages_.

The course is being made and used in community — with alumni who shaped its
principles, with friends and mentors who pushed back on its framings, with
partner organizations (including a cohort with the Palestinian community), with
the open discourse of teachers and designers and researchers whose work this
curriculum draws on. **The people who made this are practitioners of it. The
people using this are co-makers of its next version.** That is what the
curriculum-as- Quine ethos means in operational form: a learner who finishes the
course has what they need to teach and extend it.

There are at least four roles you will inhabit at different moments, sometimes
within the same day:

- 🥚 **The learner** — when your goal is to gain the skill
- 🐣 **The companion** — when you help someone reach a skill you have not yet
  fully mastered yourself
- 🐥 **The teacher** — when you help someone reach a skill you have mastered
- 🐔 **The accounta-buddy** — when you assess or track progress (often for
  yourself or a peer)

You will not be in one role. You will be in all four, on different problems and
at different scales, often on the same afternoon. The course supports all four
on equal footing.

Lean on the people around you. _Never teach alone_ (Greg Wilson, Rule 5). _Be
kind: all else is details_ (Rule 1). The course will return the favor.

---

## How to use this course

Read at your own pace. There are no deadlines.

For each chapter:

- **The body prose** carries the chapter's primary content — L0 and L1. Read it
  linearly the first time.
- **Sidebars and V/F dialogues** carry L2 — the methodological work of switching
  hats, of seeing a problem from both sides at once. They are necessary for L2
  reading; skippable for L1 reading.
- **End-of-chapter snippetry prompts** carry L3 — the practice of writing small
  programs for their own sake.
- **Footnotes, side notes, easter eggs, and references** carry L4 — the deeper
  currents, fully optional, available for the reader who wants them.

Tools available to you throughout:

- **Just Enough JavaScript** — a curated subset of JS, designed so that every
  program you write in Chs 1–4 fits on a single page. The constraint is
  pedagogical; Chapter 5 lifts it.
- **Study Lenses** — embedded in every page. Trace tables, variable
  highlighters, Parsons problems, fill-in-the-blanks, predictive stepping. The
  Frogrammer's _kit of magnifying glasses_ 🔬.
- **A study journal of your own.** Keep one. Even if just paper.
- **Other people.** See above.

### The four exercise markers

Throughout this course, exercises carry one of four markers. They mark
priority — and serve as a self-assessment tool for gauging where you are with
each skill:

- 🥚 — **Required.** The base skills you need to move on. You don't need to
  finish all of them, but you should feel confident you _could_ with enough
  time.
- 🐣 — **In progress.** You have started all of these and feel you could
  complete them with more time. With effort, you can get through.
- 🐥 — **Surveyed.** You have studied the examples and started some.
  Big-picture understanding, but not yet confident completing them
  independently.
- 🐔 — **Extension.** Not required but related. For when you have finished
  🥚, 🐣, 🐥 and want to push further without losing focus on the main
  objectives.

When you finish a section, ask yourself: am I at 🥚 (I could do this
reliably)? 🐣 (I could with more time)? 🐥 (I have the shape of it)? Use
this to decide where to spend more time before moving on. (In Chapter 4
you will encounter the same self-assessment frame as a tool for deciding
when it makes sense to delegate a programming task to an LLM — and when
it doesn't.)

---

## What discomfort means

Some of what this course teaches is hard in a specific way. The hardness
isn't a problem to fix; it's a signal that you're in the right place.

**The liminal zone.** Between _"I don't understand this"_ and _"I understand
this"_ is a third state. Researchers call it the **liminal zone**: you are
in transition, things feel unstable, your predictions are wrong in ways
you cannot fully account for yet.

You will spend time here, especially in Chapter 2. Two states to
distinguish:

- **Stuck** — you cannot form a prediction at all. The concepts are too
  unfamiliar. This is a signal: you need more input. Reread the reference
  material. Trace a simpler example. Ask for help.
- **In the zone** — you can form predictions, but they keep being wrong in
  specific, interesting ways. _This is the liminal zone. This is the work.
  Stay in it._

The discomfort of being in the zone is not a sign that you are doing it
wrong. It is a sign that one of programming's threshold concepts is
forming — and that it will be transformative when it does.

**Chapter 2 specifically.** Chapter 2 is the hardest part of this course.
We know this. You will know it too. The programs are small and abstract.
The exercises feel mechanical. You are learning the machine before you
can build anything visible with it — which means the work feels
disconnected from results for longer than you might expect.

This is temporary and intentional. The machine literacy you build in
Chapter 2 is the foundation every subsequent chapter stands on. Chapters
3, 4, and 5 become tractable because of what you build here. _Welcome to
Algorithms_ becomes tractable because of what you build here. Push
through.

**Being wrong is information.** Make falsifiable predictions. The more
specific the prediction, the more useful the feedback when you turn out
to be wrong about it. Find the exact point where your prediction and the
machine's behavior diverged — that point names the gap in your model.
That's the location of the next thing to learn.

---

## A reading note on intellectual confidence

Some of what this course teaches you to do is hard. Some of what it asks you to
encounter — the notional machine's behind-the-scenes events, the rhetorical
model of code, the V/F symmetry, the philosophical questions in Layer 4 — will
look at first like material that belongs to other people. _To experts. To
philosophers. To researchers. Not you._

It belongs to you. It has always belonged to you. The vocabulary that gatekeeps
it is the only thing standing between you and these questions, and the
vocabulary is itself a learnable thing.

This course is not a puzzle that rewards the already-confident. It is designed
pedagogically so that **it builds intellectual confidence in you as you read
it.** That is the foundational divergence from books this material would
otherwise rhyme with. Those books require the confidence; this course develops
it.

Whatever experience and background you bring is a unique advantage, not a
handicap. The room is yours.

---

## A small closing

There are at least three things going on in this curriculum that I would like
you to leave the room knowing.

The first is that **you can do this.** The course is built around the assumption
that you can. If something is hard, that is the curriculum working — not you
failing.

The second is that **what you build through this course is portable.** The
mastery contract — the part you can do without AI — travels with you to the next
language, the next framework, the next medium, the next decade. Notional
machines come and go; the discipline of building a generative model of one is
the invariant skill.

The third is that **you are entering a long conversation.** Computing education
has been going on for generations. The questions in this course were old when
this course was new. The people who came before you — designers, programmers,
teachers, researchers, friends, students — were practicing it in the same room.

Welcome to the room.

---

_Voilà quoi. Bon courage._
