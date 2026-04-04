/**
 * @file Investigation: actual execution order of hooks for value capture.
 *
 * Key question: for `let x = 5`, does expression@after(5) fire
 * BEFORE or AFTER effect@before(WriteEffect x)?
 */

import { describe, expect, it } from 'vitest';
import { parse } from 'acorn';
import { transpile, weaveFlexible, retropile } from 'aran';
import { generate } from 'astring';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNode = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;

function traceHookOrder(code: string): string[] {
	const ast = parse(code, {
		ecmaVersion: 2024,
		sourceType: 'script',
		locations: true,
	});

	const log: string[] = [];

	const pointcut: Record<string, unknown> = {
		_vo_setup: { kind: 'block@setup', pointcut: () => ['setup'] },
		_vo_decl: { kind: 'block@declaration', pointcut: () => ['decl'] },
		_vo_expr: {
			kind: 'expression@after',
			pointcut: (node: AnyNode) => {
				if (node.type === 'PrimitiveExpression') return ['primitive'];
				if (node.type === 'ReadExpression') return ['read', node.variable];
				return ['other', node.type];
			},
		},
		_vo_effect_before: {
			kind: 'effect@before',
			pointcut: (node: AnyNode) => [node.type, node.variable ?? 'n/a'],
		},
		_vo_effect_after: {
			kind: 'effect@after',
			pointcut: (node: AnyNode) => [node.type, node.variable ?? 'n/a'],
		},
	};

	const aranAST = transpile(
		{ kind: 'eval', situ: { type: 'local', mode: 'strict' }, root: ast, path: 'test.js' },
		{ global_declarative_record: 'builtin' },
	);

	const woven = weaveFlexible(aranAST, {
		initial_state: { lastVal: null },
		pointcut,
	});

	const output = retropile(woven, { mode: 'standalone' });
	const instrumentedCode = generate(output);

	g._vo_setup = (state: unknown) => state;
	g._vo_decl = (_s: unknown, frame: Record<string, unknown>) => {
		const userVars = Object.keys(frame).filter((k) => !k.includes('.') && k !== 'this' && k !== 'import');
		if (userVars.length > 0) {
			log.push(`block@declaration(${userVars.join(',')})`);
		}
	};
	g._vo_expr = (state: Record<string, unknown>, result: unknown, disc: string, extra?: string) => {
		log.push(`expression@after(${disc}${extra ? ':' + extra : ''}, result=${JSON.stringify(result)})`);
		state.lastVal = result;
		return result;
	};
	g._vo_effect_before = (state: Record<string, unknown>, effectType: string, variable: string) => {
		log.push(`effect@before(${effectType}, var=${variable}, lastVal=${JSON.stringify(state.lastVal)})`);
	};
	g._vo_effect_after = (state: Record<string, unknown>, effectType: string, variable: string) => {
		log.push(`effect@after(${effectType}, var=${variable}, lastVal=${JSON.stringify(state.lastVal)})`);
	};

	// eslint-disable-next-line no-new-func
	new Function(instrumentedCode)();

	delete g._vo_setup;
	delete g._vo_decl;
	delete g._vo_expr;
	delete g._vo_effect_before;
	delete g._vo_effect_after;

	return log;
}

describe('hook firing order', () => {
	it('let x = 5', () => {
		const log = traceHookOrder('let x = 5;\n');
		console.log('Order for "let x = 5":');
		for (const entry of log) console.log('  ', entry);
		expect(log.length).toBeGreaterThan(0);
	});

	it('let x = 5; let y = x + 1', () => {
		const log = traceHookOrder('let x = 5;\nlet y = x + 1;\n');
		console.log('Order for "let x = 5; let y = x + 1":');
		for (const entry of log) console.log('  ', entry);
		expect(log.length).toBeGreaterThan(0);
	});

	it('let x = 5; x = 10', () => {
		const log = traceHookOrder('let x = 5;\nx = 10;\n');
		console.log('Order for "let x = 5; x = 10":');
		for (const entry of log) console.log('  ', entry);
		expect(log.length).toBeGreaterThan(0);
	});
});
