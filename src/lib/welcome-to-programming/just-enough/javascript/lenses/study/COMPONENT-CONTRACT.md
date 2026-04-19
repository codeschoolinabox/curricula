# `<StudyLens>` Component Contract

## Purpose of this document

The `study-lenses` Docusaurus plugin transforms every configured-language
fenced code block (and auto-embeds sibling `.js` files) into a `<StudyLens>`
React component. V1 ships a mock at
[`src/plugins/study-lenses/components/StudyLensMock.tsx`](../../../../../../../plugins/study-lenses/components/StudyLensMock.tsx)
that just shows the props + a syntax-highlighted code block.

V2 replaces that mock with the rich study environment being developed in
this directory. **The plugin's emission pipeline does not change.** This
document is the complete prop/behavior contract the V2 component must
honor to drop in cleanly: rename one import line in
`src/theme/MDXComponents.js` and the new component takes over every
rendering site.

---

## Wire-up (for reference)

One file determines which component React invokes for `<StudyLens>` JSX
in every markdown page site-wide:

**[`src/theme/MDXComponents.js`](../../../../../../../theme/MDXComponents.js):**

```js
import StudyLens from '@site/src/plugins/study-lenses/components/StudyLensMock';
// V2 swap: change the import path to point here:
// import StudyLens from '@site/src/lib/welcome-to-programming/just-enough/javascript/components/lenses/study';
```

No other site-level or plugin-level change is required for the swap.

---

## Emission sites

The plugin emits `<StudyLens>` in three places. All three produce the
**same JSX shape** (same attribute set, same absence of children). The
V2 component needs only one implementation to cover all three.

1. **In-page fenced code block.** A configured-language fence in a `.md`
   or `.mdx` file gets replaced by a `<StudyLens>` node at that position
   in the document. Example: `` ```js:highlight `` → `<StudyLens>`.
2. **Bottom-mode sibling embed.** When `embedSiblings.mode === 'bottom'`
   for a sibling-bearing page, each colocated `.js` file is appended
   to the end of the rendered document as a `<StudyLens>` node.
3. **Tabs-mode sibling embed.** When `embedSiblings.mode === 'tabs'`,
   sibling `.js` files are appended as a single `<Tabs>` wrapper
   containing one `<TabItem>` per sibling, each `<TabItem>` containing
   exactly one `<StudyLens>` child. The `<StudyLens>` inside a `<TabItem>`
   receives the same prop contract as the top-level cases.

---

## Props

The component receives four props. **In the `.md` pipeline, all four
arrive as strings** (MDX JSX attribute values go through a rehype step
that normalizes to strings). The mock accepts `config` as either a
string or an object because `.mdx` files may deliver it object-typed.
V2 should use the existing fallback-tolerant decoder at
[`src/plugins/study-lenses/parse-lens-config.ts`](../../../../../../../plugins/study-lenses/parse-lens-config.ts)
to normalize in one place.

### TypeScript signature

```ts
type StudyLensProps = {
  readonly code?: string;
  readonly lens?: string;
  readonly lang?: string;
  readonly config?: string | Readonly<Record<string, unknown>>;
};
```

All props are optional so the component stays robust if the plugin ever
emits a degenerate node (the mock falls back to `code = ''`, `lens =
'study'`, `lang = 'js'`, `config = undefined`).

### `code: string`

The exact source text from the fenced code block or sibling `.js` file.
No transformations — no trimming, no formatting, no language-specific
normalization. Trailing newlines from the fenced block's content are
preserved.

**Examples:**
- From ` ```js\nlet x = 1;\n``` ` → `code = 'let x = 1;'`
- From a sibling `01-alpha.js` containing `// alpha sibling\nconst a = 1;\n`
  → `code = '// alpha sibling\nconst a = 1;\n'`

The V2 editor should treat this as the **seed content** — the value to
populate the editor buffer on mount. Any "reset" button on the lens
should restore to this exact string (see the V2 README's `Reset` button
spec, which already references this semantic).

### `lens: string`

The resolved lens name. Opaque identifier chosen by the plugin from
this precedence chain (for a fenced code block):

```
fence `:suffix`   >   frontmatter `defaultLens`   >   cascade `defaults[lang]`
```

For a sibling `.js` file:

```
file's top-line `@study-lens <name>` directive   >   cascade `defaults[lang]`
```

