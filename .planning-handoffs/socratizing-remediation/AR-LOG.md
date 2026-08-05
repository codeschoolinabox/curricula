<!-- TRANSITIONAL — delete when the socratizing remediation campaign completes. -->
<!-- cspell:ignore socratizing -->

# socratizing remediation — ruling log

Human rulings and AR resolutions for the campaign that remediates the
`lib/socratizing` and `lib/scoping` port: laundered bugs, drift introduced by
the port's own fix commits, and false claims in the modules' documentation.

Plan of record: `~/.claude/plans/mellow-forging-badger.md`. Recorded here
because a ruling that lives only in a plan file does not exist — `git grep`
cannot see it (DEV.md § Ruling provenance).

Wave 1 landed seven commits, `5b02e08b` through `ecd3a138`, and its exit AR-5
returned PAUSE. The rulings below close that PAUSE.

## Human rulings — 2026-07-30 (Wave 1, in flight)

- **R-1 — a PINNED marker cites what a reader can grep today.** The first draft
  of the entwined pin justified itself with `bindingByOffset`, an identifier
  that exists only in the plan of record
  (`[measured: git grep -c bindingByOffset -- src/]` → one hit, the marker
  itself). Re-anchored on two facts checkable in the tree: this entry's
  two-stage refusal arm, and `deriveScopeUsage` taking the environment alone.
  Landed `aca633ca`. The pinned-guard hook blocked the edit three times and was
  correct each time — its first live fires.

- **R-2 — the entwined pin's stated mechanism was wrong; the test was not.**
  AR-2 showed `derive-environment` short-circuits on a failed `entwined`
  (`[read: src/lib/study-lenses/embody/derive-environment.ts]`), so
  `environment.ok` implies `entwined.ok` and a failed `entwined` is unreachable
  past the entry's two guards. Reading the binding would add a narrow whose
  failure branch is dead at runtime, **not** a third refusal stage. Corrected
  under fresh sign-off at `1496b26d`. The test stands: what it locks is that the
  entry has no `entwined` dependency at all.

- **R-3 — a rule amendment ships as its own commit.** Increment 1.10's "Example
  questions column is illustrative" paragraph was split out of the seven-item
  docs batch into `0dd89d8b`, because an amendment buried in a batch is
  invisible to `git log --oneline`, which is where the next wave looks.

- **R-4 — `fb680966` keeps its foreign 0-byte rename.** Swept in from a peer's
  staged index before the pathspec discipline was adopted. Do not revert, reset,
  or amend.

## Human rulings — 2026-08-04 (closing AR-5's PAUSE)

- **R-5 — the ~20 README-vs-code question-text divergences are not defects, and
  the carve-out needs no abstract ruling.** In the divergences the code says
  MORE than the table, so conforming would delete meaning from learner-facing
  questions. Asked whether the composite `string-construction` case needed a
  sixth-divergence-class ruling, the maintainer's answer was **"so?"** — the
  carve-out landed in `0dd89d8b` already covers it. Resolution: do not rule
  abstractly; fix the cells that are _wrong_ rather than merely abbreviated, and
  the question dissolves.

- **R-6 — `derive-scope-usage.ts`'s own docs get fixed.** ["so fix this"] Two
  JSDoc blocks describe a five-field `VariableUsage`; the type has six
  (`[read: src/lib/study-lenses/lib/scoping/types.ts]`). `fc1fd46a` created the
  defect — it added `exported` and updated five other sites while leaving these.

- **R-7 — the campaign's rulings are recorded in-repo.** ["so what do you
  recommend?" → this file.]

- **R-8 — the missing sourced-claims tags are forward-only.** ["ok"] Thirteen
  Wave-1 commit bodies predate the tag rule and cannot be corrected, since amend
  is forbidden. Every commit from this point carries them.

