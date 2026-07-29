# .claude — tracked project configuration for Claude Code

This directory is governance surface: agents do not edit it without explicit
human instruction in the current conversation — the same standing rule as branch
creation (AGENTS.md § Git policy).

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
  prefix matching cannot catch a flag in trailing position. Known gap, measured
  2026-07-29: the vitest allow admits `--update` and first-run snapshot writes;
  the unit project contains zero snapshot tests today — re-evaluate the entry if
  snapshot tests ever land.
- **`agents/`** — the registered adversarial reviewers (`ar-1`…`ar-5`), invoked
  by name per DEV.md § Adversarial Review Protocol.
- **`skills/`** — repo skills, loadable from this repo root.

`settings.local.json` is personal, per-machine state (session-accumulated
permission grants). It is untracked by global gitignore and never committed.

## How settings compose

Settings files merge across levels (user-global, project, project-local). Hooks
registered at every level all fire; for permissions, **any deny wins over any
allow**, regardless of level. Project-level entries here therefore extend — and
can tighten, but never loosen — the user's global configuration.

## The snapshot caveat

A session reads hooks and permissions **at session start**. A newly committed
change to `settings.json` protects the session that made it only after that
session restarts, and protects peer sessions only after each of them restarts.
When this file changes, restart at the next clean boundary.
