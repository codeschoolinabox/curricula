<!-- cspell:ignore klve stepperize undescribe undescribed Bayman Kaczmarczyk Sorva -->

# User journeys — misconceptions meeting the event data

The user twin's journeys: learners arriving with specific, documented
misconceptions from the computing-education-research literature, and the moment
in a **predict-then-step workflow** — this module's own phrase for one loop of
the org's predict-and-twin practice (predict what the twinned process will do,
observe, notice divergence, update the twin); frogramming is the broader
umbrella and is deliberately not claimed here — where this library's
ECMAScript-correct event data confronts each one. This models the learners a
consuming lens ultimately serves — it is not documentation for them, and it
prescribes no interface (a lens decides what to show).

Each journey has the same skeleton: **what they arrive believing** (the
misconception, with its literature anchor), **the predict moment** (the code and
the prediction the belief produces), **the confronting data** (which event
members carry the contradiction), and **why timing matters** (the data must
arrive at the prediction's moment of failure, not as a lecture before or a
summary after — the workflow half of the twin). The misconception anchors, so
they are checkable: du Boulay, "Some Difficulties of Learning to Program"
(1986); Pea, "Language-Independent Conceptual 'Bugs' in Novice Programming"
(1986 — the superbug, the intentional human-like interpreter); Bayman & Mayer on
statement-level misconceptions (1983); Kaczmarczyk, Petrick, East & Herman,
"Identifying Student Misconceptions of Introductory Programming" (SIGCSE 2010);
Ma, Ferguson, Roper & Wood on reference-assignment models (2011); Sorva,
"Notional Machines and Introductory Programming Education" (TOCE 2013) and the
misconception catalog in his 2012 dissertation.

The journeys-only menu is this module's call (the twin convention's menu is a
menu, not a fixture): the risk these journeys model is **when the confronting
datum must appear** — the pacing risk the journey form exists for — and each
journey's "arrives believing" field carries the persona material inline, so a
separate personas item would duplicate it.

A journey's correction is only as honest as the data: the klve reference's own
measured defects TAUGHT two of these misconceptions (journeys 4 and 6), which is
why the port's repairs are ruled — a tracer whose data confirms a misconception
is worse than no tracer.

## Journey 1 — "= means the two are now linked" (assignment as connection)

- **Arrives believing**: after `b = a`, changing `a` later also changes `b` —
  assignment creates an ongoing bond, not a one-time copy of a value (Bayman &
  Mayer's assignment misconceptions; Ma et al.'s reference-model studies).
- **Predict moment**: `let a = 3; let b = a; a = 10;` — asked for `b`, they
  predict `10`.
- **Confronting data**: the assignment event for `a = 10`
  (`category: 'assignment'`, `target: 'a'`, its value in the written-value
  member and the paired resolve) followed by ANY event whose `scopes` snapshot
  shows `a: 10, b: 3` at the same instant. The snapshot pair in one moment is
  the confrontation — two variables, one moment, different values.
- **Timing**: the contradiction must land at the event AFTER the third line,
  while their `b === 10` prediction is still on the table — a final-state reveal
  lets them repair the story ("it updated at the end") instead of the model.

## Journey 2 — "the program runs like a helpful human reads" (Pea's superbug)

- **Arrives believing**: the machine understands intent — lines can execute
  early, wait for each other, or re-run when "needed" (Pea's intentional
  interpreter; du Boulay's difficulties with the machine's literalness).
- **Predict moment**: any three-statement program where they narrate an order
  other than top-to-bottom, one-at-a-time.
- **Confronting data**: the `step` ordinal itself — strictly increasing, one
  moment at a time, every evaluation event's `loc` pointing at exactly one span.
  The trace's spine IS the correction: there is no simultaneity anywhere in the
  data, and every "it must have gone back" has no step to point at.
- **Timing**: stepping one ordinal at a time (never auto-play) is the workflow
  that makes the ordinal argue; a completed trace read as a table re-admits the
  intentional story between the rows.

## Journey 3 — "the while condition is watched continuously"

