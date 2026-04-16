/**
 * @file Study lens — React wrapper around the editor+toolbar experience.
 *
 * Invoked by the swizzled `MDXComponents` for every `<StudyLens>` JSX
 * emitted by the `study-lenses` plugin. Guards on `lens` and `lang`:
 * unsupported combinations fall through to the existing `StudyLensMock`
 * so V2 is strictly additive (no regression for `highlight`, `parsons`,
 * non-JS languages, etc.). For the supported `{lens: 'study', lang: 'js'}`
 * combination, wraps the browser-only client in a `<BrowserOnly>`
 * boundary with a `<CodeBlock>` SSR fallback for hydration-clean
 * server rendering.
 *
 * @remarks The `config` prop arrives as a string from Docusaurus's `.md`
 * pipeline (JSX attribute serialization); the plugin's shared
 * {@link parseLensConfig} decoder normalizes string/object/undefined
 * variations into a single `object | string | null` shape.
 * {@link narrowToStudyOptions} then narrows that into a typed
 * {@link StudyOptions} with defaults applied — malformed or unknown
 * shapes silently fall back to defaults.
 *
 * @see COMPONENT-CONTRACT.md — prop shape + rendering contract
 * @see ./study-lens-client.tsx — the browser-only client (CodeMirror host)
 */

import BrowserOnly from '@docusaurus/BrowserOnly';
import CodeBlock from '@theme/CodeBlock';
import React from 'react';

import parseLensConfig from '@site/src/plugins/study-lenses/parse-lens-config';
import StudyLensMock from '@site/src/plugins/study-lenses/components/StudyLensMock';

import StudyLensClient from './study-lens-client.js';

import type { StudyOptions, StudyButton } from './types.js';
import type { EngineConfig } from '../../../lib/evaluating/shared/types.js';

type StudyLensProps = {
	readonly code?: string;
	readonly lens?: string;
	readonly lang?: string;
	readonly config?: string | Readonly<Record<string, unknown>>;
};

const ALL_BUTTONS: ReadonlyArray<StudyButton> = ['run', 'format', 'reset'];

/**
 * True for plain objects (not arrays, not null, not class instances).
 * Used to gate the `engine` narrowing — a typoed `"engine": [5]` in
 * `lenses.json` would otherwise cast through as garbage.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (typeof value !== 'object' || value === null) return false;
	if (Array.isArray(value)) return false;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}

/**
 * Narrows a `parseLensConfig` result into a typed {@link StudyOptions}.
 * Silently ignores malformed/unknown shapes (caller-blind pass-through
 * per plan decision 8) — the study lens's surface is tolerant by
 * design because the plugin is intentionally a generic pass-through
 * and can't validate any individual lens's schema.
 */
function narrowToStudyOptions(
	parsed: Readonly<Record<string, unknown>> | string | null,
): StudyOptions {
	if (parsed === null || typeof parsed !== 'object') return {};
	const out: { buttons?: ReadonlyArray<StudyButton>; engine?: EngineConfig } = {};
	if (Array.isArray(parsed.buttons)) {
		const valid = parsed.buttons.filter(
			(b): b is StudyButton =>
				typeof b === 'string' && (ALL_BUTTONS as ReadonlyArray<string>).includes(b),
		);
		if (valid.length > 0) out.buttons = valid;
	}
	if (isPlainObject(parsed.engine)) {
		out.engine = parsed.engine as EngineConfig;
	}
	return out;
}

/**
 * The `<StudyLens>` component — default export routed by the swizzled
 * `MDXComponents`. Gates on `lens`/`lang`; falls through to the mock
 * for any unsupported combination.
 */
function StudyLens({
	code = '',
	lens = 'study',
	lang = 'js',
	config,
}: StudyLensProps = {}): React.JSX.Element {
	if (lens !== 'study' || lang !== 'js') {
		// Conditional spread: under `exactOptionalPropertyTypes`, passing
		// `config={undefined}` explicitly is a type error — the mock's
		// `config?` means "may be absent", not "may be undefined".
		const configProp = config === undefined ? {} : { config };
		return (
			<StudyLensMock code={code} lens={lens} lang={lang} {...configProp} />
		);
	}
	const parsed = parseLensConfig(config);
	const options = narrowToStudyOptions(parsed);
	return (
		<BrowserOnly fallback={<CodeBlock language={lang}>{code}</CodeBlock>}>
			{() => <StudyLensClient code={code} options={options} />}
		</BrowserOnly>
	);
}

export default StudyLens;
export { narrowToStudyOptions };
export type { StudyLensProps };
