import { describe, expect, it } from 'vitest';

import type {
	LifecyclePhase,
	LifecyclePhaseName,
	StageCause,
} from '../../../embody/types.js';
import type { Station } from '../../types.js';
import deriveCaption from '../derive-caption.js';

const ORDER: ReadonlyArray<LifecyclePhaseName> = [
	'source',
	'tokens',
	'ast',
	'environment',
	'evaluation',
];

function buildStations(
	standings: ReadonlyArray<Station['standing']>,
): ReadonlyArray<Station> {
	return standings.map((standing, index) => {
		const phase = ORDER[index];
		const shared = { phase, label: phase, shortLabel: phase };
		if (standing === 'openable') {
			return { ...shared, standing, tray: ['parsons'] as const };
		}
		return { ...shared, standing };
	});
}

function buildStudy(
	barred: {
		readonly phases: ReadonlyArray<LifecyclePhaseName>;
		readonly cause: StageCause;
	} | null = null,
): Readonly<Record<LifecyclePhaseName, LifecyclePhase>> {
	const entries = ORDER.map((name) =>
		barred?.phases.includes(name)
			? [name, { accessible: false, cause: barred.cause, lenses: [] }]
			: [name, { accessible: true, lenses: [] }],
	);
	return Object.fromEntries(entries) as Readonly<
		Record<LifecyclePhaseName, LifecyclePhase>
	>;
}

const ALL_OPENABLE: ReadonlyArray<Station['standing']> = [
	'openable',
	'openable',
	'openable',
	'openable',
	'openable',
];
const ALL_BARE: ReadonlyArray<Station['standing']> = [
	'bare',
	'bare',
	'bare',
	'bare',
	'bare',
];

const AST_BREAK: StageCause = {
	stage: 'ast',
	message: 'Unexpected token (2:8).',
};
const TOKENS_BREAK: StageCause = {
	stage: 'tokens',
	message: 'Invalid or unexpected token.',
};
const ENTWINED_BREAK: StageCause = {
	stage: 'entwined',
	message: 'the syntax tree does not span its source.',
};

