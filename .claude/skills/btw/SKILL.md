---
name: btw
description:
  Delegate a side-question to a background subagent so research and
  fact-verification never clutter the main session's context.
---

# btw

The user asked a side-question (`/btw <question>`) that is not the current task.
Answer it WITHOUT spending main-session context on the research: the question
and a distilled answer belong in this chat; the investigation does not.

## 1. Delegate, don't research

Spawn ONE general-purpose subagent in the BACKGROUND and keep working on the
primary task. The subagent's prompt carries: the question verbatim, the minimal
facts it needs from the current conversation (paste only what the question
genuinely depends on — assume the subagent shares none of this conversation
implicitly), and these standing instructions:

- Strictly read-only unless the question explicitly asks for a scratch
  experiment; never touch the repo's working tree.
- Verify, don't recall: answer from files, command output, or documentation you
  actually opened, and say which.
- Return a DISTILLED answer — a few sentences, plus the one command or path that
  proves it. If the full answer is long, write it to the session scratchpad and
  return a two-line summary plus the file path.

## 2. Relay when it lands

When the completion notification arrives, relay the distilled answer in chat,
clearly marked as the `/btw` result, and return to the primary task. Do not
re-verify the subagent's work in the main context — that would re-spend exactly
the tokens the delegation saved; if the answer looks wrong, say so and send the
subagent a follow-up instead.

## 3. What this cannot do

The question and the distilled answer still enter the main transcript — the
savings are the research trail (file reads, git archaeology, web checks,
verification runs), which stays in the subagent's context. A question that needs
deep current-conversation state costs whatever state you paste into the brief;
for those, answering inline may be cheaper — say so instead of delegating
blindly.
