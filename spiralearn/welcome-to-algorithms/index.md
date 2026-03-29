---
sidebar_position: 2
---

# Welcome to Algorithms

A spiral curriculum extending [Welcome to Programming](/welcome-to-programming/)
into algorithmic thinking and complexity analysis. Learners arrive with
comprehension skills (Read, Trace, Describe, Modify, Write), the PBSI framework,
agent collaboration skills, and the full rhetorical model (developers,
computers, users, agents). This curriculum puts that foundation to work on
progressively complex algorithms.

**Prerequisite:** [Welcome to Programming](/welcome-to-programming/) or
equivalent foundation in program comprehension, variable roles, PBSI, and LLM
collaboration.

## What's New Here

Everything from Welcome to Programming carries forward — the rhetorical model,
comprehension-before-production, spiral structure, Study Lenses, evidence tags,
and agent collaboration. What changes:

- **Strategy becomes the primary object of study.** In WtP, learners studied
  programs holistically (purpose, behavior, strategy, implementation). Here, the
  strategy layer is complex enough to deserve its own analytical tools and
  representations.
- **A representation sequence** — each algorithm is revisited through
  progressively abstract representations (prose → flowcharts → pseudocode →
  decision tables → loop invariants → state transitions → pattern schemas).
  Learners don't just understand algorithms — they understand them _in multiple
  ways_.
- **The analytical chain** — a systematic reasoning framework (smallest problem
  → growth pattern → state → language features) applied to every algorithm.
- **The spider web model** — a spiral within the spiral, where concentric
  circles represent algorithm complexity and radial lines represent
  representation levels. Every subchapter traverses all radial lines.
- **Functions, testing, and documentation** — algorithms get named, documented
  (JSDoc), wrapped in functions, and formally tested (unit testing). This
  enables the efficiency comparisons that drive complexity analysis.
- **Complexity analysis** — step-counting, growth rate reasoning, and Big O
  notation. The quantitative answer to "how much work does this algorithm do?"

## Curriculum Map

This curriculum is currently organized as two chapters. See
[chapters-plan.md](./chapters-plan.md) for a proposal to restructure into
lighter, more focused chapters.

| Chapter                                                                             | Focus                                                                                                                                                                             | Key Skills                                                                                                               |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [**5: Algorithms**](./5-devs-computers-users-agents-algorithms/index.md)            | String algorithms organized by growth pattern, the representation sequence, the analytical chain, functions arc (JSDoc → functions → unit testing), regex as alternative paradigm | Iteration, algorithmic decomposition, representation transitions (AT Taxonomy), JSDoc, pure functions, unit testing, TDD |
| [**6: Complexity**](./6-devs-computers-users-agents-algorithms-complexity/index.md) | Revisits Ch 5 algorithms through quantitative lens: step-counting, growth curves, Big O. Ends with space vs. time via absurd algorithms                                           | Step-counting, growth rate reasoning, Big O notation, space vs. time tradeoffs, memoization                              |

## Key Pedagogical Milestones

- **The Representation Sequence** (Chapter 5) — each algorithm is revisited
  through progressively abstract behavioral representations: trace tables →
  prose strategy descriptions → flowcharts → pseudocode → decision tables → loop
  invariants → state transitions → algorithmic pattern schemas. Exercise design
  is informed by the Abstraction Transition Taxonomy (Cutts et al.), which
  structures exercises as transitions between abstraction levels — adjacent,
  distant, and "why" — ensuring learners don't just produce representations but
  understand the relationships between them.

- **The Analytical Chain** (Chapter 5) — smallest problem → growth pattern →
  state → language features. Applied to every algorithm, this chain drives
  subchapter boundaries and connects concrete observation (running 0, 1,
  2-element inputs) to decomposition reasoning.

- **The Functions Arc** (Chapter 5, 5.6–5.8) — JSDoc → functions → unit testing.
  Intention-before-implementation applied to functions: write the contract
  first, then implement, then formalize verification. Enables Chapter 6's
  efficiency comparisons.

- **Observable → Explanatory** (Chapter 5 → 6) — Chapter 5's observable
  dimensions (iteration structure, growth pattern, state, scope, decisions)
  become Chapter 6's explanatory dimensions (why this complexity class?).
  Iteration structure determines complexity class; growth pattern, state, and
  decisions affect constants. This connection is the curriculum's core insight
  linking decomposition to complexity.

- **Studying with LLMs** — LLMs generate all representation types; learners
  critically evaluate them. The representation sequence provides structured
  material for productive disagreement with AI output — more representations
  means more to evaluate, more transitions to verify.

## Language Feature Constraints

All language features from WtP carry forward. New additions are limited to:

- `for...of` / `for...in` (fixed iteration)
- `for` with incrementers (JS) / `for...in range` (Python)
- **Functions** (5.6–5.8): arrow function expressions, parameters, return
  values, JSDoc, `console.assert`, unit testing (`describe`/`it`/`expect`)

Notable exclusions: arrays (beyond what strings provide), objects, closures,
higher-order functions, side effects. Functions are limited to pure functions on
strings.

## Status and Open Questions

- **Chapter 5**: Subchapter progression designed (5.0–5.9). Algorithms
  (5.0–5.5), functions arc (5.6–5.8 JSDoc/functions/testing), and regex capstone
  (5.9). Analytical chain and exercise framework specified.
- **Chapter 6**: Framework designed (5+1 analytical chain, representation
  sequence). 6.0 (counting setup) and 6.1 (Can We Do Better?) drafted.
  Subchapters 6.2+ deliberately left open. Space vs. Time confirmed as closing
  subchapter.
- **Restructuring**: See [chapters-plan.md](./chapters-plan.md) for a proposal
  to break these two heavy chapters into lighter, more focused chapters — giving
  functions, unit testing, and regex room to breathe.
- **Representation pass count**: The 7-pass behavioral sequence is provisional.
  Some passes may be removed or consolidated after testing.
