# Handoff — port writeme's snippet-free "Suggestions" toggle to `blanks`

> Self-contained prompt for a future session with **zero** prior context. Goal:
> give the `blanks` lens the same **snippet-free typing-suggestions toggle** that
> `writeme` already ships, by wiring `blanks` to the EXACT extension writeme uses.
> Every file:line below was verified against the repo; trust them, but a quick
> re-check never hurts (code moves).

## Where you are

Repo root: the **`0-curricula`** repo —
`/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula`.
Verify you are in it: `ls AGENTS.md DEV.md eslint.config.mjs tsconfig.json` (all
four sit at root). There are ~15 sibling repos under `0-spiralearn` and a
`parsons`/`writeme`/`blanks` lens family — make sure you are in `0-curricula`.
**All paths below are relative to that root.**

## START HERE (first actions, in order)

1. Read `src/lib/just-enough/javascript/lenses/writeme/lib/snippet-free-autocomplete.ts`
   (~82 lines) — the asset you are porting, and its `@file` header (host
   preconditions live there).
2. Read how writeme WIRES it: `lenses/writeme/index.tsx` — the import (~L46), the
   compartment seed in the mount effect (~L188), and the `reconfigureSuggestions`
   effect (~L237). writeme is compartment-based; **blanks is not** (see below).
3. Read the TARGET: `lenses/blanks/index.tsx` (large, ~44 KB) — focus on the
   `mountEditorView` effect (~L858–959) and the toolbar JSX (~L981–1056).
4. THEN read `AGENTS.md`, `DEV.md`, and `lenses/blanks/README.md` for protocol
   before you plan anything.

## The goal in one line

Add an opt-in `suggestions` boolean toggle to `blanks` that wires the editor to
`writeme`'s `snippetFreeAutocomplete()` — autocomplete of **JS keywords +
already-typed in-buffer identifiers only, NO snippet templates** (`for`/`if`/
`function` skeletons) and no completion of un-typed identifiers. The autocomplete
logic is already built; **this task is purely wiring it into blanks behind a
toggle** — there is nothing to re-derive.

## Why (the pedagogy)

`writeme` rejects snippet autocomplete on purpose: a `for`/`if`/`function`
template hands the learner *structure*, and completing a not-yet-typed identifier
hands them the *answer*. The snippet-free variant relieves blank-page / syntax
friction without leaking either. `blanks` should get the same opt-in.

## The reusable asset (already built; **browser-verified, NOT unit-tested**)

`lenses/writeme/lib/snippet-free-autocomplete.ts` — default-exports
`snippetFreeAutocomplete(): Extension`. Its body is exactly:

```ts
import { autocompletion, completeFromList } from '@codemirror/autocomplete';
import { localCompletionSource } from '@codemirror/lang-javascript';
import type { Extension } from '@codemirror/state';

// ...
autocompletion({ override: [localCompletionSource, completeFromList([...JS_KEYWORDS])] });
```

- `JS_KEYWORDS` has **exactly 43** entries (a `readonly` array — note the
  `[...JS_KEYWORDS]` spread, required because `completeFromList` wants a mutable
  array).
- **How it suppresses snippets:** the `override` array REPLACES the *language-data*
  completion sources. The `for`/`if`/`function` snippets are registered by
  **`@codemirror/lang-javascript`** (the `javascript()` language extension), **not**
  by `@codemirror/autocomplete` and **not** by `basicSetup`. Because `override`
  bypasses language-data sources, those snippets are never consulted. (Verify in
  the browser gate: type `fo` → `for` completes as plain text, with NO multi-line
  `for (…) {}` skeleton.)
