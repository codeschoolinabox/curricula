# lib/scoping

A flat, per-declaration **usage** view of a program's variables. Given a
snippet's **scope environment** (embody's static scope graph), produces one
frozen `VariableUsage` per `let`/`const` binding: the declared name, whether it
is `let` or `const`, how many times it is **read** and **written** after
declaration, and the identifier node that declares it — gathered into a single
`ScopeUsage` whose `allDeclarations` list crosses every scope depth.

Scoping **projects**; it never judges. It tells a consumer that `x` is a `let`
read three times and written zero times — it never concludes "that should be a
`const`." That judgment is the consumer's (`lib/socratizing`'s `let-vs-const`
question, a future usage lens). It folds the read/write classification embody
already computed into a flat list; it never re-walks the AST or recomputes
scope.

## Glossary

**Scope environment** — embody's static scope graph for a parsed snippet
(`Environment` in `study-lenses/embody`): the tree of lexical scopes, each
holding its variables, and each variable holding its declarations and the
references that resolve to it. It is computed once by embody (via eslint-scope,
the standard ECMAScript scope analyzer) and carried on the facts. Each
`ScopeReference` carries embody's **access classification** (read / write /
read-write) and an **initializer flag**; scoping consumes those, it does not
recompute them.

**VariableUsage** — everything a scope-aware consumer reads about one variable
declaration's usage: its `name`, its `kind` (`'let'` or `'const'`), its
post-declaration `readCount` and `writeCount`, and the `node` (the declared
identifier). It is a deliberately narrow projection — the scope graph carries
far more (the scope tree, parent pointers, resolved-binding links), but a
declaration-level consumer reads only these five facts. (The name is
`VariableUsage`, not `DeclarationInfo`, to avoid colliding with the
declaration-site `DeclarationInfo` in `language-levels/jej` — a different,
count-free shape.)

**ScopeUsage** — the module's output: `{ allDeclarations }`, a flat list of
every `VariableUsage` in the program regardless of scope depth. It is the
"iterate every variable" view; it deliberately omits the scope tree, because the
consumers of this leaf ask declaration-level questions, not scope-nesting
questions. (The field keeps the name `allDeclarations` — the historical name its
consumers read.)

**Read / write count (the fold rule)** — `readCount` is the number of references
to the binding that read its value; `writeCount` is the number that write it,
**excluding the declaration's own initializer**. So `const PI = 3.14` and
`let n = 0` both have `writeCount: 0` at declaration — the initializer is not a
write. A later `n = n + 1` contributes **one read** (the right-hand `n`) and
**one write** (the left-hand `n`); `n++` likewise counts as one read and one
write. A member write (`obj.x = 5`) counts `obj` as a **read**, not a write —
the binding `obj` is read to reach its property. This is the prefer-`const`
semantics: a `let` with `writeCount: 0` was never reassigned and could be a
`const`. The counts come straight from embody's per-reference access
classification; scoping tallies them, it does not re-derive them from the AST.

**Kind** — `'let'` or `'const'`. The module reports only block-scoped `let`/
`const` declarations; `var`, function, parameter, class, and import bindings are
**not** declarations this leaf reports (JeJ admits neither `var` nor the others
as re-bindable declarations, and the declaration-level consumers ask only about
`let`/`const`).

**Node identity** — `node` is the exact **declared-identifier** node (embody's
`ScopeDefinition.name`, the identifier — not `ScopeDefinition.node`, which is
the declaring statement), from the same AST the consumer walks, carried by
reference. A consumer that walks the AST and finds a declaration identifier can
match it against `VariableUsage.node` by identity (`===`), because both point at
the one shared parse. `caution.ts`'s `unused-variable` check relies on exactly
this match, so the field must be the identifier, never the declarator.

## The flatten

`ScopeUsage` is produced by walking the environment's scope graph once and, for
each `let`/`const` variable, folding its declaration and references into one
`VariableUsage`:

- **Enumerate** every variable across every scope (the root scope and all nested
  scopes — block, `for-of`, and — outside JeJ — function / catch / class).
- **Keep** only variables whose declaration kind is `let` or `const`; skip the
  rest.
- **Name / kind / node** come from the variable's declaration (`node` = the
  declared identifier).
