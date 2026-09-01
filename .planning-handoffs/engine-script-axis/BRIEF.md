# The `'script'` execution axis — measured evidence and a design proposal

> **⛔ READ [§ 11](#11-corrections-applied-by-the-receiving-session) BEFORE
> ANYTHING ELSE IN THIS FILE.** Eight of this brief's claims are falsified,
> including one instruction that cannot be carried out (§ 5.1 prerequisite 3's
> "transport it rather than re-derive it" — the artifact is gone) and one design
> step that is unimplementable where § 7.12 puts it. § 1.1's seven decisions and
> four further rulings are now recorded as **HR-23**; the body below still reads
> as though none of that happened, because § 10's review record is a history and
> the body is preserved for audit. **§ 11 supersedes the body wherever they
> disagree.**

**Nothing in this brief is a ruling.** It proposes; the human rules; rulings are
recorded in their own home
([DEV.md § Ruling provenance](./DEV.md#ruling-provenance), paths from the repo
root) — for this campaign,
`.planning-handoffs/evaluators-api-restoration/LOSS-LEDGER.md` § Rulings of
record. § 1.1 lists decisions taken verbally that are **not yet recorded
anywhere but here**.

Measured **2026-08-26**, HEAD `f6bd94b6`, Node `v22.11.0`, `@docusaurus/core`
`^3.7.0` (resolved 3.9.2), Vite `5.4.21`, vitest `^2.1.9`, acorn `8.16.0`,
chromium via playwright.

**The spike that produced these is STILL IN THE TREE, untracked, awaiting the
human's `rm`** (the agent's is hook-blocked). Inventory and disposition: § 9.
Re-running is unnecessary — every number is here — but it is available.

> **⚠ THIS DOCUMENT IS THE ONLY RECORD OF SEVEN HUMAN DECISIONS (§ 1.1) AND OF
> ~44 MEASUREMENTS.** It was drafted in a session-scoped temp directory that
> does not survive the session. **It must be committed to
> `.planning-handoffs/engine-script-axis/BRIEF.md` before anything else** —
> [DEV.md § Ruling provenance](./DEV.md#ruling-provenance) is explicit that a
> record `git grep` cannot see does not exist, and a scratchpad is weaker than
> the plan file that rule was written about. If you are reading this from a temp
> path, moving it is step zero.

---

## 1. Orientation

The engine (`src/lib/study-lenses/lib/engine/`) runs learner code on two axes.
`'module'` is genuine. `'function'` is a **simulation** —
`new Function(...names, body)` under a prepended `"use strict"`. This brief
carries the evidence for a third value, `'script'`, running learner code as a
real Script Record.

**Ownership.** The engine belongs to the evaluators-API-restoration campaign's
W4b chain (`git grep -rln "W4b" -- .planning-handoffs/`). The engine tree was
**clean** when this was written [measured: `git status --porcelain --
src/lib/study-lenses/lib/engine/` → empty], so a cold reader who checks and
concludes the constraint expired will be wrong: **the constraint is ownership,
not locking.** That session landed engine commits the same night (`a2ff78b0`
23:29, `fdaa2c98` 23:40); HEAD moved ~10 times during this session.

**The governing ruling**, verbatim
(`git grep -n "Why the axis stays two-valued"` →
`src/lib/study-lenses/evaluators/DOCS.md`, where it is a bullet, not a heading):

> **No execution path is ratified.** A third axis value joins only through its
> own design review, with its own review pair and engine increment. — HR-20,
> human ruling 2026-08-13

This brief does not discharge that. The receiving unit opens its own Phase 0
with its own `ar-1`/`ar-2` pair.

**HR-20 is also mechanically enforced, in three places outside the engine:**

```text
[read: src/lib/study-lenses/evaluators/types.ts:81]
  export type ExecutionAxis = 'function' | 'module';   (+ a 12-line JSDoc restating HR-20)
[read: src/lib/study-lenses/evaluators/tests/type-contracts.test.ts:150]
  // @ts-expect-error — no script execution path is ratified (human ruling 2026-08-13);
  //   adding the value makes this suppression unused, which fails tsc
  const wrong: ExecutionAxis = 'script';
[read: src/lib/study-lenses/evaluators/README.md:170-186]
```

Widening the engine alone therefore leaves a capability **no evaluator can
request**. That is a ruled, deliberate position — see § 1.1 decision 5.

### 1.1 Human decisions — provenance

Taken in an interactive session 2026-08-26. **Their only record is this brief.**
Under [DEV.md § Ruling provenance](./DEV.md#ruling-provenance) that is not yet a
recorded ruling. **The receiving session should get them confirmed into §
Rulings of record before relying on them, and must not treat any of them as
settled in the meantime.** All are `[relayed:]`.

**Provenance quality differs and the difference matters.** Only decision 2
carries the human's own words. Decisions 1, 3, 4, 5 and 6 are the agent's
paraphrase of a multiple-choice selection — the human chose an option whose
wording the agent had authored. That is weaker evidence than a quotation, and
where the body below reuses the bare verb ("ruled", "ruled deliberately") it
means _this_ kind of ruled, not a ledger entry.

1. `'script'` joins as a **third** value; `'function'` is not replaced.
2. **Indirect eval is rejected.**
   `[relayed: human, verbatim — "an incomplete simulation of variable semantics **is not** a narrow cost, it's suicide for an evaluation engine that's meant to _exactly simulate correct semantics_ for learners"]`.
   § 3.4 records what eval gets wrong as evidence for the ruling, not an
   invitation to reopen it.
3. **The creation check uses acorn, thread-side** — superseding an earlier
   `new Function` probe after that probe was measured to refuse working programs
   (§ 3.6).
4. **Acorn replaces the module line-1 marker** — one mechanism for both paths;
   the marker is retired before it was ever built (§ 5.3).
5. **Engine first; the evaluators' `ExecutionAxis` widens later.** The engine
   may carry an axis nothing can yet request. Ruled explicitly rather than
   arrived at by silence.
6. **The test tier was ruled to wait on a fast-tier spike.** That spike has
   since **run and passed** (§ 6, S37/S38), so the ruling is now available on
   evidence rather than deferred.
7. **Acorn IS the standard.**
   `[relayed: human — "it's ok if we accept acorn as the standard, learners aren't guaranteed to run on V8"]`.
   The most consequential of the seven: it converts every acorn-vs-host
   divergence from a fidelity defect into the definition of the language level,
   and it makes **gating** on the parse legitimate rather than dangerous. See §
   7.2b and § 7.13.

---

## 2. The premise this design started from was wrong, and measurement caught it

It was conceived as "the script axis needs a **classic** worker, which this repo
does not have." False in production.

```text
across the entire client build:
  `type:"module"` near `new Worker`    → 0 occurrences
  `{type:undefined}` near `new Worker` → 11 occurrences
```

webpack **strips `{ type: 'module' }`** from every worker construction and emits
every worker chunk as a classic IIFE. Confirmed on the shipped engine: chunk
`4801` carries the bootstrap's own strings
(`execute received before setup completed`,
`global key is not a valid identifier`, `EngineSetupError`, `EngineHaltError`)
plus `variables-worker-entry`, `test-worker-entry`, `variablesWorkerSetup`;
**0** ESM `import` statements, one `webpackBootstrap`, reachable from three
shipped page chunks. Confirmed at runtime: an entry spawned **with**
`{type:'module'}` reported `importScripts=true`, which a module worker cannot do
(S8b).

| tier                          | what a worker actually IS today                 |
| ----------------------------- | ----------------------------------------------- |
| **webpack / production**      | **classic** — `importScripts` already available |
| **Vite dev / vitest browser** | **module** — `importScripts` throws             |

**Certainty ~90%.** Measured at runtime for the spike entries, statically for
the shipped bootstrap chunk; the real engine's worker was not executed inside a
production page.

Consequences: **no consumer needs to change how it constructs a worker** (§
5.4); the engine's docs describe Vite's behavior as if it were the contract (§
7.11); and the real gap is that the test tier and production disagree about
worker type, and always have — the failure class `engine/DOCS.md` § Module
workers, thin per-consumer entries says only `npm run build` catches, and that
gate is currently broken (§ 4.1).

---

## 3. Measured — host semantics

Chromium via playwright; classic and module workers from blob URLs, no bundler.

### 3.1 `importScripts` is viable

| id  | question                                                  | measured                                                                                               |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| S1  | rethrows a **runtime** throw?                             | `THREW TypeError: boom`                                                                                |
| S2  | rethrows a **parse** error?                               | `THREW SyntaxError: Failed to execute 'importScripts' on 'WorkerGlobalScope': Unexpected end of input` |
| S3  | dynamic `import()` **inside a classic worker**?           | `RESOLVED default=42`                                                                                  |
| S7  | `blob:` URL under COEP `require-corp`?                    | `blob importScripts => ok`                                                                             |
| S8b | is `importScripts` callable in a **module** worker?       | `typeof=function \| CALL THREW TypeError: … Module scripts don't support importScripts().`             |
| S9  | SharedArrayBuffer + `Atomics.wait` in a classic worker?   | `SAB ok \| Atomics.wait => timed-out`                                                                  |
| S17 | can a classic worker be spawned at all?                   | `classic worker alive`                                                                                 |
| S26 | are `globalThis`-installed globals visible to the script? | `typeof injectedEmit inside script = function \| call result = called`                                 |

S1 was the kill-risk: an `importScripts` that did not rethrow would have forced
halt capture onto `self.onerror` and changed `serializeHalt`'s `rawError` shape
on one axis only. It rethrows. **S3** is why § 2 matters: the `'module'` axis
keeps working in production even though production workers are classic. **S8b**
corrects a control that was designed wrong — `typeof importScripts` is
`'function'` in a module worker; _calling_ it throws. A `typeof` guard therefore
cannot detect a worker-type mismatch (§ 7.4).

### 3.2 Script fidelity — the whole point

```text
S5: sloppy var=number | sloppy fn=function | STRICT var=number(2)
    | top-level this===globalThis: true
```

Every column is what a bare runtime gives. **Strict-mode top-level `var` reaches
`globalThis`** — the property a real Script has and an eval does not.

### 3.3 What `'function'` gets wrong today — all measured

| id   | construct                                  | `'function'` path                                              | via `importScripts`                                                                   |
| ---- | ------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| S20  | top-level `arguments`                      | `object len=2 [0]=EMIT-FN` — **the engine's injected globals** | `undefined` (no binding)                                                              |
| S19  | top-level `this`, strict (today's default) | `false (typeof undefined)`                                     | `true`                                                                                |
| S6a  | error position, throw on **line 3**        | `at eval (eval at <anonymous> (blob:…:8:10), <anonymous>:5:7)` | `at blob:…:3:7`                                                                       |
| S6b  | same, module path                          | —                                                              | `at blob:…:3:7`                                                                       |
| S24a | `SyntaxError` for `1 +`                    | `Unexpected token '}'` — **the wrapper's brace**               | `Failed to execute 'importScripts' …: Unexpected end of input`                        |
| S24b | same, module path                          | —                                                              | `Unexpected end of input`                                                             |
| S25  | hashbang `#!/usr/bin/env node`             | `SyntaxError: Invalid or unexpected token`                     | runs                                                                                  |
| S16  | top-level `return` / `new.target`          | **accepted**                                                   | `SyntaxError: Illegal return statement` / `new.target expression is not allowed here` |

S6a's `5:7` is before the engine's `"use strict";\n` prefix, which adds a third
line in production. S24a is the sharpest: a learner's syntax error is reported
today against a brace the learner never typed.

### 3.4 Indirect eval — the evidence behind the rejection

```text
S4: sloppy var a=number | strict var b=undefined | let c=undefined
```

Sloppy `var` reaches `globalThis`; a `var` in a program whose own first line is
`"use strict"` does not; top-level `let`/`const` never reach the global lexical
environment. Recorded so nobody re-derives it from `PerformEval` and reopens a
settled decision. HR-20's live-constraints list describes the same divergence
and is consistent with S4; whether that ledger entry should now cite a
measurement is the human's, in its own home.

### 3.5 The retired marker measured clean — recorded for the increment that may revisit it

```text
S21: unmarked => at blob:…:3:7 || marked => at blob:…:3:7 || marker ran = true
S22: enumerable in Object.keys = false || delete => TypeError: Cannot delete
     property '__$ps' || latched after tamper = true || read-back value = undefined
S23: bare hashbang module => OK (ran) || marked hashbang => SyntaxError: Invalid
     or unexpected token
S10: REJECTED TypeError: Failed to resolve module specifier "./nope.js".
     Invalid relative url or base scheme isn't hierarchical.
```

The line-1 marker is line-number neutral (S21) and its latching accessor
survives tampering (S22) — **but it is retired** (§ 5.3). S23 is why it needed a
hashbang guard. S10 records the one thing a marker sees that a parser cannot: a
**link** failure (unresolvable specifier) — see § 5.3's residual.

### 3.6 Why the `new Function` probe was replaced, and what acorn does instead

An earlier draft used a non-executing `new Function(code)` probe for the
creation check. Measured, it **refuses programs the platform runs**:

| code                  | real script | `new Function` | **acorn**, `sourceType:'script'`, `allowHashBang:true` |
| --------------------- | ----------- | -------------- | ------------------------------------------------------ |
| `#!/usr/bin/env node` | runs        | ✗ rejects      | **✓ parses**                                           |
| `return 1;`           | ✗ rejects   | accepts        | **✓ rejects**                                          |
| `new.target`          | ✗ rejects   | accepts        | **✓ rejects**                                          |
| `let NaN = 1;`        | ✗ rejects   | accepts        | ✗ **parses**                                           |

The hashbang row is the defect: a probe used as a gate reports `'creation'` for
a program `importScripts` executes fine (S25). Acorn fixes three of four.

**`let NaN` is unfixable by any static parser** and this is the shape worth
recording: a Script has **three** stages — parse,
`GlobalDeclarationInstantiation`, evaluate — and `HaltPhase` has **two** values.
The collision of a top-level lexical declaration with a restricted global
property (`NaN`, `undefined`, `Infinity`) is rejected at stage 2, which depends
on the actual global object at runtime. It is label-only and never a refusal.
**It also creates an invariant to record:** the engine installs consumer globals
`configurable: true` [read: `worker/bootstrap.ts:213-218`], which keeps the
common case out of stage-2 trouble; a future change to those descriptors would
turn a working consumer global into an instantiation-time `SyntaxError`.

### 3.7 Thread-side parsing vs spawning a worker to find out

The human asked whether parsing thread-side is cheaper than spawning a worker
only to learn the code does not parse. Measured in the same browser:

```text
S35  acorn parse — unparseable: 0.030ms | 1 line: 0.044ms
                   50 lines:    0.086ms | 500 lines: 0.342ms
S36  full engine run of an unparseable program, spawn → settlement:
                   [34.3, 16.9, 17.1]ms → mean 22.8ms, outcome 'errored'
```

**~760× cheaper** for the failure case; a 500-line parse is ~50× cheaper than a
_warm_ spawn. The spawn cost is real work — construction, ready handshake,
`SharedArrayBuffer`, setup round-trip, blob URL, teardown. It also composes with
a property the engine already has: construction is fully lazy and "a cancel or
fail before the run starts settles without spawning anything."

### 3.8 The bootstrap-globals defect, demonstrated

```text
S27: after top-level "var URL = 1": typeof globalThis.URL = number
```

§ 5.1 prerequisite 1, not hypothetical.

---

## 4. Measured — the bundlers

### 4.1 `npm run build` is broken on this tree, and it is not this work's

```text
TypeError: Cannot read properties of undefined (reading 'includes')
    at ExperimentalWorker._onError (node_modules/jest-worker/…/NodeThreadsWorker.js:146:23)
```

Verified pre-existing (identical with every spike file removed) and **not OOM**
(`--max-old-space-size=8192` crashes identically). jest-worker 29.7.0 under Node
v22.11.0, client minification only; the server compile succeeds.
`npx docusaurus build --no-minify` **succeeds**.

- **The production gate does not currently run** — for the whole repo, not just
  this work. `engine/DOCS.md` records that a webpack worker-chunk break "hid
  behind green browser tests until a real `npm run build` exposed it"; that
  catcher is offline and **unowned**. It is § 5.1 prerequisite 0.
- **Every build result here is from `--no-minify`.** Terser does not change
  chunk _format_, so the risk it specifically breaks a worker is low — **but
  untested, and it stays untested until the crash is fixed.** Docusaurus 3.10.2
  is offered by the build banner; whether it fixes this is unmeasured.

### 4.2 webpack — root cause found, fix measured

Before the fix, in a cross-origin-isolated production build
(`crossOriginIsolated: true`):

```text
PLAIN-CLASSIC ERROR: Uncaught ReferenceError: __webpack_require__ is not defined
CLASSIC ERROR:       Uncaught ReferenceError: __webpack_require__ is not defined
MODULE:              nonce=… | dynamicImport=resolved=7
```

| chunk                         | defines `__webpack_require__` | refs | `__webpack_modules__` |
| ----------------------------- | ----------------------------- | ---- | --------------------- |
| classic, with a static import | **0**                         | 3    | absent                |
| classic, import-free          | **0**                         | 3    | absent                |
| module                        | 1                             | 16   | present               |

**Root cause, read from
`node_modules/@docusaurus/core/lib/webpack/plugins/ChunkAssetPlugin.js`:** it
taps `additionalTreeRuntimeRequirements` with a callback taking only `(chunk)` —
**ignoring the `set` argument** — and unconditionally calls
`compilation.addRuntimeModule(chunk, new ChunkAssetRuntimeModule())`, whose
generated code interpolates `RuntimeGlobals.publicPath` and
`RuntimeGlobals.getChunkScriptFilename` and assigns `__webpack_require__.gca`.
It never adds those requirements to the chunk's set. App chunks already require
them for other reasons; a worker entry chunk that needs no chunk loading does
not, so webpack emits no `__webpack_require__` and the injected code throws at
worker load.

**That it is a Docusaurus↔webpack interaction defect rather than a webpack
limitation is the brief's inference**, well supported by the source and by the
fix working — but judgment, not measurement.

**The discriminator was never the worker type** — it was whether the chunk
happened to need a chunk-loading runtime. The module-entry chunk did (dynamic
`import()`), so it got the runtime and survived.

**After a `configureWebpack` plugin declaring the three missing requirements**
(`RuntimeGlobals.require`, `.publicPath`, `.getChunkScriptFilename`), same
build, same driver:

```text
MODULE:               nonce=SPIKE-NONCE-… | dynamicImport=resolved=7
CLASSIC:              nonce=SPIKE-NONCE-… | importScripts=true
PLAIN-CLASSIC:        no-static-imports | importScripts=true
SAME-ENTRY-AS-MODULE: nonce=SPIKE-NONCE-… | importScripts=true
```

**S14 — one entry, both spawn forms.** The fourth arm spawns the _same_ entry
with `{ type: 'module' }`; the page chunk shows webpack rewrote **both** spawns
to chunk `731` and both option objects to `{type:undefined}`. One entry file
yields **one chunk and one worker type**; the spawn-site option is discarded.
This is the measurement behind § 2.

### 4.3 Vite dev — five routes, all blocked

| id   | route                                                | measured                                                                       |
| ---- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| S11  | `new Worker(new URL('./entry.ts', import.meta.url))` | `Uncaught SyntaxError: Cannot use import statement outside a module`           |
| S29  | `?worker`                                            | import **is** inlined, but a MODULE worker is emitted → `importScripts` throws |
| S30  | `?worker&inline`                                     | identical to S29                                                               |
| S31  | `worker: { format: 'iife' }`                         | **no change** — build-only                                                     |
| S33  | `?worker_file&type=classic` (Vite-internal)          | `Cannot use import statement outside a module`                                 |
| S34  | what `?worker` hands back                            | `keys=[default] defaultType=function`                                          |
| S12a | the same entry as a **module** worker                | works: `nonce=… \| importScripts=THREW TypeError`                              |
| S12b | a module-only entry (TLA + dynamic import)           | `nonce=… \| dynamicImport=resolved=7`                                          |
| S12c | that module-only entry as a **classic** worker       | `Cannot use import statement outside a module`                                 |
| S28  | control: an **import-free** entry, plain form        | ✅ `no-static-imports \| importScripts=true`                                   |

Vite's dev server serves worker files as ES modules and offers no classic
format. The only classic worker that loads there is one with no static imports —
the hand-inlined worker-script string the engine exists to abolish
(`engine/worker/DOCS.md` § Why a typed module, not an inlined script).

---

## 5. Proposed design

### 5.1 Prerequisites, in order, each with its own AR pair

0. **(needs an owner)** The `npm run build` crash (§ 4.1). Fix it, probe the
   Docusaurus 3.10.2 upgrade, or record it as a standing repo risk with a named
   owner. Everything downstream of "production evidence" waits on it, and it is
   offline for the whole repo.
1. **Capture the bootstrap's built-ins at load.** S27 demonstrates the defect.
   `bootstrap.ts` resolves `postMessage` (`:379`), `URL`/`Blob` (`:234-247`),
   `Atomics` (`:306-322`) from `globalThis` **at call time**, after consumer
   globals and learner code have run. A learner writing
   `globalThis.postMessage = null` on the **shipped** `'module'` path today
   kills the halt post and hangs the run until the budget fires. **This is a
   precondition of the script path, not merely a pre-existing bug**: on
   `'function'` a learner needs an explicit `globalThis.x =` to reach the
   engine's resolutions; on `'script'` a bare `var URL = 1` does it. **The
   deliverable is an audited list, and this brief's own worked example was
   itself mis-audited — treat the numbers below as the corrected starting point,
   not as the finished audit.** Re-measured across the two helper modules:

   | symbol                               | where                                                   | call-time?                                                              |
   | ------------------------------------ | ------------------------------------------------------- | ----------------------------------------------------------------------- |
   | `Atomics`                            | `read-call-response.ts:20,31,37,43`                     | **yes** (was omitted from the first list)                               |
   | `Int32Array`, `Uint8Array`, `Object` | `create-buffer-views.ts:16,17,21`                       | yes                                                                     |
   | `TextDecoder`                        | `read-call-response.ts:27`                              | **no — module load**, and its own comment says `// WHY at module load:` |
   | `Error`, `Function`, `String`        | **not in these files** — `bootstrap.ts:294,295,175,362` | —                                                                       |

   The audit must cover `worker/` end to end, not these two files.

2. **Resolve the test tier** (§ 6) — ruled after its spike, per § 1.1
   decision 6.
3. **The Docusaurus classic-worker plugin** (§ 4.2). The working implementation
   is `docusaurus.spike.config.ts` in the tree right now (§ 9) — transport it
   rather than re-derive it. `docusaurus.config.ts` is shared configuration:
   human approval to edit. Note it stays regression-untestable until a
   production consumer of the engine exists (§ 5.4).

### 5.2 The axis

Name the union once and export it — `worker/types.ts` already imports `HaltKind`
from `../types.js`, so the precedent exists:

```ts
// engine/types.ts
type ExecutionPath = 'function' | 'module' | 'script';
```

Deliberately **not** `ExecutionAxis`, which is the evaluators' name for a
different type — the same discipline that already keeps `EngineSettlement` apart
from `Settlement` and `EvaluateSpec` from `EvaluationSpec` (`engine/README.md` §
Vocabulary bridges). Three inline literals collapse into one alias:
`EvaluateSpec.execution`, `ExecuteMessage.execution`, `TransportInit.execution`.

Default stays `'function'`; `evaluate.ts:186-187`'s single defaulting site keeps
its shape. **Record why the default stays** — once `'script'` exists,
`'function'` is the only value with no fidelity story, and a default is the
hardest thing here to change later. The README must also answer, in one
sentence, **when a consumer should pick `'function'` over `'script'`.**

`strict` stays on the spec, honored on `'function'`, and is **inert on
`'script'`** as it already is on `'module'` — say so in its JSDoc and in README
§ Public API, because it becomes function-path-only and nothing currently passes
it [measured: `git grep -n "strict:" -- 'src/lib/study-lenses/evaluators/'
'src/lib/study-lenses/evaluators-deprecated/'` → no production hits]. Free
today, expensive in a year.

**Thread side**, in `startRun` (`evaluate.ts:150-157`), **not** in `evaluate()`:
the pre-start short-circuit already there —
`if (state.stop !== null) { settle(state); return; }` — is the clean insertion
point, and it keeps the documented laziness contract (`types.ts:126`, `DOCS.md`
§ Execution phases item 1: "the factory runs nothing: it assembles a handle").
Parsing in `evaluate()` would amend that contract; do not.

```ts
parse(code, {
	ecmaVersion: ECMA_VERSION, // 2024 — the repo's SHARED pin, NOT 'latest'
	sourceType: execution === 'module' ? 'module' : 'script',
	allowHashBang: true,
});
```

**An `ecmaVersion` is mandatory, and it must be the repo's shared pin — an
earlier draft of this brief said `'latest'` and was wrong.**
`src/lib/study-lenses/embody/ecma-version.ts` exports `ECMA_VERSION = 2024`, and
its comment states why it is numeric and why it is shared:

> "Numeric, not `'latest'` — eslint-scope's ES6 gate is `ecmaVersion >= 6`: a
> string fails the comparison and silently degrades every scope to ES5. One
> shared value keeps acorn's two readers (tokenize, parse) and the environment
> stage's scope analysis on one parse goal, **so they cannot drift**."

An engine that picks `'latest'` independently is exactly the drift that constant
exists to prevent. Measured: 2024 and `'latest'` agree on every case tested
(top-level await, hashbang, top-level `return`, `let NaN`, class static blocks,
decorators) and differ only in the `using`-declaration error _message_ — so the
pin costs nothing today and prevents a silent divergence later.

**OPEN — where the constant lives.** The engine is declared dependency-free and
is a _shared leaf_; importing `embody/ecma-version.js` is a cross-region
dependency it forbids. Three options, none free: move the constant somewhere
genuinely shared; take it as an `EvaluateSpec` field (consumer-supplied, this
engine's idiom for everything else); or duplicate the numeral and accept the
drift. **The receiving unit owes a ruling.**

Omitting it entirely is the worst option, and is a repeat of the defect that
killed the `new Function` probe. Measured:

```text
acorn, sourceType:'module', ecmaVersion omitted
  → "Since Acorn 8.0.0, options.ecmaVersion is required. Defaulting to 2020"
  → parse('await 1;')  THREW: Cannot use keyword 'await' outside an async function
acorn, sourceType:'module', ecmaVersion:'latest'
  → parse('await 1;')  PARSES
```

Top-level await is the module path's headline capability (S12b). At the default
2020 the gate would refuse a program the platform runs — exactly the failure §
3.6 uses to reject the probe. (At `'latest'`, `allowHashBang` is a no-op —
hashbang parses without it — but state it anyway so a future `ecmaVersion`
change does not silently reintroduce S25.)

`'function'` keeps its existing structural split and is **not** parsed.

**What a parse failure settles as is an OPEN CONTRACT QUESTION, not a
specification** — see § 7.13. It cannot be stated as "`errored`,
`phase: 'creation'`" because the public types have no vocabulary for it.

**Worker side**, the script path in `handleExecute`:

1. Install setup globals on `globalThis` via `Object.defineProperty` — the same
   call the module path already makes. A script takes no parameters, so this is
   the only channel (S26).
2. `importScripts` the code as a blob. A throw is `phase: 'evaluation'` — the
   thread already proved the source parses. Use
   `new Blob([code], { type: 'text/javascript' })`, matching the module path
   (`bootstrap.ts:235`), and **revoke the object URL in a `finally`** as the
   module path does (`bootstrap.ts:246-248`).

   **`importScripts` does not typecheck in this repo and needs a documented
   cast.** Measured: `tsconfig.json` sets `"lib": ["ESNext", "DOM"]`, so
   `importScripts(u)` is `error TS2304: Cannot find name 'importScripts'`;
   adding `"WebWorker"` yields `error TS6200: Definitions … conflict` across
   300+ identifiers, so the obvious remedy is unavailable. Follow the precedent
   the bootstrap already carries for exactly this reason —
   `bootstrap.ts:376-379`'s single documented cast for the worker-scoped
   `postMessage`, whose file header explains it: _"the repo's tsconfig serves
   DOM types (Docusaurus site) — the worker-scoped single-argument `postMessage`
   therefore rides one documented cast."_ The script path adds a second cast of
   the same kind, with the same comment discipline.

3. `postHalt`, unchanged. Synchronous natural end, like `'function'`.

**The capability pre-flight belongs in `handleSetup`, not `handleExecute`** (§
7.12): attempt `importScripts` on a known-good empty blob before any consumer
global is installed. A throw means a worker-type mismatch and posts a structured
`failure` — the existing consumer-setup-failure family (`bootstrap.ts:103-131`),
which already settles `worker-error`. Placing it at setup means the check
precedes any mutation of the sandbox and the thread learns before code is
delivered.

### 5.3 The module marker is retired

Acorn at `sourceType: 'module'` gives the module path the same
creation/evaluation split with **none** of the marker's costs: no source
rewriting, no hashbang guard, no byte-offset shift, no reserved `__$ps` key, and
no amendment to the sibling session's just-committed link-failure decision.

It also declines a power rather than granting it. The marker would have made the
engine **rewrite the learner's source text**. Today's only rewrite is
`"use strict";\n`, a consumer-chosen spec option (`bootstrap.ts:166`).
`engine/DOCS.md` § Out of scope forbids the engine _inferring the execution
path_ from the code ("the engine never sniffs for `import`/`export`") — it does
not forbid reading per se, and § 7.10 states that boundary correctly. Nothing at
all governs the engine _writing_ the learner's code. **Whatever else changes, §
Structural constraints should gain a line naming the engine's complete, closed
set of source transformations** — with acorn adopted, that set is exactly one,
and conditional.

**The one thing a marker sees that a parser cannot** (S10): a module **link**
failure. An unresolvable specifier parses fine and fails at link, so acorn says
"parsed" and the run reports `'evaluation'` — which is exactly today's shipped,
documented behavior [read: `engine/types.ts`, `HaltPhase` — the link-stage
residual]. So retiring the marker **preserves** that contract instead of
amending it. That is a point in favour, not a gap.

### 5.4 Consumer impact

Given § 2, **no consumer changes how it builds a worker.** `workerFactory` stays
`() => Worker`; production workers are already classic; the `{ type: 'module' }`
in consumer source is already inert there. A consumer opts into `'script'` by
passing `execution: 'script'` and nothing else — except that per § 1.1 decision
5 no evaluator can do so yet: `evaluators/types.ts:81`'s union stays closed and
its tsc tripwire stays armed until a later, separate widening.

**So the engine ships an axis only its own tests exercise.** Ruled deliberately.
The receiving unit should record, in the engine README, that the axis has no
evaluator consumer yet and which unit is expected to widen it.

Construction sites, for scope [measured: `git grep -n "new Worker(" --
'src/lib/study-lenses/' ':!*.md'` — this matches **lines**, including JSDoc
mentions inside `engine/types.ts`, so read the output rather than trusting a
count]: two non-test sites in the greenfield tree
(`evaluators-deprecated/{run/create-run-stream.ts,intercept/create-intercept-stream.ts}`)
plus the variables tracer in `study-lenses--deprecated-architecture/`. **None
needs editing**, which removes the frozen-region problem
(`evaluators-deprecated/` is compile-and-green only under HR-11/HR-14) that an
earlier draft carried.

---

## 6. The test tier — MEASURED, and the fast tier works

Vite dev cannot host a classic worker with static imports (§ 4.3). It can host a
**pre-bundled** one.

- **FAST TIER — MEASURED WORKING.** Build the worker entry to an IIFE with
  esbuild (already resident as a Vite dependency), then spawn it classic inside
  the existing `browser` vitest project:

  ```text
  esbuild classic-entry.ts --bundle --format=iife --target=es2022
      → 635 bytes, 2ms, 0 ESM import statements, import inlined

  S37  Vite-served, spawned classic:
       nonce=SPIKE-NONCE-… | importScripts=true
  S38  fetched → blob → classic worker:
       bytes=3586 esmImports=false => nonce=SPIKE-NONCE-… | importScripts=true
  ```

  `bootstrap.ts` stays a single typed source built by a bundler — _not_ a
  hand-inlined worker-script string — so `engine/worker/DOCS.md`'s anti-drift
  rationale survives, which is the exact ground on which the import-free-entry
  alternative is rejected. No new runner, no new npm script, no production
  build, red-green per increment intact.

  **What is still unspecified** (the receiving unit's to design, not a blocker):
  where the esbuild step is invoked — a vitest `globalSetup`, a small Vite
  plugin, or a pretest script — and whether the bundled artifact is committed or
  generated. S37 used a committed artifact; S38 shows a fetch-and-blob path
  works too, so both are open.

- **SLOW TIER (does not gate).** Serve a production build with COOP/COEP and
  drive it with playwright. Every § 4.2 result came through exactly that harness
  — it survives at `<session-scratchpad>/s15-drive-built-page.mjs` (§ 9): a
  `node:http` server setting COOP `same-origin` + COEP `require-corp`, plus
  playwright chromium with `--enable-features=SharedArrayBuffer`, navigating to
  the built page and reading the rendered results (~90 lines). Genuinely
  valuable — it closes the documented webpack-catcher gap — and genuinely
  expensive: it needs § 5.1 prerequisite 0 fixed, a permanent `src/pages/` route
  reaching the engine, a runner, and minified-mode evidence.
- **REJECTED: an import-free classic entry** (works in Vite dev today, S28). It
  cannot import `bootstrap`, so the worker-side protocol returns to an inlined
  string.

**Proposed blocking rule:** the axis merges when the fast tier is green **and**
a built-bundle run has been performed at least once, manually, with the result
recorded. That is strictly more evidence than the shipped `'module'` axis
carries today, and it does not gate a union widening on new CI infrastructure.

---

## 7. Residuals and contract amendments

1. **Syntax-error messages gain a host prefix.** `importScripts` reports
   `SyntaxError: Failed to execute 'importScripts' on 'WorkerGlobalScope': …`
   where the module path gives a clean message (S24a/S24b). With acorn parsing
   thread-side, most parse failures never reach `importScripts` at all, so this
   shrinks to genuinely late failures. Whether anything strips the prefix is for
   `ar-1`; stripping is cosmetic, not classification.
2. **`let NaN`-class divergence survives any static check** (§ 3.6) —
   label-only, never a refusal, and it needs the `configurable: true` invariant
   recorded.

   **RESOLVED BY § 1.1 DECISION 7 — acorn's grammar IS the language, not a
   lagging approximation of the host's.** Measured, acorn rejects constructs V8
   accepts (`class A { @dec m(){} }` → `Unexpected character '@'`, at both 2024
   and `'latest'`). Before decision 7 that was a standing defect class: a parser
   refusing what the host runs reproduces the failure the axis exists to remove.
   **Under decision 7 it is the definition of the level** — learners are not
   guaranteed to run on V8, so a construct acorn rejects is out of bounds
   everywhere rather than accidentally allowed on Chrome. Two obligations follow
   instead of a residual: **pin the acorn version**, so the language does not
   move under learners on an `npm update`; and **align with `ECMA_VERSION`**,
   not with whatever the newest acorn accepts.

3. **`strict`-inertness is a migration hazard.** A snippet moved from
   `'function'` to `'script'` silently loses the `strict: true` default. Correct
   fidelity, surprising diff — and `with` programs, which today degrade to a
   SyntaxError halt under forced strict, will **run** on the script axis.
4. **Axis/worker-type mismatch is engine-undetectable and the cheap guard does
   not work** (S8b) — hence the setup-time pre-flight, § 7.12.
5. **Byte offsets** — with the marker retired, nothing shifts them. Still worth
   stating the invariant "no consumer derives source offsets from runtime error
   line/column" while the area is open.
6. **The globals-overwrite story changes shape, not behavior.** On `'function'`
   a learner shadows a parameter; on `'script'` a top-level `var console = …`
   overwrites the global. Same observable outcome, different mechanism —
   intercept needs no code change, but its README's explanation is wrong for the
   new axis. It already overwrites on `'module'`; whether that is _documented_
   was asserted in an earlier draft and could not be verified — a reviewer's
   greps over both intercept READMEs/DOCS found nothing. Check before relying on
   it.
7. **`findInvalidGlobalKey` is over-strict for globalThis delivery** — it
   rejects `yield`, `arguments`, `eval`, `let`, `static`…, all legal
   `globalThis` property names. **RECOMMEND: document, do not change.** Note it
   is **duplicated**, not shared: `worker/bootstrap.ts:353` and
   `testing/fake-transport.ts:295`, kept observably identical by the agnostic
   tier — so any change is two edits.
8. **The fake transport gains nothing.** RECOMMEND it run the function path for
   `'script'` as it already does for `'module'`, and that its header name both
   real-only axes. **Against `node:vm.runInThisContext`**: Node-realm Script
   semantics, not the worker's — the appearance of coverage without the fact.
   (Supporting claim, stated precisely:
   `[measured: git grep -n "from 'node:" -- 'src/lib/study-lenses/']` →
   **three** hits, all `node:path` in `vite.sandbox.config.ts` dev-server
   configs. The correct claim is _zero `node:` imports in runtime source_. **Do
   not quote the count** — an earlier draft said two, and a peer added a third
   mid-session. Run the grep.)
9. **AMENDMENT — the engine stops being dependency-free.** `types.ts` ("This
   module imports nothing: the engine is dependency-free") and `README.md` ("it
   depends on nothing outside itself") both become false. Acorn is already a
   direct dependency (`^8.16.0`) and the browser tier pre-bundles it, and
   thread-side placement keeps it out of every worker chunk — but the property
   is stated, and stating a replacement is the receiving unit's job.
10. **AMENDMENT — the engine now reads the learner's code.** `DOCS.md` § Out of
    scope says "the engine never sniffs for `import`/`export`; path selection is
    consumer-owned." Parsing to classify a _failure phase_ is not path
    selection, and § 5.2 keeps path selection consumer-owned — but the boundary
    must be restated deliberately, not left to be inferred.
11. **AMENDMENT — the `{ type: 'module' }` contract is stated as a hard
    requirement in three places, and § 2 shows production contradicts it.** All
    three need revising, and one is `types.ts`, the file Phase 0 locks:
    - `types.ts` `workerFactory` JSDoc: _"(2) MODULE TYPE — omitting
      `{ type: 'module' }` yields a classic worker whose ESM `import`s fail at
      load"_ — this is the **only** enforcement mechanism (doc-only by design)
      and it becomes conditionally false; it must express a _pairing_ rule.
    - `README.md`: _"Both constraints — module-type AND adjacency — are
      load-bearing."_
    - `DOCS.md`: _"**(2) The engine no longer guarantees
      `{ type: 'module' }`**…"_

    Not optional cleanup: the docs currently describe dev behavior as the
    contract, which is how the divergence stayed invisible.

12. **AMENDMENT — the pre-flight amends a named structural constraint.**
    `engine/DOCS.md` § Structural constraints: _"**The engine spawns only what
    the factory returns.** … the engine asserts nothing about the worker at
    runtime (module-vs-classic, adjacency, bundler)."_ The pre-flight **is**
    that assertion. Amend it explicitly ("…except the script path's
    `importScripts` capability probe"), or drop the pre-flight and let a
    mismatch surface as an ordinary throw. Note a probe failure from another
    cause (CSP blocking `blob:`) lands in the same bucket — acceptable, since
    `cause` stays `'worker-error'`.
13. **A thread-side parse failure settles as an errored stop carrying
    `phase: 'creation'`, and today's types already express it.** An earlier
    draft of this brief called this "not expressible" and "a contract-widening
    decision owed before `types.ts` locks". **That was wrong**, and the
    correction matters: it was the only thing standing between this design and §
    3.7's 760× saving.

    `StopCause`'s errored-stop arm is a plain data record with **no worker in
    it** (`evaluate.ts`):
    `{ kind: 'halt'; haltKind: HaltKind; payload: unknown }`. The thread
    constructs one, `classifyStop` routes it to `classifyErroredHalt`, and the
    run settles `outcome: 'errored'` carrying the payload — plus `refinement` if
    `refineError` produces one. Point by point against the earlier draft:
    - `EngineSettlement` needs no `phase` field. `phase` was never a settlement
      field; it lives inside the opaque payload, exactly where the worker path
      already puts it.
    - _"Absent on main-thread terminations"_ describes today's stop set — a doc
      sentence to update, not a type constraint. The field is optional and
      permits it.
    - `EngineError.cause` needs no parse value, because there is **no engine
      error** on this path. `DOCS.md`'s _"never a worker-error"_ rule is thereby
      **satisfied**, not violated.
    - Engine-authored payloads are not a new power: `defaultHaltPayload`
      (`bootstrap.ts:285-298`) already authors one whenever `serializeHalt` is
      absent.

    **It also aligns the engine's phase vocabulary with the embodiment's
    lifecycle**, which is the point of the spelling HR-20 chose: `'evaluation'`
    matches embody's `source → tokens → ast → environment → evaluation`, so a
    parse failure reporting `'creation'` reads as _"never reached evaluation"_
    in the vocabulary the learner already meets elsewhere. Two layers, one story
    — a reason to prefer this shape, not merely a cost to absorb.

    **The one real residual, and it is narrow.** On a thread-side parse failure
    the consumer's worker-side `serializeHalt` does not run, so the payload is
    the engine default `{ name, message, phase }` rather than the consumer's own
    shape. A consumer whose settlement mapping narrows its own payload shape (as
    intercept's does) meets an engine-shaped one on that path alone. Options:
    document it; add a thread-side author hook; or accept it, since for a parse
    failure nothing propagated and there is no worker-only attribution to
    preserve. **`ar-2` picks one — a small decision, not a gate.**

    `refineError` **does** fire on it (`classifyErroredHalt` runs the hook on
    every errored stop of this kind). Consistent, almost certainly right, and
    named here so it is not discovered.

    **A nuance that survives regardless:** for evaluator-driven runs embody has
    already parsed the learner's source at `ECMA_VERSION`, and the gate bars
    evaluation unless it succeeded — but the engine receives the
    **instrumented** source, a different string. The engine's parse is therefore
    not redundant: it validates instrumentation output, and a failure there is
    an **instrumentation defect, not a learner error**. The phase vocabulary
    must not quietly report an instrumentation bug as the learner's syntax
    error.

14. **AMENDMENT — the module path's phase behavior changes, and an earlier draft
    of § 5.3 claimed the opposite.** Parsing the module goal thread-side means a
    module _parse_ failure that ships today as `'evaluation'` becomes
    `'creation'`. That falsifies the recorded position at `types.ts:269-280` —
    _"The `'module'` path delivers `'evaluation'` for every rejection of its
    single-stage dynamic import — parse success is the consumer's own
    precondition upstream"_ — and its in-code twin at `bootstrap.ts:240-243`.
    Retiring the marker preserves the **link**-stage residual (§ 5.3); it does
    **not** preserve the parse-stage one. Both were committed by the sibling
    session hours before this brief.
15. **VOCABULARY — `'script'` now collides with `facts.type: 'script'`.**
    `evaluators/README.md:170-186` currently holds the axis and the parse goal
    apart _lexically_; after this change two of three tokens are shared while
    the concepts differ (how the run is posed vs. which goal produced the
    facts), and mismatched pairings stay legal and deliberate. The inference
    "the axis just mirrors `facts.type`" becomes irresistible, and acting on it
    would violate `engine/DOCS.md` § Out of scope. `'script'` is still the right
    token — it is the language's own word for a Script Record — but the homonym
    must be pinned, and the evaluators README's existing "three senses of
    `execution`" entry needs the fourth resolution plus a rule that no shared
    module derives the axis from `facts.type`.
16. **VOCABULARY — the engine glossary has gaps the change widens.** No entry
    for **execution path** or for **phase / creation / evaluation**, despite
    `HaltPhase` being exported contract. And two entries are falsified by § 2:
    **`sandbox`** = _"the killable **module** worker a run executes in"_ and
    **`worker factory`** = _"constructs this run's **module** worker"_.
    `DOCS.md`'s section heading is literally "Module workers, thin per-consumer
    entries". Step 0.1 of the receiving unit rewrites these; treat it as the
    deliverable, not cleanup.

---

## 8. What the receiving session should do

**Read first (~15 min):** `engine/README.md` § Public API and § How a run ends ·
`engine/DOCS.md` § Module workers, thin per-consumer entries and § Structural
constraints · `engine/worker/bootstrap.ts` end to end · `engine/worker/types.ts`
· `evaluators/types.ts:81` and its tripwire test · then §§ 2–4 here.

**Then, in order:**

1. **Get the human's rulings** on: § 1.1's SEVEN decisions (none recorded
   anywhere but here); § 5.1 prerequisite 0's owner; where `ECMA_VERSION` lives
   given the engine cannot import from `embody/` (§ 5.2); and the contract
   amendments § 7.9–§ 7.12 and § 7.14, of which § 7.14 changes the shipped
   `'module'` path's phase behavior. **§ 7.13 is NOT among them** — an earlier
   draft listed it as a contract-widening blocker and it is not one; today's
   types already express a thread-side parse failure.
2. **§ 6's fast-tier spike has already run and passed** (S37/S38). What remains
   is choosing where the esbuild step is invoked — a vitest `globalSetup`, a
   small Vite plugin, or a pretest script — and whether the bundled artifact is
   committed or generated.
3. Open the Phase-0 unit HR-20 requires: README → the twin ask → `ar-1` →
   `types.ts` + DOCS sketch + skipped suite → `ar-2` → commit → human gate. This
   brief is `ar-1`'s input, not a substitute for it.
4. Land § 5.1's prerequisites before the axis.

**Governance:** software work; `twin-doc` is asked at Phase 0 step 0.2, not
here; **`ceremony` is the human's and is not stated in this brief.**
Shared-worktree git mechanics are canonical in
[DEV.md](./DEV.md#shared-worktree-git-mechanics) and deliberately not
paraphrased.

**Model:** design work tracks the strongest available tier. `ar-2` and `ar-5`
carry no model pin and inherit the session's tier, so a downgrade to run this
Phase 0 also downgrades both of those reviews.

---

## 9. The surviving spike — inventory and disposition

Untracked, in the tree, **awaiting the human's `rm`**. The tests are
unconditionally green by construction (they record via `console.info` and assert
only what cannot fail), so a peer's `npm run test` is unaffected — but they sit
at module root as `*.browser.test.ts` rather than under `tests/`, a DEV.md
convention violation parked in a shared tree, and `git add -A` would sweep them.
`src/pages/script-axis-spike.tsx` becomes a **public route** in any build a peer
runs.

```text
src/lib/study-lenses/lib/script-axis-spike/   12 files (stages 1, 1b, 2, 2b, 4, 5, 6
                                              + 4 worker entries + bundled-classic-entry.js)
src/pages/script-axis-spike.tsx               the only webpack edge to the entries
docusaurus.spike.config.ts                    ← § 5.1 prerequisite 3's WORKING FIX; transport before deleting
vitest.spike.config.ts                        worker.format experiment (S31)
<session-scratchpad>/s15-drive-built-page.mjs ← § 6's slow-tier harness; rescue before it expires
```

Two are worth keeping rather than deleting: `docusaurus.spike.config.ts` carries
prerequisite 3's measured fix, and `s15-drive-built-page.mjs` is § 6's slow tier
in working form, in a session-scoped temp directory that will not survive. The
spike directory is also the cheapest place to run § 6's fast-tier spike, so
**consider deleting after that spike, not before.** `build/` holds a
`--no-minify` spike build (gitignored; already stale beforehand).

```bash
rm -rf src/lib/study-lenses/lib/script-axis-spike \
       src/pages/script-axis-spike.tsx \
       docusaurus.spike.config.ts vitest.spike.config.ts
```

---

## 10. Review record

Drafted 2026-08-26, two review rounds before handoff.

**Round 1 — context-free reader** (no session context): 7 MUST-FIX, 6
SHOULD-FIX, 3 NICE-TO-HAVE, all applied. It falsified two claims — a "the spike
was deleted" framing that was untrue, and a "zero `node:` imports" claim one
`git grep` disproves — and its challenge prompted the S14 measurement that
produced § 2, the finding that inverted the design's premise.

**Round 2 — `ar-1`: PAUSE**, 5 blockers, 5 important concerns. Resolved by human
ruling and by revision:

| finding                                                                  | resolution                                                                   |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| the parse probe as a gate refuses hashbang programs (S25)                | **acorn replaces `new Function`**, thread-side (§ 1.1 decision 3, § 3.6)     |
| the axis has no consumer; `ExecutionAxis` is closed, with a tsc tripwire | **ruled: engine first, unreachable axis accepted** (§ 1.1 decision 5, § 5.4) |
| the recommended test tier is blocked, cannot run, has no entry point     | **fast tier proposed, then SPIKED AND MEASURED WORKING** — S37/S38 (§ 6)     |
| the module marker rides inside the axis unit                             | **marker retired entirely** (§ 1.1 decision 4, § 5.3)                        |
| the brief certified a deleted spike that was live                        | fixed in round 1; § 9                                                        |
| pre-flight contradicts § Structural constraints; wrong placement         | § 7.12; moved to `handleSetup`                                               |
| "exactly two constructs" understates the divergence                      | § 3.6; third class named, `configurable: true` invariant recorded            |
| `'script'` collides with `facts.type: 'script'`; glossary falsified      | § 7.14, § 7.15                                                               |
| three literal unions, no named type; `strict` now path-specific          | § 5.2; `ExecutionPath`                                                       |
| unverified counts                                                        | § 5.4; counting command given instead of a number                            |

`ar-1`'s counter-proposal that a line-1 marker is a _better_ mechanism than a
`new Function` probe is recorded as superseded: acorn is better than both, and
the human retired the marker.

**Round 3 — context-free reader over the revision: 9 MUST-FIX, 8 SHOULD-FIX.**
All applied. It caught the design's most serious remaining hole and three
falsified claims of my own:

| finding                                                                                                                                                                                                          | resolution                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **acorn without `ecmaVersion` defaults to 2020 and REJECTS top-level await** — the same defect class that killed the `new Function` probe                                                                        | § 5.2 now pins `ecmaVersion: 'latest'` with the measurement inline                                                                 |
| **a thread-side parse failure is not expressible in `EngineSettlement`** — no `phase` field, `halt` documented absent on main-thread stops, no parse `cause`, and `refineError` would fire on a synthesized halt | § 7.13 rewritten from a prose reword into a **contract-widening decision owed before `types.ts` locks**, with three costed options |
| `importScripts` does not typecheck under `lib: ["ESNext","DOM"]`; adding `WebWorker` conflicts across 300+ identifiers                                                                                           | § 5.2 names the cast and the `postMessage` precedent it follows                                                                    |
| parsing the module goal changes the shipped `'module'` phase behavior — a sixth amendment, unlisted                                                                                                              | new § 7.14                                                                                                                         |
| **my prerequisite-1 built-ins audit was itself mis-audited** (3 right, 1 wrong-phase, 3 misattributed, `Atomics` missed)                                                                                         | § 5.1 corrected and re-measured                                                                                                    |
| acorn's grammar lags the host; never measured at the module goal                                                                                                                                                 | new § 7.2b, standing residual class                                                                                                |
| where the parse runs was ambiguous                                                                                                                                                                               | § 5.2 names `startRun`'s pre-start short-circuit and rules out `evaluate()`                                                        |
| **the brief lives only in a temp dir and never says to move it**                                                                                                                                                 | the ⚠ block at the top                                                                                                             |
| my _corrected_ `node:` count was already stale (three, not two)                                                                                                                                                  | § 7.8 now gives the command and refuses to quote a number                                                                          |

Three of round 3's findings were errors I introduced while fixing round 1 and
round 2. That pattern — the fix round being the dangerous round — is why this
brief was validated three times and why every count in it is a command rather
than a number.

---

## 11. Corrections applied by the receiving session

Round 4, in effect — the receiving session's own verification pass, 2026-08-26,
HEAD `fa1e0833`. **This section supersedes the body wherever they disagree.**
The body is preserved unedited: § 10 is a history, and rewriting the thing it
narrates would destroy the audit trail that makes the three prior rounds
legible.

Every § 1.1 decision, plus five further rulings taken at this unit's launch, is
now recorded as **HR-23** in
`.planning-handoffs/evaluators-api-restoration/LOSS-LEDGER.md § Rulings of record`
— findable by `git grep -n "HR-23"`, which is the test
[DEV.md § Ruling provenance](../../DEV.md#ruling-provenance) applies.

### 11.1 § 5.1 prerequisite 3's instruction cannot be carried out

§ 9 says `docusaurus.spike.config.ts` holds the working measured webpack fix and
directs the reader to "transport it rather than re-derive it." **The file does
not exist anywhere.** Not in the working tree, the index, the stash, or any
commit — it was never committed
`[measured: git status --porcelain; git stash list → empty; git log --all --diff-filter=D -- "*spike*" → empty]`.
Only the prose at § 4.2 survives. **It must be rewritten and re-measured.**

The **diagnosis** is independently confirmed and needs no re-derivation
`[read: node_modules/@docusaurus/core/lib/webpack/plugins/ChunkAssetPlugin.js:45-53 — "compilation.hooks.additionalTreeRuntimeRequirements.tap(PluginName, (chunk) => { compilation.addRuntimeModule(chunk, new ChunkAssetRuntimeModule()); });"]`.
The `set` argument webpack passes second is never received, so the three
requirements are never declared. § 4.2's root-cause paragraph is accurate.

`s15-drive-built-page.mjs` WAS rescued and is tracked here — but it hardcodes
the now-deleted route `/spiralearn/script-axis-spike` (`:69`) and an absolute
`file://` path to this machine's playwright (`:14-16`), so it needs a permanent
route and a path fix before it runs again.

### 11.2 § 4.1's build crash is a MASKED diagnostic, not a diagnosis

`[read: node_modules/jest-worker/build/workers/NodeThreadsWorker.js:145-154 — "_onError(error) { if (error.message.includes('heap out of memory')) { … } }"]`.
The `.message` dereference is unguarded, so any message-less thrown value from a
build worker makes **the error handler itself** throw the `TypeError` § 4.1
reports — destroying the original diagnostic and replacing it with an opaque
one. § 4.1's "jest-worker under Node 22, not OOM" is true but incomplete:
**nobody has seen the real failure.** Under HR-23 the crash is unmasked before
it is owned.

### 11.3 § 5.2's OPEN question is dissolved, and its premise was overstated

HR-23 pins the gate at `ecmaVersion: 'latest'` with acorn's version pinned
exactly, so the engine takes no numeral and nothing moves out of `embody/`. The
reasoning is in HR-23; two factual corrections belong here.

- § 5.2 calls `ECMA_VERSION` "the repo's SHARED pin." Its own comment scopes it
  to three readers **inside embody**
  `[read: src/lib/study-lenses/embody/ecma-version.ts:1-4 — "One shared value keeps acorn's two readers (tokenize, parse) and the environment stage's scope analysis on one parse goal, so they cannot drift."]`,
  and `embody/README.md:299` marks it `implementers`-audience. One cross-region
  importer exists and is itself irregular — a `lib/screening` **test**.
- § 5.2 says importing it "is a cross-region dependency it forbids." That is
  **prose only, not lint-enforced.** The tracked `import/no-restricted-paths`
  rule bars only `<sibling>/lib/**`, and `ecma-version.ts` is not under
  `embody/lib/`; `lib` appears in neither the `from` nor the `target` position
  `[read: eslint.config.mjs:15-22, 461-474]`. An agent expecting tsc or eslint
  to catch the violation will be wrong.
- § 5.2 frames duplication as "duplicate the numeral and accept the drift." The
  house form pairs duplication with an **alarm**, in the engine's own tier
  `[read: src/lib/study-lenses/lib/screening/tests/parse-settings.test.ts:57-58 — "// PINNED(Phase-0 2437801d: the language year is duplicated on purpose — this test is the alarm)"]`.
  Recorded because the framing, not the option, was the defect.

### 11.4 § 7.12's pre-flight is unimplementable where the brief puts it

`[read: src/lib/study-lenses/lib/engine/worker/types.ts:23-27]` — `SetupMessage`
carries `kind`, `sharedBuffer`, `workerConfig`. `execution` is on
`ExecuteMessage` only (`:30-35`). **`handleSetup` cannot know the axis**, and an
unconditional probe would call `importScripts` on every module-path run —
throwing in the vitest browser tier, whose workers are module workers, and
breaking the shipped suite. HR-23 resolves this by adding `execution` to
`SetupMessage`.

### 11.5 § 7.15 and the tripwire inventory belong to the widening unit

Under § 1.1 decision 5 `ExecutionAxis` stays closed, so the
`facts.type: 'script'` homonym does not exist yet. Deferring § 7.15 removes this
unit's **only** contact point with `evaluators/` — which matters, because
`evaluators/types.ts` sits in the live intercept chain's blast radius and a file
a peer has modified cannot be committed without taking their work
([DEV.md § Shared-worktree git mechanics](../../DEV.md#shared-worktree-git-mechanics)).

Recorded so the widening unit inherits it rather than rediscovering it: **there
are four HR-20 tripwires, not three.** § 1 lists `evaluators/types.ts:81`,
`type-contracts.test.ts:150` and `README.md:170-186`. It misses the glossary at
`evaluators/README.md:301-306` ("three senses of `execution`") and `:307-311`
("evaluate / evaluation — four senses") — a new axis value mints a fifth sense
and both entries amend. HR-20's live-constraints list also exists in **two**
copies (`LOSS-LEDGER.md:824-828` and `evaluators/DOCS.md:161-166`), which amend
together. And § 1's claim that `README.md:170-186` contains the "three senses"
entry is wrong; that passage points at DOCS.md instead.

### 11.6 § 5.1 prerequisite 1's audit surface, measured

The brief concedes its own list was mis-audited and says "the audit must cover
`worker/` end to end." The measured starting point
`[measured: grep -n over src/lib/study-lenses/lib/engine/worker/*.ts]`:

Only **three** symbols in the whole subtree resolve at module load —
`TextDecoder` (`read-call-response.ts:27`), `TextEncoder`
(`write-call-response.ts:58`), `Object.freeze` (`protocol.ts:26`) — and each
already carries an explicit WHY-at-module-load comment. **Everything else is
call-time**: `Atomics` at 22 sites across six files, plus `Object` (7), `Error`
(5), `String` (3), `Promise` (3), `SharedArrayBuffer` (2), `Function` (2), `URL`
(2), `Blob`, `Int32Array`, `Uint8Array`, `RangeError`, bare `postMessage`
(`bootstrap.ts:379`), and `globalThis` (`:65`, `:213`).

**Four of the six files are thread-side by their own `@file` lines** —
`clear-event-ready.ts`, `transport.ts`, `write-call-response.ts`,
`write-resume-signal.ts` — and are unreachable by any learner program. Under
HR-23 they stay in scope, but the audit records each site's **realm and
reachability**, because a thread-side latch is hardening where a worker-side one
is a correctness fix.

### 11.7 The test tier's remaining choice is narrower than § 6 implies

- `esbuild@0.21.5` is **transitive-only**, via `vite@5.4.21` ← `vitest@2.1.9`
  `[measured: npm ls esbuild]` — not a declared dependency, and one Vite bump
  from vanishing.
- **There is no `globalSetup`, no `pretest`, and no npm pre-lifecycle script of
  any kind in this repo**, so two of the three options § 6 offers have no house
  precedent at all. The only precedent for injecting build behavior is an inline
  plugin object literal: `vitest.workspace.ts:71-83` (`coop-coep-headers`) on
  the Vite side, and three `configureWebpack` literals at
  `docusaurus.config.ts:65,93,134` on the webpack side.
- The browser project is **Vitest 2.x API** — `browser: { name: 'chromium' }`
  `[read: vitest.workspace.ts:64-104]`. Writing `browser.instances` (Vitest 3)
  would be **silently ignored**. Its `include` also matches `.browser.test.ts`
  only; a `.browser.test.tsx` would land in the node project.
- The real config is `vitest.workspace.ts`. The root `vitest.config.ts` is
  stale, declares no projects, and disagrees with the workspace about aliases.

### 11.8 Smaller falsifications

| brief                                                                                       | actual                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts:126` says "the factory runs nothing: it assembles a handle" (§ 5.2)               | that sentence is `engine/DOCS.md:17`; `types.ts:126-127` words laziness differently                                                                                                                  |
| the defaulting site is `evaluate.ts:186-187` (§ 5.2)                                        | `evaluate.ts:187` **alone** — `:186` is `strict`                                                                                                                                                     |
| `evaluators/types.ts:81` carries "a 12-line JSDoc" (§ 1)                                    | 15 lines, `:66-80`                                                                                                                                                                                   |
| the tripwire comment is two lines (§ 1)                                                     | one line, `type-contracts.test.ts:151`, and § 1 truncates its operative clause — _"so the widening cannot land silently"_                                                                            |
| "the engine belongs to the … W4b chain" (§ 1)                                               | the ledger slots three SPECIFIC engine increments into W4b (`:852`, `:944`, `:1024`); the whole-engine generalization is this brief's own inference, and was unruled until HR-23 placed the unit     |
| § 10's round-3 table: "§ 5.2 now pins `ecmaVersion: 'latest'`"                              | § 5.2's body pins `ECMA_VERSION` (2024). The table is stale against the body it describes — and HR-23 has now ruled `'latest'`, so round 3 was right and the later change to 2024 was the regression |
| § 10's round-3 table: § 7.13 is "a contract-widening decision owed before `types.ts` locks" | § 7.13's own body says that was wrong. The table row is the pre-correction history                                                                                                                   |

Two further notes for whoever runs this next. `git grep -n "HR-20"` returns
**nothing** in `evaluators/DOCS.md` — the attribution there is
`(human ruling 2026-08-13)`, so § 1's lookup does not work and its own
`git grep -n "Why the axis stays two-valued"` is the one that does. And the
SessionStart hook reported `node v20.11.0` against an engines floor of
`>=22.11.0` while the session shell measured `v22.11.0`
`[measured: node --version]`; § 4.1's crash was measured under v22.11.0, so any
re-measurement states which node it ran on.

---

## 12. Deferrals recorded by the Phase-0 unit

Written at Phase 0 step 0.2, after `ar-1`. These are obligations this unit
accepted and scheduled rather than discharged, recorded in the repo because the
plan file that would otherwise carry them sits outside it — the same reason
HR-24 exists. Each names the step that owes it.

- **`engine/DOCS.md` § Out of scope's "gates and refusal" bullet is narrowed to
  PEDAGOGICAL gates — owed by 0.3.** The engine now owns a gate of its own (the
  thread-side parse), so a bullet disowning "gates" in general reads as a
  contradiction of `README.md` § Bounded context's **Owns**. The two senses are
  genuinely different — embody's evaluation-phase gate and an evaluator's
  refusal-as-data decide whether a program should run at all and fire before the
  engine is invoked, while the creation gate decides only whether the program
  parses on the goal it was posed as — and the README's glossary already draws
  that line. `ar-1` accepted the deferral and asked that it be findable; this is
  where it is findable.
- **`worker/README.md` § Realms' capture table gains `importScripts` for
  `bootstrap.ts` — owed by 0.3, executed in Phase 1.** The script path resolves
  a new ambient global in the worker realm, and the committed latch rule is
  mechanical: every one is latched. **This is a cross-unit tripwire.**
  `tests/latched-built-ins.test.ts` pins `bootstrap.ts`'s captures as an exact
  nine-element array
  `[read: tests/latched-built-ins.test.ts — it.skip('the captures in bootstrap.ts name exactly the globals the README lists for it')]`;
  that row is skipped today, and prerequisite 1's Phase 1 un-skips it. Whichever
  of the two units lands second inherits the amendment.
- **`worker/DOCS.md` § Capture order's conclusion is amended — owed by 0.3.** It
  currently reasons from "the module path's blob revoke and halt post land on a
  later turn after evaluation settles". `importScripts` is synchronous, so the
  script path's revoke and halt post land on the SAME turn — a third case the
  paragraph does not cover. The conclusion it draws still holds; the enumeration
  under it does not.
- **A shared default-halt-payload author — owed by Phase 1, decided by 0.3.**
  The thread-side gate authors a third `{ name, message, phase: 'creation' }`
  beside `worker/bootstrap.ts`'s and `testing/fake-transport.ts`'s, and nothing
  keeps the three identical: the agnostic conformance tier keeps the existing
  two honest, but the fake runs the function path and never reaches the gate.
  0.3's sketch names where the extraction lands and what that placement costs;
  Phase 1 performs it. Note the placement is not free either way — a new file
  under `worker/` is caught by `latched-built-ins.test.ts`'s LIVE
  `readdirSync(WORKER_DIRECTORY)` classification row, while a file outside
  `worker/` is invisible to the only instrument that enforces the latch rule.
- **The exact acorn pin (`^8.16.0` → `8.16.0`) lands with Phase 1's parse
  gate**, not with Phase 0 (HR-24). Phase 0 records it as contract; the
  `package.json` edit is shared configuration and rides the commit that first
  depends on it.
- **A built-bundle run, performed manually at least once, is a named gate at the
  Phase-1 close.** The fast test tier builds its own classic worker rather than
  letting the bundler decide, so it is structurally blind to the failure that
  would kill the design — webpack ceasing to strip `{ type: 'module' }`. The
  observed output rides that commit's body under `[measured:]`; it is not an
  aspiration.
