# just-enough-javascript (language level)

The package's first **language level**: the semantic models and admission gate
behind JEJ — _just-enough JavaScript_. A language level is semantic, not
syntactic (see
[the package README § A language level is semantic, not syntactic](../../../README.md#a-language-level-is-semantic-not-syntactic)):
it provides the models the notional machine runs on, and admits exactly the
programs those models can tell the truth about.

## What this level provides

- **Semantic models** for the NM's three language-level phases:
  - **realm** — the curated just-enough world: which intrinsics and host
    bindings exist before any code runs.
  - **creation** — script-scope setup: `let`/`const` declarations, the temporal
    dead zone, block scoping. (No `var`, no function declarations — excluded
    precisely because their hoisting semantics sit outside this level's model.)
  - **evaluation** — the trace-tier machine: expression evaluation, scope chain
    walks, coercion, and control flow as observable NM events.
- **The admission gate** — the validator. Runs iff the snippet's source type is
  `module` and it parsed; the gate criterion is `validation.isJeJ` (zero
  violations). Implemented by [`../../lib/validating/`](../../lib/validating/),
  whose `SyntaxAllowlist` config is this level's syntax surface — derived from
  the semantic models above, feature by feature.
- **The level's documentation** —
  [`notional-machine.md`](./notional-machine.md), the semantic models in prose
  (the machine this level claims), and [`reference.md`](./reference.md), the
  learner-facing reference of what the gate admits.

## Module posture

JEJ study rides the `module` source type: module programs are strict-mode
JavaScript natively — no `"use strict"` injection, no line shift — and strict
semantics are what this level's models describe (silent-global creation,
sloppy-mode coercions, and `with` are not modeled here; strict mode removes
them). Under the `script` source type no language level is active: the admission
gate never runs and the level's three phases are absent from the embodiment.

## What this level does NOT own

- The JS-generic core (tokenize, parse — spec-only per source type): embody's
  core reads any JavaScript, and the phases panel's CORE stations (`source`,
  `parse`) render it for any code — CORE/LL is a classification, not a station
  name.
- Execution infrastructure (workers, sandboxes, run limits): engine-level
  concerns serving every source type.
- Lens availability: source-level study tools serve all JavaScript, admitted or
  not (locked constraint; see
  [`../../../orchestrate/README.md` § The phases panel](../../../orchestrate/README.md)).

## Navigation

- Parent: [`../../README.md`](../../README.md) — the embody factory.
- Contract: [`../../types.ts`](../../types.ts) — `Snippet`, `Validation`, the
  staircase.
- Validator implementation: [`../../lib/validating/`](../../lib/validating/).
- Architecture: [`./DOCS.md`](./DOCS.md).
