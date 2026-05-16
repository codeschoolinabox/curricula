# evaluating/shared

Shared infrastructure for all three evaluation engines (`run`, `trace`,
`debug`). Provides the `Execution` type and factory, and the SAB pause
protocol.

## Structure

| Path                  | Purpose                                                     |
| --------------------- | ----------------------------------------------------------- |
| `types.ts`            | `Execution`, `EngineConfig`, `TraceConfig`, `InterceptEvent`      |
| `create-execution.ts` | Factory: wraps an AsyncGenerator into an `Execution` object |

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

## Navigation

- [DOCS.md](./DOCS.md) — architecture decisions and design rationale
- [../intercept/README.md](../intercept/README.md) — intercept engine (owns `guard-loops/`)
- [../trace/README.md](../trace/README.md) — trace engine
- [../debug/README.md](../debug/README.md) — debug engine
