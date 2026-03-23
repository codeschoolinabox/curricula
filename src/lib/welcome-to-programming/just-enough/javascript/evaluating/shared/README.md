# evaluating/shared

Shared infrastructure for all three evaluation actions (`run`, `trace`,
`debug`). Provides the feature configuration system that lets curriculum authors
control which JeJ features are available per chapter.

## Structure

| File                  | Purpose                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `types.ts`            | AllowConfig, RunEvent, action configs                              |
| `allow-schema.ts`     | JSON Schema defining the AllowConfig structure                     |
| `expand-allow.ts`     | Boolean shorthand expansion (adapted from sl-tracing)              |
| `fill-defaults.ts`    | Fills omitted keys with defaults (false for allow, true for block) |
| `resolve-features.ts` | Expanded config to LanguageLevel + AllowedConfig                   |

## How the feature config works

Each action accepts an optional `allow` or `block` property (mutually
exclusive). Both use the same `AllowConfig` shape — a nested object whose
structure mirrors the `reference.md` sections.

**allow** (allowlist): omitted features default to `false` (disabled). **block**
(blocklist): omitted features default to `true` (enabled). Neither provided:
full JeJ (everything enabled).

### Processing pipeline

```text
AllowConfig (user input)
  → expandShorthand (booleans → full objects, recursive)
  → fillDefaults (omitted → false or true depending on mode)
  → resolveFeatures → { level: LanguageLevel, allowed: AllowedConfig }
```

The `expandShorthand` step is adapted from `@study-lenses/tracing`'s configuring
module but extended to handle recursive nesting (e.g.,
`{ strings: { methods: true } }` expands `methods` to all its sub-keys).

The `fillDefaults` step uses a lightweight schema walker instead of Ajv (not a
project dependency).

The `resolveFeatures` step builds a `LanguageLevel` (for validation) and an
`AllowedConfig` (for enforcement) from the fully expanded config. Operator
validators are merged when multiple operator features are enabled.
