/**
 * @file Browser-only client of the study lens. Commit 1 placeholder —
 * later commits replace the inline `<CodeBlock>` with a CodeMirror
 * editor (commit 2) and a toolbar (commit 3+).
 *
 * This file runs behind a `<BrowserOnly>` boundary; it can freely
 * reference `document`/`window` in later commits without breaking
 * SSR. In commit 1 the placeholder is isomorphic (no DOM access)
 * because no real editor has been wired yet.
 */

import CodeBlock from '@theme/CodeBlock';
import React from 'react';

import type { StudyOptions } from './types.js';

type StudyLensClientProps = {
	readonly code: string;
	readonly options: StudyOptions;
};

/**
 * Placeholder client — renders the same `<CodeBlock>` as the SSR
 * fallback. Commit 2 replaces this body with the CodeMirror mount.
 */
function StudyLensClient({
	code,
}: StudyLensClientProps): React.JSX.Element {
	return <CodeBlock language="js">{code}</CodeBlock>;
}

export default StudyLensClient;
export type { StudyLensClientProps };
