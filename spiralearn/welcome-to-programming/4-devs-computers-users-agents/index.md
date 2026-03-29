# Chapter 4: You, Other Developers, the Computer, Users, and Agents

> Agents join the development process — not as a fourth audience, but as a
> collaborator. Before you can collaborate effectively, you need a mental model
> of what you're collaborating with: not a smart human, not a dumb database, but
> something genuinely different.

## Overview

This is the AI Integration Threshold. In Chapters 0–3, LLM study strategies were
introduced in limited roles — tips for practicing skills you were building. This
chapter provides the _why_ behind those tips: a mental model of how LLMs work, a
framework for collaboration, and structured practice applying comprehension
skills to LLM output.

The chapter follows a spiral that mirrors the outer curriculum. Each ring
revisits skills from a previous chapter, now with an LLM collaborator:

1. **What is an LLM?** (4.0) — build the mental model before any interaction
2. **Collaborating in prose** (4.1) — practice collaboration skills without code
3. **Agents and developer communication** (4.2) — revisits Ch 1 (comments,
   naming, formatting)
4. **Agents and computer communication** (4.3) — revisits Ch 2 (variables,
   state, tracing)
5. **Agents and user communication** (4.4) — revisits Ch 3 (full programs, PBSI,
   testing)
6. **Looking back, looking forward** (4.5) — brief reflection and vocabulary
7. **Vibecoding** (4.6) — a fun sendoff that proves the chapter's thesis

### Theoretical Foundation

One idea connects everything in this chapter: **collaboration quality depends on
your model of the collaborator.** Three research threads converge on this —
perspective-taking, shared models, and misconception interference. See
[Research Framing](./research-framing.md) for the full evidence base.

The 4 Levels of Abstraction build the model. The collaboration skills practice
using it. The SOLO threshold tells you when you're ready. The vibecoding autopsy
stress-tests it.

### Position in the Curriculum

The outer curriculum spiral mirrors a learning progression for AI integration:

- **Ch 0–1:** No AI — build foundation first
- **Ch 2:** Human-Led Exploring — LLM as occasional study aid
- **Ch 3:** Human-Led Applying — LLM as practice partner
- **Ch 4:** The AI Integration Threshold — agents become named, concepts
  connect, all collaboration approaches become available
- **[Welcome to Algorithms](/welcome-to-algorithms/):** Leveraging Structure —
  algorithms and complexity with full agent collaboration

LLMs were already present in earlier chapters, but in limited capacities: as a
support tool for human-led skill building, not as a full integrated skillset.
This chapter reframes those earlier tips by providing the mental model and
collaboration framework that makes them make sense retroactively. Earlier
content stays, but learners now have the framework to reorganize and deepen
their understanding.

### The Collaboration Skills

The same comprehension-before-production principle from code skills applies to
collaboration skills. You learn to _understand_ LLM output before you learn to
_generate_ good prompts.

**Adapted skills** (code comprehension → LLM collaboration). These skills
transfer from Chs 0–3 but require genuine adaptation — reading LLM output is not
the same as reading a colleague's code:

- **Read** LLM-generated code/text critically — against all three audiences
- **Trace** LLM output — predict what the LLM "saw" in your prompt vs. what it
  produced
- **Describe** gaps between intent and output — using PBSI vocabulary

**Genuinely new skills** (unique to agent collaboration):

- **Perspective-Take** — build and apply a mental model of how the LLM "thinks."
  Why did it produce this? What patterns did it likely match? What context did
  it lack?
- **Calibrate** — assess what the LLM can and can't do for a given task. The
  "jagged frontier": capabilities are irregular, you can't extrapolate from one
  success.
- **Articulate** — communicate intent TO the agent effectively. Writing _for_ a
  very different kind of reader, not a human.
- **Iterate** — refine the collaboration through conversation. The collaboration
  equivalent of "modify" in code skills.
- **Delegate** — judge what to hand off to the LLM vs. what to do yourself.
  Requires understanding both your own skill level AND the agent's capabilities.

| Code Skill       | Collaboration Equivalent       | What Changes                                           |
| ---------------- | ------------------------------ | ------------------------------------------------------ |
| Read code        | Read LLM output                | Same critical reading, new source (non-human author)   |
| Trace execution  | Trace LLM's "reasoning"        | Non-deterministic; requires perspective-taking         |
| Describe program | Describe collaboration gap     | Same PBSI vocabulary, applied to intent vs. output     |
| Modify code      | Iterate on prompt              | Conversational loop instead of direct edit             |
| Write from spec  | Articulate intent from scratch | Writing for a different kind of reader, not a compiler |
| (new)            | Perspective-Take               | No code equivalent — non-human theory of mind          |
| (new)            | Calibrate                      | No code equivalent — assessing irregular capabilities  |
| (new)            | Delegate                       | No code equivalent — SOLO-aware task distribution      |

### Skill Introduction Map

Skills accumulate through the spiral — they're not introduced all at once:

| Subchapter                                 | Skills Introduced                    | Why Here                                                  |
| ------------------------------------------ | ------------------------------------ | --------------------------------------------------------- |
| **4.0** What Is an LLM?                    | **Perspective-Take**                 | You need a model of the collaborator before anything else |
| **4.1** Collaborating in Prose             | **Articulate** + **Read** (adapted)  | Prose first — lower stakes than code                      |
| **4.2** Agents and Developer Communication | **Trace** (adapted) + **Calibrate**  | Code context, developer audience                          |
| **4.3** Agents and Computer Communication  | **Describe** (adapted) + **Iterate** | Computer audience, debugging context                      |
| **4.4** Agents and User Communication      | **Delegate**                         | Full programs, user audience — requires all prior skills  |
| **4.5** Looking Back, Looking Forward      | Integration                          | All skills in reflection                                  |
| **4.6** Vibecoding                         | Stress-test                          | All skills under pressure                                 |

### Scope

This chapter models agents as collaborators in a human-driven development
process. Agents can do far more — full autonomy, agentic workflows, autonomous
coding — but that's outside scope. This curriculum focuses on comprehension and
learner agency.

## Subchapters

- [4.0: What Is an LLM?](./4.0-what-is-an-llm.md)
- [4.1: Collaborating in Prose](./4.1-collaborating-in-prose.md)
- [4.2: Agents and Developer Communication](./4.2-agents-and-developer-communication.md)
- [4.3: Agents and Computer Communication](./4.3-agents-and-computer-communication.md)
- [4.4: Agents and User Communication](./4.4-agents-and-user-communication.md)
- [4.5: Looking Back, Looking Forward](./4.5-looking-back-looking-forward.md)
- [4.6: Vibecoding](./4.6-vibecoding.md)
- [Skills Reference](./skills-reference.md) — quick-study cheat sheet for
  mid-collaboration use
- [Research Framing](./research-framing.md) — evidence base, research questions,
  and translational positioning

See [Research Framing](./research-framing.md) for the full evidence base,
references, and research questions.
