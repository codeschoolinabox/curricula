# Loop-Guard Agent — implementation + expansion

## Role

You are the **loop-guard agent** for the @study-lenses codebase. Your
task is to restore the originally documented comma-in-condition loop-
guard design (or an equivalent zero-line-shift design) and extend it
to cover all JavaScript loop types — not just `while`.

## Session-origin context

The documentation across `evaluating/run/DOCS.md` and
`evaluating/shared/DOCS.md` describes a **comma-in-condition** loop-
guard strategy:

```js
// Before:               After:
while (x < 10) {         while (++loop1 > 100 && guard(1), x < 10) {
```

With:
- `loop1, loop2, ...` declared as globals in the Worker setup script.
- A `guard(id)` function also declared in setup that throws a
  descriptive `RangeError` with loop ID and limit.
- Zero line shift, zero column shift on the condition.

The user confirmed in the 2026-04-22 session that a prior agent
inadvertently substituted this design with **body injection**:

```js
// Current body-injection (NOT the intended design):
while (x < 10) { if (++loop1 > 100) throw new RangeError("..."); /* body */ }
 loop1 = 0;
```

The prior agent likely considered body-injection simpler; it adds a
guard inside the body and a counter-reset after the closing brace.
This is the code that currently ships in
`evaluating/shared/guard-loops/guard-loops.ts`, and the tests in
`evaluating/shared/guard-loops/tests/guard-loops.test.ts` were written
against that template.

User's direction: **keep the docs (which describe the intended
design); update the code to match.**

Additionally, user wants to **extend loop-guard coverage** to all
JavaScript loop types. Currently only `while` is guarded. Out-of-scope
today but should be in the new design:

- `for (init; cond; update) { ... }`
- `do { ... } while (cond);`
- `for (x of iterable) { ... }` (user note: current docs say "for-of
  iterates finite collections, no guards needed" — user may want to
  re-evaluate)
- `for (x in obj) { ... }` (same consideration)

## Session commit trail (context for what you're building on)

| Commit | Summary |
| --- | --- |
| `68fa998` | Task B — iteration-guard gate widened to `Number.isFinite`. 0/negatives now inject guards (and throw on first iteration). Only `Infinity` skips. Your new design must preserve this contract. |
| `dc58199`, `ec56a4f`, `121db0c` | Unrelated to loop-guard — cancel/result/doc-sweep. Touch only `run.ts` and `shared/types.ts`, which you may read but shouldn't edit (except the narrow `guardLoopsCondition` call site in run.ts if your new API requires it). |

The existing `guard-loops.test.ts` has 25 passing tests, including 4
ZOMBIES edge-case tests added in Task B for `maxIterations ∈ {-1, 0,
1, 3}`. Your new template implementation must pass these edge-case
tests (the first-iteration-throws behavior for non-positive limits is
a hard contract).

## Goal

1. **Replace body-injection with comma-in-condition** (or a chosen
   equivalent zero-line-shift design) — matching the documented
   intent.
2. **Extend coverage** to `for`, `do-while`, `for-of`, `for-in`
   per user direction.
3. **Preserve the Task B contract**: `maxIterations ∈ {0, -1}` throws
   on the first iteration; `Infinity` skips guards; any finite number
   injects guards.
4. **Preserve zero-line-shift and zero-column-shift** on existing
   code — the whole point of the original design.
5. **Update tests** to exercise all covered loop types + existing
   edge cases.
6. **Fill in missing docs**: write `shared/guard-loops/README.md`;
   fix `shared/README.md`'s broken link to `guard-loops/README.md`;
   reconcile any stale language in `run/DOCS.md` and `shared/DOCS.md`.

## Files to read first

Absolute paths, read in this order.

1. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/AGENTS.md`
   — mandatory. Workflow rules, AR protocols, batch-fix directive.
2. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/DEV.md`
   — mandatory. Codebase conventions.
3. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/.handoffs/COORDINATION.md`
   — check for active merge-agent claims on shared files before you
   start editing.
4. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/shared/guard-loops/guard-loops.ts`
   — your primary target. Current body-injection implementation.
5. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/shared/guard-loops/tests/guard-loops.test.ts`
   — existing 25 tests, including Task B's edge cases. Many will need
   rewriting for the new template; the ZOMBIES edge cases MUST still
   pass.
6. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/DOCS.md`
   — the intended design's full description, especially §Why
   comma-in-condition loop guards.
7. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/shared/DOCS.md`
   — §Why guard-loops moved to shared (stale; describes run-vs-debug
   split that no longer exists).
8. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/create-worker-script.ts`
   — where `loopParams` are injected as `new Function` parameters and
   initialized to 0. If your new design changes the counter-declaration
   strategy (e.g., Worker setup globals instead of Function params),
   this file needs matching changes.
9. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/run.ts`
   — read-only from your perspective. Note the `guardLoopsCondition`
   call site at the top of `createRunGenerator`'s body() — if your
   new API signature changes, this call site updates with it.
10. `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/shared/README.md`
    — has a broken link to `guard-loops/README.md`. Fix when you
    create that README.

## User decisions (locked 2026-04-22)

All five pre-start questions are answered. Summary here; full
rationale inline below.

1. **Restore vs. adjust the original:** **Study the original first
   via git history, then discuss with user.** See Sub-task 0 below —
   this is a two-step process, not a single decision.
2. **Counter declaration:** **Worker setup globals — consistent with
   other Worker-setup globals.** Drop the current `new Function`
   parameter-injection mechanism.
3. **for-of guards:** **Cover defensively.** Better safe than sorry,
   even though JEJ shouldn't allow infinite for-of. Discuss the
   specific injection site with the user when you get there.
4. **Injection syntax per loop type:** **Same template for
   while/for/for-of/for-in.** **do-while is the special case** — the
   counter goes around the `do` keyword, not around the trailing
   `while (cond)`. Exact syntactic form will emerge from Sub-task 0.
5. **Recursion guards:** **No.** JEJ has no user-defined functions;
   browsers provide a max-recursion error for edge cases.

### Details per decision

**Q1 — Study first, then discuss.** The user flagged that the
comma-in-condition design "was carefully designed" before a prior
agent substituted it with body-injection. Treat the original as a
load-bearing artifact. Your first step (before Phase 0) is Sub-task
0 below — find the original, summarize it, propose restore-vs-adjust
with specific pros/cons, wait for user's decision.

**Q2 — Worker setup globals.** Declare `loop1..loopN` as `let` or
`var` in the worker script string's setup region alongside the
existing globals (traps, `events` array, `controlView`, `payloadView`,
etc.). Requires computing N during AST walk (same as today), then
passing N into the worker script generator (new signature — update
`createWorkerScript(loopCount)` or similar). Drop the `loopParams`/
`loopArgs` injection into `new Function(...)`.

**Q3 — Cover for-of defensively.** The user's reasoning: JEJ
*shouldn't* allow infinite for-of (no generators, no custom iterables
in the JEJ surface), but the learner could invent ways — better safe
than sorry. When you get to for-of / for-in injection, surface the
specific approach to the user before implementing (there's a
tradeoff between header-injection vs. body-injection with an
intentional one-line shift on the body). Post in COORDINATION.md
§Open questions with the concrete options.

**Q4 — Same template; do-while special.** The bulk of loop types
(while, for, for-of, for-in) can share the comma-in-condition idiom
or whatever equivalent the original design used. **do-while** is
different: because its test runs AFTER the body, the counter should
wrap the `do` keyword (not the trailing `while (cond)`). Exact
syntactic mechanism will become clear once Sub-task 0 surfaces the
original design — user confirmed "you'll know when you find the old
implementation."

**Q5 — No recursion guards.** Don't invent them. No user-defined
functions in JEJ; recursion isn't a realistic failure mode. Browsers
throw `RangeError: Maximum call stack size exceeded` anyway.

## Sub-task 0 — Find the original implementation (BEFORE Phase 0)

**Do this first. Do not start Phase 0 until this sub-task is
complete and the user has weighed in.**

The documented comma-in-condition loop-guard design is not in the
current code — a prior agent substituted it with body-injection. The
user told the orchestrator that the original was "carefully designed"
and wants to study it before deciding whether to restore it exactly
or adjust it.

### Steps

1. **Trace the current file's history.** Run:
   ```sh
   git log --follow -p src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/shared/guard-loops/guard-loops.ts
   ```
   Identify the commit where the body-injection was introduced and
   the commit before it (the original comma-in-condition version).

2. **Also check the earlier `/debug/` location.** The `guard-loops/`
   module may have moved from `lib/evaluating/debug/guard-loops/` to
   `lib/evaluating/shared/guard-loops/` at some point (the
   2026-04-22 session's checkpoint commit `68fa998` shows a rename
   from `evaluating/debug` to `snippetry/debug` for some files). Run:
   ```sh
   git log --all --full-history -- "**/debug/guard-loops/guard-loops.ts"
   ```
   Extract all historical versions.

3. **Find the earliest comma-in-condition implementation.** That's
   the "original carefully designed" version. Capture its full
   contents (the function body) into a scratch file or your
   notebook for reference. Note especially:
   - The exact template: `while (++loopN > max && guard(N), cond) { ... }`
     (or whatever the original used).
   - How `guard(N)` is defined in the worker setup (what error does
     it throw? what metadata does it include?).
   - How loop counters are declared (globals in worker setup? some
     other mechanism?).
   - Any subtleties: zero-line-shift proof, column-shift handling,
     nested-loop numbering, counter-reset behavior across loop
     exits.

4. **Summarize to the user.** Post a concise writeup in
   COORDINATION.md §Status log (or directly in chat if dispatched
   that way). Include:
   - The commit hash of the original.
   - The template shape.
   - The counter declaration strategy.
   - The guard-function definition.
   - Your assessment of what's still good (keep) vs. what might need
     adjustment for the all-loop-types expansion.
   - Your recommendation: **restore exactly**, **restore with
     targeted adjustments** (list them), or **design new** (rare;
     requires strong justification).

5. **Wait for user's decision.** Do NOT start Phase 0 until the user
   has acknowledged the summary and approved the restore-vs-adjust
   direction. If the user says "restore exactly for while; design
   the do-while wrap ourselves," that's Phase 0's starting point.

### Why this sub-task exists

The user's directive was: "study the original, then discuss if we
restore or adjust it. but the original lost instrumentation was
carefully designed." Treating the git history as the authoritative
design spec (rather than the docs alone, or your own intuitions)
avoids reinventing the wheel or silently drifting from the intended
architecture.

The original design may also answer open questions about do-while
(Q4) and for-of injection (Q3) that aren't fully resolved in the
current docs.

### Time estimate

30–60 minutes of reading + summarizing. If git history is deeper
than expected, budget more. If the original is NOT in git history
(e.g., it existed only in a never-committed branch), surface that
immediately and ask the user for a different source (screenshot,
pasted code, etc.).

---

## Phase-0 workflow

This is substantial (new design + new coverage + docs + tests) —
full Phase 0 per DEV.md. Begin ONLY after Sub-task 0 is resolved
and the user has approved the restore-vs-adjust direction.

1. **0.1 Ubiquitous language.** Define glossary in
   `shared/guard-loops/README.md` (you'll create this file in 0.2).
   Terms: loop guard, guard injection, counter, guard limit, etc.
2. **0.2 Write `shared/guard-loops/README.md`** from scratch. Explain
   what the module does, the design strategy (comma-in-condition or
   whatever Q2 resolves to), the loop types covered, and link back
   up (parent: `shared/README.md`; sibling: `tests/`).
3. **0.3 AR-1** — design challenge on the ubiquitous language and
   the coverage plan.
4. **0.4 Update types.ts in `shared/guard-loops/`** to reflect the
   new contract. Currently the module has no `types.ts`; add one
   if the new design needs it (it probably does — e.g., a
   `LoopType` enum or the new signature of `guardLoopsCondition`
   if N-counts now flow to Worker).
5. **0.5 Write architectural sketch in `shared/guard-loops/DOCS.md`**.
   Structural phases: AST walk, counter allocation, template
   injection, output composition. Out-of-scope: runtime behavior of
   the guard expression (that's the template's job; runtime
   correctness is asserted by tests).
6. **0.6 AR-2** — sketch challenge.
7. **0.7 Commit Phase 0** with `docs: establish loop-guard domain
   model and architectural sketch`.

## TDD workflow

Per increment (one loop type at a time, probably):

1. JSDoc on new/changed exports.
2. Stub.
3. Failing test in ZOMBIES order. Start with the simplest loop type
   (while) and the simplest case (no loops → unchanged code).
4. AR-3 — test strategy challenge.
5. Implement.
6. Lint checkpoint.
7. Refactor.
8. AR-4 — implementation audit.
9. Quality checks.
10. Atomic commit.

### Suggested sub-task ordering

1. **while** (existing coverage, new template).
2. **do-while**.
3. **for** (header-form).
4. **for-of** / **for-in** (if Q3 says yes).
5. **Counter declaration strategy change** (if Q2 resolves to (a)
   Worker setup globals — this touches create-worker-script.ts).
6. **Docs update** — run/DOCS.md + run/README.md loop-guard sections
   (sync language to the new implementation).

### Task B contract: CRITICAL

The existing `guard-loops.test.ts` has 4 parameterized tests
exercising `maxIterations ∈ {-1, 0, 1, 3}` runtime behavior — body
execution counts. Your new template MUST pass these tests (possibly
rewritten to match the new template shape, but asserting the same
runtime behavior). Specifically:

- `maxIterations = -1` → body runs 0 times.
- `maxIterations = 0` → body runs 0 times.
- `maxIterations = 1` → body runs 1 time, then throws on second.
- `maxIterations = 3` → body runs 3 times, then throws on fourth.

If the new template breaks these invariants, the Task B contract is
violated and the iteration-guard widening no longer works. Don't let
that happen.

## Tests to add

Per loop type covered, ZOMBIES + edge cases:

- Zero loops in code → unchanged output.
- One loop, trivial body → guard inserted.
- One loop, nested statement inside body → guard + body preserved.
- Multiple loops (sequential) → numbered `loop1, loop2`.
- Nested loops → inner gets higher number; counter reset semantics
  (if applicable).
- ZOMBIES edge cases from Task B for each type.
- Line-shift assertion: before/after line count unchanged.
- Column-shift assertion on non-condition code: unchanged.

For for-of / for-in (if covered), note the forced body-injection and
test that the one-line shift is contained to the body.

## AR-5 pre-merge review

After all sub-tasks land, run AR-5 with expanded scope — docs + types
+ all touched sections:

- `shared/guard-loops/README.md` (new) — accurate?
- `shared/guard-loops/DOCS.md` (new) — sketch matches implementation?
- `shared/guard-loops/guard-loops.ts` — JSDoc accurate for the new
  API and all loop types?
- `shared/guard-loops/types.ts` (if added) — types describe the new
  domain model?
- `shared/guard-loops/tests/guard-loops.test.ts` — coverage complete
  for all loop types + ZOMBIES?
- `shared/README.md` — link to guard-loops/README.md works now?
- `run/DOCS.md` §Why comma-in-condition loop guards — matches the
  implementation exactly?
- `run/README.md` §How it works #2 + §Key design decisions —
  accurate?

Success criterion: **a dumb LLM reading these docs could regenerate
the implementation**. Per user directive from the prior session.

Per AGENTS.md batch-fix directive: address ALL AR-5 findings in the
same task.

## Don't-do list

- **Don't touch `api/run.ts`** — merge agent's scope.
- **Don't change the SAB protocol** — not your concern.
- **Don't modify `worker-protocol.ts`** beyond any JSDoc updates
  that reference loop-guard behavior, if any.
- **Don't touch `run/run.ts` beyond the `guardLoopsCondition` call
  site** — if your new API signature changes, update that call
  narrowly. Don't refactor surrounding code.
- **Don't touch `run.ts` cancel/result/EVENT_READY regions** —
  merge agent's scope.
- **Don't modify `shared/types.ts`** RunEvent union or Execution
  type — those are merge-agent scope, and contract is frozen.
- **Don't delete `guard-loops.test.ts`'s existing tests wholesale**
  — rewrite where needed, keep where applicable, and ALWAYS preserve
  the Task B ZOMBIES edge cases' runtime-behavior assertions.
- **Don't use `git add -A`** — named files only.
- **Don't run with `--no-verify`** unless pre-existing hook failures
  block progress (as in the prior session).

## Coordination with merge agent

Communication channel:
`src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/.handoffs/COORDINATION.md`

Protocol (also documented in that file):

1. Before editing `run.ts` (the `guardLoopsCondition` call site) or
   `create-worker-script.ts` (loop-counter setup region), append a
   §Active claims entry and commit-push it.
2. `git pull origin main` before editing shared files.
3. Mark `[done]` when the edit lands.

**Shared file regions:**

- `create-worker-script.ts` — your changes (if Q2 resolves to Worker-
  setup globals) live in the worker script setup region, ABOVE the
  trap function definitions. Merge agent's EVENT_READY additions go
  INSIDE the trap function bodies. Different regions; merge should be
  clean.
- `run.ts` — your narrow edit at the `guardLoopsCondition` call site
  (lines ~189-200). Merge agent touches validation/cancel/replay in
  other regions. Different regions.
- `run/README.md` — your loop-guard sections; merge agent's
  Cancellation/Result sections. Different sections.
- `run/DOCS.md` — your §Why comma-in-condition section; merge
  agent's §Unified pause protocol + §scriptMode. Different sections.
- `shared/DOCS.md` — your §Why guard-loops moved to shared update;
  merge agent's §Pause/resume flow consolidation. Different sections.

**Last to merge rebases.** If both agents land changes to the same
file in incompatible ways, the second agent rebases and resolves
locally before pushing.

## Verification

After all sub-tasks land:

- `./node_modules/.bin/vitest run src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/shared/guard-loops/tests`
  — all tests pass, including Task B's ZOMBIES edge cases.
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "evaluating/(run|shared)/guard-loops"`
  — no new errors.
- Sandbox manual (user):
  - Load `[infinite loop]` (while true), set `iterations: 3`. Confirm
    3 `i = 0..2` logs, then RangeError on line 2.
  - Write a test with `for (let i = 0; i < 10; i++)`, set `iterations: 5`.
    Confirm 5 iterations then RangeError.
  - Similar for do-while.
  - For-of / for-in (if covered): construct an infinite iterator,
    confirm guard fires.
- Line-tracking still works — error messages report the right line
  number.
- Docs read end-to-end: a fresh reader can answer "what's the
  template? what loop types are covered? how are counters declared?"

## Final commit prompt

After AR-5 clears:

> Loop-guard update complete. All loop types covered: while,
> do-while, for, [for-of, for-in — if covered]. Template:
> [comma-in-condition / chosen design]. Task B ZOMBIES edge cases
> preserved. Docs synced. Ready for push to main.

Prompt user to push. Do NOT push yourself.
