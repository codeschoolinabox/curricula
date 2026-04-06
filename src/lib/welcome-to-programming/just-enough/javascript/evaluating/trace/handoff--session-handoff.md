# Session Handoff: Trace Module — Context for Next Session

## What was built this session

### Test infrastructure (237 new tests, all passing)

- **Layer 4a**: 40 Node + 59 browser tests — config pipeline (prepareConfig) →
  generator event gating
- **Layer 4b**: 28 browser tests — public API (api/trace.ts), validation/format
  gates, Execution wrapper
- **Layer 5**: 57 browser tests — event correctness (exact values, ordering,
  cross-references)
- **Execution wrapper**: 21 Node tests — batch, step-through, cancel, replay
- **Type validation**: 20 browser tests — every sandbox program's events
  validated field-by-field against types.ts
- **Config pipeline**: 40 Node tests — expandShorthand, fillDefaults,
  validateConfig with real schema

### Source bugs found and fixed (10 total)

1. AJV `$schema` draft-2020-12 — `validateSchema: false` in fill-defaults.ts and
   validate-config.ts
2. expand-shorthand.ts not recursive — rewrote with recursive expansion
3. SAB pause protocol — EVENT_READY flag (control[5]) for deterministic timeout
4. Timeout queue flood — `timedOut` flag replaces queued timeout message
5. Execution wrapper: `.result` deadlock after `for await` + `.result` (drain
   circular ref)
