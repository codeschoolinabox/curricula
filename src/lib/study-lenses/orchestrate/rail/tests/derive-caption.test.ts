import { describe, expect, it } from 'vitest';

import type { LifecyclePhaseName, StageCause } from '../../../embody/types.js';
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
		if (standing === 'openable') {
			return {
				phase,
				standing,
				tray: [{ lens: 'parsons', label: 'rebuild the order' }] as const,
			};
		}
		return { phase, standing };
	});
}

const ALL_OPENABLE: ReadonlyArray<Station['standing']> = [
	'openable',
	'openable',
	'openable',
	'openable',
	'openable',
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
const TOKENS_BARRED = buildStations([
	'openable',
	'bare',
	'waiting',
	'waiting',
	'waiting',
]);
const AST_BARRED = buildStations([
	'openable',
	'bare',
	'bare',
	'waiting',
	'waiting',
]);

describe.skip('deriveCaption', () => {
	describe('every phase served and none barred (Zero)', () => {
		it('the caption holds nothing', () => {
			expect(deriveCaption(buildStations(ALL_OPENABLE), null).holds).toBe(
				'nothing',
			);
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
			expect(deriveCaption(stations, null).holds).toBe('count');
		});

		it('the count reads one', () => {
			const stations = buildStations([
				'openable',
				'bare',
				'openable',
				'openable',
				'openable',
			]);
			const caption = deriveCaption(stations, null);
			expect(caption.holds === 'count' && caption.empty).toBe(1);
		});
	});

	describe('several accessible phases are empty (Many)', () => {
		it('the count reads how many stations stand bare', () => {
			const stations = buildStations([
				'openable',
				'bare',
				'bare',
				'bare',
				'bare',
			]);
			const caption = deriveCaption(stations, null);
			expect(caption.holds === 'count' && caption.empty).toBe(4);
		});
	});

	describe('a barring edge is drawn (Boundaries)', () => {
		it('the cause line takes the caption', () => {
			expect(deriveCaption(TOKENS_BARRED, TOKENS_BREAK).holds).toBe('cause');
		});

		it('the count line does not render even with a bare station present', () => {
			expect(deriveCaption(TOKENS_BARRED, TOKENS_BREAK)).not.toHaveProperty(
				'empty',
			);
		});

		it('the unreached count counts what waits, not what is empty', () => {
			const caption = deriveCaption(TOKENS_BARRED, TOKENS_BREAK);
			expect(caption.holds === 'cause' && caption.unreached).toBe(3);
		});

		it('an ast break leaves two waiting rather than three', () => {
			const caption = deriveCaption(AST_BARRED, AST_BREAK);
			expect(caption.holds === 'cause' && caption.unreached).toBe(2);
		});
	});

	describe('the two arms differ in shape (Interfaces)', () => {
		it('the cause arm carries its cause and its unreached count', () => {
			expect(
				Object.keys(deriveCaption(AST_BARRED, AST_BREAK)).toSorted(
					(left, right) => left.localeCompare(right),
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
				Object.keys(deriveCaption(stations, null)).toSorted((left, right) =>
					left.localeCompare(right),
				),
			).toEqual(['empty', 'holds']);
		});

		it('the empty caption carries no arm at all', () => {
			expect(
				Object.keys(deriveCaption(buildStations(ALL_OPENABLE), null)),
			).toEqual(['holds']);
		});
	});

	describe('the stage crosses the boundary (Exceptions)', () => {
		it('carries the machine own message unrewritten', () => {
			const caption = deriveCaption(AST_BARRED, AST_BREAK);
			expect(caption.holds === 'cause' && caption.cause.message).toBe(
				'Unexpected token (2:8).',
			);
		});

		it('an ast break and an entwined break over the same standings differ in stage', () => {
			const fromAst = deriveCaption(AST_BARRED, AST_BREAK);
			const fromEntwined = deriveCaption(AST_BARRED, ENTWINED_BREAK);
			expect([
				fromAst.holds === 'cause' && fromAst.cause.stage,
				fromEntwined.holds === 'cause' && fromEntwined.cause.stage,
			]).toEqual(['ast', 'entwined']);
		});

		it('throws when a barring edge is drawn and no cause arrives', () => {
			expect(() => deriveCaption(AST_BARRED, null)).toThrow();
		});

		it('throws when a cause arrives and no station waits', () => {
			const stations = buildStations([
				'openable',
				'bare',
				'bare',
				'bare',
				'bare',
			]);
			expect(() => deriveCaption(stations, AST_BREAK)).toThrow();
		});

		it('throws when the waiting suffix is outside the unreached count domain', () => {
			const stations = buildStations([
				'openable',
				'bare',
				'bare',
				'bare',
				'waiting',
			]);
			expect(() => deriveCaption(stations, AST_BREAK)).toThrow();
		});
	});

	describe('what it owns (Simple)', () => {
		it('freezes the caption', () => {
			const stations = buildStations([
				'openable',
				'bare',
				'bare',
				'bare',
				'bare',
			]);
			expect(Object.isFrozen(deriveCaption(stations, null))).toBe(true);
		});
	});
});
