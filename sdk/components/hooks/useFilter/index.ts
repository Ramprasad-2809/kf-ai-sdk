// Main hook export
export { useFilter } from '../useFilter';
export type {
  FilterConditionWithId,
  FilterState,
  FieldDefinition,
  ValidationResult,
  ValidationError,
  UseFilterOptions,
  UseFilterReturn
} from '../useFilter';

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
} from './validation';

// Payload building utilities
export {
  buildFilterPayload,
  buildFilterPayloadFromState,
  validateFilterPayload,
  cloneFilterPayload,
  mergeFilterPayloads,
  filterPayloadToString,
  areFilterPayloadsEqual
} from './payloadBuilder';