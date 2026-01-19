// Main hook export
export { useFilter } from './useFilter';

// Type exports
export type {
  FilterConditionWithId,
  TypedFilterConditionInput,
  FilterState,
  ValidationResult,
  ValidationError,
  UseFilterOptions,
  UseFilterReturn
} from './types';

// Payload building utilities
export {
  buildFilterPayload,
  buildFilterPayloadFromState,
  validateFilterPayload,
  cloneFilterPayload,
  mergeFilterPayloads,
  filterPayloadToString,
  areFilterPayloadsEqual
} from './payloadBuilder.utils';