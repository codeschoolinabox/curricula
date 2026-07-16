<!-- cspell:ignore Gateable entwine entwined entwining Failable curric eslint escope Entwinement chokepoint overclaimed relitigate relitigating touchpoint unpushed -->

# Handoff — embody: the Phase-0 amendment, then Phase-1 TDD

> Written 2026-07-15. **Ground truth churns — it went stale under this campaign
> twice today, once within 26 minutes, and a stale brief nearly told an agent to
> destroy uncommitted work.** At writing: HEAD `399bcac`, **10 unpushed**,
> `src/lib/study-lenses/embody/` holds `{README.md, DOCS.md, types.ts}` and **no
> implementation**. **Verify before you lean on anything here. Record your OWN
> baseline SHA.**
>
> ⚠️ **A JEJ agent is LIVE in this tree.** `language-levels/**` is **not yours**
> — do not touch, fix, or stage it. **You now DO intersect it** (see §
> Coordination); that intersection routes through the maintainer, not between
> you.
>
> ⚠️ **Ignore the sibling briefs in `.planning-handoffs/`.**
> `study-lenses-phase1-entry.md` is **badly stale** (wrong HEAD, wrong unpushed
> count, claims deleted files exist, calls the canonical quarry a "stray") and
> opens with its own competing read-first chain. The keystone-contracts file is
> a spent wave record. The `jej-*` files are the other stream's. **This is your
> brief.**

## Read first, in this order (before ANY planning)

1. `CLAUDE.md` (the governance router), then your governance file per that
   router (`AGENTS.md`, or `AGENTS.fable.md` **only** if your model id contains
   "fable" — ⚠️ **verify the model id; a `/model` command makes the environment
   block stale**). Then `DEV.md` — **END-TO-END** (~2030 lines; paginate).
   **Governance outranks this brief.**
2. **The committed contracts you are amending** — through ar-1 + ar-2,
   committed, human-approved: `embody/types.ts` (263) · `embody/DOCS.md` (the
   sketch your Refactor step is held against) · `embody/README.md` · and
   `src/lib/study-lenses/README.md` — the package glossary, **the naming
   contract**.
3. **The approved plan:**
   `/Users/master/.claude/plans/read-end-to-end-and-before-golden-mountain.md` —
   the increment spine, file decomposition, AR ledger, baseline-delta gate, and
   verified findings. **This brief points; the plan specifies.** ⚠️ **Read its §
   Open at approval as OPEN.** ⚠️ **Honest limit:** its increment table has **13
   rows** and calls itself "the spine"; prose says it was "refined into 18".
   **The 18 do not exist as written** — entwine's row is
   `| 6–8 | entwine (see below) | — | — |`, with **no ZOMBIES cases**, and the
   AR ledger still says `×13`. **Deriving the real increment list is your job,
   not a lookup.** ⚠️ **The plan predates this amendment** — it plans Phase-1
   against a 6-phase lifecycle with no environment fact. Its _findings_ hold;
   its _scope_ is superseded by § The rulings below.
4. The **ratified decision record**, **§§ 0–5** — background rationale:
   `/Users/master/.claude/plans/read-through-0-curricula-dev-md-0-curric-cosmic-mountain.md`
   ⚠️ **Older than the committed contracts; loses to them.** Says "kernel" — a
   **banned term**. ⚠️ **Exception:** § 4.3's phase table (`## 7`, ~line 1016)
   and § 9.3 (~line 1580) carry the argument for **OPEN-1**. Read them **for
   that only**, knowing `## 7` drafts a file `0fca239` **deleted**.
5. This file.

## Mission — DDD first, TDD second

**Amend embody's Phase-0, take the human gate, then run Phase-1 TDD.** This is
**not** a Phase-1 start: the maintainer has changed the keystone, so the
contract moves before any test is written. Full ceremony on the amendment —
glossary → README → **ar-1** → types → DOCS sketch → **ar-2** → commit → **HARD
STOP**.

## The rulings (maintainer, 2026-07-15) — settled; do not relitigate

