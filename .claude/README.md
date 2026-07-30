# .claude — tracked project configuration for Claude Code

This directory is governance surface: agents do not edit it without explicit
human instruction in the current conversation — the same standing rule as branch
creation ([AGENTS.md § Git checkpoints](../AGENTS.md#git-checkpoints), or
[AGENTS.principal.md § Git Policy](../AGENTS.principal.md#git-policy) if that is
the file `CLAUDE.md` routed you to).

## What is tracked here

- **`settings.json`** — project-level permissions shared by every session and
  every fresh checkout. The allowlist carries only read-only verification
  commands (git reads, `tsc --noEmit`, cspell, per-file markdownlint, the scoped
  unit-test runner) — prompting on the behavior we want more of taxes it. The
  denylist blocks the write flags that can ride otherwise-read-only commands:
  `npx eslint --fix` (severity-blind autofix, crater `0e05c5ac`; the sanctioned
  scoped path is `npm run lint:fix:study-lenses`), `git diff`/`log`/`show`
  `--output=` (an arbitrary-path write primitive on read commands), and
  `markdownlint-cli2 --fix`. These denies are leading-position prefix belts —
  prefix matching cannot catch a flag in trailing position; the governance-guard
  hook covers any position. The `Bash(npx eslint:*)` allow rides in the same
  commit as that hook's registration: `--fix` at any position is guard-denied,
  and the wider eslint flag surface (`--rulesdir`, `--plugin`, custom parsers —
  all execute local JS) is accepted under the hooks' stated momentum-not-malice
  threat model. Known gap, measured 2026-07-29: the vitest allow admits
  `--update` and first-run snapshot writes; the unit project contains zero
  snapshot tests today — re-evaluate the entry if snapshot tests ever land.
- **`hooks/`** — project tool hooks: the governance-guard (PreToolUse Bash,
  deny-capable), the governance-advisory (PostToolUse Edit|Write, context-only —
  relays the governance checker's findings for an edited corpus document, never
  blocks), and the pinned-guard (PreToolUse Edit|Write, ask-only — asks before
  an edit erases a pinned test expectation); roster, ubiquitous language, and
  protocol in [hooks/README.md](./hooks/README.md), architecture in
  [hooks/DOCS.md](./hooks/DOCS.md).
- **`agents/`** — the registered adversarial reviewers (`ar-1`…`ar-5`), invoked
  by name per
  [DEV.md § Adversarial Review Protocol](../DEV.md#adversarial-review-protocol);
  the harness-probe (measures the live subagent harness at harness/model
  upgrades); and the tdd-worker (the orchestrated fan-out's worker contract —
  the registry snapshots at session start, so a fresh registration is spawnable
  after the next restart).
- **`skills/`** — repo skills, loadable from this repo root.

`settings.local.json` is personal, per-machine state (session-accumulated
permission grants). It is untracked by global gitignore and never committed.

## How settings compose

Settings files merge across levels (user-global, project, project-local). Hooks
registered at every level all fire; for permissions, **any deny wins over any
allow**, regardless of level. Project-level entries here therefore extend — and
can tighten, but never loosen — the user's global configuration.

## The snapshot caveat

Propagation of `settings.json` changes is a harness property that has varied
across observations: hooks and permissions were measured to bind at session
start (2026-07-29, morning), while current Claude Code documentation states hook
changes hot-reload via a file watcher. Treat propagation as version-dependent —
after changing this file, VERIFY the change is live with a cheap probe rather
than assuming either way; a restart at the next clean boundary remains the
reliable fallback, for this session and for peers.
