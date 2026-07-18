# orchestrate/lib

The region's pure derivation libraries. Every level-aware and roster-aware
computation lives here as pure functions — level logic never lives inside a
React component — and the rendered surfaces stay thin over their outputs.

```text
lib/
  composing/    the joins and the configuration cascade
  validating/   parse-facts assembly + the memoized validate
  marking/      fit marks, per settle and per level
  masking/      mask state over the three surface classes
  honoring/     the focus-request honor path
  recommending/ recommendation ranking
```

Each library documents itself in its own README and DOCS.

## Navigation

- Region root: [`../README.md`](../README.md) — the host surface and the
  region's mechanics; [`../DOCS.md`](../DOCS.md) — the region's architectural
  sketch, which these libraries' sketches zoom into.
