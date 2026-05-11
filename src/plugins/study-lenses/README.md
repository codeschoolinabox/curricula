# `study-lenses`

A build-time Docusaurus plugin that pre-processes markdown content in the
`@spiralearn` curriculum so that every fenced code block renders as a
`<StudyLenses>` React component, and every `.js` file co-located with an
`index.md` page auto-embeds into that page.

The `<StudyLenses>` emitted by the plugin is rendered by the orchestrator
component at
[`src/lib/welcome-to-programming/just-enough/javascript/orchestrate/`](../../lib/welcome-to-programming/just-enough/javascript/orchestrate/),
registered as `StudyLenses` in the swizzled
[`src/theme/MDXComponents.js`](../../theme/MDXComponents.js).

**Architectural framing:** this is a _bounded subsystem_ — its own
documentation, domain model, and workflow conventions — but _not_ a physical npm
package. It lives inside the Docusaurus site with no separate `package.json` or
build step. Its `.ts` sources are loaded directly by `docusaurus.config.ts` via
Docusaurus's native TypeScript config support.

## Emitted JSX prop contract

Every `<StudyLenses>` node this plugin emits carries the **three-prop public
API** locked in the orchestrator at
[`../../lib/welcome-to-programming/just-enough/javascript/orchestrate/README.md`](../../lib/welcome-to-programming/just-enough/javascript/orchestrate/README.md):

```jsx
<StudyLenses
  snippet={…}    // string source (the code in the fence)
  lens?={…}      // resolved lens name (string) — Q-III educator default
  configs?={…}   // whole resolved cascade (opaque); per-fence/sibling
                  // overrides are PRE-MERGED into configs.lenses[lens]
                  // before emission. The orchestrator reads
                  // configs.lenses?.[lens] for the per-lens config; no
                  // separate `config` prop exists.
/>
```

The **only attributes the plugin ever emits** on a transformed `<StudyLenses>`
node are `snippet`, `lens`, and `configs` (the latter two optional). `config`,
`code`, `lang`, and `transforms` from earlier prop-shape iterations are gone —
the cascade IS the merged truth, and any per-fence override (URL-style query or
sibling `@study-lens` directive JSON) is folded INTO `configs.lenses[lens]`
before the JSX node is emitted.

The plugin populates the three props from three input surfaces:

- **Fence info string** (URL-style; see § Fence info string grammar below) —
  populates `lens` and contributes a per-fence override that gets deep-merged
  INTO the cascade's `lenses[lens]` entry (which then ships as part of the
  whole-cascade `configs` prop).
- **Per-directory `lenses.json` cascade** (see § lenses.json schema) — its
  `defaults[lang]` ONLY gates whether a fence in that language transforms at all
  (configured-languages rule). It does NOT populate `lens` — only fence
  `:suffix` / frontmatter `defaultLens` / sibling `@study-lens` directive
  populate `lens` (per AR-1 locked decision 1; the cascade-supplied default seam
  is L2-deferred). The whole resolved cascade ships verbatim as `configs` (with
  per-fence/sibling overrides pre-merged into `configs.lenses[lens]`).
- **Per-fence `@study-lens` directive in `.js` siblings** — educator-override
  surface; populates the sibling's `lens` and a per-sibling override bundle that
  gets deep-merged INTO the cascade's `lenses[lens]` entry before emission.

## Glossary

The terms below are **ubiquitous** — they propagate verbatim into function
signatures, type names, error messages, test descriptions, and JSDoc. Adding a
synonym anywhere in the code is a bug.

- **Lens** — a named rendering mode for a code sample. Opaque string identifier
  the plugin treats as a name; the rendered React lens modules live in the
  orchestrator-side `lenses/` peer (`highlight`, `blanks`, `parsons`,
  `trace-table`, etc.). The `lens` attribute the plugin emits is populated, in
  precedence order, from: per-fence `:suffix`, frontmatter `defaultLens`,
  sibling `@study-lens` directive (siblings only). Cascade `defaults[lang]` ONLY
  gates whether a fence transforms (configured-languages rule) — it does NOT
  populate `lens` (per AR-1 locked decision 1). A fenced code block with none of
  those resolved emits no `lens` prop at all — the cascade-supplied default seam
  is L2-deferred; in F1+B the bare-fence case mounts the editor home base. See
  [`../../lib/welcome-to-programming/just-enough/javascript/orchestrate/README.md`](../../lib/welcome-to-programming/just-enough/javascript/orchestrate/README.md).
- **Fenced code block** — a markdown code block delimited by triple backticks.
  The MDAST `code` node type. Standard CommonMark term.