1. **Remove the `realm` phase.** The lifecycle is **five flat phases, identical
   for scripts and modules**:
   `source → tokens → ast → environment → evaluation`. _Why:_ **a phase must be
   a function of the program.** Every other phase is; the realm is identical for
   every program forever, so a realm lens renders the same thing every settle —
   a reference, not a lens. The contracts already convicted it: `realm` was the
   **only phase with no fact stage**, never barred, and the level spine says _"a
   realm model needs no program at all."_ Realm content lives on as level
   `docs.reference`. **Note:** `lifecycle` therefore stays a **TOTAL** record.
2. **Do NOT add a `link` phase.** Considered and **rejected** — write this down
   so nobody re-adds it. _Why:_ link's data is a **filter of environment**, not
   a new fact (`defs[0].type === 'ImportBinding'` sorts imports from locals in
   the same analysis; the specifier rides the same def). The genuinely
   link-shaped content — _did it resolve? what's the graph? cycles?_ — is
   exactly what embody **cannot see** from one `code: string`. And the record
   maps **`environment` = `Link()` for modules**, so splitting them subdivides
   one spec operation into two peers.
3. **Add a fully entwined `environment` fact stage** — a full-ECMAScript static
   scope structure that **toggles for scripts or modules**.
4. **Levels stop deriving.** The boundary, and write it into the DOCS as a
   structural constraint:

   > **embody states what is TRUE about the program; levels decide what is
   > ALLOWED.**

5. **The facts guiding rule** — also a DOCS constraint, because it is the fence
   against unbounded growth:

   > **Facts save consumers the trouble of complex data-structure traversals for
   > COMMON, GENERIC program analytics. Anything niche, a consumer does itself.
   > Entwinement is free because facts are objects/arrays INDEXING INTO
   > pre-existing entwined objects.**

   A fact must argue **common + generic + a gate needs it**. A `.filter()` over
   an existing fact is a **projection, not a new fact**.

6. **Facts expose the FULL structures — give consumers the option to traverse.**
   Already true and worth preserving explicitly: `facts.ast.value` is the whole
   `Program`; `facts.entwined.value.root` is the whole graph. Facts are
   **pre-indexed entry points into the data, never a wall in front of it** —
   `Entwined`'s own words: _"entry points into the graph, never copies."_
7. **A tree-walking utility lands in top-level `lib/`** for the **niche** case.
   It **complements** facts; it does not replace them (see OPEN-7's rationale
   below — this one is decided, but know why).

## The environment fact — verified feasibility (ran, not assumed; acorn 8.16.0)

**Use `eslint-scope`. NOT `shift-scope`** — Shift is a different AST dialect,
needing either `shift-parser` (**a second parse, violating the ratified "One
parse truth"**) or an ESTree→Shift conversion.

- **It consumes acorn's output directly** — no conversion, no second parse —
  **but ONLY if the parse passes `ranges: true`.** ⚠️ **This is a landmine,
  verified:**

  ```text
  ranges:false -> THREW: Cannot read properties of undefined (reading '0')
  ranges:true  -> OK
  ```

  (`eslint-scope/lib/scope.js:730` does `this.block.body.range[0]`.) **Any
  function scope with an internal reference dies without it.** So **the `ast`
  stage's parse options gain `ranges: true`** — which lands squarely on the
  one-parse-truth chokepoint (§ Coordination). Note it is **`ranges`, NOT
  `locations`** — `ranges:true + locations:false` analyses fine. Do not confuse
  the two; an earlier draft of this brief discussed only `locations` and would
  have shipped the crash.

- On a full-ES program it produces the whole scope tree
  (`global, module, class, function, for, block, catch`), resolves references,
  and correctly hoists `var` out of a `for` block into function scope — _"how
  names are born, and what hoisting really means"_. (Re-run it yourself with
  your own program; a scope count quoted without its source is not a
  measurement.)
- ⚠️ **eslint-scope ships NO TypeScript types** (`types: undefined`, no
  `.d.ts`). `@types/eslint-scope` exists in `node_modules` but is **also phantom
  — dragged in by webpack, not eslint**, at v3.7.7, and it types
  `block: estree.Node`, pulling `@types/estree` + `@types/eslint` behind it. So
  the foreign-vocabulary count is **not two** — it is potentially four, and one
  path drags a **devDependency's** type surface into `src/`. **The runtime
  node-identity claim below is solid; expressing it in TYPES needs an
  acorn↔estree bridge nobody has costed.** Budget for this in the amendment; do
  not discover it at increment 1.
