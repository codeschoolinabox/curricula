# local-llm

A **device-local language-model runtime**: it brings a small LLM up on the
learner's own machine and turns a prompt into generated code, choosing the best
model the _device can actually run_. It is the generative substrate the
package's code-study tools sit on — the [aithor][aithor] generative arm injects
it as its model runtime, and future agent-lenses will too.

The runtime is **code-oriented but JeJ-agnostic**. It knows **models, devices,
and on-device inference backends**, and it knows the shape of a coding model's
reply (a fenced code block, an optional `<think>` reasoning trace). It knows
nothing of JavaScript, JeJ, the feature subset, admission, conformance, or
pedagogy. Unlike the fully domain-free sandbox [`engine/`][engine] beside it, it
_assumes its models emit code_; like the engine, it leaves what that output
**means** to its consumers. The generator returns code; it never judges it.

<!-- prettier-ignore -->
[aithor]: ../../../embody/language-levels/just-enough-javascript/aithor/README.md
[engine]: ../engine/README.md

## Where this sits

A **peer-independent** module under [`lib/`][lib]: usable from any peer without
an upward dependency between them. [aithor][aithor] lives in `embody/`; the
future agent-lenses live in `lenses/`; both reach _down_ to this one shared
runtime rather than across to each other. Like [`engine/`][engine] it is the
stateful-resource kind of `lib/` inhabitant — it owns a live model handle and
drives I/O — rather than a pure callback adapter; unlike the engine it is
code-oriented, not fully domain-free.

