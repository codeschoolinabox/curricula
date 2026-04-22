# study-lenses

A research translation platform for computing education. The study-lenses system
turns code snippets into interactive learning exercises by composing transforms
(code-to-code) and lenses (code-to-component) into pipelines, recommended by a
3D Block Model grid. Implements TCER Phase 4 — getting computing education
research findings into practice through lens-based pedagogical interventions.

> "Study code, not explanations." — denepo.js.org/study-lenses

## Philosophy

Study Lenses is a design principle, not a product. The core ideas:

- **Peel-away design** — lenses are training wheels on a bike, not a tricycle.
  They layer support on top of existing development environments. As learners
  progress they peel away layers to reveal a full-fledged environment. Lenses
  never change how the language or environment works.
- **Learner autonomy** — educators _suggest_ lenses, but learners are always
  free to choose their own or bypass lenses entirely.
- **All code is content** — any file can be studied with lenses. Programs are
  valid code reusable outside the lens system.
- **Web-standard syntax only** — no proprietary formats. Code fences are
  standard markdown; programs are standard JavaScript.

`study` is the name of this philosophy. It is not a lens name, not a component
name, not a function name. The default lens is `editor` (CodeMirror). The
orchestrator component is `<StudyLenses>` (plural). When the system encounters
`study` as a lens name, it resolves to the default (`editor`).

## Ubiquitous language

The domain vocabulary shared by this module's README, DOCS, types, tests, and
JSDoc. New contributors and agents should lock these terms before writing
any new code.

| Term | Meaning |
| --- | --- |
| **Study Lenses** (capital S/L) | The philosophy and project name. Never a lens name, component name, or function name. |
| **Orchestrator** | The `<StudyLenses>` component (plural). The parent container that owns state, toolbar, pipeline execution, caching, and event routing. NOT a lens. |
| **TransformModule** | `{ name, transform, config }`. Code-to-code, pipeline-continuing. Never produces UI. |
| **LensModule** | `{ name, lens, config, recommend }`. Code-to-component, pipeline-terminal. Exactly one per pipeline. |
| **Pipeline** | `{ transforms: string[], lens: string }`. Zero or more transforms followed by exactly one lens. |
| **Registry** | Static, per-page map of registered transforms and lenses keyed by `name`. Read-only after module-load registration. |
| **Snippet** | The current (mutable) code string held by the orchestrator. The active lens reads this; the `editor` lens writes to it. |
| **Original code** | The immutable `code` prop received at initialization. The target of Reset and Reset All. |
| **Initial lens / active lens** | Configured at initialization (via fence suffix or cascade default) vs. currently rendering. They diverge after a learner switches lenses. |
| **Initial transforms / active transforms** | Same distinction applied to the pipeline's transform list. |
| **Lens cache** | Live component instances keyed by `(lens name, content-at-mount, config hash)`. Detached (not destroyed) when inactive so learner state survives switching. |
| **Content-at-mount** | The snippet the lens was first mounted with. Immutable for the lifetime of a cached instance. Distinct from the current orchestrator snippet, which may change (via editor edits or transform toggles) while a lens is detached. Cache lookup on switch uses the CURRENT snippet against each entry's content-at-mount. |
| **Event protocol** | Per-instance typed pub/sub ("EventBus"). Lenses dispatch `snippet-changed`, `exercise-completed`, `config-changed`. The orchestrator dispatches `lens-switched`, `transforms-changed`, `state-reset`, `state-reset-all`. |
| **Toolbar** | The always-visible controls the orchestrator owns. Lens-switcher, transform buttons, Reset, Reset All, recommender panel, free-exploration dropdown, snippet-name field. |
| **Inline lens swap** | Detach the currently mounted lens, reattach from cache OR mount a fresh instance in its place. No popup, no modal. |
| **Reset** | Restores `snippet = originalCode`; dispatches `state-reset`. Does NOT change `initialLens`, `initialTransforms`, or the cache. |
| **Reset All** | Restores `snippet = originalCode`, `activeLens = initialLens`, `activeTransforms = initialTransforms`; clears the lens cache; dispatches `state-reset-all`. |
| **Snippet name** | Learner-provided label for the current snippet. Not persisted (no accounts yet) but available to engagement event hooks. |

