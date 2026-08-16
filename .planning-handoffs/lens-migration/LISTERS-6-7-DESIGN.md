<!-- TRANSITIONAL — a DESIGN awaiting a human ruling and its own AR cycle. It
amends nothing yet. Fold into FIDELITY-METHOD.md §§ 4-5 when ruled, then delete. -->
<!-- cspell:ignore parsonizer ugrep classref switchoff blankenate socratize dropdowns writeme parsons -->
<!-- cspell:ignore behaviour oldd clauding jsparson qlcjs pointcut -->
<!-- cspell:ignore generalisation -->
<!-- a Gen-1 class name and the deliberate substring M-A2 plants against it;
     do not "fix" either spelling — the near-miss IS the mutation test: -->
<!-- cspell:ignore errormsg errorms -->

# Listers 6 and 7 — a design for Gen-1's second root

**Status: DESIGN ONLY. Nothing here is built, ruled, or in force.**
[SPEC.md § Gen 1's second root](./SPEC.md#gen-1s-second-root--the-lens-file-is-often-only-a-shell)'s
embargo still stands — _no ledger records a lister result for the
`public/static/` root_ — and it stands until a human rules on this document and
it passes AR-1 and AR-2. Building it is a **fresh session's** work:
[AGENTS.principal.md § Handoff agency](../../AGENTS.principal.md#handoff-agency--the-agent-owns-the-call)
sends a design-ahead unit to a fresh session unconditionally.

**Provenance.** Designed by a Plan subagent, 2026-08-16. Every claim below is
tagged: `[relayed: plan-agent]` where the orchestrator did not personally re-run
it, `[measured: …]` where it did. **A relayed number is not a measurement** —
one of them was already wrong (below), which is the argument for the tagging.

## Why the existing listers cannot simply be pointed at the second root

Reproduced independently before designing anything:

- **Lister 4's single result there is false, not merely incomplete.** Run over
  the `parsonizer/parsons.css` + `parsons.js` pair it reports `sortable-code` as
  the one orphan of a `defined` set of size 1 — and `sortable-code` is
  referenced **15 times** from `parsons-iframe.html` and `component.js`, which a
  pair-shaped lister never opens [measured 2026-08-16: `grep -rn "sortable-code"
  static/parsonizer/*.js parsons-iframe.html | grep -v min.js | wc -l` → 15].
  _(The design pass reported 12 for this; the orchestrator re-ran it and got 15.
  Same direction, and the row it kills either way.)_
- **The stylesheet's 17 unique class tokens decompose as 12 live + 5
  comment-only** — a split no existing lister makes [measured 2026-08-16: naive
  token count → **17**; the decomposition is `[relayed: plan-agent]`].
- **Lister 5 channel B returns a vacuous zero**, searching for React idioms a
  jQuery IIFE cannot contain [relayed: plan-agent].

## Two environment facts that bind every command published here

- **`/usr/bin/grep` on this machine is `ugrep 7.5.0`, not GNU grep** [measured
  2026-08-16: `grep --version`]. It **rejects ERE backreferences** and
  **warns-and-ignores `--include=`**, and the warning goes where nobody reads
  it. Two draft commands died on this. Published commands therefore extract with
  `perl`, whose behaviour is identical on a reviewer's machine.
- **The engine set is heterogeneous, not uniformly pre-module.** `parsonizer/`
  is a jQuery IIFE while `wc-trace-table/configurable-button.js` opens with
  `import`/`export class` [relayed: plan-agent]. A "pre-module JavaScript" test
  must not assume one module shape.

## Lister 6 — `classref`, a graded class-reference test

Three stages, and **the staging is the design**: stage 1 alone _is_ lister 4.
The measured failure is in the **corpus**, not the regex.

- **Stage 0 — a corpus resolver** that follows `<link href>` from the stylesheet
  to its host HTML, then `<script src>` to every script that host loads, then
  back to anything naming the host. For `parsons.css` it resolves **1 host, 8
  files**, including `src/lenses/ParsonsLens.jsx` — crossing back into the
  _first_ root, which is correct, because the shell can name engine classes
  [relayed: plan-agent].
  - **The resolver must `die` rather than under-resolve.** Three drafts silently
    under-resolved and returned plausible output. A resolver that cannot fail
    loudly is a false-orphan generator.
  - **Exclude `*.min.js`, and that is measured rather than stylistic**: with the
    minified jQuery files in, the orphan set is `testcase`; with them out it is
    `fail testcase` — jQuery's minified source contains the token `fail`
    (Deferred's `.fail()`) and spuriously clears that class [relayed:
    plan-agent].
- **Stage 1 — definition extraction** that strips comments first _and captures
  them separately_, then takes every `.token` **anywhere in a selector**, not
  just line-initial. That last clause repairs
  [FIDELITY-METHOD § 4](./FIDELITY-METHOD.md#4--orphan-css)'s declared lower
  bound: `.bwMode .codeContent` registers **both**, where the published lister
  registers only the second.
- **Stage 2 — a graded verdict**, because a binary referenced/orphan call is
  what produced the false entry:

| tier   | reads                                                                                       |
| ------ | ------------------------------------------------------------------------------------------- |
| **T1** | `class=` / `className` values, `addClass`/`classList` calls, quoted selector strings `'.x'` |
| **T2** | a bare string literal equal to the class name                                               |
| **T3** | the bare token anywhere — reported as a number to read, **never as a verdict**              |

`T1>0` → referenced · else `T2>0` → referenced via literal · else `T3>0` →
**ORPHAN CANDIDATE** · else **ORPHAN CONFIRMED**.

**T2 exists because of a measured idiom**: `parsons.js` holds
`correctPosition: 'correctPosition'` and applies it through
`FEEDBACK_STYLES.correctPosition` — an indirection table T1 cannot see [relayed:
plan-agent].

**The result over both roots**: 1 confirmed orphan (`testcase` — zero hits at
every tier, tree-wide [measured 2026-08-16: `grep -rlw 'testcase'` over both
roots, excluding `min.js` and `.css` → **no files**]), 2 candidates, and
`sortable-code` cleared with a citable line.

**A loss class no existing lister can express**: 5 classes whose **markup still
ships while their styling is commented out** — `parsons.js` emits `class='msg'`,
`class='expected output'`, `class='actual output'` against rules sitting inside
`/* … */` [relayed: plan-agent]. Combined with the confirmed orphan, Gen-1
parsons' whole test-feedback presentation layer is dead — half orphaned, half
commented.

**Inline `<style>` is a first-class definition site.** `parsons-iframe.html`
defines **15 further classes** a stylesheet-only lister never sees, including
`guess-entry`, which FIDELITY-METHOD § 4's own prose cites. Of those 15, 14 are
referenced and 1 is a candidate — the iframe's inline board is live and coherent
[relayed: plan-agent].

### What lister 6 structurally CANNOT see

- **Computed class names** — `'block' + type`, template literals. Had
  `FEEDBACK_STYLES` used concatenation, four classes would have become false
  candidates.
- **Vendor-injected classes** — `ui-sortable-helper` is added by jQuery UI at
  runtime and reads as a candidate forever.
- **Ordinary-English class names can never reach CONFIRMED.** `fail`, `pass`,
  `error`, `correct`, `output` are contaminated by prose at T3 by construction —
  5 of `parsons.css`'s 12 live classes are permanently stuck at CANDIDATE. That
  is the deliberate cost of not shipping a false entry.
- **T2 can only clear a class, never orphan one.** It errs safe, but a T2-only
  clear is not evidence a human should quote.
- **It does not parse CSS**, and would mis-read nested at-rules or CSS-in-JS.
- **Dynamically loaded assets are invisible**, and a short corpus is exactly how
  false orphans are manufactured.

## Lister 7 — `switchoff`, for pre-module JavaScript

Preserves [FIDELITY-METHOD § 5](./FIDELITY-METHOD.md#the-five-listers)'s
two-channel split and its prohibition on summing them.

- **Channel A — a list, never a count.** 206 statement-shaped commented lines
  across 20 files, carried for Pass 2 [relayed: plan-agent]. The size of the
  reading list is stated; no headline number is published from it.
- **Channel B — suppressed features, counted _with a denominator_.** The
  pre-module analogue of `// export const render` is **a commented-out
  connection point**: the body ships, the line that _connects_ it is switched
  off. Allowlist derived by reading the tree: `registerX(` ·
  `customElements.define(` · `window.X =` · `globalThis.X =` · `module.exports`
  · `export const|function|class|default` · `.addEventListener(` · `.on('…'`.
  Contiguous `//` lines collapse into one block = one feature.

**Result: B=5, denominator 336 blocks / 728 lines / 46 files** [relayed:
plan-agent]. Each was read and confirmed a real feature. Two matter beyond their
own row:

- **`prism/toolbar.js`** carries a fully-written copy button suppressed at its
  registration boundary — against **15 live registrations and 1 commented**
  [measured 2026-08-16: `grep -c '^[^/]*registerButton'` → **15**;
  `grep -c '^\s*//.*registerButton'` → **1**]. That ratio is the finding, and it
  sits on the coloring foundation's own launcher surface.
- **`ask/component/ask-me.js`** has `ask-javascript`'s question-type switcher
  and its entire multiple-choice configuration UI commented out at the
  event-wiring boundary [relayed: plan-agent]. This **corroborates from the
  engine side** what § 5 already records on the shell side as
  `// export const renderConfig` for `ask-javascript` — the same suppressed
  feature found in both roots by two different instruments, which strengthens
  the boundary obligation owed to the socratize-quiz campaign (`bnd-001`).

### The denominator is the anti-vacuous-zero mechanism

This is the direct fix for lister 5's meaningless zero. The check **exits 2 with
`NO RESULT`** rather than reporting a clean zero when it did not reach
applicable input:

| result   | denominator                   | reading             |
| -------- | ----------------------------- | ------------------- |
| `B=5`    | 336 blocks / 728 lines        | meaningful positive |
| `B=0`    | 44 blocks                     | **true zero**       |
| lister 5 | 0 React idioms possible there | **vacuous**         |

### What lister 7 structurally CANNOT see

- **Suppression that is neither commented nor a falsy guard** — a feature made
  unreachable by deleting its only caller. There is no static test for this.
- **`/* */` block comments.** Measured cost on this tree today: **zero** — 24
  block comments in scope, none containing a connection point [relayed:
  plan-agent]. A real gap elsewhere; stated as a measurement, not a reassurance.
- **The allowlist under-reports by construction.** `registerButton` was not in
  the first draft and was found only by reading `toolbar.js`. Channel B is a
  **lower bound**, exactly as § 4's counts are.
- **Block granularity cuts both ways** — two suppressions in one block count
  once; one feature split by blank lines counts twice.
- **It cannot say _why_.** "Deliberately switched off" and "dead scaffolding"
  are indistinguishable to it; that adjudication is Pass 2's.

## Mutation tests — nine planted, nine fired

Recorded because
[FIDELITY-METHOD § Failure modes](./FIDELITY-METHOD.md#failure-modes-this-method-has-already-hit)
holds that a check published untested is how five of six gate lines shipped dead
[all relayed: plan-agent]:

| #        | planted                                            | proves                                                                 |
| -------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| **M-A1** | a new unreferenced class                           | new orphans are detected                                               |
| **M-A2** | `.errorms`, a strict substring of live `errormsg`  | **substring trap defeated** — tokenization is real                     |
| **M-A3** | comment out a live rule, and un-comment a dead one | the comment fence works in **both** directions                         |
| **M-A4** | **corpus dropout** — run on the pair alone         | **reproduces lister 4's exact shipped defect**                         |
| **M-A5** | break the `FEEDBACK_STYLES` literal                | T2 literal-reading is load-bearing                                     |
| **M-A6** | rename `sortable-code` everywhere                  | the clear is evidence-driven, not hardcoded                            |
| **M-B1** | plant a suppression in a clean file                | detected — but see below                                               |
| **M-B2** | un-comment the copy button                         | the finding disappears **and the resulting zero is demonstrably true** |
| **M-B3** | comment-free input                                 | `VACUOUS … NO RESULT`, exit 2 — **the anti-lister-5 guard**            |

**M-A4 is the one to keep as a standing regression test**: it is the only
mutation that reproduces the shipped defect, and it fails in the dangerous
direction.

**M-B1 initially did not fire**, because the plant was appended adjacent to an
existing finding and merged into its block. That was a mutation-placement error,
not a check defect, and it is worth recording: **a mutation planted next to an
existing finding tests nothing.**

## Five cross-cutting rules this design proposes

Each is a generalisation of a defect this campaign has actually shipped:

1. **A check's corpus is part of the check and must be printed.** M-A4 shows a
   starved corpus manufactures false orphans from a correct regex. Lister 4's
   defect is a **corpus** defect, not a pattern defect.
2. **Resolvers must fail loudly.** Three drafts silently under-resolved and
   returned plausible output; none would have been caught by reading the code.
3. **Every count carries a denominator.** `B=0 / 336 blocks` and
   `B=0 / 0 blocks` are different claims and must not print identically.
4. **Verdicts are graded, not binary.** CONFIRMED / CANDIDATE / referenced — §
   5's _"a false entry is worse than a missing one"_ implemented by making the
   ambiguous case a **named state** instead of a coin flip.
5. **Never sum.** Six incomparable quantities here: a 206-line reading list, 5
   suppressed features, 1 confirmed orphan, 2 candidates, 5 switched-off-styling
   classes, 15 inline-`<style>` definitions.

## The caution that travels with this document

**The design session produced four commands that returned confident false
output** — a `$tok{$_}`/`$tok{$1}` slip reporting 12 orphans, a `[[:quote:]]`
non-class silently voiding an ERE and printing 0, a `local $/` slurp corrupting
every path, and ugrep's ignored `--include` [relayed: plan-agent]. Each looked
correct; each was caught only because the expected answer was already known.

That is the empirical case for mutation-testing every check **before**
publication — and the reason the tables above report mutant output rather than
asserting the checks work.

## What a fresh session must do before any of this runs

1. Take a human ruling on the design.
2. Run **AR-1** and **AR-2** over it — AR-2's structural artifact on a
   documentation changeset is the workflow-shaping block being rewritten, and
   the dispatching agent names it in the prompt
   ([DEV.md § AR-2](../../DEV.md#ar-2-architectural-sketch-challenge)).
3. Re-measure every `[relayed: plan-agent]` claim above and re-tag it
   `[measured:]`, or strike it.
4. Only then fold the checks into FIDELITY-METHOD §§ 4-5, lift SPEC's embargo,
   and re-seed `parsons` against the widened root — the step
   [RESUME.md](./RESUME.md) § Where to start calls item 3.
