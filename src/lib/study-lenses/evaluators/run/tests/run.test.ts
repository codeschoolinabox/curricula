import { describe, expect, it } from 'vitest';

import deriveFacts from '../../../embody/derive-facts.js';
import type { EngineError } from '../../../lib/engine/types.js';
import type { Evaluator } from '../../types.js';
import run from '../index.js';
import type {
	RunDefectCause,
	RunHandle,
	RunOutcome,
	RunResult,
	RunSpec,
} from '../types.js';

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

describe('run — the kind envelope (live compile probes)', () => {
	it('satisfies the bare Evaluator roster shape', () => {
		const enrolled: Evaluator = run;
		expect(enrolled.name).toBe('run');
	});

	it('every engine machinery cause lands in RunDefectCause (inbound mirror)', () => {
		const mirrored: RunDefectCause = null as unknown as Exclude<
			EngineError['cause'],
			'timeout'
		>;
		expect(mirrored).toBeNull();
	});

	it('an outcome cannot carry another arm’s error kind (pairing canary)', () => {
		const paired: RunResult = {
			outcome: 'timeout',
			ok: false,
			ast: null as never,
			// @ts-expect-error — a timeout outcome types only the timeout error
			error: { kind: 'io', verb: 'prompt', name: 'x', message: 'x' },
		};
		expect(paired.outcome).toBe('timeout');
	});

	it('every result arm speaks RunOutcome and every RunOutcome has an arm', () => {
		const spoken: RunOutcome = null as unknown as RunResult['outcome'];
		const covered: RunResult['outcome'] = null as unknown as RunOutcome;
		expect([spoken, covered]).toEqual([null, null]);
	});

	it('applicability is constant-true, whatever the environment', () => {
		expect(run.applicability(buildSpec('let x = 1;\n'))).toBe(true);
	});

	it('the cancel arm types no iterationCount (phantom-member canary)', () => {
		const cancelled: RunResult = {
			outcome: 'cancel',
			ok: false,
			ast: null as never,
			// @ts-expect-error — the machinery’s cancel route discards any halt
			iterationCount: 0,
		};
		expect(cancelled.outcome).toBe('cancel');
	});
});

describe('run — sync surface (unit tier)', () => {
	it.skip('handle.code echoes facts.source.value, the learner’s own text', () => {
		const spec = buildSpec('let x = 1;\n');
		const handle = expectHandle(run.main({ ...spec, iterations: 3 }));
		expect(handle.code).toBe('let x = 1;\n');
	});

	it.skip('handle.ast is the facts’ parsed root, by reference', () => {
		const spec = buildSpec('let x = 1;\n');
		const handle = expectHandle(run.main(spec));
		expect(spec.facts.ast.ok && handle.ast).toBe(
			spec.facts.ast.ok ? spec.facts.ast.value : null,
		);
	});

	it.skip('options.seconds is populated from the machinery default when unset', () => {
		const handle = expectHandle(run.main(buildSpec('let x = 1;\n')));
		expect(typeof handle.options.seconds).toBe('number');
	});

	it.skip('options.seconds echoes an explicit budget', () => {
		const handle = expectHandle(
			run.main({ ...buildSpec('let x = 1;\n'), seconds: 10 }),
		);
		expect(handle.options.seconds).toBe(10);
	});

	it.skip('options.iterations rides as given, no default', () => {
		const handle = expectHandle(run.main(buildSpec('let x = 1;\n')));
		expect(handle.options.iterations).toBeUndefined();
	});

	it.skip('the handle is frozen at creation', () => {
		const handle = expectHandle(run.main(buildSpec('let x = 1;\n')));
		expect(Object.isFrozen(handle)).toBe(true);
	});

	it.skip('reading the echoes never ignites the run', async () => {
		const handle = expectHandle(run.main(buildSpec('let x = 1;\n')));
		const observed =
			handle.code.length >= 0 &&
			handle.ast.type === 'Program' &&
			typeof handle.options.seconds === 'number';
		handle.cancel();
		const result = await handle;
		expect(result.outcome === 'cancel' && observed).toBe(true);
	});
});

describe('run — refusals (unit tier: this environment has no Worker)', () => {
	it.skip('refuses with the shared environment wording', () => {
		const answer = run.main(buildSpec('let x = 1;\n'));
		expect('refused' in answer && answer.reason).toBe(
			'run needs a Worker (this looks like server-side rendering or plain Node) to sandbox a program; this environment has none',
		);
	});

	it.skip('a spec outside the gate is a spec refusal naming the spec', () => {
		const answer = run.main(buildSpec('let x ='));
		expect('refused' in answer && answer.reason).toMatch(/spec|gate|ast/u);
	});

	it.skip('the environment refusal answers first where both grounds apply', () => {
		const answer = run.main(buildSpec('let x ='));
		expect('refused' in answer && answer.reason).toContain('a Worker');
	});

	it.skip('a refusal is frozen', () => {
		const answer = run.main(buildSpec('let x = 1;\n'));
		expect(Object.isFrozen(answer)).toBe(true);
	});
});

describe('run — pre-spawn cancel and the settle base (unit tier)', () => {
	it.skip('cancel before any touch settles the cancel outcome', async () => {
		const handle = expectHandle(run.main(buildSpec('let x = 1;\n')));
		handle.cancel();
		const result = await handle.result;
		expect(result.outcome).toBe('cancel');
	});

	it.skip('multiple cancels are idempotent', async () => {
		const handle = expectHandle(run.main(buildSpec('let x = 1;\n')));
		handle.cancel();
		handle.cancel();
		const result = await handle.result;
		expect(result.outcome).toBe('cancel');
	});

	it.skip('handle.result is memoized', () => {
		const handle = expectHandle(run.main(buildSpec('let x = 1;\n')));
		expect(handle.result).toBe(handle.result);
	});

	it.skip('await handle and await handle.result reach the same settling', async () => {
		const handle = expectHandle(run.main(buildSpec('let x = 1;\n')));
		handle.cancel();
		const [a, b] = [await handle, await handle.result];
		expect(a).toBe(b);
	});
});