Watch for: "study" as a lens name (never); "lens" referring to the orchestrator
(never); "transform" producing UI (never); "Reset" silently clearing the cache
(that's Reset All).

## Architecture overview

### System layers

```text
Plugin (build-time)                    study-lenses/ (runtime)
remark-study-lenses.ts                 orchestrator + transforms + lenses
- transforms code fences       --->    <StudyLenses code lens config />
- parses comma-separated pipes         - toolbar (always visible)
- emits <StudyLenses> JSX nodes        - pipeline executor
- validates: max 1 lens per pipe       - inline lens swapping
                                       - content-keyed caching
```

The Docusaurus plugin operates at build time: it transforms fenced code blocks
into `<StudyLenses>` JSX nodes and validates pipeline syntax. The runtime system
(this directory) orchestrates transforms, renders lenses, and manages learner
interaction. The two are separated by the plugin's prop contract (`code`, `lens`,
`config`). The plugin also passes a `lang` prop today; the orchestrator accepts
and ignores it — the system is JEJ-only for now. Removing `lang` from the
plugin's emission is backlogged.

### Orchestrator

The `<StudyLenses>` orchestrator is the central architectural piece. It is what
the plugin injects into code blocks via `MDXComponents.js`. It is NOT a lens —
it is the orchestrator that renders lenses.

Responsibilities:

- **State management** — holds the current snippet state (initialized from the
  `code` prop). The active lens reads from this state. The `editor` lens writes
  to it when the learner edits code. Switching lenses preserves state.
- **Toolbar** — always visible regardless of which lens is active. Provides:
  lens-switcher, `[loop guard]` toggle, `[format]` button, recommender panel,
  free-exploration dropdown, **Reset** button (code-only), **Reset All** button
  (full), and a **snippet name field** — a blank input where learners name the
  current snippet. Naming forces comprehension (you must understand code to
  name it well). The name is not persisted (no accounts yet) but is available
  to engagement event hooks. No transforms dropdown — learners don't
  construct pipelines. Transform composition happens only via author fences
  or recommender-built pipelines.
- **Pipeline execution** — runs transforms in sequence, then renders the
  terminal lens with the transformed result.
- **Lens caching** — caches live component instances (not serialized state),
  keyed by content string + config hash. Switching lenses detaches the current
  DOM and reattaches the cached target. Learner state (blanks answers, cursor
  position) survives because the component was never unmounted.
- **Event-based communication (EventBus)** — all lens-to-orchestrator
  communication uses a **per-instance typed EventBus** (pure TS pub/sub, no
  DOM, no React context). Each orchestrator owns its bus; isolation is
  structural. Lenses dispatch `snippet-changed`, `exercise-completed`,
  `config-changed`. The orchestrator dispatches `lens-switched`,
  `transforms-changed`, `state-reset` (Reset: code-only), and
  `state-reset-all` (Reset All: code + initialLens + initialTransforms +
  cache cleared). Event _payload shapes_ live in `types.ts`; dispatch/listen
  mechanics live in `orchestrator/event-bus.ts`.

