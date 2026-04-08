// Package-specific boundary rules for sl-trace-js-aran-legacy.
// Imported by root eslint.config.mjs — do not add plugins, base configs, or Prettier here.
//
// Architecture: strict DAG
//   entry → record/verify/core/utils
//   record → record/core/utils
//   verify → verify/core/utils
//   core → core/utils
//   utils → utils

const PKG = 'src/lib/sl-trace-js-aran-legacy';

export default {
	settings: {
		'boundaries/ignore': ['**/tests/**/*.ts', '**/legacy-aran-trace/**'],
		'boundaries/elements': [
			{ type: 'trace-entry', pattern: `${PKG}/index.ts`, mode: 'file' },
			{
				type: 'trace-record',
				pattern: [`${PKG}/record.ts`, `${PKG}/record/**`],
				mode: 'file',
			},
			{
				type: 'trace-verify',
				pattern: [`${PKG}/verify-options.ts`, `${PKG}/verify-options/**`],
				mode: 'file',
			},
			{
				type: 'trace-core',
				pattern: [
					`${PKG}/id.ts`,
					`${PKG}/langs.ts`,
					`${PKG}/types.ts`,
					`${PKG}/options-schema.ts`,
					`${PKG}/*.schema.json`,
				],
				mode: 'file',
			},
			{ type: 'trace-utils', pattern: `${PKG}/utils/**`, mode: 'file' },
		],
	},
	rules: {
		'boundaries/element-types': [
			'error',
			{
				default: 'disallow',
				rules: [
					{
						from: 'trace-entry',
						allow: [
							'trace-record',
							'trace-verify',
							'trace-core',
							'trace-utils',
						],
					},
					{
						from: 'trace-record',
						allow: ['trace-record', 'trace-core', 'trace-utils'],
					},
					{
						from: 'trace-verify',
						allow: ['trace-verify', 'trace-core', 'trace-utils'],
					},
					{ from: 'trace-core', allow: ['trace-core', 'trace-utils'] },
					{ from: 'trace-utils', allow: ['trace-utils'] },
				],
			},
		],
		'boundaries/no-unknown': ['error'],
		'boundaries/no-unknown-files': ['error'],
	},
};