**Known values in current content:** `'study'` (the default meta-lens;
editor + run/format/reset), `'highlight'` (read-only syntax view),
`'parsons'` (drag-to-order puzzle), `'blanks'` (fill-in-the-blanks).
V2 will ship only `'study'`; other lenses are separate components
selected by this prop's value.

The V2 component may choose to **only render when `lens === 'study'`**
and fall back to the mock (or a placeholder) for other lens names —
the plugin doesn't care what the component does with unknown lenses.
For the initial V2 slice, a lens-switch at the top of the component
body is a reasonable pattern:

```tsx
if (lens !== 'study') return <StudyLensMock code={code} lens={lens} lang={lang} config={config} />;
```

### `lang: string`

The language identifier from the fence's info string or the sibling
file's extension. One of the **configured languages** (a key in the
resolved `lenses.json`'s `defaults` map). Unconfigured languages never
produce a `<StudyLens>` — they fall through to Docusaurus's default
CodeBlock.

**Known values:** `'js'` (the only configured language at the site-root
default). Chapter-level `lenses.json` files may add `'python'`,
`'html'`, etc. The V2 study lens is initially JavaScript-only per the
V2 README; for `lang !== 'js'` the component should follow the same
pattern as unknown lenses — fall back to the mock or a placeholder.

### `config: string | object | undefined`

The per-lens configuration from the cascade, merged with any per-file
directive JSON. Shape is lens-specific; the plugin stores it as an
opaque payload and doesn't interpret it.

**Pipeline-level behavior:**

- **Absent when both cascade `lenses[lens]` and directive JSON are
  empty.** The component receives `undefined`.
