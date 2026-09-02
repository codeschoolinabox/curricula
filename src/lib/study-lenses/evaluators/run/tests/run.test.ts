import { describe, expect, it } from 'vitest';

import deriveFacts from '../../../embody/derive-facts.js';
import DEFAULT_SECONDS from '../../../lib/engine/default-seconds.js';
import type { EngineError } from '../../../lib/engine/types.js';
import type { Evaluator } from '../../types.js';
import createRunHandle from '../create-run-handle.js';
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

function buildHandle(spec: RunSpec): RunHandle {
	if (!spec.facts.ast.ok) {
		throw new Error(`fixture spec must parse: ${spec.facts.source.value}`);
	}
	return createRunHandle(spec, spec.facts.ast.value);
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
	it('handle.code echoes facts.source.value, the learner’s own text', () => {
		const spec = buildSpec('let x = 1;\n');
		const handle = buildHandle(spec);
		expect(handle.code).toBe('let x = 1;\n');
	});

	it('handle.code echoes a different source too, never a fixed text', () => {
		const handle = buildHandle(buildSpec('const y = 2;\n'));
		expect(handle.code).toBe('const y = 2;\n');
	});

	it('handle.ast is the facts’ parsed root, by reference', () => {
		const spec = buildSpec('let x = 1;\n');
		const handle = buildHandle(spec);
		expect(handle.ast).toBe(spec.facts.ast.ok ? spec.facts.ast.value : null);
	});

	it('options.seconds is populated from the machinery default when unset', () => {
		const handle = buildHandle(buildSpec('let x = 1;\n'));
		expect(handle.options.seconds).toBe(DEFAULT_SECONDS);
	});

	it('options.seconds echoes an explicit budget', () => {
		const handle = buildHandle({ ...buildSpec('let x = 1;\n'), seconds: 10 });
		expect(handle.options.seconds).toBe(10);
	});

	it('options.seconds echoes an explicit zero budget, never the default', () => {
		const handle = buildHandle({ ...buildSpec('let x = 1;\n'), seconds: 0 });
		expect(handle.options.seconds).toBe(0);
	});

	it('options.iterations rides as given, no default', () => {
		const handle = buildHandle(buildSpec('let x = 1;\n'));
		expect(handle.options.iterations).toBeUndefined();
	});

	it('options.iterations echoes an explicit cap', () => {
		const handle = buildHandle({ ...buildSpec('let x = 1;\n'), iterations: 3 });
		expect(handle.options.iterations).toBe(3);
	});

	it('options.io holds the caller’s mocks by reference, as given', () => {
		function promptMock(): null {
			return null;
		}
		const handle = buildHandle({
			...buildSpec('let x = 1;\n'),
			io: { prompt: promptMock },
		});
		expect(handle.options.io?.prompt).toBe(promptMock);
	});

	it('the echoed io record is a frozen copy', () => {
		function promptMock(): null {
			return null;
		}
		const handle = buildHandle({
			...buildSpec('let x = 1;\n'),
			io: { prompt: promptMock },
		});
		expect(Object.isFrozen(handle.options.io)).toBe(true);
	});

	it('creating a handle never freezes the caller’s io record', () => {
		function promptMock(): null {
			return null;
		}
		const io = { prompt: promptMock };
		buildHandle({ ...buildSpec('let x = 1;\n'), io });
		expect(Object.isFrozen(io)).toBe(false);
	});

	it('options.io is absent when none was supplied', () => {
		const handle = buildHandle(buildSpec('let x = 1;\n'));
		expect(handle.options.io).toBeUndefined();
	});

	it('the handle is frozen at creation', () => {
		const handle = buildHandle(buildSpec('let x = 1;\n'));
		expect(Object.isFrozen(handle)).toBe(true);
	});

	it('reading the echoes never ignites the run', async () => {
		const handle = buildHandle(buildSpec('let x = 1;\n'));
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
	it('refuses with the shared environment wording', () => {
		const answer = run.main(buildSpec('let x = 1;\n'));
		expect('refused' in answer && answer.reason).toBe(
			'run needs a Worker (this looks like server-side rendering or plain Node) to sandbox a program; this environment has none',
		);
	});

	it('the environment refusal answers first where both grounds apply', () => {
		const answer = run.main(buildSpec('let x ='));
		expect('refused' in answer && answer.reason).toContain('a Worker');
	});

	it('a refusal is frozen', () => {
		const answer = run.main(buildSpec('let x = 1;\n'));
		expect(Object.isFrozen(answer)).toBe(true);
	});
});

describe('run — pre-spawn cancel and the settle base (unit tier)', () => {
	it('cancel before any touch settles the cancel outcome', async () => {
		const handle = buildHandle(buildSpec('let x = 1;\n'));
		handle.cancel();
		const result = await handle.result;
		expect(result.outcome).toBe('cancel');
	});

	it('multiple cancels are idempotent', async () => {
		const handle = buildHandle(buildSpec('let x = 1;\n'));
		handle.cancel();
		handle.cancel();
		const result = await handle.result;
		expect(result.outcome).toBe('cancel');
	});

	it('handle.result is memoized', () => {
		const handle = buildHandle(buildSpec('let x = 1;\n'));
		expect(handle.result).toBe(handle.result);
	});

	it('await handle and await handle.result reach the same settling', async () => {
		const handle = buildHandle(buildSpec('let x = 1;\n'));
		handle.cancel();
		const [a, b] = [await handle, await handle.result];
		expect(a).toBe(b);
	});
});
