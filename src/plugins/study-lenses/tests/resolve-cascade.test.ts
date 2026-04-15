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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it, onTestFinished } from 'vitest';

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

	it('repeat call with unchanged inputs → returns same frozen reference (cache hit)', () => {
		const fixture = path.join(FIXTURES_DIR, 'cache-hit');

		const first = resolveCascade(fixture, { contentRoot: fixture });
		const second = resolveCascade(fixture, { contentRoot: fixture });

		expect(second).toBe(first);
	});

	it('tracked lenses.json mtime changes → cache invalidated, new content applied', () => {
		// Copy fixture into tmpdir so we can safely mutate mtime + content.
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'study-lenses-A6-'));
		onTestFinished(() => fs.rmSync(tmpDir, { recursive: true, force: true }));
		fs.cpSync(path.join(FIXTURES_DIR, 'cache-hit'), tmpDir, {
			recursive: true,
		});

		const first = resolveCascade(tmpDir, { contentRoot: tmpDir });
		expect(first.defaults).toEqual({ js: 'study' });

		// Mutate the tracked file's content AND advance its mtime so the
		// resolver's revalidate phase detects the change. +5000 ms tolerates
		// coarse-granularity filesystems (FAT32 is 2s; HFS+ is 1s).
		const lensesPath = path.join(tmpDir, 'lenses.json');
		fs.writeFileSync(
			lensesPath,
			JSON.stringify({ defaults: { js: 'highlight' } }),
		);
		const future = new Date(Date.now() + 5000);
		fs.utimesSync(lensesPath, future, future);

		const second = resolveCascade(tmpDir, { contentRoot: tmpDir });

		expect(second).not.toBe(first);
		expect(second.defaults).toEqual({ js: 'highlight' });
	});

	it('same absDir under different contentRoot → distinct results (cache keyed by both)', () => {
		// Dedicated fixture (not two-level-cascade/) to avoid key collision
		// with A.3 — otherwise the wide-call here would be a cache hit on
		// A.3's pre-populated entry, not a fresh compute.
		const root = path.join(FIXTURES_DIR, 'contentroot-isolation');
		const chapter = path.join(root, 'chapter');

		const narrow = resolveCascade(chapter, { contentRoot: chapter });
		const wide = resolveCascade(chapter, { contentRoot: root });

		expect(narrow.lenses).toEqual({ study: { debug: false } });
		expect(wide.lenses).toEqual({ study: { ask: false, debug: false } });
	});

	it('new ancestor lenses.json appears → tracked set changes, cache invalidated', () => {
		// Two-level structure where the chapter directory initially has its
		// own lenses.json and the root has none. Resolving at chapter/ gives
		// only the chapter contributions. Then we add a lenses.json at root;
		// a subsequent resolve must see the expanded tracked set and fold
		// both files.
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'study-lenses-A6set-'));
		onTestFinished(() => fs.rmSync(tmpDir, { recursive: true, force: true }));
		const chapterDir = path.join(tmpDir, 'chapter');
		fs.mkdirSync(chapterDir);
		fs.writeFileSync(
			path.join(chapterDir, 'lenses.json'),
			JSON.stringify({ defaults: { js: 'highlight' } }),
		);

		const first = resolveCascade(chapterDir, { contentRoot: tmpDir });
		expect(first.exerciseSetPrefixes).toEqual([]);

		// A new ancestor lenses.json appears at the content root.
		fs.writeFileSync(
			path.join(tmpDir, 'lenses.json'),
			JSON.stringify({ exerciseSetPrefixes: ['sl-'] }),
		);

		const second = resolveCascade(chapterDir, { contentRoot: tmpDir });

		expect(second).not.toBe(first);
		expect(second.exerciseSetPrefixes).toEqual(['sl-']);
	});

	it('empty contentRoot → throws (prevents silent cwd aliasing before cache lands)', () => {
		expect(() =>
			resolveCascade('/some/abs/path', { contentRoot: '' }),
		).toThrow('contentRoot is required');
	});

	it('malformed lenses.json → throws with offending file path in message', () => {
		const fixture = path.join(FIXTURES_DIR, 'malformed-json');

		expect(() =>
			resolveCascade(fixture, { contentRoot: fixture }),
		).toThrow(/Malformed lenses\.json at .*malformed-json\/lenses\.json/);
	});

	it('lenses.json at root AND target but not intermediate → both files applied, no crash on missing intermediate', () => {
		const root = path.join(FIXTURES_DIR, 'boundary-gap');
		const page = path.join(root, 'chapter', 'page');

		const result = resolveCascade(page, { contentRoot: root });

		expect(result).toEqual({
			defaults: { js: 'study', py: 'study' },
			embedSiblings: DEFAULTS.embedSiblings,
			lenses: {},
			exerciseSetPrefixes: [],
		});
	});
});
