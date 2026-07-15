/**
 * @file The public contract of the stand-alone danger runner.
 *
 * This module OWNS this contract and imports NOTHING: the orchestrator imports
 * these types and wires them into the dock's props — the dependency arrow points
 * DOWN into this `lib/` module, never up (a `lib → orchestrate` import would be
 * backwards). It deliberately does NOT import the dock's `EndReportOutcome`: the
 * runner's {@link DangerOutcome} is a hand-owned narrow union, and its
 * subset-assignability to `EndReportOutcome` is realised inside the D3 adapter,
 * which maps a `DangerResult` to a uniform `EvaluateHandle` the orchestrator
 * reads via `endReport.outcome` — not a direct `setOutcome(result.outcome)`.
 *
 * The runner takes the RAW editor buffer (a `string`) and evaluates it as a real
 * `<script>` in a permissive, same-origin iframe on the MAIN thread, bypassing
 * embody's parse → validate → create → Web-Worker sandbox. It keeps the
 * loop-guard instrumentation (limited) but drops the sandbox (off-thread
 * isolation + external terminate) — an on-thread hang can freeze the host page.
 * That is the gated, named danger; see README.md § Security posture.
 *
 * Vocabulary is pinned in README.md § Ubiquitous language; the honest limits of
 * on-thread execution in README.md § Edge cases; the internal architecture (the
 * script-build, the outcome classifier, the settle-latch) in DOCS.md.
 */

// ─── Outcome (the terminal classification, a subset of the dock's union) ──────

/**
 * How a danger run ended — the ONLY thing the runner must report back. A subset
 * of the dock's `EndReportOutcome`; the other members (`timed-out` / `failed` /
 * `not-runnable`) are worker/parse concepts, structurally unreachable on the
 * bypass path (danger runs on-thread, non-terminable, with no parse/create gate).
 *
 * @remarks
 * - `completed` — the injected script ran to natural completion (no throw).
 * - `errored` — the script threw; the throw is NOT the loop-guard's (see
 *   {@link DangerResult.error}).
 * - `limit-exceeded` — the loop-guard tripped: a `RangeError` whose message
 *   matches embody's predicate (`includes('exceeded')` && `includes('iterations')`),
 *   recognised only when `iterations` was set. The runner emits this PUBLIC
 *   literal directly — embody's internal `iteration-limit` is remapped upstream
 *   and is not copied here.
 * - `cancelled` — the dock's Cancel tore the iframe down before the run settled.
 *
 * A synchronous hang produces NO outcome — `result` never settles and the tab
 * freezes (README.md § Edge cases). It is not a member of this union because it
 * is not a reportable end state.
 */
type DangerOutcome = 'completed' | 'errored' | 'limit-exceeded' | 'cancelled';

// ─── Result (outcome + errored-only error primitives) ─────────────────────────

/**
 * The terminal result of one danger run. `result` resolves to this exactly once
 * and NEVER rejects — an error rides `outcome: 'errored'`, mirroring embody's
 * endReport, so the caller's `.catch` is pure defense-in-depth.
 *
 * `error` is present only when `outcome === 'errored'`, and carries PRIMITIVES,
 * never the live `Error`: the iframe realm has its own `RangeError`/`Error`
 * constructors, so a cross-realm `instanceof` in the parent is unsound. Error
 * identity is read INSIDE the iframe's `catch` (same realm) and passed out as
 * `{ name, message }`. Console/dialog OUTPUT is never here — it is native (no
 * `io` passed) or routed through {@link DangerIoMocks} (io passed).
 */
type DangerResult = Readonly<{
	outcome: DangerOutcome;
	error?: Readonly<{ name: string; message: string }>;
}>;

// ─── Handle (the mini-handle the orchestrator holds) ──────────────────────────

/**
 * The value `dangerRun` returns — a deliberately NARROWER shape than embody's
 * `EvaluateHandle` (`{ result, cancel }` only; no `fail`, no `AsyncIterable`).
 * SUPERSEDED wiring (D3): rather than widening `handleReference` to hold either
 * handle, the adapter WRAPS this into a uniform `EvaluateHandle`, so
 * `handleReference` stays `EvaluateHandle` and the orchestrator reads it
 * unchanged (see README.md § What it produces — Integration).
 */
type DangerRunHandle = Readonly<{
	/**
	 * Resolves ONCE to a {@link DangerResult}; never rejects; never earlier than a
	 * macrotask (so the orchestrator's `running → settled` transition paints and an
	 * `io` mirror never races the channel reset — DOCS.md § Structural constraints).
	 */
	result: Promise<DangerResult>;
	/**
	 * Tear the iframe down and settle `cancelled` if the run has not already
	 * settled. Idempotent, first-write-wins: a no-op after a terminal settle, and
	 * a no-op during a synchronous on-thread hang (the event loop never yields to
	 * run it — only the loop-guard can break a loop).
	 */
	cancel: () => void;
}>;

// ─── IO (optional SYNC mocks; danger-owned; absent ⇒ fully native) ────────────

