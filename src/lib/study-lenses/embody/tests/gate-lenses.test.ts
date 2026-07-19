import { afterEach, describe, expect, it, vi } from 'vitest';

import deriveFacts from '../derive-facts.js';
import gateLenses from '../gate-lenses.js';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('gateLenses', () => {
	describe('an empty roster', () => {
		it('fits nothing', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			expect(gateLenses(facts, [])).toEqual([]);
		});
	});

	describe('one fitting lens', () => {
		it('comes back by reference', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			const lens = {
				name: 'variables',
				applicability: () => true,
				phase: 'ast',
			} as const;
			expect(gateLenses(facts, [lens])[0]).toBe(lens);
		});
	});

	describe('many fitting lenses', () => {
		it('every fitting lens comes back', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			const flowchart = {
				name: 'flowchart',
				applicability: () => true,
				phase: 'ast',
			} as const;
			const stepper = {
				name: 'stepper',
				applicability: () => true,
				phase: 'evaluation',
			} as const;
			expect(gateLenses(facts, [flowchart, stepper])).toHaveLength(2);
		});

		it('roster order is preserved', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			const flowchart = {
				name: 'flowchart',
				applicability: () => true,
				phase: 'ast',
			} as const;
			const stepper = {
				name: 'stepper',
				applicability: () => true,
				phase: 'evaluation',
			} as const;
			const fitting = gateLenses(facts, [flowchart, stepper]);
			expect(fitting[0] === flowchart && fitting[1] === stepper).toBe(true);
		});
	});

	describe('a mixed roster', () => {
		it('only the fitting phase-declaring lens comes back', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			const highlight = {
				name: 'highlight',
				applicability: () => true,
				phase: 'tokens',
			} as const;
			const outline = {
				name: 'outline',
				applicability: () => false,
				phase: 'ast',
			} as const;
			const scratch = { name: 'scratch', applicability: () => true } as const;
			const fitting = gateLenses(facts, [highlight, outline, scratch]);
			expect(fitting.length === 1 && fitting[0] === highlight).toBe(true);
		});

		it('a panel-excluded lens is never consulted', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			const gate = vi.fn(() => true);
			const scratch = { name: 'scratch', applicability: gate } as const;
			gateLenses(facts, [scratch]);
			expect(gate).not.toHaveBeenCalled();
		});

		it('a fitting gate runs exactly once', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			const gate = vi.fn(() => true);
			const spotlight = {
				name: 'spotlight',
				applicability: gate,
				phase: 'source',
			} as const;
			gateLenses(facts, [spotlight]);
			expect(gate).toHaveBeenCalledTimes(1);
		});

		it('a gate receives the very Facts', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			const gate = vi.fn(() => true);
			const spotlight = {
				name: 'spotlight',
				applicability: gate,
				phase: 'source',
			} as const;
			gateLenses(facts, [spotlight]);
			expect(gate).toHaveBeenCalledWith(facts);
		});

		it('a multi-phase lens gates once, not per phase', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			const gate = vi.fn(() => true);
			const twin = {
				name: 'twin',
				applicability: gate,
				phase: ['ast', 'environment'],
			} as const;
			gateLenses(facts, [twin]);
			expect(gate).toHaveBeenCalledTimes(1);
		});
	});

	describe('a throwing gate', () => {
		it('is treated as not applicable', () => {
			vi.spyOn(console, 'error').mockImplementation(() => {});
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			const broken = {
				name: 'broken',
				applicability: () => {
					throw new Error('gate defect');
				},
				phase: 'ast',
			} as const;
			expect(gateLenses(facts, [broken])).toEqual([]);
		});

		it('is loud — reported once', () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			const broken = {
				name: 'broken',
				applicability: () => {
					throw new Error('gate defect');
				},
				phase: 'ast',
			} as const;
			gateLenses(facts, [broken]);
			expect(errorSpy).toHaveBeenCalledTimes(1);
		});

		it('the report names the lens', () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			const broken = {
				name: 'broken',
				applicability: () => {
					throw new Error('gate defect');
				},
				phase: 'ast',
			} as const;
			gateLenses(facts, [broken]);
			expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('broken'));
		});

		it('a non-throwing sibling still fits', () => {
			vi.spyOn(console, 'error').mockImplementation(() => {});
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			const broken = {
				name: 'broken',
				applicability: () => {
					throw new Error('gate defect');
				},
				phase: 'ast',
			} as const;
			const steady = {
				name: 'steady',
				applicability: () => true,
				phase: 'tokens',
			} as const;
			expect(gateLenses(facts, [broken, steady])[0]).toBe(steady);
		});

		it('two throwing gates report independently', () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			const first = {
				name: 'first-broken',
				applicability: () => {
					throw new Error('one');
				},
				phase: 'ast',
			} as const;
			const second = {
				name: 'second-broken',
				applicability: () => {
					throw new Error('two');
				},
				phase: 'tokens',
			} as const;
			gateLenses(facts, [first, second]);
			expect(errorSpy).toHaveBeenCalledTimes(2);
		});

		it('each report names its own lens', () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			const first = {
				name: 'first-broken',
				applicability: () => {
					throw new Error('one');
				},
				phase: 'ast',
			} as const;
			const second = {
				name: 'second-broken',
				applicability: () => {
					throw new Error('two');
				},
				phase: 'tokens',
			} as const;
			gateLenses(facts, [first, second]);
			expect(errorSpy).toHaveBeenCalledWith(
				expect.stringContaining('second-broken'),
			);
		});
	});

	describe('clean gating', () => {
		it('reports nothing', () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			const quiet = {
				name: 'quiet',
				applicability: () => true,
				phase: 'ast',
			} as const;
			gateLenses(facts, [quiet]);
			expect(errorSpy).toHaveBeenCalledTimes(0);
		});
	});
});
