# `study/` — architectural decisions

This document captures the "why" for the study lens specifically. The
lens-directory [`../DOCS.md`](../DOCS.md) holds shared structural
constraints across all lenses; this file records study-lens-only choices.

## Role in the system

The study lens is the **default meta-lens** — the rendering that a learner
sees for most `js:study` fences. It is the entry point for reading code,
running it, formatting it, and (eventually) inspecting it via peer lenses.
Every other lens (blanks, parsons, highlight, variables, …) is expected to
be reachable **from inside** the study lens in a future plan, either via
in-place replacement or a modal. V1 does not implement that bridge;
increments 2.2–2.9 build only the base meta-lens.

## Three-button toolbar — why just these three

V1 ships Run, Format, Reset. Every other button from the old SL prototype
(Trace, Debug, Table, Predict, Socratize, Ask, Lint) was cut on purpose:

- **Trace**: the `just-enough/javascript/` tracer is undergoing a
  facelift; integrating against it now would lock the study lens into a
  contract that's about to change.
- **Debug, Predict, Socratize, Ask**: dependencies on other subsystems
  (debugger UI, LLM client) not yet present in V1.
- **Table**: requires the `trace-table` React component (3 types with a
  dropdown selector) — deferred to its own plan on YAGNI grounds during
  AR-1 of that component. Table is the most likely first addition
  post-V1.
- **Lint**: `api/validate` exists but V1 does not surface diagnostics in
  the toolbar. A future plan adds a Lint button paired with CodeMirror
  gutter markers.

Shipping three buttons lets V1 prove the injection → editor → action
handler path end-to-end with the minimum viable surface. Each follow-up
lens plan inherits the pattern.

## Phase-by-phase lifecycle

Each `<StudyLens>` instance goes through the lens-directory phases (see
`../DOCS.md`) plus these study-lens-only sub-behaviors:

**Phase 2 (Narrow)** — `StudyOptions` is derived inline after decoding:

- `config` prop decoded first via `parseLensConfig` (imported from
  `src/plugins/study-lenses/parse-lens-config.ts`), yielding
  `object | string | null`.
- If `buttons` absent → render all three.
- If `engine` absent → `{ seconds: 5 }` (iterations left undefined so
  `api/run` applies its own default).
- Bare-string or malformed `config` → fall back to defaults, emit
  `console.warn` once tagged `StudyLens: ignoring malformed config:`.

**Phase 4 (Mount async)** — `createEditor` is called with **exactly four
options**:

- `language` — derived from `lang` prop via `detectLanguage({ ext: lang })`.
- `format` — hardcoded to `apiFormat` (from `api/format`). JS-only in V1.
- Plus the caller-supplied `parent: HTMLElement` pattern is NOT used —
  the lens appends `editor.el` to a `ref`'d container after the factory
  resolves. Avoids the factory's `parent` convenience in favor of an
  explicit React mount.
- Other `createEditor` options (linters, docLookup, completions, onFormat)
  are intentionally omitted in V1. Each of those is a follow-on
  opportunity.

**Phase 7 (Handle actions)** — button handlers:

| Button | Boundary the handler touches                     |
| ------ | ------------------------------------------------- |
| Run    | `await run(editor.content, options.engine)`       |
| Format | `editor.format()`                                 |
| Reset  | `editor.content = originalCode`                   |

Each handler reads/writes exactly one boundary. No handler chains multiple
actions.

## Reset: why `editor.content = originalCode` and not `editor.reset()`

`createEditor`'s built-in `reset()` restores the editor to the **code the
editor was constructed with**. In V1 the lens calls `createEditor(code, …)`
exactly once per mount, so `reset()` would restore to `code === props.code
=== originalCode` and the two approaches coincide behaviorally.

`originalCode` is derived directly from `props.code` in the render
function (a closed-over variable, not a ref or separate state). Because
the mount effect's dependency array is `[code, language]`, any change to
`props.code` triggers effect teardown + remount, so `originalCode` in the
new closure always equals `props.code` at the time of the most recent
mount. Reset is always "restore to what was here when the editor last
started" — not "restore to the very first `code` prop ever received".

The lens writes `editor.content = originalCode` **explicitly** for three
reasons:

1. **Intent clarity.** The code says what it restores, not how. A reader
   doesn't need to trace `createEditor`'s internal `initialCode` variable
   to understand Reset's target.
2. **Future re-seed safety.** If a later plan re-creates the editor with
   a different `code` mid-life (e.g. chapter navigation reusing the lens
   instance), `editor.reset()` would snap to the *latest* construction
   code, which may differ from `props.code` at that moment. Writing
   `originalCode` directly keeps the semantics pinned to the React prop.
3. **Parallel structure with Format and Run.** All three handlers read a
   known value and dispatch it to a known boundary. Reset using
   `reset()` would be an asymmetric special case.

Trade-off accepted: a future refactor that wants to share Reset logic
across lenses cannot lean on `editor.reset()` as a single-implementation
path. When that refactor lands, it extracts a `resetToOriginal(editor,
originalCode)` helper instead.

## Format: why `editor.format()` not `editor.content = apiFormat(editor.content)`

The editor factory accepts a `format` callback and exposes an
`editor.format()` method that wires through it. Two architectural
benefits:

