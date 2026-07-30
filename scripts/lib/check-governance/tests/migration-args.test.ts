import { describe, expect, it } from 'vitest';
import parseMigrationArgs from '../migration-args.mjs';

describe('parseMigrationArgs', () => {
	it('splits source and ref on the at-sign', () => {
		expect(parseMigrationArgs(['DEV.md@HEAD', 'a.md'])).toEqual({
			sourcePath: 'DEV.md',
			ref: 'HEAD',
			destinations: ['a.md'],
		});
	});

	it('splits on the LAST at-sign for paths containing one', () => {
		expect(parseMigrationArgs(['we@ird.md@abc123', 'a.md'])).toEqual({
			sourcePath: 'we@ird.md',
			ref: 'abc123',
			destinations: ['a.md'],
		});
	});

	it('keeps every destination in order', () => {
		expect(
			parseMigrationArgs(['S.md@HEAD', 'a.md', 'b.md']).destinations,
		).toEqual(['a.md', 'b.md']);
	});

	it('throws on empty args', () => {
		expect(() => parseMigrationArgs([])).toThrow();
	});

	it('throws on a source spec without a ref', () => {
		expect(() => parseMigrationArgs(['DEV.md', 'a.md'])).toThrow();
	});

	it('throws on an empty ref after the at-sign', () => {
		expect(() => parseMigrationArgs(['a.md@', 'x.md'])).toThrow();
	});

	it('throws with no destinations', () => {
		expect(() => parseMigrationArgs(['DEV.md@HEAD'])).toThrow();
	});

	it('splits a reflog-style ref at its last at-sign, a documented limitation', () => {
		expect(parseMigrationArgs(['a.md@HEAD@{1}', 'x.md'])).toEqual({
			sourcePath: 'a.md@HEAD',
			ref: '{1}',
			destinations: ['x.md'],
		});
	});
});
