# record/

Instruments and executes JeJ code, producing a stream of trace events.

The implementation lives in `tracing/` — this directory is a thin re-export
via `index.ts`.

## Pipeline

```text
code → tracing/instrument.ts (main thread: Aran standalone mode)
     → tracing/trace-worker.ts (worker: eval instrumented code)
     → tracing/index.ts (async generator: yield TraceEvent, return TraceResult)
```

See `tracing/weaving/advice/DOCS.md` for the advice architecture.
