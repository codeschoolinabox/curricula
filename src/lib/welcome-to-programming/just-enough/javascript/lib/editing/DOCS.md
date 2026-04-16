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

2. **Event emitter pattern**: Rejected as over-engineering for the current scope.
   Direct callbacks are simpler and more explicit.

3. **Middleware/plugin registry**: Rejected — we have a small, known set of
   extension points, not an open plugin system.

## Statefulness Exception

`create-editor.js` uses mutable closures (`let editor`, `let el`,
`let initPromise`) because CodeMirror is inherently stateful — it manages a
mutable DOM tree and document state. This is the only file in the module that
gets an exception to the DEV.md "no mutable closures" rule.

`detect-language.js` follows DEV.md strictly: pure functions, no mutation,
frozen lookup table.

## Async Initialization

The `el` getter triggers editor initialization asynchronously (dynamic language
loading is async). The DOM element is returned synchronously but the CodeMirror
editor is attached after the promise resolves. A promise-based guard prevents
double initialization from rapid `el` access.

Before initialization completes:

- `content` returns the initial code string
- `reset()`, `format()`, `destroy()` are no-ops
- `check()` returns `[]`
- `content` setter silently drops (documented limitation)

## Error Handling

Callbacks are user-provided and may throw. The editor wraps all callback
invocations in try/catch:

- **Format callback throws**: warning logged, editor state unchanged
- **Linter callback throws**: warning logged, that linter skipped, others run
- **Linter returns non-array**: silently ignored

`toCMDiagnostic` clamps line/column values to valid document ranges to prevent
crashes from out-of-range diagnostics.

## Data Shapes

### LintDiagnostic

Returned by linter callbacks. Aligns with JeJ's `Violation` type. The
`'rejection'` severity is mapped to CM's `'error'` for compatibility.

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
from this data.

```js
{
  description: string,
  example?: string,
  category?: string,
  commonMistakes?: string[],
  whenToUse?: string,
}
```

### CompletionItem

Returned by the `completions` callback.

```js
{
  label: string,
  type?: string,      // 'function', 'variable', 'keyword', etc.
  detail?: string,
}
```

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
- `build-tooltip-dom.ts` — tooltip DOM construction from DocEntry
- `to-cm-diagnostic.ts` — LintDiagnostic to CM Diagnostic translation

## Language Detection

`detect-language.ts` exports a single pure function `detectLanguage({ ext })`
that maps file extensions to language identifiers (e.g. `'javascript'`,
`'python'`, `'plaintext'`).

CodeMirror language loaders and function name mappings are private to
`build-extensions.ts` (`CM_LOADERS` and `CM_FUNCTION_NAMES` constants).

Note: `detectLanguage` maps YAML extensions (`.yaml`, `.yml`) but no
CodeMirror language package is loaded for YAML. The editor falls back to
no syntax highlighting for YAML files.

## Testing

`create-editor.test.ts` runs under jsdom (`// @vitest-environment jsdom`
directive at the file top) so CodeMirror 6 `EditorView` construction has a
DOM to attach to. `detect-language.test.ts` stays on the workspace-default
`node` environment — it is a pure language-identifier lookup with no DOM
involvement.

**Rule of thumb for new test files in this directory**: add the jsdom
directive iff the test instantiates `new EditorView(...)` or otherwise
touches `document` / `window`. Otherwise leave it off — node is cheaper.

**Why jsdom is pinned to `^26` in `package.json`**: jsdom `>=27` pulls
`html-encoding-sniffer@6`, which uses CommonJS `require()` to load an
ESM-only module (`@exodus/bytes/encoding-lite.js`). Vitest's CJS loader
rejects this with `ERR_REQUIRE_ESM` during jsdom bootstrap, preventing
the test environment from initializing. jsdom `^26` pulls
`html-encoding-sniffer@^4` which is CJS-clean. Revisit the pin once
`html-encoding-sniffer` ships a CJS-compatible 6.x release.

Full CodeMirror integration beyond `EditorView` construction (DOM rendering
fidelity, measured layout, gutter update latency) requires a real browser
and is verified manually via the sandbox demo.

## basicSetup Contents

`basicSetup` from the `codemirror` package already includes: line numbers,
bracket matching, close brackets, fold gutter, highlight selection matches,
search, and other standard features. We do not re-add these. We only add
extensions not in basicSetup: `oneDark` theme, `indentUnit`, `tabSize`, and
callback-driven extensions (linter, hover tooltip, autocompletion).
