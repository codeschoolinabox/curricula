# Research Framing

> This document describes the research orientation shared by all curricula in
> this repository. Individual curricula have their own `research-framing.md`
> with curriculum-specific design rationale and evidence.

**Owner**: Research committee

---

## A Curriculum That Studies Itself

This curriculum is a translational research artifact — designed to
simultaneously teach programming and investigate how programming is best
learned, especially now that AI is part of the picture.

### The Two Divides

Computing education has two divides that limit progress:

1. **Research and practice don't talk enough.** Researchers produce findings
   about how people learn to program. Practitioners build curricula from
   experience and intuition. The findings rarely reach the curricula, and the
   curricula rarely inform the research.

2. **Theory and design don't talk enough.** Theoretical work (what _should_
   work) and design work (what _does_ work in practice) develop in parallel
   without enough feedback between them.

This curriculum sits in the _trading zones_ where these divides meet — places
where people from different traditions can coordinate locally without needing to
agree globally on methodology or philosophy.[^tcer]

[^tcer]:
    The trading zone concept comes from Galison (1997), applied to computing
    education research by Cole, Malaise & Signer (2023) in the Translational
    Computing Education Research (TCER) framework.

### TCER Positioning

Grounded in Cole, Malaise & Signer (2023), "Computing Education Research as a
Translational Transdiscipline."

The TCER model warns against two traps: the "translational imperative"
(pressuring all work to justify broader impacts) and the "pipeline"
misconception (translation is cyclical, not linear). The curriculum doesn't need
to BE all phases — it operates primarily in **trading zones** where research and
practice coordinate locally.

| TCER Phase                               | What the Curriculum Does                              | Continuum Position   |
| ---------------------------------------- | ----------------------------------------------------- | -------------------- |
| **3.B\*** Practitioner-facing guidelines | Synthesizes research into actionable teaching content | PT (Practice Theory) |
| **4.A\*** Evidence-based prototype       | The curriculum itself is the intervention             | PD (Practice Design) |
| **4.B\*** User feedback & reports        | Teaching it generates research data                   | RD (Research Design) |

All three are trading zones (marked \*) — where transdisciplinary collaboration
happens. The curriculum committee and research committee coordinate locally
without needing global methodological agreement.

**Reflexive Analysis & Action**: This cross-cutting concern applies in two ways:
(1) the curriculum committee reflexively analyzes how research findings reshape
curriculum design, and (2) learners' exercise artifacts feed back as research
data that may reshape the theoretical framework. This is not a phase — it's a
continuous practice that makes the artifact genuinely translational rather than
merely research-informed.

---

## The Evidence Tag System

Throughout the curriculum, you'll see small linked emoji that classify the
evidence behind pedagogical claims:

- 🔬 **Established** — Direct research backing. Peer-reviewed, replicated or
  highly cited. Solid ground.
- 📐 **Translated** — Established theory applied to a new context. The original
  finding is solid; the application to _this_ context is our informed
  conjecture. This is where disciplined bridge-building happens.
- 🧪 **Extension** — Derived from experience, extrapolation, or untested
  prediction. We think this is right, but it hasn't been tested yet. This is
  where we need your help.

When you see `[📐]` in a chapter, it links to that chapter's
`research-framing.md`, which explains _why_ that particular claim was included
and _what evidence_ supports it.

### How Evidence Tags Work

- **Inline**: `[📐](./research-framing.md#anchor)` — tiny clickable emoji, low
  visual noise
- **Footnotes**: For longer evidence notes that need more context
- **Collapsible sections**: `<details><summary>Why this exercise?</summary>` for
  exercise-level context

All GitHub-compatible, no custom tooling required.

---

## Design Principle: Pedagogy Wins

When pedagogical effectiveness and research observability conflict, pedagogy
wins. Always.

Exercises are designed for learning first; their research value comes from
natural byproducts, not additional instrumentation burden on learners. If making
an exercise more observable would make it worse for learning, we choose
learning.

This means:

- We don't add assessment steps that interrupt the learning flow just to
  generate data
- We don't increase content density for observability when it overloads learners
- We design exercises that naturally produce analyzable artifacts as a _side
  effect_ of good pedagogy
