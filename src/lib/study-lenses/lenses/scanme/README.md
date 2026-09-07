<!-- cspell:ignore scanme spellme Punctuator IdentifierName PrivateIdentifier -->
<!-- cspell:ignore NumericLiteral StringLiteral RegularExpressionLiteral -->
<!-- cspell:ignore TemplateSubstitutionTail DivPunctuator RightBracePunctuator -->
<!-- cspell:ignore HashbangComment LineTerminator wireframes -->

# scanme

The `scanme` lens — a **watch-the-scanner exercise** over the frozen embodiment,
for the `tokens` phase. The program's source is drawn once, whole, and stays
where it is. The learner steps a position **forwards and backwards** through the
input elements, and the source **re-colours in place** to show what became of
each one: it became a token, it was set aside, or it evaporated.

Sibling of [`../spellme/`](../spellme/README.md) over the same sequence, and the
difference is the whole design: **spellme asks, scanme shows.** There is no
claim, no verdict, no attempt count and no way past, because there is nothing to
get wrong.

## Why this lens exists

Not because the family ruling permits it — that is the authority, not the
reason. The reason is a doubt `spellme`'s own twin records and cannot answer.
Its wire-frames argue that consumed source should dim in place rather than
scroll away, because "a deleted character is gone and proves nothing; a dimmed
one that appears in no container below is the evidence" — and then concede:

> ⚠ **doubt.** It is also the argument for making the evaporation loud at the
> moment it happens — the standing evidence is passive, **and a learner watching
> their success land on the token tape is not looking at it.**

[read: [`../spellme/ux/wireframes.md`](../spellme/ux/wireframes.md) §
Mid-stream; its Journey 1 says the same from the learner's seat.] A learner
mid-claim is looking at their own answer. **A learner with no claim to make is
looking at the source.** That is this lens, and it is why the exercise had to
lose the claim rather than gain a mode.

It is its own lens rather than a mode of `spellme` by ruling: "**Each further
game is its own lens** (human ruling 2026-08-13), over the same sequence" [read:
[`../spellme/README.md`](../spellme/README.md) § Future direction].

## What it reads, and what it must not derive

The input-element sequence arrives **already on the facts**, at
`facts.tokens.value.inputElements`. This lens **reads that member and derives no
input element**. [`lib/scanning`](../../lib/scanning/README.md) owns the
vocabulary, the template folding, the `}` disambiguation and the trivia; the
embodiment's factory calls that leaf and publishes the result.

The vocabulary is inherited unchanged — _input element_, _element kind_,
_trivia_, _tiling_ and _run collapsing_ are all that leaf's, and this lens uses
all five as it finds them.

**"Derives no element" is not "derives nothing."** This lens derives a **fate**
and a **mark** per element, exactly as `spellme` does, and the mark reads a
comment's own text. The line being held is that no _element_ — no boundary, no
kind, no span — is decided here.

## The three fates, and the mark

Inherited from [`../spellme/README.md`](../spellme/README.md) § The three fates,
and the mark, and used unchanged. Every character meets one of three fates:

| Fate            | What happens                     | The variant that leaves a mark                    |
| --------------- | -------------------------------- | ------------------------------------------------- |
| becomes a token | lands on the token tape          | —                                                 |
| set aside       | goes to the jar, and stays there | a block comment carrying a line terminator        |
| consumed        | evaporates                       | a line terminator — automatic semicolon insertion |

The **fate** is a reading of the element kind, and it is a **consumer's** word
by the derivation's own account: "**Destinations.** Where an element goes, what
it means to a learner, whether it is claimable — all consumer vocabulary. This
module reports what the scanner produced and says nothing about what becomes of
it." [read: [`../../lib/scanning/DOCS.md`](../../lib/scanning/DOCS.md) § Out of
scope.]

The **mark** names one property and only this one: **the syntactic grammar reads
a line break here.** Two elements carry it — a `LineTerminator`, which is one
directly, and a block comment containing one, which ECMA-262 §12.4 makes one for
the syntactic grammar. It names a **property, never a consequence**: whether
automatic semicolon insertion fired depends on the production it lands in, and
this lens does not know that.

