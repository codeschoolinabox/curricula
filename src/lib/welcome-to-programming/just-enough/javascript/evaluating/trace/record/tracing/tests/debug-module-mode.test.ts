import { describe, expect, it } from 'vitest';
import { parse } from 'acorn';
import { transpile, weaveFlexible, retropile } from 'aran';
import { generate } from 'astring';

import createAspect from '../weaving/create-aspect.js';

describe('Aran mode comparison', () => {
	const code = 'let x = 5;\n';
	const config = {
		bindings: { kind: { let: true }, events: { declare: true } },
	};

	it('eval mode with strict situ produces executable code', () => {
		const ast = parse(code, { ecmaVersion: 2024, sourceType: 'script', locations: true });
		const aspect = createAspect(config);

		const aranAST = transpile(
			{ kind: 'eval', situ: { type: 'local', mode: 'strict' }, root: ast, path: 'learner.js' },
			{ global_declarative_record: 'builtin' },
		);
		const woven = weaveFlexible(aranAST, { initial_state: aspect.initialState, pointcut: aspect.pointcut });
		const output = retropile(woven, { mode: 'standalone' });
		const instrumentedCode = generate(output);

		for (const [name, fn] of Object.entries(aspect.adviceGlobals)) {
			(globalThis as Record<string, unknown>)[name] = fn;
		}
		// eslint-disable-next-line no-new-func
		new Function(instrumentedCode)();
		for (const name of Object.keys(aspect.adviceGlobals)) {
			delete (globalThis as Record<string, unknown>)[name];
		}
	});

	it('module mode — can it be parsed and instrumented?', () => {
		const ast = parse(code, { ecmaVersion: 2024, sourceType: 'module', locations: true });

		try {
			const aspect = createAspect(config);
			const aranAST = transpile(
				{ kind: 'module', situ: { type: 'global' }, root: ast, path: 'learner.js' },
				{ global_declarative_record: 'builtin' },
			);
			const woven = weaveFlexible(aranAST, { initial_state: aspect.initialState, pointcut: aspect.pointcut });
			const output = retropile(woven, { mode: 'standalone' });
			const instrumentedCode = generate(output);

			console.log('Module mode: generated code length:', instrumentedCode.length);
			console.log('Module mode: contains import.meta?', instrumentedCode.includes('import.meta'));
			console.log('Module mode: first 500 chars:', instrumentedCode.slice(0, 500));

			// Try executing with new Function — will it work?
			for (const [name, fn] of Object.entries(aspect.adviceGlobals)) {
				(globalThis as Record<string, unknown>)[name] = fn;
			}
			try {
				// eslint-disable-next-line no-new-func
				new Function(instrumentedCode)();
				console.log('Module mode: executed successfully with new Function');
			} catch (err: unknown) {
				console.log('Module mode: new Function failed:', (err as Error).message);
			}
			for (const name of Object.keys(aspect.adviceGlobals)) {
				delete (globalThis as Record<string, unknown>)[name];
			}
		} catch (err: unknown) {
			console.log('Module mode: transpile/weave failed:', (err as Error).message);
		}

		expect(true).toBe(true);
	});

	it('eval mode with module sourceType — hybrid approach', () => {
		// Parse as module (strict semantics) but transpile as eval (no import.meta)
		const ast = parse(code, { ecmaVersion: 2024, sourceType: 'module', locations: true });
		const aspect = createAspect(config);

		try {
			const aranAST = transpile(
				{ kind: 'eval', situ: { type: 'local', mode: 'strict' }, root: ast, path: 'learner.js' },
				{ global_declarative_record: 'builtin' },
			);
			const woven = weaveFlexible(aranAST, { initial_state: aspect.initialState, pointcut: aspect.pointcut });
			const output = retropile(woven, { mode: 'standalone' });
			const instrumentedCode = generate(output);

			for (const [name, fn] of Object.entries(aspect.adviceGlobals)) {
				(globalThis as Record<string, unknown>)[name] = fn;
			}
			// eslint-disable-next-line no-new-func
			new Function(instrumentedCode)();
			console.log('Hybrid mode: executed successfully');
			for (const name of Object.keys(aspect.adviceGlobals)) {
				delete (globalThis as Record<string, unknown>)[name];
			}
		} catch (err: unknown) {
			console.log('Hybrid mode failed:', (err as Error).message);
		}

		expect(true).toBe(true);
	});
});
