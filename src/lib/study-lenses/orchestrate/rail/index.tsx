/**
 * The Rail component — the lifecycle drawn as the machine's own conveyor: a
 * line carrying one station per phase in the machine's fixed order, the
 * barring edge drawn BETWEEN two stations rather than on either of them, each
 * station's tray opening beneath the line, and the caption beneath that.
 *
 * @remarks
 * Selector contract (data attributes; drawn copy is never an anchor):
 * `data-rail` on the line; `data-station="<phase>"` per station;
 * `data-station-standing="<standing>"` on each; `data-station-tray` on an
 * open tray; `data-station-occupant` on the station whose lens the pane
 * holds; `data-barring-edge` between the last reachable station and the first
 * waiting one; `data-caption` on the caption, with `data-caption-cause` or
 * `data-caption-count` on whichever arm it holds. No heading elements — every
 * station name and tray label is inline text, and the structure a screen
 * reader traverses comes from named regions and groups.
 *
 * Phase 0 stub: the surface is the contract this unit locks; the body lands
 * in Phase 1, un-skipping its suite one cluster at a time.
 */

import React from 'react';

import type { RailProperties } from './types.js';

export default function Rail(_properties: RailProperties): React.JSX.Element {
	throw new Error('Rail: not implemented');
}
