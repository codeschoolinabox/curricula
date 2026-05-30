/**
 * @vitest-environment jsdom
 *
 * @file React-wrapper tests for the `annotate` lens. Confirms the
 * `LensModule` shape and the wrapper's rendered structure
 * (`data-lens="annotate"`, `data-view-mode`) per `../README.md`
 * § UI structure and `../DOCS.md` § Phase 3 Render.
 */

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import embody from '../../../embody/index.js';
import type { Snippet } from '../../../embody/types.js';
import annotateLens from '../index.js';


afterEach(cleanup);
afterEach(() => vi.restoreAllMocks());

function makeSnippet(): Snippet {
	return embody('let x = 1;');
}

function drawStroke(overlay: Element, points: Array<[number, number]>): void {
	const [first, ...rest] = points;
	fireEvent.mouseDown(overlay, { clientX: first[0], clientY: first[1] });
	for (const [x, y] of rest) {
		fireEvent.mouseMove(overlay, { clientX: x, clientY: y });
	}
	const last = points.at(-1) ?? first;
	fireEvent.mouseUp(overlay, { clientX: last[0], clientY: last[1] });
}

function getOverlay(container: HTMLElement): Element {
	return container.querySelector('svg.annotate-drawing-overlay') as Element;
}

function selectTool(container: HTMLElement, tool: string): void {
	fireEvent.click(
		container.querySelector(`[data-tool-select="${tool}"]`) as Element,
	);
}

describe('annotate lens — LensModule shape', () => {
	it('is named "annotate"', () => {
		expect(annotateLens.name).toBe('annotate');
	});

	it('is a frozen record', () => {
		expect(Object.isFrozen(annotateLens)).toBe(true);
	});

	it('Component is a function', () => {
		expect(typeof annotateLens.Component).toBe('function');
	});

	it('config() delegates to the core defaults', () => {
		expect(annotateLens.config().defaultView).toBe('code');
	});

	it('applicableTo() delegates to the core Tier-1 gate', () => {
		expect(annotateLens.applicableTo(makeSnippet())).toBe(true);
	});

	it('recommend() delegates to the core placeholder', () => {
		expect(annotateLens.recommend(makeSnippet())).toEqual([]);
	});
});

describe('annotate lens — Component rendering', () => {
	it('renders a root <div data-lens="annotate">', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		expect(container.querySelector('[data-lens="annotate"]')).not.toBeNull();
	});

	it('data-view-mode defaults to "code" when no config is passed', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		expect(
			container
				.querySelector<HTMLElement>('[data-lens="annotate"]')?.dataset
				.viewMode,
		).toBe('code');
	});

	it('data-view-mode reflects config.defaultView overridden to "flowchart"', () => {
		const { container } = render(
			<annotateLens.Component
				embodiment={makeSnippet()}
				config={{ defaultView: 'flowchart' }}
			/>,
		);
		expect(
			container
				.querySelector<HTMLElement>('[data-lens="annotate"]')?.dataset
				.viewMode,
		).toBe('flowchart');
	});

	it('data-view-mode falls back to "code" when config.defaultView is invalid', () => {
		const { container } = render(
			<annotateLens.Component
				embodiment={makeSnippet()}
				config={{ defaultView: 'bogus' }}
			/>,
		);
		expect(
			container
				.querySelector<HTMLElement>('[data-lens="annotate"]')?.dataset
				.viewMode,
		).toBe('code');
	});
});

describe('annotate lens — code view', () => {
	it('renders a <pre><code> for the code view', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		expect(container.querySelector('pre code')).not.toBeNull();
	});

	it('renders the snippet source as the code text', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		expect(container.querySelector('pre')?.textContent).toBe('let x = 1;');
	});

	it('joins multiple source lines with newlines in the code text', () => {
		const { container } = render(
			<annotateLens.Component embodiment={embody('let x = 1;\nlet y = 2;')} />,
		);
		expect(container.querySelector('pre')?.textContent).toBe(
			'let x = 1;\nlet y = 2;',
		);
	});

	it('colorize on (default) classes the "let" keyword as a Prism token', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		expect(container.querySelector('.token.keyword')).not.toBeNull();
	});

	it('colorize off renders plain spans with no Prism token classes', () => {
		const { container } = render(
			<annotateLens.Component
				embodiment={makeSnippet()}
				config={{ colorize: false }}
			/>,
		);
		expect(container.querySelector('.token')).toBeNull();
	});

	it('colorize off still renders a span (plain, empty className)', () => {
		const { container } = render(
			<annotateLens.Component
				embodiment={makeSnippet()}
				config={{ colorize: false }}
			/>,
		);
		expect(container.querySelector('pre code span')?.className).toBe('');
	});

	it('colorize off still renders the source text', () => {
		const { container } = render(
			<annotateLens.Component
				embodiment={makeSnippet()}
				config={{ colorize: false }}
			/>,
		);
		expect(container.querySelector('pre')?.textContent).toBe('let x = 1;');
	});
});

