/**
 * @file V1 mock `<StudyLens>` React component.
 *
 * Rendered wherever the remark plugin emits `<StudyLens>` (either
 * as a transformed fenced code block or as a sibling embed inside
 * `<Tabs>`/`<TabItem>`). Presents a small lens/lang label above a
 * Docusaurus-styled code block via `@theme/CodeBlock` — getting
 * Prism highlighting, copy-to-clipboard, and dark-mode support for
 * free.
 *
 * V2 target: this mock is replaced by the rich study-lens component
 * at `src/lib/welcome-to-programming/just-enough/javascript/components/lenses/study/`
 * via an MDXComponents swizzle switch. The plugin emission path is
 * unchanged.
 */

import CodeBlock from '@theme/CodeBlock';
import React from 'react';

// Webpack resolves extension-less TS imports; the `.js` suffix used
// elsewhere in the plugin is for the Node/unified runtime path, not
// the webpack-bundled theme-component path.
import parseLensConfig from '../parse-lens-config';

type StudyLensProps = {
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
function StudyLensMock({
	code = '',
	lens = 'study',
	lang = 'js',
	config,
}: StudyLensProps = {}): React.JSX.Element {
	const parsedConfig = parseLensConfig(config);
	const configSummary =
		parsedConfig === null
			? null
			: typeof parsedConfig === 'string'
				? parsedConfig
				: Object.keys(parsedConfig).join(', ');

	return (
		<div data-study-lens={lens}>
			<div
				style={{
					fontSize: '0.8em',
					opacity: 0.7,
					marginBottom: '0.25rem',
				}}
			>
				lens: {lens} · lang: {lang}
				{configSummary !== null && configSummary !== '' && (
					<>
						{' · '}
						<span>config: {configSummary}</span>
					</>
				)}
			</div>
			<CodeBlock language={lang} title={`lens: ${lens}`}>
				{code}
			</CodeBlock>
		</div>
	);
}

export default StudyLensMock;
