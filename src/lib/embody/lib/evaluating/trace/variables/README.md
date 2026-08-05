# evaluating/trace/variables

A standalone **variables tracer**: it runs a Just-Enough-JavaScript program in
the generic engine's sandbox and streams **variable lifecycle events** — scope
push/pop and the per-variable initialize / read / assign / increment moments —
with deterministic ordering, value snapshots, and node-path attribution for
source highlighting.

It is the first real consumer of the engine
([`../../../../../lib/engine/`](../../../../../lib/engine/)): it validates code
against the JEJ gate, instruments it with Acorn + string-splicing (no Aran),
calls the engine factory in-module, and exports the built generator. Code in,
handle out — consumers never assemble engine parts.

This is a **new tracer with its own concern** — the variable lifecycle — and it
cross-cuts the notional machine rather than splitting along the
syntax-vs-semantics line the existing tracers draw. Its one authority is the
notional machine; the other vocabularies are reference, not contract:

- [`../../../../language-levels/just-enough-javascript/notional-machine.md`](../../../../language-levels/just-enough-javascript/notional-machine.md)
  — **canon**: the authority for the binding lifecycle and scope model. Every
  tier event must be true to it.
- [`../semantics/tracing/types.ts`](../semantics/tracing/types.ts)
  `BindingEvent` and [`../syntax/types.ts`](../syntax/types.ts) `ScopeStep` /
  `InitializationStep` / `WriteStep` — **inspiration**: existing shapes this
  tier borrows names from, not vocabularies it must conform to.
- [`../../../../types.ts`](../../../../types.ts) `RuntimeScopeNMEvent` /
  `RuntimeBindingNMEvent` — **correspondence**: the embody NM-event types a
  future embody adapter would map this tier's events onto. This tier produces
  its own typed union; the adapter mapping is out of scope (see § Bounded
  context). Because this tier is organized around the variable lifecycle, its
  stream spans what embody splits across the `trace.variables` filter (binding
  values) and the `trace.syntax` filter (scope framing) — reconciling that split
  is the adapter's job, not this tier's.

## Vocabulary pinning

The tier event names are pinned here. This table is the naming contract; code,
types, JSDoc, and tests use these terms. The **NM authority** column is canon —
every row must hold against it. The **semantics vocab** column records the
existing name this tier borrows (inspiration, not contract). The **embody
correspondence** column names the embody NM-event type a future adapter would
map the event onto (reference, not a tier this tier conforms to — the value
lifecycle corresponds to the `binding` category, the scope framing to the
`scope` category). Where a tier name deviates from a source, the deviation is
deliberate and noted in the glossary.

| Tier event | Payload (beyond `step`, `nodePath`, `scopeInstanceId`)                                                                                                    | NM authority (canon)        | semantics vocab           | embody correspondence                                | JEJ syntax producer                                                                                                                              |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| scope push | `scopeKind` script/block/for/for-of; `variables[]` (`name`, `kind` let/const) — the declare burst, folded in (implicit TDZ)                               | scope push + declare burst  | `ScopeEvent` create       | `RuntimeScopeNMEvent` push + binding `declare` burst | Program (always); any block body with ≥1 let/const decl (if/else/while/do-while/for-body); classic `for` (synthesized); for-of (per iteration)   |
| scope pop  | `reason` (`ScopePopReason`; `limit` never produced); `variables[]` (`name`, `kind`, `status` tdz/initialized, `value?` iff initialized) from the registry | scope pop + reasons; `dead` | `ScopeEvent` leave        | `RuntimeScopeNMEvent` pop + `reason`                 | every exit path incl. break/continue/throw (reason authored from the abrupt flag)                                                                |
| initialize | `name`, `value`, `explicit` (true = `let x = 5`; false = `let x;`)                                                                                        | initialize                  | `initialize` + `explicit` | `RuntimeBindingNMEvent` `initialize`                 | declarators (`let x = 5` explicit; `let x;` implicit → `explicit:false`; one per declarator in `let a = 1, b = 2`); for-of binding per iteration |
| read       | `name`, `value`                                                                                                                                           | access                      | `read`                    | `RuntimeBindingNMEvent` access                       | standalone read of a declared let/const (not the implicit read inside `x += 1` / `x++` — that rides `priorValue`)                                |
| assign     | `name`, `operator`, `priorValue`, `nextValue?`, `wrote`                                                                                                   | update                      | `update` / `WriteStep`    | `RuntimeBindingNMEvent` `update`                     | `AssignmentExpression`, identifier targets only (const target → `TypeError` halt, no event)                                                      |
| increment  | `name`, `operator` `++`/`--`, `form` prefix/postfix, `priorValue`, `nextValue`, `returnedValue`                                                           | update                      | ResolveKind `increment`   | `RuntimeBindingNMEvent` `update`                     | `UpdateExpression` (`form`/`operator`/`returnedValue` are tier-private)                                                                          |

