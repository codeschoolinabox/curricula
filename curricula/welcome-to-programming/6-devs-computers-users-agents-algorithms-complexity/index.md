# Chapter 6: Developers, Computers, Users, Agents, Algorithms, and Complexity

> The same algorithms, the same programs, but now we ask: **how much work does it do?**

## Overview

This chapter does not introduce new language features or new algorithms. It revisits the algorithms from Chapter 4 through a quantitative lens. Where Chapter 4 asks "what does this algorithm do?" and "how does it decompose the problem?", Chapter 5 asks "how much work does it do?" and "how does the work grow as the input grows?"

Chapter 4 subchapter 4.6 created these questions qualitatively — learners observed that different decompositions of the same problem produce different amounts of work and articulated why in terms of growth patterns. Chapter 5 provides the formal tools to answer those questions with precision: step-counting, growth rate tables, and Big O notation.

### What This Chapter Is

- A quantitative re-examination of algorithms learners already understand behaviorally
- An empirical methodology (counting steps) before formal notation (Big O)
- A bridge from "which feels like more work?" to "which IS more work, and by how much?"

### What This Chapter Is Not

- Not a survey of new algorithms — every algorithm studied here was already encountered in Chapter 4
- Not a math course — formal notation is introduced as a tool for expressing patterns learners have already discovered empirically
- Not a comprehensive complexity theory curriculum — best/worst/average case analysis, amortized analysis, and space complexity are largely out of scope (see Open Questions)

## Core Methodology: Complexity is Counting

The chapter's methodology is concrete and empirical. Learners count steps before they learn notation.

The exercise loop:

1. Take an algorithm from Chapter 5
2. Run it with inputs of increasing size
3. Count the steps executed (using `python -m trace -c` or equivalent)
4. Organize results by input size — look for patterns
5. Identify which lines are "constant" (run the same number of times regardless of input) and which "grow" with input
6. Form hypotheses about the growth pattern, test them with new inputs
7. Connect the growth pattern back to the algorithm's decomposition strategy from Chapter 4

This pairs directly with **predictive stepping** (established in Chapter 2): predict how many steps, run, check, investigate. The skill is the same — the object of prediction shifts from "what happens next" to "how many times does this happen."

See [`./to-use/complexity-is-counting/`](./to-use/complexity-is-counting/) for the exercise methodology and examples.

## Provisional Subchapters

_(Stubby — to be fully designed when we return to implement this chapter.)_

### 6.0: Counting Steps

The methodology itself. How to count steps, how to organize results, how to identify constant vs. growing lines. Applied to simple programs (straight-line code, single loops) where the patterns are obvious.

- 🥚 Counting the number of steps a program executes for a given input, using trace tools or manual counting
- 🥚 Organizing step counts by input size in a table and identifying which lines run a constant number of times vs. which grow with input
- 🐣 Forming and testing hypotheses about growth patterns from step-count data — predict the count for a new input size, then check
- 🐣 Connecting step-counting to predictive stepping (Ch2): same predict-check-investigate cycle, but the object of prediction shifts from "what happens next" to "how many times does this happen"

### 6.1: Linear Algorithms Revisited

Chapter 4's single-pass algorithms (4.1 independent subproblems, 4.2 adjacent relationships) through the counting lens. Learners discover that single-pass algorithms grow proportionally with input size. The concept of O(n) emerges from empirical observation.

- 🥚 Counting steps for Chapter 4's single-pass algorithms (4.1 independent subproblems, 4.2 adjacent relationships) across increasing input sizes
- 🥚 Identifying from step-count tables that single-pass algorithms produce step counts growing proportionally with input size
- 🐣 Discovering O(n) as a name for the linear growth pattern observed empirically — the notation emerges from the data, not from a definition
- 🐣 Connecting linear growth back to the independent/dependent-chain decomposition strategies from Ch4: one pass through the input → one unit of growth per element

### 6.2: Nested Algorithms Revisited

Chapter 4's nested-loop algorithms (4.4 global relationships) through the counting lens. Learners discover that nested loops produce step counts that grow as a product. The concept of O(n²) emerges from comparison with 5.1's linear results.

- 🥚 Counting steps for Chapter 4's nested-loop algorithms (4.4 global relationships) across increasing input sizes
- 🥚 Identifying from step-count tables that nested loops produce step counts growing as a product (roughly n × n)
- 🐣 Discovering O(n²) by comparing nested-algorithm step counts with 5.1's linear results — the quadratic pattern becomes obvious in the table
- 🐣 Connecting quadratic growth back to the nested-subproblem decomposition from Ch4: each of n positions spawns a scan of up to n other positions

### 6.3: Growth Rate Reasoning

