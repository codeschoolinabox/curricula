# engine/worker

Transport internals: the shared-memory wire protocol the engine's two sides
speak, and the worker-side bootstrap that runs a program inside the sandbox.
Consumers touch the public contract in [../types.ts](../types.ts); these files
are how the thread and the sandboxed worker coordinate underneath it. One
exception is real rather than theoretical — `protocol.ts` is imported outside
the engine (`evaluators/run/resolve-io.ts`), so the wire vocabulary is shared,
not private.

## Structure

| Path                     | Purpose                                                               |
| ------------------------ | --------------------------------------------------------------------- |
| `protocol.ts`            | The wire protocol as data: buffer layout, slot indices, signal values |
| `types.ts`               | Engine-internal message types: buffer views, postMessage envelopes    |
| `create-buffer-views.ts` | Typed views (control header + payload area) over the shared buffer    |
| `transport.ts`           | Thread-side: spawns the sandbox, runs the handshake, feeds the pump   |
| `write-call-response.ts` | Thread-side: encode one bounded call response and signal the worker   |
| `read-call-response.ts`  | Worker-side: decode the response, reset the channel for the next call |
| `bootstrap.ts`           | Worker-side: handshake, consumer setup, globals injection, halt posts |
| `write-resume-signal.ts` | Thread-side: release the worker's pause                               |
| `clear-event-ready.ts`   | Thread-side: clear the event-ready flag after disposing an emission   |

## Realms

Each file here runs in one realm, in both, or in neither. A **realm** is one
side of the worker boundary, identified by its global object — and the two sides
do not share one. The import graph fixes each file's realm, not the `Purpose`
column and not inspection: a file imported only by `bootstrap.ts` is
worker-side, a file imported only by `transport.ts` is thread-side,
`create-buffer-views.ts` and `protocol.ts` are imported by both, and `types.ts`
is erased at compile time and runs nowhere.

The distinction is load-bearing. **A program runs in the worker realm and shares
its global object with the engine's own worker-side code.** The same expression
is therefore safe on the thread side and exposed on the worker side.

### The rule

**Every ambient global the engine resolves in the worker realm is latched** —
captured at module load, before any program can run, and read from that capture
afterwards. The thread realm is unreachable from the program and is left live.
**A file that runs in both realms is latched**, because one of its callers is
worker-side.

The rule is deliberately mechanical rather than a per-site reachability
argument. A reachability rule would be smaller today and correct today, but it
has to be re-derived every time `bootstrap.ts` changes, and the failure it
protects against is silent: an unlatched read does not crash, it makes the
engine **lose its ability to post a halt**, so the run burns its time budget and
the program's author is told their instantly-finishing program was too slow. A
rule that cannot be got wrong by omission is worth the extra bindings.

`read-call-response.ts`'s `DECODER` and `write-call-response.ts`'s `ENCODER` are
the shape to follow: a module-load binding with its reason stated in place.

### What each module captures

Realm is fixed by the import graph, so this table is derived, not declared. The
thread realm is unreachable from a program and every thread-side module is left
live — an exemption of reach, not of rigour.

