# Semantic profiles

Named `TraceConfig` objects used for T4 semantic-vertical integration tests.
Each profile isolates one semantic vertical (scopes, expressions, resolves,
etc.) to test a specific expected behavior in isolation.

## Profile catalog

| Profile                    | Config shape                                                                                    | What it isolates                                                                            | Expected behavior                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `ALL_OFF`                  | every gate `false`                                                                              | baseline                                                                                    | zero events for any program                                                |
| `ALL_ON`                   | schema defaults                                                                                 | baseline                                                                                    | canonical full event stream                                                |
| `RESOLVE_ONLY_COGATED`     | `{ expression:false, statements:false, scopes:false, resolve:true }`                            | co-gating: resolves suppressed because expression events are off (`dependent:true` default) | zero events                                                                |
| `RESOLVE_ONLY_INDEPENDENT` | `{ expression:false, statements:false, scopes:false, resolve:{ dependent:false, kinds:true } }` | independent mode — resolves fire regardless of expression gating                            | ResolveEvents only                                                         |
| `EXPRESSION_ONLY`          | `{ statements:false, scopes:false, resolve:false, expression:true }`                            | expression events without paired resolves                                                   | LiteralEvent, BindingEvent(read), PureOperatorEvent, etc.                  |
| `STATEMENTS_ONLY`          | `{ expression:false, scopes:false, resolve:false, statements:true }`                            | control flow without data values                                                            | ConditionalEvent, LoopEvent, JumpEvent, BindingEvent(initialize/available) |
| `SCOPES_ONLY`              | `{ expression:false, statements:false, resolve:false, scopes:true }`                            | scope lifecycle without data or control flow                                                | ScopeEvent + BindingEvent(declare) only                                    |
| `PROVENANCE_ON`            | `ALL_ON` + explicit `resolve.provenance:true` (same as default)                                 | provenance fields present on every ResolveEvent                                             | ResolveEvents carry `valueId` + `sourceValueIds`                           |
| `PROVENANCE_OFF`           | `ALL_ON` with `resolve:{ provenance:false }`                                                    | provenance opt-out                                                                          | ResolveEvents have no `valueId` / `sourceValueIds`                         |
| `ERRORS_ONLY`              | `{ errors:true, expression:false, statements:false, scopes:false, resolve:false }`              | ErrorEvent isolation                                                                        | only ErrorEvents on runtime-error programs                                 |
| `NO_ERRORS`                | `ALL_ON` with `errors:false`                                                                    | error suppression                                                                           | ErrorEvents NOT emitted even on runtime errors; `ok:false` still set       |

## Where profiles live

`trace/tests/profiles/profiles.ts` exports a **single default object**
containing all 11 profiles:

```typescript
import profiles from './profiles.js';
const { ALL_ON, SCOPES_ONLY, RESOLVE_ONLY_INDEPENDENT } = profiles;
```

One default export (per AGENTS.md convention); all profiles in one frozen plain
object.

## One test file per profile

Each profile has a dedicated test file in `trace/tests/profiles/`:

| File                                       | Profile                    |
| ------------------------------------------ | -------------------------- |
| `profile-all-off.test.ts`                  | `ALL_OFF`                  |
| `profile-all-on.test.ts`                   | `ALL_ON`                   |
| `profile-scopes-only.test.ts`              | `SCOPES_ONLY`              |
| `profile-expression-only.test.ts`          | `EXPRESSION_ONLY`          |
| `profile-statements-only.test.ts`          | `STATEMENTS_ONLY`          |
| `profile-resolve-only-cogated.test.ts`     | `RESOLVE_ONLY_COGATED`     |
| `profile-resolve-only-independent.test.ts` | `RESOLVE_ONLY_INDEPENDENT` |
| `profile-provenance-on.test.ts`            | `PROVENANCE_ON`            |
| `profile-provenance-off.test.ts`           | `PROVENANCE_OFF`           |
| `profile-errors-only.test.ts`              | `ERRORS_ONLY`              |
| `profile-no-errors.test.ts`                | `NO_ERRORS`                |

Each file runs its profile against a fixed set of demo programs and asserts the
complete event stream.

## Which verticals populate which profiles

| Vertical             | Profiles that turn green                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------- |
| Scopes               | `SCOPES_ONLY`, `ALL_OFF`                                                                 |
| Variable lifecycle   | `STATEMENTS_ONLY` (partial: initialize/available), `EXPRESSION_ONLY` (partial: literals) |
| Read + operators     | `EXPRESSION_ONLY` (extended: variables.read, operators.arithmetic)                       |
| Resolves             | `RESOLVE_ONLY_INDEPENDENT`, `RESOLVE_ONLY_COGATED`, `PROVENANCE_ON`, `PROVENANCE_OFF`    |
| Control flow         | `STATEMENTS_ONLY` (full: conditionals, loops, jumps)                                     |
| Advanced expressions | `EXPRESSION_ONLY` (full: short-circuit, increment, property, call, template)             |
| Formal errors        | `ERRORS_ONLY`, `NO_ERRORS`, `ALL_ON` (fully populated)                                   |

## Reusability

- **T6 (semantic-equivalence)** — imports the full profiles object; uses
  multiple entries to verify equivalent configs produce identical event streams
  (e.g. `{ expression: true }` vs
  `{ expression: { variables: true, literals: true, operators: true, ... } }`)
- **T5 (schema-conformance)** — uses `ALL_ON` to exercise every event type in a
  single trace; validates each event against its category schema
- **T4 test files** — each imports profiles and destructures the specific ones
  it needs

## Related

- `trace/DOCS.md` — vocabulary, test taxonomy, architecture axes
- `tracing/tests/README.md` — full test file inventory across all 7 tiers