Comparing growth curves. When does the difference between O(n) and O(n²) matter? At what input sizes? Step-count tables and (possibly) growth curve visualizations. The quantitative version of 4.6's qualitative "which feels like more work?"

- 🥚 Comparing growth rate tables for O(n) and O(n²) algorithms side by side
- 🐣 Identifying at what input sizes the difference between O(n) and O(n²) starts to matter practically — "at n=10 it barely matters, at n=1000 it's catastrophic"
- 🐣 Reasoning about why a small constant factor becomes irrelevant as input grows — observed in the data, not proved
- 🐥 Interpreting growth curve visualizations (if introduced) — reading a graph as another representation of the same step-count data

### 6.4: Big O Notation

Formalizing what learners already know from step-counting into standard notation. Big O as a vocabulary for growth patterns already discovered empirically. Constants don't matter. Lower-order terms don't matter. Why not — demonstrated with step-count data, not proved mathematically.

- 🥚 Using Big O notation to express growth patterns already discovered empirically through step-counting
- 🥚 Explaining why constants don't matter and lower-order terms don't matter — demonstrated with step-count data, not proved mathematically
- 🐣 Translating between step-count patterns and Big O notation in both directions: given a table, name the Big O; given a Big O, predict the table shape
- 🐣 Classifying algorithms from Chapter 4 using Big O vocabulary

### 6.5: Decomposition and Complexity

4.6's comparisons revisited with formal measurement tools. Palindrome three ways — now with step counts and Big O. Substring search — now with concrete growth rate comparison. The formal payoff of questions raised qualitatively in Chapter 4.

- 🥚 Comparing palindrome three ways with step counts and Big O — the formal version of 4.6's qualitative comparison
- 🐣 Measuring the concrete growth rate difference between decompositions of the same problem using step-count tables
- 🐣 Connecting decomposition choice (from Ch4) to complexity class (from Ch5): different strategies → different Big O → different amounts of work at scale
- 🐥 Articulating why "can we do better?" (4.6) is now a formally answerable question, not just a qualitative feeling

## Relationship to Chapter 4

| Chapter 4                                                       | Chapter 5                                                        |
| --------------------------------------------------------------- | ---------------------------------------------------------------- |
| "What does this algorithm do?"                                  | "How much work does it do?"                                      |
| Behavioral representations (prose, flowcharts, pseudocode, ...) | Quantitative representations (step counts, growth tables, Big O) |
| Growth patterns as decomposition strategies                     | Growth patterns as complexity classes                            |
| 4.6: "Which feels like more work?"                              | 5.3–5.5: "Which IS more work, by how much, and why?"             |
| Qualitative intuition                                           | Formal measurement                                               |

The growth pattern vocabulary from Chapter 4 maps directly:

- **Independent subproblems** (4.1) → O(n)
- **Dependent chain** (4.2) → O(n)
- **Hierarchical / composed** (4.3) → O(n) per pass × number of passes
- **Nested subproblems** (4.4) → O(n²)
- **Converging subproblems** (4.5) → O(n) or O(n/2)

## Status

To be designed after Chapter 5 exercises are implemented. See [Teaching Tips](./teaching-tips.md) for open questions and design notes.

---

## 6.6: Space vs. Time (via Absurd Algorithms)

A fun interlude. Chapter 5 has been counting steps — measuring _time_. But there's another resource algorithms consume: _memory_ (space). Is one fundamentally more expensive than the other?

To explore this question, we turn to a collection of intentionally absurd sorting algorithms. Each one wastes resources in a different, entertaining way. The point is not the algorithms themselves — it's what they reveal about the relationship between space and time.

### The Exhibits

**Time-catastrophic, space-cheap:**