- **Code fence** — the triple-backtick delimiters themselves, as opposed to the
  enclosed content.
- **Info string** — the text on the opening fence line after the backticks
  (`js`, `js:highlight`, `python`). Standard CommonMark term.
- **Language** — the identifier before the colon in an info string (`js`,
  `python`, `html`). Determines the default lens lookup.
- **Configured language** — a language identifier that has a corresponding key
  in the resolved configuration's `defaults` map. **Only configured languages
  trigger fence transformation**; unconfigured languages (e.g. `txt`, `bash`,
  `diff`) fall through to Docusaurus's default code-block rendering. This avoids
  footguns like replacing an ASCII diagram in a `txt` fence with a plaintext
  editor.
- **Lens suffix** — the text after the colon in a fence info string. A bare
  suffix is a lens name (`js:highlight`). A suffix may carry a URL-style query
  string for per-fence config overrides
  (`js:trace?stepDelay=500&cols=value,steps`). See § Fence info string grammar.
- **Query parameter** — one `key[=value]` pair in a fence info string's query
  suffix. Multiple parameters are joined by `&`. Values are URL-semantic strings
  at parse time (no numeric coercion); each lens coerces at config-read time as
  needed.
- **Cascade bundle** — the **whole resolved cascade** produced by the cascade
  resolver, emitted verbatim onto the `configs` attribute (opaque passthrough).
  Includes top-level `defaults`, `embedSiblings`, `exerciseSetPrefixes`, and
  `lenses`. The `lenses[lens]` sub-tree is the **final per-lens config** —
  post-merge with any per-fence URL-style query OR sibling `@study-lens`
  directive JSON override. There is no separate `config` prop; the cascade IS
  the merged truth.
- **Resolved-default lens** — the lens that mounts when the picker first opens,
  computed from the resolved `lens` attribute. Precedence (fence side):
  per-fence `:suffix` > frontmatter `defaultLens` > none. Sibling side:
  directive > cascade `defaults[lang]`. Cascade `defaults[lang]` is gate-only on
  fences and authoritative on siblings (per AR-1 locked decision 1; the
  cascade-supplied default seam for fences is L2-deferred). See **Cascade
  bundle** for how per-fence/sibling overrides ride inside `configs`.
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
  both exist, `README.md` is contributor-facing (GitHub-style, not rendered) and
  `index.md` is the learner page (rendered, sibling-bearing).
- **Ignore prefix** — a directory-name prefix that causes the sibling walk to
  skip that entire subtree. Configured per-instance under
  `embedSiblings.ignorePrefixes`. Site-root config sets `["staging-"]`.
- **Page boundary** — a nested sibling-bearing page encountered during the
  sibling walk. Descent halts at this boundary; files beyond belong to that
  other page.
- **Exercise set** — a group of related exercises under a subchapter, physically
  colocated in a directory whose name starts with a configured **exercise-set
  prefix** (e.g. `sl-01-while-loops/`, `sl-02-do-while-loops/` under a parent
  `control-flow/` chapter). Each exercise set is a sibling-bearing page in its
  own right.
- **Exercise-set prefix** — the directory-name prefix that marks a folder as an
  exercise set. Configured at the content-root `lenses.json` under the top-level
  `exerciseSetPrefixes` key. Site-wide convention: `sl-`. Directories matching a
  prefix receive sidebar-label stripping (strip prefix → strip numeric ordering
  → kebab-case to Title Case).
- **Directive block** — a comment form (a line-comment run or a block comment)
  in a sibling `.js` file that contains the `@study-lens` tag. May appear in the
  file's leading comment block (before any code) OR its trailing comment block
  (after the last non-comment statement); middle-of-file placement is inert. The
  directive block is parsed for lens name + optional JSON config, and removed
  from the code that feeds into `<StudyLenses>` — learners see only the exercise
  body.
- **Leading comment block** — the contiguous prefix of a `.js` file made of
  blank lines, an optional shebang, line comments, and block comments, up to the
  first non-blank/non-comment/non-shebang line.
- **Trailing comment block** — the mirror region at the end of a `.js` file:
  blank lines, line comments, and block comments after the last non-comment
  statement, through EOF.
- **Sibling group** — a partition of a page's siblings by their first path
  segment. Root-level files (no `/` in their label) form the **root group**;
  files under a subdirectory share the subdirectory name as their **group key**.
  Each group renders as a separate `<Tabs>` element (tabs mode) or a separate
  block of `<StudyLenses>` nodes (bottom mode), preceded by a heading.
