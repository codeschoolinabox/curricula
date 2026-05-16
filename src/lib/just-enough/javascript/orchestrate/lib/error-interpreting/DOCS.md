# Error Interpreting — Architecture Decisions

## Why inline TypeScript, not YAML files

An earlier version loaded explanations from YAML files at runtime using
`node:fs`. This was incompatible with browser execution — the primary target.
The codebase convention (e.g. `just-enough-js.ts`) is to inline static data in
TypeScript modules. All 20 explanation patterns now live in `explanations.ts` as
a frozen array.

To edit explanations, modify the objects in `explanations.ts` directly. Each
entry is clearly labeled with an `id` field.

## Why best-effort AST analysis

Students produce broken code. The module must never crash. The entry function
reads its AST from the embodiment (`embodiment.parse.ast.acornNode` when
`status.parsed && parse.ast` is truthy); when the AST is absent (the
embodiment didn't reach the parse phase, or `Partial<ParseGraph>` left
`parse.ast` undefined), the module falls back to regex/string pattern
matching on the error message and source text. AST analysis, when available,
provides richer context — detecting `prompt()` calls for null TypeErrors,
collecting declared names for "did you mean" suggestions on ReferenceErrors.

In Phase A, the embody mock ships a stub `Program` with `body: []`, so
AST-dependent suggestion paths silently degrade to `undefined` against any
apex embodiment; the message-regex paths remain intact. Phase B's real
`embody/lib/parse/` reinstates a fully populated AST and these
suggestions resume working without code change here.

## Why `{{placeholder}}` interpolation

Simple Mustache-style templating — value substitution only, no logic in
templates. This keeps explanations readable. The fixed set of known placeholder
keys is documented in the JSDoc of `explanations.ts`.

## V8 error message assumptions

The `match` fields assume V8 (Chrome/Node.js) error message wording. Other
engines differ slightly:

- V8: `"Cannot read properties of null (reading 'toLowerCase')"`
- SpiderMonkey: `"null has no properties"`
- JSC: `"null is not an object (evaluating 'x.toLowerCase')"`

If multi-engine support is needed, the matching strategy should be extended with
per-engine match variants or normalized to a common form.

## Computing education research basis

Explanation content draws from known novice misconception categories:

| Misconception                       | Source                  | Applies to                     |
| ----------------------------------- | ----------------------- | ------------------------------ |
| "Variables exist by naming"         | Sorva 2012              | ReferenceError: not defined    |
| "Assignment is symmetric"           | Sorva 2012              | SyntaxError: `5 = x`          |
| "All operations work on all values" | Kaczmarczyk et al. 2010 | TypeError: null/undefined      |
| "prompt() always returns a string"  | Common in JEJ context   | TypeError on null after prompt |
| "const means value never changes"   | Qian & Lehman 2017      | TypeError: const assignment    |
| "Variables exist everywhere"        | Qian & Lehman 2017      | ReferenceError: TDZ            |
| "Missing delimiters are invisible"  | McCracken et al. 2001   | SyntaxError: unterminated      |
| "Loops always terminate"            | Sirkia & Sorva 2012     | RangeError: iteration limit    |
