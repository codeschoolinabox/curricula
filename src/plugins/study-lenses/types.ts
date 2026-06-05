/**
 * @file Domain model for the study-lenses Docusaurus plugin.
 *
 * Every term used here is defined in the package Glossary — see
 * {@link ./README.md}. Names propagate into function signatures,
 * test descriptions, JSDoc, and error messages.
 *
 * @remarks
 * Return values that are objects or arrays are deep-frozen at the
 * function boundary per the project convention (see
 * {@link ../../lib/utils/freeze.ts}). The MDAST tree returned by
 * the remark plugin is the explicit exception — downstream plugins
 * mutate it.
 */

// ─── Identifier aliases ─────────────────────────────────────

/**
 * A lens identifier. Opaque string; `study` is the default meta-lens.
 *
 * @remarks Lenses are defined elsewhere (in the components tree). This
 * plugin treats names as opaque tokens — it does not validate that a
 * given lens exists. An unknown lens is the component's problem at
 * render time, not the plugin's at build time.
 */
type LensName = string;

/**
 * A language identifier as it appears in a fenced code block's info
 * string (`js`, `python`, `html`) — NOT a file extension.
 *
 * @remarks The plugin maps file extensions to language identifiers
 * via a static table when scanning `.js` siblings. Code fences carry
 * the identifier directly.
 */
type LangName = string;

// ─── lenses.json file shape (on-disk) ───────────────────────

/**
 * The shape of a `lenses.json` file as parsed from disk. All top-level
 * keys are optional; the resolver fills from DEFAULTS and inherits from
 * ancestor files via the cascade.
 *
 * @remarks This is NOT the resolved shape — it is the raw file. Prefer
 * {@link ResolvedConfig} anywhere a fully-populated, deep-frozen config
 * is needed.
 */
type LensesConfigFile = Readonly<{
	/**
	 * Per-language default-lens slot. A non-null entry enables the language
	 * (configured-languages rule) AND supplies the default lens for bare
	 * fences in that language. An explicit `null` is **subtree
	 * deconfiguration** — a child `lenses.json` suppresses an ancestor's
	 * enablement; fences in that subtree are left untransformed. A missing
	 * key means the language was never enabled at any ancestor level.
	 */
	defaults?: Readonly<Record<LangName, LensName | null>>;
	embedSiblings?: Readonly<Partial<EmbedSiblingsConfig>>;
	lenses?: Readonly<Record<LensName, Readonly<Record<string, unknown>>>>;
	/**
	 * Directory-name prefixes that mark "exercise set" folders for
	 * sidebar-label stripping (Module H). Merged across the cascade with
	 * array concatenation — nested `lenses.json` files extend, they do
	 * not replace.
	 */
	exerciseSetPrefixes?: ReadonlyArray<string>;
}>;

// ─── Resolved configuration ─────────────────────────────────

/**
 * The embed-siblings configuration block after cascade resolution.
 *
 * @remarks `ignorePrefixes` uses deep-merge with **array concatenation**
 * across the cascade — nested `lenses.json` files EXTEND the parent
 * list rather than replacing it. Scalar fields (`mode`, `sectionHeading`)
 * are last-writer-wins.
 */
type EmbedSiblingsConfig = Readonly<{
	mode: 'off' | 'bottom' | 'tabs';
	ignorePrefixes: ReadonlyArray<string>;
	sectionHeading: string | null;
}>;

/**
 * The fully-resolved, deep-frozen configuration for a specific
 * directory. Returned by {@link resolveCascade}.
 *
 * @remarks All fields are required (filled from DEFAULTS if the cascade
 * leaves them unset). Consumers may treat this shape as exhaustive — no
 * optional-chaining needed on the top-level keys.
 */
type ResolvedConfig = Readonly<{
	/**
	 * Post-cascade per-language default-lens map. Same shape as
	 * `LensesConfigFile.defaults` but required (filled from `DEFAULTS`'s
	 * empty seed if no `lenses.json` ever sets it). The two consumer gates
	 * — fence-side in `remark-study-lenses.ts` and sibling-side in
	 * `discover-siblings.ts` — apply gate-semantics parity (`== null`) to
	 * handle absent key and explicit `null` uniformly.
	 */
	defaults: Readonly<Record<LangName, LensName | null>>;
	embedSiblings: EmbedSiblingsConfig;
	lenses: Readonly<Record<LensName, Readonly<Record<string, unknown>>>>;
	exerciseSetPrefixes: ReadonlyArray<string>;
}>;

// ─── Sibling discovery ──────────────────────────────────────

/**
 * A `.js` file discovered during the sibling walk, shaped for direct
 * consumption by the remark-plugin append phase.
 *
 * @remarks `label` is the path **relative to the sibling-bearing
 * page's directory**, with the extension stripped. This disambiguates
 * same-basename collisions across subdirectories (e.g. `a/foo.js` and
 * `b/foo.js` become labels `a/foo` and `b/foo`).
 */
type Sibling = Readonly<{
	absPath: string;
	label: string;
	code: string;
	lang: LangName;
	/**
	 * Final resolved lens — directive's lens wins over cascade default.
	 */
	lens: LensName;
	/**
	 * Raw JSON config from the file's `@study-lens` directive, if any.
	 * Stored un-merged at the sibling-walker boundary; the deep-merge
	 * INTO `cascade.lenses[lens]` happens at the remark plugin's
	 * emission call site, and the merged result rides inside the
	 * whole-cascade `configs` attribute on the emitted JSX. See
	 * `./DOCS.md` § Sibling walker step 4 (Annotate) and § Remark
	 * transformer phase 3 (Emission shape) for the full flow.
	 */
	lensConfig?: Readonly<Record<string, unknown>>;
}>;