- **Host preconditions (from the file's own `@file` JSDoc):** the editor it is
  added to MUST (a) have a JS language extension active (`localCompletionSource`
  needs the JS syntax tree) and (b) include `completionKeymap` in its keymap (to
  navigate/accept the popup). **blanks satisfies neither in `diff`/`raw` by
  default** — see the target section.
- **There is no jsdom/unit test for this extension** (CodeMirror's completion UI
  does not render in jsdom). Its correctness is established by the **browser gate**.
  Do not go looking for a test file that imports it — none does (only
  `writeme/index.tsx` imports it).

## The target: `blanks` — read this BEFORE wiring (three real gotchas)

### Gotcha 1 — TWO remount paths with OPPOSITE learner-code semantics

`blanks`' mount-effect deps are `[viewMode, editorMode, blankResult]`
(`index.tsx:958`), so it **remounts** the editor on those changes (it is NOT
compartment-based like writeme). But the two paths do OPPOSITE things to learner
code:

- **viewMode toggle** → bare `setViewMode` (`index.tsx:986`); the remount re-reads
  `learnerCodeRef.current` (`index.tsx:878`) → **work is PRESERVED** (see the
  comment at `index.tsx:621-625`).
- **editorMode toggle** → `changeEditorMode` (`index.tsx:608-619`) calls
  `setLearnerCode(null)` + `setRevealCounts(new Map())` + `setCursorPos(null)` →
  it **DELIBERATELY WIPES** learner code (diff/raw free-edits can violate the
  helpful editor's length-match/anchor invariants — comment `index.tsx:601-607`).

**Therefore: model the `suggestions` toggle on the viewMode path, NOT on
`changeEditorMode`.** Add `suggestions` to the mount-effect deps so the editor
remounts on toggle, but do **NOT** add any `setLearnerCode(null)` reset.
Toggling autocomplete must never erase the learner's in-progress work. (A naive
copy of `changeEditorMode` would ship a data-losing toggle — this is the single
biggest trap in this port.)

### Gotcha 2 — where the autocomplete actually lives per mode

`blanks` only has autocomplete in `editorMode === 'helpful'`, via `basicSetup`
(`index.tsx:914`). But:

- `basicSetup` (codemirror dist) ships the autocomplete **engine** (a bare
  `autocompletion()`) + `completionKeymap` — it registers **no snippets** itself.
  The snippets come from `javascript()` (`index.tsx:936`).
- `blanks`' `diff`/`raw` editors use `minimalBaseline = [history(),
  drawSelection(), keymap.of([...defaultKeymap, ...historyKeymap])]`
  (`index.tsx:915-919`) — **no `completionKeymap`**, and `blanks/index.tsx` **never
  imports `@codemirror/autocomplete`** at all.

Consequences for the two design options:

- **Option A — snippet-free suggestions in ALL modes (faithful to writeme).** In
  `helpful`, do not let `basicSetup`'s bare `autocompletion()` run a second,
  competing config; supply `snippetFreeAutocomplete()` as the ONE `autocompletion()`
  instance (compose `basicSetup`'s other pieces — lineNumbers, history, foldGutter,
  bracketMatching, closeBrackets, etc. — minus its autocompletion). In `diff`/`raw`,
  you MUST also add `completionKeymap` (and import `@codemirror/autocomplete`), or
  the popup is un-navigable.
- **Option B — suggestions only in `diff`/`raw`.** Simpler, but inconsistent
  (helpful keeps snippet autocomplete). Still requires adding `completionKeymap` +
  the import to `minimalBaseline` when suggestions is on.

This is a real design fork — see Open Decisions.

### Gotcha 3 — `blanks` syncs config to the URL (writeme does not)

A new `suggestions` field must round-trip through the URL or it silently won't
persist. The grammar is `?blanks=difficulty:N,types:a+b,view:X,editor:Y,hints:Z`
(`lenses/blanks/lib/url-config.ts:12`). Threading a new field requires **five**
edit sites (not just `index.tsx`):

1. `BlanksLensConfig` type — `blanks/types.ts:311-317` (add `suggestions?: boolean`).
2. `core.config()` defaults — `blanks/core.ts:58-71` (pick + document the default).
3. `ConfigSetters` + `applyUrlConfig` — `blanks/index.tsx:256-289` (add a
   `if (fromUrl.suggestions !== undefined) setSuggestions(...)` branch). NB:
   `fromUrl` is just a *param name*; the real work is here + url-config.ts.
4. The Effect-2 URL-write payload — `blanks/index.tsx:828-834` (add `suggestions`).
5. `url-config.ts` — `parseHash` (~L114-144, parse a new `suggest:` segment),
   `serializeConfig` (~L149-167, emit it in canonical order), and the VALID-set
   guard (~L67-83) if you make it an enum. Choose a short key, e.g. `suggest:on|off`.

(Mount-read Effect 1 `index.tsx:810-813` and the hashchange replay Effect 3
`index.tsx:842-851` reuse `applyUrlConfig`, so no extra edit there.)

### The toggle CONTROL + contract — you are INTRODUCING a pattern, not matching one

`blanks` has **no** `data-assist-toggle` and **no** `data-suggestions` — those are
**writeme's** contract (`writeme/README.md:177-189`). `blanks`' toggles are
**buttons** with `data-view-toggle` / `data-editor-mode-toggle` + `aria-pressed`
(`index.tsx:1005-1028`) and **checkboxes** with `data-content-type` + `checked`
(`index.tsx:1043-1056`). Its `hintsMode` boolean has *no* toolbar control at all —
only a `data-hints-mode` root attr (`index.tsx:968`).

So render `suggestions` as a **CHECKBOX** (boolean), mirroring blanks' content-type
checkbox markup, using `checked` (NOT `aria-pressed` — that is for blanks' BUTTON
toggles):

```tsx
<label>
  <input type="checkbox" data-assist-toggle="suggestions"
         checked={suggestions} onChange={/* setSuggestions(!suggestions) */} />{' '}
  Suggestions
