/**
 * @file Toolbar component for the study-lenses orchestrator.
 *
 * Increment 9 ships only the lens-picker dropdown. Transform toggles,
 * Reset, Reset All, snippet name, and recommender land in
 * Increments 10–14 as additional toolbar children — none of those
 * changes the wrapper's effect topology.
 *
 * @remarks Pure presentational. The component takes a value (the
 * currently-active lens name), the list of options to show in the
 * dropdown, and an `onLensChange` callback the wrapper invokes
 * `setState` from. No state is held inside the toolbar; selecting
 * the currently-active lens is a no-op because the dispatch-effect
 * short-circuits on equal-value transitions (see `study-lenses.tsx`).
 *
 * @remarks Accessibility: the `<select>` carries `aria-label="Lens"`
 * so it has an accessible name without needing a visible label
 * (Increment 9 ships no toolbar styling). Keyboard navigation is the
 * browser default for `<select>`.
 */

import React from 'react';

type ToolbarProperties = Readonly<{
	value: string;
	options: ReadonlyArray<string>;
	onLensChange: (next: string) => void;
}>;

function Toolbar(properties: ToolbarProperties): React.JSX.Element {
	const { value, options, onLensChange } = properties;
	return (
		<nav data-orchestrator-toolbar="">
			<select
				data-orchestrator-lens-picker=""
				aria-label="Lens"
				value={value}
				onChange={function handleChange(event) {
					onLensChange(event.currentTarget.value);
				}}
			>
				{options.map(function renderOption(name) {
					return (
						<option key={name} value={name}>
							{name}
						</option>
					);
				})}
			</select>
		</nav>
	);
}

export default Toolbar;