The runtime is **local-only**, and four properties follow that every consumer
relies on: generation is **offline-capable** (after a model's one-time weight
fetch, no network at generation time), **account-free** (nothing to sign into),
**private** (the learner's prompt and the generated text never leave the
device), and **cost-free** (no per-call or per-token billing — only the
machine's own compute). There is no remote escape hatch; when the device can
bring no model up, the runtime **refuses** rather than reaching for a server.

[lib]: ../README.md

## Type ownership & dependency direction

This module **owns its contract and depends on no consumer.** The generic types
— the **loaded model**, the **generation outcome** (its result and failure
halves), the **runtime adapter**, and this module's own **load failure** — are
defined here; consumers import and **re-map** them. A consumer's own refusal
vocabulary (e.g. aithor's `no-model-available`) is a _re-mapping of_ this
module's load failure, never the other way round. One spelling converges by
design: `unknown-model`, which aithor already speaks consumer-side, is now
produced here as a load-failure cause — a consumer re-maps it or adopts the
spelling verbatim; the arrow's direction is unchanged. The dependency arrow
points **down**, from a consumer in `embody/` or `lenses/` into this `lib/`
module, never up — exactly as the sandbox engine's `EngineHandle` is re-mapped
by embody into its own `EvaluateHandle`. The names are deliberately distinct at
the seam: a **loaded model** here is _not_ a run handle.

> **Integration note.** aithor formerly defined its own `Model` type; it now
> imports `LoadedModel` from here and re-maps this module's `LoadFailure` into
> its own `no-model-available` refusal (a returned value, not a throw). Its
> `ModelLoader` / `AithorRuntime` stay aithor-owned — a thin re-mapping over
> this module's `load`.

## Purpose

**Run the right local model well, and hand back what it produced — decomposed,
not judged.** The runtime owns two questions and nothing past them, and they
fall on either side of one internal seam:

1. **What can this device run?** — the **pure selection core**: probe the
   device, match its capabilities against the catalog, and either pick the best
   model for it or refuse because nothing fits. No I/O, no model.
2. **Given a model, run it.** — the **impure lifecycle**: bring it up once
   (fetch-once, load-once-reuse), send it a prompt (cancellable per call),
   decompose the reply. The two impure seams (the stateful loader, the
   non-deterministic call) live here.

Everything about _judging_ the output — is it valid, in-subset, worth showing
raw or cleaned — belongs to the consumer. The runtime is **thorough at model
management** (picking, loading, running, decomposing) and **silent on meaning**.

## Ubiquitous language

- **Loaded model** — a model brought into memory:
  `generate(prompt, { signal? }) → generation outcome`. Always local; runs on
  the learner's device, never a remote service. A loaded model is **shared**:
  every caller that resolves the same catalog id on one constructed runtime
  receives the same instance, so **one generation runs at a time per loaded
  model** (human ruling 2026-08-26) binds across all holders, not per holder — a
  bound no single holder can keep alone, which is why the queue that would lift
  it is a recorded obligation; until it exists, serializing is the consumer
  side's. See the refusal map's concurrent-generate row. _Not_ a run handle (the
  engine/embody `*Handle` family) — a loaded model is a thing you call
  `generate` on, not a lazy run you iterate.
- **Generation outcome** — what one `generate` call resolves to, always a value:
  the **generation result** on success, or a **generation failure** naming why
  that one call produced nothing (human ruling 2026-08-26). `ok` is the
  discriminant — true exactly on the result. One call, one outcome — there is no
  generation-time descent, no attempts ledger, no retry; a repair loop is the
  consumer's. _Not_ the region's `*Outcome` string unions (the engine's
  `SettlementOutcome`, the evaluators' `EvaluationOutcome`), which name how a
  run ended — here the outcome is the whole returned value, and the failure
  causes are the analogue of those names.
- **Generation result** — the model's reply on success, **decomposed** into its
  parts:
  - **`raw`** — the **byte-exact, unmodified** model output. The consumers that
    want the model's drift "as-is" (aithor's uncurated path) read this; nothing
    here mutates it.
  - **`code`** — the extracted fenced code block, or — on a fence-miss — the
    trimmed `raw`. A **best-effort, lossy parse**, never a validation: `.code`
    may be wrong (prose mistaken for code), and gating it is the consumer's job.
  - **`thinkTrace?`** — a model's `<think>` reasoning, when it emits one.
    Decomposition _separates_ the parts by model-format; it never cleans or
    judges.
- **Generation failure** — the typed refusal of one generation: **`aborted`**
  (the call's own signal fired — deliberately bare, no `detail`; the aborter
  already knows why), **`device-lost`** (the GPU dropped mid-generation — named
  honestly, never recovered), or **`generation-failed`** (any other backend
  fault), the latter two with an optional diagnostic `detail`. A value, never a
  rejection. Two naming notes: `device-lost` also appears load-side, same
  spelling, as a per-candidate cause inside a load failure's diagnostic
  `attempts` ledger — visible there, but never a terminal load cause (the chain
  folds it into `all-candidates-exhausted`); it is a consumer-facing cause only
  at generation time. And the undiscriminated cause here is `generation-failed`,
  not the load ledger's `unknown` — consumer-facing generation causes name the
  failed act; `unknown` belongs to the diagnostic vocabulary.
- **Cancellation** — the per-call `AbortSignal` `generate` accepts. Aborting
  settles that one call with the `aborted` failure and **leaves the loaded model
  usable** — the next `generate` proceeds normally, whatever the signal's
  timing. The abort reason is not echoed — `aborted` is deliberately reason-free
  — and the spelling is deliberate too: `aborted` is the `AbortSignal`'s own
  word, kept verbatim at this seam, where the region's stop vocabulary elsewhere
  says `cancel`/`cancelled`. Cancellation reaches the generation only: the
  load-time descent takes no signal, and cancelling never frees an in-flight
  weight fetch (the backend offers no lever).
- **Catalog** — the static, **open, growing set** of candidate models, held as
  **data, not an enum** so the set is never foreclosed. Each **catalog entry**
  carries cross-runtime metadata (family, params, license, size-class,
  code-specialism) and, per runtime that can load it, the runtime-specific load
  parameters.
- **Runtime kind** — an on-device inference backend a model can run on (WebLLM,
  transformers.js, wllama, …). The kinds differ in _how_ a model is named and
  loaded; that divergence is what the catalog's per-runtime load parameters
  capture.
- **Runtime adapter** — a per-runtime-kind backend driver that turns a catalog
  entry's load parameters into a uniform **loaded model**. One adapter per
  runtime kind, not per model. The loaded model a consumer receives is the
  module's own, wrapping the adapter's: the module settles an already-aborted
  call before the adapter is ever engaged, and classifies a domain fault the
  adapter lets escape into the failure vocabulary — the generation-side sibling
  of the load chain's own error classification. For every call that does reach
  it, an adapter — shipped or host-injected — owes: resolve the decomposed reply
  (byte-exact `raw`, lossy `code`, `thinkTrace` when the model emits one); honor
  the per-call signal as soon as its backend allows; an abort ends only that
  call — surfacing as the `aborted` outcome the wrapper constructs; the model
  stays usable at **any** abort timing. (A different sense of "adapter" than
  `lib/`'s shape- producing _callback_ adapters — this one drives a backend.)
- **Adapter map** — the host-supplied map of runtime kind → runtime adapter,
  given **at construction**. The host **registers only the runtimes it ships**;
  an entry whose runtimes are all absent from the map is simply not loadable
  here.
- **Device capabilities** — the result of probing the device: WebGPU presence,
  its adapter's advertised features (e.g. `shader-f16`), a coarse system-RAM
  bucket, storage headroom, and the WASM features for a CPU fallback. The probed
  WebGPU buffer limits are also captured, but **as diagnostics** — they inform
  what is shown, not what is refused. A **conservative heuristic**, not an exact
  resource readout — the browser does not expose total VRAM.
- **Feasibility** — the catalog narrowed by device capabilities and the adapter
  map: which entries this device can actually bring up, and on which runtime.
- **Selection** — the optional caller preference over the feasible set (a named
  model, a size-class ceiling, a prefer-policy). Absent, the runtime picks the
  **default model**.
- **Default model** — the runtime's heuristic pick for a device: the best
  **cost-aware** rung that fits, _not_ the largest feasible one — a one-time
  download cost is weighed, and a heavier model is an explicit opt-in. The pick
  is always **reported**, so the heuristic is never a black box.
- **Size-class** (rung) — a model's place on the size/capability spectrum (tiny,
  small, mid, strong). _Not_ embody's evaluate-tiers (run / intercept / trace) —
  a different axis entirely.
- **Fetch-once, load-once-reuse** — the model lifecycle the runtime drives: a
  named model's weights are fetched once and cached on the device, then brought
  into memory on first use and reused. Concurrent loads of the same model before
  the first settles **share one in-flight bring-up** (no double-fetch); a
  **failed** bring-up is not kept — a later `load` re-attempts it. The network
  is touched only for that one-time fetch; every later load is offline.
- **Fallback chain** — the ordered descent of feasible `(model, runtime)`
  **candidates** that `load` tries: the cost-aware default, then smaller, then a
  switch to a CPU/WASM runtime. The descent is **silent and honest** — the
  learner never opts in, and the candidate that actually loads is named in
  `resolvedId`. A candidate's failure is intermediate; the chain refuses only
  when every candidate is exhausted.
- **Candidate** — one `(model, runtime)` step of the fallback chain. Distinct
  from a **size-class** (rung): a model is one size-rung, but it may appear as
  two candidates (e.g. a WebGPU build and a CPU/WASM build of the same family),
  each its own catalog entry with its own id.
- **Load failure** — the structured refusal when no model can be brought up. It
  names a **delivery-agnostic cause** (this module never names a product):
  either a **pre-flight** cause the chain never ran for — `no-feasible-model`
  (the device can run nothing — surfaceable before any bring-up) or
  `unknown-model` (the requested name is absent from the catalog; **its own
  cause, kept distinct so a typo never masquerades as "your device can't run
  it"** — a returned refusal, no longer a throw, human ruling 2026-08-26) — or a
  **post-flight** terminal cause after the chain was tried
  (`all-candidates-exhausted`, `fetch-failed`, `storage-quota`, or
  `cache-evicted`), the latter carrying a diagnostic per-candidate `attempts`
  ledger. This is the single source of truth consumers re-map (e.g. aithor's
  `no-model-available`) and the signal a consumer turns into a next step — incl.
  recommending a native app.
- **Terminal refusal** — a `LoadFailure` whose cause means there is no
  in-browser path left (`no-feasible-model` / `all-candidates-exhausted`). It is
  itself the consumer's cue to recommend a native runtime; this module names the
  cause, never the product.

## What it produces (the boundary)

- **In:** a finished **prompt**, an optional **selection** (a named model or a
  preference over the feasible set), an optional **progress** callback for the
  one-time fetch, and — per `generate` call — an optional **`AbortSignal`**. No
  JeJ, no feature subset, no validation flag, no sampling override — those are
  not this runtime's vocabulary.
- **Out:** a **loaded model** whose `generate(prompt, { signal? })` resolves to
  a **generation outcome** — on success the decomposed **generation result**
  (`raw`, `code`, `thinkTrace?`), on failure a typed **generation failure**
  (`aborted` · `device-lost` · `generation-failed`) — or a **load failure** when
  the device can bring nothing up. The runtime never returns a judged, gated, or
  validated program — it returns the model's output, decomposed. Whether to use
  `.code` or `.raw` is the consumer's call.

There is **one caller entry point**, `load(selection?, onProgress?)`, obtained
from a constructed runtime
(`makeLocalLlm({ adapters, catalog?, capabilityProbe? })` — the host injects its
shipped adapters once, at construction; there is no mutable global). The
which-model and which-runtime resolution is **internal** two-stage work behind
that single verb, not a second public surface. The one-time fetch reports
through `onProgress`; the load-once memory bring-up hides behind the `await`.

## Owns vs. excludes

### Owns

- **The catalog** — the open, growing data set of candidate models with their
  cross-runtime metadata and per-runtime load parameters.
- **Device capability detection** — the conservative probe; the feasibility
  match of catalog against capabilities and the adapter map.
- **Selection** — resolving an optional preference (or none) to a single
  feasible model, cost-aware by default; or the load failure when the feasible
  set is empty.
- **The model lifecycle** — driving fetch-once / load-once-reuse (with in-flight
  dedup) through the registered adapter; _which_ runtime and _when_, against a
  browser-first preference order; progress for the one-time fetch.
- **Sampling defaults** — per-model generation defaults (temperature, token
  bounds, stop conditions). This is _running the model well_, owned here so
  consumers carry no sampling concern; there is no per-call sampling override.
- **The generation outcome vocabulary & abort semantics** — the typed per-call
  outcome (the result, or `aborted` · `device-lost` · `generation-failed`), the
  per-call `AbortSignal` parameter, and the usable-after-abort guarantee **as
  made to consumers** (human ruling 2026-08-26). The behavior behind that
  guarantee is every runtime adapter's to keep — the adapter's obligations are
  in the glossary.
- **Decomposition** — parsing a model's reply into a GenerationResult by its
  model-format. Separation only — `.raw` stays byte-exact; never validation.

### Excludes

- **Validation, conformance, gating, repair** — whether the output is valid, in
  a feature subset, or worth keeping is the **consumer's** (aithor's admission +
  `conform` + repair loop). The runtime imports no validator and reads no
  output.
- **Selecting which GenerationResult part to use** — `code` vs `raw` is a
  use-case choice (curated vs. raw-drift), the consumer's, not the runtime's.
- **Prompt construction** — assembling the ask, the seed, the constraints into a
  prompt is the consumer's; the runtime receives a finished prompt.
- **The inference mechanism** — how a runtime fetches, caches, and executes a
  model is the third-party backend's; this module names _which_ model and drives
  _when_ its lifecycle runs, not the math.
- **JeJ, the language level, pedagogy** — the runtime is JeJ-agnostic; once text
  exists it is an ordinary string the consumer interprets.
- **Outward streaming** — `generate` answers once, with a complete outcome; no
  token stream or iterator crosses this boundary (human ruling 2026-08-26 — no
  consumer asks for one, and a complete-candidate gate sits downstream). The
  adapter may consume a backend's streaming interface internally; none of it is
  surfaced.
- **Generation queueing / per-caller identity** — one generation at a time per
  loaded model is the documented contract; a queue with per-caller cancel
  identity is owed by whichever campaign introduces a second concurrent
  consumer, not by this one.
- **Releasing a loaded model** — nothing unloads it; a model brought up lives
  for the session, and later loads reuse it. A release verb is deferred to the
  campaign that first needs one.

## Edge cases (the refusal map)

Every _domain_ "can't proceed" resolves to a **returned value** — a **load
failure** at load time, a **generation failure** at generation time; the only
rejections left are genuine infrastructure faults, which no contract can promise
away (human ruling 2026-08-26: two channels — values for domain outcomes,
rejections for infrastructure). A load failure ends a **fallback chain**: `load`
descends the feasible candidates, and a single candidate's failure is
_intermediate_ — the chain records it and tries the next. The failure is
returned only when the chain is exhausted (or was empty). An infrastructure
fault in the probe is the rejection path, noted at the end:

- **No WebGPU, but a CPU/WASM runtime is registered and a tiny model is
  feasible** → loads that rung. No-WebGPU is _not_ an automatic refusal; only an
  empty feasible set across all registered runtimes is.
- **WebGPU present but the adapter lacks a model's required feature (e.g.
  `shader-f16`)** → that model is not feasible; a feature-compatible rung loads
  instead, or an empty feasible set is a load failure. The feature gate refuses
  up front rather than failing mid-bring-up.
- **A binding-limited WebGPU device whose advertised features + memory budget
  otherwise fit** (e.g. Firefox/Android at the 128 MiB floor) → **not**
  pre-refused; there is no honest pre-flight buffer gate, so its WebGPU
  candidate enters the chain, and if it fails bring-up the chain descends to a
  smaller candidate or a CPU/WASM runtime — only an exhausted chain refuses,
  with a **post-flight** cause. (Unlike the feature-gate row above, which _does_
  refuse up front: a missing advertised feature is known pre-flight.)
- **Nothing feasible on any registered runtime** → load failure, cause
  `no-feasible-model` (**pre-flight** — surfaceable before any bring-up, so a
  pre-flight gate can disable the feature with an accurate note).
- **A feasible model whose every runtime is absent from the adapter map** → load
  failure (`no-feasible-model`).
- **An unknown model name (absent from the catalog)** → load failure, cause
  `unknown-model` (**pre-flight** — the chain never runs, no attempts). Its own
  cause, kept distinct from every device limit so a typo never masquerades as
  "your device can't run it" (human ruling 2026-08-26: a returned refusal, no
  longer a throw — so no consumer needs a catalog pre-check to dodge it).
- **An empty model name (`{ model: '' }`)** → treated as no selection — the
  pick-for-me default proceeds; only a **non-empty** name absent from the
  catalog is `unknown-model`.
- **Concurrent `load()` of the same selection before the first settles** → one
  shared in-flight bring-up per candidate; the chain is deterministic, so
  concurrent identical loads converge on the same winner (no double-fetch, no
  divergence).
- **The cost-aware default fails bring-up but a smaller / CPU-WASM candidate
  works** → the chain descends silently and loads it; the resolved candidate is
  named in `resolvedId`.
- **Every feasible candidate fails bring-up** → load failure, with a
  **post-flight** terminal cause promoted from the per-candidate `attempts`
  ledger: `all-candidates-exhausted` (mixed/device failures), `fetch-failed`
  (all network), `storage-quota` (weights can't be cached — free disk space), or
  `cache-evicted` (a cached candidate evicted offline — reconnect, or a native
  runtime for durable offline). `all-candidates-exhausted` and
  `no-feasible-model` are themselves the consumer's cue to recommend a native
  app.
- **A named model that is feasible only on a runtime this device lacks** (e.g. a
  WebGPU build named on a no-WebGPU device) → `no-feasible-model`, **no
  descent** — pinning is artifact-precise. The same model _family_ may still run
  via a sibling catalog entry (a CPU/WASM build); `feasibleModels()` lists the
  runnable sibling, so to run the family on whatever works, name that sibling or
  use the default pick.
- **Cache eviction while offline** → a previously-loadable candidate becomes
  `cache-evicted`; offline-capability is **best-effort** (a durable cache and
  `navigator.storage.persist()` mitigate it, they do not guarantee it).
- **`generate` called with a signal already aborted** → the call settles with
  the `aborted` failure and the backend is never asked — no generation starts,
  nothing to interrupt.
- **`generate` aborted mid-flight (its per-call signal fires)** → that one call
  settles with the `aborted` generation failure — a value, never a rejection;
  any partial text is discarded, and **the loaded model stays usable**: the next
  `generate` proceeds normally.
- **A signal aborted late — after its call already settled** → nothing: the
  settled outcome stands and no later call is affected. The usable-after-abort
  guarantee covers aborts at **any** time — already aborted at call time,
  mid-flight, or after settlement — a guarantee this module must supply because
  no backend is trusted to give it for free.
- **The model call itself fails mid-generation** → the `generation-failed`
  failure — or `device-lost` when the GPU dropped — as a value. There is no
  generation-time re-descent and no device-loss recovery (both out of scope);
  after a `device-lost` the loaded model may be unusable — only `aborted`
  carries the usable-after guarantee.
- **Concurrent `generate` calls on one loaded model** → outside the contract:
  **one generation runs at a time per loaded model** (human ruling 2026-08-26).
  Under the contract a cancel always names the only generation there is; a
  second in-flight caller's cancel has no honorable meaning. (The one adapter
  shipped in this tree drives a backend that serializes per model internally;
  the bound stands on the contract, not on any backend.) A consumer needing
  concurrency needs the queue-with-identity this module deliberately does not
  own.
- **The capability probe itself rejects** (an injection or environment fault,
  not a domain refusal) → the rejection propagates unchanged from `load` and
  from `canRun` (which is the probe). It is not a `LoadFailure` of any cause —
  no cause, no attempts; the distinction is the two channels themselves (domain
  refusals return, infrastructure rejects). Probe faults are the host's to
  handle.

## Design commitments

- **Local-only, four properties follow.** Offline-capable, account-free,
  private, cost-free — and no remote fallback; the load failure is the floor,
  not a server.
- **Fallback is a chain, not a guarantee.** `load` tries feasible candidates in
  a cost-aware descent (smaller, then a CPU/WASM runtime) before refusing, so a
  device is rescued where one would have failed — but a device can have zero
  feasible candidates, and the chain then honestly refuses. The descent is
  silent; honesty lives in `resolvedId`, never in a learner opt-in.
- **Failure causes are delivery-agnostic.** A load or generation failure names a
  typed device or availability cause and **never a product or a "download the
  app" string**. The consumer owns the cause→guidance mapping — incl.
  recommending a native runtime, and incl. aithor's cause→next-step derivation,
  which stays consumer-side (human ruling 2026-08-26, reaffirming this
  boundary); this keeps the local-only / no-server-hatch invariant intact.
- **Code-oriented, JeJ-agnostic.** It assumes models emit code (a fenced block,
  an optional `<think>` trace) but knows nothing of the JeJ subset, admission,
  or conformance. It is _not_ engine-level domain-free; it is honestly scoped to
  coding models.
- **The catalog is data, not an enum.** Models are named by an open `string` and
  added by editing data; the set grows without a type change.
- **The runtime is injected and constructed, browser-first.** The host supplies
  only the runtime adapters it ships, at construction; selection prefers
  in-browser backends and treats desktop ones as explicit opt-ins that break
  no-install.
- **Capability matching is a conservative, coarse admission filter — not an
  exact fit.** The browser exposes no total VRAM, so webllm feasibility leans on
  three coarse signals: WebGPU **presence** (a hard gate), the WebGPU features a
  model **advertises** when WebLLM lists them (a _partial_ gate — many q4f16
  builds list none, so it catches some incompatible devices, not all), and a
  **system-RAM** budget (`navigator.deviceMemory`, not a VRAM readout) with a
  safety margin. It deliberately does **not** pre-gate on the probed buffer
  limits — there is no binding per-model buffer requirement, and the platform
  itself tries-then-falls-back rather than refusing. So feasibility is an
  _admission filter_ and the **fallback chain is the real backstop**: a device
  the filter admits but that can't actually bring a model up (binding-limited,
  small shared VRAM) is caught at bring-up and descended, never pre-refused on a
  fabricated threshold. The buffer limits are surfaced as **diagnostics**. The
  matcher tolerates a load that fails by surfacing a load failure, never by
  promising an exactness the platform can't give.
