// @vitest-environment jsdom

import { EditorView } from '@codemirror/view';
import {
	act,
	cleanup,
	fireEvent,
	render,
	waitFor,
} from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import scaffoldLevel from '../../language-levels/scaffold/index.js';
import type { LanguageLevel } from '../../language-levels/types.js';
import type { Lens } from '../../lenses/types.js';
import * as eventBusModule from '../event-bus/create-event-bus.js';
import StudyLenses from '../index.jsx';

afterEach(cleanup);
afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

async function mountInstrument(ui: React.ReactElement): Promise<HTMLElement> {
	const { container } = render(<React.StrictMode>{ui}</React.StrictMode>);
	await waitFor(() => {
		expect(container.querySelector('.cm-editor')).not.toBeNull();
	});
	return container;
}

function editLiveSource(container: HTMLElement, source: string): void {
	const host = container.querySelector('.cm-editor');
	if (!host) throw new Error('missing the live editor');
	const view = EditorView.findFromDOM(host as HTMLElement);
	if (!view) throw new Error('missing the editor view');
	view.dispatch({
		changes: { from: 0, to: view.state.doc.length, insert: source },
	});
}

function recordDispatches(): Array<[string, unknown]> {
	const actual = eventBusModule.default;
	const dispatches: Array<[string, unknown]> = [];
	vi.spyOn(eventBusModule, 'default').mockImplementation(() => {
		const bus = actual();
		return {
			...bus,
			dispatch: (name, payload) => {
				dispatches.push([name, payload]);
				bus.dispatch(name, payload);
			},
		};
	});
	return dispatches;
}

function buildLevel(
	key: string,
	validate: LanguageLevel['validate'],
): LanguageLevel {
	return {
		key,
		label: key,
		validate,
		snippetTypes: ['module', 'script'],
		docs: { reference: `${key} docs`, notionalMachine: '' },
		editorSupport: { completion: {}, hover: {}, format: {} },
		models: {},
	};
}

function buildLens(name: string, extras: Partial<Lens> = {}): Lens {
	return {
		name,
		applicability: () => true,
		phase: 'source',
		main: () => null,
		...extras,
	};
}

function buildPanelExcludedLens(
	name: string,
	extras: Partial<Lens> = {},
): Lens {
	return {
		name,
		applicability: () => true,
		main: () => null,
		...extras,
	};
}

