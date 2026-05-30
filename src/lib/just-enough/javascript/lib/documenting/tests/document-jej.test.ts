import { describe, it, expect } from 'vitest';

import documentJej from '../document-jej.js';
import { assembleDocTable } from '../doc-table.js';

describe('documentJej', () => {
	describe('unknown words yield null', () => {
		it('empty string yields null', () => {
			expect(documentJej('')).toBeNull();
		});

		it('whitespace-only yields null', () => {
			expect(documentJej(' ')).toBeNull();
		});

		it('unknown identifier yields null', () => {
			expect(documentJej('unknownWord123')).toBeNull();
		});

		it('capitalized variant of a known keyword yields null', () => {
			expect(documentJej('Let')).toBeNull();
		});
	});

	describe('JEJ keywords return DocEntry', () => {
		it('let returns a non-null entry', () => {
			expect(documentJej('let')).not.toBeNull();
		});

		it('let entry has non-empty description', () => {
			expect(documentJej('let')?.description).toBeTruthy();
		});

		it('const returns a non-null entry', () => {
			expect(documentJej('const')).not.toBeNull();
		});
	});

	describe('JEJ allowed globals return DocEntry', () => {
		it('console returns a non-null entry', () => {
			expect(documentJej('console')).not.toBeNull();
		});

		it('console entry has non-empty description', () => {
			expect(documentJej('console')?.description).toBeTruthy();
		});

		it('Math returns a non-null entry', () => {
			expect(documentJej('Math')).not.toBeNull();
		});
	});

	describe('JEJ curated member methods return DocEntry', () => {
		it('charAt returns a non-null entry', () => {
			expect(documentJej('charAt')).not.toBeNull();
		});

		it('charAt entry has non-empty description', () => {
			expect(documentJej('charAt')?.description).toBeTruthy();
		});
	});

	describe('blocked stumbles return DocEntry with not-in-JEJ badge', () => {
		it('var returns a non-null entry', () => {
			expect(documentJej('var')).not.toBeNull();
		});

		it("var entry category equals 'not in JEJ'", () => {
			expect(documentJej('var')?.category).toBe('not in JEJ');
		});

		it('var entry has non-empty description', () => {
			expect(documentJej('var')?.description).toBeTruthy();
		});
	});
});

describe('assembleDocTable', () => {
	it('rejects duplicate keys across category partitions with a throw', () => {
		expect(function callAssembleWithDuplicates() {
			assembleDocTable(
				{ let: { description: 'first' } },
				{ let: { description: 'second' } },
			);
		}).toThrow(/duplicate key/i);
	});

	it("names the duplicate key in the error message", () => {
		expect(function callAssembleWithDuplicates() {
			assembleDocTable(
				{ collidingWord: { description: 'first' } },
				{ collidingWord: { description: 'second' } },
			);
		}).toThrow(/collidingWord/);
	});
});
