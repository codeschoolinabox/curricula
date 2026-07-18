<!-- markdownlint-disable -->
<!-- cspell:disable -->

# REFERENCE — test + tooling infrastructure survey (orchestrate campaign)

Transitional scaffolding beside PHASE-1-HANDOFF.md; the maintainer deletes it
when the campaign completes. Produced 2026-07-17 by a read-only survey agent.
Repo-root-relative paths.

## (1) How a new test under src/lib/study-lenses/orchestrate/tests/ picks its environment

- vitest.workspace.ts is authoritative. The **unit** project runs everything
  except `*.browser.test.ts`; default environment **node**; per-file override
  via pragma `// @vitest-environment jsdom` (block-comment form also works). The
  **browser** project matches `*.browser.test.ts` ONLY (not .tsx) and runs real
  Chromium.
- The unit project runs **globals: false** — explicit vitest imports everywhere,
  and NO automatic @testing-library/react cleanup: every jsdom component test
  file needs an explicit `afterEach(cleanup)`.
- jsdom 26. React component tests use `.test.tsx` + pragma +
  @testing-library/react (`render`, `fireEvent`, `act`, `waitFor`, `cleanup`).
  `@testing-library/user-event` is installed but used by ZERO tests — don't
  introduce it without a reason.
- CodeMirror in jsdom: the unit project inlines `/^@codemirror\//` +
  `codemirror` via server.deps.inline (fixes instanceof-on-Extension
  double-load) — already configured, nothing to do.
- vitest-stubs/: docusaurus-BrowserOnly.tsx and theme-CodeBlock.tsx are aliased
  in for tests that render components importing Docusaurus internals.

## (2) Exemplar test files to imitate (mechanics, not imports)

The greenfield tree had ZERO tests at survey time; React exemplars live in the
deprecated tree:

- src/lib/study-lenses--deprecated-architecture/orchestrate/splitter/tests/index.test.tsx
  — NEWEST (2026-07), best exemplar: pragma block form, cleanup +
  vi.restoreAllMocks in afterEach, getBoundingClientRect stubbing (jsdom
  computes no layout), wiring-vs-geometry test split documented in the header.
- src/lib/study-lenses--deprecated-architecture/orchestrate/tests/study-lenses.test.tsx
  — top-level region exemplar: async CodeMirror mount via waitFor,
  EditorView.findFromDOM, act()-wrapped CM dispatch, module-namespace spying.
- src/lib/study-lenses--deprecated-architecture/orchestrate/dock/tests/index.test.tsx
  — plain props-in/DOM-out component test; data-attribute selectors
  (`[data-orchestrator-dock]`), querySelector<HTMLElement> generic pattern.
- Also:
  orchestrate/{editor,embedded-guide,output-panels,phases-panel}/tests/index.test.tsx
  and lenses/\*/tests/component.test.tsx.
- Browser-env exemplar (not needed this campaign):
  src/lib/embody/lib/evaluating/run/tests/run.browser.test.ts — plain
  describe/it, no pragma (project selection by filename).
- Pure-logic node tests: src/lib/utils/tests/\*.test.ts (9 files) and
  src/lib/embody/tests/embody.test.ts.

## (3) Shared utilities — src/lib/utils/ (import via `@utils/<name>.js`)

All default-exported, pure (two noted exceptions), no structuredClone
(browser-compat):

- deep-clone.ts — deep copy incl. Date/RegExp/Set/Map, cycle-safe; functions by
  reference.
