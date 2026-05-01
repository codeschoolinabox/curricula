# Refactor handoff — directory split + embody implementation

**Status:** roadmap, not yet executed.
**Audience:** the agent (Claude or otherwise) that will perform the
restructure described in [`DOCS.md`](./DOCS.md) § Target shape.
**Lifecycle:** delete this file after the work is done. It exists to
hand off context, not to live forever.

The architectural narrative — *why* this shape — is in
[`DOCS.md`](./DOCS.md). This file is the *how*: ordered steps with
verification criteria. Read DOCS.md first.

## Constraints to honor

- **Three peers + utils.** Final shape is `embody/`, `lenses/`,
  `compose/` under `javascript/`; cross-cutting infra stays at
  `src/lib/utils/` and is imported via the existing `@`-alias.
- **Single writer.** Only `compose/editor/` mutates snippet source.
  Lenses are read-only views.
- **Lens purity.** Lens plugins receive `embodiment` via props. They
  do not import from `embody/` (top) or `compose/` (top). They may
  import from `compose/lib/*` for shared analysis utilities and from
  `@-utils` for generic infra.
- **`embody/lib/*` returns raw data.** No validation/freezing in lib;
  the `embody()` factory does both at the end.
- **`embodiment` is the canonical parameter name** for any function
  taking a Snippet instance.
- **`evaluation` not `execution`.** The phase 3 name is "evaluation"
  throughout docs and canon (already done at this handoff's creation
  time; preserve it).
- **Formatting in compose pre-processing; not validation.** The
  orchestrator formats source on load; it does NOT gate on JEJ-ness.
  Lenses choose what to do with `embodiment.validation.violations`.
- **Dependency rules** (per DOCS.md § Dependency rules) must hold at
  the end. Audit them.

## Ordered steps

### Step 1 — utils stays put

`src/lib/utils/` is at its current location and imported via the
existing `@`-alias. Do **not** create `javascript/utils/`. The new
peers (`embody`, `lenses`, `compose`) import from the existing path.

**Verify:** `@`-alias resolves from each peer; `src/lib/utils/`
unchanged.

### Step 2 — Build `embody/lib/parse/`

