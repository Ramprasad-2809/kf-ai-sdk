// ============================================================
// useForm Hook - Public API
// ============================================================

// === MAIN HOOK ===
export { useForm } from './useForm';

// === TYPES: Core (Always needed) ===
export type {
  UseFormOptions,
  UseFormReturn,
  FormOperation,
  FormMode,
} from './types';

// === TYPES: Form Field Configuration (For dynamic form rendering) ===
export type {
  FormFieldConfig,
  FormSchemaConfig,
  FormFieldType,
  SelectOption,
  FieldPermission,
  FieldRuleIds,
} from './types';

// === TYPES: Result Types ===
export type {
  FieldValidationResult,
  SubmissionResult,
} from './types';

// === TYPES: BDO Schema (For advanced schema manipulation) ===
export type {
  BDOSchema,
  BDOFieldDefinition,
  SchemaValidationRule,
  ComputedFieldFormula,
  DefaultValueExpression,
  ReferenceFieldConfig,
  FieldOptionsConfig,
  ExpressionTree,
  BusinessObjectRules,
  RolePermission,
  RuleType,
} from './types';

// === TYPES: Expression Evaluation (For custom expression handling) ===
export type {
  ExpressionContext,
} from './types';

// === UTILITIES: Error Handling ===
export {
  parseApiError,
  isNetworkError,
  isValidationError,
} from './apiClient';

// === UTILITIES: Cache Control ===
export { clearCache as clearFormCache } from './apiClient';
