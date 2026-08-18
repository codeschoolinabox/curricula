# lib/questioning/socratizing

A Socratic code analyzer for JeJ programs. Given a snippet's embodiment, returns
**questions — not corrections** — about both the micro-decisions in the code and
the reader's comprehension of it. Each question is a frozen `CodeQuestion`
anchored to an `[start, end)` offset range in the source and tagged with
metadata from three pedagogical frameworks.

Socratizing **asks**; it never grades. It surfaces that a `let` is never
reassigned and asks "what does `let` signal here?" — it never marks the choice
wrong. Grading, mastery, and verdicts belong to the closed register's machinery
and the consuming environment above — never here; this directory produces the
open, reflective register a human judges. In the questioning family it is the
open register's **leaf questioner**: `socratizing-questioner.ts` fronts this
engine behind the family's `Questioner` envelope ([../README.md](../README.md) §
The questioner family).

## What is a micro-decision?

Every line of code contains small choices: `let` vs `const`, a variable named
`x` vs `userInput`, string concatenation vs a template literal, a ternary vs an
if/else. Most programmers make these choices unconsciously. This module makes
them visible by asking questions that invite the reader to think about what was
chosen, what else could have been chosen, and how the choice affects the code's
meaning for different audiences.

The concept of micro-decisions comes from the musician and educator Lupe Fiasco,
who teaches that every syllable in a rap bar is a deliberate choice — vowel
stretching, word placement, and rhyme density all shape the "voice" of the
verse. In code, every keyword, name, operator, and structure shapes the
program's **voice**.

## Two kinds of questions

This module produces two kinds of `CodeQuestion`:

| Kind             | Intent                               | Skill stage             |
| ---------------- | ------------------------------------ | ----------------------- |
| `micro-decision` | "What effect does this choice have?" | Modify → Write          |
| `comprehension`  | "What does this line do?"            | Read → Trace → Describe |

Both kinds use **observational** framing ("What effect does this choice have…")
rather than authorial-intent framing ("What made you choose…"), so the questions
are equally useful whether the reader wrote the code or is studying it. Both
carry the same pedagogical metadata and share one frozen `CodeQuestion` type:
same Socratic contract, same BLOCK/PBSI/audience tags, same factory and freeze,
and one filtering path (`kind` is just another config dimension). A lens can
interleave both in one panel by source order.

## Two usage modes

1. **Studying code** (the larger use case) — learners analyze programs written
   by instructors to understand program voice before developing their own.
2. **Reviewing own code** — learners analyze their own programs as a bridge from
   production back to comprehension.

All questions use observational framing ("What effect does this choice have…")
rather than authorial-intent framing ("What made you choose…"), so they are
equally useful in both modes. This also applies to AI-assisted work: when AI
writes code for a learner, questions become the tool for taking ownership of
code you did not write yourself.

## Code is like poetry

Poetry analysts and code readers face the same task: understanding a dense,
deliberate text where every word was chosen for a reason. That correspondence is
the spine of the metadata.

| Poetry analysis        | Code analysis              | Framework                 |
| ---------------------- | -------------------------- | ------------------------- |
| Who is the speaker?    | Who wrote this?            | Rhetorics: developers     |
| Who is the audience?   | Who reads/runs this?       | Rhetorics: all three      |
| What is the tone?      | What is the voice?         | Voice profile             |
| What is the diction?   | Naming, operator choice    | Micro-decisions: voice    |
| What is the structure? | Control flow, blocks       | BLOCK model               |
| What is the purpose?   | Why does this exist?       | PBSI: purpose             |
| Paraphrase the poem    | Describe in plain language | Comprehension questions   |
| Read aloud             | Read line {n} aloud        | Comprehension: read-aloud |

## Categories

| Category      | Intent                                                |
| ------------- | ----------------------------------------------------- |
| `voice`       | Style choice — finding your voice as a programmer     |
| `clarity`     | Affects readability or maintainability for readers    |
| `consistency` | Same concept expressed differently across the program |
| `caution`     | Pattern that is often a bug but could be intentional  |
| `trap`        | Almost certainly a bug                                |
| `easter-egg`  | Undocumented JeJ feature the learner discovered       |

