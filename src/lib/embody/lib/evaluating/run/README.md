# run — Trapless Engine

Runs JeJ code in a Web Worker and returns final status only — no event stream,
no logs, no console traps. The third evaluation engine, sibling to
[intercept](../intercept/README.md) (which captures `console` + dialog events)
and [trace](../trace/README.md) (which streams AST-level execution steps).

## When to use it

Pick **`run`** when the consumer just needs to know whether a program ran
cleanly — completed, timed out, hit an iteration limit, was cancelled, or threw.
Typical shape:

```ts
const result = await run(code, { seconds: 5 });
if (result.ok) {
	// program completed
} else {
	// inspect result.outcome / result.error
}
```

If you need to capture what the program logged, picked, or alerted — use
**`intercept`**. If you need expression-level execution traces — use
**`trace`**.

## Public API

```ts
function run(code: string, options?: RunOptions): RunHandle;

type RunOptions = {
	seconds?: number; // user-perceived runtime budget; default 5
	iterations?: number; // optional guarded-loop limit; omitted = no guards
	io?: {
		prompt?: (
			message: string,
			defaultValue?: string,
		) => string | null | Promise<string | null>;
		alert?: (message: string) => void | Promise<void>;
		confirm?: (message: string) => boolean | Promise<boolean>;
	};
};

type RunHandle = PromiseLike<RunResult> & {
	readonly cancel: () => void;
	readonly result: Promise<RunResult>;
	readonly code: string; // the source you passed in
	readonly ast: Program | undefined; // parse output (acorn); undefined iff parse failed
	readonly options: ResolvedRunOptions; // seconds defaulted; others as-passed
};

type RunResult = BaseResult<RunResultError> & {
	readonly outcome:
		| 'complete'
		| 'cancel'
		| 'timeout'
		| 'iteration-limit'
		| 'error';
	readonly ast?: Program; // present whenever parse succeeded
};
```

`ok: true` iff `outcome === 'complete'`. On every other outcome, `ok: false` and
(except for `'cancel'`) `error` carries a discriminated `RunResultError`.

The handle has no `for await`, no `Symbol.asyncIterator`, no `.fail()`.
`await handle` resolves directly to the `RunResult` via the `.then` delegate
that mirrors intercept's drain-on-await behavior.

## Consumer patterns

**1. Await directly** — most common.

```ts
const result = await run(code);
console.log(result.outcome);
```

Forfeits cancel access (no handle held).

**2. Hold + maybe cancel + await.**

```ts
const handle = run(code, { seconds: 30 });
// ... later:
handle.cancel();
const result = await handle.result; // outcome:'cancel'
```

Or, equivalently after cancel:

```ts
const handle = run(code);
handle.cancel();
const result = await handle; // PromiseLike — same as .result
```

## Sync surface on the handle

All sync-knowable data is on the handle at the moment `run()` returns. Useful
for diagnostics, logging, or AST inspection without awaiting:

```ts
const handle = run('let x = 1;\n');
handle.code; // 'let x = 1;\n'
handle.ast; // acorn Program node, or undefined if parse failed
handle.options.seconds; // resolved (default 5 if omitted)
handle.options.iterations; // as-passed (no default)
```

## I/O fallback (parity with intercept)

When learner code calls `prompt`/`alert`/`confirm` and the consumer **did not
provide a mock for that dialog**, run falls back to the native browser dialog:
`globalThis.prompt` / `globalThis.alert` / `globalThis.confirm`. Same behavior
as intercept — no divergence.

For headless or fire-and-forget contexts where a native dialog would hang, pass
mocks for every dialog the program might call:

```ts
const result = await run(code, {
	io: {
		prompt: () => null,
		alert: () => undefined,
		confirm: () => false,
	},
});
```

## What is NOT here

- **No `console` traps.** Programs that call `console.log` write to the worker's
  native console (visible in browser dev tools). Captured logs are intercept's
  job.
- **No event stream.** No `for await`, no `Symbol.asyncIterator`.
- **No `.fail(reason)`.** Cancel is the only mutator.
- **No replay.** The result Promise is memoized but there's nothing to replay
  (no events).
- **No backwards-compatible positional `seconds` argument.** Always pass options
  as an object: `run(code, { seconds: 5 })`.

## Sandbox

A hand-test page exercises the full public API:

```bash
npx vite --config src/lib/study-lenses/embody/lib/evaluating/run/vite.sandbox.config.ts
```

Then click `[run]` on the snippets to walk through each outcome variant. The
page's status line surfaces `outcome` / `ok` / `error.kind` / `error.message`,
and the full result object is logged to the dev-tools console as `[run result]`.

## Tests

```bash
node ./node_modules/vitest/vitest.mjs run --project unit \
	src/lib/study-lenses/embody/lib/evaluating/run/tests/

node ./node_modules/vitest/vitest.mjs run --project browser \
	src/lib/study-lenses/embody/lib/evaluating/run/tests/
```

## Related

- [intercept/](../intercept/) — engine that captures console + dialog events.
- [trace/](../trace/) — engine that streams AST-level execution steps.
- [shared/](../shared/) — cross-engine primitives (`Execution` factory, SAB
  pause protocol, guard-loops).
- [DOCS.md](./DOCS.md) — architecture, decisions, cancel state machine, I/O
  default rationale.
