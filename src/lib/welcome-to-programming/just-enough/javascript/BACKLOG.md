# Backlog

Deferred features for `just-enough-javascript`. Not currently needed — tracked
here so the rationale isn't lost.

## ESLint-Based Validation Expansion

Augment `verify-language-level/` with ESLint rules beyond the current AST
allowlist. The validation pipeline already walks the AST — ESLint rules (e.g.
complexity thresholds, naming conventions, style enforcement) could be plugged
in as an additional validation pass. This would let the language level enforce
not just "what syntax is allowed" but also "how well is it written."

## Complexity Analysis Export

> fold into hints in refactor, or does it deserve it's own interface?
> over-complexity could jsut be a hint and the api stays simpler

Wrap an ESLint complexity plugin (e.g. sonarjs or similar — already in use in
the project's own linting) as a standalone function and export it from
`index.ts`. Returns complexity metrics (cyclomatic complexity, nesting depth,
etc.) for learner code.

All four API wrappers (`validate`, `run`, `debug`, `trace`) would include
complexity data in their result objects alongside the existing
`ok`/`error`/`rejections`/`warnings` fields. This gives exercises and UI tools a
built-in "your solution works but is more complex than needed" signal without
requiring external tooling.
