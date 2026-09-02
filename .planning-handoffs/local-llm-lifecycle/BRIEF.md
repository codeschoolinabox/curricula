<!-- cspell:ignore aithor webllm behavioral -->

# Brief — local-llm's outward contract: one failure channel, and a generation lifecycle

> **Status: OPEN. Nothing executed.** Opens a Phase-0 campaign in
> `src/lib/study-lenses/lib/local-llm/`. The aithor campaign's Wave 2 is
> **PAUSED** behind it (human ruling 2026-08-26) — see
> [`../aithor-contract-proposals/SEQUENCING.md`](../aithor-contract-proposals/SEQUENCING.md)
> § Wave 2 is PAUSED, **and the `### Rulings carried…` section directly below
> it**, which constrains settle-items 3, 4 and 8.

## Before reading further

1. Read the repo-root `CLAUDE.md` router, check your model id against its
   qualifying list, and read whichever AGENTS file it selects **end to end**.
   Then the `DEV.md` sections it directs you to.
2. **Enter plan mode and run a Plan-agent design pass before exiting it** [read:
   `AGENTS.principal.md` § Non-Negotiable Invariants 3 and 10 — "Only the human
   can waive it"]. The launch prompt's "confirm alignment in one message" is the
   alignment note _inside_ plan mode, **not** a substitute for it.
3. **Re-measure. Every number here is a rule, not a value.**
4. **The plan document must be an execution checklist** [read: ibid., invariant
   6]: every Phase-0 step, every AR trigger point, sandbox checkpoints, commit
   steps, quality checks, and at least one **Mermaid data-flow diagram** — this
   change spans local-llm, its adapters, and a consumer.

### Measured tree conditions (re-verify; all 2026-08-26)

- HEAD `11fc537b`, **84** commits unpushed. ⚠️ `main` has **no upstream
  configured** — `@{u}` fails; use `origin/main..HEAD`.
- ⚠️ **`npx tsc --noEmit` is NOT clean: 4 errors**, all foreign, all in a peer's
  untracked spike (`src/lib/study-lenses/lib/script-axis-spike/*`,
  `src/pages/script-axis-spike.tsx`). **That is your baseline, not zero.**
- ⚠️ `npm run lint:md` reports ~8,100 errors repo-wide — foreign debt. Scope
  every gate to your own changed files.
- ⚠️ Node is **v20.11.0**, below the engines floor `">=22.11.0"`. Vitest runs
  anyway; do not treat the warning as your breakage.
- ⚠️ `src/lib/study-lenses--deprecated-architecture/lib/local-llm/` is a **full
  duplicate**, with its own `aithor/load-model.ts`. It is
  `tsconfig.json`-excluded and out of scope, but any `git grep` sweep returns
  its hits. Exclude it: `":!src/lib/study-lenses--deprecated-architecture"`.

## Settings — what is decided, what you ask, what you must NOT state

- **`work: software`** — derived from the path. You state this.
- **`prospective`** — you state this.
- **`twin-doc: machine` (human ruling 2026-08-26).** A notional-machine document
  **is owed** for this campaign. No twin exists for local-llm today [measured:
  `ls src/lib/study-lenses/lib/local-llm | grep -i notional` → empty], so 0.2
  produces a new one. **Still put the twin ask at 0.2 to confirm** — the answer
  is re-asked across a session boundary [read: `DEV.md` § Phase 0, 0.2] — but
  this ruling is recorded in-repo, not in a plan file, so it is a record.

  ⚠️ **What silence at that confirm means — a governance collision, named not
  hidden.** [read: `DEV.md` § Phase 0, 0.2 — "**Where a twin already exists, the
  tree is the answer.** Silence resolves to `none` only where **no** twin
  document exists."] No twin exists here, so the letter of that bound would
  resolve silence to `none` — **reversing a dated, committed ruling and
  orphaning the `notional-machine.md` you just wrote.** That is precisely the
  outcome the bound exists to prevent: DEV.md gives its purpose as stopping "a
  session boundary plus one non-answer" from "silently reversing a human's
  explicit 'yes'". The tree-existence test is DEV.md's _proxy_ for "was there an
  affirmative answer", written when no other record could exist. **So: on
  silence, hold at `machine` — and surface this collision to the human at the
  Phase-0 gate as its own line.** Do not resolve it silently in either
  direction; DEV.md is governance surface and only the human amends it. Size
  class [measured: `wc -l` over `git ls-files | grep -i 'notional-machine.md$'`
  → 8 files]: module-level twins run **116–236** lines; the two whole-level ones
  run 797 and 840. local-llm is module-level.

- **`ceremony`: NOT SET, and you must never state it** [read: `DEV.md` §
  ceremony]. **Ask the human.** Two halves people forget:
  - **Silence answers for the _work_ — it runs at `medium`, and you must not
    interrupt to confirm that.** At `medium` the gates are **AR-1 and AR-5**.
  - Silence does **not** answer for the _record_: the settings line ships
    `ceremony` marked unset rather than filled.
  - ⚠️ If the human answers `full`, note that **`full` is not fully defined for
    work with no code**. Phase 0 here is docs-and-types. Name the gate set
    explicitly, citing § ceremony's docs-only precedent: AR-1 per documentation
    commit-group, AR-2 where a sketch is among the changed files, AR-5 over the
    campaign's SHA list, **AR-3 and AR-4 `n/a`**.
- Settings line form:
  `work: software · twin-doc: machine · ceremony: <answer or unset> · prospective`

## The Phase-0 artifact map

[read: `DEV.md` § Phase 0.] Three artifact-named steps; the order binds
unconditionally.

- **0.1 — `README.md`, with the ubiquitous-language glossary inside it.** This
  is a **revision** of a 23 KB existing README, not fresh authoring, so [read:
  `DEV.md` § Documentation migration discipline] binds a **loss ledger for
  local-llm's own docs** — every heading, term, constraint, example and pointer
  that does not survive, built by hand from the baseline diff, with a
  justification each. The glossary must absorb whatever new vocabulary the
  settle-items introduce.
- **0.2 — the twin.** `notional-machine.md` beside the README. Confirm the ask
  first (above). ⚠️ **The AR arrows below are drawn at `full`.** Which of AR-1
  and AR-2 actually fires is set by the declared level — at `medium` (the
  silence default) only **AR-1** and **AR-5** fire, and AR-2 does not. Do not
  read these arrows as overriding the level the human sets.

- **→ AR-1** challenges the README **and the twin together** — a twin is owed
  here, so handing over the README alone gives it half its inputs.
- **0.3 — `types.ts` + the `DOCS.md` architectural sketch (with the Mermaid
  `## Data flow`) + the tests, written for real and committed skipped.**
- **→ AR-2** challenges the sketch against the types.
- **→ review, resolve, commit → the ONE human gate.** Phase 1 does not start
  until the human approves.

### What 0.3's skipped suite means against 271 green tests

[measured: `npx vitest run --project unit src/lib/study-lenses/lib/local-llm` →
**8 files / 271 tests passing**; plus 3 browser-lane files.] Handle them per
behavior, not per suite:

- Tests over behavior the reshape does **not** touch stay green, unmodified.
  They are the regression net.
- Tests over behavior whose **expression** changes are rewritten skipped, their
  originals deleted in the same commit.
- Tests over **deleted** behavior are deleted, each with a ledger line.

⚠️ **If this deletes passing tests, that goes on the human-gate agenda as its
own line**, with the file list and count in the commit body.

## The question

**Should local-llm's outward contract be re-established — a uniform failure
channel and a modeled generation lifecycle — before any consumer locks a seam
around the current shape?**

This brief argues **yes**, scoped to the boundary. **The argument is the
brief's; the rulings are the human's.**

## Measured ground

All measured 2026-08-25/26. Re-verify before relying on any of it.

### 1. `load` has THREE failure channels, and the only consumer paid 365 lines

[read:
`src/lib/embody/language-levels/just-enough-javascript/aithor/load-model.ts`
@file — "local-llm is **NOT uniformly value-not-throw**: `load` THROWS on an
unknown model name, RETURNS a `LoadFailure` for a device/availability limit, and
REJECTS when its capability probe (or any infrastructure step) faults."]

That file is **89 lines**; its test file `aithor/tests/load-model.test.ts` is
**276 lines** [measured: `wc -l`] — 365 together, existing only to absorb three
channels into one `ok`-boolean vocabulary. It runs a catalog membership
pre-check **before** calling `load` purely so the unknown-name throw is never
reached.

⚠️ **A design question, not a foregone conclusion.** Throwing on an unknown
model name is defensible as programmer-error-vs-runtime-condition, and "throw on
invalid input at boundaries" is a repo convention [read: `DEV.md` § Error
Handling Strategy]. The defect may be _three_ channels where _two_ are right.

### 2. The generation half was never modeled

`load` is a first-class lifecycle — feasibility scoring, a candidate descent, an
attempts ledger, error classification, terminal-cause promotion. `generate` is
one line:

```ts
type LoadedModel = {
	readonly generate: (prompt: string) => Promise<GenerationResult>;
};
```

Three of local-llm's twelve § Out of scope bullets sit on that axis. **Quoted in
full — an earlier revision of this brief elided clauses in a way that widened
their meaning:**

- _"**Generation-time fallback** — the chain is **load-time only**; once a model
  is loaded, a failing generation propagates, it does not re-descend."_
- _"**Mid-generation device-loss** — the load-time `device-lost` outcome (a GPU
  drop *during bring-up*) is recorded in the attempts ledger and folds to
  `all-candidates-exhausted`; recovering from a device lost *during generation*
  is not in scope."_
- _"**Chain cancellation** — `load` takes no `AbortSignal`; cancelling a long
  multi-candidate descent is a real future need the chain creates, but is not
  modeled here."_ ← note this is scoped to the **load-time descent**, not to
  cancellation in general.

The other nine are correct boundary decisions (validation, prompt construction,
catalog contents, JEJ-agnosticism, cause→copy rendering). **Do not reopen
those** — except as settle-item 7 explicitly reopens one, which is why that item
is flagged.

### 3. The cancellation ceiling is WebLLM's, and it is asymmetric

[measured against `node_modules/@mlc-ai/web-llm/lib/*.d.ts`]

| stage                    | duration                      | abortable at the runtime?                                                                                                                                              |
| ------------------------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bring-up (weights fetch) | minutes                       | **NO** — `CreateMLCEngine(modelId, engineConfig?, chatOpts?)` takes no signal [`engine.d.ts:21`]; only `unload()` after the fact                                       |
| generation               | ~10 s (`max_tokens` 512/1024) | **YES** — `interruptGenerate()`, and `"abort"` is a `ChatCompletionFinishReason` member [`chat_completion.d.ts:666`], "if user manually stops the generation" [`:663`] |

**There is no request-level signal**: `chat.completions.create` accepts none
[measured: zero `signal|AbortSignal` hits in `chat_completion.d.ts`]. The only
lever is `interruptGenerate()`, an engine method — so an abort is wired
**out-of-band** from a listener to the engine the adapter closes over
(`webllm-adapter.ts:56`: `const engine = await createEngine(...)`).

⚠️ **`interruptGenerate` is declared three times and they do not agree on the
return**: `engine.d.ts:72` → `(): Promise<void>`; `types.d.ts:137` →
`: () => void`; `web_worker.d.ts:107` → `(): void`. The **no-argument** fact
holds in all three. Whether an abort is _awaitable_ does not — and that is
load-bearing for settle-item 3.

**Do not promise learners that cancelling frees a download. It cannot.**

### 4. The ownership hazard — architectural, not yet observed

- `interruptGenerate()` takes **no argument** — it kills _the_ generation,
  singular; it cannot name one.
- WebLLM **serializes per model** with an internal lock:
  `private loadedModelIdToLock` [`engine.d.ts:41-44`], and three times over:
  _"For requests sent to the same modelId, will block until all previous
  requests finish"_ [`types.d.ts:98,111,124`].
- local-llm shares **one `LoadedModel` across all callers** —
  `const cache = new Map<string, Promise<LoadedModel>>()`
  [`make-local-llm.ts:50`].

**So caller A's cancel could kill caller B's in-flight generation, or fire into
a still-queued slot and do nothing.**

⚠️ **This needs a fourth premise the module does not currently supply: two
concurrent callers.** There is one consumer today, and its spec says **one ask
is in flight at a time** [read: `orchestrate/generator/README.md` — the ask
lifecycle]. **So this is an architectural hazard, not an observed bug.** Whether
to design against it is settle-item 3 — and "accept it, document the
one-generation-at-a-time constraint" is a legitimate answer.

### 5. Abort semantics are UNVERIFIED — do not inherit a claim here

An earlier revision of this brief asserted "on abort the reply is partial, not
an error," citing `chat_completion.d.ts:165-166`. **That citation was
misapplied**: those lines sit inside the JSDoc for the **`tools?`** field, and
"User can still get the raw string output" means _raw text instead of parsed
`tool_calls`_ — not that an aborted generation yields partial text as a value.

What is actually established: `"abort"` is a `ChatCompletionFinishReason` member
[`:666`]. **What a non-streaming `create()` resolves to when interrupted is NOT
established by the type surface.** Settle-item 4 must determine it empirically —
a spike against a real GPU lane, or by reading web-llm's implementation — before
ruling on it.

### 6. Two things already exist — do not "add" them

- **Caching per model**: the `cache` Map above — load-once + in-flight dedup.
- **A model bound into a callable**: `LoadedModel` already is one.

A proposal offering these is re-describing the current design.

### 7. The current outward surface

```ts
type LocalLlm = {
	readonly canRun: () => Promise<DeviceCapabilities>;
	readonly feasibleModels: (
		capabilities: DeviceCapabilities,
	) => readonly ModelCatalogEntry[];
	readonly recommendedModel: (
		capabilities: DeviceCapabilities,
		selection?: Selection,
	) => ModelCatalogEntry | null;
	readonly load: (
		selection?: Selection,
		onProgress?: (progress: LoadProgress) => void,
	) => Promise<LoadResult>;
};
```

## The eight settle-items — the HUMAN rules these, not you

⛔ **You may not write a `(human ruling YYYY-MM-DD)` parenthetical for any item
below until the human has answered it.** [read: `DEV.md` § Ruling provenance —
"A ruling is cited or it does not exist… a ruling you cannot locate in one
command is one you are inventing."] The parenthetical form is indistinguishable
from a real ruling afterwards, so a fabricated one is undetectable. **This brief
supplies arguments and a recommendation for several of them; that is not an
answer.**

**How to run them:** items 1, 2, 3, 4 and 6 are **blocking** — they change what
`types.ts` says, so they must be answered before 0.3 locks. Present them as a
batch during plan mode, with your recommendation and the cost of each option.
Items 5, 7 and 8 may ship **explicitly deferred** with the deferral recorded.

1. **The failure channel.** Two channels or three? If `load` keeps its
   unknown-name throw, say so in the contract so no consumer writes a pre-check
   to dodge it again. **(blocking)**
2. **Does a generation have a lifecycle?** Attempts, causes, a ledger — as
   `load` has? Or is one call with one outcome the honest model? **(blocking)**
3. **Ownership under a shared model.** Queue-with-identity, or accept and
   document one-generation-at-a-time? See §4's fourth-premise caveat.
   **(blocking)**
4. **Abort semantics.** Reject, or resolve with whatever text exists? **§5 says
   this is unverified — measure before ruling.** **(blocking)**
5. **Mid-generation device loss.** In or out? Currently out. **(deferrable)**
6. **Streaming: in or out — deliberately.** WebLLM supports `stream: true`, and
   an `AsyncGenerator` return would give cancellation via the iterator protocol.
   But **no consumer asks for it** [measured: no streaming request in
   `orchestrate/generator/README.md`] and aithor gates a **complete** candidate.
   Taking it is a product bet about the waiting experience; taking it by
   accident is scope creep. **(blocking — it changes the return type)**
7. **Where the `NextStep` knowledge lands.** `aithor/load-model.ts` derives a
   product-neutral next-step category from local-llm's five terminal causes. ⚠️
   **This item deliberately reopens one of the nine boundary decisions**:
   local-llm's § Out of scope says "**The cause→guidance render surface** —
   mapping a terminal cause to copy/a download URL (incl. naming a product) is
   the consumer's." Moving `causeToNextStep` in would import a product
   vocabulary (`use-native-app`, `free-space`, `reconnect`, `retry`) into a
   module that declared it out. **Either the boundary moves — a ruling — or the
   knowledge stays consumer-side and the campaign says so.** It must not
   evaporate. **(deferrable, but say which)**
8. **The handle shape.** `{ generate }` versus a bare callable versus
   `{ result, cancel }`. Note the cosmetic half churns every consumer call site
   for no behavioral gain. **(deferrable)**

## What this campaign is NOT — and the four seams where the line is not clean

**The intent: redesign the boundary, keep the engine.** `feasibility.ts` (18
KB), `catalog.ts`, `classify-load-error.ts`, `promote-terminal-cause.ts`,
`bucket-device-memory.ts` and the candidate descent are the hard-won asset
behind 271 tests.

⚠️ **That line is aspirational, not mechanical. Four seams cross it, and Phase 0
must decide how far each may move:**

1. **The cache IS the boundary.** Per-model generation ownership (settle-item 3)
   means the cached value stops being `Promise<LoadedModel>` and becomes
   model-plus-queue — editing `make-local-llm.ts`, the declared load-once core,
   under 43 tests.
2. **The abort wiring reaches the adapter contract.** `RuntimeAdapter` returns
   `Promise<LoadedModel>` [`types.ts:189-193`] and `LoadedModel` is
   `{ generate }` [`types.ts:59-61`]. The engine is **not** reachable through
   those types, so a signal-accepting `generate` changes `LoadedModel` — which
   every adapter must then implement. The _shape_ of host injection
   (`AdapterMap`) is unchanged; what an adapter must **honor** is not. 14
   adapter tests sit on it.
3. **Unifying the failure channel reaches engine files.** The third channel
   resolves to `LoadFailureCause`, produced by `classify-load-error.ts` and
   `promote-terminal-cause.ts` — 38 tests, both nominally do-not-touch.
4. **Settle-item 7 reopens a declared boundary** — see above.

**Also NOT in scope:** streaming by default (settle-item 6 decides it); aithor's
Wave 2; a second adapter (CPU/WASM, local-server — named downstream build work
in the module's own § Out of scope).

## The consequence for aithor — an obligation, not an edit

If the failure channel is unified, `aithor/load-model.ts` (89 lines) and its
276-line test file largely dissolve. That is a deletion of working, tested code,
so [read: `DEV.md` § Documentation migration discipline] binds an enumeration
built by hand. The five-cause → `NextStep` derivation is the part most likely to
be silently lost; settle-item 7 decides where it goes.

⛔ **Do not perform that aithor-side deletion in this campaign.** It belongs to
the resumed Wave 2. Record the obligation; leave the code alone.

**Downstream docs that describe the current contract** and will go stale:
`aithor/README.md` (12 mentions), `aithor/DOCS.md` (4), `aithor/evals/README.md`
(1), `src/lib/study-lenses/lib/README.md:42`. Updating aithor's docs is a
cross-territory write — **flag it to the human, do not do it unasked.**

## What unblocks Wave 2

`SEQUENCING.md` § Wave 2 is PAUSED states this precisely and **it governs on
conflict**: the local-llm campaign's **Phase-0 → Phase-1 human gate passing**,
and **settle-item 7 answered**. Not the whole campaign landing. If this brief
and that section ever disagree, that section is right.

## Pointers

- Module: `src/lib/study-lenses/lib/local-llm/` — `README.md` (23 KB), `DOCS.md`
  (17 KB), `types.ts` (18 KB).
- The consumer that pays the tax:
  `src/lib/embody/language-levels/just-enough-javascript/aithor/load-model.ts`.
- The paused campaign + the four carried rulings:
  [`../aithor-contract-proposals/SEQUENCING.md`](../aithor-contract-proposals/SEQUENCING.md).
- The cancel spec that motivates this:
  `src/lib/study-lenses/orchestrate/generator/README.md` — note it calls
  **retiring** the load-bearing half, so cancellation buys freed device work,
  not correctness.

## Rulings (human, 2026-08-26 — answered at plan approval, recorded same turn)

The eight settle-items and the two Phase-0 asks, as answered via the plan-mode
batch (AskUserQuestion, plan
`read-planning-handoffs-local-llm-lifecyc- ancient-swing`). These move into the
module's own README/DOCS/types as dated `(human ruling 2026-08-26)`
parentheticals as those documents are authored; the commit bodies enumerate the
transfer.

1. **Failure channel: TWO channels** — an unknown model name becomes a
   **returned refusal with its own distinct cause** (typo-vs-device distinctness
   survives as a value); genuine infrastructure faults (the probe rejection)
   remain rejections. The unknown-name throw is retired.
2. **Generation lifecycle: a typed outcome** — `generate` resolves an ok-boolean
   union: success carries the decomposed result; failure carries a small cause
   vocabulary + optional detail. No attempts ledger (generation has no descent;
   attempts/repair are aithor's curated loop).
3. **Ownership: accept + document one-generation-at-a-time per loaded model.**
   Queue-with-identity is a recorded obligation owed by whichever campaign
   introduces a second concurrent consumer — deferred, not evaporated.
4. **Abort semantics: abort resolves as a value** (an `aborted` generation
   outcome, never a rejection), plus the commitment: **a signal aborted at any
   time — mid-flight or after settlement — leaves the loaded model usable; the
   next `generate` proceeds normally.** (Forced by WebLLM v0.2.84's measured
   interrupt-flag poison behavior; the fix mechanism is Phase-1 implementation,
   not contract.)
5. **Mid-generation device loss: recovery stays OUT; `device-lost` is named**
   honestly in the generation-failure cause vocabulary (naming ≠ recovering).
   Folded into ruling 2's adopted vocabulary.
6. **Streaming: OUT of the outward contract, deliberately.** The wording leaves
   the adapter's internal use of WebLLM streaming legal.
7. **NextStep knowledge: stays consumer-side.** aithor keeps `causeToNextStep`;
   local-llm's delivery-agnostic boundary holds. Answered, not deferred — this
   is the settle-item half of Wave 2's unblock condition.
8. **Handle shape: `{ generate }` unchanged; cancel is per-call** —
   `generate(prompt, options?: { signal?: AbortSignal })`. The
   `{ result, cancel }` handle is rejected (call-site churn, duplicated
   AbortSignal semantics).

- **Ceremony: `full`** (the human's answer; AR-1 · AR-2 · AR-5 fire in this
  docs-and-types phase; AR-3/AR-4 defer to Phase-1 un-skips — wording flagged
  for confirmation at the gate).
- **Twin ask (0.2 re-ask): `machine` stands** — confirmed before `ar-1` spawned,
  so the answer window closed with an answer; no silence collision.

### AR-1 PAUSE resolution (human, 2026-09-01)

ar-1 (opus) returned PAUSE on 0.1/0.2 — 2 blockers, 8 important, 5 minor. The
human approved: **fix all 15** per the reviewer's counter-proposals, and ruled
the two open calls:

- **The `causeToNextStep` compile break** (widening `LoadFailureCause` with
  `unknown-model` red-lights aithor's exhaustiveness guard): resolved as the
  **frozen collateral ledger** in commit 2's body, handed to Wave 2 — the
  alternative sanctioned one-line aithor arm was **declined**; zero aithor edits
  this campaign.
- **Releasing a loaded model**: recorded as an explicit README § Excludes
  exclusion — nothing unloads a loaded model; a release verb is **deferred to
  the campaign that first needs one**. No new verb this campaign.

### AR-2 PAUSE resolution (human, 2026-09-02)

ar-2 (Fable, inherited) returned PAUSE on the 0.3 sketch — one blocker (the
data-flow generation tail drew decomposition wrapper-side, contradicting
types/tests/adapter, which place it below the adapter seam), one important
(abort-vs-classification precedence unstated), five minors. The human approved:
**apply the reviewer's counter-proposals as specified** — redraw the tail with
the decomposed reply as the node and seam 2 named as the backend's
non-deterministic call (decompose stays adapter-side; the alternative was
explicitly declined per the reviewer's own warning); add the abort-precedence
clause ("a fired signal settles `aborted` whatever the adapter's promise then
does") plus the abort-then-rejection skipped test; batch the four one-line
minors. The README's adapter-obligations wording gap (its committed list omits
the resolve-decomposed duty) goes to the gate agenda, not an edit.

### Phase-1 backend watch items (recorded 2026-09-02 — durable home)

Two hazards measured against WebLLM v0.2.84's implementation during Phase-0
planning, carried here so Phase 1 inherits them from the tree (a plan file is
not a record): **(1)** `triggerStop` commits the truncated assistant message to
the engine's conversation history — verify the adapter's per-call-messages
pattern keeps a cancelled reply out of the next prompt; **(2)** worker-mode
`interruptGenerate` is fire-and-forget across `postMessage` — the flag can land
after a generation already ended, which is the late-abort poison arm. Both sit
under ruling 4's usable-after-abort commitment; the third watch item (the
interrupt-flag poison behavior itself) is already recorded at ruling 4.

### THE PHASE-0 → PHASE-1 GATE: PASSED (human, 2026-09-02 — "proceed")

The one human gate of this campaign's Phase 0 passed on the full agenda (three
commits `675ec3c0` / `40837685` / `e80f001a`; two deleted-passing-tests; the
frozen aithor collateral ledger; the flagged cross-territory staleness; the
real-backend abort-evidence obligation). Agenda item 8 ruled WITH the gate: the
drafted Runtime-adapter amendment (the resolve-decomposed duty added; "as the
`aborted` outcome" re-attributed to the wrapper) is applied as its own follow-on
commit. **Consequence: both of SEQUENCING § What unblocks Wave 2's conditions
are now met** — the gate has passed and settle-item 7 is answered
(consumer-side). Wave 2 is launchable; its carried rulings are re-confirmed at
resumption per SEQUENCING § Rulings carried. Phase 1 of THIS campaign is a later
session (per those same rulings: on Opus): its TODO is the 4 declared-red
implementation errors + the 13 un-skips, one at a time, AR-3 each.
