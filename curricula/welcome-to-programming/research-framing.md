---
sidebar_position: 99
---

# Research Framing

> This document is for researchers and curriculum designers. If you're a learner
> or educator, see the [Foreword](./foreword.md) instead.

**Owner**: Research committee

For the universal research orientation shared across all curricula — including
the TCER framework, the Two Divides, the Evidence Tag System, and the "Pedagogy
Wins" design principle — see the repo-level research framing at
`../../research-framing.md` (repo root).

---

## Per-Chapter Research Framings

Each chapter has its own `research-framing.md` that lives inside the chapter
directory. It serves dual purpose:

- **For educators**: A foreword explaining the evidence base, research
  questions, and design rationale for that chapter
- **For the referencing system**: The single source of truth for all evidence
  links within that chapter's files

| Chapter                                  | Research Framing Status | Primary Focus                                                  |
| ---------------------------------------- | ----------------------- | -------------------------------------------------------------- |
| Ch 0: Devs Talk to Computers             | Stub                    | —                                                              |
| Ch 1: Devs Talk to Developers            | Stub                    | —                                                              |
| Ch 2: Devs Talk to Computers (Variables) | Stub                    | —                                                              |
| Ch 3: Devs Talk to Users                 | Stub                    | —                                                              |
| **Ch 4: Devs, Computers, Users, Agents** | **Detailed**            | **Human-AI collaboration, perspective-taking, misconceptions** |
| Ch 5: Algorithms                         | Stub                    | —                                                              |
| Ch 6: Complexity                         | Stub                    | —                                                              |

Chapter 4's research framing is the most developed — it's currently the most
active translational artifact. Other chapters have stubs that will grow as they
mature.

For Ch 4's full evidence base, research questions, and measurement strategy,
see:

- [Ch 4 Research Framing](./4-devs-computers-users-agents/research-framing.md)
  (educator-facing)
- Ch 4 Deep Research Framing (`0-repo-research/ch4/research-framing.md`)
  (researcher-facing)

---

## Who We're Looking For

This is trading zone work. We're actively looking to bridge disciplines:

### Research Collaborators

- **CER researchers** — theory development, experimental design, validation of
  our translated claims
- **Cognitive scientists** — collaborative cognition, Theory of Mind, shared
  intentionality research
- **HCI researchers** — human-AI interaction patterns, trust calibration, agency
  design
- **Educational psychologists** — misconception research, expertise reversal,
  instructional design
- **Communication theorists** — active inference, common ground theory, dialogue
  dynamics
- **Curriculum designers** — translating research into teachable content,
  progressive disclosure

We don't need everyone to agree on methodology. That's the point of a trading
zone — we coordinate locally on specific problems.

### How to Contribute

1. **Review evidence claims**: Check the per-chapter `research-framing.md`
   files. Are our 📐 translations defensible? Are our 🧪 extensions worth
   testing?
2. **Propose research questions**: Each chapter's research framing lists active
   RQs. Missing something? Open an issue.
3. **Design measurement instruments**: Our measurement strategy is a design
   sketch, not a validated protocol. We need help turning sketches into
   instruments.
4. **Conduct studies**: The curriculum IS the intervention for several RQs. If
   you want to run a study using this curriculum, we want to hear from you.
5. **Challenge our framing**: Counter-arguments and alternative theoretical
   framings strengthen the work. Disagreement is welcome.

---

## Committee Ownership

| Deliverable                           | Owner                         | Location                                          |
| ------------------------------------- | ----------------------------- | ------------------------------------------------- |
| This document (WtP research framing)  | Research committee            | `/curricula/welcome-to-programming/`              |
| Repo-level research framing           | Research committee            | `/research-framing.md` (repo root)                |
| Per-chapter research-framing.md       | Research committee            | Chapter directories (for relative linking)        |
| Deep research framing documents       | Research committee            | `/0-repo-research/background_research/`           |
| Literature reviews + bibliography     | Research committee            | `/0-repo-research/background_research/`           |
| Research questions (formal)           | Research committee            | `/0-repo-research/background_research/`           |
| Curriculum foreword                   | Curriculum committee          | `/curricula/welcome-to-programming/`              |
| Chapter content (README, subchapters) | Curriculum committee          | Chapter directories                               |
| Evidence tags in content              | Curriculum committee (inline) | Links to research-framing.md (research committee) |
| Exercise design                       | Curriculum committee          | Chapter directories                               |
| Measurement instrument design         | Research committee            | `/0-repo-research/`                               |

Research-framing files live in curriculum directories for relative linking but
are research committee deliverables. This means the research committee maintains
the evidence claims; the curriculum committee maintains the teaching content
that references them.
