/**
 * @file Unit tests for the sibling walker.
 *
 * Fixtures under `./fixtures/discover-siblings/` are on-disk directory
 * trees — each test points at a dedicated fixture so the preconditions
 * (presence of `.js` files, sibling-bearing pages, ignore-prefixed
 * subdirs, etc.) are visible without mocking `node:fs`. Tests that
 * need to mutate filesystem state clone a fixture into `os.tmpdir()`
 * first so the repo tree stays immutable.
 */

import path from 'node:path';

import { describe, expect, it } from 'vitest';

import DEFAULTS from '../defaults.js';
import discoverSiblings from '../discover-siblings.js';

const FIXTURES_DIR = path.resolve(
	import.meta.dirname,
	'fixtures',
	'discover-siblings',
);

describe('discoverSiblings', () => {
	it('embedSiblings.mode === "off" → frozen []', () => {
		const result = discoverSiblings(FIXTURES_DIR, DEFAULTS);

		expect(result).toEqual([]);
	});

	it('mode !== "off" but no .js files anywhere under pageDir → frozen []', () => {
		const fixture = path.join(FIXTURES_DIR, 'no-js-files');
		const config = {
			...DEFAULTS,
			embedSiblings: { ...DEFAULTS.embedSiblings, mode: 'tabs' as const },
			defaults: { js: 'study' },
		};

		const result = discoverSiblings(fixture, config);

		expect(result).toEqual([]);
	});

	it('.js files exist but config.defaults.js is unset → frozen [] (configured-languages rule)', () => {
		const fixture = path.join(FIXTURES_DIR, 'has-js-no-defaults');
		const config = {
			...DEFAULTS,
			embedSiblings: { ...DEFAULTS.embedSiblings, mode: 'tabs' as const },
		};

		const result = discoverSiblings(fixture, config);

		expect(result).toEqual([]);
	});

	it('single .js in a subdirectory → one Sibling with relative-path label', () => {
		const fixture = path.join(FIXTURES_DIR, 'single-js-in-subdir');
		const config = {
			...DEFAULTS,
			embedSiblings: { ...DEFAULTS.embedSiblings, mode: 'tabs' as const },
			defaults: { js: 'study' },
		};

		const result = discoverSiblings(fixture, config);

		expect(result).toEqual([
			{
				absPath: path.join(fixture, 'exercises', 'foo.js'),
				label: 'exercises/foo',
				code: "'use strict';\nalert('foo');\n",
				lang: 'js',
				lens: 'study',
			},
		]);
	});

	it('single .js directly in pageDir + defaults.js configured → one Sibling', () => {
		const fixture = path.join(FIXTURES_DIR, 'single-js-in-pagedir');
		const config = {
			...DEFAULTS,
			embedSiblings: { ...DEFAULTS.embedSiblings, mode: 'tabs' as const },
			defaults: { js: 'study' },
		};

		const result = discoverSiblings(fixture, config);

		expect(result).toEqual([
			{
				absPath: path.join(fixture, 'greeting.js'),
				label: 'greeting',
				code: "'use strict';\n\nlet name = prompt('what is your name?');\nalert('hello ' + name);\n",
				lang: 'js',
				lens: 'study',
			},
		]);
	});
});
