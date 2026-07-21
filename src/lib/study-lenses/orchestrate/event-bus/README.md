<!-- cspell:ignore entrancy -->

# event-bus

The region's internal event bus: one per mounted instance, synchronous, typed.
Internal coordination only — the bus never appears on the host surface, and no
subscribe-or-dispatch prop exists.

The region [README](../README.md) owns who dispatches (the top component, the
single owner of session choices); this document owns the bus contract and the
event taxonomy.

## The contract

- **Per-instance** — each mount owns its own bus; two instances never share
  listeners.
- **Synchronous dispatch, registration order** — dispatch delivers before it
  returns, to listeners in the order they subscribed.
- **Snapshot at dispatch** — each dispatch captures its listener set as it
  stood; a listener that subscribes or unsubscribes mid-dispatch affects only
  future dispatches. Re-entrant dispatches run depth-first, each on its own
  snapshot.
- **Caught listener throws** — a listener that throws is caught and warned;
  subsequent listeners still fire.
- **Idempotent unsubscribe** — subscribing returns a teardown; calling it twice
  removes the listener once and is a no-op after. Registration is by listener
  identity, so the StrictMode subscribe → cleanup → subscribe pattern is safe.
- **`clear()`** — drops every listener; a test-isolation affordance.

## The taxonomy

Five events — four announce committed session choices, and `settled` announces a
completed derivation:

| Event             | Announces                                                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `level-selected`  | the selected level key changed (`''` = none-state)                                                                                                                     |
| `posture-toggled` | the enforcement posture changed (strict on or off)                                                                                                                     |
| `type-toggled`    | the snippet type changed                                                                                                                                               |
| `lens-opened`     | the open-lens choice changed (a name; `null` when closed — the strip's none entry, the Edit code button, a derivation-context commit's dispose, or the orphan defense) |
| `settled`         | a settle completed; derived state is fresh                                                                                                                             |

Configuration tweaks are the one session choice with no event: a tweak reaches
its lens as fresh props through the cascade, and no other surface reacts to it.
And `settled` here is the settle loop's derivation-completion — distinct from an
evaluation run's `Settlement`, the evaluators' own word for how a run ended.

## Dispatch ordering

- **Events announce committed state, never intent.** The session-choice owner
  dispatches after its state commit; surfaces raise intent through callbacks,
  not through the bus.
- **A choice event precedes the settle it causes.** The snippet-type toggle
  re-derives immediately: `type-toggled` dispatches first, then that
  re-derivation's `settled`.
- **One `settled` per settle**, after the new derived state commits — never
  mid-derivation.
- **A dispose precedes the change that caused it.** A derivation-context commit
  (type, level, posture) over an open lens disposes the lens first:
  `lens-opened: null` dispatches before the change's own event, which precedes
  any settle it causes. With no lens open, dispose is silent — no
  `lens-opened: null` fires.
- **The flush-at-open order.** Opening over pending edits dispatches
  `lens-opened` with the name first; the absorbed settle's `settled` follows
  post-commit. The orphan sequence `lens-opened` (name) → `settled` →
  `lens-opened` (null) is legal — subscribers must tolerate an open immediately
  followed by its close, with the explaining settle between.
- **A same-name re-open is a legal re-commit.** Explicitly re-opening the
  already-open lens dispatches `lens-opened` with the same name — the choice
  re-committed (its opened overrides re-resolved), never suppressed as a no-op.
  Subscribers must not assume consecutive `lens-opened` names differ.
- **Listeners never force a render flush.** No listener may call `flushSync`:
  the pane flip's one-commit batching guarantee depends on dispatches never
  flushing React mid-handler.

## Navigation

- Region root: [`../README.md`](../README.md) — the host surface and the
  region's mechanics.
- [`DOCS.md`](./DOCS.md) — this bus's architectural sketch.
- [`types.ts`](./types.ts) — the payload map and bus contracts.
- Siblings: [`../editor/`](../editor/README.md) raises the edit events the
  settle loop debounces; [`../phases-panel/`](../phases-panel/README.md) raises
  open-lens intent the owner commits and announces.
