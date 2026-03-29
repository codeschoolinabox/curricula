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

| File                 | Purpose                                   |
| -------------------- | ----------------------------------------- |
| `create-editor.js`   | `createEditor(code, options)` factory     |
| `detect-language.js` | File extension to language mapping (pure) |

## Usage

```js
import createEditor from './create-editor.js';

// Bare editor (no callbacks)
const editor = createEditor('let x = 5;', { language: 'javascript' });
document.body.appendChild(editor.el);

// With linting and doc lookup callbacks
const editor = createEditor('let x = 5;', {
  language: 'javascript',
  linters: [myLinterFn],
  docLookup: myDocFn,
});
```

## Callback Pattern

The editor accepts pure functions as callbacks. It wraps them into CodeMirror
extensions internally. Callbacks never see or return CodeMirror types.

| Callback      | Signature                      | Editor wraps into             |
| ------------- | ------------------------------ | ----------------------------- |
| `format`      | `(code) => formattedCode`      | `editor.dispatch()`           |
| `linters[n]`  | `(code) => LintDiagnostic[]`   | `linter()` + `lintGutter()`   |
| `docLookup`   | `(word) => DocEntry \| null`   | `hoverTooltip()`              |
| `completions` | `(prefix) => CompletionItem[]` | `autocompletion()`            |
| `onFormat`    | `(result) => void`             | Called after format           |

See `DOCS.md` for architecture decisions and data shape definitions.
