import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, it } from 'vitest';

import rule from './newspaper-order.mjs';

// vitest.config has globals off, so RuleTester's default global describe/it
// aren't present — wire vitest's in so cases register as real tests.
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
	languageOptions: {
		// parse-only: this is a pure-AST ordering rule; no type information or
		// tsconfig project is needed, which keeps the suite fast and hermetic.
		parser: tseslint.parser,
		ecmaVersion: 2022,
		sourceType: 'module',
	},
});

ruleTester.run('newspaper-order', rule, {
	valid: [
		// bare minimum: main alone, nothing before or after
		`export default function main() { return 1; }`,
		// imports + main only
		`import x from 'y';\nexport default function main() { return x; }`,
		// canonical: main → consts → helpers
		`export default function main() { return helper(K); }\nconst K = 1;\nfunction helper(n) { return n; }`,
		// main → consts, no helpers
		`export default function main() { return K; }\nconst K = 1;`,
		// main → helpers, no consts
		`export default function main() { return helper(); }\nfunction helper() { return 1; }`,
		// async main first, helper below
		`export default async function main() { return helper(); }\nfunction helper() { return 1; }`,
		// anonymous default main, helper correctly below — predicate must engage on
		// declaration TYPE, not on a (missing) name
		`export default function () { return helper(); }\nfunction helper() { return 1; }`,
		// generic main — predicate is purely structural, indifferent to typeParameters
		`export default function main<T>(x: T): T { return x; }\nfunction helper() { return 1; }`,
		// spine-object: default is an Identifier, functions defined above → no-op
		`function validate() { return 1; }\nconst spine = { validate };\nexport default spine;`,
		// barrel re-export: no default export → no-op
		`export { a } from './a.js';\nexport { b } from './b.js';`,
		// functions + consts present but NO default export at all → full no-op
		`function helper() { return 1; }\nconst K = 1;\nexport { helper, K };`,
		// type alias directly before main (no import) — a skipped node must not
		// throw off the main-index computation
		`type T = string;\nexport default function main(): T { return 'x' as T; }`,
		// type alias between main and helper is skipped (not part of the order)
		`export default function main() { return 1; }\ntype T = string;\nfunction helper(t: T) { return t; }`,
		// `let`/`var` are intentionally out of scope — only `const` placement is
		// checked (DEV.md speaks only to constants)
		`let cache;\nexport default function main() { cache = 1; return cache; }`,
		// named-export-wrapped function above main is out of scope: the top-level
		// node is ExportNamedDeclaration, not FunctionDeclaration. In-repo this
		// can't co-occur with a default-function main under import/no-named-export;
		// the rule leans on that rather than unwrapping.
		`export function foo() { return 1; }\nexport default function main() { return foo(); }`,
		// nested function + const inside main don't count as top-level
		`export default function main() { const inner = 1; function nested() { return inner; } return nested(); }`,
		// arrow default with a function above → predicate no-op (not a function file)
		`function helper() { return 1; }\nexport default () => helper();`,
	],
	invalid: [
		// helper above main — assert the reported NAME, not just the messageId,
		// so a rule that ships the literal '{{name}}' or targets the wrong node fails
		{
			code: `function helper() { return 1; }\nexport default function main() { return helper(); }`,
			errors: [{ messageId: 'helperAboveMain', data: { name: 'helper' } }],
		},
		// anonymous main, helper above → predicate still engages
		{
			code: `function helper() { return 1; }\nexport default function () { return helper(); }`,
			errors: [{ messageId: 'helperAboveMain', data: { name: 'helper' } }],
		},
		// const above main (the create-editor shape)
		{
			code: `const K = 1;\nexport default function main() { return K; }`,
			errors: [{ messageId: 'constAboveMain', data: { name: 'K' } }],
		},
		// typed const above main — the name is the identifier only, NOT 'K: number'
		{
			code: `const K: number = 1;\nexport default function main() { return K; }`,
			errors: [{ messageId: 'constAboveMain', data: { name: 'K' } }],
		},
		// arrow-const helper above main is (by design) reported as a const
		// placement issue, not helperAboveMain — see the rule's out-of-scope note
		{
			code: `const helper = () => 1;\nexport default function main() { return helper(); }`,
			errors: [{ messageId: 'constAboveMain', data: { name: 'helper' } }],
		},
		// destructured const above main — realistic given prefer-destructuring;
		// the name must be the binding text, never 'undefined'
		{
			code: `const { a, b } = get();\nexport default function main() { return a + b; }`,
			errors: [{ messageId: 'constAboveMain', data: { name: '{ a, b }' } }],
		},
		// multiple declarators in one const above main → single report, joined names
		{
			code: `const K = 1, J = 2;\nexport default function main() { return K + J; }`,
			errors: [{ messageId: 'constAboveMain', data: { name: 'K, J' } }],
		},
		// const after a helper
		{
			code: `export default function main() { return helper(); }\nfunction helper() { return K; }\nconst K = 1;`,
			errors: [{ messageId: 'constAfterHelper', data: { name: 'K' } }],
		},
		// main → h1 → const → h2: exactly one constAfterHelper (the interleaved const)
		{
			code: `export default function main() { return 1; }\nfunction h1() { return 1; }\nconst K = 1;\nfunction h2() { return K; }`,
			errors: [{ messageId: 'constAfterHelper', data: { name: 'K' } }],
		},
		// two helpers above main → two reports, each naming its own node
		{
			code: `function h1() { return 1; }\nfunction h2() { return 2; }\nexport default function main() { return h1() + h2(); }`,
			errors: [
				{ messageId: 'helperAboveMain', data: { name: 'h1' } },
				{ messageId: 'helperAboveMain', data: { name: 'h2' } },
			],
		},
		// combined violation kinds in one file — proves neither branch suppresses
		// the other (shared-state guard)
		{
			code: `function h() { return 1; }\nconst K = 1;\nexport default function main() { return h() + K; }`,
			errors: [
				{ messageId: 'helperAboveMain', data: { name: 'h' } },
				{ messageId: 'constAboveMain', data: { name: 'K' } },
			],
		},
	],
});
