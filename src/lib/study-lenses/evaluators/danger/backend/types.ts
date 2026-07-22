/**
 * The real-window backend's own contract — self-contained, importing nothing.
 * The backend speaks of a run's **outcome** and **result**; the evaluator's
 * `main` maps that onto the kind's **settlement** (`../types.ts`). Copied from
 * the quarry runner and grown here for two things the quarry deferred: the
 * `module` run mode, and a reachable wall-clock `timed-out` outcome.
 *
 * Cross-realm note: a run's error identity is read INSIDE the iframe realm and
 * handed out as primitives (`{ name, message }`) — a cross-realm `instanceof`
 * in the parent is unsound (the iframe has its own `Error`/`RangeError`).
 */

/**
 * How danger poses the program. `script` is a classic global-scope `<script>`
 * (synchronous); `module` is an inline `<script type="module">` (deferred,
 * module-scoped, `import`/top-level-`await`-capable). Default `script`.
 */
export type DangerMode = 'script' | 'module';

/**
 * A settled run's terminal outcome.
 *
 * - `completed` — natural end.
 * - `errored` — the program threw (or failed to parse), in its own words.
 * - `limit-exceeded` — the runaway-loop guard tripped.
 * - `timed-out` — the wall-clock budget elapsed (an otherwise-endless async run,
 *   e.g. a never-settling top-level `await`). Reachable — the quarry left this
 *   member structurally unreachable; the seconds budget below makes it real.
 * - `cancelled` — the consumer stopped pulling; the run was torn down.
 */
export type DangerOutcome =
	| 'completed'
	| 'errored'
	| 'limit-exceeded'
	| 'timed-out'
	| 'cancelled';

/**
 * The terminal result the backend resolves with — exactly once, never rejects.
 * `error` (the in-realm `{ name, message }` primitives) is present on every
 * non-clean, non-cancel outcome — including `limit-exceeded` and `timed-out`,
 * so the evaluator can carry the machine's own words up to the settlement
 * (the quarry returned a bare `limit-exceeded` with no error; this does not).
 */
export type DangerResult = Readonly<{
	outcome: DangerOutcome;
	error?: Readonly<{ name: string; message: string }>;
}>;

/**
 * Synchronous stand-ins for the program's I/O verbs, installed on the iframe
 * window BEFORE the program runs; any verb left unset stays **native** (a real
 * blocking dialog / the real console).
 *
 * **The mocks MUST be synchronous.** This is a hard constraint, not a
 * convenience: danger runs a real synchronous `<script>`, which cannot `await`,
 * so a promise-returning `confirm`/`prompt` would coerce to `[object Promise]`
 * at the learner's call site. Each verb returns its answer **directly** (a plain
 * value), never a `Promise` — the types below have no `| Promise<…>` arm, which
 * is how the constraint is enforced. (Live, interactive dialogs stay native and
 * really block; only the *mocked* answers are scripted.)
 */
export type DangerIoMocks = Readonly<{
	console?: Partial<Record<string, (...data: unknown[]) => void>>;
	alert?: (message?: string) => void;
	confirm?: (message?: string) => boolean;
	prompt?: (message?: string, defaultValue?: string) => string | null;
}>;

/**
 * What the backend's one verb accepts.
 *
 * - `type` — the run mode; default `script`.
 * - `iterations` — the runaway-loop guard's cap; absent ⇒ no guard.
 * - `seconds` — the wall-clock timeout budget; default 5. Bounds an
 *   otherwise-endless async run (it cannot preempt a synchronous freeze).
 * - `debuggerEnabled` — inject `debugger;` bracketing (step-from-the-top);
 *   default `false` (opt-in). A learner's own `debugger;` is a real breakpoint
 *   regardless — this bracketing is the separate, toggleable convenience.
 * - `io` — synchronous I/O mocks; unmocked verbs stay native.
 */
export type DangerRunOptions = Readonly<{
	type?: DangerMode;
	iterations?: number;
	seconds?: number;
	debuggerEnabled?: boolean;
	io?: DangerIoMocks;
}>;

/**
 * The handle `dangerRun` returns synchronously: a `result` that settles once and
 * never rejects, and an idempotent, first-write-wins `cancel`.
 */
export type DangerRunHandle = Readonly<{
	result: Promise<DangerResult>;
	cancel: () => void;
}>;

/** The backend's one public verb. */
export type DangerRun = (
	code: string,
	options: DangerRunOptions,
) => DangerRunHandle;