</label>
```

Reusing writeme's `data-assist-toggle="suggestions"` name in blanks is a **new
cross-lens contract decision** (it does not exist in blanks today) — see Open
Decisions; whichever name you pick, add a `data-suggestions={suggestions}` attr on
the `data-lens="blanks"` root next to `data-hints-mode` (`index.tsx:965-969`) and
document the new control in blanks' README "Toolbar contract" (`README.md:240`).

## Process (anchors verified; the protocol is non-negotiable)

- Read FIRST: `AGENTS.md` — the **Adversarial Review Protocol AR-1..AR-5** is at
  `AGENTS.md:685-723` (incl. model dispatch), the **per-increment loop** at
  `:221-226` and `:294-296`, **ZOMBIES** at `:189`, **plan-mode + Plan-agent**
  requirement at `:42` and `:74`. `DEV.md` — the **Incremental Development
  Workflow** at `:1228+` and the **Sandbox-Checkpoint** gate at `:1412-1461`.
- **Plan mode first**, get the plan approved (run the plan-mode Plan agent), then:
  JSDoc/stub → failing **ZOMBIES** test → AR-3 → implement → green (tsc + eslint 0
  errors + prettier + markdownlint) → **browser gate** → AR-4 → commit. Pure logic
  is unit-tested; the autocomplete behaviour is **browser-gated** (jsdom has no CM
  completion UI).
- **BROWSER GATE SURFACE** (the docs do NOT spell this out — it lives only in the
  preview file's header): start the dev server with `npm run start` (script at
  `package.json:7`), then open **`http://localhost:3000/spiralearn/blanks-preview`**
  (the `/spiralearn/` baseUrl is required — `docusaurus.config*:~23`). That page
  (`src/pages/blanks-preview.tsx`) mounts the blanks lens directly at difficulty
  100; click **"Load comprehensive test snippet"** for a rich buffer, then type a
  few characters and confirm the popup shows JS keywords + already-typed
  identifiers and **NO** `for`/`if`/`function` snippet templates, zero console
  errors. **You will likely need to make the new toggle reachable on that page** —
  add the `suggestions` checkbox to `blanks-preview.tsx` or pass
  `config({ suggestions: true })`. Hot-reload is reused across increments — don't
  restart the server per increment (`DEV.md:1435`).
