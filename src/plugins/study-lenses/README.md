# `study-lenses`

A build-time Docusaurus plugin that pre-processes markdown content in the
`@spiralearn` curriculum so that every fenced code block renders as a
`<StudyLenses>` React component, and every `.js` file co-located with an
`index.md` page auto-embeds into that page.

V1 is **pipeline plumbing with a mock component**: the `<StudyLenses>` emitted by
the plugin is a styled `<pre><code>` with labels showing the lens and language
identifiers. The rich study environment (CodeMirror editor, trace table,
run/debug/socratizing) is V2.

**Architectural framing:** this is a _bounded subsystem_ — its own
documentation, domain model, and workflow conventions — but _not_ a physical
npm package. It lives inside the Docusaurus site with no separate `package.json`
or build step. Its `.ts` sources are loaded directly by `docusaurus.config.ts`
via Docusaurus's native TypeScript config support.

## Status

- Phase 0 (DDD + architectural sketch): **in progress**
- Phase 1 (TDD increments): not started
- Phase 2 (quality gate + AR-5): not started

Plan file: [`transient-puzzling-crane.md`](../../../../../.claude/plans/transient-puzzling-crane.md)
(ambient; may not exist in every checkout).

## Glossary

The terms below are **ubiquitous** — they propagate verbatim into function
signatures, type names, error messages, test descriptions, and JSDoc. Adding a
synonym anywhere in the code is a bug.

- **Lens** — a named rendering mode for a code sample. Opaque string
  identifier. `study` is the **default meta-lens** — an editor with
  run/format/trace/debug/socratize/lint buttons plus the ability to pop up
  other lenses on the current editor code. Non-editor lenses (`highlight`,
  `blanks`, `parsons`, etc.) are exercise-generators from the code. A fenced
  code block with no lens suffix resolves to `study`.
- **Fenced code block** — a markdown code block delimited by triple backticks.
  The MDAST `code` node type. Standard CommonMark term.
- **Code fence** — the triple-backtick delimiters themselves, as opposed to
  the enclosed content.
- **Info string** — the text on the opening fence line after the backticks
  (`js`, `js:highlight`, `python`). Standard CommonMark term.
- **Language** — the identifier before the colon in an info string (`js`,
  `python`, `html`). Determines the default lens lookup.
- **Configured language** — a language identifier that has a corresponding
  key in the resolved configuration's `defaults` map. **Only configured
  languages trigger fence transformation**; unconfigured languages (e.g.
  `txt`, `bash`, `diff`) fall through to Docusaurus's default code-block
  rendering. This avoids footguns like replacing an ASCII diagram in a
  `txt` fence with a plaintext editor.
- **Lens suffix** — the text after the colon in a fence info string. A
  bare suffix names a single lens (`js:highlight`). A comma-separated
  suffix names zero or more transforms followed by a terminal lens
  (`js:format,loopGuard,editor` → transforms `[format, loopGuard]`, lens
  `editor`). The last token is always the lens; earlier tokens are
  transforms in authored order.
- **Cascade** — the root → leaf directory walk that collects and merges
  `lenses.json` files.
- **Resolved config** — the frozen, deep-merged output of the cascade for a
  specific directory.
- **Content root** — the absolute path of a docs instance's content directory
  (the cascade walk stops here; the remark plugin ignores files outside it).
- **Embed mode** — `"off" | "bottom" | "tabs"` — how sibling `.js` files are
  appended to a sibling-bearing page.
- **Sibling** — a `.js` file found under a sibling-bearing page's directory,
  from the directory itself down to (but not including) the next nested
  sibling-bearing page.
- **Sibling-bearing page** — the learner-facing markdown file a directory
  renders as. Precedence: `index.md` if present; otherwise `README.md`. When
  both exist, `README.md` is contributor-facing (GitHub-style, not rendered)
  and `index.md` is the learner page (rendered, sibling-bearing).
- **Ignore prefix** — a directory-name prefix that causes the sibling walk to
  skip that entire subtree. Configured per-instance under
  `embedSiblings.ignorePrefixes`. Site-root config sets `["staging-"]`.
