<!-- cspell:ignore klve stepperize undescribe undescribed undescribes undescribing subkind subkinds -->

# The step-instrumentation data model

The data twin: what this library's shapes ARE — identity, ownership, lifetimes,
and the invariants no type can state — modeled before the types lock so it
constrains them. [notional-machine.md](./notional-machine.md) models what does
the processing; this document models what is processed: how **configuration data
interacts with a running program's instrumentation to create runtime event
data**. The route is DOCS.md's `## Data flow`; this document carries what a flow
diagram cannot draw about its nodes.

## The life of a configuration

Configuration changes FORM four times, each form with its own owner and
lifetime:

1. **Raw options** — consumer-owned, possibly invalid; exists only as the
   argument crossing `resolveOptions`. Nothing downstream ever sees it.
2. **Resolved options** — the expanded, defaults-filled, validated, frozen form
   the seam answers (no shorthand survives; cross-field co-gates verified).
   Ground truth for one instrumentation and one collector; immutable, so sharing
   across many pairs is safe; identity is structural.
3. **The capture plan** — resolved options translated into per-node, per-subkind
   transform decisions. An intermediate the transform consumes and discards;
   never a consumer surface.
4. **Baked decisions** — the plan's final form: absorbed into the instrumented
   TEXT. Not a runtime value. Once `instrument` returns, the configuration's
   capture half has no runtime representation — the text IS the configuration;
   changing it means instrumenting again. The collector consumes only the
   RESIDUAL runtime half: `data.dt`/`data.logs` shaping, the per-layer name
   filters and the range window, and the caps.

**The pairing invariant is dissolved by construction** (the ruled API):
`instrument` RETURNS the namespace it baked AND the `programStamp` (the
whole-program loc/offsets/source the anchor family needs), and `createCollector`
takes both — a text/collector mismatch on either is unrepresentable at the call
site rather than a documented hazard. The one residual pairing obligation: the
RESIDUAL options handed to the collector should be the same resolution the text
was baked from — a mismatch cannot crash (both halves validate independently)
but yields a stream whose gating disagrees with the text's; the tracer unit's
assembly holds both halves in one place, and a bare host should too.

## The shapes

### Instrumented text

A program string with the protocol baked in. Produced and handed straight on —
non-persistence stated positively: never written down here; it exists between
`instrument`'s return and wherever the host stores it. Recomputable
(instrumenting is pure — same inputs, same output, no shared state). Hidden
couplings: the namespace (returned, so visible) and the baked residual
expectations above. Beside it rides the **declines manifest**
(`{ nodePath, reason }` per roster-declined site) — produced with the text,
owned by whoever holds the text, and the one record that makes a declined
absence in the event stream checkable rather than invisible.

### The collector

