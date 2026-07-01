/**
 * @file Canonical types for the translating module. The domain model in
 * TypeScript: the language registry (metadata per language), a language pack
 * (three `{ english: native }` partitions covering the JEJ surface), the
 * forward output (range-anchored `TranslationSpan`s over canonical English),
 * and the reverse output (per-partition `{ native: english }` maps).
 *
 * English is canonical: forward translation reads it and emits native spans a
 * consumer paints; reverse translation inverts a pack for native authoring. The
 * module never mutates the parse, never constructs a `Snippet`. See
 * ./README.md for the glossary and ./DOCS.md for the architectural sketch.
 */

import type { Node, Token } from 'acorn';

/**
 * Registered languages — a CLOSED union (ported closed from Legesher; no
 * `| string` escape hatch) so `Record<LanguageCode, LanguageMetadata>` stays
 * exhaustively checked. `'en'` is canonical (identity; no pack). The shipped
 * subset exercises both directions: LTR (`es`/`fr`/`de`) and RTL (`ar`).
 * Widening the union is a registry + pack authoring event, not a local edit.
 */
export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'ar';

/**
 * Release posture of a registry entry, mirrored from Legesher's registry. A
 * language may be registered (dropdown-visible) before its pack is authored;
 * `status` is metadata, not a pack-availability signal.
 */
export type LanguageStatus = 'available' | 'experimental' | 'deprecated';

/**
 * Per-language metadata, ported verbatim from Legesher's generated registry
 * (`libs/vs-code/src/generated/languages.ts`). `native` is the language's
 * endonym (the dropdown label); `rtl` drives a rendered line's text direction
 * (true for `ar`/`fa`/`he`/`ur`). Independent of any pack.
 */
export type LanguageMetadata = {
	readonly name: string; // English name, e.g. 'Spanish'
	readonly native: string; // endonym, e.g. 'Español'
	readonly iso639_2: string; // 3-letter code, e.g. 'spa'
	readonly bcp47: string; // language tag, e.g. 'es'
	readonly rtl: boolean; // right-to-left script
	readonly status: LanguageStatus;
};

/**
 * The three JEJ-surface partitions. Keyed by category so both forward
 * translation and per-partition reverse can resolve a token category-first.
 */
export type SurfaceCategory = 'keyword' | 'builtin' | 'member';

/**
 * A frozen translation pack for one language: three `{ english: native }` maps,
 * one per surface partition. Keys are the JEJ surface (§ README Glossary — 16
 * keywords, 16 builtins, 28 members); values are single whitespace-free native
 * lexemes. A drift-guard test asserts the key-set equals the surface; a
 * round-trip test asserts every partition is losslessly reversible.
 */
export type LanguagePack = {
	readonly language: LanguageCode;
	readonly keywords: Readonly<Record<string, string>>;
	readonly builtins: Readonly<Record<string, string>>;
	readonly members: Readonly<Record<string, string>>;
};

/**
 * Input to `translateTokens`, declared in acorn terms — the same narrow parse
 * shapes `../classifying/` takes, plus the loaded pack. A parsed `Snippet`
 * carries `code`/`tokens`/`ast` on `source.code`, `raw.tokens`, `raw.ast`
 * (typed loosely there; the narrowing cast is the caller's one-line boundary).
 * The AST is required — member and builtin triggers are AST/scope-context
 * decisions, not token-type decisions, so `ClassifiedToken[]` is insufficient.
 */
export type TranslateInput = {
	readonly code: string;
	readonly tokens: readonly Token[];
	readonly ast: Node;
	readonly pack: LanguagePack;
};

/**
 * One forward translation: replace the glyphs in `range` with `native`.
 * Range-anchored to the canonical English source — `english === code.slice(...)`
 * — so a native word inside a string or comment is never translated. `category`
 * lets a consumer style/colour by partition.
 */
export type TranslationSpan = {
	readonly range: readonly [number, number]; // [start, end) into canonical `code`
	readonly english: string;
	readonly native: string;
	readonly category: SurfaceCategory;
};

/**
 * Output of `reversePack` — the pack inverted PER PARTITION to `{ native:
 * english }` maps, mirroring Legesher's `token_mapper.reverse()`. Collision is
 * detected within each partition (two English keys sharing one native value
 * throws); a native word reused across partitions is legal (the consumer
 * resolves it category-first). Feeds native authoring and the round-trip guard.
 */
export type ReversedPack = {
	readonly keywords: Readonly<Record<string, string>>;
	readonly builtins: Readonly<Record<string, string>>;
	readonly members: Readonly<Record<string, string>>;
};
