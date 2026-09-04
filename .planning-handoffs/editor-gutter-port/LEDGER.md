<!-- TRANSITIONAL — the editor/gutter port's loss ledger. Row ids are `edt-NNN`,
stable forever, cited by every worker brief and every commit body. Retires with
SPEC.md. -->

# Editor/gutter port — LOSS LEDGER

Scope, dispositions, census and the four supersede quotations: `./SPEC.md`.
Columns and disposition vocabulary cut from the ratified code parent
`.planning-handoffs/evaluators-api-restoration/LOSS-LEDGER.md` (human ruling
2026-08-06); three-pass discipline and the list-never-a-count rule from
`lens-migration/FIDELITY-METHOD.md`.

## Pass banner

**PASS 1 — SEEDED, 2026-09-03.** Listers C1–C4 run and mutation-tested; census
recorded in `SPEC.md`. Rows below are the seed set: the risks the design passes
identified, plus the C4 policy list. **No row is adjudicated yet** — Pass 2
reads each quarry file end-to-end and fills `disposition`, `rationale`,
`evidence`, and `discharged by`.

⛔ **Pass 1 is not a completeness claim.** An audit that can only check its own
rows is complete by construction and therefore worthless [read:
`FIDELITY-METHOD.md` § Why this exists].

## Close conditions

Adopt `_TEMPLATE.md`'s verbatim, plus two this port needs:

1. **Open rows = 0**, where _open_ is `FIDELITY-METHOD § At AR-5`'s four
   conditions verbatim — never restated in other words.
2. Every non-empty `discharged by` **resolves**: a README/DOCS heading exists, a
   test title appears in a passing run, or a type member compiles.
3. **A `supersede` row whose quoted greenfield sentence no longer resolves
   against a committed file is OPEN.** (New. The four quotations live in files
   `orchestrate-ux` 0.3 will rewrite.)
4. **A `re-home` row naming only one side is OPEN.** (New. ~70% of this port is
   a re-home argument, and a row naming only the losing file records a loss
   where there is none — or hides one.)
5. Every C1 census member (59) appears in exactly one row or is present in the
   port under its own or a named new name.
6. Every C3 title (270) is `restore`, `already survives`, or `drop` with a
   reason.

## Gate order — structural-integrity check FIRST

This ledger carries `bash` fences containing three-backtick lines. That is the
exact hazard class `_TEMPLATE.md § The structural-integrity check` was built
for: it once caught 418 rows buried inside a four-backtick fence while
markdownlint, prettier, the Pass-1 gate and the transport check all reported
clean. Run it path-scoped before every commit — the pre-commit hook runs
`prettier --write` and no linter.

Then: Pass-1 gate (`CENSUS=59`, `LENS=edt`, `[ "$n" -gt 0 ]`) → C1–C4.

## Rows

