// ============================================================
// SCHEMA PARSER
// ============================================================
// Converts backend field schemas to react-hook-form validation rules

import type {
  BackendSchema,
  BackendFieldDefinition,
  ProcessedField,
  ProcessedSchema,
  ValidationRule
} from './types';
import { validateField, calculateDefaultValue, calculateComputedValue } from './expressionValidator';

// ============================================================
// FIELD TYPE MAPPING
// ============================================================

/**
 * Map backend field types to HTML input types
 */
function mapFieldType(backendType: string, fieldName: string): string {
  switch (backendType) {
    case 'String':
      // Infer specific string types from field name
      if (fieldName.toLowerCase().includes('email')) {
        return 'email';
      }
      if (fieldName.toLowerCase().includes('password')) {
        return 'password';
      }
      return 'text';
    
    case 'Number':
      return 'number';
    
    case 'Boolean':
      return 'checkbox';
    
    case 'Date':
      return 'date';
    
    case 'DateTime':
      return 'datetime-local';
    
    case 'Reference':
      return 'reference';
    
    case 'Array':
    case 'Object':
      return 'textarea'; // JSON string representation
    
    default:
      return 'text';
  }
}

/**
 * Generate field label from field name
 */
function generateLabel(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .replace(/_/g, ' ') // Replace underscores with spaces
    .trim();
}

// ============================================================
// VALIDATION RULE CONVERSION
// ============================================================

/**
 * Convert backend validation rules to react-hook-form validation
 */
function convertValidationRules(
  fieldName: string,
  fieldDef: BackendFieldDefinition,
  _allFields: Record<string, BackendFieldDefinition>
): any {
  const validation: any = {};

  // Required validation
  if (fieldDef.Required) {
    validation.required = {
      value: true,
      message: `${generateLabel(fieldName)} is required`
    };
  }

  // Type-specific validation
  switch (fieldDef.Type) {
    case 'Number':
      validation.valueAsNumber = true;
      break;
    
    case 'Date':
    case 'DateTime':
      validation.valueAsDate = true;
      break;
  }

  // Custom validation using expression trees
  if (fieldDef.Validation && fieldDef.Validation.length > 0) {
    validation.validate = (value: any, formValues: Record<string, any>) => {
      const result = validateField(
        fieldName,
        value,
        fieldDef.Validation!,
        formValues
      );
      
      return result.isValid || result.message || 'Invalid value';
    };
  }

  return validation;
}

// ============================================================
// SELECT OPTIONS PROCESSING
// ============================================================

/**
 * Process field options for select/reference fields
 */
