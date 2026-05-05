# Handoff: AR-5 + two architectural shifts

You are conducting an adversarial pre-merge review (AR-5) on a multi-commit refactor of the `evaluating/intercept` module. You are also producing tradeoff analyses on two architectural shifts the user is considering for the next phase. **Discussion first, no implementation.** Your output is decision-support, not code.

You have not seen this work before — that is the point. Read critically, not charitably.

---

## Background — what intercept is, what just landed

`intercept` is the JeJ (Just enough JavaScript) educational subset's runtime tracing engine. It runs user code in a Web Worker, traps IO globals (`console.X`, `prompt`, `alert`, `confirm`), and produces an `AsyncIterable<InterceptEvent>` that the consumer drives via `for await`. After the run, `result.events` holds the same events as a frozen array; `result.ast` is the parsed Program enriched with back-refs from each AST node to the events that fired on it.

The just-completed refactor (Phase 0 + 1.1–1.9) replaces `Error.stack` parsing with a universal CallExpression wrap mechanism:

1. Pre-execution AST walk wraps every CallExpression as `__$ic('nodePath', () => originalCall)`.
2. `__$ic` is a worker-side helper injected as a `new Function` parameter. It pushes the call's nodePath onto a `__currentPath` slot before invoking the thunk and restores the previous value in `finally`.
3. Trap functions read `__currentPath` directly — no `Error.stack` parsing.
4. Errors propagating out of `__$ic` get stamped with `err.__nodePath`; the top-level worker error handler reads it. Errors thrown OUTSIDE any wrapped call (e.g. bare `null.foo;`) still use a small `extractPositionFromError` fallback for line attribution.

Three provenance values: `'instrumented'` (happy path), `'enclosing-fallback'` (residual error path), `'no-ast'` (validation failed before parsing). The `'exact'` provenance was removed; it had been effectively unreachable.

A post-completion `link()` step:

- Attaches `event.node: ASTNode` references into `result.ast`.
- Pushes back-refs into `node.events[]` (in step order).
- Wires up `event.callee` / `event.calleePath` for direct callee navigation (per-event convenience accessors; same reference as `event.node.callee`).
- Adds `node.children: readonly ASTNode[]` (every direct AST descendant in source order — generic walk path alongside named ESTree slots).

### Commits in scope (newest → oldest)

```
cc6940e docs: navigation section + glossary entries for children/callee/calleePath
0a36161 fix: sort ASTNode.children by loc.start (interleaves TemplateLiteral parts in source order)
2ee6818 add: callee + calleePath direct navigation on linked events
135d8cd add: children[] navigation array on every ASTNode
9885666 add: entwining behavior tests for instrumented attribution
f1cb993 refactor: replace Error.stack with __$ic-driven nodePath attribution
2aeafd1 add: link infrastructure (build-location-index, link, tests)
bcce9b1 add: instrumentation phase that wraps every CallExpression with __$ic
ef959e7 docs: establish universal CallExpression wrap domain model and architectural sketch
```

Use `git log -p <hash>` or `git diff 022aa4f..HEAD -- <path>` to see what changed.

### Critical files

Module root: `src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/intercept/`

| Layer | Files |
| ----- | ----- |
| Public docs | `DOCS.md`, `README.md` |
| Engine | `intercept.ts`, `create-worker-script.ts`, `wrap-call-expressions.ts`, `wrap-helper-name.ts`, `types.ts` |
| Link layer | `link/types.ts`, `link/build-location-index.ts`, `link/link.ts`, `link/lookup-node-path.ts` |
| Shared | `../shared/types.ts` |
| Tests | `tests/*.test.ts`, `tests/*.browser.test.ts`, `link/tests/*.test.ts`, `wrap-call-expressions.test.ts` |

Trace module (referenced in Job 3 — read these to understand the convention being borrowed): `src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/trace/syntax/` and `src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/trace/semantics/`.

---

## Job 1 — AR-5 punch list

Adversarial review of what landed. Look for things that should not have survived the refactor, documented behavior that doesn't match the code, and gaps between claims and tests.

### Stale references to hunt (these were supposed to be deleted)

Flag any survivors:

