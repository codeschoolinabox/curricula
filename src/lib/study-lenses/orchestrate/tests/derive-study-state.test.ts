import { describe, expect, it, vi } from 'vitest';

import embody from '../../embody/index.js';
import scaffoldLevel from '../../language-levels/scaffold/index.js';
import type { LanguageLevel } from '../../language-levels/types.js';
import type { Lens } from '../../lenses/types.js';
import deriveStudyState from '../derive-study-state.js';
import createMemoizedValidate from '../lib/validating/create-memoized-validate.js';

function buildLevel(
	key: string,
	validate: LanguageLevel['validate'],
): LanguageLevel {
	return {
		key,
		label: key,
		validate,
		snippetTypes: ['module', 'script'],
		docs: { reference: '', notionalMachine: '' },
		editorSupport: { completion: {}, hover: {}, format: {} },
		models: {},
	};
}

function buildLens(name: string, extras: Partial<Lens> = {}): Lens {
	return {
		name,
		applicability: () => true,
		phase: 'source',
		main: () => null,
		...extras,
	};
}

describe('embody conformance — the seam earlier waves assumed', () => {
	it('derives all five study phases accessible for a binding module', () => {
		const { study } = embody('let x = 1\nconsole.log(x)');
		expect(Object.values(study).map((phase) => phase.accessible)).toEqual([
			true,
			true,
			true,
			true,
			true,
		]);
	});

	it('carries exactly the five phase keys on the study layer', () => {
		const { study } = embody('let x = 1\nconsole.log(x)');
		expect(
			Object.keys(study).toSorted((left, right) => left.localeCompare(right)),
		).toEqual(['ast', 'environment', 'evaluation', 'source', 'tokens']);
	});

	it('freezes the embodiment deep', () => {
		const embodiment = embody('let x = 1\nconsole.log(x)');
		expect(
			[embodiment, embodiment.facts, embodiment.study].every((layer) =>
				Object.isFrozen(layer),
			),
		).toBe(true);
	});

	it('keeps source and tokens accessible when tokenizing fails', () => {
		const { study } = embody('"unterminated');
		expect([study.source.accessible, study.tokens.accessible]).toEqual([
			true,
			true,
		]);
	});

	it('bars downstream phases with the ORIGINAL cause by identity', () => {
		const { facts, study } = embody('"unterminated');
		expect(study.ast.accessible === false ? study.ast.cause : null).toBe(
			facts.tokens.ok ? null : facts.tokens.cause,
		);
	});

	it('leaves the ast phase open when only the grammar fails', () => {
		const { study } = embody('const');
		expect(study.ast.accessible).toBe(true);
	});

	it('bars environment and evaluation on a grammar failure', () => {
		const { study } = embody('const');
		expect([study.environment.accessible, study.evaluation.accessible]).toEqual(
			[false, false],
		);
	});

	it('restates source and type as success-only arms', () => {
		const { facts } = embody('1 +');
		expect([facts.source.ok, facts.type.ok]).toEqual([true, true]);
	});

	it('attaches lenses by reference and leaves them mutable after embody', () => {
		const lens = {
			name: 'poker',
			applicability: () => true,
			phase: 'source' as const,
			poked: false,
		};
		const { study } = embody('let x = 1', { lenses: [lens] });
		lens.poked = true;
		expect(
			study.source.lenses[0] === lens &&
				(study.source.lenses[0] as typeof lens).poked,
		).toBe(true);
	});

	it('lists an attached lens on a barred phase — closed, not emptied', () => {
		const lens = {
			name: 'env-viewer',
			applicability: () => true,
			phase: 'environment' as const,
		};
		const { study } = embody('const', { lenses: [lens] });
		expect(
			study.environment.accessible === false &&
				study.environment.lenses.includes(lens),
		).toBe(true);
	});
});

