import { describe, expect, it } from 'vitest';

import instrument from '../instrument.js';
import resolveOptions from '../resolve-options.js';

import traceInNode from './pipeline-harness.js';

describe('the transform contract', () => {
	it.skip('statements.variableDeclaration false bakes no wrapper', () => {
		const { events } = traceInNode('let x = 1;', {
			statements: { variables: false },
			scopes: false,
		});
		expect(events.some((event) => event.type === 'VariableDeclaration')).toBe(
			false,
		);
	});

	it.skip('a construct outside the toggle surface always captures', () => {
		const { events } = traceInNode('const t = `tag`;');
		expect(events.some((event) => event.category === 'template')).toBe(true);
	});

	it.skip('declined: the construct runs native', () => {
		const { events } = traceInNode('let r = typeof missing; r;');
		expect(
			events.some(
				(event) =>
					event.semantics === 'resolve' &&
					event.value.type === 'string' &&
					event.value.value === 'undefined',
			),
		).toBe(true);
	});

	it.skip('declined: a typeof operand runs native', () => {
		const { thrown } = traceInNode('typeof neverDeclared;');
		expect(thrown).toBeUndefined();
	});

	it.skip('declined: a delete operand deletes the property', () => {
		const { events } = traceInNode('const o = { p: 1 }; delete o.p; "p" in o;');
		expect(
			events.some(
				(event) =>
					event.semantics === 'resolve' &&
					event.value.type === 'boolean' &&
					event.value.value === false,
			),
		).toBe(true);
	});

	it.skip('declined: a direct eval callee keeps its scope', () => {
		const { events } = traceInNode(
			'function f() { const secret = 42; return eval("secret"); } f();',
		);
		expect(
			events.some(
				(event) =>
					event.semantics === 'resolve' &&
					event.value.type === 'number' &&
					event.value.value === 42,
			),
		).toBe(true);
	});

	it.skip('declined: an optional chain short-circuits native', () => {
		const { events, thrown } = traceInNode('const a = null; a?.b();');
		expect({ thrown, hasUndefined: events.length > 0 }).toMatchObject({
			thrown: undefined,
		});
	});

	it.skip('a for missing a leg instruments in place', () => {
		const { thrown } = traceInNode('let i = 0; for (; i < 2; ) { i = i + 1; }');
		expect(thrown).toBeUndefined();
	});

	it.skip('a declined site is listed in the manifest', () => {
		const { declines } = traceInNode('let r = typeof missing;');
		expect(declines.some((site) => site.reason === 'typeof-operand')).toBe(
			true,
		);
	});

	it.skip('a with program is a typed instrument failure', () => {
		let failure: unknown;
		try {
			instrument({
				code: 'with (Math) { PI; }',
				sourceType: 'script',
				options: resolveOptions({}),
			});
		} catch (error) {
			failure = error;
		}
		expect(failure).toMatchObject({ reason: 'with-statement' });
	});

	it.skip("a parse failure carries Babel's own position", () => {
		let failure: unknown;
		try {
			instrument({
				code: 'let = ;',
				sourceType: 'script',
				options: resolveOptions({}),
			});
		} catch (error) {
			failure = error;
		}
		expect(failure).toMatchObject({ reason: 'parse' });
	});

	it.skip('instrumented output is legal in both modes', () => {
		const program = instrument({
			code: 'let x = 1; x;',
			sourceType: 'script',
			options: resolveOptions({}),
		});
		// eslint-disable-next-line @typescript-eslint/no-implied-eval, sonarjs/code-eval -- the strict-clean conformance check parses under a strict prologue
		expect(() => new Function(`"use strict";\n${program.code}`)).not.toThrow();
	});

	it.skip("strictness rides the learner's text untouched", () => {
		const program = instrument({
			code: '"use strict";\nlet x = 1;',
			sourceType: 'script',
			options: resolveOptions({}),
		});
		expect(program.code.startsWith('"use strict"')).toBe(true);
	});

	it.skip('module nodes instrument under the module goal', () => {
		const program = instrument({
			code: 'export const a = 1;',
			sourceType: 'module',
			options: resolveOptions({}),
		});
		expect(program.code).toContain('export');
	});

	it.skip('the namespace is settable and returned', () => {
		const program = instrument({
			code: 'let x = 1;',
			sourceType: 'script',
			options: resolveOptions({}),
			namespace: '__K__',
		});
		expect(program.namespace).toBe('__K__');
	});

	it.skip('include keeps only events naming x', () => {
		const { events } = traceInNode('let x = 1; let y = 2; x; y;', {
			expression: { variables: { filter: { include: ['x'] } } },
		});
		const readNames = events
			.filter(
				(event) =>
					event.category === 'variable' &&
					(event as { event: string }).event === 'read',
			)
			.map((event) => (event as { name: string }).name);
		expect(readNames).toEqual(['x']);
	});

	it.skip('a nameless event passes name filters', () => {
		const { events } = traceInNode('1 + 2;', {
			expression: { operators: { filter: { include: ['nobody'] } } },
		});
		expect(events.some((event) => event.category === 'operator')).toBe(true);
	});

	it.skip('loc matches the source span', () => {
		const code = 'let x = 1;';
		const { events } = traceInNode(code);
		const declaration = events.find(
			(event) => event.type === 'VariableDeclaration',
		);
		expect(declaration).toMatchObject({ start: 0, end: code.length });
	});

	it.skip('each while iteration yields a test step', () => {
		const { events } = traceInNode('let i = 0; while (i < 2) { i = i + 1; }');
		expect(
			events.filter(
				(event) =>
					event.category === 'loop' &&
					(event as { event: string }).event === 'test',
			).length,
		).toBe(3);
	});
});
