# Chapter 4: Research Framing

> This document explains the evidence behind Chapter 4's design. It's written for educators and curious learners — if you want the full research detail, see the deep research framing (`0-repo-research/ch4/research-framing.md`) in the research repo. For the curriculum-wide research orientation, see the [global research framing](../research-framing.md).

**Owner**: Research committee

**Design principle**: When skill density or exercise design creates tension between what's best for learning and what's best for research observability, learning wins. In Ch 4 specifically, this means we don't overload learners with all 8 collaboration skills at once just because it would produce richer data — we scaffold them through the spiral. See the [global research framing](../research-framing.md#design-principle-pedagogy-wins) for the curriculum-wide statement of this principle.

---

## Why This Chapter Is Designed This Way

One idea connects everything in this chapter:

**Collaboration quality depends on your model of the collaborator.**

This isn't just a heuristic — it's backed by converging research from three different fields. Here's the short version:

### The Evidence

{: #perspective-taking}
**Perspective-taking is the lever** (🔬 Woolley et al. 2010; 🔬 Steyvers et al. 2022; 📐 Riedl & Weidmann 2025, preprint). Woolley et al. demonstrated in *Science* (n=699) that collective intelligence in human teams is a distinct construct from individual intelligence — and that social sensitivity (a Theory of Mind measure) is its strongest predictor. Steyvers et al. showed in *PNAS* that human-AI complementarity depends on correlated confidence, not raw individual ability. Riedl & Weidmann extend these findings with a Bayesian IRT framework (n=667), providing preliminary evidence that ToM predicts human-AI collaboration quality specifically (ρs=0.17, p<0.001). This skill seems to have two parts: a stable trait you build over time, and a moment-to-moment quality that fluctuates per interaction — consistent with established trait/state decomposition in psychology (Steyer et al. 1999, Fleeson & Jayawickreme 2015).[^riedl-status]

{: #shared-models}
**Communication works through shared models** (🔬 Friston & Frith 2015). Neuroscience research shows that successful communication between agents happens when they build shared predictive models of each other. It's not about transmitting information — it's about mutual prediction.

{: #asymmetric-duet}
**Human-LLM collaboration is an asymmetric duet** (📐 our translation). Friston's framework assumes both agents adapt. LLMs don't adapt mid-conversation. So the human has to do almost all the model-building work. That's what the 4 Levels of Abstraction (Ch 4.0) are for — building *your* half of the shared model.

{: #common-ground}
**Communication requires common ground** (🔬 Clark 1996). Before the Bayesian formalization, linguists established that dialogue depends on mutual knowledge and "conceptual pacts." With an LLM, you have to establish these pacts explicitly through how you communicate (Articulate) — the LLM can't meet you halfway.

{: #misconceptions-interfere}
**Misconceptions actively interfere** (🔬 Chi 2005, 🔬 Nguyen et al. 2024). Wrong mental models of LLMs aren't just gaps in knowledge — they're active interference. Students who thought LLMs were "smart databases" performed measurably worse than those with more accurate models (0.22 vs. 0.27 pass rate). This is why Ch 4.0 (building the mental model) comes before any collaboration practice.

[^riedl-status]: Riedl & Weidmann 2025 is a preprint, not yet peer-reviewed. We mark it 📐 (Translated) rather than 🔬 (Established) until publication. The underlying findings — that collaborative ability is distinct from individual ability (Woolley 2010, 🔬) and that ToM matters for collaboration (Woolley 2010, 🔬) — are well-established. Riedl extends these to human-AI collaboration specifically. Vaccaro et al. (2024, 🔬) add that synergy is task-dependent: positive for creation tasks (like Ch 4's exercises), absent or negative for decision tasks.

---

## How the Evidence Maps to Chapter Design

{: #skill-ordering}
| Chapter Element | What It Does | Evidence Base |
| --- | --- | --- |
| **4 Levels of Abstraction** (4.0) | Builds your mental model of LLMs | 🔬 Dennett 1987, Marr 1982 (L0–2); 🔬 Hutchins 1995, Cooke 2013 (L3); 📐 Friston: "building your half of the shared generative model" |
| **Misconception identification** (4.0) | Corrects ontological miscategorization | 🔬 Chi 2005, 🔬 Nguyen 2024 |
| **Collaboration skills** (4.1–4.4) | Practices perspective-taking in context | 🔬 Woolley 2010: social sensitivity predicts collective intelligence; 📐 Riedl 2025: extends to human-AI |
| **Spiral structure** (rings revisiting Chs 1–3) | Builds trait-level perspective-taking | 🔬 Steyer 1999, Fleeson 2015: trait/state decomposition; 📐 Riedl 2025: applied to human-AI ToM |
| **Per-exercise reflection** | Develops state-level perspective-taking | 🔬 Fleeson 2015: traits are density distributions of states; 📐 Riedl 2025: state ToM fluctuates per exchange |
| **SOLO-based AI threshold** | Comprehension before collaboration | 🔬 Woolley 2010, Steyvers 2022: collaborative ≠ individual ability; 📐 Riedl 2025: extended via IRT |
| **Vibecoding autopsy** (4.6) | Comprehension stress-test: reveals the gap between "it works" and "I understand it." Optional cross-domain extension tests Gell-Mann Amnesia directly. | 📐 Predicted from Prather 2024 (widening gap); 🔬 Vaccaro 2024: synergy requires deliberate design |

{: #adapted-skills}
### Adapted Skills

The comprehension skills from Chs 0–3 (Read, Trace, Describe) transfer to LLM collaboration but require genuine adaptation — the same cognitive operations applied to a fundamentally different source.[^block-model] The Block Model assessment framework (Schulte 2008) applies to both human-written and LLM-generated code.

[^block-model]: The Block Model's 4×3 grid (Atoms/Blocks/Relationships/Macro Structure × Text Surface/Program Execution/Function-Purpose) provides specific, assessable dimensions of code understanding. When you receive LLM-generated code, the risk is that you skip the Program Execution dimension — you read the surface and guess the purpose without tracing what actually happens.

{: #new-skills}
### New Skills

| Skill | Why It's New | Evidence |
| --- | --- | --- |
| **Perspective-Take** | No code equivalent — non-human theory of mind | 📐 Riedl: ToM is the measurable lever |
| **Calibrate** | No code equivalent — assessing irregular capabilities | 🔬 Mollick: "jagged frontier" |
| **Articulate** | Writing for a very different kind of reader, not a compiler | 📐 Friston/Clark: building common ground explicitly |
| **Iterate** | Conversational loop, not direct edit | 📐 Riedl: state-level ToM fluctuates per exchange |
| **Delegate** | SOLO-aware task distribution | 📐 Riedl: individual ≠ collaborative ability |

---

## Research Questions Behind This Chapter

This curriculum is a translational research artifact — it simultaneously teaches and investigates. These are the questions Ch 4's exercises are designed to help answer:

{: #rq1}
**RQ1**: Can perspective-taking about LLMs be taught, and does it improve collaborative coding outcomes? (🧪)

{: #rq2}
**RQ2**: Is there a comprehension threshold for productive human-AI collaboration? (📐)

{: #rq3}
**RQ3**: How do learners' mental models of LLMs relate to their collaboration quality? (📐)

{: #rq7}
**RQ7**: Do LLMs help or hurt misconception formation and correction in novice programmers? (📐)

{: #rq8}
**RQ8**: How does LLM-generated code interact with the Block Model levels of understanding? (📐)

For the complete list of 9 research questions with full descriptions, see the research framing document (`0-repo-research/ch4/research-framing.md#3-research-questions`) in the research repo.

---

## Evidence Base Legend

See the [global research framing](../research-framing.md#the-evidence-tag-system) for full details. In brief:

- 🔬 **Established** — Direct research backing
- 📐 **Translated** — Established theory applied to new context
- 🧪 **Extension** — Untested prediction or extrapolation

When you see `[📐]` or `[🔬]` linked in chapter content, it points to a specific section of this document explaining the evidence behind that claim.

---

## Why This Chapter Exists

Research shows that students overwhelmingly develop broken mental models of LLMs — most believe in keyword-lookup or database-retrieval models that cannot explain stochasticity, failure modes, or effective collaboration strategies. Students who correctly understood how GPT-like systems work performed measurably better (0.27 vs. 0.22 pass rate) [🔬](#misconceptions-interfere). Teaching _how LLMs actually work_ (at appropriate depth) is prerequisite to effective collaboration, not an optional extra.

---

## References

### Catalyst

- "How Beginning Programmers and Code LLMs (Mis)read Each Other" — Section 9.3

### Mental Models & Framing

- Shanahan (Nature 2023, CACM 2024): Role-play frame — "the model simulates a superposition of plausible characters"
- Vanhoucke: "Close Encounters of the LLM Kind" (swarm model)
- Mollick: "Co-Intelligence" (jagged frontier)
- Lin (2025): "Six Fallacies" about LLMs
- Gell-Mann Amnesia effect applied to AI

### Mechanistic Interpretability & Internal Representations

- Anthropic: "Scaling Monosemanticity" (2024) — discrete concept features in Claude
- Anthropic: Circuit tracing (2025) — multilingual "language of thought," poetry planning, genuine vs. fabricated chain-of-thought
- Golden Gate Bridge Claude experiment — concept manipulation demo
- Park et al. (ICML 2024): Linear Representation Hypothesis — concepts as directions in high-dimensional space

### Truth, Knowledge & Hallucination

- Marks & Tegmark (2023): "Geometry of Truth" — truth/falsehood linearly separable in activation space
- Burger et al. (NeurIPS 2024): Truth representation generalizes across models
- Orgad et al. (ICLR 2025): LLMs sometimes encode correct answers internally but fail to output them
- Huan et al. (2025): Lying and hallucinating are mechanistically distinct

### LLM Cognition Debate

- Li et al. (ICLR 2025): Othello-GPT — 99% accuracy world models across 7 architectures
- Bender & Koller (2020) vs. emergent capabilities view — "stochastic parrots" debate
- ICLR 2025 planning research: reasoning degrades on unfamiliar problems

### Analytical vs. Heuristic Code Analysis

- Su & McMillan (2025): "Do Code LLMs Do Static Analysis?" — LLMs use fundamentally different mechanisms
- Wei Ma et al. (2023): "LMs: Understanding Code Syntax and Semantics" — LLMs approximate AST-level syntax but fail at deeper semantics
- Fang et al. (USENIX Security 2024): LLM analysis degrades on obfuscated code where formal tools don't

### Human-AI Collaboration Dynamics

- Woolley, Chabris, Pentland, Hashmi & Malone (2010): "Evidence for a Collective Intelligence Factor" — collective intelligence is distinct from individual intelligence, social sensitivity (ToM) is its strongest predictor (🔬 *Science*)
- Steyvers, Tejeda, Kerrigan & Smyth (2022): Bayesian human-AI complementarity — hybrid pairs outperform both parties under specific conditions (🔬 *PNAS*)
- Vaccaro, Almaatouq & Malone (2024): "When combinations of humans and AI are useful" — synergy is task-dependent: positive for creation, absent/negative for decision-making (🔬 *Nature Human Behaviour*)
- Riedl & Weidmann (2025): "Quantifying Human-AI Synergy" — extends Woolley/Steyvers to IRT quantification of human-AI collaboration; perspective-taking as measurable predictor (📐 preprint)
- ToMinHAI Workshop (2024): "Mutual Theory of Mind" as research agenda
