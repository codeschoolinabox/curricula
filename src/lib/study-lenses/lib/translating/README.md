# lib/translating

Legesher-style human-language rendering for the JEJ surface. Given a parsed
JavaScript snippet and a target-language **pack**, produces one frozen
`TranslationSpan` per language-provided token — its `[start, end)` range plus
the **native** rendering of that keyword, allowed global, or curated member — so
an editor overlay or a lens can display the program in the learner's language
while the **buffer, AST, and runner stay canonical English**. The reverse
direction (native → English, collision-checked) supports native authoring and
guards every pack's round-trip.

Translation is **display-only computation**: it never mutates the snippet, never
constructs an embodiment, and produces spans a consumer paints — the canonical
English source remains the single source of truth for parsing, entwining,
validating, and evaluating (see [`../../embody/`](../../embody/)). English is
the language the machine reads; the pack is the language the learner reads.

## Glossary

**Language pack** — a frozen `LanguagePack` for one language: three
`{ english: native }` maps, one per surface partition — `keywords`, `builtins`
(allowed globals), and `members` (curated methods/properties). Keys are the
English JEJ surface; values are the native renderings. Every value is a single
token with no whitespace (it must survive as one lexeme). Operators,
punctuation, identifiers, string contents, and comments are **not** in a pack —
they are not language-provided.

**JEJ surface** — the closed, curated set of language-provided tokens JEJ
admits, and the exact key-set every pack must cover. It has three anchors — the
same constants the `../documenting/` drift-guard imports
([`../documenting/tests/document-jej.test.ts`](../documenting/tests/document-jej.test.ts)):

- **keywords** (16): `KEYWORDS` from
  [`../completing/completing-keywords.ts`](../completing/completing-keywords.ts)
  —
  `let const if else for while do break continue return true false null new typeof in`.
- **members** (28): `CURATED_MEMBERS` from
  [`../completing/curated-members.ts`](../completing/curated-members.ts) —
  String / Number / Math methods such as `charAt`, `toFixed`, `floor`.
- **builtins** (16): `allowedGlobals` (17) from
  [`../../embody/lib/validating/just-enough-js.ts`](../../embody/lib/validating/just-enough-js.ts)
  **minus** `SUPPRESSED_GLOBALS` (`{ eval }`) from
  [`../completing/suppressed-globals.ts`](../completing/suppressed-globals.ts)
  **minus** `KEYWORDS` —
  `console Math String Number Boolean Date RegExp BigInt parseInt parseFloat alert confirm prompt undefined NaN Infinity`.

[`../completing/collect-jej-surface.ts`](../completing/collect-jej-surface.ts)
composes these same three at completion time but exports only its collector
function — a see-also, not an importable surface. A **drift-guard** test asserts
each pack's key-set equals this surface (mirroring `documenting`'s), so packs
cannot silently fall out of sync as JEJ evolves.

**Language registry** — `LANGUAGE_METADATA`, a
`Record<LanguageCode, LanguageMetadata>` ported verbatim from Legesher's
generated registry. Each entry carries `name` (English), `native`, `iso639_2`,
`bcp47`, `rtl` (four RTL languages: `ar` `fa` `he` `ur`), and `status`. The
registry is the source of the dropdown's labels and of a rendered line's text
direction; it is independent of any pack (a language can be registered before
its pack is authored). `LanguageCode` is a **closed** union of the registered
ISO codes — ported closed from Legesher, with no `| string` escape hatch — so
`Record<LanguageCode, LanguageMetadata>` stays exhaustively checked.

**Translation span** — a `TranslationSpan`:
`{ range: [start, end), english, native, category }` where `category` is
`'keyword' | 'builtin' | 'member'`. Range-anchored to the canonical English
source; `english === code.slice(start, end)`. A consumer replaces the glyphs in
`range` with `native`. Because spans are anchored to English ranges (never
text-matched), a native word sitting inside a string or comment is never
translated.

