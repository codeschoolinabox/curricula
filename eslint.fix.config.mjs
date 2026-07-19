/**
 * Minimal, semantics-preserving autofix config — scoped to study-lenses/.
 *
 * WHY a separate config instead of `eslint --fix` against eslint.config.mjs:
 * `--fix` applies a rule's fixer regardless of severity, and the main config
 * carries aggressive `unicorn/*` fixers plus `functional/prefer-readonly-type`
 * (the rule whose autofixer once cascaded 124 errors — see the comment at
 * eslint.config.mjs "Zone 2b"). `--fix-type suggestion,layout` does NOT save us:
 * those unicorn fixers are `suggestion`-typed and would slip through.
 *
 * A fresh flat config starts with NO rules enabled, so this file enables ONLY a
 * curated allowlist of deterministic, semantics-preserving fixers. `eslint --fix`
 * against this config can therefore touch nothing else.
 *
 * This is a MANUAL tool (see scripts/lint-fix-study-lenses.mjs). It is NOT wired
 * into husky/lint-staged — pre-commit stays prettier-only. Run it, then REVIEW
 * THE DIFF before staging.
 *
 * Grow the allowlist one rule at a time, only after confirming clean diffs.
 * Deliberately excluded: all `unicorn/*` fixers; `functional/prefer-readonly-type`
 * (the cascade rule); `@typescript-eslint/prefer-optional-chain` (short-circuit
 * semantics — revisit later); `local/newspaper-order` (fixerless by design).
 */

import eslintPluginBoundaries from 'eslint-plugin-boundaries';
import eslintPluginFunctional from 'eslint-plugin-functional';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginSecurity from 'eslint-plugin-security';
import eslintPluginSonarJS from 'eslint-plugin-sonarjs';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import tseslint from 'typescript-eslint';

export default [
	// Test files are exempt from arrow-body-style / object-shorthand / etc. in
	// the main config (Zone "Test files"). Excluding them here keeps this fix
	// pass aligned with what the real gate considers a violation — otherwise
	// --fix would rewrite block-body arrows in tests that the gate allows.
	{ ignores: ['**/*.test.{ts,tsx}', '**/tests/**'] },
	{
		files: ['src/lib/study-lenses/**/*.ts', 'src/lib/study-lenses/**/*.tsx'],
		// CRITICAL: this minimal config does not enable the functional/unicorn/etc
		// rules, so their inline `eslint-disable` directives look "unused" — and
		// `--fix` STRIPS unused directives (default `warn`). Those directives are
		// real under the main config; turning the report off stops the fix pass
		// from ever removing an `eslint-disable` comment.
		linterOptions: { reportUnusedDisableDirectives: 'off' },
		// Register the main config's plugin set so inline `eslint-disable`
		// directives for those plugins RESOLVE (an unregistered plugin makes
		// ESLint fail the file with "Definition for rule not found"). Registering
		// a plugin does NOT enable its rules — only the allowlist below is on, so
		// --fix still touches nothing outside it.
		plugins: {
			'@typescript-eslint': tseslint.plugin,
			boundaries: eslintPluginBoundaries,
			import: eslintPluginImport,
			functional: eslintPluginFunctional,
			unicorn: eslintPluginUnicorn,
			sonarjs: eslintPluginSonarJS,
			security: eslintPluginSecurity,
		},
		languageOptions: {
			// parse-only: none of the allowlisted fixers are type-aware, so no
			// tsconfig project is needed (keeps the fix pass fast).
			parser: tseslint.parser,
			parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
		},
		settings: {
			'import/resolver': { typescript: { alwaysTryTypes: true } },
		},
		rules: {
			// Mirrors Zone 2b's import/order so the fix matches the gate's intent.
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
			'prefer-const': 'error',
			'object-shorthand': 'error',
			'prefer-template': 'error',
			'arrow-body-style': ['error', 'never'],
		},
	},
];
