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
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
				/>,
			);
			expect(
				container.querySelector('[data-orchestrator-dock]'),
			).not.toBeNull();
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
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
				/>,
			);
			expect(
				container.querySelector<HTMLElement>('[data-orchestrator-dock]')
					?.dataset.orchestratorDockCollapsed,
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
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
				/>,
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
				<Dock
					collapsed={false}
					onCollapseToggle={onCollapseToggle}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
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
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
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
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
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
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
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
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
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
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
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
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
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
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
				/>,
			);
			expect(
				container.querySelector('[data-orchestrator-dock-type-hint]')?.id
					.length,
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
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
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
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
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

	describe('Boundary — the sandbox toggle value', () => {
		it('carries the worker value when sandboxMode is worker', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
					sandboxMode="worker"
					dangerAvailable={true}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
				/>,
			);
			expect(
				container.querySelector<HTMLElement>(
					'[data-orchestrator-dock-sandbox-toggle]',
				)?.dataset.orchestratorDockSandboxToggle,
			).toBe('worker');
		});

		it('carries the danger value when sandboxMode is danger', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
					sandboxMode="danger"
					dangerAvailable={true}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
				/>,
			);
			expect(
				container.querySelector<HTMLElement>(
					'[data-orchestrator-dock-sandbox-toggle]',
				)?.dataset.orchestratorDockSandboxToggle,
			).toBe('danger');
		});

		it('omits the sandbox toggle when danger is unavailable', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
				/>,
			);
			expect(
				container.querySelector('[data-orchestrator-dock-sandbox-toggle]'),
			).toBeNull();
		});

		it('gives the sandbox toggle a non-empty aria-label', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
					sandboxMode="worker"
					dangerAvailable={true}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
				/>,
			);
			expect(
				container
					.querySelector('[data-orchestrator-dock-sandbox-toggle]')
					?.getAttribute('aria-label')?.length,
			).toBeGreaterThan(0);
		});
	});

	describe('Boundary — the danger-only debugger', () => {
		it('renders the debugger in danger mode', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
					sandboxMode="danger"
					dangerAvailable={true}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
				/>,
			);
			expect(
				container.querySelector('[data-orchestrator-dock-debugger]'),
			).not.toBeNull();
		});

		it('omits the debugger in worker mode', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
					sandboxMode="worker"
					dangerAvailable={true}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
				/>,
			);
			expect(
				container.querySelector('[data-orchestrator-dock-debugger]'),
			).toBeNull();
		});

		it('omits the debugger when danger is unavailable even if the mode is danger', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
					sandboxMode="danger"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
				/>,
			);
			expect(
				container.querySelector('[data-orchestrator-dock-debugger]'),
			).toBeNull();
		});

		it('reflects debuggerEnabled=true on the debugger checkbox', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
					sandboxMode="danger"
					dangerAvailable={true}
					debuggerEnabled={true}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
				/>,
			);
			expect(
				container.querySelector<HTMLInputElement>(
					'[data-orchestrator-dock-debugger]',
				)?.checked,
			).toBe(true);
		});

		it('reflects debuggerEnabled=false on the debugger checkbox', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
					sandboxMode="danger"
					dangerAvailable={true}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
				/>,
			);
			expect(
				container.querySelector<HTMLInputElement>(
					'[data-orchestrator-dock-debugger]',
				)?.checked,
			).toBe(false);
		});

		it('gives the debugger a non-empty aria-label', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
					sandboxMode="danger"
					dangerAvailable={true}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
				/>,
			);
			expect(
				container
					.querySelector('[data-orchestrator-dock-debugger]')
					?.getAttribute('aria-label')?.length,
			).toBeGreaterThan(0);
		});
	});

	describe('Interface — the sandbox and debugger affordances', () => {
		it('clicking the sandbox toggle calls onSandboxToggle once', () => {
			const onSandboxToggle = vi.fn();
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
					sandboxMode="worker"
					dangerAvailable={true}
					debuggerEnabled={false}
					onSandboxToggle={onSandboxToggle}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
				/>,
			);
			fireEvent.click(
				container.querySelector('[data-orchestrator-dock-sandbox-toggle]')!,
			);
			expect(onSandboxToggle).toHaveBeenCalledOnce();
		});

		it('clicking the debugger calls onDebuggerToggle once', () => {
			const onDebuggerToggle = vi.fn();
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
					sandboxMode="danger"
					dangerAvailable={true}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={onDebuggerToggle}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
				/>,
			);
			fireEvent.click(
				container.querySelector('[data-orchestrator-dock-debugger]')!,
			);
			expect(onDebuggerToggle).toHaveBeenCalledOnce();
		});
	});

	describe('Boundary — the run-limit inputs', () => {
		it('the seconds input carries the seconds value', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
				/>,
			);
			expect(
				container.querySelector<HTMLInputElement>(
					'[data-orchestrator-dock-limit="seconds"]',
				)?.value,
			).toBe('5');
		});

		it('the iterations input carries the iterations value', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
				/>,
			);
			expect(
				container.querySelector<HTMLInputElement>(
					'[data-orchestrator-dock-limit="iterations"]',
				)?.value,
			).toBe('1000');
		});

		it('gives the seconds input a non-empty aria-label', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
				/>,
			);
			expect(
				container
					.querySelector('[data-orchestrator-dock-limit="seconds"]')
					?.getAttribute('aria-label')?.length,
			).toBeGreaterThan(0);
		});

		it('gives the iterations input a non-empty aria-label', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={() => {}}
				/>,
			);
			expect(
				container
					.querySelector('[data-orchestrator-dock-limit="iterations"]')
					?.getAttribute('aria-label')?.length,
			).toBeGreaterThan(0);
		});

		it('carries non-default values on two distinct number inputs', () => {
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 10, iterations: 500 }}
					onLimitChange={() => {}}
				/>,
			);
			const seconds = container.querySelector<HTMLInputElement>(
				'[data-orchestrator-dock-limit="seconds"]',
			);
			const iterations = container.querySelector<HTMLInputElement>(
				'[data-orchestrator-dock-limit="iterations"]',
			);
			// Non-default values kill a hardcoded-pair fake; type="number" locks the
			// numeric-input contract the C3-C5 run lifecycle depends on.
			expect(seconds?.value).toBe('10');
			expect(iterations?.value).toBe('500');
			expect(seconds?.getAttribute('type')).toBe('number');
			expect(iterations?.getAttribute('type')).toBe('number');
		});
	});

	describe('Interface — editing the run limits', () => {
		it('editing the seconds input reports onLimitChange with the seconds field and the new number', () => {
			const onLimitChange = vi.fn();
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={onLimitChange}
				/>,
			);
			fireEvent.change(
				container.querySelector('[data-orchestrator-dock-limit="seconds"]')!,
				{ target: { value: '7' } },
			);
			expect(onLimitChange).toHaveBeenCalledWith('seconds', 7);
		});

		it('editing the iterations input reports onLimitChange with the iterations field and the new number', () => {
			const onLimitChange = vi.fn();
			const { container } = render(
				<Dock
					collapsed={false}
					onCollapseToggle={() => {}}
					sourceType="module"
					scriptModeHintVisible={false}
					onTypeToggle={() => {}}
					sandboxMode="worker"
					dangerAvailable={false}
					debuggerEnabled={false}
					onSandboxToggle={() => {}}
					onDebuggerToggle={() => {}}
					runLimits={{ seconds: 5, iterations: 1000 }}
					onLimitChange={onLimitChange}
				/>,
			);
			fireEvent.change(
				container.querySelector('[data-orchestrator-dock-limit="iterations"]')!,
				{ target: { value: '500' } },
			);
			expect(onLimitChange).toHaveBeenCalledWith('iterations', 500);
		});
	});
});
