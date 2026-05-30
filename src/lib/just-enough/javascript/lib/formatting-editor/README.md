# lib/formatting-editor

JEJ canonical formatting shaped as the editor's format callback. Given
a code string, returns the canonically-formatted code (or the original
unchanged if the formatter cannot parse it).

This module is the **adapter** between
[`../../embody/lib/formatting/`](../../embody/lib/formatting/) (which
owns the canonical Prettier-backed formatter) and
[`../../orchestrate/lib/editing/`](../../orchestrate/lib/editing/)
(which consumes a `FormatCallback` to drive the editor's
`Ctrl-Shift-f` / `Cmd-Shift-f` reflow keybinding). It is callable from
any peer that wants JEJ-canonical formatting over a snippet string.

## Glossary

**Canonical formatter** — the runtime formatter at
[`../../embody/lib/formatting/format.ts`](../../embody/lib/formatting/format.ts):
an async Prettier-standalone wrapper with a fixed JEJ-canonical config
(tabs, 80-column, single quotes, semicolons; non-zero blank-line runs
normalize to one — Prettier's paragraph-break semantics). Its contract
is **graceful degradation**: any throw inside Prettier is caught and
the original `code` is returned unchanged (parse error, plugin error,
internal Prettier bug — all the same path). This is the single source
of truth for "JEJ-canonical formatting", shared with the runtime gate
[`checkFormat`](../../embody/lib/formatting/check-format.ts) called
inside [`isJej`](../../embody/lib/validating/is-jej.ts).

**Format callback** — the editor's `FormatCallback` slot, owned by
[`../../orchestrate/lib/editing/types.ts`](../../orchestrate/lib/editing/types.ts):
`(code: string) => string | Promise<string>`. The CodeMirror factory
([`../../orchestrate/lib/editing/create-editor.ts`](../../orchestrate/lib/editing/create-editor.ts))
awaits the result inside `applyFormat`, then dispatches the formatted
content into the editor as a single transaction (only if it changed).

**Formatting feed** — the path from snippet string → JEJ-canonical
output. This adapter consumes the canonical formatter directly (no
transformation, no inspection, no JEJ-subset validation), so the source
of truth for "JEJ-canonical" is the same function the runtime gate uses.
Sharing one definition is what keeps editor-shown and runtime-validated
formatting byte-identical.

## Performance

`formatJej` runs once per explicit user gesture in the keybinding
path (`Ctrl-Shift-f` / `Cmd-Shift-f`, registered in
[`build-extensions.ts`](../../orchestrate/lib/editing/build-extensions.ts)).
The programmatic path (`editor.format()` on the factory's returned
handle) is consumer-driven — call frequency is up to the consumer.
JEJ snippets "fit on a single printed page" (per
[`../../README.md`](../../README.md) § Why a language level), bounding
per-invocation cost.

## What lives here

```text
lib/formatting-editor/
  README.md                       (this — orientation + navigation)
  DOCS.md                         architectural sketch + Mermaid data flow
  format-jej.ts                   delegating wrapper: (code) → Promise<string>
  tests/
    format-jej.test.ts
```

There is no `types.ts`: this module defines no new types. The input is
a plain `string`; the output is `Promise<string>`; the `FormatCallback`
shape is owned by
[`../../orchestrate/lib/editing/types.ts`](../../orchestrate/lib/editing/types.ts).

## Public API

```ts
import formatJej from './format-jej.js';

const formatted: string = await formatJej(code);
```

Signature: `(code: string) => Promise<string>`. Matches the
`FormatCallback` shape expected by the editor's `format` option
(see [`../../orchestrate/lib/editing/types.ts`](../../orchestrate/lib/editing/types.ts)).

Behavior:

- **Empty input** → empty string.
- **Already-formatted JEJ-canonical input** → returned unchanged
  (idempotence: `formatJej(await formatJej(code))` equals
  `await formatJej(code)`).
- **Unformatted parseable input** → returned reflowed to JEJ-canonical
  form (tabs, 80-column, single quotes, semicolons, blank-line
  normalization).
- **Non-JEJ but parseable JavaScript** (e.g. `class`, `var`) →
  formatted as best Prettier can. **There is no JEJ-subset gate** —
  the formatter does not refuse to format non-JEJ code. Pedagogically,
  formatting cleans up the snippet's visual shape; the linter
  ([`../linting/`](../linting/)) tells the learner which constructs
  are outside JEJ. The two surfaces are independent.
- **Formatter failure** (Prettier throws — parse error, plugin error,
  any internal error) → returned unchanged (inherited from the
  canonical formatter's graceful degradation; the catch is on any
  throw, not just parse errors).

The function appears never to throw because the canonical formatter
swallows throws and resolves with the original code on failure;
`formatJej` inherits that contract.

### Edge cases

- **Async-only.** The return is `Promise<string>` even when the
  formatter could shortcut (e.g. identity on Prettier failure). The
  editor's `FormatCallback` type accepts both sync and async; we
  expose async because the underlying formatter is async.
- **No `changed` flag emitted.** The CodeMirror factory exposes a
  separate `FormatResultCallback` (`onFormat`) slot that fires with
  `{original, formatted, changed}` whenever a format completes;
  `changed` is computed inside
  [`applyFormat`](../../orchestrate/lib/editing/create-editor.ts)
  (not the adapter). The adapter returns just a string.
- **No JEJ validation.** `formatJej('var x = 5;')` returns the
  Prettier-formatted version even though `var` is outside the JEJ
  subset; the linter remains responsible for surfacing that violation.

## Consumers

- **Current**: [`../../orchestrate/editor/index.tsx`](../../orchestrate/editor/index.tsx)
  passes `formatJej` as the `format` callback to
  [`createEditor`](../../orchestrate/lib/editing/create-editor.ts).
- **Potential**: any lens or sandbox tool that wants to expose a
  "format this snippet" gesture. The module's location at
  `javascript/lib/` (peer-independent) makes such consumption
  available without an upward dependency on `orchestrate/`.

## Why this module exists

The CodeMirror format slot in the editor home base needs a formatter
that produces **JEJ-canonical** output. The canonical formatter at
[`../../embody/lib/formatting/format.ts`](../../embody/lib/formatting/format.ts)
is already exactly the function we want — it owns the JEJ-canonical
Prettier config and is the formatter the runtime gate
([`checkFormat`](../../embody/lib/formatting/check-format.ts) inside
[`isJej`](../../embody/lib/validating/is-jej.ts)) validates against.
Sharing it means a snippet the editor has just formatted is
byte-identical to what the runtime considers JEJ-canonical — no
drift mode is possible.

The module lives at the JEJ-package `lib/` level rather than inside
[`../../orchestrate/lib/`](../../orchestrate/lib/) so that
non-orchestrator consumers (a future "format this code" lens, a
formatting-driven sandbox tool) need not reach across the `lenses/` ↔
`orchestrate/` boundary. It lives outside
[`../../orchestrate/lib/editing/`](../../orchestrate/lib/editing/)
because `editing/` is JEJ-blind by contract — the editor knows how to
dispatch a format callback but not what shape "JEJ-canonical" takes.
JEJ-specific formatting belongs outside that boundary.

The module also lives outside `../../embody/lib/formatting/`. The
canonical formatter is the runtime-pipeline owner of the Prettier
config and the format check; `lib/formatting-editor/` is its
editor-callback adapter. `embody/lib/*` is internal to the embodiment
pipeline per [`../README.md`](../README.md); orchestrate/editor
reaching into it directly would violate the peer-internal boundary.
The thin adapter here enforces the boundary even though the body is
delegation-only.

## Conventions

Inherits all conventions from [`../README.md`](../README.md),
[`../../README.md`](../../README.md), and the top-level `AGENTS.md` /
`DEV.md`. Module-specific rules:

- **Delegating wrapper only — no thickening.** The body is a single
  `return format(code);` call into the canonical formatter. No
  pre-processing, no post-processing, no caching, no telemetry, no
  instrumentation. If a need for any of those arises, it belongs in
  the canonical formatter (`embody/lib/formatting/`) so the runtime
  gate `checkFormat` shares the behavior — otherwise the two surfaces
  drift and the single-source-of-truth premise is lost.
- **No JEJ-subset gate.** Per the pedagogical design (see Public API
  above), the adapter does not check `validate(code).ok` before
  formatting. Format and lint are independent surfaces.
- **No `embody()`, no `Snippet` construction.** The adapter imports
  the canonical formatter's standalone `format()` function from
  `../../embody/lib/formatting/format.js`, but never
  [`embody()`](../../embody/index.ts), the `Snippet` type, or anything
  under `../../embody/lib/evaluating/`. The canonical formatter has
  no embodiment surface, and the adapter must not introduce one.
  This rule is **load-bearing for the delegation-only premise** (a
  `validate-before-format` hook would reach into the same
  `embody/lib/*` layers that produce the single source of truth)
  rather than for the F2 "no embody in editor mode" invariant.
  (Contrast with the linting adapter, where bypassing `embody()` IS
  load-bearing for F2.)

## Navigation

- **Parent peer:** [`../README.md`](../README.md).
- **Architectural sketch:** [`./DOCS.md`](./DOCS.md).
- **Producer of canonical formatting:**
  [`../../embody/lib/formatting/`](../../embody/lib/formatting/).
- **Consumer of `FormatCallback`:**
  [`../../orchestrate/lib/editing/`](../../orchestrate/lib/editing/).
- **Editor deferred-callback wiring:**
  [`../../orchestrate/editor/DOCS.md`](../../orchestrate/editor/DOCS.md)
  § Deferred callback wiring. That file's entry for `format` points
  back here.
- **Sibling adapter:**
  [`../linting/README.md`](../linting/README.md) — validation-feed
  adapter (the prior inhabitant of this peer).
