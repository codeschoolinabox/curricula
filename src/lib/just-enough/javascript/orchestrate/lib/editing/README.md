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

| File                   | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| `types.ts`             | All types, callback signatures, data shapes   |
| `create-editor.ts`     | `createEditor(initialCode, options)` factory  |
| `detect-language.ts`   | File extension to language mapping (pure)     |
| `build-extensions.ts`  | CodeMirror extension builder (internal)       |
| `build-tooltip-dom.ts` | Hover-doc tooltip DOM construction (internal) |
| `build-info-dom.ts`    | Completion-`info` DOM construction (internal) |
| `to-cm-diagnostic.ts`  | Diagnostic data translation (internal)        |

## Usage

`createEditor` is an **async factory** — it resolves after dynamic language
loading and CodeMirror `EditorView` construction. The resolved instance is fully
initialized; all methods are unconditionally safe to call.

The first argument is the initial source code as a plain string. The editor
takes no other knowledge of the snippet — no AST, no parse status, no
validation. CodeMirror runs its own tokenizer for syntax highlighting.

Bare editor (no callbacks):

```ts
import createEditor from './create-editor.js';

const editor = await createEditor('let x = 5;', { language: 'javascript' });
document.body.appendChild(editor.el);
```

With an onChange listener (single-writer dispatch surface):

```ts
import createEditor from './create-editor.js';

const editor = await createEditor('let x = 5;', {
	language: 'javascript',
	onChange: (next) => console.log('user edited:', next),
});
```

With linting and doc lookup callbacks:

```ts
import createEditor from './create-editor.js';

const editor = await createEditor('let x = 5;', {
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

| Callback      | Signature                    | Wraps into                          |
| ------------- | ---------------------------- | ----------------------------------- |
| `onChange`    | `(next: string) => void`     | `EditorView.updateListener.of(...)` |
| `format`      | `(code) => formattedCode`    | `editor.dispatch()`                 |
| `linters[n]`  | `(code) => LintDiagnostic[]` | `linter()` + `lintGutter()`         |
| `docLookup`   | `(word) => DocEntry \| null` | `hoverTooltip()`                    |
| `completions` | `(req) => CompletionItem[]`  | `autocompletion()`                  |
| `onFormat`    | `(result) => void`           | Called after format                 |

`onChange` fires **synchronously** inside each `docChanged` transaction with the
new document content as a plain string. It is the single mechanism by which
consumers receive learner edits. Each keystroke produces exactly one `onChange`
invocation — no batching, no debouncing — which is load-bearing for the
orchestrator's F2.5 cache-invalidation invariant (see
[`../../editor/README.md`](../../editor/README.md) § Conventions).

`completions` receives a structured `CompletionRequest`
(`{prefix, precedingText, fullText}`) rather than just the word prefix, so
JEJ-aware callers can detect dot-receiver context and run the validate/scope
analysis they need without learning about CodeMirror internals. Returned
`CompletionItem`s can opt into two JEJ-pedagogical extensions: `info?: string`
(markdown-flavored prose surfaced as a styled DOM tooltip via
`build-info-dom.ts`) and `apply?: 'noop'` (a sentinel that asks CodeMirror to
dismiss the popup on Enter instead of inserting the label — used for items the
popup surfaces as warnings rather than insertions). Both extensions are
JEJ-blind on the editor side: the editor knows how to honor the sentinel and
lift the prose into DOM; it does not know what makes the item "warning-worthy".
The JEJ semantics live in the caller (see
[`../../../lib/completing/`](../../../lib/completing/)).

See `DOCS.md` for architecture decisions and data shape definitions. See
`types.ts` for all type definitions.