- **Commits:** `git commit --no-verify -F /tmp/<scratch>.txt` (ASCII-safe;
  `--no-verify` is sanctioned at `AGENTS.md:371`). **Stage NAMED files only**
  (`git add <path>`), never `git add -A` — sibling sessions share this working
  tree; run `git status` + `git diff --cached` before every commit and confirm
  only your files are staged. **Never branch, never amend/rebase/reset --hard**
  (forbidden at `AGENTS.md:376-384`); a new commit each time. End EVERY commit
  message with exactly this trailer (it is a git-history convention, NOT in
  AGENTS.md/DEV.md — confirm the current string via `git log --format=%b -5`):

  ```text
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  ```

## Acceptance

- `blanks` exposes a `suggestions` **checkbox** that toggles snippet-free
  autocomplete (JS keywords + in-buffer locals; NO `for`/`if`/`function` snippet
  templates; no completion of un-typed identifiers), navigable/acceptable via
  `completionKeymap` in **every** mode it is offered in.
- Toggling `suggestions` **never wipes learner code** (modelled on the viewMode
  remount path, not `changeEditorMode`).
- The chosen mode reconciliation (Option A or B) is implemented and the
  helpful-mode double-autocomplete question is resolved (no competing popups).
- `suggestions` round-trips through the URL (all five edit sites); the default is
  deliberate + documented. The new control + `data-suggestions` are documented in
  blanks' README Toolbar contract.
- The shared `snippetFreeAutocomplete` source lives in a location neither lens
  "owns" (see Open Decisions); both lenses import it from there.
- Full AR cycle done; browser-gated; tsc / eslint(0) / prettier / markdownlint clean.

## Open decisions (tee these up for the human at planning time)

1. **Where to promote the shared extension** — two reviewers disagreed; it is a
   real fork, not a default:
   - **(a) Create `src/lib/just-enough/javascript/lenses/lib/`** (a new shared-
     across-lenses dir) and add `lenses/lib/**` to the eslint-ignore + the tsconfig
     exclude that currently list the per-lens `lib/**` (eslint.config.mjs ~L29-42).
     Cleanest charter-wise (keeps CodeMirror-coupled lens code out of pure utils),
     but it is NEW infrastructure.
   - **(b) `@utils` → `src/lib/utils/`** (tsconfig path `@utils/*`, `tsconfig.json:6`).
     Established + already imported by BOTH lenses (`blanks/index.tsx:59` uses
     `@utils/freeze.js`), so least infra — BUT its `README.md` scopes it to *pure,
     framework-agnostic* helpers, and a `@codemirror/*`-importing extension stretches
     that charter. Also: it is NOT eslint-ignored (unlike `*/lib/**`), so on move the
     file must pass full eslint(0) — it is tiny, so this should be trivial; verify.
   - (c) cross-lens import from `writeme/lib/` — unusual here; avoid.

   Recommend deciding **(a) vs (b)** explicitly with the human: charter-cleanliness
   vs least-infrastructure. Whichever wins, also move `JS_KEYWORDS` with it (and
   decide if blanks wants any blanks-specific keywords — probably not; keep identical).
2. **Option A (snippet-free in all modes, incl. helpful) vs Option B (diff/raw only)** —
   A is faithful to writeme but requires un-bundling `basicSetup`'s autocomplete in
   helpful; B is simpler but inconsistent. Either way, `completionKeymap` + the
   `@codemirror/autocomplete` import must be added to any mode that gets suggestions.
3. **Default `suggestions` on or off for blanks** — writeme defaults it OFF
   (`writeme/types.ts:204`, `core.ts`) because writeme is a recall task; blanks is
   more scaffolded, so on-vs-off is a genuine pedagogical choice. Raise it; don't assume.
4. **Toggle attribute name** — reuse writeme's `data-assist-toggle="suggestions"`
   (cross-lens consistency) or coin a blanks-local name. Either is fine; pick one
   and document it.