⚠ **The table above names the destinations, and this lens draws none of them.**
`spellme` has a token tape and a jar for elements to arrive in. Here nothing
moves: the fate is drawn **on the character where it already is**. A set-aside
comment is marked as set aside without going anywhere, and an evaporating space
is marked as evaporated while still occupying its column. That is the whole
difference in the surface, and it is what lets this lens draw the one thing
`spellme` cannot — see § UI structure.

**The fate table and the mark predicate are this module's own copies, and that
is a decision rather than an oversight** — see [`DOCS.md`](./DOCS.md) §
Decisions for the grounds and for the trigger that would extract them.

## What the learner does

There is one control pair — **step forward, step back** — and one thing to look
at. Stepping forward reads one more input element; the source re-colours to show
what became of it. Stepping back un-reads it.

**The position is a count, not an index, and there are `n + 1` of them over `n`
elements.** Position `0` is **before the scanner has read anything** — the whole
source plain, nothing yet become of anything. At position `k`, the scanner has
read `k` elements, and **the element it most recently read is the current one**:
the one whose fate just resolved, and the one the learner is looking at.

**Every element is stepped onto, trivia included, and that is the design
point.** `spellme`'s cursor advances past whitespace, line terminators and
comments, because they are not claimed there. This lens stops on all of them,
because watching whitespace evaporate and a comment lift out **is the content**.
`spellme` advances past exactly what this lens exists to show.

⚠ **A run of whitespace is ONE element, not one per character**, and so is a run
of line terminators — the scanning leaf collapses each maximal run, its one
deliberate departure from the specification. So three blank lines vanish in a
**single** step, and a five-space indent in another single step. A learner
watching this should see the machine take a whole run in one turn, because that
is what the published sequence says happened. The leaf names the reversal —
splitting a run's text per character recovers the specification's reading — and
this lens **does not take it**: the published sequence is what every other
consumer of this member sees, and drawing a different one here would teach a
partition nothing downstream agrees with.

## When the scan stops early

A program that does not lex is **still served**, and this is the sharpest
difference from `spellme`.

A failed tokens stage publishes an **account**: the tokens produced and comments
set aside when the failing turn was reached, plus a **bounded** input-element
sequence over "exactly what the completed turns reach — the source cut at the
account's own extent (the end of the last token or set-aside comment, whichever
is later)", handed to the same scanning leaf under its unchanged tiling contract
[read: [`../../embody/README.md`](../../embody/README.md) § Failure grammar].
**It still tiles; it tiles a prefix.**

So the surface has two regions instead of one:

- **the walk** — the published elements, tiled over the account's extent,
  stepped exactly as a whole reading is;
- **the remainder** — the source past that extent, covered by **no element**. It
  is not "the rest of the program the learner has not reached yet". It is the
  turn the scanner was in the middle of when it gave up, plus everything after.

**The learner reaches the stop by walking into it, and the explanation is there
when they arrive** (human ruling 2026-09-05). Nothing is announced up front and
nothing interrupts: the last forward step lands on the last published element,
and at that position — and only there — the surface says where the scan stopped
and reports the machine's own message.

**This lens explains a stopped scan; it does not ask anyone to predict one.**
That is the boundary with `spellme`, and the same ruling draws it: both lenses
explain a failed tokenization, and the difference is the trigger — **`scanme`
explains on passive arrival, `spellme` explains only if and after a learner
mispredicts.** Neither is the other's subset.

⚠ **The extent is the account's own, and it is not `cause.offset`.** "Where the
cause reports an `offset`, the extent sits at or before it — the offset is the
machine's report; the extent is the account's own, defined even when the machine
reports none" [read: [`../../embody/README.md`](../../embody/README.md) §
Failure grammar]. The walk ends at the extent. The machine's complaint points at
the offset, which may sit **later**, and the characters in between are inside
the turn that failed. The surface must not draw the offset as the walk's end,
and it must still work when the machine reports no offset at all.

⚠ **`ok: false` is "a discriminant, not a wall — an accepted cost, weighed"**
(human ruling 2026-09-01): under one shared `value` name, "a read that skips the
narrowing can reach an account where it once reached nothing." Nothing
structural stops a surface drawing an untrustworthy prefix as though it were
trustworthy. **This surface distinguishes them, because nothing else will.**

## The lens object

The module's default export is a frozen `Lens` per [`../types.ts`](../types.ts):

