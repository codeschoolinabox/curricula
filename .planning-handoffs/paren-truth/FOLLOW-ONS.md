<!-- cspell:ignore Aran unlengthened pasteable unbuilt socratizing -->

# Follow-ons from the paren-truth campaign

What the campaign left behind, one section per unit of work, each with a
copy-pasteable launch prompt. It carries what a fresh session needs to pick one
of these up cold, and the rulings each unit still answers to.

**Every section below was dry-run by two context-free agents holding only this
file** (2026-08-05). Their must-fix findings are applied, and several sections
say the opposite of what a first draft claimed — read the "what the dry run
found" notes rather than assuming the framing is safe.

**Campaign state (2026-08-04):** Phase 1 complete plus both post-AR-5 maintainer
rulings; seven commits UNPUSHED — `8da55d2f`, `6614142e`, `59a5ef60`,
`d6d4c6d4`, `f6878ffc`, `0f178750`, `c233db6f`. Peer streams landed ~19 commits
interleaved, so **any review scopes to those seven SHAs, never a commit range**
[all seven verified present, subjects matching, still ancestors of HEAD —
relayed: context-free validator, measured].

What shipped: `derive-ast.ts` parses with acorn `preserveParens: true`
internally and folds every wrapper out before returning (published tree
byte-identical to before); the fold's record travels as
`AstDerivation.parenSpansByNode`, keyed by node object; `derive-entwined.ts`
re-keys it by path and publishes `Entwined.parenSpans`.

**Nothing outside embody reads `parenSpans` yet** [measured: `git grep -n
"parenSpans" -- src/lib/study-lenses/ | grep -v /tests/`]. The one out-of-region
mention is `orchestrate/lib/validating/tests/assemble-parse-facts.test.ts`,
which _constructs_ `parenSpans: {}` to satisfy the required member — not a read,
but it is the site F1's candidate 2 would touch.

**Suggested order:** F5 (a live crash, small, established) → F2 (cheap guards) →
F1 (real defect, needs design) → F6 (cosmetic) → F3 (the payoff, but a
campaign). **F4 is probably not worth doing at all — read it before assuming
otherwise.**

---

## F1 — a shared node leaves one of its two wrappers without its token

**Severity: real defect, no consumer pressing on it. Size: one increment, but a
design one — it changes published-contract semantics.**

Where two `NodePath`s resolve to the same node object, `deriveEntwined` builds a
**separate `EntwinedNode` wrapper per path**, and only one receives the node's
tokens. The other's `tokens` array is empty, contradicting that field's own
contract — "Every token within the node's span" (`embody/types.ts:162`).

**Reproduce it through the public boundary** — ten lines, no replication needed.
Write a scratch file calling
`embody('import { x } from "m";', { type: 'module' })`, read
`facts.entwined.value.byPath['$.body.0.specifiers.0.local']` and
`…specifiers.0.imported`, and print `.node ===` plus both `.tokens.length`. Run
it with `npx vite-node` (there is **no `tsx`** in this repo). Expected:

```text
same node object   : true
distinct wrappers  : true
local.tokens       : 1
imported.tokens    : 0
```

[reproduced through the real pipeline — relayed: context-free validator,
measured; independently reproduced against a hand-port of the three functions by
the campaign session.]

**Mechanism.** `fillSpans` writes `byOffset` depth-first and its own comment
states the tie-break: "Identical-span siblings tie-break by enumeration order
(the later-enumerated wins; pinned by test)" (`derive-entwined.ts:162-165`).
Acorn's key order on an `ImportSpecifier` is
`type,start,end,range,imported,local`, so `local` is enumerated later and wins;
`tieTokens` then hangs each token on the `byOffset` winner and walks up its
parent chain, so the loser is never on that chain.

**Why the collision exists:** acorn reuses one Identifier for both `local` and
`imported` on a bare `import { x }` (and `local`/`exported` on a bare
`export { x }`); renamed forms build two. `ar-4` established by reading acorn's
parser source that `parseImportSpecifier` and `parseExportSpecifier` are the
only two aliasing sites in the whole parser [relayed: ar-4]. `types.ts`'s
`NodePath` doc documents it; `derive-entwined.test.ts` pins the collision and
the renamed-form non-collision.

**Pre-existing** — the campaign only made it visible. **Untested** — nothing
exercises `.tokens` on either wrapper of a collision.

### The design question, which the increment must not skip

What _should_ two wrappers over one node do? None of these is obviously right:

