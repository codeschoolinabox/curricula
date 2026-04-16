# Sibling Embed — Config Merge (trailing directive)

Same behavior as the leading-placement fixture next door, but the
`@study-lens` directive sits at the **bottom** of `exercise.js`.
Authors who prefer writing the exercise first and tucking metadata
out of the way at the end can use this placement; the plugin detects
the directive in either the leading or trailing comment block.

The emitted `<StudyLens>` must carry the merged config
(`shuffleSeed` from the cascade, `distractors` from the directive)
AND its `code` prop must NOT contain the `@study-lens` JSDoc —
learners see only the exercise body.
