# Chapter 5: Design Notes (Non-Learner-Facing)

## Functions Arc Decisions

### Why JSDoc-First Ordering

The functions arc (5.6–5.8) teaches JSDoc before functions. This mirrors a pattern established in earlier chapters:

- Ch1: names as communication — choose meaningful names before writing code
- Ch3: structured block comments describing programs — describe the program before implementing
- Ch5 representation sequence: prose strategy descriptions before pseudocode

JSDoc-first is intention-before-implementation applied to functions. Learners write the contract (`@param`, `@returns`, description) before they write the function body. This forces clarity about purpose and reinforces comprehension-before-production pedagogy.

### Why Functions in Chapter 5 (Not Chapter 6)

Functions were originally considered for chapter 6.0 (complexity). The decision to place them in ch5 after the algorithm patterns was driven by:

1. **Conceptual integrity**: wrapping algorithms in functions IS about algorithms — naming, documenting, and testing an algorithm's behavior. The function is a tool for working with algorithms, not a separate topic.
2. **Rhetorical model**: ch5 = algorithms, ch6 = complexity. Functions serve algorithms. If functions were in ch6, learners would be learning language features while trying to learn complexity analysis.
3. **Chapter 6 preparation**: having named, documented, tested functions makes ch6's efficiency comparisons concrete. Compare `isPalindromeReverse` vs. `isPalindromeConverging` — same contract, same tests, different performance.

### Functions Scope Constraints

Functions are deliberately limited:

- **Pure functions only** — output depends only on input, no side effects
- **Strings only** — consistent with ch5's string-algorithm constraint
- **Arrow syntax** — `const name = (params) => { ... }`
- **No closures** — functions don't capture outer scope variables
- **No higher-order functions** — no callbacks, no functions-as-arguments
- **No ES modules** — everything in a single file

These constraints keep the focus on the function abstraction itself, not on advanced function concepts. The next curriculum module covers arrays, objects, closures, and higher-order functions.

### Assertion → Unit Testing Progression

- 5.7 introduces `console.assert` as the simplest automated verification
- 5.8 upgrades to `describe`/`it`/`expect` for structure and reporting
- The transition is motivated by scaling: assertions work for 3-4 checks, but become unwieldy for thorough testing
- TDD (red-green-refactor) is introduced in 5.8 as a natural extension of the predict-execute-compare cycle

## Reference Material

Exercise patterns adapted from:

- `z-repo-inside-js/04-functions/` — function exercises (scramble→predict→provide args→write), JSDoc exercises, scope (local-param-parent)
- `z-repo-inside-js/05-unit-testing/` — describe/it/expect, TDD red-green-refactor, progressive test exercises (write-tests, pass-tests with blanks/bugs/empty)
- `z-repo-inside-js/06-es-modules/` — NOT used (single-file pattern chosen instead)

## "Can We Do Better?" Movement

The old 5.6 ("Can We Do Better?") was moved to ch6.1. It's fundamentally a complexity question — "which decomposition does more work?" — and belongs in the complexity chapter. With functions from 5.7, the three palindrome implementations become named, tested functions that ch6 can compare formally.

## Regex Isolation

Regex (5.9) stays in ch5 as a capstone interlude, not a ch6 complexity topic. Regex solutions can't be compared apples-to-apples with iterative solutions for complexity purposes (different paradigm, different computational model). With 5.6–5.8's tools, regex solutions can now be wrapped in functions and tested — making the paradigm comparison more concrete.

## Ch5 → Ch6 Connection (Novel Approach)

Ch5's observable dimensions become ch6's EXPLANATORY dimensions:

- **Iteration structure** determines complexity CLASS (single-pass → O(n), nested → O(n²))
- **Growth pattern**, **state**, **decisions** affect CONSTANTS within a class

This connection is genuinely novel — no other curriculum found explicitly maps decomposition patterns to complexity analysis. Both "predicts" and "doesn't always predict" are learning objectives for ch6.