- `Error.stack` parsing in trap functions — the residual `extractPositionFromError` path is the only acceptable remaining use.
- `getPosition` worker function.
- `WORKER_INTERNAL_FRAME_PATTERNS` / `isWorkerInternalFrame`.
- `'exact'` provenance value (in code, types, JSDoc, tests, docs).
- `line` / `column` fields on Console/Prompt/Alert/Confirm event variants in `shared/types.ts` (`ErrorEvent` legitimately keeps optional `line` for the residual path).
- `nodePathFallbackFrom` field — the plan said remove; verify the actual code/JSDoc state matches reality. This is a known live mismatch risk.
- Line-offset arithmetic (`lineNum - 3`, `+ 2`, etc.).
- Old `'enclosing-fallback'` semantics that mention 50%/exact-match scoring.

### Documented invariants — are they actually pinned by tests?

`DOCS.md § Navigation` claims the following identity invariants. For each, find the test that pins it (or flag as missing):

- `event.node === result.ast[event.nodePath]`
- `event.loc === event.node.loc` (same reference, not a copy)
- `event.callee === event.node.callee` (same reference)
- `node.children[i] === corresponding named slot` (e.g. `node.callee` or `node.arguments[k]`)
- `node.events[]` back-refs in step order
- Replay identity: `liveEvents[i] === replayedEvents[i]` across re-iteration

### Other consistency checks

- **README ↔ DOCS ↔ glossary**: every term in the glossary used the same way in both DOCS and README? Every public event field documented in both? Glossary entries aligned with the field shapes in `link/types.ts`?
- **Ubiquitous language coverage**: `__$ic`, `__currentPath`, `__nodePath`, "wrap" (noun/verb), "trap", "instrumentation phase", "link", "entwining", "residual error path" — used consistently across every file.
- **JSDoc-vs-reality drift**: JSDocs that describe behavior the code no longer has, or fields/parameters that don't exist.
- **Mermaid diagram in `DOCS.md § Data flow`**: does the canonical 4-subgraph diagram (MainThread / Worker / WrapMechanism / TrapFire) still describe the actual pipeline as implemented in `intercept.ts`?
- **Pre-merge cleanup**: dead code, unused imports, leftover `TODO`/`FIXME`/`XXX`, leftover `console.log` debug statements, leftover commented-out code.
- **Test coverage of error attribution**: is the `err.__nodePath` propagation path actually tested end-to-end (a runtime error inside a wrapped call → event with the correct nodePath)?

### Output format

Punch list, prioritized:

- 🔴 **Must fix before merge** — correctness, deleted-but-resurrected references, documented behavior that doesn't match code.
- 🟡 **Should fix** — consistency, missing tests for documented invariants, JSDoc drift.
- 🟢 **Nice to fix** — minor doc polish, dead code, unused imports.

Each item: `file:line — what's wrong — suggested fix in one sentence`. Do NOT propose code patches — just identify issues.

---

## Job 2 — Tradeoff analysis: doubly-linked, reference-coherent runtime graph

The user is considering a departure from the current architecture. Your job is to lay out the design space, identify the real costs and benefits, and **recommend with reasoning** — but the decision stays with the user. No implementation, no code patches.

### What's there now

- Worker emits scalar events. Main thread `enrichEvent` adds `nodePath` / `nodePathSource` / `node` / `loc` / `callee` / `calleePath`. Events are pushed onto an internal array as they arrive; the iterator yields them lazily.
- `link()` runs at completion: walks the buffered events, attaches `.node` references, pushes back-refs into `node.events[]`. Result is then deep-frozen.
- `handle.ast` resolves to the AST when validation/parsing succeeds (early — before iteration completes). `result.ast` (returned at the end) is the same object — already coherent on this axis. **Verify this is actually true** (one of the invariants in Job 1).
- Replay identity: re-iterating the handle yields the same event references the first iteration emitted. Backed by an internal cache.

### What the user is proposing

The thread (main) layer should:

