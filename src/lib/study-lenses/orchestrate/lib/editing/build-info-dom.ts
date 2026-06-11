/**
 * Builds a styled DOM `info` tooltip for a completion item.
 *
 * @remarks Used for the `info` callback CodeMirror invokes when a
 * completion item is focused in the popup. The input is the
 * caller-supplied `CompletionItem.info` string — markdown-flavored
 * single-paragraph prose written by JEJ-aware adapters
 * (`lib/completing/`) in the violation-message voice. The renderer
 * is intentionally minimal: no markdown parsing, no escapes, just
 * `textContent` inside a styled container. The same One Dark palette
 * as `build-tooltip-dom.ts` keeps the visual surface consistent.
 *
 * @module build-info-dom
 */

/**
 * Build a styled DOM info element from a prose string.
 *
 * @param prose - Single-paragraph learner-facing explanation.
 * @returns Styled HTMLElement for the autocompletion info slot.
 */
export default function buildInfoDom(prose: string): HTMLElement {
	const container = document.createElement('div');
	container.style.cssText =
		'background: #2d2d30; color: #d4d4d4; padding: 10px 12px; ' +
		'border-radius: 6px; border: 1px solid #464647; font-size: 12px; ' +
		'max-width: 360px; line-height: 1.5; font-family: -apple-system, ' +
		'BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';
	container.textContent = prose;
	// perf: skip freeze — DOM element, inherently mutable
	return container;
}
