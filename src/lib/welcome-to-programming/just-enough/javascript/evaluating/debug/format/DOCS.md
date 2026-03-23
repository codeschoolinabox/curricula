# Format — Architecture & Decisions

## Why `prettier/standalone`?

The format module runs in the browser (inside an educational web app). The
standard `prettier` package depends on Node.js `fs` — unusable in browser
contexts. `prettier/standalone` is Prettier's official browser-compatible entry
point, designed for exactly this use case.

The tradeoff: plugins (`babel`, `estree`) must be passed explicitly at call time
rather than auto-discovered. This is a one-line cost for full browser
compatibility.

## Why Graceful Degradation?

If Prettier throws (e.g., on syntactically invalid learner code), `formatCode`
returns the original code unchanged rather than propagating the error.

Formatting is cosmetic — the learner's code still runs correctly without it. A
formatting failure should never prevent the debug lens from executing. The
alternative (letting it throw) would require every caller to handle formatting
errors, adding complexity for no user-visible benefit.

## Why These Defaults?

- **`useTabs: true`** — Accessibility. Screen readers and users with visual
  impairments can configure tab display width in their editor/browser. Spaces
  lock in a fixed width.
- **`tabWidth: 4`** — Readability for beginners. Wider indentation makes nesting
  levels more visually distinct.
- **`singleQuote: true`** — Consistency with Just Enough JavaScript conventions.
- **`trailingComma: 'all'`** — Cleaner diffs when learners add items to arrays
  or objects.
- **`semi: true`** — Explicit semicolons reduce ASI surprises for beginners.