- **Page boundary** — a nested sibling-bearing page encountered during the
  sibling walk. Descent halts at this boundary; files beyond belong to that
  other page.
- **Exercise set** — a group of related exercises under a subchapter,
  physically colocated in a directory whose name starts with a configured
  **exercise-set prefix** (e.g. `sl-01-while-loops/`, `sl-02-do-while-loops/`
  under a parent `control-flow/` chapter). Each exercise set is a
  sibling-bearing page in its own right.
- **Exercise-set prefix** — the directory-name prefix that marks a folder
  as an exercise set. Configured at the content-root `lenses.json` under
  the top-level `exerciseSetPrefixes` key. Site-wide convention: `sl-`.
  Directories matching a prefix receive sidebar-label stripping (strip
  prefix → strip numeric ordering → kebab-case to Title Case).
- **Directive block** — a comment form (a line-comment run or a
  block comment) in a sibling `.js` file that contains the
  `@study-lens` tag. May appear in the file's leading comment block
  (before any code) OR its trailing comment block (after the last
  non-comment statement); middle-of-file placement is inert. The
  directive block is parsed for lens name + optional JSON config, and
  removed from the code that feeds into `<StudyLenses>` — learners see
  only the exercise body.
- **Leading comment block** — the contiguous prefix of a `.js` file
  made of blank lines, an optional shebang, line comments, and block
  comments, up to the first non-blank/non-comment/non-shebang line.
- **Trailing comment block** — the mirror region at the end of a
  `.js` file: blank lines, line comments, and block comments after
  the last non-comment statement, through EOF.
- **Sibling group** — a partition of a page's siblings by their first
  path segment. Root-level files (no `/` in their label) form the
  **root group**; files under a subdirectory share the subdirectory
  name as their **group key**. Each group renders as a separate
  `<Tabs>` element (tabs mode) or a separate block of `<StudyLenses>`
  nodes (bottom mode), preceded by a heading.
- **Group key** — the first path segment of a sibling's relative-path
  label. Siblings sharing a group key are rendered together.
  Root-level files have an empty group key.
- **Group-relative label** — a sibling's label with its group-key
  prefix stripped, used as the tab label within that group's `<Tabs>`.
  Example: `sl-01-variables/01-declare` becomes tab label `01-declare`
  inside the `Variables` group.

## What this plugin does

Three independent subsystems share one config file (`lenses.json`). They
fire at different points in Docusaurus's build lifecycle:

### Subsystem 1 — Remark transformer (MDAST transformation)

**Input:** the MDAST tree of a `.md`/`.mdx` file being compiled, plus the
file's absolute path.

**Output:** the same tree, mutated in place, with two changes:

1. Every fenced code block whose language is a **configured language**
   (present in the resolved configuration's `defaults` map) is replaced by
   an `mdxJsxFlowElement` node named `StudyLenses` with `code`, `lens`,
   `lang`, and optional `config` attributes so that when the tree is
   rendered the block becomes a `<StudyLenses>` React component.
   Unconfigured languages pass through untouched.
2. For sibling-bearing pages (the `index.md` when present in a directory,
   otherwise the `README.md`), any `.js` files found in the directory subtree
   (up to the next nested sibling-bearing page, skipping hidden dirs,
   `node_modules/`, and ignore-prefixed dirs; symlinks are not followed) are
   appended to the tree. Siblings are **grouped by first path segment**
   (see **Sibling group** in the glossary): root-level files form one group;
   files under each subdirectory form their own group. Groups are emitted in
   alphabetical order by group key; empty groups (no files after language
   filtering) are silently omitted.

   In `bottom` mode each group's siblings become per-sibling `<StudyLenses>`
   nodes preceded by a heading. In `tabs` mode each group becomes a separate
   Docusaurus `<Tabs>` element wrapping one `<TabItem>` per sibling, each
   TabItem containing a single `<StudyLenses>`. Tab labels are
   **group-relative** (the group-key prefix is stripped). The plugin emits
   Docusaurus's native `Tabs`/`TabItem` (from `@theme/`) rather than a
   custom wrapper — this gives keyboard navigation, URL-hash tab persistence,
   and `groupId` synchronization for free.

   The root group's heading uses the configured `sectionHeading` (depth 2).
   Subdirectory group headings are prettified from the directory name using the
   same pipeline as the sidebar generator: strip exercise-set prefix → strip
   numeric ordering → kebab-case to Title Case (depth 3). The shared transform
   lives in `prettify-dir-name.ts`.

### Subsystem 2 — Lifecycle plugin (dev-server watching)

Contributes `getPathsToWatch` globs so Docusaurus's dev server rebuilds
MDX when `lenses.json` or any sibling `.js` file changes under a
configured content root. No runtime behavior beyond this.

### Subsystem 3 — Sidebar-items generator factory (category-label rewrite)

Returns a `sidebarItemsGenerator` function the author wires into each
docs-instance's options. Strips configured `exerciseSetPrefixes` (e.g.
`sl-`) + any numeric ordering + converts kebab-case to Title Case for
matching sidebar categories; non-matching categories pass through
unchanged, as do all doc and link items. Reads config through the same
cascade resolver as Subsystem 1, so sidebar labels stay in sync with
MDAST transforms.

