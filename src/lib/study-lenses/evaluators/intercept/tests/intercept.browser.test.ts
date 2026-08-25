// cspell:ignore unmocked
import { describe, expect, it } from 'vitest';

import deriveFacts from '../../../embody/derive-facts.js';
import intercept from '../index.js';
import type {
	InterceptEvent,
	InterceptHandle,
	InterceptSpec,
} from '../types.js';

function buildSpec(source: string): InterceptSpec {
	return {
		facts: deriveFacts({ source, type: 'script' }),
		execution: 'function',
	};
}

function expectHandle(
	answer: ReturnType<typeof intercept.main>,
): InterceptHandle {
	if ('refused' in answer) {
		throw new Error(`expected a handle, got a refusal: ${answer.reason}`);
	}
	return answer;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('intercept — the stream (worker order, steps, one shot)', () => {
	it.skip('console moments arrive in worker order', async () => {
		const source = "console.log('one');\nconsole.log('two');\n";
		const events: InterceptEvent[] = [];
		for await (const event of expectHandle(intercept.main(buildSpec(source)))) {
			events.push(event);
		}
		expect(
			events.map((event) => (event.event === 'console' ? event.args[0] : '?')),
		).toEqual(['one', 'two']);
	});

	it.skip('steps are strictly increasing', async () => {
		const source = "console.log('a');\nconsole.log('b');\n";
		const steps: number[] = [];
		for await (const event of expectHandle(intercept.main(buildSpec(source)))) {
			steps.push(event.step);
		}
		expect(steps[1] > steps[0]).toBe(true);
	});

	it.skip('a mocked dialog leaves a step GAP — the ask consumed an ordinal', async () => {
		const spec: InterceptSpec = {
			...buildSpec("console.log('before');\nlet x = prompt();\n"),
			io: { prompt: () => 'answered' },
		};
		const result = await expectHandle(intercept.main(spec));
		const steps = result.events.map((event) => event.step);
		expect(
			steps.some((step, index) => index > 0 && step > steps[index - 1] + 1),
		).toBe(true);
	});

	it.skip('an exotic console method records faithfully (whole-surface trap)', async () => {
		const result = await expectHandle(
			intercept.main(buildSpec("console.profile('p');\n")),
		);
		expect(
			result.events.some(
				(event) => event.event === 'console' && event.method === 'profile',
			),
		).toBe(true);
	});

	it.skip('a settled stream does not replay', async () => {
		const handle = expectHandle(
			intercept.main(buildSpec("console.log('x');\n")),
		);
		const first: InterceptEvent[] = [];
		for await (const event of handle) {
			first.push(event);
		}
		const second: InterceptEvent[] = [];
		for await (const event of handle) {
			second.push(event);
		}
		expect(first.length > 0 && second.length === 0).toBe(true);
	});
});

describe('intercept — the generator surface', () => {
	it.skip('next() steps one moment', async () => {
		const handle = expectHandle(
			intercept.main(buildSpec("console.log('a');\n")),
		);
		const first = await handle.next();
		expect(first.done === false && first.value.event).toBe('console');
	});

	it.skip('stepping then looping continues — no restart, no replay', async () => {
		const source = "console.log('a');\nconsole.log('b');\nconsole.log('c');\n";
		const handle = expectHandle(intercept.main(buildSpec(source)));
		await handle.next();
		await handle.next();
		const rest: InterceptEvent[] = [];
		for await (const event of handle) {
			rest.push(event);
		}
		expect(
			rest.map((event) => (event.event === 'console' ? event.args[0] : '?')),
		).toEqual(['c']);
	});

	it.skip('return() resolves the COMPLETE result after settlement', async () => {
		const handle = expectHandle(
			intercept.main(buildSpec("console.log('a');\nconsole.log('b');\n")),
		);
		await handle.next();
		const closed = await handle.return();
		expect(closed.done === true && closed.value.outcome === 'cancel').toBe(
			true,
		);
	});

	it.skip('for-await break awaits settlement — the stated behavior change', async () => {
		const handle = expectHandle(
			intercept.main(buildSpec("console.log('a');\nconsole.log('b');\n")),
		);
		for await (const event of handle) {
			if (event.step >= 1) break;
		}
		const result = await handle.result;
		expect(result.outcome).toBe('cancel');
	});

	it.skip('throw(thrown) settles fail with the reason, by reference', async () => {
		const handle = expectHandle(
			intercept.main(buildSpec("console.log('a');\nconsole.log('b');\n")),
		);
		await handle.next();
		const thrown = new Error('wrong prediction');
		const closed = await handle.throw(thrown);
		expect(
			closed.done === true &&
				closed.value.outcome === 'fail' &&
				closed.value.reason,
		).toBe(thrown);
	});
});

describe('intercept — asks and answers', () => {
	it.skip('a mock answers BEFORE a pending interaction is minted', async () => {
		const spec: InterceptSpec = {
			...buildSpec('let x = prompt();\n'),
			io: { prompt: () => 'answered' },
		};
		const result = await expectHandle(intercept.main(spec));
		expect(
			result.events.some((event) => event.event === 'pending-interaction'),
		).toBe(false);
	});

	it.skip('the answered record carries what the program received', async () => {
		const spec: InterceptSpec = {
			...buildSpec('let x = prompt();\n'),
			io: { prompt: () => 'answered' },
		};
		const result = await expectHandle(intercept.main(spec));
		expect(
			result.events.some(
				(event) => event.event === 'prompt' && event.return === 'answered',
			),
		).toBe(true);
	});

	it.skip('an unmocked ask while stepping is a pending interaction; respond resumes', async () => {
		const handle = expectHandle(
			intercept.main(buildSpec('let x = prompt();\n')),
		);
		for await (const event of handle) {
			if (event.event === 'pending-interaction') {
				event.respond('resumed');
			}
		}
		const result = await handle.result;
		expect(result.outcome).toBe('complete');
	});

	it.skip('answering twice is inert — the first answer won', async () => {
		const handle = expectHandle(
			intercept.main(buildSpec('let x = prompt();\n')),
		);
		for await (const event of handle) {
			if (event.event === 'pending-interaction') {
				event.respond('first');
				event.respond('second');
			}
		}
		const result = await handle.result;
		expect(
			result.events.some(
				(event) => event.event === 'prompt' && event.return === 'first',
			),
		).toBe(true);
	});

	it.skip('answering after teardown is a no-op', async () => {
		const handle = expectHandle(
			intercept.main(buildSpec('let x = prompt();\n')),
		);
		let pending: (answer: string) => void = () => {};
		for await (const event of handle) {
			if (event.event === 'pending-interaction') {
				pending = event.respond;
				break;
			}
		}
		await handle.result;
		expect(() => pending('too late')).not.toThrow();
	});

	it.skip('a wrong answer shape is a loud, retryable error at the responder', async () => {
		const handle = expectHandle(
			intercept.main(buildSpec('let x = prompt();\n')),
		);
		let threwLoudly = false;
		for await (const event of handle) {
			if (event.event === 'pending-interaction') {
				try {
					event.respond(42 as unknown as string);
				} catch {
					threwLoudly = true;
				}
				event.respond('valid');
			}
		}
		const result = await handle.result;
		expect(threwLoudly && result.outcome === 'complete').toBe(true);
	});

	it.skip('under a batch drain an unmocked ask cancels the run — the structural posture', async () => {
		const result = await expectHandle(
			intercept.main(buildSpec("console.log('before');\nlet x = prompt();\n")),
		);
		expect(
			result.outcome === 'cancel' &&
				result.events.some((event) => event.event === 'console'),
		).toBe(true);
	});

	it.skip('an unmocked dialog while stepping is two adjacent moments in events', async () => {
		const handle = expectHandle(
			intercept.main(buildSpec('let x = prompt();\n')),
		);
		for await (const event of handle) {
			if (event.event === 'pending-interaction') {
				event.respond('answered');
			}
		}
		const result = await handle.result;
		const askIndex = result.events.findIndex(
			(event) => event.event === 'pending-interaction',
		);
		expect(result.events[askIndex + 1]?.event).toBe('prompt');
	});

	it.skip('an invalid mock answer is an io error, never a coercion', async () => {
		const spec: InterceptSpec = {
			...buildSpec('let a = confirm();\n'),
			io: { confirm: () => undefined as unknown as boolean },
		};
		const result = await expectHandle(intercept.main(spec));
		expect(result.outcome === 'error' && result.error.kind).toBe('io');
	});

	it.skip('a throwing console callback is an io error naming its source', async () => {
		const spec: InterceptSpec = {
			...buildSpec("console.log('x');\n"),
			io: {
				console: {
					log: () => {
						throw new Error('callback broke');
					},
				},
			},
		};
		const result = await expectHandle(intercept.main(spec));
		expect(
			result.outcome === 'error' &&
				result.error.kind === 'io' &&
				result.error.source,
		).toBe('console.log');
	});
});

describe('intercept — outcomes and consumer stops', () => {
	it.skip('a trivial program completes ok', async () => {
		const result = await expectHandle(intercept.main(buildSpec('1 + 1;\n')));
		expect(result.ok).toBe(true);
	});

	it.skip('fail settles ok:true with the reason by reference', async () => {
		const handle = expectHandle(
			intercept.main(buildSpec("console.log('a');\nconsole.log('b');\n")),
		);
		const reason = { predicted: 'wrongly' };
		await handle.next();
		handle.fail(reason);
		const result = await handle.result;
		expect(
			result.outcome === 'fail' && result.ok === true && result.reason,
		).toBe(reason);
	});

	it.skip('cancel outranks a failing mock — step 0', async () => {
		const spec: InterceptSpec = {
			...buildSpec('let x = prompt();\n'),
			io: {
				prompt: async () => {
					await sleep(200);
					throw new Error('failed after the stop');
				},
			},
		};
		const handle = expectHandle(intercept.main(spec));
		const settling = handle.result;
		await sleep(50);
		handle.cancel();
		const result = await settling;
		expect(result.outcome).toBe('cancel');
	});

	it.skip('a learner throw carries the attributed call site', async () => {
		const result = await expectHandle(intercept.main(buildSpec('null();\n')));
		expect(
			result.outcome === 'error' &&
				result.error.kind === 'javascript' &&
				result.error.loc !== null,
		).toBe(true);
	});

	it.skip('a capped loop trips with the whole trip record and the real total', async () => {
		const spec = { ...buildSpec('while (true) {}\n'), iterations: 50 };
		const result = await expectHandle(intercept.main(spec));
		expect(
			result.outcome === 'iteration-limit' &&
				result.error.trip.loopIndex === 1 &&
				result.error.iterationCount >= 50,
		).toBe(true);
	});

	it.skip('an uncapped spec keeps the per-yield fee — pin :495’s own case', async () => {
		const source = Array.from(
			{ length: 200 },
			(_unused, index) => `console.log(${index});`,
		).join('\n');
		const spec = { ...buildSpec(`${source}\n`), seconds: 0.3 };
		const result = await expectHandle(intercept.main(spec));
		expect(result.outcome).toBe('timeout');
	});

	it.skip('the timeout arm echoes limit and durationMs', async () => {
		const spec = { ...buildSpec('while (true) {}\n'), seconds: 0.3 };
		const result = await expectHandle(intercept.main(spec));
		expect(
			result.outcome === 'timeout' &&
				result.error.limit === 0.3 &&
				typeof result.error.durationMs === 'number',
		).toBe(true);
	});
});

describe('intercept — enrichment and the joins', () => {
	it.skip('a console moment carries loc, offsets, and nodePath together', async () => {
		const result = await expectHandle(
			intercept.main(buildSpec("console.log('x');\n")),
		);
		const record = result.events.find((event) => event.event === 'console');
		expect(
			record?.loc !== null &&
				record?.start !== null &&
				record?.nodePath !== null,
		).toBe(true);
	});

	it.skip('offsets are valid in the facts’ coordinate space', async () => {
		const spec = buildSpec("console.log('x');\n");
		const result = await expectHandle(intercept.main(spec));
		const record = result.events.find((event) => event.event === 'console');
		expect(
			record?.start !== null &&
				record !== undefined &&
				spec.facts.source.value.slice(record.start ?? 0, record.end ?? 0),
		).toContain('console.log');
	});

	it.skip('event.node answers the real entwined node without an enumerable key', async () => {
		const result = await expectHandle(
			intercept.main(buildSpec("console.log('x');\n")),
		);
		const record = result.events.find((event) => event.event === 'console');
		expect(
			record?.node !== null && !Object.keys(record ?? {}).includes('node'),
		).toBe(true);
	});

	it.skip('serializing an event never cycles', async () => {
		const result = await expectHandle(
			intercept.main(buildSpec("console.log('x');\n")),
		);
		expect(() => JSON.stringify(result.events)).not.toThrow();
	});

	it.skip('prev and next chain the timeline as accessors', async () => {
		const result = await expectHandle(
			intercept.main(buildSpec("console.log('a');\nconsole.log('b');\n")),
		);
		expect(result.events[1]?.prev).toBe(result.events[0]);
	});

	it.skip('visitCounts counts records, keyed by resolved nodePath', async () => {
		const result = await expectHandle(
			intercept.main(buildSpec("console.log('a');\nconsole.log('b');\n")),
		);
		expect(Object.values(result.visitCounts).reduce((a, b) => a + b, 0)).toBe(
			2,
		);
	});

	it.skip('a mocked dialog counts once — records, not delivered events', async () => {
		const spec: InterceptSpec = {
			...buildSpec('let x = prompt();\n'),
			io: { prompt: () => 'answered' },
		};
		const result = await expectHandle(intercept.main(spec));
		expect(Object.values(result.visitCounts).reduce((a, b) => a + b, 0)).toBe(
			1,
		);
	});

	it.skip('eventsByNode joins every event, asks included', async () => {
		const handle = expectHandle(
			intercept.main(buildSpec('let x = prompt();\n')),
		);
		for await (const event of handle) {
			if (event.event === 'pending-interaction') {
				event.respond('answered');
			}
		}
		const result = await handle.result;
		const joined = Object.values(result.eventsByNode).flat();
		expect(joined.some((event) => event.event === 'pending-interaction')).toBe(
			true,
		);
	});

	it.skip('an in-stream error event lands in order with its step', async () => {
		const result = await expectHandle(
			intercept.main(buildSpec("console.log('before');\nnull();\n")),
		);
		const errorIndex = result.events.findIndex(
			(event) => event.event === 'error',
		);
		expect(errorIndex).toBeGreaterThan(0);
	});

	it.skip('an io failure’s stream event carries source; a learner throw’s does not', async () => {
		const ioSpec: InterceptSpec = {
			...buildSpec('let a = confirm();\n'),
			io: { confirm: () => undefined as unknown as boolean },
		};
		const ioResult = await expectHandle(intercept.main(ioSpec));
		const ioStreamed = ioResult.events.find((event) => event.event === 'error');
		const throwResult = await expectHandle(
			intercept.main(buildSpec('null();\n')),
		);
		const throwStreamed = throwResult.events.find(
			(event) => event.event === 'error',
		);
		expect(
			ioStreamed?.event === 'error' &&
				ioStreamed.source !== undefined &&
				throwStreamed?.event === 'error' &&
				throwStreamed.source === undefined,
		).toBe(true);
	});

	it.skip('the result is deep-frozen', async () => {
		const result = await expectHandle(intercept.main(buildSpec('1 + 1;\n')));
		expect(Object.isFrozen(result)).toBe(true);
	});

	it.skip('result.entwined is the handle’s own echo', async () => {
		const handle = expectHandle(intercept.main(buildSpec('1 + 1;\n')));
		const result = await handle;
		expect(result.entwined).toBe(handle.entwined);
	});
});