- deep-freeze.ts — freezes a deep CLONE; original untouched (for objects you
  don't own).
- deep-freeze-in-place.ts — freezes the input graph IN PLACE, same reference
  (freshly-built objects only).
- deep-freeze-except.ts — in-place freeze that skips an `except` set of foreign
  references (what embody uses; right tool for the joined roster: freeze
  structure, except the lens refs).
- freeze-in-place.ts — shallow-ish freeze-in-place for objects you just built.
- clone-and-freeze.ts — clone-then-freeze for caller-provided data.
- deep-merge.ts — recursive merge, second arg wins; arrays replaced wholesale.
- deep-equal.ts — structural equality, cycle-tracking.
- is-plain-object.ts — true only for plain objects; used inside merge/equal.
- debounce.ts — trailing-edge debounce with `.cancel()`, safe in React effect
  cleanup (the stateful exception).

Each has a matching test in src/lib/utils/tests/ — good style reference for
node-env tests.

## (4) Gotchas

Lint/eslint (eslint.config.mjs):

- eslint-plugin-boundaries is imported and registered but NO `boundaries/*`
  rules and NO `settings['boundaries/elements']` exist — there is currently NO
  element-boundary enforcement to configure or satisfy.
- Test-file override block (`**/*.test.{ts,tsx,js}`, `**/tests/**/*.{ts,tsx}`)
  relaxes: functional/immutable-data, arrow-body-style,
  sonarjs/no-duplicate-string, unicorn/consistent-function-scoping,
  unicorn/consistent-destructuring, @typescript-eslint/no-shadow, all
  no-unsafe-\*, no-explicit-any. Everything else still applies to tests —
  including `import/order` (newlines-between + alphabetize),
  `func-names: always`, kebab-case filenames, and no-restricted-syntax banning
  SWITCH statements and `.ts` import extensions (use `.js` specifiers).
- `import/no-named-export` is ON for src (default exports only) but OFF in
  tests, `**/index.ts(x)`, and `**/types.ts`.
- Known live lint traps: (a) React effect conditional-cleanup catch-22 —
  `sonarjs/no-inconsistent-returns` fires on early-return effects; always return
  the idle-safe cleanup. (b) arrow-body-style:never vs no-useless-undefined
  catch-22 on no-op arrows — lint the stub early. (c) jsdom `querySelector<T>`
  generics are not casts — see the dock test's pattern; `Array.from` +
  prefer-spread disable where needed.
- NEVER run `eslint --fix` repo-wide (severity-blind; pre-commit is
  prettier-only by design).
- `npm run lint` SHORT-CIRCUITS at lint:js (lint:md + lint:spelling never run if
  js fails); markdownlint-cli2 IGNORES file args and always lints the whole
  repo.
- ls-lint ignores src/ entirely — src filename casing is enforced by
  `unicorn/filename-case` (kebab-case).
- cspell runs over ts/tsx in `validate` — invented domain words in new tests can
  fail lint:spelling; prefer per-file `// cspell:ignore` comments.

Transpile/runtime:

- "mistranspiles" convention: Docusaurus/Babel loose mode turns `[...someSet]`
  into `[someSet]` in the BROWSER bundle. Repo convention: `Array.from(set)` +
  `// eslint-disable-next-line unicorn/prefer-spread -- Docusaurus/Babel mistranspiles ...`
  (exemplar: study-lenses--deprecated-architecture/orchestrate/event-bus.ts line
  86). Applies to production component code, not test files.
- jsdom computes no layout: stub `HTMLElement.prototype.getBoundingClientRect`
  for anything geometric; drag feel / pixel truth belongs in a sandbox/browser
  checkpoint, wiring in jsdom.
- vitest "Unhandled Errors" fail the FILE not a test — always check all three
  summary lines (`Test Files | Tests | Errors`).
- Engine-consumer tiers need a real-worker `*.browser.test.ts` companion — not
  applicable to this campaign (no Worker/SAB surface), applies to the future run
  lens.

Config-state caveats spotted (read-only observations at survey time):

- eslint.config.mjs global ignores still referenced
  `src/lib/study-lenses/embody/lib/evaluating/{intercept,run,shared,trace/*}/**`
  although that code moved to `src/lib/embody/lib/evaluating/...` — stale globs;
  the moved subtrees were NOT eslint-ignored at survey time.
- tsconfig excludes several `src/lib/embody` subtrees from TYPECHECK while
  vitest still RUNS their tests; the greenfield study-lenses tree is fully
  typechecked, and eslint ignores under the greenfield path excluded only
  `lenses/parsons/{lib,tests}` and `lenses/writeme/{lib,tests}` — NOT
  orchestrate. A new orchestrate test gets full lint + typecheck.

Key file paths:

- vitest.workspace.ts (authoritative test config) · vitest.config.ts ·
  vitest-stubs/
- eslint.config.mjs · tsconfig.json
- src/lib/study-lenses--deprecated-architecture/orchestrate/splitter/tests/index.test.tsx
  (primary exemplar)
- src/lib/study-lenses--deprecated-architecture/orchestrate/tests/study-lenses.test.tsx
  (region exemplar)
- src/lib/utils/ (shared utilities)
