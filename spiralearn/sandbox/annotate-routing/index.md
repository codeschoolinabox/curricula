---
sidebar_position: 2
---

# annotate routing — `LENS_REGISTRY` registered-path check

Sandbox page for the live-render eyeball check from the
[annotate-registration handoff](../../../src/lib/just-enough/javascript/.planning-handoffs/04a-annotate-registration-handoff.md)
step 4. The fence below uses `js:annotate` (suffix-driven lens dispatch) so the
orchestrator's `LENS_REGISTRY` must route the fence through the registered
`annotate` lens instead of falling through to the editor home base.

This complements the existing `/annotate-preview` page, which mounts
`annotate.Component` **directly** (bypassing the registry). Together the two
pages cover the lens itself + the registration wiring.

What to verify visually (open the rendered page in the dev server):

- A `<div data-lens="annotate" data-view-mode="…">` root renders below
  (not the editor home base / `<textarea data-orchestrator-host>`).
- React DevTools shows the mounted component is `annotate`'s React
  `Component`, not the editor.
- If the fence dispatches to the fallback instead of the `annotate` lens,
  the registration commit (`0d91553`) did not take — re-check
  `orchestrate/index.tsx`'s `LENS_REGISTRY`.

```js:annotate
function greet(name) {
	return "hello, " + name;
}
```
