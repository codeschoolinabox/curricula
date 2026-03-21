# @study-lenses/trace-js-aran-legacy — Architecture & Decisions

## Why this tracer exists

Wraps the legacy Aran instrumentation engine — originally built for the
HackYourFuture Study Lenses project — in the standard `TracerModule` contract
from `@study-lenses/tracing`.

Instruments JavaScript source code via eval-in-iframe, capturing every
expression evaluation, variable access, function call, and control-flow step.
Returns structured, frozen `AranStep[]` conforming to `StepCore`.

Exists as a separate package so the legacy Aran engine can be used alongside
other `@study-lenses` tracers (e.g. the KLVE tracer) through the same API.

## Architecture

```text
code (string)
  → record/record.ts    ← capture-all override + pipeline orchestration
  → legacy-aran-trace/  ← eval-in-iframe instrumentation (vendored)
  → post-process.ts     ← raw entries → structured AranStep[]
  → filter-steps.ts     ← post-trace filtering → frozen AranStep[]
```

`src/index.ts` is wire-up only — no logic. All tracer logic lives in `record/`.

### Pipeline

```mermaid
flowchart TB
    consumer1["<b>CONSUMER PROGRAM</b><br/>(educational tool)<br/><br/>calls trace(tracer, code, config?)"]

    consumer1 -- "source code + partial config" --> prepareMeta

    subgraph wrapper ["@study-lenses/tracing — API WRAPPER"]
        direction TB

        subgraph validation ["VALIDATION (sync)"]
            direction TB
            prepareMeta["<b>Prepare meta config</b><br/>expand shorthand, fill defaults,<br/>validate against wrapper schema"]
            prepareOpts["<b>Prepare tracer options</b><br/>expand shorthand, fill defaults,<br/>validate against tracer schema<br/>(skipped if no optionsSchema)"]
            freezeConfig["<b>Freeze config</b><br/>deep-freeze resolved<br/>meta + options"]
            verifyOpts["<b>Verify options semantics</b><br/>cross-field constraints<br/>(skipped if no verifyOptions)"]

            prepareMeta --> prepareOpts --> freezeConfig --> verifyOpts
        end

        subgraph execution ["EXECUTION (async)"]
            direction TB
            executeTracer["<b>Execute tracer</b><br/>call record() with code +<br/>fully resolved frozen config"]
        end

        subgraph postprocessing ["POST-PROCESSING (sync)"]
            direction TB
            validateSteps["<b>Validate steps</b><br/>array of POJOs, 1-indexed step,<br/>valid source locations"]
            freezeOutput["<b>Freeze output</b><br/>deep-freeze steps for<br/>immutable consumer access"]

            validateSteps --> freezeOutput
        end

        verifyOpts -- "code + frozen config" --> executeTracer
        executeTracer -- "raw steps" --> validateSteps
    end

    freezeOutput -- "frozen steps" --> consumer2
    consumer2["<b>CONSUMER PROGRAM</b><br/>(receives frozen steps)"]

    subgraph tracermod ["TRACER MODULE  ★ = implemented in this package"]
        direction TB
        tid["<b>★ id</b>  'aran:legacy'"]
        tlangs["<b>★ langs</b>  ['js']"]
        tschema["<b>★ optionsSchema</b><br/>JSON Schema for filter options"]
        tverify["<b>★ verifyOptions</b><br/>range.start ≤ range.end"]
        trecord["<b>★ record</b><br/>capture-all → postProcess → filterSteps"]

        tid ~~~ tlangs
        tlangs ~~~ tschema
        tschema ~~~ tverify
        tverify ~~~ trecord
    end

    tschema -. "uses schema" .-> prepareOpts
    tverify -. "calls verify" .-> verifyOpts
    trecord -. "calls record" .-> executeTracer

    style wrapper fill:none,stroke:#333,stroke-width:3px
    style validation fill:none,stroke:#666,stroke-dasharray:5 5
    style execution fill:none,stroke:#666,stroke-dasharray:5 5
    style postprocessing fill:none,stroke:#666,stroke-dasharray:5 5
    style tracermod fill:#fff8e1,stroke:#f9a825,stroke-width:2px
    style consumer1 fill:#e3f2fd,stroke:#1565c0
    style consumer2 fill:#e3f2fd,stroke:#1565c0
```

## Key decisions

### Engine choice

The legacy Aran tracer — an eval-based instrumentation engine that runs code in
an iframe. Chosen for backward compatibility with the existing HackYourFuture
Study Lenses tooling. The engine is vendored in `record/legacy-aran-trace/` and
treated as a black box; this package does not modify its internals.

Alternatives considered: Babel-based AST instrumentation (more control but
higher maintenance), native debugger protocol (not browser-portable).

### Error mapping

The legacy tracer catches eval errors internally during iframe execution.
`record.ts` currently propagates unhandled exceptions as-is — there is no formal
mapping to `ParseError`, `RuntimeError`, or `LimitExceededError` yet. Formal
error mapping is future work that requires understanding which legacy tracer
failure modes correspond to each standard error type.

### Step format

The legacy tracer emits `RawEntry` objects with string-encoded operation info in
the `prefix` field (e.g. `"declare (const): x"`, `"binary: +"`), plus
`>>>`/`<<<` string markers for scope boundaries.

`postProcess` regex-parses these into structured `AranStep` objects with typed
fields: `operation`, `name`, `operator`, `modifier`, `values`, `depth`,
`scopeType`, `nodeType`, `loc`. Source locations are shallow-copied to plain
POJOs (Aran AST nodes may carry prototype chains). Steps are unnumbered at this
stage.

`filterSteps` applies user options, then assigns 1-indexed `step` numbers to
survivors.

### Options design

Uses **JSON Schema + `verifyOptions`**:

- `options.schema.json` — defines structure, types, and defaults for all filter
  options
- `verifyOptions` — enforces the cross-field constraint
  `range.start <= range.end`

Both are needed because JSON Schema handles structural validation and
default-filling well, but cannot express cross-field constraints.

Filtering is **post-trace** (not pre-trace) because the legacy tracer uses a
mutable singleton `config.js` to control instrumentation. Rather than threading
filter options through legacy code, `record.ts` temporarily overrides all config
flags to "capture everything", then filters structured output post-hoc.

## What this package deliberately does NOT do

- **Execute in Node.js** — the legacy Aran tracer requires browser DOM (iframe +
  eval)
- **Make pedagogical decisions** — returns raw trace data; presentation is the
  consumer's job
- **Persist or accumulate traces** — each call is stateless
- **Handle step/time limits** — no `LimitExceededError` support yet
- **Manage browser DOM** — iframe lifecycle is internal to the legacy tracer

## trace-action wrapper

`trace-action.ts` wraps the existing tracer with language-level validation and
`allow`/`block` feature configuration. It:

1. Resolves the `allow`/`block` config to a narrowed `LanguageLevel`
2. Validates source code against that level (throws if invalid)
3. Delegates to the existing `record()` function
4. Returns frozen `AranStep[]`

Enforcement is not applied because the legacy tracer runs in its own sandboxed
iframe. Validation is the gate.

### Potential worker migration

The legacy tracer currently runs in an iframe. Migrating to a Web Worker would
enable `maxTime` via `worker.terminate()`. A feasibility spike (Sprint 2 in the
implementation plan) will test whether the legacy vendor code can be
concatenated into a worker blob without breaking its global references. See the
plan file for the full feasibility analysis.
