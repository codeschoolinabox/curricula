---
sidebar_position: 99
---

# Teaching Tips: Chapter 6

## Design Notes: 6.6 Space vs. Time (Absurd Algorithms)

- The absurd algorithms are the _vehicle_, not the _objective_. The objective is
  understanding the space vs. time asymmetry and why it matters.
- The "cheating" algorithms (Stalin, goalpost, intelligent design) connect back
  to Chapter 3's discussion of specs, behavior, and what "correct" means.
  They're funny because they expose that even "correctness" is defined by a spec
  — and a spec can be wrong, gamed, or absurd.
- The Williams result is the punchline, not the starting point. Build from
  concrete absurdity to abstract insight, not the other way around.
- This subchapter partially answers the open question about space complexity
  (see chapter index): it gets introduced through the fun diversion's back door,
  in a context where it's immediately meaningful. Formal space complexity
  analysis can wait for a more advanced curriculum.
- The constraint relaxation (arrays, functions) is intentional. Like regex in
  5.9 and plaintext programs in 3.6, the fun-diversion shifts the rules. The
  point is the resource analysis, not the data structures.

## Open Questions

_(To be resolved when we return to fully design this chapter.)_

- **Representation sequence:** Should this chapter use the same 7-pass
  representation sequence as Chapter 5, or a reduced set focused on
  counting-oriented representations?
- **Formal math:** How much mathematical notation is appropriate for this
  audience? Is Big O sufficient, or should Theta/Omega be mentioned?
- **Space complexity:** Time complexity is the focus. Should space complexity be
  introduced at all, or is that for a later curriculum?
- **Best/worst/average case:** Should the chapter address input-dependent
  variation (e.g., already-sorted inputs for bubble sort), or focus exclusively
  on worst case?
- **Exercise adaptation:** The existing `complexity-is-counting/` exercises use
  Python with arrays and functions. These need to be adapted to the string-only,
  no-functions constraints of this curriculum — or we need to justify where
  those constraints can be relaxed for Chapter 6.
- **Visualizations:** Should the chapter introduce growth curve graphs or
  step-count scatter plots? This would be a new kind of artifact not present in
  earlier chapters.
- **Multi-pass algorithms:** Chapter 5's composed scans (5.3) involve multiple
  passes. How should multi-pass complexity be counted — per pass, or total? This
  is a genuine conceptual question for learners.