- **Group key** — the first path segment of a sibling's relative-path label.
  Siblings sharing a group key are rendered together. Root-level files have an
  empty group key.
- **Group-relative label** — a sibling's label with its group-key prefix
  stripped, used as the tab label within that group's `<Tabs>`. Example:
  `sl-01-variables/01-declare` becomes tab label `01-declare` inside the
  `Variables` group.

## What this plugin does

Three independent subsystems share one config file (`lenses.json`). They fire at
different points in Docusaurus's build lifecycle:

### Subsystem 1 — Remark transformer (MDAST transformation)

**Input:** the MDAST tree of a `.md`/`.mdx` file being compiled, plus the file's
absolute path.

**Output:** the same tree, mutated in place, with two changes:

1. Every fenced code block whose language is a **configured language** (present
   in the resolved configuration's `defaults` map) is replaced by an
   `mdxJsxFlowElement` node named `StudyLenses` with the three-prop attribute
   set (`snippet` and `configs` always on a transformed fence; `lens` when a
   resolver hits) so that when the tree is rendered the block becomes a
   `<StudyLenses>` React component. Unconfigured languages pass through
   untouched.
2. For sibling-bearing pages (the `index.md` when present in a directory,
   otherwise the `README.md`), any `.js` files found in the directory subtree
   (up to the next nested sibling-bearing page, skipping hidden dirs,
   `node_modules/`, and ignore-prefixed dirs; symlinks are not followed) are
   appended to the tree. Siblings are **grouped by first path segment** (see
   **Sibling group** in the glossary): root-level files form one group; files
   under each subdirectory form their own group. Groups are emitted in
   alphabetical order by group key; empty groups (no files after language
   filtering) are silently omitted.

   In `bottom` mode each group's siblings become per-sibling `<StudyLenses>`
   nodes preceded by a heading. In `tabs` mode each group becomes a separate
   Docusaurus `<Tabs>` element wrapping one `<TabItem>` per sibling, each
   TabItem containing a single `<StudyLenses>`. Tab labels are
   **group-relative** (the group-key prefix is stripped). The plugin emits
   Docusaurus's native `Tabs`/`TabItem` (from `@theme/`) rather than a custom
   wrapper — this gives keyboard navigation, URL-hash tab persistence, and
   `groupId` synchronization for free.

   The root group's heading uses the configured `sectionHeading` (depth 2).
   Subdirectory group headings are prettified from the directory name using the
   same pipeline as the sidebar generator: strip exercise-set prefix → strip
   numeric ordering → kebab-case to Title Case (depth 3). The shared transform
   lives in `prettify-dir-name.ts`.

### Subsystem 2 — Lifecycle plugin (dev-server watching)

Contributes `getPathsToWatch` globs so Docusaurus's dev server rebuilds MDX when
`lenses.json` or any sibling `.js` file changes under a configured content root.
No runtime behavior beyond this.

### Subsystem 3 — Sidebar-items generator factory (category-label rewrite)

Returns a `sidebarItemsGenerator` function the author wires into each
docs-instance's options. Strips configured `exerciseSetPrefixes` (e.g. `sl-`) +
any numeric ordering + converts kebab-case to Title Case for matching sidebar
categories; non-matching categories pass through unchanged, as do all doc and
link items. Reads config through the same cascade resolver as Subsystem 1, so
sidebar labels stay in sync with MDAST transforms.

The `<StudyLenses>` component is registered as `StudyLenses` via the swizzled
theme file at [`../../theme/MDXComponents.js`](../../theme/MDXComponents.js),
alongside `Tabs` and `TabItem` (imported from `@theme/Tabs` and `@theme/TabItem`
— they ship with `@docusaurus/theme-classic` but are NOT in the default
`MDXComponents`, so the plugin's swizzle must add them for the emitted JSX to
resolve). The orchestrator component lives at
[`../../lib/welcome-to-programming/just-enough/javascript/orchestrate/`](../../lib/welcome-to-programming/just-enough/javascript/orchestrate/).

## `lenses.json` schema

Every `lenses.json` is a mergeable subset of the resolved config. Four top-level
keys, all optional:

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
		"study": { "ask": false },
		"highlight": { "ask": false, "debug": true }
	},
	"exerciseSetPrefixes": ["sl-"]
}
```

- **`defaults`** maps a language identifier (not a file extension) to the lens
  used when a fenced code block omits the lens suffix and when a sibling file is
  embedded. **Only keys listed here trigger fence transformation** — this is the
  "configured languages" rule. Adding `"py": "study"` opts Python in; omitting
  `"py"` leaves Python fences as plain code blocks.
- **`embedSiblings`** controls auto-embedding of sibling `.js` files:
  - `mode: "off"` disables embedding entirely.
  - `mode: "bottom"` appends each sibling as its own `<StudyLenses>` block.
  - `mode: "tabs"` appends a single Docusaurus `<Tabs>` element wrapping one
    `<TabItem>` per sibling; each TabItem contains one `<StudyLenses>`.
  - `ignorePrefixes` is an array of directory-name prefixes to skip during the
    sibling walk (e.g. `"staging-"` — matches `staging-foo/` and
    `staging-wip/`).
  - `sectionHeading` (optional) injects a depth-2 heading before the embed
    block. Set to `null` to omit.
- **`lenses`** is an opaque per-lens configuration bag, keyed by lens name. Its
  values flow into `configs.lenses` on the emitted `configs` attribute.
  Per-fence URL-style queries and sibling `@study-lens` directive JSON are
  **deep-merged INTO `configs.lenses[lens]`** at emission time, so the
  orchestrator sees a single source of truth: `configs.lenses?.[lens]`. The
  orchestrator's resolution chain collapses to two tiers —
  `module.config() ⊕ configs.lenses?.[lens]` — per
  [`../../lib/welcome-to-programming/just-enough/javascript/orchestrate/README.md` § Per-lens config resolution chain](../../lib/welcome-to-programming/just-enough/javascript/orchestrate/README.md).

  **Lens-config value shape:** values inside `lenses.<lens-name>` are expected
  to satisfy
  [`LensConfig`](../../lib/welcome-to-programming/just-enough/javascript/lenses/types.ts)
  — a flat record of primitives + primitive arrays. The plugin types them
  loosely as `Record<string, unknown>` because the cascade resolver does not
  validate against the lens-side schema; authors who supply richer values
  (nested objects, callbacks, dates) get undefined behavior at the lens
  boundary. Strictness is a **lens-prop-boundary** contract (the orchestrator
  casts to `LensConfig` after the two-tier resolution chain runs), not a
  compile-time guarantee at the `<StudyLenses>` public API. The orchestrate-
  side `StudyLensesProps.configs` is correspondingly **maximally opaque**
  (`Readonly<Record<string, unknown>>`, no declared `lenses` slot); the
  orchestrator's `configs.lenses?.[lens]` lookup is an internal structural
  assumption at the cast boundary inside `resolvePerLensConfig`, NOT a
  constraint on the public type. The plugin's
  `StudyLensesHastProps.configs: ResolvedConfig` emission type is concrete — the
  asymmetry is intentional (plugin = strict emission, consumer = tolerant
  accept).

- **`exerciseSetPrefixes`** is an array of directory-name prefixes that mark
  "exercise set" folders for **sidebar-label stripping**. When the sidebar
  generator encounters a category whose directory basename starts with any
  configured prefix, it rewrites the label: strip prefix → strip numeric
  ordering → kebab-case to Title Case (e.g. `sl-01-while-loops` →
  `"While Loops"`). Typical site-root value: `["sl-"]`.

  **Edge cases (enforced in the sidebar generator):**
  - Overlapping prefixes (`["sl-", "sl-0"]`): **first match wins**. Matching
    order is the cascade-concatenation order (root-first, then deeper);
    deduplication preserves first occurrence. In the example, `sl-01-foo`
    matches `sl-` because the site-root entry is earlier in the array.
  - Empty residue after stripping (e.g. basename is exactly `"sl-"` or
    `"sl-01-"`): **fall back to the original basename** (no transformation),
    emit a single build-time warning so the author notices.
  - Empty string (`""`) in the array is a no-op at resolve time — if a
    pathological config ever sets it, every directory would match and the
    transform would strip zero characters. The sidebar generator guards against
    this at the boundary it actually bites.

**Cascade semantics:** child `lenses.json` files override parents.

- `defaults` uses **shallow merge** (child key replaces parent key per
  language).
- `embedSiblings` uses **deep merge with array concatenation**: scalar fields
  (`mode`, `sectionHeading`) are last-writer-wins; array fields
  (`ignorePrefixes`) are concatenated and deduplicated. This means setting
  `ignorePrefixes: ["wip-"]` in a nested `lenses.json` _extends_ the site-root's
  `["staging-"]` list rather than replacing it.
- `lenses.*` uses **deep merge** (child keys extend parent keys within each
  named lens).
- `exerciseSetPrefixes` uses **array concatenation** across the cascade (same
  semantic as `embedSiblings.ignorePrefixes`). Nested `lenses.json` additions
  extend rather than replace.

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
directory with `sl-NN-` (where `NN` is a zero-padded sort position) and name the
folder in kebab-case:

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

The sidebar generator sees categories named `sl-01-while-loops` and rewrites the
label to `"While Loops"` (strip `sl-`, strip `01-`, kebab-case to Title Case).
Docusaurus's filesystem sort preserves the numeric ordering in the sidebar. Each
exercise-set folder is itself a sibling-bearing page — its `README.md` is
rendered as the learner page, and `.js` files inside it auto-embed per the
`embedSiblings` config.

If an author wants a different label (e.g. `"Classic While Loops"`), they
provide a `_category_.json` or a `README.md` with `sidebar_label:` frontmatter —
the transform only fires when the category label still matches the prefix
pattern, so explicit overrides are automatically respected.

### Page boundaries

Sibling discovery descends recursively from a sibling-bearing page's directory
and stops at any nested sibling-bearing page. Each page "owns" the exercises in
its subtree up to the next page boundary. To split a long exercise list across
multiple rendered pages, drop `index.md` files at the split points.

### `README.md` vs `index.md`

A directory's sibling-bearing page is `index.md` if present, otherwise
`README.md`. When both are present in the same directory, `README.md` behaves as
a normal GitHub README — contributor-facing, not rendered as a learner page, not
sibling-bearing — and `index.md` takes over the learner-facing role. This lets
authors keep contributor notes in `README.md` while opting into a dedicated
learner page via `index.md`.

Other `.md` files (e.g. `reference.md`, `notes.md`) are transformed for code
fences like any markdown file, but they do not trigger sibling embeds.

### Gotcha: silent no-op for unconfigured languages

If you drop a `.py` file next to an `index.md` expecting it to embed — but `py`
isn't listed in `defaults` — **nothing happens, silently**. The
configured-languages rule gates sibling discovery too. Same for a
` ```txt:highlight ` fence: no warning, just an unchanged plain code block.

