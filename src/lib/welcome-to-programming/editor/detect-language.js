/**
 * Language detection for multi-language editor support.
 *
 * Pure utility — maps file extensions to language identifiers.
 *
 * @module detect-language
 */

// Maps file extensions (with and without dot) to language identifiers.
// Both forms are stored so callers don't need to normalize.
const LANGUAGE_MAP = Object.freeze({
	'.js': 'javascript',
	js: 'javascript',
	'.mjs': 'javascript',
	mjs: 'javascript',
	'.jsx': 'javascript',
	jsx: 'javascript',
	'.ts': 'typescript',
	ts: 'typescript',
	'.tsx': 'typescript',
	tsx: 'typescript',
	'.py': 'python',
	py: 'python',
	'.pyx': 'python',
	pyx: 'python',
	'.html': 'html',
	html: 'html',
	'.htm': 'html',
	htm: 'html',
	'.css': 'css',
	css: 'css',
	'.scss': 'css',
	scss: 'css',
	'.sass': 'css',
	sass: 'css',
	'.md': 'markdown',
	md: 'markdown',
	'.markdown': 'markdown',
	markdown: 'markdown',
	'.json': 'json',
	json: 'json',
	'.qasm': 'openqasm2',
	qasm: 'openqasm2',
	'.xml': 'xml',
	xml: 'xml',
	'.yaml': 'yaml',
	yaml: 'yaml',
	'.yml': 'yaml',
	yml: 'yaml',
});

/**
 * Detect language from a file object with an `ext` property.
 *
 * @param {{ ext?: string }} [file={}] - File metadata
 * @returns {string} Language identifier (e.g. 'javascript', 'python', 'plaintext')
 */
function detectLanguage({ ext } = {}) {
	if (!ext) return 'plaintext';

	return LANGUAGE_MAP[ext.toLowerCase()] || 'plaintext';
}

export default detectLanguage;
