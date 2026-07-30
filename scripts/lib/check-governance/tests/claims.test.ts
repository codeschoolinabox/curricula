import { describe, expect, it } from 'vitest';
import checkClaims from '../claims.mjs';
import parseDocument from '../parse.mjs';

function snapshot(overrides = {}) {
	return {
		npmScripts: [],
		binTools: [],
		existingPaths: new Set<string>(),
		headingsByPath: {},
		matchingGlobs: new Set<string>(),
		ignoredPaths: new Set<string>(),
		...overrides,
	};
}

function parsed(path: string, content: string) {
	return [parseDocument({ path, content })];
}

describe('checkClaims', () => {
	it('reports nothing for a document with no tokens', () => {
		const docs = parsed('A.md', '# Title\nplain prose\n');
		expect(checkClaims(docs, snapshot())).toEqual([]);
	});

	it('ignores a token that is neither command nor path shaped', () => {
		const docs = parsed('A.md', 'the word `verbatim` is prose\n');
		expect(checkClaims(docs, snapshot())).toEqual([]);
	});

	it('accepts an npm script that exists', () => {
		const docs = parsed('A.md', 'run `npm run lint` first\n');
		const snap = snapshot({ npmScripts: ['lint'] });
		expect(checkClaims(docs, snap)).toEqual([]);
	});

	it('reads only the first word after npm run as the script name', () => {
		const docs = parsed('A.md', 'scope it: `npm run test:unit scripts/`\n');
		const snap = snapshot({
			npmScripts: ['test:unit'],
			existingPaths: new Set(['scripts']),
		});
		expect(checkClaims(docs, snap)).toEqual([]);
	});

	it('reads only the first word after npx as the tool name', () => {
		const docs = parsed('A.md', 'check with `npx tsc --noEmit`\n');
		const snap = snapshot({ binTools: ['tsc'] });
		expect(checkClaims(docs, snap)).toEqual([]);
	});

	it('reports the historical npm-run-docs rot as an error', () => {
		const docs = parsed(
			'AGENTS.md',
			'- API documentation generated to `docs/` via `npm run docs`\n',
		);
		expect(checkClaims(docs, snapshot())).toContainEqual({
			path: 'AGENTS.md',
			line: 1,
			check: 'claims',
			severity: 'error',
			message: expect.stringContaining('npm run docs'),
		});
	});

	it('accepts an npx tool that exists in bin', () => {
		const docs = parsed('A.md', 'use `npx eslint` here\n');
		const snap = snapshot({ binTools: ['eslint'] });
		expect(checkClaims(docs, snap)).toEqual([]);
	});

	it('reports an npx tool missing from bin as an error', () => {
		const docs = parsed('A.md', 'use `npx typedoc` here\n');
		expect(checkClaims(docs, snapshot())).toEqual([
			{
				path: 'A.md',
				line: 1,
				check: 'claims',
				severity: 'error',
				message: expect.stringContaining('typedoc'),
			},
		]);
	});

	it('accepts an infrastructure path that exists', () => {
		const docs = parsed('scripts/A.md', 'see `./DOCS.md` for the sketch\n');
		const snap = snapshot({ existingPaths: new Set(['scripts/DOCS.md']) });
		expect(checkClaims(docs, snap)).toEqual([]);
	});

	it('reports a missing dot-relative path resolved from the document directory', () => {
		const docs = parsed('scripts/A.md', 'see `./GONE.md` for nothing\n');
		expect(checkClaims(docs, snapshot())).toEqual([
			expect.objectContaining({
				severity: 'error',
				message: expect.stringContaining('scripts/GONE.md'),
			}),
		]);
	});

	it('reports a missing dot-claude path as an error', () => {
		const docs = parsed('A.md', 'the hook at `.claude/hooks/gone.py` fires\n');
		expect(checkClaims(docs, snapshot())).toEqual([
			expect.objectContaining({ severity: 'error' }),
		]);
	});

	it('downgrades a missing gitignored target to advisory', () => {
		const docs = parsed(
			'A.md',
			'the cache at `.claude/cache/repo-facts.json` is machine-generated\n',
		);
		const snap = snapshot({
			ignoredPaths: new Set(['.claude/cache/repo-facts.json']),
		});
		expect(checkClaims(docs, snap)).toEqual([
			expect.objectContaining({
				severity: 'advisory',
				message: expect.stringContaining('gitignored'),
			}),
		]);
	});

	it('downgrades a missing gitignored dot-relative target to advisory', () => {
		const docs = parsed(
			'scripts/A.md',
			'the cache at `./cache/tmp.json` is machine-generated\n',
		);
		const snap = snapshot({
			ignoredPaths: new Set(['scripts/cache/tmp.json']),
		});
		expect(checkClaims(docs, snap)).toEqual([
			expect.objectContaining({
				severity: 'advisory',
				message: expect.stringContaining('gitignored'),
			}),
		]);
	});

	it('downgrades a missing gitignored unprefixed target to advisory', () => {
		const docs = parsed(
			'scripts/A.md',
			'artifacts land in `lib/cache/tmp.json` between runs\n',
		);
		const snap = snapshot({
			ignoredPaths: new Set(['scripts/lib/cache/tmp.json']),
		});
		expect(checkClaims(docs, snap)).toEqual([
			expect.objectContaining({
				severity: 'advisory',
				message: expect.stringContaining('gitignored'),
			}),
		]);
	});

	it('reports a missing unprefixed path landing in infrastructure as an error', () => {
		const docs = parsed('scripts/A.md', 'typedefs in `lib/gone/types.mjs`\n');
		expect(checkClaims(docs, snapshot())).toEqual([
			expect.objectContaining({
				severity: 'error',
				message: expect.stringContaining('scripts/lib/gone/types.mjs'),
			}),
		]);
	});

	it('reports a missing content-tree path as advisory', () => {
		const docs = parsed('A.md', 'the module at `src/lib/gone/index.ts`\n');
		expect(checkClaims(docs, snapshot())).toEqual([
			expect.objectContaining({ severity: 'advisory' }),
		]);
	});

	it('accepts a root doc name that exists', () => {
		const docs = parsed('A.md', 'read `DEV.md` next\n');
		const snap = snapshot({ existingPaths: new Set(['DEV.md']) });
		expect(checkClaims(docs, snap)).toEqual([]);
	});

	it('reports a missing bare doc name as advisory', () => {
		const docs = parsed('A.md', 'read `GONE-GUIDE.md` next\n');
		expect(checkClaims(docs, snapshot())).toEqual([
			expect.objectContaining({ severity: 'advisory' }),
		]);
	});

	it('accepts a bare filename that exists at the repo root', () => {
		const docs = parsed('scripts/README.md', 'scripts in `package.json`\n');
		const snap = snapshot({ existingPaths: new Set(['package.json']) });
		expect(checkClaims(docs, snap)).toEqual([]);
	});

	it('accepts an existing unprefixed path resolved from the document directory', () => {
		const docs = parsed('scripts/A.md', 'typedefs in `lib/types.mjs`\n');
		const snap = snapshot({
			existingPaths: new Set(['scripts/lib/types.mjs']),
		});
		expect(checkClaims(docs, snap)).toEqual([]);
	});

	it('passes an existing content-tree path silently', () => {
		const docs = parsed('A.md', 'the module at `src/lib/utils/index.ts`\n');
		const snap = snapshot({
			existingPaths: new Set(['src/lib/utils/index.ts']),
		});
		expect(checkClaims(docs, snap)).toEqual([]);
	});

	it('skips bare convention nouns', () => {
		const docs = parsed(
			'DEV.md',
			'every directory has a `README.md` and a `DOCS.md`; types in `types.ts`, suites in `tests/`\n',
		);
		expect(checkClaims(docs, snapshot())).toEqual([]);
	});

	it('ignores eslint-rule-shaped tokens as neither command nor path', () => {
		const docs = parsed('DEV.md', 'disable `import/order` here\n');
		expect(checkClaims(docs, snapshot())).toEqual([]);
	});

	it('skips leading-slash tokens', () => {
		const docs = parsed(
			'HUMANS.md',
			'run `/clear` first; shorthand like `/src/index.ts` is a route\n',
		);
		expect(checkClaims(docs, snapshot())).toEqual([]);
	});

	it('skips bare prefixes standing alone as syntax', () => {
		const docs = parsed(
			'scripts/README.md',
			'prefixes are `./` and `../`; git magic `:/`; a lone `scripts/`\n',
		);
		expect(checkClaims(docs, snapshot())).toEqual([]);
	});

	it('resolves the utils alias against its real target', () => {
		const docs = parsed(
			'.claude/agents/ar-4.md',
			'check the `@utils/` import alias and `@utils/freeze.js`\n',
		);
		const snap = snapshot({
			existingPaths: new Set(['src/lib/utils', 'src/lib/utils/freeze.js']),
		});
		expect(checkClaims(docs, snap)).toEqual([]);
	});

	it('reports a broken utils-alias claim as an error', () => {
		const docs = parsed('DEV.md', 'import from `@utils/gone.js`\n');
		expect(checkClaims(docs, snapshot())).toEqual([
			expect.objectContaining({
				severity: 'error',
				message: expect.stringContaining('src/lib/utils/gone.js'),
			}),
		]);
	});

	it('ignores dotted API references without file extensions', () => {
		const docs = parsed(
			'DEV.md',
			'use `Object.freeze` and `hookSpecificOutput.permissionDecision`; ranges like `baseline..HEAD`\n',
		);
		expect(checkClaims(docs, snapshot())).toEqual([]);
	});

	it('ignores code-snippet words outside the path charset', () => {
		const docs = parsed(
			'DEV.md',
			"mocking via `vi.mock('./sibling')` is a smell\n",
		);
		expect(checkClaims(docs, snapshot())).toEqual([]);
	});

	it('resolves shell-invocation dot-slash forms from the repo root', () => {
		const docs = parsed(
			'.claude/hooks/README.md',
			'invoke `./node_modules/.bin/eslint` directly\n',
		);
		const snap = snapshot({
			existingPaths: new Set(['node_modules/.bin/eslint']),
		});
		expect(checkClaims(docs, snap)).toEqual([]);
	});

	it('skips bare glob patterns with no directory', () => {
		const docs = parsed('scripts/README.md', 'every root `*.md` is corpus\n');
		expect(checkClaims(docs, snapshot())).toEqual([]);
	});

	it('does not double-report an extension-shaped npm script name', () => {
		const docs = parsed('A.md', 'run `npm run report.md` last\n');
		expect(checkClaims(docs, snapshot())).toEqual([
			expect.objectContaining({
				severity: 'error',
				message: expect.stringContaining('npm run report.md'),
			}),
		]);
	});

	it('ignores a bare extension naming a file type', () => {
		const docs = parsed(
			'scripts/README.md',
			'eslint covers code and `.mdx`; suites end `.test.ts`\n',
		);
		expect(checkClaims(docs, snapshot())).toEqual([]);
	});

	it('accepts a git verb named in the AGENTS allowed list', () => {
		const content = [
			'**Allowed** (read-only and additive):',
			'',
			'- `git status`, `git diff`',
			'',
			'**Forbidden** (the human runs these):',
			'',
			'- `git push`',
			'',
			'## Elsewhere',
			'',
			'run `git diff` before committing\n',
		].join('\n');
		expect(checkClaims(parsed('AGENTS.md', content), snapshot())).toEqual([]);
	});

	it('reports a git verb absent from the AGENTS lists as an error', () => {
		const content = [
			'**Allowed** (read-only and additive):',
			'',
			'- `git status`',
			'',
			'**Forbidden** (the human runs these):',
			'',
			'- `git push`',
			'',
			'## Elsewhere',
			'',
			'run `git bisect` when stuck\n',
		].join('\n');
		expect(checkClaims(parsed('AGENTS.md', content), snapshot())).toEqual([
			expect.objectContaining({
				severity: 'error',
				message: expect.stringContaining('bisect'),
			}),
		]);
	});

	it('leaves git tokens in non-AGENTS documents alone', () => {
		const docs = parsed('DEV.md', 'run `git bisect` when stuck\n');
		expect(checkClaims(docs, snapshot())).toEqual([]);
	});

	it('matches git verbs at verb level, not whole tokens', () => {
		const content = [
			'**Allowed** (read-only and additive):',
			'',
			'- `git rev-parse`',
			'',
			'**Forbidden** (the human runs these):',
			'',
			'- `git push`',
			'',
			'## Elsewhere',
			'',
			'record `git rev-parse HEAD` at approval\n',
		].join('\n');
		expect(checkClaims(parsed('AGENTS.md', content), snapshot())).toEqual([]);
	});

	it('enforces git verbs in AGENTS.principal.md too', () => {
		const content = [
			'**Allowed** (read-only and additive):',
			'',
			'- `git status`',
			'',
			'**Forbidden** (the human runs these):',
			'',
			'- `git push`',
			'',
			'## Elsewhere',
			'',
			'run `git cherry-pick` maybe\n',
		].join('\n');
		expect(
			checkClaims(parsed('AGENTS.principal.md', content), snapshot()),
		).toEqual([
			expect.objectContaining({
				severity: 'error',
				message: expect.stringContaining('cherry-pick'),
			}),
		]);
	});

	it('skips square-bracket placeholders like angle ones', () => {
		const docs = parsed('AGENTS.md', 'prompt with `git [command]` instead\n');
		expect(checkClaims(docs, snapshot())).toEqual([]);
	});

	it('skips tokens containing placeholders', () => {
		const docs = parsed(
			'A.md',
			'commit via `git commit -m "..." -- <paths>`\n',
		);
		expect(checkClaims(docs, snapshot())).toEqual([]);
	});

	it('skips home-directory paths', () => {
		const docs = parsed(
			'A.md',
			'the template at `~/.claude/AGENTS-template.md`\n',
		);
		expect(checkClaims(docs, snapshot())).toEqual([]);
	});

	it('skips a glob that matches at least one file', () => {
		const docs = parsed('A.md', 'agents live at `.claude/agents/*.md`\n');
		const snap = snapshot({ matchingGlobs: new Set(['.claude/agents/*.md']) });
		expect(checkClaims(docs, snap)).toEqual([]);
	});

	it('reports a glob matching nothing under the path rules', () => {
		const docs = parsed('A.md', 'agents live at `.claude/nowhere/*.md`\n');
		expect(checkClaims(docs, snapshot())).toEqual([
			expect.objectContaining({ severity: 'error' }),
		]);
	});

	it('checks real tokens inside a multi-word span and skips its placeholders', () => {
		const content =
			'run `node scripts/check-governance.mjs --migration <src>@<ref>`\n';
		const snap = snapshot({
			existingPaths: new Set(['scripts/check-governance.mjs']),
		});
		expect(checkClaims(parsed('A.md', content), snap)).toEqual([]);
	});

	it('downgrades findings in skills documents to advisory', () => {
		const docs = parsed(
			'.claude/skills/aran-weaving/SKILL.md',
			'the quarry at `.claude/hooks/gone.py`\n',
		);
		expect(checkClaims(docs, snapshot())).toEqual([
			expect.objectContaining({ severity: 'advisory' }),
		]);
	});

	it('attributes findings to the right document among several', () => {
		const docs = [
			...parsed('A.md', 'clean prose\n'),
			...parsed('B.md', 'use `npx typedoc` here\n'),
		];
		expect(checkClaims(docs, snapshot())).toEqual([
			expect.objectContaining({ path: 'B.md' }),
		]);
	});
});
