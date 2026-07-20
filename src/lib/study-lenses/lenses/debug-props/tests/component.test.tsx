// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import debugPropertiesLens from '../index.jsx';

afterEach(cleanup);

describe('debug-props lens — the contract', () => {
	it('exports the lens under its name', () => {
		expect(debugPropertiesLens.name).toBe('debug-props');
	});

	it('is applicable to any facts', () => {
		expect(debugPropertiesLens.applicability(embody('1 +').facts)).toBe(true);
	});

	it('declares no phase — panel-excluded', () => {
		expect('phase' in debugPropertiesLens).toBe(false);
	});
});

describe('debug-props lens — the rendered dump', () => {
	it('renders the region lens root', () => {
		const { container } = render(
			<debugPropertiesLens.main embodiment={embody('let x = 1')} config={{}} />,
		);
		expect(container.querySelector('[data-lens="debug-props"]')).not.toBeNull();
	});

	it('carries its own selector on the root', () => {
		const { container } = render(
			<debugPropertiesLens.main embodiment={embody('let x = 1')} config={{}} />,
		);
		expect(container.querySelector('[data-debug-props]')).not.toBeNull();
	});

	it('renders the three panels in order', () => {
		const { container } = render(
			<debugPropertiesLens.main embodiment={embody('let x = 1')} config={{}} />,
		);
		expect(
			Array.from(
				container.querySelectorAll<HTMLElement>('[data-debug-panel]'),
				(element) => element.dataset.debugPanel,
			),
		).toEqual(['facts', 'study', 'config']);
	});

	it('renders one entry per fact stage', () => {
		const { container } = render(
			<debugPropertiesLens.main embodiment={embody('let x = 1')} config={{}} />,
		);
		expect(
			Array.from(
				container.querySelectorAll<HTMLElement>('[data-fact-stage]'),
				(element) => element.dataset.factStage,
			),
		).toEqual(['source', 'tokens', 'ast', 'entwined', 'environment', 'type']);
	});

	it('renders one entry per study phase', () => {
		const { container } = render(
			<debugPropertiesLens.main embodiment={embody('let x = 1')} config={{}} />,
		);
		expect(
			Array.from(
				container.querySelectorAll<HTMLElement>('[data-study-phase]'),
				(element) => element.dataset.studyPhase,
			),
		).toEqual(['source', 'tokens', 'ast', 'environment', 'evaluation']);
	});

	it('describes an ok stage in its definition', () => {
		const { container } = render(
			<debugPropertiesLens.main embodiment={embody('let x = 1')} config={{}} />,
		);
		expect(
			container.querySelector('[data-fact-stage="tokens"] dd')?.textContent,
		).toBe('4 tokens');
	});

	it('marks a failed stage in its term', () => {
		const { container } = render(
			<debugPropertiesLens.main embodiment={embody('1 +')} config={{}} />,
		);
		expect(
			container.querySelector('[data-fact-stage="ast"] dt')?.textContent,
		).toBe('ast · failed');
	});

	it('keeps the parser voice in the failed definition', () => {
		const { container } = render(
			<debugPropertiesLens.main embodiment={embody('1 +')} config={{}} />,
		);
		expect(
			container.querySelector('[data-fact-stage="ast"] dd')?.textContent,
		).toBe('Unexpected token (1:3)');
	});

	it('marks a barred phase in its term', () => {
		const { container } = render(
			<debugPropertiesLens.main embodiment={embody('01')} config={{}} />,
		);
		expect(
			container.querySelector('[data-study-phase="ast"] dt')?.textContent,
		).toBe('ast · barred');
	});

	it('renders the barring cause after the lens list', () => {
		const { container } = render(
			<debugPropertiesLens.main embodiment={embody('01')} config={{}} />,
		);
		expect(
			container.querySelector('[data-study-phase="ast"] dd:last-of-type')
				?.textContent,
		).toBe('Invalid number (1:0)');
	});

	it('renders attached lens names in the phase entry', () => {
		const flowchart = {
			name: 'flowchart',
			applicability: () => true,
			phase: 'ast',
		} as const;
		const { container } = render(
			<debugPropertiesLens.main
				embodiment={embody('let x = 1', { lenses: [flowchart] })}
				config={{}}
			/>,
		);
		expect(
			container.querySelector('[data-study-phase="ast"] dd')?.textContent,
		).toBe('flowchart');
	});

	it('renders a placeholder for a phase with no lenses', () => {
		const { container } = render(
			<debugPropertiesLens.main embodiment={embody('let x = 1')} config={{}} />,
		);
		expect(
			container.querySelector('[data-study-phase="source"] dd')?.textContent,
		).toBe('(none)');
	});

	it('renders a placeholder for an empty config', () => {
		const { container } = render(
			<debugPropertiesLens.main embodiment={embody('let x = 1')} config={{}} />,
		);
		expect(
			container.querySelector('[data-debug-panel="config"] pre')?.textContent,
		).toBe('(empty)');
	});

	it('renders the config record as JSON', () => {
		const { container } = render(
			<debugPropertiesLens.main
				embodiment={embody('let x = 1')}
				config={{ stepDelay: 500 }}
			/>,
		);
		const text = container.querySelector(
			'[data-debug-panel="config"] pre',
		)?.textContent;
		expect(JSON.parse(text ?? 'null')).toEqual({ stepDelay: 500 });
	});
});
