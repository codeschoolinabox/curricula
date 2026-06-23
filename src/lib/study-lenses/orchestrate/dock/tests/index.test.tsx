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
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
				/>,
			);
			expect(container.querySelector('[data-orchestrator-dock]')).not.toBeNull();
		});
	});

	describe('Boundary — the collapsed display state', () => {
		it('reflects collapsed=false on the dock root', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
				/>,
			);
			expect(
				container.querySelector<HTMLElement>('[data-orchestrator-dock]')?.dataset
					.orchestratorDockCollapsed,
			).toBe('false');
		});

		it('reflects collapsed=true on the dock root', () => {
			const { container } = render(
				<Dock
					collapsed={true}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
				/>,
			);
			expect(
				container.querySelector<HTMLElement>('[data-orchestrator-dock]')?.dataset
					.orchestratorDockCollapsed,
			).toBe('true');
		});
	});

	describe('Interface — the collapse affordance', () => {
		it('clicking the collapse affordance calls onCollapseToggle once', () => {
			const onCollapseToggle = vi.fn();
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={onCollapseToggle}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
				/>,
			);
			fireEvent.click(
				container.querySelector('[aria-label="toggle dock controls"]')!,
			);
			expect(onCollapseToggle).toHaveBeenCalledOnce();
		});
	});

	describe('Boundary — the type toggle value', () => {
		it('carries the module value when sourceType is module', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
				/>,
			);
			expect(
				container.querySelector<HTMLElement>(
					'[data-orchestrator-dock-type-toggle]',
				)?.dataset.orchestratorDockTypeToggle,
			).toBe('module');
		});

		it('carries the script value when sourceType is script', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="script"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
				/>,
			);
			expect(
				container.querySelector<HTMLElement>(
					'[data-orchestrator-dock-type-toggle]',
				)?.dataset.orchestratorDockTypeToggle,
			).toBe('script');
		});
	});

	describe('Interface — the type toggle affordance', () => {
		it('clicking the type toggle calls onTypeToggle once', () => {
			const onTypeToggle = vi.fn();
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={onTypeToggle}
				/>,
			);
			fireEvent.click(
				container.querySelector('[data-orchestrator-dock-type-toggle]')!,
			);
			expect(onTypeToggle).toHaveBeenCalledOnce();
		});
	});

	describe('Boundary — the script-mode hint', () => {
		it('renders the hint when scriptModeHintVisible is true', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="script"
					scriptModeHintVisible={true}
					onTypeToggle={() => {}}
				/>,
			);
			expect(
				container.querySelector('[data-orchestrator-dock-type-hint]'),
			).not.toBeNull();
		});

		it('omits the hint when scriptModeHintVisible is false', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="script"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
				/>,
			);
			expect(
				container.querySelector('[data-orchestrator-dock-type-hint]'),
			).toBeNull();
		});

		it('links the type toggle to the hint via aria-describedby when shown', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="script"
					scriptModeHintVisible={true}
					onTypeToggle={() => {}}
				/>,
			);
			const describedBy = container
				.querySelector('[data-orchestrator-dock-type-toggle]')
				?.getAttribute('aria-describedby');
			const hintId = container.querySelector(
				'[data-orchestrator-dock-type-hint]',
			)?.id;
			expect(describedBy).toBe(hintId);
		});

		it('the hint id is a non-empty string when shown', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="script"
					scriptModeHintVisible={true}
					onTypeToggle={() => {}}
				/>,
			);
			expect(
				container.querySelector('[data-orchestrator-dock-type-hint]')?.id.length,
			).toBeGreaterThan(0);
		});

		it('leaves the type toggle without aria-describedby when the hint is hidden', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="script"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
				/>,
			);
			expect(
				container
					.querySelector('[data-orchestrator-dock-type-toggle]')
					?.getAttribute('aria-describedby'),
			).toBeNull();
		});
	});

	describe('Interface — the collapse affordance discloses the controls strip', () => {
		it('points the collapse affordance aria-controls at the strip holding the controls', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
				/>,
			);
			const controlsId = container
				.querySelector('[aria-label="toggle dock controls"]')
				?.getAttribute('aria-controls');
			const stripId = container.querySelector(
				'[data-orchestrator-dock-type-toggle]',
			)?.parentElement?.id;
			expect(controlsId).toBe(stripId);
		});
	});
});
