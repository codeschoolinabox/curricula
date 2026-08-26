/**
 * @file The loc wrap's ZOMBIES cluster, transported content-level from the
 * deprecated port's suite (29 rows) and EXTENDED with the offset-pair rows
 * (the HR-12 addition): the wrap over the guard-spliced text, every stamp —
 * span AND offsets — read from the ORIGINAL text, the guard protocol's own
 * calls skipped, unsafe calls declined symmetrically, and the
 * reconciliation's typed throw.
 *
 * Every stamped coordinate in this file was MEASURED against the project's
 * own acorn before being written (a vitest-run span probe over the real
 * `spliceIterationGuards`), never hand-computed — the deprecated suite's
 * review history caught a hand-pinned column off by one. The modal-shape
 * rows drive the REAL `spliceIterationGuards` (a committed, covered
 * dependency — bottom-up, never mocked), so the guarded text those rows
 * rewrite is the text production will rewrite.
 *
 * Triangulation, stated honestly: the first One row alone is passable by a
 * hardcoded return; the second One row (different call, different stamp)
 * and the Many rows (two stamps in one output) kill it.
 *
 * The direct-eval fixture is inert string data — the verb under test only
 * PARSES learner code; nothing in this suite ever executes any fixture.
 *
 * Citations carried forward, unpinned — the pinned-guard hook is
 * unregistered, and a guard-down period accepts no new `PINNED` markers
 * (human ruling 2026-08-06: ship the assertion, plant its marker when the
 * guard is re-armed). The deprecated suite's twelve markers keep their
 * authority at their own file; the rulings they carry govern these rows:
 * the ar-1 span-fidelity ruling 2026-08-04 (spans read from the original,
 * placement against the guarded text) and the guard-first splice-order
 * human ruling 2026-08-05 → the modal-shape rows; the fixed-parse-goal
 * commitment → the parse-goal rows; B-3 2026-08-05 (await/yield anywhere
 * in the call's own subtree declines; super declined) with the ar-3 I1
 * resolution 2026-08-05 (a real recursive walk, never a direct-child
 * check) → the declined-call rows; human ruling H-5 2026-08-05 and its
 * extension (chain ROOT wrapped, interior spine links never, argument
 * calls are no chain links) → the chain rows; B-6 2026-08-05 (a
 * reconciliation disagreement is a typed machinery-defect throw) with the
 * ar-4 I1 resolution 2026-08-05 (the pairwise fingerprint closes the
 * same-count hole) → the reconciliation rows.
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
		it('wraps it with its own stamp, read from the original text', () => {
			expect(wrapSame("console.log('hi');")).toBe(
				"__$lc('1:0:1:17:0:17', () => console.log('hi'));",
			);
		});

		it('a different call reads a different stamp', () => {
			expect(wrapSame("alert('yo');")).toBe(
				"__$lc('1:0:1:11:0:11', () => alert('yo'));",
			);
		});
	});

	describe('many calls', () => {
		it('wraps nested calls bottom-up, the inner already wrapped inside the outer', () => {
			expect(wrapSame("console.log(prompt('who?'));")).toBe(
				"__$lc('1:0:1:27:0:27', () => console.log(__$lc('1:12:1:26:12:26', () => prompt('who?'))));",
			);
		});

		it('wraps sequential calls each with its own line', () => {
			expect(wrapSame('console.log(1);\nconsole.log(2);')).toBe(
				"__$lc('1:0:1:14:0:14', () => console.log(1));\n__$lc('2:0:2:14:16:30', () => console.log(2));",
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
				"__$lc('1:0:1:13:0:13', () => obj.method(1));",
			);
		});

		it('wraps every call expression, not only the trapped surfaces', () => {
			expect(wrapSame('Math.max(1, 2);')).toBe(
				"__$lc('1:0:1:14:0:14', () => Math.max(1, 2));",
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

			expect(
				wrapCallExpressions({ guarded, original, sourceType: 'script' }),
			).toContain("__$lc('1:36:1:50:36:50', () => console.log(i))");
		});

		it("the guard protocol's own call survives verbatim", () => {
			const guarded = spliceIterationGuards(original).code;

			expect(
				wrapCallExpressions({ guarded, original, sourceType: 'script' }),
			).toContain("__$il(1, '1:0:1:53');");
		});

		it('the guard call is never wrapped', () => {
			const guarded = spliceIterationGuards(original).code;

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

	describe('the offset pair — read from the original parse, in UTF-16 units', () => {
		it("a multi-line guarded body: the span matches both readings while the offsets are the ORIGINAL text's own", () => {
			const original =
				'for (let i = 0; i < 3; i = i + 1) {\n\tconsole.log(i);\n}';
			const guarded = spliceIterationGuards(original).code;

			expect(
				wrapCallExpressions({ guarded, original, sourceType: 'script' }),
			).toContain("__$lc('2:1:2:15:37:51', () => console.log(i))");
		});

		it('offsets count UTF-16 code units, not code points', () => {
			expect(wrapSame("const s = '🎉';\nconsole.log(s);")).toBe(
				"const s = '🎉';\n__$lc('2:0:2:14:16:30', () => console.log(s));",
			);
		});
	});

	describe('the parse goal', () => {
		it('a module-goal source parses and wraps under top-level await', () => {
			expect(wrapSame('await f();', 'module')).toBe(
				"await __$lc('1:6:1:9:6:9', () => f());",
			);
		});

		it('a bare guard-protocol call is identity by reference', () => {
			const guarded = '__$ir(1);';

			expect(wrapSame(guarded)).toBe(guarded);
		});
	});

	describe('declined calls — left as the learner wrote them', () => {
		it('a call with await in its arguments is declined, its inner call still wrapped', () => {
			expect(wrapSame('f(await g());', 'module')).toBe(
				"f(await __$lc('1:8:1:11:8:11', () => g()));",
			);
		});

		it('await two levels deep declines every enclosing call, the innermost still wrapped', () => {
			expect(wrapSame('f(x(await g()));', 'module')).toBe(
				"f(x(await __$lc('1:10:1:13:10:13', () => g())));",
			);
		});

		it('a call with await in its callee is identity by reference', () => {
			const guarded = '(await f)();';

			expect(wrapSame(guarded, 'module')).toBe(guarded);
		});

		it('a call nested inside an awaited callee is still wrapped', () => {
			expect(wrapSame('(await g())();', 'module')).toBe(
				"(await __$lc('1:7:1:10:7:10', () => g()))();",
			);
		});

		it('a call with yield in its arguments is declined, its inner call still wrapped', () => {
			expect(wrapSame('function* g() {\n\tf(yield h());\n}')).toBe(
				"function* g() {\n\tf(yield __$lc('2:9:2:12:25:28', () => h()));\n}",
			);
		});

		it("a chain's ROOT call is wrapped, carrying the chain's own stamp", () => {
			expect(wrapSame('a?.b();')).toBe("__$lc('1:0:1:6:0:6', () => a?.b());");
		});

		it('a continuing chain wraps only its root, leaving every interior link verbatim', () => {
			expect(wrapSame('a?.b().c().d();')).toBe(
				"__$lc('1:0:1:14:0:14', () => a?.b().c().d());",
			);
		});

		it('a trapped surface reached through a chain gets its stamp', () => {
			expect(wrapSame('console?.log(x);')).toBe(
				"__$lc('1:0:1:15:0:15', () => console?.log(x));",
			);
		});

		it("a call in a chain call's ARGUMENTS is wrapped — it is no chain link", () => {
			expect(wrapSame('a?.b(c());')).toBe(
				"__$lc('1:0:1:9:0:9', () => a?.b(__$lc('1:5:1:8:5:8', () => c())));",
			);
		});

		it('a super call is identity by reference', () => {
			const guarded = 'class A extends B { constructor() { super(); } }';

			expect(wrapSame(guarded)).toBe(guarded);
		});

		it('direct eval is identity by reference', () => {
			const guarded = "eval('1');";

			expect(wrapSame(guarded)).toBe(guarded);
		});
	});

	describe('the reconciliation', () => {
		it('a disagreement about which wrap-eligible calls exist throws', () => {
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
