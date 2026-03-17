---
sidebar_position: 99
---

# Teaching Tips: Chapter 2

## Design Notes: 2.4 Types and Operators

- **JS vs. Python divergence**: This is the first subchapter where the two language tracks diverge meaningfully. JS has `undefined` and `null` (both encountered), loose equality quirks, and string-number coercion. Python has `None`, no implicit coercion, and clearer int/float distinction. The curriculum should address these differences explicitly rather than pretending they don't exist.
- **String methods scope**: The selected string methods (`.length`, indexing, slicing, `.includes`, case conversion) are exactly what's needed for the algorithm chapter. Nothing more is included.

## Design Notes: 2.5 Be the Computer

- These games are an outstanding way to practice code stepping — call it "computer empathy." You're not observing the computer; you _are_ the computer.
- **Discovery-based design**: Both games deliberately provide no upfront explanation. The creators explicitly advise teachers NOT to explain the rules — figuring it out by reading the code is the point. That "eureka" moment is the learning. Resist the urge to over-prepare learners.
- Both games foreshadow control flow structures (conditionals, loops) that learners won't formally encounter until Chapter 3. This is intentional: the games build physical intuition for branching and repetition before learners have vocabulary for it. When `if` and `while` arrive, they'll already feel familiar.
- This is a reward and reset between the intensive type system survey of 2.4 and the conceptual shift of Chapter 3 (where users enter the picture). The challenge is the game format, not the code concepts — which learners have already practiced.
- Both games are also referenced in [`./predictive-stepping.md`](./predictive-stepping.md) as preparation for predictive stepping. Placing them here gives learners an explicit curricular moment to play them.
- The "right now" framing is deliberate: it combats the common beginner instinct to try to understand an entire program all at once. These games make it viscerally obvious that execution is sequential and local — you literally can't skip ahead.
