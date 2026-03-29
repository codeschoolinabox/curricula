import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginBoundaries from 'eslint-plugin-boundaries';
import eslintPluginFunctional from 'eslint-plugin-functional';
import eslintPluginImport from 'eslint-plugin-import';
import * as mdx from 'eslint-plugin-mdx';
import eslintPluginSecurity from 'eslint-plugin-security';
import eslintPluginSonarJS from 'eslint-plugin-sonarjs';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import tseslint from 'typescript-eslint';

// Per-package boundary configs
import enforcerBoundaries from './src/lib/language-level-enforcer/eslint.boundaries.mjs';
import validatorBoundaries from './src/lib/language-level-validator/eslint.boundaries.mjs';
import traceBoundaries from './src/lib/sl-trace-js-aran-legacy/eslint.boundaries.mjs';

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
				project: './tsconfig.lint.json',
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
			'functional/prefer-readonly-type': 'warn',
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
			'prevent-abbreviations': 'off',
			'unicorn/no-null': 'off',

			// --- SonarJS ---
			...eslintPluginSonarJS.configs.recommended.rules,
			'sonarjs/no-duplicate-string': 'error',
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
	// Zone 3: Per-package boundary rules (imported from each lib package)
	// =========================================================================
	{
		files: ['src/lib/language-level-enforcer/**/*.ts'],
		settings: enforcerBoundaries.settings,
		rules: enforcerBoundaries.rules,
	},
	{
		files: ['src/lib/language-level-validator/**/*.ts'],
		settings: validatorBoundaries.settings,
		rules: validatorBoundaries.rules,
	},
	{
		files: ['src/lib/sl-trace-js-aran-legacy/**/*.ts'],
		settings: traceBoundaries.settings,
		rules: traceBoundaries.rules,
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
		files: ['src/lib/*/src/index.ts', 'src/lib/*/index.ts'],
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
		files: ['**/*.test.ts', '**/*.test.js', '**/tests/**/*.ts'],
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
			'functional/prefer-readonly-type': 'off',
			'arrow-body-style': 'off',
			'sonarjs/no-duplicate-string': 'off',
			'unicorn/consistent-function-scoping': 'off',
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
