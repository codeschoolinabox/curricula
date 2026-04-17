// @vitest-environment jsdom
/**
 * @file Unit tests for `<StudyLens>` — the default-exported component
 * routed by the swizzled `MDXComponents`. Commit 1 scope: the lens/lang
 * guard and the shell's rendered output.
 *
 * In jsdom, `BrowserOnly`'s ExecutionEnvironment.canUseDOM returns true,
 * so `<BrowserOnly>` renders its children (the `StudyLensClient`
 * placeholder) rather than the fallback. That's the "client branch" we
 * assert against — the fallback path is covered by Docusaurus's own SSG
 * output and by the commit-6 sandbox checkpoint.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';

// `@docusaurus/BrowserOnly`, `@theme/CodeBlock`, and `@site/*` are
// aliased in `vitest.workspace.ts` — stubs for the first two, site-root
// for the third — so the component's imports resolve in jsdom.

// Mock the client with a minimal placeholder; the shell tests don't
// care about the client's internals (editor mount logic is covered
// by study-lens-client.test.tsx). Keep the code visible in the DOM
// so the shell tests can assert on it.
vi.mock('../study-lens-client', () => ({
	default: ({ code }: { code: string }) =>
		React.createElement('div', { 'data-test': 'client-mock' }, code),
}));

import StudyLens, { narrowToStudyOptions } from '../study-lens';

describe('StudyLens', () => {
	describe('supported lens/lang: renders client shell', () => {
		it('minimum props: visible output contains the code', () => {
			const { container } = render(
				<StudyLens code="let x = 1;" lens="study" lang="js" />,
			);
			expect(container.textContent).toContain('let x = 1;');
			cleanup();
		});

		it('different code prop → different visible content (triangulation)', () => {
			const first = render(
				<StudyLens code="const a = 'one';" lens="study" lang="js" />,
			);
			expect(first.container.textContent).toContain("const a = 'one';");
			cleanup();

			const second = render(
				<StudyLens code="const b = 'two';" lens="study" lang="js" />,
			);
			expect(second.container.textContent).toContain("const b = 'two';");
			expect(second.container.textContent).not.toContain("const a = 'one';");
			cleanup();
		});
	});

	describe('unsupported combinations: falls through to mock', () => {
		it('lens !== study → StudyLensMock rendered (identified by data-study-lens attr)', () => {
			const { container } = render(
				<StudyLens code="x" lens="highlight" lang="js" />,
			);
			// The mock wraps its content in a <div data-study-lens={lens}>;
			// the V2 client's wrapper uses data-study-lens="study". The
			// attribute value distinguishes which path rendered.
			const wrapper = container.querySelector('[data-study-lens]');
			expect(wrapper?.getAttribute('data-study-lens')).toBe('highlight');
			cleanup();
		});

		it('lang !== js → StudyLensMock rendered', () => {
			const { container } = render(
				<StudyLens code="print('hi')" lens="study" lang="python" />,
			);
			// Mock renders its own <ul><li>lang: python</li></ul> label;
			// the V2 placeholder-client doesn't.
			expect(container.textContent).toContain('lang: python');
			cleanup();
		});
	});

	describe('supported + valid config string (plumbing smoke test)', () => {
		it('renders without crashing when config is a valid JSON string', () => {
			const { container } = render(
				<StudyLens
					code="let x = 1;"
					lens="study"
					lang="js"
					config='{"buttons":["run"]}'
				/>,
			);
			// Commit 1's placeholder client doesn't yet expose the
			// narrowed options; this test just pins the parse+narrow+render
			// chain against crashes.
			expect(container.textContent).toContain('let x = 1;');
			cleanup();
		});
	});
});

describe('narrowToStudyOptions', () => {
	it('null → {} (defaults)', () => {
		expect(narrowToStudyOptions(null)).toEqual({});
	});

	it('string → {} (bare-string config is not study-lens-shaped)', () => {
		expect(narrowToStudyOptions('freeform')).toEqual({});
	});

	it('{ buttons: ["run"] } → { buttons: ["run"] }', () => {
		expect(narrowToStudyOptions({ buttons: ['run'] })).toEqual({
			buttons: ['run'],
		});
	});

	it('unknown button names filtered out silently', () => {
		expect(
			narrowToStudyOptions({ buttons: ['run', 'launch-missiles', 'format'] }),
		).toEqual({ buttons: ['run', 'format'] });
	});

	it('all-unknown buttons → field omitted (empty array collapses to undefined)', () => {
		expect(narrowToStudyOptions({ buttons: ['launch-missiles'] })).toEqual({});
	});

	it('buttons not an array → field omitted', () => {
		expect(narrowToStudyOptions({ buttons: 'run' })).toEqual({});
	});

	it('engine object passes through', () => {
		expect(narrowToStudyOptions({ engine: { seconds: 10 } })).toEqual({
			engine: { seconds: 10 },
		});
	});

	it('{buttons: []} (explicitly empty) → field omitted', () => {
		expect(narrowToStudyOptions({ buttons: [] })).toEqual({});
	});

	it('{engine: null} → field omitted (typeof null === "object" footgun)', () => {
		expect(narrowToStudyOptions({ engine: null })).toEqual({});
	});

	it('{engine: [5]} (array) → field omitted (plain-object guard)', () => {
		expect(narrowToStudyOptions({ engine: [5] })).toEqual({});
	});

	it('unknown top-level keys dropped, result is {}', () => {
		expect(narrowToStudyOptions({ extraneous: 'foo' })).toEqual({});
	});
});
