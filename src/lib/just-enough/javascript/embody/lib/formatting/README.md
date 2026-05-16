# formatting

Formats JavaScript code using Prettier (standalone) and checks whether code is
already formatted. Works on any syntactically valid JavaScript — not restricted
to JeJ.

## Structure

| File              | Purpose                                           |
| ----------------- | ------------------------------------------------- |
| `types.ts`        | `CheckFormatResult` type                          |
| `format.ts`       | `format(code)` — Prettier wrapper                 |
| `check-format.ts` | `checkFormat(code)` — compares input to formatted |
| `tests/`          | Unit tests                                        |

## API

### `format`

```ts
function format(code: string): Promise<string>;
```

- Asynchronous — Prettier standalone is async
- Resolves to formatted code, or the original code unchanged if Prettier
  throws (graceful degradation, e.g. on parse errors)
- No options parameter — always formats the JeJ way
- Fixed config:
  `{ parser: 'babel', useTabs: true, tabWidth: 4, printWidth: 80, singleQuote: true, semi: true }`
- Uses accessibility-first defaults: tabs for indentation, 4-space tab width,
  single quotes, explicit semicolons
- **Blank-line preservation:** 1+ consecutive blank lines in source → exactly 1
  blank line in output (Prettier's standard "paragraph break" semantics)

### `checkFormat`

```ts
function checkFormat(code: string): Promise<{ formatted: boolean }>;
```

- Asynchronous — awaits `format` then compares output to input
  (`(await format(code)) === code`)
- Resolves to `{ formatted: true }` if the code matches the expected format
- Resolves to `{ formatted: true }` if Prettier throws (don't block on
  formatter bugs)
- Used as a pipeline gate by execution wrappers (`run`, `intercept`)

## Navigation

- [DOCS.md](./DOCS.md) — design decisions and rationale
- [../validating/README.md](../validating/README.md) — `validate(code)` and
  `isJej(code)` (the formatting + validation composition lives there)
- [../evaluating/intercept/README.md](../evaluating/intercept/README.md) — `run()` uses
  `checkFormat` as an execution gate
