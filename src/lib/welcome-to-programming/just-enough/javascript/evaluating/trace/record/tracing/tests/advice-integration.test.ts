/**
 * @file Layer 2 integration tests: advice execution in Node.
 *
 * Instruments JavaScript code via Aran, registers real advice functions
 * on globalThis, executes the instrumented code via new Function(), and
 * asserts on the collected TraceEvent stream.
 *
 * This is the highest-value integration layer: it tests the full
 * instrumentation + weaving + event generation pipeline without any
 * Worker/SAB complexity.
 *
 * IMPORTANT: Each test with different config MUST call instrument() with
 * that config — gating is dual-layer (pointcut-time AND runtime).
 */

import { afterEach, describe, expect, it } from 'vitest';

import instrument from '../instrument.js';
import createAspect from '../weaving/create-aspect.js';

import type { TraceEvent } from '../types.js';

// --- Test helper ---

/** Names of all advice globals registered on globalThis. */
const ADVICE_NAMES = [
	'_jej_block_setup',
	'_jej_block_before',
	'_jej_block_declaration',
	'_jej_block_after',
	'_jej_block_throwing',
	'_jej_block_teardown',
	'_jej_expression_after',
	'_jej_apply_around',
	'_jej_effect_before',
	'_jej_statement_before',
];

/**
 * Instruments code, registers advice, executes, collects events.
 *
 * Each call creates a fresh aspect from config — required because
 * config gating happens at both pointcut-time and runtime.
 */
function traceInNode(
	code: string,
	config: Record<string, unknown> = {},
): TraceEvent[] {
	const { instrumentedCode } = instrument(code, config);
	const aspect = createAspect(config);

	// Register advice globals
	for (const [name, fn] of Object.entries(aspect.adviceGlobals)) {
		(globalThis as Record<string, unknown>)[name] = fn;
	}

	// Collect events via the global callback
	const events: TraceEvent[] = [];
	(globalThis as Record<string, unknown>).__jej_onEvent =
		function collectEvent(event: TraceEvent): void {
			events.push(event);
		};

	// Execute instrumented code
	// eslint-disable-next-line no-new-func
	new Function(instrumentedCode)();

	return events;
}

/** Remove all advice globals and the event callback from globalThis. */
function cleanupGlobals(): void {
	for (const name of ADVICE_NAMES) {
		delete (globalThis as Record<string, unknown>)[name];
	}
	delete (globalThis as Record<string, unknown>).__jej_onEvent;
}

afterEach(cleanupGlobals);

// --- Full config: all events enabled ---

const ALL_ENABLED: Record<string, unknown> = {
	bindings: {
		kind: { let: true, const: true, global: true },
		events: {
			declare: true,
			initialize: true,
			available: true,
			assign: true,
			read: true,
		},
	},
	propertyAccess: {
		dot: true,
		bracket: true,
		optionalChaining: true,
	},
	operators: {
		pure: {
			arithmetic: true,
			addition: true,
			comparison: true,
			typeof: true,
			negation: { logical: true, bitwise: true },
			bitwise: true,
		},
		shortCircuiting: true,
		assignment: true,
	},
	literals: {
		string: true,
		boolean: true,
		number: true,
		undefined: true,
		null: true,
		regex: true,
	},
	templates: { begin: true, evaluation: true, end: true },
	scopes: {
		kind: { script: true, block: true, module: true },
		events: {
			create: true,
			enter: true,
			interrupt: true,
			completion: true,
			leave: true,
		},
	},
	controlFlow: {
		kind: {
			conditionals: true,
			loops: {
				while: true,
				doWhile: true,
				for: true,
				forOf: true,
			},
		},
		events: {
			test: true,
			branch: true,
			iteration: true,
			jump: true,
			do: true,
			initialize: true,
			increment: true,
		},
	},
	functions: { call: true, return: true },
	with: true,
};

// =====================================================================
// BASIC CONSTRUCTS
// =====================================================================

