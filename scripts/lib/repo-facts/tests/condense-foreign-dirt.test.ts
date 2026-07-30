import { describe, expect, it } from 'vitest';
import condenseForeignDirt from '../condense-foreign-dirt.mjs';

describe('condenseForeignDirt', () => {
	it('condenses empty porcelain output to no lines', () => {
		expect(condenseForeignDirt('')).toEqual([]);
	});

	it('keeps a single modified entry verbatim, status positions intact', () => {
		expect(condenseForeignDirt(' M .ls-lint.yml\n')).toEqual([
			' M .ls-lint.yml',
		]);
	});

	// PINNED(Wave-6 AR-4 2026-07-30: porcelain is fixed-width — staged-only
	// "M " and worktree-only " M" must render distinctly; trim+collapse
	// conflated them and destroyed the measurement's forensic value)
	it('keeps staged-only and worktree-only entries distinct', () => {
		const porcelain = 'M  staged-only.md\n M worktree-only.md\n';
		expect(condenseForeignDirt(porcelain)).toEqual([
			'M  staged-only.md',
			' M worktree-only.md',
		]);
	});

	it('keeps each of several mixed entries in order', () => {
		const porcelain = ' M a.md\n?? new-dir/\n D gone.md\n';
		expect(condenseForeignDirt(porcelain)).toEqual([
			' M a.md',
			'?? new-dir/',
			' D gone.md',
		]);
	});

	it('keeps a rename entry verbatim, both sides', () => {
		expect(condenseForeignDirt('R  old-name.md -> new-name.md\n')).toEqual([
			'R  old-name.md -> new-name.md',
		]);
	});

	it('keeps a quoted path with spaces verbatim', () => {
		expect(condenseForeignDirt('?? "a file with spaces.txt"\n')).toEqual([
			'?? "a file with spaces.txt"',
		]);
	});
});
