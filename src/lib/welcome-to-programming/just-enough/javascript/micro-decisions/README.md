# micro-decisions

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

| Kind | Intent | Skill stage |
| --- | --- | --- |
| `micro-decision` | "What effect does this choice have?" | Modify → Write |
| `comprehension` | "What does this line do?" | Read → Trace → Describe |

Both kinds use observational framing that works whether the reader wrote the
code or is studying it. Both carry the same pedagogical metadata tags.

## Code is like poetry

Poetry analysts and code readers face the same task: understanding a dense,
deliberate text where every word was chosen for a reason.

| Poetry analysis | Code analysis | Framework |
| --- | --- | --- |
| Who is the speaker? | Who wrote this? | Rhetorics: developers |
| Who is the audience? | Who reads/runs this? | Rhetorics: all three |
| What is the tone? | What is the voice? | Voice profile |
| What is the diction? | Naming, operator choice | Micro-decisions: voice |
| What is the structure? | Control flow, blocks | BLOCK model |
| What is the purpose? | Why does this exist? | PBSI: purpose |
| Paraphrase the poem | Describe in plain language | Comprehension questions |
| Read aloud | Read line {n} aloud | Comprehension: read-aloud |

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
question — a lightbulb icon for voice, a yellow flag for caution, a red flag
for trap.

## Pedagogical frameworks

Each question is tagged with metadata from three frameworks:

### BLOCK model (Schulte 2008)

A 12-cell matrix crossing three dimensions (text surface, program execution,
function/purpose) with four levels (atom, block, relation, macro). Linearized
into five consumer-facing levels: `syntax`, `semantics`, `connections`, `goals`,
`userExperience`. The raw BLOCK cells are retained in each question for auditing
and coverage tracking.

### PBSI (Purpose, Behavior, Strategy, Implementation)

The curriculum's four-level framework for understanding programs. Context strings
use PBSI vocabulary naturally — "This **implementation** choice affects..." or
"There are different **strategies** for..." — so learners practice the
vocabulary every time they encounter a question.

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
specific features, disable all others explicitly. Defaults are all-true, so
you only need to list what you want to *remove*.

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
    syntax: true,        // "the code" — text surface
    semantics: true,     // "how it works" — execution
    connections: true,   // "relations between parts"
    goals: true,         // "purpose and big picture"
    userExperience: true // "the user's perspective"
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
  features: { data: false, operators: false, functions: false,
               userInteraction: false, reading: false },
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

| File                                      | Purpose                                        |
| ----------------------------------------- | ---------------------------------------------- |
| `types.ts`                                | All domain types                               |
| `analyze-micro-decisions.ts`              | Main entry point                               |
| `parse-source.ts`                         | Internal parse with fallback chain             |
| `create-code-question.ts`                 | Factory: builds and freezes each question      |
| `extract-location.ts`                     | Location extraction from acorn nodes           |
| `filter-questions.ts`                     | Config-based filtering (post-generation)       |
| `analyzers/voice.ts`                      | 10 micro-decision + voice profile              |
| `analyzers/clarity.ts`                    | 5 micro-decision                               |
| `analyzers/consistency.ts`                | 4 micro-decision (program-level)               |
| `analyzers/caution.ts`                    | 5 micro-decision                               |
| `analyzers/trap.ts`                       | 2 micro-decision                               |
| `analyzers/easter-egg.ts`                 | 6 micro-decision                               |
| `analyzers/comprehension-variables.ts`    | ~10 comprehension (variables)                  |
| `analyzers/comprehension-data.ts`         | ~3 comprehension (data types/literals)         |
| `analyzers/comprehension-operators.ts`    | ~4 comprehension (operators)                   |
| `analyzers/comprehension-control-flow.ts` | ~7 comprehension (if/while/for-of)             |
| `analyzers/comprehension-interaction.ts`  | ~3 comprehension (prompt/alert/console.log)    |
| `analyzers/comprehension-generic.ts`      | ~2+ comprehension (read-aloud, paths)          |
| `tests/`                                  | Unit and integration tests                     |

## Navigation

- [DOCS.md](./DOCS.md) — architecture decisions and rationale
- [../scope/README.md](../scope/README.md) — shared scope tracker (dependency)
- [../validating/README.md](../validating/README.md) — validation module
- [../reference.md](../reference.md) — JeJ language reference