- **It toggles on `sourceType` for free** — verified, identical source:

  ```text
  script  -> global            | top-level vars: v,l
  module  -> global + module   | top-level vars: v,l
  ```

  **This is where the type toggle's pedagogy now lives**: the same code shows a
  different scope structure by type — the lesson `link` would have carried,
  without `link`.

- **"Fully entwined" is nearly free — eslint-scope shares node IDENTITY with
  acorn.** Verified: `scopeIdent === declNode` → **true**. Every binding and
  reference points at _the same objects_ the entwined graph wraps, resolvable
  via `byPath`/`byOffset`. The contract's hardest entwine clause — _"the same
  references as the tree, never copies"_ — holds **by construction**, which is
  exactly ruling 5's "indexing into pre-existing entwined objects".
- **Freezing a `ScopeManager` survives** — `acquire()` still works afterward.
- **`globalScope.through`** states _"these identifiers resolve to nothing"_ as a
  **level-blind fact** — the fact half of ruling 4. Verified: a level's
  undeclared-globals check collapses to a **set-membership test**.
- ⚠️ **`eslint-scope` is a PHANTOM dependency** — in neither `dependencies` nor
  `devDependencies`; it exists only because eslint drags it in. Using it from
  `src/` requires **declaring it as a production browser dependency**.

## OPEN — the maintainer's, not yours

**Bring these to `ar-1` and to the maintainer at your 0.7 gate. Do NOT resolve
one by picking whichever reading lets you proceed.** This section exists because
the last brief in this campaign quietly turned six open questions into
recommendations, and a cold reader caught it.

- **OPEN-1 — do the tokens/ast fact stages belong to embody, or to
  `lib/parse`?** The record: _"P3a — `lib/parse` **builds the tokens/ast fact
  stages**"_ and _"P4 — embody. **Depends: P1 + P2 + P3a**"_; the package README
  lists **"parsing"** under _shared leaf libraries_. But the **committed**
  `embody/DOCS.md` assigns fact-stage derivation to embody's phase 1. **This is
  the maintainer's call and it is not yours to close.** One option is _"a **new
  module ⇒ its own full Phase-0 + gate**, and a scope change you must grant"_ —
  you cannot grant that to yourself. Bring it to ar-1 and to the 0.7 gate with
  your reading. _(An earlier draft said "settle it inside the amendment" — that
  contradicted this section's own header and a cold reader caught it. It is
  struck.)_
- **OPEN-0 — what SHAPE is `Facts.environment.value`?** Raw `ScopeManager`? A
  wrapper? An index? **This is the keystone of the whole amendment and it is not
  ruled.** Ruling 3 says "a full-ECMAScript static scope structure that
  toggles"; ruling 5 fences facts with "common + generic + a gate needs it";
  ruling 6 says facts expose the full structures as **entry points, never a
  wall**. Those constrain it — they do not decide it. Note it interacts with the
  types problem above (eslint-scope ships none) and with OPEN-3 (what gets
  frozen). **Bring a proposal; do not just pick one.**
