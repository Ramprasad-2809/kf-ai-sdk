// ============================================================
// SCHEMA PARSER
// ============================================================
// Converts backend field schemas to react-hook-form validation rules

import type {
  BDOSchema,
  BDOFieldDefinition,
  FormFieldConfig,
  FormSchemaConfig,
  SchemaValidationRule,
  FieldPermission,
} from "./types";
import {
  calculateDefaultValue,
  calculateComputedValue,
} from "./expressionValidator.utils";
import {
  classifyRules,
  createFieldRuleMapping,
  calculateFieldPermissions,
  normalizeBDOSchema,
} from "./ruleClassifier.utils";

// ============================================================
// FIELD TYPE MAPPING
// ============================================================

/**
 * Map backend field types to HTML input types
 */
function mapFieldType(backendType: string, fieldName: string): string {
  switch (backendType) {
    case "String":
      // Infer specific string types from field name
      if (fieldName.toLowerCase().includes("email")) {
        return "email";
      }
      if (fieldName.toLowerCase().includes("password")) {
        return "password";
      }
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

    case "Array":
    case "Object":
      return "textarea"; // JSON string representation

    default:
      return "text";
  }
}

/**
 * Generate field label from field name
 */
function generateLabel(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .replace(/_/g, " ") // Replace underscores with spaces
    .trim();
}

// ============================================================
// VALIDATION RULE CONVERSION
// ============================================================

/**
 * Convert backend validation rules to react-hook-form validation
 */
function convertSchemaValidationRules(
  fieldName: string,
  fieldDef: BDOFieldDefinition,
  _allFields: Record<string, BDOFieldDefinition>
): any {
  const validation: any = {};

  // Required validation
  if (fieldDef.Required) {
    validation.required = {
      value: true,
      message: `${generateLabel(fieldName)} is required`,
    };
  }

  // Type-specific validation
  switch (fieldDef.Type) {
    case "Number":
      validation.valueAsNumber = true;
      break;

    case "Date":
    case "DateTime":
      validation.valueAsDate = true;
      break;
  }

  // Custom validation using expression trees
  // Note: fieldDef.Validation contains rule IDs (string[]), not SchemaValidationRule[]
  // Validation is handled by the form hook which has access to the full schema rules
  if (fieldDef.Validation && fieldDef.Validation.length > 0) {
    // Validation rules will be applied by the form hook
    // This is just a placeholder to mark that validation exists
    validation.validate = () => true;
  }

  return validation;
}

// ============================================================
// SELECT OPTIONS PROCESSING
// ============================================================

/**
 * Process field options for select/reference fields
 */
function processFieldOptions(
  fieldDef: BDOFieldDefinition
): Array<{ value: any; label: string }> {
  if (!fieldDef.Values) {
    return [];
  }

  // Static options
  if (fieldDef.Values.Mode === "Static" && fieldDef.Values.Items) {
    return fieldDef.Values.Items.map((item: any) => ({
      value: item.Value,
      label: item.Label,
    }));
  }

  // Dynamic options (reference field)
  if (fieldDef.Values.Mode === "Dynamic" && fieldDef.Values.Reference) {
    // For now, return empty array - will be populated by form hook
    return [];
  }

  return [];
}

// ============================================================
// DEFAULT VALUE PROCESSING
// ============================================================

/**
 * Calculate default value for a field
 */
function processDefaultValue(
  fieldDef: BDOFieldDefinition,
  formValues: Record<string, any> = {}
): any {
  if (!fieldDef.DefaultValue) {
    // Type-specific defaults
    switch (fieldDef.Type) {
      case "Boolean":
        return false;
      case "Number":
        return 0;
      case "String":
        return "";
      case "Array":
        return [];
      case "Object":
        return {};
      default:
        return undefined;
    }
  }

  return calculateDefaultValue(
    fieldDef.DefaultValue.ExpressionTree,
    formValues
  );
}

