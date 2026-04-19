# `components/lenses/` — architectural sketch

This document captures the "why" — structural constraints, phase boundaries,
and decisions — for the React lens components that the study-lenses plugin
injects into markdown pages. It is **not** an API reference; types.ts +
READMEs handle that.

## Bounded context

The lens directory is the **React component layer** that sits downstream of
three upstream modules:

- The **plugin** (`src/plugins/study-lenses/`) — a build-time MDAST
  transformer that emits `<StudyLens>` JSX nodes. Opaque to component
  internals.
- The **editor factory** (`lib/editing/`) — a CodeMirror 6 wrapper exposing
  pure-callback extensions. Async after Phase 1's refactor.
- The **runtime API** (`api/`) — `run`, `format`, etc. Already async.

Lens components **consume** these three surfaces. They do not reimplement
any of them. They do not expose an API beyond their own default export
(consumed only by the theme swizzle).

## Lifecycle phases (conceptual; not function names)

Every lens component — not just the study lens — runs through these
phases on mount. The study lens is the first implementation; the same
phases apply to blanks, parsons, etc.

1. **Decode** — receive the plugin's `config` prop and pass it through
   the plugin's shared `parseLensConfig` utility (imported from
   `src/plugins/study-lenses/parse-lens-config.ts`). Result is
   `object | string | null`.
2. **Narrow** — apply lens-specific defaults and cast/validate to the
   lens's `*Options` type. Malformed input → defaults + `console.warn`
   once. This phase is **inline in each lens** — no shared helper in V1.
3. **Gate SSR** — wrap the real implementation in Docusaurus
   `<BrowserOnly>`. The server pass renders a `<pre>` fallback with the
   `code` prop and a `min-height` sized to prevent hydration shift.
4. **Mount async** — inside a `useEffect` (client only by SSR gate), await
   `createEditor(code, options)`. Use a `cancelled` flag to handle
   unmount-during-await and React StrictMode double-invocation.
5. **Register** — append `editor.el` to a React-`ref`'d container; store
   the editor instance in React state.
6. **Render toolbar** — action buttons render with `disabled={!editor}`.
   No readiness-promise pattern — the factory guarantees post-init by the
   time React state is non-null.
7. **Handle actions** — button handlers read from / dispatch to the
   editor instance directly. All editor methods are unconditionally safe
   once the instance is visible to React.
8. **Teardown** — on unmount or dep change, cancel any in-flight factory
   and call `instance.destroy()`. React state is not re-used across
   teardowns.

## Structural constraints

- **Per-instance state isolation.** Each `<StudyLens>` instance owns its
  own editor, its own options, its own UI state. Zero cross-instance
  communication. No global context provider. A single page with N fences
  produces N independent lenses.
- **SSR boundary is at the lens root.** No `typeof window` guards
  scattered through lens internals. The server pass sees only the fallback
  `<pre>`; the client pass runs the full mount effect.
- **Effect dependency arrays are minimal.** Mount effects depend on
  `[code, language]` in V1. Any future option that should trigger re-mount
  is added explicitly with a `// WHY:` comment.
- **Null-gated buttons during async mount.** `disabled={!editor}` is the
  single source of truth. No separate loading state. No separate
  ready-promise pattern.
- **Editor lifecycle is per-mount.** `createEditor` is called **inside**
  `useEffect`, never at module scope. Each mount gets a fresh editor.
- **Action buttons are single-responsibility.** Run calls `api/run`;
  Format calls `editor.format()`; Reset writes `editor.content =
  originalCode`. No button handler reads OR writes more than one of these
  boundaries.

## Out of scope (explicitly)

- **Cross-lens communication.** If blanks and parsons need to share state
  in a future plan, that plan introduces an explicit mechanism — not
  lifted from here.
- **Persistence.** No `localStorage`, no URL state. Code resets to
  `originalCode` on page reload by design.
- **Output rendering in V1.** The runner's `RunResult` is discarded.
  Side-effect output surfaces in the browser devtools console. A future
  plan migrates to a tracer-driven variant with an in-lens history panel.
- **Multi-language formatting dispatch.** V1 hardcodes `api/format` as
  the editor's `format` callback. A future plan introduces a
  `lang → formatter` map.
- **Runtime lens dispatch.** V1's swizzle binds `StudyLens` → one
  component. A future plan introduces a dispatch table keyed by the
  `lens` prop to route blanks/parsons/etc.
- **Error boundaries.** V1 does not install per-lens React error
  boundaries. A broken lens crashes its instance only (React boundary
  behavior by default is sufficient until evidence demands finer control).

## Decisions that will be hard to change later

These are **irreversible once shipped** and warrant care in Phase 2:

1. **Prop shape** — `{ code, lens, lang, config }` — matches plugin
   `StudyLensHastProps` and cannot diverge without a plugin change.
2. **Naming: "options" (component) vs "config" (plugin).** Changing
   later means find-and-replace across every lens, every test, every
   DOCS.md, every commit message.
3. **Reset semantics = `editor.content = originalCode`** (not
   `editor.reset()`). The two happen to coincide in V1 but are distinct
   concepts; the documented choice preserves the distinction for future
   re-seed scenarios.
4. **Async-void Run in V1.** Consumers currently cannot observe run
   output in-lens. Migrating to event-streaming tracers later is purely
   additive.
5. **Hardcoded JS formatter on mount.** Multi-language dispatch later
   requires touching every lens's mount effect — or extracting a shared
   `createStudyEditor(code, lang)` helper when the second language lands.

## Why these decisions, briefly

- **Drop enliven entirely**: the old SL's VFS model conflicted with
  Docusaurus per-page injection; per-instance local state is simpler and
  sufficient.
- **`<BrowserOnly>` not defensive guards**: CodeMirror cannot SSR; the
  explicit boundary is cheaper than `typeof window` scattered at every
  DOM touch.
- **No shared `parseLensOptions` utility in V1**: DEV.md "used-once
  rule" — extract only when a second lens demonstrates identical
  narrowing. V1 has one lens.
- **`engine: EngineConfig` imported, not cloned**: future-proofs the
  lens surface against runner changes.
- **Narrowing happens inside the lens, not in a wrapper**: keeps the
  lens's options surface discoverable in one file (`study-lens.tsx` +
  `types.ts`) rather than split across a decoder file.

## Links

- **Plan file:** [`~/.claude/plans/nested-zooming-frog.md`](../../../../../../../../../../../.claude/plans/nested-zooming-frog.md)
- **README (this directory):** [`./README.md`](./README.md)
- **Study lens README:** [`./study/README.md`](./study/README.md)
- **Plugin DOCS:** [`../../../../../../plugins/study-lenses/DOCS.md`](../../../../../../plugins/study-lenses/DOCS.md)
- **Editor DOCS:** [`../../lib/editing/DOCS.md`](../../lib/editing/DOCS.md)