- `name: 'scanme'` · `phase: 'tokens'`
- `label: 'step through the scan'` — what a learner reads where this lens is
  offered. Authored for this surface rather than lifted from this file's first
  sentence; `name` is machine vocabulary and no surface may draw it.
- `main` — the React component: `<div data-lens="scanme">`, the source, the two
  step controls, the stop where there is one, and the legend.
- `applicability(facts)` — **the published member is present**, on either arm of
  the tokens stage: `facts.tokens.value?.inputElements !== undefined`.

  **Deliberately NOT `facts.tokens.ok && …`**, which is `spellme`'s gate and
  would decline exactly the case this lens exists to show. The tokens stage has
  four states and this gate serves two of them:

  | `ok`    | `inputElements` | served? | what it is                                          |
  | ------- | --------------- | ------- | --------------------------------------------------- |
  | `true`  | present         | **yes** | a clean tokenization — the whole source             |
  | `true`  | absent          | no      | embody machinery defect; the enrichment threw       |
  | `false` | present         | **yes** | a partial reading — the prefix that lexed           |
  | `false` | absent          | no      | the account degraded — the element derivation threw |

  The two declines are the same condition stated once: **without the sequence
  there is nothing to walk.** Both are embody's own machinery reporting loudly
  at its own site, never a property of the program, so a second report from a
  consumer that did not cause it would be duplicate noise. **The decline is
  silent** — no logging, no side effect of any kind; this function must be pure
  and synchronous over the facts alone, per the kind's `Gateable` contract.

  **No syntax tree is read**, so a program that lexes but does not parse is
  served in full.

- `config` — **absent.** See § Configuration.
- `recommend` — **absent.** This lens proposes no next study step; the optional
  field is omitted rather than implemented as an empty result.

**How it reaches a learner: `scanme` is a built-in lens** (human ruling
2026-09-05) — it belongs on `orchestrate`'s built-in roster, which is what every
default mount offers. ⚠ Registration itself is a **Phase-2 obligation**: a lens
with no working `main` cannot be put on a roster a learner meets, and this
module's Phase 0 writes no implementation. `scanme` is **not** injected anywhere
in the meantime — injected **and** registered puts one name on the roster twice
and `joinLensRoster` throws.

## Configuration

**This lens has none, and the absence is a decision.** The kind contract permits
it: a lens without a factory gets the shared merge applied to the cascade
directly [read: [`../types.ts`](../types.ts), the `config` doc].

Three keys an educator might reach for, and why each is refused:

- **an opening position** — it opens before the first element, always. A surface
  whose whole first lesson is "nothing has happened yet" cannot start partway.
- **skip the trivia** — that is `spellme` with a strict-scan flag, named in its
  own Future direction. Stepping onto trivia is this lens's entire subject; a
  flag turning it off produces a worse `spellme`.
- **an auto-play speed** — a control, not a configuration, and not asked for.

A configuration key here would be a setting an educator could use to make the
lens teach less. If one is ever owed, it arrives with a reason and a default.

## UI structure

```text
<div data-lens="scanme" data-position="N" data-reading="whole|partial">
  <section data-scanme-source>          — the program, drawn once, in place
    <span data-scanme-element           — one per element, in sequence order
          data-element-kind="…"
          data-fate="token-tape|set-aside|consumed"
          data-standing="scanned|current|unscanned"
          data-marked                   — presence only
          aria-current="true">          — on the current element alone
    <span data-scanme-remainder>        — partial readings only: the source
                                          past the walk's extent
  <nav data-scanme-controls>
    <button data-scanme-back>           — absent at position 0
    <button data-scanme-forward>        — absent at the last position
  <div data-scanme-stop>                — partial readings, last position only
  <div data-scanme-legend>              — the three fates
</div>
```

**The characters never move, and that is the contract.** One span per element,
in sequence order, holding that element's verbatim text; stepping changes
`data-standing` and `data-position` and **nothing else**. The span count does
not change, no span's text changes, and no span is added or removed by walking.
A test that steps and then asserts the span count and each span's text are
unchanged is the test that this lens does what it says.

