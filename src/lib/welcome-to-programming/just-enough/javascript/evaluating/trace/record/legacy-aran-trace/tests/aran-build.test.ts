import { describe, expect, it } from 'vitest';

describe('aran-build', () => {
	describe('globalThis attachment', () => {
		it('does not throw when imported in a non-browser environment', async () => {
			await expect(import('../aran-build.js')).resolves.not.toThrow();
		});

		it('attaches Aran to globalThis', async () => {
			await import('../aran-build.js');

			expect(globalThis.Aran).toBeDefined();
		});

		it('attaches Acorn to globalThis', async () => {
			await import('../aran-build.js');

			expect(globalThis.Acorn).toBeDefined();
		});

		it('attaches Astring to globalThis', async () => {
			await import('../aran-build.js');

			expect(globalThis.Astring).toBeDefined();
		});
	});
});
