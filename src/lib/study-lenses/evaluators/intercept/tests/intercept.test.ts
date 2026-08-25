import { describe, expect, it } from 'vitest';

import deriveFacts from '../../../embody/derive-facts.js';
import type { EngineError } from '../../../lib/engine/types.js';
import type { EvaluationOutcome, Evaluator } from '../../types.js';
import intercept from '../index.js';
import type {
	InterceptDefectCause,
	InterceptHandle,
	InterceptResult,
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

describe('intercept — the kind envelope (live compile probes)', () => {
	it('satisfies the bare Evaluator roster shape', () => {
		const enrolled: Evaluator = intercept;
		expect(enrolled.name).toBe('intercept');
	});

	it('applicability is constant-true, whatever the environment', () => {
		expect(intercept.applicability(buildSpec('let x = 1;\n'))).toBe(true);
	});

	it('every engine machinery cause lands in InterceptDefectCause (inbound mirror)', () => {
		const mirrored: InterceptDefectCause = null as unknown as Exclude<
			EngineError['cause'],
			'timeout'
		>;
		expect(mirrored).toBeNull();
	});

	it('every result arm speaks the kind vocabulary and covers all six values', () => {
		const spoken: EvaluationOutcome =
			null as unknown as InterceptResult['outcome'];
		const covered: InterceptResult['outcome'] =
			null as unknown as EvaluationOutcome;
		expect([spoken, covered]).toEqual([null, null]);
	});

	it('an outcome cannot carry another arm’s error kind (pairing canary)', () => {
		const paired: InterceptResult = {
			outcome: 'timeout',
			ok: false,
			events: [],
			code: '',
			options: { seconds: 5 },
			entwined: null as never,
			visitCounts: {},
			eventsByNode: {},
			// @ts-expect-error — a timeout outcome types only the timeout error
			error: { kind: 'io', source: 'prompt', name: 'x', message: 'x' },
		};
		expect(paired.outcome).toBe('timeout');
	});

	it('the cancel arm types no iterationCount (phantom-member canary)', () => {
		const cancelled: InterceptResult = {
			outcome: 'cancel',
			ok: true,
			events: [],
			code: '',
			options: { seconds: 5 },
			entwined: null as never,
			visitCounts: {},
			eventsByNode: {},
			// @ts-expect-error — the fail and cancel routes end thread-side; no count
			iterationCount: 0,
		};
		expect(cancelled.outcome).toBe('cancel');
	});
});

describe('intercept — sync surface (unit tier)', () => {
	it.skip('handle.code echoes facts.source.value, the learner’s own text', () => {
		const handle = expectHandle(
			intercept.main({ ...buildSpec('let x = 1;\n'), iterations: 3 }),
		);
		expect(handle.code).toBe('let x = 1;\n');
	});

	it.skip('handle.entwined is the facts’ entwined record, by reference', () => {
		const spec = buildSpec('let x = 1;\n');
		const handle = expectHandle(intercept.main(spec));
		expect(spec.facts.entwined.ok && handle.entwined).toBe(
			spec.facts.entwined.ok ? spec.facts.entwined.value : null,
		);
	});

	it.skip('options.seconds is populated from the machinery default when unset', () => {
		const handle = expectHandle(intercept.main(buildSpec('let x = 1;\n')));
		expect(typeof handle.options.seconds).toBe('number');
	});

	it.skip('options.iterations rides as given, no default', () => {
		const handle = expectHandle(intercept.main(buildSpec('let x = 1;\n')));
		expect(handle.options.iterations).toBeUndefined();
	});

	it.skip('the handle is frozen at creation', () => {
		const handle = expectHandle(intercept.main(buildSpec('let x = 1;\n')));
		expect(Object.isFrozen(handle)).toBe(true);
	});
});

describe('intercept — refusals (unit tier: this environment has no Worker)', () => {
	it.skip('refuses with the shared environment wording', () => {
		const answer = intercept.main(buildSpec('let x = 1;\n'));
		expect('refused' in answer && answer.reason).toBe(
			'intercept needs a Worker (this looks like server-side rendering or plain Node) to sandbox a program; this environment has none',
		);
	});

	it.skip('a spec outside the gate is a spec refusal naming the spec', () => {
		const answer = intercept.main(buildSpec('let x ='));
		expect('refused' in answer && answer.reason).toMatch(/spec|gate|ast/u);
	});

	it.skip('the environment refusal answers first where both grounds apply', () => {
		const answer = intercept.main(buildSpec('let x ='));
		expect('refused' in answer && answer.reason).toContain('a Worker');
	});
});

describe('intercept — pre-ignition doors (unit tier)', () => {
	it.skip('cancel before any touch settles the cancel outcome', async () => {
		const handle = expectHandle(intercept.main(buildSpec('let x = 1;\n')));
		handle.cancel();
		const result = await handle.result;
		expect(result.outcome).toBe('cancel');
	});

	it.skip('fail before any touch settles the fail outcome with the reason', async () => {
		const handle = expectHandle(intercept.main(buildSpec('let x = 1;\n')));
		const reason = { predicted: 'wrongly' };
		handle.fail(reason);
		const result = await handle.result;
		expect(result.outcome === 'fail' && result.reason).toBe(reason);
	});

	it.skip('throw before any touch is the fail door', async () => {
		const handle = expectHandle(intercept.main(buildSpec('let x = 1;\n')));
		const thrown = new Error('predicted wrongly');
		const outcome = await handle.throw(thrown);
		expect(
			outcome.done === true &&
				outcome.value.outcome === 'fail' &&
				outcome.value.reason,
		).toBe(thrown);
	});

	it.skip('return before any touch settles the inert cancel and resolves it', async () => {
		const handle = expectHandle(intercept.main(buildSpec('let x = 1;\n')));
		const closed = await handle.return();
		expect(closed.done === true && closed.value.outcome === 'cancel').toBe(
			true,
		);
	});

	it.skip('handle.result is memoized', () => {
		const handle = expectHandle(intercept.main(buildSpec('let x = 1;\n')));
		expect(handle.result).toBe(handle.result);
	});
});
