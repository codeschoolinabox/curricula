# lib/socratizing

A Socratic code analyzer for JeJ programs. Given a snippet's embodiment, returns
**questions — not corrections** — about both the micro-decisions in the code and
the reader's comprehension of it. Each question is a frozen `CodeQuestion`
anchored to an `[start, end)` offset range in the source and tagged with
metadata from three pedagogical frameworks.

Socratizing **asks**; it never grades. It surfaces that a `let` is never
reassigned and asks "what does `let` signal here?" — it never marks the choice
wrong. Grading, mastery, and verdicts belong to a consuming lens; this engine
produces the open, reflective register a human judges.

## What is a micro-decision?

Every line of code contains small choices: `let` vs `const`, a variable named
`x` vs `userInput`, string concatenation vs a template literal, a ternary vs an
if/else. Most programmers make these choices unconsciously. This module makes
them visible by asking what was chosen, what else could have been chosen, and
how the choice affects the code's meaning for different audiences. The concept
comes from the musician-educator Lupe Fiasco's teaching that every syllable in a
bar is a deliberate choice; in code, every keyword, name, operator, and
structure shapes the program's **voice**.

## Two kinds of questions

| Kind             | Intent                               | Skill stage             |
| ---------------- | ------------------------------------ | ----------------------- |
| `micro-decision` | "What effect does this choice have?" | Modify → Write          |
| `comprehension`  | "What does this line do?"            | Read → Trace → Describe |

Both kinds use **observational** framing ("What effect does this choice have…")
rather than authorial-intent framing ("What made you choose…"), so they work
whether the reader wrote the code or is studying it. Both carry the same
pedagogical metadata and share one `CodeQuestion` type — `kind` is the only
distinction, and it is primarily a filtering handle.

## Glossary

**CodeQuestion** — one Socratic observation about a span of source: a stable
kebab-case `id`, an offset `location`, the AST `nodeType` it fires on, a `kind`
(`micro-decision` / `comprehension`), a `category`, a `feature`, `levels`,
`audiences`, `block` cells, `pbsi` levels, a plain-text `context`, and 1–3
`questions` (the register-tagged prompts). It carries questions, never fixes.

