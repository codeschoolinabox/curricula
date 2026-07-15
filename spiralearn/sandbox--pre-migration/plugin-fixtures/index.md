---
sidebar_position: 1
---

# Plugin fixtures — manual test surface

Each subpage below is a fixture lifted from the `study-lenses` plugin's
integration test suite. Browsing them in order exercises every V1 feature.

## Fence transform

- [configured-js](./configured-js/) — baseline `<StudyLenses>` emission
- [suffix-overrides](./suffix-overrides/) — `:highlight` suffix wins
- [cascade-defaults](./cascade-defaults/) — chapter `lenses.json` override
- [configured-python](./configured-python/) — `defaults.python` opts in
- [frontmatter-default-lens](./frontmatter-default-lens/) — frontmatter
  `defaultLens` precedence
- [mixed-langs](./mixed-langs/) — `txt` / bare fences pass through
- [no-configured-langs](./no-configured-langs/) — ASCII art survives
- [```js:format,editor](./fence-transform-editor/)

## Sibling auto-embed

- [embed-bottom](./embed-bottom/) — per-sibling `<StudyLenses>` at page end
- [embed-tabs](./embed-tabs/) — native Docusaurus `<Tabs>`
- [embed-with-heading](./embed-with-heading/) — custom h2 section header
- [embed-config-merge](./embed-config-merge/) — directive JSON merged with
  cascade

## Page-identity edge case

- [readme-alone](./readme-alone/) — `README.md` as the sibling-bearing page

> The `readme-with-index` fixture (coexisting `README.md` + `index.md`) stays
> under `src/plugins/study-lenses/tests/fixtures/` — Docusaurus's routing can
> error on dual-index pages. Its behavior is covered by unit tests only.
