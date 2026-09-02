// cspell:ignore exclud -- regex alternation matching exclude/excluded/excluding
import { describe, expect, it, vi } from 'vitest';

import makeLocalLlm from '../make-local-llm.js';
import type {
	CapabilityProbe,
	LoadProgress,
	ModelCatalog,
	RuntimeAdapter,
} from '../types.js';

import {
	countedAdapter,
	FAKE_CATALOG,
	fakeCaps,
	fakeModel,
	fakeProbe,
	scriptedAdapter,
	webllmEntry,
	wllamaEntry,
} from './fakes.js';

const WEBLLM_ID = 'fake-webllm-small';

// A failing-default + working-sibling chain: the cost-aware default (gpu-default, webllm)
// fails bring-up, the CPU rescue (cpu-rescue, wllama) succeeds — exercising the descent
// across a runtime switch. URLs match the entry builders' `https://example.test/${id}`.
const DESCENT_DEFAULT_URL = 'https://example.test/gpu-default';
const DESCENT_RESCUE_URL = 'https://example.test/cpu-rescue';
const DESCENT_CATALOG: ModelCatalog = [
	webllmEntry({ id: 'gpu-default', sizeClass: 'small', vramRequiredMB: 1000 }),
	wllamaEntry({ id: 'cpu-rescue', sizeClass: 'tiny' }),
];

