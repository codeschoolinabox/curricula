import type { ReferenceMutateEntry, ValueRepresentation } from '../types.js';

function mutate({
  value, // determined by value config - reference entry? copy entry?  details TBD
  update, // diff, or full thing - based on value config?  details TBD
  id,
}: {
  readonly value?: ValueRepresentation;
  readonly update?: ValueRepresentation;
  readonly id?: number;
} = {}): ReferenceMutateEntry {
  return {
    category: 'scope',
    event: 'mutate',
    ...(value !== undefined && { value }),
    ...(update !== undefined && { update }),
    ...(id !== undefined && { id }),
  };
}

export default mutate;
