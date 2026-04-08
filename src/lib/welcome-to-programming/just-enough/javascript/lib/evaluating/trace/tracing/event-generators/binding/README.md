# Binding Event Generator

Creates `BindingEvent` objects for variable lifecycle: declare, initialize,
available, assign, read.

## `createBindingEvent`

**Inputs:** kind (`let`/`const`/`global`), event type, variable name, scope
reference, and optional value/declarationStep/explicit fields.

**Constraints:**

- `explicit` only present when `event === 'initialize'`
- `value` required on initialize, available, assign, read
- `declarationStep` absent on declare events and globals