describe('makeLocalLlm', () => {
	describe('load — refusal', () => {
		it('resolves no-feasible-model when nothing is feasible', async () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(fakeCaps({ webgpu: false })),
			});
			const result = await llm.load();
			if (result.ok) throw new Error('expected a refusal');
			expect(result.cause).toBe('no-feasible-model');
		});

		it('the pre-flight detail names each rejected model with its reason', async () => {
			// deviceMemoryGB 1 → budget 512 MB < FAKE_CATALOG webllm need (1000) → the
			// webllm entry is rejected vram-too-large; the per-entry detail names it.
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(fakeCaps({ deviceMemoryGB: 1 })),
			});
			const result = await llm.load();
			if (result.ok) throw new Error('expected a refusal');
			expect(result.detail).toMatch(/fake-webllm-small.*VRAM/i);
		});

		it('an empty catalog yields a no-models-available detail', async () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: [],
				capabilityProbe: fakeProbe(),
			});
			const result = await llm.load();
			if (result.ok) throw new Error('expected a refusal');
			expect(result.detail).toMatch(/no catalog|available/i);
		});

		it('a caller selection that excludes every feasible model gets a selection-shaped detail, not a device-limit lie', async () => {
			// Rich device (webgpu true), FAKE_CATALOG has a feasible webllm-small, but
			// a 'tiny' ceiling excludes it → chosen is null though a model IS feasible.
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const result = await llm.load({ sizeClass: 'tiny' });
			if (result.ok) throw new Error('expected a refusal');
			expect(result.detail).toMatch(/selection|exclud/i);
		});

		it('the pre-flight refusal carries an honest detail', async () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(fakeCaps({ webgpu: false })),
			});
			const result = await llm.load();
			if (result.ok) throw new Error('expected a refusal');
			expect(result.detail).toMatch(/\S/);
		});

		it('the no-WebGPU detail names the missing capability', async () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(fakeCaps({ webgpu: false })),
			});
			const result = await llm.load();
			if (result.ok) throw new Error('expected a refusal');
			expect(result.detail).toMatch(/webgpu/i);
		});

		it('the detail reflects the device limit (no-WebGPU vs over-budget differ)', async () => {
			const noWebgpu = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(fakeCaps({ webgpu: false })),
			});
			// webgpu present, but deviceMemoryGB so low FAKE_CATALOG's webllm vram
			// exceeds the budget → infeasible via the REAL vram gate, empty feasible set.
			const overBudget = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(fakeCaps({ deviceMemoryGB: 1 })),
			});
			const a = await noWebgpu.load();
			const b = await overBudget.load();
			if (a.ok || b.ok) throw new Error('expected refusals');
			expect(a.detail).not.toBe(b.detail);
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

	describe('load — chain descent', () => {
		it('a default that brings up wins without descending', async () => {
			const webllm = scriptedAdapter({ [DESCENT_DEFAULT_URL]: 'ok' });
			const wllama = scriptedAdapter({});
			const llm = makeLocalLlm({
				adapters: { webllm, wllama },
				catalog: DESCENT_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const result = await llm.load();
			expect(result.ok && result.resolvedId).toBe('gpu-default');
		});

		it('a winning default is not descended past — the tail is never tried', async () => {
			const webllm = scriptedAdapter({ [DESCENT_DEFAULT_URL]: 'ok' });
			const wllama = scriptedAdapter({});
			const llm = makeLocalLlm({
				adapters: { webllm, wllama },
				catalog: DESCENT_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			await llm.load();
			expect(wllama.calls.length).toBe(0);
		});

		it('descends to a working sibling when the default fails, reporting the sibling id', async () => {
			const webllm = scriptedAdapter({
				[DESCENT_DEFAULT_URL]: new Error('webgpu bring-up failed'),
			});
			const wllama = scriptedAdapter({ [DESCENT_RESCUE_URL]: 'ok' });
			const llm = makeLocalLlm({
				adapters: { webllm, wllama },
				catalog: DESCENT_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const result = await llm.load();
			expect(result.ok && result.resolvedId).toBe('cpu-rescue');
		});

		it('reports the winning sibling runtime across the switch', async () => {
			const webllm = scriptedAdapter({
				[DESCENT_DEFAULT_URL]: new Error('webgpu bring-up failed'),
			});
			const wllama = scriptedAdapter({ [DESCENT_RESCUE_URL]: 'ok' });
			const llm = makeLocalLlm({
				adapters: { webllm, wllama },
				catalog: DESCENT_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const result = await llm.load();
			expect(result.ok && result.resolvedRuntime).toBe('wllama');
		});

		it('returns the winning model handle, not a refusal', async () => {
			const webllm = scriptedAdapter({
				[DESCENT_DEFAULT_URL]: new Error('webgpu bring-up failed'),
			});
			const wllama = scriptedAdapter({ [DESCENT_RESCUE_URL]: 'ok' });
			const llm = makeLocalLlm({
				adapters: { webllm, wllama },
				catalog: DESCENT_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const result = await llm.load();
			expect(result.ok && result.model !== undefined).toBe(true);
		});

		it('tries the failing default before descending', async () => {
			const webllm = scriptedAdapter({
				[DESCENT_DEFAULT_URL]: new Error('webgpu bring-up failed'),
			});
			const wllama = scriptedAdapter({ [DESCENT_RESCUE_URL]: 'ok' });
			const llm = makeLocalLlm({
				adapters: { webllm, wllama },
				catalog: DESCENT_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			await llm.load();
			expect(webllm.calls).toContain(DESCENT_DEFAULT_URL);
		});

		it('caches the descent winner — a reload reuses it with no second rescue bring-up', async () => {
			const webllm = scriptedAdapter({
				[DESCENT_DEFAULT_URL]: new Error('webgpu bring-up failed'),
			});
			const wllama = scriptedAdapter({ [DESCENT_RESCUE_URL]: 'ok' });
			const llm = makeLocalLlm({
				adapters: { webllm, wllama },
				catalog: DESCENT_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			await llm.load();
			await llm.load();
			expect(wllama.calls.length).toBe(1);
		});

		it('descends past two failing candidates to a working third', async () => {
			const webllm = scriptedAdapter({
				'https://example.test/gpu-big': new Error('big failed'),
				'https://example.test/gpu-small': new Error('small failed'),
			});
			const wllama = scriptedAdapter({ 'https://example.test/cpu-last': 'ok' });
			const llm = makeLocalLlm({
				adapters: { webllm, wllama },
				catalog: [
					webllmEntry({
						id: 'gpu-big',
						sizeClass: 'small',
						vramRequiredMB: 1500,
					}),
					webllmEntry({
						id: 'gpu-small',
						sizeClass: 'tiny',
						vramRequiredMB: 300,
					}),
					wllamaEntry({ id: 'cpu-last', sizeClass: 'tiny' }),
				],
				capabilityProbe: fakeProbe(),
			});
			const result = await llm.load();
			expect(result.ok && result.resolvedId).toBe('cpu-last');
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
		it('resolves a post-flight fetch-failed refusal carrying the attempts ledger', async () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter({ fail: true }) },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			expect(await llm.load()).toEqual({
				ok: false,
				cause: 'fetch-failed',
				attempts: [
					{
						id: WEBLLM_ID,
						runtime: 'webllm',
						cause: 'fetch-failed',
						detail: expect.stringContaining('Failed to fetch'),
					},
				],
			});
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

	describe('load — exhausted chain promotes a terminal cause', () => {
		it('promotes storage-quota from an early rung over a later fetch-failure', async () => {
			const webllm = scriptedAdapter({
				[DESCENT_DEFAULT_URL]: new Error('The storage quota was exceeded'),
			});
			const wllama = scriptedAdapter({
				[DESCENT_RESCUE_URL]: new TypeError('Failed to fetch'),
			});
			const llm = makeLocalLlm({
				adapters: { webllm, wllama },
				catalog: DESCENT_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const result = await llm.load();
			expect(result.ok === false && result.cause).toBe('storage-quota');
		});

		it('records one ordered attempt per failed candidate', async () => {
			const webllm = scriptedAdapter({
				[DESCENT_DEFAULT_URL]: new Error('The storage quota was exceeded'),
			});
			const wllama = scriptedAdapter({
				[DESCENT_RESCUE_URL]: new TypeError('Failed to fetch'),
			});
			const llm = makeLocalLlm({
				adapters: { webllm, wllama },
				catalog: DESCENT_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const result = await llm.load();
			if (result.ok) throw new Error('expected a refusal');
			if (!('attempts' in result)) {
				throw new Error('expected a post-flight refusal');
			}
			expect(result.attempts).toEqual([
				{
					id: 'gpu-default',
					runtime: 'webllm',
					cause: 'storage-quota',
					detail: expect.stringContaining('quota'),
				},
				{
					id: 'cpu-rescue',
					runtime: 'wllama',
					cause: 'fetch-failed',
					detail: expect.stringContaining('Failed to fetch'),
				},
			]);
		});

		it('promotes cache-evicted over a later fetch-failure when no storage-quota', async () => {
			const webllm = scriptedAdapter({
				[DESCENT_DEFAULT_URL]: new Error(
					'the model was evicted from the cache',
				),
			});
			const wllama = scriptedAdapter({
				[DESCENT_RESCUE_URL]: new TypeError('Failed to fetch'),
			});
			const llm = makeLocalLlm({
				adapters: { webllm, wllama },
				catalog: DESCENT_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const result = await llm.load();
			expect(result.ok === false && result.cause).toBe('cache-evicted');
		});

		it('a chain of device-lost and undiagnosed failures refuses with all-candidates-exhausted', async () => {
			const webllm = scriptedAdapter({
				[DESCENT_DEFAULT_URL]: new Error('the GPU device was lost'),
			});
			const wllama = scriptedAdapter({
				[DESCENT_RESCUE_URL]: new Error('something opaque'),
			});
			const llm = makeLocalLlm({
				adapters: { webllm, wllama },
				catalog: DESCENT_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const result = await llm.load();
			expect(result.ok === false && result.cause).toBe(
				'all-candidates-exhausted',
			);
		});
	});

	describe('unknown model name', () => {
		it.skip('resolves the unknown-model refusal, not a throw', async () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const result = await llm.load({ model: 'ghost-model' });
			expect(result.ok === false && result.cause).toBe('unknown-model');
		});

		it.skip('an empty model name is the pick-for-me request, not unknown', async () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const result = await llm.load({ model: '' });
			expect(result.ok === true && result.resolvedId).toBe(WEBLLM_ID);
		});
	});

	describe('generation outcome (the wrapper over the adapter)', () => {
		it.skip('a successful generate resolves ok true carrying the decomposed result', async () => {
			const canned: RuntimeAdapter = () => Promise.resolve(fakeModel('reply'));
			const llm = makeLocalLlm({
				adapters: { webllm: canned },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const loaded = await llm.load();
			if (!loaded.ok) throw new Error('expected a loaded model');
			const outcome = await loaded.model.generate('a prompt');
			expect(outcome.ok === true && outcome.result.raw).toBe('reply');
		});

		it.skip('a pre-aborted signal settles aborted', async () => {
			const canned: RuntimeAdapter = () => Promise.resolve(fakeModel('reply'));
			const llm = makeLocalLlm({
				adapters: { webllm: canned },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const loaded = await llm.load();
			if (!loaded.ok) throw new Error('expected a loaded model');
			const controller = new AbortController();
			controller.abort();
			const outcome = await loaded.model.generate('a prompt', {
				signal: controller.signal,
			});
			expect(outcome.ok === false && outcome.cause).toBe('aborted');
		});

		it.skip('a pre-aborted call never engages the adapter model', async () => {
			let engaged = 0;
			const counting: RuntimeAdapter = () =>
				Promise.resolve({
					generate: () => {
						engaged += 1;
						return Promise.resolve({ raw: '', code: '' });
					},
				});
			const llm = makeLocalLlm({
				adapters: { webllm: counting },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const loaded = await llm.load();
			if (!loaded.ok) throw new Error('expected a loaded model');
			const controller = new AbortController();
			controller.abort();
			await loaded.model.generate('a prompt', { signal: controller.signal });
			expect(engaged).toBe(0);
		});

		it.skip('a mid-flight abort settles aborted even when the adapter later resolves', async () => {
			let release = (_result: { raw: string; code: string }) => {};
			const hanging: RuntimeAdapter = () =>
				Promise.resolve({
					generate: () =>
						new Promise<{ raw: string; code: string }>((resolve) => {
							release = resolve;
						}),
				});
			const llm = makeLocalLlm({
				adapters: { webllm: hanging },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const loaded = await llm.load();
			if (!loaded.ok) throw new Error('expected a loaded model');
			const controller = new AbortController();
			const pending = loaded.model.generate('a prompt', {
				signal: controller.signal,
			});
			controller.abort();
			release({ raw: 'late partial', code: 'late partial' });
			const outcome = await pending;
			expect(outcome.ok === false && outcome.cause).toBe('aborted');
		});

		it.skip('a mid-flight abort settles aborted even when the adapter then rejects', async () => {
			let breakCall = (_error: Error) => {};
			const tearing: RuntimeAdapter = () =>
				Promise.resolve({
					generate: () =>
						new Promise<{ raw: string; code: string }>((_resolve, reject) => {
							breakCall = reject;
						}),
				});
			const llm = makeLocalLlm({
				adapters: { webllm: tearing },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const loaded = await llm.load();
			if (!loaded.ok) throw new Error('expected a loaded model');
			const controller = new AbortController();
			const pending = loaded.model.generate('a prompt', {
				signal: controller.signal,
			});
			controller.abort();
			breakCall(new Error('backend tore down on interrupt'));
			const outcome = await pending;
			expect(outcome.ok === false && outcome.cause).toBe('aborted');
		});

		it.skip('an abort after settlement is a no-op — the next generate proceeds', async () => {
			const canned: RuntimeAdapter = () => Promise.resolve(fakeModel('reply'));
			const llm = makeLocalLlm({
				adapters: { webllm: canned },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const loaded = await llm.load();
			if (!loaded.ok) throw new Error('expected a loaded model');
			const controller = new AbortController();
			await loaded.model.generate('one', { signal: controller.signal });
			controller.abort();
			const next = await loaded.model.generate('two');
			expect(next.ok).toBe(true);
		});

		it.skip('the model stays usable after an aborted call', async () => {
			const canned: RuntimeAdapter = () => Promise.resolve(fakeModel('reply'));
			const llm = makeLocalLlm({
				adapters: { webllm: canned },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const loaded = await llm.load();
			if (!loaded.ok) throw new Error('expected a loaded model');
			const controller = new AbortController();
			controller.abort();
			await loaded.model.generate('one', { signal: controller.signal });
			const next = await loaded.model.generate('two');
			expect(next.ok).toBe(true);
		});

		it.skip('an escaped adapter fault settles generation-failed', async () => {
			const broken: RuntimeAdapter = () =>
				Promise.resolve({
					generate: () => Promise.reject(new Error('backend broke')),
				});
			const llm = makeLocalLlm({
				adapters: { webllm: broken },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const loaded = await llm.load();
			if (!loaded.ok) throw new Error('expected a loaded model');
			const outcome = await loaded.model.generate('a prompt');
			expect(outcome.ok === false && outcome.cause).toBe('generation-failed');
		});

		it.skip('a GPU drop mid-generation settles device-lost', async () => {
			const dropping: RuntimeAdapter = () =>
				Promise.resolve({
					generate: () =>
						Promise.reject(new Error('WebGPU device lost during decode')),
				});
			const llm = makeLocalLlm({
				adapters: { webllm: dropping },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const loaded = await llm.load();
			if (!loaded.ok) throw new Error('expected a loaded model');
			const outcome = await loaded.model.generate('a prompt');
			expect(outcome.ok === false && outcome.cause).toBe('device-lost');
		});
	});

	describe('capability probe failure', () => {
		it('propagates a probe rejection from load (not a LoadFailure)', async () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: () => Promise.reject(new Error('probe boom')),
			});
			await expect(llm.load()).rejects.toThrow('probe boom');
		});

		it('propagates a probe rejection from canRun (the probe directly)', async () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: () => Promise.reject(new Error('probe boom')),
			});
			await expect(llm.canRun()).rejects.toThrow('probe boom');
		});
	});

	describe('progress', () => {
		it('relabels adapter progress to one calm candidate-agnostic narrative', async () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const onProgress = vi.fn();
			await llm.load(undefined, onProgress);
			expect(onProgress).toHaveBeenCalledWith({
				phase: 'fetch',
				text: 'Setting up your local AI…',
				ratio: 1,
			});
		});

		it('forwards phase and ratio unchanged while replacing text', async () => {
			const adapter: RuntimeAdapter = (_load, _fetchUrl, onProgress) => {
				onProgress?.({ phase: 'load', text: 'loading shards', ratio: 0.5 });
				return Promise.resolve(fakeModel());
			};
			const llm = makeLocalLlm({
				adapters: { webllm: adapter },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const onProgress = vi.fn();
			await llm.load(undefined, onProgress);
			expect(onProgress).toHaveBeenCalledWith({
				phase: 'load',
				text: 'Setting up your local AI…',
				ratio: 0.5,
			});
		});

		it('reports one narrative across a descent — no candidate leaks its raw text', async () => {
			const webllm = scriptedAdapter({
				[DESCENT_DEFAULT_URL]: new Error('webgpu bring-up failed'),
			});
			const wllama = scriptedAdapter({ [DESCENT_RESCUE_URL]: 'ok' });
			const llm = makeLocalLlm({
				adapters: { webllm, wllama },
				catalog: DESCENT_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const onProgress = vi.fn();
			await llm.load(undefined, onProgress);
			expect(onProgress).not.toHaveBeenCalledWith(
				expect.objectContaining({ text: 'fake' }),
			);
		});

		it('does not inject a ratio the adapter omitted', async () => {
			const adapter: RuntimeAdapter = (_load, _fetchUrl, onProgress) => {
				onProgress?.({ phase: 'load', text: 'shard' });
				return Promise.resolve(fakeModel());
			};
			const llm = makeLocalLlm({
				adapters: { webllm: adapter },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			let captured: LoadProgress | undefined;
			await llm.load(undefined, (progress) => {
				captured = progress;
			});
			if (captured === undefined) throw new Error('expected a progress report');
			expect('ratio' in captured).toBe(false);
		});

		it('an absent onProgress is a no-op — load still resolves ok', async () => {
			const llm = makeLocalLlm({
				adapters: { webllm: countedAdapter() },
				catalog: FAKE_CATALOG,
				capabilityProbe: fakeProbe(),
			});
			const result = await llm.load();
			expect(result.ok).toBe(true);
		});
	});
});
