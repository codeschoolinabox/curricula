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
— the **loaded model**, the **generation result**, the **runtime adapter**, and
this module's own **load failure** — are defined here; consumers import and
**re-map** them. A consumer's own refusal vocabulary (e.g. aithor's
`no-model-available`) is a _re-mapping of_ this module's load failure, never the
other way round. The dependency arrow points **down**, from a consumer in
`embody/` or `lenses/` into this `lib/` module, never up — exactly as the
sandbox engine's `EngineHandle` is re-mapped by embody into its own
`EvaluateHandle`. The names are deliberately distinct at the seam: a **loaded
model** here is _not_ a run handle.

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
   (fetch-once, load-once-reuse), send it a prompt, decompose the reply. The two
   impure seams (the stateful loader, the non-deterministic call) live here.

Everything about _judging_ the output — is it valid, in-subset, worth showing
raw or cleaned — belongs to the consumer. The runtime is **thorough at model
management** (picking, loading, running, decomposing) and **silent on meaning**.

## Ubiquitous language

- **Loaded model** — a model brought into memory:
  `generate(prompt) → GenerationResult`. Always local; runs on the learner's
  device, never a remote service. _Not_ a run handle (the engine/embody
  `*Handle` family) — a loaded model is a thing you call `generate` on, not a
  lazy run you iterate.
- **Generation result** — the model's reply, **decomposed** into its parts:
  - **`raw`** — the **byte-exact, unmodified** model output. The consumers that
    want the model's drift "as-is" (aithor's uncurated path) read this; nothing
    here mutates it.
  - **`code`** — the extracted fenced code block, or — on a fence-miss — the
    trimmed `raw`. A **best-effort, lossy parse**, never a validation: `.code`
    may be wrong (prose mistaken for code), and gating it is the consumer's job.
  - **`thinkTrace?`** — a model's `<think>` reasoning, when it emits one.
    Decomposition _separates_ the parts by model-format; it never cleans or
    judges.
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
  runtime kind, not per model. (A different sense of "adapter" than `lib/`'s
  shape- producing _callback_ adapters — this one drives a backend.)
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
  the first settles **share one in-flight bring-up** (no double-fetch). The
  network is touched only for that one-time fetch; every later load is offline.
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
  either a **pre-flight** `no-feasible-model` (the device can run nothing —
  surfaceable before any bring-up) or a **post-flight** terminal cause after the
  chain was tried (`all-candidates-exhausted`, `fetch-failed`, `storage-quota`,
  or `cache-evicted`), the latter carrying a diagnostic per-candidate `attempts`
  ledger. This is the single source of truth consumers re-map (e.g. aithor's
  `no-model-available`) and the signal a consumer turns into a next step — incl.
  recommending a native app. **Distinct from an _unknown model name_** — a name
  absent from the catalog is a programmer error and **throws**, it is not a
  refusal.
- **Terminal refusal** — a `LoadFailure` whose cause means there is no
  in-browser path left (`no-feasible-model` / `all-candidates-exhausted`). It is
  itself the consumer's cue to recommend a native runtime; this module names the
  cause, never the product.

## What it produces (the boundary)

- **In:** a finished **prompt**, an optional **selection** (a named model or a
  preference over the feasible set), and an optional **progress** callback for
  the one-time fetch. No JeJ, no feature subset, no validation flag, no sampling
  override — those are not this runtime's vocabulary.
- **Out:** a **loaded model** whose `generate(prompt)` resolves to a
  **GenerationResult** (`raw`, `code`, `thinkTrace?`), or a **load failure**
  when the device can bring nothing up. The runtime never returns a judged,
  gated, or validated program — it returns the model's output, decomposed.
  Whether to use `.code` or `.raw` is the consumer's call.

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

## Edge cases (the refusal map)

Every _domain_ "can't proceed" resolves to a **load failure** (a
device/availability limit, expected) or a **throw** (a programmer error). A load
failure ends a **fallback chain**: `load` descends the feasible candidates, and
a single candidate's failure is _intermediate_ — the chain records it and tries
the next. The failure is returned only when the chain is exhausted (or was
empty). An infrastructure fault in the probe is a third path, noted at the end:

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
- **An unknown model name (absent from the catalog)** → **throws** — a
  programmer error, not a device limit, kept distinct so a typo never
  masquerades as "your device can't run it."
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
- **The capability probe itself rejects** (e.g. an injection or environment
  fault, not a domain refusal) → the rejection propagates unchanged from `load`
  and from `canRun` (which is the probe). It is neither a `LoadFailure` nor the
  unknown-name programmer error, so it is not collapsed into either — probe
  faults are the host's to handle.

## Design commitments

- **Local-only, four properties follow.** Offline-capable, account-free,
  private, cost-free — and no remote fallback; the load failure is the floor,
  not a server.
- **Fallback is a chain, not a guarantee.** `load` tries feasible candidates in
  a cost-aware descent (smaller, then a CPU/WASM runtime) before refusing, so a
  device is rescued where one would have failed — but a device can have zero
  feasible candidates, and the chain then honestly refuses. The descent is
  silent; honesty lives in `resolvedId`, never in a learner opt-in.
- **Failure causes are delivery-agnostic.** A `LoadFailure` names a typed device
  or availability cause and **never a product or a "download the app" string**.
  The consumer owns the cause→guidance mapping (incl. recommending a native
  runtime); this keeps the local-only / no-server-hatch invariant intact.
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
call** (loaded model → output). Everything else — capability matching,
feasibility, selection, catalog queries, load-failure-cause selection, and the
whole **decomposition** of a reply into a GenerationResult — is pure given those
two injected. The internal seam (pure selection core vs. impure lifecycle) is
the test boundary.

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
  model; an unknown model name throws.
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
  [`../../../study-lenses--deprecated-architecture/lenses/agent-lenses.concept.md`](../../../study-lenses--deprecated-architecture/lenses/agent-lenses.concept.md)
  — agent-lenses, which name this runtime as a prerequisite. (That note calls it
  `llm-client`; this module is the same thing, **renamed `local-llm`** to encode
  the local-only invariant — "client" wrongly implies a remote service.)
- [`./DOCS.md`](./DOCS.md) — this module's architecture sketch.
- [`./types.ts`](./types.ts) — the contract in TypeScript (the catalog, the
  per-runtime load union, the loaded model and GenerationResult, the load
  failure).