describe('annotate lens — flowchart view', () => {
	it('does not render the code view when the view is flowchart', () => {
		const { container } = render(
			<annotateLens.Component
				embodiment={makeSnippet()}
				config={{ defaultView: 'flowchart' }}
			/>,
		);
		expect(container.querySelector('pre code')).toBeNull();
	});

	it('renders the generated SVG for a parseable snippet', async () => {
		const { container } = render(
			<annotateLens.Component
				embodiment={embody('function f() { return 1; }')}
				config={{ defaultView: 'flowchart' }}
			/>,
		);
		await waitFor(() => {
			expect(container.querySelector('svg')).not.toBeNull();
		});
	});

	it('tags flowchart node groups with data-flowchart-node after inject', async () => {
		const { container } = render(
			<annotateLens.Component
				embodiment={embody('function f() { return 1; }')}
				config={{ defaultView: 'flowchart' }}
			/>,
		);
		await waitFor(() => {
			expect(
				container.querySelectorAll('[data-flowchart-node]').length,
			).toBeGreaterThan(0);
		});
	});

	it('tags the <g> node-group so a shape resolves via closest (forward-ready for deferred correlation)', async () => {
		const { container } = render(
			<annotateLens.Component
				embodiment={embody('function f() { return 1; }')}
				config={{ defaultView: 'flowchart' }}
			/>,
		);
		await waitFor(() => {
			const tagged = container
				.querySelector('rect')
				?.closest('[data-flowchart-node]');
			expect(tagged?.tagName.toLowerCase()).toBe('g');
		});
	});

	it('clamps to code-view for an unparseable snippet even when defaultView is flowchart', () => {
		const { container } = render(
			<annotateLens.Component
				embodiment={embody('const x = (((')}
				config={{ defaultView: 'flowchart' }}
			/>,
		);
		// AR-1 initial-view parse-gate: an unparseable snippet never mounts into
		// the (guaranteed-failing) flowchart-view, so no flowchart generation is
		// attempted and the code-view renders instead. The flowchart-failure
		// error branch is covered in component-flowchart-lifecycle.test.tsx.
		expect(container.querySelector('pre code')).not.toBeNull();
		expect(container.querySelector('[data-flowchart-status]')).toBeNull();
	});
});

describe('annotate lens — drawing overlay', () => {
	it('toolbar defaults to the pen tool', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		expect(
			container.querySelector<HTMLElement>('[data-tool]')?.dataset.tool,
		).toBe('pen');
	});

	it('renders six color swatch buttons', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		expect(container.querySelectorAll('[data-color-swatch]')).toHaveLength(6);
	});

	it('selecting the eraser tool sets data-tool to "eraser"', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		selectTool(container, 'eraser');
		expect(
			container.querySelector<HTMLElement>('[data-tool]')?.dataset.tool,
		).toBe('eraser');
	});

	it('renders a drawing overlay svg', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		expect(getOverlay(container)).not.toBeNull();
	});

	it('a pen stroke (down → move → up) commits a polyline', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		drawStroke(getOverlay(container), [
			[5, 5],
			[15, 25],
		]);
		expect(
			container.querySelector('svg.annotate-drawing-overlay polyline'),
		).not.toBeNull();
	});

	it('the committed polyline carries the bounding-rect coordinates', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		drawStroke(getOverlay(container), [
			[5, 5],
			[15, 25],
		]);
		expect(
			container
				.querySelector('svg.annotate-drawing-overlay polyline')
				?.getAttribute('points'),
		).toBe('5,5 15,25');
	});

	it('an in-progress stroke renders during the gesture (before mouseup)', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		const overlay = getOverlay(container);
		fireEvent.mouseDown(overlay, { clientX: 5, clientY: 5 });
		fireEvent.mouseMove(overlay, { clientX: 15, clientY: 25 });
		expect(
			container.querySelectorAll('svg.annotate-drawing-overlay polyline'),
		).toHaveLength(1);
	});

	it('a single-point tap (down → up, no move) commits no stroke', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		drawStroke(getOverlay(container), [[5, 5]]);
		expect(
			container.querySelector('svg.annotate-drawing-overlay polyline'),
		).toBeNull();
	});

	it('a committed stroke uses the active color', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		const swatchColor =
			container.querySelector<HTMLElement>('[data-color-swatch]')?.dataset
				.colorSwatch;
		drawStroke(getOverlay(container), [
			[1, 1],
			[2, 2],
		]);
		expect(
			container
				.querySelector('svg.annotate-drawing-overlay polyline')
				?.getAttribute('stroke'),
		).toBe(swatchColor);
	});

	it('a selected color swatch is used for the next stroke', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		const swatches =
			container.querySelectorAll<HTMLElement>('[data-color-swatch]');
		const secondColor = swatches[1].dataset.colorSwatch;
		fireEvent.click(swatches[1]);
		drawStroke(getOverlay(container), [
			[1, 1],
			[2, 2],
		]);
		expect(
			container
				.querySelector('svg.annotate-drawing-overlay polyline')
				?.getAttribute('stroke'),
		).toBe(secondColor);
	});

	it('the eraser removes a saved stroke clicked within the radius', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		const overlay = getOverlay(container);
		drawStroke(overlay, [
			[10, 10],
			[11, 11],
		]);
		selectTool(container, 'eraser');
		fireEvent.click(overlay, { clientX: 12, clientY: 12 });
		expect(
			container.querySelector('svg.annotate-drawing-overlay polyline'),
		).toBeNull();
	});

	it('the eraser leaves a stroke outside the radius untouched', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		const overlay = getOverlay(container);
		drawStroke(overlay, [
			[10, 10],
			[11, 11],
		]);
		selectTool(container, 'eraser');
		fireEvent.click(overlay, { clientX: 200, clientY: 200 });
		expect(
			container.querySelector('svg.annotate-drawing-overlay polyline'),
		).not.toBeNull();
	});

	it('the eraser removes every stroke within the radius', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		const overlay = getOverlay(container);
		drawStroke(overlay, [
			[10, 10],
			[11, 11],
		]);
		drawStroke(overlay, [
			[13, 13],
			[14, 14],
		]);
		selectTool(container, 'eraser');
		fireEvent.click(overlay, { clientX: 12, clientY: 12 });
		expect(
			container.querySelectorAll('svg.annotate-drawing-overlay polyline'),
		).toHaveLength(0);
	});

	it('the eraser removes only the strokes within the radius', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		const overlay = getOverlay(container);
		drawStroke(overlay, [
			[10, 10],
			[11, 11],
		]);
		drawStroke(overlay, [
			[100, 100],
			[101, 101],
		]);
		selectTool(container, 'eraser');
		fireEvent.click(overlay, { clientX: 12, clientY: 12 });
		expect(
			container.querySelectorAll('svg.annotate-drawing-overlay polyline'),
		).toHaveLength(1);
	});

});

