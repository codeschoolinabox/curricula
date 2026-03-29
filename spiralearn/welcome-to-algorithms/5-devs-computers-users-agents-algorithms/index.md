# Chapter 5: Developers, Computers, Users, Agents, and Algorithms

> The same audiences, the same program structure, but now the "logic" section of
> each program is complex enough to study as an algorithm in its own right.

## Overview

This chapter is not a qualitative break from Chapters 0-3. It builds directly on
everything that came before. Every algorithm is still wrapped in a complete
user-facing program following the same structure established in Chapter 3:
validate input → do something with the input (the algorithm) → output a result
to the user. The programs may not be fascinating, and they may begin to feel a
little repetitive — that's intentional. The point is to connect algorithms to
user-facing behavior, not to create novel applications.

What _is_ new in this chapter is the focus on **Strategy** (the "S" in PBSI) as
the primary object of study. In earlier chapters, learners studied programs
holistically — purpose, behavior, strategy, and implementation together. Here,
the strategy layer becomes complex enough to deserve its own analytical tools
and representations.

The chapter also introduces a **representation sequence**: a progression of
increasingly abstract representations that each reveal different aspects of the
same algorithm. Learners don't just understand algorithms — they learn to
understand them _in multiple ways_, and to transition between those ways.

### Chapter 4's Internal Spiral: The Spider Web Model

The outer curriculum spirals through audiences (Chapters 0-5). Chapter 5
contains a **fresh spiral within that spiral**, organized like a spider web:

- **Concentric circles** represent algorithm complexity levels. Each subchapter
  (5.1, 5.2, ...) sits on a circle, moving outward from the simplest algorithms
  to the most complex techniques. The complexity comes from the algorithmic
  technique itself — not from language features, which are all introduced by
  5.0.

- **Radial lines** represent representation/abstraction levels. Every radial
  line extends from the center outward, taking the learner through a journey of
  abstraction: prose, flowcharts, pseudocode, decision tables, loop invariants,
  state transitions, pattern schemas, and finally complexity reasoning.

- **Every subchapter traverses ALL radial lines.** A learner studying a simple
  accumulation algorithm in 5.1 practices the same full set of representations
  as a learner studying a two-pointer technique in a later subchapter. The
  representations are the constant; algorithm complexity is the variable.

This means the representations themselves are practiced repeatedly at increasing
algorithmic difficulty, just as the outer curriculum revisits language features
at increasing complexity. Each representation becomes more natural and more
revealing as the learner encounters it across multiple algorithms — and each
algorithm becomes more deeply understood as the learner views it through
multiple representational lenses. The connections between representations, and
between algorithms, are themselves learning objectives (following the
"connections are concepts" principle).

### Language Feature Constraints

The curriculum maxes out at this set of features. Nothing new is added after
Chapter 5.0 (iteration constructs), except for functions in 5.6–5.8:

- Variables and primitive types
- Minimal operators (concatenation, basic arithmetic, logical, comparison)
- `if`/`else`
- `while`
- `for...of` / `for...in` (fixed iteration)
- `for` with incrementers (JS) / `for...in range` (Python)
- User string I/O (`prompt`/`alert`/`confirm` or `input`/`print`)
- `console.log` / `print`
- `break` / `continue`
- **Functions** (introduced in 5.6–5.8): arrow function expressions, parameters,
  return values, JSDoc, `console.assert`, unit testing
  (`describe`/`it`/`expect`)

Notable exclusions: arrays (beyond what strings provide), objects, closures,
higher-order functions, side effects. Functions are limited to pure functions on
strings — wrapping the algorithms from 5.1–5.5.

### The Representation Sequence: Abstraction Levels

Each algorithm is revisited through progressively abstract representations. The
principle: **each new representation strips away one more layer of concrete
detail, moving from "what happens" toward "what matters."**

