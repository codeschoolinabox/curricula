/**
 * @file Swizzled MDXComponents registry. Extends Docusaurus's default
 * registry with three entries:
 *
 * - `StudyLenses` — the study-lenses orchestrator component (plural —
 *   see `src/lib/welcome-to-programming/just-enough/javascript/study-lenses/README.md`
 *   for the ubiquitous language). Today this is a Pre-Increment-0
 *   pass-through at
 *   `src/lib/welcome-to-programming/just-enough/javascript/study-lenses/orchestrator/study-lenses.tsx`
 *   that re-exports the plugin's `StudyLensesMock`. Phase 1 replaces
 *   it with the real orchestrator (state + toolbar + pipeline + cache
 *   + EventBus). The remark plugin emits every `<StudyLenses>`
 *   occurrence as an `mdxJsxFlowElement` node via `codeBlockToJsx` —
 *   in-page fences, bottom-mode sibling embeds, AND the inner
 *   `<StudyLenses>` nested inside each `<TabItem>` in tabs-mode embeds.
 *   `rehype-raw` passes `mdxJsxFlowElement` through its `passThrough`
 *   list, so the PascalCase component name survives intact to the MDX
 *   runtime.
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

import StudyLenses from '@site/src/lib/welcome-to-programming/just-enough/javascript/study-lenses/orchestrator/study-lenses';

export default {
	...MDXComponents,
	StudyLenses,
	Tabs,
	TabItem,
};