- **The default is cost-aware, not maximal.** A device that _can_ run the
  heaviest model is not made to download it by default; the heavier rung is
  opt-in. The resolved model is always reported.
- **Domain failure is a value on both verbs; rejections are reserved for
  infrastructure** (human ruling 2026-08-26). `load` returns its load failure
  (`unknown-model` included); `generate` returns its generation failure
  (`aborted` included). What still rejects — a broken capability probe, a
  backend defect — is an infrastructure fault no contract can promise away.
- **An abort leaves the loaded model usable.** A per-call signal aborted at
  **any** time — already aborted at call time, mid-generation, or after its call
  settled — forestalls or ends that one call and taints nothing: the next
  `generate` proceeds normally. This is a stated commitment precisely because no
  backend is trusted to give it for free.
- **Cancelling never frees a download.** The load-time descent takes no signal
  and an in-flight weight fetch cannot be aborted (the backend offers no lever);
  cancellation is a generation-time affordance only. A consumer must never
  promise a learner otherwise.
- **One generation at a time per loaded model** (human ruling 2026-08-26). The
  documented ownership constraint — see the refusal map's concurrent-generate
  row; the queue that would lift it belongs to the campaign that first needs it.
- **`generate` answers once — no outward stream** (human ruling 2026-08-26). The
  complete outcome is the whole answer; the adapter may consume a backend's
  streaming interface internally, and none of it crosses this boundary.
