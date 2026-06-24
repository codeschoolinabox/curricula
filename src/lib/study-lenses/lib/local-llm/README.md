# local-llm

A **device-local language-model runtime**: it brings a small LLM up on the
learner's own machine and turns a prompt into generated code, choosing the best
model the _device can actually run_. It is the generative substrate the package's
code-study tools sit on — the [aithor][aithor] generative arm injects it as its
model runtime, and future agent-lenses will too.

The runtime is **code-oriented but JeJ-agnostic**. It knows **models, devices,
and on-device inference backends**, and it knows the shape of a coding model's
reply (a fenced code block, an optional `<think>` reasoning trace). It knows
nothing of JavaScript, JeJ, the feature subset, admission, conformance, or
pedagogy. Unlike the fully domain-free sandbox [`engine/`][engine] beside it, it
_assumes its models emit code_; like the engine, it leaves what that output
**means** to its consumers. The generator returns code; it never judges it.

[aithor]: ../../embody/language-levels/just-enough-javascript/aithor/README.md
[engine]: ../engine/README.md

## Where this sits

A **peer-independent** module under [`lib/`][lib]: usable from any peer without an
upward dependency between them. [aithor][aithor] lives in `embody/`; the future
agent-lenses live in `lenses/`; both reach _down_ to this one shared runtime
rather than across to each other. Like [`engine/`][engine] it is the
stateful-resource kind of `lib/` inhabitant — it owns a live model handle and
drives I/O — rather than a pure callback adapter; unlike the engine it is
code-oriented, not fully domain-free.

The runtime is **local-only**, and four properties follow that every consumer
relies on: generation is **offline-capable** (after a model's one-time weight
fetch, no network at generation time), **account-free** (nothing to sign into),
**private** (the learner's prompt and the generated text never leave the device),
and **cost-free** (no per-call or per-token billing — only the machine's own
compute). There is no remote escape hatch; when the device can bring no model up,
the runtime **refuses** rather than reaching for a server.

[lib]: ../README.md

## Type ownership & dependency direction

This module **owns its contract and depends on no consumer.** The generic types —
the **loaded model**, the **generation result**, the **runtime adapter**, and
this module's own **load failure** — are defined here; consumers import and
**re-map** them. A consumer's own refusal vocabulary (e.g. aithor's
`no-model-available`) is a _re-mapping of_ this module's load failure, never the
other way round. The dependency arrow points **down**, from a consumer in
`embody/` or `lenses/` into this `lib/` module, never up — exactly as the sandbox
engine's `EngineHandle` is re-mapped by embody into its own `EvaluateHandle`. The
names are deliberately distinct at the seam: a **loaded model** here is _not_ a
run handle.

> **Integration note.** aithor formerly defined its own `Model` type; it now
> imports `LoadedModel` from here and re-maps this module's `LoadFailure` into its
> own `no-model-available` refusal (a returned value, not a throw). Its
> `ModelLoader` / `AithorRuntime` stay aithor-owned — a thin re-mapping over this
> module's `load`.

## Purpose

**Run the right local model well, and hand back what it produced — decomposed,
not judged.** The runtime owns two questions and nothing past them, and they fall
on either side of one internal seam:

1. **What can this device run?** — the **pure selection core**: probe the device,
   match its capabilities against the catalog, and either pick the best model for
   it or refuse because nothing fits. No I/O, no model.
2. **Given a model, run it.** — the **impure lifecycle**: bring it up once
   (fetch-once, load-once-reuse), send it a prompt, decompose the reply. The two
   impure seams (the stateful loader, the non-deterministic call) live here.

Everything about _judging_ the output — is it valid, in-subset, worth showing raw
or cleaned — belongs to the consumer. The runtime is **thorough at model
management** (picking, loading, running, decomposing) and **silent on meaning**.

## Ubiquitous language

- **Loaded model** — a model brought into memory: `generate(prompt) →
  GenerationResult`. Always local; runs on the learner's device, never a remote
  service. _Not_ a run handle (the engine/embody `*Handle` family) — a loaded
  model is a thing you call `generate` on, not a lazy run you iterate.
- **Generation result** — the model's reply, **decomposed** into its parts:
  - **`raw`** — the **byte-exact, unmodified** model output. The consumers that
    want the model's drift "as-is" (aithor's uncurated path) read this; nothing
    here mutates it.
  - **`code`** — the extracted fenced code block, or — on a fence-miss — the
    trimmed `raw`. A **best-effort, lossy parse**, never a validation: `.code`
    may be wrong (prose mistaken for code), and gating it is the consumer's job.
  - **`thinkTrace?`** — a model's `<think>` reasoning, when it emits one.
  Decomposition _separates_ the parts by model-format; it never cleans or judges.
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
  entry's load parameters into a uniform **loaded model**. One adapter per runtime
  kind, not per model. (A different sense of "adapter" than `lib/`'s shape-
  producing _callback_ adapters — this one drives a backend.)
