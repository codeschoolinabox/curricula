/**
 * @file Swizzled MDXComponents registry. Extends Docusaurus's default
 * registry with four entries:
 *
 * - `StudyLens` — V1 mock component from the `study-lenses` plugin.
 *   V2 swaps this import to point at the rich component at
 *   `src/lib/welcome-to-programming/just-enough/javascript/components/lenses/study/`.
 *   The plugin emits `<StudyLens>` through two paths: `codeBlockToJsx`
 *   (`mdxJsxFlowElement` — preserves PascalCase) for in-page fences and
 *   bottom-mode sibling embeds, AND `codeBlockToHast` (`data.hName`) for
 *   the `<StudyLens>` nested inside each `<TabItem>` in tabs-mode embeds.
 * - `studylens` — lowercase defensive alias. `rehype-raw` lowercases the
 *   `tagName` of hast elements produced by the `hName` path somewhere in
 *   Docusaurus's `.md` pipeline, so the MDX runtime looks up
 *   `components.studylens`. Without this alias, tabs-mode pages render
 *   raw `<studylens>` DOM elements. Remove this line only when ALL
 *   emission paths use `mdxJsxFlowElement` (see follow-up in plugin
 *   README § "Gotcha: `rehype-raw` lowercases component names…").
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

import StudyLens from '@site/src/plugins/study-lenses/components/StudyLensMock';

export default {
	...MDXComponents,
	StudyLens,
	studylens: StudyLens,
	Tabs,
	TabItem,
};