1. **Fires the editor's `onFormat` hook.** Future plans that want to
   surface format-result UI (e.g. a toast "no changes needed") land the
   hook at the editor factory, not in each lens.
2. **The editor dispatches the CM transaction itself.** Direct
   `editor.content = apiFormat(editor.content)` would also work but
   bypasses the editor's own format-transaction machinery, making future
   editor features (selection preservation across format, undo grouping)
   harder to add without touching lens code.

Trade-off: V1 is JS-only, so the format callback is wired to `apiFormat`
unconditionally at mount. A multi-language plan either extracts a
`lang → formatter` map at the lens boundary or inside the editor factory.
The decision is deferred; neither option is pre-committed.

## Run: why async-void in V1

Per user directive 2026-04-15: "run just evals the code in a sandbox for
now, so you can call it and forget. later it will stream events but that's
not ready yet."

Implications that shape the lens:

- The lens does **not** render `RunResult` in any form (no stdout panel,
  no error display, no log viewer). The `RunResult` is discarded.
- Side-effect output (console.log, alert, prompt) surfaces wherever the
  JeJ runtime places it — for the current async-void runner, this is the
  browser devtools console via the Worker's own stdio trap.
- The Run button is **disabled** during the awaited promise (mid-flight)
  so the learner cannot queue multiple runs. Re-enabled on settlement
  regardless of `ok: true / false`. This requires a separate `isRunning`
  boolean in React state (`setIsRunning(true)` on entry, `false` on
  settlement). The button's disabled expression is `disabled={!editor ||
  isRunning}` — distinct from the null-gate that covers all buttons before
  the async factory resolves.
- No error boundary. `api/run` contract guarantees it never throws — all
  errors surface in the result's `error` field (discarded in V1).

Future migration: when the tracer-driven runner is ready, this lens's
Run handler switches from `await run(...)` to a streaming iterator and
grows an output panel. The increment is purely additive to V1's
lifecycle.

## Accessibility

- **Every button has a descriptive `aria-label`** (see README §V1
  features for the exact labels).
- **No `aria-controls`** in V1. aria-controls relates a control to a
  target region it affects; V1 has no output region to point at. When
  Run gains an output panel in a future plan, aria-controls lands there.
- **React `useId` scopes all lens-instance identifiers.** Two study
  lenses on the same page never share an id. In V1 this matters for
  future-proofing (aria-controls, `<label htmlFor>` relationships) —
  no live consumer yet but the id-generation pattern is locked so future
  additions don't need refactoring.
- **Keyboard shortcuts**: the editor's built-in Ctrl/Cmd-Shift-F format
  shortcut works via the `format` callback wiring. No custom keyboard
  shortcuts at the lens level in V1.
- **Focus management**: post-Reset the editor retains focus (CM's own
  behavior on `.content =` dispatch). Post-Run the Run button keeps
  focus (default button-click behavior). No explicit focus manipulation
  in V1.

## Error handling

The study lens has **no try/catch** in V1:

- `api/run` never throws (contract from `api/run.ts`).
- `editor.format()` swallows format-callback exceptions internally (see
  `lib/editing/create-editor.ts` `runFormat`).
- `editor.content = originalCode` cannot throw; it's a CM transaction
  dispatch on a valid editor instance (null-gated at the button).
- `createEditor` inside `useEffect` — the mount effect uses a `cancelled`
  boolean (set `true` in the cleanup function) to guard `setEditor` after
  the factory resolves. If `createEditor` rejects, the rejection surfaces
  via React's unhandled-promise mechanism; the `cancelled` guard has
  already prevented any state mutation on the unmounted component. V1
  accepts this; a future plan adds a dedicated lens-level error boundary if
  needed.

## Data flow summary

```text
Plugin
  └─> <StudyLens code lens lang config />
          │
          ├── Decode: parseLensConfig(config) → object | string | null
          ├── Narrow: → StudyOptions (inline, with defaults + warn)
          ├── Gate:   <BrowserOnly fallback=<pre>{code}</pre>>
          └── Mount effect (client only):
                 │  cancelled = false
                 │
                 ├── await createEditor(code, { language, format: apiFormat })
                 │     if (cancelled) { ed.destroy(); return; }
                 ├── ref.appendChild(editor.el)
                 ├── setEditor(instance)
                 └── cleanup: cancelled = true; instance?.destroy()
                        │
                        └── Toolbar (disabled={!editor || isRunning per button}):
                              ├── [Run]   → setIsRunning(true)
                              │              await run(editor.content, options.engine)
                              │              setIsRunning(false)   // on settle
                              ├── [Format]→ editor.format()
                              └── [Reset] → editor.content = originalCode
```

## Links

- **Plan file:** [`~/.claude/plans/nested-zooming-frog.md`](../../../../../../../../../../../../.claude/plans/nested-zooming-frog.md)
- **Study lens README:** [`./README.md`](./README.md)
- **Study lens types:** [`./types.ts`](./types.ts)
- **Lens-directory DOCS:** [`../DOCS.md`](../DOCS.md)
- **Editor DOCS:** [`../../../lib/editing/DOCS.md`](../../../lib/editing/DOCS.md)
- **Runtime API README:** [`../../../api/README.md`](../../../api/README.md)
