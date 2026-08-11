# run

The **baseline evaluator** — the smallest member of the evaluator kind. run
executes the studied program in the engine's sandboxed worker and reports only
**how the run ended**: its stream yields no events, and its whole output is the
settlement — clean, error (in the machine's own words, carrying run's richer
`reason`), or canceled. Where intercept answers "what did the program say?" and
the tracers answer "what did the machine do?", run answers the first question a
learner asks: **does this program end, and how?**

## Where this sits

An engine-backed evaluator under [`evaluators/`](../README.md), exporting a
single `Evaluator` object — name, applicability, main — over the kind's
evaluation spec. The kind's [README](../README.md) owns the caller protocol
(applicability first, then main; laziness and cancellation belong to the
consumer); this document owns what run adds to it.

run drives the package's shared [engine](../../lib/engine/README.md) — the
generic sandboxed streaming evaluator — as leaf machinery, and consumes the
region's shared [iteration-guard](../lib/iteration-guard/README.md) for the
runaway-loop discipline. It is the simplest proof of that whole seam: one
evaluator, no events, every kind obligation still honored.

## Ubiquitous language

Defers to the committed glossaries it builds on: the kind's (evaluation spec,
settlement, refusal, execution axis, gate-guaranteed —
[`../README.md`](../README.md)), iteration-guard's (cap, per-entry counter,
iteration count, trip, marker, classification —
[`../lib/iteration-guard/README.md`](../lib/iteration-guard/README.md)), and the
engine's (spec, worker factory, worker entry, worker logic, thread logic, halt,
serializeHalt, termination cause, settlement —
[`../../lib/engine/README.md`](../../lib/engine/README.md)). This module owns:

- **run evaluator** (this module) vs. **a run** (one execution of the studied
  program, from first pull to settlement) vs. **the run lens** (the
  evaluation-phase lens, which consumes EVERY evaluator — run, intercept, danger
  — and is not run's own). In this directory, "run" unqualified names the
  evaluator; executions are always "a run" / "the run".
- **eventless stream** — the kind's evaluation event stream specialized to zero
  events: an async iterable that never yields, existing to carry the kind's
  three obligations — laziness (the first pull starts the run), cancellation
  (ceasing to pull tears the run down), and the companion settlement promise.
  Pulling it is how a consumer starts a run it intends only to await.
- **assemble** — the pure translation of the evaluation spec into the engine's
  spec: the gate-guaranteed source with iteration guards spliced in, the cap
  passed through into the worker config, the execution axis riding through
  unchanged, run's own worker factory and thread logic attached. Assemble rides
  the start path — nothing is read, spliced, or built before the first pull. The
  worker factory is authored as the engine's one syntactically adjacent
  module-worker expression, never behind a helper (the engine's doc-enforced
  bundler constraint), and loads run's thin worker entry.
- **guarded source** — the learner's source after the iteration-guard splice
  (iteration-guard's word for loop-guard's _spliced source_; one artifact, both
  committed names). Every run is guarded — uncapped runs count without ever
  tripping — so every worker-side halt carries a real iteration count.
- **halt payload** — run's worker-authored, clone-safe stop record: whether the
  program ended naturally or threw, the thrown error in the machine's own words,
  the guard's trip record when the guard tripped, and the run-total iteration
  count. Authored inside the engine's halt-serializer seam, same realm as the
  throw; it crosses the wire as untyped data and is narrowed exactly once at the
  thread-side read site — a payload that fails the narrowing routes to the
  defect arm.
- **map-settlement** — the pure translation of the engine's settlement onto the
  kind's three arms (the same bridge danger ships; run's arms are its own). It
  is total by a precedence rule over the CARRIED DATA, never a switch on the
  outcome label alone: a well-formed worker-authored halt RECORDING A THROW wins
  — `'threw'`, or `'loop-cap'` by classification; natural-end halts fall through
  — else an engine-made error answers — `'timeout'` when that is its cause,
  `'defect'` otherwise — else a consumer-ended run is canceled and a completed
  one clean; every remaining combination (an outcome run's surface cannot
  produce, a completed settlement missing its halt, a malformed halt) is the
  defensive `'defect'` arm, loudly flagged as a dev condition.