The V1 mock `<StudyLenses>` React component lives **inside this plugin**
at [`./components/StudyLensesMock.tsx`](./components/) so the plugin is
self-contained. It is registered as `StudyLenses` via the swizzled theme
file at [`../../theme/MDXComponents.js`](../../theme/MDXComponents.js),
alongside `Tabs` and `TabItem` (imported from `@theme/Tabs` and
`@theme/TabItem` — they ship with `@docusaurus/theme-classic` but are
NOT in the default `MDXComponents`, so the plugin's swizzle must add
them for the emitted JSX to resolve). The V2 rich study-lens component
lives outside the plugin at
[`../../lib/welcome-to-programming/just-enough/javascript/components/lenses/study/`](../../lib/welcome-to-programming/just-enough/javascript/components/lenses/study/)
and will replace the V1 mock without plugin changes (swap happens in
`MDXComponents.js`).

## `lenses.json` schema

Every `lenses.json` is a mergeable subset of the resolved config. Four
top-level keys, all optional:

```json
{
  "defaults": {
    "js": "study"
  },
  "embedSiblings": {
    "mode": "tabs",
    "ignorePrefixes": ["staging-"],
    "sectionHeading": "Exercises"
  },
  "lenses": {
    "study":     { "ask": false },
    "highlight": { "ask": false, "debug": true }
  },
  "exerciseSetPrefixes": ["sl-"]
}
```

- **`defaults`** maps a language identifier (not a file extension) to the lens
  used when a fenced code block omits the lens suffix and when a sibling file
  is embedded. **Only keys listed here trigger fence transformation** — this
  is the "configured languages" rule. Adding `"py": "study"` opts Python in;
  omitting `"py"` leaves Python fences as plain code blocks.
- **`embedSiblings`** controls auto-embedding of sibling `.js` files:
  - `mode: "off"` disables embedding entirely.
  - `mode: "bottom"` appends each sibling as its own `<StudyLenses>` block.
  - `mode: "tabs"` appends a single Docusaurus `<Tabs>` element wrapping
    one `<TabItem>` per sibling; each TabItem contains one `<StudyLenses>`.
  - `ignorePrefixes` is an array of directory-name prefixes to skip during the
    sibling walk (e.g. `"staging-"` — matches `staging-foo/` and `staging-wip/`).
  - `sectionHeading` (optional) injects a depth-2 heading before the embed
    block. Set to `null` to omit.
- **`lenses`** is an opaque per-lens configuration bag. V1 forwards lens config
  as a JSON-stringified `config` prop to the component; V2 will consume it.
