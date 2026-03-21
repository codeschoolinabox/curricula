# Chapter 6: Developers, Computers, Users, Agents, Algorithms, and Complexity

> The same algorithms, the same programs, but now we ask: **how much work does
> it do?**

## Overview

This chapter does not introduce new language features or new algorithms. It
revisits the algorithms from Chapter 5 through a quantitative lens. Where
Chapter 5 asks "what does this algorithm do?" and "how does it decompose the
problem?", Chapter 6 asks "how much work does it do?" and "how does the work
grow as the input grows?"

Chapter 5's functions arc (5.6–5.8) gave algorithms names, contracts, and tests.
Now those named, tested functions become the objects of efficiency analysis.
Compare `isPalindromeReverse` and `isPalindromeConverging` — same JSDoc, same
tests, same results. Different amounts of work. How different? Why? Chapter 6
answers.

### What This Chapter Is

- A quantitative re-examination of algorithms learners already understand
  behaviorally
- An empirical methodology (counting steps) before formal notation (Big O)
- A bridge from "which feels like more work?" to "which IS more work, and by how
  much?"

### What This Chapter Is Not

- Not a survey of new algorithms — every algorithm studied here was already
  encountered in Chapter 5
- Not a math course — formal notation is introduced as a tool for expressing
  patterns learners have already discovered empirically
- Not a comprehensive complexity theory curriculum — best/worst/average case
  analysis, amortized analysis, and detailed space complexity are largely out of
  scope

## The Analytical Chain (5+1 Questions)

The organizing principle for Chapter 6. Five analysis questions form a chain,
always applied together. A sixth question — about optimization — is separate,
because determining complexity and improving it are different skills.

### The Analysis Chain (always applied together)

1. **How many times does each operation execute?** (Count)
   - The foundation. Learners count specific operations (comparisons,
     assignments, iterations) for a given input. This is empirical — run the
     algorithm, count what happens. The tracer tool automates this; manual
     counting builds understanding.

2. **How do the counts change as input grows?** (Growth)
   - As input size increases from n=1 to n=5 to n=10 to n=20, how do the counts
     change? Linear? Quadratic? Does doubling the input double the work, or
     quadruple it?

3. **Which counts matter and which don't?** (Dominance)
   - Some operations grow with input; others stay constant. Some grow fast;
     others grow slowly. Which ones dominate as input gets large? This is where
     "ignore the constants" and "ignore the lower-order terms" emerge from
     observation, not from rules.

4. **What aspect of the algorithm CAUSES this growth?** (Explanation)
   - This is where Chapter 5's observable dimensions become explanatory.
     Iteration structure determines the complexity class (single-pass → O(n),
     nested → O(n²)). Growth pattern, state, and decisions affect the constants.
     The connection from ch5 decomposition to ch6 complexity is the key insight.

5. **Which complexity class is this?** (Classification)
   - Name it. O(n), O(n²), O(1). The formal vocabulary for what learners have
     already observed.

### The Optimization Question (separate, after analysis)

6. **Could a different decomposition change the growth?**
   - A different skill entirely. Analysis tells you what you have; optimization
     asks if you could have something better. This connects to Chapter 6.1's
     "Can We Do Better?" question and eventually to space-vs-time tradeoffs.

### Why 5+1, Not 6

Questions 1–5 form an analysis arc: observe → pattern → simplify → explain →
name. They describe what IS. Question 6 asks what COULD BE — it's a design
question, not an analysis question. Keeping it separate helps learners
distinguish "measuring complexity" from "improving complexity."

## The Representation Sequence

Each representation strips away detail and reveals pattern. The sequence
progresses from most concrete to most abstract:

| Representation             | What It Shows                                     | What It Strips Away                      |
| -------------------------- | ------------------------------------------------- | ---------------------------------------- |
| **Count table**            | Exact counts per operation, per input size        | Nothing — the raw data                   |
| **Ratio/difference table** | How counts change between input sizes (×2? +n?)   | The absolute counts                      |
| **Growth curve**           | Visual shape of growth (linear? quadratic? flat?) | The numbers — just the shape             |
| **Growth formula**         | Algebraic expression (2n+1, n²+n, 3)              | The visual — just the math               |
| **Dominant term analysis** | Which term matters as n grows (n² dominates n²+n) | The lower-order terms and constants      |
| **Big O notation**         | The complexity class: O(n), O(n²), O(1)           | Everything except the growth rate family |

Each step strips away one more layer of concrete detail, moving from "what
happened" toward "what matters." The count table is the foundation — manually
fillable AND auto-verifiable by the tracer tool.

### Chapter 5's Spider Web, Adapted

Chapter 5's spider web model (concentric circles × radial lines) adapts for
Chapter 6:

- **Concentric circles** = complexity levels (from simple O(1)/O(n) through
  O(n²) and beyond)
- **Radial lines** = the representation sequence above (count table through Big
  O)
- **Every algorithm traverses all radial lines** — a learner analyzing a simple
  linear algorithm in 6.0 practices the same full set of representations as a
  learner analyzing a nested algorithm later

## How Chapter 5's Dimensions Become Chapter 6's Explanations