1. **Both wrappers tie the tokens** — decouple `tieTokens` from the `byOffset`
   winner. Truthful per wrapper; a token becomes reachable at two paths, which
   may surprise a consumer counting by walking.
2. **One wrapper, shared by both paths** — `byPath` maps two keys to one object.
   Cheapest for consumers; the shared wrapper's own `path` field loses meaning;
   touches `assemble-parse-facts.test.ts`'s hand-built fixture.
3. **Narrow the `tokens` contract** to say what it does. Cheapest; documents a
   wart instead of fixing it.

**The pinned-expectation risk is smaller than it looks — don't let it stall
you.** The tie-break pin is `derive-entwined.test.ts:826`,
`it('identical-span siblings: the later-enumerated value wins')`, which uses
`const o = {x}` — a shorthand property, whose `key` and `value` are two
**distinct** objects. It exercises identical _spans_, never a shared _object_,
so candidates 1 and 2 do not collide with it [relayed: context-free validator,
measured]. Verify that yourself before relying on it; if some other pin does
turn out to be in the way, that needs human sign-off.

`EntwinedNode.comments` is built by `tieComments` off the same `byOffset`
winner, so it has the identical mechanism — but vacuously, since the only
colliding node is a bare `Identifier` whose span cannot contain a comment. Worth
one sentence in whatever you write; not worth a fix.

### Addendum 2026-08-10 — read together with the launch prompt

The launch prompt below was context-free validated 2026-08-05; its substance is
untouched. Four things post-date that validation:

- **§ F2's three fold guards now exist** (`28cbd114`, `46d77084`, `9564e178`).
  None of their fixtures contains an import/export specifier — the parser's only
  aliasing sites — so no candidate above breaks them through the collision
  [measured over the three fixtures, each checked for fold-sensitivity]. But
  candidate 2's own named target, `assemble-parse-facts.test.ts`, now also
  carries a fold guard, and the § F2 work planted **four new PINNED markers**,
  one in that same file.
- **The pinned-guard hook is deregistered in the working tree** while HEAD
  registers it, so NO PINNED marker in the repository is mechanically defended
  right now — pin collisions are read-discipline only, and inverting one still
  needs human sign-off. This is working-tree state: re-measure it at your start,
  with one grep of `.claude/settings.json` against its HEAD copy.
- **Sandbox inspection is required, not optional** (human ruling 2026-08-10):
  the maintainer expects 🔍 inspection points in a **browser sandbox** to
  visually judge the entwined data structures — the "no user-visible surface /
  pure data" checkpoint skip is not available to this unit.
  `evaluators/run/sandbox.html` already calls `embody()` live in a browser and
  is the natural surface to extend (or a scratch page beside it): render
  `facts.entwined.value.byPath` for a colliding fixture with both wrappers'
  `tokens` arrays visible. Name the action and the expected observation — e.g.
  "type `import { x } from "m";`, open the inspection panel; two byPath entries,
  node identity shown, each wrapper's token count" — and fire one checkpoint at
  the design fork and one before the Phase-1 close.
- **Operating instructions**: open in plan mode as a design/Phase-0 unit on the
  strongest available tier; the maintainer asked for **high effort on the design
  phase** (their instruction); post-gate TDD may hand to a cheaper tier per
  AGENTS.principal.md § Sub-Model Dispatch for Subagents. The human holds the
  design fork, the Phase-0→1 gate, and the push. F5 and § F2 are both done —
  re-measure every baseline at your start, as the prompt already commands.

### Launch prompt — F1

```text
Fix the shared-node token gap in embody. Repo:
/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula

FIRST — governance routing: read repo-root CLAUDE.md NOW; it routes by model id
to AGENTS.md or AGENTS.principal.md. Read your routed file END-TO-END, then
DEV.md END-TO-END. Governance outranks this brief everywhere they touch.

THEN read .planning-handoffs/paren-truth/FOLLOW-ONS.md § F1 (this task)
INCLUDING its "Addendum 2026-08-10" directly above this prompt — it carries a
binding sandbox-inspection ruling and the post-validation state. The flag was
first raised in this campaign's post-review follow-ups, not at its Phase-1
close; the section below is its full statement.

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
commit in ONE invocation, staged diff exclusively yours, announce full SHAs,
NEVER push.
```

---

## F2 — three fixtures that close the fold's remaining blind spots

