# aran@5.2.2 — verified API surface

Verified against the installed declarations in
`node_modules/aran/lib/*.d.ts` (2026-07-27). Package is ESM-only
(`"type": "module"`), main entry `aran`, lightweight runtime entry
`aran/runtime` (just `compileIntrinsicRecord`). Only dependency:
`estree-sentry`.

## Entry points (`aran` — lib/index.d.ts)

| Export | Signature (simplified) | Purpose |
| --- | --- | --- |
| `setupile(conf?)` | `(Partial<SetupConfig>) => EstreeProgram` | Generates the setup script defining the intrinsic global. NOT needed in standalone mode. |
| `transpile(file, conf?)` | `(Partial<File>, Partial<TransConfig>) => Program<atom> & {warnings}` | ESTree → AranLang IR. Runs your `digest` per node. |
| `weaveStandard(root, conf?)` | `(Program, Partial<StandardWeaveConfig>) => Program` | Standard API: one advice OBJECT at one global variable. |
| `weaveFlexible(root, conf?)` | `(Program, Partial<FlexibleWeaveConfig>) => Program` | Flexible API: each advice is its OWN global; custom point payloads. **The quarry uses this.** |
| `retropile(root, conf?)` | `(Program, Partial<RetroConfig>) => EstreeProgram` | AranLang → ESTree. Feed to `astring.generate`. |
| `instrument(file, conf?)` | chains transpile → **weaveStandard** → retropile | Convenience — STANDARD pointcut only. Cannot be used for the flexible aspect; keep the manual 3-step chain. |
| `compileIntrinsicRecord(globalThis)` | `=> IntrinsicRecord` | Runtime intrinsic record (also at `aran/runtime`). |

Errors: `AranExecError`, `AranTypeError`, `AranInputError`,
`AranSyntaxError`, `AranClashError`, `AranPointcutError`.

## Key configs

- `TransConfig`: `global_declarative_record: 'builtin' | 'emulate'`
  (default `'builtin'`), `digest(node, node_path, file_path, node_kind) => hash`
  (default `` file_path + '#' + node_path ``). The digest's hash becomes every
  AranLang node's `tag`.
- `File`: `{ root, kind: 'module'|'script'|'eval', situ, path }`. `situ` is
  `{type:'global'}` | `{type:'local', mode:'strict'|'sloppy'}` (root-local) |
  `{type:'aran', ...}` (deep-local, provided by `eval@before`). `kind:'eval'`
  requires `sourceType:'script'` parse.
- `FlexibleWeaveConfig`: `{ initial_state: Json, pointcut }` — pointcut is a
  record keyed by ADVICE GLOBAL VARIABLE NAME, each value
  `{ kind: AspectKind, pointcut: fn }`. `initial_state` is **JSON-cloned and
  code-generated** into the woven program (no functions/Maps/class instances,
  ever).
- `StandardWeaveConfig`: `{ initial_state, pointcut, advice_global_variable }`
  (default `"_ARAN_ADVICE_"`); pointcut may be boolean, kind-array, arrow, or
  per-kind object.
- `RetroConfig`: `mode: 'normal' | 'standalone'` (standalone embeds the
  intrinsic setup — self-contained output), `global_object_variable`,
  `intrinsic_global_variable` (default `"_ARAN_INTRINSIC_"`), `escape_prefix`
  (default `"_aran_"`).

## Flexible aspect vocabulary (weave/flexible/aspect.d.ts)

Pointcuts receive `(node, parent, root)` AranLang nodes and return
`undefined | null | point` — a **Json array**; non-null means "cut, and
code-generate this array as extra trailing advice args". Every join point may
be cut multiple times EXCEPT `apply@around` / `construct@around` (once).
Advice functions are read from `globalThis[<name>]` via
`aran.readGlobalVariable`.

