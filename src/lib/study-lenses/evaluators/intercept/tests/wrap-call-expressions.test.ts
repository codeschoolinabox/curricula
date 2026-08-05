/**
 * @file I1's ZOMBIES cluster: the loc wrap over the guarded text, spans read
 * from the ORIGINAL text, the guard protocol's own calls skipped, unsafe
 * calls declined symmetrically, and the reconciliation's typed throw.
 *
 * Every pinned span value in this file was MEASURED against the project's
 * own acorn before being written (`node scratchpad/span-probe.mjs`), never
 * hand-computed — a prior increment's review caught a hand-pinned column
 * off by one. The modal-shape rows drive the REAL `spliceIterationGuards`
 * (a committed, covered dependency — bottom-up, never mocked), so the
 * guarded text those rows rewrite is the text production will rewrite.
 *
 * Triangulation, stated honestly: the first One row alone is passable by a
 * hardcoded return; the second One row (different call, different span) and
 * the Many rows (two spans in one output) kill it.
 *
 * The direct-eval fixture is inert string data — the verb under test only
 * PARSES learner code; nothing in this suite ever executes any fixture.
 */

import { describe, expect, it } from 'vitest';

import spliceIterationGuards from '../../lib/iteration-guard/splice-iteration-guards.js';
import wrapCallExpressions from '../wrap-call-expressions.js';

function wrapSame(
	code: string,
	sourceType: 'script' | 'module' = 'script',
): string {
	return wrapCallExpressions({ guarded: code, original: code, sourceType });
}

