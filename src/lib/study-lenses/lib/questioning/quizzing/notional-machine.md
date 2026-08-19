<!-- cspell:ignore quizzing socratizing mcq unshadowed reassignability Disjointness -->

# The quiz machine

The notional machine of the quizzing engine — the operational model a
contributor predicts against when designing, reading, or reviewing this
module. The family-level machine (serves → ask → ground → tag → emit, and
the grading machine's laws) is the parent's
[`../notional-machine.md`](../notional-machine.md); this document models
what happens INSIDE this engine's ground/tag/emit, and inside its grader,
so that "what will quizzing do with this snippet?" is predictable before
running.

## The generation machine

One call is one complete life, in fixed phases:

```text
facts + classified in
  → GATE     throws unless the token, tree, and environment stages are
             all ok (the engine's loud posture; the envelope's
             serves/refusal arms sit in front of the same three)
  → FOREST   build the forest: shape walked from facts.ast (program /
             block / for-of; a for-of body folds in), declarations
             harvested from facts.environment, tracked set only
  → DESCEND  one AST walk → two disjoint anchor streams
             (identifiers · non-computed property accesses)
  → RUN      registry order, then stream order — never source order
  → FREEZE   deep-frozen, deterministic QuizItem[]
```

- **GATE.** The engine sits behind its caller's gate; a valid
  `classified` already implies a successful parse, so a failed stage is
  a caller bug surfaced loudly. Predict: unparsed or
  environment-defected facts THROW here — the family's refusal-as-data
  lives one level up, in the questioner.
- **FOREST.** The machine's scope model is deliberately smaller than the
  language's: only `var`/`let`/`const` declarator ids and the `for-of`
  left register (the tracked set); every scope is one of `program` /
  `block` / `for-of`. The forest's SHAPE comes from the AST — Program,
  every BlockStatement (a function body's braces are an ordinary block;
  a for-of body folds into the for-of scope), every ForOfStatement — and
  its DECLARATIONS come from the environment, placed at their lexical
  position. A `var`'s kind is laundered into the `'let' | 'const'`-typed
  field at runtime. Predict: a function name, a parameter, a
  destructured binding, a class name — none resolves, whatever richer
  analysis the environment could offer; that boundary is pedagogy, not a
  gap. Predict, concretely: in `function f(p) { let a = 1; a; } a;` the
  body's `a` occurrences resolve to the body block's binding; `f`, `p`,
  and the trailing outer `a` all fall to occ fallback.
- **DESCEND.** One walk, two streams, deliberately disjoint: a
  non-computed member property is emitted on the property stream only; a
  non-computed object-literal key is emitted on NEITHER. Disjointness is
  what keeps property names out of binding resolution by construction.
- **RUN.** Generators fire in registry order, then stream order — the
  one ordering mechanism; today's registry groups token → node →
  program, and V4 sits last because it reads both anchor streams.
  Generation is selective — forms emit only where they apply — so zero
  items is normal operation.
- **FREEZE.** Same `(facts, classified, filter)` → byte-same output,
  every time. No randomness anywhere in this engine; the re-encounter a
  repairing learner needs is guaranteed, not incidental.

## Resolution, and where it stops

Every identifier occurrence a binding-aware form touches is resolved
against the forest: descend to the deepest scope containing the offset,
climb until a scope declares the name, inner shadows outer. Predict, for
any snippet: an occurrence of a tracked binding resolves to its
declaration-site identity (`binding:<start>-<end>` — the declarator id's
span, kind never part of identity); anything else falls back to the
per-occurrence group `usage:occ:<start>-<end>` — isolated mastery, no
propagation, no crash. Resolved and unresolved occurrences coexist in one
snippet, per occurrence.

## The grading machine, in full

One item and one response in, one verdict out — memory-free,
deterministic as LAW, total, never throwing. The whole verdict space:

- `correct` — exact set-equality with the answer key: all correct option
  ids, or all target ranges as exact `[start, end)` tuples;
  order-independent; duplicate selections collapse.
- `incorrect` — an interpretable answer that misses: a known-but-wrong
  option id, a partial selection, a superset, a range off by either
  endpoint. Exhaustiveness IS the graded skill in `select-in-code`;
  "found most of them" is incorrect, never partial credit.
- `malformed` — the response could not be interpreted against THIS item:
  a mode mismatch, or an option id outside the item's own pool. A
  developer diagnostic with a `reason`, never a penalty — a UI bug must
  not cost the learner anything.

Predict: `grade` never reads the facts, so it cannot know whether a
clicked range even lies inside the source — a nonsense range is simply
`incorrect`. The answer carries this machine: `answer.grade` is the same
function, and awaiting quizzing's sync verdict is the identity — a
deferred verdict signals a DIFFERENT questioner's grader, never this
engine's. An empty-target item meeting an empty selection is
vacuously correct: non-empty targets are a generator invariant, so a
zero-target item is a generator bug, never `grade`'s to police. Feedback rides the item verbatim on both correct and
incorrect; the answer key is never echoed.

## Propagation is emitted, never fired

The sameness forms (V10a/b/c) emit `unlocks` — groupKey strings their
propagation peers carry. The machine guarantees the references are
well-formed: every entry is a namespaced key some emitted peer holds,
deduped, source-ordered; V10a/V10b are members of the group they unlock;
V10c deliberately is not (cross-variable identity, binding-scoped
unlocks); occ-fallback keys and free globals are never unlocked. What a
consumer DOES with an unlock — bulk-credit, display, nothing — happens
outside this machine, after emission.

## Predictions worth making

A contributor holding this model should answer, before running:

- For each identifier in a snippet: resolves, or occ fallback? (Apply the
  tracked set; nothing else matters.)
- For a snippet containing `var`: which forms fire (V7/V8/V10a-c, and V1
  on the token) and which stay silent (V2's vocab card, V6/V6b's
  reassignability facts — guarded per-binding)?
- For an unparseable embodiment: which entry throws (`generateQuiz`) and
  which refuses as data (`quizzingQuestioner.ask`)?
- For an embodiment whose environment stage failed: serves declines and
  ask refuses — even though the scope-free forms could have run. That
  stage fails only as a loudly-reported embody defect, so the honest
  surface is the refusal, not a partial quiz.
- For any two runs on identical inputs: byte-identical items — so any
  observed variation was introduced by a consumer, never by this engine.
