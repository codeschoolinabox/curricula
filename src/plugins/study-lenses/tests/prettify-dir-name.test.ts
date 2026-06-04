/**
 * @file Unit tests for the shared prettifyDirName helper.
 */

import { describe, expect, it } from 'vitest';

import prettifyDirName from '../prettify-dir-name.js';

describe('prettifyDirName', () => {
	it('sl-01-while-loops with prefix ["sl-"] → "While Loops"', () => {
		expect(prettifyDirName('sl-01-while-loops', ['sl-'])).toBe('While Loops');
	});

	it('sl-foo-bar (no numeric) → "Foo Bar"', () => {
		expect(prettifyDirName('sl-foo-bar', ['sl-'])).toBe('Foo Bar');
	});

	it('01-intro (no prefix match) → "Intro" (numeric still stripped)', () => {
		expect(prettifyDirName('01-intro', ['sl-'])).toBe('Intro');
	});

	it('plain-name (no prefix, no numeric) → "Plain Name"', () => {
		expect(prettifyDirName('plain-name', ['sl-'])).toBe('Plain Name');
	});

	it('empty prefixes → numeric strip + Title Case only', () => {
		expect(prettifyDirName('sl-01-while-loops', [])).toBe('Sl 01 While Loops');
	});

	it('empty residue after strip → returns original unchanged', () => {
		expect(prettifyDirName('sl-', ['sl-'])).toBe('sl-');
		expect(prettifyDirName('sl-01-', ['sl-'])).toBe('sl-01-');
	});

	it('100-advanced (3-digit numeric) → "Advanced"', () => {
		expect(prettifyDirName('100-advanced', [])).toBe('Advanced');
	});
});
