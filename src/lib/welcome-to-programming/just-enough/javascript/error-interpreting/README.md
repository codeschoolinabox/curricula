# Error Interpreting

Offline, pure function that takes a JEJ (Just Enough JavaScript) program's
source code and the error it produced, and returns a structured, human-friendly
interpretation grounded in computing education research on novice misconceptions.

Browser-compatible — no Node.js APIs. All explanation data is inline TypeScript.

## Public API

```typescript
import interpretError from './interpret-error.js';

const result = interpretError(
  'console.log(userName);',
  { name: 'ReferenceError', message: 'userName is not defined', line: 1 },
);

result.whatWentWrong;           // markdown string
result.howToFix;               // markdown string
result.likelyMisunderstanding; // markdown string
result.howToAdjust;            // markdown string
result.seeAlso;                // "variables" (JEJ reference section)
result.context;                // { errorName, name, expression, ... }
```

## Structure

| File                      | Purpose                                          |
| ------------------------- | ------------------------------------------------ |
| `types.ts`                | All types for the module                         |
| `explanations.ts`         | Frozen array of 20 explanation patterns (inline) |
| `interpret-error.ts`      | Main public function (orchestrator)              |
| `match-explanation.ts`    | Matches an error to an explanation pattern        |
| `extract-context.ts`      | AST analysis + pattern extraction from error     |
| `interpolate-template.ts` | Fills `{{placeholders}}` in explanation markdown  |
| `parse-best-effort.ts`    | Acorn parse that never throws                    |
| `find-node-at-line.ts`    | Locates deepest AST node at a given line         |

## Explanation Patterns

All 20 error patterns live in `explanations.ts` as a frozen array. Each entry
has `{{placeholder}}` tokens in its text fields that are filled at
interpretation time. See the JSDoc in `explanations.ts` for the full placeholder
reference and editing guidelines.
