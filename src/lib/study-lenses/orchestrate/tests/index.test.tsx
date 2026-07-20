// @vitest-environment jsdom
// cspell:ignore affordances

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

function openLensThroughStrip(
	container: HTMLElement,
	phase: string,
	lens: string,
): void {
	const select = container.querySelector<HTMLSelectElement>(
		`[data-phase="${phase}"] select`,
	);
	if (!select) throw new Error(`missing the ${phase} select`);
	fireEvent.change(select, { target: { value: lens } });
}

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

		it('labels each phase in the strip, without headings', async () => {
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			const texts = Array.from(
				container.querySelectorAll<HTMLElement>('[data-phase]'),
				(entry) => entry.textContent ?? '',
			);
			expect([
				[
					'Source',
					'Tokens · spelling',
					'AST · grammar',
					'Environment · names',
					'Evaluation · run',
				].every((label, index) => texts[index]?.includes(label)),
				container.querySelector('[data-phases-panel] h3') === null,
			]).toEqual([true, true]);
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
			openLensThroughStrip(container, 'source', 'probe');
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
			openLensThroughStrip(container, 'source', 'viewer');
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
			openLensThroughStrip(container, 'source', 'counter');
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
			openLensThroughStrip(container, 'source', 'other');
			expect([
				container.querySelector('[data-other-probe]') !== null,
				dispatches.filter(([name]) => name === 'lens-opened').length,
			]).toEqual([true, 1]);
		});
	});

	describe('the recommendations (Boundaries)', () => {
		it('renders the ranked proposals as affordances', async () => {
			const target = buildLens('target');
			const proposer = buildLens('proposer', {
				recommend: () => [
					{ lens: target, config: {}, relevance: 0.7, label: 'study next' },
				],
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[proposer, target]} snippet="const x = 1;" />,
			);
			expect(
				container.querySelector('[data-recommendations]')?.textContent,
			).toContain('study next');
		});

		it('renders no recommendation surface without proposals', async () => {
			const container = await mountInstrument(
				<StudyLenses lenses={[buildLens('quiet')]} snippet="const x = 1;" />,
			);
			expect(container.querySelector('[data-recommendations]')).toBeNull();
		});

		it('orders the affordances by relevance, descending', async () => {
			const target = buildLens('target');
			const low = buildLens('low', {
				recommend: () => [
					{ lens: target, config: {}, relevance: 0.2, label: 'later' },
				],
			});
			const high = buildLens('high', {
				recommend: () => [
					{ lens: target, config: {}, relevance: 0.9, label: 'first' },
				],
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[low, high, target]} snippet="const x = 1;" />,
			);
			const labels = Array.from(
				container.querySelectorAll('[data-recommendation]'),
				(affordance) => affordance.textContent,
			);
			expect(labels).toEqual(['first', 'later']);
		});

		it('keys duplicate-target proposals safely', async () => {
			const warned = vi.spyOn(console, 'error').mockImplementation(() => {});
			const target = buildLens('target');
			const proposer = buildLens('proposer', {
				recommend: () => [
					{ lens: target, config: {}, relevance: 0.9, label: 'one way' },
					{ lens: target, config: {}, relevance: 0.4, label: 'another way' },
				],
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[proposer, target]} snippet="const x = 1;" />,
			);
			expect([
				container.querySelectorAll('[data-recommendation]').length,
				warned.mock.calls.length,
			]).toEqual([2, 0]);
		});

		it('opens the proposed lens on a click', async () => {
			const target = buildLens('target', {
				main: () => <div data-target-probe>opened</div>,
			});
			const proposer = buildLens('proposer', {
				recommend: () => [
					{ lens: target, config: {}, relevance: 0.7, label: 'study next' },
				],
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[proposer, target]} snippet="const x = 1;" />,
			);
			const affordance = container.querySelector<HTMLElement>(
				'[data-recommendation="target"]',
			);
			if (!affordance) throw new Error('missing the recommendation');
			fireEvent.click(affordance);
			expect(container.querySelector('[data-target-probe]')).not.toBeNull();
		});

		it('carries the proposal overrides into the cascade above the host layer', async () => {
			const target = buildLens('target', {
				main: ({ config }) => (
					<div data-target-probe>{String(config['note'] ?? 'missing')}</div>
				),
			});
			const proposer = buildLens('proposer', {
				recommend: () => [
					{
						lens: target,
						config: { note: 'from-proposal' },
						relevance: 0.7,
						label: 'study next',
					},
				],
			});
			const container = await mountInstrument(
				<StudyLenses
					configs={{ target: { note: 'from-host' } }}
					lenses={[proposer, target]}
					snippet="const x = 1;"
				/>,
			);
			const affordance = container.querySelector<HTMLElement>(
				'[data-recommendation="target"]',
			);
			if (!affordance) throw new Error('missing the recommendation');
			fireEvent.click(affordance);
			expect(container.querySelector('[data-target-probe]')?.textContent).toBe(
				'from-proposal',
			);
		});

		it('keeps the opened overrides through a settle', async () => {
			const target = buildLens('target', {
				main: ({ config }) => (
					<div data-target-probe>{String(config['note'] ?? 'missing')}</div>
				),
			});
			const proposer = buildLens('proposer', {
				recommend: () => [
					{
						lens: target,
						config: { note: 'from-proposal' },
						relevance: 0.7,
						label: 'study next',
					},
				],
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[proposer, target]} snippet="const x = 1;" />,
			);
			const affordance = container.querySelector<HTMLElement>(
				'[data-recommendation="target"]',
			);
			if (!affordance) throw new Error('missing the recommendation');
			fireEvent.click(affordance);
			vi.useFakeTimers();
			try {
				editLiveSource(container, 'let y = 2;');
				act(() => {
					vi.advanceTimersByTime(250);
				});
			} finally {
				vi.useRealTimers();
			}
			expect(container.querySelector('[data-target-probe]')?.textContent).toBe(
				'from-proposal',
			);
		});

		it('clears the opened overrides with the open-lens choice', async () => {
			const target = buildLens('target', {
				main: ({ config }) => (
					<div data-target-probe>{String(config['note'] ?? 'missing')}</div>
				),
			});
			const proposer = buildLens('proposer', {
				recommend: () => [
					{
						lens: target,
						config: { note: 'from-proposal' },
						relevance: 0.7,
						label: 'study next',
					},
				],
			});
			const container = await mountInstrument(
				<StudyLenses
					configs={{ target: { note: 'from-host' } }}
					lenses={[proposer, target]}
					snippet="const x = 1;"
				/>,
			);
			const affordance = container.querySelector<HTMLElement>(
				'[data-recommendation="target"]',
			);
			if (!affordance) throw new Error('missing the recommendation');
			fireEvent.click(affordance);
			openLensThroughStrip(container, 'source', 'target');
			expect(container.querySelector('[data-target-probe]')?.textContent).toBe(
				'from-host',
			);
		});

		it('renders the recommendations through the mask', async () => {
			const target = buildLens('target');
			const proposer = buildLens('proposer', {
				recommend: () => [
					{ lens: target, config: {}, relevance: 0.7, label: 'study next' },
				],
			});
			const container = await mountInstrument(
				<StudyLenses
					activeLanguageLevel="scaffold"
					languageLevels={[scaffoldLevel]}
					lenses={[proposer, target]}
					snippet="debugger;"
					strictLanguageLevels={true}
				/>,
			);
			expect(
				container.querySelector('[data-maskable] [data-recommendations]'),
			).not.toBeNull();
		});

		it('announces a recommendation open on the bus', async () => {
			const dispatches = recordDispatches();
			const target = buildLens('target');
			const proposer = buildLens('proposer', {
				recommend: () => [
					{ lens: target, config: {}, relevance: 0.7, label: 'study next' },
				],
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[proposer, target]} snippet="const x = 1;" />,
			);
			const affordance = container.querySelector<HTMLElement>(
				'[data-recommendation="target"]',
			);
			if (!affordance) throw new Error('missing the recommendation');
			fireEvent.click(affordance);
			expect(dispatches).toContainEqual(['lens-opened', { lens: 'target' }]);
		});
	});

	describe('closing the open lens (Boundaries)', () => {
		it('closes the mounted lens when the none entry is chosen', async () => {
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[probe]} snippet="const x = 1;" />,
			);
			openLensThroughStrip(container, 'source', 'probe');
			openLensThroughStrip(container, 'source', '');
			expect(container.querySelector('[data-probe]')).toBeNull();
		});

		it('announces the close as lens-opened null', async () => {
			const dispatches = recordDispatches();
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[probe]} snippet="const x = 1;" />,
			);
			openLensThroughStrip(container, 'source', 'probe');
			openLensThroughStrip(container, 'source', '');
			expect(dispatches).toContainEqual(['lens-opened', { lens: null }]);
		});

		it('shows the open lens as the strip select value until closed', async () => {
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[probe]} snippet="const x = 1;" />,
			);
			openLensThroughStrip(container, 'source', 'probe');
			const value = container.querySelector<HTMLSelectElement>(
				'[data-phase="source"] select',
			)?.value;
			openLensThroughStrip(container, 'source', '');
			expect([
				value,
				container.querySelector<HTMLSelectElement>(
					'[data-phase="source"] select',
				)?.value,
			]).toEqual(['probe', '']);
		});
	});

	describe('the orphaned open lens (Boundaries)', () => {
		it('closes a strip-opened lens when its only phase bars, announcing null', async () => {
			const dispatches = recordDispatches();
			const probe = buildLens('env-viewer', {
				applicability: (facts) => facts.source.ok,
				phase: 'environment',
				main: () => <div data-env-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[probe]} snippet="const x = 1;" />,
			);
			openLensThroughStrip(container, 'environment', 'env-viewer');
			vi.useFakeTimers();
			try {
				editLiveSource(container, '1 +');
				act(() => {
					vi.advanceTimersByTime(250);
				});
			} finally {
				vi.useRealTimers();
			}
			expect([
				container.querySelector('[data-env-probe]') === null,
				dispatches.filter(
					([name, payload]) =>
						name === 'lens-opened' &&
						(payload as { lens: string | null }).lens === null,
				).length,
			]).toEqual([true, 1]);
		});

		it('keeps a focus-honored panel-excluded lens open across settles', async () => {
			const probe = buildPanelExcludedLens('excluded', {
				main: () => <div data-focused-probe>mounted</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lens="excluded" lenses={[probe]} snippet="const x = 1;" />,
			);
			vi.useFakeTimers();
			try {
				editLiveSource(container, '1 +');
				act(() => {
					vi.advanceTimersByTime(250);
				});
			} finally {
				vi.useRealTimers();
			}
			expect(container.querySelector('[data-focused-probe]')).not.toBeNull();
		});
	});

	describe('the redesign contract (Interfaces)', () => {
		it('marks BOTH maskable regions inert while masked', async () => {
			const container = await mountInstrument(
				<StudyLenses
					activeLanguageLevel="scaffold"
					languageLevels={[scaffoldLevel]}
					snippet="debugger;"
					strictLanguageLevels={true}
				/>,
			);
			const regions = Array.from(
				container.querySelectorAll('[data-maskable]'),
				(region) => region.hasAttribute('inert'),
			);
			expect(regions).toEqual([true, true]);
		});

		it('anchors every phase select by its data attribute', async () => {
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			expect(
				container.querySelectorAll('[data-phases-panel] [data-phase-select]'),
			).toHaveLength(5);
		});

		it('orders the control row, the strip, and the editor top to bottom', async () => {
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			const follows = (a: Element | null, b: Element | null): boolean =>
				a !== null &&
				b !== null &&
				(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
			const row = container.querySelector('[data-control-row]');
			const strip = container.querySelector('[data-phases-panel]');
			const editor = container.querySelector('.cm-editor');
			expect([follows(row, strip), follows(strip, editor)]).toEqual([
				true,
				true,
			]);
		});
	});

	describe('the mount-time snippet (Boundaries)', () => {
		it('ignores a changed snippet prop after mount', async () => {
			const { container, rerender } = render(
				<React.StrictMode>
					<StudyLenses snippet="const x = 1;" />
				</React.StrictMode>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-editor')).not.toBeNull();
			});
			rerender(
				<React.StrictMode>
					<StudyLenses snippet="entirely different" />
				</React.StrictMode>,
			);
			expect(container.querySelector('.cm-content')?.textContent).toContain(
				'const x = 1;',
			);
		});
	});

	describe('the announce ordering (Interfaces)', () => {
		it('announces the toggled type before its settle', async () => {
			const dispatches = recordDispatches();
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			const toggle = container.querySelector<HTMLElement>('[data-type-toggle]');
			if (!toggle) throw new Error('missing the type toggle');
			fireEvent.click(toggle);
			const names = dispatches.map(([name]) => name);
			expect([
				names.indexOf('type-toggled') < names.indexOf('settled'),
				dispatches.find(([name]) => name === 'settled')?.[1],
			]).toEqual([true, { source: 'const x = 1;', type: 'script' }]);
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
