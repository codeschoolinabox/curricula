/**
 * @file The default model catalog — the open, growing data set of candidate
 * models (README § Ubiquitous language; "the catalog is data, not an enum").
 * Deliberately does NOT import `@mlc-ai/web-llm`: the catalog is cheap-to-import
 * data, so its validation against the real `prebuiltAppConfig` lives in the test
 * (tests/catalog.test.ts), not here.
 *
 * Each `vramRequiredMB` / `contextWindowSize` / `lowResourceRequired` /
 * `requiredFeatures` is the value WebLLM reports for that `modelId` in
 * `prebuiltAppConfig` (web-llm 0.2.84); the test fails on any drift. `license` is
 * PER-MODEL and never inferred from family — values are the recognizable name
 * (`Apache-2.0`, `MIT`, `Gemma`), not SPDX identifiers.
 */

/* eslint-disable sonarjs/no-duplicate-string -- explicit catalog data: each
   modelId repeats across id / load.modelId / fetchUrl by design, so every entry
   reads as a self-contained data row (and the test validates each against the
   real prebuiltAppConfig). */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { ModelCatalog } from './types.js';

const DEFAULT_CATALOG: ModelCatalog = freezeInPlace([
	{
		id: 'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC',
		family: 'Qwen2.5-Coder',
		params: '0.5B',
		sizeClass: 'tiny',
		license: 'Apache-2.0',
		codeSpecialized: true,
		runtimes: [
			{
				load: {
					runtime: 'webllm',
					modelId: 'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC',
					quant: 'q4f16_1',
					vramRequiredMB: 944.62,
					contextWindowSize: 4096,
					lowResourceRequired: true,
				},
				fetchUrl:
					'https://huggingface.co/mlc-ai/Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC',
			},
		],
	},
	{
		id: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
		family: 'Qwen2.5-Coder',
		params: '1.5B',
		sizeClass: 'small',
		license: 'Apache-2.0',
		codeSpecialized: true,
		runtimes: [
			{
				load: {
					runtime: 'webllm',
					modelId: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
					quant: 'q4f16_1',
					vramRequiredMB: 1629.75,
					contextWindowSize: 4096,
					lowResourceRequired: false,
				},
				fetchUrl:
					'https://huggingface.co/mlc-ai/Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
			},
		],
	},
	{
		id: 'Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC',
		family: 'Qwen2.5-Coder',
		params: '7B',
		sizeClass: 'strong',
		license: 'Apache-2.0',
		codeSpecialized: true,
		runtimes: [
			{
				load: {
					runtime: 'webllm',
					modelId: 'Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC',
					quant: 'q4f16_1',
					vramRequiredMB: 5106.67,
					contextWindowSize: 4096,
					lowResourceRequired: false,
				},
				fetchUrl:
					'https://huggingface.co/mlc-ai/Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC',
			},
		],
	},
	{
		id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
		family: 'SmolLM2',
		params: '360M',
		sizeClass: 'tiny',
		license: 'Apache-2.0',
		codeSpecialized: false,
		runtimes: [
			{
				load: {
					runtime: 'webllm',
					modelId: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
					quant: 'q4f16_1',
					vramRequiredMB: 376.06,
					contextWindowSize: 4096,
					lowResourceRequired: true,
					requiredFeatures: ['shader-f16'],
				},
				fetchUrl:
					'https://huggingface.co/mlc-ai/SmolLM2-360M-Instruct-q4f16_1-MLC',
			},
		],
	},
	{
		id: 'Qwen3-4B-q4f16_1-MLC',
		family: 'Qwen3',
		params: '4B',
		sizeClass: 'mid',
		license: 'Apache-2.0',
		codeSpecialized: false,
		runtimes: [
			{
				load: {
					runtime: 'webllm',
					modelId: 'Qwen3-4B-q4f16_1-MLC',
					quant: 'q4f16_1',
					vramRequiredMB: 3431.59,
					contextWindowSize: 4096,
					// prebuilt reports low_resource_required=true despite ~3.4 GB VRAM (web-llm 0.2.84) — kept to match; the test enforces it
					lowResourceRequired: true,
				},
				fetchUrl: 'https://huggingface.co/mlc-ai/Qwen3-4B-q4f16_1-MLC',
			},
		],
	},
	{
		id: 'Phi-4-mini-instruct-q4f16_1-MLC',
		family: 'Phi-4',
		params: '3.8B',
		sizeClass: 'mid',
		license: 'MIT',
		codeSpecialized: false,
		runtimes: [
			{
				load: {
					runtime: 'webllm',
					modelId: 'Phi-4-mini-instruct-q4f16_1-MLC',
					quant: 'q4f16_1',
					vramRequiredMB: 3437.58,
					contextWindowSize: 4096,
					lowResourceRequired: false,
				},
				fetchUrl:
					'https://huggingface.co/mlc-ai/Phi-4-mini-instruct-q4f16_1-MLC',
			},
		],
	},
	{
		id: 'gemma-2-2b-it-q4f16_1-MLC',
		family: 'gemma-2',
		params: '2B',
		sizeClass: 'small',
		license: 'Gemma',
		codeSpecialized: false,
		runtimes: [
			{
				load: {
					runtime: 'webllm',
					modelId: 'gemma-2-2b-it-q4f16_1-MLC',
					quant: 'q4f16_1',
					vramRequiredMB: 1895.3,
					contextWindowSize: 4096,
					lowResourceRequired: false,
					requiredFeatures: ['shader-f16'],
				},
				fetchUrl: 'https://huggingface.co/mlc-ai/gemma-2-2b-it-q4f16_1-MLC',
			},
		],
	},
]);

export default DEFAULT_CATALOG;