| Phase      | Representation                        | What It Reveals                                                                                                               |
| ---------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Foundation | Traced it, predicted it, assembled it | The algorithm "in the hands" — concrete experience from earlier chapters                                                      |
| Pass 1     | **Prose strategy descriptions**       | The approach, not the lines — "scan left to right, keeping track of the longest run"                                          |
| Pass 2     | **Flowcharts**                        | The structural skeleton — loops within loops, branching, single-pass vs. multi-pass                                           |
| Pass 3     | **Pseudocode**                        | The right level of procedural detail — not too code-like, not too vague                                                       |
| Pass 4     | **Decision tables**                   | The algorithm's branching logic extracted and tabulated — all possible conditions and actions, independent of specific inputs |
| Pass 5     | **Loop invariants**                   | What's always true at key points in a loop — why the algorithm produces correct results                                       |
| Pass 6     | **State transitions**                 | Each iteration as a state tuple transformation — what changes vs. what's preserved                                            |
| Pass 7     | **Algorithmic pattern schemas**       | The algorithm as an instance of a general family: filter-accumulate, nested search, two-pointer, sliding window               |

Each pass, the learner understands the same algorithm differently. The sequence
connects the most abstract behavioral representation (pattern schemas) back to
the most concrete skill (tracing).

**Complexity analysis belongs to Chapter 6.** Step-counting, growth rate
reasoning, and Big O notation are qualitatively different from behavioral
representations — they measure HOW MUCH WORK an algorithm does rather than
describing WHAT it does. Chapter 6 formalizes these with dedicated tools. See
`../6-devs-computers-users-agents-algorithms-complexity/to-use/complexity-is-counting/`
for the exercise methodology that Chapter 6 will use.

The representation pass count (currently 8) is provisional. Some passes may be
removed or consolidated after testing which ones add genuine insight at each
subchapter's difficulty level.

### Abstraction Transitions as Exercise Design

The Abstraction Transition Taxonomy (Cutts et al.,
[`./assets/abstraction-transition-taxonomy.pdf`](./assets/abstraction-transition-taxonomy.pdf))
provides a framework for exercise design within the representation sequence. The
paper identifies three abstraction levels — English, CS Speak, and Code — and
argues that the _transitions between them_ are the core skill, not just
operating within a single level. Our representation sequence is a richer
gradient across the same spectrum:

- **Code level**: traces, actual programs
- **CS Speak level**: pseudocode, decision tables, loop invariants, state
  transitions, flowcharts, pattern schemas
- **English level**: prose strategy descriptions

Two key insights from the taxonomy shape how exercises are designed:

**1. Adjacent vs. distant transitions.** Moving between neighboring
representations (code → prose, pseudocode → decision table) is easier than
jumping across multiple levels (code → loop invariant, flowchart → pattern
schema). Each algorithm complexity circle in the spider web is traversed in
three phases:

- **Build up** (adjacent transitions): work through representations in sequence,
  each step one abstraction level from the previous. This is the first traversal
  of the representation sequence.
- **Connect across** (distant transitions): jump between non-adjacent
  representations. Can you go directly from code to a loop invariant? From a
  prose strategy to pseudocode for a _different_ algorithm in the same family?
  These exercises reveal whether the learner has internalized each
  representation or is mechanically following the adjacent sequence.
- **Justify** ("why" at any transition): not just "translate this code into X"
  but "explain _why_ X correctly captures what the algorithm does." The AT
  Taxonomy found that "why" questions — asking learners to rationalize their
  transitions — are critical for situated cognition but represent less than 15%
  of typical assessments.

This three-phase structure creates additional spiral passes within each
subchapter: the same algorithm at the same complexity level, revisited through
increasingly demanding exercises.

**2. Both "how" and "why" at every level.** Each representation transition has
two forms: "how" (perform the transition) and "why" (explain why your answer is
correct). This doubles the exercise space and ensures learners don't just
produce representations mechanically but understand the relationship between
them.

### Why String Algorithms (Not Sorting)

The curriculum uses string manipulation instead of sorting as the entry point to
algorithms. Three algorithm families are proposed:

1. **String searching / pattern matching** — easy to visualize (sliding a
   pattern across text), many variations with genuinely different strategies
   (brute force → using mismatch information → preprocessing). The jump from
   naive to optimized is a clear example of "what if we used information we're
   currently throwing away?"

2. **Traversal and accumulation** — frequency counting, run-length encoding,
   longest runs, histograms. These surface important ideas: single-pass vs.
   multi-pass, what state you carry, space-time tradeoffs. They compose
   naturally: frequency count → most common → top k.

3. **Two-pointer / sliding window** — palindrome checking, longest substring
   without repeats, partitioning. A genuinely different way of thinking about
   iteration. Understanding _why_ a two-pointer solution works is a real
   interpretive challenge, which aligns with the comprehension-first
   methodology.

### String Immutability as Pedagogical Tool

