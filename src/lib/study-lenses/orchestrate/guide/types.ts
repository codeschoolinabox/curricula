/**
 * The embedded guide's contract: the authored topic shape. The guide takes no
 * props — its topics are its own authored constant, like a level's docs are
 * the level's own — so this is the only contract the surface carries.
 *
 * Surface docs: ./README.md (contract) · ./DOCS.md (architecture).
 */

/**
 * One authored orientation topic: a stable key (the data-attribute identity,
 * independent of the mutable copy), a title, and a plain-text body. Topics
 * describe the instrument, never the learner's program, and never restate
 * canon another surface single-sources.
 */
export type GuideTopic = {
	readonly key: string;
	readonly title: string;
	readonly body: string;
};
