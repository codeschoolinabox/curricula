<!-- cspell:ignore Aran socratizing unbuilt injectivity -->
<!-- DISPOSABLE. Written for the maintainer, 2026-08-05. Delete once the agents
     you want are running — nothing depends on this file. The durable copy of
     everything here is .planning-handoffs/paren-truth/FOLLOW-ONS.md, committed. -->

# Start here — what's left after the paren-truth campaign

This is your launchpad, not a design doc. Skim § 1 and § 2, then copy whichever
prompt you want from § 4 into a fresh session.

---

## 1. Where things stand

The paren-truth campaign is **done**. embody now parses with acorn's
`preserveParens` internally, folds the parenthesis wrappers back out before
publishing, and records where each pair of grouping parentheses sat as
`entwined.parenSpans`. The published syntax tree is byte-identical to before —
that was verified across ~32,000 parse comparisons, not argued.

**Your repo right now:**

- **8 commits from this campaign, unpushed.** Seven implementation + one
  handoff.
- **Peer sessions committed ~19 more commits interleaved with mine**
  (generator-occupant, governance-dials, evaluators-intercept, socratizing). A
  `git push` sends all of it, not just mine.
- All gates green: `tsc` 0 errors, full study-lenses suite passing, markdownlint
  at its session-start baseline.
- Nothing of mine is uncommitted. The working tree is clean of my paths.

**My commits, in order** (use these SHAs if you ever need to review just this
work — a commit _range_ will sweep in the peer streams):

```text
8da55d2f  add: guard that the published tree stays ESTree-shaped through every grouping
6614142e  add: the parse records where its grouping parentheses sat
59a5ef60  add: the entwined binding publishes where the grouping parentheses sat
d6d4c6d4  fix: a fold defect stays loud instead of posing as a learner grammar error
f6878ffc  docs: correct a wrong test count in the previous commit body
0f178750  docs: NodePath stops claiming an injectivity the parse does not give it
c233db6f  refactor: one membership rule for the region's generic walks
e11714a5  docs: hand off the paren-truth follow-ons, with what a dry run refuted
```

---

## 2. The one decision that's still yours

**Push, or don't.** You deferred it earlier and nothing has changed that. The
only new wrinkle: the peer commits interleaved further while I worked, so the
push is now a bigger blast radius than it was. If you'd rather push only this
campaign, that's a cherry-pick conversation, not a `git push`.

Everything else below is optional work you can start, ignore, or delete.

---

## 3. What's left — the short version

| #      | What it is                                                              | Size             | Worth doing?                                           |
| ------ | ----------------------------------------------------------------------- | ---------------- | ------------------------------------------------------ |
| **F5** | A real crash lurking in the JEJ level's test harness                    | Small            | DONE 2026-08-05 — see FOLLOW-ONS § F5's banner         |
| **F2** | Three cheap test fixtures that protect the fold from silent regressions | Small, test-only | DONE 2026-08-05 — see FOLLOW-ONS § F2's banner         |
| **F1** | An embody wrapper whose `tokens` list is empty when it shouldn't be     | One increment    | DONE 2026-08-11 — see FOLLOW-ONS § F1's banner         |
| **F6** | Tidying inconsistent wording about source positions                     | Three lines      | DONE 2026-08-11 — see FOLLOW-ONS § F6's banner         |
| **F3** | Actually _using_ the paren spans (trace / highlighting)                 | A whole campaign | This is the payoff — but it's Phase-0 work, not a task |
| **F4** | Making `range` a required field                                         | —                | **No.** The evidence says close it. See below          |

### Why F4 is a "no"

I originally wrote this up as worth a campaign. Then I had it checked, and the
check refuted me: only **one** place in the whole codebase uses
optional-chaining on `.range`, and it's a test. Worse, two _production_ parsers
don't pass `ranges` at all — so declaring it always-present would be a lie about
those trees. The recommendation is to close the flag. No prompt for it; nothing
to launch.

### One thing worth knowing about F3

I first described it as "port the trace consumer from the old code." That was
wrong, and a fresh agent caught it: the Aran `parenthesis.enter`/`.leave` events
that the old docs describe **don't exist anywhere in the repo** — the directory
its README lists isn't on disk. So F3 is designing something new, not moving
something. That makes it a real campaign with a Phase 0, not a port. Its prompt
says so.

---

## 4. The prompts

**How to use one:** open a fresh session (`/clear`), paste the whole block. Each
is self-contained — it routes the agent through the governance chain, tells it
what to read, and sets the gates. They were dry-run by fresh agents holding only
the handoff, and the problems that found were fixed before you got here.

**Don't run two of these at once in the same worktree** unless you're
comfortable with concurrent sessions committing into one index.

---

### F5 — the JEJ test-harness crash (recommended first)

