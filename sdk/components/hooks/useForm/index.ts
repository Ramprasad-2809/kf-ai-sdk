// ============================================================
// useForm Hook - Public API
// ============================================================

// === MAIN HOOK ===
export { useForm } from './useForm';

// === TYPES: Core (Always needed) ===
export type {
  UseFormOptionsType,
  UseFormReturnType,
  FormOperationType,
  FormModeType,
} from './types';

// === TYPES: Form Field Configuration (For dynamic form rendering) ===
export type {
  FormFieldConfigType,
  FormSchemaConfigType,
  FormFieldTypeType,
  SelectOptionType,
  FieldPermissionType,
  FieldRuleIdsType,
} from './types';

// === TYPES: Result Types ===
export type {
  FieldValidationResultType,
  SubmissionResultType,
} from './types';

// === TYPES: BDO Schema (For advanced schema manipulation) ===
export type {
  BDOSchemaType,
  BDOFieldDefinitionType,
  SchemaValidationRuleType,
  ComputedFieldFormulaType,
  DefaultValueExpressionType,
  ReferenceFieldConfigType,
  FieldOptionsConfigType,
  ExpressionTreeType,
  BusinessObjectRulesType,
  RolePermissionType,
  RuleTypeType,
} from './types';

// === TYPES: Expression Evaluation (For custom expression handling) ===
export type {
  ExpressionContextType,
} from './types';

// === UTILITIES: Error Handling ===
export {
  parseApiError,
  isNetworkError,
  isValidationError,
} from './apiClient';

// === UTILITIES: Cache Control ===
export { clearCache as clearFormCache } from './apiClient';
