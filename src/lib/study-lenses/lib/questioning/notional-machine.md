<!-- cspell:ignore socratizing quizzing Schulte -->

# The questioner machine

The notional machine of the questioner kind — the operational model a
contributor predicts against when designing, reading, or reviewing any
questioner under this parent. [README.md](./README.md) says what the family is;
[DOCS.md](./DOCS.md) constrains the region's structure; this document models how
the machine runs, so that "what will this questioner do with this snippet?" is
predictable in advance — up to the randomness a questioner declares.

## The machine at a glance

A questioner is an **asking machine**: it turns ground truth about a program
into questions about that program. What counts as ground truth is the
questioner's own choice — the static text as parsed (today's leaves read and
never run) or the program's actual execution (a dynamic questioner runs the code
to ask about runtime facts). It has no memory of past calls and no learner in
view. One call is one complete life: an embodiment in, frozen items out, then
amnesia.

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
              GROUND — obtain ground truth: read the static structure,
                        run the program, or both — the questioner's choice
                 ▼
              TAG   — each item gets grid cells + an offset anchor
                 ▼
              EMIT  — frozen items; zero items is normal
```

- **SERVES.** The `serves` predicate answers one question — may this questioner
  serve this code? — purely, from the parsed facts alone, as a bare boolean: an
  options-list answer carrying no cause. The gate itself runs nothing, for every
  questioner: a dynamic questioner gates on statics and runs inside ask. It is
  not a total pre-check: serves-true followed by a refusal at ask is a legal
  pairing.
- **ASK, and its refusal arm.** The ask entry either runs the machine or refuses
  as data — which fact stage failed, and why — never a half-result and never a
  silent empty success. Predict: unparseable source refuses at ask with the
  parser's cause; it does not produce zero items.
- **GROUND.** Today's leaves read: they walk what the parse produced — tokens,
  AST, the scope environment — anchor by anchor and once over the whole program,
  and never evaluate the snippet. That is their choice, not the kind's law. A
  dynamic questioner obtains runtime ground truth — variable values through
  execution, call order, output — by running the program: itself, or through
  evaluation machinery of its choosing (README § Static and dynamic ground truth
  names the in-house paths). Full coverage of the grid's execution dimension
  needs dynamic questions; none is built yet.
- **TAG.** Every emitted item carries its grid cells (`BlockCell[]`) and a
  half-open character-offset anchor into the source. The closed register also
  derives the item's answer key HERE, at generation time — the key is
  machine-derived from the questioner's own ground truth (the static read today;
  an execution trace for a dynamic item), which is what makes the item gradable
  later without re-deriving anything.
- **EMIT.** Items come out frozen. A snippet that fits no form emits zero items
  — normal operation, not refusal. Two further laws hold in the open register,
  where the live engine pins them: items arrive source-ordered, and a single
  broken analyzer degrades into error data riding the result rather than
  crashing the machine. The closed register's ordering and analyzer-failure
  posture are settled at its own port stage, against its own oracle — this
  document does not legislate them.

## Determinism is a property, not a law

The landed open engine is deterministic — same facts and config, same items,
byte for byte — because its ground truth is the static text and it adds no
randomness. The kind requires neither: a nondeterministic program yields
nondeterministic runtime facts, and any questioner may deliberately randomize
wording or option order. What stays fixed is the learner's absence — variation
never comes from who is asking.

## The grading machine (closed register only)

Grading is a second, separate machine, just as memory-free: one item and one
learner response in, one verdict out. It reads nothing else — the item carries
its own ground truth — and it remembers nothing between calls. Grading
determinism IS a law where generation determinism is not: grading the same
response twice yields the same verdict; grading never touches the snippet; a
response whose shape does not match the item's answer mode is detected as a
caller bug, not mis-graded.

## What the machine never does

The amnesia is the design (README § Assessment is data): no mastery
accumulation, no learner model, no session state, no memory between calls.
Anything adaptive a learning environment builds — sequencing, fading, mastery
display — happens outside, by mapping its own state onto questioner config and
folding the emitted data. Predict: no sequence of calls to a questioner can
change what a later call emits — nothing accumulates between calls.

## Predictions worth making

A contributor holding this model should be able to answer, before running:

- Which forms fire on a given snippet, and which grid cells the emitted set
  spans.
- What arrives when the source does not parse (a refusal at ask carrying the
  parser's cause), when config filters everything (ok, zero items), and — in the
  open register — when one analyzer throws (ok, items minus its, plus error
  data).
- Why any difference between two learners' experiences at the same snippet was
  built by a consumer, or declared by the questioner (randomization, a
  nondeterministic program) — never derived from who the learner is (the
  neutrality law).
