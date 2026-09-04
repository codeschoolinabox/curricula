import { describe, expect, it } from 'vitest';

import deriveFacts from '../../../embody/derive-facts.js';
import DEFAULT_SECONDS from '../../../lib/engine/default-seconds.js';
import type { EngineError } from '../../../lib/engine/types.js';
import type { EvaluationOutcome, Evaluator } from '../../types.js';
import createInterceptHandle from '../create-intercept-handle.js';
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

function buildHandle(spec: InterceptSpec): InterceptHandle {
	if (!spec.facts.entwined.ok) {
		throw new Error(`fixture spec must entwine: ${spec.facts.source.value}`);
	}
	return createInterceptHandle(spec, spec.facts.entwined.value);
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
	it('handle.code echoes facts.source.value, the learner’s own text', () => {
		const handle = buildHandle({
			...buildSpec('let x = 1;\n'),
			iterations: 3,
		});
		expect(handle.code).toBe('let x = 1;\n');
	});

	it('handle.code echoes a different source too, never a fixed text', () => {
		const handle = buildHandle(buildSpec('const y = 2;\n'));
		expect(handle.code).toBe('const y = 2;\n');
	});

	it('handle.entwined is the facts’ entwined record, by reference', () => {
		const spec = buildSpec('let x = 1;\n');
		const handle = buildHandle(spec);
		expect(handle.entwined).toBe(
			spec.facts.entwined.ok ? spec.facts.entwined.value : null,
		);
	});

	it('options.seconds is populated from the machinery default when unset', () => {
		const handle = buildHandle(buildSpec('let x = 1;\n'));
		expect(handle.options.seconds).toBe(DEFAULT_SECONDS);
	});

	it('options.iterations rides as given, no default', () => {
		const handle = buildHandle(buildSpec('let x = 1;\n'));
		expect(handle.options.iterations).toBeUndefined();
	});

	it('the handle is frozen at creation', () => {
		const handle = buildHandle(buildSpec('let x = 1;\n'));
		expect(Object.isFrozen(handle)).toBe(true);
	});
});

describe('intercept — refusals (unit tier: this environment has no Worker)', () => {
	it('refuses with the shared environment wording', () => {
		const answer = intercept.main(buildSpec('let x = 1;\n'));
		expect('refused' in answer && answer.reason).toBe(
			'intercept needs a Worker (this looks like server-side rendering or plain Node) to sandbox a program; this environment has none',
		);
	});

	it('the environment refusal answers first where both grounds apply', () => {
		const answer = intercept.main(buildSpec('let x ='));
		expect('refused' in answer && answer.reason).toContain('a Worker');
	});

	it('a refusal is frozen', () => {
		const answer = intercept.main(buildSpec('let x = 1;\n'));
		expect(Object.isFrozen(answer)).toBe(true);
	});
});

describe('intercept — pre-ignition doors (unit tier)', () => {
	it('cancel before any touch settles the cancel outcome', async () => {
		const handle = buildHandle(buildSpec('let x = 1;\n'));
		handle.cancel();
		const result = await handle.result;
		expect(result.outcome).toBe('cancel');
	});

	it('fail before any touch settles the fail outcome with the reason', async () => {
		const handle = buildHandle(buildSpec('let x = 1;\n'));
		const reason = { predicted: 'wrongly' };
		handle.fail(reason);
		const result = await handle.result;
		expect(result.outcome === 'fail' && result.reason).toBe(reason);
	});

	it('throw before any touch is the fail door', async () => {
		const handle = buildHandle(buildSpec('let x = 1;\n'));
		const thrown = new Error('predicted wrongly');
		const outcome = await handle.throw(thrown);
		expect(
			outcome.done === true &&
				outcome.value.outcome === 'fail' &&
				outcome.value.reason,
		).toBe(thrown);
	});

	it('return before any touch settles the inert cancel and resolves it', async () => {
		const handle = buildHandle(buildSpec('let x = 1;\n'));
		const closed = await handle.return();
		expect(closed.done === true && closed.value.outcome === 'cancel').toBe(
			true,
		);
	});

	it('handle.result is memoized', () => {
		const handle = buildHandle(buildSpec('let x = 1;\n'));
		expect(handle.result).toBe(handle.result);
	});
});