**`data-position`, and deliberately not `data-cursor`.** `spellme`'s
`data-cursor` indexes **elements** and rests on the element being asked about.
This is a **count of elements read**, over `n + 1` values, and its zero means
_before anything_. Two different quantities must not share one attribute name —
the package glossary's own rule against homonyms, applied to a selector.

**`data-standing` is the axis `spellme` has no analogue for**, and it is what
"highlighted in place depending on what becomes of it" actually needs. The fate
says where an element ends up; it says nothing about whether it has got there
yet. **What a learner sees is the pair.** An unscanned space is plain source; a
scanned one is a space that evaporated. Same fate, different draw. `spellme`
cannot express this at all: it encodes "already taken" as membership in one
joined `data-spellme-consumed` span — a structural fact rather than an attribute
— so it can neither carry a third value nor re-colour without re-partitioning.

**This is the tree `spellme` said it was missing.** Its README records that the
promise of an evaporating element drawn hatched "has no carrier in the tree as
it stands … Rendering the consumed run per element would give it one, and that
is a contract question rather than a styling one" [read:
[`../spellme/README.md`](../spellme/README.md) § UI structure]. This surface is
that per-element rendering. It does not merely fix a gap over there; it is the
contract that sentence was waiting for.

**`data-marked` is presence-only**, and this diverges from `spellme` on purpose.
There, a jar entry carries `data-marked="true|false"` while a consumed break
leaves a presence-only `data-spellme-break` on the token tape — two shapes for
one property, because there are two regions. Here there is one region, so there
is one shape, and it is the presence-only one: the same absence-is-the-state
rule the family already follows.

**`aria-current` carries the current element, and no `data-*` hook duplicates
it.** A moving position signals nothing to a screen reader, and `aria-current`
is the ARIA attribute for the current item in a set. This is `spellme`'s own
2026-08-26 ruling applied: which element-kind button is pressed rides
`aria-pressed` and nothing else, because "the accessible name of the state and
the hook for drawing it are the same thing."

**Not carried, and the absences are the point:** no `data-claimed`, no
`data-attempts`, no `data-*-verdict`, no `data-extent`, no element-kind picker,
no submit control, no `aria-live` region. There is no claim to announce.

The `data-lens` attribute plus the `data-scanme-*` family, `data-position`,
`data-reading`, `data-element-kind`, `data-fate`, `data-standing` and
`data-marked` are harness selectors and CSS hooks; renaming any is a contract
change. It is `data-element-kind` and never bare `data-kind`: the package
glossary owns _kind_ for a kind of study utility, and the sibling leaf
[`lib/classifying`](../../lib/classifying/README.md) publishes a different
element taxonomy over the same tokens.

**Selectors bind to attributes, never to label text.**

## Glossary — lens terms

The package glossary owns the shared meanings;
[`lib/scanning`](../../lib/scanning/README.md) owns _input element_, _element
kind_, _trivia_, _tiling_ and _run collapsing_, and this lens uses all five
unchanged. These are this lens's own.

⚠ **Two words in this module's neighbourhood are homonyms, and both are resolved
here rather than left to collide.**

- **_gate_** — in `spellme` this is a **learner-facing rule**: the stream
  advances only on a correct claim. **This lens has no such thing.** Where this
  document says _the gate_ it means `applicability` — whether the lens is
  offered at all — which every lens has and which `spellme` calls a _decline_.
  Both senses are avoided in the prose above; the second is written as
  _applicability_ or _decline_ throughout.
- **_prediction_** — the package's word for the wider predict-and-check
  practice, and the Frogrammer's whole stance: "predict what a phase will do".
  The human's seed sentence for this lens says "without prediction", and **that
  sentence is the seed, not the glossary**: read in package vocabulary it would
  say this lens is not for frogrammers, which is the opposite of true. What this
  lens lacks is a **claim**, a **verdict** and a way to be **wrong** — and a
  learner is welcome, and expected, to predict what the next step will do before
  taking it. Nothing here judges the prediction, which is the difference from
  `spellme`.

- **the walk** — the element sequence as this lens holds it: every input element
  carrying the fate its kind implies and, where it has one, its mark. On a
  partial reading the walk is the account's bounded sequence, and it ends at the
  account's extent.
- **position** — how many elements the scanner has read. One of `n + 1` values
  over an `n`-element walk; `0` means before anything has been read. Not an
  index into the walk, and not `spellme`'s cursor.