// ============================================================
// FIELD PROCESSING
// ============================================================

/**
 * Process a single field definition
 */
function processField(
  fieldName: string,
  fieldDef: BDOFieldDefinition,
  allFields: Record<string, BDOFieldDefinition>,
  formValues: Record<string, any> = {},
  permission?: FieldPermission,
  rules?: {
    validation: string[];
    computation: string[];
    businessLogic: string[];
  }
): FormFieldConfig {
  const defaultPermission: FieldPermission = {
    editable: true,
    readable: true,
    hidden: false,
  };

  const defaultRules = {
    validation: [],
    computation: [],
    businessLogic: [],
  };

  const fieldRules = rules || defaultRules;
  const isComputed =
    fieldDef.Computed ||
    !!fieldDef.Formula ||
    fieldRules.computation.length > 0;

  const validation = convertSchemaValidationRules(fieldName, fieldDef, allFields);

  // Mark computed fields as disabled so they cannot be manually edited
  if (isComputed) {
    validation.disabled = true;
  }

  return {
    name: fieldName,
    type: mapFieldType(fieldDef.Type, fieldName) as any,
    label: fieldDef.Name || generateLabel(fieldName),
    required: fieldDef.Required || false,
    computed: isComputed,
    defaultValue: processDefaultValue(fieldDef, formValues),
    options: processFieldOptions(fieldDef),
    validation,
    description: fieldDef.Description,
    _bdoField: fieldDef,
    permission: permission || defaultPermission,
    rules: fieldRules,
  };
}

// ============================================================
// SCHEMA PROCESSING
// ============================================================

/**
 * Process complete BDO schema
 */
export function processSchema(
  schema: BDOSchema,
  formValues: Record<string, any> = {},
  userRole?: string
): FormSchemaConfig {
  // Ensure schema is in BDO format
  let bdoSchema = schema;

  // Normalize BDO schema to ensure inline validation rules are centralized
  bdoSchema = normalizeBDOSchema(bdoSchema);

  const fields: Record<string, FormFieldConfig> = {};
  const fieldOrder: string[] = [];
  const computedFields: string[] = [];
  const requiredFields: string[] = [];
  const crossFieldValidation: SchemaValidationRule[] = [];

  // Classify rules by type
  const classifiedRules = classifyRules(bdoSchema);

  // Create field-to-rule mapping
  const fieldRules = createFieldRuleMapping(bdoSchema, classifiedRules);

  // Calculate field permissions
  const fieldPermissions = calculateFieldPermissions(bdoSchema, userRole);

  // Process each field
  for (const [fieldName, fieldDef] of Object.entries(bdoSchema.Fields)) {
    // Skip system fields that shouldn't be in forms
    if (fieldName.startsWith("_") && !["_id"].includes(fieldName)) {
      continue;
    }

    // Skip hidden fields
    const permission = fieldPermissions[fieldName];
    if (permission.hidden) {
      continue;
    }

    const processedField = processField(
      fieldName,
      fieldDef,
      bdoSchema.Fields,
      formValues,
      permission,
      fieldRules[fieldName] || {
        validation: [],
        computation: [],
        businessLogic: [],
      }
    );

    fields[fieldName] = processedField;
    fieldOrder.push(fieldName);

    if (processedField.computed) {
      computedFields.push(fieldName);
    }

    if (processedField.required) {
      requiredFields.push(fieldName);
    }
  }

  return {
    fields,
    fieldOrder,
    computedFields,
    requiredFields,
    crossFieldValidation,
    rules: classifiedRules,
    fieldRules,
    rolePermissions: bdoSchema.RolePermission,
  };
}

// ============================================================
// COMPUTED FIELD UPDATES
// ============================================================

/**
 * Update computed field values based on current form values
 */
