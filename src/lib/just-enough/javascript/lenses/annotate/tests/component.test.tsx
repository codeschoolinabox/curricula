/**
 * @vitest-environment jsdom
 *
 * @file React-wrapper tests for the `annotate` lens. Confirms the
 * `LensModule` shape and the wrapper's rendered structure
 * (`data-lens="annotate"`, `data-view-mode`) per `../README.md`
 * § UI structure and `../DOCS.md` § Phase 3 Render.
 */

import { cleanup, render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import type { Snippet } from '../../../embody/types.js';
import annotateLens from '../index.js';


afterEach(cleanup);

function makeSnippet(): Snippet {
	return embody('let x = 1;');
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

	it('tags the <g> node-group so a shape resolves via closest (7c delegation)', async () => {
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

	it('renders an inline error state for an unparseable snippet', async () => {
		const { container } = render(
			<annotateLens.Component
				embodiment={embody('const x = (((')}
				config={{ defaultView: 'flowchart' }}
			/>,
		);
		await waitFor(() => {
			expect(
				container.querySelector('[data-flowchart-status="error"]'),
			).not.toBeNull();
		});
	});
});
