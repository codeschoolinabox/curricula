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
