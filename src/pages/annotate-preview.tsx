/**
 * @file Dev preview harness for the `annotate` lens. Mounts the lens's
 * React `Component` DIRECTLY (importing the LensModule + `embody`),
 * bypassing the orchestrator's `LENS_REGISTRY` — `annotate` is not
 * registered until the WS3 registry-coordination step. This page is the
 * browser eyeball surface for the WS4 sandbox checkpoints (Inc 6 → 7c):
 * type a snippet, toggle colorize / default view, and observe the lens.
 *
 * **How to use** (after `npm run start`):
 *
 * 1. Open `http://localhost:3000/annotate-preview` in a browser.
 * 2. Edit the snippet, toggle the controls, and watch the lens re-mount.
 * 3. Open devtools and confirm the root `<div data-lens="annotate"
 *    data-view-mode="…">` is present (the skeleton renders an empty
 *    shell until later increments add the code / flowchart views).
 *
 * @vitest-skip — Docusaurus auto-routes `src/pages/*.tsx`; this is a
 * page, not a unit test.
 */

import Layout from '@theme/Layout';
import React from 'react';

import embody from '@site/src/lib/just-enough/javascript/embody/index.js';
import annotateLens from '@site/src/lib/just-enough/javascript/lenses/annotate/index.js';
import type { ViewMode } from '@site/src/lib/just-enough/javascript/lenses/annotate/types.js';

const SAMPLE =
	'function classify(n) {\n\tif (n > 0) {\n\t\treturn "positive";\n\t}\n\treturn "non-positive";\n}';

export default function AnnotatePreview(): React.JSX.Element {
	const [code, setCode] = React.useState<string>(SAMPLE);
	const [colorize, setColorize] = React.useState<boolean>(true);
	const [defaultView, setDefaultView] = React.useState<ViewMode>('code');

	return (
		<Layout title="annotate preview" description="WS4 annotate lens harness">
			<main style={{ maxWidth: 860, margin: '2rem auto', padding: '0 1rem' }}>
				<h1>annotate lens preview (WS4)</h1>
				<p>
					Mounts <code>annotate.Component</code> directly (no registry). The
					skeleton renders an empty <code>data-lens=&quot;annotate&quot;</code>{' '}
					shell; later increments add the code and flowchart views.
				</p>

				<label style={{ display: 'block', marginBottom: 8 }}>
					Snippet:
					<textarea
						value={code}
						onChange={function onCodeChange(event) {
							setCode(event.target.value);
						}}
						rows={6}
						style={{ width: '100%', fontFamily: 'monospace' }}
					/>
				</label>

				<div style={{ display: 'flex', gap: 16, marginBottom: '1.5rem' }}>
					<label>
						<input
							type="checkbox"
							checked={colorize}
							onChange={function onColorizeChange(event) {
								setColorize(event.target.checked);
							}}
						/>{' '}
						colorize
					</label>
					<label>
						default view:{' '}
						<select
							value={defaultView}
							onChange={function onViewChange(event) {
								setDefaultView(event.target.value as ViewMode);
							}}
						>
							<option value="code">code</option>
							<option value="flowchart">flowchart</option>
						</select>
					</label>
				</div>

				<div style={{ border: '1px solid #ccc', padding: '1rem' }}>
					<annotateLens.Component
						key={`${code}|${String(colorize)}|${defaultView}`}
						embodiment={embody(code)}
						config={annotateLens.config({ colorize, defaultView })}
					/>
				</div>
			</main>
		</Layout>
	);
}
