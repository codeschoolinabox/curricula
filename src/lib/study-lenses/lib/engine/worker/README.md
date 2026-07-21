# engine/worker

Transport internals: the shared-memory wire protocol the engine's two sides
speak. Nothing here is consumer-facing — consumers touch only the public
contract in [../types.ts](../types.ts); these files are how the thread and the
sandboxed worker coordinate underneath it.

## Structure

| Path                     | Purpose                                                               |
| ------------------------ | --------------------------------------------------------------------- |
| `protocol.ts`            | The wire protocol as data: buffer layout, slot indices, signal values |
| `types.ts`               | Engine-internal message types: buffer views, postMessage envelopes    |
| `create-buffer-views.ts` | Typed views (control header + payload area) over the shared buffer    |
| `write-call-response.ts` | Thread-side: encode one bounded call response and signal the worker   |
| `read-call-response.ts`  | Worker-side: decode the response, reset the channel for the next call |
| `bootstrap.ts`           | Worker-side: handshake, consumer setup, globals injection, halt posts |
| `write-resume-signal.ts` | Thread-side: release the worker's pause                               |
| `clear-event-ready.ts`   | Thread-side: clear the event-ready flag after disposing an emission   |

## Navigation

- [DOCS.md](./DOCS.md) — wire-protocol architecture and ordering constraints
- [../README.md](../README.md) — the engine module: public API, glossary
- [../DOCS.md](../DOCS.md) — the engine's architectural sketch
