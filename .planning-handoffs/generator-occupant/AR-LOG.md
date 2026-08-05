<!-- cspell:ignore affordances -->
<!-- TRANSITIONAL — delete when the generator-occupant campaign completes. -->

# generator-occupant campaign — ruling log

Human rulings and AR resolutions for the generator excursion: the study
instrument's third pane occupant, built socket-first against a deterministic
placeholder while the generative core belongs to another stream.

Phase 0 is committed and ratified. Plan of record:
`~/.claude/plans/purring-floating-sprout.md` (its RESUMPTION POINT block carries
live state). Recorded here because a ruling that lives only in a plan file does
not exist — `git grep` cannot see it
([DEV.md § Ruling provenance](../../DEV.md#ruling-provenance)).

Rulings already expressed by the committed
[generator/README.md](../../src/lib/study-lenses/orchestrate/generator/README.md),
[generator/DOCS.md](../../src/lib/study-lenses/orchestrate/generator/DOCS.md),
and
[generator/types.ts](../../src/lib/study-lenses/orchestrate/generator/types.ts)
are not restated here; this log carries what those artifacts do not already say.

## Human rulings — 2026-07-30 (Increment 2, the view's mount shape)

- **R-1 — `generator/tests/fakes.ts` is built, despite having one consumer.**
  [AGENTS.principal.md § Critical Conventions](../../AGENTS.principal.md#critical-conventions)
  asks for 2+ call sites before extraction to a new file, and this file's only
  consumer is `generator/tests/index.test.tsx` — which Increments 3 and 4 grow
  rather than joining. The maintainer ruled in favour of building it anyway, so
  the campaign's socket doubles accumulate in one named place across the three
  view increments. The in-repo shape it follows is
  `lib/local-llm/tests/fakes.ts`. Increment 2 shipped one double,
  `unaskedSocket()`, whose `generate` throws: a mount-shape view never asks, so
  a scripted resolving socket would have shipped an unreachable resolution path.

- **R-2 — the view's own learner-visible strings are pinned verbatim in the
  README.** Raised by AR-4 against Increment 2: the takes-time warning and the
  prompt field's label had no anchor in any doc, while
  [§ The placeholder socket](../../src/lib/study-lenses/orchestrate/generator/README.md#the-placeholder-socket)
  pins every one of the socket's learner-visible values and states why — _a
  value nobody specified is a value someone invents_. The maintainer ruled to
  pin both before the commit rather than carry an open flag; they now live in
  [§ The view's own words](../../src/lib/study-lenses/orchestrate/generator/README.md#the-views-own-words),
  verified byte-for-byte against the implementation constants. **The rule
  generalizes:** every increment that authors learner-facing prose in this view
  pins it in that section in the same commit.

## AR resolutions — 2026-07-30 (Increment 2)

- **AR-3 RULING — a whitespace-only seed or prompt is NON-EMPTY**, so the ask
  affordance is live for it. Emptiness in the view is literal `=== ''`, matching
  the committed socket, whose implementation calls the asymmetry deliberate
  (`create-generator-socket.ts`: _"the prompt is learner text that is normalized
  but never trimmed"_). A `.trim()` reading in the view would make one word mean
  two things inside one directory. Carried as two `// PINNED(AR-3 2026-07-30…)`
  markers in `generator/tests/index.test.tsx`.

- AR-3 and AR-4 both returned CONSIDER; every concern was folded before
  `61a64530`. Two AR-3 proposals were declined with reasons recorded in that
  commit's body: an explanatory comment in a test (DEV.md permits only the
  `PINNED` marker), and collapsing the liveness tests into one `it.each` (it
  would flatten the ZOMBIES describe narrative, and the directory's own
  precedent uses `it.each` only for a genuinely uniform axis).

## Human rulings — 2026-07-31 (Increment 3 scope)

- **R-3 — the one-ask-in-flight gate belongs to Increment 3, not Increment 4.**
  The Increment 2 handoff and the plan body both assigned "stage-gated
  affordances" to Increment 4, but
  [generator/DOCS.md § Structural constraints](../../src/lib/study-lenses/orchestrate/generator/DOCS.md#structural-constraints)
  commits to _"One ask in flight per mount — the ask affordance is spent while
  an ask is live"_, and Increment 3 is the increment that makes an ask leave. A
  context-free validation of the Increment 3 handoff found that the deferral
  would knowingly ship a double-click race, with the refactor step and AR-4 both
  driving the implementer into the collision. Scope of the ruling: gate the
  affordance off the job status only. The retirement token, the
  `AbortController` and unmount-abort, cancel, accept, discard, and
  stale-resolution dropping all remain Increment 4's.

## AR resolutions — 2026-08-03 (Increment 3, the job flow)

- **AR-3 CONSIDER — the opener pinned the wrong half, and the fix is now a
  pin.** "Asking opens the output slot" proved that something renders on an ask,
  not that it renders BECAUSE the socket announced a stage — so a `hasAsked`
  boolean flipped in the click handler would have passed every one of the ~31
  planned tests while violating
  [generator/DOCS.md § Decisions](../../src/lib/study-lenses/orchestrate/generator/DOCS.md#decisions)'
  "Why the stages are announced, not inferred". The counter-test — a click the
  socket has not answered for leaves the slot closed — is carried as
  `// PINNED(AR-3 2026-08-03)` in `generator/tests/index.test.tsx`. AR-3's minor
  finding was folded too: the refusal `it.each` scripts BOTH stages, so the
  ordinary `Generating → Refused` edge is exercised separately from the unusual
  `Loading → Refused` one rather than collapsing into it.

- **AR-4 PROCEED**, with two non-blocking suggestions. Resolutions:
  1. **An in-test comment explaining why the three Exceptions tests use `act`
     rather than the suite's house `waitFor` — DECLINED, on the same ground
     Increment 2 declined the same shape.**
     [DEV.md § No Comments in Tests](../../DEV.md#no-comments-in-tests) permits
     only the `PINNED` marker, and this is a mechanism note, not a settled
     expectation, so pinning it would stretch a marker the same section warns
     against bulk-sweeping. The reason lives in the Increment 3 commit body,
     which is where DEV.md puts it. The suite also self-defends: normalizing
     those three tests to `waitFor` does not quietly weaken them, it makes the
     throw escape as an uncaught error and lights up vitest's `Errors` summary
     line.
  2. **`attempts: 0` on a success — FLAGGED, deliberately not implemented.**
     `describeProducer` would render "in 0 attempts" if a socket ever broke
     [types.ts § GeneratorMeta](../../src/lib/study-lenses/orchestrate/generator/types.ts)'s
     "Never zero on a success". It stays out because the invariant is stated in
     prose only — `attempts: number` admits `0` — and neither README nor DOCS
     lists it among the resolutions the result shape cannot serve. Adding a
     fourth loud arm would validate a rule the contract does not express.

## Human rulings — 2026-08-03 (Increment 4, resolve and retire)

- **R-4 — Discard does NOT clear a refusal. Cancel owns the reset.** The
  maintainer ruled this at the Phase-0 → Phase-1 gate (2026-07-28), overriding
  an earlier plan body that had Increments 2–4 clearing the refusal on discard.
  Recorded here only now, because until now it lived **only** in a plan file:
  per [DEV.md § Ruling provenance](../../DEV.md#ruling-provenance) that means it
  did not exist. Neither README nor DOCS states it either — the job diagram's
  `Refused → [*]: discard` edge is terminal, so the docs never had to say what
  discard does to view state. Raised by AR-3 against Increment 4. Carried as a
  `// PINNED(maintainer 2026-07-28…)` marker on "discarding leaves the refusal
  standing" in `generator/tests/index.test.tsx`.

- **R-5 — `tests/fakes.ts` grows by one (`abortableSocket`), unreachable branch
  and all.** Increment 4's suite needs a stage announced AFTER a cancel, which
  the synchronous `scriptedSocket` cannot produce. Two ways to get one: a new
  double, or driving the view's own `onPhase` off the `vi.fn()` spy the suite
  already uses. The maintainer chose the double for campaign continuity, over
  the recommendation of the plan-design pass, which had argued it fails R-1's
  own test — Increment 2 declined to ship a scripted resolving socket precisely
  because its resolution path would have been unreachable. The honest cost, on
  the record: **no view test can reach `abortableSocket`'s abort guard**,
  because cancel deliberately does not abort and an unmounted view has nothing
  left to observe. That branch is conformance modelling, not covered behavior.
  Its deferred-announcement half IS reached, by "a stage announced after a stop
  leaves the view idle".

- **R-6 — the pinned label set includes `Generate`, which is Increment 2's.**
  R-2 obliges each increment to pin its own learner-facing prose in
  [§ The view's own words](../../src/lib/study-lenses/orchestrate/generator/README.md#the-views-own-words).
  That section claims totality over the view's own strings, and `Generate` had
  shipped in Increment 2 without ever being pinned there — so the claim was
  already false before Increment 4 touched it. The maintainer ruled to close the
  gap in the same edit rather than carry it: five labels are now pinned, four
  authored here plus `Generate` transcribed from § Selector contract.

## AR resolutions — 2026-08-03 (Increment 4, resolve and retire)

- **AR-3 CONSIDER**, three IMPORTANT concerns. Resolutions:
  1. **The rejected-promise half of "refusal-as-data is total" had no
     implementation and no test — CLOSED, on the maintainer's ruling.**
     [DOCS § Structural constraints](../../src/lib/study-lenses/orchestrate/generator/DOCS.md#structural-constraints)
     says a rejected promise and a malformed resolution are _"Both loud in dev
     AND prod"_, but only the malformed resolution was: `ask()` carried no
     rejection handler, so a rejection escaped as an unhandled promise
     rejection. Scope was the question — this is Increment 3's `ask()`, not
     phases 4–5 — and adding a throws path fires an inter-file trigger, so it
     went to the maintainer, who ruled to close it now while `ask()` was already
     being rewritten. Landed as `readRejection`, raised from inside the state
     updater like `readAnswer`'s three arms so it reaches RENDER, guarded by the
     same retirement check, and attached as `then`'s second argument rather than
     a trailing `.catch` so it answers for the socket's promise alone and never
     swallows `present`'s own invariant throws.
  2. **"An answer the shape cannot serve is dropped before it is unwrapped" now
     asserts the DOM, not the absence of a throw.** AR-3 was right that
     `resolves.toBeUndefined()` is a weak proxy for the claim. The test now
     asserts the output slot is closed after the drop; if the drop ever
     regresses, `readAnswer` throws in render, the enclosing `act` rejects, and
     the failure names itself with the invariant message.
  3. **`abortableSocket`'s later tick is a microtask, never a timer.** Nothing
     in the view's suite uses fake timers, and a real clock in the one new
     double would have been its first wall-clock flakiness vector.

- AR-3's three MINOR items needed no change: the plan's `file:line` citations
  had gone stale by exactly the 12 lines this session's helper additions
  inserted [measured: `git diff 18223536 -- generator/tests/index.test.tsx`]
  (DEV.md's own warning about line citations, self-inflicted and
  self-consistent); four tests are absence and regression guards rather than
  triangulating anything, which the plan already said; and the "(Many)" block
  covers a state space rather than a collection, matching this suite's existing
  usage.

- **The triangulation was verified by mutation, not by argument.** Four guards
  were each broken on purpose and the suite re-run [measured: four successive
  edits to `generator/index.tsx`, each followed by `./node_modules/.bin/vitest
  run --project unit src/lib/study-lenses/orchestrate/generator`, then
  reverted]: swapping the identity check for a cheap null-guard failed exactly
  "a stage announced by a stopped ask never displaces the next one" and "a
  second ask supersedes an unanswered first" (2 failed | 138 passed — two
  distinct loopholes, as AR-3 predicted); removing the unmount's abort failed
  exactly "aborts the ask the mount leaves behind" (1 failed | 139 passed);
  handing over an already-dead signal failed exactly "hands the socket a signal
  that is not already aborted" (1 failed | 139 passed); and dropping the
  answer-path guard failed the two retirement Exceptions tests (2 failed | 138
  passed), one of them reporting the invariant message itself. **The convention
  this section now follows** — every repo-state claim tagged per
  [DEV.md § Sourced claims](../../DEV.md#sourced-claims) — was raised by AR-4
  against Increment 4, which measured this log at 0 tags against sibling
  campaigns' 19, 25 and 10 [relayed: ar-4, `grep -c` across the repo's
  `AR-LOG.md` files].

## Human rulings — 2026-08-04 (a standing deferral, closed)

- **R-7 — the whitespace-only prompt's empty-looking marker line is CLOSED as
  wontfix. Do not re-raise it, and do not "fix" it.** A prompt of nothing but
  whitespace makes the placeholder emit `// Your prompt:` followed by the
  normalized whitespace, which reads as an empty line. That is the literal
  reading of
  [§ The placeholder socket](../../src/lib/study-lenses/orchestrate/generator/README.md#the-placeholder-socket)
  — normalize, never trim, and carry the line whenever the prompt is non-empty —
  and it is pinned by a test in
  `generator/tests/create-generator-socket.test.ts`. The maintainer first
  deferred it on 2026-07-30 ("leave it for now, fix it later if it's a
  problem"), then saw it surface at Increment 4's sandbox checkpoint and ruled
  it closed on 2026-08-04: _"the whitespace-only prompt, forget it."_ Recorded
  here because until now the deferral lived only in a memory file and a plan
  file, which per [DEV.md § Ruling provenance](../../DEV.md#ruling-provenance)
  means it did not exist — and an unrecorded wontfix is exactly the kind a later
  AR re-opens. Measured at the running sandbox harness before the ruling: an
  empty prompt emits no prompt line at all, a real prompt carries it verbatim,
  and only a whitespace-only prompt renders it empty-looking [measured: three
  asks driven through `/spiralearn/sandbox/generator/`].

## Human rulings — 2026-08-04 (Increment 5 scope, at the plan gate)

Five open questions went to the maintainer in one batch before any code, because
Increment 5 is the first increment whose ratified design has genuine holes. Two
are SCOPE calls, three were silences in the committed docs.

- **R-8 — accept and discard are implemented in Increment 5, with one happy-path
  test each. Forced, not preferred.** The plan body assigns accept/discard to
  Increment 7, but the `mode === 'generator'` render branch cannot be written
  without them:
  [generator/types.ts](../../src/lib/study-lenses/orchestrate/generator/types.ts)'s
  `GeneratorViewProperties` requires all four props, none optional, so `tsc`
  rejects the JSX outright. Three ways out were weighed and two are unavailable.
  The region cannot suppress the Accept control — the view renders it
  unconditionally at `job.status === 'preview'` and owns that JSX, and
  `generator/README.md` is ASK-FIRST. A throwing stub would put a crash under a
  human's finger at a 🔍 checkpoint, and
  [DEV.md § Sandbox Checkpoints](../../DEV.md#sandbox-checkpoints--user-observable-features)
  makes a behavioral defect there block the commit. Wiring `onAccept` to
  `disposeToEditor()` alone is worse than a crash: the dispose reseeds the
  remounting editor from the live source, which never saw the candidate, so
  Accept would SILENTLY DESTROY the program. What remains for Increment 7: the
  field-equal-no-settle Boundary, the re-derived-phases assertion, and the full
  bus-order pins. **Coupling worth knowing:** neither control renders until an
  ask has resolved, so this ruling is what promotes plan D8's module-spy socket
  seam from a ratification to a load-bearing dependency of Increment 5.
  **Evidence added 2026-08-04, on AR-4's finding** that this was the
  weakest-sourced of the five rulings landed with it. The four required props
  are [read:
  [generator/types.ts](../../src/lib/study-lenses/orchestrate/generator/types.ts)
  § `GeneratorViewProperties` — _"readonly seed: string; readonly socket:
  GeneratorSocket; readonly onAccept: (program: string) => void; readonly
  onDiscard: () => void"_], none optional. Accept renders unconditionally at the
  preview stage [read:
  [generator/index.tsx](../../src/lib/study-lenses/orchestrate/generator/index.tsx)
  — _"{job.status === 'preview' && (<button data-generator-accept …"_]. The
  dispose reseeds the remounting editor from the live source, which is what
  makes a bare `disposeToEditor()` destroy the candidate [read:
  [orchestrate/index.tsx](../../src/lib/study-lenses/orchestrate/index.tsx) §
  `disposeToEditor` — _"editorSeed: readLiveSource()"_]. The plan body's
  assignment of accept/discard to Increment 7 lives in
  `~/.claude/plans/purring-floating-sprout.md` § Implementation sequence, which
  `git grep` cannot see — that is why the ruling is recorded here at all.

- **R-9 — `openLensSurface`'s generator pre-close comes forward from
  Increment 6.** The plan assigns it to Increment 6, but the path goes live the
  moment Increment 5 lands: the strip and every recommendation button still
  render during a generator excursion and both reach `openLensSurface`, which
  announces `lens-opened` alone. Two committed docs state the ordering in the
  PRESENT tense —
  [event-bus/README.md § Dispatch ordering](../../src/lib/study-lenses/orchestrate/event-bus/README.md#dispatch-ordering)
  (_"a lens opening over the generator announces `{ open: false }` before
  `lens-opened` with the name — two facts, two events"_) and
  [orchestrate/DOCS.md](../../src/lib/study-lenses/orchestrate/DOCS.md) § The
  settle loop's state diagram — and both would be false for a whole increment
  otherwise. **The argument NOT to use, because it is refutable in one
  command:** "a subscriber would believe the generator is open forever" is false
  — there is no production bus-subscriber code anywhere in the repo [measured:
  `grep -rn "\.subscribe(" --include='*.ts' --include='*.tsx' --include='*.js'
  --include='*.jsx' src/ spiralearn/ | grep -v /tests/` → no output]. The bus is
  region-internal by contract, so the cost is documentation truth, not a broken
  consumer. Increment 6 retains the three derivation-context dispose-order pins,
  the orphan-defense pin, and the late-settle test. **Evidence corrected
  2026-08-04, on AR-4's finding against Increment 5.** This ruling first
  recorded the same claim under an unrestricted
  `grep -rn "\.subscribe(" src/ spiralearn/ | grep -v /tests/` → "no output".
  That command does NOT reproduce: it returns one line, a prose mention of
  `bus.subscribe(eventName, listener)` in the RETIRED
  `study-lenses--deprecated-architecture` module's own README [measured: the
  unrestricted form, re-run]. The substance was unaffected — that is
  documentation, not runtime code, and it predates the ruling by three weeks
  [measured: `git log -1 --format=%cI` on that README → `2026-07-15`] — but the
  recorded command did not produce what it claimed, which is the exact failure
  mode [DEV.md § Sourced claims](../../DEV.md#sourced-claims) exists to catch.
  The extension-restricted form above is what the claim actually rests on.

- **R-10 — the strip's none entry is left UNGUARDED as a generator-close path,
  and no test fires it.**
  [orchestrate/README.md](../../src/lib/study-lenses/orchestrate/README.md)'s
  `dispose` glossary entry says the none entry _"cannot fire"_ during a
  generator excursion because every strip select already sits at its none entry.
  That is a real-BROWSER DOM guarantee, not a code one: React routes a
  `<select>`'s change event through `getTargetInstForChangeEvent`, which returns
  the target instance unconditionally with no value-changed gate (unlike text
  inputs), so `fireEvent.change(select, { target: { value: '' } })` fires
  `onChange` regardless of the current value [relayed: the Plan-agent design
  pass, measured against
  `node_modules/react-dom/cjs/react-dom-client.development.js`]. The moment
  dispose generalizes, the strip becomes a live generator-close path in jsdom.
  It is left unguarded because the behavior is correct if it fires, and because
  `commitCloseLens` is shared by BOTH the strip's `onCloseLens` and the Edit
  code button — and Edit code MUST close a generator, so a mode guard inside it
  would break the guaranteed way home. Guarding in the panel's own
  `relaySelection` would add a prop to a presentation component for a
  browser-unreachable case. **The obligation this places on every later
  increment:** never close a generator through the suite's
  `openLensThroughStrip(container, phase, '')` helper — it is the reflex close,
  it has seven existing call sites, and it WILL pass. A test named "the strip's
  none entry closes the generator" would encode as region contract a path the
  README says cannot fire.

- **R-11 — no pane-swap focus management in Increment 5; the reach is a
  checkpoint observation instead.** Whether focus moves when the pane swaps is
  specified nowhere: both region docs use "focus" only in the initial-focus-
  REQUEST sense, and the generator docs mention it only as the out-of-scope
  honored-focus arm. The region does no focus management at all today [measured:
  `grep -rn "\.focus()\|autoFocus\|tabIndex" src/lib/study-lenses/orchestrate/
  --include=*.tsx --include=*.ts | grep -v /tests/` → no output], and no
  `jsx-a11y` plugin is configured, so nothing mechanical will flag it. The
  generator inherits the lens arm's behavior rather than regressing. It IS the
  first pane occupant whose primary affordance is a text field the learner must
  reach, so rather than defer silently, "how many stops to reach the prompt
  field, and does the path make sense" is a NAMED action in the Increment 5 🔍
  checkpoint — which is precisely what
  [DEV.md § Sandbox Checkpoints](../../DEV.md#sandbox-checkpoints--user-observable-features)
  says checkpoints exist to catch (_"only a human eye at a running dev server
  catches … focus behavior, keyboard feel"_). Designing it blind first would
  answer the question the checkpoint exists to ask.

- **R-12 — `orchestrate/DOCS.md` is not edited, and this ruling discharges the
  inter-file contract check.** DEV.md's inter-file trigger fires at Increment
  5's refactor step because a file enters the region's data flow, so the
  question was asked at the plan gate rather than mid-refactor. The answer is
  that the `## Data flow` diagram is already complete: it carries a `CANDIDATE`
  node with both its edges, its `SUR` node already names the generator, and §
  State residency already lists the generator socket as held by the top
  component and created once at mount. **The doc is AHEAD of the code, and
  Increment 5 makes it true.** Adding a node for the view itself would
  contradict
  [DEV.md § Directory Documentation Convention](../../DEV.md#directory-documentation-convention)
  (_"**Nodes are data states**, not files or types"_). One genuine gap was found
  and deliberately left: there is no `settled snippet → rendered environment`
  edge for a seed reaching the pane — but the EDITOR arm's seed has the same
  shape and the same omission, so the gap is pre-existing and symmetric rather
  than introduced here.

## Human rulings — 2026-08-05 (Increment 6 scope, at the plan gate)

- **R-13 — the plan bullet's "the never-resolving socket's late settle changes
  nothing after dispose" is DROPPED, because it is structurally impossible to
  fail rather than merely untested.** The campaign plan's Increment 6 bullet
  asks for it, so its absence is a decision and not an oversight. Three facts
  make the assertion unfalsifiable by any implementation that could exist behind
  this seam. The view's only upward channels are `onAccept` and `onDiscard`, and
  both are bound exclusively to button `onClick` handlers — an unmounted view
  renders no buttons [read:
  [generator/index.tsx](../../src/lib/study-lenses/orchestrate/generator/index.tsx)
  — `onClick={() => onAccept(job.program)}` and `onClick={onDiscard}` are the
  only references besides the destructure]. Every socket callback is guarded by
  an identity check against a ref the unmount cleanup nulls, so a late answer is
  never even unwrapped. And the region's only dispatch producers are the
  settled-announce effect and five click-driven commit functions, none of which
  the socket can reach: a settled identity moves only through the edit intake or
  the flush, and the socket touches neither. A test whose assertion no
  implementation could violate spends review budget and teaches a later reader
  that a hazard was guarded when it was merely impossible. Recorded rather than
  silently omitted because an unrecorded deliberate non-test is exactly what a
  later AR reopens — R-7's own lesson.

- **R-13b — the substitute was considered and DECLINED; the claim goes to the 🔍
  checkpoint instead.** The takes-time warning makes a region-level behavioral
  promise that neither suite tests — _"Leaving this view ends it — and so does
  changing the level, the posture, or the snippet type"_ [read:
  [generator/README.md § The view's own words](../../src/lib/study-lenses/orchestrate/generator/README.md#the-views-own-words)]
  — and that sentence is pinned learner-facing prose under R-2. A region test
  asserting the in-flight ask's signal aborts on a level commit would cover it,
  but it has **no unique falsifier**: dropping the view's unmount-abort fails it
  AND the view suite's own "aborts the ask the mount leaves behind", while
  removing `commitLevel`'s dispose fails it AND this increment's level pin. It
  would also need a never-resolving double the suite does not otherwise want,
  against R-5's finding that a real clock in a double is this campaign's
  wall-clock flakiness vector. The promise is user-observable, and
  [DEV.md § Sandbox Checkpoints](../../DEV.md#sandbox-checkpoints--user-observable-features)
  is where user-observable claims belong, so it becomes a named GEN-6 action:
  ask, then toggle the type mid-flight, and watch that nothing paints late.

- **R-14 — R-9's enumeration of what Increment 6 retained was INCOMPLETE, and
  the two tests that look like scope creep are its unfinished half plus R-10's
  missing premise guard.** Raised by AR-4 against Increment 6, which noticed
  that neither test is named by any ruling and did the git archaeology rather
  than assume.
  - **The correction.** R-9 said Increment 6 retains "the three
    derivation-context dispose-order pins, the orphan-defense pin, and the
    late-settle test", and the campaign plan's RESUMPTION POINT went further and
    called the `openLensSurface` "strip-and-recommendation work" _already done_.
    **Only the strip half was done.** The strip-path pin landed with the code in
    Increment 5 [measured: `git log --oneline -1 -S "announces the generator
    close before the lens open when a lens opens over it" -- <the region suite>`
    → `b8379b8b`], but the RECOMMENDATION path had no test at all until
    Increment 6 [measured: the same command for "announces the generator close
    before a recommendation opens its lens" → no output, i.e. no history before
    this increment]. So Increment 6's T5 is the unfinished half of R-9's own
    item, not an addition beyond it. **Both `openLensSurface` callers now have a
    pin**, and that matters more than the bookkeeping: `commitOpenLens` and
    `commitOpenRecommended` are its only two callers, so moving the pre-close
    down into either one leaves the other silently un-announcing — a mutation
    that leaves every other test in the suite green [measured: that exact
    mutation → 1 failed | 117 passed, T5 alone].
  - **T6 is a premise guard for R-10, recorded because R-10 is a deliberate
    NON-guard.** R-10 leaves the strip's none entry unguarded as a
    generator-close path on the strength of a DOM fact — every strip select
    already sits at its none entry during a generator excursion — and that fact
    was asserted in code only for the honored-excluded lens case, never for the
    generator arm. If a later increment lets a select carry a value during a
    generator excursion, R-10's premise goes false silently and a
    browser-unreachable path becomes reachable. **Disclosed weakness: T6 has no
    realistic one-line mutation falsifier.** It guards a ruling's premise, not a
    behavior, and it pins the select COUNT rather than the length-agnostic
    `.every()` its nearest sibling uses, because `.every()` over an empty list
    is vacuously true and would still pass in exactly the world where the
    premise had failed.

## AR resolutions — 2026-08-04 (Increment 5, the third arm wired, `b8379b8b`)

- **AR-3 CONSIDER, six concerns, all folded.** The one that mattered was a gap
  neither the plan nor the implementing agent had seen: **no test in the
  eighteen-test plan could distinguish a socket built per OPEN from one built
  per MOUNT**, because the placeholder socket is stateless, so the difference is
  behaviorally invisible. `orchestrate/DOCS.md` § State residency commits to
  mount-stability in the present tense (_"the generator socket | the top
  component, created once at mount — the socket's mount-stability is what the
  generator's abort-and-retire mechanics key on"_), so a DOCS-stated invariant
  had zero coverage. AR-3's counter-proposal — reuse the module spy the
  accept/discard tests already need and assert the factory's call count — landed
  as "constructs the generator socket once across a reopen", written in the
  house's own `callsAtMount` shape so StrictMode's double-invoked lazy
  initializer cannot make it flaky. It mutation-fails correctly: moving the
  factory call into the render body fails that test and only that test
  [measured: the mutation, then the suite → 1 failed | 111 passed].

- **Four more AR-3 concerns folded, one premise corrected.** The socket seam
  moved from the real factory at `stageDelay: 0` to an inline double, removing
  the suite's only wall-clock dependency — R-5 had recorded that a real clock in
  a double would be this campaign's first flakiness vector, and `stageDelay: 0`
  still chains two real timers. The accept/discard block was relabelled
  `(Boundaries)` → `(Simple)`, since R-8 scopes it to one happy path each and
  the actual boundary is deferred. The maskable-membership test was strengthened
  from a `closest()` probe — which cannot tell the two identically-attributed
  regions apart — to an ordered `[false, true]` over both, pinning WHICH region
  holds the view. AR-3's fourth concern, that the Generate code button's masked
  state was untested, rested on a false premise: no mask code ships in Increment
  5 at all (the button's inert/dim classing is Increment 8's), so there was
  nothing to test; the underlying ask — record the absence rather than leave it
  silent — was honored in the commit body.

- **AR-4 PROCEED**, no blocker or important findings; three MINOR, all
  evidentiary rather than architectural. Two are resolved above: R-8's missing
  evidence tags and R-9's non-reproducing grep, both corrected in place with the
  correction disclosed rather than silently rewritten. The third — that the
  review prompt said "exactly two files" when the working tree held three under
  `orchestrate/` — was a stale framing in the prompt, written before the
  checkpoint ledger row was appended; the ledger row was in the same commit and
  is the increment's 🔍 evidence, so nothing was hidden from the audit, and AR-4
  found it on its own by running `git status` rather than trusting the count.

- **AR-4 confirmed, independently, the two claims most worth confirming.** That
  `types.ts` needed no edit because its `PaneOccupant` docstring was FALSE
  before this increment and true after it; and that the roster check had to stay
  lens-only or every generator render would throw in dev and prod, since
  `openLens` is structurally `null` for a generator. It also cleared
  `ExcursionSlot` and `commitDiscardCandidate` against the over-engineering and
  trivial-indirection anti-patterns, on the grounds that `MountedLens`,
  `toPhaseEntry` and `commitCloseLens` are the file's own precedents for both
  shapes.

## AR resolutions — 2026-08-05 (Increment 7, accept and discard pinned)

**Increment 7 wrote NO implementation code.** `orchestrate/index.tsx` and
`use-settled-snippet.ts` are byte-identical to their parents [measured: `git
diff --exit-code` on both paths, after the last mutation was reverted]. Five
tests, all GREEN ON ARRIVAL, so red-green validates nothing and
mutation-in-place-and-revert is the ceremony — the campaign's precedent from
Increments 4 and 6. Nine mutations were applied, run, and reverted.

- **Two fail exactly one test each**, which is the strongest evidence available.
  A stray `settled` dispatch injected into `commitDiscardCandidate` fails the
  discard pin ALONE (1 failed | 614 passed): before this increment no test
  recorded dispatches across a discard at all. Hardcoding `type: 'module'` in
  `settleNow`'s replace branch fails the toggled-type pin ALONE (1 | 614) — that
  hardcode would have shipped silently against the 610-test baseline, which is
  the whole reason the fifth test exists.
- **The keep-list hazard was proven live, both ways.** With the stray discard
  dispatch in place, the discard pin fails WITH `'settled'` in its keep list (1
  | 614) and PASSES with the keep list emptied (615 passed, all green). That is
  Increment 6's AR-3 finding reproduced against a genuinely broken
  implementation rather than asserted a second time.
- **The field-equal pin's 2000 ms advance is load-bearing, proven both ways.**
  Dropping `settle.cancel()` from `settleNow` fails five tests WITH the advance
  and four WITHOUT it — the pin passes on a late-settling implementation once
  the window is removed. The advance is what makes its name ("never settles")
  true rather than "does not settle at this instant". The discard pin carries
  the same window as insurance, on AR-3's C7: nothing on that path can arm the
  debounce today, so it guards a future stray rather than a live hazard, and it
  is disclosed as insurance rather than counted as coverage.

**The placement ruling — `(Simple)` left untouched, two flat siblings added**
(`the accepted candidate (Boundaries)` and
`the accept and discard announcements (Interfaces)`), immediately after it.
Renaming `(Simple)` back to `(Boundaries)` would silently re-litigate a recorded
Increment-5 AR-3 outcome (see the resolutions above); the two tests it holds
really are happy-path sanity checks, which is what DEV.md § ZOMBIES defines
`(S)` as. The file carries **zero two-level nesting**, so a nested parent to
reunify the three blocks would itself be a structural novelty in a test-only
commit. **Disclosed against it:** the resulting block order reads `(Simple)` →
`(Boundaries)` → `(Interfaces)`, which reverses the canonical ZOMBIES letters —
kept deliberately, because ZOMBIES governs the order tests are AUTHORED across
increments, not a mandate to re-sort a file each time a later increment lands,
and because re-sorting would move a committed Increment-5 block for cosmetic
reasons. **A first draft of this paragraph also cited DEV.md § Test Ordering in
support; AR-4 caught that the citation overreaches** — that section is scoped
_"**Within each describe block**"_ [read: `git show HEAD:DEV.md` § Test
Ordering], so it governs order INSIDE a block and says nothing about sibling
blocks. Removed rather than stretched. AR-3 asked for this to be a conscious
call rather than a silent artifact; it is.

**Three deliberate non-tests, recorded rather than silently omitted (R-13's
precedent).** "A field-equal accept re-derives nothing" is structurally
unobservable — the only probe is a spied level's `validate`, and
`createMemoizedValidate` keys its slot on content rather than identity, so the
count is 1 either way. "A discard leaves the derivation alone" has no unique
falsifier. "Accept announces `generator-opened:false`, never `lens-opened:null`"
is already carried by every sequence assertion, since the helper names both arms
with their payloads.

**HONEST FRAMING, owed twice.** First, gap 3 asks for `{open:false}` **then**
the settle, but that order is near-structural: the close dispatches
synchronously inside the click handler while `announceSettled` fires after the
commit, so no permutation of `commitAcceptCandidate`'s three statements inverts
it — measured, not assumed (see the AR-3 C1 note below). What the accept pins
genuinely falsify is **presence, payload, and the absence of strays**.

Second, **two of the five have no unique falsifier — but for two different
reasons, and AR-4 was right that collapsing them into one disclosure misleads.**

- **The field-equal pin** is the R-14 case: kept, with the weakness disclosed.
  Every mutation that reaches it also reaches the flush-at-open callers, because
  all three share `settleNow`, and no sharper site exists. Its honest substitute
  is the stray-accept-dispatch mutation, whose entire failure set is this
  increment's own three accept pins and which no pre-existing test notices.
- **The module-type pin is NOT a weakness to apologize for — it is what the
  first half of a triangulating pair looks like by construction.** DEV.md §
  Triangulation asks, of a first test, _"could this be passed by returning a
  fixed value?"_ and requires a second test that makes the hardcode fail; the
  first test of such a pair therefore never has a unique falsifier, by
  definition. Here the toggled-type pin is that second test, and it fails alone
  (1 | 614). **Honest limit on how far the pair goes:** the two do NOT
  triangulate the type field in both directions — the opposite hardcode is
  caught by 12 pre-existing tests, so only the `'module'` direction was ever
  uncovered (see the AR-3 C2 note below). What dropping the module-type pin
  would actually cost is the DEFAULT-type accept announcement losing its only
  dedicated pin.

**AR-3 CONSIDER, no blocker. Its C1 was right, its C2 was wrong, and both were
settled by RUNNING the mutation rather than arguing it.**

- **C1 was right and produced a ninth mutation nobody had planned.** Swapping
  `settleNow()` and `disposeToEditor()` inside `commitAcceptCandidate` leaves
  **all 615 green** [measured: that mutation, then the region suite]. It is
  behaviorally invisible because `onEdit` writes the live source first, so the
  dispose still seeds the candidate. This is the correction to the Increment-7
  brief recorded under Operational notes below — and note what it does NOT
  impeach: the reorder that actually loses the program is dispose-before-intake,
  and that one fails Increment 5's own accept test alone (1 | 614). The code's
  own comment claims exactly that pair and a **later-frame** settle, so the
  comment is correct as written and needed no edit.
- **C2 was wrong, and the measurement is the record.** It argued that a
  hardcoded `type: 'script'` in the same branch would be caught ONLY by the
  module-type pin, making the two accept pins a two-directional triangulation.
  It is caught by **13 tests, 12 of them pre-existing** [measured: that
  mutation, then the suite], because a `'script'` hardcode breaks every
  default-`module` flush path in the region. The triangulation is
  **asymmetric**: only the `'module'` direction was uncovered. That is what
  justifies the fifth test and what denies the module-type pin the unique-guard
  role C2 credited it with.
- **C6 independently confirmed the fifth test is not scope creep**, by checking
  every type-toggle call site in the suite rather than relaying the claim
  [measured: `grep -c "data-type-toggle"` on the region suite → 11]. The
  mutation then confirmed it a second way.
- **C2's naming concern was taken.** Two tests were renamed to lead with their
  falsifiable content (the settled payload's type) rather than the "before"
  ordering the sequence cannot independently prove.
- **C3 was declined, with reason.** It proposed moving the re-derivation pin
  into `the settle loop live (Boundaries)` beside the edit- and toggle-triggered
  siblings. Declined: those two pin the settle LOOP's triggers, whereas this one
  pins that the ACCEPT PATH reaches the loop at all — same observable, different
  subject — and every other accept/discard pin lives in the contiguous generator
  range.
- **C5 was declined for this increment and raised to the maintainer — and AR-4
  then corrected the ground I declined it on.** C5 notes that R-8 is a human
  ruling whose resolving tests carry no `// PINNED` marker. True, and true of
  R-4/R-9/R-14 in this same file. **My first answer said the marker "has only
  ever been used in the `generator/` sub-suite". That was FALSE, carried no
  evidence tag, and was checkable in one command** — AR-4 found the
  counterexample: `orchestrate/lib/composing/tests/join-level-roster.test.ts`
  carries two ruling-derived markers inside this region and outside
  `generator/`, committed 2026-08-04 [measured: `grep -rn "// PINNED"
  --include="*.test.ts" --include="*.test.tsx" src/lib/study-lenses/orchestrate/
  | grep -v "/generator/"` → 2 hits, lines 29 and 55; note their `R-8` is the
  2026-07-30 built-ins-first ruling of a DIFFERENT campaign, not this log's
  R-8]. Repo-wide the marker is used in **25** test files [measured: `grep -rl`
  on the same pattern over `src/`]. **So the convention is already established
  in this very region, not a novel ask** — which strengthens C5 rather than
  weakening it. Recorded rather than quietly rewritten, because this is the same
  failure mode R-9 corrected in itself and the correction is the point. The
  decline still stands on its own independent ground: the pinned-guard hook
  resolves to a DENIAL in a non-interactive session, which would make the marked
  line uneditable for every later increment. Whether this file's ruling-derived
  tests should carry markers is a standing question for the maintainer, not an
  Increment-7 call.

## Operational notes (not rulings, but they cost time once)

- **`expect(act(…)).rejects` silently produces a FALSE POSITIVE.** RTL's `act`
  returns a custom thenable, not a real promise, and vitest's `.rejects`
  mishandles it: the assertion resolves as `undefined`, its own AssertionError
  escapes as an UNCAUGHT exception, and the test still reports as passed. Three
  tests passed vacuously this way before the `Errors` summary line caught it.
  Use the function form —
  `await expect(async () => { await act(…) }).rejects.toThrow(…)`. This is the
  concrete case behind the standing rule to grep all three vitest summary lines,
  never just `Tests`.

- **The pinned-guard hook cannot be satisfied in a non-interactive session.**
  Its "ask" has no one to answer, so it resolves to a denial and a
  `// PINNED`-marked assertion becomes uneditable rather than guarded. It first
  fired live on 2026-07-30, on a false positive — a typo fix that preserved the
  assertion's meaning exactly. The maintainer's chosen workaround is to approve
  the edit interactively; routing around it with `Write` is not sanctioned.

- **The Increment-7 cold-start brief carried one FALSE claim, and it was
  load-bearing enough to have produced a bogus test.** Under "the three facts
  that will cost you most" it stated that in `commitAcceptCandidate` —
  `onEdit(program)` → `settleNow()` → `disposeToEditor()` — _"reversing the last
  two loses the learner's program, because the dispose seeds the remounting
  editor from `readLiveSource()`"_. It does not. `onEdit` writes
  `liveSource.current` before either of them [read:
  [use-settled-snippet.ts](../../src/lib/study-lenses/orchestrate/use-settled-snippet.ts)
  § `relayEdit` — _"liveSource.current = source; settle(source)"_], so the
  dispose still seeds the candidate: that swap leaves **all 615 tests green**
  [measured: the mutation, then `npx vitest run
  src/lib/study-lenses/orchestrate`]. The brief mis-paraphrased a **correct**
  code comment, which claims the intake-before-dispose order (a real hazard —
  that reorder fails Increment 5's accept test, 1 failed | 614 passed
  [measured]) and a **later-frame** settle against the coherence anchor, neither
  of which is the pair the brief named. No code change was warranted. **The cost
  avoided:** a test written to pin the brief's stated order would have been
  unfalsifiable, exactly the shape R-13 dropped.

- **A mutation site's blast radius includes suites the brief does not name.**
  The same brief noted that `settleNow` _"has its own suite"_; that suite holds
  **three** retention pins its sanctioned mutation breaks [read:
  [tests/use-settled-snippet.test.tsx](../../src/lib/study-lenses/orchestrate/tests/use-settled-snippet.test.tsx)
  — _"retains the settled identity when the buffer equals the settled pair"_,
  _"cancels the pending debounce even on a retained-identity flush"_, _"retains
  the first flush's pair on a second flush with no edit between"_], and they sit
  inside the region's own 615. Forcing that flag false fails **13 | 602**
  [measured], not the handful the brief implied. Before recording a mutation as
  evidence, run it — a predicted `N failed` is not a measured one.
