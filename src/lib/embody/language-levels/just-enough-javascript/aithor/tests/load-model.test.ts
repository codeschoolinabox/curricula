import { describe, it, expect } from 'vitest';

import type {
	LoadedModel,
	LoadResult,
	ModelCatalog,
	Selection,
} from '../../../../../study-lenses/lib/local-llm/types.js';
import makeLoadModel from '../load-model.js';
import type { NextStep, Refusal } from '../types.js';

// Increment 1 — load-model: the loader adapter seam, aithor's value-not-throw
// re-mapping of the injected local-llm runtime's `load`. Each rung injects a fake
// `Pick<LocalLlm,'load'>` ({ load }) and asserts the right Refusal VALUE or a
// ResolvedModel — NEVER a throw, NEVER a leaked rejection. Behavior is asserted
// by discriminant-narrowing ('model' in / 'cause' in) and a recording fake (the
// Selection `load` was called with, or that it was not called at all). The
// catalog only needs `id`, so it is faked through `unknown` (the loader reads no
// other field).

function fakeModel(): LoadedModel {
	return { generate: () => Promise.resolve({ raw: '', code: '' }) };
}

type RecordingRuntime = {
	readonly load: (selection?: Selection) => Promise<LoadResult>;
	readonly calls: ReadonlyArray<Selection | undefined>;
};

function recordingRuntime(result: LoadResult): RecordingRuntime {
	const calls: (Selection | undefined)[] = [];
	return {
		calls,
		load: (selection) => {
			calls.push(selection);
			return Promise.resolve(result);
		},
	};
}

function faultingRuntime(error: Error, sync: boolean): RecordingRuntime {
	const calls: (Selection | undefined)[] = [];
	return {
		calls,
		load: (selection) => {
			calls.push(selection);
			if (sync) throw error;
			return Promise.reject(error);
		},
	};
}

function catalogOf(...ids: readonly string[]): ModelCatalog {
	return ids.map((id) => ({ id })) as unknown as ModelCatalog;
}