- **step** — one move of the position, forward or back, by exactly one. It is
  clamped: stepping back at `0` and forward at the last position do nothing, and
  the control that would do nothing is **absent** rather than disabled.
- **standing** — where the scanner stands relative to one element: `scanned`,
  `current`, or `unscanned`. Derived from the position and the element's own
  place in the walk; never stored, and never a judgement of anything.
- **the current element** — the one the scanner **most recently read**, and the
  one whose fate the learner is looking at. There is none at position `0`,
  because nothing has been read.
- **the fates** — where an element ends up, derived from its element kind: the
  token tape, the jar, or nothing. **Every** element has one. This lens draws
  them in place and moves nothing, so the tape and the jar are names for
  destinations rather than regions on this surface.
- **mark** — one property, and only this one: the syntactic grammar reads a line
  break here. Two elements carry it. It is never a judgement of anything a
  learner did.
- **the remainder** — on a partial reading, the source past the walk's extent,
  covered by no element. The turn the scanner was inside when it stopped, plus
  everything after it.
- **the stop** — the last position of a partial reading, where the surface
  reports that the scan ended and what the machine said about it. Reached by
  walking into it; never announced ahead of time.
- **decline** — `applicability` answering `false`, so the lens is never offered.
  Nothing about a decline is visible here, because in that state this lens is
  not drawn.
- **the published member** — this lens's shorthand for
  `facts.tokens.value.inputElements`, the optional field the sequence arrives
  on, on either arm. This lens reads it and never fills it.

## Edge cases

- **An empty program** — one position and no elements. The source region is
  empty, both step controls are absent, and there is nothing to walk. This is
  the case that decides the position model: with `n` positions there would be
  none at all to render.
- **A program that is only trivia** — a **fully working session**, and arguably
  this lens's best one. Every step lands on something that evaporates or is set
  aside, and the learner watches the machine spend a program that produces no
  tokens at all. ⚠ This is the exact inverse of `spellme`, where the same
  program leaves nothing claimable and the claim form is absent; do not carry
  that reading over.
- **A single-element program** — not an edge case. It is the ZOMBIES `One` test,
  and the surface behaves as the general case with `n = 1`. Named here only
  because it looks like one.
- **A program that lexes but does not parse** — served in full, whole reading,
  no syntax tree consulted. "Your spelling is fine, your grammar is not" is
  worth seeing.
- **A program that does not lex** — served as a partial reading, ending at the
  stop. See § When the scan stops early.
- **A partial reading whose prefix is empty** — the account is published on
  **every** tokens failure, and "a stop before any complete turn yields empty
  channels", so a source failing on its first character produces a walk of zero
  elements with a remainder covering everything. The surface is then the stop
  and nothing else: no spans, no step controls, and an explanation of why. **The
  reason there is nothing to draw is the entire content.**
- **A partial reading whose cause reports no offset** — the walk still ends at
  the account's own extent, which is defined regardless, and the stop reports
  the message without pointing at a character.
- **Both ends of the walk** — stepping back at position `0` and forward at the
  last position do nothing, and each control is **absent** rather than disabled
  at the end it cannot move from. Presence is the state, as everywhere else in
  this family.
- **A hashbang** — `#!…` at offset 0 is its own element kind and is **set
  aside**, not evaporated: it is authored text that was lifted out and kept, and
  evaporating it would teach that it was layout. The specification discards it
  without ruling on where a surface should put it, so this is a lens's call, and
  this lens makes the same one `spellme` does. It carries no mark.
- **Script versus module** — the reading depends on the goal, and the goal is
  the orchestrator's snippet-type toggle, which stays visible beside the lens
  and disposes it when changed. **This lens renders no type control of its own**
  and holds no copy of that state.
- **Nested templates** — `` `a${`n${q}`}c` `` is five elements, four of them
  template parts and one an identifier. Five steps, and the nesting is visible
  only as the boundaries between them.

## Inherited limits

Limits of the published sequence, not of this lens — but a lens that draws every
element **in place** exposes them where a tape-and-jar layout does not, so they
are stated here rather than left upstream.

