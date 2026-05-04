# HUMANS.md — Operating Manual for the Human in the Loop

> **Audience: you, the human collaborator.** This file is your protocol;
> the agent's is in `AGENTS.md`; your style across all projects is in
> `~/.claude/CLAUDE.md`; the contributor conventions are in `DEV.md`. Three
> doors out, one door in: this is your door. It captures *your end of the
> bargain* — protocols you follow, when to /clear, when to commit, how to
> coach the agent, and how to override its safety rails when you need to.

## Why this file exists

The 5-hour Opus limit ran out faster than expected. Long sessions accumulate
context cruft (rejected alternatives in plan files, stale handoff folders,
agent self-reports of relevance that aren't reliable signals). Subagent
spawns reload the same governance docs as fresh context per spawn. Opus on
max for everything (including AR-3/AR-4 reviewers that don't need it) burns
tokens that Sonnet would handle indistinguishably.

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

**Default to one Phase 0 increment per session, then `/clear`.** Phase 0
(DDD: ubiquitous language → README → AR-1 → types.ts → architectural sketch
→ AR-2) is heavy context. Phase 0 + Phase 1 in one session is where context
decay starts to bite. After Phase 0 commits land, the natural break point is
now. The agent should remind you of this when Phase 0 finishes; you decide
whether to push through.

**Commit between increments, not at session end.** Each passing TDD cycle is
one atomic commit. If you finish three increments before committing, you have
three commits to write at once with stale context — that's the recipe for
sloppy commit messages and skipped doc updates.

**`/clear` after milestone, not on the wall.** The 5-hour limit sneaks up. By
the time you notice you're at 80% context, you're already paying compaction
tax (Anthropic team's own data: ~90% code quality drop, per
`~/.claude/CLAUDE.md` Anthropic-tips section). Stop at ~75% context, not 80%
— the last 20% is compaction-tax territory. Better cadence: after every
committed milestone (Phase 0 done, increment shipped, AR-5 closed), check in
with yourself — does this session need to continue, or is now the natural
break?

**Don't trust the agent's self-report on context state.** When you ask "how
much context do you have left?" the answer is a confident guess, not a
measurement. Trust the statusline (configured to show context %, current
model, time remaining in 5-hour window) over the agent's introspection.

**Handoff folders cost setup time.** `.handoff*/` folders work, but the
overhead of writing them and resuming from them is substantial. Reserve
handoffs for genuinely unfinished multi-session work. For routine Phase 1
increments, the plan file + git history is sufficient handoff.

---

## Model selection rules

You're on the Max plan. Opus is the default. Reserve Sonnet for tasks where
the quality cliff is small or absent.

**Use Opus for:**

- Phase 0 design work (DDD, ubiquitous language establishment, architectural
  sketch authoring)
- AR-1 (Design Challenge) — drift / cross-cutting
- AR-2 (Architectural Sketch Challenge) — drift / cross-cutting
- AR-5 (Pre-Merge Review) — drift, scope, cross-file consistency
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

The default Agent tool spawn inherits the parent's model (Opus). When you
spawn an AR-3 / AR-4 / Explore agent, override with `model='sonnet'` to avoid
burning Opus on impl correctness. The curricula AGENTS.md now has this
instruction in the Sub-model dispatch table — the agent should follow it
without prompting, but if it doesn't, remind it: *"AR-3 and AR-4 spawn on
Sonnet per AGENTS.md."*

You can also set per-agent default models in `~/.claude/agents/<name>.md`
frontmatter (`model: sonnet`) for any reusable agent definition.

---

## Plan-clutter discipline

Plan files grow rejected alternatives, "how we got here" history, and "what we
considered" footnotes. Over time, you can't tell live decisions from rejected
ones. The plan stops being a checklist and becomes archaeology.

**Live plan ≠ history book.** When a decision lands, prune. Rejected
alternatives go to git history (the commit message can summarize), not the
live plan file. The plan represents *what we are doing now*, not *what we
considered*.

**On resume after compaction or a fresh session:** read the plan file once and
ask yourself: "If a new agent picked this up cold, would the plan tell them
what to do, or would they have to read between the lines?" If the latter,
prune before continuing.

**The agent should help you prune, not generate clutter.** When the agent
proposes plan updates that include "considered alternatives", "previous
attempts", or "context for why we're not doing X", redirect: *"Drop the
history. Keep only what's still live."*

The mirror rule for end-state docs (READMEs, DOCSes, types.ts) is in
[`DEV.md` § What goes in docs vs. plans vs. handoffs](./DEV.md#what-goes-in-docs-vs-plans-vs-handoffs):
process talk that belongs in plan files MUST NOT appear in end-state docs.
Plan-clutter discipline prunes the plan; the docs rule keeps process out
of the contract entirely.

---

## Coaching contract

You and the agent each have responsibilities. Yours, in priority order:

**Push back when the agent is being lossy.** Multi-file refactors, cleanups,
"simplifications", architectural changes — these are exactly the patterns
where the agent has historically broken working systems. AGENTS.md has the
warnings. When you read a "Mandatory user warning" from the agent, read it
seriously. The fact that it fired means the agent is in the danger zone, not
that it's being overcautious.

**Insist on plan mode for non-trivial work.** Even when the agent is confident.
Especially when the agent is confident. The plan mode discipline catches
misunderstandings before code is written.

**Respond to AR verdicts.** PROCEED, you continue. CONSIDER, the agent should
already be addressing the concerns; verify it actually did, not just claimed
it did. PAUSE means stop and decide together — never let an agent override a
PAUSE.

**Verify the Always Works™ checks.** When the agent says "ready for review,"
ask: did you run the code? did you trigger the exact feature? did you observe
the result? Untested code is a guess, not a solution.

**The agent's responsibilities back to you live in `AGENTS.md`** (Risk
Assessment warnings, AR mandatoriness, context-capacity surfacing, Phase 0
non-negotiable invariant) **and `~/.claude/CLAUDE.md`** (certainty
quantification, no marketing speak, leading with risks). When you notice the
agent failing to fulfill one of those, name the missing behavior — that's
coaching.

**ARs are mandatory and not skippable by the agent.** Non-negotiable. The
whole reason ARs exist is that the agent cannot be trusted to assess whether
risks are present in *this particular case*. The agent must NEVER propose
skipping an AR on its own assessment. You are the only one who can override,
and you do it via the override grammar below.

---

## Override grammar

**Only the human uses these phrases.** The agent never proposes them, never
asks "should we skip AR-3 this increment?", never preemptively offers
"trivial fix mode" as a shortcut. If the agent finds itself drafting any of
these phrases, that is the signal it is rationalizing skipping ceremony and
must instead surface the friction explicitly. ARs are mandatory; only the
human's explicit invocation flips that.

**Phrases below are listed verbatim.** The agent should accept close
paraphrases ("skip the alignment check" for "skip alignment check") but
reject reinterpretations ("let's just go" is NOT "skip plan mode").

Sometimes you genuinely need to override the agent's defaults. Use these
phrases — they are recognizable signals to the agent that you have made an
explicit, considered choice:

- **"skip plan mode"** — proceed directly to execution. Agent confirms it
  heard you and proceeds.
- **"skip alignment check"** — bypass the Belgian-flavored alignment
  checkpoint from CLAUDE.md.
- **"skip AR-3 this increment, my call"** (or AR-1/2/4/5) — override a
  specific AR. Agent notes the override in the commit/conversation. ARs
  default to mandatory; this is the only legitimate way to skip.
- **"override and proceed"** — when the agent has flagged a risk and you
  acknowledge it. Agent proceeds with the risk noted.
- **"trivial fix mode"** — for typo fixes, lint cleanup, format-only changes,
  or other edits that touch a single file with no public-API surface.
  Phase 0 is **not bypassed** — Phase 0 governs *new module establishment
  work* (DDD, ubiquitous language, architectural sketch). Trivial fixes
  aren't Phase 0 work in the first place. If the change touches a public
  type, an exported function signature, a peer-file contract, or a `DOCS.md`
  data flow, **trivial fix mode does NOT apply** and the agent must refuse
  this label. Always Works™ verification still applies in all cases.
- **"meta mode"** — non-code work (planning conversations, reading sessions,
  refactor design). Agent skips test-writing and code-output expectations.
- **"explore only, no edits"** — research session. Agent reads and reports;
  must not produce code changes.

If you find yourself needing an override phrase that isn't here, it's worth
adding to this file rather than improvising — the agent doesn't recognize
ad-hoc phrases reliably.

**Override is not skip-with-no-record.** Every override should be visible: in
the conversation, in the commit message, or in a plan-file note. Future-you
needs to see "this AR was skipped on 2026-04-28 because [reason]" so the
audit trail isn't broken.

---

## Tool inventory

Quick reference for the tools you can fire (or that I can fire on your
behalf).

**Local-session tools (burn 5-hour limit):**

- **`/security-review`** — built-in skill. Reviews pending changes for
  security issues. Useful before any commit that touches auth, validation, or
  network code.
- **Local AR-5 via Agent tool** — what the AGENTS.md AR Protocol describes.
  Spawn with `model='opus'` for AR-1/2/5 and `model='sonnet'` for AR-3/4.

**Remote tools (don't burn 5-hour limit, run in cloud):**

- **`/schedule`** — cron remote agents. Useful for nightly doc audits,
  scheduled branch reviews, or "remind me to check X tomorrow." Runs against
  committed state only — no in-flight work visibility.
- **`/ultrareview`** — multi-agent cloud review of current branch or PR.
  *Currently outside your subscription tier.* If you upgrade, this could
  replace AR-5 entirely (commit final increment → fire `/ultrareview` → walk
  away → resume next session reading the report).

**Configuration (skills + agents):**

- **`statusline-setup`** — Agent type, invoked via the Agent tool (NOT a
  slash command). Configures `~/.claude/settings.json` to display tokens
  used, context %, current model, time-remaining. Run once; persists across
  sessions.
- **`/fewer-permission-prompts`** — Skill that auto-generates an allowlist
  for common read-only Bash and MCP calls. Reduces interruption density.
- **`/update-config`** — Skill for `settings.json` edits via the harness.
  Use for hooks, permissions, env vars.

**NOT a substitute for AR-5:**

- `/review` — built-in skill, but **only for GitHub PRs**, not generic local
  changesets. Don't reach for it as a local AR-5 substitute.

---

## Verification rituals

After each phase or substantial change, run through this list yourself.
The agent claims things are done; you verify they actually are.

**After a Phase 0 (new module):**

- Read README.md, types.ts, and DOCS.md together. Can you predict what the
  implementation will do?
- Verify AR-1 and AR-2 actually fired (check for the spawned agents in
  conversation history)
- Check that the commit message describes the artifacts (`docs: establish
  [module] domain model and architectural sketch`)

**After a Phase 1 increment:**

- Pull the file. Did the agent actually run the tests, or just claim it did?
  `npm run test path/to/test` is one command.
- Read the diff. Is the change *only* what was specified, or did
  scope-creep sneak in?
- Verify the commit message describes the behavior, not the mechanical change

**After a refactor:**

- `git diff` between base and HEAD; for each file, ask: did any *behavior*
  change, or only structure?
- `npm run test` (full suite, not just affected); zero failures, no skips
  that weren't skipped before
- Open the relevant `DOCS.md` sketch; for each module touched, name the
  named phases the sketch lists, then grep the source for those names. If
  a phase from the sketch is missing in the source, the refactor drifted
  and you have follow-up work.

**After a sandbox checkpoint:**

- Actually exercise the feature in the browser. Did you see what the agent
  said you'd see? If the agent said "tabs / single quotes / semicolons /
  80-col wrap" and you see four-space indents, the test was wrong.

---

## Field protocols

Quick rules for situations the file's other sections don't cover.

**Slot-machine reroll threshold.** Per the Anthropic team, ~33% of one-shot
attempts work. If the agent's third attempt at the same fix doesn't work,
`/clear` and restart with fresh context — don't iterate further. Fixing
broken context with more context is not a recovery path.

**Confidence-conflict resolution.** When the agent disagrees confidently
with you and you can't tell who's right: ask for the agent's reasoning
chain in writing, then verify a specific claim with a single command (test
run, grep, file read). The agent claims confidence; you confirm reality.

**Statusline thresholds.** Stop at ~75% context, not 80%. Watch for the
Sonnet/Opus indicator switching unexpectedly (subagents inheriting the
parent model when they shouldn't). If you see a 5-hour timer under 30
minutes, finish your current commit and stop — starting a new increment
under that timer means rushing into compaction.

**Onboarding sequence (future-self or new collaborator).** Read this file
first; then `AGENTS.md`; then `DEV.md` for code-level conventions.
`~/.claude/CLAUDE.md` is personal — don't assume a new collaborator has
your style preferences.

**Lesson routing — where does a new lesson go?**

| Lesson is about... | Goes in... |
| --- | --- |
| A this-project workflow detail | `AGENTS.md` (agent-facing) or `DEV.md` (contributor-facing) |
| A this-project human discipline | `HUMANS.md` (this file) |
| A cross-project personal style | `~/.claude/CLAUDE.md` |
| A specific feedback pattern that should fire across sessions | Memory file (project-scoped) |

When a lesson could go in multiple places, pick the most-narrowly-scoped
home; the broader docs reference it if needed.

## Anti-protocol — patterns to catch yourself in

Things to NOT do, mirroring the AGENTS.md "destructive patterns" structure
but applied to the human side:

- **Asking the agent "is this Phase 0 work?"** The agent's answer is
  unreliable. You decide based on AGENTS.md's invariant: Phase 0 governs
  new-module establishment work; you know whether you're establishing one.
- **Accepting "tests pass" without running them yourself.** Trust but
  verify. The agent's claim is a hypothesis until you've seen the green.
- **Letting "trivial fix mode" expand session over session.** If you're
  invoking it more than once a session, audit whether the changes really
  meet the trivial-fix criteria, or whether you're using it as a Phase 0
  bypass.
- **Adding override phrases mid-session instead of after.** New override
  phrases belong in this file's grammar list, not improvised in chat. If
  you find yourself wanting one, finish the session first, then add it.
- **Skipping AR-5 because "the increment was small."** Size doesn't predict
  drift. AR-5 catches cross-file consistency, scope creep, and
  documentation desync — those don't track increment size.
- **Trusting the agent's introspection on context state.** The agent's
  answer is a confident guess, not a measurement. The statusline is the
  truth.

## What NOT to delegate to the agent

Some things are yours to do. Don't outsource these:

- **Final architectural decisions on multi-module changes.** The agent gives
  you tradeoffs; you pick. Don't ask "which is better?" — ask "what are the
  implications of A vs B?" then decide.
- **The merge of `*.DRAFT.md` files for governance docs.** The drafts-only
  pattern exists because multi-file governance refactors are where the agent
  has historically broken things. Verify the diff yourself before merging
  (or asking the agent to merge with explicit one-shot approval).
- **Commit-and-push.** The agent proposes commits; you commit. The agent
  never pushes. Both are safety rails worth keeping.
- **Pruning plan-file clutter.** The agent generates the clutter; you prune
  it. The agent's pruning bias is to keep "for context" — yours should be to
  keep only what's live.
- **Deciding whether to upgrade subscription tiers.** `/ultrareview` is
  outside your tier today. The agent can describe what it would do for you;
  it can't decide whether it's worth the cost.
- **Memory file curation.** The agent writes memory entries; you periodically
  review them for staleness. Memories about file paths, function names, or
  architectural decisions decay as the codebase evolves. Prune annually.

---

## Update triggers

New override phrase, retired tool, new AR type, recurring coaching pattern
(3+ sessions in a row), new collaborator joining. Audit at ~400 lines.
