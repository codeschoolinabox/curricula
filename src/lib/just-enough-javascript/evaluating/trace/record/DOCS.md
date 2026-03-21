# record — Architecture & Decisions

## Responsibility

This module owns the boundary between `@study-lenses/tracing`'s `RecordFunction`
contract and the legacy Aran instrumentation engine. `record.ts` is the
implementation; `index.ts` is the entry point (re-export, or
environment-switching wrapper if needed).

## Why a folder?

Keeps engine code, adapter, types, and tests co-located and out of `src/`. New
engine files belong here, not in `src/`.

## What we own vs what we don't

| File                 | Owned by                                                                  |
| -------------------- | ------------------------------------------------------------------------- |
| `index.ts`           | This package — entry point / env detection                                |
| `record.ts`          | This package — capture-all override + pipeline orchestration              |
| `post-process.ts`    | This package — raw entries → structured `AranStep[]`                      |
| `filter-steps.ts`    | This package — post-trace filtering pipeline                              |
| `types.ts`           | This package — `AranStep`, `AranFilterOptions`, `ResolvedAranConfig`      |
| `legacy-aran-trace/` | **Not owned** — vendored legacy Aran tracer (ESLint global ignores apply) |

## Error mapping

The legacy tracer catches eval errors internally during iframe execution.
`record.ts` currently propagates unhandled exceptions as-is — there is no formal
mapping to the standard `@study-lenses/tracing` error types yet:

- `ParseError` — not yet mapped (legacy tracer swallows syntax errors)
- `RuntimeError` — not yet mapped (runtime errors surface as raw exceptions)
- `LimitExceededError` — not yet mapped (no step/time limits enforced)

Formal error mapping is future work — it requires understanding which legacy
tracer failure modes correspond to each standard error type.

## Step format

### Raw entries (from legacy tracer)

The legacy Aran traceCollector emits `RawEntry` objects:

```typescript
type RawEntry = {
	type: 'log' | 'groupStart';
	prefix: string | null; // e.g. "declare (const): x", "binary: +"
	style: string;
	logs: unknown[]; // runtime values
	loc: SourceLocation | null;
	nodeType: string | null;
};
```

Interspersed with string markers `'>>>'` (enter scope) and `'<<<'` (leave
scope).

### Transformation (postProcess)

`postProcess` regex-parses `prefix` strings into structured fields:

- `operation` — `declare`, `read`, `assign`, `initialize`, `call`, `return`,
  `binary`, etc.
- `name` — variable name, function name, control type (`if`, `while`, `for-of`),
  or break/continue label (null when absent)
- `operator` — `+`, `===`, `typeof`, `?:`, etc. (null for non-operators)
- `modifier` — declaration kind (`let`, `const`, `var`), truthiness (`truthy`,
  `falsy`), hoist kind, or call type (`built-in`) (null when absent)
- `values` — copied from `logs`
- `result` — evaluated result for operator steps (binary, unary, conditional);
  folded from child `evaluate` entries (only present on operator steps)
- `depth` — tracked via `>>>`/`<<<` marker counting
- `scopeType` — inferred from the operation that opened the scope
- `loc` — shallow-copied to a plain
  `{start: {line, column}, end: {line, column}}` POJO (Aran AST nodes may carry
  prototype chains)
- `nodeType` — copied from raw entry

Steps are **unnumbered** at this stage — `filterSteps` assigns 1-indexed `step`
numbers to surviving steps after filtering.

### Filtering (filterSteps)

`filterSteps` applies user options in order:

1. **Category toggles** — enable/disable entire operation categories
2. **List filters** — whitelist specific operators (`operatorsList`) or control
   flow types (`controlFlowList`)
3. **Name filter** — whitelist specific names (empty = keep all)
4. **Range filter** — keep only steps within source line range (with depth
   coherence)
5. **Data stripping** — remove loc, values, nodeType, depth from output
6. **Re-numbering** — surviving steps get 1-indexed `step` numbers
7. **Deep freeze** — output is frozen for immutable consumer access

## Options design

Options use **JSON Schema + `verifyOptions`**:

- `options.schema.json` defines structure, types, and defaults
- `verifyOptions` enforces cross-field constraints (`range.start <= range.end`)

**Post-trace filtering** (not pre-trace) because the legacy tracer uses a
mutable singleton `config.js` to control instrumentation. Rather than threading
filter options through legacy code, `record.ts` temporarily overrides all config
flags to "capture everything", then filters the structured output post-hoc. The
original config is restored in a `try/finally`.
