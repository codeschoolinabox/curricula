# The half-beat, drafted

> Author-facing design memo. Part of the `computational-thinking/` set; start at
> [README.md](./README.md).

[epicycles.md](./epicycles.md) argues the general form. This document is the
falsification instrument: **one half-beat written out at chapter length and
register, one written badly on purpose, and the gate item.** Without it the
theory reaches six to twelve Ch1 units untested, and the failure modes only
become visible when someone tries to draft one.

## The criterion, restated

> A half-beat is admissible **iff** it names a specific correspondence between a
> specific program state and a specific target-system state, and the learner can
> **break** it.

Plus one hard constraint: **the artifact must be falsifiable by running
something.** Prediction-shaped, never essay-shaped.

---

## (a) A good half-beat — C2, pure strings

C2's cash-out is already written: _"normalizers (trim-and-lowercase every
answer), mad-libs, a shouting greeter"_ [read: `chapters.md:889-890`]. The
half-beat does not sit beside that cash-out. It **changes what the cash-out is**
— the Whole-Game test.

Drafted at chapter register:

> ### What a normalizer claims
>
> Your normalizer does the same two things to every answer: `trim()` the spaces
> off the ends, `toLowerCase()` the letters. It works. Every answer comes out
> tidy.
>
> But look at what you have just told the machine. `trim().toLowerCase()` is not
> a tidying step. It is a **claim about the world**: _in the system I am
> modelling, capitalisation and surrounding space carry no information._ Two
> answers that differ only in those ways are the same answer.
>
> That claim is sometimes true. A quiz that accepts `"paris"`, `"Paris"` and
> `" PARIS "` as the same city is right to. Casing carries no information about
> which city was meant.
>
> Now break it.
>
> - A class roster where `Ada` and `ADA` are two different usernames. Your
>   normalizer merges two people into one.
> - A surname where the casing _is_ the name: `van der Berg`, `McDonald`,
>   `O'Brien`, `de la Cruz`. Your normalizer returns something nobody is called.
> - An answer where the spaces were the content — a password, an ASCII drawing,
>   a line of poetry.
>
> **Run one of these.** Prompt for a name, normalize it, and print the result
> beside the original. Find the case where the two should have stayed different
> and they did not.
>
> Nothing is broken in your program. The machine did exactly what you specified,
> and would do it again identically. What broke is the **correspondence** — the
> claim your program makes about the system it stands for. That is a different
> kind of wrong from a bug, and it is the kind no error message will ever
> report.
>
> **Cash-out, revised:** write a normalizer that is wrong about at least one
> real name, and a comment naming which one and why.

