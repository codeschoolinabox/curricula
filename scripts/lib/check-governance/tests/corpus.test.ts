import { describe, expect, it } from 'vitest';
import isCorpusPath from '../corpus.mjs';

describe('isCorpusPath', () => {
	it.each(['DEV.md', 'CLAUDE.md', 'HUMANS.md', 'AGENTS.md'])(
		'accepts root markdown %s',
		(path) => {
			expect(isCorpusPath(path)).toBe(true);
		},
	);

	it('rejects the reasoned deny-list entry', () => {
		expect(isCorpusPath('research-framing.md')).toBe(false);
	});

	it.each([
		'.claude/README.md',
		'.claude/agents/ar-1.md',
		'.claude/skills/aran-weaving/SKILL.md',
	])('accepts dot-claude markdown at any depth: %s', (path) => {
		expect(isCorpusPath(path)).toBe(true);
	});

	it.each(['scripts/README.md', 'scripts/DOCS.md'])(
		'accepts scripts markdown: %s',
		(path) => {
			expect(isCorpusPath(path)).toBe(true);
		},
	);

	it('rejects content-tree markdown', () => {
		expect(isCorpusPath('src/lib/utils/README.md')).toBe(false);
	});

	it('rejects non-markdown files everywhere', () => {
		expect(isCorpusPath('.claude/hooks/governance-guard.py')).toBe(false);
	});

	it('rejects nested root-looking paths', () => {
		expect(isCorpusPath('spiralearn/frogramming/README.md')).toBe(false);
	});
});
