# evaluators

The generator kind of study utility. An evaluator executes a program and emits
events — it is **headless**: consumed by lenses, never rendered, owning no view
of its own. Running code is studying it, and evaluators are the machinery that
makes a run observable: what the program printed, what it asked, how it ended.

The package [README](../README.md) owns what evaluator, refusal-as-data, and the
four audiences mean; this document owns the kind contract's mechanics.

## What lives here

```text
evaluators/
  README.md       this file — the kind's mechanics + navigation
  DOCS.md         the region's architectural sketch
  types.ts        the evaluator-kind contract
  run/            the baseline evaluator
  intercept/      run + the program's own I/O as events
  tracers/        the introspective family — one sub-directory per tracer
  danger/         the real-window evaluator
```

## The kind contract

An evaluator declares the envelope's universal fields — a name and an
applicability — plus the generator kind's main. Its applicability runs over the
same domain its main serves: the **evaluation spec**, never the Facts — the
evaluator kind stands parallel to the lens kind, with its own input domain and
no dependency on any other region's types.

- **name** — a stable label. The object itself is the evaluator's identity:
  consumers import it directly, and a consumer that keys an options list by name
  owns that collection's uniqueness.
- **applicability** — pure and synchronous over the spec: "can this evaluator
  run this program, posed this way?"
- **main** — given the spec, returns the **evaluation event stream** — events to
  pull, plus a companion settlement promise — or a structured refusal, never a
  throw. Nothing executes until the consumer starts pulling.

The shape, compactly (the full contract with its doc-comments is
[`types.ts`](./types.ts)):

```ts
type Evaluator = {
	name: string;
	applicability: (spec: EvaluationSpec) => boolean;
	main: (spec: EvaluationSpec) => EvaluationStream | EvaluatorRefusal;
};
// EvaluationStream = AsyncIterable<EvaluatorEvent> & { settled: Promise<Settlement> }
```

## The caller protocol

The consuming lens calls applicability first — that is how it builds its options
list — and only then drives main. The refusal arm exists because an
imperatively-called function cannot refuse by not existing the way an unmounted
component can: where the lens kind's gate is its whole refusal channel, an
evaluator invoked anyway must still answer, and it answers with data.

Laziness belongs to the consumer: main hands back a stream, and no learner code
runs until the lens pulls it. **Cancel is stopping the pull** — breaking out of
the loop tears the run down, so a lens unmounting naturally cancels whatever it
was driving; teardown resolves the settlement as canceled. An engine-forced stop
is not a cancel: a timeout or an iteration cap settles as an error, in the
machine's own words, so the learner sees why the run ended.

## The evaluators

Three evaluators plus a family:

- **run** — the baseline: no I/O events; its whole output is how the run ended —
  the clean or error settlement arm.
- **intercept** — run plus the program's own I/O as events: dialog interactions,
  console output — the raw material the four-audiences rendering needs.
- **danger** — an evaluator whose execution backend is a real window: real
  dialogs, answered in the window itself — danger emits no pending interaction —
  and a real `debugger;`. The window is execution substrate, not a rendered view
  — the run lens consumes danger as an option and manages its zoning.
- **the tracers** — the introspective family: evaluators that emit step-by-step
  trace events about execution itself; the trace-debugging lens dispatches over
  them. Each tracer is its own sub-directory under `tracers/`, exporting its own
  `Evaluator` object.

## Anatomy of an evaluator

Each evaluator directory exports a single `Evaluator` object — the object is its
identity. Every evaluator is **self-contained**: it publishes its own typed
event union extending the kind's event envelope structurally, in its own types,
importing nothing from other regions — foreign shapes it must speak (the
engine's, embody's geometry) are mirrored structurally, never imported.

```text
evaluators/<name>/
  README.md      what this evaluator observes, for whom
  DOCS.md        why this evaluator — decisions + its own data flow
  index.ts       the Evaluator object (default export)
  types.ts       its own event union + settlement details
  tests/         behavior tests over the stream
```

## Rules every evaluator obeys

- **Headless.** No rendered view, no component, no DOM ownership — danger's
  window is substrate the run lens zones, not a view this region draws.
- **The code arrives parse-valid.** The evaluation phase gates upstream — acorn
  is the run ceiling — so an evaluator assumes its spec's code parses and
  carries no unparseable-input defenses.
- **Refusal-as-data at main.** A spec an evaluator cannot serve gets a
  structured refusal, never a throw at the learner.
- **The surface is synchronous; the stream is where async lives.** name,
  applicability, and main itself are sync; the returned stream is the only
  asynchronous thing here.
- **Streams are mount-bounded.** An evaluation event stream never outlives the
  mount that started it — the consumer's unmount breaks the pull, and that is
  the cancellation.
- **Consultation is private.** An evaluator may consult a language level
  internally; no contract field names one.
- **No handles ride the embodiment.** Evaluation-phase lenses build specs from
  the embodiment's facts and import their evaluators directly; embody carries no
  execution knowledge.
- **Package-internal, lens-facing.** The contract is exported to the lenses that
  consume it and is not part of the package's public surface.

## Glossary — region terms

The package glossary owns the shared meanings; these entries add the mechanics
this region owns.

- **evaluation spec** — what a consuming lens builds and hands to an evaluator:
  the program's code, the execution axis the lens mapped from the snippet type,
  and optionally the iteration cap the runaway-loop guard enforces (the
  machinery's own defaults apply when absent). The kind's whole input domain.
- **evaluation event stream** — what main returns: an async iterable of events
  plus a companion `settled` promise. Events are pulled; the settlement is
  awaited; cancellation is ceasing to pull.
- **event** — one streamed moment of a run, in the emitting evaluator's own
  vocabulary; every evaluator's union extends the kind's envelope structurally,
  and the envelope's `kind` stays an open string so unlisted events ride through
  rather than being dropped.
- **settlement** — how the run ended: cleanly, in an error carried in the
  machine's own words (engine-forced stops land here), or canceled (the consumer
  stopped pulling; teardown resolves it). The three arms are the floor every
  settlement guarantees; an evaluator may carry a richer error shape, reached by
  importing that evaluator directly — as with events. Distinct from the
  package's **settle** — a settle is the editor's re-embodiment moment and ends
  mounts; a settlement ends one run.
- **pending interaction** — the distinguished — and optional — event kind for a
  program waiting on its user: the stream suspends until the event's own respond
  channel is answered, then resumes. Resume rides the event — never the
  iterator; answering twice is inert, and answering after teardown is a no-op,
  never a throw. An evaluator whose backend answers interactions itself never
  emits it — consumers must not assume every evaluator suspends.
- **refusal** — the kind's refusal-as-data shape: returned by main instead of a
  stream, with the reason in the evaluator's own words.
- **execution axis** — the spec's `'function' | 'module'` field; the consuming
  lens maps the snippet type onto it. Structurally mirrors the execution
  engine's own axis.

## Navigation

- Package root: [`../README.md`](../README.md) — the domain model and the
  package glossary.
- [`DOCS.md`](./DOCS.md) — this region's architectural sketch.
- [`types.ts`](./types.ts) — the evaluator-kind contract: `Evaluator`,
  `EvaluationSpec`, `EvaluationStream`, `Settlement`, `EvaluatorRefusal`.
- Each evaluator's own directory documents that evaluator.
