# Relay note — `lib/loop-guard/` is ready (WP-G complete)

> Cross-session handoff from the WP-G / loop-guard build. **Transitional** —
> delete once danger-runner has migrated onto `spliceLoopGuards` (or once the
> decision below is made). Not an end-state doc.

## Context caveat — read first

After loop-guard was built, the **entire `study-lenses/` tree was renamed to
`study-lenses--deprecated-architecture/`** (commit `0fca239` "migrate for
refactor"). Both `loop-guard/` and `danger-runner/` now live under that
deprecated path. So **before acting on the migration below, confirm it still
applies** to the current architecture direction — the WP4 danger→loop-guard swap
may have been superseded by the refactor. This note documents the ready state as
of the loop-guard build; it does not assume the migration is still on.

## What is ready

`lib/loop-guard/` is complete and green (**53 node tests**,
`tsc`/`eslint`/`prettier` clean). Latest loop-guard commit at handoff:
`87218af`. The full contract, rationale, and both consumer forms are in its own
docs:

- [`../loop-guard/README.md`](../loop-guard/README.md) — see **§ The two
  consumer forms**.
- [`../loop-guard/DOCS.md`](../loop-guard/DOCS.md) — architecture + data flow.
- [`../loop-guard/types.ts`](../loop-guard/types.ts) — the locked contract.

The public verb:

```ts
spliceLoopGuards(code: string, { makeGuard, makeReset }): { code: string; loopCount: number }
```

It guards `while` / classic `for` / `do-while` / `for-of` with a braced body
(for-in + brace-less pass through), preserves line count exactly, parses
module→script (so `with` still parses), and throws a typed `LoopGuardError`
(`reason: 'parse-failed' | 'multiline-injection'`) — **the typed error boundary
is now implemented and tested**, no longer "mid-TDD".

## Stale comments to update in danger-runner (if the migration proceeds)

These claims are now false. Line numbers drift; search the quoted text:

- `danger-run.ts` — "\*re-point at `lib/loop-guard/`'s `spliceLoopGuards` **once
  functional\***" — it is functional.
- `danger-run.ts` — "\*its typed error boundary … is still **mid-TDD** in a
  concurrent session, so danger can't safely switch yet … until … the **boundary
  lands\***" — it has landed (`LoopGuardError`, tested).
- `DOCS.md` — the parallel "until `spliceLoopGuards`' typed error boundary
  lands" claim.

(The _other_ stated reasons danger hasn't switched — the guard-loops type-fix
revert, WP4 gating — are the danger session's call and are not addressed here.)

## danger's consumer form (illustrative)

danger keeps the oracle's `var loop1..loopK` model, so both hooks return the
oracle's own text with the iteration cap `M` captured in the closure (the hooks
no longer take a `maxIterations` param):

```ts
const hooks = {
	makeGuard: (n) =>
		`if (++loop${n} > ${M}) throw new RangeError("Loop ${n} exceeded ${M} iterations.");`,
	makeReset: (n) => `loop${n} = 0;`,
};
const { code, loopCount } = spliceLoopGuards(source, hooks);
// then emit `var loop1 = 0, …, loop{loopCount} = 0;` as today (build-danger-script.ts)
```

This is verified executably: loop-guard's golden-parity suite reproduces exactly
this oracle text through the hooks and reruns the oracle's iteration table
(`maxIterations ∈ {-1, 0, 1, 3}`) across all four loop types — behaviorally
identical to the recast oracle.

## Companion-migration checklist (danger session owns this)

- [ ] Swap the import: the excluded-embody `guardLoops` → `lib/loop-guard`'s
      `spliceLoopGuards` (drops the up-into-embody arrow-direction violation).
- [ ] Change the call site: `guardLoops(code, iterations)` →
      `spliceLoopGuards(code, { makeGuard, makeReset })` with `iterations`
      captured in the hook closures.
- [ ] `loopCount` is unchanged (still drives the `var loop1..loopK` globals).
- [ ] Update the stale comments above and any README/DOCS/types references.
- [ ] Re-run danger's tests.
