# Tracer Walkthroughs

Event sequences for every JEJ construct. Each walkthrough shows the flat event
stream the tracer emits.

See [notional-machine.md](./notional-machine.md) for component definitions and
[tracer.md](./tracer.md) for the config structure and event shape.

**Note**: these walkthroughs communicate the general event model and patterns. Some details may be missing or incorrect as the event architecture evolves — the tracer implementation is the authoritative source.

## Dual-event convention

When an identifier is evaluated, TWO events fire from different NM levels:

- **`identifiers.read(name)`** — visual-syntax: "I see this identifier in the
  code." Fires for ALL identifier nodes: scope-chain (`x`, `Math`) AND
  property-key (`.max`, `.length`). Config: `expression.identifiers.read`.
- **`binding-access(name)`** — behind-the-scenes (for scope-chain identifiers):
  "the VM looked up this variable." Config: `bindings.events.access`.
- **`register-check` / `proto-check`** — behind-the-scenes (for property-key
  identifiers): "the VM resolved this property."

Similarly for writes: `assignment operator` (visual) + `binding-update`
(behind-the-scenes). Each category is standalone-useful.

---

## Hoisting — scope creation before statements

```text
scope-create(script)
binding-declare(greeting, let)        ← hoisted, TDZ starts
binding-declare(shout, let)           ← hoisted, TDZ starts
scope-enter(script)                   ← NOW statements execute
enter-stmt(VariableDeclaration)       ← first statement runs
  ...
```

---

## Literals: `5`, `'hello'`, `true`

Literals are leaf expressions — they resolve directly to their value with no
enter/exit bracket and no sub-events.

```text
resolve(5)                            ← number literal
resolve('hello')                      ← string literal
resolve(true)                         ← boolean literal
resolve(null)                         ← null literal
resolve(undefined)                    ← undefined literal
resolve(42n)                          ← bigint literal
resolve(/\d+/)                        ← regex literal
```

---

## Arithmetic with precedence: `1 + 2 * 3`

```text
enter-expr(BinaryExpression, +)
  resolve(1)                          ← literal 1 (leaf)
  enter-expr(BinaryExpression, *)
    resolve(2)
    resolve(3)
    operator(*, operands: [2,3], operandSteps: [4,5])
  exit-expr(*, value: 6)
  resolve(6)                          ← * result
  operator(+, operands: [1,6], operandSteps: [2,8])
exit-expr(+, value: 7)
resolve(7)                            ← + result
```

---

## Comparison operator: `x > 3` (x is 5)

```text
enter-expr(BinaryExpression, >)
  identifiers.read(x)                ← visual: identifier x
  scope-check(script, hit: x)
  binding-access(x, value: 5)        ← behind-the-scenes: binding lookup
  resolve(5)
  resolve(3)                          ← literal 3
  operator(>, operands: [5,3])
exit-expr(>, value: true)
resolve(true)
```

---

## typeof operator: `typeof x`

```text
enter-expr(UnaryExpression, typeof)
  identifiers.read(x)
  scope-check(script, hit: x)
  binding-access(x, value: 'hello')
  resolve('hello')
  operator(typeof, operands: ['hello'])
exit-expr(typeof, value: 'string')
resolve('string')
```

---

## Negation: `!x` (x is 0)

```text
enter-expr(UnaryExpression, !)
  identifiers.read(x)
  scope-check(script, hit: x)
  binding-access(x, value: 0)
  resolve(0)
  coerce(0 → false, context: boolean)  ← truthiness coercion
  operator(!, operands: [false])
exit-expr(!, value: true)
resolve(true)
```

---

## Coercion: `'5' + 1`

```text
enter-expr(BinaryExpression, +)
  resolve('5')                        ← left: string
  resolve(1)                          ← right: number
  coerce(1 → '1', context: string-concatenation)
  operator(+, operands: ['5','1'])    ← string concatenation
exit-expr(+, value: '51')
resolve('51')
```

---

## Short-circuit: `x && y` (x is falsy)

```text
enter-expr(LogicalExpression, &&)
  identifiers.read(x)
  scope-check(script, hit: x)
  binding-access(x, value: 0)
  resolve(0)                          ← left operand is falsy
  operator(&&, shortCircuited: true, left: 0)
exit-expr(&&, value: 0)               ← right NEVER evaluated
resolve(0)
```

---

## Assignment: `x = x + 1` (x starts as 5)

