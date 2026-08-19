import { describe, expect, it } from 'vitest';

import refuseMissingCapability from '../refuse-missing-capability.js';

describe('refuseMissingCapability — browser tier', () => {
	it('does not refuse where Worker and shared memory both exist', () => {
		expect(refuseMissingCapability('run')).toBeNull();
	});
});
