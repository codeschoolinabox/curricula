<!-- cspell:ignore Punctuator IdentifierName PrivateIdentifier NumericLiteral -->
<!-- cspell:ignore StringLiteral RegularExpressionLiteral TemplateSubstitutionTail -->
<!-- cspell:ignore DivPunctuator RightBracePunctuator LineTerminator CommonToken -->
<!-- cspell:ignore HashbangComment munch colour colours spellme lookahead -->

# spellme

The `spellme` lens — a **drive-the-scanner exercise** over the frozen
embodiment, for the `tokens` phase. The program's source is an input tape. The
learner stands where the scanner stands and **claims** the next input element:
what kind it is, and how far it reaches. A correct claim makes the element fall
into place — the characters lift off the input tape and land on the token tape —
and the cursor advances. A wrong claim leaves it where it is.

Sibling of [`../writeme/`](../writeme/README.md) by name and by shape: writeme
has you write the program back, spellme has you spell it out.

The exercise is a **stream**, one input element at a time, rather than a
partition of a whole region (human ruling 2026-08-13).

There is no score and no verdict on the session. There is a **gate** (human
ruling 2026-08-13): the stream advances when the learner is right, and waits
when they are not.

Between one claimed element and the next, the machine's leavings move on their
own and in full view — **whitespace evaporates**, and a **comment is lifted out
and set aside** into a jar that stays visibly full. The learner never claims
either (human ruling 2026-08-13). Watching what the scanner discards is the
point of not being asked about it.

**The element sequence is not this lens's derivation, and this lens does not go
and get it.** [`lib/scanning`](../../lib/scanning/README.md) turns the tokens
fact into the specification's input elements — the vocabulary, the template
folding, the `}` disambiguation, the trivia. **The embodiment's factory calls
that leaf and publishes the result**, so the sequence arrives already on the
facts, at `facts.tokens.value.inputElements`. This lens reads that member and
builds an exercise on it; it calls nothing, it derives no element itself, and a
second lens of this family reads the same published member rather than
re-deriving it.