function processFieldOptions(fieldDef: BackendFieldDefinition): Array<{value: any; label: string}> {
  if (!fieldDef.Values) {
    return [];
  }

  // Static options
  if (fieldDef.Values.Mode === 'Static' && fieldDef.Values.Items) {
    return fieldDef.Values.Items.map((item: any) => ({
      value: item.Value,
      label: item.Label
    }));
  }

  // Dynamic options (reference field)
  if (fieldDef.Values.Mode === 'Dynamic' && fieldDef.Values.Reference) {
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
  fieldDef: BackendFieldDefinition,
  formValues: Record<string, any> = {}
): any {
  if (!fieldDef.DefaultValue) {
    // Type-specific defaults
    switch (fieldDef.Type) {
      case 'Boolean':
        return false;
      case 'Number':
        return 0;
      case 'String':
        return '';
      case 'Array':
        return [];
      case 'Object':
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
  fieldDef: BackendFieldDefinition,
  allFields: Record<string, BackendFieldDefinition>,
  formValues: Record<string, any> = {}
): ProcessedField {
  return {
    name: fieldName,
    type: mapFieldType(fieldDef.Type, fieldName) as any,
    label: generateLabel(fieldName),
    required: fieldDef.Required || false,
    computed: fieldDef.Computed || false,
    defaultValue: processDefaultValue(fieldDef, formValues),
    options: processFieldOptions(fieldDef),
    validation: convertValidationRules(fieldName, fieldDef, allFields),
    description: fieldDef.Description,
    backendField: fieldDef
  };
}

// ============================================================
// SCHEMA PROCESSING
// ============================================================

/**
 * Process complete backend schema
 */
export function processSchema(
  backendSchema: BackendSchema,
  formValues: Record<string, any> = {}
): ProcessedSchema {
  const fields: Record<string, ProcessedField> = {};
  const fieldOrder: string[] = [];
  const computedFields: string[] = [];
  const requiredFields: string[] = [];
  const crossFieldValidation: ValidationRule[] = [];

  // Process each field
  for (const [fieldName, fieldDef] of Object.entries(backendSchema)) {
    // Skip system fields that shouldn't be in forms
    if (fieldName.startsWith('_') && !['_id'].includes(fieldName)) {
      continue;
    }

    const processedField = processField(fieldName, fieldDef, backendSchema, formValues);
    
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
    crossFieldValidation
  };
}

// ============================================================
// COMPUTED FIELD UPDATES
// ============================================================

/**
 * Update computed field values based on current form values
 */
export function updateComputedFields(
  processedSchema: ProcessedSchema,
  currentValues: Record<string, any>
): Record<string, any> {
  const computedValues: Record<string, any> = {};

  for (const fieldName of processedSchema.computedFields) {
    const field = processedSchema.fields[fieldName];
    const backendField = field.backendField;

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
    if (!node || typeof node !== 'object') {
      return;
    }

    if (node.Type === 'Identifier' && node.Name) {
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
export function buildDependencyMap(processedSchema: ProcessedSchema): Record<string, string[]> {
  const dependencyMap: Record<string, string[]> = {};

  for (const [fieldName, field] of Object.entries(processedSchema.fields)) {
    const dependencies: Set<string> = new Set();

    // Check formula dependencies
    if (field.backendField.Formula) {
      const formulaDeps = extractFieldDependencies(field.backendField.Formula.ExpressionTree);
      formulaDeps.forEach(dep => dependencies.add(dep));
    }

    // Check validation dependencies
    if (field.backendField.Validation) {
      for (const rule of field.backendField.Validation) {
        const validationDeps = extractFieldDependencies(rule.Condition.ExpressionTree);
        validationDeps.forEach(dep => dependencies.add(dep));
      }
    }

    // Check default value dependencies
    if (field.backendField.DefaultValue) {
      const defaultDeps = extractFieldDependencies(field.backendField.DefaultValue.ExpressionTree);
      defaultDeps.forEach(dep => dependencies.add(dep));
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
export function validateSchema(processedSchema: ProcessedSchema): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for required fields
  if (processedSchema.fieldOrder.length === 0) {
    errors.push('Schema contains no fields');
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
    errors
  };
}

// ============================================================
// REFERENCE FIELD PROCESSING
// ============================================================

/**
 * Build reference field configuration for API calls
 */
export function buildReferenceFieldConfig(field: ProcessedField): any {
  if (field.type !== 'reference' || !field.backendField.Values?.Reference) {
    return null;
  }

  const ref = field.backendField.Values.Reference;
  
  return {
    businessObject: ref.BusinessObject,
    fields: ref.Fields || ['_id'], // Default to ID field
    filters: ref.Filters,
    sort: ref.Sort
  };
}

/**
 * Extract all reference field configurations from schema
 */
export function extractReferenceFields(processedSchema: ProcessedSchema): Record<string, any> {
  const referenceFields: Record<string, any> = {};

  for (const [fieldName, field] of Object.entries(processedSchema.fields)) {
    if (field.type === 'reference') {
      const config = buildReferenceFieldConfig(field);
      if (config) {
        referenceFields[fieldName] = config;
      }
    }
  }

  return referenceFields;
}