| module                   | realm  | captures                                                                                                                                                                                                            |
| ------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap.ts`           | worker | `postMessage`; `globalThis`; `importScripts`; `Atomics.store` `.load` `.wait` `.notify`; `URL.createObjectURL` `.revokeObjectURL`; `Object.freeze` `.keys` `.defineProperty`; `Blob`; `Function`; `Error`; `String` |
| `read-call-response.ts`  | worker | `Atomics.store` `.load` (its decoder singleton is already at module scope)                                                                                                                                          |
| `create-buffer-views.ts` | both   | `Int32Array`; `Uint8Array`; `Object.freeze`                                                                                                                                                                         |
| `protocol.ts`            | both   | none — its only ambient read already sits at module scope                                                                                                                                                           |
| every thread-side module | thread | left live                                                                                                                                                                                                           |
| `types.ts`               | none   | erased at compile time; runs nowhere                                                                                                                                                                                |

The entries are callables, not the namespaces they hang off, because that is
what the rule requires. `globalThis` is the one object capture: the listener
registration on it needs its receiver, and a bare callable pulled off it would
lose one.

### What the rule does not reach

- **The object, only the binding.** Latching survives a rebound global
  (`postMessage = null`); it does not survive a mutated intrinsic. Capture the
  **callable** rather than its namespace — a namespace capture is defeated by
  `Atomics.store = …`, a callable capture is not. The three `instanceof Error`
  sites remain open to a redefined `Error[Symbol.hasInstance]`; that residual is
  named, not covered.
- **Consumer worker logic.** `setup`, `serializeHalt` and the globals the
  consumer injects all run worker-side, and `serializeHalt` runs on every stop —
  after the program. The engine latches its own resolutions; consumer worker
  logic is in the same realm and latches its own.
- **An adversarial program.** The threat model is **accidental shadowing**, not
  an attacker. A program already owns its realm: it can re-enter the message
  handler, and it can confuse its own run in ways no capture prevents. What the
  rule guarantees is that ordinary shadowing never turns into a wrong answer
  about the program.
- **The linter that was watching the call.** Two rules here match a callee by
  **name** or by **AST shape** rather than by the value it resolves to, so
  latching walks the site out from under them:
  `@typescript-eslint/no-implied-eval` requires the callee to be literally named
  `Function` before it resolves any type, and `functional/immutable-data`
  returns early unless the callee is a member expression. `bootstrap.ts`'s two
  `new Function` sites therefore keep one static guard (`sonarjs/code-eval`,
  which follows the alias) where they had two, and its `defineProperty` site
  keeps none; each stale directive's reason survives as a plain comment at its
  site. This is a property of the tooling, not of the rule — but it is a
  standing cost of latching anything the linters watch by name, and it is why a
  capture is never landed without re-reading what stopped firing.
  (`create-buffer-views.ts`'s `Object.freeze` was checked against the same
  hazard and disarms nothing: `freeze` is not in `functional/immutable-data`'s
  mutator set, and no rule here targets `Atomics`.)
- **A door the placement check cannot see through.** `globalThis` is captured as
  an **object** rather than a callable, because the listener registration needs
  its receiver. That makes it the one capture a future function body can pivot
  through — `GLOBAL_SCOPE.Reflect`, `GLOBAL_SCOPE.fetch` — to reach a brand-new,
  never-latched global, live, at call time. Both instruments report such a file
  compliant: the scope walk sees a locally-resolved const and a property name,
  never a global identifier reference, and the granularity check reads
  initializers only. So
  [DOCS.md § What counts as compliant](./DOCS.md#what-counts-as-compliant)'s
  "mechanized, and exhaustive" is exhaustive over ambient **identifier
  references**, not over reachable globals. Named, not covered, like the
  `Error[Symbol.hasInstance]` residual above.
- **What each tier can and cannot separate, per SITE.** The two instruments do
  not cover the same reads, and the split is by call site rather than by name —
  a name is not uniformly covered just because one of its sites is. Every
  capture below fails the placement predicate when un-latched, so the structural
  tier reaches all of them; what varies is whether a behavioral row does too.
  - **Discriminated behaviorally:** `Atomics.notify` and `emitPausing`'s two
    `.store` reads — all three run before the emission is posted, so un-latching
    any one of them costs the program its message. Also `callBlocking`'s `.load`
    and `read-call-response`'s `.load`: un-latching either alone costs the
    program the response to its own call.
  - `.notify` is discriminated **only by the row that rebinds the whole
    namespace**, never by one that replaces the member alone: a missed wake is
    unobservable, but a failed read is not. The two are different failures and
    only the second is visible here.
  - **Not discriminated behaviorally:** `callBlocking`'s `.store`,
    `read-call-response`'s `.store`, `Atomics.wait`, and the pause loop's own
    `.load`. For these four the placement predicate **is** the instrument. Note
    that `.load` and `.store` each appear on both lists — which is the point of
    reading this map by site rather than by name.
  - `.wait` is undiscriminable for a different reason than the rest, and the
    reason is worth keeping: not unreachability but **equivalence** — a
    busy-spin substitute holds the single-threaded worker exactly as
    unresponsive as a genuine block, so no observation from the thread can tell
    them apart.

## Discharges

What this design encodes, by identifier (HR-21). Rulings resolve against the
campaign's LOSS-LEDGER
(`.planning-handoffs/evaluators-api-restoration/LOSS-LEDGER.md`).

**Rulings encoded:** HR-23's full-subtree audit clause — the audit covered every
`worker/*.ts` file and classified each site by realm; **the rule above is what
it produced**, and the latch declarations with their in-place reasons are its
per-site record. The rule closes the class rather than the reachable instances
(human ruling 2026-08-27, resolving the reviewer's narrowing challenge). Also
encoded: the 2026-08-27 human rulings that set this unit's full Phase 0 and
answered its twin ask `machine`; HR-13 as the ceremony level this unit runs at.
HR-20 is untouched and stays untouched by the latch: **no execution path was
ratified here**, and `evaluators/types.ts`'s closed `ExecutionAxis` union and
its tsc tripwire are not reached by this unit. (A third path, `'script'`, was
ratified afterwards by its own design review — see
[../README.md § Public API](../README.md). It changes what this directory
captures, below, not what the latch rule says.)

**NOT discharged here, named for honesty:** no LOSS-LEDGER classification rows —
the engine carries none in that table, and "no rows" is the discharge rather
than silence. The `Error[Symbol.hasInstance]` residual above is named, not
closed.

**Handed forward, and now discharged.** The three amendments this section
predicted — `../types.ts`'s `HaltPhase` note, `bootstrap.ts`'s in-code twin of
it, and the module-path prediction row in
[../notional-machine.md](../notional-machine.md) — all landed with the
`'script'` axis's own Phase 0, which is where they belonged.

**The new capture is a cross-unit tripwire, and it is recorded here because
nothing else will say it.** `importScripts` joins `bootstrap.ts`'s row above
because the script path resolves it in the worker realm and the rule is
mechanical. The latch suite pins that row's contents as an exact array
(`tests/latched-built-ins.test.ts`, the row named _"the captures in
`bootstrap.ts` name exactly the globals the README lists for it"_). **That row
is green and pins NINE names, while the table above lists ten — and the mismatch
is deliberate.** `importScripts` cannot be captured yet: this repo's
`tsconfig.json` sets `"lib": ["ESNext", "DOM"]` with no `WebWorker`, so the name
is not a declared global and a capture of it does not typecheck. So the row's
own title is false by exactly one name until the script path lands. Do not
rename it and do not reconcile it by editing the array — the script path's Phase
1 adds the capture and the tenth name together, and that row is the only thing
that will notice if it adds one without the other. They are one edit, in two
files.

## Navigation

- [DOCS.md](./DOCS.md) — wire-protocol architecture and ordering constraints
- [../README.md](../README.md) — the engine module: public API, glossary
- [../DOCS.md](../DOCS.md) — the engine's architectural sketch
- [../notional-machine.md](../notional-machine.md) — the machine twin: how the
  engine runs a program, realms included