describe('makeLoadModel', () => {
	describe('zero — an empty name is the default-pick request', () => {
		it('passes a model-less selection to load and resolves the chosen model', async () => {
			const handle = fakeModel();
			const runtime = recordingRuntime({
				ok: true,
				model: handle,
				resolvedId: 'runtime-chosen-id',
				resolvedRuntime: 'webllm',
			});

			const result = await makeLoadModel(runtime, catalogOf('known-x'))('');

			expect('model' in result).toBe(true);
			if (!('model' in result)) throw new Error('expected a ResolvedModel');
			expect(result.resolvedId).toBe('runtime-chosen-id');

			expect(runtime.calls).toHaveLength(1);
			const [firstCall] = runtime.calls;
			expect(firstCall).toEqual({});
			expect(firstCall !== undefined && 'model' in firstCall).toBe(false);
		});

		it('still default-picks when the catalog is empty — the empty name bypasses the membership check, never refuses unknown-model', async () => {
			// Guards against a pre-check wrongly gated on catalog size
			// (`catalog.length > 0 && …`): an empty name must default-pick whatever
			// the catalog holds, so `name !== ''` must be the SOLE gate.
			const handle = fakeModel();
			const runtime = recordingRuntime({
				ok: true,
				model: handle,
				resolvedId: 'runtime-chosen-id',
				resolvedRuntime: 'webllm',
			});

			const result = await makeLoadModel(runtime, catalogOf())('');

			expect('model' in result).toBe(true);
			expect(runtime.calls).toEqual([{}]);
		});
	});

	describe('one — a known non-empty name passes straight through', () => {
		it('passes { model: name } to load and resolves the model', async () => {
			const handle = fakeModel();
			const runtime = recordingRuntime({
				ok: true,
				model: handle,
				resolvedId: 'known-x',
				resolvedRuntime: 'webllm',
			});

			const result = await makeLoadModel(
				runtime,
				catalogOf('known-x'),
			)('known-x');

			if (!('model' in result)) throw new Error('expected a ResolvedModel');
			expect(result.resolvedId).toBe('known-x');
			expect(runtime.calls).toEqual([{ model: 'known-x' }]);
		});
	});

	describe('interface — LoadSuccess maps to ResolvedModel, dropping runtime fields', () => {
		it('keeps the model handle and resolvedId, drops resolvedRuntime and ok', async () => {
			const handle = fakeModel();
			const runtime = recordingRuntime({
				ok: true,
				model: handle,
				resolvedId: 'id-7',
				resolvedRuntime: 'wllama',
			});

			const result = await makeLoadModel(runtime, catalogOf('id-7'))('id-7');

			if (!('model' in result)) throw new Error('expected a ResolvedModel');
			expect(result.model).toBe(handle); // same handle, by reference
			expect(result.resolvedId).toBe('id-7');
			expect('resolvedRuntime' in result).toBe(false);
			expect('ok' in result).toBe(false);
		});
	});

	describe('one — an unknown non-empty name refuses before load', () => {
		it('refuses unknown-model and never calls load', async () => {
			const runtime = recordingRuntime({
				ok: true,
				model: fakeModel(),
				resolvedId: 'x',
				resolvedRuntime: 'webllm',
			});

			const result = await makeLoadModel(
				runtime,
				catalogOf('known-x'),
			)('definitely-not-in-catalog');

			expect('cause' in result).toBe(true);
			if (!('cause' in result)) throw new Error('expected a Refusal');
			expect(result.cause).toBe('unknown-model');
			expect(runtime.calls).toHaveLength(0);
		});

		it('carries no nextStep — no honest device-limit cause underlies a typo', async () => {
			const runtime = recordingRuntime({
				ok: true,
				model: fakeModel(),
				resolvedId: 'x',
				resolvedRuntime: 'webllm',
			});

			const result = await makeLoadModel(
				runtime,
				catalogOf('known-x'),
			)('definitely-not-in-catalog');

			if (!('cause' in result)) throw new Error('expected a Refusal');
			expect('nextStep' in result).toBe(false);
		});
	});

	describe('many — each LoadFailure cause maps to no-model-available with its nextStep', () => {
		// A non-empty attempts ledger for the post-flight causes (the loader reads only
		// `cause`; the ledger is here only to satisfy the post-flight LoadFailure union).
		const ATTEMPTS = [
			{ id: 'known-x', runtime: 'webllm', cause: 'device-lost' },
		] as const;

		it.each([
			{
				failure: { cause: 'no-feasible-model' } as const,
				nextStep: 'use-native-app' as const,
			},
			{
				failure: {
					cause: 'all-candidates-exhausted',
					attempts: ATTEMPTS,
				} as const,
				nextStep: 'use-native-app' as const,
			},
			{
				failure: { cause: 'fetch-failed', attempts: ATTEMPTS } as const,
				nextStep: 'retry' as const,
			},
			{
				failure: { cause: 'storage-quota', attempts: ATTEMPTS } as const,
				nextStep: 'free-space' as const,
			},
			{
				failure: { cause: 'cache-evicted', attempts: ATTEMPTS } as const,
				nextStep: 'reconnect' as const,
			},
		])(
			'a $failure.cause LoadFailure → no-model-available with nextStep $nextStep',
			async ({ failure, nextStep }) => {
				const runtime = recordingRuntime({ ok: false, ...failure });

				const result = await makeLoadModel(
					runtime,
					catalogOf('known-x'),
				)('known-x');

				if (!('cause' in result)) throw new Error('expected a Refusal');
				expect(result.cause).toBe('no-model-available');
				expect(result.nextStep).toBe(nextStep);
			},
		);
	});

	describe('exceptions — a faulting load is caught as a value, never rejected', () => {
		it('folds a rejected load (e.g. a propagated probe fault) into no-model-available', async () => {
			const runtime = faultingRuntime(new Error('probe rejected'), false);

			await expect(
				makeLoadModel(runtime, catalogOf('known-x'))('known-x'),
			).resolves.toEqual({ cause: 'no-model-available' });
		});

		it('folds a synchronously thrown load into no-model-available (catch wraps the call site)', async () => {
			const runtime = faultingRuntime(new Error('sync infra fault'), true);

			await expect(
				makeLoadModel(runtime, catalogOf('known-x'))('known-x'),
			).resolves.toEqual({ cause: 'no-model-available' });
		});

		it('carries no nextStep — the infra-fault path has no honest terminal cause', async () => {
			const runtime = faultingRuntime(new Error('probe rejected'), false);

			const result = await makeLoadModel(
				runtime,
				catalogOf('known-x'),
			)('known-x');

			if (!('cause' in result)) throw new Error('expected a Refusal');
			expect('nextStep' in result).toBe(false);
		});
	});
});

// Compile-time contract pins (the tsc-RED forcing function), NOT behavioral coverage
// of makeLoadModel — these exercise the Refusal / NextStep type shape, not the loader.
describe('Refusal type contract — the optional nextStep field (compile-time pins)', () => {
	const STEPS: readonly NextStep[] = [
		'retry',
		'free-space',
		'reconnect',
		'use-native-app',
	];

	it('is optional — a bare Refusal compiles with no nextStep', () => {
		const bare: Refusal = { cause: 'no-model-available' };
		expect(bare.nextStep).toBeUndefined();
	});

	it.each(STEPS)('nextStep %s is valid on a Refusal', (step) => {
		const refusal: Refusal = { cause: 'no-model-available', nextStep: step };
		expect(refusal.nextStep).toBe(step);
	});
});
