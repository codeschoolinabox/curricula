import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
	Embodiment,
	LifecyclePhase,
	LifecyclePhaseName,
} from '../../../../embody/types.js';
import type { Lens } from '../../../../lenses/types.js';
import honorFocusRequest from '../honor-focus-request.js';

function buildStudy(
	overrides: Partial<Record<LifecyclePhaseName, LifecyclePhase>> = {},
): Embodiment['study'] {
	return {
		source: { accessible: true, lenses: [] },
		tokens: { accessible: true, lenses: [] },
		ast: { accessible: true, lenses: [] },
		environment: { accessible: true, lenses: [] },
		evaluation: { accessible: true, lenses: [] },
		...overrides,
	};
}

describe('honorFocusRequest', () => {
	afterEach(() => vi.restoreAllMocks());

	describe('Zero — no focus request', () => {
		it('resolves to the fallback when no lens is requested', () => {
			const embodiment: Embodiment = {
				facts: {
					source: { ok: true, value: '' },
					type: { ok: true, value: 'module' },
					tokens: {
						ok: false,
						cause: { stage: 'tokens', message: 'unparsed' },
					},
					ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
					entwined: {
						ok: false,
						cause: { stage: 'entwined', message: 'unparsed' },
					},
					environment: {
						ok: false,
						cause: { stage: 'environment', message: 'unparsed' },
					},
				},
				study: buildStudy(),
			};

			expect(honorFocusRequest({ roster: [], embodiment })).toEqual({
				kind: 'fallback',
			});
		});

		it('resolves to the fallback when no lens is requested, even over a populated roster', () => {
			const lens: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
				phase: 'ast',
			};
			const embodiment: Embodiment = {
				facts: {
					source: { ok: true, value: '' },
					type: { ok: true, value: 'module' },
					tokens: {
						ok: false,
						cause: { stage: 'tokens', message: 'unparsed' },
					},
					ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
					entwined: {
						ok: false,
						cause: { stage: 'entwined', message: 'unparsed' },
					},
					environment: {
						ok: false,
						cause: { stage: 'environment', message: 'unparsed' },
					},
				},
				study: buildStudy({ ast: { accessible: true, lenses: [lens] } }),
			};

			expect(honorFocusRequest({ roster: [lens], embodiment })).toEqual({
				kind: 'fallback',
			});
		});
	});

	describe('One — a single requested lens', () => {
		describe('phase-declaring, attached to an accessible phase', () => {
			it('honors it in that phase, carrying the lens', () => {
				const lens: Lens = {
					name: 'highlight',
					label: 'highlight',
					applicability: () => true,
					main: () => null,
					phase: 'ast',
				};
				const embodiment: Embodiment = {
					facts: {
						source: { ok: true, value: '' },
						type: { ok: true, value: 'module' },
						tokens: {
							ok: false,
							cause: { stage: 'tokens', message: 'unparsed' },
						},
						ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
						entwined: {
							ok: false,
							cause: { stage: 'entwined', message: 'unparsed' },
						},
						environment: {
							ok: false,
							cause: { stage: 'environment', message: 'unparsed' },
						},
					},
					study: buildStudy({ ast: { accessible: true, lenses: [lens] } }),
				};

				expect(
					honorFocusRequest({
						request: 'highlight',
						roster: [lens],
						embodiment,
					}),
				).toEqual({ kind: 'honored-in-phase', lens, phase: 'ast' });
			});
		});

		describe('phase-declaring, applicability never consulted', () => {
			it('honors it in phase even when its own applicability would refuse', () => {
				const applicability = vi.fn(() => false);
				const lens: Lens = {
					name: 'highlight',
					label: 'highlight',
					applicability,
					main: () => null,
					phase: 'ast',
				};
				const embodiment: Embodiment = {
					facts: {
						source: { ok: true, value: '' },
						type: { ok: true, value: 'module' },
						tokens: {
							ok: false,
							cause: { stage: 'tokens', message: 'unparsed' },
						},
						ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
						entwined: {
							ok: false,
							cause: { stage: 'entwined', message: 'unparsed' },
						},
						environment: {
							ok: false,
							cause: { stage: 'environment', message: 'unparsed' },
						},
					},
					study: buildStudy({ ast: { accessible: true, lenses: [lens] } }),
				};

				expect(
					honorFocusRequest({
						request: 'highlight',
						roster: [lens],
						embodiment,
					}),
				).toEqual({ kind: 'honored-in-phase', lens, phase: 'ast' });
			});

			it('never invokes the applicability on the phase-declaring path', () => {
				const applicability = vi.fn(() => false);
				const lens: Lens = {
					name: 'highlight',
					label: 'highlight',
					applicability,
					main: () => null,
					phase: 'ast',
				};
				const embodiment: Embodiment = {
					facts: {
						source: { ok: true, value: '' },
						type: { ok: true, value: 'module' },
						tokens: {
							ok: false,
							cause: { stage: 'tokens', message: 'unparsed' },
						},
						ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
						entwined: {
							ok: false,
							cause: { stage: 'entwined', message: 'unparsed' },
						},
						environment: {
							ok: false,
							cause: { stage: 'environment', message: 'unparsed' },
						},
					},
					study: buildStudy({ ast: { accessible: true, lenses: [lens] } }),
				};

				honorFocusRequest({ request: 'highlight', roster: [lens], embodiment });

				expect(applicability).not.toHaveBeenCalled();
			});
		});

		describe('panel-excluded, applicability holds at mount', () => {
			it('honors it panel-excluded, carrying the lens', () => {
				const lens: Lens = {
					name: 'inspect',
					label: 'inspect',
					applicability: () => true,
					main: () => null,
				};
				const embodiment: Embodiment = {
					facts: {
						source: { ok: true, value: '' },
						type: { ok: true, value: 'module' },
						tokens: {
							ok: false,
							cause: { stage: 'tokens', message: 'unparsed' },
						},
						ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
						entwined: {
							ok: false,
							cause: { stage: 'entwined', message: 'unparsed' },
						},
						environment: {
							ok: false,
							cause: { stage: 'environment', message: 'unparsed' },
						},
					},
					study: buildStudy(),
				};

				expect(
					honorFocusRequest({ request: 'inspect', roster: [lens], embodiment }),
				).toEqual({ kind: 'honored-panel-excluded', lens });
			});
		});
	});

	describe('Many — several phases, several lenses', () => {
		it('mounts at the first accessible phase in its own declared order', () => {
			const lens: Lens = {
				name: 'trace',
				label: 'trace',
				applicability: () => true,
				main: () => null,
				phase: ['environment', 'ast'],
			};
			const embodiment: Embodiment = {
				facts: {
					source: { ok: true, value: '' },
					type: { ok: true, value: 'module' },
					tokens: {
						ok: false,
						cause: { stage: 'tokens', message: 'unparsed' },
					},
					ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
					entwined: {
						ok: false,
						cause: { stage: 'entwined', message: 'unparsed' },
					},
					environment: {
						ok: false,
						cause: { stage: 'environment', message: 'unparsed' },
					},
				},
				study: buildStudy({
					ast: { accessible: true, lenses: [lens] },
					environment: { accessible: true, lenses: [lens] },
				}),
			};

			expect(
				honorFocusRequest({ request: 'trace', roster: [lens], embodiment }),
			).toEqual({ kind: 'honored-in-phase', lens, phase: 'environment' });
		});

		it('skips a barred declared phase for the next accessible one', () => {
			const lens: Lens = {
				name: 'trace',
				label: 'trace',
				applicability: () => true,
				main: () => null,
				phase: ['ast', 'environment'],
			};
			const embodiment: Embodiment = {
				facts: {
					source: { ok: true, value: '' },
					type: { ok: true, value: 'module' },
					tokens: {
						ok: false,
						cause: { stage: 'tokens', message: 'unparsed' },
					},
					ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
					entwined: {
						ok: false,
						cause: { stage: 'entwined', message: 'unparsed' },
					},
					environment: {
						ok: false,
						cause: { stage: 'environment', message: 'unparsed' },
					},
				},
				study: buildStudy({
					ast: {
						accessible: false,
						cause: { stage: 'tokens', message: 'unparsed' },
						lenses: [lens],
					},
					environment: { accessible: true, lenses: [lens] },
				}),
			};

			expect(
				honorFocusRequest({ request: 'trace', roster: [lens], embodiment }),
			).toEqual({ kind: 'honored-in-phase', lens, phase: 'environment' });
		});

		it('falls back when every declared phase is barred or unattached', () => {
			const lens: Lens = {
				name: 'trace',
				label: 'trace',
				applicability: () => true,
				main: () => null,
				phase: ['ast', 'environment'],
			};
			const embodiment: Embodiment = {
				facts: {
					source: { ok: true, value: '' },
					type: { ok: true, value: 'module' },
					tokens: {
						ok: false,
						cause: { stage: 'tokens', message: 'unparsed' },
					},
					ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
					entwined: {
						ok: false,
						cause: { stage: 'entwined', message: 'unparsed' },
					},
					environment: {
						ok: false,
						cause: { stage: 'environment', message: 'unparsed' },
					},
				},
				study: buildStudy({
					ast: {
						accessible: false,
						cause: { stage: 'tokens', message: 'unparsed' },
						lenses: [lens],
					},
					environment: { accessible: true, lenses: [] },
				}),
			};

			expect(
				honorFocusRequest({ request: 'trace', roster: [lens], embodiment }),
			).toEqual({ kind: 'fallback' });
		});

		it('finds the requested lens among several in the roster', () => {
			const other: Lens = {
				name: 'other',
				label: 'other',
				applicability: () => true,
				main: () => null,
			};
			const lens: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
				phase: 'ast',
			};
			const embodiment: Embodiment = {
				facts: {
					source: { ok: true, value: '' },
					type: { ok: true, value: 'module' },
					tokens: {
						ok: false,
						cause: { stage: 'tokens', message: 'unparsed' },
					},
					ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
					entwined: {
						ok: false,
						cause: { stage: 'entwined', message: 'unparsed' },
					},
					environment: {
						ok: false,
						cause: { stage: 'environment', message: 'unparsed' },
					},
				},
				study: buildStudy({ ast: { accessible: true, lenses: [lens] } }),
			};

			expect(
				honorFocusRequest({
					request: 'highlight',
					roster: [other, lens],
					embodiment,
				}),
			).toEqual({ kind: 'honored-in-phase', lens, phase: 'ast' });
		});
	});

	describe('Boundaries — graceful fallbacks', () => {
		it('falls back when the requested name is not in the roster', () => {
			const lens: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
				phase: 'ast',
			};
			const embodiment: Embodiment = {
				facts: {
					source: { ok: true, value: '' },
					type: { ok: true, value: 'module' },
					tokens: {
						ok: false,
						cause: { stage: 'tokens', message: 'unparsed' },
					},
					ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
					entwined: {
						ok: false,
						cause: { stage: 'entwined', message: 'unparsed' },
					},
					environment: {
						ok: false,
						cause: { stage: 'environment', message: 'unparsed' },
					},
				},
				study: buildStudy({ ast: { accessible: true, lenses: [lens] } }),
			};

			expect(
				honorFocusRequest({
					request: 'nonexistent',
					roster: [lens],
					embodiment,
				}),
			).toEqual({ kind: 'fallback' });
		});

		it('falls back when a phase-declaring lens is attached only to a barred phase', () => {
			const lens: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
				phase: 'ast',
			};
			const embodiment: Embodiment = {
				facts: {
					source: { ok: true, value: '' },
					type: { ok: true, value: 'module' },
					tokens: {
						ok: false,
						cause: { stage: 'tokens', message: 'unparsed' },
					},
					ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
					entwined: {
						ok: false,
						cause: { stage: 'entwined', message: 'unparsed' },
					},
					environment: {
						ok: false,
						cause: { stage: 'environment', message: 'unparsed' },
					},
				},
				study: buildStudy({
					ast: {
						accessible: false,
						cause: { stage: 'tokens', message: 'unparsed' },
						lenses: [lens],
					},
				}),
			};

			expect(
				honorFocusRequest({ request: 'highlight', roster: [lens], embodiment }),
			).toEqual({ kind: 'fallback' });
		});

		it('falls back when a phase-declaring lens declares an accessible phase it is not attached to', () => {
			const lens: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
				phase: 'ast',
			};
			const embodiment: Embodiment = {
				facts: {
					source: { ok: true, value: '' },
					type: { ok: true, value: 'module' },
					tokens: {
						ok: false,
						cause: { stage: 'tokens', message: 'unparsed' },
					},
					ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
					entwined: {
						ok: false,
						cause: { stage: 'entwined', message: 'unparsed' },
					},
					environment: {
						ok: false,
						cause: { stage: 'environment', message: 'unparsed' },
					},
				},
				study: buildStudy(),
			};

			expect(
				honorFocusRequest({ request: 'highlight', roster: [lens], embodiment }),
			).toEqual({ kind: 'fallback' });
		});

		it('falls back when a panel-excluded lens refuses at mount', () => {
			const lens: Lens = {
				name: 'inspect',
				label: 'inspect',
				applicability: () => false,
				main: () => null,
			};
			const embodiment: Embodiment = {
				facts: {
					source: { ok: true, value: '' },
					type: { ok: true, value: 'module' },
					tokens: {
						ok: false,
						cause: { stage: 'tokens', message: 'unparsed' },
					},
					ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
					entwined: {
						ok: false,
						cause: { stage: 'entwined', message: 'unparsed' },
					},
					environment: {
						ok: false,
						cause: { stage: 'environment', message: 'unparsed' },
					},
				},
				study: buildStudy(),
			};

			expect(
				honorFocusRequest({ request: 'inspect', roster: [lens], embodiment }),
			).toEqual({ kind: 'fallback' });
		});

		it('falls back when a host lens declares a phase name outside the contract', () => {
			const lens: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
				phase: 'asts' as LifecyclePhaseName,
			};
			const embodiment: Embodiment = {
				facts: {
					source: { ok: true, value: '' },
					type: { ok: true, value: 'module' },
					tokens: {
						ok: false,
						cause: { stage: 'tokens', message: 'unparsed' },
					},
					ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
					entwined: {
						ok: false,
						cause: { stage: 'entwined', message: 'unparsed' },
					},
					environment: {
						ok: false,
						cause: { stage: 'environment', message: 'unparsed' },
					},
				},
				study: buildStudy(),
			};

			expect(
				honorFocusRequest({ request: 'highlight', roster: [lens], embodiment }),
			).toEqual({ kind: 'fallback' });
		});

		it('falls back when the attached ref only shares the name, not the reference', () => {
			const impostor: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
				phase: 'ast',
			};
			const lens: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
				phase: 'ast',
			};
			const embodiment: Embodiment = {
				facts: {
					source: { ok: true, value: '' },
					type: { ok: true, value: 'module' },
					tokens: {
						ok: false,
						cause: { stage: 'tokens', message: 'unparsed' },
					},
					ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
					entwined: {
						ok: false,
						cause: { stage: 'entwined', message: 'unparsed' },
					},
					environment: {
						ok: false,
						cause: { stage: 'environment', message: 'unparsed' },
					},
				},
				study: buildStudy({ ast: { accessible: true, lenses: [impostor] } }),
			};

			expect(
				honorFocusRequest({ request: 'highlight', roster: [lens], embodiment }),
			).toEqual({ kind: 'fallback' });
		});

		it('falls back when a lens declares an empty phase list', () => {
			const lens: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
				phase: [],
			};
			const embodiment: Embodiment = {
				facts: {
					source: { ok: true, value: '' },
					type: { ok: true, value: 'module' },
					tokens: {
						ok: false,
						cause: { stage: 'tokens', message: 'unparsed' },
					},
					ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
					entwined: {
						ok: false,
						cause: { stage: 'entwined', message: 'unparsed' },
					},
					environment: {
						ok: false,
						cause: { stage: 'environment', message: 'unparsed' },
					},
				},
				study: buildStudy(),
			};

			expect(
				honorFocusRequest({ request: 'highlight', roster: [lens], embodiment }),
			).toEqual({ kind: 'fallback' });
		});
	});

	describe('Interfaces — applicability runs once, quietly', () => {
		it('runs a panel-excluded lens applicability exactly once at mount', () => {
			const applicability = vi.fn(() => true);
			const lens: Lens = {
				name: 'inspect',
				label: 'inspect',
				applicability,
				main: () => null,
			};
			const embodiment: Embodiment = {
				facts: {
					source: { ok: true, value: '' },
					type: { ok: true, value: 'module' },
					tokens: {
						ok: false,
						cause: { stage: 'tokens', message: 'unparsed' },
					},
					ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
					entwined: {
						ok: false,
						cause: { stage: 'entwined', message: 'unparsed' },
					},
					environment: {
						ok: false,
						cause: { stage: 'environment', message: 'unparsed' },
					},
				},
				study: buildStudy(),
			};

			honorFocusRequest({ request: 'inspect', roster: [lens], embodiment });

			expect(applicability).toHaveBeenCalledTimes(1);
		});

		it('reports nothing on a clean mount', () => {
			const lens: Lens = {
				name: 'inspect',
				label: 'inspect',
				applicability: () => true,
				main: () => null,
			};
			const embodiment: Embodiment = {
				facts: {
					source: { ok: true, value: '' },
					type: { ok: true, value: 'module' },
					tokens: {
						ok: false,
						cause: { stage: 'tokens', message: 'unparsed' },
					},
					ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
					entwined: {
						ok: false,
						cause: { stage: 'entwined', message: 'unparsed' },
					},
					environment: {
						ok: false,
						cause: { stage: 'environment', message: 'unparsed' },
					},
				},
				study: buildStudy(),
			};
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

			honorFocusRequest({ request: 'inspect', roster: [lens], embodiment });

			expect(warn).not.toHaveBeenCalled();
		});
	});

	describe('Exceptions — a throwing applicability', () => {
		it('resolves to the fallback', () => {
			const lens: Lens = {
				name: 'inspect',
				label: 'inspect',
				applicability: () => {
					throw new Error('boom');
				},
				main: () => null,
			};
			const embodiment: Embodiment = {
				facts: {
					source: { ok: true, value: '' },
					type: { ok: true, value: 'module' },
					tokens: {
						ok: false,
						cause: { stage: 'tokens', message: 'unparsed' },
					},
					ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
					entwined: {
						ok: false,
						cause: { stage: 'entwined', message: 'unparsed' },
					},
					environment: {
						ok: false,
						cause: { stage: 'environment', message: 'unparsed' },
					},
				},
				study: buildStudy(),
			};

			vi.spyOn(console, 'warn').mockImplementation(() => {});

			expect(
				honorFocusRequest({ request: 'inspect', roster: [lens], embodiment }),
			).toEqual({ kind: 'fallback' });
		});

		it('does not rethrow', () => {
			const lens: Lens = {
				name: 'inspect',
				label: 'inspect',
				applicability: () => {
					throw new Error('boom');
				},
				main: () => null,
			};
			const embodiment: Embodiment = {
				facts: {
					source: { ok: true, value: '' },
					type: { ok: true, value: 'module' },
					tokens: {
						ok: false,
						cause: { stage: 'tokens', message: 'unparsed' },
					},
					ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
					entwined: {
						ok: false,
						cause: { stage: 'entwined', message: 'unparsed' },
					},
					environment: {
						ok: false,
						cause: { stage: 'environment', message: 'unparsed' },
					},
				},
				study: buildStudy(),
			};

			vi.spyOn(console, 'warn').mockImplementation(() => {});

			expect(() =>
				honorFocusRequest({ request: 'inspect', roster: [lens], embodiment }),
			).not.toThrow();
		});

		it('reports the throw loudly', () => {
			const lens: Lens = {
				name: 'inspect',
				label: 'inspect',
				applicability: () => {
					throw new Error('boom');
				},
				main: () => null,
			};
			const embodiment: Embodiment = {
				facts: {
					source: { ok: true, value: '' },
					type: { ok: true, value: 'module' },
					tokens: {
						ok: false,
						cause: { stage: 'tokens', message: 'unparsed' },
					},
					ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
					entwined: {
						ok: false,
						cause: { stage: 'entwined', message: 'unparsed' },
					},
					environment: {
						ok: false,
						cause: { stage: 'environment', message: 'unparsed' },
					},
				},
				study: buildStudy(),
			};
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

			honorFocusRequest({ request: 'inspect', roster: [lens], embodiment });

			expect(warn).toHaveBeenCalled();
		});
	});

	describe('Simple — the decision leaves frozen', () => {
		it('freezes the returned decision', () => {
			const lens: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
				phase: 'ast',
			};
			const embodiment: Embodiment = {
				facts: {
					source: { ok: true, value: '' },
					type: { ok: true, value: 'module' },
					tokens: {
						ok: false,
						cause: { stage: 'tokens', message: 'unparsed' },
					},
					ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
					entwined: {
						ok: false,
						cause: { stage: 'entwined', message: 'unparsed' },
					},
					environment: {
						ok: false,
						cause: { stage: 'environment', message: 'unparsed' },
					},
				},
				study: buildStudy({ ast: { accessible: true, lenses: [lens] } }),
			};

			const decision = honorFocusRequest({
				request: 'highlight',
				roster: [lens],
				embodiment,
			});

			expect(Object.isFrozen(decision)).toBe(true);
		});

		it('leaves the carried lens ref unfrozen', () => {
			const lens: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
				phase: 'ast',
			};
			const embodiment: Embodiment = {
				facts: {
					source: { ok: true, value: '' },
					type: { ok: true, value: 'module' },
					tokens: {
						ok: false,
						cause: { stage: 'tokens', message: 'unparsed' },
					},
					ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
					entwined: {
						ok: false,
						cause: { stage: 'entwined', message: 'unparsed' },
					},
					environment: {
						ok: false,
						cause: { stage: 'environment', message: 'unparsed' },
					},
				},
				study: buildStudy({ ast: { accessible: true, lenses: [lens] } }),
			};

			honorFocusRequest({ request: 'highlight', roster: [lens], embodiment });

			expect(Object.isFrozen(lens)).toBe(false);
		});
	});
});
