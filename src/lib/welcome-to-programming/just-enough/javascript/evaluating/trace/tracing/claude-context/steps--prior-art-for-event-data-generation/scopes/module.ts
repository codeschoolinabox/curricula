import type { BindingsRecord } from '../types.js';

function module({
  event,
  bindings,
  file,
}: {
  readonly event?: string;
  readonly bindings?: BindingsRecord;
  readonly file?: string;
} = {}) {
  return {
    category: 'scope',
    kind: 'function',
    event,
    bindings,
    file,
  };
}

export default module;
