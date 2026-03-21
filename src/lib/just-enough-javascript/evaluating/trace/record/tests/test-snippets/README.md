# Test Snippets

Tiny JS programs for cataloging every distinct trace entry shape the Aran tracer
produces.

Each snippet targets specific advice operations. Paste into `sandbox.html`'s
`trace()` call and inspect the raw `JSON.stringify(steps)` output in the browser
console.

## What this is for

The `postProcess` function must parse raw trace output into structured steps.
These snippets ensure we've seen every entry format before writing the parser.
