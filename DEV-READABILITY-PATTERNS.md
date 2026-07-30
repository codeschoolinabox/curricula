# Readability Patterns

> Extracted from `DEV.md` § 12. Reference material — consult when writing or
> reviewing code style, not required reading up front.

## Guard-first, happy-path-last

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

Real example: this function exists at `src/lib/utils/is-plain-object.ts`.

## Named intermediate variables

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

Real example: `src/lib/utils/is-plain-object.ts` — the `proto` intermediate.

## Ternary: transparent value selection only

OK when both branches compute "the same kind of thing" — a variable name can
capture the identity regardless of which path executes. Not OK when branches do
structurally different things; use `if-else` for those.

```typescript
// ✅ — both branches produce a [key, value] pair (same shape)
const entry = condition ? [key, expandBoolean(value, schema)] : [key, value];

// ❌ — branches do different things; ternary hides the divergence
const result = condition ? executeSomething() : returnEarlyWithFallback();
```

Real example: `src/lib/snippetry/debug/guard-loops/guard-loops.ts` — the
`typeof evalCode === 'object' ? evalCode : recast.parse(evalCode)` line; both
branches produce a parsed AST.

## Within-file helpers for readability; separate file for reuse

**The extraction rule, two parts:**

- **Within a file**: extract helpers freely — no use-count limit — whenever it
  makes the file and its export read better. The caller says WHAT without
  explaining HOW inline. Single use is fine. Helpers are defined below main
  (newspaper order). Trivial wrappers that name nothing (`const x = getX(o)`)
  still get inlined — they fail the readability test, not a use-count test.
- **Separate file**: only when the logic is used in 2+ places — and extraction
  to a new domain-related file is an inter-file trigger under two-tier autonomy
  (check in with the user).

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

Real examples: `src/lib/snippetry/debug/guard-loops/guard-loops.ts` (single-use
narrative helpers `generateLoopGuard` and `insertBlankLinesAfterGuards`);
`src/lib/utils/deep-clone.ts` (extracted to its own file — imported by both
`freeze.ts` and `deep-freeze.ts`).

## Numbered step comments for multi-phase functions

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

Real example: `src/lib/embody/lib/validating/validate.ts` (three numbered
phases: parse error / rejections / valid).

## WHY comments for non-obvious JS semantics

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

## Blank lines as paragraph breaks

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

## Linting connections

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
