# `components/lenses/` — React lens components

This directory hosts React components that the
[`study-lenses` Docusaurus plugin](../../../../../../plugins/study-lenses/README.md)
injects into rendered markdown pages. One subdirectory per lens.

## What the plugin injects

The plugin transforms fenced code blocks whose `lang:lens` info string matches
a configured language into `<StudyLens />` JSX nodes at build time. The nodes
carry this prop shape (see
[`src/plugins/study-lenses/types.ts`](../../../../../../plugins/study-lenses/types.ts)
`StudyLensHastProps`):

```ts
{
  code: string;         // raw source from the fenced block (or sibling file)
  lens: string;         // e.g. 'study', 'blanks', 'parsons' — selects which lens renders
  lang: string;         // e.g. 'js', 'jsx' — language identifier from the fence
  config?: unknown;     // per-lens configuration; object, JSON string, bare string, or absent
}
```

The same tag name (`StudyLens`) handles all lens kinds — the `lens` prop
dispatches to the appropriate implementation. V1 ships only the `study` lens;
the other lenses (blanks, parsons, dropdowns, highlight, variables,
step-throughs, writeme, print, markdown) land in separate plans.

## How `<StudyLens>` is wired

The plugin emits bare `<StudyLens>` tags into the MDX AST. Those tags resolve
to a React component via the swizzled theme file
[`src/theme/MDXComponents.tsx`](../../../../../../theme/MDXComponents.tsx):

```tsx
import MDXComponents from '@theme-original/MDXComponents';
import StudyLens from '@site/lib/welcome-to-programming/just-enough/javascript/components/lenses/study/study-lens';
export default { ...MDXComponents, StudyLens };
```

The swap from V1 mock (inside the plugin) to V2 (this directory) is a
single-line import change in that swizzle file. No plugin change is needed.

## Config-prop decoding (reuse the plugin's helper)

The plugin exports a shared, fallback-tolerant decoder at
[`src/plugins/study-lenses/parse-lens-config.ts`](../../../../../../plugins/study-lenses/parse-lens-config.ts).
Its resolution order:

1. `null`/`undefined` → `null`
2. non-null object → returned as-is
3. JSON string that parses to an object → parsed object
4. string that parses to a non-object (number, array, etc.) → original string
5. string that does not parse → original string
6. any other type (number, function, etc.) → `null`

**Lens components reuse this helper.** Each lens then narrows the decoded
shape to its own per-lens options type (e.g. `StudyOptions`, `BlanksOptions`),
applying defaults for absent or unexpected values. The narrowing step is
lens-specific and currently lives inline in each lens component; extract to a
shared utility only once a second lens needs identical narrowing behavior
(DEV.md "used-once rule").

Per-lens type collision note: the plugin already uses "config" for the
cascade-resolved `lenses[name]: Record<string, unknown>` map. On the
component side we call the narrowed type `*Options` (not `*Config`) to keep
the boundary unambiguous.

## Per-instance state isolation

A single `.md` page may contain N fenced blocks → N independent `<StudyLens>`
instances. Each instance owns its editor, active code, and UI state locally
via React state and refs. **Zero cross-instance communication.** No global
context provider for lens state.

## SSR boundary

Each lens wraps its real implementation in Docusaurus
[`<BrowserOnly>`](https://docusaurus.io/docs/docusaurus-core#browseronly) with
a `<pre>` fallback showing the original code. CodeMirror cannot run in SSR;
the fallback is sized to prevent hydration layout shift. No scattered
`typeof window` guards.

## Directory layout

```text
components/lenses/
├── README.md            (this file)
├── DOCS.md              (architectural sketch — Phase 0.6)
└── study/
    ├── README.md        (study lens overview — Phase 0.3)
    ├── DOCS.md          (study lens architectural sketch — Phase 0.7)
    ├── types.ts         (StudyOptions — Phase 0.5)
    ├── study-lens.tsx   (V2 default export — Phase 2)
    └── tests/
        └── study-lens.test.tsx
```

Additional lenses get their own subdirectories following the same layout.

## Links

- **Plan file:** [`~/.claude/plans/nested-zooming-frog.md`](../../../../../../../../../../../.claude/plans/nested-zooming-frog.md) (first-slice plan)
- **Plugin README:** [`src/plugins/study-lenses/README.md`](../../../../../../plugins/study-lenses/README.md)
- **Plugin types:** [`src/plugins/study-lenses/types.ts`](../../../../../../plugins/study-lenses/types.ts)
- **Plugin decoder:** [`src/plugins/study-lenses/parse-lens-config.ts`](../../../../../../plugins/study-lenses/parse-lens-config.ts)
- **Editor factory:** [`../../lib/editing/README.md`](../../lib/editing/README.md)
- **Runtime API:** [`../../api/README.md`](../../api/README.md)