The spectrum runs from pure style (`voice`) to almost-certainly-wrong (`trap`),
grouped in three pairs: **voice** and **easter-egg** are about _expression_
(finding your voice, exploring the language); **clarity** and **consistency**
are about _communication_ (readable, coherent code); **caution** and **trap**
are about _correctness_ (patterns that are likely mistakes). Learning
environments can use the category to decide how to present each question — a
lightbulb icon for voice, a yellow flag for caution, a red flag for trap.

## Pedagogical frameworks

Each question is tagged with metadata from three frameworks.

### BLOCK model (Schulte 2008)

The grid's definition is the questioning parent's — see
[`../README.md`](../README.md) § The BLOCK model and § Leveling. This engine's
use of it: every question is tagged with one or more raw `block` cells (the
parent's `BlockCell[]`) retained for auditing, and with the linearized `levels`
field (the parent's `Level`) that consumers filter by.

### PBSI (Purpose, Behavior, Strategy, Implementation)

The curriculum's four-level framework for understanding programs. Context
strings use PBSI vocabulary naturally — "This **implementation** choice
affects…" or "The **strategy** for validating this input…" — so learners
practise the vocabulary every time they encounter a question.

### Rhetorics of Programming (three audiences)

Source code communicates with developers (through naming, structure, comments),
the computer (through precise instructions), and users (through program
behavior). Each question is tagged with the audiences it affects, and questions
reference audiences where natural: `console-log-audience` asks "Who is the
intended audience for this console.log()?", then asks how `alert()` would change
who sees the output.

## Question registers

(The inner `Question.register` sense; the open/closed register homonym is
resolved once in [`../README.md`](../README.md) § Glossary.)

Each `CodeQuestion` carries 1–3 questions tagged by register:

- **open** — invites broad reflection ("What does this signal to a reader?")
- **pointed** — directs attention to a specific aspect ("How many times does
  `count` change after line 3?")
- **comparative** — asks the reader to consider an alternative ("How would this
  line read if written the other way?")

Not every question has all three registers — only the ones that are genuinely
useful for that specific detection.

Learning environments implement the **Feedback Ladder** (EDM 2024) by choosing
which register to show: open questions for beginners (low information, high
learning gain), pointed questions as scaffolding, comparative questions for
learners ready to explore alternatives. The module provides the questions; the
environment manages escalation and fading.

### Expertise reversal

Research (Kalyuga et al. 2003) shows that scaffolding becomes actively harmful
for advancing learners. The stable `id` field on each question enables learning
environments to track which question types a learner has engaged with and
suppress categories where the learner has demonstrated competence.

## The question catalog (56 analyzers)

Question text uses `{name}`, `{method}`, `{operator}` as placeholders filled at
runtime from the AST. Fifty-six registered analyzers — **48 point** + **8
program**.

The **Example questions** column is illustrative, not a verbatim spec of the
emitted strings: cells shorten wording to fit the table, and show only some of a
`CodeQuestion`'s one-to-three questions. The files under `analyzers/` are the
authority on exact wording; this table is the authority on the catalog's shape —
which ids exist, which feature each belongs to, and roughly what each asks.

### Voice — micro-decision (10)

| ID                          | Feature         | Example questions                                                                                                                                                     |
| --------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `let-vs-const`              | variables       | "What does 'let' signal to a reader about '{name}'?" / "How many times is '{name}' reassigned?" / "How would the meaning change if 'let' were replaced with 'const'?" |
| `naming-descriptiveness`    | variables       | "What does the name '{name}' communicate about this variable's role?" / "Could a reader unfamiliar with this code guess what '{name}' stores?"                        |
| `string-construction`       | data            | "What makes template literals different from string concatenation with +?" / "How would this expression look as a template literal?"                                  |
| `ternary-vs-if-else`        | controlFlow     | "What makes this expression easy or hard to read?" / "How would this logic look as an if/else block?"                                                                 |
| `string-method-choice`      | functions       | "What does '.{method}()' do to its input?" / "What value does '.{method}()' produce?"                                                                                 |
| `nullish-coalescing`        | operators       | "What values does ?? treat as 'missing'?" / "How would this line behave if \|\| were used instead?"                                                                   |
| `for-of-iterator-naming`    | variables       | "What does the name '{name}' tell you about each element?" / "How would a different iterator name affect readability?"                                                |
| `input-validation-strategy` | userInteraction | "What could the user type or do that this program needs to handle?" / "What value does prompt() return if the user clicks Cancel?"                                    |
| `console-log-audience`      | userInteraction | "Who is the intended audience for this console.log()?" / "How would using alert() instead change who sees this output?"                                               |
| `operator-choice`           | operators       | "What does strict equality check that other comparisons might not?" / "What types of values are being compared here?"                                                 |

### Clarity — micro-decision (5)

| ID                      | Feature     | Example questions                                                                                                                             |
| ----------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `nested-conditions`     | controlFlow | "How many different paths can this nested structure produce?" / "What happens when both conditions are true? When neither is?"                |
| `boolean-coercion`      | controlFlow | "What values would make this condition true? What values false?" / "Is the empty string truthy or falsy? What about 0? null?"                 |
| `condition-specificity` | controlFlow | "What is the difference between checking for null and checking for undefined?" / "How would this behave if the check used == instead of ===?" |
| `simple-if-else`        | controlFlow | "What is each branch accomplishing?" / "Could this logic be expressed more concisely?"                                                        |
| `plus-overloading`      | operators   | "Is this operation adding numbers or joining strings?" / "What type of value does each side of + hold at this point?"                         |

### Consistency — micro-decision (4, program-level)

| ID                          | Feature     | Example questions                                                                                                                                 |
| --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mixed-declaration-style`   | variables   | "Is the mix of 'let' and 'const' intentional throughout this program?" / "Which 'let' declarations could be 'const'?"                             |
| `mixed-string-construction` | data        | "Is there a reason different string construction methods are used?" / "How would the code read if all string building used the same approach?"    |
| `mixed-equality`            | operators   | "Is the mix of strict and loose equality intentional?" / "Where is loose equality used, and does it behave differently?"                          |
| `mixed-condition-style`     | controlFlow | "Is the mix of a truthy check and an explicit comparison on the same value deliberate?" / "How would the code read if that value used one style?" |

### Caution — micro-decision (5)

| ID                        | Feature     | Example questions                                                                                                                   |
| ------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `assignment-in-condition` | operators   | "What is the difference between = and === in this position?" / "What value does the assignment produce for the condition to check?" |
| `empty-block`             | controlFlow | "What was the purpose of this block?" / "Was this control-flow block left empty intentionally, or is there missing code?"           |
| `unused-expression`       | operators   | "What happens to the value this expression produces?" / "Is this expression meant to have a side effect?"                           |
| `unused-variable`         | variables   | "What was the intended purpose of '{name}'?" / "Is '{name}' needed, or could the declaration be removed?"                           |
| `chained-assignment`      | operators   | "What value does each variable receive in this chain?" / "In what order are these assignments evaluated?"                           |

### Trap — micro-decision (2)

| ID                     | Feature     | Example questions                                                                                                    |
| ---------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| `constant-condition`   | controlFlow | "What does it mean when a condition can never change?" / "Will the code inside this block always execute, or never?" |
| `accidental-semicolon` | controlFlow | "What code does this statement actually control?" / "Is the semicolon after the condition intentional?"              |

### Easter Egg — micro-decision (6)

| ID                  | Feature     | Example questions                                                                                                          |
| ------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| `labeled-statement` | controlFlow | "What does the label '{name}:' do in this code?" / "Where did you learn about this feature?"                               |
| `void-operator`     | operators   | "What value does the void operator produce?" / "What happens to the value of the expression after void?"                   |
| `comma-operator`    | operators   | "Which expression in this sequence determines the final value?" / "What happens to the values of the earlier expressions?" |
| `with-statement`    | controlFlow | "What does 'with' do to the scope inside its body?" / "Why is this feature considered problematic?"                        |
| `typeof-operator`   | operators   | "What string does typeof return for this value?" / "What are all the possible strings typeof can return?"                  |
| `optional-chaining` | operators   | "What happens if the value before ?. is null or undefined?" / "How would this line behave without the ?. operator?"        |

### Voice Profile — micro-decision (1, program-level)

| ID              | Feature | Example questions                                                                                                                                                   |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `voice-profile` | reading | "Reading this program as a whole, what words would you use to describe its character?" / "How would the voice change with shorter names and fewer modern features?" |

### Comprehension — Variables (4)

| ID                     | Feature   | Example questions                                                                                                                 |
| ---------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `what-is-declared`     | variables | "What does the line declaring '{name}' do?" / "What value does '{name}' hold after this line executes?"                           |
| `what-value-stored`    | variables | "What value does the expression on the right side of = produce?" / "Describe in plain language what '{name}' ends up storing."    |
| `how-variable-changes` | variables | "What was '{name}' before this line? What is it after?" / "Why does '{name}' need to change at this point?"                       |
| `variable-role`        | variables | "What role does '{name}' play? (counter, accumulator, flag, holder)" / "How does '{name}' change over the course of the program?" |

### Comprehension — Control Flow (7)

| ID                      | Feature     | Example questions                                                                                                                        |
| ----------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `if-branches`           | controlFlow | "What condition must be true for the if-body to execute?" / "Describe in plain language what this if statement decides."                 |
| `while-loop-behavior`   | controlFlow | "What condition keeps this loop running?" / "What changes inside the loop to eventually make the condition false?"                       |
| `for-of-iteration`      | controlFlow | "What collection is being iterated? What does each element represent?" / "How many times will the loop body execute?"                    |
| `else-branch-purpose`   | controlFlow | "When does the else branch execute?" / "What does the else branch handle that the if branch does not?"                                   |
| `describe-condition`    | controlFlow | "Describe this condition in plain English." / "What values make this condition true? What values make it false?"                         |
| `control-flow-boundary` | controlFlow | "What happens on the first iteration? The last? If the collection is empty?" / "Under what condition does this loop execute zero times?" |
| `next-lines`            | controlFlow | "After this statement executes, which statement runs next?" / "Trace the execution path through this structure for a specific input."    |

### Comprehension — Operators (4)

| ID                          | Feature   | Example questions                                                                                                                      |
| --------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `comparison-result`         | operators | "What value does this {operator} comparison produce: true or false?" / "What are the two values being compared?"                       |
| `logical-operator-behavior` | operators | "Does the right side always get evaluated, or only sometimes?" / "What does {operator} require for the overall expression to be true?" |
| `arithmetic-result`         | operators | "What value does this {operator} operation produce?"                                                                                   |
| `operator-swap`             | operators | "What would change if '{operator}' were replaced with a different comparison operator?"                                                |

### Comprehension — Data (2)

| ID                   | Feature | Example questions                                                                                                          |
| -------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `literal-type`       | data    | "What is the type of this value? What is the value itself?"                                                                |
| `null-and-undefined` | data    | "What is the difference between null and undefined in JavaScript?" / "Where does null come from in a typical JeJ program?" |

### Comprehension — User Interaction (3)

| ID                    | Feature         | Example questions                                                                                                      |
| --------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `prompt-return-value` | userInteraction | "What type of value does prompt() return?" / "What happens if the user clicks Cancel?"                                 |
| `alert-effect`        | userInteraction | "What message does the user see when this alert runs?" / "Why is this information shown to the user at this point?"    |
| `confirm-behavior`    | userInteraction | "What value does confirm() return when the user clicks OK? Cancel?" / "What decision is the user being asked to make?" |

### Comprehension — Generic (3, program-level)

| ID                            | Feature | Example questions                                                                                                                                  |
| ----------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `read-aloud`                  | reading | "In one or two sentences, what does this program do for the user?" / "Read the program line by line aloud. What does each line contribute?"        |
| `program-paths`               | reading | "How many different paths can this program take from start to finish?" / "What inputs or conditions determine which path the program follows?"     |
| `audience-perspective-taking` | reading | "Describe what the user experiences when they run this program." / "How does the user's experience differ from what a developer sees in the code?" |

The `voice` group's `string-construction` analyzer detects two shapes (a
`TemplateLiteral` and a `+` `BinaryExpression`) under one registered entry, so
it emits the same question `id` from two code paths — a consumer that tracks
reveal/mastery state must key on the per-mount item index, not on `id` alone
(the id is constant-per-analyzer, not per-occurrence). The five analyzers that
read scope (`caution`, `comprehension-variables`, `consistency`,
`voice-profile`, `voice`) draw declaration facts from `lib/scoping`; every other
analyzer ignores scope and reads only the AST node and source.

## Glossary

**CodeQuestion** — one Socratic observation about a span of source: a stable
kebab-case `id`, an offset `location`, the AST `nodeType` it fires on, a `kind`
(`micro-decision` / `comprehension`), a `category`, a `feature`, `levels`,
`audiences`, `block` cells, `pbsi` levels, a plain-text `context`, and 1–3
register-tagged `questions`. It carries questions, never fixes.

**Point analyzer vs program analyzer** — a **point** analyzer fires on each AST
node during the walk and returns at most one question (a single-node pattern: a
never-reassigned `let`, a ternary, an assignment-in-condition). A **program**
analyzer fires once on the whole AST and returns zero or more (a whole-program
pattern: mixed declaration style, mixed equality, the voice profile). Both
return the same `CodeQuestion`.

**Location** — a question's `location` is an inline `{ start, end }`,
zero-indexed half-open character offsets into the source (`node.start` /
`node.end`). Every parsed node carries offsets unconditionally, so anchoring is
offset-native — no line/column dependence. (No named range type: `location`
inlines its shape, as `classifying`'s `ClassifiedToken` inlines `start`/`end`.)

**MicroDecisionResult** — the discriminated return:
`{ ok: true, questions, analyzerErrors? }` when analysis ran (questions may be
empty; `analyzerErrors` appears only if an analyzer threw), or
`{ ok: false, error: { message, offset? } }` when a required fact stage did not
succeed (see § Public API).

## What lives here

```text
lib/questioning/socratizing/
  README.md               (this — orientation + catalog + public API)
  DOCS.md                 architectural sketch + Mermaid data flow + pedagogical grounding
  types.ts                CodeQuestion, Question, Category, MicroDecisionResult, …
  analyze-micro-decisions.ts   the engine entry (public)
  socratizing-questioner.ts    the family's Questioner envelope over the entry (public)
  create-code-question.ts      factory: builds and freezes each question
  extract-location.ts          offset range from an acorn node
  filter-questions.ts          config-based filtering (post-generation)
  get-child-nodes.ts           pure-acorn child-node walker (the point-analyzer walk)
  analyzers/
    voice.ts  clarity.ts  caution.ts  trap.ts  easter-egg.ts  consistency.ts
    voice-profile.ts  comprehension-variables.ts  comprehension-control-flow.ts
    comprehension-operators.ts  comprehension-data.ts  comprehension-interaction.ts
    comprehension-generic.ts
    collect-nodes.ts  get-identifier-name.ts  get-record.ts   (shared helpers)
  tests/
```

## Public API

```ts
import analyzeMicroDecisions from './analyze-micro-decisions.js';

const result: MicroDecisionResult = analyzeMicroDecisions(embodiment, config?);

import socratizingQuestioner from './socratizing-questioner.js';

socratizingQuestioner.serves(embodiment.facts); // boolean gate
const same: MicroDecisionResult = socratizingQuestioner.ask(embodiment, config?);
```

Pure function. It reads **two** required fact stages: the AST from
`facts.ast.value` (after narrowing `facts.ast.ok`) for the analyzer walk, and
the scope environment from `facts.environment.value` (after narrowing
`facts.environment.ok`) for the declaration view via `lib/scoping`'s
`deriveScopeUsage` — built up-front because filtering is post-generation. Source
comes from `facts.source.value`. If **either** stage failed — the AST (an
unparseable program) or the environment (a guarded embody defect) — it returns
`{ ok: false, error }` drawn from whichever stage's `cause` (message + source
offset). No side effects, no state, works in Node and browsers.

Two public surfaces, one machinery — both equally pure: the envelope's `ask` IS
`analyzeMicroDecisions` — identity, test-pinned — and its `serves` mirrors the
entry's two refusal arms, so serves-false predicts exactly the inputs ask would
refuse.

```ts
// Success — questions is a frozen array (may be empty)
{ ok: true, questions: readonly CodeQuestion[], analyzerErrors?: readonly AnalyzerError[] }

// The AST or the scope environment stage failed
{ ok: false, error: { message: string, offset?: number } }
```

### Configuration

All fields optional; omitting the field (or the whole config) means "include
everything", and every toggle defaults `true` — you list only what to
**remove**. Filtering runs **post-generation**: all analyzers run on the full
AST and scope first, then `filterQuestions` applies the config. (Some questions
need whole-program context — `let-vs-const` must see the full scope to know
whether a `let` is ever reassigned — so filtering cannot happen at walk time.)

```ts
const config: MicroDecisionConfig = {
	// Which kinds of questions to include
	kind: { microDecision: true, comprehension: true },

	// Which JeJ language features to include
	features: {
		variables: true,
		data: true,
		operators: true,
		controlFlow: true,
		functions: true,
		userInteraction: true,
		reading: true,
	},

	// Which pedagogical levels to include (linearized from BLOCK)
	levels: {
		syntax: true, // "the code" — text surface
		semantics: true, // "how it works" — execution
		connections: true, // "relations between parts"
		goals: true, // "purpose and big picture"
		userExperience: true, // "the user's perspective"
	},

	// Which rhetorical audiences to include
	audiences: { developers: true, computer: true, users: true },

	// Which question registers to include
	register: { open: true, pointed: true, comparative: true },

	// Which categories to include
	categories: {
		voice: true,
		clarity: true,
		consistency: true,
		caution: true,
		trap: true,
		easterEgg: true,
	},

	// Source offset range [start, end) — questions overlapping it pass
	range: { start: 0, end: 120 },

	// Max questions returned (0 or omitted = no limit)
	count: 5,
};
```

**Naming notes:** `kind` and `register` are singular (matching
`CodeQuestionKind` and `QuestionRegister`); all other groups are plural.
`categories.easterEgg` is camelCase while the `Category` value is `'easter-egg'`
— the mismatch is deliberate (camelCase object keys, kebab string values). There
is no `only` shorthand: to include only some features, disable the others
explicitly. An all-false group requests _zero_ of that group (distinct from
omitting the group, which includes all).

### Common config patterns

```ts
// Micro-decisions only (style/choice questions)
analyzeMicroDecisions(embodiment, { kind: { comprehension: false } });

// Comprehension only (understanding questions)
analyzeMicroDecisions(embodiment, { kind: { microDecision: false } });

// Only questions overlapping offsets [40, 80)
analyzeMicroDecisions(embodiment, { range: { start: 40, end: 80 } });

// Only control-flow and variable questions
analyzeMicroDecisions(embodiment, {
	features: {
		data: false,
		operators: false,
		functions: false,
		userInteraction: false,
		reading: false,
	},
});

// Remove comparative questions (simplify for beginners)
analyzeMicroDecisions(embodiment, { register: { comparative: false } });

// Limit to 3 questions
analyzeMicroDecisions(embodiment, { count: 3 });
```

## Edge cases

- **A failed required stage** → `{ ok: false, error }` carrying the failing
  stage's message and, when it reports one, its source `offset`. The common case
  is an unparseable program (`facts.ast` failed); a failed `facts.environment`
  (a guarded embody defect on an otherwise-parsed program) takes the same arm.
  The engine never parses; a consumer confirms the facts before calling.
- **A parsed program with no detections** → `{ ok: true, questions: [] }` — an
  empty result is success, not failure.
- **An analyzer that throws** is skipped and its `analyzerId` + message land in
  `analyzerErrors` (present only on the `ok: true` branch — parse failures
  precede every analyzer, so there is nothing to collect there). One bad
  analyzer never crashes the run.
- **Program-level questions span the whole source**, so they overlap any
  `range`. Exclude them by `feature`/`category`, not by range.
- **`range` is offsets, not lines.** It is a half-open `[start, end)` character
  span; a question passes if its `location` overlaps it at all (not full
  containment).

## Consumers

- **The `socratize` lens** (a later stage) renders `questions` as the open /
  Socratic study surface: an overview shelf, per-element cards, and the
  open→pointed→comparative Feedback Ladder. It consumes `analyzeMicroDecisions`
  directly — there is no orchestrator between engine and lens.
- **Family consumers** (a future higher-order questioner) reach the same
  machinery through the `socratizingQuestioner` envelope instead.

## Why this module exists

Traditional linting says what is wrong and how to fix it; this engine asks a
question instead, because learning gain is highest at low-information levels
(Feedback Ladder, EDM 2024) and because a question — unlike a hint — cannot be
clicked through for the answer (hint-abuse resistance). The deeper mechanism is
cognitive dissonance (Reasoning Trajectories, Al-Hossami 2025): a Socratic
question surfaces a contradiction between what the learner assumes and what the
code does, which is the lever for belief updating. Reframing "let vs const" from
right/wrong to "you made a choice here, did you notice?" is the pedagogical
stance of the Welcome to Programming curriculum: comprehension before production
(Read → Trace → Describe → Modify → Write), where most content is programs
learners **study**, not programs they write. The engine is the pure question
source; escalation, fading, and mastery are the consuming environment's. See
[`./DOCS.md`](./DOCS.md) for the research grounding and architecture decisions.

## Conventions

Inherits all conventions from the questioning parent
([`../README.md`](../README.md)), the lib tier
([`../../README.md`](../../README.md)), the package
([`../../../README.md`](../../../README.md)), and the repo's `DEV.md`.
Module-specific rules:

- **Pure-sync only.** No async, no I/O, no side effects (analyzer failures
  become data in `analyzerErrors`, never `console.warn`), no state — the
  environment manages fading and escalation.
- **Questions, never corrections.** The test for every prompt: does it make the
  reader think, or hand them the answer? "Could you combine these with `&&`?"
  fails (it names the fix); "How many paths can this structure produce?" passes.
- **Reads facts, does not parse.** Source, AST, and scope come from the
  embodiment (`facts.source` / `facts.ast` / `facts.environment` via
  `lib/scoping`); the engine never re-parses or re-derives scope.
- **Offset-native locations.** A question's `location` is character offsets from
  `node.start`/`node.end`; there is no line/column anchoring.
- **No AST mutation.** Analyzers walk raw acorn nodes and may run on deep-frozen
  facts; they write no synthetic fields onto nodes.
- **The metadata unions are a cross-consumer contract.** `Category`, `Feature`,
  `QuestionRegister`, and the config shape are shared with the lens; widening
  them is an inter-module change. `Level` and `BlockCell` are the questioning
  parent's ([`../types.ts`](../types.ts)) — widening either is a region-wide
  change affecting every questioner.

## Navigation

- **Parent (the questioning region):** [`../README.md`](../README.md).
- **Region index (the lib tier):** [`../../README.md`](../../README.md).
- **Scope dependency:** [`../../scoping/README.md`](../../scoping/README.md).
- **Architectural sketch + pedagogical grounding:** [`./DOCS.md`](./DOCS.md).
- **JeJ language reference:**
  [`../../../language-levels/jej`](../../../language-levels/jej).
