/**
 * @file Mutates an MDAST `code` node in place so that downstream
 * rendering emits the plugin's `<StudyLens>` React component.
 *
 * @remarks This is the hast-name emission path — suitable for JSX
 * leaves with primitive props. Structural JSX with nested children
 * (the Tabs-mode embed in Module D) uses `mdxJsxFlowElement` directly.
 *
 * The `config` prop is serialization-tolerant per DOCS.md §Structural
 * constraints "Emission shapes": the value stored on `hProperties.config`
 * here is a JSON string when `lensConfig` is provided. The component
 * side decodes either shape (object if the pipeline round-trips cleanly,
 * string otherwise) via the shared `parseLensConfig` helper. Until
 * Module I lands the parser, V1 mocks accept a string.
 */

import type { Properties } from 'hast';
import type { Code } from 'mdast';

import type { LangName, LensName } from './types.js';

/**
 * Rewrites a `code` MDAST node into hast form carrying lens identity.
 *
 * @param codeNode - The `code` node produced by the markdown parser.
 *   Mutated in place: gains a `data.hName` of `'StudyLens'` and
 *   `data.hProperties` of `{ code, lens, lang, config? }`.
 * @param params - `lens` is the resolved lens name; `lang` is the
 *   language identifier from the fence info string (`'js'`, `'python'`);
 *   `lensConfig` is the per-lens configuration from the resolved
 *   cascade, serialized as JSON onto `hProperties.config` when present.
 */
function codeBlockToHast(
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
): void {
	const hProperties: Properties = {
		code: codeNode.value,
		lens,
		lang,
	};
	if (lensConfig !== undefined) {
		hProperties.config = JSON.stringify(lensConfig);
	}
	codeNode.data = {
		...(codeNode.data ?? {}),
		hName: 'StudyLens',
		hProperties,
	};
}

export default codeBlockToHast;