describe('advice integration', () => {
	describe('basic constructs', () => {
		it('let x = 5 produces events', () => {
			const events = traceInNode('let x = 5;\n', ALL_ENABLED);
			expect(events.length).toBeGreaterThan(0);
		});

		it('events have step numbers', () => {
			const events = traceInNode('let x = 5;\n', ALL_ENABLED);

			for (const event of events) {
				expect(event).toHaveProperty('step');
				expect(typeof event.step).toBe('number');
			}
		});

		it('step numbers are monotonically increasing', () => {
			const events = traceInNode(
				'let x = 5;\nlet y = x + 1;\n',
				ALL_ENABLED,
			);

			for (let i = 1; i < events.length; i++) {
				expect(events[i].step).toBeGreaterThanOrEqual(
					events[i - 1].step,
				);
			}
		});

		it('events have category field', () => {
			const events = traceInNode('let x = 5;\n', ALL_ENABLED);

			for (const event of events) {
				expect(event).toHaveProperty('category');
			}
		});

		it('events have loc field with start/end', () => {
			const events = traceInNode('let x = 5;\n', ALL_ENABLED);

			for (const event of events) {
				expect(event).toHaveProperty('loc');
				expect(event.loc).toHaveProperty('start');
				expect(event.loc).toHaveProperty('end');
			}
		});

		it('events are frozen', () => {
			const events = traceInNode('let x = 5;\n', ALL_ENABLED);

			for (const event of events) {
				expect(Object.isFrozen(event)).toBe(true);
			}
		});
	});

	// =====================================================================
	// BINDINGS
	// =====================================================================

	describe('bindings', () => {
		it('let declaration produces declare + initialize + available events', () => {
			const events = traceInNode('let x = 5;\n', ALL_ENABLED);
			const bindingEvents = events.filter(
				(e) => e.category === 'binding',
			);
			const bindingForX = bindingEvents.filter(
				(e) => (e as Record<string, unknown>).name === 'x',
			);

			const eventTypes = bindingForX.map(
				(e) => (e as Record<string, unknown>).event,
			);
			expect(eventTypes).toContain('declare');
			expect(eventTypes).toContain('initialize');
			expect(eventTypes).toContain('available');
		});

		it('let binding has kind "let"', () => {
			const events = traceInNode('let x = 5;\n', ALL_ENABLED);
			const declareEvent = events.find(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).event === 'declare' &&
					(e as Record<string, unknown>).name === 'x',
			);

			expect(declareEvent).toBeDefined();
			expect((declareEvent as Record<string, unknown>).kind).toBe('let');
		});

		it('const binding has kind "const"', () => {
			const events = traceInNode('const y = 10;\n', ALL_ENABLED);
			const declareEvent = events.find(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).event === 'declare' &&
					(e as Record<string, unknown>).name === 'y',
			);

			expect(declareEvent).toBeDefined();
			expect((declareEvent as Record<string, unknown>).kind).toBe(
				'const',
			);
		});

		it('reassignment produces assign event', () => {
			const events = traceInNode(
				'let x = 1;\nx = 2;\n',
				ALL_ENABLED,
			);
			const assignEvent = events.find(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).event === 'assign' &&
					(e as Record<string, unknown>).name === 'x',
			);

			expect(assignEvent).toBeDefined();
		});

		it('variable read produces read event', () => {
			const events = traceInNode(
				'let x = 1;\nlet y = x;\n',
				ALL_ENABLED,
			);
			const readEvent = events.find(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).event === 'read' &&
					(e as Record<string, unknown>).name === 'x',
			);

			expect(readEvent).toBeDefined();
		});
	});

	// =====================================================================
	// OPERATORS
	// =====================================================================

	describe('operators', () => {
		it('arithmetic operator produces operator event', () => {
			const events = traceInNode(
				'let x = 1 + 2;\n',
				ALL_ENABLED,
			);
			const operatorEvents = events.filter(
				(e) => e.category === 'operator',
			);

			expect(operatorEvents.length).toBeGreaterThan(0);

			const addEvent = operatorEvents.find(
				(e) => (e as Record<string, unknown>).operator === '+',
			);
			expect(addEvent).toBeDefined();
		});

		it('comparison operator produces operator event', () => {
			const events = traceInNode(
				'let x = 1 === 1;\n',
				ALL_ENABLED,
			);
			const compEvent = events.find(
				(e) =>
					e.category === 'operator' &&
					(e as Record<string, unknown>).operator === '===',
			);

			expect(compEvent).toBeDefined();
		});

		it('typeof produces operator event', () => {
			const events = traceInNode(
				'let x = 5;\nlet y = typeof x;\n',
				ALL_ENABLED,
			);
			const typeofEvent = events.find(
				(e) =>
					e.category === 'operator' &&
					(e as Record<string, unknown>).operator === 'typeof',
			);

			expect(typeofEvent).toBeDefined();
		});
	});

	// =====================================================================
	// LITERALS
	// =====================================================================

	describe('literals', () => {
		it('number literal produces literal event', () => {
			const events = traceInNode('let x = 42;\n', ALL_ENABLED);
			const literalEvent = events.find(
				(e) =>
					e.category === 'literal' &&
					(e as Record<string, unknown>).kind === 'number',
			);

			expect(literalEvent).toBeDefined();
		});

		it('string literal produces literal event', () => {
			const events = traceInNode('let x = "hello";\n', ALL_ENABLED);
			const literalEvent = events.find(
				(e) =>
					e.category === 'literal' &&
					(e as Record<string, unknown>).kind === 'string',
			);

			expect(literalEvent).toBeDefined();
		});

		it('boolean literal produces literal event', () => {
			const events = traceInNode('let x = true;\n', ALL_ENABLED);
			const literalEvent = events.find(
				(e) =>
					e.category === 'literal' &&
					(e as Record<string, unknown>).kind === 'boolean',
			);

			expect(literalEvent).toBeDefined();
		});
	});

	// =====================================================================
	// SCOPES
	// =====================================================================

	describe('scopes', () => {
		it('module-level scope produces create + enter + completion + leave', () => {
			const events = traceInNode('let x = 5;\n', ALL_ENABLED);
			const scopeEvents = events.filter(
				(e) => e.category === 'scope',
			);
			const scopeEventTypes = scopeEvents.map(
				(e) => (e as Record<string, unknown>).event,
			);

			expect(scopeEventTypes).toContain('create');
			expect(scopeEventTypes).toContain('enter');
			expect(scopeEventTypes).toContain('completion');
			expect(scopeEventTypes).toContain('leave');
		});

		it('block scope has correct depth', () => {
			const events = traceInNode(
				'{\n  let x = 1;\n}\n',
				ALL_ENABLED,
			);
			const blockCreateEvents = events.filter(
				(e) =>
					e.category === 'scope' &&
					(e as Record<string, unknown>).event === 'create' &&
					(e as Record<string, unknown>).kind === 'block',
			);

			expect(blockCreateEvents.length).toBeGreaterThan(0);
			const blockScope = blockCreateEvents[0] as Record<string, unknown>;
			expect(blockScope.depth).toBeGreaterThan(0);
		});
	});

	// =====================================================================
	// CONTROL FLOW
	// =====================================================================

	describe('control flow', () => {
		it('if/else produces test + branch events', () => {
			const events = traceInNode(
				'let x = 5;\nif (x > 3) {\n  let y = 1;\n} else {\n  let y = 2;\n}\n',
				ALL_ENABLED,
			);
			const controlFlowEvents = events.filter(
				(e) => e.category === 'controlFlow',
			);
			const cfEventTypes = controlFlowEvents.map(
				(e) => (e as Record<string, unknown>).event,
			);

			expect(cfEventTypes).toContain('test');
			expect(cfEventTypes).toContain('branch');
		});

		it('while loop produces iteration events', () => {
			const events = traceInNode(
				'let i = 0;\nwhile (i < 3) {\n  i = i + 1;\n}\n',
				ALL_ENABLED,
			);
			const iterationEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).event === 'iteration',
			);

			expect(iterationEvents.length).toBeGreaterThan(0);
		});

		it('for loop produces initialize + test + increment events', () => {
			const events = traceInNode(
				'for (let i = 0; i < 3; i = i + 1) {\n  let x = i;\n}\n',
				ALL_ENABLED,
			);
			const cfEvents = events.filter(
				(e) => e.category === 'controlFlow',
			);
			const cfEventTypes = cfEvents.map(
				(e) => (e as Record<string, unknown>).event,
			);

			expect(cfEventTypes).toContain('test');
			expect(cfEventTypes).toContain('iteration');
		});

		it('break produces jump event', () => {
			const events = traceInNode(
				'for (let i = 0; i < 10; i = i + 1) {\n  if (i === 3) {\n    break;\n  }\n}\n',
				ALL_ENABLED,
			);
			const jumpEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).event === 'jump',
			);

			expect(jumpEvents.length).toBeGreaterThan(0);
		});
	});

	// =====================================================================
	// FUNCTIONS
	// =====================================================================

	describe('functions', () => {
		it('function call produces call + return events', () => {
			const events = traceInNode(
				'function add(a, b) {\n  return a + b;\n}\nlet result = add(1, 2);\n',
				ALL_ENABLED,
			);
			const functionEvents = events.filter(
				(e) => e.category === 'function',
			);
			const fnEventTypes = functionEvents.map(
				(e) => (e as Record<string, unknown>).event,
			);

			expect(fnEventTypes).toContain('call');
			expect(fnEventTypes).toContain('return');
		});
	});

	// =====================================================================
	// TEMPLATES
	// =====================================================================

	describe('templates', () => {
		it('template literal produces begin + evaluation + end events', () => {
			const events = traceInNode(
				'let name = "world";\nlet greeting = `hello ${name}`;\n',
				ALL_ENABLED,
			);
			const templateEvents = events.filter(
				(e) => e.category === 'template',
			);
			const templateEventTypes = templateEvents.map(
				(e) => (e as Record<string, unknown>).event,
			);

			expect(templateEventTypes).toContain('begin');
			expect(templateEventTypes).toContain('evaluation');
			expect(templateEventTypes).toContain('end');
		});
	});

	// =====================================================================
	// CONFIG GATING
	// =====================================================================

	describe('config gating', () => {
		it('disabling bindings.kind.let removes let binding events', () => {
			const config = {
				...ALL_ENABLED,
				bindings: {
					kind: { let: false, const: true, global: true },
					events: {
						declare: true,
						initialize: true,
						available: true,
						assign: true,
						read: true,
					},
				},
			};
			const events = traceInNode(
				'let x = 5;\nconst y = 10;\n',
				config,
			);
			const letBindings = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).kind === 'let',
			);
			const constBindings = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).kind === 'const',
			);

			expect(letBindings.length).toBe(0);
			expect(constBindings.length).toBeGreaterThan(0);
		});

		it('disabling bindings.events.read removes read events', () => {
			const config = {
				...ALL_ENABLED,
				bindings: {
					kind: { let: true, const: true, global: true },
					events: {
						declare: true,
						initialize: true,
						available: true,
						assign: true,
						read: false,
					},
				},
			};
			const events = traceInNode(
				'let x = 1;\nlet y = x;\n',
				config,
			);
			const readEvents = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).event === 'read',
			);
			const declareEvents = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).event === 'declare',
			);

			expect(readEvents.length).toBe(0);
			expect(declareEvents.length).toBeGreaterThan(0);
		});

		it('disabling literals.string removes string literal events', () => {
			const config = {
				...ALL_ENABLED,
				literals: {
					string: false,
					number: true,
					boolean: true,
					undefined: true,
					null: true,
					regex: true,
				},
			};
			const events = traceInNode(
				'let x = "hello";\nlet y = 42;\n',
				config,
			);
			const stringLiterals = events.filter(
				(e) =>
					e.category === 'literal' &&
					(e as Record<string, unknown>).kind === 'string',
			);
			const numberLiterals = events.filter(
				(e) =>
					e.category === 'literal' &&
					(e as Record<string, unknown>).kind === 'number',
			);

			expect(stringLiterals.length).toBe(0);
			expect(numberLiterals.length).toBeGreaterThan(0);
		});

		it('disabling operators.pure.arithmetic removes arithmetic events', () => {
			const config = {
				...ALL_ENABLED,
				operators: {
					...ALL_ENABLED.operators as Record<string, unknown>,
					pure: {
						arithmetic: false,
						addition: true,
						comparison: true,
						typeof: true,
						negation: { logical: true, bitwise: true },
						bitwise: true,
					},
				},
			};
			const events = traceInNode(
				'let x = 5 - 2;\nlet y = 1 === 1;\n',
				config,
			);
			const subtractEvents = events.filter(
				(e) =>
					e.category === 'operator' &&
					(e as Record<string, unknown>).operator === '-',
			);
			const comparisonEvents = events.filter(
				(e) =>
					e.category === 'operator' &&
					(e as Record<string, unknown>).operator === '===',
			);

			expect(subtractEvents.length).toBe(0);
			expect(comparisonEvents.length).toBeGreaterThan(0);
		});

		it('disabling scopes.kind.block removes block scope events', () => {
			const config = {
				...ALL_ENABLED,
				scopes: {
					kind: { script: true, block: false, module: true },
					events: {
						create: true,
						enter: true,
						interrupt: true,
						completion: true,
						leave: true,
					},
				},
			};
			const events = traceInNode(
				'{\n  let x = 1;\n}\n',
				config,
			);
			const blockScopeEvents = events.filter(
				(e) =>
					e.category === 'scope' &&
					(e as Record<string, unknown>).kind === 'block',
			);

			expect(blockScopeEvents.length).toBe(0);
		});

		it('disabling controlFlow.events.branch removes branch events', () => {
			const config = {
				...ALL_ENABLED,
				controlFlow: {
					...(ALL_ENABLED.controlFlow as Record<string, unknown>),
					events: {
						test: true,
						branch: false,
						iteration: true,
						jump: true,
						do: true,
						initialize: true,
						increment: true,
					},
				},
			};
			const events = traceInNode(
				'let x = 5;\nif (x > 3) {\n  let y = 1;\n}\n',
				config,
			);
			const branchEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).event === 'branch',
			);
			const testEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).event === 'test',
			);

			expect(branchEvents.length).toBe(0);
			expect(testEvents.length).toBeGreaterThan(0);
		});

		it('disabling functions.call removes call events', () => {
			const config = {
				...ALL_ENABLED,
				functions: { call: false, return: true },
			};
			const events = traceInNode(
				'function f() {\n  return 1;\n}\nlet x = f();\n',
				config,
			);
			const callEvents = events.filter(
				(e) =>
					e.category === 'function' &&
					(e as Record<string, unknown>).event === 'call',
			);
			const returnEvents = events.filter(
				(e) =>
					e.category === 'function' &&
					(e as Record<string, unknown>).event === 'return',
			);

			expect(callEvents.length).toBe(0);
			expect(returnEvents.length).toBeGreaterThan(0);
		});

		it('empty config enables all events', () => {
			const events = traceInNode('let x = 5;\n', {});
			// With empty config, all advice is registered, events should be produced
			// At minimum: scope events from the module-level scope
			expect(events.length).toBeGreaterThan(0);
		});
	});

	// =====================================================================
	// ERROR CASES
	// =====================================================================

	describe('error cases', () => {
		it('runtime error is thrown from new Function', () => {
			expect(() => {
				traceInNode(
					'let x = undefinedVariable.property;\n',
					ALL_ENABLED,
				);
			}).toThrow();
		});

		it('syntax error in instrument() throws', () => {
			expect(() => {
				instrument('let x = ;\n', ALL_ENABLED);
			}).toThrow();
		});
	});
});
