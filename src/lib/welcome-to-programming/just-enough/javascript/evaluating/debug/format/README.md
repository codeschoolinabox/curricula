# Format

Formats learner JavaScript using Prettier's browser-compatible standalone API.

## Why

When loop guards are injected into learner code via AST transformation, the
output can have messy whitespace and inconsistent formatting. This module cleans
it up before the code is displayed or executed, so the learner sees readable
code in the debugger.

## API

```ts
async function formatCode(
	code: string,
	options?: Partial<Options>,
): Promise<string>;
```

- Returns formatted code, or the original code unchanged if Prettier fails
  (graceful degradation — formatting is cosmetic, not critical)
- Uses accessibility-first defaults: tabs for indentation, 4-space tab width

## Files

| File        | Purpose                     |
| ----------- | --------------------------- |
| `format.ts` | Prettier standalone wrapper |
| `tests/`    | Unit tests                  |