- **`exerciseSetPrefixes`** is an array of directory-name prefixes that mark
  "exercise set" folders for **sidebar-label stripping**. When the sidebar
  generator encounters a category whose directory basename starts with any
  configured prefix, it rewrites the label: strip prefix → strip numeric
  ordering → kebab-case to Title Case (e.g. `sl-01-while-loops` →
  `"While Loops"`). Typical site-root value: `["sl-"]`.

  **Edge cases (V1 contract, enforced in the sidebar generator — Module H):**

  - Overlapping prefixes (`["sl-", "sl-0"]`): **first match wins**.
    Matching order is the cascade-concatenation order (root-first, then
    deeper); deduplication preserves first occurrence. In the example,
    `sl-01-foo` matches `sl-` because the site-root entry is earlier in
    the array.
  - Empty residue after stripping (e.g. basename is exactly `"sl-"` or
    `"sl-01-"`): **fall back to the original basename** (no transformation),
    emit a single build-time warning so the author notices.
  - Empty string (`""`) in the array is a no-op at resolve time — if a
    pathological config ever sets it, every directory would match and
    the transform would strip zero characters. Module H guards against
    this at the boundary it actually bites.

**Cascade semantics:** child `lenses.json` files override parents.

- `defaults` uses **shallow merge** (child key replaces parent key per language).
- `embedSiblings` uses **deep merge with array concatenation**: scalar fields
  (`mode`, `sectionHeading`) are last-writer-wins; array fields
  (`ignorePrefixes`) are concatenated and deduplicated. This means setting
  `ignorePrefixes: ["wip-"]` in a nested `lenses.json` _extends_ the
  site-root's `["staging-"]` list rather than replacing it.
- `lenses.*` uses **deep merge** (child keys extend parent keys within each
  named lens).
- `exerciseSetPrefixes` uses **array concatenation** across the cascade
  (same semantic as `embedSiblings.ignorePrefixes`). Nested `lenses.json`
  additions extend rather than replace.

## Authoring conventions

### Ordering sibling files

Sibling `.js` files within a page are sorted alphabetically by path relative to
the `index.md` directory. For explicit ordering, prefix filenames with
zero-padded numbers: `01-intro.js`, `02-practice.js`, `03-challenge.js`.
Alphabetical sort handles up to 99 siblings correctly this way.

### Excluding work-in-progress exercises

Name the containing directory with any prefix listed in the site-root
`lenses.json`'s `embedSiblings.ignorePrefixes`. The site-wide convention is
`staging-`, so `staging-draft/`, `staging-experiments/` etc. are always skipped
during the sibling walk.

### Organizing exercise sets (sidebar-label stripping)

To group a progression of exercises under a chapter, prefix each exercise-set
directory with `sl-NN-` (where `NN` is a zero-padded sort position) and name
the folder in kebab-case:

```text
control-flow/
├── index.md
├── sl-01-while-loops/
│   ├── README.md
│   └── 01-basic-while.js
├── sl-02-do-while-loops/
│   ├── README.md
│   └── 01-at-least-once.js
└── sl-03-for-of-loops/
    ├── README.md
    └── 01-iteration.js
```

The sidebar generator sees categories named `sl-01-while-loops` and rewrites
the label to `"While Loops"` (strip `sl-`, strip `01-`, kebab-case to Title
Case). Docusaurus's filesystem sort preserves the numeric ordering in the
sidebar. Each exercise-set folder is itself a sibling-bearing page — its
`README.md` is rendered as the learner page, and `.js` files inside it
auto-embed per the `embedSiblings` config.

If an author wants a different label (e.g. `"Classic While Loops"`), they
provide a `_category_.json` or a `README.md` with `sidebar_label:` frontmatter
— the transform only fires when the category label still matches the prefix
pattern, so explicit overrides are automatically respected.

### Page boundaries

Sibling discovery descends recursively from a sibling-bearing page's directory
and stops at any nested sibling-bearing page. Each page "owns" the exercises
in its subtree up to the next page boundary. To split a long exercise list
across multiple rendered pages, drop `index.md` files at the split points.

### `README.md` vs `index.md`

A directory's sibling-bearing page is `index.md` if present, otherwise
`README.md`. When both are present in the same directory, `README.md` behaves
as a normal GitHub README — contributor-facing, not rendered as a learner
page, not sibling-bearing — and `index.md` takes over the learner-facing
role. This lets authors keep contributor notes in `README.md` while opting
into a dedicated learner page via `index.md`.

