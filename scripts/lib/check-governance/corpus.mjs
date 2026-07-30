import globMatch from './glob-match.mjs';

/**
 * The corpus classifier (scripts/README.md § Ubiquitous language): every
 * root `*.md` plus the infrastructure globs, MINUS a deny-list in which
 * every entry carries its reason. Pure classification only — the thin entry
 * owns the filesystem walk and the fail-closed checks.
 *
 * @param {string} path Repo-relative path.
 * @returns {boolean}
 */
export default function isCorpusPath(path) {
	if (DENY_LIST.some((denied) => denied.path === path)) return false;
	if (!path.endsWith('.md')) return false;
	if (!path.includes('/')) return true;
	return CORPUS_GLOBS.some((glob) => globMatch(glob, path));
}

const DENY_LIST = [
	{
		path: 'research-framing.md',
		reason: 'curriculum research orientation, not governance',
	},
];

const CORPUS_GLOBS = ['.claude/**/*.md', 'scripts/**/*.md'];