> ✅ **DONE 2026-08-05 — do not launch this prompt.** The crash is fixed
> (`2f6720e1`, `d8fa1461`, `e708841c`); see FOLLOW-ONS § F5's banner.

The JEJ level's tests build their own parse facts and pass no `ranges` option.
eslint-scope reads `block.body.range[0]` internally, so any source with a
default parameter shadowed in the function body throws a `TypeError`. The suite
passes today purely because no test fixture happens to hit that shape. There's a
second, subtler issue in the same two lines: the test parses at `'latest'` while
the level contract is pinned to `2024`, so it accepts syntax the level would
reject.

```text
Fix a latent crash in the JEJ level's test parse harness. Repo:
/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula

FIRST — governance routing: read repo-root CLAUDE.md NOW; it routes by model id
to AGENTS.md or AGENTS.principal.md. Read your routed file END-TO-END, then
DEV.md END-TO-END. Governance outranks this brief everywhere they touch.

Read .planning-handoffs/paren-truth/FOLLOW-ONS.md § F5, then
src/lib/study-lenses/lib/screening/parse-settings.ts END-TO-END.

language-levels/jej/tests/validate.test.ts parses with
{ ecmaVersion: 'latest', sourceType: 'module' } and NO `ranges`, then hands the
tree to eslint-scope. eslint-scope/lib/scope.js:730 reads
`this.block.body.range[0]`, so a source with a default parameter shadowed in the
body throws TypeError. The suite passes only because no fixture reaches it.

REPRODUCE THAT FIRST — a source like
'const x = 1; function f(a = x) { const x = 2; return a; }' under the file's own
settings versus { ...PARSE_SETTINGS, sourceType: 'module' }. Do not take it on
trust; § F5 relays it from a validator, not first-party.

Then decide the fix. { ...PARSE_SETTINGS, sourceType: 'module' } fixes the crash
but ALSO narrows 'latest' to 2024, which rejects import attributes and duplicate
named regex groups — a behavior change across 23 existing tests. Check the
fixtures before assuming the swap is free, and if any fixture depends on
post-2024 syntax, take the fork to the human.

Scope note: 'latest' is used at 18 sites across this package, including two
production parsers (evaluators/intercept/wrap-call-expressions.ts,
lib/loop-guard/splice-loop-guards.ts) that also pass no `ranges`. Whether THOSE
should change is a bigger question — do not silently widen this task into it,
but do report what you find.

Ceremony: full — plan mode + Plan agent, ar-3 after the first failing test, ar-4
after self-review, ar-5 over YOUR OWN baseline SHA. Scoped gate: `npx vitest run
--project unit src/lib/study-lenses/` with per-file attribution of foreign
failures; `npx tsc --noEmit` stays at 0. Shared tree: pathspec-stage and commit
in ONE invocation, the pathspec protects you, not a clean index, announce full SHAs, NEVER push.
```

---

### F2 — three fixtures that protect the fold

> ✅ **DONE 2026-08-05 — do not launch this prompt.** The three guards landed
> (`28cbd114`, `46d77084`, `9564e178`), two of them relocated to the validating
> seam on a human ruling; see FOLLOW-ONS § F2's banner, which carries the
> record.

The fold has a good guard net inside embody, but three places _outside_ it could
absorb a regression silently: `debug-props` counts syntax nodes with paren-free
fixtures, `scaffold` has no paren fixture, and the JEJ validator parses locally
so it's blind by construction. All three are cheap to close.

```text
Close three coverage gaps around embody's parenthesis fold. Repo:
/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula

FIRST — governance routing: read repo-root CLAUDE.md NOW; it routes by model id
to AGENTS.md or AGENTS.principal.md. Read your routed file END-TO-END, then
DEV.md END-TO-END. Governance outranks this brief everywhere they touch.

Read .planning-handoffs/paren-truth/FOLLOW-ONS.md § F2, and read the guard net
the paren-truth campaign already committed at 8da55d2f
(src/lib/study-lenses/embody/tests/derive-ast.test.ts) so you extend it rather
than duplicate it.

embody's derive-ast.ts parses with acorn preserveParens: true internally and
folds every ParenthesizedExpression wrapper out before returning. The published
tree is byte-identical to a plain parse. Three places outside embody would NOT
notice if that fold broke:

1. lenses/debug-props/tests/core.test.ts counts syntax nodes by an independent
   route to the same set as the entwined index — its own comment calls agreement
   "the sanity check" — but every fixture is paren-free. A paren-bearing fixture
   here is the cheapest numeric guard on the fold that exists.
2. language-levels/scaffold/ has no paren fixture. NOTE: its walker is NOT
   defective — it uses the same policy embody unified onto at c233db6f (no
   metadata-key list, the node check as the guarantee). This is a test gap only.
3. language-levels/jej/tests/validate.test.ts parses locally so it is blind by
   construction. Do NOT try to fix that here — it is its own task (§ F5) and it
   has a live crash you would trip over.

This is test-only work: no production file should change. If you find yourself
wanting to change one, stop and say why.

Ceremony: full — ar-3 after the first test, ar-4 after self-review. There is no
Red available (these guards characterize behavior that already works), so say so
explicitly rather than manufacturing one, and tell ar-3 that in its prompt.

Scoped gate: `npx vitest run --project unit src/lib/study-lenses/` with per-file
attribution of foreign failures; `npx tsc --noEmit` stays at 0. Shared tree:
pathspec-stage and commit in ONE invocation, the pathspec protects you, not a clean index,
announce full SHAs, NEVER push.
```

