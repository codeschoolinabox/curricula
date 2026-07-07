import { describe, expect, it } from 'vitest';

import type {
	BlockCell,
	BlockLevel,
	CodeQuestion,
} from '../../../orchestrate/lib/socratizing/types.js';
import type { QuizItem } from '../../quizzing/types.js';
import ladder from '../ladder.js';
import type { OrchestratedItem } from '../types.js';

function cellsAt(levels: readonly BlockLevel[]): readonly BlockCell[] {
	return levels.map((level): BlockCell => ({ dimension: 'execution', level }));
}

function closed(
	id: string,
	...levels: readonly BlockLevel[]
): OrchestratedItem {
	return {
		id,
		sourceId: 'quizzing',
		register: 'closed',
		anchorOffsets: [0, 0],
		cells: cellsAt(levels),
		item: {} as unknown as QuizItem,
	};
}

function open(id: string, ...levels: readonly BlockLevel[]): OrchestratedItem {
	return {
		id,
		sourceId: 'socratizing',
		register: 'open',
		anchorOffsets: [0, 0],
		cells: cellsAt(levels),
		question: {} as unknown as CodeQuestion,
	};
}

function withAnchor(
	item: OrchestratedItem,
	anchorOffsets: readonly [number, number],
): OrchestratedItem {
	return { ...item, anchorOffsets };
}

function order(items: readonly OrchestratedItem[]): readonly string[] {
	return ladder(items).map((item) => item.id);
}

describe('ladder', () => {
	describe('Zero', () => {
		it('returns [] for an empty stream', () => {
			expect(ladder([])).toEqual([]);
		});

		it('returns a frozen array for an empty stream', () => {
			expect(Object.isFrozen(ladder([]))).toBe(true);
		});
	});

	describe('One', () => {
		it('returns a single item unchanged', () => {
			expect(order([closed('a', 'atom')])).toEqual(['a']);
		});
	});

	describe('Many', () => {
		it('orders atom before block before relation before macro', () => {
			expect(
				order([
					closed('m', 'macro'),
					closed('r', 'relation'),
					closed('b', 'block'),
					closed('a', 'atom'),
				]),
			).toEqual(['a', 'b', 'r', 'm']);
		});
	});

	describe('multi-cell items rank by their most-concrete level', () => {
		it('a macro-then-atom item outranks a pure-block item (min, not max)', () => {
			expect(
				order([closed('b', 'block'), closed('ma', 'macro', 'atom')]),
			).toEqual(['ma', 'b']);
		});

		it('an atom-then-macro item outranks a pure-block item (min over all cells, either order)', () => {
			expect(
				order([closed('b', 'block'), closed('am', 'atom', 'macro')]),
			).toEqual(['am', 'b']);
		});

		it('a multi-cell item ties a single-cell item of the same most-concrete level', () => {
			expect(
				order([closed('single', 'atom'), closed('multi', 'relation', 'atom')]),
			).toEqual(['single', 'multi']);
		});
	});

	describe('zero-cell items sort last', () => {
		it('an unleveled item follows an atom item', () => {
			expect(order([closed('z'), closed('a', 'atom')])).toEqual(['a', 'z']);
		});

		it('an unleveled item follows even a macro item (last, not tied with the coarsest level)', () => {
			expect(order([closed('z'), closed('m', 'macro')])).toEqual(['m', 'z']);
		});

		it('multiple unleveled items keep their relative order among themselves', () => {
			expect(order([closed('z1'), closed('a', 'atom'), closed('z2')])).toEqual([
				'a',
				'z1',
				'z2',
			]);
		});

		it('a lone unleveled item is returned unchanged', () => {
			expect(order([closed('z')])).toEqual(['z']);
		});
	});

	describe('ties break by original (emission) order, not sourceId or anchor', () => {
		it('keeps the input order for same-level items', () => {
			expect(order([closed('q', 'atom'), open('s', 'atom')])).toEqual([
				'q',
				's',
			]);
		});

		it('keeps the reversed input order for same-level items', () => {
			expect(order([open('s', 'atom'), closed('q', 'atom')])).toEqual([
				's',
				'q',
			]);
		});

		it('keeps input order even when anchor position disagrees', () => {
			expect(
				order([
					withAnchor(open('s', 'atom'), [10, 11]),
					withAnchor(closed('q', 'atom'), [0, 1]),
				]),
			).toEqual(['s', 'q']);
		});
	});

	describe('purity', () => {
		it('does not reorder the input array', () => {
			const input = [closed('m', 'macro'), closed('a', 'atom')];
			ladder(input);
			expect(input.map((item) => item.id)).toEqual(['m', 'a']);
		});

		it('accepts a frozen input array without throwing', () => {
			expect(() =>
				ladder(Object.freeze([closed('m', 'macro'), closed('a', 'atom')])),
			).not.toThrow();
		});
	});

	describe('Interface', () => {
		it('returns a new frozen array', () => {
			expect(Object.isFrozen(ladder([closed('a', 'atom')]))).toBe(true);
		});
	});

	describe('Simple', () => {
		it('is idempotent (a laddered stream re-ladders to the same order)', () => {
			const input = [closed('m', 'macro'), closed('a', 'atom')];
			expect(order(ladder(input))).toEqual(order(input));
		});
	});
});
