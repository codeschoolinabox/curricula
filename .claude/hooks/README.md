# .claude/hooks — project tool hooks

> Written Phase 0, before implementation: the roster below is the contract the
> implementation is built to, and the test command lands with the first rule.

Python tool hooks registered in [../settings.json](../settings.json), part of
the tracked configuration inventoried in [../README.md](../README.md). One
design principle: **mechanise intent-independent command shape; leave intent to
the reviewers.** Architecture and constraints: [DOCS.md](./DOCS.md).

Current occupant: **the governance-guard**. Later tool hooks (the advisory
governance checker, the pinned-expectation guard) add their glossary and
protocol deltas to this README — and their sketch amendments to DOCS.md — at
their own gates, under their own reviews.

## Ubiquitous language

- **tool hook** — a PreToolUse/PostToolUse script registered in settings.
  Distinct from _the_ pre-commit hook (husky → lint-staged), which existing
  governance prose calls "the hook".
- **matcher** — the tool-name pattern a registration binds a tool hook to (the
  governance-guard's matcher is `Bash`).
- **registration** — the settings entry that makes a tool hook live. An
  unregistered hook is inert, and a registration binds a session only at session
  start — which is why every hook lands with a restart-then-live-fire gate.
- **payload** — the JSON object the harness writes to a tool hook's stdin. A
  `Bash`-matched payload carries a **command**; file-tool payloads differ and
  their hooks define their own terms in their amendments.
- **command** — the raw Bash command string carried by the payload.
- **segment** — a run of tokens between shell-operator tokens (`&&`, `||`, `;`,
  `|`, `&`, `(`, `)`, newline), obtained from one whole-command lex. When the
  whole command cannot be lexed, a raw-string split on those operators is the
  fallback, and its pieces are judged only by the coarse fallback.
- **token** — one shlex-parsed word of the command.
- **invocation** — the tool a segment invokes, matched by **basename** after
  skipping shell keywords (`if`, `for`, `time`, `!`, …), the runner prefixes
  (`npx`, `npm exec`, `env`, `sudo`) AND the runners' own flags (`env -i`,
  `sudo -u root`): `eslint`, `npx eslint`, and `./node_modules/.bin/eslint` are
  all the same invocation.
- **rule** — a named declarative row (name, invocation, forbidden shape, reason,
  correction) judged against one segment. Only `commit-pathspec` is bespoke
  logic; the flag-shaped rules share one implementation.
- **reason** — a rule's explanation for a deny; it lands in the wire field
  `permissionDecisionReason` and always carries the corrected command.
- **decision** — a tool hook's single output: `deny | ask | context | silence`.
  The governance-guard emits only `deny` and `silence`.
- **silence** — no output, exit 0: the allow path and every failure path.
- **coarse fallback** — the pattern, anchored to the segment start, that alone
  may judge an unparseable raw piece. Never a raw substring scan.
- **fail-open** — on any internal error the hook exits 0 with no output. This is
  a deliberate, scoped inversion of the house fail-fast default: guards fail
  open because the human's workflow outranks guard coverage; `src/` code keeps
  failing loud.
- **pin** — elsewhere in this repo "pin" means a _model pin_ (DEV.md § Sub-model
  dispatch). The test-expectation `PINNED` marker is a different concept; its
  guard defines its terms in its own amendment.

**Collision criterion** (applies to every future glossary in this layer):
governance-context collisions are renamed or disambiguated (`reason`, not the AR
protocol's "verdict"; "tool hook" vs "the hook"; "pin" ×2); far-context homonyms
inside `src/**` (embody's token/segment/payload) are tolerated and scoped by
directory.

## Roster — the governance-guard

`governance-guard.py` (PreToolUse, matcher `Bash`). Named rules, in registration
order; **every rule that matches contributes its reason to the one decision** —
a command tripping two rules teaches both corrections in one round-trip:

1. **`commit-pathspec`** — denies a `git commit` that has no message flag
   (`-m`/`--message`/`-F`/`--file`, glued, `=`, or space-separated values all
   recognized); or no bare `--` pathspec (or nothing after it); or `-a`/`--all`
   (including bundled short flags — note `-ma` is `-m` with the glued value `a`,
   per git's own semantics); or a whole-tree sweep (`-- .`, `-- :/`, `-- *`); or
   `--amend` — history rewrites are forbidden by governance, and covering them
   here keeps a fresh checkout guarded (the user-global destructive-git sibling
   also denies them where it exists; overlapping denies are harmless).
2. **`eslint-autofix`** — denies any eslint invocation carrying any
   `--fix`-prefixed flag (`--fix`, `--fix-dry-run`, `--fix-type`, …), at any
   token position, across runner families (`npx` — version pins included —
   `npm`/`pnpm`/`yarn` exec, direct paths). The sanctioned
   `npm run lint:fix:study-lenses` passes by construction: its own command line
   carries no eslint invocation.
3. **`markdownlint-globs`** — denies a markdownlint-cli2 invocation carrying a
   plain path argument (no metacharacter of the tool's glob dialect
   `* ? [ ] { } ! # :`) without `--no-globs`; flag values (`--config x`) are not
   path arguments, and glob-intended arguments pass.
4. **`write-flag-on-read-command`** — denies `--output` on
   `git diff`/`log`/`show` (subcommand-scoped through git's global options;
   matched exact-or-`=`, never prefix — `--output-indicator-*` are unrelated
   real flags, and `-O<orderfile>` reorders, it does not write) and `--fix` on
   markdownlint-cli2, at any token position (the settings denies are
   leading-position belts only).

## Protocol

Identical **in protocol** to the user-global `block-destructive-git.py`
precedent: payload on stdin; a deny printed as the
`hookSpecificOutput.permissionDecision` JSON on stdout; always exit 0; fail open
on any exception. The test layout deliberately differs — suites live in `tests/`
per this repo's test-organization convention. Precedence semantics live in
[../README.md § How settings compose](../README.md#how-settings-compose);
measured this campaign: repo-settings denies and user-global hook denies both
fire (2026-07-29 probe ledger).

## Threat model

The adversary is the agent itself running a forbidden shape by accident or
momentum — not a malicious actor. Determined bypass (shell wrappers like
`bash -c`, aliasing, encoding, command substitution) is out of scope, as in the
precedent; closing it would be an unwinnable arms race inside a fail-open guard.

## Tests

The DENY/ALLOW suites are this layer's only behavioral contract (types.ts is
deliberately N/A here — stdlib-python hooks per the precedent). **Run the suite
after any edit to any hook in this directory**:

```sh
npm run test:hooks
```

Plain python, no pytest: `(command, expected_reason_substring)` deny pairs and
allow commands piped to the hook as real payloads over a subprocess, asserting
the decision, the reason substring (rule attribution by name), and exit 0 on
every case including malformed payloads.
