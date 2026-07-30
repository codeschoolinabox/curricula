/**
 * Condense `git status --porcelain` output to a foreign-dirt line list —
 * each non-empty line VERBATIM. Porcelain v1 is fixed-width: the two-char
 * XY status code occupies positions 0-1, so staged-only (`M `) and
 * worktree-only (` M`) entries stay distinct — nothing reflows the line.
 * The oracle reports ALL dirt: which of it is yours is the reader's proof
 * burden ("working tree not yours until proven").
 *
 * @param {string} porcelain
 * @returns {string[]}
 */
export default function condenseForeignDirt(porcelain) {
	return porcelain.split('\n').filter((line) => line.trim() !== '');
}