describe.skip('deriveCaption', () => {
	describe('every phase served and none barred (Zero)', () => {
		it('the caption holds nothing', () => {
			expect(
				deriveCaption(buildStations(ALL_OPENABLE), buildStudy()).holds,
			).toBe('nothing');
		});
	});

	describe('one accessible phase is empty (One)', () => {
		it('the caption holds the count line', () => {
			const stations = buildStations([
				'openable',
				'bare',
				'openable',
				'openable',
				'openable',
			]);
			expect(deriveCaption(stations, buildStudy()).holds).toBe('count');
		});

		it('the count reads one', () => {
			const stations = buildStations([
				'openable',
				'bare',
				'openable',
				'openable',
				'openable',
			]);
			const caption = deriveCaption(stations, buildStudy());
			expect(caption.holds === 'count' && caption.empty).toBe(1);
		});
	});

	describe('several accessible phases are empty (Many)', () => {
		it('the count reads how many stand bare', () => {
			const stations = buildStations([
				'openable',
				'bare',
				'bare',
				'bare',
				'bare',
			]);
			const caption = deriveCaption(stations, buildStudy());
			expect(caption.holds === 'count' && caption.empty).toBe(4);
		});
	});

	describe('a barring edge is drawn (Boundaries)', () => {
		it('the cause line takes the caption', () => {
			const stations = buildStations([
				'openable',
				'bare',
				'waiting',
				'waiting',
				'waiting',
			]);
			const study = buildStudy({
				phases: ['ast', 'environment', 'evaluation'],
				cause: TOKENS_BREAK,
			});
			expect(deriveCaption(stations, study).holds).toBe('cause');
		});

		it('the count line does not render even with a bare station present', () => {
			const stations = buildStations([
				'openable',
				'bare',
				'waiting',
				'waiting',
				'waiting',
			]);
			const study = buildStudy({
				phases: ['ast', 'environment', 'evaluation'],
				cause: TOKENS_BREAK,
			});
			expect(deriveCaption(stations, study)).not.toHaveProperty('empty');
		});

		it('the unreached count counts what waits, not what is empty', () => {
			const stations = buildStations([
				'openable',
				'bare',
				'waiting',
				'waiting',
				'waiting',
			]);
			const study = buildStudy({
				phases: ['ast', 'environment', 'evaluation'],
				cause: TOKENS_BREAK,
			});
			const caption = deriveCaption(stations, study);
			expect(caption.holds === 'cause' && caption.unreached).toBe(3);
		});

		it('an ast break leaves two waiting rather than three', () => {
			const stations = buildStations([
				'openable',
				'bare',
				'bare',
				'waiting',
				'waiting',
			]);
			const study = buildStudy({
				phases: ['environment', 'evaluation'],
				cause: AST_BREAK,
			});
			const caption = deriveCaption(stations, study);
			expect(caption.holds === 'cause' && caption.unreached).toBe(2);
		});

		it('an environment-staged cause bars nothing, so the count line still renders', () => {
			const stations = buildStations([
				'openable',
				'bare',
				'bare',
				'bare',
				'bare',
			]);
			expect(deriveCaption(stations, buildStudy()).holds).toBe('count');
		});
	});

	describe('the two arms differ in shape (Interfaces)', () => {
		it('the cause arm carries its cause and its unreached count', () => {
			const stations = buildStations([
				'openable',
				'bare',
				'bare',
				'waiting',
				'waiting',
			]);
			const study = buildStudy({
				phases: ['environment', 'evaluation'],
				cause: AST_BREAK,
			});
			expect(
				Object.keys(deriveCaption(stations, study)).toSorted((left, right) =>
					left.localeCompare(right),
				),
			).toEqual(['cause', 'holds', 'unreached']);
		});

		it('the count arm carries one count and nothing else', () => {
			const stations = buildStations([
				'openable',
				'bare',
				'bare',
				'bare',
				'bare',
			]);
			expect(
				Object.keys(deriveCaption(stations, buildStudy())).toSorted(
					(left, right) => left.localeCompare(right),
				),
			).toEqual(['empty', 'holds']);
		});

		it('the empty caption carries no arm at all', () => {
			expect(
				Object.keys(deriveCaption(buildStations(ALL_OPENABLE), buildStudy())),
			).toEqual(['holds']);
		});
	});

	describe('the stage crosses the boundary (Exceptions)', () => {
		it('carries the machine s own message unrewritten', () => {
			const stations = buildStations([
				'openable',
				'bare',
				'bare',
				'waiting',
				'waiting',
			]);
			const study = buildStudy({
				phases: ['environment', 'evaluation'],
				cause: AST_BREAK,
			});
			const caption = deriveCaption(stations, study);
			expect(caption.holds === 'cause' && caption.cause.message).toBe(
				'Unexpected token (2:8).',
			);
		});

		it('an ast break and an entwined break over the same barred set differ in stage', () => {
			const stations = buildStations([
				'openable',
				'bare',
				'bare',
				'waiting',
				'waiting',
			]);
			const barredPhases: ReadonlyArray<LifecyclePhaseName> = [
				'environment',
				'evaluation',
			];
			const fromAst = deriveCaption(
				stations,
				buildStudy({ phases: barredPhases, cause: AST_BREAK }),
			);
			const fromEntwined = deriveCaption(
				stations,
				buildStudy({ phases: barredPhases, cause: ENTWINED_BREAK }),
			);
			expect([
				fromAst.holds === 'cause' && fromAst.cause.stage,
				fromEntwined.holds === 'cause' && fromEntwined.cause.stage,
			]).toEqual(['ast', 'entwined']);
		});
	});

	describe('what it owns (Simple)', () => {
		it('freezes the caption', () => {
			expect(
				Object.isFrozen(deriveCaption(buildStations(ALL_BARE), buildStudy())),
			).toBe(true);
		});
	});
});
