/**
 * @file V1 mock `<StudyLenses>` React component.
 *
 * Rendered wherever the remark plugin emits `<StudyLenses>` (either
 * as a transformed fenced code block or as a sibling embed inside
 * `<Tabs>`/`<TabItem>`). Presents a small lens/lang label above a
 * Docusaurus-styled code block via `@theme/CodeBlock` — getting
 * Prism highlighting, copy-to-clipboard, and dark-mode support for
 * free.
 *
 * V2 target: this mock is replaced by the rich study-lenses orchestrator
 * at `src/lib/welcome-to-programming/just-enough/javascript/study-lenses/orchestrator/`
 * via an MDXComponents swizzle switch. The plugin emission path is
 * unchanged.
 */

import CodeBlock from '@theme/CodeBlock';
import React from 'react';

// Webpack resolves extension-less TS imports; the `.js` suffix used
// elsewhere in the plugin is for the Node/unified runtime path, not
// the webpack-bundled theme-component path.
import parseLensConfig from '../parse-lens-config';

type StudyLensesProps = {
	readonly code?: string;
	readonly lens?: string;
	readonly lang?: string;
	readonly config?: string | Readonly<Record<string, unknown>>;
};

/**
 * Renders a minimal placeholder for the rich study environment.
 * Every prop is optional so the mock stays robust if the remark
 * plugin ever emits a degenerate node.
 */
function StudyLensesMock({
	code = '',
	lens = 'study',
	lang = 'js',
	config,
}: StudyLensesProps = {}): React.JSX.Element {
	const parsedConfig = parseLensConfig(config);
	const configSummary =
		parsedConfig === null
			? null
			: typeof parsedConfig === 'string'
				? parsedConfig
				: Object.keys(parsedConfig).join(', ');

	return (
		<div data-study-lenses={lens}>
			<ul style={{ fontSize: '0.8em', opacity: 0.7, marginBottom: '0.25rem' }}>
				<li>lens: {lens}</li>
				<li>lang: {lang}</li>
				{configSummary !== null && configSummary !== '' && (
					<li>config: {configSummary}</li>
				)}
				<li>code: {code.length} chars</li>
			</ul>
			<CodeBlock language={lang} title={`lens: ${lens}`}>
				{code}
			</CodeBlock>
		</div>
	);
}

export default StudyLensesMock;
