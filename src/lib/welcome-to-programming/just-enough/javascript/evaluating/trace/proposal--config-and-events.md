# Proposal: Config Schema + Event Types Per Layer

This is a discussion document. Nothing here is final until we agree.

## Table of Contents

- [Design Principles](#design-principles)
- [Config Schema](#config-schema)
- [Layer 0: Pointcuts (config gating at instrument time)](#layer-0-pointcuts)
- [Layer 1: Advice Output (raw event data)](#layer-1-advice-output)
- [Layer 2: Dispatcher Output (final TraceEvent)](#layer-2-dispatcher-output)
- [What Changed vs Current](#what-changed-vs-current)
- [Open Questions](#open-questions)
- [Pushback on My Own Proposal](#pushback-on-my-own-proposal)

---

## Design Principles

1. **Top-level config = reference.md cheatsheet** — what learners see and write
2. **Nested config = language semantics** — respecting current options.schema.json field names where possible
3. **Events stay semantic and flat** — the linear array is the primary format
4. **`syntaxId` links events to syntax** — assigned statically at instrument time from Aran's nodePath
5. **Config gates at instrument time** — pointcuts use JejTag + config to gate at instrumentation, not runtime. Zero overhead for disabled features. Only filter arrays and runtime-only checks (TDZ, short-circuit) remain at runtime in the dispatcher.
6. **No new event categories** — we regroup existing events under syntax-aligned config keys

---

## Config Schema

### Top-level structure (mirrors reference.md TOC)

```typescript
type TraceConfig = {
  // --- execution limits (unchanged) ---
  seconds?: number;
  iterations?: number;

  // --- reference.md: "Variables" ---
  variables?: boolean | {
    let?: boolean;                // config gate for let declarations
    const?: boolean;              // config gate for const declarations
    // sub-events (from current bindings.events — names preserved)
    declare?: boolean;            // binding enters scope (hoisting)
    initialize?: boolean;         // first value assigned
    available?: boolean;          // binding usable without TDZ error
    assign?: boolean;             // subsequent reassignment
    read?: boolean;               // value accessed in expression
    filter?: string[];            // only these variable names
  };

  // --- reference.md: "Operators" ---
  operators?: boolean | {
    // sub-categories (from current operators.pure — names preserved)
    arithmetic?: boolean;         // -, *, /, %, **, unary +/-
    addition?: boolean;           // + (string concat or numeric)
    comparison?: boolean;         // ===, !==, >, <, >=, <=
    typeof?: boolean;             // typeof
    negation?: boolean | {        // !, ~
      logical?: boolean;
      bitwise?: boolean;
    };
    bitwise?: boolean;            // &, |, ^, <<, >>, >>>
    shortCircuiting?: boolean;    // &&, ||, ??, ?:
    filter?: string[];            // only these operators
  };

  // --- reference.md: "Assignment Operators" ---
  // WHY separate from operators: reference.md has its own section.
  // WHY separate from variables: syntactically it's `x += 2`, not just a
  // variable write. Learners see the operator, not the binding lifecycle.
  assignments?: boolean | {
    simple?: boolean;             // = (plain assignment, not compound)
    compound?: boolean;           // +=, -=, *=, etc.
    filter?: string[];            // only these operators
  };

  // --- reference.md: "Primitive Types" (literal expressions) ---
  literals?: boolean | {
    // names preserved from current schema
    string?: boolean;
    number?: boolean;
    boolean?: boolean;
    null?: boolean;
    undefined?: boolean;
    regex?: boolean;
  };

  // --- reference.md: "Template Literals" ---
  templates?: boolean | {
    // names preserved from current schema
    begin?: boolean;
    evaluation?: boolean;
    end?: boolean;
  };

  // --- reference.md: "String Access & Methods" + "Optional Chaining" ---
  propertyAccess?: boolean | {
    // names preserved from current schema
    dot?: boolean;
    bracket?: boolean;
    optionalChaining?: boolean;
    filter?: string[];
  };

  // --- reference.md: "Interactions" + "Logs & Assertions" + built-in calls ---
  functionCalls?: boolean | {
    // names preserved from current schema
    call?: boolean;
    return?: boolean;
    filter?: string[];
  };

  // --- reference.md: "Conditionals" ---
  conditionals?: boolean | {
    // names preserved from current controlFlow.events
    test?: boolean;               // condition evaluated
    branch?: boolean;             // which path taken
  };

  // --- reference.md: "While Loops" ---
  while?: boolean | {
    test?: boolean;
    iteration?: boolean;          // loop body entered (with index)
  };

  // --- reference.md: "Do-While Loops" ---
  doWhile?: boolean | {
    do?: boolean;                 // body execution marker
    test?: boolean;
    iteration?: boolean;
  };

  // --- reference.md: "For Loops" ---
  for?: boolean | {
    initialize?: boolean;         // init phase
    test?: boolean;
    increment?: boolean;          // update phase
    iteration?: boolean;
  };

  // --- reference.md: "For-Of Loops" ---
  forOf?: boolean | {
    iteration?: boolean;          // each element (with value, variable)
  };

  // --- reference.md: "Break" / "Continue" ---
  break?: boolean;
  continue?: boolean;

  // --- scopes (developer tooling, not in reference.md) ---
  scopes?: boolean | {
    // 2D gate preserved from current schema
    kind?: boolean | {
      script?: boolean;
      block?: boolean;
      module?: boolean;
    };
    // events preserved from current schema
    create?: boolean;
    enter?: boolean;
    interrupt?: boolean;
    completion?: boolean;
    leave?: boolean;
  };

  // --- with (easter egg, unchanged) ---
  with?: boolean;
};
```

### What changed from current options.schema.json

| Current | Proposed | Rationale |
|---------|----------|-----------|
| `bindings` (2D matrix) | `variables` (flat booleans) | Learners say "variables" not "bindings". 2D matrix collapsed — kind gates (let/const) and event gates (declare/read/...) are siblings, not crossed axes |
| `operators.pure.{...}` | `operators.{...}` (flattened) | Removed `pure` nesting — learners don't think in pure/short-circuit categories. `shortCircuiting` stays as a sub-key |
| `operators.assignment` | `assignments` (top-level) | reference.md gives it its own section. Compound assignment is syntactically distinct from variable lifecycle |
| `controlFlow` (2D matrix) | `conditionals`, `while`, `doWhile`, `for`, `forOf`, `break`, `continue` (top-level) | Each is its own reference.md section. Flat = more cheatsheet-like |
| `controlFlow.kind.loops.{...}` | gone — each loop type is top-level | No need for kind gate when each loop IS a config key |
| `controlFlow.events.{...}` | sub-keys under each construct | test/branch live under `conditionals`, test/iteration under `while`, etc. |
| `functions` | `functionCalls` | Clearer name (learners call functions, they don't define them in JEJ) |
| `bindings.kind.global` | removed | Strict mode throws on implicit globals — not a learner concern |
| `scopes` | kept but simplified | Removed 2D matrix. kind and events are sibling booleans |
| `literals`, `templates`, `propertyAccess` | **preserved** | These already align with reference.md |

### What's explicitly preserved from current schema

- All literal kind names (string, number, boolean, null, undefined, regex)
- All template event names (begin, evaluation, end)
- All property access kind names (dot, bracket, optionalChaining)
- Function event names (call, return)
- Scope event names (create, enter, interrupt, completion, leave)
- Scope kind names (script, block, module)
- Filter array pattern (string[] on variables, operators, propertyAccess, functionCalls, assignments)
- Boolean shorthand expansion pattern (feature: true → all sub-options enabled)

---

## Layer 0: Pointcuts

Pointcuts gate at **instrumentation time** (during `instrument()`). If a config
key is disabled, the pointcut returns `null` and Aran never instruments that
join point — zero runtime overhead.

### What pointcuts can gate (statically, from JejTag)

| JejTag field | Gates these config keys |
|-------------|----------------------|
| `literalKind` | `literals.string`, `literals.number`, etc. |
| `operator` + `BINARY_SUBKIND`/`UNARY_SUBKIND` | `operators.arithmetic`, `operators.comparison`, etc. |
| `loopKind` | `while`, `doWhile`, `for`, `forOf` |
| `structure` | `conditionals` |
| `accessKind` | `propertyAccess.dot`, `.bracket`, `.optionalChaining` |
| `bindingKind` | `variables.let`, `variables.const` |
| (hook type) | `scopes.*`, `functionCalls.*`, `templates.*` |

### What pointcuts CANNOT gate (runtime only → stays in dispatcher)

| Check | Why runtime | Where |
|-------|-------------|-------|
| Filter arrays (`filter: ['x']`) | Variable/function/property name sometimes only known at runtime | Dispatcher |
| `initialize` vs `assign` | TDZ state — first write vs subsequent write | Dispatcher |
| Short-circuit detection | Depends on runtime value of left operand | Dispatcher (metadata enrichment) |

### Current vs proposed

**Currently**: Pointcuts do coarse-grained gating (e.g., "any operator enabled?" →
register apply pointcut). Fine-grained checks (e.g., "is arithmetic enabled?")
happen at runtime in advice via `config-gate.ts`.

**Proposed**: Pointcuts go granular. Each specific feature check that can be
resolved from JejTag metadata moves into the pointcut function. `config-gate.ts`
is eliminated — its logic splits between pointcuts (static checks) and
dispatcher (filter arrays + TDZ).

### Pointcut contract example

```typescript
// Current coarse pointcut (in create-aspect.ts):
// "instrument all binary operations if ANY pure operator is enabled"
if (config.operators?.pure) {
  pointcut['expression@after'] = (node, parent, root) => { ... };
}

// Proposed granular pointcut:
// "instrument this specific binary operation only if its subkind is enabled"
pointcut['expression@after'] = (node, parent, root) => {
  const tag = resolveTag(node.tag);
  if (tag.literalKind) {
    // gate: is this specific literal kind enabled?
    if (!config.literals?.[tag.literalKind]) return null;
    return ['literal', tag];
  }
  // ... other discriminants
};
```

The pointcut still returns the discriminant + tag array (Aran requirement:
point[] must be Json[]). But it only returns non-null when the feature is enabled.

---

## Layer 1: Advice Output

Advice functions produce **raw event records** — plain objects with domain data.
No step counter, no source metadata, no freezing, no emission.

```typescript
/**
 * What advice functions return. Not a public type — internal contract
 * between advice and coordinator.
 *
 * Each record carries:
 * - generatorPath: tells the coordinator which event generator to use
 * - semantics: statement or expression (the coordinator needs this for BaseEvent)
 * - tag: the JejTag (coordinator extracts loc/node/source/syntaxId)
 * - payload: domain data for the event generator
 */
type RawEventRecord = {
  readonly generatorPath: string;
  readonly semantics: 'statement' | 'expression';
  readonly tag: JejTag;
  readonly payload: Record<string, unknown>;
};
```

### What changes in advice functions

**Currently**: advice calls `emitEvent(state, tag, semantics, path, payload)` which increments step, creates frozen event, pushes to trace, calls onEvent.

**Proposed**: advice returns `RawEventRecord` (or `null` to skip). Advice no longer calls emitEvent, doesn't touch state.trace, doesn't call onEvent.

**State that stays in advice**: scope stack, variable registry, iteration counters, lastExpressionResult, previousExpressionResult, lastReadValues. These are needed for *generating correct data* (lookup variable kind, determine if TDZ, count iterations, recover short-circuit left operand).

**State that moves to dispatcher**: step counter, eventStep counter, trace array, onEvent callback. Config gates move to pointcuts (instrument time), except filter arrays and TDZ checks which stay in dispatcher.

### Advice contract examples

**expression-after (literal)**:
```typescript
// Currently:
if (literalKind && isLiteralEnabled(state.config, literalKind)) {
  emitEvent(state, tag, 'expression', `literals.${literalKind}`, {
    kind: literalKind,
    value: representValue(result),
  });
}

// Proposed:
return {
  generatorPath: `literals.${literalKind}`,
  semantics: 'expression',
  tag,
  payload: { kind: literalKind, value: representValue(result) },
};
// Config gating already happened at instrument time (pointcut).
// If we're here, the feature is enabled. Dispatcher only checks filter arrays.
```

**effect-after (assign)**:
```typescript
// Proposed:
return {
  generatorPath: 'bindings.assign',
  semantics: 'expression',
  tag,
  payload: {
    kind: lookup.info.kind,
    event: 'assign',
    name: variable,
    scopeCreationStep: lookup.scope.creationStep,
    declarationStep: lookup.info.declarationStep,
    value: representValue(assignedValue),
  },
};
```

**block-before (multiple events)**: Some advice functions emit 0-3 events per invocation (block-before can emit enter + branch + iteration + do). These return `RawEventRecord[]`:

```typescript
// block-before returns:
const records: RawEventRecord[] = [];
// ... conditionally push enter, branch, iteration, do records
return records;
```

### Special cases

**block-setup**: MUST return state (Aran requirement — it's a state transformer). Returns `{ state, records: [] }` or similar. The scope push happens here; the scope create record goes to coordinator.

**apply-around**: MUST call Reflect.apply and return the result (Aran requirement — it replaces execution). Returns `{ result, records: [...] }`.

**expression-after**: MUST return the result value (Aran value transformer requirement). Returns `{ result, records: [...] }`.

---

## Layer 2: Dispatcher Output (final TraceEvent)

The dispatcher receives `RawEventRecord`s from advice and produces final
`TraceEvent`s. It is deliberately thin — most gating already happened at
instrumentation time in the pointcuts.

### New fields on BaseEvent

```typescript
type BaseEvent = {
  readonly step: number;             // contiguous 1-indexed (unchanged)
  readonly semantics: 'statement' | 'expression';  // unchanged
  readonly loc: SourceLocation;      // unchanged
  readonly node: string;             // unchanged — ESTree node type
  readonly source: string;           // unchanged — source text
  readonly syntaxId: string;         // NEW — Aran nodePath (e.g., "$.body.1.expression")
  readonly syntaxLoc: SourceLocation; // NEW — loc of the parent syntax construct
  readonly syntaxSource: string;     // NEW — source text of parent syntax construct
};
```

### How syntaxId works

During `instrument()`:
1. The digest callback already produces a unique hash per ESTree node: `${filePath}#${nodePath}`
2. We extract the `nodePath` part and store it as `syntaxId` in JejTag
3. We also compute and store `parentSyntaxId` — the nodePath of the nearest "syntax construct" ancestor

**What counts as a "syntax construct"?** The meaningful grouping level — what a learner would point to:
- `AssignmentExpression` (for `x += 2` → groups read, evaluate, add, assign)
- `ForStatement` (for `for(...){}` → groups init, test, increment, body events)
- `IfStatement` (for `if(...){}` → groups test, branch events)
- `WhileStatement`, `DoWhileStatement`, `ForOfStatement`
- `VariableDeclaration` (for `let x = 5` → groups declare, evaluate, initialize, available)
- `TemplateLiteral` (for `` `${x}` `` → groups begin, evaluation, end)
- `CallExpression` (for `console.log(x)` → groups call, return)
- `LogicalExpression` (for `a && b` → groups evaluate, test, branch)

Events that ARE the syntax construct (a standalone literal `5`, a standalone read `x`) have `syntaxId === parentSyntaxId` — they're their own syntax.

### Dispatcher responsibilities

```
For each RawEventRecord from advice:
  1. FILTER — check filter arrays if present (variables.filter, functionCalls.filter, etc.)
     Also: init vs assign discrimination (TDZ state, runtime only)
     Skip record if filtered out. All other gating already done by pointcuts.
  2. STEP — increment eventStep counter
  3. METADATA — attach step, loc, node, source from tag
  4. SYNTAX — attach syntaxId, syntaxLoc, syntaxSource from tag
  5. GENERATE — call the event generator (existing generators, unchanged)
  6. FREEZE — deep freeze the event
  7. COLLECT — push to trace array
  8. EMIT — call onEvent callback (→ postMessage → SAB protocol)
```

### Event type changes

**Events that stay exactly the same** (just gain BaseEvent's new fields):
- BindingEvent (all 5 event types)
- PropertyAccessEvent (all 3 kinds)
- PureOperatorEvent (all subkinds)
- ShortCircuitingOperatorEvent
- LiteralEvent (all kinds)
- TemplateBeginEvent, TemplateEvaluationEvent, TemplateEndEvent
- ScopeEvent (all event types)
- ControlFlowEvent (test, branch, iteration, jump, do, initialize, increment)
- FunctionCallEvent, FunctionReturnEvent
- WithEvent

**Events that change**:
- AssignmentOperatorEvent: renamed category from `'operator'` to `'assignment'`. This aligns with the new top-level config key `assignments` being separate from `operators`.

```typescript
// Current:
type AssignmentOperatorEvent = BaseEvent & {
  readonly category: 'operator';
  readonly kind: 'assignment';
  // ...
};

// Proposed:
type AssignmentEvent = BaseEvent & {
  readonly category: 'assignment';
  readonly kind: 'simple' | 'compound';
  readonly operator: string;
  readonly target: string;
  readonly operands: readonly ValueRepresentation[];
  readonly result: ValueRepresentation;
  readonly coercion?: readonly ValueRepresentation[];
  readonly shortCircuited?: true;
  readonly scopeCreationStep?: number;
};
```

**New master union**:
```typescript
type TraceEvent =
  | BindingEvent
  | PropertyAccessEvent
  | PureOperatorEvent         // was part of OperatorEvent union
  | ShortCircuitingOperatorEvent  // was part of OperatorEvent union
  | AssignmentEvent           // was AssignmentOperatorEvent, new category
  | LiteralEvent
  | TemplateEvent
  | ScopeEvent
  | ControlFlowEvent
  | FunctionEvent
  | WithEvent;
```

---

## What Changed vs Current — Summary

### Config
- Top-level keys mirror reference.md sections (not Aran hook categories)
- 2D matrix gates (kind × event) collapsed to flat sibling booleans
- `bindings` → `variables`, `functions` → `functionCalls`
- `controlFlow` exploded into `conditionals`, `while`, `doWhile`, `for`, `forOf`, `break`, `continue`
- `operators.assignment` → top-level `assignments`
- `operators.pure` nesting removed
- All nested field names preserved from current schema where possible

### Events
- BaseEvent gains `syntaxId`, `syntaxLoc`, `syntaxSource`
- AssignmentOperatorEvent → AssignmentEvent (new category, new kind)
- All other event shapes identical (they gain new BaseEvent fields automatically)
- OperatorEvent union simplified (no longer includes assignment)

### Architecture (5 layers)
- Pointcuts: fine-grained config gating at instrument time (tag + config → instrument or skip). ~80% of gating resolved here. Zero runtime overhead for disabled features.
- Advice: produces RawEventRecord[], doesn't emit/gate/count. Maintains scope stack, variable registry, iteration counters for data generation.
- Dispatcher: filter arrays + init/assign check → step++ → stamp metadata + syntaxId → generate → freeze → emit. Deliberately thin.
- Event generators: unchanged (pure functions producing domain fields)
- Emitter: receives final TraceEvents, handles SAB protocol

---

## Open Questions

### 1. syntaxId: nodePath or counter?

**nodePath** (e.g., `$.body.1.expression`):
- Stable across runs (same code = same IDs)
- Hierarchical (can derive parent by trimming)
- Meaningful to developers
- Longer strings in every event

**Counter** (e.g., `3`):
- Compact
- Needs a separate syntaxMap for lookups
- Not hierarchical (can't derive parent)
- Changes if code changes

**My recommendation**: nodePath. It's stable, hierarchical, and the tree utility can derive parent-child relationships without a lookup table.

### 2. `assignments` at top level vs under `variables`

**Top level** (proposed): matches reference.md structure, clean separation between
variable lifecycle (declare/init/available/read) and assignment operators.

**Under variables**: learners might look for `x = 5` under "variables" since it's
about the variable changing. But then `x += 2` is awkward — it's both an operator
and a variable write.

**Under operators**: the current location. But then `x = 5` (plain assignment)
doesn't feel like an "operator."

I chose top-level. Open to discussion.

### 3. Simple assignment (`=`) events

Currently, plain `=` assignment is traced as a binding lifecycle event
(`bindings.assign`). The new `assignments.simple` config key would control
whether the OPERATOR event fires. The binding lifecycle event (`variables.assign`)
would be a separate event about the variable changing value.

This means `let x = 5; x = 2;` could produce:
- `variables.assign` event (variable changed)
- `assignments.simple` event (the `=` operator was evaluated)

Is this double-eventing correct? Or should one subsume the other?

### 4. Scope config: worth keeping?

Scopes are not in reference.md. They're developer tooling. Options:
- Keep as proposed (for power users / future use)
- Remove entirely (simplify config)
- Default to `false` instead of `true` (opt-in)

### 5. `bindings.kind.global` removal

Proposed removing it because strict mode throws on implicit globals. But some
events currently fire for globals (e.g., `console` is a global read). Should
we keep a way to control these? Or are they covered by `functionCalls.filter`?

---

## Pushback on My Own Proposal

### Concern 1: Double events for assignments

The current system emits binding lifecycle events (declare, initialize, assign, read)
AND operator events (AssignmentOperatorEvent for compound). If we add `assignments`
as a separate config key, `x += 2` could produce BOTH `variables.assign` AND
`assignments.compound`. Is that correct or redundant?

**My take**: It's correct. They answer different questions:
- `variables.assign`: "variable x changed to 3" (lifecycle perspective)
- `assignments.compound`: "the += operator took 1 and 2 and produced 3" (operator perspective)

A learner tracing variable changes wants the first. A learner tracing operators wants the second. The syntaxId links them.

### Concern 2: Config complexity

We went from 8 top-level keys to 14. More top-level keys = more to learn. But each
key is simpler (no 2D matrix). Net cognitive load is probably similar or lower.

### Concern 3: Breaking ALL config-related tests

Every test that constructs a config object needs updating. This is expected and
acknowledged — we'll do it incrementally per the session sequence.

### Concern 4: parentSyntaxId computation

During digest, we know the nodePath of each node. But computing "nearest syntax
construct ancestor" requires knowing which node types count as syntax constructs.
This is a fixed list (ForStatement, IfStatement, etc.) — not hard, but it's a
new responsibility in the digest phase.

If the parent syntax's nodePath is a prefix of the child's nodePath, we might
not even need to store parentSyntaxId — the tree utility can derive it. But then
`syntaxLoc` and `syntaxSource` need a lookup table.

**Alternative**: skip syntaxLoc/syntaxSource on BaseEvent. The tree utility can
look up the parent construct's tag from the tagMap using the derived parent path.
This keeps events lighter but requires the tagMap to be accessible to consumers.
