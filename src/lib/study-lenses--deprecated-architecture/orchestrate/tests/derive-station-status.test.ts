import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import type { EmbodyError, Status } from '../../../embody/types.js';
import deriveStationStatus from '../derive-station-status.js';
import STATIONS from '../stations.js';

describe('deriveStationStatus', () => {
	describe('Zero — the clean apex staircase', () => {
		it('reports the full map for an apex snippet (evaluation stays pending statically)', () => {
			const { status, errors } = embody('OK');
			expect(deriveStationStatus(status, errors)).toEqual({
				source: 'constant',
				realm: 'constant',
				parse: 'ok',
				creation: 'ok',
				evaluation: 'pending',
			});
		});

		it('derives its keys from the canonical station order', () => {
			const { status, errors } = embody('OK');
			expect(Object.keys(deriveStationStatus(status, errors))).toEqual(
				STATIONS,
			);
		});
	});

	describe('One — a parse failure bars every downstream machine stage', () => {
		it('reports parse errored with creation and evaluation barred', () => {
			const { status, errors } = embody('FAIL_AT_PARSE');
			expect(deriveStationStatus(status, errors)).toEqual({
				source: 'constant',
				realm: 'constant',
				parse: 'errored',
				creation: 'barred',
				evaluation: 'barred',
			});
		});
	});

	describe('Fold — tokenize-fail maps to the same parse station as ast-fail (regression pin, not triangulation)', () => {
		it('reports the identical map for a tokenize failure', () => {
			const { status, errors } = embody('FAIL_AT_TOKENIZE');
			expect(deriveStationStatus(status, errors)).toEqual({
				source: 'constant',
				realm: 'constant',
				parse: 'errored',
				creation: 'barred',
				evaluation: 'barred',
			});
		});
	});

	describe('Many — a creation failure bars evaluation only', () => {
		it('reports parse ok, creation errored, evaluation barred', () => {
			const { status, errors } = embody('FAIL_AT_CREATE');
			expect(deriveStationStatus(status, errors)).toEqual({
				source: 'constant',
				realm: 'constant',
				parse: 'ok',
				creation: 'errored',
				evaluation: 'barred',
			});
		});
	});

	describe('Boundaries — a validation error never bars (non-admission hides via availability, not here)', () => {
		it('reports pending, not barred, downstream of a validation refusal', () => {
			const { status, errors } = embody('VALIDATION_FAIL');
			expect(deriveStationStatus(status, errors)).toEqual({
				source: 'constant',
				realm: 'constant',
				parse: 'ok',
				creation: 'pending',
				evaluation: 'pending',
			});
		});
	});

	describe('Honest under stubs — clean real code stays pending (STUB-COUPLED: flips to ok when the creation slice lands; edit this test then)', () => {
		it('reports creation pending, never ok, on un-instrumented real code', () => {
			const { status, errors } = embody('let x = 1;');
			expect(deriveStationStatus(status, errors)).toEqual({
				source: 'constant',
				realm: 'constant',
				parse: 'ok',
				creation: 'pending',
				evaluation: 'pending',
			});
		});
	});

	describe('Interfaces — the static evaluation-error cell (inline literal; no scenario carries a snippet-level evaluation error today)', () => {
		it('reports evaluation errored with upstream stations intact', () => {
			const apexStatus: Status = {
				tokenized: true,
				parsed: true,
				validated: true,
				created: true,
			};
			const evaluationError: EmbodyError = {
				phase: 'evaluation',
				kind: 'RangeError',
				message: 'boom',
				loc: null,
			};
			expect(deriveStationStatus(apexStatus, evaluationError)).toEqual({
				source: 'constant',
				realm: 'constant',
				parse: 'ok',
				creation: 'ok',
				evaluation: 'errored',
			});
		});
	});

	describe('Simple — frozen output', () => {
		it('freezes the status map', () => {
			const { status, errors } = embody('OK');
			expect(Object.isFrozen(deriveStationStatus(status, errors))).toBe(true);
		});
	});
});
