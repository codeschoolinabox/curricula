<!-- cspell:ignore colouring colours spellme wireframes -->

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
  ux/             the user twin — who meets this instrument, and how it is arranged
  index.tsx       the top component — the composition root the host mounts,
                  and the home of the nameplate and the announcer
  use-settled-snippet.ts   the settle hook — debounced edits, immediate type toggle
  derive-study.ts          the one derive composition per settle
  display-labels.ts        the phases' display labels, keyed by phase name
  editor/         the editing surface — where the learner authors the source
  generator/      the AI-authoring view — the pane's third occupant
  rail/           the lifecycle drawn as the machine's own conveyor — the line,
                  its stations, their trays, and the barring edge between two
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

**Why the arrangement's five parts do not all live in one directory** (human
ruling 2026-08-15). `rail/` owns the parts that are the lifecycle — the line,
its stations, their trays, and the barring edge — because they are one surface
with one geometry and one class. The **nameplate** and the **announcer** are the
top component's, because each is a claim about the whole composition rather than
about the lifecycle: the nameplate names whatever occupies the pane, and the
pane occupant is the top component's own state; and the announcer must render
outside **both** maskable containers, which only the root that renders both can
guarantee. A leaf directory asserting where it sits relative to containers it
does not own would be a rule nothing could enforce.

## The host surface

Eight props; only the first is required. Every initial choice is a default,
never a lock — the learner can override level, posture, snippet type, lens
choice, and configuration for their session.

