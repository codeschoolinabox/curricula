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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it, onTestFinished } from 'vitest';

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

	it('.js with malformed @study-lens JSON body → walker throws with file path', () => {
		const fixture = path.join(FIXTURES_DIR, 'file-override-malformed-json');
		const config = {
			...DEFAULTS,
			embedSiblings: { ...DEFAULTS.embedSiblings, mode: 'tabs' as const },
			defaults: { js: 'study' },
		};

		expect(() => discoverSiblings(fixture, config)).toThrow(
			/Malformed @study-lens config JSON in .*bad\.js/,
		);
	});

	it('.js with multi-line JSDoc @study-lens + JSON body → lens and lensConfig both set', () => {
		const fixture = path.join(FIXTURES_DIR, 'file-override-with-config');
		const config = {
			...DEFAULTS,
			embedSiblings: { ...DEFAULTS.embedSiblings, mode: 'tabs' as const },
			defaults: { js: 'study' },
		};

		const result = discoverSiblings(fixture, config);

		expect(result).toHaveLength(1);
		expect(result[0]?.lens).toBe('parsons');
		expect(result[0]?.lensConfig).toEqual({ distractors: 4 });
	});

	it('.js with // @study-lens <name> directive → sibling lens overrides cascade default', () => {
		const fixture = path.join(FIXTURES_DIR, 'file-override-name-only');
		const config = {
			...DEFAULTS,
			embedSiblings: { ...DEFAULTS.embedSiblings, mode: 'tabs' as const },
			defaults: { js: 'study' },
		};

		const result = discoverSiblings(fixture, config);

		expect(result).toHaveLength(1);
		expect(result[0]?.lens).toBe('parsons');
		expect(result[0]?.lensConfig).toBeUndefined();
	});

	it('safety exclusions: skips node_modules, hidden dirs, and does not follow symlinks', () => {
		// Dynamic fixture — symlinks don't travel cleanly through git.
		const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'study-lenses-B11-'));
		onTestFinished(() =>
			fs.rmSync(tmp, { recursive: true, force: true }),
		);

		fs.writeFileSync(path.join(tmp, 'kept.js'), '// kept');
		fs.mkdirSync(path.join(tmp, 'node_modules'));
		fs.writeFileSync(path.join(tmp, 'node_modules', 'junk.js'), '// skip');
		fs.mkdirSync(path.join(tmp, '.hidden'));
		fs.writeFileSync(path.join(tmp, '.hidden', 'junk.js'), '// skip');

		// Symlink pointing at an external directory that ALSO has a .js file.
		const symTarget = fs.mkdtempSync(
			path.join(os.tmpdir(), 'study-lenses-B11-target-'),
		);
		onTestFinished(() =>
			fs.rmSync(symTarget, { recursive: true, force: true }),
		);
		fs.writeFileSync(
			path.join(symTarget, 'via-symlink.js'),
			'// should not be followed',
		);
		fs.symlinkSync(symTarget, path.join(tmp, 'sym-link'), 'dir');

		const config = {
			...DEFAULTS,
			embedSiblings: { ...DEFAULTS.embedSiblings, mode: 'tabs' as const },
			defaults: { js: 'study' },
		};

		const result = discoverSiblings(tmp, config);

		expect(result.map((s) => s.label)).toEqual(['kept']);
	});

	it('empty ignorePrefixes → no subtree skipped on prefix grounds', () => {
		const fixture = path.join(FIXTURES_DIR, 'ignore-prefix');
		const config = {
			...DEFAULTS,
			embedSiblings: {
				...DEFAULTS.embedSiblings,
				mode: 'tabs' as const,
				ignorePrefixes: [],
			},
			defaults: { js: 'study' },
		};

		const result = discoverSiblings(fixture, config);

		expect(result.map((s) => s.label).sort()).toEqual([
			'keep',
			'staging-wip/drop',
		]);
	});

	it('multiple ignorePrefixes match their respective subtrees', () => {
		const fixture = path.join(FIXTURES_DIR, 'multiple-prefixes');
		const config = {
			...DEFAULTS,
			embedSiblings: {
				...DEFAULTS.embedSiblings,
				mode: 'tabs' as const,
				ignorePrefixes: ['a-', 'b-'],
			},
			defaults: { js: 'study' },
		};

		const result = discoverSiblings(fixture, config);

		expect(result.map((s) => s.label)).toEqual(['kept']);
	});

	it('ignorePrefixes skips a whole subtree whose dirname starts with a listed prefix', () => {
		const fixture = path.join(FIXTURES_DIR, 'ignore-prefix');
		const config = {
			...DEFAULTS,
			embedSiblings: {
				...DEFAULTS.embedSiblings,
				mode: 'tabs' as const,
				ignorePrefixes: ['staging-'],
			},
			defaults: { js: 'study' },
		};

		const result = discoverSiblings(fixture, config);

		expect(result.map((s) => s.label)).toEqual(['keep']);
	});

	it('nested subdir with its own README.md → descent halts, subpage files excluded', () => {
		const fixture = path.join(FIXTURES_DIR, 'page-boundary');
		const config = {
			...DEFAULTS,
			embedSiblings: { ...DEFAULTS.embedSiblings, mode: 'tabs' as const },
			defaults: { js: 'study' },
		};

		const result = discoverSiblings(fixture, config);

		expect(result.map((s) => s.label)).toEqual(['here']);
	});

	it('multiple .js at mixed depths → sorted alphabetically, subpath-disambiguated labels', () => {
		const fixture = path.join(FIXTURES_DIR, 'many-mixed-depths');
		const config = {
			...DEFAULTS,
			embedSiblings: { ...DEFAULTS.embedSiblings, mode: 'tabs' as const },
			defaults: { js: 'study' },
		};

		const result = discoverSiblings(fixture, config);

		expect(result.map((s) => s.label)).toEqual([
			'a',
			'exercises/a',
			'exercises/b',
		]);
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
