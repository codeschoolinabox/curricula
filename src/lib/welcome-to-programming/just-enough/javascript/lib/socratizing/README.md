# Socratizing

A Socratic code analyzer for JeJ programs. Takes source code and returns
questions — not corrections — about both the micro-decisions in the code and the
reader's comprehension of it.

## What is a micro-decision?

Every line of code contains small choices: `let` vs `const`, a variable named
`x` vs `userInput`, string concatenation vs template literals, a ternary vs an
if/else. Most programmers make these choices unconsciously. This module makes
them visible by asking questions that invite the reader to think about what was
chosen, what else could have been chosen, and how the choice affects the code's
meaning for different audiences.

The concept of micro-decisions comes from the musician and educator Lupe Fiasco,
who teaches that every syllable in a rap bar is a deliberate choice — vowel
stretching, word placement, and rhyme density all shape the "voice" of the
verse. In code, every keyword, name, operator, and structure shapes the
program's voice.

## Two kinds of questions

This module produces two kinds of `CodeQuestion`:

| Kind             | Intent                               | Skill stage             |
| ---------------- | ------------------------------------ | ----------------------- |
| `micro-decision` | "What effect does this choice have?" | Modify → Write          |
| `comprehension`  | "What does this line do?"            | Read → Trace → Describe |

Both kinds use observational framing that works whether the reader wrote the
code or is studying it. Both carry the same pedagogical metadata tags.

## Code is like poetry

Poetry analysts and code readers face the same task: understanding a dense,
deliberate text where every word was chosen for a reason.

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

## Two usage modes

1. **Studying code** (the larger use case) — learners analyze programs written
   by instructors to understand program voice before developing their own
2. **Reviewing own code** — learners analyze their own programs as a bridge from
   production back to comprehension

All questions use observational framing ("What effect does this choice have...")
rather than authorial-intent framing ("What made you choose..."), so the
questions are equally useful in both modes.

## Categories

| Category      | Intent                                                |
| ------------- | ----------------------------------------------------- |
| `voice`       | Style choice — finding your voice as a programmer     |
| `clarity`     | Affects readability or maintainability for readers    |
| `consistency` | Same concept expressed differently across the program |
| `caution`     | Pattern that is often a bug but could be intentional  |
| `trap`        | Almost certainly a bug                                |
| `easter-egg`  | Undocumented JeJ feature the learner discovered       |

The spectrum runs from pure style (voice) to almost-certainly-wrong (trap).
Learning environments can use the category to decide how to present each
question — a lightbulb icon for voice, a yellow flag for caution, a red flag for
trap.

## Pedagogical frameworks

Each question is tagged with metadata from three frameworks:

### BLOCK model (Schulte 2008)

A 12-cell matrix crossing three dimensions (text surface, program execution,
function/purpose) with four levels (atom, block, relation, macro). Linearized
into five consumer-facing levels: `syntax`, `semantics`, `connections`, `goals`,
`userExperience`. The raw BLOCK cells are retained in each question for auditing
and coverage tracking.

### PBSI (Purpose, Behavior, Strategy, Implementation)

The curriculum's four-level framework for understanding programs. Context
strings use PBSI vocabulary naturally — "This **implementation** choice
affects..." or "There are different **strategies** for..." — so learners
practice the vocabulary every time they encounter a question.

### Rhetorics of Programming (three audiences)

Source code communicates with developers (through naming, structure, comments),
the computer (through precise instructions), and users (through program
behavior). Each question is tagged with the audiences it affects, and questions
reference audiences where natural.

## Question registers

Each `CodeQuestion` carries 1-3 questions tagged by register:

