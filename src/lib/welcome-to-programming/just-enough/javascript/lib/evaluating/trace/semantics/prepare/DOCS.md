# prepare — Architecture

## Architectural sketch

### Execution phases

1. **Validate inputs at the boundary** (sync, throws) — reject non-string code
   and non-object configs loudly. Loud failure, no silent fallbacks. Input:
   raw user arguments (may be any type). Output: confirmed code + confirmed
   config-or-undefined.

2. **Normalize to flat domain shape** (sync, pure) — extract `options`, `range`,
   `iterations`, and `seconds` from the user's `TraceConfig`. Default absent
   `options` to `{}` (the schema's default-filling will take over from there).
   Input: validated config. Output: raw options + raw meta fields.

3. **Schema-driven config preparation** (sync, throws) — hand the raw options to
   the configuring pipeline: expand boolean shorthand, fill defaults from the
   schema, validate the result. Any violation throws with a human-readable
   list of errors. Input: raw options + canonical schema. Output: fully
   resolved options object.

4. **Cross-field semantic validation** (sync, throws) — run the verify-options
   checks that JSON Schema cannot express: `range.start ≤ range.end`,
   `iterations > 0`, `seconds > 0`. Input: the user's raw meta fields. Output:
   nothing on success, throws on violation.

5. **Assemble the prepared input** (sync, pure) — return the validated code
   plus resolved options plus raw meta fields. Downstream (the tracer) uses
   this to drive Aran instrumentation.

### Structural constraints

- **Loud failure at every phase** — no silent fallbacks, no "did you mean"
  heuristics. If the user passes something wrong, they get a specific error
  message identifying the violation.
- **Purity** — no I/O, no mutation of inputs, no observable side effects.
  Every phase is a pure function of its inputs.
- **Synchronous only** — prep must complete before the async tracing Worker
  spawns. No promises, no awaits.
- **Idempotent** — calling `prepareForTrace` twice with the same arguments
  produces the same output.
- **Error ownership** — all thrown errors originate within this module. The
  tracer catches them once and wraps into a `TraceResult { ok: false }`.

### Out of scope

- Worker lifecycle — the tracer handles that
- Aran instrumentation — the tracer handles that
- Streaming vs batch — the tracer handles that
- Format checking of the source (JEJ-level concern lives in `api/format.ts`)
- Parse validation of the source (JEJ-level concern lives in `api/validate.ts`)

## Pipeline stages

The prep module owns the full config preparation pipeline:

| File | Role |
|---|---|
| `prepare-for-trace.ts` | Orchestrator — validates input types, extracts options/range/iterations/seconds, calls the pipeline, assembles `PreparedTraceInput` |
| `expand-shorthand.ts` | Stage 1: recursive boolean shorthand expansion (handles nested schemas like `{ statements: true }` → full structure) |
| `fill-defaults.ts` | Stage 2: AJV-backed default filling using the schema's `default` values |
| `validate-config.ts` | Stage 3: AJV-backed schema validation, throws plain `Error` with all violations joined |
| `prepare-config.ts` | Pipeline wrapper enforcing stage order (expand → fill → validate) |
| `verify-options.ts` | Cross-field semantic checks (range start ≤ end, iterations > 0, seconds > 0) — what JSON Schema can't express |
| `ajv.ts` | CJS/ESM interop wrapper for `ajv/dist/2020.js` (JEJ's schemas use draft-2020-12) |
| `types.ts` | `PreparedTraceInput` + `JSONSchema` types |
