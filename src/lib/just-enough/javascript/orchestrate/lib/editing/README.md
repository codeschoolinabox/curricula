# Editor

CodeMirror 6 editor wrapper for the Welcome to Programming environment.

## What This Module Does

Provides a `createEditor` factory function that returns a ready-to-use code
editor instance. The editor handles:

- Syntax highlighting (dynamic language loading)
- Code editing with standard keybindings
- Tab/indent configuration
- Format-on-shortcut (Ctrl/Cmd-Shift-f)

All pedagogical features (linting, hover docs, autocompletion) are injected via
**pure function callbacks**. The editor knows how to display feedback (gutters,
tooltips, markers) but does not know what the feedback means.

## Files

| File                    | Purpose                                      |
| ----------------------- | -------------------------------------------- |
| `types.ts`              | All types, callback signatures, data shapes  |
| `create-editor.ts`      | `createEditor(embodiment, options)` factory  |
| `detect-language.ts`    | File extension to language mapping (pure)    |
| `build-extensions.ts`   | CodeMirror extension builder (internal)      |
| `build-tooltip-dom.ts`  | Tooltip DOM construction (internal)          |
| `to-cm-diagnostic.ts`   | Diagnostic data translation (internal)       |

## Usage

`createEditor` is an **async factory** — it resolves after dynamic language
loading and CodeMirror `EditorView` construction. The resolved instance is
fully initialized; all methods are unconditionally safe to call.

Bare editor (no callbacks):

```ts
import createEditor from './create-editor.js';
import embody from '../../../embody/index.js';

// Phase A: embody() accepts named scenarios. Phase B: accepts any source string.
// The editor renders embodiment.source.code either way.
const editor = await createEditor(embody('OK'), { language: 'javascript' });
document.body.appendChild(editor.el);
```

With linting and doc lookup callbacks:

```ts
import createEditor from './create-editor.js';
import embody from '../../../embody/index.js';

const editor = await createEditor(embody('OK'), {
  language: 'javascript',
  linters: [myLinterFn],
  docLookup: myDocFn,
});

// After destroy(), the instance becomes a dead sentinel:
// content returns '', methods no-op, double-destroy is idempotent.
editor.destroy();
```

## Callback Pattern

The editor accepts pure functions as callbacks. It wraps them into CodeMirror
extensions internally. Callbacks never see or return CodeMirror types.

| Callback      | Signature                      | Wraps into                   |
| ------------- | ------------------------------ | ---------------------------- |
| `format`      | `(code) => formattedCode`      | `editor.dispatch()`         |
| `linters[n]`  | `(code) => LintDiagnostic[]`   | `linter()` + `lintGutter()` |
| `docLookup`   | `(word) => DocEntry \| null`   | `hoverTooltip()`            |
| `completions` | `(prefix) => CompletionItem[]` | `autocompletion()`          |
| `onFormat`    | `(result) => void`             | Called after format          |

See `DOCS.md` for architecture decisions and data shape definitions.
See `types.ts` for all type definitions.
