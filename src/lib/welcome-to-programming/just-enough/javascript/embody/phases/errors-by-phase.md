# JS errors by phase (JEJ: strict mode, no try/catch, synchronous only)

## Phase model

```
Realm setup          ← engine populates global environment with builtins; before phase 0
Phase 0: source      ← a string; no errors possible here
Phase 1: parse and validate
  1a: tokenization   ← character-sequence problems
  1b: AST-building   ← structural/grammatical problems
  1c: validation     ← JEJ feature-scope rejections (valid JS, but outside JEJ)
Phase 2: creation    ← script-scope let/const declared as <TDZ>; block scopes lazy
Phase 3: execution   ← block scopes opened lazily; all runtime errors here
```

### Cross-phase notes

- If a phase 1 error occurs, phases 2 and 3 never begin
- **TDZ `ReferenceError`** spans two phases: binding _declared_ in phase 2,
  error _thrown_ in phase 3 when access is attempted before the declaration line
- **Block scope environment objects** are created in phase 3 when a block is
  entered — not in phase 2. Bindings inside a block that is never entered are
  never instantiated and no TDZ is ever live for them
- **`const` re-assignment** is a runtime `TypeError` in both strict and sloppy
  mode — it is not a parse-time `SyntaxError`
- **JEJ has no `try`/`catch`** — every runtime error is unhandled and terminates
  execution

---

## Error table

| Error                                     | Description                                                               | Phase                        | Parse subphase   | Notes                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------- | ---------------------------- | ---------------- | ------------------------------------------------------------------------- |
| `SyntaxError` (illegal character)         | `@`, unrecognised escape, invalid numeric literal (`0x` with no digits)   | 1 — Parse                    | 1a: Tokenization |                                                                           |
| `SyntaxError` (unterminated)              | Unterminated string, template literal, regex, or block comment            | 1 — Parse                    | 1a: Tokenization |                                                                           |
| `SyntaxError` (unexpected token)          | Valid token in wrong position — `const = 5`, `if if`                      | 1 — Parse                    | 1b: AST-building |                                                                           |
| `SyntaxError` (missing token)             | Unclosed `(` or `{`, missing expected punctuation                         | 1 — Parse                    | 1b: AST-building |                                                                           |
| `SyntaxError` (strict mode)               | Octal literals and other strict-mode-only violations                      | 1 — Parse                    | 1b: AST-building | Flagged during parse of the construct, not during tokenization            |
| `SyntaxError` (invalid assignment target) | `5 = x`, `(a + b) = c` — tokens valid, structure isn't                    | 1 — Parse                    | 1b: AST-building |                                                                           |
| `SyntaxError` (invalid context)           | `break`/`continue` outside a valid enclosing loop                         | 1 — Parse                    | 1b: AST-building |                                                                           |
| Validation rejection                      | Feature outside JEJ used — `function`, `var`, arrays, `try`/`catch`, etc. | 1 — Validate                 | 1c: Validation   | Not a JS error; a JEJ learning environment rejection                      |
| `ReferenceError` (TDZ)                    | Accessing `let`/`const` before their declaration line                     | 2 + 3 — Creation + Execution | —                | Binding declared in phase 2; `error` event thrown in phase 3              |
| `ReferenceError` (undeclared)             | Reading a name not declared in any scope in the chain                     | 3 — Execution                | —                | Distinct from TDZ — the name does not exist at all                        |
| `TypeError` (call non-function)           | `null()`, `undefined()`, calling a non-callable value                     | 3 — Execution                | —                |                                                                           |
| `TypeError` (property access)             | Reading a property on `null` or `undefined`                               | 3 — Execution                | —                |                                                                           |
| `TypeError` (const re-assignment)         | Assigning to a `const` binding                                            | 3 — Execution                | —                | Runtime TypeError in both strict and sloppy mode — NOT a parse-time error |
| `TypeError` (mixed BigInt)                | Mixing `bigint` and `number` in arithmetic — `42n + 1`                    | 3 — Execution                | —                | Must convert explicitly                                                   |
| `TypeError` (iterator)                    | `for...of` on a non-string value                                          | 3 — Execution                | —                | In JEJ, `for-of` is strings only                                          |
| `RangeError`                              | Value outside allowed range — `new Array(-1)`, `toFixed(200)`             | 3 — Execution                | —                |                                                                           |
| `RangeError` (loop guard)                 | Loop iteration limit exceeded                                             | 3 — Execution                | —                | Generated by the JEJ learning environment to prevent infinite loops       |