1. **Persist events as a doubly-linked list as they arrive**, with each event carrying `prev` and `next` references to its neighbours, **wired before the event is yielded to the consumer**.
2. **The same event references the consumer iterates are the references that end up in `result.events`.** No copy step. The final `result.events` array is reference-equivalent to the live stream.
3. **The AST returned in `handle.ast` is the same reference as `result.ast`.** Already roughly true via the early-resolution path; the proposal hardens it into an invariant.
4. The consumer receives events that already carry `.node` references into the eventually-returned AST — entwining happens **before emission**, not at completion.

### What the user wants you to weigh

- **Consumer-side ergonomics.** The user's argument: a single coherent data structure throughout the runtime is easier to consume than two structures (live stream + post-hoc result) that have to be reconciled. Concrete consumer scenarios where this matters: editor highlighting that listens to live events but also wants to walk the AST; replay tooling; lenses that build derived state during iteration. Push back if the ergonomics gain is smaller than the user thinks.
- **Doubly-linked specifically (`prev`/`next`)** vs. alternatives: index-based (`event.index`), array slicing (already possible via `result.events.slice(event.step - 1)`), or no timeline navigation at all (consumers walk `result.events` themselves). What does `prev`/`next` enable that `step` + array indexing doesn't?
- **Mutability window.** `event.next` can only be set after the next event arrives, which is after the current event was already yielded. So events become mutable for a window. Freeze must be deferred to completion. Does this conflict with anything else (consumer caching, structured-clone-across-postMessage assumptions, frozen-AST tests)?
- **Cycle handling.** `prev`/`next` form one more cycle for `deepFreezeInPlace` to handle (alongside `parent` ↔ `children` and `node.events[i].node === node`). The freeze utility already handles cycles via a visited set — does this proposal stress it in any new way?
- **Refactor surface.** What touches:
  - The main-loop event pump in `intercept.ts` (`enrichEvent`, the buffer)
  - `link/link.ts` (currently does post-hoc wiring; might be partially obsoleted or re-shaped)
  - The replay cache (must yield the same references; today it caches event objects, which already satisfies this)
  - The freeze step (deferred or run incrementally)
  - Test fixtures expecting "events array exists at end of iteration" — most should still pass
- **Failure modes that get easier or harder.** What happens when:
  - The worker sends a malformed event (no `nodePath`)
  - Iteration is cancelled mid-stream (`prev` is set, `next` of the last event is null forever)
  - Re-iteration starts before completion (the cache was populated mid-stream — what does `next` look like for the last cached event?)
- **Departure from prior plan.** The original Phase 0 plan kept `link()` as a discrete completion step and kept events as plain enriched objects. This shift makes link incremental, embedded in the event pump. Worth flagging as a real architectural pivot, not a tweak.

### Output format for Job 2

A discussion doc, ~600–900 words. Sections:

1. **Restated proposal** — your understanding of what the user wants, in your own words. Confirms you read it right.
2. **What the proposal actually changes** — concrete code surface (with file:area pointers, not full patches). Where the new wiring lives.
3. **Where it helps** — consumer scenarios, with a concrete example of a consumer pattern that's awkward today and clean under the proposal.
4. **Where it hurts or risks regression** — mutability window, freeze ordering, replay-cache interaction, cycle proliferation, refactor blast radius. Be specific and unflinching.
5. **Smaller alternatives** — partial versions of the idea that capture most of the value at less cost (e.g. just unify `handle.ast === result.ast`; or add `event.next`/`prev` without changing the link timing). At least two.
6. **Recommendation** — yes / no / yes-but-scoped-down. Backed by reasoning, not vibes.

---

## Job 3 — Tradeoff analysis: event kind/category convention

The user wants intercept's IO events to align with the kind/category event convention used in `trace/syntax/` and `trace/semantics/`. Suggested distinctions: **dev** vs. **user**, with sub-distinctions inside each (`log`/`assert`/`info`/… vs. `prompt`/`alert`/`confirm`).

Your first task: read the trace module's event-shape conventions. **Do not assume** — actually read `trace/syntax/` and `trace/semantics/` to see how they discriminate event categories. Specifically look for:

