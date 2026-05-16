# Template Event Generators

Three generators for template literal lifecycle: begin, evaluation, end.

## Files

- `create-template-begin-event.ts` — emitted when template evaluation starts.
  Carries static string parts and expression count.
- `create-template-evaluation-event.ts` — emitted for each `${}` expression.
  Carries the evaluated value and references the begin event.
- `create-template-end-event.ts` — emitted when the template is fully assembled.
  Carries the final string value and references the begin event.

## Navigation

Evaluation and end events reference their begin event via `beginStep`, enabling
correct pairing for nested templates.
