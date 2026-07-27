<!-- cspell:ignore affordances -->

# generator

The study instrument's AI-authoring view — the pane's THIRD occupant. A learner
opens it from the home base, remixes their own program with a prompt, previews
what came back, and either accepts it into the buffer or discards it. Generation
is an excursion, never a co-equal surface: human authoring stays the center of
study, and every way out of this view lands back in the editor.

The region [README](../README.md) owns the pane model, the dispose rules, and
the mask classes; this document owns the view's own contract and the generator
socket.

## Remix-first

The view opens over the learner's LIVE buffer — the flush-at-open absorbs any
pending keystrokes, and the frozen open-time pair is both the seed display and
the coherence anchor. An empty buffer composes from scratch; a non-empty one is
a remix. The seed is read-only here: the generator never edits, it only offers.

## The view contract

Props: the `seed` (a string, possibly empty), the `socket` (below),
`onAccept(program)` and `onDiscard()` — intent raised upward; the top component
owns every commit, so the one-intake rule survives: an accepted candidate lands
through the region's one edit intake, and that intake settles IMMEDIATELY — an
absorb-settle like the snippet-type toggle's, never the keystroke debounce,
because the view is gone in the same batch.

The generation job is a per-mount, view-local machine:
`idle → loading → generating → preview | refused`. It never rides the occupant
(the occupant is frozen state) and never touches the bus — open/closed flags and
in-flight jobs are each surface's ephemeral own, per the region's residency
rule.

One **ask** is in flight at a time — the affordance is spent while an ask is
live — and three separate things end one. The view keeps them apart:

- **Cancel** RETIRES the ask and returns the job to `idle`, staying inside the
  view: no callback fires, the seed and the prompt both survive, and the learner
  can ask again straight away. Retiring is the load-bearing half — a retired
  ask's answer changes nothing, and neither does any stage it announces
  afterward, so an abandoned ask can never resurrect a preview over the next
  one. Cancel is live at every stage, the rendered preview and the rendered
  refusal included.
- **Discard** raises `onDiscard()`. The excursion ends and the buffer is
  untouched.
- **Dispose-as-unmount** is the standing guarantee underneath both: every path
  that closes this view (accept, discard, Edit code, a type/level/posture
  commit, opening a lens) unmounts it, and the unmount cleanup retires the
  in-flight ask AND aborts its underlying work — so what a retired ask produces
  can neither land nor be seen. No orchestrator bookkeeping, no policing.

Generation can take a while, and the view says so up front, plainly, before the
first click — naming both facts, that it is slow and that leaving this view ends
it. A derivation-context commit is one click away in the same band and takes an
in-flight ask with it; the learner hears that before they start, not after they
lose one. The view renders inline text only, no heading elements: the
instrument's sole headings stay the guide's topic titles.

## The generator socket

The view is built SOCKET-FIRST: it calls a `GeneratorSocket` whose
`generate(program, request, { onPhase, signal })` honors the committed aithor
signature — `aithor(program, config, runtime) → AithorResult` — with
`request = { prompt, model }` the two REQUIRED `AithorConfig` fields and nothing
more. `onPhase` and `signal` are CONSUMER-side affordances the socket provides
(the socket constructs the runtime, so it can observe bring-up and abort
best-effort); the aithor contract itself is untouched.

Refusal-as-data is TOTAL across this seam, and a well-formed answer is the
socket's to guarantee: `generate` resolves, always. A rejected promise is an
invariant violation, and so is a resolution the result shape cannot serve — a
success carrying no program, a refusal carrying no cause. Both are loud, in
development and in production alike; the view never invents a cause it was not
given, because every cause it could name would be a lie.

`request.model` is always the empty string here — the pick-for-me ask. The
runtime chooses, and reports back which model it chose; this view offers no
model picker, and the copy for a model the generator does not know exists
because the socket can still produce that cause, never because anything here can
ask for it.

The default socket is a DETERMINISTIC PLACEHOLDER: it scripts the
loading→generating stages, then returns the seed extended with a marker comment
carrying the prompt — and a prompt beginning `refuse:` returns a scripted
refusal, so refusal copy is demonstrable end-to-end. The placeholder labels
itself honestly in its output; nothing pretends a model ran.

The result vocabulary in [`types.ts`](./types.ts) is TRANSCRIBED from the
committed contract, never imported: the aithor core lives in another tree, and a
transcription keeps this view's compile independent of it while staying cheap to
re-shape. The request is not a transcription of anything — it is this consumer's
own shape, narrower than `AithorConfig` by construction and this view's to
define.

## Refusal copy — the learner-worded table

A refusal renders in the output slot as one sentence for its cause, plus an
actionable next-step line when the socket carries one. Never a dead end; never
machine vocabulary. Every cause has a sentence and every next step has a line:
both maps are total over the TRANSCRIBED causes by type, so a cause this table
has not learned fails the type-check rather than rendering an empty slot. The
guard binds the copy to the transcription, not the transcription to the contract
behind the socket — a cause that appears upstream reaches this table when the
transcription learns it.

| Cause                     | The sentence                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `attempt-bound-exhausted` | "The generator tried a few times but couldn't make a program that fits — adjust the prompt and ask again." |
| `no-model-available`      | "No model can run here right now."                                                                         |
| `unknown-model`           | "The generator doesn't know the model that was asked for."                                                 |

| Next step        | The line                                                                  |
| ---------------- | ------------------------------------------------------------------------- |
| `retry`          | "Try again."                                                              |
| `free-space`     | "Your device is low on storage — free some space and try again."          |
| `reconnect`      | "The model couldn't download — check your connection and try again."      |
| `use-native-app` | "This device can't run a model inside a web browser — a desktop app can." |

## Selector contract

`data-generator` on the view root; `data-generator-seed`,
`data-generator-prompt`, `data-generator-generate` ("Generate"),
`data-generator-cancel` ("Cancel"), `data-generator-output` (holding the stage
report, then either `data-generator-preview` — with `data-generator-meta` naming
the model that ran and its attempt count — or `data-generator-refusal`),
`data-generator-accept` ("Accept"), `data-generator-discard` ("Discard"). The
ask's attribute says `generate` and not `run` deliberately: `Evaluation · run`
is the lifecycle strip's own display label, and one word naming two unrelated
acts is exactly the collision this vocabulary keeps out. The opening affordance
lives in the region's control row as `data-generator-open` ("Generate code"),
rendered in editor mode only — its mask treatment is the region README's
concern.

## Out of scope

Config knobs (size, features, lifecycle profiles), model selection, an
honored-focus arm for the generator, host-curated defaults, and the model
runtime itself all sit outside this view's contract — the socket is the whole of
its reach toward them. Two words are borrowed, never coined: the job stage is
named `preview`, never "settled-…", because the settle loop owns that word; and
what comes back is a **candidate**, never a "proposal", because a proposal is a
lens's recommendation of a next study step.

## Navigation

- Region root: [`../README.md`](../README.md) — the pane model and the mask
  classes.
- [`DOCS.md`](./DOCS.md) — this view's architectural sketch.
- [`types.ts`](./types.ts) — the socket, job, and view contracts.
- Siblings: [`../editor/`](../editor/README.md) is the home base every exit
  lands in; [`../event-bus/`](../event-bus/README.md) documents the
  `generator-opened` announcements.