This connection is the chapter's core insight. Chapter 5's observable dimensions
were things learners pointed to in code. In Chapter 6, those same dimensions
EXPLAIN why algorithms have the complexity they do:

| Ch5 Observable Dimension                                  | Ch6 Explanatory Role                                                   |
| --------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Iteration structure** (single-pass, nested, multi-pass) | Determines the **complexity class** (O(n), O(n²), O(kn))               |
| **Growth pattern** (independent, dependent, converging)   | Affects **constants** within a class                                   |
| **State complexity** (number of tracking variables)       | Affects **constants** — more state ≠ more complexity                   |
| **Decision complexity** (simple filter, compound)         | Affects **constants** — more decisions per step ≠ more steps           |
| **Scope of attention** (current element, all elements)    | Related to **iteration structure** — examining more often means nested |

Both "predicts" and "doesn't always predict" are learning objectives. Iteration
structure reliably predicts complexity class. But more state or more complex
decisions don't necessarily mean higher complexity — they affect constants, not
classes. Understanding this distinction is genuinely novel and a key learning
goal.

## Subchapters

- [6.0: Counting Setup](./6.0-counting-setup.md) — the counting tool and
  methodology
- [6.1: Can We Do Better?](./6.1-can-we-do-better.md) — the motivating question
  (adapted from old ch5)
- _(6.2+ deliberately left open — to be designed after implementing 6.0–6.1)_
- 6.?: Space vs. Time (via Absurd Algorithms) — confirmed closing subchapter,
  number TBD

## Relationship to Chapter 5

| Chapter 5                                                       | Chapter 6                                                                  |
| --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| "What does this algorithm do?"                                  | "How much work does it do?"                                                |
| Behavioral representations (prose, flowcharts, pseudocode, ...) | Quantitative representations (count tables, growth curves, Big O)          |
| Growth patterns as decomposition strategies                     | Growth patterns as complexity classes                                      |
| Observable dimensions (iteration, state, scope, decisions)      | Explanatory dimensions (why this complexity class?)                        |
| Functions wrap and test algorithms (5.6–5.8)                    | Functions enable efficiency comparison (same contract, different strategy) |
| Qualitative intuition                                           | Formal measurement                                                         |

The growth pattern vocabulary from Chapter 5 maps directly:

- **Independent subproblems** (5.1) → O(n)
- **Dependent chain** (5.2) → O(n)
- **Hierarchical / composed** (5.3) → O(n) per pass × number of passes
- **Nested subproblems** (5.4) → O(n²)
- **Converging subproblems** (5.5) → O(n) or O(n/2)

## Status

6.0 and 6.1 are designed. Subchapters 6.2+ are deliberately left open for future
design. Space vs. Time (absurd algorithms) is confirmed as the closing
subchapter.

See [Teaching Tips](./teaching-tips.md) for open questions and design notes. See
[chapter-design.md](./chapter-design.md) for non-learner-facing design
decisions.

---

## Appendix: Space vs. Time (via Absurd Algorithms)

_(Confirmed closing subchapter — exact number TBD after 6.2+ are designed.)_

A fun interlude. Chapter 6 has been counting steps — measuring _time_. But
there's another resource algorithms consume: _memory_ (space). Is one
fundamentally more expensive than the other?

To explore this question, we turn to a collection of intentionally absurd
sorting algorithms. Each one wastes resources in a different, entertaining way.
The point is not the algorithms themselves — it's what they reveal about the
relationship between space and time.

### The Exhibits

**Time-catastrophic, space-cheap:**

