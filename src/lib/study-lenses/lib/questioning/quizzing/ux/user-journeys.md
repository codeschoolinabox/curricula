<!-- cspell:ignore quizzing socratizing mcq distractor distractors liminality -->

# Learner journeys through quizzing

The user twin of the quizzing engine — the closed register's journeys at
module depth. The family-level journeys (first contact, misconception
repair, crossing registers, traversing the grid, expertise reversal) are
the parent's [`../ux/user-journeys.md`](../ux/user-journeys.md); each
journey here is one closed-register encounter with THIS engine's actual
forms and answer modes, stating what item data must exist for a consumer
to build it. The boundary holds unchanged: a **design model, not a
mechanism** — this engine never sequences, adapts, or remembers; verdicts
and unlocks are data a consumer folds.

## Q1 — Naming an element, meeting a verdict

**Who arrives:** a learner at first contact with a snippet, reading at
the text-surface atom level.

**The path:** a V1 item at a clicked token — "what kind of element is
this?" — four options, one machine-derived answer. The verdict is
immediate and the feedback explains the answer in notional-machine
vocabulary. V2 deepens the same gesture on a declaration keyword: not
"which category" but "what does `const` do".

**A wrong turn earns:** the feedback's NM explanation — never a score,
never a locked door (mastery display is the consumer's).

**Help appears:** inside the item, as the feedback channel.

**What this demands of this engine:** dense atom coverage (every
classified token can carry a V1 item), and feedback strings written in
NM-speak at generation time — the item is self-contained, so the teaching
happens in data authored before any learner arrives.

## Q2 — A misconception meets its distractor

**Who arrives:** a learner whose model says reassigning a `const`
"silently does nothing", or "is a SyntaxError the parser catches".

**The path:** a V6b item at a `const` declaration: "what happens when
later code assigns to this?" The distractors ARE the misconceptions —
silently-ignored, SyntaxError, ReferenceError — and the key is the
machine truth (TypeError at runtime). Picking the model's answer makes
the model visible; the feedback names the machine event it got wrong.

**A wrong turn earns:** the visible contradiction — the journey's whole
point (parent J2).

**Help appears:** after the contradiction, never before.

**What this demands of this engine:** curated-bank items whose copy is
authored FROM known misconceptions while the key stays machine-derived,
and execution-dimension cells carried honestly so a consumer can find the
prediction-forcing items.

## Q3 — Selecting, exhaustively

**Who arrives:** a learner solid on single answers, moving to relations —
"these occurrences are the same variable".

**The path:** V8 first (one gesture: click WHERE this variable is
declared), then the sameness forms: V10a "select every occurrence of this
same variable", V10b "…used the same way", V10c "…used this way across
variables". The learner builds a selection and confirms; grading is exact
set-equality — missing one occurrence or including a stray one is
incorrect, because exhaustiveness is the skill being graded.

**A wrong turn earns:** a binary verdict plus feedback; the consumer can
additionally render "missed these / wrongly included these" from the
item's complete target set and the learner's selection — data this engine
already supplies, presentation it never does.

**Help appears:** in the anchor itself — the representative occurrence is
always among the targets, so the clicked starting point is never a trick.

**What this demands of this engine:** complete, non-empty target sets on
every code-surface item, targets as exact ranges a consumer can both
grade against and render from, and the representative rule (one item per
group, anchored source-first) so the same question is findable, not
scattered.

## Q4 — One gesture credits a family of questions

**Who arrives:** a learner who has just correctly selected every
occurrence of a binding (Q3 passed).

**The path:** the passed V10a item carries `unlocks` — the groupKey its
V6/V8 peers share. A consumer folds the credit: mastery moves on every
same-group item at once, visibly rewarding the relational gesture with
atom-level progress. The learner experiences "proving I see the sameness
unlocked the family" — earned propagation, not gifted.

**A wrong turn earns:** flagged mastery on the sameness group only —
an incorrect gesture never propagates, and a peer's prior standing is
preserved.

**Help appears:** as the already-earned floor: the unlocked items remain
answerable individually; propagation is a shortcut, never a wall.

**What this demands of this engine:** unlocks as well-formed groupKey
references (the namespace peers actually carry), emitted only by the
sameness forms, never naming occ-fallback groups or free globals — so a
consumer's fold can trust every reference without validation.

## Q5 — Meeting the same question again

**Who arrives:** a learner mid-repair (parent J2's liminality), returning
to the snippet after the contradiction.

**The path:** the same snippet yields byte-identical items — same
anchors, same options, same keys — so the learner re-meets exactly the
question their old model failed, and tests the repaired model against it.
Determinism is this engine's property doing pedagogical work: the
re-encounter is guaranteed.

**A wrong turn earns:** the same contradiction again, as many times as
integration takes — stable, not punitive.

**Help appears:** in the stability itself; nothing shifts underfoot.

**What this demands of this engine:** no randomness anywhere — wording,
option order, item order, keys all fixed by the inputs; any variation a
consumer wants (shuffling, sampling) it builds outside, where it can also
build the re-encounter story that variation then owes.
