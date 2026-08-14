<!-- cspell:ignore spellme wireframes -->

# spellme — Architecture & Decisions

The drive-the-scanner exercise for the `tokens` phase. [README.md](./README.md)
carries the claim contract, the vocabulary and the rulings; this document
carries the shape a correct implementation must take.

## Modules

| File        | Layer     | Purpose                                                                                             |
| ----------- | --------- | --------------------------------------------------------------------------------------------------- |
| `types.ts`  | shared    | the domain model and the configuration contract                                                     |
| `core.ts`   | pure      | most of the module: the factory, the gate, and the stream, positioning, judging and settling phases |
| `index.tsx` | component | the surface, and the frozen lens object that is the identity                                        |
| `ux/`       | twin      | the user twin — journeys and wire-frames                                                            |

## Architectural sketch

> Written Phase 0, before implementation. The Refactor step is held against this
> document — not what the code does, but what shape it takes.

**Three entry points, not one sequence.** The phases below run for three
different callers at three different times, and numbering them together would
imply a single execution that does not exist. **The factory** resolves
configuration before anything mounts. **The gate** answers applicability when
the orchestrator asks whether to offer the lens at all. **The surface** is
everything from reading the stream to rendering, and it is the only one that
receives an embodiment.

**Inbound contract.** The surface receives a frozen embodiment and a resolved,
frozen configuration — the two properties every lens of this kind receives; the
factory receives the cascade's merged overrides, and the gate receives the
facts. **Outbound contract.** A rendered surface and nothing else: no callback
upward, no persisted state, no value returned to a consumer.

### Execution phases

1. **Resolve the settings** _(the factory; sync, pure, throws)_ — the two
   attempt thresholds, defaults applied, an absent key and a key present as
   absent treated alike, an out-of-range value refused at the boundary rather
   than coerced. **Input:** the cascade's merged overrides. **Output:** the
   resolved configuration the surface is later handed.

2. **Answer applicability** _(the gate; sync, pure, cheap)_ — whether the tokens
   stage produced a value. No syntax tree is consulted, so a program that lexes
   but does not parse is served, and no derivation happens here, because a gate
   is budgeted to the facts it reads. **Input:** the facts. **Output:** whether
   this lens is offered at all.

3. **Read the stream** _(the surface; sync, pure, mount-stable)_ — behind the
   applicability check, take the derivation's element sequence and give each
   element its fate and, where it has one, its mark. **This phase derives no
   element**; both the fate and the mark are functions of the element kind
   alone. **Input:** the embodiment's published parse facts. **Output:** the
   stream — every element carrying where it will end up.

4. **Position** _(sync, pure)_ — advance past every element that advances on its
   own, so the cursor rests on a claimable element or past the end. Runs at
   mount and again after every fall; it is the only writer of the cursor.
   **Input:** the stream and a cursor. **Output:** a cursor resting somewhere a
   claim can be made.

5. **Judge** _(sync, pure, per submission)_ — judge each field of a submitted
   claim **independently** against the element at the cursor. No field is
   inferred from another, and the one-more-character answer is judged by
   comparing the claimed extent **plus one character** against the element's own
   extent — never by consulting a table of punctuators, and never against the
   claimed extent itself, which is off by one. **Input:** a claim and the
   element at the cursor. **Output:** one verdict per field the claim carried.

6. **Fall or wait** _(sync, pure)_ — the element falls when kind and extent both
   attest, and the one-more verdict never blocks it. Any blocking field
   diverging moves nothing and raises the attempt count. Handing an element to
   the machine moves it named and unclaimed once attempts reach the way-past
   threshold. **Input:** the verdicts and the attempt count. **Output:** the
   next session state.

7. **Render** _(sync)_ — the input tape, the token tape, the jar, the claim form
   carrying whichever fields the attempt count has opened, and the per-field
   verdicts in a live region. Absence of a verdict attribute is the unclaimed
   state and is rendered as absence, never as a falsy value.

   **When the stream is exhausted** the cursor rests past the end: the claim
   form is absent, the tapes and the jar stay exactly as they are, and nothing
   replaces it. No summary, no score, no congratulation — the last fall is the
   ending, and the surface simply has nothing left to ask.

### Data flow

```mermaid
flowchart TD
    Overrides(["the cascade's merged overrides"])
    Props["frozen embodiment · resolved configuration"]
    Thresholds["the two attempt thresholds"]
    Seq["input-element sequence<br/>(derived upstream, tiling the source)"]
    Stream["the stream<br/>(each element carrying its fate,<br/>and its mark where it has one)"]
    Session[("session state:<br/>cursor · attempts on this element ·<br/>what has fallen and whose doing it was ·<br/>the last verdicts, absent until the first claim")]
    Surface["input tape · token tape · jar ·<br/>claim form and its per-field verdicts"]
    Submission(["the learner submits, or hands it over"])
    Claim["a submitted claim<br/>(element kind · extent · the one-more<br/>answer, once that field is open)"]
    Verdicts["one verdict per field,<br/>independent, never a score"]

    Props -->|"read the tokens fact behind the<br/>applicability check, pure"| Seq
    Overrides -->|"resolve defaults, refuse an out-of-range<br/>threshold, freeze — the factory, before<br/>anything mounts"| Props
    Props -->|"read the two thresholds off the<br/>resolved configuration, pure"| Thresholds
    Seq -->|"derive each fate from its element kind<br/>and mark a comment carrying a line break, pure"| Stream
    Stream -->|"seed at the first claimable element, pure"| Session
    Session -->|"render the tapes, the jar, and the form<br/>with the verdicts of the last claim"| Surface
    Thresholds -->|"open the one-more field, then the way past,<br/>at the attempt count each names"| Surface
    Surface -->|"the one external event in the module"| Submission
    Submission -->|"read the form — element kind, extent, and<br/>the one-more answer where it is open"| Claim
    Claim -->|"judge each field against the element<br/>at the cursor, pure and independent"| Verdicts
    Verdicts -->|"kind and extent both attest — it falls,<br/>the cursor advances, attempts reset"| Session
    Verdicts -->|"a blocking field diverges — nothing moves,<br/>the attempt count rises"| Session
    Submission -->|"handed over at the way-past threshold —<br/>falls named and unclaimed, pure"| Session
```