describe('annotate lens — clear all', () => {
	it('renders a clear-all button', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		expect(container.querySelector('[data-clear-all]')).not.toBeNull();
	});

	it('prompts for confirmation when clear-all is clicked', () => {
		const confirmSpy = vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		fireEvent.click(container.querySelector('[data-clear-all]') as Element);
		expect(confirmSpy).toHaveBeenCalledOnce();
	});

	it('clears the active view strokes when the action is confirmed', () => {
		vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		drawStroke(getOverlay(container), [
			[10, 10],
			[11, 11],
		]);
		fireEvent.click(container.querySelector('[data-clear-all]') as Element);
		expect(
			container.querySelector('svg.annotate-drawing-overlay polyline'),
		).toBeNull();
	});

	it('clears every stroke (not just the first) when confirmed', () => {
		vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		const overlay = getOverlay(container);
		drawStroke(overlay, [
			[10, 10],
			[11, 11],
		]);
		drawStroke(overlay, [
			[20, 20],
			[21, 21],
		]);
		fireEvent.click(container.querySelector('[data-clear-all]') as Element);
		expect(
			container.querySelectorAll('svg.annotate-drawing-overlay polyline'),
		).toHaveLength(0);
	});

	it('keeps the strokes when the action is not confirmed', () => {
		vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		drawStroke(getOverlay(container), [
			[10, 10],
			[11, 11],
		]);
		fireEvent.click(container.querySelector('[data-clear-all]') as Element);
		expect(
			container.querySelector('svg.annotate-drawing-overlay polyline'),
		).not.toBeNull();
	});

});