| id      | member                                                                                                          | disposition                                             | policy | rationale                                                                                                                                                                                                                                                                                 | evidence                                                                            | discharged by                                                   |
| ------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| edt-001 | `{{line}}` / `{{column}}` placeholders across all 20 `EXPLANATIONS` patterns                                    | `re-home` (proposed)                                    | n/a    | Q4 relocates who computes line/column; it does not delete them. Highest-ranked silent loss: a worker reading _"Offsets, not line/column"_ as a mandate strips the placeholders and rewords authored prose. Nothing fails.                                                                 | `explanations.ts`; SPEC § Q4                                                        | ⬜                                                              |
| edt-002 | the rich gutter-hover DOM join (`renderMessage` → `buildTooltipDom`, 6 sections)                                | `re-home` (proposed)                                    | n/a    | Greenfield `Violation` has no entry channel **by design** — widening it would be the impoverishing move. The join belongs in the adapter, keyed on the source slice.                                                                                                                      | quarry `to-cm-diagnostic.ts:71-77`; `lib/screening/types.ts`                        | ⬜                                                              |
| edt-003 | `extractToken`'s four-step ladder (direct slice → first word → arrow → last identifier)                         | `restore` + **fix** (proposed)                          | inline | Becomes ~8 lines under offsets, which makes it look deletable. R-A ports and fixes: step 3 is unguarded (`lint-jej.ts:104`), so a `ForOfStatement` violation containing an arrow gets the arrow explanation. JSDoc at `:69` says "Three-step"; the body has four.                         | `lint-jej.ts:82-114`                                                                | ⬜ four named test titles, one per step                         |
| edt-004 | `apply: 'noop'` — blocked completions dismiss on Enter instead of inserting                                     | `restore` (proposed)                                    | inline | A pedagogical invention with **no CodeMirror analogue**. An adapter built from CM docs will simply not have it and no test will fail. Rides `autocompletion()`, which Q3 excludes — so it is reachable only through R1's rich baseline.                                                   | `build-extensions.ts:167-169`, `dismissPopup:258-260`; `mark-blocked.ts:84,106`     | ⬜                                                              |
| edt-005 | the five semantic tooltip colour roles (common-mistakes, when-to-use, why-not-admitted, headings, code)         | `re-home` mechanism + `restore` roles (proposed)        | n/a    | 17 hardcoded hex via inline `style.cssText`, palette is **VS Code Dark+**, not One Dark — and the quarry editor itself was dark (`oneDark`), while greenfield themes on `--ifm-*`. A by-eye hex→token map loses the information architecture.                                             | `build-tooltip-dom.ts`, `build-info-dom.ts`                                         | ⬜ five named custom properties                                 |
| edt-006 | the push-based interpreted feed: `StateField` + `needsRefresh` identity compare + `forceLinting`                | `supersede` (proposed, cites **Q1**)                    | n/a    | ⚠ **"Copy paste" is actively wrong here.** The machinery existed because the quarry linter was PULL-based; greenfield diagnostics are supplied and the `settled`-keyed memo already gives identity stability. Transporting the StateField installs a second diagnostic source Q1 forbids. | `interpreted-diagnostics/*`, `build-extensions.ts:75,88-93`, `create-editor.ts:195` | ⬜                                                              |
| edt-007 | the staleness blank — no markers on a whitespace-only buffer                                                    | `restore` (proposed)                                    | inline | The **affordance** that survives edt-006's mechanism. Greenfield carries the same 200 ms settle lag and no equivalent guard.                                                                                                                                                              | `build-extensions.ts:79`                                                            | ⬜                                                              |
| edt-008 | the stable-empty sentinel — "still nothing" must not re-fire                                                    | `restore` (proposed)                                    | inline | The second surviving affordance. Carries an explicit AR-4 finding at the code.                                                                                                                                                                                                            | quarry `orchestrate/index.tsx:483-497`                                              | ⬜                                                              |
| edt-009 | `detect-language.ts` — ~20 extensions → 10 languages; `CM_LOADERS` for 9 grammars                               | `drop-as-loss` (proposed — **human sign-off required**) | n/a    | Correctly deleted (greenfield loads only `lang-javascript`), but silently. Without the row the next person wanting Python re-derives the table. Staleness is not an exception to enumeration.                                                                                             | `detect-language.ts` (66); `build-extensions.ts:227-250`                            | ⬜ a `## What this surface does NOT do` heading naming the nine |
| edt-010 | the 270 quarry test titles                                                                                      | `restore` / `already survives` / `drop`, per title      | n/a    | The record of every boundary anyone ever thought about. Highest-volume loss surface, and a green suite of 40 new tests looks like success.                                                                                                                                                | C3 census, SPEC § C3                                                                | ⬜ per-title adjudication in Pass 2                             |
| edt-011 | the four AR-numbered comments at the code (`(AR-4)`, `(load-bearing)`, the prefer-optional-chain catch-22 note) | `restore-as-doc` (proposed)                             | n/a    | Review verdicts recorded at the code. A ruling you cannot locate in one command is one you are inventing.                                                                                                                                                                                 | quarry `orchestrate/index.tsx:466-497`                                              | ⬜                                                              |
| edt-012 | `buildScope` → `ScopeUsage.allDeclarations`                                                                     | `already survives`                                      | n/a    | **NOT a loss.** Recorded so no worker writes a `drop-as-loss` for it: the analysis ports under a new name; the real gap is one line of projection.                                                                                                                                        | `lib/scoping/types.ts:59-60`; `assemble-parse-facts.ts:56-58`                       | ⬜ `ParseFacts` declarations channel                            |
| edt-013 | `parse-best-effort.ts` — dead except as a test-fixture builder                                                  | `revive` → likely `supersede` (proposed)                | n/a    | **Design owed.** Its own header says it is retained only for fixtures. Greenfield `AstFailure` offers a recovered tree plus enumerated `invented` nodes — strictly richer. Without this row a worker either rebuilds dead code or drops a capability the greenfield already surpasses.    | `parse-best-effort.ts:1-11`; `embody/types.ts` `AstFailure`                         | ⬜                                                              |
| edt-014 | whole-document reformat + the `Ctrl/Cmd-Shift-F` binding                                                        | ⬜ **undecided — carried to AR-1**                      | n/a    | `FormatSupport` carries indentation only. Prettier inside the editor is a third parse of the program in the surface barred from parsing it once. Returns as an orchestrator command, or is dropped on the record.                                                                         | `build-extensions.ts:183-190`; `format-jej.ts`                                      | ⬜                                                              |
| edt-015 | `basicSetup` → `minimalSetup`                                                                                   | `supersede` **reversed by R1** (proposed)               | n/a    | Q3 is the greenfield sentence and human ruling R1 overrides it. The row records the override against the quoted words rather than pretending Q3 is absent.                                                                                                                                | SPEC § Q3; `create-editor.ts:78-85`                                                 | ⬜                                                              |
| edt-016 | the `linters: LinterCallback[]` PULL architecture                                                               | `supersede` (proposed, cites **Q1**)                    | n/a    | `lint-jej.ts:37` calls `validate(code)` itself — the second parse Q1 forbids. The structural feed repoints onto the shared memoized validate.                                                                                                                                             | SPEC § Q1; `lint-jej.ts:36-37`                                                      | ⬜                                                              |
| edt-017 | `positionToOffset`                                                                                              | `supersede` (proposed, cites **Q4**)                    | n/a    | Greenfield violations are already offsets; the conversion layer deletes. ⚠ Does **not** license edt-001.                                                                                                                                                                                  | SPEC § Q4; `lint-jej.ts:120-134`                                                    | ⬜                                                              |

