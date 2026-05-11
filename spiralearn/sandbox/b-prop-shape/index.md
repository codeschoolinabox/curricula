---
sidebar_position: 1
---

# B prop-shape verification — 3-prop reshape

Sandbox page for the work-stream B sandbox checkpoint, post-reshape. Each fence
below uses `js:debug-props` (suffix-driven lens dispatch) so the orchestrator's
`LENS_REGISTRY` routes the fence through the `debug-props` meta-lens instead of
mounting the editor home base.

The debug-props lens echoes its received props as on-screen panels. The plugin
emits the **three-prop public API** — `snippet`, `lens?`, `configs?` — with any
per-fence URL-style query **deep-merged INTO `configs.lenses["debug-props"]`**
at emission time. The orchestrator then computes
`module.config() ⊕ configs.lenses?.["debug-props"]` (two-tier chain) and feeds
the result to the lens as the `config` prop.

A sibling `lenses.json` in this directory seeds `configs.lenses["debug-props"]`
with `cascadeFlag: true` and `cascadeNote: "from b-prop-shape/lenses.json"` so
every fence on this page ships a non-empty merged entry. Fences with no `?query`
suffix carry only the cascade values; fences with a query carry the deep-merge
of cascade + query (query wins on conflict).

What to verify visually (open the rendered page in the dev server):

- Each fence renders four `<section data-debug-panel="…">` panels: `snippet`,
  `status`, `validation`, `config`.
- The `snippet` panel's `<pre>` content is the **embodiment's** `source.code`
  (sentinel-mock dispatched value, e.g. the literal `"OK"` for the first fence).
- The `status` panel JSON shows the embody pipeline status.
- The `validation` panel shows the JeJ + determinism + IO flags + violation
  count.
- The `config` panel shows the orchestrator-resolved config:
  `module.config() ⊕ configs.lenses["debug-props"]`. Every fence on this page
  sees at least the cascade values (`cascadeFlag`, `cascadeNote`); fences with a
  query also see the query keys.

Open this page via `npm start` (Docusaurus auto-routes `spiralearn/sandbox/`);
React DevTools inspection of the `<StudyLenses>` node confirms the **three-prop
shape**: `snippet`, `lens`, and `configs`. There is no `config` prop at the
public surface — the per-fence override has been folded into
`configs.lenses["debug-props"]`.

## Bare lens, no query (cascade-only)

Plugin emits `<StudyLenses snippet="OK" lens="debug-props" configs={…}>` where
`configs.lenses["debug-props"]` carries the cascade values verbatim. Config
panel shows
`{ cascadeFlag: true, cascadeNote: "from b-prop-shape/lenses.json" }`.

```js:debug-props
OK
```

## Single query parameter (string value) — merged onto cascade

Plugin emits `<StudyLenses snippet="OK" lens="debug-props" configs={…}>` where
`configs.lenses["debug-props"]` is the deep-merge of the cascade
(`{ cascadeFlag, cascadeNote }`) and the parsed query (`{ stepDelay: "500" }`).
Config panel shows all three keys. Note: the query value is a **string** —
URL-style query parsing does no numeric coercion; lenses coerce at config-read
time.

```js:debug-props?stepDelay=500
OK
```

## Fence-wins-on-conflict (query overrides cascade)

The cascade has `cascadeFlag: true`. The fence query `?cascadeFlag=fence-wins`
sets the same key with a different value. Plugin merges INTO
`configs.lenses["debug-props"]` with query as the winner. Config panel shows
`cascadeFlag: "fence-wins"` (string, not boolean — query is URL-semantic) plus
the surviving `cascadeNote`.

```js:debug-props?cascadeFlag=fence-wins
OK
```

## Multi-key query joined by `&`

Plugin emits a deep-merged `configs.lenses["debug-props"]` containing cascade
values + both query keys. Config panel shows
`{ cascadeFlag: true, cascadeNote: "...", a: "1", b: "2" }`.

```js:debug-props?a=1&b=2
OK
```

## Comma-array query value

Plugin emits a deep-merged entry with the array verbatim. Config panel shows
`cols: ["value", "steps"]` plus the cascade keys.

```js:debug-props?cols=value,steps
OK
```

## Boolean-true (no `=`) and empty-string (`=` with nothing) edges

Plugin merges `{ flag: true, empty: "" }` over the cascade entry.

```js:debug-props?flag&empty=
OK
```

## Sentinel mock — embodiment-pipeline failure surfacing

The `FAIL_AT_PARSE` sentinel routes through the Phase A embody mock to produce
an embodiment whose `status.parsed === false` and
`errors.kind === 'SyntaxError'`. The status panel surfaces this; no unhandled
throw — the orchestrator routes the embodiment regardless of pipeline outcome.

```js:debug-props
FAIL_AT_PARSE
```

---

After visual verification: this page stays committed as documentation of
work-stream B's sandbox checkpoint. The `lenses.json` here seeds the cascade for
the `debug-props` lens so the React DevTools inspection has a non-empty
`configs` payload to inspect for the 3-prop reshape.
