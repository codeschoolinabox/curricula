import { describe, expect, it } from 'vitest';

import type { LoadProgress, RuntimeLoad } from '../types.js';
import makeWebllmAdapter from '../webllm-adapter.js';

// Inline fake WebLLM (single consumer — stays out of fakes.ts). Records the
// modelIds brought up and the chat requests sent, and drives the
// initProgressCallback with a fetch-phase then a load-phase report. Cast through
// `unknown` to the real web-llm seam types — a deliberate test-fixture cast.
type RealCreateEngine = typeof import('@mlc-ai/web-llm').CreateMLCEngine;
type RealAppConfig = typeof import('@mlc-ai/web-llm').prebuiltAppConfig;

type FakeRequest = {
	messages: readonly { role: string; content: string }[];
	temperature?: number;
	max_tokens?: number;
};

const webllmLoad = (modelId: string): RuntimeLoad => ({
	runtime: 'webllm',
	modelId,
	quant: 'q4f16_1',
});

const createFakeWebllm = (
	options: { reply?: string | null; modelIds?: readonly string[] } = {},
) => {
	const reply = options.reply === undefined ? '' : options.reply;
	const modelIds = options.modelIds ?? ['known-model-MLC'];
	const engineCalls: string[] = [];
	const requests: FakeRequest[] = [];

	const create = (request: FakeRequest) => {
		requests.push(request);
		return Promise.resolve({ choices: [{ message: { content: reply } }] });
	};

	const createEngine = ((
		modelId: string,
		config?: {
			initProgressCallback?: (report: {
				progress: number;
				text: string;
				timeElapsed: number;
			}) => void;
		},
	) => {
		engineCalls.push(modelId);
		config?.initProgressCallback?.({
			progress: 0.5,
			text: 'Fetching params',
			timeElapsed: 0,
		});
		config?.initProgressCallback?.({
			progress: 1,
			text: 'Loading model to GPU',
			timeElapsed: 0,
		});
		return Promise.resolve({ chat: { completions: { create } } });
	}) as unknown as RealCreateEngine;

	const appConfig = {
		model_list: modelIds.map((modelId) => ({ model_id: modelId })),
	} as unknown as RealAppConfig;

	return { createEngine, appConfig, engineCalls, requests };
};

const makeAdapter = (fake: ReturnType<typeof createFakeWebllm>) =>
	makeWebllmAdapter({
		createEngine: fake.createEngine,
		appConfig: fake.appConfig,
	});

