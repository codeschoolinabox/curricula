/**
 * @file Dev pipeline: validate every trace event against TypeScript types.
 *
 * Runs each sandbox program through the tracer with ALL_ENABLED config,
 * then validates every emitted event field-by-field against the type spec.
 * Catches mismatches between what advice functions emit and what types declare.
 */

import { describe, expect, it, vi } from 'vitest';

import { ALL_ENABLED, drainGenerator } from './test-helpers.js';
import validateEvent from './validate-event.js';

vi.setConfig({ testTimeout: 60000 });

// --- Sandbox programs (inline for browser test compatibility) ---

const PROGRAMS: Record<string, string> = {
	'01-let-const':
		"let greeting = 'hello';\nconst pi = 3.14;\nlet count = 0;\ncount = 1;\nlet a = 1, b = 2;\nconsole.log(greeting);\nconsole.log(pi);\nconsole.log(count);\nconsole.log(a);\nconsole.log(b);\n",
	'02-primitives':
		"let text = 'hello world';\nlet num = 42;\nlet pi = 3.14;\nlet yes = true;\nlet no = false;\nlet empty = null;\nlet missing = undefined;\nlet notANumber = NaN;\nlet forever = Infinity;\nlet negative = -1;\n",
	'03-arithmetic':
		'let sum = 10 + 3;\nlet diff = 10 - 3;\nlet product = 10 * 3;\nlet quotient = 10 / 3;\nlet remainder = 10 % 3;\nlet power = 2 ** 8;\n',
	'04-comparison':
		'let a = 5;\nlet b = 10;\nlet equal = a === b;\nlet notEqual = a !== b;\nlet greater = a > b;\nlet less = a < b;\nlet greaterEq = a >= 5;\nlet lessEq = b <= 10;\n',
	'05-logical':
		"let both = true && false;\nlet either = true || false;\nlet fallback = null ?? 'default';\nlet negated = !true;\nlet ternary = 5 > 3 ? 'yes' : 'no';\n",
	'06-assignment-ops':
		'let x = 10;\nx += 5;\nx -= 3;\nx *= 2;\nx /= 4;\nx %= 5;\nx **= 3;\n',
	'07-typeof-negation':
		"let t1 = typeof 'hello';\nlet t2 = typeof 42;\nlet t3 = typeof true;\nlet t4 = typeof undefined;\nlet neg = -5;\nlet bitNot = ~7;\n",
	'08-if-else':
		"let score = 75;\nif (score >= 90) {\n\tconsole.log('A');\n} else if (score >= 80) {\n\tconsole.log('B');\n} else if (score >= 70) {\n\tconsole.log('C');\n} else {\n\tconsole.log('F');\n}\n",
	'09-while-loop':
		'let count = 0;\nwhile (count < 3) {\n\tconsole.log(count);\n\tcount += 1;\n}\n',
	'10-for-of':
		"for (const character of 'hello') {\n\tconsole.log(character);\n}\n",
	'11-template-literals':
		"let name = 'world';\nlet greeting = `hello ${name}`;\nconsole.log(greeting);\n",
	'12-string-methods':
		"let text = 'Hello World';\nconsole.log(text.toUpperCase());\nconsole.log(text.toLowerCase());\nconsole.log(text.includes('World'));\nconsole.log(text.indexOf('o'));\nconsole.log(text.slice(0, 5));\n",
	'13-string-properties':
		"let text = 'hello';\nlet len = text.length;\nlet first = text[0];\nconsole.log(len);\nconsole.log(first);\n",
	'14-type-conversion':
		"let asString = String(42);\nlet asNumber = Number('3.14');\nlet asBool = Boolean('');\nlet nanCheck = Number.isNaN(NaN);\n",
	'15-console-io':
		"console.log('hello world');\nconsole.log(42);\nconsole.log(true);\n",
	'16-block-scope':
		"let x = 'outer';\n{\n\tlet x = 'inner';\n\tconsole.log(x);\n}\nconsole.log(x);\n",
	'17-nullish-coalescing':
		"let a = null ?? 'default';\nlet b = undefined ?? 'fallback';\nlet c = 0 ?? 'not this';\n",
	'18-optional-chaining':
		"let text = 'hello';\nlet len = text?.length;\nlet empty = null;\nlet safe = empty?.length;\n",
	'19-math':
		'let pi = Math.PI;\nlet rounded = Math.round(3.7);\nlet floored = Math.floor(3.7);\nlet absolute = Math.abs(-7);\nlet root = Math.sqrt(16);\n',
	'20-integration':
		"let word = 'hello';\nlet upper = word.toUpperCase();\nlet len = word.length;\nconsole.log(`${word} has ${len} characters`);\nlet count = 0;\nfor (const c of word) {\n\tif (c === 'l') {\n\t\tcount += 1;\n\t}\n}\nconsole.log(`found ${count} letter l`);\n",
};

// --- Tests ---

describe('trace event type validation', () => {
	for (const [name, code] of Object.entries(PROGRAMS)) {
		it(`all events in ${name} match type definitions`, async () => {
			const { events, result } = await drainGenerator(code, ALL_ENABLED);
			const r = result as Record<string, unknown>;

			if (
				r.ok === false &&
				(r.error as Record<string, unknown>)?.kind === 'javascript'
			) {
				// Runtime error — still validate any partial events
			}

			const allErrors: string[] = [];
			for (const event of events) {
				const validation = validateEvent(event);
				if (!validation.valid) {
					for (const error of validation.errors) {
						allErrors.push(`step ${event.step} [${event.category}]: ${error}`);
					}
				}
			}

			expect(allErrors).toEqual([]);
		});
	}
});
