# Welcome to Frogramming — Study Lenses Infrastructure

> **Purpose**: technical-reader companion to the curriculum. Explains the
> JEJ → NM → embody → lenses → orchestrator chain — the infrastructure
> beneath the pedagogy — and why each layer exists as it does.
>
> **Audience**: curriculum authors, contributors, researchers, study-lenses
> adopters in other host environments. _Not learners._ Learners encounter
> Study Lenses through doing, not through reading this file.
>
> **Companions** (siblings, by co-location):
>
> - `syllabus.md` — top-of-document learner orientation
> - `syllabus.ontology.md` — the concepts learners learn
> - `syllabus.pedagogy.md` — design principles; carries the Explorotron
>   framework (§7) + lenses-as-F-pedagogy-infrastructure framing
> - `syllabus.translational-framing.md` — V/F at the artifact layer
>   (`lenses/embody` is F at the artifact layer); coordinated Translational
>   Sprints (the deeper analysis lives there)
> - `syllabus.metaphor.md` — the composer/virtuoso/mechanism metaphor;
>   lenses are the Frogrammer's "kit of magnifying glasses" 🔬
> - Source-code documentation: canonical technical contracts at
>   [`src/lib/welcome-to-programming/just-enough/javascript/README.md`](../../src/lib/welcome-to-programming/just-enough/javascript/README.md)
>   and the sibling `DOCS.md`, `notional-machine.md`, `embody/`, `lenses/`,
>   `orchestrate/` files
>
> **Status**: end-state document. Status / phase / hedging belongs in git
> history (commit log), not here.
>
> **Voice**: reference-neutral; un-prose-y. Tables, lists, mermaid only
> where relationships need it. Inherits the ontology's register, not
> narrative.md's discursive register.

---

## Contents

