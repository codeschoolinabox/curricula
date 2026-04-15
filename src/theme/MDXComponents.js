/**
 * @file Swizzled MDXComponents registry. Extends Docusaurus's default
 * registry with three entries:
 *
 * - `StudyLens` — V1 mock component from the `study-lenses` plugin.
 *   V2 swaps this import to point at the rich component at
 *   `src/lib/welcome-to-programming/just-enough/javascript/components/lenses/study/`.
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
	Tabs,
	TabItem,
};
