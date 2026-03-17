# Chapter 6: Design Notes (Non-Learner-Facing)

## Decision History

### Analytical Chain: 5+1 Questions

Originally proposed as 4+1 questions. The user added "Which complexity class is this?" (Classification) as question 5, making the chain 5+1. Rationale: classification is part of analysis (naming what you observe), while optimization (question 6) is a different skill entirely.

The chain is always applied together (questions 1–5), and front-loaded — all 5 questions introduced at the beginning, applied throughout. Subchapters go deeper on relevant questions without rigidly mapping 1:1.

### Representation Sequence

Designed to parallel Chapter 5's representation sequence. Each representation strips away detail:

- Count table → Ratio table → Growth curve → Growth formula → Dominant term → Big O

Count table is the foundation: manually fillable AND auto-verifiable by tracer. This dual nature supports the "learners do as much/little manual counting as needed" principle.

### Chapter Organization

Decided: organize by insight, not by complexity class or by mirroring Chapter 5's subchapter structure. The chain is front-loaded and applied throughout. Subchapters follow the chain's logic roughly, but not rigidly.

Subchapters 6.2+ are deliberately left open. Candidates for future subchapters:

- Growth rate variation within a class (best/worst case)
- Pattern ↔ class relationship (which ch5 patterns predict which complexity classes?)
- Constants matter / constants don't matter (when each is true)
- Big O formalization (the notation as vocabulary, not math)
- Full circle: palindrome returns with complete formal analysis
- Decomposition alternatives (question 6 gets its own focus)

### "Can We Do Better?" Placement

Moved from ch5 (old 5.6) to ch6.1. It's fundamentally a complexity question — "which decomposition does more work?" The qualitative version (observe, articulate, imagine) from ch5 is now quantified with count tables and the analytical chain. With functions from 5.7, the three palindrome implementations are named, documented, tested functions — making the comparison concrete.

The old 5.6 content was adapted, not copied. Key changes:
- Updated all cross-references (old 4.x → 5.x)
- Added counting methodology from 6.0
- Introduced first 3 representations (count table, ratio table, growth curve)
- Framed with the 5+1 analytical chain
- Forward-referenced functions and unit tests from 5.6–5.8

### 6.0: Counting Setup

6.0 is the methodology introduction, NOT a complexity-level subchapter. It teaches the counting tool and the count table format using simple algorithms (O(1) and O(n)) where patterns are obvious. The pedagogical goal is to establish the tool before using it on interesting comparisons.

### Space vs. Time

Confirmed as closing subchapter (number TBD). Content preserved from original ch6 index.md, including absurd algorithms (bogosort, miracle sort, sleep sort, Stalin sort, goalpost sort, intelligent design sort), memoization bridge, and Ryan Williams 2025 proof. May use arrays and functions beyond usual string-only constraint.

### Tracer Design

Deferred. The chapter is planned as though the tracer exists. The tracer config at `/0-study-lenses-committee/js-trace-config-for-skulpt-inspiratin.ts` provides the granular event model. Relevant config paths for ch6 counting:

- `lang.controlFlow.events.iteration` — counting loop iterations
- `lang.bindings.events.assign` — counting assignments
- `lang.controlFlow.events.test` — counting comparisons/conditions
- `lang.functions.events.call` — counting function calls

## Research Context

### Empirical-First Approach Validated

- Step-counting foundation used by Grokking Algorithms, Common-Sense Guide to Data Structures and Algorithms
- CS Unplugged research: 50% unplugged + 50% programming = same effectiveness as all programming, higher student confidence
- "What learners DO not SEE has greatest impact" (visualization research) — active counting > passive watching

### Ch5 → Ch6 Connection: Novel

The mapping from Chapter 5's observable dimensions (iteration structure, growth pattern, state, scope, decisions) to Chapter 6's explanatory dimensions (why this complexity class?) appears novel. No other curriculum found explicitly connects decomposition patterns to complexity analysis in this way. Both "predicts" and "doesn't always predict" are learning objectives.

### Manual vs. Automated Counting

No rigid order. Learners do as much manual counting as they need to build understanding, then use the tracer for verification and larger inputs. The tracer doesn't replace understanding — it augments it.

## Open Questions (NOT blocking implementation)

1. Which insights drive ch6 subchapters 6.2+?
2. Sequencing: empirical discovery before or after Big O notation?
3. "Full circle" palindrome return — own subchapter or climax of another?
4. Algorithm ↔ subchapter mapping for ch6
5. Space vs. Time subchapter number and exact content scope
6. How to handle best/worst/average case (if at all in this chapter)
