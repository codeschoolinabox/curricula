<!-- cspell:ignore socratizing quizzing Schulte -->

# The questioner machine

The notional machine of the questioner kind — the operational model a
contributor predicts against when designing, reading, or reviewing any
questioner under this parent. [README.md](./README.md) says what the family is;
[DOCS.md](./DOCS.md) constrains the region's structure; this document models how
the machine runs, so that "what will this questioner do with this snippet?" is
answerable before running anything.

## The machine at a glance

A questioner is a **reading machine, never a running machine**: it reads a
program's static structure and emits questions about it. It has no memory, no
clock, and no learner in view. One call is one complete life: facts in, frozen
items out, then amnesia.

## States and transitions

```text
facts arrive → SERVES? ──false──▶ not offered (a boolean, no cause)
                 │
               true
                 ▼
               ASK ──refuse──▶ refusal data (which stage failed, and why)
                 │
              serve
                 ▼
              READ  — walk the static structure (never evaluate it)
                 ▼
              TAG   — each item gets grid cells + an offset anchor
                 ▼
              EMIT  — frozen items; zero items is normal
```

- **SERVES.** The `serves` predicate answers one question — may this questioner
  serve this code? — purely, from the facts alone, as a bare boolean: an
  options-list answer carrying no cause. It is not a total pre-check:
  serves-true followed by a refusal at ask is a legal pairing.
- **ASK, and its refusal arm.** The ask entry either runs the machine or refuses
  as data — which fact stage failed, and why — never a half-result and never a
  silent empty success. Predict: unparseable source refuses at ask with the
  parser's cause; it does not produce zero items.
- **READ.** The machine walks what the parse produced — tokens, AST, the scope
  environment — anchor by anchor (per node, per token) and once over the whole
  program. Ground truth is static: the machine never evaluates the snippet, so
  nothing it emits can depend on runtime values, input, or chance. Predict: two
  runs over the same facts and config emit identical items, byte for byte.
- **TAG.** Every emitted item carries its grid cells (`BlockCell[]`) and a
  half-open character-offset anchor into the source. The closed register also
  derives the item's answer key HERE, at generation time — the key is
  machine-derived from the same static read, which is what makes the item
  gradable later without re-reading the snippet.
- **EMIT.** Items come out frozen. A snippet that fits no form emits zero items
  — normal operation, not refusal. Two further laws hold in the open register,
  where the live engine pins them: items arrive source-ordered, and a single
  broken analyzer degrades into error data riding the result rather than
  crashing the machine. The closed register's ordering and analyzer-failure
  posture are settled at its own port stage, against its own oracle — this
  document does not legislate them.

## The grading machine (closed register only)

Grading is a second, separate machine, just as memory-free: one item and one
learner response in, one verdict out. It reads nothing else — the item carries
its own ground truth — and it remembers nothing between calls. Predict: grading
the same response twice yields the same verdict; grading never touches the
snippet; a response whose shape does not match the item's answer mode is
detected as a caller bug, not mis-graded.

## What the machine never does

The amnesia is the design (README § Assessment is data): no mastery
accumulation, no learner model, no session state, no memory between calls.
Anything adaptive a learning environment builds — sequencing, fading, mastery
display — happens outside, by mapping its own state onto questioner config and
folding the emitted data. Predict: no sequence of calls to a questioner can
change what a later call emits; only different facts or different config can.

## Predictions worth making

A contributor holding this model should be able to answer, before running:

- Which forms fire on a given snippet, and which grid cells the emitted set
  spans.
- What arrives when the source does not parse (a refusal at ask carrying the
  parser's cause), when config filters everything (ok, zero items), and — in the
  open register — when one analyzer throws (ok, items minus its, plus error
  data).
- Why two learners at the same snippet see the same items (determinism) and why
  any difference between their experiences must have been built by a consumer,
  not a questioner (the neutrality law).