This is deliberate (avoids the "ASCII-diagram-replaced-by-plaintext-editor"
footgun), but easy to miss. If an exercise doesn't render, first check that its
language is in `defaults` somewhere up the cascade. The plugin does not emit a
warning for this; a future lint pass may.

### Note: `rehype-raw` lowercases hast-element tag names in `.md` files

If you're extending this plugin to emit a new component, use the
`mdxJsxFlowElement` pattern (see `code-block-to-jsx.ts`) rather than the
`data.hName` hast-name pattern. Docusaurus's `.md` pipeline runs `rehype-raw`
before the MDX runtime; `rehype-raw`'s `passThrough` list (in
`@docusaurus/mdx-loader/lib/processor.js`) covers MDX-specific node types
(`mdxJsxFlowElement`, `mdxFlowExpression`, etc.) but NOT plain hast `element`
nodes. A `code` MDAST node mutated with `data.hName = 'StudyLenses'` produces a
hast element whose `tagName` is lowercased to `'studylens'` —
`MDXComponents['StudyLenses']` is missed, the component never resolves, and the
page renders a raw `<studylens>` DOM element.

**What this plugin does:** every `<StudyLenses>` emission goes through
`codeBlockToJsx`, which returns an `mdxJsxFlowElement` node with
`name: 'StudyLenses'`. That covers in-page fences (`transformFence`),
bottom-mode sibling embeds (`appendBottomEmbed`), AND the inner `<StudyLenses>`
nested inside each `<TabItem>` in tabs-mode embeds (`appendTabsEmbed`).
`mdxJsxFlowElement` IS in the `passThrough` list so the PascalCase `name`
survives intact to the MDX runtime; no lowercase alias is needed in the swizzled
MDXComponents.

