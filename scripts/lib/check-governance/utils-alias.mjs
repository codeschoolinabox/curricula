/**
 * The one recognized import alias: `@utils/<rest>` resolves against its real
 * tsconfig target. Shared by the claims check and the entry's Resolve phase
 * so the target can never drift between them.
 *
 * @param {string} word
 * @returns {string | null} The repo-relative target, or null when the word
 *   is not an alias reference.
 */
export default function resolveUtilsAlias(word) {
	if (!word.startsWith('@utils/')) return null;
	return `src/lib/utils/${word.slice('@utils/'.length)}`;
}
