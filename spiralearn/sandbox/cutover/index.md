---
sidebar_position: 6
---

# Cutover checkpoint

A fenced JS block, run through the `lenses.json` cascade instead of a hand-built
harness — this page renders whichever orchestrator tree `MDXComponents.js`
currently points at, with no tree reference of its own. Expected: the fence
becomes an interactive editor holding the seed program below, no lens strip
above it — `study` is not a registered lens in either orchestrator tree, so the
cascade default falls back to plain-editor mode. That fallback is what makes
this page reusable as both the "before" proof (the deprecated tree renders it)
and the "after" proof (the new tree, once `MDXComponents.js` points at it,
renders it too) without editing the page.

```js
const greeting = 'hello';
console.log(greeting);
```
