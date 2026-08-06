import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import summarize from '../core.js';

describe('summarize', () => {
	describe('the summary shape', () => {
		it('lists the six fact stages in stage order', () => {
			const summary = summarize(embody('let x = 1'), {});
			expect(summary.facts.map((entry) => entry.stage)).toEqual([
				'source',
				'tokens',
				'ast',
				'entwined',
				'environment',
				'type',
			]);
		});

		it('lists the five study phases in lifecycle order', () => {
			const summary = summarize(embody('let x = 1'), {});
			expect(summary.study.map((entry) => entry.phase)).toEqual([
				'source',
				'tokens',
				'ast',
				'environment',
				'evaluation',
			]);
		});

		it('echoes an empty config record', () => {
			const summary = summarize(embody('let x = 1'), {});
			expect(summary.config).toEqual({});
		});
	});

	describe('an empty program', () => {
		it('describes the source stage as zero characters', () => {
			const summary = summarize(embody(''), {});
			expect(summary.facts.find((entry) => entry.stage === 'source')).toEqual({
				stage: 'source',
				ok: true,
				description: '0 characters',
			});
		});

		it('describes the tokens stage as zero tokens', () => {
			const summary = summarize(embody(''), {});
			expect(summary.facts.find((entry) => entry.stage === 'tokens')).toEqual({
				stage: 'tokens',
				ok: true,
				description: '0 tokens',
			});
		});

		it('describes the ast stage as the bare program node', () => {
			const summary = summarize(embody(''), {});
			expect(summary.facts.find((entry) => entry.stage === 'ast')).toEqual({
				stage: 'ast',
				ok: true,
				description: '1 node',
			});
		});

		it('describes the entwined stage as the bare program node', () => {
			const summary = summarize(embody(''), {});
			expect(summary.facts.find((entry) => entry.stage === 'entwined')).toEqual(
				{ stage: 'entwined', ok: true, description: '1 node' },
			);
		});

		it('describes the environment stage as the global and module scopes', () => {
			const summary = summarize(embody(''), {});
			expect(
				summary.facts.find((entry) => entry.stage === 'environment'),
			).toEqual({ stage: 'environment', ok: true, description: '2 scopes' });
		});

		it('restates the defaulted module type', () => {
			const summary = summarize(embody(''), {});
			expect(summary.facts.find((entry) => entry.stage === 'type')).toEqual({
				stage: 'type',
				ok: true,
				description: 'module',
			});
		});
	});

	describe('a one-statement module', () => {
		it('describes the source stage by character count', () => {
			const summary = summarize(embody('let x = 1'), {});
			expect(summary.facts.find((entry) => entry.stage === 'source')).toEqual({
				stage: 'source',
				ok: true,
				description: '9 characters',
			});
		});

		it('describes the tokens stage by token count', () => {
			const summary = summarize(embody('let x = 1'), {});
			expect(summary.facts.find((entry) => entry.stage === 'tokens')).toEqual({
				stage: 'tokens',
				ok: true,
				description: '4 tokens',
			});
		});

		it('describes the ast stage by syntax-node count', () => {
			const summary = summarize(embody('let x = 1'), {});
			expect(summary.facts.find((entry) => entry.stage === 'ast')).toEqual({
				stage: 'ast',
				ok: true,
				description: '5 nodes',
			});
		});

		it('describes the entwined stage by entwined-node count', () => {
			const summary = summarize(embody('let x = 1'), {});
			expect(summary.facts.find((entry) => entry.stage === 'entwined')).toEqual(
				{ stage: 'entwined', ok: true, description: '5 nodes' },
			);
		});

		it('describes the environment stage by scope count', () => {
			const summary = summarize(embody('let x = 1'), {});
			expect(
				summary.facts.find((entry) => entry.stage === 'environment'),
			).toEqual({ stage: 'environment', ok: true, description: '2 scopes' });
		});

		it('restates a script type', () => {
			const summary = summarize(embody('let x = 1', { type: 'script' }), {});
			expect(summary.facts.find((entry) => entry.stage === 'type')).toEqual({
				stage: 'type',
				ok: true,
				description: 'script',
			});
		});
	});

	describe('a nested-function program', () => {
		it('counts the longer source', () => {
			const summary = summarize(
				embody('function f() { let x = 1; return x; }\nf();'),
				{},
			);
			expect(summary.facts.find((entry) => entry.stage === 'source')).toEqual({
				stage: 'source',
				ok: true,
				description: '42 characters',
			});
		});

		it('counts the longer token stream', () => {
			const summary = summarize(
				embody('function f() { let x = 1; return x; }\nf();'),
				{},
			);
			expect(summary.facts.find((entry) => entry.stage === 'tokens')).toEqual({
				stage: 'tokens',
				ok: true,
				description: '18 tokens',
			});
		});

		it('counts the deeper syntax tree', () => {
			const summary = summarize(
				embody('function f() { let x = 1; return x; }\nf();'),
				{},
			);
			expect(summary.facts.find((entry) => entry.stage === 'ast')).toEqual({
				stage: 'ast',
				ok: true,
				description: '13 nodes',
			});
		});

		it('counts the same nodes through the entwined index', () => {
			const summary = summarize(
				embody('function f() { let x = 1; return x; }\nf();'),
				{},
			);
			expect(summary.facts.find((entry) => entry.stage === 'entwined')).toEqual(
				{ stage: 'entwined', ok: true, description: '13 nodes' },
			);
		});

		it('counts the function scope', () => {
			const summary = summarize(
				embody('function f() { let x = 1; return x; }\nf();'),
				{},
			);
			expect(
				summary.facts.find((entry) => entry.stage === 'environment'),
			).toEqual({ stage: 'environment', ok: true, description: '3 scopes' });
		});
	});

	describe('a program with grouping parentheses', () => {
		it('counts the published tree, not the parenthesized parse', () => {
			const summary = summarize(embody('const x = ((1 + 2)) * (3 - 4);'), {});
			// PINNED(human ruling 2026-07-30: published ast is ESTree-shaped — parens fold away; the exact count is the guard, since a surviving wrapper inflates it)
			expect(summary.facts.find((entry) => entry.stage === 'ast')).toEqual({
				stage: 'ast',
				ok: true,
				description: '11 nodes',
			});
		});

		it('counts the same folded nodes through the entwined index', () => {
			const summary = summarize(embody('const x = ((1 + 2)) * (3 - 4);'), {});
			// PINNED(human ruling 2026-07-30: published ast is ESTree-shaped — parens fold away; a surviving wrapper would be indexed like any other node, so the key count is what guards)
			expect(summary.facts.find((entry) => entry.stage === 'entwined')).toEqual(
				{ stage: 'entwined', ok: true, description: '11 nodes' },
			);
		});
	});

	describe('the study layer', () => {
		it('surfaces attached lens names in roster order', () => {
			const flowchart = {
				name: 'flowchart',
				applicability: () => true,
				phase: 'ast',
			} as const;
			const annotate = {
				name: 'annotate',
				applicability: () => true,
				phase: 'ast',
			} as const;
			const summary = summarize(
				embody('let x = 1', { lenses: [flowchart, annotate] }),
				{},
			);
			expect(summary.study.find((entry) => entry.phase === 'ast')).toEqual({
				phase: 'ast',
				accessible: true,
				lenses: ['flowchart', 'annotate'],
			});
		});

		it('leaves an open phase with no roster empty', () => {
			const summary = summarize(embody('let x = 1'), {});
			expect(summary.study.find((entry) => entry.phase === 'source')).toEqual({
				phase: 'source',
				accessible: true,
				lenses: [],
			});
		});
	});

	describe('failed stages', () => {
		it('keeps the parser voice for a grammar failure', () => {
			const summary = summarize(embody('1 +'), {});
			expect(summary.facts.find((entry) => entry.stage === 'ast')).toEqual({
				stage: 'ast',
				ok: false,
				causeMessage: 'Unexpected token (1:3)',
			});
		});

		it('repeats the originating cause on the entwined stage', () => {
			const summary = summarize(embody('1 +'), {});
			expect(summary.facts.find((entry) => entry.stage === 'entwined')).toEqual(
				{
					stage: 'entwined',
					ok: false,
					causeMessage: 'Unexpected token (1:3)',
				},
			);
		});

		it('repeats the originating cause on the environment stage', () => {
			const summary = summarize(embody('1 +'), {});
			expect(
				summary.facts.find((entry) => entry.stage === 'environment'),
			).toEqual({
				stage: 'environment',
				ok: false,
				causeMessage: 'Unexpected token (1:3)',
			});
		});

		it('fails the tokens stage on a spelling failure', () => {
			const summary = summarize(embody("'unterminated"), {});
			expect(summary.facts.find((entry) => entry.stage === 'tokens')).toEqual({
				stage: 'tokens',
				ok: false,
				causeMessage: 'Unterminated string constant (1:0)',
			});
		});
	});

	describe('own-stage vs cascaded barring', () => {
		it('leaves the ast phase accessible under its own grammar error', () => {
			const summary = summarize(embody('1 +'), {});
			expect(summary.study.find((entry) => entry.phase === 'ast')).toEqual({
				phase: 'ast',
				accessible: true,
				lenses: [],
			});
		});

		it('bars the environment phase downstream of the grammar error', () => {
			const summary = summarize(embody('1 +'), {});
			expect(
				summary.study.find((entry) => entry.phase === 'environment'),
			).toEqual({
				phase: 'environment',
				accessible: false,
				lenses: [],
				causeMessage: 'Unexpected token (1:3)',
			});
		});

		it('bars the evaluation phase downstream of the grammar error', () => {
			const summary = summarize(embody('1 +'), {});
			expect(
				summary.study.find((entry) => entry.phase === 'evaluation'),
			).toEqual({
				phase: 'evaluation',
				accessible: false,
				lenses: [],
				causeMessage: 'Unexpected token (1:3)',
			});
		});

		it('keeps attached lens names on a barred phase', () => {
			const flowchart = {
				name: 'flowchart',
				applicability: () => true,
				phase: 'ast',
			} as const;
			const summary = summarize(embody('01', { lenses: [flowchart] }), {});
			expect(summary.study.find((entry) => entry.phase === 'ast')).toEqual({
				phase: 'ast',
				accessible: false,
				lenses: ['flowchart'],
				causeMessage: 'Invalid number (1:0)',
			});
		});
	});

	describe('the config echo', () => {
		it('echoes a populated config record', () => {
			const summary = summarize(embody('let x = 1'), {
				stepDelay: 500,
				cols: ['value', 'steps'],
			});
			expect(summary.config).toEqual({
				stepDelay: 500,
				cols: ['value', 'steps'],
			});
		});

		it('leaves the caller config unfrozen', () => {
			const config = { stepDelay: 500 };
			summarize(embody('let x = 1'), config);
			expect(Object.isFrozen(config)).toBe(false);
		});

		it('freezes the summary and its entry lists', () => {
			const summary = summarize(embody('let x = 1'), { stepDelay: 500 });
			expect(
				Object.isFrozen(summary) &&
					Object.isFrozen(summary.facts) &&
					Object.isFrozen(summary.study),
			).toBe(true);
		});

		it('freezes the entries and the config echo', () => {
			const summary = summarize(embody('let x = 1'), { stepDelay: 500 });
			expect(
				Object.isFrozen(summary.facts[0]) &&
					Object.isFrozen(summary.study[0]) &&
					Object.isFrozen(summary.config),
			).toBe(true);
		});
	});
});
