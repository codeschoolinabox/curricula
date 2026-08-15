<!-- cspell:ignore actioned affordances checkpointed cutover respecified spellme unbuilt wireframes -->

# orchestrate ux — resumption point

**State: Phase 0 step 0.2 is written and NOT closed. AR-1 is at round 3 with a
PAUSE and SEVEN open findings.** Do not start 0.3 until they close.

**Read the governance chain first**, before this file's task list: the repo-root
`CLAUDE.md` is a router — check your model id against its qualifying list and
read whichever of `AGENTS.principal.md` / `AGENTS.md` matches. Both point into
`DEV.md`, which defines every term this document uses as if shared:
`prospective` (§ Prospective and retrospective documentation), `ceremony` and
`twin-doc` (§ Work routing and ceremony), "step 0.2" (§ Phase 0), PAUSE
semantics and the AR protocol (§ Adversarial Review Protocol), and the settings
line.

Everything below is measured or read at `8cc4bc15` unless tagged otherwise. This
document was validated by a context-free agent, which found four factual errors
in its first draft; those are corrected here, and the exercise is why you should
still re-measure anything you rely on.

## What this campaign is

A UI revamp of `src/lib/study-lenses/orchestrate/`, the one component the host
mounts. Its internals are built, covered and browser-checkpointed; its interface
was never designed — the region carries **zero stylesheets** and its whole shell
is six inline style objects over unstyled native controls. The maintainer has
ruled the existing DOM, tests and UX are "quick hacks so I could eyeball the
plumbing" — **scaffolding, not contract.**

`work: software · twin-doc: user · ceremony: full · prospective`

That line belongs in the **commit body**, not in a plan file — see § Commit
form.

## Commits — this campaign only

The tree is shared with concurrent sessions; scope every claim to these SHAs.

| SHA        | What                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------- |
| `bf36ab49` | 0.1 — README registers `ux/`, adds the first glossary terms                               |
| `dafcffd4` | 0.2 — the three-document twin + the selection pass                                        |
| `a1f4d132` | AR-1 round 1 resolution — CP1 restructure, `house token` rename, the Rail override        |
| `8cc4bc15` | AR-1 round 2 resolution — empty-station copy restored, `barring edge`, station retirement |

Baseline for AR-5: **`80306ad9`**.

**Your green baseline is the orchestrate tree, and only it: 622 passing in 22
files** [measured: `npx vitest run --project unit
src/lib/study-lenses/orchestrate`].

**The repo-wide run is red and most of it is not yours.** [measured 2026-08-15:
`npx vitest run --project unit` → **8 files failed, 41 tests failed**, 414 files
passed]. The failing files: `scripts/lib/check-tables/` (a test importing a
`find-table-defects.mjs` that does not exist), `src/plugins/study-lenses/`,
`src/lib/embody/lib/evaluating/shared/guard-loops/`, and five under
`src/lib/study-lenses--deprecated-architecture/`. **`lenses/spellme/` does NOT
fail** — an earlier draft of this file said it did, and that was wrong. None of
the eight is this campaign's; do not try to fix them and do not measure yourself
against the repo-wide number.

## Human rulings — binding, do not re-litigate

All 2026-08-14 unless noted.

| Ruling                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------- |
| `twin-doc: user`; the twin is three documents — personas, user-journeys, wireframes                                                    |
| The twin sits at `orchestrate/ux/`, not package level — "the orchestrator is what gives it a UX"                                       |
| `ceremony: full`                                                                                                                       |
| "Visible, explicit and **KISS**"; open mind for entirely new UX                                                                        |
| **"The UI renders what the embodiment suggests"** — faithful projection, 0→N lenses per phase, no redesign                             |
| Empty phases are acceptable; **lens-building is out of scope**                                                                         |
| `lib/colorizing` (planned, not built) owns the code surface; this campaign owns the house token vocabulary; lens adoption is voluntary |
| Absorb the three accessibility defects into this campaign                                                                              |
| The deprecated tree's 737 lines of orchestrator CSS are **wholly superseded** — nothing ported                                         |
| **The arrangement is the Rail** (candidate A), overriding the selection pass's synthesis                                               |
| `break` → **the barring edge**                                                                                                         |
| `station` is **kept**, and its retired sense (a synonym for `phase`) is formally retired                                               |
| Fix the blockers, then hand off                                                                                                        |

