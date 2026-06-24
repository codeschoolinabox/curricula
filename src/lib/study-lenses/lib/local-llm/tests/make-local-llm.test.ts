import { describe, expect, it, vi } from 'vitest';

import makeLocalLlm from '../make-local-llm.js';
import type { CapabilityProbe, RuntimeAdapter } from '../types.js';

import {
	countedAdapter,
	FAKE_CATALOG,
	fakeCaps,
	fakeModel,
	fakeProbe,
} from './fakes.js';

const WEBLLM_ID = 'fake-webllm-small';

describe('makeLocalLlm', () => {
	describe('load — refusal', () => {
		it('resolves no-feasible-model when nothing is feasible', async () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(fakeCaps({ webgpu: false })),
			});
			expect(await llm.load()).toEqual({ ok: false, cause: 'no-feasible-model' });
		});
	});

	describe('load — one feasible model', () => {
		it('resolves ok', async () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const result = await llm.load();
			expect(result.ok).toBe(true);
		});

		it('reports the resolved id', async () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const result = await llm.load();
			expect(result.ok && result.resolvedId).toBe(WEBLLM_ID);
		});

		it('reports the resolved runtime', async () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const result = await llm.load();
			expect(result.ok && result.resolvedRuntime).toBe('webllm');
		});

		it('triggers exactly one bring-up', async () => {
			const adapter = countedAdapter();
			const llm = makeLocalLlm({
				adapters: { webllm: adapter },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			await llm.load();
			expect(adapter.calls.length).toBe(1);
		});
	});

	describe('sync selection readers', () => {
		it('canRun returns the probe capabilities', async () => {
			const caps = fakeCaps();
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(caps),
			});
			expect(await llm.canRun()).toBe(caps);
		});

		it('feasibleModels delegates to the selection core', () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			expect(llm.feasibleModels(fakeCaps()).map((entry) => entry.id)).toEqual([
				WEBLLM_ID,
			]);
		});

		it('recommendedModel delegates to the selection core', () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			expect(llm.recommendedModel(fakeCaps())?.id).toBe(WEBLLM_ID);
		});

		it('recommendedModel honours an explicit selection', () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			expect(llm.recommendedModel(fakeCaps(), { model: WEBLLM_ID })?.id).toBe(
				WEBLLM_ID,
			);
		});
	});

	describe('load-once + in-flight dedup', () => {
		it('N concurrent loads of the same model trigger exactly one bring-up', async () => {
			// Gate the PROBE so all four loads reach the cache together; an adapter
			// gate would open before any load arrived (see fakes.ts countedAdapter).
			let releaseProbe!: () => void;
			const probeGate = new Promise<void>((resolve) => {
				releaseProbe = resolve;
			});
			const probe: CapabilityProbe = async () => {
				await probeGate;
				return fakeCaps();
			};
			const adapter = countedAdapter();
			const llm = makeLocalLlm({
				adapters: { webllm: adapter },
				catalog: FAKE_CATALOG,
				capabilityProbe: probe,
			});
			const inflight = [llm.load(), llm.load(), llm.load(), llm.load()];
			releaseProbe();
			await Promise.all(inflight);
			expect(adapter.calls.length).toBe(1);
		});

		it('the concurrent loads share a single model instance', async () => {
			let releaseProbe!: () => void;
			const probeGate = new Promise<void>((resolve) => {
				releaseProbe = resolve;
			});
			const probe: CapabilityProbe = async () => {
				await probeGate;
				return fakeCaps();
			};
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: probe,
			});
			const inflight = [llm.load(), llm.load(), llm.load(), llm.load()];
			releaseProbe();
			const results = await Promise.all(inflight);
			const first = results[0];
			expect(
				results.every((r) => r.ok && first.ok && r.model === first.model),
			).toBe(true);
		});

		it('a sequential reload reuses the cached model (no second bring-up)', async () => {
			const adapter = countedAdapter();
			const llm = makeLocalLlm({
				adapters: { webllm: adapter },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			await llm.load();
			await llm.load();
			expect(adapter.calls.length).toBe(1);
		});
	});

	describe('failed bring-up', () => {
		it('resolves fetch-failed (a returned value, not a throw)', async () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter({ fail: true }) },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			expect(await llm.load()).toEqual({ ok: false, cause: 'fetch-failed' });
		});

		it('is not memoized — a retry re-attempts the bring-up', async () => {
			const adapter = countedAdapter({ fail: true });
			const llm = makeLocalLlm({
				adapters: { webllm: adapter },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			await llm.load();
			await llm.load();
			expect(adapter.calls.length).toBe(2);
		});

		it('a retry succeeds once the bring-up works (the rejection was evicted)', async () => {
			let attempts = 0;
			const flaky: RuntimeAdapter = () => {
				attempts += 1;
				return attempts === 1
					? Promise.reject(new Error('first attempt fails'))
					: Promise.resolve(fakeModel());
			};
			const llm = makeLocalLlm({
				adapters: { webllm: flaky },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const first = await llm.load();
			const second = await llm.load();
			expect(first.ok === false && second.ok === true).toBe(true);
		});

		it('N concurrent loads of a failing model still dedup to one bring-up', async () => {
			let releaseProbe!: () => void;
			const probeGate = new Promise<void>((resolve) => {
				releaseProbe = resolve;
			});
			const probe: CapabilityProbe = async () => {
				await probeGate;
				return fakeCaps();
			};
			const adapter = countedAdapter({ fail: true });
			const llm = makeLocalLlm({
				adapters: { webllm: adapter },
				catalog: FAKE_CATALOG,
				capabilityProbe: probe,
			});
			const inflight = [llm.load(), llm.load(), llm.load(), llm.load()];
			releaseProbe();
			await Promise.all(inflight);
			expect(adapter.calls.length).toBe(1);
		});

		it('concurrent failures still evict the cache — a later load re-attempts', async () => {
			let releaseProbe!: () => void;
			const probeGate = new Promise<void>((resolve) => {
				releaseProbe = resolve;
			});
			const probe: CapabilityProbe = async () => {
				await probeGate;
				return fakeCaps();
			};
			const adapter = countedAdapter({ fail: true });
			const llm = makeLocalLlm({
				adapters: { webllm: adapter },
				catalog: FAKE_CATALOG,
				capabilityProbe: probe,
			});
			const inflight = [llm.load(), llm.load(), llm.load(), llm.load()];
			releaseProbe();
			await Promise.all(inflight);
			await llm.load();
			expect(adapter.calls.length).toBe(2);
		});
	});

	describe('unknown model name', () => {
		it('throws (a programmer error, not a LoadFailure)', async () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			await expect(llm.load({ model: 'ghost-model' })).rejects.toThrow(
				'ghost-model',
			);
		});
	});

	describe('progress', () => {
		it('forwards onProgress to the adapter', async () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const onProgress = vi.fn();
			await llm.load(undefined, onProgress);
			expect(onProgress).toHaveBeenCalledWith({
				phase: 'fetch',
				text: 'fake',
				ratio: 1,
			});
		});
	});
});
