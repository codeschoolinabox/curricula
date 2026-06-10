# Claude Code — project instructions

Read your governance file NOW, before any other work in this repository:

- **Fable-generation agents** (your model id contains `fable`): read and follow
  [AGENTS.fable.md](./AGENTS.fable.md).
- **All other agents and tools** (Opus 4.x, Sonnet 4.x, Haiku 4.x, Cursor,
  Copilot, CLI agents): read and follow [AGENTS.md](./AGENTS.md).

Check the model id in your environment context to decide. The two files carry
the same policy gates, tuned per agent generation; the one that doesn't match
your generation does not apply to you. If AGENTS.md was auto-loaded into your
context and you are fable-generation, AGENTS.fable.md supersedes it for you.

Both governance files point into [DEV.md](./DEV.md) — the single canonical
reference for code conventions, file anatomy, the testing strategy, the
Adversarial Review protocol (including sub-model dispatch), and linting. Read
its sections on demand, as the governance files direct. `HUMANS.md` is the human
collaborator's manual; it contains no agent instructions.

(This file deliberately imports nothing: an `@import` loads unconditionally, so
importing either AGENTS file would load it for the wrong generation too. The
read instruction above is the router.)
