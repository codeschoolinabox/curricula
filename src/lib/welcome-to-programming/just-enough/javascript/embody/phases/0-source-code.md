# Phase 0: source code

## Source code is text

Before any phase begins, your program is just a string — a sequence of
characters in a file. Nothing more. `typeof sourceCode === 'string'` is
literally true. The `.js` extension is a convention that signals intent to tools
and humans; the parser does not read the filename. The file on disk is bytes in
an encoding (UTF-8 by default for JavaScript), and the engine's first act is to
decode those bytes into a string. That string is what gets handed to phase 1.

There is nothing inherently executable about source code. It becomes executable
only when a particular kind of reader — a parser — processes it according to a
particular set of rules. Before that happens, it is text in the same category as
a recipe, a poem, or a set of instructions in a natural language.

---

## Multiple audiences

Source code sits in a rhetorical situation: it is written by someone, for
readers, in a context. What makes it unusual is that it has more than one
audience simultaneously, and those audiences read it very differently.

**Developers** read your code through comments, variable names, and structure.
`console.log` and `console.assert` are the tools you use to communicate what's
happening to this audience. Two programs that behave identically for a computer
can communicate very differently to a developer — naming, spacing, and comment
placement are all micro-decisions that shape how code reads.

**The computer** executes your code. The engine is a mechanical, unforgiving
reader. It applies a formal grammar, character by character and token by token.
It has no tolerance for ambiguity, no ability to infer intent, and no interest
in what the code means to a human. A variable named `x` and a variable named
`accountBalance` are identical to the engine; they are not identical to a
developer reading your code.

**Users** interact with your running program through `prompt`, `confirm`, and
`alert` — browser dialogs that pause execution until they respond. From the
user's perspective, your source code is entirely invisible. They experience only
behavior: what the program asks, what it shows, what it does.

These three audiences are present in every JEJ program simultaneously. The same
line of source text is instruction to a machine, communication to a developer,
and — when it reaches an I/O call — an interaction with a user. Good programs
serve all three. Code that is correct for the computer but unreadable to
developers, or functional but confusing to users, is not fully working code.

---

## What survives into later phases

Not everything in the source string survives all the way through to execution:

| Source feature                   | Survives to                                               |
| -------------------------------- | --------------------------------------------------------- |
| Keywords, operators, punctuation | AST structure                                             |
| Identifier names                 | AST (as string fields), then execution (as binding names) |
| Literal values                   | AST (as parsed values)                                    |
| Whitespace                       | Discarded after tokenization (recoverable from offsets)   |
| Comments                         | Discarded after tokenization (recoverable via callback)   |
| Formatting / indentation         | Discarded after tokenization                              |

The source string itself is never modified. All later phases read from it using
character offsets — this is how error messages include line and column numbers,
and how the tracer links every event back to the exact source range that
produced it.

---

## The source string as ground truth

Because every token and every AST node carries `start` and `end` character
offsets into the original source string, the source string is the single
lossless record from which everything else is derived. You can always recover
the original text of any token or AST node with
`source.slice(node.start, node.end)`. Whitespace and comments are recoverable
from the gaps between token offsets. Nothing is lost — it is just not
represented in the token stream or AST unless you ask for it explicitly.

This is phase 0: a string, waiting to be read.
