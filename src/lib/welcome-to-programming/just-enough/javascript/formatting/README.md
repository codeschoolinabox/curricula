# formatting

Formats JavaScript code using recast's prettyPrint and checks whether code is
already formatted. Works on any syntactically valid JavaScript — not restricted
to JeJ.

## Structure

| File              | Purpose                                           |
| ----------------- | ------------------------------------------------- |
| `types.ts`        | `CheckFormatResult` type                          |
| `format.ts`       | `format(code)` — recast prettyPrint wrapper       |
| `check-format.ts` | `checkFormat(code)` — compares input to formatted |
| `tests/`          | Unit tests                                        |

## API

### `format`

```ts
function format(code: string): string;
```

- Synchronous — recast.prettyPrint is sync
- Returns formatted code, or the original code unchanged if recast fails
  (graceful degradation)
- No options parameter — always formats the JeJ way
- Fixed config: `{ useTabs: true, tabWidth: 4, quote: 'single', wrapColumn: 80 }`
- Uses accessibility-first defaults: tabs for indentation, 4-space tab width,
  single quotes, trailing commas, explicit semicolons

### `checkFormat`

```ts
function checkFormat(code: string): { formatted: boolean };
```

- Synchronous — formats with recast and compares output to input
  (`format(code) === code`)
- Returns `{ formatted: true }` if the code matches the expected format
- Returns `{ formatted: true }` if recast throws (don't block on formatter bugs)
- Used internally by the code object factory and as a pipeline gate for
  execution

## Navigation

- [DOCS.md](./DOCS.md) — design decisions and rationale
- [../api/README.md](../api/README.md) — public API wrappers (`format`,
  `checkFormat`)
