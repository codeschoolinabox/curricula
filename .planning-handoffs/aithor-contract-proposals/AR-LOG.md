<!-- cspell:ignore aithor unparseable ungated Begel unioned repoints ledgered socratizing -->

# AR trail — aithor contract-proposals dossier

Verdicts and resolutions for the dossier's adversarial reviews, per DEV.md §
Adversarial Review Protocol. Baseline at plan approval: `3dbf99d1`.

> **The gate ruling lands HERE.** When the maintainer rules at the Phase-0 →
> Phase-1 gate, the ruling — ratifications, amendments, strikes, per
> `SEQUENCING.md` § Gate items — is recorded as a `## The gate ruling` section
> at the bottom of this file (and mirrored into the charter memory's addendum).
> Until that section exists, the gate has not ruled and no wave may open.

## AR-1 (Design Challenge) — verdict: PAUSE → resolved with the human

Subject: `README.PROPOSED.md` (first draft). Three blockers, ten important,
seven minor, six counter-proposals. The PAUSE was presented to the human with
recommended resolutions; the four load-bearing rulings were made by the human,
the rest resolved by the implementing agent as CONSIDER-level batch-fixes. All
fixes are in the current draft.

### Human rulings (2026-07-28)

| #    | Question                                                         | Ruling                                                                                                                                                                                                                                                                                            |
| ---- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CP-A | Drop the walk tier (constraints steering-only always)?           | **Keep 3 tiers.** Honest restatement of the enforcement commitment instead; dropping the walk would demote vary's ratified hard tier to steering-with-extra-steps.                                                                                                                                |
| 1–3  | The three blocker fixes as a package                             | **Approved.** Finding adopts nested `location: SourceRange`; the Wave-1 leaf owns the walk+parse pairing and the README states the parse contract; the gate returns `Finding[] \| 'undetermined'` with undetermined = attempt refused, repair fuel from aithor's parse diagnosis, never a result. |
| 4    | Bare `{prompt, model}` curated guarantee regresses to parse-only | **Document the transition** (consumer is mock-only today; the socket swap is the P7 integration moment; Meta MAY gain a tier-honesty field — proposed in the types draft).                                                                                                                        |
| 12   | Cancel exit shape                                                | **Reject with the signal's reason.** The socket's swallow obligation named in the README; no new RefusalCause, no socket re-pin, no third evals bucket.                                                                                                                                           |

### CONSIDER resolutions (implementing agent, documented)

| #   | Concern                                                                  | Resolution                                                                                                                                                                                                                                                                                                                                      |
| --- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5   | Node-type inventory drastically stricter for held `vary` level           | Adopted the reviewer's option (a): inventory unions with a named **structural floor** — `Program`, `ExpressionStatement`, `BlockStatement`, `Identifier`, `Literal`, and no declaration category — pinned as data in the Wave-1 leaf. (Membership amended by the maintainer at Wave-1 Phase 0, `2437801d`; the row states the rule that holds.) |
| 6   | Vary-derived dataset's empty `admittedGlobals` would steer "use nothing" | Ruled: an empty set renders **no** vocabulary clause — silence, never a prohibition. Stated in the README.                                                                                                                                                                                                                                      |
| 7   | Size violations lose `limit`/`actual` if collapsed into Finding          | Size violations keep their structured shape (dimension/limit/actual) beside gate findings as repair fuel; the types draft carries `SizeViolation` forward.                                                                                                                                                                                      |
| 8   | Q3 overstates learner reachability                                       | Stated: Q3 is reached through a consumer-owned learner vocabulary compiling to a dataset (P7's layer); aithor's surface is machine-facing.                                                                                                                                                                                                      |
| 9   | Evals blast radius unscoped; attempt-bound justification circular        | Scope lives in `SEQUENCING.md` per wave. Bound re-justified on its own terms (repair-turn latency ceiling); the evals' 1\|2\|3 narrowing cited as downstream evidence, not reason.                                                                                                                                                              |
| 10  | Naming collisions                                                        | Adopted: config field `allowlist` (not `constraints`); **progress event** (not phase); glossary head **Signal**; `vary.languageLevel` → **`vary.syntax`** (annotated as a Wave-2 breaking rename); profile examples use data names (`ast`), not display labels; `raw` and `gate` kept as named homonyms.                                        |
| 11  | Which result field carries raw output                                    | Ruled: `AithorResult` unchanged; `program` carries the byte-exact raw string on the raw path (as the committed implementation does). The raw-is-a-flag argument corrected: a gate cannot be steered, so `raw` beside `gate` throws — that, not field selection, is why raw is a flag.                                                           |
| 13  | "No mode flag" commitment overstated                                     | Restated honestly: enforcement is derived from filled slots, and filling `gate` demotes the allowlist to steering — the stated price of complete-and-final.                                                                                                                                                                                     |
| 14  | `Violation` ownership blocks the Wave-1 leaf                             | Adopted the reviewer's option (a): `Violation` moves to the leaf; the levels region re-exports it so existing consumers keep their import. Recorded in `SEQUENCING.md` Wave 1.                                                                                                                                                                  |
| 15  | Size-repair vs brokenness-profile ping-pong                              | Named in the README as an accepted interaction edge, covered by the bound.                                                                                                                                                                                                                                                                      |
| 16  | Ratified content dropped by attrition                                    | Restored: tight-requests-cost-more; offline-not-zero-footprint; Theme; the Begel & Ko both-yes; the figure referenced via the canonical quad treatment.                                                                                                                                                                                         |
| 17  | No real links                                                            | Real relative links restored (current-seat paths; Wave 3 re-homes).                                                                                                                                                                                                                                                                             |
| 18  | Four positional params (CP-D: curry the runtime)                         | **Declined**: the consumer socket pins the `aithor(program, config, runtime)` transcription; a 4th optional arg is additive, currying is a second breaking reshape for marginal gain.                                                                                                                                                           |
| 19  | `onProgress` throw behavior                                              | Ruled: wrapped and swallowed — observation must never change the outcome.                                                                                                                                                                                                                                                                       |
| 20  | Empty `nodes` table                                                      | Ruled: a legitimate, honestly-unsatisfiable request (attempt-bound refusal), not a config-shape throw.                                                                                                                                                                                                                                          |
| 21  | `steering` without an allowlist                                          | Ruled: rendered regardless — it is prose steering either way.                                                                                                                                                                                                                                                                                   |

## AR-2 (Architectural Sketch Challenge) — verdict: PAUSE → resolved with the human

Subject: `DOCS.PROPOSED.md` (first draft), against the README and types drafts.
One blocker, seven important, five minor. The reviewer confirmed no AR-1 ruling
was contradicted and that the design itself (three seams, the gate hierarchy,
cancellation and undetermined semantics) survives; every concern was a
sketch↔types coherence break with a textual fix. Presented to the human; three
load-bearing rulings made there, the rest resolved by the implementing agent as
CONSIDER-level batch-fixes. All fixes are in the current drafts.

### Human rulings (2026-07-28)

| #     | Question                                                           | Ruling                                                                                                                                                                                                                                          |
| ----- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Bring-up ratio promised by the sketch, loader has no progress slot | **Widen `ModelLoader`** with an optional progress relay — aithor-internal (local-llm's `load` already accepts a callback); a Wave-4 DELTA, no cross-module obligation.                                                                          |
| 3     | Mid-generation model-call rejection unstated                       | **Propagate** — an infrastructure fault, the same layer as a throwing gate and the live loop's behavior; the value-not-throw constraint is explicitly scoped to bring-up outcomes and gate verdicts.                                            |
| 4 + 5 | Seam 3 buried mid-Disposition; tier derivation homeless            | **Six-phase cut**: Candidate gating owns seam 3 (gate + sizes + undetermined diagnosis); Disposition is pure loop accounting. The tier is derived ONCE at Request resolution and carried on the resolved request (`ResolvedAithorConfig.tier`). |

### CONSIDER resolutions (implementing agent, documented)

| #   | Concern                                                          | Resolution                                                                                                                                                                                                         |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2   | Seam 2 vanished from the diagram                                 | Restored: the resolved-model node and the call-model edge (seam 2, rejection-propagates, `attempt(n)` annotation on the edge).                                                                                     |
| 6   | Resolved-request state under-enumerated, mapped to no type       | Enumerated fully (ask · model · slots · raw · sizes · soft holds · tier); `ResolvedAithorConfig` gains `softHolds` + `tier` so the sketch's central state maps to one type, both directions.                       |
| 7   | Full-replacement artifact defers content to the file it replaces | Inlined: the authoring/reproducibility/faithfulness out-of-scope bullets (with raw-in-scope); the loader-seam docs carried in full in the types draft.                                                             |
| 8   | `SEQUENCING.md` referenced but unwritten                         | It is the next dossier artifact, written before the commit (the checklist's order); the AR-LOG's past-tense claims corrected to this note.                                                                         |
| 9   | Signal drawn as a node; `AbortSignal` label; fuzzy "around"      | The box is kept and explicitly labeled an annotation (Mermaid renders every identifier as a node); renamed `signal`; check points enumerated (before bring-up, before each model call, before and after the gate). |
| 10  | `resolve` event missing; ordering vs throws unstated             | Added to the diagram; ruled: a config-shape throw precedes every event — a malformed request emits nothing.                                                                                                        |
| 11  | Empty candidate parses → `ok: true` `""` under the parse tier    | Named in the sketch as accepted transition behavior; a consumer's gate or size floor excludes it. AR-3 may revisit at the first failing test.                                                                      |
| 12  | Progress-order notation; `repair(n)`'s number                    | Notation fixed (the final gating is followed by a result or the exhaustion refusal); `repair(n)` carries the refused attempt's number.                                                                             |
| 13  | `ok`-boolean convention bullet dropped                           | Restored as a structural constraint.                                                                                                                                                                               |

## The gate ruling (2026-07-30)

The maintainer ruled at the Phase-0 → Phase-1 gate, via in-session questions, on
the seven items of `SEQUENCING.md` § Gate items. **The gate is PASSED — waves
may open**, in the ratified order, each as its own full-ceremony campaign.

| Item | Subject                                                                             | Ruling                                                                                                                                                       |
| ---- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | Rawness fate (`raw: true` amends ratified P2)                                       | **RATIFIED.** The explicit uncurated opt-in stands; always-curated holds as instrument policy (the consumer never passes it).                                |
| 2    | P4 collapse (profile out of the config)                                             | **RATIFIED.** Lifecycle profiles live in the consumer-curried injected gate; the `'undetermined'` arm carries the never-gates-what-it-can't-parse carve-out. |
| 3    | The wave merge (4 waves vs the charter's 6)                                         | **RATIFIED.** Leaf extraction → core reshape (P1+P2+P4) → the move → options API; P7 later, orchestrator-side.                                               |
| 4    | `Meta.tier` (optional tier-honesty field)                                           | **RATIFIED.** The field lands; additive-optional; the consumer stream re-pins deliberately (flag stands).                                                    |
| 5    | Wave-1 cross-territory writes (jej repoints; `Violation` moves w/ region re-export) | **Acknowledged/authorized** — executed at Wave-1, under its own ceremony.                                                                                    |
| 6    | local-llm signal extension                                                          | **Acknowledged** as a named future obligation in another leaf's territory; Wave-4's tiered cancel stands on its own until it lands.                          |
| 7    | Cancel exit (reject-with-reason)                                                    | **Acted** — already human-ruled at the AR-1 presentation; the gate confirms it; the consumer socket's swallow obligation stands as documented.               |

Same-day context recorded with the ruling: the maintainer separately
re-confirmed the three AR-2 rulings ("1 yes · 3 propagate · 4+5 ok" — already
applied above), and the dossier's SEQUENCING was refreshed in the same commit as
this section for two post-dossier repo events: the eval driver landed
(2026-07-28) and the published-parse contract was pinned ESTree-shaped/offsets
(2026-07-30), closing the `preserveParens` divergence the Wave-1 caution had
warned about.

## Wave 1 — the screening leaf (rulings 2026-07-30 and 2026-08-05)

Wave 1 graduated the vendored allowlist machinery out of the JEJ language level
into `src/lib/study-lenses/lib/screening/`, a domain-blind leaf. The wave opens
at Phase 0's `2437801d`; its **baseline** — the commit before the wave — is
`487ad7b7` [measured: `git log -1 --format='%h %s' 2437801d^`]. Naming the
baseline separately matters because `2437801d..HEAD` **excludes** `2437801d`,
and Phase 0 is where this wave's cross-territory writes actually executed.

**Every cell records what was ruled. Execution is recorded by git** — a cell
never asserts that an edit landed.

**Why these are recorded late, stated so the cost is visible.** The rulings
below were taken 2026-07-30, during the session that ran increments 1.1–1.4.
Only H1 was written durably at the time (into `a7be59e6`'s commit body); the
rest lived only in a `~/.claude/plans/` file until a successor session recorded
them here [read: [DEV.md § Ruling provenance](../../DEV.md#ruling-provenance) —
_"A ruling that lives only in a plan file under `~/.claude/plans/` does not
exist — `git grep` cannot see it"_, and _"when the human confirms a ruling,
write it into one of the three homes **in the same turn**"_]. DEF-1 below is
what that gap cost.

### Increment ledger (wave 1)

**The wave is open through 1.4.** Increment 1.5 — the structural floor, which
[SEQUENCING.md § Wave 1 — the shared allowlist leaf](./SEQUENCING.md#wave-1--the-shared-allowlist-leaf)
names as in scope and which the leaf's committed README already advertises as a
file and an export — is not built, and the wave-close `docs:` commit has not
landed. Both append their rows here at close.

| #      | SHA        | Subject                                                          |
| ------ | ---------- | ---------------------------------------------------------------- |
| P0     | `2437801d` | docs: establish screening domain model and architectural sketch  |
| P0 fix | `1b8588f0` | docs: the screening file map lists every type the leaf declares  |
| 1.1    | `1e6d78e5` | add: the screening leaf publishes the package's parse settings   |
| 1.2    | `6a2cacbc` | refactor: violation construction graduates to the screening leaf |
| 1.3    | `f89fcb7c` | refactor: child-node traversal graduates to the screening leaf   |
| 1.4    | `a7be59e6` | refactor: the default-deny walk graduates to the screening leaf  |

**The increment numbers are plan numbers, not commit order.** `6a2cacbc` (1.2)
is an **ancestor** of `1e6d78e5` (1.1) — 21:28:07 against 21:31:58 [measured:
`git log --format='%h %ci %s' 2437801d..a7be59e6 --reverse`]. A reviewer
replaying the wave follows the SHAs in commit order, never the row order.

1.2, 1.3 and 1.4 are true renames, not delete-plus-add [measured: `git show
--name-status -M` on each → `R062`/`R100`, `R065`/`R081`, `R069`/`R074`]. 1.1 is
a pure add.

**Phase 0 is not a docs-only commit, and it carries the wave's whole
cross-territory write.** `2437801d` modified seven source files beside the three
it added — `jej/collect-violations.ts`, `jej/create-violation.ts`,
`jej/just-enough-js.ts`, `jej/tests/just-enough-js.test.ts`, `jej/types.ts`,
`language-levels/types.ts`, and `lib/README.md` [measured: `git show
--name-status -M 2437801d`]. That is the entirety of gate item 5's authorization
— `Violation` moving with a region re-export, and
`SyntaxAllowlist`/`NodeRule`/`ConstraintCheck` graduating out of the level — and
`language-levels/types.ts` is touched by **no other commit in the wave**
[measured: `git log --oneline 487ad7b7..HEAD --
src/lib/study-lenses/language-levels/types.ts`]. A reviewer scoping this wave
from the rename list alone would never look there.

### Human rulings (wave 1)

Numbered here so they are citable; the numbering is this section's, not the
maintainer's.

| #      | Ruling                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Recorded                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| **H1** | The leaf's default-deny refusal message is reworded **domain-blind**. The superseded wording `'X' is not allowed at this language level` was **shipped production code**, not a draft — it was live in the level before the move [measured 2026-08-05: `git show a7be59e6^:src/lib/study-lenses/language-levels/jej/collect-violations.ts` → line 92]. It carries level vocabulary into a leaf whose committed README forbids it [read: `src/lib/study-lenses/lib/screening/README.md` § Conventions — _"Domain-blind. No language levels … in the code or in the prose"_]. So this is a **behavior change**, as `a7be59e6`'s body classifies it, and that is why 1.4 became **user-observable** and a 🔍 sandbox checkpoint fired on it. H1 rules that it be reworded; **H3 settles what to**.                                                                                                                                                                                                                                                  | 2026-07-30. `a7be59e6` commit body, and this row.                          |
| **H2** | The leaf README's **"Never parses."** bullet gains a test-tree qualifier, matching the shape its sibling ECMA-version bullet already uses. One approved edit to a committed Phase-0 artifact.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 2026-07-30. Execution owed by the Wave-1 close `docs:` commit.             |
| **H3** | The leaf's default-deny wording is `'X' isn't in the admitted syntax`. Ruled at 1.4's 🔍 checkpoint, over a first draft using the leaf's own term "curated slice" — `ar-4` measured that term to be invisible to learners and argued the swap was jargon-for-jargon rather than jargon removal. The concept keeps the name "curated slice" in the leaf's prose and types; only the learner-facing string is plain.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | 2026-07-30. `a7be59e6` body; live at `screening/collect-violations.ts:85`. |
| **H4** | **A ledger states the rule that now holds.** A superseded row is corrected in place; annotation trails and historical notes in documentation are a footgun and are not written. This ruling retires the earlier one that had frozen AR-1 CONSIDER row 5 as a historical record — row 5 now names the five members, so the ledger and the leaf's `DOCS.md` agree and a naive `git grep` returns the rule rather than its predecessor. **The retired wording was `(envelope/wrapper/identifier/literal/declaration node types)`, recoverable at `git show 4b244b23:.planning-handoffs/aithor-contract-proposals/AR-LOG.md`** — recorded here, on the ruling row, because `2437801d`'s body quotes that exact phrase in a `[read:]` tag and **a commit body cannot be amended**, so without this pointer the wave's own `ar-5` follows a citation into nothing and cannot tell a correction from an invention. One provenance clause on the ruling row is not the annotation trail this ruling forbids; a trail accreting on row 5 itself would be. | 2026-08-05. This row, and row 5 itself.                                    |
| **H5** | This commit carries **`ar-1` and `ar-4`**. `ar-2` does not fire: its subject is an architectural sketch and its inputs are `DOCS.md`/`README.md`/`types.ts` [read: [DEV.md § AR-2: Architectural Sketch Challenge](../../DEV.md#ar-2-architectural-sketch-challenge)], none of which a ruling ledger has. Full ceremony, no agent-side lightening.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | 2026-08-05, at the plan gate. This row.                                    |
| **H6** | Increment 1.5's three boundary tests ship **without `PINNED(…)` markers** while the pinned-guard hook is unregistered (FLAG 8). A marker that reads as protected while nothing defends it is worse than none. The markers are added once the guard is re-armed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 2026-08-05. This row.                                                      |

**Phase 0's four maintainer rulings are not renumbered here.** They were taken
2026-07-30 at the Phase-0 gate and are durable in `2437801d`'s body, which is
their citable home; naming them keeps this table from reading as the wave's
complete ruling set [read: `2437801d` body § MAINTAINER RULINGS THIS SESSION]:
the leaf is named **`screening`**, not the dossier's `allowlisting` placeholder;
the paired parse ships as **a settings constant only**, so no second parse call
site exists anywhere; the type-home consolidation happens **inside Phase 0**,
deviating from the `26fb3dd0` precedent, because a type has one home and a
docs-only Phase 0 would carry five duplicate declarations across the human gate;
and **the structural floor names five node types with no declaration among
them** — the amendment H4's row-5 correction now publishes.

### AR verdicts (wave 1)

Transported from **all six** wave commit bodies, because `git grep` cannot
search commit messages — it searches the tree — so a verdict recorded only in a
body is not reachable from any of
[DEV.md § Ruling provenance](../../DEV.md#ruling-provenance)'s three homes.
Phase 0 ran `ar-1`/`ar-2`; the increments ran `ar-3`/`ar-4`, so they are tabled
separately rather than forced into shared columns.

**Phase 0 is where the wave's only two PAUSEs are**, and an earlier revision of
this subsection omitted them — a table headed "wave 1" that showed four
CONSIDERs and no PAUSE told a Wave-2 reader the wave never paused.

| #      | `ar-1`                                                                                                                                       | `ar-2`                                                                              |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| P0     | **PAUSE** → resolved. Three blockers, six important, two minor; **the floor's membership went to the maintainer**, the other ten batch-fixed | **PAUSE** → resolved. Two blockers, ten important, eight minor, all fixed in-commit |
| P0 fix | **no verdicts stated in the body** [measured: `git show -s --format=%B 1b8588f0`]                                                            | same                                                                                |

P0's `ar-1` row carries the wave's most consequential referral: it is where the
five-member floor amendment (H4, row 5) originated. That sentence existed only
in `2437801d`'s body until this subsection transported it.

| #   | `ar-3`                                                                                                                                                          | `ar-4`                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1.1 | CONSIDER — six concerns, all resolved in-commit                                                                                                                 | PROCEED — four MINOR; two folded into the body as precision fixes, two answered without a code change                   |
| 1.2 | CONSIDER — all five concerns accepted; it caught the brief overstating the honest-Red blast radius                                                              | CONSIDER — caught a relayed grep claim disprovable in one command                                                       |
| 1.3 | **verdict not stated in the body**; one finding closed by a new test (nothing discriminated `isMetadataKey` from dead code)                                     | **verdict not stated in the body**; concern 3 adopted as the unfrozen-array FLAG, its framing carried over              |
| 1.4 | CONSIDER → resolved; two IMPORTANT findings batch-fixed (the missing empty-program Zero case; the traversal-order assertion broadened to `{path, start}` pairs) | CONSIDER → resolved; a stale test name, three untagged claims, and a DOCS-vs-test `PINNED` mismatch, all fixed pre-body |

1.3's two blanks are recorded as blanks rather than inferred. They are the
measured cost of leaving AR verdicts in commit bodies alone.

### Corrected defects (wave 1)

#### DEF-1 — a declaration is two nodes, not one

The Phase-1 launch prompt specified that walking `let n = 3; { n; }` under the
floor yields "exactly one violation naming `VariableDeclaration`". Under the
**amended** five-member floor it yields **two**. ("Amended", not "ratified":
`2437801d`'s body records that the five-member membership _"AMENDS a ratified
item"_ — the dossier's ratified text is what row 5 carried, and the maintainer
changed it.) Every candidate floor, measured:

```text
walking "let n = 3; { n; }"
  five (amended)                 -> [VariableDeclaration, VariableDeclarator]
  five + VariableDeclarator      -> [VariableDeclaration]
  five + VariableDeclaration     -> [VariableDeclarator]
  five + both                    -> []
```

[measured 2026-08-05 by bundling the leaf's **own** `collect-violations.ts` and
`parse-settings.ts` with esbuild and executing the bundle against
`node_modules/acorn` 8.16.0 at `sourceType: 'module'` — the leaf's real exports,
not a re-implementation of its walk.] [relayed: independently re-derived
2026-07-30 by the Phase-1 session, and again by `ar-1` and by `ar-4`, all four
agreeing cell-for-cell.]

**The durable lesson is about the published parse, not about this ledger.**
acorn nests a `VariableDeclarator` beneath every `VariableDeclaration`, so a
floor expectation phrased around "a declaration" must say **which of the two
nodes**, and must count two when it admits neither. That is a fact about the
tree the package publishes, and it outlives any wave.

The prompt's specific wrong number is nevertheless traceable: the floor it was
written against admitted `VariableDeclarator` and not `VariableDeclaration` —
_"a `ReadonlySet<string>` of **six** node types — `Program`,
`ExpressionStatement`, `BlockStatement`, `Identifier`, `Literal`,
`VariableDeclarator`"_ [relayed:
`~/.claude/plans/cold-start-handoff-agile-beaver.md`, quoted verbatim; a plan
file is outside the tree, so this is `relayed`, never `read` — the quote is
reproduced inline here precisely because that file is ephemeral and `git grep`
cannot reach it]. That is exactly the row of the table above which yields one
violation named `VariableDeclaration`. The membership was amended to five before
Phase 1 opened; the expectation was not.

**Two corrections to how this defect used to be explained.** First, row 5 never
carried the six-member list — it carried a five-item _category_ shorthand, and
the six-member list lives in the launch prompt's ancestor handoff. So H4's row-5
correction removed a stale category; it did **not** remove the text that
produced the wrong number, and nothing can, because a plan file is not a durable
artifact and is not corrected. That is why the durable lesson above is stated
about the parse rather than about any one document. Second, the same superseded
quote fixes the wrong **shape**: the floor ships as a node-rule table —
`SyntaxAllowlist['nodes']` narrowed to all-`true` — not as a `ReadonlySet`
[read: `src/lib/study-lenses/lib/screening/README.md` § Public API —
_"`STRUCTURAL_FLOOR` — a node-rule table of the types an inventory-derived slice
must admit"_]. A set and an all-`true` table are not interchangeable at the
union site that README describes, and `types.ts` declares no floor type and
needs none.

#### DEF-2 — the proposed zero-case was blind to one floor member

The proposed "admitted whole" fixture `n; { n; }` contains no literal, so a
floor that had lost its `Literal` entry would still yield zero violations — a
silent pass. `'"s"; { n; }'` exercises all five members, and every single-member
drop is caught:

```text
'"s"; { n; }'  minus Program             -> [Program]
               minus ExpressionStatement -> [ExpressionStatement, ExpressionStatement]
               minus BlockStatement      -> [BlockStatement]
               minus Identifier          -> [Identifier]
               minus Literal             -> [Literal]
"n; { n; }"    minus Literal             -> []          <-- the silent case
```

[measured, same harness as DEF-1.]

**The durable finding is the requirement, not the fixture.** A zero-case for the
floor must exercise **all five** members, so that dropping any one is caught;
`n; { n; }` fails that test and `'"s"; { n; }'` satisfies it. Which fixture
increment 1.5 actually ships is 1.5's own business, settled at its `ar-3` — no
ruling in the table above fixes it, and recording one here would settle in
advance the very question `ar-3` exists to ask, since its trigger is the first
failing test.

### AR-5 scoping (wave 1)

**The `ar-5` scoping form — by SHA, never by range.** This worktree is shared,
and foreign commits accumulate between the wave's own commits faster than any
written count survives: **49 as of `e11714a5`**, having read 38, 44 and 46 at
three earlier HEADs the same day [measured 2026-08-05: `git rev-list --count
a7be59e6..e11714a5` — the SHA is in the command, not only in the prose, so the
tag reproduces its own value]. **Take the number from the instrument, never from
this line** — it is pinned to a SHA precisely so a reader can tell it is stale
rather than trusting it. `<baseline>..HEAD` is therefore not this changeset, and
`.claude/agents/ar-5.md` instruction 3 — which tells the reviewer to run exactly
that — is overridden **in the prompt**, never by editing the agent file, which
is governance surface. The reviewer is handed the wave's commits and runs
**three** commands per commit, because no one of them serves all of AR-5's focus
areas:

- `git show --name-status -M <sha>` for the rename evidence — `--name-status`
  rather than `--stat -M` because `--stat` abbreviates long paths to `.../` and
  prints no similarity index, so it cannot confirm a rename;
- `git show -s --format=%B <sha>` for the body, where the loss ledgers and the
  sourced claims live;
- `git show -M <sha>` for the patch itself, **without which the Loss lens cannot
  run** — that focus area requires diffing every touched doc against the
  baseline [read: `DEV.md` § AR-5: Pre-Merge Review — _"diff every touched doc
  against the baseline and enumerate anything present at baseline, absent in the
  result, and missing from the loss ledgers"_], and a status letter is not a
  diff.

The decisive reason for the per-commit form is that AR-5 must audit **commit
bodies** [read: `DEV.md` § AR-5: Pre-Merge Review — _"across the whole
changeset, every repo-state claim in the prose and the commit bodies carries
…"_], and this wave's loss ledgers exist only there; a path-scoped range diff
shows none of them.

The same two directories also carry foreign commits since 1.4 — `651ad312`,
`e7f693a8`, `c714199a` as of `df2c0dee` [measured: `git log --oneline
a7be59e6..HEAD -- src/lib/study-lenses/lib/screening/
src/lib/study-lenses/language-levels/`]. They are named to the reviewer as
not-ours. **Re-run the command rather than trusting the list**: unlike the count
above, a stale list still reads as authoritative.

### FLAGs carried out of wave 1

**Found, deliberately not acted on.** These are a transport out of the wave's
commit bodies into one place — **Phase 0's `2437801d` included**, which is the
source of four of the nine and which an earlier draft of this line omitted by
saying "the four increment bodies". Each row names its source and what was
compressed [read:
[DEV.md § Documentation migration discipline](../../DEV.md#documentation-migration-discipline)].

1. **`jej/tests/validate.test.ts` parses at `ecmaVersion: 'latest'` and analyzes
   at `2024`** — lines 10 and 11, precisely the version drift this leaf exists
   to prevent, on a jej-side parse outside Wave 1's scope [measured 2026-08-05:
   the two lines read together]. Source: `f89fcb7c` body.
2. **`jej/get-child-nodes.ts` is dead code** — the only importer of _that_
   module is its own test [measured: `git grep -n "get-child-nodes\.js" -- src`
   → the jej module has one importer, `jej/tests/get-child-nodes.test.ts`; the
   other ~40 hits resolve to the **two** other `get-child-nodes.ts` modules,
   `embody/lib/parse-old/` and `study-lenses/lib/socratizing/` — the deprecated
   tree's hits import the former by a longer relative path rather than being a
   third module [measured: `find src -iname "get-child-nodes.ts"` → three files,
   jej's among them]. **The command must be repo-wide and the hits triaged by
   module** — a jej-scoped grep cannot evidence the claim, and an unscoped count
   alone suggests the opposite. Source: `f89fcb7c` body, whose scope caveat an
   earlier draft of this row dropped.
3. **`lib/loop-guard/splice-loop-guards.ts`** parses with
   `{ ecmaVersion: 'latest', sourceType, locations: true }` — a string language
   year where the published contract is numeric, and `locations` where the
   contract carries `ranges` [measured 2026-08-05:
   `src/lib/study-lenses/lib/loop-guard/splice-loop-guards.ts:110`]. Quoted in
   full: an earlier draft of this row elided `sourceType` while presenting the
   object as literal. Not unified here. Source: `2437801d` body [measured: of
   the six wave SHAs, only `2437801d`'s body mentions loop-guard].
4. **`KNOWN_JS_GLOBALS` stays in jej** — a deliberate non-move, already ledgered
   in `2437801d`.
5. **`DOCS.md` still labels the refusal category "the not-allowed message"**,
   which no longer matches the code's wording after H1/H3 — two sites, at
   `screening/DOCS.md:48` (prose) and `:89` (**inside the Mermaid fence**, where
   no link or spell check reaches) [measured 2026-08-05: `grep -n "not-allowed"
   src/lib/study-lenses/lib/screening/DOCS.md`]. `a7be59e6` deferred this to the
   wave-close `docs:` commit, which is where it is executed — it is listed here
   as owed, not as carried past the wave. Source: `a7be59e6` body,
   `FLAG — not acted on`.
6. **Wave 2's node-type inventory will re-admit `var` unless it maps rules.** An
   inventory can only synthesize `true`, so a program containing any declaration
   would yield `VariableDeclaration: true` regardless of the floor — which the
   level's own `checkVariableDeclaration` currently refuses. Stated in the
   future tense deliberately: **no node-type inventory exists in the repository
   yet**, so this is a Wave-2 design risk, not a live defect. Source: `2437801d`
   body.
7. **`getChildNodesWithPath`'s returned array is not frozen**, and Wave 1 is
   what makes that worth re-deciding: the move promotes the function into a
   documented composable export, and a caller invited to compose around it
   carries no read-and-discard obligation. The maintainer's options are freeze
   and measure, or keep it unfrozen **owning the perf trade** — the function
   runs once per node across a full recursive descent, unlike the once-per-call
   siblings that do freeze. Note that the second option needs that perf basis:
   `DEV.md`'s exception is scoped to hot paths "where profiling shows freeze
   overhead is unacceptable", and the current JSDoc reason is transience, not
   perf, so it does not yet fit the `// perf: skip freeze — [reason]` form.
   Behavior unchanged. Source: `f89fcb7c` body [relayed there from `ar-4`
   concern 3].
8. **The pinned-guard hook is unregistered.** An uncommitted working-tree edit
   to `.claude/settings.json` removes its `Edit|Write` `PreToolUse` block, and
   nothing re-arms it, while
   [DEV.md § Pinned expectations](../../DEV.md#pinned-expectations) asserts the
   defense [measured 2026-08-05: `git diff -- .claude/settings.json`].
   `git diff` shows a working-tree deletion, not an author or an intent — no
   attribution is claimed. Not this campaign's file to repair; it is recorded
   because 1.4 planted `PINNED` markers that nothing currently defends, and it
   is why H6 rules 1.5's markers out until the guard returns. Raised to the
   human directly, not left to this ledger.
9. **[DEV.md § Directory Documentation Convention](../../DEV.md#directory-documentation-convention)
   contradicts its own template on the data-flow heading level.** Its prose
   bullets require a `## Data flow` section; the fenced template inside the same
   section nests `### Data flow`, and both recent exemplar leaves — including
   this one — follow the template [read: that section, prose — _"A **`## Data
   flow`** section with a Mermaid flowchart diagram"_ — against its own fenced
   template's `### Data flow`; measured 2026-08-05: `grep -n "^#\{2,3\} "
   src/lib/study-lenses/lib/screening/DOCS.md` → `###`]. **Cited by heading, not
   by line**: an earlier revision of this row gave `DEV.md` line numbers that a
   same-day peer commit invalidated within the hour, which is the rot
   [DEV.md § Section citations](../../DEV.md#section-citations) warns about —
   _"Never cite a document **section** by `file:line`"_. Governance surface, so
   the human's call, not an agent's. Source: `2437801d` body — the FLAG the
   earlier draft of this list omitted.
