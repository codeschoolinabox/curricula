// @vitest-environment jsdom
// cspell:ignore affordances editless entrancy

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
import * as generatorSocketModule from '../generator/create-generator-socket.js';
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

// `ready` defaults to the live editor (the editor-mode mount); an honored
// mount opens its lens from the FIRST render — the editor never exists — so
// those tests pass their lens probe's selector instead.
async function mountInstrument(
	ui: React.ReactElement,
	ready = '.cm-editor',
): Promise<HTMLElement> {
	const { container } = render(<React.StrictMode>{ui}</React.StrictMode>);
	await waitFor(() => {
		expect(container.querySelector(ready)).not.toBeNull();
	});
	return container;
}

function openGenerator(container: HTMLElement): void {
	const open = container.querySelector<HTMLElement>('[data-generator-open]');
	if (!open) throw new Error('missing the Generate code button');
	fireEvent.click(open);
}

// Neither Accept nor Discard renders until an ask has answered, so every test
// that reaches them drives one first.
async function askTheGenerator(container: HTMLElement): Promise<void> {
	const ask = container.querySelector<HTMLElement>('[data-generator-generate]');
	if (!ask) throw new Error('missing the Generate affordance');
	fireEvent.click(ask);
	await waitFor(() => {
		expect(container.querySelector('[data-generator-preview]')).not.toBeNull();
	});
}

function returnThroughEditCode(container: HTMLElement): void {
	const back = container.querySelector<HTMLElement>('[data-edit-return]');
	if (!back) throw new Error('missing the Edit code button');
	fireEvent.click(back);
}