- **The generator returns code; it never judges it.** No validation,
  conformance, or gating crosses this boundary — the consumer judges per
  use-case.
- **`raw` is byte-exact; output is decomposed, never cleaned by decree.**
  `generate` separates the reply into its parts and mutates none of `raw`; which
  part is "the program" is the consumer's call, so the raw drift survives for
  the consumers that want it.
- **Generation is not reproducible.** The same prompt yields different output —
  a model is not a pure function. A caller who wants a fixed program stores the
  program, not the request.

## Testing posture

The impure surface is two seams: the **stateful loader** (a named model brought
to memory, load-once with in-flight dedup) and the **non-deterministic model
call** (loaded model → outcome, cancellable per call). Everything else —
capability matching, feasibility, selection, catalog queries, load-failure-cause
selection, and the whole **decomposition** of a reply into a GenerationResult —
is pure given those two injected. The internal seam (pure selection core vs.
impure lifecycle) is the test boundary.

- **The pure selection core is unit-tested with injected fakes** — a fake
  capability probe (canned `navigator.gpu`/limits/memory) and a fake adapter map
  drive full ZOMBIES coverage with no real GPU or model. Decomposition
  (`raw → GenerationResult`, including the fence-miss fallback and byte-exact
  `raw`) is the richest pure unit here, exercised directly.
