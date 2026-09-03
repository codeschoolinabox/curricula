import { describe, expect, it } from 'vitest';

import deriveTokens from '../derive-tokens.js';
import embody from '../index.js';

describe('failure accounts', () => {
	describe('the token prefix', () => {
		it('a stop before any complete turn publishes an empty prefix', () => {
			const stage = deriveTokens({ source: '@', type: 'module' });
			expect(!stage.ok && stage.value?.tokens).toEqual([]);
		});

		it('an empty prefix carries an empty bounded sequence, not an absent one', () => {
			const stage = deriveTokens({ source: '@', type: 'module' });
			expect(!stage.ok && stage.value?.inputElements).toEqual([]);
		});

		it('a one-turn reading keeps its one token', () => {
			const stage = deriveTokens({ source: 'let @', type: 'module' });
			expect(!stage.ok && stage.value?.tokens.length).toBe(1);
		});

		it('a longer reading keeps every completed turn', () => {
			const stage = deriveTokens({ source: "let x = 'oops", type: 'module' });
			expect(!stage.ok && stage.value?.tokens.length).toBe(3);
		});

		it('comments set aside before the stop travel with the prefix', () => {
			const stage = deriveTokens({ source: '//c\nlet @', type: 'module' });
			expect(!stage.ok && stage.value?.comments.length).toBe(1);
		});

		it('the bounded sequence starts at offset zero', () => {
			const stage = deriveTokens({ source: "let x = 'oops", type: 'module' });
			expect(!stage.ok && stage.value?.inputElements?.[0]?.start).toBe(0);
		});

		it('the bounded sequence ends at the last token when no comment follows', () => {
			const stage = deriveTokens({ source: "let x = 'oops", type: 'module' });
			expect(!stage.ok && stage.value?.inputElements?.at(-1)?.end).toBe(7);
		});

		it('the extent follows the later channel when a comment outlasts the tokens', () => {
			const stage = deriveTokens({ source: 'let //c\n@', type: 'module' });
			expect(!stage.ok && stage.value?.inputElements?.at(-1)?.end).toBe(7);
		});

		it('the bounded texts join to the sliced source when the comment outlasts the tokens', () => {
			const stage = deriveTokens({ source: 'let //c\n@', type: 'module' });
			expect(
				!stage.ok &&
					stage.value?.inputElements?.map((element) => element.text).join(''),
			).toBe('let //c');
		});

		it('the bounded texts join to the sliced source when no comment follows', () => {
			const stage = deriveTokens({ source: "let x = 'oops", type: 'module' });
			expect(
				!stage.ok &&
					stage.value?.inputElements?.map((element) => element.text).join(''),
			).toBe('let x =');
		});

		it('the bounded texts join to the sliced source when the tokens outlast the comment', () => {
			const stage = deriveTokens({ source: '//c\nlet @', type: 'module' });
			expect(
				!stage.ok &&
					stage.value?.inputElements?.map((element) => element.text).join(''),
			).toBe('//c\nlet');
		});

		it('the extent sits at or before the reported stopping point', () => {
			const stage = deriveTokens({ source: "let x = 'oops", type: 'module' });
			expect(
				!stage.ok &&
					stage.cause.offset !== undefined &&
					(stage.value?.inputElements?.at(-1)?.end ??
						Number.MAX_SAFE_INTEGER) <= stage.cause.offset,
			).toBe(true);
		});

		it.skip('bounded element token indices stay inside the prefix', () => {
			const stage = deriveTokens({ source: "let x = 'oops", type: 'module' });
			const prefix = stage.ok ? undefined : stage.value;
			const tokenCount = prefix?.tokens.length ?? 0;
			expect(
				prefix?.inputElements?.every((element) =>
					element.tokenIndices.every((index) => index < tokenCount),
				),
			).toBe(true);
		});
	});

	describe('the recovered account', () => {
		it.skip('a program that lexes but does not parse carries a recovered tree', () => {
			const { facts } = embody('const x = ;');
			expect(!facts.ast.ok && facts.ast.value?.type).toBe('Program');
		});

		it.skip('the invented nodes are enumerated exactly when the tree is published', () => {
			const { facts } = embody('const x = ;');
			expect(
				!facts.ast.ok &&
					facts.ast.value !== undefined &&
					Array.isArray(facts.ast.invented),
			).toBe(true);
		});

		it.skip('every enumerated invention is a node of the recovered tree itself', () => {
			const { facts } = embody('const x = ;');
			const recovered = facts.ast.ok ? undefined : facts.ast.value;
			const invented = facts.ast.ok ? [] : (facts.ast.invented ?? []);
			const members = new Set<unknown>();
			const pending: unknown[] = [recovered];
			while (pending.length > 0) {
				const candidate = pending.pop();
				if (
					typeof candidate === 'object' &&
					candidate !== null &&
					!members.has(candidate)
				) {
					members.add(candidate);
					const slots = candidate as unknown as Record<string, unknown>;
					pending.push(...Object.values(slots));
				}
			}
			expect(
				invented.length > 0 && invented.every((node) => members.has(node)),
			).toBe(true);
		});

		it.skip('a tokens failure publishes no recovered tree', () => {
			const { facts } = embody('@');
			expect(!facts.ast.ok && facts.ast.value === undefined).toBe(true);
		});

		it.skip('a tokens failure publishes no recovered binding', () => {
			const { facts } = embody('@');
			expect(!facts.entwined.ok && facts.entwined.value === undefined).toBe(
				true,
			);
		});

		it.skip('a tokens failure publishes no environment account', () => {
			const { facts } = embody('@');
			expect(
				!facts.environment.ok && facts.environment.value === undefined,
			).toBe(true);
		});

		it.skip('the entwined account binds the recovered tree, not another', () => {
			const { facts } = embody('const x = ;');
			const recovered = facts.ast.ok ? undefined : facts.ast.value;
			expect(!facts.entwined.ok && facts.entwined.value?.root.node).toBe(
				recovered,
			);
		});

		it.skip('the recovered binding indexes every source offset', () => {
			const source = 'const x = ;';
			const { facts } = embody(source);
			expect(!facts.entwined.ok && facts.entwined.value?.byOffset.length).toBe(
				source.length,
			);
		});

		it.skip('the environment account reads the recovered tree', () => {
			const { facts } = embody('const x = ;');
			expect(!facts.environment.ok && facts.environment.value?.root.type).toBe(
				'global',
			);
		});

		it.skip('an environment element resting on invention is marked', () => {
			const { facts } = embody('const x = ;');
			const root = facts.environment.ok
				? undefined
				: facts.environment.value?.root;
			expect(
				root !== undefined &&
					[root, ...root.childScopes].some((scope) =>
						scope.references.some((reference) => reference.invented === true),
					),
			).toBe(true);
		});

		it.skip('the accounts freeze with their arms', () => {
			const { facts } = embody('const x = ;');
			const recovered = facts.ast.ok ? undefined : facts.ast.value;
			expect(recovered !== undefined && Object.isFrozen(recovered)).toBe(true);
		});

		it.skip('the cause still names the failing stage beside its account', () => {
			const { facts } = embody('const x = ;');
			expect(!facts.ast.ok && facts.ast.cause.stage).toBe('ast');
		});

		it.skip('phase accessibility is unchanged by an account', () => {
			const { study } = embody('const x = ;');
			expect(
				study.ast.accessible &&
					!study.environment.accessible &&
					!study.evaluation.accessible,
			).toBe(true);
		});
	});
});
