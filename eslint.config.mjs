import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginBoundaries from 'eslint-plugin-boundaries';
import eslintPluginFunctional from 'eslint-plugin-functional';
import eslintPluginImport from 'eslint-plugin-import';
import * as mdx from 'eslint-plugin-mdx';
import eslintPluginSecurity from 'eslint-plugin-security';
import eslintPluginSonarJS from 'eslint-plugin-sonarjs';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import tseslint from 'typescript-eslint';

import newspaperOrder from './eslint-rules/newspaper-order.mjs';

const STUDY_LENSES_SUBSYSTEMS = [
	'embody',
	'evaluators',
	'language-levels',
	'lenses',
	'orchestrate',
	'translations',
];

export default tseslint.config(
	// =========================================================================
	// Global ignores
	// =========================================================================
	{
		ignores: [
			'node_modules/',
			'.husky/',
			'build/',
			'.docusaurus/',
			'**/*.d.ts',
			// Vendored legacy JS library — not our code
			'src/lib/sl-trace-js-aran-legacy/src/record/legacy-aran-trace/**',
			// Test snippet JS files — exercise inputs, not source code
			'src/lib/sl-trace-js-aran-legacy/src/record/tests/test-snippets/**',
			// Deprecated architecture tree (pre-greenfield-rewrite reference
			// copy) — kept on disk during the study-lenses migration, but not
			// held to current lint standard. Ignored wholesale rather than
			// per-lens; nothing in here is meant to gate.
			'src/lib/study-lenses--deprecated-architecture/**',
			// WIP tracer engine (top-level src/lib/embody/) — mid-refactor
			// subtrees where lint rules don't yet apply cleanly; re-included
			// directory-by-directory as each lands. trace/variables is now in
			// CI; trace/semantics (engine-consumer rebuild — see
			// src/lib/study-lenses/ROADMAP.md) and the trace/syntax design
			// stub remain excluded. Vitest still runs the un-excluded suites.
			'src/lib/embody/lib/evaluating/trace/semantics/**',
			'src/lib/embody/lib/evaluating/trace/syntax/**',
			'src/lib/embody/lib/evaluating/intercept/**',
			'src/lib/embody/lib/evaluating/run/**',
			'src/lib/embody/lib/evaluating/shared/**',
			// Legacy / pre-redesign holdouts (explicit subdir names).
			'src/lib/embody/lib/parse-old/**',
			'src/lib/embody/.legacy/**',
			// Test fixtures are intentional inputs (some malformed, some
			// using legacy syntax) — ESLint rules don't apply to them.
			'**/tests/fixtures/**',
			// Deprecated curriculum tree (per README: unrouted in
			// docusaurus.config.ts; do not add new content). Files here
			// teach JS concepts (e.g. 'declaring-and-initializing.js'
			// using `let`) — ESLint autofix is pedagogically wrong.
			// Mirrors the .prettierignore exclusion from Sprint 2.7.
			'spiralearn/welcome-to-programming/**',
			// Sandbox plugin-fixtures contain pedagogical snippets used as
			// test inputs (single-line `let x = 1;` to demonstrate the
			// 'declare' concept). Autofix to const defeats the demo.
			'spiralearn/sandbox/**',
			// Per-package scaffolding (will be removed after Phase 7)
			'src/lib/*/node_modules/**',
			'src/lib/*/dist/**',
			'src/lib/*/docs/**',
		],
	},

	// =========================================================================
	// Zone 1: Curriculum JS content (permissive)
	// =========================================================================
	{
		files: ['**/*.js', '**/*.mjs', '**/*.jsx'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				// Browser globals (study content uses alert/prompt/document)
				console: 'readonly',
				alert: 'readonly',
				confirm: 'readonly',
				prompt: 'readonly',
				document: 'readonly',
				window: 'readonly',
				// Node globals
				process: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
			},
		},
		rules: {
			'no-undef': 'error',
			'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'no-console': 'off',
			'no-debugger': 'warn',
			'no-var': 'error',
			'prefer-const': 'warn',
			eqeqeq: ['error', 'always'],
			'no-duplicate-imports': 'error',
		},
	},

	// =========================================================================
	// Zone 1b: MDX files (unchanged)
	// =========================================================================
	{
		...mdx.flat,
		processor: mdx.createRemarkProcessor({
			lintCodeBlocks: true,
		}),
	},
	{
		...mdx.flatCodeBlocks,
		rules: {
			...mdx.flatCodeBlocks.rules,
			'no-var': 'error',
			'prefer-const': 'warn',
			'no-unused-vars': 'off', // code blocks are often partial examples
		},
	},

	// =========================================================================
	// Zone 2: Base TypeScript configs for all of src/
	// =========================================================================
	...tseslint.configs.recommended.map((config) => ({
		...config,
		files: ['src/**/*.ts', 'src/**/*.tsx'],
	})),
	// Repo tooling tests (scripts/**) carry TS syntax espree cannot parse;
	// non-type-checked TS parsing only — `npm run typecheck:scripts` owns the
	// type gate for scripts/.
	...tseslint.configs.recommended.map((config) => ({
		...config,
		files: ['scripts/**/*.ts'],
	})),
	...tseslint.configs.recommendedTypeChecked.map((config) => ({
		...config,
		files: ['src/**/*.ts', 'src/**/*.tsx'],
	})),

	// =========================================================================
	// Zone 2b: Strict shared rules for all src/ TypeScript
	// =========================================================================
	{
		files: ['src/**/*.ts', 'src/**/*.tsx'],
		plugins: {
			boundaries: eslintPluginBoundaries,
			import: eslintPluginImport,
			functional: eslintPluginFunctional,
			unicorn: eslintPluginUnicorn,
			sonarjs: eslintPluginSonarJS,
			security: eslintPluginSecurity,
		},
		languageOptions: {
			parserOptions: {
				project: './tsconfig.json',
			},
		},
		settings: {
			'import/resolver': {
				typescript: {
					alwaysTryTypes: true,
				},
			},
		},
		rules: {
			// --- TypeScript ---
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unsafe-assignment': 'warn',
			'@typescript-eslint/no-unsafe-call': 'warn',
			'@typescript-eslint/no-unsafe-member-access': 'warn',
			'@typescript-eslint/no-unsafe-return': 'warn',
			'@typescript-eslint/prefer-readonly': 'error',
			'@typescript-eslint/prefer-readonly-parameter-types': 'off',
			'@typescript-eslint/restrict-template-expressions': 'warn',
			'@typescript-eslint/prefer-nullish-coalescing': 'off',
			'@typescript-eslint/prefer-optional-chain': 'error',
			'@typescript-eslint/no-non-null-assertion': 'warn',
			'@typescript-eslint/consistent-type-definitions': ['error', 'type'],
			'@typescript-eslint/no-shadow': 'error',

			// --- Import rules ---
			'import/extensions': 'off',
			'import/order': [
				'error',
				{
					groups: [
						'builtin',
						'external',
						'internal',
						'parent',
						'sibling',
						'index',
					],
					'newlines-between': 'always',
					alphabetize: { order: 'asc' },
				},
			],
			'import/no-named-export': 'error',
			'import/prefer-default-export': 'off',

			// --- Functional programming ---
			'functional/no-this-expressions': 'error',
			'functional/no-classes': 'error',
			'functional/immutable-data': [
				'warn',
				// `**.current` exempts React ref (and ref-like) writes —
				// `ref.current = x` is idiomatic and unavoidable — while the rule
				// still catches every other mutation, in .ts and .tsx alike.
				{ ignoreAccessorPattern: ['module.exports', '**.current'] },
			],
			// OFF, not warn: this rule's autofixer adds `readonly` /
			// `ReadonlyArray` / `ReadonlyMap` to mutated locals, which breaks
			// typecheck. `--fix` applies fixers regardless of severity — so
			// `warn` does NOT disarm it (a `warn` here is exactly what caused
			// the 124-error autofix cascade). `off` is the only setting that
			// stops the autofix. The hook is prettier-only; never re-add a
			// linter `--fix` to lint-staged.
			'functional/prefer-readonly-type': 'off',
			'functional/no-let': 'off',
			'functional/no-loop-statements': 'off',
			'functional/no-mixed-types': 'off',

			// --- Naming and style ---
			'func-names': ['error', 'always'],
			'unicorn/filename-case': ['error', { case: 'kebabCase' }],

			// --- General rules ---
			'no-console': 'off',
			'no-debugger': 'error',
			'prefer-const': 'error',
			'no-var': 'error',
			'object-shorthand': 'error',
			'prefer-template': 'error',
			'no-param-reassign': 'error',
			'no-shadow': 'off',
			'prefer-destructuring': ['error', { array: false, object: true }],
			'no-invalid-this': 'error',
			'arrow-body-style': ['error', 'never'],

			// --- Unicorn ---
			...eslintPluginUnicorn.configs.recommended.rules,
			'unicorn/consistent-destructuring': 'error',
			'unicorn/prefer-switch': 'off',
			'unicorn/switch-case-braces': 'off',
			'unicorn/prefer-ternary': 'off',
			// `prevent-abbreviations`: keep ON but allowList the Node/React
			// conventions this codebase legitimately uses (fs APIs: dir/ext;
			// React: props; docs/refs/etc). The previous 'off' here used the
			// wrong rule name ('prevent-abbreviations' instead of
			// 'unicorn/prevent-abbreviations') so the rule was actually active.
			'unicorn/prevent-abbreviations': [
				'error',
				{
					allowList: {
						// fs conventions (mkdir/readdir/__dirname) — *Dir
						// suffix is the project's universal convention for
						// directory-typed locals.
						dir: true,
						dirs: true,
						dirname: true,
						dirName: true,
						pageDir: true,
						currentDir: true,
						absDir: true,
						normalizedAbsDir: true,
						isSiblingBearingPageDir: true,
						tmpDir: true,
						childDir: true,
						chapterDir: true,
						prettifyDirName: true,
						// file-extension abbreviations
						ext: true,
						// React/JSX
						props: true,
						// documentation
						doc: true,
						docs: true,
						Doc: true,
						Docs: true,
						DocTable: true,
						assembleDocTable: true,
						notInDocs: true,
						// debug-properties pair name
						debugPropsLens: true,
						// general short identifiers used as locals
						rel: true,
						prev: true,
					},
				},
			],
			'unicorn/no-null': 'off',

			// --- SonarJS ---
			...eslintPluginSonarJS.configs.recommended.rules,
			// Downgraded: metadata-heavy modules (socratizing analyzers,
			// CodeQuestion configs) intentionally repeat tag literals
			// ('micro-decision', category names, feature names) inline
			// for self-documenting data definitions. Extracting to
			// constants scatters what should read as a single record.
			'sonarjs/no-duplicate-string': 'warn',
			'sonarjs/no-identical-functions': 'error',
			'sonarjs/cognitive-complexity': ['warn', 15],
			'sonarjs/prefer-object-literal': 'error',
			'sonarjs/prefer-immediate-return': 'off',
			'sonarjs/max-switch-cases': 'off',
			'sonarjs/no-small-switch': 'off',
			'sonarjs/prefer-single-boolean-return': 'off',
			'sonarjs/enforce-trailing-comma': 'off',
			'sonarjs/bool-param-default': 'error',
			'sonarjs/destructuring-assignment-syntax': 'error',
			'sonarjs/values-not-convertible-to-numbers': 'error',
			'sonarjs/useless-string-operation': 'error',
			'sonarjs/strings-comparison': 'error',
			'sonarjs/non-number-in-arithmetic-expression': 'error',
			'sonarjs/no-unused-function-argument': 'error',
			'sonarjs/no-nested-incdec': 'error',
			'sonarjs/no-incorrect-string-concat': 'error',
			'sonarjs/no-inconsistent-returns': 'error',
			'sonarjs/no-function-declaration-in-block': 'error',
			'sonarjs/no-for-in-iterable': 'error',
			'sonarjs/no-collapsible-if': 'error',
			'sonarjs/no-built-in-override': 'error',
			'sonarjs/nested-control-flow': 'error',
			'sonarjs/expression-complexity': 'error',
			'sonarjs/no-inverted-boolean-check': 'error',
			// TODOs are legitimate task markers in this codebase (handoff
			// docs, planned work, AR-deferred items). Downgrade from error
			// to warn so they don't gate validation.
			'sonarjs/todo-tag': 'warn',
			// Domain-named string aliases (NodePath, LensName, LangName)
			// convey meaning that bare `string` doesn't. Per DEV.md, types
			// live with their domain meaning. Downgrade from error to off.
			'sonarjs/redundant-type-aliases': 'off',
			// Validators legitimately return 'true | Violation' (predicate
			// pattern: true means valid, Violation object means invalid
			// with details). The rule forbids this and would require
			// wrapping everything in Result-like objects — over-engineering
			// for what's already a clear, narrow union.
			'sonarjs/function-return-type': 'off',
			// '=== undefined' on T|undefined unions is idiomatic TypeScript;
			// sonarjs flags it as a 'different types comparison' but the
			// runtime check is exactly the point of optional typing.
			'sonarjs/different-types-comparison': 'off',

			// --- Naming conventions ---
			camelcase: [
				'error',
				{ properties: 'never', ignoreDestructuring: true, ignoreImports: true },
			],

			// --- Banned syntax patterns ---
			'no-restricted-syntax': [
				'error',
				{
					selector: 'SwitchStatement',
					message:
						'Switch statements are not allowed. Use if-else or lookup objects.',
				},
				{
					selector: 'ImportDeclaration[source.value=/\\.ts$/]',
					message:
						'Do not use .ts extension in imports. Use .js for TypeScript ESM.',
				},
			],

			// --- Security ---
			'security/detect-object-injection': 'off',
			'security/detect-non-literal-require': 'warn',
			'security/detect-eval-with-expression': 'warn',

			// --- LLM Guardrails ---
			'spaced-comment': [
				'error',
				'always',
				{ exceptions: ['-', '=', '*', '/'] },
			],
			'max-len': [
				'error',
				{
					code: 100,
					comments: Infinity,
					ignoreUrls: true,
					ignoreStrings: true,
				},
			],
		},
	},

	// =========================================================================
	// Zone 2c: study-lenses subsystem boundaries
	// =========================================================================
	// A subsystem may depend on a sibling's public surface (index.ts/types.ts)
	// but never reach into its lib/ internals — the one architectural rule
	// this codebase currently tracks by hand (handoffs, AR review) rather than
	// by tooling. Scoped to study-lenses/ only; narrow by design — this is the
	// pattern already in use, not a speculative full dependency graph for a
	// migration still in flight.
	{
		files: ['src/lib/study-lenses/**/*.ts', 'src/lib/study-lenses/**/*.tsx'],
		plugins: { import: eslintPluginImport },
		settings: {
			'import/resolver': {
				typescript: {
					alwaysTryTypes: true,
				},
			},
		},
		rules: {
			'import/no-restricted-paths': [
				'error',
				{
					zones: STUDY_LENSES_SUBSYSTEMS.flatMap((target) =>
						STUDY_LENSES_SUBSYSTEMS.filter((from) => from !== target).map(
							(from) => ({
								target: `./src/lib/study-lenses/${target}/**/*`,
								from: `./src/lib/study-lenses/${from}/lib/**/*`,
								message: `Import ${from}'s public surface (index.ts/types.ts), not its lib/ internals, from ${target}/.`,
							}),
						),
					),
				},
			],
		},
	},

	// =========================================================================
	// Zone 2d: study-lenses type-safety gate + newspaper-order convention
	// =========================================================================
	// The type-safety rules are `warn` globally in Zone 2b so the WIP embody/ and
	// snippetry/ trees stay visible-but-non-blocking during their rebuild. The
	// clean study-lenses/ tree already satisfies all of them (0 violations), so
	// promoting to `error` here lands green and makes them a real blocking gate
	// for the greenfield code — the same scoping principle as Zone 2c. As WIP
	// trees migrate into study-lenses/ they inherit the gate. `newspaper-order`
	// (local rule) mechanically enforces the DEV.md file anatomy: imports → main
	// → consts → helpers.
	{
		files: ['src/lib/study-lenses/**/*.ts', 'src/lib/study-lenses/**/*.tsx'],
		plugins: {
			local: { rules: { 'newspaper-order': newspaperOrder } },
			'@eslint-community/eslint-comments': eslintComments,
		},
		// Flag eslint-disable directives that outlived their violation, so stale
		// suppressions don't rot. Scoped to the clean study-lenses/ tree (its
		// disables are all current) → lands green as a real gate; WIP trees stay
		// lenient, same principle as Zone 2b/2c.
		linterOptions: { reportUnusedDisableDirectives: 'error' },
		rules: {
			// Every eslint-disable must carry a `-- reason`. The tree already
			// follows this by convention; enforce it so it can't quietly lapse.
			'@eslint-community/eslint-comments/require-description': [
				'error',
				{ ignore: [] },
			],
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unsafe-assignment': 'error',
			'@typescript-eslint/no-unsafe-call': 'error',
			'@typescript-eslint/no-unsafe-member-access': 'error',
			'@typescript-eslint/no-unsafe-return': 'error',
			'@typescript-eslint/restrict-template-expressions': 'error',
			'@typescript-eslint/no-non-null-assertion': 'error',
			'local/newspaper-order': 'error',
		},
	},

	// =========================================================================
	// Overrides
	// =========================================================================

	// --- Plain JS files: disable type-checked rules ---
	{
		files: ['**/*.js', '**/*.mjs'],
		...tseslint.configs.disableTypeChecked,
	},

	// --- Public API files: named exports allowed ---
	{
		files: [
			// Entry points at any depth (barrel / public-API files).
			'src/lib/**/index.ts',
			'src/lib/**/index.tsx',
			'src/plugins/**/index.ts',
			'src/plugins/**/index.tsx',
			// Domain-partition data files (documenting/, completing/) where
			// each file exports one slice of a union. The collection's
			// canonical structure is "many named exports per category".
			'src/lib/study-lenses/lib/documenting/*.ts',
			'src/lib/study-lenses/lib/completing/*.ts',
		],
		rules: {
			'import/no-named-export': 'off',
		},
	},

	// --- Type definition files: named exports allowed ---
	{
		files: ['**/types.ts', '**/*.types.ts', '**/types/*.ts'],
		rules: {
			'import/no-named-export': 'off',
		},
	},

	// --- Test files ---
	{
		files: [
			'**/*.test.ts',
			'**/*.test.tsx',
			'**/*.test.js',
			'**/tests/**/*.ts',
			'**/tests/**/*.tsx',
		],
		languageOptions: {
			globals: {
				describe: 'readonly',
				it: 'readonly',
				test: 'readonly',
				expect: 'readonly',
				beforeEach: 'readonly',
				afterEach: 'readonly',
				beforeAll: 'readonly',
				afterAll: 'readonly',
				vi: 'readonly',
			},
		},
		rules: {
			'import/no-named-export': 'off',
			'functional/immutable-data': 'off',
			'arrow-body-style': 'off',
			'sonarjs/no-duplicate-string': 'off',
			'unicorn/consistent-function-scoping': 'off',
			// Tests naturally access different facets of a fixture across
			// many it() blocks; forcing one upfront destructure hurts
			// readability and isn't idiomatic.
			'unicorn/consistent-destructuring': 'off',
			// Tests use 'const v = list.find((v) => ...)' patterns where the
			// outer var and inner callback param share a name (throwaway
			// short locals). Production code keeps the rule on.
			'@typescript-eslint/no-shadow': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},

	// --- Error types: class/this allowed per JS Error convention ---
	{
		files: ['src/**/errors/**/*.ts', 'src/**/create-enforcement-error.ts'],
		rules: {
			'functional/no-classes': 'off',
			'functional/no-this-expressions': 'off',
			'no-invalid-this': 'off',
		},
	},

	// =========================================================================
	// Prettier compat (must be last)
	// =========================================================================
	eslintConfigPrettier,
);