### Manually-placed `<StudyLenses>` JSX

If an author writes `<StudyLenses snippet={...} lens="..." />` directly in an
`.mdx` file, the plugin leaves the JSX alone — it only visits MDAST `code`
nodes. Fenced code blocks in the same file still get transformed.

### Per-file lens overrides

Authors can override the cascade default without creating a nested `lenses.json`
file — useful when a single directory has a few files needing a different lens
than the rest.

**In `.js` sibling files — `@study-lens` directive.** A **directive block** — a
comment form containing the `@study-lens` tag — may declare the lens and an
optional inline JSON config. The directive block may sit in either the file's
**leading comment block** (before any code) OR its **trailing comment block**
(after the last non-comment statement). Authors who prefer metadata at the top
write directives at the top; authors who prefer to write the exercise first and
tuck plumbing out of the way write them at the bottom.

All forms below are accepted; `@study-lens <name>` is the tag (namespaced,
hyphenated).

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

**The directive block is stripped from the code that reaches `<StudyLenses>`.**
Learners see only the exercise body, never the plumbing. Blank lines immediately
between the stripped directive and the preserved code body are collapsed
alongside the block, so you don't get a visual gap; blanks at the file's BOF/EOF
edge are preserved.

**Middle-of-file placement is NOT supported.** A directive token surrounded by
code on both sides is inert — reliably distinguishing a real directive from the
same characters inside a string/regex/ template literal would require a JS
tokenizer.

