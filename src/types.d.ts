/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/theme-classic" />

// Markdown imported with the `?raw` resource query resolves to the file's
// text. Vite (vitest) supports the query natively; the webpack side is the
// raw-markdown-text plugin in docusaurus.config.ts.
declare module '*.md?raw' {
	const content: string;
	export default content;
}

// Ambient declaration for `js2flowchart`, which ships no type definitions —
// an untyped-library boundary per DEV.md § 2.5; only the export the annotate
// lens consumes is declared. It lives here (not beside its consumer) because
// the consumer sits in `study-lenses--deprecated-architecture/`, a tree
// tsconfig `exclude`s — excluded declarations never join the type program,
// while tsc still follows imports into that tree and needs this module typed.
// Copied from the declaration beside `lenses/annotate/render-flowchart.ts`.
declare module 'js2flowchart' {
	/**
	 * Synchronously converts JavaScript source to an SVG flowchart string.
	 * Throws a `SyntaxError` when the source fails to parse.
	 */
	export function convertCodeToSvg(code: string): string;
}
