/**
 * @file Layer 2 integration tests: advice execution in Node.
 *
 * Instruments JavaScript code via Aran, registers real advice functions
 * on globalThis, executes the instrumented code via new Function(), and
 * asserts on the collected TraceEvent stream.
 *
 * IMPORTANT: Each test with different config MUST call instrument() with
 * that config — gating is dual-layer (pointcut-time AND runtime).
 */

import { afterEach, describe, expect, it } from 'vitest';

import instrument from '../instrument.js';
import createAspect from '../weaving/create-aspect.js';

import type { TraceEvent } from '../types.js';

// --- Test helper ---

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
	'_jej_effect_after',
	'_jej_statement_before',
];

function traceInNode(
	code: string,
	config: Record<string, unknown> = {},
): TraceEvent[] {
	const { instrumentedCode, tagMap } = instrument(code, config);
	const aspect = createAspect(config, tagMap);

	for (const [name, fn] of Object.entries(aspect.adviceGlobals)) {
		(globalThis as Record<string, unknown>)[name] = fn;
	}

	const events: TraceEvent[] = [];
	(globalThis as Record<string, unknown>).__jej_onEvent = function collectEvent(
		event: TraceEvent,
	): void {
		events.push(event);
	};

	// eslint-disable-next-line no-new-func
	new Function(instrumentedCode)();

	return events;
}

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
	propertyAccess: { dot: true, bracket: true, optionalChaining: true },
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
			loops: { while: true, doWhile: true, for: true, forOf: true },
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

		it('events have contiguous step numbers', () => {
			const events = traceInNode('let x = 5;\n', ALL_ENABLED);

			for (let i = 0; i < events.length; i++) {
				expect(events[i].step).toBe(i + 1);
			}
		});

		it('events have category field', () => {
			const events = traceInNode('let x = 5;\n', ALL_ENABLED);

			for (const event of events) {
				expect(event).toHaveProperty('category');
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
	// BINDINGS — TDZ LIFECYCLE
	// =====================================================================

	describe('bindings', () => {
		it('let declaration produces declare + initialize + available', () => {
			const events = traceInNode('let x = 5;\n', ALL_ENABLED);
			const bindingForX = events.filter(
				(e) =>
					e.category === 'variable' &&
					(e as Record<string, unknown>).name === 'x',
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
					e.category === 'variable' &&
					(e as Record<string, unknown>).event === 'declare' &&
					(e as Record<string, unknown>).name === 'x',
			);

			expect((declareEvent as Record<string, unknown>).kind).toBe('let');
		});

		it('const binding has kind "const"', () => {
			const events = traceInNode('const y = 10;\n', ALL_ENABLED);
			const declareEvent = events.find(
				(e) =>
					e.category === 'variable' &&
					(e as Record<string, unknown>).event === 'declare' &&
					(e as Record<string, unknown>).name === 'y',
			);

			expect((declareEvent as Record<string, unknown>).kind).toBe('const');
		});

		it('initialize event has correct value', () => {
			const events = traceInNode('let x = 5;\n', ALL_ENABLED);
			const initEvent = events.find(
				(e) =>
					e.category === 'variable' &&
					(e as Record<string, unknown>).event === 'initialize' &&
					(e as Record<string, unknown>).name === 'x',
			) as Record<string, unknown>;

			expect(initEvent).toBeDefined();
			expect(initEvent.value).toEqual({ type: 'number', value: 5 });
		});

		it('reassignment produces assign event (not initialize)', () => {
			const events = traceInNode('let x = 1;\nx = 2;\n', ALL_ENABLED);
			const assignEvents = events.filter(
				(e) =>
					e.category === 'variable' &&
					(e as Record<string, unknown>).event === 'assign' &&
					(e as Record<string, unknown>).name === 'x',
			);

			expect(assignEvents.length).toBeGreaterThan(0);
		});

		it('variable read produces read event', () => {
			const events = traceInNode('let x = 1;\nlet y = x;\n', ALL_ENABLED);
			const readEvent = events.find(
				(e) =>
					e.category === 'variable' &&
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
		it('arithmetic operator produces event', () => {
			const events = traceInNode('let x = 1 + 2;\n', ALL_ENABLED);
			const addEvent = events.find(
				(e) =>
					e.category === 'operator' &&
					(e as Record<string, unknown>).operator === '+',
			);
			expect(addEvent).toBeDefined();
		});

		it('comparison operator produces event', () => {
			const events = traceInNode('let x = 1 === 1;\n', ALL_ENABLED);
			const compEvent = events.find(
				(e) =>
					e.category === 'operator' &&
					(e as Record<string, unknown>).operator === '===',
			);
			expect(compEvent).toBeDefined();
		});

		it('typeof produces event', () => {
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
		it('number literal', () => {
			const events = traceInNode('let x = 42;\n', ALL_ENABLED);
			const numLiteral = events.find(
				(e) =>
					e.category === 'literal' &&
					(e as Record<string, unknown>).kind === 'number',
			);
			expect(numLiteral).toBeDefined();
		});

		it('string literal', () => {
			const events = traceInNode('let x = "hello";\n', ALL_ENABLED);
			const strLiteral = events.find(
				(e) =>
					e.category === 'literal' &&
					(e as Record<string, unknown>).kind === 'string',
			);
			expect(strLiteral).toBeDefined();
		});

		it('boolean literal', () => {
			const events = traceInNode('let x = true;\n', ALL_ENABLED);
			const boolLiteral = events.find(
				(e) =>
					e.category === 'literal' &&
					(e as Record<string, unknown>).kind === 'boolean',
			);
			expect(boolLiteral).toBeDefined();
		});
	});

	// =====================================================================
	// SCOPES
	// =====================================================================

	describe('scopes', () => {
		it('module-level scope produces create + enter + completion + leave', () => {
			const events = traceInNode('let x = 5;\n', ALL_ENABLED);
			const scopeEvents = events.filter((e) => e.category === 'scope');
			const scopeEventTypes = scopeEvents.map(
				(e) => (e as Record<string, unknown>).event,
			);

			expect(scopeEventTypes).toContain('create');
			expect(scopeEventTypes).toContain('enter');
			expect(scopeEventTypes).toContain('completion');
			expect(scopeEventTypes).toContain('leave');
		});

		it('block scope has correct depth', () => {
			const events = traceInNode('{\n  let x = 1;\n}\n', ALL_ENABLED);
			const blockCreates = events.filter(
				(e) =>
					e.category === 'scope' &&
					(e as Record<string, unknown>).event === 'create' &&
					(e as Record<string, unknown>).kind === 'block',
			);

			expect(blockCreates.length).toBeGreaterThan(0);
			expect(
				(blockCreates[0] as Record<string, unknown>).depth,
			).toBeGreaterThan(0);
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
			const cfEvents = events.filter((e) => e.category === 'conditional');
			const cfTypes = cfEvents.map((e) => (e as Record<string, unknown>).event);

			expect(cfTypes).toContain('test');
			expect(cfTypes).toContain('branch');
		});

		it('while loop produces iteration events', () => {
			const events = traceInNode(
				'let i = 0;\nwhile (i < 3) {\n  i = i + 1;\n}\n',
				ALL_ENABLED,
			);
			const iterEvents = events.filter(
				(e) =>
					e.category === 'loop' &&
					(e as Record<string, unknown>).event === 'iteration',
			);
			expect(iterEvents.length).toBeGreaterThan(0);
		});

		describe('while-loop test event', () => {
			it('classified as loop', () => {
				const events = traceInNode(
					'let i = 0;\nwhile (i < 2) {\n  i = i + 1;\n}\n',
					ALL_ENABLED,
				);
				const whileTest = events.find(
					(e) =>
						e.category === 'loop' &&
						(e as Record<string, unknown>).event === 'test',
				);
				expect(whileTest).toBeDefined();
			});

			it('kind is while', () => {
				const events = traceInNode(
					'let i = 0;\nwhile (i < 2) {\n  i = i + 1;\n}\n',
					ALL_ENABLED,
				);
				const whileTest = events.find(
					(e) =>
						e.category === 'loop' &&
						(e as Record<string, unknown>).event === 'test',
				) as Record<string, unknown>;
				expect(whileTest.kind).toBe('while');
			});

			it('gated by loops.while, not conditionals', () => {
				const events = traceInNode(
					'let i = 0;\nwhile (i < 2) {\n  i = i + 1;\n}\n',
					{
						controlFlow: {
							kind: { conditionals: false, loops: { while: true } },
							events: { test: true },
						},
					},
				);
				const whileTest = events.find(
					(e) =>
						e.category === 'loop' &&
						(e as Record<string, unknown>).event === 'test',
				);
				expect(whileTest).toBeDefined();
			});
		});

		it('for-loop test event kind is for (not mislabeled while)', () => {
			const events = traceInNode(
				'for (let i = 0; i < 3; i = i + 1) {\n  let x = i;\n}\n',
				ALL_ENABLED,
			);
			const forTest = events.find(
				(e) =>
					e.category === 'loop' &&
					(e as Record<string, unknown>).event === 'test',
			) as Record<string, unknown>;
			expect(forTest.kind).toBe('for');
		});

		it('for loop produces test + iteration events', () => {
			const events = traceInNode(
				'for (let i = 0; i < 3; i = i + 1) {\n  let x = i;\n}\n',
				ALL_ENABLED,
			);
			const cfEvents = events.filter((e) => e.category === 'loop');
			const cfTypes = cfEvents.map((e) => (e as Record<string, unknown>).event);

			expect(cfTypes).toContain('test');
			expect(cfTypes).toContain('iteration');
		});

		it('break produces jump event', () => {
			const events = traceInNode(
				'for (let i = 0; i < 10; i = i + 1) {\n  if (i === 3) {\n    break;\n  }\n}\n',
				ALL_ENABLED,
			);
			const jumpEvents = events.filter(
				(e) =>
					e.category === 'jump' &&
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
			const fnEvents = events.filter((e) => e.category === 'function');
			const fnTypes = fnEvents.map((e) => (e as Record<string, unknown>).event);

			expect(fnTypes).toContain('call');
			expect(fnTypes).toContain('return');
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
			const templateEvents = events.filter((e) => e.category === 'template');
			const templateTypes = templateEvents.map(
				(e) => (e as Record<string, unknown>).event,
			);

			expect(templateTypes).toContain('begin');
			expect(templateTypes).toContain('evaluation');
			expect(templateTypes).toContain('end');
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
			const events = traceInNode('let x = 5;\nconst y = 10;\n', config);
			const letBindings = events.filter(
				(e) =>
					e.category === 'variable' &&
					(e as Record<string, unknown>).kind === 'let',
			);
			const constBindings = events.filter(
				(e) =>
					e.category === 'variable' &&
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
			const events = traceInNode('let x = 1;\nlet y = x;\n', config);
			const readEvents = events.filter(
				(e) =>
					e.category === 'variable' &&
					(e as Record<string, unknown>).event === 'read',
			);
			const declareEvents = events.filter(
				(e) =>
					e.category === 'variable' &&
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
			const events = traceInNode('let x = "hello";\nlet y = 42;\n', config);
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
	});

	// =====================================================================
	// ERROR CASES
	// =====================================================================

	describe('error cases', () => {
		it('syntax error in instrument() throws', () => {
			expect(() => instrument('let x = ;\n', ALL_ENABLED)).toThrow();
		});
	});
});
