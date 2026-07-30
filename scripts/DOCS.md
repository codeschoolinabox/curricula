# Scripts — architecture

> Written Phase 0, before implementation: this sketch is the structural contract
> the Refactor step is held against.

## Governance checker

Bounded context: the governance corpus and its truthfulness. Ubiquitous language
and corpus definition live in [README.md](./README.md); typedefs live in
`lib/check-governance/types.mjs` (the single typedef home for this bounded
context — checks reference them via JSDoc imports, never redeclare them).

### Phases

1. **Load** — the thin entry reads the working-tree corpus and the corpus at
   `HEAD` (the baseline for the headings comparison). A corpus path that cannot
   be read, a corpus glob that matches nothing, or a failed `HEAD` read is an
   error (exit 1) — never a silent skip.
2. **Parse** — one shared implementation reduces each document to a parsed
   document: fenced code blocks are BLANKED IN PLACE (line numbering is
   preserved end-to-end — every reported line refers to the file as it exists on
   disk), inline code spans are matched within a single line only, then
   headings, links, backticked tokens, and the extracted terms are pulled out.
   This discipline is a constraint, not a preference: a naive multi-line
   backtick-pair scan swallows whole regions and reports zero findings on a
   corpus with a known defect — blind-but-green, the worst failure mode a
   checker can have.
3. **Resolve** — the entry collects every target the parsed documents reference
   (link targets, path-like claim tokens) and materializes the repo snapshot as
   PLAIN DATA: npm script names, `node_modules/.bin` tool names, the set of
   referenced paths that exist, and the headings of referenced markdown targets.
   Load and Resolve are the ONLY phases that touch the filesystem, git, or
   `package.json`.
4. **Check** — each check (links, roster, claims, headings) maps parsed
   documents plus the snapshot to findings (the headings check consumes the
   baseline corpus instead of the snapshot — its second input is documents, not
   facts). Checks are pure: same input, same findings; they never import
   fs/git/process — all ground truth arrives as the snapshot's data or the
   baseline corpus.
5. **Report** — findings merge and print grouped by document, in corpus order
   then line order; any error-severity finding sets exit 1, advisories never do.

### Data flow

```mermaid
flowchart TD
    A[corpus paths] -->|read working tree| B[documents]
    A -->|read at HEAD| H[baseline documents]
    B -->|shared parse: blank fences, extract| C[parsed documents]
    H -->|shared parse: keep heading terms| I[baseline terms]
    C -->|collect referenced targets| R[repo snapshot]
    R -->|ground truth consulted by checks| D
    C -->|links check| D[findings]
    C -->|roster check| D
    C -->|claims check| D
    C -->|term presence diff vs baseline| D
    I -->|term presence diff vs baseline| D
    D -->|merge, group by document| E[report]
    E -->|any error severity| F[exit 1]
    E -->|advisories only, or clean| G[exit 0]
```

The headings check IS a term presence diff — the same term-extraction core the
migration mode uses, aimed at `HEAD` as the source and the working corpus as the
destination set, FILTERED to heading-kind terms, reporting advisories.

### Migration loss-lister mode

`--migration` is a second entry mode over the same term-extraction core: the
source document is read at a git ref, destinations from the working tree, and
every extracted term present in the source and absent from every destination is
listed as a candidate loss. It judges nothing and exits 0 on every SUCCESSFUL
run — the list is input to a human-authored loss ledger, not a verdict.
Operational failures (unresolvable ref, unreadable source or destination) fail
loudly, nonzero.

```mermaid
flowchart TD
    S[source document at git ref] -->|term extraction| T[source terms]
    W[destination documents, working tree] -->|term extraction| U[destination terms]
    T -->|presence diff| V[candidate losses]
    U -->|presence diff| V
    V --> X[list on stdout, exit 0]
```

### Constraints

- Checks are pure functions over parsed documents plus the snapshot — Load and
  Resolve (the entry) own all ground-truth access (fs, git, `package.json`,
  `node_modules/.bin`); the snapshot is plain data (no live resolvers), so
  fixtures are literals and checks judge without looking anything up.
