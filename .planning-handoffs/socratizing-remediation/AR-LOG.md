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
  does not. The mandated pathspec form is **exonerated**: sixty consecutive
  commits and 179 files under it carry zero drift. Sixty-eight of the 86
  currently-drifted tracked files trace to one 962-file bulk rename. The
  maintainer performs the sweep; the agent adds the detection.

- **R-10 — the eval easter-egg claim is removed.** ["remove the eval"] Six
  easter-egg analyzers are registered and none is `eval`
  (`[read: analyzers/easter-egg.ts]`). Removing the sentence leaves a dangling
  "most"; the quantifier goes too, rather than naming a replacement exception —
  zero new claims, no registry-sync obligation. The claim itself is not lost
  from the repo: `language-levels/jej/notional-machine.md` carries it where it
  belongs.

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

- **R-13 — no shared statement-kinds module.** The duplicated condition set
  (`{IfStatement, WhileStatement, DoWhileStatement, ForStatement}`) stays
  duplicated with reciprocal cross-reference comments. Reasons: the set is
  closed by the ECMAScript grammar, so drift risk is structurally zero; the two
  shapes do not unify (a `ReadonlySet` and a labelled `Record`); the module's
  established pattern is the cross-reference comment; and a new file is an
  inter-file trigger plus a README-tree edit.

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

## Open — NOT authorized

- **O-1 — the `{IfStatement, WhileStatement}` narrowed sets.** `consistency.ts`
  and `comprehension-control-flow.ts` both narrow to that pair with no recorded
  rationale. Under R-12's engine-blind ruling these look like the same defect
  one level down — a `do...while (x)` and a `for (;x;)` each carry a `.test`
  worth comparing and describing. Deliberately **not** folded into R-12's
  increment: it is a behavior change in two more analyzers needing its own red
  tests. No evidence was found either way for the narrowing being deliberate,
  and none was asserted.

- **O-2 — the Wave-2 `lib/scoping` contract Phase 0** remains at its human gate,
  untouched by this campaign.

- **O-3 — governance-surface reach is inconsistent.** `.claude/README.md`
  declares the whole directory governance surface, but the enumeration in
  `AGENTS.md` and `AGENTS.principal.md` omits `.claude/hooks/**`. The two texts
  disagree about their own reach. Raised, not fixed.
