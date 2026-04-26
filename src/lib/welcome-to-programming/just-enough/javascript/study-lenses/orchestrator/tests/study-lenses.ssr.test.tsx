/**
 * @file SSR-fallback contract for `<StudyLenses>`. During server-render
 * (or any environment where Docusaurus's `BrowserOnly` chooses its
 * fallback path), the component must render `<pre>{code}</pre>` and
 * never invoke any orchestrator wiring. Lives in its own file so the
 * fallback-only override of `@docusaurus/BrowserOnly` does not leak
 * into the main suite (which relies on the global stub that always
 * renders children).
 *
 * @vitest-environment jsdom
 */

import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import StudyLenses from '../study-lenses.js';

vi.mock('@docusaurus/BrowserOnly', function mockBrowserOnlyToFallback() {
	return {
		default: function BrowserOnlyFallbackOnly({
			fallback,
		}: {
			readonly fallback?: React.ReactNode;
		}): React.ReactNode {
			return fallback ?? null;
		},
	};
});

describe('<StudyLenses> SSR fallback', () => {
	it('renders `<pre>{code}</pre>` and skips the orchestrator host', () => {
		const { container } = render(
			<StudyLenses code="ssr only;" lens="editor" lang="js" />,
		);
		const host = container.querySelector('[data-orchestrator="study-lenses"]');
		expect(host).toBeNull();
		const pre = container.querySelector('pre');
		expect(pre?.textContent).toBe('ssr only;');
	});
});