describe('makeWebllmAdapter', () => {
	describe('runtime narrowing', () => {
		it('throws when the load is not a webllm load', async () => {
			const fake = createFakeWebllm();
			const adapter = makeAdapter(fake);
			const notWebllm = {
				runtime: 'transformers-js',
				repoId: 'x',
				preferredDtype: 'q4',
				availableDtypes: ['q4'],
			} as unknown as RuntimeLoad;
			await expect(adapter(notWebllm, 'url')).rejects.toThrow();
		});
	});

	describe('prompt delivery', () => {
		it('sends the prompt as a single user message (no system role)', async () => {
			const fake = createFakeWebllm({ modelIds: ['m-MLC'] });
			const model = await makeAdapter(fake)(webllmLoad('m-MLC'), 'url');
			await model.generate('hello');
			expect(fake.requests[0]?.messages).toEqual([
				{ role: 'user', content: 'hello' },
			]);
		});

		it('echoes a different prompt into the user message content', async () => {
			const fake = createFakeWebllm({ modelIds: ['m-MLC'] });
			const model = await makeAdapter(fake)(webllmLoad('m-MLC'), 'url');
			await model.generate('a totally different prompt');
			expect(fake.requests[0]?.messages).toEqual([
				{ role: 'user', content: 'a totally different prompt' },
			]);
		});
	});

	describe('model membership', () => {
		it('throws when the modelId is absent from the app config (id in message)', async () => {
			const fake = createFakeWebllm({ modelIds: ['known-MLC'] });
			await expect(
				makeAdapter(fake)(webllmLoad('ghost-MLC'), 'url'),
			).rejects.toThrow('ghost-MLC');
		});
	});

	describe('per-family sampling defaults', () => {
		it('a coder modelId forwards the coder temperature', async () => {
			const id = 'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC';
			const fake = createFakeWebllm({ modelIds: [id] });
			const model = await makeAdapter(fake)(webllmLoad(id), 'url');
			await model.generate('x');
			expect(fake.requests[0]?.temperature).toBe(0.2);
		});

		it('a coder modelId forwards the coder max_tokens', async () => {
			const id = 'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC';
			const fake = createFakeWebllm({ modelIds: [id] });
			const model = await makeAdapter(fake)(webllmLoad(id), 'url');
			await model.generate('x');
			expect(fake.requests[0]?.max_tokens).toBe(1024);
		});

		it('an unknown-family modelId forwards the global fallback temperature', async () => {
			const id = 'some-unknown-model-MLC';
			const fake = createFakeWebllm({ modelIds: [id] });
			const model = await makeAdapter(fake)(webllmLoad(id), 'url');
			await model.generate('x');
			expect(fake.requests[0]?.temperature).toBe(0.4);
		});

		it('an unknown-family modelId forwards the global fallback max_tokens', async () => {
			const id = 'some-unknown-model-MLC';
			const fake = createFakeWebllm({ modelIds: [id] });
			const model = await makeAdapter(fake)(webllmLoad(id), 'url');
			await model.generate('x');
			expect(fake.requests[0]?.max_tokens).toBe(512);
		});
	});

	describe('one-time fetch progress', () => {
		it('maps the first report to a full fetch-phase LoadProgress', async () => {
			const fake = createFakeWebllm({ modelIds: ['m-MLC'] });
			const events: LoadProgress[] = [];
			await makeAdapter(fake)(webllmLoad('m-MLC'), 'url', (progress) =>
				events.push(progress),
			);
			expect(events[0]).toEqual({
				phase: 'fetch',
				text: 'Fetching params',
				ratio: 0.5,
			});
		});

		it('maps the second report to a full load-phase LoadProgress', async () => {
			const fake = createFakeWebllm({ modelIds: ['m-MLC'] });
			const events: LoadProgress[] = [];
			await makeAdapter(fake)(webllmLoad('m-MLC'), 'url', (progress) =>
				events.push(progress),
			);
			expect(events[1]).toEqual({
				phase: 'load',
				text: 'Loading model to GPU',
				ratio: 1,
			});
		});

		it('does not throw when onProgress is omitted', async () => {
			const fake = createFakeWebllm({ modelIds: ['m-MLC'] });
			await expect(
				makeAdapter(fake)(webllmLoad('m-MLC'), 'url'),
			).resolves.toBeDefined();
		});
	});

	describe('statelessness', () => {
		it('builds a fresh engine on each call (no internal caching)', async () => {
			const fake = createFakeWebllm({ modelIds: ['m-MLC'] });
			const adapter = makeAdapter(fake);
			await adapter(webllmLoad('m-MLC'), 'url');
			await adapter(webllmLoad('m-MLC'), 'url');
			expect(fake.engineCalls.length).toBe(2);
		});
	});

	describe('reply decomposition', () => {
		it('returns the decomposed code of a fenced reply', async () => {
			const fake = createFakeWebllm({
				modelIds: ['m-MLC'],
				reply: '```js\nconst x = 1;\n```',
			});
			const model = await makeAdapter(fake)(webllmLoad('m-MLC'), 'url');
			const result = await model.generate('x');
			expect(result.code).toBe('const x = 1;\n');
		});

		it('a null reply content yields an empty code without throwing', async () => {
			const fake = createFakeWebllm({ modelIds: ['m-MLC'], reply: null });
			const model = await makeAdapter(fake)(webllmLoad('m-MLC'), 'url');
			const result = await model.generate('x');
			expect(result.code).toBe('');
		});
	});
});