/**
 * The console-only mock surface: a partial map of `console` method name → sync
 * handler. Kept separate from the dialog verbs so a caller can mock `log` while
 * leaving `warn` native (per-method smart merge — DOCS.md § Execution phases).
 */
type DangerConsoleMock = Partial<
	Record<string, (...arguments_: readonly unknown[]) => void>
>;

/**
 * The mocked-mode output/interaction surface — danger's OWN, deliberately
 * SYNCHRONOUS type. It carries the user-I/O verbs (`alert` / `confirm` /
 * `prompt`) AND `console`; every dialog verb returns its value synchronously —
 * NO `| Promise<…>`.
 *
 * It does NOT import embody's `IoMocks`, and is NOT the same shape. Embody's
 * mocks are AWAITED by its Worker engine (`embody/types.ts` — "Every mock is
 * awaited"; its `console` is even `void | Promise<void>`), but danger evaluates a
 * real synchronous `<script>` that cannot `await` a `Promise`-returning mock (it
 * would coerce to `[object Promise]`). The sync-only signatures here ENCODE that
 * constraint. The unified "one `buildIoMocks()` feeds both backends" is
 * deliberately given up: the orchestrator builds a DISTINCT sync danger builder
 * (README.md § Ubiquitous language — Output mode).
 *
 * Presence is the mode: `io` PASSED ⇒ mocked (the runner routes the iframe's
 * `alert`/`confirm`/`prompt`/`console` through these callbacks, e.g. to an
 * on-screen panel for a device without devtools); `io` ABSENT ⇒ no mocks, fully
 * native (real console, real native dialogs). A sync mock cannot block for LIVE
 * typed input, so live interactive dialogs stay NATIVE — leave the verb unset
 * (README.md § Edge cases).
 */
type DangerIoMocks = Readonly<{
	console?: DangerConsoleMock;
	alert?: (message: string) => void;
	confirm?: (message: string) => boolean;
	prompt?: (message: string, defaultValue?: string) => string | null;
}>;

// ─── Options (raw string in; iterations, debugger, optional io mocks) ─────────

/**
 * Inputs to one danger run. Frozen; per-run (no persistence across runs).
 *
 * @remarks
 * - `iterations` — the loop-guard iteration cap danger embeds in its `makeGuard`
 *   call-text when driving the peer's `spliceLoopGuards`. OPTIONAL: with none set
 *   the guard is not applied and any
 *   `RangeError` is the learner's (`errored`) — this is the classifier's
 *   `iterations`-set gate and a library/test affordance. The dock caller always
 *   supplies `runLimits.iterations` (a non-optional number), so the unset case is
 *   not a live product path.
 * - `debuggerEnabled` — wrap the snippet with `debugger;` above and below
 *   (line-preserving; DOCS.md § Structural constraints). Inert without devtools.
 * - `io` — PASSED ⇒ mocked mode: the runner routes the iframe's
 *   `alert`/`confirm`/`prompt`/`console` through these callbacks. ABSENT ⇒ no
 *   mocks, fully native (real console, real devtools, real native dialogs — clean
 *   `debugger;` stepping). See {@link DangerIoMocks}.
 * - `type` — the `<script>` kind, reserved as the single literal `'script'` (a
 *   classic inline `<script>`; the default). `'module'` is deliberately NOT
 *   admitted: a `<script type=module>` is deferred/async and module-scoped, so the
 *   top-level `var loop1..loopK` counter globals and the synchronous
 *   `window.__danger` bridge would break — admitting it as an input value would be
 *   a footgun. Module mode is out of scope (DOCS.md § Out of scope) until its
 *   distinct settle path is designed.
 * - `strict` — `true` (the default) emits `"use strict";` on the assembled
 *   prefix; `false` runs sloppy (no directive). DECLARATION ONLY — impl is WP4.
 *
 * The dock's SECONDS limit is deliberately absent: it is a dock/UI concern, not
 * the engine's — this utility takes only the loop-guard `iterations` cap. See
 * README.md § Owns vs. excludes.
 */
type DangerRunOptions = Readonly<{
	iterations?: number;
	debuggerEnabled?: boolean;
	io?: DangerIoMocks;
	type?: 'script';
	strict?: boolean;
}>;

// ─── The verb (the one public entry point) ────────────────────────────────────

/**
 * Evaluate `code` as a real `<script>` in a permissive same-origin iframe and
 * report how it ended. Returns synchronously with a {@link DangerRunHandle}; the
 * script itself is injected on a later tick so `result` settles no earlier than a
 * macrotask (DOCS.md § Structural constraints). Called by the orchestrator's
 * `handleRun` when `sandboxMode === 'danger'`, with the raw editor buffer.
 */
type DangerRun = (code: string, options: DangerRunOptions) => DangerRunHandle;

export type {
	DangerOutcome,
	DangerResult,
	DangerRunHandle,
	DangerConsoleMock,
	DangerIoMocks,
	DangerRunOptions,
	DangerRun,
};
