# micro-decisions — Architecture & Decisions

## Why questions, not corrections

Traditional linting tells you what's wrong and how to fix it. This module asks
questions instead. The research basis:

- **Feedback Ladder** (EDM 2024): Learning gain diminishes as more information
  is revealed. Questions operate at low-information levels where learning is
  highest.
- **Reasoning Trajectories** (Al-Hossami 2025): Socratic questions lead to
  cognitive dissonance — a contradiction between what the learner assumes and
  what the code does — which is the mechanism for belief updating.
- **Hint abuse resistance**: Students can click through traditional hints to get
  answers without thinking. Questions require active engagement.

The test for every question: does it make the reader think, or does it give them
the answer? "Could you combine these checks with `&&`?" fails — it names the
fix. "How many different paths can this nested structure produce?" passes — it
invites tracing.

## Why micro-decisions, not just "hints"

A hint implies something is wrong. A micro-decision implies a choice was made.
Many micro-decisions are between equally valid alternatives — `let` vs `const`
when a variable is never reassigned, a ternary vs an if/else for a simple
conditional. Neither is wrong. The question is whether the choice was
intentional.

This reframes coding from "right/wrong" to "you made a choice here, did you
notice?" — which is the pedagogical stance of the Welcome to Programming
curriculum.

## Why two kinds of questions share one type

Micro-decision and comprehension questions serve different skill stages but are
deliberately the same `CodeQuestion` type. The reasons:

1. **Same pedagogical contract** — both are Socratic (questions, not
   corrections), both carry BLOCK/PBSI/audience metadata, both are frozen
   immutable values
2. **Same filtering** — consumers filter by `kind` just like any other config
   dimension; the filtering logic has no special cases
3. **Shared infrastructure** — same factory (`create-code-question.ts`), same
   freeze, same result type
4. **Unified display** — a learning environment can render both kinds in a
   single panel, interleaved by source location

The `kind` field is the only distinction. It's primarily a filtering handle —
the questions themselves are what matter.

## Why study mode is the larger use case

The curriculum follows a comprehension-before-production pedagogy: Read -> Trace
-> Describe -> Modify -> Write. Most of the content consists of programs
learners study, not programs they write. Questions on study programs help
learners understand program voice before developing their own.

This also applies to Chapter 4's AI integration: when AI writes code for a
learner, questions become the tool for taking ownership of code you didn't write
yourself.

All questions use observational framing ("What effect does this choice have...")
rather than authorial-intent framing ("What made you choose...") to work in both
modes.

## The three pedagogical framework tags

### BLOCK model

Each question is tagged with one or more BLOCK cells (Schulte 2008). This
serves two purposes:

1. **For the learning environment**: Filter questions by BLOCK cell to target
   specific comprehension areas. If a learner struggles with `atom x execution`
   (what single statements do at runtime), show more questions from that cell.
2. **For the curriculum team**: Audit question coverage across all 12 cells.
   Gaps indicate areas where the tool doesn't yet support comprehension.

The consumer-facing `levels` field linearizes the 12-cell matrix into five
named levels: `syntax`, `semantics`, `connections`, `goals`, `userExperience`.
The raw `block` cells are retained in each question for auditing. Consumers
filter by `levels`; the curriculum team audits by `block`.

### PBSI vocabulary

Context strings use Purpose, Behavior, Strategy, and Implementation naturally.
This is not labeling — it's vocabulary practice. When a learner reads "This
**implementation** choice affects how other developers read the code," they're
reinforcing their understanding of what "implementation" means in the PBSI
framework.

The distinction matters most for strategy-level micro-decisions like input
validation approaches (while-head vs boolean-flag vs while-true-break), where
the question explicitly names the strategy level.

### Rhetorical audiences

Tagging each question with affected audiences (developers, computer, users)
reinforces the curriculum's core framework: source code communicates with three
audiences simultaneously.

Questions reference audiences where natural: "Does this log communicate
something to the **user**, or is it for **developers** debugging?" This
distinction helps learners see that the same line of code can serve different
audiences.

## Category design

The six categories form a spectrum:

```text
voice --- clarity --- consistency --- caution --- trap --- easter-egg
  |                                                           |
  pure style                                          exploration
```

**voice** and **easter-egg** are about expression — finding your voice, exploring
the language. **clarity** and **consistency** are about communication — making
code readable and coherent. **caution** and **trap** are about correctness —
patterns that are likely mistakes.

