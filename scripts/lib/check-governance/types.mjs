/**
 * Single typedef home for the governance checker's bounded context (see
 * scripts/DOCS.md). Checks reference these via
 * `@typedef {import('./types.mjs').Finding} Finding` — never redeclare.
 *
 * @typedef {object} CorpusDocument
 * @property {string} path Repo-relative path of a corpus file.
 * @property {string} content Full file text.
 *
 * @typedef {object} ParsedDocument
 * @property {string} path Repo-relative path of the corpus file.
 * @property {string[]} lines File lines with fenced-block lines BLANKED in
 *   place — indices match the file on disk exactly.
 * @property {{ text: string, line: number }[]} headings
 * @property {{ text: string, target: string, line: number }[]} links Inline
 *   `[text](target)` links only.
 * @property {{ text: string, line: number }[]} tokens Single-line inline-code
 *   spans.
 * @property {ExtractedTerm[]} terms The term-extraction core's output for
 *   this document.
 *
 * @typedef {object} RepoSnapshot Plain data (no live resolvers) — the
 *   Resolve phase materializes it for exactly the targets Parse found;
 *   checks never touch fs/git/package.json.
 * @property {string[]} npmScripts Script names from package.json.
 * @property {string[]} binTools Entries of node_modules/.bin.
 * @property {Set<string>} existingPaths Repo-relative referenced paths that
 *   exist on disk (globs count as existing when they match at least one
 *   file).
 * @property {Record<string, string[] | null>} headingsByPath Headings of
 *   each referenced markdown target (null = unreadable or not markdown).
 * @property {Set<string>} matchingGlobs Referenced glob tokens that match at
 *   least one file (a glob matching nothing follows the path rules).
 *
 * @typedef {'error'|'advisory'} Severity `error` sets exit 1; `advisory`
 *   never affects the exit code.
 *
 * @typedef {object} Finding
 * @property {string} path Corpus file the finding is in.
 * @property {number|null} line 1-based line number; null only for
 *   whole-document findings (unreadable file, roster parse failure).
 * @property {'links'|'roster'|'claims'|'headings'} check Reporting check.
 * @property {Severity} severity
 * @property {string} message Human-readable description naming the offending
 *   token and what was expected.
 *
 * @typedef {object} RosterRow
 * @property {string} name Registered reviewer name (`ar-1`…`ar-5`).
 * @property {string|null} model Explicit model pin, or `null` = inherit (no
 *   `model:` line in the agent frontmatter).
 *
 * @typedef {object} Claim
 * @property {string} path
 * @property {number} line
 * @property {'npm-script'|'npx-tool'|'path'|'git-verb'} kind
 * @property {string} token The backticked text as written. Claims are purely
 *   descriptive — the claims check derives severity from kind and prefix.
 *
 * @typedef {object} ExtractedTerm
 * @property {'heading'|'bold'|'token'|'mermaid-node'} kind
 * @property {string} term The extracted text.
 * @property {number} line 1-based line in the source document.
 * @property {string} sourcePath Document the term came from.
 */

export {};