Create a fresh acorn wrapper + AST primitives at `embody/lib/parse/` to
replace `lib/parse-old/`. Reference (don't copy) `parse-old/` for prior
art and edge-case coverage.

`parse-old/` is not deleted yet — kept for parity validation in step 6.

**Verify:** `embody/lib/parse/` builds tokens + AST for sandbox-programs
fixtures.

### Step 3 — Move NM-rep modules to `embody/lib/`

```text
lib/ast/             → embody/lib/ast/
lib/validating/      → embody/lib/validating/
lib/formatting/      → embody/lib/formatting/
lib/evaluating/      → embody/lib/evaluating/
lib/scope/           → embody/lib/scope/
lib/parse-old/       → embody/lib/parse-old/   (temporary; deleted at step 6)
```

Update internal imports across moved modules to use the new paths.

**Verify:** TypeScript compiles; existing tests still pass against
moved modules.

### Step 4 — Strip validation/freezing from `embody/lib/*`

The `embody()` factory (built in step 5) handles validation + freeze
centrally. Walk each `embody/lib/*` module and remove any output-side
validation wrappers and `Object.freeze` / `deepFreezeInPlace` calls
that happen at the module's boundary. Keep internal correctness
checks; only strip the boundary defenses.

**Verify:** `embody/lib/*` outputs are plain (mutable, unvalidated)
data; the test suite still passes; no public boundary leaks unfrozen
data (because nothing public consumes raw `embody/lib/*` outputs yet).

### Step 5 — Implement `embody(code)` factory

Build the factory at `embody/index.ts` (or similar) that:

1. Pre-processes source (format only — no validation gate).
2. Calls `embody/lib/parse/` for tokens + AST.
3. Calls `embody/lib/validating/` for `violations` (metadata, not a gate).
4. Calls `embody/lib/scope/` for scope + initialScope.
5. Composes the static analyses (metrics, features, dependencies, hasIo, …).
6. Wires up the streams (parse / create / evaluate stems).
7. Deep-freezes the entwined graph once at the end.

Returns a `Snippet` per [`embody/types.ts`](./embody/types.ts).

**Verify:** `embody(code)` returns a Snippet for valid + invalid JEJ;
`status.{tokenized, parsed, created}` booleans correctly gate field
availability; deep-freeze passes (mutation attempts throw in strict mode).

### Step 6 — Validate new `embody/lib/parse/` against `parse-old/`

Run both over the sandbox-programs corpus. Compare token streams + AST
shapes. When parity is confirmed (ideally automated diff test), delete
`embody/lib/parse-old/`.

**Verify:** parity test passes; `parse-old/` removed; no remaining
imports.

### Step 7 — Refactor analysis libs to take `embodiment`

For each of: `recommender`, `socratizing`, `completing`, `editing`,
`error-interpreting`, `jej-documentation` — change the function
signature to accept an `embodiment` parameter (and any per-call
context). Remove any internal parsing/AST building these modules
currently do; consume the embedded data instead.

**Verify:** each module's tests pass against an `embody(code)` instance
fixture; no `lib/parse-old/` or `lib/ast/` imports remain in these
modules.

### Step 8 — Create `compose/`; move editor concerns

Pull editor concerns out of `study-lenses/` (the editor lens, its UI,
its state hooks) into `compose/editor/`. The editor is no longer a
lens; it's the orchestrator's default home-base view.

**Verify:** `study-lenses/` no longer contains an editor lens;
`compose/editor/` builds and renders the editor; `compose/editor/`
mutates snippet source via the orchestrator.

### Step 9 — Move analysis libs to `compose/lib/`

```text
lib/socratizing/        → compose/lib/socratizing/
lib/jej-documentation/  → compose/lib/jej-documentation/
lib/completing/         → compose/lib/completing/
lib/editing/            → compose/lib/editing/
lib/error-interpreting/ → compose/lib/error-interpreting/
lib/recommender/        → compose/lib/recommender/
```

Update imports across the codebase.

**Verify:** each module accessible from `compose/lib/`; no remaining
imports from old `lib/` paths.

### Step 10 — Move orchestrator + bake formatting pre-processing

Pull the orchestrator out of `study-lenses/` into
`compose/orchestrator/`. Add a formatting pre-processing step in the
orchestrator's load pipeline so all source feeding into `embody(code)`
is consistently formatted.

**Verify:** orchestrator builds; loading any source produces a
formatted snippet; non-JEJ source is NOT rejected (validation is
metadata, not a gate).

### Step 11 — Rename `study-lenses/` → `lenses/`

Rename the directory. Verify each lens is self-contained:

- Receives `embodiment` via props (not via direct embody import)
- Does not import from `embody/` or `compose/` (top)
- May import from `compose/lib/*` and `@-utils`

For any lens that fails the audit, refactor it to receive what it
needs as props from the orchestrator.

**Verify:** dependency-rule audit passes for all lenses; no lens
imports from `embody/` or `compose/` (top).

### Step 12 — Update `index.ts`

Export the orchestrator's `<StudyLenses>` component as the primary
public surface (NOT embody — embody is internal):

```ts
export { StudyLenses } from './compose/orchestrator/index.js';
// Optionally re-export types consumers need to type their snippet props
export type { … } from './compose/orchestrator/types.js';
```

`embody` is **not** exported. Lens authors and curriculum authors don't
import `embody` directly; they consume `<StudyLenses>`, which builds
embodiments internally and distributes them to mounted lenses.

Deprecate the legacy named exports (`run`, `trace`, `validate`,
`parse`, `format`, `checkFormat`) — point each to the `<StudyLenses>`
equivalent in a deprecation warning. Migration window: TBD with the
package owner.

**Verify:** existing legacy callers still work (with warning);
`<StudyLenses snippet={…} />` works as the primary entry; `embody` is
NOT exposed as a public export.

### Step 13 — Verify `javascript/lib/` is empty

After all moves, `javascript/lib/` should contain nothing. Delete the
directory.

**Verify:** `ls javascript/lib/` returns "no such file or directory".

### Step 14 — Update peer READMEs and DOCS

Each peer (`embody/`, `lenses/`, `compose/`) gets its `README.md` and
`DOCS.md` updated to reflect the post-refactor reality. Also update:

- `javascript/README.md` directory-structure table → final shape
- `javascript/DOCS.md` "Current shape" section → drop (it IS the
  current shape now); keep "Locked decisions", "Dependency rules",
  "Categorization rationale", "Open specs"
- Cross-doc links: every reference to the old `lib/*` path is dead;
  fix them all.

**Verify:** front-door test: someone landing in
`javascript/README.md` cold can answer JEJ / NM / embody / lenses /
where-to-next; all cross-doc links resolve.

### Step 15 — Build `sandbox.html`

Out of scope for this refactor agent; flagged as a separate
ticket / different agent. The smoke-test harness at
`javascript/sandbox.html` exercises embody + lenses + compose
end-to-end during development. README + DOCS already mention it as
planned.

### Step 16 — Final dependency-rule audit

Verify (manually or with a lint rule):

- No `lenses/<lens>/*` imports from `embody/` (top) or `compose/` (top)
- No `embody/` imports from `compose/`, `lenses/`, or `embody/lib/`
  → `embody/` (cycle)
- No `embody/lib/*` imports from `embody/` (top), `compose/`, or
  `lenses/`
- No `compose/lib/*` imports from `lenses/`
- No `@-utils` imports from anywhere inside `javascript/`

**Verify:** audit passes; consider committing a CI check that catches
violations going forward.

### Step 17 — Delete this file

Once the work is done, verified, and merged: delete
`REFACTOR-HANDOFF.md`. Its purpose is to bridge the gap between
"plan written" and "plan executed" — once executed, it's noise.

## Notes for the refactor agent

- **Steps 8–11 are the highest-blast.** Editor extraction and
  study-lenses → lenses rename touch many imports. Do them as
  coordinated commits; verify TypeScript at each one.
- **embody implementation (step 5) is non-trivial.** Reference
  [`embody/types.ts`](./embody/types.ts) as the contract; the
  factory's job is to compose `embody/lib/*` outputs into that shape.
  Open specs in [`embody/DOCS.md`](./embody/DOCS.md) § Open specs are
  the ones you'll be locking.
- **AR cycle.** The whole plan was AR-1 reviewed at architectural
  level; substantial implementation choices made during steps 5 and 8
  warrant their own AR check (architectural-sketch challenge for
  embody factory shape, design challenge for compose orchestrator
  shape).
- **Tests.** Existing tests live alongside the moved modules; expect
  them to need import-path updates but mostly to pass unchanged.
  `embody(code)` itself needs new tests built during step 5.
- **`embodiment` parameter name everywhere.** When refactoring lib
  signatures (step 7), use this name consistently — it codifies the
  term across the codebase per the architectural decision.

## Quick reference — final import paths

After the refactor:

```ts
// Inside embody/
import { foo } from './lib/parse/index.js';            // OK
import { deepFreezeInPlace } from '@/utils/...';       // OK

// Inside lenses/parsons/
import type { Snippet } from '../../embody/types.js';  // OK (type only)
import { interpret } from '../../compose/lib/error-interpreting/...';  // OK
import { foo } from '../../embody/index.js';           // ❌ never

// Inside compose/orchestrator/
import { embody } from '../../embody/index.js';        // OK
import { ParsonsLens } from '../../lenses/parsons/...';  // OK
import { recommend } from '../lib/recommender/...';    // OK
```