**Why it is admissible.** The correspondence is specific — program state (the
normalized string) to target state (the person's actual name). The learner can
break it, at the console, in about two minutes. The output is a comment naming a
real case, which an LLM can phrase but cannot have discovered in the learner's
own program. And it is genuine computational thinking: _every transform is an
assertion about which distinctions in the target system do not matter, and every
such assertion is falsifiable._

**What it costs.** One paragraph and one added comment in an exercise the
chapter already assigns. No new unit.

**What it feeds.** `ontology.md:237-243` already lists names, special characters
and dates as canonical harms — built for exactly this, and currently unconnected
to any Ch1 exercise. And it hands Ch2 a live user-twin question rather than an
abstract one.

---

## (b) A rejected half-beat — C1, bindings

Written deliberately badly, because a criterion published without a
counterexample gets complied with in form:

> ### ❌ Bindings and memory
>
> A binding is a named place the program can hold something and come back to it
> later — a lot like your own memory. Think about how you hold a friend's name
> in mind while you look for them in a crowd. Computers do the same thing, just
> more literally. Once you see it, you start noticing computation everywhere: a
> shopping list is a kind of variable, a parking space is a kind of binding.
> Programming is really just making explicit what your mind already does.

**Why it fails, precisely:**

- **No specific correspondence.** "A lot like your own memory" names no program
  state and no target state. Nothing is mapped to anything.
- **Nothing to break.** Every available response is agreement. There is no case
  a learner could run that would show the analogy failing, because the analogy
  makes no prediction.
- **It smuggles a metaphor in as structure.** `metaphor.md` exists to prevent
  exactly this: the cast is teaching apparatus, explicitly not structural guide.
- **It is unfalsifiable _and_ fluent**, which is the dangerous combination — the
  two-layer misconception mechanism, where a confident account the learner
  cannot verify installs a wrong model that produces right-looking answers for a
  while.
- **It is the cheapest thing an LLM can produce**, in the chapter where AI
  authoring is barred.

**Its admissible sibling — the café cup.** A café writes your name on a cup at
order time and reads it at pickup. That is a slot written once and read later.
Model it in two bindings, `name` and `drink`, run it, then find the divergences:
the barista mishears — the slot holds a value, the machine is fine, the _world_
is wrong. Is the cup `const` or `let`; can the name be changed after writing?
What does the café have no slot for — an allergy, a second person on the order —
and what goes wrong because there is no slot? Same content, five minutes,
falsifiable at every step.

---

## (c) The gate item

The Ch1 gate is currently _"full mastery of the chain — C0 through C6 plus the
four beats"_ [read: `chapters.md:1127-1128`], and it is assessable because Beat
D is a **performance**: one full-program trace touching every event family. An
educator watches the trace and sees whether the events are right.

"Demonstrated transfer" must be a performance of the same kind, or it is an
unfalsifiable gate — which is worse than the elective it was meant to replace,
because a soft gate cannot tell the learner whether they passed. In a self-paced
course the learner is the assessor.

**The item.** At the gate, the learner is given an unfamiliar text-shaped target
system — a café order queue, a class roster, a shipping label, a chat log — and
produces three things:

1. **The correspondence.** Which program state stands for which target-system
   state. Stated explicitly, not implied by the code.
2. **The limit.** What this target system has that the current JEJ surface
   cannot represent — and therefore what the program cannot be right about.
3. **A found divergence.** One case where the correspondence breaks, _exhibited
   by running the program_. Not described. Run.

**Why this works as a gate.** Item 3 is either exhibited or it is not — binary,
and the learner can tell. It inherits the course's existing predict-and-verify
grammar instead of introducing an essay genre. It is near transfer (a second
target system in the same discipline), which is the only kind the literature
supports. And it is self-assessable, which matters because the 🥚/🐣/🐥/🐔
markers are the learner's own instrument and transfer is otherwise the one
category nobody can self-assess.

**Layer assignment.** This item is the **L1 depth** of the half-beat, and it is
what the gate requires. L2 (when is this modelling stance the wrong instrument),
L3 (snippets that probe an affordance-space), and L4 (what it means that every
model is wrong in nameable ways) are descent, not requirement — so
`guide.learners.md:210`'s promise that L1 is a complete exit survives intact.

---

## What drafting these two revealed

Three things that the general form in [epicycles.md](./epicycles.md) does not
predict, and that only appeared on contact:

1. **The good half-beat rewrote the cash-out; it did not append to it.** The
   Whole-Game test is not a stylistic preference — it is the difference between
   an added unit and a changed sentence. That is most of the load argument,
   resolved by drafting rather than by reasoning.
2. **The transform-as-assertion framing generalises further than expected.**
   Every operator is a claim about which distinctions do not matter. `===` on
   strings, `Number()` on an answer, a `<` comparison on text. C5's
   coercion-versus-conversion weld is the same insight at a different cycle,
   already in the chapter, unnamed.
3. **The bad version is genuinely tempting**, and it reads as _warmer_ teaching
   than the good one. Any drafter under time pressure will write it. That is the
   argument for publishing the counterexample rather than only the rule.

## Still owed

- A drafted half-beat for **C4** (loops and counters), as the teachability check
  in [README.md](./README.md) specifies — a reader who has never seen F&V should
  be able to draft it from this document plus `epicycles.md`.
- A V-flavoured example at Ch2, once the V1–V5 ladder is read against this form.

## Related

- [epicycles.md](./epicycles.md) — the general form and the criterion
- [observability.md](./observability.md) — condition 3b, of which the gate item
  is the exercise form