- **richer error** — run's error above the kind's `{ name, message }` floor,
  discriminated by `reason`, each arm carrying exactly the fields that exist for
  it: `'threw'` the run-total iteration count; `'loop-cap'` the count and the
  guard's whole trip record (its loop index and decoded span — iteration-guard's
  shape, re-exported never re-declared); `'timeout'` the floor alone; `'defect'`
  run's defect cause. `name` and `message` come from the worker-authored halt on
  halt-backed arms and from the engine's own error on engine-made arms — both
  the machine's words, different machines. Consumers needing the richer shape
  import run directly (the kind's structural-extension rule).
- **reason** — why the run ended in error: `'threw'` (the program's own throw),
  `'loop-cap'` (the iteration guard's marked trip), `'timeout'` (the engine's
  wall-clock budget), `'defect'` (machinery failure, or an impossible
  combination reaching the mapper). Aligned with danger's local union plus the
  fourth value; deliberately run-local — promotion onto the kind is a recorded
  close-out question, not this module's call. Distinct from the kind's refusal
  `reason` — that one is a free-form string in the evaluator's own words; this
  one is a closed discriminant.
- **defect cause** — the `'defect'` arm's discriminant: the engine's machinery
  causes mirrored structurally — crash or environment failure, an unserviceable
  round-trip, a throwing hook — plus run's own value for an unreachable
  combination the mapper refuses to guess about. The engine's timeout cause is
  deliberately NOT mirrored here: it would restate `reason: 'timeout'`, and a
  second copy of the same fact is what this contract exists to avoid.
- **refusal** — main's structured no: the environment cannot host a run — no
  `Worker` (server-side), or no `SharedArrayBuffer` (the page is not
  cross-origin isolated; the engine's pause protocol lives on shared memory) —
  with the reason naming the missing capability. Applicability stays `true` —
  the refusal is an environment answer, never a spec answer.
- **engine seam** — the test-only seam on run's internal stream factory: the
  engine's public factory function arrives as a defaulted parameter — production
  never passes it; run's Node tests substitute one that routes the assembled
  spec through the engine's fake transport. The seam binds the engine's PUBLIC
  surface, never its transport internals, and it never wraps run's worker
  factory (wrapping is exactly the adjacency-breaking helper the engine
  forbids). The kind's `main(spec)` stays the whole public surface.

## Owns vs. excludes

### Owns

- **Assemble**: reading the spec's gate-guaranteed source — narrowed once at the
  read site, its unreachable failure arm a loud dev-mode defect settling on the
  `'defect'` arm, never a second refusal and never an unsafe assertion —
  splicing guards on the ORIGINAL source, and passing `iterations` through
  UNCHANGED: `undefined` is uncapped; no clamping, no defaulting, no finiteness
  gate. A nonsense cap is the consuming lens's bug, and its consequences are
  iteration-guard's documented edges (`0` trips on the first pass;
  `Infinity`/`NaN` never trip). There is NO default cap: absent `iterations`
  means count-only, and the engine's wall-clock budget is the only backstop.
- **Its worker setup**: the iteration-guard helpers are the ONLY injected
  globals. Its **halt authoring**: classification via the guard's verbs, the run
  total on every halt, non-Error throws in the machine's words.
- **Map-settlement and the richer error** — including the defensive arm for
  combinations that cannot occur.
- **The eventless stream** and its teardown discipline; **the refusal** when the
  environment cannot host a run.

### Excludes

- **Dialogs.** run injects none — `prompt()`, `alert()`, `confirm()` under run
  are honest `ReferenceError`s (Workers have no native dialogs; the machinery
  adds nothing the platform doesn't have). Dialog interaction is intercept's;
  real windows are danger's.
- **Events of any kind** — console capture, I/O records, traces: intercept's and
  the tracers'.
- **Guard call text, helper semantics, trip classification** —
  iteration-guard's, consumed whole. **Loop placement** — loop-guard's,
  entirely, behind iteration-guard.
- **Cap semantics beyond the pass-through** — what a cap means is
  iteration-guard's; that no default exists anywhere is a ratified ruling this
  module obeys, not owns.
- **Engine mechanics** — worker lifecycle, pause protocol, time budget,
  draining: the engine's.
- **Rendering** — Cancel buttons, settlement display, per-audience wording: the
  run lens's.

## Edge cases

- **`prompt('…')` (or any dialog) → error settlement, `reason: 'threw'`,** the
  `ReferenceError` in the machine's own words — the program referenced a name
  its environment does not have. Nothing hangs; nothing is mocked.
- **`console.log` runs natively.** The worker's own console prints to dev tools;
  run neither traps nor forwards it.
- **An environment that cannot host a run** — no `Worker` (server-side
  rendering, plain Node) or no `SharedArrayBuffer` (COOP/COEP not served) → main
  returns the structured refusal naming the missing capability; nothing spawns,
  nothing throws. The residual — shared memory present but failing at spawn —
  still surfaces as `'defect'`.
- **Work scheduled past the natural end never runs.** The engine ends the run
  when the program ends — on both axes — so a program whose only output rides a
  timer settles **clean having produced nothing**. For the evaluator whose
  question is "does this program end?", that IS the honest answer.
- **A module run whose top-level evaluation rejects** → `reason: 'threw'`,
  exactly like any throw (the engine's module-path rule).
- **Uncapped runaway loop** → the guard counts, the engine's wall-clock budget
  ends the run → `reason: 'timeout'`.
- **Capped runaway loop** → the guard's marked trip → `reason: 'loop-cap'` with
  the guard's trip record and the run-total iteration count.
- **Non-Error throw** (`throw 'oops'`) → classified worker-side into honest
  `{ name, message }`; still `reason: 'threw'`.
- **Machinery failure** (worker crash, shared memory unavailable, a throwing
  hook) → `reason: 'defect'` carrying run's defect cause — a dev condition
  surfaced loudly, never disguised as a learner error.
- **Ceasing to pull / breaking out** → canceled at teardown; a pull after
  teardown never starts a fresh run.
- **Awaiting `settled` without pulling** starts nothing — laziness rides the
  pull, and a consumer that only awaits must pull once (the eventless iterator's
  single pending pull spans the whole run).

## Design commitments

- **Applicability is pure over the spec — `() => true`.** run is level-agnostic
  and serves both execution axes; the options list a lens builds is never
  environment-dependent. The environment question — `Worker` AND
  `SharedArrayBuffer`, the engine's two synchronously probeable prerequisites —
  is answered at main, as one refusal naming the missing capability (danger's
  precedent, widened to the engine's needs).
- **Nothing engine-side exists before the first pull.** The engine starts on the
  first pull OR on result access — so run touches neither the engine factory nor
  its result surface until its own start latch opens. Assemble, the engine
  handle, the settlement wiring: all of it is constructed inside the start path.
  Awaiting run's settlement alone starts nothing.
- **Guard-first, on the original source.** The splice runs before any other
  rewrite (run has none), so the trip's span is faithful to the learner's own
  columns. A splice failure is gate-guaranteed-unreachable and routes to the
  `'defect'` arm like every upstream dev condition.
- **Classification is structural, worker-side.** The halt author reads the
  guard's marker through its classification verb — never a name, never a
  message. The engine's thread-side refinement hook goes unused: there is
  nothing left to refine once the halt is authored where the raw throw lives.
- **The halt payload is narrowed exactly once.** It crosses the wire as untyped
  data; the thread side narrows it at one read site, and a malformed or missing
  payload is the defensive `'defect'` arm — never a guess.
- **The richer error carries no boolean trip flag.** `reason: 'loop-cap'` IS the
  classification; a separate trip boolean would be a second copy of the same
  fact. The classification bit lives in the halt payload, where the wire
  crossing happens. The same rule shapes the defect cause: the engine's timeout
  cause is not mirrored, because `reason` already says it.
- **The stream is hand-rolled, not a generator.** run's whole life is one
  pending pull; a generator's teardown would queue behind that in-flight pull
  and deadlock the cancel. The iterator answers teardown out of band and
  latches, so late pulls are inert (danger's precedent; the engine's handle is
  the pattern's origin).
- **The engine's shapes are spoken at the implementation edge.** run's
  kind-facing contract stays self-contained — the one engine vocabulary it must
  expose (the defect cause) is mirrored structurally and locked by a
  compile-time probe in the inbound direction: every engine machinery cause must
  land in run's union, so a new engine cause fails the build loudly.
- **The execution axis rides through unchanged.** The spec's
  `'function' | 'module'` maps one-to-one onto the engine's axis. Neither
  strict-mode posture nor a time budget is carried: strict is the kind's
  deliberate collapse (the engine's strict default governs), and seconds stay
  the engine's own default — the learner-visible backstop that ends uncapped
  runaways is the engine's, by the kind's ruling.
- **Shared-in-waiting, recorded.** Nearly everything run owns — assemble, the
  worker-setup-plus-halt-author pattern, the map-settlement precedence rule, the
  reason union — is shape intercept will need identically, and the region rule
  keeps evaluators self-contained, so intercept cannot import it from run.
  Promotion into `evaluators/lib/` is designed against BOTH concrete evaluators
  when the second lands (danger's recorded discipline for `reason`); building
  run standalone first is deliberate, and this note exists so the later move is
  a decision, not archaeology.
- **The clean arm stays the kind's floor.** A clean settlement carries no
  iteration count: the kind's structural-extension rule names the ERROR arm (and
  events), and run does not invent a clean-arm extension mid-sprint. The run
  total run computes on every clean halt is therefore not surfaced — recorded
  here deliberately (iteration-guard's always-instrument commitment priced that
  count into every run) so the omission is not "fixed" casually: surfacing it
  later is a backward-compatible product decision, not a bug.

## Testing posture

The refusal's **worker** arm is proven through main in Node (no global `Worker`
there — exactly the refused environment); its **shared-memory** arm is not
reachable from either tier by construction, because the probe names the missing
worker first and every surface under test — the browser project, the engine's
sandbox config — serves the isolation headers, so nothing under test is ever
non-isolated. That arm is live all the same, on any host that does not serve
COOP/COEP; the sandbox page carries the same probe of its own and disables its
run control, so a hand-driven page explains itself without calling main.
Everything else main wires is proven in two honest tiers, the engine's own
split: the **Node tier** drives run's internal stream factory through the engine
seam over the engine's fake transport — map-settlement truth-tabled over
synthetic engine settlements (every arm, the engine-made-error rows, the
defensive rows), the worker setup and halt author driven directly against a stub
of the engine's worker api, laziness (nothing started before the first pull),
cancel-interrupts-the-pending-pull, and the teardown latch (a pull after
teardown must not start a fresh run). The **browser tier** is the end-to-end
evidence through main over the real transport: clean, throw, limit trip, cancel,
the dialog `ReferenceError`, and a module-axis row (the fake runs the function
path regardless of the axis — only the real transport evidences the axis riding
through). The timeout and defect arms are deliberately Node-tier rows: a live
browser timeout costs real wall-clock seconds and proves nothing the truth table
doesn't. The sandbox page is permanent dev infrastructure for exercising the
same paths by hand.

## Navigation

- Region: [`../README.md`](../README.md) — the evaluator kind this implements.
- [`../lib/iteration-guard/README.md`](../lib/iteration-guard/README.md) — the
  shared iteration-guard semantics run consumes.
- [`../../lib/engine/README.md`](../../lib/engine/README.md) — the engine run
  drives.
- Siblings: [`../danger/`](../danger/README.md) — the real-window evaluator
  (shares run's refusal-as-data and eventless-stream shape); `intercept/` — run
  plus the program's own I/O as events (the region README's tree).
- [`./DOCS.md`](./DOCS.md) — the architectural sketch and `## Data flow`.
- [`./types.ts`](./types.ts) — run's contract in TypeScript.
