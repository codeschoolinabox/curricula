import { describe, expect, it } from 'vitest';

import selectFeasible from '../feasibility.js';

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
		it('an unknown model id throws (the id is in the message)', () => {
			expect(() =>
				selectFeasible({
					catalog: [webllmEntry({ id: 'real', vramRequiredMB: 1000 })],
					capabilities: fakeCaps(),
					adapters: WEBLLM,
					selection: { model: 'ghost' },
				}),
			).toThrow('ghost');
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