One run's mutable accumulation state, closure-confined behind the injected
global — the declared mutable-state exception, per-run disposable. **Ownership:
one collector, one run, ever**; reuse is undefined by design and guarded by
disposability, not detection. A collector created and never driven still answers
its four anchors — an assertion honest only for a program headed to evaluation
(the anchors' bounded claim); a host that mints collectors it never uses holds
anchor-only arrays, not traces. Its holders, all private:

- the **latched intrinsics** — captured at creation, before learner code;
  immutable thereafter; the reason classifications survive a hostile realm.
- the **site counter** (cap basis — a site is one OBSERVATION POINT, klve's push
  basis; initializes at 1, the anchor family's ratified contribution; never
  reset) · the **emission ordinal** (`step`; only on emit; contiguous) · the
  **per-loop-entry counters** (`maxIterations`' basis) · the **visit counts**
  (per nodePath, pre-residual-gate) — four counting concerns that never share a
  slot.
- the **events array** — the typed, frozen, VR-valued records; the four
  lifecycle anchors are minted into it at creation (steps 1–4), so it is never
  empty; append-only.
- the **parked logs** — represented console lines awaiting the next emitted
  event. Lifetime: console call → next emission (tail logs after the last
  emission stay parked and are surrendered — the differential suite pins the
  reference-equivalent boundary).
- the **trace clock zero** (`t0`) — set at creation; every `dt` measures against
  it (the machine twin carries the prediction this buys and the trap it sets).

**Same-instant invariants** (unrepresentable in types): events.length = emission
ordinal, always (sites and the ordinal carry NO fixed ordering against each
other — one observation point may emit zero, one, or two events, so neither
bounds the other; the B1 ruling's cardinality); a parked line and an emitted
event never hold the same represented values (attachment moves, never copies);
every cross-reference field (`scopeCreationStep`, `declarationStep`,
`beginStep`, …) names the `step` of an event that WAS emitted, or is absent —
never a dangling ordinal.

### The trace event (wire form = delivered form)

One typed record per observed moment — the adopted union, VR-valued, frozen at
emission, clone-safe by construction (`nodePath` is a string, no AST references,
no live values). **Ownership transfers outward at read**: `events()` answers a
stable snapshot array — mid-run, a prefix of the run so far; after the run, the
whole record — and the collector never reads it back. Identity: an event IS its
`step` within its run; events from different runs are never comparable. The
event stream needs NO thread-side finishing; only snapshot legs do.

### ValueRepresentation (a value leg)

The tagged, shallow, honest form: primitives exact (NaN/-0/±Infinity flagged;
bigint a decimal string; symbols carry their description), functions name+arity,
errors name+message, dates their time value, other objects a className. **It is
a REPRESENTATION, not a reference**: two legs representing one live object carry
no shared identity, and no leg updates when the object mutates — each is the
moment's truth. Ground truth: the only record of what the value was at that
step; nothing recomputes it.

### The snapshot (a `data.scopes` leg)

The deep described form (descriptor + heap), kept for the one affordance the
adopted surface lacks: the whole visible binding environment at a moment.
Identity within one snapshot is preserved (shared references and cycles survive
via the heap map); identity ACROSS snapshots is deliberately severed — the same
live object snapshotted at two moments yields two independent descriptions,
because later mutation must not rewrite history. TDZ entries are
`{ unreadable: 'tdz' }` — a structural mark, not a value. Undescribing re-mints:
fresh objects, callable fakes, never-resolving promises, per-call fake
constructors — `===` never bridges the wire, and even `constructor` identity
does not bridge moments (the klve-091 wrinkle resolved under r3: honest identity
is no identity).

### The stamp

`nodePath` + `loc` + `start`/`end`, baked per event from the library's own
parse. Ground truth for attribution; never recomputed. The offsets are the
cross-parser join key (embody's `byOffset`); the path is the within-stream
grouping key (visit counts, pairing adjacency). The invariant types cannot
state: all stamp legs on all events of one run come from ONE parse of ONE text —
mixing runs of edited text silently mis-joins, and nothing can detect it. **The
anchor family carries the whole-program stamp** (`'$'`, whole-program loc,
offsets `[0, code.length]`) — minted at collector creation from the
`programStamp` that `instrument` returned, the one stamp whose provenance is
delivery rather than the parse walk; whole-program attribution makes the anchors
deliberately unjoinable at node grain.

### The trip record

A cap's marked-throw payload: which ceiling (`sites` | `time` | `iterations`)
and the measured facts at the trip. Minted by the collector, riding the thrown
error under a non-enumerable structural marker, read back **by reference**
through `readCapTrip` — in-realm only (a structured clone strips the marker;
classification happens where the raw throw lives, the iteration-guard
discipline). The one library shape that travels inside learner-visible control
flow.

### Provenance ids (D1 — contract now, machinery later)

`valueId`/`sourceValueIds` on resolves are OPTIONAL fields carried by the
contract; no machinery mints them yet. When built: ids are assigned at emission
(a gate-dropped resolve consumes no id), and `sourceValueIds` only ever names
emitted ids — the deferred design inherits the adopted surface's own rule.

## Ground truth vs recomputable

| shape             | ground or cache                                            |
| ----------------- | ---------------------------------------------------------- |
| resolved options  | ground for its pairs; recomputable from raw options        |
| the capture plan  | recomputable (pure derivation); never held                 |
| instrumented text | recomputable (pure) — cache with a correctness obligation  |
| declines manifest | recomputable (pure derivation from text + options)         |
| the programStamp  | recomputable (whole-program facts of the same text)        |
| collector state   | ground — irrecoverable; nothing replays a run              |
| trace events      | ground — the only record of the run's moments              |
| snapshot legs     | described = ground; undescribed = recomputable from them   |
| stamps            | ground (a re-parse reproduces them only for the same text) |
| visit counts      | ground (pre-gate counts are not derivable from the         |
|                   | emitted stream under residual filtering)                   |
| trip record       | ground — the trip's measured facts                         |

## Deliberately representable illegal states

`types.ts` forecloses what a union can; these stay representable, and this
record is the guard:

- a collector driven by two executions (disposability is the rule);
- events from different runs mixed in one array (`step` uniqueness is
  per-collector);
- a stamp joined against a different text's parse (silent mis-join);
- residual options at the collector diverging from the text's resolution (gating
  disagreement, named above — never a crash);
- a forged trip marker (readCapTrip validates shape depth; deliberate forgery is
  the host sandbox's concern);
- a trip record read after a structured clone (the marker does not survive;
  classify in-realm).

## Menu note

This document uses the section set above rather than a pinned menu — the data
twin convention deliberately pins none (DEV.md § Directory Documentation
Convention); the sections chosen are the ones its ownership list names (identity
· ownership · lifetime · ground-vs-cache · same-instant invariants ·
non-persistence · representable-illegal), each carrying its subject here.

## Navigation

- [README.md](./README.md) — the contract these shapes serve.
- [notional-machine.md](./notional-machine.md) — the machine that produces them.
- [ux/user-journeys.md](./ux/user-journeys.md) — the learners downstream of the
  final data.
- `DOCS.md` `## Data flow` — the route; this document is the water.
