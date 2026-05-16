import { describe, it, expect } from 'vitest';

import detectLanguage from '../detect-language.js';

describe('detectLanguage', () => {
	describe('dotted extensions', () => {
		it('returns javascript for .js', () => {
			expect(detectLanguage({ ext: '.js' })).toBe('javascript');
		});

		it('returns typescript for .ts', () => {
			expect(detectLanguage({ ext: '.ts' })).toBe('typescript');
		});

		it('returns python for .py', () => {
			expect(detectLanguage({ ext: '.py' })).toBe('python');
		});

		it('returns html for .html', () => {
			expect(detectLanguage({ ext: '.html' })).toBe('html');
		});

		it('returns css for .css', () => {
			expect(detectLanguage({ ext: '.css' })).toBe('css');
		});

		it('returns markdown for .md', () => {
			expect(detectLanguage({ ext: '.md' })).toBe('markdown');
		});

		it('returns json for .json', () => {
			expect(detectLanguage({ ext: '.json' })).toBe('json');
		});

		it('returns xml for .xml', () => {
			expect(detectLanguage({ ext: '.xml' })).toBe('xml');
		});

		it('returns yaml for .yaml', () => {
			expect(detectLanguage({ ext: '.yaml' })).toBe('yaml');
		});

		it('returns yaml for .yml', () => {
			expect(detectLanguage({ ext: '.yml' })).toBe('yaml');
		});

		it('returns openqasm2 for .qasm', () => {
			expect(detectLanguage({ ext: '.qasm' })).toBe('openqasm2');
		});
	});

	describe('bare extensions (without dot)', () => {
		it('returns javascript for js', () => {
			expect(detectLanguage({ ext: 'js' })).toBe('javascript');
		});

		it('returns typescript for ts', () => {
			expect(detectLanguage({ ext: 'ts' })).toBe('typescript');
		});

		it('returns python for py', () => {
			expect(detectLanguage({ ext: 'py' })).toBe('python');
		});
	});

	describe('case-insensitive matching', () => {
		it('returns javascript for .JS', () => {
			expect(detectLanguage({ ext: '.JS' })).toBe('javascript');
		});

		it('returns typescript for .TS', () => {
			expect(detectLanguage({ ext: '.TS' })).toBe('typescript');
		});

		it('returns html for .HTML', () => {
			expect(detectLanguage({ ext: '.HTML' })).toBe('html');
		});
	});

	describe('plaintext fallback', () => {
		it('returns plaintext for unrecognized extension', () => {
			expect(detectLanguage({ ext: '.unknown' })).toBe('plaintext');
		});

		it('returns plaintext when ext is missing', () => {
			expect(detectLanguage({})).toBe('plaintext');
		});

		it('returns plaintext when called with no arguments', () => {
			expect(detectLanguage()).toBe('plaintext');
		});

		it('returns plaintext when ext is empty string', () => {
			expect(detectLanguage({ ext: '' })).toBe('plaintext');
		});
	});

	describe('css variants', () => {
		it('returns css for .scss', () => {
			expect(detectLanguage({ ext: '.scss' })).toBe('css');
		});

		it('returns css for .sass', () => {
			expect(detectLanguage({ ext: '.sass' })).toBe('css');
		});
	});

	describe('javascript variants', () => {
		it('returns javascript for .mjs', () => {
			expect(detectLanguage({ ext: '.mjs' })).toBe('javascript');
		});

		it('returns javascript for .jsx', () => {
			expect(detectLanguage({ ext: '.jsx' })).toBe('javascript');
		});

		it('returns typescript for .tsx', () => {
			expect(detectLanguage({ ext: '.tsx' })).toBe('typescript');
		});
	});
});
