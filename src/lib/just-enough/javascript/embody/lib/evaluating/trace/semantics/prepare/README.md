# prepare

Pre-flight preparation pipeline for the JEJ trace engine. Called by the tracer
(`createTracingGenerator`) as its first step, before any Aran instrumentation
runs. Validates input, expands and fills the user's options against the
canonical schema, runs cross-field semantic checks, and returns the prepared
config ready for execution.

Both the streaming path (`api/trace.ts`) and any batch consumer get identical
prep without duplicating the logic, because the tracer itself is the single call
site.

## Pipeline

```text
prepareForTrace(code, config?)
  │
  ├── 1. Validate code is a string           →  Error
  ├── 2. Validate config is object|undefined →  Error
  ├── 3. prepareConfig(options, schema)      →  Error
  │       └── expand → fill → validate
  ├── 4. verifyOptions(flatConfig)           →  Error (semantic)
  └── 5. Return PreparedTraceInput { code, options, range, iterations, seconds }
```

## Files

| File                   | Purpose                                                  |
| ---------------------- | -------------------------------------------------------- |
| `prepare-for-trace.ts` | Main entry point — orchestrates the pipeline             |
| `prepare-config.ts`    | 3-stage wrapper: expand → fill → validate                |
| `expand-shorthand.ts`  | Recursive boolean-shorthand expander                     |
| `fill-defaults.ts`     | AJV-backed default filling                               |
| `validate-config.ts`   | AJV-backed schema validation                             |
| `verify-options.ts`    | Cross-field semantic checks (range, iterations, seconds) |
| `ajv.ts`               | CJS/ESM interop wrapper for `ajv/dist/2020.js`           |
| `types.ts`             | `PreparedTraceInput` + `JSONSchema` types                |

## Error handling

Every step throws a plain `Error` with a descriptive message. JEJ has no shared
`errors/` directory yet, so there's no `instanceof` discrimination between
argument / schema / semantic errors. A later sprint may promote to dedicated
classes.

The tracer (`createTracingGenerator`) catches these errors and wraps them into a
failure `TraceResult` with `ok: false` and `phase: 'creation'`.

## Navigation

- [DOCS.md](./DOCS.md) — architectural sketch, design decisions
- [../tracing/index.ts](../tracing/index.ts) — the tracer that calls
  `prepareForTrace`
- [../README.md](../README.md) — trace module overview
