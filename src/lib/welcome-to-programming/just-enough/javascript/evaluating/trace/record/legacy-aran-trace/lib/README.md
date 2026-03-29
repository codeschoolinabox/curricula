# lib

Utility functions used by the legacy Aran tracer.

## Files

| File                | Purpose                                                |
| ------------------- | ------------------------------------------------------ |
| `deep-clone.js`     | Deep-clones values for trace snapshots (avoids capturing mutable references) |
| `is-built-in.js`    | Checks whether a value is a built-in global (to label it in trace output) |
| `is-in-range.js`    | Checks whether a source location falls within the user's configured line range |
| `log-hoisted.js`    | Logs hoisted variable declarations at the start of a scope |
| `trace-collector.js` | Collects trace entries — the `print()` function that advice hooks call |
| `trace-log.js`      | Formats trace entries for console output (modified to remove DOM dependency) |
