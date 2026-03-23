# data

Shared mutable state and configuration for the legacy Aran tracer.

## Files

| File        | Purpose                                                    |
| ----------- | ---------------------------------------------------------- |
| `config.js` | Instrumentation flags — controls which operations are traced. Overridden to "capture everything" by `record.ts` before each trace call. |
| `state.js`  | Runtime state accumulated during a trace (depth counter, entries list). Reset between trace calls. |
