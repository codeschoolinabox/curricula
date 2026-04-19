# `study/` — the default meta-lens

The **study lens** is the default rendering mode for a `js:study` code fence
(and the default for bare `js` fences when configured that way). It hosts a
CodeMirror editor plus a toolbar of action buttons, and is the entry point
most learners see when opening a chapter page.

## V1 features (this plan's first slice)

**Three buttons.** No Table, no Trace, no Debug, no Socratize, no LLM.
Those land in follow-on plans (see "Out of scope" below).

- **Run** — executes the editor's current code via `api/run`. V1 is
  async-void: the lens does not render the runner's result. Side-effect
  output (e.g. `console.log`) surfaces in the browser devtools console.
  Later migration: tracer-driven variant that streams events and resolves
  to an in-lens execution history panel.
- **Format** — reformats the editor buffer using `api/format` (JeJ's fixed
  config: tabs, single quotes, semicolons, 80-col wrap). The lens wires
  `api/format` as the `format` callback on `createEditor` at mount and calls
  `editor.format()` on button click; the editor dispatches the transform and
  fires its `onFormat` hook.
- **Reset** — restores the editor buffer to the **original code** (the
  `code` prop received from the plugin). Implemented as
  `editor.content = originalCode`, not `editor.reset()` — the `reset()`
  built-in restores the editor's *construction code*, which happens to equal
  `originalCode` in V1 (we never re-seed the editor mid-life) but we write
  the intent explicitly.