- **open** — invites broad reflection ("What does this signal to a reader?")
- **pointed** — directs attention to a specific aspect ("How many times does
  `count` change after line 3?")
- **comparative** — asks the reader to consider an alternative ("How would this
  line read if written the other way?")

Not every question has all three registers — only the ones that are genuinely
useful for that specific detection.

Learning environments implement the Feedback Ladder (EDM 2024) by choosing which
register to show: open questions for beginners (low information, high learning
gain), pointed questions as scaffolding, comparative questions for learners
ready to explore alternatives. The module provides the questions; the
environment manages escalation and fading.

### Expertise reversal

Research (Kalyuga et al. 2003) shows that scaffolding becomes actively harmful
for advancing learners. The `id` field on each question enables learning
environments to track which question types a learner has engaged with and
suppress categories where the learner has demonstrated competence.

## Question catalog (56 analyzers)

Question text uses `{name}`, `{method}`, `{operator}` as placeholders filled at
runtime from the AST.

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

| ID                          | Feature     | Example questions                                                                                                                              |
| --------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `mixed-declaration-style`   | variables   | "Is the mix of 'let' and 'const' intentional throughout this program?" / "Which 'let' declarations could be 'const'?"                          |
| `mixed-string-construction` | data        | "Is there a reason different string construction methods are used?" / "How would the code read if all string building used the same approach?" |
| `mixed-equality`            | operators   | "Is the mix of strict and loose equality intentional?" / "Where is loose equality used, and does it behave differently?"                       |
| `mixed-condition-style`     | controlFlow | "Is the mix of implicit and explicit conditions deliberate?" / "How would the code read if all conditions used the same style?"                |

### Caution — micro-decision (5)

| ID                        | Feature     | Example questions                                                                                                                   |
| ------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `assignment-in-condition` | operators   | "What is the difference between = and === in this position?" / "What value does the assignment produce for the condition to check?" |
| `empty-block`             | controlFlow | "What was the purpose of this block?" / "Was this block left empty intentionally, or is there missing code?"                        |
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
| `next-lines`            | controlFlow | "After this line executes, which line runs next?" / "Trace the execution path through this structure for a specific input."              |

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

## API

### `analyzeMicroDecisions`

```ts
function analyzeMicroDecisions(
	source: string,
	config?: MicroDecisionConfig,
): MicroDecisionResult;
```

Pure function. Takes raw JeJ source code and an optional configuration, returns
a result object. No side effects, no state, works in Node and browsers.

```ts
// Success — questions is a frozen array (may be empty)
{ ok: true, questions: readonly CodeQuestion[], analyzerErrors?: readonly AnalyzerError[] }

// Parse failure — source could not be parsed
{ ok: false, error: { message: string, location?: SourcePosition } }
```

### Configuration

All fields optional. Omitting means "include everything". Set any toggle to
`false` to exclude that group from results.

**Naming note**: `kind` and `register` are singular (matching the type names
`CodeQuestionKind` and `QuestionRegister`); all other groups are plural. The
`categories.easterEgg` key is camelCase while the `Category` value is
`'easter-egg'` — the mismatch is intentional (camelCase for object keys, kebab
for string values).

**No `only` shorthand**: there is no `only` convenience — to include only
specific features, disable all others explicitly. Defaults are all-true, so you
only need to list what you want to _remove_.

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

	// Source line range (1-based, inclusive, post-generation filter)
	range: { start: 1, end: 20 },

	// Max questions returned (0 or omitted = no limit)
	count: 5,
};
```

### Common config patterns

```ts
// Micro-decisions only (style/choice questions)
analyzeMicroDecisions(src, { kind: { comprehension: false } });

// Comprehension only (understanding questions)
analyzeMicroDecisions(src, { kind: { microDecision: false } });

// Only questions about lines 5-10
analyzeMicroDecisions(src, { range: { start: 5, end: 10 } });

// Only control flow and variable questions
analyzeMicroDecisions(src, {
	features: {
		data: false,
		operators: false,
		functions: false,
		userInteraction: false,
		reading: false,
	},
});

// Remove comparative questions (simplify for beginners)
analyzeMicroDecisions(src, { register: { comparative: false } });

// Limit to 3 questions
analyzeMicroDecisions(src, { count: 3 });
```

## Architecture

```text
source string
  -> parseSource(source)                — acorn parse with fallback chain
  -> buildScope(ast)                    — shared scope/ module
  -> walk AST with point analyzers      — per-node question detection
  -> run program analyzers              — whole-program patterns (consistency, voice profile)
  -> filterQuestions(questions, config) — apply config filters post-generation
  -> cap at config.count if specified
  -> deepFreezeInPlace                  — immutable output
  -> MicroDecisionResult
```

The function parses internally. It handles full programs, partial expressions,
and script-mode code (for the `with` easter egg). Unparseable input returns
`{ ok: false, error }`.

## Structure

| File                                      | Purpose                                     |
| ----------------------------------------- | ------------------------------------------- |
| `types.ts`                                | All domain types                            |
| `analyze-micro-decisions.ts`              | Main entry point                            |
| `parse-source.ts`                         | Internal parse with fallback chain          |
| `create-code-question.ts`                 | Factory: builds and freezes each question   |
| `extract-location.ts`                     | Location extraction from acorn nodes        |
| `filter-questions.ts`                     | Config-based filtering (post-generation)    |
| `analyzers/voice.ts`                      | 10 voice micro-decision analyzers           |
| `analyzers/clarity.ts`                    | 5 clarity micro-decision analyzers          |
| `analyzers/consistency.ts`                | 4 consistency (program-level) analyzers     |
| `analyzers/caution.ts`                    | 5 caution micro-decision analyzers          |
| `analyzers/trap.ts`                       | 2 trap micro-decision analyzers             |
| `analyzers/easter-egg.ts`                 | 6 easter-egg micro-decision analyzers       |
| `analyzers/voice-profile.ts`              | 1 voice profile (program-level)             |
| `analyzers/comprehension-variables.ts`    | 3 comprehension (variables)                 |
| `analyzers/comprehension-data.ts`         | 2 comprehension (data types/literals)       |
| `analyzers/comprehension-operators.ts`    | 3 comprehension (operators)                 |
| `analyzers/comprehension-control-flow.ts` | 4 comprehension (if/while/for-of)           |
| `analyzers/comprehension-interaction.ts`  | 3 comprehension (prompt/alert/console.log)  |
| `analyzers/comprehension-generic.ts`      | 2 comprehension (program-level: read-aloud) |
| `tests/`                                  | Unit and integration tests                  |

## Navigation

- [DOCS.md](./DOCS.md) — architecture decisions and rationale
- [../scope/README.md](../scope/README.md) — shared scope tracker (dependency)
- [../validating/README.md](../validating/README.md) — validation module
- [../reference.md](../reference.md) — JeJ language reference