Other `.md` files (e.g. `reference.md`, `notes.md`) are transformed for code
fences like any markdown file, but they do not trigger sibling embeds.

### Gotcha: silent no-op for unconfigured languages

If you drop a `.py` file next to an `index.md` expecting it to embed —
but `py` isn't listed in `defaults` — **nothing happens, silently**. The
configured-languages rule gates sibling discovery too. Same for a
`` ```txt:highlight `` fence: no warning, just an unchanged plain code
block.

This is deliberate (avoids the "ASCII-diagram-replaced-by-plaintext-editor"
footgun), but easy to miss. If an exercise doesn't render, first check
that its language is in `defaults` somewhere up the cascade. V1 does not
emit a warning for this; a future lint pass may.

### Note: `rehype-raw` lowercases hast-element tag names in `.md` files

If you're extending this plugin to emit a new component, use the
`mdxJsxFlowElement` pattern (see `code-block-to-jsx.ts`) rather than the
`data.hName` hast-name pattern. Docusaurus's `.md` pipeline runs
`rehype-raw` before the MDX runtime; `rehype-raw`'s `passThrough` list
(in `@docusaurus/mdx-loader/lib/processor.js`) covers MDX-specific node
types (`mdxJsxFlowElement`, `mdxFlowExpression`, etc.) but NOT plain
hast `element` nodes. A `code` MDAST node mutated with
`data.hName = 'StudyLenses'` produces a hast element whose `tagName` is
lowercased to `'studylens'` — `MDXComponents['StudyLenses']` is missed,
the component never resolves, and the page renders a raw
`<studylens>` DOM element.

**What this plugin does:** every `<StudyLenses>` emission goes through
`codeBlockToJsx`, which returns an `mdxJsxFlowElement` node with
`name: 'StudyLenses'`. That covers in-page fences (`transformFence`),
bottom-mode sibling embeds (`appendBottomEmbed`), AND the inner
`<StudyLenses>` nested inside each `<TabItem>` in tabs-mode embeds
(`appendTabsEmbed`). `mdxJsxFlowElement` IS in the `passThrough` list
so the PascalCase `name` survives intact to the MDX runtime; no
lowercase alias is needed in the swizzled MDXComponents.

### Manually-placed `<StudyLenses>` JSX

If an author writes `<StudyLenses code={...} lens="..." />` directly in an `.mdx`
file, the plugin leaves the JSX alone — it only visits MDAST `code` nodes.
Fenced code blocks in the same file still get transformed.

### Per-file lens overrides

Authors can override the cascade default without creating a nested
`lenses.json` file — useful when a single directory has a few files
needing a different lens than the rest.

**In `.js` sibling files — `@study-lens` directive.** A **directive
block** — a comment form containing the `@study-lens` tag — may
declare the lens and an optional inline JSON config. The directive
block may sit in either the file's **leading comment block** (before
any code) OR its **trailing comment block** (after the last
non-comment statement). Authors who prefer metadata at the top write
directives at the top; authors who prefer to write the exercise first
and tuck plumbing out of the way write them at the bottom.

All forms below are accepted; `@study-lens <name>` is the tag
(namespaced, hyphenated).

```js
// @study-lens parsons
// @study-lens parsons {"distractors": 4}
/** @study-lens parsons */
/** @study-lens parsons {"distractors": 4} */
/**
 * @study-lens parsons
 * {"distractors": 4}
 */
```

**The directive block is stripped from the code that reaches
`<StudyLenses>`.** Learners see only the exercise body, never the
plumbing. Blank lines immediately between the stripped directive and
the preserved code body are collapsed alongside the block, so you
don't get a visual gap; blanks at the file's BOF/EOF edge are
preserved.

**Middle-of-file placement is NOT supported.** A directive token
surrounded by code on both sides is inert — reliably distinguishing
a real directive from the same characters inside a string/regex/
template literal would require a JS tokenizer.

**Both-block placement throws.** If a `@study-lens` tag appears in
BOTH the leading AND trailing comment block, the build fails with an
"ambiguous-placement" error naming the file. Pick one.

**Contiguous `//` runs are atomic.** In