Every button carries a descriptive `aria-label` (e.g. "Run code", "Format
code", "Reset to original"). React `useId` prefixes any lens-instance-scoped
identifiers so two study lenses on the same page don't collide.

## Build-on-top-of

The study lens does **not** reimplement CodeMirror or runtime behavior. It
consumes existing modules:

- [`../../../lib/editing/create-editor.ts`](../../../lib/editing/create-editor.ts)
  — editor factory (async after Phase 1's refactor). Returns a ready editor
  with a pure-function callback pattern for format/linters/docLookup/
  completions.
- [`../../../api/run.ts`](../../../api/run.ts) — async-void runner in V1.
- [`../../../api/format.ts`](../../../api/format.ts) — JeJ formatter.
- [`../../parse-lens-config.ts`](../../../../../../../plugins/study-lenses/parse-lens-config.ts)
  (from the plugin) — shared, fallback-tolerant decoder for the `config`
  prop. Returns object | string | null.

## Per-instance isolation

A single `.md` page may contain N fenced blocks → N independent study lens
instances. Each instance owns:

- its own `originalCode` (captured at mount from `props.code`)
- its own editor instance (created inside the mount `useEffect`, destroyed
  on unmount via a `cancelled` flag pattern that handles in-flight factory
  awaits and React StrictMode double-invocation)
- its own button state
- its own `useId`-derived identifiers

Zero cross-instance communication. No global context.

## Null-gated buttons

Because `createEditor` becomes async (Phase 1 refactor), the lens's React
state holding the editor instance starts `null` and is populated when the
awaited factory resolves inside the mount effect. Action buttons render
with `disabled={!editor}`. No readiness-promise pattern — the factory
guarantees a post-init instance by the time it's visible to React.

The `disabled` attribute visibly flickers for a frame or two during
mount — this is the expected loading state and is confirmed by the Phase 2
sandbox checkpoint for increment 2.4.

## SSR boundary

`<StudyLens>` wraps its real implementation in Docusaurus
[`<BrowserOnly>`](https://docusaurus.io/docs/docusaurus-core#browseronly)
with a `<pre>` fallback showing the `code` prop. The fallback has a
`min-height` sized to prevent hydration layout shift (exact pixel value
tuned during Phase 2 increment 2.2).

## Per-lens options

The lens accepts a `StudyOptions` type (defined in `./types.ts`, written in
Phase 0.5). Current fields:

- `buttons?: Array<'run' | 'format' | 'reset'>` — filter which buttons
  render. Default: all three.
- `engine?: EngineConfig` — runner parameters passed straight through to
  `api/run`. Imported from
  [`../../../lib/evaluating/shared/types.ts`](../../../lib/evaluating/shared/types.ts)
  — currently `{ readonly seconds?: number; readonly iterations?: number }`.
  Default: `{ seconds: 5 }`. `iterations` left undefined so JeJ's own default
  applies. Re-exporting the runner's own type keeps this field honest if
  `EngineConfig` gains fields later.

The `config` prop arriving from the plugin is decoded via the plugin's
shared `parseLensConfig` utility (→ object | string | null), then **narrowed
inline** to `StudyOptions` with defaults applied. No separate
`parseLensOptions` file in V1 (AR-1 decision) — narrowing logic lives
inside `study-lens.tsx`.

Malformed input (JSON that doesn't parse, unexpected type, bare string
returned by `parseLensConfig`) falls back to `StudyOptions` defaults and
emits `console.warn` once. Intentional divergence from the plugin's stricter
throw-on-malformed policy: bad config on one lens should not blow up the
whole page.

**Domain vocabulary** — the terms *original code*, *active code*, *action
button*, *options*, *narrow* come from the plan's ubiquitous-language
glossary; they propagate verbatim into variable names and JSDoc per AGENTS.md
DDD conventions.

## Edge-case behaviors

- **Unknown `lens` prop value** (typo like `'stdy'`, empty string, unknown
  name) — V1 has no dispatch table. The swizzle binds `StudyLens` → this
  component directly, so any `lens` value still renders the study lens
  (default-meta-lens semantics). Future dispatch lands with the
  blanks/parsons/etc. plans.
- **Empty `code`** (`""`) — the editor mounts empty; Reset remains enabled
  and is a behavioral no-op (sets content to `""`, matches current state).
- **Unknown `lang` value** (`'rust'`, `'haskell'`) — passed to
  `createEditor` as `language`; the editor's own `detectLanguage` falls back
  to `'plaintext'` (no syntax highlighting). The Format button's hardcoded
  JS formatter still runs if clicked; expect visually surprising output for
  non-JS languages. A `lang` → `formatter` dispatch is future work.

## Layout

```text
components/lenses/study/
├── README.md        (this file)
├── DOCS.md          (architectural decisions — Phase 0.7)
├── types.ts         (StudyOptions — Phase 0.5)
├── study-lens.tsx   (V2 default export — Phase 2)
├── study-lens-stub.tsx  (throwaway V1 stub — Phase 0.5 swizzle; deleted in Phase 3.2)
└── tests/
    └── study-lens.test.tsx
```

## Out of scope for V1

Each of the below has its own plan file when the time comes:

- **Trace** button — tracer is broken in `just-enough/javascript/`; big
  facelift coming.
- **Debug** button — out of first-slice scope.
- **Table** button — requires the `trace-table` React component (3 types:
  values / steps / operators, with dropdown selector); deferred to its own
  plan.
- **Ask** (LLM-assisted questions) button — future work.
- **Python** runner — `api/run` is JS-only for V1.
- **QASM** (quantum circuits) — outside WtP curriculum scope.
- **Socratize / Predict** — future lens features.
- **Edit persistence** — no `localStorage`; code resets to `originalCode` on
  page reload by design.
- **Open-in** navigation to other lenses — when supported (future plan), it
  replaces the current view in-place or pops a modal, never a route change.

## Links

- **Plan file:** [`~/.claude/plans/nested-zooming-frog.md`](../../../../../../../../../../../../.claude/plans/nested-zooming-frog.md)
- **Plugin README:** [`../../../../../../plugins/study-lenses/README.md`](../../../../../../plugins/study-lenses/README.md)
- **Lens directory overview:** [`../README.md`](../README.md)
- **Editor factory:** [`../../../lib/editing/README.md`](../../../lib/editing/README.md)
- **Runtime API:** [`../../../api/README.md`](../../../api/README.md)
- **Site AGENTS.md:** [`../../../../../../../AGENTS.md`](../../../../../../../AGENTS.md) — including the Sandbox Checkpoints subsection added in this plan.
