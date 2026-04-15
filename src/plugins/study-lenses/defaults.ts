/**
 * @file Runtime baseline for `ResolvedConfig`.
 *
 * The cascade resolver starts from this constant and folds any
 * `lenses.json` contributions on top. Authors may override any field
 * at any level of the cascade; unmentioned fields retain their
 * baselines here.
 *
 * @remarks The baseline intentionally opts **nothing** in. No language
 * is configured (`defaults: {}`), embedding is off, no lens has any
 * config, and no exercise-set prefixes are recognized. A site that
 * wants any of this behavior must say so explicitly in a `lenses.json`
 * file — typically at the docs-instance content root.
 */

import { freezeInPlace } from '../../lib/utils/freeze.js';

import type { ResolvedConfig } from './types.js';

const DEFAULTS: ResolvedConfig = freezeInPlace({
	defaults: {},
	embedSiblings: {
		mode: 'off',
		ignorePrefixes: [],
		sectionHeading: null,
	},
	lenses: {},
	exerciseSetPrefixes: [],
});

export default DEFAULTS;
