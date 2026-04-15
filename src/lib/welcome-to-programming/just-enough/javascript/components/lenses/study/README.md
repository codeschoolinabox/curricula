# `components/lenses/study/` — V2 target

This directory is the **V2 target** for the rich study lens — the
CodeMirror-backed editor with run/format/trace/debug/socratize/lint buttons
and the ability to pop up other lenses on the current editor code. It is
intentionally empty during V1.

## Why empty?

The [`study-lenses` Docusaurus plugin](../../../../../../../plugins/study-lenses/README.md)
wires fenced JS code blocks and sibling `.js` files to a `<CodeLens>` React
component. V1 ships a **mock** of that component inside the plugin itself
(at [`src/plugins/study-lenses/components/`](../../../../../../../plugins/study-lenses/components/))
so the pipeline can be validated end-to-end before the rich component
exists.

When V2 begins, the rich implementation lands here. The swap happens in
the swizzled theme file at
[`src/theme/MDXComponents.js`](../../../../../../../theme/MDXComponents.js):
it re-exports `CodeLens` and `CodeLensTabs` pointed at whichever
implementation is current. No plugin change is needed — the plugin emits
bare tag names.

## Planned surface (for orientation, not locked)

See [`../../../plann.txt`](../../../plann.txt) for the original sketch. The
rich component is expected to:

- host a CodeMirror 6 editor built from
  [`../../../lib/editing/create-editor.ts`](../../../lib/editing/create-editor.ts)
- expose a control panel with Format, Run, Debug, Trace, Predict, Socratize,
  Lint buttons
- gate dynamic actions (Run, Debug, Trace, Predict, Open-in) behind the
  code being format-clean and parse-clean
- support popping up non-editor lenses (blanks, parsons, loggercise,
  trace-tables, …) on the current editor buffer
- receive its config via the fallback-tolerant `parseLensConfig` helper
  (see the plugin README's "Config-prop serialization" section)

## Links

- **Up:** [plugin README](../../../../../../../plugins/study-lenses/README.md)
  · [site root AGENTS.md](../../../../../../../../AGENTS.md)
- **V1 mock (current):** [`src/plugins/study-lenses/components/`](../../../../../../../plugins/study-lenses/components/)
- **Sketch:** [`../../plann.txt`](../../plann.txt)