> ✅ **DONE 2026-08-05** — `2e9fa91f`, `28cbd114`, `46d77084`, `9564e178`,
> `ae0b8bcc`, `1b516bd4`, `883431a6`. Record, rulings, AR verdicts and the
> consolidated mutation evidence ride those commits' own bodies. Two of the
> three guards landed at seam files (`orchestrate/lib/validating/tests/`'s
> `create-memoized-validate.test.ts` and `assemble-parse-facts.test.ts`) rather
> than where the bullets below point, on the 2026-08-05 human ruling "relocated
> to where a guard can actually bite". Only the scaffold bullet needed
> correcting — bullets 1 and 3 hold as written, and `validate.test.ts` remains
> fold-blind by construction: its gap was closed at the seam, never in that
> file.

**Severity: low. Size: small, test-only. Unclaimed.**

The fold is guarded by a net committed at `8da55d2f`, but three places outside
embody could still absorb a fold regression silently:

- `lenses/debug-props/tests/core.test.ts` counts syntax nodes by an independent
  route to the same set as the entwined index — "agreement is the sanity check"
  — but every fixture is paren-free (`'let x = 1'`, `''`) [measured: `grep -n
  "embody('"`]. A paren-bearing fixture is the cheapest numeric guard on the
  fold that exists.
- `language-levels/scaffold/` has no paren fixture. **Correcting the record this
  campaign inherited:** its `collectDebuggerStatements` uses exactly the policy
  embody unified onto at `c233db6f` — no metadata-key list, the node check as
  the guarantee — so this is a test gap, not the code defect an earlier handoff
  implied.
- `language-levels/jej/tests/validate.test.ts` parses locally, so it is blind to
  embody's fold by construction — the settings it parses with carry no
  `preserveParens`. **F5 is DONE** (`2f6720e1`, `d8fa1461`, `e708841c`,
  `be722850`), so the live crash that section described is fixed; adopting the
  published parse settings did **not** change this blindness, and it is not F2's
  to fix.

---

## F3 — a consumer for the spans (designed, not ported)

**Severity: this is where the campaign's value would be spent. Size: a campaign
needing its own Phase 0. Overlaps a live stream — read that first.**

### ⚠️ What the dry run found: the thing to "port" does not exist

The legacy tree's docs give the rationale for `preserveParens` [read:
`src/lib/embody/lib/validating/DOCS.md:188-190`, verbatim]:

> We enable it for trace visualization: when the Aran tracer emits
> `parenthesis.enter`/`parenthesis.leave` events, the UI needs an ESTree node to
> highlight. `ParenthesizedExpression` provides that anchor point.

**That sentence describes an intention the quarry never implemented.**
`git grep -rn "parenthesis\.enter\|parenthesis\.leave"` over the whole repo
returns **exactly one hit — that sentence itself**. The legacy tracer's
`event-generators/README.md:42` lists a `parenthesis/` row in its directory
table, and **no such directory exists on disk** [all relayed: context-free
validator, measured]. So there is no paren-event consumer to port. Anyone who
reads the quote as a description of working code will lose a session looking for
it.

What this means: the consumer is **designed from scratch**, and the legacy quote
is evidence of _desire_, not of a shape to copy. That is a weaker starting point
than it first appears — which is exactly why this is a Phase-0 task and not an
implementation one.

### The one live legacy paren consumer that does exist

`src/lib/embody/lib/evaluating/trace/variables/instrument-variables.ts:42`
documents that it runs with `preserveParens` and walks `ParenthesizedExpression`
nodes; `trace/variables/tests/instrument-variables.test.ts:187` has
`describe('parenthesized reads (preserveParens)')`;
`trace/variables/README.md:188` says parenthesized expressions are traced
[relayed: context-free validator, measured]. That is the **variables** tracer,
not the semantics one, and it is the concrete code that will need `parenSpans` —
or need re-shaping to live without paren nodes — when it ports. Start there, not
at the semantics tracer.

### Where this work belongs

The evaluators campaign owns it. Read
`.planning-handoffs/evaluators-api-restoration/LOSS-LEDGER.md` for that stream's
shape and gate discipline; it contains **nothing** about paren spans, so do not
expect inherited context. Its own record names a cross-ceremony ledger under
`~/.claude/plans/` that `git ls-files` cannot surface — the chain only resolves
through that pointer.

That stream is at **Phase 1** (its log carries Phase-1 briefing decisions
ratified 2026-08-05 and AR resolutions through I4, ending on an open human flag)
— not Phase 0, as an earlier draft of this file said [relayed: context-free
validator, measured].

