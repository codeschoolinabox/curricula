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
});
