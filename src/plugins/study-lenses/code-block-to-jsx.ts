/**
 * @file Emits an MDAST `mdxJsxFlowElement` node for `<StudyLenses>` so that
 * `rehype-raw`'s passThrough mechanism preserves the PascalCase component
 * name through Docusaurus's `.md` processing pipeline.
 *
 * @remarks WHY `mdxJsxFlowElement` and not the hast-name path:
 * `rehype-raw` normalises every HAST `element.tagName` to lowercase (HTML
 * convention). A `code` MDAST node mutated with `data.hName = 'StudyLenses'`
 * produces a HAST element whose `tagName` is lowercased to `studylenses`,
 * which React does not recognise as a component. Nodes of type
 * `mdxJsxFlowElement` are listed in `rehype-raw`'s `passThrough` option —
 * `rehype-raw` skips them entirely, preserving the exact
 * `name: 'StudyLenses'` through to the MDX runtime.
 *
 * **Every `<StudyLenses>` emission goes through this function** — in-page
 * fences via `transformFence`, bottom-mode sibling embeds via
 * `appendBottomEmbed`, AND tabs-mode inner children via `appendTabsEmbed`
 * (where the returned `mdxJsxFlowElement(StudyLenses)` node is nested as
 * the sole child of each `mdxJsxFlowElement(TabItem)`). Consolidating on
 * a single emission path removed the earlier need for a lowercase
 * `studylenses` alias in the swizzled MDXComponents; see the plugin
 * README's "history" note in the `@study-lens` override section for the
 * backstory.
 */

import type { Code } from 'mdast';

import type { LensName, StudyLensesHastProps } from './types.js';

// Local type definitions — no external import from `mdast-util-mdx-jsx`
// (consistent with the existing `appendTabsEmbed` inline `as const` casts
// in `remark-study-lenses.ts`).
//
// `name` is narrowed to `keyof StudyLensesHastProps` so the contract type
// in `./types.ts` is the single source of truth for emitted attribute
// names — a typo or drift between the emission helper and the contract
// fails at compile time.
type StudyLensesJsxAttribute = {
	type: 'mdxJsxAttribute';
	name: keyof StudyLensesHastProps;
	value: string;
};

type StudyLensesJsxNode = {
	type: 'mdxJsxFlowElement';
	name: 'StudyLenses';
	attributes: StudyLensesJsxAttribute[];
	children: [];
};

/**
 * Builds an `mdxJsxFlowElement` node representing `<StudyLenses>` from a
 * fenced code block and its resolved lens configuration.
 *
 * @param codeNode - The source `code` MDAST node. Only `.value` is read;
 *   the node is NOT mutated — unlike `codeBlockToHast`.
 * @param params - `lens` (optional) is the resolved lens name when one
 *   resolves from the fence's `:suffix`, frontmatter `defaultLens`, or
 *   sibling `@study-lens` directive — omitted when no lens resolves
 *   (per AR-1 locked decision 1: bare `js` fence with cascade
 *   `defaults[lang]` populated does NOT emit `lens`; only suffix /
 *   frontmatter / directive populate it). `lensConfig` is the per-lens
 *   resolved configuration, serialised as JSON onto the `config`
 *   attribute when present. `configs` is the cascade `lenses.*` map
 *   keyed by lens name, serialised as JSON onto the `configs` attribute
 *   when non-empty (per AR-1 locked decision 6: only emit when
 *   non-empty).
 * @returns A fresh `mdxJsxFlowElement` node with `name: 'StudyLenses'` and
 *   attribute values matching the plugin's component prop contract.
 *
 * @remarks Transforms are a lens-internal concern (no transforms tier in
 * the architecture); the `transforms` attribute is never emitted. The
 * `lang` identifier is used only by the caller (`transformFence`) for
 * the configured-languages gate; this function receives only `lens` and
 * optional `lensConfig` and never threads `lang` into the emitted JSX —
 * the orchestrator's embody pipeline auto-detects language from the
 * snippet. See `./README.md` § Emitted JSX prop contract.
 */
function codeBlockToJsx(
	codeNode: Code,
	{
		lens,
		lensConfig,
		configs,
	}: {
		readonly lens?: LensName;
		readonly lensConfig?: Readonly<Record<string, unknown>>;
		readonly configs?: Readonly<
			Record<LensName, Readonly<Record<string, unknown>>>
		>;
	},
): StudyLensesJsxNode {
	const attributes: StudyLensesJsxAttribute[] = [
		{ type: 'mdxJsxAttribute', name: 'snippet', value: codeNode.value },
	];
	if (lens !== undefined) {
		attributes.push({ type: 'mdxJsxAttribute', name: 'lens', value: lens });
	}
	if (lensConfig !== undefined) {
		attributes.push({
			type: 'mdxJsxAttribute',
			name: 'config',
			value: JSON.stringify(lensConfig),
		});
	}
	if (configs !== undefined && Object.keys(configs).length > 0) {
		attributes.push({
			type: 'mdxJsxAttribute',
			name: 'configs',
			value: JSON.stringify(configs),
		});
	}
	return {
		type: 'mdxJsxFlowElement',
		name: 'StudyLenses',
		attributes,
		children: [],
	};
}

export default codeBlockToJsx;
export type { StudyLensesJsxAttribute, StudyLensesJsxNode };
