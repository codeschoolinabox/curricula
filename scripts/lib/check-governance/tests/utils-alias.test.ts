import { describe, expect, it } from 'vitest';
import resolveUtilsAlias from '../utils-alias.mjs';

describe('resolveUtilsAlias', () => {
	it('resolves an alias reference against the real target', () => {
		expect(resolveUtilsAlias('@utils/freeze-in-place.js')).toBe(
			'src/lib/utils/freeze-in-place.js',
		);
	});

	it('resolves the bare alias directory', () => {
		expect(resolveUtilsAlias('@utils/')).toBe('src/lib/utils/');
	});

	it('returns null for non-alias words', () => {
		expect(resolveUtilsAlias('src/lib/utils/freeze-in-place.ts')).toBeNull();
	});
});