Easter eggs get their own category rather than being folded into voice because
they involve undocumented features. The learner is exploring territory not
covered by reference.md, which is qualitatively different from choosing between
two documented alternatives. However, most easter eggs (labels, void, comma
operator) are fundamentally voice choices — they offer unique expressive
possibilities. `eval` is the exception: it can be creative voice or dangerous
mistake depending on intent.

## Voice profile

The voice profile is a program-level analyzer that characterizes the overall
"personality" of a program along five dimensions:

1. **Verbose <-> Terse** — naming, line length, expression complexity
2. **Modern <-> Traditional** — JavaScript idiom adoption
3. **Linear <-> Structured** — control flow organization
4. **Consistent <-> Eclectic** — variation across choices
5. **Expressive <-> Mechanical** — communication intent

Research basis: Caliskan-Islam et al. (2015) showed that even when programmers
solve the same problem, their code is stylistically distinguishable via AST
features, naming patterns, and control flow preferences. Stegeman et al.
(2014/2016) developed a code quality rubric with dimensions (decomposition,
expression, naming, layout, flow, idiom) that map directly to voice. Buse &
Weimer (2010) showed that identifier naming, expression structure, and program
organization predict readability — these are the features we measure.

The voice profile produces a macro-level question with `kind: 'micro-decision'`
and questions like "Reading this program as a whole, what words would you use
to describe its character?" This invites reflection on the aggregate effect of
many small choices.

## Analyzer architecture

### Point analyzers vs program analyzers

**Point analyzers** fire on individual AST nodes during the tree walk. They
detect single-node or small-cluster patterns: a `let` that's never reassigned, a
ternary expression, an assignment in a condition. They receive the current node,
the scope analysis, and the source text.

**Program analyzers** fire once after the walk completes. They detect
whole-program patterns: inconsistency in declaration style, mixed string
construction methods, the voice profile. They receive the full AST, scope
analysis, and source text.

Both return the same `CodeQuestion` type. The main function combines their
results into a single flat array.

### Error isolation

Each analyzer is called inside a try-catch. If one analyzer throws, it's
skipped and its error is collected into the `analyzerErrors` field of the
result. The remaining analyzers continue. This keeps the function pure — no
`console.warn` side effects — while giving consumers visibility into what failed
when needed.

`analyzerErrors` appears only on the `{ ok: true }` branch, never on
`{ ok: false }`. Parse failures occur before any analyzers run, so there are
no analyzer errors to collect in that case.

### Why one file per category

Related analyzers share detection logic (e.g., all voice analyzers need to
inspect declaration kinds, all caution analyzers check specific AST patterns).
Grouping them by category keeps related code together while maintaining a
manageable number of files. Each file exports the category's analyzers as named
functions with a single default export that returns the combined array.

## Prior art integration

### From `ask/` (open-ended questions)

The `ask/` module provided the config pattern (feature + level boolean toggles),
the levels 1–5 system (mapped to `syntax`/`semantics`/`connections`/`goals`/
`userExperience`), and ~50 comprehension question templates. The comprehension
analyzers in this module are adapted from those templates.

Key adaptations for JeJ:

- **Dropped**: all function-declaration questions (JeJ has no function
  declarations, parameters, or arrow functions), switch/case, do-while, for-in,
  array/object literals
- **Adapted**: function-call questions → method-call questions (`.toLowerCase()`,
  `.includes()`, `console.log()` etc.)
- **Kept**: variable questions, operator questions, if/while/for-of questions,
  data literal questions, user interaction questions

Level mapping from `ask/` to this module:

- Level 0 (some variable questions) → `syntax`
- Level 1 → `syntax`
- Level 2 → `semantics`
- Level 3 → `connections`
- Level 4 → `goals`
- Level 5 → `userExperience`

### From `qlcjs`

The `qlcjs` MCQ generator demonstrated the prepare/generate architecture and
the pattern of question preparers returning lazy generators. This module uses
a simpler eager model (analyzers return results directly), but the category-
as-file-grouping pattern and the type discipline around question shapes are
inherited from qlcjs.

### From `hinting--prior-art-for-inspiration/`

