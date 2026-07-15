import { describe, expect, it } from 'vitest';

import referenceWorkerSetup from '../testing/reference-worker-setup.js';
import type { WorkerApi } from '../types.js';

const quietApi: WorkerApi = {
	emit() {},
	call() {
		return null;
	},
};

describe('referenceWorkerSetup', () => {
	describe('globals', () => {
		it('injects the emit api as a global', () => {
			const result = referenceWorkerSetup(quietApi, {});

			expect(result.globals['emit']).toBe(quietApi.emit);
		});

		it('injects the call api as a global', () => {
			const result = referenceWorkerSetup(quietApi, {});

			expect(result.globals['call']).toBe(quietApi.call);
		});

		it('injects a getConfig global returning the worker config', () => {
			const result = referenceWorkerSetup(quietApi, { marker: 7 });
			const getConfig = result.globals['getConfig'] as () => unknown;

			expect(getConfig()).toEqual({ marker: 7 });
		});

		it('includes the directed invalid key in the globals', () => {
			const result = referenceWorkerSetup(quietApi, {
				invalidGlobalKey: '1bad',
			});

			expect(Object.keys(result.globals)).toContain('1bad');
		});
	});

	describe('directives', () => {
		it('throws when directed to throw in setup', () => {
			expect(() =>
				referenceWorkerSetup(quietApi, { throwInSetup: true }),
			).toThrow('reference setup throw');
		});

		it('omits the serializer when directed', () => {
			const result = referenceWorkerSetup(quietApi, {
				omitSerializeHalt: true,
			});

			expect(result.serializeHalt).toBeUndefined();
		});

		it('installs directed worker-global state on globalThis', () => {
			referenceWorkerSetup(quietApi, {
				installWorkerGlobal: {
					name: '__referenceSetupTestGlobal',
					value: 'installed',
				},
			});
			const installed = (globalThis as Record<string, unknown>)[
				'__referenceSetupTestGlobal'
			];
			delete (globalThis as Record<string, unknown>)[
				'__referenceSetupTestGlobal'
			];

			expect(installed).toBe('installed');
		});
	});

	describe('halt serializer', () => {
		it('stamps natural ends', () => {
			const result = referenceWorkerSetup(quietApi, {});

			// eslint-disable-next-line unicorn/no-useless-undefined -- the contract pins rawError as undefined on natural ends
			expect(result.serializeHalt?.('natural-end', undefined)).toEqual({
				kind: 'natural-end',
				name: 'natural-end',
				message: '',
				viaReference: true,
			});
		});

		it('carries name and message from a thrown error', () => {
			const result = referenceWorkerSetup(quietApi, {});

			expect(result.serializeHalt?.('throw', new TypeError('boom'))).toEqual({
				kind: 'throw',
				name: 'TypeError',
				message: 'boom',
				viaReference: true,
				isReferenceLimit: false,
			});
		});

		it('classifies a non-Error throw', () => {
			const result = referenceWorkerSetup(quietApi, {});

			expect(result.serializeHalt?.('throw', 'oops')).toEqual({
				kind: 'throw',
				name: 'Error',
				message: 'oops',
				viaReference: true,
				isReferenceLimit: false,
			});
		});

		it('recognizes the reference limit-throw shape', () => {
			const limitError = new Error('limit hit');
			limitError.name = 'ReferenceLimitError';
			const result = referenceWorkerSetup(quietApi, {});
			const payload = result.serializeHalt?.('throw', limitError) as {
				isReferenceLimit: boolean;
			};

			expect(payload.isReferenceLimit).toBe(true);
		});

		it('throws when directed to throw in the serializer', () => {
			const result = referenceWorkerSetup(quietApi, {
				throwInSerializeHalt: true,
			});

			// eslint-disable-next-line unicorn/no-useless-undefined -- the contract pins rawError as undefined on natural ends
			expect(() => result.serializeHalt?.('natural-end', undefined)).toThrow(
				'reference serializer throw',
			);
		});
	});
});