**Both-block placement throws.** If a `@study-lens` tag appears in BOTH the
leading AND trailing comment block, the build fails with an
"ambiguous-placement" error naming the file. Pick one.

**Contiguous `//` runs are atomic.** In

```js
// Author: Eve
// @study-lens parsons
```

the two `//` lines form one comment form and both are stripped when the
directive is detected. If you want `// Author: Eve` to survive, separate it from
the directive with a blank line — that breaks the run into two independent
forms:

```js
// Author: Eve

// @study-lens parsons
```

Now only the directive line is stripped.

**Malformed JSON throws** with the file path in the error message — matching the
cascade-resolver's behavior for malformed `lenses.json`.

**In `.md` / `.mdx` files — frontmatter `defaultLens`.** Set a per-file default
that every fence in the file picks up. Per-fence `:suffix` still wins.

```markdown
---
defaultLens: highlight
---

\`\`\`js // uses 'highlight' (frontmatter) \`\`\`

\`\`\`js:study // uses 'study' (explicit suffix wins) \`\`\`
```

Read from `vfile.data.frontMatter.defaultLens`; Docusaurus pre-populates it
before `beforeDefaultRemarkPlugins` runs. The configured-languages gate still
applies — frontmatter cannot make an unconfigured language transform.

**Fence info string grammar (URL-style):**

```text
<lang>[:<lens>[?<key>[=<value>]( &<key>[=<value>] )*]]
```

Examples (the per-fence override shown is what gets **merged INTO**
`configs.lenses["trace"]` before emission):

```text
js                       → bare; emit no `lens`, configs carries cascade as-is
js:trace                 → lens="trace"; configs.lenses["trace"] = cascade entry
js:trace?stepDelay=500   → lens="trace"; cascade.lenses["trace"] deep-merged
                                          with {stepDelay: "500"}
js:trace?cols=value,steps
                         → lens="trace"; deep-merged with {cols: ["value","steps"]}
js:trace?key             → lens="trace"; deep-merged with {key: true}  (no `=`)
js:trace?key=            → lens="trace"; deep-merged with {key: ""}    (empty val)
js:trace?a=1&b=2         → lens="trace"; deep-merged with {a: "1", b: "2"}
```

Query-parameter semantics (URL-semantic; no parse-time numeric coercion):

- `?key=value` → string `"value"`.
- `?key=v1,v2,v3` → array of strings `["v1","v2","v3"]`.
- `?key` (no `=`) → boolean `true`.
- `?key=` (empty value) → empty string `""`.
- `?a=1&b=2` → multiple keys joined by `&`.

The bare-`js` form emits **no `lens` prop** — the orchestrator resolves via
cascade-bundle / editor-home-base fallback. `configs` still ships the whole
resolved cascade unchanged.

When a query is present, the parsed query is **deep-merged INTO** the cascade's
`lenses[lens]` entry, and the resulting whole-cascade object (with the merged
per-lens entry baked in) is emitted as the `configs` attribute. There is no
parallel `config` prop — the cascade IS the merged truth.

Malformed info strings (bad lens name, malformed query, leading empty token
after `:`, etc.) leave the fence as a plain code block (not transformed). Same
robustness contract as the configured- languages rule's silent-skip behavior.

**Precedence (authoritative):**

Fenced code blocks inside `.md` / `.mdx` — `lens` resolution:

```text
fence :suffix lens   >   frontmatter defaultLens   >   none
(cascade `defaults[lang]` is gate-only here — controls whether the
 fence transforms but does NOT populate `lens` per AR-1 locked
 decision 1; the cascade-supplied default seam is L2-deferred)
```

Sibling `.js` files — `lens` resolution (asymmetric with fences — siblings
always need a `lens` value because they always transform):

```text
file's @study-lens directive (leading OR trailing)   >   cascade defaults[lang]
```

Per-fence / per-sibling override — merged INTO the cascade BEFORE emission:

```text
parsed fence query  OR  directive JSON
                  ↓ deep-merged into
                  cascade.lenses[lens]
                  ↓ shipped as part of
                  the `configs` attribute (whole cascade, opaque)
```

