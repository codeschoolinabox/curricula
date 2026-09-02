/**
 * @file The enrichment cluster (HR-12), fresh-authored — the deprecated
 * kind had no enrichment, so no suite transports; the quarry's
 * `entwining.browser` rows and `lookup-node-path` cases inform the join
 * and fallback rows (README § The suite). Driven through the REAL embody
 * pipeline (node-at-span.test.ts's precedent): every entwined record is
 * derived, never faked, so the joins are exercised against the graph the
 * run would hold.
 *
 * Triangulation, stated honestly: the loc-null rows alone are passable by
 * a hardcoded all-null answer; the attributed-record rows kill it, the
 * ascent and tie rows force the exact join through `nodeAtSpan` rather
 * than a byOffset read, the fallback rows force the enclosing read to be
 * a SEPARATE operation, and the timeline rows force per-run shared state
 * behind the accessors.
 */

import { describe, expect, it } from 'vitest';

import deriveAst from '../../../embody/derive-ast.js';
import deriveEntwined from '../../../embody/derive-entwined.js';
import deriveTokens from '../../../embody/derive-tokens.js';
import type { Entwined } from '../../../embody/types.js';
import enrichEvent from '../enrich-event.js';
import type { InterceptEnrichment } from '../types.js';

function entwine(source: string): Entwined {
	const snippet = { source, type: 'script' } as const;
	const tokens = deriveTokens(snippet);
	const { ast, parenSpansByNode } = deriveAst(snippet, tokens);
	const stage = deriveEntwined(snippet.source, tokens, ast, parenSpansByNode);
	if (!stage?.ok) {
		throw new Error('fixture failed to entwine');
	}
	return stage.value;
}

function enrichmentOf(source: string): {
	entwined: Entwined;
	enrichment: InterceptEnrichment;
} {
	const entwined = entwine(source);
	return { entwined, enrichment: enrichEvent({ source, entwined }) };
}