- **Read count** = references classified read (or read-write) by embody.
- **Write count** = references classified write (or read-write) by embody, minus
  the initializer write (the declaration's own binding is not a reassignment).

Because embody computes the scope graph once — eslint-scope resolves every
reference and classifies it read / write / read-write, and embody carries that
classification on each `ScopeReference` — the flatten reads those
classifications directly; it never re-walks the AST to recompute them. That is
the whole point of consuming the environment rather than re-deriving scope: one
scope truth, computed once, projected — not a second, divergent analysis.

## What lives here

```text
lib/scoping/
  README.md              (this — orientation + glossary + the flatten rule)
  DOCS.md                architectural sketch + Mermaid data flow
  types.ts               ScopeUsage, VariableUsage
  derive-scope-usage.ts  the single public export
  tests/
    derive-scope-usage.test.ts
```

## Public API

```ts
import deriveScopeUsage from './derive-scope-usage.js';

const usage: ScopeUsage = deriveScopeUsage(environment);
```

`environment` is embody's `Environment` — the unwrapped value of the
`environment` fact. A consumer holding an `Embodiment` narrows
`facts.environment.ok` and passes `facts.environment.value`; the narrowing is
the consumer's one-line boundary.

Behavior:

- **Total over `let`/`const`.** One `VariableUsage` per `let`/`const` binding in
  the program, across every scope depth; non-`let`/`const` bindings are omitted,
  never mis-reported.
- **Pure.** No mutation of the environment or any AST node — safe on deep-frozen
  facts. The declared-identifier `node` is carried by reference, never
  rewritten.
- **Frozen.** The returned `ScopeUsage` and its `allDeclarations` list and every
  `VariableUsage` are deeply frozen.
- **Deterministic.** Same environment, same output. No config, no randomness.
- **Source-ordered.** `allDeclarations` follows the scope walk: every scope's
  own declarations in source (declaration) order, scopes visited outer-first
  (pre-order DFS: a scope before its nested scopes). So same-scope declarations
  keep source order, and an outer binding precedes a nested same-name shadow — a
  contract consumers may rely on (and a reason they must still match a specific
  binding by `node` identity, never by name).

## Edge cases

- **No declarations** → `allDeclarations` is an empty (frozen) array, never a
  throw. An empty program and a program of only `var`s both flatten to empty.
- **The initializer is never a write.** `let n = 0` reports `writeCount: 0`;
  only a later assignment raises it. This is what makes "a `let` never
  reassigned" detectable.
- **Member assignment reads its object.** `obj.x = 5` counts `obj` as a read of
  the `obj` binding (the property, not the binding, is what is written) — the
  prefer-`const`-correct reading. (This is a deliberate divergence from the
  legacy `build-scope` walk, which counted the object as a write; the ported
  oracle updates to the eslint-scope-correct value where a test encoded the old
  behaviour.)
- **Compound assignment and update** (`n += 1`, `n++`) count as one read **and**
  one write of the binding.
- **Destructuring** (`const { a } = obj`, `const [x] = arr`) binds `a` / `x` as
  ordinary `let`/`const` declarations and is reported like any other — a
  divergence from `build-scope`, which registered only plain-identifier
  declarations. (JeJ snippets rarely destructure, so this seldom bites the
  ported corpus.)
- **Nested-scope declarations are reported.** A `let`/`const` inside a `for-of`,
  a block, or — outside JeJ — a function / catch / class body appears in
  `allDeclarations` at its own scope depth. The view is flat: depth is not
  encoded, only the declaration and its counts.
- **Shadowing** keeps declarations distinct: an inner-scope `let x` and an
  outer-scope `let x` are two `VariableUsage`s with their own counts; a
  reference is tallied against the binding it resolves to, not by name.
- **`var` / function / parameter / class / import bindings** are not reported —
  they are not the `let`/`const` declarations this leaf describes.

## Consumers

- **`lib/socratizing`** — five of its analyzers read `allDeclarations` to ask
  declaration-level questions: `let-vs-const` and `mixed-declaration-style` (is
  a `let` ever reassigned?), `unused-variable` (`readCount`, matched by `node`
  identity), the voice profile, and the voice-level naming questions.
- **`lib/quizzing`** (a later stage) and future usage-analysis lenses share the
  same flat declaration view.

Consumers read the counts and the kind; scoping never decides what they mean.

## Why this module exists

Two engines (`socratizing` now, `quizzing` next) ask the same declaration-level
questions — "is this `let` ever reassigned?", "how many times is `count` read?"
— and both need the same flat, per-declaration read/write tally. The scope graph
that answers them is computed once by embody; recomputing it inside each engine
would duplicate a subtle analysis (reference resolution, read/write
classification, shadowing) and risk two engines disagreeing about the same
program. Factoring the flatten into one domain-blind leaf that both engines
consume keeps a single scope truth and keeps each engine free of scope-graph
machinery.

The split is strict: **scoping projects; consumers judge.** Whether a `let`
should be a `const`, whether an unused variable is a bug — those are the
consuming engine's pedagogy, never this leaf's.

## Conventions

Inherits all conventions from [`../README.md`](../README.md),
[`../../README.md`](../../README.md), and the repo's `DEV.md`. Module-specific
rules:

- **Pure-sync only.** No async, no I/O, no side effects, no randomness.
- **Consumes the environment, never rebuilds it.** The read/write/kind facts
  come from embody's one scope pass; scoping folds them, it does not re-analyze
  the AST. No `getChildNodes`, no scope recomputation.
- **Type-only embody coupling.** Unlike `classifying` (which consumes only acorn
  shapes), this leaf's input is embody's `Environment` — a structural
  scope-graph type. It is imported **type-only**, creating no runtime dependency
  and no import cycle (embody does not import `lib/`). The leaf stays blind to
  the package's domain in the sense the `lib/` charter means it: it knows
  nothing of lifecycle phases, language levels, or lenses — it knows only scope
  structure, which is its subject. Consuming embody's scope-vocabulary type is
  what lets every scope consumer share one scope truth rather than each
  re-deriving it.
- **No AST mutation.** The environment and its nodes may be deep-frozen; the
  module must run unchanged on frozen data.
- **`VariableUsage` shape is a cross-consumer contract.** Its five fields are
  the intersection of what the scope-aware engines read; widening it is an
  inter-module contract change, not a local edit.

## Navigation

- **Parent peer:** [`../README.md`](../README.md).
- **Architectural sketch:** [`./DOCS.md`](./DOCS.md).
