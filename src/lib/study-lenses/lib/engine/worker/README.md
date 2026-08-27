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
HR-20 is untouched and stays untouched: **no third execution path is ratified
here**, the two paths documented are the two that ship, and
`evaluators/types.ts`'s closed `ExecutionAxis` union and its tsc tripwire are
not reached by this unit.

**NOT discharged here, named for honesty:** no LOSS-LEDGER classification rows —
the engine carries none in that table, and "no rows" is the discharge rather
than silence. The `'script'` axis and everything in
`.planning-handoffs/engine-script-axis/BRIEF.md` belong to a later unit; this
one is its prerequisite and ratifies nothing about it. **One consequence of that
unit lands here and nothing tripwires it:** HR-23 also rules that gating the
parse thread-side moves a module _parse_ failure from `'evaluation'` to
`'creation'`, which will falsify `../types.ts`'s `HaltPhase` note,
`bootstrap.ts:240-243`, and the module-path prediction row in
[../notional-machine.md](../notional-machine.md). That amendment is the axis
unit's, not this one's. The `Error[Symbol.hasInstance]` residual above is named,
not closed.

## Navigation

- [DOCS.md](./DOCS.md) — wire-protocol architecture and ordering constraints
- [../README.md](../README.md) — the engine module: public API, glossary
- [../DOCS.md](../DOCS.md) — the engine's architectural sketch
- [../notional-machine.md](../notional-machine.md) — the machine twin: how the
  engine runs a program, realms included