**Translate trigger** — which tokens become spans. Membership in the pack is
necessary but **not** sufficient; each partition carries a role guard so a user
token that merely shares a name is never translated:

- **keyword** — a reserved-word keyword token (acorn `.keyword`) whose text is a
  `keywords` key (`if`, `typeof`, `null`, `in`, `new`, …) and — for the
  value-literals `true`/`false`/`null`, which are legal property names
  (`x.null`) — not itself a `MemberExpression.property`. All 16 JEJ keyword keys
  tokenize as reserved-word keyword tokens (none is a contextual keyword emitted
  as a `name`), so `.keyword` ∩ pack membership is total over them; widening the
  surface with a contextual keyword (e.g. `of`) is a guard-review event. (Note:
  the semantic taxonomy in [`../classifying/`](../classifying/) bins
  `typeof`/`in` as operators and `null`/`true`/`false` as literals — so the
  trigger keys on **pack membership**, not on classifying's `keyword` category.)
- **member** — a non-computed `MemberExpression.property` name whose text is a
  `members` key (`.floor`, `.charAt`). Safe to translate fully because **JEJ has
  no user-defined properties** (no object literals, arrays, or property
  assignment), so every `.member` is built-in.
- **builtin** — an identifier reference whose text is a `builtins` key and which
  resolves to the global (not shadowed by a learner binding, not a declaration
  id). Shadow resolution is the one scope-aware guard — see § Edge cases.

**Forward vs. reverse.** _Forward_ (`translateTokens`) reads canonical English
and emits native spans for display. _Reverse_ (`reversePack`) inverts a pack
**per partition** to `{ keywords, builtins, members }`, each a
`{ native: english }` map, with **collision detection within each partition** —
it throws if two English keys in one partition share a native value (a lossy,
non-round-trippable partition), porting Legesher's
`token_mapper._invert_checked`. Per-partition (not one flat map) mirrors
`token_mapper.reverse()` and matches forward translation's category-awareness: a
cross-partition homonym (a keyword and a member rendering to the same native
word) is legal, because the consumer always knows a token's category. Reverse
feeds native authoring (a later milestone) and the build/test-time round-trip
guard.

**Round-trip guard** — a test-time invariant: for every pack, reversing then
forward-translating a canonical English program reproduces it exactly. A pack
that fails is rejected at authoring time, not at a learner's keyboard.

## What lives here

```text
lib/translating/
  README.md            (this — orientation + glossary + public API)
  DOCS.md              architectural sketch + Mermaid data flow
  types.ts             LanguageCode, LanguageMetadata, LanguagePack,
                       TranslationSpan, TranslateInput
  languages.ts         LANGUAGE_METADATA registry (ported from Legesher)
  load-pack.ts         (language) → LanguagePack | null
  translate-tokens.ts  forward: (parse + pack) → TranslationSpan[]
  reverse-pack.ts      (pack) → { native: english } (collision-checked)
  packs/
    es.ts  fr.ts  de.ts  ar.ts  …   per-language { keywords, builtins, members }
  tests/
    translate-tokens.test.ts
    reverse-pack.test.ts
    packs.drift.test.ts     (each pack's keys === collect-jej-surface)
    round-trip.test.ts      (reverse ∘ forward === identity)
```

Per-language pack files are split from day one (three maps × ~60 entries per
language reliably exceed single-file readability — same rationale as
`documenting/`'s per-category split). No barrel: `load-pack.ts` maps a
`LanguageCode` to its statically-imported pack.

## Public API

```ts
import translateTokens from './translate-tokens.js';
import reversePack from './reverse-pack.js';
import loadPack from './load-pack.js';

const pack = loadPack({ language: 'es' }); // LanguagePack | null
const spans: readonly TranslationSpan[] = translateTokens({
	code, // snippet source text (canonical English)
	tokens, // Acorn token stream  (Snippet.raw.tokens)
	ast, // Acorn Program        (Snippet.raw.ast)
	pack, // the loaded LanguagePack
});
const toEnglish = reversePack({ pack }); // { keywords, builtins, members }; throws on in-partition collision
```

`TranslateInput` is declared in **acorn terms**
(`tokens: readonly acorn.Token[]`, `ast: acorn.Node`) — the same narrow inputs
`../classifying/` takes, so the `Snippet → TranslateInput` narrowing is the
caller's one-line boundary cast; tests build inputs with a bare `acorn.parse`.
`translateTokens` needs the AST (not just the token stream) because member and
builtin triggers are AST/scope-context decisions, not token-type decisions.

Behavior:

- **Source-ordered and range-anchored.** Spans ascend by `start`;
  `english === code.slice(start, end)` always. A consumer never text-matches —
  it paints `native` over `range`.
- **Pure and frozen.** No mutation of `code`, `tokens`, `ast`; the returned
  array and every span are deeply frozen (safe on deep-frozen embodiment data).
  Deterministic — same inputs, same spans.
- **Throws at the boundary.** `translateTokens` throws `TypeError` on
  missing/null `code`/`tokens`/ `ast`/`pack`; `reversePack` throws on a
  colliding (non-round-trippable) pack. Like `../classifying/`, translation sits
  behind a `status.parsed` (and, for the dropdown, a `validation.isJeJ`) gate —
  null inputs are a caller bug, not a runtime state to absorb.
- **JEJ-bounded.** Only the ~60-token JEJ surface is translated. A token outside
  the surface (a user identifier, a non-JEJ global, an operator symbol) yields
  no span.

## Edge cases

- **Builtin shadowed by a learner binding.** `let console = 5; console` — the
  reference is the learner's variable, not the global, and must not translate.
  The default is **coarse flat-name suppression**: a `builtins` span is
  suppressed iff its name is in the declared-name set projected from
  `buildScope(ast).allDeclarations` (a `DeclarationInfo[]` → set of `.name`s),
  reusing
  [`../../embody/lib/scope/build-scope.ts`](../../embody/lib/scope/build-scope.ts)
  exactly as
  [`../completing/collect-jej-surface.ts`](../completing/collect-jej-surface.ts)
  does (`isVisibleLocal`). This errs toward not-translating (never paints a
  native word over the learner's binding) and needs no lexical walker; for the
  JEJ surface (no functions, only block scopes) the gap vs. true lexical
  resolution is negligible. The coarse-vs-lexical-vs-none trade is recorded in
  DOCS.md § Decisions.
- **Member vs. same-named global.** `floor` is a `members` key; a bare
  identifier `floor` (a learner variable) is not a member and yields no span —
  only `x.floor` (a `MemberExpression.property`) does. The AST guard, not the
  name, decides.
- **Computed member access** (`obj[expr]`) — the property is an expression, not
  a name token; not translated.
- **Advisory-stumble keywords** (`new`, `null`) are in the surface and translate
  like any keyword; their pedagogy lives in `../documenting/`, not here.
- **Non-JEJ code.** Translation is only meaningful for valid JEJ (packs cover
  only the JEJ surface). Gating the dropdown on `validation.isJeJ` is the
  consumer's concern (the orchestrator), not this module's — but it is why
  partial translation of non-JEJ code never reaches a learner.
- **Reverse collisions.** If a pack maps two English keys _within one partition_
  to one native word, `reversePack` throws: that partition is not
  round-trippable and would corrupt native→English authoring. A native word
  reused _across_ partitions (a keyword and a member) does not collide — the
  consumer resolves it category-first. Caught at build/test.

## Consumers (downstream)

Consumers that paint these spans (each lands in its own milestone):

- **The editor overlay** (`../../orchestrate/lib/editing/`) — a CodeMirror
  decoration extension replaces each span's glyphs with `native`, re-supplying
  keyword coloring and per-span `unicode-bidi: isolate` for RTL.
- **Read-only lens code-views** (`../../lenses/`) — apply the same spans over
  their rendered code.
- **The toolbar language dropdown** (`../../orchestrate/`) — reads
  `LANGUAGE_METADATA` for labels and `rtl`; gated on `validation.isJeJ`.

The input asymmetry with `../quizzing/` (whole `Snippet`) vs. this module
(narrow parse shapes) is deliberate, matching `../classifying/`: translation
underlies any Snippet-shaped consumer and must not assume one.

## Why this module exists

JEJ's premise is audience-reach minimalism — just enough JavaScript to address
users, developers, and the machine. English keywords are a barrier to the
learner audience for the ~82% of the world that does not speak English first.
Legesher's insight is that the barrier is removable without forking the
language: store canonical English, render the native language, translate
losslessly. This module is that translation core, re-implemented natively in
TypeScript for the JEJ surface — the strongest pieces of Legesher (the pack
shape, the language registry, the collision-checked reverse map) ported to sit
beside the acorn token stream the embodiment already produces.

It lives at the JEJ-package `lib/` tier (peer to `../classifying/`,
`../completing/`, `../documenting/`) because more than one peer consumes it —
the editor overlay, the lenses, and the orchestrator's dropdown — so it must not
require an upward `lenses/` ↔ `orchestrate/` dependency. It lives outside
[`../../embody/`](../../embody/): translation is a rendering projection, not
part of the embodiment pipeline (no parse, no validate, no execute), and the
embodiment's locked types stay untouched.

## Conventions

Inherits all conventions from [`../README.md`](../README.md),
[`../../README.md`](../../README.md), and the top-level `AGENTS.md` / `DEV.md`.
Module-specific rules:

- **Pure-sync only.** No async, no I/O, no side effects, no randomness.
  Module-level pack/registry constants; deep-freeze on return.
- **No `embody()`, no `Snippet` construction.** Type-only imports from
  `../../embody/types.ts` and a value import of `../../embody/lib/scope/` for
  shadow resolution are permitted; the module never constructs embodiments or
  mutates parse data.
- **Range anchoring, never text matching.** A span comes from a token's
  `[start, end)`; the module never regex-replaces `\bword\b` (that is Legesher's
  toy path — it corrupts strings and comments).
- **Source-slice authority.** `english` always comes from `code.slice(...)`,
  never from Acorn's processed `.value`.
- **Surface changes are cross-consumer events.** The pack key-set is the JEJ
  surface anchored by `completing/completing-keywords.ts`,
  `completing/curated-members.ts`, and `just-enough-js.ts` `allowedGlobals` (§
  Glossary); widening it is an inter-module contract change enforced by the
  drift-guard test, not a local edit.
- **Single-token native values.** Every pack value is one whitespace-free
  lexeme; the drift/round- trip tests reject multi-word values.

## Navigation

- **Parent peer:** [`../README.md`](../README.md).
- **Architectural sketch:** [`./DOCS.md`](./DOCS.md).
- **JEJ surface (anchors):**
  [`../completing/completing-keywords.ts`](../completing/completing-keywords.ts)
  (`KEYWORDS`),
  [`../completing/curated-members.ts`](../completing/curated-members.ts)
  (`CURATED_MEMBERS`),
  [`../../embody/lib/validating/just-enough-js.ts`](../../embody/lib/validating/just-enough-js.ts)
  (`allowedGlobals`),
  [`../completing/suppressed-globals.ts`](../completing/suppressed-globals.ts)
  (`SUPPRESSED_GLOBALS`); drift-guard precedent
  [`../documenting/tests/document-jej.test.ts`](../documenting/tests/document-jej.test.ts).
- **Token source:** [`../classifying/`](../classifying/) and
  [`../../embody/types.ts`](../../embody/types.ts) § RawAcorn.
- **Scope resolution:**
  [`../../embody/lib/scope/build-scope.ts`](../../embody/lib/scope/build-scope.ts).
- **Reference port:** Legesher `libs/core/legesher_core/token_mapper.py`
  (reverse + collision) and `libs/vs-code/src/generated/languages.ts`
  (registry).
- **Campaign plan:**
  `~/.claude/plans/study-0-curriculum-committee-legesher-ne-cozy-barto.md`.
