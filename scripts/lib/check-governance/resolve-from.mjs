/**
 * Resolve a relative reference against its document's directory, in
 * repo-relative posix form — the one resolution used by the links check, the
 * claims check, and the entry's Resolve phase.
 *
 * @param {string} docPath
 * @param {string} relative
 * @returns {string}
 */
export default function resolveFrom(docPath, relative) {
	const lastSlash = docPath.lastIndexOf('/');
	const docDir = lastSlash === -1 ? [] : docPath.slice(0, lastSlash).split('/');
	const segments = [...docDir];
	for (const piece of relative.split('/')) {
		if (piece === '' || piece === '.') continue;
		if (piece === '..') {
			segments.pop();
			continue;
		}
		segments.push(piece);
	}
	return segments.join('/');
}