**Question / register** — each `CodeQuestion` holds 1–3 `Question`s, each tagged
`open`, `pointed`, or `comparative`. **open** invites broad reflection ("What
does this signal to a reader?"); **pointed** directs attention to a specific
aspect ("How many times does `count` change after line 3?"); **comparative**
asks the reader to weigh an alternative ("How would this read the other way?").
Not every detection carries all three. A learning environment picks which
register to show — the Feedback Ladder (EDM 2024): open for beginners, pointed
as scaffolding, comparative for learners ready to explore alternatives.

**Category** — where a question sits on the style→correctness spectrum: `voice`
(style / finding your voice), `clarity` (readability), `consistency` (the same
concept expressed differently across the program), `caution` (often a bug, could
be intentional), `trap` (almost certainly a bug), `easter-egg` (an undocumented
JeJ feature the learner discovered). An environment can render each differently
— a lightbulb for voice, a red flag for trap.

**Feature** — the JeJ language surface a question targets (`variables`, `data`,
`operators`, `controlFlow`, `functions`, `userInteraction`, `reading`) — the
handle an environment uses to show only what it is currently teaching.

**Level** — the pedagogical zoom, linearized from the **BLOCK model**
(Schulte 2008) 12-cell matrix (text-surface / execution / purpose × atom / block
/ relation / macro) into five consumer-facing names: `syntax`, `semantics`,
`connections`, `goals`, `userExperience`. Each question also keeps its raw
`block` cells for curriculum-team coverage auditing.

**PBSI** — Purpose, Behavior, Strategy, Implementation: the curriculum's
four-level vocabulary. `context` strings use the words naturally ("This
**implementation** choice affects…") so learners practise the vocabulary, not
just read a label.

**Audience** — the three parties source code speaks to at once (`developers`,
`computer`, `users`) — the Rhetorics-of-Programming framing. Each question is
tagged with the audiences it affects.

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
succeed (see § Public API for which).

## Code is like poetry

Poetry analysts and code readers face the same task — understanding a dense,
deliberate text where every word was chosen for a reason. That correspondence is
the spine of the metadata: who is the speaker (who wrote this — developers), who
is the audience (all three), what is the tone (the voice profile), what is the
diction (naming, operator choice — voice micro-decisions), what is the structure
(control flow, blocks — the BLOCK model), what is the purpose (PBSI), paraphrase
the poem (comprehension questions).

## The question catalog (56 analyzers)

Question text uses `{name}`, `{method}`, `{operator}` as placeholders filled at
runtime from the AST. Fifty-six registered analyzers — **48 point** + **8
program** — grouped by category and feature:

| Group (file)               | Kind                     | Count |
| -------------------------- | ------------------------ | ----- |
| voice                      | micro-decision (point)   | 10    |
| clarity                    | micro-decision (point)   | 5     |
| caution                    | micro-decision (point)   | 5     |
| trap                       | micro-decision (point)   | 2     |
| easter-egg                 | micro-decision (point)   | 6     |
| comprehension-variables    | comprehension (point)    | 4     |
| comprehension-control-flow | comprehension (point)    | 7     |
| comprehension-operators    | comprehension (point)    | 4     |
| comprehension-data         | comprehension (point)    | 2     |
| comprehension-interaction  | comprehension (point)    | 3     |
| consistency                | micro-decision (program) | 4     |
| voice-profile              | micro-decision (program) | 1     |
| comprehension-generic      | comprehension (program)  | 3     |

The `voice` group's `string-construction` analyzer detects two shapes (a
`TemplateLiteral` and a `+` `BinaryExpression`) under one registered entry, so
it emits the same question `id` from two code paths — a consumer that tracks
questions must key on the per-mount item index, not on `id` alone. The five
analyzers that read scope (`caution`, `comprehension-variables`, `consistency`,
`voice-profile`, `voice`) draw declaration facts from `lib/scoping`; every other
analyzer ignores scope and reads only the AST node and source.

## What lives here

```text
lib/socratizing/
  README.md               (this — orientation + catalog + public API)
  DOCS.md                 architectural sketch + Mermaid data flow
  types.ts                CodeQuestion, Question, Category, MicroDecisionResult, …
  analyze-micro-decisions.ts   the single public export
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
	kind: { microDecision: true, comprehension: true },
	features: {
		variables: true,
		data: true,
		operators: true,
		controlFlow: true,
		functions: true,
		userInteraction: true,
		reading: true,
	},
	levels: {
		syntax: true,
		semantics: true,
		connections: true,
		goals: true,
		userExperience: true,
	},
	audiences: { developers: true, computer: true, users: true },
	register: { open: true, pointed: true, comparative: true },
	categories: {
		voice: true,
		clarity: true,
		consistency: true,
		caution: true,
		trap: true,
		easterEgg: true,
	},
	range: { start: 0, end: 120 }, // offset range [start, end); questions overlapping it pass
	count: 5, // max questions returned (0 or omitted = no limit)
};
```

**Naming notes:** `kind` and `register` are singular (matching
`CodeQuestionKind` and `QuestionRegister`); all other groups are plural.
`categories.easterEgg` is camelCase while the `Category` value is `'easter-egg'`
— the mismatch is deliberate (camelCase object keys, kebab string values). There
is no `only` shorthand: to include only some features, disable the others
explicitly.

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

## Why this module exists

Traditional linting says what is wrong and how to fix it; this engine asks a
question instead, because learning gain is highest at low-information levels
(Feedback Ladder, EDM 2024) and because a question — unlike a hint — cannot be
clicked through for the answer. Reframing "let vs const" from right/wrong to
"you made a choice here, did you notice?" is the pedagogical stance of the
Welcome to Programming curriculum: comprehension before production (Read → Trace
→ Describe → Modify → Write), where most content is programs learners **study**,
not programs they write. The engine is the pure question source; escalation,
fading, and mastery are the consuming environment's.

## Conventions

Inherits all conventions from [`../README.md`](../README.md),
[`../../README.md`](../../README.md), and the repo's `DEV.md`. Module-specific
rules:

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
  `Level`, `QuestionRegister`, and the config shape are shared with the lens;
  widening them is an inter-module change.

## Navigation

- **Parent peer:** [`../README.md`](../README.md).
- **Scope dependency:** [`../scoping/README.md`](../scoping/README.md).
- **Architectural sketch:** [`./DOCS.md`](./DOCS.md).