```text
enter-expr(AssignmentExpression, =)
  enter-expr(BinaryExpression, +)
    identifiers.read(x)              ← visual: identifier x
    scope-check(script, hit: x)
    binding-access(x, value: 5)      ← behind-the-scenes: binding lookup
    resolve(5)
    resolve(1)                        ← literal 1
    operator(+, operands: [5,1])
  exit-expr(+, value: 6)
  resolve(6)                          ← RHS result
  identifiers.read(x)                ← visual: target identifier
  scope-check(script, hit: x)
  operator(=, target: x)
  binding-update(x, value: 6)        ← behind-the-scenes: binding mutated
exit-expr(=, value: 6)
resolve(6)
```

---

## Compound assignment: `x += 3` (x starts as 5)

```text
enter-expr(AssignmentExpression, +=)
  identifiers.read(x)                ← visual: read current value
  scope-check(script, hit: x)
  binding-access(x, value: 5)
  resolve(5)                          ← current value
  resolve(3)                          ← RHS
  operator(+, operands: [5,3])        ← the addition inside +=
  resolve(8)
  binding-update(x, value: 8)
exit-expr(+=, value: 8)
resolve(8)
```

---

## Increment: `x++` (x starts as 5)

Desugared into read → arithmetic → assign. All share the UpdateExpression
nodePath:

```text
enter-expr(UpdateExpression, ++ postfix)
  identifiers.read(x)
  scope-check(script, hit: x)
  binding-access(x, value: 5)
  resolve(5)                          ← current value
  operator(+, operands: [5, 1])       ← +1
  resolve(6)                          ← new value
  identifiers.read(x)                ← target for write
  scope-check(script, hit: x)
  binding-update(x, value: 6)
exit-expr(UpdateExpression, value: 5) ← POSTFIX returns OLD value
resolve(5)
```

For prefix `++x`: resolves to 6 (new value).

---

## Property access (dot): `str.length` (str is 'hello')

```text
enter-expr(MemberExpression, .length)
  identifiers.read(str)              ← visual: scope-chain identifier
  scope-check(script, hit: str)
  binding-access(str, value: 'hello')
  resolve('hello')
  expression.properties.dot(.length) ← property access syntax
  identifiers.read(length)           ← visual: property-key identifier
  proto-check(value: 'hello', miss)
  proto-check(String.prototype, hit: length)
  resolve(5)                          ← the length value
exit-expr(MemberExpression, value: 5)
resolve(5)
```

---

## Property access (bracket): `str[0]` (str is 'hello')

```text
enter-expr(MemberExpression, [])
  identifiers.read(str)
  scope-check(script, hit: str)
  binding-access(str, value: 'hello')
  resolve('hello')
  resolve(0)                          ← computed key (literal, no identifiers.read)
  expression.properties.bracket([0])
  resolve('h')                        ← the character
exit-expr(MemberExpression, value: 'h')
resolve('h')
```

Note: `0` is a literal, NOT an identifier. No `identifiers.read` for the key.
For `str[varName]`: `identifiers.read(varName)` would fire for the key.

---

## Optional chaining: `input?.length` (input is null)

```text
enter-expr(MemberExpression, ?.)
  identifiers.read(input)
  scope-check(script, hit: input)
  binding-access(input, value: null)
  resolve(null)
  expression.properties.optionalChaining(?.length)
  [short-circuited: input is null/undefined]
exit-expr(?., value: undefined, shortCircuited: true)
resolve(undefined)
```

When `input` is NOT null: normal property access + proto-check fires.

---

## Function call with prototype lookup: `str.toUpperCase()`

```text
enter-expr(CallExpression)
  enter-expr(MemberExpression, .toUpperCase)
    identifiers.read(str)            ← scope-chain identifier
    scope-check(script, hit: str)
    binding-access(str, value: 'hello')
    resolve('hello')
    expression.properties.dot(.toUpperCase)
    identifiers.read(toUpperCase)    ← property-key identifier
    proto-check(value: 'hello', miss)
    proto-check(String.prototype, hit: toUpperCase)
    resolve(function toUpperCase)
  exit-expr(MemberExpression)
  call(toUpperCase, this: 'hello', args: [])
exit-expr(CallExpression, value: 'HELLO')
resolve('HELLO')
```

---

## Template literal: `` `hello ${name}, you are ${age}` ``

```text
enter-expr(TemplateLiteral)
  template-begin(strings: ['hello ', ', you are ', ''], expressionCount: 2)
  identifiers.read(name)
  scope-check(script, hit: name)
  binding-access(name, value: 'Alice')
  resolve('Alice')
  coerce('Alice' → 'Alice', context: template)   ← already string
  template-evaluation(index: 0, value: 'Alice')
  identifiers.read(age)
  scope-check(script, hit: age)
  binding-access(age, value: 30)
  resolve(30)
  coerce(30 → '30', context: template)           ← number to string
  template-evaluation(index: 1, value: '30')
  template-end(beginStep: N)
exit-expr(TemplateLiteral, value: 'hello Alice, you are 30')
resolve('hello Alice, you are 30')
```

