import { prebuiltAppConfig } from '@mlc-ai/web-llm';
import { describe, expect, it } from 'vitest';

import DEFAULT_CATALOG from '../catalog.js';
import type { ModelCatalogEntry, RuntimeLoad, SizeClass } from '../types.js';

type WebllmLoad = Extract<RuntimeLoad, { runtime: 'webllm' }>;
type WebllmMember = ModelCatalogEntry['runtimes'][number] & {
	readonly load: WebllmLoad;
};

const prebuilt = (modelId: string) =>
	prebuiltAppConfig.model_list.find((record) => record.model_id === modelId);

// Each webllm runtime member, paired with its entry id, for per-load validation.
const webllmMembers: readonly [string, WebllmMember][] =
	DEFAULT_CATALOG.flatMap((entry) =>
		entry.runtimes
			.filter(
				(member): member is WebllmMember => member.load.runtime === 'webllm',
			)
			.map((member) => [entry.id, member] as [string, WebllmMember]),
	);

const entriesById: readonly [string, ModelCatalogEntry][] = DEFAULT_CATALOG.map(
	(entry) => [entry.id, entry] as [string, ModelCatalogEntry],
);

const EXPECTED_IDS = [
	'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC',
	'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
	'Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC',
	'SmolLM2-360M-Instruct-q4f16_1-MLC',
	'Qwen3-4B-q4f16_1-MLC',
	'Phi-4-mini-instruct-q4f16_1-MLC',
	'gemma-2-2b-it-q4f16_1-MLC',
] as const;

const EXPECTED_LICENSES: readonly [string, string][] = [
	['Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC', 'Apache-2.0'],
	['Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC', 'Apache-2.0'],
	['Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC', 'Apache-2.0'],
	['SmolLM2-360M-Instruct-q4f16_1-MLC', 'Apache-2.0'],
	['Qwen3-4B-q4f16_1-MLC', 'Apache-2.0'],
	['Phi-4-mini-instruct-q4f16_1-MLC', 'MIT'],
	['gemma-2-2b-it-q4f16_1-MLC', 'Gemma'],
];

const EXPECTED_SIZE_CLASSES: readonly [string, SizeClass][] = [
	['Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC', 'tiny'],
	['Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC', 'small'],
	['Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC', 'strong'],
	['SmolLM2-360M-Instruct-q4f16_1-MLC', 'tiny'],
	['Qwen3-4B-q4f16_1-MLC', 'mid'],
	['Phi-4-mini-instruct-q4f16_1-MLC', 'mid'],
	['gemma-2-2b-it-q4f16_1-MLC', 'small'],
];

describe('DEFAULT_CATALOG', () => {
	describe('seeds the verified browser ladder', () => {
		it.each(EXPECTED_IDS)('contains an entry with id %s', (id) => {
			expect(DEFAULT_CATALOG.some((entry) => entry.id === id)).toBe(true);
		});

		it('contains exactly the expected number of entries', () => {
			expect(DEFAULT_CATALOG.length).toBe(EXPECTED_IDS.length);
		});
	});

	describe('every webllm load is real (validated against prebuiltAppConfig)', () => {
		it.each(webllmMembers)(
			'%s modelId is in the prebuilt list',
			(_id, member) => {
				expect(prebuilt(member.load.modelId)).toBeDefined();
			},
		);

		it.each(webllmMembers)(
			'%s vramRequiredMB matches prebuilt',
			(_id, member) => {
				expect(member.load.vramRequiredMB).toBe(
					prebuilt(member.load.modelId)?.vram_required_MB,
				);
			},
		);

		it.each(webllmMembers)(
			'%s contextWindowSize matches prebuilt',
			(_id, member) => {
				expect(member.load.contextWindowSize).toBe(
					prebuilt(member.load.modelId)?.overrides?.context_window_size,
				);
			},
		);

		it.each(webllmMembers)(
			'%s lowResourceRequired matches prebuilt',
			(_id, member) => {
				expect(member.load.lowResourceRequired).toBe(
					prebuilt(member.load.modelId)?.low_resource_required,
				);
			},
		);

		it.each(webllmMembers)(
			'%s requiredFeatures matches prebuilt (catches omission)',
			(_id, member) => {
				expect(member.load.requiredFeatures ?? []).toEqual(
					prebuilt(member.load.modelId)?.required_features ?? [],
				);
			},
		);
	});

	describe('structural interfaces', () => {
		it('all ids are unique', () => {
			expect(new Set(DEFAULT_CATALOG.map((entry) => entry.id)).size).toBe(
				DEFAULT_CATALOG.length,
			);
		});

		it.each(entriesById)('%s has at least one webllm runtime', (_id, entry) => {
			expect(
				entry.runtimes.some((member) => member.load.runtime === 'webllm'),
			).toBe(true);
		});

		it.each(webllmMembers)(
			'%s fetchUrl contains its modelId',
			(_id, member) => {
				expect(member.fetchUrl.includes(member.load.modelId)).toBe(true);
			},
		);

		it.each(webllmMembers)('%s quant is q4f16_1', (_id, member) => {
			expect(member.load.quant).toBe('q4f16_1');
		});

		it.each(EXPECTED_LICENSES)('%s license is %s', (id, license) => {
			expect(DEFAULT_CATALOG.find((entry) => entry.id === id)?.license).toBe(
				license,
			);
		});

		it.each(EXPECTED_SIZE_CLASSES)('%s sizeClass is %s', (id, sizeClass) => {
			expect(DEFAULT_CATALOG.find((entry) => entry.id === id)?.sizeClass).toBe(
				sizeClass,
			);
		});
	});

	describe('shape', () => {
		it('is deep-frozen', () => {
			expect(Object.isFrozen(DEFAULT_CATALOG)).toBe(true);
		});
	});
});