- **Adapter map** — the host-supplied map of runtime kind → runtime adapter,
  given **at construction**. The host **registers only the runtimes it ships**; an
  entry whose runtimes are all absent from the map is simply not loadable here.
- **Device capabilities** — the result of probing the device: WebGPU presence,
  its adapter's buffer limits and advertised features (e.g. `shader-f16`), a
  coarse memory bucket, storage headroom, and the WASM features for a CPU
  fallback. A **conservative heuristic**, not an exact resource readout — the
  browser does not expose total VRAM.
- **Feasibility** — the catalog narrowed by device capabilities and the adapter
  map: which entries this device can actually bring up, and on which runtime.
- **Selection** — the optional caller preference over the feasible set (a named
  model, a size-class ceiling, a prefer-policy). Absent, the runtime picks the
  **default model**.
- **Default model** — the runtime's heuristic pick for a device: the best
  **cost-aware** rung that fits, _not_ the largest feasible one — a one-time
  download cost is weighed, and a heavier model is an explicit opt-in. The pick is
  always **reported**, so the heuristic is never a black box.
- **Size-class** (rung) — a model's place on the size/capability spectrum (tiny,
  small, mid, strong). _Not_ embody's evaluate-tiers (run / intercept / trace) —
  a different axis entirely.
- **Fetch-once, load-once-reuse** — the model lifecycle the runtime drives: a
  named model's weights are fetched once and cached on the device, then brought
  into memory on first use and reused. Concurrent loads of the same model before
  the first settles **share one in-flight bring-up** (no double-fetch). The
  network is touched only for that one-time fetch; every later load is offline.
- **Load failure** — the structured refusal when no model can be brought up: the
  device can bring nothing up, every runtime for a feasible model is unregistered,
  or a model's one-time fetch failed (or its cache was evicted while offline).
  This is the single source of truth consumers re-map (e.g. aithor's
  `no-model-available`). **Distinct from an _unknown model name_** — a name absent
  from the catalog is a programmer error and **throws**, it is not a refusal.

## What it produces (the boundary)

- **In:** a finished **prompt**, an optional **selection** (a named model or a
  preference over the feasible set), and an optional **progress** callback for the
  one-time fetch. No JeJ, no feature subset, no validation flag, no sampling
  override — those are not this runtime's vocabulary.
- **Out:** a **loaded model** whose `generate(prompt)` resolves to a
  **GenerationResult** (`raw`, `code`, `thinkTrace?`), or a **load failure** when
  the device can bring nothing up. The runtime never returns a judged, gated, or
  validated program — it returns the model's output, decomposed. Whether to use
  `.code` or `.raw` is the consumer's call.

There is **one caller entry point**, `load(selection?, onProgress?)`, obtained
from a constructed runtime (`makeLocalLlm({ adapters, catalog?, capabilityProbe? })`
— the host injects its shipped adapters once, at construction; there is no mutable
global). The which-model and which-runtime resolution is **internal** two-stage
work behind that single verb, not a second public surface. The one-time fetch
reports through `onProgress`; the load-once memory bring-up hides behind the
`await`.

## Owns vs. excludes

### Owns

- **The catalog** — the open, growing data set of candidate models with their
  cross-runtime metadata and per-runtime load parameters.
- **Device capability detection** — the conservative probe; the feasibility match
  of catalog against capabilities and the adapter map.
- **Selection** — resolving an optional preference (or none) to a single feasible
  model, cost-aware by default; or the load failure when the feasible set is
  empty.
- **The model lifecycle** — driving fetch-once / load-once-reuse (with in-flight
  dedup) through the registered adapter; _which_ runtime and _when_, against a
  browser-first preference order; progress for the one-time fetch.
- **Sampling defaults** — per-model generation defaults (temperature, token
  bounds, stop conditions). This is _running the model well_, owned here so
  consumers carry no sampling concern; there is no per-call sampling override.
- **Decomposition** — parsing a model's reply into a GenerationResult by its
  model-format. Separation only — `.raw` stays byte-exact; never validation.

### Excludes

- **Validation, conformance, gating, repair** — whether the output is valid, in a
  feature subset, or worth keeping is the **consumer's** (aithor's admission +
  `conform` + repair loop). The runtime imports no validator and reads no output.
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

Every _domain_ "can't proceed" resolves to one of two outcomes — a **load failure**
(a device/availability limit, expected) or a **throw** (a programmer error). An
infrastructure fault in the probe is a third path, noted at the end:

- **No WebGPU, but a CPU/WASM runtime is registered and a tiny model is feasible**
  → loads that rung. No-WebGPU is _not_ an automatic refusal; only an empty
  feasible set across all registered runtimes is.
- **WebGPU present but the adapter lacks a model's required feature (e.g.
  `shader-f16`)** → that model is not feasible; a feature-compatible rung loads
  instead, or an empty feasible set is a load failure. The feature gate refuses up
  front rather than failing mid-bring-up.
- **Nothing feasible on any registered runtime** → load failure.
- **A feasible model whose every runtime is absent from the adapter map** → load
  failure.
