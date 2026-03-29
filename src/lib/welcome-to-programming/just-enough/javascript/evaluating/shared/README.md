# evaluating/shared

Shared infrastructure for all three evaluation engines (`run`, `trace`,
`debug`). Provides the `Execution` type and factory, SAB pause protocol, and
loop guard injection.

## Structure

| Path                  | Purpose                                                     |
| --------------------- | ----------------------------------------------------------- |
| `types.ts`            | `Execution`, `EngineConfig`, `TraceConfig`, `RunEvent`      |
| `create-execution.ts` | Factory: wraps an AsyncGenerator into an `Execution` object |
| `guard-loops/`        | Loop guard injection to prevent infinite loops              |

## Execution type

All engines return an `Execution<TEvent, TResult>` — an object that is both
`AsyncIterable<TEvent>` (for streaming) and `PromiseLike<TResult>` (for batch).
The `createExecution` factory builds this from an async generator.

```ts
type Execution<TEvent, TResult> = AsyncIterable<TEvent>
  & PromiseLike<TResult>
  & {
    readonly result: Promise<TResult>;
    readonly cancel: () => void;
  };
```

- `for await (const event of execution)` — step through events one at a time
- `await execution` — drain all events and resolve to the result (PromiseLike)
- `execution.result` — same Promise as `.then()` delegates to
- `execution.cancel()` — terminate execution early (idempotent)
- Second `for await` replays cached events from `.result.logs`

## Engine configuration

All engines accept `EngineConfig`:

```ts
type EngineConfig = {
  readonly seconds?: number;    // cumulative execution time limit
  readonly iterations?: number; // max loop iterations before RangeError
};
```

Program ends when the first limit is reached. Timeout tracks cumulative
execution time (pauses during SAB wait so learners can examine steps
indefinitely).

The trace engine extends this with optional trace granularity options:

```ts
type TraceConfig = EngineConfig & {
  readonly options?: TraceOptions;
};
```

## Guard loops

The `guard-loops/` module prevents infinite loops in learner code by injecting
iteration counters into `while` loop conditions via AST transformation. Used by
both run and debug engines (with different injection strategies per engine).

## Navigation

- [guard-loops/README.md](./guard-loops/README.md) — loop guard injection
- [DOCS.md](./DOCS.md) — architecture decisions and design rationale
- [../run/README.md](../run/README.md) — run engine
- [../trace/README.md](../trace/README.md) — trace engine
- [../debug/README.md](../debug/README.md) — debug engine
