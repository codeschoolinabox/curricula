// cspell:ignore tripwire
/**
 * Type-contract assertions for the kind's contract (Phase-0 test artifact:
 * type-level claims, live-green, enforced by tsc — an unused @ts-expect-error
 * is itself a compile error). Semantic claims the type system cannot see —
 * result-never-rejects, creation-inert — are the execution-handle library's
 * behavioral suite's to pin, not this file's.
 */

import { describe, expect, it } from 'vitest';

import embody from '../../embody/index.js';
import type {
	ErrorPhase,
	EvaluationOutcome,
	EvaluationSpec,
	Evaluator,
	EvaluatorRefusal,
	Execution,
	ExecutionAxis,
	ExecutionBase,
	MachineryDefectKind,
	PendingInteraction,
} from '../types.js';

describe('type-contracts', () => {
	describe('the refusal shape', () => {
		it('accepts a minimal refusal literal', () => {
			const refusal: EvaluatorRefusal = {
				refused: true,
				reason: 'no worker in this environment',
			};
			expect(refusal.refused).toBe(true);
		});

		it('rejects a refusal whose flag is false', () => {
			// @ts-expect-error — refused is the literal true; false is not a refusal
			const wrong: EvaluatorRefusal = { refused: false, reason: 'nope' };
			expect(wrong.reason).toBe('nope');
		});

		it('discriminates a refusal from a handle by the refused flag', () => {
			const answer: ExecutionBase<number> | EvaluatorRefusal = {
				refused: true,
				reason: 'no shared memory',
			};
			const reason = 'refused' in answer ? answer.reason : null;
			expect(reason).toBe('no shared memory');
		});
	});

	describe('the handle lattice', () => {
		it('a widened streaming handle is assignable to Execution and the base', () => {
			type WidenedHandle = Execution<string, number> & {
				readonly fail: (reason?: unknown) => void;
				readonly code: string;
			};
			const handle = {} as WidenedHandle;
			const asExecution: Execution<string, number> = handle;
			const asBase: ExecutionBase<number> = handle;
			expect(asExecution).toBe(asBase);
		});

		it('a settle-only handle satisfies the base but not the streaming handle', () => {
			type SettleOnly = ExecutionBase<number> & { readonly code: string };
			const handle = {} as SettleOnly;
			const asBase: ExecutionBase<number> = handle;
			// @ts-expect-error — no AsyncIterable member: a settle-only handle is not an Execution, and the base exists so it never has to sham one
			const asExecution: Execution<string, number> = handle;
			expect(asBase).toBe(asExecution);
		});
	});

	describe('the widening rules on the roster', () => {
		it('an optional-only spec widening keeps the evaluator roster-assignable', () => {
			type MockedSpec = EvaluationSpec & {
				readonly io?: { readonly prompt?: () => string };
			};
			const widened = {} as Evaluator<MockedSpec, ExecutionBase<unknown>>;
			const roster: ReadonlyArray<Evaluator> = [widened];
			expect(roster).toHaveLength(1);
		});

		it('a required spec addition breaks bare-roster assignability', () => {
			type RequiringSpec = EvaluationSpec & { readonly gates: object };
			const widened = {} as Evaluator<RequiringSpec, ExecutionBase<unknown>>;
			// @ts-expect-error — a REQUIRED spec member breaks assignability to the bare Evaluator: the compile-time signal the field belongs on the shared spec
			const roster: ReadonlyArray<Evaluator> = [widened];
			expect(roster).toHaveLength(1);
		});

		it('a narrowed spec is not roster-assignable — narrowing routes to refusal', () => {
			type ModuleOnlySpec = EvaluationSpec & { readonly execution: 'module' };
			const narrowed = {} as Evaluator<ModuleOnlySpec, ExecutionBase<unknown>>;
			// @ts-expect-error — narrowing the axis breaks bare-roster assignability; a module-only evaluator accepts the shared spec and refuses as data
			const roster: ReadonlyArray<Evaluator> = [narrowed];
			expect(roster).toHaveLength(1);
		});

		it('a widened handle generic keeps the evaluator roster-assignable', () => {
			type StreamingHandle = Execution<string, number> & {
				readonly code: string;
			};
			const widened = {} as Evaluator<EvaluationSpec, StreamingHandle>;
			const roster: ReadonlyArray<Evaluator> = [widened];
			expect(roster).toHaveLength(1);
		});

		it('method shorthand would erase the misplacement signal — property syntax is the contract', () => {
			type MethodStyleEnvelope<TSpec extends EvaluationSpec = EvaluationSpec> =
				{
					readonly name: string;
					applicability(spec: TSpec): boolean;
					main(spec: TSpec): ExecutionBase<unknown> | EvaluatorRefusal;
				};
			type RequiringSpec = EvaluationSpec & { readonly gates: object };
			const widened = {} as MethodStyleEnvelope<RequiringSpec>;
			const roster: ReadonlyArray<MethodStyleEnvelope> = [widened];
			expect(roster).toHaveLength(1);
		});
	});

	describe('the spec', () => {
		it('facts and execution alone make a complete spec', () => {
			const spec: EvaluationSpec = {
				facts: embody('let x = 1').facts,
				execution: 'module',
			};
			expect(spec.seconds).toBe(undefined);
		});
	});

	describe('the vocabulary types', () => {
		it('the error phase speaks exactly two values', () => {
			const phases: ReadonlyArray<ErrorPhase> = ['creation', 'evaluation'];
			expect(phases).toHaveLength(2);
		});

		it("rejects the quarry's retired phase spelling", () => {
			// @ts-expect-error — the phase's second value is 'evaluation' (human ruling 2026-08-13); the quarry's 'execution' spelling does not return
			const wrong: ErrorPhase = 'execution';
			expect(wrong).toBe('execution');
		});

		it('the execution axis speaks exactly two values', () => {
			const axes: ReadonlyArray<ExecutionAxis> = ['function', 'module'];
			expect(axes).toHaveLength(2);
		});

		it("holds the tripwire against a silent 'script' axis value", () => {
			// @ts-expect-error — no script execution path is ratified (human ruling 2026-08-13); adding the value makes this suppression unused, which fails tsc, so the widening cannot land silently
			const wrong: ExecutionAxis = 'script';
			expect(wrong).toBe('script');
		});

		it('the outcome vocabulary speaks the six reference values', () => {
			const outcomes: ReadonlyArray<EvaluationOutcome> = [
				'complete',
				'cancel',
				'fail',
				'timeout',
				'iteration-limit',
				'error',
			];
			expect(outcomes).toHaveLength(6);
		});

		it("rejects the engine's settlement spelling on the kind vocabulary", () => {
			// @ts-expect-error — 'completed' is the engine's seam spelling; reference spellings alone are legal on results
			const wrong: EvaluationOutcome = 'completed';
			expect(wrong).toBe('completed');
		});

		it('an evaluator outcome union subsets the kind vocabulary', () => {
			type RunOutcome = Exclude<EvaluationOutcome, 'fail'>;
			const outcome: RunOutcome = 'complete';
			const asKind: EvaluationOutcome = outcome;
			expect(asKind).toBe('complete');
		});

		it('an evaluator may extend the outcome vocabulary in its own types', () => {
			type TracerOutcome = EvaluationOutcome | 'suspended';
			const outcome: TracerOutcome = 'suspended';
			expect(outcome).toBe('suspended');
		});

		it("rejects the engine's cause spelling as the defect discriminant", () => {
			// @ts-expect-error — 'worker-error' is an engine cause, not the kind's defect discriminant; engine spellings never appear on results
			const wrong: MachineryDefectKind = 'worker-error';
			expect(wrong).toBe('worker-error');
		});
	});

	describe('the pending-interaction protocol', () => {
		it('a carrying evaluator binds real request and answer shapes', () => {
			type PromptAsk = PendingInteraction<{ readonly message: string }, string>;
			const answers: Array<string> = [];
			const ask: PromptAsk = {
				request: { message: 'your name?' },
				respond: (answer) => answers.push(answer),
			};
			ask.respond('Ada');
			expect(answers).toEqual(['Ada']);
		});
	});
});
