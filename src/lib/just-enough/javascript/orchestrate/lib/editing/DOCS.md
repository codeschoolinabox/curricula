# Editor — Architecture & Design Decisions

## Why a Callback-Based API

The editor wrapper (`createEditor`) accepts pure function callbacks for linting,
hover docs, completions, and formatting feedback. This separates two concerns:

- **Editor**: knows how to display feedback (gutters, tooltips, markers) using
  CodeMirror extensions
- **Consumers**: know what feedback to produce (lint diagnostics, documentation
  entries, completion items)

Neither side knows about the other's internals. The editor translates between
pure data shapes and CodeMirror types. Callbacks never import CodeMirror.

### Alternatives Considered

1. **Direct CodeMirror extensions in consumers**: Rejected because it couples
   consumer logic to a specific editor framework.

2. **Event emitter pattern**: Rejected as over-engineering for the current
   scope. Direct callbacks are simpler and more explicit.

3. **Middleware/plugin registry**: Rejected — we have a small, known set of
   extension points, not an open plugin system.

## No Analysis at Construction

`createEditor` takes an `initialCode: string` directly — no embodiment, no AST,
no validation. The editor's role is display-and-edit; whether the source parses
is irrelevant to opening it for editing. CodeMirror runs its own tokenizer
(independent of acorn) for syntax highlighting. Callers passing arbitrary
strings (including malformed code) get a working editor whose initial content is
exactly that string.

The factory does not couple to embody's lifecycle. Consumers that DO have a
`Snippet` (lenses displaying a frozen embodiment in CM, future analysis-driven
flows) pass `embodiment.source.code` at the call site. Consumers that DON'T (the
orchestrator's editor home base — by the F2 "no embody in editor mode"
invariant) pass the snippet string directly.

## Statefulness Exception

`create-editor.ts` uses a mutable `destroyed` boolean closure because CodeMirror
is inherently stateful (it manages a mutable DOM tree and document state) and
the instance needs a dead-sentinel phase after `destroy()`. This is the only
file in the module that gets an exception to the DEV.md "no mutable closures"
rule.

`detect-language.ts` follows DEV.md strictly: pure functions, no mutation,
frozen lookup table.

## Async Factory

`createEditor` is an async factory — it returns `Promise<EditorInstance>`.
Dynamic language loading, `new EditorView(...)` construction, and
`updateListener` registration (for the `onChange` callback) all happen before
the promise resolves, so the resolved instance is fully initialized and all
methods are unconditionally safe to call. No lazy-init guards, no silent-no-op
pre-init pathways, no promise-based init machinery.

If `onChange` is supplied in options, every `docChanged` transaction fires it
synchronously inside the update listener with the new document content as a
plain string. This is the factory's single change-notification surface — there
is no other event, observable, or callback that fires on document mutation.
Consumers building a 1:1 transaction-to-state contract (e.g. the orchestrator's
F2.5 cache invalidation) build on it directly.

## Post-destroy semantics

After `destroy()` the instance remains callable but behaves as a dead sentinel:

- `content` getter returns `''`
- `content` setter silently drops
- `reset()` / `format()` / `setInterpretedDiagnostics()` are no-ops
- `check()` returns `[]`
- `destroy()` itself is idempotent — double-destroy does not throw
- `el` reference is preserved (same HTMLElement), but CM's internal DOM teardown
  leaves its contents torn down. Do NOT re-append `editor.el` to a new parent
  after destroy.

This lets React components call methods during cleanup races on an
already-resolved instance without timing-sensitive guards. Consumers that need
to cancel an **in-flight** `createEditor(...)` (component unmounts before the
promise resolves) still need an `AbortController` or `cancelled`-flag pattern —
that race is outside the dead-sentinel contract.

The `destroyed` guard is checked once at each method's entry. V1 callbacks
(`format`, `linters[n]`, `docLookup`, `completions`) are synchronous — so no
interleaving point exists between the guard check and the subsequent
`editor.dispatch(...)` calls. If any callback becomes async in a future version,
each internal dispatch site needs either a re-check or a try/catch to survive
concurrent `destroy()`.

## Error Handling

Callbacks are user-provided and may throw. The editor wraps all callback
invocations in try/catch:

