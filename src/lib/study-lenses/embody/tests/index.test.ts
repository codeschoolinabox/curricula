import { tokTypes } from 'acorn';
import { describe, expect, it } from 'vitest';

import embody from '../index.js';
import type { Facts } from '../types.js';

describe('embody', () => {
	describe('defaults', () => {
		it('treats the source as a module when no type is given', () => {
			// '01' tokenizes as a script but throws under the module goal — a
			// failed tokens stage proves the default landed on 'module'
			const embodiment = embody('01');
			expect(embodiment.facts.tokens.ok).toBe(false);
		});

		it('restates the defaulted type in the facts', () => {
			const { facts } = embody('01');
			expect(facts.type.ok && facts.type.value === 'module').toBe(true);
		});

		it('a clean program with no roster studies open and empty everywhere', () => {
			const { study } = embody('let x = 1');
			expect(study).toEqual({
				source: { accessible: true, lenses: [] },
				tokens: { accessible: true, lenses: [] },
				ast: { accessible: true, lenses: [] },
				environment: { accessible: true, lenses: [] },
				evaluation: { accessible: true, lenses: [] },
			});
		});
	});

	describe('an explicit script type', () => {
		it('overrides the module default', () => {
			const embodiment = embody('01', { type: 'script' });
			expect(embodiment.facts.tokens.ok).toBe(true);
		});
	});

	describe('a mixed roster over a failing module', () => {
		// '01' as module fails at tokens → ast is barred by REAL accessibility;
		// the content-based gate reads the real Facts (false for failed tokens)
		const flowchart = {
			name: 'flowchart',
			applicability: () => true,
			phase: 'ast',
		} as const;
		const tokensOnly = {
			name: 'tokens-only',
			applicability: (facts: Facts) => facts.tokens.ok,
			phase: 'ast',
		} as const;
		const scratch = { name: 'scratch', applicability: () => true } as const;

		it('bars the ast phase through the real accessibility map', () => {
			const { study } = embody('01', {
				lenses: [flowchart, tokensOnly, scratch],
			});
			expect(study.ast.accessible).toBe(false);
		});

		it('leaves the tokens phase open — its own error renders there', () => {
			const { study } = embody('01', {
				lenses: [flowchart, tokensOnly, scratch],
			});
			expect(study.tokens.accessible).toBe(true);
		});

		it('attaches the fitting lens to its barred phase by reference', () => {
			const { study } = embody('01', {
				lenses: [flowchart, tokensOnly, scratch],
			});
			expect(study.ast.lenses[0] === flowchart).toBe(true);
		});

		it('excludes the lens whose gate declined the facts', () => {
			const { study } = embody('01', {
				lenses: [flowchart, tokensOnly, scratch],
			});
			expect(study.ast.lenses.length).toBe(1);
		});

		it('attaches the phase-less lens nowhere', () => {
			const { study } = embody('01', {
				lenses: [flowchart, tokensOnly, scratch],
			});
			expect(
				Object.values(study).every((phase) =>
					phase.lenses.every((lens) => lens !== scratch),
				),
			).toBe(true);
		});
	});

	describe('the freeze', () => {
		it('freezes the embodiment structure', () => {
			const embodiment = embody('let x = 1');
			expect(
				Object.isFrozen(embodiment) &&
					Object.isFrozen(embodiment.facts) &&
					Object.isFrozen(embodiment.study),
			).toBe(true);
		});

		it('freezes a token object but not its process-global type', () => {
			// the element is embody-owned and freezes; its `.type` is acorn's
			// shared singleton and must not (freeze-what-you-own)
			const { facts } = embody('let x = 1');
			expect(
				facts.tokens.ok &&
					Object.isFrozen(facts.tokens.value.tokens[0]) &&
					!Object.isFrozen(facts.tokens.value.tokens[0].type),
			).toBe(true);
		});

		it('leaves a second token kind unfrozen too — the whole stream maps', () => {
			const { facts } = embody('let x = 1');
			expect(
				facts.tokens.ok && !Object.isFrozen(facts.tokens.value.tokens[2].type),
			).toBe(true);
		});

		it('freezes the ast program node', () => {
			const { facts } = embody('let x = 1');
			expect(facts.ast.ok && Object.isFrozen(facts.ast.value)).toBe(true);
		});

		it('freezes the entwined root wrapper', () => {
			const { facts } = embody('let x = 1');
			expect(
				facts.entwined.ok && Object.isFrozen(facts.entwined.value.root),
			).toBe(true);
		});

		it('freezes a published paren span, not just the record around it', () => {
			const { facts } = embody('let x = (1 + 2)');
			const spans =
				facts.entwined.ok &&
				facts.entwined.value.parenSpans['$.body.0.declarations.0.init'];
			expect(spans && Object.isFrozen(spans[0])).toBe(true);
		});

		it('freezes the cyclic scope graph without hanging', () => {
			// real production cycles — upper and childScopes, resolved and
			// references, the ast reached via three paths — completing at all
			// proves the walk terminates
			const { facts } = embody('function f() { let x = 1; return x; }\nf();');
			expect(
				facts.environment.ok &&
					Object.isFrozen(facts.environment.value.root) &&
					Object.isFrozen(facts.environment.value.root.childScopes[0]),
			).toBe(true);
		});

		it('freezes a scope reference carrying the enriched fields', () => {
			// the enriched reference (access/init/writeExpr/usedBeforeBound/path)
			// must ride the deep-freeze walk — the walk has to reach it. A script
			// keeps the declaration on root; a module would sink it to childScopes[0]
			const { facts } = embody('let x = 1; x = 2;', { type: 'script' });
			const reference =
				facts.environment.ok &&
				facts.environment.value.root.variables[0]?.references[0];
			expect(reference && Object.isFrozen(reference)).toBe(true);
		});

		it('freezes a scope definition carrying kind, parent, and index', () => {
			const { facts } = embody('let x = 1;', { type: 'script' });
			const definition =
				facts.environment.ok &&
				facts.environment.value.root.variables[0]?.defs[0];
			expect(definition && Object.isFrozen(definition)).toBe(true);
		});

		it('freezes a study phase and its lens list', () => {
			const { study } = embody('let x = 1');
			expect(
				Object.isFrozen(study.ast) && Object.isFrozen(study.ast.lenses),
			).toBe(true);
		});

		it('does not freeze an attached lens ref, and keeps its identity', () => {
			const spotlight = {
				name: 'spotlight',
				applicability: () => true,
				phase: 'source',
			} as const;
			const { study } = embody('let x = 1', { lenses: [spotlight] });
			expect(
				study.source.lenses[0] === spotlight && !Object.isFrozen(spotlight),
			).toBe(true);
		});

		it("leaves acorn's process-global token types untouched", () => {
			// depends on vitest's default per-file module isolation: this
			// file's acorn IS the instance embody's derivers use
			embody('let x = 1');
			expect(Object.isFrozen(tokTypes.name)).toBe(false);
		});

		it('preserves cross-path ast identity — frozen once, never cloned', () => {
			const { facts } = embody('let x = 1');
			expect(
				facts.ast.ok &&
					facts.entwined.ok &&
					facts.ast.value === facts.entwined.value.root.node,
			).toBe(true);
		});

		it('a failed embodiment freezes too, cause included', () => {
			const embodiment = embody("'unterminated");
			expect(
				Object.isFrozen(embodiment) &&
					!embodiment.facts.tokens.ok &&
					Object.isFrozen(embodiment.facts.tokens.cause),
			).toBe(true);
		});

		it('a grammar failure keeps token types unfrozen while its cause freezes', () => {
			// tokens ok + ast fail in ONE embodiment: the except set builds
			// from the real token stream even when a later stage fails
			const { facts } = embody('1 +');
			expect(
				facts.tokens.ok &&
					!facts.ast.ok &&
					!Object.isFrozen(facts.tokens.value.tokens[0].type) &&
					Object.isFrozen(facts.ast.cause),
			).toBe(true);
		});

		it('a carried cause stays one object across the stages', () => {
			const { facts } = embody('1 +');
			expect(
				!facts.ast.ok &&
					!facts.entwined.ok &&
					facts.ast.cause === facts.entwined.cause,
			).toBe(true);
		});

		it('a flat data-heavy program embodies frozen without throwing', () => {
			// ~24k tokens: the entwined stream chains every token wrapper
			// through `next`, so the freeze walk must not spend call-stack
			// depth per object (a learner pasting a data file hits this)
			const embodiment = embody(`const data = [${'0,'.repeat(12_000)}]`);
			expect(
				embodiment.facts.ast.ok && Object.isFrozen(embodiment.facts.ast.value),
			).toBe(true);
		});

		it('a fact-carried global regex still matches after the freeze', () => {
			const { facts } = embody('const pattern = /a/g');
			const statement = facts.ast.ok ? facts.ast.value.body[0] : undefined;
			const initializer =
				statement?.type === 'VariableDeclaration'
					? statement.declarations[0]?.init
					: undefined;
			const regex =
				initializer?.type === 'Literal' ? initializer.value : undefined;
			const firstMatch = regex instanceof RegExp && regex.test('aa');
			const secondMatch = regex instanceof RegExp && regex.test('aa');
			expect(firstMatch && secondMatch).toBe(true);
		});
	});
});