describe('annotate lens — notes', () => {
	it('the toolbar offers a note tool', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		expect(container.querySelector('[data-tool-select="note"]')).not.toBeNull();
	});

	it('selecting the note tool sets data-tool to "note"', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		selectTool(container, 'note');
		expect(
			container.querySelector<HTMLElement>('[data-tool]')?.dataset.tool,
		).toBe('note');
	});

	it('clicking with the note tool opens a dialog with a textarea', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		selectTool(container, 'note');
		fireEvent.click(getOverlay(container), { clientX: 30, clientY: 40 });
		expect(container.querySelector('[data-note-dialog] textarea')).not.toBeNull();
	});

	it('saving a note commits it with the typed text', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		selectTool(container, 'note');
		fireEvent.click(getOverlay(container), { clientX: 30, clientY: 40 });
		fireEvent.change(
			container.querySelector('[data-note-dialog] textarea') as Element,
			{ target: { value: 'hello' } },
		);
		fireEvent.click(container.querySelector('[data-note-save]') as Element);
		expect(container.querySelector('.annotate-note')?.textContent).toBe('hello');
	});

	it('saving dismisses the dialog', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		selectTool(container, 'note');
		fireEvent.click(getOverlay(container), { clientX: 30, clientY: 40 });
		fireEvent.change(
			container.querySelector('[data-note-dialog] textarea') as Element,
			{ target: { value: 'hello' } },
		);
		fireEvent.click(container.querySelector('[data-note-save]') as Element);
		expect(container.querySelector('[data-note-dialog]')).toBeNull();
	});

	it('cancelling dismisses the dialog without committing a note', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		selectTool(container, 'note');
		fireEvent.click(getOverlay(container), { clientX: 30, clientY: 40 });
		fireEvent.change(
			container.querySelector('[data-note-dialog] textarea') as Element,
			{ target: { value: 'hi' } },
		);
		fireEvent.click(container.querySelector('[data-note-cancel]') as Element);
		expect(container.querySelector('[data-note-dialog]')).toBeNull();
	});

	it('cancelling leaves no saved note', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		selectTool(container, 'note');
		fireEvent.click(getOverlay(container), { clientX: 30, clientY: 40 });
		fireEvent.click(container.querySelector('[data-note-cancel]') as Element);
		expect(container.querySelector('.annotate-note')).toBeNull();
	});

	it('a committed note carries the active color', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		const swatches =
			container.querySelectorAll<HTMLElement>('[data-color-swatch]');
		const secondColor = swatches[1].dataset.colorSwatch;
		fireEvent.click(swatches[1]);
		selectTool(container, 'note');
		fireEvent.click(getOverlay(container), { clientX: 30, clientY: 40 });
		fireEvent.change(
			container.querySelector('[data-note-dialog] textarea') as Element,
			{ target: { value: 'hi' } },
		);
		fireEvent.click(container.querySelector('[data-note-save]') as Element);
		expect(
			container.querySelector<HTMLElement>('.annotate-note')?.dataset.noteColor,
		).toBe(secondColor);
	});

	it('a committed note is positioned at the click point', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		selectTool(container, 'note');
		fireEvent.click(getOverlay(container), { clientX: 30, clientY: 40 });
		fireEvent.change(
			container.querySelector('[data-note-dialog] textarea') as Element,
			{ target: { value: 'hi' } },
		);
		fireEvent.click(container.querySelector('[data-note-save]') as Element);
		expect(container.querySelector<HTMLElement>('.annotate-note')?.style.left).toBe(
			'30px',
		);
	});

	it('commits multiple notes independently', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		selectTool(container, 'note');
		fireEvent.click(getOverlay(container), { clientX: 30, clientY: 40 });
		fireEvent.change(
			container.querySelector('[data-note-dialog] textarea') as Element,
			{ target: { value: 'first' } },
		);
		fireEvent.click(container.querySelector('[data-note-save]') as Element);
		fireEvent.click(getOverlay(container), { clientX: 60, clientY: 80 });
		fireEvent.change(
			container.querySelector('[data-note-dialog] textarea') as Element,
			{ target: { value: 'second' } },
		);
		fireEvent.click(container.querySelector('[data-note-save]') as Element);
		expect(container.querySelectorAll('.annotate-note')).toHaveLength(2);
	});

	it('discards a save with empty text', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		selectTool(container, 'note');
		fireEvent.click(getOverlay(container), { clientX: 30, clientY: 40 });
		fireEvent.click(container.querySelector('[data-note-save]') as Element);
		expect(container.querySelector('.annotate-note')).toBeNull();
	});

	it('reopening the dialog starts with an empty textarea', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		selectTool(container, 'note');
		fireEvent.click(getOverlay(container), { clientX: 30, clientY: 40 });
		fireEvent.change(
			container.querySelector('[data-note-dialog] textarea') as Element,
			{ target: { value: 'stale' } },
		);
		fireEvent.click(container.querySelector('[data-note-cancel]') as Element);
		fireEvent.click(getOverlay(container), { clientX: 60, clientY: 80 });
		expect(
			container.querySelector<HTMLTextAreaElement>('[data-note-dialog] textarea')
				?.value,
		).toBe('');
	});

	it('clicking inside the dialog does not reset the typed text', () => {
		const { container } = render(
			<annotateLens.Component embodiment={makeSnippet()} />,
		);
		selectTool(container, 'note');
		fireEvent.click(getOverlay(container), { clientX: 30, clientY: 40 });
		const textarea = container.querySelector(
			'[data-note-dialog] textarea',
		) as Element;
		fireEvent.change(textarea, { target: { value: 'keep me' } });
		fireEvent.click(textarea);
		expect((textarea as HTMLTextAreaElement).value).toBe('keep me');
	});
});
