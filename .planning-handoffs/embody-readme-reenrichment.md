<!-- cspell:ignore reenrichment socratizing entwinement -->

# Handoff — re-enrich embody's README (and DOCS why-section) for humans

Status: ready to launch, one fresh session, validated context-free 2026-08-12.
Governance outranks this brief everywhere they touch.

## The ask

The maintainer, verbatim: the current `src/lib/study-lenses/embody/README.md`
"is a lame file that looks like it's for an LLM. it should be richly informative
for humans! … there was more detail on the purpose, entwinement, architectural
reasoning, etc." This runs in a fresh session deliberately: the prior session
authored parts of the current file's register (the containment vocabulary, the
tie gloss, the sandbox line) and is anchored to exactly the style under
complaint — design work goes to fresh eyes.

**This is re-authorship with mined material, not restoration.** The archaeology
is done (2026-08-12, prior session; spot-claims re-verified): the peak 477-line
ancestor exists byte-identical on disk, but ~10 of its DOCS-side rationale
sections reason about a DEAD object model, one argues AGAINST the live design,
and much of its purpose prose was re-homed into the package README. Mine for
content and register; test every passage against § What is true now; never
transport verbatim.

## The unit and its gates

- Scope (human ruling 2026-08-12): **`src/lib/study-lenses/embody/README.md` AND
  `src/lib/study-lenses/embody/DOCS.md`**, one unit — the README gets the
  human-facing purpose/entwinement riches; DOCS gains a rationale section in the
  register of its own § Parse decisions, covering BOTH the revived still-true
  whys AND newly-authored rationale for current-only decisions (level-blindness,
  the tagged-stage envelope, freeze-what-you-own) that no ancestor ever reasoned
  about. DOCS.md is an architectural contract — its content changes need the
  maintainer's approval before committing.
- Ceremony (human ruling 2026-08-12, revising a same-day "full" — the later
  ruling governs): **medium** — AR-1 on the content, AR-5 over the unit's own
  SHA list. Settings line per commit:
  `work: software · twin-doc: none · ceremony: medium · prospective`. **Pre-empt
  one stale finding in your AR prompts:** `ar-1.md`/`ar-5.md`'s own definitions
  still recite the deleted `## Epistemology` convention — state in each dispatch
  that HR-2 (2026-08-11) killed it, so the reviewer does not flag the missing
  block as a defect.
- **Register micro-gate (fire it BEFORE rewriting wholesale):** draft the README
  opener plus ONE full section — nominate the entwining glossary entry or § The
  build — in your proposed voice; show the maintainer old-vs-current-vs-proposed
  side by side (§ The build has no old counterpart, so its "old" column is
  register-level: a comparable passage from the peak README); get their pick. A
  wrong voice then costs one section, not the file.

## Source map (provenance by commit-hash + §; on-disk paths are convenience — `src/lib/embody/` is a live quarry other campaigns mine and may be retired)

