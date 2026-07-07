# lib/admitting

The JEJ **admission gate** as a plain boolean, shaped for a lens to self-gate
its `applicableTo`. Given an embodiment, answers one domain question — _is this
snippet admissible at the Just Enough JavaScript level?_ — as
`isJejCompliant(embodiment): boolean`.

This module is the **adapter** between
[`../../embody/lib/validating/`](../../embody/lib/validating/) (which decides
JEJ admission — `validate(code).ok`, and, once populated,
`Snippet.validation.isJeJ`) and a **lens** that wants to render only for
JEJ-compliant code. A lens may not import `embody/lib/*` (lens purity — see
[`../../lenses/README.md`](../../lenses/README.md) § Lens purity); this seam
sits in the peer-independent `lib/*` tier, which may, so the lens imports the
boolean and never reaches into embody itself.

It is a **Class-B re-pointable seam** in the sense of
[`../quizzing/DOCS.md`](../quizzing/DOCS.md) § "The accessor-helper seam" and
the sibling [`../documenting/document-jej.ts`](../documenting/document-jej.ts):
the accessor is named for the domain question and its **body swaps** when embody
ships a real surface, while the name, signature, and every caller stay
untouched.

## Glossary

**JEJ admission** — passing the Just Enough JavaScript language level's
validation gate: the source parses **and** contains zero JEJ violations (no
functions, `var`, `class`, `try/catch`, undeclared globals, property assignment,
…). Admission is what
[`validate(code)`](../../embody/lib/validating/validate.ts) reports as `.ok`,
and what a fully-embodied snippet carries as
[`Snippet.validation.isJeJ`](../../embody/types.ts)
(`isJeJ === violations.length === 0`). **Formatting is not part of admission** —
a valid-but-unformatted JEJ snippet is still admitted (that is why this seam
uses the sync `validate`, not the async `is-jej`, whose Prettier check would
wrongly reject it).

**isJejCompliant** — this module's entry point:
`(embodiment: Snippet) => boolean`. Named for the domain question, never an
inline field access in a lens.

**Validation-aware body** — the seam **prefers the embodiment's own verdict**
(`validation.isJeJ`) when the validate stage ran, and re-validates `source.code`
(guarded by `type === 'module'`) **only** when it did not. embody's
real-composition path currently stubs `validation: null` (and
`status.validated: false`) for real snippets — the validate stage is not wired
into real composition yet (see [`../../embody/index.ts`](../../embody/index.ts)
§ real composition) — so today the re-validation arm is the one real code takes,
while the canned scenario snippets (which carry a real `validation`) are read
directly. The `type === 'module'` guard makes the seam a faithful shadow of
`status.validated`, which is structurally `false` under `script` type.

**Class-B re-point** — when embody wires validate into real composition,
`validation` becomes present for real module snippets, the re-validation arm
becomes dead code, and the seam collapses to
`return embodiment.status.validated;` — the single **total** field (`true` iff a
parsed, JEJ-admitted module; structurally `false` under `script`). The target is
`status.validated`, not `validation.isJeJ` (which is `null` under `script`).
Deleting the fallback is the whole re-point; callers are untouched. The
parameter is `Snippet` (not `code: string`) precisely so it can.

## Why not read `source.code` as a discriminator

[`../../embody/index.ts`](../../embody/index.ts) forbids consumers from
branching on `source.code` **content** (`source.code === '<literal>'`) — canned
scenarios carry sentinel source strings, so the shape to trust is `status` /
`validation`. This seam honors that: it branches on `validation` shape first,
and where it does read `source.code`, it **feeds the whole string to the
validator** (a structural analysis, exactly like
[`../linting/lint-jej.ts`](../linting/lint-jej.ts)), never compares it to a
literal — so it does not trip the AR-4/AR-5 anti-pattern grep. The
`validate(source.code)` branch exists only because embody has not yet populated
`validation` for real snippets; it is the documented bridge, not a preferred
path.

## What lives here

```text
lib/admitting/
  README.md                       (this — orientation + navigation)
  DOCS.md                         architectural sketch + Mermaid data flow
  is-jej-compliant.ts             the seam: (embodiment) → boolean
  tests/
    is-jej-compliant.test.ts
```

There is no `types.ts`: the module introduces no new type. It returns `boolean`
and imports [`Snippet`](../../embody/types.ts) **type-only**. Mirrors
[`../linting/`](../linting/) and [`../documenting/`](../documenting/), which
also skip `types.ts` for the same reason.

## Public API

```ts
import isJejCompliant from './is-jej-compliant.js';

const admitted: boolean = isJejCompliant(embodiment);
```

Signature: `(embodiment: Snippet) => boolean`. Behavior:

- **`validation` present** (the validate stage ran — canned scenarios, or real
  snippets once embody wires validation in) → returns `validation.isJeJ`
  directly. `embody('OK')` → `true`; `embody('VALIDATION_FAIL')` → `false`.
