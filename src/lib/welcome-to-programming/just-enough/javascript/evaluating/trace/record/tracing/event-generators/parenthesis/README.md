# Parenthesis Event Generator

Creates `ParenthesisEvent` objects for grouping parenthesis enter/leave.

## `createParenthesisEvent`

**Inputs:** event (enter/leave), depth, and optional parentStep reference.

**Constraints:**

- `depth` must be >= 1
- `parentStep` absent on outermost parentheses (depth 1)
