/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/theme-classic" />

// Markdown imported with the `?raw` resource query resolves to the file's
// text. Vite (vitest) supports the query natively; the webpack side is the
// raw-markdown-text plugin in docusaurus.config.ts.
declare module '*.md?raw' {
	const content: string;
	export default content;
}
