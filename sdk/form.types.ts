// ============================================================
// FORM MODULE - Type Exports
// @ram_28/kf-ai-sdk/form/types
// ============================================================

// Re-export commonly used types from react-hook-form
export type {
  FieldErrors,
  UseFormRegister,
  FormState,
  Path,
  PathValue,
} from "react-hook-form";

export type {
  // Core hook types
  UseFormOptionsType,
  UseFormReturnType,
  HandleSubmitType,

  // Form operation types
  FormOperationType,
  FormModeType,
  InteractionModeType,

  // Form field configuration
  FormFieldConfigType,
  FormSchemaConfigType,
  FormFieldTypeType,
  SelectOptionType,
  FieldPermissionType,
  FieldRuleIdsType,

  // Result types
  FieldValidationResultType,
  SubmissionResultType,

  // BDO Schema types
  BDOSchemaType,
  BDOFieldDefinitionType,
  SchemaValidationRuleType,
  ComputedFieldFormulaType,
  DefaultValueExpressionType,
  ReferenceFieldConfigType,
  FieldOptionsConfigType,
  BusinessObjectRulesType,
  RolePermissionType,

  // Expression types
  ExpressionTreeType,
  ExpressionContextType,

  // Rule types
  RuleTypeType,
} from "./components/hooks/useForm/types";