describe('wrapCallExpressions', () => {
	describe('a source with no wrap-eligible calls', () => {
		it('returns the guarded input by reference', () => {
			const guarded = 'let x = 1;';

			expect(wrapSame(guarded)).toBe(guarded);
		});
	});

	describe('one call', () => {
		it('wraps it with its own span, read from the original text', () => {
			expect(wrapSame("console.log('hi');")).toBe(
				"__$lc('1:0:1:17', () => console.log('hi'));",
			);
		});

		it('a different call reads a different span', () => {
			expect(wrapSame("alert('yo');")).toBe(
				"__$lc('1:0:1:11', () => alert('yo'));",
			);
		});
	});

	describe('many calls', () => {
		it('wraps nested calls bottom-up, the inner already wrapped inside the outer', () => {
			expect(wrapSame("console.log(prompt('who?'));")).toBe(
				"__$lc('1:0:1:27', () => console.log(__$lc('1:12:1:26', () => prompt('who?'))));",
			);
		});

		it('wraps sequential calls each with its own line', () => {
			expect(wrapSame('console.log(1);\nconsole.log(2);')).toBe(
				"__$lc('1:0:1:14', () => console.log(1));\n__$lc('2:0:2:14', () => console.log(2));",
			);
		});

		it('preserves the line count', () => {
			const original = 'console.log(1);\nlet x = 2;\nconsole.log(x);';

			expect(wrapSame(original).split('\n')).toHaveLength(3);
		});
	});

	describe('ordinary calls', () => {
		it('keeps a method call verbatim inside the wrap, receiver intact', () => {
			expect(wrapSame('obj.method(1);')).toBe(
				"__$lc('1:0:1:13', () => obj.method(1));",
			);
		});

		it('wraps every call expression, not only the trapped surfaces', () => {
			expect(wrapSame('Math.max(1, 2);')).toBe(
				"__$lc('1:0:1:14', () => Math.max(1, 2));",
			);
		});

		it('a construction is not a call expression and is untouched', () => {
			const guarded = 'new Foo();';

			expect(wrapSame(guarded)).toBe(guarded);
		});
	});

	describe('the modal shape — a guarded one-line loop body', () => {
		const original = 'for (let i = 0; i < 3; i = i + 1) { console.log(i); }';

		it("the span is the ORIGINAL text's, not the guarded text's shifted columns", () => {
			const guarded = spliceIterationGuards(original).code;

			// PINNED(ar-1 span-fidelity ruling 2026-08-04: placement is computed against the guarded text while the span reported is the original's — the guard splice shifts every same-line column past the body brace)
			expect(
				wrapCallExpressions({ guarded, original, sourceType: 'script' }),
			).toContain("__$lc('1:36:1:50', () => console.log(i))");
		});

		it("the guard protocol's own call survives verbatim", () => {
			const guarded = spliceIterationGuards(original).code;

			expect(
				wrapCallExpressions({ guarded, original, sourceType: 'script' }),
			).toContain("__$il(1, '1:0:1:53');");
		});

		it('the guard call is never wrapped', () => {
			const guarded = spliceIterationGuards(original).code;

			// PINNED(I1 ordering ruling, campaign ledger Rev-E: guards splice FIRST on the original source and the wrap SKIPS __$-prefixed callee names — the reverse order corrupts the attribution both instruments exist to provide)
			expect(
				wrapCallExpressions({ guarded, original, sourceType: 'script' }),
			).not.toContain('() => __$il');
		});

		it('the reset call is never wrapped', () => {
			const guarded = spliceIterationGuards(original).code;

			expect(
				wrapCallExpressions({ guarded, original, sourceType: 'script' }),
			).not.toContain('() => __$ir');
		});
	});

	describe('the parse goal', () => {
		it('a module-goal source parses and wraps under top-level await', () => {
			// PINNED(committed README § Design commitments: the parse goal is fixed — the same goal the snippet was parsed with — so a program that parsed upstream cannot fail to parse here)
			expect(wrapSame('await f();', 'module')).toBe(
				"await __$lc('1:6:1:9', () => f());",
			);
		});

		it('a bare guard-protocol call is identity by reference', () => {
			const guarded = '__$ir(1);';

			expect(wrapSame(guarded)).toBe(guarded);
		});
	});

	describe('declined calls — left as the learner wrote them', () => {
		it('a call with await in its arguments is declined, its inner call still wrapped', () => {
			// PINNED(B-3, Phase-1 briefing decisions 2026-08-05: await/yield belonging to the enclosing function anywhere in the call's own subtree declines the wrap)
			expect(wrapSame('f(await g());', 'module')).toBe(
				"f(await __$lc('1:8:1:11', () => g()));",
			);
		});

		it('await two levels deep declines every enclosing call, the innermost still wrapped', () => {
			// PINNED(ar-3 I1 resolution 2026-08-05: "anywhere in the subtree" means a real recursive walk — a direct-child check fails to decline the outermost call)
			expect(wrapSame('f(x(await g()));', 'module')).toBe(
				"f(x(await __$lc('1:10:1:13', () => g())));",
			);
		});

		it('a call with await in its callee is identity by reference', () => {
			const guarded = '(await f)();';

			expect(wrapSame(guarded, 'module')).toBe(guarded);
		});

		it('a call nested inside an awaited callee is still wrapped', () => {
			expect(wrapSame('(await g())();', 'module')).toBe(
				"(await __$lc('1:7:1:10', () => g()))();",
			);
		});

		it('a call with yield in its arguments is declined, its inner call still wrapped', () => {
			// PINNED(B-3, Phase-1 briefing decisions 2026-08-05: yield rides the same clause as await — an implementation special-casing AwaitExpression alone must fail here)
			expect(wrapSame('function* g() {\n\tf(yield h());\n}')).toBe(
				"function* g() {\n\tf(yield __$lc('2:9:2:12', () => h()));\n}",
			);
		});

		it("a chain's ROOT call is wrapped, carrying the chain's own span", () => {
			// PINNED(human ruling H-5 2026-08-05: the root's span already covers the whole chain verbatim, so wrapping it is behavior-preserving on every axis ar-4 probed — return value, short-circuit on a nullish receiver, and argument-evaluation side effects; only INTERIOR links defeat the short-circuit)
			expect(wrapSame('a?.b();')).toBe("__$lc('1:0:1:6', () => a?.b());");
		});

		it('a continuing chain wraps only its root, leaving every interior link verbatim', () => {
			// PINNED(human ruling H-5 2026-08-05: acorn flags the member, not the call, so every call node here is optional:false — the spine rule is what distinguishes them; wrapping an interior link turns a short-circuiting program into a throwing one)
			expect(wrapSame('a?.b().c().d();')).toBe(
				"__$lc('1:0:1:14', () => a?.b().c().d());",
			);
		});

		it('a trapped surface reached through a chain gets its loc', () => {
			expect(wrapSame('console?.log(x);')).toBe(
				"__$lc('1:0:1:15', () => console?.log(x));",
			);
		});

		it("a call in a chain call's ARGUMENTS is wrapped — it is no chain link", () => {
			// PINNED(human ruling H-5 extension 2026-08-05: an argument call cannot affect the chain's short-circuit — if the receiver is nullish the argument never evaluates either way — so declining it would cost a span for no safety reason)
			expect(wrapSame('a?.b(c());')).toBe(
				"__$lc('1:0:1:9', () => a?.b(__$lc('1:5:1:8', () => c())));",
			);
		});

		it('a super call is identity by reference', () => {
			const guarded = 'class A extends B { constructor() { super(); } }';

			// PINNED(B-3, Phase-1 briefing decisions 2026-08-05: a call whose scope is its own call site is declined — ar-2's third shape)
			expect(wrapSame(guarded)).toBe(guarded);
		});

		it('direct eval is identity by reference', () => {
			const guarded = "eval('1');";

			expect(wrapSame(guarded)).toBe(guarded);
		});
	});

	describe('the reconciliation', () => {
		it('a disagreement about which wrap-eligible calls exist throws', () => {
			// PINNED(B-6, Phase-1 briefing decisions 2026-08-05: a reconciliation disagreement is a machinery defect surfaced as a typed boundary throw, never a silently shifted span)
			expect(() =>
				wrapCallExpressions({
					guarded: 'f(); g();',
					original: 'f();',
					sourceType: 'script',
				}),
			).toThrow();
		});

		it('the throw carries the boundary tag', () => {
			expect(() =>
				wrapCallExpressions({
					guarded: 'f(); g();',
					original: 'f();',
					sourceType: 'script',
				}),
			).toThrow(expect.objectContaining({ locWrapBoundary: true }) as Error);
		});

		it('a same-count reading whose call shapes differ still throws', () => {
			// PINNED(ar-4 I1 resolution 2026-08-05: count equality alone lets two unrelated same-count texts reconcile silently and mis-attribute every span — the pairwise fingerprint closes it)
			expect(() =>
				wrapCallExpressions({
					guarded: 'f(1);',
					original: 'f();',
					sourceType: 'script',
				}),
			).toThrow(expect.objectContaining({ locWrapBoundary: true }) as Error);
		});
	});
});
