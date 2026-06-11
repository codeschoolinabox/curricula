/**
 * @file Pure-TS flowchart-view derivation for the `annotate` lens. Maps
 * a source string to a `FlowchartSvg` discriminated union via
 * `js2flowchart`'s `convertCodeToSvg`. Returns a `Promise` so the React
 * wrapper's loading-state machine can await it; `convertCodeToSvg` is
 * synchronous, so the result is wrapped in a resolved Promise rather
 * than produced by an `async` function. The core imports no React;
 * tests run in vitest without jsdom.
 *
 * @remarks `convertCodeToSvg` throws a `SyntaxError` when the source
 * fails to parse; this module catches it and resolves to the `error`
 * variant rather than rejecting, so the wrapper renders an inline error
 * state instead of handling a rejected Promise.
 *
 * @remarks SECURITY: `convertCodeToSvg` is called with NO second
 * (print-config) argument. Its default render path escapes source-derived
 * text (node labels, titles) via `xml-escape`, so the SVG the wrapper
 * injects with `dangerouslySetInnerHTML` carries no learner-controlled
 * markup. Do NOT pass `{ debug: true }` — js2flowchart's debug render
 * path interpolates a source-derived node id into an SVG `<text>` WITHOUT
 * escaping, which would open an injection surface.
 */

import { convertCodeToSvg } from 'js2flowchart';

import freezeInPlace from '@utils/freeze-in-place.js';

import type { FlowchartSvg } from './types.js';

/**
 * Derives the flowchart-view's render outcome for a snippet.
 *
 * Resolves to `{ status: 'ready', svg }` when `js2flowchart` parses and
 * renders the source, or `{ status: 'error', message }` when the source
 * fails to parse. The `'loading'` variant of `FlowchartSvg` is the
 * wrapper's transient pre-resolution state and is never returned here.
 *
 * @param source - The snippet source code (`embodiment.source.code`).
 * @returns A Promise of a deep-frozen `FlowchartSvg` (`ready` | `error`).
 */
export default function deriveFlowchartSvg(
	source: string,
): Promise<FlowchartSvg> {
	try {
		const svg = convertCodeToSvg(source);
		return Promise.resolve(
			freezeInPlace<FlowchartSvg>({ status: 'ready', svg }),
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return Promise.resolve(
			freezeInPlace<FlowchartSvg>({ status: 'error', message }),
		);
	}
}
