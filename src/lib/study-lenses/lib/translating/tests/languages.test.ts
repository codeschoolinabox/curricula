import { describe, expect, it } from 'vitest';

import LANGUAGE_METADATA from '../languages.js';
import type { LanguageCode, LanguageMetadata } from '../types.js';

const EXPECTED_FIELDS: ReadonlyArray<
	[LanguageCode, keyof LanguageMetadata, string | boolean]
> = [
	['ar', 'name', 'Arabic'],
	['ar', 'native', 'العربية'],
	['ar', 'iso639_2', 'ara'],
	['ar', 'bcp47', 'ar'],
	['ar', 'rtl', true],
	['ar', 'status', 'experimental'],

	['de', 'name', 'German'],
	['de', 'native', 'Deutsch'],
	['de', 'iso639_2', 'deu'],
	['de', 'bcp47', 'de'],
	['de', 'rtl', false],
	['de', 'status', 'experimental'],

	['en', 'name', 'English'],
	['en', 'native', 'English'],
	['en', 'iso639_2', 'eng'],
	['en', 'bcp47', 'en'],
	['en', 'rtl', false],
	['en', 'status', 'experimental'],

	['es', 'name', 'Spanish'],
	['es', 'native', 'Español'],
	['es', 'iso639_2', 'spa'],
	['es', 'bcp47', 'es'],
	['es', 'rtl', false],
	['es', 'status', 'experimental'],

	['fr', 'name', 'French'],
	['fr', 'native', 'Français'],
	['fr', 'iso639_2', 'fra'],
	['fr', 'bcp47', 'fr'],
	['fr', 'rtl', false],
	['fr', 'status', 'experimental'],
];

describe('LANGUAGE_METADATA', () => {
	describe('registered codes', () => {
		it('holds exactly the five shipped codes', () => {
			expect(
				Object.keys(LANGUAGE_METADATA).toSorted((a, b) => a.localeCompare(b)),
			).toEqual(['ar', 'de', 'en', 'es', 'fr']);
		});
	});

	describe('ported field values', () => {
		it.each(EXPECTED_FIELDS)('%s.%s → %p', (code, field, value) => {
			expect(LANGUAGE_METADATA[code][field]).toBe(value);
		});
	});

	describe('immutability', () => {
		it('the registry is frozen', () => {
			expect(Object.isFrozen(LANGUAGE_METADATA)).toBe(true);
		});

		it.each(['ar', 'de', 'en', 'es', 'fr'] as const)(
			'%s entry is frozen',
			(code) => {
				expect(Object.isFrozen(LANGUAGE_METADATA[code])).toBe(true);
			},
		);
	});
});
