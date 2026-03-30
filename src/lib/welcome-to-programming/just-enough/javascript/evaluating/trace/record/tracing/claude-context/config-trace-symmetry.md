# Aran refactor guidance

## Config/Trace Symmetry

The configuration options and structure reflect the structure of their
corresponding trace data. Example:

| Config                                                                              | Trace Log                                                                    |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `{ lang: { bindings: { events: { assign: true }, kind: { declarative: true } } } }` | `[ ... { category: "binding", kind: "declarative", event: "assign" }, ... ]` |
