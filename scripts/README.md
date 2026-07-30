# Scripts

> Written Phase 0, before implementation: the checks below are the contract the
> implementation is built to; the vitest include and the `typecheck:scripts`
> gate land with the first check, and the npm entry lands with the checker's
> entry point.

Repository tooling — standalone Node scripts that lint, verify, and measure this
repo. Nothing here ships with the Docusaurus site build.

## Inventory

| Script                      | What it does                                                                      | npm entry                       |
| --------------------------- | --------------------------------------------------------------------------------- | ------------------------------- |
| `lint-all.mjs`              | Compound linter: eslint (code + `.mdx`), markdownlint-cli2, ls-lint, cspell       | `npm run lint`                  |
| `lint-fix-study-lenses.mjs` | The one sanctioned, scoped autofix (study-lenses tree only)                       | `npm run lint:fix:study-lenses` |
| `check-governance.mjs`      | Governance checker: verifies the governance corpus keeps naming things that exist | `npm run check:governance`      |

**Standing rule:** new checks get their own npm script — never added to
`lint-all.mjs`, and never a blocking CI step while repo-wide lint debt burns
down.

## Governance checker

The checker guards against governance rot: prose that names npm scripts, tools,
paths, anchors, or reviewers that no longer exist. It judges existence and
consistency, never intent or style.

### Ubiquitous language

- **corpus** — every root `*.md`, plus `.claude/**/*.md` and `scripts/**/*.md`,
  MINUS a deny-list in which every entry carries its reason (currently:
  `research-framing.md` — curriculum research orientation, not governance).
  Fail-closed: a corpus path that cannot be read, or a corpus glob that matches
  nothing, is an error — never a silent skip. Content trees (`src/`,
  `spiralearn/`) are permanently out: they carry hundreds of dead references by
  design, and as a gate that noise is worthless. (Far-context homonym note:
  `src/**` uses "corpus" for JeJ/eval example sets — tolerated, scoped by
  directory.)
- **document** — one corpus file as `{path, content}`.
- **parsed document** — a document reduced to checkable regions: fence-blanked
  lines (indices match disk), headings, links, backticked tokens, extracted
  terms.
- **repo snapshot** — plain data the entry materializes for exactly the targets
  parsing found: npm script names, bin tool names, existing paths, headings of
  referenced targets, matching globs. The checks' only window onto the repo.
- **baseline** — the corpus as it reads at `HEAD`; the headings check diffs the
  working corpus against it.
- **check** — one verification over the corpus (links, roster, claims,
  headings), implemented as pure functions. "Check" deliberately avoids
  "module", which this repo's governance uses for source directories documented
  by their own README/DOCS/types — this checker's live here at `scripts/`;
  links/roster/claims/headings are its checks.
- **finding** — one violation a check reports: path, line, reporting check,
  severity, message. (Distinct from the AR protocol's "findings", which are
  human-reviewer output.)
- **severity** — `error` (sets exit 1) or `advisory` (reported, never affects
  the exit code). A third vocabulary on purpose: AR reviews use
  BLOCKER/IMPORTANT/MINOR and linters use error/warning; `advisory` matches the
  governance-advisory hook channel. Content-tree paths are advisory: governance
  should not hardcode volatile content paths at all, so the checker nudges each
  one toward alias/concept/discovery form as it is touched — it never gates on a
  path class that changes by design. Claims found in `.claude/skills/**`
  documents are likewise advisory: peer campaigns own their skills, and this
  gate must never force edits to them.
- **claim** — a backticked reference in governance prose that names something
  executable or on disk: `npm run <script>`, `npx <tool>`, a path-like token, a
  `git <verb>` in an AGENTS file. Claims must name things that exist. (Narrower
  than the campaign's "measured vs remembered claims" — this is only the
  mechanically checkable subset.)
- **extracted term** — what the shared term-extraction core pulls from a
  document: a heading, bold term, backticked token, or Mermaid node label, with
  its line.
- **candidate loss** — an extracted term present in a source document at a git
  ref and absent from every destination file (`--migration` output). Matching is
  exact text, no case folding — a recapitalized term shows up as a candidate
  loss for the ledger to answer; a term repeated in the source is listed once,
  at its first location.

### Scope of each check

- **links** — inline `[text](target)` links only, in the forms `#<fragment>`,
  `<relative-path>`, and `<relative-path>#<fragment>`: the file must exist and
  the fragment must match a GitHub-exact slug. A dead link is an error
  regardless of target tree — a rendered dead link is a reader-facing break, not
  a style nudge (the corpus today contains none pointing into content trees). A
  backticked span is never a link: code spans are extracted before link parsing.
  Skips (named, deliberate): `http(s)` URLs, root-relative Docusaurus routes,
  and non-path targets (a scheme other than `http(s)`, or a space in the
  target). Prose that is not an inline link is the extractor's negative space,
  not a skip class.