---

## Variable declaration: `let x = 5;`

```text
[At scope creation — BEFORE this line runs:]
scope-create(script)
binding-declare(x, let)               ← hoisted, TDZ
scope-enter(script)

[When the let x = 5; line executes:]
enter-stmt(VariableDeclaration)
  resolve(5)                          ← initializer
  binding-initialize(x, value: 5)    ← TDZ ends
  binding-available(x)
exit-stmt(VariableDeclaration, normal)
```

---

## Const declaration: `const PI = 3.14;`

```text
[At scope creation:]
scope-create(block)
binding-declare(PI, const)            ← hoisted, TDZ
scope-enter(block)

[When the const PI = 3.14; line executes:]
enter-stmt(VariableDeclaration)
  resolve(3.14)
  binding-initialize(PI, value: 3.14) ← TDZ ends
  binding-available(PI)
exit-stmt(VariableDeclaration, normal)
```

A later `PI = 4;` → TypeError (const cannot be updated).

---

## Conditional with boolean coercion: `if (x) { ... }`

```text
enter-stmt(IfStatement)
  identifiers.read(x)
  scope-check(script, hit: x)
  binding-access(x, value: 'hello')
  resolve('hello')                    ← test value (string, not boolean)
  coerce('hello' → true, context: boolean)
  [branch entered: consequent]
  enter-stmt(BlockStatement)
    scope-create(block)
    scope-enter(block)
    [body events]
    scope-completion(block)
    scope-leave(block)
  exit-stmt(BlockStatement, normal)
exit-stmt(IfStatement, normal)
```

---

## While loop: `while (i < 3) { i = i + 1; }` (i starts as 0)

```text
enter-stmt(WhileStatement)

  [test — iteration 0]
  enter-expr(BinaryExpression, <)
    identifiers.read(i)
    scope-check(script, hit: i)
    binding-access(i, value: 0)
    resolve(0)
    resolve(3)
    operator(<, [0,3])
  exit-expr(<, value: true)
  resolve(true)                       ← true → enter body

  [body — iteration 0]
  scope-create(block)
  scope-enter(block)
  enter-stmt(BlockStatement)
    [assignment events: i = i + 1 → i becomes 1]
  exit-stmt(BlockStatement, normal)
  scope-completion(block)
  scope-leave(block)

  [test — iteration 1]
  ...resolve(true)

  [body — iteration 1]
  ...[i becomes 2]

  [test — iteration 2]
  ...resolve(true)

  [body — iteration 2]
  ...[i becomes 3]

  [test — iteration 3]
  ...resolve(false)                   ← false → exit loop

exit-stmt(WhileStatement, normal)
```

---

## For loop: `for (let i = 0; i < 3; i = i + 1) { ... }`

```text
enter-stmt(ForStatement)

  [setup phase]
  scope-create(block)                 ← for-loop's own scope
  binding-declare(i, let)
  binding-initialize(i, value: 0)
  binding-available(i)
  scope-enter(block)

  [test — iteration 0]
  resolve(true)                       ← i < 3

  [body — iteration 0]
  scope-create(block)                 ← body scope
  scope-enter(block)
  enter-stmt(BlockStatement)
    [body events]
  exit-stmt(BlockStatement, normal)
  scope-completion(block)
  scope-leave(block)

  [update phase]
  [assignment events: i = i + 1]

  [test — iteration 1]
  ...

  [final test]
  resolve(false)                      ← exit loop

  scope-completion(block)             ← for-loop scope exits
  scope-leave(block)

exit-stmt(ForStatement, normal)
```

---

## Do-while loop: `do { i = i + 1; } while (i < 3);` (i starts as 0)

Body runs FIRST, then test:

```text
enter-stmt(DoWhileStatement)

  [iteration 0 — body BEFORE first test]
  scope-create(block)
  scope-enter(block)
  enter-stmt(BlockStatement)
    [assignment events: i = i + 1]
  exit-stmt(BlockStatement, normal)
  scope-completion(block)
  scope-leave(block)

  [test AFTER body]
  resolve(true)                       ← true → loop again

  [iteration 1...]
  ...

  [final test]
  resolve(false)                      ← exit loop

exit-stmt(DoWhileStatement, normal)
```

---

## For-of loop: `for (const c of str) { ... }` (str is 'hi')

