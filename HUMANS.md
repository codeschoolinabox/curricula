<!-- cspell:ignore ultracode ultrareview -->

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
verify — see
[AGENTS.md § Orchestrated delegation](./AGENTS.md#orchestrated-delegation), or
[AGENTS.principal.md § Orchestrated delegation](./AGENTS.principal.md#orchestrated-delegation)
if that is the file `CLAUDE.md` routed you to, for the explicit-read backstop
that doesn't depend on it. Opus on max for everything (including AR-3/AR-4
reviewers that don't need it) burns tokens that Sonnet would handle
indistinguishably.

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
0.1 the README, with the ubiquitous-language glossary inside it → 0.2 the twin,
or the `## Epistemology` block that discharges it → AR-1, on the README and the
twin together → 0.3 types.ts + the DOCS.md sketch + the ZOMBIES suite, written
for real and committed skipped → AR-2 → review, resolve, commit → your gate) is
heavy context — the suite at 0.3 makes it heavier than the step count suggests.
Phase 0 + Phase 1 in one session is where context decay starts to bite. After
Phase 0 commits land, the natural break point is now. The agent should remind
you of this when Phase 0 finishes; you decide whether to push through.

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

- Phase 0 design work — the DDD thinking, across all three steps: the README and
  the ubiquitous-language glossary inside it; the twin, or the `## Epistemology`
  block that discharges it; and types.ts with the architectural sketch in
  DOCS.md **and the ZOMBIES suite** — 0.3 is three artifacts, and the suite is
  the one that makes it expensive
  ([DEV.md § Phase 0](./DEV.md#phase-0-documentation-specification-before-any-code))
- AR-1 (Design Challenge) — drift / cross-cutting (the one pinned judgment
  review; AR-2 and AR-5 are deliberately NOT pinned — they inherit the session's
  model so they track the authoring tier, see
  [DEV.md § Sub-model dispatch](./DEV.md#sub-model-dispatch))
- Plan authoring, especially in plan mode
- Hard refactors where the structural target is unclear
- Cross-cutting changes that touch multiple modules

**Use Sonnet for:**

- AR-3 (Test Strategy Challenge) — implementation correctness
- AR-4 (Implementation Audit) — implementation correctness
- Post-gate TDD increment work (the phase boundary, not a judgment about how
  clear the path looks — that judgment is the self-classification
  [DEV.md § ceremony](./DEV.md#ceremony) distrusts)
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

**Switching tier mid-session — let the agent reach a clean commit boundary
first.** Otherwise expect an AR-5 at the switch, which is what
[DEV.md § AR-5](./DEV.md#ar-5-pre-merge-review) now obliges: AR-2 and AR-5
inherit your tier, so a downgrade with work still standing leaves that work
reviewed below the tier that wrote it. Two things the agent cannot do for you
here. It **cannot detect the switch** — its environment block goes stale at
exactly that event, so it learns your new tier only when you say so or when an
unpinned subagent reports one it did not expect; tell it. And a downgrade can
move the session **off `CLAUDE.md`'s qualifying list**, so a different
governance file binds it than the one it read at session start — say so, and it
re-runs the router. An upgrade needs neither: the next review is stronger.

**Reasoning effort is a separate dial from the tier, and it is also yours.**
Nothing in the roster models it — the dispatch mechanism is the `model:`
frontmatter key and nothing else — and **whether a spawned subagent inherits
your effort setting has never been measured here**. Until `harness-probe` is
extended to report it, treat effort as not modeled: no rule in this corpus keys
off it, and none should until there is a measurement to key off.

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

**One thing the agent may ask you, and only this** — read it as the "surface the
friction explicitly" half of the rule above rather than an exception to it. When
a record is about to claim you chose a ceremony level and you never set one, the
agent asks instead of supplying a value. **Your silence answers for the work,
not for the record:** say nothing and the work runs at `medium`, and the agent
must not interrupt you to confirm that — but a level in a commit body is a
ruling, and a ruling nobody made is not one. The mechanics, including what the
agent writes if you don't answer, are canonical in
[DEV.md § ceremony](./DEV.md#ceremony).

**What is yours here is telling a permitted ask from a banned one**, because
that judgement is coaching and nothing mechanical makes it. The contrast pair:
_"you haven't set a ceremony level for this campaign — what should the commit
body say?"_ is permitted; _"shall we run this one light?"_ is not, and the only
difference is that the second named a value. An agent that proposes a level,
argues one is appropriate here, or offers you a menu is drafting your phrase,
and the rule above catches it — **push back on that one; answer the other.**

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
- **"ceremony: full this campaign, my call"** — set the review level. Two slots,
  both closed: swap the value for `medium` or `light`, and `this campaign` for
  `this increment` to scope it to one — so **"ceremony: light this increment, my
  call"** is the other end of the grammar, written out here because this list
  promises literals. `full` fires AR-1 · AR-2 · AR-3 · AR-4 · AR-5; `medium`
  fires AR-1 and AR-5; `light` fires AR-5 alone; **no level removes AR-5**
  ([DEV.md § ceremony](./DEV.md#ceremony)). Both directions are yours: `medium`
  is the default, so `full` is a level someone has to ask for, and the agent may
  not pick one, raise one, or lower one. Say nothing and the work runs at
  `medium` — a declared position, not a lapse — but see the ask above before
  that silence reaches a commit body.
- **"override and proceed"** — when the agent has flagged a risk and you
  acknowledge it. Agent proceeds with the risk noted.
- **"trivial fix mode"** — for typo fixes, lint cleanup, format-only changes, or
  other edits that touch a single file with no public-API surface. Phase 0 is
  **not bypassed** — Phase 0 governs _new module establishment work_: the README
  with the ubiquitous-language glossary inside it, the twin or the
  `## Epistemology` block that discharges it, and types.ts with the DOCS.md
  sketch and the test suite
  ([DEV.md § Phase 0](./DEV.md#phase-0-documentation-specification-before-any-code)).
  Trivial fixes aren't Phase 0 work in the first place. If the change touches a
  public type, an exported function signature, a peer-file contract, or a
  `DOCS.md` data flow, **trivial fix mode does NOT apply** and the agent must
  refuse this label. Always Works™ verification still applies in all cases.
- **"meta mode"** — non-code work (planning conversations, reading sessions,
  refactor design). Agent skips test-writing and code-output expectations.
- **"explore only, no edits"** — research session. Agent reads and reports; must
  not produce code changes.
- **"script fan-out, my call"** — authorize a script-driven fan-out, which is
  otherwise blocked pending measurement ([§ Tool inventory](#tool-inventory)).
  The first such launch is a probe run — no real work — because two of its five
  unmeasured preconditions can only be measured from inside the mode. This
  phrase does not lift the block; it authorizes the run that produces the
  measurement that lifts it.

If you find yourself needing an override phrase that isn't here, it's worth
adding to this file rather than improvising — the agent doesn't recognize ad-hoc
phrases reliably.

**The level and the per-AR skip are two separate mechanisms, and both are
yours.** The level declares the gate set for a scope; the per-AR phrase is a
one-off opt-out from whatever gate set is already standing. How they interact
when both are in play — the narrower scope wins and leaves the level standing,
the per-AR phrase only ever subtracts, and **`skip AR-5 …, my call` is legal,
because "no level removes AR-5" is a statement about _levels_** — is canonical
in [DEV.md § ceremony](./DEV.md#ceremony), which binds every agent and tool, and
is not restated here. The one consequence that is yours rather than the agent's:
**nothing mechanical catches an AR-5 skip**, which is why
[§ Anti-protocol](#anti-protocol--patterns-to-catch-yourself-in) names it as a
pattern to catch yourself in.

**Ceremony's record has a narrower home than the other overrides.** The closing
rule below accepts a conversation, a commit message, or a plan-file note. For a
ceremony level a plan-file note is **not enough**: the level is a ruling, and
rulings live in the commit body that carries the work — and, where the level
governs a module's ongoing practice, **also** in a dated line in that module's
own docs ([DEV.md § Ruling provenance](./DEV.md#ruling-provenance)). Both, not
either: the commit body is where the level binds a changeset, and the dated line
is where a later reader finds it — by grepping the thing it governs, with no
commit to look up. A level that reached neither is not set. This campaign
learned that the expensive way — seven increments shipped carrying a ceremony
value no ruling recorded.

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
- **Script-driven fan-out ("ultracode")** — a deterministic script spawns and
  sequences the workers instead of the agent. **Blocked pending measurement**,
  and the agent's answer is no until then; ordinary fan-out is unaffected and
  stays the agent's default. Five preconditions are unmeasured and
  `harness-probe` measures none of them today — the block lifts when the probe
  is _extended_ and run, and the first script-driven launch is that probe.
  Details, and why each precondition matters:
  [AGENTS.principal.md § Execution mechanics](./AGENTS.principal.md#execution-mechanics),
  or [AGENTS.md § Orchestrated delegation](./AGENTS.md#orchestrated-delegation)
  for the copy an agent off the qualifying list reads. Whether this mode is even
  available on your plan is not something this repo can verify — check before
  spending a session on it.

**Remote tools (don't burn 5-hour limit, run in cloud):**

- **`/schedule`** — cron remote agents. Useful for nightly doc audits, scheduled
  branch reviews, or "remind me to check X tomorrow." Runs against committed
  state only — no in-flight work visibility.
- **`/code-review ultra`** — multi-agent cloud review of the current branch, or
  of a GitHub PR with `/code-review ultra <PR#>`. `/ultrareview` is a deprecated
  alias for the same command. **Available to you, and billed.** The no-argument
  form bundles the local branch and needs no GitHub remote, but it does need a
  git repository. **You fire it; the agent cannot** — it is user-triggered, so
  an agent that offers to run one is offering something it has no way to do.
  Workable as an AR-5 substitute if you want one: commit the final increment →
  fire it → walk away → read the report next session.

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
- **Find the glossary inside the README.** The ubiquitous language is step 0.1's
  own content, not a separate deliverable — a README with no glossary is an
  incomplete 0.1, not a complete step with another one still to come.
- **Find step 0.2.** Either a twin document exists, or the README carries an
  `## Epistemology` block — and that block names three things: the twin **not**
  built, the named holder it is delegated to, and what would falsify that
  delegation. A block that records only the gap describes the failure mode; it
  does not discharge the step.
- **Verify the ARs your ceremony level actually fires** (check for the spawned
  agents in conversation history). At `full` that is AR-1 **and** AR-2; at
  `medium` — the default — it is **AR-1 only**, and a missing AR-2 is correct,
  not a lapse; at `light` neither fires and AR-5 carries the whole gate. Check
  the level before you check the agents, or you will flag a compliant agent for
  skipping a review its level never asked for.
- Whichever fired, verify **AR-1 was handed the twin as well as the README** —
  it challenges both together, so an AR-1 that only saw the README reviewed half
  of what it is for.
- **Ask to see the skipped test suite.** The full ZOMBIES suite is written for
  real at 0.3 and committed in a skipped state; Phase 1 un-skips one at a time.
  The tests should report as skipped, not as absent — a Phase 0 with no suite
  has pushed the test-writing into Phase 1, where the AR-3 cadence assumes it is
  already there.
- Check that the commit message describes the artifacts
  (`docs: establish [module] domain model and architectural sketch`)
- **Check the commit BODY, not just the subject, for the work-routing line** —
  `work: … · twin-doc: … · ceremony: … · prospective`
  ([DEV.md § Work routing and ceremony](./DEV.md#work-routing-and-ceremony)).
  The body is the only durable record of the level you set, and amend is
  forbidden, so a body that ships without it ships without it forever. This is
  the check that would have caught the seven increments counted above.

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
  `PINNED(...)` beside the assertion they settle, or in a dated
  `(human ruling YYYY-MM-DD)` line in the document they govern
  ([DEV.md § Ruling provenance](./DEV.md#ruling-provenance)). Two greps find
  every one of them: `git grep -n 'human ruling'` and `git grep -n 'PINNED('`.
  An agent has invented one before. Ask where it is written.

**Citation and claim conventions (human ruling 2026-07-30 — re-decide any
time):** the tag rule is canonical in `DEV.md` with a short invariant in both
AGENTS files pointing in; `§` citations are links with a fragment, swept across
the corpus, with the fragment carrying identity and qualifiers left outside the
link; `AGENTS.principal.md` carries its own cold-start-handoff heading; the
` ```quote ` fence pilot is deferred to the session that builds its checker.

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

**Statusline thresholds.** Stop at ~75% context, not 80%. If you see a 5-hour
timer under 30 minutes, finish your current commit and stop — starting a new
increment under that timer means rushing into compaction.

**Watch your OWN model indicator; it is your only detector for a tier change.**
The agent cannot see one — its environment block goes stale at exactly that
event — so if the statusline changes and you do not say so, nothing in the
system notices ([§ Model selection rules](#model-selection-rules) has what to
tell it, and why).

**What a SUBAGENT's indicator is and is not telling you.** A subagent showing
the parent's model is usually **correct**: AR-2 and AR-5 inherit by design, and
so does anything else with no `model:` line
([DEV.md § Sub-model dispatch](./DEV.md#sub-model-dispatch)). The tell worth
chasing is the opposite one — a **pinned** reviewer running off its pin (ar-1
not on opus, ar-3 or ar-4 not on sonnet), which means the pin did not take and
the roster is describing something that is not happening. Each reviewer now
opens its report with the tier it ran as, so you can read that off the report
instead of the statusline.

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
- **Deciding what a billed run is worth.** `/code-review ultra` is available and
  billed, and firing it is yours alone — the agent cannot trigger one
  ([§ Tool inventory](#tool-inventory)). It can describe what the run would
  cover; it cannot decide whether this changeset is worth the spend, and under
  [DEV.md § Sub-model dispatch](./DEV.md#sub-model-dispatch) it may name the
  cost but never argue you into fewer gates.
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

New override phrase, retired tool, new AR type, **a workflow step changing shape
— renamed, renumbered, merged, reordered, or gaining or losing a gate**,
recurring coaching pattern (3+ sessions in a row), new collaborator joining, a
new model qualifies for principal governance (append its model-id substring to
CLAUDE.md's qualifying list — the list only, never rename `AGENTS.principal.md`
itself), a new tool hook or tracked-settings change lands (restart sessions, run
its live-fire probes, `npm run test:hooks`). Audit at ~400 lines.

**A step that keeps its number and changes its meaning is the dangerous case**,
because nothing fails loudly — every other kind of change leaves a dangling
reference that something eventually trips over. Watch for that one specifically.

**When a workflow step changes shape, this file recites that workflow in four
places and they are not next to each other.** That is why a stale recital
survives here: you fix the section you happened to be editing, and three others
keep teaching the old shape. Re-read all four against the changed step:

- the Phase 0 chain in [§ Session sizing rules](#session-sizing-rules);
- the Phase 0 bullet in [§ Model selection rules](#model-selection-rules);
- the "Phase 0 is not bypassed" clause inside "trivial fix mode" in
  [§ Override grammar](#override-grammar);
- the "After a Phase 0" checklist in
  [§ Verification rituals](#verification-rituals) — the one you actually run at
  the gate, and therefore the one where a stale recital costs the most.

The source of truth is
[DEV.md § Phase 0](./DEV.md#phase-0-documentation-specification-before-any-code);
both AGENTS files carry a summary of it, so if the three disagree, one of them
is stale and you do not get to pick which. If you ever add a fifth recital, add
it to this list. (`npm run check:governance` verifies these four links resolve,
so a renamed heading fails loudly — but it cannot tell you whether the prose
under them still says the right thing. That part is yours.)

**The tier-per-phase mapping is the same hazard, in four places, and it had no
list until now.** "Design tracks the strongest tier, post-gate TDD runs on a
cheaper one" appears in:

- [§ Model selection rules](#model-selection-rules) — the copy that **owns** it;
  the other three must not disagree with this one;
- [AGENTS.principal.md § Handoff agency](./AGENTS.principal.md#handoff-agency--the-agent-owns-the-call),
  in the "operating instructions" clause;
- [.claude/skills/handoff/SKILL.md § 4. Hand the swap to the human](./.claude/skills/handoff/SKILL.md#4-hand-the-swap-to-the-human--an-agent-never-hands-itself-off),
  item 1 — the one an agent actually executes from, and therefore where a stale
  copy does the most damage;
- [DEV.md § Sub-model dispatch](./DEV.md#sub-model-dispatch) — **different in
  kind**: it recites the design half only, and _argues from_ it rather than
  instructing with it. The paragraph explaining why AR-2 has no boundary guard
  rests on "Phase 0 design work is assigned to the strongest tier". Change that
  and you do not stale a recital, you falsify an argument.

When you change which tier suits which phase, change all four. The checker
catches a renamed file or heading behind these links; it cannot tell you whether
the prose under them still agrees — that part is yours. The first time this list
was written, three of the four already disagreed: two recitals said the cheaper
tier was "proven" where this section claimed nothing of the sort, and this
section keyed on "where the path is clear" where they keyed on the phase
boundary. The list is worth having because that is what it found on day one.
