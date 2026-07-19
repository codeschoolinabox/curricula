# orchestrate

The orchestrator — the one component the host mounts. It renders the study
environment the package [README](../README.md) describes: the editor, the
five-phase study panel, the level UI, the embedded guide. And it is the
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
  types.ts        the host surface, plus region-internal shared vocabulary
  index.tsx       the top component — the composition root the host mounts
  editor/         the editing surface — the single writer of the source
  phases-panel/   the five-phase study panel — the study layer, rendered
  level-ui/       the level selector and the strict toggle
  guide/          the embedded guide — help never withheld
  event-bus/      the internal per-instance event bus
  lib/            pure derivation libraries — components stay thin
    composing/    the joins and the configuration cascade
    validating/   parse-facts assembly + the memoized validate
    marking/      fit marks, per settle and per level
    masking/      mask state over the three surface classes
    honoring/     the focus-request honor path
    recommending/ recommendation ranking
```

Each sub-directory documents itself; the derivation libraries under `lib/` hold
every level-aware and roster-aware computation as pure functions, and the
rendered surfaces stay thin over them.

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
the layers this region sees: the `configs` prop, then — for a lens opened by a
recommendation — that proposal's opening overrides, then the learner's session
tweaks, always final. Whatever upstream layers the embedding site composes — its
own defaults, per-snippet metadata — arrive already folded into the `configs`
value; the orchestrator never reads them itself. Each merged record reaches its
lens through that lens's own factory — or through the shared merge when the lens
declares none.

## What renders

- **The editor** — the single writer of the program's source; every derived
  state re-derives from its settles. It consumes the selected level's
  editor-support data — completion, hover, format — through the adapter that
  lives with the editor's own surface.
- **The five-phase study panel** — the mechanical render of the embodiment: a
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
- **Fit marks**, per settle: from the memoized validate's verdict, the level's
  admitted snippet types, and the current type — fits · does not fit · not
  applicable for this snippet type · undetermined while unparsed (the verdict
  itself encodes the parse status). A typo never reads as a level violation.
- **The mask**, at render: the selected level's assessment — its mark with its
  cause — crossed with the strict posture.
- **Name-keyed config resolution** — the cascade, per lens name.

## Enforcement — the mask

Three surface classes: editor-based surfaces are always alive; meta-level
controls — the selector, the strict toggle, the snippet-type toggle, the guide —
are never masked; everything else (the study panel and its lenses) is covered
under strict while the code is out of level. The mask is an inert overlay —
mounted lenses keep their state beneath it — and the blocked state names the
level and the first violation, or the type-admission cause. The full class-3
block applies while the selected level's fit mark is does-not-fit or
not-applicable-for-type — once the code parses. While it does not parse, the
mark is undetermined and that carve-out wins regardless of type admission: the
mask names no violation, and the parse phases' panel nodes and their error
lenses stay uncovered — the supports a broken program needs are never the price
of a wrong toggle. Under warn, nothing is blocked anywhere. Enforcement is mask,
not filter — it never edits fit or accessibility — and recommendation rendering
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
  the selector's not-applicable mark renders from the same check. The check is
  computed once, in the marking library: the selector's not-applicable mark and
  the mask's type-admission cause are one classification's two projections.
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

- **fit mark** — the four-valued mark vocabulary for a level's classification of
  the current code: fits · does not fit · not applicable for this snippet type ·
  undetermined while unparsed. The mark is the label alone; its cause rides the
  **assessment**.
- **assessment** — one level's classification carrying its fit mark AND the
  cause that mark needs downstream (the violations, or the admitted types).
  Derived once per settle and per level in the marking library — from the
  level's verdict, its admitted snippet types, and the current type; the
  undetermined carve-out reads off the verdict itself, which already encodes the
  parse status. Two surfaces project the one classification: the selector
  renders every level's mark; the mask crosses the selected level's assessment
  with the strict posture.
- **level verdict** — what one memoized validate produces for one level over the
  settled code: undetermined while the code does not parse, else validated,
  carrying the level's violations (possibly none). The shared truth the
  selector, the gutter, and the mask all project. Three near-homonyms, three
  owners — keep them apart: the **level verdict** is the validator's answer
  about the code; a **fit mark** is the four-valued label an **assessment**
  carries, derived in the marking library from that verdict plus type admission
  (the verdict itself encodes the parse status), projected by the selector and
  the mask; lens **fit** is embody's applicability outcome for a lens, and no
  level is involved in it. (The package sketch's verdicts node compresses
  verdict and type admission into one label; this region splits them — the
  verdict is the validator's alone.)
- **settle loop** — the region's edit-to-derivation cycle: the editor emits one
  edit event per document change; the top component debounces them
  trailing-edge; when typing settles, the snippet is re-embodied and every
  derived state re-derives. An edit event is not a settle — edit events fire per
  keystroke, derivation runs per settle. The snippet-type toggle re-derives
  immediately, cancelling any pending settle.
- **session choices** — the learner's session-scoped selections: the selected
  level key, the enforcement posture, the snippet type, the open lens, and
  configuration tweaks. The top component is their single owner: surfaces raise
  intent upward through callbacks, the owner commits the change, and the event
  bus announces the committed changes other surfaces react to — configuration
  tweaks reach their lens as fresh props and announce nothing. No other
  component holds a session choice.
- **blocked state** — the learner-facing face of a masked surface under strict:
  an inert overlay naming the level and the first violation — or the
  type-admission cause — while the covered surface keeps its state beneath.
- **built-in roster** — the package-shipped default rosters, one of lenses and
  one of levels: constants in the composing library that the mount-time joins
  extend. Injection appends to them and never replaces or shadows them, and the
  scaffolding level is never on them.
- **scaffolding level** — a trivially conforming language level, key `scaffold`,
  that tests and sandbox pages inject to exercise the level machinery: its
  validator flags `debugger` statements and it admits only modules, so all four
  fit marks are reachable. Injected-only — never on the built-in roster.
- **surface classes** — the mask's three-way split: class 1 = editor-based
  (always alive) · class 2 = meta-level controls (never masked) · class 3 =
  everything else (covered under strict while out of level).
- **focus request** — the `lens` prop: a request honored through fit and
  accessibility, never a bypass.
- **display labels** — the five phases' learner-facing labels and the
  none-state's display string; presentation this region owns, distinct from the
  data names embody owns. The labels: `Source` · `Tokens · spelling` ·
  `AST · grammar` · `Environment · names` · `Evaluation · run`; the none-state
  displays as `plain JavaScript`. The labels live keyed by phase name — a record
  zipped against embody's runtime order constant, never a positional list, so
  the phase order keeps exactly one truth.
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