The prior warning collector flagged beginner mistakes. Every detection from the
prior art appears here as a caution, trap, or easter-egg question, reframed as
a question rather than a warning. The AST walking pattern and the node-type
dispatch approach are adapted from `collect-warnings.ts`.

## Filtering architecture

Filtering runs post-generation. All analyzers run on the full AST/scope first,
then `filterQuestions(questions, config)` applies the config.

The reason: some questions about specific lines need context from outside those
lines. For example, the `let-vs-const` question asks "is this `let` ever
reassigned?" — which requires seeing the full scope, not just the declaration
line. Filtering at walk time would deny analyzers the context they need.

### Filtering logic in `filterQuestions`

`CodeQuestion` fields fall into two categories for filtering:

**Single-value fields** (`kind`, `feature`, `category`): the question's single
value must appear in the enabled set. Example: if `features.controlFlow` is
`true` and `features.variables` is `false`, only questions whose `feature` is
`'controlFlow'` (or any other enabled feature) pass.

**Multi-value fields** (`levels`, `audiences`): the question's array must
*intersect* the enabled set — at least one of the question's values must match
an enabled toggle.

```text
For each CodeQuestion:
  1. kind filter (single-value):
     question.kind must be enabled in config.kind
  2. feature filter (single-value):
     question.feature must be enabled in config.features
  3. levels filter (multi-value):
     question.levels must intersect at least one enabled level in config.levels
  4. audiences filter (multi-value):
     question.audiences must intersect at least one enabled audience in config.audiences
  5. categories filter (single-value):
     question.category must be enabled in config.categories
     NOTE: map question.category 'easter-egg' -> config.categories.easterEgg
  6. range filter:
     question.location must overlap the configured range (any overlap, not full containment)
     NOTE: program-level questions (e.g. voice profile) span the full source and will
     overlap any range — this is intentional. Use feature filtering to exclude them.
  7. register filter (prunes individual entries within a CodeQuestion):
     remove entries from question.questions whose register is disabled
     -> if ALL entries are pruned, remove the entire CodeQuestion

After filtering:
  8. Sort by source location (ascending start line, then start column)
  9. Cap at config.count if config.count > 0
```

**AND between groups**: all applicable filters must pass independently.
**OR within groups**: within a multi-value field, any match is sufficient.

**All-false group**: if a consumer explicitly disables all toggles in a group
(e.g., `features: { variables: false, data: false, ... }`), NO questions pass
that group — the result is an empty array. This is different from *omitting*
the group entirely (which means "no filter, include all"). An all-false group
is a valid way to request zero questions.

**Omitted group**: if a config key is absent (e.g., `config.levels` is
`undefined`), that filter is skipped entirely — all questions pass it.
Individual omitted toggles within a group default to `true`.

## Parsing strategy

The entry reads source and AST from the embodiment — it does not parse
internally. Parsing is the responsibility of `embody()`.

```text
embodiment.status.parsed === false  →  { ok: false, error }
embodiment.status.parsed === true   →  read embodiment.parse.ast.acornNode → { ok: true, questions }
```

`{ ok: false }` uses the embodiment's own `errors.message` (and
`errors.loc.start` as `location` when present). `{ ok: true }` runs all
analyzers against the AST. In Phase A, the mock AST has `body: []` so all
analyzers return zero questions — graceful degradation, not a crash.

`parse-source.ts` is retained only for its own unit test
(`tests/parse-source.test.ts`). The analyzer test files do not import it —
they call `acorn.parse()` directly via their own local helpers. The production
entry does not call it after the Step 7 sweep. Deletion (along with the
self-test) is deferred to a follow-up commit.

**Phase B followup:** when real parsing is wired into `embody()`, the analyzer
test files should migrate their local `acorn.parse()` helpers to `embody(source)`
to stay in alignment with the production path. Until then, the per-analyzer
coverage remains accurate (real AST, real source, direct analyzer calls).

## What this module deliberately does NOT do

- **No validation** — that's `validating/`'s job. This module assumes valid JeJ.
- **No formatting** — that's `formatting/`'s job.
- **No execution** — this is static analysis only.
- **No fix suggestions** — it asks questions, never tells the learner what to
  change.
- **No side effects** — parse failures return `{ ok: false }`, analyzer errors
  go into `analyzerErrors`, no `console.warn`.
- **No state** — pure function, no tracking of past interactions. The learning
  environment manages fading and escalation.