- **Format callback throws**: warning logged, editor state unchanged
- **Linter callback throws**: warning logged, that linter skipped, others run
- **Linter returns non-array**: silently ignored
- **onChange callback throws**: warning logged, CodeMirror update cycle
  continues, document state unchanged from CM's perspective. A misbehaving
  consumer of `onChange` cannot destabilize the editor. Consumers depending on
  F2.5-style invariants where every transaction must reach downstream state (the
  orchestrator's cache invalidation) should write their `onChange` defensively,
  since a swallowed throw breaks that propagation.

`toCMDiagnostic` clamps line/column values to valid document ranges to prevent
crashes from out-of-range diagnostics.

## Data Shapes

### LintDiagnostic

Returned by linter callbacks and pushed via `setInterpretedDiagnostics`.
Aligns with JeJ's `Violation` type. The
`'rejection'` severity is mapped to CM's `'warning'` — JEJ-subset violations are
teaching-boundary signals (yellow/orange gutter marker), not syntax errors.
Parse failures (`'error'`) stay red.

```js
{
  line: number,       // 1-based line number
  column: number,     // 0-based column offset
  endLine?: number,   // optional end position
  endColumn?: number,
  severity: 'error' | 'warning' | 'rejection',
  message: string,
  source?: string,    // e.g. 'ESLint', 'JeJ'
}
```

### DocEntry

Returned by the `docLookup` callback. The editor builds a styled tooltip DOM
from this data. Also consumed by the `completions` callback's per-item `entry`
field (see CompletionItem below) — both surfaces share the same shape and the
same DOM lift in `build-tooltip-dom.ts`.

```js
{
  description: string,
  isJEJ: boolean,         // structural in/out boundary; drives the badge
  example?: string,
  commonMistakes?: string[],
  whenToUse?: string,
  whyNotInJej?: string,   // set only on isJEJ: false entries
}
```

`isJEJ === false` triggers the UI's "not in JEJ" badge; the DocEntry does not
store display text. `whyNotInJej` is the notional-machine-grounded exclusion
rationale and renders as its own section in the tooltip when present.

### CompletionRequest

Passed to the `completions` callback. Structured rather than just a prefix
string so JEJ-aware callers can detect dot-receiver context and run
validate/scope analysis without learning about CodeMirror internals. Named
"request" (not "context") because CodeMirror's own `CompletionContext` is a
CM-internal type with `.state` / `.pos` / `.matchBefore()` methods — exposing
that shape to the JEJ side would leak the CM boundary; the editor translates it
into this plain-data form.

```js
{
  prefix: string,         // bare word-fragment under the cursor
  precedingText: string,  // line text from line-start to prefix-start
  fullText: string,       // entire document
}
```

### CompletionItem

Returned by the `completions` callback.

```js
{
  label: string,
  type?: string,    // 'function', 'variable', 'keyword', 'blocked', etc.
  detail?: string,
  info?: string,    // markdown-flavored single-paragraph prose
  entry?: DocEntry, // structured rich payload (see DocEntry above)
  apply?: 'noop',   // sentinel — see below
}
```

When both `info` and `entry` are present, the editing factory prefers `entry`
and lifts it through `build-tooltip-dom.ts` — the same renderer the hover
surface uses. `info` is the legacy plain-paragraph fallback, lifted through
`build-info-dom.ts`. JEJ-aware adapters set `entry` for blocked items and leave
`info` unset. `apply: 'noop'` asks CodeMirror to dismiss the popup on Enter
instead of inserting the label — used together with `type: 'blocked'` so callers
can surface vocabulary in the popup as warning-only items (the learner sees
them, learns why via `info`, but the keystroke does not land). The sentinel
translates to a `closeCompletion(view)` call inside the editor; JEJ-aware
adapters never see the CodeMirror function. See
[`../../../lib/completing/`](../../../lib/completing/) for the JEJ-pedagogical
use of these fields.

### FormatResult

Passed to the `onFormat` callback after formatting completes.

```js
{
  original: string,
  formatted: string,
  changed: boolean,
}
```

## File Structure

The editor was split into single-concept files during TypeScript conversion:

- `types.ts` — all types, callback signatures, data shapes
- `create-editor.ts` — slim factory, mutable closures, public API
- `detect-language.ts` — pure extension-to-language mapping
- `build-extensions.ts` — CM extension builder, language loaders
- `build-tooltip-dom.ts` — hover-doc tooltip DOM construction from DocEntry
- `build-info-dom.ts` — completion-`info` DOM construction from prose string
- `to-cm-diagnostic.ts` — LintDiagnostic to CM Diagnostic translation
- `interpreted-diagnostics.ts` — push-based diagnostics injection seam
  (StateEffect/StateField + the positional supersede merge; carries the
  load-bearing `needsRefresh` mechanics in its module JSDoc)

## Language Detection

`detect-language.ts` exports a single pure function `detectLanguage({ ext })`
that maps file extensions to language identifiers (e.g. `'javascript'`,
`'python'`, `'plaintext'`).

CodeMirror language loaders and function name mappings are private to
`build-extensions.ts` (`CM_LOADERS` and `CM_FUNCTION_NAMES` constants).

Note: `detectLanguage` maps YAML extensions (`.yaml`, `.yml`) but no CodeMirror
language package is loaded for YAML. The editor falls back to no syntax
highlighting for YAML files.

## Testing

`create-editor.test.ts` runs under jsdom (`// @vitest-environment jsdom`
directive at the file top) so CodeMirror 6 `EditorView` construction has a DOM
to attach to. `detect-language.test.ts` stays on the workspace-default `node`
environment — it is a pure language-identifier lookup with no DOM involvement.

**Rule of thumb for new test files in this directory**: add the jsdom directive
iff the test instantiates `new EditorView(...)` or otherwise touches `document`
/ `window`. Otherwise leave it off — node is cheaper.

**Why jsdom is pinned to `^26` in `package.json`**: jsdom `>=27` pulls
`html-encoding-sniffer@6`, which uses CommonJS `require()` to load an ESM-only
module (`@exodus/bytes/encoding-lite.js`). Vitest's CJS loader rejects this with
`ERR_REQUIRE_ESM` during jsdom bootstrap, preventing the test environment from
initializing. jsdom `^26` pulls `html-encoding-sniffer@^4` which is CJS-clean.
Revisit the pin once `html-encoding-sniffer` ships a CJS-compatible 6.x release.

Full CodeMirror integration beyond `EditorView` construction (DOM rendering
fidelity, measured layout, gutter update latency) requires a real browser and is
verified manually via the sandbox demo.

## basicSetup Contents

`basicSetup` from the `codemirror` package already includes: line numbers,
bracket matching, close brackets, fold gutter, highlight selection matches,
search, and other standard features. We do not re-add these. We only add
extensions not in basicSetup: `oneDark` theme, `indentUnit`, `tabSize`, and
callback-driven extensions (linter, hover tooltip, autocompletion).
