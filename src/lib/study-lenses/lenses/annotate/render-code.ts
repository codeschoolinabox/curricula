/**
 * @file Pure-TS code-view derivation for the `annotate` lens. Maps a
 * source string + colorize flag to a `CodeSpanTree` — the per-line
 * token-span breakdown the React wrapper renders inside `<pre><code>`.
 *
 * Consumes `prism-react-renderer`'s non-React tokenizer (`Prism` +
 * `normalizeTokens`) and re-projects each token to the plain
 * serializable `CodeSpan` shape at this boundary, so the core imports
 * no React itself (per the lenses peer's two-layer module convention).
 * Tests run in vitest without jsdom.
 *
 * @remarks Span-text contract: within a single line, concatenating the
 * spans' `text` reconstructs that line's source (no trailing newline —
 * `normalizeTokens` consumes the `\n` into the line split). The React
 * wrapper supplies the visual line break between lines. The colorize-off
 * path splits on `\n` directly and is an exact per-line roundtrip; the
 * colorize-on path carries Prism's tokenizer output verbatim, including
 * Prism quirk tokens (empty-source plain `'\n'`; trailing-newline ghost
 * line) that do not roundtrip cleanly.
 */

import { Prism, normalizeTokens } from 'prism-react-renderer';

import freezeInPlace from '@utils/freeze-in-place.js';

import type { CodeSpanTree } from './types.js';

/**
 * Derives the per-line colorized span tree for the code view.
 *
 * When `colorize` is `false`, each source line becomes a single span
 * with an empty `className` (plain monospaced text). When `true`, the
 * source is tokenized with Prism's JavaScript grammar and each token
 * becomes a span whose `className` carries the Prism token classes
 * (`token <type…>`) that a Prism theme stylesheet targets.
 *
 * @param source - The snippet source code (`embodiment.source.code`).
 * @param colorize - Whether to apply Prism tokenization.
 * @returns A deep-frozen `CodeSpanTree` (per-line span arrays).
 */
export default function deriveCodeSpanTree(
	source: string,
	colorize: boolean,
): CodeSpanTree {
	// Plain path: one span per source line, no Prism classes. Exact
	// per-line roundtrip — the wrapper supplies the visual line break.
	if (!colorize) {
		const lines = source
			.split('\n')
			.map((line) => [{ className: '', text: line }]);
		return freezeInPlace<CodeSpanTree>({ lines });
	}

	// Colorized path: Prism tokenizes into per-line token arrays;
	// re-project each token to the plain `CodeSpan` shape. className
	// mirrors prism-react-renderer's `getTokenProps` (`token <type…>`).
	const tokenLines = normalizeTokens(
		Prism.tokenize(source, Prism.languages.javascript),
	);
	const lines = tokenLines.map((tokens) =>
		tokens.map((token) => ({
			className: ['token', ...token.types].join(' '),
			text: token.content,
		})),
	);
	return freezeInPlace<CodeSpanTree>({ lines });
}
