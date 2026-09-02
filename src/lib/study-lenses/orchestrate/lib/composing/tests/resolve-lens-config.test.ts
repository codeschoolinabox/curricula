import { describe, expect, it } from 'vitest';

import type { Lens } from '../../../../lenses/types.js';
import resolveLensConfig from '../resolve-lens-config.js';
import type { ConfigCascade } from '../types.js';

describe('resolveLensConfig', () => {
	describe('no overrides', () => {
		it('empty cascade + a config factory → the factory defaults', () => {
			const highlight: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
				config: (overrides = {}) => ({ theme: 'plain', ...overrides }),
			};
			expect(
				resolveLensConfig(highlight, {
					host: {},
					opened: {},
					learner: {},
				}),
			).toEqual({ theme: 'plain' });
		});

		it('empty cascade + no factory → an empty configuration', () => {
			const highlight: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			expect(
				resolveLensConfig(highlight, {
					host: {},
					opened: {},
					learner: {},
				}),
			).toEqual({});
		});
	});

	describe('one override layer', () => {
		it('a host override reaches the factory over its default', () => {
			const highlight: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
				config: (overrides = {}) => ({ theme: 'plain', ...overrides }),
			};
			expect(
				resolveLensConfig(highlight, {
					host: { highlight: { theme: 'dark' } },
					opened: {},
					learner: {},
				}),
			).toEqual({ theme: 'dark' });
		});
	});

	describe('layer precedence, no factory', () => {
		it('opened wins over host', () => {
			const highlight: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			expect(
				resolveLensConfig(highlight, {
					host: { highlight: { depth: 1 } },
					opened: { highlight: { depth: 2 } },
					learner: {},
				}),
			).toEqual({ depth: 2 });
		});

		it('learner wins over opened', () => {
			const highlight: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			expect(
				resolveLensConfig(highlight, {
					host: {},
					opened: { highlight: { depth: 2 } },
					learner: { highlight: { depth: 3 } },
				}),
			).toEqual({ depth: 3 });
		});

		it('learner wins over host when opened is silent', () => {
			const highlight: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			expect(
				resolveLensConfig(highlight, {
					host: { highlight: { depth: 1 } },
					opened: {},
					learner: { highlight: { depth: 3 } },
				}),
			).toEqual({ depth: 3 });
		});

		it('all three set → learner wins', () => {
			const highlight: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			expect(
				resolveLensConfig(highlight, {
					host: { highlight: { depth: 1 } },
					opened: { highlight: { depth: 2 } },
					learner: { highlight: { depth: 3 } },
				}),
			).toEqual({ depth: 3 });
		});
	});

	describe('per lens name', () => {
		it("another lens's overrides never leak", () => {
			const highlight: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			expect(
				resolveLensConfig(highlight, {
					host: {
						highlight: { depth: 1 },
						outline: { depth: 99 },
					},
					opened: {},
					learner: {},
				}),
			).toEqual({ depth: 1 });
		});
	});

	describe('per-key merging', () => {
		it('different keys from different layers both survive', () => {
			const highlight: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			expect(
				resolveLensConfig(highlight, {
					host: { highlight: { theme: 'dark' } },
					opened: {},
					learner: { highlight: { depth: 2 } },
				}),
			).toEqual({ theme: 'dark', depth: 2 });
		});

		it('the factory receives the merged bag, learner final', () => {
			const highlight: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
				config: (overrides = {}) => ({
					theme: 'plain',
					depth: 0,
					...overrides,
				}),
			};
			expect(
				resolveLensConfig(highlight, {
					host: { highlight: { theme: 'dark', depth: 1 } },
					opened: { highlight: { depth: 2 } },
					learner: { highlight: { depth: 3 } },
				}),
			).toEqual({ theme: 'dark', depth: 3 });
		});
	});

	describe('undefined and null overrides', () => {
		it('an undefined-valued override key is absent', () => {
			const highlight: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			const learnerWithUndefined: ConfigCascade['learner'] = {
				highlight: { depth: undefined },
			};
			expect(
				resolveLensConfig(highlight, {
					host: { highlight: { depth: 1 } },
					opened: {},
					learner: learnerWithUndefined,
				}),
			).toEqual({ depth: 1 });
		});

		it('a null-valued override key is a value', () => {
			const highlight: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			expect(
				resolveLensConfig(highlight, {
					host: { highlight: { depth: 1 } },
					opened: {},
					learner: { highlight: { depth: null } },
				}),
			).toEqual({ depth: null });
		});
	});

	describe('frozen output', () => {
		it('the resolved configuration is frozen, factory path', () => {
			const highlight: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
				config: (overrides = {}) => ({ theme: 'plain', ...overrides }),
			};
			expect(
				Object.isFrozen(
					resolveLensConfig(highlight, {
						host: {},
						opened: {},
						learner: {},
					}),
				),
			).toBe(true);
		});

		it('the resolved configuration is frozen, no-factory path', () => {
			const highlight: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			expect(
				Object.isFrozen(
					resolveLensConfig(highlight, {
						host: { highlight: { depth: 1 } },
						opened: {},
						learner: {},
					}),
				),
			).toBe(true);
		});

		it("a caller's layer record stays unfrozen", () => {
			const highlight: Lens = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			const hostLayer = { highlight: { depth: 1 } };
			resolveLensConfig(highlight, {
				host: hostLayer,
				opened: {},
				learner: {},
			});
			expect(Object.isFrozen(hostLayer.highlight)).toBe(false);
		});
	});
});