- [1. The pitch](#1-the-pitch)
- [2. The JEJ chain](#2-the-jej-chain)
- [3. JEJ — the language subset](#3-jej--the-language-subset)
- [4. The notional machine](#4-the-notional-machine)
- [5. `embody` — operational embodiment](#5-embody--operational-embodiment)
- [6. Study lenses — pedagogical perspectives](#6-study-lenses--pedagogical-perspectives)
- [7. The orchestrator — `<StudyLenses>`](#7-the-orchestrator--studylenses)
- [8. Pedagogical foundations (the Explorotron framework)](#8-pedagogical-foundations-the-explorotron-framework)
- [9. The 3D Block Model space](#9-the-3d-block-model-space)
- [10. V/F at the artifact layer](#10-vf-at-the-artifact-layer)
- [11. Lineage and inspiration](#11-lineage-and-inspiration)
- [12. References](#12-references)

---

## 1. The pitch

_To be written._

**Primary pitch (denepo's framing)**: _"Study code, not explanations."_
Study Lenses is "an idea, not an implementation" — adaptable across host
environments (browser, IDE, static site, mobile). Implementations follow
CER best practices (PRIMM, scaffolding, expertise reversal).

**Secondary pitch**: training wheels on a bike, not a tricycle —
Study Lenses adds support _on top of_ a real development environment,
not in place of one. Layers can be peeled away as learners progress.

**Supporting** (carries into §2): the substrate-is-not-inert framing
moves to §5 where embody is described. The four-step reasoning framework
(explicitly teach code-study; provide tools; write level-appropriate
programs; let learners explore with study suggestions) lands in §8 with
the Explorotron foundations.

---

## 2. The JEJ chain

_To be written._ The mermaid diagram of JEJ → NM → embody → lenses →
orchestrator (carried from ontology §23). Table of what each layer is,
where it lives, what it produces. The hard rule: **LMS layer is OUT** —
progress modelling and monitored learning belong to the embedding LMS
that uses `<StudyLenses>`. Cross-links to the source-code READMEs for
each layer.

---

## 3. JEJ — the language subset

_To be written._ Why a language level: meaningful computational exploration
within a manageable notional machine. "Few options, many possibilities" —
structural tools (variables, conditionals, loops, block scope) + computational
toolkits (all String/Math methods, regex, etc.) without expanding the NM.
The exclusions table (functions, arrays, objects, classes, try/catch,
async/await, var, destructuring) and what each would add to the NM.
Cross-link: [`reference.md`](../../src/lib/welcome-to-programming/just-enough/javascript/reference.md).

---

## 4. The notional machine

_To be written._ The NM is the conceptual evaluation model JEJ programs
run on. **Twinning the NM is the curriculum's L0 learning objective.**
Code is the UI for the NM (cross-reference ontology §18 / §19) — source
text is the control panel through which the programmer operates the
machine, but the NM is the thing the panel controls and can also be
observed directly through embody/lenses, bypassing the panel.

The two data boundaries — **resolve** and **emit** — carry over from
ontology §23. The mermaid diagram showing visual-syntax level ↔
behind-the-scenes level (resolve) and behind-the-scenes ↔ I/O channels
(emit) is canonical here. Filtering only resolve events shows the
complete data flow through a program — a load-bearing pedagogical view.

Cross-link: [`notional-machine.md`](../../src/lib/welcome-to-programming/just-enough/javascript/notional-machine.md).

---

## 5. `embody` — operational embodiment

_To be written._ `embody(code)` takes a JEJ source string and returns a
frozen-data + event-stream object — the snippet as the NM would treat
it. Every field corresponds to a concept in the NM.

This is where the substrate-is-not-inert insight lands: `embody`
crystallizes the dynamics of program evaluation into a static-but-4D
structure that makes all facets explorable. _"A static 4D rendering of
a 3D flowing river."_

User-facing principles (summary): frozen immutable data; pure data with
generators as the only callable surface (event streams are inherently
iterated); spec-aligned but learner-named field names.

The construction staircase — **tokenize → parse → validate → create** —
resolves into one of a five-leaf shape catalog. Lenses gate behavior on
`embodiment.status.*` flags; a snippet that fails at any gate produces
a structurally distinct embodiment whose downstream surfaces are
absent (no `streams.evaluate` for programs that won't run).

Three evaluation engines in `embody/lib/evaluating/`, each serving a
different pedagogical purpose: **run** (Web Worker; end-report only),
**intercept** (Web Worker + console/dialog traps; event stream +
result), **trace** (Web Worker + Aran AST instrumentation; per-expression
events at two granularities — `syntax` / `semantics`).

Cross-link to [`embody/README.md`](../../src/lib/welcome-to-programming/just-enough/javascript/embody/README.md)
and [`embody/DOCS.md`](../../src/lib/welcome-to-programming/just-enough/javascript/embody/DOCS.md)
for the full contract.

---

## 6. Study lenses — pedagogical perspectives

_To be written._ Each lens is a stateful "mini web app" plugin — its
own UI, internal state, pedagogical logic. Takes `embodiment` and
optional `LensConfig` as props; renders a learning exercise. Lenses
absorb what would otherwise be a "transforms" tier (parsons-style
shuffling, blanks-style hiding, bug-injection live inside the relevant
lens).

**Three-tier classification** based on what each lens needs from the
embodiment. Tier corresponds to which `status` flag a lens checks
before reaching for content; the monotonic chain (`created` implies
`validated` implies `parsed` implies `tokenized`) means lens-author
logic only checks the field it cares about.

| Tier | What it needs | `applicableTo` returns |
| --- | --- | --- |
| 1 | Text only — no parse | always `true` |
| 2 | Valid AST (no execution required) | `embodiment.status.parsed` |
| 3 | Valid parse AND evaluable script-scope | `embodiment.status.created` |

A Tier-2 lens that also wants JEJ-subset compliance gates on
`embodiment.status.validated` (which sits between `parsed` and
`created` in the chain) — see [`lenses/README.md`](../../src/lib/welcome-to-programming/just-enough/javascript/lenses/README.md)
for the validated nuance.

The lens roster (open by construction): `editor` (home base, lives in
`orchestrate/editor/`, not a lens), `highlight` (annotated code),
`blanks` (fill-in-the-blank), `parsons` (line ordering), `trace-table`
(predict-then-compare), `debug-props` (sandbox-harness meta-lens). The
lens-authoring contract admits additional lenses without changes to
embody, orchestrate, or this document.

Lens-authoring convention (see [`lenses/README.md`](../../src/lib/welcome-to-programming/just-enough/javascript/lenses/README.md)):
each lens is a two-layer module — pure-TS core + light React wrapper —
keeping the core's tests fast and the React boundary explicit.

---

## 7. The orchestrator — `<StudyLenses>`

_To be written._ The package's public API: a small-prop React component
(`snippet` / `lens` / `configs`) — `snippet` is the initial-value-only
code string; `lens` is the optional default-mount lens name; `configs`
is the opaque cascade passthrough. The Docusaurus plugin parses
per-fence info-strings (`js:trace?stepDelay=500`) and the directory
`lenses.json` cascade, emitting the resolved values onto the JSX node.
The locked contract is canonical at [`orchestrate/README.md`](../../src/lib/welcome-to-programming/just-enough/javascript/orchestrate/README.md)
— that file IS the public-API spec; this section is a curriculum-facing
summary.

**Single-writer state model**: only the editor mutates snippet state.
Lenses are read-only views. Re-embody happens once per edit cycle; the
orchestrator distributes the fresh embodiment to mounted lenses via
props. No reconciliation between competing mutators.

**Editor-vs-lens state machine**: the UI is in exactly one of two modes
at a time — editor mode (the home base is mounted; the textarea is the
source of truth for `snippet`) or lens mode (a lens is active with a
frozen `embodiment`; the snippet is read-only). Mode transitions are
driven by the `lens` prop today; a toolbar picker will land in a later
increment.

**The recommender** lives inside orchestrate, not as a separate peer.
It is an _applicability filter + ranking engine_ — given an embodiment
and a roster of lens plugins, it runs applicability gates and ranks by
snippet-fit, returning recommended lenses. **No learner state.**
ZPD-targeting at the curricular scope is the embedding LMS's job; the
recommender never sees who the learner is. The recommender's
organizing space is the 3D Block Model — see §9.

**Two scopes** the Explorotron framework operates at — **snippet scope**
(one `<StudyLenses>` instance; this package owns it) and **curricular
scope** (the embedding LMS arranges instances). The LMS owns curricular
scope; this package never reaches above the snippet boundary.

Cross-link to [`orchestrate/README.md`](../../src/lib/welcome-to-programming/just-enough/javascript/orchestrate/README.md)
and [`orchestrate/DOCS.md`](../../src/lib/welcome-to-programming/just-enough/javascript/orchestrate/DOCS.md).

---

## 8. Pedagogical foundations (the Explorotron framework)

_Brief summary + pointer._ The architecture implements Malaise & Signer
(2023), _Explorotron: An IDE Extension for Guided and Independent Code
Exploration and Learning_. The framework has two axes (curated/uncurated
× guided/unguided → four quadrants) and a layered pyramid (progress
modelling at the base; monitored learning at the top).

The detailed treatment lives in `syllabus.pedagogy.md` §7 — the four
quadrants at snippet scope with concrete examples, the three load-bearing
principles (skill transfer, expertise reversal, lifelong-learning autonomy),
and Begel & Ko's "both-yes" answer. This section is a one-paragraph
summary plus a forward pointer to pedagogy.md §7 (canonical).

---

## 9. The 3D Block Model space

_To be written._ The orchestrator's recommender (§7) is organized by a
three-dimensional space. Schulte (2008)'s Block Model of Program
Comprehension extends to three dimensions here:

- **Level** — text surface → program execution → function/purpose
- **Scope** — atoms → blocks → relations → macro
- **NM components** — 10 step-categories from the syntax tracer's
  `StepCategory` enum (`expression`, `resolve`, `statement`, `scope`,
  `control-flow`, `initialization`, `for-init`, `write`, `emit`,
  `error`)

The third axis is **unordered** by deliberate design — NM components
don't compose into a single learning progression. A snippet with
`expression + resolve` isn't "earlier" than one with `scope +
control-flow`; they're different teaching opportunities. The spiral
comes from (a) lens-config variation across snippets and (b)
curriculum-author-imposed ordering of category-filtered recommendations,
chosen pedagogically rather than enforced by the NM model.

The `RecommendationGrid` folds the three dimensions into one structure;
each cell is populated only where snippet × available lenses intersect.
A short snippet with no loops won't have trace-table options; a
literal-only snippet won't have variables-lens options.

---

## 10. V/F at the artifact layer

_Brief summary + pointer to canonical home._ The student-layer /
artifact-layer distinction from ontology §3 lands here:

- **`lenses/embody` is F at the artifact layer** — engineering /
  technical-affordances side. Theory-neutral infrastructure that
  makes the NM's behind-the-scenes legible. Serves multiple
  pedagogies precisely because it's NM-grounded rather than
  user-experience-opinionated.
- **The curriculum is V at the artifact layer** — experiential side.
  Design thinking about the learner's experience of learning;
  opinionated content authored to shape what the learner encounters.

The two operate as **coordinated Translational Sprints** — two TCER
artifacts mutually constituting each other. This is the **engineering
× physics co-evolution** (Bakhtiar Mikhak) operating at the artifact
layer.

The deeper analysis — including the Faraday/Maxwell-style mutual
constitution, the trading-zone reading, and the V/F symmetry recurring
at the artifact scale — lives canonically in
`syllabus.translational-framing.md` §6 (Tool-Theory Co-evolution) and
§7 (V/F at the artifact layer). This section names the structural
claim and points there; the cross-reference is load-bearing for the
curriculum's TCER positioning.

---

## 11. Lineage and inspiration

_To be written._ The intellectual lineage of Study Lenses. Entries split
into two registers: **canonical here** (entries with no other home in
the syllabus.\* family — this file is their first canonical mention) and
**pointers** (entries canonical elsewhere; brief acknowledgment + see-X).

**Canonical here:**

- **Side-by-Side / Blocks to Text**. A distant ancestor learning
  environment; students compare side-by-side with Python text;
  PRIMM-flavored exercises; Python Tutor as the runtime-NM view. The
  trail that led to Study Lenses.
- **DeNepo** ([github.com/DeNepo](https://github.com/DeNepo); home page
  `denepo.js.org`). The host organization — _means of instruction_:
  tools, guides, materials for computing education designed to empower
  learners and educators. Other DeNepo projects include `as Code /
  Content`, Micromaterials, Curriculum Packaging, Corpus Analysis.
- **Aran** ([github.com/lachrist/aran](https://github.com/lachrist/aran)).
  The JavaScript AST instrumentation library that powers the `trace`
  evaluation engine — turns expression evaluation, scope walks, and
  control-flow steps into observable events.

**Pointers (canonical elsewhere):**

- **Bret Victor — Learnable Programming** (2012). Victor wanted _less
  implementation toil_ AND _more powerful thinking tools_. Study Lenses
  reclaims the visibility wish at the **internal mechanism** of
  evaluation, not the final output. _Canonical: ontology §20._
- **Bakhtiar Mikhak — "Building infrastructure IS research contribution."**
  The teaching that grounds V/F at the artifact layer; the engineering
  × physics co-evolution insight. _Canonical: translational-framing.md §6 and §10 of this file._
- **Malaise & Signer (2023) — Explorotron**. The academic framework
  `<StudyLenses>` realizes at snippet scope. _Canonical: pedagogy.md §7 and §8 of this file._

---

## 12. References

_To be written._ Canonical pointers:

- **denepo.js.org/study-lenses** — the project's home page
- **Source-code documentation chain** (canonical technical contracts):
  - [`just-enough/javascript/README.md`](../../src/lib/welcome-to-programming/just-enough/javascript/README.md) — package overview + Pedagogical first principles
  - [`just-enough/javascript/DOCS.md`](../../src/lib/welcome-to-programming/just-enough/javascript/DOCS.md) — architecture decisions
  - [`just-enough/javascript/notional-machine.md`](../../src/lib/welcome-to-programming/just-enough/javascript/notional-machine.md) — NM specification
  - [`embody/README.md`](../../src/lib/welcome-to-programming/just-enough/javascript/embody/README.md) + [`embody/DOCS.md`](../../src/lib/welcome-to-programming/just-enough/javascript/embody/DOCS.md) — embody architecture + types
  - [`lenses/README.md`](../../src/lib/welcome-to-programming/just-enough/javascript/lenses/README.md) — lens module contract
  - [`orchestrate/README.md`](../../src/lib/welcome-to-programming/just-enough/javascript/orchestrate/README.md) + [`orchestrate/DOCS.md`](../../src/lib/welcome-to-programming/just-enough/javascript/orchestrate/DOCS.md) — orchestrator + state machine
- **Notes-pages trail** at `0---the-big-idea/00--evancole-be/0--notes/pages/`: `Study Lenses.md`, `De Nepo.md`, `Side-by-Side.md`, `Aran.md`, `Metanotes___Plugins.md`, `Module___Welcome to JS.md`
- **Malaise, Y., & Signer, B.** (2023). _Explorotron: An IDE Extension for Guided and Independent Code Exploration and Learning._ Proc. of Koli Calling '23.
- **Schulte, C.** (2008). _Block Model_ — Educational Model of Program Comprehension.
- **Cole, E., Malaise, Y., & Signer, B.** (2023). _Computing Education Research as a Translational Transdiscipline._ SIGCSE 2023.