- **The load-once invariant, by construction** — a counted fake adapter asserts
  a named model is brought up once and reused, and that concurrent loads share
  one in-flight bring-up, with no real fetch.
- **The refusal invariant** — an empty feasible set (no registered runtime can
  fit anything) yields a load failure, never a thrown exception or a half-loaded
  model; an unknown model name yields its own pre-flight load failure, likewise
  never a throw.
- **The generation outcome & abort cluster, by injected fake** — a fake adapter
  drives the outcome union: success decomposition, the `aborted` value on a
  mid-flight signal, the pre-aborted call settling `aborted` with the fake never
  engaged, the late-abort no-op, and usable-after-abort at the core's level —
  the core neither marks a model dead nor blocks the next `generate` after an
  abort. A green fake is evidence for logic only; the guarantee proper — the
  real backend's cooperative interrupt and its flag hygiene — is browser-lane,
  real-device evidence.
- **Transport fidelity is real-only** — like [`engine/`][engine], a green fake
  is evidence for logic, never for a backend's real fetch/cache/run behavior;
  that is checked against the real runtime on a real device.

## Navigation

- Parent: [`../README.md`](../README.md) — the package-level shared `lib/` (what
  belongs here; peer-independence).
- Sibling exemplar: [`../engine/README.md`](../engine/README.md) — the generic
  sandboxed evaluator; the other stateful `lib/` resource and the dependency-
  direction template (own your contract; consumers re-map).
- Primary consumer: [`aithor`][aithor] — the JeJ generative arm that injects
  this as its model runtime.
- Future consumer:
  [`../../lenses/agent-lenses.concept.md`](../../lenses/agent-lenses.concept.md)
  — agent-lenses, which name this runtime as a prerequisite. (That note calls it
  `llm-client`; this module is the same thing, **renamed `local-llm`** to encode
  the local-only invariant — "client" wrongly implies a remote service.)
- [`./DOCS.md`](./DOCS.md) — this module's architecture sketch.
- [`./notional-machine.md`](./notional-machine.md) — the machine twin: the
  operational model a holder predicts against (the descent, the load-once cache,
  the generation/abort machine).
- [`./types.ts`](./types.ts) — the contract in TypeScript (the catalog, the
  per-runtime load union, the loaded model and its generation outcome, the load
  failure).
