// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import PhasesPanel from '../index.js';

afterEach(cleanup);

describe('PhasesPanel', () => {
	describe('Zero — no shown stations', () => {
		it('renders the panel root', () => {
			const { container } = render(
				<PhasesPanel
					stations={[]}
					roster={{
						source: [],
						realm: [],
						parse: [],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'pending',
						realm: 'pending',
						parse: 'pending',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens={null}
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			expect(
				container.querySelector('[data-orchestrator-phases-panel]'),
			).not.toBeNull();
		});

		it('renders the root as a nav element', () => {
			const { container } = render(
				<PhasesPanel
					stations={[]}
					roster={{
						source: [],
						realm: [],
						parse: [],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'pending',
						realm: 'pending',
						parse: 'pending',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens={null}
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			expect(
				container.querySelector('[data-orchestrator-phases-panel]')?.tagName,
			).toBe('NAV');
		});

		it('renders zero station columns', () => {
			const { container } = render(
				<PhasesPanel
					stations={[]}
					roster={{
						source: [],
						realm: [],
						parse: [],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'pending',
						realm: 'pending',
						parse: 'pending',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens={null}
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			expect(
				container.querySelectorAll('[data-orchestrator-station]'),
			).toHaveLength(0);
		});
	});

	describe('One — a single shown station', () => {
		it('renders exactly one column for the shown station', () => {
			const { container } = render(
				<PhasesPanel
					stations={['parse']}
					roster={{
						source: [],
						realm: [],
						parse: [],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'ok',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens={null}
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			expect(
				container.querySelectorAll('[data-orchestrator-station="parse"]'),
			).toHaveLength(1);
		});

		it("renders the station's picker as a select element", () => {
			const { container } = render(
				<PhasesPanel
					stations={['parse']}
					roster={{
						source: [],
						realm: [],
						parse: ['a'],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'ok',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens={null}
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			expect(
				container.querySelector('[data-orchestrator-station="parse"] select'),
			).not.toBeNull();
		});
	});

	describe('Many — shown stations render in prop order', () => {
		it('renders all five stations in the given canonical order', () => {
			const { container } = render(
				<PhasesPanel
					stations={['source', 'realm', 'parse', 'creation', 'evaluation']}
					roster={{
						source: [],
						realm: [],
						parse: [],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'ok',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens={null}
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			// eslint-disable-next-line unicorn/prefer-spread -- NodeList spread fails tsc without dom.iterable
			const columns = Array.from(
				container.querySelectorAll<HTMLElement>('[data-orchestrator-station]'),
			).map((column) => column.dataset.orchestratorStation);
			expect(columns).toEqual([
				'source',
				'realm',
				'parse',
				'creation',
				'evaluation',
			]);
		});

		it('follows the prop order, not a hardcoded canonical order', () => {
			const { container } = render(
				<PhasesPanel
					stations={['evaluation', 'source']}
					roster={{
						source: [],
						realm: [],
						parse: [],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'ok',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens={null}
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			// eslint-disable-next-line unicorn/prefer-spread -- NodeList spread fails tsc without dom.iterable
			const columns = Array.from(
				container.querySelectorAll<HTMLElement>('[data-orchestrator-station]'),
			).map((column) => column.dataset.orchestratorStation);
			expect(columns).toEqual(['evaluation', 'source']);
		});
	});

	describe('Boundaries — roster-driven disabling, status display, never-gated interactivity', () => {
		it('disables the select of an empty-roster station', () => {
			const { container } = render(
				<PhasesPanel
					stations={['realm']}
					roster={{
						source: [],
						realm: [],
						parse: [],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'ok',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens={null}
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			const select = container.querySelector<HTMLSelectElement>(
				'[data-orchestrator-station="realm"] select',
			);
			expect(select?.disabled).toBe(true);
		});

		it('renders only the sentinel option for an empty-roster station', () => {
			const { container } = render(
				<PhasesPanel
					stations={['realm']}
					roster={{
						source: [],
						realm: [],
						parse: [],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'ok',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens={null}
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			expect(
				container.querySelectorAll(
					'[data-orchestrator-station="realm"] option',
				),
			).toHaveLength(1);
		});

		it('reflects a constant status on its column attribute', () => {
			const { container } = render(
				<PhasesPanel
					stations={['source', 'parse']}
					roster={{
						source: [],
						realm: [],
						parse: [],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'errored',
						creation: 'barred',
						evaluation: 'barred',
					}}
					activeLens={null}
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			expect(
				container.querySelector<HTMLElement>(
					'[data-orchestrator-station="source"]',
				)?.dataset.orchestratorStationStatus,
			).toBe('constant');
		});

		it('reflects a distinct errored status on a sibling column in the same render', () => {
			const { container } = render(
				<PhasesPanel
					stations={['source', 'parse']}
					roster={{
						source: [],
						realm: [],
						parse: [],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'errored',
						creation: 'barred',
						evaluation: 'barred',
					}}
					activeLens={null}
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			expect(
				container.querySelector<HTMLElement>(
					'[data-orchestrator-station="parse"]',
				)?.dataset.orchestratorStationStatus,
			).toBe('errored');
		});

		it('keeps a barred station with a non-empty roster interactive (lens availability is never gated)', () => {
			const { container } = render(
				<PhasesPanel
					stations={['creation']}
					roster={{
						source: [],
						realm: [],
						parse: [],
						creation: ['future-prediction-lens'],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'errored',
						creation: 'barred',
						evaluation: 'barred',
					}}
					activeLens={null}
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			const select = container.querySelector<HTMLSelectElement>(
				'[data-orchestrator-station="creation"] select',
			);
			expect(select?.disabled).toBe(false);
		});

		it('renders a status label element inside the column', () => {
			const { container } = render(
				<PhasesPanel
					stations={['parse']}
					roster={{
						source: [],
						realm: [],
						parse: [],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'ok',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens={null}
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			expect(
				container.querySelector(
					'[data-orchestrator-station="parse"] [data-orchestrator-station-status-label]',
				),
			).not.toBeNull();
		});
	});

	describe('Interfaces — selection, active lens, edit return', () => {
		it('fires onLensSelect with the lens name on a non-sentinel selection', () => {
			const onLensSelect = vi.fn();
			const { container } = render(
				<PhasesPanel
					stations={['source']}
					roster={{
						source: ['annotate', 'blanks'],
						realm: [],
						parse: [],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'ok',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens={null}
					onLensSelect={onLensSelect}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			const select = container.querySelector(
				'[data-orchestrator-station="source"] select',
			);
			fireEvent.change(select!, { target: { value: 'blanks' } });
			expect(onLensSelect).toHaveBeenCalledWith('blanks');
		});

		it('does not fire onLensSelect for the sentinel value', () => {
			const onLensSelect = vi.fn();
			const { container } = render(
				<PhasesPanel
					stations={['source']}
					roster={{
						source: ['annotate'],
						realm: [],
						parse: [],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'ok',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens={null}
					onLensSelect={onLensSelect}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			const select = container.querySelector(
				'[data-orchestrator-station="source"] select',
			);
			fireEvent.change(select!, { target: { value: '' } });
			expect(onLensSelect).not.toHaveBeenCalled();
		});

		it("shows the active lens as its owning station's select value", () => {
			const { container } = render(
				<PhasesPanel
					stations={['source', 'parse']}
					roster={{
						source: ['annotate'],
						realm: [],
						parse: ['a'],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'ok',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens="annotate"
					onLensSelect={() => {}}
					editButtonVisible
					onEditReturn={() => {}}
				/>,
			);
			const select = container.querySelector<HTMLSelectElement>(
				'[data-orchestrator-station="source"] select',
			);
			expect(select?.value).toBe('annotate');
		});

		it('shows the sentinel in stations that do not roster the active lens', () => {
			const { container } = render(
				<PhasesPanel
					stations={['source', 'parse']}
					roster={{
						source: ['annotate'],
						realm: [],
						parse: ['a'],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'ok',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens="annotate"
					onLensSelect={() => {}}
					editButtonVisible
					onEditReturn={() => {}}
				/>,
			);
			const select = container.querySelector<HTMLSelectElement>(
				'[data-orchestrator-station="parse"] select',
			);
			expect(select?.value).toBe('');
		});

		it('shows the sentinel everywhere for a panel-excluded active lens', () => {
			const { container } = render(
				<PhasesPanel
					stations={['source', 'parse']}
					roster={{
						source: ['annotate'],
						realm: [],
						parse: ['a'],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'ok',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens="debug-props"
					onLensSelect={() => {}}
					editButtonVisible
					onEditReturn={() => {}}
				/>,
			);
			// eslint-disable-next-line unicorn/prefer-spread -- NodeList spread fails tsc without dom.iterable
			const values = Array.from(
				container.querySelectorAll<HTMLSelectElement>(
					'[data-orchestrator-station] select',
				),
			).map((select) => select.value);
			expect(values).toEqual(['', '']);
		});

		it('shows a multi-station active lens in every station that rosters it', () => {
			const { container } = render(
				<PhasesPanel
					stations={['source', 'parse']}
					roster={{
						source: ['multi'],
						realm: [],
						parse: ['multi'],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'ok',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens="multi"
					onLensSelect={() => {}}
					editButtonVisible
					onEditReturn={() => {}}
				/>,
			);
			// eslint-disable-next-line unicorn/prefer-spread -- NodeList spread fails tsc without dom.iterable
			const values = Array.from(
				container.querySelectorAll<HTMLSelectElement>(
					'[data-orchestrator-station] select',
				),
			).map((select) => select.value);
			expect(values).toEqual(['multi', 'multi']);
		});

		it('labels each select with its station name', () => {
			const { container } = render(
				<PhasesPanel
					stations={['source', 'evaluation']}
					roster={{
						source: [],
						realm: [],
						parse: [],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'ok',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens={null}
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			// eslint-disable-next-line unicorn/prefer-spread -- NodeList spread fails tsc without dom.iterable
			const labels = Array.from(
				container.querySelectorAll<HTMLSelectElement>(
					'[data-orchestrator-station] select',
				),
			).map((select) => select.getAttribute('aria-label'));
			expect(labels).toEqual([
				'source station lens picker',
				'evaluation station lens picker',
			]);
		});

		it('renders the edit-return button in lens mode', () => {
			const { container } = render(
				<PhasesPanel
					stations={['source']}
					roster={{
						source: ['annotate'],
						realm: [],
						parse: [],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'ok',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens="annotate"
					onLensSelect={() => {}}
					editButtonVisible
					onEditReturn={() => {}}
				/>,
			);
			expect(
				container.querySelector('[data-orchestrator-edit-button]'),
			).not.toBeNull();
		});

		it("labels the edit-return button 'Edit code'", () => {
			const { container } = render(
				<PhasesPanel
					stations={['source']}
					roster={{
						source: ['annotate'],
						realm: [],
						parse: [],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'ok',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens="annotate"
					onLensSelect={() => {}}
					editButtonVisible
					onEditReturn={() => {}}
				/>,
			);
			expect(
				container.querySelector('[data-orchestrator-edit-button]')?.textContent,
			).toBe('Edit code');
		});

		it('fires onEditReturn when the edit-return button is clicked', () => {
			const onEditReturn = vi.fn();
			const { container } = render(
				<PhasesPanel
					stations={['source']}
					roster={{
						source: ['annotate'],
						realm: [],
						parse: [],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'ok',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens="annotate"
					onLensSelect={() => {}}
					editButtonVisible
					onEditReturn={onEditReturn}
				/>,
			);
			fireEvent.click(
				container.querySelector('[data-orchestrator-edit-button]')!,
			);
			expect(onEditReturn).toHaveBeenCalledTimes(1);
		});

		it('renders no edit-return button in editor mode', () => {
			const { container } = render(
				<PhasesPanel
					stations={['source']}
					roster={{
						source: ['annotate'],
						realm: [],
						parse: [],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'ok',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens={null}
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			expect(
				container.querySelector('[data-orchestrator-edit-button]'),
			).toBeNull();
		});
	});

	describe('Simple — the sentinel contract', () => {
		it('renders the first option as the non-selectable sentinel', () => {
			const { container } = render(
				<PhasesPanel
					stations={['source']}
					roster={{
						source: ['annotate'],
						realm: [],
						parse: [],
						creation: [],
						evaluation: [],
					}}
					statusMap={{
						source: 'constant',
						realm: 'constant',
						parse: 'ok',
						creation: 'pending',
						evaluation: 'pending',
					}}
					activeLens={null}
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			const sentinel = container.querySelector<HTMLOptionElement>(
				'[data-orchestrator-station="source"] option',
			);
			expect({
				value: sentinel?.value,
				disabled: sentinel?.disabled,
				hidden: sentinel?.hidden,
			}).toEqual({ value: '', disabled: true, hidden: true });
		});
	});
});
