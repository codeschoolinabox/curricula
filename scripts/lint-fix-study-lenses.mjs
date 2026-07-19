/**
 * Scoped, allowlisted autofix for study-lenses/ — the runnable entry point for
 * eslint.fix.config.mjs (which documents WHY this is a separate, minimal config).
 *
 *   node scripts/lint-fix-study-lenses.mjs
 *
 * This is a MANUAL tool. It is NOT wired into husky/lint-staged — pre-commit
 * stays prettier-only. After it runs, REVIEW THE DIFF before staging: the fixers
 * are deterministic and semantics-preserving, but the whole point is automation
 * you can verify, not silent changes.
 */

import { spawnSync } from 'node:child_process';

const eslint = spawnSync(
	'node_modules/.bin/eslint',
	[
		'--config',
		'eslint.fix.config.mjs',
		'--fix',
		'src/lib/study-lenses/**/*.{ts,tsx}',
	],
	{ stdio: 'inherit' },
);

if (eslint.status === 0) {
	console.log(
		'\nautofix pass complete — review `git diff` before staging (pre-commit is prettier-only).',
	);
}

process.exit(eslint.status ?? 1);
