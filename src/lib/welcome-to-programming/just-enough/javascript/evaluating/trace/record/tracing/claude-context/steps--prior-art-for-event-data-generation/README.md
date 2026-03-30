# Steps

Functions for generating step objects. They take in basic analysis data and return a structured object conforming to the _config/trace symmetry_ principle described in this repository's README.

Returned step entries do not necessarily contain meta-data like step index or AST node ID, these are added later by the internal step-tracker module. This allows entry-specific data such as coercion or short-circuiting to be hidden behind the generator, allowing the advice and step-tracker a narrower set of concerns more generic concerns.

Additionally, abstracting entry records makes them testable, simplifies the advice functions developed for Aran, and decouples entry type definitions from instrumentation logic.