- **roster** — `.claude/agents/ar-*.md` reviewer frontmatters against DEV.md's
  sub-model dispatch table: name/stem equality, bidirectional set equality,
  model parity, Trigger/Provide framing lines. Scoped to the reviewers on
  purpose: other agent files (for example the harness-probe) are covered by the
  claims and headings checks only.
- **claims** — see the glossary entry. **Recognition contract** (the claims
  analog of the slug contract): extraction tokenizes inside multi-word code
  spans; then each token is classified —
  1. `npm run <script>` → the FIRST word after `npm run` must exist in
     `package.json` (error); trailing arguments are not part of the script name.
  2. `npx <tool>` → the FIRST word after `npx` must exist in `node_modules/.bin`
     (error); trailing flags are not part of the tool name.
  3. **path-like** means: the token's characters stay within path charset
     (letters, digits, `@ . / - _`), AND it contains `/` AND (opens with a
     recognized prefix, OR its last segment carries a known file extension, OR
     it ends with `/`) — or it is a bare filename with a known extension. Tokens
     like `import/order` (eslint rule ids), `Object.freeze` (API references),
     and `vi.mock('./sibling')` (code snippets) are not path-like and are
     ignored. `@utils/<rest>` is the one recognized import alias: it resolves
     against the alias's real target and a broken one is an error.
     `./node_modules/<rest>` is a shell-invocation form and resolves from the
     repo root.
  4. a path-like token opening with an infrastructure prefix (`./` and `../`
     resolved from the document's directory, `.claude/`, `scripts/`, `.github/`,
     `eslint-rules/`) → must exist (error);
  5. a path-like token without a leading prefix, and any bare filename, resolves
     from its document's directory FIRST and from the repo root as the fallback;
     existing at either accepts. A missing one is an error when the doc-relative
     resolution lands in an infrastructure directory, advisory otherwise
     (existing content-tree paths pass silently — the advisory is a
     broken-reference nudge, not a permanent nag; the no-volatile-paths style
     rule lives in governance prose, not here). Stated reach limit: resolution
     never searches the repo — an elliptical bare `<filename>.ts` mention of a
     file living elsewhere reads as a standing advisory; accepted trade-off,
     flagged for the human audit. A bare extension with no basename (`.mdx`
     alone, naming a file TYPE) is not a filename and is ignored;
  6. a `git <verb>` in an AGENTS file (any root `AGENTS*.md`) → the VERB (first
     word after `git`) must appear among the verbs of that file's own
     Allowed/Forbidden lists (error); matching is verb-level, so
     `git rev-parse HEAD` is covered by a bare `git rev-parse` list entry. List
     entries themselves define the sets and are never flagged.
  7. named skip classes: tokens containing `<angle>` or `[square]` placeholders;
     bare prefixes standing alone as syntax under discussion (`./`, `../`, git's
     `:/`, a lone infrastructure directory); bare glob patterns with no
     directory (pattern illustrations); `~/`-home paths (outside the repo);
     leading-`/` tokens (app slash-commands like `/clear` and root-relative
     shorthand — neither is a checkable repo path); bare convention nouns
     (`README.md`, `DOCS.md`, `types.ts`, `index.ts`, `tests/` — generic
     directory-anatomy references, not file claims); and glob tokens that match
     at least one file (a glob matching nothing follows the path rules above).
- **headings** — advisory only: headings present in a document at `HEAD` and
  missing from the entire working corpus.

### Running

- Full check: `npm run check:governance` — exit 1 on any error-severity finding;
  advisories print but never fail the run.
- Migration loss-lister:
  `node scripts/check-governance.mjs --migration <src>@<ref> <dest...>` — reads
  the source at the git ref (split on the LAST `@`), the destinations from the
  working tree (any paths, not corpus-restricted), and prints candidate losses.
  It judges nothing and exits 0 on every SUCCESSFUL run — the list is never a
  verdict; operational failures (unresolvable ref, unreadable source or
  destination) fail loudly, nonzero. The list is what a migration's **loss
  ledger** must answer.

**Honest reach of the loss-lister** — detectable: headings, bold terms,
backticked tokens, Mermaid node labels. **Undetectable:** plain
constraint/rationale sentences, unbackticked bullet items and table cells,
code-fence bodies, link targets, semantic weakening ("must" → "should" — text
present, force gone), and multiplicity loss — a term that appears more than once
in the source is detected only when ALL of its occurrences vanish. **An empty
loss-lister does not discharge the ledger.**

### Tests

Checker checks are tested in a `tests/` subdirectory beside the checks, run by
the vitest `unit` project: `npm run test:unit scripts/`. Checks take parsed
documents plus an entry-built snapshot — tests never touch the filesystem. The
typedefs are load-bearing, not decorative: `npm run typecheck:scripts` (a
`checkJs` pass over `scripts/**`) enforces them; it runs standalone and is
deliberately not part of `npm run validate` or `lint-all.mjs`.
