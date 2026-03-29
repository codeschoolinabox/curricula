# advice

Aran advice functions — the instrumentation hooks that capture execution events.
Each file handles a category of JavaScript operations. `index.js` assembles the
full advice object from all categories.

## Files

| File               | Captures                                              |
| ------------------ | ----------------------------------------------------- |
| `blocks.js`        | Block scope entry/exit (function bodies, if/else, loops) |
| `control-flow.js`  | Conditionals, loops, break/continue                   |
| `error-handling.js` | try/catch/finally, throw                             |
| `exception.js`     | Uncaught exceptions during instrumented execution     |
| `functions.js`     | Function calls, returns, hoisting                     |
| `operators.js`     | Binary, unary, logical, and conditional operators     |
| `variables.js`     | Variable declarations, reads, assignments             |
| `index.js`         | Assembles all advice into the `ADVICE` object         |