```js
// Author: Eve
// @study-lens parsons
```

the two `//` lines form one comment form and both are stripped when
the directive is detected. If you want `// Author: Eve` to survive,
separate it from the directive with a blank line — that breaks the
run into two independent forms:

```js
// Author: Eve

// @study-lens parsons
```

Now only the directive line is stripped.

**Malformed JSON throws** with the file path in the error message —
matching the cascade-resolver's behavior for malformed `lenses.json`.

**In `.md` / `.mdx` files — frontmatter `defaultLens`.** Set a
per-file default that every fence in the file picks up. Per-fence
`:suffix` still wins.

```markdown
---
defaultLens: highlight
---

\`\`\`js
// uses 'highlight' (frontmatter)
\`\`\`

\`\`\`js:study
// uses 'study' (explicit suffix wins)
\`\`\`
```

Read from `vfile.data.frontMatter.defaultLens`; Docusaurus
pre-populates it before `beforeDefaultRemarkPlugins` runs. The
configured-languages gate still applies — frontmatter cannot make an
unconfigured language transform.

**Fence info string grammar (Option A):**

```text
<lang>[:<token>(,<token>)*]
```

- No suffix → lens from frontmatter or cascade default; no transforms.
- One token → lens name; no transforms. (`js:editor`)
- N tokens → last is lens, earlier are transforms in order.
  (`js:format,loopGuard,editor` → transforms=[format,loopGuard], lens=editor)
- Any empty token (leading/trailing/doubled comma) → fence left as plain
  code block (malformed; not transformed).

**Precedence (authoritative):**

Fenced code blocks inside `.md` / `.mdx`:

```text
fence :suffix   >   frontmatter defaultLens   >   cascade defaults[lang]
```

Sibling `.js` files:

```text
file's @study-lens directive (leading OR trailing)   >   cascade defaults[lang]
```

Lens config (both paths):

```text
file's directive JSON   deep-merged over   cascade lenses[lens]
```

**Array-replace caveat.** The deep-merge replaces arrays rather than
concatenating them. If the cascade has `lenses.highlight.markers =
["a", "b"]` and a directive supplies `{"markers": ["c"]}`, the result
is `{markers: ["c"]}` — NOT `["a", "b", "c"]`. If additive array
behavior is needed, restate the full list in the directive.

**Frontmatter cannot carry lens config.** Only the lens name. Authors
who need per-lens config inside an `.md` page use a nested
`lenses.json` in the surrounding directory. Asymmetric with `.js`
siblings, but acceptable for V1.

## Types preview

(Subject to refinement at Phase 0 step 0.4; final shape lives in
[`types.ts`](./types.ts).)

```ts
type LensName = string;
type LangName = string;

type LensesConfigFile = Readonly<{
  defaults?: Readonly<Record<LangName, LensName>>;
  embedSiblings?: Readonly<Partial<EmbedSiblingsConfig>>;
  lenses?: Readonly<Record<LensName, Readonly<Record<string, unknown>>>>;
  exerciseSetPrefixes?: ReadonlyArray<string>;
}>;

type EmbedSiblingsConfig = Readonly<{
  mode: 'off' | 'bottom' | 'tabs';
  ignorePrefixes: ReadonlyArray<string>;
  sectionHeading: string | null;
}>;

type ResolvedConfig = Readonly<{
  defaults: Readonly<Record<LangName, LensName>>;
  embedSiblings: EmbedSiblingsConfig;
  lenses: Readonly<Record<LensName, Readonly<Record<string, unknown>>>>;
  exerciseSetPrefixes: ReadonlyArray<string>;
}>;

type Sibling = Readonly<{
  absPath: string;
  label: string;        // path relative to pageDir, without extension
  code: string;
  lang: LangName;
  lens: LensName;       // directive-override > cascade default
  lensConfig?: Readonly<Record<string, unknown>>;
  // ^ directive's JSON body only (un-merged); cascade's `lenses[lens]`
  //   is applied at emission time.
}>;

// The props shape the plugin writes to hProperties; what <StudyLenses> receives.
// `config` is serialization-tolerant (see § Config-prop serialization below):
// string (possibly JSON) OR object. Consumers parse via a shared util.
type StudyLensesHastProps = Readonly<{
  code: string;
  lens: LensName;
  lang: LangName;
  config?: string | Readonly<Record<string, unknown>>;
}>;

// Tabs-mode emission uses Docusaurus's native <Tabs>/<TabItem> via
// mdxJsxFlowElement nodes with proper mdxJsxAttribute entries — no custom
// tabs-wrapper prop type is needed. Section heading, when configured,
// is emitted as a regular MDAST heading (depth 2) above the Tabs block.

type RemarkPluginOptions = Readonly<{ contentRoot: string }>;
type LifecyclePluginOptions = Readonly<{ contentRoots: ReadonlyArray<string> }>;

// Sidebar generator factory options (Module H). Discriminated union —
// production uses `contentRoot` (factory consults the cascade resolver
// live); tests/in-memory callers inject a `resolvedConfig` directly.
type SidebarGeneratorOptions =
  | Readonly<{ contentRoot: string }>
  | Readonly<{ resolvedConfig: ResolvedConfig }>;
```

