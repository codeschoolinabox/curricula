/**
 * Ambient type declaration for `js2flowchart`, which ships no type
 * definitions. Declares only the export the `annotate` lens consumes
 * (`convertCodeToSvg`); see `./render-flowchart.ts`. This is an
 * untyped-library boundary per DEV.md § 2.5 — the signature is asserted
 * here rather than inlined as a cast at the call site.
 */
declare module 'js2flowchart' {
	/**
	 * Synchronously converts JavaScript source to an SVG flowchart string.
	 * Throws a `SyntaxError` when the source fails to parse.
	 */
	export function convertCodeToSvg(code: string): string;
}
