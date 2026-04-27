# Plan: Study Meta-Lens Infrastructure

## Context

V2 study lens shipped (143 tests, build green, COOP/COEP headers).
The next milestone: design the Study meta-lens infrastructure — the
recommender system, lens contract, and NM-component enum (via the
syntax tracer at `lib/evaluating/trace/syntax/`) that enable a
spiral learning experience for each code snippet.

## Objective

Build a **research translation platform** (TCER Phase 4 — "Computing
Education Research as a Translational Transdiscipline") where each
lens embodies a CER-backed pedagogical intervention. The platform
accelerates research → practice by making lens development easy for
researchers and lens discovery smart for learners.

> "Study code, not explanations." — denepo.js.org/study-lenses

Core philosophy:

- **Peel-away design** — lenses are training wheels on a bike, not a
  tricycle. They layer support on top of existing dev environments.
  As learners progress they peel away layers to reveal a full-fledged
  environment. Lenses never change how the language or environment
  works.
- **Learner autonomy** — educators *suggest* lenses, but learners are
  always free to choose their own or bypass lenses entirely.
- **All code is content** — any file can be studied with lenses.
- **Web-standard syntax only** — no proprietary formats; programs are
  valid code reusable outside the lens system.
- **Standard dev workflows** — Git, GitHub, IDE for curation.
- **Idea, not implementation** — Study Lenses is a design principle
  adaptable to different environments (browser, IDE, static site).

## Architecture

### Structure under `/just-enough/javascript/`

- **`/study-lenses/`** — the study lenses system. Contains both
  pure TS core and light React wrappers, colocated per module:
  - `/transforms/` — pure TS transform modules
  - `/lenses/` — pure TS lens logic + React wrapper per lens
  - `/orchestrator/` — pure TS core (state, caching, pipeline, event
    handling) + light React wrapper (toolbar, lens area, BrowserOnly)
- **`/lib/analysis/`** — pure TS. Snippet analysis utility. Takes
  JEJ code → returns structured `AnalysisReport`. Consumed by
  the recommender and (future) by socratizing.
- **`/lib/recommender/`** — pure TS. Recommendation engine. Takes
  `AnalysisReport` + registered lenses → returns 3D
  `RecommendationGrid`. No UI concerns.

The `/components/` directory goes away. Reusable UI (toolbar,
recommender panel) is part of the orchestrator's React wrapper — not
separate shared components. Each lens colocates its pure TS logic
with its React wrapper. A CER researcher implements a new lens
in pure TS; the React wrapper is thin boilerplate.

### The WC kit pattern as foundation

The WC study-lenses kit (2025) defines two key patterns we adapt:

**1. Lens module contract:**

```text
LensObject = {
  name: string
  lens: (snippet, config?) => LensOutput { snippet, ui }
  config: (overrides?) => LensConfig
  register: () => string
}
```

**2. Transforms and lenses are separate types:**

Same surface area (name, config, recommend) but different return
types, enforced at the type level:

- **Transforms** — code in → code out. Return `{ snippet }`.
  Always continue the pipeline. Never produce UI.
  Examples: format, loop-guard, translate (JS → pseudocode).
- **Lenses** — code in → component out. Return `{ component }`.
  Always terminal. Exactly one per pipeline.
  Examples: editor, blanks, parsons, highlight, trace-table.

A pipeline is structurally typed as `{ transforms: Transform[],
lens: Lens }` — the type system guarantees zero or more transforms
followed by exactly one lens. No silent termination — if the fence
syntax specifies two lenses, the **plugin errors at build time**.

Pipeline example: `[loopGuard, format] → blanks` → loopGuard
transforms, format transforms, blanks renders.

**3. UI orchestrator manages everything** — the WC kit's `study-bar`
holds code, coordinates children via events, and renders UI
components. Lenses and UI components are separate concerns.

### Parent StudyLenses orchestrator

This is the central architectural piece. The **StudyLenses
orchestrator** is what the plugin injects into code blocks via
`MDXComponents.js` — it IS the `<StudyLenses>` component. It is
NOT a lens itself; it's the orchestrator that renders lenses.

**Responsibilities:**

- **State management** — holds the current snippet state (initialized
  from the `code` prop). The active lens reads from this state. The
  `editor` lens writes to it when the learner edits code. Switching
  lenses preserves state — blanks sees the learner's edits, not the
  original.
- **Toolbar** — always visible regardless of which lens is active.
  Provides: lens-switcher, recommender panel, free-exploration
  dropdown, reset button, and a **snippet name field** (blank input
  where learners name the snippet — naming forces comprehension).
- **Pipeline execution** — when the fence specifies
  `js:loopGuard,format,blanks`, the orchestrator runs transforms in
  sequence then renders the lens. Piping logic lives in the
  orchestrator, not in individual lenses.
- **Transform buttons** — `[loop guard]` and `[format]` as toolbar
  buttons. No transforms dropdown — learners don't construct
  pipelines. Transform composition (translate + parsons = pseudocode
  parsons) happens only via author fences or recommender-built
  pipelines.
- **Lens caching** — orchestrator caches **live component instances**
  (React elements or detached DOM nodes) keyed by content string +
  config hash. No state serialization — the component stays alive
  in memory, just detached from the visible DOM. Switching =
  detach current, reattach cached. Learner state (blanks answers,
  trace entries, cursor position) survives because the component
  was never unmounted. Toggling a transform changes the piped
  content → different cache key → fresh lens. The OLD cache entry
  (for the untransformed code) still exists — switching back
  restores progress. Open question: cache eviction strategy
  (memory trade-off).
- **Inline lens swapping** — switching lenses detaches the current
  lens's DOM (cached alive) and attaches the new lens. Not popup,
  not modal. The recommender panel also replaces the active lens
  area when opened.
- **Editor stays alive** — like all cached lenses, the CodeMirror
  instance is detached (not destroyed) when inactive, preserving undo
  history and cursor position.
- **Event-based communication protocol** — ALL lens↔orchestrator
  communication uses events. This is the general protocol, not
  just for the editor lens:
  - Lenses dispatch: `snippet-changed` (editor updates code),
    `exercise-completed`, `config-changed`
  - Orchestrator dispatches: `lens-switched`, `state-reset`,
    `transforms-changed`
  - Cleaner than prop-drilling, aligned with WC kit's CustomEvent
    pattern, and ready for future data collection hooks.
- **Pure TS core + light React wrapper** — the orchestrator follows
  the same two-layer pattern as lenses. Pure TS core handles state,
  caching, pipeline execution, event handling. React wrapper is a
  thin shell: toolbar rendering, `<BrowserOnly>` boundary, lens
  area mounting.
- **`initialLens`** — the lens the orchestrator renders on first load.
  Defaults to `editor`. Configurable via cascade `defaults`,
  fence suffix (`js:blanks`), or file directive (`@study-lens`).
  Stored in orchestrator state. `activeLens` may differ from
  `initialLens` after the learner switches. Reset does NOT restore
  `initialLens` — it resets code state only; the learner stays in
  whichever lens they chose.
- **Graceful degradation** — handles unknown lenses (falls back to
  editor + console warning), parse errors, SSR safety
  (`<BrowserOnly>` boundary).
- **Recommender integration** — calls the recommender (lazily, on
  panel open) with the **transformed** snippet (not raw) + registered
  lenses. Recommender re-runs when transforms change. The
  recommender can also BUILD pipelines — e.g., suggest a translate
  exercise by composing `translate` transform + `editor` lens.

**What the orchestrator does NOT do:**

- Exercise-specific rendering — that's the lens's job
- Exercise-specific config panels — each lens renders its own
- Code transformation — that's the lens function's job

### Lenses are pure exercise renderers

Each lens only renders its exercise UI + its own config panel. No
toolbar, no lens-switching, no state management, no piping. All
infrastructure is handled by the parent orchestrator.

- `editor` — CodeMirror editor. Reads/writes orchestrator state.
  The default lens when nothing else is configured (what was
  previously called `study`).
- `blanks` — fill-in-the-blank UI. Reads orchestrator state, renders
  blanked code + input fields + difficulty config panel.
- `parsons` — drag-and-drop UI. Reads orchestrator state, renders
  shuffled lines.
- `highlight` — read-only annotated code view.
- `trace-table` — split view: code display + manual trace table +
  [check] button. Runs JeJ tracer on snippet to validate guesses.
  Different configs for steps/values/operators/etc.

### Module contracts

Bare return values — the return type IS the only difference between
transforms and lenses:

```text
TransformModule = {
  name: string
  transform: (code, config?) => string    // code in → code out
  config: (overrides?) => TransformConfig
}

LensModule = {
  name: string
  lens: (code, config?) => Component      // code in → component out
  config: (overrides?) => LensConfig
  recommend: (analysis) => Recommendation[]
}
```

No `register` (vestigial from WC kit's web component system).
No `lang` (JS-only for now — JEJ only). Transforms accept/return
strings (not ASTs — no use case for the added complexity).

Only lenses have `recommend()`. The recommender itself can compose
pipelines (transform + lens) without transforms needing their own
`recommend()` — the composition logic lives in the recommender or
in composed lens definitions.

`recommend()` returns everything needed for the recommender:

```text
Recommendation = {
  lens: string                    // registry key (orchestrator resolves)
  config: LensConfig
  relevance: number               // 0-1 score
  blockModelCell: { level, scope }
  transforms?: string[]           // optional pipeline prefix
  label: string
}
```

`lens` is a string, not a component reference — keeps `recommend()`
in pure TS. The orchestrator resolves names to components via the
registry. `transforms` enables pipeline recommendations (e.g.,
`{ transforms: ['translate'], lens: 'parsons' }` = pseudocode
parsons).

**A single lens can suggest multiple versions of itself** at
different Block Model cells with different configs. The recommender
doesn't know lens internals — each lens is self-describing.

### Composable fence syntax

Code blocks specify pipelines via comma-separated info strings:

````text
```js:loopGuard,format,blanks
````

The **plugin** parses this at build time into a structured pipeline
prop: `{ transforms: ["loopGuard", "format"], lens: "blanks" }`.
If the syntax contains two lenses (e.g., `js:blanks,parsons`), the
plugin **errors at build time** — loud failure, not silent.

The orchestrator executes the pipeline: runs transforms in sequence on
the snippet, then renders the lens with the transformed result.

### Composed lenses as lightweight wrappers

Because lenses are composable, new pedagogical interventions can be
assembled from existing lenses without new transformation logic.
A "pseudocode parsons" lens is just a thin wrapper that pipes
`translate` (JS → pseudocode transform) into `parsons` (render
terminal). A "formatted blanks" pipes `format` into `blanks`.

This is the research translation accelerator — researchers prototype
new interventions by composing existing lenses, not building from
zero. A composed lens is still a `LensModule` with its own name,
`recommend()`, and component. The registry treats it like any other.

### Snippet analysis (lazy)

The snippet analysis runs **lazily when the recommendation view is
opened**, not on every edit. This avoids unnecessary computation
when the learner is just editing code. JEJ-only — simplified
parsing (no need for general JS analysis).

The analysis produces a structured report:

- Parse status (valid AST? syntax errors? which errors?)
- Code length (lines, characters, statements)
- NM components present — which of the 10 syntax-tracer categories
  from `StepCategory` (at `lib/evaluating/trace/syntax/types.ts`)
  appear, detected via static AST mapping (no execution). Unordered
  set; see `01-NM-components.md`.
- Complexity signals (nesting depth, variable count, branch count)
- Semantic tracer layers present (which of the 5 semantic layers in
  the semantic tracer appear — reference only)

### 3D Block Model space

The Block Model of Program Comprehension (Schulte 2008) — explicitly
referenced in the curriculum's exercise-types.md — describes
comprehension across two dimensions. We extend it to three:

1. **Level**: text surface → program execution → function/purpose
2. **Scope**: atoms → blocks → relations → macro
3. **NM components**: the 10 step categories from the syntax tracer's
   `StepCategory` enum at `lib/evaluating/trace/syntax/types.ts` —
   `expression`, `resolve`, `statement`, `scope`, `control-flow`,
   `initialization`, `for-init`, `write`, `emit`, `error`.
   **Unordered** set (no ordinal level is derived). See
   `01-NM-components.md` for the enum contract.

This creates the 3D space through which learners spiral. The
curriculum's exercise-types.md progression (mark syntax → trace →
read → blanks → parsons → compare → specs) is already an
interpreted **1D path through this 3D grid**.

The existing exercise types map onto the Block Model like this:

| Level | Atoms | Blocks | Relations | Macro |
| --- | --- | --- | --- | --- |
| **Text surface** | mark syntax, highlight | blanks (token) | parsons (line order) | copy-type (writeme) |
| **Execution** | trace (operator) | trace (step/values) | variables (scope) | debugger |
| **Function** | read + ask questions | compare programs | describe program | specs |

Not every cell needs filling for a given snippet — only cells
matching the code × available lens suggestions are populated. A
short snippet with no loops won't have trace table options.

The third dimension (NM components) means the same lens can
appear at multiple cells with different configs. E.g., ?blanks
appears configured for keywords in one recommendation, identifiers
in another, operators in another. The spiral in this framing is no
longer an intrinsic ordering of the 3rd dimension (which is now an
unordered set of categories). Instead, the spiral emerges from
(a) lens-configuration variation across snippets — a `blanks` lens
configured for keywords vs. operators vs. control-flow reads
differently at each configuration; and (b) curriculum-author-imposed
ordering of category-filtered recommendations, chosen pedagogically
rather than enforced by the NM model. The recommender surfaces the
options; the author or learner walks the spiral.

### Recommender signals (critical for system design)

The snippet analysis extracts features. Each lens's `recommend()`
consumes them to decide what to suggest:

- **Parse status — three tiers of lens requirements**:
  - **Text-only static** — work on raw text, no parse needed:
    parsons (line shuffling), highlight (annotation), copy-type.
    Always available, even with syntax errors.
  - **AST-dependent static** — need valid parse but no execution:
    blanks (token removal), variables (scope analysis), ask
    (question generation). Syntax errors → relevance 0.
  - **Dynamic** — need valid parse AND execution: run, trace,
    debug, predict-then-compare trace tables. Syntax errors →
    relevance 0.
- **Code length** — shorter snippets can support higher blanks
  difficulty (fewer tokens to reconstruct); longer snippets need
  lower difficulty. Parsons works best around 8-15 lines. Trace
  tables become unwieldy past ~20 lines.
- **NM components present** — which of the 10 syntax-tracer
  categories appear in the code (unordered set): `expression`,
  `resolve`, `statement`, `scope`, `control-flow`, `initialization`,
  `for-init`, `write`, `emit`, `error`. Detected via static AST
  mapping (no execution). NM components detected = the set of step
  categories present in the snippet, detected via static AST
  mapping. Examples: only `expression` + `resolve` → simpler
  lenses; `write` + `initialization` → trace tables high-value;
  `scope` + `control-flow` → variables lens relevant; `emit` →
  execution-focused lenses.
- **Complexity** — nesting depth, variable count, branch count.
  Drives both *which* lenses and *what config* within each lens.
- **Author overrides** — `lenses.json` or `@study-lens` directives
  can constrain which lenses the recommender offers. The free-
  exploration panel is always available regardless of constraints.

A snippet analysis utility produces the feature report; each lens's
`recommend()` declares which features are relevant for it (including
different config options — a given lens may be irrelevant with one
configuration and very relevant with another).

### Two UIs, fully decoupled

**Guided spiral** — the recommender output rendered as a spiral-ish
layout grouped by Block Model level, merging the grouped-cards and
spiral-path concepts. Visually a spiral that maps onto Block Model
levels (connected to the ask-me component's 5-level cognitive model
× language features config panel). Suggests an order but **never
enforces it** — learner can select any option freely.

**Free exploration** — completely separate from the recommender.
A flat list of all available lenses. Learner configures everything
themselves. No guardrails, no relevance filtering. If a bad config
breaks things, that's part of their exploration.

### Author vs. learner control

Author sets the initial lens via fence suffix (`js:blanks`). But
**the learner can always switch** to any lens via the orchestrator's
toolbar. Authors cannot lock learners into a specific lens. This
follows directly from the Study Lenses philosophy of learner
autonomy. Since the parent orchestrator always provides the toolbar
(lens-switcher, recommender, free exploration, reset), every code
block has full access regardless of which lens is currently active.

### Trace tables: predict → compare

Many trace table variants, each zeroing in on a different NM aspect.
The existing three types (steps/values/operators) are the start:

- Steps table → present when code has sequential execution
- Values table → present when code has multiple variable assignments
- Operators table → present when code has complex expressions
- (Future) Control-flow table → present when code has branches/loops
- (Future) Function-call table → present when code has function calls

Each variant is a different config of the trace-table lens — its
`recommend()` suggests which variants match the snippet. This is a
prime example of one lens suggesting **multiple versions of itself**
at different Block Model cells.

Each trace-table lens renders as a **split view**: code display +
manual trace table + [check] button. The learner fills the table
as a prediction exercise, clicks [check], the lens runs the JeJ
tracer on the snippet, and validates their guesses against reality.

Trace table lenses are backlogged with other lens migrations — they
follow the same `LensModule` contract and plug into the orchestrator
like any other lens.

### Engagement event hooks (backlogged)

Lens interface includes event hooks from day 1 (opened, attempted,
completed, time spent, keystrokes, config choices). Nothing consumes
them yet — comprehensive data collection and learner/program
analytics (from keystrokes to exercise preferences) are a separate
initiative to architect later. This separates data creation from
collection so different environments can collect as they choose.

## Prior art inventory

| Source | Location | Key takeaway |
| --- | --- | --- |
| WC study-lenses kit | `0-study-lenses-committee/zz--study-lenses-package--2025-try/study-lenses-wc-kit/` | `LensObject` pattern: `{ name, lens, config, register }`. Pipeline: `pipeLenses()`. Registry: `load()` |
| Old React app | `0-study-lenses-committee/zz--oldd-clauding-and-context-dump/0--study-lenses--it-begins/src` | 24+ lenses. LensMenu dropdown, LensModal popup, StudyBar toolbar. URL-based config. CodeMirror 6. noPasteExtension |
| Sandbox utils | `0---the-big-idea/00--evancole-be/0--snippetry/dump/00-claude-refactoring/0--study-lenses--it-begins/sandbox/src/utils` | Trace table web components (values/steps/operators, Shadow DOM). Loop guards (AST transform). Code execution sandbox |
| Original Node server | `0---the-big-idea/0-study-lenses-package/00-repo--study-lenses` | Plugin loading from folders. Pipeline: sequential lens execution with abort. Resource transform pattern |
| Explorotron | `0-study-lenses-committee/zz--oldd-clauding-and-context-dump/Explorotron` | 11 lenses mapped to PRIMM stages. Study tours (`.study-tour` JSON). Recommendation engine (heuristic scoring). Argument picker, comment slots, pseudo lens |
| Explorotron paper | `explorotron-paper.png` | Malaise & Signer (VUB Brussels). CER-grounded. Figure 2: philosophical base for the meta-lens |
| TCER paper | `computing-education-research-as-a-translational-transdiscipline...png` | Research translation model — Phase 4 = getting CER findings into practice |
| Study Lenses philosophy | `denepo.js.org/study-lenses` | "Study code, not explanations." Peel-away design. Learner autonomy. All code is content. Plugin architecture |
| Ask component | `0--study-lenses--it-begins/dist/static/ask/component/` | 5-level cognitive model (code → how it works → connections → goals → UX) × language features (variables, data, operators, control flow, functions). Configurable AST-based question generation |
| Exercise-types.md | `spiralearn/welcome-to-programming/-1-getting-started/exercise-types.md` | Block Model explicitly referenced. Full exercise progression: mark syntax → trace (3 table types) → read → blanks → quiz → copy-type → translate → compare → parsons → logs → specs |

## Transition steps

### Step 0: DDD documentation + decompose into work stream plans

**First**: write full DDD documentation into the codebase at
`/just-enough/javascript/study-lenses/` and update
`/just-enough/javascript/README.md`. This is NOT just handoff —
this is permanent architecture documentation for all future agents
and humans. The rich context from this planning session belongs in
the codebase, not just in plan files.

**Then**: split into independent work streams, each with a handoff
doc in `.planning-handoffs/` AND a copy of this master plan file:

1. **NM components (3rd dim via syntax tracer)** — the 3rd Block
   Model dimension is the syntax tracer's `StepCategory` enum at
   `lib/evaluating/trace/syntax/types.ts` (10 unordered categories).
   WS1 (`01-NM-components.md`) is small: wire the enum into
   `study-lenses/types.ts`, document the contract. Prior "sub-
   language level progression" framing retired; see
   `01-NM-components.md` for details.

2. **Snippet analysis + recommendation system** — two modules,
   developed together. **Analysis** takes code → returns structured
   feature report (parse status, language features, complexity).
   **Recommender** takes analysis + lens registry → returns 3D
   recommendation structure. Both in `lib/`. Inspired by
   `/socratizing` — and `/socratizing` could later be refactored
   to consume the same analysis (analysis → Socratic prompts, same
   pattern as analysis → lens recommendations).

3. **Lens registry + contract** — the `TransformModule` and
   `LensModule` interfaces + registry. Defines how transforms and
   lenses declare themselves. The **orchestrator** (NOT a lens)
   orchestrates everything — toolbar, state, caching, pipeline
   execution. The `editor` lens is the default lens (CodeMirror),
   rendered inside the orchestrator. Cascade default is
   `defaults.js = "editor"`. `study` is no longer a lens name.

4. **Lens migration** — implementing individual lenses against the
   contract. Parallelizable once #3 is proven with a trial lens.

Each plan gets a handoff doc in `.planning-handoffs/` (organized into
subfolders), containing: context summary, architectural constraints
from this master plan, dependencies on other plans, instruction to
read and follow DEV.md and AGENTS.md, Phase 0 → Phase 2 workflow.

### Step 1: Persist context for agent handoff

Save architectural decisions to memory for resilience across
sessions:

- Parent StudyLenses orchestrator architecture (orchestrator, state
  manager, toolbar, inline lens swapping, pipeline execution)
- `editor` as default lens (what was previously `study`)
- Lenses as pure exercise renderers (no infrastructure concerns)
- Snippet analysis + lens interface pattern (lazy, self-describing)
- 3D Block Model as organizing principle (level × scope × features)
- Research translation platform objective (TCER Phase 4)
- Study Lenses philosophy (peel-away, learner autonomy)
- Key decisions: author can't lock learners, free exploration fully
  decoupled, recommender is pure utility, lenses in `/lenses/` not
  `/components/`, composed lenses via pipeline

### Step 2: NM components via the syntax tracer

**Before the recommender.** The 3rd Block Model dimension is
supplied by the syntax tracer at
`lib/evaluating/trace/syntax/` — specifically the `StepCategory`
enum in `types.ts`. No ordinal sub-language level progression is
defined (the pivot from the prior framing).

The 10 categories (unordered set):

- `expression` — value producers (literal / identifier /
  property / operator / call / template)
- `resolve` — data-flow edges
- `statement` — structural enter/exit
- `scope` — create/leave at block boundaries
- `control-flow` — conditionals, loops, break, continue
- `initialization` — `let` / `const` declarations
- `for-init` — for-loop init bindings
- `write` — reassignments
- `emit` — I/O output
- `error` — runtime errors

A snippet's set of NM components is whichever of these 10
categories appear in it, detected via static AST mapping (no
execution). The recommender uses the set (not an ordered level)
to decide which lenses to surface.

The spiral is achieved via lens-config variation and curriculum-
author-imposed ordering over the unordered set — NOT via ordering
in the enum itself. See the §Spiral discussion above.

WS1 (`01-NM-components.md`) is the thin coordination layer:
re-export / reference `StepCategory` from
`study-lenses/types.ts` and document the contract. The
substantive design lives in the syntax tracer module.

### Step 3: DDD Phase 0 — analysis + recommender (two modules)

Two separate `/lib/` modules, developed together:

**`lib/analysis/`** — snippet analysis utility. Takes JEJ code →
returns `AnalysisReport` (parse status, NM components present,
complexity signals). Pure TS. Consumed by the recommender and
(future) by socratizing.

**`lib/recommender/`** (already created). Takes `AnalysisReport` +
registered lenses → returns `RecommendationGrid` (3D structure
organized by Block Model dimensions). Pure TS.

Phase 0 for each: ubiquitous language, README, types.ts, DOCS.md.

### Step 4: Write full DDD documentation

This goes beyond handoff docs — this is **permanent architecture
documentation** in `/just-enough/javascript/study-lenses/` and
`/just-enough/javascript/README.md`. All the rich context from
this planning session belongs there for all future agents and
humans:

- Module contracts (`TransformModule`, `LensModule`)
- Pipeline model (transforms[] + lens, typed, build-time validated)
- Orchestrator responsibilities (state, toolbar, caching, events)
- 3D Block Model space (level × scope × NM components)
- Research translation platform vision
- Study Lenses philosophy
- NM-components integration (syntax tracer's `StepCategory` as 3rd dim)
- `editor` as default lens, inline swapping, content-keyed caching
- Author sets initial lens; learner always switches via toolbar

Also: remove rendering components from the Docusaurus plugin.
Plugin = build/config/injection only.

### Step 5: Incremental orchestrator + trivial transforms/lenses

**Two sub-steps — pure TS core first, React wrapper second:**

**5a. Pure TS orchestrator core** (testable without React):
- State management (snippet, initialLens/activeLens,
  initialTransforms/activeTransforms)
- Pipeline execution (run transforms → pass to lens)
- Content-keyed lens caching
- Event protocol (dispatch/listen)
- Registry (register transforms + lenses by name)
- Sandbox: test the inner TS interface without React in a vanilla
  sandbox (node/vitest) — verify pipeline, caching, events work

**5b. React wrapper** (thin shell over the TS core):
- Toolbar UI (lens-switcher, [loop guard], [format], recommender
  panel, free-explore dropdown, snippet name field, reset)
- `<BrowserOnly>` SSR boundary
- Active lens area (mounts/unmounts lens components)
- Sandbox: test the React wrapper in the Docusaurus dev server

**5c. Trivial transforms + lenses** (prove the contracts):
- Transforms: `toUpperCase`, `reverse`
- Lenses: `editor` (refactored from V2 study-lens-client),
  `highlight` (Prism/CodeBlock, read-only)

### Step 6: Build out incrementally

Each independent once orchestrator works:

- Analysis utility (`lib/analysis/`)
- Recommender (`lib/recommender/`)
- Spiral/grid recommendation UI
- Complex lenses (blanks, parsons, trace-table, etc.)
- Composed lenses (pseudocode-parsons = translate + parsons)

Parallelizable (one agent per module/lens).

### Backlog

- Refactor `/api` wrappers into their `/lib` components — all
  imports go to `/lib` directly; `/api` functions that aren't
  already in `/lib` are moved there
- Analytics/engagement event collection infrastructure
- Learner modeling (needs accounts/platform)
- Refactor `/socratizing` to consume the shared snippet analysis
- Cache persistence strategy (memory vs. discard trade-off)
- Plugin changes for comma-separated fence syntax + build-time
  pipeline validation
- Remove rendering components from Docusaurus plugin (plugin
  becomes purely build/config/injection)
- `[open in]` external tool integration (jsTutor, jsViz, etc.)
- Program naming / gisting feature

## Architecture diagrams

### System layers

```text
┌─────────────────────────────────────────────────┐
│  Docusaurus Plugin (build-time)                 │
│  remark-study-lenses.ts                         │
│  - transforms ```js:blanks fences               │
│  - embeds sibling .js files                     │
│  - emits <StudyLenses code lens config />        │
│  - parses comma-separated pipelines             │
│    (js:loopGuard,format,blanks)                  │
└─────────────────┬───────────────────────────────┘
                  │ props: code, lens, config
                  ▼
┌─────────────────────────────────────────────────┐
│  StudyLenses Orchestrator (/study-lenses/orchestrator/)│
│  - <BrowserOnly> SSR boundary                   │
│  - state manager (holds current snippet)        │
│  - toolbar (always visible):                    │
│    [lens-switcher] [recommender] [explore] [⟲]  │
│  - pipeline executor (runs transform → terminal)│
│  - inline lens swapping                         │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  Active Lens (swappable)                │    │
│  │                                         │    │
│  │  editor: CodeMirror (reads/writes state)│    │
│  │  blanks: fill-in-blank UI (reads state) │    │
│  │  parsons: drag-and-drop (reads state)   │    │
│  │  highlight: annotated view (reads state)│    │
│  │  trace-table: split view + [check]      │    │
│  │  ...                                    │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

### Container anatomy

```text
┌──────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────┐ │
│ │ TOOLBAR (always visible)                 │ │
│ │ [editor▾] [⛨] [fmt] [🌀] [📋] [name…] [⟲] │ │
│ └──────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────┐ │
│ │                                          │ │
│ │  ACTIVE LENS AREA                        │ │
│ │                                          │ │
│ │  (renders current lens's exercise UI     │ │
│ │   + lens-specific config panel)          │ │
│ │                                          │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ STATE: { snippet, originalCode,                │
│   initialLens, activeLens,                    │
│   initialTransforms, activeTransforms }       │
└──────────────────────────────────────────────┘
```

### Pipeline execution

```text
fence: ```js:loopGuard,format,blanks

orchestrator receives: lens = "loopGuard,format,blanks"
orchestrator parses: pipeline = [loopGuard, format, blanks]

  code ──► loopGuard(code, config)
           │ TRANSFORM
           │ returns string (guarded code)
           ▼
  guarded ──► format(guarded, config)
              │ TRANSFORM
              │ returns string (formatted code)
              ▼
  formatted ──► blanks(formatted, config)
                │ LENS (terminal)
                │ returns Component (<BlanksExercise/>)
                ▼
  orchestrator renders: <BlanksExercise />
  (two lenses in pipeline → build-time error)
```

### Recommender flow

```text
  learner clicks [🌀 Recommend]
           │
           ▼
  ┌─────────────────────────────┐
  │ Snippet Analysis (lazy)     │
  │ lib/analysis/analyze.ts     │
  │                             │
  │ code ──► parse (JEJ-only)   │
  │      ──► detect features    │
  │      ──► measure complexity │
  │      ──► identify NM layers │
  │                             │
  │ output: AnalysisReport      │
  └──────────┬──────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────┐
  │ Recommender (lib/recommender/)          │
  │                                         │
  │ for each registered lens:               │
  │   lens.recommend(analysis)              │
  │     → Recommendation[]                  │
  │                                         │
  │ collect all recommendations             │
  │ organize into 3D Block Model structure  │
  │ (level × scope × language features)     │
  │                                         │
  │ output: RecommendationGrid              │
  └──────────┬──────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────┐
  │ Spiral/Grid UI (orchestrator renders)      │
  │                                         │
  │ surface:  [highlight] [blanks-kw]       │
  │ execution:[trace-steps] [trace-values]  │
  │ function: [ask-questions]               │
  │                                         │
  │ learner clicks one → orchestrator swaps    │
  │ active lens to that recommendation      │
  └─────────────────────────────────────────┘
```

### Folder structure

```text
/just-enough/javascript/
├── /study-lenses/              ← THE STUDY LENSES SYSTEM
│   ├── types.ts                   shared types (TransformModule, LensModule)
│   ├── registry.ts                registration + discovery
│   │
│   ├── /orchestrator/             ← THE PARENT CONTAINER
│   │   ├── core.ts                pure TS: state, caching, pipeline,
│   │   │                          event handling, transform management
│   │   └── study-lens.tsx         light React wrapper: toolbar,
│   │                              lens area, BrowserOnly, recommender
│   │                              panel, free-explore dropdown
│   │
│   ├── /transforms/            ← PURE TS: code in → code out
│   │   ├── to-upper-case/         trivial (trial transform)
│   │   ├── reverse/               trivial (trial transform)
│   │   ├── format/
│   │   ├── loop-guard/
│   │   └── translate/             JS ↔ pseudocode
│   │
│   └── /lenses/                ← PURE TS core + light React wrapper
│       ├── editor/                CodeMirror (default lens)
│       │   ├── lens.ts              pure TS lens function
│       │   ├── config.ts            config factory
│       │   ├── recommend.ts         relevance function
│       │   └── wrapper.tsx          React: CodeMirror mount, Run, Format
│       ├── highlight/             read-only syntax view (trial lens)
│       │   ├── lens.ts
│       │   └── wrapper.tsx          React: Prism/CodeBlock display
│       ├── blanks/
│       ├── parsons/
│       └── trace-table/
│
└── /lib/
    ├── analysis/               ← PURE TS (no React, no DOM)
    │   ├── analyze.ts             snippet → AnalysisReport
    │   └── types.ts               AnalysisReport type
    └── recommender/            ← PURE TS (no React, no DOM)
        ├── recommend.ts           AnalysisReport + lenses → grid
        └── types.ts               RecommendationGrid type
```

## Stress test findings

1. **Default lens resolution**: cascade `defaults.js = "editor"`.
   `study` is no longer a lens name — it's the project/philosophy
   name only. `<StudyLenses>` (plural) is the orchestrator component.
   The orchestrator interprets `study` as "use default = editor."

2. **State writes are asymmetric**: The `editor` lens maintains a
   live bidirectional binding to orchestrator state (reads AND writes).
   All other lenses receive state read-only. The orchestrator provides
   a state setter that lenses CAN call, but most don't. This
   asymmetry is the editor lens's defining characteristic.

3. **Reset scope**: Orchestrator's Reset resets snippet state to the
   original `code` prop. Cached live lens instances for the original
   code may still exist (content+config keyed). Whether Reset also
   discards cached instances is an open design question.

4. **Two-lens pipeline**: `js:blanks,parsons` → plugin errors at
   build time. Transforms and lenses are separate types; the plugin
   validates that a pipeline has zero+ transforms then exactly one
   lens. Loud failure, no silent dropping.

5. **Async cancellation on switch**: Learner switches lens while an
   async operation (Run) is in flight. Since lenses are cached (not
   destroyed), the async operation can complete into the cached
   state. When the learner switches back, the result is there.
   If the code has changed in between, the cache is invalidated
   and the stale result is discarded.

6. **No duplicate Reset**: With the orchestrator owning state, Reset
   moves to the orchestrator toolbar. The `editor` lens keeps only
   Run and Format. No duplication.

7. **Unknown lens name**: Container falls back to `editor` (default)
   with a console warning. Graceful degradation.

8. **Multiple orchestrators on one page**: Each code block gets its own
   orchestrator instance. Zero cross-orchestrator state. Consistent with
   existing per-instance isolation constraint.

## Migration map: current files → proposed structure

| Current location | Target | Notes |
| --- | --- | --- |
| `/lenses/study/study-lens.tsx` | `/study-lenses/orchestrator/study-lens.tsx` | Becomes the orchestrator (refactored) |
| `/lenses/study/study-lens-client.tsx` | `/study-lenses/lenses/editor/wrapper.tsx` | Becomes the editor lens wrapper |
| `/lenses/study/types.ts` | `/study-lenses/lenses/editor/types.ts` + `/study-lenses/types.ts` | Split: editor-specific vs shared |
| `/lenses/study/tests/` | `/study-lenses/orchestrator/tests/` + `/study-lenses/lenses/editor/tests/` | Split by responsibility |
| `/lenses/study/COMPONENT-CONTRACT.md` | `/study-lenses/orchestrator/` | Updated for orchestrator contract |
| `/lenses/study/DOCS.md` | `/study-lenses/orchestrator/DOCS.md` | Updated for orchestrator architecture |
| `/lenses/study/HANDOFF.md` | Archive or delete (superseded by this plan) | |
| `/lenses/README.md` | `/study-lenses/README.md` | Updated for new architecture |
| `/lenses/DOCS.md` | `/study-lenses/DOCS.md` | Updated for new architecture |
| `src/plugins/study-lenses/components/StudyLensMock.tsx` | Remove from plugin (plugin = build only) | |
| `src/theme/MDXComponents.js` | Update import to point to orchestrator | |

## Handoff template (for each sub-plan in `.planning-handoffs/`)

Each handoff doc MUST contain these sections:

```text
# [Work Stream Name]

## Prerequisites
- Read and follow DEV.md and AGENTS.md (at repo root)
- Read the master plan: [path to this plan file]
- Read: [list of specific files to read first]

## Context
- What this work stream does and why
- How it fits in the larger architecture
- What was decided and what's still open

## Dependencies
- What must be complete before this stream starts
- What other streams depend on this stream's output

## Non-negotiable constraints
- [List from master plan: event protocol, pure TS core,
  three-tier classification, build-time validation, etc.]

## Phase 0 checklist (from AGENTS.md)
- [ ] 0.1 Establish ubiquitous language
- [ ] 0.2 Update README.md
- [ ] 0.3 AR-1 design challenge
- [ ] 0.4 Update types.ts
- [ ] 0.5 Write DOCS.md architectural sketch
- [ ] 0.6 AR-2 sketch challenge
- [ ] 0.7 Review & resolve

## Phase 1 increment plan
- [ ] Increment 1: [behavior]
- [ ] Increment 2: [behavior]
- ...

## Phase 2 checklist
- [ ] Full quality checks
- [ ] AR-5 pre-merge review
- [ ] Commit prompt

## Verification
- How to test end-to-end (run, click, observe)
```

## AR synthesis (5 reviews, 2 stress tests)

Resolved:
- **Naming**: `study` = philosophy/project only. `editor` = default
  lens. `<StudyLenses>` = orchestrator. Cascade: `defaults.js = "editor"`.
- **Caching**: live component instances (detached DOM), not
  serialized state. Content+config keyed. No serialize/restore needed.
- **Contract**: stays thin — orchestrator black-boxes lenses. Lenses
  are self-contained plugins. Events are optional.
- **Cross-block**: not needed. Comparison exercises are single-lens
  responsibility (one lens creates variations internally).
- **User testing**: TS core sandboxing provides incremental human
  testing checkpoints before React wrapping.
- **Transforms for learners**: 3 only (loopGuard, format, translate).
  Untested combinations get a warning.
- **TS isolation**: applies to orchestrator core, not lenses. Lenses
  are expected to be UI-heavy.

Still open (deferred to sub-plan DDD):
- Reset semantics (code-only vs. full reset vs. per-lens hook)
- Event mechanism (DOM CustomEvents vs React Context vs EventBus)
- Cache eviction strategy
- Progressive disclosure UX for toolbar (not locked, just not
  prominent — specific UI design TBD)
- `core.ts` decomposition (state, pipeline, cache, events)
- Relevance score semantics (within-lens only? or cross-lens?)
- Predict-then-compare as a reusable pattern vs. per-lens impl

## Open questions (deferred to implementation)

- Grid/spiral exact visual layout for recommender panel (spiral-ish
  merged cards as direction; exact rendering TBD — related to the
  ask-me component's config panel design)
- Which lens to build first as the trial after the orchestrator
- Trace table UX details (split view proportions, [check] button
  flow, comparison display)
- Event payload types and naming convention (kebab vs camelCase)
- Event mechanism (DOM CustomEvents vs EventBus vs other)
- **Reset semantics**: two-level model? Orchestrator Reset resets
  code + dispatches reset event; each lens interprets it (editor
  resets buffer, parsons reshuffles, blanks re-blanks). Separate
  "Reset All" restores initialLens + initialTransforms + code?
  Or one Reset that does everything?
