import { describe, expect, it } from 'vitest';

import type {
	Gateable,
	LifecyclePhase,
	LifecyclePhaseName,
	StageCause,
} from '../../../embody/types.js';
import type { Lens } from '../../../lenses/types.js';
import deriveStations from '../derive-stations.js';

const ORDER: ReadonlyArray<LifecyclePhaseName> = [
	'source',
	'tokens',
	'ast',
	'environment',
	'evaluation',
];

function buildLens(name: string): Lens {
	return {
		name,
		label: name,
		applicability: () => true,
		phase: 'source',
		main: () => null,
	};
}

function buildStudy(
	attached: Partial<Record<LifecyclePhaseName, ReadonlyArray<Gateable>>> = {},
	barred: {
		readonly phases: ReadonlyArray<LifecyclePhaseName>;
		readonly cause: StageCause;
	} | null = null,
): Readonly<Record<LifecyclePhaseName, LifecyclePhase>> {
	const entries = ORDER.map((name) => {
		const lenses = attached[name] ?? [];
		if (barred?.phases.includes(name)) {
			return [name, { accessible: false, cause: barred.cause, lenses }];
		}
		return [name, { accessible: true, lenses }];
	});
	return Object.fromEntries(entries) as Readonly<
		Record<LifecyclePhaseName, LifecyclePhase>
	>;
}

