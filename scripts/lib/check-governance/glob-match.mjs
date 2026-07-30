/**
 * Minimal glob matching for corpus-mentioned patterns: `*` within a segment,
 * `**` across segments (zero or more, including none), `?` for one
 * character. Brace alternation is deliberately out of reach (see
 * scripts/DOCS.md § Constraints — a stated restriction).
 *
 * @param {string} pattern
 * @param {string} path
 * @returns {boolean}
 */
export default function globMatch(pattern, path) {
	return toRegex(pattern).test(path);
}

/**
 * @param {string} pattern
 * @returns {RegExp}
 */
function toRegex(pattern) {
	let source = '';
	for (let i = 0; i < pattern.length; i += 1) {
		const char = pattern[i];
		if (char === '*' && pattern[i + 1] === '*') {
			if (pattern[i + 2] === '/') {
				source += '(?:.*/)?';
				i += 2;
			} else {
				source += '.*';
				i += 1;
			}
		} else if (char === '*') {
			source += '[^/]*';
		} else if (char === '?') {
			source += '[^/]';
		} else {
			source += char.replace(/[.*+?^${}()|[\]\\]/, '\\$&');
		}
	}
	return new RegExp(`^${source}$`);
}
