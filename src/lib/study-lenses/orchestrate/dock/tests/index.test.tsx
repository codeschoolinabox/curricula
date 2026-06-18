// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Dock from '../index.js';

afterEach(cleanup);

describe('Dock', () => {
	describe('Zero — the dock shell', () => {
		it('renders the dock root', () => {
			const { container } = render(
				<Dock collapsed={false} onCollapseToggle={() => {}} />,
			);
			expect(container.querySelector('[data-orchestrator-dock]')).not.toBeNull();
		});
	});

	describe('Boundary — the collapsed display state', () => {
		it('reflects collapsed=false on the dock root', () => {
			const { container } = render(
				<Dock collapsed={false} onCollapseToggle={() => {}} />,
			);
			expect(
				container.querySelector<HTMLElement>('[data-orchestrator-dock]')
					?.dataset.orchestratorDockCollapsed,
			).toBe('false');
		});

		it('reflects collapsed=true on the dock root', () => {
			const { container } = render(
				<Dock collapsed={true} onCollapseToggle={() => {}} />,
			);
			expect(
				container.querySelector<HTMLElement>('[data-orchestrator-dock]')
					?.dataset.orchestratorDockCollapsed,
			).toBe('true');
		});
	});

	describe('Interface — the collapse affordance', () => {
		it('clicking the collapse affordance calls onCollapseToggle once', () => {
			const onCollapseToggle = vi.fn();
			const { container } = render(
				<Dock collapsed={false} onCollapseToggle={onCollapseToggle} />,
			);
			fireEvent.click(
				container.querySelector('[aria-label="toggle dock controls"]')!,
			);
			expect(onCollapseToggle).toHaveBeenCalledOnce();
		});
	});
});