- **Present as a JSON-serialized string** from the `.md` pipeline (what
  you'll see 100% of the time in current content). Example: `config =
  '{"shuffleSeed":42,"distractors":4}'`.
- **Present as a plain string** if an author ever writes a bare-string
  config (some lenses accept `'freeform-token'` directly). Not used by
  the `study` lens's current configuration surface, but the decoder
  handles it.
- **Present as an object** if the `.mdx` pipeline delivers the attribute
  without re-serialization. Not currently exercised, but the decoder
  handles it.

**Do not parse the string manually.** Import and use the shared helper:

```ts
import parseLensConfig from '@site/src/plugins/study-lenses/parse-lens-config';

const parsed = parseLensConfig(config);
// parsed: Readonly<Record<string, unknown>> | string | null
```

Resolution:
- `null` / `undefined` input → returns `null`.
- Object input → returned as-is.
- String that JSON-parses to an object → returned as that object.
- String that JSON-parses to a non-object (number, array, boolean) →
  returned as the original raw string.
- String that doesn't JSON-parse → returned as the raw string.
- Anything else (number, boolean) → returns `null`.

The V2 `study` lens should type-narrow on `parsed`:

```ts
const parsed = parseLensConfig(config);
const lensConfig: Readonly<Record<string, unknown>> =
  parsed !== null && typeof parsed === 'object' ? parsed : {};
```

If `study` ever needs a bare-string config shape (it currently does not),
handle the string branch before narrowing.

**Expected fields for `study` in V1:** none. The V2 README doesn't
specify any study-specific config today. If V2 adds button toggles
(e.g. `showRunButton: false`), those go here. When that happens,
document the expected shape in the V2 README and validate defensively
at the call site — authors write `lenses.json` freehand and may typo
keys.

---

## Props this component will NEVER receive

- `children` — the plugin emits `<StudyLens>` with an empty children
  array. Every rendering site is self-closing JSX.
- Event handlers, refs, className, style, anything from user MDX. The
  plugin controls every emission site; no author-facing JSX calls
  `<StudyLens>` with custom props. Treat the four props above as the
  entire input surface.

---

## Rendering contract (what V2 must preserve)

### Identity

The component takes the four props above and renders a single React tree.
The plugin doesn't care what the tree looks like, with two exceptions:

1. **Must not throw on any valid prop combination.** Including empty
   code (`code === ''`), unknown lens names, and unknown languages.
2. **Must not unmount and remount on prop-only changes.** Authors
   trigger dev-server hot-reload by editing `lenses.json` or sibling
   files; a naive `key={code}` pattern would blow away editor state on
   every cascade re-resolution. Use React state for the live buffer;
   bind the initial value to the `code` prop once at mount.

### Dark mode

Use `@theme/CodeBlock` or Docusaurus's Infima CSS variables for colors.
Do not hardcode light-only colors. The site supports dark mode via
Docusaurus's built-in toggle; the V1 mock inherits correct colors by
rendering a `<CodeBlock>` for its code view. CodeMirror themes that
honor `data-theme="dark"` on `<html>` work too.

### SSR safety

Docusaurus statically generates HTML at build time (`npm run build`).
Any browser-only API (window, document, CodeMirror construction) must
be guarded:

```tsx
import BrowserOnly from '@docusaurus/BrowserOnly';

return (
  <BrowserOnly fallback={<CodeBlock language={lang}>{code}</CodeBlock>}>
    {() => <CodeMirrorEditor code={code} />}
  </BrowserOnly>
);
```

The `fallback` renders in SSG and on first SSR hydration; the real
component takes over client-side.

---

## Mock behavior (V1 current state — reference)

The mock at [`StudyLensMock.tsx`](../../../../../../../plugins/study-lenses/components/StudyLensMock.tsx)
renders:

```tsx
<div data-study-lens={lens}>
  <ul>
    <li>lens: {lens}</li>
    <li>lang: {lang}</li>
    {configSummary && <li>config: {configSummary}</li>}
    <li>code: {code.length} chars</li>
  </ul>
  <CodeBlock language={lang} title={`lens: ${lens}`}>{code}</CodeBlock>
</div>
```

Where `configSummary` is either the raw string (if `parseLensConfig`
returned a string) or a comma-joined list of top-level keys (if it
returned an object).

V2 doesn't need to preserve this UL; it was added purely for manual
verification that every prop flows through correctly. V2 should drop
it and replace the `<CodeBlock>` with the CodeMirror editor + toolbar
per the V2 README.

---

## Side-band documentation

If anything here conflicts with what you observe at runtime, these are
the authoritative sources in priority order:

1. [`src/plugins/study-lenses/code-block-to-jsx.ts`](../../../../../../../plugins/study-lenses/code-block-to-jsx.ts)
   — the emission site for in-page fences and bottom-mode embeds.
   The `attributes` array it builds IS the prop contract.
2. [`src/plugins/study-lenses/remark-study-lenses.ts`](../../../../../../../plugins/study-lenses/remark-study-lenses.ts),
   function `appendTabsEmbed` — the tabs-mode emission site. Per-TabItem
   child uses the same `codeBlockToJsx` call so the inner `<StudyLens>`
   receives identical props.
3. [`src/plugins/study-lenses/parse-lens-config.ts`](../../../../../../../plugins/study-lenses/parse-lens-config.ts)
   — the canonical decoder. Use it. Do not reimplement.
4. [`src/plugins/study-lenses/README.md`](../../../../../../../plugins/study-lenses/README.md)
   — plugin-level spec including the lens/cascade/directive precedence
   rules, the `rehype-raw` gotcha, and the `lenses.json` schema.
5. [`src/plugins/study-lenses/tests/remark-study-lenses.test.ts`](../../../../../../../plugins/study-lenses/tests/remark-study-lenses.test.ts)
   — integration tests exercising every emission path. Reading these
   tests gives concrete examples of each prop value for each scenario.

---

## Drop-in checklist (V2 → production)

Before swapping the MDXComponents import:

- [ ] Component file exports a default React component matching the
      `StudyLensProps` signature above.
- [ ] Renders without throwing for every prop shape described under
      "Props" (empty code, object/string/undefined config, unknown lens,
      unknown lang).
- [ ] Browser-only modules wrapped in `<BrowserOnly>` or conditional
      `typeof window !== 'undefined'` guards.
- [ ] Dark mode honored (Infima vars or Docusaurus theme detection).
- [ ] Hot-reload: editing a sibling `.js` file in dev-server mode
      updates the rendered code without unmounting the editor.
- [ ] Manually verified on the sandbox fixtures at
      `/sandbox/plugin-fixtures/` — every demo page should render
      correctly with the V2 component.
- [ ] `npm run build` succeeds; grep built output for `StudyLens` to
      confirm it appears in the client bundles.

When ready:

```js
// src/theme/MDXComponents.js
import StudyLens from '@site/src/lib/welcome-to-programming/just-enough/javascript/components/lenses/study';
```

The mock at `src/plugins/study-lenses/components/StudyLensMock.tsx`
can stay — it's a useful fallback for lens names the V2 component
doesn't handle yet (e.g. `parsons`, `blanks`).
