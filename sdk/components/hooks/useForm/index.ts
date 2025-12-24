// ============================================================
// USE FORM HOOK - MAIN EXPORT
// ============================================================

// Main hook
export { useForm } from './useForm';

// Types
export type {
  UseFormOptions,
  UseFormReturn,
  BackendSchema,
  BackendFieldDefinition,
  ProcessedField,
  ProcessedSchema,
  FormOperation,
  FormMode,
  ValidationResult,
  SubmissionResult,
  ExpressionTree,
  ValidationRule,
  Formula,
  DefaultValue,
  ReferenceField,
  FieldValues,
  EvaluationContext
} from './types';

// Utilities
export {
  processSchema,
  updateComputedFields,
  buildDependencyMap,
  extractReferenceFields,
  validateSchema,
  buildReferenceFieldConfig
} from './schemaParser.utils';

export {
  evaluateExpression,
  validateField,
  validateCrossField,
  calculateComputedValue,
  calculateDefaultValue
} from './expressionValidator.utils';

export {
  fetchFormSchema,
  fetchFormSchemaWithRetry,
  fetchRecord,
  submitFormData,
  fetchReferenceData,
  fetchAllReferenceData,
  validateFormData,
  cleanFormData,
  parseApiError,
  isNetworkError,
  isValidationError,
  setCacheData,
  getCacheData,
  clearCache,
  fetchFormSchemaWithCache,
  fetchReferenceDataWithCache
} from './apiClient';