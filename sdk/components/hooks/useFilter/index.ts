// Main hook export
export { useFilter } from './useFilter';

// Type exports
export type {
  FilterConditionWithId,
  TypedFilterConditionInput,
  FilterState,
  FieldDefinition,
  ValidationResult,
  ValidationError,
  UseFilterOptions,
  UseFilterReturn
} from './types';

// Validation utilities
export {
  validateNumberValue,
  validateDateValue,
  validateCurrencyValue,
  validateStringValue,
  validateBooleanValue,
  validateSelectValue,
  getDefaultFieldDefinition,
  createFieldDefinitionsFromSample
} from './validation.utils';

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