```ts
type StudyLensesProperties = {
	snippet: string; // the program source
	type?: SnippetType; // initial snippet type; defaults to 'module'
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
The prop is mount-time only: the instrument seeds from it once, and a later
change is ignored — after mount the region's own edit intake is the only writer.

One embedding constraint: the instrument's only heading elements are the guide's
`h4` topic titles (the lifecycle strip and every control label are inline text),
so the embedding site may mount it below any `h3`-or-shallower context. The
constraint is documentation, not a runtime check — a DOM-ancestor heading probe
would be fragile and SSR-hostile for what is an authoring concern.

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

One band of controls and lifecycle sits above ONE surface pane. The pane holds
the editor, the open lens, or the generator — exactly one. The editor is the
home base: the learner authors there; opening a lens replaces it with a
disposable practice surface over the program exactly as it stood at the open;
opening the generator replaces it with the AI-authoring view over the same
frozen seed. Returning remounts the editor seeded from the live source — edits
survive every excursion. The Edit code button (rendered whenever the editor is
away, never masked) is the guaranteed way home; the strip's none entry closes an
open lens too whenever the strip itself is not masked. During any excursion the
band, the strip, the level UI, the guide, and the recommendations all stay
rendered — frozen, like every derivation input — only the pane's occupant
changes. And the one visual pane is two DOM slots: the editor renders in its own
never-masked slot; the open lens and the generator render within the maskable
content region, so the class-1/class-3 split survives the swap.

- **The editor (home base)** — the surface the learner authors in, and the only
  place typing enters the program's source; every derived state re-derives from
  its settles. Mounted whenever the pane holds no excursion; structurally absent
  while a lens or the generator is open, so nothing can edit beneath either. It
  consumes the selected level's editor-support data — completion, hover, format
  — through the adapter that lives with the editor's own surface.
- **The open lens** — mounted as the pane's occupant with the frozen embodiment,
  fixed for the whole mount: every control that could change the derivation (the
  snippet-type toggle, the level selector, the strict toggle) disposes the lens
  back to the editor first. Disposable practice is structural, not policed. Its
  resolved configuration is fixed too, with one deliberate edge: explicitly
  re-opening the SAME lens (a recommendation may target the open lens)
  re-resolves the configuration in place and announces as a fresh open — the
  embodiment never moves.
- **The generator** — the AI-authoring view, opened from editor mode by the
  Generate code button: the live buffer as a read-only seed (remix-first), a
  prompt, a takes-time warning, a preview, Accept or Discard. Accept lands the
  candidate through the region's one edit intake — an immediate absorb-settle,
  batched with the dispose, and everything re-derives from it; every other exit
  returns the buffer untouched, and the unmount retires any in-flight ask.
  Generation is an excursion from the home base, never a co-equal surface; the
  view documents itself in [`./generator/`](./generator/README.md).
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

Three surface classes: the editor is class 1 — never masked while mounted, and
structurally absent during any excursion; class 2 is the meta-level **nodes**
that must survive every posture — the selector, the strict toggle, the
snippet-type toggle, the guide and the Edit code button, all of them controls,
together with the announcer, which is not a control but must never go inert —
never masked, so the way back to the editor stays alive under every posture and
the region never falls silent (human ruling 2026-08-15); everything else — the
study panel and its lenses, and the generator view with its opening button — is
class 3, covered under strict while the code is out of level. The mask is an
inert overlay — a covered surface keeps its state beneath it — and the blocked
state names the level and the first violation, or the type-admission cause.
Every mask input — source, type, level, posture — is frozen during an excursion
(each commit disposes it first), so enforcement arises in editor mode, where the
masked strip bars opening lenses. Two paths can mount a lens under an active
mask: the honored focus, and a flush-at-open whose absorbed keystrokes settle
out-of-level code (the strip was live when clicked); on both, the mask applies
to the mounted lens identically. The full class-3 block applies while the
selected level's fit mark is does-not-fit or not-applicable-for-type — once the
code parses. While it does not parse, the mark is undetermined and that
carve-out wins regardless of type admission: the mask names no violation, and
the parse phases' panel nodes and their error lenses stay uncovered — the
supports a broken program needs are never the price of a wrong toggle. Under
warn, nothing is blocked anywhere — which is also what lets the generator open
freely over out-of-level code. Enforcement is mask, not filter — it never edits
fit or accessibility — and recommendation rendering passes through the same
mask.

The generator carries its class-3 membership at two elements, because those
elements sit in different containers. The view renders inside the maskable
content region and can begin masked through the same flush path as a lens. The
Generate code button renders in the control row, OUTSIDE both maskable
containers, so it takes the class-3 treatment at its own element — inert and
dimmed while masked, like the strip's selects: a study surface's opening
affordance, not a restoring control.

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
  immediately, absorbing any pending settle — its settle carries the editor's
  live source, so pending keystrokes are settled early, never discarded. During
  an excursion the loop is frozen against TYPING: the editor is absent, so no
  keystroke can raise an edit event; opening an excursion is itself an
  absorb-settle (the flush-at-open), and a type toggle's immediate settle runs
  only after its dispose. The one edit that fires from an excursion is an
  accepted program — an immediate absorb-settle, batched with the dispose that
  ends the excursion.
- **home base** — the editor's role in the surface pane: mounted whenever no
  excursion is open, the surface the learner authors in, the place every
  excursion returns to.
- **lens excursion** — the span from opening a lens (which replaces the editor)
  to returning (which remounts the editor, seeded from the live source). The
  program, its type, the level, and the posture are all frozen for the
  excursion; lens-internal state is per-mount and disposable.
- **pane occupant** — the one discriminated state slot naming what occupies the
  surface pane: the editor arm carrying its remount seed; the lens arm carrying
  the open lens's name, the settled pair it opened over, and the opened layer's
  overrides; or the generator arm carrying its open-time settled pair (the seed
  and coherence anchor). Exactly one — the region's `PaneOccupant` type.
  Deliberately not named "surface": that word belongs to the mask's surface
  classes.
- **flush-at-open** — opening an excursion absorbs any pending settle with the
  live buffer first, so the surface mounts over the code exactly as typed; when
  the live buffer already field-equals the settled pair (including an edit
  undone back to identical text), the settled identity is retained and nothing
  re-derives.
- **dispose** — closing the pane's open excursion (a lens or the generator) back
  to editor mode. Raised by the strip's none entry (lens only), the Edit code
  button, the generator's own accept and discard, every derivation-context
  commit (type, level, posture — the close precedes the change event on the
  bus), opening one surface over another, and the orphan defense (lens only).
  The close announces per arm: `lens-opened: null` for a lens,
  `generator-opened {open: false}` for the generator — and a generator dispose
  also cancels its in-flight job via the unmount. A commit with nothing open
  disposes nothing and announces nothing. The strip's none entry is a lens
  affordance in fact as well as in name: during a generator excursion every
  strip select already sits at its none entry, so there is nothing left to
  select and the affordance cannot fire. The generator's ways home are the Edit
  code button, Accept, Discard, and any derivation-context commit.
- **edit-return** — the distinguished way home: the Edit code button, rendered
  whenever the editor is away (a lens or the generator open), class 2 (never
  masked).
- **generator** — the pane's third occupant: the AI-authoring view (a read-only
  seed · a prompt · a preview · accept/discard), opened from editor mode by the
  Generate code button. Its own contract lives in
  [`./generator/`](./generator/README.md).
- **generator excursion** — like a lens excursion: the derivation context is
  frozen (the editor is absent; every derivation-context commit disposes first),
  and the job the view carries dies with its unmount.
- **generator socket** — the consumer-side seam the view calls: the committed
  aithor signature behind one `generate` function, held fixed for the mount.
  Refusal-as-data is total across it — it resolves, always.
- **generation job** — the view-local machine idle → loading → generating →
  preview | refused: per-mount, ephemeral, cancel-at-any-stage. Cancel retires
  the ask and returns the job to idle without leaving the view;
  dispose-as-unmount retires it and aborts the work underneath.
- **candidate** — what one generative ask returned, awaiting the learner's
  judgment. Deliberately not "proposal": a **proposal** is a lens's
  recommendation of a next study step, and the two travel through the same
  region.
- **ask** — one in-flight generation, from the moment the learner asks to the
  moment it answers or is retired. One at a time per mount; cancelling retires
  the current one, and a retired ask's answer changes nothing.
- **preview / accept / discard** — the candidate's three fates: rendered for
  judgment; committed by the OWNER through the edit intake (an immediate
  absorb-settle); or dropped with the buffer untouched.
- **placeholder socket** — the default generator socket: scripted stages, a
  marked remix of the seed, a `refuse:` demo path. It labels itself honestly and
  never pretends a model ran.
- **study derivation** — what one derive pass produces for one settled snippet:
  the frozen embodiment, the verdicts, the assessments, and the ranked
  recommendations — the bundle the top component holds and the rendered surfaces
  project from. Deliberately not "study state": the package's **study layer** is
  `embodiment.study` (embody's per-phase payloads), and the derivation contains
  an embodiment — the derive-anchored name keeps the two apart.
- **session choices** — the learner's session-scoped selections: the selected
  level key, the enforcement posture, the snippet type, the pane occupant's
  non-editor arms (the open lens, or the generator), and configuration tweaks.
  The top component is their single owner: surfaces raise intent upward through
  callbacks, the owner commits the change, and the event bus announces the
  committed changes other surfaces react to — configuration tweaks reach their
  lens as fresh props and announce nothing. No other component holds a session
  choice.
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
  (never masked while mounted; absent during an excursion) · class 2 =
  meta-level **nodes** that must survive every posture — the meta-level
  controls, the Edit code button among them, together with the announcer, which
  is not a control but must never go inert (never masked) · class 3 = everything
  else, the generator view and its Generate code button included (covered under
  strict while out of level). Class 2 enumerates **nodes** rather than controls
  because the split is exhaustive: the announcer is not a control and not class
  3, and leaving it outside the taxonomy would make it maskable — the one thing
  it cannot be, since `inert` removes a subtree from the accessibility tree and
  a silenced announcer is worse than none (human ruling 2026-08-15).
- **focus request** — the `lens` prop: a request honored through fit and
  accessibility, never a bypass.
- **display labels** — the five phases' learner-facing labels and the
  none-state's display string; presentation this region owns, distinct from the
  data names embody owns. The labels: `Source` · `Tokens · spelling` ·
  `AST · grammar` · `Environment · names` · `Evaluation · run`; the none-state
  displays as `plain JavaScript`. The labels live keyed by phase name — a record
  zipped against embody's runtime order constant, never a positional list, so
  the phase order keeps exactly one truth. **The four fit marks' learner-facing
  copy is display labelling too**, and takes the same discipline: keyed by the
  mark it renders, zipped against the mark vocabulary, never a positional list.
  A mark is machine vocabulary — a learner reads that their code _steps outside_
  a level, never that it is `does-not-fit`. **The empty station's reason is
  display labelling too.** A phase that is accessible and has no fitting lens
  carries its own reason — `Tokens, spelling: nothing studies this phase yet` —
  keyed by phase name and zipped against the same order constant, and a single
  collective line names how many such phases there are. The spoken form is not
  the printed one: the label's `·` becomes a comma, because a spoken label may
  be longer and plainer than a printed one and the two are not obliged to be the
  same string. **That count is derived, never written.** It is the number of
  phases that are both accessible and empty of fitting lenses, evaluated per
  settle — so it is not a property of the roster: a phase whose only lens fails
  its applicability on this program is empty too, and a **barred** phase is
  excluded entirely, because it carries a cause instead. The line takes the
  singular at one and does not render at zero. **And display copy never carries
  a machine token or a term this package coined** — the rule the marks already
  follow, and the reason the sentence a learner reads when the machine stops
  says _the grammar broke here_ rather than naming **the barring edge**. The ban
  is that narrow deliberately, and the region's own copy is why: the empty-count
  line says "four **phases** have nothing to open yet", and `phase` is package
  glossary vocabulary. A broader rule — _no contract vocabulary at all_ — would
  be falsified by the very string it is meant to govern. What a learner must
  never read is a token the machine uses to talk to itself (`does-not-fit`) or a
  word this package minted for its own contract (**barring edge**, **station**);
  an ordinary word that the glossary also happens to define is fine, and often
  the plainest available. The contract term names the thing for this package;
  the copy names it for the learner, and the two are allowed to differ.
- **the rail** — the lifecycle rendered as the machine's own conveyor: a line
  carrying one **station** per phase in the machine's fixed order, with the
  **barring edge** between the last reachable station and the first waiting one.
  Lives in `rail/` with its stations, their trays and the edge (human ruling
  2026-08-15). **Class 3**, and by exhaustion rather than by lineage: it is not
  editor-based, and it is not a meta-level node that must survive every posture,
  because it neither restores conformance nor carries the region's voice — the
  announcer does that. So it dims **whole** under strict, partial dimming of a
  lifecycle line reading as a machine state rather than as a posture.
  **Supersedes the lifecycle strip**, the row of per-phase selects this region
  shipped first; the strip's own vocabulary is retired with it — lineage, which
  is why it is recorded here and grounds nothing. Designed in
  [`ux/wireframes.md`](./ux/wireframes.md) and drawn there through every state.
- **station** — the rail's per-phase element: one per phase, in the machine's
  fixed order, carrying its name, its mark, and its tray where the phase has
  one. Lives in `rail/` with the line it sits on (human ruling 2026-08-15).
  **Never the phase itself** — the phase is data, the station is what renders
  it. Whether a station with a tray and a station with nothing to open are one
  shape or two is the first question `types.ts` answers, and this entry
  deliberately leaves it open: four of five phases have nothing to open, so the
  empty case is the ordinary one, and a definition that assumed a control would
  be wrong four fifths of the time. The word is reclaimed rather than minted,
  and it is reclaimed against two other senses. A retired architecture used
  `station` as a synonym for `phase`; that sense is formally retired (human
  ruling 2026-08-15) rather than left to collide silently, because the two are
  one-to-one and a reader carrying the old meaning would be right by accident
  forever. The word also sits on a banned-term list that several campaign
  handoffs instruct agents to grep by hand — nothing mechanized enforces it —
  and the same ruling lifts that ban for this region. Elsewhere in the package
  `stations` names the curriculum's five chain-points, a live sense this region
  neither claims nor retires.
- **the barring edge** — the boundary between the last reachable phase and the
  first waiting one: where the machine stopped. Rendered between stations rather
  than on one, because a phase's own failure never bars it. The definition is
  phase-level and the rendering is its consequence, so a document that holds no
  position can still name the thing. Deliberately not "the break" (human ruling
  2026-08-15): this package teaches `break` as a language construct and uses it
  again as a scope-pop reason, this glossary already says **barred** for the
  mechanism, and `break` cannot be a binding name in JavaScript — so the term
  would be renamed at every call site and the document's name would drift from
  the code's. **The rename is part-of-speech-scoped**, because every one of
  those reasons is a reason a contract NOUN cannot be spelled that way and none
  of them reaches a verb: only the noun naming this boundary becomes
  `barring edge`, while a parse that _breaks_, a split that would _break_, and a
  learner who _breaks_ their program all keep the word. Two registers sit either
  side of the term — a learner's perception narrated back takes the gloss _where
  the machine stopped_, and learner-facing display copy takes neither, per
  **display labels**.
- **tray** — one station's kit, disclosed beneath the rail and pushing the pane
  down rather than covering it. A station whose phase has no fitting lenses has
  no tray and no disclosure control — not a disabled one. Lives in `rail/` with
  the station that discloses it (human ruling 2026-08-15).
- **nameplate** — the line above the surface pane naming its current occupant,
  so the pane is a named place a learner moves between rather than a box whose
  contents change without comment. Rendered by the **top component**, not by the
  rail (human ruling 2026-08-15): what it names is the **pane occupant**, and
  that is the top component's own state — a nameplate elsewhere would have to be
  told what the pane holds by the one component that already knows.
- **announcer** — the permanently-mounted, visually-hidden live region that
  speaks what a sighted learner reads off the rail. **Class 2**, the only member
  of that class that is not a control: it restores nothing, but it must survive
  every posture for the same reason the controls do. It renders outside both
  maskable containers, because `inert` removes a subtree from the accessibility
  tree and a silenced announcer is worse than none — and its class is what makes
  that placement a requirement rather than a preference. **Rendered by the top
  component, not by the rail** (human ruling 2026-08-15), and the placement rule
  is the reason: only the composition root renders both maskable containers, so
  only it can guarantee a node sits outside both. Mounted from `rail/`, the
  guarantee would be a claim about containers that directory does not own. Its
  utterances are enumerated, not open: the pane's occupant changing, a
  transition into or out of the blocked state, and the barring edge moving —
  **never a settle**, which fires whenever typing pauses. It is the single voice
  for the blocked state's cause; no other node claims to announce that sentence.
- **house token** — a CSS custom property, prefix `--sl-`, naming one of this
  package's own presentation concepts: a surface, a text weight, a hairline, the
  focus ring, the inert dim, the mask scrim, or a fit mark's role. _House_ is
  this tree's established modifier for what is ours rather than the framework's
  — house rule, house taxonomy, house style — and a planned coloring foundation
  is expected to use it the same way for the program's own palette, so the two
  would read as one family with two scopes. That foundation does not exist yet;
  the modifier is borrowed from this tree's own usage, not from it. Three rules
  keep the vocabulary from spreading. A house token names a **house** concept
  and never a single lens's — the moment one names a lens's palette the seam is
  gone. It names a **role** and binds no hue, following the precedent the
  `spellme` lens set when it named _attested_ and _diverging_ and deferred their
  colours to custom properties. And it colours the **surround**, never the
  program: a token that changes how a character the learner typed looks belongs
  to the colorizing leaf, not here. Deliberately not "chrome token" — **chrome**
  already names a code surface's CodeMirror frame elsewhere in this package.
  Deliberately not "instrument token" either: this region calls itself _the
  instrument_ in its own prose, but a language level's notional-machine document
  already calls the NM _the mechanical instrument_, and spelling that collision
  into a hundred identifiers would make it permanent. The region's existing
  usage is left alone; the token vocabulary declines to deepen it.
- **house token defaulting** — how a house token resolves against the embedding
  site. Each is declared once with a fallback chain that ends in a literal, so
  the vocabulary is total: where a host ships Infima the token defaults from the
  matching `--ifm-*` value, and where it ships nothing the literal carries. This
  is the pattern the editor's own theme already uses — its custom properties
  resolve in the host page and its fallbacks carry any other host — and it is
  what lets one stylesheet serve both Docusaurus and an embedded host. **A lens
  adopts by writing `var(--sl-…, its-own-current-value)` and declines by writing
  nothing**; no import edge exists either way, and declining is a byte-for-byte
  no-op.
- **tone** — which rendering of the house token vocabulary is in force on **this
  region's own surfaces**, light or dark. Resolved by a cascade and never by a
  prop, in this order: an explicit surface declaration, then the host's
  `data-theme`, then the operating system's preference **only** where no
  `data-theme` is present at all — the embedded, non-Docusaurus host. The region
  never asks the host for a tone and the host never passes one. The order is
  load-bearing rather than tidy: a stylesheet keyed on the operating system
  alone goes dark while a host whose own switch says light stays light, which is
  the split this package has already shipped once. **The scope is deliberate and
  the limit is honest** — a lens that keys its own dark block on the operating
  system is not reachable by a custom-property cascade, so this entry states
  what binds here and cannot state what binds there. Making the cascade
  package-wide is a migration with named files, owed to whichever campaign
  claims it, not a rule this region can declare on another's behalf.
- **composed study configuration** — (package glossary owns the meaning) the
  mechanics here: rosters joined once at mount, loudly; the cascade re-resolved
  per lens name as any layer changes, the learner's layer final.

## Navigation

- Package root: [`../README.md`](../README.md) — the domain model and the
  package glossary.
- [`DOCS.md`](./DOCS.md) — this region's architectural sketch.
- The user twin: [`ux/`](./ux/) — `personas.md`, `user-journeys.md`, and
  `wireframes.md`. All three are written because this region is where the
  package's readers meet an interface at all: the `spellme` lens's own twin
  records that "personas were not written because the reader in front of this
  lens is the package's, not this lens's"
  ([`../lenses/spellme/README.md`](../lenses/spellme/README.md)), and that debt
  is paid here rather than at the package root, because the orchestrator is what
  gives the package a user experience. The directory is named for the concern
  its menu serves rather than for one modeled thing (human ruling 2026-08-14).
- [`types.ts`](./types.ts) — the host surface: `StudyLensesProperties`,
  `FitMark`.
- The rendered surfaces and derivation libraries document themselves in their
  own directories.
