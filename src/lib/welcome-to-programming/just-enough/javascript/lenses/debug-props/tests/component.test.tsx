/**
 * @vitest-environment jsdom
 *
 * @file React-wrapper tests for the `debug-props` meta-lens. Confirms
 * the wrapper renders one `<section data-debug-panel="<key>">` per
 * panel produced by the core, under a `<div data-lens="debug-props">`
 * root.
 */

import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { render, cleanup } from '@testing-library/react';

import debugPropsLens from '../index.js';

import type { Snippet } from '../../../embody/types.js';

afterEach(cleanup);

function makeSnippet(): Snippet {
	return {
		source: { code: 'let x = 1;', offsets: [0] },
		status: { tokenized: true, parsed: true, created: true },
		parse: {},
		validation: {
			isJeJ: true,
			isDeterministic: true,
			doesPause: false,
			formatted: true,
			violations: [],
		},
		errors: null,
		streams: { realm: undefined as never },
	} as Snippet;
}

describe('debug-props lens — LensModule shape', () => {
	it('default export carries the four required LensModule fields with name="debug-props"', () => {
		expect(debugPropsLens.name).toBe('debug-props');
		expect(typeof debugPropsLens.Component).toBe('function');
		expect(typeof debugPropsLens.config).toBe('function');
		expect(typeof debugPropsLens.applicableTo).toBe('function');
		expect(typeof debugPropsLens.recommend).toBe('function');
	});

	it('applicableTo always returns true (Tier-1)', () => {
		expect(debugPropsLens.applicableTo(makeSnippet())).toBe(true);
	});

	it('recommend always returns an empty array (recommender-inert)', () => {
		expect(debugPropsLens.recommend(makeSnippet())).toEqual([]);
	});

	it('config() returns a frozen empty object by default', () => {
		const cfg = debugPropsLens.config();
		expect(cfg).toEqual({});
		expect(Object.isFrozen(cfg)).toBe(true);
	});

	it('config(overrides) merges and freezes the result', () => {
		const cfg = debugPropsLens.config({ foo: 'bar' });
		expect(cfg).toEqual({ foo: 'bar' });
		expect(Object.isFrozen(cfg)).toBe(true);
	});
});

describe('debug-props lens — Component rendering', () => {
	it('renders a root `<div data-lens="debug-props">`', () => {
		const { container } = render(
			<debugPropsLens.Component embodiment={makeSnippet()} />,
		);
		expect(container.querySelector('[data-lens="debug-props"]')).not.toBeNull();
	});

	it('renders one section per panel with the correct `data-debug-panel` keys', () => {
		const { container } = render(
			<debugPropsLens.Component embodiment={makeSnippet()} />,
		);
		const keys = Array.from(
			container.querySelectorAll('[data-debug-panel]'),
		).map((el) => el.getAttribute('data-debug-panel'));
		expect(keys).toEqual(['snippet', 'status', 'validation', 'config']);
	});

	it('renders the snippet source code inside the snippet panel', () => {
		const { container } = render(
			<debugPropsLens.Component embodiment={makeSnippet()} />,
		);
		const panel = container.querySelector('[data-debug-panel="snippet"] pre');
		expect(panel?.textContent).toBe('let x = 1;');
	});

	it('renders config "(empty)" when no config prop is passed', () => {
		const { container } = render(
			<debugPropsLens.Component embodiment={makeSnippet()} />,
		);
		const panel = container.querySelector('[data-debug-panel="config"] pre');
		expect(panel?.textContent).toBe('(empty)');
	});

	it('renders config "(empty)" when config prop is an explicit empty object `{}`', () => {
		const { container } = render(
			<debugPropsLens.Component embodiment={makeSnippet()} config={{}} />,
		);
		const panel = container.querySelector('[data-debug-panel="config"] pre');
		expect(panel?.textContent).toBe('(empty)');
	});

	it('renders config JSON-stringified when a config prop is passed', () => {
		const { container } = render(
			<debugPropsLens.Component
				embodiment={makeSnippet()}
				config={{ stepDelay: 500 }}
			/>,
		);
		const panel = container.querySelector('[data-debug-panel="config"] pre');
		expect(JSON.parse(panel!.textContent ?? 'null')).toEqual({
			stepDelay: 500,
		});
	});
});