1. **The peak README** — `c6b0fff3:src/lib/study-lenses/embody/README.md`
   (2026-06-24, 477 lines), byte-identical on disk at `src/lib/embody/README.md`
   [measured 2026-08-12: `git show … | diff -q`]. Mine: the stated-contract
   opener ("Embody decides nothing about pedagogy. The contract is _accuracy_.
   Lenses choose what to teach." — still true, region-scoped); the
   audience-column file table style; the load-bearing-principles framing
   (numbered principles each with its why). Do NOT mine: the JEJ/NM opener claim
   (false now — the region is level-blind), the three-layer model, § Named
   scenarios (no scenarios in-region), the conceptual-chain/pyramid content
   (re-homed to the package README — see boundary below).
2. **The old DOCS why-section** — on disk `src/lib/embody/DOCS.md:298` § Why
   this design (15 subsections; the L1→L2→L3 mermaid is separately at §
   Three-layer framework `:102`). The on-disk copy IS HEAD's, last touched
   `0fca239e` (2026-07-15) — **cite `0fca239e` in provenance ledgers for this
   file**; `c6b0fff3`'s DOCS is NOT byte-identical to it (measured). SURVIVING
   in substance (~5, revive recast): pure frozen plain data and why;
   deep-freeze-as-hard-guarantee (incl. the "LLM agents and human collaborators
   cannot trust each other not to mutate" sentence); no Maps/Sets at the public
   surface; per-instance, no shared state; reference equality within one
   embodiment. DEAD (do not port; reason about a superseded model): snowball
   event tiers, single static graph, environment- is-not-an-event, no evaluate
   caching, consumer-driven stops, frozen-emit getters, bookending,
   streams-as-living-view, static/runtime asymmetry, the getter exception.
   ARGUES AGAINST THE LIVE DESIGN: "Status booleans, not a discriminated union"
   — the current tagged-stage `ok`/`cause` model IS the discriminated union that
   section declines; porting it would contradict `types.ts`.
3. **The parse glossary** — `src/lib/embody/lib/ast/parse/glossary.md`:
   entwine-as-a-VERB ("the post-parse pass that wires bidirectional references
   between source, tokens, and AST nodes…") and the pedagogy-through-mechanics
   register ("lets consumers explain why `1 + 2 * 3` parses as `1 + (2 * 3)`").
   Mine the register and the verb framing; field inventories there are the old
   model's.
4. **The deprecated root README** —
   `src/lib/study-lenses--deprecated-architecture/README.md`: register only
   (story voice, the two-hats warmth); zero content — it is package-level and
   superseded.
5. **The current package README** — `src/lib/study-lenses/README.md`: a
   BOUNDARY, not a source. It already owns the story, the conceptual chain, and
   the package glossary (embodiment, snippet, Facts, lifecycle); the region
   README defers meanings upward by design. Region-scoped purpose — yes. Package
   story, chain diagrams, NM/level narrative — NO: duplication is this unit's
   most likely failure mode.

## What is true now (test every mined passage against this)

The live region: six tagged fact stages (source · tokens · ast · entwined ·
environment · type) derived once, synchronously, from a snippet; failures are
data (`ok`/`cause`), never throws. All published data is deep-frozen plain
objects/arrays — no Maps/Sets/getters/streams/events. The region is level-blind
by structure; evaluation lives elsewhere; one parse truth (levels consume the
parse facts from outside). Entwining is the source⇄tree binding stage: one
wrapper per path, containment ties (every wrapper whose span holds a token ties
it — human ruling 2026-08-11, inline at the tokens contract),
`byPath`/`byOffset`/`parenSpans` indices. `types.ts` is the contract; `DOCS.md`
§ Parse decisions is the rationale register to imitate.

## Traps — false friends in the old prose

- Old "Entwined" = a wrapper LAYER in the dead Data→Entwined→NMEvent model
  ("this is the graph"); current "entwining/entwined" = the binding STAGE. The
  old `byPath`/`byOffset` passages survive only where names match today.
- The evaluators' "entwining" (`src/lib/embody/lib/evaluating/…`) is a THIRD,
  unrelated sense — instrumentation position-baking. Skip entirely.
- Old "environment" = runtime environment/events; current `environment` = the
  static scope structure. Same word, different fact.
- The old opener calls embody "the operational embodiment of the JEJ notional
  machine" — false under level-blindness; the warm old prose is saturated with
  JEJ/NM vocabulary, and reviving its voice tends to revive its coupling. Say
  levels consume the facts from outside; never re-couple.

## Don't-regress inventory (current-only content no ancestor had — keep it all)

§ Failure grammar (loud-to-developer / graceful-to-learner; "a learner's program
that does not parse is not a defect") · § Level-blind, by structure · § Reading
the embodiment (`ok`/`accessible` narrowing; values-not-envelopes) · § The
boundary with its Not-owned list · the five-step § The build · the § What lives
here annotated file map (incl. `sandbox.html`) · glossary entries: fact stage,
entwining/entwined (incl. the containment tie definition), grouping parentheses,
paren span, environment, phase accessibility, fit/attachment, Gateable, freeze
boundary, Snippet, Embodiment.

**Inbound anchors — these heading/entry names are cited by live launch prompts
and follow-ups; do not rename:** README § Glossary's "grouping parentheses" and
"paren span" entries; DOCS § Parse decisions. Loss discipline per DEV.md §
Documentation migration discipline: baseline = the two current files at the SHA
your session starts from (re-measure), every removal or reword enumerated; plus
a PROVENANCE ledger for revivals — each revived passage cites its source
commit+§, and each § Why-this-design candidate deliberately NOT revived gets one
line of why. Ledgers ride commit bodies unless they outgrow them.

## Writing conventions that bind

- README = what the module is, domain model, navigation (contributors); DOCS =
  architecture and why (developers); end-state docs only — no status or
  migration narration.
- Rationale is written PRESENT-TENSE: "X rather than Y, because Y has property
  Z" — never "we considered Y, then chose X" (that narrative belongs to git
  history). § Parse decisions is the in-house model of the allowed voice.
- Gates per changed file: `npx markdownlint-cli2 --no-globs "<file>"`,
  `npx cspell <file>`; maintain each file's `cspell:ignore` header as revived
  vocabulary lands; the pre-commit prettier hook reflows prose — expect it,
  never fight it. `npx tsc --noEmit` and the scoped suite
  (`npx vitest run --project unit src/lib/study-lenses/`) must stay at your
  measured session-start baselines (docs-only unit — any drift is foreign;
  attribute per file).

## What NOT to do

- Do not edit `src/lib/embody/**` — read-only quarry; in-flight campaigns mine
  it and may retire it.
- Do not edit the package README/glossary — record gaps as follow-ons.
- **Do not add an `## Epistemology` block.** The convention is ruled DELETED
  (HR-2, human ruling 2026-08-11,
  `.planning-handoffs/epistemology-strip/BRIEF.md` § Human rulings; one clause
  superseded by HR-5). DEV.md may still recite the block when you read it — the
  strip may not have executed; the ruling governs, not the recital.
- Do not port dead-model rationale (see Traps) or duplicate the package story.
- Do not touch governance surface (`DEV.md`, `AGENTS*.md`, `.claude/**`).

## Shared-tree mechanics + measured baselines (2026-08-12T02:17Z — RE-MEASURE AT YOUR START)

Oracle output, pasted verbatim [measured: `node scripts/repo-facts.mjs`]:

```text
node version vs engines: v20.11.0 vs engines ">=22.11.0" — BELOW the minimum
  (known-tolerated: tsc, vitest, and the oracle all demonstrably run)
tsc errors: 0
markdownlint errors (repo-wide): 85   (cached — refresh needs
  `node scripts/repo-facts.mjs --refresh`; the binding gates are per-file)
HEAD: b33763853726a94788ac8e1feddb367a91c3a0d1
foreign dirty files:
   M .planning-handoffs/epistemology-strip/BRIEF.md
  MM .planning-handoffs/paren-truth/FOLLOW-ONS.md
  MM .planning-handoffs/position-vocabulary-sweep.md
   M eslint.config.mjs
  MM src/lib/study-lenses/embody/DOCS.md
   M src/lib/study-lenses/embody/derive-tokens.ts
   M src/lib/study-lenses/lenses/parsons/tests/component.test.tsx
   M src/lib/study-lenses/lib/local-llm/probe-capabilities.ts
   M src/lib/study-lenses/orchestrate/derive-study.ts
   M src/lib/study-lenses/orchestrate/event-bus/create-event-bus.ts
  ?? scripts/lib/check-tables/
```

- Commit by FILENAME pathspec in one invocation (`git add <files>` → staged
  check scoped to your paths → `git commit -m … -- <files>`); a directory add
  would sweep the foreign `derive-tokens.ts` comment mod.
- The `MM` on `embody/DOCS.md` netted to ZERO against HEAD when measured (staged
  prettier-shape rewrap + its exact unstaged revert). Never stash/checkout/reset
  in this shared tree; your own `git add` of the file supersedes the stale index
  copy harmlessly.
- On `index.lock` collision: wait briefly, retry. Announce every commit's full
  SHA. **NEVER push.**

## Human rulings of record

- Scope: README + DOCS why-section, revived AND newly-authored rationale
  (2026-08-12).
- Ceremony: medium — AR-1 on content, AR-5 over the unit's SHA list (2026-08-12,
  revising the same-day "full"; later ruling governs).
- `## Epistemology` convention deleted — HR-2 (2026-08-11), see What NOT to do.
- Containment ties (2026-08-11) — inline at the tokens contract in
  `embody/types.ts`; the README's tie gloss must stay consistent with it.
- Launch-time rulings (register pick at the micro-gate, DOCS content approval):
  record them inline, dated, in the same turn they are made.

## Launch prompt

```text
Re-enrich embody's docs for human readers. Repo:
/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula

FIRST — governance routing: read repo-root CLAUDE.md NOW; it routes by model
id to AGENTS.md or AGENTS.principal.md. Read your routed file END-TO-END,
then DEV.md END-TO-END (§ Directory Documentation Convention, § What goes in
docs vs. plans vs. handoffs, and § Documentation migration discipline bind
this unit hardest). Governance outranks this brief everywhere they touch. Honor
the routed file's validate-every-handoff rule by its NAME ("Validate every
handoff with a context-free agent") — its number differs between the two
AGENTS files.

THEN read .planning-handoffs/embody-readme-reenrichment.md END-TO-END — it
carries the ask, the two transcribed human rulings (scope: README + DOCS
why-section; ceremony: medium — AR-1 + AR-5), the mined-source map with the
dead-model traps, the don't-regress inventory, and the shared-tree
mechanics. Then read, END-TO-END and in this order: the current
src/lib/study-lenses/embody/README.md, DOCS.md, types.ts, and the package
README src/lib/study-lenses/README.md (the ownership boundary). Only then
open the quarry sources the handoff maps.

The work: re-author the region README as richly informative for HUMANS
(purpose, entwinement, the accuracy-not-pedagogy contract) and give DOCS.md
a why-section in its § Parse decisions register (revived still-true
rationale + newly-authored rationale for current-only decisions). Enter plan
mode first. Fire the register micro-gate BEFORE any wholesale rewrite: draft
the README opener plus ONE section in your proposed voice, show the
maintainer old-vs-current-vs-proposed, get their pick. DOCS.md content needs
the maintainer's approval before it commits. Provenance ledger for every
revival; loss ledger against the current files at your measured start SHA;
no Epistemology block (ruled deleted — the handoff carries the citation).

Baselines: re-measure at YOUR start (node scripts/repo-facts.mjs); peer
sessions commit into this tree concurrently. Gates: markdownlint-cli2
--no-globs + cspell per changed file; tsc and the scoped unit suite stay at
your measured baselines. Shared tree: pathspec-stage and commit by FILENAME
in ONE invocation, staged diff exclusively yours, announce full SHAs, NEVER
push.
```
