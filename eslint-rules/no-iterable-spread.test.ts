import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, it } from 'vitest';

import rule from './no-iterable-spread.mjs';

// vitest.config has globals off, so RuleTester's default global describe/it
// aren't present — wire vitest's in so cases register as real tests.
RuleTester.describe = describe;
RuleTester.it = it;

// Unlike `newspaper-order`, this rule reads the TypeScript checker: the hazard
// is a property of the operand's TYPE, not its syntax. So the tester runs a
// real program over an in-memory file rather than parse-only.
const ruleTester = new RuleTester({
	languageOptions: {
		parser: tseslint.parser as never,
		parserOptions: {
			projectService: {
				allowDefaultProject: ['*.ts*'],
			},
			tsconfigRootDir: import.meta.dirname,
		},
	},
});

ruleTester.run('no-iterable-spread', rule as never, {
	valid: [
		// array literal — Babel's loose spread handles this correctly
		`const a = [1, 2, 3];\nconst b = [...a];`,
		// a typed array
		`declare const a: number[];\nconst b = [...a];`,
		// readonly array
		`declare const a: readonly string[];\nconst b = [...a];`,
		// Array<T> / ReadonlyArray<T>
		`declare const a: Array<number>;\nconst b = [...a];`,
		`declare const a: ReadonlyArray<number>;\nconst b = [...a];`,
		// a tuple
		`declare const a: [number, string];\nconst b = [...a];`,
		// the sanctioned form — never reported, whatever the operand
		`declare const s: Set<number>;\nconst b = Array.from(s);`,
		// object spread is a different transform and out of scope
		`declare const s: Set<number>;\nconst o = { ...{ a: 1 } };`,
		// unresolvable types are left alone rather than guessed at
		`declare const a: any;\nconst b = [...a];`,
		`declare const a: unknown;\nconst b = [...(a as never)];`,
		// a type parameter is judged by its CONSTRAINT — this one is an array,
		// so the spread is safe and must not report
		`function f<A extends unknown[]>(a: A) {\n\treturn [...a];\n}`,
		`function f<A extends readonly string[]>(a: A) {\n\treturn [...a];\n}`,
		// an unconstrained type parameter cannot be judged from inside
		`function f<A>(a: A) {\n\treturn [...(a as unknown as unknown[])];\n}`,
		// a named interface that really extends Array is a real array at runtime
		`declare const m: RegExpMatchArray;\nconst b = [...m];`,
		// call spread over an array is fine
		`declare const a: number[];\ndeclare function f(...xs: number[]): void;\nf(...a);`,
	],
	invalid: [
		{
			// the event-bus defect (`95d0e66`)
			code: `declare const s: Set<number>;\nconst b = [...s];`,
			errors: [{ messageId: 'iterableSpread' }],
		},
		{
			// the entwining defect — an ARRAY is safe, but its .entries() is not
			code: `declare const a: number[];\nconst b = [...a.entries()];`,
			errors: [{ messageId: 'iterableSpread' }],
		},
		{
			code: `declare const m: Map<string, number>;\nconst b = [...m];`,
			errors: [{ messageId: 'iterableSpread' }],
		},
		{
			code: `declare const m: Map<string, number>;\nconst b = [...m.entries()];`,
			errors: [{ messageId: 'iterableSpread' }],
		},
		{
			code: `declare const m: Map<string, number>;\nconst b = [...m.keys()];`,
			errors: [{ messageId: 'iterableSpread' }],
		},
		{
			// the tokens defect — a generator/iterator return
			code: `declare function tokens(): IterableIterator<number>;\nconst b = [...tokens()];`,
			errors: [{ messageId: 'iterableSpread' }],
		},
		{
			// a string is wrapped too: [].concat('ab') is ['ab'], not ['a','b']
			code: `declare const s: string;\nconst b = [...s];`,
			errors: [{ messageId: 'iterableSpread' }],
		},
		{
			// only the unsafe element of a mixed literal reports
			code: `declare const a: number[];\ndeclare const s: Set<number>;\nconst b = [...a, ...s];`,
			errors: [{ messageId: 'iterableSpread' }],
		},
		{
			// a union is safe only if every constituent is
			code: `declare const a: number[] | Set<number>;\nconst b = [...a];`,
			errors: [{ messageId: 'iterableSpread' }],
		},
	],
});