- The discriminant union shape (what's the top-level `kind` field? What are the sub-categories?)
- How event variants are typed (one-level vs. two-level discrimination)
- Naming conventions (singular/plural, lowercase/PascalCase, namespaced/flat)
- What metadata appears at the category level vs. per-variant

### What's there now in intercept

`shared/types.ts` defines the event union with `event.event: 'console' | 'prompt' | 'alert' | 'confirm' | 'error'` as the primary discriminant. `ConsoleEvent` further narrows on `event.method` (the 19 console methods). The dialog events (`prompt`, `alert`, `confirm`) sit at the top level alongside `console`, so the developer-vs-user distinction is implicit, not encoded in the shape.

### What the user is proposing

A two-level discrimination that mirrors trace:

- **dev events** (developer instruments their program with these): `console.log`, `.warn`, `.info`, `.debug`, `.error`, `.assert`, `.trace`, `.table`, `.group`, etc.
- **user events** (interact with the user at runtime): `prompt`, `alert`, `confirm`.
- Plus the existing `error` event (runtime errors that propagated out of the program).

Possible shapes:

- `{ kind: 'dev', method: 'log' | 'warn' | … , … }` and `{ kind: 'user', method: 'prompt' | 'alert' | 'confirm', … }`
- Or `{ category: 'dev' | 'user', event: 'log' | 'warn' | 'prompt' | … , … }`
- Or whatever the trace module actually does — match it.

### What the user wants you to weigh

- **Alignment with trace.** The win is symmetry across the two engines: a consumer can pattern-match on `kind` the same way regardless of which engine emitted the event. How big is this win? Are there current consumers that already pattern-match across both?
- **Migration cost.** Every consumer of `event.event === 'console'` and `event.event === 'prompt'` needs updating. Inventory the call sites:
  - `lib/evaluating/run/run.ts`
  - `lib/evaluating/intercept/sandbox.html` (dev sandbox)
  - The study lenses (`study-lenses/lenses/`)
  - Any tests asserting on `event.event` equality
- **Backwards compatibility.** Is there a clean way to do this in one cut, or does it need a deprecation path? Per the user's stated preference, backwards-compat shims are usually rejected — favor one clean cut unless the consumer surface is too wide.
- **Discriminant ergonomics.** TypeScript narrowing under the proposed shape: does `if (event.kind === 'dev')` cleanly narrow to the dev variants? What about nested narrowing (`event.kind === 'dev' && event.method === 'assert'`)? Test by reading the trace types and seeing how they hold up.
- **Naming.** `kind` vs. `category` vs. `channel` vs. `class` vs. `audience`. The user said "kind/category" — pick one and justify. Match trace.
- **The `error` event.** Does it fit `dev` vs `user`? Or does it deserve a third category (`runtime`)? Trace may already answer this.

### Output format for Job 3

Same as Job 2 — a discussion doc, ~600–900 words. Sections:

1. **What trace actually does** — quote the discriminant types as they exist. File:line citations.
2. **Proposed intercept event shape** — the parallel structure for intercept, with full type definitions.
3. **Migration impact** — every consumer call site touched, with file:line. Whether it's a one-line rename or a structural change.
4. **Consequences for the existing field set** — does `nodePath`, `nodePathSource`, `node`, `loc`, `callee`, `calleePath`, `step` move/change? Do they live at the top level, on each kind, or both?
5. **The `error` event** — recommendation on whether it joins `dev`/`user` or gets its own category.
6. **Recommendation** — exact shape to adopt, and a rough one-paragraph migration plan (not a full TDD plan; that comes after the user agrees to the shape).

---

## Constraints on you (the AR-5 / discussion agent)

- **No code changes.** Not to `.ts`, not to `.md`, not to tests. Identify and propose only.
- **Cite specifics.** Every claim with `file:line`. "Vague concerns" are not actionable; the user can't fix what you can't point to.
- **Push back on the user's ideas where warranted.** The doubly-linked-list shift was explicitly flagged for discussion — say "no" or "smaller version" if that's the honest answer. Don't rubber-stamp.
- **Honest uncertainty over false confidence.** If you can't answer something without running tests or simulating consumer code, say so.
- **Total output budget**: roughly 2000 words across the three sections. Job 1 is the briefest (punch list — short lines). Jobs 2 + 3 are the longer prose.
