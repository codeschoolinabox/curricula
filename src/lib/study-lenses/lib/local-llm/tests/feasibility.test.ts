import { describe, expect, it } from 'vitest';

import selectFeasible from '../feasibility.js';
import type { ModelCatalogEntry } from '../types.js';

import {
	fakeCaps,
	registeredAdapter,
	webllmEntry,
	wllamaEntry,
} from './fakes.js';

const WEBLLM = { webllm: registeredAdapter };

describe('selectFeasible', () => {
	describe('empty catalog', () => {
		it('feasible set is empty', () => {
			const result = selectFeasible({
				catalog: [],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
			});
			expect(result.feasible).toEqual([]);
		});

		it('chosen is null', () => {
			const result = selectFeasible({
				catalog: [],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
			});
			expect(result.chosen).toBeNull();
		});

		it('chosenRuntime is null', () => {
			const result = selectFeasible({
				catalog: [],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
			});
			expect(result.chosenRuntime).toBeNull();
		});
	});

	describe('one feasible webllm entry', () => {
		it('the entry is in the feasible set', () => {
			const entry = webllmEntry({ id: 'solo', vramRequiredMB: 1000 });
			const result = selectFeasible({
				catalog: [entry],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
			});
			expect(result.feasible).toEqual([entry]);
		});

		it('chosen is the entry', () => {
			const entry = webllmEntry({ id: 'solo', vramRequiredMB: 1000 });
			const result = selectFeasible({
				catalog: [entry],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
			});
			expect(result.chosen).toBe(entry);
		});

		it('chosenRuntime is webllm', () => {
			const entry = webllmEntry({ id: 'solo', vramRequiredMB: 1000 });
			const result = selectFeasible({
				catalog: [entry],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
			});
			expect(result.chosenRuntime).toBe('webllm');
		});
	});

	describe('no registered adapters', () => {
		it('nothing is feasible even with rich capabilities', () => {
			const result = selectFeasible({
				catalog: [webllmEntry({ vramRequiredMB: 100 })],
				capabilities: fakeCaps(),
				adapters: {},
			});
			expect(result.feasible).toEqual([]);
		});
	});

	describe('cost-aware default across size classes', () => {
		it("'default' picks the largest rung within the cost ceiling, not the largest feasible", () => {
			const small = webllmEntry({
				id: 'small',
				sizeClass: 'small',
				vramRequiredMB: 1000,
			});
			const mid = webllmEntry({
				id: 'mid',
				sizeClass: 'mid',
				vramRequiredMB: 3000,
			});
			const result = selectFeasible({
				catalog: [small, mid],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
			});
			expect(result.chosen).toBe(small);
		});
	});

	describe('vram feasibility threshold (half of device memory)', () => {
		it('vram exactly at the half-memory bound → feasible (inclusive)', () => {
			const entry = webllmEntry({ vramRequiredMB: 4096 });
			const result = selectFeasible({
				catalog: [entry],
				capabilities: fakeCaps({ deviceMemoryGB: 8 }),
				adapters: WEBLLM,
			});
			expect(result.feasible).toEqual([entry]);
		});

		it('vram one over the half-memory bound → not feasible', () => {
			const result = selectFeasible({
				catalog: [webllmEntry({ vramRequiredMB: 4097 })],
				capabilities: fakeCaps({ deviceMemoryGB: 8 }),
				adapters: WEBLLM,
			});
			expect(result.feasible).toEqual([]);
		});
	});

	describe("'default' cost ceiling (2048 MB)", () => {
		it('vram exactly 2048 is eligible for the default pick', () => {
			const tiny = webllmEntry({
				id: 'tiny',
				sizeClass: 'tiny',
				vramRequiredMB: 500,
			});
			const small = webllmEntry({
				id: 'small',
				sizeClass: 'small',
				vramRequiredMB: 2048,
			});
			const result = selectFeasible({
				catalog: [tiny, small],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
			});
			expect(result.chosen).toBe(small);
		});

		it('vram 2049 is excluded from the default pick', () => {
			const tiny = webllmEntry({
				id: 'tiny',
				sizeClass: 'tiny',
				vramRequiredMB: 500,
			});
			const small = webllmEntry({
				id: 'small',
				sizeClass: 'small',
				vramRequiredMB: 2049,
			});
			const result = selectFeasible({
				catalog: [tiny, small],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
			});
			expect(result.chosen).toBe(tiny);
		});
	});

	describe('absent vramRequiredMB falls back to size class', () => {
		it("absent vram at sizeClass 'small' → feasible", () => {
			const entry = webllmEntry({ sizeClass: 'small' });
			const result = selectFeasible({
				catalog: [entry],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
			});
			expect(result.feasible).toEqual([entry]);
		});

		it("absent vram at sizeClass 'mid' → not feasible", () => {
			const result = selectFeasible({
				catalog: [webllmEntry({ sizeClass: 'mid' })],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
			});
			expect(result.feasible).toEqual([]);
		});
	});

	describe("'default' tie-break", () => {
		it('prefers codeSpecialized at the same size class and cost', () => {
			const general = webllmEntry({
				id: 'general',
				vramRequiredMB: 1000,
				codeSpecialized: false,
			});
			const coder = webllmEntry({
				id: 'coder',
				vramRequiredMB: 1000,
				codeSpecialized: true,
			});
			const result = selectFeasible({
				catalog: [general, coder],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
			});
			expect(result.chosen).toBe(coder);
		});

		it('breaks a full tie by id ascending (deterministic)', () => {
			const zzz = webllmEntry({
				id: 'zzz',
				vramRequiredMB: 1000,
				codeSpecialized: false,
			});
			const aaa = webllmEntry({
				id: 'aaa',
				vramRequiredMB: 1000,
				codeSpecialized: false,
			});
			const result = selectFeasible({
				catalog: [zzz, aaa],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
			});
			expect(result.chosen).toBe(aaa);
		});
	});

	describe('prefer policies', () => {
		it("'max' picks the largest feasible rung", () => {
			const small = webllmEntry({
				id: 'small',
				sizeClass: 'small',
				vramRequiredMB: 1000,
			});
			const mid = webllmEntry({
				id: 'mid',
				sizeClass: 'mid',
				vramRequiredMB: 3000,
			});
			const result = selectFeasible({
				catalog: [small, mid],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
				selection: { prefer: 'max' },
			});
			expect(result.chosen).toBe(mid);
		});

		it("'min' picks the smallest feasible rung", () => {
			const small = webllmEntry({
				id: 'small',
				sizeClass: 'small',
				vramRequiredMB: 1000,
			});
			const mid = webllmEntry({
				id: 'mid',
				sizeClass: 'mid',
				vramRequiredMB: 3000,
			});
			const result = selectFeasible({
				catalog: [small, mid],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
				selection: { prefer: 'min' },
			});
			expect(result.chosen).toBe(small);
		});
	});

	describe('selection constraints', () => {
		it('honors the sizeClass ceiling', () => {
			const small = webllmEntry({
				id: 'small',
				sizeClass: 'small',
				vramRequiredMB: 1000,
			});
			const mid = webllmEntry({
				id: 'mid',
				sizeClass: 'mid',
				vramRequiredMB: 3000,
			});
			const result = selectFeasible({
				catalog: [small, mid],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
				selection: { sizeClass: 'small' },
			});
			expect(result.chosen).toBe(small);
		});

		it('an explicit feasible model wins over the prefer policy', () => {
			const a = webllmEntry({
				id: 'a',
				sizeClass: 'small',
				vramRequiredMB: 1000,
			});
			const b = webllmEntry({
				id: 'b',
				sizeClass: 'mid',
				vramRequiredMB: 3000,
			});
			const result = selectFeasible({
				catalog: [a, b],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
				selection: { model: 'b' },
			});
			expect(result.chosen).toBe(b);
		});
	});

	describe('named model membership', () => {
		it.skip('an unknown model id does not throw', () => {
			expect(() =>
				selectFeasible({
					catalog: [webllmEntry({ id: 'real', vramRequiredMB: 1000 })],
					capabilities: fakeCaps(),
					adapters: WEBLLM,
					selection: { model: 'ghost' },
				}),
			).not.toThrow();
		});

		it('a present-but-infeasible model → chosen null (not a throw)', () => {
			const fits = webllmEntry({
				id: 'fits',
				sizeClass: 'small',
				vramRequiredMB: 1000,
			});
			const oversized = webllmEntry({ id: 'oversized', sizeClass: 'mid' });
			const result = selectFeasible({
				catalog: [fits, oversized],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
				selection: { model: 'oversized' },
			});
			expect(result.chosen).toBeNull();
		});

		it('a present-but-infeasible model leaves the feasible set non-empty', () => {
			const fits = webllmEntry({
				id: 'fits',
				sizeClass: 'small',
				vramRequiredMB: 1000,
			});
			const oversized = webllmEntry({ id: 'oversized', sizeClass: 'mid' });
			const result = selectFeasible({
				catalog: [fits, oversized],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
				selection: { model: 'oversized' },
			});
			expect(result.feasible).toEqual([fits]);
		});
	});

	describe('the webgpu gate stays inside the webllm branch', () => {
		it('no WebGPU + only webllm registered → empty feasible', () => {
			const result = selectFeasible({
				catalog: [webllmEntry({ vramRequiredMB: 100 })],
				capabilities: fakeCaps({ webgpu: false }),
				adapters: WEBLLM,
			});
			expect(result.feasible).toEqual([]);
		});

		it('no WebGPU + a registered CPU runtime + a tiny model → feasible on the CPU runtime', () => {
			const result = selectFeasible({
				catalog: [wllamaEntry({ sizeClass: 'tiny' })],
				capabilities: fakeCaps({ webgpu: false }),
				adapters: { wllama: registeredAdapter },
			});
			expect(result.chosenRuntime).toBe('wllama');
		});
	});

	describe('an over-budget device — the no-feasible fold + CPU rescue', () => {
		// webgpu present, but deviceMemoryGB so low the webllm model's vram exceeds the
		// budget (HALF·2·1024 = 1024 MB < a 2000 MB model) → infeasible via the REAL
		// vram gate (not a buffer heuristic). The CPU/WASM rung (no vram gate) rescues.
		const TIGHT = { deviceMemoryGB: 2 };
		const webllmOnlyOverBudget = () =>
			selectFeasible({
				catalog: [webllmEntry({ id: 'big', vramRequiredMB: 2000 })],
				capabilities: fakeCaps(TIGHT),
				adapters: WEBLLM,
			});
		const overBudgetWithCpuRescue = () =>
			selectFeasible({
				catalog: [
					webllmEntry({ id: 'big', vramRequiredMB: 2000 }),
					wllamaEntry({ id: 'cpu-rescue', sizeClass: 'tiny' }),
				],
				capabilities: fakeCaps(TIGHT),
				adapters: { webllm: registeredAdapter, wllama: registeredAdapter },
			});

		describe('only an over-budget webllm model exists', () => {
			it('the feasible set is empty', () => {
				expect(webllmOnlyOverBudget().feasible).toEqual([]);
			});
			it('chosen is null', () => {
				expect(webllmOnlyOverBudget().chosen).toBeNull();
			});
			it('chosenRuntime is null', () => {
				expect(webllmOnlyOverBudget().chosenRuntime).toBeNull();
			});
		});

		describe('a registered CPU/WASM candidate exists (not a blanket refusal)', () => {
			it('rescues onto the CPU runtime', () => {
				expect(overBudgetWithCpuRescue().chosenRuntime).toBe('wllama');
			});
			it('the chosen model is the CPU candidate', () => {
				expect(overBudgetWithCpuRescue().chosen?.id).toBe('cpu-rescue');
			});
		});
	});

	describe('per-entry rejection diagnosis', () => {
		it('an empty catalog yields no rejections', () => {
			const result = selectFeasible({
				catalog: [],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
			});
			expect(result.rejections).toEqual([]);
		});

		it('a no-WebGPU device rejects a webllm entry with a no-webgpu reason', () => {
			const result = selectFeasible({
				catalog: [webllmEntry({ id: 'gpu-only', vramRequiredMB: 100 })],
				capabilities: fakeCaps({ webgpu: false }),
				adapters: WEBLLM,
			});
			expect(result.rejections).toEqual([
				{ id: 'gpu-only', reasons: [{ kind: 'no-webgpu' }] },
			]);
		});

		it('an over-budget webllm entry reports vram-too-large with the numbers', () => {
			const result = selectFeasible({
				catalog: [webllmEntry({ id: 'huge', vramRequiredMB: 2000 })],
				capabilities: fakeCaps({ deviceMemoryGB: 2 }), // budget = 1024 MB
				adapters: WEBLLM,
			});
			expect(result.rejections).toEqual([
				{
					id: 'huge',
					reasons: [
						{ kind: 'vram-too-large', requiredMB: 2000, budgetMB: 1024 },
					],
				},
			]);
		});

		it('a missing-feature webllm entry reports the missing features', () => {
			const result = selectFeasible({
				catalog: [
					webllmEntry({
						id: 'needs-f16',
						vramRequiredMB: 100,
						requiredFeatures: ['shader-f16'],
					}),
				],
				capabilities: fakeCaps({ webgpuFeatures: [] }), // webgpu true, no f16
				adapters: WEBLLM,
			});
			expect(result.rejections).toEqual([
				{
					id: 'needs-f16',
					reasons: [{ kind: 'missing-feature', missing: ['shader-f16'] }],
				},
			]);
		});

		it('a too-large CPU entry reports size-class-too-large', () => {
			const result = selectFeasible({
				catalog: [wllamaEntry({ id: 'big-cpu', sizeClass: 'mid' })],
				capabilities: fakeCaps({ webgpu: false }),
				adapters: { wllama: registeredAdapter },
			});
			expect(result.rejections).toEqual([
				{
					id: 'big-cpu',
					reasons: [
						{ kind: 'size-class-too-large', sizeClass: 'mid', maxCpu: 'small' },
					],
				},
			]);
		});

		it('an entry whose runtime has no registered adapter reports no-adapter', () => {
			const result = selectFeasible({
				catalog: [wllamaEntry({ id: 'orphan', sizeClass: 'tiny' })],
				capabilities: fakeCaps(),
				adapters: WEBLLM, // no wllama adapter registered
			});
			expect(result.rejections).toEqual([
				{ id: 'orphan', reasons: [{ kind: 'no-adapter', runtime: 'wllama' }] },
			]);
		});

		it('missing-feature reports only the not-advertised subset', () => {
			const result = selectFeasible({
				catalog: [
					webllmEntry({
						id: 'two-feat',
						vramRequiredMB: 100,
						requiredFeatures: ['shader-f16', 'timestamp-query'],
					}),
				],
				capabilities: fakeCaps({ webgpuFeatures: ['shader-f16'] }),
				adapters: WEBLLM,
			});
			expect(result.rejections).toEqual([
				{
					id: 'two-feat',
					reasons: [{ kind: 'missing-feature', missing: ['timestamp-query'] }],
				},
			]);
		});

		it('an entry feasible on ONE runtime is not rejected (despite another runtime failing)', () => {
			// webllm feasible (webgpu, vram fits); wllama would fail size-class — but the
			// entry is feasible overall, so it must NOT appear in rejections at all.
			const mixed: ModelCatalogEntry = {
				id: 'mixed-feasible',
				family: 'test',
				params: '0.5B',
				sizeClass: 'mid',
				license: 'Apache-2.0',
				codeSpecialized: false,
				runtimes: [
					{
						load: {
							runtime: 'webllm',
							modelId: 'mixed-MLC',
							quant: 'q4f16_1',
							vramRequiredMB: 100,
						},
						fetchUrl: 'https://example.test/mixed',
					},
					{
						load: {
							runtime: 'wllama',
							repo: 'mixed-repo',
							file: 'm.gguf',
							quant: 'Q4_K_M',
						},
						fetchUrl: 'https://example.test/mixed',
					},
				],
			};
			const result = selectFeasible({
				catalog: [mixed],
				capabilities: fakeCaps(),
				adapters: { webllm: registeredAdapter, wllama: registeredAdapter },
			});
			expect(result.rejections).toEqual([]);
		});

		it('no-adapter is reported only for the unregistered runtime, not a registered-but-failing one', () => {
			const mixed: ModelCatalogEntry = {
				id: 'mixed-adapter',
				family: 'test',
				params: '0.5B',
				sizeClass: 'small',
				license: 'Apache-2.0',
				codeSpecialized: false,
				runtimes: [
					{
						load: {
							runtime: 'webllm',
							modelId: 'mixed-MLC',
							quant: 'q4f16_1',
							vramRequiredMB: 2000,
						},
						fetchUrl: 'https://example.test/mixed',
					},
					{
						load: {
							runtime: 'wllama',
							repo: 'mixed-repo',
							file: 'm.gguf',
							quant: 'Q4_K_M',
						},
						fetchUrl: 'https://example.test/mixed',
					},
				],
			};
			const result = selectFeasible({
				catalog: [mixed],
				capabilities: fakeCaps({ deviceMemoryGB: 2 }), // budget 1024 < 2000
				adapters: WEBLLM, // wllama NOT registered
			});
			expect(result.rejections).toEqual([
				{
					id: 'mixed-adapter',
					reasons: [
						{ kind: 'vram-too-large', requiredMB: 2000, budgetMB: 1024 },
						{ kind: 'no-adapter', runtime: 'wllama' },
					],
				},
			]);
		});

		it('partitions the catalog: feasible and rejected are disjoint and total', () => {
			const result = selectFeasible({
				catalog: [
					webllmEntry({ id: 'ok', vramRequiredMB: 100 }),
					webllmEntry({ id: 'huge', vramRequiredMB: 9000 }),
				],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
			});
			expect(result.feasible.map((entry) => entry.id)).toEqual(['ok']);
			expect(result.rejections.map((rejection) => rejection.id)).toEqual([
				'huge',
			]);
		});

		it('an entry rejected on every runtime lists one reason per runtime', () => {
			const multi: ModelCatalogEntry = {
				id: 'multi',
				family: 'test',
				params: '0.5B',
				sizeClass: 'mid',
				license: 'Apache-2.0',
				codeSpecialized: false,
				runtimes: [
					{
						load: {
							runtime: 'webllm',
							modelId: 'multi-MLC',
							quant: 'q4f16_1',
							vramRequiredMB: 100,
						},
						fetchUrl: 'https://example.test/multi',
					},
					{
						load: {
							runtime: 'wllama',
							repo: 'multi-repo',
							file: 'm.gguf',
							quant: 'Q4_K_M',
						},
						fetchUrl: 'https://example.test/multi',
					},
				],
			};
			const result = selectFeasible({
				catalog: [multi],
				capabilities: fakeCaps({ webgpu: false }),
				adapters: { webllm: registeredAdapter, wllama: registeredAdapter },
			});
			expect(result.rejections).toEqual([
				{
					id: 'multi',
					reasons: [
						{ kind: 'no-webgpu' },
						{ kind: 'size-class-too-large', sizeClass: 'mid', maxCpu: 'small' },
					],
				},
			]);
		});
	});

	describe('the fallback chain', () => {
		const ALL = { webllm: registeredAdapter, wllama: registeredAdapter };

		it('is empty when nothing is feasible', () => {
			const result = selectFeasible({
				catalog: [webllmEntry({ id: 'x', vramRequiredMB: 100 })],
				capabilities: fakeCaps({ webgpu: false }),
				adapters: { webllm: registeredAdapter },
			});
			expect(result.chain).toEqual([]);
		});

		it('a single feasible entry is the whole chain', () => {
			const result = selectFeasible({
				catalog: [webllmEntry({ id: 'solo', vramRequiredMB: 1000 })],
				capabilities: fakeCaps(),
				adapters: { webllm: registeredAdapter },
			});
			expect(result.chain.map((candidate) => candidate.entry.id)).toEqual([
				'solo',
			]);
		});

		it('a candidate carries the resolved runtime, load params, and weights URL', () => {
			const result = selectFeasible({
				catalog: [webllmEntry({ id: 'solo', vramRequiredMB: 1000 })],
				capabilities: fakeCaps(),
				adapters: { webllm: registeredAdapter },
			});
			const [head] = result.chain;
			expect(head?.runtime).toBe('webllm');
			expect(head?.load.runtime).toBe('webllm');
			expect(head?.fetchUrl).toBe('https://example.test/solo');
		});

		it('chain[0] is the cost-aware default', () => {
			const result = selectFeasible({
				catalog: [
					webllmEntry({ id: 'mid', sizeClass: 'mid', vramRequiredMB: 1500 }),
					webllmEntry({ id: 'tiny', sizeClass: 'tiny', vramRequiredMB: 500 }),
				],
				capabilities: fakeCaps(),
				adapters: { webllm: registeredAdapter },
			});
			expect(result.chain[0]?.entry.id).toBe('mid'); // largest within the cost ceiling
		});

		it('orders WebGPU candidates descending in size, then CPU/WASM', () => {
			const result = selectFeasible({
				catalog: [
					webllmEntry({
						id: 'gpu-mid',
						sizeClass: 'mid',
						vramRequiredMB: 1500,
					}),
					webllmEntry({
						id: 'gpu-small',
						sizeClass: 'small',
						vramRequiredMB: 1000,
					}),
					webllmEntry({
						id: 'gpu-tiny',
						sizeClass: 'tiny',
						vramRequiredMB: 500,
					}),
					wllamaEntry({ id: 'cpu-tiny', sizeClass: 'tiny' }),
				],
				capabilities: fakeCaps(),
				adapters: ALL,
			});
			expect(result.chain.map((candidate) => candidate.entry.id)).toEqual([
				'gpu-mid', // cost-aware default (chain[0])
				'gpu-small', // remaining WebGPU, descending
				'gpu-tiny',
				'cpu-tiny', // CPU/WASM after the WebGPU candidates
			]);
		});

		it('a named pin is a single-candidate chain (artifact-precise, no descent)', () => {
			// 'pinned' has a SMALLER sibling — a non-pin chain would descend onto it,
			// so the single-element result proves the pin suppresses the descent.
			const result = selectFeasible({
				catalog: [
					webllmEntry({
						id: 'pinned',
						sizeClass: 'small',
						vramRequiredMB: 1000,
					}),
					webllmEntry({
						id: 'smaller',
						sizeClass: 'tiny',
						vramRequiredMB: 500,
					}),
				],
				capabilities: fakeCaps(),
				adapters: { webllm: registeredAdapter },
				selection: { model: 'pinned' },
			});
			expect(result.chain.map((candidate) => candidate.entry.id)).toEqual([
				'pinned',
			]);
		});

		it('a feasible model heavier than the default is excluded (descent only, never ascent)', () => {
			const result = selectFeasible({
				catalog: [
					webllmEntry({
						id: 'small',
						sizeClass: 'small',
						vramRequiredMB: 1000,
					}),
					webllmEntry({
						id: 'strong',
						sizeClass: 'strong',
						vramRequiredMB: 3000, // feasible (budget 4096) but above the 2048 cost ceiling
					}),
				],
				capabilities: fakeCaps(),
				adapters: { webllm: registeredAdapter },
			});
			// default = 'small' (largest within the ceiling); 'strong' is heavier → opt-in only.
			expect(result.chain.map((candidate) => candidate.entry.id)).toEqual([
				'small',
			]);
		});

		it('excludes heavier-than-default candidates even in a multi-element chain', () => {
			const result = selectFeasible({
				catalog: [
					webllmEntry({
						id: 'strong',
						sizeClass: 'strong',
						vramRequiredMB: 3000,
					}),
					webllmEntry({ id: 'mid', sizeClass: 'mid', vramRequiredMB: 1500 }),
					webllmEntry({
						id: 'small',
						sizeClass: 'small',
						vramRequiredMB: 1000,
					}),
					webllmEntry({ id: 'tiny', sizeClass: 'tiny', vramRequiredMB: 500 }),
				],
				capabilities: fakeCaps({ deviceMemoryGB: 16 }), // budget 8192, all feasible
				adapters: { webllm: registeredAdapter },
			});
			expect(result.feasible.map((entry) => entry.id)).toContain('strong'); // feasible…
			expect(result.chain.map((candidate) => candidate.entry.id)).toEqual([
				'mid', // default (largest within the 2048 ceiling), then descending
				'small',
				'tiny', // 'strong' is heavier than the default → excluded from the chain
			]);
		});

		it('breaks same-class same-size chain ties by id ascending', () => {
			const result = selectFeasible({
				catalog: [
					webllmEntry({ id: 'zzz', sizeClass: 'tiny', vramRequiredMB: 400 }),
					webllmEntry({ id: 'aaa', sizeClass: 'tiny', vramRequiredMB: 400 }),
					webllmEntry({ id: 'mid', sizeClass: 'mid', vramRequiredMB: 1500 }),
				],
				capabilities: fakeCaps(),
				adapters: { webllm: registeredAdapter },
			});
			expect(result.chain.map((candidate) => candidate.entry.id)).toEqual([
				'mid',
				'aaa',
				'zzz',
			]);
		});

		it("prefer:'max' makes chain[0] the largest and descends from it", () => {
			const result = selectFeasible({
				catalog: [
					webllmEntry({
						id: 'small',
						sizeClass: 'small',
						vramRequiredMB: 1000,
					}),
					webllmEntry({
						id: 'strong',
						sizeClass: 'strong',
						vramRequiredMB: 3000,
					}),
				],
				capabilities: fakeCaps({ deviceMemoryGB: 16 }), // both feasible
				adapters: { webllm: registeredAdapter },
				selection: { prefer: 'max' },
			});
			// opting into 'max' makes 'strong' the head; the chain descends from there.
			expect(result.chain.map((candidate) => candidate.entry.id)).toEqual([
				'strong',
				'small',
			]);
		});

		it('a wllama candidate carries the wllama load variant', () => {
			const result = selectFeasible({
				catalog: [wllamaEntry({ id: 'cpu', sizeClass: 'tiny' })],
				capabilities: fakeCaps({ webgpu: false }),
				adapters: { wllama: registeredAdapter },
			});
			expect(result.chain[0]?.load.runtime).toBe('wllama');
		});

		it('chain[0] is the cheapest feasible when nothing fits the cost ceiling', () => {
			const result = selectFeasible({
				catalog: [
					webllmEntry({ id: 'mid', sizeClass: 'mid', vramRequiredMB: 3000 }),
					webllmEntry({
						id: 'strong',
						sizeClass: 'strong',
						vramRequiredMB: 6000,
					}),
				],
				capabilities: fakeCaps({ deviceMemoryGB: 16 }), // budget 8192; neither ≤ 2048
				adapters: { webllm: registeredAdapter },
			});
			// chain[0] = cheapest feasible; 'strong' is heavier than it → still excluded.
			expect(result.chain.map((candidate) => candidate.entry.id)).toEqual([
				'mid',
			]);
		});

		it('orders the chain tail by code-specialization before id', () => {
			const result = selectFeasible({
				catalog: [
					webllmEntry({ id: 'mid', sizeClass: 'mid', vramRequiredMB: 1500 }),
					webllmEntry({
						id: 'aaa-plain',
						sizeClass: 'small',
						vramRequiredMB: 1000,
						codeSpecialized: false,
					}),
					webllmEntry({
						id: 'zzz-coder',
						sizeClass: 'small',
						vramRequiredMB: 1000,
						codeSpecialized: true,
					}),
				],
				capabilities: fakeCaps(),
				adapters: { webllm: registeredAdapter },
			});
			// code-specialized leads despite its LATER id (id is the last-resort tiebreak).
			expect(result.chain.map((candidate) => candidate.entry.id)).toEqual([
				'mid',
				'zzz-coder',
				'aaa-plain',
			]);
		});
	});

	describe('malformed entry', () => {
		it('an entry with no runtimes is simply not feasible (no throw)', () => {
			const entry = { ...webllmEntry({ id: 'no-runtime' }), runtimes: [] };
			const result = selectFeasible({
				catalog: [entry],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
			});
			expect(result.feasible).toEqual([]);
		});
	});

	describe('default fallback when nothing fits the cost ceiling', () => {
		it('picks the cheapest feasible rung, not the largest', () => {
			const mid = webllmEntry({
				id: 'mid',
				sizeClass: 'mid',
				vramRequiredMB: 3000,
			});
			const strong = webllmEntry({
				id: 'strong',
				sizeClass: 'strong',
				vramRequiredMB: 6000,
			});
			const result = selectFeasible({
				catalog: [mid, strong],
				capabilities: fakeCaps({ deviceMemoryGB: 16 }),
				adapters: WEBLLM,
			});
			expect(result.chosen).toBe(mid);
		});
	});

	describe('sizeClass ceiling excludes every candidate', () => {
		it('chosen is null when no feasible entry fits the ceiling', () => {
			const result = selectFeasible({
				catalog: [webllmEntry({ sizeClass: 'mid', vramRequiredMB: 3000 })],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
				selection: { sizeClass: 'tiny' },
			});
			expect(result.chosen).toBeNull();
		});
	});

	describe('prefer policy id tiebreaks', () => {
		it("'max' breaks a full tie by id ascending", () => {
			const zzz = webllmEntry({
				id: 'zzz',
				sizeClass: 'small',
				vramRequiredMB: 1000,
			});
			const aaa = webllmEntry({
				id: 'aaa',
				sizeClass: 'small',
				vramRequiredMB: 1000,
			});
			const result = selectFeasible({
				catalog: [zzz, aaa],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
				selection: { prefer: 'max' },
			});
			expect(result.chosen).toBe(aaa);
		});

		it("'min' breaks a full tie by id ascending", () => {
			const zzz = webllmEntry({
				id: 'zzz',
				sizeClass: 'small',
				vramRequiredMB: 1000,
			});
			const aaa = webllmEntry({
				id: 'aaa',
				sizeClass: 'small',
				vramRequiredMB: 1000,
			});
			const result = selectFeasible({
				catalog: [zzz, aaa],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
				selection: { prefer: 'min' },
			});
			expect(result.chosen).toBe(aaa);
		});
	});

	describe('required WebGPU features', () => {
		it('no required features ignores the advertised feature set', () => {
			const entry = webllmEntry({ vramRequiredMB: 1000 });
			const result = selectFeasible({
				catalog: [entry],
				capabilities: fakeCaps({ webgpuFeatures: [] }),
				adapters: WEBLLM,
			});
			expect(result.feasible).toEqual([entry]);
		});

		it('an empty required-features list is no constraint', () => {
			const entry = webllmEntry({ vramRequiredMB: 1000, requiredFeatures: [] });
			const result = selectFeasible({
				catalog: [entry],
				capabilities: fakeCaps({ webgpuFeatures: [] }),
				adapters: WEBLLM,
			});
			expect(result.feasible).toEqual([entry]);
		});

		it('a required feature the adapter advertises is feasible', () => {
			const entry = webllmEntry({
				vramRequiredMB: 1000,
				requiredFeatures: ['shader-f16'],
			});
			const result = selectFeasible({
				catalog: [entry],
				capabilities: fakeCaps({ webgpuFeatures: ['shader-f16'] }),
				adapters: WEBLLM,
			});
			expect(result.feasible).toEqual([entry]);
		});

		it('a required feature the adapter lacks is not feasible', () => {
			const result = selectFeasible({
				catalog: [
					webllmEntry({
						vramRequiredMB: 1000,
						requiredFeatures: ['shader-f16'],
					}),
				],
				capabilities: fakeCaps({ webgpuFeatures: [] }),
				adapters: WEBLLM,
			});
			expect(result.feasible).toEqual([]);
		});

		it('a required feature is not feasible when the device reports no features', () => {
			const result = selectFeasible({
				catalog: [
					webllmEntry({
						vramRequiredMB: 1000,
						requiredFeatures: ['shader-f16'],
					}),
				],
				capabilities: fakeCaps(),
				adapters: WEBLLM,
			});
			expect(result.feasible).toEqual([]);
		});

		it('all of several required features advertised → feasible', () => {
			const entry = webllmEntry({
				vramRequiredMB: 1000,
				requiredFeatures: ['shader-f16', 'timestamp-query'],
			});
			const result = selectFeasible({
				catalog: [entry],
				capabilities: fakeCaps({
					webgpuFeatures: ['shader-f16', 'timestamp-query'],
				}),
				adapters: WEBLLM,
			});
			expect(result.feasible).toEqual([entry]);
		});

		it('only some of several required features advertised → not feasible', () => {
			const result = selectFeasible({
				catalog: [
					webllmEntry({
						vramRequiredMB: 1000,
						requiredFeatures: ['shader-f16', 'timestamp-query'],
					}),
				],
				capabilities: fakeCaps({ webgpuFeatures: ['shader-f16'] }),
				adapters: WEBLLM,
			});
			expect(result.feasible).toEqual([]);
		});

		it('a feature-requiring model is still refused with no WebGPU (guard coherence)', () => {
			const result = selectFeasible({
				catalog: [
					webllmEntry({
						vramRequiredMB: 1000,
						requiredFeatures: ['shader-f16'],
					}),
				],
				capabilities: fakeCaps({ webgpu: false }),
				adapters: WEBLLM,
			});
			expect(result.feasible).toEqual([]);
		});

		it('a feature-compatible model is still refused when vram is over budget', () => {
			const result = selectFeasible({
				catalog: [
					webllmEntry({
						vramRequiredMB: 5000,
						requiredFeatures: ['shader-f16'],
					}),
				],
				capabilities: fakeCaps({
					deviceMemoryGB: 8,
					webgpuFeatures: ['shader-f16'],
				}),
				adapters: WEBLLM,
			});
			expect(result.feasible).toEqual([]);
		});
	});
});