- **Bogosort** ([Wikipedia](https://en.wikipedia.org/wiki/Bogosort)): Randomly
  shuffle the array. Check if it's sorted. If not, shuffle again. Expected
  O(n×n!) time, O(1) extra space. The array gets reused every shuffle — the
  space is recyclable. The time is not.
- **Miracle sort**
  ([source](https://blog.oscarmcglone.com/posts/weird-sorting-algorithms/)):
  Check if the array is sorted. If not, wait a bit and check again. Hope for a
  cosmic ray to flip the right bits. O(∞) expected time, O(1) space. The logical
  extreme of "maybe it'll just work out."

**Time-cheap, space-catastrophic:**

- **Lookup table extreme** (thought experiment): Precompute the sorted output
  for every possible input array and store them all. O(1) lookup time, but the
  storage required to hold every permutation of every possible array is... well,
  more atoms than exist in the universe. The opposite extreme of bogosort —
  trading infinite space for instant time.

**Converts time into something else entirely:**

- **Sleep sort**: For each element, create a thread that sleeps for a duration
  proportional to its value, then outputs the value when it wakes up. The values
  come out in order because smaller numbers wake up first. O(max(input)) wall
  time, O(n) space for threads. A literal demonstration that time is a resource
  — here it's not just spent, it _is_ the sorting mechanism.

**Cheats the problem instead of solving it:**

These three algorithms raise a question that connects back to Chapter 3's
discussion of specs and behavior: _what does it even mean for an algorithm to be
"correct"?_

- **Stalin sort**
  ([source](https://blog.oscarmcglone.com/posts/weird-sorting-algorithms/)):
  Iterate through the array. Remove any element that's out of order. O(n) time,
  O(1) space. The output is sorted... but it's not the same data. The algorithm
  "solves" the problem by deleting what doesn't fit.
- **Goalpost sort** (original, see code below): Don't sort the array — instead,
  generate a custom `areSorted` function that returns `true` for exactly this
  array in exactly this order. O(n) time, O(n) space. The output is "sorted" by
  a definition that was written to match it. The algorithm "solves" the problem
  by redefining success.
- **Intelligent Design sort**
  ([source](https://www.dangermouse.net/esoteric/intelligentdesignsort.html)):
  The probability of the input being in this exact order is 1/n!. Something that
  unlikely can't have happened by chance — it must have been intentionally put
  in that order by an intelligent Sorter. The array is already sorted in a way
  that transcends our naive understanding of "ascending order." O(1) time, O(1)
  space. Does literally nothing. The algorithm "solves" the problem by declaring
  victory.

**Goalpost sort — the code:**

```js
const goalpostSort = (nums = []) => ({
	numbers: Object.freeze([...nums]),
	areSorted: eval(
		`(nums=[${nums.join(',')}]) => true ${nums
			.map((n, i) => `&& nums[${i}] === ${n}`)
			.join(' ')}`,
	),
});
```

### The Deeper Question: Space vs. Time

After laughing at these algorithms, a pattern emerges. Look at the extremes:

| Algorithm    | Time          | Space     | What it wastes              |
| ------------ | ------------- | --------- | --------------------------- |
| Bogosort     | O(n×n!)       | O(1)      | Time (catastrophically)     |
| Lookup table | O(1)          | O(n! × n) | Space (absurdly)            |
| Sleep sort   | O(max(input)) | O(n)      | Wall clock time (literally) |
| Stalin sort  | O(n)          | O(1)      | Correctness                 |

Bogosort reuses the same memory over and over — each shuffle overwrites the
last. The space is _recyclable_. But every shuffle takes time that's gone
forever. Time is _spent_.

This isn't just a practical observation. Learners have already experienced this
asymmetry in Chapter 5: a gatherer variable gets overwritten on every iteration
(space reused), but each iteration step is executed and gone (time consumed).

### The Practical Version: Memoization

The absurd exhibits show the extremes. But real engineers make this tradeoff
every day — they just do it sensibly. The technique is called **memoization**:
store results you've already computed so you don't recompute them.

The idea is simple: before doing expensive work, check "have I already done
this?" If yes, look up the stored answer (spend space, save time). If no, do the
work and store the result for next time.

Learners have already encountered a primitive version of this in Chapter 5. A
"holder" variable that stores a previous best result to avoid re-examining
earlier elements is memoization at its simplest — spending one variable (space)
to avoid repeating a scan (time). Memoization generalizes this: instead of one
variable, use a whole cache. Instead of one previous result, store every result
you've ever computed.

This sits in the middle of the space-time spectrum:

| Approach              | Time                     | Space              | Strategy                                 |
| --------------------- | ------------------------ | ------------------ | ---------------------------------------- |
| Recompute every time  | High                     | Low                | Spend time, save space                   |
| **Memoize**           | **Low after first call** | **Medium (cache)** | **Spend space to save time**             |
| Precompute everything | O(1) lookup              | Absurd             | Spend all the space to save all the time |

Memoization is the lookup table extreme made practical — instead of precomputing
every possible answer, you cache answers _as you encounter them_. It's the
sensible version of a ridiculous idea.

### The Proof: Space Always Wins

In 2025,
[Ryan Williams proved](https://blog.computationalcomplexity.org/2025/02/you-need-much-less-memory-than-time.html)
that this asymmetry is fundamental. Any algorithm that runs in time t(n) can be
simulated using only ~√t(n) space. Space is provably, fundamentally cheaper than
time.

The intuition: you can reuse memory, but you can't reuse time. A variable that
was used in step 1 can be overwritten and reused in step 1000. But step 1 itself
is gone — you can't get it back. Memory is a recyclable resource. Time is a
consumable one.

This is why the lookup table extreme is more absurd than bogosort. You could (in
theory) compress space by reusing it. You can never compress time.

### Language Features

- (nothing new — this subchapter may use arrays and functions beyond the
  curriculum's usual string-only constraint, because the point is the complexity
  analysis, not the data structures)

### Skills and Objectives

- 🥚 Applying step-counting and Big O analysis to absurd algorithms — same
  tools, funnier inputs
- 🥚 Distinguishing between time complexity and space complexity as two separate
  resource measures
- 🐣 Understanding why space is fundamentally cheaper than time: recyclable vs.
  consumable resources
- 🐣 Recognizing memoization as the practical, everyday version of the
  space-time tradeoff — and connecting it to the Ch5 "holder" pattern
- 🐣 Connecting the abstract asymmetry to concrete experience: variable reuse
  (Ch5 gatherers, holders) vs. step consumption
- 🐥 Appreciating that "correct" and "efficient" are both dependent on
  definitions that can be gamed (the cheating trio)
