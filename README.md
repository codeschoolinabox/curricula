# References

A collection of papers for study and inspiration. We can put all papers here and link to them from any directory in the future.

These papers are organized around our two guiding research questions:

1. **What is code literacy and how is it developed?**
2. **Which AI interaction patterns hurt code literacy development, and which help?**

---

## Theme A: Foundations — What IS Code Comprehension / Code Literacy?

Papers that define, model, or measure what it means to understand code. Start here to build a shared vocabulary for "code literacy" before tackling AI-specific questions.

### Block Model (Schulte, 2008)

**`BlockModel-schulte.pdf`** · [DOI: 10.1145/1404520.1404535](https://doi.org/10.1145/1404520.1404535)

Proposes an educational model of program comprehension structured along two dimensions: levels of abstraction (text surface → program execution → understanding function/purpose) and scope (atoms → blocks → relations → macro-structure). Evaluated in a qualitative study with prospective CS teachers designing lessons on algorithms like Bubblesort. The model is intentionally simple so that even teaching novices can use it for lesson planning. Provides a shared vocabulary for what "understanding code" actually means at different granularities — useful for articulating what code literacy skills AI might bypass or support.

### Abstraction Transition Taxonomy (Cutts, Esper, Fecho, Foster & Simon, 2012)

**`abstraction-transition-taxonomy.pdf`** · [DOI: 10.1145/2361276.2361290](https://doi.org/10.1145/2361276.2361290)

Post-hoc analysis of 133 Peer Instruction questions from an intro programming course, grounded in situated cognition theory. Identifies three levels of abstraction students must navigate — English (natural language), CS Speak (domain vocabulary), and Code (formal syntax) — and classifies questions by the transitions they require between these levels. Key finding: summative assessments (exams) tend to test only a narrow range of these transitions, while formative activities cover a much broader set. Directly relevant to defining code literacy as a multi-level translation skill, and to evaluating whether AI-generated solutions let students skip essential abstraction transitions.

### 40 Years of Designing Code Comprehension Experiments (Wyrich, Bogner & Wagner, 2023)

**`40 Years of Designing Code Comprehension Experiments: A Systematic Mapping Study.pdf`** · [DOI: 10.1145/3626522](https://doi.org/10.1145/3626522)

Systematic mapping of 95 source code comprehension experiments published between 1979 and 2019. Structures the design characteristics of code comprehension studies — what topics have been studied, how studies were designed/conducted/reported, and which design options are frequently chosen. Identifies deficiencies and gaps in the research base. At 43 pages, this is a comprehensive meta-reference for anyone designing their own comprehension studies. Useful for understanding how "code comprehension" has been operationalized and measured across four decades of research.

### Code Comprehension Problems as Learning Events (Sudol-DeLyser, Stehlik & Carver, 2012)

**`Code Comprehension Problems as Learning Events.pdf`** · [DOI: 10.1145/2325296.2325319](https://doi.org/10.1145/2325296.2325319)

Study from Carnegie Mellon examining whether code comprehension questions with feedback can function as learning events, not just assessment items. Students in an intro programming course interacted with an online tutoring system, answering comprehension problems about array algorithms — first in their own words, then selecting from multiple choice options. Both open-ended and multiple-choice responses were collected and analyzed. Results indicate that code comprehension questions with appropriate feedback do serve as learning events. The "explain first, then choose" interaction pattern is particularly relevant as a model for productive AI-assisted learning.

### Put The "Code" Back In "Code Comprehension Study" (Chin & Holmes, 2026)

**`Put The "Code" Back In "Code Comprehension Study".pdf`** · [DOI: 10.1145/3794763.3794806](https://doi.org/10.1145/3794763.3794806)

Approaches code comprehension from a radically different angle: instead of controlled experiments with synthetic snippets and student subjects, analyzes 604k methods across five programming languages from real open-source code. Argues that developers who wrote, evolved, and reviewed the code found it comprehensible, providing signal about comprehensibility at scale. Key finding: method length heavily correlates with prior comprehension metrics and may be a confounder of earlier experimental results. Also finds that comment presence co-locates with large, complex, hard-to-read code across all languages. Challenges the ecological validity of traditional comprehension study designs.

### Code Comprehension: Review and Large Language Models Exploration (Cui, Zhao, Yu, Huang, Wu & Zhao)

**`Code Comprehension: Review and Large Language Models Exploration.pdf`**

Survey categorizing code comprehension research into four areas: code comment generation, EEG signal correlation with comprehension, experimental studies on comprehension, and code visualization. For each category, the paper details representative approaches and their methodologies. Also investigates how LLMs can enhance comprehension tasks — such as automatic comment generation and code explanation — highlighting potential future research at the intersection of LLMs and developer understanding. Notes that developers spend an estimated 70% of their time understanding code, making comprehension a high-value target for AI assistance.

### Code Review Comprehension (Wurzel Goncalves, Rani, Storey, Spinellis & Bacchelli)

**`Code Review Comprehension: Reviewing Strategies Seen Through Code Comprehension Theories.pdf`** · [DOI: 10.5281/zenodo.14748996](https://doi.org/10.5281/zenodo.14748996)

Observational study of 10 experienced developers performing 25 code reviews from their actual review queues. Uses Letovsky's model of code comprehension as a theoretical lens and extends it to propose a Code Review Comprehension Model. Finds that code review, like code comprehension, relies on opportunistic strategies — typically beginning with a context-building phase, followed by code inspection involving reading, testing, and discussion management. Reviewers construct mental models of changes by contrasting expected/ideal solutions against actual implementation. Demonstrates that comprehension is an active cognitive process, not passive consumption — relevant to understanding why reading AI-generated code doesn't build the same skills.

### Barriers for Students During Code Change Comprehension (Middleton, Ore & Stolee, 2024)

**`Barriers for Students During Code Change Comprehension.pdf`** · [DOI: 10.1145/3597503.3639227](https://doi.org/10.1145/3597503.3639227)

Combines interviews (29 students), an observational study (44 students working through 8 code change comprehension activities with pull requests), and reflection surveys in a junior-level software engineering course at NC State. Uncovers barriers students face during code review across four facets: context for review, review tools, the code itself, and implications of code changes. Key quantitative finding: students tend to overestimate behavioral similarity when comparing code versions — they think code changes are less impactful than they actually are. Has implications for how students might evaluate AI-generated code modifications.

---

## Theme B: Learning Science Foundations

How people actually learn complex skills. Essential background for understanding why AI shortcuts may undermine skill development.

### 4C/ID Model (van Merrienboer, Clark & de Croock, 2002)

**`4c-id.pdf`** · [DOI: not available — ETR&D Vol. 50, No. 2, 2002, pp. 39–64](https://link.springer.com/article/10.1007/BF02504993)

Overview of the Four-Component Instructional Design model for training complex skills, originally developed in the early 1990s. The four components: (a) learning tasks — whole, authentic tasks organized from simple to complex, (b) supportive information — mental models and cognitive strategies given before tasks, (c) just-in-time (JIT) information — procedural rules given during tasks that fade as learners automate, and (d) part-task practice — repetition for skills that must become automatic. Includes a fully worked-out training blueprint example. Directly relevant because it shows why complex skill acquisition requires structured, sequenced difficulty with fading support — not shortcutting via generated solutions that skip the progression.

### Do Learners Really Know Best? Urban Legends in Education (Kirschner & van Merrienboer, 2013)

**`Do_Learners_Really_know_best.pdf`** · [DOI: 10.1080/00461520.2013.804395](https://doi.org/10.1080/00461520.2013.804395)

Critically examines three persistent "urban legends" in education: (1) that "digital natives" naturally know how to learn from new media, (2) that education should match individual learning styles, and (3) that learners should be treated as self-educators given maximum control. Using educational and psychological research, the authors show each belief is poorly supported by evidence. The unifying theme is that learner preferences often don't align with effective learning methods — students may feel they learn better a certain way without actually learning better. Directly challenges the assumption that students can productively self-direct their AI-assisted learning, and cautions against giving learners tools they think are helping but that may undermine skill acquisition.

---

## Theme C: AI × Programming Education — Impact and Adaptation

How LLMs are actually affecting CS education. The core of our research territory.

### The Robots Are Here (Prather, Denny, Leinonen, Becker, Albluwi, Craig, Keuning, Kiesler, Kohn, Luxton-Reilly, MacNeil, Petersen, Pettit, Reeves & Savelka, 2023)

**`The Robots Are Here: Navigating the Generative AI Revolution in Computing Education.pdf`** · [DOI: 10.1145/3623762.3633499](https://doi.org/10.1145/3623762.3633499)

Comprehensive ITiCSE working group report at 53 pages — the most thorough early overview in the collection. Convened 15 researchers from 7 countries to map the generative AI landscape across computing education. Covers: LLM capabilities for generating and explaining code, threats to academic integrity, pedagogical opportunities, generation of learning resources, and open research questions. Documents that GenAI tools can generate correct solutions to most introductory programming assignments and accurately explain code. This paper established much of the research agenda the field has since pursued. 264 citations indicate its foundational status.

### Computing Education in the Era of Generative AI (Denny, Prather, Becker, Finnie-Ansley, Hellas, Leinonen, Luxton-Reilly, Reeves, Santos & Sarsa, 2024)

**`Challenges and opportunities faced by computing educators and students adapting to LLMs capable of generating accurate source code from natural-language problem descriptions..pdf`** · [DOI: 10.1145/3624720](https://doi.org/10.1145/3624720)

Published in Communications of the ACM, this is the more concise, practitioner-oriented companion to "The Robots Are Here." Highlights four key insights: GenAI presents both challenges and opportunities requiring updated pedagogical strategies; LLMs are highly capable of solving intro programming problems, raising overreliance concerns; AI tools can transform creation of personalized educational resources; and novel pedagogies are emerging around strategic problem decomposition and prompt accuracy. Accessible entry point for committee members wanting a quick overview of the landscape.

### Large Language Models in CS Education: A Systematic Literature Review (Raihan, Siddiq, Santos & Zampieri, 2025)

**`Large Language Models in Computer Science Education: A Systematic Literature Review.pdf`** · [DOI: 10.1145/3641554.3701863](https://doi.org/10.1145/3641554.3701863)

Systematic literature review from SIGCSE TS 2025 examining the impact of LLMs across CS and computer engineering education. Analyzes LLM effectiveness in enhancing learning experience, supporting personalized education, and aiding curriculum development. Addresses five research questions about educational outcomes. Covers both foundational models (GPT, LLaMA) and code-specific fine-tuned models. As the most recent systematic review in the collection (Feb 2025), provides up-to-date mapping of how the field has evolved since the initial wave of papers in 2023.

### From "Ban It Till We Understand It" to "Resistance is Futile" (Lau & Guo, 2023)

**`From "Ban It Till We Understand It" to "Resistance is Futile": How University Programming Instructors Plan to Adapt as More Students Use AI Code Generation and Explanation Tools such as ChatGPT and GitHub Copilot.pdf`** · [DOI: 10.1145/3568813.3600138](https://doi.org/10.1145/3568813.3600138)

Interviews with 20 introductory programming instructors (9 women, 11 men) across 9 countries spanning all 6 populated continents. Captures the spectrum of educator responses in early 2023: short-term measures to discourage AI-assisted cheating, and divergent long-term opinions between banning AI tools to preserve fundamentals versus integrating them to prepare students for industry. The study findings capture a rare snapshot as instructors were just forming opinions about this phenomenon. 174 citations and ~10,000 downloads suggest this resonated widely. Useful for understanding the educational policy landscape our communications need to address.

### The Widening Gap (Prather, Reeves, Leinonen, MacNeil, Randrianasolo, Becker, Kimmel, Wright & Briggs, 2024)

**`The Widening Gap: The Benefits and Harms of Generative AI for Novice Programmers.pdf`** · [DOI: 10.1145/3632620.3671116](https://doi.org/10.1145/3632620.3671116)

**Key paper for our research.** Replicates a previous study on novice programming problem-solving behavior and extends it by incorporating GenAI tools. Through 21 lab sessions with participant observation, interviews, and think-aloud protocols, reveals that previously known metacognitive difficulties not only persist with GenAI use but are compounded. Struggling students expressed cognitive dissonance about their problem-solving ability, thought they performed better than they did, and finished with an "illusion of competence." More skilled students benefited from GenAI, suggesting AI may widen rather than close the skills gap. This paper most directly answers the question "how does AI hurt code literacy development?"

### How Beginning Programmers and Code LLMs (Mis)read Each Other (Nguyen, McLean Babe, Zi, Guha, Anderson & Feldman, 2024)

**`How Beginning Programmers and Code LLMs (Mis)read Each Other.pdf`** · [DOI: 10.1145/3613904.3642706](https://doi.org/10.1145/3613904.3642706)

Large-scale controlled study (CHI 2024) of 120 beginning coders across three academic institutions. Novel experimental design targets specific steps in the text-to-code process and reveals that beginners struggle with writing and editing prompts, even for problems at their skill level and when correctness is automatically determined by the system. Mixed-methods evaluation provides insight into student processes and perceptions. Key implication: the text-to-code pipeline has multiple failure points for beginners — they can't describe their intent clearly, they can't evaluate generated code, and they can't edit prompts effectively. 46 citations and 13,000+ downloads indicate high impact.

### Trust in Generative AI among Students (Amoozadeh, Daniels, Nam, Kumar, Chen, Hilton, Ragavan & Alipour, 2024)

**`trust in generative ai among students.pdf`** · [DOI: 10.1145/3626252.3630842](https://doi.org/10.1145/3626252.3630842)

Survey of 253 students at two large universities examining how much they trust GenAI tools and how that trust affects learning. Results show students have different levels of trust in GenAI, along with varying confidence and motivation. Trust influences the extent of adoption, which in turn affects learning outcomes. Highlights the need for understanding trust as a mediating variable — students who trust AI too much may over-rely on it, while those who distrust it may miss productive uses. Relevant for designing interventions that calibrate appropriate trust levels.

### Pacing for Mastery (Tran, Gao, Lombard, Yu, Jiang & Yeh, 2026)

**`Pacing for Mastery: Optimizing LLM Interactions for Learning.pdf`** · [DOI: 10.1145/3770762.3772501](https://doi.org/10.1145/3770762.3772501)

Classroom deployment study (SIGCSE TS 2026) comparing three AI assistant pacing styles in intro CS courses: Fast (direct answers), Medium (typical instructor preprompting), and Slow (Socratic-style). The slower-paced, Socratic-style AI assistant significantly increased learning, especially for students with less prior knowledge. Fast-paced interaction initially benefited more advanced students, but retention degraded enough to negate those gains. The medium-paced assistant showed no statistically significant improvements. Most actionable paper in the collection — directly suggests that offering a Socratic-style AI alternative could meaningfully improve learning outcomes even when students also use commercial fast-paced tools.

---

## Theme D: New Pedagogical Approaches for the AI Era

Concrete teaching strategies that integrate AI productively into programming education.

### Prompt Problems (Denny, Leinonen, Prather, Luxton-Reilly, Amarouche, Becker & Reeves, 2024)

**`Prompt Problems: A New Programming Exercise for the Generative AI Era.pdf`** · [DOI: 10.1145/3626252.3630909](https://doi.org/10.1145/3626252.3630909)

Introduces a new type of programming exercise for the AI era. In a "Prompt Problem," students craft a natural language prompt which, when provided to an LLM, must generate code that passes specified test cases. Presents Promptly, a web-based tool hosting a repository of Prompt Problems with automated evaluation. Deployed in one CS1 and one CS2 course. Shifts emphasis from code writing to code specification and evaluation — students must understand the problem well enough to describe it precisely, and evaluate whether generated output is correct. 122 citations suggest significant adoption. Directly relevant to our question about which AI interaction patterns help.

### Explaining Code with a Purpose (Denny, Smith, Fowler, Prather, Becker & Leinonen, 2024)

**`Explaining Code with a Purpose: An Integrated Approach for Developing Code Comprehension and Prompting Skills.pdf`** · [DOI: 10.1145/3649217.3653587](https://doi.org/10.1145/3649217.3653587)

Proposes a natural synergy between "Explain in Plain English" (EiPE) questions and code-generating LLMs. Students are shown code and must explain its purpose; their explanation is then used as a prompt to an LLM, and the generated code is evaluated against test cases. If the explanation was accurate enough, the LLM produces equivalent code — providing automatic grading and transparent feedback. This addresses two longstanding problems: the difficulty of grading free-text code explanations, and the need for new prompting skills. Develops both comprehension and prompting skills simultaneously, making it one of the most promising pedagogical innovations in the collection. 33 citations.

### Prompting for Comprehension (Smith, Denny & Fowler, 2024)

**`Prompting for Comprehension: Exploring the Intersection of Explain in Plain English estions and Prompt Writing.pdf`** · [DOI: 10.1145/3657604.3662039](https://doi.org/10.1145/3657604.3662039)

Related to the above, presented at Learning @ Scale 2024. Explores and evaluates using students' EiPE responses as LLM prompts for auto-grading comprehension questions. Evaluates students' success in completing these tasks, their use of the feedback provided by the system, and their perceptions of the activity. Provides a scalable approach to creating code comprehension questions where feedback comes both through the code generated from a student's description and the results of test cases run on that code. Reinforces the idea that code comprehension and prompt-writing are deeply linked skills for the AI era.

---

## Suggested Additional Reading

Papers not yet in this collection that could strengthen our research base. Open-access links provided where available.

### Foundational / Learning Science

- **Bjork & Bjork, "Desirable Difficulties in Theory and Practice" (2020)**
  The canonical reference for why making learning harder in specific ways (spacing, interleaving, retrieval practice) improves long-term retention and transfer. Directly relevant to understanding why AI-generated shortcuts may undermine the productive struggle necessary for skill building. The key insight: conditions that make learning appear slower or harder often produce better long-term outcomes than conditions that make learning appear easy.
  [ResearchGate (open access)](https://www.researchgate.net/publication/347931447_Desirable_Difficulties_in_Theory_and_Practice) · [Bjork Lab PDF](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/07/RBjork_inpress.pdf)

- **Loksa, Ko, Jernigan, Oleson, Mendez & Burnett, "The Role of Self-Regulation in Programming Problem Solving Process and Success" (2016)**
  Shows that novice programmers rarely self-regulate while problem-solving and that explicit instruction in metacognitive strategies improves outcomes. Key for understanding what AI bypasses when it provides solutions directly — the self-regulation cycle of planning, monitoring, and evaluating one's own approach.
  [PDF from author site](https://faculty.washington.edu/ajko/papers/Loksa2016SelfRegulation.pdf)

- **Prather, Becker, Craig, Denny, Loksa & Margulieux, "Metacognition and Self-Regulation in Programming Education: Theories and Exemplars of Use" (2022, ACM TOCE)**
  Comprehensive review of metacognition theories applied to CS education, including Xie et al.'s theory of instruction for introductory programming skills and Loksa et al.'s theory of programming problem-solving. Establishes the framework for understanding what "thinking about your own thinking" means in the context of learning to program.
  [ACM Digital Library](https://dl.acm.org/doi/10.1145/3487050) · [NSF open access](https://par.nsf.gov/servlets/purl/10325349)

### AI × Education (Recent)

- **Prather, Leinonen, Kiesler, Gorson Benario, Lau, MacNeil et al., "Beyond the Hype: A Comprehensive Review of Current Trends in Generative AI Research, Teaching Practices, and Tools" (ITiCSE-WGR 2024)**
  The most recent comprehensive working group report, succeeding "The Robots Are Here." Systematic review of 71 papers + educator surveys + interviews. Documents the shift from 2022–23 exploratory research to 2024's focus on integration and specialized aspects. Covers research trends, teaching practices, and emerging tools.
  [arXiv (open access)](https://arxiv.org/abs/2412.14732) · [ACM DL](https://dl.acm.org/doi/abs/10.1145/3689187.3709614)

- **Mills, Cope, Scholes & Rowe, "Coding and Computational Thinking Across the Curriculum" (2025, Review of Educational Research)**
  Recent comprehensive review identifying four key learning outcomes from coding education: computational thinking for problem-solving and creative/critical thinking, disciplinary knowledge, student agency and motivation, and social/collaborative skills. Helps define what "code literacy" means beyond just writing code — important for framing our first research question.
  [SAGE Journals](https://journals.sagepub.com/doi/10.3102/00346543241241327)

- **"A Survey of LLM-Based Applications in Programming Education: Balancing Automation and Human Oversight" (2024, arXiv)**
  Surveys the landscape of LLM-based tools in programming education, focusing on the core tension between automation benefits and maintaining meaningful learning. Covers code generation assistants, intelligent tutoring systems, and automated assessment tools.
  [arXiv (open access)](https://arxiv.org/abs/2510.03719)

- **Loksa, Margulieux, Becker, Ko, Petersen & Prather, "Developing Novice Programmers' Self-Regulation Skills with Code Replays" (ICER 2023)**
  After watching code replays (recordings of their own coding process), participants more frequently interpreted problem prompts and planned solutions — crucial self-regulation behaviors that novices normally skip. Provides an intervention model that contrasts directly with AI giving answers: showing students their own process rather than showing them a solution.
  [ACM Digital Library](https://dl.acm.org/doi/10.1145/3568813.3600127)

---

## Key Researchers to Follow

Researchers whose work consistently appears at the intersection of our research questions:

| Researcher | Affiliation | Focus Areas |
|---|---|---|
| **Paul Denny** | U. Auckland | EiPE questions, Prompt Problems, AI + comprehension |
| **James Prather** | Abilene Christian | Metacognition in programming, GenAI impact on novices |
| **Juho Leinonen** | Aalto University | LLMs in CS education, learning analytics |
| **Brett Becker** | University College Dublin | Error messages, AI in intro programming |
| **Stephen MacNeil** | Temple University | GenAI tools for CS education |
| **Philip Guo** | UCSD | Programming education tools, instructor adaptation |
| **Jeroen van Merrienboer** | Maastricht University | 4C/ID, complex learning design (foundational) |
| **Robert & Elizabeth Bjork** | UCLA | Desirable difficulties (foundational learning science) |
| **Dastyni Loksa** | — | Self-regulation and metacognition in programming |
| **Carsten Schulte** | U. Paderborn | Block Model, program comprehension education |