6. Execution wrapper: `.result` deadlock after `break` in `for await` (cancel
   didn't resolve)
7. Execution wrapper: cancel before iteration was noop (generator null)
8. Execution wrapper: `hasResult` sentinel (generic TResult safety)
9. Execution wrapper: live iterator resolves resultPromise directly on
   completion
10. Execution wrapper: replay after generator throw

### Validator alignment with reference.md (50+ features added)

- ForStatement, DoWhileStatement node types
- Math global + 39 Math member names
- RegExp, parseInt, parseFloat globals
- startsWith, endsWith, search, replace string methods
- Number.isInteger, Number.isFinite
- Bitwise binary operators (&, |, ^, <<, >>, >>>)
- Bitwise unary (~) and assignment (&=, |=, ^=, <<=, >>=, >>>=)
- Regex literals allowed

### Infrastructure

- `vitest.workspace.ts`: `fileParallelism: false` + `retry: 2` for browser tests
- Test sharding scripts in package.json
- Sandbox: format button, program dropdown (20 programs), export bug feature,
  notes field
- Directory restructured: record/tracing/ → trace/tracing/

---

## Critical learnings about Aran's actual behavior

**Trust the code, not the docs.** These were all discovered empirically:

1. **`declarationStep` is NOT the event `step`**. It's an internal step counter
   (incremented by block-setup and block-declaration), different from the event
   step counter (incremented by emitEvent). You cannot compare
   `declarationStep === someEvent.step`.

2. **`x += 2` produces a pure addition event, not an AssignmentOperatorEvent**.
   Empirically observed: the browser pipeline emits `kind: 'pure', subkind:
   'addition'` for `x += 2`. HOWEVER, `effect-before.ts` DOES have code to emit
   `AssignmentOperatorEvent` (line 33), and a unit test confirms it (line 54).
   The discrepancy may be a pointcut issue — the effect-before hook may not fire
   for compound assignments in the full browser pipeline. **INVESTIGATE: run
   `x += 2` through the browser tracer and check if any assignment operator
   events appear. The unit test passes but browser behavior differs.**

3. **While-loop test events have `kind: 'conditional'`**, not `'while'`. The
   iteration events have `kind: 'while'`. Test events use the condition type,
   not the loop type.

4. **Do-while iterations have `kind: 'while'`** (not `'doWhile'`). The test
   events have `kind: 'doWhile'`. No `do` events are emitted.

5. **`shortCircuited` may be `true` even for `false || true`**. Aran's
   definition of short-circuiting differs from intuition. The `right` field is
   undefined in all cases observed.

6. **`let x;` has `explicit: true`** on the initialize event. BUT types.ts
   documents `explicit` as `true = let x = undefined, false = let x;` and
   `instrument.ts` correctly sets `tag.explicit = node.init !== null`. The
   discrepancy is in `effect-after.ts` which appears to hardcode `true`.
   **INVESTIGATE: this may be a bug in effect-after.ts, not an Aran behavior.**

7. **`assign` event value** — empirically observed as the old value in browser
   probe. BUT `effect-after.ts` uses `state.lastExpressionResult` which should
   be the NEW value. **INVESTIGATE: re-probe `let x = 1; x = 2;` and check the
   assign event's value field. Code says new, probe said old — one is wrong.**

8. **Optional chaining on null produces NO propertyAccess event**. Aran
   short-circuits at the expression level.

9. **Scope kind is `'script'`**, never `'module'`. Aran runs in `eval+strict`
   mode. The `'module'` scope kind in types.ts is never emitted.

10. **Disabling `scopes.kind.block` also suppresses module scope events**. Aran
    processes module scope through `block@setup`. This coupling is
    architectural.

11. **recast formatting quirks**: adds `\n\n` between different statement types
    (let vs while), uses single quotes, tabs for indentation. Code must match
    exactly to pass the format gate.

12. **`continue` inside `if` inside `while` does NOT produce a jump event** in
    the current implementation.

### Open investigations (action items for next session)

These 3 items from the learnings above have contradictions between code and
observed behavior. Investigate before relying on either claim:

- **Point 2**: AssignmentOperatorEvent — `effect-before.ts` has code to emit it
  and a passing unit test, but browser probe showed 0 assignment operator events.
  Possible pointcut issue in full pipeline.
- **Point 6**: `explicit` field — `instrument.ts` sets `tag.explicit = false` for
  bare `let x;`, but `effect-after.ts` may hardcode `true`. Check which wins.
- **Point 7**: `assign` value — code uses `state.lastExpressionResult` (new value)
  but probe showed old value. Re-probe to confirm.

---

## Mistakes Claude made (avoid repeating)

1. **Hard-coded 50ms timeout as first SAB fix** — magic number, didn't solve the
   root cause. Went through 3 iterations before finding EVENT_READY + timedOut
   flag design. Lesson: diagnose root cause before patching.

2. **Wrote assertions based on type definitions, not observed behavior** — at
   least 5 of 14 planned assertions in the event correctness tests were wrong.
   Lesson: ALWAYS run a diagnostic probe before writing assertions.

3. **Didn't update documentation as code changed** — accumulated 6 directories
   of doc debt. User had to call it out. Lesson: update docs in the same commit
   as the code change.

4. **Tried `Atomics.waitAsync` (complex) before `timedOut` flag (simple)** —
   built generation counters, stale promise handling, then abandoned it all for
   a simple boolean flag. Lesson: try the simplest approach first.

5. **Removed detailed plan content when updating** — user lost detailed Phase
   6d-9 specs when plan was edited. Lesson: only add/modify plan sections,
   never remove content without asking.

6. **Didn't split browser test file early enough** — wrote 71 tests in one file,
   hit Worker hangs, then had to split into 4 files after the fact. Lesson:
   start with ~15 tests per browser file from the beginning.

### SAB dead ends — do NOT revisit

- `Atomics.waitAsync` approach — fully designed in plan (Steps 1a-1g) but
  abandoned. The EVENT_READY flag + timedOut flag solved it more simply.
- The Worker hangs are NOT a protocol bug — they're Playwright/Chromium thread
  pool exhaustion from concurrent Workers. `fileParallelism: false` is the fix.
- Test sharding (`--shard=1/3`) is for CI parallel optimization only. It does
  NOT replace `fileParallelism: false` for local development.

### Plan predictions that were wrong (the pattern)

The plan's Layer 5 test assertions (Phase 6e) had systematic errors:
- Cross-reference fields (`declarationStep`, `scopeCreationStep`) — always wrong.
  These use internal step counters, not event step numbers.
- Event field values (`assign` value, `shortCircuited`, `explicit`) — often wrong.
  Aran's semantics differ from intuition.
- Operator decomposition (`+=` → assignment operator) — wrong. Aran decomposes
  compound ops into primitives.

**Structural assertions were reliable**: event ordering, event existence, category
matching, kind values. These can be planned without probing.

---

## Hard workflow constraints (violated = trust destroyed)

1. NEVER edit the plan file outside plan mode
2. ALWAYS plan before implementing, even for "obvious" changes
3. Plans must be detailed enough for a junior developer to follow with no guidance
4. When reporting progress, report against the FULL remaining plan, not just
   current phase
5. Git: additive only (add, commit, status, diff, log). No push, amend, reset.
6. Adversarial review before ExitPlanMode — cross-reference against: internal
   consistency, codebase, dependency APIs, conversation history, domain expertise
7. Update documentation in the same pass as code changes
8. Browser test files: max ~15-20 tests per file to avoid Worker pool exhaustion

---

## Guiding decisions from conversation (not in code)

1. **reference.md is canon** — the validator must match reference.md 100%, not
   the other way around. If they disagree, update the validator.

2. **Strict mode, not module mode** — JeJ runs in eval+strict mode. reference.md
   should say "strict mode" not "module mode." Learners don't use import/export
   or top-level await. Scope traces say `'script'` because that's Aran's eval
   mode.

3. **Current codebase preserved as reference** — `/trace-without-syntax-level-events/`
   is a copy of `/trace` before the syntactic refactor. Keep it intact as
   reference. Don't modify or delete.

4. **No runtime checks** — type validation and event checking belong in the dev
   pipeline (tests), not in production code.

5. **Git: additive only** — Claude can `git add`, `git commit`, `git status`,
   `git diff`, `git log`. Cannot push, amend, reset, rebase, or modify history.

6. **Aran is the right choice** — building custom instrumentation from scratch
   would be months of work. Aran handles ES spec compliance, scope semantics,
   TDZ, destructuring. The quirks (event field surprises, operator decomposition)
   are worth it vs reimplementing a JS semantic analyzer.

7. **Pedagogical vision for the refactor** — events should align with syntax
   (what the learner wrote), with semantic breakdowns (what the engine did)
   available as sub-structure. This lets learners transition between levels of
   abstraction: code surface ↔ language semantics. The config should mirror
   the reference.md cheatsheet so learners select features they recognize.

8. **SAB investigation conclusion** — Worker hangs were from concurrent thread
   pool exhaustion in Playwright, not a protocol bug. Solution: sequential test
   execution (`fileParallelism: false`) + `retry: 2`. The EVENT_READY flag
   solved a separate issue: false timeouts when postMessage delivery was delayed
   (timeout couldn't distinguish "Worker paused" from "Worker stuck").

9. **Diagnostic probe before assertion** — when writing event correctness tests,
   ALWAYS run the target code through a probe test first to discover actual event
   shapes. Never write assertions based solely on types.ts or the plan. At least
   5 of 14 planned assertions in Phase 6e were wrong. Treat planned assertions as
   hypotheses, not specifications.

10. **`plann.syntactic-refactor.txt` is the user's voice** — these are the user's
    own design notes, not Claude's plan. Honor as design constraints:

    - Flat linear event array with cross-references, NOT compound events
    - Existing event shapes stay; syntaxId links them to syntax constructs
    - Full depth breakdown ("all the way") — no simplification of semantic details
    - Config should feel like a reference.md cheatsheet, not an Aran hook taxonomy
    - Template sub-expressions should be linear events grouped by cross-reference
    - The user was working through template granularity and leaned toward keeping
      events at the semantic level, grouped by syntaxId

---

## The syntactic refactor (next major task)

### The idea

Events stay at the semantic level (current shape). Each event gets a `syntaxId`
field linking it to its parent syntax construct. Config is restructured from
semantic (kind × event) to syntactic (language feature). Consumers group by
`syntaxId` for collapsed views.

### Design document

`evaluating/trace/config-design.ts` — type file with TODO comments for each
design question.

### Key decisions made

- Flat event array, NOT compound events with embedded sub-events
- Cross-references via `syntaxId` — consumer builds the tree if needed
- Body begin/end markers for control flow (nested content boundaries)
- Config mirrors reference.md cheatsheet sections
- Boolean shorthand expansion pattern stays (`feature: true` → all sub-options
  enabled)

### Key decisions still open

- Config flat vs nested for control flow (if/while/for at top level vs under
  controlFlow)
- syntaxId format (counter vs path vs AST position)
- Where compound assignments live in config (operators vs variables)
- Whether string methods are separate from functionCalls
- Whether scopes are useful for learners or just developer tooling
- How declare event relates to syntax vs scope
- Body begin/end controlled by scope config or control flow config

### Reference codebase

`/trace-without-syntax-level-events/` — copy of current /trace as reference for
the refactor.

### What stays the same

- Aran advice functions (they emit semantic events — that's correct)
- SAB pause protocol (EVENT_READY flag, timedOut flag)
- Execution wrapper (create-execution.ts with all fixes)
- API layer (api/trace.ts, validation, format gate)
- Test infrastructure (vitest workspace, browser test patterns)
- Sandbox (sandbox.html, programs, export bug)

### What changes

- Event shape: add `syntaxId` field
- Config schema: from semantic (kind × event) to syntactic (language feature)
- config-gate.ts: map syntactic config → semantic event emission
- State layer: track which syntax construct is active, buffer semantic traces
  until syntax event is complete
- options.schema.json: new schema matching the syntactic config
- expand-shorthand.ts, fill-defaults.ts: work with new schema shape
- All config-related tests: updated for new schema

---

## File locations

All paths relative to repo root (`0-curricula/`):

| Purpose                 | Path                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| Tracer source           | `src/lib/welcome-to-programming/just-enough/javascript/evaluating/trace/`                             |
| Tracer reference copy   | `src/lib/welcome-to-programming/just-enough/javascript/evaluating/trace-without-syntax-level-events/` |
| Config design file      | `src/lib/welcome-to-programming/just-enough/javascript/evaluating/trace/config-design.ts`             |
| Public API              | `src/lib/welcome-to-programming/just-enough/javascript/api/trace.ts`                                  |
| Execution wrapper       | `src/lib/welcome-to-programming/just-enough/javascript/evaluating/shared/create-execution.ts`         |
| SAB protocol            | `src/lib/welcome-to-programming/just-enough/javascript/evaluating/run/worker-protocol.ts`             |
| Trace Worker            | `src/lib/welcome-to-programming/just-enough/javascript/evaluating/trace/tracing/trace-worker.ts`      |
| Generator (main thread) | `src/lib/welcome-to-programming/just-enough/javascript/evaluating/trace/tracing/index.ts`             |
| Advice functions        | `src/lib/welcome-to-programming/just-enough/javascript/evaluating/trace/tracing/weaving/advice/`      |
| Config pipeline         | `src/lib/welcome-to-programming/just-enough/javascript/evaluating/trace/configuring/`                 |
| Options schema          | `src/lib/welcome-to-programming/just-enough/javascript/evaluating/trace/options.schema.json`          |
| Event types             | `src/lib/welcome-to-programming/just-enough/javascript/evaluating/trace/tracing/types.ts`             |
| Test helpers            | `src/lib/welcome-to-programming/just-enough/javascript/evaluating/trace/tests/test-helpers.ts`        |
| Event validator         | `src/lib/welcome-to-programming/just-enough/javascript/evaluating/trace/tests/validate-event.ts`      |
| Sandbox                 | `src/lib/welcome-to-programming/just-enough/javascript/api/sandbox.html`                              |
| Sandbox programs        | `src/lib/welcome-to-programming/just-enough/javascript/api/sandbox-programs/`                         |
| JeJ reference           | `src/lib/welcome-to-programming/just-enough/javascript/reference.md`                                  |
| JeJ validator           | `src/lib/welcome-to-programming/just-enough/javascript/lib/validating/just-enough-js.ts`              |
| Syntactic refactor plan | `src/lib/welcome-to-programming/just-enough/javascript/evaluating/trace/plann.syntactic-refactor.txt` |
| Vitest workspace        | `vitest.workspace.ts`                                                                                 |

---

## Commits this session

```
ef284a5 fix: bug report filename uses browser name + timestamp
c4ca839 add: format button to sandbox
2788723 add: trace sandbox export-bug feature with full diagnostics
2f203c7 fix: update sandbox for current trace API
89b483a docs: update completed-phases.md with session decisions
7ef3229 cleanup: delete debug tests, screenshots, dead code, old record/ dir
501d017 refactor: flatten record/ → trace/tracing/
4bc3d65 add: Phase 6e Layer 5 event correctness tests (57 browser tests)
08eb179 add: Layer 4a+4b integration tests, fix Execution wrapper, update docs
d26aa97 fix: align validator with reference.md — add 50+ missing JeJ features
8877076 add: 20 sandbox test programs + dropdown + notes field
f49ffc5 add: automated trace event type validation (20 programs, all pass)
```
