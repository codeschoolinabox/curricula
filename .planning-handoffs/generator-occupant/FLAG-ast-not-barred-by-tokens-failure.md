# FLAG — a tokens-stage failure does not bar the AST phase in the rendered panel

> **Status: reported, not investigated.** Found 2026-08-05 during the
> generator-occupant campaign's Increment 9 (a documentation-only increment), so
> it was flagged rather than chased. Nothing here has been fixed and no code was
> changed. **This is a hand-off brief for an agent with fresh context.**

## The claim in one line

`embody` says the `ast` phase is barred whenever the tokens stage fails, and a
unit test pins that — but drive the live page with a source that fails
tokenization and the AST phase renders **open**, while `environment` and
`evaluation` correctly render barred carrying the tokens cause.

## Reproduction (takes about two minutes)

1. `npx docusaurus start --port <free port>` and open
   `/spiralearn/sandbox/orchestrate/`.
2. Leave the type toggle reading **`module`** (the default).
3. Replace the buffer with **`const n = 0755;`** — a legacy octal literal.
4. Read the five phase sections.

**Observed** [measured 2026-08-05, real Chromium via Playwright, at commit
`22da1eca`]:

```text
BUFFER : "const n = 0755;"     (goal: module)
BARRED : ["environment","evaluation"]
CAUSE  : "⚠ Invalid number (1:10)"
```

`AST · grammar` renders its open `—` state. Toggling to `script` unbars
everything, which confirms the failure is genuinely goal-sensitive tokenization
rather than a malformed literal.

## Why this is a real conflict and not a misreading

**`0755` at the module goal is a TOKENS-stage failure, not an AST-stage one.**
Checked against acorn directly at the repo's own `ECMA_VERSION` [read:
`src/lib/study-lenses/embody/ecma-version.ts` — `const ECMA_VERSION = 2024`]:

```text
"1 +"              | tokens: ok                            | ast: FAIL Unexpected token (1:3)
"const n = 0755;"  | tokens: FAIL Invalid number (1:10)    | ast: FAIL Invalid number (1:10)
"const a = @;"     | tokens: FAIL Unexpected character '@' | ast: FAIL
```

[measured: `node -e` over `node_modules/acorn`, `sourceType: 'module'`,
`ecmaVersion: 2024`]

**The contract says AST must be barred by it** [read:
`src/lib/study-lenses/embody/derive-accessibility.ts` — the doc comment _"`ast`
is barred only by a tokens failure"_, implemented as `ast: facts.tokens.ok ? {
accessible: true } : { accessible: false, cause: facts.tokens.cause }`].

**A unit test pins it and is green** [read:
`src/lib/study-lenses/embody/tests/derive-accessibility.test.ts` — `it('bars the
ast phase with the tokens cause')`; the whole region suite was green at the time
of this measurement, 22 files / 622 tests].

**The failure does reach the projection.** `environment` and `evaluation` show
`Invalid number (1:10)`, which is the tokens cause carried through the entwined
stage — so the tokens failure is not being swallowed upstream. Only the `ast`
phase's barred state fails to appear.

**The renderer is a faithful projection**, which is what makes this puzzling
[read: `src/lib/study-lenses/orchestrate/index.tsx` § `toPhaseEntry` — `if
(!phase.accessible) { return { accessible: false, cause: phase.cause.message, …
}; }`]. So either `accessibility.ast.accessible` is arriving as `true`, or
something between `deriveAccessibility` and `toPhaseEntry` overwrites it.

## The sharpest fact: the green unit test uses the SAME input class

**`deriveFacts` and `deriveAccessibility` are exonerated by a passing test over
the same kind of input.** The pinned test is not a hand-assembled fixture — it
drives the real deriver [read:
`src/lib/study-lenses/embody/tests/derive-accessibility.test.ts` — `const facts
= deriveFacts({ source: '01', type: 'module' });` then `expect(!facts.tokens.ok
&& !accessibility.ast.accessible && accessibility.ast.cause ===
facts.tokens.cause).toBe(true)`].

`'01'` is a legacy octal at the module goal — **the same class of tokens failure
as the `const n = 0755;` repro above**, through the same production functions,
asserting exactly the barring the page fails to show. That test is green.

So the divergence is **not** in `deriveFacts` and **not** in
`deriveAccessibility`. It lies between them and the rendered panel — or the page
never reaches that path.

## Ground already covered — do not re-derive these

Checked and RULED OUT, by this reporter and by an independent AR-4 pass:

- **The dev server was not stale.** The repro was re-run against a
  **cold-started** server on a different port and reproduced identically
  [measured 2026-08-05, fresh `npx docusaurus start --port 3007`].
- **`derive-ast.ts` short-circuits correctly** on a failed tokens stage,
  carrying the same cause — it matches the contract.
- **`join-study.ts`'s `joinPhase` preserves the accessibility arm by identity**;
  it does not reconstruct it from the lens roster. (The tempting hypothesis was
  a barred-but-lens-less phase coming out accessible — but `evaluation` also has
  no registered lenses in this harness and bars correctly, which already argued
  against it.)
- **`phases-panel/index.tsx` renders `phases.map` faithfully**, keyed by
  `phase.name`, with no index-based mismatch.
- **No acorn version skew** — `acorn@8.16.0`, deduped throughout [measured: `npm
  ls acorn`].

## Where to start

**Unverified hypotheses.** The upstream suspects are gone, so these are
deliberately downstream. Reproduce first; trust none of this list:

1. **`attach-lenses.ts`** — the one stage between `deriveAccessibility` and the
   join that triage did not read, and the stage that builds the per-phase lens
   lists the join merges (`:17` starts `tokens: []` among its phase arrays).
   Read it in full for any arm that reconstructs rather than forwards.
2. **What the region actually feeds the panel.** `orchestrate/index.tsx` builds
   entries via `toPhaseEntry(name, derivation.embodiment.study[name], …)`.
   Confirm `study.ast` still carries `accessible: false` there for a
   tokens-failing snippet. **The cheapest reproduction is a region test** —
   mount `<StudyLenses snippet="const n = 0755;" />` and assert the AST section
   shows a cause. The region suite currently has no test that breaks
   tokenization rather than grammar, which is very likely why this survived.
3. **Whether the tokens stage is derived at the same parse goal as the ast
   stage.** The panel showed `module` and the barring changed when toggled to
   `script`, so the goal is plumbed somewhere — but the whole distinction
   depends on both stages sharing it, and `ecma-version.ts`'s own comment exists
   because these two readers have drifted before.

## Scope note for whoever picks this up

- The **prose was deliberately left general** because of this. Increment 9's
  sandbox sentence reads _"breaking the parse bars the phases downstream of the
  break, each naming the parser's cause"_ — true under both the current behavior
  and the contract, so it does not need editing whichever way this resolves
  (maintainer decision, 2026-08-05).
- Two adversarial reviewers (AR-1 and AR-2 on Increment 9) independently
  asserted that a tokens failure bars three phases including AST, and both
  reasoned **from the code alone without driving the page**. Their reading of
  the contract is correct; their claim about observed behavior is not. That
  divergence is the finding.
- If the fix changes which phases bar,
  `spiralearn/sandbox/orchestrate/index.mdx` and the `W4-T1` / `W1-P1` rows of
  `src/lib/study-lenses/orchestrate/PHASE-1-CHECKPOINT-LEDGER.md` describe
  barring behavior and should be re-read against the result.
