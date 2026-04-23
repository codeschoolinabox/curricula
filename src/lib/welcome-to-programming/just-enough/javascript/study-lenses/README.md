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
| **Lens cache** | Live lens instances keyed by `(lens-name, config-hash)`. At most one entry per key. Detached (not destroyed) when inactive so learner state survives switching. External snippet changes propagate to cached instances via the `onSnippetChanged` hook; lenses that omit the hook surface a stale-state affordance on reattach. |
| **Lens mount** | The live DOM handle returned by `LensModule.lens()`: `el` (detachable HTMLElement), `dispose()` (cleanup on eviction or orchestrator unmount), and optional `onSnippetChanged(snippet)` hook. Framework-agnostic — the lens module is pure TS; the React wrapper mounts `el` into a container div. |
| **Snippet-change hook** | `LensMount.onSnippetChanged(snippet)`. Inversion-of-control: the orchestrator pushes the new snippet into every cached instance when snippet changes via a source other than the active lens itself (transform toggle, Reset, Reset All). The lens decides per-semantic — editor adds an edit (undo continuity); parsons reshuffles; blanks re-blanks; highlight re-renders. Lenses that omit the hook keep their cache entry as-is; on next reattach the orchestrator shows a stale-state affordance. |
| **Event protocol** | Per-instance typed pub/sub ("EventBus"). Separate from the `onSnippetChanged` hook — events carry cross-cutting signals; the hook pushes snippet state directly. Lenses dispatch `snippet-changed`, `exercise-completed`, `config-changed`. The orchestrator dispatches `lens-switched`, `transforms-changed`, `state-reset`, `state-reset-all`, `snippet-name-changed`. |
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
- **Lens caching** — caches live `LensMount` handles (not serialized state),
  keyed by `(lens-name, config-hash)`. At most one entry per key. Switching
  lenses detaches the current `el` and reattaches the cached target. Learner
  state (blanks answers, cursor position, editor undo history) survives
  because the DOM was never destroyed. External snippet changes propagate to
  cached instances via each `LensMount.onSnippetChanged` hook; lenses without
  the hook keep stale state and surface a refresh-or-continue affordance on
  reattach.
- **Lens ↔ orchestrator communication** — two mechanisms:
  - **EventBus** — a per-instance typed pub/sub (pure TS, no DOM, no React
    context). Each orchestrator owns its bus; isolation is structural.
    Lenses dispatch `snippet-changed`, `exercise-completed`, `config-changed`.
    The orchestrator dispatches `lens-switched`, `transforms-changed`,
    `state-reset` (Reset: code-only), `state-reset-all` (Reset All: code +
    initialLens + initialTransforms + cache cleared), and
    `snippet-name-changed`. Event _payload shapes_ live in `types.ts`;
    dispatch/listen mechanics live in `orchestrator/event-bus.ts`.
  - **`onSnippetChanged` hook** — direct push, not pub/sub. The orchestrator
    invokes this hook on every cached `LensMount` whenever the snippet
    changes via a source other than the active lens itself. Separate from
    the EventBus because the cache is an orchestrator-private structure and
    hook invocation is synchronous, targeted, and per-instance.

What the orchestrator does NOT do: exercise-specific rendering (that is the
lens's job), exercise-specific config panels (each lens renders its own), or
code transformation (that is the transform function's job).

### Transforms and lenses

Same surface area but different return types, enforced at the type level:

- **Transforms** — code in, code out. Always continue the pipeline. Never
  produce UI. Examples: format, loop-guard, translate (JS to pseudocode).
- **Lenses** — code in, `LensMount` out (framework-agnostic DOM handle).
  Always terminal. Exactly one per pipeline. Examples: editor, blanks,
  parsons, highlight, trace-table.

A pipeline is structurally typed as `{ transforms: Transform[], lens: Lens }`.
If a fence specifies two lenses (e.g., `js:blanks,parsons`), the plugin errors
at build time.

### Module contracts

```text
TransformModule = {
  name: string
  transform: (code, config?) => string
  config: (overrides?) => TransformConfig
  onFailure?: 'abort' | 'fallthrough'    // default 'abort' at orchestrator
}

LensMount = {
  el: HTMLElement                         // detachable render target
  dispose: () => void                     // cleanup on evict or unmount
  onSnippetChanged?: (snippet) => void    // IoC hook for external updates
}

LensModule = {
  name: string
  lens: (code, config?) => LensMount | Promise<LensMount>
  config: (overrides?) => LensConfig
  recommend: (analysis) => Recommendation[]
}
```

Transforms accept and return strings (not ASTs). `TransformConfig` and
`LensConfig` are tight `Record<string, SerializableValue>` — primitives and
readonly arrays of primitives only, so config hashes are deterministic.
Callbacks and instance state belong on the EventBus or on `LensMount`, not in
config.

Only lenses have `recommend()`. A single lens can suggest multiple versions of
itself at different Block Model cells with different configs — the recommender
does not know lens internals; each lens is self-describing.

Lens construction may be synchronous or asynchronous. Lenses that dynamically
load heavy dependencies (e.g. the editor lens loading CodeMirror language
modules) return `Promise<LensMount>`; lenses that can mount synchronously
(highlight, parsons) return a bare `LensMount`. The orchestrator awaits either
form and shows a lightweight mounting affordance during pending async mounts.

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
- **Runtime library:** [`../lib/README.md`](../lib/README.md) — validate,
  format, run, trace, debug (`api/` is being merged into `lib/`)
- **Master plan:** [`../.planning-handoffs/00-master-plan.md`](../.planning-handoffs/00-master-plan.md)
