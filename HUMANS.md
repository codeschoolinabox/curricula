# HUMANS.md — Operating Manual for the Human in the Loop

> **Audience: you, the human collaborator.** This file is your protocol; the
> agent's is in `AGENTS.md` (agents and tools not on the principal-agent list)
> and `AGENTS.principal.md` (principal agents — models with the capacity to
> manage context over long sessions, reason strategically/architecturally, and
> delegate effectively; see `CLAUDE.md` for the qualifying list); your style
> across all projects is in `~/.claude/CLAUDE.md`; the contributor conventions
> are in `DEV.md`. Three doors out, one door in: this is your door. It captures
> _your end of the bargain_ — protocols you follow, when to /clear, when to
> commit, how to coach the agent, and how to override its safety rails when you
> need to.

## Why this file exists

The 5-hour Opus limit ran out faster than expected. Long sessions accumulate
context cruft (rejected alternatives in plan files, stale handoff folders, agent
self-reports of relevance that aren't reliable signals). Subagent spawns are
intended to reload the matching governance doc as fresh context per spawn, but a
harness reliably doing so for every spawn path isn't something this repo can
verify — see § Orchestrated delegation in whichever governance file applies to
you ([AGENTS.md](./AGENTS.md#orchestrated-delegation) or
[AGENTS.principal.md](./AGENTS.principal.md#orchestrated-delegation)) for the
explicit-read backstop that doesn't depend on it. Opus on max for everything
(including AR-3/AR-4 reviewers that don't need it) burns tokens that Sonnet
would handle indistinguishably.

This file's protocols are the discipline that recovers session efficiency
without sacrificing the rigor that makes the work hold up.

---

## Contents

- [Session sizing rules](#session-sizing-rules)
- [Model selection rules](#model-selection-rules)
- [Plan-clutter discipline](#plan-clutter-discipline)
- [Coaching contract](#coaching-contract)
- [Override grammar](#override-grammar)
- [Tool inventory](#tool-inventory)
- [Verification rituals](#verification-rituals)
- [Field protocols](#field-protocols)
- [Anti-protocol — patterns to catch yourself in](#anti-protocol--patterns-to-catch-yourself-in)
- [What NOT to delegate to the agent](#what-not-to-delegate-to-the-agent)
- [Update triggers](#update-triggers)

---

## Session sizing rules

Long sessions decay. Plan for it.

**Default to one Phase 0 increment per session, then `/clear`.** Phase 0 (DDD:
ubiquitous language → README → AR-1 → types.ts → architectural sketch → AR-2) is
heavy context. Phase 0 + Phase 1 in one session is where context decay starts to
bite. After Phase 0 commits land, the natural break point is now. The agent
should remind you of this when Phase 0 finishes; you decide whether to push
through.

**Commit between increments, not at session end.** Each passing TDD cycle is one
atomic commit. If you finish three increments before committing, you have three
commits to write at once with stale context — that's the recipe for sloppy
commit messages and skipped doc updates.

**`/clear` after milestone, not on the wall.** The 5-hour limit sneaks up. By
the time you notice you're at 80% context, you're already paying compaction tax
(Anthropic team's own data: ~90% code quality drop, per `~/.claude/CLAUDE.md`
Anthropic-tips section). Stop at ~75% context, not 80% — the last 20% is
compaction-tax territory. Better cadence: after every committed milestone (Phase
0 done, increment shipped, AR-5 closed), check in with yourself — does this
session need to continue, or is now the natural break?

**Don't trust the agent's self-report on context state.** When you ask "how much
context do you have left?" the answer is a confident guess, not a measurement.
Trust the statusline (configured to show context %, current model, time
remaining in 5-hour window) over the agent's introspection.

**Handoff folders cost setup time.** `.handoff*/` folders work, but the overhead
of writing them and resuming from them is substantial. Reserve handoffs for
genuinely unfinished multi-session work. For routine Phase 1 increments, the
plan file + git history is sufficient handoff.

---

## Model selection rules

You're on the Max plan. Opus is the default. Reserve Sonnet for tasks where the
quality cliff is small or absent.

**Use Opus for:**

- Phase 0 design work (DDD, ubiquitous language establishment, architectural
  sketch authoring)
- AR-1 (Design Challenge) — drift / cross-cutting (the one pinned judgment
  review; AR-2 and AR-5 are deliberately NOT pinned — they inherit the session's
  model so they track the authoring tier, see Sub-model dispatch below)
- Plan authoring, especially in plan mode
- Hard refactors where the structural target is unclear
- Cross-cutting changes that touch multiple modules

**Use Sonnet for:**

- AR-3 (Test Strategy Challenge) — implementation correctness
- AR-4 (Implementation Audit) — implementation correctness
- TDD increment work where the path is clear
- Lint / format cleanup
- Single-file fixes
- Routine doc edits inside an established structure
- Researching files (Explore subagent — most reads don't need Opus reasoning)

**Use Haiku for:**

- File moves / renames
- Format-only changes
- Commit message proposals (when the changeset is small)
- Trivial subagent reads that need only "find this and report it"

**Sub-model dispatch when spawning subagents:**

AR-1/AR-3/AR-4 pin their model via the registered `ar-N` agent definitions'
frontmatter (opus/sonnet/sonnet); AR-2/AR-5 inherit the spawning session's
model. Never pass a `model` parameter when spawning an AR — it would silently
override the configured roster. The authoritative table lives in
[DEV.md § Sub-model dispatch](./DEV.md#sub-model-dispatch); if the agent doesn't
follow it without prompting, point it there.

You can also set per-agent default models in `.claude/agents/<name>.md`
frontmatter (`model: sonnet`) for any reusable agent definition — the registered
reviewers live in this repo's `.claude/agents/`, not the global
`~/.claude/agents/`.

---

## Plan-clutter discipline

Plan files grow rejected alternatives, "how we got here" history, and "what we
considered" footnotes. Over time, you can't tell live decisions from rejected
ones. The plan stops being a checklist and becomes archaeology.

**Live plan ≠ history book.** When a decision lands, prune. Rejected
alternatives go to git history (the commit message can summarize), not the live
plan file. The plan represents _what we are doing now_, not _what we
considered_.

**On resume after compaction or a fresh session:** read the plan file once and
ask yourself: "If a new agent picked this up cold, would the plan tell them what
to do, or would they have to read between the lines?" If the latter, prune
before continuing.

**The agent should help you prune, not generate clutter.** When the agent
proposes plan updates that include "considered alternatives", "previous
attempts", or "context for why we're not doing X", redirect: _"Drop the history.
Keep only what's still live."_

The mirror rule for end-state docs (READMEs, DOCSes, types.ts) is in
[`DEV.md` § What goes in docs vs. plans vs. handoffs](./DEV.md#what-goes-in-docs-vs-plans-vs-handoffs):
process talk that belongs in plan files MUST NOT appear in end-state docs.
Plan-clutter discipline prunes the plan; the docs rule keeps process out of the
contract entirely.

---

## Coaching contract

You and the agent each have responsibilities. Yours, in priority order:

**Push back when the agent is being lossy.** Multi-file refactors, cleanups,
"simplifications", architectural changes — these are exactly the patterns where
the agent has historically broken working systems. AGENTS.md has the warnings.
For any commit that moves, restructures, or trims documentation, **demand the
loss ledger**
([DEV.md § Documentation migration discipline](./DEV.md#documentation-migration-discipline)):
every omission, merge, or reword enumerated with its justification. "Cleaner" is
not a justification, and an empty mechanical listing does not discharge the
ledger — your refusal to accept unledgered loss is the enforcement half of that
rule. When you read a "Mandatory user warning" from the agent, read it
seriously. The fact that it fired means the agent is in the danger zone, not
that it's being overcautious.

**Insist on plan mode for non-trivial work.** Even when the agent is confident.
Especially when the agent is confident. The plan mode discipline catches
misunderstandings before code is written.

**Respond to AR verdicts.** PROCEED, you continue. CONSIDER, the agent should
already be addressing the concerns; verify it actually did, not just claimed it
did. PAUSE means stop and decide together — never let an agent override a PAUSE.

**Verify the Always Works™ checks.** When the agent says "ready for review,"
ask: did you run the code? did you trigger the exact feature? did you observe
the result? Untested code is a guess, not a solution.

**The agent's responsibilities back to you live in `AGENTS.md`** (Risk
Assessment warnings, AR mandatoriness, context-capacity surfacing, Phase 0
non-negotiable invariant) **and `~/.claude/CLAUDE.md`** (certainty
quantification, no marketing speak, leading with risks). When you notice the
agent failing to fulfill one of those, name the missing behavior — that's
coaching.

**ARs are mandatory and not skippable by the agent.** Non-negotiable. The whole
reason ARs exist is that the agent cannot be trusted to assess whether risks are
present in _this particular case_. The agent must NEVER propose skipping an AR
on its own assessment. You are the only one who can override, and you do it via
the override grammar below.

---

## Override grammar

**Only the human uses these phrases.** The agent never proposes them, never asks
"should we skip AR-3 this increment?", never preemptively offers "trivial fix
mode" as a shortcut. If the agent finds itself drafting any of these phrases,
that is the signal it is rationalizing skipping ceremony and must instead
surface the friction explicitly. ARs are mandatory; only the human's explicit
invocation flips that.

**Phrases below are listed verbatim.** The agent should accept close paraphrases
("skip the alignment check" for "skip alignment check") but reject
reinterpretations ("let's just go" is NOT "skip plan mode").

Sometimes you genuinely need to override the agent's defaults. Use these phrases
— they are recognizable signals to the agent that you have made an explicit,
considered choice:

- **"skip plan mode"** — proceed directly to execution. Agent confirms it heard
  you and proceeds.
- **"skip alignment check"** — bypass the Belgian-flavored alignment checkpoint
  from `~/.claude/CLAUDE.md`.
- **"skip AR-3 this increment, my call"** (or AR-1/2/4/5) — override a specific
  AR. Agent notes the override in the commit/conversation. ARs default to
  mandatory; this is the only legitimate way to skip.
- **"override and proceed"** — when the agent has flagged a risk and you
  acknowledge it. Agent proceeds with the risk noted.
- **"trivial fix mode"** — for typo fixes, lint cleanup, format-only changes, or
  other edits that touch a single file with no public-API surface. Phase 0 is
  **not bypassed** — Phase 0 governs _new module establishment work_ (DDD,
  ubiquitous language, architectural sketch). Trivial fixes aren't Phase 0 work
  in the first place. If the change touches a public type, an exported function
  signature, a peer-file contract, or a `DOCS.md` data flow, **trivial fix mode
  does NOT apply** and the agent must refuse this label. Always Works™
  verification still applies in all cases.
- **"meta mode"** — non-code work (planning conversations, reading sessions,
  refactor design). Agent skips test-writing and code-output expectations.
- **"explore only, no edits"** — research session. Agent reads and reports; must
  not produce code changes.

If you find yourself needing an override phrase that isn't here, it's worth
adding to this file rather than improvising — the agent doesn't recognize ad-hoc
phrases reliably.

**Override is not skip-with-no-record.** Every override should be visible: in
the conversation, in the commit message, or in a plan-file note. Future-you
needs to see "this AR was skipped on 2026-04-28 because [reason]" so the audit
trail isn't broken.

---

## Tool inventory

Quick reference for the tools you can fire (or that I can fire on your behalf).

**Local-session tools (burn 5-hour limit):**

- **`/security-review`** — built-in skill. Reviews pending changes for security
  issues. Useful before any commit that touches auth, validation, or network
  code.
- **Local AR-5 via Agent tool** — what the AR Protocol describes
  ([DEV.md § Sub-model dispatch](./DEV.md#sub-model-dispatch)). AR-1/3/4 pin
  opus/sonnet/sonnet via their agent definitions; AR-2/5 inherit. Never pass a
  `model` parameter.

**Remote tools (don't burn 5-hour limit, run in cloud):**

- **`/schedule`** — cron remote agents. Useful for nightly doc audits, scheduled
  branch reviews, or "remind me to check X tomorrow." Runs against committed
  state only — no in-flight work visibility.
- **`/ultrareview`** — multi-agent cloud review of current branch or PR.
  _Currently outside your subscription tier._ If you upgrade, this could replace
  AR-5 entirely (commit final increment → fire `/ultrareview` → walk away →
  resume next session reading the report).

**Configuration (skills + agents):**

- **`statusline-setup`** — Agent type, invoked via the Agent tool (NOT a slash
  command). Configures `~/.claude/settings.json` to display tokens used, context
  %, current model, time-remaining. Run once; persists across sessions.
- **`/fewer-permission-prompts`** — Skill that auto-generates an allowlist for
  common read-only Bash and MCP calls. Reduces interruption density.
- **`/update-config`** — Skill for `settings.json` edits via the harness. Use
  for hooks, permissions, env vars.

**Tracked project guardrails (in-repo, reach every session and checkout):**

- **`.claude/settings.json`** — shared permissions (read-only verification
  allowlist, write-flag denies) and the tool-hook registrations.
  `settings.local.json` stays personal and untracked. **Propagation caveat:**
  whether a settings/hook change binds at session start or hot-reloads has
  varied across observations (bind-at-start measured 2026-07-29 morning;
  hot-reload live-fired the same day) — treat it as version-dependent: verify
  with a cheap probe after a change lands, or restart at the next clean boundary
  (peers too).
- **`.claude/hooks/`** — three occupants. The governance-guard (denies bad
  command shapes: pathspec commits, autofix, markdownlint form, write-flags).
  The governance-advisory (after an agent edits a governance doc, it relays the
  checker's findings into that agent's context — invisible to you, never
  blocking). The **pinned-guard**: when an edit would erase a
  `// PINNED(<reason>)` test ruling, you get an ASK prompt quoting the pin —
  approving it is YOUR sign-off on inverting a settled expectation; decline if
  the ruling stands. After ANY hook edit: `npm run test:hooks` — the suites are
  the layer's only behavioral contract.
- **`/btw` (`Cmd+;`)** — side-question overlay that does NOT enter the
  conversation context; use it for questions that don't need to steer the
  running task.
- **Plugin choices (2026-07-29 survey):** LSP is native in the VS Code extension
  (no plugin needed);
  `claude plugin install security-guidance@claude-plugins-official` from a
  terminal if wanted; keep MCP servers ≤3-4 and verify `/context` shows their
  tools "deferred".

**NOT a substitute for AR-5:**

- `/review` — built-in skill, but **only for GitHub PRs**, not generic local
  changesets. Don't reach for it as a local AR-5 substitute.

---

## Verification rituals

After each phase or substantial change, run through this list yourself. The
agent claims things are done; you verify they actually are.

**After a Phase 0 (new module):**

- Read README.md, types.ts, and DOCS.md together. Can you predict what the
  implementation will do?
- Verify AR-1 and AR-2 actually fired (check for the spawned agents in
  conversation history)
- Check that the commit message describes the artifacts
  (`docs: establish [module] domain model and architectural sketch`)

**After a Phase 1 increment:**

- Pull the file. Did the agent actually run the tests, or just claim it did?
  `npm run test path/to/test` is one command.
- Read the diff. Is the change _only_ what was specified, or did scope-creep
  sneak in?
- Verify the commit message describes the behavior, not the mechanical change

**After a refactor:**

- `git diff` between base and HEAD; for each file, ask: did any _behavior_
  change, or only structure?
- `npm run test` (full suite, not just affected); zero failures, no skips that
  weren't skipped before
- Open the relevant `DOCS.md` sketch; for each module touched, name the named
  phases the sketch lists, then grep the source for those names. If a phase from
  the sketch is missing in the source, the refactor drifted and you have
  follow-up work.

**After a sandbox checkpoint:**

- Actually exercise the feature in the browser. Did you see what the agent said
  you'd see? If the agent said "tabs / single quotes / semicolons / 80-col wrap"
  and you see four-space indents, the test was wrong.

**In any message, at any time:**

- **An untagged repo-state claim is the tell — ask for the command.** When the
  agent says what a file contains, what a command outputs, or what was ruled, it
  owes you `[measured:]`, `[read:]`, or `[relayed:]` with the evidence
  ([DEV.md § Sourced claims](./DEV.md#sourced-claims)). The dangerous ones do
  not sound uncertain; they sound settled. "Which command?" costs you four
  words.
- **"You ruled X" with no citation is the other tell.** Rulings live in
  `PINNED(...)`, a `.planning-handoffs/<campaign>/AR-LOG.md`, or a dated
  `(human ruling YYYY-MM-DD)` line
  ([DEV.md § Ruling provenance](./DEV.md#ruling-provenance)). An agent has
  invented one before. Ask where it is written.

**Citation and claim conventions (your rulings, 2026-07-30 — re-decide any
time):** the tag rule is canonical in `DEV.md` with a short invariant in both
AGENTS files pointing in; `§` citations are links with a fragment, swept corpus-
wide, strict on the heading name with qualifiers left outside the link and
unanchored numeric shorthand banned; `AGENTS.principal.md` carries its own
cold-start-handoff heading; the ` ```quote ` fence pilot is deferred to the
session that builds its checker.

**Standing accepted risks (your rulings, 2026-07-29 — re-decide any time):**

- `~/.claude/settings.json` still auto-approves `git push`/`git rebase`/
  `git pull`, held back only by a fail-open hook. You ruled the purge out of
  scope; the repo-tracked guard covers commit shapes but cannot cover these.
- `.vscode/settings.json` keeps `source.fixAll.eslint` armed on every human save
  — the severity-blind autofix landmine (crater `0e05c5ac`). The
  governance-guard closes only the agent/Bash path.

**After an orchestrated fan-out:**

- The orchestrator surfaces a **per-subtree ledger** — each worker's commits
  (SHA + message), ordered by subtree, not interleaved by wall-clock. Read it
  subtree by subtree. If commits from different subtrees are interleaved, or a
  worker reported only "cluster done" without per-commit SHAs, the audit channel
  collapsed — push back.
- **The safe revert unit is the subtree, not the individual commit.**
  Cross-worker commits within a subtree can depend on one another; backing one
  out mid-history is human-only surgery (the agent is barred from it). To drop a
  subtree, revert its commit range yourself.
- Spot-check a **seam**: pick a DAG join where one subtree's output feeds
  another and read the committed contract on both sides. Two individually-green
  functions can integrate wrong — that's what the orchestrator's seam reads
  guard, and what you're double-checking.

---

## Field protocols

Quick rules for situations the file's other sections don't cover.

**Slot-machine reroll threshold.** Per the Anthropic team, ~33% of one-shot
attempts work. If the agent's third attempt at the same fix doesn't work,
`/clear` and restart with fresh context — don't iterate further. Fixing broken
context with more context is not a recovery path.

**Confidence-conflict resolution.** When the agent disagrees confidently with
you and you can't tell who's right: ask for the agent's reasoning chain in
writing, then verify a specific claim with a single command (test run, grep,
file read). The agent claims confidence; you confirm reality.

**Statusline thresholds.** Stop at ~75% context, not 80%. Watch for the
Sonnet/Opus indicator switching unexpectedly (subagents inheriting the parent
model when they shouldn't). If you see a 5-hour timer under 30 minutes, finish
your current commit and stop — starting a new increment under that timer means
rushing into compaction.

**VSCode explorer suddenly empty + agent reporting EPERM in Documents.** That is
a macOS TCC revocation, not data loss (metadata still stats; files are intact).
Fix: System Settings → Privacy & Security → Files and Folders → Visual Studio
Code → re-enable Documents Folder (or grant Full Disk Access), then FULLY quit
(⌘Q) and relaunch VSCode — the grant applies at process launch. Diagnosed and
paid for on 2026-07-29.

**Onboarding sequence (future-self or new collaborator).** Read this file first;
then your governance file per `CLAUDE.md`'s router (`AGENTS.md` or
`AGENTS.principal.md`); then `DEV.md` for code-level conventions.
`~/.claude/CLAUDE.md` is personal — don't assume a new collaborator has your
style preferences.

**Lesson routing — where does a new lesson go?**

| Lesson is about...                                                              | Goes in...                                                                                                                            |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| A rule that binds **every** agent and tool, whichever governance file routed it | `DEV.md` — one copy, both `AGENTS*.md` point in (the [§ Adversarial Review Protocol](./DEV.md#adversarial-review-protocol) precedent) |
| A this-project workflow detail specific to one agent tier                       | The matching `AGENTS.md` / `AGENTS.principal.md` — and say which                                                                      |
| A this-project human discipline                                                 | `HUMANS.md` (this file)                                                                                                               |
| A cross-project personal style                                                  | `~/.claude/CLAUDE.md`                                                                                                                 |
| A specific feedback pattern that should fire across sessions                    | Memory file (project-scoped)                                                                                                          |

When a lesson could go in multiple places, pick the most-narrowly-scoped home;
the broader docs reference it if needed.

## Anti-protocol — patterns to catch yourself in

Things to NOT do, mirroring the AGENTS.md "destructive patterns" structure but
applied to the human side:

- **Asking the agent "is this Phase 0 work?"** The agent's answer is unreliable.
  You decide based on AGENTS.md's invariant: Phase 0 governs new-module
  establishment work; you know whether you're establishing one.
- **Accepting "tests pass" without running them yourself.** Trust but verify.
  The agent's claim is a hypothesis until you've seen the green.
- **Letting "trivial fix mode" expand session over session.** If you're invoking
  it more than once a session, audit whether the changes really meet the
  trivial-fix criteria, or whether you're using it as a Phase 0 bypass.
- **Adding override phrases mid-session instead of after.** New override phrases
  belong in this file's grammar list, not improvised in chat. If you find
  yourself wanting one, finish the session first, then add it.
- **Skipping AR-5 because "the increment was small."** Size doesn't predict
  drift. AR-5 catches cross-file consistency, scope creep, and documentation
  desync — those don't track increment size.
- **Trusting the agent's introspection on context state.** The agent's answer is
  a confident guess, not a measurement. The statusline is the truth.

## What NOT to delegate to the agent

Some things are yours to do. Don't outsource these:

- **Final architectural decisions on multi-module changes.** The agent gives you
  tradeoffs; you pick. Don't ask "which is better?" — ask "what are the
  implications of A vs B?" then decide.
- **Approving the `types.ts` contract at the Phase-0 gate — it _is_ the DAG.**
  Under default [orchestrated delegation](./AGENTS.md#orchestrated-delegation)
  (or the fuller mechanics under
  [AGENTS.principal.md § Orchestrated delegation](./AGENTS.principal.md#orchestrated-delegation)
  when on the qualifying list) the agent fans workers out across the
  _type-defined_ dependency graph automatically, so `types.ts` approval at the
  Phase-0 → Phase-1 gate is where your architectural control is
  **front-loaded**: it defines what gets parallelized. That makes it your
  _primary_ control surface, **not your only one** — the multi-module decision
  right above persists _during_ execution (a worker FLAGs any inter-file /
  `types.ts` / `DOCS.md` change up to you; the emergency brake still fires).
  Approve the DAG deliberately; don't wave `types.ts` through as "just types."
- **The merge of `*.DRAFT.md` files for governance docs.** The drafts-only
  pattern exists because multi-file governance refactors are where the agent has
  historically broken things. Verify the diff yourself before merging (or asking
  the agent to merge with explicit one-shot approval).
- **Commit-and-push.** The agent proposes commits; you commit. The agent never
  pushes. Both are safety rails worth keeping.
- **Pruning plan-file clutter.** The agent generates the clutter; you prune it.
  The agent's pruning bias is to keep "for context" — yours should be to keep
  only what's live.
- **Deciding whether to upgrade subscription tiers.** `/ultrareview` is outside
  your tier today. The agent can describe what it would do for you; it can't
  decide whether it's worth the cost.
- **Memory file curation.** The agent writes memory entries; you periodically
  review them for staleness. Memories about file paths, function names, or
  architectural decisions decay as the codebase evolves. Prune annually.

---

## Working with the agent — quick habits

(Relocated from AGENTS.md — these are your habits, not agent instructions.)

- Treat the agent as an iterative partner, not a one-shot solution
- Save your state (git commit) before letting it make large changes
- Core business logic needs close human oversight; peripheral features can run
  more autonomously

---

## Update triggers

New override phrase, retired tool, new AR type, recurring coaching pattern (3+
sessions in a row), new collaborator joining, a new model qualifies for
principal governance (append its model-id substring to CLAUDE.md's qualifying
list — the list only, never rename `AGENTS.principal.md` itself), a new tool
hook or tracked-settings change lands (restart sessions, run its live-fire
probes, `npm run test:hooks`). Audit at ~400 lines.
