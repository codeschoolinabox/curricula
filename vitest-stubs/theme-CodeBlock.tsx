/**
 * @file Test stub for `@theme/CodeBlock`. Production CodeBlock is
 * Docusaurus's Prism-highlighted code display with a copy button, line
 * numbers, and optional title header. The stub just renders a `<pre>`
 * with the children as-is and exposes `language` + `title` via data-
 * attributes for assertion.
 */

import React from 'react';

type CodeBlockProps = {
	readonly children?: React.ReactNode;
	readonly language?: string;
	readonly title?: string;
};

function CodeBlock({
	children,
	language,
	title,
}: CodeBlockProps): React.JSX.Element {
	return (
		<pre data-language={language} data-title={title}>
			{children}
		</pre>
	);
}

export default CodeBlock;
