/**
 * @file The JEJ language registry — `LANGUAGE_METADATA`, ported verbatim from
 * Legesher's generated registry
 * (`legesher-next/libs/vs-code/src/generated/languages.ts`, itself generated
 * from `libs/i18n/legesher_i18n/languages.json`).
 *
 * Milestone 1 ships a 5-of-51 subset — `en`, `es`, `fr`, `de`, `ar` (LTR plus
 * one RTL) — every entry `status: 'experimental'` per ./README.md (`status` is
 * metadata, not a pack-availability gate: a language is registered before its
 * pack is authored, and `en` is a registry entry with no pack). Deliberately a
 * plain data file — fidelity to the ported values is validated in the test
 * (tests/languages.test.ts), not here.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { LanguageCode, LanguageMetadata } from './types.js';

const LANGUAGE_METADATA: Readonly<Record<LanguageCode, LanguageMetadata>> =
	freezeInPlace({
		en: {
			name: 'English',
			native: 'English',
			iso639_2: 'eng',
			bcp47: 'en',
			rtl: false,
			status: 'experimental',
		},
		es: {
			name: 'Spanish',
			native: 'Español',
			iso639_2: 'spa',
			bcp47: 'es',
			rtl: false,
			status: 'experimental',
		},
		fr: {
			name: 'French',
			native: 'Français',
			iso639_2: 'fra',
			bcp47: 'fr',
			rtl: false,
			status: 'experimental',
		},
		de: {
			name: 'German',
			native: 'Deutsch',
			iso639_2: 'deu',
			bcp47: 'de',
			rtl: false,
			status: 'experimental',
		},
		ar: {
			name: 'Arabic',
			native: 'العربية',
			iso639_2: 'ara',
			bcp47: 'ar',
			rtl: true,
			status: 'experimental',
		},
	});

export default LANGUAGE_METADATA;