export function updateComputedFields(
  processedSchema: FormSchemaConfig,
  currentValues: Record<string, any>
): Record<string, any> {
  const computedValues: Record<string, any> = {};

  for (const fieldName of processedSchema.computedFields) {
    const field = processedSchema.fields[fieldName];
    const backendField = field._bdoField;

    if (backendField.Formula) {
      try {
        const computedValue = calculateComputedValue(
          backendField.Formula.ExpressionTree,
          currentValues
        );

        computedValues[fieldName] = computedValue;
      } catch (error) {
        console.warn(`Failed to compute value for ${fieldName}:`, error);
      }
    }
  }

  return computedValues;
}

// ============================================================
// FIELD DEPENDENCIES
// ============================================================

/**
 * Extract field dependencies from expression trees
 */
function extractFieldDependencies(expressionTree: any): string[] {
  const dependencies: Set<string> = new Set();

  function traverse(node: any): void {
    if (!node || typeof node !== "object") {
      return;
    }

    if (node.Type === "Identifier" && node.Name) {
      dependencies.add(node.Name);
    }

    if (node.Arguments && Array.isArray(node.Arguments)) {
      node.Arguments.forEach(traverse);
    }

    if (node.Property) {
      traverse(node.Property);
    }
  }

  traverse(expressionTree);
  return Array.from(dependencies);
}

/**
 * Build field dependency map
 */
export function buildDependencyMap(
  processedSchema: FormSchemaConfig
): Record<string, string[]> {
  const dependencyMap: Record<string, string[]> = {};

  for (const [fieldName, field] of Object.entries(processedSchema.fields)) {
    const dependencies: Set<string> = new Set();

    // Check formula dependencies
    if (field._bdoField.Formula) {
      const formulaDeps = extractFieldDependencies(
        field._bdoField.Formula.ExpressionTree
      );
      formulaDeps.forEach((dep) => dependencies.add(dep));
    }

    // Check validation dependencies
    // Note: field._bdoField.Validation contains rule IDs (string[])
    // To extract validation dependencies, we would need access to the full schema rules
    // This is skipped for now as validation dependencies are tracked separately
    if (field._bdoField.Validation) {
      // Validation rule dependencies would be extracted here if we had access to the rules
    }

    // Check default value dependencies
    if (field._bdoField.DefaultValue) {
      const defaultDeps = extractFieldDependencies(
        field._bdoField.DefaultValue.ExpressionTree
      );
      defaultDeps.forEach((dep) => dependencies.add(dep));
    }

    dependencyMap[fieldName] = Array.from(dependencies);
  }

  return dependencyMap;
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Validate processed schema
 */
export function validateSchema(processedSchema: FormSchemaConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for required fields
  if (processedSchema.fieldOrder.length === 0) {
    errors.push("Schema contains no fields");
  }

  // Check for circular dependencies in computed fields
  const dependencyMap = buildDependencyMap(processedSchema);

  for (const [fieldName, dependencies] of Object.entries(dependencyMap)) {
    if (dependencies.includes(fieldName)) {
      errors.push(`Field ${fieldName} has circular dependency`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================
// REFERENCE FIELD PROCESSING
// ============================================================

/**
 * Build reference field configuration for API calls
 */
export function buildReferenceFieldConfig(field: FormFieldConfig): any {
  if (field.type !== "reference" || !field._bdoField.Values?.Reference) {
    return null;
  }

  const ref = field._bdoField.Values.Reference;

  return {
    businessObject: ref.BusinessObject,
    fields: ref.Fields || ["_id"], // Default to ID field
    filters: ref.Filters,
    sort: ref.Sort,
  };
}

/**
 * Extract all reference field configurations from schema
 */
export function extractReferenceFields(
  processedSchema: FormSchemaConfig
): Record<string, any> {
  const referenceFields: Record<string, any> = {};

  for (const [fieldName, field] of Object.entries(processedSchema.fields)) {
    if (field.type === "reference") {
      const config = buildReferenceFieldConfig(field);
      if (config) {
        referenceFields[fieldName] = config;
      }
    }
  }

  return referenceFields;
}
