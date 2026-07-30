import { describe, expect, it } from 'vitest';
import globMatch from '../glob-match.mjs';

describe('globMatch', () => {
	it('matches a literal path exactly', () => {
		expect(globMatch('DEV.md', 'DEV.md')).toBe(true);
	});

	it('matches a single-star within one segment', () => {
		expect(globMatch('.claude/agents/*.md', '.claude/agents/ar-1.md')).toBe(
			true,
		);
	});

	it('does not cross a slash with a single star', () => {
		expect(globMatch('.claude/agents/*.md', '.claude/agents/x/y.md')).toBe(
			false,
		);
	});

	it('crosses directories with a double star', () => {
		expect(globMatch('**/*.md', 'a/b/c.md')).toBe(true);
	});

	it('matches a root file with a leading double star', () => {
		expect(globMatch('**/*.md', 'README.md')).toBe(true);
	});

	it('matches zero intervening directories after a prefixed double star', () => {
		expect(globMatch('.claude/**/*.md', '.claude/README.md')).toBe(true);
	});

	it('matches a shallow file under a bare trailing double star', () => {
		expect(globMatch('.claude/**', '.claude/README.md')).toBe(true);
	});

	it('matches a deep file under a bare trailing double star', () => {
		expect(globMatch('.claude/**', '.claude/agents/ar-1.md')).toBe(true);
	});

	it('keeps a bare trailing double star inside its own directory', () => {
		expect(globMatch('.claude/**', 'scripts/README.md')).toBe(false);
	});

	it('does not expand brace-alternation groups, a documented limitation', () => {
		expect(globMatch('a/**/*.{ts,tsx}', 'a/b/c.tsx')).toBe(false);
	});

	it('matches one character with a question mark', () => {
		expect(globMatch('ar-?.md', 'ar-1.md')).toBe(true);
	});

	it('rejects a question mark spanning two characters', () => {
		expect(globMatch('ar-?.md', 'ar-10.md')).toBe(false);
	});

	it('escapes regex metacharacters in literals', () => {
		expect(globMatch('a.b', 'axb')).toBe(false);
	});
});