---

### F1 — the empty `tokens` list

> ✅ **DONE 2026-08-11 — do not launch this prompt.** Closed as containment ties
> — a fourth shape none of the three candidates below names, after measurement
> showed the starvation family is larger than the shared-node case; see
> FOLLOW-ONS § F1's banner, which carries the six SHAs and the record.

Acorn reuses a single identifier object for both halves of a bare
`import { x }`. embody builds two wrappers for it — one per path — and only one
of them gets the token. The other's `tokens` list is empty, which contradicts
what that field promises. **This one will come back to you with a fork**: there
are three defensible fixes and they change what `byPath` returns, which is
published contract.

> **2026-08-11:** a peer commit (`ff4532f1`) has since annotated the `tokens`
> contract in `src/lib/study-lenses/embody/types.ts` with this exact collision
> and the open design question — so candidate 3 ("narrow the contract") is now
> partially pre-executed as documentation. The fork is unchanged, but the F1
> session's fork presentation must account for that annotation. **The annotation
> itself is the record — read it in place.** (Docs are the source of truth;
> rulings live inline, dated, where they govern.)
>
> **Superseded 2026-08-11:** the fork was answered — see the DONE banner above.

```text
Fix the shared-node token gap in embody. Repo:
/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula

FIRST — governance routing: read repo-root CLAUDE.md NOW; it routes by model id
to AGENTS.md or AGENTS.principal.md. Read your routed file END-TO-END, then
DEV.md END-TO-END. Governance outranks this brief everywhere they touch.

THEN read .planning-handoffs/paren-truth/FOLLOW-ONS.md § F1 (this task)
INCLUDING its "Addendum 2026-08-10" directly above this prompt in that file —
it carries a binding sandbox-inspection ruling and the post-validation state.
The flag was first raised in this campaign's post-review follow-ups, not at its
Phase-1 close; § F1 itself is its full statement, and the tokens contract in
src/lib/study-lenses/embody/types.ts now documents the collision in place.

The defect: where two NodePaths resolve to the same acorn node object,
deriveEntwined builds one EntwinedNode wrapper per path and only one receives
the node's tokens — the other's `tokens` array is empty, against that field's
documented contract. Reproduce it through embody()'s public boundary before
designing anything; § F1 gives the recipe and the expected output. Use
`npx vite-node` — there is no tsx in this repo.

This is a DESIGN unit, not a patch. § F1 lists three candidate shapes and argues
none is obviously right. Enter plan mode, run a Plan-agent pass, and put the
fork to the human before implementing — the answer changes what `byPath`'s
values ARE, which is published contract.

Ceremony: full (this campaign's Q7 ruling stands) — plan mode + Plan agent,
ar-3 after the first failing test, ar-4 after self-review, ar-5 over YOUR OWN
baseline SHA recorded at plan approval.

Baselines: re-measure at YOUR start; several peer sessions commit into this tree
concurrently. Scoped gate: `npx vitest run --project unit src/lib/study-lenses/`
with per-file attribution of any foreign failure; `npx tsc --noEmit` must stay
at 0. Expect loud CodeMirror/jsdom stderr from orchestrate/editor's tests — that
file still passes; it is noise, not a failure. Shared tree: pathspec-stage and
commit in ONE invocation, the pathspec protects you, not a clean index, announce full SHAs,
NEVER push.
```

---

### F6 — wording tidy (lowest priority)

> ✅ **DONE 2026-08-11 (embody only) — do not launch this prompt.** The three
> `types.ts` sites read "in UTF-16 code units"; uniformity stops at the region
> edge for this pass (human ruling 2026-08-11), and the package-wide sweep of
> the 19 sibling sites launches from its own handoff at
> `.planning-handoffs/position-vocabulary-sweep.md`. See FOLLOW-ONS § F6's
> banner for the record.

Three lines in `src/lib/study-lenses/embody/types.ts` still say "character
offset" where the rest of the contract now says "half-open offsets in UTF-16
code units". Harmless, just untidy. The same phrasing appears ~19 more times
across the package, and whether to sweep those too is a call the agent will
bring back to you.