- **OPEN-2 — does `'environment'` join `FailableStageName`?** Scope analysis
  over a valid AST cannot fail on its own; it fails only by carrying ast's cause
  — the same shape as `entwined`. **The maintainer has ruled this does NOT
  threaten the phase** (`source` is a non-failable stage backing the most-lensed
  phase in the package). The question is only who can **originate** a
  `cause.stage`. Related: **R1** (plan open #6) asks whether `'entwined'`
  belongs there either.
- **OPEN-3 — the freeze seam.** A new `@utils/freeze-in-place-except.ts`, or
  sanction `visited`-seeding in the existing util's JSDoc?
  (`freezeInPlaceExcept` is also the plan's **first** increment, U1.) Extend it
  to the `ScopeManager`: does eslint-scope hold module-global singletons —
  **acorn's `TokenType` does** — that embody must not freeze?
- **OPEN-4 — does the `lib/` rule bind repo-wide on landing, or only new `lib/`
  folders?** _(Only this half is open._ **Light-README-or-none is already RULED:
  light.** _An earlier draft re-opened a settled ruling — writing it and
  escalating it would both have violated an instruction. Do not re-ask it.)_
- **OPEN-5 — the sandbox gate.** The plan proposes the per-increment _"no
  sandbox checkpoint: pure utility"_ skip **plus one 🔍 phase-level gate before
  ar-5**, over programs **the maintainer names** — because green tests on inputs
  _you_ chose are exactly the evidence the green-tests-are-enough failure mode
  produces. **Both need ratifying; only the human skips.**
- **OPEN-6 — how do you draw a five-phase lifecycle?** The root README's chain
  and `embody/DOCS.md`'s `## Data flow` both change. Rule: `<br/>` in **NODE
  labels only, never edge labels**.
- **~~OPEN-7~~ — RULED (maintainer, 2026-07-15): `ParseFacts` is KEPT and
  EXTENDED with entwined facts, NOT replaced. JEJ loses its scope building.**
  Recorded so nobody re-opens it. **Consequence that matters to you: the level
  spine stays a MIRROR, so "no type edge runs from levels into embody" SURVIVES
  intact** — `ParseFacts` will mirror eslint-scope's vocabulary the way it
  already mirrors acorn's, and the caller (orchestrate) assembles it from your
  Facts. **None of that work is yours**; it is the JEJ stream's amendment, in
  its file. ⚠️ **§ Coordination below is written in the superseded "replace"
  reading — read it with this correction.**

## Ripples the amendment must carry (measured, 2026-07-15)

- **`realm` — YOUR scope is 9 mentions across 4 files**: root `README.md` (6) +
  the embody triple (3). ⚠️ **`orchestrate/` has ZERO** despite being the
  obvious suspect. ⚠️ **An earlier draft said "12 across 6" — the extra 3 are
  the `language-levels` files, which are OFF-LIMITS.** An agent working to 12/6
  finds 9/4 and either declares drift or **edits the JEJ stream's files**. JEJ's
  own ~77 are its **realm table**, which **survives**. **Do not touch either.**
- **"six phase(s)"**: **19 references across 7 files** — root
  `README.md`/`DOCS.md`, the embody triple, `orchestrate/README.md`/`DOCS.md`.
  ⚠️ Trap: `README.md:378` says **"Six regions"** — a sanctioned hit, not a
  phase count.
- **🔴 The five→six ripple — and it runs OPPOSITE to the six→five one, in the
  same files.** `FactStageName` gains a sixth member, so three committed
  sentences go false: `embody/types.ts:41` (_"The **five** derivations"_),
  `embody/DOCS.md:17` (_"the **five** stages derive once"_),
  `embody/README.md:57` (_"Each of the **five** Facts"_). **But
  `embody/README.md:55` — \*"**Five** steps, in order"\* — is the BUILD steps
  and must STAY five.** So in that one file: `:55` five stays · `:57` five→six ·
  `:62`/`:146` six→five. **A careless find-and-replace is catastrophic here.**
- **`LifecyclePhaseOrder`**: a 6-tuple → **5**. `types.ts:176` requires the
  runtime order constant to `satisfies` it.
- **`FactStageName`** gains `'environment'`; `Facts` gains the stage; the
  accessibility map loses realm's rule.
- ⚠️ **Vocabulary collision to adjudicate:** the ratified rule _"bare
  **'environment'** is reserved for the lifecycle phase"_ meets ruling 3's
  `environment` **fact stage**. Arguably fine — `source`/`tokens`/`ast` already
  double as phase and stage — but it needs a glossary call, not a silent reuse.
- **A committed sentence goes FALSE**: `embody/DOCS.md` — _"**The parser's types
  are the only foreign vocabulary**"_. With a scope library it is two. **Amend
  it.**
- **`[DECIDED r12]`** — _"a FLAT ordered series of **six** phases"_ is
  **ratified**. Five needs an explicit **ledger entry**, not silent drift.
- **Rulings 4/5/6** belong in `embody/DOCS.md` § Structural constraints, so ar-2
  enforces them instead of the next agent relitigating them.

## Two doc deliverables land FIRST

Each a `docs:` commit with **ar-1 + ar-2** (documentation commits get the full
AR cycle).

- **D — the DEV.md `lib/` rule** (maintainer-authorized). A new category in §
  Directory Documentation Convention: **a `lib/` folder needs only a light
  README — no DOCS, no Phase-0 — though directories nested inside `lib/` still
  owe the full treatment.** It **authorizes your own file layout**: without it,
  DEV.md makes any new directory a new module owing a full Phase-0 + gate, and
  there is **no intermediate tier**. ⚠️ **The rationale needs care.** A draft
  argued _"`lib/` owns no abstraction level"_ — but `embody/DOCS.md:99-100` says
  internal libraries _"document themselves **at their own abstraction level**"_
  and `embody/README.md:21` agrees. **Reconcile; do not contradict.** ar-1 will
  catch it. See OPEN-4.
- **C — the root refusal-as-data amendment** (maintainer-**approved**). Scope
  the root README glossary: the **lens kind** realizes refusal **at the gate**
  (a lens that cannot serve is never offered, so `main` has no refusal arm); the
  **evaluator kind** returns a structured refusal. Today the root asserts the
  evaluator mechanism for all kinds — false for lenses.

## Coordination — you DO intersect the JEJ stream now

Earlier guidance said the streams do not intersect. **That is now wrong, and the
JEJ agent has been told.** Ruling 4 requires levels to **receive** facts rather
than derive them — which means:

- **RULED 2026-07-15: `ParseFacts` is KEPT and EXTENDED with entwined facts; JEJ
  loses its scope building.** **So NO type edge appears** — the level spine
  stays a **mirror** (it will mirror eslint-scope's vocabulary as it already
  mirrors acorn's), and **"no type edge runs from levels into embody" survives
  intact.** The caller (orchestrate) assembles `ParseFacts` from your Facts, as
  it already does. _(An earlier draft argued the mirror should die and a type
  edge appear. The maintainer ruled the conservative way. Do not re-litigate
  it.)_
- **Whatever a level receives, it is NOT `Embodiment`** — deliberate.
  `Embodiment = {facts, lifecycle}`, and handing a level the lifecycle hands it
  the **attached lens roster**, which is exactly what _"levels never ship
  lenses"_ and _"no kernel→lens channel — YAGNI"_ prevent.
- **That amendment is the JEJ stream's work, entirely in its files.** Measured:
  **11 `ParseFacts` occurrences across 5 files — 5 of 5 are theirs, ZERO are
  yours.** (An earlier draft said "4 of 5 occurrences", implying a touchpoint in
  your files. **There is none to find.**) **Yours must land, or at least be
  specified, first** — the spine consumes your facts.
- **Consequence for them, already flagged:** ~half of the JEJ validator port
  evaporates (`build-scope.ts` 401+87 **dies**; `check-undeclared-globals.ts`
  475 **mostly dies**; `validate-program.ts` 123 **dies**; the walk in
  `collect-violations.ts` likely dies; `just-enough-js.ts` 599 **survives — it
  IS the level**).

**Route this through the maintainer. Do not negotiate with the other agent
directly.**

## Verified findings for Phase-1 (do not re-derive; DO re-verify what you lean on)

1. **acorn's `tokenizer()` honours `onComment`** → the committed
   `Tokens = {tokens, comments}` is implementable as written. **The quarry's
   `runAcorn` puts `onComment` on `parse`** — copied as-is it silently breaks
   the contract whenever tokenize succeeds and parse fails. _The archetypal
   verify-what-you-copy catch._
2. **The two-stage split is real** — `tokenize('const')` succeeds while
   `parse('const')` fails. That is why `runAcorn`'s shape survives.
3. **`StageCause` needs no fabricated span** — acorn errors carry `.pos` (→
   `offset`) and `.loc` (→ `position`), **without `locations: true`**. ⚠️ **Do
   NOT drop `locations` without checking the JEJ stream** —
   `just-enough-js.ts:456` does `const loc = node.loc!`, and under
   one-parse-truth your `ast` stage **is** the parse a level's validate
   consumes. The JEJ stream has moved its `SourceRange` to character offsets,
   which may dissolve this — **verify, do not assume.** An earlier draft called
   this "additively restorable" and a cold reader flagged it as a silent
   cross-stream break.
4. **Entwine is implementable** — the contract's own example path
   `$.body.0.declarations.0.init` resolves; children are discoverable
   **generically** (own properties that are `{type:string}` objects, or arrays
   thereof — no visitor keys) and the property key **is** the path segment;
   `Program` spans `[0, source.length)`, so `byOffset` can promise "never a
   hole".
5. **THE CRUX — freeze-what-you-own has TWO foreign-ref sites.** `freezeInPlace`
   and `deepFreezeInPlace` are **logic-identical duplicate walks** (not
   byte-identical — they differ by JSDoc, name, and a trailing comma; an earlier
   draft overclaimed and a verifier caught it). A naive
   `freezeInPlace(embodiment)` returns `Object.isFrozen(lensModule) === true`
   and recurses into the caller's module — **a live contract violation**.
   `cloneAndFreeze` is **forbidden**: cloning destroys the reference identity
   `orchestrate/DOCS.md` depends on. **The second site:**
   `facts.tokens.value.tokens[i].type` is **acorn's process-global `TokenType`
   table** — the same object across independent runs; freezing it is a
   process-global side effect from a factory whose DOCS says _"sync and pure
   throughout, no shared mutable state."_ This also **kills the piecewise
   option**: a `Token` mixes owned scalars with a foreign ref. **Seeding the
   walk's `visited` set is verified to work.** The seam is OPEN-3. **Freeze
   depth (settled):** ownership here means **sole reference, not authorship** —
   acorn allocates a fresh tree per call and forgets it, so embody is its sole
   owner. **Freeze everything the derivation allocated; stop at process-global
   singletons it did not.**

## Gates — the repo-wide triple CANNOT go green

Measured at `0fca239` — **re-measure at your baseline**: `npm run typecheck` →
**77 errors, 100% inside the two quarry trees** (76 deprecated-architecture + 1
`src/lib/embody/index.ts`; **0 live, 0 greenfield**). `npm run lint` → **~720
errors** (~636 quarry + ~84 live). `npm test` → **41 tests / 7 files fail — and
all 41 are in ONE live file**
(`src/plugins/study-lenses/tests/remark-study-lenses.test.ts`); the quarry files
fail at _collection_ and contribute zero test failures. **The greenfield itself
is clean.**

**Use a disclosed baseline-delta gate:** freeze the exact counts in your plan
file at approval; at each step 13 re-run all three, **paste real output**,
assert the **set difference** — zero new errors, zero newly-failing tests, zero
of anything in your paths. Positive coverage per-file (`npx eslint` ·
`markdownlint-cli2` · `cspell` · `prettier --check`). **Disclose every time**
that the literal command did not go green. **Never write "quality checks
pass."**

⚠️ **The scoped test command has two holes:**
`npx vitest run --project unit src/lib/study-lenses/embody/` **exits 1 with "No
test files found"** until your first test exists, and it **cannot cover U1** —
`freezeInPlaceExcept` lives in `src/lib/utils/`. Widen it.
(`src/lib/utils/tests/freeze.test.ts` carries ~30 live lint errors at baseline —
the largest live offender is the test file for the family you are extending.)

**Maintainer item (propose, do not do):** extending `tsconfig.json`'s existing
quarry `exclude` over the whole quarry + the dangling `src/lib/embody/index.ts`
would make typecheck **green** and restore step 13 as a real gate.

## Environment gotchas (each has cost a session an hour)

- Node 20.11 is default; the repo needs **22.11**. Prepend
  `export PATH="$HOME/.nvm/versions/node/v22.11.0/bin:$PATH"` **per Bash call**;
  **`cd` into the repo in EVERY compound command**. **`timeout` does not
  exist.**
- **`eslint --fix` is FORBIDDEN repo-wide.**
- Lint bars: `interface` (use `type`) · `*Props` (use `*Properties`) ·
  **`switch`** · `.ts` import extensions (use `.js`).
- **`lint:js` never lints `.md`** — use `markdownlint-cli2`. `npx eslint .`
  shows phantom parser errors on README code fences; not a real gate.
  **`npm run lint` short-circuits at `lint:js`**, so markdown/spelling gates
  never run at baseline — your per-file checks are **load-bearing**.
- cspell: inline `// cspell:ignore …` **in your own files** — never edit
  `cspell.json` in a ceremony commit. `npx prettier --write` **before** final
  review (the hook is prettier-only); **re-read rewrapped lines**.
- **Count tests by RUNNING them, never grepping `it(`** — `it()` inside `for`
  loops generates cases a grep cannot see (this bit a sibling brief: 245 vs a
  real 286).
- **The banned-term list — inlined here, because the only canonical copy lives
  in a file this brief tells you to ignore**
  (`study-lenses-phase0-2-keystone-contracts.md:144`; an earlier draft mandated
  the gate and left the list unreachable):

  ```text
  kernel · station · applicableTo · isJeJ · admission gate · plugin · picker ·
  dial · run button · creation-as-phase
  ```

  ⚠️ **`station` is banned — and this brief tells you to transfer
  `stationsOf`.** Rename it (`phasesOf`) when you take it; do not carry the name
  in. Greps need **word boundaries** (`dial` matches _dialog_), **full output,
  never truncated**, and **review each match** — sanctioned negations exist
  ("never a plugin", "no top-level Run button"). Grep `isJeJ`
  **case-insensitively**: the quarry's identifier is `isJej`. _(That keystone
  file is stale on ground truth but its § Vocabulary rules are binding policy —
  ignore its facts, honour its vocabulary.)_

- **Naming trap:** stale eslint ignore-globs cover
  `embody/lib/evaluating/{intercept,run,shared,trace/*}/**`,
  `embody/lib/parse-old/**`, `embody/.legacy/**`. With a flat `lib/`, only
  **`parse-old/`** can bite.
- `exactOptionalPropertyTypes: true` + a verified `pos === 0` tokenize error
  make the idiomatic `...(pos && { offset: pos })` a **live bug** — it drops
  offset 0.

## Quarry — read-only, and mind the three `embody`s

> ⚠️ 1. `src/lib/embody/` — **the quarry** (canonical old tree). 2.
> `src/lib/study-lenses/embody/` — **what you build.** 3. "the embody stream" —
> you. **Never `grep -r embody` and trust it.**

`study-lenses--deprecated-architecture/embody/` is a **broken 16-file orphan** —
ignore it. **Be honest: embody is a greenfield write against a good spec, not a
port.** Of `src/lib/embody/index.ts`'s 1202 lines, ~700 are a canned-scenario
system that dies; ~120 of its 174 tests test those fixtures.
`facts→accessibility→gate→attach→freeze` has **no working ancestor**.
Transferable: **~60 lines** — `runAcorn` (`index.ts:964-987`),
`extractAcornError` (`:995-1016`), `stationsOf`
(`src/lib/study-lenses--deprecated-architecture/orchestrate/derive-station-roster.ts:88-92`),
and the _shape_ of `derive-station-status.ts`. `src/lib/embody/lib/ast/` is
types+docs only **and superseded** — not authority.

**Maintainer's posture (verbatim):** _"look there for the comparable codebase
and either copy→modify it to match the new specs, or (if it already works as-is)
copy it and **carefully verify** that it does in fact meet the new
requirements."_ The verification instrument is **your ZOMBIES suite, written
from the committed contract** — never from the quarry.

**Known gap:** invariant 9 is **not satisfied** for
`src/lib/embody/tests/embody.test.ts` (951 lines). Only pointed-at sections were
read — which is how the ~20 line-offset tests were found **not** to transfer
(`Facts.source` is a bare `StageSuccess<string>`; there is no `offsets` field).
**Read it end-to-end and produce the real transfer list before writing tests.**

## Git policy

Commits **directly to `main`**, **path-scoped**. **Never push, amend, rebase,
reset, `git add <dir>`, or a bare `git commit`.** The tree is shared and a JEJ
agent is live: **distinguish foreign churn by FILE, never by path prefix** — the
prefix heuristic fails exactly where it matters. Recipe:
`git add -- <exact paths>` → `git commit -m "…" -- <same exact paths>` →
**`git show --stat HEAD` to verify only your paths landed.** Announce every
commit (full SHA + message). On anything unexpected: **STOP**. `--no-verify` is
permitted for pre-existing hook debt. **10 commits are unpushed; pushing is the
maintainer's.**

## Before you hand off to the next agent

Invariant 11: spawn a **context-free** agent, give it your RESUMPTION POINT +
launch prompt, and have it report where it would stumble. Apply must-fix
findings **before** the handoff is final. **This step is routinely skipped —
writing the handoff feels like finishing.** In this campaign it caught a
data-loss hazard and a silent cross-stream break. **Do not skip it.**