- **A slash after `await` is mis-read.** In `async function f(){ await /re/ }`
  the tokenizer emits `/`, `re`, `/` where the language has one
  `RegularExpressionLiteral`; "the sequence this module returns is therefore
  wrong on that input, and it cannot detect it" [read:
  [`../../lib/scanning/README.md`](../../lib/scanning/README.md) § Where this
  module and the specification part ways]. On this surface that is **three
  visibly wrong spans** rather than a mis-labelled entry in a list. Programs put
  in front of this lens should not contain it.
- **Tiling is not fidelity.** The three elements above cover exactly the span
  the one correct element would have, so the tiling invariant holds on an input
  the sequence reads wrongly. Tiling is a property of the published sequence,
  never evidence that the sequence is the specification's.
- **Whitespace and line-terminator runs are collapsed**, which is the leaf's one
  deliberate departure from the specification — see § What the learner does.
- **The parser refuses some programs the language accepts.** A reserved word
  spelled with a Unicode escape fails the tokens stage, so what this lens serves
  there is a partial reading of a program V8 itself runs.

## Where this lens stops

- **Asking the learner anything.** No claim, no verdict, no score, no attempts,
  no way past, no one-more-character question. If a design decision starts to
  need one of those, it belongs to `spellme`.
- **Explaining why a tokenization failed is shared with `spellme`, and the
  boundary is the trigger** (human ruling 2026-09-05). Both lenses explain a
  stopped scan. `scanme` explains it on **passive arrival** — the learner walks
  into the stop and it is there. `spellme` explains it only **if and after a
  learner mispredicts**. ⚠ `spellme` does not do its half yet; that work was
  deferred pending exactly the embody change that has since landed, so expect
  that lens to move.
- **"The scanner's stopping point" is a third lens** (human ruling 2026-08-13),
  and **this document does not draw the boundary with it.** The 2026-09-01
  ruling says the boundary between the deferred failure work and that lens "is
  not yet drawn and is the first thing the deferred unit has to settle", and
  embody has since published the prefix naming "the scanner's-stopping-point
  lens of the spellme family" as its reader. The 2026-09-05 ruling above settles
  the `scanme`/`spellme` half of a three-way seam; **the third lens's share is
  unsettled and is nobody's to claim by writing a README.** What this lens does
  is show where a scan ended while walking a program. Whether asking a learner
  _where the scanner stopped, and why_ is a separate exercise remains open.
- **The empty-phase caption.** When the published member is absent altogether
  this lens declines, as every lens of this family does, and the phase draws its
  own empty-station reason. That caption belongs to the orchestrator, and
  `spellme`'s README already records the cost and denies in terms that a second
  lens fixes it.
- **Deriving the element sequence, the vocabulary, or the tiling** — and
  **fetching** any of them.
- **Scoring, persistence, cross-mount state, and progress reporting.**
- **Binding the fates to hues.** The roles are named here; the hues resolve
  through CSS custom properties, and the package-wide palette question is not
  this lens's to settle.

## Future direction

- **Per-character trivia.** The leaf names the reversal of run collapsing, and a
  learner who wants to see five spaces taken as five turns is asking a coherent
  question. It is refused today because it would draw a partition no other
  consumer agrees with; a flag that says so out loud is the shape it would take.
- **A step that plays.** Walking a sixty-element program by hand is sixty
  presses. Whether an auto-advance teaches or merely entertains is a question
  for a running surface.
- **The third lens.** See § Where this lens stops.

## Navigation

- Region: [`../README.md`](../README.md) — the lens kind's mechanics.
- The sibling over the same sequence:
  [`../spellme/README.md`](../spellme/README.md).
- The derivation's vocabulary and rules:
  [`../../lib/scanning/README.md`](../../lib/scanning/README.md) —
  documentation, not an instruction to call it.
- [`DOCS.md`](./DOCS.md) — this lens's architectural sketch and decisions.
- [`types.ts`](./types.ts) — the lens-local domain model.
- **The user twin** (`twin-doc: user`, human ruling 2026-09-05):
  [`ux/`](./ux/user-journeys.md) — a journey document and wire-frames. Those two
  because this exercise's two live risks are **pacing** (is the twelfth step
  still worth taking?) and **arrangement** (one region carrying three fates and
  three standings at once).
- Kind contract: [`../types.ts`](../types.ts).
- Embodiment contract: [`../../embody/types.ts`](../../embody/types.ts).