```text
Run the position-vocabulary alignment pass in embody (ar-2's C6). Repo:
/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula

FIRST — governance routing: read repo-root CLAUDE.md NOW; it routes by model id
to AGENTS.md or AGENTS.principal.md. Read your routed file END-TO-END, then
DEV.md END-TO-END, including § Documentation migration discipline — every reword
is enumerated in a loss ledger in the commit body or the plan.

Read .planning-handoffs/paren-truth/FOLLOW-ONS.md § F6; the review concern it
rests on (C6, 2026-08-03) is quoted there in full.

The work is smaller than the name suggests: within embody, only types.ts still
carries the legacy phrasing, at three lines (:66, :199, :338). README.md and
DOCS.md already use "half-open offsets in UTF-16 code units". Confirm that
yourself before editing.

Nothing here is FALSE — this is uniformity, not correction. The bar: does the
change make the contract easier to read without changing what it promises? If a
reword would alter a promise, stop and ask.

SCOPE FORK, resolve before widening: "character offset" appears at ~22 sites
package-wide (lib/screening, lib/socratizing, lib/loop-guard,
language-levels/scaffold, lenses/writeme). ar-2's ruling says "the region's
committed text", which reads as embody-only. Ask the human whether uniformity
stops at the region edge rather than deciding it yourself.

types.ts is published contract: show the human its literal diff and get approval
BEFORE committing. DEV.md treats README.md the same way, so if you end up
touching one, it gets the same treatment.

Ceremony: full. Scoped gate: `npx vitest run --project unit
src/lib/study-lenses/` with per-file attribution of foreign failures; `npx tsc
--noEmit` stays at 0; markdownlint and cspell per changed file. Shared tree:
pathspec-stage and commit in ONE invocation, the pathspec protects you, not a clean index,
announce full SHAs, NEVER push.
```

---

### F3 — the payoff, when you want a campaign

This is what the paren spans were built for: a trace or highlighting lens that
shows a learner where their parentheses are doing work. It's a real campaign
with its own Phase 0, and it overlaps the evaluators migration stream — so this
prompt produces a **proposal**, not code.

```text
Scope a trace-visualization consumer for embody's paren spans. Repo:
/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula

FIRST — governance routing: read repo-root CLAUDE.md NOW; it routes by model id
to AGENTS.md or AGENTS.principal.md. Read your routed file END-TO-END, then
DEV.md END-TO-END. Governance outranks this brief everywhere they touch.

This is a DESIGN task. Do not write product code before a Phase 0 and a human
gate.

Read .planning-handoffs/paren-truth/FOLLOW-ONS.md § F3 FIRST and take its
warning seriously: the legacy `parenthesis.enter`/`parenthesis.leave` events
DO NOT EXIST anywhere in this repo except one sentence of prose, and the
`parenthesis/` generator directory that sentence implies is not on disk. You are
designing a consumer, not porting one. Verify that yourself in one grep before
building any plan on it.

Then read:
1. src/lib/embody/lib/evaluating/trace/variables/ — instrument-variables.ts and
   its tests. This is the ONE live legacy consumer that really does walk
   ParenthesizedExpression nodes, and it is the concrete thing that will need
   embody's parenSpans (or need re-shaping without paren nodes) when it ports.
2. .planning-handoffs/evaluators-api-restoration/LOSS-LEDGER.md — the stream
   this work belongs to. Read it for shape and gate discipline; it contains
   nothing about paren spans, so do not expect inherited context. It
   names a cross-ceremony plan under ~/.claude/plans/ that git ls-files
   cannot find — follow that pointer.
3. Load the `aran-weaving` skill for the porting machinery. It says nothing
   about parentheses.
4. src/lib/study-lenses/embody/README.md § Glossary (grouping parentheses, paren
   span) and DOCS.md § Parse decisions — the published contract you would
   consume.

The question to answer: does a trace/highlight consumer want
entwined.parenSpans as published (path-keyed spans), a reverse index (paren
offset → node), or something else? The reverse index is deliberately unbuilt and
documented as a consumer's one-pass build; if you need it, weigh publishing it
back on entwined versus keeping it private, and take that fork to the human.

Deliverable: a Phase-0 proposal, stopping at the human gate. Nothing
implemented, nothing pushed.
```

---

## 5. Housekeeping

- **This file is tracked.** Delete it whenever you like (`git rm`) —
  `.planning-handoffs/paren-truth/FOLLOW-ONS.md` holds the full detail behind
  every section above.
- Each prompt ends with **NEVER push**, so an agent can't publish on your
  behalf.
- If an agent comes back with a fork, that's working as intended — F1 and F6
  both did, and both were answered 2026-08-11 (see their DONE banners).
