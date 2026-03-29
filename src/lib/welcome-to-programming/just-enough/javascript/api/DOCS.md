# api — Architecture & Decisions

## Design principles

### Object describes, functions transform

The code object (`JejProgram`) is a live analysis dashboard — it describes the
current state of the code. Standalone API functions (`format`, `validate`, etc.)
transform code. To update: `program.code = format(program.code)` — external,
explicit.

This keeps the code object's role clear: it reports, it doesn't fix.

### No warnings in execution results

Execution results (`RunResult`, `TraceResult`, `DebugResult`) do NOT include
warnings. Get warnings via `hint()` or the code object's `.warnings` property.

Rationale: execution results are about what happened when the code ran. Warnings
are about what the code looks like before it runs. Mixing them conflates two
concerns and makes result types heavier.

## Execution pipeline

All execution functions run the same pipeline:

```text
1. is it syntactically valid?        → parse
2. does it use things it shouldn't?  → JeJ validation
3. is it properly formatted?         → format check
4. what happens when we run it?      → evaluate
```

### Why validate before format

No point format-checking code that uses disallowed features. Fix your features
first, then fix your formatting.

### Why format is a gate

Formatting is required before execution. Same pedagogical philosophy as JeJ
language constraints — remove choices to focus learning. All code from all
learners looks identical in structure.

Note: "The learning environment requires formatted code. Your unformatted JeJ
code is valid JavaScript and will run elsewhere. Formatting is a learning
constraint, not a language constraint."

### Format gate returns a specific error kind

Unformatted code returns `{ ok: false, error: { kind: 'formatting' } }`. This
is a distinct error kind so the UI can show a "Format your code" prompt rather
than a generic error.

## Why a unified `error` field with `kind` discrimination

Rather than separate top-level fields for each failure mode (`parseError`,
`runtimeError`, `limitExceeded`), all errors go through a single `error` field
discriminated by `kind`:

- `'parse'` — acorn parse failure
- `'javascript'` — runtime error during execution
- `'timeout'` — time limit exceeded
- `'iteration-limit'` — loop iteration limit exceeded
- `'formatting'` — code not formatted (pipeline gate)

```typescript
if (result.error) {
  switch (result.error.kind) { ... }
}
```

## How error kinds are detected

Each wrapper detects error kinds by checking what the raw evaluating function
signals through its output — not by adding new infrastructure:

- **`run`**: Scans the returned event log for the last `event: 'error'` entry.
  If `name === 'TimeoutError'` → `kind: 'timeout'`, otherwise →
  `kind: 'javascript'`.
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

Rejections are only present when validation ran (i.e. code parsed successfully).
If the code can't parse, there are no rejections — you can't validate what you
can't parse.

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

## Code object design (JejProgram)

### Why a factory, not a class

`createJejProgram(code?)` returns a plain object with a getter/setter for
`.code`. No `new`, no prototype chain, no `instanceof` checks. Matches the
codebase convention of named function declarations and plain objects.

### Why construction never throws

`jej('for (;;) {}')` succeeds with `ok: false`. The code object is a status
report, not a gatekeeper. This means the UI can always create a code object and
read its properties — no try/catch needed.

### Why setter re-runs the pipeline

`.code = newCode` updates all properties (`.ok`, `.rejections`, `.isFormatted`,
`.warnings`). Components sharing a reference to the same code object see the
updated state. This is the "live analysis dashboard" model.

### Why execution is blocked when !ok

`.run()`, `.trace()`, `.debug()` return immediate error results when `!ok`. No
re-validation needed — the cached state is the source of truth.

## Why all results are frozen

Per AGENTS.md convention: this codebase is consumed by LLMs that cannot be
trusted not to mutate returned data. All result objects are deep-frozen in place
using `deepFreezeInPlace` before returning (since we own the objects we just
built).

## Why no barrel file

AGENTS.md bans barrel re-exports (no `index.ts` except `/src/index.ts`).
Consumers import directly: `import validate from '../api/validate.js'`.