- **`validation` null, module type** (real composition today) → returns
  `validate(source.code).ok`: `true` for admitted JEJ (`let x = 1; x;`), `false`
  for any violation (`var x = 1;`, `function f() {}`, `class C {}`,
  `try { … } catch (e) { … }`) and for a parse failure.
- **`validation` null, script type** → `false` (the `type === 'module'` guard;
  `status.validated` is structurally `false` under `script`). Not reachable via
  today's `embody(code)` signature, which only produces module snippets — the
  guard is the future-facing shadow of `status.validated`.
- **Empty source** → `true` (an empty program parses with no violations).

Callers gate on `status.parsed` first (the Tier-2 gate); the seam is meaningful
only for parsed embodiments. The function never throws (relies on `validate`'s
never-throws-for-string contract).

## Consumers

- **Current**: the [`quiz`](../../lenses/quiz/) lens. Its
  [`core.ts`](../../lenses/quiz/core.ts) `applicableTo` returns
  `status.parsed && isJejCompliant(embodiment)`; its model builder
  [`lib/build-quiz.ts`](../../lenses/quiz/lib/build-quiz.ts) gates on it too
  (the load-bearing gate — the wrapper runs the builder in an unconditional
  `useMemo` before the render guard, so the generators must never see a non-JEJ
  AST); the wrapper's render fallback follows from the builder returning `null`.
- **Potential**: any other Tier-2 lens whose analysis assumes the JEJ scope
  model. The seam lives at the peer-independent `lib/*` level so a lens consumes
  it without reaching across the `lenses/` ↔ `embody/` boundary.

## Why this module exists

The quiz lens's generators build questions whose ground truth (scope, TDZ,
creation-phase behavior) is statically decidable **only because JEJ excludes
functions**. Fed non-JEJ code they do not crash — they produce **confidently
wrong** answers. Gating the lens so it never renders for such code dissolves the
problem at the source: `validate` rejects functions/`var`/`class`, so the
generators never see one, and there is no need to skip function subtrees or
model function scopes downstream.

The gate cannot live inside the lens: a lens may not import
`embody/lib/validating/validate.js` (lens purity), and today it cannot read the
answer off the embodiment either (`status.validated` / `validation` are stubbed
for real snippets). This `lib/*` seam holds both facts in one re-pointable
place: it may import the validator, and it re-points to the public
`status.validated` surface the moment embody populates it — leaving the lens
untouched across that migration.

## Conventions

Inherits all conventions from [`../README.md`](../README.md),
[`../../README.md`](../../README.md), and the top-level `AGENTS.md` / `DEV.md`.
Module-specific rules:

- **Pure, synchronous, throws-free.** No I/O, no async, no side effects. Returns
  a primitive `boolean`; no freeze needed. Relies on `validate`'s
  never-throws-for-string contract rather than guarding the boundary.
- **`validate`, never `is-jej`.** Uses the sync
  [`validate`](../../embody/lib/validating/validate.ts) (`.ok` = parse + JEJ
  subset, **no** format check). The async `is-jej.ts` additionally requires
  Prettier-formatting, which would wrongly hide the lens for
  valid-but-unformatted code.
- **No embodiment construction.** Imports the validator and the `Snippet` type,
  never [`embody()`](../../embody/index.ts) or anything under
  `../../embody/lib/evaluating/`.
- **Named for the domain question, single narrow accessor.** No generic
  field-getter; a lens reads `isJejCompliant(embodiment)`, never an inline
  `embodiment.validation?.isJeJ` (the seam owns that dual-branch decision so the
  re-point happens in one place).

## Navigation

- **Parent peer:** [`../README.md`](../README.md).
- **Architectural sketch:** [`./DOCS.md`](./DOCS.md).
- **Producer of the verdict:**
  [`../../embody/lib/validating/`](../../embody/lib/validating/) (`validate`),
  [`../../embody/types.ts`](../../embody/types.ts) (`Snippet.validation.isJeJ`,
  `Snippet.status.validated`).
- **Class-B seam convention:** [`../quizzing/DOCS.md`](../quizzing/DOCS.md) §
  "The accessor-helper seam"; sibling shape
  [`../documenting/document-jej.ts`](../documenting/document-jej.ts).
- **Sibling validate-adapter:** [`../linting/README.md`](../linting/README.md)
  (same `validate` source, shaped as lint diagnostics instead of a boolean).
- **Consumer:** [`../../lenses/quiz/README.md`](../../lenses/quiz/README.md).
- **The station-vs-lens constraint this realizes:**
  [`../../lenses/types.ts`](../../lenses/types.ts) (`LensModule.phase` remarks)
  and [`../../orchestrate/README.md`](../../orchestrate/README.md) § The phases
  panel (locked constraint — full-JS station availability).
