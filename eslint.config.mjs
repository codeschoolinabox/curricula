import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginBoundaries from 'eslint-plugin-boundaries';
import eslintPluginFunctional from 'eslint-plugin-functional';
import eslintPluginImport from 'eslint-plugin-import';
import * as mdx from 'eslint-plugin-mdx';
import eslintPluginSecurity from 'eslint-plugin-security';
import eslintPluginSonarJS from 'eslint-plugin-sonarjs';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import tseslint from 'typescript-eslint';

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
			// Vendored blanks lens internals (blankenate, no-paste-extension,
			// url-config, evaluate-correctness) — JS→TS mechanical converts of
			// the legacy implementation; idiomatic V2 style is a follow-up.
			// Tests/ extends the exclusion to the concurrent session's WIP
			// test files (component.test.tsx etc.) — re-include when the
			// blanks lens refactor stabilizes.
			'src/lib/just-enough/javascript/lenses/blanks/lib/**',
			'src/lib/just-enough/javascript/lenses/blanks/tests/**',
			// Vendored parsons lens internals (lis, parse-parsons) — JS→TS
			// mechanical converts of the legacy JSParsons implementation;
			// idiomatic V2 style is a follow-up. Tests/ extends the
			// exclusion to this session's WIP test files during the redo —
			// re-include when the parsons lens refactor stabilizes.
			'src/lib/just-enough/javascript/lenses/parsons/lib/**',
			'src/lib/just-enough/javascript/lenses/parsons/tests/**',
			// WIP tracer engine — Phase B redesign in progress per
			// EMBODY-IMPL-HANDOFF.md. The full evaluating/ subtree (trace,
			// intercept, run, shared) is mid-refactor; lint rules don't yet
			// apply cleanly. Vitest still runs these (run.browser.test.ts =
			// 27 passing tests verified post Sprint 5.3). Re-include
			// directory-by-directory as each lands its Phase B sub-task.
			'src/lib/just-enough/javascript/embody/lib/evaluating/trace/**',
			'src/lib/just-enough/javascript/embody/lib/evaluating/intercept/**',
			'src/lib/just-enough/javascript/embody/lib/evaluating/run/**',
			'src/lib/just-enough/javascript/embody/lib/evaluating/shared/**',
			// Legacy / pre-redesign holdouts (explicit subdir names).
			'src/lib/just-enough/javascript/embody/lib/parse-old/**',
			'src/lib/just-enough/javascript/embody/.legacy/**',
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
				{ ignoreAccessorPattern: ['module.exports'] },
			],
			// OFF, not warn: this rule's autofixer adds `readonly` /
			// `ReadonlyArray` / `ReadonlyMap` to mutated locals, which breaks
			// typecheck. lint-staged runs `eslint --fix`, and `--fix` applies
			// fixers regardless of severity — so `warn` does NOT disarm it
			// (a `warn` here is exactly what caused the 124-error autofix
			// cascade). `off` is the only setting that stops the autofix.
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
			'src/lib/just-enough/javascript/lib/documenting/*.ts',
			'src/lib/just-enough/javascript/lib/completing/*.ts',
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
