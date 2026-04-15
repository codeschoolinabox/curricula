/**
 * @file Unit tests for the cascade resolver.
 *
 * Fixtures under `./fixtures/` are on-disk directory trees — each
 * test points at a dedicated fixture so the preconditions (presence
 * / absence of `lenses.json` files, file contents, mtimes) are
 * visible without mocking `node:fs`. Tests that need to mutate
 * filesystem state (A.6 cache-invalidation) clone a fixture into
 * `os.tmpdir()` first so the repo tree stays immutable.
 */

import path from 'node:path';

import { describe, expect, it } from 'vitest';

import DEFAULTS from '../defaults.js';
import resolveCascade from '../resolve-cascade.js';

const FIXTURES_DIR = path.resolve(import.meta.dirname, 'fixtures');

describe('resolveCascade', () => {
	it('target equals contentRoot with no lenses.json → resolved config equals DEFAULTS', () => {
		const fixture = path.join(FIXTURES_DIR, 'no-lenses-json');

		const result = resolveCascade(fixture, { contentRoot: fixture });

		expect(result).toEqual(DEFAULTS);
	});

	it('single lenses.json at contentRoot → its one field applied, unspecified fields fall back to DEFAULTS', () => {
		const fixture = path.join(FIXTURES_DIR, 'single-level');

		const result = resolveCascade(fixture, { contentRoot: fixture });

		expect(result).toEqual({
			defaults: { js: 'study' },
			embedSiblings: DEFAULTS.embedSiblings,
			lenses: {},
			exerciseSetPrefixes: [],
		});
	});

	it('two-level cascade: child defaults replaces root; child lenses.X.key deep-merges with root lenses.X.key', () => {
		const root = path.join(FIXTURES_DIR, 'two-level-cascade');
		const chapter = path.join(root, 'chapter');

		const result = resolveCascade(chapter, { contentRoot: root });

		expect(result).toEqual({
			defaults: { js: 'highlight' },
			embedSiblings: DEFAULTS.embedSiblings,
			lenses: { study: { ask: false, debug: false } },
			exerciseSetPrefixes: [],
		});
	});
});
