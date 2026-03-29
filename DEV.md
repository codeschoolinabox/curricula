# Developer Guide

Internal architecture, conventions, and implementation details for contributors.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Codebase Conventions](#codebase-conventions)
- [Directory Structure](#directory-structure)
- [Development Workflow](#development-workflow)
- [Testing Strategy](#testing-strategy)
- [Incremental Development Workflow](#incremental-development-workflow)
- [Linting Conventions](#linting-conventions)
- [Module Boundaries](#module-boundaries)
- [Code Quality Anti-Patterns](#code-quality-anti-patterns)
- [VS Code Setup](#vs-code-setup)

## Architecture Overview

See [README.md § Architecture](./README.md#architecture) for an overview.
Detailed conventions and module boundaries are documented in sections below.

## Codebase Conventions

> This codebase is designed to be accessible for first-time contributors and
> less experienced developers. Conventions prioritize learnability,
> debuggability, and consistency over brevity or "idiomatic JS."

### Conventions Summary

| Situation                      | Convention                                                       |
| ------------------------------ | ---------------------------------------------------------------- |
| Non-trivial function           | Named `function` declaration                                     |
| Inline callback (trivial)      | Arrow OK: `user => user.id`, `n => n > 0`                        |
| Arrow assigned to variable     | **Not allowed** — use named `function` declaration               |
| Arrow with body block `{}`     | **Not allowed** — use named `function` declaration               |
| Callback (non-trivial)         | Extract as named `function`, pass by name                        |
| Hoisting below call site       | Encouraged for readability                                       |
| `this` keyword                 | **Banned** (functional codebase)                                 |
| Classes                        | **Banned** (exception: error classes in `/errors`)               |
| Error handling                 | Use base error class for catch-all                               |
| Mutable closures               | **Banned**                                                       |
| Immutable closures             | OK (e.g. currying over cached config)                            |
| Method shorthand in objects    | Allowed (`{ process() {} }`)                                     |
| Variable bindings              | Prefer `const`; `let` only when reassignment needed              |
| Export                         | Define first, `export default` at bottom                         |
| Import paths                   | Always include `.js` extension                                   |
| Multiple things from one file  | Split into separate files                                        |
| Destructured object params     | Default empty object: `{ ... } = {}`                             |
| Boolean functions              | Prefix with `is`/`has`/`can`/`should`                            |
| Return values (objects/arrays) | Deep freeze (clone+freeze for external, freeze-in-place for own) |

### 1. Export Conventions

**CRITICAL**: All internal files use default-only exports with named-then-export
pattern.

```javascript
// ✅ CORRECT - Named function, then export at bottom
function myFunction() { ... }

export default myFunction;

// ✅ CORRECT - Constants follow same pattern
const MY_CONSTANT = Symbol('description');

export default MY_CONSTANT;

// ❌ WRONG - Inline default export (poor tooling support)
export default function myFunction() { ... }

// ❌ WRONG - Named exports in internal files
export function myFunction() { ... }
```

**NO BARREL FILES**: Import directly from the source file. No internal
`index.ts` re-exports.

```javascript
// ✅ CORRECT - Direct imports
import createConfig from './configuring/create.js';
import applyPreset from './configuring/apply-preset.js';

// ❌ WRONG - Barrel imports
import { createConfig, applyPreset } from './configuring/index.js';

// ✅ EXCEPTION - Public API only
import { doThing } from '@study-lenses/this-package';
```

**Rationale**:

- Explicit dependency graph (no indirection)
- Better tree-shaking
- No circular dependency traps
- IDE "go to definition" works directly
- Tooling gets function names from declarations
- Simpler mental model for contributors

### 2. Type Location Convention

Types live **with their module**, not in a centralized location.

| Location                | Purpose                               |
| ----------------------- | ------------------------------------- |
| `src/<module>/types.ts` | Types for that module                 |
| `src/index.ts`          | Re-exports consumer-facing types flat |

**Rules:**

1. Each module has its own `types.ts` (if needed)
2. Types stay with the code they document (transparency, portability)
3. Internal code imports directly from module's `types.ts`
4. `/src/index.ts` re-exports consumer-facing types (flat, no namespace)

**Rationale:**

- Transparency: Types are discoverable where they're used
- Portability: Renaming/moving folders doesn't break unrelated code
- Consistency: Parallels `/src/index.ts` as entry point for code

### 2.5. When `any` is OK

The `@typescript-eslint/no-explicit-any` rule is set to **warn** (not error)
because `any` has legitimate uses. All `any` usage MUST be justified during code
review.

**Acceptable uses:**

1. **Dynamic runtime values** — data parsed from JSON, user input, or eval
   results
2. **Untyped library boundaries** — wrapping third-party libraries without type
   definitions
3. **Generic utilities** — functions operating on arbitrary structures
4. **Test fixtures** — intentionally breaking types to test error handling
5. **Stub implementations** — temporary mock data during TDD cycles

**Unacceptable uses:**

- Business logic with known types (use proper interfaces)
- Public API parameters (force callers to use correct types)
- Return values from internal functions (be explicit)
- Lazy typing ("I don't know the type so I'll use `any`")

**Code review requirement:** Every `any` type must have a comment explaining WHY
it's necessary.

### 2.6. Using `eslint-disable` Comments

`eslint-disable` comments are a code review tool, NOT a development shortcut.

**Rules:**

1. **Never add `eslint-disable` in initial implementation** — fix the violation
   instead
2. **Only add during code review** — after discussing with reviewer
3. **Require justification comment** — explain WHY the rule doesn't apply

**Format:**

```typescript
// eslint-disable-next-line rule-name -- Justification for disabling
const problematicCode = ...;
```

### 3. Object-Threading Pattern

Functions accept and return objects with predetermined keys:

```javascript
// Input object with known keys
const input = { code: 'let x = 5', config: expandedConfig };

// Function adds new keys while preserving input
const output = process(input);
// Returns: { code, config, result }
```

**Benefits**:

- Explicit data flow
- Easy debugging (inspect objects between stages)
- Composable pipeline stages
- No hidden state

### 4. Pure Functional Approach

- No mutations — always return new objects
- No side effects in core functions
- State passed explicitly through parameters
- Deterministic behavior for testing
- Prefer `const`; use `let` only when reassignment is genuinely needed (loop
  counters, accumulators)

### 5. Error Handling Strategy

**Error Classes**: Library errors extend a base error class. This enables
catch-all handling while preserving specific error discrimination via
`instanceof`.

```javascript
// Catch-all for any library error
try {
	const result = await doThing(input);
} catch (error) {
	if (error instanceof BaseError) {
		showUserError(error.message); // Library error - handle gracefully
	} else {
		throw error; // Not ours - propagate
	}
}
```

**General Patterns**:

```javascript
// Graceful degradation for config errors
if (invalidConfig) {
	console.warn('Invalid config value, using default');
	return defaultValue;
}

// Fail fast for critical errors (use specific error classes)
if (!input) {
	throw new ArgumentInvalidError('input', 'Input is required');
}
```

### 6. Function Conventions

Use **named `function` declarations** by default. Arrow functions (`=>`) are
allowed only as short, single-expression forms with implicit return.

#### Arrow Functions: When They're Fine

Arrow functions are allowed **only** as anonymous inline callbacks when **all**
of these hold:

1. **Single expression** with implicit return (no `{` body block)
2. **At a glance** — you can read it without slowing down
3. **Inline as a callback** — not assigned to a variable

```javascript
// ✅ — trivial transforms and predicates, inline
users.map((user) => user.id);
items.filter((item) => item.enabled);
values.some((v) => v === null);
amounts.reduce((sum, n) => sum + n, 0);
```

```javascript
// ❌ — assigned to a variable: use a named function declaration
const extractId = (user) => user.id;

// ❌ — has a body block: use a named function declaration
const process = (config) => {
	const expanded = expandShorthand(config);
	return applyPreset(expanded);
};
```

#### Named `function` Declarations: Everything Else

```javascript
// ✅ — named function declaration
function processConfig(config) {
	const expanded = expandShorthand(config);
	return applyPreset(expanded);
}
```

#### Callbacks Longer Than a Quick Expression

When a callback grows beyond a simple expression, **extract it** as a named
`function` declaration and pass the name into the chain.

```javascript
// ✅ — extracted named functions, passed by name
const results = users.filter(isActiveAdmin).map(formatUserSummary);

function isActiveAdmin(user) {
	return user.status === 'active' && user.role === 'admin' && !user.suspended;
}

function formatUserSummary(user) {
	return {
		id: user.id,
		display: `${user.firstName} ${user.lastName}`,
		since: user.createdAt.toISOString(),
	};
}
```

**Why?**

- `users.filter(isActiveAdmin)` reads like English
- Named functions show in stack traces
- Extracted functions are independently testable
- Forces naming, which clarifies intent

#### Hoisting for Readability

Defining a `function` below where its name is first used is encouraged when it
improves readability — high-level flow at the top, implementation details below.

```javascript
// ✅ — main flow reads top-down, details defined below
const pipeline = buildPipeline(config);
const result = executePipeline(pipeline, code);
return formatOutput(result);

function buildPipeline(config) { ... }
function executePipeline(pipeline, code) { ... }
function formatOutput(result) { ... }
```

### 7. No `this` Keyword

This is a functional codebase. The `this` keyword is banned.

**Exception**: Low-level code may use `this` when interfacing with libraries
that require it. These modules should be clearly marked.

### 8. No Mutable Closures

Closures over **mutable** variables (`let`, reassigned bindings) are banned in
core code.

```javascript
// ✅ OK - closure over immutable values
function embodyWithClosedConfig({ code }) {
	// cachedConfig was set once and never changes
	return trace({ code, config: cachedConfig });
}

// ❌ BANNED - closure over mutable state
function createCounter(initialCount = 0) {
	let count = initialCount;
	return {
		increment() {
			count++;
			return count;
		},
	};
}
```

**Exception**: Low-level code may use mutable closures when interfacing with
libraries that require stateful patterns. Same boundary as the `this` exception.

### 9. Method Shorthand, Default Empty Object, const

**Method shorthand**: Use method shorthand syntax in object literals.

```javascript
// ✅ CORRECT
const pipeline = {
  process() { ... },
  validate() { ... },
};

// ❌ AVOID
const pipeline = {
  process: function process() { ... },
};
```

**Default empty object**: All functions that destructure object parameters
should provide a default empty object.

```javascript
// ✅ CORRECT
function processConfig({ preset = 'detailed', variables = true } = {}) {}

// ❌ AVOID - no default
function processConfig({ preset = 'detailed', variables = true }) {}
```

**Prefer `const`**: Use `let` only when reassignment is genuinely needed.

### 10. Naming

**Functions: verb first**

```javascript
// ✅ CORRECT
function extractId(user) {}
function isActive(item) {}
function hasPermission(user, action) {}
function createConfig(options) {}
```

**Predicates**: Boolean-returning functions start with `is`, `has`, `can`,
`should`.

**Callbacks: describe the transform** (`extractId` not `mapUser`, `isEnabled`
not `filterItem`).

### 11. Imports, Types, Comments

**Imports**: Always include `.js` extension. Group and order:

```javascript
// 1. External dependencies (node_modules)
import { describe, it } from 'vitest';

// 2. Internal modules (relative paths)
import processConfig from './process-config.js';
import validateInput from '../helpers/validate-input.js';

// 3. Type imports (last)
import type { Config } from './types.js';
```

**Types**: Prefer `type` over `interface`. Each module can have a `types.ts`
file.

```typescript
// ✅ PREFERRED
type Config = {
	preset: string;
	variables: boolean;
};
```

**Comments**: JSDoc/TSDoc for public functions. Use `@remarks` for
consumer-facing "why" context that should appear in generated API documentation.
Inline comments explain **why**, not what.

```javascript
// ❌ WRONG - says what (obvious from code)
// Loop through users
for (const user of users) {
}

// ✅ CORRECT - says why (not obvious)
// Skip inactive users to avoid rate limiting on the API
for (const user of users.filter(isActive)) {
}
```

### 12. Readability Patterns

These patterns shape how code reads, not just what it does. The goal: a reader
should be able to follow a function without holding the whole thing in their
head.

#### Guard-first, happy-path-last

Screen out bad/edge cases with early returns at the top. The happy path stays
visible and uncluttered at the bottom. This also works with the linter: deep
nesting triggers a `cognitive-complexity` violation, early returns avoid it.

```typescript
// ✅ — guards up top, happy path at the end
function isPlainObject(thing: unknown): thing is Record<string, unknown> {
	if (typeof thing !== 'object') return false; // screen: primitives
	if (thing === null) return false; // screen: null
	if (Array.isArray(thing)) return false; // screen: arrays

	const proto = Object.getPrototypeOf(thing); // happy path: one clear check
	return proto === Object.prototype;
}
```

#### Named intermediate variables

When a sub-expression has a clear identity, capture it in a `const`. Name the
thing, then use the name. Avoids repeating the same lookup expression
(error-prone) and makes the intent visible at both the declaration and the use
site.

```typescript
// ✅ — named at declaration; reader sees the type at a glance
const tracerModule = tracers[tracer];
if (!tracerModule) throw new TracerUnknownError(tracer, ...);
const options = tracerModule.optionsSchema ? prepareConfig(...) : {};

// ❌ — reader must parse tracers[tracer] twice; easy to introduce subtle bugs
if (!tracers[tracer]) throw new TracerUnknownError(tracer, ...);
const options = tracers[tracer].optionsSchema ? prepareConfig(...) : {};
```

Real example: `src/api/trace.ts` lines 39–40.

#### Ternary: transparent value selection only

OK when both branches compute "the same kind of thing" — a variable name can
capture the identity regardless of which path executes. Not OK when branches do
structurally different things; use `if-else` for those.

```typescript
// ✅ — both branches produce a [key, value] pair (same shape)
const entry = condition ? [key, expandBoolean(value, schema)] : [key, value];

// ❌ — branches do different things; ternary hides the divergence
const result = condition ? executeSomething() : returnEarlyWithFallback();
```

Real example: `src/configuring/expand-shorthand.ts` `.map()` callback.

#### Within-file helpers for readability; separate file for reuse

**Within-file helper** (file-private, possibly single-use): extract when the
main function reads more clearly after the extraction. The caller says WHAT
without explaining HOW inline. Single use is fine. Define below (hoisting) for
subordinate helpers; above for substantial ones.

**Separate file**: only when the logic is used in 2+ places.

```typescript
// ✅ — shouldExpand() and expandBoolean() are single-use but they name the concepts
// expandShorthand() now reads like English prose

function expandShorthand(options, schema) {
  ...
  return entries.map(([key, value]) =>
    typeof value === 'boolean' && shouldExpand(schemaProperties[key])
      ? [key, expandBoolean(value, schemaProperties[key])]
      : [key, value],
  );
}

// Helpers defined below (hoisting) — details after the main function
function shouldExpand(fieldSchema) { ... }
function expandBoolean(value, fieldSchema) { ... }
```

```typescript
// ✅ — executeTrace() called from both embody() AND closure() → separate function justified
function embody(input = {}) {
  ...
  if (allPresent) return executeTrace(tracer, code, config);  // call site 1
  return createClosure(...);
}

function createClosure(state) {
  function closure(remaining = {}) {
    ...
    if (allPresent) return executeTrace(tracer, code, config);  // call site 2
    return createClosure(...);
  }
}
```

Real examples: `src/configuring/expand-shorthand.ts`, `src/api/embody.ts`.

#### Numbered step comments for multi-phase functions

When a function has distinct phases that aren't self-evident from the code,
number them. Makes long functions skimmable — a reader can jump to the step they
care about. Write the number and a short label; optionally add a key constraint
in parens.

```typescript
// 1. Validate tracer type (sync)
if (typeof tracer !== 'string' ...) throw ...;

// 2. Check tracer exists (sync)
const tracerModule = tracers[tracer];
if (!tracerModule) throw ...;

// 3. Prepare config (sync)
const meta = prepareConfig(...);

// 4. Record (async) — returns steps directly
return tracerModule.record(code, { meta, options });
```

Real example: `src/api/trace.ts` (8 numbered steps).

#### WHY comments for non-obvious JS semantics

When code relies on language mechanics that aren't universally known, add a
short comment explaining WHY this approach is required — not WHAT the code does
(the code already shows that).

```typescript
// typeof null === 'object' in JS — must explicitly exclude null after the typeof check
if (thing === null) return false;

// Object.getPrototypeOf(null) throws — the null check above is a prerequisite
const proto = Object.getPrototypeOf(thing);
```

Candidates: prototype chain operations, `typeof null`, coercion edge cases,
WeakMap/WeakSet patterns, async ordering constraints.

#### Blank lines as paragraph breaks

Separate distinct phases of logic with a blank line. One blank line = end of one
thought, start of the next. Group related statements; don't break every line
individually.

```typescript
// ✅ — guards form one paragraph; result forms another
if (typeof thing !== 'object') return false;
if (thing === null) return false;
if (Array.isArray(thing)) return false;

const proto = Object.getPrototypeOf(thing);
return proto === Object.prototype;

// ❌ — no visual structure; every line isolated
if (typeof thing !== 'object') return false;

if (thing === null) return false;

if (Array.isArray(thing)) return false;

const proto = Object.getPrototypeOf(thing);

return proto === Object.prototype;
```

#### Linting connections

Some patterns are partially enforced; others are code-review only.

- **Guard-first** — `sonarjs/cognitive-complexity` (warn) penalizes deep
  nesting; early returns keep the score down. `sonarjs/nested-control-flow`
  (error) flags nested loops and conditions directly.
- **Named intermediates** — `prefer-const` (error) ensures named values stay
  immutable; the discipline of naming is manual but the linter enforces the
  `const`.
- **Ternary** — `arrow-body-style: never` (error) requires implicit returns in
  arrow callbacks, which signals "pure value calculation" — same intent as the
  ternary rule.
- **Within-file helpers** — `sonarjs/cognitive-complexity` flags overly long
  functions (extract to reduce); `sonarjs/no-identical-functions` (error)
  catches duplicate logic across call sites.
- **WHY comments** — `spaced-comment` (error) enforces comment formatting;
  comment _content_ quality is a code-review concern only.
- **Blank lines** — Prettier handles structural whitespace; semantic phase
  breaks (paragraph rhythm) are a manual judgment call.

### 13. Deep Freeze Return Values

Objects and arrays returned from functions must be deep frozen before leaving
the function boundary. These libraries are consumed by LLMs — freezing catches
accidental mutation at the return boundary rather than producing silent bugs
downstream.

**Two operations, one ownership rule:**

| Operation       | When to use                                      | Behavior                      |
| --------------- | ------------------------------------------------ | ----------------------------- |
| Clone + freeze  | Objects we don't own (caller-provided, external) | Clones first, returns new ref |
| Freeze in place | Objects we just built (fresh results, wrappers)  | Freezes in place, same ref    |

The distinction is about **ownership**: if you just constructed the object
(e.g., a spread result, a new config wrapper), freeze it in place — there's no
reason to clone something nobody else has a reference to. If the object came
from outside (a parameter, imported data), clone-then-freeze to avoid mutating
the caller's data.

Use a deep-freeze utility from your package's dependencies for both operations.

**What to freeze:**

- All function return values that are objects or arrays
- Config objects and resolved options
- Constants and shared defaults
- Module-level data structures

**Exception:** Performance-critical hot paths where profiling shows freeze
overhead is unacceptable. Document with a `// perf: skip freeze — [reason]`
comment.

```typescript
// ✅ — freshly built result, freeze in place
function createResult(steps, meta) {
	const result = { ok: true, steps, meta };
	return freezeInPlace(result); // your deep-freeze utility
}

// ✅ — caller-provided config, clone + freeze
function resolveConfig(userConfig) {
	const resolved = merge(defaults, userConfig); // your deep-merge utility
	return cloneAndFreeze(resolved); // your deep-freeze utility
}

// ❌ — returned object is mutable; LLM consumer can accidentally mutate
function createResult(steps, meta) {
	return { ok: true, steps, meta };
}
```

## Directory Structure

**Convention**: One concept per file, named after its default export.
`kebab-case` for all files and directories. Match filename to export:
`createConfig` → `create.ts`.

### Directory Documentation Convention

Every source directory under `src/` has a `README.md`. Directories with
non-obvious architecture or key design decisions also have a `DOCS.md`:

| Content                                             | Where                      | Audience     |
| --------------------------------------------------- | -------------------------- | ------------ |
| API reference (signatures, params, returns, throws) | JSDoc/TSDoc → `docs/`      | Consumers    |
| Consumer-facing "why" context                       | TSDoc `@remarks` → `docs/` | Consumers    |
| What this module does, how to navigate it           | `README.md` per directory  | Contributors |
| Architecture, design decisions, why this approach   | `DOCS.md` per directory    | Developers   |
| Non-obvious implementation detail                   | Inline `//` comment        | Code readers |

**Rules:**

- Every directory has a `README.md`
- Directories with non-obvious architecture or key design decisions also have a
  `DOCS.md`
- `DOCS.md` captures the "why" — tradeoffs, alternatives considered,
  constraints. Keep it short. It is NOT an API reference — JSDoc handles that.
  Hand-maintained: fix it or delete it if it goes stale.
- Tests directories (`tests/`) are exempt from needing `README.md`
- `README.md` is cross-referenced: parent links down, child links up, siblings
  link to each other
- Public functions have JSDoc/TSDoc in source; TypeDoc generates `docs/`
  (gitignored, CI-only)

**Public function documentation:**

```typescript
/**
 * Creates a config from user input, applying defaults and preset expansion.
 *
 * @param options - User-provided config options
 * @returns Fully resolved config with all defaults applied
 * @throws {ArgumentInvalidError} If options is not an object
 *
 * @remarks
 * The config goes through three stages: shorthand expansion (booleans to full
 * objects), default-filling (missing keys get defaults), and schema validation.
 * The `@remarks` tag is for consumer-facing "why" context that belongs in the
 * generated API docs alongside the signature.
 */
function createConfig(options: UserOptions = {}): ResolvedConfig { ... }
```

### Test Organization

Unit tests live in a `tests/` subdirectory at the same level as the files they
test:

```text
src/
  module/
    tests/
      feature.test.ts
    feature.ts
```

- Directory name: `tests/` (plural, always)
- File suffix: `.test.ts` (never `.spec.ts`)
- Root `/tests/` directory: integration test fixtures (not unit tests)

## Development Workflow

### 1. Setup

```bash
npm install
npm run test:watch  # Run tests in watch mode
```

### 2. Making Changes

1. Create feature branch
2. Update relevant default export function
3. Add/update tests
4. Update `README.md` in affected directories
5. Run quality checks:

```bash
npm run validate  # lint + type-check + test
```

### 3. Conventions Checklist

- [ ] Named function/const, then `export default` at bottom
- [ ] Direct imports from source files (no barrels), always with `.js` extension
- [ ] Named `function` declarations (arrows only for inline callbacks)
- [ ] No `this` keyword, no mutable closures
- [ ] Default empty object `= {}` on all destructured parameters
- [ ] Verb-first naming; predicates prefixed with `is`/`has`/`can`/`should`
- [ ] Types added to module's `types.ts`; prefer `type` over `interface`
- [ ] Tests in `tests/` subdirectory (not alongside source files), `.test.ts`
      suffix
- [ ] Tests cover happy path and edge cases
- [ ] No mutations of input data
- [ ] Returned objects/arrays are deep frozen (clone-then-freeze for external,
      freeze-in-place for own)
- [ ] Errors handled gracefully
- [ ] `README.md` exists in every modified directory
- [ ] JSDoc/TSDoc on public functions; `@remarks` for consumer-facing "why"

## Testing Strategy

### Test Organization Convention

All unit tests live in a `tests/` subdirectory co-located with the source they
test.

### Unit Tests

Each exported function has a dedicated test file in the nearest `tests/`
subdirectory:

```typescript
import { expect, test } from 'vitest';

import parseJSON from '../parse-json.js';

test('parses valid JSON string', () => {
	const result = parseJSON('{"a":1}');
	expect(result).toEqual({ a: 1 });
});
```

### Testing Conventions

#### Test Naming

Use direct description. Implicit arrows (`→`) for compactness when input/output
is clear.

```typescript
// Standard — describes what happens
it('returns expanded config with all defaults', () => {...});

// Compact with arrow — input → output
it('string input → parsed object', () => {...});
```

#### Describe Block Structure

Top-level `describe` = function name. Nest freely for clarity.

```typescript
describe('createConfig', () => {
  describe('preset application', () => {
    describe('overview preset', () => {
      it('sets variables.read to false', () => {...});
    });
  });

  describe('boolean shorthand expansion', () => {
    describe('happy path', () => {...});
    describe('edge cases', () => {...});
    describe('errors', () => {...});
  });
});
```

#### Test Ordering

Within each describe block: **feature/behavior → happy path → edge cases →
errors → performance**

#### One Assertion Per Test

Use nested `describe` blocks instead of multiple assertions in one `it`.

```typescript
// ❌ WRONG — multiple assertions hide which failed
it('returns complete config', () => {
	expect(result.preset).toBe('detailed');
	expect(result.variables).toBe(true);
});

// ✅ CORRECT — one assertion, grouped by describe
describe('returns complete config', () => {
	it('preset = "detailed"', () => {
		expect(result.preset).toBe('detailed');
	});

	it('variables = true', () => {
		expect(result.variables).toBe(true);
	});
});
```

#### Error Testing

Always use `.toThrow()`. Never use try-catch in tests.

```typescript
// ✅ Basic
it('throws on invalid input', () => {
	expect(() => parseJSON('{bad}')).toThrow();
});

// ✅ With message substring
it('error mentions function name', () => {
	expect(() => processConfig()).toThrow('processConfig');
});
```

#### Test Data

Inline only. No shared fixtures. Each test is self-contained and independently
understandable.

#### Minimal Logic in Tests

Tests should contain only the function being tested and bare minimum data setup
(inline). No `if`, no loops, no try-catch. For multiple values, use `it.each`:

```typescript
// ✅ CORRECT
it.each([
	[false, false],
	[0, false],
	['', false],
	[null, false],
])('%p → Boolean coercion = %p', (value, expected) => {
	expect(Boolean(value)).toBe(expected);
});
```

#### No Comments in Tests

Test names and describe blocks are executable documentation.

#### Complete Example

```typescript
import { describe, expect, it } from 'vitest';

import parseJSON from '../parse-json.js';

describe('parseJSON', () => {
	describe('valid JSON string', () => {
		describe('happy path', () => {
			it('object string → parsed object', () => {
				expect(parseJSON('{"a":1}')).toEqual({ a: 1 });
			});
		});

		describe('edge cases', () => {
			it('empty object string → empty object', () => {
				expect(parseJSON('{}')).toEqual({});
			});
		});
	});

	describe('invalid input', () => {
		describe('errors', () => {
			it('malformed JSON → throws', () => {
				expect(() => parseJSON('{bad}')).toThrow();
			});
		});
	});
});
```

## Incremental Development Workflow

All development uses TDD with atomic increments. One unit test = one increment
of work.

### Phase 0: Documentation Specification (before any code)

Documentation-driven development ensures clarity BEFORE code exists.

**0.1. Update README.md** — What does this module do? Where does it fit?

**0.2. Adversarial Design Challenge (AR-1)** — Spawn a separate reviewer agent
to challenge the README spec before types lock the contract. See AGENTS.md §
Adversarial Review Protocol for prompt structure and verdict definitions.

**0.3. Update types.ts** — Type signatures are executable documentation

- Update type definitions to reflect the new contract (incorporating AR-1
  feedback)
- Type errors after this step become the TODO list for implementation

**0.4. Review & Resolve** — Confirm understanding before writing code

### Phase 1: TDD Implementation

For each behavioral increment:

1. **JSDoc/TSDoc** — document the behavioral contract (with `@remarks` for
   consumer-facing "why")
2. **Stub function** — create function with stub body
3. **Placeholder types** — `any`/`unknown` to unblock; tighten later
4. **Lint checkpoint 1** — `npm run lint <new-file>`. Fix violations.
5. **Unit test** — write ONE failing test for the behavior 5b. **Adversarial
   Test Challenge (AR-2)** — Spawn a separate reviewer agent to challenge test
   strategy. See AGENTS.md § AR-2 for focus areas.
6. **Lint checkpoint 2** — `npm run lint <test-file>`. Fix violations.
7. **Implement** — minimal code to pass the test (Red → Green)
8. **Lint checkpoint 3** — `npm run lint <impl-file>`. Fix violations.
9. **Refactor** — clean up while tests stay green
10. **Lint checkpoint 4** — final lint on modified files. Should be clean.
11. **Update types** — finalize based on actual implementation
12. **Self-review** — simplest solution? only what requested?
    junior-maintainable? 12b. **Adversarial Implementation Audit (AR-3)** —
    Spawn a separate reviewer agent to audit the implementation. See AGENTS.md §
    AR-3 for focus areas.
13. **Quality checks** — `npm test && npm run lint && npm run type-check`
14. **Verify docs match implementation** — update README.md if behavior changed
    during TDD
15. **Atomic commit** — one behavior per commit

Use linter feedback as refactoring guide:

- `cognitive-complexity` error? Break into smaller functions
- `no-duplicate-string`? Extract constant

### Phase 2: Pre-Merge Review

After all increments are complete, before prompting the human to commit:

1. **Run full quality checks** —
   `npm test && npm run lint && npm run type-check`
2. **Adversarial Pre-Merge Review (AR-4)** — Spawn a separate reviewer agent to
   review the full changeset. See AGENTS.md § AR-4 for focus areas. Provide the
   full diff, modified files list, and the original task description.
3. **Address PAUSE/CONSIDER items** — resolve concerns per AGENTS.md §
   Resolution Rules
4. **Prompt human for atomic commit** — ready to commit only after AR-4 clears

### Session Handoff

Before ending a work session:

1. Update plan file with current state, what's done, what's left
2. Commit all completed increments
3. Note any blockers or open questions

### Atomic Commits

Each passing TDD cycle = one atomic commit:

- One behavior per commit
- Descriptive message: `add: createConfig expands boolean shorthand`
- Feature branch for planned work batches

### What NOT to Do

- No implementing multiple behaviors before testing
- No skipping the refactor step
- No skipping doc updates ("I'll do it at the end")
- Each edit should do exactly one thing
- **No full implementations in plans** — plans describe BEHAVIOR and INTENT, not
  code

## Linting Conventions

This codebase uses a three-tool pipeline for code quality:

- **ESLint** — enforces logic patterns and code style
- **Prettier** — handles formatting (spaces, quotes, line length)
- **TypeScript** — validates types via `tsc` compiler

### Running the Tools

```bash
# Check for violations
npm run lint           # ESLint
npm run format:check   # Prettier
npm run type-check     # TypeScript

# Auto-fix what's fixable
npm run lint:fix       # ESLint auto-fix
npm run format         # Prettier auto-format

# Run all checks at once
npm run validate       # lint + type-check + test
```

### Pre-commit Hooks

Husky + lint-staged run automatically before each commit:

- `npm run lint:fix` on staged `.ts`/`.js` files
- `npm run format` on staged `.ts`/`.js`/`.json`/`.md`/`.yml`/`.yaml` files

Most violations get fixed automatically before you even see them.

### Enforced Conventions

See [eslint.config.js](./eslint.config.js) for full configuration.

#### Functional Programming Core

- No `this` keyword (use closures over parameters)
- No classes (use factory functions)
- No parameter reassignment (create new bindings)
- Immutable data encouraged (warn on mutations)

#### Functions and Naming

- All functions must have names (`func-names: error`)
- Arrow functions must use implicit returns — no body blocks
  (`arrow-body-style: never`)
- `for-of` loops for side effects, `.map()`/`.filter()` for transformations

#### Imports and Exports

- Always include `.js` extension in imports
- No named exports (except `src/index.ts` and `types.ts`)
- Imports ordered: builtin → external → internal, alphabetized within groups

#### Style

- `kebab-case` filenames (`unicorn/filename-case`)
- `const` by default; `let` only when reassigned
- Template literals for string concatenation (`prefer-template`)
- `type` over `interface` (`@typescript-eslint/consistent-type-definitions`)

### TypeScript Strict Mode

All TypeScript strict checks are enabled. Run `npm run type-check` to verify.

### Manual Review Conventions

These conventions can't be automated and must be checked during code review:

- Default empty object for destructured parameters
- Verb-first function naming
- One concept per file
- Comments explain "why" not "what"
- No mutable closures
- `README.md` updated in every modified directory

### Teaching Moments for Linting Errors

When linting errors occur, treat them as teaching opportunities — explain WHAT
and WHY, not just how to fix.

| Rule                             | Concept to Teach                                                                |
| -------------------------------- | ------------------------------------------------------------------------------- |
| `unicorn/no-array-for-each`      | Imperative vs functional: use `for-of` for side effects, methods for transforms |
| `prefer-template`                | Keep `+` for math only. Template literals prevent type coercion bugs.           |
| `arrow-body-style`               | Implicit returns signal "pure transform"; braces signal "does more."            |
| `func-names`                     | Named functions improve stack traces and enable hoisting.                       |
| `functional/no-this-expressions` | `this` binding changes based on call-site. Closures are explicit.               |
| `sonarjs/cognitive-complexity`   | Too many nested conditions/loops. Break into smaller named functions.           |
| `sonarjs/no-duplicate-string`    | Magic strings → named constants for searchability and refactoring.              |

## Module Boundaries

Import boundaries are enforced via `eslint-plugin-boundaries`. This catches
architectural violations at lint time.

### Template: Single Layer (`src`)

The template ships with one layer: all source files under `src/**` can import
from each other. As your package grows, add more specific layers to enforce
architectural boundaries.

```javascript
// eslint.config.js — current template setup
'boundaries/elements': [
  { type: 'src', pattern: 'src/**', mode: 'file' },
],
'boundaries/element-types': [
  'error',
  {
    default: 'disallow',
    rules: [
      { from: 'src', allow: ['src'] },
    ],
  },
],
```

### Expanding for Your Package

When your package grows internal layers (e.g., `api/`, `configuring/`,
`errors/`), add elements with more specific patterns (listed before the `src`
catch-all) and matching `element-types` rules:

```javascript
// Example: multi-layer package
'boundaries/elements': [
  { type: 'entry', pattern: 'src/index.ts', mode: 'file' },
  { type: 'core',  pattern: 'src/core/*',   mode: 'file' },
  { type: 'error', pattern: 'src/errors/*', mode: 'file' },
],
// In rules:
'boundaries/element-types': ['error', {
  default: 'disallow',
  rules: [
    { from: 'entry', allow: ['core'] },
    { from: 'core',  allow: ['error'] },
    { from: 'error', allow: [] },
  ],
}],
```

More specific patterns are listed first so they match before the broader
catch-all. See embody's `eslint.config.js` for a full multi-layer example.

### Updating Boundaries

When the architecture evolves:

1. Update `boundaries/elements` patterns in `eslint.config.js`
2. Update `boundaries/element-types` rules for new allowed imports
3. Update this section of DEV.md
4. Run `npm run lint` to verify no violations

## Code Quality Anti-Patterns

Common patterns to avoid:

| Anti-Pattern              | Rule                          | Example Fix                                     |
| ------------------------- | ----------------------------- | ----------------------------------------------- |
| **Over-engineering**      | Helper used once? Inline it   | `const x = getX(o)` → `const x = o.x`           |
| **Class addiction**       | Prefer functions over classes | `class X` → `function createX()`                |
| **Future-proofing**       | Don't add unused flexibility  | `options = {}` with unused fields → direct impl |
| **Defensive over-coding** | Validate at boundaries only   | Remove internal re-validation                   |
| **Verbose docs**          | Name + types self-document?   | Only document WHY or non-obvious contracts      |

### Pre-Commit Checklist

Before proposing code, answer YES to ALL:

- [ ] **Simplest solution?** Not most "elegant" or "extensible"
- [ ] **Only what requested?** No future-proofing, no "nice-to-haves"
- [ ] **Helpers used >1x?** If used once, inline it
- [ ] **Validate at boundaries only?** No re-validating internal calls
- [ ] **Junior-maintainable?** Understandable without explanation

## VS Code Setup

The `.vscode/` directory provides workspace configuration for consistent
development:

- **settings.json** — Format-on-save, ESLint auto-fix, word wrap at 100 chars,
  `.js` import extensions
- **extensions.json** — Recommended extensions (ESLint, Prettier, EditorConfig,
  Vitest, spell checker, pretty TS errors)
- **launch.json** — Debug configurations for tests and scripts

Open VS Code → install recommended extensions when prompted → editor is
configured.

**Debug configurations:**

- **Debug Current Test File** — open a `.test.ts` file, press F5
- **Debug All Tests** — run full suite with breakpoints
- **Debug Current Script** — debug any `.ts`/`.js` file directly