- **R-9 — fix the automation, not the history.** ["can you fix the automation
  scripts so this doesn't happen? I can do a sweep later"] Root cause
  established, not assumed: **`git commit --no-verify`**, which
  `AGENTS.principal.md § Git Policy` sanctions. Isolated by three same-day
  commits over the same five files — with the flag, drift lands; without it, it
  does not. The mandated pathspec form is **exonerated**
  `[measured: per-commit blob-vs-prettier comparison over the last 160 commits, 2026-08-04]`:
  sixty consecutive commits and 179 files under it carry zero drift. Most of the
  standing drift traces to one 962-file bulk rename, which a rename carries
  forward untouched. The maintainer performs the sweep; the agent adds the
  detection.

  **Do not quote a drift count from this entry** — it moves with every peer
  commit. It was 86 when the ruling was made and **95** three days later
  `[measured: git ls-files -z | xargs -0 npx prettier --list-different, 2026-08-05]`.
  Re-measure with that command.

- **R-10 — the eval easter-egg claim is removed.** ["remove the eval"] Six
  easter-egg analyzers are registered and none is `eval`
  (`[read: analyzers/easter-egg.ts]`). Removing the sentence leaves a dangling
  "most"; the quantifier goes too, rather than naming a replacement exception —
  zero new claims, no registry-sync obligation.

  ⚠️ **Corrected during cluster A's AR-5.** This ruling first ended "The claim
  itself is not lost from the repo: `language-levels/jej/notional-machine.md`
  carries it where it belongs." That overstates by one step. The file carries
  **eval-is-an-easter-egg** (`ƒ eval` — an easter egg: admitted but untaught).
  It does **not** carry the voice-versus-hazard reading that was actually
  deleted; `[measured: grep -rn "creative voice" src/]` hits only the frozen
  deprecated tree. So it is a deletion, not a relocation.

- **R-11 — console.log is for the developer, period.** ["the line in the docs is
  stupid. in our ontology console.log is for the dev, period"] The sentence
  quoted in `socratizing/README.md` and `socratizing/DOCS.md` — _"Does this log
  communicate something to the **user**, or is it for **developers**
  debugging?"_ — poses a dichotomy the ontology rejects, and no analyzer emits
  it. The shipped `console-log-audience` analyzer is already ontologically
  correct: its context says console output is visible to developers but not
  typical users, and its comparative question contrasts with `alert()`, which
  _is_ for users. Resolution: replace the invented quotation with the shipped
  one. **No new analyzer** — an earlier agent report claiming "there is no
  console.log analyzer at all" was false.

- **R-12 — the engine-blind policy wins; widen both sides.** ["Widen both,
  engine-blind policy wins"] `trap.ts` states the policy in words — the engine
  analyzes whatever parsed, not only what the JeJ level admits — while
  `types.ts`'s `Feature` doc scoped `controlFlow` to "if/else, while, for-of,
  ternary" and `comprehension-generic` faithfully mirrored it. So
  `program-paths` did not fire on a program whose only branching is a `for`
  loop, though `constant-condition` already tags `for` as `controlFlow`. Both
  the type doc and the analyzer widen to include `do...while`, `for` and
  `for...in`. Fixing the analyzer alone was rejected: it would re-create the
  doc-versus-code divergence this campaign exists to remove.

  ⚠️ **Narrowed during cluster A's AR-5.** The policy-conflict framing covers
  **`for...in` only**. JeJ's allowlist is default-deny and it **admits**
  `DoWhileStatement` and `ForStatement`, each with a check
  `[read: language-levels/jej/just-enough-js.ts]`; `ForInStatement` appears
  nowhere in the level. So for `do...while` and `for` the old doc line was
  narrower than JeJ's **own** allowlist — a plain omission needing no policy
  argument, and the allowlist is the cheaper, harder citation. The outcome is
  unchanged; only the recorded reason narrows.

- **R-13 — no shared statement-kinds module.** The duplicated condition set
  (`{IfStatement, WhileStatement, DoWhileStatement, ForStatement}`) stays
  duplicated with reciprocal cross-reference comments. Reasons: the two shapes
  do not unify (a `ReadonlySet` and a labelled `Record`); the module's
  established pattern is the cross-reference comment; and a new file is an
  inter-file trigger plus a README-tree edit.

  ⚠️ **Corrected during A4.** This ruling first gave a fourth reason — "the set
  is closed by the ECMAScript grammar, so drift risk is structurally zero" — and
  AR-2 refuted it. The grammar caps how many statement forms can carry a
  `.test`; it does not bind two independently declared sets to equal membership.
  Membership is an editorial choice, and this module already holds two
  _narrower_ sets of the same concept — `consistency.ts` and
  `comprehension-control-flow.ts`, which is O-1. The ruling asserted the
  impossibility of a divergence that had already happened twice in the same
  directory. The outcome stands on its other three reasons; only that one is
  struck.

- **R-14 — `README.md`'s invented "strategies" quotation is replaced.** Same
  defect class as R-11 one sentence over: nothing ships the quoted string.

- **R-15 — `constant-condition`'s open question drops its article.** The
  template read "when a `${statementType}` condition can never change?" and
  `CONDITION_LABELS` maps `IfStatement` to `if`, so an `if` emitted the
  learner-facing "when **a if** condition". The other three labels are
  consonant-initial, which is why it survived. Reworded to "when the condition
  in this `${statementType}` can never change?" — the article-free phrasing
  already shipping in the same call's `context`. An `articleFor()` helper and an
  article column in the label table were both rejected: each leaves a per-label
  obligation, and removing the article retires the class. AR-3 required the pin
  to cover all four labels rather than two, because a two-branch hardcode would
  otherwise pass while leaving `do...while` and `for` unfixed.

## Human rulings — 2026-08-05 (cluster B, the oracle measures prettier drift)

Cluster B executes R-9's mandate ("the agent adds the detection"). B0 is the
Phase-0 amendment: the `scripts/` README/DOCS/types describe the measurement
before any code implements it, then stop at the human gate. Plan of record:
`~/.claude/plans/mellow-forging-badger.md` § Cluster B.

- **R-16 — B0's twin-doc is `machine`, and
  `scripts/DOCS.md § Measured-facts oracle` is itself the machine-twin
  document.** ["machine — DOCS is the twin"] No `## Epistemology` block is owed
  — DEV.md discharges that only at `twin-doc: none`; at any other value the step
  produces the twin document itself `[read: DEV.md § Phase 0 step 0.2]`. This
  corrects the plan of record's premise that DEV.md scopes 0.1–0.3 to new
  modules: the obligation keys to the twin-doc value, not module age.
  Retro-application context:
  `[measured: grep -rl "## Epistemology" src/ scripts/ → empty, 2026-08-05]` —
  no existing region has retro-added the block.
- **R-17 — B0 carries no test artifact.** ["Docs amendment — no tests in B0"] A
  `docs:` amendment under the jej-registration R-4 precedent (AR-1 on README
  content, AR-2 on DOCS content); a declared deviation from DEV.md § Phase 0
  step 0.3's "tests committed skipped". B1–B4 proceed live-red exactly as the
  approved plan specifies.
- **R-18 — the producing command is `npm run format:check`, and the count is
  that command's scope.** ["npm run format:check"] R-9's re-measure command
  (`git ls-files -z | xargs -0 npx prettier --list-different`) enumerates a
  DIFFERENT set — tracked files of any prettier-parseable extension, vs the npm
  script's glob minus prettier's default ignore path. Measured minutes apart on
  the same tree: 4 files (format:check) vs 9 (ls-files)
  `[relayed: plan-mode adversarial reviewer, 2026-08-05]`. Neither is "the"
  number; never file the two counts against each other as a defect.
- **R-19 — the cache never persists a failure value, uniformly.** ["Never cache
  failures, both"] Resolves an ar-1 PAUSE item: a peer's mid-edit unparsable
  file → prettier exit 2 → no drift summary; caching that failure would pin a
  false alarm for a full cache window. The rule covers markdownlint too —
  today's shipped path persists failure values unconditionally
  `[read: scripts/repo-facts.mjs § measureMarkdownlint — writeCache is called on the no-summary value]`;
  the behavior change lands with B2/B3's rework. Migration transient for the
  implementer: a well-formed legacy cache already holding a failure record is
  neither torn nor unparsable and will be served as fresh for up to one window —
  self-healing, no migration step (ar-2 concern 7b).
- **R-20 — the cache key is `prettier`, and keys follow the producing-tool
  convention.** ["prettier"] Deviates from the approved plan's `formatDrift`.
  Matches the existing `markdownlint` key; the convention is now stated in the
  README cache gloss so a third slow measurement has a rule to follow. Unknown
  keys survive every merge, so an abandoned key is permanent — rename only with
  a pruning plan.
- **R-21 — the emission label is `prettier drift (npm run format:check)`.**
  ["prettier drift (npm run format:check)"] The label carries its own scope, per
  R-18. The shipped `markdownlint errors (repo-wide)` label predates the rule
  and is grandfathered; correcting it is not authorized here.
- **R-22 — the cold cost is accepted as measured.** ["Accept as measured"] Three
  consecutive `npm run format:check` runs took 17s / 11s / 12s
  `[relayed: ar-1's wall-clock measurements, 2026-08-05]` — inside eslint's
  16–19s exclusion band, paid once per cache window rather than every run. DOCS
  now states the discriminator: the cache, not raw cost.

**Reviews fired on B0.** `ar-1` → **PAUSE**: 12 concerns; the four human items
became R-19–R-22, and the author-side items were applied — the recognition
contract enumerated and version-pinned, the scope sentence corrected (the npm
script's glob, prettier's default ignore path, not git's), the producing command
named in the twin, persist and merge ownership split, the label pinned, the
cache-in-glob coupling stated. `ar-2` → **CONSIDER**: 7 concerns, all resolved
in-text — containment semantics added to the recognition contract (shapes match
by sentence-within-output; `[warn]` prefix, per-file lines, and the npm banner
are ambient); **Persist** named as its own phase so Condense stays pure and the
Mermaid's cache-write edge has a home; the merge edge gained its success filter;
"fresh" and the key convention defined; the contract references anchored as
prettier-drift-specific; the residual concurrent-write window stated with its
accepted residue.

**Notes for B1's session** (recorded, not B0 obligations): test fixtures must
come from `node_modules/.bin/prettier` — a bare `npx prettier` outside the repo
resolved to a global 3.4.2 whose exit-2 shape differs (ar-1); include at least
one captured REAL concatenated output (`[warn]`-prefixed, npm banner included)
alongside the minimal row shapes (ar-2); counting `[warn]` lines with the
summary as cross-check is a recognized implementation option satisfying the same
contract (ar-1 counter-proposal B).

## Work routing and ceremony — cluster A, recorded here rather than amended

`DEV.md § Work routing and ceremony` requires the classification line in **the
commit body, and for a campaign its AR-LOG** — two co-equal homes, both
`git grep`-able. That section became canonical **mid-cluster-A** (`e91bcaf9`),
so cluster A's own bodies predate it and none carries the line.

The human authorized an amend. **It was declined, and this record is the
substitute.** My six commits are not contiguous and not at the tip: **38 peer
commits sit between the first and the last**, three more landed after, and 274
commits are unpushed. Amending would mean rebasing 44 commits and rewriting the
SHAs of 38 belonging to roughly five concurrent sessions on a shared worktree —
several of which cite SHAs in their own ledgers, and every citation would break.
The rule's stated purpose is that the record be greppable and immutable; this
file satisfies it without rewriting a peer's history.

`work:` is derived from the path — `src/` and unnamed paths are **software
work**. `retrospective` is blocked by DEV.md, so all are `prospective`.
**`ceremony:` is the human's to set; what follows is what actually fired**, as
observed fact.

| commit        | line                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------- |
| `9a9f6c48` A0 | `work: software · twin-doc: none · ceremony: none fired · prospective`                   |
| `47c323e2` A1 | `work: software · twin-doc: machine · ceremony: AR-1 · AR-2 fired · prospective`         |
| `0d6d3100` A2 | `work: software · twin-doc: user · ceremony: AR-3 · AR-4 fired · prospective`            |
| `5fdb2c39` A3 | `work: software · twin-doc: machine · ceremony: AR-3 · AR-4 fired · prospective`         |
| `df2c0dee` A4 | `work: software · twin-doc: user · ceremony: AR-1 · AR-2 fired · prospective`            |
| `3918ca9c`    | `work: software · twin-doc: none · ceremony: AR-5 fired · prospective`                   |
| `122284ab`    | `work: software · twin-doc: none · ceremony: none fired (an AR-5 finding) · prospective` |

Across the cluster the reviews that fired were AR-1 ×2, AR-2 ×2, AR-3 ×2, AR-4
×2, AR-5 ×1 — **`ceremony: full` at cluster granularity**.

Two honest notes. `twin-doc` names which reader is owed a written account and
**never asserts the author holds that twin** — the `user` entries mark
learner-facing question text, the `machine` entries mark contracts a consumer
codes against. And DEV.md flags that **`full` is not yet defined for work with
no code**: A0, A4 and `3918ca9c` are documentation-only, so their AR-3/AR-4
slots have no object rather than being skipped.

## Work routing and ceremony — cluster B, keyed by increment

Cluster B starts after `DEV.md § Work routing and ceremony` became canonical
(`e91bcaf9`, mid-cluster-A — see the section above), so every cluster-B commit
carries the classification line in its own body; this table is the AR-LOG's
co-equal copy of the same lines. It is keyed by increment rather than SHA
because each row is written inside the commit it describes, before that commit's
SHA exists.

`work:` is derived from the path — `scripts/` is software work by DEV.md's path
table, and `.planning-handoffs/` is unnamed, which the same table routes to
software work. `retrospective` is blocked by DEV.md, so all rows are
`prospective`. **`ceremony:` is the human's to set; each row records what
actually fired**, as observed fact — the same honest-notes form as cluster A's
table, and per DEV.md's own gap note, a no-code increment names its real gate
set rather than a level word.

| increment | line                                                                             |
| --------- | -------------------------------------------------------------------------------- |
| B0        | `work: software · twin-doc: machine · ceremony: AR-1 · AR-2 fired · prospective` |

## Open — NOT authorized

- **O-1 — the `{IfStatement, WhileStatement}` narrowed sets.** `consistency.ts`
  and `comprehension-control-flow.ts` both narrow to that pair with no recorded
  rationale. Under R-12's engine-blind ruling these look like the same defect
  one level down — a `do...while (x)` and a `for (;x;)` each carry a `.test`
  worth comparing and describing. Deliberately **not** folded into R-12's
  increment: it is a behavior change in two more analyzers needing its own red
  tests.

  ⚠️ **Corrected during cluster A's AR-5.** This item first said "No evidence
  was found either way for the narrowing being deliberate, and none was
  asserted." That is a universal negative asserted without a search, and it is
  false: `socratizing/DOCS.md` § Prior art integration records **Dropped: …
  switch/case, do-while, for-in** against **Kept: … if/while/for-of questions**,
  and every gate in `comprehension-control-flow.ts` sits inside that Kept set.
  So the narrowing **is** a documented JeJ port decision. The real open question
  is different and better: does R-12's engine-blind policy supersede that port
  decision? Whoever executes this must answer that rather than treat the
  narrowing as an oversight.

  **Evidence:** `[read: socratizing/DOCS.md § Prior art integration]`. **Scope
  correction:** `comprehension-control-flow.ts` holds two _further_ narrowed
  sets beyond the `{If, While}` pair — `{While, ForOf}` and
  `{If, While, ForOf}`. A fix that stops at the pair closes part of the gap.

- **O-4 — `switch` and `try` fork execution and are absent from the branching
  set.** Raised by AR-4 on A3. Both create multiple paths in exactly the sense
  `program-paths`' own context string means. They were **not** folded into R-12
  because R-12's evidence was specific to `for` / `do...while` / `for...in`:
  each of those is already tagged `controlFlow` by a sibling analyzer, so the
  widening had in-module precedent to lean on. `switch` and `try` have none — no
  analyzer tags either as control flow, and `voice-profile` counts them only
  toward a generic statement tally. Widening to them would be the same
  unauthorized reach that O-1 was correctly held back from. The code comment in
  `comprehension-generic.ts` names them as an open question rather than implying
  a settled exclusion.

  ⚠️ **Qualified during cluster A's AR-5.** "Open question" understates what the
  tree records. JeJ's default-deny allowlist admits **neither**
  `SwitchStatement` nor `TryStatement`
  `[read: language-levels/jej/just-enough-js.ts]`, and `socratizing/DOCS.md` §
  Prior art integration lists **switch/case** among the dropped question
  templates. Both point the same way. Widening would still be a behavior change
  needing red tests, so this stays unauthorized — but the exclusion is
  better-evidenced than "open" suggests.

- **O-5 — the `controlFlow` feature tag is wider than its doc line, still.**
  Also from AR-4 on A3. `easter-egg.ts`'s `labeled-statement` tags
  `feature: 'controlFlow'` for a `LabeledStatement`, and the `Feature` doc has
  never mentioned labels — before or after R-12. So A3's "the doc now matches
  the code" holds relative to `programPaths`' set, **not** relative to every use
  of the `controlFlow` tag across the module. Pre-existing; not created by A3.

  ⚠️ **Completed during cluster A's AR-5.** This item first named only
  `LabeledStatement`, which would have closed half the gap. `easter-egg.ts` also
  ships `with-statement` tagged `feature: 'controlFlow'`, and `WithStatement` is
  likewise absent from the doc line — and from JeJ's allowlist entirely. State
  the gap as: **the tag's live extension = the doc line ∪ {`LabeledStatement`,
  `WithStatement`}.** **Evidence:**
  `[measured: grep -rn "feature: 'controlFlow'" analyzers/]` → 18 sites across 6
  files; the two easter-egg ones are the only members outside the widened doc
  line.

- **O-6 — `assignment-in-condition` cannot see two `.test` sites that exist.**
  Raised independently by AR-1 and AR-2 on A4, and measured: acorn puts `.test`
  on six node types, and the analyzer covers the four that are _statements_.
  `case (y = 1):` and `(x = 1) ? a : b` both hide an assignment in a `.test` and
  neither is reached. Excluding them is a scope choice, which the code comment
  now says out loud instead of implying the grammar decided it. Widening is a
  behavior change needing red tests — the same class as O-1, and not authorized.

- **O-7 — `userInteraction` groups `console.log` with prompt/alert/confirm,
  while R-11 puts its audience with developers.** Raised by both reviewers on
  A4. `types.ts`'s `Feature` doc enumerates `console.log` among the
  user-interaction constructs, and `voice.ts` tags `console-log-audience` with
  that feature, so the grouping is load-bearing for the `features` filter — it
  is a _feature bucket_, not an audience claim. A4's header note says both
  things explicitly so the next reader does not "fix" the type doc by striking
  `console.log`, which would leave the tag and the filter disagreeing. Whether
  the feature should be renamed, its gloss widened, or the split simply
  documented is a contract decision. **Do not edit `types.ts` on R-11's
  strength** — R-11 ruled on audience, not on bucketing.

- **O-2 — the Wave-2 `lib/scoping` contract Phase 0** remains at its human gate,
  untouched by this campaign.

- **O-3 — governance-surface reach is inconsistent.** `.claude/README.md`
  declares the whole directory governance surface, but the enumeration in
  `AGENTS.md` and `AGENTS.principal.md` omits `.claude/hooks/**`. The two texts
  disagree about their own reach. Raised, not fixed.
