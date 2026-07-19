import { describe, expect, it } from 'vitest';

import deriveFacts from '../derive-facts.js';

describe('deriveFacts', () => {
	describe('a clean program', () => {
		it('derives all six stages ok', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			expect(facts.environment.ok).toBe(true);
		});

		it('the tokens stage is ok', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			expect(facts.tokens.ok).toBe(true);
		});

		it('source restates the snippet source', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			expect(facts.source.value).toBe('let x = 1');
		});

		it('type restates the snippet type', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			expect(facts.type.value).toBe('script');
		});

		it('one shared tree — the entwined root holds the ast', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			expect(
				facts.ast.ok &&
					facts.entwined.ok &&
					facts.entwined.value.root.node === facts.ast.value,
			).toBe(true);
		});

		it('one shared stream — the entwined ties hold the very tokens', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			expect(
				facts.tokens.ok &&
					facts.entwined.ok &&
					facts.entwined.value.root.tokens[0]?.token ===
						facts.tokens.value.tokens[0],
			).toBe(true);
		});
	});

	describe('an empty module', () => {
		it('derives all six stages ok', () => {
			const facts = deriveFacts({ source: '', type: 'module' });
			expect(facts.environment.ok).toBe(true);
		});

		it('the module scope opens — the type threaded through', () => {
			const facts = deriveFacts({ source: '', type: 'module' });
			expect(
				facts.environment.ok && facts.environment.value.root.childScopes,
			).toHaveLength(1);
		});

		it('source restates the empty source', () => {
			const facts = deriveFacts({ source: '', type: 'module' });
			expect(facts.source.value).toBe('');
		});

		it('type restates the module type', () => {
			const facts = deriveFacts({ source: '', type: 'module' });
			expect(facts.type.value).toBe('module');
		});
	});

	describe('a spelling failure', () => {
		it('the tokens stage fails', () => {
			const facts = deriveFacts({ source: '01', type: 'module' });
			expect(facts.tokens.ok).toBe(false);
		});

		it('the ast stage carries the very tokens cause', () => {
			const facts = deriveFacts({ source: '01', type: 'module' });
			expect(
				!facts.tokens.ok &&
					!facts.ast.ok &&
					facts.ast.cause === facts.tokens.cause,
			).toBe(true);
		});

		it('the entwined stage carries the very tokens cause', () => {
			const facts = deriveFacts({ source: '01', type: 'module' });
			expect(
				!facts.tokens.ok &&
					!facts.entwined.ok &&
					facts.entwined.cause === facts.tokens.cause,
			).toBe(true);
		});

		it('the environment stage carries the very tokens cause', () => {
			const facts = deriveFacts({ source: '01', type: 'module' });
			expect(
				!facts.tokens.ok &&
					!facts.environment.ok &&
					facts.environment.cause === facts.tokens.cause,
			).toBe(true);
		});
	});

	describe('a grammar failure', () => {
		it('the tokens stage stays ok', () => {
			const facts = deriveFacts({ source: 'const', type: 'script' });
			expect(facts.tokens.ok).toBe(true);
		});

		it('the ast stage originates its own cause', () => {
			const facts = deriveFacts({ source: 'const', type: 'script' });
			expect(!facts.ast.ok && facts.ast.cause.stage).toBe('ast');
		});

		it('the entwined stage carries the very ast cause', () => {
			const facts = deriveFacts({ source: 'const', type: 'script' });
			expect(
				!facts.ast.ok &&
					!facts.entwined.ok &&
					facts.entwined.cause === facts.ast.cause,
			).toBe(true);
		});

		it('the environment stage carries the very ast cause', () => {
			const facts = deriveFacts({ source: 'const', type: 'script' });
			expect(
				!facts.ast.ok &&
					!facts.environment.ok &&
					facts.environment.cause === facts.ast.cause,
			).toBe(true);
		});

		it('source stays a given', () => {
			const facts = deriveFacts({ source: 'const', type: 'script' });
			expect(facts.source.value).toBe('const');
		});

		it('type stays a given', () => {
			const facts = deriveFacts({ source: 'const', type: 'script' });
			expect(facts.type.value).toBe('script');
		});
	});
});
