# HANDOFF — danger-runner io-sync DDD revision session (2026-07-02/03)

> Cold-start handoff for a future agent, left by the session that did the **io
> async→sync DDD revision** (commit `b33e49d`). Written after the tree moved on
> substantially — read "Where everything lives NOW" first. **Companion note in this
> dir: [`./LOOP-GUARD-READY.md`](./LOOP-GUARD-READY.md)** (the guard-migration
> checklist — not duplicated here). Transitional; delete once the META question below
> is decided.

## Where everything lives NOW (verify — the tree churns fast)

- **The whole `study-lenses/` tree was DEPRECATED** by commit `0fca239` ("migrate
  for refactor", 962 files) → renamed to `src/lib/study-lenses--deprecated-architecture/`.
  This danger-runner (and its docs) now live under that deprecated path.
- The active **greenfield `src/lib/study-lenses/`** has **NO danger-runner and NO
  loop-guard** — neither is ported. HEAD was `c65e0c7` at handoff.
- The DDD revision commit **`b33e49d`** ("docs(danger-runner): DDD revision — sync
  DangerIoMocks, spliceLoopGuards seam, mode axis, D3 supersedes") is in history; its
  README/DOCS/types edits are intact in this dir.

## What the session did (the DDD revision, `b33e49d`)

Converted the Phase-0 DDD docs (README.md, types.ts, DOCS.md) per campaign handoff
`~/.claude/plans/runbutton-danger-sync-io-ddd.md`, plus two human gate decisions.
Docs + type declarations only — no impl (the impl was built concurrently; see below).

1. **io async→SYNC** — `DangerIo` (async, matched embody `IoMocks`, "one
   `buildIoMocks()` feeds both backends") → **`DangerIoMocks`** (sync-only,
   danger-OWNED; does NOT import embody's awaited `IoMocks`; shared-builder claim
   retracted; live interactive dialogs stay NATIVE; mocked confirm/prompt return a
   sync-scripted answer).
2. **Guard-seam — FULLY adopted `spliceLoopGuards` (HUMAN DECISION #1)** — docs
   describe danger driving the `lib/loop-guard/` peer's
   `spliceLoopGuards(code, { makeGuard, makeReset })`, authoring its own guard/reset
   call-text, provisioning `loop1..loopK` from `loopCount`, catching `LoopGuardError`
   → pre-settled `errored`. Classifier message-matches danger's OWN makeGuard RangeError.
3. **Mode axis — narrowed to `type?: 'script'` (HUMAN DECISION #2)** + `strict?`.
   `'module'` deliberately NOT admitted (a `<script type=module>` breaks the
   `var loop1..loopK` globals + the sync `window.__danger` bridge → footgun); module
   → § Out of scope. Declaration-only.
4. **D3 supersedes** — `handleReference` stays `EvaluateHandle` (adapter WRAPS danger;
   NO widening); subset check realised in the adapter, not `setOutcome`.
5. **AR correctness fixes** — settle floor `microtask`→**`macrotask`** (the paint
   rationale needs a macrotask; shipped code uses `setTimeout`); `__danger` bridge +
   counters flagged learner-forgeable; io answer-policy pinned; `Object.assign` before
   inject; lateral-not-down geometry.

**Ceremony:** AR-1 Design **PAUSE** + AR-2 Sketch **CONSIDER**. AR-1's two blockers
(guard-seam verb-mismatch, module-mode footgun) both arose because `lib/loop-guard/`
**landed mid-session** — resolved via the two human decisions above.

## ⚠️ Concerns & open questions for the next agent (ranked)

1. **META — is danger-runner being PORTED to greenfield `study-lenses/`, or abandoned
   in the deprecated tree? HUMAN DECISION NEEDED.** It is NOT ported. If abandoned,
   everything below is moot. `LOOP-GUARD-READY.md` raises the same caveat.
2. **Docs↔impl divergence (guard-seam), by design, still open.** The DDD docs say
   "fully adopt `spliceLoopGuards` / edits nothing under `embody/`", but the shipped
   `danger-run.ts` took an **INTERIM** path — imports embody's legacy `guardLoops`
   directly (+ a 2-line `embody/.../guard-loops.ts` type-fix) — because the peer's
   `LoopGuardError` boundary wasn't ready when the impl shipped. Footnoted at README
   §Where-this-sits (~:88) + DOCS §Structural-constraints. **loop-guard is NOW ready**
   (`LOOP-GUARD-READY.md`: 53 tests, `LoopGuardError` landed) — the migration CAN
   proceed (checklist in that file), *if* danger-runner survives the greenfield refactor.
3. **Process lesson:** the "fully adopt `spliceLoopGuards`" DDD decision ran AHEAD of
   the peer's readiness, forcing the impl session into an interim divergence +
   footnotes. If re-planning a guard-seam adoption, gate it on the peer's boundary
   actually landing first.
4. **Deferred by design (never built):** io mocks (DDD inc-5 — route
   alert/confirm/prompt/console through `DangerIoMocks`); `handleRun` danger branch +
   D3 adapter (DDD inc-6 — the only `orchestrate/` edit); the `vite.sandbox.config.ts`
   + `sandbox.html` eyeball harness (freeze/dialog/debugger).
5. **module-mode:** dropped `'module'` as a footgun (narrowed to `'script'`). If ever
   wanted, it needs a real design — it breaks the sync-settle + `__danger` bridge.
6. **Commit hygiene:** the session initially believed `b33e49d` swept ~14 unrelated
   concurrent files (a concurrent `git add -A`); the git log now shows a clean
   danger-specific message, so it may have been reworded/handled. Verify only if it matters.

## Pointers

- Memory: `project_danger_runner_ddd_done.md` (full Phase-1-TDD-COMPLETE state:
  8 commits `8a7d23f..207e760`, 46 tests, the interim guardLoops note).
- Executed plan + full 8-step edit inventory:
  `~/.claude/plans/read-claude-plans-runbutton-danger-sync-elegant-bengio.md`.
- Campaign handoff: `~/.claude/plans/runbutton-danger-sync-io-ddd.md`;
  WP0: `~/.claude/plans/runbutton-wp0-contract-lock.md`.
- In-dir relay: [`./LOOP-GUARD-READY.md`](./LOOP-GUARD-READY.md) (guard-migration checklist).
- Commits: `b33e49d` (this DDD revision) · `8a7d23f..207e760` (concurrent Phase-1 TDD)
  · `0fca239` (the deprecation/refactor) · loop-guard `87218af`.
