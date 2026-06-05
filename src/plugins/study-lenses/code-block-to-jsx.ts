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
 * README § `rehype-raw` lowercases hast-element tag names for the
 * backstory.
 *
 * @remarks WHY object attributes use `mdxJsxAttributeValueExpression`:
 * MDX's `mdxJsxAttribute` with a string `value` renders as a string-valued
 * JSX prop (`configs="..."`). To pass a structured object to the React
 * component (`configs={{...}}`), the value must be an
 * `mdxJsxAttributeValueExpression` carrying both the source code and the
 * parsed estree program. MDX's compiler emits the estree expression
 * directly into the compiled output; React receives a real object. This
 * removes the wire-format mismatch that an earlier
 * always-stringify-and-document-a-parser strategy created (see plugin
 * README § Config-prop serialization).
 */

import { valueToEstree } from 'estree-util-value-to-estree';

import type { Code } from 'mdast';
import type { Program } from 'estree';

import type { LensName, StudyLensesHastProps } from './types.js';

// Local type definitions — no external import from `mdast-util-mdx-jsx`
// (consistent with the existing `appendTabsEmbed` inline `as const` casts
// in `remark-study-lenses.ts`).
//
// `name` is narrowed to `keyof StudyLensesHastProps` so the contract type
// in `./types.ts` is the single source of truth for emitted attribute
// names — a typo or drift between the emission helper and the contract
// fails at compile time.
//
// Two attribute shapes: string-valued (snippet, lens) and
// expression-valued (configs). The expression-valued shape carries the
// estree program MDX evaluates to produce the object at runtime.
type StudyLensesJsxStringAttribute = {
	type: 'mdxJsxAttribute';
	name: keyof StudyLensesHastProps;
	value: string;
};

type StudyLensesJsxExpressionAttribute = {
	type: 'mdxJsxAttribute';
	name: keyof StudyLensesHastProps;
	value: {
		type: 'mdxJsxAttributeValueExpression';
		value: string;
		data: { estree: Program };
	};
};

type StudyLensesJsxAttribute =
	| StudyLensesJsxStringAttribute
	| StudyLensesJsxExpressionAttribute;

type StudyLensesJsxNode = {
	type: 'mdxJsxFlowElement';
	name: 'StudyLenses';
	attributes: StudyLensesJsxAttribute[];
	children: [];
};

/**
 * Builds an `mdxJsxFlowElement` node representing `<StudyLenses>` from a
 * fenced code block and its resolved cascade.
 *
 * @param codeNode - The source `code` MDAST node. Only `.value` is read;
 *   the node is NOT mutated.
 * @param params - `lens` (optional) is the resolved lens name when one
 *   resolves from the fence's `:suffix`, frontmatter `defaultLens`, or
 *   sibling `@study-lens` directive — omitted when no lens resolves
 *   (per AR-1 locked decision 1: bare `js` fence with cascade
 *   `defaults[lang]` populated does NOT emit `lens`; only suffix /
 *   frontmatter / directive populate it). `configs` is the **whole
 *   resolved cascade** (opaque passthrough) with any per-fence/sibling
 *   override already deep-merged INTO `configs.lenses[lens]` by the
 *   caller; emitted as an `mdxJsxAttributeValueExpression` so the
 *   consumer React component receives an object directly (no parser
 *   needed at the consumer side).
 * @returns A fresh `mdxJsxFlowElement` node with `name: 'StudyLenses'` and
 *   attribute values matching the plugin's three-prop component contract.
 *
 * @remarks Transforms are a lens-internal concern (no transforms tier in
 * the architecture); the `transforms` attribute is never emitted. The
 * `lang` identifier is used only by the caller (`transformFence`) for
 * the configured-languages gate; this function receives only `lens` and
 * optional `configs` and never threads `lang` into the emitted JSX —
 * the orchestrator's embody pipeline auto-detects language from the
 * snippet. See `./README.md` § Emitted JSX prop contract.
 */
function codeBlockToJsx(
	codeNode: Code,
	{
		lens,
		configs,
	}: {
		readonly lens?: LensName;
		readonly configs?: Readonly<Record<string, unknown>>;
	},
): StudyLensesJsxNode {
	const attributes: StudyLensesJsxAttribute[] = [
		{ type: 'mdxJsxAttribute', name: 'snippet', value: codeNode.value },
	];
	if (lens !== undefined) {
		attributes.push({ type: 'mdxJsxAttribute', name: 'lens', value: lens });
	}
	if (configs !== undefined) {
		attributes.push(buildObjectAttribute('configs', configs));
	}
	return {
		type: 'mdxJsxFlowElement',
		name: 'StudyLenses',
		attributes,
		children: [],
	};
}

/**
 * Builds an expression-valued `mdxJsxAttribute` whose value is the
 * estree representation of `obj`. MDX's compiler emits the estree
 * program directly into the compiled JSX; the React component receives
 * a real object (not a JSON string).
 *
 * The `value` field of the `mdxJsxAttributeValueExpression` is the
 * source code MDX uses when no `data.estree` is present; we supply
 * both so MDX prefers the parsed program. JSON-string source is valid
 * JS object-literal syntax for JSON-compatible payloads, which matches
 * what the cascade resolver produces.
 */
function buildObjectAttribute(
	name: keyof StudyLensesHastProps,
	obj: Readonly<Record<string, unknown>>,
): StudyLensesJsxExpressionAttribute {
	const sourceCode = JSON.stringify(obj);
	const expression = valueToEstree(obj);
	const program: Program = {
		type: 'Program',
		sourceType: 'module',
		body: [
			{
				type: 'ExpressionStatement',
				expression,
			},
		],
	};
	return {
		type: 'mdxJsxAttribute',
		name,
		value: {
			type: 'mdxJsxAttributeValueExpression',
			value: sourceCode,
			data: { estree: program },
		},
	};
}

export default codeBlockToJsx;
export type {
	StudyLensesJsxAttribute,
	StudyLensesJsxStringAttribute,
	StudyLensesJsxExpressionAttribute,
	StudyLensesJsxNode,
};