The member is **optional** — absent exactly when the derivation itself defected,
which is a report about embody's machinery and never a property of the program
([embody/README.md § Reading the embodiment](../../embody/README.md#reading-the-embodiment)).

## The three fates, and the mark

Every character meets one of three fates. Two are quiet, and neither is quite
nothing.

| Fate            | What happens                     | The variant that leaves a mark                    |
| --------------- | -------------------------------- | ------------------------------------------------- |
| becomes a token | lands on the token tape          | —                                                 |
| set aside       | goes to the jar, and stays there | a block comment carrying a line terminator        |
| consumed        | evaporates — see § UI structure  | a line terminator — automatic semicolon insertion |

The **fate** is this lens's word, derived from the element's kind —
`lib/scanning` reports the kind and says nothing about destinations.

The jar is not a bin, and ECMA-262 §12.4 is exact about why: _"Comments behave
like white space and are discarded except that, if a MultiLineComment contains a
line terminator code point, then the entire comment is considered to be a
LineTerminator for purposes of parsing by the syntactic grammar."_ Two programs
whose token streams are identical to the character can therefore behave
differently, and nothing downstream shows it — the syntax tree has dropped the
comment, the token stream never held it.

(human ruling 2026-08-20) So a comment carrying a line terminator lands in the
jar **marked** — and so does an evaporating line terminator, which is one
directly. The mark is the same property in both cases: **the syntactic grammar
reads a line break here.** That is why it is one field and not two, and why the
table above gives two of the three fates a marking variant.

The mark names a **property, never a consequence**: whether automatic semicolon
insertion fired depends on the production it lands in, and this lens does not
know that. It says a line break is read here, not that anything followed from
it.

## What the learner claims

Ten of `lib/scanning`'s fourteen kinds are claimable — `Comment`,
`HashbangComment`, `WhiteSpace` and `LineTerminator` advance on their own:

`IdentifierName` · `PrivateIdentifier` · `Punctuator` · `DivPunctuator` ·
`RightBracePunctuator` · `NumericLiteral` · `StringLiteral` · `Template` ·
`TemplateSubstitutionTail` · `RegularExpressionLiteral`

The vocabulary and its grounds live with the derivation
([`lib/scanning`](../../lib/scanning/README.md) § The vocabulary is the
specification's). Two of its consequences are this lens's whole payload, so they
are stated here too:

**Every keyword is an `IdentifierName`** — `CommonToken` has no `ReservedWord`
arm, so at this phase `if` and `myVar` are the same kind of thing. **And so are
`null`, `true` and `false`**, which is the sharper case: a learner looking at
`true` sees a value, and there are two literal buttons inviting the mistake. The
sibling module [`lib/classifying`](../../lib/classifying/README.md) bins those
three as `literal`, by what they do in the notional machine. Both are true, of
different phases — and a learner who meets both should be told that, not left to
find the contradiction.

**Nothing in the specification separates this phase from the next.** The lexical
grammar has its own productions and its own vocabulary, and this curriculum
stops there on purpose — the specification itself never pauses at that boundary,
folding lexing into the grammar through on-demand goal symbols. The package's
own account of this is
[`language-levels/jej/notional-machine.md`](../../language-levels/jej/notional-machine.md)
§ JEJ-pedagogical splits, and it is right: the `tokens`/`ast` split is for
stepping through. This lens is that stepping-through, and it does not pretend
the machine takes the step.

## The claim contract

The cursor sits at an offset. Every trivia element between it and the next
claimable one advances first, on its own. The learner then claims:

- **its kind** — one of the ten
- **its extent** — how far it reaches, as a count of characters, adjusted with a
  stepper and also settable by dragging on the source

**The stepper is the primary control and the drag is the enhancement.** The
extent is a small integer, the count is already on screen, and a stepper is
keyboard-native and testable without a browser — where drag is neither. This is
the gap parsons names in its own Future direction; there is no reason to inherit
it.

**Kind and extent must both be right for the element to fall**, and each is
**judged independently** so the learner reasons about one thing rather than
starting over. Attempts are not limited and nothing is ever blocked.

### One more character

Once wrong attempts on this element **reach** `oneMoreAfter`, a third field
opens — and it is not a label to recall. The learner is shown the extent
**currently on the stepper** plus one more character, and asked what that would
be:

- still an element of the same kind
- an element of a different kind
- not an element here

This replaced a table of six named reasons (human ruling 2026-08-13): that
table's answer was a function of the kind already claimed, so it confirmed
rather than asked. What is here now is maximal munch as a **question** rather
than as a name. It is one rule instead of a table of reasons; it is not
derivable from the kind the learner already claimed; and it applies uniformly —
to `a+++b`, to `let`, to `1_000`, and to a template head, which a reason
vocabulary built for punctuators could not serve.

The field tracks the stepper rather than the last submission (human ruling
2026-08-14, resolving a disagreement between this README and the wire-frames):
the learner is reasoning about the boundary they are currently proposing, so a
question frozen at their last wrong answer would be about the wrong place. The
consequence is that moving the stepper **clears the pending answer** — the
question has changed, so the previous answer to it is no longer an answer.

**The answer comes from the element sequence, not from a table.** ECMA-262's
clause 12 has the scanner take the longest sequence of code points that forms a
legal input element, and the sequence already carries the true element's extent.

**The question is about the one-more run, not about the stepper.** Write `M` for
the length of the run being asked about — the stepper's value **plus one** — and
`L` for the true element's extent. Then:

- **`M` > `L` → not an element here.** Sound by longest match: had those
  characters formed a legal element under the goal in force, the scanner would
  have taken them. `a+++b` at a stepper of 2 is exactly this — the element is
  `++`, so `M` is 3 and three characters is not an element.
- **`M` = `L` → it is the element**, of the kind the sequence already names —
  the stepper sitting one short of the boundary. Which of the two remaining
  answers is right is decided **against the kind the learner claimed**:
  `same-kind` when the sequence names that same kind there, `different-kind`
  otherwise. Nothing else in the question compares against the claim.
- **`M` < `L` → answered as not an element**, and this is the one place the
  answer is approximate: a proper prefix is occasionally a legal element by
  itself, as `1` is inside `1_000`. Stated at the field rather than hidden.

The stepper-plus-one framing is the whole rule, and writing it any other way
introduces an off-by-one: a stepper resting exactly on the boundary asks about
one character too many, which is precisely the case the question exists to
teach.

The third option reads **"not an element here"**, not "not an element at all",
and the word is load-bearing. Whether a run of characters is an element depends
on which question the scanner was asked: in `a /re/ b` the elements are `/`,
`re`, `/`, so a learner who reasons "`/re/` is a regular-expression literal"
holds a true belief about the language and would still be judged diverging. The
goal-symbol question is a different lens, by ruling; this lens should not phrase
its option as though that question did not exist.

**A punctuator table cannot do this job**, and the failure is not exotic: in
`a?.5:b` the element at the second position is `?` alone, because optional
chaining is barred before a digit by a grammar restriction no table has a row
for. A table would confidently answer "an element of a different kind" and be
wrong.

**Nothing re-tokenizes** — the question is answered by comparing two numbers
against a sequence already derived.

**This answer is judged but never blocks** (human ruling 2026-08-14). The
element falls on kind and extent alone; the third verdict is announced and
recorded, and a wrong one costs nothing but the saying. A learner who has kind
and extent right has already produced the boundary, so refusing them there would
turn a thinking prompt into a second lock and hand more work to the way past.
The field exists to make someone reason about an edge, not to guard it.

### The way past

A skip, never a reveal (human ruling 2026-08-13). Once wrong attempts on one
element **reach** `skipAfter`, the learner may hand it to the machine: the
element falls **named but unclaimed**, and the cursor advances. The answer
arrives by watching it happen rather than by asking for it, so the rhythm never
breaks and a learner is never trapped on one element.

The gate survives intact — a wrong claim still advances nothing. What changes is
that closing the lens is no longer the only exit, which brings this lens in line
with [`../parsons/`](../parsons/README.md)'s view toggle and
[`../writeme/`](../writeme/README.md)'s Read view.

## The lens object

The module's default export is a frozen `Lens` per [`../types.ts`](../types.ts):

- `name: 'spellme'` · `phase: 'tokens'`
- `main` — the React component: `<div data-lens="spellme">`, the input tape, the
  token tape, the jar, the claim form, the per-field verdicts, the fates panel
  and the legend.
- `applicability(facts)` — the tokens stage produced a value **and** the
  published member is there:
  `facts.tokens.ok && facts.tokens.value.inputElements !== undefined`.

  Two conditions, for two different reasons (human ruling 2026-08-19). The
  tokens stage because a source that does not lex has no sequence at all. The
  member's presence because it is **optional** — the orientation above states
  that and cites embody's normative account, so a successful tokens stage does
  not by itself guarantee the sequence exists. This lens cannot serve without
  it, so applicability declines and the lens is not offered. Reading one
  member's presence derives nothing, which is what keeps applicability cheap.

  **The decline is silent** — no logging, no side effect of any kind. This
  function must be pure and synchronous over the facts alone, per the kind's
  `Gateable` contract; and the defect is already reported loudly at its own
  site, by the machinery that caused it, so a second report from a consumer that
  did not cause it would be duplicate noise.

  **No syntax tree is read**, so a program that lexes but does not parse is
  served in full — the state where "your spelling is fine, your grammar is not"
  is worth seeing.

- `config(overrides?)` — the pure factory: defaults applied, overrides win,
  unknown keys preserved, `undefined` treated as absent, result deep-frozen.
- `recommend(embodiment)` — the frozen empty array; see
  [Future direction](#future-direction).

## Configuration

- `oneMoreAfter?: number` (default `2`) — wrong attempts on one element at which
  the one-more-character field opens.
- `skipAfter?: number` (default `4`) — wrong attempts on one element at which
  the hand-it-to-the-machine control appears.

Both count **per element** and reset when the cursor advances.

**Both thresholds are _reached_, not exceeded** (human ruling 2026-08-14): at
the defaults the one-more field opens on the third attempt and the way past on
the fifth. The distinction is not pedantry — under an exceeds reading **no**
configuration can ask the question on the first attempt, and `oneMoreAfter: 0`
is exactly the setting an educator who wants that trade would reach for.

**The key was renamed from `askWhyAfter`** in the same ruling. It was a vestige
of the six-reason "why" table that ruling 7 deleted: the field it opens asks
about one more character, and the word "why" appears nowhere else in this lens.
A config key is a cascade-visible contract an educator writes into site
configuration, so renaming it after ship would be a breaking change and renaming
it now costs nothing.

**Legal values.** Both are non-negative integers. `0` makes the control
available from the first attempt. A `skipAfter` below `oneMoreAfter` leaves the
one-more field unreachable — legal, and an educator's choice rather than an
error. Negative, fractional and non-finite values are refused at the factory
boundary rather than coerced, per this package's fail-fast rule for invalid
input crossing a boundary.

(human ruling 2026-08-20) The refusal throws a **`RangeError`**, not a
`TypeError`. All three refusals are properties only a number can have, so what
is refused is always the right kind of value carrying a wrong one — which is
what `RangeError` names, and what ECMA-262 itself uses for the same predicate
(`new Array(-1)`, `new Array(1.5)` and `new Array(NaN)` all throw it). A
**non-numeric** threshold is a different question and is deliberately not
answered here.

## UI structure

```text
<div data-lens="spellme" data-cursor="N">
  <section data-spellme-input>            — the input tape
    <span data-spellme-consumed>          — characters already taken
    <span data-spellme-proposed data-extent="N">
    <span data-spellme-rest>
  <section data-spellme-tokens>           — the token tape, in stream order
    <span data-spellme-element data-element-kind="…" data-claimed="true|false">
    <span data-spellme-break>             — a consumed line break the grammar reads
  <section data-spellme-jar>              — set aside, and kept
    <span data-spellme-set-aside data-marked="true|false">
  <form data-spellme-claim-form data-attempts="N">
    <div data-spellme-element-kinds>      — ten buttons, each data-element-kind
                                            and aria-pressed
    <div data-spellme-extent>             — a stepper; drag on the source also sets it
    <div data-spellme-one-more>           — once attempts reach oneMoreAfter
    <button data-spellme-submit>
    <button data-spellme-skip>            — once attempts reach skipAfter
  <div data-spellme-verdicts aria-live="polite"
       data-element-kind-verdict data-extent-verdict data-one-more-verdict>
  <details data-spellme-fates>            — the three fates, collapsed
  <div data-spellme-legend>               — the ten element kinds; open on first mount
</div>
```

**Both marked fates are drawn** (human ruling 2026-08-20). A set-aside comment
carries `data-marked` on its jar entry; a consumed line break leaves
`data-spellme-break` on the token tape, at the position it was read. Its
**presence is the mark** — there is no `data-marked="false"` twin, because an
unmarked consumed element leaves nothing at all, which is what _evaporates_
means. That is the same presence-is-the-state rule the verdict attributes
follow.

The `data-lens` attribute plus the `data-spellme-*` family, `data-cursor`,
`data-element-kind`, `data-extent`, `data-claimed`, `data-marked` and
`data-spellme-break` are harness selectors and CSS hooks; renaming any is a
contract change. It is `data-element-kind` and never bare `data-kind`: the
package glossary owns _kind_ for a kind of study utility, and the sibling leaf
[`lib/classifying`](../../lib/classifying/README.md) publishes a different
element taxonomy over the same tokens, so both halves of the word need saying.
The three `data-*-verdict` attributes carry `attested` or `diverging` — the
glossary's word for a per-field judgement, so the surface and the prose use one
term and not two. They are **absent until the first submitted claim**; treat
absence as "unclaimed", not as a state.

(human ruling 2026-08-26) **Which element kind is currently selected rides
`aria-pressed` on the picker's buttons, and no `data-*` hook carries it.** The
selection is a pressed-toggle state, which is exactly what `aria-pressed` names,
so a second attribute would duplicate it and would have to be kept in step with
it. Styling binds to `[aria-pressed='true']` — an attribute, so the
selectors-never-label-text rule holds — as `../writeme/` already does for its
view toggles. It is the one part of this surface's state that is **not** in the
`data-spellme-*` family, and it is deliberate: the accessible name of the state
and the hook for drawing it are the same thing.

**`data-spellme-claim-form` is absent when there is nothing to claim** — before
the first element on a program with no claimable elements, and again once the
last one has fallen. Nothing replaces it: the tapes and the jar stay as they
are, and there is no summary element to look for.

The legend is **open on first mount**, unlike parsons's. Parsons's legend
explains feedback colours, which a learner can ignore and still play; this one
explains the answer vocabulary, which they cannot.

**Two semantic roles, and no hue for either.** A judged field is **attested** or
**diverging**; each of the three fates additionally carries a non-hue signal, so
the surface reads without colour at all: a token-tape element solid, a set-aside
element dotted, an evaporating one hatched.

**The roles are named here; the hues are not** (human ruling 2026-08-14). They
resolve through CSS custom properties, and the standing candidates are Wong's
colour-blind-safe blue and vermilion — no red/green. The deferral is deliberate:
those two hues already carry correct/wrong in
[`../parsons/`](../parsons/README.md) and blank parity in the lens-migration
campaign's blanks work, so a third meaning for the same pair is a package-wide
question this lens does not get to settle alone. Naming the roles costs this
lens nothing and leaves the coloring foundation free to bind them.

## Glossary — lens terms

The package glossary owns the shared meanings;
[`lib/scanning`](../../lib/scanning/README.md) owns _input element_, _element
kind_, _trivia_, _tiling_ and _run collapsing_, and this lens uses all five
unchanged. The sequence itself is embody's to publish —
[embody/README.md § Reading the embodiment](../../embody/README.md#reading-the-embodiment)
states its optionality, and embody's own glossary names the concept _input
elements_. These are this lens's own.

- **attempt** — one submitted claim that did not make the element fall. Attempts
  are counted per element and reset when the cursor advances; both configured
  thresholds are read against that count.
- **claim** — one submitted answer about the element at the cursor: its element
  kind, its extent, and — once opened — the one-more-character answer. The
  learner's act; deliberately not "prediction", which the package uses for the
  wider predict-and-check practice.
- **cursor** — which element the learner is being asked about. It rests only on
  claimable elements, advancing past trivia on its own — a position in the
  element sequence, not an offset into the source.
- **extent** — how far the learner claims the element reaches, as a **count of
  characters**. Not the same shape as `lib/scanning`'s **span**, which is a
  half-open `[start, end)` pair: the extent is that span's width. The surface
  asks for a width because it is the smaller thing to hold in mind, and the two
  are converted at the boundary rather than confused.
- **fall into place** — what a correct claim does: the element's characters
  leave the input tape, arrive on the token tape, and the cursor advances.
- **the fates** — where an element ends up, derived from its element kind: the
  token tape, the jar, or nothing — though a consumed element the grammar reads
  a line break at still leaves its mark on the token tape, which is the one
  place "nothing" is qualified. **Every** element has one, claimed or not — two
  of the three belong entirely to elements the learner never claims, which is
  the whole point of watching them rather than asserting them.
- **decline** — `applicability` answering `false`, so the lens is never offered
  at all. Distinct from _the gate_, which is about the advance **inside** an
  offered lens. Nothing about a decline is visible here, because in that state
  this lens is not drawn.
- **the gate** — the rule that the stream advances only on a correct claim. It
  is this lens's entire refusal channel **within an offered lens**: no score, no
  failure state, and nothing blocked except the advance itself. Whether the lens
  is offered at all is a _decline_, above, and a different question.
- **the jar** — the set-aside region, holding everything the scanner lifted out.
  It stays visible and is never emptied.
- **mark** — one property, and only this one: **the syntactic grammar reads a
  line break here.** Two elements carry it (human ruling 2026-08-20) — a line
  terminator, which is one directly, and a block comment containing one, which
  §12.4 makes one for the syntactic grammar. Per-field correctness is a
  **verdict**, never a mark.
- **provenance** — whose doing a fall was: the learner's claim, or the machine's
  after a hand-over. It is recorded on the token tape, and it is never scored.
- **skip** — handing an unclaimed element to the machine once attempts reach
  `skipAfter`. It falls named and recorded unclaimed.
- **the published member** — this lens's shorthand for
  `facts.tokens.value.inputElements`, the optional field the sequence arrives
  on. This lens reads it and never fills it; the coinage is this lens's, not
  embody's, whose glossary calls the concept _input elements_.
- **the stream** — the element sequence as this exercise holds it: every input
  element carrying the fate its kind implies and, where it has one, its mark.
  The learner meets it one element at a time, and nothing about it is derived
  here beyond those two.
- **the tapes** — two of the three regions, not all of them: the **input tape**
  holds the program the scanner has not yet reached, the **token tape** holds
  what has fallen, plus the marks for the line breaks read as the tape fills —
  including one read before anything has fallen at all. A mark is not a fallen
  element and carries no provenance — nothing claimed it. The jar is the third
  region and is not a tape.
- **verdict** — the independent judgement of one claim field. Two per claim
  ordinarily, three once the one-more field has opened; they never combine into
  a score.

## Edge cases

- **A program that lexes but does not parse** — served in full.
- **A program that lexes, but embody's input-element derivation defected** — the
  lens is not offered. This is the one non-offer condition that is **not a
  property of the program**: the source is fine and the tokens are fine;
  embody's own machinery failed and reported it, and the published member is
  absent. The lens has nothing to build a stream from, so it declines.

  **The accepted cost, stated rather than absorbed** (human ruling 2026-08-19):
  spellme is the only lens declaring the `tokens` phase, and **every further
  lens of this family reads the same published member** — so on this defect the
  phase empties however many of them exist. It is not a transient roster
  accident that a second lens would fix. An accessible-but-empty phase is drawn
  with its own reason, `Tokens, spelling: nothing studies this phase yet`, and
  that sentence is **false** here: the curriculum does study this phase; what
  broke is machinery. The caption cannot tell "nothing studies this phase" from
  "everything that studies it declined for one machinery reason", and that is
  the shape the follow-on has to fix. It belongs to the orchestrator's
  empty-station caption, not to this lens, and it is recorded as an open
  follow-on in this campaign's handoff —
  `.planning-handoffs/spellme/ACQUISITION-ALIGNMENT-BRIEF.md` § Recorded, not
  fixed. **That home is transitional**: whoever next works the orchestrator's
  station copy should carry it into `orchestrate/README.md`, which already
  describes the empty-station case this defect lands in.

  **The alternative was not weighed and refused — it is barred.** Staying
  offered and failing at mount would put a refusal in `main`, and the lens
  kind's contract realizes refusal-as-data at applicability precisely so `main`
  carries no refusal arm ([`../types.ts`](../types.ts), the `Lens` Totality
  remark). It would also, there being no error boundary anywhere in this
  package, take the whole panel down rather than this lens alone.

- **A program that does not lex** — the lens is not offered. Explaining the
  reader's own error is the **error-interpreting lens**, which the package
  roster already names across both parse phases; it belongs to the package, not
  to this lens's family.
- **An empty program, or only trivia** — the surface renders with nothing
  claimable; the jar shows whatever was kept.
- **A hashbang** — `#!…` at offset 0 is its own element kind rather than a
  `Comment`, and it advances on its own like the rest of the trivia. It goes to
  **the jar**: it is authored text that was lifted out and kept, which is what
  the jar is for, and evaporating it would teach that it was layout. The
  specification discards it without ruling on where a surface should put it, so
  this is this lens's call and not the specification's. It carries no mark —
  there is no line terminator inside it.
- **Script versus module** — the reading depends on the goal, and the goal is
  the orchestrator's snippet-type toggle, which stays visible beside the lens
  and disposes it when changed. **This lens renders no type control of its own**
  and holds no copy of that state.
- **Nested templates** — `` `a${`n${q}`}c` `` is five elements, **four of them
  template parts** and one an identifier.

## Future direction

- **A strict scan** — claiming the trivia too, so the three fates are asserted
  rather than observed. The single most likely improvement, and **the design's
  real answer to the pacing risk**: it is the one question here whose answer is
  not a first-character lookup. A flat configuration flag would reach it at the
  cost of one branch in the advance rule.
- **Which question the scanner was asked** — the goal-symbol exercise. **Each
  further game is its own lens** (human ruling 2026-08-13), over the same
  sequence: this one, the scanner's stopping point, one-character sabotage, and
  the generative direction.
- **`recommend`** — down-rank programs with too few elements, or too few
  interesting ones, to be worth driving.

## Navigation

- Region: [`../README.md`](../README.md) — the lens kind's mechanics.
- The derivation's vocabulary and rules:
  [`../../lib/scanning/README.md`](../../lib/scanning/README.md) —
  documentation, not an instruction to call it; the acquisition is in the
  orientation above.
- [`DOCS.md`](./DOCS.md) — this lens's architectural sketch and decisions.
- [`types.ts`](./types.ts) — the lens-local domain model.
- **The user twin** (`twin-doc: user`, human ruling 2026-08-13):
  [`ux/`](./ux/user-journeys.md) — a journey document and wire-frames. Those two
  because this exercise's two live risks are **pacing** (is the fifteenth claim
  worth making?) and **arrangement** (three regions carrying the three fates);
  personas were not written because the reader in front of this lens is the
  package's, not this lens's. The directory is named for the concern its menu
  serves rather than for one modeled thing, because a wire-frame models the
  interface the user meets and not the user (human ruling 2026-08-14).
- Kind contract: [`../types.ts`](../types.ts).
- Embodiment contract: [`../../embody/types.ts`](../../embody/types.ts).
