# Scope Event Generator

Creates `ScopeEvent` objects for scope lifecycle: create, enter, interrupt,
completion, leave.

## `createScopeEvent`

**Inputs:** scope kind (script/block/module), event type, depth, creation step
references, optional structure/structureStep/label.

**Constraints:**

- `structure` and `structureStep` must both be present or both absent
- `parentCreationStep` absent only on top-level module scope
- On create events, `creationStep` is self-referential (equals the event's own
  step number)
