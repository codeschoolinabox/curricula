# Open Questions for Aran Creator

Questions for discussion about the JEJ notional machine, tracer architecture,
and Aran's capabilities. Organized by topic. The more we ask, the better this
will be.

Context: we're building a tracer for JEJ (Just Enough JavaScript) — a curated
subset of JavaScript designed for introductory programming. We've defined a
notional machine (see [notional-machine.md](./notional-machine.md)) and are
designing event-level tracing that captures every observable moment during
execution. The tracer uses Aran's AST weaving.

---

## 1. Notional machine completeness

**Are we missing any observable JS behaviors that Aran can see?**

Our NM has these components: values, bindings (declare/initialize/available/
access/update), scopes (create/enter/completion/interrupt/leave), expressions
(enter/exit brackets around compound expressions), statements (enter/exit with
reason), coercion (between operand resolution and operator), resolve (value
produced by expression), scope chain lookup (per-scope-check events), prototype
chain lookup (per-prototype-check events), and errors (with creation/execution
phase).

- Is there anything Aran observes during execution that we haven't modeled?
- Any JS behaviors that are pedagogically important for beginners that we're
  not capturing?
- Our NM focuses on JEJ (no user-defined functions, no arrays/objects as
  literals, no try/catch, no async). Does the absence of these simplify or
  complicate Aran's hook model in ways we should know about?

**How should we visually lay out and represent the notional machine?**

We need a diagram that:
- Can be drawn on paper or a whiteboard
- Shows code AND memory (bindings in scopes)
- Shows step-by-step execution at the expression/resolution grain
- Can be decomposed to focus on different parts (just data flow, just control
  flow, just variable lifecycle, etc.)
- Aligns with (or at least doesn't contradict) browser devtools

What visual models have you seen work well for explaining JS execution? Any
recommendations for representing scope chains, prototype chains, or the
evaluation-resolution sequence visually?

---

## 2. Event architecture — the lighter/thinner model

**Can Aran support enter/exit brackets around compound expressions?**

Our new event model uses lighter events in sequences:

```
enter-expr(BinaryExpression, +)
  resolve(2)              ← literal 2
  resolve(3)              ← literal 3
  operator(*, [2,3])
exit-expr(*, value: 6)
resolve(6)
```

- Can Aran's `expression@after` hook tell us when an expression STARTS
  evaluating (not just when it finishes)?
- Or do we need `expression@before` (which Aran has but we currently don't
  wire up)?
- If we use `expression@before` for enter and `expression@after` for exit +
  resolve, is there a performance concern with doubling the expression hook
  count?

**Can we get per-sub-expression granularity?**

For `1 + 2 * 3`, we want separate events for:
1. Literal `1` resolves to 1
2. Literal `2` resolves to 2
3. Literal `3` resolves to 3
4. `*` operator fires
5. `*` result resolves to 6
6. `+` operator fires
7. `+` result resolves to 7

Does Aran's hook model naturally give us this level of detail? Or does Aran
desugar the expression in a way that loses the sub-expression structure?

---

## 3. Scope chain lookup

**Can Aran expose the scope chain walk as separate events per scope checked?**

We want:

```
scope-check(block, miss)
scope-check(script, hit: x)
binding-access(x, value: 5)
```

Currently, Aran's advice functions receive the resolved value (after the lookup
is done). Can we intercept the lookup process itself? Or would we need to
simulate it by walking `state.scopeStack` when an identifier is evaluated?

If simulated: is the scopeStack at advice-call time guaranteed to reflect the
correct chain? Are there edge cases where Aran's internal resolution differs
from what our scopeStack walk would produce?

---

## 4. Prototype chain lookup

**Can Aran expose prototype chain walking for method access?**

For `str.toUpperCase()`, we want:

```
proto-check(value: 'hello', miss)
proto-check(String.prototype, hit: toUpperCase)
```

- Does Aran's `apply@around` hook for `aran.getValueProperty` give us enough
  information to reconstruct the prototype walk?
- Or does Aran only give us the final resolved property value?
- For JEJ specifically: primitive values always go through auto-boxing +
  one-step prototype lookup (value → Constructor.prototype). Are there edge
  cases where this is more complex?

We want regex literals (`/pattern/.test(str)`) to show the prototype walk
through `RegExp.prototype`. Even though `RegExp` isn't in JEJ's global
register, we need it internally for the prototype chain. Any concerns with
this approach?

---

## 5. Coercion visibility

**How do we capture pre-coercion and post-coercion values?**

For `'5' + 1`, we want a coercion event showing `1 → '1'` BETWEEN the operand
resolution and the operator application.

- Does Aran give us the operand values BEFORE the operator applies?
- Does Aran tell us what coercion happened (or do we need to detect it by
  comparing input types vs output type)?
- For boolean coercion contexts (`if (x)`, `while (x)`, `!x`): does
  `expression@after` give us the pre-coercion value AND the boolean result?

**Specific coercion scenarios we need to handle:**

- `'5' + 1` → string concatenation (number coerced to string)
- `'5' - 1` → numeric subtraction (string coerced to number)
- `if ('hello')` → truthy check (string coerced to boolean)
- `null == undefined` → loose equality coercion
- Template literals: `${42}` → number coerced to string

---

## 6. Execution model

**eval+local-strict vs script+global for JEJ programs**

