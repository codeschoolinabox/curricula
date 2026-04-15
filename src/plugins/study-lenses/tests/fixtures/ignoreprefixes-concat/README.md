# Fixture: `ignoreprefixes-concat/`

Used by `resolve-cascade.test.ts` Increment A.9 ("Interface —
`embedSiblings.ignorePrefixes` array-concat across cascade"). Root sets
`ignorePrefixes: ["staging-"]` plus `mode: "tabs"`. Chapter overrides
`ignorePrefixes: ["wip-"]` and omits `mode`.

Resolved config at `chapter/` must:

- Concatenate prefixes: `["staging-", "wip-"]` (root-first order,
  deduplicated).
- Preserve `mode: "tabs"` from root (child omitted, so shallow-merge
  semantics inherit it).

Exercises the deep-merge-with-array-concat rule for `embedSiblings`.