## Glossary (ubiquitous language)

These terms propagate into types, JSDoc, DOCS.md, tests, and this README. Use
them consistently.

- **tracer** — this module: a self-contained pipeline that turns a JEJ source
  string into a stream of variable lifecycle events plus a settlement.
- **lifecycle event** — one observed moment in a variable's life: a scope push
  (its binding declared into TDZ), an initialize, a read, an assign, an
  increment, or a scope pop (its binding cleaned out). The traced vocabulary,
  pinned above.
- **scope push / pop** — the entry and exit of a scope, modelled as the NM's
  `push`/`pop` of the lexical-environment chain. (Deviation: the mission's
  working prose says "creation/close"; this tier uses push/pop to match the NM
  authority and the embody runtime events, and to avoid the homonym with the NM
  **creation phase**.) The `scopeKind` values are `script` and `block` (borrowed
  from the existing tracers), `for-of` (a genuine per-iteration NM scope), and
  `for` (this tier's synthesized loop-head scope — see § synthesized for-scope).
  The package scope analysis names the top scope `program`; this tier renames it
  `script` to match the NM.
- **declaring scope** — a scope that declares at least one let/const binding.
  Only declaring blocks emit push/pop events (the NM elides the environment of a
  block with no lexical declarations). The **script scope** always emits its
  push/pop — it is the evaluate stream's bookend even when it declares nothing.
- **synthesized for-scope** — the scope this tier models around a classic
  `for (let i …)` loop, holding the loop-head bindings. The NM places these
  bindings in their own per-iteration environments; this tier models one
  for-scope per loop and does not model the per-iteration copies (see § Bounded
  context).
- **scope instance** — one runtime occurrence of a scope. A loop body re-enters
  the same static scope once per iteration; each occurrence is a distinct scope
  instance, identified by a runtime `scopeInstanceId`, while the static
  `nodePath` gives the scope's source identity.
- **initialize** — a binding receives its first value. `explicit` distinguishes
  `let x = 5` (true) from `let x;` (false, value `undefined`).
- **read** — a binding's current value is observed in a standalone read
  position. This is narrower than the NM's _access_: the implicit access inside
  `x += 1` / `x++` does not emit a `read`; it is captured as the `priorValue` on
  the `assign` / `increment` event instead.
- **assign** — a binding's value is replaced via an `AssignmentExpression` (`=`,
  a compound such as `+=` or `&=`, or a logical such as `??=`). `wrote` records
  whether a logical assign actually wrote (it is `false` when `??=` / `||=` /
  `&&=` short-circuits), derived from the operator and prior value, not from
  comparing values.
- **increment** — a binding is stepped by an `UpdateExpression` (`++` / `--`).
  `priorValue` is the uncoerced old value; `returnedValue` is the coerced value
  the expression yields (old for postfix, new for prefix); `nextValue` is the
  stored result.
- **value snapshot** — the value carried on an event. Structured-clone-safe
  values (string, number, boolean, null, undefined, bigint, Date, RegExp) ride
  as-is; values the worker boundary cannot clone (a function bound to a
  variable, a realm object) ride as a small tagged placeholder. Event `value` /
  `priorValue` / `nextValue` are captured live (thunk evaluation at the
  spec-correct moment); only scope-pop payload values are read from the
  registry.
- **registry** — the worker-side record of each live binding's current value,
  maintained from initialize / assign / increment events. Scope-pop payloads
  read final values from the registry; a binding is never re-read from the
  program (re-reading a TDZ binding would throw).
- **abrupt flag** — the worker-side marker of why control is leaving a scope.
  Set to `break` / `continue` just before the corresponding statement and to
  `error` when a throw unwinds; read by scope-pop to author its `reason`;
  cleared whenever normal evaluation resumes. Without it a `finally`-driven pop
  cannot tell normal exit from break, continue, or throw.
- **halt attribution** — the `nodePath` and error name stamped onto a thrown
  error worker-side, preserved across the engine's halt so the settlement names
  exactly where a TDZ read, const reassignment, or other throw occurred.
- **scope table** — the static, clone-safe projection (scopePath → kind +
  declared variables) computed once before instrumentation and delivered to the
  worker. Built from the package scope analysis but re-homed for this tier (see
  § Bounded context); plain data, no `Map`s.
- **worker logic** — the worker-side half: the injected `__$vr` helper
  namespace, the inert dialog stubs, the registry / counters / abrupt flag, and
  the halt author.
- **thread logic** — the thread-side half: a stateless mapping of opaque worker
  messages to typed lifecycle events (and a drop for anything malformed).