- **An unknown model name (absent from the catalog)** → **throws** — a programmer
  error, not a device limit, kept distinct so a typo never masquerades as "your
  device can't run it."
- **Concurrent `load()` of the same model before the first settles** → one shared
  in-flight bring-up; no double-fetch.
- **A first-fetch download failure** → load failure (reachable-but-failed).
- **Cache eviction while offline** → a previously-loadable model can become a load
  failure; offline-capability is **best-effort** (a durable cache and
  `navigator.storage.persist()` mitigate it, they do not guarantee it).
- **The capability probe itself rejects** (e.g. an injection or environment fault,
  not a domain refusal) → the rejection propagates unchanged from `load` and from
  `canRun` (which is the probe). It is neither a `LoadFailure` nor the unknown-name
  programmer error, so it is not collapsed into either — probe faults are the host's
  to handle.

## Design commitments

- **Local-only, four properties follow.** Offline-capable, account-free, private,
  cost-free — and no remote fallback; the load failure is the floor, not a server.
- **Code-oriented, JeJ-agnostic.** It assumes models emit code (a fenced block,
  an optional `<think>` trace) but knows nothing of the JeJ subset, admission, or
  conformance. It is _not_ engine-level domain-free; it is honestly scoped to
  coding models.
- **The catalog is data, not an enum.** Models are named by an open `string` and
  added by editing data; the set grows without a type change.
- **The runtime is injected and constructed, browser-first.** The host supplies
  only the runtime adapters it ships, at construction; selection prefers in-browser
  backends and treats desktop ones as explicit opt-ins that break no-install.
- **Capability matching is a conservative heuristic, not an exact fit.** The
  browser does not expose total VRAM; feasibility leans on adapter buffer limits
  and coarse memory buckets with a safety margin, gates a model's required WebGPU
  features (e.g. `shader-f16`) against the adapter's advertised set, and tolerates
  a load that fails by surfacing a load failure, never by promising an exactness
  the platform can't give.
- **The default is cost-aware, not maximal.** A device that _can_ run the heaviest
  model is not made to download it by default; the heavier rung is opt-in. The
  resolved model is always reported.
- **The generator returns code; it never judges it.** No validation, conformance,
  or gating crosses this boundary — the consumer judges per use-case.
- **`raw` is byte-exact; output is decomposed, never cleaned by decree.**
  `generate` separates the reply into its parts and mutates none of `raw`; which
  part is "the program" is the consumer's call, so the raw drift survives for the
  consumers that want it.
- **Generation is not reproducible.** The same prompt yields different output — a
  model is not a pure function. A caller who wants a fixed program stores the
  program, not the request.

## Testing posture

The impure surface is two seams: the **stateful loader** (a named model brought to
memory, load-once with in-flight dedup) and the **non-deterministic model call**
(loaded model → output). Everything else — capability matching, feasibility,
selection, catalog queries, load-failure-cause selection, and the whole
**decomposition** of a reply into a GenerationResult — is pure given those two
injected. The internal seam (pure selection core vs. impure lifecycle) is the test
boundary.

- **The pure selection core is unit-tested with injected fakes** — a fake
  capability probe (canned `navigator.gpu`/limits/memory) and a fake adapter map
  drive full ZOMBIES coverage with no real GPU or model. Decomposition (`raw →
  GenerationResult`, including the fence-miss fallback and byte-exact `raw`) is the
  richest pure unit here, exercised directly.
- **The load-once invariant, by construction** — a counted fake adapter asserts a
  named model is brought up once and reused, and that concurrent loads share one
  in-flight bring-up, with no real fetch.
- **The refusal invariant** — an empty feasible set (no registered runtime can fit
  anything) yields a load failure, never a thrown exception or a half-loaded
  model; an unknown model name throws.
- **Transport fidelity is real-only** — like [`engine/`][engine], a green fake is
  evidence for logic, never for a backend's real fetch/cache/run behavior; that is
  checked against the real runtime on a real device.

## Navigation

- Parent: [`../README.md`](../README.md) — the package-level shared `lib/` (what
  belongs here; peer-independence).
- Sibling exemplar: [`../engine/README.md`](../engine/README.md) — the generic
  sandboxed evaluator; the other stateful `lib/` resource and the dependency-
  direction template (own your contract; consumers re-map).
- Primary consumer: [`aithor`][aithor] — the JeJ generative arm that injects this
  as its model runtime.
- Future consumer: [`../../lenses/agent-lenses.concept.md`](../../lenses/agent-lenses.concept.md)
  — agent-lenses, which name this runtime as a prerequisite. (That note calls it
  `llm-client`; this module is the same thing, **renamed `local-llm`** to encode
  the local-only invariant — "client" wrongly implies a remote service.)
- [`./DOCS.md`](./DOCS.md) — this module's architecture sketch.
- [`./types.ts`](./types.ts) — the contract in TypeScript (the catalog, the
  per-runtime load union, the loaded model and GenerationResult, the load failure).
