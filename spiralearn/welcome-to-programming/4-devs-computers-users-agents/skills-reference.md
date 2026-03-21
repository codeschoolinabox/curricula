# AI Collaboration Skills Reference

A quick-study, mid-collaboration reference. Consult this while working with an
LLM — not after. For the evidence behind these skills, see the
[Research Framing](./research-framing.md).

## Collaboration Skills

| Skill                                                               | What to Do                                                                                                                     | When to Use It                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| **Perspective-Take** [📐](./research-framing.md#perspective-taking) | Ask: "Why did it say _that_?" Before reacting, hypothesize what patterns the LLM matched and what context it lacked.           | Every time you read LLM output             |
| **Calibrate**                                                       | Test the boundaries. Ask the same thing different ways. Try topics you know well to see where it fails.                        | Before trusting LLM output in a new domain |
| **Articulate** [📐](./research-framing.md#common-ground)            | Be specific. Provide context. Decompose big questions into small ones. Write for a very different kind of reader, not a human. | When prompting the LLM                     |
| **Iterate**                                                         | Evaluate the response. Identify what's off. Change ONE thing in your prompt. Compare the new output.                           | When the first response isn't useful       |
| **Delegate**                                                        | Ask: "Am I learning this, or producing this?" If learning → do it yourself. If producing → consider the LLM.                   | Before starting any task with an LLM       |
| **Read** (adapted)                                                  | Read LLM output as critically as you'd read someone else's code. Check against all three audiences.                            | Every time you receive LLM-generated code  |
| **Trace** (adapted) [📐](./research-framing.md#adapted-skills)      | Step through LLM-generated code line by line. Predict state at each step. Don't trust "it looks right."                        | When the LLM generates code with logic     |
| **Describe** (adapted)                                              | Use PBSI to name the gap between what you wanted and what you got: Purpose, Behavior, Strategy, Implementation.                | When LLM output misses the mark            |

## Collaboration Strategies

Practical moves you can make during a conversation with an LLM.

| Strategy                         | How to Do It                                                                                                | When It Helps                                                 | What to Watch For                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Ask it to explain**            | "Explain [concept] as if I'm a beginner" or "Walk me through this code line by line"                        | When you don't understand something                           | Can you spot where the explanation is vague or wrong? If not, you can't verify it.                 |
| **Ask it to wear a hat**         | "Act as a code reviewer" or "Play devil's advocate on this design"                                          | When you want a specific perspective                          | The perspective is simulated, not earned. Evaluate whether the critique is substantive or generic. |
| **Request adversarial review**   | "What's wrong with this approach?" or "Find every flaw in this code"                                        | When you want to stress-test an idea                          | It may be too polite. Push back: "No, really — be harsh. What would break?"                        |
| **Rephrase your question**       | Same question, different framing. Technical → casual. Abstract → concrete. General → example-based.         | When the response misses your intent                          | Track what changed in the output. Your rephrasing skill is what's being trained here.              |
| **Ask what it needs to know**    | "What information would you need from me to do this well?"                                                  | When starting a complex or ambiguous task                     | It often asks for reasonable context. But it also misses things it doesn't know it doesn't know.   |
| **Provide explicit constraints** | "Use only for-loops, no array methods" or "Keep it under 20 lines" or "Only use features from Chapters 1–3" | When output is too broad or uses features you haven't learned | LLMs frequently violate constraints. Check every single time.                                      |
| **Ask for multiple options**     | "Give me 3 different approaches to this problem and explain the trade-offs"                                 | When you want to compare strategies before committing         | Forces you to evaluate trade-offs rather than blindly accepting the first answer.                  |
| **Build incrementally**          | "First just the function signature" → "Now add the loop" → "Now handle the edge case"                       | When you need to verify each step before moving on            | Slower, but each step is verifiable. Essential when you're learning the material.                  |
| **Rubber duck it**               | Explain YOUR thinking to the LLM, then ask "What am I missing?"                                             | When you're stuck and need a sounding board                   | The act of explaining often unsticks you before the LLM even responds. The LLM is the duck.        |
| **Show, don't tell**             | Paste an example of what you want, then say "Do this for [new case]"                                        | When verbal descriptions keep producing wrong output          | Pattern-matching is what LLMs do best. Give them a pattern to match.                               |

## Choosing Your Collaboration Approach

Before you start working with an LLM, run through these questions.
([Decision tree diagram](./assets/ai-integration/decision-tree.svg))

**1. Should I use AI at all right now?**

| If...                                                | Then...                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| First time encountering this skill or concept        | **No AI.** Build the foundation yourself first.               |
| Practicing fundamentals you haven't yet internalized | **No AI.** You need the reps — shortcuts here cost you later. |
| You want the satisfaction of doing it yourself       | **No AI.** Joy of craft matters. That's a valid reason.       |
| You have the foundation and want to go further       | **Yes — continue to question 2.**                             |

**2. What's my primary goal?**

| If your goal is...                        | Then ask...                                                          | Which leads to... |
| ----------------------------------------- | -------------------------------------------------------------------- | ----------------- |
| **Learning** (building new understanding) | "Am I discovering something new, or practicing something I've seen?" | → Question 3a     |
| **Performing** (producing a result)       | "Am I generating ideas, or executing a known plan?"                  | → Question 3b     |

**3a. Learning: Discovery or Practice?**

| Mode                      | What it looks like                                                         | How to use the LLM                                                                                           |
| ------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Human-Led Exploration** | You're encountering a new concept and need to build your own understanding | Ask it to explain. Ask follow-up questions. But trace and verify everything yourself. You drive, it assists. |
| **Human-Led Application** | You understand the concept and want to practice applying it                | Use it as a practice partner: generate exercises, check your work, give feedback. But YOU do the work.       |

**3b. Performing: Ideation or Execution?**

| Mode                   | What it looks like                                                         | How to use the LLM                                                               |
| ---------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **AI-Led Exploration** | You want to brainstorm approaches, explore possibilities, generate options | Let it propose ideas freely. Your job is to evaluate and curate, not generate.   |
| **AI-Led Application** | You know what you want and need help executing it efficiently              | Delegate the production. Your job is specification, review, and quality control. |

**The key insight:** Your SOLO position determines the right approach. Building
structure (learning) → you lead. Leveraging structure (performing) → the LLM can
lead. Getting this wrong is how you end up with code you can't understand.

## Mental Model Actions

What to remember about how LLMs work, and what to _do_ about it.

| What's True                                                      | Why It Matters                                                                     | What to Do                                                                                                        |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| It predicts tokens, not truths                                   | Output is statistically likely text, not verified facts                            | Verify claims independently. "Confident" ≠ "correct."                                                             |
| Same prompt → different output                                   | It samples from probabilities, not looking up answers                              | Run important prompts multiple times. Compare results.                                                            |
| The jagged frontier                                              | It's brilliant at X and terrible at Y — you can't predict which                    | Test empirically for each new task. Never extrapolate from one success.                                           |
| Non-human concept representations                                | It builds something like concepts, but they don't work like human understanding    | Don't anthropomorphize. "It understands" is a dangerous shortcut.                                                 |
| The swarm, not the individual                                    | Your prompt selects which "constituency" of patterns responds                      | Changing tone, framing, or constraints changes which patterns activate. This is why rephrasing works.             |
| Gell-Mann Amnesia                                                | You spot errors in your expertise area. Outside it, errors look just as confident. | Be MORE skeptical outside your expertise, not less. That's backwards from how trust usually works.                |
| Hallucination ≠ lying                                            | Sometimes it encodes correct answers internally but outputs wrong ones             | Don't assume wrongness means ignorance. Rephrase and try again — it may "know" more than it showed.               |
| Analytical tools ≠ LLMs                                          | Debuggers are provably correct within scope. LLMs approximate.                     | Use debuggers/linters for correctness. Use LLMs for high-level comprehension. They complement, not replace.       |
| The "third thing" [📐](./research-framing.md#perspective-taking) | Collaboration produces something neither party would produce alone                 | The dynamic matters more than any single prompt. Invest in building the collaboration, not just crafting prompts. |
