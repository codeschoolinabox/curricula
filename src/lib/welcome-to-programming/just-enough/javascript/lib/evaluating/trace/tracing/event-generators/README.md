# Event Generators

Factory functions that create validated, frozen trace event objects from runtime
data. Each generator produces the domain-specific fields for one event category;
a wrapper function attaches source metadata and deep freezes the result.

## How it fits

```text
Aran advice → wrapper(metadata, generatorPath, payload) → frozen TraceEvent
                 ↓
           generators namespace object
           (mirrors config structure)
                 ↓
           individual generator
           (validates + builds domain fields)
```

- **Upstream**: Aran's instrumentation advice calls the wrapper with AST/source
  metadata and a generator path
- **Downstream**: The step tracker receives frozen `TraceEvent` objects and adds
  step numbers
- **Types**: All event shapes defined in
  [`../types.ts`](../types.ts)
- **Config**: Generator paths mirror
  [`../../options.schema.json`](../../options.schema.json)

## Default export

The wrapper function — the single entry point for creating trace events. See
[DOCS.md](./DOCS.md) for architecture details.

## Directory structure

Each subdirectory contains generators for one event category. One generator per
file, named after its default export.

| Directory          | Event category     | Generator count |
| ------------------ | ------------------ | --------------- |
| `binding/`         | Binding lifecycle  | 1               |
| `property-access/` | Property access    | 1               |
| `operator/`        | Operators          | 3               |
| `parenthesis/`     | Parenthesis groups | 1               |
| `literal/`         | Literal values     | 1               |
| `template/`        | Template literals  | 3               |
| `scope/`           | Scope lifecycle    | 1               |
| `control-flow/`    | Control flow       | 7               |
| `function/`        | Function calls     | 2               |
| `with/`            | With statement     | 1               |
