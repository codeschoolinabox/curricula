/**
 * Creates the domain fields for a branch event — which path an if statement
 * took. Branch fires only for if statements (ternaries have no branch
 * sub-event), so kind is always 'if'. The dispatcher stamps the base fields.
 */
export default function createBranchEvent(
	{ branch, scopeCreationStep }: BranchParams = {} as BranchParams,
): BranchDomainFields {
	return {
		category: 'conditional',
		kind: 'if',
		event: 'branch',
		branch,
		scopeCreationStep,
	};
}

type BranchParams = {
	readonly branch: 'consequent' | 'alternate' | 'none';
	readonly scopeCreationStep: number;
};

/** Domain fields (base stamped downstream) for ConditionalEvent(branch, kind 'if'). */
type BranchDomainFields = {
	readonly category: 'conditional';
	readonly kind: 'if';
	readonly event: 'branch';
	readonly branch: 'consequent' | 'alternate' | 'none';
	readonly scopeCreationStep: number;
};
