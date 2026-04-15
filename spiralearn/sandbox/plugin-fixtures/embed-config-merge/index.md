# Embed-config-merge fixture

The sibling exercise file has a directive with inline JSON config;
this `lenses.json` has `lenses.parsons = { shuffleSeed: 42 }`. The
emitted `<StudyLens>` must receive the merged config.