What the orchestrator does NOT do: exercise-specific rendering (that is the
lens's job), exercise-specific config panels (each lens renders its own), or
code transformation (that is the transform function's job).

### Transforms and lenses

Same surface area but different return types, enforced at the type level:

- **Transforms** — code in, code out. Always continue the pipeline. Never
  produce UI. Examples: format, loop-guard, translate (JS to pseudocode).
- **Lenses** — code in, component out. Always terminal. Exactly one per
  pipeline. Examples: editor, blanks, parsons, highlight, trace-table.

A pipeline is structurally typed as `{ transforms: Transform[], lens: Lens }`.
If a fence specifies two lenses (e.g., `js:blanks,parsons`), the plugin errors
at build time.

### Module contracts

```text
TransformModule = {
  name: string
  transform: (code, config?) => string
  config: (overrides?) => TransformConfig
}

LensModule = {
  name: string
  lens: (code, config?) => Component
  config: (overrides?) => LensConfig
  recommend: (analysis) => Recommendation[]
}
```

Transforms accept and return strings (not ASTs). Only lenses have `recommend()`.
A single lens can suggest multiple versions of itself at different Block Model
cells with different configs — the recommender does not know lens internals;
each lens is self-describing.

### Registry

Transforms and lenses are discovered via a per-page, static **registry** keyed
by module `name`. Registration happens at module-load time (no dynamic runtime
registration). The registry is read-only after initialization. Unknown name
lookups return `undefined` for transforms and fall back to `editor` with a
console warning for lenses.

The registry lives in `registry.ts` — pure TS, no React, no DOM. Registered
modules are deep-frozen snapshots returned from `listTransforms()` /
`listLenses()` / `getTransform(name)` / `getLens(name)`.

### Pipeline model

```text
fence: ```js:loopGuard,format,blanks

code --> loopGuard(code, config) --> format(guarded, config) --> blanks(formatted, config)
         TRANSFORM                   TRANSFORM                   LENS (terminal)
         returns string              returns string               returns component
```

Build-time validation: the plugin parses comma-separated info strings and
rejects pipelines with zero lenses or more than one lens.

### Recommender and 3D Block Model

The recommender is a pure TS utility (no React, no DOM) that takes a snippet
analysis report + registered lenses and returns a 3D recommendation grid.

The Block Model of Program Comprehension (Schulte 2008) describes comprehension
across two dimensions. The study-lenses system extends it to three:

1. **Level**: text surface, program execution, function/purpose
2. **Scope**: atoms, blocks, relations, macro
3. **NM components**: the conceptual model from
   [notional-machine.md](../notional-machine.md) — Values, Bindings,
   Expressions, Statements, Scopes, Coercion, Resolve, Errors, I/O Channels

This creates the 3D space through which learners spiral. Not every cell needs
filling for a given snippet — only cells matching the code and available lens
suggestions are populated.

### Three-tier lens classification

Lenses fall into three tiers based on what they require from the snippet:

| Tier | Requires | Examples | Error behavior |
| --- | --- | --- | --- |
| Text-only static | Raw text (no parse) | parsons, highlight, copy-type | Always available |
| AST-dependent static | Valid parse (no execution) | blanks, variables, ask | Syntax errors: relevance 0 |
| Dynamic | Valid parse + execution | run, trace, debug, trace-table | Syntax errors: relevance 0 |

### Author vs. learner control

Authors set the initial lens via fence suffix (`js:blanks`). Learners can always
switch to any lens via the orchestrator's toolbar. Authors cannot lock learners
into a specific lens — this follows directly from the Study Lenses philosophy
of learner autonomy.

**Two-level Reset model**:

- **Reset** restores code state to the original `code` prop. It does NOT
  restore the initial lens, the initial transforms, or clear the cache — the
  learner stays in whichever lens they chose, with whichever transforms they
  toggled. This is the "undo my edits" button.
- **Reset All** restores code AND initial lens AND initial transforms, AND
  clears the lens cache. This is the "start over from the author's default"
  button. It is structurally heavier and is visually distinct in the toolbar.

## Directory layout

```text
study-lenses/
  README.md              (this file)
  DOCS.md                (architectural sketch)
  types.ts               shared types (TransformModule, LensModule, Recommendation)
  registry.ts            transform + lens registration and discovery

  orchestrator/           THE PARENT CONTAINER
    core.ts                 pure TS: state, caching, pipeline
    event-bus.ts            pure TS: per-instance typed pub/sub
    study-lens.tsx          React wrapper: toolbar, lens area, BrowserOnly
    tests/

  transforms/            PURE TS: code in --> code out
    format/
    loop-guard/
    translate/             JS <-> pseudocode

  lenses/                PURE TS core + light React wrapper
    editor/                CodeMirror (default lens)
      lens.ts                pure TS lens function
      config.ts              config factory
      recommend.ts           relevance function
      wrapper.tsx            React: CodeMirror mount, Run
    highlight/             read-only syntax view
    blanks/
    parsons/
    trace-table/
```

## Links

- **Parent module:** [`../README.md`](../README.md) — just-enough-javascript
- **Notional machine:** [`../notional-machine.md`](../notional-machine.md) — the
  conceptual model lenses help learners build
- **Plugin:** `src/plugins/study-lenses/README.md` — build-time Docusaurus
  plugin
- **Editor factory:** [`../lib/editing/README.md`](../lib/editing/README.md) —
  CodeMirror wrapper consumed by the editor lens
- **Runtime API:** [`../api/README.md`](../api/README.md) — validate, format,
  run, trace, debug
- **Master plan:** [`../.planning-handoffs/00-master-plan.md`](../.planning-handoffs/00-master-plan.md)
