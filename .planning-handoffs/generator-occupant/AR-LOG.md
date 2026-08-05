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
  — there are zero production bus subscribers anywhere in the repo [measured:
  `grep -rn "\.subscribe(" src/ spiralearn/ | grep -v /tests/` → no output]. The
  bus is region-internal by contract, so the cost is documentation truth, not a
  broken consumer. Increment 6 retains the three derivation-context
  dispose-order pins, the orphan-defense pin, and the late-settle test.

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