- The claims recognition contract (which tokens are claims, how each class is
  classified, the named skip classes) lives in
  [README.md § Scope of each check](./README.md#scope-of-each-check) — the
  claims check implements it verbatim.
- One parse, one term-extraction implementation — shared by every check and by
  `--migration`; one place to fix false negatives.
- Fence blanking preserves line numbering end-to-end; inline code spans never
  span lines.
- **Slug contract** (links check): lowercase; drop every character outside
  letters, digits, spaces, and hyphens (`™`, backticks, and dots included); each
  space becomes one hyphen with runs preserved; the nth repeat of a heading
  gains `-{n-1}`. Anchor fixtures: `Vibetoading and Frogramming — house terms` →
  `vibetoading-and-frogramming--house-terms`; `Always Works™ Reality Check` →
  `always-works-reality-check`; ``7. No `this` Keyword`` → `7-no-this-keyword`;
  a second `Data flow` heading → `data-flow-1`.
- Only inline `[text](target)` links are checked; reference-style,
  angle-bracket, and titled links are out of reach (none exist in the corpus
  today) — a stated restriction, not a silent one.
- The roster check hard-fails on an unparseable roster: zero rows or a missing
  heading is a `ROSTER PARSE FAILURE` (exit 1), never an empty map — an empty
  map would silently pass everything. Its reviewer-only scope (`ar-*.md`) is a
  named skip class inside the check. Row-level breakage never hides: a row whose
  AR cell does not parse and a duplicate row are each their own error finding at
  that row's line (a duplicate must never silently overwrite), and a reviewer
  file with malformed frontmatter is a whole-document error. Attribution follows
  DEV.md's own "frontmatter wins" rule: parity and missing-row findings
  attribute to DEV.md at the row (or heading) line; name-vs-stem findings
  attribute to the agent file. The join key is the file stem. Trigger/Provide
  framing is checked per existing `### AR-N` section; section existence per row
  is deliberately not asserted.
- Zero silent suppressions: every skip class (http links, root-relative
  Docusaurus routes, non-path link targets, content-tree advisory paths, claims
  in `.claude/skills/**` documents, non-reviewer agent files in roster,
  placeholder/home-path/matching-glob tokens) is named in the check that skips
  it.
- `RepoSnapshot.existingPaths` is deliberately a `Set`: the snapshot is
  single-process, never serialized across a boundary, and never frozen by helper
  — "plain data" means no live resolvers, not JSON-primitives-only.
- The slugger handles plain-text headings only — emphasis markers, inline links,
  and HTML inside heading text are out of reach (no corpus heading contains them
  today); a stated restriction, not a silent one.
- Only backtick fences are tracked, with CommonMark run-length nesting (a
  shorter fence inside a longer one is content); indented (4-space) code blocks
  and tilde fences are out of reach (none exist in the corpus today) — a stated
  restriction, not a silent one.
- Severity is two-valued: `error` gates, `advisory` never does.
- A finding's line is `null` only for whole-document findings (unreadable file,
  roster parse failure).
- All phases are synchronous, single-process.
- The checker reads no test results and no lint results — the workflow mandates
  red phases, so a gate on them would fire on correct work.
- No `tools:` assertions in the roster check — reviewer toolsets are harness
  territory, measured by the harness-probe agent, never asserted by a checker.
- `--migration` splits `<src>@<ref>` on the LAST `@`; a nonexistent destination
  path is a loud error, never an empty-diff pass.
- Code conventions: `scripts/` follows DEV.md's functional conventions (named
  function declarations, no `this`, no mutable closures, validate at boundaries)
  with two stated exemptions — no deep-freeze helper (`@utils` is not reachable
  from `scripts/`; outputs stay internal), and the shared pure modules (the
  parse, the slugger, the term-extraction core) are exported and tested directly
  rather than only through a consuming check (these are tooling scripts, not
  product modules, so the test-through-the-public-export rule is deliberately
  relaxed at module grain — a check's internal helpers still stay unexported and
  are tested through the check).

### Out of scope

- Intent judgment — whether governance prose is wise stays with reviewers and
  humans; the checker only verifies that what prose names exists.
- Style and formatting — the linters own them.
- Measuring repo state (node version, tsc counts, lint counts) — that is the
  measured-facts oracle's job, a separate bounded context.
- When and whether the checker runs (advisory hook, CI, npm invocation) — the
  callers' business, registered at their own gates.
- Fixing — the checker reports; it never edits.