The `aran-weaving` skill exists and covers Aran weaving mechanics, but says
**nothing about parentheses** — load it for the porting machinery, not for this
question.

Also folded in here: the **reverse paren-offset index** (paren offset → the node
the pair wrapped). `ar-1` deferred it as purely additive ["can be deferred
without cost" — its quoted words]; `embody/README.md` and `DOCS.md` both
document it as a one-pass build a consumer does for itself. The first consumer
that wants paren→node should build it, and should weigh publishing it back on
`entwined` rather than keeping it private.

### Launch prompt — F3

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
   nothing about paren spans, so do not expect inherited context. It names a
   cross-ceremony plan under ~/.claude/plans/ that git ls-files
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

## F4 — `range` REQUIRED on published parse facts (standing flag L6): probably DON'T

**Severity: the flag stands, but the evidence says the work is not worth doing
and may be unsound. Size: read this section, then most likely close the flag.**

L6 was deferred in Phase 0 with a recorded rationale: the paren record is
embody's own `{ start, end }` data, independent of acorn's optional `node.range`
typing, so the two were never coupled.

### ⚠️ What the dry run found: the case for doing it is false

A first draft of this section argued the narrowing was worth a campaign because
optionality "forces `?.` and non-null assertions at every read". Measured, that
is wrong on both halves [all relayed: context-free validator, measured]:

- **Blast radius is 1, and it is a test.**
  `git grep -nE "range(\?\.|!)" -- src/lib/study-lenses/` returns a single hit —
  `embody/tests/derive-ast.test.ts:49`. Widened to all of `src/`: still 1.
  Non-null assertions on `.range`: 0.
- **A narrowing would be UNSOUND.** Two _production_ parse sites pass no
  `ranges` at all — `evaluators/intercept/wrap-call-expressions.ts:117` and
  `lib/loop-guard/splice-loop-guards.ts:110`, both
  `{ ecmaVersion: 'latest', sourceType, locations: true }`. Their trees
  genuinely have no `range`, so a type saying it is always present would be a
  lie about them.
- **Why the radius is ~0:** acorn declares `start`/`end` **required** and
  `range` optional, and this region reads `.start`/`.end` (67 non-test sites). A
  Phase-0 review deliberately dropped the `.range`-optionality sentence "in
  favor of always-present `.start`/`.end`" (2026-08-03). Consumers already have
  a non-optional path; `range` is close to dead surface.

**Recommendation: close L6 as wontfix** unless someone produces a consumer that
needs `range` specifically and cannot use `.start`/`.end`. If anyone revisits
it, the real question is not "narrow the type" but "should those two production
parse sites be using the package's published settings at all" — which is F5's
question, one region over.

No launch prompt: this section's deliverable is the decision above, and the
person to make it is the maintainer.

---

## F5 — the JEJ level's test harness has a latent crash

> ✅ **DONE 2026-08-05** — `2f6720e1`, `d8fa1461`, `e708841c`. Record and both
> corrections to this section's framing ride those commits' bodies, and both are
> stated here because the analysis below is wrong without them.
>
> **Correction 1 — the crash trigger is broader than this section states.** It
> is not "a default parameter shadowed in the body": `__isValidResolution` is an
> override on `FunctionScope`, so it fires on ANY reference resolving to a
> variable declared in that same function scope. Plain function, arrow, object
> method and class method all throw; a function with no references, and one
> referring only outward, do not [measured 2026-08-05: `node > >
> --input-type=module -e` over 7 sources, acorn 8.16.0 + eslint-scope 8.4.0].
>
> **Correction 2 — `ranges: true` alone fixes it.** This section couples the fix
> to the `'latest'` → `2024` narrowing; they are orthogonal [measured > >
> 2026-08-05: same probe, `{ecmaVersion:'latest', ranges:true}` resolves > >
> cleanly].
>
> The escalation condition below — "if any fixture depends on post-2024 syntax,
> take the fork to the human" — did NOT fire: all 13 fixture sources parse
> byte-identically under both settings once `range` is stripped [measured >
> 2026-08-05: `node` JSON compare with a range-stripping replacer]. The human
> ruled both increments (fix the crash, then adopt the published contract) and
> chose to pin the regression assertion, dated — the ruling `validate.test.ts`'s
> `PINNED(human ruling 2026-08-05)` cites.

**Severity: a real, reproduced defect — upgraded from "worth a look" by the dry
run. Size: small.**

`language-levels/jej/tests/validate.test.ts:10-11` builds its parse facts
locally:

```ts
const ast = parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
const manager = analyze(ast, { ecmaVersion: 2024, sourceType: 'module' });
```

### ⚠️ What the dry run found: the missing `ranges` is a live crash, not a style nit

`eslint-scope/lib/scope.js:730`, inside `Scope#__isValidResolution`, does
`const bodyStart = this.block.body.range[0];` — reached whenever a non-Program
scope resolves a reference. With this file's settings, a source with a default
parameter shadowed in the body throws
`TypeError: Cannot read properties of undefined (reading '0')`; with
`{ ...PARSE_SETTINGS, sourceType: 'module' }` it resolves cleanly [relayed:
context-free validator, measured, with a reproducer]. The suite passes today (23
tests) **only because no fixture triggers that path**. This also confirms
`derive-ast.ts:56-57`'s comment that eslint-scope reads `node.range` and throws
without it.

**Two corrections to a first draft of this section**, both measured by the dry
run:

- "The language year is a string here and numeric everywhere else" is **false**.
  `'latest'` is the package-wide majority — 18 sites versus 2 numerals, and the
  two numerals are `parse-settings.ts` itself and the `analyze` call in this
  very file. The divergence is systemic, not local to jej.
- The `parse-settings.ts` doc sentence about a scope analyzer's version gate
  degrading on a string **does not describe this call's hazard** — the numeral
  is what reaches `analyze`, so that gate is fine. The real year hazard is
  **version skew**: `'latest'` accepts syntax `2024` rejects (import attributes,
  duplicate named regex groups), so the test accepts a broader language than the
  level contract screens.

**Watch out:** switching to `{ ...PARSE_SETTINGS, sourceType: 'module' }` fixes
the crash _and_ narrows the accepted language from `'latest'` to `2024`. That is
a behavior change across 23 existing tests — check the fixtures before assuming
the swap is purely corrective. The cross-region import is already proven live:
this file imports `../../../lib/screening/get-child-nodes-with-path.js` today
and `npx eslint` on it exits 0.

### Launch prompt — F5

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
in ONE invocation, staged diff exclusively yours, announce full SHAs, NEVER push.
```

---

## F6 — the position-vocabulary alignment pass (ar-2's C6)

**Severity: cosmetic. Size: three lines in one file — smaller than it sounds.**

`ar-2` observed that the region's committed text names source positions
inconsistently and ruled it out of the Phase-0 diff: "committed-text alignment
is its own later pass" [verbatim, that review's concern C6, 2026-08-03]. Nothing
is false; the vocabulary is just not uniform.

**What the dry run found:** within embody the legacy phrasing survives in
**`types.ts` only**, at three lines — `:66`, `:199`, `:338` — while `README.md`
and `DOCS.md` already carry the new vocabulary ("half-open offsets in UTF-16
code units") and need nothing [relayed: context-free validator, measured].

**The scope boundary is the real question.** Package-wide, "character offset"
appears at **22 sites** across `lib/screening`, `lib/socratizing`,
`lib/loop-guard`, `language-levels/scaffold` and `lenses/writeme`. `ar-2`'s
ruling says "the region's committed text", which reads as embody-only — but
whoever takes this will see the wider divergence and needs a ruling on whether
uniformity stops at the region edge. **Get that ruling before widening.**

### Launch prompt — F6

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
pathspec-stage and commit in ONE invocation, staged diff exclusively yours,
announce full SHAs, NEVER push.
```

---

## What is deliberately NOT here

- **The bare noun `grouping` in `8da55d2f`'s subject line.** It violates the
  human's term ruling, `git commit --amend` is forbidden here, and the violation
  is recorded in that commit's own body. Nothing to do.
- **The `import/no-restricted-paths` gap** `ar-4` found: the rule only blocks a
  sibling subsystem's `<subsystem>/lib/**`, and `embody/` has no `lib/`, so its
  internals are mechanically unprotected. Pre-existing, applies to every flat
  file in the region equally, and fixing it is a boundary-config decision for
  whoever owns that rule.
- **The other copies of the node-membership predicate** in `lib/screening`,
  `lib/socratizing` and `lenses/debug-props`. `debug-props` documents its own as
  "an independent route to the same set as the entwined index — agreement is the
  sanity check", so merging it would delete the independence that gives it
  value.
