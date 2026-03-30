import type { ReferenceCreateEntry, ValueRepresentation } from '../types.js';

function create({
  value, // determined by value config - reference entry? copy entry?  details TBD
  id,
}: {
  readonly value?: ValueRepresentation;
  readonly id?: number;
} = {}): ReferenceCreateEntry {
  return {
    category: 'scope',
    event: 'create',
    ...(value !== undefined && { value }),
    ...(id !== undefined && { id }),
  };
}

export default create;
