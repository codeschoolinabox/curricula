<!-- cspell:ignore quizzing socratizing gradable unshadowed reassignability -->
<!-- cspell:ignore mcq distractors bindingGroupKey usageKind gradability -->
<!-- cspell:ignore granularities unbuilt reassignable injectivity chokepoint -->

# lib/questioning/quizzing

The **closed register's** leaf questioner: pure, deterministic question
generation and grading over a program's embodiment facts. Given parsed
facts and their already-classified tokens, `generateQuiz` produces frozen
`QuizItem`s — auto-gradable questions anchored to clickable syntax
elements, each carrying its own machine-derived answer key; given a
`QuizItem` and a learner response, `grade` produces a `Verdict`. The
`quizzingQuestioner` envelope wraps both behind the questioning family's
shared `Questioner` signature ([`../types.ts`](../types.ts)).

Quizzing owns question **content** and **grading**. It does not render,
it does not hold mastery state, and its engine never classifies tokens —
classification arrives as an input (see § Public API for the input
asymmetry, and for where the envelope composes it). What the closed
register IS — the machine-gradability charter, the shared Block-Model
grid, its relation to the open register — lives in the parent
([`../README.md § The two registers`](../README.md#the-two-registers));
this module documents only its own engine.

**Ground-truth mode.** The parent charter requires every closed item's
answer key to be machine-derived; it does not say how. This engine's mode
is **static decidability**: every answer key is derivable from the
snippet's source, tokens, AST, and scope structure by pure static
analysis — the engine never evaluates the snippet. Questions that need
the program to run belong to a future dynamic questioner (parent
[`../README.md § Static and dynamic ground truth`](../README.md#static-and-dynamic-ground-truth));
questions calling for open judgment belong to the open register.

## Glossary

The ubiquitous language for this module. Functions, types, tests, and
prose all use these terms. Family-level terms — questioner, engine,
serves, ask, item, cell, register, form — are the parent's
([`../README.md § Glossary`](../README.md#glossary)); entries here are
this engine's own.

**QuizItem** — one auto-gradable question, fully resolved against a
specific snippet: its anchor in the source, its catalog `form`, its
Block-Model `cells`, the prompt and answer mode, the machine-derived
answer key, the propagation `groupKey`, and the post-grade `feedback`. A
`QuizItem` is **self-contained ground truth**: grading needs only the
item plus the learner's response, never the snippet.

**Generator** — a pure function that emits zero or more `QuizItem`s of
exactly one `form`. Generators are registered; each declares the **anchor
type** it fires on (token, node, or program), and the run phase — not the
generator body — owns iteration.

**generateQuiz** — the engine's content entry:
`generateQuiz(facts, classified, filter?) → readonly QuizItem[]`. Runs
the registered generators over the parsed facts and the supplied
classified tokens and returns a frozen array in registry order, then
stream order — deliberately not source order (§ Public API). The engine
never calls `classifyTokens` — `classified` arrives as a parameter.

**grade** — the grading entry: `grade(item, response) → Verdict`. Pure,
deterministic, total over the answer-mode space, and one-sided: it reads
only the item and the response, never the facts.

**Verdict** — the frozen result of grading one response against one item:
`correct` / `incorrect` with `feedback`, or `malformed` with a developer
`reason`. The answer key is never echoed — the consumer reveals it from
the item it already holds, so the seam stays one-sided.

**LearnerResponse** — what the learner submitted, in the shape the answer
mode dictates: option id(s) for panel modes, clicked or selected range(s)
for code-surface modes. Named to avoid the DOM `Response` global.

**Answer mode** — how a learner answers, which fixes the shape of both
the response and the answer key. Panel modes answer by option id
(`mcq`, and the enumerated-not-built `multi-mcq`); code-surface modes
answer by source range: `click-token` / `click-line` (one span; one
gesture, two capture granularities — `click-line` is graded but not
generated: line-span generation needs an offset→line read no greenfield
fact supplies, the same vacancy class as `multi-mcq`) and
`select-in-code` (the
exhaustive-selection genre — "click every occurrence" — graded by exact
range set-equality). Quizzing owns the answer-mode **data**; a consumer
owns the interaction mechanic and any formative presentation.

**Group key** — the identity string tying together the `QuizItem`s that
share mastery credit. Keyed on the classification axis the item's form
uses, namespaced by axis; the six axes are pairwise non-prefixing:

- `category:<category>`, refined to `category:<category>:<role>` where
  the token carries a role — the text-surface recognition forms (V1);
- `binding:<start>-<end>` — binding identity, the declaration-site span
  (V6, V8, V10a). Binding identity is `declarationRange` ONLY: two
  same-range bindings key identically regardless of name and regardless
  of kind — kind is non-identity convenience data and never folds into
  the key; same-name shadowing bindings key apart by site;
- `usage:<decl-start>-<decl-end>:<usageKind>` — binding × use-type (V7,
  V10b), with the per-occurrence fallback `usage:occ:<start>-<end>` for
  any occurrence outside the tracked set (see **occ fallback**);
- `usage-kind:<usageKind>` — cross-variable by use-type alone (V10c),
  deliberately binding-agnostic;
- `element-type:const-update` — V6b's curated execution-fact group, an
  inline single-value key (deliberately NOT `category:keyword`: V6b is a
  runtime-error fact, not keyword recognition);
- `chain:<role>:<name>` — the two-chains form (V4), binding-agnostic by
  design: which chain a name is found through is a syntactic-position
  fact, so shadowing bindings share one chain group — the designed
  contrast with `usage:`'s binding-scoped axis.

Which serializers live in `keying/` versus inline is a recorded
convention: `element-type:` and the `usage:occ:` fallback are inline in
their generators; the other axes are `keying/` files. The key is
deterministic from `(facts, classified, filter)`.

**Sameness unlock (`unlocks`)** — earned propagation as data. A sameness
form (V10a/b/c — "select every occurrence …") lists, per distinct group
its gesture earns, the `groupKey` string its propagation peers carry —
the same namespace, not a new id space, so it survives a later re-key.
Only the sameness forms carry the field; V10a/V10b are members of the
group they unlock, while V10c is deliberately self-excluded (it unlocks
binding-scoped peers, not its own cross-variable group). `grade` never
reads `unlocks`; the consumer owns when propagation fires. Free globals
contribute targets, never unlocks — credit cannot reach a nonexistent
binding group.

**Curated bank vs generated** — two provenances under one contract. A
generated item's content is computed from the snippet's structure; a
curated-bank item carries authored copy (prompt, options, misconception
distractors) instantiated against an anchor, with the correct answer
still machine-determined — which card applies is statically decided; only
the prose is authored. Both grade identically. The bank is **un-bounded**:
it grows toward all of JavaScript, and whether this questioner can serve
a given snippet is its `serves` predicate's answer, never a concept-set
bound (parent [`../README.md § Taxonomies`](../README.md#taxonomies)).

**Occurrence → binding resolution** — the static, shadowing-aware pass
mapping an identifier *occurrence* (a source token) to the *binding* it
resolves to under lexical scoping. An **occurrence** is a source span; a
**binding** is a declared name in a scope — keep them distinct. Computed
inside quizzing (`resolving/`) over the scope forest; it is the
ground-truth source for every binding-identity and usage group key.

**Scope forest** — quizzing's own view of the program's lexical scope
structure: a three-kind tree (`program` / `block` / `for-of`) whose
scopes hold only the **tracked set**'s declarations. Its **shape** is
walked from `facts.ast` (Program / every BlockStatement / every
ForOfStatement — a for-of body folds into the for-of scope); its
**declarations** are harvested from `facts.environment` and filtered to
the tracked set (`resolving/read-scope-forest.ts`; the five-fact account
is DOCS § Where scope comes from). One deliberate archaism rides it: a `var` declaration is tracked but its
`kind` is laundered into the `'let' | 'const'`-typed field at runtime —
generators that reason about reassignability guard per-binding rather
than trusting the type (§ Edge cases).

**ScopeForest / ForestScope / TrackedDeclaration** — the minted types
realizing the scope forest (`resolving/types.ts`): the forest root, one
scope, one tracked declaration (name, laundered kind, the declarator-id
node). Named for this glossary, deliberately NOT the prior
architecture's `ScopeAnalysis` / `ScopeInfo` / `DeclarationInfo` — those
names carry two live embody homonyms plus a tracer third, and the
sibling `lib/scoping` recorded a ruling against `DeclarationInfo` for
exactly this reason (human ruling 2026-08-18, this stage's AR-1).
`Binding` and `Occurrence` port verbatim: a **Binding** is the
resolver's output view of one tracked declaration —
`{ name, declarationRange, kind }`, identity `declarationRange` only; an
**Occurrence** is its input — a minimal `{ start, text }`, deliberately
structural so a `ClassifiedToken` and an AST anchor both satisfy it.

**Tracked set** — the declarations the scope forest resolves:
`var` / `let` / `const` declarator ids (the plain-identifier form) plus
the `for-of` left. Everything else — function names, parameters,
destructuring pattern bindings, class names, imports — is deliberately
outside the set and falls back to occ-fallback identity, whatever richer
resolution embody's environment could offer (human ruling R-6,
2026-08-05: the fallback boundary is pedagogy, preserved verbatim from
the prior architecture's forest).

**occ fallback** — the per-occurrence group-of-one
(`usage:occ:<start>-<end>`) for any occurrence the forest does not
resolve: isolated mastery, no propagation. Resolved and unresolved
occurrences coexist per-occurrence within one snippet.

**Anchor stream** — one of the two disjoint, source-ordered streams the
single AST descent produces: identifier anchors and property-access
anchors. Distinct from a generator's **anchor type** (its registration
axis: token / node / program — a token generator iterates the classified
tokens, not a descent stream; "stream order" in § Public API means
whichever stream the generator binds to).

**Generation context** — the single read-only bundle every generator
receives (`context/`): the classified tokens, the two anchor streams,
and the scope forest. The chokepoint that owns what a generator sees.

**Use-type taxonomy** — the four learner-facing use kinds: `declared` /
`read` / `assigned` / `read-and-assigned`. Edge rulings are pinned by the
oracle: compound assignment and both update forms are `read-and-assigned`;
a `for-of` declares the iteration variable and reads the iterable;
assignment targets range to the identifier, not the expression.

**Anchor / anchorRange** — the single source element a `QuizItem` is
attached to: `[start, end)`, zero-indexed, half-open, matching
classifying's convention. `anchorPath` is the optional `NodePath` a
future node-anchored form would carry — path-to-node, not node-to-path:
greenfield paths withdraw the legacy injectivity claim, so a node the
grammar shares between slots can be met twice, and a consumer keys by
path. No built form constructs it yet (declared, not constructed; the
future-constructor rule is a DOCS § Decisions row). Selection *targets* are carried by the code-surface answer
modes, not by the anchor.

**Family** — the syntax-element curriculum domain a `form` belongs to
(`variables` today; `operators`, `literals`, `keywords`, `delimiters`,
`calls`, `io` to come, in that order — parent § Taxonomies). NOT
classifying's `Category` (a per-token kind that is sometimes a question's
*answer*) and NOT socratizing's `Feature` (related, non-isomorphic, no
total map promised). Note V2's family is `variables`, not `keywords`:
`Family` is the curriculum domain, not the token's category. One further
homonym, resolved here: lowercase unqualified "family" in this module's
prose means the questioner family (the parent's kind — "the family
envelope"); code-voiced `Family` always means this type.

**QuizzingAnswer / QuizzingConfig** — the envelope's two minted types,
living in `types.ts` beside (not inside) the ported engine contract.
`QuizzingAnswer` is the ok-true success shape
(`{ ok: true, items: readonly QuizItem[] }`) the family's bare roster
narrows on. `QuizzingConfig` is the questioner's config,
forward-declared as an object whose fields are this questioner's own
implementation choice — none is consumed yet (human ruling 2026-08-18:
the family sees config-is-an-object; each questioner owns its fields as
implementation).

**Category, Role** (borrowed) — classifying's, imported; never redefined
here. **BlockCell** (borrowed) — the parent's
([`../types.ts`](../types.ts)); quizzing's field is `cells`, plural, and
the open register names its field `block` — both hold the parent's
`BlockCell[]` (parent § Glossary "cell", and the `BlockCell` vs
`BlockModelCell` forward guard).

## The question catalog

The catalog is organized by Block-Model cell (dimension × level); each
entry is one `form` served by one generator. One family is built —
**variables**, ten forms; families build in order variables → operators →
literals → keywords → delimiters → calls → io.

### Text-surface × atom

- **V1 category-id** (`mcq`, generated) — "what kind of element is
  this?"; per classified token; keys `category:…`.
- **V2 keyword-vocab** (`mcq`, curated) — what a `let` / `const` keyword
  *does*; fires only where the keyword heads a real simple declaration
  (§ Edge cases); keys `category:keyword`.

### Text-surface × relation

- **V7 usage-kind** (`mcq`, generated) — how this occurrence uses its
  binding (the use-type taxonomy); keys `usage:…` with the occ fallback.
- **V8 declaration-site** (`click-token`, generated) — "click where this
  variable is declared"; keys `binding:…`.

### Execution × atom

- **V4 two-chains** (`mcq`, generated, program-anchored) — scope chain vs
  prototype chain: every identifier resolves via the scope chain, every
  non-computed property via the prototype chain (anchored to the property
  span); a computed member is two scope-chain references and no
  prototype-chain item. Keys `chain:<role>:<name>`. Deliberately LAST in
  the registry: it reads both anchor streams.
- **V6 kind-semantics** (`mcq`, generated) — may this binding be
  reassigned?; keys `binding:…`.
- **V6b const-update** (`mcq`, curated) — what happens when code assigns
  to a `const` (answer: `TypeError`; misconception distractors); keys
  `element-type:const-update`.

### Execution × relation

- **V10a binding-sameness** (`select-in-code`, generated) — select every
  occurrence of this same variable; unlocks its `binding:` group.
- **V10b binding-use-type** (`select-in-code`, generated) — select every
  occurrence of this binding used the same way; unlocks re-keyed `usage:`
  groups (the V10b↔V7 bulk-credit bijection: every V10b unlock equals a
  re-keyed V7 groupKey and every binding-scoped V7 usage key is unlocked
  by some V10b item).
- **V10c cross-variable use-type** (`select-in-code`, generated) — select
  every occurrence used this way across variables; keys `usage-kind:…`,
  unlocks binding-scoped `usage:` peers (never occ-fallback keys, never
  globals).

**The representative rule**: sameness forms emit exactly ONE item per
propagation group, anchored at the group's source-first occurrence — the
anchor is itself a target, never special-cased, and the rule holds even
under TDZ ordering where a reference precedes its declaration. **The
target set** (`targetRanges`) is the complete set of ranges a correct
code-surface answer must hit; a generator invariant keeps it non-empty —
a zero-target item is a generator bug (§ Edge cases), not `grade`'s to
police.

**Enumerated future forms** (design canon, unbuilt): V9 shadow, V12
binding-identity, V13 value-at-a-point, V14 lookup-depth — all answerable
by a static scope walk, so all inside this engine's mode.

## Public API

Two public surfaces, one machinery — the engine entries, and the family
envelope over them. The engine entry stays public for consumers that
already hold classified tokens (they classify once and share the stream);
the questioner is the family's roster surface.

```ts
import generateQuiz from './generate-quiz.js';
import grade from './grade.js';

const items: readonly QuizItem[] = generateQuiz(facts, classified, filter);
const verdict: Verdict = grade(items[0], learnerResponse);

import quizzingQuestioner from './quizzing-questioner.js';

quizzingQuestioner.serves(embodiment.facts); // boolean gate
const answer = quizzingQuestioner.ask(embodiment);
// answer: { ok: true, items: readonly QuizItem[] } | QuestionerRefusal
// (config is accepted and opaque today — no field is consumed, and ask
// does not forward it to the engine until one is)
```

**Input asymmetry (deliberate, engine-side).** `generateQuiz` takes the
parsed `Facts` *plus* the pre-computed `classified` array — the engine
never calls `classifyTokens`; a direct consumer narrows the facts, calls
the classifying sibling once, and passes the result in. **The envelope
composes that seam**: `ask(embodiment, config?)` narrows the facts,
classifies internally, and calls the engine — so roster consumers pay one
internal classification per ask, and classified-sharing consumers use the
engine entry and classify exactly once. The wrap adds an entry; it does
not change one.

**Refusal vs throw (the seam split).** The engine THROWS on unparsed or
environment-defected input — it sits behind its caller's gate (token,
tree, and environment stages all ok), and a valid `classified` already
implies a successful parse, so a failed stage is a caller bug to surface
loudly. The envelope never throws: `serves` declines the facts a
failed stage produced, and `ask` refuses as data in the family's pinned
shape (`{ ok: false, error: { message, offset? } }`), folding the failed
stage's cause. Serves-false predicts exactly the inputs ask would refuse.

**Grading is one-sided.** `grade` reads only `(item, response)`, never
the facts: each `QuizItem` carries its ground truth, precomputed at
generation. Binary — correct only on an exact match of the answer key
(set equality of option ids or of ranges; order-independent; duplicates
collapse; partial and superset selections are incorrect); no partial
credit. A response that cannot be interpreted against the item (a mode
mismatch, an option id outside the item's own pool) is a distinct
`malformed` verdict with a developer `reason` — never an exception, and
never a penalty. `grade` is total and never throws.

Behavior:

- **Pure.** No mutation of facts, classified tokens, or code — safe on
  deep-frozen embodiment data. No `embody()` call, no AST mutation.
- **Frozen.** The returned array and every `QuizItem` are deeply frozen;
  every `Verdict` is frozen; the questioner object is frozen.
- **Deterministic.** Same `(facts, classified, filter)`, same output. No
  randomness, no sampling. Determinism is this engine's property, not a
  family law (parent notional machine § Determinism is a property) — it
  is what gives learners a stable re-encounter with the same question.
- **Ordered.** Registry order, then stream order within each generator —
  the one ordering mechanism, and the registry is the ordering
  authority. Deliberately NOT source-position order. Today's registry
  groups token-anchored → node-anchored → program-anchored generators —
  an oracle-pinned observation of the current registry, not an
  independent guarantee.

### Configuration

`QuizFilter` — declarative, serializable, no learner-model parameter
(family config law; consumers fold mastery and learner models outside
the boundary). Declared semantics: an omitted group imposes no filter; an
all-false group excludes everything; groups are AND-ed, values within a
group OR-ed; `range` is a zero-indexed half-open offset span keeping any
overlapping item (human ruling 2026-08-18, this stage's AR-1: flipped
from the prior architecture's 1-based inclusive lines to match the
family's offset-native anchor law and the socratizing precedent — a
lines→offsets conversion is a consumer concern, made where the source
text lives); `count` caps the emitted-order result last (`0` ≡
omitted).

⚠ **Declared, not consumed.** The engine accepts `filter` and ignores it
— the no-op is contract (the prior architecture shipped it declared-only,
and the oracle pins acceptance-as-no-op). Building the filter is a recorded future design event;
a consumer must not expect `{ count: 3 }` to do anything today.

## Edge cases

- **`var` reaches the generators.** The engine gates on *parsed*, not
  *validated* — non-JeJ but parseable code arrives. The forest tracks
  `var` and launders its kind into the `'let' | 'const'`-typed field, so
  V6/V6b guard per-binding (a snippet-level "contains var → bail" would
  drop the `let` binding too) rather than mis-grade `var` as
  non-reassignable; V7/V8/V10a-c treat a `var` binding like any tracked
  binding.
- **Contextual keywords.** The tokenizer is context-free: `obj.let` and
  `{ const: 1 }` emit keyword tokens. V2 fires only when the NEXT
  meaningful token is an identifier (a lookbehind guard would wrongly
  skip for-loop-init `let`), and declines destructuring heads. V1
  deliberately does NOT guard — "what category is this?" is honest even
  for a contextual keyword; only V2's "what does this keyword do?" needs
  a real declaration.
- **Occ fallback everywhere the tracked set ends.** Function names,
  parameters, free globals, pattern bindings: group-of-one identity,
  isolated mastery, no propagation — resolved and unresolved occurrences
  coexist in one snippet.
- **Zero items is normal operation, not refusal.** A parseable snippet
  that fits no form generates nothing; the envelope still answers
  `{ ok: true, items: [] }`.
- **A code-surface item always carries targets.** Non-empty
  `targetRanges` is a generator invariant; `grade` treats an
  empty-target item meeting an empty selection as vacuously correct
  rather than policing it — a zero-target item is a generator bug, not a
  question.
- **A defected environment refuses everything.** `serves` conjoins
  `facts.environment.ok`, so a snippet whose environment stage failed is
  refused even though the scope-free forms could run — that stage fails
  only as a loudly-reported embody defect, so the honest surface is the
  refusal, not a partial quiz.
- **Object-literal keys are invisible.** Non-computed object-literal keys
  are excluded from BOTH anchor streams — an object-literal key is not a
  prototype-chain lookup and never reaches `resolveBinding`.

## What lives here

```text
lib/questioning/quizzing/
  README.md                (this — orientation + glossary + catalog + public API)
  DOCS.md                  architecture & decisions + Mermaid data flow
  LOSS-LEDGER.md           the port's transport ledger (burn-down)
  notional-machine.md      machine twin: the generation + grading machine
  ux/                      user twin: closed-register learner journeys
  types.ts                 the locked engine contract (QuizItem, Verdict, …)
  generate-quiz.ts         content entry (gate → context → run → freeze)
  grade.ts                 grading entry (pure comparator, dispatch on mode)
  run-generators.ts        the registry-order run phase
  quizzing-questioner.ts   the family's Questioner envelope over the entry
  context/                 one AST descent → two disjoint anchor streams
  generators/              one registered generator per form + the registry
  keying/                  the namespaced groupKey serializers
  resolving/               scope forest projection + occurrence→binding
  tests/                   the ported oracle + the questioner cluster
```

## What this module deliberately does NOT do

- **No rendering, no mastery state, no propagation firing.** It emits
  `groupKey` / `unlocks` / target ranges as data; consumers fold verdicts
  into mastery and decide presentation (parent § Assessment is data).
- **No classification inside the engine.** The envelope composes the
  classifying sibling; the engine consumes `ClassifiedToken[]`.
- **No JEJ gate.** Parsed-not-validated by charter; a language-level
  admission gate is a consuming lens's concern.
- **No filtering yet.** `QuizFilter` is declared, not consumed (§
  Configuration).
- **No realm forms.** The prior architecture's provenance (V3) and
  value-category (V5) forms, their `realm:` key axis, and the curated
  realm table were dropped, not deferred, with the embody realm phase
  they read (locked decision 4, 2026-07-22; completeness confirmed at
  port time — see LOSS-LEDGER.md).
- **No runtime evaluation.** Static decidability is this engine's mode.
- **No open register.** Purpose-dimension questions, reflection, and
  human-judged prompts are socratizing's.

The split is strict: **quizzing asks and grades; consumers present.**

## Consumers

- **The quiz lens** (`lenses/quiz`, unbuilt — the campaign's Stage 5) —
  narrows facts, classifies once, calls `generateQuiz` directly, renders
  anchors/panel, captures responses, calls `grade`, folds mastery.
- **The family roster** — any consumer driving questioners through the
  bare `Questioner` envelope (the designated higher-order questioner,
  when built) reaches this engine through `quizzingQuestioner`.

## Why this module exists

A learning environment needs auto-gradable questions grounded in the
Block Model and the notional machine: a learner clicks a syntax element
and answers a closed, checkable question about it. That content-and-
grading logic is pure, exhaustively testable in isolation, and
consumer-independent — so it lives as a lib-tier leaf under the
questioning family, the closed complement to socratizing's open register,
sharing the parent's grid vocabulary so both registers place their items
on one grid (parent § One grid).

## Conventions

Inherits the family conventions ([`../README.md § Conventions`](../README.md#conventions))
and the repo-wide rules. Module-specific:

- **Pure-sync only.** No async, no I/O, no side effects, no randomness.
- **Reads through the accessor seam.** Every facts read goes through a
  narrow, domain-named helper (the forest accessor, the context reads) —
  never an inline `facts.*` dereference in a generator or in `grade`.
- **Borrowed vocabulary is shared contract.** `Category` / `Role` /
  `ClassifiedToken` come from classifying; `BlockCell` from the parent.
  Widening `Family`, `AnswerMode`, or an answer-key shape is a
  cross-consumer contract event, not a local edit.
- **The read-bound.** The questioner reads `embodiment.facts` and never
  `embodiment.study` (family law, greppable).
- **`lib/scoping` is deliberately not reused.** The package's shared
  scope adapter projects a flat declaration view and keeps only
  `let`/`const` (it excludes `var`); this engine needs the tree-shaped
  forest INCLUDING `var` under the tracked-set pedagogy — so
  `resolving/` is quizzing-local by ruling (Q13, resolved at this
  stage's AR-1), and the two projections cross-reference rather than
  share code.

## Navigation

- **Family parent:** [`../README.md`](../README.md) — the questioner
  kind, the grid, the registers, the shared glossary; and
  [`../DOCS.md`](../DOCS.md) — the family architecture.
- **Architecture & decisions:** [`./DOCS.md`](./DOCS.md).
- **Transport ledger:** [`./LOSS-LEDGER.md`](./LOSS-LEDGER.md).
- **Twins:** [`./notional-machine.md`](./notional-machine.md) and
  [`./ux/user-journeys.md`](./ux/user-journeys.md).
- **Dependency (classification):**
  [`../../classifying/README.md`](../../classifying/README.md) —
  `Category`, `Role`, `ClassifiedToken`, default-export `classifyTokens`.
- **Peer register:** [`../socratizing/README.md`](../socratizing/README.md).
- **Input shapes:** [`../../../embody/types.ts`](../../../embody/types.ts)
  — `Facts`, `Embodiment`, `Environment`.

`Family`, `AnswerMode`, and the answer-key shapes are this module's;
`Level` and `BlockCell` are the questioning parent's
([`../types.ts`](../types.ts)) — widening either is a region-wide change
affecting every questioner.
