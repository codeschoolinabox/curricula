# Debug Lens

Execute learner JavaScript in a hidden iframe with `debugger` breakpoints before
and after their code. The learner steps through their program in DevTools.

## API

```ts
async function debug(code: string, maxIterations?: number): Promise<void>;
```

- `maxIterations` — if provided, injects loop guards that throw `RangeError`
  after this many iterations. Omit to skip loop guarding.

Returns a Promise that resolves after the code (and any debugger pauses)
finishes executing.

## How It Works

1. Each call creates a fresh wrapper `<div>` + hidden `<iframe>`
2. Two `<script type="module">` tags are injected into the iframe:
   - **Script 1**: `debugger; <learner code> debugger;`
   - **Script 2**: `postMessage` back to parent signaling completion
3. Module scripts execute in order — Script 2 runs only after Script 1 completes
4. Parent receives the message, removes the wrapper from the DOM, and resolves
   the Promise

No DOM artifacts remain after execution completes.

## Sandbox

To test interactively, start the Vite dev server from the project root:

```sh
npx vite --config src/lib/just-enough-javascript/evaluating/debug/vite.sandbox.config.ts
```

Then open `http://localhost:5173/sandbox.html`.
