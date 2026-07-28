<!-- cspell:ignore aithor unparseable ungated Begel unioned -->

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

| #   | Concern                                                                  | Resolution                                                                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5   | Node-type inventory drastically stricter for held `vary` level           | Adopted the reviewer's option (a): inventory unions with a named **structural floor** (envelope/wrapper/identifier/literal/declaration node types), pinned as data in the Wave-1 leaf.                                                                                                                   |
| 6   | Vary-derived dataset's empty `admittedGlobals` would steer "use nothing" | Ruled: an empty set renders **no** vocabulary clause — silence, never a prohibition. Stated in the README.                                                                                                                                                                                               |
| 7   | Size violations lose `limit`/`actual` if collapsed into Finding          | Size violations keep their structured shape (dimension/limit/actual) beside gate findings as repair fuel; the types draft carries `SizeViolation` forward.                                                                                                                                               |
| 8   | Q3 overstates learner reachability                                       | Stated: Q3 is reached through a consumer-owned learner vocabulary compiling to a dataset (P7's layer); aithor's surface is machine-facing.                                                                                                                                                               |
| 9   | Evals blast radius unscoped; attempt-bound justification circular        | Scope lives in `SEQUENCING.md` per wave. Bound re-justified on its own terms (repair-turn latency ceiling); the evals' 1\|2\|3 narrowing cited as downstream evidence, not reason.                                                                                                                       |
| 10  | Naming collisions                                                        | Adopted: config field `allowlist` (not `constraints`); **progress event** (not phase); glossary head **Signal**; `vary.languageLevel` → **`vary.syntax`** (annotated as a Wave-2 breaking rename); profile examples use data names (`ast`), not display labels; `raw` and `gate` kept as named homonyms. |
| 11  | Which result field carries raw output                                    | Ruled: `AithorResult` unchanged; `program` carries the byte-exact raw string on the raw path (as the committed implementation does). The raw-is-a-flag argument corrected: a gate cannot be steered, so `raw` beside `gate` throws — that, not field selection, is why raw is a flag.                    |
| 13  | "No mode flag" commitment overstated                                     | Restated honestly: enforcement is derived from filled slots, and filling `gate` demotes the allowlist to steering — the stated price of complete-and-final.                                                                                                                                              |
| 14  | `Violation` ownership blocks the Wave-1 leaf                             | Adopted the reviewer's option (a): `Violation` moves to the leaf; the levels region re-exports it so existing consumers keep their import. Recorded in `SEQUENCING.md` Wave 1.                                                                                                                           |
| 15  | Size-repair vs brokenness-profile ping-pong                              | Named in the README as an accepted interaction edge, covered by the bound.                                                                                                                                                                                                                               |
| 16  | Ratified content dropped by attrition                                    | Restored: tight-requests-cost-more; offline-not-zero-footprint; Theme; the Begel & Ko both-yes; the figure referenced via the canonical quad treatment.                                                                                                                                                  |
| 17  | No real links                                                            | Real relative links restored (current-seat paths; Wave 3 re-homes).                                                                                                                                                                                                                                      |
| 18  | Four positional params (CP-D: curry the runtime)                         | **Declined**: the consumer socket pins the `aithor(program, config, runtime)` transcription; a 4th optional arg is additive, currying is a second breaking reshape for marginal gain.                                                                                                                    |
| 19  | `onProgress` throw behavior                                              | Ruled: wrapped and swallowed — observation must never change the outcome.                                                                                                                                                                                                                                |
| 20  | Empty `nodes` table                                                      | Ruled: a legitimate, honestly-unsatisfiable request (attempt-bound refusal), not a config-shape throw.                                                                                                                                                                                                   |
| 21  | `steering` without an allowlist                                          | Ruled: rendered regardless — it is prose steering either way.                                                                                                                                                                                                                                            |

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
