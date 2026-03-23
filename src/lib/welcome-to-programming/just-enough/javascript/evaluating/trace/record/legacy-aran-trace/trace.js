await import('./aran-build.js');

import { pointcut } from './pointcut.js';
import { state } from './data/state.js';

import { config } from './data/config.js';
import { ADVICE } from './advice/index.js';

import { walk } from './estree-walker/index.js';

import { print } from './lib/trace-log.js';

/**
 * Instruments and evaluates code via Aran AST weaving.
 * Environment-agnostic — works in Web Workers, Node.js, and browsers.
 * No DOM dependency.
 *
 * @param {string} code — the source code to instrument and evaluate
 */
const trace = (code) => {
	// 1. Set up ADVICE on globalThis (worker/Node global is the sandbox)
	globalThis.ADVICE = ADVICE;

	const aran = Aran({ namespace: 'ADVICE' });
	state.aran = aran;

	// 2. Generate and eval Aran setup code (initializes ADVICE.builtins)
	const setupAst = aran.setup();
	const setupCode = Astring.generate(setupAst);

	if (!globalThis.ADVICE.builtins) {
		// WHY: indirect eval to run in global scope, not local scope
		(0, eval)(setupCode);
	}

	globalThis.ADVICE.builtins.global.console = console;

	// 3. Reset state for this trace
	state.scopeDepth = 1;
	state.blockLabels = [];
	state.loggedSteps = 0;
	state.callExpressions = [];
	state.code = code;

	// 4. Parse
	let estree;
	try {
		estree = Acorn.parse(code, { locations: true });
	} catch (err) {
		// WHY: emit creation phase error as a trace entry, not a throw.
		// The worker caller handles error entries.
		print({
			prefix: '-> creation phase error:',
			style: 'font-weight:bold;',
			logs: [err.message],
		});
		return;
	}

	// 5. Walk AST: replace debugger statements, collect call expressions
	const walked = walk(estree, {
		enter(node) {
			if (node.type === 'CallExpression') {
				state.callExpressions.push(node);
			} else if (node.type === 'DebuggerStatement') {
				// WHY: can't just remove debugger (would shift line numbers).
				// Replace with `null;` — same length due to whitespace insensitivity.
				const nullNode = Acorn.parse('null').body[0];
				nullNode.start = node.start;
				nullNode.end = node.end;
				nullNode.expression.start = node.start;
				nullNode.expression.end = node.end;
				this.replace(nullNode);
			}
		},
	});

	// 6. Weave with Aran + generate instrumented code
	state.hoisted = [];
	const woven = aran.weave(walked, pointcut);

	state.loggedSteps = 1;
	const instrumented = Astring.generate(woven);

	// 7. Execute instrumented code
	// WHY: indirect eval to run in global scope where ADVICE is defined
	try {
		(0, eval)(instrumented);
	} catch (o_0) {
		// WHY: most runtime errors are caught by ADVICE traps (advice/exception.js)
		// which emit proper '-> execution phase:' entries. But errors that escape
		// ADVICE (edge cases) must still be surfaced, not silently swallowed.
		print({
			prefix: '-> execution phase error:',
			style: 'font-weight:bold;',
			logs: [o_0?.message ?? String(o_0)],
		});
	}
};

export { trace, config };

export default { trace, config };
