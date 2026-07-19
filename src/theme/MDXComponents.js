/**
 * @file Swizzled MDXComponents registry. Extends Docusaurus's default
 * registry with three entries:
 *
 * - `StudyLenses` — the orchestrator component. The new-tree
 *   `src/lib/study-lenses/orchestrate/` (per the embody / lenses /
 *   orchestrate three-peer architecture) hasn't been rebuilt yet, so this
 *   is a temporary pointer at the frozen, still-functional
 *   `src/lib/study-lenses--deprecated-architecture/orchestrate/index.tsx`.
 *   Swap this import back to the new tree once its orchestrator lands.
 *   The remark plugin emits every `<StudyLenses>` occurrence as an
 *   `mdxJsxFlowElement` node via `codeBlockToJsx` — in-page fences,
 *   bottom-mode sibling embeds, AND the inner `<StudyLenses>` nested
 *   inside each `<TabItem>` in tabs-mode embeds. `rehype-raw` passes
 *   `mdxJsxFlowElement` through its `passThrough` list, so the
 *   PascalCase component name survives intact to the MDX runtime.
 * - `Tabs` / `TabItem` — imported from `@theme/`. They ship with
 *   `@docusaurus/theme-classic` but are NOT in the default registry,
 *   so our remark plugin's emitted `mdxJsxFlowElement` nodes for
 *   tabs-mode embeds would fail to resolve without this registration.
 *
 * Swizzled per Docusaurus convention (`.js`, not `.ts`); imports use
 * the `@site/` webpack alias for project paths and `@theme/` for
 * theme-component aliases.
 */

import MDXComponents from '@theme-original/MDXComponents';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import StudyLenses from '@site/src/lib/study-lenses--deprecated-architecture/orchestrate/index';

export default {
	...MDXComponents,
	StudyLenses,
	Tabs,
	TabItem,
};