There is no separate `config` prop. When `lens` resolves from frontmatter (no
`:suffix`, no per-fence query) — or from sibling directive with no JSON body —
`configs.lenses[lens]` carries the cascade's entry unchanged.

Cascade → emitted **whole** as the `configs` attribute (opaque, always emitted
when a fence transforms; the per-lens override-merge happens in-place on the
`lenses[lens]` sub-tree before emission).

**Array-replace caveat.** The deep-merge replaces arrays rather than
concatenating them. If the cascade has `lenses.highlight.markers = ["a", "b"]`
and a directive supplies `{"markers": ["c"]}`, the result is `{markers: ["c"]}`
— NOT `["a", "b", "c"]`. If additive array behavior is needed, restate the full
list in the directive.

**Frontmatter cannot carry lens config.** Only the lens name. Authors who need
per-lens config inside an `.md` page use a nested `lenses.json` in the
surrounding directory, OR put the per-fence override in the fence info string's
URL-style query suffix (`js:trace?stepDelay=500`). Asymmetric with `.js`
siblings.

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
	label: string; // path relative to pageDir, without extension
	code: string;
	lang: LangName;
	lens: LensName; // directive-override > cascade default
	lensConfig?: Readonly<Record<string, unknown>>;
	// ^ directive's JSON body only (un-merged); cascade's `lenses[lens]`
	//   is applied at emission time.
}>;

