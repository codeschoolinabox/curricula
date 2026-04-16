/**
 * @file Test stub for `@docusaurus/BrowserOnly`. In production, Docusaurus's
 * BrowserOnly renders its fallback during SSR and its children function once
 * React has hydrated in the browser. Under vitest + jsdom, "we're in a
 * browser" is always true, so the stub unconditionally renders the children
 * function's return value. Tests that want to exercise the fallback path
 * should override this stub locally via `vi.mock`.
 */

import React from 'react';

type BrowserOnlyProps = {
	readonly children: () => React.ReactNode;
	readonly fallback?: React.ReactNode;
};

function BrowserOnly({ children }: BrowserOnlyProps): React.ReactNode {
	return <>{children()}</>;
}

export default BrowserOnly;
