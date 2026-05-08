---
sidebar_position: 1
---

# B prop-shape verification

Sandbox page for B.8 — the work-stream B sandbox checkpoint. Each
fence below uses `js:debug-props` (suffix-driven lens dispatch) so
the orchestrator's `LENS_REGISTRY` routes the fence through the
`debug-props` meta-lens instead of mounting the editor home base.

The debug-props lens echoes its received props as on-screen panels.
What to verify visually (open the rendered page in the dev server):

- Each fence renders four `<section data-debug-panel="…">` panels:
  `snippet`, `status`, `validation`, `config`.
- The `snippet` panel's `<pre>` content is the **embodiment's**
  `source.code` (sentinel-mock dispatched value, e.g. the literal
  `"OK"` for the first fence).
- The `status` panel JSON shows the embody pipeline status.
- The `validation` panel shows the JeJ + determinism + IO flags +
  violation count.
- The `config` panel shows either `(empty)` (when no per-fence
  query nor cascade `lenses.<name>` resolved) or the merged
  resolved config.

Open this page via `npm start` (Docusaurus auto-routes
`spiralearn/sandbox/`); React DevTools inspection of the
`<StudyLenses>` node confirms the four-prop shape arrived.

## Bare lens, no query, no cascade override

Plugin emits `<StudyLenses snippet="OK" lens="debug-props">`. The
orchestrator dispatches to `debug-props` with `module.config()`
(empty `{}`). Config panel reads `(empty)`.

```js:debug-props
OK
```

## Single query parameter (string value)

Plugin emits `<StudyLenses snippet="OK" lens="debug-props"
config={{stepDelay:"500"}}>`. Config panel shows `{ stepDelay: "500" }`
JSON-stringified. Note: the value is a **string** — URL-style query
parsing does no numeric coercion; lenses coerce at config-read time.

```js:debug-props?stepDelay=500
OK
```

## Multi-key query joined by `&`

Plugin emits `<StudyLenses snippet="OK" lens="debug-props"
config={{a:"1",b:"2"}}>`. Config panel shows both keys.

```js:debug-props?a=1&b=2
OK
```

## Comma-array query value

Plugin emits `<StudyLenses snippet="OK" lens="debug-props"
config={{cols:["value","steps"]}}>`. Config panel shows the array
verbatim — comma-split inside the query value.

```js:debug-props?cols=value,steps
OK
```

## Boolean-true (no `=`) and empty-string (`=` with nothing) edges

Plugin emits `<StudyLenses snippet="OK" lens="debug-props"
config={{flag:true,empty:""}}>`.

```js:debug-props?flag&empty=
OK
```

## Sentinel mock — embodiment-pipeline failure surfacing

The `FAIL_AT_PARSE` sentinel routes through the Phase A embody mock
to produce an embodiment whose `status.parsed === false` and
`errors.kind === 'SyntaxError'`. The status panel surfaces this; no
unhandled throw — the orchestrator routes the embodiment regardless
of pipeline outcome.

```js:debug-props
FAIL_AT_PARSE
```

---

After visual verification: this page stays committed as
documentation of B's sandbox checkpoint. No cascade `lenses.json`
override is needed (the `:debug-props` suffix populates `lens`
directly per AR-1 locked decision 1; cascade `defaults` does not).
