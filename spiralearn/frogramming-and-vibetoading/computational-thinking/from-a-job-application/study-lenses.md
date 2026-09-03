# Study Lenses

## Programming Languages and Computational Thinking

One persistent barrier to mastering CS and algorithms is actually programming languages, and this is a pedagogical problem not an inevitability. Some studies have even found almost no correlation between how well learners understand their theoretical solution to a coding challenge and learners whose code passes the tests! Why? Because mastering a programming language and computational thinking are orthogonal. It's possible for learners to understand their algorithm but spend hours stuck on things like array side-effects, or variable and function misconceptions. It's equally possible for learners to have no idea how an algorithm works but to fiddle with their code and use known patterns or libraries to solve problems.

So what's the solution? It's to first carefully guide learners through a journey that borrows from natural language learning to master syntax, and builds predictive, event-based understanding of program execution through interactive quizzes and games that test learners' predictions of program execution against data generated from dynamic program introspection. Once this is in place, you can carefully weave computational thinking skills into the lessons after learners have mastered the language features necessary to implement and explore theoretical concepts.

## Study Code, not Explanations

Study Lenses is a design principle for learning environments that prioritizes code comprehension and investigation. The reasoning behind Study Lenses goes something like this:

- Explicitly teach learners how to study and understand code.
- Provide tools that support free code investigation.
- Write level-appropriate programs for your learners to study.
- Learners explore the code freely, with your study suggestions.

## Peel-Away Design

Think of Study Lenses as training wheels on a bike, not as a tricycle. Study Lenses adds layers of support on top of existing development environments. As learners progress they are able to peel away these layers to reveal a full-fledged programming environment.

Lenses add new ways of seeing, understanding and exploring a program. Lenses do not change the way your programming language or development environment works. As an educator you can configure Study Lenses to suggest which lenses may be most helpful for a specific program, but learners are always free to ignore your suggestions and either use a lens of their choosing or ignore Study Lenses all together and simply run their code in its native runtime.

## Efficient Authoring

Three of the most important design constraints behind Study Lenses work together to ensure learners and educators can easily write and generate content, and that learners can continuously generate interactive exercises from any code they are writing or studying:

- All code should be content: A learner should be able to use Study Lenses to help understand any code they paste in (assuming the environment supports that language).
- Rely only on web-standard syntax & languages: Programs written and configured to be used with Study Lenses should not rely on any non-standard syntax or tooling, every program should be valid code or data that can be reused elsewhere.
- Content curation should use standard development workflows: All Study Lenses content should be hosted, developed, versioned, and distributed as a standard code base. A learner or educator with experience using Git, GitHub and an IDE should already have all the technical skills necessary to curate their own curriculum.

## The Latest Version (under development)

> Read more about Study Lenses architecture and pedagogy principles [here](https://github.com/codeschoolinabox/spiralearn/tree/main/src/lib/study-lenses).

I'm currently building a new version of Study Lenses as a react component embedded in Docusaurus sites, this means you can turn any markdown with JS code blocks or sibling JS files/directories into a deployed, structured curriculum with interactive exercises.

## The Lenses

Lenses (interactive exercises generated from source code) are organized around the phase of a program's life cycle that they help learners understand ([ascii wireframe](https://github.com/codeschoolinabox/spiralearn/blob/main/src/lib/study-lenses/orchestrate/ux/wireframes.md#fresh-mount--the-default-state)). This version of study lenses currently only supports JS, but it can be adapted to support Python or other programming languages by injecting static and dynamic analysis tools for that language. Exercise types include\*:

- **Parsons**: Converts learner source code into a parsons problem
- **WriteMe**: Scaffolded practice for re-writing a program from a blank page
- **Annotate**: Draw and take notes on code
- **Blanks**: Generates a leveled fill-in-the-blanks exercise with hints
- **Quiz**: Generates gradeable quiz questions about a learner's code (MCQ, T/F, highlight-the-region, etc)
- **Counting**: Allows learners to select areas of code then it counts how many times it's executed and what values pass through it. This is used to teach and study algorithmic complexity.
- **Socratize**: Generates open-ended reflection questions about programs, drawing learners away from lines of code and language mechanisms to questions of strategy, algorithm and elegance.
- **SpellMe**: A prediction exercise that walks learners through the tokenization process to help understand, catch and fix parsing errors.
- **Errors**: Helps learners connect error messages back to the lines of code that caused them and understand what each one means.
- **Variables**: An exercise that asks learners to predict which variable is next, how it's used, and with what value. All guesses are verified against program truth by collecting runtime data and comparing it to the learner's prediction.
- **Operators**: Like _Variables_, but for operators. It also breaks each operator into sub-steps to make coercion explicit and quizzable.
- **Run**: Just runs the code, rendering console output to a dev console in the UI and `prompt`/`alert`/`confirm` to a "UI" panel.
- **Debug**: If a learner is using a desktop, it opens their code in the browser's debugger.

> \* Lenses are in various stages of development. Most are nearly built, almost all have been prototyped in class before, and the rest have been specced.

## AI Collaboration — the `aithor` module

Because Study Lenses input is raw code instead of specialized exercise configuration syntax, it is ideal for learners to practice programming with LLMs. Study Lenses uses a light-weight local LLM to generate variations of an exercise's code so learners can explore the same skill/concept in slightly different ways for deeper mastery.

This `aithor` module is integrated in the Study Lenses UI so learners can also experience first-hand that AI doesn't generate perfect code, and so they can practice iterating with an agent while still benefitting from full study support.

---

## References

- [Principles & framework](https://denepo.js.org/study-lenses)
- [Live demo of an earlier prototype](https://study-lenses.evancole.be/demo) - [predictive stepping demo](https://www.youtube.com/watch?v=oXrZZgTN0oY)
- [Explorotron. Malaise & Signer 2023](https://wise.vub.ac.be/sites/default/files/publications/Malaise_KoliCalling2023.pdf) (advisor)
- [CodeSchool in a Box. Malaise, Cole & Signer 2023](https://wise.vub.ac.be/sites/default/files/publications/CSEDU2023.pdf) (co-author)
- Translational Computing Education Research. Cole, Malaise & Signer 2023 - [video](https://www.youtube.com/watch?v=L9HTo17Y5gw), [paper](https://wise.vub.ac.be/sites/default/files/publications/SIGCSE_2023_0.pdf) (lead author)
