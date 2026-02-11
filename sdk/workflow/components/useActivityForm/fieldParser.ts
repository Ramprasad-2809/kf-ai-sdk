// ============================================================
// ACTIVITY FIELD PARSER
// ============================================================
// Converts Activity Input field definitions to ActivityFieldConfig
// Follows the same mapping logic as schemaParser.utils.ts

import type {
  ActivityInputFields,
  ActivityInputFieldDefinition,
  ActivityFieldConfig,
} from "./types";
import type {
  FormFieldTypeType,
  SelectOptionType,
} from "../../../components/hooks/useForm/types";

// ============================================================
// TYPE MAPPING
// ============================================================

/**
 * Map Activity Input field type to form field type.
 * If Constraint.Enum is present, the field becomes "select".
 */
function mapFieldType(
  fieldDef: ActivityInputFieldDefinition,
  fieldName: string
): FormFieldTypeType {
  // Enum constraint overrides to select
  if (fieldDef.Constraint?.Enum && fieldDef.Constraint.Enum.length > 0) {
    return "select";
  }

  switch (fieldDef.Type) {
    case "String":
      if (fieldName.toLowerCase().includes("email")) return "email";
      if (fieldName.toLowerCase().includes("password")) return "password";
      return "text";
    case "Number":
      return "number";
    case "Boolean":
      return "checkbox";
    case "Date":
      return "date";
    case "DateTime":
      return "datetime-local";
    case "Reference":
      return "reference";
    default:
      return "text";
  }
}

// ============================================================
// LABEL GENERATION
// ============================================================

/**
 * Generate a display label from field ID (camelCase/PascalCase → Title Case)
 */
function generateLabel(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/_/g, " ")
    .trim();
}

// ============================================================
// DEFAULT VALUE
// ============================================================

/**
 * Get type-appropriate default value for a field
 */
function getDefaultValue(fieldDef: ActivityInputFieldDefinition): any {
  switch (fieldDef.Type) {
    case "Boolean":
      return false;
    case "Number":
      return 0;
    case "String":
      return "";
    default:
      return undefined;
  }
}

// ============================================================
// VALIDATION RULES
// ============================================================

/**
 * Build react-hook-form validation rules from Constraint
 */
function buildValidationRules(
  _fieldName: string,
  fieldDef: ActivityInputFieldDefinition,
  label: string
): any {
  const validation: any = {};

  const constraint = fieldDef.Constraint;

  // Required
  if (constraint?.Required) {
    validation.required = {
      value: true,
      message: `${label} is required`,
    };
  }

  // Max length (String fields)
  if (constraint?.Length) {
    validation.maxLength = {
      value: constraint.Length,
      message: `${label} must be at most ${constraint.Length} characters`,
    };
  }

  // Enum validation (for select fields, validate value is in the allowed list)
  if (constraint?.Enum && constraint.Enum.length > 0) {
    const allowed = constraint.Enum;
    validation.validate = {
      enumCheck: (value: any) =>
        value === "" ||
        value === undefined ||
        value === null ||
        allowed.includes(value) ||
        `${label} must be one of: ${allowed.join(", ")}`,
    };
  }

  // Type-specific
  switch (fieldDef.Type) {
    case "Number":
      validation.valueAsNumber = true;
      break;
    case "Date":
    case "DateTime":
      validation.valueAsDate = true;
      break;
  }

  // Computed fields are disabled (read-only)
  if (fieldDef.Formula) {
    validation.disabled = true;
  }

  return validation;
}

// ============================================================
// ENUM → OPTIONS
// ============================================================

/**
 * Convert Constraint.Enum to SelectOptionType[]
 */
function buildOptions(
  fieldDef: ActivityInputFieldDefinition
): SelectOptionType[] | undefined {
  if (!fieldDef.Constraint?.Enum || fieldDef.Constraint.Enum.length === 0) {
    return undefined;
  }

  return fieldDef.Constraint.Enum.map((val) => ({
    value: val,
    label: val,
  }));
}

// ============================================================
// MAIN PARSER
// ============================================================

/**
 * Parse Activity Input field definitions into a Record of ActivityFieldConfig.
 *
 * @param fields - Map of field ID → ActivityInputFieldDefinition
 * @returns Record<string, ActivityFieldConfig>
 */
export function parseActivityFields(
  fields: ActivityInputFields
): Record<string, ActivityFieldConfig> {
  const configs: Record<string, ActivityFieldConfig> = {};

  for (const [fieldId, fieldDef] of Object.entries(fields)) {
    const label = fieldDef.Name || generateLabel(fieldId);
    const isComputed = !!fieldDef.Formula;
    const isRequired = fieldDef.Constraint?.Required ?? false;

    configs[fieldId] = {
      name: fieldId,
      type: mapFieldType(fieldDef, fieldId),
      label,
      required: isRequired,
      computed: isComputed,
      defaultValue: getDefaultValue(fieldDef),
      options: buildOptions(fieldDef),
      validation: buildValidationRules(fieldId, fieldDef, label),
      maxLength: fieldDef.Constraint?.Length,
      _raw: fieldDef,
    };
  }

  return configs;
}
