# Phase 1: parse and validate

## Overview

Phase 1 takes the source string from phase 0 and produces three things:

- A **token stream** — a flat, ordered sequence of meaningful units extracted
  from the source
- A **comment list** — all comments in source order, stripped from the token
  stream but preserved separately
- An **AST** (Abstract Syntax Tree) — a nested structure describing the
  grammatical shape of the program

This happens in three sequential subphases: **tokenization**, **AST-building**,
and **validation**. If any subphase fails, phases 2 and 3 never begin.

---

## Subphase 1a: tokenization

The tokenizer reads the source string character by character and groups
characters into **tokens** — the smallest meaningful units of the language. It
does not interpret grammar; it only recognises patterns.

Each token has:

```ts
{
  type: {
    label: string        // e.g. "const", "name", "num", "+/-", "="
    keyword: string | undefined
    beforeExpr: boolean  // can this token precede an expression?
    startsExpr: boolean  // can this token begin an expression?
    isAssign: boolean
    binop: number | null // operator precedence if binary operator, else null
    prefix: boolean
    postfix: boolean
  }
  value: string | number | bigint | undefined  // parsed value; undefined for punctuation
  start: number          // character offset into source string, inclusive
  end: number            // character offset into source string, exclusive
  loc: {
    start: { line: number, column: number }  // 1-based line, 0-based column
    end:   { line: number, column: number }
  }
}
```

The raw source text of any token is always recoverable as
`source.slice(token.start, token.end)`.

### What tokenization discards

**Whitespace** is never emitted as a token. It is implicit in the gaps between
`token.end` and the next `token.start`. The original whitespace characters
(spaces, tabs, newlines) are recoverable from the source string using those
offsets.

**Comments** are stripped from the token stream. They are emitted separately via
an `onComment` callback if requested, with their own `start`/`end` offsets and a
flag distinguishing `/* block */` from `// line` style. Their raw text is
recoverable as `source.slice(comment.start, comment.end)`.

### What tokenization catches

Tokenization errors are character-sequence problems — the input contains a
sequence of characters that cannot form a valid token:

- Illegal characters (`@` in an unexpected context, unrecognised Unicode)
- Unterminated string literals, template literals, regex literals, block
  comments
- Invalid numeric literals (`0x` with no hex digits following)
- Unterminated BigInt-like sequences

These throw a `SyntaxError` immediately, before any grammar is applied.

### A note on context-sensitivity

The tokenizer carries a small amount of state to resolve genuine ambiguities —
most importantly, whether `/` should be tokenised as division or as the start of
a regex literal. This decision depends on whether a value could have just ended
(division) or whether an expression is expected (regex). The `beforeExpr` flag
on `TokenType` encodes this state. The tokenizer is therefore not fully
independent of the parser, but for error-detection purposes the subphase
boundary holds: tokenization errors fire before grammar rules are applied.

---

## Subphase 1b: AST-building

The parser reads the token stream and applies the JavaScript grammar rules to
produce a tree of **AST nodes**. Each node represents a grammatical construct —
a statement, an expression, a declaration, a pattern.

### AST node shape

Every node shares a common base:

```ts
{
  type: string     // e.g. "VariableDeclaration", "BinaryExpression", "Identifier"
  start: number    // character offset of first character, inclusive
  end: number      // character offset after last character, exclusive
  loc: {
    start: { line: number, column: number }
    end:   { line: number, column: number }
  }
  // ... type-specific fields
}
```

The `start`/`end` offsets use the **same coordinate system** as token offsets. A
node's span always covers exactly the source range from its first token's
`start` to its last token's `end`.

### Node types in JEJ

The following node types are produced by valid JEJ programs:

| **Node type**         | **Example**                                               |
| --------------------- | --------------------------------------------------------- |
| `Program`             | the root node, always present                             |
| `VariableDeclaration` | `let `x `= `1`/`const `x `= `1`                           |
| `VariableDeclarator`  | `x `= `1` (the name + init pair inside a declaration)     |
| `ExpressionStatement` | `console.log(x)` as a standalone statement                |
| `BlockStatement`      | `{ `... `}`                                               |
| `IfStatement`         | `if `(cond) `{ `} `else `{ `}`                            |
| `WhileStatement`      | `while `(cond) `{ `}``                                    |
| `DoWhileStatement`    | `do `{ `} `while `(cond)`                                 |
| `ForStatement`        | `for `(init; `test; `update) `{ `}``                      |
| `ForOfStatement`      | `for `(const `char `of `str) `{ `}` (strings only in JEJ) |
| `BreakStatement`      | `break`                                                   |
| `ContinueStatement`   | `continue`                                                |

### Expressions

| Node type             | Example                                   |
| --------------------- | ----------------------------------------- |
| Identifier            | x, console, Math                          |
| Literal               | 1, 'hello', true, null, /pattern/flags    |
| BigIntLiteral         | 42n                                       |
| TemplateLiteral       | `hello ${name}`                           |
| TemplateElement       | static string parts of a template literal |
| BinaryExpression      | x + 1, y > 2, 'a' in obj                  |
| UnaryExpression       | -x, !flag, typeof x                       |
| LogicalExpression     | a && b, a \|\| b, a ?? b                  |
| ConditionalExpression | cond ? a : b                              |
| AssignmentExpression  | x = 1, x += 1, x ??= defaultVal           |
| MemberExpression      | obj.prop, str[i], str?.prop               |
| ChainExpression       | wraps optional chaining (?.) sequences    |
| CallExpression        | console.log(x), str.toUpperCase()         |
| NewExpression         | new Date() (Date only in JEJ)             |
| UpdateExpression      | i++, ++i, i--, --i                        |

**Note on regex**: a regex literal (`/pattern/flags`) is parsed as a `Literal`
node with `value` being a `RegExp` object.

### The relationship between tokens and AST nodes

Tokens and AST nodes share the same offset coordinate system but occupy
different layers:

- **Leaf nodes** (`Identifier`, `Literal`, `BigIntLiteral`) correspond 1:1 with
  a single token. Their offsets match exactly.
- **Interior nodes** span multiple tokens. Their `start` is the first token's
  `start`; their `end` is the last token's `end`.
- **Some tokens have no corresponding AST node** — operators (`+`, `=`),
  punctuation (`(`, `)`, `{`, `}`), and keywords (`let`, `if`, `while`) are
  absorbed into the structure of their parent node or stored as a plain string
  field (e.g. `BinaryExpression.operator`).

### What AST-building catches

AST-building errors are structural/grammatical — the tokens are individually
valid but their arrangement violates the grammar:

- Unexpected token in context (`const = 5`)
- Missing expected token (unclosed `(` or `{`)
- Strict mode violations (octal literals)
- Invalid assignment targets (`5 = x`)
- `break`/`continue` outside a valid enclosing loop

### What is NOT in the AST

- Whitespace
- Comments (stripped during tokenization)
- Automatic Semicolon Insertion (ASI) — the parser inserts virtual semicolons
  where the grammar requires them, but they leave no trace in the AST

---

## Subphase 1c: validation

After a valid AST is produced, the JEJ learning environment runs a **validation
check**: does this program use only features within JEJ? Using features outside
the reference — user-defined functions, arrays, `var`, `try`/`catch`,
destructuring, `async`/`await`, etc. — produces a **rejection** that must be
fixed before the program can run.

Validation errors are distinct from syntax errors:

|             | SyntaxError        | Validation rejection                 |
| ----------- | ------------------ | ------------------------------------ |
| Detected by | The JS parser      | The JEJ learning environment         |
| Cause       | Invalid JavaScript | Valid JavaScript outside JEJ's scope |
| Example     | `const = 5`        | `function foo() {}`                  |
| Fixable by  | Fixing the syntax  | Removing or replacing the feature    |

Validation is a learning constraint, not a language constraint. JEJ code that
passes validation is valid JavaScript and will run in any standard environment.
The constraint exists to keep the learner's attention on a tractable subset —
few options, many possibilities.

---

## Phase 1 outputs

At the end of phase 1, three artefacts exist and phase 2 can begin:

1. **Token stream** — flat array of token objects in source order
2. **Comment list** — flat array of comment objects in source order
3. **AST** — tree rooted at a `Program` node, with every node carrying source
   offsets

The source string itself is unchanged and retained as the coordinate reference
for all three.
