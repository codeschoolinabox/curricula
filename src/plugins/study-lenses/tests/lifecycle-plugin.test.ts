/**
 * @file Unit tests for the Docusaurus lifecycle plugin.
 *
 * The plugin's only responsibility is computing watched-path globs
 * from `siteDir` + `contentRoots`. No filesystem I/O in the plugin
 * itself, so tests work purely against synthetic inputs.
 */

import { describe, expect, it } from 'vitest';

import createStudyLensesPlugin from '../lifecycle-plugin.js';

describe('createStudyLensesPlugin', () => {
	it('single contentRoot → two globs (lenses.json + *.js)', () => {
		const plugin = createStudyLensesPlugin(
			{ siteDir: '/site' },
			{ contentRoots: ['docs'] },
		);

		expect(plugin.getPathsToWatch()).toEqual([
			'/site/docs/**/lenses.json',
			'/site/docs/**/*.js',
		]);
	});

	it('multiple contentRoots → two globs each, in order', () => {
		const plugin = createStudyLensesPlugin(
			{ siteDir: '/site' },
			{ contentRoots: ['welcome', 'sandbox'] },
		);

		expect(plugin.getPathsToWatch()).toEqual([
			'/site/welcome/**/lenses.json',
			'/site/welcome/**/*.js',
			'/site/sandbox/**/lenses.json',
			'/site/sandbox/**/*.js',
		]);
	});
});
