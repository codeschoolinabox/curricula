# orchestrate

The orchestrator — the one component the host mounts. It renders the study
environment the package [README](../README.md) describes: the editor, the
six-phase study panel, the level UI, the embedded guide. And it is the
composition root: the default rosters joined with whatever the host injects, the
configuration cascade resolved per lens name, and everything re-derived per
settle.

The package README owns what the orchestrator, the mask, and the fit marks mean;
this document owns the host surface and this region's mechanics.

## What lives here

```text
orchestrate/
  README.md       this file — the host surface + the orchestrator's mechanics
  DOCS.md         the region's architectural sketch
  types.ts        the host surface — the package's public props
  …               the rendered surfaces and the pure derivation libraries —
                  each documents itself
```

## The host surface

Eight props; only the first is required. Every initial choice is a default,
never a lock — the learner can override level, posture, snippet type, lens
choice, and configuration for their session.

```ts
type StudyLensesProperties = {
	snippet: string; // the program source
	type?: SnippetType; // initial snippet type
	lens?: string; // an initial-focus request — never a bypass
	configs?: Readonly<Record<string, Partial<LensConfig>>>; // cascade top layer
	lenses?: ReadonlyArray<Lens>; // append-only injection
	languageLevels?: ReadonlyArray<LanguageLevel>; // append-only; '' reserved
	activeLanguageLevel?: string; // initial level key
	strictLanguageLevels?: boolean; // initial posture; warn is the default
};
```

One disambiguation the surface owes the glossary: the `snippet` prop is the
source text alone — the glossary's _snippet_ is this prop together with `type`.

The full doc-commented surface is [`types.ts`](./types.ts). This — with the lens
contract and the level spine — is the package's public, versioned surface;
everything else here is internal.

## The composition root

At mount, the orchestrator joins the default lens roster with the host's
injected lenses and the built-in levels with the injected ones — append-only,
and a lens-name collision or a level-key collision fails loudly, at the author's
desk. The joined lens roster passes to embody as an argument; embody imports no
roster. Continuously, the configuration cascade re-resolves per lens name over
the two layers this region sees: the `configs` prop on top, the learner's
session tweaks always final. Whatever upstream layers the embedding site
composes — its own defaults, per-snippet metadata — arrive already folded into
the `configs` value; the orchestrator never reads them itself. Each merged
record reaches its lens through that lens's own factory — or through the shared
merge when the lens declares none.

## What renders

- **The editor** — the single writer of the program's source; every derived
  state re-derives from its settles. It consumes the selected level's
  editor-support data — completion, hover, format — through the adapter that
  lives with the editor's own surface.
- **The six-phase study panel** — the mechanical render of the embodiment: a
  barred phase renders barred with its cause; an accessible phase lists its
  fitting lenses. The phases' learner-facing display labels are this region's UI
  concern — their data names live in embody.
- **The level UI** — the selector, permanent whenever levels are registered: its
  closed face shows the selected level's state, its open list shows a fit mark
  per registered level, hover surfaces the level's docs. Beside it: the
  selected-level-only gutter and the strict toggle.
- **The snippet-type toggle and the embedded guide** — alive under every
  posture: the toggle because its change can itself restore conformance, the
  guide because help is never withheld.

## Derivations this region owns

All of them live in pure functions; components stay thin — level logic never
lives inside a React component.

- **One memoized validate per settle and per level**, shared by the selector,
  the gutter, and the mask. The parse facts a level consumes are assembled here,
  once, from the embodiment's stage values.
- **Fit marks**, per settle: from the memoized validate, the level's admitted
  snippet types, the current type, and the parse-stage status — fits · does not
  fit · not applicable for this snippet type · undetermined while unparsed. A
  typo never reads as a level violation.
- **The mask**, at render: the selected level's verdict crossed with the strict
  posture.
- **Name-keyed config resolution** — the cascade, per lens name.

## Enforcement — the mask

Three surface classes: editor-based surfaces are always alive; meta-level
controls — the selector, the strict toggle, the snippet-type toggle, the guide —
are never masked; everything else (the study panel and its lenses) is covered
under strict while the code is out of level. The mask is an inert overlay —
mounted lenses keep their state beneath it — and the blocked state names the
level and the first violation, or the type-admission cause. The full class-3
block applies when the verdict is does-not-fit or not-applicable-for-this-
snippet-type — once the code parses. While it does not parse, the verdict is
undetermined and that carve-out wins regardless of type admission: the mask
names no violation, and the parse phases' panel nodes and their error lenses
stay uncovered — the supports a broken program needs are never the price of a
wrong toggle. Under warn, nothing is blocked anywhere. Enforcement is mask, not
filter — it never edits fit or accessibility — and recommendation rendering
passes through the same mask.

## Honor rules

- **An initial-focus request is honored, not obeyed.** A phase-declaring lens is
  honored when it is attached to an accessible phase; a panel-excluded lens is
  honored by running its applicability at mount. Otherwise the environment falls
  back to normal rendering — and the mask applies to a focus-mounted lens
  identically.
- **Type admission is this region's check.** Whether the level admits the
  current snippet type is checked here, over the level's admitted types — the
  same warn-or-block path as out-of-level code, with the type-admission cause;
  the selector's not-applicable mark renders from the same check.
- **The learner owns the session.** Every curated choice is overridable; no
  author-side lock exists anywhere in the surface.

## What this region does not own

Fit and accessibility (embody derives both); lens internals and the production
of recommendations (the lenses region — this region only ranks the proposals and
renders them, the rendering through the mask); level content (each level's own);
evaluators (never touched here — evaluation-phase lenses import their own);
learner identity, progress, and grading (the embedding LMS's).

## Glossary — region terms

The package glossary owns the shared meanings; these entries add the mechanics
this region owns.

- **fit mark** — the selector's per-level verdict about the current code: fits ·
  does not fit · not applicable for this snippet type · undetermined while
  unparsed. Derived per settle from the shared memoized validate.
- **surface classes** — the mask's three-way split: editor-based (always alive)
  · meta-level controls (never masked) · everything else (covered under strict
  while out of level).
- **focus request** — the `lens` prop: a request honored through fit and
  accessibility, never a bypass.
- **composed study configuration** — (package glossary owns the meaning) the
  mechanics here: rosters joined once at mount, loudly; the cascade re-resolved
  per lens name as any layer changes, the learner's layer final.

## Navigation

- Package root: [`../README.md`](../README.md) — the domain model and the
  package glossary.
- [`DOCS.md`](./DOCS.md) — this region's architectural sketch.
- [`types.ts`](./types.ts) — the host surface: `StudyLensesProperties`,
  `FitMark`.
- The rendered surfaces and derivation libraries document themselves in their
  own directories.