| Kind | Advice signature | Notes |
| --- | --- | --- |
| `block@setup` | `(state, ...point) => State` | MUST return state; state transformer chain root. |
| `block@before` | `(state, ...point) => void` | |
| `block@declaration` | `(state, frame, ...point) => void` | `frame`: variable/parameter → initial value; TDZ = `aran.deadzone_symbol`. |
| `block@declaration-overwrite` | `(state, frame, ...point) => Frame` | Only way to REPLACE initial frame values. |
| `block@after` | `(state, ...point) => void` | Not called on throw/break. |
| `block@throwing` | `(state, error, ...point) => Value` | Only on throw. |
| `block@teardown` | `(state, ...point) => void` | Always, last. |
| `statement@before` / `statement@after` | `(state, ...point) => void` | |
| `effect@before` / `effect@after` | `(state, ...point) => void` | WriteEffect order: `effect@before` → RHS expression hooks → write → `effect@after`. |
| `expression@before` | `(state, ...point) => void` | |
| `expression@after` | `(state, result, ...point) => Value` | VALUE TRANSFORMER — must return `result` (or its replacement). |
| `apply@around` | `(state, callee, this_, args, ...point) => Value` | REPLACES the call — must `Reflect.apply` and return. |
| `construct@around` | `(state, callee, args, ...point) => Value` | REPLACES construction — `Reflect.construct`. |

## Standard aspect vocabulary (weave/standard/aspect.d.ts)

For reference only (the quarry does not use it). Kinds:
`block@setup`, `program-block@before`, `closure-block@before`,
`segment-block@before`, `block@declaration`, `block@declaration-overwrite`,
`generator-block@suspension`, `generator-block@resumption`,
`program-block@after`, `closure-block@after`, `segment-block@after`,
`block@throwing`, `block@teardown`, `break@before`, `test@before`,
`intrinsic@after`, `primitive@after`, `import@after`, `closure@after`,
`read@after`, `eval@before`, `eval@after`, `await@before`, `await@after`,
`yield@before`, `yield@after`, `drop@before`, `export@before`,
`write@before`, `apply@around`, `construct@around`.
All receive `(state, ...kind-specific args, tag)`; pointcuts receive
`(...kind-specific static args, tag)`. Note the standard API has explicit
`primitive@after` / `read@after` / `write@before` / `test@before` hooks that
the flexible API expresses through `expression@after` / `effect@*` +
node-type dispatch in your pointcut.

## Kind unions (weave/parametrization.d.ts)

- `ProgramKind`: `module | script | global-eval | root-local-eval | deep-local-eval`
- `ClosureKind`: `arrow | async-arrow | function | async-function | generator | async-generator | method | async-method`
- `SegmentKind`: `try | catch | finally | then | else | while | bare`
- `ControlKind` = ProgramKind | ClosureKind | SegmentKind; `TestKind`: `if | while | conditional`

## Intrinsics seen by `apply@around` dispatch

Operations Aran desugars into intrinsic calls (the quarry's discriminants):
`aran.performBinaryOperation`, `aran.performUnaryOperation`,
`aran.getValueProperty`, `aran.readGlobalVariable`,
`aran.writeGlobalVariableStrict`, `aran.writeGlobalVariableSloppy`,
`aran.typeofGlobalVariable`, `aran.toPropertyKey`, plus template assembly.
Aran-internal variables are `.`-prefixed (e.g. `.w.1110`); Aran parameters
(`this`, `function.callee`, `catch.error`, `scope.read`, …) must be filtered
out of user-facing variable events.

## Semantic facts verified on 5.2.2 (from the quarry's own campaign notes)

1. **Standalone + root-local situ mistraces global reads.** With
   `kind:'eval'`, `situ:{type:'local',mode:'strict'}`, `mode:'standalone'`,
   the default `scope.read` parameter returns cached accessor arrows
   UNINVOKED — an undeclared read resolves to a function instead of throwing
   ReferenceError (the observed `"5() => boom"` fabrication). The faithful,
   end-to-end-proven mechanism: `kind:'eval'`, `situ:{type:'global'}`, and a
   `'use strict'` directive injected into the Program AST. Pin error NAMES in
   tests, never message text (Aran authors its own TDZ/const messages).
   Boundary: under a global situ, worker-realm names (`self`, `postMessage`)
   resolve instead of throwing.
2. **UpdateExpression tags don't survive desugaring.** `x++` desugars to
   read + add + write whose nodes inherit the ARGUMENT Identifier's hash — no
   AranLang node carries the UpdateExpression's own tag. Prefix/postfix
   metadata must ride pre-walk propagation onto the argument node (same
   pattern as `bindingKind` propagation), not a tag read at the sub-node.
3. **`block@declaration` fires BEFORE `block@before`** (verified in the
   quarry against Aran's visit order).
4. Aran's digest visits nodes bottom-up — parent-derived metadata (declarator
   kind) requires a pre-walk, because the parent isn't visited yet.
