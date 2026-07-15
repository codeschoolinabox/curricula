# Tabs-mode Embed with Cascade Lenses Config

The sibling exercise file routes through `appendTabsEmbed`. The cascade has
`lenses.parsons.shuffleSeed=42`. The emitted inner `<StudyLenses>` (inside the
`<TabItem>`) must carry the `configs` attribute carrying the full cascade
`lenses.*` map. (For `config`-merge coverage in tabs mode see
`embed-config-merge`'s bottom-mode tests; this fixture is configs-only.)