describe('deriveStudyState', () => {
	describe('the empty session (Zero)', () => {
		it('derives an embodiment with empty verdicts, assessments, and recommendations', () => {
			const derivation = deriveStudyState(
				{ source: '', type: 'module' },
				[],
				[],
				createMemoizedValidate(),
			);
			expect([
				derivation.verdicts,
				derivation.assessments,
				derivation.recommendations,
			]).toEqual([{}, {}, []]);
		});
	});

	describe('one level over one settle (One)', () => {
		it('marks a fitting module fits for the scaffold level', () => {
			const derivation = deriveStudyState(
				{ source: 'const x = 1;', type: 'module' },
				[scaffoldLevel],
				[],
				createMemoizedValidate(),
			);
			expect(derivation.assessments['scaffold']?.mark).toBe('fits');
		});

		it('carries the validated verdict', () => {
			const derivation = deriveStudyState(
				{ source: 'const x = 1;', type: 'module' },
				[scaffoldLevel],
				[],
				createMemoizedValidate(),
			);
			expect(derivation.verdicts['scaffold']?.kind).toBe('validated');
		});

		it('rides the settled source into the embodiment', () => {
			const derivation = deriveStudyState(
				{ source: 'const x = 1;', type: 'module' },
				[scaffoldLevel],
				[],
				createMemoizedValidate(),
			);
			expect(derivation.embodiment.facts.source.value).toBe('const x = 1;');
		});

		it('marks a debugger statement does-not-fit with the violations carried', () => {
			const derivation = deriveStudyState(
				{ source: 'debugger;', type: 'module' },
				[scaffoldLevel],
				[],
				createMemoizedValidate(),
			);
			const assessment = derivation.assessments['scaffold'];
			expect(
				assessment?.mark === 'does-not-fit'
					? assessment.violations.map((violation) => violation.nodeType)
					: null,
			).toEqual(['DebuggerStatement']);
		});
	});

	describe('two levels over one settle (Many)', () => {
		it('keys both verdicts and assessments by each level', () => {
			const derivation = deriveStudyState(
				{ source: 'const x = 1;', type: 'module' },
				[scaffoldLevel, buildLevel('other', () => [])],
				[],
				createMemoizedValidate(),
			);
			expect([
				Object.keys(derivation.verdicts).toSorted((a, b) => a.localeCompare(b)),
				Object.keys(derivation.assessments).toSorted((a, b) =>
					a.localeCompare(b),
				),
			]).toEqual([
				['other', 'scaffold'],
				['other', 'scaffold'],
			]);
		});
	});

	describe('the snippet type (Boundaries)', () => {
		it('marks a script not-applicable for the module-only scaffold', () => {
			const derivation = deriveStudyState(
				{ source: 'const x = 1;', type: 'script' },
				[scaffoldLevel],
				[],
				createMemoizedValidate(),
			);
			expect(derivation.assessments['scaffold']?.mark).toBe(
				'not-applicable-for-type',
			);
		});

		it('carries the settled type into the embodiment parse goal', () => {
			const asModule = deriveStudyState(
				{ source: 'import "x";', type: 'module' },
				[],
				[],
				createMemoizedValidate(),
			);
			const asScript = deriveStudyState(
				{ source: 'import "x";', type: 'script' },
				[],
				[],
				createMemoizedValidate(),
			);
			expect([
				asModule.embodiment.facts.ast.ok,
				asScript.embodiment.facts.ast.ok,
			]).toEqual([true, false]);
		});
	});

	describe('the memo threading (Interfaces)', () => {
		it('consults the level once across two same-settle derivations', () => {
			const spy = vi.fn(() => []);
			const level = buildLevel('spied', spy);
			const memoizedValidate = createMemoizedValidate();
			deriveStudyState(
				{ source: 'const x = 1;', type: 'module' },
				[level],
				[],
				memoizedValidate,
			);
			deriveStudyState(
				{ source: 'const x = 1;', type: 'module' },
				[level],
				[],
				memoizedValidate,
			);
			expect(spy).toHaveBeenCalledTimes(1);
		});
	});

	describe('the frozen derivation (Interfaces)', () => {
		it('freezes the derivation envelope', () => {
			const derivation = deriveStudyState(
				{ source: 'const x = 1;', type: 'module' },
				[scaffoldLevel],
				[],
				createMemoizedValidate(),
			);
			expect(Object.isFrozen(derivation)).toBe(true);
		});

		it('freezes the assessments record', () => {
			const derivation = deriveStudyState(
				{ source: 'const x = 1;', type: 'module' },
				[scaffoldLevel],
				[],
				createMemoizedValidate(),
			);
			expect(Object.isFrozen(derivation.assessments)).toBe(true);
		});

		it('leaves attached lenses mutable through the full composition', () => {
			const lens = buildLens('poker') as Lens & { poked?: boolean };
			const derivation = deriveStudyState(
				{ source: 'const x = 1;', type: 'module' },
				[],
				[lens],
				createMemoizedValidate(),
			);
			lens.poked = true;
			expect(
				(derivation.embodiment.study.source.lenses[0] as typeof lens).poked,
			).toBe(true);
		});
	});

	describe('the recommendation walk (Interfaces)', () => {
		it('lands a fitting lens proposal in the derivation', () => {
			const proposer = buildLens('proposer');
			const recommending = buildLens('recommending', {
				recommend: () => [
					{ lens: proposer, config: {}, relevance: 0.5, label: 'next' },
				],
			});
			const derivation = deriveStudyState(
				{ source: 'const x = 1;', type: 'module' },
				[],
				[recommending, proposer],
				createMemoizedValidate(),
			);
			expect(derivation.recommendations.map((r) => r.label)).toEqual(['next']);
		});

		it('ranks proposals by relevance, descending', () => {
			const target = buildLens('target');
			const low = buildLens('low', {
				recommend: () => [
					{ lens: target, config: {}, relevance: 0.2, label: 'low' },
				],
			});
			const high = buildLens('high', {
				recommend: () => [
					{ lens: target, config: {}, relevance: 0.9, label: 'high' },
				],
			});
			const derivation = deriveStudyState(
				{ source: 'const x = 1;', type: 'module' },
				[],
				[low, high, target],
				createMemoizedValidate(),
			);
			expect(derivation.recommendations.map((r) => r.label)).toEqual([
				'high',
				'low',
			]);
		});

		it('asks a multi-phase lens once', () => {
			const recommend = vi.fn(() => []);
			const multi = buildLens('multi', {
				phase: ['source', 'tokens'],
				recommend,
			});
			deriveStudyState(
				{ source: 'const x = 1;', type: 'module' },
				[],
				[multi],
				createMemoizedValidate(),
			);
			expect(recommend).toHaveBeenCalledTimes(1);
		});

		it('never asks a non-fitting roster lens', () => {
			const recommend = vi.fn(() => []);
			const unfitting = buildLens('unfitting', {
				applicability: () => false,
				recommend,
			});
			deriveStudyState(
				{ source: 'const x = 1;', type: 'module' },
				[],
				[unfitting],
				createMemoizedValidate(),
			);
			expect(recommend).not.toHaveBeenCalled();
		});

		it('asks a lens attached to a barred phase — closed, not emptied', () => {
			const recommend = vi.fn(() => []);
			const barredButAttached = buildLens('env-proposer', {
				applicability: (facts) => facts.source.ok,
				phase: 'environment',
				recommend,
			});
			deriveStudyState(
				{ source: '1 +', type: 'module' },
				[],
				[barredButAttached],
				createMemoizedValidate(),
			);
			expect(recommend).toHaveBeenCalledTimes(1);
		});

		it('skips a throwing recommend, reporting it, while a sibling still lands', () => {
			const report = vi.spyOn(console, 'error').mockImplementation(() => {});
			const target = buildLens('target');
			const throwing = buildLens('throwing', {
				recommend: () => {
					throw new Error('recommend defect');
				},
			});
			const fine = buildLens('fine', {
				recommend: () => [
					{ lens: target, config: {}, relevance: 0.4, label: 'still lands' },
				],
			});
			const derivation = deriveStudyState(
				{ source: 'const x = 1;', type: 'module' },
				[],
				[throwing, fine, target],
				createMemoizedValidate(),
			);
			expect([
				derivation.recommendations.map((r) => r.label),
				report.mock.calls.length > 0 &&
					String(report.mock.calls[0]?.[0]).includes('throwing'),
			]).toEqual([['still lands'], true]);
			report.mockRestore();
		});
	});

	describe('the unparsable settle (Exceptions)', () => {
		it('marks every level undetermined while unparsed', () => {
			const derivation = deriveStudyState(
				{ source: '1 +', type: 'module' },
				[scaffoldLevel, buildLevel('other', () => [])],
				[],
				createMemoizedValidate(),
			);
			expect([
				derivation.assessments['scaffold']?.mark,
				derivation.assessments['other']?.mark,
			]).toEqual(['undetermined', 'undetermined']);
		});

		it('carries the barred phases alongside the undetermined marks', () => {
			const derivation = deriveStudyState(
				{ source: '1 +', type: 'module' },
				[scaffoldLevel],
				[],
				createMemoizedValidate(),
			);
			expect(derivation.embodiment.study.environment.accessible).toBe(false);
		});
	});
});