// The two pane-occupant announcements, named with their payloads and left in
// dispatch order — the close event is per arm, so a sequence is the only shape
// that can show a generator dispose announcing a lens's close, or either one
// firing twice.
function namePaneAnnouncements(
	dispatches: Array<[string, unknown]>,
): Array<string> {
	return dispatches
		.filter(([name]) => name === 'generator-opened' || name === 'lens-opened')
		.map(([name, payload]) =>
			name === 'generator-opened'
				? `generator-opened:${String((payload as { open: boolean }).open)}`
				: `lens-opened:${String((payload as { lens: string | null }).lens)}`,
		);
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

// The socket seam, through the same module spy recordDispatches uses. It must
// be installed BEFORE the mount: the composition root builds the socket in a
// lazy state initializer that runs once. The double answers in one microtask —
// the real placeholder holds each stage behind a timer, which would be this
// suite's only wall-clock dependency.
function scriptGeneratorSocket(program: string) {
	return vi.spyOn(generatorSocketModule, 'default').mockImplementation(() => ({
		generate: () =>
			Promise.resolve({
				ok: true,
				program,
				meta: { model: 'test-producer', attempts: 1 },
			}),
	}));
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

		it('mounts the level selector with no injected levels', async () => {
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			expect(container.querySelector('[data-level-selector]')).not.toBeNull();
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

		it('offers the built-in level with no injected levels', async () => {
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			const face = container.querySelector<HTMLElement>('[data-level-face]');
			if (!face) throw new Error('missing the selector face');
			fireEvent.click(face);
			expect(
				container.querySelector('[data-level-option="jej"]'),
			).not.toBeNull();
		});

		it('marks the built-in level fitting for an admitted snippet', async () => {
			const container = await mountInstrument(
				<StudyLenses activeLanguageLevel="jej" snippet="const x = 1;" />,
			);
			expect(container.querySelector('[data-level-face]')?.textContent).toBe(
				'Just Enough JavaScript · fits',
			);
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
		it('replaces the editor with the opened lens', async () => {
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[probe]} snippet="const x = 1;" />,
			);
			openLensThroughStrip(container, 'source', 'probe');
			expect([
				container.querySelector('[data-probe]') !== null,
				container.querySelectorAll('.cm-editor').length,
			]).toEqual([true, 0]);
		});

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

		it('mounts the opened lens inside the maskable content region', async () => {
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[probe]} snippet="const x = 1;" />,
			);
			openLensThroughStrip(container, 'source', 'probe');
			expect(
				container.querySelector('[data-probe]')?.closest('[data-maskable]'),
			).not.toBeNull();
		});

		it('switches lens to lens from the strip — one open each, no close between', async () => {
			const dispatches = recordDispatches();
			const first = buildLens('first-lens', {
				main: () => <div data-first-probe>first</div>,
			});
			const second = buildLens('second-lens', {
				main: () => <div data-second-probe>second</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[first, second]} snippet="const x = 1;" />,
			);
			openLensThroughStrip(container, 'source', 'first-lens');
			openLensThroughStrip(container, 'source', 'second-lens');
			expect([
				container.querySelector('[data-second-probe]') !== null,
				container.querySelector('[data-first-probe]'),
				container.querySelectorAll('.cm-editor').length,
				dispatches.filter(([name]) => name === 'lens-opened'),
			]).toEqual([
				true,
				null,
				0,
				[
					['lens-opened', { lens: 'first-lens' }],
					['lens-opened', { lens: 'second-lens' }],
				],
			]);
		});

		it('validates once across an editless open, close, and reopen', async () => {
			const spy = vi.fn(() => []);
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses
					languageLevels={[buildLevel('spied', spy)]}
					lenses={[probe]}
					snippet="const x = 1;"
				/>,
			);
			openLensThroughStrip(container, 'source', 'probe');
			openLensThroughStrip(container, 'source', '');
			await waitFor(() => {
				expect(container.querySelector('.cm-editor')).not.toBeNull();
			});
			openLensThroughStrip(container, 'source', 'probe');
			expect(spy).toHaveBeenCalledTimes(1);
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
			vi.useFakeTimers();
			try {
				editLiveSource(container, 'debugger;');
				openLensThroughStrip(container, 'source', 'counter');
				const counter = container.querySelector<HTMLElement>('[data-counter]');
				if (!counter) throw new Error('missing the counter');
				fireEvent.click(counter);
				act(() => {
					vi.advanceTimersByTime(250);
				});
			} finally {
				vi.useRealTimers();
			}
			expect([
				container.querySelector('[data-enforcement-mask]') !== null,
				container.querySelector('[data-counter]')?.textContent,
				container
					.querySelector('[data-counter]')
					?.closest('[data-maskable]') !== null,
			]).toEqual([true, '1', true]);
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
		it('mounts an honored phase-declaring lens at load, without a click — no editor', async () => {
			const probe = buildLens('focused', {
				main: () => <div data-focused-probe>mounted</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lens="focused" lenses={[probe]} snippet="const x = 1;" />,
				'[data-focused-probe]',
			);
			expect([
				container.querySelector('[data-focused-probe]') !== null,
				container.querySelectorAll('.cm-editor').length,
			]).toEqual([true, 0]);
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
				'[data-focused-probe]',
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
				'[data-focused-probe]',
			);
			const callsAtMount = applicability.mock.calls.length;
			const toggle = container.querySelector<HTMLElement>('[data-type-toggle]');
			if (!toggle) throw new Error('missing the type toggle');
			fireEvent.click(toggle);
			expect([
				applicability.mock.calls.length,
				container.querySelector('[data-focused-probe]'),
			]).toEqual([callsAtMount, null]);
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
				'[data-focused-probe]',
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
				'[data-focused-probe]',
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
				'[data-focused-probe]',
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

		it('keeps the opened overrides through the absorbed settle', async () => {
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
			vi.useFakeTimers();
			try {
				editLiveSource(container, 'let y = 2;');
				const affordance = container.querySelector<HTMLElement>(
					'[data-recommendation="target"]',
				);
				if (!affordance) throw new Error('missing the recommendation');
				fireEvent.click(affordance);
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

		it('remounts the editor when the open lens closes', async () => {
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[probe]} snippet="const x = 1;" />,
			);
			openLensThroughStrip(container, 'source', 'probe');
			openLensThroughStrip(container, 'source', '');
			await waitFor(() => {
				expect(container.querySelector('.cm-editor')).not.toBeNull();
			});
			expect(container.querySelector('[data-probe]')).toBeNull();
		});

		it('keeps the settled source through a lens excursion', async () => {
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[probe]} snippet="const x = 1;" />,
			);
			vi.useFakeTimers();
			try {
				editLiveSource(container, 'let settledEdit = 2;');
				act(() => {
					vi.advanceTimersByTime(250);
				});
			} finally {
				vi.useRealTimers();
			}
			openLensThroughStrip(container, 'source', 'probe');
			openLensThroughStrip(container, 'source', '');
			await waitFor(() => {
				expect(container.querySelector('.cm-content')?.textContent).toContain(
					'let settledEdit = 2;',
				);
			});
		});

		it('keeps the just-typed edit through a dispose', async () => {
			// Since the flush-at-open, the edit is absorbed AT the open —
			// nothing stays unsettled across an excursion, so this test can no
			// longer distinguish a live-source seed from a settled-source seed
			// (the seed choice is mutation-checked instead; see the Increment 6
			// commit body). Kept: it still pins that the typed text survives
			// the whole round trip.
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[probe]} snippet="const x = 1;" />,
			);
			vi.useFakeTimers();
			try {
				editLiveSource(container, 'let unsettled = 9;');
				openLensThroughStrip(container, 'source', 'probe');
				openLensThroughStrip(container, 'source', '');
			} finally {
				vi.useRealTimers();
			}
			await waitFor(() => {
				expect(container.querySelector('.cm-content')?.textContent).toContain(
					'let unsettled = 9;',
				);
			});
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
			vi.useFakeTimers();
			try {
				editLiveSource(container, '1 +');
				openLensThroughStrip(container, 'environment', 'env-viewer');
			} finally {
				vi.useRealTimers();
			}
			// The DOCS-pinned LEGAL sequence: the open, the explaining settle
			// (the flush absorbed the breaking edit at open), then the orphan
			// defense's close — settled BETWEEN the name and the null, riding
			// the pinned effect registration order.
			const relevant = dispatches
				.map(([name, payload]) =>
					name === 'lens-opened'
						? `lens-opened:${String((payload as { lens: string | null }).lens)}`
						: name,
				)
				.filter((name) =>
					['lens-opened:env-viewer', 'lens-opened:null', 'settled'].includes(
						name,
					),
				);
			expect([container.querySelector('[data-env-probe]'), relevant]).toEqual([
				null,
				['lens-opened:env-viewer', 'settled', 'lens-opened:null'],
			]);
		});

		it('mounts a focus-honored panel-excluded lens as the pane occupant', async () => {
			// The old pin (open across settles) is unreachable under swap: the
			// editor is absent while a lens is open, so no edit can settle. What
			// IS true: the honored excluded lens occupies the pane (no editor)
			// and no strip select signals it. The edit-return re-entrancy pin
			// lands with the Edit code button.
			const probe = buildPanelExcludedLens('excluded', {
				main: () => <div data-focused-probe>mounted</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lens="excluded" lenses={[probe]} snippet="const x = 1;" />,
				'[data-focused-probe]',
			);
			expect([
				container.querySelector('[data-focused-probe]') !== null,
				container.querySelectorAll('.cm-editor').length,
				Array.from(
					container.querySelectorAll<HTMLSelectElement>('select'),
					(select) => select.value,
				).every((value) => value === ''),
			]).toEqual([true, 0, true]);
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

	describe('the flush at open (Boundaries)', () => {
		it('mounts the opened lens on the exact live buffer, pending keystrokes absorbed', async () => {
			const mirror = buildLens('mirror', {
				main: ({ embodiment }) => (
					<div data-mirror>{embodiment.facts.source.value}</div>
				),
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[mirror]} snippet="const x = 1;" />,
			);
			vi.useFakeTimers();
			try {
				editLiveSource(container, 'let pending = 9;');
				openLensThroughStrip(container, 'source', 'mirror');
			} finally {
				vi.useRealTimers();
			}
			expect(container.querySelector('[data-mirror]')?.textContent).toBe(
				'let pending = 9;',
			);
		});

		it('announces the absorbed settle once, after the open — and never again', async () => {
			const dispatches = recordDispatches();
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[probe]} snippet="const x = 1;" />,
			);
			vi.useFakeTimers();
			try {
				editLiveSource(container, 'let pending = 9;');
				openLensThroughStrip(container, 'source', 'probe');
				act(() => {
					vi.advanceTimersByTime(2000);
				});
			} finally {
				vi.useRealTimers();
			}
			const names = dispatches
				.map(([name]) => name)
				.filter((name) => ['lens-opened', 'settled'].includes(name));
			expect(names).toEqual(['lens-opened', 'settled']);
		});

		it('announces no settle on an editless open', async () => {
			const dispatches = recordDispatches();
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[probe]} snippet="const x = 1;" />,
			);
			openLensThroughStrip(container, 'source', 'probe');
			expect(dispatches.filter(([name]) => name === 'settled')).toHaveLength(0);
		});

		it('never mounts a lens the flushed facts reject — the gate before the defense', async () => {
			// A mount-effect spy distinguishes "never committed" from
			// "committed one frame, then torn down" — the one-frame totality
			// violation the render gate exists to prevent.
			const mounted = vi.fn();
			function NeverMain(): React.JSX.Element {
				React.useEffect(function reportMount() {
					mounted();
				}, []);
				return <div data-never-probe>never</div>;
			}
			const excluded = buildPanelExcludedLens('excluded', {
				applicability: (facts) => facts.ast.ok,
				main: NeverMain,
			});
			const proposer = buildLens('proposer', {
				recommend: () => [
					{ lens: excluded, config: {}, relevance: 0.9, label: 'go deeper' },
				],
			});
			const dispatches = recordDispatches();
			const container = await mountInstrument(
				<StudyLenses lenses={[proposer, excluded]} snippet="const x = 1;" />,
			);
			vi.useFakeTimers();
			try {
				editLiveSource(container, '1 +');
				const affordance = container.querySelector<HTMLElement>(
					'[data-recommendation="excluded"]',
				);
				if (!affordance) throw new Error('missing the recommendation');
				fireEvent.click(affordance);
			} finally {
				vi.useRealTimers();
			}
			await waitFor(() => {
				expect(container.querySelector('.cm-editor')).not.toBeNull();
			});
			const relevant = dispatches
				.map(([name, payload]) =>
					name === 'lens-opened'
						? `lens-opened:${String((payload as { lens: string | null }).lens)}`
						: name,
				)
				.filter((name) =>
					['lens-opened:excluded', 'lens-opened:null', 'settled'].includes(
						name,
					),
				);
			expect([
				mounted.mock.calls.length,
				container.querySelector('[data-never-probe]'),
				relevant,
			]).toEqual([
				0,
				null,
				['lens-opened:excluded', 'settled', 'lens-opened:null'],
			]);
		});
	});

	describe('the dispose rule (Boundaries)', () => {
		it('closes the open lens before the type toggles', async () => {
			const dispatches = recordDispatches();
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[probe]} snippet="const x = 1;" />,
			);
			openLensThroughStrip(container, 'source', 'probe');
			const toggle = container.querySelector<HTMLElement>('[data-type-toggle]');
			if (!toggle) throw new Error('missing the type toggle');
			fireEvent.click(toggle);
			await waitFor(() => {
				expect(container.querySelector('.cm-editor')).not.toBeNull();
			});
			const relevant = dispatches
				.map(([name, payload]) =>
					name === 'lens-opened'
						? `lens-opened:${String((payload as { lens: string | null }).lens)}`
						: name,
				)
				.filter((name) =>
					[
						'lens-opened:null',
						'lens-opened:probe',
						'settled',
						'type-toggled',
					].includes(name),
				);
			expect([container.querySelector('[data-probe]'), relevant]).toEqual([
				null,
				['lens-opened:probe', 'lens-opened:null', 'type-toggled', 'settled'],
			]);
		});

		it('closes the open lens before a level selection commits', async () => {
			const dispatches = recordDispatches();
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses
					languageLevels={[scaffoldLevel]}
					lenses={[probe]}
					snippet="const x = 1;"
				/>,
			);
			openLensThroughStrip(container, 'source', 'probe');
			const face = container.querySelector<HTMLElement>('[data-level-face]');
			if (!face) throw new Error('missing the selector face');
			fireEvent.click(face);
			const option = container.querySelector<HTMLElement>(
				'[data-level-option="scaffold"]',
			);
			if (!option) throw new Error('missing the scaffold option');
			fireEvent.click(option);
			await waitFor(() => {
				expect(container.querySelector('.cm-editor')).not.toBeNull();
			});
			// The filter is load-bearing here: the selector's own open/close and
			// the level UI can ride other events; only the pinned three matter,
			// and a duplicate among them still fails toEqual on length.
			const relevant = dispatches
				.map(([name, payload]) =>
					name === 'lens-opened'
						? `lens-opened:${String((payload as { lens: string | null }).lens)}`
						: name,
				)
				.filter((name) =>
					['lens-opened:null', 'lens-opened:probe', 'level-selected'].includes(
						name,
					),
				);
			expect([container.querySelector('[data-probe]'), relevant]).toEqual([
				null,
				['lens-opened:probe', 'lens-opened:null', 'level-selected'],
			]);
		});

		it('dispatches no close when the type toggles with nothing open', async () => {
			const dispatches = recordDispatches();
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			const toggle = container.querySelector<HTMLElement>('[data-type-toggle]');
			if (!toggle) throw new Error('missing the type toggle');
			fireEvent.click(toggle);
			expect(
				dispatches.filter(([name]) => name === 'lens-opened'),
			).toHaveLength(0);
		});

		it('dispatches no close when a level selection commits with nothing open', async () => {
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
			expect([
				dispatches.filter(([name]) => name === 'lens-opened'),
				dispatches.filter(([name]) => name === 'settled'),
			]).toEqual([[], []]);
		});

		it('closes the open lens before the posture commits', async () => {
			const dispatches = recordDispatches();
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses
					languageLevels={[scaffoldLevel]}
					lenses={[probe]}
					snippet="const x = 1;"
				/>,
			);
			openLensThroughStrip(container, 'source', 'probe');
			const toggle = container.querySelector<HTMLElement>(
				'[data-strict-toggle]',
			);
			if (!toggle) throw new Error('missing the strict toggle');
			fireEvent.click(toggle);
			await waitFor(() => {
				expect(container.querySelector('.cm-editor')).not.toBeNull();
			});
			const relevant = dispatches
				.map(([name, payload]) =>
					name === 'lens-opened'
						? `lens-opened:${String((payload as { lens: string | null }).lens)}`
						: name,
				)
				.filter((name) =>
					['lens-opened:null', 'lens-opened:probe', 'posture-toggled'].includes(
						name,
					),
				);
			expect([container.querySelector('[data-probe]'), relevant]).toEqual([
				null,
				['lens-opened:probe', 'lens-opened:null', 'posture-toggled'],
			]);
		});

		it('dispatches no close when the posture commits with nothing open', async () => {
			const dispatches = recordDispatches();
			const container = await mountInstrument(
				<StudyLenses languageLevels={[scaffoldLevel]} snippet="const x = 1;" />,
			);
			const toggle = container.querySelector<HTMLElement>(
				'[data-strict-toggle]',
			);
			if (!toggle) throw new Error('missing the strict toggle');
			fireEvent.click(toggle);
			expect([
				dispatches.filter(([name]) => name === 'lens-opened'),
				dispatches.filter(([name]) => name === 'settled'),
			]).toEqual([[], []]);
		});

		it('disposes an honored lens on a type toggle under the mask', async () => {
			// The type-vector analog of the posture test below — added here so
			// the three dispose vectors carry symmetric masked-honored coverage
			// (the type vector landed one increment earlier without it).
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
				'[data-focused-probe]',
			);
			const toggle = container.querySelector<HTMLElement>('[data-type-toggle]');
			if (!toggle) throw new Error('missing the type toggle');
			fireEvent.click(toggle);
			await waitFor(() => {
				expect(container.querySelector('.cm-editor')).not.toBeNull();
			});
			expect(container.querySelector('[data-focused-probe]')).toBeNull();
		});

		it('disposes an honored lens and unmasks in the same posture commit', async () => {
			// The frozen-mask-input payoff, at its ONE reachable instance: the
			// honored mount is the only masked-open state, and the class-2
			// strict toggle is clickable over it — the commit must dispose the
			// lens AND lift the mask together.
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
				'[data-focused-probe]',
			);
			const toggle = container.querySelector<HTMLElement>(
				'[data-strict-toggle]',
			);
			if (!toggle) throw new Error('missing the strict toggle');
			fireEvent.click(toggle);
			await waitFor(() => {
				expect(container.querySelector('.cm-editor')).not.toBeNull();
			});
			expect([
				container.querySelector('[data-enforcement-mask]'),
				container.querySelector('[data-focused-probe]'),
			]).toEqual([null, null]);
		});
	});

	describe('the Edit code return (Interfaces)', () => {
		it('shows the Edit code affordance only while an excursion holds the pane', async () => {
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[probe]} snippet="const x = 1;" />,
			);
			const before = container.querySelector('[data-edit-return]');
			openLensThroughStrip(container, 'source', 'probe');
			expect([
				before,
				container.querySelector('[data-control-row] [data-edit-return]') !==
					null,
			]).toEqual([null, true]);
		});

		it('offers the Edit code affordance while the generator holds the pane', async () => {
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			openGenerator(container);
			expect(
				container.querySelector('[data-control-row] [data-edit-return]'),
			).not.toBeNull();
		});

		it('disposes to the editor on click, announcing the close', async () => {
			const dispatches = recordDispatches();
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[probe]} snippet="const x = 1;" />,
			);
			openLensThroughStrip(container, 'source', 'probe');
			const back = container.querySelector<HTMLElement>('[data-edit-return]');
			if (!back) throw new Error('missing the Edit code button');
			fireEvent.click(back);
			await waitFor(() => {
				expect(container.querySelector('.cm-editor')).not.toBeNull();
			});
			expect([
				container.querySelector('[data-probe]'),
				container.querySelector('[data-edit-return]'),
				dispatches.filter(
					([name, payload]) =>
						name === 'lens-opened' &&
						(payload as { lens: string | null }).lens === null,
				).length,
			]).toEqual([null, null, 1]);
		});

		it('reopens a lens after an Edit code return', async () => {
			const dispatches = recordDispatches();
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[probe]} snippet="const x = 1;" />,
			);
			openLensThroughStrip(container, 'source', 'probe');
			const back = container.querySelector<HTMLElement>('[data-edit-return]');
			if (!back) throw new Error('missing the Edit code button');
			fireEvent.click(back);
			await waitFor(() => {
				expect(container.querySelector('.cm-editor')).not.toBeNull();
			});
			openLensThroughStrip(container, 'source', 'probe');
			expect([
				container.querySelector('[data-probe]') !== null,
				dispatches.filter(([name]) => name === 'lens-opened'),
			]).toEqual([
				true,
				[
					['lens-opened', { lens: 'probe' }],
					['lens-opened', { lens: null }],
					['lens-opened', { lens: 'probe' }],
				],
			]);
		});

		it('stays alive outside the mask — the guaranteed way home', async () => {
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
				'[data-focused-probe]',
			);
			const back = container.querySelector<HTMLElement>('[data-edit-return]');
			if (!back) throw new Error('missing the Edit code button');
			// jsdom enforces neither inert nor disabled — the structural checks
			// (outside every maskable region, no disabled guard) are the real
			// assertions; the click proves no JS-level mask guard no-ops it.
			expect([
				back.closest('[data-maskable]'),
				back.hasAttribute('disabled'),
			]).toEqual([null, false]);
			fireEvent.click(back);
			await waitFor(() => {
				expect(container.querySelector('.cm-editor')).not.toBeNull();
			});
			expect(container.querySelector('[data-focused-probe]')).toBeNull();
		});

		it('returns a focus-honored panel-excluded lens to the editor', async () => {
			const probe = buildPanelExcludedLens('excluded', {
				main: () => <div data-focused-probe>mounted</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lens="excluded" lenses={[probe]} snippet="const x = 1;" />,
				'[data-focused-probe]',
			);
			const back = container.querySelector<HTMLElement>('[data-edit-return]');
			if (!back) throw new Error('missing the Edit code button');
			fireEvent.click(back);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')?.textContent).toContain(
					'const x = 1;',
				);
			});
			expect(container.querySelectorAll('.cm-editor')).toHaveLength(1);
		});
	});

	describe('the generator affordance (Zero)', () => {
		it('offers the Generate code affordance in editor mode, with no generator mounted', async () => {
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			expect([
				container.querySelector('[data-generator-open]') !== null,
				container.querySelector('[data-generator]') !== null,
			]).toEqual([true, false]);
		});

		it('withdraws the Generate code affordance while the generator holds the pane', async () => {
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			openGenerator(container);
			expect(container.querySelector('[data-generator-open]')).toBeNull();
		});

		it('withdraws the Generate code affordance while a lens holds the pane', async () => {
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[probe]} snippet="const x = 1;" />,
			);
			openLensThroughStrip(container, 'source', 'probe');
			expect(container.querySelector('[data-generator-open]')).toBeNull();
		});
	});

	describe('the generator excursion (Interfaces)', () => {
		it('replaces the editor with the generator view on a Generate code click', async () => {
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			openGenerator(container);
			expect([
				container.querySelector('[data-generator]') !== null,
				container.querySelectorAll('.cm-editor').length,
			]).toEqual([true, 0]);
		});

		it('mounts the generator in the content region, never the strip region', async () => {
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			openGenerator(container);
			expect(
				Array.from(
					container.querySelectorAll('[data-maskable]'),
					(region) => region.querySelector('[data-generator]') !== null,
				),
			).toEqual([false, true]);
		});

		it('announces the generator open as generator-opened true', async () => {
			const dispatches = recordDispatches();
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			openGenerator(container);
			expect(dispatches).toContainEqual(['generator-opened', { open: true }]);
		});

		it('announces the generator close as generator-opened false, never lens-opened null', async () => {
			const dispatches = recordDispatches();
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			openGenerator(container);
			returnThroughEditCode(container);
			await waitFor(() => {
				expect(container.querySelector('.cm-editor')).not.toBeNull();
			});
			expect(namePaneAnnouncements(dispatches)).toEqual([
				'generator-opened:true',
				'generator-opened:false',
			]);
		});

		it('closes a lens without announcing generator-opened', async () => {
			const dispatches = recordDispatches();
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[probe]} snippet="const x = 1;" />,
			);
			openLensThroughStrip(container, 'source', 'probe');
			returnThroughEditCode(container);
			await waitFor(() => {
				expect(container.querySelector('.cm-editor')).not.toBeNull();
			});
			expect(namePaneAnnouncements(dispatches)).toEqual([
				'lens-opened:probe',
				'lens-opened:null',
			]);
		});

		it('returns home from the generator on an Edit code click', async () => {
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			openGenerator(container);
			returnThroughEditCode(container);
			await waitFor(() => {
				expect(container.querySelector('.cm-editor')).not.toBeNull();
			});
			expect(container.querySelector('[data-generator]')).toBeNull();
		});

		it('constructs the generator socket once across a reopen', async () => {
			const factory = scriptGeneratorSocket('const generated = 1;');
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			const callsAtMount = factory.mock.calls.length;
			openGenerator(container);
			returnThroughEditCode(container);
			await waitFor(() => {
				expect(container.querySelector('.cm-editor')).not.toBeNull();
			});
			openGenerator(container);
			expect(factory.mock.calls.length).toBe(callsAtMount);
		});
	});

	describe('the flush at generator open (Boundaries)', () => {
		it('seeds the generator with the exact live buffer, pending keystrokes absorbed', async () => {
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			vi.useFakeTimers();
			try {
				editLiveSource(container, 'let pending = 9;');
				openGenerator(container);
			} finally {
				vi.useRealTimers();
			}
			expect(
				container.querySelector('[data-generator-seed]')?.textContent,
			).toBe('let pending = 9;');
		});

		it('announces the absorbed settle after the generator open, and never again', async () => {
			const dispatches = recordDispatches();
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			vi.useFakeTimers();
			try {
				editLiveSource(container, 'let pending = 9;');
				openGenerator(container);
				act(() => {
					vi.advanceTimersByTime(2000);
				});
			} finally {
				vi.useRealTimers();
			}
			const names = dispatches
				.map(([name]) => name)
				.filter((name) => ['generator-opened', 'settled'].includes(name));
			expect(names).toEqual(['generator-opened', 'settled']);
		});

		it('announces no settle on an editless generator open', async () => {
			const dispatches = recordDispatches();
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			openGenerator(container);
			expect(dispatches.filter(([name]) => name === 'settled')).toHaveLength(0);
		});
	});

	describe('opening a lens over the generator (Interfaces)', () => {
		it('announces the generator close before the lens open when a lens opens over it', async () => {
			const dispatches = recordDispatches();
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[probe]} snippet="const x = 1;" />,
			);
			openGenerator(container);
			openLensThroughStrip(container, 'source', 'probe');
			expect(namePaneAnnouncements(dispatches)).toEqual([
				'generator-opened:true',
				'generator-opened:false',
				'lens-opened:probe',
			]);
		});

		it('replaces the generator with a lens opened from the strip', async () => {
			const probe = buildLens('probe', {
				main: () => <div data-probe>open</div>,
			});
			const container = await mountInstrument(
				<StudyLenses lenses={[probe]} snippet="const x = 1;" />,
			);
			openGenerator(container);
			openLensThroughStrip(container, 'source', 'probe');
			expect([
				container.querySelector('[data-probe]') !== null,
				container.querySelector('[data-generator]'),
			]).toEqual([true, null]);
		});
	});

	describe('the generator accept and discard (Simple)', () => {
		it('lands the accepted candidate in the remounted editor', async () => {
			scriptGeneratorSocket('const generated = 1;');
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			openGenerator(container);
			await askTheGenerator(container);
			const accept = container.querySelector<HTMLElement>(
				'[data-generator-accept]',
			);
			if (!accept) throw new Error('missing the Accept affordance');
			fireEvent.click(accept);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')?.textContent).toContain(
					'const generated = 1;',
				);
			});
		});

		it('leaves the buffer untouched on a discard', async () => {
			scriptGeneratorSocket('const generated = 1;');
			const container = await mountInstrument(
				<StudyLenses snippet="const x = 1;" />,
			);
			openGenerator(container);
			await askTheGenerator(container);
			const discard = container.querySelector<HTMLElement>(
				'[data-generator-discard]',
			);
			if (!discard) throw new Error('missing the Discard affordance');
			fireEvent.click(discard);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')?.textContent).toContain(
					'const x = 1;',
				);
			});
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
