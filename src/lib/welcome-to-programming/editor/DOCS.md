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

## Language Detection

`detect-language.js` exports a single pure function `detectLanguage({ ext })`
that maps file extensions to language identifiers (e.g. `'javascript'`,
`'python'`, `'plaintext'`).

CodeMirror language loaders and function name mappings are private to
`create-editor.js` (`CM_LOADERS` and `CM_FUNCTION_NAMES` constants).

Note: `detectLanguage` maps YAML extensions (`.yaml`, `.yml`) but no
CodeMirror language package is loaded for YAML. The editor falls back to
no syntax highlighting for YAML files.

## Testing

Tests run in node (no DOM). Pre-initialization API surface and error handling
are tested. Full CodeMirror integration (DOM rendering, extension wiring,
gutter updates) requires a browser environment and is verified manually.

## basicSetup Contents

`basicSetup` from the `codemirror` package already includes: line numbers,
bracket matching, close brackets, fold gutter, highlight selection matches,
search, and other standard features. We do not re-add these. We only add
extensions not in basicSetup: `oneDark` theme, `indentUnit`, `tabSize`, and
callback-driven extensions (linter, hover tooltip, autocompletion).
