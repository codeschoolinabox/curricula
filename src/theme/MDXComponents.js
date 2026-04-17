/**
 * @file Swizzled MDXComponents registry. Extends Docusaurus's default
 * registry with three entries:
 *
 * - `StudyLens` — V2 study lens component at
 *   `src/lib/welcome-to-programming/just-enough/javascript/components/lenses/study/`.
 *   Unsupported lens/lang combinations fall through to the V1 mock at
 *   `src/plugins/study-lenses/components/StudyLensMock.tsx` via the
 *   component's internal lens/lang guard.
 *   The plugin emits every `<StudyLens>` occurrence as an
 *   `mdxJsxFlowElement` node via `codeBlockToJsx` — in-page fences,
 *   bottom-mode sibling embeds, AND the inner `<StudyLens>` nested
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

import StudyLens from '@site/src/lib/welcome-to-programming/just-enough/javascript/components/lenses/study';

export default {
	...MDXComponents,
	StudyLens,
	Tabs,
	TabItem,
};