```text
enter-stmt(ForOfStatement)
  identifiers.read(str)
  scope-check(script, hit: str)
  binding-access(str, value: 'hi')
  resolve('hi')                       ← the iterable

  [iteration 0]
  scope-create(block)
  binding-declare(c, const)
  binding-initialize(c, 'h')
  binding-available(c)
  scope-enter(block)
  enter-stmt(BlockStatement)
    [body events]
  exit-stmt(BlockStatement, normal)
  scope-completion(block)
  scope-leave(block)

  [iteration 1]
  scope-create(block)
  binding-declare(c, const)
  binding-initialize(c, 'i')
  binding-available(c)
  scope-enter(block)
  enter-stmt(BlockStatement)
    [body events]
  exit-stmt(BlockStatement, normal)
  scope-completion(block)
  scope-leave(block)

exit-stmt(ForOfStatement, normal)
```

---

## Break in a for loop

```text
enter-stmt(ForStatement)
  [iterations 0-1: no break]
  ...

  [iteration 2 — BREAK]
  scope-create(block)
  scope-enter(block)
  enter-stmt(BlockStatement)
    enter-stmt(IfStatement)
      resolve(true)                   ← condition met
      enter-stmt(BlockStatement)
        scope-create(block)
        scope-enter(block)
        enter-stmt(BreakStatement)
        exit-stmt(BreakStatement, break)
        scope-interrupt(block)
        scope-leave(block)
      exit-stmt(BlockStatement, break)
    exit-stmt(IfStatement, break)     ← propagates up
  exit-stmt(BlockStatement, break)
  scope-interrupt(block)              ← NOT completion
  scope-leave(block)                  ← always fires

exit-stmt(ForStatement, break)
```

---

## Continue statement

```text
enter-stmt(ForStatement)
  [iteration 0 — condition not met, no continue]
  ...

  [iteration 1 — CONTINUE]
  scope-create(block)
  scope-enter(block)
  enter-stmt(BlockStatement)
    enter-stmt(IfStatement)
      resolve(true)
      enter-stmt(BlockStatement)
        scope-create(block)
        scope-enter(block)
        enter-stmt(ContinueStatement)
        exit-stmt(ContinueStatement, continue)
        scope-interrupt(block)
        scope-leave(block)
      exit-stmt(BlockStatement, continue)
    exit-stmt(IfStatement, continue)
  exit-stmt(BlockStatement, continue)
  scope-interrupt(block)
  scope-leave(block)

  [update phase runs, then next test]
  ...

exit-stmt(ForStatement, normal)
```

`continue` skips the rest of the body and goes to the update+test. The loop
itself exits `normal` (not `continue`).

---

## Ternary operator: `x > 0 ? 'positive' : 'non-positive'` (x is 5)

```text
enter-expr(ConditionalExpression)
  enter-expr(BinaryExpression, >)
    identifiers.read(x)
    scope-check(script, hit: x)
    binding-access(x, value: 5)
    resolve(5)
    resolve(0)
    operator(>, [5, 0])
  exit-expr(>, value: true)
  resolve(true)                       ← test result

  [consequent — alternate SKIPPED]
  resolve('positive')

exit-expr(ConditionalExpression, value: 'positive')
resolve('positive')
```

---

## Logical compound assignment: `x ??= 'fallback'`

When x is null (RHS evaluates, write happens):

```text
enter-expr(AssignmentExpression, ??=)
  identifiers.read(x)
  scope-check(script, hit: x)
  binding-access(x, value: null)
  resolve(null)
  resolve('fallback')                 ← RHS
  identifiers.read(x)                ← target for write
  scope-check(script, hit: x)
  binding-update(x, value: 'fallback')
exit-expr(??=, value: 'fallback')
resolve('fallback')
```

When x is NOT nullish (short-circuit):

```text
enter-expr(AssignmentExpression, ??=)
  identifiers.read(x)
  scope-check(script, hit: x)
  binding-access(x, value: 'hello')
  resolve('hello')
  operator(??=, shortCircuited: true)
exit-expr(??=, value: 'hello')        ← no RHS, no update
resolve('hello')
```

---

## Failed name resolution: `undeclaredVar`

```text
identifiers.read(undeclaredVar)       ← visual: identifier seen
scope-check(block, miss)
scope-check(script, miss)
scope-check(global, miss)
error(ReferenceError, "undeclaredVar is not defined", phase: execution)
```

---

## TDZ access error: accessing `let x` before its declaration

```text
[At scope creation:]
scope-create(block)
binding-declare(x, let)               ← x in TDZ

[Attempting to read x before let x = 5;:]
identifiers.read(x)                  ← visual: identifier seen
scope-check(block, hit: x)
binding-access(x, TDZ: true)         ← found but in TDZ
error(ReferenceError, "Cannot access 'x' before initialization", phase: execution)
```