### C4 seed — policy in control flow (a LIST, never a count)

Measured 2026-09-03. Each becomes a named value or a named adapter constant.

| id      | site                                                                      | the decision, unnamed                                                                                                                                                         |
| ------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| edt-018 | `lib/linting/lint-jej.ts:40`                                              | parse failure ⇒ one point diagnostic replacing all violations (the branch R2's second input replaces)                                                                         |
| edt-019 | `lib/linting/lint-jej.ts:104`                                             | `if (slice.includes('=>')) return '=>'` — **unguarded**; see edt-003                                                                                                          |
| edt-020 | `orchestrate/lib/editing/to-cm-diagnostic.ts:59`                          | `'rejection'` ⇒ CM `'warning'`; parse failures stay red. Greenfield `Violation` has no severity, so this becomes an adapter constant owned by the orchestrator, not the level |
| edt-021 | `orchestrate/lib/editing/build-extensions.ts:167`                         | the `apply === 'noop'` sentinel dispatch; see edt-004                                                                                                                         |
| edt-022 | `orchestrate/lib/editing/build-extensions.ts:214`                         | language-load degradation: warn and continue unhighlighted                                                                                                                    |
| edt-023 | `orchestrate/lib/editing/build-tooltip-dom.ts:35-36`                      | malformed-callback fallback rendering                                                                                                                                         |
| edt-024 | `orchestrate/lib/error-interpreting/derive-interpreted-diagnostics.ts:66` | `phase === 'evaluation' ? 'runtime' : 'parse'` — a 5→2 collapse in a ternary                                                                                                  |
| edt-025 | `orchestrate/lib/error-interpreting/extract-context.ts:93`                | declared-name collection keyed on `VariableDeclarator`                                                                                                                        |
| edt-026 | `orchestrate/lib/error-interpreting/extract-context.ts:131,140,148`       | three **English V8 message strings** matched inline — engine data, V8-version-fragile, with no named home                                                                     |
| edt-027 | `orchestrate/lib/error-interpreting/extract-context.ts:163`               | the literal identifier `'prompt'` — a JEJ host binding hardcoded into generic machinery                                                                                       |

⚠ A numeric-literal arm of the same lister returns ~47 hits, mostly CSS `px` and
`font-size`. **No total is published.** Pass 2 extracts the ~6 real ones (the
240-char truncation, the `+1` minimum highlight width at
`to-cm-diagnostic.ts:52`).

## Not rows — refuted, and barred from classification

| claim                                                    | why it is not a row                                                                                                                                               |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "`buildScope` does not port"                             | False. It is a rename. Kept as edt-012 (`already survives`) precisely so it does not become a `drop-as-loss`.                                                     |
| "four doc sites claim blocked completions carry `entry`" | **One** does (`completing/DOCS.md:229`). The file header, `README.md:155` and the test all say the omission is deliberate. One wrong sentence, not a policy debt. |
| "~21 policy decisions"                                   | Not reproducible: 13 by one lister, ~47 by another. Ships as the list above.                                                                                      |
| "85/15 data-to-mechanism split"                          | Did not reproduce (70.5/29.5, and even that is an ownership _proposal_ — 39.6% under the quarry's own filing). Ownership is ruled per R5, not measured.           |
