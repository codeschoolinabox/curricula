// Declared untested, with its reason (the sibling browser suite's own
// pattern): the omitted-`seconds` fallback path in evaluate.ts is not
// behaviorally exercised here or anywhere in the suite — every timeout
// row passes an explicit budget, and this suite carries no fake-timer
// infrastructure. The one-source-of-the-number guarantee is checked
// structurally at review (evaluate.ts carries only the import and its
// use sites, never a second `= 5` declaration), and each evaluator's
// echo test asserts against this import rather than a retyped literal.
import { describe, expect, it } from 'vitest';

import DEFAULT_SECONDS from '../default-seconds.js';

describe('DEFAULT_SECONDS', () => {
	it('is the machinery-owned budget — 5 seconds', () => {
		expect(DEFAULT_SECONDS).toBe(5);
	});
});
