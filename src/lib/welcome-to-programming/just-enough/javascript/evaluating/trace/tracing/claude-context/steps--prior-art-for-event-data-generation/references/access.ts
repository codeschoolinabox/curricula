import type { ReferenceAccessEntry, ValueRepresentation } from '../types.js';

function access({
  value, // determined by value config - reference entry? copy entry?  details TBD
  id,
}: {
  readonly value?: ValueRepresentation;
  readonly id?: number;
} = {}): ReferenceAccessEntry {
  return {
    category: 'scope',
    event: 'access',
    ...(value !== undefined && { value }),
    ...(id !== undefined && { id }),
  };
}

export default access;