describe('enrichEvent', () => {
	describe('zero — the unattributed record, all-null together', () => {
		it('a loc-null record enriches with nodePath null', () => {
			const { enrichment } = enrichmentOf('console.log(1);\n');
			const event = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: [1],
				step: 1,
				loc: null,
				start: null,
				end: null,
			});

			expect(event.nodePath).toBeNull();
		});

		it('a loc-null record answers node null', () => {
			const { enrichment } = enrichmentOf('console.log(1);\n');
			const event = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: [1],
				step: 1,
				loc: null,
				start: null,
				end: null,
			});

			expect(event.node).toBeNull();
		});

		it('a loc-null record answers callee null', () => {
			const { enrichment } = enrichmentOf('console.log(1);\n');
			const event = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: [1],
				step: 1,
				loc: null,
				start: null,
				end: null,
			});

			expect(event.event === 'console' && event.callee).toBeNull();
		});

		it('a loc-null record carries calleePath null', () => {
			const { enrichment } = enrichmentOf('console.log(1);\n');
			const event = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: [1],
				step: 1,
				loc: null,
				start: null,
				end: null,
			});

			expect(event.event === 'console' && event.calleePath).toBeNull();
		});
	});

	describe('one — the attributed record', () => {
		it('an attributed record resolves the deepest exact node', () => {
			const { enrichment } = enrichmentOf('console.log(1);\n');
			const event = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: [1],
				step: 1,
				loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 14 } },
				start: 0,
				end: 14,
			});

			expect(event.nodePath).toBe('$.body.0.expression');
		});

		it('a different span resolves a different node — coordinates are read, never assumed', () => {
			const { enrichment } = enrichmentOf('console.log(1);\n');
			const event = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: [1],
				step: 1,
				loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 11 } },
				start: 0,
				end: 11,
			});

			expect(event.nodePath).toBe('$.body.0.expression.callee');
		});

		it('node answers the LIVE entwined node', () => {
			const { entwined, enrichment } = enrichmentOf('console.log(1);\n');
			const event = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: [1],
				step: 1,
				loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 14 } },
				start: 0,
				end: 14,
			});

			expect(event.node).toBe(entwined.byPath['$.body.0.expression']);
		});

		it('calleePath rides enumerable beside the resolved call', () => {
			const { enrichment } = enrichmentOf('console.log(1);\n');
			const event = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: [1],
				step: 1,
				loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 14 } },
				start: 0,
				end: 14,
			});

			expect(event.event === 'console' && event.calleePath).toBe(
				'$.body.0.expression.callee',
			);
		});

		it('callee answers the callee node', () => {
			const { entwined, enrichment } = enrichmentOf('console.log(1);\n');
			const event = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: [1],
				step: 1,
				loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 14 } },
				start: 0,
				end: 14,
			});

			expect(event.event === 'console' && event.callee).toBe(
				entwined.byPath['$.body.0.expression.callee'],
			);
		});

		it('the delivered wire shape is exactly the enumerable data', () => {
			const { enrichment } = enrichmentOf('console.log(1);\n');
			const event = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: [1],
				step: 1,
				loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 14 } },
				start: 0,
				end: 14,
			});

			// eslint-disable-next-line unicorn/prefer-structured-clone -- JSON semantics ARE the contract under test: stringify must drop the accessor views and any function member (HR-12)
			expect(JSON.parse(JSON.stringify(event))).toStrictEqual({
				event: 'console',
				method: 'log',
				args: [1],
				step: 1,
				loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 14 } },
				start: 0,
				end: 14,
				nodePath: '$.body.0.expression',
				calleePath: '$.body.0.expression.callee',
			});
		});
	});

	describe('many — the timeline', () => {
		it('prev at the head answers null', () => {
			const { enrichment } = enrichmentOf('console.log(1);\n');
			const event = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: [1],
				step: 1,
				loc: null,
				start: null,
				end: null,
			});

			expect(event.prev).toBeNull();
		});

		it('next with no successor answers null', () => {
			const { enrichment } = enrichmentOf('console.log(1);\n');
			const event = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: [1],
				step: 1,
				loc: null,
				start: null,
				end: null,
			});

			expect(event.next).toBeNull();
		});

		it('next answers the following delivered event once it arrives', () => {
			const { enrichment } = enrichmentOf('console.log(1);\n');
			const first = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: ['a'],
				step: 1,
				loc: null,
				start: null,
				end: null,
			});
			const second = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: ['b'],
				step: 2,
				loc: null,
				start: null,
				end: null,
			});

			expect(first.next).toBe(second);
		});

		it('prev answers the preceding delivered event', () => {
			const { enrichment } = enrichmentOf('console.log(1);\n');
			const first = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: ['a'],
				step: 1,
				loc: null,
				start: null,
				end: null,
			});
			const second = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: ['b'],
				step: 2,
				loc: null,
				start: null,
				end: null,
			});

			expect(second.prev).toBe(first);
		});

		it('a pending interaction rides the same timeline', () => {
			const { enrichment } = enrichmentOf('prompt("q");\n');
			const record = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: ['a'],
				step: 1,
				loc: null,
				start: null,
				end: null,
			});
			const interaction = enrichment.enrich({
				event: 'pending-interaction',
				step: 2,
				loc: null,
				start: null,
				end: null,
				request: { kind: 'prompt', message: 'q' },
				respond() {},
			});

			expect(interaction.prev).toBe(record);
		});
	});

	describe('boundaries — the join', () => {
		it('an exact ancestor span resolves through the ascent', () => {
			const { enrichment } = enrichmentOf('console.log(1);\n');
			const event = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: [1],
				step: 1,
				loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 15 } },
				start: 0,
				end: 15,
			});

			expect(event.nodePath).toBe('$.body.0');
		});

		it('an exact-joined non-call node carries calleePath null', () => {
			const { enrichment } = enrichmentOf('console.log(1);\n');
			const event = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: [1],
				step: 1,
				loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 15 } },
				start: 0,
				end: 15,
			});

			expect(event.event === 'console' && event.calleePath).toBeNull();
		});

		it('identical spans resolve to the deepest — the inherited tie-break', () => {
			const { enrichment } = enrichmentOf('foo()');
			const event = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: [],
				step: 1,
				loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 5 } },
				start: 0,
				end: 5,
			});

			expect(event.nodePath).toBe('$.body.0.expression');
		});

		it('a non-exact span falls back to the deepest enclosing node', () => {
			const { enrichment } = enrichmentOf('console.log(1);\n');
			const event = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: [1],
				step: 1,
				loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 13 } },
				start: 0,
				end: 13,
			});

			expect(event.nodePath).toBe('$.body.0.expression.callee.object');
		});

		it('an out-of-range start falls to the Program root', () => {
			const { enrichment } = enrichmentOf('console.log(1);\n');
			const event = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: [1],
				step: 1,
				loc: { start: { line: 9, column: 0 }, end: { line: 9, column: 6 } },
				start: 999,
				end: 1005,
			});

			expect(event.nodePath).toBe('$');
		});
	});

	describe("boundaries — nodeAtLoc, the settlement side's spans", () => {
		it('a loop span converts and joins exactly', () => {
			const { entwined, enrichment } = enrichmentOf(
				'while (true) {\n  x;\n}\n',
			);
			const node = enrichment.nodeAtLoc({
				start: { line: 1, column: 0 },
				end: { line: 3, column: 1 },
			});

			expect(node).toBe(entwined.byPath['$.body.0']);
		});

		it('a zero-width position joins its deepest enclosing node', () => {
			const { entwined, enrichment } = enrichmentOf(
				'while (true) {\n  x;\n}\n',
			);
			const node = enrichment.nodeAtLoc({
				start: { line: 2, column: 2 },
				end: { line: 2, column: 2 },
			});

			expect(node).toBe(entwined.byPath['$.body.0.body.body.0.expression']);
		});

		it("a column past the source's end answers null", () => {
			const { enrichment } = enrichmentOf('while (true) {\n  x;\n}\n');
			const node = enrichment.nodeAtLoc({
				start: { line: 3, column: 99 },
				end: { line: 3, column: 100 },
			});

			expect(node).toBeNull();
		});

		it('a line outside the source answers null', () => {
			const { enrichment } = enrichmentOf('while (true) {\n  x;\n}\n');
			const node = enrichment.nodeAtLoc({
				start: { line: 99, column: 0 },
				end: { line: 99, column: 4 },
			});

			expect(node).toBeNull();
		});

		it('a single-line source with no trailing newline converts', () => {
			const { entwined, enrichment } = enrichmentOf('x');
			const node = enrichment.nodeAtLoc({
				start: { line: 1, column: 0 },
				end: { line: 1, column: 1 },
			});

			expect(node).toBe(entwined.byPath['$.body.0.expression']);
		});

		it('conversion counts UTF-16 units', () => {
			const { entwined, enrichment } = enrichmentOf(
				'const a = "\u{1F49A}";\nb();\n',
			);
			const node = enrichment.nodeAtLoc({
				start: { line: 2, column: 0 },
				end: { line: 2, column: 3 },
			});

			expect(node).toBe(entwined.byPath['$.body.1.expression']);
		});
	});

	describe('interfaces — the delivered event', () => {
		it('a pending interaction serializes to its enumerable data alone', () => {
			const { enrichment } = enrichmentOf('prompt("q");\n');
			const event = enrichment.enrich({
				event: 'pending-interaction',
				step: 1,
				loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 11 } },
				start: 0,
				end: 11,
				request: { kind: 'prompt', message: 'q' },
				respond() {},
			});

			// eslint-disable-next-line unicorn/prefer-structured-clone -- JSON semantics ARE the contract under test: stringify must drop the accessor views and any function member (HR-12)
			expect(JSON.parse(JSON.stringify(event))).toStrictEqual({
				event: 'pending-interaction',
				step: 1,
				loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 11 } },
				start: 0,
				end: 11,
				request: { kind: 'prompt', message: 'q' },
				nodePath: '$.body.0.expression',
				calleePath: '$.body.0.expression.callee',
			});
		});

		it('the graph views exist as own non-enumerable members', () => {
			const { enrichment } = enrichmentOf('console.log(1);\n');
			const event = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: [1],
				step: 1,
				loc: null,
				start: null,
				end: null,
			});

			expect(Object.getOwnPropertyNames(event)).toEqual(
				expect.arrayContaining(['node', 'prev', 'next', 'callee']),
			);
		});

		it('the delivered event is frozen where authored', () => {
			const { enrichment } = enrichmentOf('console.log(1);\n');
			const event = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: [1],
				step: 1,
				loc: null,
				start: null,
				end: null,
			});

			expect(Object.isFrozen(event)).toBe(true);
		});

		it('respond rides through by reference', () => {
			const { enrichment } = enrichmentOf('prompt("q");\n');
			function respondStub(): void {}
			const event = enrichment.enrich({
				event: 'pending-interaction',
				step: 1,
				loc: null,
				start: null,
				end: null,
				request: { kind: 'prompt', message: 'q' },
				respond: respondStub,
			});

			expect(event.event === 'pending-interaction' && event.respond).toBe(
				respondStub,
			);
		});

		it('steps are never renumbered', () => {
			const { enrichment } = enrichmentOf('console.log(1);\n');
			const event = enrichment.enrich({
				event: 'console',
				method: 'log',
				args: [1],
				step: 7,
				loc: null,
				start: null,
				end: null,
			});

			expect(event.step).toBe(7);
		});

		it("prompt's answered return rides through", () => {
			const { enrichment } = enrichmentOf('prompt("q");\n');
			const event = enrichment.enrich({
				event: 'prompt',
				args: ['q'],
				step: 1,
				loc: null,
				start: null,
				end: null,
				return: 'Ada',
			});

			expect(event.event === 'prompt' && event.return).toBe('Ada');
		});

		it("confirm's answered boolean rides through", () => {
			const { enrichment } = enrichmentOf('confirm("sure?");\n');
			const event = enrichment.enrich({
				event: 'confirm',
				args: ['sure?'],
				step: 1,
				loc: null,
				start: null,
				end: null,
				return: true,
			});

			expect(event.event === 'confirm' && event.return).toBe(true);
		});

		it("alert's return rides present and undefined", () => {
			const { enrichment } = enrichmentOf('alert("done");\n');
			const event = enrichment.enrich({
				event: 'alert',
				args: ['done'],
				step: 1,
				loc: null,
				start: null,
				end: null,
				return: undefined,
			});

			expect('return' in event).toBe(true);
		});

		it('an error item enriches without callee members', () => {
			const { enrichment } = enrichmentOf('null.foo;\n');
			const event = enrichment.enrich({
				event: 'error',
				name: 'TypeError',
				message: 'boom',
				step: 1,
				loc: null,
				start: null,
				end: null,
			});

			expect(Object.getOwnPropertyNames(event)).not.toContain('callee');
		});

		it("the io item's source rides onto the delivered error", () => {
			const { enrichment } = enrichmentOf('prompt("q");\n');
			const event = enrichment.enrich({
				event: 'error',
				name: 'TypeError',
				message: 'mock threw',
				source: 'prompt',
				step: 1,
				loc: null,
				start: null,
				end: null,
			});

			expect(event.event === 'error' && event.source).toBe('prompt');
		});

		it("a learner throw's error record carries no source", () => {
			const { enrichment } = enrichmentOf('null.foo;\n');
			const event = enrichment.enrich({
				event: 'error',
				name: 'TypeError',
				message: 'boom',
				step: 1,
				loc: null,
				start: null,
				end: null,
			});

			expect('source' in event).toBe(false);
		});

		it('an error item still joins its span', () => {
			const { enrichment } = enrichmentOf('console.log(1);\n');
			const event = enrichment.enrich({
				event: 'error',
				name: 'TypeError',
				message: 'boom',
				step: 2,
				loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 14 } },
				start: 0,
				end: 14,
			});

			expect(event.nodePath).toBe('$.body.0.expression');
		});
	});
});