### Structural constraints

- **Two layers, and only one of them imports React.** The pure layer computes
  every phase above except the render; the component layer imports it, **owns
  the session state across renders**, and is the only file that knows React
  exists. The pure layer never holds state — it takes a session and returns its
  successor.
- **The claim in progress is component-local form state, and is not the same
  thing as a claim.** `Claim` is only ever the submitted snapshot the pure layer
  judges; the stepper value, the selected element kind and the pending radio
  live in the component and are typed there. The clear-on-step rule below is a
  render-layer invariant, and it owes a component test rather than a core one.
- **The gate is the entire refusal channel.** A wrong claim advances nothing and
  costs nothing else: no score, no failure state, no lockout, no limit on
  attempts. The way past changes which exits exist, never what the gate does.
- **The one-more-character answer is judged and never blocks** (human ruling
  2026-08-14). It is the only judged field that is not a gate, and treating it
  as one would turn a thinking prompt into a second lock.
- **Thresholds are reached, not exceeded** (human ruling 2026-08-14), and both
  count per element and reset when the cursor advances. Zero is a legal,
  meaningful value for either.
- **The one-more question tracks the live stepper** (human ruling 2026-08-14).
  Moving the stepper re-asks it and clears the pending answer, because the
  question has changed. What is judged is the stepper's value **plus one**,
  never the stepper's value itself.
- **Verdicts never aggregate.** There is no score, no percentage and no session
  summary; combining them anywhere would contradict the gate.
- **This lens derives no element.** Fate and mark are functions of the element
  kind; everything else about an element comes from upstream. A second lens of
  this family reads the same sequence rather than re-deriving it.
- **The lens renders no snippet-type control and holds no copy of that state.**
  The reading depends on the goal symbol, and that toggle belongs to the
  orchestrator, which disposes this lens when it changes.
- **The jar is never emptied**, and trivia are never claimed.
- **Selectors bind to attributes, never to label text.** A verdict attribute is
  absent before the first submitted claim, and absence is the state.

### Out of scope

- **Deriving the element sequence, the vocabulary, or the tiling.** All
  upstream.
- **Explaining a program that does not lex** — the error-interpreting lens,
  which belongs to the package rather than to this family.
- **Claiming the trivia**, the goal-symbol question, one-character sabotage, and
  the generative direction. Each further game is its own lens by ruling.
- **Scoring, persistence, cross-mount state, and progress reporting.**
- **Choosing which programs are worth driving.** Named as a future direction and
  not answered here.
- **Binding the two semantic roles to hues.** They resolve through CSS custom
  properties; the package-wide palette question is not this lens's to settle.
- **The fall's motion design, and its reduced-motion equivalent.** The twin
  calls the falling animation the reward the whole loop is built around and
  records that a non-motion confirmation is owed and undesigned. Both are
  settled at a sandbox checkpoint against a running surface, not on paper here —
  and if the fall ever animates, phase 6 to phase 7 is the boundary it sits on,
  which is the only place this module could acquire an asynchronous seam.

## Decisions

- **A data-state diagram, not a component/prop-flow one.** The presentation-
  component exception is available only to a module that owns no derivation, and
  this one derives fates, marks, verdicts and session state that its own render
  depends on. A React lens invites the prop-flow mode on sight; the qualifying
  test is ownership of derivation, and this module fails it.
- **The ten claimable kinds are spelled out rather than filtered from the
  fourteen.** Which kinds this exercise asks about is a pedagogical decision,
  and deriving it would let a widening upstream silently grow the picker.
- **The element kind is `elementKind` in the domain and `data-element-kind` on
  the surface, never bare `kind`.** The package glossary owns _kind_ for a kind
  of study utility, and the sibling classifying leaf publishes a different
  element taxonomy over the same tokens. Two collisions, one word, resolved
  before either had a consumer.
- **`extent` is a width, `span` is a pair.** The surface asks for the smaller
  thing; the conversion happens at the boundary rather than the two being
  treated as interchangeable.
- **The factory refuses an out-of-range threshold rather than clamping it.** It
  is a boundary, and a silently clamped configuration is an educator's setting
  that did not take effect and said nothing.
- **A `skipAfter` below `oneMoreAfter` is legal.** It makes the one-more field
  unreachable, which is a coherent thing for an educator to want; refusing it
  would encode a pedagogy the configuration has no business holding.

## Navigation

- **Orientation, the claim contract and the vocabulary:**
  [README.md](./README.md).
- **The user twin:** [ux/user-journeys.md](./ux/user-journeys.md) and
  [ux/wireframes.md](./ux/wireframes.md).
- **The derivation:**
  [../../lib/scanning/README.md](../../lib/scanning/README.md).
- **Kind contract:** [../types.ts](../types.ts). **Region:**
  [../README.md](../README.md).