- **dialog stub** — the inert `prompt` → `null`, `confirm` → `false`, `alert` →
  `undefined` injected into the worker so a valid JEJ program that calls a
  dialog does not crash on the worker's missing native dialogs. Dialog calls are
  not lifecycle events in this tier.
- **handle / settlement** — the engine vocabulary this tier wraps: the handle is
  the lazy `AsyncIterable` + `result` + `cancel` + `fail`; the settlement is how
  the run ended (completed / errored / cancelled / failed / timed-out) plus its
  carried halt and duration. This tier narrows the stream to typed lifecycle
  events and types the halt; the engine itself stays opaque.

## Bounded context

This tier **owns**: the JEJ admission gate at its boundary (it throws on non-JEJ
or unparseable input — the _not-runnable_ shape is the embody adapter's concern,
not this tier's); the scope-table projection; the instrumentation transform; the
worker logic and its thin worker entry; the thread logic; the built generator
and its typed facade.

It does **not** own, and explicitly excludes:

- **Console and dialog events.** The embody `trace.variables` tier contract
  pairs the variable lifecycle with intercept's console/dialog events; that half
  is embodiment-wiring territory. This tracer covers the variable lifecycle only
  and injects inert dialog stubs so dialog calls do not crash.
- **The embody adapter mapping.** Translating these events into `AnyNMEvent` /
  `RunInstance` / `EndReport`, and the _not-runnable_ short-circuit, belong to
  the embody adapter.
- **The quiz lens.** The stream is kept quiz-friendly (deterministic order,
  value snapshots, node-path attribution); the lens that consumes it is out of
  scope.
- **Realm and global bindings.** Reads and mutations of realm names (`Math`,
  `prompt`, `Number`) are not traced; the NM's `global` binding kind is outside
  this tier. Only declared let/const lifecycles are traced.
- **Per-iteration environment copies for classic `for`.** The NM models a fresh
  environment per iteration of `for (let i …)`; this tier models one synthesized
  for-scope per loop. In closure-free JEJ the copies are value-equivalent. A
  classic `for (let i …)` _body_ block that declares bindings still shows its
  own per-iteration push/pop; a `for-of` body block is merged into the
  per-iteration for-of scope (build-scope's merge — see § synthesized
  for-scope), so it does not push/pop separately.
- **The `'limit'` pop reason and timeout/cancel pops.** This tier owns no
  instrumentation limit, so scopes never pop with reason `limit`; a timeout or
  cancel kills the worker, so the scopes open at that moment do not pop at all.
- **Labels, `with`, `eval` tampering, expression-target for-of, undeclared
  identifiers.** A label-bearing or expression-target-for-of program passes JEJ
  validation but is rejected at instrumentation with a typed boundary error;
  `with` runs as a runtime SyntaxError under the strict instrumented output; the
  `eval` easter egg can observe or tamper with the `__$vr` helper; undeclared
  identifiers reach the worker unwrapped, so their `ReferenceError` arrives
  without node-path attribution. Each is a named boundary, not a silent
  mistrace.
- **The `trace/` module-level documentation.** A separate effort owns the
  `trace/` README/DOCS; this directory documents only the variables tier.

Comma/sequence and parenthesized expressions (JEJ easter eggs) are traced
transparently: the assigns and reads inside them produce their normal events;
the grouping itself is not an event.

## Structure

| File                        | Purpose                                                                                                                                                        |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`                  | The event union, handle, options, result; the worker→thread message envelope, the scope-table shape, the `__$vr` helper protocol, and the abrupt-flag protocol |
| `trace-variables.ts`        | Public entry: `traceVariables(code, { seconds? }?)` — validate, project, instrument, build the engine generator, return the typed handle                       |
| `project-scope-table.ts`    | Pure: validated AST + package scope analysis → the tier's clone-safe scope table                                                                               |
| `instrument-variables.ts`   | Pure: validated AST + source + scope table → instrumented source string                                                                                        |
| `variables-worker-setup.ts` | Worker logic: injects `__$vr` + dialog stubs, maintains the registry/counters/abrupt flag, authors halts                                                       |
| `variables-worker-entry.ts` | Thin worker entry wiring the engine bootstrap to the worker logic                                                                                              |
| `variables-thread-logic.ts` | Thread logic: stateless mapping of worker messages to typed lifecycle events                                                                                   |

## Navigation

- Enclosing module front door: [`../../README.md`](../../README.md) (the
  `evaluating/` module; the intermediate `trace/` documentation is a separate
  effort's to write)
- The engine it consumes:
  [`../../../../../lib/engine/README.md`](../../../../../lib/engine/README.md)
- Vocabulary authority:
  [`../../../../language-levels/just-enough-javascript/notional-machine.md`](../../../../language-levels/just-enough-javascript/notional-machine.md)
- Architecture and data flow: [`./DOCS.md`](./DOCS.md)
- The contract: [`./types.ts`](./types.ts)