Because JS strings can't be mutated in place, every "transformation" algorithm
is actually an accumulation — building a new string character by character
(`let result = ''` growing in a loop). This consistent shape makes the
_differences_ between algorithms stand out: when every algorithm has the same
structure (iterate, decide, accumulate), the decision logic becomes the thing
you study. Immutability also makes code easier to trace and understand.

### Testing Approach

Algorithms are complete programs that process user input. "Test cases" are
documented in a block comment at the top with expected input/output pairs.
Learners manually input each case and study execution.

This works because typing in an input forces the question "what do I expect?"
before running. Stepping through execution means comparing prediction to
reality. That cycle — predict, execute, compare, revise understanding — is the
core learning loop.

**Test case sequencing is a deliberate pedagogical tool.** The order of test
cases is a curated narrative: a happy-path case, then an edge case that breaks a
naive mental model, then one that reveals a subtlety. Learners working through
them in order experience a sequence of productive surprises.

### The Functions Arc (5.6–5.8): Let's Name, Wrap, and Test

After the algorithm pattern subchapters (5.0–5.5), the chapter shifts focus. The
algorithms are understood. Now we give them a new form: named, documented,
testable functions.

The arc follows an intention-first progression that mirrors patterns from
earlier chapters:

1. **5.6 JSDoc** — describe the contract FIRST (intention before implementation,
   as with comments-before-code in Ch1 and structured program descriptions in
   Ch3)
2. **5.7 Functions** — implement the function to fulfill the JSDoc contract,
   with inline assertions (`console.assert`) for verification and scope
   exercises
3. **5.8 Unit Testing** — formalize verification with `describe`/`it`/`expect`,
   progressive test writing, red-green-refactor

The functions arc wraps algorithms learners already understand — this is NOT new
algorithmic thinking, it's restructuring known code into a testable, reusable
form. Functions are limited to pure functions on strings (no arrays, no
closures, no side effects), preserving the chapter's language constraints.

This arc is essential preparation for Chapter 6. With named, documented, tested
functions, learners can meaningfully compare the _efficiency_ of different
implementations that satisfy the same contract — the same JSDoc, the same tests,
different strategies, different amounts of work.

### The Analytical Chain: Smallest Problem → Growth → State → Language Features

> This chain of thought may need adjustment! Should it place state before
> growth? Revisit with some hand-run practice to feel it out.  
>  There was an earlier version that felt more natural but claude overwrote it
> then crashed and lost all context or memory.

