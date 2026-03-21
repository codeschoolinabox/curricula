---
sidebar_position: 4
---

# 2.4: Just Enough Types and Operators

By the end of this subchapter, learners will have seen all the data types and
operators they'll need for the entire curriculum. This is a breadth chapter —
surveying the type system rather than going deep on any single type.

## Language Features

- Numbers + basic arithmetic (`+`, `-`, `*`, `/`)
- Booleans + boolean operators (`&&`/`and`, `||`/`or`, `!`/`not`)
- `None` (Python) / `undefined` and `null` (JS)
- String methods and operations:
  - `.length` / `len()`
  - Character index access (`str[i]`)
  - Index-based slicing (`.slice()` / `str[a:b]`)
  - `.includes()` / `in`
  - `.toLowerCase()` / `.lower()` and `.toUpperCase()` / `.upper()`

## Skills and Objectives

- 🥚 Understanding how operators work within a single type
- 🥚 Type coercion rules (different in JS vs. Python — this is explicitly
  discussed)
- 🐣 How operators work across types
- 🐣 Short-circuiting in boolean operators (demonstrated with logs —
  `true || console.log('skipped')`)
- 🥚 Practicing all of this with assertion-based exercises

## Exercise Types

- Marking syntax (operators, method calls)
- Tracing (expressions with multiple operators, type coercion)
- Predictive stepping
- Assertion exercises (predict the result of expressions)
- Comparing programs (type coercion edge cases JS vs. Python)
