/**
 * Builds a styled DOM tooltip from a {@link DocEntry}.
 *
 * @remarks Uses One Dark color scheme to match the editor theme.
 * Pure DOM construction — no CodeMirror imports.
 *
 * @module build-tooltip-dom
 */

import type { DocEntry } from './types.js';

/**
 * Build a styled DOM tooltip from a DocEntry.
 *
 * @remarks Includes runtime guards for malformed data since
 * `docLookup` callbacks are user-provided and may return
 * unexpected shapes at runtime despite the type contract.
 *
 * @param word - The hovered word
 * @param doc - DocEntry from docLookup callback
 * @returns Styled HTMLElement for the tooltip
 */
function buildTooltipDom(word: string, doc: DocEntry): HTMLElement {
	const container = document.createElement('div');
	container.style.cssText =
		'background: #2d2d30; color: #d4d4d4; padding: 12px; border-radius: 6px; ' +
		'border: 1px solid #464647; font-size: 12px; max-width: 350px; ' +
		'line-height: 1.4; font-family: -apple-system, BlinkMacSystemFont, ' +
		'"Segoe UI", Roboto, sans-serif;';

	// runtime guard — docLookup callbacks are user-provided and may return malformed data
	if (!doc || typeof doc !== 'object' || !doc.description) {
		container.textContent = `${word}: ${typeof doc === 'string' ? doc : ''}`;
		return container;
	}

	const content = document.createElement('div');

	// 1. Header with term and JEJ-boundary badge (derived from isJEJ)
	const header = document.createElement('div');
	header.style.cssText =
		'border-bottom: 1px solid #464647; padding-bottom: 6px; margin-bottom: 8px;';

	const title = document.createElement('div');
	title.style.cssText = 'font-weight: bold; color: #9cdcfe; font-size: 13px;';
	title.textContent = word;

	if (doc.isJEJ === false) {
		const badge = document.createElement('span');
		badge.style.cssText =
			'background: #3c3c3c; color: #d4d4d4; padding: 2px 6px; ' +
			'border-radius: 3px; font-size: 10px; margin-left: 8px;';
		badge.textContent = 'not in JEJ';
		title.appendChild(badge);
	}

	header.appendChild(title);
	content.appendChild(header);

	// 2. Description
	const desc = document.createElement('div');
	desc.style.cssText = 'margin-bottom: 8px; color: #d4d4d4;';
	desc.textContent = doc.description;
	content.appendChild(desc);

	// 3. Example code
	if (doc.example) {
		const exLabel = document.createElement('div');
		exLabel.style.cssText =
			'font-weight: bold; color: #9cdcfe; font-size: 11px; margin-bottom: 4px;';
		exLabel.textContent = 'Example:';
		content.appendChild(exLabel);

		const exCode = document.createElement('pre');
		exCode.style.cssText =
			'background: #1e1e1e; padding: 6px; border-radius: 3px; ' +
			'margin: 0 0 8px 0; font-size: 11px; color: #ce9178; ' +
			'overflow-x: auto; font-family: "Fira Code", "Consolas", monospace;';
		exCode.textContent = doc.example;
		content.appendChild(exCode);
	}

	// 4. Common mistakes
	if (doc.commonMistakes && doc.commonMistakes.length > 0) {
		const mistakesLabel = document.createElement('div');
		mistakesLabel.style.cssText =
			'font-weight: bold; color: #f48771; font-size: 11px; margin-bottom: 4px;';
		mistakesLabel.textContent = 'Common Mistakes:';
		content.appendChild(mistakesLabel);

		doc.commonMistakes.forEach(function addMistake(mistake) {
			const item = document.createElement('div');
			item.style.cssText =
				'color: #f48771; font-size: 11px; margin-bottom: 2px; padding-left: 8px;';
			item.textContent = '\u2022 ' + mistake;
			content.appendChild(item);
		});
	}

	// 5. When to use
	if (doc.whenToUse) {
		const whenLabel = document.createElement('div');
		whenLabel.style.cssText =
			'font-weight: bold; color: #4ec9b0; font-size: 11px; margin: 6px 0 2px 0;';
		whenLabel.textContent = 'When to use:';
		content.appendChild(whenLabel);

		const when = document.createElement('div');
		when.style.cssText = 'color: #4ec9b0; font-size: 11px;';
		when.textContent = doc.whenToUse;
		content.appendChild(when);
	}

	// 6. Why not in JEJ (only present on isJEJ: false entries)
	if (doc.whyNotInJej) {
		const whyLabel = document.createElement('div');
		whyLabel.style.cssText =
			'font-weight: bold; color: #c586c0; font-size: 11px; margin: 6px 0 2px 0;';
		whyLabel.textContent = 'Why not in JEJ:';
		content.appendChild(whyLabel);

		const why = document.createElement('div');
		why.style.cssText = 'color: #c586c0; font-size: 11px;';
		why.textContent = doc.whyNotInJej;
		content.appendChild(why);
	}

	container.appendChild(content);
	// perf: skip freeze — DOM element, inherently mutable
	return container;
}

export default buildTooltipDom;
