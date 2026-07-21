import { afterEach, describe, expect, it } from 'vitest';

import referenceWorkerSetup from '../testing/reference-worker-setup.js';
import type { WorkerApi } from '../types.js';

describe('referenceWorkerSetup', () => {
	describe('globals', () => {
		it('treats an absent workerConfig as an empty config', () => {
			const quietApi: WorkerApi = {
				emit() {},
				call() {
					return null;
				},
			};

			// eslint-disable-next-line unicorn/no-useless-undefined -- the absent-config Zero case is the value under test
			const result = referenceWorkerSetup(quietApi, undefined);

			expect(result.globals['emit']).toBe(quietApi.emit);
		});

		it('injects the emit api as a global', () => {
			const quietApi: WorkerApi = {
				emit() {},
				call() {
					return null;
				},
			};

			const result = referenceWorkerSetup(quietApi, {});

			expect(result.globals['emit']).toBe(quietApi.emit);
		});

		it('injects the call api as a global', () => {
			const quietApi: WorkerApi = {
				emit() {},
				call() {
					return null;
				},
			};

			const result = referenceWorkerSetup(quietApi, {});

			expect(result.globals['call']).toBe(quietApi.call);
		});

		it('injects a getConfig global returning the worker config', () => {
			const quietApi: WorkerApi = {
				emit() {},
				call() {
					return null;
				},
			};

			const result = referenceWorkerSetup(quietApi, { marker: 7 });
			const getConfig = result.globals['getConfig'] as () => unknown;

			expect(getConfig()).toEqual({ marker: 7 });
		});

		it('injects a getConfig global returning a different worker config', () => {
			const quietApi: WorkerApi = {
				emit() {},
				call() {
					return null;
				},
			};

			const result = referenceWorkerSetup(quietApi, { other: 'shape' });
			const getConfig = result.globals['getConfig'] as () => unknown;

			expect(getConfig()).toEqual({ other: 'shape' });
		});

		it.each([['1bad'], ['2also-bad']])(
			'includes the directed invalid key %s in the globals',
			(invalidGlobalKey) => {
				const quietApi: WorkerApi = {
					emit() {},
					call() {
						return null;
					},
				};

				const result = referenceWorkerSetup(quietApi, { invalidGlobalKey });

				expect(Object.keys(result.globals)).toContain(invalidGlobalKey);
			},
		);
	});

	describe('directives', () => {
		afterEach(() => {
			delete (globalThis as Record<string, unknown>)[
				'__referenceSetupTestGlobal'
			];
		});

		it('throws when directed to throw in setup', () => {
			const quietApi: WorkerApi = {
				emit() {},
				call() {
					return null;
				},
			};

			expect(() =>
				referenceWorkerSetup(quietApi, { throwInSetup: true }),
			).toThrow('reference setup throw');
		});

		it('omits the serializer when directed', () => {
			const quietApi: WorkerApi = {
				emit() {},
				call() {
					return null;
				},
			};

			const result = referenceWorkerSetup(quietApi, {
				omitSerializeHalt: true,
			});

			expect(result.serializeHalt).toBeUndefined();
		});

		it('installs directed worker-global state on globalThis', () => {
			const quietApi: WorkerApi = {
				emit() {},
				call() {
					return null;
				},
			};

			referenceWorkerSetup(quietApi, {
				installWorkerGlobal: {
					name: '__referenceSetupTestGlobal',
					value: 'installed',
				},
			});

			expect(
				(globalThis as Record<string, unknown>)['__referenceSetupTestGlobal'],
			).toBe('installed');
		});

		it('installs a different directed value on globalThis', () => {
			const quietApi: WorkerApi = {
				emit() {},
				call() {
					return null;
				},
			};

			referenceWorkerSetup(quietApi, {
				installWorkerGlobal: {
					name: '__referenceSetupTestGlobal',
					value: 42,
				},
			});

			expect(
				(globalThis as Record<string, unknown>)['__referenceSetupTestGlobal'],
			).toBe(42);
		});
	});

	describe('halt serializer', () => {
		it('stamps natural ends', () => {
			const quietApi: WorkerApi = {
				emit() {},
				call() {
					return null;
				},
			};

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
			const quietApi: WorkerApi = {
				emit() {},
				call() {
					return null;
				},
			};

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
			const quietApi: WorkerApi = {
				emit() {},
				call() {
					return null;
				},
			};

			const result = referenceWorkerSetup(quietApi, {});

			expect(result.serializeHalt?.('throw', 'oops')).toEqual({
				kind: 'throw',
				name: 'Error',
				message: 'oops',
				viaReference: true,
				isReferenceLimit: false,
			});
		});

		it('coerces a non-string, non-Error throw to its message', () => {
			const quietApi: WorkerApi = {
				emit() {},
				call() {
					return null;
				},
			};

			const result = referenceWorkerSetup(quietApi, {});

			expect(result.serializeHalt?.('throw', 42)).toEqual({
				kind: 'throw',
				name: 'Error',
				message: '42',
				viaReference: true,
				isReferenceLimit: false,
			});
		});

		it('recognizes the reference limit-throw shape', () => {
			const quietApi: WorkerApi = {
				emit() {},
				call() {
					return null;
				},
			};

			const limitError = new Error('limit hit');
			limitError.name = 'ReferenceLimitError';
			const result = referenceWorkerSetup(quietApi, {});
			const payload = result.serializeHalt?.('throw', limitError) as {
				isReferenceLimit: boolean;
			};

			expect(payload.isReferenceLimit).toBe(true);
		});

		it('throws when directed to throw in the serializer', () => {
			const quietApi: WorkerApi = {
				emit() {},
				call() {
					return null;
				},
			};

			const result = referenceWorkerSetup(quietApi, {
				throwInSerializeHalt: true,
			});

			// eslint-disable-next-line unicorn/no-useless-undefined -- the contract pins rawError as undefined on natural ends
			expect(() => result.serializeHalt?.('natural-end', undefined)).toThrow(
				'reference serializer throw',
			);
		});

		it('throws when directed to throw in the serializer, on a throw kind too', () => {
			const quietApi: WorkerApi = {
				emit() {},
				call() {
					return null;
				},
			};

			const result = referenceWorkerSetup(quietApi, {
				throwInSerializeHalt: true,
			});

			expect(() => result.serializeHalt?.('throw', new Error('x'))).toThrow(
				'reference serializer throw',
			);
		});
	});
});
