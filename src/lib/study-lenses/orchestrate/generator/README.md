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
  refusal included; its one control reads "Stop" while an ask is in flight and
  "Start over" once an answer is on screen.
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

## The view's own words

Some learner-visible words are this view's own rather than any socket's, so
every one of them is written down here verbatim, for the reason
[§ The placeholder socket](#the-placeholder-socket) gives for the socket's: a
value nobody specified is a value someone invents. The refusal sentences are not
among them — those are
[§ Refusal copy](#refusal-copy--the-learner-worded-table)'s, and the view
transcribes them.

**The warning**, rendered before the first click:

```text
Generating can take a while. Leaving this view ends it — and so does changing the level, the posture, or the snippet type.
```

One sentence per fact, and the second names the derivation-context controls
outright rather than gesturing at them: those are the click in the same band
that costs a learner an ask, and a learner who was not told loses one and hears
why afterwards.

**The prompt field's label** is `Your prompt` — the same two words the
placeholder's marker comment already uses for the same thing, so the learner
meets one name for it wherever it appears.

**The stage reports**, one line at a time in the output slot, replaced as each
stage is announced and gone once an answer is on screen:

```text
Getting the generator ready…
Writing a program…
```

One line per `GeneratorPhase`, and neither names a model. The placeholder
announces both stages and no model runs behind it, so a report that promised one
would be a lie at the default socket while telling a runtime-backed socket's
learner nothing extra.

**The meta line**, rendered beside every candidate:

```text
Produced by <producer> in 1 attempt.
Produced by <producer> in 3 attempts.
```

`<producer>` is [`GeneratorMeta`](./types.ts)'s `model` verbatim — the resolved
id of whatever actually made the program, which for the placeholder is the
literal `placeholder`. "Produced by" rather than "generated by" or a model name:
_producer_ is the word the contract itself uses, and it is the only one honest
for a socket that never ran a model and one that did. The count is the singular
line for one pass and the plural for any other, so a curated loop's repairs are
visible rather than rounded away.

**The control labels**, one per affordance the view offers:

```text
Generate
Stop
Start over
Accept
Discard
```

`Generate` sends the ask. `Accept` and `Discard` are the two ways an answer ends
the excursion, and they are offered only once there is an answer to judge —
`Accept` over a candidate alone, because a refusal leaves nothing to accept.
`Stop` and `Start over` are ONE control: it retires the ask either way, keeping
the seed and the prompt, and it reads `Stop` while an ask is in flight and
`Start over` once a candidate or a refusal is on screen. Two labels for one act,
because stopping something that is running and starting again from a finished
answer are not the same sentence to a learner. The opening affordance's
`Generate code` is not among these — it lives in the region's control row, not
in this view.

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

## The placeholder socket

The default socket is a DETERMINISTIC PLACEHOLDER, and every value it returns is
specified here, because every one of them is learner-visible.

**The stages.** It announces `loading`, then `generating`, then answers — on
BOTH paths, the scripted refusal included. Its refusal is scripted, not a real
bring-up failure, so it never takes the refuse-out-of-loading edge a socket
backed by an actual runtime can. The stages are separated by a real delay
because the view's honest loading states exist to be seen, and a socket that
answered within the same tick would make them unobservable. The factory takes
that delay and nothing else, as a destructured option with a default:
`stageDelay`, in milliseconds, **default `400`** — long enough to read, short
enough not to punish.

**The candidate.** An ordinary ask answers with the seed, then one blank line,
then a two-line marker comment:

```text
// No model ran — this came from the study environment's placeholder generator.
// Your prompt: <the prompt>
```

The second line is present only when the prompt is non-empty. An empty seed
answers with the comment alone and no leading blank line — there is always a
program, never an empty one.

`//` line comments are load-bearing, not a style choice: a block comment would
break on a prompt containing `*/`, and the result is a program that lands in the
learner's buffer on Accept and is then parsed. For the same reason the prompt is
NORMALIZED into the comment — every run of whitespace, newlines included,
collapses to one space — so no prompt can end the comment early. Nothing else
about the prompt is altered or escaped.

**The meta.** `meta` names the placeholder ITSELF, not a model: `model` is the
literal string `'placeholder'` and `attempts` is `1`, one pass by the thing that
actually produced the program. That is what "the resolved id" means at this seam
— the producer, whatever it was — and it is why the meta line beside a candidate
never lies. The `data-generator-meta` slot renders it, so a learner reading a
placeholder program is told, in the same place they would be told a model's
name, that no model ran.

**The refusal.** A prompt beginning `refuse:` — at index 0, case-sensitive, no
leading space — answers with a scripted refusal instead, so refusal copy is
demonstrable end-to-end. Two shapes are reachable, because a refusal with a next
step and one without render differently:

- `refuse:` followed (after optional surrounding whitespace) by a
  `GeneratorRefusalCause` name refuses as THAT cause, with no next step.
- Anything else after the prefix — including nothing at all — refuses as
  `no-model-available` carrying `use-native-app`. A learner typing
  `refuse: please stop` gets the default shape, never an error.

Nothing else in the prompt changes the answer, and `request.model` changes
nothing at all: this socket holds no catalog, so it can never honestly report a
name as unknown. It ignores the field.

**The abort.** A signal that aborts stops the placeholder announcing further
stages and stops it scheduling further work; it never rejects and it is never
required to answer. Whether a retired ask eventually resolves is immaterial by
construction — the view retired it, so its answer is already unobservable. Abort
is a courtesy to the machine, not a contract with the caller.

**The freeze.** Like every other leaf in this region, the socket freezes what it
builds: the returned socket object, and every result it resolves with. The
`readonly` modifiers in [`types.ts`](./types.ts) bind well-typed callers only;
the freeze is what holds against the untyped one.

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
`data-generator-cancel`, `data-generator-output` (holding the stage report, then
either `data-generator-preview` — with `data-generator-meta` naming the producer
and its attempt count — or `data-generator-refusal`), `data-generator-accept`
("Accept"), `data-generator-discard` ("Discard"). One reset control, two labels:
it reads "Stop" while an ask is in flight and "Start over" once a candidate or a
refusal is on screen. One control because it is one act — retire the ask, keep
the prompt — and two labels because stopping something running and starting
again from a finished answer are not the same sentence to a learner. The ask's
attribute says `generate` and not `run` deliberately: `Evaluation · run` is the
lifecycle strip's own display label, and one word naming two unrelated acts is
exactly the collision this vocabulary keeps out. The opening affordance lives in
the region's control row as `data-generator-open` ("Generate code"), rendered in
editor mode only — its mask treatment is the region README's concern.

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