The organizing principle for Chapter 5's subchapter progression is a chain of
reasoning learners apply to every algorithm. It is front-loaded in 5.1 — taught
explicitly with the simplest algorithms, then reinforced in every subsequent
subchapter. The chain applies both when STUDYING an existing algorithm ("what IS
the smallest case? how DOES it grow?") and when DESIGNING one ("what SHOULD the
smallest case be? how SHOULD it grow?").

1. **What is the smallest version of this problem?** What happens with 0
   elements? 1 element? 2? The smallest case reveals: what the answer is when
   there's (almost) nothing to process, what state the algorithm must start
   with, and what edge cases exist. This is a ritualized exercise: for every
   algorithm, learners try empty string, one character, two characters BEFORE
   studying the full implementation.

2. **How does the solution grow as the input grows?** When we go from n to n+1
   elements, what new work happens? This growth pattern is the subproblem
   structure — the type of decomposition that characterizes the algorithm. Each
   subchapter introduces a new growth pattern:
   - 5.1: Each element processed independently (growth adds one isolated step)
   - 5.2: Each element depends on the previous (growth extends a chain)
   - 5.3: Multiple complete passes compose (growth requires solving A before B)
   - 5.4: Each element spawns a scan of others (growth is nested)
   - 5.5: Two perspectives converge (growth shrinks from both ends)

3. **What does each step need to remember and see?** State (what carries between
   iterations) and scope of attention (what each iteration examines). Both
   follow from the growth pattern. Variable roles from prior chapters (gatherer,
   holder, flag, stepper) help learners name the state they see.

4. **What language features realize this?** Iteration structure, operators,
   control flow — all consequences of the above.

**Design principle:** Growth pattern (subproblem structure) drives subchapter
boundaries. Each subchapter introduces a new TYPE of growth. State, scope, and
iteration are observable consequences. Decision complexity provides the internal
gradient within each subchapter.

**Why smallest-problem-first:** (1) Concrete and actionable — learners literally
run 0, 1, 2-element inputs. (2) Connects directly to the predict-execute-compare
cycle from earlier chapters. (3) The chain maps to recursion: smallest problem →
base case, growth pattern → recursive step, state → parameters. This is a design
constraint on the recursion module: it must use the same vocabulary.

**Vocabulary note:** "Smallest problem" and "growth pattern" are the
learner-facing terms in 5.1–5.2. "Subproblem structure" and "decomposition type"
are introduced as formal vocabulary in 5.3+ when growth patterns become complex
enough to need names. Both refer to the same thing — how an algorithm's work
relates to input size. Learners encounter the concrete experience first, then
learn the formal vocabulary. This also operationalizes PBSI's "Strategy" level:
strategy = growth pattern + state design + scope + realization.

### Observable Dimensions

These are what learners point to in actual code. They're consequences of the
analytical chain, not independent axes:

1. **State complexity** — number and roles of tracking variables (follows from:
   what the subproblem needs to carry forward)
2. **Scope of attention** — what each iteration needs to see (follows from: what
   the subproblem needs to examine)
3. **Decision complexity** — none, simple filter, state-dependent, compound
   (follows from: what the subproblem asks you to decide)
4. **Iteration structure** — sequential, multi-pass, nested, two-pointer
   (follows from: how subproblems are sequenced)
5. **Output construction** — boolean, numeric, string transformation

Growth rate analysis (O(n), O(n²), etc.) is an observable dimension that belongs
to Chapter 6. In Chapter 5, growth rate is observed qualitatively but not
formally measured — Chapter 6.1 ("Can We Do Better?") creates the motivating
question that Chapter 6 answers with rigor.

### Exercise Framework

Three layers combine to create the full exercise structure for each algorithm:

**Layer 1: Code Ownership Progression (PRIMMy scaffold)**

The fading scaffold applies to the CODE itself. The progression controls how
much of the program the learner creates:

1. **Study** — read and trace a finished program (pure comprehension)
2. **Fill in blanks** — given a mostly-complete program, fill in the missing
   pieces
3. **Fix bugs** — given a broken program, identify and fix errors
4. **Write chunks** — given a skeleton/outline, write the missing sections
5. **Empty file** — create the program from scratch

At EACH ownership level, once the program is complete (either as given or as
finished by the learner), they translate it to all abstraction levels in the
representation sequence. So a learner studying a finished reverse-a-string
program writes prose, draws a flowchart, writes pseudocode, etc. for that same
program. Then at the next ownership level (fill in blanks), they complete a
different program and AGAIN translate it across all representations. The
scaffold controls CODE ownership; the representations are the PRACTICE performed
on the completed code.

**Representation scaffolding as secondary technique:** The scaffold can also be
applied to the representations themselves — providing an incomplete flowchart to
fill in, a buggy pseudocode to fix, or some-but-not-all representations where
learners must ensure all levels align. This is a game-time decision per
exercise, depending on where it sits in the spiral and what learning objective
it serves.

**Layer 2: AT Taxonomy Transitions (between representations)**

The Abstraction Transition Taxonomy structures exercises as transitions BETWEEN
representation levels:

- **Adjacent transitions** (build up): code → prose → flowchart → pseudocode
  (each step abstracts one layer). These are the primary exercises as each
  representation is introduced.
- **Distant transitions** (connect across): code → loop invariant, flowchart →
  pattern schema, prose → state transition table. These test whether learners
  have internalized each representation independently. Introduced after adjacent
  transitions are comfortable.
- **"How" and "why" questions**: Each transition has two forms. "How": perform
  the transition (write the prose for this code). "Why": explain why your answer
  is correct (why does this prose accurately describe the code's strategy?).
  "Why" questions are critical for deep comprehension but easy to omit — they
  should be explicit in every subchapter.

**Layer 3: Test Case Sequencing (per algorithm)**

Test cases are written as input/output pairs in a doc comment. Learners manually
run each case, predicting the output before executing. The ORDER of test cases
is a curated narrative:

1. A happy-path case demonstrating normal behavior
2. An edge case that breaks a naive mental model
3. A case that reveals a subtlety

Typing in input forces "what do I expect?" before running. The
predict-execute-compare cycle is the core learning loop. The test case sequence
is essentially a READING of the algorithm, guiding interpretation.

**The 2D matrix — ownership × abstraction:** The code ownership progression
(study → blanks → bugs → chunks → empty) creates one axis. The representation
sequence (trace tables, prose, flowcharts, pseudocode, etc.) creates the other.
The exercise space is two-dimensional: ownership (how much of the code did I
create?) × abstraction (what representation am I working with?). A learner who
filled in blanks to complete a program then writes prose for it, draws a
flowchart, writes pseudocode — all for the same completed program — before
moving to the "fix bugs" ownership level with a different program and repeating
across abstractions. This interleaving builds genuine fluency: each abstraction
is practiced at every ownership level, and each ownership level is practiced
across all abstractions.

**Layer interactions:** A single algorithm might have exercises like: complete a
program by filling in blanks (Layer 1), then translate the finished program to a
loop invariant (Layer 2: code→invariant transition at blanks-level ownership),
then explain why the invariant correctly describes the loop's behavior (Layer 2
"why" question), while working through test cases that reveal why the invariant
matters (Layer 3). Representation scaffolding (incomplete flowchart, buggy
pseudocode) can be layered in when alignment between representations is the
learning goal. Additional exercise types (Parsons problems, drawing exercises,
trace table completion) fit naturally into the ownership gradient at various
points.

### Studying with LLMs: Generating and Evaluating Representations

This is where LLM-as-study-partner reaches its most sophisticated form. LLMs can
generate every representation in the sequence — prose strategy descriptions,
pseudocode, decision tables, loop invariant statements, state transition
descriptions, pattern schema classifications, and complexity explanations. The
study approach is not to accept these as answers, but to use them as material
for critical evaluation:

- Can you spot where the LLM's prose strategy is imprecise or skips a step?
- Can you improve its pseudocode based on your own tracing?
- Does its loop invariant actually hold at every iteration? How would you
  verify?
- Does its complexity explanation match what you observe when you step through
  execution?
- Can you generate a _better_ representation than the LLM did?
- Can the LLM produce a distant transition (e.g., code → loop invariant) that
  you can verify against your own adjacent build-up?

This inverts the typical AI-in-education concern. Instead of learners passively
consuming AI output, the representation sequence gives them a structured
framework for _evaluating_ it — and the skills to do so rigorously. More
representations means more to evaluate, more transitions to verify, and a richer
space for productive disagreement with AI output.

## Subchapters

- [5.0: Iteration Setup](./5.0-iteration-setup.md)
- [5.1: Each Element Independently](./5.1-each-element-independently.md)
- [5.2: Adjacent Element Relationships](./5.2-adjacent-element-relationships.md)
- [5.3: Composed Scans](./5.3-composed-scans.md)
- [5.4: Global Element Relationships](./5.4-global-element-relationships.md)
- [5.5: Two Independent Perspectives](./5.5-two-independent-perspectives.md)
- [5.6: JSDoc — Describing the Contract](./5.6-jsdoc.md)
- [5.7: Functions — Naming, Wrapping, and Verifying](./5.7-functions.md)
- [5.8: Unit Testing — Formalizing Verification](./5.8-unit-testing.md)
- [5.9: Regex — A Different Paradigm](./5.9-regex.md)

## Subchapter Summary Table

Growth pattern drives subchapter boundaries; decisions drive the internal
gradient within each subchapter. State, scope, and iteration are consequences.
Growth rate analysis belongs to Chapter 6.

| Sub | Title                        | Growth Pattern              | State                | Scope                | Decisions (gradient)                          | Iteration      |
| --- | ---------------------------- | --------------------------- | -------------------- | -------------------- | --------------------------------------------- | -------------- |
| 5.0 | Iteration Setup              | —                           | —                    | —                    | —                                             | all types      |
| 5.1 | Each Element Independently   | independent steps           | 1 gatherer           | current / fixed ref  | none → filter → two-branch                    | single pass    |
| 5.2 | Adjacent Relationships       | dependent chain             | gatherer + holder(s) | current vs. previous | simple state-dep → multi-outcome → compound   | single pass    |
| 5.3 | Composed Scans               | hierarchical (A then B)     | cross-pass results   | prior scan info      | per-pass familiar, inter-pass new             | multi-pass     |
| 5.4 | Global Relationships         | nested (outer spawns inner) | multiple interacting | any/all positions    | simple nested → nested+exit → nested+tracking | nested loops   |
| 5.5 | Two Perspectives             | converging (shrinking)      | 2 steppers           | two positions        | symmetric → asymmetric                        | dual-var while |
| 5.6 | JSDoc — The Contract         | —                           | —                    | —                    | —                                             | —              |
| 5.7 | Functions — Wrap & Verify    | —                           | local scope          | function body        | —                                             | —              |
| 5.8 | Unit Testing                 | —                           | —                    | —                    | —                                             | —              |
| 5.9 | Regex — A Different Paradigm | don't decompose — declare   | (implicit)           | pattern              | —                                             | —              |

## Algorithm Family Distribution

The three families emerge across subchapters rather than being taught as blocks:

- **Traversal/accumulation**: primary family in 5.1 and 5.2, where the focus is
  on what you do as you traverse
- **Composed operations**: introduced in 5.3, where multiple traversals are
  combined
- **String searching**: enters in 5.4 with substring search, the motivating use
  case for nested iteration
- **Two-pointer**: arrives in 5.5 as part of the convergence theme

The "pattern schema" representation is where learners explicitly name these
families and recognize that algorithms from different subchapters belong to the
same structural family.

## Key Cross-Subchapter Comparison Moments

These are the "connections are concepts" moments — exercises that explicitly
bridge subchapters. Each reveals how the same problem (or similar problems) can
be decomposed differently. They continue the "comparing two programs that
produce the same output but work differently" skill from Chapters 0-3, but the
comparison evolves: in earlier chapters it's "same behavior, different
implementation." In Chapter 5 it becomes "same behavior, different growth
pattern / decomposition."

1. **5.1 → 5.2**: "count vowels" vs. "count runs" — same counter pattern, but
   the subproblem is independent in 5.1 ("is this a vowel?") vs. dependent in
   5.2 ("did the character change?"). Same code shape, different decomposition —
   and state requirements follow directly.
2. **5.2 → 5.3**: "longest run" (one pass, sequential dependent subproblems) vs.
   "most common vowel" (multiple passes, hierarchical decomposition) — when does
   local dependency suffice, and when must you decompose hierarchically?
3. **5.3 → 5.4**: "does A contain all chars in B?" can be decomposed
   hierarchically (sequential scans, 5.3) or as nested subproblems (nested
   loops, 5.4) — comparing the two reveals the relationship between hierarchical
   and nested decomposition.
4. **5.2 → 5.4**: "longest run" (single pass, sequential dependent) vs. "all
   unique" (nested subproblems) — same question type (character relationships),
   different decomposition, dramatically different amounts of work. The
   efficiency question emerges from the decomposition choice.
5. **5.4 → 5.5**: Palindrome via nested subproblems (5.4-style) vs. converging
   subproblems (5.5) — dramatically less work. A different decomposition of the
   same problem eliminates redundant work.
6. **5.1/5.4/5.5 → 6.1**: Palindrome three ways — independent subproblems
   building reversed string (5.1), nested subproblems comparing pairs (5.4),
   converging subproblems from both ends (5.5). Same behavior, three
   decompositions. Chapter 6.1 unpacks this qualitatively: _which feels like
   more work, and why?_ With functions from 5.7, each decomposition is a named,
   tested function — making the comparison concrete.
7. **5.4 → 6.1**: Substring search — "what information are we throwing away on
   mismatch?" "All unique" — "what data structure would eliminate redundant
   sub-problems?" Chapter 6.1 turns these into decomposition reasoning
   exercises.
8. **5.1–5.5 → 5.9**: Regex solutions to problems previously solved iteratively.
   Declarative pattern vs. explicit decomposition — a paradigm comparison that
   asks: what happens when you don't decompose at all? With 5.6–5.8's tools,
   both solutions can share the same JSDoc and tests.

## Design Resources

- [`./assets/abstraction-transition-taxonomy.pdf`](./assets/abstraction-transition-taxonomy.pdf)
  — the AT Taxonomy paper informing exercise design (adjacent/distant
  transitions, how/why question types)
- `../6-devs-computers-users-agents-algorithms-complexity/to-use/complexity-is-counting/`
  — the exercise methodology for Chapter 6's complexity analysis
- The pre-algorithm skills from Chapters 0-3 (predictive stepping, variable
  tracing, PBSI, describing programs, comparing programs with same output but
  different strategies)