JEJ programs run as modules (`<script type="module">`). Currently our tracer
uses Aran's `kind: 'eval'` with `situ: { type: 'local', mode: 'strict' }`.
This routes top-level `let`/`const` through `block@declaration` (correct
binding lifecycle events).

Switching to `kind: 'script'` with `situ: { type: 'global' }` routes top-level
`let`/`const` through `readGlobalVariable`/`writeGlobalVariable` instead,
which breaks the binding lifecycle event sequence.

- Is `eval+local-strict` the correct Aran configuration for programs that
  should behave like strict-mode scripts (module semantics)?
- Is there a way to use `kind: 'script'` while still getting `block@declaration`
  events for top-level `let`/`const`?
- What are the semantic differences a learner would observe between eval and
  script modes? (We confirmed: none visible for JEJ programs. But are we
  missing edge cases?)

---

## 7. TDZ representation

**How does Aran represent TDZ state in the frame passed to block@declaration?**

Currently we detect TDZ via `typeof value === 'symbol'` (Aran uses a Symbol
as the deadzone marker). Is this the stable API? Could this change in future
Aran versions?

For `let x;` (no initializer): does Aran pass `undefined` or the TDZ symbol
in the declaration frame? Our current code treats it as TDZ symbol → skip
initialize/available. Is this correct?

---

## 8. ASTNode building

**Can Aran's digest callback build ASTNode objects with parent refs?**

Our current `instrument.ts` builds ASTNode objects during the digest callback,
setting `.parent` by looking up a pre-built parent-info map from the ESTree AST.

- Is this the right approach, or is there a better way to get parent
  information during Aran's transpile phase?
- Does the digest callback see nodes in a predictable order (bottom-up? or
  mixed)?
- Can we build the full `ast: Record<nodePath, ASTNode>` during the digest,
  or should some of it happen after transpile completes?

---

## 9. Performance and practical concerns

**Event volume at sub-expression granularity**

With enter/exit brackets, resolve events, scope-check events, and coercion
events, a simple program like `let x = 1 + 2 * 3;` produces ~15 events.
A realistic JEJ program (20-30 lines) might produce hundreds.

- Is this volume feasible for real-time classroom use?
- Does the Worker + SharedArrayBuffer pause protocol handle this throughput?
- Should we consider batching (emit N events per pause cycle) instead of
  per-event pausing?

**tagMap lifecycle**

Our tagMap is a `Map<string, JejTag>` built during the digest callback. It
can't be in `initialState` (Aran's code generator can't serialize Maps). We
hold it in the generator closure. Is there a better pattern?

---

## 10. Things we might be missing entirely

**What don't we know that we don't know?**

- Are there Aran hooks we're not using that could provide valuable information?
  (We currently use: block@setup/declaration/before/after/throwing/teardown,
  expression@after, apply@around, effect@before/after, statement@before.
  Intentionally unused: block@declaration-overwrite, statement@after,
  expression@before, construct@around.)
- Are there JS execution behaviors that Aran captures but that aren't visible
  in our event model?
- **Are we missing any NM components?** We have: values, bindings, scopes,
  global environment, expressions, statements, coercion, resolve, errors,
  scope chain lookup, and prototype chain lookup. Is there a mechanism or
  observable behavior in JS execution that doesn't fit into any of these?
- Any recommendations for how other projects have structured their event
  schemas when using Aran?
- Is there anything about our architecture (Worker-based execution, SAB
  pause protocol, Aran 5.2.2) that you'd do differently?
- Does Aran handle BigInt literals (`42n`) and BigInt arithmetic correctly?
  Any edge cases with bigint/number mixed operations that Aran might not
  intercept?
- For `new Date()` — the sole `new` exception in JEJ — how does Aran trace
  object construction? Does `construct@around` fire? Can we capture the Date
  object creation and subsequent method calls (getFullYear, toLocaleDateString,
  etc.) through the same advice hooks?

**Visual representation of the NM**

- How would you visually lay out the notional machine for learners? We need
  a diagram that can be drawn on paper, shows code + memory, supports
  step-by-step tracing at expression granularity, and can be decomposed to
  focus on different parts.
- What visual conventions have you seen work well for representing scope
  chains, prototype lookups, and evaluation-resolution sequences?
- Any recommendations for how to represent the global environment (registers,
  constants, callable functions) in a way that's accurate but not overwhelming?

---

## 11. JEJ language design context

JEJ's language level was designed specifically to balance **meaningful
computational exploration** with a **manageable notional machine**:

- `prompt`/`alert`/`confirm` + console methods → covers all three audiences
  of code (developers, computer, users)
- All global libraries (Math, String, Number, Date) and operator types →
  enables exploring different models and perspectives on computation WITHOUT
  complicating the notional machine
- More operators and methods have their own behaviors to learn, but they don't
  add new NM components — they're all expressions that resolve to values through
  the same mechanisms

The excluded features are excluded specifically because each would add new
NM components: user-defined functions (call stack, closures), arrays/objects
as literals (heap allocation, reference identity), classes (user prototype
chains, `this`), `try`/`catch` (exception propagation), `async`/`await`
(event loop, microtask queue), `var` (function-scoped hoisting confusion),
destructuring/spread/rest (pattern matching on data structures). JEJ's
boundary is drawn where the NM stays tractable.

This is why we've defined the NM explicitly in this directory — it's a design
artifact, not just documentation. The NM IS the learning objective.
