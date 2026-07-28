# Claude Code — project instructions

Read your governance file NOW, before any other work in this repository:

- **Principal agents** — models with the capacity to manage context effectively
  across long sessions, reason strategically and architecturally about a
  codebase, and delegate work to subagents effectively. Check your model id in
  your environment context against the qualifying list below; if it matches,
  read and follow [AGENTS.principal.md](./AGENTS.principal.md).
- **All other agents and tools** (any model id not on the list below, plus
  Cursor, Copilot, and other CLI agents): read and follow
  [AGENTS.md](./AGENTS.md).

**Current qualifying model-id substrings** — update this list (never the file
names) when a new model qualifies for principal governance; see
[HUMANS.md § Update triggers](./HUMANS.md#update-triggers):

- `fable`

The two files carry the same policy gates; the capacities above are the
selection criterion, not the whole difference — `AGENTS.md` additionally carries
§ Safety Guardrails' mandatory risk-class warnings, which `AGENTS.principal.md`
assumes are internalized rather than prompted. Only one file applies to you —
read that one. If AGENTS.md was auto-loaded into your context and your model id
matches the list above, AGENTS.principal.md supersedes it for you. If you
switched models mid-session via `/model`, the environment block can go stale —
ground truth is what an unpinned subagent reports as its own model when spawned
fresh; if you can't determine your model id at all, use `AGENTS.md`.

Both governance files point into [DEV.md](./DEV.md) — the single canonical
reference for code conventions, file anatomy, the testing strategy, the
Adversarial Review protocol (including sub-model dispatch), and linting. Read
its sections on demand, as the governance files direct. `HUMANS.md` is the human
collaborator's manual; it contains no agent instructions.

(This file deliberately imports nothing: an `@import` cannot be conditioned on
which file matches, so importing either AGENTS file would load it for the wrong
one too. The read instruction above is the router.)
