---
sidebar_position: 98
---

# Chapters Plan: Restructuring Proposal

> This is a design document, not a finalized plan. It proposes breaking the
> current two heavy chapters into lighter, more focused chapters now that
> Welcome to Algorithms is its own curriculum with room to expand.

## Current Structure (2 Heavy Chapters)

| Chapter  | Subchapters              | Topics Covered                                                                       |
| -------- | ------------------------ | ------------------------------------------------------------------------------------ |
| **Ch 5** | 5.0–5.9 (10 subchapters) | Iteration setup, 5 algorithm pattern families, JSDoc, functions, unit testing, regex |
| **Ch 6** | 6.0–6.1+ (open-ended)    | Counting setup, "Can We Do Better?", complexity classes, Big O, space vs. time       |

Chapter 5 is doing a lot: algorithm patterns AND functions AND testing AND
regex. Each of these deserves room to breathe as a full chapter with its own
spiral, exercises, and LLM study integration.

## Proposed Structure (Lighter Chapters)

### Part I: Algorithm Patterns

These chapters follow the analytical chain (smallest problem → growth → state →
language features) and the spider web model (concentric circles × representation
sequence).

**Chapter 1: Iteration & Simple Algorithms**

- Current: 5.0 (iteration setup) + 5.1 (each element independently)
- Focus: `for...of`/`for...in`, single-pass traversal, gatherer variables,
  no/simple decisions
- Why standalone: iteration constructs are a genuine new language feature that
  needs room for predictive stepping, tracing, and comprehension exercises
  before being applied to algorithms
- Representation sequence: full 7 passes on the simplest algorithms

**Chapter 2: Dependent & Composed Algorithms**

- Current: 5.2 (adjacent relationships) + 5.3 (composed scans)
- Focus: dependent chains, holder variables, multi-pass decomposition
- Why standalone: the jump from independent to dependent subproblems is a
  genuine conceptual threshold — the growth pattern changes, state requirements
  increase, and the analytical chain produces different results
- Key comparison moments: count vowels (ch1) vs. count runs (ch2), single-pass
  vs. multi-pass

**Chapter 3: Complex Algorithms**

- Current: 5.4 (global relationships) + 5.5 (two perspectives)
- Focus: nested loops, two-pointer/converging techniques
- Why standalone: nested iteration is a qualitative jump (O(n²) emerges), and
  two-pointer is a genuinely different way of thinking about iteration
- Key comparison moments: palindrome via nested vs. converging, efficiency
  questions surface qualitatively

### Part II: Functions & Testing

These chapters restructure the algorithms from Part I into named, documented,
testable functions.

**Chapter 4: JSDoc & Documentation**

- Current: 5.6
- Focus: writing contracts before implementation, `@param`/`@returns`,
  intention-before-implementation
- Why standalone: JSDoc connects to the comments-first pattern from WtP Ch 1 and
  the PBSI descriptions from Ch 3 — it deserves space to make those connections
  explicit rather than being squeezed between algorithms and functions
- Prerequisite: Part I algorithms (learners document algorithms they already
  understand)

**Chapter 5: Functions**

- Current: 5.7
- Focus: arrow function expressions, parameters, return values, scope,
  `console.assert`
- Why standalone: functions are a significant new abstraction — wrapping known
  algorithms in functions is itself a representation transition (code → named
  function). Scope rules need room for comprehension exercises.
- Prerequisite: JSDoc (learners implement contracts they already wrote)

**Chapter 6: Unit Testing**

- Current: 5.8
- Focus: `describe`/`it`/`expect`, TDD red-green-refactor, progressive test
  writing
- Why standalone: testing is a development practice with its own skills,
  vocabulary, and workflow. TDD's red-green-refactor cycle mirrors the
  predict-execute-compare cycle from earlier chapters — that connection deserves
  explicit treatment.
- Prerequisite: Functions (learners test functions they already wrote)

### Part III: Complexity

**Chapter 7: Complexity & Big O**

- Current: 6.0–6.4 (counting setup through Big O)
- Focus: step-counting, growth curves, dominant term analysis, Big O notation
- Why standalone: this is the quantitative payoff of all the qualitative
  intuition from Part I. Named, tested functions from Part II enable concrete
  efficiency comparisons.
- Key insight: Ch 5's observable dimensions become explanatory dimensions

**Interlude: Regex — A Different Paradigm**

- Current: 5.9
- A fun breather between complexity analysis and the space/time capstone. Not a
  full chapter — a lighter interlude that says "what if you didn't decompose at
  all?" With functions and testing from Part II, regex solutions can be wrapped
  and tested alongside iterative solutions — same JSDoc, same tests, different
  paradigm. Placed here because it's a palette cleanser: after the intensity of
  complexity analysis, a paradigm shift that doesn't require step-counting.

**Chapter 8: Space, Time & Absurd Algorithms**

- Current: 6.5–6.6
- Focus: space vs. time tradeoffs, memoization, absurd sorting algorithms, the
  Williams 2025 proof
- Why standalone: this is a capstone that reframes everything — a fun,
  philosophical closing that asks "what does it even mean for an algorithm to be
  correct or efficient?"

## Dependencies & Prerequisites

```
Part I (can be studied sequentially):
  Ch 1 → Ch 2 → Ch 3

Part II (sequential, requires Part I):
  Ch 4 → Ch 5 → Ch 6

Part III (requires Parts I and II):
  Ch 7 (requires all of Parts I + II)
  Regex interlude (requires Part II, can float)
  Ch 8 (requires Ch 7)
```

## Open Questions

1. **Numbering**: Should these chapters use their own 1–9 numbering (since WtA
   is a separate curriculum), or continue from WtP's numbering (5–13)?
2. **Chapter 1 scope**: Is iteration setup (5.0) + simple algorithms (5.1) the
   right grouping, or should iteration constructs get their own chapter?
3. **JSDoc weight**: Is JSDoc enough for a full chapter, or should it be
   combined with functions (Ch 4+5 merge)?
4. **Regex interlude weight**: Is an interlude the right format, or is regex too
   thin even for that? Could it be folded into Ch 7 or Ch 8 as a section
   instead?
5. **Part structure**: Should the three-part grouping (Patterns / Functions &
   Testing / Complexity) be formalized in the Docusaurus structure (e.g., as
   sidebar categories)?

## What This Enables

- **Functions and unit testing** get dedicated chapters instead of being
  squeezed into an already-heavy algorithms chapter
- **Each chapter is lighter** — focused on one conceptual shift, with room for
  its own spiral of exercises
- **Clearer prerequisites** — each chapter's dependencies are explicit
- **Better LLM integration** — each chapter can have its own LLM study
  strategies tailored to its specific representational challenges
- **Easier maintenance** — smaller chapters are easier to revise, test, and
  iterate on