- **Arrives believing**: a loop exits the instant its condition becomes false,
  mid-body (the continuously-monitored-condition misconception in Sorva's
  catalog and du Boulay's loop difficulties).
- **Predict moment**:
  `let i = 0; while (i < 2) { i = 5; console.log('body end'); }` — they predict
  the log never fires because `i = 5` kills the loop immediately.
- **Confronting data**: the loop's test event (per iteration, carrying the
  tested value and the boolean it coerced to) appears ONLY at iteration
  boundaries; the body's events after `i = 5` — including the log riding the
  next emitted event — sit between two test events. The absence of any test
  event mid-body is the datum.
- **Timing**: the prediction must be pinned before the body runs; the correcting
  observation is "you predicted an exit HERE — where is the test event that
  would have caused it?", which only works step-by-step.

## Journey 4 — "loop closures share one variable" — the repaired journey

- **Arrives believing**: functions made in a loop all see the loop variable's
  final value — `for (let i…) arr.push(() => i)` yields `[3,3,3]` (the
  closure-capture misconception; Kaczmarczyk et al.'s memory-model families).
- **Confronting data**: per-iteration scope-create events and `scopes` snapshots
  showing a FRESH `i` binding each iteration, and the pushed functions' call
  events whose paired resolves answer `0, 1, 2`.
- **The reason this journey is named**: the klve reference's restructure broke
  per-iteration `let` capture and MEASURED `[3,3,3]` — the tool confirmed the
  misconception (the ledger's r8 ii). The port repairs it by leaving the loop
  native; this journey is the repair's learner-facing ground, and its suite row
  pins the data this journey depends on.
- **Timing**: the correction needs the CALL steps, later, to disagree with the
  belief formed at the loop — a journey spanning two regions of the trace, which
  is why steps carry stamps a lens can navigate back through.

## Journey 5 — "both sides of || always run"

- **Arrives believing**: both operands of `&&`/`||` evaluate, then the operator
  picks (eager-evaluation misconception; Sorva's catalog).
- **Predict moment**: `let n = 0; true || (n = 1);` — they predict `n` becomes
  `1`.
- **Confronting data**: the ABSENCE of events — no assignment event, no literal
  event for the right operand — between the left operand's events and the
  short-circuit operator's own event (whose `shortCircuited: true` flag says so
  outright). Absence is data here, which is exactly why the trace must be dense
  enough that absence is conspicuous (the granularity affordance klve-069
  restores).
- **Timing**: immediately at the operator's event, with its paired resolve
  carrying the expression's result (`true`) and nothing in between.

## Journey 6 — ""5" + 1 and s++ — coercion stories" — the second repaired journey

- **Arrives believing**: strings and numbers "just work" symmetrically —
  `"5" + 1` is `6`, or `s++` on `"5"` errors (operator-coercion misconceptions;
  du Boulay's difficulties with hidden semantics).
- **Predict moment**: `let s = "5"; s++; s;` and separately `"5" + 1`.
- **Confronting data**: the update's resolve (`"5"` stored as the NUMBER `6`
  after `++` — native ToNumeric) and the addition's resolve (`"51"` for `+`) —
  the asymmetry IS the lesson. Later, the coercion legs (the ruled klve-097
  addition) attach the inferred abstract-operation data (ToNumeric on `++`, the
  concat-vs-numeric branch on `+`) to these same steps, making the hidden
  operation visible rather than deduced.
- **The reason this journey is named**: the klve reference REWROTE `++` through
  binary `+` and measured `"5"++ → "51"` — mistaught the exact story (the
  ledger's r8 iii). Repaired: the data now tells the specification's truth, and
  the epistemic line holds (the legs are inferred per spec, not observed — the
  machine twin's honesty line).
- **Timing**: at the operator's own event — coercion explanations detached from
  the step where the surprising value appeared are the lecture this workflow
  exists to replace.

## Journey 7 — "a call is a jump, and the return value is fuzzy"

- **Arrives believing**: calls are gotos; parameters are renamed globals; the
  return value is fuzzy (Sorva's call/return families; du Boulay).
- **Predict moment**:
  `function f(x) { x = x + 1; return x; } let y = 2; f(y); y;` — they predict
  `y` is `3`.
- **Confronting data**: the call event (`name: 'f'`, `args: [2]`), the
  function-scope create event and the body's events with a `scopes` snapshot
  showing `x` — a `param` binding initialized to `2` — in a FRESH scope beside
  the outer scope's untouched `y`, the return event (`statements.return`, its
  written value `3`) with the call's paired resolve carrying `3`, and the final
  read of `y` whose resolve answers `2`.
- **Timing**: the fresh-scope snapshot must be visible DURING the call — after
  the return, the scope is gone and the story is unfalsifiable.

## Journey 8 — "declarations happen where I wrote them" — the TDZ/var journey

- **Arrives believing**: a declaration line creates the variable at that line;
  before it, reading the name is like reading any missing name — or, in the
  refined version, "it's just `undefined` until assigned", flattening `var` and
  `let` into one story (hoisting/TDZ confusions; Kaczmarczyk et al.).
- **Confronting data**: the declare-burst events at scope ENTRY show every
  binding created before any line runs — that corrects "created at the line."
  The var/let split then corrects the flattening, because the data now tells the
  specification's two stories (the 2026-09-06 ruling): a **`var`** entry
  initializes to `undefined` at instantiation and its early snapshot honestly
  reads `undefined`; a **`let`/`const`** entry declares into the TDZ, its
  snapshot marks `{ unreadable: 'tdz' }` — a visibly different datum, not a
  fabricated `undefined` — and an actual early READ throws the real
  ReferenceError in the event stream. Side by side, `var v` and `let l` above
  their declaration lines now produce three DIFFERENT observations (`undefined`
  · unreadable-tdz · a thrown read), which is exactly the three-way distinction
  the misconception collapses.
- **Timing**: the snapshot contrast must be inspectable at the first step AFTER
  scope entry, while "they're all just undefined" is the live prediction; the
  thrown read lands wherever the learner dares the early read.

## Journey 9 — "undefined means nothing happened"

- **Arrives believing**: an expression with no visible result produced no value
  — `undefined` is an error-ish absence, not a value (du Boulay; Sorva's
  value/evaluation families).
- **Confronting data**: the paired ResolveEvent PRESENT and carrying represented
  `undefined` for every undefined-valued expression — the port's north-star
  repair (klve-030): the klve reference omitted the value entirely, making
  exactly this misconception unfalsifiable from its data. Now "it evaluated, and
  its value is `undefined`" is a datum, distinguishable from a statement's
  having-no-value-at-all.
- **Timing**: at the expression's own resolve — the moment "nothing happened" is
  the live prediction.

## What every journey assumes of the data (the twin's demands on the contract)

- **Events at expression grain, dense enough that absence argues** (journeys 2,
  5).
- **A resolve for every captured expression, `undefined` included** (journey 9 —
  the klve-030 repair is a ux requirement, not a nicety).
- **The spec's own binding split told as data** (journey 8 — var's honest
  `undefined`, the structural TDZ mark, the real thrown read).
- **Scope snapshots at the step's own moment, mutation-safe** (journeys 1, 4, 7
  — described-at-capture is what makes "one moment, two variables" trustworthy).
- **Native semantics in every value** (journeys 4, 6 — the r8 repairs are the
  difference between correcting and teaching misconceptions).
- **Stamps a lens can navigate by** (journey 4's two-region arc).
- **Stated limits where the data cannot carry a correction** (journey 8 — an
  honest gap beats a confident wrong datum, the same rule the campaign applies
  to itself).
- **Timing is the lens's half**: this library guarantees the data exists at the
  right grain with the right fidelity; putting it in front of the learner at the
  prediction's moment of failure is the consuming lens's design obligation, and
  these journeys are the requirements it designs against.

## Navigation

- [../README.md](../README.md) — the contract these journeys constrain.
- [../notional-machine.md](../notional-machine.md) — the machine's own honesty
  lines (journey 8 leans on them).
- [../data-model.md](../data-model.md) — what the shapes are; identity and
  snapshot semantics (journeys 1, 4, 7).
