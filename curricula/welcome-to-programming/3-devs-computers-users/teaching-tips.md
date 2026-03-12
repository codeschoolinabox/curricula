---
sidebar_position: 99
---

# Teaching Tips: Chapter 3

## Design Notes: 3.1 User Input and Output

- **JS vs. Python divergence on user/dev distinction**: In JS (browser), the distinction is architecturally clear: `prompt`/`alert`/`confirm` are for users, `console.log` is for developers. In Python's standard terminal, both `print` and `input` share the same console, making the distinction conceptual rather than visible. Options: (a) be extra intentional about labeling which `print`s are for users vs. devs, (b) write prompt/alert/confirm wrappers for Python, (c) assume the browser-based Study Lenses environment. The curriculum prefers purely native language features with no magic dependencies, but this tension remains unresolved.

## Design Notes: 3.6 Plaintext Programs

- This is a palate cleanser between the intensive skill-building of 3.5 and the conceptual shift of Chapter 4. It reinforces that comprehension is a human skill, not a tool-dependent one.
- The exercises should use programs at the complexity level learners have already mastered — the challenge is the environment, not the code itself.