// ─── hast props (plugin → component interface) ──────────────

/**
 * The prop shape the plugin emits onto a transformed
 * `mdxJsxFlowElement(StudyLenses)` JSX node. Surfaces as React
 * props on `<StudyLenses>` per the **three-prop public API** in
 * `orchestrate/types.ts:StudyLensesProps`. Note the asymmetry: the
 * plugin's emission type is concrete (this `ResolvedConfig`-shaped
 * `configs`), but the orchestrate-side public type is **maximally
 * opaque** (`Readonly<Record<string, unknown>>`). The orchestrator
 * makes its `lenses[lens]` lookup an internal structural assumption
 * at the cast boundary inside `resolvePerLensConfig`, not a public
 * type constraint.
 *
 * @remarks `configs` is emitted via an
 * `mdxJsxAttributeValueExpression` — MDX evaluates the estree
 * directly and the consumer React component receives a real object
 * (not a JSON string). No consumer-side parser is required. See
 * `code-block-to-jsx.ts` § buildObjectAttribute for the wire format.
 *
 * @remarks `configs` carries the **whole resolved cascade** (the same
 * shape as `ResolvedConfig` — `defaults`, `embedSiblings`,
 * `exerciseSetPrefixes`, `lenses`). Any per-fence URL-style query OR
 * sibling `@study-lens` directive JSON override is **deep-merged INTO
 * `configs.lenses[lens]` at emission time**, so the orchestrator sees
 * a single source of truth for the per-lens config:
 * `configs.lenses?.[lens]`. There is no separate `config` prop — the
 * cascade IS the merged truth (per the README's § Emitted JSX prop
 * contract and the orchestrator's two-tier resolution chain
 * `module.config() ⊕ configs.lenses?.[lens]`).
 *
 * @remarks **No mutation of the resolver's frozen output.** The
 * resolver returns a deep-frozen `ResolvedConfig`. Before the
 * override-merge runs, the relevant `lenses[lens]` subtree is
 * **cloned** so the merge operates on a fresh object — the cached
 * `ResolvedConfig` is never mutated. The emitted `configs` value is
 * a structurally-fresh `ResolvedConfig`-shaped object whose
 * `lenses[lens]` reflects the post-merge state; all other top-level
 * keys reference the resolver's frozen subtrees by-reference (they
 * are immutable anyway).
 *
 * @remarks The pre-Round-2 attributes `code`, `lang`, and
 * `transforms` are gone, and the pre-Round-3 `config` attribute is
 * absorbed into `configs.lenses[lens]`. `snippet` replaces `code`;
 * `lang` is consumed internally by the configured-languages gate in
 * `transformFence` but never emitted onto the JSX node; `transforms`
 * is dropped entirely (transforms are a lens-internal concern per the
 * lenses peer's `DOCS.md` §Structural constraints).
 */
type StudyLensesHastProps = Readonly<{
	snippet: string;
	lens?: LensName;
	configs?: ResolvedConfig;
}>;

// Tabs-mode embeds emit Docusaurus's native `<Tabs>`/`<TabItem>` via
// `mdxJsxFlowElement` nodes (see DOCS.md §Sibling-bearing page / Remark
// transformer phase 4). No custom `StudyLensTabs` component, no
// `tabsJson` JSON-string prop.

// ─── Plugin entry-point options ─────────────────────────────

/**
 * Options for the remark plugin factory. One instance per Docusaurus
 * docs-instance — the `contentRoot` scopes both file filtering (the
 * plugin ignores files outside it) and cascade bounds (the resolver
 * walks up only to this path).
 */
type RemarkPluginOptions = Readonly<{
	contentRoot: string;
}>;

/**
 * Options for the Docusaurus lifecycle plugin. The lifecycle plugin
 * exposes `getPathsToWatch` only — it exists to keep the dev server
 * in sync when `lenses.json` or sibling `.js` files change.
 *
 * @remarks `contentRoots` are paths relative to the Docusaurus site
 * directory, matching the `path` option each `plugin-content-docs`
 * instance receives in `docusaurus.config.ts`.
 */
type LifecyclePluginOptions = Readonly<{
	contentRoots: ReadonlyArray<string>;
}>;

/**
 * Options for the sidebar-generator factory (Module H). Discriminated
 * union — callers either point to a content root on disk (production;
 * the returned generator calls the cascade resolver on each invocation
 * to pick up live edits to `exerciseSetPrefixes`, mtime-invalidated)
 * OR inject a pre-resolved config directly (tests, in-memory callers;
 * bypasses disk entirely).
 *
 * @remarks The return type of `createStudySidebarGenerator` is the
 * `SidebarItemsGeneratorOption` shape declared by
 * `@docusaurus/plugin-content-docs` — it is not re-declared here to
 * avoid pinning the plugin's type surface to a specific Docusaurus
 * version. The implementing module imports it at the call site.
 */
type SidebarGeneratorOptions =
	| Readonly<{ contentRoot: string }>
	| Readonly<{ resolvedConfig: ResolvedConfig }>;

// ─── Exports ────────────────────────────────────────────────

export type {
	EmbedSiblingsConfig,
	LangName,
	LensesConfigFile,
	LensName,
	LifecyclePluginOptions,
	RemarkPluginOptions,
	ResolvedConfig,
	SidebarGeneratorOptions,
	Sibling,
	StudyLensesHastProps,
};