### Config-prop serialization

`hProperties` on MDAST nodes serializes primitive values cleanly through the
remark-rehype pipeline, but object-valued attributes may or may not round-trip
to React props cleanly depending on the renderer. The plugin follows a
**fallback-tolerant convention** so it works whichever way the pipeline
happens to serialize:

1. If the lens config is `null`/`undefined`, omit the `config` prop entirely.
2. If the environment serializes objects cleanly, pass the object directly.
3. Otherwise, `JSON.stringify` the object and pass the string.

On the component side, a shared `parseLensConfig(input)` utility decodes:

1. If `input` is a non-null object → use directly.
2. If `input` is a string → try `JSON.parse`. If it parses, use as object.
   If it doesn't parse, use the raw string (some lenses accept a simple string
   config; e.g. a parsons lens might take a `"freeform"` token).
3. If `input` is `null`/`undefined`/anything else → treat as no config.

This util is expected to be shared across all lenses (not plugin-specific).
V1 candidate location: inside the plugin at
[`./parse-lens-config.ts`](./parse-lens-config.ts); promote to a shared
utility in `src/lib/utils/` once a second lens consumer appears.

The Phase 0.7 spike determines which branch of (2)/(3) the plugin takes on
Docusaurus 3.7; the component's parser is the same either way.

## How to navigate the code

- `types.ts` — domain model; every other file imports types from here.
- `ext-to-lang.ts` — tiny static map: `.js` → `js`, `.py` → `py`, etc.
- `resolve-cascade.ts` — walks directories collecting `lenses.json` files,
  deep-merges them (with array-concat for `embedSiblings.ignorePrefixes`),
  caches results keyed by `(contentRoot, absDir)` with mtime-based
  invalidation. Returns `ResolvedConfig` (frozen).
- `discover-siblings.ts` — given a sibling-bearing page's directory +
  `ResolvedConfig`, walks downward stopping at page boundaries and
  ignore-prefixed dirs (also skipping hidden dirs, `node_modules/`; not
  following symlinks), returns `Sibling[]` (frozen).
- `code-block-to-jsx.ts` — converts a `code` MDAST node into an
  `mdxJsxFlowElement` node named `StudyLenses` with `code`, `lens`, `lang`,
  and optional `config` attributes. All `<StudyLenses>` emission sites call
  this single helper.
- `parse-lens-config.ts` — the shared fallback-tolerant decoder for the
  `config` prop. Imported by `StudyLensesMock` in V1; expected to be promoted
  to `src/lib/utils/` when a second consumer (e.g. V2 rich component)
  appears.
- `remark-study-lenses.ts` — the remark plugin factory: guards, resolves
  config, transforms fenced code blocks whose language is configured,
  appends sibling embeds.
- `lifecycle-plugin.ts` — the Docusaurus lifecycle plugin: exposes
  `getPathsToWatch` so dev-server rebuilds trigger on `lenses.json` or
  sibling `.js` changes.
