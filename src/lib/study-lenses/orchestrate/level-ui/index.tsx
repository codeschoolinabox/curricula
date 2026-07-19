/**
 * The LevelSelector component — the level surfaces: the closed face showing
 * the selected level's state (or the none-state), the open list with one
 * entry per registered level plus the none-state entry, docs on hover, and
 * the strict toggle. Pure presentation: everything arrives computed; intent
 * goes up as callbacks; whether the list is open is component-local
 * ephemeral state, never a session choice — a face click toggles it
 * (reflected as `aria-expanded`), and selecting any entry closes it.
 *
 * @remarks
 * Selector contract (data attributes; label text is never an anchor):
 * `data-level-selector` on the root; `data-level-face` on the closed face
 * (carrying `data-level-mark` only when a level is selected);
 * `data-level-option="<key>"` per list entry (`""` = the none-state entry,
 * rendered first), each level entry carrying `data-level-mark="<mark>"` and
 * its docs as the native hover `title` (plain text — the rendered-markdown
 * hover surface is a flagged follow-on); `data-strict-toggle` carries
 * `aria-pressed` reflecting the given posture.
 */

import React from 'react';

import type { LevelSelectorProperties } from './types.js';

export default function LevelSelector({
	options,
	selectedKey,
	noneLabel,
	strict,
	onSelectLevel,
	onToggleStrict,
}: LevelSelectorProperties): React.JSX.Element {
	const [open, setOpen] = React.useState(false);
	const selected = options.find((option) => option.key === selectedKey);

	function selectAndClose(key: string): void {
		onSelectLevel(key);
		setOpen(false);
	}

	return (
		<div data-level-selector>
			<button
				aria-expanded={open}
				data-level-face
				data-level-mark={selected?.mark}
				onClick={() => setOpen((current) => !current)}
				type="button"
			>
				{selected ? `${selected.label} · ${selected.mark}` : noneLabel}
			</button>
			{open ? (
				<ul data-level-list>
					<li>
						<button
							data-level-option=""
							onClick={() => selectAndClose('')}
							type="button"
						>
							{noneLabel}
						</button>
					</li>
					{options.map((option) => (
						<li key={option.key}>
							<button
								data-level-mark={option.mark}
								data-level-option={option.key}
								onClick={() => selectAndClose(option.key)}
								title={option.docs}
								type="button"
							>
								{option.label}
							</button>
						</li>
					))}
				</ul>
			) : null}
			<button
				aria-pressed={strict}
				data-strict-toggle
				onClick={() => onToggleStrict(!strict)}
				type="button"
			>
				strict
			</button>
		</div>
	);
}