// The props shape the plugin emits onto a transformed `<StudyLenses>`
// JSX node (the three-prop public API in
// `orchestrate/types.ts:StudyLensesProps`). `configs` is emitted via
// `mdxJsxAttributeValueExpression` so MDX evaluates the estree
// directly and the consumer React component receives a real object
// (see § Config-prop serialization below — no consumer-side parser
// needed). Per-fence URL-query / sibling directive JSON overrides are
// deep-merged INTO `configs.lenses[lens]` at emission time — there is
// no separate `config` prop.
type StudyLensesHastProps = Readonly<{
	snippet: string;
	lens?: LensName;
	configs?: ResolvedConfig;
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

The plugin emits `configs` as an **`mdxJsxAttributeValueExpression`** — an MDX
AST node that carries both the JSON source string AND a parsed estree program.
MDX's compiler emits the estree expression directly into the compiled JSX
(`<StudyLenses configs={{…}} />`); the React component receives a real object at
runtime, not a JSON string.

1. The cascade is structurally non-empty on any transformed fence (the
   configured-languages rule guarantees `defaults[lang]` is set, and the
   built-in DEFAULTS fill ensures every top-level key is present), so `configs`
   is **always emitted** on a transformed fence. Fences that don't transform
   produce no `<StudyLenses>` node at all — there is no attribute to omit.
2. The plugin builds the estree program via
   [`estree-util-value-to-estree`](https://github.com/remcohaszing/estree-util-value-to-estree),
   wraps it in an `ExpressionStatement` inside a `Program` node, and attaches it
   as `data.estree` on the `mdxJsxAttributeValueExpression`. MDX prefers the
   parsed program over the source string, so the JSON serialization is
   structural — round-tripping is guaranteed.

No consumer-side parser is required. The orchestrator destructures `configs` as
a plain object and reads `configs.lenses?.[lens]` directly. Manually-authored
`<StudyLenses configs={{…}} />` JSX in `.mdx` files passes the same object shape
through the same prop slot — same machinery, no special branch.

`snippet` and `lens` remain string-valued attributes (the standard
`mdxJsxAttribute` with a `value: string`). Only `configs` requires the
expression-valued attribute because it carries structured data.

## How to navigate the code

- `types.ts` — domain model; every other file imports types from here.
- `ext-to-lang.ts` — tiny static map: `.js` → `js`, `.py` → `py`, etc.
- `resolve-cascade.ts` — walks directories collecting `lenses.json` files,
  deep-merges them (with array-concat for `embedSiblings.ignorePrefixes`),
  caches results keyed by `(contentRoot, absDir)` with mtime-based invalidation.
  Returns `ResolvedConfig` (frozen).
- `discover-siblings.ts` — given a sibling-bearing page's directory +
  `ResolvedConfig`, walks downward stopping at page boundaries and
  ignore-prefixed dirs (also skipping hidden dirs, `node_modules/`; not
  following symlinks), returns `Sibling[]` (frozen).
- `code-block-to-jsx.ts` — converts a `code` MDAST node into an
  `mdxJsxFlowElement` node named `StudyLenses` with the three-prop attribute set
  (`snippet` and `configs` always; `lens` when a resolver hits). All
  `<StudyLenses>` emission sites call this single helper.
- `remark-study-lenses.ts` — the remark plugin factory: guards, resolves config,
  transforms fenced code blocks whose language is configured, appends sibling
  embeds.
- `lifecycle-plugin.ts` — the Docusaurus lifecycle plugin: exposes
  `getPathsToWatch` so dev-server rebuilds trigger on `lenses.json` or sibling
  `.js` changes.
- `prettify-dir-name.ts` — shared pipeline for converting a directory name into
  a human-readable heading: strip exercise-set prefix → strip numeric ordering →
  kebab-case to Title Case. Used by both the remark plugin (for sibling group
  headings) and the sidebar generator (for category labels).
- `sidebar-generator.ts` — `createStudySidebarGenerator({ contentRoot })`
  factory; returns a Docusaurus `sidebarItemsGenerator` that rewrites category
  labels for directories matching any `exerciseSetPrefixes` entry via the shared
  `prettify-dir-name.ts` pipeline.
- `index.ts` — re-exports the three entry points (remark factory, lifecycle
  plugin, sidebar-generator factory) used by `docusaurus.config.ts`.
- No custom tabs-wrapper component. Tabs-mode embeds emit Docusaurus's native
  `<Tabs>`/`<TabItem>` directly from the plugin as `mdxJsxFlowElement` nodes;
  each `<TabItem>` contains one `<StudyLenses>`.
- `tests/` — Vitest unit tests, co-located per DEV.md convention. On-disk
  fixture trees under `tests/fixtures/`.

## Dependencies

Direct imports used by this plugin (all resolved from the site root
`node_modules/`, not a local `package.json`):

- `unist-util-visit` — MDAST tree traversal.
- `@types/mdast`, `@types/unist` — MDAST/unist TypeScript types.
- `@types/estree` — types for the estree `Program` / `Expression` nodes attached
  to `mdxJsxAttributeValueExpression` value bodies (see `code-block-to-jsx.ts` §
  `buildObjectAttribute`).
- `estree-util-value-to-estree` — converts a runtime JS value (the resolved
  cascade) into the estree expression MDX emits into the compiled JSX so the
  consumer React component receives a real object (no consumer-side parser
  needed). **Shipped transitively** via `@docusaurus/core` →
  `@docusaurus/mdx-loader` → `estree-util-value-to-estree`; the plugin imports
  it as a peer of MDX's own pipeline. If a future Docusaurus upgrade
  restructures its MDX deps, this plugin needs to re-confirm the transitive
  availability or declare it explicitly.
- `fast-glob` — used by the lifecycle plugin to expand watch globs.
- `@docusaurus/types` — `LoadContext`, `Plugin` types for the lifecycle piece.
- Freeze utilities from [`../../lib/utils/freeze.ts`](../../lib/utils/freeze.ts)
  (`freezeInPlace`, `cloneAndFreeze`).
- Deep-merge utility from
  [`../../lib/utils/deep-merge.ts`](../../lib/utils/deep-merge.ts).

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
- **Swizzling** — Docusaurus's term for ejecting a local copy of a theme file so
  you can override it.
  `npx docusaurus swizzle @docusaurus/theme-classic MDXComponents --eject`
  creates `src/theme/MDXComponents.js` as an editable copy.
- **Remark plugin** — a function that transforms MDAST (the markdown AST) during
  Docusaurus's content compilation. Registered via `beforeDefaultRemarkPlugins`
  (runs before Docusaurus's built-in transforms) or `remarkPlugins` (runs
  after).
- **Lifecycle plugin** — a Docusaurus plugin with hooks like `loadContent`,
  `contentLoaded`, `getPathsToWatch`. Our lifecycle plugin only implements
  `getPathsToWatch` so the dev server recompiles MDX when `lenses.json` or
  sibling `.js` files change.

## Links

- **Up:** [site root README](../../../README.md) ·
  [AGENTS.md](../../../AGENTS.md) · [DEV.md](../../../DEV.md)
- **Parent:** [`src/plugins/README.md`](../README.md)
- **Downstream consumer:**
  [`src/lib/welcome-to-programming/just-enough/javascript/orchestrate/`](../../lib/welcome-to-programming/just-enough/javascript/orchestrate/)
  — the orchestrator package whose `<StudyLenses>` component this plugin emits
  JSX for.
- **Lens contract:**
  [`src/lib/welcome-to-programming/just-enough/javascript/lenses/`](../../lib/welcome-to-programming/just-enough/javascript/lenses/)
  — individual lens implementations the orchestrator dispatches to (per the
  resolved `lens` prop).