- `prettify-dir-name.ts` — shared pipeline for converting a directory name
  into a human-readable heading: strip exercise-set prefix → strip numeric
  ordering → kebab-case to Title Case. Used by both the remark plugin (for
  sibling group headings) and the sidebar generator (for category labels).
- `sidebar-generator.ts` — `createStudySidebarGenerator({ contentRoot })`
  factory; returns a Docusaurus `sidebarItemsGenerator` that rewrites
  category labels for directories matching any `exerciseSetPrefixes`
  entry via the shared `prettify-dir-name.ts` pipeline.
- `index.ts` — re-exports the three entry points (remark factory,
  lifecycle plugin, sidebar-generator factory) used by
  `docusaurus.config.ts`.
- `components/StudyLensesMock.tsx` — V1 mock component. Renders a small
  lens/lang label above `<CodeBlock>` imported from `@theme/CodeBlock`
  (Prism highlighting, copy button, dark-mode styling all handled by
  Docusaurus). Replaced in V2 by the rich component at
  `src/lib/welcome-to-programming/just-enough/javascript/components/lenses/study/`
  (swap happens in the `MDXComponents.js` swizzle; no plugin change needed).
- No custom tabs-wrapper component. Tabs-mode embeds emit Docusaurus's
  native `<Tabs>`/`<TabItem>` directly from the plugin as
  `mdxJsxFlowElement` nodes; each `<TabItem>` contains one `<StudyLenses>`.
- `tests/` — Vitest unit tests, co-located per DEV.md convention. On-disk
  fixture trees under `tests/fixtures/`.

## Dependencies

Direct imports used by this plugin (all resolved from the site root
`node_modules/`, not a local `package.json`):

- `unist-util-visit` — MDAST tree traversal.
- `@types/mdast`, `@types/unist` — MDAST/unist TypeScript types.
- `fast-glob` — used by the lifecycle plugin to expand watch globs.
- `@docusaurus/types` — `LoadContext`, `Plugin` types for the lifecycle piece.
- Freeze utilities from [`../../lib/utils/freeze.ts`](../../lib/utils/freeze.ts)
  (`freezeInPlace`, `cloneAndFreeze`).
- Deep-merge utility from [`../../lib/utils/deep-merge.ts`](../../lib/utils/deep-merge.ts).

No runtime (non-build-time) dependencies: the plugin runs entirely during
Docusaurus's build step.

## Docusaurus vocabulary primer

For readers unfamiliar with Docusaurus:

- **`@site/`** — a webpack alias that resolves to the Docusaurus site root.
  `@site/src/foo.ts` resolves to `<siteDir>/src/foo.ts`. Saves long `../../../`
  import chains from deeply-nested files.
- **`MDXComponents`** — Docusaurus's global registry of React components
  available inside every `.md`/`.mdx` file without explicit imports. Adding a
  component here means `<MyComponent />` just works in any markdown page.
- **Swizzling** — Docusaurus's term for ejecting a local copy of a theme file
  so you can override it. `npx docusaurus swizzle @docusaurus/theme-classic
  MDXComponents --eject` creates `src/theme/MDXComponents.js` as an editable
  copy.
- **Remark plugin** — a function that transforms MDAST (the markdown AST)
  during Docusaurus's content compilation. Registered via
  `beforeDefaultRemarkPlugins` (runs before Docusaurus's built-in transforms)
  or `remarkPlugins` (runs after).
- **Lifecycle plugin** — a Docusaurus plugin with hooks like `loadContent`,
  `contentLoaded`, `getPathsToWatch`. Our lifecycle plugin only implements
  `getPathsToWatch` so the dev server recompiles MDX when `lenses.json` or
  sibling `.js` files change.

## Links

- **Up:** [site root README](../../../README.md) · [AGENTS.md](../../../AGENTS.md) · [DEV.md](../../../DEV.md)
- **Parent:** [`src/plugins/README.md`](../README.md)
- **Siblings (downstream, V2 target):** [`src/lib/welcome-to-programming/just-enough/javascript/components/lenses/study/`](../../lib/welcome-to-programming/just-enough/javascript/components/lenses/study/)
