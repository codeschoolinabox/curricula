<!-- TRANSITIONAL — delete when the evaluators-intercept campaign completes. -->

# evaluators/intercept campaign — ruling log

Human rulings and AR resolutions for ceremony 3 of the evaluators sprint: the
`intercept` evaluator, the boundary member of the evaluator kind — run plus the
program's own I/O as events, and the first evaluator to emit the kind's
distinguished pending interaction.

Campaign ledger:
`~/.claude/plans/read-0-curricula-dev-md-and-0-curricula-abundant-wand.md`; this
ceremony has its own plan of record under `~/.claude/plans/`. Recorded here
because a ruling that lives only in a plan file does not exist — `git grep`
cannot see it ([DEV.md § Ruling provenance](../../DEV.md#ruling-provenance)).

**Written here, not to the sibling's log.**
[`../evaluators-run/AR-LOG.md`](../evaluators-run/AR-LOG.md) opens
`<!-- TRANSITIONAL — delete when the evaluators-run campaign completes. -->` and
its title scopes it to that evaluator, so intercept's rulings would be buried in
a file marked for deletion. DEV.md § Ruling provenance's "add no new file" bars
new ruling-home KINDS, not a campaign's own AR-LOG instance — the
`aithor-contract-proposals` and `jej-registration` logs are the precedent. The
run log is READ (it carries what intercept inherits) and never written to.

## Session baselines — measured 2026-08-04, ceremony baseline `59a5ef60`

Recorded so a later reader can tell foreign debt from this campaign's own.

- `[measured: git rev-parse HEAD]`
  **`59a5ef60e01914ef8689806529c48511da08e581`** at ceremony start. Ceremony 2
  closed at `5e954753`; peers landed commits since.
- `[measured: git log --oneline 5e954753..HEAD -- <evaluators, lib/engine, lib/loop-guard>]`
  one commit, `18223536` — this campaign's own run/ docs repair. Every consumed
  contract is otherwise untouched since ceremony 2 closed.
- `[measured: npx tsc --noEmit]` 2 errors at ceremony start, both FOREIGN, both
  in `src/lib/study-lenses/embody/derive-ast.ts` (a concurrent stream's
  in-flight paren-truth work); that peer fixed them mid-session and the same
  command reports **0** at close. Zero in `evaluators/intercept/` throughout.
- `[measured: ./node_modules/.bin/vitest run --project unit src/lib/study-lenses/evaluators src/lib/study-lenses/lib/engine src/lib/study-lenses/lib/loop-guard]`
  26 files / 409 tests green, unchanged by this docs-and-types commit.
- The browser suite was NOT re-measured: Phase 0 commits no test and no runtime
  code, so the browser tier is not a gate for this ceremony. It is a Phase-1
  obligation.
- The worktree carries a concurrent stream's uncommitted work throughout —
  including the in-flight governance campaign's `DEV.md` / `AGENTS*.md` edits —
  so every commit uses explicit pathspecs on both `git add` and `git commit`
  ([DEV.md § Shared-worktree git mechanics](../../DEV.md#shared-worktree-git-mechanics)).

## Human rulings — 2026-08-04

- **H-1 — the Phase-0 artifact set is the trio; the NM-doc obligation is
  deferred, not dismissed.** `DEV.md`'s WORKING-TREE copy adds § Territory
  tracks, which gives the default 🔬 Frogramming track a fourth artifact — an
  "NM doc" — beside README/DOCS/types, and states that a directory acquires its
  track's artifacts the first time work lands in it. `evaluators/intercept/` is
  new, so the rule reaches it on its own terms, and
  `[read: AGENTS.principal.md § Non-Negotiable Invariants, 2 — "An agent never selects the track and never trims the list itself."]`
  bars the agent from deciding. Put to the human with the evidence that the
  obligation is not yet ratified —
  `[measured: git show HEAD:DEV.md | grep -c "Territory tracks"]` → **0**;
  `[measured: grep -rlE '^# .*[🔬🎨🪷🐸]' src --include=README.md | wc -l]` →
  **0** directories carry a track marker; and
  `[read: HUMANS.md § Override grammar]` carries no track-routing phrase at all,
  so the routing mechanism § Territory tracks points at is not yet written.
  **Ruled: the trio only, flagged at the gate.** Executed rather than inferred:
  the NM-shaped content — what a lens author must be able to _predict_ about a
  run — went into `README.md § What a consumer can predict` rather than being
  dropped, and this entry is the auditable record of the deferral. What would
  close it: the governance campaign landing § Territory tracks, and a decision
  on the filename (`notional-machine.md` collides with the language-level
  documents at `language-levels/jej/notional-machine.md`, which are curriculum
  content, not a module twin).

- **H-2 — the engine's per-yield charge is budgeted for, following the tracers'
  recorded discipline.** `ar-1` found a ceiling nobody had priced: the engine
  deducts a flat charge per YIELDED event against a 5-second default, so ~1000
  events exhaust the budget with almost no real runtime, and a densely emitting
  learner program settles `timeout` mid-stream. The sibling evaluator yields
  nothing, so this cost was exactly zero for it and its "seconds stay the
  engine's own default" bullet was inherited for free. Three branches were put
  to the human: document it; gate worker-side and add a truncation event kind
  (contract-shaping); or amend the region ruling that keeps `seconds` the
  engine's. **Ruled: "budget for it" — and that a previous tracer had already
  solved this satisfactorily.** It had, in two places, and the agent had not
  studied them:
  `[read: src/lib/embody/lib/evaluating/trace/variables/DOCS.md § Emit everything; gate worker-side if it ever matters — "The honest cost: an iteration-heavy loop exhausts the time budget through per-emit yield charges and ends timed-out … The pressure valve, if a future consumer needs it, is worker-side aggregation before emitting"]`
  and
  `[read: src/lib/embody/lib/evaluating/trace/semantics/DOCS.md § The budget already measures runtime; the yield charge is the one gap (D4) — "the D4 ask is NARROW: a **yield-charge opt-out** on the engine spec (a consumer that owns its own iteration cap does not need the synthetic wall-clock valve) … loop safety rests on the iterations cap, not the clock"]`.
  The resulting shape, in all three artifacts: emit everything; name the cost
  honestly; rest loop safety on the `iterations` cap rather than the clock;
  leave worker-side aggregation as a named valve that stays unwritten until one
  is needed; and treat the narrow fix as the engine's, not intercept's. The
  semantics tracer's framing also corrected the agent's: the budget is
  **already** runtime-honest — it pauses for interaction and for consumer
  think-time — and the flat charge is a _synthetic valve layered on top_, which
  is what binds first at emitting granularity. **The D4 ask is still open**:
  `[measured: grep -n "readonly" src/lib/study-lenses/lib/engine/types.ts]` the
  greenfield `EvaluateSpec` carries no yield-charge opt-out. intercept qualifies
  for it on the same grounds the semantics tracer did.

- **H-3 — D2 is honored literally: an `alert` record carries `returnValue`.**
  The campaign's ratified D2 says "alert/confirm/prompt records carry
  returnValue"; the agent had written the `alert` record without one, on the
  grounds that nothing returns to an `alert` and that absence is a real
  representation under `exactOptionalPropertyTypes`. `ar-1` confirmed three of
  four sources favored that reading (D3's "answer ignored", the behavior
  reference's alert event, and the sibling's committed "each arm carrying
  exactly the fields that exist for it") but ruled correctly that an AR cannot
  amend a ratified ruling. **Ruled: honor D2 literally — these traps model the
  browser-native `alert` explicitly, and the fact that it hands back `undefined`
  is part of what is being modelled, not an absence to infer.** Expressed as a
  required property typed `undefined`, so the contract states the modelled value
  rather than omitting it.

- **H-4 — `evaluators/PHASE-1-HANDOFF.claude-delete-if-stale.md` is KEPT.**
  Rev-C had this ceremony propose deleting it at the gate. Proposed with its
  price measured rather than relayed: `[measured: wc -l]` **148 lines**;
  `[measured: git log --oneline -1 -- <it>]` **empty — untracked, never
  committed, so deletion is unrecoverable**;
  `[measured: grep -cE "variables|semantics|syntax|tracer"]` **29 lines** are
  tracer material (quarry `trace/{variables,semantics,syntax}` prior art, the
  variable/binding/environmentDiff event design, and three open human decisions
  for sprints 3–5). Intercept's Phase 0 harvested none of it — Rev-C's harvest
  covered the intercept contract, not this file. **Ruled: keep it.** It stays
  foreign and untracked; no ceremony stages it. The next natural reader is the
  variables-tracer sprint, which is where its content is addressed; a delete
  proposal belongs there, not here.

## AR resolutions

`ar-1` fired at step 0.3, before `types.ts`; `ar-2` at step 0.6, over the three
artifacts together. AR-5 does **not** fire in this ceremony; it waits for the
sprint's Phase 2, after this ceremony's Phase 1.

### `ar-1` on the README (**PAUSE** → all findings resolved)

Four blockers and twelve further concerns. Two blockers became human rulings
(H-2, H-3). The rest were resolved in-pass; the reviewer's own assessment of the
design was that "the ordering ruling, the teardown-before-release commitment,
the contravariant-parameter argument for keeping `respond`'s `unknown`, and the
refusal to invent a settlement author are all correct and hard-won."

**Three statements were false, all in this campaign's recorded failure mode — a
verified fact generalized one step too far.** Recorded individually because the
`ar-1` on ceremony 2's close-out commit caught three of exactly this shape, and
the pattern is now twice-observed rather than once:

1. "intercept's halt has no foreign object inside it to protect" — false.
   intercept's halt carries the guard's **trip record**, which
   `[read: evaluators/lib/iteration-guard/README.md § The three verbs — "The record comes back **by reference** — the stamped object, never a copy, never re-frozen."]`
   hands back by reference, exactly as the sibling's does. The sentence was the
   whole stated warrant for not freezing the payload. Replaced with the
   sibling's own ratified second leg.
2. "the Node tier reaches every path a console-only program takes" — false. The
   fake transport runs the whole program eagerly and synchronously before the
   first pull is answered, so it reaches every piece of **logic** and nothing
   about **timing**. Rewritten on that split, with the emit-pause hold,
   consumer-paced execution, and a mid-stream cancel moved to the browser tier.
3. A contrast with the sibling's stream that does not exist — the sibling does
   not finish on its own either.

**The design changes the reviewer's counter-proposals produced**, each adopted:

- **`step` became the EVENT ordinal; pairing became adjacency.** The original
  design gave a dialog's two events one shared boundary-moment ordinal. Three
  collisions: "moment" is already the kind's word for an event
  (`[read: evaluators/types.ts — "One streamed moment of a run."]`), so defining
  a boundary moment as two events redefined it; `step` is the behavior
  reference's field name with per-event denotation, so an implementer harvesting
  shapes after reading the README would implement per-event numbering that
  compiles, passes, and silently destroys the pairing; and `step` is the tracer
  family's natural word. And the pairing was **redundant** — the ratified "at
  most one boundary moment is ever in flight" already guarantees the record is
  the very next event after its pending interaction. Adjacency pairs them; the
  shared ordinal was a second copy of that fact, and not a safe key.
- **Span fidelity: spans are read from the ORIGINAL text.** The rejected
  alternative — stamp from the guarded parse and disclose a residual — fails on
  the modal shape the module exists to serve, `for (…) { console.log(i); }`,
  where the guard call is spliced immediately before the `console.log` and puts
  its start column well past its real position. The agent's own description of
  the residual set was also too narrow: the reset splices after `}`, and a
  do-while's after `while (cond)` — neither is a brace. Placement is computed
  against the guarded text, spans are reported from the original, and the two
  readings are **reconciled**: a disagreement about which calls exist is a
  machinery defect, not an assumption. The parse goal is pinned rather than
  inherited.
- **The loc wrap declines calls it cannot enclose.** A wrap is a function call,
  so a call whose arguments suspend on the surrounding function would become a
  syntax error the learner never wrote, and one whose short-circuit a wrap
  defeats would change what runs. Those are left unwrapped and carry no
  location. Stated as a rule with illustrative shapes rather than a closed set —
  `ar-2` later added a third (a call whose scope is its own call site).
- **Three engine-integration invariants the sibling teaches WRONGLY**, none of
  which a green unit test catches: the engine's stream must be **claimed before
  its settlement is touched** (the sibling never creates an iterator and relies
  on the engine's drain — copying that shape loses the leading events silently);
  teardown must **never wait on the engine's own stream exit** (it awaits a
  settlement the suspended ask is blocking — a guaranteed deadlock); an
  outstanding pull must **never be re-issued** (the engine keeps one waiter and
  a second request strands the first forever).
- **Teardown wins over validation, plus a diagnostic.** The kind's "answering
  after teardown is a no-op, never a throw" is absolute and committed in two
  places, so validation-first would falsify it for a race-dependent subset. But
  silence makes a dev defect throw or not depending on unmount timing — the
  worst property for a defect signal — so a post-teardown answer that would have
  failed validation is warned about. That is the region's own idiom
  (`[read: run/create-run-stream.ts — assembleDefect's console.warn]`).
- **Naming: the instrument is the loc wrap.** The agent had coined "the
  attribution wrap", a third name for something iteration-guard's README already
  reserves as "the call-expression loc wrap (`__$lc`)".
- Also applied: the D9 byte ceiling expressed as the one bad answer the channel
  cannot catch; the current-loc stack declared as a mutable-state exception;
  decode deferred off the per-call path; and the missing edge cases the reviewer
  enumerated (a learner reassigning a trap, a dialog nested in a console
  argument, a module run whose top-level evaluation rejects, `loc: null` being
  effectively unreachable for records).

### `ar-2` on the trio (**PAUSE** → all findings resolved)

Two blockers, eleven further concerns. **Decomposed and executed under the
standing ruling rather than bubbled**, and recorded here for human audit: the
reviewer's own summary is that "none of this is a design failure — the design is
sound and the rulings landed correctly; it is a modelling gap plus
copy-editing", and no finding opened a contract question the human had not
already ruled on. The full trail sits in the plan of record; the gate sees it.

**Blocker — the "race two sources" rule was wrong, and the reviewer produced the
sequence that breaks it.** The sketch said a consumer's pull awaits both
thread-side sources and is answered by whichever the program reached first. That
answers by arrival-at-the-pull, not by program order, and the two diverge in
exactly the window the retention rule creates. Verified independently against
the engine this session: `waitForPull` resolves a parked waiter and returns
immediately, so `deliverMessage` calls `transport.resume()` at once — a
**retained** pull releases the worker with no consumer waiting. So after a
pending interaction is yielded on pull _n_, the retained reach absorbs the
dialog's record, the worker runs on to a second dialog, and pull _n+1_ arrives
with a buffered record AND a parked ask — at which point "whichever source has
something" can deliver the second pending interaction ahead of the first
dialog's record. That breaks the adjacency guarantee the entire pairing design
rests on. **Resolved by replacing the race with a queue**: both sources join ONE
arrival queue in the worker's post order (which the engine guarantees is the
program's order), a pull takes the head, and the race survives only as the
empty-queue case. The buffer is now stated rather than denied.

**Blocker — no phase owned serving a consumer pull.** The claim, the queue, the
retained reach and the pacing lived only as constraint prose, so the stream
factory — one of the eight planned increments — had no phase for the Refactor
step to be held against. That absence is why the reordering bug was invisible.
Resolved by adding **Serve the pull** as its own phase, and by splitting the
former "Instrument and assemble" so the span reconciliation is a structural
target rather than a clause. Eleven phases against the sibling's seven, which is
correct: intercept has a thread-side machine the sibling does not.

**Three more false sentences**, the same failure mode again:

1. "a worker has none of the latter natively" covering console — false, and
   scoped correctly by the engine itself
   (`[read: lib/engine/README.md § The two-sided contract — "(Note for dialog mocks: Workers have no native prompt/alert/confirm at all …)"]`).
   For console, injection **shadows**; for dialogs, it **creates**. Notably the
   behavior reference's DOCS carries the same over-generalization while its
   README is precise — the sketch had copied the wrong one.
2. The hold stated unconditionally — falsified by the retained reach, which is
   one event of slack after every pending interaction. Now qualified and
   bounded.
3. The Testing paragraph attributing interaction-channel coverage to the fake —
   the fake rejects an asynchronous round-trip outright and would settle a
   dialog program as a defect. The channel is Node-tier but driven **directly**;
   the README had this right and the DOCS compression had broken it.

Also applied: the interaction request's shape reconciled across all three
artifacts (the `loc` and `step` ride the wire envelope, not the request — the
types were right and the README and diagram were not, so an **ask message**
glossary entry was added); teardown sharpened to "out of band, never through the
engine's own stream exit", plus an answer for a pull outstanding at teardown;
two out-of-scope bullets naming the caller's real obligations (ending a
suspended run, sizing an answer against the channel ceiling); the diagram's
unlabeled identity edge labeled, the record nodes renamed to their pre-narrowing
state, the dev-condition edge moved to the step that produces it, and
queue/stream nodes added so the module's own output is on the diagram.

## Carried forward — for the Phase-0→1 gate and beyond

- **H-1's NM-doc deferral**, and the governance gap behind it: § Territory
  tracks routes through `HUMANS.md § Override grammar`, which carries no
  track-routing phrase. Foreign in-flight campaign; not this ceremony's to fix.
- **H-2's open engine ask** — a yield-charge opt-out on the engine spec for a
  consumer that owns its own iteration cap. Raised first by the semantics
  tracer, still unlanded, and intercept is now a second consumer with the same
  claim.
- **Promotion into `evaluators/lib/`** stays a close-out question, designed
  against both concrete evaluators. This ceremony promoted nothing; the README
  names the shared-in-waiting surface explicitly.
- **What a Phase-1 implementer must still be told**, per `ar-2`'s step-0.7
  check: the wrap's span encoding (whether it reuses iteration-guard's
  `'L:C:L:C'` form or its own); whether the declined-call set is computed
  symmetrically over both parses, since a decline decided on one side only
  shifts every later pairing; which call-ish nodes are in scope beyond plain
  call expressions; the narrowing predicate's depth; and how a zero-argument
  dialog decodes its message. These are Phase-1 increment briefs, not Phase-0
  contract gaps — recorded so they are briefed rather than guessed. [Answered: §
  Phase-1 briefing decisions below, B-1…B-6.]

## Phase-1 briefing decisions — 2026-08-05, ratified at the Phase-1 plan gate

`[relayed: the ratified Phase-1 plan, ~/.claude/plans/read-and-execute-the-sharded-pebble.md]`
— the human approved the plan carrying these six decisions verbatim. They answer
`ar-2`'s five briefing gaps plus the handoff validator's sixth; the committed
trio deliberately leaves all six to implementation, so they are recorded here
before I1's first test rather than settled by one by accident. An independent
Plan-agent design pass (verdict CONSIDER) challenged them before ratification;
its two substantive corrections are already folded in (B-5's per-dialog IDL
split; B-2/B-3's widened decline shapes).

- **B-1 — span encoding: the wrap reuses `'L:C:L:C'`** (1-based lines, 0-based
  columns — loop-guard's committed encoding, the same form the quarry's Seam 4
  pinned for `__$lc`
  `[measured: grep -n "L:C:L:C" src/lib/embody/lib/evaluating/evaluators/intercept/types.ts]`).
  One region, one span encoding, one decode discipline (four finite numbers or
  no record). The CODE is not shared: intercept authors its own in-file encode
  and decode helpers — iteration-guard's decoder is a private in-file helper,
  and promotion into `evaluators/lib/` stays barred mid-sprint.
- **B-2 — the decline rule runs over BOTH readings, symmetrically.** One
  syntactic eligibility predicate (a function of the call node's own subtree),
  applied identically to the original parse's and the guarded parse's call lists
  (after the `__$`-callee skip). The guard splice inserts only single-line
  `__$`-prefixed statements, so it cannot change a learner call's subtree shape;
  the two filtered lists must correspond 1:1 in reading order, and the
  reconciliation asserts it (B-6).
- **B-3 — call-ish scope: ESTree `CallExpression` nodes exactly**, honoring the
  committed README's "every call expression" literally (the H-3 discipline) and
  matching the quarry's node set. `NewExpression`, tagged templates, and
  `ImportExpression` are not wrapped — a throw through them carries `loc: null`,
  which the contract allows. A `CallExpression` whose callee is `Super`, and
  direct `eval`, are in the node set and DECLINED under the ratified rule ("a
  call whose scope is its own call site" — `ar-2`'s third shape);
  `await`/`yield` belonging to the enclosing function anywhere in the call's own
  subtree (callee position included) declines too, since `() => (await f)()` is
  a syntax error the learner never wrote.
- **B-4 — the narrowing predicate validates full declared depth, except learner
  values**: `kind` against the four record literals; `step` finite; `loc` null
  or a full four-finite-position span; `method` a string on `console`; `args` an
  array whose ELEMENTS stay `unknown` (that IS the declared depth);
  `returnValue` per kind exactly (`alert` present-and-`undefined`, `confirm`
  boolean, `prompt` string-or-null). Anything less is dropped, never guessed at
  — iteration-guard's full-`LimitTrip`-depth precedent and run's `narrowHalt`
  rule.
- **B-5 — zero-argument dialogs decode as the platform renders them, PER DIALOG
  (WebIDL).** `alert` is two overloads: `alert()` → `message: ''`,
  `alert(undefined)` → `message: 'undefined'`. `confirm`/`prompt` declare
  `optional DOMString message = ""`, where an explicit `undefined` counts as
  omitted: `confirm(undefined)` and `prompt(undefined)` decode `message: ''`.
  Otherwise `message = String(args[0])`. `prompt`'s `defaultValue` is ABSENT
  when the second argument was omitted OR `undefined` (the browser's own
  `prompt('x', undefined)` shows an empty input); present otherwise as
  `String(args[1])`. This models the platform, which is what H-3 ratified these
  traps as doing.
- **B-6 — a reconciliation disagreement THROWS a typed boundary error**
  (loop-guard's `LoopGuardError` shape: a real `Error` plus a discriminant tag
  and reason), caught by assemble's existing try/catch and routed to the
  `'defect'` arm with cause `'unreachable-outcome'` — the destination
  `InterceptDefectCause` already names for "an instrument-time dev condition
  that short-circuited past the engine" (ruling R-2's precedent).

**Phase-1 step-0 baselines** — measured fresh, 2026-08-05:

- `[measured: git rev-parse HEAD]`
  **`ff5625c4afdae15925d72825a7279ccdf20e4002`** — the CANDIDATE AR-5 baseline
  for the sprint's Phase 2. **Open flag for the human**: whether that AR-5 diffs
  the whole sprint (ceremony 2 + 3, by SHA list — ~19+ foreign commits
  interleave, so by-SHA scoping is mandatory either way) or ceremony 3 only. Not
  settled here.
- `[measured: npx tsc --noEmit]` **0 errors**.
- `[measured: ./node_modules/.bin/vitest run --project unit src/lib/study-lenses/evaluators src/lib/study-lenses/lib/engine src/lib/study-lenses/lib/loop-guard]`
  **26 files / 409 tests green**.
- `[measured: ./node_modules/.bin/vitest run --project browser src/lib/study-lenses/lib/engine src/lib/study-lenses/evaluators]`
  **10 files / 148 tests green**.
- `[measured: git log --oneline 2dbc4db9..HEAD -- <evaluators, lib/engine, lib/loop-guard>]`
  **empty** — every consumed contract untouched since the ceremony's last
  commit.
