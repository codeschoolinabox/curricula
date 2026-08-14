<!-- cspell:ignore Punctuator IdentifierName LineTerminator HashbangComment -->
<!-- cspell:ignore spellme tokenizes retokenize lookaheads eull -->

# embody — five flags, measured and unexecuted

Surfaced 2026-08-13/14 while designing `lib/scanning` and `lenses/spellme`.
**None is this campaign's to fix**, and none blocks it: the scanning derivation
works around every one of them from published data. They are recorded here
because they are true of embody regardless of who found them, and because two of
them are defects rather than gaps.

Each carries the command that proves it. Re-run before acting — this file is a
record of one session's measurements, not a live reading.

The probe form used throughout, against the repo's own acorn and the exact
options `embody/derive-tokens.ts` passes:

```js
const { tokenizer, parse } = require('acorn');
const comments = [];
const tokens = Array.from(
	tokenizer(source, {
		ecmaVersion: 2024,
		sourceType: 'module',
		onComment: comments,
		ranges: true,
	}),
);
```

---

## F1 — a hashbang is published as a line comment, and it is not one

**Severity: defect.** embody publishes a false value; a consumer trusting
`comment.type` is misled.

```text
source   #!/usr/bin/env node⏎let x = 1
comments [{ type: 'Line', value: '/usr/bin/env node', start: 0, end: 19 }]
```

ECMA-262 §12.5 gives `HashbangComment` its own production, legal at offset 0
only, reached through a distinct goal symbol. It is not a `Comment` and it is
not a line comment. The parser reports it on the comment channel with the wrong
type, and embody passes that through unchanged.

**Detectable without embody's help** —
`comment.start === 0 && source.startsWith('#!')` — which is what `lib/scanning`
does. When this is fixed the workaround becomes a no-op rather than a conflict.

**Smallest fix:** correct the type at the boundary in `derive-tokens.ts`, or
publish hashbang on its own field. The first bends acorn's shape; the second
widens the `Tokens` contract. Neither is obviously right, which is why this is a
flag and not a patch.

---

## F2 — the token array is not a partition, and can carry zero-width tokens

**Severity: gap, with a sharp edge.**

```text
source  `a${b}${c}d`
tokens  ` [0,1)  template[1,2)"a"  ${[2,4)  name[4,5)  }[5,6)
        template[6,6)""   ← ZERO WIDTH
        ${[6,8)  name[8,9)  }[9,10)  template[10,11)"d"  ` [11,12)
```

Two consequences. The stream skips whitespace entirely, so it covers only part
of the source; and between adjacent interpolations the parser emits a token of
zero width, which no span-based consumer can render or address.

This is faithful to the parser and embody is not lying. It is recorded because
the phase is named `tokens` after the specification, in a package whose README
says _"Every phase is a step the language specification itself names — nothing
is invented"_ — and the specification's reading of that source is **five** input
elements, tiling it exactly.

**Precedent for the shape a fix would take:** `parenSpans` on the entwined
stage. The published tree is ESTree-shaped and cannot carry grouping
parentheses, so embody publishes a record beside it preserving what the parser
saw. The token array cannot carry input-element boundaries; the same figure
applies one layer down.

**Not urgent.** `lib/scanning` recovers the boundaries with one token of
lookahead — verified across five cases including two nested, zero zero-width,
zero overlaps, zero gaps.

---

## F3 — the trivia between two tokens is unreachable

**Severity: gap.** Whitespace and line terminators are input elements (§12.2,
§12.3) and appear nowhere in the embodiment. A consumer recovers them by
subtracting token and comment ranges from the source.

The arithmetic is trivial; the reason to record it is that **one question it
answers is a notional-machine question no other fact reaches**: _was there a
line terminator between these two tokens?_ That is what automatic semicolon
insertion reads. A future lens teaching ASI needs it, and would derive it the
same way `lib/scanning` does.

---

## F4 — a program V8 runs closes the entire embodiment

**Severity: defect, and the most consequential of the five.**

```text
source     ({\u0069f: 1})
tokenize   ERR  Escape sequence in keyword if (1:2) @2
parse      OK
new Function(source) → runs
```

Four cases measured, all identical in shape — each spelling a reserved word with
a Unicode escape: `({\u0069f: 1})`, `class A { \u0069f(){} }`, `a.\u0063lass`,
`x.\u006eull`. Each fails to tokenize, parses cleanly, and evaluates in V8.

The restriction against escapes in a reserved word is an **early error in the
syntactic grammar**, not a lexical rule — at the lexical level `if` is a
well-formed `IdentifierName` — `\u0069f` is six characters, not the keyword —
and in property-key position no reserved-word restriction applies at all, which
is why V8 accepts it. acorn's tokenizer enforces it early anyway.

The consequence is not local. `embody/derive-ast.ts` line 41 short-circuits on a
failed tokens stage, so `ast`, `entwined` and `environment` all collapse with
the carried cause — **the whole embodiment closes on a program that runs.**
Every phase below `tokens` renders barred, and every lens gated on any of those
facts withdraws.

Also worth noting: the message names a keyword the source never spells. The
source is `\u0069f`; the message says `keyword if`.

**Why it is filed here rather than fixed:** the fix is a judgment call between
three shapes — relax the restriction in the tokenize pass, stop `derive-ast`
gating on `tokens`, or accept it and document it — and each changes a different
contract. It wants its own Phase 0.

---

## F5 — a salvageable partial token stream is discarded on failure

**Severity: gap.**

```text
source  // hi⏎let x = 1;⏎/* block */⏎let y = @;⏎let z = 2;
throw   Unexpected character '@' (4:8) @37

Array.from    → threw; tokens lost, comments array still holds 2
manual drain  → 8 tokens salvaged + 2 comments, then the same throw
                salvaged text: let x = 1 ; let y =
```

acorn hands back a complete, correct reading of `[0, 37)` before it stops.
`derive-tokens.ts` uses `Array.from`, so the accumulated tokens die inside the
iterator; the comments survive only because the array belongs to the caller.

The most pedagogically valuable failure view — _here is everything the scanner
got right, and here is where it stopped_ — is unreachable from any lens.

**The fix is small and the risk is not.** A manual `getToken()` drain recovers
it, and is immune to the Babel loose-mode hazard the current `Array.from` was
chosen to avoid (an explicit loop drains explicitly; the hazard is spread
compiling to `[].concat`). But it widens `Tokens`' failure arm, which is a
contract change.

**Not needed by `spellme`**, whose error case is out of scope by ruling.

---

## What none of these are

Not blockers. `lib/scanning` derives what it needs from `facts.source.value`,
`facts.tokens.value.tokens` and `facts.tokens.value.comments` using range
arithmetic, a rename table, and two one-token lookaheads — no new inference, no
re-tokenizing, no syntax tree.

Not a request. Filing five flags at once from outside a region is a way to
volunteer someone else's Phase 0. F1 and F4 are defects and deserve a decision;
F2, F3 and F5 are gaps that a second consumer would make worth closing.

## Navigation

- The consumer that surfaced them:
  [`lib/scanning`](../../src/lib/study-lenses/lib/scanning/README.md).
- The region: [`embody`](../../src/lib/study-lenses/embody/README.md) — its
  fact-admission constraint is in `DOCS.md` § Out of scope.