- **Bogosort** ([Wikipedia](https://en.wikipedia.org/wiki/Bogosort)): Randomly shuffle the array. Check if it's sorted. If not, shuffle again. Expected O(n×n!) time, O(1) extra space. The array gets reused every shuffle — the space is recyclable. The time is not.
- **Miracle sort** ([source](https://blog.oscarmcglone.com/posts/weird-sorting-algorithms/)): Check if the array is sorted. If not, wait a bit and check again. Hope for a cosmic ray to flip the right bits. O(∞) expected time, O(1) space. The logical extreme of "maybe it'll just work out."

**Time-cheap, space-catastrophic:**

- **Lookup table extreme** (thought experiment): Precompute the sorted output for every possible input array and store them all. O(1) lookup time, but the storage required to hold every permutation of every possible array is... well, more atoms than exist in the universe. The opposite extreme of bogosort — trading infinite space for instant time.

**Converts time into something else entirely:**

- **Sleep sort**: For each element, create a thread that sleeps for a duration proportional to its value, then outputs the value when it wakes up. The values come out in order because smaller numbers wake up first. O(max(input)) wall time, O(n) space for threads. A literal demonstration that time is a resource — here it's not just spent, it _is_ the sorting mechanism.

**Cheats the problem instead of solving it:**

These three algorithms raise a question that connects back to Chapter 3's discussion of specs and behavior: _what does it even mean for an algorithm to be "correct"?_

- **Stalin sort** ([source](https://blog.oscarmcglone.com/posts/weird-sorting-algorithms/)): Iterate through the array. Remove any element that's out of order. O(n) time, O(1) space. The output is sorted... but it's not the same data. The algorithm "solves" the problem by deleting what doesn't fit.
- **Goalpost sort** (original, see code below): Don't sort the array — instead, generate a custom `areSorted` function that returns `true` for exactly this array in exactly this order. O(n) time, O(n) space. The output is "sorted" by a definition that was written to match it. The algorithm "solves" the problem by redefining success.
- **Intelligent Design sort** ([source](https://www.dangermouse.net/esoteric/intelligentdesignsort.html)): The probability of the input being in this exact order is 1/n!. Something that unlikely can't have happened by chance — it must have been intentionally put in that order by an intelligent Sorter. The array is already sorted in a way that transcends our naive understanding of "ascending order." O(1) time, O(1) space. Does literally nothing. The algorithm "solves" the problem by declaring victory.

**Goalpost sort — the code:**

```js
const goalpostSort = (nums = []) => ({
  numbers: Object.freeze([...nums]),
  areSorted: eval(
    `(nums=[${nums.join(",")}]) => true ${nums
      .map((n, i) => `&& nums[${i}] === ${n}`)
      .join(" ")}`,
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

Bogosort reuses the same memory over and over — each shuffle overwrites the last. The space is _recyclable_. But every shuffle takes time that's gone forever. Time is _spent_.

This isn't just a practical observation. Learners have already experienced this asymmetry in Chapter 4: a gatherer variable gets overwritten on every iteration (space reused), but each iteration step is executed and gone (time consumed).

### The Practical Version: Memoization

The absurd exhibits show the extremes. But real engineers make this tradeoff every day — they just do it sensibly. The technique is called **memoization**: store results you've already computed so you don't recompute them.

The idea is simple: before doing expensive work, check "have I already done this?" If yes, look up the stored answer (spend space, save time). If no, do the work and store the result for next time.

Learners have already encountered a primitive version of this in Chapter 4. A "holder" variable that stores a previous best result to avoid re-examining earlier elements is memoization at its simplest — spending one variable (space) to avoid repeating a scan (time). Memoization generalizes this: instead of one variable, use a whole cache. Instead of one previous result, store every result you've ever computed.

This sits in the middle of the space-time spectrum:

| Approach              | Time                     | Space              | Strategy                                 |
| --------------------- | ------------------------ | ------------------ | ---------------------------------------- |
| Recompute every time  | High                     | Low                | Spend time, save space                   |
| **Memoize**           | **Low after first call** | **Medium (cache)** | **Spend space to save time**             |
| Precompute everything | O(1) lookup              | Absurd             | Spend all the space to save all the time |

Memoization is the lookup table extreme made practical — instead of precomputing every possible answer, you cache answers _as you encounter them_. It's the sensible version of a ridiculous idea.

### The Proof: Space Always Wins

In 2025, [Ryan Williams proved](https://blog.computationalcomplexity.org/2025/02/you-need-much-less-memory-than-time.html) that this asymmetry is fundamental. Any algorithm that runs in time t(n) can be simulated using only ~√t(n) space. Space is provably, fundamentally cheaper than time.

The intuition: you can reuse memory, but you can't reuse time. A variable that was used in step 1 can be overwritten and reused in step 1000. But step 1 itself is gone — you can't get it back. Memory is a recyclable resource. Time is a consumable one.

This is why the lookup table extreme is more absurd than bogosort. You could (in theory) compress space by reusing it. You can never compress time.

### Language Features

- (nothing new — this subchapter may use arrays and functions beyond the curriculum's usual string-only constraint, because the point is the complexity analysis, not the data structures)

### Skills and Objectives

- 🥚 Applying step-counting and Big O analysis to absurd algorithms — same tools, funnier inputs
- 🥚 Distinguishing between time complexity and space complexity as two separate resource measures
- 🐣 Understanding why space is fundamentally cheaper than time: recyclable vs. consumable resources
- 🐣 Recognizing memoization as the practical, everyday version of the space-time tradeoff — and connecting it to the Ch4 "holder" pattern
- 🐣 Connecting the abstract asymmetry to concrete experience: variable reuse (Ch4 gatherers, holders) vs. step consumption
- 🐥 Appreciating that "correct" and "efficient" are both dependent on definitions that can be gamed (the cheating trio)

See [Teaching Tips](./teaching-tips.md) for design notes and open questions.
