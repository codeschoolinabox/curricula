// @vitest-environment node

import { describe, expect, it } from 'vitest';

import type { Facts } from '../../../embody/types.js';
import type { EvaluationSpec } from '../../types.js';
import danger from '../index.js';

function specFor(code: string): EvaluationSpec {
	const facts = { source: { ok: true, value: code } } as unknown as Facts;
	return { facts, execution: 'function' };
}

describe('danger evaluator (node — no document)', () => {
	it('applicability is permissive and pure (no ambient environment read)', () => {
		expect(danger.applicability(specFor('1 + 1;'))).toBe(true);
	});

	it('main refuses as data when no document exists (server-side), never throwing', () => {
		const result = danger.main(specFor('1 + 1;'));
		expect(result).toHaveProperty('refused', true);
		// The reason is in danger's own words — a non-empty string, not a throw.
		if ('refused' in result) {
			expect(typeof result.reason).toBe('string');
			expect(result.reason.length).toBeGreaterThan(0);
		}
	});
});
