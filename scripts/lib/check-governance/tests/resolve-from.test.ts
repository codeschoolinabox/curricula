import { describe, expect, it } from 'vitest';
import resolveFrom from '../resolve-from.mjs';

describe('resolveFrom', () => {
	it('resolves a bare name from a root document to the root', () => {
		expect(resolveFrom('DEV.md', 'AGENTS.md')).toBe('AGENTS.md');
	});

	it('resolves a dot-relative name from a subdirectory document', () => {
		expect(resolveFrom('scripts/A.md', './B.md')).toBe('scripts/B.md');
	});

	it('resolves a parent reference out of the document directory', () => {
		expect(resolveFrom('scripts/A.md', '../DEV.md')).toBe('DEV.md');
	});

	it('resolves nested parents across several segments', () => {
		expect(resolveFrom('.claude/skills/x/SKILL.md', '../../README.md')).toBe(
			'.claude/README.md',
		);
	});

	it('keeps deeper unprefixed paths under the document directory', () => {
		expect(resolveFrom('scripts/README.md', 'lib/types.mjs')).toBe(
			'scripts/lib/types.mjs',
		);
	});
});