describe('StudyLenses', () => {
	describe('snippet alone (Zero)', () => {
		it('mounts the whole instrument with defaults', async () => {
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			expect(
				[
					'[data-study-lenses]',
					'[data-phases-panel]',
					'[data-type-toggle]',
					'[data-guide]',
				].map((selector) => container.querySelector(selector) !== null),
			).toEqual([true, true, true, true]);
		});

		it('mounts no level selector when no levels are registered', async () => {
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			expect(container.querySelector('[data-level-selector]')).toBeNull();
		});

		it('mounts exactly one live editor under StrictMode', async () => {
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			expect(container.querySelectorAll('.cm-editor')).toHaveLength(1);
		});
	});

	describe('the phase projection (Many)', () => {
		it('renders the five phases in spec order', async () => {
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			const names = Array.from(
				container.querySelectorAll<HTMLElement>('[data-phase]'),
				(section) => section.dataset['phase'],
			);
			expect(names).toEqual([
				'source',
				'tokens',
				'ast',
				'environment',
				'evaluation',
			]);
		});

		it('heads each phase with its display label', async () => {
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			const labels = Array.from(
				container.querySelectorAll('[data-phase] h3'),
				(heading) => heading.textContent,
			);
			expect(labels).toEqual([
				'Source',
				'Tokens · spelling',
				'AST · grammar',
				'Environment · names',
				'Evaluation · run',
			]);
		});

		it('bars the downstream phases under a grammar failure', async () => {
			const container = await mountInstrument(<StudyLenses snippet="1 +" />);
			const barred = Array.from(
				container.querySelectorAll<HTMLElement>('[data-phase-barred]'),
				(section) => section.dataset['phase'],
			);
			expect(barred).toEqual(['environment', 'evaluation']);
		});

		it('leaves the ast phase open under a grammar failure', async () => {
			const container = await mountInstrument(<StudyLenses snippet="1 +" />);
			expect(
				container.querySelector('[data-phase="ast"][data-phase-barred]'),
			).toBeNull();
		});

		it('shows the parser message as a barred cause', async () => {
			const container = await mountInstrument(<StudyLenses snippet="1 +" />);
			const cause = container.querySelector(
				'[data-phase="environment"] [data-phase-cause]',
			);
			expect((cause?.textContent?.length ?? 0) > 0).toBe(true);
		});
	});

	describe('the level surfaces (Boundaries)', () => {
		it('mounts the selector when levels are registered', async () => {
			const container = await mountInstrument(
				<StudyLenses languageLevels={[scaffoldLevel]} snippet="const x = 1;" />,
			);
			expect(container.querySelector('[data-level-selector]')).not.toBeNull();
		});

		it('threads the initial level and posture from the props', async () => {
			const container = await mountInstrument(
				<StudyLenses
					activeLanguageLevel="scaffold"
					languageLevels={[scaffoldLevel]}
					snippet="const x = 1;"
					strictLanguageLevels={true}
				/>,
			);
			expect([
				container.querySelector('[data-level-face]')?.textContent,
				container
					.querySelector('[data-strict-toggle]')
					?.getAttribute('aria-pressed'),
			]).toEqual(['Scaffold · fits', 'true']);
		});

		it('commits a level selection raised by the selector', async () => {
			const container = await mountInstrument(
				<StudyLenses languageLevels={[scaffoldLevel]} snippet="const x = 1;" />,
			);
			const face = container.querySelector<HTMLElement>('[data-level-face]');
			if (!face) throw new Error('missing the selector face');
			fireEvent.click(face);
			const option = container.querySelector<HTMLElement>(
				'[data-level-option="scaffold"]',
			);
			if (!option) throw new Error('missing the scaffold option');
			fireEvent.click(option);
			expect(face.textContent).toBe('Scaffold · fits');
		});

		it('consults a level once across unrelated re-renders', async () => {
			const spy = vi.fn(() => []);
			const container = await mountInstrument(
				<StudyLenses
					languageLevels={[buildLevel('spied', spy)]}
					snippet="const x = 1;"
				/>,
			);
			const toggle = container.querySelector<HTMLElement>(
				'[data-strict-toggle]',
			);
			if (!toggle) throw new Error('missing the strict toggle');
			fireEvent.click(toggle);
			expect(spy).toHaveBeenCalledTimes(1);
		});

		it('throws loudly on a duplicate lens name', () => {
			vi.spyOn(console, 'error').mockImplementation(() => {});
			expect(() =>
				render(
					<StudyLenses
						lenses={[buildLens('twin'), buildLens('twin')]}
						snippet="const x = 1;"
					/>,
				),
			).toThrow();
		});
	});

	describe('the settle loop live (Boundaries)', () => {
		it('re-derives the panel when an edit settles', async () => {
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			vi.useFakeTimers();
			try {
				editLiveSource(container, '"unterminated');
				act(() => {
					vi.advanceTimersByTime(250);
				});
			} finally {
				vi.useRealTimers();
			}
			expect(container.querySelectorAll('[data-phase-barred]')).toHaveLength(3);
		});

		it('re-derives immediately on a type toggle', async () => {
			const container = await mountInstrument(
				<StudyLenses snippet={'import "x";'} />,
			);
			const toggle = container.querySelector<HTMLElement>('[data-type-toggle]');
			if (!toggle) throw new Error('missing the type toggle');
			fireEvent.click(toggle);
			expect([
				toggle.textContent,
				container.querySelector(
					'[data-phase="environment"][data-phase-barred]',
				) !== null,
			]).toEqual(['script', true]);
		});
	});

	describe('the opened lens (Interfaces)', () => {
		it('mounts an opened lens with the host-layer config', async () => {
			const probe = buildLens('probe', {
				main: ({ config }) => (
					<div data-probe>{String(config['note'] ?? 'missing')}</div>
				),
			});
			const container = await mountInstrument(
				<StudyLenses
					configs={{ probe: { note: 'from-host' } }}
					lenses={[probe]}
					snippet="const x = 1;"
				/>,
			);
			const affordance = container.querySelector<HTMLElement>(
				'[data-phase="source"] [data-phase-lens="probe"]',
			);
			if (!affordance) throw new Error('missing the probe affordance');
			fireEvent.click(affordance);
			expect(container.querySelector('[data-probe]')?.textContent).toBe(
				'from-host',
			);
		});
	});

	describe('the bus announcements (Interfaces)', () => {
		it('announces the selected level', async () => {
			const dispatches = recordDispatches();
			const container = await mountInstrument(
				<StudyLenses languageLevels={[scaffoldLevel]} snippet="const x = 1;" />,
			);
			const face = container.querySelector<HTMLElement>('[data-level-face]');
			if (!face) throw new Error('missing the selector face');
			fireEvent.click(face);
			const option = container.querySelector<HTMLElement>(
				'[data-level-option="scaffold"]',
			);
			if (!option) throw new Error('missing the scaffold option');
			fireEvent.click(option);
			expect(dispatches).toContainEqual([
				'level-selected',
				{ key: 'scaffold' },
			]);
		});

		it('announces the toggled posture', async () => {
			const dispatches = recordDispatches();
			const container = await mountInstrument(
				<StudyLenses languageLevels={[scaffoldLevel]} snippet="const x = 1;" />,
			);
			const toggle = container.querySelector<HTMLElement>(
				'[data-strict-toggle]',
			);
			if (!toggle) throw new Error('missing the strict toggle');
			fireEvent.click(toggle);
			expect(dispatches).toContainEqual(['posture-toggled', { strict: true }]);
		});

		it('announces the toggled type', async () => {
			const dispatches = recordDispatches();
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			const toggle = container.querySelector<HTMLElement>('[data-type-toggle]');
			if (!toggle) throw new Error('missing the type toggle');
			fireEvent.click(toggle);
			expect(dispatches).toContainEqual(['type-toggled', { type: 'script' }]);
		});

		it('announces the opened lens', async () => {
			const dispatches = recordDispatches();
			const container = await mountInstrument(
				<StudyLenses lenses={[buildLens('viewer')]} snippet="const x = 1;" />,
			);
			const affordance = container.querySelector<HTMLElement>(
				'[data-phase-lens="viewer"]',
			);
			if (!affordance) throw new Error('missing the viewer affordance');
			fireEvent.click(affordance);
			expect(dispatches).toContainEqual(['lens-opened', { lens: 'viewer' }]);
		});

		it('announces the settle after an edit settles', async () => {
			const dispatches = recordDispatches();
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			vi.useFakeTimers();
			try {
				editLiveSource(container, 'let y = 2;');
				act(() => {
					vi.advanceTimersByTime(250);
				});
			} finally {
				vi.useRealTimers();
			}
			expect(dispatches).toContainEqual([
				'settled',
				{ source: 'let y = 2;', type: 'module' },
			]);
		});

		it('announces exactly one settle for one edit settle — mount announces none', async () => {
			const dispatches = recordDispatches();
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			vi.useFakeTimers();
			try {
				editLiveSource(container, 'let y = 2;');
				act(() => {
					vi.advanceTimersByTime(250);
				});
			} finally {
				vi.useRealTimers();
			}
			expect(dispatches.filter(([name]) => name === 'settled')).toHaveLength(1);
		});
	});

	describe('the enforcement mask (Boundaries)', () => {
		it('masks nothing under warn', async () => {
			const container = await mountInstrument(
				<StudyLenses
					activeLanguageLevel="scaffold"
					languageLevels={[scaffoldLevel]}
					snippet="debugger;"
				/>,
			);
			expect(container.querySelector('[data-enforcement-mask]')).toBeNull();
		});

		it('masks the study surfaces under strict while out of level', async () => {
			const container = await mountInstrument(
				<StudyLenses
					activeLanguageLevel="scaffold"
					languageLevels={[scaffoldLevel]}
					snippet="debugger;"
					strictLanguageLevels={true}
				/>,
			);
			expect(container.querySelector('[data-enforcement-mask]')).not.toBeNull();
		});

		it('names the SELECTED level and its first violation, never a fixture', async () => {
			const custom = buildLevel('custom', () => [
				{
					nodeType: 'ConditionalExpression',
					message: 'no ternaries allowed',
					location: { start: 0, end: 1 },
					nodePath: '$.body.0',
				},
			]);
			const container = await mountInstrument(
				<StudyLenses
					activeLanguageLevel="custom"
					languageLevels={[scaffoldLevel, custom]}
					snippet="const x = 1;"
					strictLanguageLevels={true}
				/>,
			);
			const cause = container.querySelector('[data-enforcement-cause]');
			expect([
				cause?.textContent?.includes('custom'),
				cause?.textContent?.includes('no ternaries allowed'),
			]).toEqual([true, true]);
		});

		it('unmasks when a conforming level is selected while masked', async () => {
			const custom = buildLevel('custom', () => [
				{
					nodeType: 'ConditionalExpression',
					message: 'no ternaries allowed',
					location: { start: 0, end: 1 },
					nodePath: '$.body.0',
				},
			]);
			const container = await mountInstrument(
				<StudyLenses
					activeLanguageLevel="custom"
					languageLevels={[scaffoldLevel, custom]}
					snippet="const x = 1;"
					strictLanguageLevels={true}
				/>,
			);
			const face = container.querySelector<HTMLElement>('[data-level-face]');
			if (!face) throw new Error('missing the selector face');
			fireEvent.click(face);
			const option = container.querySelector<HTMLElement>(
				'[data-level-option="scaffold"]',
			);
			if (!option) throw new Error('missing the scaffold option');
			fireEvent.click(option);
			expect(container.querySelector('[data-enforcement-mask]')).toBeNull();
		});

		it('masks nothing while the code does not parse — the carve-out wins', async () => {
			const container = await mountInstrument(
				<StudyLenses
					activeLanguageLevel="scaffold"
					languageLevels={[scaffoldLevel]}
					snippet="1 +"
					strictLanguageLevels={true}
				/>,
			);
			expect(container.querySelector('[data-enforcement-mask]')).toBeNull();
		});

		it('masks with the type-admission cause under an inadmissible type', async () => {
			const container = await mountInstrument(
				<StudyLenses
					activeLanguageLevel="scaffold"
					languageLevels={[scaffoldLevel]}
					snippet="const x = 1;"
					strictLanguageLevels={true}
				/>,
			);
			const toggle = container.querySelector<HTMLElement>('[data-type-toggle]');
			if (!toggle) throw new Error('missing the type toggle');
			fireEvent.click(toggle);
			expect(
				container
					.querySelector('[data-enforcement-cause]')
					?.textContent?.includes('module'),
			).toBe(true);
		});

		it('masks nothing under the none-state', async () => {
			const container = await mountInstrument(
				<StudyLenses
					languageLevels={[scaffoldLevel]}
					snippet="debugger;"
					strictLanguageLevels={true}
				/>,
			);
			expect(container.querySelector('[data-enforcement-mask]')).toBeNull();
		});

		it('marks the covered surfaces inert while masked — keyboard and pointer both', async () => {
			const container = await mountInstrument(
				<StudyLenses
					activeLanguageLevel="scaffold"
					languageLevels={[scaffoldLevel]}
					snippet="debugger;"
					strictLanguageLevels={true}
				/>,
			);
			expect(
				container.querySelector('[data-maskable]')?.hasAttribute('inert'),
			).toBe(true);
		});

		it('lifts the inert marking with the mask', async () => {
			const container = await mountInstrument(
				<StudyLenses
					activeLanguageLevel="scaffold"
					languageLevels={[scaffoldLevel]}
					snippet="const x = 1;"
					strictLanguageLevels={true}
				/>,
			);
			expect(
				container.querySelector('[data-maskable]')?.hasAttribute('inert'),
			).toBe(false);
		});

		it('keeps the study panel mounted beneath the mask', async () => {
			const container = await mountInstrument(
				<StudyLenses
					activeLanguageLevel="scaffold"
					languageLevels={[scaffoldLevel]}
					snippet="debugger;"
					strictLanguageLevels={true}
				/>,
			);
			expect(container.querySelector('[data-phases-panel]')).not.toBeNull();
		});

		it('keeps a mounted lens state beneath the mask', async () => {
			function CounterMain(): React.JSX.Element {
				const [count, setCount] = React.useState(0);
				return (
					<button
						data-counter
						onClick={() => setCount((current) => current + 1)}
						type="button"
					>
						{count}
					</button>
				);
			}
			const container = await mountInstrument(
				<StudyLenses
					activeLanguageLevel="scaffold"
					languageLevels={[scaffoldLevel]}
					lenses={[buildLens('counter', { main: CounterMain })]}
					snippet="const x = 1;"
					strictLanguageLevels={true}
				/>,
			);
			const affordance = container.querySelector<HTMLElement>(
				'[data-phase-lens="counter"]',
			);
			if (!affordance) throw new Error('missing the counter affordance');
			fireEvent.click(affordance);
			const counter = container.querySelector<HTMLElement>('[data-counter]');
			if (!counter) throw new Error('missing the counter');
			fireEvent.click(counter);
			vi.useFakeTimers();
			try {
				editLiveSource(container, 'debugger;');
				act(() => {
					vi.advanceTimersByTime(250);
				});
			} finally {
				vi.useRealTimers();
			}
			expect([
				container.querySelector('[data-enforcement-mask]') !== null,
				container.querySelector('[data-counter]')?.textContent,
			]).toEqual([true, '1']);
		});

		it('keeps the strict toggle alive while masked — flipping it unmasks', async () => {
			const container = await mountInstrument(
				<StudyLenses
					activeLanguageLevel="scaffold"
					languageLevels={[scaffoldLevel]}
					snippet="debugger;"
					strictLanguageLevels={true}
				/>,
			);
			const toggle = container.querySelector<HTMLElement>(
				'[data-strict-toggle]',
			);
			if (!toggle) throw new Error('missing the strict toggle');
			fireEvent.click(toggle);
			expect(container.querySelector('[data-enforcement-mask]')).toBeNull();
		});

		it('keeps the guide alive while masked', async () => {
			const container = await mountInstrument(
				<StudyLenses
					activeLanguageLevel="scaffold"
					languageLevels={[scaffoldLevel]}
					snippet="debugger;"
					strictLanguageLevels={true}
				/>,
			);
			const reveal = container.querySelector<HTMLElement>(
				'[data-guide-reveal]',
			);
			if (!reveal) throw new Error('missing the guide reveal');
			fireEvent.click(reveal);
			expect(container.querySelector('[data-guide-topic]')).not.toBeNull();
		});

		it('unmasks when conformance is restored by an edit', async () => {
			const container = await mountInstrument(
				<StudyLenses
					activeLanguageLevel="scaffold"
					languageLevels={[scaffoldLevel]}
					snippet="debugger;"
					strictLanguageLevels={true}
				/>,
			);
			vi.useFakeTimers();
			try {
				editLiveSource(container, 'const x = 1;');
				act(() => {
					vi.advanceTimersByTime(250);
				});
			} finally {
				vi.useRealTimers();
			}
			expect(container.querySelector('[data-enforcement-mask]')).toBeNull();
		});
	});

	describe('the initial focus (Boundaries)', () => {
		it('mounts an honored phase-declaring lens at load, without a click', async () => {
			const probe = buildLens('focused', {
				main: () => <div data-focused-probe>mounted</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lens="focused" lenses={[probe]} snippet="const x = 1;" />,
			);
			expect(container.querySelector('[data-focused-probe]')).not.toBeNull();
		});

		it('falls back to normal rendering on an unknown lens name', async () => {
			const container = await mountInstrument(
				<StudyLenses lens="nonexistent" snippet="const x = 1;" />,
			);
			expect(container.querySelector('[data-phases-panel]')).not.toBeNull();
		});

		it('mounts nothing without a focus request', async () => {
			const probe = buildLens('idle', {
				main: () => <div data-focused-probe>mounted</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[probe]} snippet="const x = 1;" />,
			);
			expect(container.querySelector('[data-focused-probe]')).toBeNull();
		});

		it('honors a panel-excluded lens through its applicability', async () => {
			const probe = buildPanelExcludedLens('excluded', {
				main: () => <div data-focused-probe>mounted</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lens="excluded" lenses={[probe]} snippet="const x = 1;" />,
			);
			expect(container.querySelector('[data-focused-probe]')).not.toBeNull();
		});

		it('falls back when a panel-excluded applicability refuses', async () => {
			const probe = buildPanelExcludedLens('excluded', {
				applicability: () => false,
				main: () => <div data-focused-probe>mounted</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lens="excluded" lenses={[probe]} snippet="const x = 1;" />,
			);
			expect(container.querySelector('[data-focused-probe]')).toBeNull();
		});

		it('falls back when the focused lens declares only a barred phase', async () => {
			const probe = buildLens('focused', {
				phase: 'environment',
				main: () => <div data-focused-probe>mounted</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lens="focused" lenses={[probe]} snippet="1 +" />,
			);
			expect(container.querySelector('[data-focused-probe]')).toBeNull();
		});

		it('falls back when the focused lens was never attached to its accessible phase', async () => {
			const probe = buildLens('focused', {
				applicability: () => false,
				main: () => <div data-focused-probe>mounted</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lens="focused" lenses={[probe]} snippet="const x = 1;" />,
			);
			expect(container.querySelector('[data-focused-probe]')).toBeNull();
		});

		it('resolves the honor once — no re-run on an unrelated re-render', async () => {
			const applicability = vi.fn(() => true);
			const probe = buildPanelExcludedLens('excluded', {
				applicability,
				main: () => <div data-focused-probe>mounted</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lens="excluded" lenses={[probe]} snippet="const x = 1;" />,
			);
			const callsAtMount = applicability.mock.calls.length;
			const toggle = container.querySelector<HTMLElement>('[data-type-toggle]');
			if (!toggle) throw new Error('missing the type toggle');
			fireEvent.click(toggle);
			expect(applicability.mock.calls.length).toBe(callsAtMount);
		});

		it('masks a focus-mounted lens identically', async () => {
			const probe = buildLens('focused', {
				main: () => <div data-focused-probe>mounted</div>,
			});
			const container = await mountInstrument(
				<StudyLenses
					activeLanguageLevel="scaffold"
					languageLevels={[scaffoldLevel]}
					lens="focused"
					lenses={[probe]}
					snippet="debugger;"
					strictLanguageLevels={true}
				/>,
			);
			expect([
				container.querySelector('[data-enforcement-mask]') !== null,
				container
					.querySelector('[data-maskable] [data-focused-probe]')
					?.closest('[data-maskable]')
					?.hasAttribute('inert'),
			]).toEqual([true, true]);
		});

		it('announces nothing on the bus for an honored mount', async () => {
			const dispatches = recordDispatches();
			const probe = buildLens('focused', {
				main: () => <div data-focused-probe>mounted</div>,
			});
			await mountInstrument(
				<StudyLenses lens="focused" lenses={[probe]} snippet="const x = 1;" />,
			);
			expect(
				dispatches.filter(([name]) => name === 'lens-opened'),
			).toHaveLength(0);
		});

		it('lets the learner commit over the honored default, announcing normally', async () => {
			const dispatches = recordDispatches();
			const focused = buildLens('focused', {
				main: () => <div data-focused-probe>mounted</div>,
			});
			const other = buildLens('other', {
				main: () => <div data-other-probe>other</div>,
			});
			const container = await mountInstrument(
				<StudyLenses
					lens="focused"
					lenses={[focused, other]}
					snippet="const x = 1;"
				/>,
			);
			const affordance = container.querySelector<HTMLElement>(
				'[data-phase-lens="other"]',
			);
			if (!affordance) throw new Error('missing the other affordance');
			fireEvent.click(affordance);
			expect([
				container.querySelector('[data-other-probe]') !== null,
				dispatches.filter(([name]) => name === 'lens-opened').length,
			]).toEqual([true, 1]);
		});
	});

	describe('the document order (Interfaces)', () => {
		it('renders the guide after the study panel', async () => {
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			const panel = container.querySelector('[data-phases-panel]');
			const guide = container.querySelector('[data-guide]');
			if (!panel || !guide) throw new Error('missing a surface');
			expect(
				(panel.compareDocumentPosition(guide) &
					Node.DOCUMENT_POSITION_FOLLOWING) !==
					0,
			).toBe(true);
		});
	});
});
