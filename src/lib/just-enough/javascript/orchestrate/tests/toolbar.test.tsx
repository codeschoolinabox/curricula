// @vitest-environment jsdom

import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import Toolbar from '../toolbar.js';

describe('<Toolbar>', () => {
	describe('Zero — empty shell', () => {
		it('renders an element matching [data-orchestrator-toolbar]', () => {
			const { container } = render(<Toolbar />);
			expect(
				container.querySelector('[data-orchestrator-toolbar]'),
			).not.toBeNull();
		});

		it('the toolbar element is a <nav>', () => {
			const { container } = render(<Toolbar />);
			const toolbar = container.querySelector('[data-orchestrator-toolbar]');
			expect(toolbar?.tagName).toBe('NAV');
		});
	});
});
