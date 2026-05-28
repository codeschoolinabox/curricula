/**
 * @vitest-environment jsdom
 *
 * @file React-wrapper tests for the `annotate` lens. Confirms the
 * `LensModule` shape and the wrapper's rendered structure
 * (`data-lens="annotate"`, `data-view-mode`) per `../README.md`
 * § UI structure and `../DOCS.md` § Phase 3 Render.
 */

import { cleanup, render } from '@testing-library/react';
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
