/**
 * @file Main-thread Aran instrumentation pipeline.
 *
 * Transforms JavaScript source into an instrumented code string using
 * Aran's standalone mode. The output is a self-contained script that
 * captures all builtins (learner code can't break Aran internals).
 *
 * Pipeline: acorn.parse → Aran transpile → weaveFlexible → retropile → astring.generate
 *
 * @remarks
 * This runs on the MAIN THREAD (static transformation). Only execution
 * runs in the worker. The output string is sent to the worker via postMessage.
 *
 * Standalone mode (`retropile({ mode: 'standalone' })`) embeds the intrinsic
 * record directly — no separate setupile/generateSetup call needed.
 */

import { parse } from 'acorn';
import { transpile, weaveFlexible, retropile } from 'aran';
import { generate } from 'astring';

import createAspect from './weaving/create-aspect.js';

import type { TracerState } from './weaving/types.js';

type InstrumentResult = {
	readonly instrumentedCode: string;
	readonly initialState: TracerState;
};

/**
 * Instruments JavaScript source code for tracing.
 *
 * @param code - JavaScript source to instrument
 * @param config - Trace config from options.schema.json
 * @returns The instrumented code string and initial tracer state
 */
function instrument(
	code: string,
	config: Record<string, unknown>,
): InstrumentResult {
	// 1. Detect `with` statement → use script mode (module mode forbids `with`)
	// WHY: JEJ programs are modules (strict mode, no `var` hoisting). But the
	// worker evaluates via new Function() which can't handle `import.meta`.
	// Solution: parse as module for JEJ semantics, but use Aran's 'eval' kind
	// with strict mode situ so the output is eval-compatible.
	// Exception: `with` requires sloppy mode → parse/transpile as script.
	const hasWithStatement = /\bwith\s*\(/.test(code);
	const parseAsModule = !hasWithStatement;

	// 2. Create aspect (pointcut config + advice globals + initial state)
	const aspect = createAspect(config);

	// 3. Parse source to ESTree
	// WHY always script: Aran's 'eval' kind requires sourceType: 'script'.
	// JEJ module semantics (strict mode, no var hoisting) are enforced by
	// Aran's situ: { type: 'local', mode: 'strict' }, not by ESTree sourceType.
	const ast = parse(code, {
		ecmaVersion: 2024,
		sourceType: 'script',
		locations: true,
	});

	// 4. Aran transpile: ESTree → AranLang
	// WHY 'eval' kind: module kind generates import.meta which new Function()
	// can't execute. eval kind with strict situ gives module-like behavior
	// (strict mode, no var hoisting to global) without import.meta.
	const aranAST = transpile(
		{
			kind: hasWithStatement ? 'script' : 'eval',
			situ: hasWithStatement
				? { type: 'global' }
				: { type: 'local', mode: 'strict' },
			root: ast,
			path: 'learner.js',
		},
		{ global_declarative_record: 'builtin' },
	);

	// 5. Aran weaveFlexible: inject advice calls based on pointcut
	const woven = weaveFlexible(aranAST, {
		initial_state: aspect.initialState,
		pointcut: aspect.pointcut,
	});

	// 6. Aran retropile: AranLang → ESTree (standalone = embedded intrinsic setup)
	const output = retropile(woven, {
		mode: 'standalone',
	});

	// 7. Generate JavaScript string
	const instrumentedCode = generate(output);

	return {
		instrumentedCode,
		initialState: aspect.initialState,
	};
}

export default instrument;