**Two of these have no dated home in the documents they bind** — that is finding
7 below. `DEV.md § Ruling provenance`: "A ruling recorded only in a commit body
is findable but not readable where it binds."

## THE SEVEN OPEN FINDINGS — the next session's first task

**Findings 1–5 are AR-1 round 3's, independently verified, all holding. Findings
6 and 7 are AR-1's lower-severity items promoted by the outgoing session; they
carry no independent verification.** Re-verify everything — this repo's standing
lesson is that an AR verdict is itself a claim.

**Findings 2 and 5 are NOT mechanical.** They are design decisions wearing edit
clothing. Budget for judgment, and consider putting 5 to the human.

### 1 · `break` is still the live vocabulary; `barring edge` is glossary-only

The rename landed in the glossaries and not in the prose. Unwrapped counts
[measured: `tr '\n' ' ' < f | grep -oiE "\bbreaks?\b" | wc -l`]:

| file                  | `barring edge` | `break` occurrences |
| --------------------- | -------------- | ------------------- |
| `README.md`           | 3              | 3                   |
| `ux/wireframes.md`    | 5              | **12**              |
| `ux/personas.md`      | 0              | **4**               |
| `ux/user-journeys.md` | 0              | **4**               |
| `DOCS.md`             | 0              | 1                   |

**THE RENAME RULE, because the counts are not work items.** Only the **noun
meaning "the point at which the machine stopped"** becomes `barring edge`. These
stay:

- the ordinary verb — "a single shared slot would **break** that split", "a
  drawn line is the first thing to **break** under a host's font stack";
- the learner's action — "0:20 — they **break** it";
- the sanctioned negation in the glossary — "Deliberately not 'the **break**'…",
  which must keep the retired word to be legible at all. The README's 3 and
  `DOCS.md`'s 1 are all in these categories and need no edit.

Undecidable cases you must rule on and then apply consistently: the section
heading `## The parse breaks — the machine stopped`, and "When the parse
**breaks**". **Whatever you decide becomes contract — say which in the commit
body.**

`ux/wireframes.md:134` — "the same one that draws one break and one cause" —
**was added by `8cc4bc15` itself**, forty lines below the entry retiring the
word. `personas.md`'s Frogrammer requirement is still named "Reading the break
once", i.e. the standard the wireframes are judged against, in a retired term.

**Done when:** no noun-sense `break` survives in the four files, and the
undecidable cases are ruled and recorded.

### 2 · The announcer has NO surface class — and fixing this REVERSES the previous commit

`ux/wireframes.md:84-86` replaced the announcer's class-2 claim with three
rules. But `:552` still says "a permanently-mounted, visually-hidden **class-2**
live region", and `:571` still says "It is **class 2 by argument**, not by
ruling."

**Read this before deciding it is a deletion.** The placement rule does not
confer a class:

> "The class of a surface is a static fact of what the surface IS — nothing
> derives it at runtime, **and it does not follow from which container the
> surface renders in**" [read: `orchestrate/lib/masking/README.md`]

