// cspell:ignore affordance

/**
 * The generator view — the pane's THIRD occupant, where a learner remixes their
 * own program with a prompt. It mounts over the program exactly as it stood at
 * the open: the seed read-only, the prompt empty, and the warning already said.
 *
 * @remarks
 * Selector contract (data attributes; label text is never an anchor):
 * `data-generator` on the view root; `data-generator-seed` on the read-only
 * seed; `data-generator-prompt` on the prompt field; `data-generator-generate`
 * on the ask affordance ("Generate"), which is not live while an empty prompt
 * sits over an empty seed — that pair asks nothing.
 *
 * Emptiness is literal here, as it is at the socket: a whitespace-only prompt
 * is learner text that survives into the candidate, so it is something to ask
 * about. The warning carries no attribute of its own — it is prose, not an
 * affordance. The view renders inline text only and no heading elements, so the
 * instrument's sole headings stay the guide's topic titles.
 *
 * View docs: ./README.md (the view contract) · ./DOCS.md (the architectural
 * sketch, whose phase 1 "Seat the seed" this file answers).
 */

import React from 'react';

import type { GeneratorViewProperties } from './types.js';

export default function GeneratorView({
	seed,
}: GeneratorViewProperties): React.JSX.Element {
	const [prompt, setPrompt] = React.useState('');
	const hasSomethingToAskAbout = seed !== '' || prompt !== '';

	return (
		<div data-generator>
			<p>{TAKES_TIME_WARNING}</p>
			<pre data-generator-seed>{seed}</pre>
			<label>
				{PROMPT_LABEL}
				<textarea
					data-generator-prompt
					onChange={(event) => setPrompt(event.target.value)}
					value={prompt}
				/>
			</label>
			<button
				data-generator-generate
				disabled={!hasSomethingToAskAbout}
				type="button"
			>
				Generate
			</button>
		</div>
	);
}

// Both facts, before the first click: a learner who is not told loses an ask to
// a control one click away in the same band, and hears why only afterwards.
const TAKES_TIME_WARNING =
	'Generating can take a while. Leaving this view ends it — and so does changing the level, the posture, or the snippet type.';

const PROMPT_LABEL = 'Your prompt';
