// Package-specific boundary rules for language-level-validator.
// Imported by root eslint.config.mjs — do not add plugins, base configs, or Prettier here.

export default {
	settings: {
		'boundaries/ignore': ['**/tests/**/*.ts'],
		'boundaries/elements': [
			{
				type: 'validator-src',
				pattern: 'src/lib/language-level-validator/**',
				mode: 'file',
			},
		],
	},
	rules: {
		'boundaries/element-types': [
			'error',
			{
				default: 'disallow',
				rules: [{ from: 'validator-src', allow: ['validator-src'] }],
			},
		],
		'boundaries/no-unknown': ['error'],
		'boundaries/no-unknown-files': ['error'],
	},
};
