# Plan: Syntactic Trace Refactor

## Read these files first

1. `evaluating/trace/session-handoff.md` — full context from last session
   (learnings, mistakes, decisions, workflow constraints, open investigations)
2. `evaluating/trace/config-design.ts` — config type design with TODO questions
3. `evaluating/trace/plann.syntactic-refactor.txt` — user's own design notes
   (honor as constraints, not suggestions)

---

## What's done (don't redo)

- 237 tests passing (162 browser + 75 Node)
- SAB protocol: EVENT_READY flag + timedOut flag (deterministic timeout)
- Execution wrapper: 5 bug fixes (deadlocks, cancel, replay)
- Config pipeline: expand-shorthand recursive, AJV compatibility
- Validator: aligned with reference.md (50+ features added)
- Directory: record/tracing/ flattened to trace/tracing/
- Sandbox: 20 JeJ programs, format button, export bug, notes field
- Type validation: all 20 programs pass field-by-field type checks
- Reference copy: `/trace-without-syntax-level-events/` preserved

---

## What's next: the syntactic refactor

### The core idea

Events stay semantic (current shape). Add `syntaxId` field linking each event to
its parent syntax construct. Config restructured from semantic gates (kind × event)
to syntactic gates (language feature). Consumers group by `syntaxId`.

### Immediate tasks

1. **Resolve config-design.ts TODO questions** — discuss with user through
   comments in the file. Key open questions:
   - Control flow flat vs nested in config
   - syntaxId format
   - Where compound assignments live
   - String methods separate or under functionCalls
   - Scopes useful for learners?
   - Body begin/end controlled by which config key

2. **Update reference.md** — "strict mode" not "module mode" (decided but not done)

3. **Investigate 3 open items** from session-handoff.md:
   - AssignmentOperatorEvent: code exists to emit it but browser probe showed 0
   - `explicit` field: possible bug in effect-after.ts (hardcodes true)
   - `assign` value: code says new value, probe said old — re-probe to confirm

4. **Add missing sandbox programs** — for loops, do-while, break/continue,
   regex, bitwise operators (coverage gaps found by type validation probe)

5. **Design and implement the syntactic config schema** — new options.schema.json
   matching the agreed config-design.ts shape

6. **Add syntaxId to events** — instrument.ts tags AST nodes, advice functions
   pass syntaxId through to emitted events

7. **Rewrite config-gate.ts** — map syntactic config keys to semantic event
   emission decisions

8. **Update all config-related tests** — new schema shape, new gate behavior

### What stays the same

- Aran advice functions (emit semantic events — correct as-is)
- SAB pause protocol (EVENT_READY, timedOut)
- Execution wrapper (create-execution.ts)
- API layer (api/trace.ts, validation, format gate)
- Test infrastructure (vitest workspace, browser test patterns)
- Sandbox (sandbox.html, programs, export bug)

### What changes

- Event shape: add `syntaxId` field
- Config schema: semantic → syntactic
- config-gate.ts: syntactic config → semantic gates
- options.schema.json: new schema
- expand-shorthand.ts, fill-defaults.ts: new schema shape
- All config-related tests

---

## Hard constraints (from user)

1. NEVER edit plan file outside plan mode
2. ALWAYS plan before implementing
3. Plans must be junior-developer followable
4. Report progress against FULL remaining plan
5. Git: additive only (add, commit, status, diff, log — no push/amend/reset)
6. Adversarial review before ExitPlanMode
7. Update docs alongside code changes
8. Browser test files: max ~15-20 tests per file
9. Diagnostic probe before writing event assertions
10. `plann.syntactic-refactor.txt` is the user's voice — honor as constraints
11. reference.md is canon — validator must match it, not the other way
