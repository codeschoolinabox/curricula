# api — Design Decisions

## Why a unified `error` field with `kind` discrimination

Rather than separate top-level fields for each failure mode (`parseError`,
`runtimeError`, `limitExceeded`), all errors go through a single `error` field
discriminated by `kind: 'parse' | 'javascript' | 'timeout' | 'iteration-limit'`.

This gives consumers a single check point:

```typescript
if (result.error) {
  switch (result.error.kind) { ... }
}
```

Each kind carries the fields relevant to it (e.g. `limit` only on `'timeout'`
and `'iteration-limit'`, `phase` only on `'javascript'`, `'timeout'`, and
`'iteration-limit'`).

## How error kinds are detected

Each wrapper detects error kinds by checking what the raw evaluating function
signals through its output — not by adding new infrastructure:

- **`run`**: Scans the returned event log for the last `event: 'error'` entry.
  If `name === 'TimeoutError'` → `kind: 'timeout'`, otherwise → `kind: 'javascript'`.
- **`trace`**: Scans Aran steps for the last `operation: 'exception'` step.
  If the first value ends with `'TimeoutError'` → `kind: 'timeout'`, otherwise →
  `kind: 'javascript'`.
- **`debug`**: Catches rejections from the raw debug function. If
  `error.name === 'RangeError'` → `kind: 'iteration-limit'`, otherwise →
  `kind: 'javascript'`.

Parse errors are detected before execution, during the validation preamble.

## Why rejections are NOT errors

Language level violations (rejections) are pedagogical feedback — "you used
`var`, try `let`" — not crashes. They live in a separate `rejections` field, not
inside `error`. The UI treatment is different: rejections show a list of specific
guidance, while errors show a single failure message.

Rejections and warnings are only present when validation ran (i.e. code parsed
successfully). If the code can't parse, there are no rejections — you can't
validate what you can't parse.

## Why `line` and `column` are flat fields

Parse errors from acorn provide both line and column. Runtime errors from workers
reliably provide line but not always column. Rather than wrapping them in a
`location: { line, column }` object, they're flat fields: `line` (required for
parse, optional for runtime) and `column` (always optional). This avoids forcing
a fake column value when one isn't available.

## Why `validate` is both public API and shared preamble

Study environments need real-time validation feedback without executing code.
Rather than having a separate validation function AND an internal helper, the
same `validate` function serves both roles. Each wrapper calls it first — if
`!result.ok`, returns the validation result directly (already the right shape).

## Why all results are frozen

Per AGENTS.md convention: this codebase is consumed by LLMs that cannot be
trusted not to mutate returned data. All result objects are deep-frozen in place
using `deepFreezeInPlace` before returning (since we own the objects we just
built).

## Why no barrel file

AGENTS.md bans barrel re-exports (no `index.ts` except `/src/index.ts`).
Consumers import directly: `import validate from '../api/validate.js'`.
