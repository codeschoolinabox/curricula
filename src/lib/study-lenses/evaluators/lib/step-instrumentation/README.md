<!-- cspell:ignore klve stepperize undescribe undescribed undescribes undescribing jsviz subkind subkinds -->

# step-instrumentation

The instrumentation toolkit that makes a JavaScript program report its own
execution as a stream of **typed semantic trace events**: a Babel transform that
rewrites source so every configured moment reports itself, the **collector**
those reports arrive at, and the value machinery that carries runtime values
across a wire honestly. Two lineages meet here, by ruling: the **mechanics** are
an adapted TypeScript port of the klve tracer core (Kelley van Evert,
[jsviz.klve.nl](https://jsviz.klve.nl); every fidelity disposition in the
campaign ledger,
`.planning-handoffs/evaluators-api-restoration/KLVE-LEDGER.md`), and the
**config and event contracts** adopt the semantics tracer's surface — the
5-layer notional-machine model litigated against the ECMAScript spec (the
read-only lineage at `src/lib/embody/lib/evaluating/trace/semantics/`) — widened
from its JEJ scope to full JavaScript (human ruling 2026-09-06, Path B; HR-16's
config-richness obligation is the standing ground). klve's capability set
remains the differential-property floor.

**What this library is NOT.** Not an evaluator — no kind contract, no posed
runs, no refusal shape. Not an engine consumer — it imports NO engine code; a
later tracer evaluator unit hosts it on the engine without rework, and the
sandbox page beside this module is dev infrastructure OUTSIDE the library's
import surface. Not the klve wrapper ecosystem (wrappers, schema layering,
language routing, cache id — § What does not cross), and not the Aran deep
tracer — what only observation of the engine's internal operations can give
stays Aran's (§ The epistemic line).

**The north-star** (human ruling 2026-09-05, verbatim): "ECMAScript fidelity _in
the final data emitted from tracer events to the generator consumer_. Whatever
it takes to get there while still accurately capturing the program's execution
is ok." Mechanism is free; the final emitted data holds ECMAScript fidelity.
Every divergence recorded below answers to that sentence.

**The name** — `step-instrumentation` names the whole (the transform, the
collector, and the value machinery for step-numbered trace events), noun-phrased
like its `lib/` siblings (`iteration-guard`, `guarded-worker-base`). The
transform plugin's own `name` field stays **`stepperize`** — the field both
ancestors registered, which is where the lineage token belongs. The trade,
named: the `klve` token is absent from the path; attribution rides this README
and every ported file's header (§ Attribution).

## What lives here

One concept per file; transported files keep their tested shapes (high-fidelity
reuse is ruled — copied exactly, adapted minimally, never simplified):

```text
step-instrumentation/
├── types.ts                 the contract: options, resolved options, the
│                            event union, ValueRepresentation, the collector
│                            contract, snapshot descriptors, failures
├── notional-machine.md      the machine twin, two parts: the instrumentation
│                            machine and the running machine
├── data-model.md            the data twin: how configuration interacts with
│                            a running program's instrumentation to create
│                            runtime event data
├── ux/                      the user twin: learners confronting documented
│                            misconceptions, and where the ECMAScript-correct
│                            event data corrects each
├── resolve-options.ts       the options seam verb: expand → fill → validate
│                            → cross-field verify (one boundary; nothing
│                            downstream re-validates)
├── expand-shorthand.ts      ┐ the seam's stages, transported from the
├── fill-defaults.ts         │ semantics prepare/ pipeline (the LIVE one —
├── verify-options.ts        ┘ its expander recurses into nested shorthand;
│                            the orphaned configuring/ copy is not the
│                            source) with the widened schema (ajv;
│                            cross-field checks incl. the template
│                            begin/evaluation co-gate)
├── options-schema.ts        the JSON Schema for the widened options shape
├── derive-capture-plan.ts   resolved options → the transform's per-node,
│                            per-subkind capture decisions (the gate map;
│                            operator→subkind tables transported)
├── mint-node-path.ts        the deterministic nodePath grammar over the
│                            Babel parse ($.body.0.test.left-style)
├── instrument.ts            the Babel transform (plugin name `stepperize`):
│                            capture-gated wraps, unconditional count
│                            channel, synthetic scope/branch/iteration
│                            events, the decline roster + declines
│                            manifest, stamps
├── runtime/                 the PROGRAM-REALM half — everything the
│   │                        instrumented text touches while running (a
│   │                        hosted worker's chunk; nothing here may import
│   │                        a thread-side module):
│   ├── create-collector.ts  one run's collector: counts always, records
│   │                        what the plan admits, VR at capture, visit
│   │                        counts, caps (sites · time · loop
│   │                        iterations), latched intrinsics, log parking
│   ├── events/              the event-builder layer, transported from the
│   │                        semantics event-generators (~20 pure builders
│   │                        + compile-conformance asserts), widened per
│   │                        the event contract; emit discipline: count →
│   │                        gate → number → stamp → freeze
│   ├── represent-value.ts   raw value → ValueRepresentation (transported;
│   │                        + Symbol/Date arms; Error/className arms
│   │                        implemented as its types define)
│   ├── compute-coercion.ts  the inferred coercion legs (transported
│   │                        starting point, spec-widened: the == ladder,
│   │                        ToNumeric/bigint honesty, ToPrimitive)
│   ├── scope-stack.ts       scope-instance runtime (transported:
│   │                        creationStep/depth/structure/findNearestLoop)
│   ├── describe.ts          deep snapshot codec (klve's, with the ruled
│   │                        repairs) — scopes snapshots only
│   └── read-cap-trip.ts     structural classification of a cap's marked
│                            throw — IN-REALM only: the marker does not
│                            survive a structured clone
├── undescribe.ts            snapshot codec, thread side
├── undescribe-steps.ts      the thread-side finishing pass over snapshots
├── babel-standalone.d.ts    the @babel/standalone declaration, transported
│                            from the klve package and extended (292 lines
│                            at transport)
└── tests/                   the behavioral suite + compile probes
```

Everything outside `runtime/` is thread-realm (the transform, the seam, the
undescribe half); the realm split is the directory split, the engine's own
fix-realms-by-import-graph discipline, and `runtime/` + `runtime/events/` carry
their own README/DOCS pair at 0.3 per the every-directory rule.

`sandbox.html` + `vite.sandbox.config.ts` land beside these files in Phase 1
(the run/intercept precedent; § The sandbox cadence). No barrel; consumers
import each verb under its own name.

## The pipeline

Host-agnostic: **text + options in → instrumented text + a collector out**. The
host — a test today, the tracer evaluator unit later, the sandbox page in
between — owns execution, posing, budgets, and delivery:

1. `resolveOptions(options)` — the one validation boundary (unknown keys
   refused; per-list include/exclude mutual exclusion; empty lists filter
   nothing; unique items; cross-field co-gates). Everything downstream takes the
   resolved form; nothing re-validates.
2. `instrument({ code, sourceType, options, namespace? })` →
   `{ code, namespace, declines, programStamp }` — the Babel transform.
   `sourceType` is the snippet's own parse goal, explicit, never inferred
   (klve-075). The namespace is settable (klve-046, r4 adopted) and
   **returned**, so a text/collector pairing mismatch is impossible by
   construction; `programStamp` (the whole-program loc + offsets + source)
   travels the same way — `createCollector` consumes it to mint the anchor
   family, so the anchors' no-empty-required-fields discipline is reachable
   through the published API and mis-pairing stays unrepresentable. `declines`
   is the manifest of roster-declined sites (`{ nodePath, reason }` each) — a
   declined absence is STATED incompleteness a consumer can check, never an
   invisible hole in a data model where absence argues (§ The transform
   contract).
3. `createCollector({ namespace, programStamp, data, maxSites, maxTime, maxIterations })`
   — one run's collector. The host injects `collector.global` under the returned
   namespace and executes the instrumented text wherever it runs things.
4. `collector.events()` — the recorded trace events (already
   ValueRepresentation-typed, wire-safe, frozen at emission);
   `collector.visitCounts()` — per-nodePath traced-evaluation counts;
   `collector.describedSteps()`-era deep snapshots ride each event's optional
   `scopes` leg in described form.
5. `undescribeSteps(events)` — thread-side — finishes the snapshot legs; the
   event stream itself needs no finishing. The result is the **final emitted
   data**, the surface the north-star governs.

## The options contract

The shape is the semantics tracer's `TraceOptions` — the 5-layer mental model,
adopted whole (the human's ruling: that config "was carefully crafted to capture
a learnable & complete JS notional machine") and widened to full JavaScript:

```text
resolve      the data layer: ResolveEvents; dependent · provenance · kinds
expression   variables (read/update) · operators BY SUBKIND (arithmetic,
             addition, comparison, typeof, negation.{logical,bitwise},
             bitwise, shortCircuiting, conditional, assignment.{simple,
             compound}, increment.{prefix,postfix}, in, void, comma) ·
             literals (string, number, bigint, boolean, null, undefined,
             regex, ARRAY, OBJECT) · templates (begin/evaluation/end) ·
             properties (dot/bracket/optionalChaining) · functions
             (call/return/DEFINE) · this
statements   variables (initialize/available) · expressionStatement · try ·
             conditionals (test/branch) · while · doWhile · for · forOf ·
             return · break · continue · debugger
scopes       script · block · function · catch × create/enter/interrupt/
             completion/leave/declare
errors       the error channel (top-level; uncaught only in v1)
```

plus: the per-layer `filter` name lists (adopted, gaining exclude semantics —
below), `range` (adopted, re-homed from the lineage's `TraceConfig` into the
options), and the `data` legs (`scopes` deep snapshots · `value` · `logs` · `dt`
— klve's output-shaping capability re-homed; `loc` is NOT among them — the stamp
is constitutive, ruled 2026-09-06). **This unit's widenings of the adopted
shape, enumerated** (each a named delta in § Correspondence):
`expression.literals.array`/`.object` · `expression.functions.define` ·
`expression.this` · `statements.expressionStatement` · `statements.try` ·
`statements.return` · `scopes.function` · `scopes.catch` · the `comma`/sequence
operator subkind arm · the `data` legs and `range` re-homes. Boolean shorthand
per layer expands at the seam (the transported pipeline).

- **Where each gate applies — the per-leg table** (the design's single ruled
  posture, launch ruling 5, stated once):

  | gate                                            | applies at                                                            |
  | ----------------------------------------------- | --------------------------------------------------------------------- |
  | every layer/category/subkind toggle             | TRANSFORM — an off gate bakes no wrapper at all                       |
  | `data.scopes` snapshot thunks                   | TRANSFORM — un-baked legs cost nothing                                |
  | `data.value` capture                            | TRANSFORM — the report call omits the value argument                  |
  | `data.dt`, `data.logs` shaping                  | COLLECTOR — runtime facts, shaped at emission                         |
  | per-layer `filter` name lists, `range`          | COLLECTOR — runtime residual (names/positions may be runtime-decided) |
  | caps (`maxSites` · `maxTime` · `maxIterations`) | COLLECTOR — execution ceilings, not capture shape                     |

  The stamp (`nodePath` + `loc` + `start`/`end`) is on every table row's OUTPUT
  regardless — constitutive, never gated (ruled 2026-09-06: "let's have loc, why
  not. but also offset, which is more standard across embodiments"). klve-016's
  loc-strip leg is superseded by the adopted base shape, the delta named in §
  Correspondence.

  This is the semantics design's own weave-time/runtime split, kept — and it
  resolves what klve's post-filter did at the wrong end: there is no
  post-filter; an un-configured site has no wrapper, and a bare count touch is
  all that remains (§ Counting and caps).

- **Name filters, reconciled**: the adopted per-layer `filter` lists are the
  shape, and they gain **exclude** semantics beside include. klve's ratified
  boundary constraints transfer to the seam: include/exclude are mutually
  exclusive per list (klve-014), an empty list does not count as provided and
  filters nothing (klve-080), duplicate entries are refused (`uniqueItems`,
  klve-082), unknown keys are refused at every level (klve-082). Two klve-floor
  rules re-home honestly rather than nominally: klve-013's include-wins leniency
  is **unreachable by construction** here — the one seam refuses the
  both-provided config the leniency existed to tolerate, so the row records
  unreachable-by-construction (klve-029's own device), not a live semantics; and
  klve-012's nameless-pass rule survives as the filter's stated semantics — an
  event with no name-bearing member always passes a name filter.
- **Two incoherent configurations are refused at the seam** (cross-field checks,
  beside the transported template co-gate): `data.value: false` with `resolve`
  enabled (the split puts the value nowhere else — a value-less resolve is
  content-free), and `expression: false` with `resolve.dependent: true`
  (co-gated resolves with no expressions is a trace of nothing; the adopted
  surface's own working form pairs it with `dependent: false`).
- **Defaults**: every gate on, no filters, whole program, all data legs — an
  empty options object is first-class (klve-017).
- **Types outside the toggle surface capture unconditionally** (klve-011's rule,
  kept): the gates cover the named categories; every other loc-bearing construct
  the transform can soundly wrap is always a capture site — except the decline
  roster's members, which are never wrapped at all (§ The transform contract).
  Widening the toggle surface later is additive.
- **The caps ride `createCollector`**, not the options: `maxSites` (the site cap
  — klve-018's capability under the re-lock's honest spelling: it caps
  observation points, and this module's own glossary reserves `step` for the
  emission ordinal), `maxTime` (klve's own wall-clock at the collector,
  klve-019/r2 — coexists with any host budget), and `maxIterations` (klve-079's
  ruled collector-side facet: per-loop-entry counting at the loop-test
  meta-control site — this module's own marker and classifier, NOT the region's
  spliced iteration guard; the collision with the region root's "guards always
  splice / the iteration guard enforces" sentences is recorded as a TRACER-gated
  row + FLAG, decided by the tracer unit with both instruments in view, per the
  2026-09-06 ruling).

## The event contract

The semantics `TraceEvent` union, adopted with its disciplines and widened by
the ruled cheap set. The disciplines, kept exactly:

- **The expression/resolve split** (ruled): an expression event carries CONTEXT
  (operator, operands, name, kind); the produced value lives in exactly one
  place — the paired `ResolveEvent`, the NEXT event on the same `nodePath`.
  Co-gating (`resolve.dependent`, default true) is decided at transform time;
  `dependent: false` frees resolves to fire alone (a pure data trace). Dual
  perspective is intentional (`x = 5` fires the operator view + the binding
  view + the data view, one nodePath).
- **`semantics` is fixed per event variant** —
  `'lifecycle' | 'resolve' | 'expression' | 'statement' | 'scope' | 'error'` —
  so a consumer buckets a mixed stream by mental-model layer without knowing
  every category (`lifecycle` is this unit's arm for the anchor family, below;
  the other five are adopted).
- **`step` is assigned at emission**, after the runtime residual gates, so the
  delivered stream is contiguous 1..N by construction (r1 adopted; the renumber
  problem dissolves).
- **Navigable cross-references** (`scopeCreationStep`, `declarationStep`,
  `beginStep`, `targetScopeCreationStep`, …) carry the referenced event's
  `step`, and are omitted when that event was not emitted.
- **Coercion visibility**: tests carry `value` + coerced `result` (+ `coercion`
  when truthiness coerced); operator/assignment/template events carry optional
  `coercion` legs (§ The coercion legs).

**The widenings** (JEJ → full JavaScript; every one a named delta in §
Correspondence, spec-derived):

- `BindingKind` gains `var`, `function`, and `param` (with the catch binding
  riding `param`'s row). Lifecycles per the specification: a **`var`** binding
  declares AND initializes to `undefined` at function/script environment
  instantiation — its `declare` + `initialize(undefined, explicit: false)` +
  `available` burst fires at scope entry, and a read before the declaration line
  honestly answers `undefined`; **`let`/`const`/`class`** declare into the TDZ
  at scope entry and initialize at their declaration's execution (`available`
  marks TDZ-exit; a TDZ read THROWS, and a snapshot probe marks the entry
  structurally unreadable — § Values); **`function`** declarations initialize to
  the function object at scope entry (the transported block-declaration
  pattern's own `explicit: true` case); **`param`** bindings initialize to their
  ARGUMENT values at call entry, the catch parameter to the caught value — never
  a fabricated `undefined`.
- `ScopeKind` gains `function` and `catch` — one create/enter per CALL (the
  adopted per-iteration pattern generalized: `for`/`for-of` scopes already push
  per iteration; function scopes push per call). A function scope's `leave` with
  `reason: 'error'` is the one lifecycle moment that is NOT statically knowable
  — it rides a runtime try/finally the transform injects around function bodies
  (meta-control; named here because everything else synthetic IS static).
- **`FunctionReturnEvent`** is authored fresh: the adopted surface rules "no
  function-return event" because JEJ has no user functions and the call's
  ResolveEvent carries the return value — that rule KEEPS holding for the
  call-expression's produced value; the new event models the RETURN STATEMENT
  executing inside a user function (a statement-layer moment JEJ never had), and
  it gates under `statements.return` — gate layer matching event layer, the
  adopted surface's own discipline for layer-splitting categories. The klve
  quarry's generator file for it exists without a type — the type is this
  unit's, the delta named.
- **`this` reads** are an expression-layer event (read-shaped, carrying the
  resolved `this` representation); **`new`** rides the call event family with a
  construct discriminant; **define** events (function/arrow expressions
  evaluating to a function value — klve's `define`, klve-009) get their own gate
  under `expression.functions.define`.
- **The lifecycle-anchor family** (ruled 2026-09-06, replacing a single init
  event): the trace OPENS with one anchor event per pre-evaluation phase of the
  embodiment lifecycle — `source` → `tokens` → `ast` → `environment`, embody's
  own phase spelling — and everything after them IS the `evaluation` phase. Each
  anchor is `semantics: 'lifecycle'`, attributed to the whole program
  (`nodePath: '$'`, whole-program `loc`, offsets `[0, code.length]`) — the
  adopted surface's own no-empty-required-fields device — and **entwinement
  rides the embodiment's phase structures**: an anchor marks the phase; the
  structures a consumer joins against (the source text, the token stream, the
  AST, the environment record) are the embodiment's own, not this library's. The
  anchors are notional-machine truthful for ANY host — every engine ran those
  phases — and where an embodiment exists its gate has guaranteed them. They
  pass every filter (klve-081's capability re-homed) and the site counter's
  ratified init-inclusive basis is theirs as one family contribution (§
  Counting). The environment anchor immediately precedes the script scope's
  create/declare burst — the phase and its observable content, adjacent. **Empty
  code is a legal Program** (klve-078 re-adjudicated by ruling — the ledger
  records the supersede with this ruling as its strength argument): it traces to
  the anchor family plus whatever scope lifecycle the configuration admits —
  never a throw.
- The ratified-capability spellings folded into the layer list above:
  `literals.array`/`.object` (klve-008 — with `LiteralKind`/`ResolveKind` arms),
  `statements.expressionStatement`/`.try` (klve-004), the `comma`/sequence
  subkind arm (klve-007 — the adopted config named the gate; its types never
  carried the arm; both do here), `functions.define` (klve-009). klve-015's
  before/after **timing** capability lives in the mapping layer: under the split
  model, before-legs are test/begin/call-entry events and after-legs are
  resolves — the differential mapping derives klve's `time` from event kinds, so
  the capability survives without a timing gate (§ Correspondence).

**Deferred but representable** — carried as optional fields or named D-numbers
in DOCS, never silently absent:

- D1 — provenance (`valueId`/`sourceValueIds` on resolves): the contract fields
  ride now; the collector's id machinery is a later increment.
- D2 — `scopeChainWalk`/`protoChainWalk`: transported PROVISIONAL, exactly as
  the source marks them; when built, both are INFERRED (static scope resolution;
  reflective descriptor walks) under § The epistemic line.
- D3 — async/generator suspension moments; class lifecycle events: bodies
  instrument normally today (steps flow); dedicated NM events are future
  widenings.
- D4 — caught-throw observation: v1's error channel reports UNCAUGHT errors only
  (a transform-injected top-level wrap; attribution approximate, honestly
  labelled — the adopted design's own posture); catch-entry scope events make
  caught flow visible without a dedicated throw-observation event.
- D5 — the increment sub-events: the adopted surface desugars `x++` into read +
  arithmetic + write sub-events; this port's ruled in-place native update
  observes the expression's native values instead (r8 iii's repair). One logical
  evaluation, one visit, the desugared internals unobserved — a named
  semantics↔port delta.
- D6 — `switch` and labeled statements: a switch's block environment,
  discriminant evaluation, `===` case tests, fall-through, and `break` out of a
  switch or labeled block are ungated and un-evented in v1 (bodies still
  instrument as ordinary statements/expressions). Building them requires
  WIDENING the adopted `JumpEvent.target` beyond its `LoopKind` union and
  `ConditionalEvent.kind` beyond `if | ternary` — type changes named now, before
  consumers narrow on the closed unions.
- D7 — destructuring patterns and parameter defaults: `const {a, b} = o` and
  `function f(x = 1)` have no per-binding declare/initialize story yet (the
  whole declaration statements still event; pattern-internal accesses are
  ordinary capture sites); the binding-lifecycle widening lands with its own
  spec reading.
- D8 — module scope and import bindings: `sourceType: 'module'` programs
  instrument fully, but `ScopeKind` carries no `module` arm yet (the top-level
  scope events would claim `script` falsely and are withheld for modules in v1)
  and import bindings' immutable-indirect lifecycle is unmodeled.

## nodePath and the stamp

Every event carries the stamp — constitutive, never gated (ruled 2026-09-06):
the anchor family at `'$'` with whole-program legs, every other event with its
node's own, baked at transform time from the library's own Babel parse:

- **`nodePath`** — a deterministic path string in the adopted grammar
  (`$.body.0.test.left`), minted by `mint-node-path.ts` over the parse the
  transform ran on. Stable across identical programs.
- **`loc`** — the ESTree span (1-based line, 0-based column).
- **`start` / `end`** — the UTF-16 code-unit offset pair, near-free at transform
  and the proven `byOffset` join key (the entwineable ruling's library half: the
  stamps are what downstream joins key on; offsets, not paths, are the
  cross-parser join, because the posed text is Babel's reading — a second parse
  truth, klve-027's honesty line).

The frozen **ast record** (`Record<nodePath, ASTNode>`) is deliberately NOT this
library's: the region's embody graph is the region-side node authority, and the
record's construction — if the tracer unit wants the semantics-style
self-contained result — is that unit's (a TRACER-gated ledger row records it).
Events stay self-contained for highlighting (`type`/`loc`/`source` stamped at
emission, the adopted discipline).

## Values

**`ValueRepresentation`** — the adopted tagged form — carries every event value
leg: operands, results, binding values, test values, arguments, returns, log
lines. It disambiguates what JSON cannot (NaN, ±Infinity, -0 via flags; bigint
as a decimal string; null-vs-object; functions by name/arity), and it never lies
— the transported builder's fallback-to-null-object mistrace is replaced by the
arms its own types already define (`ErrorValue` name+message, built where the
error still has its prototype; `ObjectValue.className` for everything else
shallow — both ADOPTED members the builder never implemented), plus this unit's
two new arms: `SymbolValue` (description carried honestly — `Symbol()`
round-trips with `description: undefined`, the klve-093 north-star repair) and a
`DateValue` time-value arm.

**The deep snapshot codec** (klve's describe/undescribe) survives for ONE leg:
the optional per-event `data.scopes` snapshot — the whole visible binding
environment at a moment, an affordance the adopted surface never had and klve's
§§ C/D rows ratify. Its repairs, all ruled: the walk reads own enumerable
string-keyed DATA properties via descriptors and **never invokes a getter** (r8
vi); bigint (r8 vii) and null-prototype (r8 viii) arms; promise classification
by native brand — latched, so learner reassignment of `Promise` cannot undo it
(klve-050's repair held sound); `Error`/`Date`/`Map`/`Set` describe honestly at
least to name/message/time/size (the ar-1 ruling — a caught error with no
message was the measured mistrace); the fake-constructor cache is per-call
(klve-091 under r3); described symbols carry `description`. **TDZ snapshots mark
structurally**: the probe's catch arm distinguishes — a `var` read succeeds and
honestly snapshots `undefined` (the spec initializes `var` at instantiation), a
TDZ read throws and the entry records `{ unreadable: 'tdz' }`, never a
fabricated `undefined` (the north-star adjudication of klve-028 — a
RE-ADJUDICATION, recorded in the ledger as a supersede with the 2026-09-06
ruling as its strength argument). **Proxies bound the promise**: descriptor
reads on a Proxy invoke its traps — learner code — so a binding whose very
inspection traps snapshots as `{ unreadable: 'exotic' }` rather than executing
further learner code; the getter-never-invoked rule is about DATA properties,
and this mark is where its reach honestly ends. **The fake-constructor path
needs `new Function`** (r3's named CSP note): under a Content-Security-Policy
without `unsafe-eval`, undescribed class instances degrade to plain objects
carrying `cname` — stated here so a hosting page's CSP is a known trade, never a
surprise crash.

## Counting and caps

Counting **splits from recording** (launch ruling 5). **A site is one
TEXT-DERIVED observation point** (ruled, B1 2026-09-06 + the fix-round-2
refinement) — klve's own push basis: a statement's before-touch and after-touch
are TWO observation points; an expression's report is ONE, whatever it emits —
usually a context event and its resolve, and for a template literal the whole
begin/evaluation/end family plus its resolve, all attached emissions of the
template's ONE observation point (klve's own one push per TemplateLiteral). The
widened floor matches klve's set by construction, because klve already wrapped
`this`, arrows, and templates as expressions. **Synthetic events are emissions,
never sites**: scope lifecycle, declare bursts, branch/iteration markers, jump
pop-reasons, and the anchors (beyond the family's one ratified basis
contribution) emit without counting — so the cap basis is config-independent AND
klve-equivalent at once. Sites carry no fixed ordering against the emission
ordinal. The collector keeps:

- the **site counter** — every executed text-derived observation point, captured
  or not (a gated-off point KEEPS its meta-control count touch — ruling 5's
  unconditional channel). It initializes at 1 — the anchor family's single
  ratified contribution — so cap N admits N observation points counting that one
  (klve-053's init-inclusive basis; klve-096's equivalence is SITES, not emitted
  records — emission gating never changes what a cap means).
- **`visitCounts`** — per-nodePath traced evaluations, bumped ONCE PER
  EVALUATION at the node's entry point (a statement's two observation points are
  one visit), BEFORE the runtime residual gates (range- and filter-independent,
  the adopted rule); transform-gated-off sites are not counted ("visits mean
  traced evaluations").
- the **emission ordinal** — `step`, incremented only on emit.
- the **per-loop-entry iteration counters** — `maxIterations`' basis, counted at
  the loop-test meta-control site (klve-079's ruled facet; the region's
  per-entry cap semantics without loop-guard splicing).

`maxSites` trips pre-record at the observation point that would exceed (message
names N+1, klve's form); `maxTime` trips when a point's `dt` exceeds it;
`maxIterations` trips when one loop entry's count exceeds it. Every trip is a
**marked throw** — a `RangeError` carrying a non-enumerable structural marker
with the trip record (`kind: 'sites' | 'time' | 'iterations'` + measured facts)
— thrown inside the program, catchable by learner code (the platform's truth),
classified only by `readCapTrip(thrown)` (total over `unknown`, never throws,
never a message match).

## The transform contract

Two instrumentation kinds, split at transform time (the ruled Aran frame):
**capture** (config-gated: wrappers, snapshot thunks, data legs — absent when
off) and **meta-control** (unconditional: the count channel, receiver caches,
the return wrap, the function-body try/finally, the top-level error wrap).

The ported transform is **less invasive than the klve reference** — the eleven
r8 defects were defects OF the klve reference's rewrites, and the repairs are
native-correct by leaving constructs native (rulings 1/4; behavior pinned,
mechanism free): loops instrument **in place** (test/update wrapped in
expression position — `continue` reaches the update, `let` captures per
iteration, r8 i/ii; a `for` missing its test OR update — not only `for(;;)` —
simply has fewer legs to wrap, where the klve reference died on both); `return`
wraps its argument in place (r8 v — no dead code executes); updates run native
ToNumeric (r8 iii — `"5"++` stores `6`); member calls cache the receiver once
and invoke through a helper that preserves `this` and throws the **native
not-a-function message built from the learner's own callee text** (r8 iv/xi — no
`.call`-off-undefined, no machinery in learner errors); arrows are wrapped,
never replaced (r8 x — async survives); module nodes are handled under explicit
`sourceType` (r8 ix, klve-075/089); describe's getter/bigint/null-proto repairs
cover r8 vi–viii.

**The decline roster** — sites left exactly as the learner wrote them,
uncaptured, because wrapping would change what runs (HR-19: the wrap preserves
meaning or declines; intercept's B-3 roster is the house precedent, transported
and widened by this unit's measured findings):

- `typeof`'s operand (wrapping turns an absent name's `"undefined"` into a
  ReferenceError — measured in the klve reference);
- `delete`'s operand (wrapping deletes a value, not a Reference — measured: the
  reference silently deleted nothing);
- direct-`eval` callees (a wrapped callee is an indirect eval — measured:
  function-scope eval broke);
- `super` call/property spines (unhostable in a rewrite — measured: ParseError
  in the klve reference);
- positions whose `await`/`yield` belongs to the enclosing function (the B-3
  rule);
- optional-chain interiors (the chain root may wrap; interior links never —
  short-circuit and receiver preserved, r8 iv);
- assignment LVals except computed keys (klve-045); **`with` is a REFUSAL, not a
  decline** (the machine twin has it right, and the ledger records the
  placement): a `with` scope is un-instrumentable in a static rewrite — every
  identifier inside it resolves through a runtime object no static kind map or
  snapshot probe can soundly model, so any wrap or scope event inside it would
  be a guess (the adopted surface reached the same refusal for its own reasons).
  A `with` program is a typed instrument failure — no output, no manifest — so
  it is absent from the declines manifest BY CONSTRUCTION, unlike every roster
  member above, which is declined-and-listed. A conformance row pins it.

**Strictness rides the learner's text, untouched.** The library neither injects
nor strips a `"use strict"` — the program's own directive prologue survives
instrumentation, and everything the transform bakes is legal in both modes, so
the instrumented text preserves the SOURCE text's own strictness semantics
(ruled, B4 2026-09-06). What a HOST then poses is the host's: the region's kind
poses runs strict, and under that pose sloppy-only constructs error differently
than the learner's bare run would — klve-057's named consequence, carried as a
host-posing delta in the machine twin's honesty lines, never silently.

Each roster member carries a native-semantics suite row, and every declined site
is listed in `instrument`'s `declines` manifest — stated incompleteness,
checkable by any consumer. Synthetic events (scope create/enter/leave bursts,
declare bursts from the variableKinds pre-walk — a light SECOND traversal before
the instrumenting pass, the transported pattern's own shape; klve-047's
visitation-marking protocol adapts to the two-pass form — branch markers,
iteration markers, jump pop-reasons emitted before the jump) are
transform-injected where statically known; the two runtime exceptions are named
above (function error-leave; the top-level error wrap). Intrinsics the collector
and codec rely on (`Promise`, descriptor readers, `Array.isArray`, the console
surface) **latch at `createCollector`**, before learner code runs — the engine's
own discipline, consumer-side. Real parse/codegen failures are typed instrument
failures carrying Babel's own position; everything past the transform is the
host's failure surface ((l)'s split).

## The differential property

The spine suite obligation, unchanged as the FLOOR: for the klve-capability
subset (the 24 toggles, names/timing/data semantics, caps, snapshots), the
port's final emitted data ≡ the klve reference's post-filter output for the same
program and corresponding options, **modulo the named deltas** (the r8 repairs,
klve-095's log re-attachment, klve-096's counting basis, the `maxTime` clock's
earlier zero — `t0` is set at `createCollector`, where the klve reference set it
at execution — the shape re-locks in § Correspondence, and the split-model
mapping — the suite's mapping layer derives klve's step shape, `time` included,
from the event stream). The oracle is a **committed JSON fixture** of the klve
reference's output over the differential corpus, generated once by a committed
probe against the klve package's built dist (the `klve-probes/` pattern); the
live-oracle script stays beside it for local re-verification, and fixture
regeneration is a deliberate, named act. Semantics-derived capabilities are
pinned by native-semantics rows (and, where meaningful, rows mirroring the
semantics tracer's own test titles).

## The epistemic line

Aran OBSERVES the engine's semantic operations; this library INFERS them
Babel-side, per the specification, from values it holds (ruling 6's line,
generalized): the coercion legs reconstruct abstract operations (ToNumeric,
ToPrimitive, ToString, the `==` ladder, truthiness) from operand values; the
chain walks (D2), when built, reconstruct resolution statically/reflectively.
HR-19's soundness obligation extends to every inference: a wrong model presents
as the machine's truth, so each inference rule cites its spec clause and carries
suite rows. A third category sits beside observed and inferred: the lifecycle
anchors are **asserted** — markers of phases every engine ran (source received,
tokens made, ast built, environment instantiated) that this library neither
observed nor reconstructed; they claim only that the phases happened, which is
the specification's own guarantee for any program that reached evaluation. What
neither inference nor assertion can reach honestly — operations inside
un-instrumented built-ins, getter/setter interception, engine internals — stays
the Aran deep tracer's, deliberately.

## The coercion legs

Operator, assignment, test, and template events carry optional inferred coercion
data (klve-097, `P1:coercion-legs` — the differential spine lands first). The
transported starting point is the semantics advice's
`computeBinaryCoercion`/`computeUnaryCoercion` and its operator→subkind tables —
**spec-widened by this unit**: the transported logic is JEJ-scoped (no `==`/`!=`
ladder; `Number()`/`String()` shortcuts with no bigint arm — `Number(5n)` is a
model of the wrong operation where native `+` on bigints is ToNumeric), so the
port's legs model the abstract operations symbolically (which operation, which
operand forms, what each produced) rather than calling host conversions on
values that would throw or drift. The ux twin's journey 6 is the learner-facing
ground.

## The sandbox cadence (launch ruling 9 — designed here, built in Phase 1)

Phase 1 opens with **increment 0 — the plumbing**: `sandbox.html` +
`vite.sandbox.config.ts` beside this module, hosted on the **engine,
light-case**, running UN-instrumented code end-to-end before any Babel work.
Every later increment is ONE feature end-to-end: instrument it → its config
toggles in the page → its emitted events inspectable → its 🔍 checkpoint (named
action, named expected observation) → its differential and native rows green.
Panel growth per feature: the toggles; the events table (step · semantics ·
category · kind · loc · dt); the value/scopes/logs inspector (described →
undescribed for snapshot legs); the INSTRUMENTED-SOURCE view. Draft order
(adjustable): plumbing → statements and expressionStatement → declarations,
binding lifecycle, and scope events (script/block) → identifiers/literals
(widened set) and operators by subkind → template events → calls / this / new /
define → loops (in-place wraps, counting, caps) with doWhile/forOf → functions
(param bindings, function scopes, return events) → conditionals/try/catch with
jump/debugger → describe depth cases and VR edge values → name/range/data
configuration and the split/co-gating matrix → error channel → coercion legs
(after the spine holds). The `@babel/standalone` dependency lands with Phase 1's
first importing code (the ledger's deferral bullet).

## What does not cross

- The four `@study-lenses/tracing` wrappers, their error classes, the
  `RecordFunction` Promise contract (klve-063 signed; klve-062 TRACER).
- The klve wrapper's ajv layering (klve-064 — the CONSTRAINTS live at this seam;
  the seam's own pipeline is the adopted semantics one).
- `langs` routing, the `'js:klve'` id (klve-065/066 signed; the cjs narrowing
  named: `require` is a learner-shaped ReferenceError wherever a host runs it).
- The `tracer` introspection object (klve-077 signed; survivals named).
- The main-thread `new Function` executor and its non-sandbox (klve-059/083 —
  hosts execute; sandboxing is constitutively the host's).
- The wrapper's dead knobs (klve-079 per facet — `iterations` returns ruled and
  real, above; `callstack` revivable only as a named ADDITION;
  `range`/`timestamps`/`debug.ast` wrapper meta — note the adopted surface's own
  `range` is a DIFFERENT, live capability, kept).
- The adapter error ladder's runtime half (klve-061 — the transform-side half is
  this library's typed failure; runtime classification is the tracer unit's
  settlement).
- The synchronous `trace()` entry (klve-058 — the pipeline's verbs replace it;
  the kind envelope is klve-073's, TRACER).
- The semantics tracer's engine/JEJ halves: the JEJ admission gate, the dialog
  round-trips, the settlement/refinement vocabulary, the chained-event delivery
  form and `eventsByNode` indexing, the frozen ast record — all host/tracer-unit
  territory (each binned in the ledger).

## The north-star adjudications (ruling 4)

**The criterion, stated**: a row misrepresents when the final emitted data
carries a **positive wrong value** or a **semantics-bearing omission** — an
absence a consumer would read as a claim about the program. Reporting grain
(what is evented at all) and honest incompleteness (what capture cannot know,
stated) do not misrepresent.

1. **klve-030** — the undefined-value hole: repaired (resolves carry
   described/represented `undefined`; "it evaluated to undefined" is a datum).
2. **klve-050** — thenable duck-typing: repaired (latched native brand).
3. **klve-093** — `Symbol()` re-minted as `Symbol('')`: repaired
   (description-carrying representation).
4. **klve-028** — the TDZ snapshot asserting `undefined`: repaired structurally
   (`{ unreadable: 'tdz' }`), with the var/let-const split the specification
   draws (the 2026-09-06 ruling).
5. **klve-085** — post-`await` invisibility: the remedy crosses the split — a
   TRACER-gated row records it (ruling 4's device); this library's collector
   holds no window.
6. The built-in `{}` mistraces (Error-without-message the measured case):
   repaired by the VR/describe widening arms.

The §§ A–F sweep behind these, re-run under the stated criterion, holds the
remainder: the before-only reporting grain, the whole-program-attributed
anchors, the promise husk, and the own-enumerable snapshot boundary are grain or
stated incompleteness, not misrepresentation; every remaining measured
misrepresentation is an r8 facet or a decline-roster member, repaired or
declined above.

## Glossary

The region glossary owns machinery/seam/event-as-region-word; iteration-guard
owns cap/trip/iteration-count for LOOP-GUARD splicing (this library's caps are
its own — sites, wall-clock, loop entries — same marker discipline, different
instrument); guarded-worker-base owns halt core/finisher. This module's terms:

- **trace event** — one typed, wire-safe record of an observable moment (the
  adopted vocabulary; the union in types.ts). **step** — the emission ordinal
  every event carries; also, informally, the moment itself. **site** — one
  OBSERVATION POINT the transform instrumented (klve's push basis: a statement's
  before and after are two, an expression's report is one); executing it touches
  the collector (a count at minimum), and emitting from it may yield more than
  one event.
- **the klve reference** — this module's term for the klve quarry
  (`sl-trace-js-klve/src/record/` + the js_visualized_v2 original), the
  differential floor's oracle lineage. Deliberately NOT the region glossary's
  bare "the reference" — the region's term names the `embody/lib/evaluating`
  quarry, the tree the ADOPTED surface also lives in — so this module never uses
  the bare term.
- **spec** — in this module, the ECMAScript specification (the inference
  authority). The region's `spec` (`EvaluationSpec`) is a different word at a
  different layer and does not appear here.
- **layer** — one band of the 5-layer model (`semantics` field). **the split** —
  expression events carry context, resolves carry the value; **co-gating** — a
  resolve fires only when its expression does (`dependent`, default true).
- **capture / meta-control** — config-gated observation vs unconditional
  mechanics (counting, caches, the return wrap, the error wrap).
- **capture plan** — resolved options translated into the transform's
  per-node/per-subkind decisions (`derive-capture-plan.ts`).
- **collector** — one run's accumulation state behind the injected namespace:
  events, counters, visit counts, parked logs, latched intrinsics. Per-run
  disposable; the declared mutable-state exception.
- **the namespace** — the single injected global (`__V__` default, settable,
  RETURNED by `instrument`).
- **report** — a baked call handing an observed value to the collector and
  transparently back to the expression. **record** (noun) — what the collector
  keeps per emitted event; (verb) to keep it.
- **ValueRepresentation (VR)** — the tagged, honest, wire-safe value form on
  every event value leg. **snapshot** — the optional deep `data.scopes` leg,
  described worker-side, undescribed thread-side.
- **stamp** — nodePath + loc + start/end offsets, baked from the library's own
  parse; constitutive on every event; the join surface. **the anchor family** —
  the four lifecycle-anchor events opening every trace (source · tokens · ast ·
  environment), attributed to `'$'`; entwinement rides the embodiment's own
  phase structures, not the anchors.
- **decline roster** — the sites never wrapped because wrapping would change
  what runs; each declined site is listed in `instrument`'s `declines` manifest.
  **latch** — this module borrows the ENGINE's term (`latched built-in`, engine
  README glossary) for capturing an intrinsic at `createCollector` before
  learner code runs, with the engine's own caveat inherited: latching fixes the
  BINDING, not the object — shared intrinsics (a mutated `Promise.prototype`)
  are beyond any capture's defense. Unrelated to the evaluator machine's
  settle-once "latch."
- **cap / trip / marked throw / trip record** — the three ceilings
  (sites/time/loop-entries), the moment one is exceeded, the
  structurally-markered RangeError, and its payload; `readCapTrip` classifies.
- **inference / observation** — § The epistemic line's pair; every
  coercion/chain-walk leg is inference per spec, labelled.
- **host** — whatever executes the instrumented text and owns posing,
  sandboxing, budgets, delivery: a test, the sandbox page, the tracer unit.
  **leg** — one optional data member of an event (value leg, coercion leg,
  snapshot leg, offset legs). **grain** — which moments are evented at all (a
  reporting choice, not a semantics claim). **oracle** — the committed
  reference-output fixture the differential rows diff against. **honesty line**
  — a stated limit of what the data can claim (the twins carry them).
- **resolved options** — the seam's output, the only options form downstream
  code sees. Distinct from raw options (consumer-held, possibly invalid) — the
  DEV.md Config/UserOptions hazard, dispatched.

## Correspondence

**klve ↔ this surface** (the differential floor's mapping; every shape delta
named — capability loss stays a defect):

| klve (reference)                            | step-instrumentation                                                                        | why                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `record(code, {meta, options})`, throws     | resolveOptions → instrument → createCollector → undescribeSteps                             | wrapper contract does not cross                                                     |
| 24 audit-grouped node toggles               | the 5-layer gates (each of the 24 has a spelling; table in the suite's mapping)             | the adopted surface; klve-011's default kept                                        |
| `filter.names` include/exclude (global)     | per-layer filter lists + exclude semantics; constraints at the seam                         | the reconciliation decision                                                         |
| `filter.timing.{before,after}`              | derived in the mapping layer from event kinds                                               | the split model; capability, not a gate                                             |
| `filter.data.*`                             | `data` legs per the gating table — EXCEPT `loc`: the stamp is constitutive                  | ruling 5; the 2026-09-06 loc/offsets ruling supersedes klve-016's loc-strip leg     |
| `meta.max.{steps,time}` wrapper layering    | `maxSites`/`maxTime`/`maxIterations` on createCollector                                     | klve-018/019 + 079's facet; the re-lock's spelling (steps → sites); klve-020 TRACER |
| one step per moment, value inline           | expression event + paired ResolveEvent                                                      | the ruled split                                                                     |
| step.type = Babel name                      | event category/kind vocabulary + stamped ESTree `type`                                      | the ECMAScript re-lock                                                              |
| described deep values everywhere            | VR on value legs; deep snapshots only on `data.scopes`                                      | the ruled value split                                                               |
| undefined-valued expression: no value key   | resolve carries represented `undefined`                                                     | north-star (klve-030)                                                               |
| symbol `{str}` parse                        | `description` carried                                                                       | north-star (klve-093)                                                               |
| thenable ⇒ promise                          | latched native brand                                                                        | north-star (klve-050)                                                               |
| TDZ snapshots as `undefined`                | `{ unreadable: 'tdz' }`; `var` honestly `undefined`                                         | north-star (klve-028); the 2026-09-06 ruling                                        |
| no offsets                                  | `start`/`end` beside `loc` + `nodePath`, all constitutive                                   | the entwineable ruling's library half; the 2026-09-06 loc/offsets ruling            |
| the init step, output step 1                | the anchor family (source · tokens · ast · environment), steps 1–4 at `'$'`                 | the B2 ruling; klve-023/081 re-homed                                                |
| logs lost on filtered steps                 | parked logs ride the next emitted event                                                     | klve-095, ruled delta (a)                                                           |
| cap counts `_steps.length`                  | site counter over observation points; initializes at 1 (the family's ratified contribution) | klve-096, ruled delta (b); the B1 ruling                                            |
| `trace(code, limits)` — caps beside options | caps on `createCollector`; `range` and the data legs inside the options                     | the re-homes, named                                                                 |
| post-filter renumber                        | emission ordinal, contiguous by construction                                                | r1 adopted                                                                          |
| `LimitExceededError` class                  | marked RangeError + readCapTrip                                                             | klve-055                                                                            |
| loop/return/update/call/arrow rewrites      | in-place wraps + invoke helper                                                              | r8 i–xi repaired                                                                    |
| empty code throws                           | legal Program: the anchor family + admitted scope lifecycle                                 | klve-078 RE-ADJUDICATED (supersede; the 2026-09-06 ruling its strength argument)    |
| module-level fake-constructor cache         | per-call                                                                                    | klve-091 under r3                                                                   |
| `(!)` scope suffix                          | never emitted (unreachable in the klve reference too)                                       | klve-029 restore-as-doc                                                             |

**semantics tracer ↔ this surface** (the adoption's named deltas):

| adopted surface (JEJ)                          | this library (full JS)                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| BindingKind `let\|const\|global`               | + `var` · `function` · `param` (spec lifecycles above)                                |
| ScopeKind `script\|block\|for\|for-of`         | + `function` (per call) · `catch`                                                     |
| no function-return event (rule kept for calls) | + FunctionReturnEvent for the return statement inside user functions                  |
| no this/new/define events                      | + this reads · construct discriminant · define events + gate                          |
| literals stop at regex                         | + array · object kinds                                                                |
| no expressionStatement/try/return spellings    | + gates (`statements.expressionStatement`/`.try`/`.return`) and the comma subkind arm |
| no anchor events; JEJ gate precedes tracing    | + the lifecycle-anchor family (`semantics: 'lifecycle'`); a new EventLayer arm        |
| `ValueRepresentation` without symbol/date arms | + `SymbolValue` · `DateValue` (Error/className arms implemented as typed)             |
| `range` on `TraceConfig`; caps on the wrapper  | `range` inside the options; caps on `createCollector`                                 |
| Aran nodePaths + frozen ast record             | same path grammar, minted over Babel; the record is the tracer unit's                 |
| dialogs traced-through; console native         | host territory; the collector's log parking serves the `data.logs` leg                |
| error channel: every error program-ending      | v1: uncaught only (full JS has try/catch); catch-entry events show caught flow        |
| observed via Aran advice                       | inferred per spec where marked (§ The epistemic line)                                 |
| increment desugared into sub-events            | native in-place update; internals unobserved (D5)                                     |

## Attribution

The instrumentation mechanics adapt **Kelley van Evert**'s klve tracer core
([jsviz.klve.nl](https://jsviz.klve.nl); the `@study-lenses/trace-js-klve`
package's `record/` engine and the js_visualized_v2 original) — his attribution
rides every file porting that lineage. The event/config contracts and the
transported builders adapt this repo's own semantics tracer
(`src/lib/embody/lib/evaluating/trace/semantics/`, read-only), whose event
vocabulary was litigated against the ECMAScript specification with the Aran
author. The klve package around the core is MIT © 2025 Evan Cole — distinct
credits, all kept (klve-072).

## Discharges

What this Phase-0 design encodes, by identifier (HR-21, three-part). Rulings and
rows resolve against
`.planning-handoffs/evaluators-api-restoration/KLVE-LEDGER.md` and
`LOSS-LEDGER.md`; forward-compat requirements against
`git show a8a0128d:.planning-handoffs/evaluators-api-restoration/research-digests-2026-08-05.json`
(key `.result.tracers`).

**Rulings encoded:** launch rulings 1 (the port vehicle — decomposition, typed
deviations, attribution), 2 (migration-first — no engine import, every envelope
concern binned TRACER), 3 (hosting here; the container bullet), 4 (the
north-star — § adjudications, criterion stated), 5 (instrument-time
configuration; counting/recording split; the gating table), 6 (coercion legs — §
The coercion legs + epistemic line), 8 (the signed drops — § What does not
cross; klve-082's seam constraints), 9 (§ The sandbox cadence, order extended),
10 (the container widening); r1/r2/r3/r4/r5-as-adopted; r8 RULED all eleven (§
transform contract) plus this unit's measured decline-roster extensions (ledger
§ I); the Path-B rulings (2026-09-06: semantics surface adopted; the split; VR;
the widening cut; the fix-all resolution incl. TDZ var/let-const, rename,
describe widening, fixture oracle, latching, empty-code re-adjudication); HR-16
(the richest-lineage config obligation — the adoption's ground); HR-18
(level-blind: the JEJ scoping widened, not inherited); HR-19 (the decline
roster's and every inference's premise); HR-21 (this section).

**Forward-compat requirements touched:** 10 (schema-validated config trees —
this seam IS one); 14 (worker-authored determinism — emission-minted ordinals).
The rest are the kind's/tracer unit's; none contradicted.

**Ledger rows discharged here** (close condition 1: named headings, type
members, or quoted suite titles). **The ledger commit distinguishes two kinds of
cell work**: RE-POINTS (a token moved to the migration-side or owning artifact —
klve-030's stale title, klve-053's halt-author token → klve-076, klve-056's
posture heading, klve-059's wording, klve-061's runtime edges, klve-074's stamps
cell, the heading-name alignments) never touch a ratified disposition, per 2b;
**RE-ADJUDICATIONS** (klve-028's TDZ mark, klve-078's legal-empty-Program,
klve-016's loc-strip leg, klve-013's unreachable-by-construction leniency)
change a disposition and land as supersedes, each with its 2026-09-06 ruling as
the strength argument close condition 4 demands.

- § A: klve-001…011 (every toggle capability spelled in the 5-layer gates; 010's
  map inside `derive-capture-plan.ts`; 011's default rule stated),
  012/014/080/082 (the reconciled per-layer filters + seam constraints; 012's
  nameless-pass rule stated), 013 (include-wins — recorded
  unreachable-by-construction: the one seam refuses the both-provided config the
  leniency tolerated), 015 (timing via the mapping layer), 016 (data legs per
  the gating table; the loc-strip leg superseded by the constitutive stamp,
  ruled), 017 (defaults), 018/019 (caps — `maxSites`' spelling the re-lock's),
  095 (log parking), 096 (counting basis — sites, not records; the B1 ruling),
  081 (the anchor family passes everything).
- § B: 021 (emission ordinal), 022 (categories re-locked into the layer model —
  the mapping layer carries the klve trio), 023 (the anchor family + its
  joins-rides-the-embodiment line in the machine twin), 024 (stamped `type` +
  vocabulary), 025/035 (the before-only grain → the mapping layer's derivation;
  grain adjudicated under the criterion), 026 (dt), 027 (the stamp; second-parse
  truth in the machine twin), 028 (snapshots + the TDZ re-adjudication), 029
  (restore-as-doc), 030 (north-star), 031/090 (logs), 032/033/034 (detail
  vocabulary survives inside event category/kind/fields; the action table rides
  the mapping layer).
- § C: 036 (hoisted function declarations = the `function` binding lifecycle),
  037–044 (the repaired transform postures; define events), 045 (LVal decline),
  046 (namespace protocol, settable+returned), 047 (the visitation-marking
  protocol, adapted to the two-pass shape), 094 (native error shape).
- § D: 048–052 (the snapshot codec + VR), 084/086/087 (repairs), 091 (per-call
  cache), 092 (boundary), 093 (north-star).
- § E: 053/054/055 (caps + marked throws + readCapTrip; halt-author tokens
  re-point to klve-076), 056 (log parking collector-side; the console fork stays
  the tracer's), 057 (strictness rides the learner's text; the host-posing delta
  named in the machine twin), 058 (the API replacing the sync entry), 059 (hosts
  execute; the collector contract is the migration half), 061 (transform-side
  typed failure; runtime edges re-point TRACER), 078 (re-adjudicated: legal
  Program), 083 (no sandbox claim; the honesty line), 085 (TRACER row per ruling
  4), 089 (module-node handling).
- § F: 060 (r1), 062 (TRACER), 063/065/066/077 (drops + named survivals),
  064/082 (constraints at the seam), 067 (pipeline order), 079 (`iterations`
  real on createCollector; other facets as signed).
- § G: 068/069 (posture + granularity — the opening sections), 070 (Why Babel →
  DOCS § Decisions), 071 (signed; ownership taken), 072 (§ Attribution).
- § H: 075 (explicit sourceType + conformance rows), 097 (§ The coercion legs;
  spine-first, `P1:coercion-legs`); 073/074/076 + 020 TRACER (074's migration
  cell re-points to the nodePath/loc/offset stamps — § nodePath and the stamp).
- § I (new rows, klve-098+, ratified at the gate): the decline-roster extensions
  (typeof/delete/direct-eval/super/for-variants, measured; `with`); TDZ
  structural marking; the VR adoption + built-in describe widening; the
  expression/resolve split; the lifecycle-anchor family; the semantics-surface
  adoption block (binding lifecycle incl. param, scope lifecycle, operator
  subkinds, literals-widened, templates, doWhile/forOf, jump/debugger, error
  channel, range, this/new/define/return, provenance-deferred,
  chain-walks-deferred, D6/D7/D8's named absences, the ast-record TRACER row);
  the empty-code re-adjudication record; the iterations/always-splice collision
  row (TRACER-gated, the B5 ruling).

**FLAGs raised: one** — the `maxIterations` cap's collision with the region
root's "guards always splice / the iteration guard enforces" sentences, recorded
as the TRACER-gated row above and decided by the tracer unit with both
instruments in view (the B5 ruling); the region-sentence amendment stays
ruling-gated, listed at the gate. **A governance note for the gate**: this
unit's data twin is the repo's SECOND data-twin instance — DEV.md's "revisit
when a second module owes one" trigger fires here, for the human to date there.

## Navigation

- Container: [`../README.md`](../README.md); region root:
  [`../../README.md`](../../README.md) and its
  [`notional-machine.md`](../../notional-machine.md) (the kind this library does
  NOT join; a future tracer evaluator hosts it there).
- The twins: [`notional-machine.md`](./notional-machine.md) ·
  [`data-model.md`](./data-model.md) ·
  [`ux/user-journeys.md`](./ux/user-journeys.md).
- Siblings: [`../iteration-guard/README.md`](../iteration-guard/README.md) ·
  [`../guarded-worker-base/README.md`](../guarded-worker-base/README.md).
- The lineages (all read-only): the klve package
  (`sl-trace-js-klve/src/record/`); the original app (`js_visualized_v2`); the
  semantics tracer (`src/lib/embody/lib/evaluating/trace/semantics/` — config,
  events, and the transported implementation layers).
- The campaign ledgers:
  `.planning-handoffs/evaluators-api-restoration/KLVE-LEDGER.md` ·
  `LOSS-LEDGER.md`.
- [`DOCS.md`](./DOCS.md) — the architectural sketch. [`types.ts`](./types.ts) —
  the contract.