describe('deriveStations', () => {
	describe('nothing fits any phase (Zero)', () => {
		it('every station stands bare', () => {
			expect(
				deriveStations(buildStudy(), []).map((station) => station.standing),
			).toEqual(['bare', 'bare', 'bare', 'bare', 'bare']);
		});

		it('a bare station carries no tray', () => {
			expect(deriveStations(buildStudy(), [])[0]).not.toHaveProperty('tray');
		});
	});

	describe('one lens fits one phase (One)', () => {
		it('that station stands openable', () => {
			const parsons = buildLens('parsons');
			expect(
				deriveStations(buildStudy({ source: [parsons] }), [parsons])[0]
					?.standing,
			).toBe('openable');
		});

		it('its tray discloses that one lens', () => {
			const parsons = buildLens('parsons');
			const [source] = deriveStations(buildStudy({ source: [parsons] }), [
				parsons,
			]);
			expect(source?.standing === 'openable' && source.tray).toEqual([
				{ lens: 'parsons', label: 'parsons' },
			]);
		});

		it('a tray entry carries the lens own authored label beside its name', () => {
			const parsons = { ...buildLens('parsons'), label: 'rebuild the order' };
			const [source] = deriveStations(buildStudy({ source: [parsons] }), [
				parsons,
			]);
			expect(source?.standing === 'openable' && source.tray[0].label).toBe(
				'rebuild the order',
			);
		});
	});

	describe('several lenses across several phases (Many)', () => {
		it('a phase with two fitting lenses discloses both', () => {
			const parsons = buildLens('parsons');
			const writeme = buildLens('writeme');
			const [source] = deriveStations(
				buildStudy({ source: [parsons, writeme] }),
				[parsons, writeme],
			);
			expect(
				source?.standing === 'openable' &&
					source.tray.map((entry) => entry.lens),
			).toEqual(['parsons', 'writeme']);
		});

		it('each station counts only its own kit', () => {
			const one = buildLens('one');
			const two = buildLens('two');
			const three = buildLens('three');
			const four = buildLens('four');
			expect(
				deriveStations(buildStudy({ source: [one], ast: [two, three, four] }), [
					one,
					two,
					three,
					four,
				]).map((station) =>
					station.standing === 'openable' ? station.tray.length : 0,
				),
			).toEqual([1, 0, 3, 0, 0]);
		});

		it('a phase late in the order counts its own recoverable kit too', () => {
			const spellme = buildLens('spellme');
			expect(
				deriveStations(buildStudy({ environment: [spellme] }), [spellme])[3]
					?.standing,
			).toBe('openable');
		});

		it('reads the machine s order rather than the study record s own key order', () => {
			const scrambled = {
				evaluation: { accessible: true, lenses: [] },
				environment: { accessible: true, lenses: [] },
				ast: { accessible: true, lenses: [] },
				tokens: { accessible: true, lenses: [] },
				source: { accessible: true, lenses: [] },
			} as const;
			expect(
				deriveStations(scrambled, []).map((station) => station.phase),
			).toEqual(['source', 'tokens', 'ast', 'environment', 'evaluation']);
		});

		it('returns one station per phase in the machine s fixed order', () => {
			expect(
				deriveStations(buildStudy(), []).map((station) => station.phase),
			).toEqual(['source', 'tokens', 'ast', 'environment', 'evaluation']);
		});
	});

	describe('the barring geometry (Boundaries)', () => {
		it('a tokens failure leaves the last three stations waiting', () => {
			const study = buildStudy(
				{},
				{
					phases: ['ast', 'environment', 'evaluation'],
					cause: { stage: 'tokens', message: 'Invalid or unexpected token.' },
				},
			);
			expect(
				deriveStations(study, [])
					.filter((station) => station.standing === 'waiting')
					.map((station) => station.phase),
			).toEqual(['ast', 'environment', 'evaluation']);
		});

		it('an ast failure leaves the last two stations waiting', () => {
			const study = buildStudy(
				{},
				{
					phases: ['environment', 'evaluation'],
					cause: { stage: 'ast', message: 'Unexpected token (2:8).' },
				},
			);
			expect(
				deriveStations(study, [])
					.filter((station) => station.standing === 'waiting')
					.map((station) => station.phase),
			).toEqual(['environment', 'evaluation']);
		});

		it('an entwined failure leaves the same two stations waiting as an ast failure', () => {
			const study = buildStudy(
				{},
				{
					phases: ['environment', 'evaluation'],
					cause: {
						stage: 'entwined',
						message: 'the syntax tree does not span its source.',
					},
				},
			);
			expect(
				deriveStations(study, [])
					.filter((station) => station.standing === 'waiting')
					.map((station) => station.phase),
			).toEqual(['environment', 'evaluation']);
		});

		it('a barred phase with a recoverable kit still stands waiting', () => {
			const spellme = buildLens('spellme');
			const study = buildStudy(
				{ environment: [spellme] },
				{
					phases: ['ast', 'environment', 'evaluation'],
					cause: { stage: 'tokens', message: 'Invalid or unexpected token.' },
				},
			);
			expect(deriveStations(study, [spellme])[3]?.standing).toBe('waiting');
		});

		it('a barred phase with a recoverable kit still carries no tray', () => {
			const spellme = buildLens('spellme');
			const study = buildStudy(
				{ environment: [spellme] },
				{
					phases: ['ast', 'environment', 'evaluation'],
					cause: { stage: 'tokens', message: 'Invalid or unexpected token.' },
				},
			);
			expect(deriveStations(study, [spellme])[3]).not.toHaveProperty('tray');
		});

		it('a waiting station carries no cause of its own', () => {
			const study = buildStudy(
				{},
				{
					phases: ['ast', 'environment', 'evaluation'],
					cause: { stage: 'tokens', message: 'Invalid or unexpected token.' },
				},
			);
			expect(deriveStations(study, [])[2]).not.toHaveProperty('cause');
		});

		it('the phase where the machine broke keeps a reachable standing', () => {
			const study = buildStudy(
				{},
				{
					phases: ['ast', 'environment', 'evaluation'],
					cause: { stage: 'tokens', message: 'Invalid or unexpected token.' },
				},
			);
			expect(deriveStations(study, [])[1]?.standing).toBe('bare');
		});

		it('source stands reachable under every failure', () => {
			const study = buildStudy(
				{},
				{
					phases: ['ast', 'environment', 'evaluation'],
					cause: { stage: 'tokens', message: 'Invalid or unexpected token.' },
				},
			);
			expect(deriveStations(study, [])[0]?.standing).not.toBe('waiting');
		});
	});

	describe('what a station carries (Interfaces)', () => {
		it('a bare station carries its phase and its standing and nothing else', () => {
			expect(
				Object.keys(deriveStations(buildStudy(), [])[1] ?? {}).toSorted(
					(left, right) => left.localeCompare(right),
				),
			).toEqual(['phase', 'standing']);
		});

		it('carries no label of its own, because the label is keyed at render', () => {
			expect(deriveStations(buildStudy(), [])[1]).not.toHaveProperty('label');
		});

		it('carries no short label either', () => {
			expect(deriveStations(buildStudy(), [])[1]).not.toHaveProperty(
				'shortLabel',
			);
		});

		it('carries no occupant-dot field', () => {
			const parsons = buildLens('parsons');
			expect(
				deriveStations(buildStudy({ source: [parsons] }), [parsons])[0],
			).not.toHaveProperty('occupant');
		});

		it('an openable station carries its phase, its standing, and its tray, and nothing else', () => {
			const parsons = buildLens('parsons');
			expect(
				Object.keys(
					deriveStations(buildStudy({ source: [parsons] }), [parsons])[0] ?? {},
				).toSorted((left, right) => left.localeCompare(right)),
			).toEqual(['phase', 'standing', 'tray']);
		});

		it('a waiting station carries its phase and its standing, and nothing else', () => {
			const study = buildStudy(
				{},
				{
					phases: ['ast', 'environment', 'evaluation'],
					cause: { stage: 'tokens', message: 'Invalid or unexpected token.' },
				},
			);
			expect(
				Object.keys(deriveStations(study, [])[2] ?? {}).toSorted(
					(left, right) => left.localeCompare(right),
				),
			).toEqual(['phase', 'standing']);
		});
	});

	describe.skip('a kit the roster cannot recover (Exceptions)', () => {
		it('an attached lens absent from the joined roster never enters a tray', () => {
			const parsons = buildLens('parsons');
			const stray = buildLens('stray');
			const [source] = deriveStations(
				buildStudy({ source: [parsons, stray] }),
				[parsons],
			);
			expect(
				source?.standing === 'openable' &&
					source.tray.map((entry) => entry.lens),
			).toEqual(['parsons']);
		});

		it('a phase whose only attached lens is unrecoverable stands bare', () => {
			const stray = buildLens('stray');
			expect(
				deriveStations(buildStudy({ tokens: [stray] }), [])[1]?.standing,
			).toBe('bare');
		});
	});

	describe.skip('what it owns (Simple)', () => {
		it('freezes the station list', () => {
			expect(Object.isFrozen(deriveStations(buildStudy(), []))).toBe(true);
		});

		it('freezes each station', () => {
			expect(
				deriveStations(buildStudy(), []).every((station) =>
					Object.isFrozen(station),
				),
			).toBe(true);
		});
	});
});
