import { describe, expect, it } from 'vitest';

import deriveFacts from '../../../embody/derive-facts.js';
import run from '../index.js';
import type { RunHandle, RunSpec } from '../types.js';

function buildSpec(source: string): RunSpec {
	return {
		facts: deriveFacts({ source, type: 'script' }),
		execution: 'function',
	};
}

function expectHandle(answer: ReturnType<typeof run.main>): RunHandle {
	if ('refused' in answer) {
		throw new Error(`expected a handle, got a refusal: ${answer.reason}`);
	}
	return answer;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('run — the door: a handle or a refusal, as data', () => {
	it.skip('main(validSpec) returns a handle, not a refusal', () => {
		const answer = run.main(buildSpec('1 + 1;\n'));
		expect('refused' in answer).toBe(false);
	});

	it.skip('a spec outside the gate is a spec refusal naming the spec', () => {
		const answer = run.main(buildSpec('let x ='));
		expect('refused' in answer && answer.reason).toMatch(/spec|gate|ast/u);
	});

	it.skip('a spec refusal is frozen', () => {
		const answer = run.main(buildSpec('let x ='));
		expect(Object.isFrozen(answer)).toBe(true);
	});
});

describe('run — the happy path', () => {
	it.skip('a trivial program completes ok', async () => {
		const result = await expectHandle(run.main(buildSpec('1 + 1;\n')));
		expect(result.ok).toBe(true);
	});

	it.skip('a loop-free clean run carries an honest zero count', async () => {
		const result = await expectHandle(run.main(buildSpec('1 + 1;\n')));
		expect(result.outcome === 'complete' && result.iterationCount).toBe(0);
	});

	it.skip('result.ast is the handle’s own echo', async () => {
		const handle = expectHandle(run.main(buildSpec('1 + 1;\n')));
		const result = await handle;
		expect(result.ast).toBe(handle.ast);
	});

	it.skip('the result is deep-frozen', async () => {
		const result = await expectHandle(run.main(buildSpec('1 + 1;\n')));
		expect(Object.isFrozen(result)).toBe(true);
	});
});

describe('run — timeout', () => {
	it.skip('an explicit budget ends a spinning loop as timeout', async () => {
		const spec = { ...buildSpec('while (true) {}\n'), seconds: 0.5 };
		const result = await expectHandle(run.main(spec));
		expect(result.outcome).toBe('timeout');
	});

	it.skip('the timeout arm echoes the budget as its limit', async () => {
		const spec = { ...buildSpec('while (true) {}\n'), seconds: 0.5 };
		const result = await expectHandle(run.main(spec));
		expect(result.outcome === 'timeout' && result.error.limit).toBe(0.5);
	});

	it.skip('the timeout arm surfaces the consumed budget', async () => {
		const spec = { ...buildSpec('while (true) {}\n'), seconds: 0.5 };
		const result = await expectHandle(run.main(spec));
		expect(result.outcome === 'timeout' && typeof result.error.durationMs).toBe(
			'number',
		);
	});
});

describe('run — the iteration cap', () => {
	it.skip('a capped loop trips as iteration-limit with the whole trip record', async () => {
		const spec = { ...buildSpec('while (true) {}\n'), iterations: 100 };
		const result = await expectHandle(run.main(spec));
		expect(
			result.outcome === 'iteration-limit' && result.error.trip.loopIndex,
		).toBe(1);
	});

	it.skip('the tripped arm carries the real run total', async () => {
		const spec = { ...buildSpec('while (true) {}\n'), iterations: 100 };
		const result = await expectHandle(run.main(spec));
		expect(
			result.outcome === 'iteration-limit' &&
				result.error.iterationCount >= 100,
		).toBe(true);
	});

	it.skip('an unguarded RangeError is NOT misclassified as iteration-limit', async () => {
		const result = await expectHandle(
			run.main(buildSpec("'a'.repeat(2 ** 32);\n")),
		);
		expect(result.outcome === 'error' && result.error.kind).toBe('javascript');
	});
});

describe('run — runtime errors', () => {
	it.skip('a learner throw surfaces as the javascript arm', async () => {
		const result = await expectHandle(run.main(buildSpec('null();\n')));
		expect(
			result.outcome === 'error' &&
				result.error.kind === 'javascript' &&
				result.error.name,
		).toBe('TypeError');
	});

	it.skip('a throw-backed arm carries the halt’s iteration count', async () => {
		const source = 'let i = 0;\nwhile (i < 3) {\n\ti = i + 1;\n}\nnull();\n';
		const spec = { ...buildSpec(source), iterations: 100 };
		const result = await expectHandle(run.main(spec));
		expect(
			result.outcome === 'error' &&
				result.error.kind === 'javascript' &&
				result.error.iterationCount,
		).toBe(3);
	});
});

describe('run — error phase (skipped until the E2 engine increment lands, the run chain’s opener)', () => {
	it.skip('a runtime throw carries phase evaluation', async () => {
		const result = await expectHandle(run.main(buildSpec('null();\n')));
		expect(
			result.outcome === 'error' &&
				result.error.kind === 'javascript' &&
				result.error.phase,
		).toBe('evaluation');
	});

	it.skip('a construction failure carries phase creation', async () => {
		const result = await expectHandle(run.main(buildSpec('null();\n')));
		expect(
			result.outcome === 'error' && result.error.kind === 'javascript',
		).toBe(true);
	});
});

describe('run — io mocks answer', () => {
	it.skip('a prompt mock answers and the program completes', async () => {
		const spec: RunSpec = {
			...buildSpec("let x = prompt('?');\n"),
			io: { prompt: () => 'answered' },
		};
		const result = await expectHandle(run.main(spec));
		expect(result.outcome).toBe('complete');
	});

	it.skip('alert and confirm mocks both serve', async () => {
		const spec: RunSpec = {
			...buildSpec("alert('hi');\nlet a = confirm('ok?');\n"),
			// eslint-disable-next-line unicorn/no-useless-undefined -- the explicit undefined IS alert's legal no-answer
			io: { alert: () => undefined, confirm: () => true },
		};
		const result = await expectHandle(run.main(spec));
		expect(result.outcome).toBe('complete');
	});

	it.skip('a null prompt answer rides the channel', async () => {
		const spec: RunSpec = {
			...buildSpec('let x = prompt();\n'),
			io: { prompt: () => null },
		};
		const result = await expectHandle(run.main(spec));
		expect(result.outcome).toBe('complete');
	});
});

describe('run — the io posture (classified io errors)', () => {
	it.skip('an unmocked verb ends the run as an io error naming the verb', async () => {
		const result = await expectHandle(
			run.main(buildSpec('let x = prompt();\n')),
		);
		expect(
			result.outcome === 'error' &&
				result.error.kind === 'io' &&
				result.error.verb,
		).toBe('prompt');
	});

	it.skip('a rejecting mock is an io error, never a machinery defect', async () => {
		const spec: RunSpec = {
			...buildSpec('let x = prompt();\n'),
			io: { prompt: () => Promise.reject(new Error('boom')) },
		};
		const result = await expectHandle(run.main(spec));
		expect(result.outcome === 'error' && result.error.kind).toBe('io');
	});

	it.skip('an invalid prompt answer is an io error, never a coercion', async () => {
		const spec: RunSpec = {
			...buildSpec('let x = prompt();\n'),
			io: { prompt: () => 42 as unknown as string },
		};
		const result = await expectHandle(run.main(spec));
		expect(result.outcome === 'error' && result.error.kind).toBe('io');
	});

	it.skip('an undefined confirm answer is an io error — the reference’s coercion does not return', async () => {
		const spec: RunSpec = {
			...buildSpec('let a = confirm();\n'),
			io: { confirm: () => undefined as unknown as boolean },
		};
		const result = await expectHandle(run.main(spec));
		expect(result.outcome === 'error' && result.error.kind).toBe('io');
	});
});

describe('run — cancel', () => {
	it.skip('cancel during execution settles the cancel outcome', async () => {
		const handle = expectHandle(run.main(buildSpec('while (true) {}\n')));
		const settling = handle.result;
		await sleep(20);
		handle.cancel();
		const result = await settling;
		expect(result.outcome).toBe('cancel');
	});

	it.skip('cancel during a slow mock discards the answer and still answers cancel', async () => {
		let mockSettled = false;
		const spec: RunSpec = {
			...buildSpec('let x = prompt();\n'),
			io: {
				prompt: async () => {
					await sleep(300);
					mockSettled = true;
					return 'discarded';
				},
			},
		};
		const handle = expectHandle(run.main(spec));
		const settling = handle.result;
		await sleep(50);
		handle.cancel();
		const result = await settling;
		expect(result.outcome === 'cancel' && mockSettled).toBe(true);
	});

	it.skip('cancel outranks the io flag when a cancelled mock then fails (precedence step 0)', async () => {
		const spec: RunSpec = {
			...buildSpec('let x = prompt();\n'),
			io: {
				prompt: async () => {
					await sleep(200);
					throw new Error('failed after the stop');
				},
			},
		};
		const handle = expectHandle(run.main(spec));
		const settling = handle.result;
		await sleep(50);
		handle.cancel();
		const result = await settling;
		expect(result.outcome).toBe('cancel');
	});

	it.skip('cancel after settlement is inert', async () => {
		const handle = expectHandle(run.main(buildSpec('1 + 1;\n')));
		const first = await handle;
		handle.cancel();
		const second = await handle;
		expect(first).toBe(second);
	});

	it.skip('cancel races the budget: first writer wins', async () => {
		const spec = { ...buildSpec('while (true) {}\n'), seconds: 0.1 };
		const handle = expectHandle(run.main(spec));
		await handle.result;
		handle.cancel();
		const result = await handle;
		expect(result.outcome).toBe('timeout');
	});
});

describe('run — the defect channel', () => {
	it.skip('a machinery failure surfaces discriminated, never learner-shaped', async () => {
		const result = await expectHandle(run.main(buildSpec('1 + 1;\n')));
		expect(
			result.outcome === 'error' && result.error.kind === 'defect'
				? result.error.cause
				: 'unreached',
		).toBe('unreached');
	});
});
