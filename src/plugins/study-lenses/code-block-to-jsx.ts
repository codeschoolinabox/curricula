/**
 * @file Emits an MDAST `mdxJsxFlowElement` node for `<StudyLens>` so that
 * `rehype-raw`'s passThrough mechanism preserves the PascalCase component
 * name through Docusaurus's `.md` processing pipeline.
 *
 * @remarks WHY `mdxJsxFlowElement` and not the hast-name path:
 * `rehype-raw` normalises every HAST `element.tagName` to lowercase (HTML
 * convention). A `code` MDAST node mutated with `data.hName = 'StudyLens'`
 * produces a HAST element whose `tagName` is lowercased to `studylens`,
 * which React does not recognise as a component. Nodes of type
 * `mdxJsxFlowElement` are listed in `rehype-raw`'s `passThrough` option —
 * `rehype-raw` skips them entirely, preserving the exact
 * `name: 'StudyLens'` through to the MDX runtime.
 *
 * **Every `<StudyLens>` emission goes through this function** — in-page
 * fences via `transformFence`, bottom-mode sibling embeds via
 * `appendBottomEmbed`, AND tabs-mode inner children via `appendTabsEmbed`
 * (where the returned `mdxJsxFlowElement(StudyLens)` node is nested as
 * the sole child of each `mdxJsxFlowElement(TabItem)`). Consolidating on
 * a single emission path removed the earlier need for a lowercase
 * `studylens` alias in the swizzled MDXComponents; see the plugin
 * README's "history" note in the `@study-lens` override section for the
 * backstory.
 */

import type { Code } from 'mdast';

import type { LangName, LensName } from './types.js';

// Local type definitions — no external import from `mdast-util-mdx-jsx`
// (consistent with the existing `appendTabsEmbed` inline `as const` casts
// in `remark-study-lenses.ts`).
type StudyLensJsxAttribute = {
	type: 'mdxJsxAttribute';
	name: string;
	value: string;
};

type StudyLensJsxNode = {
	type: 'mdxJsxFlowElement';
	name: 'StudyLens';
	attributes: StudyLensJsxAttribute[];
	children: [];
};

/**
 * Builds an `mdxJsxFlowElement` node representing `<StudyLens>` from a
 * fenced code block and its resolved lens configuration.
 *
 * @param codeNode - The source `code` MDAST node. Only `.value` is read;
 *   the node is NOT mutated — unlike `codeBlockToHast`.
 * @param params - `lens` is the resolved lens name; `lang` is the
 *   language identifier from the fence info string; `lensConfig` is the
 *   per-lens cascade configuration, serialised as JSON onto the `config`
 *   attribute when present.
 * @returns A fresh `mdxJsxFlowElement` node with `name: 'StudyLens'` and
 *   attribute values matching the plugin's component prop contract.
 */
function codeBlockToJsx(
	codeNode: Code,
	{
		lens,
		lang,
		lensConfig,
	}: {
		readonly lens: LensName;
		readonly lang: LangName;
		readonly lensConfig?: Readonly<Record<string, unknown>>;
	},
): StudyLensJsxNode {
	const attributes: StudyLensJsxAttribute[] = [
		{ type: 'mdxJsxAttribute', name: 'code', value: codeNode.value },
		{ type: 'mdxJsxAttribute', name: 'lens', value: lens },
		{ type: 'mdxJsxAttribute', name: 'lang', value: lang },
	];
	if (lensConfig !== undefined) {
		attributes.push({
			type: 'mdxJsxAttribute',
			name: 'config',
			value: JSON.stringify(lensConfig),
		});
	}
	return {
		type: 'mdxJsxFlowElement',
		name: 'StudyLens',
		attributes,
		children: [],
	};
}

export default codeBlockToJsx;
export type { StudyLensJsxAttribute, StudyLensJsxNode };
