# evaluating/trace/tests

Integration tests for the trace module's config pipeline and event gating.

## Structure

| File | Layer | Tests | Runner |
| ---- | ----- | ----- | ------ |
| `config-pipeline.test.ts` | 4a | 40 | Node |
| `gating-bindings-property.browser.test.ts` | 4a | 14 | Browser |
| `gating-operators-literals.browser.test.ts` | 4a | 16 | Browser |
| `gating-templates-scopes.browser.test.ts` | 4a | 12 | Browser |
| `gating-controlflow-functions.browser.test.ts` | 4a | 17 | Browser |
| `test-helpers.ts` | — | — | Shared utility |

## Conventions

- **Node tests** (`.test.ts`): pure config pipeline logic, no Workers needed
- **Browser tests** (`.browser.test.ts`): spawn Workers with SAB pause protocol,
  run in Chromium via Playwright
- **Split by category**: each browser file has ~15 tests to avoid Worker thread
  pool exhaustion from too many concurrent Workers in one browser session
- **Shared helpers** (`test-helpers.ts`): `ALL_ENABLED` config, `withOverride`
  deep-set utility, `drainGenerator` async drain helper. Uses named exports
  (convention exception: test utility, not a module barrel)

## Running

```sh
npm run test:unit    # Node tests only
npm run test:browser # Browser tests (sequential, with retry)
npm test             # Both
```

Browser tests run with `fileParallelism: false` and `retry: 2` in
`vitest.workspace.ts`. For parallel execution across separate Chromium instances:

```sh
npm run test:browser:parallel  # 3 shards, each in its own browser
```
