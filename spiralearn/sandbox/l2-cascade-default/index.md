---
sidebar_position: 3
---

# L2 cascade-default-lens — bare-fence eyeball check

Sandbox page for the L2 sprint's user-observable end-to-end checkpoint.
The fence below is a **bare** `` ```js `` fence (no `:suffix`, no
frontmatter `defaultLens`). The directory's `lenses.json` sets
`{"defaults": {"js": "debug-props"}}`, so the cascade's default-lens
seam (L2) populates the emitted `<StudyLenses>` node with
`lens="debug-props"` and the orchestrator mounts that lens at initial
render.

What to verify visually (open the rendered page in the dev server):

- The fence renders as the `debug-props` lens (not the editor home base
  and not a raw code block).
- The toolbar above shows the picker with `debug-props` selected and
  an "Edit code" button visible.
- Clicking "Edit code" returns to editor mode with the snippet intact.
- Selecting a different lens from the picker mounts it; selecting
  `debug-props` again instantly returns (cache hit).

If the fence renders as the editor home base instead, the cascade-default
seam did not wire (re-check `transformFence` and the L2.1 commit).
If it renders as a raw code block, the configured-languages gate did
not pass (re-check the `lenses.json` syntax + the L2.6 type widen).

```js
const greeting = (name) => `hello, ${name}`;
console.log(greeting('world'));
```
