/**
 * The embedded guide — help never withheld. A button-labeled disclosure
 * (no heading of its own), collapsed by default; open, it renders the
 * guide's own authored orientation topics in array order, each titled at
 * `h4` under the panel's `h3` shallowest-heading constraint.
 *
 * @remarks
 * Selector contract: `data-guide` on the root; `data-guide-reveal` on the
 * disclosure control (carrying `aria-expanded`); `data-guide-topic="<key>"`
 * per topic entry. No props, zero derivation, no intent up — whether the
 * guide is open is component-local ephemeral state, never a session choice.
 */

import React from 'react';

import freezeInPlace from '@utils/freeze-in-place.js';

import type { GuideTopic } from './types.js';

export default function Guide(): React.JSX.Element {
	const [open, setOpen] = React.useState(false);

	return (
		<div data-guide>
			<button
				aria-expanded={open}
				data-guide-reveal
				onClick={() => setOpen((current) => !current)}
				type="button"
			>
				Guide
			</button>
			{open ? (
				<div>
					{GUIDE_TOPICS.map((topic) => (
						<section data-guide-topic={topic.key} key={topic.key}>
							<h4>{topic.title}</h4>
							<p>{topic.body}</p>
						</section>
					))}
				</div>
			) : null}
		</div>
	);
}

// The guide's own authored content — orientation toward the instrument's
// concepts, never a restatement of the canon other surfaces single-source.
const GUIDE_TOPICS: ReadonlyArray<GuideTopic> = freezeInPlace([
	{
		key: 'phases',
		title: 'The five phases',
		body: 'The panel walks your code through five phases, each building on the one before. Every phase offers its own ways to study what you wrote — and when an early phase fails, the ones after it wait until the code recovers.',
	},
	{
		key: 'levels',
		title: 'Language levels',
		body: 'A language level is an opt-in subset of the language to practice inside. Select one to see how your code fits it, and hover a level in the list to read what it covers. No level is ever required.',
	},
	{
		key: 'posture',
		title: 'Warn and strict',
		body: 'Out of the box you are only ever notified — the selected level’s mark updates as you type, and nothing is taken away. Turning on strict makes the selected level binding: the study surfaces pause while your code steps outside it, and the editor and every control keep working the whole time.',
	},
	{
		key: 'snippet-type',
		title: 'Two ways to read a program',
		body: 'The type toggle changes how the machine reads the same text — names and top-level meaning can differ between the two readings. Toggling re-derives everything immediately.',
	},
]);