Class 3 is "everything else", and
`SurfaceClass = 'editor-based' | 'meta-control' | 'maskable'` [read:
`orchestrate/lib/masking/types.ts`]. **So by the region's own exhaustive
taxonomy the announcer is class 3 and goes `inert` under strict** — precisely
what its placement rule exists to prevent ("a silenced announcer is worse than
none"). Deleting `:552` and `:571` leaves the announcer class-less and shipping
that bug.

**So the fix is to REVERSE a deliberate decision from `8cc4bc15`**, whose body
says "THE ANNOUNCER IS RESPECIFIED AS RULES, NOT AS A BORROWED CLASS." That
reversal is sanctioned by AR-1 round 3 and is the recommended path — but state
it as a reversal in your commit body rather than presenting it as tidying.

AR-1's counter-proposal: widen class 2 rather than escape it — "meta-level
**nodes** that must survive every posture: the meta-level controls, and the
announcer, which is not a control but must never go inert." `SurfaceClass` stays
at three members.

**"One sentence" is wrong by a factor of four.** The class-2 definition has four
homes [measured]:

- `orchestrate/README.md` § Enforcement (prose)
- `orchestrate/README.md` glossary, `surface classes` entry
- `orchestrate/lib/masking/README.md`
- `orchestrate/lib/masking/types.ts` (JSDoc on `SurfaceClass`)

plus citation sites in `ux/wireframes.md` and `DOCS.md`. **Two of the four live
in `lib/masking/`, a different module with its own Phase-0 contract — whether
editing it is in scope at 0.2 is unresolved and is worth asking the human.**

**Done when:** the announcer has a stated class, every one of the four
definitional homes agrees, and no text contradicts the decision.

### 3 · `station` is on a banned-term list — instructed by handoffs, NOT machine-enforced

[read: `.planning-handoffs/study-lenses-phase0-2-keystone-contracts.md:140` —
"Banned-term grep before any commit (full output, never truncated): `kernel ·
station · applicableTo · isJeJ · admission gate · plugin · picker · dial · run
button · creation-as-phase`"]. Two more live handoffs instruct agents to run
that grep by hand, and one records "**Migrated content counts as new writing
(maintainer ruling, 2026-07-15). There is no migration exemption.**"

**There is no mechanized gate** [measured: `.husky/pre-commit` is `npx
lint-staged`; lint-staged runs `prettier --write` only; no script greps banned
terms]. An earlier draft of this file called it a pre-commit gate — that was
wrong, and it would have sent you hunting for a hook that does not exist. The
finding still holds: the next agent who runs that grep by hand over
`orchestrate/**` gets hits and has no evidence the ban was lifted.

**Done when:** the README's `station` glossary entry names the ban and its
2026-08-14 override.

### 4 · The restored empty-station copy did not reach the artifact that constrains 0.3

- **4a** — `README.md` names neither "four phases have nothing to open yet" nor
  the spoken per-station reason [measured: unwrapped grep → 0]. The README's
  copy-ownership contract is its `display labels` entry, which `8cc4bc15`
  extended to absorb the fit-mark copy and did not extend to absorb this.
  `user-journeys.md` says "Not a specification — the region README is that."
- **4b** — the line renders in **one full frame of three**. "Full frame" means a
  drawing showing the whole instrument top to bottom; there are three
  (`## Fresh mount`, `## Strict, covering — editor mode`,
  `## An excursion open`). The latter two draw four bare `·` with no reason.
  Excerpt drawings omitting it are fine.
- **4c** — "**four** phases have nothing to open yet" is a **derived count**
  with no stated derivation. `spellme` declares `phase: 'tokens'` and is not yet
  on the built-in roster [measured: `lib/composing/built-in-lenses.ts` →
  parsons, writeme, debug-props]; when it lands the sentence must read "three".
  Every other learner-facing string here is keyed and zipped against a constant.

**Done when:** the copy and its derivation rule live in the README's display-
labels entry, and all three full frames draw it.

### 5 · `station` is defined as a control, and four of five are not — DESIGN DECISION

Both `README.md` and `ux/wireframes.md` define **station** as "the rail's
per-phase **control**". `wireframes.md` also says a station with nothing to open
has "**no tray and no disclosure control at all**", and four of five phases are
in that state today.

Two load-bearing arguments rest on the false half: the rail's class-3 argument
("**Because its stations are controls**, the rail is unambiguously class 3 —
there is no control-free part of it"), and the announcer's reason for existing
("The rail's stations are controls, so the rail cannot itself be a live
region").

`Station` is the first type 0.3 writes. Is it a control, or a discriminated
union —
`{ phase, label, mark } & ({ kind: 'openable', tray } | { kind: 'bare' })`?
AR-1's counter-proposal is the union, plus rewriting the class-3 argument on a
ground that survives a kit of zero: _the rail dims whole because it is one
element in the maskable container, and partial dimming of a lifecycle line would
read as a machine state rather than a posture._

**Done when:** the definition and both dependent arguments agree. **Consider
putting this to the human — it shapes the first type.**

### 6 · "accessible name" is the wrong mechanism _(promoted, unverified)_

`wireframes.md` says each empty station carries its reason "in its **accessible
name**". An accessible name is computed for elements with a role; an empty
station explicitly has no control, and `aria-label` on a role-less generic
element is a no-op. Say **visually-hidden text inside the station**.
`personas.md` already licenses it. Note it reaches Journey 6's linear reader
(`## Journey 6 — through a screen reader`) and **not** Journey 5's
(`## Journey 5 — by keyboard only`), who traverses by control — while the
justification sentence claims "a reader traversing station by station", the mode
it does not serve.

### 7 · Two rulings have no dated home _(promoted, unverified)_

[measured: `grep -rn "human ruling"` over `README.md DOCS.md ux/` → 3 hits]. The
**barring-edge rename** carries no `(human ruling 2026-08-14)` parenthetical in
either glossary entry, and **the Rail selection** — the campaign's most
consequential ruling — is undated and not in the greppable form.

## DEFERRED TO 0.3 — this record is the deferral's only durable home

`8cc4bc15` split AR-1's B3 against the reviewer's counter-proposal: the
**glossary** gained the new vocabulary immediately; the **prose migration** was
deferred here.

**Fix the stated rationale when you do it.** The commit argued the prose
describes "what the region IS and the Rail does not exist yet" — backwards under
`prospective`, where the 0.1–0.3 artifacts are _supposed_ to describe the
unbuilt thing. The real constraint is `DEV.md`'s ban on lifecycle/status
narration in end-state docs, which rules out the obvious patch. The split's
outcome survives; its argument does not.

**Scope** — `strip` counts [measured at `8cc4bc15`: `grep -oci strip`]:

| file                                 | uses                                        |
| ------------------------------------ | ------------------------------------------- |
| `orchestrate/README.md`              | **12** (11 outside the retirement sentence) |
| `orchestrate/DOCS.md`                | 9 — **untouched by this campaign so far**   |
| `orchestrate/phases-panel/README.md` | 6                                           |
| `orchestrate/phases-panel/DOCS.md`   | 8                                           |
| `orchestrate/phases-panel/index.tsx` | 3                                           |
| `orchestrate/phases-panel/types.ts`  | 1                                           |

An earlier draft said 10 for the README; that was `a1f4d132`-era and `8cc4bc15`
added two. **Re-measure at your own HEAD before quoting it — this number has
already gone stale once inside this very document.**

**`phases-panel/` is the deepest and was missing from the commit body's stated
scope.** It is the directory that _defines_ the strip's contract, which the Rail
abolishes. Whether that directory survives at all is 0.3's question.

### Other 0.3 carry-forwards

- **Module homes for the five new nouns** — rail, station, tray, nameplate,
  announcer. `README.md § What lives here` is untouched and still lists
  `phases-panel/ the five-phase study panel`. Nothing says where any of them
  live. This is AR-1's primary lens and four rounds have not touched it.
- **The editor-mode scrim geometry.** `wireframes.md` draws a full-width blocked
  sentence below the code in editor mode. In the live DOM the overlay is
  `position:absolute; inset:0` inside a wrapper whose only children are the
  excursion slot (`null` in editor mode) and the recommendations (rendered only
  when non-empty) — so with no proposals the wrapper is zero-height and the
  sentence has nowhere to go. Either the drawing specifies a restructure or it
  is wrong. jsdom cannot catch this; the tests assert node presence only.
- **The tray-entry/re-open collision.** The tray entry for the open lens closes
  it; the region deliberately allows a proposal to RE-open the open lens,
  re-resolving its config in place. Same lens, two affordances, opposite
  meanings.
- **Editor-mode proposals and the masked generator are asserted in prose and
  never drawn.**
- **`src/lib/embody/language-levels/just-enough-javascript/README.md`'s
  `station` staleness is deeper than the word** — it names `parse` as a phase,
  which has not been a live phase name since the cutover. AR-1 asked for a
  `station`→`phase` edit; declined, because it would make the sentence look
  correct while still naming a nonexistent phase. Left for that level's owner.
  (Note the path: `embody` is a **sibling** of `study-lenses`, not a child.)
- **`src/pages/l1-picker.tsx`'s stale `station` comment** — deliberately not
  actioned; it correctly describes the deprecated tree it renders.

## Commit form — this is convention, not preference

Look at `git show --format=%B -s 8cc4bc15` for the worked example. A commit body
here carries: the **settings line** first; `[measured:]` / `[read:]` /
`[relayed:]` on **every** repo-state claim; a **loss ledger** enumerating every
omission, merge or reword with its justification (silent loss is treated as
severity-equal to a failing test — say "LOSS LEDGER: NO REMOVALS" when true);
the per-file checkpoint results; and a justification if you used `--no-verify`.

## Mechanics that will bite you

- **COMMIT THIS FILE.** It was untracked when written — the deferral's "only
  durable home" was one `git clean -fd` from gone. If you find it untracked
  again, commit it before anything else.
- **Shared worktree, and it moves during your session.** Three files staged by a
  concurrent session sit in the index and are not yours. There are also
  **unstaged foreign modifications including a DELETION** (`MVP-ROADMAP.md`
  deleted, `PEDAGOGY.md` and `lib/questioning/LOSS-LEDGER.md` modified). A
  `git commit -a`, or a pathspec broader than your own files, sweeps another
  session's deletion into your docs commit.
- **Pathspec-commit always**: `git commit -F <msg> -- <paths>`. A pathspec
  commit takes WORKING-TREE content of those paths. Verify with
  `git status --short -- <paths>` first.
- **`--no-verify` is licensed here AND it obliges you.** `orchestrate/README.md`
  carries eight lines of pre-existing tab-to-space fence drift; lint-staged
  would also reformat the peer's staged files. Because you are bypassing the
  hook, run the per-file checkpoints by hand — every one, on every changed file.
- **Per-file checkpoints** (the compound script does not forward file args):
  `npx markdownlint-cli2 --no-globs "<file>"` · `npx cspell "<file>"` ·
  `npx prettier --check "<file>"`. New files: `--write` is safe. Pre-existing
  files: `--check` first, because `--write` reflows drift that is not yours.
- **cspell registration is per-file**, via an inline `<!-- cspell:ignore … -->`
  header. British spellings and coinages need it; check what each target file
  already registers before assuming a word is new.
- **`git grep` and single-line greps LIE on this repo's prettier-wrapped
  markdown.** Unwrap first: `tr '\n' ' ' < file | grep -o "…"`. This campaign
  has been bitten twice.

## Sandbox checkpoints owed at Phase 1

Route: `npm start` → `http://localhost:3000/spiralearn/sandbox/orchestrate/`.
**The `/spiralearn/` prefix is load-bearing, and a missing route still returns
200 from the dev shell — verify in a real browser, never by status code.** Rows
route into `orchestrate/PHASE-1-CHECKPOINT-LEDGER.md`.

| #   | Named action                                                | Expected observation                                                                                       |
| --- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| T1  | Load; read the control row, rail, pane, proposals           | tokens applied; console clean                                                                              |
| T2  | Click the navbar moon                                       | **house tokens AND lens tints both flip** — the observation jsdom structurally cannot make                 |
| T3  | Read the four empty stations parsing, then with `1 +`       | the reason renders; the barring edge names its cause **once**; empty vs waiting legible without reading    |
| T4  | Inject several lenses into one phase; read at 1 and many    | the rail's geometry does not move. **Requires editing `spiralearn/sandbox/orchestrate/index.mdx`**         |
| T5  | Scaffold level + strict + `debugger;`                       | overlay names level and violation; rail dim+inert; Generate code dim+inert at its own element; class 2 lit |
| T6  | Open a lens, then Edit code; press Tab                      | focus lands somewhere meaningful, not `body`. **R-11's third sighting** — two stand; a third promotes it   |
| T7  | Arrow through the lens picker without committing            | **no lens opens**                                                                                          |
| T8  | Screen reader: open a lens; then trip the mask              | both announced; the blocked sentence spoken **once**, not twice                                            |
| T9  | Full keyboard pass; repeat reduced-motion and forced-colors | every control reachable; focus ring visible in both tones; nothing conveyed by opacity alone               |

## The process failure to not repeat

Round 1 produced 3 blockers, round 2 produced 4, round 3 produced 5 — **and
three of round 3's were created by round 2's fixes.** The remedy AR-1 named, and
which this campaign did not apply:

> **After any fix pass, verify the diff — every sentence the fix touched, plus
> every sentence that CITES it.**

Both of round 3's worst findings would have died in a five-minute grep for the
term being replaced. The same failure produced the stale `strip` count inside
this document. Run the grep; it is mechanical and does not depend on judgment.

## Recommended opening move

Commit this file if untracked. Then fix findings 1, 3, 4, 6 and 7 (mechanical),
and decide 2 and 5 — putting 5 to the human. Verify each with a grep for every
sentence citing what you touched. Then re-run `ar-1` (registered agent, **no
`model` parameter**, strictly read-only) over `orchestrate/README.md` plus all
three `ux/*.md` together. Commit the fixes before re-running, so the reviewer
reads a committed artifact.

When it clears, 0.2 closes and 0.3 opens: `types.ts`, the `DOCS.md` sketch
amendment, the vocabulary migration above, and the tests written for real and
committed skipped — then `ar-2`, then the human gate.

Design work should open on the strongest available model tier.
