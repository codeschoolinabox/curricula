import { describe, expect, it } from 'vitest';

import refuseMissingCapability from '../refuse-missing-capability.js';

describe('refuseMissingCapability — node tier', () => {
	it('refuses naming the worker (this tier has no Worker global)', () => {
		const refusal = refuseMissingCapability('run');
		expect(refusal?.reason).toBe(
			'run needs a Worker (this looks like server-side rendering or plain Node) to sandbox a program; this environment has none',
		);
	});
});
